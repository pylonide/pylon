// #ifdef __WITH_UIRECORDER
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
apf.uirecorder = {
    $inited     : false,
    isRecording : false,
    isPlaying   : false,
    isTesting   : false,
    isPaused    : false,

    setTimeout  : self.setTimeout,
    
    actionList  : [],   // list of captured user actions
    detailList  : {},   // list of captured events, property changes and model data changes 
    testResults : {     // list of notices, warnings and errors found after testing
        error      : {},
        warning    : {},
        notice     : {}
    },
    settings    : {},
    $settingsChanged    : false,
    testResultsXml      : null,
    testListXml         : null,     // xml object with captured tests
    resultListXml       : null,     // xml object with results after testing
    outputXml           : null,     // output xml for recorded test or test results
    settingsXml         : null,     // output xml for test settings
    
    debug : function() {
        debugger;
    }
} 

apf.uirecorder.capture = {
    /*
     * capturing vars and methods 
     */
    $startTime                  : 0,    // starttime of recording
    $curTestFile                : "",   // current file being recorded
    $capturedEventList          : {},   // list of all events captured for current action
    $capturedPropertyChangeList : {},   // list of all property changes captured for current action
    $capturedModelChangeList    : {},   // list of all model changes captured for current action
    
    $keyActionIdx       : 0,
    $keyActionList      : ["mousedown", "mouseup", "dblClick", "keydown", "keyup", "keypress"], // all actions that are always set as keyAction
    $setAsKeyAction     : false,        // flag to set all actions as keyactions, like all mousemovements between mousedown and mouseup

    $validKeys          : [37, 38, 39, 40, 27, 16, 17, 18, 13], //arrowkeys, Esc, shift, ctrl, alt, Enter
    // init capturing of user interaction
    $init : function() {
        if (apf.uirecorder.$inited) return;
        apf.uirecorder.$inited = true;

        // listeners for user mouse interaction
        document.documentElement.ondblclick = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("dblClick", e || event);
        }
        
        document.documentElement.onmousedown = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.console.info("mousedown");
            apf.uirecorder.capture.$captureAction("mousedown", e || event);
        }

        document.documentElement.onmouseup = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return; //apf.uirecorder.isPaused ||
            apf.console.info("mouseup");
            apf.uirecorder.capture.$captureAction("mouseup", e || event);
        }
        
        document.documentElement.onmousemove = function(e) {
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
            document.onmousewheel = function(e) {
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
        // onkeyup does get called in SSB for some reason but does in the browser plugin
        document.documentElement.onkeyup = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            e = e || event;

            var keycode = (e.keyCode) ? e.keyCode : e.which;
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;

            apf.uirecorder.capture.$captureAction("keyup", e, keycode);
        }
        
        document.documentElement.onkeydown = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            e = e || event;
            var keycode = (e.keyCode) ? e.keyCode : e.which;
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;
            
            apf.uirecorder.capture.$captureAction("keydown", e, keycode);
        }
        
        document.documentElement.onkeypress = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;

            if (apf.uirecorder.capture.$validKeys.indexOf(e.keyCode) > -1) return;
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

    // Reset capturing
    reset : function() {
        apf.uirecorder.$inited              = false;
        apf.uirecorder.isRecording          = false;
        apf.uirecorder.actionList   = [];
        apf.uirecorder.detailList   = {};
    },

    // Initiate user interface recorder and start recording
    record : function(file, testId) {
        apf.uirecorder.capture.reset();

        apf.uirecorder.capture.$curTestFile = file;
        apf.uirecorder.capture.$curTestId   = testId;
        apf.uirecorder.capture.$startTime   = new Date().getTime();
        apf.uirecorder.isRecording          = true;

        apf.uirecorder.capture.$init();
    },
    
    // Stop capturing and save test
    stop : function() {
        apf.uirecorder.$inited              = false;
        if (apf.uirecorder.isRecording) {
            apf.uirecorder.output.$saveTest("test");
        }
        if (apf.uirecorder.isTesting) {
            apf.uirecorder.output.$saveTest("results");
        }
        //debugger;
        //apf.uirecorder.capture.reset();
    },

    /* 
     * capture user actions
     * htmlElement : original html element on which the event occurred
     * htmlNode    : specific container that holds the htmlElement described above
     */
    $captureAction : function(eventName, e, value) {
        if (!apf.uirecorder.$inited) return;
        var htmlElement = (e) ? e.srcElement || e.target : null;
        var amlNode     = (htmlElement && apf.findHost(htmlElement) && apf.findHost(htmlElement).tagName) ? apf.findHost(htmlElement) : null;

        if (apf.uirecorder.playback.$getKeyActionIdx(eventName) !== false)
            apf.uirecorder.output.testLog.push(apf.uirecorder.playback.$getKeyActionIdx(eventName) + ". $captureAction(): captured action: " + eventName);
        // search for related htmlNode
        if (eventName != "mousemove") {
            var htmlNode, htmlNodeName;

            // search for active elements in amlNodes
            if (amlNode && amlNode.$getActiveElements) {
                var activeElements = amlNode.$getActiveElements();
                if (activeElements) {
                    for (var name in activeElements) {
                        if (apf.isChildOf(activeElements[name], htmlElement, true)) {
                            htmlNode = activeElements[name];
                            htmlNodeName = name;
                            break;
                        }
                    }
                }
            }
            
            // search for active elements in popup
            /*
            if (apf.popup.isShowing(apf.popup.last)) {
                if (apf.isChildOf(apf.popup.cache[apf.popup.last].content, htmlElement, true)) {
                    //debugger;
                    htmlNode = htmlElement;
                    htmlNodeName = "popup";
                }
            }
            */
            
            // get htmlNode
            //apf.queryNodes(htmlNode.substr(8), apf.document)
          
            // multiselect item
            var multiselectValue = null;
            var multiselect = null;
            var multiselectItem = null;

            if (eventName != "mousemove") {
                if (amlNode && amlNode.hasFeature(apf.__MULTISELECT__) && amlNode.selected) {
                    multiselect = true;
                    multiselectItem = apf.xmlToXpath(amlNode.selected);
                    htmlNode = htmlElement;
                    htmlNodeName = apf.xmlToXpath(htmlElement, amlNode.$selected).toLowerCase();
//debugger;
/*
                    //if (amlNode.getValue() == undefined) {
                        //amlNode = null;
                        htmlNode = htmlElement;
                        htmlNodeName = htmlElement.id || apf.xmlToXpath(htmlElement).toLowerCase();
                        //amlNode.queryNodes("//product[1]")[0]; 
                        debugger;
                    //}
*/
                    //else {
                    /*
                        var multiselectValue = amlNode.value;
                        //debugger;
                        apf.console.info("multiselect found");
                        htmlNodeName = "multiselect";
                        htmlNode = htmlElement;
                    */
                    //}
                }
            }

            // is multiselect widget
            // @todo generate name for multiselect htmlNode item
/*
            if (amlNode && amlNode.hasFeature(apf.__MULTISELECT__)) {// && amlNode.selected) {
                //debugger;
                //var xpath = apf.xmlToXpath(amlNode.selected);
                //htmlNode = apf.xmldb.findHtmlNode(amlNode.selected, amlNode);
                //htmlNodeName = htmlNode.innerText;
            }
*/
            if (!htmlNode) {
                
                if (amlNode && amlNode.nodeName != "lm") {
                    htmlNode = amlNode.$ext;
                    htmlNodeName = "$ext";
                    //if (eventName == "mousedown") debugger;
                }
                else {
                    amlNode = null;
                    htmlNodeName = apf.xmlToXpath(htmlElement).toLowerCase();
                    htmlNode = htmlElement;
                    if (htmlNodeName.indexOf("html[") != 0) debugger;
                }
            }
            else if (htmlElement) {
                htmlNodeName = apf.xmlToXpath(htmlElement).toLowerCase();
                htmlNode = htmlElement;
                if (htmlNodeName.indexOf("html[") != 0) debugger;
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

        //if (htmlElement)    actionObj.htmlElement   = htmlElement;
        if (amlNode)        actionObj.amlNode       = amlNode;
        if (e && e.clientX) actionObj.x             = parseInt(e.clientX);
        if (e && e.clientY) actionObj.y             = parseInt(e.clientY);
        if (value)          actionObj.value         = value;

// ignore repeating mousemoves
/*
if (apf.uirecorder.actionList.length) {
//    if (eventName == apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name && actionObj.time == apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].time && actionObj.x == apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].x && actionObj.y == apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].y) {
    if (eventName == apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name && actionObj.time == apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].time) {
        debugger;
        if (eventName != "mousemove") debugger;
        return;
    }
}
*/
        /*
        if (eventName == "mousedown") {
            this.$setAsKeyAction = true;
        }
        else if (eventName == "mouseup") {
            this.$setAsKeyAction = false;
        }
        */
        if (this.$keyActionList.indexOf(eventName) > -1) { // || this.$setAsKeyAction  
            actionObj.keyActionIdx = this.$keyActionIdx;
            this.$keyActionIdx++;

            // set caption of htmlElementCaption
            if (htmlElement) {
                var targetValue = "";
                switch (htmlElement.nodeName.toLowerCase()) {
                    case "a":
                        targetValue = htmlElement.innerHTML
                        break;
                    case "input":
                        targetValue = htmlElement.value;
                        break;
                    case "img":
                        targetValue = htmlElement.alt || htmlElement.src;
                        break;
                    case "div":
                        targetValue = htmlElement.innerHTML
                        break;
                }
            }
            actionObj.target = {
                nodeName    : htmlElement.nodeName.toLowerCase(),
                value       : targetValue,
                caption     : htmlElement.nodeName.toLowerCase() + ":" + targetValue
            }
        }
        
        
        // set htmlElement
        if (htmlElement)
            actionObj.htmlElement = htmlElement;

        // set properties of htmlNode
        if (htmlNode) {
            var pos = apf.getAbsolutePosition(htmlNode, htmlNode.parentNode);
            actionObj.htmlNode = {
                name        : htmlNodeName,
                width       : htmlNode.offsetWidth,
                height      : htmlNode.offsetHeight,
                x           : parseInt(pos[0]),
                y           : parseInt(pos[1]),
                scrollTop   : htmlNode.scrollTop,
                scrollLeft  : htmlNode.scrollLeft
            }
            if (!htmlNode.scrollTop && htmlNode.scrollTop != 0) debugger;
        }
        
        if (multiselect) actionObj.multiselect = multiselect;
        if (multiselectValue != undefined) actionObj.multiselectValue = multiselectValue;
        if (multiselectItem != undefined) actionObj.multiselectItem = multiselectItem;
            
        // process detailList
        // set init action, overwriting first (mousemove) action
        if (apf.uirecorder.actionList.length == 0) {
            actionObj.name = "init";
            actionObj.detailList[0] = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {};
            apf.uirecorder.actionList.push(actionObj);
            return;
        }

        // save reference to first mousemove object
        var index, delayObj;
        if (apf.uirecorder.actionList.length == 1 || (apf.uirecorder.actionList.length > 1 && eventName == "mousemove" && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name != "mousemove")) {
            actionObj.index = apf.uirecorder.actionList.length;
            apf.uirecorder.capture.firstMousemoveObj = actionObj;
        }
        
        // combine mousemove actions
/*
        if (apf.uirecorder.actionList.length > 1 && eventName == "mousemove" && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name == "mousemove") {
            for (var elementName in apf.uirecorder.detailList) {
                if (!apf.uirecorder.capture.firstMousemoveObj.detailList[0]) apf.uirecorder.capture.firstMousemoveObj.detailList[0] = {};
                if (!apf.uirecorder.capture.firstMousemoveObj.detailList[0][elementName]) apf.uirecorder.capture.firstMousemoveObj.detailList[0][elementName] = {
                    amlNode     : apf.uirecorder.detailList[elementName].amlNode,
                    events      : [],
                    properties  : [],
                    data        : []
                };
    
                apf.uirecorder.capture.firstMousemoveObj.detailList[0][elementName].events     = apf.uirecorder.capture.firstMousemoveObj.detailList[0][elementName].events.concat(apf.uirecorder.detailList[elementName].events);
                apf.uirecorder.capture.firstMousemoveObj.detailList[0][elementName].properties = apf.uirecorder.capture.firstMousemoveObj.detailList[0][elementName].properties.concat(apf.uirecorder.detailList[elementName].properties);
                apf.uirecorder.capture.firstMousemoveObj.detailList[0][elementName].data       = apf.uirecorder.capture.firstMousemoveObj.detailList[0][elementName].data.concat(apf.uirecorder.detailList[elementName].data);
            }
            apf.uirecorder.detailList   = {};
            actionObj.ignore            = "true";
            apf.uirecorder.actionList.push(actionObj);

            delayObj    = apf.uirecorder.capture.firstMousemoveObj;
            index       = apf.uirecorder.capture.firstMousemoveObj.index;
        }
        else {
*/      

            for (var elName in apf.uirecorder.detailList) {
                actionObj.detailList[0] = apf.uirecorder.detailList;
                apf.uirecorder.detailList = {};
                break;
            }

            // no default keyAction, like mousemove
/*
            if (this.$keyActionList.indexOf(eventName) == -1) {
                var isKeyAction = false;
                // check for certain events, or any prop/model change
                for (var elName in actionObj.detailList[0]) {
                    if (actionObj.detailList[0][elName].events && actionObj.detailList[0][elName].events.length) {
                        for (var i = 0, l = actionObj.detailList[0][elName].events.length; i < l; i++) {
                            if (actionObj.detailList[0][elName].events[i].name == "beforeload") {
                                isKeyAction = true;
                            }
                        }
                    }
                    // property change / model data change
                    if ((actionObj.detailList[0][elName].properties && actionObj.detailList[0][elName].properties.length) || (actionObj.detailList[0][elName].data && actionObj.detailList[0][elName].data.length)) {
                        isKeyAction = true;
                    }
                }
                
                if (isKeyAction || this.setNextMousemoveAsKeyAction) {
                    if (this.setNextMousemoveAsKeyAction && eventName == "mousemove") {
                        this.setNextMousemoveAsKeyAction = false;
                    }
                    // if action is mousemove, set previous mousemove as keyaction too
                    else if (eventName == "mousemove" && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name == "mousemove") {
                        apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].keyActionIdx = this.$keyActionIdx;
                        this.$keyActionIdx++;
                    }
                    // if action is mousemove, set next mousemove as keyaction too
                    else if (eventName == "mousemove" && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name != "mousemove") {
                        apf.uirecorder.capture.setNextMousemoveAsKeyAction = true;
                    }
                    else {
                        debugger;
                    }
                    
                    actionObj.keyActionIdx = this.$keyActionIdx;
                    this.$keyActionIdx++;
                }
            }
*/
            delayObj = actionObj;
            index = actionObj.index = apf.uirecorder.actionList.length;
//        }
        
        // save action object
        apf.uirecorder.actionList.push(actionObj);
        
        
        //For new timeouts associated with the next action.
        var currentState = apf.uirecorder.capture.current = {};

        //For all the running timeouts
        apf.uirecorder.capture.current.actionObj = delayObj;
        apf.uirecorder.capture.current.index     = index;
        apf.uirecorder.capture.current.eventName = eventName;
        
        apf.uirecorder.capture.current.actionIdx = apf.uirecorder.testing.$curActionIdx;
        if (apf.uirecorder.isTesting)
            apf.uirecorder.capture.current.keyActionIdx = apf.uirecorder.playback.$getKeyActionIdx(eventName);

        // delayed capturing of events
        var recursion = false;

        $setTimeout = function(f, ms){
            //if (recursion || !apf.uirecorder.$inited)
            if (!apf.uirecorder.$inited)
                return;
            
            //Record current mouseEvent
            if (!ms) ms = null;
            return apf.uirecorder.setTimeout(function(){
                //apf.console.info("setTimeout");
                recursion = true;
                apf.uirecorder.capture.$runInContext(currentState, f);
                recursion = false;
            }, ms);
        }

        // create event list during testing, used to check if certain events are already called for an element
        if (apf.uirecorder.isTesting) {
            if (actionObj.detailList[0]) {
                // loop throught elements
                for (var elName in actionObj.detailList[0]) {
                    // collect captured events
                    if (actionObj.detailList[0][elName].events && actionObj.detailList[0][elName].events.length) {
                        // loop through detailList events
                        for (var i = 0, l = actionObj.detailList[0][elName].events.length; i < l; i++) {
                            if (!this.$capturedEventList[elName]) this.$capturedEventList[elName] = [];
                            this.$capturedEventList[elName].push(actionObj.detailList[0][elName].events[i].name);
                        }
                    }
                    // collect captured propchanges
                    if (actionObj.detailList[0][elName].properties && actionObj.detailList[0][elName].properties.length) {
                        // loop through detailList properties
                        for (var val, i = 0, l = actionObj.detailList[0][elName].properties.length; i < l; i++) {
                            if (!this.$capturedPropertyChangeList[elName]) this.$capturedPropertyChangeList[elName] = {};
                            if (!this.$capturedPropertyChangeList[elName][actionObj.detailList[0][elName].properties[i].name]) this.$capturedPropertyChangeList[elName][actionObj.detailList[0][elName].properties[i].name] = {};

                            val = (typeof apf.uirecorder.actionList[index].detailList[0][elName].properties[i].value == "string") 
                                ? apf.uirecorder.actionList[index].detailList[0][elName].properties[i].value
                                : (apf.uirecorder.actionList[index].detailList[0][elName].properties[i].value.value != undefined)
                                    ? apf.uirecorder.actionList[index].detailList[0][elName].properties[i].value.value
                                    : apf.serialize(apf.uirecorder.actionList[index].detailList[0][elName].properties[i].value);
                            this.$capturedPropertyChangeList[elName][actionObj.detailList[0][elName].properties[i].name] = val;
                        }
                    }
                    // collect captured modelchanges
                    if (actionObj.detailList[0][elName].data && actionObj.detailList[0][elName].data.length) {
                        // loop through detailList model changes
                        for (var val, i = 0, l = actionObj.detailList[0][elName].data.length; i < l; i++) {
                            if (!this.$capturedModelChangeList[elName]) this.$capturedModelChangeList[elName] = {};
                            if (!this.$capturedModelChangeList[elName][actionObj.detailList[0][elName].data[i].name]) this.$capturedModelChangeList[elName][actionObj.detailList[0][elName].data[i].name] = {};

                            val = (typeof apf.uirecorder.actionList[index].detailList[0][elName].data[i].value == "string") 
                                ? apf.uirecorder.actionList[index].detailList[0][elName].data[i].value
                                : (apf.uirecorder.actionList[index].detailList[0][elName].data[i].value.value != undefined)
                                    ? apf.uirecorder.actionList[index].detailList[0][elName].data[i].value.value
                                    : apf.serialize(apf.uirecorder.actionList[index].detailList[0][elName].data[i].value);
                            
                            this.$capturedModelChangeList[elName][actionObj.detailList[0][elName].data[i].name] = val;
                        }
                    }
                }
            }
            
        }
        //first check, 2nd check in $setDelayedDetails()
        if (apf.uirecorder.isTesting && eventName != "mousemove") {
            // warning for AML nodes with no id defined
            var testId = (apf.uirecorder.isTesting) ? apf.uirecorder.playback.$curTestXml.getAttribute("name") : apf.uirecorder.capture.$curTestId;
            for (var elementName in actionObj.detailList[0]) {
                if (elementName.indexOf("html[") == 0 && elementName != "html[1]") {
                    //apf.console.info("captureAction: curKeyActionIdx: " + apf.uirecorder.playback.$curKeyActionIdx); //apf.uirecorder.playback.$getKeyActionIdx(eventName));
                    //apf.console.info("captureAction: actionIdx: " + apf.uirecorder.playback.$curActionIdx);
                    apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.NO_ID, {
                        val         : elementName, 
                        action      : eventName,
                        keyActionIdx: apf.uirecorder.playback.$getKeyActionIdx(eventName)
                    });
                }
            }

            apf.uirecorder.testing.$checkResults(actionObj, eventName, apf.uirecorder.playback.$curActionIdx, apf.uirecorder.playback.$getKeyActionIdx(eventName), 0);
        }
    },

    $runInContext : function(state, f){
        //Put everything until now on the current action
        apf.uirecorder.capture.$setDelayedDetails(this.current.index, this.current.eventName, this.current.actionIdx, this.current.keyActionIdx);
       
        //Set the new stuff on the past action
        if (typeof f == "string")
            apf.exec(f)
        else
            f();

        apf.uirecorder.capture.$setDelayedDetails(state.index, state.eventName, state.actionIdx, state.keyActionIdx);
    },
    
    // capture detailed event calls, property/model data changes
    $setDelayedDetails : function(index, eventName, actionIdx, keyActionIdx) {
        var time = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);
        
        // if object is mousemove delayTime is possibly set multiple times, take time with highest number
        if (!apf.uirecorder.actionList[index].delayTime || time > apf.uirecorder.actionList[index].delayTime)
            apf.uirecorder.actionList[index].delayTime = time;
            
            // set detailList
            if (!apf.uirecorder.actionList[index].detailList[1]) { 
                for (var elName in apf.uirecorder.detailList) {
                    apf.uirecorder.actionList[index].detailList[1] = apf.uirecorder.detailList;
                    break;
                }
            }
            // merge detailList
            else {
                for (var elementName in apf.uirecorder.detailList) {
                    // details for this element not exist yet
                    if (!apf.uirecorder.actionList[index].detailList[1][elementName]) 
                        apf.uirecorder.actionList[index].detailList[1][elementName] = apf.uirecorder.detailList[elementName]
                    // merge details of this element
                    else {
                        for (var propName in apf.uirecorder.detailList) {
                            if (propName == "amlNode") continue;
                            if (apf.uirecorder.detailList[propName].length) {
                                if (!apf.uirecorder.actionList[index].detailList[1][elementName][propName].length)
                                    apf.uirecorder.actionList[index].detailList[1][elementName][propName] = apf.uirecorder.detailList[propName];
                                else
                                    apf.uirecorder.actionList[index].detailList[1][elementName][propName] = apf.uirecorder.actionList[index].detailList[1][elementName][propName].concat(apf.uirecorder.detailList[propName]);
                            }
                        }
                    }
                }
            }
            
            apf.uirecorder.detailList = {};
             
        //for (var elementName in apf.uirecorder.detailList) {
            /*
            if (!apf.uirecorder.actionList[index].detailList) apf.uirecorder.actionList[index].detailList = {};
            if (!apf.uirecorder.actionList[index].detailList[elementName]) apf.uirecorder.actionList[index].detailList[elementName] = {
                amlNode     : (apf.uirecorder.detailList[elementName] && apf.uirecorder.detailList[elementName].amlNode) ? apf.uirecorder.detailList[elementName].amlNode : null,
                events      : [],
                properties  : [],
                data        : []
            };
            */
            
        //}

        // create event list during testing, used to check if certain events are already called for an element
        if (apf.uirecorder.isTesting) {
            if (apf.uirecorder.actionList[index].detailList[1]) {
                // loop throught elements
                for (var elName in apf.uirecorder.actionList[index].detailList[1]) {
                    if (apf.uirecorder.actionList[index].detailList[1][elName].events && apf.uirecorder.actionList[index].detailList[1][elName].events.length) {
                        // loop through detailList events
                        for (var i = 0, l = apf.uirecorder.actionList[index].detailList[1][elName].events.length; i < l; i++) {
                            if (!this.$capturedEventList[elName]) this.$capturedEventList[elName] = [];
                            this.$capturedEventList[elName].push(apf.uirecorder.actionList[index].detailList[1][elName].events[i].name);

                            //if (apf.uirecorder.actionList[index].detailList[1][elName].events[i].name == "beforeload") debugger;
                        }
                    }
                    // collect captured propchanges
                    if (apf.uirecorder.actionList[index].detailList[1][elName].properties && apf.uirecorder.actionList[index].detailList[1][elName].properties.length) {
                        // loop through detailList properties
                        for (var val, i = 0, l = apf.uirecorder.actionList[index].detailList[1][elName].properties.length; i < l; i++) {
                            if (!this.$capturedPropertyChangeList[elName]) this.$capturedPropertyChangeList[elName] = {};
                            if (!this.$capturedPropertyChangeList[elName][apf.uirecorder.actionList[index].detailList[1][elName].properties[i].name]) this.$capturedPropertyChangeList[elName][apf.uirecorder.actionList[index].detailList[1][elName].properties[i].name] = {};
                            val = (typeof apf.uirecorder.actionList[index].detailList[1][elName].properties[i].value == "string")
                                ? apf.uirecorder.actionList[index].detailList[1][elName].properties[i].value
                                : (apf.uirecorder.actionList[index].detailList[1][elName].properties[i].value.value != undefined)
                                    ? apf.uirecorder.actionList[index].detailList[1][elName].properties[i].value.value
                                    : apf.serialize(apf.uirecorder.actionList[index].detailList[1][elName].properties[i].value);
                            this.$capturedPropertyChangeList[elName][apf.uirecorder.actionList[index].detailList[1][elName].properties[i].name] = val;
                        }
                    }
                    // collect captured model changes
                    if (apf.uirecorder.actionList[index].detailList[1][elName].data && apf.uirecorder.actionList[index].detailList[1][elName].data.length) {
                        // loop through detailList model changes
                        for (var val, i = 0, l = apf.uirecorder.actionList[index].detailList[1][elName].data.length; i < l; i++) {
                            if (!this.$capturedModelChangeList[elName]) this.$capturedModelChangeList[elName] = {};
                            if (!this.$capturedModelChangeList[elName][apf.uirecorder.actionList[index].detailList[1][elName].data[i].name]) this.$capturedModelChangeList[elName][apf.uirecorder.actionList[index].detailList[1][elName].data[i].name] = {};
                            val = (typeof apf.uirecorder.actionList[index].detailList[1][elName].data[i].value == "string") ? apf.uirecorder.actionList[index].detailList[1][elName].data[i].value : apf.serialize(apf.uirecorder.actionList[index].detailList[1][elName].data[i].value);
                            this.$capturedModelChangeList[elName][apf.uirecorder.actionList[index].detailList[1][elName].data[i].name] = val;
                        }
                    }
                }
            }
        }

        if (apf.activeElement && apf.activeElement.parentNode)
            apf.uirecorder.actionList[index].activeElement = apf.activeElement.id || apf.xmlToXpath(apf.activeElement);

        // 2nd check
        if (apf.uirecorder.isTesting && eventName != "mousemove") {
            apf.uirecorder.testing.$checkResults(apf.uirecorder.actionList[index], eventName, actionIdx, keyActionIdx, 1);
        }
    },
    
    /*
     * capture apf events
     */
    captureEvent : function(eventName, e) {
        if (!e) debugger;
        if (eventName.charAt(0) == "$") return;
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

        // specific cases for target name
        /*
        if (["beforeselect", "afterselect"].indexOf(eventName) > -1) {
            if (!e.selected) debugger;
            targetName = e.selected.id || apf.xmlToXpath(e.selected);
        }
        else if (["dragstart", "dragdrop", "dragover", "dragout"].indexOf(eventName) > -1) {
            var values = [];
            if (e.data.length == 1) {
                targetName = e.data[0].id || apf.xmlToXpath(e.data[0]);
            }
        }
        */

        // no target name found
        if (!targetName) {
            if (amlNode && amlNode.id)
                targetName = amlNode.id;
            else
                targetName = "trashbin";
        }
        
        //if (targetName == "trashbin" && eventName == "beforeload") debugger;
        if (targetName.indexOf("a:application") == 0) return;

        // elapsed time since start of recording/playback
        var time = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);
        var eventObj = {
            time        : time,
            name        : eventName,
            event       : e
        }
        
        // optional properties
        if (e.action) {
            if (!eventObj.value) eventObj.value = {};
            eventObj.value.action = e.action;
        }

        // save events to detailList
        if (!apf.uirecorder.detailList[targetName]) apf.uirecorder.detailList[targetName] = {
            caption     : targetName,
            amlNode     : amlNode,
            events      : [],
            properties  : [],
            data        : []
        };
        
        // repeating event
        if (!apf.uirecorder.capture.$lastEventObj || (!(targetName == apf.uirecorder.capture.$lastEventObj.targetName && eventName == apf.uirecorder.capture.$lastEventObj.name) || !apf.uirecorder.detailList[targetName].events.length)) {
            apf.uirecorder.detailList[targetName].events.push(eventObj);
        }
        else {
            if (!apf.uirecorder.detailList[targetName].events[apf.uirecorder.detailList[targetName].events.length-1].calls) 
                apf.uirecorder.detailList[targetName].events[apf.uirecorder.detailList[targetName].events.length-1].calls = 1;
            apf.uirecorder.detailList[targetName].events[apf.uirecorder.detailList[targetName].events.length-1].calls++;
        }
        
        // save last event object to check repeating event calls
        apf.uirecorder.capture.$lastEventObj = {
            targetName  : targetName,
            name        : eventName
        };
    },
    
    capturePropertyChange : function(amlNode, prop, value) {
        if (amlNode && amlNode.tagName) {
            targetName = amlNode.id || apf.xmlToXpath(amlNode);
            if (targetName.indexOf("/text()") > -1) {
                targetName = targetName.substr(0, targetName.length - "/text()[x]".length);    
            }
        } 
        else {
            if (amlNode && amlNode.id) debugger;
            return
        }

        if (targetName.indexOf("a:application") == 0) return;

        if (apf.isArray(value) && value.length == 1) 
            value = value[0];
            
        // elapsed time since start of recording/playback
        var time = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);
        var propObj = {
            time        : time,
            name        : prop,
            value       : value
        }
            
        if (!apf.uirecorder.detailList[targetName]) apf.uirecorder.detailList[targetName] = {
            amlNode     : amlNode,
            events      : [],
            properties  : [],
            data        : []
        };
