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

// #ifdef __JBUTTON || __INC_ALL
// #define __WITH_PRESENTATION 1
// #define __JBASEBUTTON 1

/**
 * Component displaying a clickable rectangle that visually confirms the
 * user interaction and executes a command when clicked.
 *
 * @classDescription		This class creates a new button
 * @return {Button} Returns a new button
 * @type {Button}
 * @constructor
 * @addnode components:button, components:trigger, components:submit
 * @alias submit
 * @alias trigger
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits jpf.Presentation
 * @inherits jpf.BaseButton
 */

jpf.submit  = 
jpf.trigger = 
jpf.button  = jpf.component(jpf.NODE_VISIBLE, function(){
    var useExtraDiv;
    var _self = this;
    
    // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
    this.editableParts = {
        "main": [["caption", "text()"]]
    };
    // #endif
    
    /* #ifdef __WITH_EDITMODE
     this.editableEvents = {"click":true}
    #endif */
     
    /**** Properties and Attributes ****/
    
    this.$focussable = true; // This object can get the focus
    this.value       = null;
    
    this.$booleanProperties["default"] = true;
    
    this.$supportedProperties.push("icon", "value", "tooltip", "state", 
        "color", "caption", "action", "target", "default");

    this.$propHandlers["icon"] = function(value){
        if (!this.oIcon) return;
        
        if (value)
            this.$setStyleClass(this.oExt, this.baseCSSname + "Icon");
        else
            this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Icon"]);
        
        jpf.skins.setIcon(this.oIcon, value, this.iconPath);
    };

    this.$propHandlers["value"] = function(value){
        if (value === undefined) 
            value = !this.value;
        this.value = value;
        
        if (this.value) 
            this.$setState("Down", {});
        else 
            this.$setState("Out", {});
        
        this.dispatchEvent("click");
    };

    this.$propHandlers["tooltip"] = function(value){
        this.oExt.setAttribute("title", value);
    };

    this.$propHandlers["state"] = function(value){
        this.$setStateBehaviour(value == 1);
    };

    this.$propHandlers["color"] = function(value){
        if (this.oCaption)
            this.oCaption.parentNode.style.color = value;
    };

    this.$propHandlers["caption"] = function(value){
        if (this.oCaption) 
            this.oCaption.nodeValue = value;
    };

    //@todo reparenting
    this.$propHandlers["default"] = function(value){
        this.parentNode.removeEventListener("focus", setDefault);
        this.parentNode.removeEventListener("blur", removeDefault);
        
        if (!value)
            return;
        
        //Currrently only support for parentNode, this might need to be expanded
        this.parentNode.addEventListener("focus", setDefault);
        this.parentNode.addEventListener("blur", removeDefault);
    };
    
    function setDefault(e){
        if (e.defaultButtonSet || e.returnValue === false)
            return;
            
        e.defaultButtonSet = true;
        
        if (useExtraDiv)
            _self.oExt.appendChild(jpf.button.$extradiv);
        
        _self.$setStyleClass(_self.oExt, _self.baseCSSname + "Default");
        
        if (e.srcElement != _self) {
            jpf.addEventListener("keydown", btnKeyDown, e);
        }
    }
    
    function removeDefault(e){
        if (useExtraDiv && jpf.button.$extradiv.parentNode == _self.oExt)
            _self.oExt.removeChild(jpf.button.$extradiv);
        
        _self.$setStyleClass(_self.oExt, "", [_self.baseCSSname + "Default"]);
        
        if (e.srcElement != _self) {
            jpf.removeEventListener("keydown", btnKeyDown);
        }
    }
    
    function btnKeyDown(e){
        var ml = jpf.window.focussed.multiline;
        
        if (ml && ml != "optional" && e.keyCode == 13 
          && e.ctrlKey || (!ml || ml == "optional") 
          && e.keyCode == 13 && !e.ctrlKey && !e.shiftKey && !e.altKey)
            _self.oExt.onmouseup(e.htmlEvent, true);
    }
    
    this.addEventListener("focus", setDefault);
    this.addEventListener("blur", removeDefault);
    
    //#ifdef __JTOOLBAR
    
    //@todo move this to menu.js
    function menuKeyHandler(e){
        return;
        var key = e.keyCode;
        
        var next, nr = jpf.xmldb.getChildNumber(this);
        if (key == 37) { //left
            next = nr == 0 
                ? this.parentNode.childNodes.length - 1 
                : nr - 1;
            this.parentNode.childNodes[next].dispatchEvent("mouseover");
        }
        else if (key == 39) { //right
            next = (nr >= this.parentNode.childNodes.length - 1) 
                ? 0 
                : nr + 1;
            this.parentNode.childNodes[next].dispatchEvent("mouseover");
        }
    }
    
    function menuDown(e){
        var menu = self[this.submenu];
        
        this.value = !this.value;
        
        if (this.value)
            this.$setState("Down", {});
            
        //#ifdef __DEBUG
        if (!menu) {
            throw new Error(jpf.formatErrorString(0, this,
                "Showing submenu",
                "Could not find submenu '" + this.submenu + "'"));
        }
        //#endif
        
        if (!this.value) {
            menu.hide();
            this.$setState("Over", {}, "toolbarover");
            
            this.parentNode.menuIsPressed = false;
            if (this.parentNode.hasMoved) 
                this.value = false;
            
            if (jpf.hasFocusBug)
                jpf.window.$focusfix();
            
            return false;
        }
        
        this.parentNode.menuIsPressed = this;
        
        var pos = jpf.getAbsolutePosition(this.oExt, menu.oExt.offsetParent);
        menu.display(pos[0] - (jpf.isIE ? 6 : 0), 
            pos[1] + this.oExt.offsetHeight - (jpf.isIE ? 6 : 0), false, this,
            null, null, this.oExt.offsetWidth - 2);
        
        this.parentNode.hasMoved = false;
        
        e.htmlEvent.cancelBubble = true;
        
        return false;
    }
    
    function menuOver(){
        var menuPressed = this.parentNode.menuIsPressed;
        
        if (!menuPressed || menuPressed == this)
            return;

        menuPressed.setValue(false);
        var oldMenu = self[menuPressed.submenu];
        oldMenu.$propHandlers["visible"].call(oldMenu, false, true);//.hide();
        
        this.setValue(true);
        this.parentNode.menuIsPressed = this;
        
        var menu = self[this.submenu];
        
        //#ifdef __DEBUG
        if (!menu) {
            throw new Error(jpf.formatErrorString(0, this,
                "Showing submenu",
                "Could not find submenu '" + this.submenu + "'"));
        }
        //#endif
        
        var pos = jpf.getAbsolutePosition(this.oExt, menu.oExt.offsetParent);
        
        menu.display(pos[0] - (jpf.isIE ? 6 : 0), 
            pos[1] + this.oExt.offsetHeight - (jpf.isIE ? 6 : 0), true, this,
            null, null, this.oExt.offsetWidth - 2);
        
        //jpf.window.$focus(this);
        this.$focus();
        
        this.parentNode.hasMoved = true;
        
        return false;
    }
    
    /**
     * @attribute {string} submenu If this attribute is set, the button will 
     * function like a menu button
     */
    this.$propHandlers["submenu"] = function(value){
        if (!value){
            if (this.value && this.parentNode)
                menuDown.call(this);
            
            this.$focussable = true;
            this.$setNormalBehaviour();
            this.removeEventListener("mousedown", menuDown);
            this.removeEventListener("mouseover", menuOver);
            this.removeEventListener("keydown", menuKeyHandler);
            return;
        }
        
        this.$focussable = false;
        this.$setStateBehaviour();
        
        this.addEventListener("mousedown", menuDown);
        this.addEventListener("mouseover", menuOver);
        this.addEventListener("keydown", menuKeyHandler);
    };
    //#endif

    /**** Public Methods ****/
    
    /**
     * @copy   Widget#setValue
     */
    this.setValue = function(value){
        this.setProperty("value", value);
    };
    
    /**
     * Sets the text displayed as caption of this component.
     *
     * @param  {String}  value  required  The string to display.
     * @see    Validation
     */
    this.setCaption = function(value){
        this.setProperty("caption", value);
    };
    
    /**
     * Sets the URL of the icon displayed on this component.
     *
     * @param  {String}  value  required  The URL to the location of the icon.
     * @see    Button
     * @see    ModalWindow
     */
    this.setIcon = function(url){
        this.setProperty("icon", url);
    };
    
    /**** Private state methods ****/
    
    this.setActive = 
    this.$enable   = function(){
        this.$doBgSwitch(1);
    };
    
    this.setInactive = 
    this.$disable    = function(){
        this.$doBgSwitch(4);
        this.$setStyleClass(this.oExt, "", 
            [this.baseCSSname + "Over", this.baseCSSname + "Down"]);
    };
    
    this.$setStateBehaviour = function(value){
        this.value     = value || false;
        this.isBoolean = true;
        this.$setStyleClass(this.oExt, this.baseCSSname + "Bool");
        
        if (this.value) {
            this.$setStyleClass(this.oExt, this.baseCSSname + "Down");
            this.$doBgSwitch(this.states["Down"]);
        }
    };
    
    this.$setNormalBehaviour = function(){
        this.value     = null;
        this.isBoolean = false;
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Bool"]);
    };
    
    this.$setState = function(state, e, strEvent){
        if (this.disabled) 
            return;

        if (strEvent && this.dispatchEvent(strEvent, {htmlEvent: e}) === false)
            return;

        this.$doBgSwitch(this.states[state]);
        var bs = this.baseCSSname;
        this.$setStyleClass(this.oExt, (state != "Out" ? bs + state : ""),
            [(this.value ? "" : bs + "Down"), bs + "Over"]);

        if (this.submenu) {
            bs = this.baseCSSname + "menu";
            this.$setStyleClass(this.oExt, (state != "Out" ? bs + state : ""), 
            [(this.value ? "" : bs + "Down"), bs + "Over"]);
        }
        
        //if (state != "Down") 
            //e.cancelBubble = true;
    };
    
    this.$clickHandler = function(){
        // This handles the actual OnClick action. Return true to redraw the button.
        if (this.isBoolean && !this.submenu) {
            this.value = !this.value;
            return true;
        }
    };
    
    //#ifdef __JTOOLBAR
    this.$submenu = function(hide, force){
        if (hide) {
            this.setValue(false);
            this.$setState("Out", {}, "mouseout");
            this.parentNode.menuIsPressed = false;
        }
    };
    //#endif
    
    /**** DOM Hooks ****/
    
    //@todo can't we make this generic for button, bar, page, divider and others, maybe in presentation
    this.$domHandlers["reparent"].push(
        function(beforeNode, pNode, withinParent){
            if (!this.$jmlLoaded)
                return;
            
            var skinName;
            if (isUsingParentSkin && !withinParent 
              && this.skinName != pNode.skinName
              || !isUsingParentSkin && (skinName = this.parentNode.$getOption 
              && this.parentNode.$getOption("main", "button-skin"))) {
                isUsingParentSkin = true;
                this.$forceSkinChange(this.parentNode.skinName.split(":")[0] + ":" + skinName);
            }
        });
    
    /**** Init ****/
    
    var inited = false, isUsingParentSkin = false;
    this.$draw  = function(){
        var skinName;
        if (this.parentNode && (skinName = this.parentNode.$getOption 
          && this.parentNode.$getOption("main", "button-skin"))) {
            isUsingParentSkin = true;
            skinName = this.parentNode.skinName.split(":")[0] + ":" + skinName;
            if (this.skinName != skinName)
                this.$loadSkin(skinName);
            this.$focussable = jpf.KEYBOARD;
        }
        else if(isUsingParentSkin){
            isUsingParentSkin = false;
            this.$loadSkin();
            this.$focussable = true;
        }
        
        //Build Main Skin
        this.oExt     = this.$getExternal();
        this.oIcon    = this.$getLayoutNode("main", "icon", this.oExt);
        this.oCaption = this.$getLayoutNode("main", "caption", this.oExt);
        
        useExtraDiv = jpf.isTrue(this.$getOption("main", "extradiv"));
        if (!jpf.button.$extradiv && useExtraDiv) {
            (jpf.button.$extradiv = document.createElement("div"))
                .className = "extradiv"
        }
        
        this.$setupEvents();
    };
    
    //#ifdef __WITH_SKIN_CHANGE
    this.$skinchange = function(){
        if (this.caption)
            this.$propHandlers["caption"].call(this, this.caption);
            
        if (this.icon)
            this.$propHandlers["icon"].call(this, this.icon);

        this.$updateState({reset:1});
        //this.$blur();
        
        //if (this.$focussable !== true && this.hasFocus())
            //jpf.window.$focusLast(this.$focusParent);
    }
    //#endif
    
    this.$loadJml = function(x){
        if (!this.caption && x.firstChild)
            this.setProperty("caption", x.firstChild.nodeValue);
        
        /* #ifdef __WITH_EDITMODE
         if(this.editable)
         #endif */
        // #ifdef __WITH_LANG_SUPPORT || __WITH_EDITMODE
        this.$makeEditable("main", this.oExt, this.jml);
        // #endif
        
        if (!inited) {
            jpf.JmlParser.parseChildren(this.jml, null, this);
            inited = true;
        }
    };
    
    //#ifdef __WITH_BUTTON_ACTIONS
    //@todo solve how this works with XForms
    this.addEventListener("click", function(e){
        (jpf.button.actions[this.action] || jpf.K).call(this);
    });
    //#endif
    
    /* #ifdef __WITH_XFORMS
    
    //XForms support
    if (this.tagName == "trigger") {
        this.addEventListener("click", function(e){
            this.dispatchXFormsEvent("DOMActivate", e);
        });
    }
    
    //XForms support
    this.action = (this.tagName == "submit") 
        ? "submit" 
        : x.getAttribute("action");
    this.target = x.getAttribute("target");
    if (this.action == "submit") 
        this.submission = x.getAttribute("submission");
    
    this.addEventListener("click", function(e){
        if (!this.action) 
            return;
        var target;
        
        if (this.submission) {
            var submission = self[this.submission];
            if (!submission) 
                throw new Error(jpf.formatErrorString(0, this, 
                    "Submission", 
                    "Could not find submission to execute action on '" 
                    + this.submission + "'", this.jml));
            
            submission.dispatchXFormsEvent("xforms-submit");
            
            return;
        }
        else 
            if (this.target) {
                //#ifdef __DEBUG
                if (!self[this.target]) 
                    throw new Error(jpf.formatErrorString(0, this, 
                        "Clicking on Button", 
                        "Could not find target to execute action on '" 
                        + this.target + "' with action '" 
                        + this.action + "'", this.jml));
                //#endif
                
                target = self[this.target]
            }
            else {
                var p = this;
                while (p.parentNode) {
                    if (p[this.action]) {
                        target = p;
                        break;
                    }
                    p = p.parentNode;
                };
                
                if (!target) {
                    target = this.getModel();
                    //#ifdef __DEBUG
                    if (!target) 
                        throw new Error(jpf.formatErrorString(0, this, 
                            "Clicking on Button", 
                            "Could not find target to for action '" 
                            + this.action + "'", this.jml));
                    //#endif
                }
            }
        
        //#ifdef __DEBUG
        if (!target[this.action])
            throw new Error(jpf.formatErrorString(0, this, 
                "Clicking on Button", 
                "Could not find action on target.", this.jml));
        //#endif
        
        target[this.action]();
    });
    
    //if(x.getAttribute("condition")) this.condition = x.getAttribute("condition");
    //this.form.registerButton(this.action, this);
    
    #endif*/
}).implement(jpf.Presentation, jpf.BaseButton);

