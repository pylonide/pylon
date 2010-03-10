// #ifdef __WITH_UIRECORDER
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
apf.uirecorder = {
    inited      : false,
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
    testResultsXml  : null,
    testListXml     : null,     // xml object with captured tests
    resultListXml   : null,     // xml object with results after testing
    outputXml       : null     // output xml for recorded test or test results
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
        // @todo fix problem with onkeyup in apf
    },

    // Reset capturing
    reset : function() {
        apf.uirecorder.inited               = false;
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
        if (apf.uirecorder.isRecording)
            apf.uirecorder.output.$saveTest("test");
        if (apf.uirecorder.isTesting)
            apf.uirecorder.output.$saveTest("results");
        //apf.uirecorder.capture.reset();
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
            detailList  : []
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
            actionObj.detailList[0] = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {};
            
            delayObj = actionObj;
            index = actionObj.index = apf.uirecorder.actionList.length;
        }
        
        // warning for AML nodes with no id defined
        var testId = (apf.uirecorder.isTesting) ? apf.uirecorder.playback.$curTestXml.getAttribute("name") : apf.uirecorder.capture.$curTestId;
        for (var elementName in actionObj.detailList[0]) {
            if (elementName.indexOf("html[") == 0) {
               apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.NO_ID, { 
                    val: elementName, 
                    testId: testId
                });
            }
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
            apf.uirecorder.capture.current.actionIdx = apf.uirecorder.capture.$curCheckActionIdx;

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
                apf.uirecorder.capture.$runInContext(currentState, f);
                recursion = false;
            }, ms);
        }

        //first check, 2nd check in $setDelayedDetails()
        if (apf.uirecorder.isTesting && eventName != "mousemove") {
            apf.uirecorder.testing.$checkResults(actionObj, eventName, apf.uirecorder.testing.$curCheckActionIdx, 0);
            apf.uirecorder.testing.$curCheckActionIdx++;
        }
    },

    $runInContext : function(state, f){
        //Put everything until now on the current action
        apf.uirecorder.capture.$setDelayedDetails(this.current.index, this.current.eventName, this.current.actionIdx);
       
        //Set the new stuff on the past action
        if (typeof f == "string")
            apf.exec(f)
        else
            f();
            
        apf.uirecorder.capture.$setDelayedDetails(state.index, state.eventName, state.actionIdx);
    },
    
    // capture detailed event calls, property/model data changes
    $setDelayedDetails : function(index, eventName, actionIdx) {
        var time = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);
        
        // if object is mousemove delayTime is possibly set multiple times, take time with highest number
        if (!apf.uirecorder.actionList[index].delayTime || time > apf.uirecorder.actionList[index].delayTime)
            apf.uirecorder.actionList[index].delayTime = time;
        for (var elementName in apf.uirecorder.detailList) {
            /*
            if (!apf.uirecorder.actionList[index].detailList) apf.uirecorder.actionList[index].detailList = {};
            if (!apf.uirecorder.actionList[index].detailList[elementName]) apf.uirecorder.actionList[index].detailList[elementName] = {
                amlNode     : (apf.uirecorder.detailList[elementName] && apf.uirecorder.detailList[elementName].amlNode) ? apf.uirecorder.detailList[elementName].amlNode : null,
                events      : [],
                properties  : [],
                data        : []
            };
            */
            apf.uirecorder.actionList[index].detailList[1]     = apf.uirecorder.detailList;
        }
        
        apf.uirecorder.detailList = {};

        if (apf.activeElement && apf.activeElement.parentNode)
            apf.uirecorder.actionList[index].activeElement = apf.activeElement.id || apf.xmlToXpath(apf.activeElement);

        // 2nd check
        if (apf.uirecorder.isTesting && eventName != "mousemove")
            apf.uirecorder.testing.$checkResults(apf.uirecorder.actionList[index], eventName, actionIdx, 1);
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
            //if (!apf.uirecorder.testEventList[eventName]) apf.uirecorder.testEventList[eventName] = [];
            //apf.uirecorder.testEventList[eventName].push(targetName);
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
    }
}

