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

module.exports = ext.register("ext/menus/menus", {
    name    : "Menus",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,
    nodes   : [],
    items   : {},
    menus   : {},
    count   : 0,

    init : function(){
        this.nodes.push(
            this.menubar = logobar.firstChild.insertBefore(new apf.hbox({
                edge    : "8 5 0 5",
                padding : "3",
                align   : "center"
            }), logobar.firstChild.firstChild)
        );
    },
    
    setRootMenu : function(name, index){
        var items = this.items, menu, menus = this.menus;
        
        menu = menus[name];
        if (!menu)
            menus[name] = new apf.menu({
                id : "mnuMenus" + ++this.count
            });
        
        item = items[name];
        if (!item) {
            items[name] = new apf.button({
                skin    : "c9-menu-btn",
                submenu : "mnuMenus" + this.count,
                margin  : "1 0 0 0",
                caption : name,
                onmousedown : function(){
                    if (!menu.parentNode)
                        apf.document.documentElement.appendChild(menu);
                }
            });
        }
        
        if (typeof index == "number") {
            //this.menubar.appendChild(
        }
        
        return menu;
    },
    
    setSubMenu : function(parent, name, index){
        var items = this.items, menu, menus = this.menus;
        
        menu = menus[name];
        if (!menu)
            menus[name] = new apf.menu({
                id : "mnuMenus" + ++this.count
            });
        
        item = items[name];
        if (!item) {
            items[name] = new apf.item({
                submenu : "mnuMenus" + this.count,
                caption : name.split("/").pop(),
                onmousedown : function(){
                    if (!menu.parentNode)
                        apf.document.documentElement.appendChild(menu);
                }
            });
        }
        
        if (typeof index == "number") {
            //parent.appendChild(
        }
        
        return menu;
    },
    
    setMenuItem : function(parent, name, menuItem, index){
        var items = this.items, menu, menus = this.menus;
        
        item = items[name];
        if (!item) {
            items[name] = menuItem;
            item.setAttribute("caption", name.split("/").pop());
        }
        
        //index...
        //parent.appendChild(
    },
    
    addItemByPath : function(path, menuItem, index, menu){
        var steps = path.split("/"), name, item, p = [];
        var items = this.items, menus = this.menus;
        for (var i = 0, l = steps; i < l; i++) {
            name = steps[i];
            p.push(name);
            
            //Menubar button & menu
            if (i == 0 && !menu) {
                menu = this.setRootMenu(name, i == l - 1 ? index : null)
            }
            //Submenu item & menu
            else if (i != l - 1) {
                menu = this.setSubMenu(menu, p.join("/"), i == l - 1 ? index : null);
            }
            //Leaf
            else {
                this.setMenuItem(menu, p.join("/"), menuItem, index);
            }
        }
        
        return menuItem || menu;
    },
    
    addItemToMenu : function(menu, menuItem, index){
        
    },
    
    enableItem : function(path){
        
    },
    
    disableItem : function(path){
        
    },
    
    remove : function(path) {
        //menus.remove("Tools/Beautify Selection");
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