//#ifdef __WITH_BUTTON_ACTIONS
jpf.button.actions = {
    // #ifdef __WITH_APP
    "undo" : function(action){
        var tracker;
        if (this.target && self[this.target]) {
            tracker = self[this.target].getActionTracker()
        }
        else {
            var at, node = this.parentNode;
            while(node)
                at = (node = node.parentNode).$at;
        }
        
        (tracker || jpf.window.$at)[action || "undo"]();
    },
    
    "redo" : function(){
        jpf.button.actions.call(this, "redo");
    },
    //#endif
    
    //#ifdef __WITH_MULTISELECT
    "remove" : function(){
        if (this.target && self[this.target])
            self[this.target].remove()
        //#ifdef __DEBUG
        else
            jpf.console.warn("Target to remove wasn't found or specified:'" 
                             + this.target + "'");
        //#endif
    },
    
    "add" : function(){
        if (this.target && self[this.target])
            self[this.target].add()
        //#ifdef __DEBUG
        else
            jpf.console.warn("Target to add wasn't found or specified:'" 
                             + this.target + "'");
        //#endif
    },
    
    "rename" : function(){
        if (this.target && self[this.target])
            self[this.target].startRename()
        //#ifdef __DEBUG
        else
            jpf.console.warn("Target to rename wasn't found or specified:'" 
                             + this.target + "'");
        //#endif
    },
    //#endif
    
    //#ifdef __WITH_AUTH
    "login" : function(){
        var parent = this.target && self[this.target]
            ? self[this.target]
            : this.parentNode;

        var vg = parent.$validgroup || new jpf.ValidationGroup();
        if (!vg.childNodes.length)
            vg.childNodes = parent.childNodes.slice();
        
        var vars = {};
        function loopChildren(nodes){
            for (var node, i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i];
                
                if (node.hasFeature(__VALIDATION__) 
                  && !node.$validgroup && !node.form) {
                    node.setProperty("validgroup", vg);
                }
                
                if (node.jml.getAttribute("type"))
                    vars[node.jml.getAttribute("type")] = node.getValue();
                
                if (vars.username && vars.password)
                    return;
                
                if (node.childNodes.length)
                    loopChildren(node.childNodes);
            }
        }
        loopChildren(parent.childNodes);
        
        if (!vg.isValid())
            return;
        
        if (!vars.username || !vars.password) {
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, this, 
                "Clicking the login button", 
                "Could not find the username or password box"));
            //#endif
            
            return;
        }

        jpf.auth.login(vars.username, vars.password);
    },
    
    "logout" : function(){
        jpf.auth.logout();
    },
    //#endif
    
    //#ifdef __WITH_TRANSACTION
    //@todo implement and test this
    "ok" : function(){
        
    },
    
    "cancel" : function(){
        
    },
    
    "apply" : function(){
        
    },
    //#endif
    
    "close" : function(){
        var parent = this.target && self[this.target]
            ? self[this.target]
            : this.parentNode;
        
        while(parent && !parent.close)
            parent = parent.parentNode;
        
        if (parent && parent.close)
            parent.close();
        //#ifdef __DEBUG
        else
            jpf.console.warn("Target to close wasn't found or specified:'" 
                             + this.target + "'");
        //#endif
    }
};
//#endif

// #endif