/**
 * Auto-save Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");

var INTERVAL = 1000 * 10 * 1;
var FILE_SUFFIX = "swp";

module.exports = ext.register("ext/autosave/autosave", {
    dev         : "Ajax.org",
    name        : "Save",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [fs],
    offline     : true,

    nodes       : [],
    saveBuffer  : {},

    hook : function(){
        if (!self.tabEditors) {
            return;
        }

        var that = this;
        // Autosave every <interval> seconds
        this.autoSaveInterval = setInterval(function() {
            var pages = tabEditors.getPages();
            for (var i = 0, len = pages.length; i < len; i++) {
                that.saveTmp(pages[i]);
            }
        }, INTERVAL);

        var getTempPath = function(originalPath) {
            return originalPath + "." + FILE_SUFFIX;
        };

        ide.addEventListener("openfile", function(data) {
            if (!data || !data.doc)
                return;

            var node = data.doc.getNode();
            var lastModifiedOriginal = node.getAttribute("modifieddate");
            var originalPath = node.getAttribute("path");

            var bkpPath = getTempPath(originalPath);
            fs.exists(bkpPath, function(exists) {
                if (exists && "modified date is newer") {
                    fs.readFile(bkpPath, function(obj) {
                        //console.log("node", obj);
                    });
                }
            });
        });

        ide.addEventListener("afterfilesave", function(obj) {
            var bkpPath = getTempPath(obj.node.getAttribute("path"));
            fs.exists(bkpPath, function(exists) {
                if (exists)
                    fs.remove(bkpPath);
            });
        });
    },

    init : function(amlNode) {},

    saveTmp : function(page) {
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        // Check to see if the page has been actually modified since the last
        // save.
        var model = page.getModel();
        if (model && model.data.getAttribute("changed") !== "1")
            return;

        var doc = page.$doc;
        var node = doc.getNode();
        if (node.getAttribute('newfile')) {
            //this.saveas();
            // what to do
            return; // for now
        }

        if (node.getAttribute("debug"))
            return;

        var path = node.getAttribute("path");

        // check if we're already saving!
        var saving = parseInt(node.getAttribute("saving"));
        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }
        apf.xmldb.setAttribute(node, "saving", "1");

        var panel = sbMain.firstChild;
        panel.setAttribute("caption", "Saving file " + path);

        ide.dispatchEvent("beforefilesave", {
            node: node, doc: doc
        });

        var self = this;
        var value = doc.getValue();
        var bkpPath = path + "." + FILE_SUFFIX;
        fs.saveFile(bkpPath, value, function(data, state, extra) {
            if (state != apf.SUCCESS) {
                return;
            }

            panel.setAttribute("caption", "Auto-saved file " + path);
            /*
            ide.dispatchEvent("afterfilesave", {
                node: node,
                doc: doc,
                value: value
            });
            */

            apf.xmldb.removeAttribute(node, "saving");
            if (self.saveBuffer[path]) {
                delete self.saveBuffer[path];
                self.saveTmp(page);
            }
        });

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
        if (this.autoSaveInterval)
            clearInterval(this.autoSaveInterval);

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
