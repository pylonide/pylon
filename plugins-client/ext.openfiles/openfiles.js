/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var settings = require("core/settings");
var panels = require("ext/panels/panels");
var markup = require("text!ext/openfiles/openfiles.xml");
var commands = require("ext/commands/commands");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/openfiles/openfiles", {
    name            : "Open Files",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    nodes           : [],

    defaultWidth    : 130,

    hook : function(){
        var _self = this;

        this.markupInsertionPoint = colLeft;

        panels.register(this, {
            position : 2000,
            caption: "Open Files",
            "class": "open_files",
            command: "openfilepanel"
        });

        commands.addCommand({
            name: "openfilepanel",
            hint: "show the open files panel",
            bindKey: {mac: "Shift-Command-U", win: "Shift-Ctrl-U"},
            exec: function () {
                _self.show();
            }
        });

        var model = this.model = new apf.model().load("<files />");

        ide.addEventListener("openfile", function(e){
            var node = e.doc.getNode();
            if (node) {
                if (!model.queryNode('//node()[@path=' + util.escapeXpathString(node.getAttribute("path")) + ']')) {
                    var xmlNode = model.appendXml(apf.getCleanCopy(node));

                    if (ide.inited && _self.inited && lstOpenFiles.$ext.offsetWidth)
                        _self.animateAdd(xmlNode);
                }
            }
        });

        ide.addEventListener("afteropenfile", function(e){
            var node = model.queryNode('//node()[@path=' + util.escapeXpathString(e.node.getAttribute("path")) + ']');
            if (!node || !e.doc.$page)
                return;

            if (node.getAttribute("customtype") == util.getContentType("c9search"))
                ide.dispatchEvent("c9searchopen", e);

            var pgModel = e.doc.$page.$model;
            pgModel.addEventListener("update",
              pgModel.$lstOpenFilesListener = function(){
                  if (!pgModel.data)
                      return;

                  var changed = pgModel.data.getAttribute("changed");
                  if (changed != node.getAttribute("changed"))
                      apf.xmldb.setAttribute(node, "changed", changed);
              });
        });

        ide.addEventListener("filenotfound", function(e){
            var node = model.queryNode('//node()[@path=' + util.escapeXpathString(e.path) + ']');

            if (node)
                model.removeXml(node);
        });

        var $close = function(e){
            if (e.returnValue === false)
                return;

            var node = model.queryNode('//node()[@path=' +
                util.escapeXpathString(e.page.id || "") + ']');

            if (!node || !node.parentNode || node.beingRemoved)
                return;

            if (node.getAttribute("customtype") == util.getContentType("c9search"))
                ide.dispatchEvent("c9searchclose", e);

            e.page.$model.removeEventListener("update",
                e.page.$model.$lstOpenFilesListener);

            if (ide.inited && _self.inited && lstOpenFiles.$ext.offsetWidth) {
                node.beingRemoved = true;
                _self.animateRemove(node);
            }
            else
                model.removeXml(node);
        }

        ide.addEventListener("closefile", $close);
        tabEditors.addEventListener("close", $close);

        ide.addEventListener("updatefile", function(e){
            var node = e.xmlNode;

            if (!self.trFiles)
                return;

            if (node.getAttribute("customtype") == util.getContentType("c9search")) {
                apf.xmldb.setAttribute(node, "changed", 0);
                return;
            }

            var path = util.escapeXpathString(e.newPath || e.path || node.getAttribute("path"));

            var fNode = model.queryNode('//node()[@path=' + path + ']');

            if (!e.replace)
                var trNode = trFiles.queryNode('//node()[@path=' + path + ']');
            if (node && fNode) {
                if (e.path) {
                    apf.xmldb.setAttribute(fNode, "path", node.getAttribute("path"));
                    trNode && apf.xmldb.setAttribute(trNode, "path", node.getAttribute("path"));
                }
                if (e.newPath) {
                    apf.xmldb.setAttribute(fNode, "path", e.newPath);
                    trNode && apf.xmldb.setAttribute(trNode, "path", e.newPath);
                }
                if (e.filename)
                    apf.xmldb.setAttribute(fNode, "name", apf.getFilename(e.filename));
                if (e.changed != undefined)
                    apf.xmldb.setAttribute(fNode, "changed", e.changed);
            }
        });
    },

    animateAdd : function(xmlNode){
        if (!apf.isTrue(settings.model.queryValue("general/@animateui")))
            return;

        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, lstOpenFiles);

        htmlNode.style.overflow = "hidden";
        apf.tween.multi(htmlNode, {steps: 10, interval: 10, tweens: [
            {type: "left", to:0, from: -1 * htmlNode.offsetWidth, steps: 10, interval: 10, anim: apf.tween.NORMAL}
        ], onfinish: function(){

        }});
    },

    animateRemove : function(xmlNode){
        var _self = this;

        if (apf.isTrue(settings.model.queryValue("general/@animateui"))) {
            var htmlNode = apf.xmldb.findHtmlNode(xmlNode, lstOpenFiles);
                htmlNode.style.overflow = "hidden";

            apf.tween.multi(htmlNode, {steps: 10, interval: 10, tweens: [
                {type: "left", from:0, to: -1 * htmlNode.offsetWidth, steps: 10, interval: 10, anim: apf.tween.NORMAL}
            ], onfinish: function(){
                htmlNode.style.display = "none";
                _self.model.removeXml(xmlNode);
            }});
        }
        else {
            _self.model.removeXml(xmlNode);
        }
    },

    init : function() {
        var _self = this;

        this.panel = winOpenFiles;
        this.nodes.push(winOpenFiles);

        lstOpenFiles.addEventListener("afterselect", function(e) {
            var node = this.selected;
            if (!node || this.selection.length > 1)
                return;

            editors.gotoDocument({ doc: ide.createDocument(node), origin: "openfiles" });
        });

        lstOpenFiles.addEventListener("afterremove", function(e){
            //Close selected files
            var sel = this.getSelection(), page, isLast, pages = tabEditors.getPages();
            for (var i = 0; i < sel.length; i++) {
                page = tabEditors.getPage(sel[i].getAttribute("path"));
                !isLast && (isLast = pages[pages.length - 1] == page);
                editors.close(page);
            }
        });

        lstOpenFiles.addEventListener("click", function(e){
            if (e.htmlEvent.target.tagName == "SPAN") {
                var xmlNode = apf.xmldb.findXmlNode(e.htmlEvent.target.parentNode.parentNode);
                var page = tabEditors.getPage(xmlNode.getAttribute("path"));
                editors.close(page);
            }
        });

        ide.addEventListener("tab.afterswitch", function(e){
            var page = e.nextPage;
            if (page && page.$model.data) {
                var node = _self.model.queryNode("file[@path="
                    + util.escapeXpathString(page.$model.data.getAttribute("path"))
                    + "]");
                if (node && !lstOpenFiles.isSelected(node))
                    lstOpenFiles.select(node);
            }
        });
    },

    show : function(e) {
        if (!this.panel || !this.panel.visible) {
            panels.activate(this);
            this.enable();
        }
        else {
            panels.deactivate(null, true);
        }

        return false;
    },

    destroy : function(){
        commands.removeCommandByName("openfilepanel");
        panels.unregister(this);
        this.$destroy();
    }
});

});
