// #ifdef __WITH_UIRECORDER
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
apf.uirecorder = {
    isPlaying   : false,
    isRecording : false,
    isTesting   : false,
    inited      : false,
    
    playActions  : {"mousemove":1, "click":1, "keypress":1},
    playList     : [],
    initialState : {},
    current      : {},
    setTimeout   : self.setTimeout,
    
    ERROR_NODE_NOT_VISIBLE : "Element \"_VAL_\" is not visible.",
    ERROR_NODE_NOT_EXIST : "AML Node \"_VAL_\" does not exist (anymore). AML Node is removed from the document or the id is changed/removed.",
    ERROR_NODE_NOT_INIT : "HTML node \"_VAL_\" not initialized (yet).",            
    ERROR_ACTION_WRONG_TARGET : "Could not perform action \"_VAL_\" on target node \"_VAL_\".",
    WARNING_NO_ID : "No id specified for amlNode with xpath: \"_VAL_\". Using xpath now to determine corresponding element. Could fail if elements are added/removed.",
    
    init : function() {
        if (apf.uirecorder.inited)
            return;

        apf.uirecorder.inited = true;

        //document.attachEvent("onmousedown", function() {
            //alert("click");
        //});
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
            //apf.uirecorder.captureAction("click", e);
        }

        document.documentElement.ondblclick = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            apf.uirecorder.captureAction("dblClick", e);
        }
        
