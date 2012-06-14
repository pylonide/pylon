/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var util = require("core/util");
var settings = require("core/settings");
var commands = require("ext/commands/commands");
var fs = require("ext/filesystem/filesystem");

module.exports = ext.register("ext/editors/editors", {
    name    : "Editors",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],

    fileExtensions  : {},

    showTabs : true,

    register : function(oExtension){
        /*var id = "rb" + oExtension.path.replace(/\//g, "_");

        oExtension.$rbEditor = barButtons.appendChild(new apf.radiobutton({
            id        : id,
            label     : oExtension.name,
            value     : oExtension.path,
            margin    : "0 -1 0 0",
            visible   : "{require('ext/editors/editors').isEditorAvailable(tabEditors.activepage, '" + oExtension.path + "')}",
            onclick   : function(){
                require('ext/editors/editors').switchEditor(this.value);
            }
        }));*/

        var _self = this;

        //Add a menu item to the list of editors
        oExtension.$itmEditor = menus.addItemByPath("View/Editors/" + oExtension.name, new apf.item({
            type     : "radio",
            value    : oExtension.path,
            group    : this.$itmGroup,
            onclick  : function(){
                _self.switchEditor(this.value);
            }
        }), 40000);

        var _self = this;
        oExtension.fileExtensions.each(function(mime){
            (_self.fileExtensions[mime] || (_self.fileExtensions[mime] = [])).push(oExtension);
        });

        if (!this.fileExtensions["default"] || (oExtension.name && oExtension.name == "Code Editor"))
            this.fileExtensions["default"] = oExtension;
    },

    unregister : function(oExtension){
        //oExtension.$rbEditor.destroy(true, true);
        oExtension.$itmEditor.destroy(true, true);

        var _self = this;
        oExtension.fileExtensions.each(function(fe){
            _self.fileExtensions[fe].remove(oExtension);
            if (!_self.fileExtensions[fe].length)
                delete _self.fileExtensions[fe];
        });

        menus.remove("View/Editors/" + oExtension.name);

        if (this.fileExtensions["default"] == oExtension) {
            delete this.fileExtensions["default"];

            for (var prop in this.fileExtensions) {
                this.fileExtensions["default"] = this.fileExtensions[prop][0];
                break;
            }
        }
    },

    toggleTabs : function(force, preview, noAnim, mouse){
        if (!force || force > 0) {
            if (!preview) {
                settings.model.setQueryValue("auto/tabs/@show", "true");
                ide.dispatchEvent("tabs.visible", {value: true});
                this.showTabs = true;
            }

            this.setTabResizeValues(tabEditors.parentNode.$ext, force == 1, !noAnim, mouse, 1);
            apf.layout.forceResize(barButtonContainer.$ext);
        }
        else {
            if (!preview) {
                settings.model.setQueryValue("auto/tabs/@show", "false");
                ide.dispatchEvent("tabs.visible", {value: false});
                this.showTabs = false;
            }

            this.setTabResizeValues(tabEditors.parentNode.$ext, force == 1, !noAnim, mouse, 0);
            apf.layout.forceResize(barButtonContainer.$ext);
        }

    },

    addTabSection : function(){
        var _self = this;
        var vbox = this.hbox.appendChild(
            new apf.bar({id:"tabPlaceholder", flex:1, skin:"basic"})
        );

        var btn, btnMenu;
        var tab = new apf.bar({
            skin     : "basic",
            "class"  : "codeditorHolder",
            style    : "position:absolute;", //53px
            //htmlNode : document.body,
            childNodes: [
                new apf.tab({
                    id      : "tabEditors",
                    skin    : "editor_tab",
                    style   : "height : 100%",
                    buttons : "close,scale,order",
                    animate : "[{require('core/settings').model}::general/@animateui]",
                    anims   : "{apf.isTrue(this.animate) ? 'add|remove|sync' : ''}",
                    overactivetab  : true,
                    onfocus        : function(e){
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

                        e.page.addEventListener("afterclose", _self.$close);
                    },
                    childNodes : [
                        btn = new apf.button({
                            id : "plus_tab_button",
                            "class" : "plus_tab_button",
                            skin : "btn_icon_only",
                            onclick : function(){
                                require("ext/newresource/newresource").newfile();
                            }
                        })
                    ]
                }),

                btnMenu = new apf.button({
                    onmouseover : function(){
                        this.setAttribute("submenu", require('ext/menus/menus').getMenuId('View/Tabs'));
                    },
                    onmousedown : function(){
                        apf.setStyleClass(window[menus.getMenuId('View/Tabs')].$ext, 'tabsContextMenu');
                    },
                   /* showme  : "[{require('core/settings').model}::auto/tabs/@show]",
                    visible : "{apf.isTrue(this.showme)}", */
                    skin : "btn_icon_only",
                    "class" : "tabmenubtn",
                }) /*,
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

        apf.document.documentElement.appendChild(tab);
        var tabs = tabEditors;

        this.buttons = {
            add: btn,
            menu: btnMenu
        }

        tabs.$buttons.appendChild(btn.$ext);
        tabs.$buttons.appendChild(btnMenu.$ext);
        tabs.addEventListener("DOMNodeInserted",function(e){
            if (e.$isMoveWithinParent) {
                //record position in settings

                var amlNode = e.currentTarget;
                if (amlNode.localName != "page" || e.relatedNode != this || amlNode.nodeType != 1)
                    return;

                settings.save();
            }

            if (e.relatedNode == this && e.currentTarget.localName == "page") {
                tabs.appendChild(btn);
                tabs.$buttons.appendChild(btn.$ext);
                btn.$ext.style.position = "";
                btn.$ext.style.right = "";
                btn.$ext.style.top = "";
            }
        });

        tabs.addEventListener("DOMNodeRemoved",function(e){
            if (e.relatedNode == this && this.getPages().length == 1) {
                btn.$ext.style.position = "absolute";
                btn.$ext.style.right = "5px";
                btn.$ext.style.top = "8px";
            }
        });

        this.$buttonContainer = new apf.bar({
            skin : "basic",
            "class": "editor_tab",
            "style": "position:absolute;z-index:10;",
            htmlNode : document.body
        });
        this.$buttonContainer.$int.appendChild(tabEditors.$buttons);
        //tabEditors.$buttons.style[apf.CSSPREFIX + "BoxFlex"] = 1;

//        var timer;
//        tabEditors.$buttons.addEventListener("mouseover",function(e){
//            clearTimeout(timer);
//
//            if (_self.showTabs || _self.previewing)
//                return;
//
//            timer = setTimeout(function(){
//                if (!_self.previewing) {
//                    _self.toggleTabs(1, true, null, true);
//                    _self.previewing = true;
//                }
//            }, 200);
//        });
//        tabEditors.$buttons.addEventListener("mouseout",function(e){
//            clearTimeout(timer);
//
//            if (_self.showTabs || apf.isChildOf(tabEditors.$buttons, e.toElement, true))
//                return;
//
//            timer = setTimeout(function(){
//                if (_self.previewing) {
//                    _self.previewing = false;
//                    _self.toggleTabs(-1, true, null, true);
//                }
//            }, 300);
//        });

        splitterPanelLeft.addEventListener("dragmove", function(e){
            _self.isResizing = true;
        });
        splitterPanelLeft.addEventListener("dragdrop", function(e){
            _self.isResizing = false;
        });

        ide.addEventListener("init.ext/sidebar/sidebar", function(){
            navbar.addEventListener("resize", function(){
                _self.$resizeButtons();
            });
        });

        tabPlaceholder.addEventListener("resize", this.$tabPlaceholderResize = function(e){
            _self.$resize(tabEditors.parentNode.$ext);
        });

        return vbox;
    },

    /**
     * This method has been abstracted so it can be used by
     * the focus extension to get the destination coordinates and
     * dimensions of tabEditors.parentNode when the editor goes
     * out of focus mode
     */
    setTabResizeValues : function(ext, preview, animate, mouse, dir) {
        var ph;
        var pos = apf.getAbsolutePosition(ph = tabPlaceholder.$ext);
        var d = apf.getDiff(ext);
        var _self = this;

        if (this.animating && (!animate || this.animating[0] == preview))
            return;

        if (animate) {
            if (this.animateControl)
                this.animateControl.stop();

            this.animating = [preview];

            if (dir == undefined)
                dir = tabEditors.$buttons.style.height == "10px" ? 1 : 0;
            var steps = mouse ? 10 : 5;
            var i = dir ? steps + 1 : 0;
            var div = mouse ? 2 : 1;

            if (dir) {
                tabEditors.$buttons.style.height = "8px";
                apf.setStyleClass(tabEditors.$buttons.parentNode, "", ["hidetabs"]);
                apf.setStyleClass(tabEditors.$buttons, "step6");
            }

            apf.tween.multi(ext, {
                anim : mouse ? apf.tween.easeOutCubic : apf.tween.easeOutCubic,
                steps : steps,
                interval : apf.isWebkit ? 0 : 10,
                control : this.animateControl = {},
                tweens : [
                    { from: ext.offsetTop, to: ((this.showTabs || preview ? 0 : - 16) + pos[1]), type: "top" },
                    { from: ext.offsetHeight - d[1], to: ((this.showTabs || preview ? 0 : 16) + ph.offsetHeight - d[1]), type: "height" },
                    { oHtml: tabEditors.$buttons, from: parseInt(tabEditors.$buttons.style.height), to: (this.showTabs || preview ? 27 : 12), type: "height" },
                    { oHtml: this.buttons.add, from: dir ? 0 : 1, to : dir ? 1 : 0, type: "fade" },
                    { oHtml: this.buttons.add, from: dir ? 10 : 17, to : dir ? 17 : 10, type: "height" },
                    { oHtml: this.buttons.menu, from: dir ? 0 : 1, to : dir ? 1 : 0, type: "fade" },
                    { oHtml: this.buttons.menu, from: dir ? 10 : 17, to : dir ? 17 : 10, type: "height" }
                ],
                oneach : function(){
                    apf.setStyleClass(tabEditors.$buttons,
                        "step" + Math.ceil((dir ? --i : ++i) / div),
                        ["step" + Math.ceil((dir ? i + 1 : i-1) / div)]);

                    if (tabEditors.getPage())
                        apf.layout.forceResize(tabEditors.getPage().$ext);
                },
                onfinish : function(e){
                    apf.setStyleClass(tabEditors.$buttons, "",
                        ["step" + Math.ceil(i / div)]);

                    _self.animating = false;

                    if (!dir) {
                        apf.setStyleClass(tabEditors.$buttons.parentNode, "hidetabs");
                    }

                    if (tabEditors.getPage())
                        apf.layout.forceResize(tabEditors.getPage().$ext);
                }
            })
        }
        else {
            if (this.showTabs || preview) {
                tabEditors.$buttons.style.height = "27px";
                apf.setStyleClass(tabEditors.$buttons.parentNode, "", ["hidetabs"]);
                this.buttons.menu.setHeight(17);
                this.buttons.add.setHeight(17);
            }
            else {
                tabEditors.$buttons.style.height = "12px";
                apf.setStyleClass(tabEditors.$buttons.parentNode, "hidetabs");
                this.buttons.menu.setHeight(10);
                this.buttons.add.setHeight(10);
            }

            this.$resize(ext, preview);
        }
    },

    $resize : function(ext, preview){
        if (this.previewing || this.animating)
            return;

        var ph;
        var pos = apf.getAbsolutePosition(ph = tabPlaceholder.$ext);
        var d = apf.getDiff(ext);

        ext.style.left = (pos[0] - 2) + "px";
        ext.style.top = ((this.showTabs || preview ? 0 : - 16) + pos[1]) + "px";
        // + (hboxDockPanel.getWidth() && apf.isGecko ? 2 : 0)
        ext.style.width = (ph.offsetWidth + 2 - d[0]) + "px";
        ext.style.height = ((this.showTabs || preview ? 0 : 16) + ph.offsetHeight - d[1]) + "px";

        if (this.isResizing)
            this.$resizeButtons([pos[0], pos[1] - 27], ph.offsetWidth);
    },

    $resizeButtons : function(pos, width){
        var ph, ext = this.$buttonContainer.$ext;
        var d2 = apf.getDiff(ext);
        if (!pos)
            pos = apf.getAbsolutePosition(ph = barButtonContainer.$ext);
        if (!width)
            width = ph.offsetWidth;

        ext.style.left = (Math.max(this.showTabs ? 45 : 0, pos[0])) + "px";
        ext.style.top = (pos[1]) + "px"; // - 28
        ext.style.width = (width + 2 - d2[0]) + "px";
    },

    /**
     * Disable the resize event when the editors are in focus mode
     */
    disableTabResizeEvent : function() {
        tabPlaceholder.removeEventListener("resize", this.$tabPlaceholderResize);
    },

    /**
     * Enable the resize event when the editors come back to non-focus mode
     */
    enableTabResizeEvent : function() {
        tabPlaceholder.addEventListener("resize", this.$tabPlaceholderResize);
    },

    isEditorAvailable : function(page, path){
        var editor = ext.extLut[path];
        if (!editor)
            return false;

        var fileExtensions = editor.fileExtensions;
        var fileExtension = (tabEditors.getPage(page).$model.queryValue("@path") || "").split(".").pop().toLowerCase();
        var isEnabled = fileExtensions.indexOf(fileExtension) > -1;

        if (!isEnabled && this.fileExtensions["default"] == editor)
            return true;
        else
            return isEnabled;
    },

    initEditor : function(editor){
        //Create Page Element
        var editorPage = new apf.page({
            id        : editor.path,
            mimeTypes : editor.fileExtensions,
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

        var info;
        if ((info = page.$doc.dispatchEvent("validate", info)) === true) {
            util.alert(
                "Could not switch editor",
                "Could not switch editor because this document is invalid.",
                "Please fix the error and try again:" + info
            );
            return;
        }

        var editor = ext.extLut[path];
        if (!editor.inited)
            this.initEditor(editor);

        //editor.$rbEditor.select();

        page.setAttribute("type", path);

        page.$editor = editor;
        this.currentEditor = editor;

        this.beforeswitch({nextPage: page});
        this.afterswitch({nextPage: page, previousPage: {type: lastType}, keepEditor : true});
    },

    openEditor : function(doc, init, active, forceOpen) {
        var xmlNode  = doc.getNode();
        var filepath = xmlNode.getAttribute("path");
        var tabs = tabEditors;

        if (!forceOpen) {
            var page = tabs.getPage(filepath);
            if (page) {
                tabs.set(page);
                return;
            }
        }

        var fileExtension = (xmlNode.getAttribute("path") || "").split(".").pop().toLowerCase();
        var editor = this.fileExtensions[fileExtension]
          && this.fileExtensions[fileExtension][0]
          || this.fileExtensions["default"];

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
            tabs.setAttribute("buttons", "close");

        var model = new apf.model();
        var fake = tabs.add("{([@changed] == 1 ? '*' : '') + [@name]}", filepath, editor.path, null, function(page){
            page.$at     = new apf.actiontracker();
            page.$doc    = doc;
            doc.$page    = page;
            page.$editor = editor;
            page.setAttribute("autofocus", false);
            page.setAttribute("tooltip", "[@path]");
            page.setAttribute("class",
                "{parseInt([@saving], 10) || parseInt([@lookup], 10) ? (tabEditors.getPage(tabEditors.activepage) == this ? 'saving_active' : 'saving') : \
                ([@loading] ? (tabEditors.getPage(tabEditors.activepage) == this ? 'loading_active' : 'loading') : '')}"
            );
            page.setAttribute("model", page.$model = model);

            model.load(xmlNode);
            model.addEventListener("update", function(){
                settings.save();
            });
        });

        if (init)
            tabs.setAttribute("buttons", "close,scale,order");

        doc.addEventListener("setnode", function(e) {
            fake.$model.load(e.node);
        });

        this.initEditorEvents(fake, model);

        ide.dispatchEvent("tab.create", {
            page: fake,
            model: model,
            doc: doc
        });

        if (init && !active)
            return;

        //Set active page
        tabs.set(filepath);

        //if (editorPage.model != model)
            //this.beforeswitch({nextPage: fake});

        editor.enable();
        //editor.$rbEditor.select();

        this.currentEditor = editor;

        // okay don't know if you would want this, but this is the way the 'open file' dialog
        // handles it so let's do that
        setTimeout(function () {
            if (typeof editor.amlEditor !== "undefined")
                editor.amlEditor.focus();
        }, 100);

        settings.save();
    },

    initEditorEvents: function(page, model) {
        model = model || page.$model;
        page.$at.addEventListener("afterchange", function(e) {
            if (e.action == "reset") {
                delete this.undo_ptr;
                return;
            }

            var val;
            if (page.$at.ignoreChange) {
                val = undefined;
                page.$at.ignoreChange = false;
            }
            else if(this.undolength === 0 && !this.undo_ptr) {
                val = undefined;
            }
            else {
                val = (this.$undostack[this.$undostack.length - 1] !== this.undo_ptr)
                    ? 1
                    : undefined;
            }

            if (page.changed !== val) {
                page.changed = val;
                model.setQueryValue("@changed", (val ? "1" : "0"));

                var node = page.$doc.getNode();
                ide.dispatchEvent("updatefile", {
                    changed : val ? 1 : 0,
                    xmlNode : node
                });
            }
        });
    },

    resizeTabs : function(cancel){
        clearTimeout(this.closeTimer);

        if (cancel)
            return;

        this.closeTimer = setTimeout(function(){
            tabEditors.$waitForMouseOut = false;
            tabEditors.$scaleinit(null, "sync");
        }, 500);
    },

    close : function(page) {
        var pages = tabEditors.getPages();
        var isLast = (pages[pages.length - 1] == page);
        tabEditors.remove(page);
        this.resizeTabs(isLast);
    },

    $close : function() {
        var page   = this;
        var at     = page.$at;
        var editor = page.$editor;
        var mdl    = page.$model;

        mdl.setQueryValue("@changed", 0);
        page.$doc.dispatchEvent("close");

        if (mdl.data) {
            mdl.removeXml("data");
            ide.dispatchEvent("closefile", {xmlNode: mdl.data, page: page});
        }

        //mdl.unshare();
        mdl.destroy();

        at.reset();
        at.destroy();

        //If there are no more pages left, reset location
        if (tabEditors.getPages().length == 1) {
            /*if (window.history.pushState) {
                var p = location.pathname.split("/");
                window.history.pushState(path, path, "/" + (p[1] || "") + "/" + (p[2] || ""));
            }
            else {
                apf.history.setHash("");
            }*/
            //apf.history.setHash("");

            editor.clear && editor.clear();
            require("ext/editors/editors").currentEditor = null;
        }

        //Destroy the app page if it has no application instance
        //if (!tabEditors.selectNodes("page[@type='" + page.type + "']").length && editorPage)
            //editorPage.destroy(true, true);

        settings.save();
    },

    switchfocus : function(e){

    },

    beforeswitch : function(e) {
        var page       = e.nextPage;
        var editorPage = tabEditors.getPage(page.type);
        if (!editorPage) return;

        // fire this event BEFORE editor sessions are swapped.
        ide.dispatchEvent("beforeeditorswitch", {
            previousPage: e.previousPage,
            nextPage: e.nextPage
        });

        if (editorPage.model != page.$model)
            editorPage.setAttribute("model", page.$model);
        if (editorPage.actiontracker != page.$at)
            editorPage.setAttribute("actiontracker", page.$at);

        if (ide.dispatchEvent("editorswitch", {
            previousPage: e.previousPage,
            nextPage: e.nextPage
        }) !== false) {
            page.$editor.setDocument && page.$editor.setDocument(page.$doc, page.$at);
        }
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

        settings.save();

        if (!e.keepEditor) {
            var fileExtension = (path || "").split(".").pop().toLowerCase();
            var editor = this.fileExtensions[fileExtension]
              && this.fileExtensions[fileExtension][0]
              || this.fileExtensions["default"];

            if (!editor) {
                util.alert(
                    "No editor is registered",
                    "Could not find an editor to display content",
                    "There is something wrong with the configuration of your IDE. No editor plugin is found.");
                return;
            }

            if (!editor.inited)
                this.initEditor(editor);

            this.currentEditor = editor;
        }
        else {
            var editor = page.$editor;
        }

        if (editor.focus)
            editor.focus();

        //toHandler.$rbEditor.select();

        /*if (self.TESTING) {}
            //do nothing
        else if (page.appid)
            app.navigateTo(page.appid + "/" + page.id);
        else if (!page.id)
            app.navigateTo(app.loc || (app.loc = "myhome"));*/
    },

    /**** Init ****/

    init : function(){
        var _self = this;

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

        menus.addItemByPath("View/Editors/", new apf.menu({
            "onprop.visible" : function(e){
                if (e.value) {
                    if (!_self.currentEditor)
                        this.disable();
                    else {
                        this.enable();

                        var nodes = this.childNodes;
                        for (var i = nodes.length - 1; i >= 0; i--) {
                            nodes[i].setAttribute("disabled",
                                !_self.isEditorAvailable(
                                    tabEditors.activepage, nodes[i].value));
                        }

                        _self.$itmGroup.setValue(_self.currentEditor.path);
                    }
                }
            }
        }), 190);

        commands.addCommand({
            name: "toggleTabs",
            bindKey : { mac : "Ctrl-M", wind: "Ctrl-M" },
            exec: function(e){
                 _self.toggleTabs(!_self.showTabs ? 1 : -1);
            }
        });

        menus.addItemByPath("View/Tab Button", new apf.item({
            type: "check",
            checked : "[{require('core/settings').model}::auto/tabs/@show]",
            command : "toggleTabs"
        }), 300);

        ext.addType("Editor", function(oExtension){
            _self.register(oExtension);
          }, function(oExtension){
            _self.unregister(oExtension);
          });

        ide.addEventListener("openfile", function(e){
            _self.openEditor(e.doc, e.init, e.active, e.forceOpen);
        });

        ide.addEventListener("filenotfound", function(e) {
            var page = tabEditors.getPage(e.path);
            if (page)
                tabEditors.remove(page);
        });

        ide.addEventListener("afteroffline", function(e){
            tabEditors.$setStyleClass(tabEditors.$ext, "offline");
        });

        ide.addEventListener("afteronline", function(e){
            tabEditors.$setStyleClass(tabEditors.$ext, "", ["offline"]);
        });

        var vbox  = colMiddle;
        this.hbox = vbox.appendChild(new apf.hbox({flex : 1, padding : 5, splitters : true}));

        this.$itmGroup = new apf.group();

        this.nodes.push(this.addTabSection());

        this.panel = this.hbox;

        /**** Support for state preservation ****/

        this.$settings = {};
        ide.addEventListener("settings.load", function(e){
            settings.setDefaults("auto/files", [])
            settings.setDefaults("auto/tabs", [["show", "true"]]);

            _self.loadedSettings = false;

            var showTab = settings.model.queryValue("auto/tabs/@show");
            _self.showTabs = apf.isTrue(showTab);
            if (!_self.showTabs)
                _self.toggleTabs(_self.showTabs ? 1 : -1, true, true);;

            function checkExpand(path, doc) {
                ide.addEventListener("init.ext/tree/tree", function(){
                    var parent_path = apf.getDirname(path).replace(/\/$/, "");
                    var expandEventListener = function(e) {
                        if (e.xmlNode && e.xmlNode.getAttribute("path") == parent_path) {
                            // if the file has been loaded from the tree
                            if (doc.getNode().getAttribute("newfile") != 1) {
                                // databind the node from the tree to the document
                                doc.setNode(e.xmlNode.selectSingleNode("node()[@path='" + path + "']"));
                            }
                            else {
                                // if not? then keep it this way, but invoke setNode() anyway because
                                // it triggers events
                                doc.setNode(doc.getNode());
                            }
                            trFiles.removeEventListener("expand", expandEventListener);
                        }
                    };

                    trFiles.addEventListener("expand", expandEventListener);
                });
            }

            var model = e.model;
            ide.addEventListener("extload", function(){
                // you can load a file from the hash tag, if that succeeded then return
                var loadFileFromHash =  (_self.loadFileFromHash(window.location.hash, checkExpand));
                if (loadFileFromHash) {
                    window.location.hash = loadFileFromHash; // update hash
                    return;
                }

                // otherwise, restore state from the .config file
                var active = model.queryValue("auto/files/@active");
                var nodes  = model.queryNodes("auto/files/file");

                for (var i = 0, l = nodes.length; i < l; i++) {
                    var node  = nodes[i];
                    var state = node.getAttribute("state");
                    var doc   = ide.createDocument(node);

                    // for some reason c9local can aggresively cache open files; this prevents
                    // open files from one workspace appearing in another
                    if (ide.local) {
                        if (node.getAttribute("path").split("/")[2] !== ide.workspaceId)
                            continue;
                    }
                    
                    try {
                        if (state)
                            doc.state = JSON.parse(state);
                    }
                    catch (ex) {}

                    // node.firstChild is not always present (why?)
                    if ((node.getAttribute("changed") == 1) && node.firstChild) {
                        doc.cachedValue = node.firstChild.nodeValue
                            .replace(/\n]\n]/g, "]]")
                            .replace(/\\r/g, "\r")
                            .replace(/\\n/g, "\n");
                    }

                    ide.dispatchEvent("openfile", {
                        doc      : doc,
                        init     : true,
                        forceOpen: true,
                        active   : active
                            ? active == node.getAttribute("path")
                            : i == l - 1
                    });

                    checkExpand(node.getAttribute("path"), doc);
                }

                _self.loadedSettings = true;
            });
        });

        ide.addEventListener("settings.save", function(e){
            if (!e.model.data || !_self.loadedSettings)
                return;

            var pNode   = e.model.data.selectSingleNode("auto/files");
            var pages   = tabEditors.getPages();

            if (pNode) {
                pNode.parentNode.removeChild(pNode);
                pNode = null;
            }

            if (pages.length) {
                var active = tabEditors.activepage;
                e.model.setQueryValue("auto/files/@active", active);

                pNode = apf.createNodeFromXpath(e.model.data, "auto/files");
                for (var i = 0, l = pages.length; i < l; i++) {
                    if (!pages[i] || !pages[i].$model)
                        continue;

                    var file = pages[i].$model.data;
                    if (!file || file.getAttribute("debug"))
                        continue;

                    var copy = apf.xmldb.cleanNode(file.cloneNode(false));
                    if (!copy.getAttribute("newfile"))
                        copy.removeAttribute("changed");
                    copy.removeAttribute("loading");
                    copy.removeAttribute("saving");
                    pNode.appendChild(copy);

                    var state = pages[i].$editor.getState && pages[i].$editor.getState(pages[i].$doc);
                    if (state)
                        copy.setAttribute("state", JSON.stringify(state));

                    //@todo the second part of this if can be removed as soon
                    //as the collab team implements stored changed settings
                    //please note that for this to work on loadsettings we
                    //should check whether the file on disk has changed and
                    //popup a file watch dialog to ask if the user wants to
                    //load the new file from disk, losing changes.
                    if (copy.getAttribute("changed") == 1 && copy.getAttribute("newfile") == 1) {
                        copy.appendChild(copy.ownerDocument.createCDATASection(
                            (pages[i].$doc.getValue() || "")
                                .replace(/\r/g, "\\r")
                                .replace(/\n/g, "\\n")
                                .replace(/\]\]/g, "\n]\n]")
                        ));
                    }
                }
            }
        });
    },

    /** Load any file from the hash, with optional some lines selected
     *
     * @param {string} hash Hash as obtained from the window element
     * @param {function} checkExpand Function that expands the tree for the given file
     * @return {string} The new hash
     */
    loadFileFromHash : function (hash, checkExpand) {
        // an initial state can be sent in the hash
        // match 'openfile-',
        // match any character except :& or end of file
        // optional: match : digit - digit
        // [1] is filename, [2] is starting line number, [3] is ending line number
        var editorInitialStatePattern = /openfile-(.[^:&$]*)(?:\:(\d+)-(\d+))?/;
        var rawState = hash.match(editorInitialStatePattern);

        if (rawState) {
            // build the real path, as the one in the hash is relative
            var path = ide.davPrefix.replace(/\/$/, "") + "/" + rawState[1];
            var doc = ide.createDocument(fs.createFileNodeFromPath(path));

            // if selection information was added, add that to the state
            if (rawState[2] && rawState[3]) {
                doc.state = {
                    scrollleft: 0, scrolltop: 0,
                    selection: {
                        start: { row: parseInt(rawState[2] || 0, 10) - 1, column: 0 },
                        end: { row: parseInt(rawState[3] || 0, 10), column: 0 } // plus 1 to capture whole previous line
                    }
                };
            }

            // send it to the dispatcher
            ide.dispatchEvent("openfile", {
                doc: doc,
                active: true
            });
            // and expand the tree
            checkExpand(path, doc);

            // return the new hash
            return hash.replace(editorInitialStatePattern, "");
        }

        return null;
    },

    pauseTabResize : function(){
        return;
        tabEditors.setAttribute("buttons", "close,order");
    },

    continueTabResize : function(){
        return;
        setTimeout(function(){
            tabEditors.setAttribute("buttons", "close,scale,order");
            tabEditors.$waitForMouseOut = false;
            tabEditors.$scaleinit(null, "sync");
        }, 300);
    },

    showFile : function(path, row, column, text) {
        var node = fs.createFileNodeFromPath(path);

        this.jump(node, row, column, text);
    },

    jump : function(fileEl, row, column, text, doc, page) {
        var path    = fileEl.getAttribute("path");
        var tabs    = tabEditors;
        var hasData = page && (tabs.getPage(path) || { }).$doc ? true : false;
        var _self   = this;

        if (row !== undefined) {
            var jumpTo = function(){
                var f;
                setTimeout(f = function() {
                    // TODO move this to the editor
                    var editor = _self.currentEditor.amlEditor;
                    editor.$editor.gotoLine(row, column, false);
                    if (text)
                        editor.$editor.find(text, null, false);
                    editor.focus();
                }, 100);
            };

            if (hasData) {
                tabs.set(path);
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

        if (!hasData)
            ide.dispatchEvent("openfile", {
                doc: doc || ide.createDocument(fileEl)
            });
        else
            tabs.set(path);
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
        menus.remove("View/Tab Bar");
        menus.remove("View/Editors/");

        this.hbox.destroy(true, true);
        //this.splitter.destroy(true, true);
    }
});

});
