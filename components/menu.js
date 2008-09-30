/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */
// #ifdef __JMENU || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component displaying a skinnable menu of items which can be choosen.
 * Based on the context of the menu items can be shown and hidden.
 * 
 *
 * @classDescription        This class creates a new menu
 * @return {Menu} Returns a new menu
 * @type {Menu}
 * @constructor
 * @allowchild item, divider, {smartbinding}
 * @addnode components:menu
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits jpf.Presentation
 */
jpf.menu = jpf.component(jpf.NODE_VISIBLE, function(){ 
    this.$focussable  = jpf.KEYBOARD; 
    this.$positioning = "basic"

    this.nodes  = [];
    this.xpaths = [];
    this.groups = {};
    
    /**** Properties and Attributes ****/
    
    this.$propHandlers["visible"] = function(value, nofocus, hideOpener){
        if (value) {
            this.oExt.style.display = "block";
        }
        else {
            this.oExt.style.display = "none";
            
            if (lastFocus) {
                if (!nofocus) 
                    lastFocus.focus();
                else 
                    lastFocus.$blur();
            }
            
            if (this.showingSubMenu) {
                self[this.showingSubMenu].oExt.style.display = "none";
                this.showingSubMenu = null;
            }
            
            jpf.currentMenu = null;
            
            if (hideOpener && this.opener) 
                this.opener.hideMenu(true);
        }
    };
    
    /**** Public Methods ****/

    var lastFocus;

    this.display = function(x, y, noanim, opener, xmlNode){
        this.opener = opener;
        this.dispatchEvent("display");
        
        //Show / hide Child Nodes Based on XML
        var c = 0, last, d = 0, i, node, nodes = this.childNodes;
        var l = nodes.length
        for (i = 0; i < l; i++) {
            node = nodes[i];
            
            if (!node.select || !xmlNode 
              || xmlNode.selectSingleNode("self::" + node.select)) {
                node.show();
            }
            else {
                node.hide();
                
                if ((!node.nextSibling || node.nextSibling.tagName == "divider") 
                  && (!node.previousSibling 
                  || node.previousSibling.tagName == "divider")) {
                    (node.nextSibling || node.previousSibling).hide();
                }
            }
        }
        
        this.visible = false;
        this.show();
        jpf.popup.show(this.uniqueId, x, y, 
            noanim ? false : "fade", document.documentElement);

        lastFocus = jpf.window.focussed;
        this.focus();
        if (lastFocus) 
            lastFocus.$focus();
        
        this.xmlReference = xmlNode;
        
        jpf.currentMenu = this; //@todo still needed?
    };
    
    this.getValue = function(group){
        return this.getSelected(group).value || "";
    };
    
    this.getSelected = function(group){
        var nodes = this.childNodes;
        var i, l = nodes.length;
        for (i = 0; i < l; i++) {
            if (nodes[i].group != group)
                continue;
            
            if (nodes[i].selected)
                return nodes[i];
        }
        
        return false;
    }
    
    this.select = function(group, value){
        var nodes = this.childNodes;
        var i, l = nodes.length;
        for (i = 0; i < l; i++) {
            if (nodes[i].group != group)
                continue;
            
            if (nodes[i].value == value || !nodes[i].value && nodes[i].caption == value)
                nodes[i].$handlePropSet("selected", true);
            else if (nodes[i].selected)
                nodes[i].$handlePropSet("selected", false);
        }
    };
    
    /**** Events ****/
    
    // #ifdef __WITH_KBSUPPORT
    //@todo implement this
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        
        switch (key) {
            case 13:
                break;
            case 37:
                //LEFT
            case 38:
                //UP
                break;
            case 39:
                //RIGHT
            case 40:
                //DOWN
                break;
            default:
                return;
        }
        
        return false;
    });
    // #endif
    
    //Hide menu when it looses focus
    this.addEventListener("blur", function(){
        this.$propHandlers["visible"].call(this, false, null, true);
    });
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        jpf.popup.setContent(this.uniqueId, this.oExt, "", null, null);
    };
    
    this.$loadJml = function(x){
        var i, oInt = this.$getLayoutNode("main", "container", this.oExt);
        
        //Skin changing support
        if (this.oInt) {
            this.oInt = oInt;
            
            var node, nodes = this.childNodes;
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];
                node.loadJml(node.jml);
            }
        }
        else {
            this.oInt = oInt;
    
            //Let's not parse our children, when we've already have them
            if (this.childNodes.length) 
                return;

            //Build children
            var node, nodes = this.jml.childNodes;
            var l = nodes.length;
            for (i = 0; i < l; i++) {
                node = nodes[i];
                if (node.nodeType != 1) continue;
    
                var tagName = node[jpf.TAGNAME];
                if ("item|radio|check".indexOf(tagName) > -1) {
                    new jpf.item(oInt, tagName).loadJml(node, this);
                }
                else if (tagName == "divider") {
                    new jpf.divider(oInt, tagName).loadJml(node, this);
                }
                //#ifdef __DEBUG
                else {
                    throw new Error(jpf.formatErrorString(0, this, 
                        "Parsing children of menu component",
                        "Unknown component found as child of tab", node));
                }
                //#endif
            }
        }
    };
    
    this.$destroy = function(){
        jpf.popup.removeContent(this.uniqueId);
    }
}).implement(jpf.Presentation);