apf.uirecorder.output.testLog.push("capturePropertyChange(): property change \"" + prop + " = " + value + "\" called on " + targetName);
        apf.uirecorder.detailList[targetName].properties.push(propObj);
    },
    
    captureModelChange : function(params) {
        if (params.amlNode && params.amlNode.tagName) {
            targetName = params.amlNode.id || apf.xmlToXpath(params.amlNode);
            if (targetName.indexOf("/text()") > -1) {
                targetName = targetName.substr(0, targetName.length - "/text()[x]".length);    
            }
        }
        else {
            if (params.amlNode && params.amlNode.id) debugger;
            return
        }

        if (targetName.indexOf("a:application") == 0) return;

        // elapsed time since start of recording/playback
        var time        = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);
        var dataObj = {
            time        : time,
            name        : params.action
        }
        if (params.amlNode) {
            if (!dataObj.value) dataObj.value = {};
                dataObj.value.amlNode = params.amlNode.serialize(); //apf.serialize(params.amlNode).split("<").join("&lt;").split(">").join("&gt;");
        }
        if (params.xmlNode) {
            if (!dataObj.value) dataObj.value = {};
                dataObj.value.xmlNode = params.xmlNode.xml; //params.xmlNode.serialize(); //apf.serialize(params.xmlNode).split("<").join("&lt;").split(">").join("&gt;");
        }
        
        if (!apf.uirecorder.detailList[targetName]) apf.uirecorder.detailList[targetName] = {
            amlNode     : params.amlNode,
            events      : [],
            properties  : [],
            data        : []
        };
        
        apf.uirecorder.detailList[targetName].data.push(dataObj);
    }
}

