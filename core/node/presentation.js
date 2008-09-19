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

__PRESENTATION__ = 1 << 9;

// #ifdef __WITH_PRESENTATION

/*
 <root>
     <include src="src/blah.xml />
     <list>
         <style><![CDATA ]]></style>
         <presentation>
         
         </presentation>
     </list>
     <datagrid>
         <style src="" />
         <presentation>
         
         </presentation>
     </datagrid>
 </root>
 */
/**
 * @private
 * @define skin
 * @allowchild  style, presentation
 * @attribute src
 */
jpf.PresentationServer = {
    skins: {},
    css: [],
    
    /* ***********
     Init
     ************/
    Init: function(xmlNode, refNode, path){
        /*
         get data from refNode || xmlNode
         - name
         - icon-path
         - media-path
         
         all paths of the xmlNode are relative to the src attribute of refNode
         all paths of the refNode are relative to the index.html
         images/ is replaced if there is a refNode to the relative path from index to the skin + /images/
         */
        var name      = (refNode ? refNode.getAttribute("name") : null)
            || xmlNode.getAttribute("name");
        var base      = (refNode ? refNode.getAttribute("src").match(/\//) || path : "")
            ? (path || refNode.getAttribute("src")).replace(/\/[^\/]*$/, "") + "/"
            : "";
        var mediaPath = (xmlNode.getAttribute("media-path")
            ? jpf.getAbsolutePath(base || jpf.hostPath, xmlNode.getAttribute("media-path"))
            : (refNode ? refNode.getAttribute("media-path") : null));
        var iconPath  = (xmlNode.getAttribute("icon-path")
            ? jpf.getAbsolutePath(base || jpf.hostPath, xmlNode.getAttribute("icon-path"))
            : (refNode ? refNode.getAttribute("icon-path") : null));
        if (!name) 
            name = "default";
        
        if (xmlNode.getAttribute("name")) 
            document.body.className += " " + xmlNode.getAttribute("name");
        
        if (!this.skins[name]) {
            this.skins[name] = {
                base     : base,
                name     : name,
                iconPath : (iconPath === null)  ? "icons/" : iconPath,
                mediaPath: (mediaPath === null) ? "images/" : mediaPath,
                templates: {},
                originals: {},
                xml      : xmlNode
            }
        }
        if (!this.skins["default"]) 
            this.skins["default"] = this.skins[name];
        
        var nodes = xmlNode.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].nodeType != 1) 
                continue;
            
            //this.templates[nodes[i].tagName] = nodes[i];
            this.skins[name].templates[nodes[i].getAttribute("name")] = nodes[i];
            if (nodes[i].ownerDocument) 
                this.importSkinDef(nodes[i], base, name);
        }
        
        this.purgeCSS(mediaPath || base + "images/", iconPath || base + "icons/");
    },
    
    /**
     * This method loads a stylesheet from a url
     * @param {String}	filename Required The url to load the stylesheet from
     * @param {String}	title Optional Title of the stylesheet to load
     * @method
     */
    loadStylesheet: function(filename, title){
        with (o = document.getElementsByTagName("head")[0].appendChild(document.createElement("LINK"))) {
            rel   = "stylesheet";
            type  = "text/css";
            href  = filename;
            title = title;
        }
        
        return o;
    },
    
    /* ***********
     Import
     ************/
    importSkinDef: function(xmlNode, basepath, name){
        var nodes = $xmlns(xmlNode, "style", jpf.ns.jpf);
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].getAttribute("src")) 
                this.loadStylesheet(nodes[i].getAttribute("src").replace(/src/, basepath + "/src"));
            else 
                if (nodes[i].getAttribute("condition")) {
                    try {
                        var test = eval(nodes[i].getAttribute("condition"));
                    }
                    catch (e) {
                        test = false;
                    }
                    if (test) 
                        this.css.push(nodes[i].firstChild.nodeValue);
                }
                else 
                    if (nodes[i].firstChild) 
                        this.css.push(nodes[i].firstChild.nodeValue);
        }
        
        var nodes = xmlNode.selectNodes("alias");
        for (var i = 0; i < nodes.length; i++) {
            if (!nodes[i].firstChild) 
                continue;
            this.skins[name].templates[nodes[i].firstChild.nodeValue.toLowerCase()] = xmlNode;
        }
    },
    
    loadedCss : "",
    purgeCSS: function(imagepath, iconpath){
        if (!this.css.length) 
            return;
        
        var cssString = this.css.join("\n").replace(/images\//g, imagepath).replace(/icons\//g, iconpath);
        jpf.importCssString(document, cssString);
        
        //#ifdef __WITH_OFFLINE_APPLICATION
        this.loadedCss += cssString;
        //#endif
        
        this.css = [];
    },
    
    /* ***********
     Retrieve
     ************/
    setSkinPaths: function(skinName, jmlNode){
        skinName = skinName.split(":");
        var name = skinName[0];
        var type = skinName[1];
        
        // #ifdef __DEBUG
        if (!this.skins[name]) {
            throw new Error(jpf.formatErrorString(1076, null, "Retrieving Skin", "Could not find skin '" + name + "'", jmlNode.jml));
        }
        // #endif
        
        jmlNode.iconPath  = this.skins[name].iconPath;
        jmlNode.mediaPath = this.skins[name].mediaPath;
    },
    
    getTemplate: function(skinName, cJml){
        skinName = skinName.split(":");
        var name = skinName[0];
        var type = skinName[1];

        // #ifdef __DEBUG
        if (!this.skins[name]) {
            throw new Error(jpf.formatErrorString(1076, null, "Retrieving Template", "Could not find skin '" + name + "'", cJml));
        }
        // #endif
        
        if (!this.skins[name].templates[type]) return false;
        
        var skin      = this.skins[name].templates[type];
        var originals = this.skins[name].originals[type];
        if (!originals) {
            var originals = this.skins[name].originals[type] = {};
            
            // #ifdef __DEBUG
            if (!$xmlns(skin, "presentation", jpf.ns.jpf)[0]) {
                throw new Error(jpf.formatErrorString(1076, null, "Retrieving Template", "Missing presentation tag in '" + name + "'", cJml));
            }
            // #endif
            
            var nodes = $xmlns(skin, "presentation", jpf.ns.jpf)[0].childNodes;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1) continue;
                originals[nodes[i][jpf.TAGNAME]] = nodes[i];
            }
        }
        
        /*for (var item in originals) {
            pNodes[item] = originals[item];
        }*/
        
        return originals;
    },
    
    getCssString : function(skinName){
        return jpf.getXmlValue($xmlns(this.skins[skinName.split(":")[0]].xml,
            "style", jpf.ns.jpf)[0], "text()");
    }
}

