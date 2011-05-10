/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/tree/tree",
    ["core/ide", "core/ext",
     "ext/filesystem/filesystem", "ext/settings/settings", 
     "ext/panels/panels", "text!ext/tree/tree.xml"],
    function(ide, ext, fs, settings, panels, markup) {

return ext.register("ext/tree/tree", {
    name            : "Project Files",
    dev             : "Ajax.org",
    alone           : true,
    type            : ext.GENERAL,
    markup          : markup,
    visible         : true,
    currentSettings : [],
    expandedList    : {},
    loading         : false,
    changed         : false,
    
    //@todo deprecated?
    getSelectedPath: function() {
        return trFiles.selected.getAttribute("path");
    },
    
    hook : function(){
        panels.register(this);

        var btn = this.button = navbar.insertBefore(new apf.button({
            skin    : "mnubtn",
            state   : "true",
            value   : "true",
            "class" : "project_files",
            caption : "Project Files"
        }), navbar.firstChild);
        navbar.current = this;
        
        var _self = this;
        btn.addEventListener("mousedown", function(e){
            var value = this.value;
            if (navbar.current && (navbar.current != _self || value)) {
                navbar.current.disable(navbar.current == _self);
                if (value) 
                    return;
            }

            panels.initPanel(_self);
            _self.enable(true);
        });
    },

    init : function() {
        var _self = this;
        
        this.panel = winFilesViewer;
        
        colLeft.addEventListener("hide", function(){
            splitterPanelLeft.hide();
        });
        
        colLeft.addEventListener("show", function() {
           splitterPanelLeft.show(); 
        });
        
        colLeft.appendChild(winFilesViewer);
        
        mnuView.appendChild(new apf.divider()),
        mnuView.appendChild(new apf.item({
            id      : "mnuitemHiddenFiles",
            type    : "check",
            caption : "Show Hidden Files",
            checked : "[{require('ext/settings/settings').model}::auto/tree/@showhidden]",
            onclick : function(){
                _self.changed = true;
                require('ext/tree/tree').refresh();
                require("ext/settings/settings").save();
            }
        }));
        davProject.setAttribute("showhidden", "[{require('ext/settings/settings').model}::auto/tree/@showhidden]")
        
        mnuView.appendChild(new apf.divider()),
        
        trFiles.setAttribute("model", fs.model);
        
        trFiles.addEventListener("afterchoose", this.$afterselect = function(e) {
            var node = this.selected;
            if (!node || node.tagName != "file" || this.selection.length > 1 
              || !ide.onLine && !ide.hasFilesystemSupport) //ide.onLine can be removed after update apf
                return;

            ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
        });
        
        trFiles.addEventListener("beforecopy", function(e) {
            if (!ide.onLine && !ide.hasFilesystemSupport) return false;
            
            setTimeout(function () {
                var args     = e.args[0].args,
                    filename = args[1].getAttribute("name");
                fs.beforeRename(args[1], null, args[0].getAttribute("path").replace(/[\/]+$/, "") + "/" + filename);
            });
        });
       
        trFiles.addEventListener("beforestoprename", function(e) {
            if (!ide.onLine && !ide.hasFilesystemSupport) return false;

            return fs.beforeStopRename(e.value);
        });
 
        trFiles.addEventListener("beforerename", function(e){
            if (!ide.onLine && !ide.hasFilesystemSupport) return false;
            
            setTimeout(function(){
                fs.beforeRename(e.args[0], e.args[1]);
            });
        });
        
        trFiles.addEventListener("beforemove", function(e){
            if (!ide.onLine && !ide.hasFilesystemSupport) return false;
            
            setTimeout(function(){
                var changes = e.args;
                for (var i = 0; i < changes.length; i++) {
                    fs.beforeMove(changes[i].args[0], changes[i].args[1]);
                }
            });
        });
        
        var cancelWhenOffline = function(){
            if (!ide.onLine && !ide.hasFilesystemSupport) return false;
        };
        
        trFiles.addEventListener("beforeadd", cancelWhenOffline);
        trFiles.addEventListener("renamestart", cancelWhenOffline);
        trFiles.addEventListener("beforeremove", cancelWhenOffline);
        trFiles.addEventListener("dragstart", cancelWhenOffline);
        trFiles.addEventListener("dragdrop", cancelWhenOffline);
        
        ide.addEventListener("afteroffline", function(e){
            if (!ide.hasFilesystemSupport) {
                trFiles.disable();
                mnuCtxTree.disable();
            }
        });
        
        ide.addEventListener("afteronline", function(e){
            trFiles.enable();
            mnuCtxTree.enable();
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
            var model = e.model;
            var strSettings = model.queryValue("auto/tree");
            if (strSettings) {
                _self.loading = true;
                _self.currentSettings = apf.unserialize(strSettings);
                
                //Unstable - temporary fix
                try{
                    if (!trFiles.xmlRoot) {
                        trFiles.addEventListener("afterload", function(){
                            trFiles.expandList(_self.currentSettings, function(){
                                _self.loading = false;
                            });
                            
                            trFiles.removeEventListener("load", arguments.callee);
                        });
                    }
                    else {
                        trFiles.expandList(_self.currentSettings, function(){
                            _self.loading = false;
                        });
                    }
                }catch(e){
                    model.setQueryValue("auto/tree/text()", "");
                }
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
                catch(e){
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
                // console.log("CHECKING", parent, name);
                node    = parent.selectSingleNode("node()[@name=\"" + name + "\"]");
                if (!node) {
                    var path = parent.getAttribute("path") + "/" + name,
                        xmlNode;
                        
                    if (names.length > 0 || e.type == "folder")
                        xmlNode = "<folder type='folder' " + " path='" + path + "' name='" + name + "' />";
                    // console.log("INSERTING", xmlNode, parent);
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
                 
                if (files[name])
                    delete files[name];
                else
                    removed.push(node);
            }
            removed.forEach(function (node) {
                // console.log("REMOVE", node);
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
                // console.log("CREATE", xmlNode, parent);
                trFiles.add(xmlNode, parent);
            }
        });
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

    enable : function(noButton){
        winFilesViewer.show();
        colLeft.show();
        if (!noButton) {
            this.button.setValue(true);
            if(navbar.current && (navbar.current != this))
                navbar.current.disable(false);
        }
        
        navbar.current = this;
    },

    disable : function(noButton){
        if (self.winFilesViewer)
            winFilesViewer.hide();
        if (!noButton)
            this.button.setValue(false);
    },

    destroy : function(){
        davProject.destroy(true, true);
        mdlFiles.destroy(true, true);
        trFiles.destroy(true, true);

        trFiles.removeEventListener("afterselect", this.$afterselect);
        
        panels.unregister(this);
    }
});

});