jpf.radio =
jpf.check =
jpf.item  = jpf.subnode(jpf.NODE_HIDDEN, function(){
    this.$focussable = false; 

    /**** Properties and Attributes ****/
    
    this.$supportedProperties = ["submenu", "value", "select", "group", "icon",
                                 "checked", "selected", "disabled", "caption"];
    //@todo events
    
    this.$handlePropSet = function(prop, value, force){
        this[prop] = value;
        
        switch(prop){
            case "submenu":
                jpf.setStyleClass(this.oExt, "submenu");
                break;
            case "value":
                break;
            case "select":
                break;
            case "group":
                break;
            case "icon":
                break;
            case "caption":
                jpf.xmldb.setNodeValue(
                    this.parentNode.$getLayoutNode("item", "caption", this.oExt),
                    value);
                break;
            case "checked":
                if (this.tagName != "check")
                    return;
                
                if (jpf.isTrue(value))
                    jpf.setStyleClass(this.oExt, "checked");
                else
                    jpf.setStyleClass(this.oExt, "", ["checked"]);
                break;
            case "selected":
                if (this.tagName != "radio")
                    return;
                
                if (jpf.isTrue(value))
                    jpf.setStyleClass(this.oExt, "selected");
                else
                    jpf.setStyleClass(this.oExt, "", ["selected"]);
                break;
            case "disabled":
                if (jpf.isTrue(value))
                    jpf.setStyleClass(this.oExt, "disabled");
                else
                    jpf.setStyleClass(this.oExt, "", ["disabled"]);
                break;
        }
    }
    
    /**** Dom Hooks ****/
    
    this.$domHandlers["reparent"].push(function(beforeNode, pNode, withinParent){
        if (!this.$jmlLoaded)
            return;
        
        if (!withinParent && this.skinName != pNode.skinName) {
            //@todo for now, assuming dom garbage collection doesn't leak
            this.loadJml();
        }
    });
    
    /**** Public Methods ****/
    
    this.enabled = function(list){
        jpf.setStyleClass(this.oExt, 
            this.parentNode.baseCSSname + "Disabled");
    };
    
    this.disable = function(list){
        jpf.setStyleClass(this.oExt, null, 
            [this.parentNode.baseCSSname + "Disabled"]);
    };
    
    this.show = function(){
        this.oExt.style.display = "block";
    }
    
    this.hide = function(){
        this.oExt.style.display = "none";
    }
    
    /**** Events ****/
    
    this.$down = function(){
        if (this.tagName == "radio") 
            this.parentNode.select(this.group, this.value || this.caption);

        else if (this.tagName == "check") 
            this.$handlePropSet("checked", !this.checked);
    }

    this.$up = function(){
        this.parentNode.hide();//true not focus?/
        this.parentNode.dispatchEvent("itemclick", {
            value : this.value || this.caption
        });
        
        //@todo Anim effect here?
    }
    
    this.$click = function(){
        this.dispatchEvent("click", {
            xmlContext : this.parentNode.xmlReference
        });
    }
    
    this.$submenu = function(hide){
        if (!this.submenu)
            return;
        
        var menu = self[this.submenu];
        if (!menu) {
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, this,
                "Displaying submenu",
                "Could not find submenu '" + submenu + "'", this.jml));
            //#endif
            
            return;
        }
        
        if (!hide) {
            if (this.parentNode.showingSubMenu == submenu) 
                return;
        
            var pos = jpf.getAbsolutePosition(this.oExt);
            menu.display(pos[0] + this.oExt.offsetWidth, pos[1], 
                false, this.parentNode);
            
            this.parentNode.showingSubMenu = submenu;
        }
        else {
            menu.setProperty("visible", false);
        }
    }
    
    /**** Init ****/
    
    this.$draw = function(isSkinSwitch){
        var p = this.parentNode;
        
        p.$getNewContext("item");
        var elItem = p.$getLayoutNode("item");
        
        var o = 'jpf.lookup(' + this.uniqueId + ')';
        elItem.setAttribute("onmouseup", o + '.$up(event)');
        elItem.setAttribute("onmouseover", 
            "jpf.setStyleClass(this, 'hover');" + o + ".$submenu()");
        elItem.setAttribute("onmouseout", 
            "if (jpf.xmldb.isChildOf(this, event.toElement \
                ? event.toElement \
                : event.explicitOriginalTarget)) \
                    return;\
            jpf.setStyleClass(this, '', ['hover']);" + o + ".$submenu(true)");
        elItem.setAttribute("onmousedown", o + '.$down()');
        elItem.setAttribute("onclick", o + '.$click()');
        
        jpf.setStyleClass(elItem, this.tagName);
        
        this.oExt = jpf.xmldb.htmlImport(elItem, this.parentNode.oInt);
        
        if (!isSkinSwitch && this.nextSibling && this.nextSibling.oExt)
            this.oExt.parentNode.insertBefore(this.oExt, this.nextSibling.oExt);
    }
    
    this.loadJml = function(x, parentNode) {
        if (parentNode)
            this.$setParent(parentNode);

        this.skinName    = this.parentNode.skinName;
        var isSkinSwitch = this.oExt ? true : false;

        this.$draw(isSkinSwitch);
        
        if (isSkinSwitch) {
            if (typeof this.checked !== "undefined")
                this.$handlePropSet("checked", this.checked);
            else if (typeof this.selected !== "undefined")
                this.$handlePropSet("selected", this.selected);
            
            if (this.disabled)
                this.$handlePropSet("disabled", this.disabled);
            
            if (this.caption)
                this.$handlePropSet("caption", this.caption);
        }
        else {
            var attr = x.attributes;
            for (var a, i = 0; i < attr.length; i++) {
                a = attr[i];
                this.$handlePropSet(a.nodeName, a.nodeValue);
            }
    
            var onclick = x.getAttribute("onclick");
            if (onclick) {
                this.addEventListener("click", new Function(onclick));
                delete this.onclick
            }
            
            if (this.caption === undefined && x.firstChild) {
                this.caption = x.firstChild.nodeValue;
                this.$handlePropSet("caption", this.caption);
            }
        }
    }
});

jpf.currentMenu = null;
/*jpf.addEventListener("hotkey", function(e){
    if (jpf.currentMenu && e.keyCode == "27") 
        jpf.currentMenu.hideMenu(true);
}).implement();*/
// #endif
