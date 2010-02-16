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
        if (!apf.uirecorder.testListXml) apf.uirecorder.testListXml = apf.getXml('<testList><test file="demo/google/translate/example.xml" name="test1" index="0" status="@todo status"><action name="init" x="1517" y="124" time="110" delayTime=""><element name="apf"><activeElement></activeElement></element><element name="html[1]/body[1]/a:bar[1]"><events><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]"><events><event name="show" caption="show" time="16"/></events></element></action><action name="mousemove" x="1517" y="120" time="125" delayTime="2219"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element></action><action name="mousemove" x="1517" y="119" time="141" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1507" y="119" time="141" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1493" y="119" time="157" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1473" y="119" time="157" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1453" y="119" time="172" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1427" y="116" time="172" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1397" y="110" time="188" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1363" y="106" time="188" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1325" y="102" time="203" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1284" y="100" time="203" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1241" y="100" time="219" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1191" y="100" time="219" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1143" y="101" time="235" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1092" y="102" time="235" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1041" y="102" time="250" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="986" y="104" time="250" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="932" y="105" time="266" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="881" y="105" time="266" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="827" y="105" time="282" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="780" y="105" time="297" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="733" y="100" time="297" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="695" y="92" time="297" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="659" y="86" time="313" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="629" y="83" time="313" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="605" y="80" time="328" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="585" y="80" time="328" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="568" y="80" time="344" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="557" y="79" time="360" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="547" y="76" time="360" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="540" y="73" time="375" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="533" y="72" time="375" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="526" y="68" time="391" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="518" y="66" time="391" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="513" y="63" time="407" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="506" y="62" time="407" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="501" y="60" time="422" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="500" y="60" time="422" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="499" y="59" time="438" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="497" y="59" time="438" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="496" y="59" time="453" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="494" y="59" time="453" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="491" y="58" time="469" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="484" y="58" time="469" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="476" y="56" time="485" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="467" y="53" time="485" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="459" y="52" time="500" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="453" y="51" time="500" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="449" y="49" time="516" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="446" y="48" time="516" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="443" y="46" time="532" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="440" y="43" time="532" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="438" y="43" time="547" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="433" y="41" time="547" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="416" y="36" time="578" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="406" y="34" time="578" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="398" y="34" time="594" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="355" y="25" time="625" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="348" y="25" time="641" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="341" y="24" time="641" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="335" y="24" time="657" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="332" y="24" time="657" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="333" y="24" time="750" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="333" y="22" time="766" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="334" y="22" time="766" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="336" y="22" time="782" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="337" y="22" time="797" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="339" y="22" time="797" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="340" y="22" time="813" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="343" y="22" time="828" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="344" y="22" time="828" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="347" y="22" time="844" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="348" y="21" time="844" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="351" y="21" time="860" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="353" y="21" time="875" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="353" y="16" time="1110" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="353" y="14" time="1110" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="353" y="12" time="1125" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="353" y="11" time="1125" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="353" y="9" time="1157" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="353" y="9" time="1235" delayTime="2235" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]" htmlNode="$minBtn"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><events><event name="DOMFocusOut" caption="DOMFocusOut" time="1219"/><event name="focus" caption="focus" time="1219"/><event name="focus" caption="focus" time="1219"/><event name="focus" caption="focus" time="1219"/><event name="focus" caption="focus" time="1219"/><event name="focus" caption="focus" time="1219"/><event name="focus" caption="focus" time="1219"/><event name="focus" caption="focus" time="1219"/><event name="focus" caption="focus" time="1219"/><event name="movefocus" caption="movefocus" time="1219"/><event name="xforms-focus" caption="xforms-focus" time="1219"/><event name="DOMFocusIn" caption="DOMFocusIn" time="1219"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]"><events><event name="mousedown" caption="mousedown" time="1219"/><event name="mousedown" caption="mousedown" time="1235"/></events></element></action><action name="mouseup" x="353" y="9" time="1313" delayTime="2328" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]" htmlNode="$minBtn"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]"><events><event name="beforestatechange" caption="beforestatechange" time="1313"/><event name="afterstatechange" caption="afterstatechange" time="1328"/></events><properties><property name="state" time="1313">minimized</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><events><event name="blur" caption="blur" time="1313"/><event name="blur" caption="blur" time="1313"/><event name="blur" caption="blur" time="1313"/><event name="blur" caption="blur" time="1313"/><event name="blur" caption="blur" time="1313"/><event name="blur" caption="blur" time="1313"/><event name="blur" caption="blur" time="1313"/><event name="blur" caption="blur" time="1328"/></events></element><element name="trashbin"><events><event name="xforms-next" caption="xforms-next" time="1328"/></events></element></action><action name="mousemove" x="354" y="9" time="1407" delayTime="2782" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element></action><action name="mousemove" x="357" y="9" time="1407" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="358" y="9" time="1422" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="360" y="9" time="1422" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="361" y="9" time="1469" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="363" y="9" time="1516" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="363" y="9" time="1782" delayTime="2782" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]" htmlNode="$maxBtn"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><events><event name="DOMFocusOut" caption="DOMFocusOut" time="1782"/><event name="focus" caption="focus" time="1782"/><event name="focus" caption="focus" time="1782"/><event name="focus" caption="focus" time="1782"/><event name="focus" caption="focus" time="1782"/><event name="focus" caption="focus" time="1782"/><event name="focus" caption="focus" time="1782"/><event name="focus" caption="focus" time="1782"/><event name="focus" caption="focus" time="1782"/><event name="movefocus" caption="movefocus" time="1782"/><event name="xforms-focus" caption="xforms-focus" time="1782"/><event name="DOMFocusIn" caption="DOMFocusIn" time="1782"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]"><events><event name="mousedown" caption="mousedown" time="1782"/><event name="mousedown" caption="mousedown" time="1782"/></events></element></action><action name="mouseup" x="363" y="9" time="1875" delayTime="2891" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]" htmlNode="$maxBtn"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]"><events><event name="beforestatechange" caption="beforestatechange" time="1875"/></events><properties><property name="state" time="1875">maximized</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><events><event name="focus" caption="focus" time="1891"/><event name="focus" caption="focus" time="1891"/><event name="focus" caption="focus" time="1891"/><event name="focus" caption="focus" time="1891"/><event name="focus" caption="focus" time="1891"/><event name="focus" caption="focus" time="1891"/><event name="focus" caption="focus" time="1891"/><event name="focus" caption="focus" time="1891"/><event name="movefocus" caption="movefocus" time="1891"/><event name="xforms-focus" caption="xforms-focus" time="1891"/><event name="DOMFocusIn" caption="DOMFocusIn" time="1891"/></events></element></action><action name="mousemove" x="364" y="9" time="1907" delayTime="3032" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]"><events><event name="afterstatechange" caption="afterstatechange" time="1953"/></events></element></action><action name="mousemove" x="364" y="10" time="1907" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="366" y="10" time="1922" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="367" y="11" time="1922" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="370" y="11" time="1938" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="373" y="13" time="1938" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="374" y="13" time="1953" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="377" y="14" time="1969" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="381" y="15" time="1969" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="383" y="17" time="1969" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="385" y="17" time="1985" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="390" y="17" time="1985" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="394" y="17" time="2000" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="400" y="18" time="2000" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="407" y="21" time="2016" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="414" y="24" time="2016" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="421" y="25" time="2032" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="429" y="28" time="2032" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="438" y="31" time="2047" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="445" y="34" time="2047" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="455" y="37" time="2063" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="463" y="38" time="2063" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="471" y="38" time="2078" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="478" y="38" time="2078" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="485" y="38" time="2094" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="492" y="38" time="2094" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="500" y="38" time="2110" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="510" y="38" time="2110" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="523" y="38" time="2125" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="542" y="38" time="2125" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="564" y="38" time="2141" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="591" y="38" time="2141" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="624" y="38" time="2157" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="659" y="38" time="2157" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="698" y="38" time="2172" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="740" y="38" time="2188" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="787" y="40" time="2188" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="837" y="41" time="2203" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="887" y="41" time="2203" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="935" y="42" time="2219" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="985" y="44" time="2219" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1034" y="44" time="2235" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1081" y="44" time="2235" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1125" y="44" time="2250" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1173" y="44" time="2250" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1217" y="45" time="2266" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1257" y="45" time="2266" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1294" y="45" time="2282" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1327" y="47" time="2282" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1354" y="48" time="2297" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1378" y="48" time="2297" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1401" y="48" time="2313" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1421" y="50" time="2313" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1438" y="50" time="2328" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1453" y="50" time="2328" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1466" y="50" time="2344" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1477" y="51" time="2344" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1489" y="51" time="2360" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1500" y="51" time="2360" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1513" y="51" time="2375" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1523" y="51" time="2375" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1533" y="51" time="2391" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1543" y="51" time="2391" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1553" y="51" time="2407" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1561" y="51" time="2407" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1568" y="49" time="2422" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1574" y="48" time="2422" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1577" y="46" time="2438" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1578" y="46" time="2453" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1580" y="46" time="2469" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1580" y="45" time="2469" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1581" y="43" time="2485" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1581" y="42" time="2500" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1582" y="42" time="2500" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1584" y="42" time="2516" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1584" y="41" time="2516" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1585" y="41" time="2532" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1585" y="39" time="2547" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1585" y="36" time="2563" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1585" y="35" time="2563" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1587" y="34" time="2578" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1587" y="32" time="2578" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1587" y="31" time="2594" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1587" y="29" time="2610" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1588" y="28" time="2610" delayTime="" ignore="true" amlNode="html[1]/undefined[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1588" y="26" time="2625" delayTime="" ignore="true" amlNode="html[1]/undefined[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1588" y="24" time="2625" delayTime="" ignore="true" amlNode="html[1]/undefined[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1588" y="22" time="2641" delayTime="" ignore="true" amlNode="html[1]/undefined[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1588" y="21" time="2641" delayTime="" ignore="true" amlNode="html[1]/undefined[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1586" y="19" time="2657" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1583" y="18" time="2657" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1583" y="16" time="2672" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1582" y="14" time="2672" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1581" y="12" time="2688" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1579" y="11" time="2688" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1578" y="9" time="2703" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1576" y="8" time="2719" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1575" y="8" time="2719" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1573" y="8" time="2907" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="1573" y="8" time="3016" delayTime="3047" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]" htmlNode="$closeBtn"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]"><events><event name="mousedown" caption="mousedown" time="3016"/><event name="mousedown" caption="mousedown" time="3016"/></events></element></action><action name="mouseup" x="1573" y="8" time="3110" delayTime="3125" amlNode="html[1]/body[1]/a:bar[1]/a:window[1]" htmlNode="$closeBtn"><element name="apf"><activeElement>html[1]/body[1]/a:window[1]/a:bar[1]/a:dropdown[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]"><events><event name="beforestatechange" caption="beforestatechange" time="3110"/><event name="close" caption="close" time="3110"/><event name="prop.visible" caption="prop.visible" time="3110"/><event name="afterstatechange" caption="afterstatechange" time="3110"/></events><properties><property name="state" time="3110">maximized|closed</property><property name="visible" time="3110"/></properties></element><element name="html[1]/body[1]/a:bar[1]/a:window[1]/a:table[1]/a:textbox[1]"><events><event name="blur" caption="blur" time="3110"/><event name="blur" caption="blur" time="3110"/><event name="blur" caption="blur" time="3110"/><event name="blur" caption="blur" time="3110"/><event name="blur" caption="blur" time="3110"/><event name="blur" caption="blur" time="3110"/><event name="blur" caption="blur" time="3110"/><event name="blur" caption="blur" time="3110"/></events></element><element name="trashbin"><events><event name="xforms-previous" caption="xforms-previous" time="3110"/></events></element></action><action name="mousemove" x="1573" y="10" time="3313" delayTime="3782"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1573" y="15" time="3313" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1574" y="17" time="3313" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1574" y="20" time="3328" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1575" y="23" time="3344" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1575" y="24" time="3344" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1577" y="25" time="3360" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1577" y="28" time="3375" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1578" y="30" time="3375" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1580" y="31" time="3391" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1580" y="33" time="3391" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1581" y="34" time="3407" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1581" y="35" time="3407" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1582" y="38" time="3422" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1584" y="40" time="3422" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1587" y="42" time="3438" delayTime="" ignore="true" amlNode="html[1]/body[1]/a:bar[1]"><element name="apf"><activeElement></activeElement></element></action></test></testList> ');
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
        apf.console.info("playAction: " + apf.uirecorder.curActionIdx);
        var test = apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")];
        var action = test.childNodes[apf.uirecorder.curActionIdx];
        //var elapsedTime = 0;
        
        // realtime movement
        if (uir_ddRealtime.value == "realtime") {
            if (apf.uirecorder.timeoutTimer) {
                clearTimeout(apf.uirecorder.timeoutTimer);
                //apf.console.info("overwriting intvalTimer");
            }
            
            var timeout = action.getAttribute("time")-(new Date().getTime() - apf.uirecorder.startTime + apf.uirecorder.testDelay);
            if (timeout > 0) {
                apf.uirecorder.timeoutTimer = setTimeout(function() {
                    //if (apf.uirecorder.curTestIdx != null && apf.uirecorder.curActionIdx != null) {
                        //var test = apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")];
                        //var action = test.childNodes[apf.uirecorder.curActionIdx];
                        
                        //elapsedTime = new Date().getTime() - apf.uirecorder.startTime;
                        //if (action.getAttribute("time") <= elapsedTime - apf.uirecorder.testDelay) {
                            //clearInterval(apf.uirecorder.intvalTimer);
                            //apf.uirecorder.intvalTimer = null;
                            apf.console.info("playAction (timeout)");
                            
                            apf.uirecorder.execAction();
                            //if (test.childNodes.length == apf.uirecorder.curActionIdx+1)
                                //debugger;
                        //}
                    //}
                }, timeout);
            }
            else {
                apf.console.info("playAction (!timeout)");
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
        "beforeload": "afterload"
    },
    beforeDelay : 0,
    execAction : function() {
        //apf.console.info("execAction: " + apf.uirecorder.curActionIdx);
        var test = apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")];
        var action = test.childNodes[apf.uirecorder.curActionIdx];

        o3.mouseTo(
            parseInt(action.getAttribute("x")) + hostWnd.clientX, 
            parseInt(action.getAttribute("y")) + hostWnd.clientY, 
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

        // check if last action matches with recorded action
        if (action.getAttribute("htmlNode")) {
            // needed htmlNode isn't initialized in amlNode
            if (!apf.document.selectSingleNode(action.getAttribute("amlNode").substr(8)).$getActiveElements()[action.getAttribute("htmlNode")]) {
                debugger;
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

                                var amlNode = apf.document.selectSingleNode(targetName.substr(8));
                                if (!amlNode) debugger;
                                
                                // event already triggered, continue test
                                if (apf.uirecorder.testEventList[targetName] && apf.uirecorder.testEventList[targetName].indexOf(apf.uirecorder.checkEvents[ce]) > -1) {
                                    apf.console.info("event " + apf.uirecorder.checkEvents[ce] + " already called on " + targetName);
                                    apf.uirecorder.testEventList[targetName].splice(apf.uirecorder.testEventList[targetName].indexOf(apf.uirecorder.checkEvents[ce]), 1);
                                    apf.uirecorder.testCheck(apf.uirecorder.saveResults);
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
        apf.console.info("event fired: " + e.name);
        
        apf.console.info("testCheck (waitForEvent): " + apf.uirecorder.curActionIdx);
        apf.uirecorder.testCheck(apf.uirecorder.saveResults);
        apf.uirecorder.testdelay += new Date().getTime() - apf.uirecorder.beforeDelay;
        
        // @todo temp solution for multiple beforeload/afterload checks
        //return;
    },
    testCheck : function() {
        var test = apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")];
        var action = test.childNodes[apf.uirecorder.curActionIdx];

        // play next action
        if (test.childNodes.length > apf.uirecorder.curActionIdx+1) {
            apf.uirecorder.curActionIdx++;
            apf.console.info("playAction (testCheck): test.childNodes.length = " + test.childNodes.length + " apf.uirecorder.curActionIdx+1 = " + apf.uirecorder.curActionIdx+1);
            apf.uirecorder.playAction();
        }
        else {
            apf.uirecorder.stop();
                
            // save test results
            if (apf.uirecorder.saveResults) {
                apf.uirecorder.save("results", test.getAttribute("name"));
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
                //debugger;
                // clear interval
                if (apf.uirecorder.intvalTimer) {
                    window.clearInterval(apf.uirecorder.intvalTimer);
                    apf.uirecorder.intvalTimer = null;
                }
                
                apf.uirecorder.curTestIdx = null;
                apf.uirecorder.curActionIdx = null;
                if (apf.uirecorder.saveResults && uir_cbShowChanges.checked) {
                    uir_mdlTests.load(apf.uirecorder.testListXml.xml);
                    uir_mdlChanges2.load(apf.uirecorder.resultListXml.xml);
                    uir_windowChanges.setProperty("visible", true);
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
            //apf.uirecorder.checkResults();
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
    captureAction : function(eventName, e, value) {
        var htmlElement = (e) ? e.srcElement || e.target : null;
        var amlNode     = (htmlElement && apf.findHost(htmlElement)) ? apf.findHost(htmlElement) : null;

        // ignore interaction with uirecorder controls
        if (amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0 && amlNode.id != "uir_bar") {
            return;
        }
        
        // search for related htmlNode
        if (eventName != "mousemove") {
            var htmlNode;
            
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
                            htmlNode = name;
                            break;
                        }
                    }
                }
            }

            // is multiselect widget
            // @todo generate name for multiselect htmlNode item
            if (amlNode.hasFeature(apf.__MULTISELECT__) && amlNode.selected) {
                var xpath = apf.xmlToXpath(amlNode.selected);
                htmlNode = apf.xmldb.findHtmlNode(amlNode.selected, amlNode);
                debugger;
            }
            if (!htmlNode) {
                debugger;
                htmlNode = "$ext";
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
        
        if (htmlElement)    actionObj.htmlElement   = htmlElement;
        if (htmlNode)       actionObj.htmlNode      = htmlNode;
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
            targetName = apf.xmlToXpath(amlNode);
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
            targetName = apf.xmlToXpath(e.selected);
        }
        else if (["dragstart", "dragdrop", "dragover", "dragout"].indexOf(eventName) > -1) {
            var values = [];
            if (e.data.length == 1) {
                targetName = apf.xmlToXpath(e.data[0]);
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
                targetName = amlNode.localName
            else
                targetName = "trashbin";
        }
        
        apf.console.info("event " + eventName + " dispatched on " + targetName);

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
            targetName = apf.xmlToXpath(amlNode);
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
            targetName = apf.xmlToXpath(params.amlNode);
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
                    aNode.setAttribute("amlNode", apf.xmlToXpath(action.amlNode));
            }
            if (action.htmlNode) {
                aNode.setAttribute("htmlNode", action.htmlNode);
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
     * check test results 
     */
    checkResults : function() {
        // loop through testListXml
        // for each detail check if it exist in resultListXml
            // check if value is the same
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

