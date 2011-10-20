// #ifdef __WITH_UIRECORDER
apf.uirecorder.capture = {
    $curTestFile    : "",   // path of file that is being captured
    $curTestId      : "",   // name of test

    $startTime      : 0,    // time capturing is started
    $actionList     : [],
    $detailList     : {},
    $capturedEvents : {},
    $capturedProperties : {},
    
    $keyActionIdx   : 0,    // value given to keyActions
    $keyActions     : [],   // list of keyactions
    $prevAction     : null,
    $prevMouseDownAction     : null,
    $mousedownMode  : false,
    outputXml       : null, // output generated after capturing
    
    $validKeys      : [ 37, 38, 39, 40,  //arrowkeys
                        27,             // Esc
                        16, 17, 18,     // Shift, Ctrl, Alt
                        13,             // Enter
                        8, 46, 36, 35,  // Backspace, Del, Home, End
                        9               // Tab
                      ],
    
    // start capturing
    record : function(file, testId, captureDetails) {
        // reset action- and detailList
        this.$actionList       = [];
        this.$detailList       = {};
        apf.uirecorder.captureDetails   = true;

        this.$curTestFile       = file;
        this.$curTestId         = testId;
        this.$startTime         = new Date().getTime();
        this.$keyActionIdx      = 0;
        this.$keyActions        = [];
        this.outputXml          = null;

        apf.uirecorder.isRecording      = true;

        // start capturing
        apf.uirecorder.capture.$init();
    },
    
    // stop capturing, save recorded data in this.outputXml
    stop : function() {
        apf.uirecorder.$inited      = false;
        apf.uirecorder.isRecording  = false;
        this.$saveTest();
    },
    
    canCapture : function(){
        return !(apf.uirecorder.isPaused 
          || !(apf.uirecorder.isPlaying 
          || apf.uirecorder.isRecording 
          || apf.uirecorder.isTesting));
    },
    
    /**
     * init capturing of user interaction
     */
    $init : function() {
        if (apf.uirecorder.$inited) return;
        apf.uirecorder.$inited = true;

        var _self = this;

        // listeners for user mouse interaction
        document.documentElement.ondblclick = 
        apf.uirecorder.capture.dblclick     = function(e) {
            if (!_self.canCapture()) 
                return;
            apf.uirecorder.capture.$captureAction("dblclick", e || event);
        }

        document.documentElement.onmousedown = 
        apf.uirecorder.capture.mousedown     = function(e) {
            if (!_self.canCapture()) 
                return;
            apf.uirecorder.capture.$captureAction("mousedown", e || event);
        };

        document.documentElement.onmouseup = 
        apf.uirecorder.capture.mouseup     = function(e) {
            if (!_self.canCapture()) 
                return;
            apf.uirecorder.capture.$captureAction("mouseup", e || event);
        }
        
        document.documentElement.onmousemove = 
        apf.uirecorder.capture.mousemove     = function(e) {
            if (!_self.canCapture()) 
                return;
            apf.uirecorder.capture.$captureAction("mousemove", e || event);
        }
        
        // Support for Mouse Scroll event
        if(document.addEventListener) {
            /* FF */
            document.addEventListener("DOMMouseScroll", function(e) {
                if (!_self.canCapture()) 
                    return;
                
                e = e || event;

                var delta = null;
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                    if (apf.isOpera)
                        delta *= -1;
                }
                else if (e.detail)
                    delta = -e.detail / 3;
                
                apf.uirecorder.capture.$captureAction("mousescroll", e, delta);
            }, false);
        }
        else {
            /* IE */
            document.onmousewheel             = 
            apf.uirecorder.capture.mousewheel = function(e) {
                if (!_self.canCapture()) return;
                e = e || event;

                var delta = null;
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                    if (apf.isOpera)
                        delta *= -1;
                }
                else if (e.detail)
                    delta = -e.detail / 3;
                    
                apf.uirecorder.capture.$captureAction("mousescroll", e, delta);
            };
        }
        
        // listeners for keyboard interaction
        document.documentElement.onkeyup = 
        apf.uirecorder.capture.keyup     = function(e) {
            if (!_self.canCapture()) return;
            e = e || event;

            var keycode = (e.keyCode) ? e.keyCode : e.which;
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;

            apf.uirecorder.capture.$captureAction("keyup", e, keycode);
        }
        
        document.documentElement.onkeydown = 
        apf.uirecorder.capture.keydown     = function(e) {
            if (!_self.canCapture()) return;
            e = e || event;

            var keycode = (e.keyCode) ? e.keyCode : e.which;
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;
            
            apf.uirecorder.capture.$captureAction("keydown", e, keycode);
        }
        
        document.documentElement.onkeypress = 
        apf.uirecorder.capture.keypress     = function(e) {
            if (!_self.canCapture()) return;
            e = e || event;

            //if (apf.uirecorder.capture.$validKeys.indexOf(e.keyCode) > -1) return;
            var character = "";
            if (e.keyCode) { // Internet Explorer
                character = String.fromCharCode(e.keyCode);
            } 
            else if (e.which) { // W3C
                character = String.fromCharCode(e.which);
            }
            else {
                character = e.keyCode
            }
            
            // ignore when no character is outputted, 
            // like the Enter key, except for space character
            if (character.trim() == "" && character != " ") return;

//            if (e.shiftKey) character = "[SHIFT]" + character;
//            if (e.altKey)   character = "[ALT]" + character;
//            if (e.ctrlKey)  character = "[CTRL]" + character;
            apf.uirecorder.capture.$captureAction("keypress", e, character);
        }
        
        // @todo fix problem with onkeyup in apf
    },

    /**
     * get all neccessary information about amlNode
     */
    $getAmlNodeData : function(amlNode, htmlElement, eventName, value) {
        if (amlNode.tagName == "html" || amlNode.tagName == "body") return;
        var data = {};

        // action on item of multiselect
        if (amlNode.localName == "item" 
          && amlNode.parentNode.hasFeature(apf.__MULTISELECT__)) {
            amlNode = amlNode.parentNode;
        }
        
        if (amlNode.id)         data.id = amlNode.id;
        if (amlNode.caption && amlNode.caption.charAt(0) != "[")
            data.caption = amlNode.caption;

        data.tagName    = amlNode.tagName;
        data.type       = amlNode.localName;
        var xpath       = apf.xmlToXpath(amlNode)
        data.xpath      = xpath.substr(xpath.indexOf("/") + 1);
        
        if (amlNode.getValue 
          && ["text","textarea","textbox"].indexOf(amlNode.localName) == -1) {
            data.value = amlNode.getValue();
        }
        else if (eventName == "keypress") 
            data.value = value;
            
        if (amlNode.label) data.label = amlNode.label;
        
        var pos = apf.getAbsolutePosition(amlNode.$ext, document.body);
        data.x          = pos[0];
        data.y          = pos[1];
        data.width      = amlNode.$ext.offsetWidth;
        data.height     = amlNode.$ext.offsetHeight;

        // multiselect amlNode
        if (amlNode.hasFeature(apf.__MULTISELECT__)) {
            if (amlNode.localName == "dropdown" && !amlNode.isOpen) {
                data.popup = apf.popup.last;
            }
            if (amlNode.selected) {
                data.multiselect = "true";
                
                data.selected = {};
                if (amlNode.getValue)
                    data.selected.value = amlNode.getValue();
                var xpath = apf.xmlToXpath(amlNode.selected);
                data.selected.xpath     = xpath.substr(xpath.indexOf("/")+1);
                
                if (amlNode.$selected) {
                    pos = apf.getAbsolutePosition(amlNode.$selected, document.body);
                    data.selected.x         = pos[0];
                    data.selected.y         = pos[1];
                    data.selected.width     = amlNode.$selected.offsetWidth;
                    data.selected.height    = amlNode.$selected.offsetHeight;
                }                    
                
                if (eventName == "mouseup" && this.$prevMouseDownAction) {
                    this.$prevMouseDownAction.amlNode = data;
                }
            }
        }
        // mouseup after selecting dropdown item, set dropdown as amlNode, 
        // dropdown popup not visible after mousedown and mouseup
        else if (eventName == "mouseup" 
          && this.$prevMouseDownAction 
          && this.$prevMouseDownAction.amlNode 
          && this.$prevMouseDownAction.amlNode.type == "dropdown") {
            // copy amlNode from mousedown
            data = this.$prevMouseDownAction.amlNode;
        }
        // amlNode with activeElements htmlNodes
        else if (amlNode.$getActiveElements) {
            var activeElements = amlNode.$getActiveElements();
            for (var name in activeElements) {
                if (apf.isChildOf(activeElements[name], htmlElement, true)) {
                    data.activeElement = {};
                    htmlNode = activeElements[name];

                    pos = apf.getAbsolutePosition(htmlNode, document.body);
                    data.activeElement.name     = name
                    data.activeElement.x        = pos[0];
                    data.activeElement.y        = pos[1];
                    data.activeElement.width    = htmlNode.offsetWidth;
                    data.activeElement.height   = htmlNode.offsetHeight;
                    break;
                }
            }
        }

        // @todo parent info needed?
        return data;
    },
    
    // get all neccessary information about htmlElement
    // @todo set info based on type of element
    $getHtmlElementData : function(htmlElement) {
        // ignore body/html tags
        if (["body", "html"].indexOf(htmlElement.tagName.toLowerCase()) > -1) 
            return;
        
        var data = {};
        if (htmlElement.id) data.id                 = htmlElement.id;
        if (htmlElement.tagName.toLowerCase() == "a" && htmlElement.innerHTML) 
            data.innerHTML   = htmlElement.innerHTML;

        data.tagName    = htmlElement.tagName;
        data.type       = (data.tagName.toLowerCase() == "a") 
                            ? "link" 
                            : data.tagName;

        var pos = apf.getAbsolutePosition(htmlElement, document.body);
        data.x          = pos[0];
        data.y          = pos[1];
        data.width      = htmlElement.offsetWidth;
        data.height     = htmlElement.offsetHeight;

        if (apf.popup.last 
          && apf.isChildOf(apf.popup.cache[apf.popup.last].content, htmlElement, true))
            data.popup = true;
            
        return data;
    },
    
    $captureAction : function(eventName, e, value) {
        //if (!apf.uirecorder.$inited) return;
        // prevent double mousedown action capture one after another
        if (eventName == "mousedown" 
          && this.$prevAction 
          && this.$prevAction.name == "mousedown") {
            return;
        }
//        if (eventName == "keydown" && this.$prevAction && this.$prevAction.name == "keydown") return;
//        if (eventName == "keyup" && this.$prevAction && this.$prevAction.name == "keyup") return;

        var amlNodeData, htmlElementData;
        var htmlElement = (e) ? e.srcElement || e.target : null;
        var amlNode     = (htmlElement && apf.findHost(htmlElement) 
          && apf.findHost(htmlElement).tagName) ? apf.findHost(htmlElement) : null;

//        if (eventName != "mousemove") { //this.$mousedownMode
            if (amlNode && amlNode.prefix == "a") {
                amlNodeData = 
                    this.$getAmlNodeData(amlNode, htmlElement, eventName, value);
            }
            else if (htmlElement && htmlElement.tagName) {
                htmlElementData = this.$getHtmlElementData(htmlElement);
            }
//        }

        // elapsed time since start of recording/playback
        var time = 
            parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);

        // set action object
        var actionObj = {
            time        : time,
            name        : eventName,
            detailList  : []
        }

        if (amlNodeData)
            actionObj.amlNode = amlNodeData;
        if (htmlElementData)
            actionObj.htmlElement = htmlElementData;
        if (e && e.clientX != undefined)
            actionObj.x = parseInt(e.clientX);
        if (e && e.clientX != undefined)
            actionObj.y = parseInt(e.clientY);
        if (e && (e.button || e.which))
            actionObj.button = e.button || e.which;

        if (value)
            actionObj.value = value;

        if (this.$keyActions.length) {
            var keyAction;
            
            // save reference to captured events
            for (var evtName in this.$capturedEvents) {
                keyAction = this.$keyActions[this.$keyActions.length-1];
                keyAction.events = this.$capturedEvents;
                
                if (keyAction.events["dragdrop"]) {
                    keyAction.dropTarget = 
                        this.$getAmlNodeData(keyAction.events.dragdrop.dropTarget);
                    keyAction.amlNode    = 
                        this.$getAmlNodeData(keyAction.events.dragdrop.amlNode);
                }
                    
                this.$capturedEvents = {};
                break;
            }
            // save reference to captured property changes
            for (var evtName in this.$capturedProperties) {
                this.$keyActions[this.$keyActions.length-1].properties =
                    this.$capturedProperties;
                this.$capturedProperties = {};
                break;
            }
        }
            
        /*
        if (this.$actionList.length == 0) {
            actionObj.name = "init";
            actionObj.detailList[0] = this.$detailList;
            this.$detailList = {};
            this.$actionList.push(actionObj);
            return;
        }
        */
        
        /*
        if (this.$prevAction) {
            if (eventName == "mouseup" && this.$prevAction.name == "mousemove" && this.$actionList[this.$actionList.length-2] && this.$actionList[this.$actionList.length-2].name == "mousedown") {
                if (this.$keyActions[this.$keyActions.length-1] == this.$prevAction) {
                    if (this.$prevAction.keyActionIdx)
                        this.$keyActionIdx--;
                    this.$keyActions.pop();
                }
                else {
                    debugger;
                }
            }
            else if (this.$prevAction.name == "mousedown")
                this.$mousedownMode = true;
            else if (this.$mousedownMode && this.$prevAction.name == "mouseup")
                this.$mousedownMode = false;

            if (this.$mousedownMode || ["mousemove", "mousescroll"].indexOf(eventName) == -1) {
                actionObj.keyActionIdx = this.$keyActionIdx;
                this.$keyActions.push(actionObj);
                this.$keyActionIdx++;
            }
        }
        */
        if (this.$prevAction) {
            if (this.$prevAction.name == "mousedown")
                this.$mousedownMode = true;
            else if (this.$mousedownMode && this.$prevAction.name == "mouseup")
                this.$mousedownMode = false;
        }
        
        if (["mousemove", "mousescroll"].indexOf(eventName) == -1) { //
            actionObj.keyActionIdx = this.$keyActionIdx;
            this.$keyActions.push(actionObj);
            this.$keyActionIdx++;
        }
        
        // save details if action is keyAction
