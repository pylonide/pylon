
/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/filesystem/filesystem.js)SIZE(10057)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/filesystem/filesystem",
    ["core/ide", "core/ext", "core/util"], function(ide, ext, util) {

module.exports = ext.register("ext/filesystem/filesystem", {
    name   : "File System",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    deps   : [],
    commands: {
        "open": {
            "hint": "open a file to edit in a new tab",
            "commands": {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        },
        "c9": {
            "hint": "alias for 'open'",
            "commands": {
                "[PATH]": {"hint": "path pointing to a file. Autocomplete with [TAB]"}
            }
        }
    },

    readFile : function (path, callback){
        if (this.webdav)
            this.webdav.read(path, callback);
    },

    saveFile : function(path, data, callback) {
        if (this.webdav)
            this.webdav.write(path, data, null, callback);
    },

    list : function(path, callback) {
        if (this.webdav)
            this.webdav.list(path, callback);
    },
    
    exists : function(path, callback) {
        this.readFile(path, function (data, state, extra) {
            callback(state == apf.SUCCESS)
        });
    },

    createFolder: function(name, tree) {
        if (!tree) {
            tree = apf.document.activeElement;
            if (!tree || tree.localName != "tree")
                tree = trFiles;  
        }
        
        var node = tree.selected;
        if (!node)
            node = tree.xmlRoot.selectSingleNode("folder");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;

        if (this.webdav) {
            var prefix = name ? name : "New Folder";
            var path = node.getAttribute("path");
            if (!path) {
                path = ide.davPrefix;
                node.setAttribute("path", path);
            }
            
            var _self = this,
                index = 0;
            
            function test(exists) {
                if (exists) {
                    name = prefix + "." + index++;
                    _self.exists(path + "/" + name, test);     
                } else {
		            tree.focus();
		            _self.webdav.exec("mkdir", [path, name], function(data) {
		                // @todo: in case of error, show nice alert dialog
		                if (data instanceof Error)
		                    throw Error;
		                
		                var strXml = data.match(new RegExp(("(<folder path='" + path 
		                        + "/" + name + "'.*?>)").replace(/\//g, "\\/")))[1];
		
		                var folder = apf.xmldb.appendChild(node, apf.getXml(strXml));
		
		                tree.select(folder);
		                tree.startRename();
		            });
	            }
	        }
	        
	        name = prefix;
	        this.exists(path + "/" + name, test);
        }
    },

    createFile: function(filename, contenttype) {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder");
        if (node.getAttribute("type") != "folder")
            node = node.parentNode;

        if (this.webdav) {
            var prefix = filename ? filename : "Untitled.txt";

            trFiles.focus();
            var _self = this,
                path  = node.getAttribute("path");
            if (!path) {
                path = ide.davPrefix;
                node.setAttribute("path", path);
            }
            
            var index = 0;
            
            function test(exists) {
                if (exists) {
                    filename = prefix + "." + index++;
                    _self.exists(path + "/" + filename, test);    
                } else {
		            _self.webdav.exec("create", [path, filename], function(data) {
		                _self.webdav.exec("readdir", [path], function(data) {
		                    // @todo: in case of error, show nice alert dialog
		                    if (data instanceof Error)
		                        throw Error;
		                    
		                    var strXml = data.match(new RegExp(("(<file path='" + path 
		                        + "/" + filename + "'.*?>)").replace(/\//g, "\\/")))[1];
		
		                    var file = apf.xmldb.appendChild(node, apf.getXml(strXml));
		                    
		                    trFiles.select(file);
		                    trFiles.startRename();
		                });
		            });
		        }
            }
	        
	        filename = prefix;
	        this.exists(path + "/" + filename, test);
        }
    },

    beforeRename : function(node, name, newPath) {
        var path = node.getAttribute("path"),
            page = tabEditors.getPage(path);

        if (name)
            newPath = path.replace(/^(.*\/)[^\/]+$/, "$1" + name);
        else
            name = newPath.match(/[^/]+$/);
            
        node.setAttribute("path", newPath);
        apf.xmldb.setAttribute(node, "name", name);
        if (page)
            page.setAttribute("id", newPath);
    },

    beforeMove: function(parent, node) {
        var path = node.getAttribute("path"),
            page = tabEditors.getPage(path),
            newpath = parent.getAttribute("path") + "/" + node.getAttribute("name");

        node.setAttribute("path", newpath);//apf.xmldb.setAttribute(node, "path", newpath);
        if (page)
            page.setAttribute("id", newpath);
    },

    remove: function(path) {
        var page = tabEditors.getPage(path);
        if (page)
            tabEditors.remove(page);

        davProject.remove(path, false, function() {
//            console.log("deleted", path);
        });
    },

    /**** Init ****/

    projectName : "Project",
    
    init : function(amlNode){
        this.model = new apf.model();
        this.model.load("<data><folder type='folder' name='" + this.projectName + "' path='" + ide.davPrefix + "' root='1'/></data>");

        var url;
        if (location.host) {
            var dav_url = location.href.replace(location.path + location.hash, "") + ide.davPrefix;
            this.webdav = new apf.webdav({
                id  : "davProject",
                url : dav_url
            });
            url = "{davProject.getroot()}";
        }
        else {
            url = "ext/filesystem/files.xml";
            this.readFile = this.saveFile = apf.K;
        }

        function openHandler(e) {
            ide.socket.send(JSON.stringify({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "filesystem"
            }));
            return false;
        }
        ide.addEventListener("consolecommand.open", openHandler);
        ide.addEventListener("consolecommand.c9",   openHandler);

        ide.addEventListener("consoleresult.internal-isfile", function(e) {
            var data = e.data;
            if (data.sender != "filesystem")
                return;
            var path = data.cwd.replace(ide.workspaceDir, ide.davPrefix);
            if (data.isfile)
                require("ext/debugger/debugger").showFile(path);
            else
                require("ext/console/console").log("'" + path + "' is not a file.");
        });

        /*this.model.insert(url, {
            insertPoint : this.model.queryNode("folder[@root='1']")
        });*/

        var fs = this;
        ide.addEventListener("openfile", function(e){
            var doc  = e.doc;
            var node = doc.getNode();

            if (doc.hasValue()) {
                ide.dispatchEvent("afteropenfile", {doc: doc});
                return;
            }

            var path = node.getAttribute("path");
            fs.readFile(path, function(data, state, extra) {
                if (state != apf.SUCCESS) {
                    if (extra.status == 404) {
                        ide.dispatchEvent("filenotfound", {
                            node : node,
                            url  : extra.url,
                            path : path
                        });
                    }
                }
                else {
	                node.setAttribute("scriptname", ide.workspaceDir + path.slice(ide.davPrefix.length));
                    
                    doc.setValue(data);
	                ide.dispatchEvent("afteropenfile", {doc: doc});	                
                }
            });
        });
        
        ide.addEventListener("reload", function(e) {
            var doc  = e.doc,
                node = doc.getNode(),
                path = node.getAttribute("path");
            
            fs.readFile(path, function(data, state, extra) {
	            if (state != apf.SUCCESS) {
	                if (extra.status == 404)
	                    ide.dispatchEvent("filenotfound", {
	                        node : node,
	                        url  : extra.url,
	                        path : path
	                    });
	            } else {
	               ide.dispatchEvent("afterreload", {doc : doc, data : data});
	            }
            });
        });   

        fs.setProjectName(ide.workspaceDir.split("/").pop());
    },

    setProjectName : function(name) {
        this.model && this.model.setQueryValue("folder[@root='1']/@name", name);
        this.projectName = name;
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
        this.webdav.destroy(true, true);
        this.model.destroy(true, true);
    }
});

});


/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/settings/settings.js)SIZE(6502)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/settings/settings",
    ["core/ide", "core/ext", "core/util", "ext/filesystem/filesystem",
     "text!ext/settings/settings.xml", "text!ext/settings/template.xml"],
    function(ide, ext, util, fs, markup, template) {

module.exports = ext.register("ext/settings/settings", {
    name    : "Settings",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    file    : ide.settingsUrl,
    commands : {
        "showsettings": {hint: "open the settings window"}
    },
    hotitems: {},

    nodes : [],

    save : function(){
        var _self = this;
        clearTimeout(this.$customSaveTimer);

        this.$customSaveTimer = setTimeout(function(){
            ide.dispatchEvent("savesettings", {model : _self.model});
            _self.saveToFile();
        }, 100);
    },

    saveToFile : function(){
        //apf.console.log("SAVING SETTINGS");
        fs.saveFile(this.file, this.model.data && apf.xmldb.cleanXml(this.model.data.xml) || "");
    },

    saveSettingsPanel: function() {
        var pages   = self.pgSettings ? pgSettings.getPages() : [],
            i       = 0,
            l       = pages.length,
            changed = false;
        for (; i < l; ++i) {
            if (!pages[i].$at) continue;
            if (pages[i].$at.undolength > 0) {
                pages[i].$commit(pages[i]);
                changed = true;
            }
        }
        if (ide.dispatchEvent("savesettings", {
            model : this.model
        }) !== false || changed)
            this.saveToFile();
    },

    getSectionId: function(part) {
        return "pgSettings" + part.replace(/ /g, "_");
    },

    addSection : function(tagName, name, xpath, cbCommit){
        var id = this.getSectionId(name),
            page = pgSettings.getPage(id);
        if (page)
            return page;
		var node = this.model.queryNode(xpath + "/" + tagName);
        if (!node)
            this.model.appendXml('<' + tagName + ' name="' + name +'" page="' + id + '" />', xpath);
		else
			node.setAttribute("page", id);
        page = pgSettings.add(name, id);
        page.$at = new apf.actiontracker();
        page.$commit = cbCommit || apf.K;
        return page;
    },

    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Settings...",
                onclick : this.showsettings.bind(this)
            }), ide.mnuFile.childNodes[ide.mnuFile.childNodes.length - 2])
        );
        this.hotitems["showsettings"] = [this.nodes[0]];

        this.model = new apf.model();
        /*fs.readFile(_self.file, function(data, state, extra){
            if (state != apf.SUCCESS)
                _self.model.load(template);
            else
                _self.model.load(data);

            ide.dispatchEvent("loadsettings", {
                model : _self.model
            });
        });*/

        this.model.load(this.convertOrBackup() ? template : ide.settings);

        ide.dispatchEvent("loadsettings", {
            model : _self.model
        });

        var checkSave = function() {
            if (ide.dispatchEvent("savesettings", {
                model : _self.model
            }) === true)
                _self.saveToFile();
        };
        this.$timer = setInterval(checkSave, 60000);

        apf.addEventListener("exit", checkSave);

        ide.addEventListener("$event.loadsettings", function(callback) {
            callback({model: _self.model});
        });
    },

    convertOrBackup: function() {
        if (!ide.settings || ide.settings.indexOf("d:error") > -1)
            return true;
        // <section> elements are from version < 0.0.3 (deprecated)...
        if (ide.settings.indexOf("<section") > -1) {
            // move file to /workspace/.settings.xml.old
            var moved = false,
                _self = this;
            apf.asyncWhile(function() {
                return !moved;
            },
            function(iter, next) {
                //move = function(sFrom, sTo, bOverwrite, bLock, callback)
                var newfile = _self.file + ".old" + (iter === 0 ? "" : iter);
                fs.webdav.move(_self.file, newfile, false, null, function(data, state, extra) {
                    var iStatus = parseInt(extra.status);
                    if (iStatus != 403 && iStatus != 409 && iStatus != 412
                      && iStatus != 423 && iStatus != 424 && iStatus != 502 && iStatus != 500) {
                        moved = true;
                    }
                    next();
                });
            });
            return true;
        }

        return false;
    },

    init : function(amlNode){
        this.btnOK = winSettings.selectSingleNode("a:vbox/a:hbox[2]/a:button[1]");
        this.btnOK.onclick = this.saveSettings.bind(this);
        this.btnCancel = winSettings.selectSingleNode("a:vbox/a:hbox[2]/a:button[2]");
        this.btnCancel.onclick = this.cancelSettings;
        this.btnApply = winSettings.selectSingleNode("a:vbox/a:hbox[2]/a:button[3]");
        this.btnApply.onclick = this.applySettings.bind(this);
    },

    showsettings: function() {
        ext.initExtension(this);
        winSettings.show();
        return false;
    },

    saveSettings: function() {
        winSettings.hide();
        this.saveSettingsPanel();
    },

    applySettings: function() {
        this.saveSettingsPanel();
    },

    cancelSettings: function() {
        winSettings.hide();
        var pages = pgSettings.getPages(),
            i     = 0,
            l     = pages.length;
        for (; i < l; ++i) {
            if (!pages[i].$at) continue;
            pages[i].$at.undo(-1);
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

    }
);

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/editors/editors.js)SIZE(14242)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/editors/editors",
    ["core/ide", "core/ext", "core/util", "ext/panels/panels"],
    function(ide, ext, util, panels) {

module.exports = ext.register("ext/editors/editors", {
    name    : "Editors",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],
    visible : true,

    contentTypes  : {},

    register : function(oExtension){
        var id = "rb" + oExtension.path.replace(/\//g, "_");

        /*oExtension.$rbEditor = barButtons.appendChild(new apf.radiobutton({
            id        : id,
            label     : oExtension.name,
            value     : oExtension.path,
            margin    : "0 -1 0 0",
            visible   : "{require('ext/editors/editors').isEditorAvailable(tabEditors.activepage, '" + oExtension.path + "')}",
            onclick   : function(){
                require('ext/editors/editors').switchEditor(this.value);
            }
        }));*/

        //Add a menu item to the list of editors
        /*oExtension.$itmEditor = ide.mnuEditors.appendChild(new apf.item({
            type    : "radio",
            caption : oExtension.name,
            value   : oExtension.path,
            onclick : function(){
                require('ext/editors/editors').switchEditor(this.value);
            }
        }));*/

        var _self = this;
        oExtension.contentTypes.each(function(mime){
            (_self.contentTypes[mime] || (_self.contentTypes[mime] = [])).push(oExtension);
        });

        if (!this.contentTypes["default"])
            this.contentTypes["default"] = oExtension;
    },

    unregister : function(oExtension){
        //oExtension.$rbEditor.destroy(true, true);
        //oExtension.$itmEditor.destroy(true, true);

        var _self = this;
        oExtension.contentTypes.each(function(fe){
            _self.contentTypes[fe].remove(oExtension);
            if (!_self.contentTypes[fe].length)
                delete _self.contentTypes[fe];
        });

        if (this.contentTypes["default"] == oExtension) {
            delete this.contentTypes["default"];

            for (var prop in this.contentTypes) {
                this.contentTypes["default"] = this.contentTypes[prop][0];
                break;
            }
        }
    },

    addTabSection : function(){
        var _self = this;
        var vbox = this.hbox.appendChild(
            new apf.bar({id:"tabPlaceholder", flex:1, skin:"basic"})
        );

        var tab = new apf.bar({
            skin     : "basic",
            style    : "padding : 0 0 33px 0;position:absolute;", //53px
            htmlNode : document.body,
            childNodes: [
                new apf.tab({
                    id       : "tabEditors",
                    skin     : "editor_tab",
                    style    : "height : 100%",
                    buttons  : "close,scale",
                    onfocus  : function(e){
                        _self.switchfocus(e);
                    },
                    onbeforeswitch : function(e){
                        _self.beforeswitch(e);
                    },
                    onafterswitch : function(e){
                        _self.afterswitch(e);
                    },
                    onclose : function(e){
                        _self.close(e.page);
                    }
                })/*,
                new apf.hbox({
                    id      : "barButtons",
                    edge    : "0 0 0 6",
                    "class" : "relative",
                    zindex  : "1000",
                    bottom  : "0",
                    left    : "0",
                    right   : "0"
                })*/
            ]
        });
        
        tabPlaceholder.addEventListener("resize", function(e){
            var ext = tab.$ext, ph;
            var pos = apf.getAbsolutePosition(ph = tabPlaceholder.$ext);
            ext.style.left = pos[0] + "px";
            ext.style.top  = pos[1] + "px";
            var d = apf.getDiff(ext);
            ext.style.width = (ph.offsetWidth - d[0]) + "px";
            ext.style.height = (ph.offsetHeight - d[1]) + "px";
        });

        return vbox;
    },

    isEditorAvailable : function(page, path){
        var editor = ext.extLut[path];
        if (!editor)
            return false;

        var contentTypes = editor.contentTypes;
        var isEnabled = contentTypes.indexOf(tabEditors.getPage(page).contentType) > -1;
        
        if (!isEnabled && this.contentTypes["default"] == editor)
            return true; 
        else
            return isEnabled;
    },

    initEditor : function(editor){
        //Create Page Element
        var editorPage = new apf.page({
            id        : editor.path,
            mimeTypes : editor.contentTypes,
            visible   : false,
            realtime  : false
        });
        tabEditors.appendChild(editorPage);

        //Initialize Content of the page
        ext.initExtension(editor, editorPage);

        return editorPage;
    },

    switchEditor : function(path){
        var page = tabEditors.getPage();
        if (!page || page.type == path)
            return;

        var lastType = page.type;

        var editor = ext.extLut[path];
        if (!editor.inited)
            this.initEditor(editor);

        //editor.$itmEditor.select();
        //editor.$rbEditor.select();

        page.setAttribute("type", path);

        this.beforeswitch({nextPage: page});
        this.afterswitch({nextPage: page, previousPage: {type: lastType}});
    },

    openEditor : function(doc, init, active) {
        var xmlNode  = doc.getNode();
        var filename = xmlNode.getAttribute("name");
        var filepath = xmlNode.getAttribute("path");

        var page = tabEditors.getPage(filepath);
        if (page) {
            tabEditors.set(page);
            return;
        }

        var contentType = (xmlNode.getAttribute("contenttype") || "").split(";")[0];
        var editor = this.contentTypes[contentType] && this.contentTypes[contentType][0] || this.contentTypes["default"];

        if (!init && this.currentEditor)
            this.currentEditor.disable();

        if (!editor) {
            util.alert(
                "No editor is registered",
                "Could not find an editor to display content",
                "There is something wrong with the configuration of your IDE. No editor plugin is found.");
            return;
        }

        if (!editor.inited)
            var editorPage = this.initEditor(editor);
        else
            editorPage = tabEditors.getPage(editor.path);

        //Create Fake Page
        if (init)
            tabEditors.setAttribute("buttons", "close");
        
        var model = new apf.model(), 
            fake = tabEditors.add("{([@changed] == 1 ? '*' : '') + [@name]}", filepath, editor.path, null, function(page){
                page.contentType = contentType;
                page.$at     = new apf.actiontracker();
                page.$doc    = doc;
                page.$editor = editor;
                
                page.setAttribute("model", page.$model = model);
                page.$model.load(xmlNode);
            });

        if (init)
            tabEditors.setAttribute("buttons", "close,scale");

        fake.$at.addEventListener("afterchange", function(){
            var val;
            
            if (fake.$at.ignoreChange) {
                val = undefined;
                fake.$at.ignoreChange = false;
            } else
                val = this.undolength ? 1 : undefined;
            if (fake.changed != val) {
                fake.changed = val;
                model.setQueryValue("@changed", (val ? "1" : "0"));
            }
        });
        
        if (init && !active)
            return;

        //Set active page
        tabEditors.set(filepath);

        //if (editorPage.model != model)
            //this.beforeswitch({nextPage: fake});

        //Open tab, set as active and wait until opened
        /*fake.addEventListener("afteropen", function(){

        });*/

        editor.enable();
        //editor.$itmEditor.select();
        //editor.$rbEditor.select();

        this.currentEditor = editor;
    },

    close : function(page){
        page.addEventListener("afterclose", this.$close);
    },

    $close : function() {
        var page = this;
        var at   = page.$at;
        var mdl  = page.$model;
        
        page.$doc.dispatchEvent("close");

        mdl.removeXml("data");
        ide.dispatchEvent("closefile", {xmlNode: mdl.data});

        //mdl.unshare();
        mdl.destroy();

        at.reset();
        at.destroy();

        //Destroy the app page if it has no application instance
        //if (!tabEditors.selectNodes("page[@type='" + page.type + "']").length && editorPage)
            //editorPage.destroy(true, true);
    },

    switchfocus : function(e){

    },

    beforeswitch : function(e) {
        var page       = e.nextPage,
            editorPage = tabEditors.getPage(page.type);
        if (!editorPage) return;

        if (editorPage.model != page.$model)
            editorPage.setAttribute("model", page.$model);
        if (editorPage.actiontracker != page.$at)
            editorPage.setAttribute("actiontracker", page.$at);
        
        page.$editor.setDocument(page.$doc, page.$at);
    },

    afterswitch : function(e) {
        var page = e.nextPage;
        var fromHandler, toHandler = ext.extLut[page.type];

        if (e.previousPage && e.previousPage != e.nextPage)
            fromHandler = ext.extLut[e.previousPage.type];

        if (fromHandler != toHandler) {
            if (fromHandler)
                fromHandler.disable();
            toHandler.enable();
        }

        //toHandler.$itmEditor.select();
        //toHandler.$rbEditor.select();

        /*if (self.TESTING) {}
            //do nothing
        else if (page.appid)
            app.navigateTo(page.appid + "/" + page.id);
        else if (!page.id)
            app.navigateTo(app.loc || (app.loc = "myhome"));*/
    },

    /**** Init ****/

    hook : function(){
        panels.register(this);
    },

    init : function(){
        var _self = this;
        ext.addType("Editor", function(oExtension){
            _self.register(oExtension);
          }, function(oExtension){
            _self.unregister(oExtension);
          });

        ide.addEventListener("openfile", function(e){
            _self.openEditor(e.doc, e.init, e.active);
        });

        ide.addEventListener("filenotfound", function(e) {
            var page = tabEditors.getPage(e.path);
            if (page)
                tabEditors.remove(page);
        });

        var vbox  = colMiddle;
        this.hbox = vbox.appendChild(new apf.hbox({flex : 1, padding : 5, splitters : true}));
        //this.splitter = vbox.appendChild(new apf.splitter());
        this.nodes.push(this.addTabSection());

        this.panel = this.hbox;

        /**** Support for state preservation ****/

        this.$settings = {}, _self = this;
        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            ide.addEventListener("extload", function(){
                var active = model.queryValue("auto/files/@active");
                var nodes  = model.queryNodes("auto/files/file");
                for (var i = 0, l = nodes.length; i < l; i++) {
                    ide.dispatchEvent("openfile", {
                        doc    : ide.createDocument(nodes[i]),
                        init   : true,
                        active : active 
                            ? active == nodes[i].getAttribute("path")
                            : i == l - 1
                    });
                }
            });
        });

        ide.addEventListener("savesettings", function(e){
            var changed = false,
                pNode   = e.model.data.selectSingleNode("auto/files"),
                state   = pNode && pNode.xml,
                pages   = tabEditors.getPages();

            if (pNode) {
                pNode.parentNode.removeChild(pNode);
                pNode = null;
            }

            if (pages.length) {
                var active = tabEditors.activepage;
                e.model.setQueryValue("auto/files/@active", active);
                
                pNode = apf.createNodeFromXpath(e.model.data, "auto/files");
                for (var i = 0, l = pages.length; i < l; i++) {
                    var file = pages[i].$model.data;
                    if (file.getAttribute("debug"))
                        continue;

                    var copy = apf.xmldb.cleanNode(file.cloneNode(false));
                    copy.removeAttribute("changed");
                    pNode.appendChild(copy);
                }
            }

            if (state != (pNode && pNode.xml))
                return true;
        });
        
        ide.addEventListener("afterreload", function(e) {
            var doc     = e.doc,
                acedoc  = doc.acedoc,
                sel     = acedoc.getSelection();
            
            sel.selectAll();
            acedoc.getUndoManager().ignoreChange = true;
            acedoc.replace(sel.getRange(), e.data);
            sel.clearSelection();
        });
    },

    enable : function(){
        this.hbox.show();
        //this.splitter.show();
    },

    disable : function(){
        this.hbox.hide();
        //this.splitter.hide();
    },

    destroy : function(){
        this.hbox.destroy(true, true);
        //this.splitter.destroy(true, true);
        panels.unregister(this);
    }
});

});


