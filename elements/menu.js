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
// #ifdef __AMLMENU || __INC_ALL

/**
 * Element displaying a skinnable menu of items which can be choosen.
 * Based on the context of the menu, items can be shown and hidden. That's
 * why this element is often called a contextmenu.
 * Example:
 * <code>
 *  <a:iconmap 
 *    id     = "tbicons" 
 *    src    = "toolbar.icons.gif"
 *    type   = "horizontal" 
 *    size   = "20" 
 *    offset = "2,2"></a:iconmap>
 * 
 *  <a:menu id="msub">
 *      <a:item icon="tbicons:12">test</a:item>
 *      <a:item icon="tbicons:14">test2</a:item>
 *  </a:menu>
 * 
 *  <a:menu id="mmain">
 *      <a:item icon="tbicons:1">table_wizard</a:item>
 *      <a:item icon="tbicons:2" hotkey="Ctrl+M">table_wizard</a:item>
 *      <a:divider></a:divider>
 *      <a:radio>item 1</a:radio>
 *      <a:radio>item 2</a:radio>
 *      <a:radio>item 3</a:radio>
 *      <a:radio>item 4</a:radio>
 *      <a:divider></a:divider>
 *      <a:check hotkey="Ctrl+T">item check 1</a:check>
 *      <a:check hotkey="F3">item check 2</a:check>
 *      <a:divider></a:divider>
 *      <a:item icon="tbicons:11" submenu="msub">table_wizard</a:item>
 *      <a:item icon="tbicons:10">table_wizard</a:item>
 *  </a:menu>
 * 
 *  <a:window 
 *    visible     = "true" 
 *    width       = "200"
 *    height      = "190"
 *    contextmenu = "mmain"
 *    center      = "true">
 *  </a:window>
 * </code>
 * @see baseclass.guielement.event.contextmenu
 *
 * @event display   Fires when the contextmenu is shown.
 * @event itemclick Fires when a user presses the mouse button while over a child of this element.
 *   object:
 *   {String} value the value of the clicked element.
 *
 * @constructor
 * @define menu
 * @allowchild item, divider, check, radio
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.Presentation
 */
apf.menu = function(struct, tagName){
    this.$init(tagName || "menu", apf.NODE_VISIBLE, struct);
    
    this.animate = apf.enableAnim;
};

