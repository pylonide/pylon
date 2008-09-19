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
    
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    /* ********************************************************************
     PRIVATE METHODS
     *********************************************************************/
    /* ***********************
     Skin
     ************************/
    this.__deInitNode = function(xmlNode, htmlNode){
        if (!htmlNode) 
            return;
        
        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    }
    
    this.__updateNode = function(xmlNode, htmlNode){
        this.applyRuleSetOnNode("icon", xmlNode);
    }
    
    this.__moveNode = function(xmlNode, htmlNode){
        if (!htmlNode) 
            return;
    }
    
    /* ***********************
     Keyboard Support
     ************************/
    //Handler for a plane list
    this.__keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if (!this.selected) 
            return;
        
        switch (key) {
            default:
                break;
        }
    }
    
    /* ***********************
     CACHING
     ************************/
    this.__getCurrentFragment = function(){
        //if(!this.value) return false;
        
        var fragment = jpf.hasDocumentFragment 
            ? document.createDocumentFragment() 
            : new DocumentFragment(); //IE55
        while (this.columns[0].childNodes.length) {
            fragment.appendChild(this.columns[0].childNodes[0]);
        }
        
        return fragment;
    }
    
    this.__setCurrentFragment = function(fragment){
        jpf.hasDocumentFragment 
            ? this.oInt.appendChild(fragment) 
            : fragment.reinsert(this.oInt); //IE55
        if (!jpf.window.isFocussed(this)) 
            this.blur();
    }
    
    this.__findNode = function(cacheNode, id){
        if (!cacheNode) 
            return this.pHtmlDoc.getElementById(id);
        return cacheNode.getElementById(id);
    }
    
    this.__setClearMessage = function(msg){
        var oEmpty = jpf.xmldb.htmlImport(this.__getLayoutNode("empty"), this.oInt);
        var empty  = this.__getLayoutNode("empty", "caption", oEmpty);
        if (empty) 
            jpf.xmldb.setNodeValue(empty, msg || "");
        if (oEmpty) 
            oEmpty.setAttribute("id", "empty" + this.uniqueId);
    }
    
    this.__removeClearMessage = function(){
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
        widget.loadSkin("default:PortalWindow");
        widget.btnedit  = true;
        widget.btnmin   = true;
        widget.btnclose = true;
        
        widget.draw();//name
        widget.__loadJml(xmlNode, name);
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
    this.__add = function(dataNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
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
    
    this.__fill = function(){
    }
    
    this.addEventListener("onxmlupdate", function(e){
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
    
    this.__selectDefault = function(xmlNode){
        if (this.select(this.getFirstTraverseNode(xmlNode)))
            return true;
        else {
            var nodes = this.getTraverseNodes(xmlNode);
            for(var i = 0; i < nodes.length; i++) {
                if (this.__selectDefault(nodes[i]))
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
        this.__getNewContext("Column");
        var col = jpf.xmldb.htmlImport(this.__getLayoutNode("Column"), this.oInt);
        var id = this.columns.push(col) - 1;
        
        //col.style.left = totalWidth + (size.match(/%/) ? "%" : "px");
        totalWidth += parseFloat(size);
        
        col.style.width = size + (size.match(/%|px|pt/) ? "" : "px");//"33.33%";
        col.isColumn = true;
        col.host = this;
    }
    
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal();
        this.oInt = this.__getLayoutNode("Main", "container", this.oExt);
        
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
    
    this.__loadJml = function(x){
    
    }
    
    this.loadInlineData = function(x){
        var hasIcon, strData = [], nodes = x.childNodes;
        
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].nodeType != 1) 
                continue;
            if (nodes[i][jpf.TAGNAME] != "item") 
                continue;
            
            hasIcon = nodes[i].getAttribute("icon") || "icoAnything.gif";
            strData.unshift("<item " + (hasIcon ? "icon='" + hasIcon + "'" : "") 
                + " value='" + (nodes[i].getAttributeNode("value") 
                ? nodes[i].getAttribute("value") 
                : nodes[i].firstChild.nodeValue) + "'>" 
                + nodes[i].firstChild.nodeValue + "</item>");
            nodes[i].parentNode.removeChild(nodes[i]);
        }
        
        if (strData.length) {
            var sNode = new jpf.SmartBinding(null, jpf.xmldb.getXmlDom(
                  "<smartbindings xmlns='" + jpf.ns.jpf 
                + "'><bindings><caption select='text()' />" 
                + (hasIcon ? "<icon select='@icon'/>" : "") 
                + "<value select='@value'/><traverse select='item' /></bindings><model><items>" 
                + strData.join("") + "</items></model></smartbindings>").documentElement);
            jpf.JmlParser.addToSbStack(this.uniqueId, sNode);
        }
        
        if (x.childNodes.length) 
            jpf.JmlParser.parseChildren(x, null, this);
    }
}

/**
 * @constructor
 */
jpf.PortalWidget = function(){
    this.init = function(xmlSettings, oWidget){
        this.xmlSettings = xmlSettings
        this.oWidget = oWidget;
        
        if (this.__init) 
            this.__init(xmlSettings, oWidget);
    }
}

// #endif