apf.uirecorder.playback = {
    $curTestXml     : null,
    $curActionIdx   : 0,
    $curAction      : null,
    $playSpeed      : "realtime",
    $timeoutTimer   : null,
    $startTestDelay : 0,
    $testDelay      : 0,
    $windowOffset   : {
        top     : 0,
        left    : 0
    },

    // reset playback
    reset : function() {
        apf.uirecorder.isPlaying = false;
        apf.uirecorder.isTesting = false;
    },
    
    // playback current test and save test results
    test : function(testXml, playSpeed, o3, offset) {
        apf.uirecorder.isTesting = true;
        
        this.play(testXml, playSpeed, o3, offset);
    },
    
    // stop playing
    stop : function() {
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
        this.$o3            = o3;
        this.$playSpeed     = playSpeed;
        this.$curTestXml    = testXml;
        this.$curActionIdx  = 0;
        this.$windowOffset  = offset;
        
        if (!apf.uirecorder.isTesting)
            apf.uirecorder.isPlaying = true;
        apf.uirecorder.capture.$init();

        apf.uirecorder.capture.$startTime = new Date().getTime();
        this.$playAction();
    },
    
    // play current action of test
    $playAction : function() {
        if (!(apf.uirecorder.isTesting || apf.uirecorder.isPlaying) || apf.uirecorder.isPaused) return;
        this.$curAction     = this.$curTestXml.childNodes[this.$curActionIdx];
        
        if (this.$playSpeed == "realtime") {
            if (this.$timeoutTimer) {
                clearTimeout(this.$timeoutTimer);
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
            this.$execAction();
        }
    },
    
    // execute user interaction for current action
    $mouseTargetActions : ["mousedown", "mouseup", "mousescroll", "dblClick"],
    $mouseMoveActions   : ["mousemove", "mousedown", "mouseup", "mousescroll", "dblClick"],
    $detailTypes        : {"events": "event", "properties": "property", "data": "dataItem"},
    $execAction : function() {
        if (!(apf.uirecorder.isTesting || apf.uirecorder.isPlaying) || apf.uirecorder.isPaused) return;
        // locate html element and calculate position of mouse action
        if (apf.uirecorder.playback.$mouseTargetActions.indexOf(this.$curAction.getAttribute("name")) > -1) {
            var xPos, yPos;

            if (this.$curAction.getAttribute("amlNode")) {
                if (this.$curAction.getAttribute("htmlNode")) {
                    var htmlNode;
                    var amlNode = (this.$curAction.getAttribute("amlNode").indexOf("html[") == 0) 
                        ? apf.document.selectSingleNode(this.$curAction.getAttribute("amlNode").substr(8)) // search for amlNode based on xpath
                        : window[this.$curAction.getAttribute("amlNode")] // search for amlNode with id 
                               || null; // no amlNode found
                    
                    if (!amlNode) {
                        apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.NODE_NOT_EXIST, {
                            val     : this.$curAction.getAttribute("amlNode"), 
                            testId  : this.$curTestXml.getAttribute("name")
                        }, true);
                        return;
                    }
        
                    // get htmlNode
                    if (this.$curAction.getAttribute("htmlNode") == "$ext")
                        htmlNode = amlNode.$ext;
                    else if (amlNode.$getActiveElements && amlNode.$getActiveElements()[this.$curAction.getAttribute("htmlNode")])
                        htmlNode = amlNode.$getActiveElements()[this.$curAction.getAttribute("htmlNode")];
                    
                    // htmlNode not visible
                    if (htmlNode) { 
                        if (htmlNode.offsetTop == 0 && htmlNode.offsetLeft == 0 && htmlNode.offsetWidth == 0 && htmlNode.offsetHeight == 0) {
                            apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.NODE_NOT_VISIBLE, {
                                val: (this.$curAction.getAttribute("htmlNode") != "$ext" ? this.$curAction.getAttribute("htmlNode") : this.$curAction.getAttribute("amlNode")), 
                                testId: this.$curTestXml.getAttribute("name")
                            }, true);
                        }
                        
                        // position of htmlNode
                        var pos = apf.getAbsolutePosition(htmlNode, htmlNode.parentNode)
                        xPos = pos[0]-(parseInt(this.$curAction.getAttribute("absX"))-parseInt(this.$curAction.getAttribute("x"))) * ((htmlNode.offsetWidth/this.$curAction.getAttribute("width")));
                        yPos = pos[1]-(parseInt(this.$curAction.getAttribute("absY"))-parseInt(this.$curAction.getAttribute("y"))) * ((htmlNode.offsetHeight/this.$curAction.getAttribute("height")));
                    }
                }
                else {
                    debugger;
                } 
            }
        }
        
        // move mouse cursor to correct position
        if (apf.uirecorder.playback.$mouseMoveActions.indexOf(this.$curAction.getAttribute("name") > -1)) {
            if (!xPos && !yPos) {
                xPos = this.$curAction.getAttribute("x");
                yPos = this.$curAction.getAttribute("y");
            }
    
            // move mouse cursor to correct position
            this.$o3.mouseTo(
                parseInt(xPos) + this.$o3.window.clientX + this.$windowOffset.left, 
                parseInt(yPos) + this.$o3.window.clientY + this.$windowOffset.top, 
                this.$o3.window
            );
        }
        
        // execute mouse action
        if (this.$curAction.getAttribute("name") === "keypress") {
            this.$o3.sendAsKeyEvents(this.$curAction.getAttribute("value"));
        }
        else if (this.$curAction.getAttribute("name") === "keydown") {
            this.$o3.sendKeyDown(this.$curAction.getAttribute("value"));
        }
        else if (this.$curAction.getAttribute("name") === "keyup") {
            this.$o3.sendKeyUp(this.$curAction.getAttribute("value"));
        }
        else if (this.$curAction.getAttribute("name") === "mousedown") {
            if (this.$playSpeed == "max") 
                this.$o3.wait(1);
            this.$o3.mouseLeftDown();
        }
        else if (this.$curAction.getAttribute("name") === "mouseup") {
            if (this.$playSpeed == "max")
                this.$o3.wait(1);
            this.$o3.mouseLeftUp();
        }
        else if (this.$curAction.getAttribute("name") === "dblClick") {
            if (this.$playSpeed == "max") 
                this.$o3.wait(1);
            this.$o3.mouseLeftDown();
            this.$o3.mouseLeftUp();
            this.$o3.mouseLeftDown();
            this.$o3.mouseLeftUp();
        }
        else if (this.$curAction.getAttribute("name") === "mousescroll") {
            this.$o3.mouseWheel(this.$curAction.getAttribute("value"));
        }
        
        // set checks
        var actionIdx = apf.uirecorder.testing.$checkList.length;
        if (this.$curAction.getAttribute("name") != "mousemove") {
            
            // set checks to see if action is performed on correct htmlNode
            if (this.$curAction.getAttribute("htmlNode")) {
                // @todo multiselect items
                // @todo popup elements
                if (!apf.uirecorder.testing.$checkList[actionIdx]) apf.uirecorder.testing.$checkList[actionIdx] = {};
                apf.uirecorder.testing.$checkList[actionIdx].htmlNode = (this.$curAction.getAttribute("htmlNode") == "$ext") ? this.$curAction.getAttribute("amlNode") : this.$curAction.getAttribute("htmlNode");
            }
            
            // set checks to compare value of properties, events and data 
            for (var dIdx, di = 0, dl = this.$curAction.childNodes.length; di < dl; di++) {
                dIdx = this.$curAction.childNodes[di].getAttribute("index");
                for (var elName, nodes, ci = 0, cl = this.$curAction.childNodes[di].childNodes.length; ci < cl; ci++) {
                    elName = this.$curAction.childNodes[di].childNodes[ci].getAttribute("name");
                    for (var type in this.$detailTypes) {
                        if (!this.$curAction.childNodes[di].childNodes[ci].selectSingleNode(type)) continue;
                        nodes = this.$curAction.childNodes[di].childNodes[ci].selectSingleNode(type).selectNodes(this.$detailTypes[type]);
    
                        for (var node, ni = 0, nl = nodes.length; ni < nl; ni++) {
                            node = nodes[ni];
                            
                            if (type == "properties") {
                                if (!apf.uirecorder.testing.$checkList[actionIdx]) apf.uirecorder.testing.$checkList[actionIdx] = {};
                                if (!apf.uirecorder.testing.$checkList[actionIdx].details) apf.uirecorder.testing.$checkList[actionIdx].details = [];
                                if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx]) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx] = {};
                                if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].properties) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].properties = {};
                                if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].properties) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].properties = {};
                                if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].properties[elName]) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].properties[elName] = {};
                                apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].properties[elName][node.getAttribute("name")] = node.text;
                            }
                            else if (type == "events") {
                                if (node.getAttribute("value")) {
                                    if (!apf.uirecorder.testing.$checkList[actionIdx]) apf.uirecorder.testing.$checkList[actionIdx] = {};
                                    if (!apf.uirecorder.testing.$checkList[actionIdx].details) apf.uirecorder.testing.$checkList[actionIdx].details = [];
                                    if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx]) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx] = {};
                                    if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].events) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].events = {};
                                    if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].events[elName]) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].events[elName] = {};
                                    apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].events[elName][node.getAttribute("name")] = node.value;
                                }
                            }
                            else if (type == "data") {
                                if (!apf.uirecorder.testing.$checkList[actionIdx]) apf.uirecorder.testing.$checkList[actionIdx] = {};
                                if (!apf.uirecorder.testing.$checkList[actionIdx].details) apf.uirecorder.testing.$checkList[actionIdx].details = [];
                                if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx]) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx] = {};
                                if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].data) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].data = {};
                                if (!apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].data[elName]) apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].data[elName] = {};
                                apf.uirecorder.testing.$checkList[actionIdx].details[dIdx].data[elName][node.getAttribute("name")] = node.text;
                            }
                        }
                    }
                }
            }
        }

        this.$testCheck();
    },
    
    // check if more actions are available for playback, if not end current test 
    $testCheck : function() {
        if (!(apf.uirecorder.isTesting || apf.uirecorder.isPlaying) || apf.uirecorder.isPaused) return;
        // more actions to be executed
        if (this.$curTestXml.childNodes.length > this.$curActionIdx+1) {
            this.$curActionIdx++;
            this.$playAction();
        }
        
        // test complete, process results
        else {
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
        }
    }
}

