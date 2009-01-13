jpf.inlineload = {
    actionStack : [],
    isPlaying   : false,
    isRecording : false,
    playStack   : [],
    lastTime    : null,
    
    init : function() {
        var isPlaying = jpf.inlineload.isPlaying;
        var isRecording = jpf.inlineload.isRecording;

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
        
        /*var wEvents = ["onresize"];*/

        for(var i = 0; i < dEvents.length; i++) {
            document.documentElement[dEvents[i]] = function(e) {
                if (isPlaying || !isRecording)
                    return;
        
                if (!e) e = event;
        
                jpf.inlineload.actionStack.push([new Date().getTime(), dEvents[i],
                    e.srcElement || e.target, jpf.extend({}, e)]);
            }
        }
        
        /*for(var i = 0; i < wEvents.length; i++) {
            window[wEvents[i]] = function(e) {
                if (isPlaying || !isRecording)
                    return;

                if (!e) e = event;

                jpf.inlineload.actionStack.push([new Date().getTime(), wEvents[i],
                    e.srcElement || e.target, jpf.extend({}, e)]);
            }
        }*/
    }
};

jpf.inlineload.record = function() {
    jpf.inlineload.isRecording = true;
    jpf.inlineload.init();
};

jpf.inlineload.play = function() {
    jpf.inlineload.isRecording = false;
    jpf.inlineload.isPlaying   = true;
    jpf.inlineload.playStack   = jpf.inlineload.actionStack.slice(0);

    playItem();
};

jpf.inlineload.stop = function() {
    jpf.inlineload.isRecording = false;
    jpf.inlineload.isPlaying   = false;
};

function playItem() {
    var ill = jpf.inlineload;
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
                e = document.createEvent("HTMLEvents");
                e.initEvent(src.type, src.bubbles, src.cancelable);
                break;
            /*case "resize":
            case "scroll":
            case "activate":
                e = document.createEvent("UIEvents");
                //jpf.flow.alert_r();
                //e = initUIEvent(src.type, src.bubbles, src.cancelable, window);
                break;*/
        }

        item[2].dispatchEvent(e);
    }

    if (ill.playStack.length) {
        setTimeout(function() {
            playItem();
        }, ill.playStack[0][0] - lastTime);
    }
};

jpf.inlineload.saveState = function() {
    
};
