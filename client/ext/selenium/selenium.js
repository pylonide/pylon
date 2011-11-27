/**
 * Test Panel for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("ext/settings/settings");
var panels = require("ext/panels/panels");
var fs = require("ext/filesystem/filesystem");
var newresource = require("ext/newresource/newresource");
var testpanel = require("ext/testpanel/testpanel");
var template = require("text!ext/selenium/selenium.template");
var markup = require("text!ext/selenium/selenium.xml");

function escapeXpathString(name){
    if (name.indexOf('"') > -1) {
        var out = [], parts = name.split('"');
        parts.each(function(part) {
            out.push(part == '' ? "'\"'" : '"' + part + '"');
        })
        return "concat(" + out.join(", ") + ")";
    }
    return '"' + name + '"';
}

module.exports = ext.register("ext/selenium/selenium", {
    name            : "Selenium Test Manager",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    nodes           : [],
    testpath        : "test/selenium",
    template        : template,
    markup          : markup,

    hook : function(){
        var _self = this;
        ide.addEventListener("init.ext/testpanel/testpanel", function(){
            ext.initExtension(_self);
            _self.initTestPanel();
        });
        
        ide.addEventListener("init.testrunner", function(){
            ext.initExtension(_self);
            
            ide.removeEventListener("init.testrunner", arguments.callee);
        });
    },

    init : function(amlNode) {
        var _self = this;
        
        var nodes = seleniumSettings.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            this.nodes.push(mnuRunSettings.appendChild(nodes[0]));
        }
        
        ide.addEventListener("test.expand.selenium", function(e){
            var xmlNode = e.xmlNode;
            _self.reloadTestFile(xmlNode);
        });
        
        ide.addEventListener("test.hardstop", function(e){
            //@todo clean up all events
        });
        
        ide.addEventListener("test.stop", function(e){
            if (!_self.running)
                return;
            _self.stop();
        });
        
        ide.addEventListener("test.icon.selenium", function(e){
            return "page_white_go.png";
        });
        
        ide.addEventListener("test.run.selenium", function(e){
            var nextFile = e.next;
            _self.run(e.xmlNode, function(){
                nextFile();
            });
        });
    },
    
    createFlashPlayer : function(dgName, playerName){
        return new apf.flashplayer({
            id         : playerName,
            margin     : "4",
            src        : "/static/ext/selenium/flowplayer-3.2.7.swf",
            flashvars  : 'config=\\{"playerId":"player","clip":\\{"url":"[{' 
                + dgName 
                + '.selected}::ancestor-or-self::file/@video]","autoPlay":false,"scaling":"fit"\\}\\}',
            height     : "100",
            visible    : "{!![{" + dgName + ".selected}::ancestor-or-self::file/@video]}",
            bgcolor    : "000000",
            allowfullscreen : "true"
        });
    },
    
    initTestPanel : function(){
        var _self = this;
        
        this.nodes.push(
            mnuFilter.insertBefore(new apf.item({
                type    : "radio",
                value   : "selenium",
                caption : "Selenium Tests"
            }), mnuFilter.getElementsByTagNameNS(apf.ns.aml, "divider")[1]),
            
            mnuTestNew.appendChild(new apf.item({
                caption : "Selenium Test",
                onclick : function(){
                    _self.createAndOpenTest();
                }
            })),
            
            vboxTestPanel.appendChild(new apf.splitter({
                visible : "{flSeleniumMovie.visible}"
            })),
            
            vboxTestPanel.appendChild(this.createFlashPlayer("dgTestProject", "flSeleniumMovie"))
        );
        
        fs.list("/workspace/" + this.testpath, function(data, state, extra){
            if (state == apf.ERROR) {
                if (data && data.indexOf("jsDAV_Exception_FileNotFound") > -1) {
                    return;
                }
                
                //@todo
                return;
            }
            if (state == apf.TIMEOUT)
                return; //@todo

            var xml = apf.getXml(data);
            var nodes = xml.selectNodes("file");
            for (var i = 0; i < nodes.length; i++) {
                nodes[i].setAttribute("type", "selenium");
                mdlTests.appendXml(nodes[i], "repo[1]");
            }
        });
        
        ide.addEventListener("afterfilesave", function(e){
            var node = e.node;
            var name = node.getAttribute("name");
            if (!name.match(/.stest$/))
                return;
            
            var path = node.getAttribute("path");
            var fileNode = mdlTests.queryNode("//file[@path=" + escapeXpathString(path) + "]");
            if (!fileNode) {
                fileNode = apf.xmldb.getCleanCopy(node);
                fileNode.setAttribute("type", "nodeunit");
                apf.xmldb.appendChild(testpanel.findParent(path), fileNode);
            }
        });
        
        ide.addEventListener("socketMessage", function(e) {
            if (_self.disabled) return;
            
            var message = e.message;
            if ((message.type && message.type != "watcher") || !message.path)
                return;
                
            var path = message.path.slice(ide.workspaceDir.length);
            
            if (path != _self.testpath)
                return;

            switch (message.subtype) {
                case "create":
                    //Add file to model
                    break;
                case "remove":
                    //Remove file from model
                    break;
                case "change":
                    //Reread file and put tests update in model
                    var xmlNode = mdlTests.selectSingleNode("//file[@path='" + message.path + "']");
                    _self.reloadTestFile(xmlNode);
                    break;
            }
        });
        
        this.enable();
    },
    
    run : function(fileNode, callback) {
        var _self = this;
        var path  = fileNode.getAttribute("path");
        
        _self.lastTestNode = fileNode;
        
        _self.running = true;
        _self.stopping = false; //@todo this shouldn't happen
        _self.jobId    = null;
        
        testpanel.setLog(fileNode, "reading");
        
        fs.readFile(path, function(data, state, extra){
            if (state == apf.SUCCESS) {
                try {
                    var testObject = JSON.parse(data);
                }
                catch(e) {
                    testpanel.setError(fileNode,
                        "Invalid JSON. Could not parse file format: "
                        + e.message);
                    
                    _self.running = false;
                    callback();
                    return;
                }
                
                _self.runSeleniumDefinition(fileNode, testObject, callback);
            }
            else {
                testpanel.setError(fileNode,
                    "Could not load file contents: " + extra.message);
                
                _self.running  = false;
                _self.stopping = false;
                
                if (!_self.stopping)
                    callback();
                
            }
        });
    },
    
    actionLookup : {
        "buttonDown" : "mousedown",
        "buttonUp"   : "mouseup",
        "doubleclick": "dblclick",
        "type"       : "keydown"
    },
    
    runSeleniumData : function(fileNode, testObject, callback) {
        var _self    = this;
        var sp       = new SeleniumPlayer();
        sp.realtime  = false;
        
        _self.running = true;
        _self.stopping = false; //@todo this shouldn't happen
        _self.jobId    = null;
        
        var tests = [];
        for (var prop in testObject) {
            if (prop.match(/^test /i))
                tests.push(prop);
        }
        
        var nodes = fileNode.selectNodes("test");
        if (!nodes.length) {
            dgTestProject.$setLoadStatus(fileNode, "loaded");
            _self.parseTestFile(data, fileNode);
            nodes = fileNode.selectNodes("test");
        }
        
        apf.asyncForEach(tests, function(name, nextTest, i){
            if (_self.stopping) {
                testpanel.setError(fileNode, "Test Cancelled");
                _self.stopped();
                return;
            }
            
            var actions  = testObject[name];
            var script   = sp.compile(actions);
            var testNode = nodes[i];
            var actionIndex = -1;
            var assertIndex = -1;
            
            _self.lastTestNode = testNode;

            testpanel.setLog(fileNode, "running test " + (i + 1) + " of " + tests.length);
            testpanel.setLog(testNode, "connecting");

            var data = {
                command : "selenium",
                argv    : ["selenium", script],
                line    : "",
                //cwd     : this.getCwd(),
                path    : testObject.url,
                close   : i == tests.length - 1,
                job     : _self.jobId,
                url     : testObject.url,
                
                where   : ddWhere.value,
                os      : ddSeOS.value,
                browser : ddSeBrowser.selected.getAttribute("value"),
                version : ddSeBrowser.selected.getAttribute("version")
            };

            ide.addEventListener("socketMessage", function(e){
                if (e.message.subtype == "selenium") {
                    var msg = e.message.body;

                    switch (msg.code) {
                        case 0:
                            testpanel.setError(testNode, msg.err);
                            testpanel.setError(fileNode, msg.err);
                            
                            ide.removeEventListener("socketMessage", arguments.callee);
                            if (_self.stopping)
                                _self.stopped();
                            else {
                                _self.running = false;
                                callback();
                            }
                            break;
                        case 1: //PASS .data[input | match]
                            var assertNode;
                            var actions = testNode.selectNodes("action");
                            if (actions.length) {
                                var actionNode = actions[actionIndex];
                                var asserts    = actionNode.selectNodes("assert");
                                
                                assertNode = asserts[++assertIndex];
                                if (asserts[assertIndex + 1])
                                    testpanel.setExecute(asserts[assertIndex + 1]);
                            }
                            else {
                                assertNode = 
                                  apf.queryNode(testNode, "assert[@input=" 
                                    + escapeXpathString(msg.data.input || "")
                                    + " and @match="
                                    + escapeXpathString(msg.data.match || "")
                                    + "]");
    
                                if (!assertNode) {
                                    assertNode = testNode.ownerDocument
                                        .createElement("assert");
                                    assertNode.setAttribute("name",
                                        msg.data.input + " == " + msg.data.match);
                                    assertNode.setAttribute("input",
                                        msg.data.input);
                                    assertNode.setAttribute("match",
                                        msg.data.match);
                                    apf.xmldb.appendChild(testNode, assertNode);
                                }
                            }
                            
                            if (assertNode)
                                testpanel.setPass(assertNode);
                            break;
                        case 2: //ERROR .data[input | match | measured]
                            if (_self.stopping)
                                return;
                                
                            var assertNode, actionNode, asserts;
                            var actions = testNode.selectNodes("action");
                            if (actions.length) {
                                actionNode = actions[actionIndex];
                                asserts    = actionNode.selectNodes("assert");
                                assertNode = asserts[assertIndex];
                            }
                                
                            if (typeof msg.data == "string") {
                                errorNode = testNode.ownerDocument
                                    .createElement("error");
                                errorNode.setAttribute("name", msg.data);
                                apf.xmldb.appendChild(testNode, errorNode, assertNode);
                                return;
                            }
                            
                            if (actions.length) {
                                if (asserts[assertIndex + 1])
                                    testpanel.setExecute(asserts[assertIndex + 1]);
                            }
                            else {
                                assertNode = 
                                  apf.queryNode(testNode, "assert[@input=" 
                                    + escapeXpathString(msg.data.input || "")
                                    + " and @match="
                                    + escapeXpathString(msg.data.match || "")
                                    + "]");
                                
                                if (!assertNode) {
                                    assertNode = testNode.ownerDocument
                                        .createElement("assert");
                                    assertNode.setAttribute("name",
                                        msg.data.input + " == " + msg.data.match);
                                    assertNode.setAttribute("input",
                                        msg.data.input);
                                    assertNode.setAttribute("match",
                                        msg.data.match);
                                    apf.xmldb.appendChild(testNode, assertNode);
                                }
                            }
                            
                            if (assertNode)
                                testpanel.setError(assertNode, "Got: "
                                    + msg.data.measured);
                            break;
                        case 6: //CMD
                            var actions = testNode.selectNodes("action");
                            var actionNode = actions.length && actions[actionIndex+1];
                            if (actionNode && actionNode.getAttribute("name") == (_self.actionLookup[msg.cmd] || msg.cmd)) {
                                testpanel.setExecute(actionNode);
                                actionIndex++;
                            }
                        case 3: //LOG
                            testpanel.setLog(testNode, "command '" 
                                + (msg.out || msg.cmd) + "'");
                            break;
                        case 4:
                            if (testNode.selectSingleNode("error|assert[@status=0]"))
                                testpanel.setError(testNode, "Test Failed");
                            else
                                testpanel.setPass(testNode);
                        
                            testpanel.setExecute();
                        
                            apf.xmldb.setAttribute(fileNode, "video", msg.video);
                            dgTestProject.reselect(); //Due to apf bug
                        
                            ide.removeEventListener("socketMessage", arguments.callee);
                            nextTest();
                            break;
                        case 5:
                            _self.jobId = msg.job;
                            if (_self.cancelOnJobId)
                                _self.stop();
                            break;
                    }
                }
            });
            
            ide.send(JSON.stringify(data));
            
        }, function(){
            var nodes = apf.queryNodes(fileNode, "test[@status=0 or error]");

            if (_self.stopping) {
                testpanel.setError(fileNode, "Test Cancelled");
                return;
            }
            else if (nodes.length)
                testpanel.setError(fileNode, "failed " + (nodes.length) + " tests of " + tests.length);
            else
                testpanel.setPass(fileNode, "(" + tests.length + ")");
            
            _self.running = false;
            
            callback();
        });
    },
    
    stop : function(){
        this.stopping = true;
            
        if (this.lastTestNode) {
            testpanel.setLog(this.lastTestNode.tagName == "file"
                ? this.lastTestNode
                : this.lastTestNode.parentNode, "Stopping...");
        }
        
        if (!this.jobId) {
            this.cancelOnJobId = true;
            return;
        }
        this.cancelOnJobId = false;
        
        var data = {
            command : "selenium",
            argv    : ["selenium"],
            line    : "",
            destroy : true,
            job     : this.jobId
        };
        ide.send(JSON.stringify(data));
    },
    
    stopped : function(msg){
        this.running = false;
        this.stopping = false;
        
        testpanel.stopped();
    },
    
    createAndOpenTest : function(){
        var _self = this;
        var path  = ("workspace/" + this.testpath).split("/");
        var stack = [];
        
        var recur = function(){
            stack.push(path.shift());
            
            if (path.length == 0) {
                newresource.newfile(".stest", _self.template, 
                    "/workspace/" + _self.testpath + "/");
                return;
            }
            
            fs.exists(stack.join("/") + "/" + path[0], function(data, state, extra){
                if (data) {
                    recur();
                }
                else {
                    fs.webdav.exec("mkdir", 
                      [stack.join("/"), path[0]], function(data) {
                        recur();
                    });
                }
            });
        }
        
        recur();
    },
    
    reloadTestFile : function(xmlNode) {
        var _self = this;
        fs.readFile(xmlNode.getAttribute("path"), function(data, state, extra){
            if (state == apf.SUCCESS) {
                _self.parseTestFile(data, xmlNode)
            }
        });
    },
    
    parseTestFile : function(data, xmlNode){
        var nodes = xmlNode.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            apf.xmldb.removeNode(nodes[i]);
        }
        
        var json = JSON.parse(data);
        var doc  = xmlNode.ownerDocument;
        for (var prop in json) {
            if (!prop.match(/^test /i))
                continue;
            
            var node = doc.createElement("test");
            node.setAttribute("name", prop);
            
            apf.xmldb.appendChild(xmlNode, node);
        }
    },
    
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
        
        ide.send(JSON.stringify({
            "command"     : "watcher",
            "type"        : "watchFile",
            "path"        : this.testpath
        }));
        
        this.disabled = false;
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
        
        ide.send(JSON.stringify({
            "command"     : "watcher",
            "type"        : "unwatchFile",
            "path"        : this.testpath
        }));
        
        this.disabled = true;
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        
        testpanel.unregister(this);
    }
});

});
