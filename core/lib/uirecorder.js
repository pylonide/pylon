// #ifdef __WITH_UIRECORDER
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
apf.uirecorder = {
    $inited         : false,
    isRecording     : false,
    isPlaying       : false,
    isPaused        : false,
    captureDetails  : false,
    $o3             : null,
    
    setTimeout      : self.setTimeout
} 

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
    
    // init capturing of user interaction
    $init : function() {
        if (apf.uirecorder.$inited) return;
        apf.uirecorder.$inited = true;

        // listeners for user mouse interaction
        //apf.uirecorder.$o3.DOM.ondblclick = apf.uirecorder.capture.dblclick = function(e){
        document.documentElement.ondblclick = apf.uirecorder.capture.dblclick = function(e) {
            if (apf.uirecorder.isPaused || !(apf.uirecorder.isPlaying || apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("dblClick", e || event);
        }

        //apf.uirecorder.$o3.DOM.onmousedown = apf.uirecorder.capture.mousedown = function(e){
        document.documentElement.onmousedown = apf.uirecorder.capture.mousedown = function(e) {
            if (apf.uirecorder.isPaused || !(apf.uirecorder.isPlaying || apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("mousedown", e || event);
        };

        //apf.uirecorder.$o3.DOM.onmouseup = apf.uirecorder.capture.mouseup = function(e){
        document.documentElement.onmouseup = apf.uirecorder.capture.mouseup = function(e) {
            if (apf.uirecorder.isPaused || !(apf.uirecorder.isPlaying || apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("mouseup", e || event);
        }
        
        //apf.uirecorder.$o3.DOM.onmousemove = function(e){
        document.documentElement.onmousemove = apf.uirecorder.capture.mousemove = function(e) {
            if (apf.uirecorder.isPaused || !(apf.uirecorder.isPlaying || apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("mousemove", e || event);
        }
        
        // Support for Mouse Scroll event
        if(document.addEventListener) {
            /* FF */
            document.addEventListener("DOMMouseScroll", function(e) {
                if (apf.uirecorder.isPaused || !(apf.uirecorder.isPlaying || apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
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
            //apf.uirecorder.$o3.DOM.onmousewheel = apf.uirecorder.capture.mousewheel = function(e){
            document.onmousewheel = apf.uirecorder.capture.mousewheel = function(e) {
                if (apf.uirecorder.isPaused || !(apf.uirecorder.isPlaying || apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
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
        //apf.uirecorder.$o3.DOM.onkeyup = apf.uirecorder.capture.keyup = function(e){
        document.documentElement.onkeyup = apf.uirecorder.capture.keyup = function(e) {
            if (apf.uirecorder.isPaused || !(apf.uirecorder.isPlaying || apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            e = e || event;

            var keycode = (e.keyCode) ? e.keyCode : e.which;
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;

            apf.uirecorder.capture.$captureAction("keyup", e, keycode);
        }
        
        //apf.uirecorder.$o3.DOM.onkeydown = apf.uirecorder.capture.keydown = function(e){
        document.documentElement.onkeydown = apf.uirecorder.capture.keydown = function(e) {
            if (apf.uirecorder.isPaused || !(apf.uirecorder.isPlaying || apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            e = e || event;

            var keycode = (e.keyCode) ? e.keyCode : e.which;
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;
            
            apf.uirecorder.capture.$captureAction("keydown", e, keycode);
        }
        
        //apf.uirecorder.$o3.DOM.onkeypress = apf.uirecorder.capture.keypress = function(e){
        document.documentElement.onkeypress = apf.uirecorder.capture.keypress = function(e) {
            if (apf.uirecorder.isPaused || !(apf.uirecorder.isPlaying || apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
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
            
            // ignore when no character is outputted, like the Enter key, except for space character
            if (character.trim() == "" && character != " ") return;

//            if (e.shiftKey) character = "[SHIFT]" + character;
//            if (e.altKey)   character = "[ALT]" + character;
//            if (e.ctrlKey)  character = "[CTRL]" + character;
            apf.uirecorder.capture.$captureAction("keypress", e, character);
        }
        
        // @todo fix problem with onkeyup in apf
    },

    // get all neccessary information about amlNode
    $getAmlNodeData : function(amlNode, htmlElement, eventName, value) {
        if (amlNode.tagName == "html" || amlNode.tagName == "body") return;
        var data = {};

        // action on item of multiselect
        if (amlNode.localName == "item" && amlNode.parentNode.hasFeature(apf.__MULTISELECT__)) {
            amlNode = amlNode.parentNode;
        }
        
        if (amlNode.id)         data.id = amlNode.id;
        if (amlNode.caption && amlNode.caption.charAt(0) != "[")    data.caption = amlNode.caption;

        data.tagName    = amlNode.tagName;
        data.type       = amlNode.localName;
        var xpath       = apf.xmlToXpath(amlNode)
        data.xpath      = xpath.substr(xpath.indexOf("/")+1);
        if (amlNode.getValue && ["text","textarea","textbox"].indexOf(amlNode.localName) == -1) 
            data.value = amlNode.getValue();
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
                
                if (amlNode.selected) {
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
        }
        // mouseup after selecting dropdown item, set dropdown as amlNode, dropdown popup not visible after mousedown and mouseup
        else if (eventName == "mouseup" && this.$prevMouseDownAction && this.$prevMouseDownAction.amlNode && this.$prevMouseDownAction.amlNode.type == "dropdown") {
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
        if (["body", "html"].indexOf(htmlElement.tagName.toLowerCase()) > -1) return;
        
        var data = {};
        if (htmlElement.id) data.id                 = htmlElement.id;
        if (htmlElement.tagName.toLowerCase() == "a" && htmlElement.innerHTML) 
            data.innerHTML   = htmlElement.innerHTML;

        data.tagName    = htmlElement.tagName;
        data.type       = (data.tagName.toLowerCase() == "a") ? "link" : data.tagName;

        var pos = apf.getAbsolutePosition(htmlElement, document.body);
        data.x          = pos[0];
        data.y          = pos[1];
        data.width      = htmlElement.offsetWidth;
        data.height     = htmlElement.offsetHeight;

        if (apf.popup.last && apf.isChildOf(apf.popup.cache[apf.popup.last].content, htmlElement, true))
            data.popup = true;
            
        return data;
    },
    
    $captureAction : function(eventName, e, value) {
        //if (!apf.uirecorder.$inited) return;
        // prevent double mousedown action capture one after another
        if (eventName == "mousedown" && this.$prevAction && this.$prevAction.name == "mousedown") return;
//        if (eventName == "keydown" && this.$prevAction && this.$prevAction.name == "keydown") return;
//        if (eventName == "keyup" && this.$prevAction && this.$prevAction.name == "keyup") return;

        var htmlElement = (e) ? e.srcElement || e.target : null;
        var amlNode     = (htmlElement && apf.findHost(htmlElement) && apf.findHost(htmlElement).tagName) ? apf.findHost(htmlElement) : null;

//        if (eventName != "mousemove") { //this.$mousedownMode
            if (amlNode && amlNode.prefix == "a") {
                var amlNodeData = this.$getAmlNodeData(amlNode, htmlElement, eventName, value);
            }
            else if (htmlElement && htmlElement.tagName) {
                var htmlElementData = this.$getHtmlElementData(htmlElement);
            }
//        }

        // elapsed time since start of recording/playback
        var time = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);

        // set action object
        var actionObj = {
            time        : time,
            name        : eventName,
            detailList  : []
        }

        if (amlNodeData)        actionObj.amlNode       = amlNodeData;
        if (htmlElementData)    actionObj.htmlElement   = htmlElementData;
        if (e && e.clientX != undefined)     actionObj.x             = parseInt(e.clientX);
        if (e && e.clientX != undefined)     actionObj.y             = parseInt(e.clientY);
        else debugger;

        if (value)              actionObj.value         = value;

        if (this.$keyActions.length) {
            // save reference to captured events
            for (var evtName in this.$capturedEvents) {
                this.$keyActions[this.$keyActions.length-1].events = this.$capturedEvents;
                
                if (this.$keyActions[this.$keyActions.length-1].events["dragdrop"]) {
                    this.$keyActions[this.$keyActions.length-1].dropTarget    = this.$getAmlNodeData(this.$keyActions[this.$keyActions.length-1].events["dragdrop"].dropTarget);
                    this.$keyActions[this.$keyActions.length-1].amlNode       = this.$getAmlNodeData(this.$keyActions[this.$keyActions.length-1].events["dragdrop"].amlNode);
                }
                    
                this.$capturedEvents = {};
                break;
            }
            // save reference to captured property changes
            for (var evtName in this.$capturedProperties) {
                this.$keyActions[this.$keyActions.length-1].properties = this.$capturedProperties;
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
        if (eventName == "mousedown") this.$prevMouseDownAction = actionObj;
        
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
                return apf.uirecorder.setTimeout(function(){
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
    
    // checks on action like correct target
    checkAction : function() {
        
    },
    
    // check details after action
    checkDetails : function(actionObj, checkIdx) {
        var checkList = apf.uirecorder.playback.checkList[actionObj.keyActionIdx];
        if (!checkList) return;

        // loop through checkList, after loop all checks should be passed
        // the ones that didn't pass should raise warnings/errors
        if (checkList.details && checkList.details[checkIdx]) {
            // elements
            for (var elName in checkList.details[checkIdx]) {

                // detailType (events/properties/data)
                for (var dType in checkList.details[checkIdx][elName]) {
                    // detail
                    for (var waitFor = false, d, i = 0, l = checkList.details[checkIdx][elName][dType].length; i < l; i++) {
                        waitFor = (check1 = checkList.details[checkIdx][elName][dType][i]).waitFor;

/*
TEMPORARILY DISABLED
                        if (!waitFor && !(actionObj.detailList && actionObj.detailList[checkIdx] && actionObj.detailList[checkIdx][elName] && actionObj.detailList[checkIdx][elName][dType])) {
                            if (apf.uirecorder.playback.$warningList.indexOf("No " + dType + " set on element " + elName + ". Expected " + checkList.details[checkIdx][elName][dType][i].type + " " + checkList.details[checkIdx][elName][dType][i].name + " to be set ") == -1)
                                apf.uirecorder.playback.$warningList.push("No " + dType + " set on element " + elName + ". Expected " + checkList.details[checkIdx][elName][dType][i].type + " " + checkList.details[checkIdx][elName][dType][i].name + " to be set ");
                            continue;
                        }
*/
                        if (actionObj.detailList && actionObj.detailList[checkIdx] && actionObj.detailList[checkIdx][elName] && actionObj.detailList[checkIdx][elName][dType] && actionObj.detailList[checkIdx][elName][dType].length) {
                            for (var found = false, j = 0, jl = actionObj.detailList[checkIdx][elName][dType].length; j < jl; j++) {
                                // event, property or data is set during action on corrent element
                                if ((check1 = checkList.details[checkIdx][elName][dType][i]).name == (check2 = actionObj.detailList[checkIdx][elName][dType][j]).name) {
                                    // event, property or data set but different value
                                    if (check1.value && typeof check1.value == "string" && check2.value && typeof check2.value == "string" && check1.value != check2.value) {
                                        if (apf.uirecorder.playback.$warningList.indexOf("element " + elName + " has different value. Before: \"" + check1.value + "\". After: \"" + check2.value) + "\""== -1)
                                            apf.uirecorder.playback.$warningList.push("element " + elName + " has different value. Before: \"" + check1.value + "\". After: \"" + check2.value + "\"");
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
        if ((amlNode.root && amlNode.isIE != undefined) || ["html","head","body","script"].indexOf(amlNode.tagName) > -1) return;
        
        if (eventName == "movefocus")
            amlNode = e.toElement;
        else if (eventName == "DOMNodeRemoved")
            amlNode = e.relatedNode;
            
        // get name of target
        var targetName;

        // aml element
        if (amlNode && amlNode.parentNode && amlNode.tagName && !apf.xmlToXpath(amlNode,apf.document) != "html[1]") {
            targetName = (amlNode.id) 
                ? amlNode.id 
                : ((targetName = apf.xmlToXpath(amlNode,apf.document)).substr(0, 8) == "html[1]/"
                    ? targetName = targetName.substr(8)
                    : targetName);
            if (targetName.indexOf("/text()") > -1) {
                targetName = targetName.substr(0, targetName.length - "/text()[x]".length);    
            }
        }
        // html element
        else if (amlNode && e && e.htmlEvent) {
            // skip capturing event calls on html element, already captured on amlNodes
            if (["keydown", "hotkey"].indexOf(eventName) > -1) return;
            var htmlElement = e.htmlEvent.srcElement;

            if (htmlElement.tagName.toLowerCase() != "html") {
                if ((targetName = apf.xmlToXpath(htmlElement,apf.document)).substr(0, 8) == "html[1]/")
                    targetName = targetName.substr(8);
                ;//("&lt;" + htmlElement.tagName + "&gt; " + htmlElement.id) || "&lt;" + htmlElement.tagName + "&gt;";
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
        if (["DOMNodeRemovedFromDocument"].indexOf(eventName) > -1) return;
        //if (!apf.uirecorder.$inited) return;
        //if (this.validEvents.indexOf(eventName) == -1) return;
        var target = this.$getTargetName(eventName, e);
        if (!target) return;
        var eventObj = {
            name        : eventName,
            event       : e
        }
        
        // save events to detailList
        if (!this.$detailList[target.name]) this.$detailList[target.name] = {
            caption     : target.name,
            amlNode     : target.amlNode,
            events      : [],
            properties  : [],
            data        : []
        };
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
    capturePropertyChange : function(amlNode, prop, value) {
        //if (!apf.uirecorder.$inited) return;
        var target = this.$getTargetName(null, null, amlNode);
        if (!target) return;
        var propObj = {
            name        : prop,
            value       : value
        }
        
        // save properties to detailList
        if (!this.$detailList[target.name]) this.$detailList[target.name] = {
            caption     : target.name,
            amlNode     : amlNode,
            events      : [],
            properties  : [],
            data        : []
        };
        this.$detailList[target.name].properties.push(propObj);
        this.$capturedProperties[prop] = value;
    },
    captureModelChange : function(params) {
        //if (!apf.uirecorder.$inited) return;
        var target = (params.amlNode) ? this.$getTargetName(null, null, params.amlNode) : null;
        var dataObj = {
            name        : param.action
        }
        
        // value of data change
        if (params.amlNode) {
            if (!dataObj.value) dataObj.value = {};
                dataObj.value.amlNode = apf.serialize(params.amlNode).split("<").join("&lt;").split(">").join("&gt;");
        }
        if (params.xmlNode) {
            if (!dataObj.value) dataObj.value = {};
                dataObj.value.xmlNode = apf.serialize(params.xmlNode).split("<").join("&lt;").split(">").join("&gt;");
        }
        
        // save data to detailList
        if (!this.$detailList[target.name]) this.$detailList[target.name] = {
            caption     : target.name,
            amlNode     : target.amlNode,
            events      : [],
            properties  : [],
            data        : []
        };
        this.$detailList[target.name].data.push(dataObj);
    },
    
    // check actionList for specific actions like, click on button, drag window etc.
    // clean up actionList, remove redundant mousedown/up/up on dblclick
    $cleanupActions : function() {
        var actionList = [];

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
        
        /* special cases */
        // only one click recorded
        if ((this.$keyActions.length == 2 && this.$keyActions[0].name == "mousedown" && this.$keyActions[1].name == "mouseup")
        //|| (this.$keyActions.length == 3 && this.$keyActions[0].name == "mousedown" && this.$keyActions[1].name == "mousedown" && this.$keyActions[2].name == "mouseup")
        ) {
            // caption for dragging element
            if ( (this.$keyActions[this.$keyActions.length-1].events && this.$keyActions[this.$keyActions.length-1].events["afterdrag"]) 
                || (this.$keyActions[0].events && this.$keyActions[0].events["dragstart"] && this.$keyActions[this.$keyActions.length-1].events && this.$keyActions[this.$keyActions.length-1].events["dragdrop"])
                || (this.$keyActions[0].events && this.$keyActions[0].events["beforedragstart"] && this.$keyActions[this.$keyActions.length-1].events && this.$keyActions[this.$keyActions.length-1].events["beforedrag"])
                )  {
                if (this.$keyActions[this.$keyActions.length-1].amlNode.selected && this.$keyActions[this.$keyActions.length-1].dropTarget) {
                    apf.uirecorder.capture.$curTestId = "drag '" + (this.$keyActions[this.$keyActions.length-1].amlNode.selected.value || this.$keyActions[this.$keyActions.length-1].amlNode.selected.xpath) + "' to " + (this.$keyActions[this.$keyActions.length-1].dropTarget.id || (this.$keyActions[this.$keyActions.length-1].dropTarget.caption ? this.$keyActions[this.$keyActions.length-1].dropTarget.type + " " + this.$keyActions[this.$keyActions.length-1].dropTarget.caption : null) || (this.$keyActions[this.$keyActions.length-1].dropTarget.type + " " + this.$keyActions[this.$keyActions.length-1].dropTarget.xpath));
                }
                else {
                    apf.uirecorder.capture.$curTestId = "drag '" + (this.$keyActions[0].amlNode.id || (this.$keyActions[0].amlNode.caption ? this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.caption : null) || (this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.xpath)) +"'";
                }
            }
            // caption and optimization for clicking some element
            else if (actionList.length == 2) {
                actionList = this.$keyActions;
                actionList[0].time = 0;
                actionList[1].time = 100;

                // state change
                if (this.$keyActions[1].events && this.$keyActions[1].events["afterstatechange"] && this.$keyActions[1].properties && this.$keyActions[1].properties["state"]) {
                    apf.uirecorder.capture.$curTestId = "set state of '" + (this.$keyActions[1].amlNode.id || (this.$keyActions[1].amlNode.caption ? this.$keyActions[1].amlNode.type + " " + this.$keyActions[1].amlNode.caption : null) || (this.$keyActions[1].amlNode.type + " " + this.$keyActions[1].amlNode.xpath)) +"' to '" + this.$keyActions[1].properties["state"] + "'";
                }
                else {
                    if (this.$keyActions[1].amlNode) {
                        if (this.$keyActions[1].amlNode.type != "list") {
                            if (!this.$keyActions[1].amlNode.activeElement)
                                apf.uirecorder.capture.$curTestId = "click on " + (this.$keyActions[0].amlNode.id || (this.$keyActions[0].amlNode.caption ? this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.caption : null) || (this.$keyActions[0].amlNode.type + " " + (this.$keyActions[0].amlNode.label || (typeof this.$keyActions[0].amlNode.value == "string" ? this.$keyActions[0].amlNode.value : this.$keyActions[0].amlNode.xpath))));
                            else
                                apf.uirecorder.capture.$curTestId = "click on " + this.$keyActions[1].amlNode.activeElement.name + " of " + (this.$keyActions[0].amlNode.id || (this.$keyActions[0].amlNode.caption ? this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.caption : null) || (this.$keyActions[0].amlNode.type + " " + (this.$keyActions[0].amlNode.label || (typeof this.$keyActions[0].amlNode.value == "string" ? this.$keyActions[0].amlNode.value : this.$keyActions[0].amlNode.xpath))));
                        }
                        else {
                            apf.uirecorder.capture.$curTestId = "select " + this.$keyActions[1].amlNode.type + " item " + (typeof this.$keyActions[1].amlNode.value == "string" ? this.$keyActions[1].amlNode.value : this.$keyActions[1].amlNode.xpath);
                        }
                    }
                }
            }
        }

        // other
        else {
            // caption for selecting item in dropdown
            if (this.$keyActions.length == 4 && this.$keyActions[0] && this.$keyActions[0].name == "mousedown" && this.$keyActions[1] && this.$keyActions[1].name == "mouseup" && this.$keyActions[2].amlNode && this.$keyActions[2].amlNode.popup && this.$keyActions[2] && this.$keyActions[2].name == "mousedown" && this.$keyActions[2].amlNode && this.$keyActions[2].amlNode.type == "dropdown" && this.$keyActions[3] && this.$keyActions[3].name == "mouseup")  {
                if (this.$keyActions[2].amlNode.selected)
                    apf.uirecorder.capture.$curTestId = "select " + this.$keyActions[2].amlNode.type + " item '" + (this.$keyActions[2].amlNode.selected.value || this.$keyActions[2].amlNode.selected.xpath) + "'";
            }
            // caption for typing text in textbox
            else if ((this.$keyActions[0] && this.$keyActions[0].name == "mousedown" && this.$keyActions[1] && this.$keyActions[1].name == "mouseup" && this.$keyActions[2] && this.$keyActions[2].name == "keypress" && this.$keyActions[this.$keyActions.length-1] && this.$keyActions[this.$keyActions.length-1].name == "keypress")
                || (this.$keyActions[0] && this.$keyActions[0].name == "keypress" && this.$keyActions[1] && this.$keyActions[this.$keyActions.length-1].name == "keypress")
            ) {
                var i = (this.$keyActions[0].name == "mousedown") ? 2 : 0;
                
                for (var l = this.$keyActions.length; i < l; i++) {
                    if (this.$keyActions[i].name != "keypress")
                        break;
                    
                    if (i == this.$keyActions.length-1)
                        apf.uirecorder.capture.$curTestId = "type text in '" + this.$keyActions[i].amlNode.type + "' " + (this.$keyActions[0].amlNode.id || (this.$keyActions[0].amlNode.caption ? this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.caption : null) || (this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.xpath));
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
                if (actionList.length > 3 && i >= 3 && actionList[i-3].name == "mousedown" && actionList[i-2].name == "mouseup" && actionList[i-1].name == "mouseup") {
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
    
    // save captured test data
    $saveTest : function() {
        var testXml = apf.getXml("<test />");

        // clean up/simplify actionlist based on recorded actions, also set name if specific action
        var actionList = this.$cleanupActions(testXml);
        testXml.setAttribute("name", apf.uirecorder.capture.$curTestId);

        testXml.setAttribute("file", apf.uirecorder.capture.$curTestFile);
        
        var detailTypes = {"events": "event", "properties": "property", "data": "dataItem"};
        for (var dragMode = false, prevNode, action, aNode, amlNodeName, i = 0, l = actionList.length; i < l; i++) {
            action = actionList[i];
            
            // skip current action if next action is played at same time
            //if (actionList[i+1] && action.time == actionList[i+1].time) continue;
            
            // skip small mousemove between certain actions, like between mousedown/mouseup
            if (action.name == "mousemove" && i >= 1 && actionList[i-1] && actionList[i-1].name == "mousedown" && actionList[i+1] && actionList[i+1].name == "mouseup") {
                continue;
            }
            
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name"       , action.name);
            aNode.setAttribute("x"          , action.x);
            aNode.setAttribute("y"          , action.y);
            aNode.setAttribute("time"       , action.time);

            // set drag element positioning
            if (action.events && action.events["beforedrag"] > -1) {
                dragMode = true;
            }
            else if (action.events && action.events["afterdrag"] > -1)
                dragMode = false;
            if (dragMode || action.events && action.events["afterdrag"] > -1) {
                aNode.setAttribute("target", "position");
            }
            
            if (action.keyActionIdx != undefined) {
                aNode.setAttribute("keyActionIdx"  , action.keyActionIdx);
                if (action.amlNode) {
// caption not needed for debugwin, disabled for now
//aNode.setAttribute("caption", action.name + " (" + this.getCaption(action.amlNode) + ")");
                    //if (action.amlNode.caption) aNode.setAttribute("caption", action.name + " (" + action.amlNode.caption + ")");
                }
                else if (action.target) {
                    if (action.target.caption) aNode.setAttribute("caption", action.name + " (" + action.target.caption + ")");
                    if (action.target.nodeName) aNode.setAttribute("targetType", action.target.nodeName);
                    if (action.target.value) aNode.setAttribute("targetValue", action.target.value);
                }
            }
            
            if (action.ignore) { 
                aNode.setAttribute("ignore", action.ignore);
            }

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
            if (action.amlNode) {
                var amlNode = testXml.ownerDocument.createElement("amlNode");
                if (action.amlNode.id) amlNode.setAttribute("id", action.amlNode.id);
                amlNode.setAttribute("xpath"    , action.amlNode.xpath);
                amlNode.setAttribute("tagName"  , action.amlNode.tagName);
                amlNode.setAttribute("type"     , action.amlNode.type);
                amlNode.setAttribute("x"        , action.amlNode.x);
                amlNode.setAttribute("y"        , action.amlNode.y);
                amlNode.setAttribute("width"    , action.amlNode.width);
                amlNode.setAttribute("height"   , action.amlNode.height);
                if (action.amlNode.value) amlNode.setAttribute("value"   , action.amlNode.value);
                if (action.amlNode.label) amlNode.setAttribute("label"   , action.amlNode.label);
                
                
                if (action.amlNode.caption)     amlNode.setAttribute("caption", action.amlNode.caption);
                
//                if (!specialAction)
//                    testXml.setAttribute("name", specialAction + (action.amlNode.id || (action.amlNode.caption ? action.amlNode.type + " " + action.amlNode.caption : null) || (action.amlNode.type + " " + action.amlNode.xpath)));

                if (action.amlNode.popup) amlNode.setAttribute("popup", action.amlNode.popup);
                if (action.amlNode.selected) {
                    amlNode.setAttribute("multiselect", "true");
                    
                    var selectedNode = testXml.ownerDocument.createElement("selected");
                    if (action.amlNode.selected.value) selectedNode.setAttribute("value", action.amlNode.selected.value);
                    if (action.amlNode.selected.xpath) selectedNode.setAttribute("xpath", action.amlNode.selected.xpath);
                    selectedNode.setAttribute("x"        , action.amlNode.selected.x);
                    selectedNode.setAttribute("y"        , action.amlNode.selected.y);
                    selectedNode.setAttribute("width"    , action.amlNode.selected.width);
                    selectedNode.setAttribute("height"   , action.amlNode.selected.height);

//                    if (specialAction)
//                        testXml.setAttribute("name", specialAction + action.amlNode.type + " item " + (action.amlNode.selected.value || action.amlNode.selected.xpath));
                    
                    amlNode.appendChild(selectedNode);
                }
                else if (action.amlNode.activeElement) {
                    amlNode.setAttribute("activeElement", "true");
                    
                    var activeElNode = testXml.ownerDocument.createElement("activeElement");
                    activeElNode.setAttribute("name"     , action.amlNode.activeElement.name);
                    activeElNode.setAttribute("x"        , action.amlNode.activeElement.x);
                    activeElNode.setAttribute("y"        , action.amlNode.activeElement.y);
                    activeElNode.setAttribute("width"    , action.amlNode.activeElement.width);
                    activeElNode.setAttribute("height"   , action.amlNode.activeElement.height);

//                    if (specialAction)
//                        testXml.setAttribute("name", specialAction + action.amlNode.type + " element " + (action.amlNode.activeElement.name));
                    
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
                    if (action.htmlElement.id) htmlElement.setAttribute("id", action.htmlElement.id);
                    htmlElement.setAttribute("type"     , action.htmlElement.type.toLowerCase());
                    htmlElement.setAttribute("tagName"  , action.htmlElement.tagName.toLowerCase());
                    htmlElement.setAttribute("x"        , action.htmlElement.x);
                    htmlElement.setAttribute("y"        , action.htmlElement.y);
                    htmlElement.setAttribute("width"    , action.htmlElement.width);
                    htmlElement.setAttribute("height"   , action.htmlElement.height);

                    if (action.htmlElement.popup) htmlElement.setAttribute("popup", action.htmlElement.popup);
                    if (action.htmlElement.innerHTML) htmlElement.setAttribute("innerHTML", action.htmlElement.innerHTML);
                    aNode.appendChild(htmlElement);
                }
            }
            
            // dragdrop target
            if (action.dropTarget) {
                amlNode.setAttribute("dropTarget", "true");
                
                var dropNode = testXml.ownerDocument.createElement("dropTarget");
                if (action.dropTarget.id) dropNode.setAttribute("id", action.dropTarget.id);
                dropNode.setAttribute("xpath"    , action.dropTarget.xpath);
                dropNode.setAttribute("tagName"  , action.dropTarget.tagName);
                dropNode.setAttribute("type"     , action.dropTarget.type);
                dropNode.setAttribute("x"        , action.dropTarget.x);
                dropNode.setAttribute("y"        , action.dropTarget.y);
                dropNode.setAttribute("width"    , action.dropTarget.width);
                dropNode.setAttribute("height"   , action.dropTarget.height);
                
                amlNode.appendChild(dropNode);
            }

            // set value
            if (action.value != undefined) aNode.setAttribute("value", action.value);
            if (action.multiselect != undefined) aNode.setAttribute("multiselect", action.multiselect.toString());
            if (action.multiselectValue != undefined) aNode.setAttribute("multiselectValue", action.multiselectValue);
            if (action.multiselectItem != undefined) aNode.setAttribute("multiselectItem", action.multiselectItem);
            
            // loop through detailList
            for (var detailNode, dli = 0, dll = action.detailList.length; dli < dll; dli++) {
                detailNode = testXml.ownerDocument.createElement("details");
                detailNode.setAttribute("index", dli);
                
                for (var elementName in action.detailList[dli]) {
                    eNode = testXml.ownerDocument.createElement("element");
                    if (elementName.indexOf("/text()") == -1)
                        eNode.setAttribute("name", elementName);
                    // strip element name from /text()[x]
                    else
                        eNode.setAttribute("name", elementName.substr(0, elementName.length - "/text()[x]".length));
                    

                    for (var type in detailTypes) {
                        if (action.detailList[dli][elementName][type].length) {
                            dNode = testXml.ownerDocument.createElement(type)
                            for (var item, vNode, di = 0, dl = action.detailList[dli][elementName][type].length; di < dl; di++) {
                                item = action.detailList[dli][elementName][type][di];
                                iNode = testXml.ownerDocument.createElement(detailTypes[type]);
                                iNode.setAttribute("name", item.name);
                                
                                if (item.value || typeof item.value == "boolean") {
                                    if (typeof item.value === "string")
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(item.value));
                                    else if (item.value.value != undefined)
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(item.value.value));
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
                break;
            // element with id
            case "dropdown":
            case "datagrid":
            case "textbox":
                if (amlNode.caption && amlNode.caption.charAt(0) != "[") debugger;
                return (amlNode.id) ? amlNode.localName + " \"" + amlNode.id + "\"" : amlNode.localName;
                break;
            // element with label
            case "checkbox":
                if (!amlNode.label) debugger;
                return amlNode.localName + " \"" + amlNode.label + "\"";
                break;
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
                    return amlNode.parentNode.localName + " " + amlNode.localName + " \"" + amlNode.caption + "\"";
                }
                else {
                    debugger;
                }
            default:
                debugger;
        }
    }
}

apf.uirecorder.playback = {
    $playSpeed      : "realtime",   // speed of the playback
    $curTestXml     : null,         // contains the full actions list in xml format
    $curActionIdx   : 0,            // current index of action that is being played
    $startTime      : 0,            // time test has started playing
    $startDelay     : 0,            // time when test was paused
    $testDelay      : 0,            // total time test has delayed
    checkList       : [],
    $warningList    : [],
    $waitForList    : [],
    $waitForInterval: null,
    $waitForStartTime: 0,
    
    $activeEl       : null,
    
    $windowOffset   : [0, 0],       // object with top/left offset of browser element in relation to client window
    $speedUpTime    : 0,
    $keyString      : "",
    
    $lastMousePosition : [0, 0],
    
    $eventsToCheck  : [],
    $waitForEvents  : [], //"afterload", "afterswitch"

    test : function(testXml, playSpeed, o3, offset) {
        this.play(testXml, playSpeed, o3, offset);
    },
    
    createCheckList : function() {
        this.checkList = []
        
        var id, xpath, tagName, type, activeElement;
        for (var kIdx, ds, k, i = 0, il = this.$keyActions.length; i < il; i++) {
            this.checkList[(kIdx = (k = this.$keyActions[i]).getAttribute("keyActionIdx"))] = {};

            if ((a = k.selectSingleNode("amlNode"))) {
                if (!this.checkList[kIdx].action) this.checkList[kIdx].action = {};
                this.checkList[kIdx].action["amlNode"] = {}
                
                if (xpath = a.getAttribute("xpath")) this.checkList[kIdx].action["amlNode"].xpath = xpath;
                if (id = a.getAttribute("id")) {
                    this.checkList[kIdx].action["amlNode"].id = id;
                }
                // no id specified for element
                else {
                    if (this.$warningList.indexOf("No id specified for element " + xpath) == -1)
                        this.$warningList.push("No id specified for element " + xpath);
                }
                if (tagName = a.getAttribute("tagName")) this.checkList[kIdx].action["amlNode"].tagName = tagName;
                if (type = a.getAttribute("type")) this.checkList[kIdx].action["amlNode"].type = type;
                if (a.getAttribute("activeElement") && (activeElement = a.selectSingleNode("activeElement").getAttribute("name"))) this.checkList[kIdx].action["amlNode"].activeElement = activeElement;
            }
            if ((ds = k.selectNodes("details"))) {
                //if (!this.checkList[kIdx].details) this.checkList[kIdx].details = {};
                for (var d, dIdx, dsi = 0, dsl = ds.length; dsi < dsl; dsi++) {                
                    dIdx = (d = ds[dsi]).getAttribute("index");
                    //this.checkList[kIdx].details[(dIdx = (d = ds[dsi]).getAttribute("index"))] = {};

                    //elements
                    for (var el, elName, eli = 0, ell = d.childNodes.length; eli < ell; eli++) {
                        if ((elName = (el = d.childNodes[eli]).getAttribute("name")) == "trashbin") continue
                        //this.checkList[kIdx].details[dIdx][elName] = {};
                        
                        //element types (events/properties/data)
                        for (var et, etName, eti = 0, etl = el.childNodes.length; eti < etl; eti++) {
                            // @todo determine which events should be checked, for now ignore events
                            etName = (et = el.childNodes[eti]).tagName;
                            
                            //if (!this.checkList[kIdx].details[dIdx][elName][etName]) this.checkList[kIdx].details[dIdx][elName][etName] = [];
                            
                            // element detail
                            for (var setWaitFor = false, detObj, ed, edi = 0, edl = et.childNodes.length; edi < edl; edi++) {
                                //if (etName == "events") debugger;
                                if (etName == "events") {
                                    if (this.$eventsToCheck.indexOf((edName = (ed = et.childNodes[edi]).getAttribute("name"))) == -1
                                        && this.$waitForEvents.indexOf(edName) == -1
                                    ) {
                                        continue;
                                    }
                                    else if (this.$waitForEvents.indexOf(edName) > -1) {
                                        setWaitFor = true;
                                    }
                                    else if (this.$eventsToCheck.indexOf(edName) > -1) {
                                        setWaitFor = false;
                                    }
                                }
                                
                                if (!this.checkList[kIdx].details) this.checkList[kIdx].details = {};
                                if (!this.checkList[kIdx].details[dIdx]) this.checkList[kIdx].details[dIdx] = {};
                                if (!this.checkList[kIdx].details[dIdx][elName]) this.checkList[kIdx].details[dIdx][elName] = {};
                                if (!this.checkList[kIdx].details[dIdx][elName][etName]) this.checkList[kIdx].details[dIdx][elName][etName] = [];

                                if (typeof ((ed = et.childNodes[edi]).text) == "string") {
                                    detObj = {
                                        name : ed.getAttribute("name"),
                                        value : ed.text,
                                        type : ed.tagName
                                    }
                                    if (setWaitFor) 
                                        detObj.waitFor = true;
                                    
                                    this.checkList[kIdx].details[dIdx][elName][etName].push(detObj);
                                }
                            }
                        }
                        
                    }
                }
            }
        }
    },
    
    // playback current test
    play : function(testXml, playSpeed, o3, offset, testing) {
        apf.uirecorder.$o3          = o3;
        this.$playSpeed             = playSpeed;
        this.$curTestXml            = testXml;
        this.$curActionIdx          = 0;
        this.$windowOffset          = offset;
        this.$keyActions            = testXml.selectNodes("action[@keyActionIdx]");
        apf.uirecorder.isPlaying    = true;
        
        if (testing) {
            apf.uirecorder.isTesting    = true;
            apf.uirecorder.captureDetails   = true;
        
            this.createCheckList();

            // if capturing
            apf.uirecorder.capture.$init();
            apf.uirecorder.capture.$startTime = new Date().getTime();
            apf.uirecorder.capture.$curTestFile = this.$curTestXml.getAttribute("file");
            apf.uirecorder.capture.$curTestId = this.$curTestXml.getAttribute("name");
        }
        
        // hide debugwin if it's open
        if (apf.isDebugWindow)
            apf.$debugwin.hide();

        
        this.$startTime = new Date().getTime();
        this.$playAction();
    },
    
    // pause playback
    pause : function() {
        if (apf.uirecorder.isPaused) return;
        apf.uirecorder.isPaused = true;
        this.$startDelay = new Date().getTime();
    },
    
    // resume playback
    resume : function() {
        apf.uirecorder.isPaused = false;
        
        // no actions to execute
        var moreActions = (this.$playSpeed == "realtime") 
            ? this.$curTestXml.childNodes[this.$curActionIdx]
            : this.$keyActions[this.$curActionIdx];

        if (!moreActions) {
            this.$nextAction();
            return;
        }
        //else {
            //this.$curActionIdx++;
        //}
        
        if (this.$activeEl) {
            if (this.$curActionIdx > 0 && this.$curTestXml.childNodes[this.$curActionIdx].getAttribute("name") == "mousedown") debugger;
            //brwTest.focus();
            this.$activeEl.focus();
        }
        
        //if (!apf.uirecorder.isPaused) debugger;
//        if (this.$waitElementsInterval || apf.uirecorder.testing.$waitForInterval || apf.uirecorder.output.$popup) return;
        
        
        if (apf.uirecorder.isPaused)
            this.$testDelay += new Date().getTime() - this.$startDelay;
        
        // small delay before continuing
        setTimeout(function() {
            apf.uirecorder.playback.$playAction();
        }, 500);
    },
    
    // stop playing
    stop : function() {
        apf.uirecorder.isTesting = false;
        apf.uirecorder.isPlaying = false;
        apf.uirecorder.capture.stop();
    },
    
    $waitForChecks : function() {
        // check if not too much time has passed, 10 seconds
        var checkList;
        if ((checkList=apf.uirecorder.playback.$waitForList).length) {
            if (new Date().getTime() - apf.uirecorder.playback.$waitForStartTime > 10000) {
                clearInterval(apf.uirecorder.playback.$waitForInterval);
                apf.uirecorder.playback.$testError("It takes too long to set " + checkList[0].type + " " + checkList[0].name + " on element " + checkList[0].elName);
                return;
            }
            for (var found = [], amlNode, w, i = 0, l = checkList.length; i < l; i++) {
                // loop through detailList of action to check if event is captured
                if (!(apf.uirecorder.capture.$actionList[checkList[i].actionIdx] && apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList && apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx] && apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx][checkList[i].elName] && apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx][checkList[i].elName][checkList[i].detailType])) continue;
                //if (!(checkList[i].actionObj && checkList[i].actionObj.detailList && checkList[i].actionObj.detailList[checkList[i].checkIdx] && checkList[i].actionObj.detailList[checkList[i].checkIdx][checkList[i].elName] && checkList[i].actionObj.detailList[checkList[i].checkIdx][checkList[i].elName][checkList[i].detailType])) continue;
                for (var ji = 0, jl = apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx][checkList[i].elName][checkList[i].detailType].length; ji < jl; ji++) {
                    if (checkList[i].name == apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx][checkList[i].elName][checkList[i].detailType][ji].name) {
                        delete apf.uirecorder.playback.$waitForList[i];
                        i--;
                        l--;
                        break;
                    }
                }
                if (!checkList[i+1]) break;
            }
        }
        
        
        // no more waitFor checks, continue playback
        if (!checkList.length) {
            clearInterval(apf.uirecorder.playback.$waitForInterval);
            apf.uirecorder.playback.playAction();
            apf.dispatchEvent("aftertestwaiting");
        }
    },
    
    // init playback of action
    $playAction : function() {
        if (apf.uirecorder.isPaused) return;

        // no actions to execute
        var moreActions = (this.$playSpeed == "realtime") 
            ? this.$curTestXml.childNodes[this.$curActionIdx]
            : this.$keyActions[this.$curActionIdx];

        if (!moreActions) {
            this.$nextAction();
            return;
        }
        this.$curAction = (this.$playSpeed == "realtime") ? this.$curTestXml.childNodes[this.$curActionIdx] : this.$keyActions[this.$curActionIdx];
        if (!this.$curAction) debugger;

        // display warnings if any
/*
TEMPORARILY DISABLED
        if (this.$warningList.length && this.$curAction.getAttribute("name") != "mouseup") {
            apf.console.info("testwarning on: " + this.$curAction.getAttribute("keyActionIdx") + ". " + this.$curAction.getAttribute("name"));
            this.$activeEl = (apf.activeElement) ? apf.activeElement : null;
            apf.dispatchEvent("testwarning", {warnings: this.$warningList});
            this.$warningList = [];
            return;
        }
*/
        // wait for events before continuing
        if (this.$waitForList.length) {
            this.$waitForStartTime = new Date().getTime();
            apf.dispatchEvent("beforetestwaiting");
            this.$waitForInterval = setInterval(this.$waitForChecks, 50);
            return;
        }
        // skip non-keyactions actions
        //if (this.$curAction.getAttribute("keyActionIdx") == undefined)
            //this.$nextAction();
        
        if (this.$playSpeed == "max") {
            if (this.$curAction.getAttribute("name") == "keypress") {
                for (var i = this.$curActionIdx, l = this.$keyActions.length; i < l; i++) {
                    if (this.$keyActions[i].getAttribute("name") != "keypress") {
                        break;
                    }
                    this.$keyString += this.$keyActions[i].getAttribute("value");
                }

                if (this.$keyString != "") {
                    i--;
                    this.$speedUpTime = parseInt(this.$keyActions[i].getAttribute("time")) - parseInt(this.$curAction.getAttribute("time"));
                    this.$curActionIdx = i;
                    this.$curAction = this.$keyActions[i];
                }
            }
        }
        
        if (this.$playSpeed == "realtime") {
            if (this.$playTimer) {
                clearTimeout(this.$playTimer);
                this.$playTimer = "";
            }
            var timeout = parseInt(this.$curAction.getAttribute("time")) - this.$speedUpTime + this.$testDelay - (new Date().getTime() - this.$startTime);
            if (timeout > 0) {
                this.$playTimer = setTimeout(function() {
                    apf.uirecorder.playback.$execAction();
                }, timeout);
            }
            
            // timeout smaller or equal to 0, execute immediatly
            else {
                this.$execAction();
            }
        }
        else {
            this.$playTimer = setTimeout(function() {
                apf.uirecorder.playback.$execAction();
            }, 200);
        }
        
    },

    // get amlNode based on saved xml node
    $getAmlNode : function(amlNodeXml) {
        //amlNode with id
        var amlNode;
        if (amlNodeXml.getAttribute("id")) {
            amlNode = apf.document.getElementById(amlNodeXml.getAttribute("id"));
            return amlNode;
        }
        
        
        // amlNode with certain tagName and caption
        if (!amlNode && amlNodeXml.getAttribute("tagName")) {
            var amlNodes = apf.document.getElementsByTagName(amlNodeXml.getAttribute("tagName"))
            
            // search for amlNode with correct caption
            if (amlNodeXml.getAttribute("caption")) {
                for (var i = 0, l = amlNodes.length; i < l; i++) {
                    if (amlNodes[i].caption == amlNodeXml.getAttribute("caption")) {
                        amlNode = amlNodes[i];
                        break;
                    }
                }
            }
        }
        
        // search for amlNode based on xpath
        if (!amlNode && amlNodeXml.getAttribute("xpath")) {
            amlNode = apf.document.selectSingleNode(amlNodeXml.getAttribute("xpath"));
        }
        
        return amlNode;
    },
    
    $execAction : function() {
        if (!apf.uirecorder.isPlaying) return;
        // detect position of amlNode
        var amlNodeXml, original = {}, targetNode = null;
        if (amlNodeXml = this.$curAction.selectSingleNode("amlNode")) {
            if (this.$curAction.getAttribute("target") == "position") {
                //debugger;
            }
            else {
                var amlNode, htmlNode;

                original = {
                    x       : parseInt(amlNodeXml.getAttribute("x")),
                    y       : parseInt(amlNodeXml.getAttribute("y")),
                    width   : parseInt(amlNodeXml.getAttribute("width")),
                    height  : parseInt(amlNodeXml.getAttribute("height"))
                };

                var amlNode = this.$getAmlNode(amlNodeXml);
                if (!amlNode) {
                    // no amlNode found!
                    this.$testError("amlNode " + (amlNodeXml.getAttribute("id") || ((amlNodeXml.getAttribute("caption") ? amlNodeXml.getAttribute("tagName") + " " + amlNodeXml.getAttribute("caption") : amlNodeXml.getAttribute("xpath")))) + " not found");
                    return;
                }
                // amlNode not visible
                
                else if (amlNode.visible == false || ((amlNode.localName && amlNode.localName != "body" || !amlNode.localName) && amlNode.$ext.offsetTop == 0 && amlNode.$ext.offsetLeft == 0 && amlNode.$ext.offsetWidth == 0 && amlNode.$ext.offsetHeight == 0)) {
                    this.$testError("amlNode " + (amlNodeXml.getAttribute("id") || ((amlNodeXml.getAttribute("caption") ? amlNodeXml.getAttribute("tagName") + " " + amlNodeXml.getAttribute("caption") : amlNodeXml.getAttribute("xpath")))) + " not visible");
                    return;
                }
                
                targetNode = amlNode.$ext;
                // htmlNode of amlNode
                // multiselect selection
                
                var targetCentre = false;
                if (amlNodeXml.getAttribute("multiselect") == "true") {
                    var selectedXml;
                    if (selectedXml = amlNodeXml.selectSingleNode("selected")) {
                        var xmlNode;
                        if (amlNodeXml.getAttribute("type") == "dropdown" && this.$keyActions[parseInt(this.$curAction.getAttribute("keyActionIdx"))-1]) {
                            original = null;
                            
                            if (amlNodeXml.getAttribute("popup") && apf.popup.last) {
                                targetCentre = true;
                                var dropdownItems = apf.popup.cache[apf.popup.last].content.childNodes
                                for (var i = 0, l = dropdownItems.length; i < l; i++) {
                                    if (dropdownItems[i].innerHTML == selectedXml.getAttribute("value")) {
                                        htmlNode = dropdownItems[i];
                                        break;
                                    }
                                }
                            }
                            else {
                                htmlNode = "lastMousePosition";
                            }
                        }
                        else {
//                            if (this.$curAction.getAttribute("name") == "mouseup");
                            original = {
                                x       : parseInt(selectedXml.getAttribute("x")),
                                y       : parseInt(selectedXml.getAttribute("y")),
                                width   : parseInt(selectedXml.getAttribute("width")),
                                height  : parseInt(selectedXml.getAttribute("height"))
                            };

                            if (amlNodeXml.selectSingleNode("selected").getAttribute("value")) {
                                xmlNode = amlNode.findXmlNodeByValue(amlNodeXml.selectSingleNode("selected").getAttribute("value"));
                            }
                            if (!xmlNode && amlNodeXml.selectSingleNode("selected").getAttribute("xpath")) {
                                xmlNode = amlNode.queryNode(amlNodeXml.selectSingleNode("selected").getAttribute("xpath"));
                            }

                            // no xmlNode found
                            if (!xmlNode) {
                                this.$testError("Node with xpath \"" + amlNodeXml.selectSingleNode("selected").getAttribute("xpath") + "\" does not exist");
                                return;
                            }

                            htmlNode = apf.xmldb.findHtmlNode(xmlNode, amlNode);
                        }
                        
                        // no htmlNode found
                        if (!htmlNode) {
                            this.$testError("No htmlnode found for xpath: " + amlNodeXml.selectSingleNode("selected").getAttribute("xpath"));
                            return;
                        }
                        
                        targetNode = htmlNode;
                    }
                }
                // activeElements
                else if (amlNodeXml.getAttribute("activeElement") == "true") {
                    var activeElementXml;
                    if (activeElementXml = amlNodeXml.selectSingleNode("activeElement")) {
                        original = {
                            x       : parseInt(activeElementXml.getAttribute("x")),
                            y       : parseInt(activeElementXml.getAttribute("y")),
                            width   : parseInt(activeElementXml.getAttribute("width")),
                            height  : parseInt(activeElementXml.getAttribute("height"))
                        };

                        htmlNode = amlNode.$getActiveElements()[activeElementXml.getAttribute("name")];
                        targetNode = htmlNode;
                        //debugger;
                    }
                }
                if (amlNodeXml.getAttribute("dropTarget") == "true") {
                    var dropXml;
                    if (dropXml = amlNodeXml.selectSingleNode("dropTarget")) {
                        original = {
                            x       : parseInt(dropXml.getAttribute("x")),
                            y       : parseInt(dropXml.getAttribute("y")),
                            width   : parseInt(dropXml.getAttribute("width")),
                            height  : parseInt(dropXml.getAttribute("height"))
                        };

                        var amlNode = this.$getAmlNode(dropXml);
                        targetNode = amlNode.$ext;
                    }
                }
            }
        }
        else if (htmlElementXml = this.$curAction.selectSingleNode("htmlElement")) {
            var htmlElement;

            original = {
                x       : parseInt(htmlElementXml.getAttribute("x")),
                y       : parseInt(htmlElementXml.getAttribute("y")),
                width   : parseInt(htmlElementXml.getAttribute("width")),
                height  : parseInt(htmlElementXml.getAttribute("height"))
            };
            
            if (htmlElementXml.getAttribute("id")) {
                htmlElement = document.getElementById(htmlElementXml.getAttribute("id"));
            }
            if (!htmlElement && htmlElementXml.getAttribute("type")) {
                var htmlElements = document.getElementsByTagName(htmlElementXml.getAttribute("type"));
                
                if (htmlElementXml.getAttribute("innerHTML")) {
                    for (var i = 0, l = htmlElements.length; i < l; i++) {
                        if (htmlElements[i].innerHTML == htmlElementXml.getAttribute("innerHTML")) {
                            htmlElement = htmlElements[i];
                            break;
                        }
                    }
                }
            }
            
            targetNode = htmlElement;
        }
        
        // calculate mouse position
        var mousePos;
        if (targetNode) {
            if (targetNode != "lastMousePosition") {
                mousePos = apf.getAbsolutePosition(targetNode, document.body);

                if (original) {
                    mousePos[0] = mousePos[0] - (original.x-parseInt(this.$curAction.getAttribute("x"))) * (targetNode.offsetWidth/original.width);
                    mousePos[1] = mousePos[1] - (original.y-parseInt(this.$curAction.getAttribute("y"))) * (targetNode.offsetHeight/original.height);
                }
                else if (targetCentre) {
                    mousePos[0] = mousePos[0] + targetNode.offsetWidth/2;
                    mousePos[1] = mousePos[1] + targetNode.offsetHeight/2;
                }
                
                this.$lastMousePosition = mousePos;
            }
            else {
                mousePos = this.$lastMousePosition;
            }
        }
        
        if (mousePos == undefined) {
            mousePos = [parseInt(this.$curAction.getAttribute("x")), parseInt(this.$curAction.getAttribute("y"))];
        }
        
        // move mouse cursor to correct position
        // ssb
        if (window.external.o3) { //apf.uirecorder.$o3.window
            //apf.console.info(this.$curAction.getAttribute("name") + " moved");
            apf.uirecorder.$o3.mouseTo(
                parseInt(mousePos[0]) + apf.uirecorder.$o3.window.clientX + this.$windowOffset.left, 
                parseInt(mousePos[1]) + apf.uirecorder.$o3.window.clientY + this.$windowOffset.top, 
                window.external.o3 //apf.uirecorder.$o3.window
            );
        }
        // browser plugin
        else {
            apf.uirecorder.$o3.mouseTo(
                parseInt(mousePos[0]) + this.$windowOffset.left, 
                parseInt(mousePos[1]) + this.$windowOffset.top, 
                apf.uirecorder.$o3.window
            );
        }

        // execute action
        var aName;
        if ((aName = this.$curAction.getAttribute("name")) === "keypress") {
            // check if correct element is active/focussed for typing text
            if (amlNode && ["text", "textbox", "textarea"].indexOf(amlNode.localName) > -1 && apf.activeElement != amlNode) {
                this.$testError("Keypress action not executed on element " + (amlNodeXml.getAttribute("id") || ((amlNodeXml.getAttribute("caption") ? amlNodeXml.getAttribute("tagName") + " " + amlNodeXml.getAttribute("caption") : amlNodeXml.getAttribute("xpath")))));
                return;
            }
            if (this.$keyString) {
                apf.uirecorder.$o3.sendAsKeyEvents(this.$keyString);
                this.$keyString = "";
            }
            else
                apf.uirecorder.$o3.sendAsKeyEvents(this.$curAction.getAttribute("value"));
        }
        else if (aName === "keydown") {
            apf.uirecorder.$o3.sendKeyDown(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (aName === "keyup") {
            apf.uirecorder.$o3.sendKeyUp(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (aName === "mousedown") {
            apf.uirecorder.$o3.mouseLeftDown();
        }
        else if (aName === "mouseup") {
            apf.uirecorder.$o3.mouseLeftUp();
        }
        else if (aName === "dblClick") {
            apf.uirecorder.$o3.mouseLeftDown();
            apf.uirecorder.$o3.mouseLeftUp();
            apf.uirecorder.$o3.mouseLeftDown();
            apf.uirecorder.$o3.mouseLeftUp();
        }
        else if (aName === "mousescroll") {
            apf.uirecorder.$o3.mouseWheel(this.$curAction.getAttribute("value"));
        }
apf.console.info(aName + " executed");
        this.$nextAction();
    },
    
    $nextAction : function() {
        // perform next action
        var moreActions = (this.$playSpeed == "realtime") 
            ? this.$curTestXml.childNodes[this.$curActionIdx+1]
            : this.$keyActions[this.$curActionIdx+1];
            
        if (moreActions) {
            this.$curActionIdx++;
            this.$playAction();
        }
        // stop playback
        else {
            // display warnings if any
/*
TEMPORARILY DISABLED
            if (this.$warningList.length && this.$curAction.getAttribute("name") != "mousedown") {
                apf.dispatchEvent("testwarning", {warnings: this.$warningList});
                this.$warningList = [];
                return;
            }
*/
            setTimeout(function() {
                apf.uirecorder.playback.stop();
                apf.dispatchEvent("testcomplete");
            }, 500);
        }
    },
    
    $testError : function(msg) {
        apf.console.error("Playback failed: " + msg);
        this.stop();
        apf.dispatchEvent("testerror", {msg: msg});
    }
}
//#endif
