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

// #ifdef  __AMLPROPEDIT || __INC_ALL

//@todo There is a lot of dead code in here (also in the skin) remove it

/**
 * Element providing a two column grid with properties and values. The values
 * are editable using apf elements.
 *
 * @constructor
 * @define propedit
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.DataBinding
 */
apf.propedit    = function(struct, tagName){
    this.$init(tagName || "propedit", apf.NODE_VISIBLE, struct);
    
    //this.$headings       = [],
    //this.$cssRules       = []; //@todo Needs to be reset;
    this.$nodes          = [];
    //this.$lastOpened     = {};
    
    this.$editors        = {};
    
    // #ifdef __WITH_CSS_BINDS
    this.$dynCssClasses = [];
    // #endif
};

(function(){
    this.$init(function(){
        this.addEventListener("keydown", keyHandler, true);
    });
    
    //#ifdef __WITH_CACHE
    this.implement(apf.Cache);
    //#endif
    //#ifdef __WITH_DATAACTION
    this.implement(apf.DataAction);
    //#endif
    
    this.$focussable     = true; // This object can get the focus
    this.$isTreeArch     = true; // This element has a tree architecture
    this.$isWindowContainer = -1;
    
    this.startClosed     = true;
    this.$animType       = apf.tween.NORMAL;
    this.$animSteps      = 3;
    this.$animSpeed      = 20;

    this.$useiframe      = 0;
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        properties : 3 //only when it has an xpath
    }, this.$attrExcludePropBind);
    
    /**
     * @attribute {Boolean} iframe     whether this element is rendered inside an iframe. This is only supported for IE. Default is false for datagrid and true for spreadsheet and propedit.
     */
    this.$booleanProperties["iframe"]     = true;

    /**
     * @attribute {String} properties the {@link terms.datainstruction data instruction} 
     * to fetch a template definition of the layout for this component. A template
     * consists of descriptions of columns (or rows for propedit) for which
     * several settings are determined such as validation rules, edit component 
     * and selection rules.
     * Example:
     * This example contains a template that describes the fields in a property
     * editor for xml data representing a news article.
     * <code>
     *  <news>
     *      <prop caption="Title *" type="text" match="[title]" required="true" 
     *        minlength="4" invalidmsg="Incorrect title;The title is required."/>
     *      <prop caption="Subtitle *" type="text" match="[subtitle]" 
     *        required="true" minlength="4" 
     *        invalidmsg="Incorrect subtitle;The subtitle is required."/>
     *      <prop caption="Source" type="text" match="[source]" minlength="4" 
     *        invalidmsg="Incorrect source;The source is required."/>
     *      <prop match="[editors_choice]" caption="Show on homepage"
     *        overview="overview" type="dropdown">
     *          <item value="1">Yes</item> 
     *          <item value="0">No</item> 
     *      </prop>
     *      <prop caption="Auteur*" match="[author]" descfield="name" 
     *        overview="overview" maxlength="10" type="lookup" 
     *        foreign_table="author" required="true" /> 
     *      <prop match="[categories/category]" descfield="name" type="lookup" 
     *        multiple="multiple" caption="Categorie" overview="overview" 
     *        foreign_table="category" /> 
     *      <prop caption="Image" type="custom" 
     *        exec="showUploadWindow('news', 'setNewsImage', selected)" 
     *        match="[pictures/picture/file]" />
     *      <prop match="[comments]" descfield="title" caption="Comments" 
     *        type="children" multiple="multiple">
     *          <props table="news_comment" descfield="title">
     *              <prop match="[name]" datatype="string" caption="Name*" 
     *                required="1" maxlength="255" 
     *                invalidmsg="Incorrect name;The name is required."/> 
     *              <prop match="[email]" datatype="apf:email" caption="Email" 
     *                maxlength="255" 
     *                invalidmsg="Incorrect e-mail;Please retype."/> 
     *              <prop match="[date]" datatype="xsd:date" caption="Date*" 
     *                required="1" 
     *                invalidmsg="Incorrect date;Format is dd-mm-yyyy."/> 
     *              <prop match="[title]" datatype="string" caption="Title*" 
     *                required="1" maxlength="255" 
     *                invalidmsg="Incorrect title;Title is required."/> 
     *              <prop match="[body]" caption="Message*" required="1" 
     *                invalidmsg="Incorrect message;Message is required."/> 
     *          </props>
     *      </prop>
     *  </news>
     * </code>
     */
    this.$propHandlers["properties"] = function(value){
        if (!value)
            return this.clear();
        
        var _self = this;
        var propLoadObj = { //Should probably exist only once if expanded with xmlUpdate
            load : function(data){
                _self.$loadingProps = false;
                
                if (typeof data == "string")
                    data = apf.getXml(data);

                _self.$properties = data;

                _self.$allowLoad = true;
                if (_self.$loadqueue)
                    _self.$checkLoadQueue();
                else if (_self.xmlRoot)
                    _self.load(_self.xmlRoot);
                delete _self.$allowLoad;
            },
            
            clear : function(){
                _self.$loadingProps = false;
            },
            
            xmlRoot : this.xmlRoot
        };

        var xml;
        this.$loadingProps = true;
        if (typeof value == "string") {
            if (value.substr(0, 1) == "<") 
                propLoadObj.load(value);
            else
                apf.setModel(value, propLoadObj);
        }
        else if (value.$isModel){
            //Value is model aml element
            value.register(propLoadObj);
        }
        else {
            if (this.$properties == value && !this.caching)
                return;

            //Assuming value is xml node
            //#ifdef __DEBUG
            setTimeout(function(){
                propLoadObj.load(value);
            });
            /* #else
            propLoadObj.load(value);
            #endif */
        }
        
        if (this.$properties)
            this.$prevProperties = this.$properties;
        
        delete this.$properties;
    };
    this.addEventListener("prop.properties", function(e){
        if (!e.changed && this.$loadqueue)
            this.$propHandlers["properties"].call(this, e.value);
    });
    
    this.$columns = ["50%", "50%"];
    this.$propHandlers["columns"] = function(value){
        this.$columns = value && value.splitSafe(",") || ["50%", "50%"];
        
        if (this.$headings) {
            this.$headings[0].setProperty("width", this.$columns[0]);
            this.$headings[1].setProperty("width", this.$columns[1]);
        }
    }
    
    this.$propHandlers["filter"] = function(value){
        if (!value) {
            this.$allowLoad = 2;
            var xmlRoot = this.xmlRoot;
            this.clear();
            if (this.$searchProperties) {
                this.$properties = this.$searchProperties;
                delete this.$searchProperties;
            }
            this.load(xmlRoot);
            delete this.$allowLoad;
            return;
        }

        var p = (this.$searchProperties || (this.$searchProperties = this.$getProperties())).cloneNode(true);
        var nodes = p.selectNodes("//node()[not(local-name()='group' or contains(translate(@caption, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '" + value + "'))]");
        for (var i = nodes.length - 1; i >= 0; i--)
            nodes[i].parentNode.removeChild(nodes[i]);
        
        nodes = p.selectNodes("//node()[local-name()='group' and not(node())]");
        
        var parent;
        for (var i = nodes.length - 1; i >= 0; i--) {
            parent = nodes[i].parentNode;
            parent.removeChild(nodes[i]);
            if (!parent.childNodes.length && parent.parentNode)
                parent.parentNode.removeChild(parent);
        }

        //var t = this.$properties;
        var xmlRoot = this.xmlRoot;
        this.clear();
        this.$properties = p;
        this.$allowLoad = 2;
        this.load(xmlRoot, {force: true});
        delete this.$allowLoad;
        //this.$properties = this.$searchProperties;
        //this.$properties = t;
    };
    
    function scrollIntoView(){
        var Q = (this.current || this.$selected),
            o = this.$body;
        o.scrollTop = (Q.offsetTop) - 21;
    }

    /**** Keyboard Support ****/
    
    this.$findHtmlNode = function(id) {
        return this.$pHtmlDoc.getElementById(id);
    }
    
    // #ifdef __WITH_KEYBOARD
    function keyHandler(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey;
        
        var selXml = this.$lastEditor && this.$lastEditor[2],
            oInt   = this.$useiframe ? this.oDoc.documentElement : this.$body,
            margin, node, hasScroll, hasScrollX, hasScrollY, items, lines;

        switch (key) {
            case 36:
                //HOME
                return false;
            case 35:
                //END
                return false;
            case 107:
                //+
                break;
            case 37:
                //LEFT
                this.$slideToggle(this.$selected.firstChild);
                return false;
            case 107:
            case 39:
                //RIGHT
                this.$slideToggle(this.$selected.firstChild);
                    
                return false;
            case 38:
                //UP
                var node  = selXml;
                var sNode = selXml.previousSibling;
                while(sNode && sNode.nodeType != 1) sNode = sNode.previousSibling;
                
                if (sNode) {
                    var last = sNode, nodes;
                    while ((nodes = last.selectNodes("prop")).length)
                        last = nodes[nodes.length - 1];
                    sNode = last;
                }
                else {
                    sNode = node.parentNode
                    if (sNode[apf.TAGNAME] != "prop") {
                        sNode = sNode.previousSibling;
                        while(sNode && sNode.nodeType != 1) sNode = sNode.previousSibling;
                        
                        if (sNode && sNode[apf.TAGNAME] != "prop") {
                            sNode = (nodes = sNode.selectNodes("prop"))[nodes.length - 1];
                            while(sNode && sNode.nodeType != 1) sNode = sNode.previousSibling;
                        }
                    }
                }

                if (!sNode)
                    return;

                var selHtml = apf.xmldb.findHtmlNode(sNode, this);
                while (!selHtml.offsetWidth)
                    selHtml = apf.xmldb.findHtmlNode(sNode = sNode.parentNode, this);
                
                var top = apf.getAbsolutePosition(selHtml, this.$body)[1]
                     - (selHtml.offsetHeight/2);
                if (top <= this.$ext.scrollTop)
                    this.$ext.scrollTop = top;
                
                this.select(selHtml);
                
                return false;
            case 40:
                //DOWN
                var node, sNode = (node = selXml).selectSingleNode("prop") || node.nextSibling;
                do {
                    while(sNode && (sNode.nodeType != 1 || sNode[apf.TAGNAME] != "prop")) 
                        sNode = sNode.nextSibling;
                    
                    if (!sNode) {
                        sNode = node.parentNode.nextSibling;
                        if (sNode && sNode[apf.TAGNAME] != "prop")
                            sNode = sNode.selectSingleNode("prop");
                    }
                }while(sNode && sNode.nodeType != 1);
                
                if (!sNode)
                    return;

                var selHtml = apf.xmldb.findHtmlNode(sNode, this);
                while (!selHtml.offsetWidth)
                    selHtml = apf.xmldb.findHtmlNode(sNode = sNode.parentNode, this);
                
                if (sNode == node) {
                    sNode = node.nextSibling
                    while(sNode && (sNode.nodeType != 1 || sNode[apf.TAGNAME] != "prop")) 
                        sNode = sNode.nextSibling;
                    var selHtml = apf.xmldb.findHtmlNode(sNode, this);
                }
                
                var top = apf.getAbsolutePosition(selHtml, this.$body)[1] 
                    + (selHtml.offsetHeight/2);
                if (top > this.$ext.scrollTop + this.$ext.offsetHeight)
                    this.$ext.scrollTop = top - this.$ext.offsetHeight;
                
                this.select(selHtml);
                
                return false;
        };
    }
    
    // #endif
    
    /**** Focus ****/
    // Too slow for IE
    
    this.$focus = function(){
        if (!this.$ext || (apf.isIE && this.$useiframe && this.cssfix)) //@todo fix this by fixing focussing for this component
            return;

        this.$setStyleClass(this.oFocus || this.$ext, this.$baseCSSname + "Focus");
        
        if (this.oDoc)
            this.$setStyleClass(this.oDoc.documentElement, this.$baseCSSname + "Focus");
        
        if (this.$lastEditor)
            this.$lastEditor[0].$focus();
    };

    this.$blur = function(){
        //#ifdef __WITH_RENAME
        if (this.renaming)
            this.stopRename(null, true);
        //#endif

        //@todo fix this by fixing focussing for this component
        if (!this.$ext || (apf.isIE && this.$useiframe && this.cssfix))
            return;

        this.$setStyleClass(this.oFocus || this.$ext, "", [this.$baseCSSname + "Focus"]);
        
        if (this.oDoc)
            this.$setStyleClass(this.oDoc.documentElement, "", [this.$baseCSSname + "Focus"]);
        
        if (this.$lastEditor)
            this.$lastEditor[0].$blur();
    };
    
    /**** Sliding functions ****/
    
    this.$slideToggle = function(htmlNode){
        container = htmlNode.parentNode.lastChild;
        
        if (apf.getStyle(container, "display") == "block") {
            htmlNode.className = htmlNode.className.replace(/min/, "plus");
            this.$slideClose(container);
        }
        else {
            htmlNode.className = htmlNode.className.replace(/plus/, "min");
            this.$slideOpen(container);
        }
    };
    
    this.$slideOpen = function(container){
        container.style.display = "";

        apf.tween.single(container, {
            type    : 'scrollheight', 
            from    : 3, 
            diff    : -2,
            to      : container.scrollHeight, 
            anim    : this.$animType,
            steps   : this.$animSteps,
            interval: this.$animSpeed,
            onfinish: function(container){
                container.style.overflow = "visible";
                container.style.height = "auto";
            }
        });
    };

    this.$slideClose = function(container){
        container.style.height   = container.offsetHeight;
        container.style.overflow = "hidden";

        apf.tween.single(container, {
            type    : 'scrollheight', 
            from    : container.scrollHeight, 
            diff    : -2,
            to      : 0, 
            anim    : this.$animType,
            steps   : this.$animSteps,
            interval: this.$animSpeed,
            onfinish: function(container, data){
               container.style.display = "none";
            }
        });
    };
    
    this.$findContainer = function(htmlNode) {
        var node = htmlNode.nextSibling;
        if (!node)
            return htmlNode;
        return node.nodeType == 1 ? node : node.nextSibling;
    };
    
    /**** Databinding ****/
    
    this.addEventListener("bindingsload", this.$loaddatabinding = function(e){
        var rules = e.bindings["properties"];
        if (!rules || !rules.length)
            return;
        
        for (var i = 0, l = rules.length; i < l; i++) {
            
        }
    });
    
    this.$unloaddatabinding = function(){
    };

    /**
     * Returns a column definition object based on the column number.
     * @param {Number} hid the heading number; this number is based on the sequence of the column elements.
     */
    this.getColumn = function(nr){
        return this.$headings[nr || this.$lastcol || 0];
    };
    
    /**** Column management ****/

    /** 
     * Resizes a column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the column elements. 
     * @param {Number} newsize  the new size of the column.
     * @todo optimize but bringing down the string concats
     */
    this.resizeColumn = function(nr, newsize){
        var h = this.$headings[nr];
        h.resize(newsize);
    };

    /**
     * Hides a column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the column elements. 
     */
    this.hideColumn = function(nr){
        var h = this.$headings[nr];
        h.hide();
    };
    
    /**
     * Shows a hidden column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the column elements. 
     */
    this.showColumn = function(nr){
        var h = this.$headings[nr];
        h.show();
    };
    
    /**** Databinding ****/
    
    /*
    Property:
    - caption
    - editor (name of widget, lm function returning amlNode or lm template ref)
        - children being aml nodes
    - value (lm, only when widget is created by grid)
    
    validation attr: (only when widget is created by grid)
    - required
    - datatype
    - required
    - pattern
    - min
    - max
    - maxlength
    - minlength
    - notnull
    - checkequal
    - validtest
    
    Group:
    - name
    - properties
    
    Move from dg to widgets:
    - autocomplete with template
    - dropdown with bound multicheck
    
    Furthermore it supports:
    - properties binding rule to switch properties
    - special node introspection mode
        - .listAttributes()
            - returns array of objects
                - name
                - editor
                - validation rules
        - .setAttribute(name, value)
        - .getAttribute(name)
        - .addEventListener("prop." + name);
        - .removeEventListener("prop." + name);
    */
    
    this.$getProperties = function(xmlNode){
        if (this.properties) {
            return this.$properties || false;
        }
        else if (this.$bindings.properties) {
            var props = this.$bindings.properties;
            for (var i = 0; i < props.length; i++) {
                if (!props[i].match) //compile via lm
                    return xx; //async request entry
            }
        }
        
        return false;
    }
    
    /**
     * Forces propedit to wait for the load of a new property definition
     */
    this.$canLoadData = function(){
        if (this.$allowLoad || !this.$attrBindings["properties"])
            return this.$getProperties() ? true : false;
            
        /*
         @todo this is turned off because it competes with the signal from
         prop.properties. When the properties property contains an async 
         statement, the prop isnt set until the call returns. This means this
         component doesnt know it has the wrong property set until later. 
         Thats causing problems. Uncommenting this causes a problem when a 
         dynamic property is not refreshed whenever the model is set.
        */
        else if (false) {
            var _self = this;
            apf.queue.add("load" + this.$uniqueId, function(){
                _self.$allowLoad = true;
                _self.$checkLoadQueue();
                delete _self.$allowLoad;
            });
            return false;
        }
    }
    
    this.$generateCacheId = function(xmlNode){
        var node = this.$getProperties();
        return node ? node.getAttribute(apf.xmldb.xmlIdTag) 
                || apf.xmldb.nodeConnect(apf.xmldb.getXmlDocId(node), node)
              : 0;
    }
    
    this.$getCurrentFragment = function(){
        var fragment = this.$container.ownerDocument.createDocumentFragment();
        fragment.properties = this.$searchProperties || this.$prevProperties || this.$properties;

        while (this.$container.childNodes.length) {
            fragment.appendChild(this.$container.childNodes[0]);
        }

        this.clearSelection();

        return fragment;
    };

    this.$setCurrentFragment = function(fragment){
        this.$container.appendChild(fragment);

        if (!apf.window.hasFocus(this))
            this.blur();

        apf.xmldb.addNodeListener(this.xmlRoot, this); //set node listener if not set yet
        
        //@todo most unoptimized way possible:
        if (this.filter && this.$allowLoad != 2) {
            delete this.$searchProperties;
            this.$prevProperties = fragment.properties;
            this.$propHandlers["filter"].call(this, this.filter);
        }
        else {
            this.$xmlUpdate(null, this.xmlRoot);
            this.$properties = fragment.properties;
            this.select(apf.xmldb.findHtmlNode(this.$properties.selectSingleNode(".//prop"), this));
        }
    };
    
    this.$load = function(xmlNode){
        var p = this.$getProperties();
        if (!p) return false;

        var output = [];
        var docId = this.documentId = apf.xmldb.getXmlDocId(p);

        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(xmlNode, this); //@todo apf3 potential cleanup problem
        //apf.xmldb.addNodeListener(this.xmlRoot, this);

        var _self = this, doc = p.ownerDocument;
        (function walk(nodes, parent, depth){
            for (var u, s, cell, sLid, pnode, html, node, i = 0, l = nodes.length; i < l; i++) {
                node = nodes[i];
                _self.$getNewContext("row") 
                html = _self.$getLayoutNode("row");
                
                if (node[apf.TAGNAME] == "group") {
                    _self.$getNewContext("cell");
                    apf.setStyleClass(html, "heading");

                    cell = html.appendChild(_self.$getLayoutNode("cell"));
                    apf.setNodeValue(_self.$getLayoutNode("cell", "caption", cell),
                        (node.getAttribute("caption") || "").trim() || ""); //@todo for IE but seems not a good idea
                
                    //group|
                    pnode = html.appendChild(doc.createElement("blockquote"));
                    walk(node.selectNodes("prop"), pnode, depth);
                    html.insertBefore(u = doc.createElement("u"), html.firstChild).appendChild(doc.createTextNode(" "));
                    u.setAttribute("class", "min");
                }
                else {
                    apf.xmldb.nodeConnect(docId, node, html, _self);
                
                    //Build the Cells
                    _self.$getNewContext("cell");
                    h = _self.$headings[0];
        
                    cell = html.appendChild(_self.$setStyleClass(_self.$getLayoutNode("cell"), h.$className));
                    apf.setNodeValue(_self.$getLayoutNode("cell", "caption", cell),
                        (node.getAttribute("caption") || "").trim() || ""); //@todo for IE but seems not a good idea

                    if (depth)
                        cell.firstChild.setAttribute("style", "padding-left:" + (depth * 15) + "px");
                    
                    _self.$getNewContext("cell");
                    h = _self.$headings[1];

                    cell = html.appendChild(_self.$setStyleClass(_self.$getLayoutNode("cell"), h.$className));
                    apf.setNodeValue(_self.$getLayoutNode("cell", "caption", cell),
                        ((apf.lm.compile(node.getAttribute("value"), {nostring: true}))(_self.xmlRoot) || "") || ""); //@todo for IE but seems not a good idea
                    
                    if ((s = node.selectNodes("prop")).length) {
                        pnode = html.appendChild(doc.createElement("blockquote"));
                        pnode.setAttribute("style", "display:none;overflow:hidden;height:0;");
                        walk(s, _self.$getLayoutNode("heading", "container", pnode), depth + 1);
                        
                        //Add opener
                        html.insertBefore(u = doc.createElement("u"), html.firstChild).appendChild(doc.createTextNode(" "));
                        u.setAttribute("class", "plus");
                    }
                }

                if (!parent)
                    output.push(html);
                else
                    parent.appendChild(html);
            }
        })(p.selectNodes("group|prop"), null, 0);
        
        apf.insertHtmlNodes(output, this.$body);
        
        this.setProperty("root", this.xmlRoot); //or xmlNode ??

        //@todo select the first one
        var prop = p.selectSingleNode(".//prop");
        if (prop) {
            this.select(this.$findHtmlNode(
              prop.getAttribute(apf.xmldb.xmlIdTag) 
              + "|" + this.$uniqueId));
        }
        
        //@todo most unoptimized way possible:
        if (this.filter && this.$allowLoad != 2) {
            delete this.$searchProperties;
            this.$propHandlers["filter"].call(this, this.filter);
        }
    }
    
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        if (xmlNode != this.xmlRoot)
            return;

        if (UndoObj && this.$lastEditor[0] == UndoObj.amlNode) {
            this.$lastEditor[1].firstChild.innerHTML = 
                ((apf.lm.compile(this.$lastEditor[2].getAttribute("value"), {
                    nostring: true
                }))(this.xmlRoot) || "") || "";
        }
        else {
            var p = this.$getProperties();
            if (!p) 
                return;
            
            var node, htmlNode, nodes = p.selectNodes(".//group/prop");
            for (var i = 0, l = nodes.length; i < l; i++) {
                node     = nodes[i];
                htmlNode = this.$findHtmlNode(
                    node.getAttribute(apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);
                
                htmlNode.childNodes[htmlNode.firstChild.tagName == "U" ? 2 : 1]
                  .firstChild.innerHTML = 
                    ((apf.lm.compile(node.getAttribute("value"), {
                        nostring: true
                    }))(this.xmlRoot) || "") || "";
            }
        }
    }
    
    this.$hideEditor = function(remove){
        if (this.$lastEditor) {
            //this.$lastEditor[0].$blur();
            this.$lastEditor[0].setProperty("visible", false);
            
            if (remove) {
                var pNode = this.$lastEditor[0].$ext.parentNode;
                pNode.removeChild(this.$lastEditor[0].$ext);
                pNode.removeAttribute("id");
                delete pNode.onresize;
            }
            
            var nodes = this.$lastEditor[1].childNodes;
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (!nodes[i].host)
                    nodes[i].style.display = "";
            }
            
            delete this.$lastEditor;
        }
    }
    
    this.clearSelection = function(){
        this.$setStyleClass(this.$selected, "", ["selected"]);
        delete this.$selected;
        this.$hideEditor();
    }
    
    this.select = function(htmlNode){
        if (this.disabled) //@todo apf3.0 userAction
            return;
        
        
        if (this.$selected == htmlNode) {
            /*var oEditor = this.$lastEditor[0];
            $setTimeout(function(){
                oEditor.focus();
            });*/
            
            return;
        }

        if (this.$selected)
            this.$setStyleClass(this.$selected, "", ["selected"]);

        this.$setStyleClass(htmlNode, "selected");
        this.$selected = htmlNode;

        this.$hideEditor();
        
        var prop = apf.xmldb.getNode(htmlNode);
        var _self = this;
        
        this.setProperty("selected", prop);
        
        /*
            - editor (name of widget, lm function returning amlNode or lm template ref)
            - children being aml nodes
         */
        var editParent = this.$selected.childNodes[this.$selected.firstChild.tagName == "U" ? 2 : 1];
        var oEditor, editor = prop.getAttribute("editor");
        var ceditor = apf.lm.compile(editor, {xpathmode: 2});
        if (ceditor.type == 2) {
            //#ifdef __DEBUG
            if (!editor) {
                if (prop.childNodes.length) //It's a group
                    return;
                else 
                    throw new Error("Missing editor attribute on property element: " + prop.xml); //@todo apf3.0 make into proper error
            }
            //#endif
            
            if (!this.$editors[editor]) {
                var constr = apf.namespaces[apf.ns.aml].elements[editor];
                var isTextbox = "textarea|textbox|secret".indexOf(editor) > -1;
                var info   = {
                    htmlNode : editParent,
                    width    : "100%+2",
                    height   : 19,
                    style    : "position:relative;", //z-index:10000
                    value    : "[{" + this.id + ".root}::" 
                        + (v = prop.getAttribute("value")).substr(1, v.length - 2) 
                        + "]",
                    focussable : false,
                    realtime   : !isTextbox
                };
                if (isTextbox) {
                    info.focusselect = true;
                    info.onkeydown = function(e){
                        if (e.keyCode == 13)
                            this.change(this.getValue());
                    }
                }
                else if (editor == "checkbox")
                    info.values = "true|false";    
                
                //@todo copy all non-known properties of the prop element

                if (constr.prototype.hasFeature(apf.__MULTISELECT__)) {
                    info.caption   = "[text()]";
                    info.eachvalue = "[@value]";
                    info.each      = "item";
                    info.model     = "{apf.xmldb.getElementById('" 
                        + prop.getAttribute(apf.xmldb.xmlIdTag) + "')}";
                }

                oEditor = this.$editors[editor] = new constr(info);
                
                var box = apf.getBox(apf.getStyle(oEditor.$ext, "margin"));
                if (box[1] || box[3]) {
                    oEditor.setAttribute("width", "100%+2-" + (box[1] + box[3]));
                }
                else if (!box[3])
                    oEditor.$ext.style.marginLeft = "-1px";

                //oEditor.$focussable = false;
                /*oEditor.addEventListener("focus", function(){
                    _self.focus();
                    this.$focus();
                });*/
                oEditor.parentNode   = this;
                oEditor.$focusParent = this;
                oEditor.setAttribute("focussable", "true");
                //delete oEditor.parentNode;
                
                //@todo set actiontracker
                oEditor.$parentId = editParent.getAttribute("id");
                oEditor.$parentRsz = editParent.onresize;
                
                //Patch oEditor to forward change
                oEditor.$executeAction = function(atAction, args, action, xmlNode, noevent, contextNode, multiple){
                    if (atAction == "setAttribute" && !args[2])
                        atAction = "removeAttribute";
                    
                    this.parentNode.$executeAction.call(this.parentNode, 
                        atAction, args, action, xmlNode, noevent, contextNode, multiple);
                }
            }
            else {
                oEditor = this.$editors[editor];

                if (oEditor.hasFeature(apf.__MULTISELECT__)) {
                    oEditor.setAttribute("model", "{apf.xmldb.getElementById('" 
                        + prop.getAttribute(apf.xmldb.xmlIdTag) + "')}");
                }

                oEditor.setAttribute("value", "[{" + this.id + ".root}::" 
                    + (v = prop.getAttribute("value")).substr(1, v.length - 2) 
                    + "]");

                oEditor.setProperty("visible", true);
                if (oEditor.$ext.parentNode 
                  && oEditor.$ext.parentNode.nodeType == 1
                  && !apf.hasSingleResizeEvent) {
                    if (!oEditor.$parentRsz) 
                        oEditor.$parentRsz = oEditor.$ext.parentNode.onresize;
                    oEditor.$ext.parentNode.removeAttribute("id");
                    delete oEditor.$ext.parentNode.onresize;
                }

                editParent.appendChild(oEditor.$ext);
                editParent.setAttribute("id", editParent.$parentId);
                if (oEditor.$parentRsz && !apf.hasSingleResizeEvent) {
                    editParent.onresize = oEditor.$parentRsz;
                    editParent.onresize();
                }
            }
            
            /*setTimeout(function(){
                oEditor.focus();
            });*/
        }
        else {
            //Create dropdown 
            
            var obj = ceditor.call(this, this.xmlRoot);
            if (obj.localName == "template") {
                //add template contents to dropped area
            }
            else {
                //add xml into dropped area
            }
        }
        
        var nodes = editParent.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (!nodes[i].host)
                nodes[i].style.display = "none";
        }

        this.$lastEditor = [oEditor, editParent, prop];
    }
    
    this.addEventListener("$clear", function(e){
        this.$hideEditor(true);
    });
    
    /*this.addEventListener("blur", function(){
        if (this.$lastEditor)
            this.$lastEditor[0].$blur();
    });
    
    this.addEventListener("focus", function(){
        if (this.$lastEditor)
            this.$lastEditor[0].$focus();
    });*/
    
    /**** Init ****/

    this.$draw = function(){
        //Build Main Skin
        this.$ext     = this.$getExternal();
        this.$body    = this.$getLayoutNode("main", "body", this.$ext);
        this.$head    = this.$getLayoutNode("main", "head", this.$ext);
        this.$pointer = this.$getLayoutNode("main", "pointer", this.$ext);
        this.$container = this.$body;

        if (this.$head.firstChild)
            this.$head.removeChild(this.$head.firstChild);
        if (this.$body.firstChild)
            this.$body.removeChild(this.$body.firstChild);

        var widthdiff = this.$widthdiff = this.$getOption("main", "widthdiff") || 0;
        this.$defaultwidth = this.$getOption("main", "defaultwidth") || "100";
        this.$useiframe    = apf.isIE && (apf.isTrue(this.$getOption("main", "iframe")) || this.iframe);

        var _self = this;
        
        //Initialize Iframe 
        if (this.$useiframe && !this.oIframe) {
            //this.$body.style.overflow = "hidden";
            //var sInt = this.$body.outerHTML 
            var sClass   = this.$body.className;
            //this.$body.parentNode.removeChild(this.$body);
            this.oIframe = this.$body.appendChild(document.createElement(apf.isIE 
                ? "<iframe frameborder='0'></iframe>"
                : "iframe"));
            this.oIframe.frameBorder = 0;
            this.oWin = this.oIframe.contentWindow;
            this.oDoc = this.oWin.document;
            this.oDoc.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
                <html xmlns="http://www.w3.org/1999/xhtml">\
                    <head><script>\
                        apf = {\
                            lookup : function(uid){\
                                return window.parent.apf.lookup(uid);\
                            },\
                            Init : {add:function(){},run:function(){}}\
                        };</script>\
                    </head>\
                    <body></body>\
                </html>');
            //Import CSS
            //this.oDoc.body.innerHTML = sInt;
            this.$body = this.oDoc.body;//.firstChild;
            this.$body.className = sClass;//this.oIframe.parentNode.className;
            this.oDoc.documentElement.className = this.$ext.className;
            //this.oDoc.body.className = this.$ext.className;

            apf.skins.loadCssInWindow(this.skinName, this.oWin, this.mediaPath, this.iconPath);
            
            if (apf.isIE) //@todo this can be removed when focussing is fixed for this component
                this.$setStyleClass(this.oDoc.documentElement, this.$baseCSSname + "Focus");
            
            apf.convertIframe(this.oIframe, true);

            if (apf.getStyle(this.oDoc.documentElement, "overflowY") == "auto") {
                //@todo ie only
                this.oIframe.onresize = function(){
                    _self.$head.style.marginRight = 
                      _self.oDoc.documentElement.scrollHeight > _self.oDoc.documentElement.offsetHeight 
                        ? "16px" : "0";
                }
                
                this.addEventListener("afterload", this.oIframe.onresize);
                this.addEventListener("xmlupdate", this.oIframe.onresize);
            }
            
            this.oDoc.documentElement.onmousedown = function(e){
                if (!e) e = _self.oWin.event;
                if ((e.srcElement || e.target).tagName == "HTML")
                    apf.popup.forceHide();
            }
                        
            this.oDoc.documentElement.onscroll = 
                function(){
                    if (_self.$isFixedGrid)
                        _self.$head.scrollLeft = _self.oDoc.documentElement.scrollLeft;
                };
        }
        else {
            if (apf.getStyle(this.$body, "overflowY") == "auto") {
                this.$resize = function(){
                    _self.$head.style.marginRight = 
                      _self.$body.scrollHeight > _self.$body.offsetHeight 
                        ? "16px" : "0";
                }
                
                //#ifdef __WITH_LAYOUT
                this.addEventListener("resize", this.$resize);
                //#endif
                
                this.addEventListener("afterload", this.$resize);
                this.addEventListener("xmlupdate", this.$resize);
            }
            
            this.$body.onmousedown = function(e){
                if (!e) e = event;
                if ((e.srcElement || e.target) == this)
                    apf.popup.forceHide();
            }
            
            this.$body.onscroll = 
                function(){
                    if (_self.$isFixedGrid)
                        _self.$head.scrollLeft = _self.$body.scrollLeft;
                };
        }
        
        var _self = this;
        this.$body.onmousedown = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this) return;
            
            if (target.tagName == "U") {
                _self.$slideToggle(target);
                return;
            }
            
            while (target.host || (target.getAttribute(apf.xmldb.htmlIdTag) || "").indexOf("|") == -1) {
                target = target.parentNode;
                if (target == this) return;
            }

            _self.select(target);
        }
    };
    
    this.$loadAml = function(x){
        //Create two columns
        this.$headings = [
            new apf.BindingColumnRule().$draw(this, "Property", this.$columns[0], "first"),
            new apf.BindingColumnRule().$draw(this, "Value", this.$columns[1])
        ];
    };
    
    this.$destroy = function(){
        apf.popup.removeContent(this.$uniqueId);
        
        for (var prop in this.$editors) {
            this.$editors[prop].destroy();
        }
        
        this.$ext.onclick = null;
    };
