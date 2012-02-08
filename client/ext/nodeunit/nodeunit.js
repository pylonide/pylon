/**
 * Test Panel for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var fs = require("ext/filesystem/filesystem");
var newresource = require("ext/newresource/newresource");
var noderunner = require("ext/noderunner/noderunner");
var testpanel = require("ext/testpanel/testpanel");
var console = require("ext/console/console");
var template = require("text!ext/nodeunit/nodeunit.template");

var parser = require("treehugger/js/parse");
require("treehugger/traverse");

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

module.exports = ext.register("ext/nodeunit/nodeunit", {
    name            : "Node Unit Test Manager",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    nodes           : [],
    template        : template,

    hook : function(){
        var _self = this;
        ide.addEventListener("init.ext/testpanel/testpanel", function(){
            ext.initExtension(_self);
        });
    },

    init : function() {
        var _self = this;

        this.nodes.push(
            mnuFilter.insertBefore(new apf.item({
                type    : "radio",
                value   : "nodeunit",
                caption : "Node Unit Tests"
            }), mnuFilter.getElementsByTagNameNS(apf.ns.aml, "divider")[1]),

            mnuTestNew.appendChild(new apf.item({
                caption : "Node Unit Test",
                onclick : function(){
                    _self.createAndOpenTest();
                }
            }))
        );

        davProject.report(ide.davPrefix, 'filelist', {},
          function(data, state, extra){
            if (state == apf.ERROR) {
                if (data && data.indexOf("jsDAV_Exception_FileNotFound") > -1) {
                    return;
                }

                //@todo
                return;
            }
            if (state == apf.TIMEOUT)
                return; //@todo

            var nodes = data.selectNodes("//d:href");
            for (var node, i = 0; i < nodes.length; i++) {
                node = nodes[i];

                //@todo support for submodules
                if (node.firstChild.nodeValue.match(/_test\.js$/)) {
                    var file = apf.getXml("<file />");
                    var path = ide.davPrefix + "/" + node.firstChild.nodeValue;
                    file.setAttribute("name", path.split("/").pop());
                    file.setAttribute("path", path);
                    file.setAttribute("type", "nodeunit");
                    apf.xmldb.appendChild(testpanel.findParent(path), file);
                }
            }
        });

        ide.addEventListener("afterfilesave", function(e){
            var node = e.node;
            var name = node.getAttribute("name");
            if (!name.match(/_test.js$/))
                return;

            var path = node.getAttribute("path");
            var fileNode = mdlTests.queryNode("//file[@path=" + escapeXpathString(path) + "]");
            if (!fileNode) {
                fileNode = apf.xmldb.getCleanCopy(node);
                fileNode.setAttribute("type", "nodeunit");
                apf.xmldb.appendChild(testpanel.findParent(path), fileNode);
            }
        });

        ide.addEventListener("test.expand.nodeunit", function(e){
            var xmlNode = e.xmlNode;
            _self.reloadTestFile(xmlNode);
        });

        ide.addEventListener("test.stop", function(e){
            if (!_self.running)
                return;
            _self.stop();
        });

        ide.addEventListener("test.icon.nodeunit", function(e){
            return "page_white_code.png";
        });

        ide.addEventListener("test.run.nodeunit", function(e){
            var fileNode = e.xmlNode;
            var next    = e.next;

            console.autoOpen = false;

            _self.stopping     = false;
            _self.running      = true;
            _self.lastTestNode = fileNode;

            testpanel.setLog(fileNode, "running");

            //@todo this should be loaded via file contents
            if (testpanel.expandTests) {
                if (dgTestProject.$hasLoadStatus(fileNode, "potential"))
                    dgTestProject.slideOpen(null, fileNode);
                else {
                    _self.reloadTestFile(fileNode);
                }
            }

            var timer = setInterval(function(){
                if (fileNode.selectNodes("test").length) {
                    clearTimeout(timer);
                    parseMessage({data: ""})
                }
            }, 10);

            var stack = [];
            ide.addEventListener("socketMessage", function(e){
                //@todo testpanel.setLog(node, "started");

                if (e.message.type == "node-data") {
                    parseMessage(e.message);
                }
                else if (e.message.type.indexOf("node-exit") > -1) {
                    ide.removeEventListener("socketMessage", arguments.callee);
                    if (_self.stopping)
                        _self.stopped();
                    else {
                        _self.running = false;
                        if (fileNode.getAttribute("status") == -1)
                            testpanel.setError(fileNode, "failed");
                        if (!stProcessRunning.active)
                            next();
                        else {
                            stProcessRunning.addEventListener("deactivate", function(){
                                next();
                                stProcessRunning.removeEventListener("deactivate", arguments.callee);
                            });
                        }
                    }
                }
            });

            function completed(){
                var nodes = apf.queryNodes(fileNode, "test[@status=0 or error]");

                if (_self.stopping) {
                    testpanel.setError(fileNode, "Test Cancelled");
                    return;
                }
                else if (nodes.length)
                    testpanel.setError(fileNode, "Failed " + (nodes.length)
                        + " tests of " + fileNode.selectNodes("test").length);
                else
                    testpanel.setPass(fileNode,
                        "(" + fileNode.selectNodes("test").length + ")");
            }

            function parseMessage(message){
                var data;
                if (stack.length) {
                    data = stack.join("") + message.data;
                    stack = [];
                }
                else
                    data = message.data;

                //Parse

                //Remove summary
                data = data.replace(/\s*Summary\:\s+Total number of tests[\s\S]*$/, "");
                data = data.substr(1);
                var parts = data.match(/\[(\d+)m[\s\S]*?(?:$|(?=\[[1-9]\d*m))/g);
                if (!parts)
                    return;

                var match;
                for (var i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    //FAIL
                    if (part.substr(0, 3) == "[31") {
                        match = part.match(/^\[31m\[(\d+)\/(\d+)\]\s+(.*?)\s+FAIL.*([\S\s]*?)(?=\[\d+m|$)/);
                        if(!match)
                            continue;

                        var testNode = fileNode.selectSingleNode("test[@name=" + escapeXpathString(match[3]) + "]");
                        if (!testNode) {
                            var doc  = fileNode.ownerDocument;
                            testNode = doc.createElement("test");
                            testNode.setAttribute("name", match[3]);
                            apf.xmldb.appendChild(fileNode, testNode);
                        }
                        //fileNode.addNode();
                        testpanel.setError(testNode, "Test Failed");
                        testpanel.setLog(fileNode, "completed test " + match[2] + " of " + match[1]);

                        var errorNode = testNode.ownerDocument
                            .createElement("error");
                        errorNode.setAttribute("name", match[4]);
                        apf.xmldb.appendChild(testNode, errorNode);

                        if (match[2] == match[1])
                            completed();
                    }
                    //PASS
                    //[32m[4/1] test basic addition OK[0m
                    else if (part.substr(0, 3) == "[32") {
                        match = part.match(/^\[32m\[(\d+)\/(\d+)\]\s+(.*?)\sOK[\s\S]{4,6}/);
                        if(!match)
                            continue;

                        var testNode = fileNode.selectSingleNode("test[@name=" + escapeXpathString(match[3]) + "]");
                        if(!testNode) {
                            var doc  = fileNode.ownerDocument;
                            testNode = doc.createElement("test");
                            testNode.setAttribute("name", match[3]);
                            apf.xmldb.appendChild(fileNode, testNode);
                        }
                        testpanel.setPass(testNode);
                        testpanel.setLog(fileNode, "completed test " + match[2] + " of " + match[1]);

                        if (match[2] == match[1])
                            completed();
                    }
                }
            }

            var path = fileNode.getAttribute("path")
                .slice(ide.davPrefix.length + 1)
                .replace("//", "/");

            noderunner.run(path, [], false);
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

        if (this.lastTestNode) {
            testpanel.setLog(this.lastTestNode.tagName == "file"
                ? this.lastTestNode
                : this.lastTestNode.parentNode, "Stopping...");
        }

        noderunner.stop();
    },

    stopped : function(msg){
        this.stopping = false;
        this.running  = false;

        testpanel.stopped();

        console.autoOpen = true;
    },

    createAndOpenTest : function(){
        var _self = this;
        var path  = (ide.davPrefix + "/" + this.testpath).split("/");
        var stack = [];

        var recur = function(){
            stack.push(path.shift());

            if (path.length == 0) {
                newresource.newfile("_test.js", _self.template,
                  ide.davPrefix + "/");
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
        fs.readFile(xmlNode.getAttribute("path"), function(data, state, extra){
            if (state == apf.SUCCESS) {
                var node, found = [];

                var ast = parser.parse(data);
                var doc  = xmlNode.ownerDocument;
                ast.traverseTopDown(
                    'Assign(PropAccess(Var("module"),"exports"), ObjectInit(inits))', function(b) {
                        b.inits.forEach(function(init) {
                            // init now contains PropertyInit("name", value) nodes, first branch is the name node
                            var name = init[0].value;

                            node = xmlNode.selectSingleNode("test[@name="
                              + escapeXpathString(name) + "]");

                            if (!node) {
                                node = doc.createElement("test");
                                node.setAttribute("name", name);

                                apf.xmldb.appendChild(xmlNode, node);
                            }

                            found.push(node);
                        });
                    }
                );

                var nodes = xmlNode.childNodes;
                for (var i = nodes.length - 1; i >= 0; i--) {
                    if (found.indexOf(nodes[i]) == -1)
                        apf.xmldb.removeNode(nodes[i]);
                }
            }
        });
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });

//@todo this is much more complex
//        ide.send({
//            "command"     : "watcher",
//            "type"        : "watchFile",
//            "path"        : this.testpath
//        });

        this.disabled = false;
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });

//        ide.send({
//            "command"     : "watcher",
//            "type"        : "unwatchFile",
//            "path"        : this.testpath
//        });

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
