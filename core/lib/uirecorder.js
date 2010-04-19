// #ifdef __WITH_UIRECORDER
/**
 * Provides a way to record user actions, store them and play them back.
 * @experimental
 */
apf.uirecorder = {
    $inited         : false,
    isRecording     : false,
    isPlaying       : false,
    captureDetails  : false,
    $o3             : null
} 

apf.uirecorder.capture = {
    $curTestFile    : "",   // path of file that is being captured
    $curTestId      : "",   // name of test
    $startTime      : 0,    // time capturing is started
    $keyActionIdx   : 0,    // value given to keyActions
    $keyActions     : [],   // list of keyactions
    $prevAction     : null,
    $mousedownMode  : false,
    outputXml       : null, // output generated after capturing
    
    $validKeys      : [37, 38, 39, 40,  //arrowkeys
                        27,             // Esc
                        16, 17, 18,     // Shift, Ctrl, Alt
                        13,             // Enter
                        8, 46, 36, 35,          // Backspace, Del, Home, End
                      ],       
    
    // start capturing
    record : function(file, testId, captureDetails) {
        // reset action- and detailList
        apf.uirecorder.actionList       = [];
        apf.uirecorder.detailList       = {};
        apf.uirecorder.captureDetails   = captureDetails;

        this.$curTestFile               = file;
        this.$curTestId                 = testId;
        this.$startTime                 = new Date().getTime();
        this.$keyActionIdx              = 0;
        this.$keyActions                = [];
        this.outputXml                  = null
        
        apf.uirecorder.isRecording      = true;

        // start capturing
        apf.uirecorder.capture.$init();
    },
    
    // stop capturing, save recorded data in this.outputXml
    stop : function() {
        apf.uirecorder.$inited      = false;
        apf.uirecorder.isRecording  = false;
        this.$saveTest();
    },
    
    // init capturing of user interaction
    $init : function() {
        if (apf.uirecorder.$inited) return;
        apf.uirecorder.$inited = true;

        // listeners for user mouse interaction
        document.documentElement.ondblclick = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("dblClick", e || event);
        }
/*
        apf.uirecorder.$o3.DOM.onmousedown = function(e){
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("mousedown", e || event);
        };
*/

        document.documentElement.onmousedown = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("mousedown", e || event);
        }

        document.documentElement.onmouseup = function(e) {
            if (apf.uirecorder.isPlaying || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return; //apf.uirecorder.isPaused ||
            apf.uirecorder.capture.$captureAction("mouseup", e || event);
        }
        
        document.documentElement.onmousemove = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            apf.uirecorder.capture.$captureAction("mousemove", e || event);
        }
        
        // Support for Mouse Scroll event
        if(document.addEventListener) {
            /* FF */
            document.addEventListener("DOMMouseScroll", function(e) {
                if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
                e = e || event;

                var delta = null;
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                    if (apf.isOpera)
                        delta *= -1;
                }
                else if (e.detail)
                    delta = -e.detail / 3;
                
                apf.uirecorder.capture.$captureAction("mousescroll", e, delta);
            }, false);
        }
        else {
            /* IE */
            document.onmousewheel = function(e) {
                if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
                e = e || event;

                var delta = null;
                if (e.wheelDelta) {
                    delta = e.wheelDelta / 120;
                    if (apf.isOpera)
                        delta *= -1;
                }
                else if (e.detail)
                    delta = -e.detail / 3;
                    
                apf.uirecorder.capture.$captureAction("mousescroll", e, delta);
            };
        }
        
        // listeners for keyboard interaction
        // onkeyup does get called in SSB for some reason but does in the browser plugin
        document.documentElement.onkeyup = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            e = e || event;

            var keycode = (e.keyCode) ? e.keyCode : e.which;
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;

            apf.uirecorder.capture.$captureAction("keyup", e, keycode);
        }
        
        document.documentElement.onkeydown = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting)) return;
            e = e || event;
            var keycode = (e.keyCode) ? e.keyCode : e.which;
            
            if (apf.uirecorder.capture.$validKeys.indexOf(keycode) == -1) return;
            
            apf.uirecorder.capture.$captureAction("keydown", e, keycode);
        }
        
        document.documentElement.onkeypress = function(e) {
            if (apf.uirecorder.isPlaying || apf.uirecorder.isPaused || !(apf.uirecorder.isRecording || apf.uirecorder.isTesting))
                return;
            e = e || event;

            if (apf.uirecorder.capture.$validKeys.indexOf(e.keyCode) > -1) return;
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
           

//            if (e.shiftKey) character = "[SHIFT]" + character;
//            if (e.altKey)   character = "[ALT]" + character;
//            if (e.ctrlKey)  character = "[CTRL]" + character;
            apf.uirecorder.capture.$captureAction("keypress", e, character);
        }
        
        // @todo fix problem with onkeyup in apf
    },

    // get all neccessary information about amlNode
    $getAmlNodeInfo : function(amlNode) {
        var data = {};
        
        if (amlNode.id)         data.id = amlNode.id;
        if (amlNode.caption)    data.caption = amlNode.caption;
        
        data.tagName    = amlNode.tagName;
        data.type       = amlNode.localName;
        data.xpath      = apf.xmlToXpath(amlNode);
        
        // multiselect amlNode
        if (amlNode.hasFeature(apf.__MULTISELECT__)) {
            data.multiselect = "true";
            
            if (amlNode.selected) {
                data.selected = {};
                if (amlNode.getValue())
                    data.selected.value = amlNode.getValue();
                
                data.selected.xpath = apf.xmlToXpath(amlNode.selected);
            }
        }

        // @todo parent info needed?
        return data;
    },
    
    // get all neccessary information about htmlElement
    // @todo set info based on type of element
    $getHtmlElementInfo : function(htmlElement) {
        var data = {};

        if (htmlElement.id) data.id                 = htmlElement.id;
        if (htmlElement.tagName.toLowerCase() == "a" && htmlElement.innerHTML) 
            data.innerHTML   = htmlElement.innerHTML;

        data.tagName    = htmlElement.tagName;
        data.type       = (data.tagName.toLowerCase() == "a") ? "link" : data.tagName;
        
        return data;
    },
    
    $captureAction : function(eventName, e, value) {
        //if (!apf.uirecorder.$inited) return;
        var htmlElement = (e) ? e.srcElement || e.target : null;
        var amlNode     = (htmlElement && apf.findHost(htmlElement) && apf.findHost(htmlElement).tagName) ? apf.findHost(htmlElement) : null;
        
        if (eventName != "mousemove") {
            if (amlNode) {
                var amlNodeData = this.$getAmlNodeInfo(amlNode);
            }
            else if (htmlElement) {
                var htmlElementData = this.$getHtmlElementInfo(htmlElement);
            }
        }
        
        // elapsed time since start of recording/playback
        var time = parseInt(new Date().getTime() - apf.uirecorder.capture.$startTime);

        // set action object
        var actionObj = {
            time        : time,
            name        : eventName,
            detailList  : []
        }

        if (amlNodeData)        actionObj.amlNode       = amlNodeData;
        if (htmlElementData)    actionObj.htmlElement   = htmlElementData;
        if (e && e.clientX)     actionObj.x             = parseInt(e.clientX);
        if (e && e.clientY)     actionObj.y             = parseInt(e.clientY);
        if (value)              actionObj.value         = value;

        /*
        if (apf.uirecorder.actionList.length == 0) {
            actionObj.name = "init";
            actionObj.detailList[0] = apf.uirecorder.detailList;
            apf.uirecorder.detailList = {};
            apf.uirecorder.actionList.push(actionObj);
            return;
        }
        */
        if (this.$prevAction) {
            if (this.$prevAction.name == "mousedown")
                this.$mousedownMode = true;
            else if (this.$mousedownMode && this.$prevAction.name == "mouseup")
                this.$mousedownMode = false;
            
            if (this.$mousedownMode || ["mousemove", "mousescroll"].indexOf(eventName) == -1) {
                actionObj.keyActionIdx = this.$keyActionIdx;
                this.$keyActions.push(actionObj);
                this.$keyActionIdx++;
            }
        }
        
        // save action object
        apf.uirecorder.actionList.push(actionObj);
        this.$prevAction = actionObj;
    },
    captureEvent : function(eventName, e) {
        //if (!apf.uirecorder.$inited) return;
    },
    capturePropertyChange : function(amlNode, prop, value) {
        //if (!apf.uirecorder.$inited) return;
    },
    captureModelChange : function(params) {
        //if (!apf.uirecorder.$inited) return;
    },
    
    // save captured test data
    $saveTest : function() {
        var testXml = apf.getXml("<test />");
        
        var actionList = [];
        var specialAction = "";
        /* special cases */
        // only one click recorded
        if (this.$keyActions.length == 2 && this.$keyActions[0].name == "mousedown" && this.$keyActions[1].name == "mouseup") {
            actionList = this.$keyActions;
            actionList[0].time = 0;
            actionList[1].time = 100;
            specialAction = "click on ";
        }
        else {
            testXml.setAttribute("name", apf.uirecorder.capture.$curTestId);
            actionList = apf.uirecorder.actionList;
        }

        testXml.setAttribute("file", apf.uirecorder.capture.$curTestFile);
        
        // trim actionList from trailing mousemove actions
        actionList.reverse();
        for (var i = 0, l = actionList.length; i < l; i++) {
            if (actionList[i].name != "mousemove") {
                break;
            }
        }
        actionList = actionList.slice(i);

        // trim actionList from leading mousemove actions, also adjust time
        actionList.reverse();
        for (var startIndex = 0, reduceTime = 0, i = 0, l = actionList.length; i < l; i++) {
            if (!startIndex && actionList[i].name != "mousemove") {
                startIndex = i;
                reduceTime = actionList[i].time;
            }
            if (reduceTime) {
                actionList[i].time -= reduceTime;
            }
        }
        actionList = actionList.slice(startIndex);
        
        
        var detailTypes = {"events": "event", "properties": "property", "data": "dataItem"};
        for (var prevNode, action, aNode, amlNodeName, i = 0, l = actionList.length; i < l; i++) {
            action = actionList[i];
            
            // skip current action if next action is played at same time
            //if (actionList[i+1] && action.time == actionList[i+1].time) continue;
            
            // skip small mousemove between certain actions, like between mousedown/mouseup
            /*
            if (action.name == "mousemove" && actionList[i-1] && actionList[i-1].name == "mousedown" && actionList[i+1] && actionList[i+1].name == "mouseup") {
                continue;
            }
            */
            
            aNode = testXml.ownerDocument.createElement("action");
            aNode.setAttribute("name"       , action.name);
            aNode.setAttribute("x"          , action.x);
            aNode.setAttribute("y"          , action.y);
            aNode.setAttribute("time"       , action.time);
            if (action.delayTime) aNode.setAttribute("delayTime"  , action.delayTime);
            if (action.keyActionIdx != undefined) {
                aNode.setAttribute("keyActionIdx"  , action.keyActionIdx);
                if (action.amlNode) {
// caption not needed for debugwin, disabled for now
//aNode.setAttribute("caption", action.name + " (" + this.getCaption(action.amlNode) + ")");
                    //if (action.amlNode.caption) aNode.setAttribute("caption", action.name + " (" + action.amlNode.caption + ")");
                }
                else if (action.target) {
                    if (action.target.caption) aNode.setAttribute("caption", action.name + " (" + action.target.caption + ")");
                    if (action.target.nodeName) aNode.setAttribute("targetType", action.target.nodeName);
                    if (action.target.value) aNode.setAttribute("targetValue", action.target.value);
                }
            }
            
            if (action.ignore) { 
                aNode.setAttribute("ignore", action.ignore);
            }

            /* old amlNode attributes setting
            if (action.amlNode && action.amlNode.localName != "debugwin") {
                if (action.amlNode.parentNode && action.amlNode.tagName) {
                    var amlNodeName = action.amlNode.id || apf.xmlToXpath(action.amlNode);
                    if (amlNodeName.indexOf("/text()[") > -1)
                        amlNodeName = amlNodeName.substr(0, amlNodeName.length - "/text()[x]".length)
                    
                    aNode.setAttribute("amlNode", amlNodeName);
                }
            }
            */
            if (action.amlNode) {
                var amlNode = testXml.ownerDocument.createElement("amlNode");
                if (action.amlNode.id) amlNode.setAttribute("id", action.amlNode.id);
                amlNode.setAttribute("xpath",   action.amlNode.xpath);
                amlNode.setAttribute("tagName", action.amlNode.tagName);
                amlNode.setAttribute("type",    action.amlNode.type);
                if (action.amlNode.caption)     amlNode.setAttribute("caption", action.amlNode.caption);
                if (action.amlNode.multiselect) amlNode.setAttribute("multiselect", action.amlNode.multiselect);
                
                if (action.amlNode.selected) {
                    var selectedNode = testXml.ownerDocument.createElement("selected");
                    if (action.amlNode.selected.value) selectedNode.setAttribute("value", action.amlNode.selected.value);
                    if (action.amlNode.selected.xpath) selectedNode.setAttribute("xpath", action.amlNode.selected.xpath);
                    
                    amlNode.appendChild(selectedNode);
                }
                
                aNode.appendChild(amlNode);
                
                if (specialAction)
                    testXml.setAttribute("name", specialAction + (action.amlNode.id || (action.amlNode.type + " " + action.amlNode.caption) || action.amlNode.xpath));
            }
            
            /*
            if (action.htmlNode && action.htmlNode.name) {
                aNode.setAttribute("htmlNode", action.htmlNode.name);
                aNode.setAttribute("width", action.htmlNode.width);
                aNode.setAttribute("height", action.htmlNode.height);
                aNode.setAttribute("absX", action.htmlNode.x);
                aNode.setAttribute("absY", action.htmlNode.y);
                aNode.setAttribute("scrollTop", action.htmlNode.scrollTop);
                aNode.setAttribute("scrollLeft", action.htmlNode.scrollLeft);
            }
            */
            if (action.htmlElement) {
                var htmlElement = testXml.ownerDocument.createElement("htmlElement");
                if (action.htmlElement.id) htmlElement.setAttribute("id", action.htmlElement.id);
                htmlElement.setAttribute("type", action.htmlElement.type.toLowerCase());
                htmlElement.setAttribute("tagName", action.htmlElement.tagName.toLowerCase());
                if (action.htmlElement.innerHTML) htmlElement.setAttribute("innerHTML", action.htmlElement.innerHTML);
                aNode.appendChild(htmlElement);
                
                if (specialAction)
                    testXml.setAttribute("name", specialAction + (action.htmlElement.id || (action.htmlElement.type.toLowerCase() + " " + action.htmlElement.innerHTML)));
            }

            // set value
            if (action.value != undefined) aNode.setAttribute("value", action.value);
            if (action.multiselect != undefined) aNode.setAttribute("multiselect", action.multiselect.toString());
            if (action.multiselectValue != undefined) aNode.setAttribute("multiselectValue", action.multiselectValue);
            if (action.multiselectItem != undefined) aNode.setAttribute("multiselectItem", action.multiselectItem);
            
            // set apf.activeElement
            if (action.activeElement) {
                var eNode, iNode;
                eNode = testXml.ownerDocument.createElement("element");
                eNode.setAttribute("name", "apf");
                iNode = testXml.ownerDocument.createElement("activeElement");
                iNode.appendChild(testXml.ownerDocument.createTextNode(action.activeElement));
                eNode.appendChild(iNode);
                
                aNode.appendChild(eNode);
            }
            
            // loop through detailList
            //if (action.detailList) {
            for (var detailNode, dli = 0, dll = action.detailList.length; dli < dll; dli++) {
                detailNode = testXml.ownerDocument.createElement("details");
                detailNode.setAttribute("index", dli);
                
                for (var elementName in action.detailList[dli]) {
                    eNode = testXml.ownerDocument.createElement("element");
                    if (elementName.indexOf("/text()") == -1)
                        eNode.setAttribute("name", elementName);
                    // strip element name from /text()[x]
                    else
                        eNode.setAttribute("name", elementName.substr(0, elementName.length - "/text()[x]".length));
                    

                    for (var type in detailTypes) {
                        if (action.detailList[dli][elementName][type].length) {
                        //if (type == "properties" && action.name != "mousemove") debugger;
                            dNode = testXml.ownerDocument.createElement(type)
                            for (var item, vNode, di = 0, dl = action.detailList[dli][elementName][type].length; di < dl; di++) {
                                item = action.detailList[dli][elementName][type][di];
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
                                
                                if (item.value || typeof item.value == "boolean") {
                                    if (typeof item.value === "string")
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(item.value));
                                    else if (item.value.value != undefined)
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(item.value.value));
                                    else
                                        iNode.appendChild(testXml.ownerDocument.createTextNode(apf.serialize(item.value).split("<").join("&lt;").split(">").join("&gt;")))
                                }
                                dNode.appendChild(iNode);
                            }
                            eNode.appendChild(dNode);
                        }
                    }
                    detailNode.appendChild(eNode);
                }
                aNode.appendChild(detailNode);
            }
            testXml.appendChild(aNode);
        }

        this.outputXml = testXml;
    },
    
    getCaption : function(amlNode) {
        //amlNode
        if (!amlNode.localName) debugger;
        switch (amlNode.localName) {
            // element with caption
            case "button":
            case "label":
                if (!amlNode.caption) debugger;
                return amlNode.localName + " \"" + amlNode.caption + "\"";
                break;
            // element with id
            case "dropdown":
            case "datagrid":
            case "textbox":
                if (amlNode.caption && amlNode.caption.charAt(0) != "[") debugger;
                return (amlNode.id) ? amlNode.localName + " \"" + amlNode.id + "\"" : amlNode.localName;
                break;
            // element with label
            case "checkbox":
                if (!amlNode.label) debugger;
                return amlNode.localName + " \"" + amlNode.label + "\"";
                break;
            // page elements
            case "page":
                if (amlNode.parentNode && amlNode.parentNode.localName == "tab")
                    return "Tab \"" + amlNode.caption + "\"";
                else
                    debugger;
                break;
            // item elements
            case "item":
                if (amlNode.parentNode) {
                    if (!amlNode.caption) debugger;
                    return amlNode.parentNode.localName + " " + amlNode.localName + " \"" + amlNode.caption + "\"";
                }
                else {
                    debugger;
                }
            default:
                debugger;
        }
    }
}

