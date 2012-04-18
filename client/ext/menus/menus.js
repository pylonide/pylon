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
var commands = require("ext/commands/commands");

module.exports = ext.register("ext/menus/menus", {
    name    : "Menus",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],
    items   : {},
    menus   : {},
    count   : 0,
    debug   : location.href.indexOf('menus=1') > -1,

    init : function(){
        this.nodes.push(
            this.menubar = logobar.firstChild.insertBefore(new apf.hbox({
                edge    : "8 5 0 5",
                padding : "3",
                align   : "center"
            }), logobar.firstChild.firstChild),
            
            //this.setRootMenu("Project", 10),
            this.setRootMenu("File", 100),
            this.setRootMenu("Edit", 200),
            this.setRootMenu("Selection", 300),
            this.setRootMenu("Find", 400),
            this.setRootMenu("View", 500),
            this.setRootMenu("Goto", 600),
            this.setRootMenu("Tools", 700)
        );
        
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
            this.setAttribute("hotkey", 
                value && "{ide.commandManager." + value + "}" || "");
            
            this.onclick = value && function(){
                commands.exec(value);
            } || null;
        }
    },
    
    $insertByIndex : function(parent, item, index) {
        item.$position = index;
        
        var beforeNode, diff = 1000000, nodes = parent.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            var d = nodes[i].$position - index;
            if (d > 0 && d < diff) {
                beforeNode = nodes[i];
                diff = d;
            }
        }
        
        return parent.insertBefore(item, beforeNode);
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
                    id : "mnuMenus" + ++this.count
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
                    margin  : "1 0 0 0",
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
                    id : "mnuMenus" + ++this.count
                });
            }
        }
        
        if (item) {
            item.setAttribute("submenu", menu.id);
            item.setAttribute("caption", 
                (this.debug ? "[" + index + "]" : "") + name.split("/").pop());
            items[name] = item;
        }
        else {
            item = items[name];
            if (!item) {
                item = items[name] = new apf.item({
                    submenu : menu.id,
                    caption : (this.debug ? "\\[" + index + "\\] " : "") 
                                + name.split("/").pop()
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
                    (this.debug ? "\\[" + index + "\\] " : "") + itemName);
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
        return menu.id;
    },
    
    /**
     * - Bug in APF, appendChild children while not parent attached dont render
     * - mnuXXX throughout C9 need to be using this plugin
     * - Architect submenus used in multiple location
     */

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
    }
});

});
