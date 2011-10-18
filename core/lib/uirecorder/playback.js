// #ifdef __WITH_UIRECORDER
apf.uirecorder.playback = {
    $playSpeed      : "realtime",   // speed of the playback
    $curTestXml     : null,         // contains the full actions list in xml format
    $curActionIdx   : 0,            // current index of action that is being played
    $startTime      : 0,            // time test has started playing
    $startDelay     : 0,            // time when test was paused
    $testDelay      : 0,            // total time test has delayed
    checkList       : [],
    $warningList    : [],
    $waitForList    : [],
    $waitForInterval: null,
    $waitForStartTime: 0,
    
    $activeEl       : null,
    
    $windowOffset   : [0, 0],       // object with top/left offset of browser element in relation to client window
    $speedUpTime    : 0,
    $keyString      : "",
    
    $lastMousePosition : [0, 0],
    
    $eventsToCheck  : [],
    $waitForEvents  : [], //"afterload", "afterswitch"

    test : function(testXml, playSpeed, o3, offset) {
        this.play(testXml, playSpeed, o3, offset);
    },
    
    createCheckList : function() {
        this.checkList = []
        
        var id, xpath, tagName, type, activeElement;
        for (var kIdx, ds, k, i = 0, il = this.$keyActions.length; i < il; i++) {
            this.checkList[(kIdx = (k = this.$keyActions[i]).getAttribute("keyActionIdx"))] = {};

            if ((a = k.selectSingleNode("amlNode"))) {
                if (!this.checkList[kIdx].action) this.checkList[kIdx].action = {};
                this.checkList[kIdx].action["amlNode"] = {}
                
                if (xpath = a.getAttribute("xpath")) this.checkList[kIdx].action["amlNode"].xpath = xpath;
                if (id = a.getAttribute("id")) {
                    this.checkList[kIdx].action["amlNode"].id = id;
                }
                // no id specified for element
                else {
                    if (this.$warningList.indexOf("No id specified for element " + xpath) == -1)
                        this.$warningList.push("No id specified for element " + xpath);
                }
                if (tagName = a.getAttribute("tagName")) this.checkList[kIdx].action["amlNode"].tagName = tagName;
                if (type = a.getAttribute("type")) this.checkList[kIdx].action["amlNode"].type = type;
                if (a.getAttribute("activeElement") && (activeElement = a.selectSingleNode("activeElement").getAttribute("name"))) this.checkList[kIdx].action["amlNode"].activeElement = activeElement;
            }
            if ((ds = k.selectNodes("details"))) {
                //if (!this.checkList[kIdx].details) this.checkList[kIdx].details = {};
                for (var d, dIdx, dsi = 0, dsl = ds.length; dsi < dsl; dsi++) {                
                    dIdx = (d = ds[dsi]).getAttribute("index");
                    //this.checkList[kIdx].details[(dIdx = (d = ds[dsi]).getAttribute("index"))] = {};

                    //elements
                    for (var el, elName, eli = 0, ell = d.childNodes.length; eli < ell; eli++) {
                        if ((elName = (el = d.childNodes[eli]).getAttribute("name")) == "trashbin") continue
                        //this.checkList[kIdx].details[dIdx][elName] = {};
                        
                        //element types (events/properties/data)
                        for (var et, etName, eti = 0, etl = el.childNodes.length; eti < etl; eti++) {
                            // @todo determine which events should be checked, for now ignore events
                            etName = (et = el.childNodes[eti]).tagName;
                            
                            //if (!this.checkList[kIdx].details[dIdx][elName][etName]) this.checkList[kIdx].details[dIdx][elName][etName] = [];
                            
                            // element detail
                            for (var setWaitFor = false, detObj, ed, edi = 0, edl = et.childNodes.length; edi < edl; edi++) {
                                //if (etName == "events") debugger;
                                if (etName == "events") {
                                    if (this.$eventsToCheck.indexOf((edName = (ed = et.childNodes[edi]).getAttribute("name"))) == -1
                                        && this.$waitForEvents.indexOf(edName) == -1
                                    ) {
                                        continue;
                                    }
                                    else if (this.$waitForEvents.indexOf(edName) > -1) {
                                        setWaitFor = true;
                                    }
                                    else if (this.$eventsToCheck.indexOf(edName) > -1) {
                                        setWaitFor = false;
                                    }
                                }
                                
                                if (!this.checkList[kIdx].details) this.checkList[kIdx].details = {};
                                if (!this.checkList[kIdx].details[dIdx]) this.checkList[kIdx].details[dIdx] = {};
                                if (!this.checkList[kIdx].details[dIdx][elName]) this.checkList[kIdx].details[dIdx][elName] = {};
                                if (!this.checkList[kIdx].details[dIdx][elName][etName]) this.checkList[kIdx].details[dIdx][elName][etName] = [];

                                if (typeof ((ed = et.childNodes[edi]).text) == "string") {
                                    detObj = {
                                        name : ed.getAttribute("name"),
                                        value : ed.text,
                                        type : ed.tagName
                                    }
                                    if (setWaitFor) 
                                        detObj.waitFor = true;
                                    
                                    this.checkList[kIdx].details[dIdx][elName][etName].push(detObj);
                                }
                            }
                        }
                        
                    }
                }
            }
        }
    },
    
    // playback current test
    play : function(testXml, playSpeed, o3, offset, testing) {
        apf.uirecorder.$o3          = o3;
        this.$playSpeed             = playSpeed;
        this.$curTestXml            = testXml;
        this.$curActionIdx          = 0;
        this.$windowOffset          = offset;
        this.$keyActions            = testXml.selectNodes("action[@keyActionIdx]");
        apf.uirecorder.isPlaying    = true;
        
        if (testing) {
            apf.uirecorder.isTesting    = true;
            apf.uirecorder.captureDetails   = true;
        
            this.createCheckList();

            // if capturing
            apf.uirecorder.capture.$init();
            apf.uirecorder.capture.$startTime = new Date().getTime();
            apf.uirecorder.capture.$curTestFile = this.$curTestXml.getAttribute("file");
            apf.uirecorder.capture.$curTestId = this.$curTestXml.getAttribute("name");
        }
        
        // hide debugwin if it's open
        if (apf.isDebugWindow)
            apf.$debugwin.hide();

        
        this.$startTime = new Date().getTime();
        this.$playAction();
    },
    
    // pause playback
    pause : function() {
        if (apf.uirecorder.isPaused) return;
        apf.uirecorder.isPaused = true;
        this.$startDelay = new Date().getTime();
    },
    
    // resume playback
    resume : function() {
        apf.uirecorder.isPaused = false;
        
        // no actions to execute
        var moreActions = (this.$playSpeed == "realtime") 
            ? this.$curTestXml.childNodes[this.$curActionIdx]
            : this.$keyActions[this.$curActionIdx];

        if (!moreActions) {
            this.$nextAction();
            return;
        }
        //else {
            //this.$curActionIdx++;
        //}
        
        if (this.$activeEl) {
            if (this.$curActionIdx > 0 && this.$curTestXml.childNodes[this.$curActionIdx].getAttribute("name") == "mousedown") debugger;
            //brwTest.focus();
            this.$activeEl.focus();
        }
        
        //if (!apf.uirecorder.isPaused) debugger;
//        if (this.$waitElementsInterval || apf.uirecorder.testing.$waitForInterval || apf.uirecorder.output.$popup) return;
        
        
        if (apf.uirecorder.isPaused)
            this.$testDelay += new Date().getTime() - this.$startDelay;
        
        // small delay before continuing
        setTimeout(function() {
            apf.uirecorder.playback.$playAction();
        }, 500);
    },
    
    // stop playing
    stop : function() {
        apf.uirecorder.isTesting = false;
        apf.uirecorder.isPlaying = false;
        apf.uirecorder.capture.stop();
    },
    
    $waitForChecks : function() {
        // check if not too much time has passed, 10 seconds
        var checkList;
        if ((checkList=apf.uirecorder.playback.$waitForList).length) {
            if (new Date().getTime() - apf.uirecorder.playback.$waitForStartTime > 10000) {
                clearInterval(apf.uirecorder.playback.$waitForInterval);
                apf.uirecorder.playback.$testError("It takes too long to set " + checkList[0].type + " " + checkList[0].name + " on element " + checkList[0].elName);
                return;
            }
            for (var found = [], amlNode, w, i = 0, l = checkList.length; i < l; i++) {
                // loop through detailList of action to check if event is captured
                if (!(apf.uirecorder.capture.$actionList[checkList[i].actionIdx] && apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList && apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx] && apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx][checkList[i].elName] && apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx][checkList[i].elName][checkList[i].detailType])) continue;
                //if (!(checkList[i].actionObj && checkList[i].actionObj.detailList && checkList[i].actionObj.detailList[checkList[i].checkIdx] && checkList[i].actionObj.detailList[checkList[i].checkIdx][checkList[i].elName] && checkList[i].actionObj.detailList[checkList[i].checkIdx][checkList[i].elName][checkList[i].detailType])) continue;
                for (var ji = 0, jl = apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx][checkList[i].elName][checkList[i].detailType].length; ji < jl; ji++) {
                    if (checkList[i].name == apf.uirecorder.capture.$actionList[checkList[i].actionIdx].detailList[checkList[i].checkIdx][checkList[i].elName][checkList[i].detailType][ji].name) {
                        delete apf.uirecorder.playback.$waitForList[i];
                        i--;
                        l--;
                        break;
                    }
                }
                if (!checkList[i+1]) break;
            }
        }
        
        
        // no more waitFor checks, continue playback
        if (!checkList.length) {
            clearInterval(apf.uirecorder.playback.$waitForInterval);
            apf.uirecorder.playback.playAction();
            apf.dispatchEvent("aftertestwaiting");
        }
    },
    
    // init playback of action
    $playAction : function() {
        if (apf.uirecorder.isPaused) return;

        // no actions to execute
        var moreActions = (this.$playSpeed == "realtime") 
            ? this.$curTestXml.childNodes[this.$curActionIdx]
            : this.$keyActions[this.$curActionIdx];

        if (!moreActions) {
            this.$nextAction();
            return;
        }
        this.$curAction = (this.$playSpeed == "realtime") ? this.$curTestXml.childNodes[this.$curActionIdx] : this.$keyActions[this.$curActionIdx];
        if (!this.$curAction) debugger;

        // display warnings if any
/*
TEMPORARILY DISABLED
        if (this.$warningList.length && this.$curAction.getAttribute("name") != "mouseup") {
            apf.console.info("testwarning on: " + this.$curAction.getAttribute("keyActionIdx") + ". " + this.$curAction.getAttribute("name"));
            this.$activeEl = (apf.activeElement) ? apf.activeElement : null;
            apf.dispatchEvent("testwarning", {warnings: this.$warningList});
            this.$warningList = [];
            return;
        }
*/
        // wait for events before continuing
        if (this.$waitForList.length) {
            this.$waitForStartTime = new Date().getTime();
            apf.dispatchEvent("beforetestwaiting");
            this.$waitForInterval = setInterval(this.$waitForChecks, 50);
            return;
        }
        // skip non-keyactions actions
        //if (this.$curAction.getAttribute("keyActionIdx") == undefined)
            //this.$nextAction();
        
        if (this.$playSpeed == "max") {
            if (this.$curAction.getAttribute("name") == "keypress") {
                for (var i = this.$curActionIdx, l = this.$keyActions.length; i < l; i++) {
                    if (this.$keyActions[i].getAttribute("name") != "keypress") {
                        break;
                    }
                    this.$keyString += this.$keyActions[i].getAttribute("value");
                }

                if (this.$keyString != "") {
                    i--;
                    this.$speedUpTime = parseInt(this.$keyActions[i].getAttribute("time")) - parseInt(this.$curAction.getAttribute("time"));
                    this.$curActionIdx = i;
                    this.$curAction = this.$keyActions[i];
                }
            }
        }
        
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
            }, 200);
        }
        
    },

    // get amlNode based on saved xml node
    $getAmlNode : function(amlNodeXml) {
        //amlNode with id
        var amlNode;
        if (amlNodeXml.getAttribute("id")) {
            amlNode = apf.document.getElementById(amlNodeXml.getAttribute("id"));
            return amlNode;
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
            amlNode = apf.document.selectSingleNode(amlNodeXml.getAttribute("xpath"));
        }
        
        return amlNode;
    },
    
    $execAction : function() {
        if (!apf.uirecorder.isPlaying) return;
        // detect position of amlNode
        var amlNodeXml, original = {}, targetNode = null;
        if (amlNodeXml = this.$curAction.selectSingleNode("amlNode")) {
            if (this.$curAction.getAttribute("target") == "position") {
                //debugger;
            }
            else {
                var amlNode, htmlNode;

                original = {
                    x       : parseInt(amlNodeXml.getAttribute("x")),
                    y       : parseInt(amlNodeXml.getAttribute("y")),
                    width   : parseInt(amlNodeXml.getAttribute("width")),
                    height  : parseInt(amlNodeXml.getAttribute("height"))
                };

                var amlNode = this.$getAmlNode(amlNodeXml);
                if (!amlNode) {
                    // no amlNode found!
                    this.$testError("amlNode " + (amlNodeXml.getAttribute("id") || ((amlNodeXml.getAttribute("caption") ? amlNodeXml.getAttribute("tagName") + " " + amlNodeXml.getAttribute("caption") : amlNodeXml.getAttribute("xpath")))) + " not found");
                    return;
                }
                // amlNode not visible
                
                else if (amlNode.visible == false || ((amlNode.localName && amlNode.localName != "body" || !amlNode.localName) && amlNode.$ext.offsetTop == 0 && amlNode.$ext.offsetLeft == 0 && amlNode.$ext.offsetWidth == 0 && amlNode.$ext.offsetHeight == 0)) {
                    this.$testError("amlNode " + (amlNodeXml.getAttribute("id") || ((amlNodeXml.getAttribute("caption") ? amlNodeXml.getAttribute("tagName") + " " + amlNodeXml.getAttribute("caption") : amlNodeXml.getAttribute("xpath")))) + " not visible");
                    return;
                }
                
                targetNode = amlNode.$ext;
                // htmlNode of amlNode
                // multiselect selection
                
                var targetCentre = false;
                if (amlNodeXml.getAttribute("multiselect") == "true") {
                    var selectedXml;
                    if (selectedXml = amlNodeXml.selectSingleNode("selected")) {
                        var xmlNode;
                        if (amlNodeXml.getAttribute("type") == "dropdown" && this.$keyActions[parseInt(this.$curAction.getAttribute("keyActionIdx"))-1]) {
                            original = null;
                            
                            if (amlNodeXml.getAttribute("popup") && apf.popup.last) {
                                targetCentre = true;
                                var dropdownItems = apf.popup.cache[apf.popup.last].content.childNodes
                                for (var i = 0, l = dropdownItems.length; i < l; i++) {
                                    if (dropdownItems[i].innerHTML == selectedXml.getAttribute("value")) {
                                        htmlNode = dropdownItems[i];
                                        break;
                                    }
                                }
                            }
                            else {
                                htmlNode = "lastMousePosition";
                            }
                        }
                        else {
//                            if (this.$curAction.getAttribute("name") == "mouseup");
                            original = {
                                x       : parseInt(selectedXml.getAttribute("x")),
                                y       : parseInt(selectedXml.getAttribute("y")),
                                width   : parseInt(selectedXml.getAttribute("width")),
                                height  : parseInt(selectedXml.getAttribute("height"))
                            };

                            if (amlNodeXml.selectSingleNode("selected").getAttribute("value")) {
                                xmlNode = amlNode.findXmlNodeByValue(amlNodeXml.selectSingleNode("selected").getAttribute("value"));
                            }
                            if (!xmlNode && amlNodeXml.selectSingleNode("selected").getAttribute("xpath")) {
                                xmlNode = amlNode.queryNode(amlNodeXml.selectSingleNode("selected").getAttribute("xpath"));
                            }

                            // no xmlNode found
                            if (!xmlNode) {
                                this.$testError("Node with xpath \"" + amlNodeXml.selectSingleNode("selected").getAttribute("xpath") + "\" does not exist");
                                return;
                            }

                            htmlNode = apf.xmldb.findHtmlNode(xmlNode, amlNode);
                        }
                        
                        // no htmlNode found
                        if (!htmlNode) {
                            this.$testError("No htmlnode found for xpath: " + amlNodeXml.selectSingleNode("selected").getAttribute("xpath"));
                            return;
                        }
                        
                        targetNode = htmlNode;
                    }
                }
                // activeElements
                else if (amlNodeXml.getAttribute("activeElement") == "true") {
                    var activeElementXml;
                    if (activeElementXml = amlNodeXml.selectSingleNode("activeElement")) {
                        original = {
                            x       : parseInt(activeElementXml.getAttribute("x")),
                            y       : parseInt(activeElementXml.getAttribute("y")),
                            width   : parseInt(activeElementXml.getAttribute("width")),
                            height  : parseInt(activeElementXml.getAttribute("height"))
                        };

                        htmlNode = amlNode.$getActiveElements()[activeElementXml.getAttribute("name")];
                        targetNode = htmlNode;
                        //debugger;
                    }
                }
                if (amlNodeXml.getAttribute("dropTarget") == "true") {
                    var dropXml;
                    if (dropXml = amlNodeXml.selectSingleNode("dropTarget")) {
                        original = {
                            x       : parseInt(dropXml.getAttribute("x")),
                            y       : parseInt(dropXml.getAttribute("y")),
                            width   : parseInt(dropXml.getAttribute("width")),
                            height  : parseInt(dropXml.getAttribute("height"))
                        };

                        var amlNode = this.$getAmlNode(dropXml);
                        targetNode = amlNode.$ext;
                    }
                }
            }
        }
        else if (htmlElementXml = this.$curAction.selectSingleNode("htmlElement")) {
            var htmlElement;

            original = {
                x       : parseInt(htmlElementXml.getAttribute("x")),
                y       : parseInt(htmlElementXml.getAttribute("y")),
                width   : parseInt(htmlElementXml.getAttribute("width")),
                height  : parseInt(htmlElementXml.getAttribute("height"))
            };
            
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
            
            targetNode = htmlElement;
        }
        
        // calculate mouse position
        var mousePos;
        if (targetNode) {
            if (targetNode != "lastMousePosition") {
                mousePos = apf.getAbsolutePosition(targetNode, document.body);

                if (original) {
                    mousePos[0] = mousePos[0] - (original.x-parseInt(this.$curAction.getAttribute("x"))) * (targetNode.offsetWidth/original.width);
                    mousePos[1] = mousePos[1] - (original.y-parseInt(this.$curAction.getAttribute("y"))) * (targetNode.offsetHeight/original.height);
                }
                else if (targetCentre) {
                    mousePos[0] = mousePos[0] + targetNode.offsetWidth/2;
                    mousePos[1] = mousePos[1] + targetNode.offsetHeight/2;
                }
                
                this.$lastMousePosition = mousePos;
            }
            else {
                mousePos = this.$lastMousePosition;
            }
        }
        
        if (mousePos == undefined) {
            mousePos = [parseInt(this.$curAction.getAttribute("x")), parseInt(this.$curAction.getAttribute("y"))];
        }
        
        // move mouse cursor to correct position
        // ssb
        if (window.external.o3) { //apf.uirecorder.$o3.window
            //apf.console.info(this.$curAction.getAttribute("name") + " moved");
            apf.uirecorder.$o3.mouseTo(
                parseInt(mousePos[0]) + apf.uirecorder.$o3.window.clientX + this.$windowOffset.left, 
                parseInt(mousePos[1]) + apf.uirecorder.$o3.window.clientY + this.$windowOffset.top, 
                window.external.o3 //apf.uirecorder.$o3.window
            );
        }
        // browser plugin
        else {
            apf.uirecorder.$o3.mouseTo(
                parseInt(mousePos[0]) + this.$windowOffset.left, 
                parseInt(mousePos[1]) + this.$windowOffset.top, 
                apf.uirecorder.$o3.window
            );
        }

        // execute action
        var aName;
        if ((aName = this.$curAction.getAttribute("name")) === "keypress") {
            // check if correct element is active/focussed for typing text
            if (amlNode && ["text", "textbox", "textarea"].indexOf(amlNode.localName) > -1 && apf.activeElement != amlNode) {
                this.$testError("Keypress action not executed on element " + (amlNodeXml.getAttribute("id") || ((amlNodeXml.getAttribute("caption") ? amlNodeXml.getAttribute("tagName") + " " + amlNodeXml.getAttribute("caption") : amlNodeXml.getAttribute("xpath")))));
                return;
            }
            if (this.$keyString) {
                apf.uirecorder.$o3.sendAsKeyEvents(this.$keyString);
                this.$keyString = "";
            }
            else
                apf.uirecorder.$o3.sendAsKeyEvents(this.$curAction.getAttribute("value"));
        }
        else if (aName === "keydown") {
            apf.uirecorder.$o3.sendKeyDown(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (aName === "keyup") {
            apf.uirecorder.$o3.sendKeyUp(parseInt(this.$curAction.getAttribute("value")));
        }
        else if (aName === "mousedown") {
            apf.uirecorder.$o3.mouseLeftDown();
        }
        else if (aName === "mouseup") {
            apf.uirecorder.$o3.mouseLeftUp();
        }
        else if (aName === "dblClick") {
            apf.uirecorder.$o3.mouseLeftDown();
            apf.uirecorder.$o3.mouseLeftUp();
            apf.uirecorder.$o3.mouseLeftDown();
            apf.uirecorder.$o3.mouseLeftUp();
        }
        else if (aName === "mousescroll") {
            apf.uirecorder.$o3.mouseWheel(this.$curAction.getAttribute("value"));
        }
apf.console.info(aName + " executed");
        this.$nextAction();
    },
    
    $nextAction : function() {
        // perform next action
        var moreActions = (this.$playSpeed == "realtime") 
            ? this.$curTestXml.childNodes[this.$curActionIdx+1]
            : this.$keyActions[this.$curActionIdx+1];
            
        if (moreActions) {
            this.$curActionIdx++;
            this.$playAction();
        }
        // stop playback
        else {
            // display warnings if any
/*
TEMPORARILY DISABLED
            if (this.$warningList.length && this.$curAction.getAttribute("name") != "mousedown") {
                apf.dispatchEvent("testwarning", {warnings: this.$warningList});
                this.$warningList = [];
                return;
            }
*/
            setTimeout(function() {
                apf.uirecorder.playback.stop();
                apf.dispatchEvent("testcomplete");
            }, 500);
        }
    },
    
    $testError : function(msg) {
        apf.console.error("Playback failed: " + msg);
        this.stop();
        apf.dispatchEvent("testerror", {msg: msg});
    }
}
//#endif