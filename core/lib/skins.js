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

// #ifdef __WITH_PRESENTATION

/**
 * @private
 */
apf.skins = {
    skins  : {},
    css    : [],
    events : ["onmousemove", "onmousedown", "onmouseup", "onmouseout",
        "onclick", "ondragcopy", "ondragstart", "ondblclick"],

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
            : ""; //@todo make this absolute?

        var mediaPath = null, iconPath = null;
        mediaPath = xmlNode.getAttribute("media-path");
        if (mediaPath !== null)
            mediaPath = apf.getAbsolutePath(base || apf.hostPath, mediaPath);
        else if (refNode) {
            mediaPath = refNode.getAttribute("media-path");
            if (mediaPath !== null)
                mediaPath = apf.getAbsolutePath(apf.hostPath, mediaPath);
            else
                mediaPath = apf.getAbsolutePath(base || apf.hostPath, "images/");
        }
        
        iconPath = xmlNode.getAttribute("icon-path");
        if (iconPath !== null)
            iconPath = apf.getAbsolutePath(base || apf.hostPath, iconPath);
        else if (refNode) {
            iconPath = refNode.getAttribute("icon-path");
            if (iconPath !== null)
                iconPath = apf.getAbsolutePath(apf.hostPath, iconPath);
            else
                iconPath = apf.getAbsolutePath(base || apf.hostPath, "icons/");
        }
        
        if (!name)
            name = "default";

        if (xmlNode.getAttribute("id"))
            document.body.className += " " + xmlNode.getAttribute("id");

        var names = name.split("|");
        name = names[0];

        if (!this.skins[name] || name == "default") {
            this.skins[name] = {
                base     : base,
                name     : name,
                iconPath : iconPath,
                mediaPath: mediaPath,
                templates: {},
                originals: {},
                xml      : xmlNode
            }
            
            if (names.length > 1) {
                for (var i = 0; i < names.length; i++)
                    this.skins[names[i]] = this.skins[name];
            }
        }
        
        if (!this.skins["default"] && this.$first == refNode)
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

        this.purgeCss(mediaPath, iconPath);
        
        if (this.queue[name]) {
            for (var prop in this.queue[name]) {
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
        var o;
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
                this.loadStylesheet(apf.getAbsolutePath(basepath, node.getAttribute("src")));
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
        var t = this.skins[name].templates;
        for (i = 0; i < nodes.length; i++) {
            if (!nodes[i].firstChild)
                continue;
            t[nodes[i].firstChild.nodeValue.toLowerCase()] = xmlNode;
        }
    },

    loadedCss : "",
    purgeCss: function(imagepath, iconpath){
        if (!this.css.length)
            return;

        var cssString = this.css.join("\n").replace(/images\//g, imagepath).replace(/icons\//g, iconpath);
        apf.importCssString(cssString);

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
        apf.importCssString(cssString);

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

    getTemplate: function(skinName, noError){
        skinName = skinName.split(":");
        var name = skinName[0];
        var type = skinName[1];

        if (!this.skins[name]) {
            if (noError)
                return false;
            
            // #ifdef __DEBUG
            throw new Error(apf.formatErrorString(1077, null,
                "Retrieving Template",
                "Could not find skin '" + name + "'"));
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
                    "Missing presentation tag in '" + name + "'"));
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
        return apf.queryValue($xmlns(this.skins[skinName.split(":")[0]].xml,
            "style", apf.ns.aml)[0], "text()");
    },

    //#ifdef __WITH_SKIN_CHANGE
    changeSkinset : function(value){
        var node = apf.document.documentElement;
        while (node) {
            if (node && node.nodeFunc == apf.NODE_VISIBLE
              && node.hasFeature(apf.__PRESENTATION__) && !node.skinset) {
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
    //#endif
    
    queue : {},
    waitForSkin : function(skinset, id, callback){
        if (this.skins[skinset])
            return;
        
        (this.queue[skinset] || (this.queue[skinset] = {}))[id] = callback;
        return true;
    },

    //#ifdef __AMLICONMAP
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

        //#ifdef __AMLICONMAP
        var parts = strQuery.split(":"); //@todo apf3.x optimize this
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

//#endif