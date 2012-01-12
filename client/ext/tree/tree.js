/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
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
    loading          : false,
    changed          : false,
    animControl      : {},
    nodes            : [],

    "default"        : true,

    //@todo deprecated?
    getSelectedPath: function() {
        return trFiles.selected.getAttribute("path");
    },

    hook : function(){
        panels.register(this, {
            position : 1000,
            caption: "Project Files",
            "class": "project_files"
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
            checked : "[{require('ext/settings/settings').model}::auto/tree/@showhidden]",
            onclick : function(){
                _self.changed = true;
                (davProject.realWebdav || davProject)
                    .setAttribute("showhidden", this.checked);

                _self.refresh();
                settings.save();
            }
        }));

        ide.addEventListener("loadsettings", function(e) {
            var model = e.model;
            (davProject.realWebdav || davProject).setAttribute("showhidden",
                apf.isTrue(model.queryValue('auto/tree/@showhidden')));
        });

        mnuView.appendChild(new apf.divider());

        trFiles.setAttribute("model", fs.model);

        trFiles.addEventListener("afterselect", this.$afterselect = function(e) {
            var settings = require("ext/settings/settings");
            if (settings.model && settings.model.data && trFiles.selected) {
                var settings          = settings.model.data;
                if (!settings)
                    return;
                var treeSelectionNode = settings.selectSingleNode("auto/tree_selection");
                var nodeSelected      = trFiles.selected.getAttribute("path");
                var nodeType          = trFiles.selected.getAttribute("type");
                if(treeSelectionNode) {
                    apf.xmldb.setAttribute(treeSelectionNode, "path", nodeSelected);
                    apf.xmldb.setAttribute(treeSelectionNode, "type", nodeType);
                }
                else
                    apf.xmldb.appendChild(settings.selectSingleNode("auto"),
                        apf.getXml('<tree_selection path="' + nodeSelected + '" type="' + nodeType + '" />')
                    );
            }
        });

        trFiles.addEventListener("afterchoose", this.$afterselect = function(e) {
            var node = this.selected;
            if (!node || node.tagName != "file" || this.selection.length > 1
              || !ide.onLine && !ide.offlineFileSystemSupport) //ide.onLine can be removed after update apf
                    return;

            ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
        });

        trFiles.addEventListener("beforecopy", function(e) {
            if (!ide.onLine && !ide.offlineFileSystemSupport) return false;

            var args     = e.args[0].args,
                filename = args[1].getAttribute("name");

            var count = 0;
            filename.match(/\.(\d+)$/, "") && (count = parseInt(RegExp.$1, 10));
            while (args[0].selectSingleNode("node()[@name='" + filename.replace(/'/g, "\\'") + "']")) {
                filename = filename.replace(/\.(\d+)$/, "") + "." + ++count;
            }
            args[1].setAttribute("newname", filename);

            setTimeout(function () {
                fs.beforeRename(args[1], null, args[0].getAttribute("path").replace(/[\/]+$/, "") + "/" + filename, true);
                args[1].removeAttribute("newname");
            });
        });

        trFiles.addEventListener("beforestoprename", function(e) {
            if (!ide.onLine && !ide.offlineFileSystemSupport) return false;

            return fs.beforeStopRename(e.value);
        });

        trFiles.addEventListener("beforerename", function(e){
            if (!ide.onLine && !ide.offlineFileSystemSupport) return false;

            if(trFiles.$model.data.firstChild == trFiles.selected)
                return false;

            // check for a path with the same name, which is not allowed to rename to:
            var path = e.args[0].getAttribute("path"),
                newpath = path.replace(/^(.*\/)[^\/]+$/, "$1" + e.args[1]);

            var exists, nodes = trFiles.getModel().queryNodes(".//node()[@path=\""+ newpath +"\"]");
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i] == e.args[0])
                    continue;
                exists = true;
                break;
            }
            /*if (exists) {
                util.alert("Error", "Unable to move", "Couldn't move to this destination because there's already a node with the same name");
                trFiles.getActionTracker().undo();
                return false;
            }*/

            //setTimeout(function(){
                fs.beforeRename(e.args[0], e.args[1]);
            //});
        });

        trFiles.addEventListener("beforemove", function(e){
            if (!ide.onLine && !ide.offlineFileSystemSupport) return false;

            setTimeout(function(){
                var changes = e.args;
                for (var i = 0; i < changes.length; i++) {
                    // If any file exists in its future destination, cancel the event.
                    fs.beforeMove(changes[i].args[0], changes[i].args[1], trFiles);
                }
            });
        });

        var cancelWhenOffline = function(){
            if (!ide.onLine && !ide.offlineFileSystemSupport) return false;
        };

        trFiles.addEventListener("beforeadd", cancelWhenOffline);
        trFiles.addEventListener("renamestart", cancelWhenOffline);
        trFiles.addEventListener("beforeremove", cancelWhenOffline);
        trFiles.addEventListener("dragstart", cancelWhenOffline);
        trFiles.addEventListener("dragdrop", cancelWhenOffline);

        ide.addEventListener("afteroffline", function(e){
            if (!ide.offlineFileSystemSupport) {
                //trFiles.disable();
                //mnuCtxTree.disable();
            }
        });

        ide.addEventListener("afteronline", function(e){
            //trFiles.enable();
            //mnuCtxTree.enable();
        });

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

        ide.addEventListener("loadsettings", function(e){
            function treeSelect(){
                var treeSelection = model.queryNode("auto/tree_selection");
                if(treeSelection) {
                    trFiles.select(trFiles.$model.queryNode('//node()[@path="'
                        + model.queryValue('auto/tree_selection/@path') + '" and @type="'
                        + model.queryValue('auto/tree_selection/@type') + '"]'))
                }
                else {
                    trFiles.select(trFiles.$model.queryNode("node()"));
                }
            };

            var model = e.model;
            var strSettings = model.queryValue("auto/tree");
            if (strSettings) {
                _self.loading = true;
                try {
                    _self.currentSettings = JSON.parse(strSettings);
                }
                catch (ex) {
                    //fail! revert to default
                    _self.currentSettings = [];
                }

                //Unstable - temporary fix
                try {
                    if (!trFiles.xmlRoot) {
                        var model = trFiles.getModel();
                        model.addEventListener("afterload", function(){
                            trFiles.expandList(_self.currentSettings, function(){
                                _self.loading = false;
                                treeSelect();
                            });

                            model.removeEventListener("afterload", arguments.callee);

                            if (model.queryNodes('/data//node()').length <= 1)
                                trFiles.expandAll();
                        });
                    }
                    else {
                        trFiles.expandList(_self.currentSettings, function(){
                            _self.loading = false;
                            treeSelect();
                        });
                    }
                }
                catch (err){
                    model.setQueryValue("auto/tree/text()", "");
                }
            }
            else {
                if (trFiles.$model.queryNodes('/data//node()').length <= 1)
                    trFiles.expandAll();
            }
        });

        ide.addEventListener("savesettings", function(e){
            if (!_self.changed)
                return;

            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/tree/text()");
            _self.currentSettings = [];

            var path, id, lut = {};
            for (id in _self.expandedList) {
                try {
                    path = apf.xmlToXpath(_self.expandedList[id], trFiles.xmlRoot);
                    lut[path] = true;
                }
                catch(err){
                    //Node is deleted
                    delete _self.expandedList[id];
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

        /*
        ide.addEventListener("treecreate", function (e) {
            var names   = e.path.replace(/^\//g, "").split("/").reverse(),
                parent  = trFiles.getModel().data.firstChild,
                name, node;

            names.pop();
            do {
                if (!trFiles.$hasLoadStatus(parent, "loaded"))
                    break;
                name    = names.pop();
                node    = parent.selectSingleNode("node()[@name=\"" + name + "\"]");
                if (!node) {
                    var path = parent.getAttribute("path") + "/" + name,
                        xmlNode;

                    if (names.length > 0 || e.type == "folder")
                        xmlNode = "<folder type='folder' " + " path='" + path + "' name='" + name + "' />";
                    trFiles.add(xmlNode, parent);
                    break;
                }
                parent = node;
            } while (names.length > 0);

        });

        ide.addEventListener("treeremove", function (e) {
            var path = e.path.replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                        .replace(/\[@name="workspace"\]/, "")
                        .replace(/\//, "");
            var node = trFiles.getModel().data.selectSingleNode(path);

            if (node)
                apf.xmldb.removeNode(node);
        });
        */

        ide.addEventListener("treechange", function(e) {
            var path    = e.path.replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                                .replace(/\[@name="workspace"\]/, "")
                                .replace(/\//, ""),
                parent  = trFiles.getModel().data.selectSingleNode(path);
            if (!parent)
                return;

            var nodes   = parent.childNodes,
                files   = e.files,
                removed = [];

            for (var i = 0; i < nodes.length; ++i) {
                var node    = nodes[i],
                    name    = node.getAttribute("name");

                if (files && files[name])
                    delete files[name];
                else
                    removed.push(node);
            }
            removed.forEach(function (node) {
                apf.xmldb.removeNode(node);
            });
            path = parent.getAttribute("path");
            for (var name in files) {
                var file = files[name];

                xmlNode = "<" + file.type +
                    " type='" + file.type + "'" +
                    " name='" + name + "'" +
                    " path='" + path + "/" + name + "'" +
                "/>";
                trFiles.add(xmlNode, parent);
            }
        });
    },

    moveFile : function(path, newpath){
        davProject.move(path, newpath);
        trFiles.enable();
        trFiles.focus();
    },

    refresh : function(){
        trFiles.getModel().load("<data><folder type='folder' name='" + ide.projectName + "' path='" + ide.davPrefix + "' root='1'/></data>");
        this.expandedList = {};
        this.loading = true;
        ide.dispatchEvent("track_action", {type: "reloadtree"});
        try {
            var _self = this;

            trFiles.expandList(this.currentSettings, function(){
                _self.loading = false;
            });
        } catch(e) {

        }
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];

        panels.unregister(this);
    }
});

});
