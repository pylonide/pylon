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
    
    init : function() {
        if (apf.uirecorder.inited)
            return;

        apf.uirecorder.inited = true;

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
            apf.uirecorder.captureAction("dblclick", e);
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
        apf.uirecorder.playStack   = apf.uirecorder.actionStack.slice(0);

        if (apf.uirecorder.playStack.length)
            playFrame();
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
    ignoreEvents    : {"blur": 1, "focus": 1},
    captureEvent    : function(eventName, e) {
        // ignore event from ignoreEvents list
//        if (apf.uirecorder.ignoreEvents[eventName]) return;

        // collect mouse events
        /*
        if ("mouse".indexOf(eventName) == 0)
            apf.uirecorder.eventList.mouse.push(eventName);
        */
         
        //if (eventName != "focus" && eventName != "blur" && e)
//        var htmlElement = e.srcElement || e.target;
//        var amlNode     = apf.findHost(htmlElement);
//        var xmlNode     = apf.xmldb.findXmlNode(htmlElement, amlNode);
        var target = e.amlNode || e.toElement || e.relatedNode || e.currentTarget;
/* 
        var obj = {
            name        : eventName,
            target      : target.name,
        }
*/
        var targetName = (target) 
            ? (target.name || target.tagName) 
                ? target.name || target.tagName 
                : (target.root) 
                    ? "apf" 
                    : (target.$at && target.$at.name)
                        ? target.$at.name
                        : undefined
            : undefined;
        if (targetName == undefined && eventName != "keyup") debugger;
/*
        if (!apf.uirecorder.eventList[obj.target]) apf.uirecorder.eventList[obj.target] = [];
        apf.uirecorder.eventList[obj.target].push(obj);
*/
        if (!apf.uirecorder.eventList[targetName]) apf.uirecorder.eventList[targetName] = [];
        
        // prevent duplicate events
        if (apf.uirecorder.eventList[targetName][apf.uirecorder.eventList[targetName].length-1] != eventName) 
            apf.uirecorder.eventList[targetName].push(eventName);
    },
    captureAction : function(eventName, e, value) {
            var changed = false;
            
        //setTimeout(function() {
            var htmlElement = e.srcElement || e.target;
            var amlNode     = apf.findHost(htmlElement);
            var xmlNode     = apf.xmldb.findXmlNode(htmlElement, amlNode);

            // loop throught eventList en look for actions
            var interaction = [];
            for (objName in apf.uirecorder.eventList) {
                if (typeof apf.uirecorder.eventList[objName] == "object" && apf.uirecorder.eventList[objName].length) {
                    if (apf.uirecorder.eventList[objName].indexOf("resizestart") > -1 && apf.uirecorder.eventList[objName].indexOf("resize") > -1 && apf.uirecorder.eventList[objName].indexOf("resizestart") < apf.uirecorder.eventList[objName].indexOf("resize")) {
                        interaction.push(objName + " resized");
                    }
                    if (apf.uirecorder.eventList[objName].indexOf("close") > -1) {
                        interaction.push(objName + " closed");
                    }
                    if (apf.uirecorder.eventList[objName].indexOf("drag") > -1) {
                        interaction.push(objName + " dragged");
                    }
                    if (apf.uirecorder.eventList[objName].indexOf("click") > -1) {
                        interaction.push(objName + " clicked");
                    }
                    if (apf.uirecorder.eventList[objName].indexOf("beforestatechange") > -1 && apf.uirecorder.eventList[objName].indexOf("afterstatechange") > -1 && apf.uirecorder.eventList[objName].indexOf("beforestatechange") < apf.uirecorder.eventList[objName].indexOf("afterstatechange")) {
                        interaction.push(objName + " state changed (but what?)");
                    }
                }
            }
            
            // reset eventList
            apf.uirecorder.eventList = [];
            
            var actionObj = {
                name        : eventName
            }
            
            if (htmlElement)                        actionObj.htmlElement = htmlElement;
            if (amlNode)                            actionObj.amlNode     = amlNode;
            if (xmlNode)                            actionObj.xmlNode     = xmlNode;
            if (apf.uirecorder.eventList)           actionObj.events      = apf.uirecorder.eventList;
            if (value)                              actionObj.value       = (eventName == "keypress") ? String.fromCharCode(value.toString()) : value;

            // check previous action object
            if (apf.uirecorder.prevActionObj) {
                if (eventName == apf.uirecorder.prevActionObj.name && eventName == "keypress") {
                    apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].value += String.fromCharCode(value.toString());
                    changed = true;
                }
            }
            
            if (eventName == "keypress") {
                interaction.push("Type text '" + htmlElement.value + "' in " + amlNode.id);
            }

            if (interaction.length)                 actionObj.interaction = interaction;
                
            if (!changed)
                // add object to actionList
                apf.uirecorder.actionList.push(actionObj)
            else
                // overwrite previous object
                apf.uirecorder.actionList[apf.uirecorder.actionList.length-1] = actionObj;
                
            apf.uirecorder.prevActionObj = actionObj;
        //}, 50);
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