/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var settings = require("core/settings");
var commands = require("ext/commands/commands");
var main = require("ext/main/main");
var anims = require("ext/anims/anims");

module.exports = ext.register("ext/menus/menus", {
    name    : "Menus",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    deps    : [ main ],
    nodes   : [],
    items   : {},
    menus   : {},
    count   : 0,
    debug   : location.href.indexOf('menus=1') > -1,
    minimized : false,

    init : function(){
        var _self = this;

        this.nodes.push(
            this.menubar = logobar.insertBefore(new apf.bar({
                "class" : "fakehbox aligncenter",
                style : "padding : 0 5px 0 5px;position:static",
            }), logobar.firstChild),

//            this.setRootMenu("Workspace", 10),
            this.setRootMenu("File", 100),
            this.setRootMenu("Edit", 200),
            this.setRootMenu("Selection", 300),
            this.setRootMenu("Find", 400),
            this.setRootMenu("View", 500),
            this.setRootMenu("Goto", 600),
            this.setRootMenu("Tools", 700)
        );

        var timer;
        this.menubar.insertBefore(new apf.button({
            "class" : "c9-mbar-minimize",
            "skin" : "c9-simple-btn",
            "onclick" : function(e){
                if (!_self.minimized)
                    _self.minimize();
                else
                    _self.restore();
            }
        }), this.menubar.firstChild);

        logobar.$ext.addEventListener("mousedown", function(){
            _self.restore();
        });

        var logoCorner = document.querySelector(".c9-mbar-round");

        logobar.$ext.addEventListener("mouseover",function(e){
            if (!_self.minimized || !ide.inited
              || apf.isChildOf(logobar.$ext, e.fromElement, true)
              || apf.isChildOf(logoCorner, e.toElement, true))
                return;

            clearTimeout(timer);
            timer = setTimeout(function(){
                _self.restore(true);
            }, 500);
        });
        logobar.$ext.addEventListener("mouseout",function(e){
            if (!_self.minimized || !ide.inited
              || apf.isChildOf(logobar.$ext, e.toElement, true))
                return;

            clearTimeout(timer);
            if (apf.popup.isShowing(apf.popup.last)) {
                timer = setTimeout(function(){
                    if (apf.popup.isShowing(apf.popup.last))
                        timer = setTimeout(arguments.callee, 500);
                    else
                        _self.minimize(true);
                }, 500);
            }
            else {
                timer = setTimeout(function(){
                    _self.minimize(true);
                }, 500);
            }
        });

        ide.addEventListener("settings.load", function(e){
            e.ext.setDefaults("auto/menus", [["minimized", "false"]]);

            if (apf.isTrue(e.model.queryValue("auto/menus/@minimized"))) {
                _self.minimize(true, true);
                _self.minimized = true;
            }
        });

        this.addItemByPath("File/~", new apf.divider(), 1000000);
        this.addItemByPath("File/Quit Cloud9 IDE", new apf.item({
            onclick : function(){
                location.href = "http://c9.io";
            }
        }), 2000000);

        this.addItemByPath("View/~", new apf.divider(), 9999);

        apf.button.prototype.$propHandlers["hotkey"] = function(value){
            if (this.$hotkey)
                apf.setNodeValue(this.$hotkey, apf.isMac
                      ? apf.hotkeys.toMacNotation(this.hotkey) : this.hotkey);

            if (this.tooltip)
                apf.GuiElement.propHandlers.tooltip.call(this, this.tooltip);
        }

        apf.item.prototype.$propHandlers["hotkey"] = function(value){
            if (!this.$amlLoaded) {
                var _self = this;
                this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
                    if (_self.$hotkey && _self.hotkey)
                        apf.setNodeValue(this.$hotkey, apf.isMac
                          ? apf.hotkeys.toMacNotation(this.hotkey) : this.hotkey);
                });
            }
            else if (this.$hotkey)
                apf.setNodeValue(this.$hotkey,
                    apf.isMac ? apf.hotkeys.toMacNotation(value) : value);
        }

        apf.splitbutton.prototype.$propHandlers["command"] =
        apf.button.prototype.$propHandlers["command"] =
        apf.item.prototype.$propHandlers["command"] = function(value){
            if (!value) {
                this.removeAttribute("hotkey");
                this.onclick = null;
                return;
            }

            this.setAttribute("hotkey",
                value && "{ide.commandManager." + value + "}" || "");

            this.onclick = function(){
                commands.exec(value, null, {source: "click"});
                var command = commands.commands[value];
                if (command && command.focusContext)
                    self["req"+"uire"]("ext/editors/editors").currentEditor.focus();
            } || null;
        }

        //update c9 main logo link
        if(window.cloud9config.hosted) {
            var mainlogo = logobar.$ext.getElementsByClassName('mainlogo');
            if(mainlogo && (mainlogo = mainlogo[0])) {
                mainlogo.title = "back to dashboard";
                mainlogo.href = "/dashboard.html";
                mainlogo.innerHTML = "Dashboard";
            }
        }
    },

    $insertByIndex : function(parent, item, index) {
        item.$position = index;

        var beforeNode, diff = 100000000, nodes = parent.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            var d = nodes[i].$position - index;
            if (d > 0 && d < diff) {
                beforeNode = nodes[i];
                diff = d;
            }
        }

        return parent.insertBefore(item, beforeNode);
    },

    $checkItems : function(e){
        if (e.value) {
            var page = self.tabEditors && tabEditors.$activepage;
            var editor = page && page.$editor;

            var nodes = this.childNodes;
            for (var a, cmd, n, i = nodes.length - 1; i >= 0; i--) {
                if (a = ((cmd = (n = nodes[i]).command)
                  && commands.commands[cmd].isAvailable) || n.isAvailable)
                    n[a(editor) ? "enable" : "disable"]();
            }
        }
    },

    setRootMenu : function(name, index, item, menu){
        var items = this.items, menus = this.menus;

       if (menu) {
            if (!menu.id)
                menu.setAttribute("id", "mnuMenus" + ++this.count);
            menus[name] = menu;
        }
        else {
            menu = menus[name];
            if (!menu) {
                menu = menus[name] = new apf.menu({
                    id : "mnuMenus" + ++this.count,
                    "onprop.visible" : this.$checkItems
                });
            }
        }

        if (item) {
            item.setAttribute("submenu", menu.id || "mnuMenus" + this.count);
            items[name] = item;
        }
        else {
            item = items[name];
            if (!item) {
                item = items[name] = new apf.button({
                    skin    : "c9-menu-btn",
                    submenu : menu.id,
                    margin  : "0 0 0 0",
                    caption : (this.debug ? "\\[" + index + "\\] " : "") + name
                });
            }
        }

        if (typeof index == "number")
            this.$insertByIndex(this.menubar, item, index);

        return menu;
    },

    setSubMenu : function(parent, name, index, item, menu){
        var items = this.items, menu, menus = this.menus, item;

        if (menu) {
            //Switch old menu for new menu
            if (menus[name]) {
                var nodes = menus[name].childNodes;
                for (var i = 0, l = nodes.length; i < l; i++) {
                    this.$insertByIndex(menu, nodes[i], nodes[i].$position);
                }

                menus[name].destroy(true, true);
            }

            if (!menu.id)
                menu.setAttribute("id", "mnuMenus" + ++this.count);
            menus[name] = menu;
        }
        else {
            menu = menus[name];
            if (!menu) {
                menu = menus[name] = new apf.menu({
                    id : "mnuMenus" + ++this.count,
                    "onprop.visible" : this.$checkItems
                });
            }
        }

        if (item) {
            item.setAttribute("submenu", menu.id);
            item.setAttribute("caption",
                apf.escapeXML((this.debug ? "[" + index + "]" : "") + name.split("/").pop()));
            items[name] = item;
        }
        else {
            item = items[name];
            if (!item) {
                item = items[name] = new apf.item({
                    submenu : menu.id,
                    caption : (this.debug ? "\\[" + index + "\\] " : "") +
                        name.split("/").pop()
                });
            }
            else {
                item.setAttribute("submenu", menu.id);
            }
        }

        if (typeof index == "number")
            this.$insertByIndex(parent, item, index);

        return menu;
    },

    setMenuItem : function(parent, name, menuItem, index, item){
        var items = this.items;
        var itemName = name.split("/").pop();
        if (itemName == "~")
            name += index;

        item = items[name];
        if (!item) {
            item = items[name] = menuItem;

            if (itemName != "~")
                item.setAttribute("caption",
                    apf.escapeXML((this.debug ? "\\[" + index + "\\] " : "") + itemName));
        }

        //index...
        if (typeof index == "number")
            this.$insertByIndex(parent, item, index);
        else
            parent.appendChild(item);
    },

    addItemByPath : function(path, menuItem, index, menu){
        var steps = path.split("/"), name, p = [], isLast, menus = this.menus;
        var curpath;

        if (!menuItem)
            menuItem = "";

        for (var i = 0, l = steps.length; i < l; i++) {
            name = steps[i];
            p.push(name);
            curpath = p.join("/");

            //Menubar button & menu
            if (i == 0 && !menu) {
                isLast = !steps[i + 1];
                menu = !isLast && menus[curpath]
                  || this.setRootMenu(name, i == l - 1  || isLast ? index : null,
                    isLast && (!menuItem.nodeFunc && menuItem.item || menuItem.localName == "button" && menuItem),
                    isLast && (!menuItem.nodeFunc && menuItem.menu || menuItem.localName == "menu" && menuItem));
            }
            //Submenu item & menu
            else if (i != l - 1 || !menuItem.nodeFunc) {
                isLast = !steps[i + 1];
                menu = !isLast && menus[curpath]
                  || this.setSubMenu(menu, curpath, i == l - 1 || isLast ? index : null,
                    isLast && (!menuItem.nodeFunc ? menuItem.item : menuItem.localName != "menu" && menuItem),
                    isLast && (!menuItem.nodeFunc && menuItem.menu || menuItem.localName == "menu" && menuItem));
            }
            //Leaf
            else {
                this.setMenuItem(menu, p.join("/"), menuItem, index);
            }

            if (isLast) break;
        }

        return menuItem || menu;
    },

    addItemToMenu : function(menu, menuItem, index){
        this.$insertByIndex(menu, menuItem, index);
    },

    enableItem : function(path){

    },

    disableItem : function(path){

    },

    remove : function(path) {
        //menus.remove("Tools/Beautify Selection");
    },

    getMenuId : function(path){
        var menu = this.menus[path];
        return menu && menu.id;
    },

    restore : function(preview){
        apf.setStyleClass(logobar.$ext, "", ["minimized"]);

        logobar.$ext.style.overflow = "hidden";

        anims.animateSplitBoxNode(logobar, {
            height: "31px",
            timingFunction: "cubic-bezier(.10, .10, .25, .90)",
            duration: 0.2
        }, function(){
            apf.layout.forceResize(tabEditors.$ext);
            logobar.$ext.style.overflow = "";
        });

        if (!preview) {
            settings.model.setQueryValue("auto/menus/@minimized", "false");
            this.minimized = false;

            ide.dispatchEvent("menus.restore");
        }
    },

    minimize : function(preview, noAnim){
        logobar.$ext.style.overflow = "hidden";

        anims.animateSplitBoxNode(logobar, {
            height: "12px",
            timingFunction: "cubic-bezier(.10, .10, .25, .90)",
            duration: 0.2,
            immediate: noAnim
        }, function(){
            apf.setStyleClass(logobar.$ext, "minimized");
            apf.layout.forceResize();
            logobar.$ext.style.overflow = "";
        });

        if (!preview) {
            settings.model.setQueryValue("auto/menus/@minimized", "true");
            this.minimized = true;

            ide.dispatchEvent("menus.minimize");
        }
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
        this.$destroy();
        //this.splitter.destroy(true, true);
    }
});

});
