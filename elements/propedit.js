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

/**
 * Element providing a sortable, selectable grid containing scrollable 
 * information. Grid columns can be reordered and resized.
 * Example:
 * This example shows a datagrid width several columns mixing percentage and
 * fixed size columns.
 * <code>
 *  <a:datagrid model="mdlNews" options="move|size">
 *      <a:bindings>
 *          <a:column type="icon" width="16" value="newspaper.png" />
 *          <a:column caption="Date" select="publication/@date" width="70" />
 *            <a:column caption="Title" width="180" select="title" />
 *          <a:column caption="Subtitle" select="subtitle" width="100%" />
 *          <a:each select="news" />
 *      </bindings>
 *      <a:actions />
 *  </datagrid>
 * </code>
 * Example:
 * This example shows a spreadsheet component. The spreadsheet component is an
 * alias for the datagrid. It has a different skin and different defaults.
 * <code>
 *  <a:spreadsheet>
 *      <a:bindings>
 *          <a:column caption="A" select="@field3" />
 *          <a:column caption="B" select="@field1" />
 *          <a:column caption="C" select="@field2" />
 *          <a:column caption="D" select="@field4" />
 *          <a:column caption="E" select="@field5" />
 *          <a:each select="record" />
 *      </bindings>
 *      <a:model>
 *          <records>
 *              <record field1="b" field2="b" field3="c" field4="d" field5="e" />
 *              <record field1="g" field2="b" field3="c" field4="d" field5="e" />
 *          </records>
 *      </model>
 *  </spreadsheet>
 * </code>
 * Example:
 * This example shows a propedit (property editor) component. The propedit 
 * component is an alias for the datagrid. It has a different skin and different
 * defaults. See {@link element.datagrid.attribute.template the template attribute}.
 * <code>
 *  <a:propedit template="mdlTemplate" />
 * </code>
 *
 * @constructor
 * @define datagrid, spreadsheet, propedit
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.Cache   
 * @inherits apf.StandardBinding
 *
 * @event beforelookup  Fires before the value lookup UI is shown.
 *   cancelable: Prevents the lookup value from being processed.
 *   object:
 *   {String}      value     the value that has been found.
 *   {XMLElement}  xmlNode   the selected node.
 *   {HTMLElement} htmlNode  the node that is updated.
 * @event afterlookup   Fires after a lookup value is processed.
 *   object:
 *   {Mixed}       value     the value that has been found.
 *   {XMLElement}  xmlNode   the selected node.
 *   {HTMLElement} htmlNode  the node that is updated.
 *   {Nodeset}     nodes     ???.
 * @event multiedit     Fires before a multiedit request is done. Used to display the UI.
 *   object:
 *   {XMLElement} xmlNode   the selected node.
 *   {XMLElement} dataNode  the {@link term.datanode data node}.
 *   Example:
 *   <code>
 *      <a:propedit 
 *        lookupaml      = "tmpLookup"
 *        onbeforelookup = "clearLookup(event.xmlNode, event.value)" 
 *        onafterlookup  = "loadLookup(event.xmlNode, event.value, this)"
 *        onmultiedit    = "loadMultiEdit(event, this)">
 *          <a:bindings>
 *              <a:template select="self::product" value="mdlProps:product" />
 *          </bindings>
 *      </propedit>
 *
 *      <a:template id="tmpLookup" autoinit="true">
 *          <a:list id="lstLookup" skin="mnulist" style="width:auto;margin-bottom:3px" 
 *            model="mdlLookup" empty-message="No results" height="{lstLookup.length * 20}"
 *            autoselect="false">
 *              <a:bindings>
 *                  <a:caption select="self::picture"><![CDATA[
 *                      {name} | {description}
 *                  ]]></caption>
 *                  <!-- use @descfield -->
 *                  <a:caption><![CDATA[[
 *                      var field = n.parentNode.getAttribute("descfield");
 *                      %(value(field) || "[Geen Naam]");
 *                  ]]]></caption>
 *                  <a:icon select="self::product" value="package_green.png" />
 *                  <a:icon value="table.png" />
 *                  <a:each select="node()[local-name()]" />
 *              </bindings>
 *              <a:actions />
 *          </list>
 *          
 *          <a:toolbar>
 *              <a:bar>
 *                  <a:button id="btnLkpPrev" disabled="true" 
 *                      onclick="...">&lt; Previous</button>
 *                  <a:spinner id="spnLookup" width="40" 
 *                      min="1" max="1" onafterchange="..." />
 *                  <a:button id="btnLkpNext" disabled="true" 
 *                      onclick="...">Next &gt;</button>
 *              </bar>
 *          </toolbar>
 *      </template>
 *   </code>
 */
