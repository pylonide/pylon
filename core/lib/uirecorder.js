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
            //apf.uirecorder.captureAction("mousedown", e);
        }
        
        document.documentElement.onmouseup = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            //apf.uirecorder.captureAction("mouseup", e);
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
            var value = e.keyCode;
            //apf.uirecorder.captureAction("keypress", e, e.keyCode);
        }
        
        document.documentElement.onkeypress = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            //apf.uirecorder.captureAction("keypress", e, e.keyCode);
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
    startRecordTime : 0,
    record : function() {
        apf.uirecorder.actionList = [];
        apf.uirecorder.startRecordTime = new Date().getTime();
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
        apf.uirecorder.startRecordTime = new Date().getTime();
        apf.uirecorder.isTesting = true;
        apf.uirecorder.init();
    },
    
    /**
     * Stop recording and playing
     */
    stop : function() {
        if (apf.uirecorder.isRecording)
            apf.uirecorder.saveTest();
        apf.uirecorder.isRecording = false;
        apf.uirecorder.isPlaying   = false;
        apf.uirecorder.isTesting   = false;
    },
    
    /**
     * Stop recording and playing, clear list of recorded actions
     */
    reset : function() {
        apf.uirecorder.isRecording = false;
        apf.uirecorder.isPlaying   = false;
        apf.uirecorder.playStack   = [];
        apf.uirecorder.actionStack = [];
    },
    
    /**
     * Save test 
     */
    testListXml : null,
    saveTest : function() {
        if (!apf.uirecorder.testListXml)
            apf.uirecorder.testListXml = apf.getXml("<testList />");
        
        var id = parseInt(apf.uirecorder.testListXml.childNodes.length) + 1;
        var testXml = apf.getXml("<test />");
        testXml.setAttribute("name", "test" + id);
        testXml.setAttribute("index", apf.uirecorder.testListXml.childNodes.length);
        testXml.setAttribute("status", "untested");        

        for (var action, aNode, i = 0, l = apf.uirecorder.actionList.length; i < l; i++) {
            action = apf.uirecorder.actionList[i];
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name", action.name);
            aNode.setAttribute("x", action.x);
            aNode.setAttribute("y", action.y);
            aNode.setAttribute("time", action.time);
            if (action.amlNode)
                aNode.setAttribute("target", apf.xmlToXpath(action.amlNode));
            
            testXml.appendChild(aNode);
        }
        // reset actionList
        apf.uirecorder.actionList = [];
        apf.uirecorder.testListXml.appendChild(testXml);
    },
    
    /**
     * Save test results
     */
    resultListXml : null,
    saveResults : function() {
        if (!apf.uirecorder.resultListXml)
            apf.uirecorder.resultListXml = apf.getXml("<testList />");
        
        var id = parseInt(apf.uirecorder.resultListXml.childNodes.length) + 1;
        var testXml = apf.getXml("<test />");
        testXml.setAttribute("name", "test" + id);
        testXml.setAttribute("index", apf.uirecorder.resultListXml.childNodes.length);
        testXml.setAttribute("status", "untested");        

        for (var action, aNode, i = 0, l = apf.uirecorder.actionList.length; i < l; i++) {
            action = apf.uirecorder.actionList[i];
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name", action.name);
            aNode.setAttribute("x", action.x);
            aNode.setAttribute("y", action.y);
            aNode.setAttribute("time", action.time);
            if (action.amlNode) 
                aNode.setAttribute("target", apf.xmlToXpath(action.amlNode));
            
            testXml.appendChild(aNode);
        }
        // reset actionList
        apf.uirecorder.actionList = [];
        apf.uirecorder.resultListXml.appendChild(testXml);
    },
    
    /**
     * Record user action like mouse clicks, movement of keypress 
     */
    actionList      : [],
    captureAction : function(eventName, e, value) {
        var htmlElement = e.srcElement || e.target;
        var amlNode     = apf.findHost(htmlElement);
        
        // ignore interaction with uirecorder controls
        if (amlNode.id && amlNode.id.indexOf("uir") == 0) return;

        // time in ms when action is executed
        var time        = parseInt(new Date().getTime() - apf.uirecorder.startRecordTime);
        var actionObj = {
            time        : time,
            name        : eventName,
            htmlElement : htmlElement,
            amlNode     : amlNode,
            x           : e.clientX,
            y           : e.clientY
        }
        
        apf.uirecorder.actionList.push(actionObj);
    },
    captureEvent : function(eventName, e) {},
    capturePropertyChange : function(amlNode, prop, value) {
        
    },
    captureModelChange : function(params) {}
};