apf.uirecorder.playback = {
    $curTestXml             : null,
    $curActionIdx           : 0,
    $curAction              : null,
    
    $keyActions             : [],
    $curKeyActionIdx        : 0,
    $skipNextAction         : false,
    $playSpeed              : "realtime",
    $maxSpeedDelay          : 0,   // delay in centiseconds (1/100)
    $timeoutTimer           : null,
    $startTestDelay         : 0,
    $testDelay              : 0,
    $windowOffset           : {
        top     : 0,
        left    : 0
    },
    $waitElementsInterval   : "",
    $elementWaitTimeout     : 10000,
    $pauseAfterAction       : null,
    $checkList              : [],       // list with checks that need to be performed during testing
    $checkEvents            : { // list of events where playback should wait before continuing playing 
        "beforeload"        : "afterload",
        "beforestatechange" : "afterstatechange",
        "beforeselect"      : "afterselect"
//        "beforeswitch"      : "afterswitch"
    },
    $checkEvent             : ["mousedown", "afterload", "prop.visible", "load", "afterstatechange", "afterselect", "afterswitch", "hashchange"],
    
    // reset playback
    reset : function() {
        apf.uirecorder.isPlaying = false;
        apf.uirecorder.isTesting = false;
        
        if (this.$timeoutTimer) {
            clearTimeout(this.$timeoutTimer);
            this.$timeoutTimer = "";
        }
        if (this.$waitElementsInterval) {
            clearInterval(this.$waitElementsInterval);
            this.$waitElementsInterval = "";
        }

        if (this.$waitForInterval) {
            clearInterval(this.$waitForInterval);
            this.$waitForInterval = "";
        }
    },
    
    // playback current test and save test results
    test : function(testXml, playSpeed, o3, offset) {
        apf.uirecorder.isTesting = true;
        
        this.play(testXml, playSpeed, o3, offset);
    },
    
    // stop playing
    stop : function() {
        apf.console.info("test stopped");
        apf.uirecorder.capture.stop();

        if (apf.uirecorder.isTesting) {
            apf.uirecorder.output.createTestResultsXml();
        }

        apf.uirecorder.playback.reset();
    },

    // pause current playback
    pause : function() {
		if (apf.uirecorder.isPaused) return
        apf.uirecorder.isPaused = true;
        this.$startTestDelay = new Date().getTime();
    },
    
    // resume paused playback
    resume : function() {
        if (!apf.uirecorder.isPaused) return;
        if (this.$waitElementsInterval || apf.uirecorder.testing.$waitForInterval || apf.uirecorder.output.$popup) return;
        
        apf.console.info("resumed");
        apf.uirecorder.isPaused = false;
        this.$testDelay += new Date().getTime() - this.$startTestDelay;
        this.$playAction();
    },
    
    // playback current test without saving test results
    //  testXml     : xml of single test with actions
    //  playSpeed   : realtime / max
    //  o3          : reference to o3
    //  offset      : object with top/left offset of browser element in relation to client window 
    play : function(testXml, playSpeed, o3, offset) {
apf.console.info("start playback");
        this.$o3            = o3;
        this.$playSpeed     = playSpeed;
        this.$curTestXml    = testXml;
        this.$curActionIdx  = 0;
        this.$windowOffset  = offset;

        if (!apf.uirecorder.isTesting)
            apf.uirecorder.isPlaying = true;

        this.$createCheckList();

        // hide debugwin
        if (apf.config.debug) {
            apf.config.debug = false;
            //if (apf.debugwin.$ext && apf.debugwin.$ext.style)
                //apf.debugwin.hide();
        }
        
        apf.uirecorder.capture.$init();

        apf.uirecorder.capture.$startTime = new Date().getTime();

        if (this.$playSpeed == "max") {
            setTimeout(function() {
                apf.uirecorder.playback.$playAction();
            }, 200)
        }
        else {
            apf.uirecorder.playback.$playAction();
        }
    },
    
    $getKeyActionIdx : function(actionName) {
        if (apf.uirecorder.playback.$keyActions[apf.uirecorder.playback.$curKeyActionIdx] && apf.uirecorder.playback.$keyActions[apf.uirecorder.playback.$curKeyActionIdx].getAttribute("name") == actionName)
            return apf.uirecorder.playback.$curKeyActionIdx;
        for (var i = apf.uirecorder.playback.$curKeyActionIdx; i >= 0; i--) {
            if (apf.uirecorder.playback.$keyActions[i] && apf.uirecorder.playback.$keyActions[i].getAttribute("name") == actionName)
                return i;
        }

        return false;
    },
    
    // collect checks that has to be checked during playback 
    $createCheckList : function() {
        // check all actions that are flagged as keyAction
        this.$keyActions = apf.uirecorder.playback.$curTestXml.selectNodes("action[@keyActionIdx and not(@name='mousemove')]");
		
        for (var htmlNode ,action, i = 0, l = this.$keyActions.length; i < l; i++) {
            // set checks for available amlNodes, check in playAction
            // seperate in details1, details2??
            if (this.$keyActions[i].getAttribute("amlNode") != undefined) {
                if (!this.$checkList[i]) this.$checkList[i] = {}
                if (!this.$checkList[i].elementAvailable) this.$checkList[i].elementAvailable = [];
                if (this.$checkList[i].elementAvailable.indexOf(this.$keyActions[i].getAttribute("amlNode")) == -1)
                    this.$checkList[i].elementAvailable.push(this.$keyActions[i].getAttribute("amlNode"));
            }
            
            // set htmlNode checks, check in checkResults()
            if (this.$keyActions[i].getAttribute("htmlNode") != undefined) {
                // check htmlNode
                // multiselect check already covered by properties/selection
                if (this.$keyActions[i].getAttribute("htmlNode") != "multiselect") {
                    if (!this.$checkList[i]) this.$checkList[i] = {}
                    if (!this.$checkList[i].htmlNode) this.$checkList[i].htmlNode = [];
                    htmlNode = (this.$keyActions[i].getAttribute("htmlNode") == "$ext") ? this.$keyActions[i].getAttribute("amlNode") : this.$keyActions[i].getAttribute("htmlNode");
                    if (this.$checkList[i].htmlNode.indexOf(this.$keyActions[i].getAttribute("htmlNode")) == -1)
                        this.$checkList[i].htmlNode.push(htmlNode);
                }
                /*
                // check multiselect value
                else {
                    if (!this.$checkList[i]) this.$checkList[i] = {}
                    if (!this.$checkList[i].multiselect) this.$checkList[i].multiselect = {};
                    if (!this.$checkList[i].multiselect[this.$keyActions[i].getAttribute("amlNode")])
                        this.$checkList[i].multiselect[this.$keyActions[i].getAttribute("amlNode")] = this.$keyActions[i].getAttribute("multiselectValue");
                }
                */
            }
            
            if (this.$keyActions[i].getAttribute("targetType") != undefined) {
                if (!this.$checkList[i]) this.$checkList[i] = {}
                this.$checkList[i].targetType = this.$keyActions[i].getAttribute("targetType");

                if (this.$keyActions[i].getAttribute("targetType") == "a" && this.$keyActions[i].getAttribute("targetValue") != undefined) {
                    if (!this.$checkList[i]) this.$checkList[i] = {}
                    this.$checkList[i].targetValue = this.$keyActions[i].getAttribute("targetValue");
                }
            }

            
            // set checks to compare value of properties, events and data, check in checkResults()
            //if (apf.uirecorder.isTesting) {
                for (var dIdx, di = 0, dl = this.$keyActions[i].childNodes.length; di < dl; di++) {
                    dIdx = this.$keyActions[i].childNodes[di].getAttribute("index");
                    for (var elName, nodes, ci = 0, cl = this.$keyActions[i].childNodes[di].childNodes.length; ci < cl; ci++) {
                        elName = this.$keyActions[i].childNodes[di].childNodes[ci].getAttribute("name");
                        if (!elName || elName == "trashbin" || elName == "html[1]") continue;
//if (elName.indexOf("a:application[1]") > -1) continue;
if (elName && elName.indexOf("text()") > -1) debugger;
                        for (var type in this.$detailTypes) {
                            if (!this.$keyActions[i].childNodes[di].childNodes[ci].selectSingleNode(type)) continue;
                            nodes = this.$keyActions[i].childNodes[di].childNodes[ci].selectSingleNode(type).selectNodes(this.$detailTypes[type]);
        
                            for (var node, ni = 0, nl = nodes.length; ni < nl; ni++) {
                                node = nodes[ni];
                                // add property changes
                                if (type == "properties") {
                                    if (!this.$checkList[i]) this.$checkList[i] = {};
                                    if (!this.$checkList[i].details) this.$checkList[i].details = [];
                                    if (!this.$checkList[i].details[dIdx]) this.$checkList[i].details[dIdx] = {};
                                    if (!this.$checkList[i].details[dIdx].properties) this.$checkList[i].details[dIdx].properties = {};
                                    if (!this.$checkList[i].details[dIdx].properties) this.$checkList[i].details[dIdx].properties = {};
                                    if (!this.$checkList[i].details[dIdx].properties[elName]) this.$checkList[i].details[dIdx].properties[elName] = {};
                                    this.$checkList[i].details[dIdx].properties[elName][node.getAttribute("name")] = node.text;
                                }

                                else if (type == "events") {
                                    // add events with a value
                                    // add specific events
                                    //if (node.getAttribute("value") != undefined) {
                                    if (this.$checkEvent.indexOf(node.getAttribute("name")) > -1) {
                                        if (!this.$checkList[i]) this.$checkList[i] = {};
                                        if (!this.$checkList[i].details) this.$checkList[i].details = [];
                                        if (!this.$checkList[i].details[dIdx]) this.$checkList[i].details[dIdx] = {};
                                        if (!this.$checkList[i].details[dIdx].events) this.$checkList[i].details[dIdx].events = {};
                                        if (!this.$checkList[i].details[dIdx].events[elName]) this.$checkList[i].details[dIdx].events[elName] = {};
                                        this.$checkList[i].details[dIdx].events[elName][node.getAttribute("name")] = node.value;
                                    }

                                    // add event combo's from $checkEvents list like beforeload/afterload
                                    /*
                                    if (this.$checkEvents[node.getAttribute("name")] && elName != "model") {
                                        if (!this.$checkList[i]) this.$checkList[i] = {};
                                        if (!this.$checkList[i].waitEvents) this.$checkList[i].waitEvents = [];
                                        if (!this.$checkList[i].waitEvents[dIdx]) this.$checkList[i].waitEvents[dIdx] = {};
                                        if (!this.$checkList[i].waitEvents[dIdx][elName]) this.$checkList[i].waitEvents[dIdx][elName] = [];
                                        this.$checkList[i].waitEvents[dIdx][elName].push(node.getAttribute("name"));
                                        this.$checkList[i].waitEvents[dIdx][elName].push(this.$checkEvents[node.getAttribute("name")]);
                                    }
                                    */
                                }

                                // add model data changes
                                else if (type == "data") {
                                    if (!this.$checkList[i]) this.$checkList[i] = {};
                                    if (!this.$checkList[i].details) this.$checkList[i].details = [];
                                    if (!this.$checkList[i].details[dIdx]) this.$checkList[i].details[dIdx] = {};
                                    if (!this.$checkList[i].details[dIdx].data) this.$checkList[i].details[dIdx].data = {};
                                    if (!this.$checkList[i].details[dIdx].data[elName]) this.$checkList[i].details[dIdx].data[elName] = {};
                                    this.$checkList[i].details[dIdx].data[elName][node.getAttribute("name")] = node.text;
                                }
                            }
                        }
                    }
                }                
            //}
        }
    },
    
    // check to see if element is on stage
    $elementsAvailable : function(keyActionIdx) {
        // if there are elements to check
        if (this.$checkList[keyActionIdx] && this.$checkList[keyActionIdx].elementAvailable) {
            for (var element, i = 0, l = this.$checkList[keyActionIdx].elementAvailable.length; i < l; i++) {
                //if one element is not available return false
                if (this.$checkList[keyActionIdx].elementAvailable[i].indexOf("html[") == 0) continue;
                element = (this.$checkList[keyActionIdx].elementAvailable[i].indexOf("html[") == 0 && apf && apf.document && apf.document.selectSingleNode) 
                    ? apf.document.selectSingleNode(this.$checkList[keyActionIdx].elementAvailable[i].substr(8)) // search for amlNode based on xpath
                    : apf.document.getElementById(this.$checkList[keyActionIdx].elementAvailable[i]) // search for amlNode on screen 
                           || null

                if (!element 
                    || (element && element.$ext && !(element.$ext.clientTop >= 0 && element.$ext.clientLeft >= 0 && element.$ext.clientWidth >= 0 && element.$ext.clientHeight >= 0))
                ) {
                    // return false if not found
                    return false;//this.$checkList[keyActionIdx].elementAvailable[i];
                }
            }
        }
        else {
            //debugger;
        }
                
        delete this.$checkList[keyActionIdx].elementAvailable;
        return true;
    },
    
    // check to see if all elements are
    $waitElementsCheck : function(keyActionIdx) {
        // check elements
		apf.console.info("$waitElementsCheck: " + keyActionIdx);
        
        if (!this.$elementsAvailable(keyActionIdx)) {
            var curTime = new Date().getTime();
            if (!this.$waitElementStartTime) debugger;
            if (curTime >= this.$waitElementStartTime + this.$testDelay + this.$elementWaitTimeout) {
                // @todo create new error for wait elements
                apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.ELEMENT_TIMEOUT, { 
                    val         : [this.$checkList[keyActionIdx].elementAvailable.join(", ")], 
                    action      : this.$keyActions[keyActionIdx].getAttribute("name"),
                    keyActionIdx: keyActionIdx
                });
                clearInterval(this.$waitElementsInterval);
                this.$waitElementsInterval = "";
                return;
            }
            return;
        }
        
        apf.console.info("$waitElementsCheck continue: " + keyActionIdx);
        // all elements available, continue playback
        clearInterval(this.$waitElementsInterval);
        this.$waitElementsInterval = "";
        this.$waitElementStartTime = 0;
        delete this.$checkList[keyActionIdx].elementAvailable;
        
        apf.console.info("resumed by checkResults: elementsAvailable");
        this.resume();
    },
    
    // play current action of test
    $playAction : function() {
        //apf.console.info("playAction on: " + this.$curActionIdx);
        if (!(apf.uirecorder.isTesting || apf.uirecorder.isPlaying) || apf.uirecorder.isPaused) return;
        
        if (this.$playSpeed == "realtime") {
            // check if all actions are executed, if so end test
            if (this.$curTestXml.childNodes.length <= this.$curActionIdx) {
                this.$testCheck();
                return;
            }
            
            this.$curAction     = this.$curTestXml.childNodes[this.$curActionIdx];
        }
        else if (this.$playSpeed == "max") {
            // check if all actions are executed, if so end test
            if (this.$keyActions.length <= this.$curKeyActionIdx) {
                this.$testCheck();
                return;
            }
            this.$curAction     = this.$keyActions[this.$curKeyActionIdx];
        }
/*        
        if (this.$playSpeed == "max" && this.$curAction.getAttribute("keyActionIdx") == undefined) {
            this.$testCheck();
            return;
        }
*/        
        //if (this.$curAction.getAttribute("name") != "mousemove")
            //apf.console.info("$playAction: keyAction (" + this.$curAction.getAttribute("keyActionIdx") + ")");
        

        // if popups in queue and no popup visible show them after mouseup action
        if (apf.uirecorder.output.$popupQueue.length && !apf.uirecorder.output.$popup && !apf.uirecorder.settings.testing.ignoreWarnings) {
            //apf.console.info("playAction: popup found");
            // if needed wait for mouseup (after mousedown) to prevent mousedown/mouseup combo being disturbed
            if (apf.uirecorder.output.$popupOnMouseup && this.$curTestXml.childNodes[this.$curActionIdx-1] && this.$curTestXml.childNodes[this.$curActionIdx-1].getAttribute("name") == "mouseup") {
                //apf.console.info("$playAction: open popup");
                apf.uirecorder.output.$showPopup();
                return;
            }
        }
if (!this.$curAction) debugger;
        // check for availability of needed elements
        if (this.$curAction.getAttribute("keyActionIdx") != undefined) {
            //this.$curKeyActionIdx = parseInt(this.$curAction.getAttribute("keyActionIdx"));

            apf.uirecorder.output.testLog.push(this.$curKeyActionIdx + ". playAction(): " + this.$curAction.getAttribute("name"));

//if (this.$curAction.getAttribute("name") == "mouseup") debugger;
            // pause playback until all elements required for this action are available, but not in middle of mousedown/mouseup combo
            if (this.$checkList[this.$curKeyActionIdx] && this.$checkList[this.$curKeyActionIdx].elementAvailable) {
                if (!this.$elementsAvailable(this.$curKeyActionIdx)) {
                    //if (!(this.$curAction.getAttribute("name") == "mouseup" && this.$keyActions[this.$curKeyActionIdx-1].getAttribute("name") == "mousedown")) {
                    if (!(this.$keyActions[this.$curKeyActionIdx].getAttribute("name") == "mouseup")) {
                        //apf.console.info("$playAction: elements for keyActionIdx " + this.$curKeyActionIdx + " not all available yet");
                        if (this.$checkList[this.$curKeyActionIdx] && this.$checkList[this.$curKeyActionIdx].elementAvailable && this.$checkList[this.$curKeyActionIdx].elementAvailable.length) {
                            //apf.console.info("paused by elementAvailable: waitElements (" + this.$curAction.getAttribute("name") + "/" + this.$keyActions[this.$curKeyActionIdx-1].getAttribute("name") + ")");
                            if (this.$waitElementsInterval == "") {
                                apf.uirecorder.output.testLog.push(this.$curKeyActionIdx + ". playAction(): paused playback for $elementsAvailable");
                                this.pause();
                                this.$waitElementStartTime = new Date().getTime();
                                this.$waitElementsInterval = setInterval(function() {
                                    apf.uirecorder.playback.$waitElementsCheck(apf.uirecorder.playback.$curKeyActionIdx);
                                }, 10);
                                return;
                            }
                        }
                    }
                }
                else {
                    delete this.$checkList[this.$curKeyActionIdx].elementAvailable;
                }
            } 
        }

        if (this.$playSpeed == "realtime") {
            if (this.$timeoutTimer) {
                clearTimeout(this.$timeoutTimer);
                this.$timeoutTimer = "";
            }
            var timeout = parseInt(this.$curAction.getAttribute("time")) + this.$testDelay - (new Date().getTime() - apf.uirecorder.capture.$startTime);
            if (timeout > 0) {
                apf.uirecorder.timeoutTimer = setTimeout(function() {
                    apf.uirecorder.playback.$execAction();
                }, timeout);
            }
            
            // timeout smaller or equal to 0, execute immediatly
            else {
                this.$execAction();
            }
        } 
        else if (this.$playSpeed == "max") {
            // skip mousedown when multiselect selection is made, selection occurs using setValue();
            if (["mousedown"].indexOf(this.$curAction.getAttribute("name")) > -1 && this.$curAction.getAttribute("amlNode") != undefined && this.$curAction.getAttribute("htmlNode") != "multiselect") {
                var keyIdx = parseInt(this.$curAction.getAttribute("keyActionIdx"));
                if (this.$keyActions[keyIdx+2] && this.$keyActions[keyIdx+2].getAttribute("amlNode") != undefined && this.$keyActions[keyIdx+2].getAttribute("htmlNode") == "multiselect") {
                    // remove checks from checklist
                    //debugger;
                    if (this.$checkList[keyIdx])
                        delete this.$checkList[keyIdx];
                    if (this.$checkList[keyIdx])
                        delete this.$checkList[keyIdx+1];
                        
                    this.$skipNextAction = true;
                    this.$testCheck();
                    return;
                }
            }            

            // also skip mouseup when mousedown is skipped, 
            if (this.$skipNextAction) {
                this.$skipNextAction = false;
                this.$testCheck();
                return;
            }

            //if (this.$curKeyActionIdx > 0) { 
                var timeout = parseInt(this.$curAction.getAttribute("time")) + this.$testDelay - (new Date().getTime() - apf.uirecorder.capture.$startTime);
                if (timeout > 0) {
                    apf.uirecorder.timeoutTimer = setTimeout(function() {
                        apf.uirecorder.playback.$execAction();
                    }, timeout);
                }
                
                // timeout smaller or equal to 0, execute immediatly
                else {
                    this.$execAction();
                }
            //}
            // first action
            //else {
                //this.$execAction();
            //}
        }
    },
    
    // execute user interaction for current action
    $mouseTargetActions : ["mousedown", "mouseup", "mousescroll", "dblClick", "keydown", "keyup", "keypress"],
    $mouseMoveActions   : ["mousemove", "mousedown", "mouseup", "mousescroll", "dblClick"],
    $detailTypes        : {"events": "event", "properties": "property", "data": "dataItem"},
    
    $execAction : function() {
        if (!(apf.uirecorder.isTesting || apf.uirecorder.isPlaying) || apf.uirecorder.isPaused) {
            if (this.$timeoutTimer) {
                clearTimeout(this.$timeoutTimer);
            }
            return;
        }
        var keyActionIdx = parseInt(this.$curAction.getAttribute("keyActionIdx"));
        if (keyActionIdx)
            apf.uirecorder.output.testLog.push(keyActionIdx + ". execAction(): " + this.$curAction.getAttribute("name"));

        // reset capturedEvents
        if (!this.$pauseAfterAction)
            apf.uirecorder.capture.$capturedEventList = {};
        
/*
        if (apf.uirecorder.playback.$playSpeed == "max" && keyActionIdx == undefined) { 
            this.$testCheck();
            return;
        }
*/
        //if (keyActionIdx == 6) debugger;
        //if (this.$curAction.getAttribute("name") != "mousemove")
            //apf.console.info("execAction: " + this.$curActionIdx + " (" + this.$curAction.getAttribute("name") + ")");
//if (this.$curActionIdx == "181") debugger;     
        // locate html element and calculate position of mouse action
        if (apf.uirecorder.playback.$mouseTargetActions.indexOf(this.$curAction.getAttribute("name")) > -1) {
            var xPos, yPos;

            if (this.$curAction.getAttribute("htmlNode")) {
                var htmlNode;
                // htmlNodes part of amlNode
                if (this.$curAction.getAttribute("amlNode")) {
                    var amlNode = (this.$curAction.getAttribute("amlNode").indexOf("html[") == 0 && apf && apf.document && apf.document.selectSingleNode) 
                        ? apf.document.selectSingleNode(this.$curAction.getAttribute("amlNode").substr(8)) // search for amlNode based on xpath
                        : apf.document.getElementById(this.$curAction.getAttribute("amlNode")) // search for amlNode with id 
                               || null; // no amlNode found
                    
                    // check if amlNode already exist on stage, if not: wait till it does before continuing playback
                    if (!amlNode) {
                        debugger;
                        apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.NODE_NOT_EXIST, {
                            val     : this.$curAction.getAttribute("amlNode")
                        });
                        return;
                    }

                    // get htmlNode
                    if (this.$curAction.getAttribute("htmlNode") == "$ext")
                        htmlNode = amlNode.$ext;
                    else if (amlNode.$getActiveElements && amlNode.$getActiveElements()[this.$curAction.getAttribute("htmlNode")])
                        htmlNode = amlNode.$getActiveElements()[this.$curAction.getAttribute("htmlNode")];
                    /*
                    else if (this.$curAction.getAttribute("htmlNode") == "multiselect") {
						//debugger;
						//htmlNode = amlNode.
						//apf.xmldb.findXmlNodeByValue
						// @todo if (this.$playSpeed == "max" && this.$curAction.getAttribute("htmlNode") == "multiselect") {
						  //amlNode.focus()
						  //amlNode.setValue()
						//}
					}
					*/
                    else if (this.$curAction.getAttribute("multiselect") == "true") {
                        var xpath = this.$curAction.getAttribute("multiselectItem").substr(this.$curAction.getAttribute("multiselectItem").indexOf("/")+1);
                        var xmlNode = amlNode.queryNode(xpath);
                        if (xmlNode) {
                            var selectedItem = apf.xmldb.getHtmlNode(xmlNode, amlNode);
                            htmlNode = apf.queryNode(this.$curAction.getAttribute("htmlNode"), selectedItem);
                        }
                        else {
                            if (this.$curAction.getAttribute("htmlNode") != ".")
                                htmlNode = apf.queryNode(this.$curAction.getAttribute("htmlNode").substr(8), document.documentElement);
                            else
                                htmlNode = amlNode.$ext;
                        }
                        //var htmlNode = apf.xmlToXpath(htmlElement, amlNode.$selected).toLowerCase();
                        //apf.queryNodes(amlNode.$selected + htmlNode, apf.document)
                    }
                }
                // htmlNodes not part of amlNode
                else {
                    if (this.$curAction.getAttribute("htmlNode").indexOf("html[") != 0) debugger;
                    htmlNode = apf.queryNode(this.$curAction.getAttribute("htmlNode").substr(8), document.documentElement);
                }
                
                // htmlNode not visible
                if (htmlNode) {
                    /*
                     * ignore visibility check for now, could become visible AFTER action is executed
                    if (htmlNode.offsetTop == 0 && htmlNode.offsetLeft == 0 && htmlNode.offsetWidth == 0 && htmlNode.offsetHeight == 0) {
                        apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.NODE_NOT_VISIBLE, {
                            val: [(this.$curAction.getAttribute("htmlNode") != "$ext" ? this.$curAction.getAttribute("htmlNode") : this.$curAction.getAttribute("amlNode"))] 
                        });
                    }
                    */

                    // position of htmlNode
                    var pos = apf.getAbsolutePosition(htmlNode, htmlNode.parentNode)
                    if (this.$curAction.getAttribute("width") != "0")
                        xPos = pos[0]-(parseInt(this.$curAction.getAttribute("absX"))-parseInt(this.$curAction.getAttribute("x"))) * ((htmlNode.offsetWidth/parseInt(this.$curAction.getAttribute("width"))));
                    else
                        xPos = parseInt(this.$curAction.getAttribute("x"));
                    if (this.$curAction.getAttribute("height") != "0")
                        yPos = pos[1]-(parseInt(this.$curAction.getAttribute("absY"))-parseInt(this.$curAction.getAttribute("y"))) * ((htmlNode.offsetHeight/parseInt(this.$curAction.getAttribute("height"))));
                    else
                        yPos = parseInt(this.$curAction.getAttribute("y"));
                }
            }
        }
        
        // don't perform mousemovement, actions but set value of multiselect item
        // notice: runInContext, setDelayedDetails and checkResults are not run cause mouseaction is not executed
        if (this.$playSpeed == "max" && this.$curAction.getAttribute("htmlNode") == "multiselect") {
            if (this.$curAction.getAttribute("name") == "mousedown") {
                //apf.console.info("multiselect setvalue");
                //amlNode.focus();
                debugger;
                // @todo check if value exist, if not raise warning
                // if (valueExist) {
                amlNode.setValue(this.$curAction.getAttribute("multiselectValue"));
                // selected value not available in multiselect
                //}
                //else {
                if (amlNode.value != this.$curAction.getAttribute("multiselectValue")) {
                    apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.VALUE_DIFFERENT, { 
                        val         : ["multiselect", "item", this.$curAction.getAttribute("amlNode"), this.$curAction.getAttribute("multiselectValue"), amlNode.value], 
                        action      : this.$curAction.getAttribute("name"),
                        keyActionIdx: keyActionIdx
                    });
                }
                //}
                    
            }
            this.$testCheck();
            return;
        }
        // move mouse cursor to correct position
