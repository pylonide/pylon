// #ifdef __WITH_UIRECORDER
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
apf.uirecorder = {
    actionStack : [],
    playStack   : [],
    isPlaying   : false,
    isRecording : false,
    inited      : false,
    
    initialState: {},
    init : function() {
        if (apf.uirecorder.inited)
            return;

        apf.uirecorder.inited = true;

        // record initial state
        for (var amlNode, props, i = 0, l = apf.all.length; i < l; i++) {
            amlNode = apf.all[i]; 
            
            // ignore nodes without supportedProperties
            if (!amlNode.$supportedProperties || amlNode.$supportedProperties.length === 0 || !amlNode.ownerDocument) continue;
            
             
            id = apf.xmlToXpath(amlNode); //(amlNode.id || "") + "_" + amlNode.localName + apf.xmlToXpath(amlNode) + "_" + amlNode.serialize(); //uniqueness: id, localName + position in the tree (apf.getXpathFromNode - in lib/xml.js), serialized state (serialize())
            
            props = [];
            for (var j = 0, jl = amlNode.$supportedProperties.length; j < jl; j++) { //width, height, span, columns, ...
                props.push({
                    name    : amlNode.$supportedProperties[j], 
                    value   : amlNode[amlNode.$supportedProperties[j]]
                });
            }
            
            apf.uirecorder.initialState[id] = props;
        }
        
        /* Support for various events listed in dEvents array */
        /*for (var i = 0, l = dEvents.length; i < l; i++) {
            document.documentElement[dEvents[i]] = function(e) {
                if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                    return;

                e = e || event;
                
                apf.uirecorder.actionStack.push([new Date().getTime(), dEvents[i],
                    e.srcElement || e.target, apf.extend({}, e)]);
            }
        }*/
        apf.uirecorder.curEvtObj = null;
        
        /* Form events support */
        document.documentElement.onselect = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            apf.uirecorder.curEvtObj = {
                name : "onselect",
                target : e.srcElement || e.target,
                properties: {clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY}
            }
            //apf.uirecorder.eventCaptured(apf.uirecorder.curEvtObj);
            
            /*apf.uirecorder.actionStack.push([new Date().getTime(), "onselect",
                e.srcElement || e.target, apf.extend({}, e)]);*/
        }
        
        document.documentElement.onchange = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            apf.uirecorder.curEvtObj = {
                name : "onchange",
                target : e.srcElement || e.target,
                properties: {clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY}
            }
            //apf.uirecorder.eventCaptured(apf.uirecorder.curEvtObj);
            
            /*apf.uirecorder.actionStack.push([new Date().getTime(), "onchange",
                e.srcElement || e.target, apf.extend({}, e)]);*/
        }
        
        document.documentElement.onsubmit = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            apf.uirecorder.curEvtObj = {
                name : "onsubmit",
                target : e.srcElement || e.target,
                properties: {clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY}
            }
            //apf.uirecorder.eventCaptured(apf.uirecorder.curEvtObj);
            
            /*apf.uirecorder.actionStack.push([new Date().getTime(), "onsubmit",
                e.srcElement || e.target, apf.extend({}, e)]);*/
        }
        
        document.documentElement.onreset = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            apf.uirecorder.curEvtObj = {
                name : "onreset",
                target : e.srcElement || e.target,
                properties: {clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY}
            }
            //apf.uirecorder.eventCaptured(apf.uirecorder.curEvtObj);
            
            /*apf.uirecorder.actionStack.push([new Date().getTime(), "onreset",
                e.srcElement || e.target, apf.extend({}, e)]);*/
        }
       
        /* User interface events support */
        document.documentElement.onfocus = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            apf.uirecorder.curEvtObj = {
                name : "onfocus",
                target : e.srcElement || e.target,
                properties: {clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY}
            }
            //apf.uirecorder.eventCaptured(apf.uirecorder.curEvtObj);
            
            /*apf.uirecorder.actionStack.push([new Date().getTime(), "onfocus",
                e.srcElement || e.target, apf.extend({}, e)]);*/
        }

        document.documentElement.onblur = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            apf.uirecorder.curEvtObj = {
                name : "onblur",
                target : e.srcElement || e.target,
                properties: {clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY}
            }
            //apf.uirecorder.eventCaptured(apf.uirecorder.curEvtObj);
            
            /*apf.uirecorder.actionStack.push([new Date().getTime(), "onblur",
                e.srcElement || e.target, apf.extend({}, e)]);*/
        }

        /* Mouse events support */
        document.documentElement.onclick = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;
            e = e || event;

            apf.uirecorder.captureAction("click", e);
        }
        
        document.documentElement.ondblclick = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            //apf.uirecorder.captureAction("dblclick", e);
        }
        
        document.documentElement.onmousedown = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;
            e = e || event;
            
            var htmlElement = e.srcElement || e.target;
            var amlNode     = apf.findHost(htmlElement);
            var xmlNode     = apf.xmldb.findXmlNode(htmlElement, amlNode);
            apf.uirecorder.curEvtObj = {
                name : "onmousedown",
                target : htmlElement,
                properties: {clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY,amlNode : amlNode,xmlNode : xmlNode && xmlNode.tagName || "none"}
            }
        }
        
        var timer;
        document.documentElement.onmouseup = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            apf.uirecorder.curEvtObj = {
                name : "onmouseup",
                target : e.srcElement || e.target,
                properties: {clientX: e.clientX, clientY: e.clientY, offsetX: e.offsetX, offsetY: e.offsetY}
            }
            
        }
        
        document.documentElement.onmousemove = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            apf.uirecorder.captureAction("mousemove", e);
        }
        
        document.documentElement.onmouseover = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
        }
        
        document.documentElement.onmouseout = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
        }

        /* Keyboard events support for all browsers */
        document.documentElement.onkeyup = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            apf.uirecorder.captureAction("keypress", e, e.keyCode);
        }
        
        document.documentElement.onkeydown = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
        }
        
        document.documentElement.onkeypress = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
        }

        var mEvents = ["DOMSubtreeModified", "DOMNodeInserted", "DOMNodeRemoved", "DOMNodeRemovedFromDocument",
            "DOMNodeInsertedIntoDocument", "DOMAttrModified", "DOMCharacterDataModified", "DOMActivate"];

        /* ============== Mutation Events ============== */
        /* Support for Mutation Events in FF */
        /*if(apf.isGecko) {
            for (var i = 0, l = mEvents.length; i < l; i++) {
                document.addEventListener(mEvents[i], function(e) {
                    if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                        return;

                    e = e || event;

                    apf.uirecorder.actionStack.push([new Date().getTime(), mEvents[i], e.srcElement || e.target, apf.extend({}, e)]);
                }, false);
            }
        }*/
        /* Support for Mutation events in IE */
        /*else if(apf.isIE) {
            for (var i = 0, l = mEvents.length; i < l; i++) {
                document.attachEvent(mEvents[i], function(e) {
                    if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                        return;
    
                    e = e || event;
    
                    apf.uirecorder.actionStack.push([new Date().getTime(), mEvents[i], e.srcElement || e.target, apf.extend({}, e)]);
                });
            }
        }*/

        /* Support for Mouse Scroll event */
        if(document.addEventListener) {
            /* FF */
            document.addEventListener("DOMMouseScroll", function(e) {
                if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                    return;
    
                e = e || event;
            }, false);
        }
        else {
            /* IE */
            document.onmousewheel = function(e) {
                if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
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
    record : function() {
        apf.uirecorder.isRecording = true;
        apf.uirecorder.init();
    },
    
    /**
     * Stop recording and start playing
     */
    play : function() {
        apf.uirecorder.isRecording = false;
        apf.uirecorder.isPlaying   = true;
        //apf.uirecorder.playStack   = apf.uirecorder.actionStack.slice(0);

        apf.uirecorder.playList = apf.uirecorder.actionList.slice(0);
        apf.uirecorder.playNextFrame();
        
        /*
        if (apf.uirecorder.playStack.length)
            playFrame();
        */
    },
    /*
     * play next action frame
     */
    playActions : {"mousemove":1, "click":1, "keypress":1},
    playList : [],
    playNextFrame : function() {
        if (!apf.uirecorder.isPlaying) return;
        if (!apf.uirecorder.playList.length) {
            apf.uirecorder.stop();
            return;
        }
        var cursor = document.getElementById("cursor");
        var action = apf.uirecorder.playList.shift();
        
        if (apf.uirecorder.playActions[action.name]) {
            if (action.name == "mousemove") {
                apf.tween.multi(cursor, {
                   steps: 40,
                   tweens : [
                        {type : "top",  from : action.start.clientY, to : action.end.clientY},
                        {type : "left", from : action.start.clientX, to : action.end.clientX}
                   ],
                   onfinish : apf.uirecorder.playNextFrame
                });
                return;
            }
            else if (action.name == "click") {
                setTimeout(function() {
                    cursor.setAttribute("class", "click");
                }, 200);
                setTimeout(function() {
                    //dispatch click event;
                    if (action.amlNode)
                        if (action.amlNode.onclick)
                            action.amlNode.onclick();
                        else
                            action.amlNode.dispatchEvent("click");
                    cursor.setAttribute("class", "");
                }, 400);
                setTimeout(function() {
                    apf.uirecorder.playNextFrame();
                }, 600);
                return;
            }
            else if (action.name == "keypress") {
                action.htmlElement.value = action.value;
                apf.uirecorder.playNextFrame();
            }
        }
        else {
            apf.uirecorder.playNextFrame();
            return;
        }
    },
    
    
    /**
     * Stop recording and playing
     */
    stop : function() {
        apf.uirecorder.isRecording = false;
        apf.uirecorder.isPlaying   = false;
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
    prevActionObj   : null,
    actionList      : [],
    eventList       : [],
    initDone        : false,
    ignoreEvents    : { "blur":1,"focus":1,"mouseover":1,"mouseout":1,"mousedown":1,"mouseup":1,
                        "DOMFocusOut":1,"DOMFocusIn":1,"movefocus":1,"DOMAttrModified":1,
                        "xforms-focus":1,"xforms-enabled":1,"xforms-disabled":1,"xforms-readwrite":1,"xforms-readonly":1,"xforms-previous":1,
                        "DOMNodeInserted":1,"DOMNodeInsertedIntoDocument":1,"DOMNodeRemoved":1,"DOMNodeRemovedFromDocument":1,
                        "keyup":1,
                        },
    captureEvent    : function(eventName, e) {
        // ignore event from ignoreEvents list
        if (apf.uirecorder.ignoreEvents[eventName]) return;
        //if (eventName == "click") debugger;
        //if (eventName == "updatestart") debugger;
        /*
        var target = (e.currentTarget) 
            ? e.currentTarget 
            : (e.srcElement)
                ? e.srcElement
                : (e.amlNode)
                    ? e.amlNode
                    : null;
        
        if (!target) debugger;
        */
        var htmlElement, amlNode;
        if (e.htmlEvent || e.srcElement || e.target) {
            htmlElement = e.htmlEvent.srcElement || e.htmlEvent.target || e.srcElement || e.target;
            amlNode     = apf.findHost(htmlElement);
        }
        else if (e.amlNode && e.amlNode.$aml) {
            amlNode = e.amlNode;
//            targetName = amlNode.id || amlNode.localName + amlNode.$uniqueId.toString();
        }
        else if (e.currentTarget) {
            if (e.currentTarget.localName) {
                if ("actiontracker|model".indexOf(e.currentTarget.localName) == -1)
                    amlNode = (e.currentTarget.ownerDocument) 
                        ? e.currentTarget 
                        : (e.currentTarget.host)
                            ? e.currentTarget.host
                            : null;
                else
                    targetName == e.currentTarget.localName;
            }
            else if (e.currentTarget.all && e.currentTarget.root === true)
                targetName = "apf";
        }
        if (amlNode && !amlNode.ownerDocument) debugger;
        if (amlNode)
            targetName = apf.xmlToXpath(amlNode); //amlNode.id || amlNode.localName + amlNode.$uniqueId.toString();
            
        if (!targetName) debugger;
        
        //var xmlNode     = apf.xmldb.findXmlNode(htmlElement, amlNode);

        var eventObj = {
            name        : eventName,
            amlNode     : amlNode,
            //xmlNode     : xmlNode,
            event       : e
        }
        //if (eventName == "click") debugger;
        //if (htmlElement)    eventObj.htmlElement    = htmlElement;
        if (e.value)        eventObj.value          = value;
        
        if (!targetName) debugger; 

        if (!apf.uirecorder.eventList[targetName]) apf.uirecorder.eventList[targetName] = [];
        // prevent duplicate events
        if (apf.uirecorder.eventList[targetName][apf.uirecorder.eventList[targetName].length-1] != eventName) 
            apf.uirecorder.eventList[targetName].push(eventObj);
    },
    mouseMovement : {},
    captureAction : function(eventName, e, value) {
            if (eventName == "keypress" || eventName == "click") {
                var htmlElement = e.srcElement || e.target;
                var amlNode     = apf.findHost(htmlElement);
                var xmlNode     = apf.xmldb.findXmlNode(htmlElement, amlNode);
            }
            
            // get mouse positions
            if (e.clientX) {
                var mouse = {
                    clientX : e.clientX,
                    clientY : e.clientY,
                    offsetX : e.offsetX,
                    offsetY : e.offsetY
                };
            }
            
            // capture mouse movement
            if (eventName == "mousemove" && (apf.uirecorder.prevActionObj && apf.uirecorder.prevActionObj.name == "click")) {
                apf.uirecorder.mouseMovement.start = mouse;
            }
            else if (eventName == "mousemove" && (apf.uirecorder.prevActionObj && apf.uirecorder.prevActionObj.name == "mousemove")) {
                apf.uirecorder.mouseMovement.end = mouse;
            }
            else if (eventName == "mousemove") {
                return;
            }
            /*
            if (eventName == "mousemove") {
                if (!apf.uirecorder.mouseMovement.values) apf.uirecorder.mouseMovement.values = [];
                apf.uirecorder.mouseMovement.values.push(mouse);
            }
            */
            
//if (!amlNode) debugger;
            
//            setTimeout(function() {
                var changed = false;
                
                // loop throught eventList en look for actions
                var interaction = [];
                for (objName in apf.uirecorder.eventList) {
                    //if (objName.indexOf("actiontracker") == 0) debugger;
                    if (typeof apf.uirecorder.eventList[objName] === "object" && apf.uirecorder.eventList[objName].length) {
                        for (var name, i = 0, l = apf.uirecorder.eventList[objName].length; i < l; i++) {
                            name    = apf.uirecorder.eventList[objName][i].name;
                            aml     = apf.uirecorder.eventList[objName][i].amlNode;
                            
                            if (name === "resize") {
                                interaction.push(aml.localName + " '" + objName + "' resized");
                            }
                            else if (name === "close") {
                                interaction.push(aml.localName + " '" + objName + "' closed");
                            }
                            else if (name === "drag") {
                                interaction.push(aml.localName + " '" + objName + "' dragged");
                            }
                            else if (name === "click") {
                                if (aml.localName == "button")
                                    interaction.push(aml.localName + " '" + objName + " (" + aml.caption + ")" + "' pressed");
                                //else
                                    //interaction.push(amlNode.localName + " '" + objName + "' clicked");
                            }
        /*
                            if (apf.uirecorder.eventList[objName].name === "afterstatechange" > -1 && apf.uirecorder.eventList[objName].indexOf("afterstatechange") > -1 && apf.uirecorder.eventList[objName].indexOf("beforestatechange") < apf.uirecorder.eventList[objName].indexOf("afterstatechange")) {
                                interaction.push(amlNode.localName + " '" + objName + "' state changed (but what?)");
                            }
        */
                            else if (name === "prop.visible" && apf.uirecorder.eventList[objName][i].value) { // && amlNode.localName == "page"
                                interaction.push(aml.localName + " '" + aml.caption + "' opened");
                            }
                            else if (name === "updatestart") {
                                interaction.push(aml.localName + " '" + objName + "' updated (updatestart)");
                            }
                            else if (name === "xmlupdate") {
                                
                            }

                            else if (name === "afteradd") {
                                interaction.push("Data added to " + aml.localName + " '" + objName + "' ");
                            }
                            
                            // sortcolumn [columnName]
                            // 
                        }
                    }
                }
                if (eventName == "mousemove" && apf.uirecorder.mouseMovement.start && apf.uirecorder.mouseMovement.end)
                    interaction.push("Moved mouse cursor from (" + apf.uirecorder.mouseMovement.start.clientX + ", " + apf.uirecorder.mouseMovement.start.clientY + ") to (" + apf.uirecorder.mouseMovement.end.clientX + ", " + apf.uirecorder.mouseMovement.end.clientY + ")");
                    
                var actionObj = {
                    name        : eventName
                }
                
                if (htmlElement)                        actionObj.htmlElement = htmlElement;
                //if (amlNode)                            actionObj.amlNode     = amlNode;
                //if (xmlNode)                            actionObj.xmlNode     = xmlNode;

                if (apf.uirecorder.eventList)           actionObj.events      = apf.uirecorder.eventList;
                if (value)                              actionObj.value       = (eventName == "keypress") ? String.fromCharCode(value.toString()) : value;
    
                // check previous action object
                if (apf.uirecorder.prevActionObj) {
                    if (eventName == apf.uirecorder.prevActionObj.name && eventName == "keypress") {
                        actionObj.value = htmlElement.value;//apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].value + String.fromCharCode(value.toString());
                        changed = true;
                    }
                    if (eventName == apf.uirecorder.prevActionObj.name && eventName == "mousemove") {
                        //apf.uirecorder.mouseMovement.end    = mouse;
                        actionObj.start                     = apf.uirecorder.mouseMovement.start;
                        actionObj.end                       = apf.uirecorder.mouseMovement.end;
                        changed                             = true;
                    }
                }
                //if (apf.uirecorder.mouseMovement.values)    actionObj.values = apf.uirecorder.mouseMovement.values;
                
                if (eventName == "keypress") {
                    interaction.push("Change text to '" + htmlElement.value + "' in " + apf.xmlToXpath(amlNode));
                }
    
                if (interaction.length)                 actionObj.interaction = interaction;
                if (amlNode)                            actionObj.amlNode = amlNode;
                if (xmlNode)                            actionObj.xmlNode = xmlNode;
                if (!changed)
                    // add object to actionList
                    apf.uirecorder.actionList.push(actionObj)
                else
                    // overwrite previous object
                    apf.uirecorder.actionList[apf.uirecorder.actionList.length-1] = actionObj;
                    
                apf.uirecorder.prevActionObj = actionObj;
    
                // reset eventList
                apf.uirecorder.eventList = [];
//            }, 200);
    }
};

var timeout;
function playFrame() {
    var frame = apf.uirecorder.playStack.shift();

    if(!frame || !apf.uirecorder.isPlaying)
        return;

    var lastTime = frame[0],
        simulate = false,
        src = frame[3],
        prop, e;

    if (apf.isIE) {
        e = document.createEventObject();
        
        for (prop in frame[3]) {
            if (frame[3][prop]) {
                e[prop] = frame[3][prop];
            }
        }

        e.target = frame[2];

        
        switch (src.type) {
            case "mousewheel":
                fireScroll(frame);
                break;
            default:
                //apf.console.info("playing... "+src.type+" - "+src.clientX+" "+src.clientY);
                frame[2].fireEvent(frame[1], e);
                break;
        }
        
    }
    else {
        switch(src.type) {
            case "mousemove":
            case "mouseup":
            case "mousedown":
            case "click":
            case "dblclick":
            case "mouseover":
            case "mouseout":
                e = document.createEvent("MouseEvents");
                e.initMouseEvent(src.type, src.bubbles, src.cancelable, src.view, src.detail, src.screenX,
                    src.screenY, src.clientX, src.clientY, src.ctrlKey, src.altKey,
                    src.shiftKey, src.metaKey, src.button, src.relatedTarget
                );
                /* Little workaround - that values are important for drag&drop (dragdrop.js) */
                apf.event.layerX = src.layerX
                apf.event.layerY = src.layerY
                break;
            case "keyup":
            case "keydown":
            case "keypress":
                e = document.createEvent("KeyboardEvent");
                e.initKeyEvent(src.type, src.bubbles, true, window, 
                    src.ctrlKey, src.altKey, src.shiftKey, src.metaKey, 
                    src.keyCode, src.charCode); 
                break;
            case "select":
            case "change":
            case "submit":
            case "reset":
                e = document.createEvent("HTMLEvents");
                e.initEvent(src.type, src.bubbles, src.cancelable);
                break;
            case "DOMActivate":
            case "resize":
            case "focus":
            case "blur":
                e = document.createEvent("UIEvents");
                e.initUIEvent(src.type, src.bubbles, src.cancelable, e.view, e.detail);
                break;
            /*case "DOMAttrModified":
            case "DOMCharacterDataModified":
            case "DOMNodeInsertedIntoDocument":
            case "DOMNodeRemovedFromDocument":
            case "DOMNodeRemoved":
            case "DOMNodeInserted":
            case "DOMSubtreeModified":
                e = document.createEvent("MutationEvents");
                e.initMutationEvent(src.type, src.bubbles, src.cancelable, src.relatedNode, src.prevValue, src.newValue, src.attrName, src.attrChange);
                break;*/
            case "DOMMouseScroll": //mouse scroll
                fireScroll(frame);
                simulate = true;
                break;
            default:
                apf.console.info("default: " + src.type);
                simulate = true;
                break;
        }

        if (!simulate) {
            frame[2].dispatchEvent(e);
        }
    }

    if (apf.uirecorder.playStack.length && apf.uirecorder.isPlaying) {
        timeout = setTimeout(function() {
            playFrame();
        }, apf.uirecorder.playStack[0][0] - lastTime);
    }
    else {
        apf.uirecorder.stop();
        clearInterval(timeout);
    }
};

function fireScroll(frame) {
    var el = frame[2];

    while (el != document.body && el.scrollHeight == el.offsetHeight) {
        el = el.parentNode || el.parentElement;
    }

    // FF - 39
    // IE - el.offsetHeight / ~(6,7 - 6,8)
    // Chrome - 120
    el.scrollTop = el.scrollTop - (apf.isGecko
        ? 39
        : (apf.isChrome
            ? 120
            : (apf.isIE
                ? Math.round(el.offsetHeight / 6.73)
                : 20))) * frame[3].delta;
}
// #endif