(function(){
    this.$focussable  = apf.KEYBOARD;
    this.$positioning = "basic"
    //var _self         = this;
    //var blurring      = false;

    /**** Properties and Attributes ****/
    
    this.zindex    = 10000000;
    this.visible   = false;
    this.matchhide = false;

    this.$booleanProperties["animate"]  = true;
    this.$booleanProperties["pinned"] = true;
    this.$booleanProperties["matchhide"] = true;
    
    this.$propHandlers["visible"] = function(value, prop, force, nofocus, hideOpener){
        if (value) {
            this.$ext.style.display = "block";
            if (this.opener && this.opener.localName.indexOf('item') > -1)
                this.opener.parentNode.$showingSubMenu = this;
        }
        else {
            this.$ext.style.display = "none";

            var lastFocus = apf.menu.lastFocus;

            //@todo test this with a list being the opener of the menu
            if (lastFocus != this.opener && this.opener && this.opener.$blur)
                this.opener.$blur();

            if (this.opener && this.opener.parentNode && this.opener.parentNode.localName == "menu") {
                if (!this.$hideTree)
                    this.$hideTree = -1
                this.opener.parentNode.focus();
            }
            
            //#ifdef __WITH_FOCUS
            else if (lastFocus) {
                //We're being hidden because some other object gets focus
                if (apf.window.$settingFocus) {
                    if (apf.window.$settingFocus != lastFocus && lastFocus.$blur)
                        lastFocus.$blur();
                    this.$blur();

                    if (apf.window.$settingFocus.localName != "menu") //not menu walking
                        apf.menu.lastFocus = null;
                }
                //We're being hidden because window looses focus
                else if (!apf.window.hasFocus()) {
                    if (lastFocus.$blur)
                        lastFocus.$blur();
                    this.$blur();

                    apf.document.activeElement = lastFocus;
                    if (lastFocus.$focusParent)
                        lastFocus.$focusParent.$lastFocussed = lastFocus;

                    apf.menu.lastFocus = null;
                }
                //We're just being hidden
                else if (this.$hideTree) {
                    if (!this.$hideTree)
                        this.$hideTree = -1

                    var visTest = (lastFocus.disabled || !lastFocus.visible)
                        && lastFocus != apf.document.documentElement;

                    if (nofocus || visTest) {
                        if (lastFocus.$blur)
                            lastFocus.$blur();
                        this.$blur();
                        apf.document.activeElement = null;

                        if (visTest && apf.window.moveNext() === false)
                            apf.window.$focusRoot();
                    }
                    else {
                        lastFocus.focus(null, null, true);
                    }

                    apf.menu.lastFocus = null;
                }
            }
            //#endif

            clearTimeout(this.$submenuTimer);

            if (this.$showingSubMenu) {
                this.$showingSubMenu.hide();
                this.$showingSubMenu = null;
            }

            if (this.opener && this.opener.$submenu) {
                this.opener.$submenu(true, true);

                //@todo problem with loosing focus when window looses focus
                if (this.$hideTree === true && this.opener
                    && this.opener.parentNode && this.opener.parentNode.localName == "menu") {
                    this.opener.parentNode.$hideTree = true
                    this.opener.parentNode.hide();
                }
                
                this.opener = null;
            }
            this.$hideTree = null;

            if (this.$selected) {
                apf.setStyleClass(this.$selected.$ext, "", ["hover"]);
                this.$selected = null;
            }
        }
    };

    /**** Public Methods ****/

    var lastFocus;

    /**
     * Shows the menu, optionally within a certain context.
     * @param {Number}     x        the left position of the menu.
     * @param {Number}     y        the top position of the menu.
     * @param {Boolean}    noanim   whether to animate the showing of this menu.
     * @param {AMLElement} opener   the element that is the context of this menu.
     * @param {XMLElement} xmlNode  the {@link term.datanode data node} that provides data context to the menu child nodes.
     * @see baseclass.guielement.event.contextmenu
     */
    this.display = function(x, y, noanim, opener, xmlNode, openMenuId, btnWidth){
        this.opener = opener;
        
        //Show / hide Child Nodes Based on XML
        if (xmlNode && !this.disabled) {
            var last, i, node,
                nodes = this.childNodes,
                c     = 0,
                l     = nodes.length, result;
            for (i = 0; i < l; i++) {
                node = nodes[i];
                if (node.nodeType != 1 || node.localName != "item")
                    continue;
    
                result = !xmlNode || !node.match || (node.cmatch || (node.cmatch = apf.lm.compile(node.match, {
                    xpathmode  : 3,
                    injectself : true
                })))(xmlNode)
    
                if (result) {
                    if (this.matchhide)
                        node.show();
                    else
                        node.enable();
    
                    if (node.localName == "divider" && this.matchhide) {
                        last = node;
                        if (c == 0)
                            node.hide();
                        c = 0;
                    }
                    else c++;
                }
                else {
                    if (this.matchhide)
                        node.hide();
                    else
                        node.disable();
    
                    if (!node.nextSibling && c == 0 && last)
                        last.hide();
                }
            }
        }

        if (this.oOverlay) {
            if (btnWidth) {
                this.oOverlay.style.display = "block";
                this.oOverlay.style.width   = btnWidth + "px";
            }
            else
                this.oOverlay.style.display = "none";
        }

        function afterRender(){
            //@todo consider renaming this to onshow and onhide
            this.dispatchEvent("display", {opener: opener});

            if (x === null) {
                apf.popup.show(this.$uniqueId, {
                    x            : 0, 
                    y            : this.ref ? 0 : opener.$ext.offsetHeight, 
                    animate      : noanim || !this.animate ? false : "fade",
                    steps        : 10,
                    ref          : (this.ref || opener).$ext,
                    allowTogether: openMenuId,
                    autohide     : !this.pinned,
                    noleft       : this.left !== undefined
                });
            }
            else {
                var bodyPos = apf.getAbsolutePosition(document.body);
                apf.popup.show(this.$uniqueId, {
                    x            : x - bodyPos[0], 
                    y            : y - bodyPos[1] - (apf.isIE && apf.isIE < 8 ? 1 : 0), 
                    animate      : noanim || !this.animate ? false : "fade",
                    steps        : 10,
                    //ref          : this.$ext.offsetParent,
                    allowTogether: openMenuId,
                    autohide     : !this.pinned
                    //autoCorrect  : false
                });
            }
            
            var lastFocus      =
            apf.menu.lastFocus = opener && opener.$focussable === true
                ? opener
                : apf.menu.lastFocus || apf.document.activeElement;
            
            apf.popup.last = null;
            
            //if (!apf.isGecko) //This disables keyboard support for gecko - very strange behaviour
                this.focus();
    
            //Make the component that provides context appear to have focus
    
            if (lastFocus && lastFocus != this && lastFocus.$focus)
                lastFocus.$focus();
    
            this.xmlReference = xmlNode;
        }
        
        this.visible = false;
        
        if (this.$rendered !== false) {
            this.show();
            afterRender.call(this);
        }
        else {
            this.addEventListener("afterrender", afterRender);
            this.show();
        }                
    };

    /**
     * Returns the current value of this element.
     * @return {String}
     */
    this.getValue = function(group){
        return this.getSelected(group).value || "";
    };

    /**
     * Retrieves the selected element from a group of radio elements.
     * @param {String} group the name of the group.
     * @return {radio} the selected radio element.
     */
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

    /**
     * Selects an element within a radio group.
     * @param {String} group  the name of the group.
     * @param {String} value  the value of the item to select.
     */
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

    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var node, key = e.keyCode;
        //var ctrlKey  = e.ctrlKey;
        //var shiftKey = e.shiftKey;

        switch (key) {
            case 13:
                if (!this.$selected)
                    return;

                node = this.$selected;
                node.$down();
                node.$up();
                node.$click();
                break;
            case 27:
                this.hide();
                break;
            case 38:
                //UP
                node = this.$selected && this.$selected.previousSibling
                  || this.lastChild;

                if (node && node.localName == "divider")
                    node = node.previousSibling;

                if (!node)
                    return;

                if (this.$selected)
                    apf.setStyleClass(this.$selected.$ext, "", ["hover"]);

                apf.setStyleClass(node.$ext, "hover");
                this.$selected = node;
                break;
            case 40:
                //DOWN
                node = this.$selected && this.$selected.nextSibling
                  || this.firstChild;

                if (node && node.localName == "divider")
                    node = node.nextSibling;

                if (!node)
                    return;

                if (this.$selected)
                    apf.setStyleClass(this.$selected.$ext, "", ["hover"]);

                apf.setStyleClass(node.$ext, "hover");
                this.$selected = node;
                break;
            case 37:
                //LEFT
                //if (this.$selected && this.$selected.submenu)
                    //this.$selected.$submenu(true, true);

                if (!this.opener)
                    return;

                if (this.opener.localName == "button") {
                    node = this.opener.previousSibling;
                    while(node && !node.submenu)
                        node = node.previousSibling;

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
                else if (this.opener.parentNode.localName == "menu") {
                    //@todo Ahum bad abstraction boundary
                    var op = this.opener;
                    this.hide();
                    apf.setStyleClass(op.$ext, "hover");
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
                    while (op && op.parentNode && op.parentNode.localName == "menu")
                        op = op.parentNode.opener;

                    if (op && op.localName == "button") {
                        node = op.nextSibling;
                        while(node && !node.submenu)
                            node = node.nextSibling;

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
    }, true);
    // #endif

    //Hide menu when it looses focus or when the popup hides itself
    function forceHide(e){
        if (this.$showingSubMenu || this.pinned
                || apf.isChildOf(e.fromElement, e.toElement)
                || apf.isChildOf(this, e.toElement) || !e.toElement)
            return;

        if (this.$hideTree != -1) {
            this.$hideTree = true;
            this.hide();
        }

        return false;
    }

    this.addEventListener("focus", function(){
        apf.popup.last = this.$uniqueId;
    });

    this.addEventListener("blur", forceHide);
    this.addEventListener("popuphide", forceHide);

    /**** Init ****/

    this.$draw = function(){
        this.$pHtmlNode = document.body;

        //Build Main Skin
        this.$ext = this.$getExternal();
        this.oOverlay = this.$getLayoutNode("main", "overlay", this.$ext);

        apf.popup.setContent(this.$uniqueId, this.$ext, "", null, null);
    };

    this.$loadAml = function(x){
        this.$int = this.$getLayoutNode("main", "container", this.$ext);
    };

    this.$destroy = function(){
        apf.popup.removeContent(this.$uniqueId);
    };
}).call(apf.menu.prototype = new apf.Presentation());

apf.aml.setElement("menu", apf.menu);
// #endif