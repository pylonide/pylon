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
       
        /* Form events support */
        document.documentElement.onselect = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            
            apf.uirecorder.actionStack.push([new Date().getTime(), "onselect",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onchange = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            
            apf.uirecorder.actionStack.push([new Date().getTime(), "onchange",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onsubmit = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            
            apf.uirecorder.actionStack.push([new Date().getTime(), "onsubmit",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onreset = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            
            apf.uirecorder.actionStack.push([new Date().getTime(), "onreset",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
       
        /* User interface events support */
        document.documentElement.onfocus = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            
            apf.uirecorder.actionStack.push([new Date().getTime(), "onfocus",
                e.srcElement || e.target, apf.extend({}, e)]);
        }

        document.documentElement.onblur = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            
            apf.uirecorder.actionStack.push([new Date().getTime(), "onblur",
                e.srcElement || e.target, apf.extend({}, e)]);
        }

        /* Mouse events support */
        document.documentElement.onclick = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
//apf.console.info("recording... onclick - "+e.clientX+" "+e.clientY);
            apf.uirecorder.actionStack.push([new Date().getTime(), "onclick",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.ondblclick = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
//apf.console.info("recording... ondblclick - "+e.clientX+" "+e.clientY);
            apf.uirecorder.actionStack.push([new Date().getTime(), "ondblclick",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onmousedown = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
//apf.console.info("recording... onmousedown - "+e.clientX+" "+e.clientY);
            apf.uirecorder.actionStack.push([new Date().getTime(), "onmousedown",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onmouseup = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
//apf.console.info("recording... onmouseup - "+e.clientX+" "+e.clientY);
            apf.uirecorder.actionStack.push([new Date().getTime(), "onmouseup",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onmousemove = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;
            
            e = e || event;
//apf.console.info("recording... onmousemove - "+e.clientX+" "+e.clientY);
            apf.uirecorder.actionStack.push([new Date().getTime(), "onmousemove",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onmouseover = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
//apf.console.info("recording... onmouseover - "+e.clientX+" "+e.clientY);
            apf.uirecorder.actionStack.push([new Date().getTime(), "onmouseover",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onmouseout = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
//apf.console.info("recording... onmouseout - "+e.clientX+" "+e.clientY);
            apf.uirecorder.actionStack.push([new Date().getTime(), "onmouseout",
                e.srcElement || e.target, apf.extend({}, e)]);
        }

        /* Keyboard events support for all browsers */
        document.documentElement.onkeyup = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            
            apf.uirecorder.actionStack.push([new Date().getTime(), "onkeyup",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onkeydown = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            
            apf.uirecorder.actionStack.push([new Date().getTime(), "onkeydown",
                e.srcElement || e.target, apf.extend({}, e)]);
        }
        
        document.documentElement.onkeypress = function(e) {
            if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                return;

            e = e || event;
            
            apf.uirecorder.actionStack.push([new Date().getTime(), "onkeypress",
                e.srcElement || e.target, apf.extend({}, e)]);
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
    
                /* scropt for checking marginTop */
                /*var el = e.srcElement || e.target;
    
                while (el != document.body && el.scrollHeight == el.offsetHeight) {
                    apf.console.info("Searching..."+el.id+" "+el.scrollHeight+" "+parseInt(el.style.height));
                    el = el.parentNode || el.parentElement;
                }

                apf.console.info("scroll"+el.scrollTop);*/

                apf.uirecorder.actionStack.push([
                    new Date().getTime(),
                    "DOMMouseScroll",
                    e.target,
                    apf.extend({}, apf.uirecorder.createMouseWheelEvent(e))
                ]);
            }, false);
        }
        else {
            /* IE */
            document.onmousewheel = function(e) {
                if (apf.uirecorder.isPlaying || !apf.uirecorder.isRecording)
                    return;

                e = e || event;

                apf.uirecorder.actionStack.push([
                    new Date().getTime(),
                    "onmousewheel",
                    e.srcElement,
                    apf.extend({}, apf.uirecorder.createMouseWheelEvent(e))
                ]);
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