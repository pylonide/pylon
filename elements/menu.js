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
 * Element displaying a skinnable menu of items which can be choosen.
 * Based on the context of the menu, items can be shown and hidden. That's
 * why this element is often called a contextmenu.
 * Example:
 * <code>
 *  <a:iconmap id="tbicons" src="toolbar.icons.gif"
 *      type="horizontal" size="20" offset="2,2"></a:iconmap>
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
 *  <a:window contextmenu="mmain">
 *      ...
 *  </a:window>
 * </code>
 * @see baseclass.amlelement.event.contextmenu
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
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.Presentation
 */
apf.menu = apf.component(apf.NODE_VISIBLE, function(){
    this.$focussable  = apf.KEYBOARD;
    this.$positioning = "basic"
    //var _self         = this;
    //var blurring      = false;

    /**** Properties and Attributes ****/
    
    this.anim   = true;
    this.zindex = 10000000;

    this.$booleanProperties["anim"] = true;
    this.$propHandlers["visible"] = function(value, nofocus, hideOpener){
        if (value) {
            this.oExt.style.display = "block";
        }
        else {
            this.oExt.style.display = "none";

            var lastFocus = apf.menu.lastFocus;

            //@todo test this with a list being the opener of the menu
            if (lastFocus != this.opener && this.opener && this.opener.$blur)
                this.opener.$blur();

            if (this.opener && this.opener.parentNode.tagName == "menu") {
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

                    if (apf.window.$settingFocus.tagName != "menu") //not menu walking
                        apf.menu.lastFocus = null;
                }
                //We're being hidden because window looses focus
                else if (!apf.window.hasFocus()) {
                    if (lastFocus.$blur)
                        lastFocus.$blur();
                    this.$blur();

                    apf.window.focussed = lastFocus;
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
                        apf.window.focussed = null;

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
                apf.setStyleClass(this.$selected.oExt, "", ["hover"]);
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
     * @see baseclass.amlelement.event.contextmenu
     */
    this.display = function(x, y, noanim, opener, xmlNode, openMenuId, btnWidth){
        this.opener = opener;
        this.dispatchEvent("display");

        //Show / hide Child Nodes Based on XML
        var c = 0, last, i, node, nodes = this.childNodes;
        var l = nodes.length
        for (i = 0; i < l; i++) {
            node = nodes[i];

            if (!node.select || !xmlNode
              || xmlNode.selectSingleNode(node.select)) {
                node.show();

                if (node.tagName == "divider") {
                    last = node;
                    if (c == 0)
                        node.hide();
                    c = 0;
                }
                else c++;
            }
            else {
                node.hide();

                if (!node.nextSibling && c == 0)
                    last.hide();
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

        this.visible = false;
        this.show();
        apf.popup.show(this.uniqueId, {
            x            : x,
            y            : y,
            animate      : noanim || !this.anim ? false : "fade",
            ref          : this.oExt.offsetParent,
            allowTogether: openMenuId,
            autoCorrect  : false
        });

        var lastFocus      =
        apf.menu.lastFocus = opener && opener.$focussable === true
            ? opener
            : apf.menu.lastFocus || apf.window.focussed;
        
        apf.popup.last = null;
        this.focus();

        //Make the component that provides context appear to have focus

        if (lastFocus && lastFocus != this && lastFocus.$focus)
            lastFocus.$focus();

        this.xmlReference = xmlNode;
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
            case 38:
                //UP
                node = this.$selected && this.$selected.previousSibling
                  || this.lastChild;

                if (node && node.tagName == "divider")
                    node = node.previousSibling;

                if (!node)
                    return;

                if (this.$selected)
                    apf.setStyleClass(this.$selected.oExt, "", ["hover"]);

                apf.setStyleClass(node.oExt, "hover");
                this.$selected = node;
                break;
            case 40:
                //DOWN
                node = this.$selected && this.$selected.nextSibling
                  || this.firstChild;

                if (node && node.tagName == "divider")
                    node = node.nextSibling;

                if (!node)
                    return;

                if (this.$selected)
                    apf.setStyleClass(this.$selected.oExt, "", ["hover"]);

                apf.setStyleClass(node.oExt, "hover");
                this.$selected = node;
                break;
            case 37:
                //LEFT
                //if (this.$selected && this.$selected.submenu)
                    //this.$selected.$submenu(true, true);

                if (!this.opener)
                    return;

                if (this.opener.tagName == "button") {
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
                else if (this.opener.parentNode.tagName == "menu") {
                    //@todo Ahum bad abstraction boundary
                    var op = this.opener;
                    this.hide();
                    apf.setStyleClass(op.oExt, "hover");
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
        apf.popup.last = this.uniqueId;
    });

    this.addEventListener("blur", forceHide);
    this.addEventListener("popuphide", forceHide);

    /**** Init ****/

    this.$draw = function(){
        this.pHtmlNode = document.body;

        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oOverlay = this.$getLayoutNode("main", "overlay", this.oExt);

        apf.popup.setContent(this.uniqueId, this.oExt, "", null, null);
    };

    this.$loadAml = function(x){
        var i, oInt = this.$getLayoutNode("main", "container", this.oExt);

        //Skin changing support
        if (this.oInt) {
            this.oInt = oInt;

            var node, nodes = this.childNodes;
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];
                node.loadAml(node.$aml);
            }
        }
        else {
            this.oInt = oInt;

            //Let's not parse our children, when we've already have them
            if (this.childNodes.length)
                return;

            //Build children
            var node, nodes = this.$aml.childNodes;
            var l = nodes.length;
            for (i = 0; i < l; i++) {
                node = nodes[i];
                if (node.nodeType != 1) continue;

                var tagName = node[apf.TAGNAME];
                if ("item|radio|check".indexOf(tagName) > -1) {
                    new apf.item(oInt, tagName).loadAml(node, this);
                }
                else if (tagName == "divider") {
                    new apf.divider(oInt, tagName).loadAml(node, this);
                }
                //#ifdef __DEBUG
                else {
                    throw new Error(apf.formatErrorString(0, this,
                        "Parsing children of menu component",
                        "Unknown component found as child of menu", node));
                }
                //#endif
            }
        }
    };

    this.$destroy = function(){
        apf.popup.removeContent(this.uniqueId);
    };
}).implement(apf.Presentation);

/**
 * Item of a menu displaying a clickable area.
 * Example:
 * <code>
 *  <a:iconmap id="tbicons" src="toolbar.icons.gif" 
 *    type="horizontal" size="20" offset="2,2" />
 *
 *  <a:menu>
 *      <a:item icon="tbicons:1">example</a:item>
 *      <a:item icon="tbicons:2">example</a:item>
 *      <a:divider />
 *      <a:radio>item 1</a:radio>
 *      <a:radio>item 2</a:radio>
 *      <a:radio>item 3</a:radio>
 *      <a:radio>item 4</a:radio>
 *      <a:divider />
 *      <a:check>item check 1</a:check>
 *      <a:check>item check 2</a:check>
 *      <a:divider />
 *      <a:item icon="tbicons:11" submenu="msub">example</a:item>
 *      <a:item icon="tbicons:10">example</a:item>
 *  </a:menu>
 *
 *  <a:menu id="msub" skin="menu2005">
 *      <a:item icon="tbicons:12">test</a:item>
 *      <a:item icon="tbicons:14">test2</a:item>
 *  </a:menu>
 * </code>
 * @define item, check, radio
 * @constructor
 *
 * @event click Fires when a user presses the mouse button while over this element.
 *   object:
 *   {String} value the value of the clicked element.
 */
apf.radio =
apf.check =
apf.item  = apf.subnode(apf.NODE_HIDDEN, function(){
    this.$focussable = false;
    var _self        = this;

    /**** Properties and Attributes ****/

    this.$supportedProperties = ["submenu", "value", "select", "group", "icon",
                                 "checked", "selected", "disabled", "caption"];

    var lastHotkey;
    this.$handlePropSet = function(prop, value, force){
        this[prop] = value;

        switch (prop) {
            /**
             * @attribute {String} [submenu] the id of the menu that is shown
             * when the user hovers over this menu item.
             * Example:
             * <code>
             *  <a:menu id="msub">
             *      <a:item icon="tbicons:12">test</a:item>
             *      <a:item icon="tbicons:14">test2</a:item>
             *  </a:menu>
             *
             *  <a:menu id="mmain">
             *      <a:item submenu="msub">Sub menu</a:item>
             *  </a:menu>
             * </code>
             */
            case "submenu":
                apf.setStyleClass(this.oExt, "submenu");
                break;
            /**
             * @attribute {String} value the value of this element.
             */
            case "value":
                break;
            /**
             * @attribute {String} [select] the xpath statement which works on the
             * xml context of the parent menu element to determine whether this
             * item is shown.
             * Example:
             * This example shows a list
             * <code>
             *  <a:list>
             *     [...]
             *
             *     <a:contextmenu menu="mnuXY" select="computer" />
             *     <a:contextmenu menu="mnuTest" />
             *  </a:list>
             *
             *  <a:menu id="mnuTest">
             *     <a:item select="person">Send an E-mail</a:Item>
             *     <a:item select="phone">Call Number</a:Item>
             *     <a:divider />
             *     <a:item select="phone">Remove</a:Item>
             *     <a:divider />
             *     <a:item select="person|phone">View Pictures</a:Item>
             *  </a:menu>
             *
             *  <a:menu id="mnuXY">
             *     <a:item>Reboot</a:Item>
             *  </a:menu>
             * </code>
             */
            case "select":
                this.select = value
                    ? "self::" + value.split("|").join("|self::")
                    : value;
                break;
            /**
             * @attribute {String} [group] the name of the group this item belongs
             * to.
             * Example:
             * <code>
             *  <a:menu>
             *      <a:radio group="example">item 1</a:radio>
             *      <a:radio group="example">item 2</a:radio>
             *      <a:radio group="example">item 3</a:radio>
             *      <a:radio group="example">item 4</a:radio>
             *  </a:menu>
             * </code>
             */
            case "group":
                break;
            //#ifdef __WITH_HOTKEY
            /**
             * @attribute {String} hotkey the key combination a user can press
             * to active the function of this element. Use any combination of
             * Ctrl, Shift, Alt, F1-F12 and alphanumerical characters. Use a
             * space, a minus or plus sign as a seperator.
             * Example:
             * <code>
             *      <a:item hotkey="Ctrl+Q">Quit</a:item>
             * </code>
             */
            case "hotkey":
                if (this.oHotkey)
                    apf.setNodeValue(this.oHotkey, value);

                if (lastHotkey)
                    apf.removeHotkey(lastHotkey);

                if (value) {
                    lastHotkey = value;
                    apf.registerHotkey(value, function(){
                        //hmm not very scalable...
                        var buttons = apf.document.getElementsByTagName("button");
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
            /**
             * @attribute {String} icon the url of the image used as an icon or
             * a reference to an iconmap.
             */
            case "icon":
                if (this.oIcon)
                    apf.skins.setIcon(this.oIcon, value, this.parentNode.iconPath);
                break;
            /**
             * @attribute {String} caption the text displayed on the item.
             */
            case "caption":
                apf.setNodeValue(this.oCaption, value);
                break;
            /**
             * @attribute {Boolean} checked whether the item is checked.
             */
            case "checked":
                if (this.tagName != "check")
                    return;

                if (apf.isTrue(value))
                    apf.setStyleClass(this.oExt, "checked");
                else
                    apf.setStyleClass(this.oExt, "", ["checked"]);
                break;
            /**
             * @attribute {Boolean} checked whether the item is selected.
             */
            case "selected":
                if (this.tagName != "radio")
                    return;

                if (apf.isTrue(value))
                    apf.setStyleClass(this.oExt, "selected");
                else
                    apf.setStyleClass(this.oExt, "", ["selected"]);
                break;
            /**
             * @attribute {Boolean} disabled whether the item is active.
             */
            case "disabled":
                if (apf.isTrue(value))
                    apf.setStyleClass(this.oExt, "disabled");
                else
                    apf.setStyleClass(this.oExt, "", ["disabled"]);
                break;
        }
    };

    /**** Public Methods ****/

    /**
     * @private
     */
    this.enable = function(list){
        apf.setStyleClass(this.oExt,
            this.parentNode.baseCSSname + "Disabled");
    };

    /**
     * @private
     */
    this.disable = function(list){
        apf.setStyleClass(this.oExt, null,
            [this.parentNode.baseCSSname + "Disabled"]);
    };

    /**
     * @private
     */
    this.show = function(){
        this.oExt.style.display = "block";
    };

    /**
     * @private
     */
    this.hide = function(){
        this.oExt.style.display = "none";
    };

    /**** Dom Hooks ****/

    this.$domHandlers["reparent"].push(function(beforeNode, pNode, withinParent){
        if (!this.$amlLoaded)
            return;

        if (!withinParent && this.skinName != pNode.skinName) {
            //@todo for now, assuming dom garbage collection doesn't leak
            this.loadAml();
        }
    });

    /**** Events ****/

    this.$down = function(){

    };

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
    };

    this.$click = function(){
        this.dispatchEvent("click", {
            xmlContext : this.parentNode.xmlReference
        });
    };

    var timer;
    this.$out = function(e){
        if (apf.isChildOf(this.oExt, e.toElement || e.explicitOriginalTarget)
          || apf.isChildOf(this.oExt, e.srcElement || e.target))  //@todo test FF
            return;

        clearTimeout(timer);
        if (!this.submenu || this.$submenu(true)) {
            apf.setStyleClass(this.oExt, '', ['hover']);

            var sel = this.parentNode.$selected;
            if (sel && sel != this)
                apf.setStyleClass(sel.oExt, "", ["hover"]);

            this.parentNode.$selected = null;
        }
    };

    this.$over = function(e, force){
        if (this.parentNode.$selected)
            apf.setStyleClass(this.parentNode.$selected.oExt, "", ["hover"]);

        apf.setStyleClass(this.oExt, "hover");
        this.parentNode.$selected = this;

        if (!force && (apf.isChildOf(this.oExt, e.toElement || e.explicitOriginalTarget)
          || apf.isChildOf(this.oExt, e.fromElement || e.target)))  //@todo test FF
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
    };

    this.$submenu = function(hide, force){
        if (!this.submenu)
            return true;

        var menu = self[this.submenu];
        if (!menu) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, this,
                "Displaying submenu",
                "Could not find submenu '" + this.submenu + "'", this.$aml));
            //#endif

            return;
        }

        if (!hide) {
            //if (this.parentNode.showingSubMenu == this.submenu)
                //return;

            this.parentNode.$showingSubMenu = menu;

            var pos = apf.getAbsolutePosition(this.oExt);
            menu.display(pos[0] + this.oExt.offsetWidth + 1,
                pos[1], false, this,
                this.parentNode.xmlReference, this.parentNode.uniqueId);
            menu.setAttribute("zindex", (this.parentNode.zindex || 1) + 1);
        }
        else {
            if (menu.visible && !force) {
                return false;
            }

            apf.setStyleClass(this.oExt, '', ['hover']);
            menu.hide();
            return true;
        }
    };

    /**** Init ****/

    this.$draw = function(isSkinSwitch){
        var p = this.parentNode;

        p.$getNewContext("item");
        var elItem = p.$getLayoutNode("item");

        var o = 'apf.lookup(' + this.uniqueId + ')';
        elItem.setAttribute("onmouseup",   o + '.$up(event)');
        elItem.setAttribute("onmouseover", o + '.$over(event)');
        elItem.setAttribute("onmouseout",  o + '.$out(event)');
        elItem.setAttribute("onmousedown", o + '.$down()');
        elItem.setAttribute("onclick",     o + '.$click()');

        apf.setStyleClass(elItem, this.tagName);

        this.oExt = apf.xmldb.htmlImport(elItem, this.parentNode.oInt);
        this.oCaption = p.$getLayoutNode("item", "caption", this.oExt)
        this.oIcon = p.$getLayoutNode("item", "icon", this.oExt);
        this.oHotkey = p.$getLayoutNode("item", "hotkey", this.oExt);

        if (!isSkinSwitch && this.nextSibling && this.nextSibling.oExt)
            this.oExt.parentNode.insertBefore(this.oExt, this.nextSibling.oExt);
    };

    /**
     * @private
     */
    this.loadAml = function(x, parentNode) {
        this.$aml = x;
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
                //this.caption = x.firstChild.nodeValue;
                this.setProperty("caption", x.firstChild.nodeValue);
            }
        }
    };
});
// #endif
