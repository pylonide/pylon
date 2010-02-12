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
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;
            //apf.uirecorder.captureAction("keypress", e, e.keyCode);
        }
        
        document.documentElement.onkeydown = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;

            var validKeys = [37, 38, 39, 40, 27]; // arrowkeys, esc

            var keycode = (e.keyCode) ? e.keyCode : e.which;

            if (validKeys.indexOf(keycode) == -1) return;

            if (e.shiftKey) keycode = "[SHIFT]" + keycode;
            if (e.altKey)   keycode = "[ALT]" + keycode;
            if (e.ctrlKey)  keycode = "[CTRL]" + keycode;
            apf.uirecorder.captureAction("keypress", e, keycode);
        }
        
        document.documentElement.onkeypress = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;

            var character = "";
            if (e.keyCode) { // Internet Explorer
                character = String.fromCharCode(e.keyCode);
            } else if (e.which) { // W3C
                character = String.fromCharCode(e.which);
            }

            if (e.shiftKey) character = "[SHIFT]" + character;
            if (e.altKey)   character = "[ALT]" + character;
            if (e.ctrlKey)  character = "[CTRL]" + character;
            apf.uirecorder.captureAction("keypress", e, character);
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
        if (!apf.uirecorder.testListXml) apf.uirecorder.testListXml = apf.getXml('<testList><test file="demo/elements/actiontracker/example.xml" name="test1" index="0" status="@todo status"><action name="init" x="616" y="502" time="0" delayTime=""><element name="apf"><activeElement></activeElement></element><element name="html[1]/body[1]/a:bar[1]"><events><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/><event name="DOMNodeRemoved" caption="DOMNodeRemoved" time="0"/></events></element></action><action name="mousemove" x="577" y="522" time="15" delayTime="2187"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:datagrid[1]</activeElement></element></action><action name="mousemove" x="501" y="556" time="31" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="468" y="568" time="31" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="438" y="580" time="46" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="411" y="593" time="46" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="389" y="604" time="62" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="372" y="610" time="62" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="360" y="611" time="78" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="349" y="617" time="78" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="349" y="621" time="93" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="349" y="622" time="171" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="349" y="625" time="328" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="349" y="621" time="343" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="349" y="616" time="359" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="349" y="609" time="359" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="347" y="601" time="375" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="343" y="591" time="375" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="339" y="581" time="390" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="333" y="567" time="390" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="328" y="552" time="406" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="313" y="514" time="421" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="306" y="494" time="421" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="299" y="473" time="437" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="291" y="450" time="437" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="279" y="430" time="453" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="267" y="410" time="453" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="255" y="393" time="468" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="242" y="376" time="468" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="231" y="361" time="484" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="220" y="346" time="484" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="213" y="332" time="500" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="204" y="315" time="500" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="197" y="301" time="515" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="191" y="285" time="515" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="186" y="270" time="531" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="178" y="257" time="531" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="174" y="244" time="546" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="170" y="234" time="546" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="167" y="226" time="562" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="164" y="219" time="562" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="161" y="210" time="578" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="160" y="202" time="578" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="157" y="195" time="593" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="156" y="186" time="609" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="154" y="179" time="609" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="152" y="172" time="625" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="150" y="163" time="625" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="149" y="156" time="640" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="147" y="151" time="640" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="146" y="145" time="656" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="144" y="138" time="656" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="144" y="132" time="671" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="142" y="121" time="703" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="140" y="116" time="703" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="140" y="112" time="703" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="139" y="109" time="750" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="137" y="99" time="750" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="133" y="88" time="765" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="130" y="87" time="781" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="129" y="85" time="781" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="129" y="84" time="796" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="127" y="82" time="796" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="126" y="81" time="812" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="123" y="80" time="812" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="120" y="77" time="828" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="117" y="74" time="828" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="113" y="71" time="843" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="109" y="67" time="843" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="105" y="64" time="859" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="100" y="60" time="859" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="98" y="58" time="875" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="93" y="55" time="875" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="89" y="54" time="890" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="86" y="53" time="890" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="83" y="51" time="906" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="82" y="51" time="906" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="81" y="51" time="937" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="81" y="50" time="953" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="79" y="50" time="953" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="78" y="48" time="968" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="76" y="47" time="968" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="75" y="45" time="984" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="73" y="45" time="984" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="72" y="44" time="1000" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="71" y="43" time="1000" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="69" y="41" time="1015" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="66" y="40" time="1015" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="66" y="38" time="1031" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="65" y="38" time="1062" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="65" y="37" time="1125" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="65" y="36" time="1125" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="65" y="36" time="1187" delayTime="2187" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:datagrid[1]</activeElement></element><element name="data[1]/element[1]"><events><event name="beforeselect" caption="beforeselect" time="1187"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="DOMFocusOut" caption="DOMFocusOut" time="1187"/><event name="focus" caption="focus" time="1187"/><event name="focus" caption="focus" time="1187"/><event name="focus" caption="focus" time="1187"/><event name="focus" caption="focus" time="1187"/><event name="focus" caption="focus" time="1187"/><event name="focus" caption="focus" time="1187"/><event name="movefocus" caption="movefocus" time="1187"/><event name="xforms-focus" caption="xforms-focus" time="1187"/><event name="DOMFocusIn" caption="DOMFocusIn" time="1187"/><event name="mousedown" caption="mousedown" time="1187"/></events></element></action><action name="mouseup" x="65" y="36" time="1296" delayTime="" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="63" y="36" time="1343" delayTime="2828" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:datagrid[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="prop.caret" caption="prop.caret" time="1843"/></events><properties><property name="selection" time="1843">apf.xmldb.getXml("&lt;element caption1=\"Text 21\" caption2=\"Text22\"&gt;&lt;/element&gt;")</property></properties></element><element name="data[1]/element[2]"><events><event name="afterselect" caption="afterselect" time="1843"/></events></element></action><action name="mousemove" x="62" y="36" time="1359" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="62" y="37" time="1468" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="61" y="37" time="1500" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="61" y="39" time="1515" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="61" y="40" time="1546" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="61" y="42" time="1562" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="59" y="43" time="1578" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="59" y="44" time="1593" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="59" y="46" time="1593" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="58" y="47" time="1609" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="58" y="49" time="1640" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="58" y="49" time="1828" delayTime="2843" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:datagrid[1]</activeElement></element><element name="data[1]/element[2]"><events><event name="beforeselect" caption="beforeselect" time="1828"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="mousedown" caption="mousedown" time="1828"/></events></element></action><action name="mouseup" x="58" y="49" time="1937" delayTime="2000" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:datagrid[1]</activeElement></element></action><action name="mousemove" x="58" y="50" time="2031" delayTime="3984" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]</activeElement></element></action><action name="mousemove" x="56" y="52" time="2046" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="56" y="52" time="2046" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="56" y="52" time="2046" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="55" y="53" time="2046" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="54" y="54" time="2062" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="54" y="56" time="2062" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="52" y="57" time="2078" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="52" y="59" time="2093" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="51" y="60" time="2093" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="51" y="62" time="2109" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="51" y="62" time="2109" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="51" y="62" time="2109" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="49" y="63" time="2109" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="48" y="66" time="2125" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="48" y="66" time="2125" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="48" y="69" time="2125" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="46" y="71" time="2125" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="46" y="74" time="2140" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="46" y="74" time="2140" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="46" y="79" time="2156" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="80" time="2156" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="83" time="2171" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="86" time="2171" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="90" time="2187" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="91" time="2187" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="94" time="2203" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="96" time="2203" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="97" time="2218" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="98" time="2218" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="100" time="2234" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="100" time="2250" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="97" time="2468" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="91" time="2484" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="85" time="2484" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="80" time="2500" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="74" time="2500" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="71" time="2515" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="67" time="2515" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="65" time="2531" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="47" y="64" time="2687" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="46" y="63" time="2703" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="46" y="61" time="2718" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="45" y="60" time="2718" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="44" y="58" time="2734" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="44" y="57" time="2750" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="42" y="55" time="2765" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="42" y="54" time="2765" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="41" y="51" time="2781" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="41" y="50" time="2812" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="39" y="48" time="2843" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="39" y="47" time="2859" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="39" y="45" time="2859" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="39" y="45" time="2937" delayTime="3984" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]</activeElement></element><element name="data[1]/element[2]"><events><event name="beforeselect" caption="beforeselect" time="2937"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="mousedown" caption="mousedown" time="2937"/></events></element></action><action name="mouseup" x="39" y="45" time="3046" delayTime="" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mouseup" x="39" y="45" time="3203" delayTime="4203" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]</activeElement></element></action><action name="mousemove" x="38" y="45" time="3296" delayTime="4734" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="beforechoose" caption="beforechoose" time="3203"/><event name="afterchoose" caption="afterchoose" time="3203"/></events><properties><property name="chosen" time="3203">apf.xmldb.getXml("&lt;element caption1=\"Text 21\" caption2=\"Text22\"&gt;&lt;/element&gt;")</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><events><event name="mouseover" caption="mouseover" time="3468"/></events></element></action><action name="mousemove" x="38" y="49" time="3312" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="38" y="53" time="3312" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="36" y="57" time="3328" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="36" y="63" time="3343" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="36" y="67" time="3343" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="36" y="73" time="3359" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="36" y="77" time="3359" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="37" y="81" time="3375" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="37" y="86" time="3375" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="38" y="88" time="3390" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="40" y="93" time="3390" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="40" y="96" time="3406" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="40" y="98" time="3406" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="41" y="100" time="3421" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="41" y="103" time="3453" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="41" y="108" time="3453" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="41" y="110" time="3453" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="43" y="113" time="3468" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="43" y="115" time="3500" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="43" y="117" time="3515" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="43" y="118" time="3625" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="43" y="120" time="3640" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="43" y="120" time="3734" delayTime="4906" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><events><event name="mousedown" caption="mousedown" time="3734"/><event name="DOMFocusOut" caption="DOMFocusOut" time="3734"/><event name="focus" caption="focus" time="3734"/><event name="focus" caption="focus" time="3734"/><event name="focus" caption="focus" time="3734"/><event name="focus" caption="focus" time="3734"/><event name="focus" caption="focus" time="3734"/><event name="focus" caption="focus" time="3734"/><event name="focus" caption="focus" time="3734"/><event name="movefocus" caption="movefocus" time="3750"/><event name="xforms-focus" caption="xforms-focus" time="3750"/><event name="DOMFocusIn" caption="DOMFocusIn" time="3750"/><event name="mousedown" caption="mousedown" time="3750"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="blur" caption="blur" time="3734"/><event name="blur" caption="blur" time="3734"/><event name="blur" caption="blur" time="3734"/><event name="blur" caption="blur" time="3734"/><event name="blur" caption="blur" time="3734"/><event name="blur" caption="blur" time="3734"/><event name="prop.caret" caption="prop.caret" time="3921"/></events><properties><property name="selection" time="3921">apf.xmldb.getXml("&lt;element caption1=\"Text 1\" caption2=\"Text2\"&gt;&lt;/element&gt;")</property></properties></element><element name="data[1]/element[1]"><events><event name="beforeselect" caption="beforeselect" time="3921"/><event name="afterselect" caption="afterselect" time="3921"/></events></element></action><action name="mouseup" x="43" y="120" time="3906" delayTime="" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><events><event name="mouseup" caption="mouseup" time="3828"/><event name="click" caption="click" time="3906"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="beforeremove" caption="beforeremove" time="3828">{"action": "multicall"}</event><event name="beforechange" caption="beforechange" time="3828">{"action": "multicall"}</event><event name="xmlupdate" caption="xmlupdate" time="3875">{"action": "remove"}</event><event name="xmlupdate" caption="xmlupdate" time="3890">{"action": "redo-remove"}</event><event name="afterremove" caption="afterremove" time="3906">{"action": "multicall"}</event></events><properties><property name="length" time="3875">1</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]/a:model[1]"><data><dataItem name="remove" time="3828">{"amlNode": "apf.xmldb.getXml(\"&lt;a:model xmlns:a=\\\"http://ajax.org/2005/aml\\\"/&gt;\")", "xmlNode": "apf.xmldb.getXml(\"&lt;element caption1=\\\"Text 21\\\" caption2=\\\"Text22\\\"&gt;&lt;/element&gt;\")"}</dataItem><dataItem name="redo-remove" time="3875">{"amlNode": "apf.xmldb.getXml(\"&lt;a:model xmlns:a=\\\"http://ajax.org/2005/aml\\\"/&gt;\")", "xmlNode": "apf.xmldb.getXml(\"&lt;element caption1=\\\"Text 21\\\" caption2=\\\"Text22\\\"&gt;&lt;/element&gt;\")"}</dataItem></data></element><element name="html[1]/body[1]/a:bar[1]/a:actiontracker[1]"><events><event name="prop.undolength" caption="prop.undolength" time="3906"/><event name="prop.redolength" caption="prop.redolength" time="3906"/><event name="afterchange" caption="afterchange" time="3906">{"action": "do"}</event></events><properties><property name="undolength" time="3890">1</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><events><event name="xforms-enabled" caption="xforms-enabled" time="3890"/><event name="xforms-readwrite" caption="xforms-readwrite" time="3890"/></events><properties><property name="disabled" time="3890"/></properties></element></action><action name="mousemove" x="70" y="121" time="3906" delayTime="5281" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><events><event name="mouseout" caption="mouseout" time="3921"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><events><event name="mouseover" caption="mouseover" time="3953"/></events></element></action><action name="mousemove" x="75" y="121" time="3906" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="81" y="124" time="3953" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="92" y="125" time="3953" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="101" y="127" time="3984" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="105" y="127" time="3984" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="108" y="127" time="4000" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="111" y="127" time="4000" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="112" y="127" time="4015" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="115" y="127" time="4015" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="116" y="127" time="4031" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="118" y="127" time="4031" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="118" y="127" time="4281" delayTime="5390" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><events><event name="mousedown" caption="mousedown" time="4281"/><event name="DOMFocusOut" caption="DOMFocusOut" time="4281"/><event name="focus" caption="focus" time="4281"/><event name="focus" caption="focus" time="4281"/><event name="focus" caption="focus" time="4281"/><event name="focus" caption="focus" time="4281"/><event name="focus" caption="focus" time="4281"/><event name="focus" caption="focus" time="4281"/><event name="focus" caption="focus" time="4296"/><event name="movefocus" caption="movefocus" time="4296"/><event name="xforms-focus" caption="xforms-focus" time="4296"/><event name="DOMFocusIn" caption="DOMFocusIn" time="4296"/><event name="mousedown" caption="mousedown" time="4296"/><event name="blur" caption="blur" time="4406"/><event name="blur" caption="blur" time="4406"/><event name="blur" caption="blur" time="4406"/><event name="blur" caption="blur" time="4406"/><event name="blur" caption="blur" time="4406"/><event name="blur" caption="blur" time="4406"/><event name="blur" caption="blur" time="4406"/><event name="xforms-disabled" caption="xforms-disabled" time="4421"/><event name="xforms-readonly" caption="xforms-readonly" time="4421"/></events><properties><property name="disabled" time="4406">true</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><events><event name="blur" caption="blur" time="4281"/><event name="blur" caption="blur" time="4281"/><event name="blur" caption="blur" time="4281"/><event name="blur" caption="blur" time="4281"/><event name="blur" caption="blur" time="4281"/><event name="blur" caption="blur" time="4281"/><event name="blur" caption="blur" time="4281"/><event name="DOMFocusOut" caption="DOMFocusOut" time="4406"/><event name="focus" caption="focus" time="4406"/><event name="focus" caption="focus" time="4406"/><event name="focus" caption="focus" time="4406"/><event name="focus" caption="focus" time="4406"/><event name="focus" caption="focus" time="4406"/><event name="focus" caption="focus" time="4421"/><event name="focus" caption="focus" time="4421"/><event name="movefocus" caption="movefocus" time="4421"/><event name="xforms-focus" caption="xforms-focus" time="4421"/><event name="DOMFocusIn" caption="DOMFocusIn" time="4421"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:actiontracker[1]"><events><event name="beforechange" caption="beforechange" time="4406"/><event name="prop.undolength" caption="prop.undolength" time="4421"/><event name="prop.redolength" caption="prop.redolength" time="4421"/><event name="afterchange" caption="afterchange" time="4421">{"action": "undo"}</event></events><properties><property name="undolength" time="4406"/><property name="redolength" time="4421">1</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]/a:model[1]"><data><dataItem name="add" time="4406">{"amlNode": "apf.xmldb.getXml(\"&lt;a:model xmlns:a=\\\"http://ajax.org/2005/aml\\\"/&gt;\")", "xmlNode": "apf.xmldb.getXml(\"&lt;element caption1=\\\"Text 21\\\" caption2=\\\"Text22\\\"&gt;&lt;/element&gt;\")"}</dataItem></data></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="xmlupdate" caption="xmlupdate" time="4406">{"action": "add"}</event></events><properties><property name="length" time="4406">2</property></properties></element><element name="trashbin"><events><event name="xforms-previous" caption="xforms-previous" time="4421"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><events><event name="xforms-enabled" caption="xforms-enabled" time="4421"/><event name="xforms-readwrite" caption="xforms-readwrite" time="4421"/></events><properties><property name="disabled" time="4421"/></properties></element></action><action name="mouseup" x="118" y="127" time="4390" delayTime="5421" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><events><event name="mouseup" caption="mouseup" time="4390"/><event name="click" caption="click" time="4390"/></events></element></action><action name="mousemove" x="121" y="127" time="4437" delayTime="6093" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><events><event name="mouseover" caption="mouseover" time="4562"/></events></element></action><action name="mousemove" x="125" y="127" time="4437" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="128" y="127" time="4437" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="131" y="127" time="4453" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="135" y="127" time="4453" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="139" y="127" time="4468" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="142" y="127" time="4468" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="143" y="127" time="4484" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="145" y="127" time="4484" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="148" y="127" time="4500" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="149" y="127" time="4500" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="151" y="127" time="4515" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="152" y="127" time="4515" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="153" y="127" time="4531" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="156" y="126" time="4531" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="158" y="126" time="4546" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="162" y="125" time="4546" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="168" y="125" time="4562" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="176" y="125" time="4578" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="183" y="125" time="4578" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="192" y="125" time="4593" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="200" y="125" time="4593" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="207" y="125" time="4609" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="214" y="125" time="4609" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="222" y="125" time="4625" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="224" y="125" time="4625" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="226" y="125" time="4640" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="225" y="125" time="4953" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="224" y="125" time="4953" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="221" y="125" time="4968" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="220" y="125" time="4968" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="218" y="125" time="4984" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="215" y="125" time="4984" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="213" y="125" time="5000" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="210" y="125" time="5000" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="205" y="125" time="5015" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="203" y="124" time="5015" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="201" y="124" time="5031" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="200" y="124" time="5031" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="200" y="124" time="5093" delayTime="6203" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><events><event name="mousedown" caption="mousedown" time="5093"/><event name="DOMFocusOut" caption="DOMFocusOut" time="5109"/><event name="focus" caption="focus" time="5109"/><event name="focus" caption="focus" time="5109"/><event name="focus" caption="focus" time="5109"/><event name="focus" caption="focus" time="5109"/><event name="focus" caption="focus" time="5109"/><event name="focus" caption="focus" time="5109"/><event name="focus" caption="focus" time="5109"/><event name="movefocus" caption="movefocus" time="5109"/><event name="xforms-focus" caption="xforms-focus" time="5109"/><event name="DOMFocusIn" caption="DOMFocusIn" time="5109"/><event name="mousedown" caption="mousedown" time="5109"/><event name="blur" caption="blur" time="5218"/><event name="blur" caption="blur" time="5218"/><event name="blur" caption="blur" time="5218"/><event name="blur" caption="blur" time="5218"/><event name="blur" caption="blur" time="5218"/><event name="blur" caption="blur" time="5218"/><event name="blur" caption="blur" time="5218"/><event name="xforms-disabled" caption="xforms-disabled" time="5234"/><event name="xforms-readonly" caption="xforms-readonly" time="5234"/></events><properties><property name="disabled" time="5218">true</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><events><event name="blur" caption="blur" time="5109"/><event name="blur" caption="blur" time="5109"/><event name="blur" caption="blur" time="5109"/><event name="blur" caption="blur" time="5109"/><event name="blur" caption="blur" time="5109"/><event name="blur" caption="blur" time="5109"/><event name="blur" caption="blur" time="5109"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:actiontracker[1]"><events><event name="beforechange" caption="beforechange" time="5218"/><event name="prop.undolength" caption="prop.undolength" time="5218"/><event name="prop.redolength" caption="prop.redolength" time="5234"/><event name="afterchange" caption="afterchange" time="5234">{"action": "redo"}</event></events><properties><property name="undolength" time="5218">1</property><property name="redolength" time="5218"/></properties></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]/a:model[1]"><data><dataItem name="remove" time="5218">{"amlNode": "apf.xmldb.getXml(\"&lt;a:model xmlns:a=\\\"http://ajax.org/2005/aml\\\"/&gt;\")", "xmlNode": "apf.xmldb.getXml(\"&lt;element caption1=\\\"Text 21\\\" caption2=\\\"Text22\\\"&gt;&lt;/element&gt;\")"}</dataItem><dataItem name="redo-remove" time="5218">{"amlNode": "apf.xmldb.getXml(\"&lt;a:model xmlns:a=\\\"http://ajax.org/2005/aml\\\"/&gt;\")", "xmlNode": "apf.xmldb.getXml(\"&lt;element caption1=\\\"Text 21\\\" caption2=\\\"Text22\\\"&gt;&lt;/element&gt;\")"}</dataItem></data></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="xmlupdate" caption="xmlupdate" time="5218">{"action": "remove"}</event><event name="xmlupdate" caption="xmlupdate" time="5218">{"action": "redo-remove"}</event></events><properties><property name="length" time="5218">1</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><events><event name="xforms-enabled" caption="xforms-enabled" time="5218"/><event name="xforms-readwrite" caption="xforms-readwrite" time="5218"/><event name="DOMFocusOut" caption="DOMFocusOut" time="5218"/><event name="focus" caption="focus" time="5218"/><event name="focus" caption="focus" time="5218"/><event name="focus" caption="focus" time="5218"/><event name="focus" caption="focus" time="5218"/><event name="focus" caption="focus" time="5234"/><event name="focus" caption="focus" time="5234"/><event name="focus" caption="focus" time="5234"/><event name="movefocus" caption="movefocus" time="5234"/><event name="xforms-focus" caption="xforms-focus" time="5234"/><event name="DOMFocusIn" caption="DOMFocusIn" time="5234"/></events><properties><property name="disabled" time="5218"/></properties></element><element name="trashbin"><events><event name="xforms-previous" caption="xforms-previous" time="5234"/></events></element></action><action name="mouseup" x="200" y="124" time="5203" delayTime="6234" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><events><event name="mouseup" caption="mouseup" time="5203"/><event name="click" caption="click" time="5203"/></events></element></action><action name="mouseup" x="200" y="124" time="5609" delayTime="" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="198" y="124" time="5656" delayTime="6984" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]</activeElement></element></action><action name="mousemove" x="197" y="124" time="5671" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="196" y="124" time="5703" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="194" y="124" time="5703" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="193" y="125" time="5718" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="191" y="125" time="5750" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="191" y="127" time="5765" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="190" y="127" time="5781" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="188" y="127" time="5796" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="186" y="128" time="5796" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="184" y="128" time="5812" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="180" y="128" time="5812" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="176" y="128" time="5828" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="170" y="130" time="5828" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="167" y="130" time="5843" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="163" y="130" time="5875" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="147" y="130" time="5875" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="132" y="131" time="5906" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="132" y="131" time="5984" delayTime="7093" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><events><event name="mousedown" caption="mousedown" time="5984"/><event name="mousedown" caption="mousedown" time="5984"/><event name="blur" caption="blur" time="6109"/><event name="blur" caption="blur" time="6109"/><event name="blur" caption="blur" time="6109"/><event name="blur" caption="blur" time="6109"/><event name="blur" caption="blur" time="6109"/><event name="blur" caption="blur" time="6109"/><event name="blur" caption="blur" time="6109"/><event name="xforms-disabled" caption="xforms-disabled" time="6109"/><event name="xforms-readonly" caption="xforms-readonly" time="6109"/></events><properties><property name="disabled" time="6109">true</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:actiontracker[1]"><events><event name="beforechange" caption="beforechange" time="6109"/><event name="prop.undolength" caption="prop.undolength" time="6125"/><event name="prop.redolength" caption="prop.redolength" time="6125"/><event name="afterchange" caption="afterchange" time="6125">{"action": "undo"}</event></events><properties><property name="undolength" time="6109"/><property name="redolength" time="6125">1</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]/a:model[1]"><data><dataItem name="add" time="6109">{"amlNode": "apf.xmldb.getXml(\"&lt;a:model xmlns:a=\\\"http://ajax.org/2005/aml\\\"/&gt;\")", "xmlNode": "apf.xmldb.getXml(\"&lt;element caption1=\\\"Text 21\\\" caption2=\\\"Text22\\\"&gt;&lt;/element&gt;\")"}</dataItem></data></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="xmlupdate" caption="xmlupdate" time="6109">{"action": "add"}</event></events><properties><property name="length" time="6109">2</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><events><event name="DOMFocusOut" caption="DOMFocusOut" time="6109"/><event name="focus" caption="focus" time="6109"/><event name="focus" caption="focus" time="6109"/><event name="focus" caption="focus" time="6109"/><event name="focus" caption="focus" time="6109"/><event name="focus" caption="focus" time="6109"/><event name="focus" caption="focus" time="6109"/><event name="focus" caption="focus" time="6109"/><event name="movefocus" caption="movefocus" time="6109"/><event name="xforms-focus" caption="xforms-focus" time="6109"/><event name="DOMFocusIn" caption="DOMFocusIn" time="6109"/></events></element><element name="trashbin"><events><event name="xforms-previous" caption="xforms-previous" time="6109"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><events><event name="xforms-enabled" caption="xforms-enabled" time="6125"/><event name="xforms-readwrite" caption="xforms-readwrite" time="6125"/></events><properties><property name="disabled" time="6125"/></properties></element></action><action name="mouseup" x="132" y="131" time="6093" delayTime="7125" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><events><event name="mouseup" caption="mouseup" time="6093"/><event name="click" caption="click" time="6093"/></events></element></action><action name="mousemove" x="135" y="131" time="6203" delayTime="6234" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]</activeElement></element></action><action name="mousemove" x="141" y="131" time="6218" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="145" y="131" time="6218" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="149" y="131" time="6234" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="153" y="131" time="6234" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="158" y="131" time="6250" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="160" y="131" time="6250" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="165" y="131" time="6265" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="166" y="131" time="6265" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="168" y="131" time="6281" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="169" y="131" time="6281" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="170" y="131" time="6296" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="172" y="131" time="6312" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="173" y="131" time="6312" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="175" y="131" time="6328" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="176" y="131" time="6328" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="179" y="131" time="6343" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="180" y="131" time="6343" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="183" y="131" time="6359" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="185" y="131" time="6359" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="186" y="131" time="6375" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="189" y="131" time="6375" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="190" y="131" time="6390" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="192" y="129" time="6390" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="193" y="129" time="6406" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="193" y="128" time="6437" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousedown" x="193" y="128" time="6453" delayTime="6500" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><events><event name="mousedown" caption="mousedown" time="6453"/><event name="DOMFocusOut" caption="DOMFocusOut" time="6453"/><event name="focus" caption="focus" time="6453"/><event name="focus" caption="focus" time="6453"/><event name="focus" caption="focus" time="6453"/><event name="focus" caption="focus" time="6453"/><event name="focus" caption="focus" time="6453"/><event name="focus" caption="focus" time="6453"/><event name="focus" caption="focus" time="6453"/><event name="movefocus" caption="movefocus" time="6453"/><event name="xforms-focus" caption="xforms-focus" time="6453"/><event name="DOMFocusIn" caption="DOMFocusIn" time="6453"/><event name="mousedown" caption="mousedown" time="6453"/></events></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[1]"><events><event name="blur" caption="blur" time="6453"/><event name="blur" caption="blur" time="6453"/><event name="blur" caption="blur" time="6453"/><event name="blur" caption="blur" time="6453"/><event name="blur" caption="blur" time="6453"/><event name="blur" caption="blur" time="6453"/><event name="blur" caption="blur" time="6453"/></events></element></action><action name="mousemove" x="195" y="128" time="6484" delayTime="6578" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement>html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:actiontracker[1]"><events><event name="beforechange" caption="beforechange" time="6562"/><event name="prop.undolength" caption="prop.undolength" time="6562"/><event name="prop.redolength" caption="prop.redolength" time="6578"/><event name="afterchange" caption="afterchange" time="6578">{"action": "redo"}</event></events><properties><property name="undolength" time="6562">1</property><property name="redolength" time="6562"/></properties></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]/a:model[1]"><data><dataItem name="remove" time="6562">{"amlNode": "apf.xmldb.getXml(\"&lt;a:model xmlns:a=\\\"http://ajax.org/2005/aml\\\"/&gt;\")", "xmlNode": "apf.xmldb.getXml(\"&lt;element caption1=\\\"Text 21\\\" caption2=\\\"Text22\\\"&gt;&lt;/element&gt;\")"}</dataItem><dataItem name="redo-remove" time="6562">{"amlNode": "apf.xmldb.getXml(\"&lt;a:model xmlns:a=\\\"http://ajax.org/2005/aml\\\"/&gt;\")", "xmlNode": "apf.xmldb.getXml(\"&lt;element caption1=\\\"Text 21\\\" caption2=\\\"Text22\\\"&gt;&lt;/element&gt;\")"}</dataItem></data></element><element name="html[1]/body[1]/a:bar[1]/a:datagrid[1]"><events><event name="xmlupdate" caption="xmlupdate" time="6562">{"action": "remove"}</event><event name="xmlupdate" caption="xmlupdate" time="6562">{"action": "redo-remove"}</event></events><properties><property name="length" time="6562">1</property></properties></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><events><event name="xforms-enabled" caption="xforms-enabled" time="6562"/><event name="xforms-readwrite" caption="xforms-readwrite" time="6562"/><event name="DOMFocusOut" caption="DOMFocusOut" time="6578"/><event name="focus" caption="focus" time="6578"/><event name="focus" caption="focus" time="6578"/><event name="focus" caption="focus" time="6578"/><event name="focus" caption="focus" time="6578"/><event name="focus" caption="focus" time="6578"/><event name="focus" caption="focus" time="6578"/><event name="focus" caption="focus" time="6578"/><event name="movefocus" caption="movefocus" time="6578"/><event name="xforms-focus" caption="xforms-focus" time="6578"/><event name="DOMFocusIn" caption="DOMFocusIn" time="6578"/></events><properties><property name="disabled" time="6562"/></properties></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><events><event name="blur" caption="blur" time="6578"/><event name="blur" caption="blur" time="6578"/><event name="blur" caption="blur" time="6578"/><event name="blur" caption="blur" time="6578"/><event name="blur" caption="blur" time="6578"/><event name="blur" caption="blur" time="6578"/><event name="blur" caption="blur" time="6578"/><event name="xforms-disabled" caption="xforms-disabled" time="6578"/><event name="xforms-readonly" caption="xforms-readonly" time="6578"/></events><properties><property name="disabled" time="6562">true</property></properties></element><element name="trashbin"><events><event name="xforms-previous" caption="xforms-previous" time="6578"/></events></element></action><action name="mousemove" x="197" y="128" time="6546" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mouseup" x="197" y="128" time="6546" delayTime="" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><events><event name="mouseup" caption="mouseup" time="6546"/><event name="click" caption="click" time="6546"/></events></element></action><action name="mousemove" x="203" y="126" time="6546" delayTime="7296" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement>html[1]/body[1]/a:window[1]/a:button[1]</activeElement></element><element name="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[2]"><events><event name="blur" caption="blur" time="7265"/><event name="blur" caption="blur" time="7265"/><event name="blur" caption="blur" time="7265"/><event name="blur" caption="blur" time="7265"/><event name="blur" caption="blur" time="7265"/><event name="blur" caption="blur" time="7265"/><event name="blur" caption="blur" time="7265"/></events></element></action><action name="mousemove" x="213" y="125" time="6562" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="237" y="122" time="6578" delayTime="" ignore="true" target="html[1]/body[1]/a:bar[1]/a:table[1]/a:button[3]"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="251" y="121" time="6609" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="305" y="115" time="6609" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="329" y="112" time="6609" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="355" y="109" time="6625" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="392" y="109" time="6625" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="434" y="109" time="6640" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="481" y="109" time="6640" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="534" y="109" time="6656" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="588" y="108" time="6656" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="647" y="105" time="6671" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="706" y="102" time="6687" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="771" y="101" time="6687" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="833" y="95" time="6703" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="897" y="91" time="6703" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="961" y="85" time="6718" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1024" y="81" time="6718" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1082" y="75" time="6734" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1140" y="71" time="6734" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1194" y="65" time="6750" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1250" y="63" time="6750" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1298" y="60" time="6765" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1348" y="57" time="6765" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1390" y="54" time="6781" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1430" y="51" time="6781" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1467" y="48" time="6796" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1498" y="47" time="6796" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1525" y="47" time="6812" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1551" y="44" time="6812" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1570" y="43" time="6828" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action><action name="mousemove" x="1586" y="41" time="6828" delayTime="" ignore="true"><element name="apf"><activeElement></activeElement></element></action></test></testList>');
        // end testing
        apf.uirecorder.saveResults = saveResults;
        var timer = 3;
        uir_windowStartTest.setProperty("visible", true);
        uir_windowStartTest.setProperty("title", "Starting test in..." + timer);
        
        var interval = setInterval(function() {
            timer -= 1;
            if (timer == 0) {
                clearInterval(interval);
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
    playAction : function() {
        //apf.console.info("playAction: " + apf.uirecorder.curActionIdx);
        var test = apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")];
        var action = test.childNodes[apf.uirecorder.curActionIdx];
        var elapsedTime = 0;
        
        // realtime movement
        if (uir_ddRealtime.value == "realtime") {
            var interval = setInterval(function() {
                elapsedTime = new Date().getTime() - apf.uirecorder.startTime;
                if (action.getAttribute("time") <= elapsedTime - apf.uirecorder.testDelay) {
                    clearInterval(interval);
                    apf.uirecorder.execAction();
                }
            }, 1);
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
        /*
        else if (action.getAttribute("name") === "keydown") {
            o3.sendKeyEvent(action.getAttribute("value"));
        }
        */
        else if (action.getAttribute("name") === "mousedown") {
            //if (uir_ddRealtime.value == "max") 
            o3.wait(1);
            o3.mouseLeftDown();
        }
        else if (action.getAttribute("name") === "mouseup") {
            //if (uir_ddRealtime.value == "max") 
            o3.wait(1);
            o3.mouseLeftUp();
        }
        else if (action.getAttribute("name") === "mousescroll") {
            o3.mouseWheel(action.getAttribute("value"));
        }

        var delayCheck = false;
        /*
        if (apf.uirecorder.saveResults) {
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
        */

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
        //apf.uirecorder.testEventList = {};
        
        if (!delayCheck) {
            apf.uirecorder.testCheck();
        } 
    },
    waitForEvent : function(e) {
        apf.console.info("testCheck: " + apf.uirecorder.curActionIdx);
        e.currentTarget.removeEventListener(e.name, apf.uirecorder.waitForEvent);
        
        //(apf.xmlToXpath(this) || amlNode.id) 
        apf.console.info("event fired: " + e.name);
        
        apf.uirecorder.testCheck(apf.uirecorder.saveResults);
        apf.uirecorder.testdelay += new Date().getTime() - apf.uirecorder.beforeDelay;
        
        // @todo temp solution for multiple beforeload/afterload checks
        //return;
    },
    testCheck : function() {
        apf.console.info("testCheck: " + apf.uirecorder.curActionIdx);
        var test = apf.uirecorder.testListXml.childNodes[uir_listTests.selection[apf.uirecorder.curTestIdx].getAttribute("index")];
        var action = test.childNodes[apf.uirecorder.curActionIdx];

        // play next action
        if (test.childNodes.length > apf.uirecorder.curActionIdx+1) {
            apf.uirecorder.curActionIdx++;
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
        var amlNode     = (htmlElement) ? apf.findHost(htmlElement) : null;

//if (eventName == "mouseup") debugger;
        // ignore interaction with uirecorder controls
        if (amlNode && amlNode.id && amlNode.id.indexOf("uir") == 0 && amlNode.id != "uir_bar") return;
//        if (amlNode.id == "uir_bar") amlNode = null;
        
        // time in ms when action is executed
        var time        = parseInt(new Date().getTime() - apf.uirecorder.startTime);
        var actionObj = {
            time        : time,
            name        : eventName,
            detailList  : {}
        }
        
        if (htmlElement) actionObj.htmlElement  = htmlElement;
        if (amlNode) actionObj.amlNode          = amlNode;
        if (e && e.clientX) actionObj.x         = e.clientX;
        if (e && e.clientY) actionObj.y         = e.clientY;

        if (value) {
            actionObj.value = value;
        }

        // collect events before first ui action
        if (apf.uirecorder.actionList.length == 0) {
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
                    aNode.setAttribute("target", apf.xmlToXpath(action.amlNode));
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

