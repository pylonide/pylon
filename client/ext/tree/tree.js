/**
 * Code Editor for the Cloud9 IDE
 *
 * @TODO
 * - Save & load scroll position of tree
 * - Comment everything
 * 
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var settings = require("ext/settings/settings");
var panels = require("ext/panels/panels");
var markup = require("text!ext/tree/tree.xml");

module.exports = ext.register("ext/tree/tree", {
    name             : "Project Files",
    dev              : "Ajax.org",
    alone            : true,
    type             : ext.GENERAL,
    markup           : markup,

    defaultWidth     : 200,

    deps             : [fs],

    currentSettings  : [],
    expandedList     : {},
    treeSelection    : { path : null, type : null },
    loading          : false,
    changed          : false,
    animControl      : {},
    nodes            : [],
    model            : null,

    "default"        : true,

    hook : function(){
        panels.register(this, {
            position : 1000,
            caption: "Project Files",
            "class": "project_files"
        });

        var _self = this;
        ide.addEventListener("init.ext/filesystem/filesystem", function(e) {
            _self.model = e.ext.model;
            trFiles.setAttribute("model", e.ext.model);

            if (_self.currentSettings.length >= 1) {
                setTimeout(function() {
                    _self.loadProjectTree();
                }, 1000);
            }
        });

        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            (davProject.realWebdav || davProject).setAttribute("showhidden",
                apf.isTrue(model.queryValue('auto/projecttree/@showhidden')));

            var strSettings = model.queryValue("auto/projecttree");
            if (strSettings) {
                try {
                    _self.currentSettings = JSON.parse(strSettings);
                }
                catch (ex) {
                    _self.currentSettings = [ide.davPrefix];
                }

                var savedTreeSelection = model.queryNode("auto/tree_selection");
                if (savedTreeSelection) {
                    _self.treeSelection.Path = model.queryValue('auto/tree_selection/@path');
                    _self.treeSelection.Type = model.queryValue('auto/tree_selection/@type');
                }

                if (_self.model) {
                    setTimeout(function() {
                        _self.loadProjectTree();
                    }, 1000);
                }
            }
            else {
                trFilesInsertRule.setAttribute("get", "{davProject.readdir([@path])}");
                trFiles.expandAll();
            }
        });

        ide.addEventListener("savesettings", function(e){
            if (!_self.changed)
                return;

            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/projecttree/text()");
            _self.currentSettings = [];

            var path, id, lut = {};
            for (id in _self.expandedList) {
                path = _self.expandedList[id].getAttribute("path");
                if (!path) {
                    delete _self.expandedList[id];
                }
                else {
                    lut[path] = true;
                }
            }

            var cc, parts;
            for (path in lut) {
                parts = path.split("/");
                cc = parts.shift();
                do {
                    if (!parts.length)
                        break;

                    cc += "/" + parts.shift();
                } while(lut[cc]);

                if (!parts.length)
                    _self.currentSettings.push(path);
            }

            xmlSettings.nodeValue = apf.serialize(_self.currentSettings);
            return true;
        });

        ide.addEventListener("treechange", function(e) {
            var path = e.path.replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                                .replace(/\[@name="workspace"\]/, "")
                                .replace(/\//, "");
            var parent = trFiles.getModel().data.selectSingleNode(path);

            if (!parent)
                return;

            var nodes   = parent.childNodes;
            var files   = e.files;
            var removed = [];

            for (var i = 0; i < nodes.length; ++i) {
                var node = nodes[i],
                    name = node.getAttribute("name");

                if (files && files[name])
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

    init : function() {
        var _self = this;
        this.panel = winFilesViewer;
        this.nodes.push(winFilesViewer);

        colLeft.addEventListener("hide", function(){
            splitterPanelLeft.hide();
        });
        colLeft.addEventListener("show", function() {
           splitterPanelLeft.show();
        });
        colLeft.appendChild(winFilesViewer);

        mnuFilesSettings.appendChild(new apf.item({
            id      : "mnuitemHiddenFiles",
            type    : "check",
            caption : "Show Hidden Files",
            visible : "{trFiles.visible}",
            checked : "[{require('ext/settings/settings').model}::auto/projecttree/@showhidden]",
            onclick : function(e){
                setTimeout(function() {
                    _self.changed = true;
                    (davProject.realWebdav || davProject)
                        .setAttribute("showhidden", e.currentTarget.checked);

                    _self.refresh();
                });
            }
        }));

        mnuView.appendChild(new apf.divider());

        this.setupTreeListeners();
    },

    setupTreeListeners : function() {
        var _self = this;

        trFiles.addEventListener("afterselect", this.$afterselect = function(e) {
            if (settings.model && settings.model.data && trFiles.selected) {
                var settingsData      = settings.model.data;
                var treeSelectionNode = settingsData.selectSingleNode("auto/tree_selection");
                var nodeSelected      = trFiles.selected.getAttribute("path");
                var nodeType          = trFiles.selected.getAttribute("type");
                if(treeSelectionNode) {
                    apf.xmldb.setAttribute(treeSelectionNode, "path", nodeSelected);
                    apf.xmldb.setAttribute(treeSelectionNode, "type", nodeType);
                }
                else
                    apf.xmldb.appendChild(settingsData.selectSingleNode("auto"),
                        apf.getXml('<tree_selection path="' + nodeSelected +
                            '" type="' + nodeType + '" />')
                    );
            }
        });

        trFiles.addEventListener("afterchoose", this.$afterchoose = function() {
            var node = this.selected;
            if (!node || node.tagName != "file" || this.selection.length > 1 ||
                !ide.onLine && !ide.offlineFileSystemSupport) //ide.onLine can be removed after update apf
                    return;

            ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
        });

        trFiles.addEventListener("beforecopy", function(e) {
            if (!ide.onLine && !ide.offlineFileSystemSupport)
                return false;

            var args     = e.args[0].args,
                filename = args[1].getAttribute("name");

            var count = 0;
            filename.match(/\.(\d+)$/, "") && (count = parseInt(RegExp.$1, 10));
            while (args[0].selectSingleNode("node()[@name='" + filename.replace(/'/g, "\\'") + "']")) {
                filename = filename.replace(/\.(\d+)$/, "") + "." + ++count;
            }
            args[1].setAttribute("newname", filename);

            setTimeout(function () {
                fs.beforeRename(args[1], null,
                    args[0].getAttribute("path").replace(/[\/]+$/, "") +
                    "/" + filename, true);
                args[1].removeAttribute("newname");
            });
        });

        trFiles.addEventListener("beforestoprename", function(e) {
            if (!ide.onLine && !ide.offlineFileSystemSupport)
                return false;

            return fs.beforeStopRename(e.value);
        });

        trFiles.addEventListener("beforerename", function(e){
            if (!ide.onLine && !ide.offlineFileSystemSupport) return false;

            if(trFiles.$model.data.firstChild == trFiles.selected)
                return false;

            // check for a path with the same name, which is not allowed to rename to:
            var path = e.args[0].getAttribute("path"),
                newpath = path.replace(/^(.*\/)[^\/]+$/, "$1" + e.args[1]).toLowerCase();

            var exists, nodes = trFiles.getModel().queryNodes(".//node()");
            for (var i = 0, len = nodes.length; i < len; i++) {
                var pathLwr = nodes[i].getAttribute("path").toLowerCase();
                if (nodes[i] != e.args[0] && pathLwr === newpath) {
                    exists = true;
                    break;
                }
            }

            if (exists) {
                util.alert("Error", "Unable to Rename",
                    "That name is already taken. Please choose a different name.");
                trFiles.getActionTracker().undo();
                return false;
            }

            fs.beforeRename(e.args[0], e.args[1]);
        });

        trFiles.addEventListener("beforemove", function(e){
            if (!ide.onLine && !ide.offlineFileSystemSupport)
                return false;

            setTimeout(function(){
                var changes = e.args;
                for (var i = 0; i < changes.length; i++) {
                    // If any file exists in its future destination, cancel the event.
                    fs.beforeMove(changes[i].args[0], changes[i].args[1], trFiles);
                }
            });
        });

        var cancelWhenOffline = function(){
            if (!ide.onLine && !ide.offlineFileSystemSupport)
                return false;
        };

        trFiles.addEventListener("beforeadd", cancelWhenOffline);
        trFiles.addEventListener("renamestart", cancelWhenOffline);
        trFiles.addEventListener("beforeremove", cancelWhenOffline);
        trFiles.addEventListener("dragstart", cancelWhenOffline);
        trFiles.addEventListener("dragdrop", cancelWhenOffline);

        ide.addEventListener("filecallback", function (e) {
            _self.refresh();
        });

        /**** Support for state preservation ****/
        trFiles.addEventListener("expand", function(e){
            if (!e.xmlNode)
                return;
            _self.expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)] = e.xmlNode;

            if (!_self.loading) {
                _self.changed = true;
                settings.save();
            }
        });

        trFiles.addEventListener("collapse", function(e){
            if (!e.xmlNode)
                return;
            delete _self.expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)];

            if (!_self.loading) {
                _self.changed = true;
                settings.save();
            }
        });
    },

    moveFile : function(path, newpath){
        davProject.move(path, newpath);
        trFiles.enable();
        trFiles.focus();
    },

    loadProjectTree : function(callback) {
        this.loading = true;

        var currentSettings = this.currentSettings;
        var len = currentSettings.length;
        var _self = this;

        function getLoadPath(i) {
            if (i >= len)
                return onFinish();

            var path = currentSettings[i];
            (davProject.realWebdav || davProject).readdir(path, function(data, state, extra) {
                // Strip the extra "/" that webDav adds on
                var realPath = extra.url.substr(0, extra.url.length-1);

                // Get the parent node of the new items. If the parent path is
                // the same as `ide.davPrefix`, then we append to root
                var parentNode;
                if (realPath === ide.davPrefix)
                    parentNode = trFiles.queryNode("folder[@root=1]");
                else
                    parentNode = trFiles.queryNode('//folder[@path="' + realPath + '"]');

                if (!parentNode)
                    return; // Ruh oh

                var dataXml = apf.getXml(data);
                for (var x = 0, xmlLen = dataXml.childNodes.length; x < xmlLen; x++)
                    trFiles.add(dataXml.childNodes[x], parentNode);

                trFiles.$setLoadStatus(parentNode, "loaded");
                trFiles.slideToggle(apf.xmldb.getHtmlNode(parentNode, trFiles), 1, true, null, function() {
                    getLoadPath(++i);
                });
            });
        }

        function onFinish() {
            _self.loading = false;

            // Re-select the last selected item
            if(_self.treeSelection.path) {
                var xmlNode = trFiles.$model.queryNode('//node()[@path="' +
                    _self.treeSelection.path + '" and @type="' +
                    _self.treeSelection.type + '"]');
                trFiles.select(xmlNode);
            }
            else {
                trFiles.select(trFiles.$model.queryNode("node()"));
            }

            trFilesInsertRule.setAttribute("get", "{davProject.readdir([@path])}");

            settings.save();

            if (callback)
                return callback();
        }

        getLoadPath(0);
    },

    refresh : function(){
        trFiles.getModel().load("<data><folder type='folder' name='" +
            ide.projectName + "' path='" + ide.davPrefix + "' root='1'/></data>");
        this.expandedList = {};

        trFilesInsertRule.setAttribute("get", "");

        ide.dispatchEvent("track_action", { type: "reloadtree" });

        this.loadProjectTree();
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
        trFiles.removeEventListener("afterselect", this.$afterselect);
        trFiles.removeEventListener("afterchoose", this.$afterchoose);
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];

        panels.unregister(this);
    }
});

});
