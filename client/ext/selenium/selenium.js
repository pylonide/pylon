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

module.exports = ext.register("ext/selenium/selenium", {
    name            : "Selenium Test Manager",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    nodes           : [],
    testpath        : "test/selenium",
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
                value   : "selenium",
                caption : "Selenium Tests"
            }), mnuFilter.getElementsByTagNameNS(apf.ns.aml, "divider")[1]),
            
            mnuTestNew.appendChild(new apf.item({
                caption : "Selenium Test",
                onclick : function(){
                    _self.createAndOpenTest();
                }
            }))
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
        
        ide.addEventListener("test.expand.selenium", function(e){
            var xmlNode = e.xmlNode;
            _self.reloadTestFile(xmlNode);
        });
        
        ide.addEventListener("test.run.selenium", function(e){
            var fileNode = e.xmlNode;
            var nextFile = e.next;
            var path     = fileNode.getAttribute("path");
            
            var sp       = new SeleniumPlayer();
            sp.realtime  = false;
            
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
                    
                    var tests = Object.keys(testObject);
                    var nodes = fileNode.selectNodes("test");
                    if (!nodes.length) {
                        _self.parseTestFile(data, xmlNode);
                        nodes = fileNode.selectNodes("test");
                    }
                    
                    apf.asyncForEach(tests, function(item, nextTest, i){
                        var script   = sp.compile(testObject[item]);
                        var testNode = nodes[i];
                        
                        var data = {
                            command : "selenium",
                            argv    : ["selenium", script],
                            line    : "",
                            cwd     : this.getCwd(),
                            where   : "local",
                            path    : actions.url,
                            //@todo settings
                        };
                        
                        ide.addEventListener("socketMessage", function(e){
                            if (e.message.type == "selenium") {
                                switch (e.message.code) {
                                    case 0:
                                        testpanel.setError(testNode,
                                            "Error running Selenium Test: "
                                                + e.message.err.message);
                                        
                                        nextTest();
                                        ide.removeEventListener("socketMessage", arguments.callee);
                                        break;
                                    case 1: //PASS
                                        
                                        break;
                                    case 2: //ERROR .data[input | match | measured]
                                        
                                        break;
                                    case 3: //LOG
                                        
                                        break;
                                    case 4:
                                        //@todo take assertions into account
                                        testpanel.setPass(testNode);
                                    
                                        nextTest();
                                        ide.removeEventListener("socketMessage", arguments.callee);
                                        break;
                                }
                            }
                        });
                        
                        ide.send(JSON.stringify(data));
                        
                    }, function(){
                        nextFile();
                    });
                }
                else {
                    testpanel.setError(fileNode,
                        "Could not load file contents: " + extra.message);
                    
                    next();
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
