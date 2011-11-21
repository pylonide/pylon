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
        });
    },

    init : function(amlNode) {
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
            
            vboxTestPanel.appendChild(flSeleniumMovie)
        );
        
        var nodes = seleniumSettings.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            this.nodes.push(mnuRunSettings.appendChild(nodes[0]));
        }

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
            var fileNode = e.xmlNode;
            var nextFile = e.next;
            var path     = fileNode.getAttribute("path");
            
            _self.lastTestNode = fileNode;
            
            var sp       = new SeleniumPlayer();
            sp.realtime  = false;
            
            _self.runnning = true;
            _self.stopping = false; //@todo this shouldn't happen
            _self.jobId = null;
            
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
                        
                        nextFile();
                        return;
                    }
                    
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
                                        else
                                            nextFile();
                                        break;
                                    case 1: //PASS
                                        var assertNode = 
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
                                        
                                        testpanel.setPass(assertNode);
                                        break;
                                    case 2: //ERROR .data[input | match | measured]
                                        if (_self.stopping)
                                            return;
                                            
                                        if (typeof msg.data == "string") {
                                            errorNode = testNode.ownerDocument
                                                .createElement("error");
                                            errorNode.setAttribute("name",
                                                msg.data);
                                            apf.xmldb.appendChild(testNode, errorNode);
                                            return;
                                        }
                                    
                                        var assertNode = 
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
                                        
                                        testpanel.setError(assertNode, "Got: "
                                            + msg.data.measured);
                                        break;
                                    case 3: //LOG
                                        testpanel.setLog(testNode, "command '" + msg.out + "'");
                                        break;
                                    case 4:
                                        if (testNode.selectSingleNode("error|assert[@status=0]"))
                                            testpanel.setError(testNode, "Test Failed");
                                        else
                                            testpanel.setPass(testNode);
                                    
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
                        
                        nextFile();
                    });
                }
                else {
                    testpanel.setError(fileNode,
                        "Could not load file contents: " + extra.message);
                    
                    if (!_self.stopping)
                        nextFile();
                    
                    _self.stopping = false;
                }
            });
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
    
    stop : function(){
        this.stopping = true;
            
        if (!this.jobId) {
            this.cancelOnJobId = true;
            return;
        }
        this.cancelOnJobId = false;
        
        if (this.lastTestNode) {
            testpanel.setLog(this.lastTestNode.tagName == "file"
                ? this.lastTestNode
                : this.lastTestNode.parentNode, "Stopping...");
        }
        
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
        this.runnning = false;
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
