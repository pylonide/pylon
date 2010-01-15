// #ifdef __WITH_UIRECORDER
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
apf.uirecorder = {
    isPlaying   : false,
    isRecording : false,
    inited      : false,
    
    playActions : {"mousemove":1, "click":1, "keypress":1},
    playList : [],
    initialState: {},
    
    init : function() {
        if (apf.uirecorder.inited)
            return;

        apf.uirecorder.inited = true;

        /* Form events support */
        document.documentElement.onselect = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }
        
        document.documentElement.onchange = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }
        
        document.documentElement.onsubmit = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }
        
        document.documentElement.onreset = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }
       
        /* User interface events support */
        document.documentElement.onfocus = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }

        document.documentElement.onblur = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }

        /* Mouse events support */
        document.documentElement.onclick = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            apf.uirecorder.captureAction("click", e);
        }
        
        document.documentElement.ondblclick = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }
        
        document.documentElement.onmousedown = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            apf.uirecorder.captureAction("mousedown", e);
        }
        
        document.documentElement.onmouseup = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            apf.uirecorder.captureAction("mouseup", e);
        }
        
        document.documentElement.onmousemove = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            apf.uirecorder.captureAction("mousemove", e);
        }
        
        document.documentElement.onmouseover = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }
        
        document.documentElement.onmouseout = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }

        /* Keyboard events support for all browsers */
        document.documentElement.onkeyup = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            //apf.uirecorder.captureAction("keypress", e, e.keyCode);
        }
        
        document.documentElement.onkeydown = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
        }
        
        document.documentElement.onkeypress = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;

            var character = "";
            if (e.keyCode) { // Internet Explorer
                character = String.fromCharCode(e.keyCode);
            } else if (e.which) { // W3C
                character = String.fromCharCode(e.which);
            }

            apf.uirecorder.captureAction("keypress", e, character);
        }

        /* Support for Mouse Scroll event */
        if(document.addEventListener) {
            /* FF */
            document.addEventListener("DOMMouseScroll", function(e) {
                if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                    return;
    
                e = e || event;
            }, false);
        }
        else {
            /* IE */
            document.onmousewheel = function(e) {
                if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                    return;

                e = e || event;
            };
        }
    },

    /**
     * Checks delta value and creates object to simulate mouse scroll
     * 
     * @param {Object} e   event object
     */
    createMouseWheelEvent : function(e) {
        var delta = null;
        if (e.wheelDelta) {
            delta = e.wheelDelta / 120;
            if (apf.isOpera)
                delta *= -1;
        }
        else if (e.detail)
            delta = -e.detail / 3;

        return {
            type : apf.isGecko ? "DOMMouseScroll" : (apf.isIE ? "mousewheel" : "DOMMouseScroll"),
            delta : delta
        }
    },

    /**
     * Initiate user interface recorder and start recording
     */
    startTime : 0,
    record : function() {
        apf.uirecorder.actionList = [];
        apf.uirecorder.startTime = new Date().getTime();
        apf.uirecorder.isRecording = true;
        apf.uirecorder.init();
    },
    
    /**
     * Stop recording and start playing
     */
    play : function() {
        // @todo see index.html
    },

    /**
     * Start testing
     */
    test : function() {
        apf.uirecorder.actionList = [];
        apf.uirecorder.startTime = new Date().getTime();
        apf.uirecorder.isTesting = true;
        apf.uirecorder.init();
    },
    
    /**
     * Stop recording and playing
     */
    stop : function() {
        if (apf.uirecorder.isRecording)
            apf.uirecorder.save("test");
        if (apf.uirecorder.isTesting)
            apf.uirecorder.checkResults();
        apf.uirecorder.isRecording = false;
        apf.uirecorder.isPlaying   = false;
        apf.uirecorder.isTesting   = false;
    },
    
    /**
     * Stop recording and playing, clear list of recorded actions
     */
    resetTests : function() {
        apf.uirecorder.isRecording = false;
        apf.uirecorder.isPlaying   = false;
        apf.uirecorder.isTesting   = false;
        apf.uirecorder.testListXml   = apf.getXml("<testList />");
    },

    /**
     * 
     */
    markupLoaded : false,
    load : function(file) {
        uir_bar.replaceMarkup(file);
        
        if (apf.uirecorder.isRecording || apf.uirecorder.isPlaying || apf.uirecorder.isTesting) {
            apf.uirecorder.captureAction("loadMarkup");
        }
    },
    
    /**
     * Record user action like mouse clicks, movement of keypress 
     */
    actionList      : [],
    keypresses : {
        
    },
    actionObjects : [],
    captureAction : function(eventName, e, value) {
        var htmlElement = (e) ? e.srcElement || e.target : null;
        var amlNode     = (htmlElement) ? apf.findHost(htmlElement) : null;
        
        // ignore interaction with uirecorder controls
        if (amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0) return;

        // time in ms when action is executed
        var time        = parseInt(new Date().getTime() - apf.uirecorder.startTime);
        var actionObj = {
            time        : time,
            name        : eventName
        }
        
        if (htmlElement) actionObj.htmlElement  = htmlElement;
        if (amlNode) actionObj.amlNode          = amlNode;
        if (e && e.clientX) actionObj.x         = e.clientX;
        if (e && e.clientY) actionObj.y         = e.clientY;

        if (eventName != "mousemove") {
            actionObj.detailList = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {};
        }
        // get keypress value
        if (eventName === "keypress") {
            actionObj.value = value;
        }
        apf.uirecorder.actionList.push(actionObj);
        //actionObj.activeElement = apf.xmlToXpath(apf.activeElement);
        
        var index = apf.uirecorder.actionObjects.length;
        apf.uirecorder.actionObjects.push(actionObj);
        var timeout = 200;
        if (eventName == "loadMarkup") timeout = 200;
        if (eventName != "mousemove") {
            setTimeout(function(){
                apf.uirecorder.setDelayedDetails(index); 
                index = null;
            }, timeout);
        }
    },
    setDelayedDetails : function(index) {
        for (var elementName in apf.uirecorder.detailList) {
            if (!apf.uirecorder.actionObjects[index].detailList) apf.uirecorder.actionObjects[index].detailList = {};
            if (!apf.uirecorder.actionObjects[index].detailList[elementName]) apf.uirecorder.actionObjects[index].detailList[elementName] = {
                amlNode     : apf.uirecorder.detailList[elementName].amlNode,
                events      : [],
                properties  : [],
                data        : []
            };

            apf.uirecorder.actionObjects[index].detailList[elementName].events = apf.uirecorder.actionObjects[index].detailList[elementName].events.concat(apf.uirecorder.detailList[elementName].events);
            apf.uirecorder.actionObjects[index].detailList[elementName].properties = apf.uirecorder.actionObjects[index].detailList[elementName].properties.concat(apf.uirecorder.detailList[elementName].properties);
            apf.uirecorder.actionObjects[index].detailList[elementName].data = apf.uirecorder.actionObjects[index].detailList[elementName].data.concat(apf.uirecorder.detailList[elementName].data);
        
        }
        apf.uirecorder.detailList = {};
        apf.uirecorder.actionObjects[index].activeElement = apf.xmlToXpath(apf.activeElement);
    },
    detailList : {},
    captureEvent : function(eventName, e) {
        if (!e || e.noCapture) return; 
        
        var amlNode;
        if (eventName != "movefocus")
            amlNode = e.amlNode || e.currentTarget;
        else
            amlNode = e.toElement;
        
        if (amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0) return;
        if (!amlNode || !amlNode.ownerDocument || !amlNode.$aml) {
            //debugger;
            return;
        }
        
        var targetName;
        if (amlNode)
            targetName = apf.xmlToXpath(amlNode);
            
        var eventObj = {
            name        : eventName,
            //amlNode     : amlNode,
            //xmlNode     : xmlNode,
            event       : e
        }
        
        if (targetName) {
            if (!apf.uirecorder.detailList[targetName]) apf.uirecorder.detailList[targetName] = {
                amlNode     : amlNode,
                events      : [],
                properties  : [],
                data        : []
            };
            
            apf.uirecorder.detailList[targetName].events.push(eventObj);
        }
    },
    capturePropertyChange : function(amlNode, prop, value) {
        if (amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0) return;
        if (amlNode)
            targetName = apf.xmlToXpath(amlNode);
        else
            debugger;
        
        
        var propObj = {
            name        : prop,
            //amlNode     : amlNode,
            //xmlNode     : xmlNode,
            value       : value
        }
            
        if (targetName) {
            if (!apf.uirecorder.detailList[targetName]) apf.uirecorder.detailList[targetName] = {
                amlNode     : amlNode,
                events      : [],
                properties  : [],
                data        : []
            };
            
            apf.uirecorder.detailList[targetName].properties.push(propObj);
        }
    },
    captureModelChange : function(params) {
        if (params.amlNode && params.amlNode.id && params.amlNode.id.indexOf("uir") == 0) return;
        if (params.amlNode)
            targetName = apf.xmlToXpath(params.amlNode);

        var dataObj = {
            name        : params.action,
            //amlNode     : amlNode,
            //xmlNode     : xmlNode,
            xmlNode     : params.xmlNode
        }
            
        if (targetName) {
            if (!apf.uirecorder.detailList[targetName]) apf.uirecorder.detailList[targetName] = {
                amlNode     : params.amlNode,
                events      : [],
                properties  : [],
                data        : []
            };
            
            apf.uirecorder.detailList[targetName].data.push(dataObj);
        }
    },

    /**
     * Save test 
     */
    testListXml : null,
    resultListXml : null,
    /**
     * Save test / test results
     */
    save : function(saveType) {
        var id;
        if (saveType === "test") {
            if (!apf.uirecorder.testListXml)
                apf.uirecorder.testListXml = apf.getXml("<testList />");
            id = parseInt(apf.uirecorder.testListXml.childNodes.length) + 1;
        }
        else if (saveType === "results") {
            if (!apf.uirecorder.resultListXml)
                apf.uirecorder.resultListXml = apf.getXml("<resultList />");
            id = parseInt(apf.uirecorder.resultListXml.childNodes.length) + 1;
        }
        
        var testXml = apf.getXml("<test />");
        testXml.setAttribute("name", "test" + id);
        testXml.setAttribute("index", apf.uirecorder.testListXml.childNodes.length);
        testXml.setAttribute("status", "success");        

        var detailTypes = {"events": "event", "properties": "property", "data": "dataItem"};
        for (var action, aNode, i = 0, l = apf.uirecorder.actionList.length; i < l; i++) {
            action = apf.uirecorder.actionList[i];
            //if (action.name == "loadMarkup") continue;
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name", action.name);
            aNode.setAttribute("x", action.x);
            aNode.setAttribute("y", action.y);
            aNode.setAttribute("time", action.time);
            if (action.amlNode) aNode.setAttribute("target", apf.xmlToXpath(action.amlNode));
            if (action.value) aNode.setAttribute("value", action.value);

            var eNode, iNode;
            eNode = testXml.ownerDocument.createElement("element");
            eNode.setAttribute("name", "apf");
            iNode = testXml.ownerDocument.createElement("activeElement");
            iNode.appendChild(testXml.ownerDocument.createTextNode(action.activeElement));
            eNode.appendChild(iNode);
            
            aNode.appendChild(eNode);
            
            if (action.detailList) {
                for (var elementName in action.detailList) {
                    eNode = testXml.ownerDocument.createElement("element");
                    eNode.setAttribute("name", elementName);
                    
                    for (var type in detailTypes) {
                        if (action.detailList[elementName][type].length) {
                            dNode = testXml.ownerDocument.createElement(type)
                            for (var item, vNode, di = 0, dl = action.detailList[elementName][type].length; di < dl; di++) {
                                item = action.detailList[elementName][type][di];
                                iNode = testXml.ownerDocument.createElement(detailTypes[type]);
                                iNode.setAttribute("name", item.name);
                                if (typeof item.value === "string")
                                    iNode.appendChild(testXml.ownerDocument.createTextNode(item.value));
                                else
                                    iNode.appendChild(testXml.ownerDocument.createTextNode("[object]"))
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

        // reset actionList
        apf.uirecorder.actionList = [];

        if (saveType === "test") {
            apf.uirecorder.testListXml.appendChild(testXml);
            apf.uirecorder.createChangesXml(apf.uirecorder.testListXml);
        }
        else if (saveType === "results") {
            apf.uirecorder.resultListXml.appendChild(testXml);
            apf.uirecorder.createChangesXml(apf.uirecorder.resultListXml);
        }
    },
    
    /**
     * check test results 
     */
    checkResults : function() {
        // loop through testListXml
        // for each detail check if it exist in resultListXml
            // check if value is the same
    },
    
    /**
     * create xml based on testListXml and resultListXml
     */
    changesXml : null,
    createChangesXml : function(xml) {
        if (!apf.uirecorder.changesXml) apf.uirecorder.changesXml = apf.getXml("<changes />");
        
        var detailTypes = {"events": "event", "properties": "property", "data": "dataItem"};
        for (var test, ti = 0, tl = xml.childNodes.length; ti < tl; ti++) {
            test = xml.childNodes[ti];
            
            // loop through actions
            for (var action, ai = 0, al = test.childNodes.length; ai < al; ai++) {
                action = test.childNodes[ai];
                
                if (action.childNodes && action.childNodes.length) {
                    for (var element, ei = 0, el = action.childNodes.length; ei < el; ei++) {
                        element = action.childNodes[ei];
                        
                        var details;
                        for (var type in detailTypes) {
                            if (element.selectSingleNode(type) && element.selectSingleNode(type).childNodes && element.selectSingleNode(type).childNodes.length) {
                                for (var node, detail, di = 0, dl = element.selectSingleNode(type).childNodes.length; di < dl; di++) {
                                    detail = element.selectSingleNode(type).childNodes[di];
    
                                    if (xml == apf.uirecorder.resultListXml) {
                                        if (node = apf.uirecorder.changesXml.selectSingleNode("//change[test[text()='" + test.getAttribute("name") + "']][action[text()='" + action.getAttribute("name") + "']][element[text()='" + element.getAttribute("name") + "']][type[text()='" + detail.nodeName + "']][name[text()='" + detail.getAttribute("name") + "']]")) {
                                            apf.xmldb.setTextNode(node.selectSingleNode("result"), detail.text);
                                            continue;
                                        }    
                                    }
                                    
                                    node = apf.uirecorder.changesXml.ownerDocument.createElement("change");
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("test")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(test.getAttribute("name")));
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("action")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(action.getAttribute("name")));
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("element")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(element.getAttribute("name")));
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("type")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(detail.nodeName));
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("name")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(detail.getAttribute("name")));
                                    if (xml == apf.uirecorder.testListXml) {
                                        node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("capture")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(detail.text));
                                        node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("result")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode("no result"));
                                    }
                                    else if (xml == apf.uirecorder.resultListXml) {
                                        node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("capture")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode("no result"));
                                        node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("result")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(detail.text));
                                    }
                                    
                                    apf.uirecorder.changesXml.appendChild(node);
                                }                                    
                            }
                        }
                    }
                }
            }
        }
        
        /*
        var detailTypes = {"events": "event", "properties": "property", "data": "dataItem"};
        for (var test, ti = 0, tl = xml.childNodes.length; ti < tl; ti++) {
            test = xml.childNodes[ti];
            
            // loop through actions
            for (var action, ai = 0, al = test.childNodes.length; ai < al; ai++) {
                action = test.childNodes[ai];
                
                if (action.childNodes && action.childNodes.length) {
                    for (var element, ei = 0, el = action.childNodes.length; ei < el; ei++) {
                        element = action.childNodes[ei];
                        
                        var details;
                        for (var type in detailTypes) {
                            if (element.selectSingleNode(type) && element.selectSingleNode(type).childNodes && element.selectSingleNode(type).childNodes.length) {
                                for (var node, detail, di = 0, dl = element.selectSingleNode(type).childNodes.length; di < dl; di++) {
                                    detail = element.selectSingleNode(type).childNodes[di];
    
                                    if (xml == apf.uirecorder.resultListXml) {
                                        if (node = apf.uirecorder.changesXml.selectSingleNode("//change[test[text()='" + test.getAttribute("name") + "']][action[text()='" + action.getAttribute("name") + "']][element[text()='" + element.getAttribute("name") + "']][type[text()='" + detail.nodeName + "']][name[text()='" + detail.getAttribute("name") + "']]")) {
                                            apf.xmldb.setTextNode(node.selectSingleNode("result"), detail.text);
                                            continue;
                                        }    
                                    }
                                    
                                    node = apf.uirecorder.changesXml.ownerDocument.createElement("change");
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("test")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(test.getAttribute("name")));
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("action")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(action.getAttribute("name")));
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("element")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(element.getAttribute("name")));
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("type")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(detail.nodeName));
                                    node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("name")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(detail.getAttribute("name")));
                                    if (xml == apf.uirecorder.testListXml) {
                                        node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("capture")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(detail.text));
                                        node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("result")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode("no result"));
                                    }
                                    else if (xml == apf.uirecorder.resultListXml) {
                                        node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("capture")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode("no result"));
                                        node.appendChild(apf.uirecorder.changesXml.ownerDocument.createElement("result")).appendChild(apf.uirecorder.changesXml.ownerDocument.createTextNode(detail.text));
                                    }
                                    
                                    apf.uirecorder.changesXml.appendChild(node);
                                }                                    
                            }
                        }
                    }
                }
            }
        }
        */
    }
};
//#endif

