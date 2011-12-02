/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*
    Saving in the code editor doesn't work:
                {
            "name": "get",
            "value": "http://127.0.0.1:5001/workspace/support/apf/tabs.html",
            "properties": []
        },

    Ideas:
        * Hover over the datagrid highlights the element it pertains
        * Easily remove and add assertions/actions
            * add assertion by picking element
            * then present datagrid of properties in context menu style
            * check one or more properties
            * allow to change the value in assertion datagrid
        * drag&drop assertions and actions
        * instead of dividers, make them headings and allow for rename to set test name
            * parent element instead of divider
            * default the name "Recorded Test 1"
        * hide and show advanced view
        * load previous tests
        * Allow to easily play tests locally or on saucelabs
            * The latter should show a movie
            * and make assertions green/red - also should scroll dg
        - Locally play test to return to state
        - Context Menu
            - Play until here
            - Play this test
            - copy/paste/cut/duplicate
        * Run should be disabled until a test is loaded/recorded
        * Datagrid needs drag indicators (seemed to have some before)
        - Datagrid should automatically scroll down during recording, unless
          the user scrolled it up manually
        * Multiselect drag&drop
        
    Bug:
        - Datagrid + textbox editing doesnt work (2nd time broken, skin bad)
        * Update element of action after drag&drop
        - After drag&drop the datagrid isnt expanded
        - After assertion (disabling all children) the dynamic props are gone
        - double clicking also registers the mouseup and down

*/
 