/*
        document.attachEvent("onmousedown", function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            apf.uirecorder.captureAction("mousedown", e);
            
        });
*/      

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
            debugger;
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;

            var keycode = (e.keyCode) ? e.keyCode : e.which;

            apf.uirecorder.captureAction("keyup", e, keycode);
        }
        
        document.documentElement.onkeydown = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;

            //var validKeys = [37, 38, 39, 40, 27]; // arrowkeys, esc

            var keycode = (e.keyCode) ? e.keyCode : e.which;

            //if (validKeys.indexOf(keycode) == -1) return;

            //if (e.shiftKey) keycode = "[SHIFT]" + keycode;
            //if (e.altKey)   keycode = "[ALT]" + keycode;
            //if (e.ctrlKey)  keycode = "[CTRL]" + keycode;

            apf.uirecorder.captureAction("keydown", e, keycode);
        }
        
        document.documentElement.onkeypress = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;

            var character = "";
            if (e.keyCode) { // Internet Explorer
                character = String.fromCharCode(e.keyCode);
            } 
            else if (e.which) { // W3C
                character = String.fromCharCode(e.which);
            }
            else {
                character = e.keyCode
            }
           

            if (e.shiftKey) character = "[SHIFT]" + character;
            if (e.altKey)   character = "[ALT]" + character;
            if (e.ctrlKey)  character = "[CTRL]" + character;
            //alert(character);
            //apf.uirecorder.captureAction("keypress", e, character);
        }

        /* Support for Mouse Scroll event */
        if(document.addEventListener) {
            /* FF */
            document.addEventListener("DOMMouseScroll", function(e) {
                if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                    return;
    
                e = e || event;

                var delta = null;
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                    if (apf.isOpera)
                        delta *= -1;
                }
                else if (e.detail)
                    delta = -e.detail / 3;
                
                apf.uirecorder.captureAction("mousescroll", e, delta);
            }, false);
        }
        else {
            /* IE */
            document.onmousewheel = function(e) {
                if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                    return;

                e = e || event;

                var delta = null;
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                    if (apf.isOpera)
                        delta *= -1;
                }
                else if (e.detail)
                    delta = -e.detail / 3;
                    
                apf.uirecorder.captureAction("mousescroll", e, delta);
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
    curTestFile : "",

    record : function(file) {
        apf.uirecorder.curTestFile = file;
        apf.uirecorder.actionList = [];
        apf.uirecorder.detailList = {};
        apf.uirecorder.startTime = new Date().getTime();
        apf.uirecorder.isRecording = true;

        apf.uirecorder.init();
    },
    
    /**
     * Stop recording and start playing
     */
    curTestIdx : 0, 
    curActionIdx : 0, 
    play : function(saveResults) {
        // testing
        if (!apf.uirecorder.testListXml) apf.uirecorder.testListXml = apf.getXml('<testList><test file="demo/google/translate/example.xml" name="test1" index="0" status="@todo status"><action name="init" x="630" y="222" time="16" delayTime=""><element name="apf"><activeElement></activeElement></element><element name="uir_bar"><events><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="16"/></events></element></action><action name="mousemove" x="628" y="226" time="172" delayTime="3469"><element name="apf"><activeElement>html[1]/body[1]/a:window[1]/a:bar[1]/a:dropdown[1]</activeElement></element><element name="winGoogle"><events><event name="show" caption="show" time="32"/></events></element></action><action name="mousemove" x="621" y="226" time="203" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="617" y="226" time="219" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="614" y="227" time="219" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="611" y="229" time="235" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="607" y="232" time="235" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="603" y="236" time="250" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="597" y="240" time="250" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="591" y="245" time="266" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="584" y="252" time="266" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="579" y="259" time="282" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="574" y="263" time="282" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="570" y="269" time="297" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="566" y="274" time="297" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="563" y="279" time="313" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="560" y="283" time="328" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="557" y="287" time="328" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="554" y="291" time="344" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="552" y="294" time="344" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="549" y="297" time="360" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="547" y="300" time="360" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="546" y="303" time="375" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="543" y="310" time="407" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="543" y="311" time="453" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="543" y="313" time="469" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="543" y="314" time="485" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="543" y="316" time="516" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="544" y="316" time="735" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="545" y="316" time="735" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="546" y="316" time="750" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="548" y="316" time="750" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="549" y="316" time="782" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="551" y="316" time="813" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="552" y="316" time="860" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="550" y="316" time="1235" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="549" y="316" time="1516" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="547" y="316" time="1532" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="546" y="316" time="1547" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="545" y="316" time="1563" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="543" y="316" time="1563" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="542" y="316" time="1594" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="540" y="316" time="1610" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="541" y="316" time="1891" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="542" y="316" time="1907" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="544" y="316" time="2063" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="545" y="316" time="2250" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="545" y="316" time="2469" delayTime="2500" amlNode="winGoogle" htmlNode="$minBtn" width="16" height="16" absX="541" absY="303"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="to_translate"><events><event name="DOMFocusOut" caption="DOMFocusOut" time="2469"/><event name="focus" caption="focus" time="2469"/><event name="focus" caption="focus" time="2469"/><event name="focus" caption="focus" time="2469"/><event name="focus" caption="focus" time="2469"/><event name="focus" caption="focus" time="2469"/><event name="focus" caption="focus" time="2469"/><event name="focus" caption="focus" time="2469"/><event name="focus" caption="focus" time="2469"/><event name="movefocus" caption="movefocus" time="2469"/><event name="xforms-focus" caption="xforms-focus" time="2469"/><event name="DOMFocusIn" caption="DOMFocusIn" time="2469"/></events></element><element name="winGoogle"><events><event name="mousedown" caption="mousedown" time="2469"/><event name="mousedown" caption="mousedown" time="2469"/></events></element></action><action name="mouseup" x="545" y="316" time="2594" delayTime="3594" amlNode="winGoogle" htmlNode="$minBtn" width="16" height="16" absX="541" absY="303"><element name="apf"><activeElement>html[1]/body[1]/a:window[1]/a:bar[1]/a:dropdown[1]</activeElement></element><element name="winGoogle"><events><event name="beforestatechange" caption="beforestatechange" time="2594"/><event name="afterstatechange" caption="afterstatechange" time="2594"/></events><properties><property name="state" time="2594">minimized</property></properties></element><element name="to_translate"><events><event name="blur" caption="blur" time="2594"/><event name="blur" caption="blur" time="2594"/><event name="blur" caption="blur" time="2594"/><event name="blur" caption="blur" time="2594"/><event name="blur" caption="blur" time="2594"/><event name="blur" caption="blur" time="2594"/><event name="blur" caption="blur" time="2594"/><event name="blur" caption="blur" time="2594"/></events></element><element name="trashbin"><events><event name="xforms-next" caption="xforms-next" time="2594"/></events></element></action><action name="mousemove" x="546" y="316" time="2813" delayTime="5860" amlNode="winGoogle"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element></action><action name="mousemove" x="548" y="316" time="2828" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="549" y="316" time="2828" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="551" y="316" time="2844" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="551" y="315" time="2844" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="552" y="315" time="2860" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="553" y="315" time="2860" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="555" y="315" time="2875" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="556" y="314" time="2875" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="559" y="314" time="2891" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="561" y="314" time="2891" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="562" y="314" time="2907" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="563" y="312" time="2922" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="562" y="312" time="3391" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="559" y="312" time="3407" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="557" y="312" time="3422" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="556" y="312" time="3422" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="554" y="312" time="3438" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="554" y="313" time="3438" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="553" y="313" time="3500" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="552" y="313" time="3516" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="550" y="313" time="3735" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="549" y="313" time="3735" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="546" y="314" time="3750" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="545" y="314" time="3766" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="543" y="314" time="3782" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="542" y="316" time="3797" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="540" y="316" time="3813" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="541" y="316" time="4125" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="542" y="316" time="4157" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="544" y="316" time="4469" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="545" y="316" time="4500" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="546" y="316" time="4563" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="546" y="316" time="4860" delayTime="4891" amlNode="winGoogle" htmlNode="$minBtn" width="16" height="16" absX="541" absY="303"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="to_translate"><events><event name="DOMFocusOut" caption="DOMFocusOut" time="4860"/><event name="focus" caption="focus" time="4860"/><event name="focus" caption="focus" time="4860"/><event name="focus" caption="focus" time="4860"/><event name="focus" caption="focus" time="4860"/><event name="focus" caption="focus" time="4860"/><event name="focus" caption="focus" time="4860"/><event name="focus" caption="focus" time="4860"/><event name="focus" caption="focus" time="4860"/><event name="movefocus" caption="movefocus" time="4860"/><event name="xforms-focus" caption="xforms-focus" time="4860"/><event name="DOMFocusIn" caption="DOMFocusIn" time="4860"/></events></element><element name="winGoogle"><events><event name="mousedown" caption="mousedown" time="4860"/><event name="mousedown" caption="mousedown" time="4860"/></events></element></action><action name="mouseup" x="546" y="316" time="4985" delayTime="5000" amlNode="winGoogle" htmlNode="$minBtn" width="16" height="16" absX="541" absY="303"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="winGoogle"><events><event name="beforestatechange" caption="beforestatechange" time="4985"/><event name="afterstatechange" caption="afterstatechange" time="4985"/></events><properties><property name="state" time="4985">normal</property></properties></element><element name="to_translate"><events><event name="focus" caption="focus" time="5000"/><event name="focus" caption="focus" time="5000"/><event name="focus" caption="focus" time="5000"/><event name="focus" caption="focus" time="5000"/><event name="focus" caption="focus" time="5000"/><event name="focus" caption="focus" time="5000"/><event name="focus" caption="focus" time="5000"/><event name="focus" caption="focus" time="5000"/><event name="movefocus" caption="movefocus" time="5000"/><event name="xforms-focus" caption="xforms-focus" time="5000"/><event name="DOMFocusIn" caption="DOMFocusIn" time="5000"/></events></element></action><action name="mousemove" x="549" y="316" time="5328" delayTime="8532" amlNode="winGoogle"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element></action><action name="mousemove" x="551" y="316" time="5344" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="552" y="316" time="5344" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="553" y="316" time="5360" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="555" y="315" time="5375" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="556" y="315" time="5391" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="559" y="315" time="5391" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="561" y="315" time="5407" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="562" y="315" time="5407" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="563" y="315" time="5422" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="565" y="315" time="5438" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="566" y="315" time="5438" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="568" y="315" time="5453" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="569" y="315" time="5485" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="570" y="315" time="5500" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="569" y="315" time="5797" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="567" y="315" time="5828" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="566" y="315" time="6328" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="564" y="315" time="6344" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="563" y="315" time="6360" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="562" y="315" time="6407" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="560" y="315" time="6407" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="559" y="315" time="6422" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="559" y="314" time="7688" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="561" y="314" time="7860" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="562" y="314" time="8172" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="563" y="314" time="8219" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="563" y="314" time="8516" delayTime="8547" amlNode="winGoogle" htmlNode="$maxBtn" width="16" height="16" absX="557" absY="303"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="winGoogle"><events><event name="mousedown" caption="mousedown" time="8516"/><event name="mousedown" caption="mousedown" time="8516"/></events></element></action><action name="mouseup" x="563" y="314" time="8641" delayTime="8719" amlNode="winGoogle" htmlNode="$maxBtn" width="16" height="16" absX="557" absY="303"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="winGoogle"><events><event name="beforestatechange" caption="beforestatechange" time="8641"/><event name="afterstatechange" caption="afterstatechange" time="8719"/></events><properties><property name="state" time="8641">maximized</property></properties></element></action><action name="mousemove" x="565" y="314" time="8953" delayTime="" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><events><event name="mouseover" caption="mouseover" time="9532"/><event name="mouseout" caption="mouseout" time="9625"/><event name="mouseover" caption="mouseover" time="10344"/></events></element></action><action name="mousemove" x="566" y="314" time="8969" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="568" y="314" time="8985" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="569" y="316" time="9000" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="570" y="316" time="9000" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="572" y="317" time="9016" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="573" y="317" time="9016" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="576" y="318" time="9032" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="578" y="320" time="9032" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="580" y="321" time="9047" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="586" y="324" time="9047" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="590" y="325" time="9063" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="602" y="328" time="9063" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="620" y="337" time="9078" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="678" y="367" time="9094" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="714" y="385" time="9094" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="754" y="405" time="9110" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="793" y="425" time="9110" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="833" y="445" time="9125" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="872" y="465" time="9125" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="906" y="483" time="9141" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="969" y="524" time="9157" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="996" y="546" time="9172" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1022" y="565" time="9172" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1045" y="584" time="9188" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1065" y="602" time="9188" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1084" y="619" time="9203" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1100" y="636" time="9203" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1127" y="661" time="9219" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1140" y="675" time="9235" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1151" y="689" time="9235" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1163" y="706" time="9250" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1173" y="720" time="9250" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1184" y="736" time="9266" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1192" y="749" time="9266" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1202" y="760" time="9282" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1212" y="770" time="9282" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1222" y="780" time="9297" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1229" y="786" time="9297" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1238" y="793" time="9313" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1251" y="805" time="9328" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1258" y="813" time="9328" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1266" y="824" time="9344" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1286" y="848" time="9375" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1319" y="871" time="9375" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1327" y="872" time="9391" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1336" y="872" time="9391" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1342" y="872" time="9407" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1347" y="872" time="9407" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1353" y="872" time="9422" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1361" y="876" time="9422" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1373" y="881" time="9438" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1387" y="888" time="9438" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1401" y="893" time="9453" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1417" y="899" time="9453" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1431" y="902" time="9469" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1448" y="905" time="9485" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1462" y="908" time="9485" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1475" y="910" time="9500" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1489" y="915" time="9500" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1503" y="919" time="9516" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1518" y="925" time="9516" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1530" y="932" time="9532" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1542" y="936" time="9532" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1552" y="939" time="9547" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1559" y="942" time="9547" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1564" y="943" time="9563" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1566" y="943" time="9563" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1566" y="938" time="9610" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1566" y="930" time="9625" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1560" y="913" time="9641" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1547" y="892" time="9641" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1530" y="869" time="9641" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1514" y="849" time="9657" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1500" y="835" time="9657" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1486" y="819" time="9672" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1475" y="802" time="9672" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1460" y="779" time="9688" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1443" y="750" time="9688" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1423" y="717" time="9703" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1401" y="679" time="9703" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1375" y="636" time="9719" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1342" y="589" time="9735" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1306" y="539" time="9735" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1266" y="491" time="9750" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1220" y="440" time="9750" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1178" y="388" time="9766" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1134" y="336" time="9766" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1093" y="291" time="9782" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1054" y="248" time="9782" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1019" y="213" time="9797" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="988" y="182" time="9797" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="958" y="155" time="9813" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="934" y="132" time="9813" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="911" y="111" time="9828" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="894" y="91" time="9828" delayTime="" ignore="true" amlNode="language"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="877" y="74" time="9844" delayTime="" ignore="true" amlNode="translated"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="863" y="61" time="9844" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="853" y="54" time="9860" delayTime="" ignore="true" amlNode="to_translate"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="848" y="52" time="9860" delayTime="" ignore="true" amlNode="to_translate"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="847" y="52" time="9875" delayTime="" ignore="true" amlNode="to_translate"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="847" y="57" time="9891" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="847" y="68" time="9891" delayTime="" ignore="true" amlNode="translated"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="853" y="83" time="9907" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="864" y="100" time="9907" delayTime="" ignore="true" amlNode="language"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="881" y="121" time="9922" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="904" y="147" time="9922" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="937" y="182" time="9938" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="977" y="219" time="9938" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1021" y="262" time="9953" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1070" y="308" time="9953" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1120" y="355" time="9969" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1173" y="406" time="9969" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1221" y="456" time="9985" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1269" y="507" time="9985" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1312" y="554" time="10000" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1351" y="601" time="10000" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1386" y="644" time="10016" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1411" y="683" time="10016" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1428" y="713" time="10032" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1438" y="737" time="10032" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1444" y="754" time="10047" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1445" y="767" time="10063" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1445" y="777" time="10063" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1445" y="784" time="10078" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1445" y="793" time="10078" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1445" y="801" time="10094" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1445" y="813" time="10094" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1445" y="824" time="10110" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1445" y="835" time="10110" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1447" y="847" time="10125" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1449" y="857" time="10125" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1452" y="861" time="10141" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1454" y="864" time="10141" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1454" y="865" time="10157" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1455" y="866" time="10157" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1455" y="871" time="10172" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1459" y="883" time="10188" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1461" y="891" time="10188" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1462" y="896" time="10203" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1462" y="902" time="10203" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1464" y="905" time="10219" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1464" y="906" time="10219" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1464" y="908" time="10250" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1465" y="910" time="10250" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1465" y="913" time="10266" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1466" y="916" time="10266" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1468" y="920" time="10282" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1468" y="923" time="10282" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1471" y="926" time="10297" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1472" y="928" time="10313" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1474" y="930" time="10313" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1475" y="930" time="10328" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1475" y="932" time="10328" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1476" y="935" time="10344" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1478" y="936" time="10344" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1479" y="939" time="10360" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1481" y="942" time="10360" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1483" y="945" time="10375" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1485" y="947" time="10375" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1486" y="949" time="10391" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1488" y="949" time="10391" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1489" y="949" time="10407" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1491" y="949" time="10422" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1492" y="949" time="10453" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1493" y="950" time="10453" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1495" y="950" time="10453" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1496" y="952" time="10469" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1498" y="952" time="10469" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1499" y="952" time="10500" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1502" y="952" time="10516" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1503" y="952" time="10516" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1505" y="952" time="10532" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1506" y="952" time="10547" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1508" y="952" time="10563" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1509" y="952" time="10594" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1509" y="951" time="10766" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1507" y="951" time="10797" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1507" y="950" time="10797" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1506" y="950" time="10813" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1504" y="950" time="10813" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1503" y="950" time="10828" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1502" y="950" time="10860" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1500" y="950" time="10860" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1499" y="948" time="10907" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1496" y="947" time="10953" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1493" y="946" time="10969" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1492" y="946" time="10985" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1490" y="946" time="10985" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="1490" y="946" time="11313" delayTime="12313" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]" htmlNode="$ext" width="100" height="25" absX="1474" absY="933"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><events><event name="mousedown" caption="mousedown" time="11313"/><event name="DOMFocusOut" caption="DOMFocusOut" time="11313"/><event name="focus" caption="focus" time="11313"/><event name="focus" caption="focus" time="11313"/><event name="focus" caption="focus" time="11313"/><event name="focus" caption="focus" time="11313"/><event name="focus" caption="focus" time="11313"/><event name="focus" caption="focus" time="11313"/><event name="focus" caption="focus" time="11313"/><event name="movefocus" caption="movefocus" time="11313"/><event name="xforms-focus" caption="xforms-focus" time="11313"/><event name="DOMFocusIn" caption="DOMFocusIn" time="11313"/><event name="mousedown" caption="mousedown" time="11313"/></events></element><element name="to_translate"><events><event name="blur" caption="blur" time="11313"/><event name="blur" caption="blur" time="11313"/><event name="blur" caption="blur" time="11313"/><event name="blur" caption="blur" time="11313"/><event name="blur" caption="blur" time="11313"/><event name="blur" caption="blur" time="11313"/><event name="blur" caption="blur" time="11313"/><event name="blur" caption="blur" time="11313"/></events></element></action><action name="mouseup" x="1490" y="946" time="11407" delayTime="11422" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]" htmlNode="$ext" width="100" height="25" absX="1474" absY="933"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><events><event name="mouseup" caption="mouseup" time="11407"/><event name="click" caption="click" time="11407"/></events></element></action><action name="mousemove" x="1490" y="937" time="11657" delayTime="12438" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1495" y="923" time="11657" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1501" y="907" time="11672" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1506" y="889" time="11672" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1512" y="867" time="11688" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1519" y="842" time="11688" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1526" y="812" time="11703" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1537" y="778" time="11703" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1550" y="731" time="11719" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1563" y="676" time="11719" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1574" y="622" time="11735" delayTime="" ignore="true" amlNode="winGoogle"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1589" y="569" time="11735" delayTime="" ignore="true" amlNode="html[1]/undefined[1]"><element name="apf"><activeElement></activeElement></element></action></test></testList>');
        // end testing
        apf.uirecorder.saveResults = saveResults;
        var timer = 3;
        uir_windowStartTest.setProperty("visible", true);
        uir_windowStartTest.setProperty("title", "Starting test in..." + timer);
        
        var intval = window.setInterval(function() {
            timer -= 1;
            if (timer == 0) {
                window.clearInterval(intval);
                intval = "";
                uir_windowStartTest.setProperty("visible", false);
                if (apf.uirecorder.saveResults) {
                    apf.uirecorder.resetResults();
                }
                
                apf.uirecorder.curTestIdx = 0;
                apf.uirecorder.curActionIdx = 0;
                //uir_btnPlay.setAttribute("disabled", true);
                uir_windowChanges.setProperty("visible", false);

                apf.uirecorder.load(apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")].getAttribute("file"), function() {
                    //var timeout = setTimeout(function() {
                        apf.queue.empty();
                        apf.uirecorder.playTest();
                        //clearTimeout(timeout);
                    //}, 2000);
                });
            }
            else {
                uir_windowStartTest.setProperty("title", "Starting test in..." + timer);
            }
        }, 1000);
    },
    playTest : function() {
        if (apf.uirecorder.saveResults)
            apf.uirecorder.test(apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")].getAttribute("file"));

        apf.uirecorder.playAction();
    },
    testDelay : 0,
    timeoutTimer : null,
    playAction : function() {
        var test = apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")];
        var action = test.childNodes[apf.uirecorder.curActionIdx];
        //var elapsedTime = 0;
        
        // realtime movement
        if (uir_ddRealtime.value == "realtime") {
            if (apf.uirecorder.timeoutTimer) {
                clearTimeout(apf.uirecorder.timeoutTimer);
            }
            
            var timeout = action.getAttribute("time")-(new Date().getTime() - apf.uirecorder.startTime + apf.uirecorder.testDelay);
            if (timeout > 0) {
                apf.uirecorder.timeoutTimer = setTimeout(function() {
                    apf.uirecorder.execAction();
                }, timeout);
            }
            else {
                apf.uirecorder.execAction();
            }
        }
        // max movement
        else if (uir_ddRealtime.value == "max") {
            apf.uirecorder.execAction();
        }
    },
    
    // check if currect action has certain events during testing
    checkEvents : {
        "beforeload"        : "afterload",
        "beforestatechange" : "afterstatechange"
    },
    beforeDelay : 0,
    checkList : {},
    execAction : function() {
        if (!apf.uirecorder.isTesting) return;
        
        var test = apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")];
        var action = test.childNodes[apf.uirecorder.curActionIdx];
        if (test.childNodes[apf.uirecorder.curActionIdx-1])
            var prevAction = test.childNodes[apf.uirecorder.curActionIdx-1]
        if (test.childNodes[apf.uirecorder.curActionIdx+1])
            var nextAction = test.childNodes[apf.uirecorder.curActionIdx+1]
        
        var xPos, yPos;
        if (action.getAttribute("name") != "mousemove") {
            if (action.getAttribute("amlNode")) {
                if (action.getAttribute("htmlNode")) {
                    // @todo check if htmlNode is visible
                    
                    var htmlNode;
                    var amlNode = apf.document.selectSingleNode(action.getAttribute("amlNode").substr(8)) // search for amlNode based on xpath 
                               || window[action.getAttribute("amlNode")] // search for amlNode with id 
                               || null; // no amlNode found
                    
                    if (!amlNode) {
                        apf.uirecorder.setTestResult("error", apf.uirecorder.ERROR_NODE_NOT_EXIST, action.getAttribute("amlNode"), test.getAttribute("name"));
                        return;
                    }
        
                    // get htmlNode
                    if (action.getAttribute("htmlNode") == "$ext")
                        htmlNode = amlNode.$ext;
                    else if (amlNode.$getActiveElements && amlNode.$getActiveElements()[action.getAttribute("htmlNode")])
                        htmlNode = amlNode.$getActiveElements()[action.getAttribute("htmlNode")];
                    
                    // htmlNode not visible
                    if (htmlNode.offsetTop == 0 && htmlNode.offsetLeft == 0 && htmlNode.offsetWidth == 0 && htmlNode.offsetHeight == 0) {
                        apf.uirecorder.setTestResult("error", apf.uirecorder.ERROR_NODE_NOT_VISIBLE, (action.getAttribute("htmlNode") != "$ext" ? action.getAttribute("htmlNode") : action.getAttribute("amlNode")), test.getAttribute("name"))
                        /*
                        if (!apf.uirecorder.testResults.error[test.getAttribute("name")]) apf.uirecorder.testResults.error[test.getAttribute("name")] = [];
                        apf.uirecorder.testResults.error[test.getAttribute("name")].push({
                            message: apf.uirecorder.ERROR_NODE_NOT_VISIBLE.replace("_ELEMENT_", (action.getAttribute("htmlNode") != "$ext" ? action.getAttribute("htmlNode") : action.getAttribute("amlNode")))
                        })
                        */
                    }
                    
                    // position of htmlNode
                    var pos = apf.getAbsolutePosition(htmlNode, htmlNode.parentNode)
                    xPos = pos[0]-(parseInt(action.getAttribute("absX"))-parseInt(action.getAttribute("x"))) * ((htmlNode.offsetWidth/action.getAttribute("width")));
                    yPos = pos[1]-(parseInt(action.getAttribute("absY"))-parseInt(action.getAttribute("y"))) * ((htmlNode.offsetHeight/action.getAttribute("height")));
                }
                else {
                    debugger;
                } 
            }
        }
        if (!xPos && !yPos) {
            xPos = action.getAttribute("x");
            yPos = action.getAttribute("y");
        }
//if (xPos != action.getAttribute("x") || yPos != action.getAttribute("y")) debugger;

        o3.mouseTo(
            parseInt(xPos) + hostWnd.clientX, 
            parseInt(yPos) + hostWnd.clientY, 
            hostWnd
        );
        
        /*
        if (action.getAttribute("name") === "click") {
            if (uir_ddRealtime.value == "max") o3.wait(1);
            o3.mouseLeftClick();
        }
        else 
        */
       if (action.getAttribute("name") === "keypress") {
            o3.sendKeyEvent(action.getAttribute("value"));
        }
        else if (action.getAttribute("name") === "keydown") {
            o3.sendKeyDown(action.getAttribute("value"));
        }
        else if (action.getAttribute("name") === "keyup") {
            o3.sendKeyUp(action.getAttribute("value"));
        }
        else if (action.getAttribute("name") === "mousedown") {
            if (uir_ddRealtime.value == "max") 
                o3.wait(1);
            o3.mouseLeftDown();
        }
        else if (action.getAttribute("name") === "mouseup") {
            if (uir_ddRealtime.value == "max")
                o3.wait(1);
            o3.mouseLeftUp();
        }
        else if (action.getAttribute("name") === "dblClick") {
            if (uir_ddRealtime.value == "max") 
                o3.wait(1);
            o3.mouseLeftDown();
            o3.mouseLeftUp();
            o3.mouseLeftDown();
            o3.mouseLeftUp();
        }
        else if (action.getAttribute("name") === "mousescroll") {
            o3.mouseWheel(action.getAttribute("value"));
        }

        // set checks
        if (action.getAttribute("name") != "mousemove") {
            if (action.getAttribute("htmlNode")) {
                if (!apf.uirecorder.checkList[test.getAttribute("name")]) apf.uirecorder.checkList[test.getAttribute("name")] = {};
                if (!apf.uirecorder.checkList[test.getAttribute("name")][apf.uirecorder.curActionIdx]) apf.uirecorder.checkList[test.getAttribute("name")][apf.uirecorder.curActionIdx] = {};
                apf.uirecorder.checkList[test.getAttribute("name")][apf.uirecorder.curActionIdx].htmlNode = 
                    (action.getAttribute("htmlNode") == "$ext") ? action.getAttribute("amlNode") : action.getAttribute("htmlNode"); 
            }
        }

        var delayCheck = false;
        if (apf.uirecorder.isTesting) {
            for (var ce in apf.uirecorder.checkEvents) {
                if (action.selectNodes("element[events[event[@name='" + ce + "']]]")) {
                    var matches = action.selectNodes("element[events[event[@name='" + ce + "']]]");
                    if (matches.length) {
                        for (var targetName, mi = 0, ml = matches.length; mi < ml; mi++) {
                            targetName = matches[mi].getAttribute("name");
                            if (targetName.indexOf("html[1]") == 0) {
                                delayCheck = true;
                                apf.uirecorder.beforeDelay = new Date().getTime();

                                
                                var amlNode = apf.xmldb.getNodeById(targetName) || apf.document.selectSingleNode(targetName.substr(8));
                                if (!amlNode) debugger;
                                
                                // event already triggered, continue test
                                if (apf.uirecorder.testEventList[targetName] && apf.uirecorder.testEventList[targetName].indexOf(apf.uirecorder.checkEvents[ce]) > -1) {
                                    apf.console.info("event " + apf.uirecorder.checkEvents[ce] + " already called on " + targetName);
                                    apf.uirecorder.testEventList[targetName].splice(apf.uirecorder.testEventList[targetName].indexOf(apf.uirecorder.checkEvents[ce]), 1);
                                    apf.uirecorder.testCheck();
                                }
                                // event not triggered yet, add listener
                                else {
                                    apf.console.info("addEventListener added to " + targetName + ": " + apf.uirecorder.checkEvents[ce]);
                                    amlNode.addEventListener(apf.uirecorder.checkEvents[ce], apf.uirecorder.waitForEvent);
                                }
                            }
                            else {
                                //debugger;
                            }
                        }
                    }
                }
            }
        }

/*
        for (var ce in apf.uirecorder.checkEvents) {
            if (apf.uirecorder.testEventList[ce] && apf.uirecorder.testEventList[ce].length) {
                for (var i = 0; i < apf.uirecorder.testEventList[ce].length; i++) {
                    if (apf.uirecorder.testEventList[ce][i].indexOf("html[1]") == 0) {
                        //debugger;
                        if (apf.uirecorder.testEventList[apf.uirecorder.checkEvents[ce]].indexOf(apf.uirecorder.testEventList[ce][i]) > -1) {
                            apf.uirecorder.testEventList[apf.uirecorder.checkEvents[ce]].splice(apf.uirecorder.testEventList[apf.uirecorder.checkEvents[ce]].indexOf(apf.uirecorder.testEventList[ce][i]), 1);
                            //apf.uirecorder.testCheck();
                        }
                        else {
                            delayCheck = true;
                            apf.console.info("addEventListener added to " + apf.uirecorder.testEventList[ce][i] + ": " + apf.uirecorder.checkEvents[ce]);
                            apf.document.selectSingleNode(apf.uirecorder.testEventList[ce][i].substr(8)).addEventListener(apf.uirecorder.checkEvents[ce], apf.uirecorder.waitForEvent);
                        }
                        apf.uirecorder.testEventList[ce].splice(i, 1);
                    }
                }
            }
        }
*/
        //apf.uirecorder.testEventList = {};
        
        if (!delayCheck) {
            apf.uirecorder.testCheck();
        } 
    },
    waitForEvent : function(e) {
        //apf.console.info("waitForEvent: " + apf.uirecorder.curActionIdx);
        e.currentTarget.removeEventListener(e.name, apf.uirecorder.waitForEvent);
        
        //(apf.xmlToXpath(this) || amlNode.id) 
        apf.console.info("event fired in waitForEvent: " + e.name);
//if (e.name == "afterstatechange") debugger;
        //apf.console.info("testCheck (waitForEvent): " + apf.uirecorder.curActionIdx);
        apf.uirecorder.testCheck();
        apf.uirecorder.testdelay += new Date().getTime() - apf.uirecorder.beforeDelay;
    },
    testResultsXml : null,
    testCheck : function(playNext) {
        if (!apf.uirecorder.isTesting) return;
        
        var test = apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")];
        var action = test.childNodes[apf.uirecorder.curActionIdx];

        // play next action
        if (test.childNodes.length > apf.uirecorder.curActionIdx+1 && !playNext) {
            apf.uirecorder.curActionIdx++;
            //apf.console.info("playAction (testCheck): test.childNodes.length = " + test.childNodes.length + " apf.uirecorder.curActionIdx+1 = " + apf.uirecorder.curActionIdx+1);
            apf.uirecorder.playAction();
        }
        else {
            apf.uirecorder.stop();
                
            // save test results
            if (apf.uirecorder.saveResults) {
                apf.uirecorder.save("results", test.getAttribute("name"));
            }

            // set test successful message
            if (test.childNodes.length == apf.uirecorder.curActionIdx+1) {
                if (!apf.uirecorder.testResults.notice[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("name")]) apf.uirecorder.testResults.notice[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("name")] = [];
                apf.uirecorder.testResults.notice[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("name")].push({
                    message: "Test successful"
                });
            }
            
            // play next test
            if (uir_listTests.selection.length > apf.uirecorder.curTestIdx+1) {
                apf.uirecorder.curTestIdx++;
                apf.uirecorder.load(apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")].getAttribute("file"), function() {
                    
                    // short delay to prevent capturing the loading of the elements in markup.xml
                    //var timeout = setTimeout(function() {
                        apf.uirecorder.curActionIdx = 0;
                        apf.uirecorder.playTest();
                        //clearTimeout(timeout);
                    //}, 2000);
                });
            }
            // all tests done
            else {
                apf.uirecorder.curTestIdx = null;
                apf.uirecorder.curActionIdx = null;
                if (apf.uirecorder.saveResults && uir_cbShowChanges.checked) {
                    uir_mdlTests.load(apf.uirecorder.testListXml.xml);
                    uir_mdlChanges2.load(apf.uirecorder.resultListXml.xml);
                    uir_windowChanges.setProperty("visible", true);
                }
                
                // generate testResults xml
                var xml = apf.getXml("<testResults />");
                var types = ["error", "warning", "notice"];
                var resultNode;
                for (var type, ti = 0, tl = types.length; ti < tl; ti++) {
                    type = types[ti];
                    for (var testId in apf.uirecorder.testResults[type]) {
                        if (apf.uirecorder.testResults[type][testId].length) {
                            for (var i = 0, l = apf.uirecorder.testResults[type][testId].length; i < l; i++) {
                                resultNode = xml.ownerDocument.createElement(type);
                                //resultNode.setAttribute("type", type);
                                resultNode.setAttribute("testId", testId);
                                if (apf.uirecorder.testResults[type][testId][i].action)
                                    resultNode.setAttribute("action", apf.uirecorder.testResults[type][testId][i].action);
                                resultNode.appendChild(xml.ownerDocument.createTextNode(apf.uirecorder.testResults[type][testId][i].message));
                                xml.appendChild(resultNode);
                            }
                        }
                    }
                }
                
                var numErrors   = xml.selectNodes("error").length;
                var numWarnings = xml.selectNodes("warning").length;
                var numNotices  = xml.selectNodes("notice").length;

                // temp solution for "datagrid using same model" bug
                if (numErrors == 0) {
                    resultNode = xml.ownerDocument.createElement("error");
                    resultNode.setAttribute("testId", testId);
                    resultNode.appendChild(xml.ownerDocument.createTextNode("No errors found"));
                    xml.appendChild(resultNode);
                    numErrors = 1;
                }
                if (numWarnings == 0) {
                    resultNode = xml.ownerDocument.createElement("warning");
                    resultNode.setAttribute("testId", testId);
                    resultNode.appendChild(xml.ownerDocument.createTextNode("No warnings found"));
                    xml.appendChild(resultNode);
                    numWarnings = 1;
                }
                if (numNotices == 0) {
                    resultNode = xml.ownerDocument.createElement("notice");
                    resultNode.setAttribute("testId", testId);
                    resultNode.appendChild(xml.ownerDocument.createTextNode("No notices found"));
                    xml.appendChild(resultNode);
                    numNotices = 1;
                }

                apf.uirecorder.testResultsXml = xml;
                // set testResults model
                uir_mdlTestResults.load(apf.uirecorder.testResultsXml.xml);
                
                // set number of errors, warning and notices to tab caption
                uir_pageTestResultsErrors.setProperty("caption", "Errors (" + numErrors + ")");
                uir_pageTestResultsWarnings.setProperty("caption", "Warnings (" + numWarnings + ")");
                uir_pageTestResultsNotices.setProperty("caption", "Notices (" + numNotices + ")");

                // change tab
                if (numErrors || numWarnings || numNotices)
                    uir_windowTestResults.setProperty("visible", true);

                if (numNotices > 0) {
                    uir_pageTestResultsNotices.setProperty("visible", true);
                    uir_tabTestResults.setAttribute('activepage', 'uir_pageTestResultsNotices');
                }
                else {
                    uir_pageTestResultsNotices.setProperty("visible", false);
                }
                
                if (numWarnings > 0) {
                    uir_pageTestResultsWarnings.setProperty("visible", true);
                    uir_tabTestResults.setAttribute('activepage', 'uir_pageTestResultsWarnings');
                }
                else {
                    uir_pageTestResultsWarnings.setProperty("visible", false);
                }

                if (numErrors > 0) {
                    uir_pageTestResultsErrors.setProperty("visible", true);
                    uir_tabTestResults.setAttribute('activepage', 'uir_pageTestResultsErrors');
                }
                else {
                    uir_pageTestResultsErrors.setProperty("visible", false);
                }
            // @todo write testResults to log file
                
                // reset testResults
                apf.uirecorder.testResults = {
                    error       : {},
                    warning     : {},
                    notice      : {}
                }
                apf.console.info("all tests done");
            }
        }
    },
    
    /**
     * Start testing
     */
    test : function(file) {
        apf.uirecorder.curTestFile = file;
        //apf.uirecorder.resultListXml = null;
        apf.uirecorder.actionList = [];
        apf.uirecorder.detailList = {};
        apf.uirecorder.startTime = new Date().getTime();
        apf.uirecorder.isTesting = true;
        apf.uirecorder.testEventList = [];
        apf.uirecorder.testDelay = 0;
        apf.uirecorder.curActionIdx = 0;
        apf.uirecorder.init();
    },
    
    /**
     * Stop recording and playing
     */
    stop : function() {
        apf.uirecorder.inited = false;
        if (apf.uirecorder.isRecording) {
            apf.uirecorder.isRecording = false;
            apf.uirecorder.save("test");
        }
        else if (apf.uirecorder.isTesting) {
            apf.uirecorder.isTesting   = false;
        }
        else if (apf.uirecorder.isPlaying) {
            apf.uirecorder.isPlaying   = false;
        }
        apf.uirecorder.detailList = {};
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
     * Stop recording and playing, clear list of recorded actions
     */
    resetResults : function() {
        apf.uirecorder.isRecording = false;
        apf.uirecorder.isPlaying   = false;
        apf.uirecorder.isTesting   = false;
        apf.uirecorder.resultListXml   = apf.getXml("<resultList />");
    },

    /**
     * 
     */
    markupLoaded : false,
    load : function(file, callback) {
        uir_bar.replaceMarkup(file, {
            callback : callback
        });
    },
    
    /**
     * Record user action like mouse clicks, movement of keypress 
     */
    actionList      : [],
    actionObjects : [],
    firstMousemoveObj : null,
    testResults : {
        error      : {},
        warning    : {},
        notice     : {}
    },
    captureAction : function(eventName, e, value) {
        var htmlElement = (e) ? e.srcElement || e.target : null;
        var amlNode     = (htmlElement && apf.findHost(htmlElement)) ? apf.findHost(htmlElement) : null;

        // ignore interaction with uirecorder controls
        if (amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0 && amlNode.id != "uir_bar") {
            return;
        }
        
        // search for related htmlNode
        if (eventName != "mousemove") {
            var htmlNode, htmlNodeName;
            
            // search for active elements
            if (amlNode && amlNode.$getActiveElements) {
                var activeElements = amlNode.$getActiveElements();
                if (activeElements) {
                    for (var name in activeElements) {
/*
                        // check for buttons
                        if (name == "buttons") {
                            for (var i = 0, l = activeElements[name].children.length; i < l; i++) {
                                if (apf.isChildOf(activeElements[name].children[i], htmlElement, true)) {
                                    amlNode["$" + activeElements[name].children[i].className.trim().split(" ")[0] + "Btn"] = activeElements[name].children[i];
                                    //alert("button found: " + "$" + activeElements[name][i].className.trim().split(" ")[0]);
                                    htmlNode = "$" + activeElements[name].children[i].className.trim().split(" ")[0] + "Btn";
                                    break;
                                }
                            }
                        }
                        else 
*/

                        if (apf.isChildOf(activeElements[name], htmlElement, true)) {
                            //amlNode[name] = activeElements[name];
                            //alert("activeElement found: " + i);
                            htmlNode = activeElements[name];
                            htmlNodeName = name;
                            break;
                        }
                    }
                }
            }

            // is multiselect widget
            // @todo generate name for multiselect htmlNode item
            if (amlNode && amlNode.hasFeature(apf.__MULTISELECT__) && amlNode.selected) {
                var xpath = apf.xmlToXpath(amlNode.selected);
                htmlNode = apf.xmldb.findHtmlNode(amlNode.selected, amlNode);
                htmlNodeName = "@todo";
                //debugger;
            }
            if (!htmlNode) {
                if (amlNode) {
                    //debugger;
                    htmlNode = amlNode.$ext;
                    htmlNodeName = "$ext";
                }
            }
        }            
        
        //if (htmlNode)
            //debugger;
        // time in ms when action is executed
        var time        = parseInt(new Date().getTime() - apf.uirecorder.startTime);
        var actionObj = {
            time        : time,
            name        : eventName,
            detailList  : {}
        }
        
        if (htmlNode) {
            var pos = apf.getAbsolutePosition(htmlNode, htmlNode.parentNode);
            actionObj.htmlNode = {
                name        : htmlNodeName,
                width       : htmlNode.offsetWidth,
                height      : htmlNode.offsetHeight,
                x           : pos[0],
                y           : pos[1]
            }
        }

        if (htmlElement)    actionObj.htmlElement   = htmlElement;
        if (amlNode)        actionObj.amlNode       = amlNode;
        if (e && e.clientX) actionObj.x             = e.clientX;
        if (e && e.clientY) actionObj.y             = e.clientY;
        if (value)          actionObj.value         = value;

        // collect events before first ui action
        if (apf.uirecorder.actionList.length == 0) {
            // reset all before init
            //apf.uirecorder.detailList = {};
            
            actionObj.name = "init";
            actionObj.detailList = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {};
            apf.uirecorder.actionList.push(actionObj);
            return;
        }
            
                
        // detect first mousemove action in serie
        if ((apf.uirecorder.actionList.length > 1 && eventName == "mousemove" && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name != "mousemove") || apf.uirecorder.actionList.length == 1) {
            apf.uirecorder.firstMousemoveObj = actionObj;
        }
        
        // combine mousedown / mouseup to click
        /*
        if (apf.uirecorder.actionList.length > 1 && eventName == "mouseup" && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name == "mousedown") {
            actionObj.name = "click";
            
            // merge detailList of mousedown with current actionObj
            for (var elementName in apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].detailList) {
                //actionObj.delayTime = actionObj.time;
                actionObj.time = apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].time;

                
                if (!actionObj.detailList) actionObj.detailList = {};
                if (!actionObj.detailList[elementName]) actionObj.detailList[elementName] = {
                    amlNode     : (apf.uirecorder.actionList[apf.uirecorder.actionList.length-1][elementName] && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1][elementName].amlNode) ? apf.uirecorder.actionList[apf.uirecorder.actionList.length-1][elementName].amlNode : null,
                    events      : [],
                    properties  : [],
                    data        : []
                };
    
                actionObj.detailList[elementName].events = actionObj.detailList[elementName].events.concat(apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].detailList[elementName].events);
                actionObj.detailList[elementName].properties = actionObj.detailList[elementName].properties.concat(apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].detailList[elementName].properties);
                actionObj.detailList[elementName].data = actionObj.detailList[elementName].data.concat(apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].detailList[elementName].data);
            }
            // replace mousedown obj with new click obj
            apf.uirecorder.actionList[apf.uirecorder.actionList.length-1] = actionObj;
        }
        
        else 
        */
        var index, delayObj;
        if (apf.uirecorder.actionList.length > 1 && eventName == "mousemove" && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name == "mousemove") {
            for (var elementName in apf.uirecorder.detailList) {
                if (!apf.uirecorder.firstMousemoveObj.detailList) apf.uirecorder.firstMousemoveObj.detailList = {};
                if (!apf.uirecorder.firstMousemoveObj.detailList[elementName]) apf.uirecorder.firstMousemoveObj.detailList[elementName] = {
                    amlNode     : apf.uirecorder.detailList[elementName].amlNode,
                    events      : [],
                    properties  : [],
                    data        : []
                };
    
                apf.uirecorder.firstMousemoveObj.detailList[elementName].events = apf.uirecorder.firstMousemoveObj.detailList[elementName].events.concat(apf.uirecorder.detailList[elementName].events);
                apf.uirecorder.firstMousemoveObj.detailList[elementName].properties = apf.uirecorder.firstMousemoveObj.detailList[elementName].properties.concat(apf.uirecorder.detailList[elementName].properties);
                apf.uirecorder.firstMousemoveObj.detailList[elementName].data = apf.uirecorder.firstMousemoveObj.detailList[elementName].data.concat(apf.uirecorder.detailList[elementName].data);
            }
            apf.uirecorder.detailList = {};
            actionObj.ignore = "true";
            apf.uirecorder.actionList.push(actionObj);

            delayObj = apf.uirecorder.firstMousemoveObj;
            index = apf.uirecorder.firstMousemoveObj.index;
        }
        
        // doubleClick = mousedown, mouseup, mouseup
        else if ( apf.uirecorder.actionList.length > 3 
               && eventName == "dblClick" 
               && apf.uirecorder.actionList[apf.uirecorder.actionList.length-1].name == "mouseup"
               && apf.uirecorder.actionList[apf.uirecorder.actionList.length-2].name == "mouseup"
               && apf.uirecorder.actionList[apf.uirecorder.actionList.length-3].name == "mousedown") {

            actionObj.detailList = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {};

            // merge details from previous 3 actions with current one
            for (var i = apf.uirecorder.actionList.length-1, l = apf.uirecorder.actionList.length-4; i > l ; i--) {
                for (var elementName in apf.uirecorder.actionList[i].detailList) {
                    if (!actionObj.detailList[elementName]) actionObj.detailList[elementName] = {
                        amlNode     : (apf.uirecorder.actionList[i].detailList[elementName] && apf.uirecorder.actionList[i].detailList[elementName].amlNode) ? apf.uirecorder.actionList[i].detailList[elementName].amlNode : null,
                        events      : [],
                        properties  : [],
                        data        : []
                    };
        
                    actionObj.detailList[elementName].events = actionObj.detailList[elementName].events.concat(apf.uirecorder.actionList[i].detailList[elementName].events);
                    actionObj.detailList[elementName].properties = actionObj.detailList[elementName].properties.concat(apf.uirecorder.actionList[i].detailList[elementName].properties);
                    actionObj.detailList[elementName].data = actionObj.detailList[elementName].data.concat(apf.uirecorder.actionList[i].detailList[elementName].data);
                }
            }

            // delete last 3 actions from actionList and actionObjects list
            apf.uirecorder.actionList.splice(apf.uirecorder.actionList.length-3, 3);

            apf.uirecorder.actionList.push(actionObj);

            delayObj = actionObj;
            index = actionObj.index = apf.uirecorder.actionObjects.length;
        }
        else {
            actionObj.detailList = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {};
            apf.uirecorder.actionList.push(actionObj);

            delayObj = actionObj;
            index = actionObj.index = apf.uirecorder.actionObjects.length;
        }
        //actionObj.activeElement = apf.xmlToXpath(apf.activeElement);

        apf.uirecorder.actionObjects.push(actionObj);
        
        //For new timeouts associated with the next action.
        var currentState = apf.uirecorder.current = {};

        //For all the running timeouts
        apf.uirecorder.current.actionObj = delayObj;
        apf.uirecorder.current.index     = index;
        
        // delayed capturing of events
        $setTimeout = function(f, ms){
            //Record current mouseEvent
            if (!ms) ms = 0;
            apf.uirecorder.setTimeout(function(){
                apf.uirecorder.runInContext(currentState, f);
            }, ms);
        }

        /*
         * perform checks
         */
        if (apf.uirecorder.isTesting && eventName != "mousemove") {
            var testId = uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("name");
            var actionIdx = apf.uirecorder.curActionIdx-1;

            if (apf.uirecorder.checkList[testId]
             && apf.uirecorder.checkList[testId][actionIdx]
            ) {
                apf.console.info("check found for test: " + testId + " and action: " + actionIdx);
                var error = "";
                for (var prop in apf.uirecorder.checkList[testId][actionIdx]) {
                    switch (prop) {
                        case "htmlNode":
                            if (!amlNode || (amlNode && amlNode.$getActiveElements && !amlNode.$getActiveElements()[apf.uirecorder.checkList[testId][actionIdx][prop]]) || (apf.uirecorder.checkList[testId][actionIdx][prop] == "$ext" && !amlNode.$ext))
                                apf.uirecorder.setTestResult("error", apf.uirecorder.ERROR_ACTION_WRONG_TARGET, [eventName, apf.uirecorder.checkList[testId][actionIdx][prop]], testId, eventName);
//                                apf.uirecorder.setTestResult("error", apf.uirecorder.ERROR_NODE_NOT_INIT, apf.uirecorder.checkList[testId][actionIdx][prop], testId, eventName);
                            else if (htmlNode && htmlNodeName != apf.uirecorder.checkList[testId][actionIdx][prop]) {
                                apf.uirecorder.setTestResult("error", apf.uirecorder.ERROR_ACTION_WRONG_TARGET, [eventName, apf.uirecorder.checkList[testId][actionIdx][prop]], testId, eventName);
                            } 
                            break;
                    }
                }
            }
        }
    },
    runInContext : function(state, f){
        //Put everything until now on the current action
        //var current = this.current;
        apf.uirecorder.setDelayedDetails(this.current.index);
        
        //Set the new stuff on the past action
        //this.current = state;
        if (typeof f == "string")
            apf.exec(f)
        else
            f();
        apf.uirecorder.setDelayedDetails(state.index);
        //this.current = current;
    },
    setDelayedDetails : function(index) {
        var time        = parseInt(new Date().getTime() - apf.uirecorder.startTime);
        
        // if object is mousemove delayTime is possibly set multiple times, take time with highest number
        if (!apf.uirecorder.actionObjects[index].delayTime || time > apf.uirecorder.actionObjects[index].delayTime)
            apf.uirecorder.actionObjects[index].delayTime = time;
        for (var elementName in apf.uirecorder.detailList) {
            if (!apf.uirecorder.actionObjects[index].detailList) apf.uirecorder.actionObjects[index].detailList = {};
            if (!apf.uirecorder.actionObjects[index].detailList[elementName]) apf.uirecorder.actionObjects[index].detailList[elementName] = {
                amlNode     : (apf.uirecorder.detailList[elementName] && apf.uirecorder.detailList[elementName].amlNode) ? apf.uirecorder.detailList[elementName].amlNode : null,
                events      : [],
                properties  : [],
                data        : []
            };

            apf.uirecorder.actionObjects[index].detailList[elementName].events = apf.uirecorder.actionObjects[index].detailList[elementName].events.concat(apf.uirecorder.detailList[elementName].events);
            apf.uirecorder.actionObjects[index].detailList[elementName].properties = apf.uirecorder.actionObjects[index].detailList[elementName].properties.concat(apf.uirecorder.detailList[elementName].properties);
            apf.uirecorder.actionObjects[index].detailList[elementName].data = apf.uirecorder.actionObjects[index].detailList[elementName].data.concat(apf.uirecorder.detailList[elementName].data);
        }
        
        apf.uirecorder.detailList = {};

        if (apf.activeElement && apf.activeElement.parentNode)
            apf.uirecorder.actionObjects[index].activeElement = apf.xmlToXpath(apf.activeElement);
        //else
            //debugger;
    },
    detailList : {},
    
    capturedEvents : {
        "mouseover" : {}
    },
    mouseoverEvents : ["dragover", "dragout"],
    lastEventObj    : {},
    testEventList   : [],
    captureEvent : function(eventName, e) {
        if (!e || e.noCapture) return; 
        
        var amlNode = e.amlNode || e.currentTarget;
        if (eventName == "movefocus")
            amlNode = e.toElement;
        else if (eventName == "DOMNodeRemoved")
            amlNode = e.relatedNode;
        
        // ignore uir_bar and debugwin
        if ((amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0 && amlNode.id != "uir_bar") || (amlNode && amlNode.localName && amlNode.localName == "debugwin")) return;
                    
        var targetName;
        // aml element
        if (amlNode && (amlNode.parentNode) && amlNode != "uir_bar") {
            targetName = amlNode.id || apf.xmlToXpath(amlNode);
        }
        // html element
        else if (amlNode && amlNode.id == "uir_bar" && e.htmlEvent) {
            var htmlElement = e.htmlEvent.srcElement;
            targetName = ("&lt;" + htmlElement.tagName + "&gt; " + htmlElement.id) || "&lt;" + htmlElement.tagName + "&gt;";
        }
        // apf
        else if (amlNode && amlNode.console && amlNode.extend && amlNode.all) { 
            targetName = "apf";
        }
        
        var time        = parseInt(new Date().getTime() - apf.uirecorder.startTime);
        var eventObj = {
            time        : time,
            name        : eventName,
            //amlNode     : amlNode,
            //xmlNode     : xmlNode,
            event       : e
        }

        if (e.action) {
            if (!eventObj.value) eventObj.value = {};
            eventObj.value.action = e.action;
        }

        var value = null;
        if (["beforeselect", "afterselect"].indexOf(eventName) > -1) {
            targetName = e.selected.id || apf.xmlToXpath(e.selected);
        }
        else if (["dragstart", "dragdrop", "dragover", "dragout"].indexOf(eventName) > -1) {
            var values = [];
            if (e.data.length == 1) {
                targetName = e.data[0].id || apf.xmlToXpath(e.data[0]);
            }
        }
        else if (eventName == "xmlupdate") {
            if (!eventObj.value) eventObj.value = {};
            if (eventObj.value.xml)
                eventObj.value.xml = e.xmlNode.xml.split("<").join("&lt;").split(">").join("&gt;");
            if (eventObj.value.action)
                eventObj.value.action = eventObj.value.action;
                
        }
        else if (eventName == "keydown") {
            
        }

        if (amlNode) {
            //value = apf.serialize(amlNode);
        }

        //if (eventName == "focus" || eventName == "blur") debugger;
        //if (value) 
            //eventObj.value = value;

        if (!targetName) {
            if (amlNode && amlNode.localName)
                targetName = amlNode.id || amlNode.localName
            else
                targetName = "trashbin";
        }
        
        //apf.console.info("event " + eventName + " dispatched on " + targetName);

        if (targetName) {
            if (apf.uirecorder.mouseoverEvents.indexOf(eventName) > -1) {
                if (!apf.uirecorder.capturedEvents.mouseover[targetName]) apf.uirecorder.capturedEvents.mouseover[targetName] = {
                    amlNode     : amlNode,
                    events      : [],
                    properties  : [],
                    data        : []
                };
                // repeating event
                if (!(targetName == apf.uirecorder.lastEventObj.target && eventName == apf.uirecorder.lastEventObj.name) || !apf.uirecorder.capturedEvents.mouseover[targetName].events.length) {
                    apf.uirecorder.capturedEvents.mouseover[targetName].events.push(eventObj);
                }
                else {
                    if (!apf.uirecorder.capturedEvents.mouseover[targetName].events[apf.uirecorder.capturedEvents.mouseover[targetName].events.length-1].calls) 
                        apf.uirecorder.capturedEvents.mouseover[targetName].events[apf.uirecorder.capturedEvents.mouseover[targetName].events.length-1].calls = 1;
                    apf.uirecorder.capturedEvents.mouseover[targetName].events[apf.uirecorder.capturedEvents.mouseover[targetName].events.length-1].calls++;
                }
            }
            else {
                if (!apf.uirecorder.detailList[targetName]) apf.uirecorder.detailList[targetName] = {
                    amlNode     : amlNode,
                    events      : [],
                    properties  : [],
                    data        : []
                };
                
                // repeating event
                if (!(targetName == apf.uirecorder.lastEventObj.target && eventName == apf.uirecorder.lastEventObj.name) || !apf.uirecorder.detailList[targetName].events.length) {
                    apf.uirecorder.detailList[targetName].events.push(eventObj);
                }
                else {
                    if (!apf.uirecorder.detailList[targetName].events[apf.uirecorder.detailList[targetName].events.length-1].calls) 
                        apf.uirecorder.detailList[targetName].events[apf.uirecorder.detailList[targetName].events.length-1].calls = 1;
                    apf.uirecorder.detailList[targetName].events[apf.uirecorder.detailList[targetName].events.length-1].calls++;
                }
            }
            apf.uirecorder.lastEventObj = {
                targetName  : targetName,
                amlNode     : amlNode,
                name        : eventName,
                event       : e
            };
            
            // create event list during playback or testing
            if (apf.uirecorder.isPlaying || apf.uirecorder.isTesting) {
                if (!apf.uirecorder.testEventList[eventName]) apf.uirecorder.testEventList[eventName] = [];
                apf.uirecorder.testEventList[eventName].push(targetName);
                
                /*
                if (!apf.uirecorder.testEventList[targetName]) apf.uirecorder.testEventList[targetName] = [];
                if (apf.uirecorder.testEventList[targetName].indexOf(eventName) == -1)
                    apf.uirecorder.testEventList[targetName].push(eventName);
                */
            }
        }
        else {
            //debugger;
        }
    },
    capturePropertyChange : function(amlNode, prop, value) {
        if (amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0) return;
        if (amlNode) {
            if (!amlNode.parentNode) debugger;
            targetName = amlNode.id || apf.xmlToXpath(amlNode);
        } 
        else 
            debugger;

        if (typeof value == "object" && value.length == 1) 
            value = value[0];
        
        var time        = parseInt(new Date().getTime() - apf.uirecorder.startTime);
        var propObj = {
            time        : time,
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
        if (params.amlNode) {
            if (!params.amlNode.parentNode) debugger;
            targetName = params.amlNode.id || apf.xmlToXpath(params.amlNode);
        }

        var time        = parseInt(new Date().getTime() - apf.uirecorder.startTime);
        var dataObj = {
            time        : time,
            name        : params.action
            //amlNode     : amlNode,
            //xmlNode     : xmlNode,
        }
        if (params.amlNode) {
            if (!dataObj.value) dataObj.value = {};
                dataObj.value.amlNode = apf.serialize(params.amlNode).split("<").join("&lt;").split(">").join("&gt;");
        }
        if (params.xmlNode) {
            if (!dataObj.value) dataObj.value = {};
                dataObj.value.xmlNode = apf.serialize(params.xmlNode).split("<").join("&lt;").split(">").join("&gt;");
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
    save : function(saveType, testName) {
        var id;
        if (saveType == "test") {
            if (!apf.uirecorder.testListXml)
                apf.uirecorder.testListXml = apf.getXml("<testList />");
            id = parseInt(apf.uirecorder.testListXml.childNodes.length) + 1;
        }
        else if (saveType == "results") {
            if (!apf.uirecorder.resultListXml)
                apf.uirecorder.resultListXml = apf.getXml("<resultList />");
            id = parseInt(apf.uirecorder.resultListXml.childNodes.length) + 1;
        }
        
        var testXml = apf.getXml("<test />");
        testXml.setAttribute("file", apf.uirecorder.curTestFile);
        testXml.setAttribute("name", testName || "test" + id);
        testXml.setAttribute("index", apf.uirecorder.testListXml.childNodes.length);
        testXml.setAttribute("status", "@todo status");        

        // reset detailList and activeElement for last mousemove action
        for (var action, i = apf.uirecorder.actionList.length-1; i > 0; i--) {
            action = apf.uirecorder.actionList[i];
            if (action.ignore) {
                continue;
            }
            else if (action.name == "mousemove") {
                delete apf.uirecorder.actionList[i].activeElement;
                apf.uirecorder.actionList[i].detailList = {};
                break;
            }
            else if (action.name != "mousemove") {
                break;
            }
        }

        var detailTypes = {"events": "event", "properties": "property", "data": "dataItem"};
        for (var prevNode, action, aNode, i = 0, l = apf.uirecorder.actionList.length; i < l; i++) {
            action = apf.uirecorder.actionList[i];
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name", action.name);
            aNode.setAttribute("x", action.x);
            aNode.setAttribute("y", action.y);
            aNode.setAttribute("time", action.time);
            aNode.setAttribute("delayTime", action.delayTime);

            if (action.ignore) { 
                aNode.setAttribute("ignore", action.ignore);
                //prevNode.setAttribute("delayTime", action.delayTime);
            }
            else {
                prevNode = aNode;
            }
            if (action.amlNode && action.amlNode.localName != "debugwin") {
                if (action.amlNode.parentNode)
                    aNode.setAttribute("amlNode", action.amlNode.id || apf.xmlToXpath(action.amlNode));
            }
            if (action.htmlNode && action.htmlNode.name) {
                aNode.setAttribute("htmlNode", action.htmlNode.name);
                aNode.setAttribute("width", action.htmlNode.width);
                aNode.setAttribute("height", action.htmlNode.height);
                aNode.setAttribute("absX", action.htmlNode.x);
                aNode.setAttribute("absY", action.htmlNode.y);
            }
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
                    
                    // warning for AML nodes with no id defined
                    //apf.document.selectSingleNode(targetName.substr(8))
                    if (elementName.indexOf("html[") == 0) {
                       apf.uirecorder.setTestResult("warning", apf.uirecorder.WARNING_NO_ID, elementName, testXml.getAttribute("name"))
                    }
                    for (var type in detailTypes) {
                        if (action.detailList[elementName][type].length) {
                            dNode = testXml.ownerDocument.createElement(type)
                            for (var item, vNode, di = 0, dl = action.detailList[elementName][type].length; di < dl; di++) {
                                item = action.detailList[elementName][type][di];
                                iNode = testXml.ownerDocument.createElement(detailTypes[type]);
                                iNode.setAttribute("name", item.name);
                                if (type == "events") {
                                    var caption = item.name;
                                    if (item.calls) {
                                        caption = (item.calls) ? caption + " (" + item.calls+ "x)" : caption;
                                        //caption = (item.value) ? caption + ": " + item.value : caption;
                                   }
                                   iNode.setAttribute("caption", caption || item.name);
                                }

                                // time
                                iNode.setAttribute("time", item.time);
                                
                                if (item.value) {
                                    if (typeof item.value === "string")
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(item.value));
                                    else {
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(apf.serialize(item.value).split("<").join("&lt;").split(">").join("&gt;")))
                                    }
                                }
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
            //apf.uirecorder.createChangesXml(apf.uirecorder.testListXml);
        }
        else if (saveType === "results") {
            apf.uirecorder.resultListXml.appendChild(testXml);
            //apf.uirecorder.createChangesXml(apf.uirecorder.resultListXml);
        }
    },
    
    /**
     * set test error, warning or notice
     */
    setTestResult : function(type, msg, val, testId, action) {
        if (!apf.uirecorder.testResults[type][testId]) apf.uirecorder.testResults[type][testId] = [];

        var found = false;
        var message = msg;
        if (typeof val == "string") {
            message = message.replace("_VAL_", val);
        }
        
        // multiple values in message
        else {
            for (var vi = 0, vl = val.length; vi < vl; vi++) {
                message = message.replace("_VAL_", val[vi]);
            }
        }

        for (var i = 0, l = apf.uirecorder.testResults[type][testId].length; i < l; i++) {
            if (apf.uirecorder.testResults[type][testId][i].message == message) {
                found = true;
                break;
            }
        }

        if (!found)
            apf.uirecorder.testResults[type][testId].push({action: action, message: message});
        if (type == "error") {
            //apf.uirecorder.testResults["error"][testId].push({message: "Test failed"});
            apf.uirecorder.actionList.push({
                name: "Test failed: " + message
            });
            apf.uirecorder.testCheck(true);            
        }
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