//        else if (apf.uirecorder.playback.$mouseMoveActions.indexOf(this.$curAction.getAttribute("name") > -1)) {
        if (!xPos && !yPos) {
            xPos = this.$curAction.getAttribute("x");
            yPos = this.$curAction.getAttribute("y");
        }

        // move mouse cursor to correct position
        // ssb
        if (this.$o3.window) {
            //apf.console.info(this.$curAction.getAttribute("name") + " moved");
            this.$o3.mouseTo(
                parseInt(xPos) + this.$o3.window.clientX + this.$windowOffset.left, 
                parseInt(yPos) + this.$o3.window.clientY + this.$windowOffset.top, 
                this.$o3.window
            );
        }
        // o3 browser plugin
        else {
            this.$o3.mouseTo(parseInt(xPos), parseInt(yPos));
        }
//        }
        
        // execute mouse action
        if (this.$curAction.getAttribute("name") === "keypress") {
            //if (this.$playSpeed == "max") this.$o3.wait(this.$maxSpeedDelay);
            this.$o3.sendAsKeyEvents(this.$curAction.getAttribute("value"));
        }
        else if (this.$curAction.getAttribute("name") === "keydown") {
            //if (this.$playSpeed == "max") this.$o3.wait(this.$maxSpeedDelay); 
            this.$o3.sendKeyDown(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (this.$curAction.getAttribute("name") === "keyup") {
            //if (this.$playSpeed == "max") this.$o3.wait(this.$maxSpeedDelay);
            this.$o3.sendKeyUp(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (this.$curAction.getAttribute("name") === "mousedown") {
            //if (this.$playSpeed == "max") this.$o3.wait(this.$maxSpeedDelay);
            if (!(this.$playSpeed == "max" && this.$curAction.getAttribute("htmlNode") == "multiselect")) {
                //apf.console.info(this.$curAction.getAttribute("amlNode") + ": " + "mousedown");
                this.$o3.mouseLeftDown();
            }
        }
        else if (this.$curAction.getAttribute("name") === "mouseup") {
            //if (this.$playSpeed == "max") this.$o3.wait(this.$maxSpeedDelay);
            if (!(this.$playSpeed == "max" && this.$curAction.getAttribute("htmlNode") == "multiselect")) {
                //apf.console.info(this.$curAction.getAttribute("amlNode") + ": " + "mouseup");
                this.$o3.mouseLeftUp();
            }
        }
        else if (this.$curAction.getAttribute("name") === "dblClick") {
            //if (this.$playSpeed == "max") this.$o3.wait(this.$maxSpeedDelay);
            this.$o3.mouseLeftDown();
            this.$o3.mouseLeftUp();
            this.$o3.mouseLeftDown();
            this.$o3.mouseLeftUp();
        }
        else if (this.$curAction.getAttribute("name") === "mousescroll") {
            this.$o3.mouseWheel(this.$curAction.getAttribute("value"));
        }
        //apf.console.info(this.$curAction.getAttribute("name") + " executed");
        this.$testCheck();
    },

    // check if more actions are available for playback, if not end current test 
    $testCheck : function() {
        if (this.$pauseAfterAction && this.$curAction.name == apf.uirecorder.playback.$pauseAfterAction.action) {
            this.$pauseAfterAction = null;
            //apf.console.info('paused by testCheck: delayed pause after mousedown/mouseup combo');
            if (this.$waitForInterval == "") {
                apf.uirecorder.playback.pause();
                this.$waitForInterval = setInterval(function(){
                    apf.uirecorder.testing.$waitFor(apf.uirecorder.playback.$pauseAfterAction.params[0], apf.uirecorder.playback.$pauseAfterAction.params[1], apf.uirecorder.playback.$pauseAfterAction.params[2], apf.uirecorder.playback.$pauseAfterAction.params[3], apf.uirecorder.playback.$pauseAfterAction.params[4]);
                }, 10);
            }
        }

        // more actions to be executed
        if (this.$playSpeed == "realtime" && this.$curTestXml.childNodes.length > this.$curActionIdx+1) {
            this.$curActionIdx++;

            if (!apf.uirecorder.isPaused) {
                apf.uirecorder.output.testLog.push(this.$curActionIdx + ". testCheck(): goto next playAction()");
                this.$playAction();
            }
        }
        else if (this.$playSpeed == "max" && this.$keyActions.length > this.$curKeyActionIdx+1) {
            this.$curKeyActionIdx++;

            if (!apf.uirecorder.isPaused) {
                apf.uirecorder.output.testLog.push(this.$curActionIdx + ". testCheck(): goto next playAction()");
                this.$playAction();
            }
        }
        
        // test complete, process results
        else {
/*
            apf.uirecorder.output.setTestResult("notice", apf.uirecorder.output.notices.TEST_SUCCESSFUL, { 
                val: this.$curTestXml.getAttribute("name"), 
                testId: this.$curTestXml.getAttribute("name")
            });
*/
            // short delay to give playback possibility to capture last action, details etc. 
            if (this.$playSpeed == "max") {
                setTimeout(function() {
                    apf.console.info("test complete");
                    apf.uirecorder.capture.stop();
        
                    if (apf.uirecorder.isTesting) {
                        apf.uirecorder.output.createTestResultsXml();
                        apf.dispatchEvent("apftest_testcomplete", {isTesting: true});
                    }
                    else if (apf.uirecorder.isPlaying){
                        apf.dispatchEvent("apftest_testcomplete");
                    }

                    apf.uirecorder.playback.reset();
                }, 2000)
            }
            else {
                apf.uirecorder.capture.stop();

                if (apf.uirecorder.isTesting) {
                    apf.uirecorder.output.createTestResultsXml();
                    apf.dispatchEvent("apftest_testcomplete", {isTesting: true});
                }
                else if (apf.uirecorder.isPlaying){
                    apf.dispatchEvent("apftest_testcomplete");
                }
    
                apf.uirecorder.playback.reset();
            }
        }
    }
}

apf.uirecorder.testing = {
    ignoreWarnings      : false,    // ignore coming warnings during testing
    
    $waitForCheckList   : [],
    $waitForInterval    : "",
    $waitForTimeout     : 10000, // amount of time a check has to wait before raising warning
    $waitFor : function(actionObj, eventName, actionIdx, keyActionIdx, checkIdx) {
        //apf.console.info("$waitFor: " + this.$waitForCheckList.length + " checks");
        var curTime = new Date().getTime();

        if (this.$waitForCheckList.length) {
            for (var amlNode, i = 0, l = this.$waitForCheckList.length; i < l; i++) {
                // check if too much time has passed and check hasn't passed yet
                if (curTime >= this.$waitForCheckList[i].time  + apf.uirecorder.playback.$testDelay + this.$waitForTimeout) {
                    debugger;
                    apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.CHECK_TIMEOUT, { 
                        val         : [this.$waitForCheckList[i].type, this.$waitForCheckList[i].name, this.$waitForCheckList[i].elName], 
                        action      : eventName,
                        keyActionIdx: keyActionIdx
                    });
                    clearInterval(this.$waitForInterval);
                    this.$waitForInterval = "";
                    return;
                }

                amlNode = (this.$waitForCheckList[i].elName.toLowerCase().indexOf("html[") == 0) 
                    ? apf.document.selectSingleNode(this.$waitForCheckList[i].elName.toLowerCase().substr(8)) // search for amlNode based on xpath
                    : apf.document.getElementById(this.$waitForCheckList[i].elName) // search for amlNode with id 
                       || null;
                // element does not exist, stop checking
                if (!amlNode) {
                    //apf.console.info("fail: amlNode not exist"); 
                    return;
                }
                // wait for element, check already performed above, success!
                if (this.$waitForCheckList[i].type == "element") {
                    apf.uirecorder.output.testLog.push(keyActionIdx + ". $waitFor(): element found: " + this.$waitForCheckList[i].elName);
                    this.$waitForCheckList.splice(i, 1);
                    if (this.$waitForCheckList[i]) {
                        i--;
                        l--;
                    }
                }
                // check for event
                else if (this.$waitForCheckList[i].type == "event") {
                    // succesfull check, remove from waitForCheckList
                    //if (this.$waitForCheckList[i].elName == "model") debugger;
                    if (apf.uirecorder.capture.$capturedEventList[this.$waitForCheckList[i].elName]
                     && apf.uirecorder.capture.$capturedEventList[this.$waitForCheckList[i].elName].indexOf(this.$waitForCheckList[i].name) > -1) {
                        // check succesful, remove from waitForCheckList list and from capturedEventList
                        apf.uirecorder.output.testLog.push(keyActionIdx + ". $waitFor(): event called: " + this.$waitForCheckList[i].name + " on element " + this.$waitForCheckList[i].elName);
                        apf.uirecorder.capture.$capturedEventList[this.$waitForCheckList[i].elName].splice(apf.uirecorder.capture.$capturedEventList[this.$waitForCheckList[i].elName].indexOf(this.$waitForCheckList[i].name), 1);
                        this.$waitForCheckList.splice(i, 1);
                        if (this.$waitForCheckList[i]) {
                            i--;
                            l--;
                        }
                    }
                    
                    // failed check, stop checking
                    else {
                        //apf.console.info("fail: event not captured"); 
                        return
                    }
                }
                
                // check for property changes
                else if (this.$waitForCheckList[i].type == "properties") {
                    if (apf.uirecorder.capture.$capturedPropertyChangeList[this.$waitForCheckList[i].elName]
                     && apf.uirecorder.capture.$capturedPropertyChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name]) {
                        // check on value
                        if (apf.uirecorder.capture.$capturedPropertyChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name] != this.$waitForCheckList[i].value) {
                            apf.uirecorder.output.testLog.push(keyActionIdx + ". $waitFor(): check failed after \"" + eventName + "\": property \"" + this.$waitForCheckList[i].name + "\" of \"" + this.$waitForCheckList[i].elName + "\" has property value of \"" + apf.uirecorder.capture.$capturedPropertyChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name] + "\" instead of \"" + this.$waitForCheckList[i].value + "\"");
                            apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.VALUE_DIFFERENT, { 
                                val         : [this.$waitForCheckList[i].type, this.$waitForCheckList[i].name, this.$waitForCheckList[i].elName, this.$waitForCheckList[i].value, apf.uirecorder.capture.$capturedPropertyChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name]], 
                                action      : eventName,
                                keyActionIdx: keyActionIdx
                            });
                        }

                        // check succesful, remove from waitForCheckList list and from capturedEventList
                        apf.uirecorder.output.testLog.push(keyActionIdx + ". $waitFor(): property " + this.$waitForCheckList[i].name + " set on element " + this.$waitForCheckList[i].elName);
                        delete apf.uirecorder.capture.$capturedPropertyChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name]
                        this.$waitForCheckList.splice(i, 1);
                        if (this.$waitForCheckList[i]) {
                            i--;
                            l--;
                        }
                    }
                }

                // check for model changes
                else if (this.$waitForCheckList[i].type == "data") {
                    if (apf.uirecorder.capture.$capturedModelChangeList[this.$waitForCheckList[i].elName]
                     && apf.uirecorder.capture.$capturedModelChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name]) {
                        // check on value
                        if (apf.uirecorder.capture.$capturedModelChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name] != this.$waitForCheckList[i].value) {
                            apf.uirecorder.output.testLog.push(keyActionIdx + ". checkResults(): check failed after \"" + eventName + "\": model data \"" + this.$waitForCheckList[i].name + "\" of \"" + this.$waitForCheckList[i].elName + "\" has property value of \"" + apf.uirecorder.capture.$capturedPropertyChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name] + "\" instead of \"" + this.$waitForCheckList[i].value + "\"");
                            apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.VALUE_DIFFERENT, { 
                                val         : [this.$waitForCheckList[i].type, this.$waitForCheckList[i].name, this.$waitForCheckList[i].elName, this.$waitForCheckList[i].value, apf.uirecorder.capture.$capturedModelChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name]], 
                                action      : eventName,
                                keyActionIdx: keyActionIdx
                            });
                        }

                        // check succesful, remove from waitForCheckList list and from capturedEventList
                        apf.uirecorder.output.testLog.push(keyActionIdx + ". $waitFor(): model data " + this.$waitForCheckList[i].name + " set on element " + this.$waitForCheckList[i].elName);
                        delete apf.uirecorder.capture.$capturedModelChangeList[this.$waitForCheckList[i].elName][this.$waitForCheckList[i].name]
                        this.$waitForCheckList.splice(i, 1);
                        if (this.$waitForCheckList[i]) {
                            i--;
                            l--;
                        }
                    }
                }
            }
        }
        else {
            //apf.console.info("all tests succesfull")
            apf.uirecorder.output.testLog.push(keyActionIdx + ". $waitFor(): test resumed, all checks passed");

            clearInterval(this.$waitForInterval);
            this.$waitForInterval = "";
            
            apf.uirecorder.playback.resume()
            this.$checkResults(actionObj, eventName, actionIdx, keyActionIdx, checkIdx);
        }
        
    },

    // run through checkList and see if recording matches test 
    $checkResults : function(actionObj, eventName, actionIdx, keyActionIdx, checkIdx) {
        apf.uirecorder.output.testLog.push(keyActionIdx + ". checkResults(): eventName: " + eventName + ", keyActionIdx: " + keyActionIdx + ", checkIdx: " + checkIdx);
        // check waitEvent checks
        if (apf.uirecorder.playback.$checkList[keyActionIdx] && apf.uirecorder.playback.$checkList[keyActionIdx].waitEvents && apf.uirecorder.playback.$checkList[keyActionIdx].waitEvents[checkIdx]) {
            // loop thought elements in checkList
            var numElements = 0;
            for (var elName in apf.uirecorder.playback.$checkList[keyActionIdx].waitEvents[checkIdx]) {
                numElements++;
                // add check for startEvent
                this.$waitForCheckList.push({
                    type    : "event",
                    elName  : elName,
                    name    : apf.uirecorder.playback.$checkList[keyActionIdx].waitEvents[checkIdx][elName][0],
                    time    : new Date().getTime()
                });
                // add check for endEvent
                this.$waitForCheckList.push({
                    type    : "event",
                    elName  : elName,
                    name    : apf.uirecorder.playback.$checkList[keyActionIdx].waitEvents[checkIdx][elName][1],
                    time    : new Date().getTime()
                });

                // delete waitEvents for this element
                delete apf.uirecorder.playback.$checkList[keyActionIdx].waitEvents[checkIdx][elName];
            }
            
            // delete waitEvents from checkList
            delete apf.uirecorder.playback.$checkList[keyActionIdx].waitEvents[checkIdx];

            if (eventName == "mousedown" && apf.uirecorder.playback.$keyActions[keyActionIdx+1].getAttribute("name") == "mouseup") {
                // set pause after mouseup
                apf.uirecorder.playback.$pauseAfterAction = {
                    action: "mouseup",
                    params: [actionObj, eventName, actionIdx, keyActionIdx, checkIdx]
                }
            }
            else {
                apf.console.info("paused by checkResults: waitEvents");
                if (this.$waitForInterval == "") {
                    apf.uirecorder.playback.pause();
                    this.$waitForInterval = setInterval(function() {
                        apf.uirecorder.testing.$waitFor(actionObj, eventName, actionIdx, keyActionIdx, checkIdx);
                    }, 10);
                }
            }
            return;
        }

        // check other checks
        if (apf.uirecorder.playback.$checkList[keyActionIdx]) {
            var deleteCheckList = [];
            for (var prop in apf.uirecorder.playback.$checkList[keyActionIdx]) {
                // already checked waitEvents above
                if (prop == "waitEvents") continue;
                switch (prop) {
                    case "htmlNode":
                        // match if amlNode id corresponds
                        if (actionObj.amlNode && actionObj.amlNode.id && apf.uirecorder.playback.$checkList[keyActionIdx][prop] == actionObj.amlNode.id) {
                            apf.uirecorder.output.testLog.push(keyActionIdx + ". checkResults(): check success: " + eventName + " on correct htmlNode \"" + apf.uirecorder.playback.$checkList[keyActionIdx][prop] + "\"");
                            delete apf.uirecorder.playback.$checkList[keyActionIdx][prop];
                        }
                        
                        // @todo check popup
                        
                        // error if no amlNode is targeted
                        // or htmlNode is not part of the targeted amlNode, either activeElements or $ext
                        else if (actionObj.amlNode 
                            && (actionObj.amlNode.$getActiveElement && !actionObj.amlNode.$getActiveElements()[apf.uirecorder.playback.$checkList[keyActionIdx][prop]]
                            || apf.uirecorder.playback.$checkList[keyActionIdx][prop] == "$ext" && !actionObj.amlNode.$ext)
                        ) {
                            debugger;
                            apf.uirecorder.output.testLog.push(keyActionIdx + ". checkResults(): check failed: " + eventName + " not on correct htmlNode \"" + apf.uirecorder.playback.$checkList[keyActionIdx][prop] + "\"");
                            apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.ACTION_WRONG_TARGET, {
                                val: [eventName, apf.uirecorder.playback.$checkList[keyActionIdx][prop]], 
                                action  : eventName + " (" + actionIdx + ")"
                            });
                        }
                        
                        // error if targeted htmlNode has different name than recorded htmlNode name
                        // or htmlNode is $ext, but not of targeted amlNode
                        else if (actionObj.htmlNode 
                             && ( (actionObj.htmlNode.name != "$ext" && apf.uirecorder.playback.$checkList[keyActionIdx][prop].indexOf(actionObj.htmlNode.name) == -1) 
                              || (actionObj.htmlNode.name == "$ext" && actionObj.amlNode && apf.uirecorder.playback.$checkList[keyActionIdx][prop].indexOf(actionObj.amlNode.id || apf.xmlToXpath(actionObj.amlNode)) == -1)
                              ) 
                                ) {
                            debugger;
                            apf.uirecorder.output.testLog.push(keyActionIdx + ". checkResults(): check failed: " + eventName + " not on correct htmlNode \"" + apf.uirecorder.playback.$checkList[keyActionIdx][prop] + "\"");
                            apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.ACTION_WRONG_TARGET, {
                                val: [eventName, apf.uirecorder.playback.$checkList[keyActionIdx][prop]], 
                                action  : eventName + " (" + actionIdx + ")"
                            });
                        }
                        
                        // no erros found, check successfull
                        else {
                            apf.uirecorder.output.testLog.push(keyActionIdx + ". checkResults(): check success: " + eventName + " on correct htmlNode \"" + apf.uirecorder.playback.$checkList[keyActionIdx][prop] + "\"");
                            delete apf.uirecorder.playback.$checkList[keyActionIdx][prop];
                        }
                        break;
                    // multiselect check already covered by properties/selection
                    /*
                    case "multiselect":
                        for (var elName in apf.uirecorder.playback.$checkList[keyActionIdx][prop]) {
                            // amlNode is no multiselect
                            if (!(actionObj.detailList[0][elName] && actionObj.detailList[0][elName].amlNode && actionObj.detailList[0][elName].amlNode.hasFeature(apf.__MULTISELECT__) && actionObj.detailList[0][elName].amlNode.selected)) {
                                debugger;
                            }
                            // multiselect value is different
                            else if (actionObj.detailList[0][elName].amlNode.value != apf.uirecorder.playback.$checkList[keyActionIdx][prop][elName]) {
                                apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.VALUE_DIFFERENT, { 
                                    val         : ["multiselect", "item", elName], 
                                    action      : eventName,
                                    keyActionIdx: apf.uirecorder.playback.$getKeyActionIdx(eventName)
                                });
                            }
                        }
                        break;
                    */
                    case "targetType":
                        // action not on same type of element
                        if (actionObj.target.nodeName != apf.uirecorder.playback.$checkList[keyActionIdx][prop]) {
                            //@todo raise warning/error
                            debugger;
                        }
                        // check passed
                        else {
                            delete apf.uirecorder.playback.$checkList[keyActionIdx][prop];
                        }
                        break;
                    case "targetValue":
                        // action not on same type of element
                        if (actionObj.target.value != apf.uirecorder.playback.$checkList[keyActionIdx][prop]) {
                            //@todo raise warning/error
                            debugger;
                        }
                        // check passed
                        else {
                            delete apf.uirecorder.playback.$checkList[keyActionIdx][prop];
                        }
                        break; 
                    case "details":
//                    case "properties":
//                    case "events":
//                    case "data":

                        if (!apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx]) continue;
                        for (var dType in apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx]) {
                            for (var elName in apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx][dType]) {

                                // check if amlNode with elName exist in document
                                var amlNode = (elName.toLowerCase().indexOf("html[") == 0) 
                                    ? apf.document.selectSingleNode(elName.toLowerCase().substr(8)) // search for amlNode based on xpath
                                    : apf.document.getElementById(elName) // search for amlNode with id 
                                           || null; // no amlNode found

                                // amlNode does not exist (yet), wait until it does                                
                                if (!amlNode) {
                                    this.$waitForCheckList.push({
                                        type    : "element",
                                        elName  : elName,
                                        time    : new Date().getTime()
                                    });
                                    apf.uirecorder.output.testLog.push(keyActionIdx + ". checkResults(): test paused - wait for element: " + elName);
                                    if (this.$waitForInterval == "") {
                                        apf.uirecorder.playback.pause();
                                        this.$waitForInterval = setInterval(function() {
                                            apf.uirecorder.testing.$waitFor(actionObj, eventName, actionIdx, keyActionIdx, checkIdx);
                                        }, 10);
                                    }
                                    return;
                                    /*
                                    apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.NODE_NOT_EXIST, {
                                        val         : elName, 
                                        action      : eventName,
                                        keyActionIdx: keyActionIdx
                                    });
                                    return;
                                    */
                                }
    
                                for (var name in apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx][dType][elName]) {
                                    var valSet = false;
                                    if (actionObj.detailList[checkIdx] && actionObj.detailList[checkIdx][elName] && actionObj.detailList[checkIdx][elName][dType] && actionObj.detailList[checkIdx][elName][dType].length) {
                                        for (var oldVal, valMatch = false, i = 0, l = actionObj.detailList[checkIdx][elName][dType].length; i < l; i++) {
                                            if (actionObj.detailList[checkIdx][elName][dType][i].name == name) {
                                                valSet = true;
                                                
                                                // check value
                                                if (apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx][dType][elName][name]) {
                                                    newVal = (typeof actionObj.detailList[checkIdx][elName][dType][i].value == "string")
                                                        ? actionObj.detailList[checkIdx][elName][dType][i].value
                                                        : (actionObj.detailList[checkIdx][elName][dType][i].value.value != undefined)
                                                            ? actionObj.detailList[checkIdx][elName][dType][i].value.value
                                                            : apf.serialize(actionObj.detailList[checkIdx][elName][dType][i].value).split("<").join("&lt;").split(">").join("&gt;");
                                                            
                                                    if (newVal == apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx][dType][elName][name]) {
                                                        valMatch = true;
                                                    }
                                                }
                                                else {
                                                    valMatch = true;
                                                }
                                                break;
                                            }
                                        }
                                    }
    
                                    // value not set, call waitFor
                                    if (!valSet) {
                                        // add check for startEvent
                                        this.$waitForCheckList.push({
                                            type    : dType,
                                            elName  : elName,
                                            name    : name,
                                            value   : apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx][dType][elName][name],
                                            time    : new Date().getTime()
                                        });
                                        
                                        // delete from checkList
                                        delete apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx][dType][elName][name];
                                        
                                        if (eventName == "mousedown" && apf.uirecorder.playback.$keyActions[keyActionIdx+1] && apf.uirecorder.playback.$keyActions[keyActionIdx+1].getAttribute("name") == "mouseup") {
                                            // set pause after mouseup
                                            apf.uirecorder.playback.$pauseAfterAction = {
                                                action: "mouseup",
                                                params: [actionObj, eventName, actionIdx, keyActionIdx, checkIdx]
                                            }
                                        }
                                        else {
                                            apf.uirecorder.output.testLog.push(keyActionIdx + ". checkResults(): test paused - wait for setting " + name + " on element " + elName);
                                            if (this.$waitForInterval == "") {
                                                apf.uirecorder.playback.pause();
                                                this.$waitForInterval = setInterval(function() {
                                                    apf.uirecorder.testing.$waitFor(actionObj, eventName, actionIdx, keyActionIdx, checkIdx);
                                                }, 10);
                                            }
                                        }
                                        
                                        /*
                                        apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.VALUE_NOT_SET, { 
                                            val         : [dType, name, elName], 
                                            action      : eventName,
                                            keyActionIdx: apf.uirecorder.playback.$getKeyActionIdx(eventName)
                                        });
                                        */
                                    }
                                    else if (!valMatch) {
                                        apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.VALUE_DIFFERENT, { 
                                            val         : [dType, name, elName, apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx][dType][elName][name], newVal], 
                                            action      : eventName,
                                            keyActionIdx: apf.uirecorder.playback.$getKeyActionIdx(eventName)
                                        });
                                    }
                                    else {
                                        // @todo delete from checkList
                                        //apf.console.info("succesfull check: " + prop + ": " + elName + " - " + name);
                                        delete apf.uirecorder.playback.$checkList[keyActionIdx][prop][checkIdx][dType][elName][name];
                                    }
                                }
                            }                            
                        }
                        break;
                }
            }
            /*
            if (deleteCheckList.length) {
                for (var i = 0, l = deleteCheckList.length; i < l; i++) {
                    delete deleteCheckList[i];
                }
            }
            */
        }
    }
}