// #ifdef __WITH_DATABINDING
}).call(apf.propedit.prototype = new apf.DataBinding());
/* #else
}).call(apf.propedit.prototype = new apf.Presentation());
#endif*/

apf.aml.setElement("propedit",    apf.propedit);
apf.aml.setElement("column",      apf.BindingColumnRule);
apf.aml.setElement("description", apf.BindingRule);
apf.aml.setElement("color",       apf.BindingRule);

//#endif

// #ifdef __WITH_CONVERTIFRAME
/**
 * @private
 */
//@todo this is all broken. needs to be fixed before apf3.0
apf.convertIframe = function(iframe, preventSelect){
    var win = iframe.contentWindow;
    var doc = win.document;
    var pos;

    if (!apf.isIE)
        apf.importClass(apf.runNonIe, true, win);
        
    //Load Browser Specific Code
    // #ifdef __SUPPORT_WEBKIT
    if (this.isSafari) 
        this.importClass(apf.runSafari, true, win);
    // #endif
    // #ifdef __SUPPORT_OPERA
    if (this.isOpera) 
        this.importClass(apf.runOpera, true, win);
    // #endif
    // #ifdef __SUPPORT_GECKO
    if (this.isGecko || !this.isIE && !this.isSafari && !this.isOpera)
        this.importClass(apf.runGecko, true, win);
    // #endif
    
    doc.onkeydown = function(e){
        if (!e) e = win.event;

        if (document.onkeydown) 
            return document.onkeydown.call(document, e);
        //return false;
    };
    
    doc.onmousedown = function(e){
        if (!e) e = win.event;

        if (!pos)
            pos = apf.getAbsolutePosition(iframe);

        var q = {
            offsetX       : e.offsetX,
            offsetY       : e.offsetY,
            x             : e.x + pos[0],
            y             : e.y + pos[1],
            button        : e.button,
            clientX       : e.x + pos[0],
            clientY       : e.y + pos[1],
            srcElement    : iframe,
            target        : iframe,
            targetElement : iframe
        }
        
        if (document.body.onmousedown)
            document.body.onmousedown(q);
        if (document.onmousedown)
            document.onmousedown(q);
        
        if (preventSelect && !apf.isIE)
            return false;
    };
    
    if (preventSelect) {
        doc.onselectstart = function(e){
            return false;
        };
    }
    
    doc.onmouseup = function(e){
        if (!e) e = win.event;
        if (document.body.onmouseup)
            document.body.onmouseup(e);
        if (document.onmouseup)
            document.onmouseup(e);
    };
    
    doc.onclick = function(e){
        if (!e) e = win.event;
        if (document.body.onclick)
            document.body.onclick(e);
        if (document.onclick)
            document.onclick(e);
    };
    
    //all these events should actually be piped to the events of the container....
    doc.documentElement.oncontextmenu = function(e){
        if (!e) e = win.event;
        if (!pos)
            pos = apf.getAbsolutePosition(iframe);
        
        var q = {
            offsetX       : e.offsetX,
            offsetY       : e.offsetY,
            x             : e.x + pos[0],
            y             : e.y + pos[1],
            button        : e.button,
            clientX       : e.x + pos[0],
            clientY       : e.y + pos[1],
            srcElement    : e.srcElement,
            target        : e.target,
            targetElement : e.targetElement
        };

        //if(this.host && this.host.oncontextmenu) this.host.oncontextmenu(q);
        if (document.body.oncontextmenu)
            document.body.oncontextmenu(q);
        if (document.oncontextmenu)
            document.oncontextmenu(q);
        
        return false;
    };

    doc.documentElement.onmouseover = function(e){
        pos = apf.getAbsolutePosition(iframe);
    };

    doc.documentElement.onmousemove = function(e){
        if (!e) e = win.event;
        if (!pos)
            pos = apf.getAbsolutePosition(iframe);
    
        var q = {
            offsetX       : e.offsetX,
            offsetY       : e.offsetY,
            x             : e.x + pos[0],
            y             : e.y + pos[1],
            button        : e.button,
            clientX       : e.x + pos[0],
            clientY       : e.y + pos[1],
            srcElement    : e.srcElement,
            target        : e.target,
            targetElement : e.targetElement
        }

        if (iframe.onmousemove)
            iframe.onmousemove(q);
        if (document.body.onmousemove)
            document.body.onmousemove(q);
        if (document.onmousemove)
            document.onmousemove(q);
        
        return e.returnValue;
    };
    
    return doc;
};
//#endif