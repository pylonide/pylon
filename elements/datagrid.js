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

// #ifdef __AMLDATAGRID || __INC_ALL || __AMLSPREADSHEET || __AMLPROPEDIT
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1

/**
 * Element providing a sortable, selectable grid containing scrollable 
 * information. Grid columns can be reordered and resized.
 * Example:
 * This example shows a datagrid width several columns mixing percentage and
 * fixed size columns.
 * <code>
 *  <a:model id="mdlNews">
 *      <data>
 *          <news title="text 1" subtitle="text 11" date="2009-11-18"></news>
 *          <news title="text 2" subtitle="text 21" date="2009-11-19"></news>
 *          <news title="text 3" subtitle="text 31" date="2009-11-20"></news>
 *      </data>
 *  </a:model>
 *  <a:datagrid model="mdlNews" options="move|size">
 *      <a:each match="[news]">
 *          <a:column caption="Icon" type="icon" width="40" value="newspaper.png" />
 *          <a:column caption="Date" value="[@date]" width="70" />
 *          <a:column caption="Title" width="180" value="[@title]" />
 *          <a:column caption="Subtitle" value="[@subtitle]" width="100" />
 *      </a:each>
 *  </a:datagrid>
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
 * @inherits apf.MultiSelect
 * @inherits apf.Cache   
 * @inherits apf.StandardBinding
 * @inherits apf.Rename
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
 * @binding caption   Determines the caption of a node.
 * @binding css       Determines a css class for a node.
 * Example:
 * In this example a node is bold when the folder contains unread messages:
 * <code>
 *  <a:tree model="messages.xml">
 *      <a:bindings>
 *          <a:caption match="[@caption]" />
 *          <a:css match="[folder/message[@unread]]" value="highlighUnread" />
 *          <a:icon match="[@icon]" />
 *          <a:icon match="[folder]" value="icoDir.png" />
 *          <a:each match="[folder|message]" />
 *      </a:bindings>
 *  </a:tree>
 * </code>
 * @binding invalidmsg  Determines the error message that is shown when a cell is not valid.
 * @binding description Determines the text that is displayed under the expanded row.
 * @binding template    Determines the template that sets the column definition (for the datagrid) or property definition (for property editor).

 */
apf.spreadsheet = function(struct, tagName){
    this.$init(tagName || "spreadsheet", apf.NODE_VISIBLE, struct);
};

apf.datagrid    = function(struct, tagName){
    this.$init(tagName || "datagrid", apf.NODE_VISIBLE, struct);
};

