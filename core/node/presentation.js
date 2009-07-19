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

var __PRESENTATION__ = 1 << 9;

// #ifdef __WITH_PRESENTATION

/**
 * @private
 * @define skin
 * @allowchild  style, presentation
 * @attribute src
 */
apf.skins = {
    skins  : {},
    css    : [],
    events : ["onmousemove", "onmousedown", "onmouseup", "onmouseout",
        "onclick", "ondragmove", "ondragstart"],

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
        var name      = (refNode ? refNode.getAttribute("id") : null)
            || xmlNode.getAttribute("id");
        var base      = (refNode ? refNode.getAttribute("src").match(/\//) || path : "")
            ? (path || refNode.getAttribute("src")).replace(/\/[^\/]*$/, "") + "/"
            : "";
        var mediaPath = (xmlNode.getAttribute("media-path")
            ? apf.getAbsolutePath(base || apf.hostPath, xmlNode.getAttribute("media-path"))
            : (refNode ? refNode.getAttribute("media-path") : null));
        var iconPath  = (xmlNode.getAttribute("icon-path")
            ? apf.getAbsolutePath(base || apf.hostPath, xmlNode.getAttribute("icon-path"))
            : (refNode ? refNode.getAttribute("icon-path") : null));
        if (!name)
            name = "default";

        if (xmlNode.getAttribute("id"))
            document.body.className += " " + xmlNode.getAttribute("id");

        if (!this.skins[name] || name == "default") {
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

        this.purgeCss(mediaPath || base + "images/", iconPath || base + "icons/");
        
        if (this.queue[name]) {
            for (prop in this.queue[name]) {
                this.queue[name][prop]();
            }
        }
    },

    /**
     * This method loads a stylesheet from a url
     * @param {String}    filename Required The url to load the stylesheet from
     * @param {String}    title Optional Title of the stylesheet to load
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
        var i, l, nodes = $xmlns(xmlNode, "style", apf.ns.aml), tnode, node;
        for (i = 0, l = nodes.length; i < l; i++) {
            node = nodes[i];

            if (node.getAttribute("src"))
                this.loadStylesheet(node.getAttribute("src").replace(/src/, basepath + "/src"));
            else {
                var test = true;
                if (node.getAttribute("condition")) {
                    try {
                        test = eval(node.getAttribute("condition"));
                    }
                    catch (e) {
                        test = false;
                    }
                }

                if (test) {
                    //#-ifndef __PROCESSED
                    tnode = node.firstChild;
                    while (tnode) {
                        this.css.push(tnode.nodeValue);
                        tnode = tnode.nextSibling;
                    }
                    /*#-else
                    this.css.push(nodes[i].firstChild.nodeValue);
                    #-endif*/
                }
            }
        }

        nodes = $xmlns(xmlNode, "alias", apf.ns.apf);
        for (i = 0; i < nodes.length; i++) {
            if (!nodes[i].firstChild)
                continue;
            this.skins[name].templates[nodes[i].firstChild.nodeValue.toLowerCase()] = xmlNode;
        }
    },

    loadedCss : "",
    purgeCss: function(imagepath, iconpath){
        if (!this.css.length)
            return;

        var cssString = this.css.join("\n").replace(/images\//g, imagepath).replace(/icons\//g, iconpath);
        apf.importCssString(document, cssString);

        //#ifdef __WITH_OFFLINE_APPLICATION
        this.loadedCss += cssString;
        //#endif

        this.css = [];
    },

    loadCssInWindow : function(skinName, win, imagepath, iconpath){
        this.css = [];
        var name = skinName.split(":");
        var skin = this.skins[name[0]];
        var template = skin.templates[name[1]];
        this.importSkinDef(template, skin.base, skin.name);
        var cssString = this.css.join("\n").replace(/images\//g, imagepath).replace(/icons\//g, iconpath);
        apf.importCssString(win.document, cssString);

        this.css = [];
    },

    /* ***********
     Retrieve
     ************/
    setSkinPaths: function(skinName, amlNode){
        skinName = skinName.split(":");
        var name = skinName[0];
        var type = skinName[1];

        // #ifdef __DEBUG
        if (!this.skins[name]) {
            throw new Error(apf.formatErrorString(1076, null,
                "Retrieving Skin",
                "Could not find skin '" + name + "'", amlNode.$aml));
        }
        // #endif

        amlNode.iconPath  = this.skins[name].iconPath;
        amlNode.mediaPath = this.skins[name].mediaPath;
    },

    getTemplate: function(skinName, cAml, noError){
        skinName = skinName.split(":");
        var name = skinName[0];
        var type = skinName[1];

        if (!this.skins[name]) {
            if (noError)
                return false;
            
            // #ifdef __DEBUG
            throw new Error(apf.formatErrorString(1077, null,
                "Retrieving Template",
                "Could not find skin '" + name + "'", cAml));
            // #endif
            
            return false;
        }

        if (!this.skins[name].templates[type])
            return false;

        var skin      = this.skins[name].templates[type];
        var originals = this.skins[name].originals[type];
        if (!originals) {
            originals = this.skins[name].originals[type] = {};

            // #ifdef __DEBUG
            if (!$xmlns(skin, "presentation", apf.ns.aml)[0]) {
                throw new Error(apf.formatErrorString(1078, null,
                    "Retrieving Template",
                    "Missing presentation tag in '" + name + "'", cAml));
            }
            // #endif

            var nodes = $xmlns(skin, "presentation", apf.ns.aml)[0].childNodes;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1) continue;
                originals[nodes[i].baseName || nodes[i][apf.TAGNAME]] = nodes[i];
            }
        }

        /*for (var item in originals) {
            pNodes[item] = originals[item];
        }*/

        return originals;
    },

    getCssString : function(skinName){
        return apf.getXmlValue($xmlns(this.skins[skinName.split(":")[0]].xml,
            "style", apf.ns.aml)[0], "text()");
    },

    changeSkinset : function(value){
        var node = apf.document.documentElement;
        while (node) {
            if (node && node.nodeFunc == apf.NODE_VISIBLE
              && node.hasFeature(__PRESENTATION__) && !node.skinset) {
                node.$propHandlers["skinset"].call(node, value);//$forceSkinChange
                node.skinset = null;
            }

            //Walk tree
            if (node.firstChild || node.nextSibling) {
                node = node.firstChild || node.nextSibling;
            }
            else {
                do {
                    node = node.parentNode;
                } while (node && !node.nextSibling)

                if (node)
                    node = node.nextSibling;
            }
        }
    },
    
    queue : {},
    waitForSkin : function(skinset, id, callback){
        if (this.skins[skinset])
            return;
        
        (this.queue[skinset] || (this.queue[skinset] = {}))[id] = callback;
        return true;
    },

    //#ifdef __WITH_ICONMAP
    iconMaps : {},
    addIconMap : function(options){
        this.iconMaps[options.name] = options;
        if (options.size)
            options.width = options.height = options.size;
        else {
            if (!options.width)
                options.width = 1;
            if (!options.height)
                options.height = 1;
        }
    },
    //#endif

    setIcon : function(oHtml, strQuery, iconPath){
        if (!strQuery) {
            oHtml.style.backgroundImage = "";
            return;
        }

        if (oHtml.tagName.toLowerCase() == "img") {
            oHtml.setAttribute("src", strQuery
                ? (iconPath || "") + strQuery
                : "");
            return;
        }

        //#ifdef __WITH_ICONMAP
        var parts = strQuery.split(":");
        var map = this.iconMaps[parts[0]];
        if (map) {
            var left, top, coords = parts[1].split(",");
            left = (coords[(map.type == "vertical") ? 1 : 0] || 0) * map.width;
            top  = (coords[(map.type == "vertical") ? 0 : 1] || 0) * map.height;

            oHtml.style.backgroundImage = "url(" + (iconPath || "")
                + map.src + ")";
            oHtml.style.backgroundPosition = ((-1 * left) - map.offset[0])
                + "px " + ((-1 * top) - map.offset[1]) + "px";
        }
        else
        //#endif

        //Assuming image url
        {
            //#ifdef __DEBUG
            //@todo check here if it is really a url
            //#endif

            oHtml.style.backgroundImage = "url(" + (iconPath || "")
                + strQuery + ")";
        }
    }
};

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have skinning features. A skin is a description
 * of how the element is rendered. In the web browser this is done using html
 * elements and css.
 * Remarks:
 * The skin is set using the skin attribute. The skin of each element can be
 * changed at run time. Other than just changing the look of an element, a skin
 * change can help the user to perceive information in a different way. For 
 * example a list element has a default skin, but can also use the thumbnail 
 * skin to display thumbnails of the {@link term.datanode data nodes}.
 *
 * A skin for an element is always build up out of a standard set of parts.
 * <code>
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
 * </code>
 * The alias contains a name that contains alternative names for the skin. The
 * style tags contain the css. The main tag contains the html elements that are
 * created when the component is created. Any other skin items are used to render
 * other elements of the widget. In this reference guide you will find these
 * skin items described on the pages of each widget.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.5
 */
