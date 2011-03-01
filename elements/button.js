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

// #ifdef __AMLBUTTON || __INC_ALL

/**
 * Element displaying a clickable rectangle that visually confirms to the
 * user when the area is clicked and then executes a command.
 *
 * @constructor
 * @define button, submit, trigger, reset
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.BaseButton
 */
apf.submit  = function(struct, tagName){
    this.$init(tagName || "submit", apf.NODE_VISIBLE, struct);
};

apf.trigger = function(struct, tagName){
    this.$init(tagName || "trigger", apf.NODE_VISIBLE, struct);
};

apf.reset   = function(struct, tagName){
    this.$init(tagName || "reset", apf.NODE_VISIBLE, struct);
};

apf.button  = function(struct, tagName){
    this.$init(tagName || "button", apf.NODE_VISIBLE, struct);
};

(function() {
    this.$useExtraDiv;
    this.$childProperty  = "caption";
    this.$inited         = false;
    this.$isLeechingSkin = false;
    this.$canLeechSkin   = true;

    /**** Properties and Attributes ****/

    this.$focussable  = apf.KEYBOARD; // This object can get the focus
    this.value        = null;
    
    this.$init(function(){
        //@todo reparenting
        var forceFocus, _self = this, lastDefaultParent;
        this.$propHandlers["default"] = function(value){
            if (parseInt(value) != value)
                value = apf.isTrue(value) ? 1 : 0;

            this["default"] = parseInt(value);
            
            if (!this.focussable && value || forceFocus)
                this.setAttribute("focussable", forceFocus = value);

            if (lastDefaultParent) {
                lastDefaultParent.removeEventListener("focus", setDefault);
                lastDefaultParent.removeEventListener("blur", removeDefault);
            }
            
            if (!value)
                return;

            var pNode = this.parentNode;
            while (pNode && !pNode.focussable && value--)
                pNode = pNode.parentNode;
                
            //Currrently only support for parentNode, this might need to be expanded
            if (pNode) {
                pNode.addEventListener("focus", setDefault);
                pNode.addEventListener("blur", removeDefault);
            }
        };
    
        function setDefault(e){
            if (e.defaultButtonSet || e.returnValue === false)
                return;
    
            e.defaultButtonSet = true;
    
            if (this.$useExtraDiv)
                _self.$ext.appendChild(apf.button.$extradiv);
    
            _self.$setStyleClass(_self.$ext, _self.$baseCSSname + "Default");
    
            if (e.srcElement != _self && _self.$focusParent) {
                _self.$focusParent.addEventListener("keydown", btnKeyDown);
            }
        }
    
        function removeDefault(e){
            if (this.$useExtraDiv && apf.button.$extradiv.parentNode == _self.$ext)
                _self.$ext.removeChild(apf.button.$extradiv);
    
            _self.$setStyleClass(_self.$ext, "", [_self.$baseCSSname + "Default"]);
    
            if (e.srcElement != _self && _self.$focusParent) {
                _self.$focusParent.removeEventListener("keydown", btnKeyDown);
            }
        }
    
        function btnKeyDown(e){
            var ml;
    
            var f = apf.document.activeElement;
            if (f) {
                if (f.hasFeature(apf.__MULTISELECT__))
                    return;
    
                ml = f.multiline;
            }
    
            if (!_self.$ext.onmouseup)
                return;
    
            if (ml && ml != "optional" && e.keyCode == 13
              && e.ctrlKey || (!ml || ml == "optional")
              && e.keyCode == 13 && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                apf.preventDefault(e.htmlEvent);
                _self.$ext.onmouseup(e.htmlEvent, true);
            }
        }
    
        this.addEventListener("focus", setDefault);
        this.addEventListener("blur", removeDefault);
        
        this.$enable = function(){
            if (this["default"]) {
                setDefault({});
                if (apf.document.activeElement)
                    apf.document.activeElement.focus(true);
            }
            
            if (this.state && this.value)
                this.$setState("Down", {});
            else if (this.$mouseOver)
                this.$updateState({}, "mouseover");
            else
                this.$doBgSwitch(1);
        };
    
        this.$disable = function(){
            if (this["default"])
                removeDefault({});
    
            this.$doBgSwitch(4);
            this.$setStyleClass(this.$ext, "",
                [this.$baseCSSname + "Over", this.$baseCSSname + "Down"]);
        };
    });

    /**
     * @attribute {String}  icon     the url from which the icon image is loaded.
     * @attribute {Boolean} state    whether this boolean is a multi state button.
     * @attribute {String}  value    the initial value of a state button.
     * @attribute {String}  color    the text color of the caption of this element.
     * @attribute {String}  caption  the text displayed on this element indicating the action when the button is pressed.
     * @attribute {String}  action   one of the default actions this button can perform when pressed.
     *   Possible values:
     *   undo     Executes undo on the action tracker of the target element.
     *   redo     Executes redo on the action tracker of the target element.
     *   remove   Removes the selected node(s) of the target element.
     *   add      Adds a node to the target element.
     *   rename   Starts the rename function on the target element.
     *   login    Calls log in on the auth element with the values of the textboxes of type username and password.
     *   logout   Calls lot out on the auth element.
     *   submit   Submits the data of a model specified as the target.
     *   ok       Executes a commitTransaction() on the target element, and closes or hides that element.
     *   cancel   Executes a rollbackTransaction() on the target element, and closes or hides that element.
     *   apply    Executes a commitTransaction() on the target element.
     *   close    Closes the target element.
     * @attribute {String}  target   id of the element to apply the action to. Defaults to the parent container.
     * @attribute {Number}  default  Search depth for which this button is the default action. 1 specifies the direct parent. 2 the parent of this parent. Et cetera.
     * @attribute {String}  submenu  the name of the contextmenu to display when the button is pressed.
     */
    //this.$booleanProperties["default"] = true;
    this.$booleanProperties["state"]   = true;
    this.$supportedProperties.push("icon", "value", "tooltip", "state", 
        "color", "caption", "action", "target", "default", "submenu", "hotkey");

    this.$propHandlers["icon"] = function(value){
        // #ifdef __DEBUG
        if (!this.oIcon)
            return apf.console.warn("No icon defined in the Button skin", "button");
        /* #else
        if (!this.oIcon) return;
        #endif */

        if (value)
            this.$setStyleClass(this.$ext, this.$baseCSSname + "Icon");
        else
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Icon"]);

        apf.skins.setIcon(this.oIcon, value, this.iconPath);
    };

    this.$propHandlers["value"] = function(value){
        if (!this.state && !this.submenu)
            return;
        
        if (value === undefined)
            value = !this.value;
        this.value = value;

        if (this.value)
            this.$setState("Down", {});
        else
            this.$setState("Out", {});
    };

    this.$propHandlers["state"] = function(value){
        if (value)
            this.$setStateBehaviour(this.value);
        else 
            this.$setNormalBehaviour();
    };

    this.$propHandlers["color"] = function(value){
        if (this.oCaption)
            this.oCaption.parentNode.style.color = value;
    };

    this.$propHandlers["caption"] = function(value){
        if (!this.oCaption)
            return;

        if (value)
            this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Empty"]);
        else
            this.$setStyleClass(this.$ext, this.$baseCSSname + "Empty");

        if (this.oCaption.nodeType == 1)
            this.oCaption.innerHTML = String(value || "").trim();
        else
            this.oCaption.nodeValue = String(value || "").trim();
    };

    //#ifdef __WITH_HOTKEY
    /**
     * @attribute {String} hotkey the key combination a user can press
     * to active the function of this element. Use any combination of
     * Ctrl, Shift, Alt, F1-F12 and alphanumerical characters. Use a
     * space, a minus or plus sign as a seperator.
     * Example:
     * <code>
     *  <a:button hotkey="Ctrl-Z">Undo</a:button>
     * </code>
     */
    this.$propHandlers["hotkey"] = function(value){
        if (this.$hotkey)
            apf.setNodeValue(this.$hotkey, value);

        if (this.$lastHotkey)
            apf.removeHotkey(this.$lastHotkey);

        if (value) {
            this.$lastHotkey = value;
            var _self = this;
            apf.registerHotkey(value, function(e){
                //hmm not very scalable...
                _self.$setState("Over", {});

                $setTimeout(function(){
                    _self.$setState("Out", {});
                }, 200);

                if (_self.$clickHandler && _self.$clickHandler())
                    _self.$updateState(e || event, "click");
                else
                    _self.dispatchEvent("click");
            });
        }

        if (this.tooltip)
            apf.GuiElement.propHandlers.tooltip.call(this, this.tooltip);
    }
    //#endif

    //#ifdef __AMLTOOLBAR || __INC_ALL

    //@todo move this to menu.js
    function menuKeyHandler(e){
        return;
        var key = e.keyCode;

        var next, nr = apf.getChildNumber(this);
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
        var menu = self[this.submenu],
            $button1;

        this.value = !this.value;

        if (this.value)
            this.$setState("Down", {});

        //#ifdef __DEBUG
        if (!menu) {
            throw new Error(apf.formatErrorString(0, this,
                "Showing submenu",
                "Could not find submenu '" + this.submenu + "'"));
        }
        //#endif

        var menuPressed = this.parentNode.menuIsPressed;
        if (menuPressed && menuPressed != this) {
            menuPressed.setValue(false);
            var oldMenu = self[menuPressed.submenu];
            if (oldMenu != self[this.submenu])
                oldMenu.$propHandlers["visible"].call(oldMenu, false, true);
        }
        
        if (!this.value) {
            menu.hide();
            this.$setState("Over", {}, "toolbarover");

            if($button1 = this.parentNode.$button1)
                $button1.$setState("Over", {}, "toolbarover");

            this.parentNode.menuIsPressed = false;
            if (this.parentNode.hasMoved)
                this.value = false;

            if (apf.hasFocusBug)
                apf.window.$focusfix();

            return false;
        }

        this.parentNode.menuIsPressed = this;

        //var pos = apf.getAbsolutePosition(this.$ext, menu.$ext.offsetParent);
        menu.display(null, null, false, this,
            null, null, this.$ext.offsetWidth - 2);

        this.parentNode.hasMoved = false;

        if (e)
            apf.stopPropagation(e.htmlEvent);

        return false;
    }

    function menuOver(){
        var menuPressed = this.parentNode.menuIsPressed;

        if (!menuPressed || menuPressed == this)
            return;

        var menu = self[this.submenu];
        if (menu.pinned)
            return;

        menuPressed.setValue(false);
        var oldMenu = self[menuPressed.submenu];
        oldMenu.$propHandlers["visible"].call(oldMenu, false, true);//.hide();

        this.setValue(true);
        this.parentNode.menuIsPressed = this;

        //#ifdef __DEBUG
        if (!menu) {
            throw new Error(apf.formatErrorString(0, this,
                "Showing submenu",
                "Could not find submenu '" + this.submenu + "'"));
        }
        //#endif

        var pos = apf.getAbsolutePosition(this.$ext, menu.$ext.offsetParent);

        menu.display(pos[0],
            pos[1] + this.$ext.offsetHeight, true, this,
            null, null, this.$ext.offsetWidth - 2);

        //apf.window.$focus(this);
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
            if (this.value && this.parentNode) {
                //#ifdef __DEBUG
                try{
                //#endif
                menuDown.call(this);
                //#ifdef __DEBUG
                }catch(ex){}
                //#endif
            }

            this.$focussable = true;
            this.$setNormalBehaviour();
            this.removeEventListener("mousedown", menuDown);
            this.removeEventListener("mouseover", menuOver);
            this.removeEventListener("keydown", menuKeyHandler, true);
            return;
        }

        this.$focussable = false;
        this.$setStateBehaviour();

        this.addEventListener("mouseover", menuOver);
        this.addEventListener("mousedown", menuDown);
        this.addEventListener("keydown", menuKeyHandler, true);
    };
    //#endif

    /**** Public Methods ****/

    //#ifdef __WITH_CONVENIENCE_API

    /**
     * Sets the value of this element. This should be one of the values
     * specified in the values attribute.
     * @param {String} value the new value of this element
     */
    this.setValue = function(value){
        this.setProperty("value", value, false, true);
    };
    
    this.showMenu = function(){
        if (this.submenu && !this.value)
            menuDown.call(this);
    }
    
    this.hideMenu = function(){
        if (this.submenu && this.value)
            menuDown.call(this);
    }

    /**
     * Sets the text displayed as caption of this element.
     *
     * @param  {String}  value  required  The string to display.
     * @see    baseclass.validation
     */
    this.setCaption = function(value){
        this.setProperty("caption", value, false, true);
    };

    /**
     * Sets the URL of the icon displayed on this element.
     *
     * @param  {String}  value  required  The URL to the location of the icon.
     * @see    element.button
     * @see    element.modalwindow
     */
    this.setIcon = function(url){
        this.setProperty("icon", url, false, true);
    };
    
    //#endif

    /**** Private state methods ****/

    this.$setStateBehaviour = function(value){
        this.value     = value || false;
        this.isBoolean = true;
        this.$setStyleClass(this.$ext, this.$baseCSSname + "Bool");

        if (this.value) {
            this.$setStyleClass(this.$ext, this.$baseCSSname + "Down");
            this.$doBgSwitch(this.states["Down"]);
        }
    };

    this.$setNormalBehaviour = function(){
        this.value     = null;
        this.isBoolean = false;
        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Bool"]);
    };

    this.$setState = function(state, e, strEvent){
        var parentNode = this.parentNode;
        //if (this.disabled)
            //return;

        if (strEvent && this.dispatchEvent(strEvent, {htmlEvent: e}) === false)
            return;
        
        if(parentNode && parentNode.$button2 && parentNode.$button2.value && !this.submenu)
            return;

        this.$doBgSwitch(this.states[state]);
        var bs = this.$baseCSSname;
        this.$setStyleClass(this.$ext, (state != "Out" ? bs + state : ""),
            [(this.value ? "" : bs + "Down"), bs + "Over"]);

        if (this.submenu) {
            bs = this.$baseCSSname + "menu";
            this.$setStyleClass(this.$ext, (state != "Out" ? bs + state : ""),
            [(this.value ? "" : bs + "Down"), bs + "Over"]);
        }

        //if (state != "Down")
            //e.cancelBubble = true;
    };

    this.$clickHandler = function(){
        // This handles the actual OnClick action. Return true to redraw the button.
        if (this.isBoolean && !this.submenu) {
            this.setProperty("value", !this.value);
            return true;
        }
    };

    //#ifdef __AMLTOOLBAR || __INC_ALL
    this.$submenu = function(hide, force){
        if (hide) {
            this.setValue(false);
            this.$setState("Out", {}, "mouseout");
            if(this.parentNode)
                this.parentNode.menuIsPressed = false;
        }
    };
    //#endif

    /**** Init ****/

    this.addEventListener("$skinchange", function(e){
        if (this.tooltip)
            apf.GuiElement.propHandlers.tooltip.call(this, this.tooltip);
    });

    this.$draw  = function(){
        var pNode, isToolbarButton = (pNode = this.parentNode) 
            && pNode.parentNode.localName == "toolbar";
        
        if (isToolbarButton) {
            if (typeof this.focussable == "undefined")
                this.focussable = false;
            
            this.$focussable = apf.KEYBOARD;
        }

        //Build Main Skin
        this.$ext     = this.$getExternal();
        this.oIcon    = this.$getLayoutNode("main", "icon", this.$ext);
        this.oCaption = this.$getLayoutNode("main", "caption", this.$ext);

        this.$useExtraDiv = apf.isTrue(this.$getOption("main", "extradiv"));
        if (!apf.button.$extradiv && this.$useExtraDiv) {
            (apf.button.$extradiv = document.createElement("div"))
                .className = "extradiv"
        }

        if (this.localName == "submit")
            this.action = "submit";
        else if (this.localName == "reset")
            this.action = "reset";

        this.$setupEvents();
    };

    //#ifdef __WITH_SKIN_CHANGE
    this.addEventListener("$skinchange", function(){
        if (this.caption)
            this.$propHandlers["caption"].call(this, this.caption);

        if (this.icon)
            this.$propHandlers["icon"].call(this, this.icon);

        this.$updateState({reset:1});
        //this.$blur();

        //if (this.$focussable !== true && this.hasFocus())
            //apf.window.$focusLast(this.$focusParent);
    });
    //#endif

    //#ifdef __ENABLE_BUTTON_ACTIONS
    //@todo solve how this works with XForms
    this.addEventListener("click", function(e){
        var action = this.action;

        //#-ifdef __WITH_HTML5
        if (!action)
            action = this.localName;
        //#-endif

        var _self = this;
        $setTimeout(function(){
            (apf.button.actions[action] || apf.K).call(_self);
        });
    });
    //#endif

    /* #ifdef __WITH_XFORMS

    //XForms support
    if (this.localName == "trigger") {
        this.addEventListener("click", function(e){
            this.dispatchXFormsEvent("DOMActivate", e);
        });
    }

    //XForms support
    this.action = (this.localName == "submit")
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
                throw new Error(apf.formatErrorString(0, this,
                    "Submission",
                    "Could not find submission to execute action on '"
                    + this.submission + "'", this.$aml));

            submission.dispatchXFormsEvent("xforms-submit");

            return;
        }
        else
            if (this.target) {
                //#ifdef __DEBUG
                if (!self[this.target])
                    throw new Error(apf.formatErrorString(0, this,
                        "Clicking on Button",
                        "Could not find target to execute action on '"
                        + this.target + "' with action '"
                        + this.action + "'", this.$aml));
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
                        throw new Error(apf.formatErrorString(0, this,
                            "Clicking on Button",
                            "Could not find target to for action '"
                            + this.action + "'", this.$aml));
                    //#endif
                }
            }

        //#ifdef __DEBUG
        if (!target[this.action])
            throw new Error(apf.formatErrorString(0, this,
                "Clicking on Button",
                "Could not find action on target.", this.$aml));
        //#endif

        target[this.action]();
    });

    //if(x.getAttribute("condition")) this.condition = x.getAttribute("condition");
    //this.form.registerButton(this.action, this);

    #endif*/
}).call(apf.button.prototype = new apf.BaseButton());