(function(){
    this.$init(function(){
        this.$headings       = [],
        this.$cssRules       = []; //@todo Needs to be reset;
        this.$nodes          = [];
        this.$lastOpened     = {};
        
        this.$editors        = {};
        
        // #ifdef __WITH_CSS_BINDS
        this.dynCssClasses = [];
        // #endif
    });
    
    this.implement(
        //#ifdef __WITH_RENAME
        //apf.Rename
        //#endif
        //#ifdef __WITH_DRAGDROP
        //apf.DragDrop,
        //#endif
        //#ifdef __WITH_CACHE
        apf.Cache,  
        //#endif
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
    );
    
    this.$focussable     = true; // This object can get the focus
    this.multiselect     = true; // Enable MultiSelect
    this.bufferselect    = false;
    
    this.startClosed     = true;
    this.$animType       = apf.tween.NORMAL;
    this.$animSteps      = 3;
    this.$animSpeed      = 20;

    this.$curBtn         = null;
    this.$useTable       = false;
    //this.$lastcell       = null;
    //this.$lastcol        = 0;
    //this.$lastrow        = null;
    //this.$lastSorted     = null;
    //this.$lastCaptionCol = null;
    
    this.$widthdiff      = 0;
    this.$defaultwidth   = 0;
    this.$useiframe      = 0;
    
    //#ifdef __WITH_RENAME
    this.$renameStartCollapse = false;
    //#endif
    
    this.$init(function() {
        this.addEventListener("keydown", keyHandler, true);
    });

    /**
     * @attribute {Boolean} iframe     whether this element is rendered inside an iframe. This is only supported for IE. Default is false for datagrid and true for spreadsheet and propedit.
     */
    this.$booleanProperties["iframe"]     = true;

    /**
     * This method imports a stylesheet defined in a multidimensional array 
     * @param {Array}    def Required Multidimensional array specifying 
     * @param {Object}    win Optional Reference to a window
     * @method
     * @deprecated
     */    
    function importStylesheet(def, win){
        for (var i = 0; i < def.length; i++) {
            if (!def[i][1]) continue;
            
            if (apf.isIE)
                (win || window).document.styleSheets[0].addRule(def[i][0],
                    def[i][1]);
            else
                (win || window).document.styleSheets[0].insertRule(def[i][0]
                    + " {" + def[i][1] + "}", 0);
        }
    }
    
    function scrollIntoView(){
        var Q = (this.current || this.$selected),
            o = this.$int;
        o.scrollTop = (Q.offsetTop) - 21;
    }

    /**** Keyboard Support ****/
    
    // #ifdef __WITH_KEYBOARD
    function keyHandler(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            selHtml  = this.$selected || this.$caret;
        
        if (!e.force && (!selHtml || this.renaming)) //@todo how about allowdeselect?
            return;

        var selXml = this.caret || this.selected,
            oInt   = this.$useiframe ? this.oDoc.documentElement : this.$int,
            margin, node, hasScroll, hasScrollX, hasScrollY, items, lines;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.$selectTemp();
            
                this.choose(selHtml);
                break;
            case 32:
                if (ctrlKey || !this.isSelected(this.caret))
                    this.select(this.caret, true);
                return false;
            case 109:
            case 46:
                //DELETE
                if (this.disableremove) 
                    return;
                    
                if (this.celledit) {
                    this.rename(this.caret || this.selected, "");
                    return;
                }
            
                if (this.$tempsel)
                    this.$selectTemp();
            
                this.remove(this.mode ? this.caret : null); //this.mode != "check"
                break;
            case 36:
                //HOME
                this.$setTempSelected (this.getFirstTraverseNode(), false, shiftKey);
                this.$int.scrollTop = 0;
                return false;
            case 35:
                //END
                this.$setTempSelected (this.getLastTraverseNode(), false, shiftKey);
                this.$int.scrollTop = this.$int.scrollHeight;
                return false;
            case 107:
                //+
                if (this.more)
                    this.startMore();
                break;
            case 37:
                //LEFT
                if (this.$tempsel)
                    this.$selectTemp();
                    
                if (this.cellselect) {
                    if (this.$lastcell) {
                        if (this.$lastcell.previousSibling) {
                            this.selectCell({target:this.$lastcell.previousSibling},
                                this.$selected);
                        }
                    }
                    else {
                        this.selectCell({target:this.$selected.firstChild}, 
                            this.$selected);
                    }
                }
                else if (this.$withContainer)
                    this.slideToggle(this.$caret || this.$selected, 2)
                return false;
            case 107:
            case 39:
                //RIGHT
                if (this.$tempsel)
                    this.$selectTemp();
                    
                if (this.cellselect) {
                    if (this.$lastcell) {
                        if (this.$lastcell.nextSibling) {
                            this.selectCell({target:this.$lastcell.nextSibling},
                                this.$selected);
                        }
                    }
                    else {
                        this.selectCell({target:this.$selected.firstChild}, 
                            this.$selected);
                    }
                }
                else if (this.$withContainer)
                    this.slideToggle(this.$caret || this.$selected, 1)
                    
                return false;
            case 38:
                //UP
                if (!selXml && !this.$tempsel) 
                    return false;
                    
                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;

                margin    = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, false, items);
                if (node)
                    this.$setTempSelected (node, ctrlKey, shiftKey);
                else
                    return false;

                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop <= oInt.scrollTop) {
                    oInt.scrollTop = (Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                      ? 0
                      : selHtml.offsetTop - margin[0])
                        - parseInt(apf.getStyle(oInt, apf.isIE 
                            ? "paddingTop" 
                            : "padding-top"));
                }
                return false;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel) 
                    return false;
                    
                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                margin    = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, true, items);
                if (node)
                   this.$setTempSelected (node, ctrlKey, shiftKey);
                else
                    return false;
                
                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oInt.scrollTop + oInt.offsetHeight) // - (hasScroll ? 10 : 0)
                    oInt.scrollTop = selHtml.offsetTop
                        - oInt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ (hasScroll ? 10 : 0)
                
                return false;
            case 33:
                //PGUP
                if (!selXml && !this.$tempsel) 
                    return false;
                    
                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                margin     = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScrollY = oInt.scrollHeight > oInt.offsetHeight;
                hasScrollX = oInt.scrollWidth > oInt.offsetWidth;
                items      = Math.floor((oInt.offsetWidth
                    - (hasScrollY ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3])) || 1;
                lines      = Math.floor((oInt.offsetHeight
                    - (hasScrollX ? 15 : 0)) / (selHtml.offsetHeight
                    + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(node, false, items * lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                if (node)
                   this.$setTempSelected (node, ctrlKey, shiftKey);
                else
                    return false;
                
                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop < oInt.scrollTop) {
                    oInt.scrollTop = (Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                      ? 0
                      : selHtml.offsetTop - margin[0]) 
                        - parseInt(apf.getStyle(oInt, apf.isIE 
                            ? "paddingTop" 
                            : "padding-top"));
                }
                return false;
            case 34:
                //PGDN
                if (!selXml && !this.$tempsel) 
                    return false;

                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                margin     = apf.getBox(apf.getStyle(selHtml, "margin"));
                hasScrollY = oInt.scrollHeight > oInt.offsetHeight;
                hasScrollX = oInt.scrollWidth > oInt.offsetWidth;
                items      = Math.floor((oInt.offsetWidth - (hasScrollY ? 15 : 0))
                    / (selHtml.offsetWidth + margin[1] + margin[3])) || 1;
                lines      = Math.floor((oInt.offsetHeight - (hasScrollX ? 15 : 0))
                    / (selHtml.offsetHeight + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(selXml, true, items * lines);
                if (!node)
                    node = this.getLastTraverseNode();
                if (node)
                   this.$setTempSelected (node, ctrlKey, shiftKey);
                else
                    return false;
                
                selHtml = apf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oInt.scrollTop + oInt.offsetHeight) // - (hasScrollY ? 10 : 0)
                    oInt.scrollTop = selHtml.offsetTop
                        - oInt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ 10 + (hasScrollY ? 10 : 0)
                return false;
            default:
                if (this.celledit) {
                    if (!ctrlKey && !e.altKey && (key > 46 && key < 112 || key > 123))
                        this.startRename(null, true);
                    return;
                }
                else if (key == 65 && ctrlKey) {
                    this.selectAll();
                    return false;
                } 
                //@todo make this work with the sorted column
                else if (this.caption || (this.bindingRules || {})["caption"]) {
                    if (!this.xmlRoot) return;
                    
                    //this should move to a onkeypress based function
                    if (!this.lookup || new Date().getTime()
                      - this.lookup.date.getTime() > 300)
                        this.lookup = {
                            str  : "",
                            date : new Date()
                        };
                    
                    this.lookup.str += String.fromCharCode(key);
    
                    var nodes = this.getTraverseNodes(); //@todo start at current indicator
                    for (var v, i = 0; i < nodes.length; i++) {
                        v = this.$applyBindRule("caption", nodes[i]);
                        if (v && v.substr(0, this.lookup.str.length)
                          .toUpperCase() == this.lookup.str) {
                            
                            if (!this.isSelected(nodes[i])) {
                                if (this.mode == "check")
                                    this.setCaret(nodes[i]);
                                else
                                    this.select(nodes[i]);
                            }
                            
                            if (selHtml)
                                this.$int.scrollTop = selHtml.offsetTop
                                    - (this.$int.offsetHeight
                                    - selHtml.offsetHeight) / 2;
                            return;
                        }
                    }
                    return;
                }
                break;
        };
        
        this.lookup = null;
        //return false;
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
    
    /**** Private methods ****/
    
    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r     = [],
            nodes = this.hasFeature(apf.__VIRTUALVIEWPORT__)
                ? this.xmlRoot.selectNodes(this.each)
                : this.getTraverseNodes(),
            f, i;
        for(f = false, i = 0; i < nodes.length; i++) {
            if (nodes[i] == xmlStartNode)
                f = true;
            if (f)
                r.push(nodes[i]);
            if (nodes[i] == xmlEndNode)
                f = false;
        }
        
        if (!r.length || f) {
            r = [];
            for (f = false, i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i] == xmlStartNode)
                    f = true;
                if (f)
                    r.push(nodes[i]);
                if (nodes[i] == xmlEndNode)
                    f = false;
            }
        }
        
        return r;
    };
    
    /**** Sliding functions ****/
    
    /**
     * @private
     */
    this.slideToggle = function(htmlNode, force){
        if (this.noCollapse) 
            return;
        
        //var id = htmlNode.getAttribute(apf.xmldb.htmlIdTag); // unused?
        var container = htmlNode.nextSibling;

        if (apf.getStyle(container, "display") == "block") {
            if (force == 1) return;
            htmlNode.className = htmlNode.className.replace(/min/, "plus");
            this.slideClose(container, apf.xmldb.getNode(htmlNode));
        }
        else {
            if (force == 2) return;
            htmlNode.className = htmlNode.className.replace(/plus/, "min");
            this.slideOpen(container, apf.xmldb.getNode(htmlNode));
        }
    };
    
    /**
     * @private
     */
    this.slideOpen = function(container, xmlNode){
        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, this);
        if (!container)
            container = htmlNode.nextSibling;

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode),
                p     = (pNode || this.xmlRoot).getAttribute(apf.xmldb.xmlIdTag);
            if (this.$lastOpened[p] && this.$lastOpened[p][1] != xmlNode
              && this.getTraverseParent(this.$lastOpened[p][1]) == pNode)
                this.slideToggle(this.$lastOpened[p][0], 2);//lastOpened[p][1]);
            this.$lastOpened[p] = [htmlNode, xmlNode];
        }
        
        container.style.display = "block";

        var _self = this;

        apf.tween.single(container, {
            type    : 'scrollheight', 
            from    : 0, 
            to      : container.scrollHeight, 
            anim    : this.$animType,
            steps   : this.$animSteps,
            interval: this.$animSpeed,
            onfinish: function(container){
                if (xmlNode && _self.$hasLoadStatus(xmlNode, "potential")) {
                    $setTimeout(function(){
                        _self.$extend(xmlNode, container);
                    });
                    container.style.height = "auto";
                }
                else {
                    //container.style.overflow = "visible";
                    container.style.height = "auto";
                }
            }
        });
    };

    /**
     * @private
     */
    this.slideClose = function(container, xmlNode){
        if (this.noCollapse) return;
        
        if (this.singleopen) {
            var p = (this.getTraverseParent(xmlNode) || this.xmlRoot)
                .getAttribute(apf.xmldb.xmlIdTag);
            this.$lastOpened[p] = null;
        }
        
        container.style.height   = container.offsetHeight;
        container.style.overflow = "hidden";

        apf.tween.single(container, {
            type    : 'scrollheight', 
            from    : container.scrollHeight, 
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
        var rules = e.bindings["column"];
        if (!rules || !rules.length)
            return;
        
        this.$headings = rules;
        
        var fixed = 0, found = false;
        for (var h, i = 0, l = rules.length; i < l; i++) {
            h = rules[i];
            
            //#ifdef __DEBUG
            if (!h.$width)
                throw new Error("missing width"); //temporary check
            //#endif
            
            if (!h.$isPercentage)
                fixed += parseFloat(h.$width) || 0;
            else 
                found = true;
        }
        
        if (!found) { //@todo removal???
            this.$isFixedGrid = true;
            this.$setStyleClass(this.$ext, "fixed");
            
            if (this.$useiframe)
                this.$setStyleClass(this.oDoc.documentElement, "fixed");
        }
        else {
            //@todo remove
        }

        if (fixed > 0 && !this.$isFixedGrid) {
            var vLeft = fixed + 5;
            
            //first column has total -1 * fixed margin-left. - 5
            //cssRules[0][1] += ";margin-left:-" + vLeft + "px;";
            //cssRules[1][1] += ";margin-left:-" + vLeft + "px;";
            this.$cssRules.push(["." + this.$baseCSSname + " .row" + this.$uniqueId,
                "padding-right:" + vLeft + "px;margin-right:-" + vLeft + "px"]);
        
            //headings and records have same padding-right
            this.$int.style.paddingRight  =
            this.$head.style.paddingRight = vLeft + "px";
        }
        
        this.$fixed = fixed;
        this.$first = 0;

        this.$withContainer = e.bindings.description ? true : false;

        //Activate CSS Rules
        importStylesheet(this.$cssRules, window);
        
        if (this.$useiframe)
            importStylesheet(this.$cssRules, this.oWin);
    });
    
    this.$add = function(xmlNode, sLid, xmlParentNode, htmlParentNode, beforeNode){
        //Build Row
        this.$getNewContext("row");
        var oRow = this.$getLayoutNode("row");
        oRow.setAttribute("id", sLid);
        oRow.setAttribute("class", "row" + this.$uniqueId);//"width:" + (totalWidth+40) + "px");
        
        oRow.setAttribute("ondblclick", 'var o = apf.lookup(' + this.$uniqueId + ');o.choose();'
            + (this.$withContainer ? 'o.slideToggle(this);' : '')
            + (this.celledit && !this.namevalue ? 'o.startRename();' : ''));
        
        if (this.hasFeature(apf.__DRAGDROP__)) {
            oRow.setAttribute("onmouseout", 'this.hasPassedDown = false;');
            oRow.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId + ');\
                var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 this.hasPassedDown = true;\
                 if (!o.hasFeature(apf.__DRAGDROP__) || !isSelected && !event.ctrlKey)\
                     o.select(this, event.ctrlKey, event.shiftKey);'
                + (this.cellselect || this.namevalue ? 'o.selectCell(event, this, isSelected);' : ''));
            
            oRow.setAttribute("onmouseup", 'if (!this.hasPassedDown) return;\
                var o = apf.lookup(' + this.$uniqueId + ');\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 if (o.hasFeature(apf.__DRAGDROP__))\
                     o.select(this, event.ctrlKey, event.shiftKey);');
        } //@todo add DRAGDROP ifdefs
        else {
            oRow.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId + ');\
                var wasSelected = o.$selected == this;\
                o.select(this, event.ctrlKey, event.shiftKey);'
                + (this.cellselect || this.namevalue ? 'o.selectCell(event, this, wasSelected);' : ''));
        }
        
        //Build the Cells
        for (var cell, h, i = 0; i < this.$headings.length; i++) {
            h = this.$headings[i];
            
            this.$getNewContext("cell");
            cell = this.$getLayoutNode("cell");
            
            apf.setStyleClass(cell, h.$className);
            
            if (h.css)
                apf.setStyleClass(cell, (apf.lm.compile(h.css))(xmlNode));

            if (h.type == "icon"){
                var node = this.$getLayoutNode("cell", "caption", oRow.appendChild(cell));
                if (apf.isIE) {
                    apf.setNodeValue(node, "&nbsp;");
                }
                (node.nodeType == 1 && node || node.parentNode)
                    .setAttribute("style", "background-image:url(" 
                        + apf.getAbsolutePath(this.iconPath, 
                            ((h.cvalue2 || h.$compile("value", {nostring: true}))(xmlNode) || ""))
                        + ")");
            }
            else {
                apf.setNodeValue(this.$getLayoutNode("cell", "caption", oRow.appendChild(cell)),
                    (h.cvalue2 || h.$compile("value", {nostring: true}))(xmlNode) || "");
                    //(this.$applyBindRule([h.xml], xmlNode) || "").trim() || ""); //@todo for IE but seems not a good idea
            }
        }
        
        if (this.$bindings && this.$bindings.color) {
            var colorRule = this.$getDataNode("color", xmlNode);
            this.$setStyleClass(oRow, colorRule ? "highlight" : null, colorRule ? ["highlight"] : null);
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(oRow, cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        // #endif

        //return apf.insertHtmlNode(oRow, htmlParentNode || this.$int, beforeNode);
        if (htmlParentNode)
            apf.insertHtmlNode(oRow, htmlParentNode, beforeNode);
        else
            this.$nodes.push(oRow);
        
        if (this.$withContainer) {
            var desc = this.$applyBindRule("description", xmlNode);
            this.$getNewContext("container");
            var oDesc = this.$getLayoutNode("container");
            apf.setNodeValue(this.$getLayoutNode("container", "container",
                oDesc), desc);
            oDesc.setAttribute("class", (oDesc.getAttribute("class") || "")
                + " row" + this.$uniqueId);
            
            if (htmlParentNode)
                apf.insertHtmlNode(oDesc, htmlParentNode, beforeNode);
            else 
                this.$nodes.push(oDesc);
        }
    };
    
    this.$fill = function(nodes){
        if (this.$useiframe)
            this.$pHtmlDoc = this.oDoc;

        if (this.$useTable) {
            apf.insertHtmlNodes(this.$nodes, this.$int, null,
                 "<table class='records' cellpadding='0' cellspacing='0'><tbody>", 
                 "</tbody></table>");
        }
        else
            apf.insertHtmlNodes(this.$nodes, this.$int);

        this.$nodes.length = 0;
    };

    this.$deInitNode = function(xmlNode, htmlNode){
        if (this.$withContainer)
            htmlNode.parentNode.removeChild(htmlNode.nextSibling);
        
        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    };
    
    this.$updateNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;
        
        var nodes     = this.$head.childNodes,
            htmlNodes = htmlNode.childNodes,
            node, p;
        
        if (!this.namevalue && this.$curBtn)
            p = this.$curBtn.parentNode;

        for (var nodeIter, h, i = this.namevalue ? 1 : 0, l = nodes.length; i < l; i++) {
            h = apf.all[nodes[i].getAttribute("hid")];
            
            nodeIter = htmlNodes[i];
            while (nodeIter && nodeIter.nodeType != 1)
                nodeIter = nodeIter.nextSibling;
            
            //@todo fake optimization
            node = this.$getLayoutNode("cell", "caption", nodeIter) || nodeIter;//htmlNodes[i].firstChild || 
            
            if (h.type == "icon") {
                (node.nodeType == 1 && node || node.parentNode)
                    .style.backgroundImage = "url(" 
                        + apf.getAbsolutePath(this.iconPath, 
                            ((h.cvalue2 || h.$compile("value", {nostring: true}))(xmlNode) || ""))
                        + ")";
            }
            else {
                node.innerHTML = (h.cvalue2 || h.$compile("value", {nostring: true}))(xmlNode) || ""
            }
        }
        
        if (!this.namevalue && p)
            p.appendChild(this.$curBtn);
        
        //return; //@todo fake optimization
        
        if (this.$bindings && this.$bindings.color) {
            var colorRule = this.$getDataNode("color", xmlNode);
            this.$setStyleClass(htmlNode, colorRule ? "highlight" : null,
                colorRule ? ["highlight"] : null);
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass || this.dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass))
                this.dynCssClasses.push(cssClass);
        }
        // #endif
        
        if (this.$withContainer) {
            htmlNode.nextSibling.innerHTML 
                = this.$applyBindRule("description", xmlNode) || "";
        }
    };
    
    this.$moveNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;
        var oPHtmlNode = htmlNode.parentNode;
        var beforeNode = xmlNode.nextSibling 
            ? apf.xmldb.findHtmlNode(this.getNextTraverse(xmlNode), this)
            : null;

        oPHtmlNode.insertBefore(htmlNode, beforeNode);
        
        //if(this.emptyMessage && !oPHtmlNode.childNodes.length) this.setEmpty(oPHtmlNode);
    };
    
    this.$selectDefault = function(XMLRoot){
        this.select(XMLRoot.selectSingleNode(this.each), null, null, null, true);
    };
    
    /**** Column management ****/

    /**
     * Returns a column definition object based on the column number.
     * @param {Number} hid the heading number; this number is based on the sequence of the column elements.
     */
    this.getColumn = function(nr){
        return this.$headings[nr || this.$lastcol || 0];
    };
    
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
    
    /**
     * Sorts a column.
     * @param {Number} hid the heading number; this number is based on the sequence of the column elements.
     */
    this.sortColumn = function(hid){
        var h = this.$headings[nr];
        h.sort();
    };
    
    /**
     * Moves a column to another position.
     * @param {Number} fromHid the heading number of the column to move; this number is based on the sequence of the column elements.
     * @param {Number} toHid   the position the column is moved to;
     */
    this.moveColumn = function(from, to){
        var h = this.$headings[nr];
        h.move(to);
    }
    
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

            // #ifdef __WITH_RENAME
            this.oDoc.body.insertAdjacentHTML("beforeend", this.oTxt.outerHTML);

            var t     = this.oTxt;
            t.refCount--;
            this.oTxt = this.oDoc.body.lastChild;
            this.oTxt.parentNode.removeChild(this.oTxt);
            this.oTxt.select = t.select;

            this.oTxt.ondblclick    = 
            this.oTxt.onselectstart = 
            this.oTxt.onmouseover   = 
            this.oTxt.onmouseout    = 
            this.oTxt.oncontextmenu = 
            this.oTxt.onmousedown   = function(e){ 
                (e || (_self.oWin || window).event).cancelBubble = true; 
            };

            this.oTxt.onfocus   = t.onfocus;
            this.oTxt.onblur    = t.onblur;
            this.oTxt.onkeyup   = t.onkeyup;
            this.oTxt.refCount  = 1;
            // #endif
            
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
    };
    
    this.$destroy = function(){
        apf.popup.removeContent(this.$uniqueId);
        
        //@todo destroy this.oTxt here

        this.$ext.onclick = this.$int.onresize = null;
        
        //#ifdef __WITH_LAYOUT
        apf.layout.removeRule(this.$int, "dg" + this.$uniqueId);
        apf.layout.activateRules(this.$int);
        //#endif
    };
// #ifdef __WITH_MULTISELECT
}).call(apf.datagrid.prototype = new apf.MultiSelect());
/* #elseif __WITH_DATABINDING
}).call(apf.datagrid.prototype = new apf.MultiselectBinding());
   #else
}).call(apf.datagrid.prototype = new apf.Presentation());
#endif*/

apf.spreadsheet.prototype = apf.datagrid.prototype;

apf.aml.setElement("spreadsheet", apf.spreadsheet);
apf.aml.setElement("datagrid",    apf.datagrid);
//apf.aml.setElement("column",      apf.BindingRule);
apf.aml.setElement("description", apf.BindingRule);
apf.aml.setElement("color",       apf.BindingRule);
apf.aml.setElement("contents",    apf.BindingRule);

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