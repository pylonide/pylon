// #ifdef __WITH_UIRECORDER
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
apf.uirecorder = {
    inited      : false,
    isRecording : false,

    setTimeout  : self.setTimeout,
    
    actionList  : [],   // list of captured user actions
    detailList  : {},   // list of captured events, property changes and model data changes 
    testResults : {     // list of notices, warnings and errors found after testing
        error      : {},
        warning    : {},
        notice     : {}
    },
    
    testListXml     : null,   // xml object with captured tests
    resultListXml   : null    // xml object with results after testing
} 

apf.uirecorder.capture = {
    /*
     * capturing vars and methods 
     */
    $startTime   : 0,    // starttime of recording
    $curTestFile : "",   // current file being recorded

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
            apf.uirecorder.capture.$captureAction("mousedown", e || event);
        }

        document.documentElement.onmouseup = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("mouseup", e || event);
        }
        
        document.documentElement.onmousemove = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
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
    },
    
    /* 
     * capture user actions
     * htmlElement : original html element on which the event occurred
     * htmlNode    : specific container that holds the htmlElement described above
     */
    $captureAction : function(eventName, e, value) {
        var htmlElement = (e) ? e.srcElement || e.target : null;
        var amlNode     = (htmlElement && apf.findHost(htmlElement)) ? apf.findHost(htmlElement) : null;

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
          
            // is multiselect widget
            // @todo generate name for multiselect htmlNode item
/*            
            if (amlNode && amlNode.hasFeature(apf.__MULTISELECT__) && amlNode.selected) {
                var xpath = apf.xmlToXpath(amlNode.selected);
                htmlNode = apf.xmldb.findHtmlNode(amlNode.selected, amlNode);
                htmlNodeName = htmlNode.innerText;
            }
*/
            if (!htmlNode) {
                if (amlNode) {
                    htmlNode = amlNode.$ext;
                    htmlNodeName = "$ext";
                }
            }
        }
        
        // elapsed time since start of recording/playback
        var time = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);

        // set action object
        var actionObj = {
            time        : time,
            name        : eventName,
            detailList  : {}
        }
        if (htmlElement)    actionObj.htmlElement   = htmlElement;
        if (amlNode)        actionObj.amlNode       = amlNode;
        if (e && e.clientX) actionObj.x             = parseInt(e.clientX);
        if (e && e.clientY) actionObj.y             = parseInt(e.clientY);
        if (value)          actionObj.value         = value;
        
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
        
        // process detailList
        // set init action, overwriting first (mousemove) action
        if (apf.uirecorder.actionList.length == 0) {
            actionObj.name = "init";
            actionObj.detailList = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {};
            apf.uirecorder.actionList.push(actionObj);
            return;
        }

        // save reference to first mousemove object
        var index, delayObj;
        if (apf.uirecorder.actionList.length == 1 || (apf.uirecorder.actionList.length > 1 && eventName == "mousemove" && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name != "mousemove")) {
            actionObj.index = apf.uirecorder.capture.actionList.length;
            apf.uirecorder.capture.firstMousemoveObj = actionObj;
        }
        
        // combine mousemove actions
        if (apf.uirecorder.actionList.length > 1 && eventName == "mousemove" && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name == "mousemove") {
            for (var elementName in apf.uirecorder.detailList) {
                if (!apf.uirecorder.capture.firstMousemoveObj.detailList) apf.uirecorder.capture.firstMousemoveObj.detailList = {};
                if (!apf.uirecorder.capture.firstMousemoveObj.detailList[elementName]) apf.uirecorder.capture.firstMousemoveObj.detailList[elementName] = {
                    amlNode     : apf.uirecorder.detailList[elementName].amlNode,
                    events      : [],
                    properties  : [],
                    data        : []
                };
    
                apf.uirecorder.capture.firstMousemoveObj.detailList[elementName].events     = apf.uirecorder.capture.firstMousemoveObj.detailList[elementName].events.concat(apf.uirecorder.detailList[elementName].events);
                apf.uirecorder.capture.firstMousemoveObj.detailList[elementName].properties = apf.uirecorder.capture.firstMousemoveObj.detailList[elementName].properties.concat(apf.uirecorder.detailList[elementName].properties);
                apf.uirecorder.capture.firstMousemoveObj.detailList[elementName].data       = apf.uirecorder.capture.firstMousemoveObj.detailList[elementName].data.concat(apf.uirecorder.detailList[elementName].data);
            }
            apf.uirecorder.detailList   = {};
            actionObj.ignore            = "true";
            apf.uirecorder.actionList.push(actionObj);

            delayObj    = apf.uirecorder.capture.firstMousemoveObj;
            index       = apf.uirecorder.capture.firstMousemoveObj.index;
        }
        else {
            actionObj.detailList = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {};
            
            delayObj = actionObj;
            index = actionObj.index = apf.uirecorder.capture.actionList.length;
        }
        
        // save action object
        apf.uirecorder.actionList.push(actionObj);
        
        
        //For new timeouts associated with the next action.
        var currentState = apf.uirecorder.capture.current = {};

        //For all the running timeouts
        apf.uirecorder.capture.current.actionObj = delayObj;
        apf.uirecorder.capture.current.index     = index;
        apf.uirecorder.capture.current.eventName = eventName;
        
        if (apf.uirecorder.isTesting)
            apf.uirecorder.capture.current.actionIdx = apf.uirecorder.capture.curCheckActionIdx;

        // delayed capturing of events
        var recursion = false;
        $setTimeout = function(f, ms){
            if (recursion)
                return;
            
            //Record current mouseEvent
            if (!ms) ms = null;
            return apf.uirecorder.setTimeout(function(){
                //apf.console.info("setTimeout");
                recursion = true;
                apf.uirecorder.capture.runInContext(currentState, f);
                recursion = false;
            }, ms);
        }