apf.uirecorder.playback = {
    $o3             : null,         // reference to o3 object, needed to execute the actions
    $playSpeed      : "realtime",   // speed of the playback
    $curTestXml     : null,         // contains the full actions list in xml format
    $curActionIdx   : 0,            // current index of action that is being played
    $startTime      : 0,            // time test has started playing
    
    $windowOffset   : [0, 0],       // object with top/left offset of browser element in relation to client window
    $testDelay      : 0,            // save amount of time the playback is delayed due to pauses, for example by popups
    $speedUpTime    : 0,
    $keyString      : "",
    
    test : function(testXml, playSpeed, o3, offset) {
        this.play(testXml, playSpeed, o3, offset);
    },
    
    // playback current test
    play : function(testXml, playSpeed, o3, offset) {
        this.$o3                    = o3;
        this.$playSpeed             = playSpeed;
        this.$curTestXml            = testXml;
        this.$curActionIdx          = 0;
        this.$windowOffset          = offset;
        
        apf.uirecorder.isPlaying    = true;
        
        // if testing, this.$createCheckList();
        
        // hide debugwin if it's open
        if (apf.isDebugWindow)
            apf.$debugwin.hide();
            
        // if capturing
        //apf.uirecorder.capture.$init();
        //apf.uirecorder.capture.$startTime = new Date().getTime();
        this.$startTime = new Date().getTime();
        this.$playAction();
    },
    
    // stop playing
    stop : function() {
        apf.uirecorder.isPlaying = false;
    },
    
    // init playback of action
    $playAction : function() {
        this.$curAction = this.$curTestXml.childNodes[this.$curActionIdx];
        if (!this.$curAction) debugger;
        // skip mousemove actions
        if (this.$curAction.getAttribute("keyActionIdx") == undefined)
            this.$nextAction();
        
        //if (this.$playSpeed == "max") {
            if (this.$curAction.getAttribute("name") == "keypress") {
                for (var i = this.$curActionIdx, l = this.$curTestXml.childNodes.length; i < l; i++) {
                    if (this.$curTestXml.childNodes[i].getAttribute("name") != "keypress") {
                        break;
                    }
                    this.$keyString += this.$curTestXml.childNodes[i].getAttribute("value");
                }

                if (this.$keyString != "") {
                    i--;
                    this.$speedUpTime = parseInt(this.$curTestXml.childNodes[i].getAttribute("time")) - parseInt(this.$curAction.getAttribute("time"));
                    this.$curActionIdx = i;
                    this.$curAction = this.$curTestXml.childNodes[i];
                }
            }
        //}
        
        if (this.$playSpeed == "realtime") {
            if (this.$playTimer) {
                clearTimeout(this.$playTimer);
                this.$playTimer = "";
            }
            var timeout = parseInt(this.$curAction.getAttribute("time")) - this.$speedUpTime + this.$testDelay - (new Date().getTime() - this.$startTime);
            if (timeout > 0) {
                this.$playTimer = setTimeout(function() {
                    apf.uirecorder.playback.$execAction();
                }, timeout);
            }
            
            // timeout smaller or equal to 0, execute immediatly
            else {
                this.$execAction();
            }
        }
        else {
            this.$playTimer = setTimeout(function() {
                apf.uirecorder.playback.$execAction();
            }, 100);
        }
    },
    
    $execAction : function() {
        // detect position of amlNode
        var amlNodeXml;
        if (amlNodeXml = this.$curAction.selectSingleNode("amlNode")) {
            var amlNode;

            //amlNode with id
            if (amlNodeXml.getAttribute("id")) {
                amlNode = apf.document.getElementById(amlNodeXml.getAttribute("id"));
            }
            
            // amlNode with certain tagName and caption
            if (!amlNode && amlNodeXml.getAttribute("tagName")) {
                var amlNodes = apf.document.getElementsByTagName(amlNodeXml.getAttribute("tagName"))
                
                // search for amlNode with correct caption
                if (amlNodeXml.getAttribute("caption")) {
                    for (var i = 0, l = amlNodes.length; i < l; i++) {
                        if (amlNodes[i].caption == amlNodeXml.getAttribute("caption")) {
                            amlNode = amlNodes[i];
                            break;
                        }
                    }
                }
            }
            
            // search for amlNode based on xpath
            if (!amlNode && amlNodeXml.getAttribute("xpath")) {
                amlNode = apf.document.selectSingleNode(amlNodeXml.getAttribute("xpath").substr(8));
            }
            
            if (!amlNode) {
                // no amlNode found!
                debugger;
            }
            
            // htmlNode of amlNode
            // @todo activeElements
            
            // multiselect selection
            if (amlNodeXml.getAttribute("multiselect") == "true" && amlNodeXml.selectSingleNode("selected")) {
                debugger;
                // something like this, or using querynodes
                //amlNode.queryNode(amlNodeXml.selectSingleNode("selected").getAttribute("xpath"))
            }
        }
        else if (htmlElementXml = this.$curAction.selectSingleNode("htmlElement")) {
            var htmlElement;
            
            if (htmlElementXml.getAttribute("id")) {
                htmlElement = document.getElementById(htmlElementXml.getAttribute("id"));
            }
            if (!htmlElement && htmlElementXml.getAttribute("type")) {
                var htmlElements = document.getElementsByTagName(htmlElementXml.getAttribute("type"));
                
                if (htmlElementXml.getAttribute("innerHTML")) {
                    for (var i = 0, l = htmlElements.length; i < l; i++) {
                        if (htmlElements[i].innerHTML == htmlElementXml.getAttribute("innerHTML")) {
                            htmlElement = htmlElements[i];
                            break;
                        }
                    }
                }
            }
        }
        
        // calculate mouse position
        var mousePos;
        if (amlNode) {
            mousePos = apf.getAbsolutePosition(amlNode.$ext);
            
            // set mouse position in centre of amlNode
            mousePos[0] = mousePos[0] + amlNode.$ext.offsetWidth/2;
            mousePos[1] = mousePos[1] + amlNode.$ext.offsetHeight/2;
        }
        else if (htmlElement) {
            mousePos = apf.getAbsolutePosition(htmlElement);
            
            // set mouse position in centre of htmlElement
            mousePos[0] = mousePos[0] + htmlElement.offsetWidth/2;
            mousePos[1] = mousePos[1] + htmlElement.offsetHeight/2;
        }
        
        if (mousePos == undefined) {
            mousePos = [parseInt(this.$curAction.getAttribute("x")), parseInt(this.$curAction.getAttribute("y"))];
        }
        
        // move mouse cursor to correct position
        // ssb
        if (window.external.o3) { //this.$o3.window
            //apf.console.info(this.$curAction.getAttribute("name") + " moved");
            this.$o3.mouseTo(
                parseInt(mousePos[0]) + this.$o3.window.clientX + this.$windowOffset.left, 
                parseInt(mousePos[1]) + this.$o3.window.clientY + this.$windowOffset.top, 
                window.external.o3 //this.$o3.window
            );
        }
        // browser plugin
        else {
            apf.console.info("execute mousemove");
            this.$o3.mouseTo(
                parseInt(mousePos[0]) + this.$windowOffset.left, 
                parseInt(mousePos[1]) + this.$windowOffset.top, 
                this.$o3.window
            );
        }

        // execute action
        if (this.$curAction.getAttribute("name") === "keypress") {
            if (this.$keyString) {
                this.$o3.sendAsKeyEvents(this.$keyString);
                this.$keyString = "";
            }
            else
                this.$o3.sendAsKeyEvents(this.$curAction.getAttribute("value"));
        }
        else if (this.$curAction.getAttribute("name") === "keydown") {
            this.$o3.sendKeyDown(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (this.$curAction.getAttribute("name") === "keyup") {
            this.$o3.sendKeyUp(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (this.$curAction.getAttribute("name") === "mousedown") {
            this.$o3.mouseLeftDown();
        }
        else if (this.$curAction.getAttribute("name") === "mouseup") {
            this.$o3.mouseLeftUp();
        }
        else if (this.$curAction.getAttribute("name") === "dblClick") {
            this.$o3.mouseLeftDown();
            this.$o3.mouseLeftUp();
            this.$o3.mouseLeftDown();
            this.$o3.mouseLeftUp();
        }
        else if (this.$curAction.getAttribute("name") === "mousescroll") {
            this.$o3.mouseWheel(this.$curAction.getAttribute("value"));
        }
        
        this.$nextAction();
    },
    
    $nextAction : function() {
        // perform next action
        if (this.$curTestXml.childNodes.length > this.$curActionIdx + 1) {
            this.$curActionIdx++;
            this.$playAction();
        }
        // stop playback
        else {
            //apf.uirecorder.output.createTestResultsXml();
            this.stop();
            apf.dispatchEvent("apftest_testcomplete");
        }
    }
}
//#endif
