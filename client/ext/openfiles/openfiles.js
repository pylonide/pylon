/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var panels = require("ext/panels/panels");
var markup = require("text!ext/openfiles/openfiles.xml");
var commands = require("ext/commands/commands");

module.exports = ext.register("ext/openfiles/openfiles", {
    name            : "Open Files",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    nodes           : [],
    
    defaultWidth    : 130,
    
    commands : {
        "show": {hint: "show the open files panel"}
    },
    hotitems : {},

    hook : function(){
        panels.register(this, {
            position : 2000,
            caption: "Open Files",
            "class": "open_files"
        });
        
        this.hotitems.show = [this.mnuItem];
        
        var model = this.model = new apf.model().load("<files />");
        
        ide.addEventListener("afteropenfile", function(e){
            var node = e.doc.getNode();
            if (node) {
                if (!model.queryNode('//node()[@path="' + node.getAttribute("path").replace(/"/g, "&quot;") + '"]'))
                    model.appendXml(apf.getCleanCopy(node));
            }
        });

        ide.addEventListener("closefile", function(e){
            var node = e.xmlNode;
            model.removeXml('//node()[@path="' + node.getAttribute("path").replace(/"/g, "&quot;") + '"]');
        });

        ide.addEventListener("updatefile", function(e){
            var node = e.xmlNode;
            
            if (!self.trFiles)
                return;

            var path = (e.path || node.getAttribute("path")).replace(/"/g, "&quot;");

            var fNode = model.queryNode('//node()[@path="' + path + '"]');
            var trNode = trFiles.queryNode('//node()[@path="' + path + '"]');
            if (node && fNode && trNode) {
                if (e.path)
                    apf.xmldb.setAttribute(fNode, "path", node.getAttribute("path"));
                    apf.xmldb.setAttribute(trNode, "path", node.getAttribute("path"));
                if (e.filename) {
                    apf.xmldb.setAttribute(fNode, "name", apf.getFilename(e.filename));
                    apf.xmldb.setAttribute(trNode, "name", apf.getFilename(e.filename));
                }
                if (e.changed != undefined) {
                    apf.xmldb.setAttribute(fNode, "changed", e.changed);
                    apf.xmldb.setAttribute(trNode, "changed", e.changed);
                }
            }
        });
    },

    init : function() {
        var _self = this;
        
        this.panel = winOpenFiles;
        this.nodes.push(winOpenFiles);
        
        colLeft.appendChild(winOpenFiles);
        
        lstOpenFiles.addEventListener("afterselect", this.$afterselect = function(e) {
            var node = this.selected;
            if (!node || this.selection.length > 1)
                return;

            ide.dispatchEvent("openfile", { doc: ide.createDocument(node) });
        });

        lstOpenFiles.addEventListener("afterremove", function(e){
            //Close selected files
            var sel = this.getSelection();
            for (var i = 0; i < sel.length; i++) {
                tabEditors.remove(tabEditors.getPage(sel[i].getAttribute("path")));
            }
        });
        
        ide.addEventListener("init.ext/editors/editors", function(){
            tabEditors.addEventListener("afterswitch", function(e){
                var page = e.nextPage;
                if (page && page.$model.data) {
                    var node = _self.model.queryNode("file[@path='" 
                        + page.$model.data.getAttribute("path") + "']");
                    if (node && !lstOpenFiles.isSelected(node))
                        lstOpenFiles.select(node);
                }
            });
        });

        ide.addEventListener("treechange", function(e) {
            var path = "//folder[@path='" + e.path.replace(/\/$/, "") + "']";
            var parent = trFiles.getModel().data.selectSingleNode(path);

            if (!parent)
                return;

            var nodes = parent.childNodes;
            var files = e.files;
            var removed = [];

            for (var i = 0; i < nodes.length; ++i) {
                var node = nodes[i];
                var name = node.getAttribute("name");

                if (files[name])
                    delete files[name];
                else
                    removed.push(node);
            }

            removed.forEach(function (node) {
                apf.xmldb.removeNode(node);
            });

            path = parent.getAttribute("path");

            for (var filename in files) {
                var file = files[filename];

                var xmlNode = "<" + file.type +
                    " type='" + file.type + "'" +
                    " name='" + filename + "'" +
                    " path='" + path + "/" + filename + "'" +
                "/>";

                trFiles.add(xmlNode, parent);
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
        
        panels.unregister(this);
    },
});

});