/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/themes/themes.js)SIZE(1574)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/themes/themes",
    ["core/ide", "core/ext", "core/util", "ext/editors/editors", "ext/settings/settings"],
    function(ide, ext, util, editors, settings) {

module.exports = ext.register("ext/themes/themes", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],

    register : function(themes){
        for (var name in themes) {
            this.nodes.push(
                mnuThemes.appendChild(new apf.item({
                    caption : name,
                    type    : "radio",
                    value   : themes[name]
                }))
            )
        }
    },

    set : function(path){
        //Save theme settings
        settings.model.setQueryValue("editors/code/@theme", path);
        settings.save();
    },

    init : function(){
        var _self = this;
        
        this.nodes.push(
            mnuView.appendChild(new apf.item({
                caption : "Themes",
                submenu : "mnuThemes"
            })),
            apf.document.body.appendChild(new apf.menu({
                id : "mnuThemes",
                onitemclick : function(e){
                    _self.set(e.relatedNode.value);
                }
            }))
        );
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/themes_default/themes_default.js)SIZE(1201)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/themes_default/themes_default",
    ["core/ide", "core/ext", "core/util", "ext/themes/themes"],
    function(ide, ext, util, themes) {

module.exports = ext.register("ext/themes_default/themes_default", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],

    themes  : {
        "TextMate" : "ace/theme/textmate",
        "Eclipse" : "ace/theme/eclipse",
        "Dawn" : "ace/theme/dawn",
        "IdleFingers" : "ace/theme/idle_fingers",
        "Twilight" : "ace/theme/twilight",
        "Monokai": "ace/theme/monokai",
        "Cobalt": "ace/theme/cobalt",
        "Mono Industrial": "ace/theme/mono_industrial",
        "Clouds": "ace/theme/clouds",
        "Clouds Midnight": "ace/theme/clouds_midnight",     
        "krTheme": "ace/theme/kr_theme"        
    },

    init : function(){
        themes.register(this.themes);
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/panels/panels.js)SIZE(7906)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/panels/panels",
    ["core/ide", "core/ext", "ext/settings/settings", "text!ext/panels/panels.xml"],
    function(ide, ext, settings, markup) {
        
module.exports = ext.register("ext/panels/panels", {
    name   : "Panel Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    
    nodes : [],
    panels : {},
    
    showingAll : true,
    
    initPanel : function(panelExt){
        if (panelExt.panel)
            return;
        
        ext.initExtension(panelExt);
        this.$setEvents(panelExt);
        
        var set = this.$settings && this.$settings[panelExt.path];
        if (set)
            this.setPanelSettings(panelExt, set);
        
        panelExt.panel.setAttribute("draggable", "false");
    },
    
    register : function(panelExt){
        var _self = this;
        panelExt.mnuItem = mnuPanels.appendChild(new apf.item({
            caption : panelExt.name,
            type    : "check",
            checked : panelExt.visible || false,
            onclick : function(){
                _self.initPanel(panelExt);
                this.checked ? panelExt.enable() : panelExt.disable();
            }
        }));
        
        if (this.$settings && this.$settings[panelExt.path]) {
            this.setPanelSettings(panelExt, _self.$settings[panelExt.path]);
        }
        else if (panelExt.visible) {
            if (panelExt.skin) {
                setTimeout(function(){
                    this.initPanel(panelExt);
                });
            }
            else {
                this.initPanel(panelExt);
            }
        }
        
        this.panels[panelExt.path] = panelExt;
    },
    
    $setEvents : function(panelExt){
        panelExt.panel.addEventListener("show", function(){
            var panels = require("ext/panels/panels");

            if (!panels.togglingAll && !panels.showingAll) 
                panels.showAll();
            else {
                if (!this.parentNode.visible)
                    this.parentNode.show();
                panelExt.mnuItem.check();
            }
        });
        panelExt.panel.addEventListener("hide", function(){
            var panels = require("ext/panels/panels");

            panelExt.mnuItem.uncheck();
            if (!this.parentNode.selectSingleNode("node()[not(@visible='false')]"))
                this.parentNode.hide();
            
            //Quick Fix
            if (apf.isGecko)
                apf.layout.forceResize(ide.vbMain.$ext);
        });
        //panelExt.panel.show();
        
        this.setPanelSettings(panelExt, this.$settings[panelExt.path]);
    },
    
    unregister : function(panelExt){
        panelExt.mnuItem.destroy(true, true);
        delete this.panels[panelExt.path];
    },

    setPanelSettings : function(panelExt, set){
        if (!panelExt.panel) {
            if (set.visible)
                this.initPanel(panelExt);
            return;
        }
        
        var pset, panel = panelExt.panel, parent = panel.parentNode;
        for (var prop in set) {
            if (prop == "parent") {
                if (panelExt.excludeParent)
                    continue;
                
                pset = set.parent;
                for (prop in pset) {
                    if (parent[prop] != pset[prop])
                        parent.setAttribute(prop, pset[prop]);
                }
            }
            else {
                if (panel[prop] != set[prop]) {
                    if (prop == "visible")
                        panel[set[prop] ? "enable" : "disable"]();
                    if (prop == "height" || !panelExt.excludeParent)
                        panel.setAttribute(prop, set[prop]);
                }
            }
        }
    },
    
    init : function(amlNode){
        this.nodes.push(
            barMenu.appendChild(new apf.button({
                submenu : "mnuPanels",
                caption : "Windows"
            })),
            mnuPanels
        );
        
        /**** Support for state preservation ****/
        
        var _self = this;
        this.$settings = {};
        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/panel");
            if (strSettings) {
                _self.$settings = apf.unserialize(strSettings);
                
                var panelExt;
                for (var path in _self.$settings) {
                    if ((panelExt = _self.panels[path]) && panelExt.panel)
                        _self.setPanelSettings(panelExt, _self.$settings[path]);
                }
            }
        });

        var props = ["visible", "flex", "width", "height", "state"];
        ide.addEventListener("savesettings", function(e){
            var changed = false, 
                xmlSettings = apf.createNodeFromXpath(e.model.data, "auto/panel/text()");

            var set, pset, path, parent, panel, p, i, l = props.length;
            for (path in _self.panels) {
                panel = _self.panels[path].panel;
                if (!panel) continue;

                if (!_self.$settings[path]) {
                    _self.$settings[path] = {parent: {}};
                    changed = true;
                }
                
                parent = panel.parentNode;
                set    = _self.$settings[path];
                pset   = _self.$settings[path].parent;

                for (i = 0; i < l; i++) {
                    if (set[p = props[i]] !== panel[p]) {
                        set[p] = panel[p];
                        changed = true;
                    }
                    if (pset[p] !== parent[p]) {
                        pset[p] = parent[p];
                        changed = true;
                    }
                }
            }
            
            if (changed) {
                xmlSettings.nodeValue = apf.serialize(_self.$settings);
                return true;
            }
        });
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
    },

    toggleAll : function() {
        this.togglingAll = true;
        for (var key in this.panels) {
            if (key != "ext/editors/editors") {
                var panel = this.panels[key];
            
                if (panel.panel) {
                    if (panel.hidden) {
                        panel.enable();
                        panel.hidden = false;
                    } else if (panel.panel.visible) {
                        panel.disable();
                        panel.hidden = true;
                    }
                }
            }
        }
        this.togglingAll = false;
    },
    
    showAll : function() {
        this.showingAll = true;
        for (var key in this.panels) {
            if (key != "ext/editors/editors") {
                var panel = this.panels[key];
            
                if (panel.panel && panel.hidden) {
                    // console.log("Showing " + key);
                    panel.enable();
                    panel.hidden = false;
                }
            }
        }       
        this.showingAll = false;
    }
});

    }
);


/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/tree/tree.js)SIZE(5428)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

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

