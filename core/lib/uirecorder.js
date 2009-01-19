jpf.uirecorder = {
    actionStack : [],
    playStack   : [],
    isPlaying   : false,
    isRecording : false,
    inited      : false,

    init : function() {
        if (jpf.uirecorder.inited)
            return;

        jpf.uirecorder.inited = true;

        var dEvents = [
            "onclick", "onmousedown", "onmouseup", "onmousemove", "onmouseover", "onmouseout", "ondblclick", 
            "onkeydown", "onkeyup", "onkeypress",
            "onselect", "onchange", "onsubmit", "onreset", "onfocus", "onblur"];

        var mEvents = ["DOMSubtreeModified", "DOMNodeInserted", "DOMNodeRemoved", "DOMNodeRemovedFromDocument",
            "DOMNodeInsertedIntoDocument", "DOMAttrModified", "DOMCharacterDataModified", "DOMActivate"];

        /* Support for various events listed in dEvents array */
        for (var i = 0, l = dEvents.length; i < l; i++) {
            document.documentElement[dEvents[i]] = function(e) {
                if (jpf.uirecorder.isPlaying || !jpf.uirecorder.isRecording)
                    return;

                e = e || event;

                jpf.uirecorder.actionStack.push([new Date().getTime(), dEvents[i],
                    e.srcElement || e.target, jpf.extend({}, e)]);
            }
        }

        /* ============== Mutation Events ============== */
        /* Support for Mutation Events in FF */
        if(jpf.isGecko) {
            for (var i = 0, l = mEvents.length; i < l; i++) {
                document.addEventListener(mEvents[i], function(e) {
                    if (jpf.uirecorder.isPlaying || !jpf.uirecorder.isRecording)
                        return;

                    e = e || event;

                    jpf.uirecorder.actionStack.push([new Date().getTime(), mEvents[i], e.srcElement || e.target, jpf.extend({}, e)]);
                }, false);
            }
        }

        /* Support for Mutation events in IE */
        if(jpf.isIE) {
            for (var i = 0, l = mEvents.length; i < l; i++) {
                document.attachEvent(mEvents[i], function(e) {
                    if (jpf.uirecorder.isPlaying || !jpf.uirecorder.isRecording)
                        return;
    
                    e = e || event;
    
                    jpf.uirecorder.actionStack.push([new Date().getTime(), mEvents[i], e.srcElement || e.target, jpf.extend({}, e)]);
                });
            }
        }

        /* Support for Mouse Scroll event */
        if(document.addEventListener) {
            /* FF */
            document.addEventListener("DOMMouseScroll", function(e) {
                if (jpf.uirecorder.isPlaying || !jpf.uirecorder.isRecording)
                    return;
    
                e = e || event;
    
                /* scropt for checking marginTop */
                /*var el = e.srcElement || e.target;
    
                while (el != document.body && el.scrollHeight == el.offsetHeight) {
                    jpf.console.info("Searching..."+el.id+" "+el.scrollHeight+" "+parseInt(el.style.height));
                    el = el.parentNode || el.parentElement;
                }

                jpf.console.info("scroll"+el.scrollTop);*/

                jpf.uirecorder.actionStack.push([
                    new Date().getTime(),
                    "DOMMouseScroll",
                    e.target,
                    jpf.extend({}, jpf.uirecorder.createMouseWheelEvent(e))
                ]);
            }, false);
        }
        else {
            /* IE */
            document.onmousewheel = function(e) {
                if (jpf.uirecorder.isPlaying || !jpf.uirecorder.isRecording)
                    return;

                e = e || event;

                jpf.uirecorder.actionStack.push([
                    new Date().getTime(),
                    "DOMMouseScroll",
                    e.srcElement || e.target,
                    jpf.extend({}, jpf.uirecorder.createMouseWheelEvent(e))
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
            if (jpf.isOpera)
                delta *= -1;
        }
        else if (e.detail)
            delta = -e.detail / 3;

        return {
            type : "DOMMouseScroll",
            delta : delta
        }
    },

    /**
     * Initiate user interface recorder and start recording
     */
    record : function() {
        jpf.uirecorder.isRecording = true;
        jpf.uirecorder.init();
    },
    
    /**
     * Stop recording and start playing
     */
    play : function() {
        jpf.uirecorder.isRecording = false;
        jpf.uirecorder.isPlaying   = true;
        jpf.uirecorder.playStack   = jpf.uirecorder.actionStack.slice(0);

        playFrame();
    },

    /**
     * Stop recording and playing
     */
    stop : function() {
        jpf.uirecorder.isRecording = false;
        jpf.uirecorder.isPlaying   = false;
    },
    
    /**
     * Stop recording and playing, clear list of recorded actions
     */
    reset : function() {
        jpf.uirecorder.isRecording = false;
        jpf.uirecorder.isPlaying   = false;
        jpf.uirecorder.playStack   = [];
        jpf.uirecorder.actionStack = [];
    }
};

var timeout;
function playFrame() {
    var frame = jpf.uirecorder.playStack.shift();

    if(!frame || !jpf.uirecorder.isPlaying)
        return;

    var lastTime = frame[0];
    var simulate = false;

    if (jpf.isIE) {
        var e = document.createEventObject();
        
        for (prop in frame[3]) {
            if (frame[3][prop])
                e[prop] = frame[3][prop];
        }

        e.srcElement = e.target = frame[2];//orginalnie byl tylko e.target

        frame[2].fireEvent(frame[1], e);
    }
    else {
        var src = frame[3], e;

        switch(src.type) {
            case "mousemove":
            case "mouseup":
            case "mousedown":
            case "click":
            case "dblclick":
            case "mouseover":
            case "mouseout":
                e = document.createEvent("MouseEvents");
                e.initMouseEvent(src.type, src.bubbles, true, window, 1, src.screenX,
                  src.screenY, src.clientX, src.clientY, src.ctrlKey, src.altKey,
                  src.shiftKey, src.metaKey, src.button, src.target
                );
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
            case "DOMAttrModified":
            case "DOMCharacterDataModified":
            case "DOMNodeInsertedIntoDocument":
            case "DOMNodeRemovedFromDocument":
            case "DOMNodeRemoved":
            case "DOMNodeInserted":
            case "DOMSubtreeModified":
                e = document.createEvent("MutationEvents");
                e.initMutationEvent(src.type, src.bubbles, src.cancelable, src.relatedNode, src.prevValue, src.newValue, src.attrName, src.attrChange);
                break;
            case "DOMMouseScroll": //mouse scroll
                fireScroll(frame);
                simulate = true;
                break;
            default:
                jpf.console.info("default: " + src.type);
                simulate = true;
                break;
        }

        if (!simulate) {
            frame[2].dispatchEvent(e);
        }
    }

    if (jpf.uirecorder.playStack.length) {
        timeout = setTimeout(function() {
            playFrame();
        }, jpf.uirecorder.playStack[0][0] - lastTime);
    }
    else {
        jpf.uirecorder.isPlaying = false;
        clearInterval(timeout);
    }
};

/**
 * Actually supports only vertical scrolling
 * 
 * @param {Object} frame
 */
function fireScroll(frame) {
    var el = frame[2];

    while (el != document.body && el.scrollHeight == el.offsetHeight) {
        el = el.parentNode || el.parentElement;
    }

    // FF - 39
    // Chrome - 120
    el.scrollTop = el.scrollTop - (jpf.isGecko ? 39 : (jpf.isChrome ? 120 : 20))*frame[3].delta;
}
