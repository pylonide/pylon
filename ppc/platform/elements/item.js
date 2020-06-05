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
// #ifdef __AMLITEM || __INC_ALL

/**
 * Represents an item in a menu, displaying a clickable area.
 * 
 * #### Example
 * 
 * ```xml, demo
 * <a:application xmlns:a="http://ajax.org/2005/aml">
 *   <!-- startcontent -->
 *   <a:menu id="menu1">
 *      <a:item>Tutorials</a:item>
 *      <a:item>Contact</a:item>
 *   </a:menu>
 *   <a:toolbar>
 *      <a:menubar>
 *          <a:button submenu="menu1">File</a:button>
 *      </a:menubar>
 *   </a:toolbar>
 *   <!-- endcontent -->
 * </a:application>
 * ```
 * 
 * @class ppc.item
 * @selection
 * @define item
 * @inherits ppc.Presentation
 *
 */
/**
 * @event click Fires when a user presses the mouse button while over this element.
 * @param {Object} e The standard event object. It contains the following properties:
 *  - xmlContext ([[XMLElement]]): The XML data node that was selected in the opener at the time of showing the context menu.
 *  - opener ([[ppc.AmlElement]]): The element that was clicked upon when showing the context menu.
 */
ppc.item  = function(struct, tagName){
    this.$init(tagName || "item", ppc.NODE_VISIBLE, struct);
};