/**
 * Baseclass adding skinning features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 */
jpf.Presentation = function(){
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    var pNodes, originalNodes;
    
    this.__regbase = this.__regbase | __PRESENTATION__;
    this.skinName  = null;
    
    //var cachedExts = {};
    
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    /**
     * Switches the skin from the current skin to another one based on the identifier for the new skin.
     *
     * @param  {String}  skinName  required  Identifier for the new skin (for example: 'default:List' or 'win').
     */
    this.changeSkin = function(skinName){
        if (this.skinName == skinName) 
            return;
        
        if (this.selectable) 
            var valueList = this.getSelection();//valueList;
        //cachedExts[this.cacheID] = this.oExt;
        
        this.baseCSSname = null;
        this.skinName = (skinName.indexOf(":") > -1
            ? skinName
            : skinName + ":" + this.tagName).toLowerCase();
        /*var cacheID = new String(this.cacheID).split("\|");
         cacheID = (this.baseSkin == this.skinName ? "" : this.skinName + "|") + (cacheID[1] || cacheID[0]);
         if(cachedExts[cacheID]){
             this.oExt.parentNode.replaceChild(cachedExts[cacheID], this.oExt);
             this.oExt = cachedExts[cacheID];
             return;
         }
         else */
        this.pHtmlNode = this.oExt.parentNode;
        var beforeNode = this.oExt.nextSibling;
        this.oExt.parentNode.removeChild(this.oExt);
        var id = this.oExt.getAttribute("id");
        
        //Load the new skin
        if (this.loadSkin) 
            this.loadSkin();
        
        //Drawing
        this.draw();
        if (id) 
            this.oExt.setAttribute("id", id);
        if (beforeNode) 
            this.oExt.parentNode.insertBefore(this.oExt, beforeNode);
        if (this.aData) 
            this.aData.oHtml = this.oExt;
        //this.__initLayout(this.jml); hopefully not necesary because everything is done by id
        
        // Widget specific
        if (this.__loadJml) 
            this.__loadJml(this.jml);
        
        //Process JML Handlers
        //for(var i=this.__jmlLoaders.length-1;i>=0;i--)
        //	this.__jmlLoaders[i].call(this, this.jml);
        
        //Process databinding
        jpf.JmlParser.parseLastPass();
        
        //Reload data
        if (this.hasFeature(__DATABINDING__) && this.XMLRoot) 
            this.load(this.XMLRoot, this.cacheID, true);
        
        //Dispatch event
        this.dispatchEvent("onskinchange");
        
        //DragDrop
        if (this.hasFeature(__DRAGDROP__)) 
            this.loadDragDrop();
        
        //Set Properties
        if (this.selectable) 
            this.selectList(valueList);
        if (this.disabled) 
            this.disable();
        if (this.__focussable && this.isFocussed()) 
            this.focus();
        
        //More properties of the dynamic kind
        for (var i = this.__supportedProperties.length - 1; i >= 0; --i) {
            var pValue = this[this.__supportedProperties[i]];
            if (!pValue) 
                continue;
            
            this.handlePropSet(this.__supportedProperties[i], pValue, true);
        }
        
        //Anchoring
        if (this.hasFeature(__ANCHORING__)) 
            this.purgeAnchoring();
        
        //Layout server
        jpf.layoutServer.activateRules(this.oExt.parentNode);
        jpf.layoutServer.forceResize(this.oExt.parentNode);
    }
    
    /**
     * Initializes the skin for this component when none has been set up.
     *
     * @param  {String}  skinName  required  Identifier for the new skin (for example: 'default:List' or 'win').
     */
    this.loadSkin = function(skinName){
        if (!skinName && this.jml) 
            skinName = this.jml.getAttribute("skin");
        if (skinName) 
            skinName = skinName.toLowerCase();
            
        if (!this.baseSkin) 
            this.baseSkin = (skinName
                ? (skinName.indexOf(":") > -1
                    ? skinName
                    : skinName + ":" + this.tagName)
                : null)
              || (jpf.PresentationServer.defaultSkin || "default") + ":" + this.tagName;
              
        if (!this.skinName) 
            this.skinName = this.baseSkin;
        
        pNodes = {}; //reset the pNodes collection
        originalNodes = jpf.PresentationServer.getTemplate(this.skinName, this.jml);
        if (!originalNodes) {
            this.baseName = this.skinName = "default:" + this.tagName;
            originalNodes = jpf.PresentationServer.getTemplate(this.skinName, this.jml);
            
            if (!originalNodes) 
                throw new Error(jpf.formatErrorString(1077, this, "Presentation", "Could not load skin: " + this.skinName, this.jml));
        }
        if (originalNodes) 
            jpf.PresentationServer.setSkinPaths(this.skinName, this);
    }
    
    this.__getNewContext = function(type, jmlNode){
        type = type.toLowerCase(); //HACK: lowercasing should be solved in the comps.
        pNodes[type] = originalNodes[type].cloneNode(true);
    }
    
    this.__hasLayoutNode = function(type){
        //return pNodes[type] ? true : false;
        type = type.toLowerCase(); //HACK: lowercasing should be solved in the comps.
        return originalNodes[type] ? true : false;
    }
    
    this.__getLayoutNode = function(type, section, htmlNode){
        type = type.toLowerCase(); //HACK: lowercasing should be solved in the comps.
        
        var node = pNodes[type] || originalNodes[type];
        if (!node) {
            //#ifdef __DEBUG
            if (!this.__dcache)
                this.__dcache = {}
            
            if (!this.__dcache[type + "." + this.skinName]) {
                this.__dcache[type + "." + this.skinName] = true;
                jpf.console.info("Could not find node '" + type + "' in '" + this.skinName + "'", "skin");
            }
            //#endif
            return false;
        }
        
        if (!section)
            return jpf.getFirstElement(node);
        
        var textNode = node.selectSingleNode("@" + section);
        
        // #ifdef __DEBUG
        //if(textNode) try{(htmlNode ? jpf.xmldb.selectSingleNode(textNode.nodeValue, htmlNode) : getFirstElement(node).selectSingleNode(textNode.nodeValue))}catch(e){throw new Error("---- Javeline Error ----\nMessage : Could not find Presentation Skin Item (" + e.message + "): '" + section + " -> " + textNode.nodeValue + "'\n" + node.xml)}
        // #endif
        
        if (!textNode) {
            //#ifdef __DEBUG
            if (!this.__dcache)
                this.__dcache = {}
            
            if (!this.__dcache[section + "." + this.skinName]) {
                this.__dcache[section + "." + this.skinName] = true;
                jpf.console.info("Could not find textnode '" + section + "' in '" + this.skinName + "'", "skin");
            }
            //#endif
            return null;
        }

        return (htmlNode
            ? jpf.xmldb.selectSingleNode(textNode.nodeValue, htmlNode)
            : jpf.getFirstElement(node).selectSingleNode(textNode.nodeValue));
    }
    
    this.__getOption = function(type, section){
        type = type.toLowerCase(); //HACK: lowercasing should be solved in the comps.
        
        //var node = pNodes[type];
        var node = pNodes[type] || originalNodes[type];
        if (!section) 
            return node;//jpf.getFirstElement(node);
        var option = node.selectSingleNode("@" + section);
        
        return option ? option.nodeValue : "";
    }
    
    this.__getExternal = function(tag, pNode, func, jml){
        if (!pNode) 
            pNode = this.pHtmlNode;
        if (!tag) 
            tag = "main";
        if (!jml) 
            jml = this.jml;
        
        tag = tag.toLowerCase(); //HACK: make components case-insensitive
        
        this.__getNewContext(tag);
        var oExt = this.__getLayoutNode(tag);
        if (jml && jml.getAttributeNode("style")) 
            oExt.setAttribute("style", jml.getAttribute("style"));
        if (jml && jml.getAttributeNode("class")) 
            this.__setStyleClass(oExt, jml.getAttribute("class"));
        if (func) 
            func.call(this, oExt);
        
        oExt = jpf.xmldb.htmlImport(oExt, pNode);
        oExt.host = this;
        if (jml && jml.getAttribute("bgimage")) 
            oExt.style.backgroundImage = "url(" + jpf.getAbsolutePath(
                this.mediaPath, jml.getAttribute("bgimage")) + ")";
        
        if (!this.baseCSSname) 
            this.baseCSSname = oExt.className.trim().split(" ")[0];
        
        return oExt;
    }
    
    /* ***********************
     Focus
     ************************/
    this.__focus = function(){
        if (!this.oExt) 
            return;
            
        this.__setStyleClass(this.oFocus || this.oExt, this.baseCSSname + "Focus");
    }
    
    this.__blur = function(){
        if (!this.oExt) 
            return;
        
        this.__setStyleClass(this.oFocus || this.oExt, "", [this.baseCSSname + "Focus"]);
    }
    
    /* ***********************
     SELECT
     ************************/
    if (this.hasFeature(__MULTISELECT__)) {
        this.__select = function(o){
            if (!o || !o.style) 
                return;
            return this.__setStyleClass(o, "selected");
        }
        
        this.__deselect = function(o){
            if (!o) 
                return;
            return this.__setStyleClass(o, "", ["selected", "indicate"]);
        }
        
        this.__indicate = function(o){
            if (!o) 
                return;
            return this.__setStyleClass(o, "indicate");
        }
        
        this.__deindicate = function(o){
            if (!o) 
                return;
            return this.__setStyleClass(o, "", ["indicate"]);
        }
    }
    
    /* ***********************
     CACHING
     ************************/
    this.__setEmptyMessage    = function(msg){};
    
    this.__removeEmptyMessage = function(){};
    
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    this.__setStyleClass      = jpf.setStyleClass;
}

// #endif