apf.uirecorder.testing = {
    $curCheckActionIdx  : 0,        // index of action that is checked at the moment 
    $checkList          : [],       // list with checks that need to be performed during testing
    ignoreWarnings      : false,    // ignore coming warnings during testing
     
    $checkResults : function(actionObj, eventName, actionIdx, checkIdx) {
        if (this.$checkList[actionIdx]) {
            for (var prop in this.$checkList[actionIdx]) {
                switch (prop) {
                    case "htmlNode":
                        // match if amlNode id corresponds
                        if (actionObj.amlNode && actionObj.amlNode.id && this.$checkList[actionIdx][prop] == actionObj.amlNode.id) {
                            delete this.$checkList[actionIdx][prop];
                        }
                        
                        // @todo check popup
                        
                        // error if no amlNode is targeted
                        // or htmlNode is not part of the targeted amlNode, either activeElements or $ext
                        else if (!actionObj.amlNode 
                            || actionObj.amlNode.$getActiveElement && !actionObj.amlNode.$getActiveElements()[apf.uirecorder.testing.$checkList[actionIdx][prop]]
                            || this.$checkList[actionIdx][prop] == "$ext" && !actionObj.amlNode.$ext
                        ) {
                            apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.ACTION_WRONG_TARGET, {
                                val: [eventName, this.$checkList[actionIdx][prop]], 
                                testId  : apf.uirecorder.playback.$curTestXml.getAttribute("name"), 
                                action  : eventName + " (" + actionIdx + ")"
                            });
                        }
                        
                        // error if targeted htmlNode has different name than recorded htmlNode name
                        // or htmlNode is $ext, but not of targeted amlNode
                        else if (actionObj.htmlNode 
                             && ( (actionObj.htmlNode.name != "$ext" && actionObj.htmlNode.name != apf.uirecorder.testing.$checkList[actionIdx][prop]) 
                              || (actionObj.htmlNode.name == "$ext" && actionObj.amlNode && apf.uirecorder.testing.$checkList[actionIdx][prop] != (actionObj.amlNode.id || apf.xmlToXpath(actionObj.amlNode)))) 
                                ) {
                            apf.uirecorder.output.setTestResult("error", apf.uirecorder.output.errors.ACTION_WRONG_TARGET, {
                                val: [eventName, apf.uirecorder.testing.$checkList[actionIdx][prop]], 
                                testId  : apf.uirecorder.playback.$curTestXml.getAttribute("name"),
                                action  : eventName + " (" + actionIdx + ")"
                            });
                        }
                        
                        // no erros found, check successfull
                        else {
                            delete this.$checkList[actionIdx][prop];
                        }
                        break;
                    case "properties":
                    case "events":
                    case "data":
                        for (var elName in this.$checkList[actionIdx].details[checkIdx][prop]) {
                            for (var name in this.$checkList[actionIdx][prop][elName]) {
                                var valSet = false;
                                if (actionObj.detailList[checkIdx] && actionObj.detailList[checkIdx][elName] && actionObj.detailList[checkIdx][elName][prop] && actionObj.detailList[checkIdx][elName][prop].length) {
                                    for (var valMatch = false, i = 0, l = actionObj.detailList[checkIdx][elName][prop].length; i < l; i++) {
                                        if (actionObj.detailList[checkIdx][elName][prop][i].name == name) {
                                            valSet = true;
                                            
                                            // check string
                                            // check object, amlNode
                                            if ((typeof actionObj.detailList[checkIdx][elName][prop][i].value == "string" && actionObj.detailList[checkIdx][elName][prop][i].value == apf.uirecorder.testing.$checkList[actionIdx].details[checkIdx][prop][elName][name])
                                               || (apf.serialize(actionObj.detailList[checkIdx][elName][prop][i].value).split("<").join("&lt;").split(">").join("&gt;") == apf.uirecorder.testing.$checkList[actionIdx].details[checkIdx][prop][elName][name])
                                            ) {
                                                valMatch = true;
                                            }
                                            break;
                                        }
                                    }
                                }

                                //if (isSecondCheck) {
                                    if (!valSet) {
                                       apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.VALUE_NOT_SET, { 
                                            val         : [prop, name, elName], 
                                            testId      : apf.uirecorder.playback.$curTestXml.getAttribute("name"),
                                            action      : eventName + " (" + actionIdx + ")"
                                        });
                                    }
                                    else if (!valMatch) {
                                       apf.uirecorder.output.setTestResult("warning", apf.uirecorder.output.warnings.VALUE_INCORRECT, { 
                                            val         : [prop, name, elName], 
                                            testId      : apf.uirecorder.playback.$curTestXml.getAttribute("name"),
                                            action      : eventName + " (" + actionIdx + ")"
                                        });
                                    }
                                    else {
                                        apf.console.info("succesfull test: " + prop + ": " + elName + " - " + name);
                                    }
                                //}
                            }
                        }
                        break;
                }
            }
        }
    }
}

