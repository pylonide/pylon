/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
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
            var val = (this.undolength ? 1 : undefined);
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