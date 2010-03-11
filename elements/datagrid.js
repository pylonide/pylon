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
 *  <a:propedit 
 *    columns    = "35%,65%" 
 *    model      = "mdlData" 
 *    properties = "[mdlProps::folder]" 
 *    width      = "300" 
 *    height     = "500" />
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
 *      <a:model id="mdlProps">
 *          <props>
 *              <folder>
 *                   <group caption="General">
 *                      <prop 
 *                        caption    = "Title" 
 *                        editor     = "textbox" 
 *                        value      = "[@caption]" 
 *                        required   = "true" />
 *                      <prop 
 *                        caption  = "Priority" 
 *                        editor   = "dropdown" 
 *                        value    = "[@priority]">
 *                           <item value="1">1</item> 
 *                           <item value="2">2</item> 
 *                           <item value="3">3</item> 
 *                           <item value="4">4</item> 
 *                           <item value="5">5</item> 
 *                      </prop>
 *                      <prop 
 *                        caption   = "(Align)" 
 *                        editor    = "textbox" 
 *                        value     = "[@align]">
 *                           <prop 
 *                             caption  = "Position" 
 *                             editor   = "dropdown" 
 *                             value    = "[@align-template]">
 *                               <item value="left">left</item> 
 *                               <item value="top">top</item> 
 *                               <item value="right">right</item> 
 *                               <item value="bottom">bottom</item> 
 *                           </prop>
 *                           <prop 
 *                             caption  = "Splitter" 
 *                             editor   = "checkbox" 
 *                             values   = "True|False"
 *                             value    = "[@splitter]" />
 *                           <prop 
 *                             caption  = "Edge" 
 *                             editor   = "slider" 
 *                             value    = "[@edge]" />
 *                           <prop 
 *                             caption  = "Some value" 
 *                             editor   = "spinner" 
 *                             value    = "[@some]" />
 *                      </prop>
 *                      <prop 
 *                         caption  = "Date" 
 *                         editor   = "caldropdown" 
 *                         value    = "[@date]" />
 *                   </group>
 *                   <group caption="Advanced">
 *                      <prop 
 *                        caption    = "Title" 
 *                        editor     = "textbox" 
 *                        value      = "[@caption]" 
 *                        required   = "true" />
 *                      <prop 
 *                        caption  = "Priority" 
 *                        editor   = "dropdown" 
 *                        value    = "[@priority]">
 *                           <item value="1">1</item> 
 *                           <item value="2">2</item> 
 *                           <item value="3">3</item> 
 *                           <item value="4">4</item> 
 *                           <item value="5">5</item> 
 *                      </prop>
 *                      <prop 
 *                        caption   = "(Align)" 
 *                        editor    = "textbox" 
 *                        value     = "[@align]">
 *                           <prop 
 *                             caption  = "Position" 
 *                             editor   = "dropdown" 
 *                             value    = "[@align-template]">
 *                               <item value="left">left</item> 
 *                               <item value="top">top</item> 
 *                               <item value="right">right</item> 
 *                               <item value="bottom">bottom</item> 
 *                           </prop>
 *                           <prop 
 *                             caption  = "Splitter" 
 *                             editor   = "checkbox" 
 *                             values   = "True|False"
 *                             value    = "[@splitter]" />
 *                           <prop 
 *                             caption  = "Edge" 
 *                             editor   = "slider" 
 *                             value    = "[@edge]" />
 *                           <prop 
 *                             caption  = "Some value" 
 *                             editor   = "spinner" 
 *                             value    = "[@some]" />
 *                      </prop>
 *                      <prop 
 *                         caption  = "Date" 
 *                         editor   = "caldropdown" 
 *                         value    = "[@date]" />
 *                   </group>
 *              </folder>
 *              <file>
 *                  <prop 
 *                    caption    = "Title" 
 *                    type       = "textbox" 
 *                    value      = "[@caption]" 
 *                    required   = "true" />
 *                  <prop 
 *                    caption  = "Priority" 
 *                    type     = "dropdown" 
 *                    value    = "[@priority]"
 *                    overview = "overview">
 *                       <item value="1">1</item> 
 *                       <item value="2">2</item> 
 *                       <item value="3">3</item> 
 *                       <item value="4">4</item> 
 *                       <item value="5">5</item> 
 *                  </prop>
 *              </file>
 *          </props>
 *      </a:model>
 *      
 *      <a:model id="mdlData">
 *          <folder caption="My Documents" priority="4" align="left-splitter-3" />
 *      </a:model>
 *       
 *      <a:propedit 
 *        lookupaml      = "tmpLookup"
 *        onbeforelookup = "clearLookup(event.xmlNode, event.value)" 
 *        onafterlookup  = "loadLookup(event.xmlNode, event.value, this)"
 *        onmultiedit    = "loadMultiEdit(event, this)">
 *          <a:bindings>
 *              <a:template match="[self::product]" value="mdlProps:product" />
 *          </bindings>
 *      </propedit>
 *
 *      <a:template id="tmpLookup" autoinit="true">
 *          <a:list id="lstLookup" skin="mnulist" style="width:auto;margin-bottom:3px" 
 *            model="mdlLookup" empty-message="No results" height="{lstLookup.length * 20}"
 *            automatch="[false]">
 *              <a:bindings>
 *                  <a:caption match="[self::picture]"><![CDATA[
 *                      {name} | {description}
 *                  ]]></caption>
 *                  <!-- use @descfield -->
 *                  <a:caption><![CDATA[[
 *                      var field = n.parentNode.getAttribute("descfield");
 *                      %(value(field) || "[Geen Naam]");
 *                  ]]]></caption>
 *                  <a:icon match="[self::product]" value="package_green.png" />
 *                  <a:icon value="table.png" />
 *                  <a:each match="[node()[local-name()]]" />
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
apf.datagrid = function(struct, tagName){
    this.$init(tagName || "datagrid", apf.NODE_VISIBLE, struct);
    
    this.$headings       = [],
    this.$cssRules       = []; //@todo Needs to be reset;
    this.$lastOpened     = {};
    
    this.$editors        = {};
    
    // #ifdef __WITH_CSS_BINDS
    this.$dynCssClasses = [];
    // #endif
};