module.exports = ext.register("ext/tree/tree", {
    name            : "Tree",
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
    },

    init : function() {
        this.panel = winFilesViewer;
        colLeft.appendChild(winFilesViewer);
        trFiles.setAttribute("model", fs.model);
        
        trFiles.addEventListener("afterchoose", this.$afterselect = function(e) {
            var node = this.selected;
            if (!node || node.tagName != "file" || this.selection.length > 1)
                return;

            ide.dispatchEvent("openfile", {doc: ide.createDocument(node)});
        });
        
        trFiles.addEventListener("beforerename", function(e){
            setTimeout(function(){
                fs.beforeRename(e.args[0], e.args[1]);
            });
        });
        
        trFiles.addEventListener("beforemove", function(e){
            setTimeout(function(){
                var changes = e.args;
                for (var i = 0; i < changes.length; i++) {
                    fs.beforeMove(changes[i].args[0], changes[i].args[1]);
                }
            });
        });

        /**** Support for state preservation ****/
        
        var _self = this;
        
        trFiles.addEventListener("expand", function(e){
            _self.expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)] = e.xmlNode;

            if (!_self.loading) {
                _self.changed = true;
                settings.save();
            }
        });
        trFiles.addEventListener("collapse", function(e){
            delete _self.expandedList[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)];
            
            if (!_self.loading) {
                _self.changed = true;
                settings.save();
            }
        });

        ide.addEventListener("loadsettings", function(e){
            var strSettings = e.model.queryValue("auto/tree");
            if (strSettings) {
                _self.loading = true;
                _self.currentSettings = apf.unserialize(strSettings);
                
                //Unstable - temporary fix
                try{
                    trFiles.expandList(_self.currentSettings, function(){
                        _self.loading = false;
                    });
                }catch(e){
                    e.model.setQueryValue("auto/tree/text()", "");
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
    },

    refresh : function(){
        trFiles.getModel().load("<data><folder type='folder' name='" + "Project" + "' path='" + ide.davPrefix + "' root='1'/></data>");
        this.expandedList = {};
        this.loading = true;
        try {
            var _self = this;
                    
            trFiles.expandList(this.currentSettings, function(){
                _self.loading = false;
            });
        } catch(e) {
        
        }
    },

    enable : function(){
        winFilesViewer.show();
    },

    disable : function(){
        winFilesViewer.hide();
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


/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/save/save.js)SIZE(11045)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/save/save",
    ["core/ide", "core/ext", "core/util", "ext/filesystem/filesystem",
            "text!ext/save/save.xml"],
    function(ide, ext, util, fs, markup) {

module.exports = ext.register("ext/save/save", {
    dev         : "Ajax.org",
    name        : "Save",
    alone       : true,
    type        : ext.GENERAL,
    markup      : markup,
    deps        : [fs],
    commands     : {
        "quicksave": {hint: "save the currently active file to disk"},
        "saveas": {hint: "save the file to disk with a different filename"}
    },
    hotitems    : {},
    nodes       : [],

    hook : function(){
        var _self = this;
        
        tabEditors.addEventListener("close", this.$close = function(e){
            if (e.page.$at.undolength) {
                ext.initExtension(_self);
                
                winCloseConfirm.page = e.page;
                winCloseConfirm.all = 0;
                winCloseConfirm.show();
                
                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all != -100) {
                        tabEditors.remove(winCloseConfirm.page, true);
                        winCloseConfirm.page.$at.undo(-1);
                        delete winCloseConfirm.page;
                    }
                    winCloseConfirm.removeEventListener("hide", arguments.callee);
                });
                
                btnYesAll.hide();
                btnNoAll.hide();
                
                e.preventDefault();
            }
        });

        this.nodes.push(ide.barTools.appendChild(new apf.button({
            id      : "btnSave",
            icon    : "save_btn_ico{this.disabled ? '_disabled' : ''}.png",
            caption : "Save",
            onclick : this.quicksave
        })));

        var saveItem, saveAsItem;
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),
        
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Save All",
                onclick : function(){
                    _self.saveall();
                },
                disabled : "{!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),
                
            saveAsItem = ide.mnuFile.insertBefore(new apf.item({
                caption : "Save As...",
                onclick : function () {
                    _self.saveas();
                },
                disabled : "{!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),
            
            saveItem = ide.mnuFile.insertBefore(new apf.item({
                caption : "Save",
                onclick : this.quicksave,
                disabled : "{!tabEditors.activepage}"
            }), ide.mnuFile.firstChild)
        );

        this.hotitems["quicksave"] = [saveItem];
        this.hotitems["saveas"]    = [saveAsItem];
    },

    init : function(amlNode){
        winCloseConfirm.onafterrender = function(){
            btnYesAll.addEventListener("click", function(){
                winCloseConfirm.all = 1;
                winCloseConfirm.hide();
            });
            btnNoAll.addEventListener("click", function(){
                winCloseConfirm.all = -1;
                winCloseConfirm.hide();
            });
            btnSaveYes.addEventListener("click", function(){
                _self.quicksave(winCloseConfirm.page);
                winCloseConfirm.hide()
            });
            btnSaveNo.addEventListener("click", function(){
                winCloseConfirm.hide();
            });
            btnSaveCancel.addEventListener("click", function(){
                winCloseConfirm.all = -100;
                winCloseConfirm.hide();
            });
        }
    },
    
    saveall : function(){
        var pages = tabEditors.getPages();
        for (var i = 0; i < pages.length; i++) {
            if (pages[i].$at.undolength)
                this.quicksave(pages[i]);
        }
    },
    
    saveAllInteractive : function(pages, callback){
        ext.initExtension(this);
        
        winCloseConfirm.all = 0;
                
        var _self = this;
        apf.asyncForEach(pages, function(item, next){
            if (item.$at.undolength) {
                if (winCloseConfirm.all == 1)
                    _self.quicksave(item);
                //else if (winCloseConfirm.all == -1)
                    //item.$at.undo(-1);

                if (winCloseConfirm.all)
                    return next();
                
                tabEditors.set(item);
                winCloseConfirm.page = item;
                winCloseConfirm.show();
                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all == 1)
                        _self.quicksave(item);
                    //else if (winCloseConfirm.all == -1)
                        //item.$at.undo(-1);

                    winCloseConfirm.removeEventListener("hide", arguments.callee);
                    next();
                });
                
                btnYesAll.setProperty("visible", pages.length > 1);
                btnNoAll.setProperty("visible", pages.length > 1);
            }
            else
                next();
        },
        function(){
            callback(winCloseConfirm.all);
        });
    },

    quicksave : function(page) {
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        var doc  = page.$doc;
        var node = doc.getNode();
        if (node.getAttribute("debug"))
            return;

        var path = node.getAttribute("path");
        var value = doc.getValue();
        
        var _self = this, panel = sbMain.firstChild;
        panel.setAttribute("caption", "Saving file " + path);
        
        ide.dispatchEvent("beforefilesave", {node: node, doc: doc, value: value});
        fs.saveFile(path, value, function(data, state, extra){
            if (state != apf.SUCCESS) {
                util.alert(
                    "Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again. "
                        + (state == apf.TIMEOUT
                            ? "The connection timed out."
                            : "The error reported was " + extra.message));
            }
            
            panel.setAttribute("caption", "Saved file " + path);
            ide.dispatchEvent("afterfilesave", {node: node, doc: doc, value: value});
            
            setTimeout(function(){
                if (panel.caption == "Saved file " + path)
                    panel.removeAttribute("caption");
            }, 2500);
        });
        
        page.$at.reset(); //@todo this sucks... please fix
        return false;
    },
    
    choosePath : function(path, select) {
        var _self = this;
        
        fs.list(path.match(/(.*)\/[^/]*/)[1], function (data, state, extra) {
            if (new RegExp("<folder.*" + path + ".*>").test(data)) {
                path  = path.replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                            .replace(/\[@name="workspace"\]/, "")
                            .replace(/\//, "");
                // console.log(path);
                trSaveAs.expandList([path], function() {
                    var node = trSaveAs.getModel().data.selectSingleNode(path);
                     
                    trSaveAs.select(node);
                });
            } else
                _self.saveFileAs();
        });
    },
    
    saveas : function(){
        var path = tabEditors.getPage().$model.data.getAttribute("path");
        
        ext.initExtension(this);
        txtSaveAs.setValue(path);
        this.choosePath(path.match(/(.*)\/[^/]/)[1]);
        winSaveAs.show();
    },
    
    saveFileAs : function () {
        var page    = tabEditors.getPage(),
            file    = page.$model.data,
            path    = file.getAttribute("path"),
            newPath = txtSaveAs.getValue();
            
        function onconfirm() {
            var panel   = sbMain.firstChild,
                value   = page.$doc.getValue();
  
            //console.log(value);
            winConfirm.hide();
            winSaveAs.hide();
            
            panel.setAttribute("caption", "Saving file " + newPath);
            fs.saveFile(newPath, value, function(value, state, extra) {
                if (state != apf.SUCCESS)
                   util.alert("Could not save document",
                              "An error occurred while saving this document",
                              "Please see if your internet connection is available and try again.");            
                panel.setAttribute("caption", "Saved file " + newPath);
                if (path != newPath) {
                    var model = page.$model,
                        node  = model.getXml();
                        
                    model.load(node);
                    file = model.data;
                    fs.beforeRename(file, null, newPath);
                }
	            setTimeout(function () {
	               if (panel.caption == "Saved file " + newPath)
	                   panel.removeAttribute("caption");
	            }, 2500);
            });
        };
    
        if (path != newPath)
            fs.exists(newPath, function (exists) {
                if (exists) {
                    var name    = newPath.match(/\/([^/]*)$/)[1],
                        folder  = newPath.match(/\/([^/]*)\/[^/]*$/)[1];
                    
	                util.confirm(
	                    "Are you sure?",
	                    "\"" + name + "\" already exists, do you want to replace it?",
	                    "A file or folder with the same name already exists in the folder "
	                    + folder + ". "
	                    + "Replacing it will overwrite it's current contents.",
	                    onconfirm);
                } else
                    onconfirm();
            });
        else
            onconfirm();
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

        tabEditors.removeEventListener("close", this.$close);
    }
});

    }
);


