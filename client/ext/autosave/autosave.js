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
var settings = require("text!ext/autosave/settings.xml");
var markup = require("text!ext/autosave/autosave.xml");
var extSettings = require("ext/settings/settings");

var INTERVAL = 1000 * 60 * 5; // 5 minutes
var FILE_SUFFIX = "swp";

module.exports = ext.register("ext/autosave/autosave", {
    dev         : "Ajax.org",
    name        : "Save",
    alone       : true,
    type        : ext.GENERAL,
    markup      : markup,
    deps        : [fs],
    offline     : true,

    nodes       : [],
    saveBuffer  : {},

    hook : function(){
        if (!self.tabEditors)
            return;

        var that = this;
        this.autoSaveInterval = setInterval(function() {
            that.doAutoSave();
        }, INTERVAL);

        ide.addEventListener("openfile", function(data) {
            if (!data || !data.doc)
                return;

            var node = data.doc.getNode();
            var dateOriginal = new Date(node.getAttribute("modifieddate"));
            var originalPath = node.getAttribute("path");
            var bkpPath = that._getTempPath(originalPath);

            fs.exists(bkpPath, function(exists) {
                var node = fs.model.data.selectSingleNode("//file[@path='" + bkpPath + "']");
                var date = node && new Date(node.getAttribute("modifieddate"));

                if (exists && node && date.getTime() > dateOriginal.getTime()) {
                    ext.initExtension(that);

                    fs.readFile(bkpPath, function(contents) {
                        winNewerSave.restoredContents = contents;
                        winNewerSave.doc = data.doc;
                        winNewerSave.path = bkpPath;
                        winNewerSave.show();
                    });
                }
            });
        });

        ide.addEventListener("afterfilesave", function(obj) {
            that._removeFile(that._getTempPath(obj.node.getAttribute("path")));
        });

        ide.addEventListener("init.ext/settings/settings", function (e) {
            barSettings.insertMarkup(settings);
        });
    },

    init : function(amlNode) {
        var self = this;
        winNewerSave.onafterrender = function(){
            btnRestoreYes.addEventListener("click", function() {
                winNewerSave.doc.setValue(winNewerSave.restoredContents)

                winNewerSave.restoredContents = null;
                winNewerSave.doc = null;
                winNewerSave.path = null;

                winNewerSave.hide()
            });
            btnRestoreNo.addEventListener("click", function() {
                // It is understood that if the user doesn't want to restore
                // contents from the previous file the first time, he will
                // never want to.
                winNewerSave.path && self._removeFile(winNewerSave.path);

                winNewerSave.restoredContents = null;
                winNewerSave.doc = null;
                winNewerSave.path = null;

                winNewerSave.hide();
            });
        }
    },

    doAutoSave: function() {
        var self = this;
        var node = extSettings.model.data.selectSingleNode("general/@autosave");

        if (node && node.firstChild && node.firstChild.nodeValue == "true") {
            var pages = tabEditors.getPages();
            for (var i = 0, len = pages.length; i < len; i++) {
                self.saveTmp(pages[i]);
            }
        }
    },

    _getTempPath: function(originalPath) {
        return originalPath + "." + FILE_SUFFIX;
    },

    _removeFile: function(path) {
        fs.exists(path, function(exists) {
            if (exists)
                fs.remove(path);
        });
    },

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

        ext.initExtension(this);

        var doc = page.$doc;
        var node = doc.getNode();
        if (node.getAttribute('newfile')) {
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

        var self = this;
        var value = doc.getValue();
        var bkpPath = path + "." + FILE_SUFFIX;
        fs.saveFile(bkpPath, value, function(data, state, extra) {
            if (state != apf.SUCCESS)
                return;

            panel.setAttribute("caption", "Auto-saved file " + path);

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