apf.uirecorder.output = {
    $popup          : false,
    $popupQueue     : [],
    $popupOnMouseup : false,

    testLog         : [],

    // messages output for test results
    notices : {
        TEST_SUCCESSFUL     : "Test \"_VAL_\" was completed successfully.",
        TEST_FAILED         : "Test \"_VAL_\" failed."
    },
    warnings : {
        NO_ID               : "No id specified for element \"_VAL_\". Using xpath to determine element now. Could lead to failed test if elements are added/removed.",
        VALUE_NOT_SET       : "_VAL_ \"_VAL_\" is not set on element \"_VAL_\"",
        VALUE_DIFFERENT     : "_VAL_ \"_VAL_\" on element \"_VAL_\" has a different value\nOld value: \"_VAL_\"\nNew value: \"_VAL_\""
//        MODEL_NO_ID         : "Model without id found. ID is required for a model."
    },
    errors : {
        NODE_NOT_VISIBLE    : "Element \"_VAL_\" exists but is not visible.",
        NODE_NOT_EXIST      : "Element \"_VAL_\" does not exists.",

        ACTION_WRONG_TARGET : "Could not perform action \"_VAL_\" on element \"_VAL_\".",
        
        SCRIPT_CRITICAL     : "A critical error has occurred: \"_VAL_\" in file: \"_VAL_\" on line: \"_VAL_\"",
        CHECK_TIMEOUT       : "It takes too long to set _VAL_ \"_VAL_\" on element \"_VAL_\". Test stopped.",
        ELEMENT_TIMEOUT     : "Waiting for element \"_VAL_\" takes too long. Test stopped."
    },
    
    // save test after recording/playback
    $saveTest : function(saveType) {
        /*
        var id;
        if (saveType == "test") {
            if (!apf.uirecorder.testListXml)
                apf.uirecorder.testListXml = apf.getXml("<testList />");
            id = parseInt(apf.uirecorder.testListXml.childNodes.length) + 1;
        }
        else if (saveType == "results") {
            if (!apf.uirecorder.resultListXml)
                apf.uirecorder.resultListXml = apf.getXml("<resultList />");
            id = parseInt(apf.uirecorder.resultListXml.childNodes.length) + 1;
        }
        */
        var testXml = apf.getXml("<test />");
        
        if (apf.uirecorder.isTesting) {
            testXml.setAttribute("name", apf.uirecorder.playback.$curTestXml.getAttribute("name"));
            testXml.setAttribute("file", apf.uirecorder.playback.$curTestXml.getAttribute("name"));
        }
        else {
            testXml.setAttribute("name", apf.uirecorder.capture.$curTestId);
            testXml.setAttribute("file", apf.uirecorder.capture.$curTestFile);
        }

        var detailTypes = {"events": "event", "properties": "property", "data": "dataItem"};
        for (var prevNode, action, aNode, amlNodeName, i = 0, l = apf.uirecorder.actionList.length; i < l; i++) {
            action = apf.uirecorder.actionList[i];
            // skip current action if next action is played at same time
            if (apf.uirecorder.actionList[i+1] && action.time == apf.uirecorder.actionList[i+1].time) continue;
            
            // skip small mousemove between certain actions, like between mousedown/mouseup
            /*
            if (action.name == "mousemove" && apf.uirecorder.actionList[i-1] && apf.uirecorder.actionList[i-1].name == "mousedown" && apf.uirecorder.actionList[i+1] && apf.uirecorder.actionList[i+1].name == "mouseup") {
                continue;
            }
            */
            
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name"       , action.name);
            aNode.setAttribute("x"          , action.x);
            aNode.setAttribute("y"          , action.y);
            aNode.setAttribute("time"       , action.time);
            if (action.delayTime) aNode.setAttribute("delayTime"  , action.delayTime);
            if (action.keyActionIdx != undefined) {
                aNode.setAttribute("keyActionIdx"  , action.keyActionIdx);
                if (action.target) {
                    if (action.target.caption) aNode.setAttribute("caption", action.name + " (" + action.target.caption + ")");
                    if (action.target.nodeName) aNode.setAttribute("targetType", action.target.nodeName);
                    if (action.target.value) aNode.setAttribute("targetValue", action.target.value);
                }
            }
            
            if (action.ignore) { 
                aNode.setAttribute("ignore", action.ignore);
            }

            if (action.amlNode && action.amlNode.localName != "debugwin") {
                if (action.amlNode.parentNode && action.amlNode.tagName) {
                    var amlNodeName = action.amlNode.id || apf.xmlToXpath(action.amlNode);
                    if (amlNodeName.indexOf("/text()[") > -1)
                        amlNodeName = amlNodeName.substr(0, amlNodeName.length - "/text()[x]".length)
                    
                    aNode.setAttribute("amlNode", amlNodeName);
                }
            }
            if (action.htmlNode && action.htmlNode.name) {
                aNode.setAttribute("htmlNode", action.htmlNode.name);
                aNode.setAttribute("width", action.htmlNode.width);
                aNode.setAttribute("height", action.htmlNode.height);
                aNode.setAttribute("absX", action.htmlNode.x);
                aNode.setAttribute("absY", action.htmlNode.y);
                aNode.setAttribute("scrollTop", action.htmlNode.scrollTop);
                aNode.setAttribute("scrollLeft", action.htmlNode.scrollLeft);
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
                detailNode = testXml.ownerDocument.createElement("details" + parseInt(dli+1));
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
                                iNode.setAttribute("time", item.time);
                                
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

        apf.uirecorder.outputXml = testXml;
    },
    
    // set warning/error/notice
    setTestResult : function(type, msg, values) {
        var testName = apf.uirecorder.playback.$curTestXml.getAttribute("name");
        if (!apf.uirecorder.testResults[type][testName]) apf.uirecorder.testResults[type][testName] = [];
        
        var message = msg;

        // create message, replace _VAL_ in string with specified values
        if (values.val) {
            if (typeof values.val == "string")
                message = message.replace("_VAL_", values.val);
            
            // multiple values in message
            else 
                for (var vi = 0, vl = values.val.length; vi < vl; vi++) 
                    message = message.replace("_VAL_", values.val[vi]);
        }

        // search for duplicates
        var found = false;        
        for (var i = 0, l = apf.uirecorder.testResults[type][testName].length; i < l; i++) {
            if (apf.uirecorder.testResults[type][testName][i].message == message) {
                found = true;
                break;
            }
        }
        
        // set message
        if (!found) {
            apf.console.info(type + ": " + message);

            // handle warning
            if (apf.uirecorder.isTesting && type == "warning") {
                this.$popupQueue.push({
                    type    : type,
                    action  : values.action,
                    message : message
                });
                
                if (values.action == "mousedown") {
                    this.$popupOnMouseup = true;
                }
                
                // show popup if not popup is shown already and ignoreWarnings is false
                if (!apf.uirecorder.output.$popup && !apf.uirecorder.settings.testing.ignoreWarnings) {
                    // if needed wait for mouseup (after mousedown) to prevent mousedown/mouseup combo being disturbed
                    if (!this.$popupOnMouseup) {
                        this.$showPopup();
                    }
                }
            }
            
            // handle error
            if (type == "error") {
                var isTesting = apf.uirecorder.isTesting;
                apf.uirecorder.output.setTestResult("notice", apf.uirecorder.output.notices.TEST_FAILED, { 
                    val: testName
                });

                apf.uirecorder.playback.stop();
                //apf.console.info("error popup");
                apf.dispatchEvent("apftest_" + type, {message: message, isTesting: isTesting})
            }

            // save message            
            apf.uirecorder.testResults[type][testName].push({
                action      : values.action, 
                testId      : testName, 
                keyActionIdx: values.keyActionIdx, 
                elName      : values.elName, 
                name        : values.name, 
                message     : message
            });

        }
    },
    
    // show popup
    $showPopup : function() {
        // short delay to let script finish previous action        
        setTimeout(function() {
            apf.uirecorder.output.$popup = true;
            this.$popupOnMouseup = false;
            apf.console.info("paused by $showpopup");
            apf.uirecorder.playback.pause();
            apf.dispatchEvent("apftest_" + apf.uirecorder.output.$popupQueue[0].type, {message: apf.uirecorder.output.$popupQueue[0].message, isTesting: apf.uirecorder.isTesting})
        }, 500);
        apf.addEventListener("apftest_testcontinue", apf.uirecorder.output.$continueTest);
    },
    
    // continue with current test after popup
    $continueTest : function(e) {
        apf.uirecorder.output.$popupQueue.shift();
        if (apf.uirecorder.settings.testing.ignoreWarnings != e.ignoreWarnings) {
            apf.uirecorder.$settingsChanged = true;
            apf.uirecorder.settings.testing.ignoreWarnings = e.ignoreWarnings;
        }
        
        
        // no popups in queue
        if (!apf.uirecorder.output.$popupQueue.length || apf.uirecorder.settings.testing.ignoreWarnings) {
            // reset popupQueue
            apf.uirecorder.output.$popupQueue = [];
            apf.removeEventListener("apftest_testcontinue", apf.uirecorder.output.$continueTest);
  
            // small delay to enable user to release mouse
            setTimeout(function() {
                apf.uirecorder.output.$popup = false;
                apf.console.info("resumed after $showPopup");
                apf.uirecorder.playback.resume();
            }, 500);
        }
        
        // show next popup in queue
        else {
            apf.dispatchEvent("apftest_" + apf.uirecorder.output.$popupQueue[0].type, {message: apf.uirecorder.output.$popupQueue[0].message})
        }
    },
    
    // convert testResults object to Xml format
    createTestResultsXml : function() {
        var xml = apf.getXml("<testResults />");
        var types = ["error", "warning", "notice"];
        var resultNode;
        var testId = apf.uirecorder.playback.$curTestXml.getAttribute("name");
        
        for (var type, ti = 0, tl = types.length; ti < tl; ti++) {
            type = types[ti];
            if (apf.uirecorder.testResults[type] && apf.uirecorder.testResults[type][testId] && apf.uirecorder.testResults[type][testId].length) {
                for (var i = 0, l = apf.uirecorder.testResults[type][testId].length; i < l; i++) {
                    resultNode = xml.ownerDocument.createElement(type);
                    //resultNode.setAttribute("type", type);
                    resultNode.setAttribute("testId", testId);
                    if (apf.uirecorder.testResults[type][testId][i].action)
                        resultNode.setAttribute("action", apf.uirecorder.testResults[type][testId][i].action + " (" + apf.uirecorder.testResults[type][testId][i].keyActionIdx + ")");
                    resultNode.appendChild(xml.ownerDocument.createTextNode(apf.uirecorder.testResults[type][testId][i].message));
                    xml.appendChild(resultNode);
                }
            }
        }

        // temp solution for "datagrid using same model" bug
        var numErrors   = xml.selectNodes("error").length;
        var numWarnings = xml.selectNodes("warning").length;
        var numNotices  = xml.selectNodes("notice").length;

        if (numErrors == 0) {
            resultNode = xml.ownerDocument.createElement("error");
            resultNode.setAttribute("testId", testId);
            resultNode.appendChild(xml.ownerDocument.createTextNode("No errors found"));
            xml.appendChild(resultNode);
            //numErrors = 1;

            // test succesfull
            resultNode = xml.ownerDocument.createElement("notice");
            resultNode.setAttribute("testId", testId);
            resultNode.appendChild(xml.ownerDocument.createTextNode("test \"" + testId + "\" was  succesfully"));
            xml.appendChild(resultNode);
        }
        if (numWarnings == 0) {
            resultNode = xml.ownerDocument.createElement("warning");
            resultNode.setAttribute("testId", testId);
            resultNode.appendChild(xml.ownerDocument.createTextNode("No warnings found"));
            xml.appendChild(resultNode);
            numWarnings = 1;
        }
        if (numNotices == 0 && numErrors != 0) {
            resultNode = xml.ownerDocument.createElement("notice");
            resultNode.setAttribute("testId", testId);
            resultNode.appendChild(xml.ownerDocument.createTextNode("No notices found"));
            xml.appendChild(resultNode);
            numNotices = 1;
        }
        apf.uirecorder.testResultsXml = xml;
    }
}
//#endif