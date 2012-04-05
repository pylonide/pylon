/**
 * File Tree for the Cloud9 IDE
 *
 * @TODO
 * - Save & load scroll position of tree
 * - Comment everything
 * 
 * @copyright 2012, Cloud9 IDE, Inc.
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
    dev              : "Cloud9 IDE, Inc.",
    alone            : true,
    type             : ext.GENERAL,
    markup           : markup,

    defaultWidth     : 200,

    deps             : [fs],

    currentSettings  : [],
    loadedSettings   : 0,
    expandedList     : {},
    treeSelection    : { path : null, type : null },
    loading          : false,
    changed          : false,
    animControl      : {},
    nodes            : [],
    model            : null,

    "default"        : true,

    hook : function(){
        // Register this panel on the left-side panels
        panels.register(this, {
            position : 1000,
            caption: "Project Files",
            "class": "project_files"
        });

        var _self = this;

        /**
         * Wait for the filesystem extension to load before we set up our
         * model
         */
        ide.addEventListener("init.ext/filesystem/filesystem", function(e) {
            _self.model = e.ext.model;

            // loadedSettings is set after "loadsettings" is dispatched.
            // Thus if we have our model setup and we have the cached expanded
            // folders, then we can load the project tree
            if (_self.loadedSettings > 0 && _self.inited)
                _self.onReady();
        });

        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            (davProject.realWebdav || davProject).setAttribute("showhidden",
                apf.isTrue(model.queryValue('auto/projecttree/@showhidden')));

            // auto/projecttree contains the saved expanded nodes
            var strSettings = model.queryValue("auto/projecttree");
            if (strSettings) {
                try {
                    _self.currentSettings = JSON.parse(strSettings);
                }
                catch (ex) {
                    _self.currentSettings = [ide.davPrefix];
                }

                // Get the last selected tree node
                var savedTreeSelection = model.queryNode("auto/tree_selection");
                if (savedTreeSelection) {
                    _self.treeSelection.path = model.queryValue('auto/tree_selection/@path');
                    _self.treeSelection.type = model.queryValue('auto/tree_selection/@type');
                }

                _self.loadedSettings = 1;

                // Please see note above about waiting for both the model and
                // the settings to be loaded before loading the project tree
                if (_self.model && _self.inited)
                    _self.onReady();
            }
            else {
                _self.loadedSettings = 2;
                if (_self.model && _self.inited)
                    _self.onReady();
            }
        });

        ide.addEventListener("savesettings", function(e){
            if (!_self.changed)
                return;

            var xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/projecttree/text()");
            _self.currentSettings = [];

            var path, id;

            // expandedList keeps an active record of all the expanded nodes
            // so that on each save this gets serialized into the auto/projecttree
            // settings node
            for (id in _self.expandedList) {
                path = _self.expandedList[id].getAttribute("path");
                if (!path) {
                    delete _self.expandedList[id];
                }
                else {
                    _self.currentSettings.push(path);
                }
            }

            xmlSettings.nodeValue = JSON.stringify(_self.currentSettings);
            _self.changed = false;
            return true;
        });

        /**
         * This receives updates from the tree watcher on the backend
         * I haven't looked deeply at this code, but it looks like it removes
         * and adds nodes
         */
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
        
        ext.initExtension(this);
    },

    onReady : function() {
        var _self = this;
        trFiles.setAttribute("model", this.model);
        if(this.loadedSettings === 1) {
            setTimeout(function() {
                _self.loadProjectTree();
            }, 1000);
        }

        // If no settings were found, then we set the "get" attribute of
        // the AML insert rule for the tree and expand the root. The
        // "get" attr is originally empty by default so when we run
        // this.loadProjectTree() the tree itself doesn't try to duplicate
        // our actions
        else {
            trFilesInsertRule.setAttribute("get", "{davProject.readdir([@path])}");
            trFiles.expandAll();
        }
    },

    init : function() {
        var _self = this;

        // Set the panel var for the panels extension
        this.panel = winFilesViewer;
        this.nodes.push(winFilesViewer);

        colLeft.appendChild(winFilesViewer);

        // This adds a "Show Hidden Files" item to the settings dropdown
        // from the Project Files header
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

        this.setupTreeListeners();

        if (_self.loadedSettings > 0 && _self.model)
            _self.onReady();
    },

    /**
     * Sets up listeners on tree events
     */
    setupTreeListeners : function() {
        var _self = this;

        // After an item in the tree has been clicked on, this saves that
        // selection in the settings model
        trFiles.addEventListener("afterselect", this.$afterselect = function(e) {
            if (settings.model && settings.model.data && trFiles.selected) {
                var nodePath          = trFiles.selected.getAttribute("path");
                var nodeType          = trFiles.selected.getAttribute("type");
                var settingsData      = settings.model.data;
                var treeSelectionNode = settingsData.selectSingleNode("auto/tree_selection");
                if(treeSelectionNode) {
                    apf.xmldb.setAttribute(treeSelectionNode, "path", nodePath);
                    apf.xmldb.setAttribute(treeSelectionNode, "type", nodeType);
                }
                else {
                    apf.xmldb.appendChild(settingsData.selectSingleNode("auto"),
                        apf.getXml('<tree_selection path="' + nodePath +
                            '" type="' + nodeType + '" />')
                    );
                }

                // Also update our own internal selection vars for when the
                // user refreshes the tree
                _self.treeSelection.path = nodePath;
                _self.treeSelection.type = nodeType;
            }
        });

        // Opens a file after the user has double-clicked
        trFiles.addEventListener("afterchoose", this.$afterchoose = function() {
            var node = this.selected;
            if (!node || node.tagName != "file" || this.selection.length > 1 ||
                !ide.onLine && !ide.offlineFileSystemSupport) //ide.onLine can be removed after update apf
                    return;

            ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
        });

        trFiles.addEventListener("beforecopy", this.$beforecopy = function(e) {
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

        trFiles.addEventListener("beforestoprename", this.$beforestoprename = function(e) {
            if (!ide.onLine && !ide.offlineFileSystemSupport)
                return false;

            return fs.beforeStopRename(e.value);
        });

        trFiles.addEventListener("beforerename", this.$beforerename = function(e){
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

        trFiles.addEventListener("beforemove", this.$beforemove = function(e){
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
        
        trFiles.addEventListener("keyup", this.$keyup = function(e){
            if(this.dragging > 0) {
                apf.DragServer.stop();
            }
        });
        
        trFiles.addEventListener("beforeadd", this.cancelWhenOffline);
        trFiles.addEventListener("renamestart", this.cancelWhenOffline);
        trFiles.addEventListener("beforeremove", this.cancelWhenOffline);
        trFiles.addEventListener("dragstart", this.cancelWhenOffline);
        trFiles.addEventListener("dragdrop", this.cancelWhenOffline);

        // When a folder has been expanded, save it in expandedList
        trFiles.addEventListener("expand", this.$expand = function(e){
            if (!e.xmlNode)
                return;
            _self.expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)] = e.xmlNode;

            // Only save if we are not loading the tree
            if (!_self.loading) {
                _self.changed = true;
                settings.save();
            }
        });

        // When a folder has been expanded, remove it from expandedList
        trFiles.addEventListener("collapse", this.$collapse = function(e){
            if (!e.xmlNode)
                return;
            delete _self.expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)];

            if (!_self.loading) {
                _self.changed = true;
                settings.save();
            }
        });
    },

    $cancelWhenOffline : function() {
        if (!ide.onLine && !ide.offlineFileSystemSupport)
            return false;
    },

    moveFile : function(path, newpath){
        davProject.move(path, newpath);
        trFiles.enable();
        trFiles.focus();
    },

    /**
     * Loads the project tree based on currentSettings, which is an array of
     * folders that were previously expanded, otherwise it contains only the
     * root identifier (i.e. ide.davPrefix)
     * 
     * @param callback callback Called fired when the tree is fully loaded
     */
    loadProjectTree : function(callback) {
        this.loading = true;

        var currentSettings = this.currentSettings;
        var _self = this;

        /**
         * Called recursively. `i` is used as the iterator moving through
         * the currentSettings array
         * 
         * @param number i The iterator for referencing currentSettings' elements
         */
        function getLoadPath(i) {
            if (i >= currentSettings.length)
                return onFinish();

            var path = currentSettings[i];

            // At some point davProject.realWebdav is set but you'll note that
            // tree.xml is able ot use just davProject (which is an intended
            // global). Why we cannot use that here escapes me, so we have to
            // check which one is available for us to use (and yes, realWebdav
            // can sometimes not be set on initial load)
            (davProject.realWebdav || davProject).readdir(path, function(data, state, extra) {
                // Folder not found
                if (extra.status === 404) {
                    _self.changed = true;
                    currentSettings.splice(i, 1);
                    return getLoadPath(i);
                }

                // Strip the extra "/" that webDav adds on
                var realPath = extra.url.substr(0, extra.url.length-1);

                // Get the parent node of the new items. If the path is the
                // same as `ide.davPrefix`, then we append to root
                var parentNode;
                if (realPath === ide.davPrefix)
                    parentNode = trFiles.queryNode("folder[@root=1]");
                else
                    parentNode = trFiles.queryNode('//folder[@path="' + realPath + '"]');

                // Hmm? Folder deleted?
                if (!parentNode) {
                    _self.changed = true;
                    currentSettings.splice(i, 1);
                    return getLoadPath(i);
                }

                var dataXml = apf.getXml(data);
                for (var x = 0, xmlLen = dataXml.childNodes.length; x < xmlLen; x++) {
                    // Since appendChild removes the node from the array, we
                    // must first clone the node and then append it to the parent
                    var clonedNode = dataXml.childNodes[x].cloneNode(true);
                    apf.xmldb.appendChild(parentNode, clonedNode);
                }

                // If the load status is not set, then APF assumes the child
                // nodes still need to be loaded and the folder icon is replaced
                // with a perennial spinner
                trFiles.$setLoadStatus(parentNode, "loaded");

                // Slide open the folder and then get the next cached folder's
                // contents
                trFiles.slideToggle(apf.xmldb.getHtmlNode(parentNode, trFiles), 1, true, null, function() {
                    getLoadPath(++i);
                });
            });
        }

        // Called when every cached node has been loaded
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

            // Now set the "get" attribute of the <a:insert> rule so the tree
            // knows to ask webdav for expanded folders' contents automatically
            trFilesInsertRule.setAttribute("get", "{davProject.readdir([@path])}");

            settings.save();

            if (callback)
                return callback();
        }

        // Let's kick this sucker off!
        getLoadPath(0);
    },

    /**
     * Called when the user hits the refresh button in the Project Files header
     */
    refresh : function(){
        trFiles.getModel().load("<data><folder type='folder' name='" +
            ide.projectName + "' path='" + ide.davPrefix + "' root='1'/></data>");
        this.expandedList = {};

        // Make sure the "get" attribute is empty so the file tree doesn't
        // think it's the one loading up all the data when loadProjectTree
        // expands folders
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
        trFiles.removeEventListener("expand", this.$expand);
        trFiles.removeEventListener("collapse", this.$collapse);
        trFiles.removeEventListener("beforemove", this.$beforemove);
        trFiles.removeEventListener("beforerename", this.$beforerename);
        trFiles.removeEventListener("beforestoprenam", this.$beforestoprename);
        trFiles.removeEventListener("beforecopy", this.$beforecopy);
        trFiles.removeEventListener("beforeadd", this.$cancelWhenOffline);
        trFiles.removeEventListener("renamestart", this.$cancelWhenOffline);
        trFiles.removeEventListener("beforeremove", this.$cancelWhenOffline);
        trFiles.removeEventListener("dragstart", this.$cancelWhenOffline);
        trFiles.removeEventListener("dragdrop", this.$cancelWhenOffline);
        trFiles.removeEventListener("keyup", this.$keyup);

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];

        panels.unregister(this);
    }
});

});
