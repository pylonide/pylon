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

ppc.__PRESENTATION__ = 1 << 9;
//#ifdef __WITH_PRESENTATION

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have skinning features. A skin is a description
 * of how the element is rendered. In the web browser, this is done using HTML
 * elements and CSS.
 *
 * #### Remarks
 *
 * The skin is set using the `skin` attribute. The skin of each element can be
 * changed at run time. Other than just changing the look of an element, a skin
 * change can help the user to perceive information in a different way. For 
 * example, a list element has a default skin, but can also use the thumbnail 
 * skin to display thumbnails of the {@link term.datanode data nodes}.
 *
 * #### Example
 *
 * A skin for an element is always built up out of a standard set of parts:
 *
 * ```xml
 *   <a:textbox name="textbox">
 *      <a:alias>
 *          ...
 *      </a:alias>
 *      <a:style><![CDATA[
 *          ...
 *      ]]></a:style>
 *  
 *      <a:presentation>
 *          <a:main>
 *              ...
 *          </a:main>
 *          ...
 *      </a:presentation>
 *   </a:textbox>
 * ```
 *
 * The alias contains a name that contains alternative names for the skin. The
 * style tags contain the CSS. The main tag contains the HTML elements that are
 * created when the component is created. Any other skin items are used to render
 * other elements of the widget. In this reference guide you will find these
 * skin items described on the pages of each widget.
 *
 * @class ppc.Presentation
 * @define presentation
 * @inherits ppc.GuiElement
 * @baseclass
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.5
 */
ppc.Presentation = function(){
    this.$init(true);
};