/*
        //first check, 2nd check in setDelayedDetails()
        if (apf.uirecorder.isTesting && eventName != "mousemove") {
            apf.uirecorder.checkResults(actionObj, eventName, apf.uirecorder.curCheckActionIdx);
            apf.uirecorder.curCheckActionIdx++;
        }
*/
    },

    runInContext : function(state, f){
        //Put everything until now on the current action
        apf.uirecorder.capture.setDelayedDetails(this.current.index, this.current.eventName, this.current.actionIdx);
       
        //Set the new stuff on the past action
        if (typeof f == "string")
            apf.exec(f)
        else
            f();
            
        apf.uirecorder.capture.setDelayedDetails(state.index, state.eventName, state.actionIdx);
    },
    
    // capture detailed event calls, property/model data changes
    setDelayedDetails : function(index, eventName, actionIdx) {
        var time = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);
        
        // if object is mousemove delayTime is possibly set multiple times, take time with highest number
        if (!apf.uirecorder.actionList[index].delayTime || time > apf.uirecorder.actionList[index].delayTime)
            apf.uirecorder.actionList[index].delayTime = time;
        for (var elementName in apf.uirecorder.detailList) {
            if (!apf.uirecorder.actionList[index].detailList) apf.uirecorder.actionList[index].detailList = {};
            if (!apf.uirecorder.actionList[index].detailList[elementName]) apf.uirecorder.actionList[index].detailList[elementName] = {
                amlNode     : (apf.uirecorder.detailList[elementName] && apf.uirecorder.detailList[elementName].amlNode) ? apf.uirecorder.detailList[elementName].amlNode : null,
                events      : [],
                properties  : [],
                data        : []
            };

            apf.uirecorder.actionList[index].detailList[elementName].events     = apf.uirecorder.actionList[index].detailList[elementName].events.concat(apf.uirecorder.detailList[elementName].events);
            apf.uirecorder.actionList[index].detailList[elementName].properties = apf.uirecorder.actionList[index].detailList[elementName].properties.concat(apf.uirecorder.detailList[elementName].properties);
            apf.uirecorder.actionList[index].detailList[elementName].data       = apf.uirecorder.actionList[index].detailList[elementName].data.concat(apf.uirecorder.detailList[elementName].data);
        }
        
        apf.uirecorder.detailList = {};

        if (apf.activeElement && apf.activeElement.parentNode)
            apf.uirecorder.actionList[index].activeElement = apf.activeElement.id || apf.xmlToXpath(apf.activeElement);

