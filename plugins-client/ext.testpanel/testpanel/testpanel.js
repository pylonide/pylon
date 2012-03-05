/**
 * Test Panel for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var panels = require("ext/panels/panels");
var markup = require("text!ext/testpanel/testpanel.xml");
var fs = require("ext/filesystem/filesystem");
var settings = require("ext/settings/settings");

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

module.exports = ext.register("ext/testpanel/testpanel", {
    name            : "Test Panel",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    appliedFilter   : "all",
    nodes           : [],
    
    defaultWidth    : 290,

    hook : function(){
        panels.register(this, {
            position : 4000,
            caption: "Test",
            "class": "testing"
        });
        
        var _self = this;

        //ide.addEventListener("init.testrunner", function(){
            apf.document.body.appendChild(new apf.state({
                id : "stTestRun"
            }));
            
            apf.document.body.appendChild(new apf.menu({
                id : "mnuRunSettings"
                //pinned : "true"
            }));
            
            //ide.removeEventListener("init.testrunner", arguments.callee);
        //});
        
        ide.addEventListener("loadsettings", function(e){
            if (!e.model.queryValue("auto/testpanel/@autorun"))
                e.model.setQueryValue("auto/testpanel/@autorun", "none");
        });
        
        ide.addEventListener("afterfilesave", function(e) {
            var autoRun = settings.model.queryValue("auto/testpanel/@autorun");
            
            if (stRunning.active)
                return;
            
            if (autoRun == "none")
                return;
            
            if (autoRun == "selection") {
                var sel = dgTestProject.getSelection();
                if (sel.length)
                    _self.run(sel);
            }
            else if (autoRun == "pattern") {
                var list = (new Function('path', _self.getPattern()))(
                    e.node.getAttribute("path"));
                
                if (!list || list.dataType != apf.ARRAY) {
                    util.alert("Wrong output from pattern",
                        "Wrong output from pattern",
                        "Pattern did not generate list of strings");
                    return;
                }
                
                var nodes = [], node;
                list.forEach(function(path){
                    node = mdlTests.queryNode("//node()[@path=" 
                        + escapeXpathString(path) + "]");
                    if (node)
                        nodes.push(node);
                });
                
                if (nodes.length)
                    _self.run(nodes);
            }
        });
    },

    init : function() {
        var _self  = this;
        this.panel = winTestPanel;
        
        this.nodes.push(winTestPanel);
        
        ide.dispatchEvent("init.testrunner");

        colLeft.appendChild(winTestPanel);
        
        mnuFilter.onitemclick = function(e){
            if (e.value && e.relatedNode.type == "radio")
                _self.filter(e.value);
        }
    
        var altKey;
        apf.addListener(document, "keydown", function(e){
            altKey = (e || event).altKey;
        });
        
        apf.addListener(document, "keyup", function(e){
            altKey = (e || event).altKey ? false : altKey;
        });
    
        dgTestProject.addEventListener("afterchoose", function(e){
            var node = this.selected;
            if (!node || this.selection.length > 1)
                return;

            //Open
            if (altKey) {
                if (node.tagName != "file"
                  || !ide.onLine && !ide.offlineFileSystemSupport)
                    return;
                        
                ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
                
                //@todo choose a test or an assert should select that code
                //      inside ace.
            }
            //Run
            else {
                if ("file|test|repo".indexOf(node.tagName) == -1 || !ide.onLine)
                    return;
                
                _self.run([node]);
            }
        });
        
        ide.addEventListener("afteroffline", function(){
            btnTestRun.disable();
            _self.stop(true);
        });
        
        ide.addEventListener("afteronline", function(){
            btnTestRun.enable();
        });
        
        this.submodules = [];
        fs.readFile("/workspace/.git/config", function(data){
            data.replace(/\[submodule "([^"]*)"\]/g, function(s, m){
                var doc = mdlTests.data.ownerDocument;
                var node = doc.createElement("repo");
                node.setAttribute("name", m);
                mdlTests.appendXml(node);
                
                _self.submodules.push(m);
            });
        });
    },
    
    getPattern : function(){
        return settings.model.queryValue("auto/testpanel/pattern/text()") ||
            "// Enter any code below that returns the paths of the tests in an array of strings.\n"
            + "// You have access to the 'path' variable.\n"
            + "// Save this file to store the pattern.\n"
            + "var tests = [];\n"
            + "return tests.pushUnique(\n"
            + "    path.replace(/(?:_test)?\.js$/, \"_test.js\"),\n"
            + "    path.replace(/(?:_Test)?\.js$/, \"Test.js\")\n"
            + ");";
    },
    
    editAutoRunPattern : function(){
        var node = apf.getXml("<file />");
        node.setAttribute("name", "Pattern.js");
        node.setAttribute("path", "/workspace/.c9.test.pattern");
        node.setAttribute("changed", "1");
        node.setAttribute("newfile", "1");
                
        var pattern = this.getPattern();
                
        var doc = ide.createDocument(node);
        doc.cachedValue = pattern;
                    
        ide.dispatchEvent("openfile", {doc: doc, node: node});
        
        ide.addEventListener("beforefilesave", function(e){
            if (e.node == node) {
                
                var value = doc.getValue();
                settings.model.setQueryValue("auto/testpanel/pattern/text()", value);
                node.removeAttribute("changed");
                node.removeAttribute("newfile");
                
                var page = tabEditors.getPage("/workspace/.c9.test.pattern");
                tabEditors.remove(page);
                
                ide.removeEventListener("beforefilesave", arguments.callee);
                
                return false;
            }
        });
    },
    
    findParent : function(path){
        var _self = this;
        for (var i = 0; i < _self.submodules.length; i++) {
            if (path.match(new RegExp("^\/workspace\/" + _self.submodules[i].replace(/\//g, "\\\/"))))
                return mdlTests.queryNode("repo[@name='" + _self.submodules[i].replace(/'/g, "\\'") + "']");
        }
        
        return mdlTests.queryNode("repo[1]");
    },
    
    filter : function(value){
        this.appliedFilter = value;
        
        dgTestProject.setAttribute("each", value == "all"
            ? "[repo|file|test|assert|error]"
            : "[repo|file[@type='" + value + "']|test|assert|error]");
    },
    
    parseFile : function(xmlNode){
        ide.dispatchEvent("test.expand." + xmlNode.getAttribute("type"), {
            xmlNode : xmlNode
        });
        
        return "<file />";
    },
    
    getIcon : function(tagName, value, type) {
        if (tagName == "repo")
            return "folder.png";
        if (tagName == "assert" || tagName == "error" || tagName == "test") {
            if (!value || value == -1)
                return "bullet_blue.png";
            else if (value == 5) //running
                return "bullet_go.png";
            else if (value == 1) //ran
                return "bullet_green.png";
            else if (value == 0) //error
                return "exclamation.png";//bullet_red.png";
        }
        if (tagName == "error")
            return "exclamation.png";
        else
            return ide.dispatchEvent("test.icon." + type) || "page_white_text.png";
    },
    
    run : function(nodes){
        var _self = this;
        
        if (!nodes || stTestRun.active)
            return;
        
        mnuRunSettings.hide();
        
        var finish = function(){
            stTestRun.deactivate();
        }
        
        //Clean nodes
        nodes.each(function(node) {
            if (node.tagName == "test")
                node = node.parentNode;
            
            var cleanNodes = node.selectNodes(".//file|.//test");
            for (var k = 0; k < cleanNodes.length; k++) {
                apf.xmldb.removeAttribute(cleanNodes[k], "status");
            }
            [".//error", ".//assert"].forEach(function(type){
                var nodes = node.selectNodes(type);
                for (var k = 0; k < nodes.length; k++) {
                    apf.xmldb.removeNode(nodes[k]);
                }
            });
        });
        
        //Expand list
        var total = [];
        nodes.each(function(node){
            if (node.tagName == "repo")
                total = total.concat(apf.getArrayFromNodelist(node.selectNodes("file" + 
                    (_self.appliedFilter == "all" 
                        ? "" 
                        : "[@type='" + _self.appliedFilter + "']"))));
            else if (node.tagName == "file")
                total.push(node);
            else if (node.tagName == "test")
                total.push(node.parentNode);
        });
        
        stTestRun.activate();
        
        var i = 0;
        var next = function(){
            if (total[i]) {
                _self.setLog(total[i], "connecting");
                ide.dispatchEvent("test.run." + total[i].getAttribute("type"), {
                    xmlNode : total[i++],
                    next    : next
                });
            }
            else {
                finish();
            }
        };
        next();
    },
    
    stop : function(immediate){
        if (!stTestRun.active)
            return;
        
        ide.dispatchEvent("test.stop");
        stTestRun.setAttribute("stopping", 1);
        
        var _self = this;
        clearTimeout(this.$stopTimer);
        this.$stopTimer = setTimeout(function(){
            ide.dispatchEvent("test.hardstop");
            
            _self.stopped();
        }, immediate ? 0 : 10000);
    },
    
    stopped : function(){
        stTestRun.deactivate();
        stTestRun.removeAttribute("stopping");
        
        clearTimeout(this.$stopTimer);
    },
    
    setPass : function(xmlNode, msg){
        apf.xmldb.setAttribute(xmlNode, "status", 1);
        apf.xmldb.setAttribute(xmlNode, "status-message", msg || "");
    },
    setError : function(xmlNode, msg){
        apf.xmldb.setAttribute(xmlNode, "status", 0);
        apf.xmldb.setAttribute(xmlNode, "status-message", msg || "");
    },
    setLog : function(xmlNode, msg){
        apf.xmldb.setAttribute(xmlNode, "status", -1);
        apf.xmldb.setAttribute(xmlNode, "status-message", msg || "");
    },
    lastExecuteNode : null,
    setExecute : function(xmlNode, msg){
        if (xmlNode) {
            apf.xmldb.setAttribute(xmlNode, "status", 5);
            apf.xmldb.setAttribute(xmlNode, "status-message", msg || "");
            
            ide.dispatchEvent("test.pointer." + apf.queryValue(xmlNode, "ancestor-or-self::test/../@type"), {
                xmlNode : xmlNode
            });
        }
        if (this.lastExecuteNode 
          && this.lastExecuteNode.getAttribute("status") == 5) {
            apf.xmldb.setAttribute(this.lastExecuteNode, "status", 1);
            apf.xmldb.setAttribute(this.lastExecuteNode, "status-message", "");
        }
        this.lastExecuteNode = xmlNode;
    },
    
    showSubmodules : true,
    toggleSubmodules : function(value){
        this.showSubmodules = value;
        
        if (value) {
            dgTestProject.setAttribute("each", 
                "[" + dgTestProject.each.replace(/repo\[1\]/, "repo") + "]");
        }
        else {
            dgTestProject.setAttribute("each", 
                "[" + dgTestProject.each.replace(/repo/, "repo[1]") + "]");
        }
    },
    
    expandTests : true,
    toggleExpandTests : function(value){
        this.expandTests = value;
        
        if (value) {
            if (!expTestRule.parentNode)
                dgTestProject.appendChild(expTestRule);
        }
        else {
            if (expTestRule.parentNode)
                dgTestProject.removeChild(expTestRule);
        }
    },
    
    show : function(){
        if (navbar.current) {
            if (navbar.current == this)
                return;
            navbar.current.disable();
        }
        
        panels.initPanel(this);
        this.enable();
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.stop();
        
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        
        panels.unregister(this);
    }
});

});
