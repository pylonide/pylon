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

__JMLNODE__    = 1 << 15;
__VALIDATION__ = 1 << 6;

// #ifdef __WITH_APP

/**
 * Baseclass for any Javeline Markup Language component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.JmlNode = function(){
    /**
     * Returns a string representation of this component.
     *
     * @return  {String}  a representation of this component
     */
    this.toString = function(){
        return "[Javeline Component : " + (this.name || this.uniqueId || "") + " (" + this.tagName + ")]";
    };
    
    this.$regbase = this.$regbase|__JMLNODE__;
    var _self     = this;
    
    /**** Convenience functions for gui nodes ****/
    
    if (this.nodeType == jpf.GUI_NODE) {
        
        //#ifdef __WITH_CONVENIENCE_API
        
        /**** Geometry ****/
        
        /**
         * Set the different between the left edge and the right edge of this component in pixels.
         *
         * @param  {Integer}  value  reguired 
         */
        this.setWidth = function(value){
            this.setProperty("width", value);
        };
        
        /**
         * Set the different between the top edge and the bottom edge of this component in pixels.
         *
         * @param  {Integer}  value  reguired 
         */
        this.setHeight = function(value){
            this.setProperty("height", value);
        };
        
        this.setLeft   = function(value){
            this.setProperty("left", value);
        };
        
        this.setTop    = function(value){
            this.setProperty("top", value);
        };
        
        this.$noAlignUpdate = false;
        if (!this.show)
            this.show = function(s){
                this.$noAlignUpdate = s;
                this.setProperty("visible", true);
                this.$noAlignUpdate = false;
            };
        if (!this.hide)
            this.hide = function(s){
                this.$noAlignUpdate = s;
                this.setProperty("visible", false);
                this.$noAlignUpdate = false;
            };
        
        this.getWidth  = function(){
            return (this.oExt || {}).offsetWidth;
        };
        
        this.getHeight = function(){
            return (this.oExt || {}).offsetHeight;
        };
        
        this.getLeft   = function(){
            return (this.oExt || {}).offsetLeft;
        };
        
        this.getTop    = function(){
            return (this.oExt || {}).offsetTop;
        };
        
        /**** Disabling ****/
        
        this.enable  = function(){
            this.setProperty("disabled", false);
        };
        
        this.disable = function(){
            this.setProperty("disabled", true);
        };
        
        /**** z-Index ****/
        // @todo: rename this function to 'sendToBack()'
        this.sentToBack    = function(){
            this.setProperty("zindex", 0);
        };
        
        this.bringToFront  = function(){
            this.setProperty("zindex", jpf.all.length + 1);
        };
        
        this.sentBackwards = function(){
            this.setProperty("zindex", this.zindex - 1);
        };
        
        this.bringForward  = function(){
            this.setProperty("zindex", this.zindex + 1);
        };
        
        //#endif
        
        /**** Focussing ****/
    
        if (this.$focussable) {
            this.setTabIndex = function(tabindex){
                jpf.window.$removeFocus(this);
                jpf.window.$addFocus(this, tabindex);
            };
            
            this.focus = function(noset , e){
                this.$focus(e);
                if (!noset) jpf.window.$focus(this);
                
                this.dispatchEvent("focus", {
                    srcElement : this,
                    bubbles    : true
                });
            };
            
            this.blur = function(noset, e){
                this.$blur(e);
                if (!noset) jpf.window.$blur(this);
                
                this.dispatchEvent("blur", {
                    srcElement : this,
                    bubbles    : !e || !e.cancelBubble
                });
            };
            
            this.hasFocus = function(){
                return jpf.window.focussed = this;
            };
        }
    }
    
    /**** Load JML ****/
    
    // #ifdef __WITH_JMLDOM
    if (!this.hasFeature(__JMLDOM__))
        this.inherit(jpf.JmlDom); /** @inherits jpf.JmlDom */
    // #endif
    
    this.loadJml = function(x, pJmlNode, ignoreBindclass, id){
        this.name = x.getAttribute("id");
        if (this.name)
            jpf.setReference(this.name, this);
        
        if (!x) 
            x = this.jml;
        
        // #ifdef __WITH_JMLDOM
        if (this.parentNode || pJmlNode)
            this.$setParent(this.parentNode || pJmlNode);
        // #endif
        
        this.jml = x;
        
        //Drawing, Skinning, Positioning and Editing
        if (this.nodeType != jpf.NOGUI_NODE) {
            /* #ifdef __WITH_EDITMODE
            this.inherit(jpf.EditMode); // @inherits jpf.EditMode 
            if(jpf.xmldb.getInheritedAttribute(x, "editmode") == "true")
                this.enableEditing();
            #endif */
            
            // #ifdef __WITH_LANG_SUPPORT && !__WITH_EDITMODE
            this.inherit(jpf.MultiLang); /** @inherits jpf.MultiLang */
            // #endif
            
            if (this.$loadSkin)
                this.$loadSkin();
            
            if (this.$draw)
                this.$draw();
            
            if (id)
                this.oExt.setAttribute("id", id);

            var pTagName = x.parentNode && x.parentNode[jpf.TAGNAME] || "";
            //#ifdef __WITH_GRID
            if (pTagName == "grid") {
                //#ifdef __WITH_ANCHORING
                this.inherit(jpf.Anchoring); 
                //#endif

                this.$propHandlers["width"]  = 
                this.$propHandlers["height"] = 
                this.$propHandlers["span"]   = this.parentNode.$updateTrigger;
            }
            else
            //#endif

            //#ifdef __WITH_ALIGNMENT
            if (x.getAttribute("align") 
              || x.parentNode && x.parentNode.nodeType == 1 
              && "vbox|hbox".indexOf(pTagName) > -1) { //@todo temp
                this.inherit(jpf.Alignment); /** @inherits jpf.Alignment */
                this.oExt.style.display = "none";
                this.enableAlignment();
            }
            else
            //#endif

            //#ifdef __WITH_ANCHORING
            {
                this.inherit(jpf.Anchoring); /** @inherits jpf.Anchoring */
                this.enableAnchoring();
            }
            /* #else
            {
                this.$supportedProperties.push("width", "left", "top", "height");
            }
            #endif*/
            
            if (this.visible === undefined)
                this.visible = true;
            
            this.$drawn = true;
        }
        else if (this.$draw)
            this.$draw();
        
        // #ifdef __DEBUG
        if (this.nodeType == jpf.GUI_NODE) {
            if (jpf.debug && this.oExt.nodeType)
                this.oExt.setAttribute("uniqueId", this.uniqueId);
        }
        // #endif
        
        if (!ignoreBindclass) { //Is this still needed?
            if (!this.hasFeature(__DATABINDING__) && x.getAttribute("smartbinding")) {
                this.inherit(jpf.DataBinding);
                this.$xmlUpdate = this.$load = function(){};
            }
        }
        
        /**** Properties and Attributes ****/
        
        // #ifdef __WITH_OFFLINE_STATE
        var offlineLookup;
        if (jpf.offline.state.enabled)
	        offlineLookup = jpf.offline.state.getAll(this); //@todo implement this
	    // #endif
        
        //Parse all attributes
        this.$noAlignUpdate = true;
        
        var value, name, type, l, a, i, attr = x.attributes;
        for (i = 0, l = attr.length; i < l; i++) {
            a     = attr[i];
            value = a.nodeValue;
            name  = a.nodeName;

            //#ifdef __WITH_PROPERTY_BINDING
            if (value && jpf.dynPropMatch.test(value)) {
                jpf.JmlParser.stateStack.push({
                    node  : this, 
                    name  : name, 
                    value : value
                });
            } else 
            //#endif
            {
                if (a.nodeName.indexOf("on") === 0) {
                    this.addEventListener(name, new Function(value));
                    continue;
                }
                
                //#ifdef __WITH_OFFLINE_STATE
                if (offlineLookup) {
                    value = offlineLookup[name] || value 
                        || this.defaults && this.defaults[name];
                    delete offlineLookup[name];
                }
                /* #else
                if (!value)
                    value = this.defaults && this.defaults[name];
                #endif */
                
                if (this.$booleanProperties[name])
                    value = jpf.isTrue(value);
                
                this[name] = value;
                (this.$propHandlers && this.$propHandlers[name] 
                  || jpf.JmlNode.propHandlers[name] || jpf.K).call(this, value)
            }
        }
        
        //#ifdef __WITH_OFFLINE_STATE
        for (name in offlineLookup) {
            value = offlineLookup[name]
            (this.$propHandlers && this.$propHandlers[name] 
                  || jpf.JmlNode.propHandlers[name] || jpf.K).call(this, value);
        }
        //#endif

        //#ifdef __WITH_APP_DEFAULTS
        //Get defaults from the defaults tag in appsettings
        if (jpf.appsettings.defaults[this.tagName]) {
            d = jpf.appsettings.defaults[this.tagName];
            for (i = 0, l = d.length; i < l; i++) {
                name = d[i][0], value = d[i][1];
                if (this[name] === undefined) {
                    if (this.$booleanProperties[name])
                        value = jpf.isTrue(value);
                    
                    this[name] = value;
                    (this.$propHandlers && this.$propHandlers[name] 
                      || jpf.JmlNode.propHandlers[name] || jpf.K)
                        .call(this, value, name);
                }
            }
        }
        //#endif
        
        this.$noAlignUpdate = false;
        
        if (this.$focussable && this.focussable === undefined)
            jpf.JmlNode.propHandlers.focussable.call(this);
        
        // isSelfLoading is set when JML is being inserted
        if (this.$loadJml && !this.$isSelfLoading)
            this.$loadJml(x);
        
        //Process JML Handlers
        for (i = this.$jmlLoaders.length - 1; i >= 0; i--)
            this.$jmlLoaders[i].call(this, x);
        
        this.$jmlLoaded = true;
        
        return this;
    };
    
    this.handlePropSet = function(prop, value, force){
        //#ifdef __WITH_PROPERTY_BINDING
        if (!force && this.XmlRoot && this.bindingRules
          && this.bindingRules[prop] && !this.ruleTraverse) {
            return jpf.xmldb.setNodeValue(this.getNodeFromRule(
                prop.toLowerCase(), this.XmlRoot, null, null, true), 
                value, !this.$onlySetXml);
        }
        //#endif
        /*#ifndef __WITH_PROPERTY_BINDING
        if(!force && prop == "value" && this.XmlRoot
          && this.bindingRules[this.mainBind] && !this.ruleTraverse)
            return jpf.xmldb.setNodeValue(this.getNodeFromRule(this.mainBind,
                this.XmlRoot, null, null, true), value, !this.$onlySetXml);
        #endif */

        if (this.$booleanProperties[prop])
            value = jpf.isTrue(value);

        this[prop] = value;

        if(this.$onlySetXml)
            return;
        
        return (this.$propHandlers && this.$propHandlers[prop] 
            || jpf.JmlNode.propHandlers[prop] 
            || jpf.K).call(this, value, force, prop);
    };
    
    this.replaceJml = function(jmlDefNode, oInt, oIntJML, isHidden){
        //#ifdef __DEBUG
        jpf.console.info("Remove all jml from element");
        //#endif
        
        //Remove All the childNodes
        for (var i = 0; i < this.childNodes.length; i++) {
            var oItem = this.childNodes[i];
            var nodes = oItem.childNodes;
            for (var k = 0; k < nodes.length; k++)
                if (nodes[k].destroySelf)
                    nodes[k].destroySelf();    
            
            if (oItem.jml && oItem.jml.parentNode) 
                oItem.jml.parentNode.removeChild(oItem.jml);
            
            oItem.destroySelf();
            
            if (oItem.oExt != this.oInt)
                jpf.removeNode(oItem.oExt);
        }
        this.childNodes.length = 0;
        this.oExt.innerHTML = "";
        
        //Do an insertJml
        this.insertJml(jmlDefNode, oInt, oIntJML, isHidden);
    };
    
    this.insertJml = function(jmlDefNode, oInt, oIntJML, isHidden){
        //#ifdef __DEBUG
        jpf.console.info("Loading sub jml from external source");
        //#endif
        
        //#ifdef __WITH_OFFLINE
        if (!jpf.offline.isOnline)
            return false; //it's the responsibility of the dev to check this
        //#endif
        
        var callback = function(data, state, extra){
            if (state != jpf.SUCCESS) {
                var oError;
                
                //#ifdef __DEBUG
                oError = new Error(jpf.formatErrorString(1019, _self, 
                    "Loading extra jml from datasource", 
                    "Could not load JML from remote resource \n\n" 
                    + extra.message));
                //#endif
                
                if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                    return true;
                
                throw oError;
            }
            
            jpf.console.info("Runtime inserting jml");
    
            var JML = oIntJML || _self.jml;
            if (JML.insertAdjacentHTML)
                JML.insertAdjacentHTML(JML.getAttribute("insert")|| "beforeend",
                    (typeof data != "string" && data.length) ? data[0] : data);
            else {
                if (typeof data == "string")
                    data = jpf.xmldb.getXml("<j:jml xmlns:j='"
                        + jpf.ns.jpf +"'>" + data + "</j:jml>");
                for (var i = data.childNodes.length - 1; i >= 0; i--)
                    JML.insertBefore(data.childNodes[i], JML.firstChild);
            }
            
            jpf.JmlParser.parseMoreJml(JML, oInt || _self.oInt, _self,
                (isHidden && (oInt || _self.oInt).style.offsetHeight)
                ? true : false);
        }
        
        if (typeof jmlDefNode == "string") {
            //Process Instruction
            if (jpf.datainstr[jmlDefNode]){
                return jpf.getData(jmlDefNode, null, {
                    ignoreOffline : true
                }, callback);
            }
            //Jml string
            else
                jmlDefNode = jpf.xmldb.getXml(jmlDefNode);
        }
        
        //Xml Node is assumed
        return callback(jmlDefNode, jpf.SUCCESS);
    };
    
    if (this.hasFeature(__DATABINDING__) && !this.hasFeature(__MULTISELECT__) && !this.change) {
        /* ***********************
                Change Action
        ************************/
        /**
         * @action
         * @param  {variant}  string  optional  New value of this component.
         */
        this.change = function(value){
            // #ifdef __WITH_DATABINDING
            
            // #ifdef __WITH_VALIDATION
            if (this.errBox && this.errBox.visible && this.isValid())
                this.clearError();
            // #endif
            
            //Not databound
            if ((!this.createModel || !this.jml.getAttribute("ref")) && !this.XmlRoot) {
            // #endif
                if (this.dispatchEvent("beforechange", {value : value}) === false)
                    return;

                this.setProperty("value", value);
                return this.dispatchEvent("afterchange", {value : value});
            // #ifdef __WITH_DATABINDING
            }
            
            this.executeActionByRuleSet("change", this.mainBind, this.XmlRoot, value);
            // #endif
        };
    }
    
    //this.getNodeFromRule = function(){return false}
    if (this.setValue && !this.clear) {
        this.clear = function(nomsg){
            if (this.$setClearMessage) {
                if (!nomsg)
                    this.$setClearMessage(this.emptyMsg, "empty");
                else if (this.$removeClearMessage)
                    this.$removeClearMessage();
            }
            
            //this.setValue("")
            this.value = -99999; //force resetting
            
            this.$propHandlers && this.$propHandlers["value"]
                ? this.$propHandlers["value"].call(this, "")
                : this.setValue("");
        };
    }
    
    //#ifdef __WITH_CONTEXTMENU
    this.addEventListener("contextmenu", function(e){
        if (!this.contextmenus) return;
        
        var contextmenu;
        var xmlNode = this.hasFeature(__MULTISELECT__) 
            ? this.value 
            : this.XmlRoot;
        
        var i, isRef, sel, menuId;
        for (var i = 0; i < this.contextmenus.length; i++) {
            isRef = (typeof this.contextmenus[i] == "string");
            if (!isRef)
                sel = this.contextmenus[i].getAttribute("select");

            if (isRef || xmlNode && xmlNode.selectSingleNode(sel || ".")
              || !xmlNode && !sel) {
                menuId = isRef
                    ? this.contextmenus[i]
                    : this.contextmenus[i].getAttribute("menu")
                
                // #ifdef __DEBUG
                if (!self[menuId]) {
                    throw new Error(jpf.formatErrorString(jmlParent, 
                        "Showing contextmenu", 
                        "Could not find contextmenu by name: '" + menuId + "'"));
                }
                // #endif
                
                self[menuId].display(e.htmlEvent.clientX + document.documentElement.scrollLeft,
                    e.htmlEvent.clientY+document.documentElement.scrollTop, null,
                    null, xmlNode);

                e.htmlEvent.returnValue = false;
                break;
            }
        }
        
        //IE6 compatiblity
        if (!jpf.appsettings.disableRightClick) {
            document.oncontextmenu = function(){
                document.oncontextmenu = null;
                return false;
            }
        }
    });
    //#endif
    
    /**
     * Removes all the registrations of this component.
     * Call this function to runtime remove this component.
     */
    this.destroySelf = function(){
        //@todo Update JMLDOMApi as well AHA! thats the mem leak in ajax.org
		
        // Remove id from global js space
        if (this.name)
            self[this.name] = null;
	
        // Remove from window.onresize - Should be in Anchoring or Alignment
        if (this.hasFeature(__ANCHORING__))
            this.disableAnchoring();
        if (this.hasFeature(__ALIGNMENT__))
            this.disableAlignment();
		
        // Remove dynamic properties - Should be in Class (clear events???)
        this.unbindAllProperties();
		
        // Remove data connections - Should be in DataBinding
        if (this.dataParent)
            this.dataParent.parent.disconnect(this);
        if (this.hasFeature(__DATABINDING__)) {
            this.unloadBindings();
            this.unloadActions();
        }
        if (this.hasFeature(__DRAGDROP__))
            this.unloadDragDrop();
		
        // Remove from focus list - Should be in JmlNode
        if (this.$focussable)
            jpf.window.$removeFocus(this);
		
        // Remove from multilang list listener (also on skin switching) - Should be in MultiLang
        if (this.hasFeature(__MULTILANG__))
            this.$removeEditable();
		
        //Remove all cached Items - Should be in Cache
        if (this.hasFeature(__CACHE__))
            this.clearAllCache();
		
        if (this.childNodes) {
            for (var i = 0; i < this.childNodes.length; i++) {
                if (this.childNodes[i].destroySelf)
                    this.childNodes[i].destroySelf();
                else
                    jpf.removeNode(this.childNodes[i].oExt);
            }
        }
		
        if (this.destroy)
            this.destroy();
    };
};