/*            
        // 2nd check
        if (apf.uirecorder.isTesting && eventName != "mousemove")
            apf.uirecorder.checkResults(apf.uirecorder.actionList[index], eventName, actionIdx); // true
*/
    },
    
    /*
     * capture apf events
     */
    captureEvent : function(eventName, e) {
        if (!e) debugger;
        
        var amlNode = e.amlNode || e.currentTarget;
        if (eventName == "movefocus")
            amlNode = e.toElement;
        else if (eventName == "DOMNodeRemoved")
            amlNode = e.relatedNode;
            
        // get name of target
        var targetName;

        // aml element
        if (amlNode && amlNode.parentNode) {
            targetName = amlNode.id || apf.xmlToXpath(amlNode);
        }
        // html element
        else if (amlNode && e.htmlEvent) {
            var htmlElement = e.htmlEvent.srcElement;
            targetName = ("&lt;" + htmlElement.tagName + "&gt; " + htmlElement.id) || "&lt;" + htmlElement.tagName + "&gt;";
        }
        // apf
        else if (amlNode && amlNode.console && amlNode.extend && amlNode.all) {
            targetName = "apf";
        }

        // specific cases for target name
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

        // no target name found
        if (!targetName) {
            if (amlNode && amlNode.localName)
                targetName = amlNode.id || amlNode.localName
            else
                targetName = "trashbin";
        }



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
        
        // create event list during testing, used to check if certain events are already called for an element
        if (apf.uirecorder.isTesting) {
            if (!apf.uirecorder.testEventList[eventName]) apf.uirecorder.testEventList[eventName] = [];
            apf.uirecorder.testEventList[eventName].push(targetName);
        }
    },
    
    capturePropertyChange : function(amlNode, prop, value) {
        if (amlNode) {
            targetName = amlNode.id || apf.xmlToXpath(amlNode);
        } 
        else {
            debugger;
        }

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
        
        apf.uirecorder.detailList[targetName].properties.push(propObj);
    },
    
    captureModelChange : function(params) {
        if (params.amlNode) {
            targetName = params.amlNode.id || apf.xmlToXpath(params.amlNode);
        }
        else {
            debugger;
        }

        // elapsed time since start of recording/playback
        var time        = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);
        var dataObj = {
            time        : time,
            name        : params.action
        }
        if (params.amlNode) {
            if (!dataObj.value) dataObj.value = {};
                dataObj.value.amlNode = apf.serialize(params.amlNode).split("<").join("&lt;").split(">").join("&gt;");
        }
        if (params.xmlNode) {
            if (!dataObj.value) dataObj.value = {};
                dataObj.value.xmlNode = apf.serialize(params.xmlNode).split("<").join("&lt;").split(">").join("&gt;");
        }
        
        if (!apf.uirecorder.detailList[targetName]) apf.uirecorder.detailList[targetName] = {
            amlNode     : params.amlNode,
            events      : [],
            properties  : [],
            data        : []
        };
        
        apf.uirecorder.detailList[targetName].data.push(dataObj);
    },
    
    // Reset capturing
    reset : function() {
        apf.uirecorder.inited               = false;
        apf.uirecorder.isRecording          = false;
        apf.uirecorder.capture.actionList   = [];
        apf.uirecorder.capture.detailList   = {};
    },

    // Initiate user interface recorder and start recording
    record : function(file) {
        apf.uirecorder.capture.reset();

        apf.uirecorder.capture.$curTestFile  = file;
        apf.uirecorder.capture.$startTime    = new Date().getTime();
        apf.uirecorder.isRecording  = true;

        apf.uirecorder.capture.$init();
    },
    
    // Stop capturing and save test
    stop : function() {
        if (apf.uirecorder.isRecording)
            apf.uirecorder.output.$saveTest("test");

        apf.uirecorder.capture.reset();
    }
}