/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/gotofile/gotofile.js)SIZE(3698)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/gotofile/gotofile",
    ["core/ide", 
     "core/ext",
     "ext/filesystem/filesystem", 
     "ext/settings/settings",
     "ext/tree/tree",
     "text!ext/gotofile/gotofile.xml"],
    function(ide, ext, fs, settings, tree, markup) {
        
module.exports = ext.register("ext/gotofile/gotofile", {
    name    : "Filter Tree",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    commands : {
        "gotofile": {hint: "search for a filename and jump to it"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuFile.insertBefore(new apf.item({
                caption : "Open...",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }), mnuFile.firstChild),
            
            ide.barTools.appendChild(new apf.button({
                id      : "btnOpen",
                //icon    : "save_btn_ico{this.disabled ? '_disabled' : ''}.png",
                caption : "Open...",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );
        
        this.hotitems["gotofile"] = [this.nodes[0]];
    },

    init : function() {
        txtGoToFile.addEventListener("keydown", function(e){
            if (e.keyCode == 13){
                var node = trFiles.xmlRoot.selectSingleNode("folder[1]");
                mdlGoToFile.load("{davProject.report('" + node.getAttribute("path")
                    + "', 'filesearch', {query: '" + txtGoToFile.value + "'})}");
            }
            else if (e.keyCode == 40 && dgGoToFile.length) {
                var first = dgGoToFile.getFirstTraverseNode();
                if (first) {
                    dgGoToFile.select(first);
                    dgGoToFile.focus();
                }
            }
        });
        
        var restricted = [38, 40, 36, 35];
        dgGoToFile.addEventListener("keydown", function(e) {
            if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode())
                    txtGoToFile.focus();
            }
            else if (restricted.indexOf(e.keyCode) == -1) {
                txtGoToFile.focus();
            }
        }, true);

        dgGoToFile.addEventListener("afterchoose", function(e) {
            winGoToFile.hide();
            var root = trFiles.xmlRoot.selectSingleNode("folder[1]"),
                path   = root.getAttribute("path") + apf.getTextNode(e.xmlNode).nodeValue;
            require("ext/debugger/debugger").showFile(path, 0, 0);
        });
    },
    
    gotofile : function(){
        this.toggleDialog(true);
        return false;
    },
    
    toggleDialog: function(forceShow) {
        ext.initExtension(this);
        
        if (!winGoToFile.visible || forceShow)
            winGoToFile.show();
        else
            winGoToFile.hide();
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
        winGoToFile.destroy(true, true);
        this.nodes = [];
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/newresource/newresource.js)SIZE(2108)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/newresource/newresource",
    ["core/ide", "core/ext", "core/util", "ext/filesystem/filesystem", "text!ext/newresource/newresource.xml"],
    function(ide, ext, util, fs, markup) {

module.exports = ext.register("ext/newresource/newresource", {
    dev     : "Ajax.org",
    name    : "Newresource",
    alone   : true,
    type    : ext.GENERAL,
    markup  : markup,
    deps    : [fs],
    commands : {
        "newfile": {hint: "create a new file resource"},
        "newfolder": {hint: "create a new directory resource"}
    },
    hotitems: {},

    nodes   : [],

    init : function(amlNode){
        var _self = this;

        //ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[1]").appendChild(tbNewResource);

        //btnNewFile.onclick   = this.newfile;
        //btnNewFolder.onclick = this.newfolder;

        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),
            ide.mnuFile.insertBefore(new apf.item({
                caption : "New",
                submenu : "mnuNew"
            }), ide.mnuFile.firstChild)
        );

        //this.hotitems["newfolder"] = [mnuNew.firstChild];
        //this.hotitems["newfile"] = [mnuNew.childNodes[3]];
    },

    newfile: function() {
        fs.createFile();
        return false;
    },

    newfolder: function() {
        fs.createFolder();
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
        
        mnuNew.destroy(true, true);

        tabEditors.removeEventListener("close", this.$close);
    }
});

    }
);

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/undo/undo.js)SIZE(1585)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/undo/undo",
    ["core/ide", "core/ext"],
    function(ide, ext) {

module.exports = ext.register("ext/undo/undo", {
    dev    : "Ajax.org",
    name   : "Undo",
    alone  : true,
    type   : ext.GENERAL,
    commands: {
        "undo": {hint: "undo one edit step in the active document"},
        "redo": {hint: "redo one edit step in the active document"}
    },

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.item({
                caption : "Undo",
                onclick : this.undo
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Redo",
                onclick : this.redo
            }))
        );

        this.hotitems = {
            "undo" : [this.nodes[0]],
            "redo" : [this.nodes[1]]
        };
    },

    undo: function() {
        tabEditors.getPage().$at.undo();
    },

    redo: function() {
        tabEditors.getPage().$at.redo();
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
    }
});

    }
);

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/clipboard/clipboard.js)SIZE(2185)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/clipboard/clipboard",
    ["core/ide", "core/ext"],
    function(ide, ext) {

module.exports = ext.register("ext/clipboard/clipboard", {
    dev    : "Ajax.org",
    name   : "Clipboard",
    alone  : true,
    type   : ext.GENERAL,
    /*commands: {
        "cut": {hint: "cut the selected text to the clipboard"},
        "copy": {hint: "copy the selected text to the clipboard"},
        "paste": {hint: "paste text from the clipboard into the active document"}
    },*/

    nodes : [],

    init : function(amlNode){
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Cut",
                onclick : this.cut
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Copy",
                onclick : this.copy
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Paste",
                onclick : this.paste
            }))
        );

        /*this.hotitems = {
            "cut" : [this.nodes[1]],
            "copy" : [this.nodes[2]],
            "paste" : [this.nodes[3]]
        };*/
    },

    cut: function() {
        if (apf.document.activeElement == trFiles)
            apf.clipboard.cutSelection(trFiles);
    },

    copy: function() {
        if (apf.document.activeElement == trFiles)
            apf.clipboard.copySelection(trFiles);
    },

    paste: function() {
        if (apf.document.activeElement == trFiles)
            apf.clipboard.pasteSelection(trFiles);
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
    }
});

    }
);

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/searchinfiles/searchinfiles.js)SIZE(7344)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Searchinfiles Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/searchinfiles/searchinfiles",
    ["core/ide",
     "core/ext",
     "core/util",
     "ace/plugin_manager",
     "ace/search",
     "ext/editors/editors",
     "ext/console/console",
     "text!ext/searchinfiles/skin.xml", 
     "text!ext/searchinfiles/searchinfiles.xml"],
    function(ide, ext, util, plugins, search, editors, console, skin, markup) {

module.exports = ext.register("ext/searchinfiles/searchinfiles", {
    name     : "Search in files",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    markup   : markup,
    skin     : skin,
    commands  : {
        "searchinfiles": {hint: "search for a string through all files in the current workspace"}
    },
    pageTitle: "Search Results",
    pageID   : "pgSFResults",
    hotitems : {},

    nodes    : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Search in Files",
                onclick : function() {
                    _self.toggleDialog(false);
                }
            }))
        );
        
        this.hotitems["searchinfiles"] = [this.nodes[1]];
    },

    init : function(amlNode){
        this.txtFind       = txtSFFind;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //this.txtReplace    = txtReplace;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //bars
        //this.barReplace    = barReplace;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox[2]");
        //buttons
        //this.btnReplace    = btnReplace;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        //this.btnReplace.onclick = this.replace.bind(this);
        //this.btnReplaceAll = btnReplaceAll;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[2]");
        //this.btnReplaceAll.onclick = this.replaceAll.bind(this);
        this.btnFind       = btnSFFind;//winSearchInFiles.selectSingleNode("a:vbox/a:hbox/a:button[3]");
        this.btnFind.onclick = this.execFind.bind(this);

        var _self = this;
        winSearchInFiles.onclose = function() {
            ceEditor.focus();
        };
        winSearchInFiles.onshow = function() {
            // get selected node in tree and set it as selection
            var name = _self.getSelectedTreeNode().getAttribute("name");
            if (name.length > 25)
                name = name.substr(0, 22) + "...";
            rbSFSelection.setAttribute("label", "Selection ( " + name + " )")
        };
        trSFResult.addEventListener("afterselect", function(e) {
            var path,
                root = trFiles.xmlRoot.selectSingleNode("folder[1]"),
                node = trSFResult.selected,
                line = 0,
                text = "";
            if (node.tagName == "d:excerpt") {
                path = node.parentNode.getAttribute("path");
                line = node.getAttribute("line");
                text = node.parentNode.getAttribute("query");
            }
            else {
                path = node.getAttribute("path");
                text = node.getAttribute("query");
            }
            require("ext/debugger/debugger").showFile(root.getAttribute("path") + "/" + path, line, 0, text);
        });
    },

    getSelectedTreeNode: function() {
        var node = trFiles.selected;
        if (!node)
            node = trFiles.xmlRoot.selectSingleNode("folder[1]");
        while (node.tagName != "folder")
            node = node.parentNode;
        return node;
    },

    toggleDialog: function(isReplace, forceShow) {
        ext.initExtension(this);

        if (apf.isWin) {
            return util.alert("Search in Files", "Not Supported",
                "I'm sorry, searching through files is not yet supported on the Windows platform.");
        }
        
        if (!winSearchInFiles.visible || forceShow || this.$lastState != isReplace) {
            //this.setupDialog(isReplace);
            var editor = editors.currentEditor;
            if (editor) {
                var value  = editor.getDocument().getTextRange(editor.getSelection().getRange());
                if (value)
                    this.txtFind.setValue(value);
            }
            winSearchInFiles.show();
        }
        else {
            winSearchInFiles.hide();
        }
        return false;
    },

    onHide : function() {
        var editor = require('ext/editors/editors').currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.focus();
    },

    searchinfiles: function() {
        return this.toggleDialog(false, true);
    },

    setupDialog: function(isReplace) {
        this.$lastState = isReplace;
        
        // hide all 'replace' features
        //this.barReplace.setProperty("visible", isReplace);
        //this.btnReplace.setProperty("visible", isReplace);
        //this.btnReplaceAll.setProperty("visible", isReplace);
        return this;
    },

    getOptions: function() {
        return {
            query: txtSFFind.value,
            pattern: ddSFPatterns.value,
            casesensitive: chkSFMatchCase.checked,
            regexp: chkSFRegEx.checked
        };
    },

    execFind: function() {
        var _self = this;
        winSearchInFiles.hide();
        // show the console (also used by the debugger):
        console.enable();
        if (!this.$panel) {
            this.$panel = tabConsole.add(this.pageTitle, this.pageID);
            this.$panel.appendChild(trSFResult);
            trSFResult.setProperty("visible", true);
            this.$model = trSFResult.getModel();
            // make sure the tab is shown when results come in
            this.$model.addEventListener("afterload", function() {
                tabConsole.set(_self.pageID);
            });
        }
        // show the tab
        tabConsole.set(this.pageID);
        var node = this.$currentScope = grpSFScope.value == "projects"
            ? trFiles.xmlRoot.selectSingleNode("folder[1]")
            : this.getSelectedTreeNode();
            
        davProject.report(node.getAttribute("path"), "codesearch", this.getOptions(), function(data, state, extra){
            if (state != apf.SUCCESS)
                return;
            _self.$model.load(data);
        });
    },

    replaceAll: function() {
        return;
        if (!this.editor)
            this.setEditor();
        if (!this.$editor)
            return;
        this.$crtSearch = null;
        var options = this.getOptions();
        this.$editor.replaceAll(this.txtReplace.getValue() || "", options);
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
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/searchreplace/searchreplace.js)SIZE(7043)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Searchreplace Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/searchreplace/searchreplace",
    ["core/ide",
     "core/ext",
     "ace/plugin_manager",
     "ace/search",
     "ext/editors/editors", 
     "text!ext/searchreplace/searchreplace.xml"],
    function(ide, ext, plugins, search, editors, markup) {

module.exports = ext.register("ext/searchreplace/searchreplace", {
    name    : "Searchreplace",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    commands : {
        "search": {hint: "search for a string inside the active document"},
        "searchreplace": {hint: "search for a string inside the active document and replace it"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Search",
                onclick : function() {
                    _self.toggleDialog(false);
                }
            })),
            mnuEdit.appendChild(new apf.item({
                caption : "Search & Replace",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );
        
        this.hotitems["search"] = [this.nodes[1]];
        this.hotitems["searchreplace"] = [this.nodes[2]];
        
        /*plugins.registerCommand("find", function(editor, selection) {
            _self.setEditor(editor, selection).toggleDialog(false, true);
        });*/
        plugins.registerCommand("replace", function(editor, selection) {
            _self.setEditor(editor, selection).toggleDialog(true, true);
        });
    },

    init : function(amlNode){
        this.txtFind       = txtFind;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        this.txtReplace    = txtReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[1]/a:textbox[1]");
        //bars
        this.barReplace    = barReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox[2]");
        //buttons
        this.btnReplace    = btnReplace;//winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[1]");
        this.btnReplace.onclick = this.replace.bind(this);
        this.btnReplaceAll = btnReplaceAll;//winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[2]");
        this.btnReplaceAll.onclick = this.replaceAll.bind(this);
        this.btnFind       = btnFind;//winSearchReplace.selectSingleNode("a:vbox/a:hbox/a:button[3]");
        this.btnFind.onclick = this.findNext.bind(this);
        winSearchReplace.onclose = function() {
            ceEditor.focus();
        }
    },

    toggleDialog: function(isReplace, forceShow) {
        ext.initExtension(this);
        
        if (!winSearchReplace.visible || forceShow || this.$lastState != isReplace) {
            this.setupDialog(isReplace);

            var editor = editors.currentEditor;
            if (editor.ceEditor)
                var value = editor.ceEditor.getLastSearchOptions().needle;
    
            if (!value) {
                var sel   = editor.getSelection();
                var doc   = editor.getDocument();
                var range = sel.getRange();
                var value = doc.getTextRange(range);
            }
            if (value)
                this.txtFind.setValue(value);

            winSearchReplace.show();
        }
        else
            winSearchReplace.hide();
        return false;
    },

    onHide : function() {
        var editor = require('ext/editors/editors').currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.focus();
    },

    search: function() {
        return this.setEditor().toggleDialog(false, true);
    },

    searchreplace: function() {
        return this.setEditor().toggleDialog(true, true);
    },

    setupDialog: function(isReplace) {
        this.$lastState = isReplace;
        
        // hide all 'replace' features
        this.barReplace.setProperty("visible", isReplace);
        this.btnReplace.setProperty("visible", isReplace);
        this.btnReplaceAll.setProperty("visible", isReplace);
        return this;
    },

    setEditor: function(editor, selection) {
        if (typeof ceEditor == "undefined")
            return;
        this.$editor = editor || ceEditor.$editor;
        this.$selection = selection || this.$editor.getSelection();
        return this;
    },

    getOptions: function() {
        return {
            backwards: chkSearchBackwards.checked,
            wrap: chkWrapAround.checked,
            caseSensitive: !chkMatchCase.checked,
            wholeWord: chkWholeWords.checked,
            regExp: chkRegEx.checked,
            scope: chkSearchSelection.checked ? search.SELECTION : search.ALL
        };
    },

    findNext: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        var txt = this.txtFind.getValue();
        if (!txt)
            return;
        var options = this.getOptions();

        if (this.$crtSearch != txt) {
            this.$crtSearch = txt;
            // structure of the options:
            // {
            //     needle: "",
            //     backwards: false,
            //     wrap: false,
            //     caseSensitive: false,
            //     wholeWord: false,
            //     regExp: false
            // }
            this.$editor.find(txt, options);
        }
        else {
            this.$editor.findNext(options);
        }
    },

    replace: function() {
        if (!this.$editor)
            this.setEditor();
        if (!this.$editor)
            return;
        if (!this.barReplace.visible)
            return;
        var options = this.getOptions();
        options.needle = this.txtFind.getValue()
        this.$editor.replace(this.txtReplace.getValue() || "", options);
        this.$editor.find(this.$crtSearch, options);
    },

    replaceAll: function() {
        if (!this.editor)
            this.setEditor();
        if (!this.$editor)
            return;
        this.$crtSearch = null;
        var options = this.getOptions();
        options.needle = this.txtFind.getValue()
        this.$editor.replaceAll(this.txtReplace.getValue() || "", options);
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
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/quickwatch/quickwatch.js)SIZE(3162)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * quickwatch Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/quickwatch/quickwatch",
    ["core/ide",
     "core/ext",
     "ext/editors/editors",
     "text!ext/quickwatch/quickwatch.xml"],
    function(ide, ext, editors, markup) {

module.exports = ext.register("ext/quickwatch/quickwatch", {
    name    : "quickwatch",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    markup  : markup,
    commands : {
        "quickwatch": {hint: "quickly inspect the variable that is under the cursor"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
    },

    init : function(amlNode){
        txtCurObject.addEventListener("keydown", function(e){
            if (e.keyCode == 13) {
                if (!this.value.trim())
                    return dgWatch.clear();

                require('ext/console/console').evaluate(this.value);
            }
            else if (e.keyCode == 40 && dgWatch.length) {
                var first = dgWatch.getFirstTraverseNode();
                if (first) {
                    dgWatch.select(first);
                    dgWatch.focus();
                }
            }
        });
        
        var restricted = [38, 40, 36, 35];
        dgWatch.addEventListener("keydown", function(e) {
            if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode())
                    txtCurObject.focus();
            }
            else if (restricted.indexOf(e.keyCode) == -1) {
                txtCurObject.focus();
            }
        }, true);
    },

    toggleDialog: function(force, exec) {
        ext.initExtension(this);
        
        if (!winQuickWatch.visible || force == 1) {
            var editor = editors.currentEditor;
    
            var range;
            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            if (sel.isEmpty()) {
                var cursor = sel.getCursor();
                range = doc.getWordRange(cursor.row, cursor.column);
            }
            else
                range = sel.getRange();
            var value = doc.getTextRange(range);

            if (value) {
                txtCurObject.setValue(value);
                if (exec) {
                    require('ext/console/console').evaluate(value);
                    txtCurObject.focus();
                }
            }

            winQuickWatch.show();
        }
        else
            winQuickWatch.hide();

        return false;
    },

    quickwatch : function(){
        this.toggleDialog(1, true);
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
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/quicksearch/quicksearch.js)SIZE(7142)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * quicksearch Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/quicksearch/quicksearch",
    ["core/ide",
     "core/ext",
     "ace/plugin_manager",
     "ace/search",
     "ext/editors/editors", 
     "text!ext/quicksearch/skin.xml",
     "text!ext/quicksearch/quicksearch.xml"],
    function(ide, ext, plugins, search, editors, skin, markup) {

module.exports = ext.register("ext/quicksearch/quicksearch", {
    name    : "quicksearch",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : skin,
    markup  : markup,
    commands : {
        "quicksearch": {hint: "quickly search for a string inside the active document, without further options (see 'search')"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;

        plugins.registerCommand("find", function(editor, selection) {
            _self.toggleDialog(1);
        });
    },

    init : function(amlNode){
        var _self = this;
        
        txtQuickSearch.addEventListener("keydown", function(e){
            switch(e.keyCode){
                case 13: //ENTER
                    if (e.shiftKey)
                        _self.find(false, true);
                    else
                        _self.find(false, false);
                    return false;
                break;
                case 27: //ESCAPE
                    _self.toggleDialog(-1);
                    return false;
                break;
                case 38: //UP
                    _self.navigateList("prev");
                break;
                case 40: //DOWN
                    _self.navigateList("next");
                break;
                case 36: //HOME
                    if (!e.ctrlKey) return;
                    _self.navigateList("first");
                break;
                case 35: //END
                    if (!e.ctrlKey) return;
                    _self.navigateList("last");
                break;
            }
        });
        
        winQuickSearch.addEventListener("blur", function(e){
            if (!apf.isChildOf(winQuickSearch, e.toElement))
                _self.toggleDialog(-1);
        });
        
        var editor = editors.currentEditor;
        if (editor && editor.ceEditor)
            editor.ceEditor.parentNode.appendChild(winQuickSearch);
    },
    
    navigateList : function(type){
        var settings = require("ext/settings/settings");
        if (!settings) return;
        
        var model = settings.model;
        var lines = model.queryNodes("search/word");
        
        var next;
        if (type == "prev")
            next = Math.max(0, this.position - 1);
        else if (type == "next")
            next = Math.min(lines.length - 1, this.position + 1);
        else if (type == "last")
            next = Math.max(lines.length - 1, 0);
        else if (type == "first")
            next = 0;

        if (lines[next]) {
            txtQuickSearch.setValue(lines[next].getAttribute("key"));
            txtQuickSearch.select();
            this.position = next;
        }
    },

    toggleDialog: function(force) {
        ext.initExtension(this);

        if (this.control && this.control.stop)
            this.control.stop();

        var editorPage = tabEditors.getPage();
        if (!editorPage) return;

        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        if (!force && !winQuickSearch.visible || force > 0) {
            this.position = 0;
            
            var sel   = editor.getSelection();
            var doc   = editor.getDocument();
            var range = sel.getRange();
            var value = doc.getTextRange(range);
            
            if (!value && editor.ceEditor)
                var value = editor.ceEditor.getLastSearchOptions().needle;
            
            if (value)
                txtQuickSearch.setValue(value);

            winQuickSearch.$ext.style.top = "-30px";
            winQuickSearch.show();
            txtQuickSearch.focus();

            //Animate
            apf.tween.single(winQuickSearch, {
                type     : "top",
                anim     : apf.tween.easeInOutCubic,
                from     : -30,
                to       : 5,
                steps    : 8,
                interval : 10,
                control  : (this.control = {})
            });
        }
        else if (winQuickSearch.visible) {
            //Animate
            apf.tween.single(winQuickSearch, {
                type     : "top",
                anim     : apf.tween.NORMAL,
                from     : winQuickSearch.$ext.offsetTop,
                to       : -30,
                steps    : 8,
                interval : 10,
                control  : (this.control = {}),
                onfinish : function(){
                    winQuickSearch.hide();
                    editor.ceEditor.focus();
                }
            });
        }

        return false;
    },

    quicksearch : function(){
        this.toggleDialog(1);
    },

    find: function(close, backwards) {
        var editor = require('ext/editors/editors').currentEditor;
        if (!editor || !editor.ceEditor)
            return;
        
        var ceEditor = editor.ceEditor;
        var ace      = ceEditor.$editor;

        var txt = txtQuickSearch.getValue();
        if (!txt)
            return;

        var options = {
            backwards: backwards || false, 
            wrap: true, 
            caseSensitive: true, 
            wholeWord: false, 
            regExp: false, 
            scope: search.ALL 
        }

        if (this.$crtSearch != txt) {
            this.$crtSearch = txt;
            ace.find(txt, options);
        }
        else {
            ace.findNext(options);
        }
        
        var settings = require("ext/settings/settings");
        if (settings.model) {
            var history = settings.model;
            search = apf.createNodeFromXpath(history.data, "search");
            
            if (!search.firstChild || search.firstChild.getAttribute("key") != txt) {
                keyEl = apf.getXml("<word />");
                keyEl.setAttribute("key", txt);
                apf.xmldb.appendChild(search, keyEl, search.firstChild);
            }
        }
        
        if (close) {
            winQuickSearch.hide();
            ceEditor.focus();
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/gotoline/gotoline.js)SIZE(7032)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Gotoline Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/gotoline/gotoline",
    ["core/ide",
     "core/ext",
     "ace/plugin_manager",
     "ace/search",
     "ext/editors/editors", 
     "text!ext/gotoline/skin.xml",
     "text!ext/gotoline/gotoline.xml"],
    function(ide, ext, plugins, search, editors, skin, markup) {

module.exports = ext.register("ext/gotoline/gotoline", {
    name    : "Gotoline Window",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    skin    : skin,
    markup  : markup,
    
    commands : {
        "gotoline": {hint: "enter a linenumber and jump to it in the active document"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;
        this.nodes.push(
            mnuEdit.appendChild(new apf.divider()),
            mnuEdit.appendChild(new apf.item({
                caption : "Go to Line",
                onclick : function(){
                    _self.gotoline(1);
                }
            }))
        );

        this.hotitems["gotoline"] = [this.nodes[1]];

        plugins.registerCommand("gotoline", function(editor, selection) {
            _self.gotoline(1);
        });
    },

    init : function(amlNode){
        var _self = this;
        lstLineNumber.addEventListener("afterchoose", function() {
            if (lstLineNumber.selected) {
                _self.execGotoLine(parseInt(lstLineNumber.selected.getAttribute("nr")));
            }
            else
                _self.execGotoLine();
        });
        lstLineNumber.addEventListener("afterselect", function() {
            if (this.selected)
                txtLineNr.setValue(this.selected.getAttribute("nr"));
        });

        var restricted = [38, 40, 36, 35]
        lstLineNumber.addEventListener("keydown", function(e) {
            if (e.keyCode == 13 && this.selected){
                return false;
            }
            else if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode()) {
                    txtLineNr.focus();
                    this.clearSelection();
                }
            }
            else if (e.keyCode == 27){
                _self.gotoline(-1);
            }
            else if (restricted.indexOf(e.keyCode) == -1)
                txtLineNr.focus();
        }, true);

        txtLineNr.addEventListener("keydown", function(e) {
            if (e.keyCode == 13){
                _self.execGotoLine();
                return false;
            }
            else if (e.keyCode == 27){
                _self.gotoline(-1);
                return false;
            }
            else if (e.keyCode == 40) {
                var first = lstLineNumber.getFirstTraverseNode();
                if (first) {
                    lstLineNumber.select(first);
                    lstLineNumber.$container.scrollTop = 0;
                    lstLineNumber.focus();
                }
            }
            else if ((e.keyCode > 57 || e.keyCode == 32) && (e.keyCode < 96 || e.keyCode > 105))
                return false;
        });
        
        winGotoLine.addEventListener("blur", function(e){
            if (!apf.isChildOf(winGotoLine, e.toElement))
                _self.gotoline(-1);
        });
    },

    gotoline: function(force) {
        ext.initExtension(this);
        
        if (this.control && this.control.stop)
            this.control.stop();

        var editorPage = tabEditors.getPage();
        if (!editorPage) return;

        var editor = editors.currentEditor;
        if (!editor || !editor.ceEditor)
            return;

        if (!force && !winGotoLine.visible || force > 0) {
            var ace = editor.ceEditor.$editor;
            var aceHtml = editor.ceEditor.$ext;
            var cursor = ace.getCursorPosition();
            
            //Set the current line
            txtLineNr.setValue(cursor.row + 1);
                
            //Determine the position of the window
            var pos = ace.renderer.textToScreenCoordinates(cursor.row, cursor.column);
            var epos = apf.getAbsolutePosition(aceHtml);
            var maxTop = aceHtml.offsetHeight - 100;
            
            editor.ceEditor.parentNode.appendChild(winGotoLine);
            winGotoLine.setAttribute("top", Math.min(maxTop, pos.pageY - epos[1]));
            winGotoLine.setAttribute("left", -60);
            
            winGotoLine.show();
            txtLineNr.focus();
            
            //Animate
            apf.tween.single(winGotoLine, {
                type     : "left",
                anim     : apf.tween.easeInOutCubic,
                from     : -60,
                to       : 0,
                steps    : 8,
                interval : 10,
                control  : (this.control = {})
            });
        }
        else if (winGotoLine.visible) {
            //Animate
            apf.tween.single(winGotoLine, {
                type     : "left",
                anim     : apf.tween.EASEOUT,
                from     : winGotoLine.$ext.offsetLeft,
                to       : -60,
                steps    : 8,
                interval : 10,
                control  : (this.control = {}),
                onfinish : function(){
                    winGotoLine.hide();
                    editor.ceEditor.focus();
                }
            });
        }

        return false;
    },

    execGotoLine: function(line) {
        var editor = require('ext/editors/editors').currentEditor;
        if (!editor || !editor.ceEditor)
            return;
        
        var ceEditor = editor.ceEditor;
        var ace      = ceEditor.$editor;

        winGotoLine.hide();

        if (typeof line != "number")
            line = parseInt(txtLineNr.getValue()) || 0;

        var history = lstLineNumber.$model;
        var gotoline, lineEl = history.queryNode("gotoline/line[@nr='" + line + "']");
        if (lineEl)
            gotoline = lineEl.parentNode;
        else {
            gotoline = apf.createNodeFromXpath(history.data, "gotoline") 
            lineEl   = apf.getXml("<line nr='" + line + "' />");
        }
        
        if (lineEl != gotoline.firstChild)
            apf.xmldb.appendChild(gotoline, lineEl, gotoline.firstChild);

        ace.gotoLine(line);
        ceEditor.focus();
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
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/html/html.js)SIZE(2065)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * HTML Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/html/html",
    ["core/ide", "core/ext", "ext/code/code", "text!ext/html/html.xml"],
    function(ide, ext, code, markup) {

module.exports = ext.register("ext/html/html", {
    name    : "HTML Editor",
    dev     : "Ajax.org",
    type    : ext.GENERAL,
    alone   : true,
    deps    : [code],
    markup  : markup,
    nodes   : [],

    hook : function(){
        var _self = this;
        tabEditors.addEventListener("afterswitch", function(e){
            var mime = e.nextPage.contentType;
            if (mime == "text/html" || mime == "application/xhtml+xml") {
                ext.initExtension(_self);
                _self.page = e.nextPage;
                _self.enable();
            }
            else {
                _self.disable();
            }
        });
    },

    init : function() {
        //Append the button bar to the main toolbar
        var nodes = barHtmlMode.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }

        btnHtmlOpen.onclick = this.onOpenPage.bind(this);
        this.enabled = true;
    },

    onOpenPage : function() {
        var file = this.page.$model.data;
        window.open(location.protocol + "//" + location.host + file.getAttribute("path"), "_blank");
    },

    enable : function() {
        if (this.enabled)
            return;
        this.enabled = true;

        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function(){
        if (!this.enabled)
            return;
        this.enabled = false;

        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/browser/browser.js)SIZE(1644)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/browser/browser",
    ["core/ide", "core/ext", "text!ext/browser/browser.xml"],
    function(ide, ext, markup) {

module.exports = ext.register("ext/browser/browser", {
    name    : "Browser View",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    contentTypes : [
        "text/html",
        "application/xhtml+xml"
    ],
    markup  : markup,

    nodes : [],

    init : function(amlPage){
	var dav_url = location.href.replace(location.hash, '');
        this.brView = amlPage.appendChild(new apf.vbox({
            anchors    : "0 0 0 0",
            childNodes : [new apf.browser({
                src  : "{dav_url + 'workspace/' + [@path]}",
                flex : 1
            })]
        }));

        //Append the button bar to the main toolbar
        var nodes = barBrowserTb.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            this.nodes.push(ide.barTools.appendChild(nodes[0]));
        }
    },

    enable : function() {
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });

        if (this.brView)
            this.brView.destroy(true, true);
        barBrowserTb.destroy(true, true);

        this.nodes = [];
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/code/code.js)SIZE(7660)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/code/code",
    ["core/ide", 
     "core/ext", 
     "text!ext/code/code.xml",
     "text!ext/code/settings.xml",
     "ace/document"
    ],
    function(ide, ext, markup, settings, Document) {

apf.actiontracker.actions.aceupdate = function(undoObj, undo){
    var q = undoObj.args;
    
    if (!undoObj.initial) {
        undoObj.initial = true;
        return;
    }
    
    if (undo)
        q[1].undoChanges(q[0]);
    else
        q[1].redoChanges(q[0]);
};

module.exports = ext.register("ext/code/code", {
    name    : "Code Editor",
    dev     : "Ajax.org",
    type    : ext.EDITOR,
    contentTypes : [
        "application/javascript",
        "application/json",
        "text/css",
        "application/xml",
        "text/plain",
        "application/x-httpd-php",
        "text/html",
        "application/xhtml+xml"
    ],
    markup  : markup,

    nodes : [],

    getSelection : function(){
        if (typeof ceEditor == "undefined")
            return null;
        return ceEditor.getSelection();
    },

    getDocument : function(){
        if (typeof ceEditor == "undefined")
            return null;
        return ceEditor.getDocument();
    },
    
    setDocument : function(doc, actiontracker){
        if (!doc.acedoc) {
            var _self = this;

            doc.isInited = doc.hasValue();
            doc.acedoc = new Document(doc.getValue() || "");
            doc.acedoc.setUndoManager(actiontracker);
            
            doc.addEventListener("prop.value", function(e){
                doc.acedoc.setValue(e.value || "");
                doc.isInited = true;
            });
            
            doc.addEventListener("retrievevalue", function(e){
                if (!doc.isInited) return e.value;
                else return doc.acedoc.toString();
            });
            
            doc.addEventListener("close", function(){
                //??? destroy doc.acedoc
            });
        }

        ceEditor.setProperty("value", doc.acedoc);
    },

    hook : function() {
        var commitFunc = this.onCommit.bind(this),
            name       = this.name;
        
        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e){
            var page = e.ext.addSection("code", name, "editors", commitFunc);
            page.insertMarkup(settings);
        });
        
        ide.addEventListener("loadsettings", function(e) {
            // pre load theme
            var theme = e.model.queryValue("editors/code/@theme");
            if (theme) 
                require([theme], function() {});
        });
        
        // preload common language modes
        require(["ace/mode/javascript", "ace/mode/html", "ace/mode/css"], function() {});
    },

    init : function(amlPage) {
        var def = ceEditor.getDefaults();
        
        //check default settings...
        var settings = require("ext/settings/settings"),
            model    = settings.model,
            base     = model.data.selectSingleNode("editors/code");
        if (!base)
            base = model.appendXml('<code name="' + this.name +'" page="' + settings.getSectionId(this.name) + '" />', "editors");
        
        // go through all default settings and append them to the XML if they're not there yet
        for (var prop in def) {
            if (!prop) continue;
            if (!base.getAttribute(prop))
                base.setAttribute(prop, def[prop]);
        }
        apf.xmldb.applyChanges("synchronize", base);

        amlPage.appendChild(ceEditor);
        ceEditor.show();

        this.ceEditor = ceEditor;

        var _self = this;

        this.nodes.push(
            //Add a panel to the statusbar showing whether the insert button is pressed
            sbMain.appendChild(new apf.section({
                caption : "{ceEditor.insert}"
            })),

            //Add a panel to the statusbar showing the length of the document
            sbMain.appendChild(new apf.section({
                caption : "Length: {ceEditor.value.length}"
            })),

            mnuView.appendChild(new apf.item({
                caption : "Syntax Highlighting",
                submenu : "mnuSyntax"
            })),

            /*mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Overwrite Mode",
                checked : "{ceEditor.overwrite}"
            })),*/

            mnuView.appendChild(new apf.divider()),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Select Full Line",
                values  : "line|text",
                value   : "[{require('ext/settings/settings').model}::editors/code/@selectstyle]",
            })),

            /*mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Read Only",
                checked : "{ceEditor.readonly}"
            })),*/

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Highlight Active Line",
                checked : "[{require('ext/settings/settings').model}::editors/code/@activeline]"
            })),

            mnuView.appendChild(new apf.divider()),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Show Invisibles",
                checked : "[{require('ext/settings/settings').model}::editors/code/@showinvisibles]"
            })),

            mnuView.appendChild(new apf.item({
                type    : "check",
                caption : "Show Print Margin",
                checked : "[{require('ext/settings/settings').model}::editors/code/@showprintmargin]"
            }))
            // Wrap Lines (none),
            // Overwrite mode (overwrite),
            // Full line selection (selectstyle),
            // Read only (readonly),
            // Highlight active line (activeline),
            // Show invisibles (showinvisibles),
            // Show print margin (showprintmargin)
        );

        mnuSyntax.onitemclick = function(e) {
            var file = ide.getActivePageModel();
            if (file)
                apf.xmldb.setAttribute(file, "contenttype", e.relatedNode.value);
        };

        /*ide.addEventListener("clearfilecache", function(e){
            ceEditor.clearCacheItem(e.xmlNode);
        });*/

        ide.addEventListener("keybindingschange", function(e){
            if (typeof ceEditor == "undefined")
                return;
            var bindings = e.keybindings.code;
            ceEditor.$editor.keyBinding.setConfig(bindings);
        });
    },

    onCommit: function() {
        //console.log("commit func called!")
        //todo
    },

    enable : function() {
        this.nodes.each(function(item){
            item.show();
        });
    },

    disable : function() {
        this.nodes.each(function(item){
            item.hide();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });

        if (self.ceEditor) {
            ceEditor.destroy(true, true);
            mnuSyntax.destroy(true, true);
        }

        this.nodes = [];
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/extmgr/extmgr.js)SIZE(1403)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/extmgr/extmgr",
    ["core/ide", "core/ext", "core/util", "text!ext/extmgr/extmgr.xml"],
    function(ide, ext, util, markup) {
        
module.exports = ext.register("ext/extmgr/extmgr", {
    name   : "Extension Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    
    nodes : [],
    
    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Extension Manager...",
                onclick : function(){
                    ext.initExtension(_self);
                    winExt.show();
                }
            }), ide.mnuFile.childNodes[ide.mnuFile.childNodes.length - 2])
        );
    },
    
    init : function(amlNode){
        
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
    }
});

    }
);

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/run/run.js)SIZE(6088)TIME(Tue, 23 Nov 2010 11:19:22 GMT)*/

