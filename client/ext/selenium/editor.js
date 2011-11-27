/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*
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

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/selenium/editor.xml");
var proxyTemplate = require("text!ext/selenium/proxy.html");
var editors = require("ext/editors/editors");
var fs = require("ext/filesystem/filesystem");
var testpanel = require('ext/testpanel/testpanel');
var selenium = require('ext/selenium/selenium');

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
        
        if (!doc.isSeleniumInited) {
            doc.addEventListener("prop.value", function(e) {
                if (this.editor != _self)
                    return;
                
                try {
                    var json = JSON.parse(e.value);
                }
                catch(e) {
                    dgUiRecorder.setAttribute("empty-message", 
                        "Could not load test: " + e.message);
                    dgUiRecorder.clear();
                    
                    return;
                }
    
                var xml = _self.convertToXml(json);
                _self.model.load(xml);
                
                doc.seleniumXml = xml;
                doc.isInited = true;
            });
            
            doc.addEventListener("retrievevalue", function(e) {
                if (this.editor != _self)
                    return;

                if (!doc.isInited) 
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
            
            doc.isSeleniumInited = true;
        }

        //Switch from an other editor
        if (doc.editor && doc.editor != this) {
            var value = doc.getValue();
            if (JSON.stringify(_self.getTests(), null, '    ') !== value) {
                doc.editor = this;
                doc.dispatchEvent("prop.value", {value : value});
            }
        }
        //First time load
        else if (!doc.editor) {
            doc.editor = this;
        }
        //Reloading into this editor
        else {
            if (_self.model.data != doc.seleniumXml)
                _self.model.load(doc.seleniumXml);
        }
    },

    hook : function() {
    },

    init : function(amlPage) {
        ide.dispatchEvent("init.testrunner");
        
        amlPage.appendChild(mainUiRecorder);
        mainUiRecorder.show();
        
        this.editor = mainUiRecorder;
        
        var _self = this;
        window.addEventListener("message", function(e) {
//            if (e.origin !== brSeleniumPreview.$browser.contentWindow.location.origin)
//                return;
            
            try {
                var json = typeof e.data == "string" ? JSON.parse(e.data) : e.data;
            } catch (e) {
                return;
            }
        
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
            
        }, false);
        
        ide.addEventListener("selenium.record", function(e){
            var nr = _self.model.queryNodes("test").length + 1;
            var doc = _self.model.data.ownerDocument;
            
            var testNode = doc.createElement("test");
            testNode.setAttribute("name", "Test recording " + nr);
            
            testNode = dgUiRecorder.add(testNode, dgUiRecorder.xmlRoot);
            
            var url = brSeleniumPreview[useProxy ? "proxy-source" : "src"];
            if (url && _self.findUrl(_self.model.queryNode("test[last()]")) != url)
                _self.getNewUrl(brSeleniumPreview[useProxy ? "proxy-source" : "src"]);
            
            //dgUiRecorder.select(testNode);
        });
        ide.addEventListener("selenium.stop", function(e){
            var nodes = _self.model.queryNodes("test[last()]/action");
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].setAttribute("json", 
                    JSON.stringify(e.actions[nodes[i].getAttribute("index")]));
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
            
            _self.model.appendXml(assertNode, "test[last()]/action[@index=" + index + "]");
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
        
        ide.addEventListener("hidemenu", function(e){
            _self.hidePropertyMenu(e);
        });
        ide.addEventListener("showmenu", function(e){
            _self.showPropertyMenu(e);
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
                this.setValue(brSeleniumPreview[useProxy ? "proxy-source" : "src"]);
        });
        
        brSeleniumPreview.addEventListener(useProxy ? "prop.proxy-source" : "load", function(e){
            tbUiRecordLoc.setValue(e.value || e.href);
            uiRecordLoadingIndicator.hide();
            
            _self.currentLocation = e.value || e.ref;
        });
        
        var updateUrl;
        dgUiRecorder.addEventListener("afterselect", updateUrl = function(){
            if (dgUiRecorder.selected) {
                var value = _self.findUrl(dgUiRecorder.selected);
                
                if (value)
                    _self.loadUrl(value);
            }
        });
        dgUiRecorder.addEventListener("xmlupdate", updateUrl);
        
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
    },
    
    run : function(){
        if (!this.model.queryNodes("test").length)
            return;
        
        if (!this.statusColumn) {
            colUiRecorder.setAttribute("width", "60%");
            this.statusColumn = new apf.BindingColumnRule({
                caption : "Status", 
                width   : "40%", 
                value   : "[@status-message]"
            })
            dgUiRecorder.appendChild(this.statusColumn);
        }
        
        stTestRun.activate();
        
        selenium.runSeleniumData(this.model.data, this.getTests(), function(){
            stTestRun.deactivate();
        });
    },
    
    findUrl : function(xmlNode){
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
        var host = this.findUrl(dgUiRecorder.selected).replace(/(https?:\/\/[^\/]+(?:\/workspace)?)\/.*$/, "$1");
        return host + "/.c9.proxy.html";
    },

    inject : function() {
        this.connected = 0;
        
        var value = location.origin + "/static/ext/selenium/injection.js";
        var _self = this;
        
        if (useProxy) {
            var inject = function(){
                _self.target.postMessage(JSON.stringify({
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
            elScript = this.target.document.createElement("script");
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
        
        if (this.currentLocation != value)
            uiRecordLoadingIndicator.show();
        
        if (useProxy) {
            if (this.getProxyUrl() != brSeleniumPreview.src)
                this.proxyLoaded = false;
            
            if (this.proxyLoaded) {
                this.target.postMessage(JSON.stringify({
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
            return "bullet_red.png";
    },
    
    execute : function(cmd, arg1){
        this.target.postMessage(JSON.stringify({
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
    
    startAddAssert : function(){
        this.execute("startAddAssert");
        
        barUiRecorder.disable();
    },
    
    stopAddAssert : function(){
        this.execute("stopAddAssert");
        
        barUiRecorder.enable();
    },
    
    highlightElement : function(e) {
        var xmlNode = apf.xmldb.findXmlNode(e.htmlEvent.srcElement || e.htmlEvent.target);
        if (!xmlNode)
            return;
        
        var url = this.findUrl(xmlNode);
        if (url != brSeleniumPreview[useProxy ? "proxy-source" : "src"])
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
                
                apf.xmldb.appendChild(node, assert);
                
                dgUiRecorder.select(assert);
            }
            
            ui.stopAddAssert();
        });
        
        var props = e.props;
        for (var prop, i = 0; i < props.length; i++) {
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
        
        var sp = new SeleniumPlayer();
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
        var xml = apf.getXml("<tests />");
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