apf.uirecorder.output = {
    notices : {
        
    },
    warnings : {
        NO_ID               : "No id specified for element \"_VAL_\". Using xpath to determine element now. Could lead to failed test if elements are added/removed."
    },
    errors : {
        NODE_NOT_VISIBLE    : "Element \"_VAL_\" exists but is not visible.",
        NODE_NOT_EXIST      : "Element \"_VAL_\" does not exists.",

        ACTION_WRONG_TARGET : "Could not perform action \"_VAL_\" on element \"_VAL_\".",

        PROP_NOT_SET        : "Property \"_VAL_\" is not set.",
        PROP_WRONG_VALUE    : "Could not perform action \"_VAL_\" on element \"_VAL_\".",

        MODEL_NOT_SET       : "Model data change \"_VAL_\" is not set correctly.",
        MODEL_WRONG_VALUE   : "Model data change \"_VAL_\" of element \"_VAL\" has wrong value.",
        MODEL_NO_ID         : "Model without id found. ID is required for a model.",
        
        SCRIPT_CRITICAL     : "A critical error has occurred: \"_VAL_\" in file: \"_VAL_\" on line: \"_VAL_\""
    },
    $saveTest : function(saveType) {
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
        
        var testXml = apf.getXml("<test />");
        testXml.setAttribute("file", apf.uirecorder.capture.$curTestFile);
        testXml.setAttribute("name", "test" + id);
        testXml.setAttribute("index", apf.uirecorder.testListXml.childNodes.length);

        var detailTypes = {"events": "event", "properties": "property", "data": "dataItem"};
        for (var prevNode, action, aNode, i = 0, l = apf.uirecorder.actionList.length; i < l; i++) {
            action = apf.uirecorder.actionList[i];
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name"       , action.name);
            aNode.setAttribute("x"          , action.x);
            aNode.setAttribute("y"          , action.y);
            aNode.setAttribute("time"       , action.time);
            if (action.delayTime) aNode.setAttribute("delayTime"  , action.delayTime);

            if (action.ignore) { 
                aNode.setAttribute("ignore", action.ignore);
            }

            if (action.amlNode && action.amlNode.localName != "debugwin") {
                if (action.amlNode.parentNode)
                    aNode.setAttribute("amlNode", action.amlNode.id || apf.xmlToXpath(action.amlNode));
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
            if (action.value || typeof action.value == "boolean") aNode.setAttribute("value", action.value);

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
            if (action.detailList) {
                for (var elementName in action.detailList) {
                    eNode = testXml.ownerDocument.createElement("element");
                    eNode.setAttribute("name", elementName);
                    
                    // warning for AML nodes with no id defined
                    //apf.document.selectSingleNode(targetName.substr(8))
                    if (elementName.indexOf("html[") == 0) {
                       apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.NO_ID, { 
                            val: elementName, 
                            testId: testXml.getAttribute("name")
                        });
                    }
                    for (var type in detailTypes) {
                        if (action.detailList[elementName][type].length) {
                            dNode = testXml.ownerDocument.createElement(type)
                            for (var item, vNode, di = 0, dl = action.detailList[elementName][type].length; di < dl; di++) {
                                item = action.detailList[elementName][type][di];
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
                                    else {
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(apf.serialize(item.value).split("<").join("&lt;").split(">").join("&gt;")))
                                    }
                                }
                                dNode.appendChild(iNode);
                            }
                            eNode.appendChild(dNode);
                        }
                    }
                    aNode.appendChild(eNode);
                }
            }
            testXml.appendChild(aNode);
        }

        if (saveType === "test")
            apf.uirecorder.testListXml.appendChild(testXml);
        else if (saveType === "results")
            apf.uirecorder.resultListXml.appendChild(testXml);
        
        debugger;
    },
    
    // set warning/error/notice
    setTestResult : function(type, msg, values, stopOnError) {
        if (values.testId)
            if (!apf.uirecorder.testResults[type][values.testId]) apf.uirecorder.testResults[type][values.testId] = [];
        
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
        if (values.testId) {
            for (var i = 0, l = apf.uirecorder.testResults[type][values.testId].length; i < l; i++) {
                if (apf.uirecorder.testResults[type][values.testId][i].message == message) {
                    found = true;
                    break;
                }
            }
        }
        
        // set message
        if (!found) {
            apf.uirecorder.testResults[type][values.testId].push({
                action      : values.action, 
                testId      : values.testId, 
                actionIdx   : values.actionIdx, 
                elName      : values.elName, 
                name        : values.name, 
                message     : message
            });
        }

        // handle errors
/*
        if (type == "error" && stopOnError) {
            //apf.uirecorder.testResults["error"][testId].push({message: "Test failed"});
            apf.console.info(values.actionIdx + ". test failed error: " + message);            

            apf.uirecorder.pause();

            apf.uirecorder.setPopupWindow("Error", message, 
                // ignore error, continue testing
                function() {
                    uir_windowPopup.setProperty("visible", false);
                    
                    // set timeout to enable user to release the mouse before continuing test
                    setTimeout(function() {
                        apf.uirecorder.resume();
                    }, 1000);
                    
                }, 
                
                // stop testing
                function() {
                    apf.uirecorder.actionList.push({
                        name: "Test failed: " + message
                    });
                    uir_windowPopup.setProperty("visible", false);
                    apf.uirecorder.testCheck(true);
                }
            )
        }
*/
    },
    
    saveFile : function(o3, type) {
        switch (type) {
            case "tests":
                o3.cwd.get("data/tests.xml").data = apf.uirecorder.testListXml.xml;
                //alert("file \"tests.xml\" saved to \"data\" folder");
                break;
            case "testResults":
                o3.cwd.get("data/testresults.xml").data = apf.uirecorder.testResultsXml.xml;
                //alert("file \"testresults.xml\" saved to \"data\" folder");
                break;
        }
    }
    
    
}
//#endif