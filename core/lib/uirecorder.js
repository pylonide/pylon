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
            "onclick", "onmousedown", "onmouseup", "onmousemove", "onmouseover", "onmouseout", 
            "onkeydown", "onkeyup", "onkeypress",
            "onselect", "onchange", "onsubmit", "onreset", "onfocus", "onblur",
            "onscroll"];

        var mEvents = ["DOMSubtreeModified", "DOMNodeInserted", "DOMNodeRemoved", "DOMNodeRemovedFromDocument",
            "DOMNodeInsertedIntoDocument", "DOMAttrModified", "DOMCharacterDataModified", "DOMActivate"];

        for (var i = 0, l = dEvents.length; i < l; i++) {
            document.documentElement[dEvents[i]] = function(e) {
                if (jpf.uirecorder.isPlaying || !jpf.uirecorder.isRecording)
                    return;
        
                e = e || event;
        
                jpf.uirecorder.actionStack.push([new Date().getTime(), dEvents[i],
                    e.srcElement || e.target, jpf.extend({}, e)]);
            }
        }
        
        for (var i = 0; i < mEvents.length; i++) {
            document.addEventListener(mEvents[i], function(e) {
                if (jpf.uirecorder.isPlaying || !jpf.uirecorder.isRecording)
                    return;

                e = e || event;

                jpf.uirecorder.actionStack.push([new Date().getTime(), mEvents[i], e.srcElement || e.target, jpf.extend({}, e)]);
            }, false);
        }
        
    }
};

jpf.uirecorder.record = function() {
    jpf.uirecorder.isRecording = true;
    jpf.uirecorder.init();
};

jpf.uirecorder.play = function() {
    jpf.uirecorder.isRecording = false;
    jpf.uirecorder.isPlaying   = true;
    jpf.uirecorder.playStack = jpf.uirecorder.actionStack.slice(0);

    playItem();
};

jpf.uirecorder.stop = function() {
    jpf.uirecorder.isRecording = false;
    jpf.uirecorder.isPlaying   = false;
};

jpf.uirecorder.reset = function() {
    jpf.uirecorder.isRecording = false;
    jpf.uirecorder.isPlaying   = false;
    jpf.uirecorder.playStack = [];
    jpf.uirecorder.actionStack = [];
};

var timeout;
function playItem() {
    var item = jpf.uirecorder.playStack.shift();

    if(!item)
        return;

    var lastTime = item[0];

    if (jpf.isIE) {
        var e = document.createEventObject();
        
        for (prop in item[3]) {
            if (item[3][prop])
                e[prop] = item[3][prop];
        }

        e.srcElement = e.target = item[2];//orginalnie byl tylko e.target

        item[2].fireEvent(item[1], e);
    }
    else {
        var src = item[3], e;

        switch(src.type) {
            case "mousemove":
            case "mouseup":
            case "mousedown":
            case "click":
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
            case "focus":
            case "blur":
            case "resize":
            case "scroll":
                e = document.createEvent("HTMLEvents");
                e.initEvent(src.type, src.bubbles, src.cancelable);
                break;
            case "DOMActivate":
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
           default:
               jpf.console.info("default: "+src.type);
               break;
        }

        item[2].dispatchEvent(e);
    }

    if (jpf.uirecorder.playStack.length) {
        timeout = setTimeout(function() {
            playItem();
        }, jpf.uirecorder.playStack[0][0] - lastTime);
    }
    else {
        jpf.uirecorder.isPlaying = false;
        clearInterval(timeout);
    }
};

jpf.uirecorder.saveState = function() {
    
};