(function(){
    this.$focussable    = false;
    this.$childProperty = "caption";
    this.$canLeechSkin  = "item";

    this.checked  = false;
    this.selected = false;

    this.implement(ppc.ChildValue);

    // *** Properties and Attributes *** //
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = ppc.extend({
        "match" : 1
    }, this.$attrExcludePropBind);

    this.$booleanProperties["checked"] = true;
    this.$booleanProperties["selected"] = true;

    this.$supportedProperties.push("submenu", "value", "match", "group", "icon",
                                   "checked", "selected", "disabled", "caption", 
                                   "type", "values");

    /**
     * @attribute {String} submenu Sets or gets the id of the menu that is shown
     * when the user hovers over this menu item.
     * 
     * #### Example
     * 
     * ```xml
     *  <a:menu id="msub">
     *      <a:item icon="tbicons:12">test</a:item>
     *      <a:item icon="tbicons:14">test2</a:item>
     *  </a:menu>
     *
     *  <a:menu id="mmain">
     *      <a:item submenu="msub">Sub menu</a:item>
     *  </a:menu>
     *  
     *  <a:toolbar>
     *      <a:menubar>
     *          <a:button submenu="mmain">File</a:button>
     *      </a:menubar>
     *  </a:toolbar>
     * ```
     */
    this.$propHandlers["submenu"] = function(value){
        ppc.setStyleClass(this.$ext, "submenu");
    }
    
    /**
     * @attribute {String} value Sets or gets the value of this element.
     */

    /**
     * @attribute {String} [select] Sets or gets the XPath statement which works on the
     * XML context of the parent menu element to determine whether this
     * item is shown.
     * 
     * #### Example
     * 
     * This example shows a list:
     * 
     * ```xml
     *   <a:menu id="mnuTest">
     *       <a:item match="[person]" method="send">Send an E-mail</a:item>
     *       <a:item match="[phone]" method="call">Call Number</a:item>
     *       <a:divider />
     *       <a:item match="[phone]" method="remove">Remove</a:item>
     *       <a:divider />
     *       <a:item match="[person|phone]" method="viewpictures">View Pictures</a:item>
     *   </a:menu>
     *   
     *   <a:menu id="mnuXY">
     *       <a:item method="reboot">Reboot</a:item>
     *   </a:menu>
     *   
     *   <a:text contextmenu="mnuXY" width="200" height="200">
     *       Please right-click on this plane
     *   </a:text>
     *   
     *   <a:list id="lstTest" allow-deselect="true" width="200" height="200">
     *       <a:each match="[person|phone|computer]">
     *           <a:caption match="[@caption]" />
     *           <a:icon match="[person]" value="user.png" />
     *           <a:icon match="[phone]" value="phone.png" />
     *           <a:icon match="[computer]" value="computer.png" />
     *       </a:each>
     *       <a:model>
     *           <data>
     *               <person caption="Ruben Daniels" />
     *               <person caption="Rik Arends" />
     *               <phone caption="+31 555 544486" />
     *               <phone caption="+1 555 2392" />
     *               <computer caption="Mail Server" />
     *               <computer caption="File Server" />
     *           </data>
     *       </a:model>
     *       <a:contextmenu menu="mnuXY" match="[computer]" />
     *       <a:contextmenu menu="mnuTest" />
     *   </a:list>
     * ```
     */
    this.$propHandlers["select"] = function(value){
        this.select = value
            ? "self::" + value.split("|").join("|self::")
            : value;
    }
    
    /**
     * @attribute {String} [group] Sets or gets the name of the group this item belongs
     * to.
     * 
     * #### Example
     * 
     * ```xml
     *  <a:menu>
     *      <a:item type="radio" group="example">item 1</a:item>
     *      <a:item type="radio" group="example">item 2</a:item>
     *      <a:item type="radio" group="example">item 3</a:item>
     *      <a:item type="radio" group="example">item 4</a:item>
     *  </a:menu>
     * ```
     */
    this.$propHandlers["group"] = function(value){
        if (this.$group && this.$group.$removeRadio)
            this.$group.$removeRadio(this);
            
        if (!value) {
            this.$group = null;
            return;
        }
        
        var group = typeof value == "string"
            ? 
            //#ifdef __WITH_NAMESERVER
            ppc.nameserver.get("group", value)
            /* #else
            {}
            #endif */
            : value;
        if (!group) {
            //#ifdef __WITH_NAMESERVER
            group = ppc.nameserver.register("group", value, 
                new ppc.$group());
            group.setAttribute("id", value);
            group.dispatchEvent("DOMNodeInsertedIntoDocument");
            group.parentNode = this;
            //#endif
        }
        this.$group = group;
        
        this.$group.$addRadio(this);
    };

    //#ifdef __WITH_HOTKEY
    /**
     * @attribute {String} hotkey Sets or gets the key combination a user can press
     * to active the function of this element. Use any combination of
     * [[keys: Ctrl]], [[keys: Shift]], [[keys: Alt]], [[keys: F1]]-[[keys: F12]], and alphanumerical characters. Use a
     * space, a minus or plus sign as a seperator.
     * 
     * #### Example
     * 
     * ```xml
     *  <a:item hotkey="Ctrl+Q">Quit</a:item>
     * ```
     */
    this.$propHandlers["hotkey"] = function(value){
        if (!this.$amlLoaded) {
            var _self = this;
            this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
                if (_self.$hotkey && _self.hotkey)
                    ppc.setNodeValue(this.$hotkey, ppc.isMac 
                      ? ppc.hotkeys.toMacNotation(_self.hotkey) : _self.hotkey);
            });
        }
        else if (this.$hotkey)
            ppc.setNodeValue(this.$hotkey, ppc.isMac ? ppc.hotkeys.toMacNotation(value) : value);

        if (this.$lastHotkey) {
            ppc.hotkeys.remove(this.$lastHotkey[0], this.$lastHotkey[1]);
            delete this.$lastHotkey[0];
        }

        if (value) {
            this.$lastHotkey = [value];
            var _self = this;
            ppc.hotkeys.register(value, this.$lastHotkey[1] = function(){
                if (_self.disabled || !_self.visible)
                    return;
                
                //hmm not very scalable...
                if (_self.parentNode) {
                    var buttons = ppc.document.getElementsByTagNameNS(ppc.ns.aml, "button");
                    for (var i = 0; i < buttons.length; i++) {
                        if (buttons[i].submenu == _self.parentNode.name) {
                            var btn = buttons[i];
                            btn.$setState("Over", {});
    
                            $setTimeout(function(){
                                btn.$setState("Out", {});
                            }, 200);
    
                            break;
                        }
                    }
                }
                
                _self.$down();
                _self.$up();
                _self.$click();
            });
        }
    }
    //#endif
    /**
     * @attribute {String} icon Sets or gets the URL of the image used as an icon or
     * a reference to an iconmap.
     */
    this.$propHandlers["icon"] = function(value){
        if (this.$icon)
            ppc.skins.setIcon(this.$icon, value, this.parentNode.iconPath);
    }
    
    /**
     * @attribute {String} caption Sets or gets the text displayed on the item.
     */
    this.$propHandlers["caption"] = function(value){
        if (this.$caption)
            ppc.setNodeValue(this.$caption, value);
    }
    
    /**
     * @attribute {String} type Sets or gets the function of this item.
     * 
     * Possible values include:
     * - `"item"`
     * - `"check"`
     * - `"radio"`
     */
    this.$propHandlers["type"] = function(value){
        ppc.setStyleClass(this.$ext, value, ["item", "check", "radio"]);
    }
    
    this.$propHandlers["values"] = function(value){
        this.$values = typeof value == "string"
            ? value.split("\|")
            : (value || [1, 0]);

        this.$propHandlers["value"].call(this, this.value);
    };
    
    this.$propHandlers["value"] = function(value){
        if (this.type != "check")
            return;
        
        value = (typeof value == "string" ? value.trim() : value);
        
        var checked;
        if (this.$values) {
            checked = (typeof value != "undefined" && value !== null
                && value.toString() == this.$values[0].toString());
        }
        else {
            checked = ppc.isTrue(value);
        }
        
        if (checked != this.checked) {
            this.checked = checked;
            this.$propHandlers.checked.call(this, checked);
        }
    };
    
    /**
     * @attribute {Boolean} checked Sets or gets whether the item is checked.
     */
    this.$propHandlers["checked"] = function(value){
        if (this.type != "check")
            return;

        if (ppc.isTrue(value))
            ppc.setStyleClass(this.$ext, "checked");
        else
            ppc.setStyleClass(this.$ext, "", ["checked"]);
        
        if (!this.$values) {
            if (this.getAttribute("values"))
                this.$propHandlers["values"].call(this, this.getAttribute("values"));
            //else
                //this.$values = [true, false];
        }
        
        if(this.$values && this.$values[value ? 0 : 1] != this.value)
            this.setProperty("value", this.$values ? this.$values[value ? 0 : 1] : true);
    }
    
    this.select = function(){
        this.parentNode.select(this.group, this.value || this.caption);
    }
    
    this.check = function(){
        this.setProperty("value", this.$values
            ? this.$values[0]
            : true);
    }
    this.uncheck = function(){
        this.setProperty("value", this.$values
            ? this.$values[1]
            : false);
    }
    
    this.$check = function(){
        ppc.setStyleClass(this.$ext, "selected");
    }
    
    this.$uncheck = function(){
        ppc.setStyleClass(this.$ext, "", ["selected"]);
    }

    /**
     * @attribute {Boolean} selected Sets or gets whether the item is selected.
     */
    this.$propHandlers["selected"] = function(value){
        if (this.type != "radio")
            return;


        if (ppc.isTrue(value)) {
            if (this.$group)
                this.$group.setProperty("value", this.value);
            this.$check();
        }
        else
            this.$uncheck();
    }
    
    /**
     * @attribute {Boolean} disabled Sets or gets whether the item is active.
     */
    this.$propHandlers["disabled"] = function(value){
        if (ppc.isTrue(value) || value == -1)
            ppc.setStyleClass(this.$ext, "disabled");
        else
            ppc.setStyleClass(this.$ext, "", ["disabled"]);
    }

    // *** Dom Hooks *** //

    //@todo ppc3.0
    this.addEventListener("AMLReparent", function(beforeNode, pNode, withinParent){
        if (!this.$amlLoaded)
            return;

        if (!withinParent && this.skinName != pNode.skinName) {
            //@todo for now, assuming dom garbage collection doesn't leak
            this.loadAml();
        }
    });

    // *** Events *** //

    this.$down = function(){

    };

    this.$up = function(){
        if (this.type == "radio")
            this.parentNode.select(this.group, this.value || this.caption);

        else if (this.type == "check") {
            this.setProperty("checked", !this.checked);
            //this.$handlePropSet("checked", !this.checked);
        }

        if (this.submenu) {
            this.$over(null, true);
            return;
        }

        this.parentNode.$hideTree = true;
        
        //@todo This statement makes the menu loose focus.
        if (!this.parentNode.sticky)
            this.parentNode.hide();//true not focus?/

        this.parentNode.dispatchEvent("itemclick", {
            value       : this.value || this.caption,
            relatedNode : this,
            checked     : this.checked,
            selected    : this.selected
        });

        //@todo Anim effect here?
        
        this.dispatchEvent("click", {
            xmlContext : this.parentNode.xmlReference,
            opener     : this.parentNode.opener
        });
    };

    this.$click = function(){
        
    };

    var timer;
    this.$out = function(e){
        if (ppc.isChildOf(this.$ext, e.toElement || e.explicitOriginalTarget)
          || ppc.isChildOf(this.$ext, e.srcElement || e.target))  //@todo test FF
            return;

        clearTimeout(timer);
        if (!this.submenu || this.$submenu(true)) {
            ppc.setStyleClass(this.$ext, "", ['hover']);

            var sel = this.parentNode.$selected;
            if (sel && sel != this)
                ppc.setStyleClass(sel.$ext, "", ["hover"]);

            this.parentNode.$selected = null;
        }
    };

    this.$over = function(e, force){
        if (this.parentNode.$selected == this && e)
            return;

        if (this.parentNode.$selected)
            ppc.setStyleClass(this.parentNode.$selected.$ext, "", ["hover"]);

        ppc.setStyleClass(this.$ext, "hover");
        this.parentNode.$selected = this;

        if (!force && (ppc.isChildOf(this.$ext, e.toElement || e.explicitOriginalTarget)
          || ppc.isChildOf(this.$ext, e.fromElement || e.target)))  //@todo test FF
            return;

        var _self = this, ps = this.parentNode.$showingSubMenu;
        if (ps && ps.name == this.submenu) {
            this.parentNode.$selected = null;
            this.parentNode.$showingSubMenu = null;
            _self.$submenu();
            return;
        }
            
        clearTimeout(timer);
        
        function submenu(){
            if (ps && ps.visible) {
                ps.hide();
                
                if (_self.parentNode.$showingSubMenu == ps)
                    _self.parentNode.$showingSubMenu = null;
            }
    
            if (_self.submenu && _self.parentNode.opener 
              && _self.parentNode.opener.visible)
                _self.$submenu();
        }

        if (force)
            submenu();
        else {
            timer = $setTimeout(function(){
                submenu();
                timer = null;
            }, 210);
        }
    };

    this.$submenu = function(hide, force){
        if (!this.submenu)
            return true;

        var menu = self[this.submenu];
        if (!menu) {
            //#ifdef __DEBUG
            throw new Error(ppc.formatErrorString(0, this,
                "Displaying submenu",
                "Could not find submenu '" + this.submenu + "'", this.$aml));
            //#endif

            return;
        }

        if (!hide) {
            //if (this.parentNode.showingSubMenu == this.submenu)
                //return;

            this.parentNode.$showingSubMenu = menu;

            var pos = ppc.getAbsolutePosition(this.$ext, this.parentNode.$ext.offsetParent);
            menu.display(pos[0] + this.$ext.offsetWidth - 3,
                pos[1] + 3, true, this,
                this.parentNode.xmlReference, this.parentNode.$uniqueId);
            menu.setAttribute("zindex", (this.parentNode.zindex || this.parentNode.$ext.style.zIndex || 1) + 1);
        }
        else {
            if (menu.visible && !force) {
                return false;
            }
            
            if (this.parentNode.$showingSubMenu == menu)
                this.parentNode.$showingSubMenu = null;
            
            ppc.setStyleClass(this.$ext, '', ['hover']);
            menu.hide();
            return true;
        }
    };

    // *** Init *** //
    
    this.$draw = function(isSkinSwitch){
        var p = this.parentNode;
        while (p.$canLeechSkin == "item")
            p = p.parentNode;
        
        //@todo ppc3.0 rename doesnt work yet.
        //@todo ppc3.0 implement DOM Mutation events for multiselect widgets
        //@todo ppc3.0 implement attribute change triggers for icon, image, value, caption to updateNode this.$container
        //@todo ppc3.x this should be rearchitected
        //@todo ppc3.x the functions dont need to be overloaded if selectNodes would work properly
        if (p.hasFeature(ppc.__MULTISELECT__)) {
            var _self = this;
            
            //@todo DOMNodeInserted should reset this
            //@todo DOMNodeRemoved should reset this
            if (!this.$hasSetSkinListener) {
                var f;
                this.parentNode.addEventListener("$skinchange", f = function(){
                    if (_self.$amlDestroyed) //@todo ppc3.x
                        return;
                    
                    if (_self.$ext.parentNode)
                        this.$deInitNode(_self, _self.$ext);
    
                    var oInt = p == _self.parentNode ? p.$container : _self.parentNode.$container;
                    var node = oInt.lastChild;//@todo this should be more generic
                    p.$add(_self, _self.getAttribute(ppc.xmldb.xmlIdTag) + "|" + this.$uniqueId, 
                        _self.parentNode, oInt != p.$container && oInt, null);
                    p.$fill();
                    
                    if (p.$isTreeArch) {
                        _self.$container = p.$getLayoutNode("item", "container", 
                           _self.$ext = node && node.nextSibling || oInt.firstChild);//@todo this should be more generic
                    }
                    else _self.$ext = node && node.nextSibling || oInt.firstChild;
                    
                    var ns = _self;
                    while((ns = ns.nextSibling) && ns.nodeType != 1);
        
                    if (!ns || ns.$canLeechSkin != "item")
                        p.dispatchEvent("afterload");
                });
                this.addEventListener("DOMNodeRemoved", function(e){
                    if (e.currentTarget == this)
                        this.parentNode.removeEventListener("$skinchange", f);
                });
                
                this.$hasSetSkinListener = true;
            }
            
            if (!p.$itemInited) {
                p.canrename = false; //@todo fix rename
                p.$removeClearMessage(); //@todo this should be more generic
                p.$itemInited = [p.getTraverseNodes, p.getFirstTraverseNode, p.getTraverseParent];
                
                p.getTraverseNodes = function(xmlNode){
                    return (xmlNode || p).getElementsByTagNameNS(ppc.ns.ppc, "item");
                }
                p.getFirstTraverseNode = function(xmlNode){
                    return (xmlNode || p).getElementsByTagNameNS(ppc.ns.ppc, "item")[0];
                }
                p.getTraverseParent = function(xmlNode){
                    return xmlNode && xmlNode.parentNode;
                }
                p.each = (this.prefix ? this.prefix + ":" : "") + "item";

                //@todo this is all an ugly hack (copied to baselist.js line 868)
                p.$preventDataLoad = true;//@todo ppc3.0 add remove for this

                p.$initingModel = true;
                p.$setDynamicProperty("icon", "[@icon]");
                p.$setDynamicProperty("image", "[@image]");
                p.$setDynamicProperty("caption", "[label/text()|@caption|text()]");
                p.$setDynamicProperty("eachvalue", "[value/text()|@value|text()]");
                p.$canLoadDataAttr = false;
                
                if (!p.xmlRoot)
                    p.xmlRoot = p;
            }
            
            this.$loadAml = function(){
                //hack
                if (!this.getAttribute("caption"))
                    this.setAttribute("caption", this.caption);
                
                var oInt = p == this.parentNode ? p.$container : this.parentNode.$container;
                var node = oInt.lastChild;//@todo this should be more generic
                if (!p.documentId)
                    p.documentId = ppc.xmldb.getXmlDocId(this);
                p.$add(this, ppc.xmldb.nodeConnect(p.documentId, this, null, p), 
                    this.parentNode, oInt != p.$container && oInt, null);
                p.$fill();
    
                if (p.$isTreeArch) {
                    this.$container = p.$getLayoutNode("item", "container", 
                       this.$ext = node && node.nextSibling || oInt.firstChild);//@todo this should be more generic
                }
                else this.$ext = node && node.nextSibling || oInt.firstChild;
                
                var ns = this;
                while((ns = ns.nextSibling) && ns.nodeType != 1);
    
                if (!ns || ns.$canLeechSkin != "item") {
                    p.dispatchEvent("afterload");
                    if (p.autoselect)
                        p.$selectDefault(this.parentNode);
                }
            }
            
            return;
        }
        
        this.$ext = this.$getExternal(this.$isLeechingSkin
          ? "item" //this.type 
          : "main", null, function($ext){
            var o = 'var o = ppc.lookup(' + this.$uniqueId + '); if (o.disabled) return; o';
            $ext.setAttribute("onmouseup",   o + '.$up(event)');
            $ext.setAttribute("onmousemove", o + '.$over(event)');
            $ext.setAttribute("onmouseout",  o + '.$out(event)');
            $ext.setAttribute("onmousedown", o + '.$down()');
            $ext.setAttribute("onclick",     o + '.$click()');
        });

        var _self = this;
        ppc.addListener(this.$ext, "mouseover", function(e) {
            if (!_self.disabled)
                _self.dispatchEvent("mouseover", {htmlEvent: e});
        });
        
        ppc.addListener(this.$ext, "mouseout", function(e) {
            if (!_self.disabled)
                _self.dispatchEvent("mouseout", {htmlEvent: e});
        });
        
        /*p.$getNewContext("item");
        var elItem = p.$getLayoutNode("item");*/
        
        //@todo if not elItem try using own skin
        
        //this.$ext   = ppc.insertHtmlNode(elItem, this.parentNode.$container);
        this.$caption = this.$getLayoutNode("item", "caption", this.$ext)
        this.$icon    = this.$getLayoutNode("item", "icon", this.$ext);
        this.$hotkey  = this.$getLayoutNode("item", "hotkey", this.$ext);

        if (!isSkinSwitch && this.nextSibling && this.nextSibling.$ext)
            this.$ext.parentNode.insertBefore(this.$ext, this.nextSibling.$ext);
    };
    
    /*
     * @private
     */
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //var x = this.$aml;

        //this.skinName    = this.parentNode.skinName;
        var isSkinSwitch = this.$ext ? true : false;
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
    });
}).call(ppc.item.prototype = new ppc.Presentation());

//ppc.aml.setElement("radio", ppc.radio);
//ppc.aml.setElement("check", ppc.check);
ppc.aml.setElement("item",  ppc.item);
// #endif
