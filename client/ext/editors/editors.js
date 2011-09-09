/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var panels = require("ext/panels/panels");
var dockpanel = require("ext/dockpanel/dockpanel");

module.exports = ext.register("ext/editors/editors", {
    name    : "Editors",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],
    visible : true,
    alwayson : true,

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

        if (!this.contentTypes["default"] || (oExtension.name && oExtension.name == "Code Editor"))
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
                        if (!ide.onLine && !ide.offlineFileSystemSupport) //For now prevent tabs from being closed
                            return false;
                            
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
            ext.style.left = (pos[0] - 2) + "px";
            ext.style.top  = pos[1] + "px";
            var d = apf.getDiff(ext);
            ext.style.width = (ph.offsetWidth + 2 + (apf.isGecko && dockpanel.visible ? 2 : 0) - d[0]) + "px";
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
            this.initEditor(editor);
        
        //Create Fake Page
        if (init)
            tabEditors.setAttribute("buttons", "close");
        
        var model = new apf.model(), 
            fake = tabEditors.add("{([@changed] == 1 ? '*' : '') + [@name]}", filepath, editor.path, null, function(page){
                page.contentType = contentType;
                page.$at     = new apf.actiontracker();
                page.$doc    = doc;
                page.$editor = editor;
                page.setAttribute("tooltip", "[@path]");
                page.setAttribute("class",
                    "{parseInt([@saving]) ? (tabEditors.getPage(tabEditors.activepage) == this ? 'saving_active' : 'saving') : \
                    ([@loading] ? (tabEditors.getPage(tabEditors.activepage) == this ? 'loading_active' : 'loading') : '')}"
                );
                page.setAttribute("model", page.$model = model);
                page.$model.load(xmlNode);
                
                //this is very bad, should be removed
                setTimeout(function(){
                    editor.setState && editor.setState(doc, doc.state);
                }, 1000);
            });

        if (init)
            tabEditors.setAttribute("buttons", "close,scale");
        
        var editorPage = tabEditors.getPage(tabEditors.activepage);
        
        doc.addEventListener("setnode", function(e) {
            fake.$model.load(e.node);
            ide.dispatchEvent("afteropenfile", {doc: doc, node: e.node});
        });

        fake.$at.addEventListener("afterchange", function(e) {
            if (e.action == "reset") {
                delete this.undo_ptr;
                return;
            }            
            
            var val;
            if (fake.$at.ignoreChange) {
                val = undefined;
                fake.$at.ignoreChange = false;
            } else if(this.undolength === 0 && !this.undo_ptr)
                val = undefined;
            else
                val = (this.$undostack[this.$undostack.length-1] !== this.undo_ptr) ? 1 : undefined;
                
            if (fake.changed !== val) {
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

    close : function(page) {
        page.addEventListener("afterclose", this.$close);
    },

    $close : function() {
        var page = this;
        var at   = page.$at;
        var mdl  = page.$model;
        
        mdl.setQueryValue("@changed", 0);
        page.$doc.dispatchEvent("close");
        
        if(mdl.data) {
            mdl.removeXml("data");
            ide.dispatchEvent("closefile", {xmlNode: mdl.data});
        }
        //mdl.unshare();
        mdl.destroy();

        at.reset();
        at.destroy();
        
        //If there are no more pages left, reset location
        if (!tabEditors.getPage()) {
            /*if (window.history.pushState) {
                var p = location.pathname.split("/");
                window.history.pushState(path, path, "/" + (p[1] || "") + "/" + (p[2] || ""));
            }
            else {
                apf.history.setHash("");
            }*/
            apf.history.setHash("");
        }
        
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
        
        page.$editor.setDocument && page.$editor.setDocument(page.$doc, page.$at);
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
        
        var path = page.$model.data.getAttribute("path").replace(/^\/workspace/, "");
        /*if (window.history.pushState) {
            var p = location.pathname.split("/");
            window.history.pushState(path, path, "/" + (p[1] || "name") + "/" + (p[2] || "project") + path);
        }
        else {
            apf.history.setHash("!" + path);
        }*/
        apf.history.setHash("!" + path);
        
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
        
        window.onpopstate = function(e){
            var page = "/workspace" + e.state;
            if (tabEditors.activepage != page && tabEditors.getPage(page))
                tabEditors.set(page);
        };

        apf.addEventListener("hashchange", function(e){
            var page = "/workspace" + e.page;
            if (tabEditors.activepage != page && tabEditors.getPage(page))
                tabEditors.set(page);
        });
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

        this.$settings = {};
        ide.addEventListener("loadsettings", function(e){
            function checkExpand(path, doc) {
                var parent_path = apf.getDirname(path).replace(/\/$/, "");
                trFiles.addEventListener("expand", function(e){
                    if (e.xmlNode && e.xmlNode.getAttribute("path") == parent_path) {
                        doc.setNode(e.xmlNode.selectSingleNode("node()[@path='" + path + "']"));
                    }
                });
            }
            
            var model = e.model;
            ide.addEventListener("extload", function(){
                var active = model.queryValue("auto/files/@active");
                var nodes  = model.queryNodes("auto/files/file");
                for (var doc, i = 0, l = nodes.length; i < l; i++) {
                    doc = ide.createDocument(nodes[i]);
                    
                    var state = nodes[i].getAttribute("state");
                    try {
                        if (state)
                            doc.state = JSON.parse(state);
                    }
                    catch (ex) {}
                    
                    ide.dispatchEvent("openfile", {
                        doc    : doc,
                        init   : true,
                        active : active 
                            ? active == nodes[i].getAttribute("path")
                            : i == l - 1
                    });
                    
                    checkExpand(nodes[i].getAttribute("path"), doc);
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
                    if (!file || file.getAttribute("debug"))
                        continue;

                    var copy = apf.xmldb.cleanNode(file.cloneNode(false));
                    copy.removeAttribute("changed");
                    copy.removeAttribute("loading");
                    copy.removeAttribute("saving");
                    pNode.appendChild(copy);
                    
                    var state = pages[i].$editor.getState && pages[i].$editor.getState(pages[i].$doc);
                    if (state)
                        copy.setAttribute("state", apf.serialize(state));
                }
            }

            if (state != (pNode && pNode.xml))
                return true;
        });
        
        ide.addEventListener("afterreload", function(e) {
            var doc         = e.doc,
                acesession  = doc.acesession,
                sel         = acesession.getSelection();
            
            sel.selectAll();
            acesession.getUndoManager().ignoreChange = true;
            acesession.replace(sel.getRange(), e.data);
            sel.clearSelection();
        });
    },

    showFile : function(path, row, column, text) {
        var name = path.split("/").pop();
        var node = apf.n("<file />")
            .attr("name", name)
            .attr("contenttype", util.getContentType(name))
            .attr("path", path)
            .node();

        this.jump(node, row, column, text);
    },

    jump : function(fileEl, row, column, text, doc, page) {
        var path    = fileEl.getAttribute("path");
        var hasData = page && tabEditors.getPage(path).$doc ? true : false;

        if (row !== undefined) {
            var jumpTo = function(){
                setTimeout(function() {
                    // TODO move this to the editor
                    ceEditor.$editor.gotoLine(row, column);
                    if (text)
                        ceEditor.$editor.find(text);
                    ceEditor.focus();
                }, 100);
            };

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
