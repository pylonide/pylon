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
        return "[Javeline Component : " + (this.name || "") + " (" + this.tagName + ")]";
    }
    
    this.__regbase = this.__regbase|__JMLNODE__;
    var _self      = this;
    
    /**
     * Set the different between the left edge and the right edge of this component in pixels.
     *
     * @param  {Integer}  value  reguired 
     */
    this.setWidth = function(value){
        this.setProperty("width", value);
    }
    
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
    
    this.setZIndex = function(value){
        this.setProperty("zindex", value);
    };
    
    this.enable    = function(){
        this.setProperty("disabled", false);
    };
    
    this.disable   = function(){
        this.setProperty("disabled", true);
    };

    this.__noAlignUpdate = false;
    if (!this.show)
        this.show = function(s){
            this.__noAlignUpdate = s;
            this.setProperty("visible", true);
            this.__noAlignUpdate = false;
        };
    if (!this.hide)
        this.hide = function(s){
            this.__noAlignUpdate = s;
            this.setProperty("visible", false);
            this.__noAlignUpdate = false;
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
    
    this.getZIndex = function(){
        return this.oExt ? jpf.getStyle(this.oExt, "zIndex") : null;
    };
    
    this.isVisible = function(value){
        return this.oExt ? this.oExt.style.display != "none" : null;
    };
    
    /* ***********************
        JML
    ************************/
    this.loadJml = function(x, pJmlNode, ignoreBindclass, id){
        this.name = x.getAttribute("id");
        if (this.name)
            jpf.setReference(this.name, this);
        
        if (!x) 
            x = this.jml;
        
        if (!this.parentNode)
            this.parentNode = pJmlNode;
        
        // #ifdef __WITH_JMLDOM
        if (!this.hasFeature(__JMLDOM__))
            this.inherit(jpf.JmlDomApi); /** @inherits jpf.JmlDomApi */
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
            
            if (this.loadSkin)
                this.loadSkin();
            
            if (this.draw)
                this.draw();
            
            if (id)
                this.oExt.setAttribute("id", id);

            //#ifdef __WITH_ALIGNMENT
            if (x.getAttribute("align") 
              || x.parentNode && "vbox|hbox".indexOf(x.parentNode[jpf.TAGNAME]) > -1) { //@todo temp
                this.inherit(jpf.Alignment); /** @inherits jpf.Alignment */
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
                this.__supportedProperties.push("width", "left", "top", "height");
            }
            #endif*/
            
            this.drawed = true;
        }
        
        // #ifdef __DEBUG
        if (this.nodeType == jpf.GUI_NODE) {
            if (jpf.debug && this.oExt.nodeType)
                this.oExt.setAttribute("uniqueId", this.uniqueId);
        }
        // #endif
        
        if (!ignoreBindclass) { //Is this still needed?
            if (!this.hasFeature(__DATABINDING__) && x.getAttribute("smartbinding")) {
                this.inherit(jpf.DataBinding);
                this.__xmlUpdate = this.__load = function(){};
            }
        }
        
        //Process properties and Attributes
        
        // #ifdef __WITH_OFFLINE_STATE
        var offlineLookup;
        if (jpf.offline.state.enabled)
	        offlineLookup = jpf.offline.state.getAll(this); //@todo implement this
	    // #endif
        
        //Parse all attributes
        this.__noAlignUpdate = true;
        
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
                
                if (this.__booleanProperties[name])
                    value = jpf.isTrue(value);
                
                this[name] = value;
                (this.__propHandlers && this.__propHandlers[name] 
                  || jpf.JmlNode.propHandlers[name] || jpf.K).call(this, value)
            }
        }
        
        //#ifdef __WITH_OFFLINE_STATE
        for (name in offlineLookup) {
            value = offlineLookup[name]
            (this.__propHandlers && this.__propHandlers[name] 
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
                    if (this.__booleanProperties[name])
                        value = jpf.isTrue(value);
                    
                    this[name] = value;
                    (this.__propHandlers && this.__propHandlers[name] 
                      || jpf.JmlNode.propHandlers[name] || jpf.K).call(this, value);
                }
            }
        }
        //#endif
        
        this.__noAlignUpdate = false;
        
        if (this.__loadJml && !this.__isSelfLoading)
            this.__loadJml(x);
        
        //Process JML Handlers
        for (i = this.__jmlLoaders.length - 1; i >= 0; i--)
            this.__jmlLoaders[i].call(this, x);
        
        if (this.__focussable && this.focussable === undefined)
            jpf.JmlNode.propHandlers.focussable.call(this);
        
        return this;
    }
    
    this.handlePropSet = function(prop, value, force){
        //#ifdef __WITH_PROPERTY_BINDING
        if (!force && this.XMLRoot && this.bindingRules
          && this.bindingRules[prop] && !this.ruleTraverse)
            return jpf.xmldb.setNodeValue(this.getNodeFromRule(
                prop.toLowerCase(), this.XMLRoot, null, null, true), value, !this.__onlySetXml);
        //#endif
        /*#ifndef __WITH_PROPERTY_BINDING
        if(!force && prop == "value" && this.XMLRoot
          && this.bindingRules[this.mainBind] && !this.ruleTraverse)
            return jpf.xmldb.setNodeValue(this.getNodeFromRule(this.mainBind,
                this.XMLRoot, null, null, true), value, true);
        #endif */

        if (this.__booleanProperties[prop])
            value = jpf.isTrue(value);

        this[prop] = value;

        if(this.__onlySetXml)
            return;
        
        return (this.__propHandlers && this.__propHandlers[prop] 
            || jpf.JmlNode.propHandlers[prop] 
            || jpf.K).call(this, value, force);
    }
    
    this.replaceJml = function(jmlDefNode, oInt, oIntJML, isHidden){
        jpf.console.info("Remove all jml from element");
        
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
    }
    
    this.insertJml = function(jmlDefNode, oInt, oIntJML, isHidden){
        jpf.console.info("Loading sub jml from external source");
        
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
    }
    
    this.setTabIndex = function(tabIndex){
        jpf.window.__removeFocus(this);
        jpf.window.__addFocus(this, tabIndex);
    }
    
    /* ***********************
        FOCUS
    ************************/
    
    if (this.__focussable) {
        this.focus = function(noset){
            this.__focus(this);
            if (!noset) jpf.window.__focus(this);
            
            this.dispatchEvent("onfocus");
        }
        
        this.blur = function(noset){
            this.__blur(this);
            if (!noset) jpf.window.__blur(this);
            
            this.dispatchEvent("onblur");
        }
        
        this.isFocussed = function(){
            return jpf.window.isFocussed(this);
        }
    }

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
            if (this.errBox && this.errBox.isVisible() && this.isValid())
                this.clearError();
            // #endif
            
            //Not databound
            if ((!this.createModel || !this.jml.getAttribute("ref")) && !this.XMLRoot) {
            // #endif
                if (this.dispatchEvent("onbeforechange", {value : value}) === false)
                    return;

                this.setProperty("value", value);
                return this.dispatchEvent("onafterchange", {value : value});
            // #ifdef __WITH_DATABINDING
            }
            
            this.executeActionByRuleSet("change", this.mainBind, this.XMLRoot, value);
            // #endif
        }
    }
    
    //this.getNodeFromRule = function(){return false}
    if (this.setValue && !this.clear) {
        this.clear = function(nomsg){
            if (this.__setClearMessage) {
                if (!nomsg)
                    this.__setClearMessage(this.emptyMsg, "empty");
                else if (this.__removeClearMessage)
                    this.__removeClearMessage();
            }
            
            //this.setValue("")
            this.value = -99999; //force resetting
            
            this.__propHandlers && this.__propHandlers["value"]
                ? this.__propHandlers["value"].call(this, "")
                : this.setValue("");
        }
    }
    
    //#ifdef __WITH_CONTEXTMENU
    this.addEventListener("oncontextmenu", function(e){
        if (!this.contextmenus) return;
        
        var contextmenu;
        var xmlNode = this.hasFeature(__MULTISELECT__) 
            ? this.value 
            : this.XMLRoot;
        
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
        if (this.__focussable)
            jpf.window.__removeFocus(this);
		
        // Remove from multilang list listener (also on skin switching) - Should be in MultiLang
        if (this.hasFeature(__MULTILANG__))
            this.__removeEditable();
		
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
    }
}

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
        this.__focussable = !jpf.isFalse(value);
        if (this.__focussable) {
            jpf.window.__addFocus(this, this.tabIndex
                || this.jml.getAttribute("tabseq"));
        }
        else {
            jpf.window.__removeFocus(this);
        }
    },
    "zindex": function(value){
        this.oExt.style.zIndex = value;
    },
    "visible": function(value){
        if(this.tagName == "modalwindow") return; // temp fix
    
        if (jpf.isFalse(value) || value === undefined) {
            //this.oExt.style.display = "none";
            
            // #ifdef __WITH_ALIGNMENT
            if (!this.__noAlignUpdate && this.hasFeature(__ALIGNMENT__) && this.aData) {
                this.disableAlignment(true);
                //setTimeout(function(value){jmlNode.oExt.style.display = "none";});
            }
            else 
            // #endif
                this.oExt.style.display = "none";
            
            if (jpf.window.isFocussed(this))
                jpf.window.moveNext();
            //if(!this.__noAlignUpdate && this.hasFeature(__ANCHORING__)) this.disableAnchoring(true);//jpf.JmlParser.loaded
            this.visible = false;
        }
        else if(jpf.isTrue(value)) {
            // #ifdef __WITH_ALIGNMENT
            //if(!this.__noAlignUpdate && this.hasFeature(__ANCHORING__)) this.enableAnchoring(true);//jpf.JmlParser.loaded
            if (!this.__noAlignUpdate && this.hasFeature(__ALIGNMENT__) && this.aData) {
                this.enableAlignment(true);
                //setTimeout(function(value){jmlNode.oExt.style.display = "block";});
            }
            else 
            // #endif
                this.oExt.style.display = "block"; //Some form of inheritance detection
            this.visible = true;
        }
    },
    "disabled": function(value){
        if (jpf.isTrue(value)) {
            this.disabled = false;
            if (this.hasFeature(__PRESENTATION__)) 
                this.__setStyleClass(this.oExt, this.baseCSSname + "Disabled");
            
            if (this.__disable) this.__disable();
            
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
                this.__setStyleClass(this.oExt, null, [this.baseCSSname + "Disabled"]);
            
            if (this.__enable) this.__enable();
            
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
    "contextmenu": function(value){
        this.contextmenus = [value];
    },
    
    //#ifdef __WITH_INTERACTIVE
    "resizable": function(value){
        this.inherit(jpf.Interactive);
        this.__propHandlers["resizable"].apply(this, arguments);
    },
    
    "draggable": function(value){
        this.inherit(jpf.Interactive);
        this.__propHandlers["draggable"].apply(this, arguments);
    },
    //#endif
    
    //#ifdef __WITH_DATABINDING
    "actiontracker": function(value){
        this.__at = self[value]
            ? jpf.JmlParser.getActionTracker(value)
            : jpf.setReference(value,
                jpf.nameserver.register("actiontracker", 
                    value, new jpf.ActionTracker(this)));
    },
    //#endif

    //Load subJML
    "jml": function(value){
        //Clear??
        this.insertJml(value);
        this.__isSelfLoading = true;
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
}
//#endif