apf.Presentation = function(){
    var pNodes, originalNodes;

    this.$regbase = this.$regbase | __PRESENTATION__;
    this.skinName = null;
    var _self     = this;
    var skinTimer;

    /**** Properties and Attributes ****/

    this.$supportedProperties.push("skin");
    /**
     * @attribute {string} skinset the skinset for
     * this element. If none is specified the skinset attribute
     * of <a:appsettings /> is used. When not defined the default skinset
     * is accessed.
     * Example:
     * <code>
     *  <a:list skinset="perspex" />
     * </code>
     */
    this.$propHandlers["skinset"] =

    /**
     * @attribute {string} skin the name of the skin in the skinset that defines 
     * how this element is rendered. When a skin is changed the full state of the
     * element is kept including it's selection, all the
     * aml attributes, loaded data, focus and disabled state.
     * Example:
     * <code>
     *  <a:list id="lstExample" skin="thumbnails" />
     * </code>
     * Example:
     * <code>
     *  lstExample.setAttribute("skin", "list");
     * </code>
     */
    this.$propHandlers["skin"] = function(value){
        if (!this.$amlLoaded) //If we didn't load a skin yet, this will be done when we attach to a parent
            return;

        if (!skinTimer) {
            clearTimeout(skinTimer);
            skinTimer = setTimeout(function(){
                changeSkin.call(_self);
                skinTimer = null;
            });
        }
    }

    /**
     * @attribute {String} style the css style applied to the this element. This can be a string containing one or more css rules.
     */
    this.$propHandlers["style"] = function(value){
        if (!apf.isParsing)
            this.oExt.setAttribute("style", value);
    }

    var oldClass;
    /**
     * @attribute {String} class the name of the css style class applied to the this element.
     */
    this.$propHandlers["class"] = function(value){
        this.$setStyleClass(this.oExt, value, [oldClass || ""])
    }

    this.$forceSkinChange = function(skin, skinset){
        changeSkin.call(this, skin, skinset);
    }

    function changeSkin(skin, skinset){
        clearTimeout(skinTimer);

        //var skinName = (skinset || this.skinset || apf.appsettings.skinset)
        //    + ":" + (skin || this.skin || this.tagName);

        //#ifdef __WITH_MULTISELECT
        //Store selection
        if (this.selectable)
            var valueList = this.getSelection();//valueList;
        //#endif

        //Store needed state information
        var oExt = this.oExt;
        var beforeNode = oExt.nextSibling;
        var id         = this.oExt.getAttribute("id");
        var oldBase    = this.baseCSSname;

        if (oExt.parentNode)
            oExt.parentNode.removeChild(oExt);

        //@todo changing skin will leak A LOT, should call $destroy here, with some extra magic
        if (this.$destroy)
            this.$destroy(true);

        //Load the new skin
        this.skin = skin;
        this.skinName = null;
        this.$loadSkin(skinset ? skinset + ":" + skin : null);

        //Draw
        this.$draw();

        if (id)
            this.oExt.setAttribute("id", id);

        if (beforeNode)
            this.oExt.parentNode.insertBefore(this.oExt, beforeNode);

        //Copy classes
        var i, l, newclasses = [],
               classes    = (oExt.className || "").splitSafe("\s+");
        for (i = 0; i < classes; i++) {
            if (classes[i] && classes[i] != oldBase)
                newclasses.push(classes[i].replace(oldBase, this.baseCSSname));
        }
        apf.setStyleClass(this.oExt, newclasses.join(" "));

        //Copy events
        var en, ev = apf.skins.events;
        for (i = 0, l = ev.length; i < l; i++) {
            en = ev[i];
            if (typeof oExt[en] == "function" && !this.oExt[en])
                this.oExt[en] = oExt[en];
        }

        //Copy css state (dunno if this is best)
        this.oExt.style.left     = oExt.style.left;
        this.oExt.style.top      = oExt.style.top;
        this.oExt.style.width    = oExt.style.width;
        this.oExt.style.height   = oExt.style.height;
        this.oExt.style.right    = oExt.style.right;
        this.oExt.style.bottom   = oExt.style.bottom;
        this.oExt.style.zIndex   = oExt.style.zIndex;
        this.oExt.style.position = oExt.style.position;
        this.oExt.style.display  = oExt.style.display;

        //Widget specific
        if (this.$loadAml)
            this.$loadAml(this.$aml);

        //#ifdef __WITH_DRAGDROP
        //DragDrop
        if (this.hasFeature(__DRAGDROP__)) {
            if (document.elementFromPointAdd) {
                document.elementFromPointRemove(oExt);
                document.elementFromPointAdd(this.oExt);
            }
        }
        //#endif

        //Check disabled state
        if (this.disabled)
            this.$disable();

        //Check focussed state
        if (this.$focussable && apf.window.focussed == this)
            this.$focus();

        //#ifdef __WITH_DATABINDING
        //Reload data
        if (this.hasFeature(__DATABINDING__) && this.xmlRoot)
            this.reload();
        else
        //#endif
        if (this.value)
            this.$propHandlers["value"].call(this, this.value);

        //#ifdef __WITH_MULTISELECT
        //Set Selection
        if (this.hasFeature(__MULTISELECT__)) {
            if (this.selectable)
                this.selectList(valueList, true);
        }
        //#endif

        //#ifdef __WITH_ALIGNMENT
        if (this.hasFeature(__ALIGNMENT__)) {
            if (this.aData)
                this.aData.oHtml = this.oExt;

            if (this.pData) {
                this.pData.oHtml = this.oExt;
                this.pData.pHtml = this.oInt;

                var nodes = this.pData.childNodes;
                for (i = 0; i < nodes.length; i++) {
                    nodes[i].pHtml = this.oInt; //Should this be recursive??
                }
            }
        }
        //#endif

        //#ifdef __WITH_INTERACTIVE
        if (this.draggable)
            this.$propHandlers["draggable"].call(this, this.draggable);
        if (this.resizable)
            this.$propHandlers["resizable"].call(this, this.resizable);
        //#endif

        if (this.$skinchange)
            this.$skinchange();

        //Dispatch event
        //this.dispatchEvent("skinchange");
    };

    /**** Private methods ****/

    this.$setStyleClass = apf.setStyleClass;

    /**
     * Initializes the skin for this element when none has been set up.
     *
     * @param  {String}  skinName  required  Identifier for the new skin (for example: 'default:List' or 'win').
     */
    this.$loadSkin = function(skinName){
        this.baseSkin = skinName || this.skinName || (this.skinset || this.$aml
            && apf.xmldb.getInheritedAttribute(this.$aml, "skinset") 
            || apf.appsettings.skinset)
            + ":" + (this.skin || this.$aml
            && this.$aml.getAttribute("skin") || this.tagName);

        if (this.skinName) {
            this.$blur();
            this.baseCSSname = null;
        }

        this.skinName = this.baseSkin; //Why??
        //this.skinset  = this.skinName.split(":")[0];

        pNodes = {}; //reset the pNodes collection
        originalNodes = apf.skins.getTemplate(this.skinName, this.$aml, true);

        if (!originalNodes) {
            var skin = this.skin || this.$aml && this.$aml.getAttribute("skin");
            if (skin) {
                var skinset = this.skinName.split(":")[0];
                this.baseName = this.skinName = "default:" + skin;
                originalNodes = apf.skins.getTemplate(this.skinName, this.$aml);
                
                if (!originalNodes && skinset != "default") {
                    this.baseName = this.skinName = skinset + ":" + this.tagName;
                    originalNodes = apf.skins.getTemplate(this.skinName, this.$aml, true);
                }
            }
            
            if (!originalNodes) {
                this.baseName = this.skinName = "default:" + this.tagName;
                originalNodes = apf.skins.getTemplate(this.skinName, this.$aml);
            }

            if (!originalNodes) {
                throw new Error(apf.formatErrorString(1077, this,
                    "Presentation",
                    "Could not load skin: " + this.skinName, this.$aml));
            }
            
            //this.skinset = this.skinName.split(":")[0];
        }

        if (originalNodes)
            apf.skins.setSkinPaths(this.skinName, this);
    };

    this.$getNewContext = function(type, amlNode){
        //#ifdef __DEBUG
        if (type != type.toLowerCase()) {
            throw new Error("Invalid layout node name ('" + type + "'). lowercase required");
        }

        if (!originalNodes[type]) {
            throw new Error(apf.formatErrorString(0, this,
                "Getting new skin item",
                "Missing node in skin description '" + type + "'"));
        }
        //#endif

        pNodes[type] = originalNodes[type].cloneNode(true);
    };

    this.$hasLayoutNode = function(type){
        //#ifdef __DEBUG
        if (type != type.toLowerCase()) {
            throw new Error("Invalid layout node name ('" + type + "'). lowercase required");
        }
        //#endif

        return originalNodes[type] ? true : false;
    };

    this.$getLayoutNode = function(type, section, htmlNode){
        //#ifdef __DEBUG
        if (type != type.toLowerCase()) {
            throw new Error("Invalid layout node name ('" + type + "'). lowercase required");
        }
        //#endif

        var node = pNodes[type] || originalNodes[type];
        if (!node) {
            //#ifdef __DEBUG
            if (!this.$dcache)
                this.$dcache = {}

            if (!this.$dcache[type + "." + this.skinName]) {
                this.$dcache[type + "." + this.skinName] = true;
                apf.console.info("Could not find node '" + type
                                 + "' in '" + this.skinName + "'", "skin");
            }
            //#endif
            return false;
        }

        if (!section)
            return apf.getFirstElement(node);

        var textNode = node.selectSingleNode("@" + section);
        if (!textNode) {
            //#ifdef __DEBUG
            if (!this.$dcache)
                this.$dcache = {}

            if (!this.$dcache[section + "." + this.skinName]) {
                this.$dcache[section + "." + this.skinName] = true;
                apf.console.info("Could not find textnode '" + section
                                 + "' in '" + this.skinName + "'", "skin");
            }
            //#endif
            return null;
        }

        return (htmlNode
            ? apf.xmldb.selectSingleNode(textNode.nodeValue, htmlNode)
            : apf.getFirstElement(node).selectSingleNode(textNode.nodeValue));
    };

    this.$getOption = function(type, section){
        type = type.toLowerCase(); //HACK: lowercasing should be solved in the comps.

        //var node = pNodes[type];
        var node = pNodes[type] || originalNodes[type];
        if (!section)
            return node;//apf.getFirstElement(node);
        var option = node.selectSingleNode("@" + section);

        return option ? option.nodeValue : "";
    };

    this.$getExternal = function(tag, pNode, func, aml){
        if (!pNode)
            pNode = this.pHtmlNode;
        if (!tag)
            tag = "main";
        if (!aml)
            aml = this.$aml;

        tag = tag.toLowerCase(); //HACK: make components case-insensitive

        this.$getNewContext(tag);
        var oExt = this.$getLayoutNode(tag);
        if (aml && aml.getAttributeNode("style"))
            oExt.setAttribute("style", aml.getAttribute("style"));

        if (aml && (aml.getAttributeNode("class") || aml.className)) {
            this.$setStyleClass(oExt,
                (oldClass = aml.getAttribute("class") || aml.className));
        }

        if (func)
            func.call(this, oExt);

        oExt = apf.xmldb.htmlImport(oExt, pNode);
        oExt.host = this;
        if (aml && aml.getAttribute("bgimage"))
            oExt.style.backgroundImage = "url(" + apf.getAbsolutePath(
                this.mediaPath, aml.getAttribute("bgimage")) + ")";


        if (!this.baseCSSname)
            this.baseCSSname = oExt.className.trim().split(" ")[0];

        return oExt;
    };

    /**** Focus ****/
    this.$focus = function(){
        if (!this.oExt)
            return;

        this.$setStyleClass(this.oFocus || this.oExt, this.baseCSSname + "Focus");
    };

    this.$blur = function(){
        //#ifdef __WITH_RENAME
        if (this.renaming)
            this.stopRename(null, true);
        //#endif

        if (!this.oExt)
            return;

        this.$setStyleClass(this.oFocus || this.oExt, "", [this.baseCSSname + "Focus"]);
    };

    if (apf.hasCssUpdateScrollbarBug) {
        this.$fixScrollBug = function(){
            if (this.oInt != this.oExt)
                this.oFocus = this.oInt;
            else {
                this.oFocus =
                this.oInt   =
                    this.oExt.appendChild(document.createElement("div"));

                this.oInt.style.height = "100%";
                this.oInt.className = "focusbug"
            }
        };
    }

    /**** Selection ****/
    if (this.hasFeature(__MULTISELECT__)) {
        this.$select = function(o){
            //#ifdef __WITH_RENAME
            if (this.renaming)
                this.stopRename(null, true);
            //#endif

            if (!o || !o.style)
                return;
            return this.$setStyleClass(o, "selected");
        };

        this.$deselect = function(o){
            //#ifdef __WITH_RENAME
            if (this.renaming) {
                this.stopRename(null, true);

                if (this.ctrlselect)
                    return false;
            }
            //#endif

            if (!o)
                return;
            return this.$setStyleClass(o, "", ["selected", "indicate"]);
        };

        this.$indicate = function(o){
            //#ifdef __WITH_RENAME
            if (this.renaming)
                this.stopRename(null, true);
            //#endif

            if (!o)
                return;
            return this.$setStyleClass(o, "indicate");
        };

        this.$deindicate = function(o){
            //#ifdef __WITH_RENAME
            if (this.renaming)
                this.stopRename(null, true);
            //#endif

            if (!o)
                return;
            return this.$setStyleClass(o, "", ["indicate"]);
        };
    }

    /**** Caching ****/
    /*
    this.$setClearMessage    = function(msg){};
    this.$updateClearMessage = function(){}
    this.$removeClearMessage = function(){};*/
};

// #endif