/*
TEMPORARILY DISABLED
        if (actionObj.keyActionIdx != undefined && actionObj.name != "mousemove") {
            // check if expected keyAction is executed
            if (apf.uirecorder.isTesting && apf.uirecorder.playback.$keyActions[actionObj.keyActionIdx]) {
                var a;
                if ((a=apf.uirecorder.playback.$keyActions[actionObj.keyActionIdx].getAttribute("name")) != "dblClick") {
                    if (a != actionObj.name) {
                        apf.uirecorder.playback.$testError("Wrong action executed. Executed: " + actionObj.name + ". Expected: " + a);
                        return;
                    }
                }
                else if (actionObj.name != "dblClick") {
                    this.$keyActionIdx--;
                    return;
                }
                else if (!(this.$keyActions.length > 3 && this.$keyActions[this.$keyActions.length-2].name == "mouseup" && this.$keyActions[this.$keyActions.length-3].name == "mouseup" && this.$keyActions[this.$keyActions.length-4].name == "mousedown")) {
                    apf.uirecorder.playback.$testError("Wrong action executed. Executed: " + actionObj.name + ". Expected: " + a);
                    return;
                }
            }

            for (var elName in this.$detailList) {
                actionObj.detailList[0] = this.$detailList;
                this.$detailList = {};
                break;
            }
        }        
*/        
        // save action object
        actionObj.actionIdx = this.$actionList.length;
        this.$actionList.push(actionObj);
        this.$prevAction = actionObj;
        
        if (eventName == "mousedown") 
            this.$prevMouseDownAction = actionObj;
        
        // @todo neccesary?? or already tested in execAction
        //this.checkAction();
        
        if (actionObj.keyActionIdx != undefined && apf.uirecorder.isTesting) {
            this.checkDetails(actionObj, 0);
        }

