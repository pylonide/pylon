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
    
    /* ***********************
        BASIC METHODS
    ************************/
    
    /**
     * Set the different between the left edge and the right edge of this component in pixels.
     *
     * @param  {Integer}  value  reguired 
     */
    this.setWidth = function(value, diff){
        this.oExt.style.width = Math.max(0, (value 
            - (!diff && diff !== 0 ? jpf.getWidthDiff(this.oExt) : diff))) + "px";}
    
    /**
     * Set the different between the top edge and the bottom edge of this component in pixels.
     *
     * @param  {Integer}  value  reguired 
     */
    this.setHeight = function(value, diff){
        this.oExt.style.height = Math.max(0, (value - (!diff && diff !== 0
            ? jpf.getHeightDiff(this.oExt)
            : diff))) + "px";
    };
    
    this.setLeft   = function(value){
        this.oExt.style.position = "absolute";
        this.oExt.style.left = value + "px";
    };
    
    this.setTop    = function(value){
        this.oExt.style.position = "absolute";
        this.oExt.style.top = value + "px";
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

    var noAlignUpdate = false;
    if (!this.show)
        this.show = function(s){
            noAlignUpdate = s;
            this.setProperty("visible", true);
            noAlignUpdate = false;
        };
    if (!this.hide)
        this.hide = function(s){
            noAlignUpdate = s;
            this.setProperty("visible", false);
            noAlignUpdate = false;
        };
    
    this.getWidth  = function(){
        return this.oExt ? this.oExt.offsetWidth : null;
    };
    
    this.getHeight = function(){
        return this.oExt ? this.oExt.offsetHeight : null;
    };
    
    this.getLeft   = function(){
        return this.oExt ? this.oExt.offsetLeft : null;
    };
    
    this.getTop    = function(){
        return this.oExt ? this.oExt.offsetTop : null;
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
    this.loadJML = function(x, pJmlNode, ignoreBindclass, id){
        this.name = x.getAttribute("id");
        
        if (x) {
            // #ifdef __WITH_JMLDOM
            if (!this.parentNode)
                this.parentNode = pJmlNode;

            if (this.parentNode && this.parentNode.hasFeature
              && this.parentNode.hasFeature(__JMLDOM__)) {
                this.parentNode.childNodes.push(this);
            };
            // #endif
            
            this.jml = x;
        }
        else
            x = this.jml;
        
        var attr = x.attributes;
        for (var i = 0; i < attr.length; i++) {
            if (attr[i].nodeName.substr(0,2) == "on")
                this.addEventListener(attr[i].nodeName,
                    new Function(attr[i].nodeValue));
        }
        
        //Drawing
        if (this.nodeType != jpf.NOGUI_NODE) {
            // #ifdef __WITH_JMLDOM
            this.inherit(jpf.JmlDomAPI); /** @inherits jpf.JmlDomAPI */
            // #endif
            
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
            
            //Draw
            if (this.draw)
                this.draw();
            
            if (id)
                this.oExt.setAttribute("id", id);
            //this.__initLayout(x);
            
            this.drawed = true;
            this.dispatchEvent("ondraw");
        }
        
        // #ifdef __DEBUG
        if (this.nodeType == jpf.GUI_NODE) {
            if (self.jpf.debug && !jpf.isDeskrun)
                this.oExt.setAttribute("uniqueId", this.uniqueId);
        }
        // #endif
        
        if (!ignoreBindclass) {
            if (!this.hasFeature(__DATABINDING__) && x.getAttribute("smartbinding")) {
                this.inherit(jpf.DataBinding);
                this.__xmlUpdate = this.__load = function(){};
            }
        }
        
        /* ************************
            Read JML and set a collection of commonly used settings
        *************************/
        
        //#ifdef __WITH_DATABINDING
        if (x.getAttribute("actiontracker")) {
            this.__ActionTracker = self[x.getAttribute("actiontracker")]
                ? jpf.JMLParser.getActionTracker(x.getAttribute("actiontracker"))
                : jpf.setReference(x.getAttribute("actiontracker"),
                    jpf.nameserver.register("actiontracker",
                    x.getAttribute("actiontracker"),
                    new jpf.ActionTracker(this)));
        }
        //#endif

        //Load subJML
        if (x.getAttribute("jml")) {
            this.insertJML(x.getAttribute("jml"));
            x.removeAttribute("jml");
        }
        else if(this.__loadJML)
            this.__loadJML(x);
        
        this.dispatchEvent("onloadjml"); //Stupid IE crashes silently when this is put at the end of the function
        
        var visiblePropertyList = [];
        
        //Layout handling
        //should all layout properties be dynamic???
        if (this.nodeType == jpf.GUI_NODE) {
            //#ifdef __WITH_ALIGNMENT
            this.inherit(jpf.Alignment); /** @inherits jpf.Alignment */
            //#endif
            //#ifdef __WITH_ANCHORING
            this.inherit(jpf.Anchoring); /** @inherits jpf.Anchoring */
            //#endif

            //#ifdef __WITH_ALIGNMENT
            if (x.getAttribute("align") || x.parentNode[jpf.TAGNAME].match(/^(?:vbox|hbox)$/)) 
                this.enableAlignment();
            else
            //#endif
            //#ifdef __WITH_ANCHORING
            if(x.getAttribute("left") || x.getAttribute("right")
              || x.getAttribute("top") || x.getAttribute("bottom"))
                this.enableAnchoring();
            else
            //#endif
            {
                visiblePropertyList.push("left", "top", "width", "height");
            }
        }
        
        //Grid handling
        if (jpf.isTrue(x.getAttribute("autosize"))) {
            this.oExt.style.overflow = "visible";
            this.oExt.style.height = "auto";
        }
        
        //Process JML Handlers
        for (var i = this.__jmlLoaders.length - 1; i >= 0; i--)
            this.__jmlLoaders[i].call(this, x);
        //this.__jmlLoaders = undefined; // Why was this here?
        
        //if(this.nodeType == jpf.NOGUI_NODE) return; //Dynamic properties shouldnt be added for nongui nodes.
        
        //Dynamic Properties
        if (!this.__supportedProperties)
            this.__supportedProperties = [];
        if (this.nodeType != jpf.NOGUI_NODE) {
            //Default Dynamic Properties for NONGUI NODES
            this.__supportedProperties.push("focussable", "zindex", "disabled",
                "disable-keyboard", "contextmenu");//"left", "top", "width", "height"
        }
        
        //Properties to be set at the end of init
        for (var pValue, i = this.__supportedProperties.length - 1; i >= 0; --i) {
            pValue = x.getAttribute(this.__supportedProperties[i]);
            
            // #ifdef __WITH_OFFLINE_STATE
            if (!jpf.dynPropMatch.test(pValue) && jpf.offline.state.enabled)
		        pValue = jpf.offline.state.get(this, this.__supportedProperties[i]) || pValue;
		    // #endif
            
            if (!pValue) {
                if (this.__supportedProperties[i] == "focussable" && this.focussable)
                    pValue = this.focussable;
                else
                    continue;
            }
            
            //#ifdef __WITH_PROPERTY_BINDING
            if (jpf.dynPropMatch.test(pValue)) {
                jpf.JMLParser.stateStack.push({ //@todo check that an array isnt faster
                    node  : this, 
                    name  : this.__supportedProperties[i],
                    value : pValue
                });
            } else 
            //#endif
                this.handlePropSet(this.__supportedProperties[i], pValue);
            
            pValue = null;
        }
        
        //Properties to be set immediately (maybe add some pre-empting, or go back to a covering load screen)
        if (this.nodeType != jpf.NOGUI_NODE) {
            noAlignUpdate = true;
            visiblePropertyList.push("visible");
            for (var value, type, i = 0; i < visiblePropertyList.length; i++) {
                type  = visiblePropertyList[i];
                value = x.getAttribute(visiblePropertyList[i]);
                
                // #ifdef __WITH_OFFLINE_STATE
                if (!jpf.dynPropMatch.test(value) && jpf.offline.state.enabled)
    		        value = jpf.offline.state.get(this, type) || value;
    		    // #endif
                
                /**
                 * @todo This should be fixed by a defaults array in the component
                 */
                //if (type == "visible" && !value) value = "1"; //hardcoded default... grmbl..
                if (!value) continue;
                
                //#ifdef __WITH_PROPERTY_BINDING
                if (jpf.dynPropMatch.test(value)) {
                    jpf.JMLParser.stateStack.push({
                        node  : this, 
                        name  : type, 
                        value : value
                    });
                    this.handlePropSet(type, undefined); //experimental... undefined sets default value
                } else 
                    //#endif
                    this.handlePropSet(type, value); //@todo setProperty ??
            }
            noAlignUpdate = false;
            this.__supportedProperties.merge(visiblePropertyList);
        }
    }
    
    var jmlNode = this;
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

        if(this.__onlySetXml)
            return;
            
        this[prop] = value;
        
        /* ****
         * @todo: Fix width/height/left/top/right/bottom with integration in anchoring en alignment
         **********/

        // this code sufferes from a little overhead from unrequired execution at init
        switch (prop) {
            case "focussable":
                this.focussable = !jpf.isFalse(value);
                if (this.focussable) {
                    jpf.window.__addFocus(this, this.tabIndex
                        || this.jml.getAttribute("tabseq"));
                }
                else {
                    jpf.window.__removeFocus(this);
                }
                break;
            case "zindex":
                this.oExt.style.zIndex = value;
                break;
            case "visible":
                if(this.tagName == "modalwindow") break; // temp fix
            
                if (jpf.isFalse(value) || value === undefined) {
                    //this.oExt.style.display = "none";
                    
                    // #ifdef __WITH_ALIGNMENT
                    if (!noAlignUpdate && this.hasFeature(__ALIGNMENT__) && this.aData) {
                        this.disableAlignment(true);
                        //setTimeout(function(){jmlNode.oExt.style.display = "none";});
                    }
                    else 
                    // #endif
                        this.oExt.style.display = "none";
                    
                    if (jpf.window.isFocussed(this))
                        jpf.window.moveNext();
                    //if(!noAlignUpdate && this.hasFeature(__ANCHORING__)) this.disableAnchoring(true);//jpf.JMLParser.loaded
                    this.visible = false;
                }
                else if(jpf.isTrue(value)) {
                    // #ifdef __WITH_ALIGNMENT
                    //if(!noAlignUpdate && this.hasFeature(__ANCHORING__)) this.enableAnchoring(true);//jpf.JMLParser.loaded
                    if (!noAlignUpdate && this.hasFeature(__ALIGNMENT__) && this.aData) {
                        this.enableAlignment(true);
                        //setTimeout(function(){jmlNode.oExt.style.display = "block";});
                    }
                    else 
                    // #endif
                        this.oExt.style.display = "block"; //Some form of inheritance detection
                    this.visible = true;
                }
                break;
            case "disabled":
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
                break;
            case "disable-keyboard":
                this.disableKeyboard = jpf.isTrue(value);
                break;
            case "left":
                if (value !== undefined)
                    this.setLeft(value);
                break;
            case "top":
                if (value !== undefined)
                    this.setTop(value);
                break;
            case "width":
                if (value !== undefined)
                    this.setWidth(value);
                break;
            case "height":
                if (value !== undefined)
                    this.setHeight(value);
                break;
            case "contextmenu":
                this.contextmenus = [value];
                break;
        }
        
        if (this.__handlePropSet) {
            return this.__handlePropSet(prop, value);
        }
    }
    /* make this:
        - insertJML(xmlNode)
        - insertJML(xmlString)
        - insertJML(instruction)
        - replaceJML(xmlNode)
        - replaceJML(xmlString)
        - replaceJML(instruction)
    */
    
    this.replaceJML = function(jmlDefNode, oInt, oIntJML, isHidden){
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
        
        //Do an insertJML
        this.insertJML(jmlDefNode, oInt, oIntJML, isHidden);
    }
    
    this.insertJML = function(jmlDefNode, oInt, oIntJML, isHidden){
        jpf.console.info("Loading sub jml from external source");
        
        //#ifdef __WITH_OFFLINE
        if (!jpf.offline.isOnline)
            return false; //it's the responsibility of the dev to check this
        //#endif
        
        var jmlNode = this;
        var callback = function(data, state, extra){
            if (state != jpf.SUCCESS) {
                var oError;
                
                //#ifdef __DEBUG
                oError = new Error(jpf.formatErrorString(1019, jmlNode, 
                    "Loading extra jml from datasource", 
                    "Could not load JML from remote resource \n\n" 
                    + extra.message));
                //#endif
                
                if (extra.tpModule.retryTimeout(extra, state, jmlNode, oError) === true)
                    return true;
                
                throw oError;
            }
            
            jpf.console.info("Runtime inserting jml");
    
            var JML = oIntJML || jmlNode.jml;
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
            
            jpf.JMLParser.parseMoreJml(JML, oInt || jmlNode.oInt, jmlNode,
                (isHidden && (oInt || jmlNode.oInt).style.offsetHeight)
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
    
    if (this.focussable) {
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
    else
        this.focussable = false;

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
    if (this.setValue && !this.clear)
        this.clear = function(nomsg){
            if (this.__setClearMessage) {
                if (!nomsg)
                    this.__setClearMessage(this.msg);
                else if (this.__removeClearMessage)
                    this.__removeClearMessage();
            }
            
            //this.setValue("")
            this.value = -99999; //force resetting
            this.__handlePropSet ? this.__handlePropSet("value", "") : this.setValue("");
        }
    
    //ContextMenu support
    this.addEventListener("oncontextmenu", function(e){
        if (!this.contextmenus) return;
        var contextmenu;
        var xmlNode = this.hasFeature(__MULTISELECT__) ? this.value : this.XMLRoot;
        
        for (var i = 0; i < this.contextmenus.length; i++) {
            var isRef = (typeof this.contextmenus[i] == "string");
            if (!isRef)
                var sel = this.contextmenus[i].getAttribute("select");

            if (isRef || xmlNode && xmlNode.selectSingleNode(sel || ".")
              || !xmlNode && !sel) {
                var menuId = isRef
                    ? this.contextmenus[i]
                    : this.contextmenus[i].getAttribute("menu")
                
                // #ifdef __DEBUG
                if (!self[menuId]) {
                    throw new Error(jpf.formatErrorString(jmlParent, "Showing contextmenu", "Could not find contextmenu by name: '" + menuId + "'"));
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
}

/* ***********************
    Set Window events
************************/

window.onbeforeunload = function(){
    if (!jpf.window) return;
    
    //#ifdef __DESKRUN
    if (jpf.isDeskrun) {
        window.external.shell.RegSet(jpf.appsettings.drRegName + "/window", 
            window.external.left + "," + window.external.top + ","
            + window.external.width + "," + window.external.height);
    }
    //#endif
    
    var returnValue = jpf.dispatchEvent("onexit");
    //if(jpf.window.isActive()) jpf.getRoot().activeWindow = null;
    
    return returnValue;
}
if (jpf.isDeskrun)
    window.external.onbeforeunload = window.onbeforeunload;

window.onunload = function(){
    if (!jpf.window) return;

    jpf.window.isExiting = true;
    jpf.window.destroy();

    //if(jpf.isDeskrun)
        //window.external.shell.RegSet(jpf.appsettings.drRegName + "/window",window.external.left + "," + window.external.top + "," + window.external.width + "," + window.external.height);
}

window.onfocus = function(){
    if (!jpf.window) return;

    /*var k = jpf.getRoot();
    //if(k.wtimer) clearTimeout(k.wtimer);
    k.activeWindow = self;*/

    if (jpf.window.onfocus)
        jpf.window.onfocus();
}

window.onblur = function(){
    if (!jpf.window) return;

    //if(document.activeElement != document.body)
        //jpf.getRoot().wtimer = setTimeout("jpf.getRoot().activeWindow = null;", 100);
    
    if (jpf.window.onblur)
        jpf.window.onblur();
}


/* *****************************

    KEYBOARD & FOCUS HANDLING
    
******************************/

document.oncontextmenu = function(e){
    if (jpf.dispatchEvent("oncontextmenu", e || event) === false)
        return false;

    if (jpf.appsettings.disableRightClick)
        return false;
}

document.onmousedown = function(e){
    if (!e) e = event;
    var o = jpf.findHost(jpf.hasEventSrcElement ? e.srcElement : e.target);

    if (jpf.window && jpf.window.__f.contains(o) && !o.disabled && o.focussable)
        jpf.window.__focus(o);
    else if (jpf.window && jpf.window.__fObject) {
        jpf.window.__clearFocus();
    }
    
    //Hide current menu
    //if(self.jpf.currentMenu) jpf.currentMenu.hideMenu(true)
    
    //Contextmenu
    if (e.button == 2 && o) //jpf.window.getFocussedObject())
        o.dispatchEvent("oncontextmenu", {htmlEvent : e});
    
    if (self.jpf.JMLParser && !self.jpf.appsettings.allowSelect 
      /* #ifdef __WITH_DRAGMODE */
      || jpf.DragMode.mode
      /* #endif */
      ) //Non IE
        return false;
}

document.onselectstart = function(){
    if (self.jpf.JMLParser && !self.jpf.appsettings.allowSelect
      /* #ifdef __WITH_DRAGMODE */
      || jpf.DragMode.mode
      /* #endif */
      ) //IE
        return false;
}

document.onkeyup = function(e){
    if (!e) e = event;
    
    //KEYBOARD FORWARDING TO FOCUSSED OBJECT
    if (jpf.window && jpf.window.__fObject && !jpf.window.__fObject.disableKeyboard
      && jpf.window.__fObject.keyUpHandler
      && jpf.window.__fObject.keyUpHandler(e.keyCode, e.ctrlKey, e.shiftKey, e.altkey, e) == false) {
        return false;
    }
}

// #endif

// #ifdef __WITH_APP || __DEBUG

document.onkeydown = function(e){
    if (!e) e = event;

    //#ifdef __WITH_APP

    if (jpf.currentMenu && e.keyCode == "27") 
        jpf.currentMenu.hideMenu(true);
        
    //Contextmenu handling
    if (e.keyCode == 93 && jpf.window.getFocussedObject()) {
        var pos, o = jpf.window.getFocussedObject();
        if (o.value)
            pos = jpf.getAbsolutePosition(o.selected);
        else
            pos = jpf.getAbsolutePosition(o.oExt);
            
        o.dispatchEvent("oncontextmenu", {
            htmlEvent: {
                clientX: pos[0] + 10 - document.documentElement.scrollLeft,
                clientY: pos[1] + 10 - document.documentElement.scrollTop
            }
        });
    }

    // #endif

    //HOTKEY
    if (jpf.dispatchEvent("onhotkey", e) === false) {
        e.returnValue = false;
        e.cancelBubble = true;
        if (jpf.canDisableKeyCodes)
            try {
                e.keyCode = 0;
            }
            catch(e) {}
        return false;
    }
    
    //#ifdef __DEBUG
    if (jpf.dispatchEvent("ondebugkey", e) === false) {
        e.returnValue = false;
        e.cancelBubble = true;
        if (jpf.canDisableKeyCodes)
            try {
                e.keyCode = 0;
            }
            catch(e) {}
        return false;
    }
    //#endif
    
    //#ifdef __WITH_APP
    
    if (!jpf.window) return;
    
    //DRAG & DROP
    if (jpf.window.dragging && e.keyCode == 27) {
        if (document.body.lastHost && document.body.lastHost.dragOut)
            document.body.lastHost.dragOut(jpf.dragHost); 
        return jpf.DragServer.stopdrag();
    }
    
    //KEYBOARD FORWARDING TO FOCUSSED OBJECT
    if (jpf.window && jpf.window.__fObject && !jpf.window.__fObject.disableKeyboard
      && jpf.window.__fObject.keyHandler
      && jpf.window.__fObject.keyHandler(e.keyCode, e.ctrlKey, e.shiftKey, e.altkey, e) === false) {
        e.returnValue  = false;
        e.cancelBubble = true;
        
        if (jpf.canDisableKeyCodes) {
            try {
                e.keyCode = 0;
            }
            catch(e) {}
        }
        
        return false;
    } else if (e.keyCode == 9 && jpf.window.__f.length > 1) { //FOCUS HANDLING
        if (!jpf.currentMenu)
            jpf.window.moveNext(e.shiftKey);
        
        e.returnValue = false;
        return false;
    }
    
    //Disable backspace behaviour triggering the backbutton behaviour
    if (jpf.appsettings.disableBackspace && e.keyCode == 8) {
        e.keyCode = 0;
    }
    
    //Disable space behaviour of scrolling down the page
    /*if(Application.disableSpace && e.keyCode == 32 && e.srcElement.tagName.toLowerCase() != "input"){
        e.keyCode = 0;
        e.returnValue = false;
    }*/
    
    //Disable F5 refresh behaviour
    if (jpf.appsettings.disableF5 && e.keyCode == 116) {
        e.keyCode = 0;
        //return false;
    }
    
    if (e.keyCode == 27) { //or up down right left pageup pagedown home end unless body is selected
        e.returnValue = false;
    }
    
    //#endif
}

// #endif