(function(){
    this.$regbase = this.$regbase | ppc.__PRESENTATION__;
    
    // *** Properties and Attributes *** //

    this.$supportedProperties.push("skin");
    
    /**
     * @attribute {String} skinset Sets or gets the skinset for
     * this element. If none are specified ,the `skinset` attribute
     * of the app settings is used. When that's not defined, the default skinset
     * is used.
     * 
     * #### Example
     *
     * ```xml
     *  <a:list skinset="perspex" />
     * ```
     */
    this.$propHandlers["skinset"] =

    //#ifdef __WITH_SKIN_CHANGE
    /**
     * @attribute {String} skin Sets or gets the name of the skin in the skinset that defines 
     * how this element is rendered. When a skin is changed, the full state of the
     * element is kept, including its selection, all the
     * AML attributes, loaded data, and focus and disabled states.
     *
     * #### Example
     *
     * In XML:
     *
     * ```xml
     *  <a:list id="lstExample" skin="thumbnails" />
     * ```
     * 
     * Or, in JavaScript:
     *
     * ```javascript
     *  lstExample.setAttribute("skin", "list");
     * ```
     */
    this.$propHandlers["skin"] = function(value){
        if (!this.$amlLoaded) //If we didn't load a skin yet, this will be done when we attach to a parent
            return;

        if (!this.$skinTimer) {
            var _self = this;
            clearTimeout(this.$skinTimer);
            this.$skinTimer = $setTimeout(function(){
                changeSkin.call(_self, _self.skin);
                delete _self.$skinTimer;
            });
        }
    }
    //#endif

    /**
     * @attribute {String} style Sets or gets the CSS style applied to the this element. This can be a string containing one or more CSS rules.
     */
    this.$propHandlers["style"] = function(value){
        if (!this.styleAttrIsObj && this.$amlLoaded)
            this.$ext.setAttribute("style", value);
    }
    
    /**
     * @attribute {String} border Sets or gets border values. Set these sizes as a quarter of strings, in the usual top, right, bottom, left sequence, or pass an empty string to turn off borders.
     */
    this.$propHandlers["border"] = function(value){
        if (!value)
            this.$ext.style.borderWidth = "";
        else
            this.$ext.style.borderWidth = ppc.getBox(value).join("px ") + "px";
    }
    
    /**
     * @attribute {String | Number} margin Sets or gets margin values. Set these sizes as a quarter of strings, in the usual top, right, bottom, left sequence, or pass an empty string to turn off margins.
     */
    this.$propHandlers["margin"] = function(value){
        if (!value)
            this.$ext.style.margin = "";
        else
            this.$ext.style.margin = ppc.getBox(value).join("px ") + "px";
    }

    /**
     * @attribute {String} class Sets or gets the name of the CSS style class applied to this element.
     */
    this.$propHandlers["class"] = function(value){
        this.$setStyleClass(this.$ext, value, this.$lastClassValue ? [this.$lastClassValue] : null);
        this.$lastClassValue = value;
    }

    //#ifdef __WITH_SKIN_CHANGE
    this.$forceSkinChange = function(skin, skinset){
        changeSkin.call(this, skin, skinset);
    }

    //@todo objects don't always have an $int anymore.. test this
    function changeSkin(skin, skinset){
        clearTimeout(this.$skinTimer);

        //var skinName = (skinset || this.skinset || ppc.config.skinset)
        //    + ":" + (skin || this.skin || this.localName);

        //#ifdef __WITH_MULTISELECT
        //Store selection
        if (this.selectable)
            var valueList = this.getSelection();//valueList;
        //#endif

        //Store needed state information
        var oExt       = this.$ext,
            oInt       = this.$int,
            pNode      = this.$ext.parentNode,
            beforeNode = oExt.nextSibling,
            idExt      = this.$ext.getAttribute("id"),
            idInt      = this.$int && this.$int.getAttribute("id"),
            oldBase    = this.$baseCSSname;

        if (oExt.parentNode)
            oExt.parentNode.removeChild(oExt);

        //@todo changing skin will leak A LOT, should call $destroy here, with some extra magic
        if (this.$destroy)
            this.$destroy(true);

        //Load the new skin
        this.skin = skin;
        this.$loadSkin(skinset ? skinset + ":" + skin : null);

        //Draw
        if (this.$draw)
            this.$draw(true);

        if (idExt)
            this.$ext.setAttribute("id", idExt);

        if (beforeNode || pNode != this.$ext.parentNode)
            pNode.insertBefore(this.$ext, beforeNode);

        //Style
        
        //Border
        
        //Margin

        //Classes
        var i, l, newclasses = [],
               classes    = (oExt.className || "").splitSafe("\\s+");
        for (i = 0; i < classes.length; i++) {
            if (classes[i] && classes[i].indexOf(oldBase) != 0)
                newclasses.push(classes[i].replace(oldBase, this.$baseCSSname));
        }
        ppc.setStyleClass(this.$ext, newclasses.join(" "));

        //Copy events
        var en, ev = ppc.skins.events;
        for (i = 0, l = ev.length; i < l; i++) {
            en = ev[i];
            if (typeof oExt[en] == "function" && !this.$ext[en])
                this.$ext[en] = oExt[en];
        }

        //Copy css state (dunno if this is best)
        this.$ext.style.left     = oExt.style.left;
        this.$ext.style.top      = oExt.style.top;
        this.$ext.style.width    = oExt.style.width;
        this.$ext.style.height   = oExt.style.height;
        this.$ext.style.right    = oExt.style.right;
        this.$ext.style.bottom   = oExt.style.bottom;
        this.$ext.style.zIndex   = oExt.style.zIndex;
        this.$ext.style.position = oExt.style.position;
        this.$ext.style.display  = oExt.style.display;

        //Widget specific
        //if (this.$loadAml)
            //this.$loadAml(this.$aml);
        
        if (idInt)
            this.$int.setAttribute("id", idInt);
        
        if (this.$int && this.$int != oInt) {
            var node, newNode = this.$int, nodes = oInt.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--) {
                if ((node = nodes[i]).host) {
                    node.host.$pHtmlNode = newNode;
                    if (node.host.$isLeechingSkin)
                        setLeechedSkin.call(node.host);
                }
                newNode.insertBefore(node, newNode.firstChild);
            }
            //this.$int.onresize = oInt.onresize;
        }
        
        //#ifdef __WITH_DRAGDROP
        //DragDrop
        if (this.hasFeature(ppc.__DRAGDROP__)) {
            if (document.elementFromPointAdd) {
                document.elementFromPointRemove(oExt);
                document.elementFromPointAdd(this.$ext);
            }
        }
        //#endif

        //Check disabled state
        if (this.disabled)
            this.$disable(); //@todo ppc3.0 test

        //Check focussed state
        if (this.$focussable && ppc.document.activeElement == this)
            this.$focus(); //@todo ppc3.0 test

        //Dispatch event
        this.dispatchEvent("$skinchange", {
            ext  : oExt,
            "int": oInt
        });

        //#ifdef __WITH_DATABINDING
        //Reload data
        if (this.hasFeature(ppc.__DATABINDING__) && this.xmlRoot)
            this.reload();
        else
        //#endif
        if (this.value)
            this.$propHandlers["value"].call(this, this.value);

        //#ifdef __WITH_MULTISELECT
        //Set Selection
        if (this.hasFeature(ppc.__MULTISELECT__)) {
            if (this.selectable)
                this.selectList(valueList, true);
        }
        //#endif

        //Move layout rules
        if (!ppc.hasSingleRszEvent) {
            ppc.layout.activateRules(this.$ext);
            if (this.$int)
                ppc.layout.activateRules(this.$int);
        }

/*        //#ifdef __WITH_ANCHORING
        if (this.hasFeature(ppc.__ANCHORING__))
            this.$recalcAnchoring();
        //#endif

        //#ifdef __WITH_ALIGNMENT
        if (this.hasFeature(ppc.__ALIGNMENT__)) {
            if (this.aData)
                this.aData.oHtml = this.$ext;

            if (this.pData) {
                this.pData.oHtml = this.$ext;
                this.pData.pHtml = this.$int;

                var nodes = this.pData.childNodes;
                for (i = 0; i < nodes.length; i++)
                    nodes[i].pHtml = this.$int; //Should this be recursive??
            }
        }
        //#endif
*/
        //#ifdef __WITH_INTERACTIVE
        if (this.draggable && this.$propHandlers["draggable"]) //@todo move these to the event below ppc3.0)
            this.$propHandlers["draggable"].call(this, this.draggable);
        if (this.resizable && this.$propHandlers["resizable"])
            this.$propHandlers["resizable"].call(this, this.resizable);
        //#endif

        //#ifdef __WITH_LAYOUT
        ppc.layout.forceResize(this.$ext);
        //#endif
    };
    //#endif

    // *** Private methods *** //

    this.$setStyleClass = ppc.setStyleClass;

    function setLeechedSkin(e){
        if (!this.$amlLoaded || e && (e.$isMoveWithinParent 
          || e.currentTarget != this || !e.$oldParent))
            return;

        this.$setInheritedAttribute(this, "skinset");

        if (this.attributes.getNamedItem("skin"))
            return;

        //e.relatedNode
        var skinName, pNode = this.parentNode, skinNode;
        if ((skinName = this.$canLeechSkin.dataType 
          == ppc.STRING ? this.$canLeechSkin : this.localName)
          && pNode.$originalNodes 
          && (skinNode = pNode.$originalNodes[skinName])
          && skinNode.getAttribute("inherit")) {
            var link = skinNode.getAttribute("link");
            this.$isLeechingSkin = true;
            if (link) {
                this.$forceSkinChange(link);
            }
            else {
                var skin = pNode.skinName.split(":");
                this.$forceSkinChange(skin[1], skin[0]);
            }
        }
        else if (this.$isLeechingSkin) {
            delete this.skin;
            this.$isLeechingSkin = false;
            this.$forceSkinChange();
        }
    }

    //Skin Inheritance
    //@todo Probably requires some cleanup
    this.$initSkin = function(x){
        if (this.$canLeechSkin) {
            this.addEventListener("DOMNodeInserted", setLeechedSkin);
        }
        
        if (!this.skin)
            this.skin = this.getAttribute("skin");
        
        var skinName, pNode = this.parentNode, skinNode;
        if (this.$canLeechSkin && !this.skin 
          && (skinName = this.$canLeechSkin.dataType == ppc.STRING 
            ? this.$canLeechSkin 
            : this.localName)
          && pNode && pNode.$originalNodes 
          && (skinNode = pNode.$originalNodes[skinName])
          && skinNode.getAttribute("inherit")) {
            var link = skinNode.getAttribute("link");
            this.$isLeechingSkin = true;
            if (link) {
                this.skin = link;
                this.$loadSkin();
            }
            else {
                this.$loadSkin(pNode.skinName);
            }
        }
        else {
            if (!this.skinset)
                this.skinset = this.getAttribute("skinset");
            
            this.$loadSkin(null, this.$canLeechSkin);
        }
    }

    /*
     * Initializes the skin for this element when none has been set up.
     *
     * @param  {String}  skinName   Identifier for the new skin (for example: 'default:List' or 'win').
     * @param  {Boolean} [noError]
     */
    this.$loadSkin = function(skinName, noError){
        //this.skinName || //where should this go and why?
        this.baseSkin = skinName || (this.skinset 
            || this.$setInheritedAttribute("skinset")) 
            + ":" + (this.skin || this.localName);

        clearTimeout(this.$skinTimer);

        if (this.skinName) {
            this.$blur();
            this.$baseCSSname = null;
        }

        this.skinName = this.baseSkin; //Why??
        //this.skinset  = this.skinName.split(":")[0];

        this.$pNodes = {}; //reset the this.$pNodes collection
        this.$originalNodes = ppc.skins.getTemplate(this.skinName, true);

        if (!this.$originalNodes) {
            var skin = this.skin;
            if (skin) {
                var skinset = this.skinName.split(":")[0];
                this.baseName = this.skinName = "default:" + skin;
                this.$originalNodes = ppc.skins.getTemplate(this.skinName);
                
                if (!this.$originalNodes && skinset != "default") {
                    this.baseName = this.skinName = skinset + ":" + this.localName;
                    this.$originalNodes = ppc.skins.getTemplate(this.skinName, true);
                }
            }
            
            if (!this.$originalNodes) {
                this.baseName = this.skinName = "default:" + this.localName;
                this.$originalNodes = ppc.skins.getTemplate(this.skinName);
            }

            if (!this.$originalNodes) {
                if (noError) {
                    return (this.baseName = this.skinName = 
                        this.originalNode = null);
                }
                
                throw new Error(ppc.formatErrorString(1077, this,
                    "Presentation",
                    "Could not load skin: " + this.baseSkin));
            }
            
            //this.skinset = this.skinName.split(":")[0];
        }

        if (this.$originalNodes)
            ppc.skins.setSkinPaths(this.skinName, this);
    };

    this.$getNewContext = function(type, amlNode){
        //#ifdef __DEBUG
        if (type != type.toLowerCase()) {
            throw new Error("Invalid layout node name ('" + type + "'). lowercase required");
        }

        if (!this.$originalNodes[type]) {
            throw new Error(ppc.formatErrorString(0, this,
                "Getting new skin item",
                "Missing node in skin description '" + type + "'"));
        }
        //#endif

        this.$pNodes[type] = this.$originalNodes[type].cloneNode(true);
    };

    this.$hasLayoutNode = function(type){
        //#ifdef __DEBUG
        if (type != type.toLowerCase()) {
            throw new Error("Invalid layout node name ('" + type + "'). lowercase required");
        }
        //#endif

        return this.$originalNodes[type] ? true : false;
    };

    this.$getLayoutNode = function(type, section, htmlNode){
        //#ifdef __DEBUG
        if (type != type.toLowerCase()) {
            throw new Error("Invalid layout node name ('" + type + "'). lowercase required");
        }
        if (!this.$pNodes) {
            throw new Error("Skin not loaded for :" + this.serialize(true));
        }
        //#endif

        var node = this.$pNodes[type] || this.$originalNodes[type];
        if (!node) {
            //#ifdef __DEBUG
            if (!this.$dcache)
                this.$dcache = {}

            if (!this.$dcache[type + "." + this.skinName]) {
                this.$dcache[type + "." + this.skinName] = true;
                ppc.console.info("Could not find node '" + type
                                 + "' in '" + this.skinName + "'", "skin");
            }
            //#endif
            return false;
        }

        if (!section)
            return htmlNode || ppc.getFirstElement(node);

        var textNode = node.getAttribute(section);
        if (!textNode)
            return null;

        return (htmlNode
            ? ppc.queryNode(htmlNode, textNode)
            : ppc.getFirstElement(node).selectSingleNode(textNode));
    };

    this.$getOption = function(type, section){
        type = type.toLowerCase(); //HACK: lowercasing should be solved in the comps.

        //var node = this.$pNodes[type];
        var node = this.$pNodes[type] || this.$originalNodes[type];
        if (!section || !node)
            return node;//ppc.getFirstElement(node);
        var option = node.selectSingleNode("@" + section);

        return option ? option.nodeValue : "";
    };

    this.$getExternal = function(tag, pNode, func, aml){
        if (!pNode)
            pNode = this.$pHtmlNode;
        if (!tag)
            tag = "main";
        //if (!aml)
            //aml = this.$aml;

        tag = tag.toLowerCase(); //HACK: make components case-insensitive

        this.$getNewContext(tag);
        var oExt = this.$getLayoutNode(tag);
        
        var node;
        if (node = (aml || this).getAttributeNode("style"))
            oExt.setAttribute("style", node.nodeValue);

        //if (node = (aml || this).getAttributeNode("class"))
            //this.$setStyleClass(oExt, (oldClass = node.nodeValue));

        if (func)
            func.call(this, oExt);

        oExt = ppc.insertHtmlNode(oExt, pNode);
        oExt.host = this;
        if (node = (aml || this).getAttributeNode("bgimage"))
            oExt.style.backgroundImage = "url(" + ppc.getAbsolutePath(
                this.mediaPath, node.nodeValue) + ")";

        if (!this.$baseCSSname)
            this.$baseCSSname = oExt.className.trim().split(" ")[0];

        return oExt;
    };

    // *** Focus *** //
    this.$focus = function(){
        if (!this.$ext)
            return;

        this.$setStyleClass(this.oFocus || this.$ext, this.$baseCSSname + "Focus");
    };

    this.$blur = function(){
        //#ifdef __WITH_RENAME
        if (this.renaming)
            this.stopRename(null, true);
        //#endif

        if (!this.$ext)
            return;

        this.$setStyleClass(this.oFocus || this.$ext, "", [this.$baseCSSname + "Focus"]);
    };

    this.$fixScrollBug = function(){
        if (this.$int != this.$ext)
            this.oFocus = this.$int;
        else {
            this.oFocus =
            this.$int   =
                this.$ext.appendChild(document.createElement("div"));

            this.$int.style.height = "100%";
            this.$int.className = "focusbug"
        }
    };

    // *** Caching *** //
    /*
    this.$setClearMessage    = function(msg){};
    this.$updateClearMessage = function(){}
    this.$removeClearMessage = function(){};*/
}).call(ppc.Presentation.prototype = new ppc.GuiElement());

ppc.config.$inheritProperties["skinset"] = 1;

// #endif
