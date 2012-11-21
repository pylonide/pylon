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
var settings = require("core/settings");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/testpanel/testpanel", {
    name            : "Test Panel",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    appliedFilter   : "all",
    nodes           : [],
    offline         : false,

    defaultWidth    : 290,

    hook : function(){
        var _self = this;

        this.markupInsertionPoint = colLeft;

        panels.register(this, {
            position : 4000,
            caption: "Test",
            "class": "testing"
        });

        ide.addEventListener("settings.load", function(e){
            settings.setDefaults("auto/testpanel", [
                ["autorun", "none"],
                ["type", "all"],
                ["showlibraries", "true"],
                ["autoexpand", "true"]
            ]);
        });

        ide.addEventListener("afterfilesave", function(e) {
            var autoRun = settings.model.queryValue("auto/testpanel/@autorun");

            if (dbg.state)
                return;

            if (autoRun == "none")
                return;
            if (autoRun == "selection" && _self.dgTestProject) {
                var sel = dgTestProject.getSelection();
                if (sel.length)
                    _self.run(sel);
            }
            else if (autoRun == "pattern") {
                var func = new Function('path', _self.getPattern());
                var list = func(e.node.getAttribute("path"));

                if (!list || list.dataType != apf.ARRAY) {
                    util.alert("Wrong output from pattern",
                        "Wrong output from pattern",
                        "Pattern did not generate list of strings");
                    return;
                }

                var nodes = [], node;
                list.forEach(function(path){
                    node = mdlTests.queryNode("//node()[@path="
                        + util.escapeXpathString(path) + "]");
                    if (node)
                        nodes.push(node);
                });

                if (nodes.length)
                    _self.run(nodes);
            }
        });
    },

    init : function() {

        btnTestRun.$ext.setAttribute("class", "light-dropdown");
        btnTestStop.$ext.setAttribute("class", btnTestStop.$ext.getAttribute("class") + " btnTestStop");
        winTestPanel.$ext.setAttribute("class", winTestPanel.$ext.getAttribute("class") + " testpanel");

        var _self  = this;

        this.panel = winTestPanel;
        this.nodes.push(winTestPanel, mnuRunSettings, stTestRun);

        ide.dispatchEvent("init.testrunner");

        mnuFilter.onitemclick = function(e){
            if (e.value && e.relatedNode.type == "radio")
                _self.filter(e.value);
        }

        var altKey;
        apf.addListener(document, "keydown", function(e){
            if ((e || event).keyCode == 18)
                altKey = true;
        });

        apf.addListener(document, "keyup", function(e){
            if ((e || event).keyCode == 18)
                altKey = false;
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

                editors.gotoDocument({doc: ide.createDocument(node), origin: "testpanel"});

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
                _self.addRepo(m);
            });
        });
    },

    addRepo : function(name){
        var doc = mdlTests.data.ownerDocument;
        var node = doc.createElement("repo");
        node.setAttribute("name", name);
        mdlTests.appendXml(node);
        this.submodules.push(name);

        return node;
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
        var node = apf.n("<file />")
            .attr("name", "Pattern.js")
            .attr("path", "/workspace/.c9.test.pattern")
            .attr("changed", "1")
            .attr("newfile", "1")
            .node();

        var pattern = this.getPattern();

        var doc = ide.createDocument(node);
        doc.cachedValue = pattern;

        editors.gotoDocument({doc: doc, node: node, origin: "testpanel"});

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

        settings.model.setQueryValue('auto/testpanel/@showlibraries', this.showSubmodules);

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

        settings.model.setQueryValue('auto/testpanel/@autoexpand', this.expandTests);

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

    destroy : function(){
        this.stop();
        panels.unregister(this);
        this.$destroy();
    }
});

});