apf.uirecorder.output = {
    notices : {
        
    },
    warnings : {
        NO_ID               : "No id specified for element \"_VAL_\". Using xpath to determine element now. Could lead to failed test if elements are added/removed.",
        VALUE_NOT_SET       : "_VAL_ \"_VAL_\" is not set on element \"_VAL_\"",
        VALUE_INCORRECT     : "_VAL_ \"_VAL_\" on element \"_VAL_\" has a different value"
//        MODEL_NO_ID         : "Model without id found. ID is required for a model."
    },
    errors : {
        NODE_NOT_VISIBLE    : "Element \"_VAL_\" exists but is not visible.",
        NODE_NOT_EXIST      : "Element \"_VAL_\" does not exists.",

        ACTION_WRONG_TARGET : "Could not perform action \"_VAL_\" on element \"_VAL_\".",
        
        SCRIPT_CRITICAL     : "A critical error has occurred: \"_VAL_\" in file: \"_VAL_\" on line: \"_VAL_\""
    },
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
            //if (action.detailList) {
            for (var detailNode, dli = 0, dll = action.detailList.length; dli < dll; dli++) {
                detailNode = testXml.ownerDocument.createElement("details" + parseInt(dli+1));
                detailNode.setAttribute("index", dli);
                
                for (var elementName in action.detailList[dli]) {
                    eNode = testXml.ownerDocument.createElement("element");
                    eNode.setAttribute("name", elementName);
                    
                    for (var type in detailTypes) {
                        if (action.detailList[dli][elementName][type].length) {
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
                                    else {
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(apf.serialize(item.value).split("<").join("&lt;").split(">").join("&gt;")))
                                    }
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

            // handle warnings
            if (apf.uirecorder.isTesting && type == "warning" && !apf.uirecorder.testing.ignoreWarnings) {
                apf.uirecorder.playback.pause();
                
                setTimeout(function() {
                    apf.dispatchEvent("apftest_" + type, {message: message})
                }, 500);
                
                apf.addEventListener("apftest_testcontinue", this.$continueTest);
                        
    /*                
                // stop testing
                function() {
                    apf.uirecorder.actionList.push({
                        name: "Test failed: " + message
                    });
                    uir_windowPopup.setProperty("visible", false);
                    apf.uirecorder.testCheck(true);
                }
    */
            }
        }
    },
    
    $continueTest : function(e) {
        apf.uirecorder.testing.ignoreWarnings = e.ignoreWarnings;
        apf.removeEventListener("apftest_testcontinue", this.$continueTest);
        setTimeout(function() {
            apf.uirecorder.playback.resume();
        }, 500);
    },
    
    // convert testResults object to Xml format
    createTestResultsXml : function() {
        var xml = apf.getXml("<testResults />");
        var types = ["error", "warning", "notice"];
        var resultNode;
        for (var type, ti = 0, tl = types.length; ti < tl; ti++) {
            type = types[ti];
            for (var testId in apf.uirecorder.testResults[type]) {
                if (apf.uirecorder.testResults[type][testId].length) {
                    for (var i = 0, l = apf.uirecorder.testResults[type][testId].length; i < l; i++) {
                        resultNode = xml.ownerDocument.createElement(type);
                        //resultNode.setAttribute("type", type);
                        resultNode.setAttribute("testId", testId);
                        if (apf.uirecorder.testResults[type][testId][i].action)
                            resultNode.setAttribute("action", apf.uirecorder.testResults[type][testId][i].action);
                        resultNode.appendChild(xml.ownerDocument.createTextNode(apf.uirecorder.testResults[type][testId][i].message));
                        xml.appendChild(resultNode);
                    }
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
            numErrors = 1;
        }
        if (numWarnings == 0) {
            resultNode = xml.ownerDocument.createElement("warning");
            resultNode.setAttribute("testId", testId);
            resultNode.appendChild(xml.ownerDocument.createTextNode("No warnings found"));
            xml.appendChild(resultNode);
            numWarnings = 1;
        }
        if (numNotices == 0) {
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