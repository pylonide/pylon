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
    load : function(file) {
        uir_bar.replaceMarkup(file);
    },
    
    /**
     * Record user action like mouse clicks, movement of keypress 
     */
    actionList      : [],
    keypresses : {
        
    },
    captureAction : function(eventName, e, value) {
        var htmlElement = e.srcElement || e.target;
        var amlNode     = apf.findHost(htmlElement);
        
        // ignore interaction with uirecorder controls
        if (amlNode.id && amlNode.id.indexOf("uir") == 0) return;

        // time in ms when action is executed
        var time        = parseInt(new Date().getTime() - apf.uirecorder.startTime);
        var actionObj = {
            time        : time,
            name        : eventName,
            htmlElement : htmlElement,
            amlNode     : amlNode,
            x           : e.clientX,
            y           : e.clientY
        }
        if (eventName != "mousemove") {
            actionObj.detailList = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {}
        }
        // get keypress value
        if (eventName === "keypress") {
            actionObj.value = value;
            /*
            if (value && apf.uirecorder.keypresses[value]) {
                
            }
            else {
                value = String
            }
            */
        }
        apf.uirecorder.actionList.push(actionObj);
        /*
        setTimeout(function() {
            
        });
        */
    },
    detailList : {},
    captureEvent : function(eventName, e) {
        //if (amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0) return;
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
                event       : [],
                property    : [],
                data        : []
            };
            
            apf.uirecorder.detailList[targetName].property.push(propObj);
        }
    },
    captureModelChange : function(params) {
        //if (amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0) return;
    },

    /**
     * Save test 
     */
    testListXml : null,
    resultListXml : null,
    /**
     * Save test / test results
     */
    save : function(type) {
        var id;
        if (type === "test" && !apf.uirecorder.testListXml) {
            apf.uirecorder.testListXml = apf.getXml("<testList />");
            id = parseInt(apf.uirecorder.testListXml.childNodes.length) + 1;
        }
        else if (type === "results" && !apf.uirecorder.resultListXml) {
            apf.uirecorder.resultListXml = apf.getXml("<resultList />");
            id = parseInt(apf.uirecorder.resultListXml.childNodes.length) + 1;
        }
        
        var testXml = apf.getXml("<test />");
        testXml.setAttribute("name", "test" + id);
        testXml.setAttribute("index", apf.uirecorder.testListXml.childNodes.length);
        testXml.setAttribute("status", "untested");        

        var detailTypes = ["event", "property", "data"];
        for (var action, aNode, i = 0, l = apf.uirecorder.actionList.length; i < l; i++) {
            action = apf.uirecorder.actionList[i];
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name", action.name);
            aNode.setAttribute("x", action.x);
            aNode.setAttribute("y", action.y);
            aNode.setAttribute("time", action.time);
            if (action.amlNode) aNode.setAttribute("target", apf.xmlToXpath(action.amlNode));
            if (action.value) aNode.setAttribute("value", action.value);

            if (action.detailList) {
                var eNode;
                for (var elementName in action.detailList) {
                    eNode = testXml.ownerDocument.createElement("element");
                    eNode.setAttribute("name", elementName);
                    
                    for (var ti = 0, tl = detailTypes.length; ti < tl; ti++) {
                        if (action.detailList[elementName][detailTypes[ti]].length) {
                            for (var item, iNode, vNode, di = 0, dl = action.detailList[elementName][detailTypes[ti]].length; di < dl; di++) {
                                item = action.detailList[elementName][detailTypes[ti]][di];
                                iNode = testXml.ownerDocument.createElement(detailTypes[ti]);
                                iNode.setAttribute("name", item.name);
                                if (typeof item.value === "string")
                                    iNode.appendChild(testXml.ownerDocument.createTextNode(item.value));
                                else
                                    iNode.appendChild(testXml.ownerDocument.createTextNode("[object]"))
                                eNode.appendChild(iNode);
                            }
                        }
                    }
                    aNode.appendChild(eNode);
                }
            }

            testXml.appendChild(aNode);
        }

        // reset actionList
        apf.uirecorder.actionList = [];
        
        if (type === "test")
            apf.uirecorder.testListXml.appendChild(testXml);
        else if (type === "results") {
            apf.uirecorder.resultListXml.appendChild(testXml);
            apf.uirecorder.createChangesXml();
        }
    },
    
    /*
     * create xml based on testListXml and resultListXml
     */
    changesXml : null,
    createChangesXml : function() {
        var changesXml = apf.getXml("<changes />");
        
        var xmlList = [apf.uirecorder.testListXml, apf.uirecorder.resultListXml];
        
        for (var xi = 0, xl = xmlList.length; xi < xl; xi++) {
            for (var test, ti = 0, tl = xmlList[xi].childNodes.length; ti < tl; ti++) {
                test = xmlList[xi].childNodes[ti];
                
                // loop through actions
                for (var action, ai = 0, al = test.childNodes.length; ai < al; ai++) {
                    action = test.childNodes[ai];
                    
                    if (action.childNodes && action.childNodes.length) {
                        for (var element, ei = 0, el = action.childNodes.length; ei < el; ei++) {
                            element = action.childNodes[ei];
                            
                            for (var node, detail, di = 0, dl = element.childNodes.length; di < dl; di++) {
                                detail = element.childNodes[di];

                                if (node = changesXml.selectSingleNode("//change[test[text()='" + test.getAttribute("name") + "']][action[text()='" + action.getAttribute("name") + "']][element[text()='" + element.getAttribute("name") + "']][type[text()='" + detail.nodeName + "']][name[text()='" + detail.getAttribute("name") + "']]")) {
                                    //debugger;
                                    //node = changesXml.selectSingleNode("//change[test[text()='" + test.getAttribute("name") + "']][action[text()='" + action.getAttribute("name") + "']][element[text()='" + element.getAttribute("name") + "']][type[text()='" + detail.nodeName + "']][name[text()='" + detail.getAttribute("name") + "']]");
                                    apf.xmldb.setTextNode(node.selectSingleNode("result"), detail.text);
                                    //node.appendChild(changesXml.ownerDocument.createElement("result")).appendChild(changesXml.ownerDocument.createTextNode(detail.text));
                                }
                                else {
                                    node = changesXml.ownerDocument.createElement("change");
                                    node.appendChild(changesXml.ownerDocument.createElement("test")).appendChild(changesXml.ownerDocument.createTextNode(test.getAttribute("name")));
                                    node.appendChild(changesXml.ownerDocument.createElement("action")).appendChild(changesXml.ownerDocument.createTextNode(action.getAttribute("name")));
                                    node.appendChild(changesXml.ownerDocument.createElement("element")).appendChild(changesXml.ownerDocument.createTextNode(element.getAttribute("name")));
                                    node.appendChild(changesXml.ownerDocument.createElement("type")).appendChild(changesXml.ownerDocument.createTextNode(detail.nodeName));
                                    node.appendChild(changesXml.ownerDocument.createElement("name")).appendChild(changesXml.ownerDocument.createTextNode(detail.getAttribute("name")));
                                    if (xmlList[xi] == apf.uirecorder.testListXml) {
                                        node.appendChild(changesXml.ownerDocument.createElement("capture")).appendChild(changesXml.ownerDocument.createTextNode(detail.text));
                                        node.appendChild(changesXml.ownerDocument.createElement("result")).appendChild(changesXml.ownerDocument.createTextNode("no result captured"));
                                    }
                                    else if (xmlList[xi] == apf.uirecorder.resultListXml) {
                                        node.appendChild(changesXml.ownerDocument.createElement("capture")).appendChild(changesXml.ownerDocument.createTextNode("no result captured"));
                                        node.appendChild(changesXml.ownerDocument.createElement("result")).appendChild(changesXml.ownerDocument.createTextNode(detail.text));
                                    }
                                }
                                
                                changesXml.appendChild(node);
                            }
                        }
                    }
                }
            }            
        }

        apf.uirecorder.changesXml = changesXml;
    }
};