// #ifdef __WITH_UIRECORDER
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
apf.uirecorder = {
    $inited         : false,
    isRecording     : false,
    isPlaying       : false,
    captureDetails  : false,
    $o3             : null,
} 

apf.uirecorder.capture = {
    $curTestFile    : "",   // path of file that is being captured
    $curTestId      : "",   // name of test

    $startTime      : 0,    // time capturing is started
    $actionList     : [],
    $detailList     : {},
    $capturedEvents : {},
    
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
                        8, 46, 36, 35,          // Backspace, Del, Home, End
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
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("dblClick", e || event);
        }

        //apf.uirecorder.$o3.DOM.onmousedown = apf.uirecorder.capture.mousedown = function(e){
        document.documentElement.onmousedown = apf.uirecorder.capture.mousedown = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("mousedown", e || event);
        };

        //apf.uirecorder.$o3.DOM.onmouseup = apf.uirecorder.capture.mouseup = function(e){
        document.documentElement.onmouseup = apf.uirecorder.capture.mouseup = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return; //apf.uirecorder.isPaused ||
            apf.uirecorder.capture.$captureAction("mouseup", e || event);
        }
        
        //apf.uirecorder.$o3.DOM.onmousemove = function(e){
        document.documentElement.onmousemove = apf.uirecorder.capture.mousemove = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("mousemove", e || event);
        }
        
        // Support for Mouse Scroll event
        if(document.addEventListener) {
            /* FF */
            document.addEventListener("DOMMouseScroll", function(e) {
                if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
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
                if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
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
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            e = e || event;

            var keycode = (e.keyCode) ? e.keyCode : e.which;
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;

            apf.uirecorder.capture.$captureAction("keyup", e, keycode);
        }
        
        //apf.uirecorder.$o3.DOM.onkeydown = apf.uirecorder.capture.keydown = function(e){
        document.documentElement.onkeydown = apf.uirecorder.capture.keydown = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            e = e || event;

            var keycode = (e.keyCode) ? e.keyCode : e.which;
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;
            
            apf.uirecorder.capture.$captureAction("keydown", e, keycode);
        }
        
        //apf.uirecorder.$o3.DOM.onkeypress = apf.uirecorder.capture.keypress = function(e){
        document.documentElement.onkeypress = apf.uirecorder.capture.keypress = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
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

//            if (e.shiftKey) character = "[SHIFT]" + character;
//            if (e.altKey)   character = "[ALT]" + character;
//            if (e.ctrlKey)  character = "[CTRL]" + character;
            apf.uirecorder.capture.$captureAction("keypress", e, character);
        }
        
        // @todo fix problem with onkeyup in apf
    },

    // get all neccessary information about amlNode
    $getAmlNodeData : function(amlNode, htmlElement, eventName, value) {
        var data = {};

        // action on item of multiselect
        if (amlNode.localName == "item" && amlNode.parentNode.hasFeature(apf.__MULTISELECT__)) {
            amlNode = amlNode.parentNode;
        }

        if (amlNode.id)         data.id = amlNode.id;
        if (amlNode.caption)    data.caption = amlNode.caption;
        
        data.tagName    = amlNode.tagName;
        data.type       = amlNode.localName;
        var xpath       = apf.xmlToXpath(amlNode)
        data.xpath      = xpath.substr(xpath.indexOf("/")+1);
        if (eventName == "keypress" && amlNode.getValue())
            data.value = amlNode.getValue() + value;
        
        var pos = apf.getAbsolutePosition(amlNode.$ext, document.body);
        data.x          = pos[0];
        data.y          = pos[1];
        data.width      = amlNode.$ext.offsetWidth;
        data.height     = amlNode.$ext.offsetHeight;
        
        // multiselect amlNode
        if (amlNode.hasFeature(apf.__MULTISELECT__)) {
            if (amlNode.localName == "dropdown" && apf.popup.isShowing(40)) {
                data.popup = 40;
            }
            else if (amlNode.selected) {
                data.multiselect = "true";
                
                if (amlNode.selected) {
                    data.selected = {};
                    if (amlNode.getValue())
                        data.selected.value = amlNode.getValue();
                    var xpath = apf.xmlToXpath(amlNode.selected);
                    data.selected.xpath     = xpath.substr(xpath.indexOf("/")+1);

                    pos = apf.getAbsolutePosition(amlNode.$selected, document.body);
                    data.selected.x         = pos[0];
                    data.selected.y         = pos[1];
                    data.selected.width     = amlNode.$selected.offsetWidth;
                    data.selected.height    = amlNode.$selected.offsetHeight;
                    
                    if (eventName == "mouseup" && this.$prevMouseDownAction) {
                        this.$prevMouseDownAction.amlNode = data;
                    }
                }
            }
        }
        // mouseup after selecting dropdown item, set dropdown as amlNode, dropdown popup not visible after mousedown and mouseup
        else if (eventName == "mouseup" && this.$prevMouseDownAction && this.$prevMouseDownAction.amlNode.type == "dropdown") {
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
        
        return data;
    },
    
    $captureAction : function(eventName, e, value) {
        //if (!apf.uirecorder.$inited) return;
        var htmlElement = (e) ? e.srcElement || e.target : null;
        var amlNode     = (htmlElement && apf.findHost(htmlElement) && apf.findHost(htmlElement).tagName) ? apf.findHost(htmlElement) : null;

        if (this.$mousedownMode || eventName != "mousemove") {
            if (amlNode) {
                var amlNodeData = this.$getAmlNodeData(amlNode, htmlElement, eventName, value);
            }
            else if (htmlElement) {
                var htmlElementData = this.$getHtmlElementData(htmlElement);
            }
        }

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
        if (e && e.clientX)     actionObj.x             = parseInt(e.clientX);
        if (e && e.clientY)     actionObj.y             = parseInt(e.clientY);
        if (value)              actionObj.value         = value;

        for (var eventName in this.$capturedEvents) {
            actionObj.events = this.$capturedEvents;
            
            if (actionObj.events["dragdrop"]) {
                actionObj.dropTarget    = this.$getAmlNodeData(actionObj.events["dragdrop"].dropTarget);
                actionObj.amlNode       = this.$getAmlNodeData(actionObj.events["dragdrop"].amlNode);
            }
                
            this.$capturedEvents = {};
            break;
        }
            
        for (var elName in this.$detailList) {
            actionObj.detailList[0] = this.$detailList;
            this.$detailList = {};
            break;
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
        
        // ignore single mousemove action between mousedown/mouseup combo
        
        
        // save action object
        this.$actionList.push(actionObj);
        this.$prevAction = actionObj;
        if (eventName == "mousedown") this.$prevMouseDownAction = actionObj;
    },
    
    $getTargetName : function(eventName, e) {
        var amlNode = e.amlNode || e.currentTarget;
        if (eventName == "movefocus")
            amlNode = e.toElement;
        else if (eventName == "DOMNodeRemoved")
            amlNode = e.relatedNode;
            
        // get name of target
        var targetName;

        // aml element
        if (amlNode && amlNode.parentNode && amlNode.tagName && !apf.xmlToXpath(amlNode) != "html[1]") {
            targetName = amlNode.id || apf.xmlToXpath(amlNode);
            if (targetName.indexOf("/text()") > -1) {
                targetName = targetName.substr(0, targetName.length - "/text()[x]".length);    
            }
        }
        // html element
        else if (amlNode && e.htmlEvent) {
            // skip capturing event calls on html element, already captured on amlNodes
            if (["keydown", "hotkey"].indexOf(eventName) > -1) return;
            var htmlElement = e.htmlEvent.srcElement;
            targetName = apf.xmlToXpath(htmlElement);//("&lt;" + htmlElement.tagName + "&gt; " + htmlElement.id) || "&lt;" + htmlElement.tagName + "&gt;";
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
    
    validEvents : ["beforedrag", "afterdrag", "dragstart", "dragdrop"],
    captureEvent : function(eventName, e) {
        //if (!apf.uirecorder.$inited) return;
        if (this.validEvents.indexOf(eventName) == -1) return;
        var target = this.$getTargetName(eventName, e);
        var eventObj = {
            //time        : time,
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
        if (this.$capturedEvents[eventName]) debugger;
        this.$capturedEvents[eventName] = eventData;
    },
    capturePropertyChange : function(amlNode, prop, value) {
        //if (!apf.uirecorder.$inited) return;
    },
    captureModelChange : function(params) {
        //if (!apf.uirecorder.$inited) return;
    },
    
    // save captured test data
    $saveTest : function() {
        var testXml = apf.getXml("<test />");
        testXml.setAttribute("name", apf.uirecorder.capture.$curTestId);
        
        var actionList = [];
        /* special cases */
        // only one click recorded
        if ((this.$keyActions.length == 2 && this.$keyActions[0].name == "mousedown" && this.$keyActions[1].name == "mouseup")
        //|| (this.$keyActions.length == 2 && this.$keyActions[0].name == "mousedown" && this.$keyActions[1].name == "mousemove" && this.$keyActions[2].name == "mouseup")
        ) {
            actionList = this.$keyActions;
            actionList[0].time = 0;
            actionList[1].time = 100;

            if (this.$keyActions[1].amlNode.type != "list") {
                if (!this.$keyActions[1].amlNode.activeElement)
                    testXml.setAttribute("name", "click on " + (this.$keyActions[0].amlNode.id || (this.$keyActions[0].amlNode.caption ? this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.caption : null) || (this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.xpath)));
                else
                    testXml.setAttribute("name", "click on " + this.$keyActions[1].amlNode.activeElement.name + " of " + (this.$keyActions[0].amlNode.id || (this.$keyActions[0].amlNode.caption ? this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.caption : null) || (this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.xpath)));
            }
            else {
                testXml.setAttribute("name", "select " + this.$keyActions[1].amlNode.type + " item " + (this.$keyActions[1].amlNode.selected.value || this.$keyActions[1].amlNode.selected.xpath));
            }
        }

        // other
        else {
            // caption for dragging element
            if ( (this.$keyActions[0] && this.$keyActions[0].name == "mousedown" && this.$keyActions[this.$keyActions.length-1] && this.$keyActions[this.$keyActions.length-1].name == "mouseup" && this.$keyActions[this.$keyActions.length-1].events && this.$keyActions[this.$keyActions.length-1].events["afterdrag"]) 
                || (this.$keyActions[0] && this.$keyActions[0].name == "mousedown" && this.$keyActions[this.$keyActions.length-1] && this.$keyActions[this.$keyActions.length-1].name == "mouseup" && this.$keyActions[0].events && this.$keyActions[0].events["dragstart"] && this.$keyActions[this.$keyActions.length-1].events && this.$keyActions[this.$keyActions.length-1].events["dragdrop"])
                )  {
                if (this.$keyActions[this.$keyActions.length-1].amlNode.selected && this.$keyActions[this.$keyActions.length-1].dropTarget) {
                    testXml.setAttribute("name", "drag '" + (this.$keyActions[this.$keyActions.length-1].amlNode.selected.value || this.$keyActions[this.$keyActions.length-1].amlNode.selected.xpath) + "' to " + (this.$keyActions[this.$keyActions.length-1].dropTarget.id || (this.$keyActions[this.$keyActions.length-1].dropTarget.caption ? this.$keyActions[this.$keyActions.length-1].dropTarget.type + " " + this.$keyActions[this.$keyActions.length-1].dropTarget.caption : null) || (this.$keyActions[this.$keyActions.length-1].dropTarget.type + " " + this.$keyActions[this.$keyActions.length-1].dropTarget.xpath)));
                }
                else {
                    testXml.setAttribute("name", "drag '" + (this.$keyActions[0].amlNode.id || (this.$keyActions[0].amlNode.caption ? this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.caption : null) || (this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.xpath)) +"'");
                }
            }
            // caption for selecting item in dropdown
            else if (this.$keyActions[0] && this.$keyActions[0].name == "mousedown" && this.$keyActions[1] && this.$keyActions[1].name == "mouseup" && this.$keyActions[1].amlNode.popup == 40 && this.$keyActions[2] && this.$keyActions[2].name == "mousedown" && this.$keyActions[2].amlNode.type == "dropdown" && this.$keyActions[3] && this.$keyActions[3].name == "mouseup")  {
                testXml.setAttribute("name", "select " + this.$keyActions[2].amlNode.type + " item '" + (this.$keyActions[2].amlNode.selected.value || this.$keyActions[2].amlNode.selected.xpath) + "'");
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
                        testXml.setAttribute("name", "type " + this.$keyActions[i].amlNode.value + " in '" + this.$keyActions[i].amlNode.type + "' " + (this.$keyActions[0].amlNode.id || (this.$keyActions[0].amlNode.caption ? this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.caption : null) || (this.$keyActions[0].amlNode.type + " " + this.$keyActions[0].amlNode.xpath)));
                }
            }
            
            
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
        }

        testXml.setAttribute("file", apf.uirecorder.capture.$curTestFile);
        
        var detailTypes = {"events": "event", "properties": "property", "data": "dataItem"};
        for (var dragMode = false, prevNode, action, aNode, amlNodeName, i = 0, l = actionList.length; i < l; i++) {
            action = actionList[i];
            
            // skip current action if next action is played at same time
            //if (actionList[i+1] && action.time == actionList[i+1].time) continue;
            
            // skip small mousemove between certain actions, like between mousedown/mouseup
            if (action.name == "mousemove" && actionList[i-1] && actionList[i-1].name == "mousedown" && actionList[i+1] && actionList[i+1].name == "mouseup") {
            debugger;
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
                    htmlElement.setAttribute("type", action.htmlElement.type.toLowerCase());
                    htmlElement.setAttribute("tagName", action.htmlElement.tagName.toLowerCase());
                    if (action.htmlElement.innerHTML) htmlElement.setAttribute("innerHTML", action.htmlElement.innerHTML);
                    aNode.appendChild(htmlElement);
                    
//                    if (specialAction)
//                        testXml.setAttribute("name", specialAction + (action.htmlElement.id || (action.htmlElement.type.toLowerCase() + " " + action.htmlElement.innerHTML)));
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
                
//                if (specialAction)
//                    testXml.setAttribute("name", testXml.getAttribute("name") + " on " + (action.dropTarget.id || (action.dropTarget.caption ? action.dropTarget.type + " " + action.dropTarget.caption : null) || (action.dropTarget.type + " " + action.dropTarget.xpath)));

                amlNode.appendChild(dropNode);
            }

            // set value
            if (action.value != undefined) aNode.setAttribute("value", action.value);
            if (action.multiselect != undefined) aNode.setAttribute("multiselect", action.multiselect.toString());
            if (action.multiselectValue != undefined) aNode.setAttribute("multiselectValue", action.multiselectValue);
            if (action.multiselectItem != undefined) aNode.setAttribute("multiselectItem", action.multiselectItem);
            
            // set apf.activeElement
            if (action.activeElement) {
                var eNode, iNode;
                eNode = testXml.ownerDocument.createElement("element");
                eNode.setAttribute("name", "apf");
                iNode = testXml.ownerDocument.createElement("activeElement");
                iNode.appendChild(testXml.ownerDocument.createTextNode(action.activeElement));
                eNode.appendChild(iNode);
                
                aNode.appendChild(eNode);
            }
            
            // loop through detailList
            //if (action.detailList) {
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
                        //if (type == "properties" && action.name != "mousemove") debugger;
                            dNode = testXml.ownerDocument.createElement(type)
                            for (var item, vNode, di = 0, dl = action.detailList[dli][elementName][type].length; di < dl; di++) {
                                item = action.detailList[dli][elementName][type][di];
                                iNode = testXml.ownerDocument.createElement(detailTypes[type]);
                                iNode.setAttribute("name", item.name);
                                if (type == "events") {
                                    var caption = item.name;
                                    if (item.calls) {
                                        caption = (item.calls) ? caption + " (" + item.calls+ "x)" : caption;
                                        //caption = (item.value) ? caption + ": " + item.value : caption;
                                   }
                                   iNode.setAttribute("caption", caption || item.name);
                                }

                                // time
                                //iNode.setAttribute("time", item.time);
                                
                                if (item.value || typeof item.value == "boolean") {
                                    if (typeof item.value === "string")
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(item.value));
                                    else if (item.value.value != undefined)
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(item.value.value));
                                    else
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(apf.serialize(item.value).split("<").join("&lt;").split(">").join("&gt;")))
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
    
    $windowOffset   : [0, 0],       // object with top/left offset of browser element in relation to client window
    $testDelay      : 0,            // save amount of time the playback is delayed due to pauses, for example by popups
    $speedUpTime    : 0,
    $keyString      : "",
    
    $lastMousePosition : [0, 0],
    
    test : function(testXml, playSpeed, o3, offset) {
        this.play(testXml, playSpeed, o3, offset);
    },
    
    // playback current test
    play : function(testXml, playSpeed, o3, offset) {
        apf.uirecorder.$o3          = o3;
        this.$playSpeed             = playSpeed;
        this.$curTestXml            = testXml;
        this.$curActionIdx          = 0;
        this.$windowOffset          = offset;
        this.$keyActions            = testXml.selectNodes("action[@keyActionIdx]");
        apf.uirecorder.isPlaying    = true;
        
        // if testing, this.$createCheckList();
        
        // hide debugwin if it's open
        if (apf.isDebugWindow)
            apf.$debugwin.hide();
            
        // if capturing
        //apf.uirecorder.capture.$init();
        //apf.uirecorder.capture.$startTime = new Date().getTime();
        this.$startTime = new Date().getTime();
        this.$playAction();
    },
    
    // stop playing
    stop : function() {
        apf.uirecorder.isPlaying = false;
    },
    
    // init playback of action
    $playAction : function() {
        // no actions to execute
        if (!this.$curTestXml.childNodes.length) {
            this.$nextAction();
            return;
        }
        this.$curAction = this.$curTestXml.childNodes[this.$curActionIdx];
        if (!this.$curAction) debugger;

        // skip non-keyactions actions
        if (this.$curAction.getAttribute("keyActionIdx") == undefined)
            this.$nextAction();
        
        //if (this.$playSpeed == "max") {
            if (this.$curAction.getAttribute("name") == "keypress") {
                for (var i = this.$curActionIdx, l = this.$curTestXml.childNodes.length; i < l; i++) {
                    if (this.$curTestXml.childNodes[i].getAttribute("name") != "keypress") {
                        break;
                    }
                    this.$keyString += this.$curTestXml.childNodes[i].getAttribute("value");
                }

                if (this.$keyString != "") {
                    i--;
                    this.$speedUpTime = parseInt(this.$curTestXml.childNodes[i].getAttribute("time")) - parseInt(this.$curAction.getAttribute("time"));
                    this.$curActionIdx = i;
                    this.$curAction = this.$curTestXml.childNodes[i];
                }
            }
        //}
        
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
            }, 100);
        }
    },
    
    // get amlNode based on saved xml node
    $getAmlNode : function(amlNodeXml) {
        //amlNode with id
        var amlNode;
        if (amlNodeXml.getAttribute("id")) {
            amlNode = apf.document.getElementById(amlNodeXml.getAttribute("id"));
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
                    this.$testFailed("amlNode " + (amlNodeXml.getAttribute("id") || ((amlNodeXml.getAttribute("caption") ? amlNodeXml.getAttribute("tagName") + " " + amlNodeXml.getAttribute("caption") : amlNodeXml.getAttribute("xpath")))) + " not found");
                    return;
                }
                // amlNode not visible
                else if (!amlNode.visible || (amlNode.$ext.offsetTop == 0 && amlNode.$ext.offsetLeft == 0 && amlNode.$ext.offsetWidth == 0 && amlNode.$ext.offsetHeight == 0)) {
                    this.$testFailed("amlNode " + (amlNodeXml.getAttribute("id") || ((amlNodeXml.getAttribute("caption") ? amlNodeXml.getAttribute("tagName") + " " + amlNodeXml.getAttribute("caption") : amlNodeXml.getAttribute("xpath")))) + " not visible");
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
                            
                            if (this.$keyActions[parseInt(this.$curAction.getAttribute("keyActionIdx"))-1].selectSingleNode("amlNode").getAttribute("popup") == "40") {
                                targetCentre = true;
                                var dropdownItems = apf.popup.cache[this.$keyActions[parseInt(this.$curAction.getAttribute("keyActionIdx"))-1].selectSingleNode("amlNode").getAttribute("popup")].content.childNodes
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
                                this.$testFailed("Node with xpath \"" + amlNodeXml.selectSingleNode("selected").getAttribute("xpath") + "\" does not exist");
                                return;
                            }

                            htmlNode = apf.xmldb.findHtmlNode(xmlNode, amlNode);
                        }
                        
                        // no htmlNode found
                        if (!htmlNode) {
                            this.$testFailed("No htmlnode found for xpath: " + amlNodeXml.selectSingleNode("selected").getAttribute("xpath"));
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
        if (this.$curAction.getAttribute("name") === "keypress") {
            if (this.$keyString) {
                apf.uirecorder.$o3.sendAsKeyEvents(this.$keyString);
                this.$keyString = "";
            }
            else
                apf.uirecorder.$o3.sendAsKeyEvents(this.$curAction.getAttribute("value"));
        }
        else if (this.$curAction.getAttribute("name") === "keydown") {
            apf.uirecorder.$o3.sendKeyDown(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (this.$curAction.getAttribute("name") === "keyup") {
            apf.uirecorder.$o3.sendKeyUp(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (this.$curAction.getAttribute("name") === "mousedown") {
            apf.uirecorder.$o3.mouseLeftDown();
        }
        else if (this.$curAction.getAttribute("name") === "mouseup") {
            apf.uirecorder.$o3.mouseLeftUp();
        }
        else if (this.$curAction.getAttribute("name") === "dblClick") {
            apf.uirecorder.$o3.mouseLeftDown();
            apf.uirecorder.$o3.mouseLeftUp();
            apf.uirecorder.$o3.mouseLeftDown();
            apf.uirecorder.$o3.mouseLeftUp();
        }
        else if (this.$curAction.getAttribute("name") === "mousescroll") {
            apf.uirecorder.$o3.mouseWheel(this.$curAction.getAttribute("value"));
        }
        
        this.$nextAction();
    },
    
    $nextAction : function() {
        // perform next action
        if (this.$curTestXml.childNodes.length > this.$curActionIdx + 1) {
            this.$curActionIdx++;
            this.$playAction();
        }
        // stop playback
        else {
            //apf.uirecorder.output.createTestResultsXml();
            this.stop();
            apf.dispatchEvent("apftest_testcomplete");
        }
    },
    
    $testFailed : function(msg) {
        apf.console.error("Playback failed: " + msg);
        this.stop();
        apf.dispatchEvent("apftest_testfailed");
    }
}
//#endif