/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/run/run",
    ["core/ide",
     "core/ext",
     "ext/noderunner/noderunner",
     "ext/settings/settings",
     "ext/save/save",
     "text!ext/run/run.xml"], function(ide, ext, noderunner, settings, save, markup) {

module.exports = ext.register("ext/run/run", {
    name   : "Run Toolbar",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [noderunner],
    commands : {
        "resume"   : {hint: "resume the current paused process"},
        "stepinto" : {hint: "step into the function that is next on the execution stack"},
        "stepover" : {hint: "step over the current expression on the execution stack"},
        "stepout"  : {hint: "step out of the current function scope"}
    },
    hotitems: {},

    nodes : [],

    init : function(amlNode){
        while(tbRun.childNodes.length) {
            var button = tbRun.firstChild;
            ide.barTools.appendChild(button);
            this.nodes.push(button);
        }
        
        this.hotitems["resume"]   = [btnResume];
        this.hotitems["stepinto"] = [btnStepInto];
        this.hotitems["stepover"] = [btnStepOver];
        this.hotitems["stepout"]  = [btnStepOut];

        var _self = this;
        mdlRunConfigurations.addEventListener("afterload", function(e) {
            _self.$updateMenu();
        });
        mdlRunConfigurations.addEventListener("update", function(e) {
            settings.save();
            if (e.action == "add" || e.action == "redo-remove" || e.action == "attribute")
                _self.$updateMenu();
        });

        ide.addEventListener("loadsettings", function(e){
            var runConfigs = e.model.queryNode("auto/configurations");
            if (!runConfigs)
                runConfigs = apf.createNodeFromXpath(e.model.data, "auto/configurations");

            mdlRunConfigurations.load(runConfigs);
        });

        winRunCfgNew.addEventListener("hide", function() {
            mdlRunConfigurations.data.setAttribute("debug", "0");
        });
        
        lstScripts.addEventListener("afterselect", function(e) {
            e.selected && require("ext/debugger/debugger").showDebugFile(e.selected.getAttribute("scriptid"));
        });
    },

    duplicate : function() {
        var config = lstRunCfg.selected;
        if (!config)
            return;

        var duplicate = config.cloneNode(true);
        apf.b(config).after(duplicate);
        lstRunCfg.select(duplicate);
        winRunCfgNew.show();
    },

    addConfig : function() {
        var file = ide.getActivePageModel();

        if (!file || (file.getAttribute("contenttype") || "").indexOf("application/javascript") != 0) {
            var path = "";
            var name = "server";
        }
        else {
            path = file.getAttribute("path").slice(ide.davPrefix.length + 1);
            name = file.getAttribute("name").replace(/\.js$/, "");
        }

        var cfg = apf.n("<config />")
            .attr("path", path)
            .attr("name", name)
            .attr("args", "").node();

        mdlRunConfigurations.appendXml(cfg);
        lstRunCfg.select(cfg);
        winRunCfgNew.show();
    },

    showRunConfigs : function(debug) {
        mdlRunConfigurations.data.setAttribute("debug", debug ? "1": "0");
        winRunCfgNew.show();
    },

    run : function(debug) {
        var config = lstRunCfg.selected;
        mdlRunConfigurations.data.setAttribute("debug", debug ? "1": "0");
        if (!config) {
            this.addConfig();
        }
        else
            this.runConfig(config, debug);
    },

    $updateMenu : function() {
        var menus = [mnuRunCfg, mnuDebugCfg];

        for (var j=0; j<menus.length; j++) {
            var menu = menus[j];

            var item = menu.firstChild;
            while(item && item.tagName !== "a:divider") {
                menu.removeChild(item);
                item = menu.firstChild;
            }
            var divider = item;

            var configs = mdlRunConfigurations.queryNodes("config");
            if (!configs.length)
                menu.insertBefore(new apf.item({disabled:true, caption: "no run history"}), divider);
            else {
                for (var i=0,l=configs.length; i<l; i++) {
                    var item = new apf.item({
                        caption: configs[i].getAttribute("name")
                    });
                    item.$config = configs[i];

                    var _self = this;
                    item.onclick = function(debug) {
                        _self.runConfig(this.$config, debug);
                        lstRunCfg.select(this.$config);
                    }.bind(item, menu == mnuDebugCfg);
                    menu.insertBefore(item, menu.firstChild);
                }
            }
        }
    },

    runConfig : function(config, debug) {
        var model = settings.model;
        var saveallbeforerun = model.queryValue("general/@saveallbeforerun");
        if(saveallbeforerun) save.saveall();
        
        if (debug === undefined)
            debug = config.parentNode.getAttribute("debug") == "1";

        config.parentNode.setAttribute("debug", "0");
        noderunner.run(config.getAttribute("path"), config.getAttribute("args").split(" "), debug);
    },

    stop : function() {
        noderunner.stop();
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
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/debugger/debugger.js)SIZE(10812)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/debugger/debugger",
    ["core/ide",
     "core/document",
     "core/ext",
     "ext/console/console",
     "ext/noderunner/noderunner",
     "ext/panels/panels",
     "ext/filesystem/filesystem",
     "text!ext/debugger/debugger.xml"],
    function(ide, Document, ext, log, noderunner, panels, fs, markup) {

module.exports = ext.register("ext/debugger/debugger", {
    name   : "Debug",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [log, fs],
    commands: {
        "debug": {
            "hint": "run and debug a node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            }
        }
    },

    nodes : [],

    hook : function(){
        /*this.$layoutItem = mnuModes.appendChild(new apf.item({
            value   : "ext/debugger/debugger",
            caption : this.name
        }));*/

        ide.addEventListener("consolecommand.debug", function(e) {
            ide.socket.send(JSON.stringify({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "debugger"
            }));
            return false;
        });

        ide.addEventListener("consoleresult.internal-isfile", function(e) {
            var data = e.data;
            if (data.sender != "debugger")
                return;
            var path = data.cwd.replace(ide.workspaceDir, ide.davPrefix);
            if (data.isfile) {
                require("ext/debugger/debugger").showFile(path);
                require("ext/run/run").run(true);
            }
            else {
                require("ext/console/console").log("'" + path + "' is not a file.");
            }
        });
        
        panels.register(this);
    },

    init : function(amlNode){
        this.panel = winDbgStack;
        
        this.rightPane = colRight;
        this.nodes.push(
            //Append the stack window at the right
            this.rightPane.appendChild(winDbgStack)

            //Append the variable window on the right
            //this.rightPane.appendChild(winDbgInspect)
        );

        this.paths = {};
        var _self = this;
        mdlDbgSources.addEventListener("afterload", function() {
            _self.$syncTree();
        });
        mdlDbgSources.addEventListener("update", function(e) {
            if (e.action != "add")
                return;
            // TODO: optimize this!
            _self.$syncTree();
        });
        fs.model.addEventListener("update", function(e) {
            if (e.action != "insert")
                return;
            // TODO: optimize this!
            _self.$syncTree();
        });
        //@todo move this to noderunner...
        dbg.addEventListener("changeframe", function(e) {
            e.data && _self.showDebugFile(e.data.getAttribute("scriptid"));
        });

        lstBreakpoints.addEventListener("afterselect", function(e) {
            if (e.selected && e.selected.getAttribute("scriptid"))
                _self.showDebugFile(e.selected.getAttribute("scriptid"), parseInt(e.selected.getAttribute("line")) + 1);
            // TODO sometimes we don't have a scriptID
        });

        ide.addEventListener("afterfilesave", function(e) {
            var node = e.node;
            var doc = e.doc;
            
            var scriptId = node.getAttribute("scriptid");
            if (!scriptId)
                return;
                
            var value = e.value || doc.getValue();
            var NODE_PREFIX = "(function (exports, require, module, __filename, __dirname) { "
            var NODE_POSTFIX = "\n});";
            dbg.changeLive(scriptId, NODE_PREFIX + value + NODE_POSTFIX, false, function(e) {
                //console.log("v8 updated", e);
            });
        })
        //log.enable(true);
    },

    jump : function(fileEl, row, column, text, doc, page) {
        var path    = fileEl.getAttribute("path");
        var hasData = page && tabEditors.getPage(path).$doc ? true : false;

        if (row !== undefined) {
            var jumpTo = function(){
                setTimeout(function() {
                    ceEditor.$editor.gotoLine(row, column);
                    if (text)
                        ceEditor.$editor.find(text);
                    ceEditor.focus();
                }, 100);
            }
            
            if (hasData) {
                tabEditors.set(path);
                jumpTo();
            }
            else
                ide.addEventListener("afteropenfile", function(e) {
                    var node = e.doc.getNode();
                    
                    if (node.getAttribute("path") == path) {
                        ide.removeEventListener("afteropenfile", arguments.callee);
                        jumpTo();
                    }
                });
        }
        
        if (!hasData && !page) 
            ide.dispatchEvent("openfile", {
                doc: doc || ide.createDocument(fileEl)
            });
        else
            tabEditors.set(path);
    },

    contentTypes : {
        "js" : "application/javascript",
        "json" : "application/json",
        "css" : "text/css",
        "xml" : "application/xml",
        "php" : "application/x-httpd-php",
        "phtml" : "application/x-httpd-php",
        "html" : "text/html",
        "xhtml" : "application/xhtml+xml"
    },

    getContentType : function(file) {
        var type = file.split(".").pop() || "";
        return this.contentTypes[type] || "text/plain";
    },

    showFile : function(path, row, column, text) {
        var name = path.split("/").pop();
        var node = apf.n("<file />")
            .attr("name", name)
            .attr("contenttype", this.getContentType(name))
            .attr("path", path)
            .node();

        this.jump(node, row, column, text);
    },

    showDebugFile : function(scriptId, row, column, text) {
        var file = fs.model.queryNode("//file[@scriptid='" + scriptId + "']");

        if (file) {
            this.jump(file, row, column, text, null, true);
        } else {
            var script = mdlDbgSources.queryNode("//file[@scriptid='" + scriptId + "']");
            if (!script)
                return;

            var name = script.getAttribute("scriptname");
            var value = name.split("/").pop();

            if (name.indexOf(ide.workspaceDir) == 0) {
                var path = ide.davPrefix + name.slice(ide.workspaceDir.length);
                // TODO this has to be refactored to support multiple tabs
                var page = tabEditors.getPage(path);
                if (page)
                    var node = page.xmlRoot;
                else {
                    var node = apf.n("<file />")
                        .attr("name", value)
                        .attr("path", path)
                        .attr("contenttype", "application/javascript")
                        .attr("scriptid", script.getAttribute("scriptid"))
                        .attr("scriptname", script.getAttribute("scriptname"))
                        .attr("lineoffset", "0").node();
                }
                this.jump(node, row, column, text, null, page ? true : false);
            }
            else {
                var page = tabEditors.getPage(value);
                if (page)
                    this.jump(page.xmlRoot, row, column, text, null, true);
                else {
                    var node = apf.n("<file />")
                        .attr("name", value)
                        .attr("path", name)
                        .attr("contenttype", "application/javascript")
                        .attr("scriptid", script.getAttribute("scriptid"))
                        .attr("scriptname", script.getAttribute("scriptname"))
                        .attr("debug", "1")
                        .attr("lineoffset", "0").node();

                    var _self = this;
                    dbg.loadScript(script, function(source) {
                        var doc = ide.createDocument(node, source);
    
                        _self.jump(node, row, column, text, doc);
                    });
                }
            }
        }
    },

    count : 0,
    $syncTree : function() {
        if (this.inSync) return;
        this.inSync = true;
        var dbgFiles = mdlDbgSources.data.childNodes;

        var workspaceDir = ide.workspaceDir;
        for (var i=0,l=dbgFiles.length; i<l; i++) {
            var dbgFile = dbgFiles[i];
            var name = dbgFile.getAttribute("scriptname");
            if (name.indexOf(workspaceDir) != 0)
                continue;
            this.paths[name] = dbgFile;
        }
        var treeFiles = fs.model.data.getElementsByTagName("file");
        var tabFiles = ide.getAllPageModels();
        var files = tabFiles.concat(Array.prototype.slice.call(treeFiles, 0));

        var davPrefix = ide.davPrefix;
        for (var i=0,l=files.length; i<l; i++) {
            var file = files[i];
            var path = file.getAttribute("scriptname");

            var dbgFile = this.paths[path];
            if (dbgFile)
                apf.b(file).attr("scriptid", dbgFile.getAttribute("scriptid"));
        }
        this.inSync = false;
    },

    enable : function(){
        panels.initPanel(this);
        
        this.nodes.each(function(item){
            if (item.show)
                item.show();
        });
        this.rightPane.setProperty("visible", true);
        //log.enable(true);

        //Quick Fix
        if (apf.isGecko)
            apf.layout.forceResize(ide.vbMain.$ext);
    },

    disable : function(){
        if (!this.panel)
            return;
        
        this.nodes.each(function(item){
            if (item.hide)
                item.hide();
        });
        this.rightPane.setProperty("visible", false);
        //log.disable(true);

        //Quick Fix
        if (apf.isGecko)
            apf.layout.forceResize(ide.vbMain.$ext);
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        winV8.destroy(true, true);
        this.$layoutItem.destroy(true, true);

        this.nodes = [];
        
        panels.unregister(this);
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/noderunner/noderunner.js)SIZE(5196)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Node Runner Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/noderunner/noderunner",
    ["core/ide",
     "core/ext",
     "core/util",
     "ext/console/console",
     "text!ext/noderunner/noderunner.xml"], 
     function(ide, ext, util, log, markup) {

module.exports = ext.register("ext/noderunner/noderunner", {
    name   : "Node Runner",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    deps   : [log],
    commands: {
        "run": {
            "hint": "run a node program on the server",
            "commands": {
                "[PATH]": {"hint": "path pointing to an executable. Autocomplete with [TAB]"}
            }
        }
    },

    init : function(amlNode){
        ide.addEventListener("socketDisconnect", this.onDisconnect.bind(this));
        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        dbgNode.addEventListener("onsocketfind", function() {
            return ide.socket;
        });

        stDebugProcessRunning.addEventListener("activate", this.$onDebugProcessActivate.bind(this));
        stDebugProcessRunning.addEventListener("deactivate", this.$onDebugProcessDeactivate.bind(this));

        ide.addEventListener("consolecommand.run", function(e) {
            ide.socket.send(JSON.stringify({
                command: "internal-isfile",
                argv: e.data.argv,
                cwd: e.data.cwd,
                sender: "noderunner"
            }));
            return false;
        });

        ide.addEventListener("consoleresult.internal-isfile", function(e) {
            var data = e.data;
            if (data.sender != "noderunner")
                return;
            var path = data.cwd.replace(ide.workspaceDir, ide.davPrefix);
            if (data.isfile) {
                require("ext/debugger/debugger").showFile(path);
                require("ext/run/run").run(false);
            }
            else {
                require("ext/console/console").log("'" + path + "' is not a file.");
            }
        });
    },

    $onDebugProcessActivate : function() {
        dbg.attach(dbgNode, 0);
        require("ext/debugger/debugger").enable();
    },

    $onDebugProcessDeactivate : function() {
        dbg.detach();
    },

    onMessage : function(e) {
        var message = e.message;
//        console.log("MSG", message)

        switch(message.type) {
            case "node-debug-ready":
                ide.dispatchEvent("debugready");
                break;

            case "chrome-debug-ready":
                alert("READY")
                winTab.show();
                dbgChrome.loadTabs();
                ide.dispatchEvent("debugready");
                break;

            case "node-exit":
                stProcessRunning.deactivate();
                stDebugProcessRunning.deactivate();
                break;

            case "state":
                stDebugProcessRunning.setProperty("active", message.nodeDebugClient);
                dbgNode.setProperty("strip", message.workspaceDir + "/");
                ide.dispatchEvent("noderunnerready");
                break;

            case "node-data":            
                log.logNodeStream(message.data, message.stream, true);
                break;
                
            case "error":
                if (message.code !== 6) {
                    //util.alert("Server Error", "Server Error", message.message);
                    
                }
                ide.socket.send('{"command": "state"}');
                break;
                
        }
    },

    onDisconnect : function() {
        stDebugProcessRunning.deactivate();
    },

    debugChrome : function() {
        var command = {
            "command" : "RunDebugChrome",
            "file"    : ""
        };
        ide.socket.send(JSON.stringify(command));
    },

    debug : function() {
        this.$run(true);
    },

    run : function(path, args, debug) {
        if (stProcessRunning.active || !stServerConnected.active || !path)
            return false;

        var page = ide.getActivePageModel();
        var command = {
            "command" : debug ? "RunDebugBrk" : "Run",
            "file"    : path.replace(/^\/+/, ""),
            "args"    : args || "",
            "env"     : {
                "C9_SELECTED_FILE": page ? page.getAttribute("path").slice(ide.davPrefix.length) : ""
            }
        };
        ide.socket.send(JSON.stringify(command));

        log.clear();
        log.showOutput();

        if (debug)
            stDebugProcessRunning.activate();

        log.enable();
        stProcessRunning.activate();
    },

    stop : function() {
        if (!stProcessRunning.active)
            return

        require("ext/debugger/debugger").disable();
        ide.socket.send(JSON.stringify({"command": "kill"}));
    },

    enable : function(){
    },

    disable : function(){
    },

    destroy : function(){
    }
});

});

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/console/console.js)SIZE(36623)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/console/console",
    ["core/ide",
     "core/ext",
     "ace/lib/lang",
     "ext/panels/panels",
     "ext/console/parser",
     "ext/console/trie",
     "text!ext/console/console.css",
     "text!ext/console/console.xml"],
    function(ide, ext, lang, panels, parserCls, Trie, css, markup) {

var trieCommands,
    commands   = {},
    cmdTries   = {},
    cmdFetched = false,
    cmdHistory = [],
    cmdBuffer  = "",
    lastSearch = null,
    parser     = new parserCls();

var tt=0;
module.exports = ext.register("ext/console/console", {
    name   : "Console",
    dev    : "Ajax.org",
    type   : ext.GENERAL,
    alone  : true,
    markup : markup,
    css    : css,
    
    excludeParent : true,
    visible  : true,
    commands : {
        "help": {hint: "show general help information and a list of available commands"},
        "clear": {hint: "clear all the messages from the console"},
        "switchconsole" : {hint: "toggle focus between the editor and the console"},
        "send": {hint: "send a message to the server"}
    },

    help : function() {
        var words = trieCommands.getWords(),
            text  = [];

        for (var i = 0, l = words.length; i < l; ++i) {
            if (!commands[words[i]]) continue;
            text.push(words[i] + "\t\t\t\t" + commands[words[i]].hint);
        }
        this.logNodeStream(text.join("\n"));
    },
    
    clear : function() {
        this.inited && txtOutput.clear();
    },
    
    switchconsole : function() {
        if (apf.activeElement == txtConsoleInput) {
            if (window.ceEditor) {
                ceEditor.focus();
                this.disable();
            }
        }
        else
            txtConsoleInput.focus()
    },

    send : function(data) {
        ide.socket.send(data.line.replace(data.command,"").trim());
        return true;
    },

    
    showOutput : function(){
        tabConsole.set(1);
    },

    jump: function(path, row, column) {
        row = parseInt(row.slice(1));
        column = column ? parseInt(column.slice(1)) : 0;
        require("ext/debugger/debugger").showFile(path, row, column);
    },

    getCwd: function() {
        return this.$cwd && this.$cwd.replace("/workspace", ide.workspaceDir);
    },

    logNodeStream : function(data, stream, useOutput) {
        var colors = {
            30: "#eee",
            31: "red",
            32: "green",
            33: "yellow",
            34: "blue",
            35: "magenta",
            36: "cyan",
            37: "#eee"
        };

        workspaceDir = ide.workspaceDir;
        davPrefix = ide.davPrefix;

        var lines = data.split("\n");
        var style = "color:#eee;";
        var log = [];
        // absolute workspace files
        var wsRe = new RegExp(lang.escapeRegExp(workspaceDir) + "\\/([^:]*)(:\\d+)(:\\d+)*", "g");
        // relative workspace files
        var wsrRe = /(?:\s|^|\.\/)([\w\_\$-]+(?:\/[\w\_\$-]+)+(?:\.[\w\_\$]+))?(\:\d+)(\:\d+)*/g;
        
        for (var i=0; i<lines.length; i++) {
            if (!lines[i]) continue;

            log.push("<div class='item'><span style='" + style + "'>" + lines[i]
                .replace(/\s/g, "&nbsp;")
                .replace(wsrRe, "<a href='javascript:void(0)' onclick='require(\"ext/console/console\").jump(\"" + davPrefix + "/$1\", \"$2\", \"$3\")'>$1$2$3</a>")
                .replace(wsRe, "<a href='javascript:void(0)' onclick='require(\"ext/console/console\").jump(\"" + davPrefix + "/$1\", \"$2\", \"$3\")'>"+workspaceDir+"/$1$2$3</a>")
                .replace(/(((http:\/\/)|(www\.))[\w\d\.]*(:\d+)?(\/[\w\d]+)?)/, "<a href='$1' target='_blank'>$1</a>")
                .replace(/\033\[(?:(\d+);)?(\d+)m/g, function(m, extra, color) {
                    style = "color:" + (colors[color] || "#eee");
                    if (extra == 1) {
                        style += ";font-weight=bold"
                    } else if (extra == 4) {
                        style += ";text-decoration=underline";
                    }
                    return "</span><span style='" + style + "'>"
                }) + "</span></div>");
        }
		
        (useOutput ? txtOutput : txtConsole).addValue(log.join(""));
    },

    log : function(msg, type, pre, post, otherOutput){
        msg = apf.htmlentities(String(msg));

        if (!type)
            type = "log";
        else if (type == "divider") {
            msg = "<span style='display:block;border-top:1px solid #444; margin:6px 0 6px 0;'></span>";
        }
        else if (type == "prompt") {
            msg = "<span style='color:#86c2f6'>" + msg + "</span>";
        }
        else if (type == "command") {
            msg = "<span style='color:#86c2f6'><span style='float:left'>&gt;&gt;&gt;</span><div style='margin:0 0 0 25px'>"
                + msg + "</div></span>";
        }
        (otherOutput || txtConsole).addValue("<div class='item console_" + type + "'>" + (pre || "") + msg + (post || "") + "</div>");
    },

    write: function(aLines) {
        if (typeof aLines == "string")
            aLines = aLines.split("\n");
        for (var i = 0, l = aLines.length; i < l; ++i)
            this.log(aLines[i], "log");
        this.log("", "divider");
    },

    evaluate : function(expression, callback){
        var _self = this;
        var frame = dgStack && dgStack.selected && dgStack.selected.getAttribute("ref") || null;
        dbg.evaluate(expression, frame, null, null, callback || function(xmlNode){
            _self.showObject(xmlNode);
        });
    },

    checkChange : function(xmlNode){
        var value = xmlNode.getAttribute("value");
        if (xmlNode.tagName == "method" || "Boolean|String|undefined|null|Number".indexOf(xmlNode.getAttribute("type")) == -1)
            return false;
    },

    applyChange : function(xmlNode){
        var value = xmlNode.getAttribute("value");
        var name = this.calcName(xmlNode);
        try{
            if (name.indexOf(".") > -1) {
                var prop, obj = self.parent.eval(name.replace(/\.([^\.\s]+)$/, ""));
                if (obj && obj.$supportedProperties && obj.$supportedProperties.contains(prop = RegExp.$1)) {
                    obj.setProperty(prop, self.parent.eval(value));
                    return;
                }
            }

            self.parent.eval(name + " = " + value);

            //@todo determine new type
        }
        catch(e) {
            trObject.getActionTracker().undo();
            alert("Invalid Action: " + e.message);
            //@todo undo
        }
    },

    calcName : function(xmlNode, useDisplay){
        var isMethod = xmlNode.tagName == "method";
        var name, loopNode = xmlNode, path = [];
        do {
            name = useDisplay
                ? loopNode.getAttribute("display") || loopNode.getAttribute("name")
                : loopNode.getAttribute("name");

            if (!name)
                break;

            path.unshift(!name.match(/^[a-z_\$][\w_\$]*$/i)
                ? (parseInt(name) == name
                    ? "[" + name + "]"
                    : "[\"" + name.replace(/'/g, "\\'") + "\"]")
                : name);
            loopNode = loopNode.parentNode;
            if (isMethod) {
                loopNode = loopNode.parentNode;
                isMethod = false;
            }
        }
        while (loopNode && loopNode.nodeType == 1);

        if (path[0].charAt(0) == "[")
            path[0] = path[0].substr(2, path[0].length - 4);
        return path.join(".").replace(/\.\[/g, "[");
    },

    keyupHandler: function(e) {
        if (e.keyCode != 9 || e.keyCode != 13)
            return this.commandTextHandler(e);
    },

    keydownHandler: function(e) {
        if (e.keyCode == 9 || e.keyCode == 13)
            return this.commandTextHandler(e);
    },

    commandTextHandler: function(e) {
        var line      = e.currentTarget.getValue(),
            idx       = cmdHistory.indexOf(line),
            hisLength = cmdHistory.length,
            newVal    = "";
        if (cmdBuffer === null || (idx == -1 && cmdBuffer !== line))
            cmdBuffer = line;
        parser.parseLine(line);

        if (e.keyCode == 38) { //UP
            if (!hisLength)
                return;
            newVal = cmdHistory[--idx < 0 ? hisLength - 1 : idx];
            e.currentTarget.setValue(newVal);
            return false;
        }
        else if (e.keyCode == 40) { //DOWN
            if (!hisLength)
                return;
            newVal = (++idx > hisLength - 1 || idx === 0) ? (cmdBuffer || "") : cmdHistory[idx];
            e.currentTarget.setValue(newVal);
            return false;
        }
        else if (e.keyCode != 13 && e.keyCode != 9) {
            this.autoComplete(e, parser, 2);
            return;
        }

        if (parser.argv.length === 0) {
            // no commmand line input

            if (e.name == "keydown") {
                this.log(this.getPrompt(), "prompt");
                this.enable();
            }
        }
        else if (parser.argQL[0]) {
            // first argument quoted -> error
            this.write("Syntax error: first argument quoted.");
        }
        else {
            var s,
                cmd = parser.argv[parser.argc++];

            if (e.keyCode == 9) {
                this.autoComplete(e, parser, 1);
                return false;
            }

            cmdHistory.push(line);
            cmdBuffer = null;
            e.currentTarget.setValue(newVal);
            this.hideHints();

            this.log(this.getPrompt() + " " + parser.argv.join(" "), "prompt");
            this.enable();

            switch (cmd) {
                case "help":
                    this.help();
                    break;
                case "clear":
                    txtConsole.clear();
                    break;
                case "sudo":
                    s = parser.argv.join(" ").trim();
                    if (s == "sudo make me a sandwich") {
                        this.write("Okay.");
                        break;
                    }
                    else if (s == "sudo apt-get moo") {
                        //this.clear();
                        this.write([" ",
                            "        (__)",
                            "        (oo)",
                            "  /------\\/ ",
                            " / |    ||  ",
                            "*  /\\---/\\  ",
                            "   ~~   ~~  ",
                            "....\"Have you mooed today?\"...",
                            " "]);
                        break;
                    }
                    else {
                        this.write("E: Invalid operation " + parser.argv[parser.argc++]);
                        break;
                    }
                case "man":
                    var pages = {
                        "last": "Man, last night was AWESOME.",
                        "help": "Man, help me out here.",
                        "next": "Request confirmed; you will be reincarnated as a man next.",
                        "cat":  "You are now riding a half-man half-cat."
                    };
                    this.write((pages[parser.argv[parser.argc++]]
                        || "Oh, I'm sure you can figure it out."));
                    break;
                case "locate":
                    var keywords = {
                        "ninja": "Ninja can not be found!",
                        "keys": "Have you checked your coat pocket?",
                        "joke": "Joke found on user.",
                        "problem": "Problem exists between keyboard and chair.",
                        "raptor": "BEHIND YOU!!!"
                    };
                    this.write((keywords[parser.argv[parser.argc++]] || "Locate what?"));
                    break;
                default:
                    var jokes = {
                        "make me a sandwich": "What? Make it yourself.",
                        "make love": "I put on my robe and wizard hat.",
                        "i read the source code": "<3",
                        //"pwd": "You are in a maze of twisty passages, all alike.",
                        "lpr": "PC LOAD LETTER",
                        "hello joshua": "How about a nice game of Global Thermonuclear War?",
                        "xyzzy": "Nothing happens.",
                        "date": "March 32nd",
                        "hello": "Why hello there!",
                        "who": "Doctor Who?",
                        "su": "God mode activated. Remember, with great power comes great ... aw, screw it, go have fun.",
                        "fuck": "I have a headache.",
                        "whoami": "You are Richard Stallman.",
                        "nano": "Seriously? Why don't you just use Notepad.exe? Or MS Paint?",
                        "top": "It's up there --^",
                        "moo":"moo",
                        "ping": "There is another submarine three miles ahead, bearing 225, forty fathoms down.",
                        "find": "What do you want to find? Kitten would be nice.",
                        "more":"Oh, yes! More! More!",
                        "your gay": "Keep your hands off it!",
                        "hi":"Hi.",
                        "echo": "Echo ... echo ... echo ...",
                        "bash": "You bash your head against the wall. It's not very effective.",
                        "ssh": "ssh, this is a library.",
                        "uname": "Illudium Q-36 Explosive Space Modulator",
                        "finger": "Mmmmmm...",
                        "kill": "Terminator deployed to 1984.",
                        "use the force luke": "I believe you mean source.",
                        "use the source luke": "I'm not luke, you're luke!",
                        "serenity": "You can't take the sky from me.",
                        "enable time travel": "TARDIS error: Time Lord missing.",
                        "ed": "You are not a diety."
                    };
                    s = parser.argv.join(" ").trim();
                    if (jokes[s]) {
                        this.write(jokes[s]);
                        break;
                    }
                    else {
                        var data = {
                            command: cmd,
                            argv: parser.argv,
                            line: line,
                            cwd: this.getCwd()
                        };
                        if (ext.execCommand(cmd, data) === false) {
                            if (ide.dispatchEvent("consolecommand." + cmd, {
                              data: data
                            }) !== false) {
                                ide.socket.send(JSON.stringify(data));
                            }
                        }
                        return;
                    }
            }
        }
    },

    onMessage: function(e) {
        var res,
            message = e.message;
        if (message.type != "result")
            return;

        switch (message.subtype) {
            case "commandhints":
                var cmds = message.body;
                for (var cmd in cmds) {
                    trieCommands.add(cmd);
                    commands[cmd] = cmds[cmd];
                    if (cmds[cmd].commands)
                        this.subCommands(cmds[cmd].commands, cmd);
                }
                cmdFetched = true;
                break;
            case "internal-autocomplete":
                res = message.body;
                lastSearch = res;
                lastSearch.trie = new Trie();
                for (var i = 0, l = res.matches.length; i < l; ++i)
                    lastSearch.trie.add(res.matches[i]);
                this.showHints(res.textbox, res.base || "", res.matches, null, res.cursor);
                break;
            case "cd":
                res = message.body;
                if (res.cwd)
                    this.write("Working directory changed.");
                break;
            case "git":
            case "pwd":
            case "ls":
                res = message.body;
                //this.getPrompt() + " " + res.argv.join(" ") + "\n" + 
                this.logNodeStream(res.out || res.err);
                this.log("", "divider");
                break;
            case "error":
                //console.log("error: ", message.body);
                this.log(message.body);
                this.log("", "divider");
                break;
        }

        ide.dispatchEvent("consoleresult." + message.subtype, {data: message.body});
    },

    setPrompt: function(cwd) {
        if (cwd)
            this.$cwd = cwd.replace(ide.workspaceDir, ide.davPrefix);
        return this.getPrompt();
    },

    getPrompt: function() {
        return "[guest@cloud9]:" + this.$cwd + "$";
    },

    subCommands: function(cmds, prefix) {
        if (!cmdTries[prefix]) {
            cmdTries[prefix] = {
                trie    : new Trie(),
                commands: cmds
            };
        }
        for (var cmd in cmds) {
            cmdTries[prefix].trie.add(cmd);
            if (cmds[cmd].commands)
                this.subCommands(cmds[cmd].commands, prefix + "-" + cmd);
        }
    },

    autoComplete: function(e, parser, mode) {
        mode = mode || 2;
        if (mode === 1) {
            if (this.$busy) return;
            var _self = this;
            this.$busy = setTimeout(function(){clearTimeout(_self.$busy);_self.$busy = null;}, 100);
        }
        if (!trieCommands) {
            trieCommands = new Trie();
            apf.extend(commands, ext.commandsLut);
            for (var name in ext.commandsLut) {
                trieCommands.add(name);
                if (ext.commandsLut[name].commands)
                    this.subCommands(ext.commandsLut[name].commands, name);
            }
        }

        // keycodes that invalidate the previous autocomplete:
        if (e.keyCode == 8 || e.keyCode == 46)
            lastSearch = null;

        var root,
            list      = [],
            cmds      = commands,
            textbox   = e.currentTarget,
            val       = textbox.getValue(),
            len       = parser.argv.length,
            base      = parser.argv[0],
            cursorPos = 0;
        if (!apf.hasMsRangeObject) {
            var input = textbox.$ext.getElementsByTagName("input")[0];
            cursorPos = input.selectionStart;
        }
        else {
            var range = document.selection.createRange(),
                r2    = range.duplicate();
            r2.expand("textedit");
            r2.setEndPoint("EndToStart", range);
            cursorPos = r2.text.length;
        }
        --cursorPos;

        if (!cmdFetched) {
            ide.socket.send(JSON.stringify({
                command: "commandhints",
                argv: parser.argv,
                cwd: this.getCwd()
            }));
        }

        if (typeof parser.argv[0] != "string")
            return this.hideHints();

        // check for commands in first argument when there is only one argument
        // provided, or when the cursor on the first argument
        if (len == 1 && cursorPos < parser.argv[0].length) {
            root = trieCommands.find(parser.argv[0]);
            if (root)
                list = root.getWords();
        }
        else {
            var idx, needle, cmdTrie,
                i = len - 1;
            for (; i >= 0; --i) {
                idx = val.indexOf(parser.argv[i]);
                if (idx === -1) //shouldn't happen, but yeah...
                    continue;
                if (cursorPos >= idx || cursorPos <= idx + parser.argv[i].length) {
                    needle = i;
                    break;
                }
            }
            if (typeof needle != "number")
                needle = 0;

            ++needle;
            while (needle >= 0 && !(cmdTrie = cmdTries[parser.argv.slice(0, needle).join("-")]))
                --needle

            if (cmdTrie) {
                //console.log("needle we're left with: ", needle, len);
                root = cmdTrie.trie.find(parser.argv[needle]);
                base = parser.argv[needle];
                if (root) {
                    list = root.getWords();
                }
                else {
                    list = cmdTrie.trie.getWords();
                    // check for file/folder autocompletion:
                    if (list.length == 1 && list[0] == "[PATH]") {
                        //console.log("we have PATH, ", base, lastSearch);
                        if (base && lastSearch) {
                            list.splice(0, 1);
                            var newbase = base.split("/").pop();
                            if (!newbase) {
                                base = "";
                                list = lastSearch.trie.getWords();
                            }
                            else if (newbase.indexOf(lastSearch.base) > -1) {
                                console.log("searching for ", newbase, base, "mode:", mode);
                                root = lastSearch.trie.find(newbase);
                                if (root) {
                                    console.log("setting base ", base, "to", base, newbase);
                                    base = newbase;
                                    list = root.getWords();
                                }
                            }
                            if (!list.length) {
                                // we COULD do something special here...
                            }
                        }
                        else {
                            if (mode == 2)
                                list.splice(0, 1);
                            //base = "";
                        }
                        // adjust the argv array to match the current cursor position:
                        parser.argv = parser.argv.slice(0, needle);
                        parser.argv.push(base);
                        // else: autocompletion is sent to the backend
                        //console.log("directory found: ", base, list, "mode:", mode);
                    }
                    else {
                        base = "";
                    }
                }
                cmds = cmdTrie.commands;
                //console.log("list: ", list, base, parser.argv);
            }
        }

        if (list.length === 0)
            return this.hideHints();

        if (mode === 2) { // hints box
            this.showHints(textbox, base || "", list, cmds, cursorPos);
        }
        else if (mode === 1) { // TAB autocompletion
            var ins = base ? list[0].substr(1) : list[0];
            if (ins.indexOf("PATH]") != -1 && lastSearch && lastSearch.line == val && lastSearch.matches.length == 1)
                ins = lastSearch.matches[0].replace(lastSearch.base, "");
            if (ins.indexOf("PATH]") != -1) {
                ide.socket.send(JSON.stringify({
                    command: "internal-autocomplete",
                    line   : val,
                    textbox: textbox.id,
                    cursor : cursorPos,
                    argv   : parser.argv,
                    cwd    : this.getCwd()
                }));
            }
            else {
                if (!!(cmds || commands)[base + ins])
                    ins += " "; // for commands we suffix with whitespace
                var newval = val.substr(0, cursorPos + 1) + ins + val.substr(cursorPos + 1);
                if (val != newval)
                    textbox.setValue(newval);
                lastSearch = null;
            }
            this.hideHints();
        }
    },

    showHints: function(textbox, base, hints, cmdsLut, cursorPos) {
        var name = "console_hints";
        if (typeof textbox == "string")
            textbox = self[textbox];
        //console.log("showing hints for ", base, hints && hints[0]);
        //base = base.substr(0, base.length - 1);

        if (this.control && this.control.stop)
            this.control.stop();

        var cmdName, cmd, isCmd,
            content = [],
            i       = 0,
            len     = hints.length;

        for (; i < len; ++i) {
            cmdName = base ? base + hints[i].substr(1) : hints[i];
            //console.log("isn't this OK? ", cmdName, base);
            cmd = (cmdsLut || commands)[cmdName];
            isCmd = !!cmd;
            content.push('<a href="javascript:void(0);" onclick="require(\'ext/console/console\').hintClick(\'' 
                + base + '\', \'' + cmdName + '\', \'' + textbox.id + '\', ' + cursorPos + ', ' + isCmd + ')">'
                + cmdName + ( cmd
                ? '<span>' + cmd.hint + (cmd.hotkey
                    ? '<span class="hints_hotkey">' + (apf.isMac
                        ? apf.hotkeys.toMacNotation(cmd.hotkey)
                        : cmd.hotkey) + '</span>'
                    : '') + '</span>'
                : '')
                + '</a>');
        }

        if (!this.$winHints)
            this.$winHints = document.getElementById("barConsoleHints");

        this.$winHints.innerHTML = content.join("");

        if (apf.getStyle(this.$winHints, "display") == "none") {
            //this.$winHints.style.top = "-30px";
            this.$winHints.style.display = "block";
            //txtConsoleInput.focus();

            //Animate
            /*apf.tween.single(this.$winHints, {
                type     : "fade",
                anim     : apf.tween.easeInOutCubic,
                from     : 0,
                to       : 100,
                steps    : 8,
                interval : 10,
                control  : (this.control = {})
            });*/
        }

        var pos = apf.getAbsolutePosition(textbox.$ext, this.$winHints.parentNode);
        this.$winHints.style.left = Math.max(cursorPos * 5, 5) + "px";
        //this.$winHints.style.top = (pos[1] - this.$winHints.offsetHeight) + "px";
    },

    hideHints: function() {
        if (!this.$winHints)
            this.$winHints = document.getElementById("barConsoleHints");
        this.$winHints.style.display = "none";
        //@todo: animation
    },

    hintClick: function(base, cmdName, txtId, insertPoint, isCmd) {
        if (isCmd)
            cmdName += " "; // for commands we suffix with whitespace
        var textbox = self[txtId],
            input   = textbox.$ext.getElementsByTagName("input")[0],
            val     = textbox.getValue(),
            before  = val.substr(0, (insertPoint + 1 - base.length)) + cmdName;
        textbox.setValue(before + val.substr(insertPoint + 1));
        textbox.focus();
        // set cursor position at the end of the text just inserted:
        var pos = before.length;
        if (apf.hasMsRangeObject) {
            var range = input.createTextRange();
            range.expand("textedit");
            range.select();
            range.collapse();
            range.moveStart("character", pos);
            range.moveEnd("character", 0);
            range.collapse();
        }
        else {
            input.selectionStart = input.selectionEnd = pos;
        }

        this.hideHints();
    },

    consoleTextHandler: function(e) {
        if(e.keyCode == 13 && e.ctrlKey) {
            var _self = this;
            
            var expression = txtCode.getValue().trim();
            if (!expression)
                return;
            
            tabConsole.set(1);
            this.log(expression, "command", null, null, txtOutput);
            
            this.evaluate(expression, function(xmlNode, body, refs, error){
                if (error)
                    _self.log(error.message, "error");
                else {
                    var type = body.type, value = body.value || body.text, ref = body.handle, className = body.className;
                    if (className == "Function") {
                        var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/console/console\").showObject(null, ["
                            + body.scriptId + ", " + body.line + ", " + body.position + ", "
                            + body.handle + ",\"" + (body.name || body.inferredName) + "\"], \""
                            + (expression || "").split(";").pop().replace(/"/g, "\\&quot;") + "\")'>";
                        var post = "</a>";
                        var name = body.name || body.inferredName || "function";
                        _self.log(name + "()", "log", pre, post, txtOutput);
                    }
                    else if (className == "Array") {
                        var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/console/console\").showObject(\""
                            + apf.escapeXML(xmlNode.xml.replace(/"/g, "\\\"")) + "\", "
                            + ref + ", \"" + apf.escapeXML((expression || "").trim().split(/;|\n/).pop().trim().replace(/"/g, "\\\"")) + "\")'>";
                        var post = " }</a>";

                        _self.log("Array { length: "
                            + (body.properties && body.properties.length - 1), "log", pre, post, txtOutput);
                    }
                    else if (type == "object") {
                        var refs = [], props = body.properties;
                        for (var i = 0, l = body.properties.length; i < l; i++) {
                            refs.push(props[i].ref);
                        }

                        var pre = "<a class='xmlhl' href='javascript:void(0)' style='font-weight:bold;font-size:7pt;color:green' onclick='require(\"ext/console/console\").showObject(\""
                            + apf.escapeXML(xmlNode.xml.replace(/"/g, "\\\"")) + "\", "
                            + ref + ", \"" + apf.escapeXML((expression || "").trim().split(/;|\n/).pop().trim().replace(/"/g, "\\\"")) + "\")'>";
                        var post = " }</a>";

                        dbg.$debugger.$debugger.lookup(refs, false, function(body) {
                            var out = [className || value, "{"];
                            for (var item, t = 0, i = 0; i < l; i++) {
                                item = body[refs[i]];
                                if (item.className == "Function" || item.className == "Object")
                                    continue;
                                if (t == 5) {
                                    out.push("more...");
                                    break;
                                }
                                var name = props[i].name || (props[i].inferredName || "Unknown").split(".").pop();
                                out.push(name + "=" + item.value, ", ");
                                t++;
                            }
                            if (t) out.pop();

                            _self.log(out.join(" "), "log", pre, post, txtOutput);
                        });
                    }
                    else
                        _self.log(value, "log", null, null, txtOutput);
                }
            });

            require("ext/settings/settings").save();
            return false;
        }
    },

    showObject : function(xmlNode, ref, expression){
        if (ref && ref.dataType == apf.ARRAY) {
            require("ext/debugger/debugger").showDebugFile(ref[0], ref[1] + 1, 0, ref[4]);
        }
        else {
            require("ext/quickwatch/quickwatch").toggleDialog(1);

            if (xmlNode && typeof xmlNode == "string")
                xmlNode = apf.getXml(xmlNode);

            var name = xmlNode && xmlNode.getAttribute("name") || expression;
            txtCurObject.setValue(name);
            dgWatch.clear("loading");

            if (xmlNode) {
                setTimeout(function(){
                    var model = dgWatch.getModel();
                    var root  = apf.getXml("<data />");
                    apf.xmldb.appendChild(root, xmlNode);
                    model.load(root);
                    //model.appendXml(xmlNode);
                }, 10);
            }
            else if (ref) {

            }
            else {
                this.evaluate(expression);
            }
        }
    },

    types : ["Object", "Number", "Boolean", "String", "Array", "Date", "RegExp", "Function", "Object"],
    domtypes : [null, "Element", "Attr", "Text", "CDataSection",
                "EntityReference", "Entity", "ProcessingInstruction", "Comment",
                "Document", "DocumentType", "DocumentFragment", "Notation"],

    calcName : function(xmlNode, useDisplay){
        var isMethod = xmlNode.tagName == "method";
        var name, loopNode = xmlNode, path = [];
        do {
            name = useDisplay
                ? loopNode.getAttribute("display") || loopNode.getAttribute("name")
                : loopNode.getAttribute("name");

            if (!name)
                break;

            path.unshift(!name.match(/^[a-z_\$][\w_\$]*$/i)
                ? (parseInt(name) == name
                    ? "[" + name + "]"
                    : "[\"" + name.replace(/'/g, "\\'") + "\"]")
                : name);
            loopNode = loopNode.parentNode;
            if (isMethod) {
                loopNode = loopNode.parentNode;
                isMethod = false;
            }
        }
        while (loopNode && loopNode.nodeType == 1);

        if (path[0].charAt(0) == "[")
            path[0] = path[0].substr(2, path[0].length - 4);
        return path.join(".").replace(/\.\[/g, "[");
    },

    /**** Init ****/

    hook : function(){
        panels.register(this);
        panels.initPanel(this);
    },

    init : function(amlNode){
        this.panel = tabConsole;
        this.$cwd  = "/workspace";

        //Append the console window at the bottom below the tab
        mainRow.appendChild(winDbgConsole); //selectSingleNode("a:hbox[1]/a:vbox[2]").

        apf.importCssString((this.css || "") + " .console_date{display:inline}");

        ide.addEventListener("socketMessage", this.onMessage.bind(this));
    },

    enable : function(fromParent){
        /*if (!this.panel)
            panels.initPanel(this);

        if (this.manual && fromParent)
            return;

        if (!fromParent)
            this.manual = true;*/

        this.mnuItem.check();
        tabConsole.show();

        if (winDbgConsole.height == 41)
            winDbgConsole.setAttribute("height", this.height || 200);
        winDbgConsole.previousSibling.show();
        
        apf.layout.forceResize();
    },

    disable : function(fromParent){
        /*if (this.manual && fromParent || !this.inited)
            return;

        if (!fromParent)
            this.manual = true;*/

        this.mnuItem.uncheck();
        tabConsole.hide();

        if (winDbgConsole.height != 41)
            this.height = winDbgConsole.height;
        winDbgConsole.setAttribute("height", 41);
        winDbgConsole.previousSibling.hide();
        
        apf.layout.forceResize();
    },

    destroy : function(){
        winDbgConsole.destroy(true, true);
        panels.unregister(this);
    }
});

});


/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/tabbehaviors/tabbehaviors.js)SIZE(10716)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Tab Behaviors for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/tabbehaviors/tabbehaviors",
    ["core/ide", "core/ext", "core/util", "ext/save/save"],
    function(ide, ext, util, save) {

module.exports = ext.register("ext/tabbehaviors/tabbehaviors", {
    name    : "Tab Behaviors",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    menus   : [],
    sep     : null,
    more    : null,
    tabSub  : 2,
    commands : {
        "closetab": {hint: "close the tab that is currently active"},
        "closealltabs": {hint: "close all opened tabs"},
        "closeallbutme": {hint: "close all opened tabs, but the tab that is currently active"},
        "gototabright": {hint: "navigate to the next tab, right to the tab that is currently active"},
        "gototableft": {hint: "navigate to the next tab, left to the tab that is currently active"},
        "tab1": {hint: "navigate to the first tab"},
        "tab2": {hint: "navigate to the second tab"},
        "tab3": {hint: "navigate to the third tab"},
        "tab4": {hint: "navigate to the fourth tab"},
        "tab5": {hint: "navigate to the fifth tab"},
        "tab6": {hint: "navigate to the sixth tab"},
        "tab7": {hint: "navigate to the seventh tab"},
        "tab8": {hint: "navigate to the eighth tab"},
        "tab9": {hint: "navigate to the ninth tab"},
        "tab0": {hint: "navigate to the tenth tab"}
    },
    hotitems: {},

    nodes   : [],

    init : function(amlNode){
        var _self = this;
        
        this.nodes.push(
            mnuPanels.appendChild(new apf.item({
                caption : "Close Tab",
                onclick : function(){
                    _self.closetab();
                }
            })),
            mnuPanels.appendChild(new apf.item({
                caption : "Close All Tabs",
                onclick : this.closealltabs.bind(this)
            })),
            mnuPanels.appendChild(new apf.item({
                caption : "Close All But Current Tab",
                onclick : function(){
                    _self.closeallbutme();
                }
            })),
            mnuPanels.appendChild(new apf.divider()),
            apf.document.body.appendChild(new apf.menu({
                id : "mnuTabs",
                childNodes : [
                    new apf.item({
                        caption : "Close Tab",
                        onclick : function(){
                            _self.closetab(tabEditors.contextPage);
                        }
                    }),
                    new apf.item({
                        caption : "Close All Tabs",
                        onclick : this.closealltabs.bind(this)
                    }),
                    new apf.item({
                        caption : "Close All But This Tab",
                        onclick : function(){
                            _self.closeallbutme(tabEditors.contextPage);
                        }
                    })
                ]
            }))
        );
        
        this.hotitems["closetab"]      = [this.nodes[0]];
        this.hotitems["closealltabs"]  = [this.nodes[1]];
        this.hotitems["closeallbutme"] = [this.nodes[2]];

        tabEditors.setAttribute("contextmenu", "mnuTabs");

        tabEditors.addEventListener("close", function(e) {
            _self.removeItem(e.page);
            if (!e || !e.htmlEvent)
                return;
            var page = e.page;
            e = e.htmlEvent;
            if (e.shiftKey) { // Shift = close all
                return _self.closealltabs();
            }
            else if(e.altKey) { // Alt/ Option = close all but this
                return _self.closeallbutme(page);
            }
        });

        tabEditors.addEventListener("DOMNodeInserted", function(e) {
            var page;
            if ((page = e.currentTarget) && page.parentNode == this && page.localName == "page" && page.fake) {
                _self.addItem(page);
                
                var count = 0;
                
                apf.addListener(page.$button, "mousedown", function(e) {
                    if (++count < 2)
                        return setTimeout(function () { count = 0; }, 500);
                    require("ext/panels/panels").toggleAll();
                    count = 0;
                });
            }
        })
    },

    closetab: function(page) {
        if (!page)
            page = tabEditors.getPage();
        if (page)
            tabEditors.remove(page);
        return false;
    },

    closealltabs: function() {
        var tabs  = tabEditors,
            pages = tabs.getPages(),
            i     = pages.length - 1,
            _self = this;
        
        save.saveAllInteractive(pages, function(all){
            if (all == -100) //Cancel
                return;
            
            pages.each(function(page){
                page.$at.undo(-1);
                _self.removeItem(page);
                tabs.remove(page, true);
            });
        });
    },

    closeallbutme: function(page) {
        page = page || tabEditors.getPage();
        var tabs  = tabEditors,
            pages = tabs.getPages(),
            i     = pages.length - 1,
            set   = [],
            _self = this;
        for (; i >= 0; --i) {
            if (pages[i] == page) continue;
            set.push(pages[i]);
        }
        
        save.saveAllInteractive(set, function(all){
            if (all == -100) //Cancel
                return;
            
            set.each(function(page){
                page.$at.undo(-1);
                _self.removeItem(page);
                tabs.remove(page, true);
            });
        });
        
        return false;
    },

    gototabright: function() {
        return this.cycleTab("right");
    },

    gototableft: function() {
        return this.cycleTab("left");
    },

    cycleTab: function(dir) {
        var bRight  = dir == "right",
            tabs    = tabEditors,
            pages   = tabs.getPages(),
            curr    = tabs.getPage(),
            currIdx = pages.indexOf(curr);
        if (!curr || pages.length == 1)
            return;
        var idx = currIdx + (bRight ? 1 : -1);
        if (idx < 0)
            idx = pages.length - 1;
        if (idx > pages.length -1)
            idx = 0;
        tabs.set(pages[idx].id);
        return false;
    },

    tab1: function() {return this.showTab(1);},
    tab2: function() {return this.showTab(2);},
    tab3: function() {return this.showTab(3);},
    tab4: function() {return this.showTab(4);},
    tab5: function() {return this.showTab(5);},
    tab6: function() {return this.showTab(6);},
    tab7: function() {return this.showTab(7);},
    tab8: function() {return this.showTab(8);},
    tab9: function() {return this.showTab(9);},
    tab0: function() {return this.showTab(10);},

    showTab: function(nr) {
        var item = this.nodes[nr + this.tabSub];
        if (item && item.relPage) {
            tabEditors.set(item.relPage);
            return false;
        }
    },

    addItem: function(page) {
        this.updateState(true);
        if (this.more)
            return; // no more items allowed...
        var no = this.nodes.push(
            mnuPanels.appendChild(new apf.item({
                caption : page.getAttribute("caption"),
                model   : page.$model,
                relPage : page.id,
                onclick : function() {
                    tabEditors.set(this.relPage);
                }
            }))
        ) - 1;

        var keyId = "tab" + (no - this.tabSub == 10 ? 0 : no - this.tabSub);
        this.hotitems[keyId] = [this.nodes[no]];
        if (typeof this.commands[keyId]["hotkey"] != "undefined") {
            apf.hotkeys.register(this.commands[keyId].hotkey, this[keyId].bind(this));
            this.nodes[no].setAttribute("hotkey", this.commands[keyId].hotkey);
        }
    },

    removeItem: function(page) {
        var item, keyId,
            i = 0,
            l = this.nodes.length;
        for (; i < l; ++i) {
            if ((item = this.nodes[i]).relPage == page.id) {
                item.destroy(true, true);
                this.nodes.splice(i, 1);
                keyId = "tab" + (i - this.tabSub == 10 ? 0 : i - this.tabSub);
                if (typeof this.commands[keyId]["hotkey"] != "undefined")
                    apf.hotkeys.remove(this.commands[keyId].hotkey);
                return this.updateState();
            }
        }
    },

    updateState: function(force) {
        var len = this.nodes.length - 4;
        if (this.sep && !len) {
            this.sep.destroy(true, true);
            this.sep = null;
        }
        else if (!this.sep && (len || force)) {
            if (len)
                this.sep = mnuPanels.insertBefore(new apf.divider(), this.nodes[0]);
            else
                this.sep = mnuPanels.appendChild(new apf.divider());
        }

        if (len < (force ? 9 : 10)) { // we already have 4 other menu items
            if (this.more) {
                this.more.destroy(true, true);
                this.more = null;
            }
        }
        else if (!this.more) {
            this.more = mnuPanels.appendChild(new apf.item({
                caption : "More...",
                onclick : function() {
                    alert("To be implemented!")
                }
            }));
        }

        // update hotkeys and hotitems:
        var keyId,
            aItems = this.nodes.slice(4),
            i      = 0,
            l      = aItems.length;
        for (; i < l; ++i) {
            keyId = "tab" + (i + 1 == 10 ? 0 : i + 1);
            this.hotitems[keyId] = [aItems[i]];
            if (typeof this.commands[keyId]["hotkey"] != "undefined")
                aItems[i].setProperty("hotkey", this.commands[keyId].hotkey);
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
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

    }
);


/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/keybindings/keybindings.js)SIZE(3435)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Keybindings Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/keybindings/keybindings",
    ["core/ide", "core/ext", "core/util", "text!ext/keybindings/settings.xml"],
    function(ide, ext, util, settings) {

module.exports = ext.register("ext/keybindings/keybindings", {
    name   : "Keybindings Manager",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    current: null,

    nodes : [],

    init : function(amlNode){
        //Settings Support
        ide.addEventListener("init.ext/settings/settings", function(e){
            var page = e.ext.addSection("keybindings", "Keybindings", "general");
            page.insertMarkup(settings);
        });

        // fetch the default keybindings:
        // @todo fetch latest config from localStorage
        var _self = this;
        require(["ext/keybindings_default/default_" + (apf.isMac ? "mac" : "win")]);
        ide.addEventListener("$event.keybindingschange", function(callback){
            if (_self.current)
                callback({keybindings: _self.current});
        });
    },

    onLoad : function(def) {
        // parse keybindings definition
        this.current = def;

        // update keybindings for extensions:
        def = def.ext;
        var i, j, l, name, oExt, command, bindings, items, item, val;
        for (i in ext.extLut) {
            name     = i.substr(i.lastIndexOf("/") + 1).toLowerCase();
            bindings = def[name];
            oExt     = ext.extLut[i];
            if (!bindings || !oExt.commands) continue;
            for (command in oExt.commands) {
                if (!bindings[command])
                    continue;
                if (typeof (val = oExt.commands[command])["hotkey"] !== "undefined")
                    apf.hotkeys.remove(val.hotkey);
                oExt.commands[command].hotkey = bindings[command];
                if (ext.commandsLut[command])
                    ext.commandsLut[command].hotkey = bindings[command];
                if ((items = (oExt.hotitems && oExt.hotitems[command]))) {
                    for (j = 0, l = items.length; j < l; ++j) {
                        item = items[j];
                        if (!item.setAttribute) continue;
                        item.setAttribute("hotkey", bindings[command]);
                    }
                }
                if (typeof oExt[command] != "function" && !oExt.hotitems) {
                    apf.console.error("Please implement the '" + command
                        + "' function on plugin '" + oExt.name + "' for the keybindings to work");
                }
                else if (!oExt.hotitems) {
                    apf.hotkeys.register(bindings[command], oExt[command].bind(oExt));
                }
            }
        }

        ide.dispatchEvent("keybindingschange", {keybindings: def});
        return def;
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
    }
});

    }
);

/*FILEHEAD(/cygdrive/c/Development/javeline/cloud9/support/packager/lib/../../../client/ext/watcher/watcher.js)SIZE(8068)TIME(Tue, 23 Nov 2010 11:49:14 GMT)*/

/**
 * Watcher Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

require.def("ext/watcher/watcher",
    ["core/ext", "core/ide", "core/util"],
    function(ext, ide, util) {

module.exports = ext.register("ext/watcher/watcher", {
    name    : "Watcher",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    markup  : null,
    visible : true,
    
    hook : function() {
        // console.log("Initializing watcher");
        
        var removedPaths        = {},
            removedPathCount    = 0,
            changedPaths        = {},
            changedPathCount    = 0,
            ignoredPaths        = {};
            
        function sendWatchFile(path) {
            // console.log("Sending watchFile message for file " + path);
            ide.socket.send(JSON.stringify({
                "command"     : "watcher",
                "type"        : "watchFile",
                "path"        : path
            }));
        }
        
        function sendUnwatchFile(path) {
            // console.log("Sending unwatchFile message for file " + path);
            ide.socket.send(JSON.stringify({
                "command"     : "watcher",
                "type"        : "unwatchFile",
                "path"        : path
            }));
        }           
       
        function checkPage() {
            var page = tabEditors.getPage(),
                data = page.$model.data,
                path = data.getAttribute("path");
            
            if (removedPaths[path]) {
                util.question(
	                "File removed, keep tab open?",
	                path + " has been deleted, or is no longer available.",
	                "Do you wish to keep the file open in the editor?",
	                function() { // Yes
	                    apf.xmldb.setAttribute(data, "changed", "1");
	                    delete removedPaths[path];
	                    --removedPathCount;
	                    winQuestion.hide();
	                },
	                function() { // Yes to all
	                    var pages = tabEditors.getPages();
	                    
	                    pages.forEach(function(page) {
	                       apf.xmldb.setAttribute(page.$model.data, "changed", "1");
	                    });
	                    removedPaths = {};
	                    removedPathCount = 0;
	                    winQuestion.hide();
	                },
	                function() { // No
	                    tabEditors.remove(page);
	                    delete removedPaths[path];
	                    --removedPathCount;
	                    winQuestion.hide();
	                },
	                function() { // No to all
	                    var pages = tabEditors.getPages();
	                    
	                    pages.forEach(function(page) {
	                    if (removedPaths[page.$model.data.getAttribute("path")])
	                        tabEditors.remove(page);
	                    });
	                    removedPaths = {};
	                    removedPathCount = 0;
	                    winQuestion.hide();
	                }
                );
                btnQuestionYesToAll.setAttribute("visible", removedPathCount > 1);
                btnQuestionNoToAll.setAttribute("visible", removedPathCount > 1);
            } else if (changedPaths[path]) {
                util.question(
                    "File changed, reload tab?",
                    path + " has been changed by another application.",
                    "Do you want to reload it?",
                    function() { // Yes
                        ide.dispatchEvent("reload", {doc : page.$doc});
                        delete changedPaths[path];
                        --changedPathCount;
                        winQuestion.hide();
                    },
                    function() { // Yes to all
                        var pages = tabEditors.getPages();
                        
                        pages.forEach(function (page) {
                            if (changedPaths[page.$model.data.getAttribute("path")])
                                ide.dispatchEvent("reload", {doc : page.$doc});
                        });
                        changedPaths = {};
                        changedPathCount = 0;
                        winQuestion.hide();
                    },
                    function() { // No
                        delete changedPaths[path];
                        --changedPathCount;
                        winQuestion.hide();
                    },
                    function() { // No to all
                        changedPaths = {};
                        changedPathCount = 0;
                        winQuestion.hide();
                    }
                );
                btnQuestionYesToAll.setAttribute("visible", changedPathCount > 1);
                btnQuestionNoToAll.setAttribute("visible", changedPathCount > 1);
            }
        }
        
        stServerConnected.addEventListener("activate", function() {
            var pages = tabEditors.getPages();
            
            pages.forEach(function (page) {
                sendWatchFile(page.$model.data.getAttribute("path"));
            });
        });
        
        ide.addEventListener("openfile", function(e) {
            var path = e.doc.getNode().getAttribute("path");

            // console.log("Opened file " + path);
            if (ide.socket)
                sendWatchFile(path);
            else
                stServerConnected.addEventListener("activate", function () {
                    sendWatchFile(path);
                    stServerConnected.removeEventListener("activate", arguments.callee);
                });
        });        

        ide.addEventListener("closefile", function(e) {
            var path = e.xmlNode.getAttribute("path");

            if (ide.socket)
                sendUnwatchFile(path);
            else
                stServerConnected.addEventListener("activate", function () {
                    sendUnwatchFile(path);
                    stServerConnected.removeEventListener("activate", arguments.callee);
                });
        });
        
        ide.addEventListener("afterfilesave", function(e) {
            var path = e.node.getAttribute("path");
            
            // console.log("Adding " + path + " to ignore list");
            ignoredPaths[path] = path;
        });
                
        ide.addEventListener("socketMessage", function(e) {
            var pages = tabEditors.getPages();
            
            with (e.message) {
                if (type != "watcher" || !pages.some(function (page) {
                    return page.$model.data.getAttribute("path") == path;
                }))
                    return;
                switch (subtype) {
                case "create":
                    break;
                case "remove":
                    if (!removedPaths[path]) {
                        removedPaths[path] = path;
                        ++removedPathCount;
                        checkPage();
                    }
                    break;
                case "change":
                    if (ignoredPaths[path]) {
                        // console.log("Ignoring change notification for file " + path);
                        delete ignoredPaths[path];
                    } else if (!changedPaths[path]) {
                        changedPaths[path] = path;
                        ++changedPathCount;
                        checkPage();
                    }
                    break;
                }
            }
        });
        
        tabEditors.addEventListener("afterswitch", function(e) {
            checkPage();
        });
    },
});

    }
);