// delayedDetails
        if (actionObj.keyActionIdx != undefined) {
            //For new timeouts associated with the next action.
            var currentState = apf.uirecorder.capture.current = {};

            //For all the running timeouts
            apf.uirecorder.capture.current.actionObj = actionObj;

            // delayed capturing of events
            var recursion = false;
            $setTimeout = function(f, ms){
                if (!apf.uirecorder.$inited)
                    return;
                
                //Record current mouseEvent
                if (!ms) ms = null;
                return apf.uirecorder.setTimeout.call(window, function(){
                    apf.uirecorder.capture.$runInContext(currentState, f);
                }, ms);
            }
        }
    },
    
    $runInContext : function(state, f){
        //Put everything until now on the current action
        this.$setDelayedDetails(this.current);
       
        //Set the new stuff on the past action
        if (typeof f == "string")
            apf.jsexec(f)
        else
            f();

        this.$setDelayedDetails(state);
    },
    
    $setDelayedDetails : function(state) {
        for (var elName in this.$detailList) {
            state.actionObj.detailList.push(this.$detailList);
            this.$detailList = {};
            break;
        }
        
        if (apf.uirecorder.isTesting)
            this.checkDetails(state.actionObj, state.actionObj.detailList.length-1);
    },
    
    /**
     * checks on action like correct target
     */
    checkAction : function() {
        
    },
    
    /**
     * check details after action
     */
    checkDetails : function(actionObj, checkIdx) {
        var checkList = apf.uirecorder.playback.checkList[actionObj.keyActionIdx];
        if (!checkList) return;

        // loop through checkList, after loop all checks should be passed
        // the ones that didn't pass should raise warnings/errors
        if (checkList.details && checkList.details[checkIdx]) {
            // elements
            for (var elName in checkList.details[checkIdx]) {

                // detailType (events/properties/data)
                var details = checkList.details[checkIdx][elName];
                for (var dType in details) {
                    // detail
                    var l = details[dType].length;
                    for (var waitFor = false, d, i = 0; i < l; i++) {
                        waitFor = (check1 = details[dType][i]).waitFor;

/*
TEMPORARILY DISABLED
                        if (!waitFor && !(actionObj.detailList && actionObj.detailList[checkIdx] && actionObj.detailList[checkIdx][elName] && actionObj.detailList[checkIdx][elName][dType])) {
                            if (apf.uirecorder.playback.$warningList.indexOf("No " + dType + " set on element " + elName + ". Expected " + details[dType][i].type + " " + details[dType][i].name + " to be set ") == -1)
                                apf.uirecorder.playback.$warningList.push("No " + dType + " set on element " + elName + ". Expected " + details[dType][i].type + " " + details[dType][i].name + " to be set ");
                            continue;
                        }
*/
                        if (actionObj.detailList 
                          && actionObj.detailList[checkIdx] 
                          && actionObj.detailList[checkIdx][elName] 
                          && actionObj.detailList[checkIdx][elName][dType] 
                          && actionObj.detailList[checkIdx][elName][dType].length) {
                            var detailList = actionObj.detailList[checkIdx][elName][dType];
                              
                            for (var found = false, j = 0, jl = detailList.length; j < jl; j++) {
                                // event, property or data is set during action on corrent element
                                if ((check1 = details[dType][i]).name 
                                  == (check2 = detailList[j]).name
                                ) {
                                    
                                    // event, property or data set but different value
                                    if (check1.value 
                                      && typeof check1.value == "string" 
                                      && check2.value 
                                      && typeof check2.value == "string" 
                                      && check1.value != check2.value) {
                                          
                                        var warning = "element " + elName 
                                          + " has different value. Before: \"" 
                                          + check1.value + "\". After: \"" 
                                          + check2.value;
                                        var warnList = apf.uirecorder.playback.$warningList;
                                        
                                        if (warnList.indexOf(warning) + "\""== -1)
                                            warnList.push(warning);
                                        
                                        //apf.dispatchEvent("testwarning", {msg: "element has different value"});
                                    }
                                    //else if (check1.value && check2.value && typeof check1.value != typeof check2.value) {
                                        //debugger;
                                    //}
                                    
                                    found = true;
                                    waitFor = false;
                                    break;
                                }
                            }
                        }
                        
                        if (waitFor) {
                            // event, property or data not set yet
                            // check for waitFor checks, event not set yet
                            apf.uirecorder.playback.$waitForList.push({
                                //actionObj   : actionObj,
                                actionIdx   : actionObj.actionIdx,
                                checkIdx    : checkIdx,
                                type        : check1.type,  // event
                                name        : check1.name,  // afterload
                                elName      : elName,
                                detailType  : dType
                            });
                        }
                        else if (!found) {
/*
TEMPORARILY DISABLED
                            if (apf.uirecorder.playback.$warningList.indexOf(check1.type + " " + check1.name + " not set on element " + elName) == -1) {
                                apf.uirecorder.playback.$warningList.push(check1.type + " " + check1.name + " not set on element " + elName);
                            }
*/
                        }
                    }
                    
                }
                
            }
        } 
    },
    
    $getTargetName : function(eventName, e, amlNode) {
        var amlNode = amlNode || e.amlNode || e.currentTarget;
            
        if (!amlNode) return;
        
        if ((amlNode.root && amlNode.isIE != undefined) 
          || ["html","head","body","script"].indexOf(amlNode.tagName) > -1) 
            return;
        
        if (eventName == "movefocus")
            amlNode = e.toElement;
        else if (eventName == "DOMNodeRemoved")
            amlNode = e.relatedNode;
            
        // get name of target
        var targetName;

        // aml element
        if (amlNode && amlNode.parentNode && amlNode.tagName 
          && !apf.xmlToXpath(amlNode,apf.document) != "html[1]") {
            targetName = (amlNode.id) 
                ? amlNode.id 
                : ((targetName = apf.xmlToXpath(amlNode,apf.document)).substr(0, 8) == "html[1]/"
                    ? targetName = targetName.substr(8)
                    : targetName);
            if (targetName.indexOf("/text()") > -1) {
                targetName = 
                    targetName.substr(0, targetName.length - "/text()[x]".length);    
            }
        }
        // html element
        else if (amlNode && e && e.htmlEvent) {
            // skip capturing event calls on html element, already captured on amlNodes
            if (["keydown", "hotkey"].indexOf(eventName) > -1) 
                return;
                
            var htmlElement = e.htmlEvent.target || e.htmlEvent.srcElement;
            if (htmlElement.tagName.toLowerCase() != "html") {
                var host = apf.findHost(htmlElement);
                if (host) {
                    do {
                        targetName = apf.xmlToXpath(htmlElement, host.$ext);
                        if (targetName.substr(0, 8) == "HTML[1]/")
                            host = host.parentNode;
                        else {
                            targetName = apf.xmlToXpath(host)
                                + "/" + targetName;
                            break;
                        }
                    } while (1);
                }
                
                if (targetName.substr(0, 8) == "html[1]/")
                    targetName = targetName.substr(8);
            }
        }
        // apf
        else if (amlNode && amlNode.console && amlNode.extend && amlNode.all) {
            targetName = "apf";
        }

        if (!targetName) {
            if (amlNode && amlNode.id)
                targetName = amlNode.id;
            else
                targetName = "trashbin";
        }
        
        return {
            name        : targetName, 
            amlNode     : amlNode
        };
    },
    
    validEvents : ["beforedrag", "afterdrag", "dragstart", "dragdrop", "beforestatechange", "afterstatechange"],
    captureEvent : function(eventName, e) {
        if (["DOMNodeRemovedFromDocument"].indexOf(eventName) > -1) 
            return;
        
        //if (!apf.uirecorder.$inited) return;
        //if (this.validEvents.indexOf(eventName) == -1) return;
        var target = this.$getTargetName(eventName, e);
        if (!target) 
            return;

        var eventObj = {
            name        : eventName,
            event       : e
        }
        
        // save events to detailList
        if (!this.$detailList[target.name]) {
            this.$detailList[target.name] = {
                caption     : target.name,
                amlNode     : target.amlNode,
                events      : [],
                properties  : [],
                data        : []
            };
        }
        
        this.$detailList[target.name].events.push(eventObj);
        
        var eventData = true;
        if (eventName == "dragdrop") {
            eventData = {
                dropTarget  : e.currentTarget,
                amlNode     : e.host
            }
        }
        
        if (this.validEvents.indexOf(eventName) > -1)
            this.$capturedEvents[eventName] = eventData;
    },
    capturePropertyChange : function(amlNode, prop, value, oldvalue) {
        //if (!apf.uirecorder.$inited) return;
        var target = this.$getTargetName(null, null, amlNode);
        if (!target) 
            return;

        var propObj = {
            name        : prop,
            value       : value,
            oldvalue    : oldvalue
        }
        
        // save properties to detailList
        if (!this.$detailList[target.name]) {
            this.$detailList[target.name] = {
                caption     : target.name,
                amlNode     : amlNode,
                events      : [],
                properties  : [],
                data        : []
            };
        }
        
        this.$detailList[target.name].properties.push(propObj);
        this.$capturedProperties[prop] = value;
    },
    
    captureModelChange : function(params) {
        //if (!apf.uirecorder.$inited) return;
        var target = (params.amlNode) 
            ? this.$getTargetName(null, null, params.amlNode) 
            : null;

        var dataObj = {
            name        : param.action
        }
        
        // value of data change
        if (params.amlNode) {
            if (!dataObj.value) 
                dataObj.value = {};
            dataObj.value.amlNode = apf.serialize(params.amlNode).split("<")
                                       .join("&lt;").split(">").join("&gt;");
        }
        if (params.xmlNode) {
            if (!dataObj.value) 
                dataObj.value = {};
            dataObj.value.xmlNode = apf.serialize(params.xmlNode).split("<")
                                       .join("&lt;").split(">").join("&gt;");
        }
        
        // save data to detailList
        if (!this.$detailList[target.name]) {
            this.$detailList[target.name] = {
                caption     : target.name,
                amlNode     : target.amlNode,
                events      : [],
                properties  : [],
                data        : []
            };
        }
        
        this.$detailList[target.name].data.push(dataObj);
    },
    
    /** 
     * check actionList for specific actions like, click on button, drag window etc.
     * clean up actionList, remove redundant mousedown/up/up on dblclick
     */
    $cleanupActions : function() {
        var actionList = this.$actionList;

        // trim actionList from trailing mousemove actions
        actionList.reverse();
        for (var i = 0, l = actionList.length; i < l; i++) {
            if (actionList[i].name != "mousemove")
                break;
        }
        actionList = actionList.slice(i);

        // trim actionList from leading mousemove actions, also adjust time
        actionList.reverse();
        
        var startIndex = 0, reduceTime = 0;
        for (var i = 0, l = actionList.length; i < l; i++) {
            if (!startIndex && actionList[i].name != "mousemove") {
                startIndex = i;
                reduceTime = actionList[i].time;
            }
            if (reduceTime)
                actionList[i].time -= reduceTime;
        }
        actionList = actionList.slice(startIndex);
        
        /* special cases */
        // only one click recorded
        if ((this.$keyActions.length == 2 
          && this.$keyActions[0].name == "mousedown" 
          && this.$keyActions[1].name == "mouseup")
        //|| (this.$keyActions.length == 3 && this.$keyActions[0].name == "mousedown" && this.$keyActions[1].name == "mousedown" && this.$keyActions[2].name == "mouseup")
        ) {
            // caption for dragging element
            var kaLast   = this.$keyActions[this.$keyActions.length-1];
            var kaFirst  = this.$keyActions[0];
            var kaSecond = this.$keyActions[1];
            
            if ((kaLast.events && kaLast.events["afterdrag"]) 
              || (kaFirst.events && kaFirst.events["dragstart"] && kaLast.events 
              && kaLast.events["dragdrop"])
              || (kaFirst.events && kaFirst.events["beforedragstart"] 
              && kaLast.events && kaLast.events["beforedrag"])
            ) {
                if (kaLast.amlNode.selected && kaLast.dropTarget) {
                    apf.uirecorder.capture.$curTestId = "drag '" 
                      + (kaLast.amlNode.selected.value || kaLast.amlNode.selected.xpath) 
                      + "' to " 
                      + (kaLast.dropTarget.id || (kaLast.dropTarget.caption 
                            ? kaLast.dropTarget.type + " " 
                              + kaLast.dropTarget.caption 
                            : null) 
                        || (kaLast.dropTarget.type + " " + kaLast.dropTarget.xpath));
                }
                else {
                    apf.uirecorder.capture.$curTestId = "drag '" 
                      + (kaFirst.amlNode.id 
                        || (kaFirst.amlNode.caption 
                          ? kaFirst.amlNode.type + " " + kaFirst.amlNode.caption 
                          : null) 
                            || (kaFirst.amlNode.type + " " + kaFirst.amlNode.xpath)) 
                      + "'";
                }
            }
            // caption and optimization for clicking some element
            else if (actionList.length == 2) {
                actionList = this.$keyActions;
                actionList[0].time = 0;
                actionList[1].time = 100;

                // state change
                if (kaSecond.events && kaSecond.events["afterstatechange"] 
                  && kaSecond.properties && kaSecond.properties["state"]) {
                    apf.uirecorder.capture.$curTestId = "set state of '" 
                      + (kaSecond.amlNode.id || (kaSecond.amlNode.caption 
                        ? kaSecond.amlNode.type + " " + kaSecond.amlNode.caption 
                        : null) 
                          || (kaSecond.amlNode.type + " " + kaSecond.amlNode.xpath)) 
                      + "' to '" + kaSecond.properties["state"] + "'";
                }
                else if (kaSecond.amlNode) {
                    if (kaSecond.amlNode.type != "list") {
                        if (!kaSecond.amlNode.activeElement) {
                            apf.uirecorder.capture.$curTestId = "click on " 
                              + (kaFirst.amlNode.id || (kaFirst.amlNode.caption 
                                ? kaFirst.amlNode.type + " " + kaFirst.amlNode.caption 
                                : null) 
                                  || (kaFirst.amlNode.type + " " 
                                    + (kaFirst.amlNode.label 
                                      || (typeof kaFirst.amlNode.value == "string" 
                                        ? kaFirst.amlNode.value 
                                        : kaFirst.amlNode.xpath))));
                        }
                        else {
                            apf.uirecorder.capture.$curTestId = "click on " 
                              + kaSecond.amlNode.activeElement.name + " of " 
                              + (kaFirst.amlNode.id || (kaFirst.amlNode.caption 
                                ? kaFirst.amlNode.type + " " + kaFirst.amlNode.caption 
                                : null) || (kaFirst.amlNode.type + " " 
                                  + (kaFirst.amlNode.label 
                                    || (typeof kaFirst.amlNode.value == "string" 
                                      ? kaFirst.amlNode.value 
                                      : kaFirst.amlNode.xpath))));
                        }
                    }
                    else {
                        apf.uirecorder.capture.$curTestId = "select " 
                          + kaSecond.amlNode.type + " item " 
                          + (typeof kaSecond.amlNode.value == "string" 
                            ? kaSecond.amlNode.value 
                            : kaSecond.amlNode.xpath);
                    }
                }
            }
        }

        // other
        else {
            // caption for selecting item in dropdown
            if (this.$keyActions.length == 4 
              && this.$keyActions[0] && this.$keyActions[0].name == "mousedown" 
              && this.$keyActions[1] && this.$keyActions[1].name == "mouseup" 
              && this.$keyActions[2].amlNode && this.$keyActions[2].amlNode.popup 
              && this.$keyActions[2] && this.$keyActions[2].name == "mousedown" 
              && this.$keyActions[2].amlNode 
              && this.$keyActions[2].amlNode.type == "dropdown" 
              && this.$keyActions[3] && this.$keyActions[3].name == "mouseup"
            ){
                if (this.$keyActions[2].amlNode.selected)
                    apf.uirecorder.capture.$curTestId = "select " 
                      + this.$keyActions[2].amlNode.type + " item '" 
                      + (this.$keyActions[2].amlNode.selected.value 
                        || this.$keyActions[2].amlNode.selected.xpath) + "'";
            }
            // caption for typing text in textbox
            else if ((this.$keyActions[0] && this.$keyActions[0].name == "mousedown" 
              && this.$keyActions[1] && this.$keyActions[1].name == "mouseup" 
              && this.$keyActions[2] && this.$keyActions[2].name == "keypress" 
              && kaLast && kaLast.name == "keypress")
              || (this.$keyActions[0] && this.$keyActions[0].name == "keypress" 
              && this.$keyActions[1] && kaLast.name == "keypress")
            ){
                var i = (this.$keyActions[0].name == "mousedown") ? 2 : 0;
                
                for (var l = this.$keyActions.length; i < l; i++) {
                    if (this.$keyActions[i].name != "keypress")
                        break;
                    
                    if (i == this.$keyActions.length-1)
                        apf.uirecorder.capture.$curTestId = "type text in '" 
                          + this.$keyActions[i].amlNode.type + "' " 
                          + (this.$keyActions[0].amlNode.id 
                            || (this.$keyActions[0].amlNode.caption 
                              ? this.$keyActions[0].amlNode.type + " " 
                                + this.$keyActions[0].amlNode.caption 
                              : null) 
                            || (this.$keyActions[0].amlNode.type + " " 
                              + this.$keyActions[0].amlNode.xpath));
                }
            }
            
            /*
            actionList = this.$actionList;

            // trim actionList from trailing mousemove actions
            actionList.reverse();
            for (var i = 0, l = actionList.length; i < l; i++) {
                if (actionList[i].name != "mousemove") {
                    break;
                }
            }
            actionList = actionList.slice(i);

            // trim actionList from leading mousemove actions, also adjust time
            actionList.reverse();
            for (var startIndex = 0, reduceTime = 0, i = 0, l = actionList.length; i < l; i++) {
                if (!startIndex && actionList[i].name != "mousemove") {
                    startIndex = i;
                    reduceTime = actionList[i].time;
                }
                if (reduceTime) {
                    actionList[i].time -= reduceTime;
                }
            }
            actionList = actionList.slice(startIndex);
            */
        }
        
        
        // remove redundant actions for dblclick
        // reset keyActionsIdxs if neccessary
        for (var resetKeyIdx = false, a, i = 0, l = actionList.length; i < l; i++) {
            //if (actionList[i].keyActionIdx != undefined)
                //this.$keyActions[actionList[i].keyActionIdx] = actionList[i];
            if (actionList[i].name == "dblClick") {
                if (actionList.length > 3 && i >= 3 
                  && actionList[i-3].name == "mousedown" 
                  && actionList[i-2].name == "mouseup" 
                  && actionList[i-1].name == "mouseup"
                ){
                    resetKeyIdx = true;
                    this.$keyActions.splice(actionList[i-3].keyActionIdx, 3);
                    actionList.splice(i-3, 3);
                    i -= 3;
                    l -= 3;
                    if (!actionList[i+1]) break;
                }
                else if (!apf.uirecorder.isPlaying) {
                    debugger;
                }
            }
        }
        if (resetKeyIdx) {
            var curKeyActionIdx = 0;
            for (var i = 0, l = actionList.length; i < l; i++) {
                if (actionList[i].keyActionIdx != undefined) {
                    actionList[i].keyActionIdx = curKeyActionIdx;
                    curKeyActionIdx++;
                }
            }
        }

        
        
        return actionList;
    },
    
    /**
     * save captured test data
     */
    $saveTest : function() {
        var testXml = apf.getXml("<test />");
        var actionList = this.$cleanupActions(testXml);
        
        // clean up/simplify actionlist based on recorded actions, also set name if specific action
        
        testXml.setAttribute("name", apf.uirecorder.capture.$curTestId);
        testXml.setAttribute("file", apf.uirecorder.capture.$curTestFile);
        
        var dragMode = false, prevNode, action, aNode, amlNodeName;
        var detailTypes = {
            events     : "event", 
            properties : "property", 
            data       : "dataItem"
        };
        
        for (var i = 0, l = actionList.length; i < l; i++) {
            action = actionList[i];

            // skip current action if next action is played at same time
            //if (actionList[i+1] && action.time == actionList[i+1].time) continue;
            
            // skip small mousemove between certain actions, like between mousedown/mouseup
            if (action.name == "mousemove" && i >= 1 
              && actionList[i-1] && actionList[i-1].name == "mousedown" 
              && actionList[i+1] && actionList[i+1].name == "mouseup"
            ){
                continue;
            }
            
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name", action.name);
            aNode.setAttribute("x", action.x);
            aNode.setAttribute("y", action.y);
            aNode.setAttribute("time", action.time);

            // set drag element positioning
            if (action.events && action.events["beforedrag"] > -1)
                dragMode = true;
            else if (action.events && action.events["afterdrag"] > -1)
                dragMode = false;

            if (dragMode || action.events && action.events["afterdrag"] > -1)
                aNode.setAttribute("target", "position");
            
            if (action.keyActionIdx != undefined) {
                aNode.setAttribute("keyActionIdx"  , action.keyActionIdx);
                if (action.amlNode) {
// caption not needed for debugwin, disabled for now
//aNode.setAttribute("caption", action.name + " (" + this.getCaption(action.amlNode) + ")");
                    //if (action.amlNode.caption) aNode.setAttribute("caption", action.name + " (" + action.amlNode.caption + ")");
                }
                else if (action.target) {
                    if (action.target.caption) 
                        aNode.setAttribute("caption", 
                          action.name + " (" + action.target.caption + ")");
                    if (action.target.nodeName) 
                        aNode.setAttribute("targetType", action.target.nodeName);
                    if (action.target.value) 
                        aNode.setAttribute("targetValue", action.target.value);
                }
            }
            
            if (action.ignore)
                aNode.setAttribute("ignore", action.ignore);

            /* old amlNode attributes setting
            if (action.amlNode && action.amlNode.localName != "debugwin") {
                if (action.amlNode.parentNode && action.amlNode.tagName) {
                    var amlNodeName = action.amlNode.id || apf.xmlToXpath(action.amlNode);
                    if (amlNodeName.indexOf("/text()[") > -1)
                        amlNodeName = amlNodeName.substr(0, amlNodeName.length - "/text()[x]".length)
                    
                    aNode.setAttribute("amlNode", amlNodeName);
                }
            }
            */
            var actionNode = action.amlNode;
            if (actionNode) {
                var amlNode = testXml.ownerDocument.createElement("amlNode");
                if (actionNode.id) 
                    amlNode.setAttribute("id", actionNode.id);
                    
                amlNode.setAttribute("xpath", actionNode.xpath);
                amlNode.setAttribute("tagName", actionNode.tagName);
                amlNode.setAttribute("type", actionNode.type);
                amlNode.setAttribute("x", actionNode.x);
                amlNode.setAttribute("y", actionNode.y);
                amlNode.setAttribute("width", actionNode.width);
                amlNode.setAttribute("height", actionNode.height);
                
                if (actionNode.value) 
                    amlNode.setAttribute("value", actionNode.value);
                if (actionNode.label) 
                    amlNode.setAttribute("label", actionNode.label);
                
                
                if (actionNode.caption)
                    amlNode.setAttribute("caption", actionNode.caption);
                
//                if (!specialAction)
//                    testXml.setAttribute("name", specialAction + (actionNode.id || (actionNode.caption ? actionNode.type + " " + actionNode.caption : null) || (actionNode.type + " " + actionNode.xpath)));

                if (actionNode.popup) 
                    amlNode.setAttribute("popup", actionNode.popup);
                if (actionNode.selected) {
                    amlNode.setAttribute("multiselect", "true");
                    
                    var selNode = testXml.ownerDocument.createElement("selected");
                    
                    if (actionNode.selected.value) 
                        selNode.setAttribute("value", actionNode.selected.value);
                    if (actionNode.selected.xpath) 
                        selNode.setAttribute("xpath", actionNode.selected.xpath);
                        
                    selNode.setAttribute("x", actionNode.selected.x);
                    selNode.setAttribute("y", actionNode.selected.y);
                    selNode.setAttribute("width", actionNode.selected.width);
                    selNode.setAttribute("height", actionNode.selected.height);

//                    if (specialAction)
//                        testXml.setAttribute("name", specialAction + actionNode.type + " item " + (actionNode.selected.value || actionNode.selected.xpath));
                    
                    amlNode.appendChild(selNode);
                }
                else if (actionNode.activeElement) {
                    amlNode.setAttribute("activeElement", "true");
                    
                    var activeElNode = testXml.ownerDocument.createElement("activeElement");
                    var activeNode   = actionNode.activeElement;
                    activeElNode.setAttribute("name", activeNode.name);
                    activeElNode.setAttribute("x", activeNode.x);
                    activeElNode.setAttribute("y", activeNode.y);
                    activeElNode.setAttribute("width", activeNode.width);
                    activeElNode.setAttribute("height", activeNode.height);

//                    if (specialAction)
//                        testXml.setAttribute("name", specialAction + actionNode.type + " element " + (actionNode.activeElement.name));
                    
                    amlNode.appendChild(activeElNode);
                }
                
                aNode.appendChild(amlNode);
            }
            else {
                /*
                if (action.htmlNode && action.htmlNode.name) {
                    aNode.setAttribute("htmlNode", action.htmlNode.name);
                    aNode.setAttribute("width", action.htmlNode.width);
                    aNode.setAttribute("height", action.htmlNode.height);
                    aNode.setAttribute("absX", action.htmlNode.x);
                    aNode.setAttribute("absY", action.htmlNode.y);
                    aNode.setAttribute("scrollTop", action.htmlNode.scrollTop);
                    aNode.setAttribute("scrollLeft", action.htmlNode.scrollLeft);
                }
                */
                if (action.htmlElement) {
                    var htmlElement = testXml.ownerDocument.createElement("htmlElement");
                    var htmlNode    = action.htmlElement;
                    
                    if (action.htmlElement.id) 
                        htmlElement.setAttribute("id", htmlNode.id);
                        
                    htmlElement.setAttribute("type", htmlNode.type.toLowerCase());
                    htmlElement.setAttribute("tagName", htmlNode.tagName.toLowerCase());
                    htmlElement.setAttribute("x", htmlNode.x);
                    htmlElement.setAttribute("y", htmlNode.y);
                    htmlElement.setAttribute("width", htmlNode.width);
                    htmlElement.setAttribute("height", htmlNode.height);

                    if (htmlNode.popup) 
                        htmlElement.setAttribute("popup", htmlNode.popup);
                    if (htmlNode.innerHTML) 
                        htmlElement.setAttribute("innerHTML", htmlNode.innerHTML);
                    aNode.appendChild(htmlElement);
                }
            }
            
            // dragdrop target
            if (action.dropTarget) {
                var dropNode = testXml.ownerDocument.createElement("dropTarget");
                var dropTarget = action.dropTarget;
                
                amlNode.setAttribute("dropTarget", "true");
                
                if (action.dropTarget.id) 
                    dropNode.setAttribute("id", dropTarget.id);
                    
                dropNode.setAttribute("xpath", dropTarget.xpath);
                dropNode.setAttribute("tagName", dropTarget.tagName);
                dropNode.setAttribute("type", dropTarget.type);
                dropNode.setAttribute("x", dropTarget.x);
                dropNode.setAttribute("y", dropTarget.y);
                dropNode.setAttribute("width", dropTarget.width);
                dropNode.setAttribute("height", dropTarget.height);
                
                amlNode.appendChild(dropNode);
            }

            // set value
            if (action.value != undefined) 
                aNode.setAttribute("value", action.value);
            if (action.multiselect != undefined) 
                aNode.setAttribute("multiselect", action.multiselect.toString());
            if (action.multiselectValue != undefined) 
                aNode.setAttribute("multiselectValue", action.multiselectValue);
            if (action.multiselectItem != undefined) 
                aNode.setAttribute("multiselectItem", action.multiselectItem);
            
            // loop through detailList
            var detailNodel, detailList = action.detailList;
            for (var dli = 0, dll = detailList.length; dli < dll; dli++) {
                detailNode = testXml.ownerDocument.createElement("details");
                detailNode.setAttribute("index", dli);
                
                for (var elementName in detailList[dli]) {
                    eNode = testXml.ownerDocument.createElement("element");
                    
                    if (elementName.indexOf("/text()") == -1)
                        eNode.setAttribute("name", elementName);
                    else // strip element name from /text()[x]
                        eNode.setAttribute("name", 
                          elementName.substr(0, 
                            elementName.length - "/text()[x]".length));
                    
                    var item, actionItem, item, vNode;
                    for (var type in detailTypes) {
                        actionItem = detailList[dli][elementName][type];
                        if (actionItem.length) {
                            dNode = testXml.ownerDocument.createElement(type)
                            for (var di = 0, dl = actionItem.length; di < dl; di++) {
                                item = actionItem[di];
                                iNode = testXml.ownerDocument.createElement(detailTypes[type]);
                                iNode.setAttribute("name", item.name);

                                if (item.value || typeof item.value == "boolean") {
                                    if (typeof item.value === "string" || typeof item.value == "number")
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(item.value));
                                    else if (item.value.value != undefined)
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(item.value.value));
                                    else if (item.value.nodeFunc) {
                                        var id = item.value.id
                                            || apf.getChildNumber(item.value)
                                            || "";
                                        
                                        iNode.setAttribute("objectref", "1");
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(id));
                                    }
                                    //else
                                        //iNode.appendChild(testXml.ownerDocument.createTextNode(apf.serialize(item.value).split("<").join("&lt;").split(">").join("&gt;")))
                                }
                                dNode.appendChild(iNode);
                            }
                            eNode.appendChild(dNode);
                        }
                    }
                    detailNode.appendChild(eNode);
                }
                aNode.appendChild(detailNode);
            }
            testXml.appendChild(aNode);
        }

        this.outputXml = testXml;
    },
    
    getCaption : function(amlNode) {
        //amlNode
        if (!amlNode.localName) debugger;
        switch (amlNode.localName) {
            // element with caption
            case "button":
            case "label":
                if (!amlNode.caption) debugger;
                return amlNode.localName + " \"" + amlNode.caption + "\"";
            // element with id
            case "dropdown":
            case "datagrid":
            case "textbox":
                if (amlNode.caption && amlNode.caption.charAt(0) != "[") debugger;
                return (amlNode.id 
                    ? amlNode.localName + " \"" + amlNode.id + "\"" 
                    : amlNode.localName);
            // element with label
            case "checkbox":
                if (!amlNode.label) debugger;
                return amlNode.localName + " \"" + amlNode.label + "\"";
            // page elements
            case "page":
                if (amlNode.parentNode && amlNode.parentNode.localName == "tab")
                    return "Tab \"" + amlNode.caption + "\"";
                else
                    debugger;
                break;
            // item elements
            case "item":
                if (amlNode.parentNode) {
                    if (!amlNode.caption) debugger;

                    return (amlNode.parentNode.localName + " " 
                        + amlNode.localName + " \"" + amlNode.caption + "\"");
                }
                else {
                    debugger;
                }
            default:
                debugger;
        }
    }
}
//#endif