// submit, trigger, reset, button
apf.submit.prototype  =
apf.trigger.prototype =
apf.reset.prototype   = apf.button.prototype;

apf.aml.setElement("submit",  apf.submit);
apf.aml.setElement("trigger", apf.trigger);
apf.aml.setElement("reset",   apf.reset);
apf.aml.setElement("button",  apf.button);

//#ifdef __ENABLE_BUTTON_ACTIONS
apf.submit.action   =
apf.trigger.actions =
apf.reset.actions   =
apf.button.actions  = {
    // #ifdef __WITH_ACTIONTRACKER
    "undo" : function(action){
        var tracker;
        if (this.target && self[this.target]) {
            tracker = self[this.target].localName == "actiontracker"
                ? self[this.target]
                : self[this.target].getActionTracker();
        }
        else {
            var at, node = this;
            while(node.parentNode)
                at = (node = node.parentNode).$at;
        }

        (tracker || apf.window.$at)[action || "undo"]();
    },

    "redo" : function(){
        apf.button.actions.undo.call(this, "redo");
    },
    //#endif

    //#ifdef __WITH_MULTISELECT
    "remove" : function(){
        if (this.target && self[this.target])
            self[this.target].remove()
        //#ifdef __DEBUG
        else
            apf.console.warn("Target to remove wasn't found or specified:'"
                             + this.target + "'");
        //#endif
    },

    "add" : function(){
        if (this.target && self[this.target])
            self[this.target].add()
        //#ifdef __DEBUG
        else
            apf.console.warn("Target to add wasn't found or specified:'"
                             + this.target + "'");
        //#endif
    },

    "rename" : function(){
        if (this.target && self[this.target])
            self[this.target].startRename()
        //#ifdef __DEBUG
        else
            apf.console.warn("Target to rename wasn't found or specified:'"
                             + this.target + "'");
        //#endif
    },
    //#endif

    //#ifdef __WITH_AUTH
    "login" : function(){
        var parent = this.target && self[this.target]
            ? self[this.target]
            : this.parentNode;

        var vg = parent.$validgroup || new apf.ValidationGroup();
        if (!vg.childNodes.length)
            vg.childNodes = parent.childNodes.slice();

        var vars = {};
        function loopChildren(nodes){
            for (var node, i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i];

                if (node.hasFeature(apf.__VALIDATION__)
                  && !node.$validgroup && !node.form) {
                    node.setProperty("validgroup", vg);
                }

                if (node.type)
                    vars[node.type] = node.getValue();

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
            throw new Error(apf.formatErrorString(0, this,
                "Clicking the login button",
                "Could not find the username or password box"));
            //#endif

            return;
        }

        var auth = this.ownerDocument.getElementsByTagNameNS(apf.ns.apf,"auth")[0];
        if (!auth)
            return;
       
        auth.logIn(vars.username, vars.password);
        //apf.auth.login(vars.username, vars.password);
    },

    "logout" : function(){
        var auth = this.ownerDocument.getElementsByTagNameNS(apf.ns.apf, "auth")[0];
        if (!auth)
            return;

        auth.logOut();
    },
    //#endif

    //#ifdef __WITH_MODEL
    "submit" : function(doReset){
        var vg, model;

        var parent = this.target && self[this.target]
            ? self[this.target]
            : this.parentNode;

        if (parent.$isModel)
            model = parent;
        else {
            if (!parent.$validgroup) {
                parent.$validgroup = parent.validgroup
                    ? self[parent.validgroup]
                    : new apf.ValidationGroup();
            }

            vg = parent.$validgroup;
            if (!vg.childNodes.length)
                vg.childNodes = parent.childNodes.slice();

            function loopChildren(nodes){
                for (var node, i = 0, l = nodes.length; i < l; i++) {
                    node = nodes[i];

                    if (node.getModel) {
                        model = node.getModel();
                        if (model)
                            return false;
                    }

                    if (node.childNodes.length)
                        if (loopChildren(node.childNodes) === false)
                            return false;
                }
            }
            loopChildren(parent.childNodes);

            if (!model) {
                model = apf.globalModel;
                if (!model) {
                    //#ifdef __DEBUG
                    throw new Error(apf.formatErrorString(0, this,
                        "Finding a model to submit",
                        "Could not find a model to submit."));
                    //#endif
    
                    return;
                }
            }
        }

        if (doReset) {
            model.reset();
            return;
        }

        if (vg && !vg.isValid())
            return;

        model.submit();
    },

    "reset" : function(){
        apf.button.actions["submit"].call(this, true);
    },
    //#endif

    //#ifdef __WITH_TRANSACTION
    "ok" : function(){
        var node;

        if (this.target) {
            node = self[this.target];
        }
        else {
            var node = this.parentNode;
            while (node && !node.hasFeature(apf.__TRANSACTION__)) {
                node = node.parentNode;
            }

            if (node && !node.hasFeature(apf.__TRANSACTION__))
                return;
        }

        if (node.commit() && node.close) 
            node.close();
    },

    "cancel" : function(){
        var node;

        if (this.target) {
            node = self[this.target];
        }
        else {
            var node = this.parentNode;
            while (node && !node.hasFeature(apf.__TRANSACTION__)) {
                node = node.parentNode;
            }

            if (node && !node.hasFeature(apf.__TRANSACTION__))
                return;
        }

        node.rollback();
        if (node.close)
            node.close();
    },

    "apply" : function(){
        var node;

        if (this.target) {
            node = self[this.target];
        }
        else {
            var node = this.parentNode;
            while (node && !node.hasFeature(apf.__TRANSACTION__)) {
                node = node.parentNode;
            }

            if (node && !node.hasFeature(apf.__TRANSACTION__))
                return;
        }

        if (node.autoshow)
            node.autoshow = -1;
        if (node.commit(true))
            node.begin("update");
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
            apf.console.warn("Target to close wasn't found or specified:'"
                             + this.target + "'");
        //#endif
    }
};
//#endif

// #endif
