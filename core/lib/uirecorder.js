jpf.uirecorder = {
    actionStack : [],
    isPlaying   : false,
    isRecording : false,
    playStack   : [],
    lastTime    : null,
    
    init : function() {
        var isPlaying = jpf.uirecorder.isPlaying;
        var isRecording = jpf.uirecorder.isRecording;

        /* Mouse events
         * Keyboard events
         * HTML events
         * UI events
         */

        var dEvents = [
            "onclick", "onmousedown", "onmouseup", "onmousemove", "onmouseover", "onmouseout", 
            "onkeydown", "onkeyup", "onkeypress",
            "onselect", "onchange", "onsubmit", "onreset", "onfocus", "onblur",
            "onscroll", "onactivate"];
        
        var wEvents = ["onresize"];
        /*var mEvents = ["DOMSubtreeModified", "DOMNodeInserted", "DOMNodeRemoved", "DOMNodeRemovedFromDocument",
            "DOMNodeInsertedIntoDocument", "DOMAttrModified", "DOMCharacterDataModified"];*/

        for(var i = 0, l = dEvents.length; i < l; i++) {
            document.documentElement[dEvents[i]] = function(e) {
                if (isPlaying || !isRecording)
                    return;
        
                if (!e) e = event;
        
                jpf.uirecorder.actionStack.push([new Date().getTime(), dEvents[i],
                    e.srcElement || e.target, jpf.extend({}, e)]);
            }
        }
        
        for(var i = 0, l = wEvents.length; i < l; i++) {
            window[wEvents[i]] = function(e) {
                if (isPlaying || !isRecording)
                    return;

                if (!e) e = event;

                jpf.uirecorder.actionStack.push([new Date().getTime(), wEvents[i],
                    e.srcElement || e.target, jpf.extend({}, e)]);
            }
        }
        
        /*for(var i = 0; i < mEvents.length; i++) {
            document.addEventListener(mEvents[i], function(e) {
                if (isPlaying || !isRecording)
                        return;
    
                    if (!e) e = event;

                    jpf.uirecorder.actionStack.push([new Date().getTime(), mEvents[i],
                        e.srcElement || e.target, jpf.extend({}, e)]);
            }, false);
        }*/
        
    }
};

jpf.uirecorder.record = function() {
    jpf.uirecorder.isRecording = true;
    jpf.uirecorder.init();
};

jpf.uirecorder.play = function() {
    jpf.uirecorder.isRecording = false;
    jpf.uirecorder.isPlaying   = true;
    jpf.uirecorder.playStack   = jpf.uirecorder.actionStack.slice(0);

    playItem();
};

jpf.uirecorder.stop = function() {
    jpf.uirecorder.isRecording = false;
    jpf.uirecorder.isPlaying   = false;
};

function playItem() {
    var ill = jpf.uirecorder;
    var item = ill.playStack.shift();
    lastTime = item[0];

    if (jpf.isIE) {
        var e = document.createEventObject();
        for (prop in item[3]) {
            if (item[3][prop])
                e[prop] = item[3][prop];
        }
        //e.srcElement = item[2];
        e.target = item[2];

        if(item[1] == "onkeydown") {
            jpf.flow.alert_r(e);
        }
        //setTimeout(function(){
        //try{
            item[2].fireEvent(item[1], e);
        /*}
        catch(e){
        }*/
        //});
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
                jpf.console.info("Mouse Events: "+src.type);
                break;
            case "keyup":
            case "keydown":
            case "keypress":
                e = document.createEvent("KeyboardEvent");
                e.initKeyEvent(src.type, src.bubbles, true, window, 
                        src.ctrlKey, src.altKey, src.shiftKey, src.metaKey, 
                        src.keyCode, src.charCode); 
                jpf.console.info("Keyboard Events: "+src.type);
                break;
            case "select":
            case "change":
            case "submit":
            case "reset":
            case "focus":
            case "blur":
                e = document.createEvent("HTMLEvents");
                e.initEvent(src.type, src.bubbles, src.cancelable);
                jpf.console.info("HTML Events: "+src.type);
                break;
            case "resize":
            case "scroll":
            case "activate":
                e = document.createEvent("UIEvents");
                e.initUIEvent(src.type, src.bubbles, src.cancelable, e.view, e.detail);
                jpf.console.info("UI Events: "+src.type);
           /*case "DOMAttrModified":
           case "DOMCharacterDataModified":
           case "DOMNodeInsertedIntoDocument":
           case "DOMNodeRemovedFromDocument":
           case "DOMNodeRemoved":
           case "DOMNodeInserted":
           case "DOMSubtreeModified":
               e = document.createEvent("MutationEvent");
               e.initMutationEvent(src.type, src.bubbles, src.cancelable, src.relatedNode, src.prevValue, src.newValue, src.attrName);
               break;*/
           default:
               jpf.console.info("default: "+src.type);
               break;
        }

        item[2].dispatchEvent(e);
    }

    if (ill.playStack.length) {
        setTimeout(function() {
            playItem();
        }, ill.playStack[0][0] - lastTime);
    }
};

jpf.uirecorder.saveState = function() {
    
};
