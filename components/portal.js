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
// #ifdef __JPORTAL || __INC_ALL
// #define __JMODALWINDOW 1

/**
 * Component displaying a rectangle consisting of one or more columns
 * which contain zero or more windows. Each window is loaded with specific
 * content described in a piece of JML also referred to as a "widget". Each
 * widget can have specific data loaded from a datasource. Each widget can
 * be instantiated more than once.
 *
 * @classDescription		This class creates a new portal
 * @return {Portal} Returns a new pages portal
 * @type {Portal}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:portal
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.portal = function(pHtmlNode){
    jpf.register(this, "portal", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    /* ***********************
     Skin
     ************************/
    this.$deInitNode = function(xmlNode, htmlNode){
        if (!htmlNode) 
            return;
        
        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    }
    
    this.$updateNode = function(xmlNode, htmlNode){
        this.applyRuleSetOnNode("icon", xmlNode);
    }
    
    this.$moveNode = function(xmlNode, htmlNode){
        if (!htmlNode) 
            return;
    }
    
    /* ***********************
     Keyboard Support
     ************************/
    //Handler for a plane list
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        var altKey   = e.altKey;
        
        if (!this.selected) 
            return;
        
        switch (key) {
            default:
                break;
        }
    });
    
    /* ***********************
     CACHING
     ************************/
    this.$getCurrentFragment = function(){
        //if(!this.value) return false;
        
        var fragment = jpf.hasDocumentFragment 
            ? document.createDocumentFragment() 
            : new DocumentFragment(); //IE55
        while (this.columns[0].childNodes.length) {
            fragment.appendChild(this.columns[0].childNodes[0]);
        }
        
        return fragment;
    }
    
    this.$setCurrentFragment = function(fragment){
        jpf.hasDocumentFragment 
            ? this.oInt.appendChild(fragment) 
            : fragment.reinsert(this.oInt); //IE55
        if (!jpf.window.isFocussed(this)) 
            this.blur();
    }
    
    this.$findNode = function(cacheNode, id){
        if (!cacheNode) 
            return this.pHtmlDoc.getElementById(id);
        return cacheNode.getElementById(id);
    }
    
    this.$setClearMessage = function(msg){
        var oEmpty = jpf.xmldb.htmlImport(this.$getLayoutNode("empty"), this.oInt);
        var empty  = this.$getLayoutNode("empty", "caption", oEmpty);
        if (empty) 
            jpf.xmldb.setNodeValue(empty, msg || "");
        if (oEmpty) 
            oEmpty.setAttribute("id", "empty" + this.uniqueId);
    }
    
    this.$removeClearMessage = function(){
        var oEmpty = document.getElementById("empty" + this.uniqueId);
        if (oEmpty) 
            oEmpty.parentNode.removeChild(oEmpty);
        //else this.oInt.innerHTML = ""; //clear if no empty message is supported
    }
    
    this.inherit(jpf.Cache); /** @inherits jpf.Cache */
    /* ***********************
     DATABINDING
     ************************/
    var portalNode = this;
    function createWidget(xmlNode, widget, dataNode){
        /* Model replacement - needs to be build
         var models = xmlNode.selectNodes("//model/@id");
         for (var i = 0; i < models.lenth; i++) {
             xmlNode.selectNodes("//node()[@model='" + models[i]
         }
         */
        //also replace widget id's
        var name = xmlNode.getAttribute("name");
        
        if (!jpf.canInsertGlobalCode) {
            var nodes = xmlNode.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i][jpf.TAGNAME] == "script") {
                    nodes[i].firstChild.nodeValue += "\nself." + name + " = " 
                        + name + ";";
                }
            }
        }
        
        //Load Widget
        widget.jml      = xmlNode;
        widget.$loadSkin("default:PortalWindow");
        widget.btnedit  = true;
        widget.btnmin   = true;
        widget.btnclose = true;
        
        widget.draw();//name
        widget.$loadJml(xmlNode, name);
        widget.setCaption(portalNode.applyRuleSetOnNode("caption", dataNode));
        widget.setIcon(portalNode.applyRuleSetOnNode("icon", dataNode));
        
        if (xmlNode.getAttribute("width")) 
            widget.setWidth(xmlNode.getAttribute("width"));
        else 
            widget.oExt.style.width = "auto";
        //if(xmlNode.getAttribute("height")) widget.setHeight(xmlNode.getAttribute("height"));
        //else widget.oExt.style.height = "auto";
        
        widget.display(0, 0);
        
        //Create WidgetClass
        if (!self[name]) {
            alert("could not find class '" + name + "'");
        }
        
        //instantiate class
        var widgetClass = new self[name]();
        portalNode.widgets.push(widgetClass);
        widgetClass.init(dataNode, widget);
    }
    
    this.widgets     = [];
    var widget_cache = {}
    this.$add = function(dataNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build window
        var pHtmlNode = this.columns[this.applyRuleSetOnNode("column", dataNode) || 0];
        var widget    = new jpf.modalwindow(pHtmlNode);
        widget.inherit(jpf.modalwindow.widget);
        
        widget.parentNode = this;
        widget.inherit(jpf.JmlDomApi);
        //this.applyRuleSetOnNode("border", xmlNode);
        
        var srcUrl = this.applyRuleSetOnNode("src", dataNode) || "file:" 
            + this.applyRuleSetOnNode("url", dataNode);
        
        if (widget_cache[srcUrl]) {
            var xmlNode = widget_cache[srcUrl];
            if (jpf.isSafariOld) 
                xmlNode = jpf.getJmlDocFromString(xmlNode).documentElement;
            createWidget(xmlNode, widget, dataNode);
        }
        else {
            jpf.setModel(srcUrl, {
                load: function(xmlNode){
                    if (!xmlNode || this.isLoaded) 
                        return;
                    
                    //hmmm this is not as optimized as I'd like (going throught the xml parser twice)
                    var strXml = xmlNode.xml || xmlNode.serialize();
                    
                    if (jpf.isSafariOld) {
                        strXml = strXml.replace(/name/, "name='" 
                            + xmlNode.getAttribute("name") + "'");
                        widget_cache[srcUrl] = strXml;
                    }
                    else {
                        xmlNode = jpf.getJmlDocFromString(strXml).documentElement;
                        widget_cache[srcUrl] = xmlNode.cloneNode(true);
                    }
                    
                    createWidget(xmlNode, widget, dataNode);
                    this.isLoaded = true;
                },
                
                setModel: function(model, xpath){
                    model.register(this, xpath);
                }
            });
        }
    }
    
    this.$fill = function(){
    }
    
    this.addEventListener("xmlupdate", function(e){
        if (e.action.match(/add|insert|move/)) {
            jpf.JmlParser.parseLastPass();
        }
    });
    
    /* ***********************
     Other Inheritance
     ************************/
    /**
     * @inherits jpf.Presentation
     * @inherits jpf.MultiSelect
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.Presentation, jpf.MultiSelect, jpf.DataBinding, jpf.JmlNode);
    
    this.$selectDefault = function(xmlNode){
        if (this.select(this.getFirstTraverseNode(xmlNode)))
            return true;
        else {
            var nodes = this.getTraverseNodes(xmlNode);
            for(var i = 0; i < nodes.length; i++) {
                if (this.$selectDefault(nodes[i]))
                    return true;
            }
        }
    }
    
    /* *********
     INIT
     **********/
    var totalWidth = 0;
    this.columns   = [];
    this.addColumn = function(size){
        this.$getNewContext("Column");
        var col = jpf.xmldb.htmlImport(this.$getLayoutNode("Column"), this.oInt);
        var id = this.columns.push(col) - 1;
        
        //col.style.left = totalWidth + (size.match(/%/) ? "%" : "px");
        totalWidth += parseFloat(size);
        
        col.style.width = size + (size.match(/%|px|pt/) ? "" : "px");//"33.33%";
        col.isColumn = true;
        col.host = this;
    }
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        
        //Create columns
        var cols = (this.jml.getAttribute("columns") || "33.33%,33.33%,33.33%").split(",");
        for (var i = 0; i < cols.length; i++) {
            this.addColumn(cols[i]);
        }
        
        //if(this.jml.childNodes.length) this.loadInlineData(this.jml);
        jpf.JmlParser.parseChildren(this.jml, null, this);
        
        if (document.elementFromPointAdd) 
            document.elementFromPointAdd(this.oExt);
    }
    
    this.$loadJml = function(x){
    
    }
}

/**
 * @constructor
 */
jpf.PortalWidget = function(){
    this.init = function(xmlSettings, oWidget){
        this.xmlSettings = xmlSettings
        this.oWidget = oWidget;
        
        if (this.$init) 
            this.$init(xmlSettings, oWidget);
    }
}

// #endif