jpf.JmlNode.propHandlers = {
    "id": function(value){
        if (this.name == value)
            return;

        if (self[this.name] == this)
            self[this.name] = null;

        jpf.setReference(value, this);
        this.name = value;
    },
    "focussable": function(value){
        if (typeof value == "undefined")
            this.focussable = true;
        
        if (this.focussable) {
            jpf.window.$addFocus(this, this.tabindex
                || this.jml.getAttribute("tabindex"));
        }
        else {
            jpf.window.$removeFocus(this);
        }
    },
    "zindex": function(value){
        this.oExt.style.zIndex = value;
    },
    "visible": function(value){
        if(this.tagName == "modalwindow") return; // temp fix
    
        if (jpf.isFalse(value) || value === undefined) {
            this.oExt.style.display = "none";
            
            if (this.$hide && !this.$noAlignUpdate)
                this.$hide();
            
            if (jpf.window.focussed == this 
              || this.canHaveChildren 
              && jpf.xmldb.isChildOf(this, jpf.window.focussed, false))
                jpf.window.moveNext();
        }
        else if(jpf.isTrue(value)) {
            this.oExt.style.display = "block"; //Some form of inheritance detection
            
            if (this.$show && !this.$noAlignUpdate)
                this.$show();
        }
    },
    "disabled": function(value){
        //For child containers we only disable its children
        if (this.canHaveChildren) {
            function loopChildren(nodes){
                for (var node, i = 0, l = nodes.length; i < l; i++) {
                    node = nodes[i];
                    node.setProperty("disabled", value);
                    
                    if (node.childNodes.length)
                        loopChildren(node.childNodes);
                }
            }
            loopChildren(this.childNodes);
            
            this.disabled = undefined;
            return;
        }
        
        if (value) {
            this.disabled = false;
            if (this.hasFeature(__PRESENTATION__)) 
                this.$setStyleClass(this.oExt, this.baseCSSname + "Disabled");
            
            if (this.$disable) 
                this.$disable();
            
            //#ifdef __WITH_XFORMS
            this.dispatchEvent("xforms-disabled");
            this.dispatchEvent("xforms-readonly");
            //#endif
            
            this.disabled = true;
        }
        else {
            if (this.hasFeature(__DATABINDING__) && jpf.appsettings.autoDisable
              & !this.isBoundComplete())
                return false;

            this.disabled = false;
            
            if (this.hasFeature(__PRESENTATION__))
                this.$setStyleClass(this.oExt, null, [this.baseCSSname + "Disabled"]);
            
            if (this.$enable) 
                this.$enable();
            
            //#ifdef __WITH_XFORMS
            this.dispatchEvent("xforms-enabled");
            this.dispatchEvent("xforms-readwrite");
            //#endif
        }
    },
    "disable-keyboard": function(value){
        this.disableKeyboard = jpf.isTrue(value);
    },
    "left": function(value){
        this.oExt.style.position = "absolute";
        this.oExt.style.left = value + "px";
    },
    "top": function(value){
        this.oExt.style.position = "absolute";
        this.oExt.style.top = value + "px";
    },
    "width": function(value){
        this.oExt.style.width = Math.max(0, value 
            - jpf.getWidthDiff(this.oExt)) + "px";
    },
    "height": function(value){
        this.oExt.style.height = Math.max(0, 
            value - jpf.getHeightDiff(this.oExt)) + "px";
    },
    //#ifdef __WITH_ALIGNMENT
    "align": function(value){
        //#ifdef __WITH_ANCHORING
        if (this.disableAnchoring)
            this.disableAnchoring();
        //#endif

        if (!this.hasFeature(__ALIGNMENT__)) {
            this.inherit(jpf.Alignment);
            this.oExt.style.display = "none";
            this.enableAlignment();
        }
    },
    //#endif
    "contextmenu": function(value){
        this.contextmenus = [value];
    },
    
    //#ifdef __WITH_INTERACTIVE
    "resizable": function(value){
        this.inherit(jpf.Interactive);
        this.$propHandlers["resizable"].apply(this, arguments);
    },
    
    "draggable": function(value){
        this.inherit(jpf.Interactive);
        this.$propHandlers["draggable"].apply(this, arguments);
    },
    //#endif
    
    //#ifdef __WITH_DATABINDING
    "actiontracker": function(value){
        this.$at = self[value]
            ? jpf.JmlParser.getActionTracker(value)
            : jpf.setReference(value,
                jpf.nameserver.register("actiontracker", 
                    value, new jpf.ActionTracker()));
    },
    //#endif

    //Load subJML
    "jml": function(value){
        //Clear??
        this.insertJml(value);
        this.$isSelfLoading = true;
    }
};

// #endif

//#ifdef __DEBUG
document.onkeydown = function(e){
    if (!e) e = event;
    if (e.keyCode == 120 || e.ctrlKey && e.altKey && e.keyCode == 68) {
        if (!jpf.debugwin.resPath)
            jpf.debugwin.init();
        jpf.debugwin.activate();
    }
};
//#endif