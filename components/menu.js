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
    var _self         = this;
    var blurring      = false;
    
    /**** Properties and Attributes ****/
    
    this.zindex = 10000000;
    
    this.$propHandlers["visible"] = function(value, nofocus, hideOpener){
        if (value) {
            this.oExt.style.display = "block";
        }
        else {
            this.oExt.style.display = "none";

            //Ah oui, c'est tres difficile

            var lastFocus = jpf.menu.lastFocus;
            
            //@todo test this with a list being the opener of the menu
            if (lastFocus != this.opener && this.opener && this.opener.$blur)
                this.opener.$blur();
            
            if (this.opener && this.opener.parentNode.tagName == "menu") {
                if (!this.$hideTree)
                    this.$hideTree = -1
                this.opener.parentNode.focus();
            }
            
            else if (lastFocus) {
                //We're being hidden because some other object gets focus
                if (jpf.window.$settingFocus) {
                    if (jpf.window.$settingFocus != lastFocus && lastFocus.$blur)
                        lastFocus.$blur();
                    this.$blur();
                    
                    if (jpf.window.$settingFocus.tagName != "menu") //not menu walking
                        jpf.menu.lastFocus = null;
                }
                //We're being hidden because window looses focus 
                else if (!jpf.window.hasFocus()) {
                    if (lastFocus.$blur)
                        lastFocus.$blur();
                    this.$blur();
                    
                    jpf.window.focussed = lastFocus;
                    if (lastFocus.$focusParent)
                        lastFocus.$focusParent.$lastFocussed = lastFocus;
                    
                    jpf.menu.lastFocus = null;
                }
                //We're just being hidden
                else if (this.$hideTree) {
                    if (!this.$hideTree)
                        this.$hideTree = -1

                    var visTest = (lastFocus.disabled || !lastFocus.visible) 
                        && lastFocus != jpf.document.documentElement;
                      
                    if (nofocus || visTest) {
                        if (lastFocus.$blur)
                            lastFocus.$blur();
                        this.$blur();
                        jpf.window.focussed = null;
                        
                        if (visTest && jpf.window.moveNext() === false)
                            jpf.window.$focusRoot();
                    }
                    else {
                        lastFocus.focus(null, null, true);
                    }
                    
                    jpf.menu.lastFocus = null;
                }
            }
            
            if (this.$showingSubMenu) {
                this.$showingSubMenu.hide();
                this.$showingSubMenu = null;
            }
            
            if (this.opener && this.opener.$submenu) {
                this.opener.$submenu(true, true);
                
                //@todo problem with loosing focus when window looses focus
                if (this.$hideTree === true && this.opener.parentNode.tagName == "menu") {
                    this.opener.parentNode.$hideTree = true
                    this.opener.parentNode.hide();
                }
                
                this.opener = null;
            }
            this.$hideTree = null;
            
            if (this.$selected) {
                jpf.setStyleClass(this.$selected.oExt, "", ["hover"]);
                this.$selected = null;
            }
        }
    };
    
    /**** Public Methods ****/

    var lastFocus;

    this.display = function(x, y, noanim, opener, xmlNode, openMenuId, btnWidth){
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

        if (this.oOverlay) {
            if (btnWidth) {
                this.oOverlay.style.display = "block";
                this.oOverlay.style.width = btnWidth + "px";
            }
            else
                this.oOverlay.style.display = "none";
        }
        
        this.visible = false;
        this.show();
        jpf.popup.show(this.uniqueId, {
            x            : x,
            y            : y,
            animate      : noanim ? false : "fade",
            ref          : document.documentElement,
            allowTogether: openMenuId
        });

        var lastFocus      = 
        jpf.menu.lastFocus = opener && opener.$focussable === true
            ? opener
            : jpf.menu.lastFocus || jpf.window.focussed;
        this.focus();
        
        //Make the component that provides context appear to have focus

        if (lastFocus && lastFocus != this && lastFocus.$focus)
            lastFocus.$focus();
        
        this.xmlReference = xmlNode;
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
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        
        switch (key) {
            case 13:
                if (!this.$selected)
                    return;
                
                var node = this.$selected;
                node.$down();
                node.$up();
                node.$click();
                break;
            case 38:
                //UP
                var node = this.$selected && this.$selected.previousSibling 
                  || this.lastChild;
                
                if (node && node.tagName == "divider")
                    node = node.previousSibling;
                
                if (!node)
                    return;
                
                if (this.$selected)
                    jpf.setStyleClass(this.$selected.oExt, "", ["hover"]);
                    
                jpf.setStyleClass(node.oExt, "hover");
                this.$selected = node;
                break;
            case 40:
                //DOWN
                var node = this.$selected && this.$selected.nextSibling 
                  || this.firstChild;
                
                if (node && node.tagName == "divider")
                    node = node.nextSibling;
                
                if (!node)
                    return;
                
                if (this.$selected)
                    jpf.setStyleClass(this.$selected.oExt, "", ["hover"]);
                    
                jpf.setStyleClass(node.oExt, "hover");
                this.$selected = node;
                break;
            case 37:
                //LEFT
                //if (this.$selected && this.$selected.submenu)
                    //this.$selected.$submenu(true, true);
                
                if (!this.opener)
                    return;
                
                if (this.opener.tagName == "button") {
                    var node = this.opener.previousSibling;
                    while(node && !node.submenu) {
                        node = node.previousSibling;
                    }
                    
                    if (node) {
                        node.dispatchEvent("mouseover");
                        
                        var btnMenu = node.parentNode.menuIsPressed;
                        if (btnMenu) {
                            self[btnMenu.submenu].dispatchEvent("keydown", {
                                keyCode : 40
                            });
                        }
                    }
                }
                else if (this.opener.parentNode.tagName == "menu") {
                    //@todo Ahum bad abstraction boundary
                    var op = this.opener;
                    this.hide();
                    jpf.setStyleClass(op.oExt, "hover");
                    op.parentNode.$showingSubMenu = null;
                }
                
                break;
            case 39:
                //RIGHT
                if (this.$selected && this.$selected.submenu) {
                    this.$selected.$submenu(null, true);
                    this.$showingSubMenu.dispatchEvent("keydown", {
                       keyCode : 40 
                    });
                    
                    return;
                }
                
                if (this.opener) {
                    var op = this.opener;
                    while (op && op.parentNode && op.parentNode.tagName == "menu")
                        op = op.parentNode.opener;
                    
                    if (op && op.tagName == "button") {
                        var node = op.nextSibling;
                        while(node && !node.submenu) {
                            node = node.nextSibling;
                        }
                        
                        if (node) {
                            node.dispatchEvent("mouseover");
                            
                            var btnMenu = node.parentNode.menuIsPressed;
                            if (btnMenu) {
                                self[btnMenu.submenu].dispatchEvent("keydown", {
                                    keyCode : 40
                                });
                            }
                            
                            return;
                        }
                    }
                }
                
                if (!this.$selected) {
                    arguments.callee.call(this, {
                       keyCode : 40 
                    });
                }
                
                break;
            default:
                return;
        }
        
        return false;
    });
    // #endif
    
    //Hide menu when it looses focus or when the popup hides itself
    function forceHide(){
        if (this.$showingSubMenu)
            return;

        if (this.$hideTree != -1) {
            this.$hideTree = true;
            this.hide();
        }
        
        return false;
    }
    
    this.addEventListener("focus", function(){
        jpf.popup.last = this.uniqueId;
    });
    
    this.addEventListener("blur", forceHide);
    this.addEventListener("popuphide", forceHide);
    
    /**** Init ****/
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oOverlay = this.$getLayoutNode("main", "overlay", this.oExt);
        
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
                node.loadJml(node.$jml);
            }
        }
        else {
            this.oInt = oInt;
    
            //Let's not parse our children, when we've already have them
            if (this.childNodes.length) 
                return;

            //Build children
            var node, nodes = this.$jml.childNodes;
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
    var _self        = this;

    /**** Properties and Attributes ****/
    
    this.$supportedProperties = ["submenu", "value", "select", "group", "icon",
                                 "checked", "selected", "disabled", "caption"];
    //@todo events
    
    var lastHotkey;
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
            //#ifdef __WITH_HOTKEY
            case "hotkey":
                if (this.oHotkey)
                    jpf.xmldb.setNodeValue(this.oHotkey, value);
                
                if (lastHotkey)
                    jpf.removeHotkey(lastHotkey);
                
                if (value) {
                    lastHotkey = value;
                    jpf.registerHotkey(value, function(){
                        //hmm not very scalable...
                        var buttons = jpf.document.getElementsByTagName("button");
                        for (var i = 0; i < buttons.length; i++) {
                            if (buttons[i].submenu == _self.parentNode.name) {
                                var btn = buttons[i];
                                btn.$setState("Over", {});
                                
                                setTimeout(function(){
                                    btn.$setState("Out", {});
                                }, 200);
                                
                                break;
                            }
                        }
                        
                        _self.$down();
                        _self.$up();
                        _self.$click();
                    });
                }
                
                break;
            //#endif
            case "icon":
                if (this.oIcon)
                    jpf.skins.setIcon(this.oIcon, value, this.parentNode.iconPath);
                break;
            case "caption":
                jpf.xmldb.setNodeValue(this.oCaption, value);
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
        
    }

    this.$up = function(){
        if (this.tagName == "radio") 
            this.parentNode.select(this.group, this.value || this.caption);

        else if (this.tagName == "check") 
            this.$handlePropSet("checked", !this.checked);
        
        if (this.submenu) {
            this.$over(null, true);
            return;
        }

        this.parentNode.$hideTree = true;
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
    
    var timer;
    this.$out = function(e){
        if (jpf.xmldb.isChildOf(this.oExt, e.toElement || e.explicitOriginalTarget)
          || jpf.xmldb.isChildOf(this.oExt, e.srcElement || e.target))  //@todo test FF
            return;

        clearTimeout(timer);
        if (!this.submenu || this.$submenu(true)) {
            jpf.setStyleClass(this.oExt, '', ['hover']);
            
            var sel = this.parentNode.$selected;
            if (sel && sel != this)
                jpf.setStyleClass(sel.oExt, "", ["hover"]);
            
            this.parentNode.$selected = null;
        }
    }
    
    this.$over = function(e, force){
        if (this.parentNode.$selected)
            jpf.setStyleClass(this.parentNode.$selected.oExt, "", ["hover"]);
        
        jpf.setStyleClass(this.oExt, "hover");
        this.parentNode.$selected = this;
        
        if (!force && (jpf.xmldb.isChildOf(this.oExt, e.toElement || e.explicitOriginalTarget)
          || jpf.xmldb.isChildOf(this.oExt, e.fromElement || e.target)))  //@todo test FF
            return;

        var ps = this.parentNode.$showingSubMenu;
        if (ps) {
            if (ps.name == this.submenu)
                return;
            
            ps.hide();
            this.parentNode.$showingSubMenu = null;
        }

        if (this.submenu) {
            if (force) {
                _self.$submenu();
            }
            else {
                clearTimeout(timer);
                timer = setTimeout(function(){
                    _self.$submenu();
                    timer = null;
                }, 200);
            }
        }
    }
    
    this.$submenu = function(hide, force){
        if (!this.submenu)
            return true;
        
        var menu = self[this.submenu];
        if (!menu) {
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, this,
                "Displaying submenu",
                "Could not find submenu '" + this.submenu + "'", this.$jml));
            //#endif
            
            return;
        }
        
        if (!hide) {
            //if (this.parentNode.showingSubMenu == this.submenu) 
                //return;
        
            this.parentNode.$showingSubMenu = menu;
        
            var pos = jpf.getAbsolutePosition(this.oExt);
            menu.display(pos[0] + this.oExt.offsetWidth + (jpf.isIE ? -1 : 1), 
                pos[1] + (jpf.isIE ? -2 : 0), false, this, 
                this.parentNode.xmlReference, this.parentNode.uniqueId);
            menu.setAttribute("zindex", (this.parentNode.zindex || 1) + 1);
        }
        else {
            if (menu.visible && !force) {
                return false;
            }
            
            jpf.setStyleClass(this.oExt, '', ['hover']);
            menu.hide();
            return true;
        }
    }
    
    /**** Init ****/
    
    this.$draw = function(isSkinSwitch){
        var p = this.parentNode;
        
        p.$getNewContext("item");
        var elItem = p.$getLayoutNode("item");
        
        var o = 'jpf.lookup(' + this.uniqueId + ')';
        elItem.setAttribute("onmouseup",   o + '.$up(event)');
        elItem.setAttribute("onmouseover", o + '.$over(event)');
        elItem.setAttribute("onmouseout",  o + '.$out(event)');
        elItem.setAttribute("onmousedown", o + '.$down()');
        elItem.setAttribute("onclick",     o + '.$click()');
        
        jpf.setStyleClass(elItem, this.tagName);
        
        this.oExt = jpf.xmldb.htmlImport(elItem, this.parentNode.oInt);
        this.oCaption = p.$getLayoutNode("item", "caption", this.oExt)
        this.oIcon = p.$getLayoutNode("item", "icon", this.oExt);
        this.oHotkey = p.$getLayoutNode("item", "hotkey", this.oExt);
        
        if (!isSkinSwitch && this.nextSibling && this.nextSibling.oExt)
            this.oExt.parentNode.insertBefore(this.oExt, this.nextSibling.oExt);
    }
    
    this.loadJml = function(x, parentNode) {
        this.$jml = x;
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
// #endif
