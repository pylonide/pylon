/**
 * Code Editor for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/editors/editors",
    ["core/ide", "core/ext", "core/util", "ext/panels/panels"],
    function(ide, ext, util, panels) {

return ext.register("ext/editors/editors", {
    name    : "Editors",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],
    visible : true,

    contentTypes  : {},

    register : function(oExtension){
        var id = "rb" + oExtension.path.replace(/\//g, "_");

        oExtension.$rbEditor = barButtons.appendChild(new apf.radiobutton({
            id        : id,
            label     : oExtension.name,
            value     : oExtension.path,
            visible   : "{require('ext/editors/editors').isEditorAvailable(tabEditors.activepage, '" + oExtension.path + "')}",
            onclick   : function(){
                require('ext/editors/editors').switchEditor(this.value);
            }
        }));

        //Add a menu item to the list of editors
        oExtension.$itmEditor = ide.mnuEditors.appendChild(new apf.item({
            type    : "radio",
            caption : oExtension.name,
            value   : oExtension.path,
            onclick : function(){
                require('ext/editors/editors').switchEditor(this.value);
            }
        }));

        var _self = this;
        oExtension.contentTypes.each(function(mime){
            (_self.contentTypes[mime] || (_self.contentTypes[mime] = [])).push(oExtension);
        });

        if (!this.contentTypes["default"])
            this.contentTypes["default"] = oExtension;
    },

    unregister : function(oExtension){
        oExtension.$rbEditor.destroy(true, true);
        oExtension.$itmEditor.destroy(true, true);

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
        return this.hbox.appendChild(new apf.vbox({
            flex       : 1,
            childNodes : [
                new apf.tab({
                    id      : "tabEditors",
                    flex    : 1,
                    buttons : "close", //scale
                    onfocus : function(e){
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
                }),
                new apf.hbox({
                    id : "barButtons"
                })
            ]
        }));
    },

    isEditorAvailable : function(page, path){
        var editor = ext.extLut[path];
        if (!editor)
            return false;
        
        var contentTypes = editor.contentTypes;
        return contentTypes.indexOf(tabEditors.getPage(page).contentType) > -1;
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
        if (page.type == path)
            return;

        var lastType = page.type;

        var editor = ext.extLut[path];
        if (!editor.inited)
            this.initEditor(editor);

        editor.$itmEditor.select();
        editor.$rbEditor.select();

        page.setAttribute("type", path);
        
        this.beforeswitch({nextPage: page});
        this.afterswitch({nextPage: page, previousPage: {type: lastType}});
    },

    openEditor : function(filename, filepath, xmlNode) {
        var page = tabEditors.getPage(filepath);
        if (page) {
            tabEditors.set(page);
            return;
        }

        var contentType = (xmlNode.getAttribute("contenttype") || "").split(";")[0];
        var editor = this.contentTypes[contentType] && this.contentTypes[contentType][0] || this.contentTypes["default"];

        if (this.currentEditor)
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
        var model, fake = tabEditors.add(filename, filepath, editor.path, null, function(page){
            page.contentType    = contentType;
            page.$at            = new apf.actiontracker();
            model = page.$model = new apf.model();
            page.$model.load(xmlNode);
        });

        fake.$at.addEventListener("afterchange", function(){
            var val = (this.undolength ? 1 : undefined);
            if (fake.changed != val) {
                fake.changed = val;
                fake.setAttribute("caption", filename + (val ? "*" : ""));
                model.setQueryValue("@name", filename + (val ? "*" : ""));
            }
        });
        
        //Set active page
        tabEditors.set(filepath);
        
        //if (editorPage.model != model)
            //this.beforeswitch({nextPage: fake});

        //Open tab, set as active and wait until opened
        /*fake.addEventListener("afteropen", function(){

        });*/

        editor.enable();
        editor.$itmEditor.select();
        editor.$rbEditor.select();

        this.currentEditor = editor;
    },

    close : function(page){
        page.addEventListener("afterclose", this.$close);
    },

    $close : function() {
        var page = this;
        var at   = page.$at;
        var mdl  = page.$model;

        mdl.removeXml("data");
        ide.dispatchEvent("clearfilecache", {xmlNode: mdl.data});
        
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

        toHandler.$itmEditor.select();
        toHandler.$rbEditor.select();

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
            _self.openEditor(
                e.node.getAttribute("name"), 
                e.node.getAttribute("path"), 
                e.node);
        });

        var vbox = ide.vbMain.selectSingleNode("a:hbox[1]/a:vbox[2]");
        this.hbox = vbox.insertBefore(new apf.hbox({flex : 1}), vbox.firstChild);
        this.nodes.push(this.addTabSection());
        
        this.panel = this.hbox;
        
        /**** Support for state preservation ****/
        
        this.$settings = {}, _self = this;
        ide.addEventListener("loadsettings", function(e){
            var model = e.model;
            ide.addEventListener("extload", function(){
                //apf.getXml('<files><file id="6" type="file" size="1109" name="cloudide.js" contenttype="application/javascript; charset=utf-8" creationdate="" lockable="false" hidden="false" executable="false"/></files>').childNodes;
                var nodes = model.queryNodes("auto/files/file");
                for (var i = 0, l = nodes.length; i < l; i++) {
                    ide.dispatchEvent("openfile", {
                        node : nodes[i]
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
                pNode = apf.createNodeFromXpath(e.model.data, "auto/files");
                for (var i = 0, l = pages.length; i < l; i++) {
                    pNode.appendChild(apf.xmldb.cleanNode(pages[i].$model.data.cloneNode(false)));
                }
            }
            
            if (state != (pNode && pNode.xml))
                return true;
        });
    },

    enable : function(){
        this.hbox.show();
    },

    disable : function(){
        this.hbox.hide();
    },

    destroy : function(){
        this.hbox.destroy(true, true);
        panels.unregister(this);
    }
});

});