(function(){
    var HAS_CHILD = 1 << 1,
        IS_CLOSED = 1 << 2,
        IS_LAST   = 1 << 3,
        IS_ROOT   = 1 << 4,
        treeState = this.$treeState;
    
    /*this.$init(function() {
        this.addEventListener("keydown", keyHandler, true);
    });*/
    
    this.bufferselect       = false;
    this.$useTable          = false;
    this.$focussable        = true;
    this.$isWindowContainer = -1;
    
    this.$widthdiff      = 0;
    this.$defaultwidth   = 0;
    this.$useiframe      = 0;
    this.$needsDepth     = true;
    
    //#ifdef __WITH_RENAME
    this.$renameStartCollapse = false;
    //#endif

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
    /*function keyHandler(e){
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
    }*/
    
    // #endif
    
    /**** Focus ****/
    // Too slow for IE
    
    this.$focus = function(){
        if (!this.$ext || (apf.isIE && this.$useiframe && this.cssfix)) //@todo fix this by fixing focussing for this component
            return;

        this.$setStyleClass(this.$ext, this.$baseCSSname + "Focus");
        
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

        this.$setStyleClass(this.$ext, "", [this.$baseCSSname + "Focus"]);
        
        if (this.oDoc)
            this.$setStyleClass(this.oDoc.documentElement, "", [this.$baseCSSname + "Focus"]);
        
        hideEditor.call(this);
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
            var vLeft = fixed;
            
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
    
    this.$initNode = function(xmlNode, state, Lid, depth){
        //Build Row
        this.$getNewContext("item");
        var oRow = this.$getLayoutNode("item");
        oRow.setAttribute("id", Lid);
        
        //@todo if treearch
        oRow.setAttribute("class", oRow.getAttribute("class") + " "  
            + treeState[state] + " item" + this.$uniqueId);//"width:" + (totalWidth+40) + "px");
        this.$setStyleClass(this.$getLayoutNode("item", "container"), treeState[state])
        
        oRow.setAttribute("ondblclick", 'var o = apf.lookup(' + this.$uniqueId + ');o.choose(null, true);'
            + (this.$withContainer ? 'o.slideToggle(this, null, true);' : '')
            + (this.celledit && !this.namevalue ? 'o.startRename(null, null, true);' : ''));
        
        if (this.hasFeature(apf.__DRAGDROP__)) {
            oRow.setAttribute("onmouseout", 'this.hasPassedDown = false;');
            oRow.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId + ');\
                var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 this.hasPassedDown = true;\
                 if (!o.hasFeature(apf.__DRAGDROP__) || !isSelected && !event.ctrlKey)\
                     o.select(this, event.ctrlKey, event.shiftKey, -1);'
                + (this.cellselect || this.namevalue ? 'o.selectCell(event, this, isSelected);' : ''));
            
            oRow.setAttribute("onmouseup", 'if (!this.hasPassedDown) return;\
                var o = apf.lookup(' + this.$uniqueId + ');\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 if (o.hasFeature(apf.__DRAGDROP__))\
                     o.select(this, event.ctrlKey, event.shiftKey, -1);');
        } //@todo add DRAGDROP ifdefs
        else {
            oRow.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId + ');\
                var wasSelected = o.$selected == this;\
                o.select(this, event.ctrlKey, event.shiftKey, -1);'
                + (this.cellselect || this.namevalue ? 'o.selectCell(event, this, wasSelected);' : ''));
        }
        
        //Build the Cells
        for (var cell, h, i = 0; i < this.$headings.length; i++) {
            h = this.$headings[i];
            
            if (h.tree) {
                this.$getNewContext("treecell");
                cell = this.$getLayoutNode("treecell");
                var oc = this.$getLayoutNode("treecell", "openclose");
                oc.setAttribute("style", "margin-left:" + (((depth||0)) * 15 + 4) + "px;");
                oc.setAttribute("onmousedown",
                    "var o = apf.lookup(" + this.$uniqueId + ");\
                    o.slideToggle(this, null, null, true);\
                    apf.cancelBubble(event, o);");
            
                oc.setAttribute("ondblclick", "event.cancelBubble = true");
                
                /*cell.setAttribute("style", "background-position: " 
                    + ((((depth||0)+1) * 15) - 10) + "px 50%");*/
            }
            else {
                this.$getNewContext("cell");
                cell = this.$getLayoutNode("cell");
            }
            
            apf.setStyleClass(cell, h.$className);
            
            if (h.css)
                apf.setStyleClass(cell, (apf.lm.compile(h.css))(xmlNode)); //@todo cashing of compiled function?
            
            if (h.icon) {
                var node = this.$getLayoutNode(h.tree ? "treecell" : "cell", "caption", oRow.appendChild(cell));
                (node.nodeType == 1 && node || node.parentNode)
                    .setAttribute("style", "padding-left:19px;background:url(" 
                        + apf.getAbsolutePath(this.iconPath, 
                            ((h.cicon || h.$compile("icon", {nostring: true}))(xmlNode) || ""))
                        + ") no-repeat 0 0;");
            }
            
            if (h.value) {
                apf.setNodeValue(this.$getLayoutNode(h.tree ? "treecell" : "cell", "caption", oRow.appendChild(cell)),
                    (h.cvalue2 || h.$compile("value", {nostring: true}))(xmlNode) || "");
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
                this.$dynCssClasses.push(cssClass);
        }
        // #endif

        /*if (this.$withContainer) {
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
        }*/
        
        return oRow;
    };
    
    this.$updateNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;
        
        var nodes     = this.$head.childNodes,
            htmlNodes = htmlNode.childNodes,
            cell, p;
        
        if (!this.namevalue && this.$curBtn)
            p = this.$curBtn.parentNode;

        var nodeIter, h, i = 0;
        nodeIter = htmlNodes[0];
        while (nodeIter) {
            if (nodeIter.nodeType != 1) {
                nodeIter = nodeIter.nextSibling;
                continue;
            }
            
            h = apf.all[nodes[i].getAttribute("hid")];
            
            //@todo fake optimization
            cell = this.$getLayoutNode(h.tree ? "treecell" : "cell", "caption", nodeIter) || nodeIter;//htmlNodes[i].firstChild || 

            if (h.css)
                apf.setStyleClass(cell, (apf.lm.compile(h.css))(xmlNode)); //@todo cashing of compiled function?

            if (h.tree) {
                /*var oc = this.$getLayoutNode("treecell", "openclose", cell);
                oc.setAttribute("style", "margin-left:" + (((depth||0)) * 15 + 4) + "px;");
                oc.setAttribute("onmousedown",
                    "var o = apf.lookup(" + this.$uniqueId + ");\
                    o.slideToggle(this, null, null, true);");*/
            }
            
            if (h.value)
                cell.innerHTML = (h.cvalue2 || h.$compile("value", {nostring: true}))(xmlNode) || "";
            
            if (h.icon) {
                (cell.nodeType == 1 && cell || cell.parentNode).style.backgroundImage = 
                    "url(" + apf.getAbsolutePath(this.iconPath, 
                        ((h.cicon || h.$compile("icon", {nostring: true}))(xmlNode) || ""))
                    + ")";
            }
            
            i++;
            nodeIter = nodeIter.nextSibling;
        }
        
        //return; //@todo fake optimization
        
        if (this.$bindings && this.$bindings.color) {
            var colorRule = this.$getDataNode("color", xmlNode);
            this.$setStyleClass(htmlNode, colorRule ? "highlight" : null,
                colorRule ? ["highlight"] : null);
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass || this.$dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.$dynCssClasses);
            if (cssClass && !this.$dynCssClasses.contains(cssClass))
                this.$dynCssClasses.push(cssClass);
        }
        // #endif
        
        /*if (this.$withContainer) {
            htmlNode.nextSibling.innerHTML 
                = this.$applyBindRule("description", xmlNode) || "";
        }*/
    };
    
    this.$dblclick = function(htmlNode){
        var _self = this, id, cell;
        while (!(id = htmlNode.getAttribute(apf.xmldb.htmlIdTag)) || id.indexOf("|") == -1) {
            htmlNode = (cell = htmlNode).parentNode;
        }
        
        var h, colId = cell.className.match(/(col\d+)/)[1];
        for (var i = 0; i < this.$headings.length; i++) {
            if (this.$headings[i].$className == colId) {
                h = this.$headings[i];
                break;
            }
        }
        
        if (!h.editor) //No editor specified
            return;

        /*if (this.$lastEditor) {
            //this.$lastEditor[0].$blur();
            this.$lastEditor[0].setProperty("visible", false);
            
            var nodes = this.$lastEditor[1].childNodes;
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (!nodes[i].host)
                    nodes[i].style.display = "";
            }
        }*/
        
        var xmlNode = apf.xmldb.getNode(htmlNode);
        /*
            - editor (name of widget, lm function returning amlNode or lm template ref)
            - children being aml nodes
        */
        var editParent = cell;//this.$getLayoutNode("cell", "caption", cell);
        var oEditor, editor = h.editor; 
        var ceditor = apf.lm.compile(editor, {xpathmode: 2}); //@todo can this be more efficient?
    
        var nodes = editParent.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            if (!nodes[i].host)
                nodes[i].style.display = "none";
        }

        if (ceditor.type == 2) {
            if (!this.$editors[editor]) {
                var constr = apf.namespaces[apf.ns.aml].elements[editor];
                var info   = {
                    htmlNode : editParent,
                    width    : "100%-3",
                    style    : "position:relative;z-index:10000",
                    value    : "[{" + this.id + ".selected}::" 
                        + (v = h.value).substr(1, v.length - 2)  //only xpath value's supported for now
                        + "]",
                    focussable : false
                };
                
                //@todo copy all non-known properties of the prop element

                /*if (constr.prototype.hasFeature(apf.__MULTISELECT__)) {
                    info.caption   = "[text()]";
                    info.eachvalue = "[@value]";
                    info.each      = "item";
                    info.model     = "{apf.xmldb.getElementById('" 
                        + prop.getAttribute(apf.xmldb.xmlIdTag) + "')}";
                }*/

                oEditor = this.$editors[editor] = new constr(info);
                
                var box = apf.getBox(apf.getStyle(oEditor.$ext, "margin"));
                if (box[1] || box[3]) {
                    oEditor.setAttribute("width", "100%+2-" + (box[1] + box[3]));
                }
                //else if (!box[3])
                    //oEditor.$ext.style.marginLeft = "-1px";
                
                //oEditor.$focussable = false;
                oEditor.addEventListener("blur", function(){
                    hideEditor.call(_self);
                });
                oEditor.parentNode   = this;
                oEditor.realtime     = false;
                oEditor.$focusParent = this;
                oEditor.setAttribute("focussable", "true");
                //delete oEditor.parentNode;
                
                oEditor.addEventListener("beforechange", function(e){
                    return _self.dispatchEvent("beforechange", e);
                });
                
                oEditor.addEventListener("afterchange", function(e){
                    return _self.dispatchEvent("afterchange", e);
                });
                
                oEditor.addEventListener("keydown", function(e){
                    if (e.keyCode == 13) {
                        hideEditor.call(_self);
                        _self.$focus();
                    }
                    else if (e.keyCode == 27) {
                        oEditor.removeAttribute("value"); //@todo this bugs in slider
                        hideEditor.call(_self);
                        //_self.getActionTracker().undo();
                    }
                });
                
                //@todo set actiontracker
            }
            else {
                oEditor = this.$editors[editor];
                
                /*if (oEditor.hasFeature(apf.__MULTISELECT__))
                    oEditor.setAttribute("model", "{apf.xmldb.getElementById('" 
                        + prop.getAttribute(apf.xmldb.xmlIdTag) + "')}");*/

                oEditor.setAttribute("value", "[{" + this.id + ".selected}::" 
                    + (v = h.value).substr(1, v.length - 2) 
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
        
        if (oEditor.localName == "textbox")
            oEditor.select();
        
        oEditor.focus();
        oEditor.$focus();
        
        this.$setStyleClass(htmlNode, "editing");
        
        this.$lastEditor = [oEditor, editParent, xmlNode, htmlNode, this.getActionTracker().undolength];
    }
    
    this.addEventListener("mousedown", function(e){
        if (this.$lastEditor 
          && !apf.isChildOf(this.$lastEditor[1], 
            e.htmlEvent.srcElement || e.htmlEvent.target, true))
                hideEditor.call(this);
    });
    
    this.addEventListener("beforeselect", function hideEditor(e){
        if (this.$lastEditor) {
            //this.$lastEditor[0].$blur();
            this.$lastEditor[0].setProperty("visible", false);
            if (!this.$lastEditor)
                return;
            
            var nodes = this.$lastEditor[1].childNodes;
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (!nodes[i].host)
                    nodes[i].style.display = "";
            }
            
            this.$setStyleClass(this.$lastEditor[3], "", ["editing"]);
            
            this.$lastEditor = null;
            
            this.$focus();
        }
    });
    
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
        this.$drawBase();
        
        var _self = this;
        this.$ext.onmousedown = function(e){
            _self.dispatchEvent("mousedown", {htmlEvent: e || event}); 
        }
        
        //@todo rename 'body' to 'container'
        
        //Build Main Skin
        this.$head    = this.$getLayoutNode("main", "head", this.$ext);
        this.$pointer = this.$getLayoutNode("main", "pointer", this.$ext);

        if (this.$head.firstChild)
            this.$head.removeChild(this.$head.firstChild);
        if (this.$int.firstChild)
            this.$int.removeChild(this.$int.firstChild);

        var widthdiff = this.$widthdiff = this.$getOption("main", "widthdiff") || 0;
        this.$defaultwidth = this.$getOption("main", "defaultwidth") || "100";
        this.$useiframe    = apf.isIE && (apf.isTrue(this.$getOption("main", "iframe")) || this.iframe);

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
            this.oDoc.body.insertAdjacentHTML("beforeend", this.$txt.outerHTML);

            var t     = this.$txt;
            t.refCount--;
            this.$txt = this.oDoc.body.lastChild;
            this.$txt.parentNode.removeChild(this.$txt);
            this.$txt.select = t.select;

            this.$txt.ondblclick    = 
            this.$txt.onselectstart = 
            this.$txt.onmouseover   = 
            this.$txt.onmouseout    = 
            this.$txt.oncontextmenu = 
            this.$txt.onmousedown   = function(e){ 
                (e || (_self.oWin || window).event).cancelBubble = true; 
            };

            this.$txt.onfocus   = t.onfocus;
            this.$txt.onblur    = t.onblur;
            this.$txt.onkeyup   = t.onkeyup;
            this.$txt.refCount  = 1;
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
            
            this.$int.onscroll = 
                function(){
                    if (_self.$isFixedGrid)
                        _self.$head.scrollLeft = _self.$int.scrollLeft;
                };
        }
        
        this.$int.ondblclick = function(e){
            if (!e) e = event;
            _self.$dblclick(e.srcElement || e.target);
        }
    };
    
    this.$destroy = function(){
        //@todo destroy this.$txt here

        this.$ext.onclick = this.$int.onresize = null;
        
        //#ifdef __WITH_LAYOUT
        apf.layout.removeRule(this.$int, "dg" + this.$uniqueId);
        apf.layout.activateRules(this.$int);
        //#endif
    };
}).call(apf.datagrid.prototype = new apf.BaseTree());

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