define(function(require, exports, module) {

var util = require("core/util");
var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/selenium/editor.xml");
var proxyTemplate = require("text!ext/selenium/proxy.html");
var editors = require("ext/editors/editors");
var settings = require("ext/settings/settings");
var fs = require("ext/filesystem/filesystem");
var testpanel = require('ext/testpanel/testpanel');
var selenium = require('ext/selenium/selenium');
var UiRecorderToWD = require("ext/selenium/converter");

var useProxy = true;

module.exports = ext.register("ext/selenium/editor", {
    name    : "Selenium Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    markup  : markup,
    deps    : [editors],

    fileExtensions : ["stest"],
    
    nodes : [],

    setDocument : function(doc, actiontracker){
        //doc.session = doc.getNode().getAttribute("path");

        var _self = this;
        
        if (!doc.hasSeleniumEvents) {
            doc.addEventListener("prop.value", function(e) {
                if (this.editor != _self)
                    return;
                
                try {
                    var json = e.value && JSON.parse(e.value) || {};
                }
                catch(e) {
                    dgUiRecorder.setProperty("empty-message", 
                        "Could not load test: " + e.message);
                    _self.model.clear();
                    
                    return;
                }
                
                dgUiRecorder.setProperty("empty-message", "No tests yet");
    
                var xml = _self.convertToXml(json);
                _self.model.load(xml);
                
                doc.seleniumXml = xml;
                doc.isSeleniumInited = true;
            });
            
            doc.addEventListener("retrievevalue", function(e) {
                if (this.editor != _self)
                    return;

                if (!doc.isSeleniumInited) 
                    return e.value;
                else 
                    return JSON.stringify(_self.getTests(), null, '    ');
            });
            
            doc.addEventListener("close", function(){
                if (this.editor != _self)
                    return;
                
                if (_self.model.data == doc.seleniumXml)
                    _self.model.clear();
                doc.seleniumXml = null;
            });
            
            doc.addEventListener("validate", function(e){
                if (this.editor != _self) {
                    try {
                        JSON.parse(this.dispatchEvent("retrievevalue"));
                    }
                    catch(err) {
                        return err.message;
                    }
                }
                
                return true;
            })
            
            doc.hasSeleniumEvents = true;
        }

        //Switch from an other editor
        if (doc.editor && doc.editor != this) {
            var value = doc.getValue();
            if (!dgUiRecorder.xmlRoot
              || JSON.stringify(_self.getTests(), null, '    ') !== value) {
                doc.editor = this;
                doc.dispatchEvent("prop.value", {value : value});
            }
        }
        //Reloading into this editor
        else if (doc.editor) {
            if (!dgUiRecorder.xmlRoot || _self.model.data != doc.seleniumXml)
                _self.model.load(doc.seleniumXml);
        }
        else {
            doc.editor = this;
            if (doc.value)
                doc.dispatchEvent("prop.value", {value : doc.value});
        }
        
        doc.editor = this;
    },

    hook : function() {
    },

    init : function(amlPage) {
        ide.dispatchEvent("init.testrunner");
        
        amlPage.appendChild(mainUiRecorder);
        mainUiRecorder.show();
        
        this.editor = mainUiRecorder;
        
        [{n: "colname", v: true, w: "40%"},
         {n: "colvalue", v: true, w: "60%"}, 
         {n: "colelement", v: false, w: "33%"},
         {n: "colstatus", v: false, w: "40%"}].forEach(function(col){
            var model = settings.model;
            var xpath = "editors/uirecorder/" + col.n;
            if (!model.queryNode(xpath)) {
                model.setQueryValue(xpath + "/@visible", col.v);
                model.setQueryValue(xpath + "/@width", col.w);
            }
        });
        
        var _self = this;
        window.addEventListener("message", function(e) {
//            if (e.origin !== brSeleniumPreview.$browser.contentWindow.location.origin)
//                return;

            try {
                var json = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
            } catch (e) {
                return;
            }

            //Receive from Child
            if (json.to == _self.uniqueId) {
                switch (json.type) {
                    case "pong":
                        _self.pong();
                        break;
                    case "event":
                        ide.dispatchEvent("selenium." + json.name, json.event);
                        break;
                    case "load":
                    case "error":
                        //brSeleniumPreview.dispatchEvent(json.type, {href: json.href});
                        brSeleniumPreview.setProperty("proxy-source", json.href);
                        _self.inject();
                        break;
                }
            }
            
        }, false);
        
        this.uniqueId = Math.random();
        var t = location.href.match(/c9proxyid=(.*?)(?:$|\&)/);
        this.parentUniqueId = t && t[1] || -1;
        
        ide.addEventListener("selenium.record", function(e){
            var nr = _self.model.queryNodes("test").length + 1;
            var doc = _self.model.data.ownerDocument;
            
            var testNode = doc.createElement("test");
            testNode.setAttribute("name", "Test recording " + nr);
            
            testNode = dgUiRecorder.add(testNode, dgUiRecorder.xmlRoot);
            
            var url = _self.getChildUrl();
            if (url && _self.findUrl(_self.model.queryNode("test[last()]")) != url)
                _self.getNewUrl(_self.getChildUrl());
            
            //dgUiRecorder.select(testNode);
        });
        ide.addEventListener("selenium.stop", function(e){
            if (!e.actions)
                return;
            
            var json, nodes = _self.model.queryNodes("test[last()]/action");
            for (var i = 0; i < nodes.length; i++) {
                json = e.actions[nodes[i].getAttribute("index")];
                if (json)
                    nodes[i].setAttribute("json", JSON.stringify(json));
            }
        });
        ide.addEventListener("selenium.action", function(e){
            if (e.stream.name == "mousemove")
                return;
            
            var doc = _self.model.data.ownerDocument;
            var actionNode = doc.createElement("action");
            actionNode.setAttribute("name", e.stream.name);
            actionNode.setAttribute("element", JSON.stringify(e.stream.element));
            actionNode.setAttribute("index", e.streamIndex);
            actionNode.setAttribute("value", e.stream.value || "");
            _self.model.appendXml(actionNode, "test[last()]");
            
            if (e.stream.name == "dblclick") {
                var nodes = _self.model.queryNodes("test[last()]/action");
                var assertNodes;
                for (var i = nodes.length - 2; i >= nodes.length - 5; i--) {
                    apf.xmldb.setAttribute(nodes[i], "dblclick", "1");
                    assertNodes = nodes[i].selectNodes("assert");
                    for (var j = assertNodes.length - 1; j >= 0; j--) {
                        apf.xmldb.appendChild(actionNode, assertNodes[j]);
                    }
                }
            }
        });
        ide.addEventListener("selenium.capture.http", function(e){
            
        });
        ide.addEventListener("selenium.capture.prop", function(e){
            if (!e.stream.name || e.stream.name == "mousemove")
                return;
        
            if (JSON.stringify(e.prop.value).indexOf("Could not serialize") > -1)
                return;
        
            var doc         = _self.model.data.ownerDocument;
            var index       = e.streamIndex;
            
            var assertNode  = doc.createElement("assert");
            assertNode.setAttribute("element", JSON.stringify(e.prop.element));
            assertNode.setAttribute("name", e.prop.name);
            assertNode.setAttribute("value", JSON.stringify(e.prop.value));
            assertNode.setAttribute("json", JSON.stringify(e.prop));
            
            var pNode = _self.model.queryNode("test[last()]/action[@index=" + index + "]");
            if (pNode.getAttribute("dblclick")){
                pNode = pNode.selectSingleNode("following-sibling::action[@name='dblclick']");
            }
            apf.xmldb.appendChild(pNode, assertNode);
        });
        ide.addEventListener("selenium.capture.event", function(e){
            if ("dragstop|dragdrop".indexOf(e.event.name) > -1) {
                _self.model.setQueryValue("test[last()]/action[@index=" 
                  + e.streamIndex + "]/@element", 
                    JSON.stringify(e.stream.element));
            }
        });
        ide.addEventListener("selenium.capture.data", function(e){
            
        });
        
        ide.addEventListener("selenium.hidemenu", function(e){
            _self.hidePropertyMenu(e);
        });
        ide.addEventListener("selenium.showmenu", function(e){
            _self.showPropertyMenu(e);
        });
        
        ide.addEventListener("afteroffline", function(){
            btnTestRunInSelEditor.disable();
            _self.stopPlayback();
        });
        
        ide.addEventListener("afteronline", function(){
            btnTestRunInSelEditor.enable();
        });
        
        this.model = new apf.model();
        this.model.$ignoreRecorder = true;
        this.model.load("<tests></tests>");
        
        dgUiRecorder.setModel(this.model);
        
        this.iframe = brSeleniumPreview.$browser;
        this.target = this.iframe.contentWindow;
        
        if (!useProxy) {
            brSeleniumPreview.addEventListener("load", function(e){
                _self.inject();
            });
        }
        //else
            //this.inject();
        
        /**** Preview ****/
        
        tbUiRecordLoc.addEventListener("keydown", function(e){
            if (event.keyCode == 13) {
                _self.loadUrl(this.value);
            }
            else if (event.keyCode == 27) 
                this.setValue(_self.getChildUrl());
        });
        
        brSeleniumPreview.addEventListener(useProxy ? "prop.proxy-source" : "load", function(e){
            var value = (e.value || e.href)
                .replace(/[&|\?]c9proxyid=.*?(?:\&|$)/, "");
            tbUiRecordLoc.setValue(value);
            uiRecordLoadingIndicator.hide();
            
            _self.currentLocation = value;
        });
        
        var updateUrl;
        dgUiRecorder.addEventListener("afterselect", updateUrl = function(){
            if (dgUiRecorder.selected && !_self.isRecording) {
                var value = _self.findUrl(dgUiRecorder.selected);
                
                if (value)
                    _self.loadUrl(value);
            }
        });
        dgUiRecorder.addEventListener("xmlupdate", updateUrl);
        
        ide.addEventListener("test.pointer.selenium", function(e){
            dgUiRecorder.scrollIntoView(e.xmlNode);
        });
        
        //Another.Earth.2011.BRRip.XviD-playXD.avi
        
        /**** Play button ****/
        
        btnTestRunInSelEditor.addEventListener("click", function(){
            ext.initExtension(testpanel);
            
            var w = testpanel.$lastWidth;
            testpanel.disable();
            testpanel.$lastWidth = w;
            
            //btnTestRunInSelEditor.setAttribute("submenu", "mnuRunSettings");
            //btnTestRunInSelEditor.setAttribute("disabled", "{!(stTestRun.active or !dgUiRecorder.selected)}");
            
            btnTestRunInSelEditor.removeEventListener("click", arguments.callee);
        });
        
        btnUiRecordStart.addEventListener("click", function(){
            if (!stTestRecord.active) 
                _self.start();
            else 
                _self.stop();
        });
        
        vboxUiRecorder.appendChild(new apf.splitter({
            visible : "{flSeleniumEditMovie.visible}"
        }));
        
        vboxUiRecorder.appendChild(selenium.createFlashPlayer("dgUiRecorder", "flSeleniumEditMovie"));
        
        flSeleniumEditMovie.setAttribute("margin", "3 0 0 0");
    },
    
    run : function(){
        if (!this.model.queryNodes("test").length)
            return;
        
        mnuRunSettings.hide();
        
        if (!this.statusColumn)
            colUiRecorder4.show();
        
        var cleanUp = this.model.queryNodes("//error");
        for (var i = cleanUp.length - 1; i >= 0; i--) {
            apf.xmldb.removeNode(cleanUp[i]);
        }
        
        cleanUp = this.model.queryNodes("//node()[@status]");
        for (var i = 0; i < cleanUp.length; i++) {
            apf.xmldb.removeAttribute(cleanUp[i], "status");
            apf.xmldb.removeAttribute(cleanUp[i], "status-message");
        }
        
        stTestRun.activate();
        
        selenium.runSeleniumData(this.model.data, this.getTests(), function(){
            stTestRun.deactivate();
        });
    },
    
    stopPlayback : function(){
        if (!stTestRun.active)
            return;
            
        var _self = this;
        
        ide.addEventListener("selenium.stopped", function(e){
            stTestRun.deactivate();
            btnTestStopInSelEditor.enable();
            
            clearTimeout(_self.$stopTimer);
            
            testpanel.setExecute();
            
            ide.removeEventListener("selenium.stopped", arguments.callee);
        });

        btnTestStopInSelEditor.disable();
        selenium.stop();
        
        clearTimeout(this.$stopTimer);
        this.$stopTimer = setTimeout(function(){
            ide.dispatchEvent("selenium.stopped");
        }, 10000);
    },
    
    getChildUrl : function(){
        return (brSeleniumPreview[useProxy ? "proxy-source" : "src"] || "")
                    .replace(/[&|\?]c9proxyid=.*?(?:\&|$)/, "")
    },
    
    findUrl : function(xmlNode){
        if (!xmlNode)
            return;
        
        if ("repo|file".indexOf(xmlNode.localName) > -1)
            return apf.queryValue(this.selected, ".//action[@name='get']/@value");
        
        var url, testNode = xmlNode.selectSingleNode("ancestor-or-self::test");
        while (!url && testNode) {
            url = apf.queryValue(testNode, "action[@name='get']/@value");
            if (!url)
                testNode = testNode.selectSingleNode("preceding-sibling::test");
        }
        
        return url;
    },
    
    getProxyUrl : function(){
        var host = (dgUiRecorder.selected
          ? this.findUrl(dgUiRecorder.selected) || ""
          : tbUiRecordLoc.value || "")
            .replace(/(https?:\/\/[^\/]+)\/.*$/, "$1") + "/workspace"; //(?:\/workspace)?)
        return host + "/.c9.proxy.html?c9proxyid=" + this.uniqueId;
    },

    inject : function() {
        this.connected = 0;
        
        var value = location.origin + "/static/ext/selenium/injection.js";
        var _self = this;
        
        if (useProxy) {
            var inject = function(){
                _self.target.postMessage(JSON.stringify({
                    to   : _self.uniqueId,
                    type : "inject",
                    href : value
                }), "*");
                
                clearInterval(_self.$timer);
                _self.$timer = setInterval(function(){
                    _self.execute("ping");
                }, 100);
            };
            
            //If we can't access location.href the proxy is already there
            var proxyUrl = _self.getProxyUrl();
            
            if (brSeleniumPreview.src != proxyUrl) {
                fs.saveFile("/workspace/.c9.proxy.html", proxyTemplate, function(data, state, extra){
                    if (state == apf.SUCCESS) {
                        brSeleniumPreview.addEventListener("load", function(e){
                            inject();
                            
                            brSeleniumPreview.removeEventListener("load", arguments.callee);
                            
                            _self.proxyLoaded = true;
                            if (_self.lastUrlToLoad) {
                                _self.loadUrl(_self.lastUrlToLoad);
                                _self.lastUrlToLoad = null;
                            }
                        });
                        brSeleniumPreview.setAttribute("src", proxyUrl);
                    }
                    else {
                        throw new Error("Could not save proxy for Selenium testing");
                    }
                })
            }
            else
                inject();
        }
        else {
            var head = this.target.document.documentElement;
            var elScript = this.target.document.createElement("script");
            elScript.src = value;
            head.appendChild(elScript);
        
            clearInterval(this.$timer);
            this.$timer = setInterval(function(){
                _self.execute("ping");
            }, 100);
        }
    },
    
    loadUrl : function(value) {
        tbUiRecordLoc.setValue(value);
        
        if (this.currentLocation == value)
            return;
        
        uiRecordLoadingIndicator.show();
        
        if (useProxy) {
            if (this.getProxyUrl() != brSeleniumPreview.src)
                this.proxyLoaded = false;
            
            if (this.proxyLoaded) {
                this.target.postMessage(JSON.stringify({
                    to   : this.uniqueId,
                    type : "href",
                    href : value
                }), "*");
            }
            else {
                this.lastUrlToLoad = value;
                this.inject();
            }
        }
        else
            brSeleniumPreview.setAttribute('src', value);
    },
    
    getIcon : function(value){
        if (!value || value == -1)
            return "bullet_blue.png";
        else if (value == 5) //running
            return "bullet_go.png";
        else if (value == 1) //ran
            return "bullet_green.png";
        else if (value == 0) //error
            return "exclamation.png";//bullet_red.png";
    },
    
    execute : function(cmd, arg1){
        this.target.postMessage(JSON.stringify({
            to      : this.uniqueId,
            command : cmd,
            args    : [arg1]
        }), "*");
    },
    
    pong : function(){
        if (this.connected == 1)    
            return;
        
        this.connected = 1;
        clearInterval(this.$timer);
        
        if (this.isRecording)
            this.start();
    },
    
    start : function(){
        if (!brSeleniumPreview[useProxy ? "proxy-source" : "src"])
            return util.alert("Missing page",
                "Please load a page first",
                "Fill in a url to the page to test in the textbox and press enter");
        
        this.isRecording = true;
        stTestRecord.activate();
        
        if (this.connected == 2)
            return;
        
        //if (this.connected == 1 && !this.target.capture)
            //this.connected = 3;
        
        if (this.connected != 1) {
            this.inject();
            
            this.connected = 2;
            
            return;
        }
        
        this.execute("record");
    },
    
    stop : function(){
        this.execute("stop");
        
        this.isRecording = false;
        stTestRecord.deactivate();
    },
    
    getNewUrl : function(url){
        var doc = this.model.data.ownerDocument;
        var actionNode = doc.createElement("action");
        actionNode.setAttribute("name", "get");
        actionNode.setAttribute("value", url);
        
        this.model.appendXml(actionNode, "test[last()]");
    },
    
    assertMouse: function(){
        require("ext/selenium/editor").stopAddAssert();
    },
    assertKey: function(e){
        if (e.keyCode == 27)
            require("ext/selenium/editor").stopAddAssert();
    },
    
    startAddAssert : function(){
        this.execute("startAddAssert");
        
        apf.addListener(document, "mousedown", this.assertMouse);
        apf.addListener(document, "keydown", this.assertKey);
        
        //barUiRecorder.disable();
        btnUiRecordInsert.disable();
    },
    
    stopAddAssert : function(){
        this.execute("stopAddAssert");
        
        apf.removeListener(document, "mousedown", this.assertMouse);
        apf.removeListener(document, "keydown", this.assertKey);
        
        //barUiRecorder.enable();
        btnUiRecordInsert.enable();
    },
    
    addNewNode : function(tag, name){
        var lut = {
            'test': 'tests',
            'action' : 'test',
            'assert' : 'action'
        };
    
        var doc = this.model.data.ownerDocument;
        var el = doc.createElement(tag);
        if (name)
            el.setAttribute('name', name);
        
        var node  = dgUiRecorder.selected;
        var pNode = node.selectSingleNode('ancestor-or-self::' + lut[tag]);
            
        dgUiRecorder.add(el, pNode, node.parentNode == pNode ? node : null);
    },
    
    highlightElement : function(e) {
        var xmlNode = apf.xmldb.findXmlNode(e.htmlEvent.srcElement || e.htmlEvent.target);
        if (!xmlNode)
            return;
        
        var url = this.findUrl(xmlNode);
        if (url != this.getChildUrl())
            return;
        
        var element = xmlNode.getAttribute("element");
        if (!element)
            return;

        try { var elObj = JSON.parse(element); }catch(e){}
        if (!elObj)
            return;
        
        var json = xmlNode.getAttribute("json");
        elObj.json = json && JSON.parse(json);
        
        this.execute("highlightElement", elObj);
    },
    
    hideHighlightElements : function(){
        this.execute("hideHighlightElements");
    },
    
    hidePropertyMenu : function(){
        if (this.menu)
            this.menu.destroy(true, true);
    },
    
    showPropertyMenu : function(e){
        var ui = this;

        var element = e.element;
        
        this.menu = apf.document.body.appendChild(new apf.menu());
        this.menu.$ignoreRecorder = true;
        this.menu.addEventListener("itemclick", function(e){
            if (dgUiRecorder.selected) {
                var node = dgUiRecorder.selected;
                if (node.localName == "assert")
                    node = node.parentNode;
                var doc = node.ownerDocument;
                var assert = doc.createElement("assert");
                assert.setAttribute("name", e.relatedNode.caption);
                assert.setAttribute("value", JSON.stringify(e.relatedNode.value));
                assert.setAttribute("element", JSON.stringify(element));
                
                dgUiRecorder.add(assert, node);
                //apf.xmldb.appendChild(node, assert);
                
                //dgUiRecorder.select(assert);
            }
            
            ui.stopAddAssert();
        });
        
        var props = e.props;
        for (var i = 0; i < props.length; i++) {
            this.menu.appendChild(new apf.item({
                caption : props[i].caption,
                value   : props[i].value
            }));
        }
        
        var pos = apf.getAbsolutePosition(this.iframe);
        this.menu.display(pos[0] + e.x, pos[1] + e.y);
    },
    
    write : function(){
        var tests = this.getTests();
        
        //Write to server
        
        console.dir(tests);
    },
    
    getTests : function(compiled){
        var model = this.model;
        var nodes = model.queryNodes("test");
        
        var sp = new UiRecorderToWD();
        sp.realtime = false;
        
        var test, tests = {}, actions, action, asserts, assert, json;
        for (var i = 0; i < nodes.length; i++) {
            actions = apf.queryNodes(nodes[i], "action");
            
            test = [];
            for (var j = 0; j < actions.length; j++) {
                json = actions[j].getAttribute("json");
                action = json && JSON.parse(json) || {};
                action.name = actions[j].getAttribute("name");
                action.value = actions[j].getAttribute("value");
                
                action.properties = [];
                
                asserts = apf.queryNodes(actions[j], "assert");
                for (var k = 0; k < asserts.length; k++) {
                    json = asserts[k].getAttribute("json");
                    assert = json && JSON.parse(json) || {};
                    
                    assert.element = JSON.parse(asserts[k].getAttribute("element"))
                    assert.value   = JSON.parse(asserts[k].getAttribute("value")) //@todo potential problem with newlines in content
                    assert.name    = asserts[k].getAttribute("name"); 
                    
                    action.properties.push(assert);
                }
                
                test.push(action);
            }
            
            tests[nodes[i].getAttribute("name")] = !compiled ? test : sp.compile(test);
        }
        
        return tests;
    },
    
    convertToXml : function(tests) {
        var testNode, actionNode, assertNode;
        var test, action, name, property, propName;
        var xml = apf.getXml("<tests type='selenium' />");
        var doc = xml.ownerDocument;
        
        // Tests
        for (name in tests) {
            if (!name.match(/^test /i))
                continue;
            
            testNode = xml.appendChild(doc.createElement("test"));
            testNode.setAttribute("name", name);
            
            test = tests[name];
            
            // Actions
            for (var i = 0; i < test.length; i++) {
                action = test[i];
                
                actionNode = doc.createElement("action");
                actionNode.setAttribute("name", action.name);
                actionNode.setAttribute("element", JSON.stringify(action.element));
                actionNode.setAttribute("index", i);
                actionNode.setAttribute("value", action.value || "");
                actionNode.setAttribute("json", JSON.stringify(action));
                
                if (action.properties) {
                    for (var j = 0; j < action.properties.length; j++) {
                        property = action.properties[j];
                        
                        assertNode  = doc.createElement("assert");
                        assertNode.setAttribute("element", JSON.stringify(property.element));
                        assertNode.setAttribute("name", property.name);
                        assertNode.setAttribute("value", JSON.stringify(property.value));
                        assertNode.setAttribute("json", JSON.stringify(property));
                        
                        actionNode.appendChild(assertNode);
                    }
                }
                
                testNode.appendChild(actionNode);
            }
        }
        
        return xml;
    },
    
    enable : function() {
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        
        if (self.mainUiRecorder) {
            mainUiRecorder.destroy(true, true);
        }

        this.nodes = [];
    }
});

});
