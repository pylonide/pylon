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
var newresource = require("ext/noderunner/noderunner");
var testpanel = require("ext/testpanel/testpanel");
var template = require("text!ext/nodeunit/nodeunit.template");

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
                caption : "Node Unite Tests"
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
                    var path = "/workspace/" + node.firstChild.nodeValue;
                    file.setAttribute("name", path.split("/").pop());
                    file.setAttribute("path", path);
                    file.setAttribute("type", "nodeunit");
                    apf.xmldb.appendChild(testpanel.findParent(path), file);
                }
            }
        });

        ide.addEventListener("test.expand.nodeunit", function(e){
            var xmlNode = e.xmlNode;
            _self.reloadTestFile(xmlNode);
        });
        
        ide.addEventListener("test.run.nodeunit", function(e){
            var xmlNode = e.xmlNode;
            var next    = e.next;
            
            ide.addEventListener("socketMessage", function(e){
                if (e.message.type.indexOf("node-exit") > -1) {
                    next();
                    ide.removeEventListener("socketMessage", arguments.callee);
                }
            });
            
            noderunner.run(xmlNode.getAttribute("path"), [], false);
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
    
    createAndOpenTest : function(){
        var _self = this;
        var path  = ("workspace/" + this.testpath).split("/");
        var stack = [];
        
        var recur = function(){
            stack.push(path.shift());
            
            if (path.length == 0) {
                newresource.newfile("_test.js", _self.template, 
                  "/workspace/");
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
                var nodes = xmlNode.childNodes;
                for (var i = 0; i < nodes.length; i++) {
                    apf.xmldb.removeNode(nodes[i]);
                }

                var json = JSON.parse(data.match(/module\.exports\s*=\s*\{[\s\S]*?\s*}\s*\n\}/)[0].replace(/function[\s\S]*?    \}(\n\s*\}|,\n\s*\n    )/g, "10$1").replace(/module\.exports\s*=\s*/, ""));
                var doc  = xmlNode.ownerDocument;
                for (var prop in json) {
                    var node = doc.createElement("test");
                    node.setAttribute("name", prop);
                    
                    apf.xmldb.appendChild(xmlNode, node);
                }
            }
        });
    },
    
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });

//@todo this is much more complex
//        ide.send(JSON.stringify({
//            "command"     : "watcher",
//            "type"        : "watchFile",
//            "path"        : this.testpath
//        }));
        
        this.disabled = false;
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
        
//        ide.send(JSON.stringify({
//            "command"     : "watcher",
//            "type"        : "unwatchFile",
//            "path"        : this.testpath
//        }));
        
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