apf.propedit    = function(struct, tagName){
    this.$init(tagName || "propedit", apf.NODE_VISIBLE, struct);
};

(function(){
    this.$init(function(){
        //this.$headings       = [],
        //this.$cssRules       = []; //@todo Needs to be reset;
        this.$nodes          = [];
        //this.$lastOpened     = {};
        
        this.$editors        = {};
        
        // #ifdef __WITH_CSS_BINDS
        this.dynCssClasses = [];
        // #endif
        
        this.addEventListener("keydown", keyHandler, true);
    });
    
    /*this.implement(
        //#ifdef __WITH_RENAME
        //apf.Rename
        //#endif
        //#ifdef __WITH_DRAGDROP
        //apf.DragDrop,
        //#endif
        //apf.Cache,  
    );*/
    
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
        properties : 1
    }, this.$attrExcludePropBind);
    
    /**
     * @attribute {Boolean} iframe     whether this element is rendered inside an iframe. This is only supported for IE. Default is false for datagrid and true for spreadsheet and propedit.
     */
    this.$booleanProperties["iframe"]     = true;

    /**
     * @attribute {String} template the {@link terms.datainstruction data instruction} 
     * to fetch a template definition of the layout for this component. A template
     * consists of descriptions of columns (or rows for propedit) for which
     * several settings are determined such as validation rules, edit component 
     * and selection rules.
     * Example:
     * This example contains a template that describes the fields in a property
     * editor for xml data representing a news article.
     * <code>
     *  <news>
     *      <prop caption="Title *" type="text" select="title" required="true" 
     *        minlength="4" invalidmsg="Incorrect title;The title is required."/>
     *      <prop caption="Subtitle *" type="text" select="subtitle" 
     *        required="true" minlength="4" 
     *        invalidmsg="Incorrect subtitle;The subtitle is required."/>
     *      <prop caption="Source" type="text" select="source" minlength="4" 
     *        invalidmsg="Incorrect source;The source is required."/>
     *      <prop select="editors_choice" caption="Show on homepage"
     *        overview="overview" type="dropdown">
     *          <item value="1">Yes</item> 
     *          <item value="0">No</item> 
     *      </prop>
     *      <prop caption="Auteur*" select="author" descfield="name" 
     *        overview="overview" maxlength="10" type="lookup" 
     *        foreign_table="author" required="true" /> 
     *      <prop select="categories/category" descfield="name" type="lookup" 
     *        multiple="multiple" caption="Categorie" overview="overview" 
     *        foreign_table="category" /> 
     *      <prop caption="Image" type="custom" 
     *        exec="showUploadWindow('news', 'setNewsImage', selected)" 
     *        select="pictures/picture/file" />
     *      <prop select="comments" descfield="title" caption="Comments" 
     *        type="children" multiple="multiple">
     *          <props table="news_comment" descfield="title">
     *              <prop select="name" datatype="string" caption="Name*" 
     *                required="1" maxlength="255" 
     *                invalidmsg="Incorrect name;The name is required."/> 
     *              <prop select="email" datatype="apf:email" caption="Email" 
     *                maxlength="255" 
     *                invalidmsg="Incorrect e-mail;Please retype."/> 
     *              <prop select="date" datatype="xsd:date" caption="Date*" 
     *                required="1" 
     *                invalidmsg="Incorrect date;Format is dd-mm-yyyy."/> 
     *              <prop select="title" datatype="string" caption="Title*" 
     *                required="1" maxlength="255" 
     *                invalidmsg="Incorrect title;Title is required."/> 
     *              <prop select="body" caption="Message*" required="1" 
     *                invalidmsg="Incorrect message;Message is required."/> 
     *          </props>
     *      </prop>
     *  </news>
     * </code>
     */
    this.$propHandlers["properties"] = function(value){
        var _self = this;

        apf.setModel(value, {load: function(data){
            if (typeof data == "string")
                data = apf.getXml(data);
            
            _self.$properties = data;
            if (_self.xmlRoot)
                _self.$load(data);
        }});
    };
    
    this.$canLoadData = function(){
        return true;
    }
    
    this.$columns = ["50%", "50%"];
    this.$propHandlers["columns"] = function(value){
        this.$columns = value && value.splitSafe(",") || ["50%", "50%"];
        
        if (this.$headings) {
            this.$headings[0].setProperty("width", this.$columns[0]);
            this.$headings[1].setProperty("width", this.$columns[1]);
        }
    }
    
    function scrollIntoView(){
        var Q = (this.current || this.$selected),
            o = this.$int;
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
            oInt   = this.$useiframe ? this.oDoc.documentElement : this.$int,
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
                
                var top = apf.getAbsolutePosition(selHtml, this.$int)[1]
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
                
                var top = apf.getAbsolutePosition(selHtml, this.$int)[1] 
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
            if (!this.$properties) {
                //@todo wait
                return false;
            }
            else return this.$properties;
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
    
    this.$load = function(xmlNode){
        var p = this.$getProperties();
        if (!p) return false;
        
        var output = [];
        var docId = this.documentId = apf.xmldb.getXmlDocId(p);
        
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(xmlNode, this); //@todo apf3 potential cleanup problem
        apf.xmldb.addNodeListener(this.xmlRoot, this);

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
        
        apf.insertHtmlNodes(output, this.$int);
        
        this.setProperty("root", this.xmlRoot); //or xmlNode ??
        
        //@todo select the first one
        this.select(this.$findHtmlNode(
            p.selectSingleNode(".//prop").getAttribute(apf.xmldb.xmlIdTag) 
            + "|" + this.$uniqueId));
    }
    
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        if (this.$lastEditor[0] == UndoObj.amlNode) {
            this.$lastEditor[1].firstChild.innerHTML = 
                ((apf.lm.compile(this.$lastEditor[2].getAttribute("value"), {
                    nostring: true
                }))(this.xmlRoot) || "") || "";
        }
        else {
            var p = this.$getProperties();
            var node, htmlNode, nodes = p.selectNodes(".//prop");
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
    
    this.select = function(htmlNode){
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
        
        if (this.$lastEditor) {
            //this.$lastEditor[0].$blur();
            this.$lastEditor[0].setProperty("visible", false);
            
            var nodes = this.$lastEditor[1].childNodes;
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (!nodes[i].host)
                    nodes[i].style.display = "";
            }
        }
        
        var prop = apf.xmldb.getNode(htmlNode);
        var _self = this;
        
        /*
            - editor (name of widget, lm function returning amlNode or lm template ref)
            - children being aml nodes
         */
        var editParent = this.$selected.childNodes[this.$selected.firstChild.tagName == "U" ? 2 : 1];
        var oEditor, editor = prop.getAttribute("editor");
        var ceditor = apf.lm.compile(editor, {xpathmode: 2});
        if (ceditor.type == 2) {
            if (!this.$editors[editor]) {
                var constr = apf.namespaces[apf.ns.aml].elements[editor];
                var info   = {
                    htmlNode : editParent,
                    width    : "100%+2",
                    style    : "position:relative;z-index:10000",
                    value    : "[{" + this.id + ".root}::" 
                        + (v = prop.getAttribute("value")).substr(1, v.length - 2) 
                        + "]",
                    focussable : false
                };
                
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
            }
            else {
                oEditor = this.$editors[editor];
                
                if (oEditor.hasFeature(apf.__MULTISELECT__))
                    oEditor.setAttribute("model", "{apf.xmldb.getElementById('" 
                        + prop.getAttribute(apf.xmldb.xmlIdTag) + "')}");

                oEditor.setAttribute("value", "[{" + this.id + ".root}::" 
                    + (v = prop.getAttribute("value")).substr(1, v.length - 2) 
                    + "]");

                oEditor.setProperty("visible", true);
                editParent.appendChild(oEditor.$ext);
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
        this.$int     = this.$getLayoutNode("main", "body", this.$ext);
        this.$head    = this.$getLayoutNode("main", "head", this.$ext);
        this.$pointer = this.$getLayoutNode("main", "pointer", this.$ext);

        if (this.$head.firstChild)
            this.$head.removeChild(this.$head.firstChild);
        if (this.$int.firstChild)
            this.$int.removeChild(this.$int.firstChild);

        var widthdiff = this.$widthdiff = this.$getOption("main", "widthdiff") || 0;
        this.$defaultwidth = this.$getOption("main", "defaultwidth") || "100";
        this.$useiframe    = apf.isIE && (apf.isTrue(this.$getOption("main", "iframe")) || this.iframe);

        var _self = this;
        
        //Initialize Iframe 
        if (this.$useiframe && !this.oIframe) {
            //this.$int.style.overflow = "hidden";
            //var sInt = this.$int.outerHTML 
            var sClass   = this.$int.className;
            //this.$int.parentNode.removeChild(this.$int);
            this.oIframe = this.$int.appendChild(document.createElement(apf.isIE 
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
            this.$int = this.oDoc.body;//.firstChild;
            this.$int.className = sClass;//this.oIframe.parentNode.className;
            this.oDoc.documentElement.className = this.$ext.className;
            //this.oDoc.body.className = this.$ext.className;

            apf.skins.loadCssInWindow(this.skinName, this.oWin, this.mediaPath, this.iconPath);
            
            if (apf.isIE) //@todo this can be removed when focussing is fixed for this component
                this.$setStyleClass(this.oDoc.documentElement, this.$baseCSSname + "Focus");
            
            apf.convertIframe(this.oIframe, true);

            if (apf.getStyle(this.oDoc.documentElement, apf.isIE 
              ? "overflowY" : "overflow-y") == "auto") {
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
            if (apf.getStyle(this.$int, apf.isIE 
              ? "overflowY" : "overflow-y") == "auto") {
                this.$resize = function(){
                    _self.$head.style.marginRight = 
                      _self.$int.scrollHeight > _self.$int.offsetHeight 
                        ? "16px" : "0";
                }
                
                //#ifdef __WITH_LAYOUT
                apf.layout.setRules(this.$ext, this.$uniqueId + "_datagrid",
                    "var o = apf.all[" + this.$uniqueId + "];\
                     if (o) o.$resize()");
                apf.layout.queue(this.$ext);
                //#endif
                
                this.addEventListener("afterload", this.$resize);
                this.addEventListener("xmlupdate", this.$resize);
            }
            
            this.$int.onmousedown = function(e){
                if (!e) e = event;
                if ((e.srcElement || e.target) == this)
                    apf.popup.forceHide();
            }
            
            this.$int.onscroll = 
                function(){
                    if (_self.$isFixedGrid)
                        _self.$head.scrollLeft = _self.$int.scrollLeft;
                };
        }
        
        var _self = this;
        this.$int.onmousedown = function(e){
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
        
        this.$ext.onclick = this.$int.onresize = null;
        
        //#ifdef __WITH_LAYOUT
        apf.layout.removeRule(this.$int, "dg" + this.$uniqueId);
        apf.layout.activateRules(this.$int);
        //#endif
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