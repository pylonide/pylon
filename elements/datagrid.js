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

// #ifdef __JDATAGRID || __INC_ALL || __JSPREADSHEET || __JPROPEDIT
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
 *  <j:datagrid model="mdlNews" options="move|size">
 *      <j:bindings>
 *          <j:column type="icon" width="16" value="newspaper.png" />
 *          <j:column caption="Date" select="publication/@date" width="70" />
 *            <j:column caption="Title" width="180" select="title" />
 *          <j:column caption="Subtitle" select="subtitle" width="100%" />
 *          <j:traverse select="news" />
 *      </j:bindings>
 *      <j:actions />
 *  </j:datagrid>
 * </code>
 * Example:
 * This example shows a spreadsheet component. The spreadsheet component is an
 * alias for the datagrid. It has a different skin and different defaults.
 * <code>
 *  <j:spreadsheet>
 *      <j:bindings>
 *          <j:column caption="A" select="@field3" />
 *          <j:column caption="B" select="@field1" />
 *          <j:column caption="C" select="@field2" />
 *          <j:column caption="D" select="@field4" />
 *          <j:column caption="E" select="@field5" />
 *          <j:traverse select="record" />
 *      </j:bindings>
 *      <j:model>
 *          <records>
 *              <record field1="b" field2="b" field3="c" field4="d" field5="e" />
 *              <record field1="g" field2="b" field3="c" field4="d" field5="e" />
 *          </records>
 *      </j:model>
 *  </j:spreadsheet>
 * </code>
 * Example:
 * This example shows a propedit (property editor) component. The propedit 
 * component is an alias for the datagrid. It has a different skin and different
 * defaults. See {@link element.datagrid.attribute.template the template attribute}.
 * <code>
 *  <j:propedit template="mdlTemplate" />
 * </code>
 *
 * @constructor
 * @define datagrid, spreadsheet, propedit
 * @addnode elements
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits jpf.MultiSelect
 * @inherits jpf.Cache   
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * @inherits jpf.DragDrop
 * @inherits jpf.Rename
 *
 * @event beforelookup  Fires before the value lookup UI is shown.
 *   cancellable: Prevents the lookup value from being processed.
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
 *      <j:propedit 
 *        lookupjml      = "tmpLookup"
 *        onbeforelookup = "clearLookup(event.xmlNode, event.value)" 
 *        onafterlookup  = "loadLookup(event.xmlNode, event.value, this)"
 *        onmultiedit    = "loadMultiEdit(event, this)">
 *          <j:bindings>
 *              <j:template select="self::product" value="mdlProps:product" />
 *          </j:bindings>
 *      </j:propedit>
 *
 *      <j:template id="tmpLookup" autoinit="true">
 *          <j:list id="lstLookup" skin="mnulist" style="width:auto;margin-bottom:3px" 
 *            model="mdlLookup" empty-message="No results" height="{lstLookup.length * 20}"
 *            autoselect="false">
 *              <j:bindings>
 *                  <j:caption select="self::picture"><![CDATA[
 *                      {name} | {description}
 *                  ]]></j:caption>
 *                  <!-- use @descfield -->
 *                  <j:caption><![CDATA[[
 *                      var field = n.parentNode.getAttribute("descfield");
 *                      %(value(field) || "[Geen Naam]");
 *                  ]]]></j:caption>
 *                  <j:icon select="self::product" value="package_green.png" />
 *                  <j:icon value="table.png" />
 *                  <j:traverse select="node()[local-name()]" />
 *              </j:bindings>
 *              <j:actions />
 *          </j:list>
 *          
 *          <j:toolbar>
 *              <j:bar>
 *                  <j:button id="btnLkpPrev" disabled="true" 
 *                      onclick="...">&lt; Previous</j:button>
 *                  <j:spinner id="spnLookup" width="40" 
 *                      min="1" max="1" onafterchange="..." />
 *                  <j:button id="btnLkpNext" disabled="true" 
 *                      onclick="...">Next &gt;</j:button>
 *              </j:bar>
 *          </j:toolbar>
 *      </j:template>
 *   </code>
 * @binding caption   Determines the caption of a node.
 * @binding css       Determines a css class for a node.
 * Example:
 * In this example a node is bold when the folder contains unread messages:
 * <code>
 *  <j:list>
 *      <j:bindings>
 *          <j:caption select="@caption" />
 *          <j:css select="message[@unread]" value="highlighUnread" />
 *          <j:icon select="@icon" />
 *          <j:icon select="self::folder" value="icoFolder.gif" />
 *          <j:traverse select="folder" />
 *      </j:bindings>
 *  </j:list>
 * </code>
 * @binding invalidmsg  Determines the error message that is shown when a cell is not valid.
 * @binding description Determines the text that is displayed under the expanded row.
 * @binding template    Determines the template that sets the column definition (for the datagrid) or property definition (for property editor).

 */
jpf.propedit    =
jpf.spreadsheet = 
jpf.datagrid    = jpf.component(jpf.NODE_VISIBLE, function(){
    this.$focussable  = true; // This object can get the focus
    this.multiselect  = true; // Enable MultiSelect
    this.bufferselect = false;
    
    this.startClosed  = true;
    this.animType     = jpf.tween.NORMAL;
    this.animSteps    = 3;
    this.animSpeed    = 20;

    var colspan    = 0, //@todo unused?
        totalWidth = 0, //@todo unused?
        _self      = this,
        curBtn;
    
    this.headings  = [];
    
    //#ifdef __WITH_RENAME
    this.$renameStartCollapse = false;
    //#endif
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif

    /**
     * @attribute {Boolean} cellselect whether this element has selectable rows (false) or selected cells (true). Default is false for j:datagrid and true for j:propedit and j:spreadsheet.
     * @attribute {Boolean} celledit   whether this element has editable cells. This requires cellselect to be true. Default is false for j:datagrid and true for j:propedit and j:spreadsheet.
     * @attribute {Boolean} namevalue  whether each row only contains a name and a value column. Default is false for j:datagrid and j:spreadsheet and true for j:propedit.
     * @attribute {Boolean} iframe     whether this element is rendered inside an iframe. This is only supported for IE. Default is false for j:datagrid and true for j:spreadsheet and j:propedit.
     */
    this.$booleanProperties["cellselect"] = true;
    this.$booleanProperties["celledit"]   = true;
    this.$booleanProperties["namevalue"]  = true;
    this.$booleanProperties["iframe"]     = true;

    /**
     * @attribute {String} template the {@link terms.datainstruction data instruction} 
     * to fetch a template definition of the layout for this component. A template
     * consists of descriptions of columns (or rows for j:propedit) for which
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
     *              <prop select="email" datatype="jpf:email" caption="Email" 
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
    this.$propHandlers["template"] = function(value){
        this.smartBinding = value ? true : false;
        this.namevalue    = true;
        
        this.$initTemplate();
        this.$loaddatabinding();
        
        if (this.bindingRules["traverse"])
            this.parseTraverse(this.bindingRules["traverse"][0]);
    };
    
    this.$initTemplate = function(){
        //#ifdef __WITH_VALIDATION
        if (!this.hasFeature(__VALIDATION__)) {
            this.implement(jpf.Validation);
            
            var vRules = {};
            var rules = ["required", "datatype",
                "pattern", "min", "max", "maxlength", "minlength", "checkequal"];
            
            var ruleContext;
            this.$fValidate = function(){};
            this.$setRule   = function(type, rule){
                var vId = ruleContext.vIds[type];
        
                if (!rule) {
                    if (vId)
                        ruleContext.vRules[vId] = "";
                    return;
                }
        
                if (!vId)
                    ruleContext.vIds[type] = ruleContext.vRules.push(rule) - 1;
                else
                    ruleContext.vRules[vId] = rule;
            }
            
            this.addEventListener("afterrename", function(e){
                if (this.isValid(null, this.selected))
                    this.clearError();
                else
                    this.setError();
            });
            
            this.$propHandlers["required"] = function(value, type){
                if (!type || type == "text")
                    this.$setRule("required", "value.trim().length > 0");
                else
                    this.$setRule("required", "valueNode");
            }
            
            function cacheValidRules(cacheId, nodes){
                var i, j, v, l, r = [], node, type;
                for (j = 0; j < rules.length; j++) {
                    if (_self.bindingRules[rules[j]])
                        r.push(rules[j]);
                }
                var rlength       = r.length;
                var checkRequired = r.contains("required");

                var contexts = [];
                for (i = 0, l = nodes.length; i < l; i++) {
                    node = nodes[i];
                    type = node.getAttribute("type");
                    ruleContext = {
                        xmlNode : node, 
                        select  : node.getAttribute("select"),
                        vIds    : {},
                        vRules  : []
                    };
                    contexts.push(ruleContext);
                    
                    if (type && type != "text") {
                        if (checkRequired) {
                            v = _self.applyRuleSetOnNode("required", node);
                            if (v)
                                _self.$propHandlers["required"].call(_self, v, type);
                        }
                        continue;
                    }
                    
                    for (j = 0; j < rlength; j++) {
                        v = _self.applyRuleSetOnNode(r[j], node);
                        if (v)
                            _self.$propHandlers[r[j]].call(_self, v);
                    }
                }
                
                return contexts;
            }
            
            /**
             * Checks if (part of) the set of element's registered to this element are
             * valid. When an element is found with an invalid value the error state can
             * be set for that element.
             *
             * @param  {Boolean}    [ignoreReq]  whether to adhere to the 'required' check.
             * @param  {Boolean}    [nosetError  whether to not set the error state of the element with an invalid value
             * @param  {JMLElement} [page]           the page for which the children will be checked. When not specified all elements of this validation group will be checked.
             * @return  {Boolean}  specifying whether the checked elements are valid.
             * @method isValid, validate, checkValidity
             */
            this.isValid = function(checkRequired, node){
                if (!this.xmlRoot || !this.xmlData || this.disabled)
                    return true;
                
                var nodes, isValid = true;
                var cacheId = this.xmlRoot.getAttribute(jpf.xmldb.xmlIdTag);
                if (!vRules[cacheId] || !vRules[cacheId].length)
                    vRules[cacheId] = cacheValidRules(cacheId, 
                        (nodes = this.getTraverseNodes()));
                else 
                    nodes = node ? [node] : (nodes || this.getTraverseNodes());

                if (!this.xmlData)
                    return true;

                //#ifdef __WITH_HTML5
                this.validityState.$reset();
                //#endif

                var i, l, isValid = true, rule, node, value, type, valueNode;
                var rules = vRules[cacheId];
                for (i = 0, l = nodes.length; i < l; i++) {
                    node = nodes[i];
                    rule = rules[i];
                    type = node.getAttribute("type");
                    valueNode = this.xmlData.selectSingleNode(jpf.getXmlValue(node, "@select|field/@select"));
                    value = valueNode && (!type || type == "text")
                        ? valueNode.nodeType == 1 ? jpf.getXmlValue(valueNode, '.') : valueNode.nodeValue
                        : "";

                    //#ifdef __WITH_HTML5
                    for (var type in rule.vIds) {
                        if ((type == "required" && checkRequired || value) 
                          && !eval(rule.vRules[rule.vIds[type]])) {
                            this.validityState.$set(type);
                            isValid = false;
                        }
                    }
                    /*#else
                    var isValid = (rule.vRules.length
                        ? eval("!value || (" + rule.vRules.join(") && (") + ")")
                        : true);
                    //#endif */
                    
                    //#ifdef __WITH_HTML5
                    //@todo make this work for non html5 validation
                    if (!isValid) {
                        this.validityState.errorHtml = jpf.xmldb.findHtmlNode(node, this).childNodes[1];
                        this.validityState.errorXml  = node;
                        this.invalidmsg = this.applyRuleSetOnNode("invalidmsg", node);
                        break;
                    }
                    //#endif
                }
                
                /* #ifdef __WITH_XFORMS
                this.dispatchEvent("xforms-" + (isValid ? "valid" : "invalid"));
                #endif*/
                
                //#ifdef __WITH_HTML5
                if (!isValid)
                    this.dispatchEvent("invalid", this.validityState);
                else {
                    this.validityState.valid = true;
                    isValid = true;
                }
                //#endif
                
                return isValid;
            };
            
            var vgroup = jpf.xmldb.getInheritedAttribute(this.$jml, "validgroup");
            if (vgroup)
                this.$propHandlers["validgroup"].call(this, vgroup);
        }
        //#endif
    }

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
            
            if (jpf.isIE)
                (win || window).document.styleSheets[0].addRule(def[i][0],
                    def[i][1]);
            else
                (win || window).document.styleSheets[0].insertRule(def[i][0]
                    + " {" + def[i][1] + "}", 0);
        }
    }
    
    function scrollIntoView(){
        var Q = (this.current || this.$selected);
        var o = this.oInt;
        o.scrollTop = (Q.offsetTop)-21;
    }

    /**** Keyboard Support ****/
    
    // #ifdef __WITH_KEYBOARD
    function keyHandler(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        var selHtml  = this.$selected || this.$indicator;
        
        if (!e.force && (!selHtml || this.renaming)) //@todo how about allowdeselect?
            return;

        var selXml = this.indicator || this.selected;
        var oInt   = useiframe ? this.oDoc.documentElement : this.oInt;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.selectTemp();
            
                this.choose(selHtml);
                break;
            case 32:
                if (ctrlKey || !this.isSelected(this.indicator))
                    this.select(this.indicator, true);
                return false;
            case 109:
            case 46:
                //DELETE
                if (this.disableremove) 
                    return;
                    
                if (this.celledit) {
                    this.rename(this.indicator || this.selected, "");
                    return;
                }
            
                if (this.$tempsel)
                    this.selectTemp();
            
                this.remove(this.mode ? this.indicator : null); //this.mode != "check"
                break;
            case 36:
                //HOME
                this.select(this.getFirstTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = 0;
                return false;
            case 35:
                //END
                this.select(this.getLastTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = this.oInt.scrollHeight;
                return false;
            case 107:
                //+
                if (this.more)
                    this.startMore();
                break;
            case 37:
                //LEFT
                if (this.$tempsel)
                    this.selectTemp();
                    
                if (this.cellselect) {
                    if (lastcell) {
                        if (lastcell.previousSibling) {
                            this.selectCell({target:lastcell.previousSibling}, 
                                this.$selected);
                        }
                    }
                    else {
                        this.selectCell({target:this.$selected.firstChild}, 
                            this.$selected);
                    }
                }
                else if (this.$withContainer)
                    this.slideToggle(this.$indicator || this.$selected, 2)
                return false;
            case 107:
            case 39:
                //RIGHT
                if (this.$tempsel)
                    this.selectTemp();
                    
                if (this.cellselect) {
                    if (lastcell) {
                        if (lastcell.nextSibling) {
                            this.selectCell({target:lastcell.nextSibling}, 
                                this.$selected);
                        }
                    }
                    else {
                        this.selectCell({target:this.$selected.firstChild}, 
                            this.$selected);
                    }
                }
                else if (this.$withContainer)
                    this.slideToggle(this.$indicator || this.$selected, 1)
                    
                return false;
            case 38:
                //UP
                if (!selXml && !this.$tempsel) 
                    return false;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;

                var margin    = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                var items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, false, items);
                if (node)
                    this.setTempSelected(node, ctrlKey, shiftKey);
                else return false;

                selHtml = jpf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop <= oInt.scrollTop) {
                    oInt.scrollTop = (Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                      ? 0
                      : selHtml.offsetTop - margin[0])
                        - parseInt(jpf.getStyle(oInt, jpf.isIE 
                            ? "paddingTop" 
                            : "padding-top"));
                }
                return false;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel) 
                    return false;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin    = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                var items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, true, items);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return false;
                
                selHtml = jpf.xmldb.findHtmlNode(node, this);
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
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin     = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScrollY = oInt.scrollHeight > oInt.offsetHeight;
                var hasScrollX = oInt.scrollWidth > oInt.offsetWidth;
                var items      = Math.floor((oInt.offsetWidth
                    - (hasScrollY ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3])) || 1;
                var lines      = Math.floor((oInt.offsetHeight
                    - (hasScrollX ? 15 : 0)) / (selHtml.offsetHeight
                    + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(node, false, items * lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return false;
                
                selHtml = jpf.xmldb.findHtmlNode(node, this);
                if (selHtml.offsetTop < oInt.scrollTop) {
                    oInt.scrollTop = (Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                      ? 0
                      : selHtml.offsetTop - margin[0]) 
                        - parseInt(jpf.getStyle(oInt, jpf.isIE 
                            ? "paddingTop" 
                            : "padding-top"));
                }
                return false;
            case 34:
                //PGDN
                if (!selXml && !this.$tempsel) 
                    return false;

                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin     = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScrollY = oInt.scrollHeight > oInt.offsetHeight;
                var hasScrollX = oInt.scrollWidth > oInt.offsetWidth;
                var items      = Math.floor((oInt.offsetWidth - (hasScrollY ? 15 : 0))
                    / (selHtml.offsetWidth + margin[1] + margin[3])) || 1;
                var lines      = Math.floor((oInt.offsetHeight - (hasScrollX ? 15 : 0))
                    / (selHtml.offsetHeight + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(selXml, true, items * lines);
                if (!node)
                    node = this.getLastTraverseNode();
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return false;
                
                selHtml = jpf.xmldb.findHtmlNode(node, this);
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
                        v = this.applyRuleSetOnNode("caption", nodes[i]);
                        if (v && v.substr(0, this.lookup.str.length)
                          .toUpperCase() == this.lookup.str) {
                            
                            if (!this.isSelected(nodes[i])) {
                                if (this.mode == "check")
                                    this.setIndicator(nodes[i]);
                                else
                                    this.select(nodes[i]);
                            }
                            
                            if (selHtml)
                                this.oInt.scrollTop = selHtml.offsetTop
                                    - (this.oInt.offsetHeight
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
    
    this.addEventListener("keydown", keyHandler, true);
    // #endif
    
    /**** Focus ****/
    // Too slow for IE
    
    this.$focus = function(){
        if (!this.oExt || (jpf.isIE && useiframe && this.cssfix)) //@todo fix this by fixing focussing for this component
            return;

        this.$setStyleClass(this.oFocus || this.oExt, this.baseCSSname + "Focus");
        
        if (this.oDoc)
            this.$setStyleClass(this.oDoc.documentElement, this.baseCSSname + "Focus");
    };

    this.$blur = function(){
        //#ifdef __WITH_RENAME
        if (this.renaming)
            this.stopRename(null, true);
        //#endif

        if (!this.oExt || (jpf.isIE && useiframe && this.cssfix)) //@todo fix this by fixing focussing for this component
            return;

        this.$setStyleClass(this.oFocus || this.oExt, "", [this.baseCSSname + "Focus"]);
        
        if (this.oDoc)
            this.$setStyleClass(this.oDoc.documentElement, "", [this.baseCSSname + "Focus"]);
    };
    
    /**** Private methods ****/
    
    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r = [];
        var nodes = this.getTraverseNodes();
        for(var f=false,i=0;i<nodes.length;i++){
            if(nodes[i] == xmlStartNode) f = true;
            if(f) r.push(nodes[i]);
            if(nodes[i] == xmlEndNode) f = false;
        }
        
        if (!r.length || f) {
            r = [];
            for (var f = false, i = nodes.length - 1; i >= 0; i--) {
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
        
        //var id = htmlNode.getAttribute(jpf.xmldb.htmlIdTag); // unused?
        var container = htmlNode.nextSibling;

        if (jpf.getStyle(container, "display") == "block") {
            if (force == 1) return;
            htmlNode.className = htmlNode.className.replace(/min/, "plus");
            this.slideClose(container, jpf.xmldb.getNode(htmlNode));
        }
        else {
            if (force == 2) return;
            htmlNode.className = htmlNode.className.replace(/plus/, "min");
            this.slideOpen(container, jpf.xmldb.getNode(htmlNode));
        }
    };
    
    var lastOpened = {};
    /**
     * @private
     */
    this.slideOpen = function(container, xmlNode){
        var htmlNode = jpf.xmldb.findHtmlNode(xmlNode, this);
        if (!container)
            container = htmlNode.nextSibling;

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode)
            var p     = (pNode || this.xmlRoot).getAttribute(jpf.xmldb.xmlIdTag);
            if (lastOpened[p] && lastOpened[p][1] != xmlNode 
              && this.getTraverseParent(lastOpened[p][1]) == pNode) 
                this.slideToggle(lastOpened[p][0], 2);//lastOpened[p][1]);
            lastOpened[p] = [htmlNode, xmlNode];
        }
        
        container.style.display = "block";

        jpf.tween.single(container, {
            type    : 'scrollheight', 
            from    : 0, 
            to      : container.scrollHeight, 
            anim    : this.animType, 
            steps   : this.animSteps,
            interval: this.animSpeed,
            onfinish: function(container){
                if (xmlNode && _self.$hasLoadStatus(xmlNode, "potential")) {
                    setTimeout(function(){
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
                .getAttribute(jpf.xmldb.xmlIdTag);
            lastOpened[p] = null;
        }
        
        container.style.height   = container.offsetHeight;
        container.style.overflow = "hidden";

        jpf.tween.single(container, {
            type    : 'scrollheight', 
            from    : container.scrollHeight, 
            to      : 0, 
            anim    : this.animType, 
            steps   : this.animSteps,
            interval: this.animSpeed,
            onfinish: function(container, data){
               container.style.display = "none";
            }
        });
    };
    
    this.$findContainer = function(htmlNode) {
        var node = htmlNode.nextSibling;
        if (!node) return htmlNode;
        return node.nodeType == 1 ? node : node.nextSibling;
    };
    
    /**** Databinding ****/
    
    var headings = [], cssRules = []; //@todo Needs to be reset
    this.$loaddatabinding = function(){
        if (!this.bindingRules)
            this.bindingRules = {};
        
        //Set Up Headings
        var heads = this.bindingRules.column;
        if (this.namevalue && !heads) {
            this.bindingRules.column = heads = [];

            var cols = (this.columns || this.$jml.getAttribute("columns")
                || "50%,50%").splitSafe(",");
            
            //@todo ask rik how this can be cached
            //@todo get xmlUpdate to be called only once per document update for propedit
            var xml = 
              jpf.getXml('<j:root xmlns:j="' + jpf.ns.jpf + '">\
                <j:column caption="Property" width="' + cols[0] + '"><![CDATA[[%($"@caption" + ($"@required" ? " *" : ""));]]]></j:column>\
                <j:column caption="Value" width="' + cols[1] + '" css="' + this.baseCSSname + '_{@type}{@multiple}"><![CDATA[[\
                    var dg = jpf.lookup(' + this.uniqueId + ');\
                    var select = $"@select";\
                    var type = $"@type";\
                    if (type == "set") {\
                        var output = [], sep = $"@separator" || ", ";\
                        var z = n;\
                        if ($"@mask")\
                            %$"@mask";\
                        else {\
                            n = dg.xmlData;\
                            foreach(select) {\
                                var v = n.nodeValue || $".";\
                                n = z;\
                                output.push(value(\'item[@value="\' + v + \'"]\'));\
                            }\
                            %output.join(sep);\
                        }\
                    }\
                    else if (type == "dropdown") {\
                        var v = jpf.getXmlValue(dg.xmlData, select);\
                        %value("item[@value=\'" + v + "\']");\
                    }\
                    else if (type == "lookup" && $"@multiple" == "multiple"){\
                        ]<div class="newitem"> </div>[\
                        var vs = $"@descfield";\
                        if (vs) {\
                            n = dg.xmlData;\
                            foreach(select) {]\
                                <div class="item"><i onclick="jpf.lookup(' + this.uniqueId + ').$removePropItem(\'[%value(vs).replace(/\'/g, "\\\\\'").replace(/"/g, "&amp;quot;");]\')">x</i>[%value(vs)]</div>\
                            [}\
                        }\
                        else {\
                            var total = dg.xmlData.selectNodes(select).length;\
                            if (total){\
                                %("[" + total + " " + $"@caption" + "]");\
                            }\
                        }]\
                    [}\
                    else if (type == "children") {\
                        var vs = $"@descfield";\
                        if (vs) {\
                            local(dg.xmlData.selectSingleNode(select)){\
                                foreach("node()[local-name()]"){]\
                                    <div class="item"><i onclick="jpf.lookup(' + this.uniqueId + ').$removePropItem(\'[%value(vs).replace(/\'/g, "\\\\\'").replace(/"/g, "&amp;quot;");]\', \'node()\')">x</i>[%value(vs)]</div>\
                                [}\
                            }\
                        }\
                        else {\
                            var total = dg.xmlData.selectNodes(select + "/node()").length;\
                            if (total){\
                                %("[" + total + " " + $"@caption" + "]");\
                            }\
                        }\
                    }\
                    else if (type == "lookup") {\
                        var vs = $"@descfield";\
                        if ($"@multiple" == "single")\
                            vs = "node()/" + vs;\
                        %jpf.getXmlValue(dg.xmlData, select + (vs ? "/" + vs : ""));\
                    }\
                    else if (type == "custom") {\
                        var sep = $"@separator" || "";\
                        var v, output = [];\
                        foreach("field"){\
                            v = jpf.getXmlValue(dg.xmlData, $"@select");\
                            if (v) output.push(v);\
                        }\
                        if ($"@mask")\
                            output.push($"@mask");\
                        else if (!output.length && select)\
                            output.push(jpf.getXmlValue(dg.xmlData, select));\
                        %output.join(sep);\
                    }\
                    else {\
                        %jpf.getXmlValue(dg.xmlData, select);\
                    }\
                ]]]></j:column>\
                <j:traverse select="property|prop" />\
                <j:required select="self::node()/@required" />\
                <j:datatype select="@datatype" />\
                <j:pattern><![CDATA[[\
                    var validate;\
                    if ((validate = $"@decimals"))\
                        %("/\\.\\d{" + validate + "}/");\
                    else if ((validate = $"@validate") && validate.chartAt(0) == "/")\
                        %("/" + validate.replace(/^\\/|\\/$/g, "") + "/");\
                ]]]></j:pattern>\
                <j:maxlength select="@maxlength" />\
                <j:invalidmsg><![CDATA[[\
                     out = $"@invalidmsg" || "Invalid entry;Please correct your entry";\
                ]]]></j:invalidmsg>\
              </j:root>');
              <!-- mask -->
            
            //<j:select select="self::node()[not(@frozen)]" />\
            
            if (!this.$removePropItem) {
                this.$removePropItem = function(value, xpath){
                    var xmlNode = this.xmlData.selectSingleNode(
                        this.selected.getAttribute("select") 
                      + (xpath ? "/" + xpath : "") + "["
                      + (value
                        ? this.selected.getAttribute("descfield") + "=concat('', '" 
                          + value.split("'").join("',\"'\",'") + "')"
                        : "string-length(" + this.selected.getAttribute("descfield") + ") = 0")
                      + "]");
                     
                    this.getActionTracker().execute({
                        action : "removeNode",
                        args   : [xmlNode]
                    });
                }
            }
            
            var nodes = xml.childNodes;
            for (var i = 0; i < nodes.length; i++) {
                var tagName = nodes[i][jpf.TAGNAME];
                (this.bindingRules[tagName]
                    || (this.bindingRules[tagName] = [])).push(nodes[i]);
            }
        }
        
        //#ifdef __DEBUG
        if (!heads) {
            throw new Error(jpf.formatErrorString(0, this,
                "Parsing bindings jml",
                "No column definition found"));
        }
        //#endif
        
        //@todo This should support multiple color rules, by inserting the rules at the right place.
        if (this.bindingRules && this.bindingRules.color) {
            var clr = this.bindingRules.color[0];
            jpf.setStyleRule("." + this.baseCSSname + (jpf.isIE
                ? " .records .highlight SPAN"
                : " .records .highlight span"), "color", clr.getAttribute("text"), null, this.oWin);
            jpf.setStyleRule("." + this.baseCSSname + (jpf.isIE
                ? " .records .highlight SPAN"
                : " .records .highlight span"), "backgroundColor", clr.getAttribute("row"), null, this.oWin);
            jpf.setStyleRule("." + this.baseCSSname + (jpf.isIE
                ? " .records .highlight"
                : " .records .highlight"), "backgroundColor", clr.getAttribute("row"), null, this.oWin);
            /*jpf.importCssString(document, 
                "." + this.baseCSSname + " .records div.highlight{background-color:" 
                + clr.getAttribute("row") + ";} ." 
                + this.baseCSSname + " .records div.highlight span{color:" 
                + clr.getAttribute("text") + ";}");*/
        }
        
        var found, options, xml, width, h, fixed = 0, oHead, hId, nodes = [];
        for (var i = 0; i < heads.length; i++) {
            xml     = heads[i];
            width   = xml.getAttribute("width") || defaultwidth;
            options = xml.getAttribute("options") || this.options || 
                ("spreadsheet|propedit".indexOf(_self.tagName) > -1
                    ? "size"
                    : "sort|size|move");

            /**
             * @private
             */
            h = {
                width        : parseFloat(width),
                isPercentage : width.indexOf("%") > -1,
                xml          : xml, //possibly optimize by recording select attribute only
                select       : xml.getAttribute("select"),
                caption      : xml.getAttribute("caption") || "",
                icon         : xml.getAttribute("icon"),
                sortable     : options.indexOf("sort") > -1,
                resizable    : options.indexOf("size") > -1,
                movable      : options.indexOf("move") > -1,
                type         : xml.getAttribute("type"),
                colspan      : xml.getAttribute("span") || 1, //currently not supported
                align        : xml.getAttribute("align") || "left",
                className    : "col" + this.uniqueId + i,
                css          : xml.getAttribute("css")
            };
            
            hId = headings.push(h) - 1;
            
            //#ifdef __DEBUG
            if (!h.width)
                throw new Error("missing width"); //temporary check
            //#endif
            
            if (!h.isPercentage)
                fixed += parseFloat(h.width) || 0;
            else 
                found = true;
            
            //Set css
            cssRules.push(["." + this.baseCSSname + " .headings ." + h.className, 
                "width:" + h.width + (h.isPercentage ? "%;" : "px;")
                + "text-align:" + h.align]);
            cssRules.push(["." + this.baseCSSname + " .records ." + h.className, 
                "width:" + h.width + (h.isPercentage ? "%;" : "px;")
                + "text-align:" + h.align]);
                
            //Add to htmlRoot
            this.$getNewContext("headitem");
            oHead = this.$getLayoutNode("headitem");
            oHead.setAttribute("class", h.className);
            oHead.setAttribute("hid", hId);
    
            var hCaption = this.$getLayoutNode("headitem", "caption");
            if(h.icon){
                h.sortable = false;
                oHead.setAttribute("style", "background-image:url("
                    + jpf.getAbsolutePath(this.iconPath, h.icon) 
                    +")");
                hCaption.nodeValue = "&nbsp;";
            }
            else
                hCaption.nodeValue = h.caption;

            //nodes.push(oHead);
            h.htmlNode = jpf.xmldb.htmlImport(oHead, this.oHead);
        }
        
        //jpf.xmldb.htmlImport(nodes, this.oHead);

        if (!found) { //@todo removal???
            this.$isFixedGrid = true;
            this.$setStyleClass(this.oExt, "fixed");
            
            if (useiframe)
                this.$setStyleClass(this.oDoc.documentElement, "fixed");
        }

        if (fixed > 0 && !this.$isFixedGrid) {
            var vLeft = fixed + 5;
            
            //first column has total -1 * fixed margin-left. - 5
            //cssRules[0][1] += ";margin-left:-" + vLeft + "px;";
            //cssRules[1][1] += ";margin-left:-" + vLeft + "px;";
            cssRules.push([".row" + this.uniqueId, "padding-right:" + vLeft 
                + "px;margin-right:-" + vLeft + "px"]);
        
            //headings and records have same padding-right
            this.oInt.style.paddingRight  =
            this.oHead.style.paddingRight = vLeft + "px";
        }
        
        this.$fixed = fixed;
        this.$first = 0;

        this.$withContainer = this.bindingRules && this.bindingRules.description;

        //Activate CSS Rules
        importStylesheet(cssRules, window);
        
        if (useiframe)
            importStylesheet(cssRules, this.oWin);
    };
    
    this.$unloaddatabinding = function(){
        //@todo
        /*var headParent = this.$getLayoutNode("main", "head", this.oExt);
        for(var i=0;i<headParent.childNodes.length;i++){
            headParent.childNodes[i].host = null;
            headParent.childNodes[i].onmousedown = null;
            headParent.childNodes[i].$isSizingColumn = null;
            headParent.childNodes[i].$isSizeableColumn = null;
            headParent.childNodes[i].onmousemove = null;
            headParent.childNodes[i].onmouseup = null;
            headParent.childNodes[i].ondragmove = null;
            headParent.childNodes[i].ondragstart = null;
            headParent.childNodes[i].onclick = null;
            headParent.childNodes[i].ondblclick = null;
        }
        
        this.oInt.onscroll = null;
        
        jpf.removeNode(this.oDragHeading);
        this.oDragHeading = null;
        jpf.removeNode(this.oSplitter);
        this.oSplitter = null;
        jpf.removeNode(this.oSplitterLeft);
        this.oSplitterLeft = null;
        
        headParent.innerHTML = "";
        totalWidth = 0;
        this.headings = [];*/
    };

    this.nodes = [];
    this.$add = function(xmlNode, sLid, xmlParentNode, htmlParentNode, beforeNode){
        //Build Row
        this.$getNewContext("row");
        var oRow = this.$getLayoutNode("row");
        oRow.setAttribute("id", sLid);
        oRow.setAttribute("class", "row" + this.uniqueId);//"width:" + (totalWidth+40) + "px");
        oRow.setAttribute("onmousedown", 'var o = jpf.lookup(' + this.uniqueId + ');\
            var wasSelected = o.$selected == this;\
            o.select(this, event.ctrlKey, event.shiftKey);'
            + (this.cellselect || this.namevalue ? 'o.selectCell(event, this, wasSelected);' : ''));//, true;o.dragging=1;
        oRow.setAttribute("ondblclick", 'var o = jpf.lookup(' + this.uniqueId + ');o.choose();'
            + (this.$withContainer ? 'o.slideToggle(this);' : '')
            + (this.celledit && !this.namevalue ? 'o.startRename();' : ''));//, true;o.dragging=1;
        //oRow.setAttribute("onmouseup", 'var o = jpf.lookup(' + this.uniqueId + ');o.select(this, event.ctrlKey, event.shiftKey);o.dragging=false;');
        
        //Build the Cells
        for(var c, h, i = 0; i < headings.length; i++){
            h = headings[i];
            
            this.$getNewContext("cell");
            
            if (h.css)
                jpf.setStyleClass(this.$getLayoutNode("cell"), jpf.JsltInstance.apply(h.css, xmlNode));

            if (h.type == "icon"){
                var node = this.$getLayoutNode("cell", "caption",
                    oRow.appendChild(this.$setStyleClass(this.$getLayoutNode("cell"),
                    h.className)));
                jpf.xmldb.setNodeValue(node, "&nbsp;");
                (node.nodeType == 1 && node || node.parentNode)
                    .setAttribute("style", "background-image:url(" 
                        + jpf.getAbsolutePath(this.iconPath, 
                            this.applyRuleSetOnNode([h.xml], xmlNode)) 
                        + ")");
            }
            else {
                jpf.xmldb.setNodeValue(this.$getLayoutNode("cell", "caption",
                    oRow.appendChild(this.$setStyleClass(this.$getLayoutNode("cell"), h.className))),
                    (this.applyRuleSetOnNode([h.xml], xmlNode) || "").trim() || ""); //@todo for IE but seems not a good idea
            }
        }
        
        if (this.bindingRules && this.bindingRules.color) {
            var colorRule = this.getNodeFromRule("color", xmlNode, false, true);
            this.$setStyleClass(oRow, colorRule ? "highlight" : null, colorRule ? ["highlight"] : null);
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(oRow, cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        // #endif

        //return jpf.xmldb.htmlImport(oRow, htmlParentNode || this.oInt, beforeNode);
        if (htmlParentNode)
            jpf.xmldb.htmlImport(oRow, htmlParentNode, beforeNode);
        else
            this.nodes.push(oRow);
        
        if (this.$withContainer) {
            var desc = this.applyRuleSetOnNode("description", xmlNode);
            this.$getNewContext("container");
            var oDesc = this.$getLayoutNode("container");
            jpf.xmldb.setNodeValue(this.$getLayoutNode("container", "container",
                oDesc), desc);
            oDesc.setAttribute("class", (oDesc.getAttribute("class") || "")
                + " row" + this.uniqueId);
            
            if(htmlParentNode) 
                jpf.xmldb.htmlImport(oDesc, htmlParentNode, beforeNode);
            else 
                this.nodes.push(oDesc);
        }
    };
    
    var useTable = false;
    this.$fill = function(nodes){
        if (useiframe)
            this.pHtmlDoc = this.oDoc;

        if (useTable) {
            jpf.xmldb.htmlImport(this.nodes, this.oInt, null,
                 "<table class='records' cellpadding='0' cellspacing='0'><tbody>", 
                 "</tbody></table>");
        }
        else {
            jpf.xmldb.htmlImport(this.nodes, this.oInt);
        }

        this.nodes.length = 0;
    };

    this.$deInitNode = function(xmlNode, htmlNode){
        if (this.$withContainer)
            htmlNode.parentNode.removeChild(htmlNode.nextSibling);
        
        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    };
    
    this.$updateNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;
        
        var nodes     = this.oHead.childNodes,
            htmlNodes = htmlNode.childNodes,
            node;
        
        var p;
        if (!this.namevalue && curBtn) {
            p = curBtn.parentNode;
        }
        
        for (var i = this.namevalue ? 1 : 0, l = nodes.length; i < l; i++) {
            h = headings[nodes[i].getAttribute("hid")];
            
            //@todo fake optimization
            node = this.$getLayoutNode("cell", "caption", htmlNodes[i]) || htmlNodes[i];//htmlNodes[i].firstChild || 
            
            if (h.type == "icon") {
                (node.nodeType == 1 && node || node.parentNode)
                    .style.backgroundImage = "url(" 
                        + jpf.getAbsolutePath(this.iconPath, 
                            this.applyRuleSetOnNode([h.xml], xmlNode))
                        + ")";
            }
            else {
                node.innerHTML = (this.applyRuleSetOnNode([h.xml], xmlNode)
                    || "").trim() || ""; //@todo for IE but seems not a good idea
                //jpf.xmldb.setNodeValue(node, 
                    //this.applyRuleSetOnNode([h.xml], xmlNode));
            }
        }
        
        if (!this.namevalue && p)
            p.appendChild(curBtn);
        
        //return; //@todo fake optimization
        
        if (this.bindingRules && this.bindingRules.color) {
            var colorRule = this.getNodeFromRule("color", xmlNode, false, true);
            this.$setStyleClass(htmlNode, colorRule ? "highlight" : null, colorRule ? ["highlight"] : null);
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass || this.dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass))
                this.dynCssClasses.push(cssClass);
        }
        // #endif
        
        if (this.$withContainer) {
            htmlNode.nextSibling.innerHTML 
                = this.applyRuleSetOnNode("description", xmlNode) || "";
        }
    };
    
    this.$moveNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;
        var oPHtmlNode = htmlNode.parentNode;
        var beforeNode = xmlNode.nextSibling 
            ? jpf.xmldb.findHtmlNode(this.getNextTraverse(xmlNode), this)
            : null;

        oPHtmlNode.insertBefore(htmlNode, beforeNode);
        
        //if(this.emptyMessage && !oPHtmlNode.childNodes.length) this.setEmpty(oPHtmlNode);
    };
    
    this.$selectDefault = function(XMLRoot){
        this.select(XMLRoot.selectSingleNode(this.traverse), null, null, null, true);
    };
    
    var lastcell, lastcol = 0, lastrow;
    /**
     * Returns a column definition object based on the column number.
     * @param {Number} hid the heading number; this number is based on the sequence of the j:column elements.
     */
    this.getColumn = function(nr){
        return headings[nr || lastcol || 0];
    }
    
    /**
     * @private
     */
    this.selectCell = function(e, rowHtml, wasSelected) {
        var htmlNode = e.srcElement || e.target;
        if (htmlNode == rowHtml || !jpf.xmldb.isChildOf(rowHtml, htmlNode))
            return; //this is probably not good
        
        while (htmlNode.parentNode != rowHtml)
            htmlNode = htmlNode.parentNode;

        var type = this.selected.getAttribute("type");

        if (this.namevalue && wasSelected && lastcell 
          && lastcell.parentNode == htmlNode.parentNode 
          && htmlNode == htmlNode.parentNode.lastChild) {
            lastcell = htmlNode;
            lastcol  = 1;
            
            if (this.namevalue 
              && type == "lookup" 
              && this.selected.getAttribute("multiple") == "multiple") {
                if ((e.srcElement || e.target).className.indexOf("newitem") == -1)
                    return;
            }

            // #ifdef __WITH_RENAME            
            this.startDelayedRename(e, 1);
            // #endif

            return;
        }
        
        if (lastcell == htmlNode)
            return;
            
        if (lastcell && lastcell.parentNode && lastcell.parentNode.nodeType == 1) {
            if (this.namevalue) {
                jpf.setStyleClass(lastcell.parentNode.childNodes[0], "", ["celllabel"]);
                jpf.setStyleClass(lastcell.parentNode.childNodes[1], "", ["cellselected"]);
            }
            else {
                jpf.setStyleClass(lastcell, "", ["cellselected"]);
            }
        }

        var col = jpf.xmldb.getChildNumber(htmlNode);
        var h   = headings[this.oHead.childNodes[col].getAttribute("hid")];

        if (this.namevalue || h.type == "dropdown") {
            if (this.namevalue) {
                jpf.setStyleClass(htmlNode.parentNode.childNodes[0], "celllabel");
                jpf.setStyleClass(htmlNode.parentNode.childNodes[1], "cellselected");
                
                var type     = this.selected.getAttribute("type");
                var multiple = this.selected.getAttribute("multiple") == "multiple";
            }
            else {
                var type     = h.type;
                var multiple = false;

                jpf.setStyleClass(htmlNode, "cellselected");
            }
            
            if (jpf.popup.isShowing(this.uniqueId))
                jpf.popup.forceHide();
            
            if (curBtn && curBtn.parentNode)
                curBtn.parentNode.removeChild(curBtn);
            
            if (type && type != "text" && (type != "lookup" || !multiple)) {
                if (type == "set") 
                    type = "dropdown";
                if (type != "lookup") {
                    curBtn = editors[type] || editors["custom"];
                    if (curBtn) {
                        if (this.namevalue)
                            htmlNode.parentNode.appendChild(curBtn);
                        else
                            htmlNode.firstChild.appendChild(curBtn);
                        curBtn.style.display = "block"; //@todo see why only showing this onfocus doesnt work in IE
                    }
                }
            }
        }
        else {
            jpf.setStyleClass(htmlNode, "cellselected");
            
            if (jpf.popup.isShowing(this.uniqueId))
                jpf.popup.forceHide();
            
            if (curBtn && curBtn.parentNode)
                curBtn.parentNode.removeChild(curBtn);
        }
        
        lastcell = htmlNode;
        lastcol  = col;
        lastrow  = rowHtml;
        
        // #ifdef __WITH_RENAME
        /*if (this.namevalue && this.hasFocus() 
          && (!type || type == "text" || type == "lookup") 
          && htmlNode == htmlNode.parentNode.childNodes[1])
            this.startDelayedRename(e, 1);*/
        // #endif
    };

    /**** Drag & Drop ****/
    
    // #ifdef __WITH_DRAGDROP
    this.$showDragIndicator = function(sel, e){
        var x = e.offsetX;
        var y = e.offsetY;

        this.oDrag.startX = x;
        this.oDrag.startY = y;

        document.body.appendChild(this.oDrag);
        //this.$updateNode(this.selected, this.oDrag); // Solution should be found to have this on conditionally
        
        return this.oDrag;
    };
    
    this.$hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    };
    
    this.$moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX) + "px";// - this.oDrag.startX
        this.oDrag.style.top  = (e.clientY + 15) + "px";// - this.oDrag.startY
    };

    this.$initDragDrop = function(){
        if (!this.$hasLayoutNode("dragindicator")) return;

        this.oDrag = jpf.xmldb.htmlImport(this.$getLayoutNode("dragindicator"),
            document.body);
        
        this.oDrag.style.zIndex   = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor   = "default";
        this.oDrag.style.display  = "none";
    };

    /**
     * @private
     */
    this.$findValueNode = function(el){
        if (!el) return null;

        while(el && el.nodeType == 1 
          && !el.getAttribute(jpf.xmldb.htmlIdTag)) {
            el = el.parentNode;
        }

        return (el && el.nodeType == 1 && el.getAttribute(jpf.xmldb.htmlIdTag)) 
            ? el 
            : null;
    };

    this.$dragout = function(dragdata){
        if (this.lastel)
            this.$setStyleClass(this.lastel, "", ["dragDenied", "dragInsert",
                "dragAppend", "selected", "indicate"]);
        this.$setStyleClass(this.$selected, "selected", ["dragDenied",
            "dragInsert", "dragAppend", "indicate"]);
        
        this.lastel = null;
    };

    this.$dragover = function(el, dragdata, extra){
        if(el == this.oExt) return;

        this.$setStyleClass(this.lastel || this.$selected, "", ["dragDenied",
            "dragInsert", "dragAppend", "selected", "indicate"]);
        
        this.$setStyleClass(this.lastel = this.$findValueNode(el), extra 
            ? (extra[1] && extra[1].getAttribute("action") == "insert-before" 
                ? "dragInsert" 
                : "dragAppend") 
            : "dragDenied");
    };

    this.$dragdrop = function(el, dragdata, extra){
        this.$setStyleClass(this.lastel || this.$selected,
            !this.lastel && (this.$selected || this.lastel == this.$selected) 
                ? "selected" 
                : "", 
                ["dragDenied", "dragInsert", "dragAppend", "selected", "indicate"]);
        
        this.lastel = null;
    };
    // #endif

    /**** Lookup ****/

    /*
        <prop select="author" descfield="name" datatype="lookupkey" 
          caption="Author" description="Author id" overview="overview" 
          maxlength="10" type="lookup" foreign_table="author" />
    */
    /** 
     * @private
     */
    this.stopLookup = function(propNode, dataNode){
        if (!dataNode)
            return;
        
        this.stopRename();
        
        var multiple = propNode.getAttribute("multiple"),
            select   = propNode.getAttribute("select");

        var oldNode = this.xmlData.selectSingleNode(select 
          + (multiple == "single" ? "/node()" : ""));
        var newNode = jpf.xmldb.copyNode(dataNode);

        if (multiple != "multiple") {
            var tagName;
            
            var s = select.split("/");
            if ((tagName = s.pop()).match(/^@|^text\(\)/)) 
                tagName = s.pop();
            select = s.join("/") || null;
            
            if (tagName && tagName != newNode.tagName) {
                newNode = jpf.xmldb.integrate(newNode, 
                    newNode.ownerDocument.createElement(tagName));
            }
            
            //@todo this should become the change action
            var changes = [];
            if (oldNode) {
                changes.push({
                    func : "removeNode",
                    args : [oldNode]
                });
            }

            changes.push({
                func : "appendChild",
                args   : [this.xmlData, newNode, null, null, select]
            });
            
            this.getActionTracker().execute({
                action : "multicall",
                args   : changes
            });
        }
        else {
            if (multiple) {
                if (multiple != "single") {
                    var s = select.split("/");
                    if (s.pop().match(/^@|^text\(\)/)) s.pop();
                    select = s.join("/");
                }
            }
            else 
                select = null;

            if (!this.xmlData.selectSingleNode(select + "/" 
              + newNode.tagName + "[@id='" + newNode.getAttribute("id") + "']")) {
                //@todo this should become the change action
                this.getActionTracker().execute({
                    action : "appendChild",
                    args   : [this.xmlData, newNode, null, null, select]
                });
            }
        }
        
        if (jpf.popup.isShowing(this.uniqueId))
            jpf.popup.hide();
    };

    this.$lookup = function(value, isMultiple){
        var oHtml = this.$selected.childNodes[this.namevalue ? 1 : lastcol];

        if (this.dispatchEvent("beforelookup", {
            value    : value,
            xmlNode  : this.selected,
            htmlNode : oHtml
        }) === false)
            return;
        
        var oContainer = editors["dropdown_container"];
        if (self[this.lookupjml].childNodes.length
          && self[this.lookupjml].childNodes[0].parentNode != oContainer) {
            self[this.lookupjml].detach();
            oContainer.innerHTML = "";
        }
        
        var lookupJml = self[this.lookupjml].render(oContainer);
        
        if (!jpf.popup.isShowing(this.uniqueId)) {
            var mirrorNode = oHtml;
            //this.$setStyleClass(oContainer, mirrorNode.className);
            //oContainer.style.height = "auto";
            oContainer.className     = "ddjmlcontainer";
            oContainer.style.display = "block";
            var height = oContainer.scrollHeight;
            oContainer.style.display = "none";
            /*oContainer.style[jpf.supportOverflowComponent 
                ? "overflowY"
                : "overflow"] = "hidden";*/

            var widthdiff = jpf.getWidthDiff(oContainer);
            jpf.popup.show(this.uniqueId, {
                x       : -1,
                y       : (isMultiple ? mirrorNode.firstChild.firstChild.offsetHeight : mirrorNode.offsetHeight) - 1,
                animate : true,
                ref     : mirrorNode,
                width   : mirrorNode.offsetWidth - widthdiff + 4, //Math.max(self[this.lookupjml].minwidth, 
                height  : height,
                callback: function(){
                    oContainer.style.height = "auto";
                    /*oContainer.style[jpf.supportOverflowComponent 
                        ? "overflowY"
                        : "overflow"] = "auto";*/
                }
            });
        }
        
        this.selected.setAttribute("j_lastsearch", value);
        
        this.dispatchEvent("afterlookup", {
            value    : value,
            xmlNode  : this.selected,
            htmlNode : oHtml,
            nodes    : lookupJml
        });
    };

    /**** Rename ****/
    
    this.$getCaptionElement = function(){
        if (this.namevalue) {
            var type = this.selected.getAttribute("type");
            if (type && type != "text") {
                if (type == "lookup") {
                    this.$autocomplete = true;
                    var isMultiple = this.selected.getAttribute("multiple") == "multiple";
                    this.$lookup(this.selected.getAttribute("j_lastsearch") || "", isMultiple);
                }
                else
                    return;
            }
            else {
                this.$autocomplete = false;
            }
        }
        else {
            var h = headings[this.oHead.childNodes[lastcol || 0].getAttribute("hid")];
            if (h.type == "dropdown")
                return;
        }
        
        var node = this.$getLayoutNode("cell", "caption", this.namevalue
            ? lastcell.parentNode.childNodes[1]
            : lastcell);
        
        if (this.namevalue && type == "lookup" && isMultiple)
            node = node.firstChild;
        
        return node.nodeType == 1 && node || node.parentNode;
    };
    
    var lastCaptionCol = null;
    this.$getCaptionXml = function(xmlNode){
        if (this.namevalue) {
            /*
                this.createModel
                ? jpf.xmldb.createNodeFromXpath(this.xmlData, this.selected.getAttribute("select"))
                : 
            */
            return this.xmlData.selectSingleNode(this.selected.getAttribute("select")) ||
              this.selected.getAttribute("lookup") && jpf.getXml("<stub />");
        }
        
        var h = headings[this.oHead.childNodes[lastcol || 0].getAttribute("hid")];
        lastCaptionCol = lastcol || 0;
        return xmlNode.selectSingleNode(h.select || ".");
    };
    
    /** 
     * @private
     */
    var $getSelectFromRule = this.getSelectFromRule;
    this.getSelectFromRule = function(setname, cnode){
        if (setname == "caption") {
            if (this.namevalue) {
                var sel = cnode.getAttribute("select");
                return [sel, this.createModel
                    ? jpf.xmldb.createNodeFromXpath(this.xmlData, sel)
                    : this.xmlData.selectSingleNode(sel)];
            }
            
            var h = headings[this.oHead.childNodes[lastCaptionCol !== null 
                ? lastCaptionCol 
                : (lastcol || 0)].getAttribute("hid")];
            lastCaptionCol = null;
            return [h.select];
        }
        
        return $getSelectFromRule.apply(this, arguments);
    };
    
    //#ifndef __PACKAGED
    if (this.tagName == "spreadsheet") {
        var binds = {};
        
        /** 
         * @private
         */
        var $applyRuleSetOnNode = this.applyRuleSetOnNode;
        this.applyRuleSetOnNode = function(setname, cnode, def){
            var value = $applyRuleSetOnNode.apply(this, arguments);
            if (typeof value == "string" && value.substr(0,1) == "=") {
                value = value.replace(/(\W|^)([a-zA-Z])([0-9])(?!\w)/g, function(m, b, col, row){
                    col = col.toLowerCase().charCodeAt(0) - 97;
                    var htmlRow = _self.oInt.childNodes[row - 1];
                    if (!htmlRow) 
                        throw new Error();

                    var htmlCol = htmlRow.childNodes[col];
                    if (!htmlCol)
                        throw new Error();

                    return b + parseFloat(_self.$getLayoutNode("cell", "caption",
                        htmlCol).nodeValue);
                });
                
                return eval(value.substr(1));
            }
            
            return value;
        };
    }
    //#endif
    
    /**** Column management ****/

    var lastSorted;
    /**
     * Sorts a column.
     * @param {Number} hid the heading number; this number is based on the sequence of the j:column elements.
     */
    this.sortColumn = function(hid){
        var h;
        
        if (hid == lastSorted) {
            jpf.setStyleClass(headings[hid].htmlNode, 
                this.toggleSortOrder()
                    ? "ascending"
                    : "descending", ["descending", "ascending"]);
            return;
        }

        if (typeof lastSorted != "undefined") {
            h = headings[lastSorted];
            jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "background", "");
            jpf.setStyleClass(h.htmlNode, "", ["descending", "ascending"]);
        }
        
        h = headings[hid];
        jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "background", "#f3f3f3");
        jpf.setStyleClass(h.htmlNode, "ascending", ["descending", "ascending"]);
        
        this.resort({
            order : "ascending",
            xpath : h.select
            //type : 
        });
        
        lastSorted = hid;
    };
    
    /** 
     * Resizes a column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the j:column elements. 
     * @param {Number} newsize  the new size of the column.
     * @todo optimize but bringing down the string concats
     */
    this.resizeColumn = function(nr, newsize){
        var hN, h = headings[nr];

        if (h.isPercentage) {
            var ratio = newsize / (h.htmlNode.offsetWidth - (widthdiff - 3)); //div 0 ??
            var next  = [];
            var total = 0;
            var node  = h.htmlNode.nextSibling;
            
            while(node && node.getAttribute("hid")) {
                hN = headings[node.getAttribute("hid")];
                if (hN.isPercentage) {
                    next.push(hN);
                    total += hN.width;
                }
                node = node.nextSibling;
            }
            
            var newPerc  = ratio * h.width;
            var diffPerc = newPerc - h.width;
            var diffRatio = (total - diffPerc) / total;
            if (diffRatio < 0.01) {
                if (newsize < 20) return;
                return this.resizeColumn(nr, newsize - 10);
            }
            
            for (var n, i = 0; i < next.length; i++) {
                n = next[i];
                n.width *= diffRatio;
                jpf.setStyleRule("." + this.baseCSSname + " .headings ."
                    + n.className, "width", n.width + "%"); //Set
                jpf.setStyleRule("." + this.baseCSSname + " .records ."
                    + n.className, "width", n.width + "%", null, this.oWin); //Set
            }
            
            h.width = newPerc;
            jpf.setStyleRule("." + this.baseCSSname + " .headings ."
                + h.className, "width", h.width + "%"); //Set
            jpf.setStyleRule("." + this.baseCSSname + " .records ."
                + h.className, "width", h.width + "%", null, this.oWin); //Set
        }
        else {
            var diff = newsize - h.width;
            h.width = newsize;
            if (jpf.isIE && this.oIframe)
                h.htmlNode.style.width = newsize + "px";
            else
                jpf.setStyleRule("." + this.baseCSSname + " .headings ."
                    + h.className, "width", newsize + "px"); //Set
            jpf.setStyleRule("." + this.baseCSSname + " .records ."
                + h.className, "width", newsize + "px", null, this.oWin); //Set
            
            var hFirst = headings[this.$first];
            this.$fixed += diff;
            var vLeft = (this.$fixed + 5) + "px";

            if (!this.$isFixedGrid) {
                //jpf.setStyleRule("." + this.baseCSSname + " .headings ." + hFirst.className, "marginLeft", "-" + vLeft); //Set
                //jpf.setStyleRule("." + this.baseCSSname + " .records ." + hFirst.className, "marginLeft", "-" + vLeft); //Set
                jpf.setStyleRule(".row" + this.uniqueId, "paddingRight", vLeft, null, this.oWin); //Set
                jpf.setStyleRule(".row" + this.uniqueId, "marginRight", "-" + vLeft, null, this.oWin); //Set
            
                //headings and records have same padding-right
                this.oInt.style.paddingRight  =
                this.oHead.style.paddingRight = vLeft;
            }
        }
    };

    /**
     * Hides a column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the j:column elements. 
     */
    this.hideColumn = function(nr){
        var h = headings[nr];
        jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className,
            "visibility", "hidden", null, this.oWin);
        
        //Change percentages here
    };
    
    /**
     * Shows a hidden column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the j:column elements. 
     */
    this.showColumn = function(nr){
        var h = headings[nr];
        jpf.setStyleRule("." + this.baseCSSname + " .records ." + h.className,
            "visibility", "visible", null, this.oWin);
        
        //Change percentages here
    };
    
    /**
     * Moves a column to another position.
     * @param {Number} fromHid the heading number of the column to move; this number is based on the sequence of the j:column elements.
     * @param {Number} toHid   the position the column is moved to;
     */
    this.moveColumn = function(from, to){
        if (to && from == to) 
            return;
        
        var hFrom = headings[from];
        var hTo   = headings[to];
        
        var childNrFrom = jpf.xmldb.getChildNumber(hFrom.htmlNode);
        var childNrTo   = hTo && jpf.xmldb.getChildNumber(hTo.htmlNode);
        this.oHead.insertBefore(hFrom.htmlNode, hTo && hTo.htmlNode || null);

        var node, nodes = this.oInt.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (this.$withContainer && ((i+1) % 2) == 0)
                continue;

            node = nodes[i];
            node.insertBefore(node.childNodes[childNrFrom], 
                typeof childNrTo != "undefined" && node.childNodes[childNrTo] || null);
        }
        
        /*if (this.$first == from || this.$first == to) {
            var hReset = this.$first == from ? hFrom : hTo;
            
            jpf.setStyleRule("." + this.baseCSSname + " .headings ."
                + hReset.className, "marginLeft", "-5px"); //Reset
            jpf.setStyleRule("." + this.baseCSSname + " .records ."
                + hReset.className, "marginLeft", "-5px"); //Reset
            
            this.$first = this.oHead.firstChild.getAttribute("hid");
            var h = headings[this.$first];
            var vLeft = "-" + (this.$fixed + 5) + "px";

            jpf.setStyleRule("." + this.baseCSSname + " .headings ."
                + h.className, "marginLeft", vLeft); //Set
            jpf.setStyleRule("." + this.baseCSSname + " .records ."
                + h.className, "marginLeft", vLeft); //Set
        }*/
    }
    
    /**** Buttons ****/

    this.$btndown = function(oHtml, e){
        this.$setStyleClass(oHtml, "down");
        
        var type = this.selected.getAttribute("type");//oHtml.getAttribute("type");
        
        if (!type) {
            var h = headings[this.oHead.childNodes[lastcol].getAttribute("hid")];
            type = h.type;
        }
        
        if (type == "dropdown" || type == "set") {
            if (jpf.popup.isShowing(this.uniqueId)){
                jpf.popup.forceHide();
            }
            else {
                var oContainer = editors["dropdown_container"];
                
                if (self[this.lookupjml]) 
                    self[this.lookupjml].detach();
                
                var mirrorNode = this.namevalue
                    ? oHtml.parentNode.childNodes[1]
                    : oHtml.parentNode;
                //this.$setStyleClass(oContainer, mirrorNode.className);
                oContainer.className = "propeditcontainer" + type;
                oContainer.style[jpf.supportOverflowComponent 
                    ? "overflowY"
                    : "overflow"] = "hidden";
                
                str   = [];
                var s = this.selected.selectNodes("item");
                if (type == "dropdown") {
                    if (!this.namevalue) {
                        s = self[h.xml.getAttribute("model")].queryNodes("item");
                        
                        for (var i = 0, l = s.length; i < l; i++) {
                            str.push("<div tag='", (s[i].getAttribute("value") 
                              || s[i].firstChild.nodeValue), "'>",
                                s[i].firstChild.nodeValue, "</div>");
                        }
                    }
                    else {
                        for (var i = 0, l = s.length; i < l; i++) {
                            str.push("<div tag='", s[i].getAttribute("value"), "'>",
                                s[i].firstChild.nodeValue, "</div>");
                        }
                    }
                }
                else {
                    var select = this.selected.getAttribute("select");
                    var values = [], n = this.xmlData.selectNodes(select);
                    for (var i = 0; i < n.length; i++) {
                        values.push(n[i].nodeValue || jpf.getXmlValue(n[i], "."));
                    }
                    
                    for (var v, c, i = 0, l = s.length; i < l; i++) {
                        c = values.contains(s[i].getAttribute("value"))
                              ? "checked" : "";
                        str.push("<div class='", c, "' tag='", 
                            s[i].getAttribute("value"), "'><span> </span>",
                            s[i].firstChild.nodeValue, "</div>");
                    }
                }

                oContainer.innerHTML = "<blockquote style='margin:0'>"
                    + str.join("") + "</blockquote>";

                oContainer.firstChild.onmouseover = function(e){
                    if (!e) e = event;
                    var target = e.srcElement || e.target;
                    
                    if (target == this) 
                        return;
                    
                    while (target.parentNode != this)
                        target = target.parentNode;
                    
                    jpf.setStyleClass(target, "hover");
                };
                
                oContainer.firstChild.onmouseout = function(e){
                    if (!e) e = event;
                    var target = e.srcElement || e.target;
                    
                    if (target == this) 
                        return;
                    
                    while (target.parentNode != this)
                        target = target.parentNode;
                    
                    jpf.setStyleClass(target, "", ["hover"]);
                };
                
                oContainer.firstChild.onmousedown = function(e){
                    if (!e) e = event;
                    var target = e.srcElement || e.target;
                    
                    if (target == this) 
                        return;
                    
                    while (target.parentNode != this)
                        target = target.parentNode;

                    if (type == "set") {
                        if (target.className.indexOf("checked") > -1)
                            jpf.setStyleClass(target, "", ["checked"]);
                        else
                            jpf.setStyleClass(target, "checked");
                    }
                    else {
                        _self.rename(_self.selected, target.getAttribute("tag"));
                        jpf.popup.forceHide();
                    }
                };
                
                var sel = this.selected;
                jpf.popup.show(this.uniqueId, {
                    x       : this.namevalue ? -1 : 0,
                    y       : mirrorNode.offsetHeight - 1,
                    animate : true,
                    ref     : mirrorNode,
                    width   : mirrorNode.offsetWidth - this.widthdiff + (this.namevalue ? 3 : 1),
                    height  : s.length * this.itemHeight,
                    onclose : function(e){
                        if (type == "set") {
                            var changes = [], checked = [], nodes = e.htmlNode.firstChild.childNodes;
                            for (var v, i = 0; i < nodes.length; i++) {
                                if (nodes[i].className.indexOf("checked") > -1) {
                                    checked.push(v = nodes[i].getAttribute("tag"));
                                    
                                    if (!values.contains(v)) {
                                        changes.push({
                                            func : "setValueByXpath",
                                            args : [_self.xmlData, v, select, true]
                                        });
                                    }
                                }
                            }
                            for (i = 0; i < values.length; i++) {
                                if (!checked.contains(values[i])) {
                                    changes.push({
                                        func : "removeNode",
                                        args : [n[i].nodeType != 1
                                         ? n[i].parentNode || n[i].ownerElement || n[i].selectSingleNode("..")
                                         : n[i]]
                                    });
                                }
                            }
                            
                            if (changes.length) {
                                //@todo this should become the change action
                                //setTimeout(function(){
                                    _self.$lastUpdated = sel;
                                    _self.getActionTracker().execute({
                                        action : "multicall",
                                        args   : changes
                                    });
                                //});
                            }
                        }
                    }
                });
            }
        }
    };
    
    this.$btnup = function(oHtml, force){
        if (!this.selected)
            return;

        //var type = oHtml.getAttribute("type");
        var type = this.selected.getAttribute("type");//oHtml.getAttribute("type");
        if (!force && type == "custom" && oHtml.className.indexOf("down") > -1) {
            if (this.selected.getAttribute("form")) {
                var form = self[this.selected.getAttribute("form")];

                //#ifdef __DEBUG
                if (!form) {
                    throw new Error(jpf.formatErrorString(0, _self,
                        "Showing form connected to property",
                        "Could not find form by name '" + this.selected.getAttribute("form")
                        + "'", this.selected));
                }
                //#endif
                
                form.show();
                form.bringToFront();
            }
            else if (this.selected.getAttribute("exec")) {
                //#ifdef __DEBUG
                try {
                //#endif
                    var selected = _self.xmlData;
                    eval(this.selected.getAttribute("exec"));
                //#ifdef __DEBUG
                }
                catch(e){
                    throw new Error(jpf.formatErrorString(0, _self,
                        "Executing the code inside the exec property",
                        "Could not find exec by name '" + this.selected.getAttribute("exec")
                        + "'\nError: " + e.message, this.selected));
                }
                // #endif
            }
        }
        else if (!force && type == "children") {
            var select  = this.selected.getAttribute("select");
            var xmlNode = jpf.xmldb.createNodeFromXpath(this.xmlData, select);//newNodes
            
            this.dispatchEvent("multiedit", {
                xmlNode  : this.selected,
                dataNode : xmlNode
            });
        }
        
        if (force || "dropdown|set".indexOf(oHtml.getAttribute("type")) == -1 
          || !jpf.popup.isShowing(this.uniqueId))
            this.$setStyleClass(oHtml, "", ["down"]);
    };
    
    this.$btnout = function(oHtml, force){
        if (force || "dropdown|set".indexOf(oHtml.getAttribute("type")) == -1
          || !jpf.popup.isShowing(this.uniqueId))
            this.$setStyleClass(oHtml, "", ["down"]);
    };
    
    this.addEventListener("popuphide", function(){
        if (curBtn)
            this.$btnup(curBtn, true);
        if (this.rename)
            this.stopRename();
    });

    /**** Init ****/

    var widthdiff, defaultwidth, useiframe;
    this.$draw = function(){
        //Build Main Skin
        this.oExt     = this.$getExternal();
        this.oInt     = this.$getLayoutNode("main", "body", this.oExt);
        this.oHead    = this.$getLayoutNode("main", "head", this.oExt);
        this.oPointer = this.$getLayoutNode("main", "pointer", this.oExt);

        if (this.oHead.firstChild)
            this.oHead.removeChild(this.oHead.firstChild);
        if (this.oInt.firstChild)
            this.oInt.removeChild(this.oInt.firstChild);

        widthdiff    = this.$getOption("main", "widthdiff") || 0;
        defaultwidth = this.$getOption("main", "defaultwidth") || "100";
        useiframe    = jpf.isIE && (jpf.isTrue(this.$getOption("main", "iframe")) || this.iframe);

        jpf.JmlParser.parseChildren(this.$jml, null, this);
        
        //Initialize Iframe 
        if (useiframe && !this.oIframe) {
            //this.oInt.style.overflow = "hidden";
            //var sInt = this.oInt.outerHTML 
            var sClass   = this.oInt.className;
            //this.oInt.parentNode.removeChild(this.oInt);
            this.oIframe = this.oInt.appendChild(document.createElement(jpf.isIE 
                ? "<iframe frameborder='0'></iframe>"
                : "iframe"));
            this.oIframe.frameBorder = 0;
            this.oWin = this.oIframe.contentWindow;
            this.oDoc = this.oWin.document;
            this.oDoc.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
                <html xmlns="http://www.w3.org/1999/xhtml">\
                    <head><script>\
                        jpf = {\
                            lookup : function(uid){\
                                return window.parent.jpf.lookup(uid);\
                            },\
                            Init : {add:function(){},run:function(){}}\
                        };</script>\
                    </head>\
                    <body></body>\
                </html>');
            //Import CSS
            //this.oDoc.body.innerHTML = sInt;
            this.oInt = this.oDoc.body;//.firstChild;
            this.oInt.className = sClass;//this.oIframe.parentNode.className;
            this.oDoc.documentElement.className = this.oExt.className;
            //this.oDoc.body.className = this.oExt.className;

            jpf.skins.loadCssInWindow(this.skinName, this.oWin, this.mediaPath, this.iconPath);
            
            if (jpf.isIE) //@todo this can be removed when focussing is fixed for this component
                this.$setStyleClass(this.oDoc.documentElement, this.baseCSSname + "Focus");
            
            jpf.convertIframe(this.oIframe, true);

            // #ifdef __WITH_RENAME
            this.oDoc.body.insertAdjacentHTML("beforeend", this.oTxt.outerHTML);

            var t = this.oTxt; t.refCount--;
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
            
            if (jpf.getStyle(this.oDoc.documentElement, jpf.isIE 
              ? "overflowY" : "overflow-y") == "auto") {
                //@todo ie only
                this.oIframe.onresize = function(){
                    _self.oHead.style.marginRight = 
                      _self.oDoc.documentElement.scrollHeight > _self.oDoc.documentElement.offsetHeight 
                        ? "16px" : "0";
                }
                
                this.addEventListener("afterload", this.oIframe.onresize);
                this.addEventListener("xmlupdate", this.oIframe.onresize);
            }
            
            this.oDoc.documentElement.onmousedown = function(e){
                if (!e) e = _self.oWin.event;
                if ((e.srcElement || e.target).tagName == "HTML")
                    jpf.popup.forceHide();
            }
                        
            this.oDoc.documentElement.onscroll = 
                function(){
                    if (_self.$isFixedGrid)
                        _self.oHead.scrollLeft = _self.oDoc.documentElement.scrollLeft;
                };
        }
        else {
            if (jpf.getStyle(this.oInt, jpf.isIE 
              ? "overflowY" : "overflow-y") == "auto") {
                this.$resize = function(){
                    _self.oHead.style.marginRight = 
                      _self.oInt.scrollHeight > _self.oInt.offsetHeight 
                        ? "16px" : "0";
                }
                
                //#ifdef __WITH_LAYOUT
                jpf.layout.setRules(this.oExt, this.uniqueId + "_datagrid",
                    "var o = jpf.all[" + this.uniqueId + "];\
                     if (o) o.$resize()");
                jpf.layout.activateRules(this.oExt);
                //#endif
                
                this.addEventListener("afterload", this.$resize);
                this.addEventListener("xmlupdate", this.$resize);
            }
            
            this.oInt.onmousedown = function(e){
                if (!e) e = event;
                if ((e.srcElement || e.target) == this)
                    jpf.popup.forceHide();
            }
            
            this.oInt.onscroll = 
                function(){
                    if (_self.$isFixedGrid)
                        _self.oHead.scrollLeft = _self.oInt.scrollLeft;
                };
        }
        
        // #ifdef __WITH_RENAME
        this.oTxt.onkeydown     = function(e){
            if ("datagrid|spreadsheet|propedit".indexOf(_self.tagName) == -1)
                return;
            
            if (!e) e = (_self.oWin || window).event;
            if (_self.celledit && !_self.namevalue && e.keyCode == 9) {
                _self.stopRename(null, true);
                keyHandler.call(_self, {keyCode:39, force:true});
                e.cancelBubble = true;
                e.returnValue  = true;
                return false;
            }
        }
        //#endif
        
        var dragging = false;
        
        this.oHead.onmouseover = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this) return;
            
            while (target.parentNode != this)
                target = target.parentNode;

            jpf.setStyleClass(target, "hover", ["down"]);
        };
        
        this.oHead.onmouseup = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this || !jpf.xmldb.isChildOf(dragging, target, true)) 
                return;
            
            while (target.parentNode != this)
                target = target.parentNode;
            
            jpf.setStyleClass(target, "hover", ["down"]);
            
            if (headings[target.getAttribute("hid")].sortable)
                _self.sortColumn(parseInt(target.getAttribute("hid")));
        };
        
        this.oHead.onmousedown = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this) return;
            
            while (target.parentNode != this)
                target = target.parentNode;
            
            dragging = target;
            
            //Resizing
            var pos   = jpf.getAbsolutePosition(target),
                sLeft = _self.oHead.scrollLeft;
            var d     = e.clientX - pos[0] + sLeft;
            if (d < 4 || target.offsetWidth - d - 8 < 3) {
                var t = d < 4 && target.previousSibling || target;
                
                if (headings[t.getAttribute("hid")].resizable) {
                    pos   = jpf.getAbsolutePosition(t);
                    jpf.setStyleClass(_self.oPointer, "size_pointer", ["move_pointer"]);
                    _self.oPointer.style.display = "block";
                    _self.oPointer.style.left    = (t.offsetLeft - sLeft - 1) + "px";
                    _self.oPointer.style.width   = (t.offsetWidth - widthdiff + 1) + "px";
                    
                    // #ifdef __WITH_PLANE
                    jpf.plane.show(_self.oPointer, null, true);
                    // #endif

                    dragging = true;
                    document.onmouseup = function(){
                        if (!e) e = event;
    
                        document.onmouseup = 
                        document.onmousemove = null;
                        
                        _self.resizeColumn(t.getAttribute("hid"),
                            _self.oPointer.offsetWidth);
                        
                        dragging = false;
                        _self.oPointer.style.display = "none";
                        
                        // #ifdef __WITH_PLANE
                        jpf.plane.hide();
                        // #endif

                    };
                    
                    document.onmousemove = function(e){
                        if (!e) e = event;

                        _self.oPointer.style.width = Math.max(10, 
                            Math.min(_self.oInt.offsetWidth - _self.oPointer.offsetLeft - 20, 
                                e.clientX - pos[0] - 1 + sLeft)) + "px";
                    };
                    
                    return;
                }
            }
            
            jpf.setStyleClass(target, "down", ["hover"]);
            
            //Moving
            if (!headings[target.getAttribute("hid")].movable) {
                document.onmouseup = function(e){
                    document.onmouseup = null;
                    dragging = false;
                };
                
                return;
            }
            
            jpf.setStyleClass(_self.oPointer, "move_pointer", ["size_pointer"]);
            
            var x = e.clientX - target.offsetLeft, sX = e.clientX,
                y = e.clientY - target.offsetTop,  sY = e.clientY,
                copy;
            
            document.onmouseup = function(e){
                if (!e) e = event;
                
                document.onmouseup   =
                document.onmousemove = null;
                
                dragging = false;
                _self.oPointer.style.display = "none";
                
                if (!copy)
                    return;
                    
                copy.style.top = "-100px";
                
                var el = document.elementFromPoint(e.clientX, e.clientY);
                if (el.parentNode == copy.parentNode) {
                    var pos = jpf.getAbsolutePosition(el);
                    var beforeNode = (e.clientX - pos[0] > el.offsetWidth / 2
                        ? el.nextSibling
                        : el);

                    _self.moveColumn(target.getAttribute("hid"), 
                        beforeNode ? beforeNode.getAttribute("hid") : null);
                }
                
                jpf.removeNode(copy);
            };

            document.onmousemove = function(e){
                if (!e) e = event;
                
                if (!copy) {
                    if (Math.abs(e.clientX - sX) < 3 && Math.abs(e.clientY - sY) < 3)
                        return;
                    
                    copy = target.cloneNode(true);
                    copy.style.position = "absolute";
                    var diff = jpf.getWidthDiff(target);
                    copy.style.width    = (target.offsetWidth - diff
                        - widthdiff + 2) + "px";
                    copy.style.left     = target.offsetLeft;
                    copy.style.top      = target.offsetTop;
                    copy.style.margin   = 0;
                    copy.removeAttribute("hid")
                    
                    jpf.setStyleClass(copy, "drag", ["ascending", "descending"]);
                    target.parentNode.appendChild(copy);
                }
                
                copy.style.top               = "-100px";
                _self.oPointer.style.display = "none";
                
                var el = document.elementFromPoint(e.clientX, e.clientY);
                if (el.parentNode == copy.parentNode) {
                    var pos = jpf.getAbsolutePosition(el);
                    _self.oPointer.style.left = (el.offsetLeft 
                        + ((e.clientX - pos[0] > el.offsetWidth / 2)
                            ? el.offsetWidth - 8
                            : 0)) + "px";
                    _self.oPointer.style.display = "block";
                }
                
                copy.style.left = (e.clientX - x) + 'px';
                copy.style.top  = (e.clientY - y) + 'px';
            };
        };
        
        this.oHead.onmouseout = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this) return;
            
            while (target.parentNode != this)
                target = target.parentNode;
            
            jpf.setStyleClass(target, "", ["hover", "down"]);
        };
        
        this.oHead.onmousemove = function(e){
            if (dragging)
                return;
            
            if (!e)
                e = event;
            var target = e.srcElement || e.target;
            
            if (target == this) return;
            
            while (target.parentNode != this)
                target = target.parentNode;
            
            var pos   = jpf.getAbsolutePosition(target),
                sLeft = _self.oHead.scrollLeft;
            var d = e.clientX - pos[0] + sLeft;

            if (d < 4 || target.offsetWidth - d - widthdiff < 3) {
                var t = d < 4 ? target.previousSibling : target;
                this.style.cursor = t && headings[t.getAttribute("hid")].resizable
                    ? "w-resize"
                    : "default";
            }
            else {
                this.style.cursor = "default";
            }
        };
    };
    
    var editors = {};
    this.$loadJml = function(x){
        if (x.getAttribute("message"))
            this.clearMessage = x.getAttribute("message");
        
        //@todo add options attribute
        
        if (this.tagName == "spreadsheet" || this.tagName == "propedit") {
            this.celledit   = true;
            this.cellselect = true;
            
            if (this.tagName == "propedit")
                this.namevalue = true;
        }
        
        //@todo move this to the handler of the namevalue attribute
        if (this.namevalue || this.editdropdown) {
            var edits = ["dropdown", "custom", "dropdown_container"];

            for (var edit, c, i = 0; i < edits.length; i++) {
                c = this.$getLayoutNode(edits[i]);
                edit = edits[i];
                
                if (i < edits.length - 1) {
                    c.setAttribute("onmousedown", "jpf.lookup(" + this.uniqueId
                        + ").$btndown(this, event);");
                    c.setAttribute("onmouseup", "jpf.lookup(" + this.uniqueId
                        + ").$btnup(this)");
                    c.setAttribute("onmouseout", "jpf.lookup(" + this.uniqueId
                        + ").$btnout(this)");
                    c.setAttribute("type", edit);
                    
                    editors[edit] = jpf.xmldb.htmlImport(c, this.oInt)
                }
                else {
                    editors[edit] = c = jpf.xmldb.htmlImport(c, this.oExt)
                    editors[edit].style.zIndex = 100000;
                    
                    jpf.popup.setContent(this.uniqueId, editors[edit],
                        jpf.skins.getCssString(this.skinName));
                    
                    //if (jpf.isTrue(this.$getOption(edit, "jml")))
                        //continue;
                    
                    this.itemHeight = this.$getOption(edit, "item-height") || 18.5;
                    this.widthdiff  = this.$getOption(edit, "width-diff") || 0;
                }
            }
        }
        
        if (this.namevalue) {
            var changeListener = {
                $xmlUpdate : function(action, xmlNode, loopNode, undoObj, oParent){
                    if (!_self.xmlRoot)
                        return;

                    /*if (action == "redo-remove")
                        oParent.appendChild(xmlNode);
                    
                    var lstUpdate = [], nodes = _self.xmlRoot.selectNodes("node()[@select]|node()/field[@select]");
                    for (var node, s, i = 0, l = nodes.length; i < l; i++) {
                        node = nodes[i];
                        s = node.getAttribute("select");
                        //action == "insert" || action == "update"
                        if (jpf.xmldb.isChildOf(xmlNode, _self.xmlData.selectSingleNode(s), true) ||
                            jpf.xmldb.isChildOf(_self.xmlData.selectSingleNode(s), xmlNode, true)){
                            lstUpdate.pushUnique(node.tagName == "field"
                                ? node.parentNode
                                : node);
                        }
                    }
                    
                    if (action == "redo-remove")
                        oParent.removeChild(xmlNode);
                    
                    for (var i = 0, l = lstUpdate.length; i < l; i++) {
                        _self.$updateNode(lstUpdate[i], 
                            jpf.xmldb.findHtmlNode(lstUpdate[i], _self));
                    }*/
                    
                    if (_self.renaming)
                        _self.stopRename();
                    
                    if (_self.$lastUpdated) {
                        _self.$updateNode(_self.$lastUpdated, 
                            jpf.xmldb.findHtmlNode(_self.$lastUpdated, _self));
                        _self.$lastUpdated = null
                    }
                    else {
                        var nodes = _self.getTraverseNodes();
                        for (var i = 0, l = nodes.length; i < l; i++) {
                            _self.$updateNode(nodes[i], 
                                jpf.xmldb.findHtmlNode(nodes[i], _self));
                        }
                    }
                                        
                    _self.dispatchEvent("xmlupdate", {
                        action : action,
                        xmlNode: xmlNode
                    });
                }
            };
            changeListener.uniqueId = jpf.all.push(changeListener) - 1;
            
            var vRules = {};
            this.$_load = this.load;
            /**
             * @private
             */
            this.load   = function(xmlRoot, cacheId){
                var template = this.template || this.applyRuleSetOnNode("template", xmlRoot);

                //@todo need caching of the template

                if (template) {
                    this.$initTemplate();
                    
                    this.xmlData = xmlRoot;
                    if (xmlRoot)
                        this.$loadSubData(xmlRoot);
                    
                    //@todo This is never removed
                    if (xmlRoot)
                        jpf.xmldb.addNodeListener(xmlRoot, changeListener);

                    jpf.setModel(template, {
                        $xmlUpdate : function(){
                            //debugger;
                        },
                        
                        load: function(xmlNode){
                            if (!xmlNode || this.isLoaded)
                                return;

                            // retrieve the cacheId
                            if (!cacheId) {
                                cacheId = xmlNode.getAttribute(jpf.xmldb.xmlIdTag) ||
                                    jpf.xmldb.nodeConnect(jpf.xmldb.getXmlDocId(xmlNode), xmlNode);
                            }

                            if (!_self.isCached(cacheId)) {
                                _self.$_load(xmlNode);
                            }
                            else {
                                //this.xmlRoot = null;
                                _self.$_load(xmlNode);
                                
                                var nodes = _self.getTraverseNodes();
                                for (var s, i = 0, htmlNode, l = nodes.length; i < l; i++) {
                                    htmlNode = jpf.xmldb.findHtmlNode(nodes[i], _self);
                                    if (!htmlNode) 
                                        break;

                                    _self.$updateNode(nodes[i], htmlNode);
                                }
                            }
                            
                            _self.setProperty("disabled", _self.xmlData ? false : true);
                            this.isLoaded = true; //@todo how about cleanup?
                        },
        
                        setModel: function(model, xpath){
                            model.register(this, xpath);
                        }
                    });
                }
                else {
                    this.$_load.apply(this, arguments);
                }
            }
        }
        
        if (this.cellselect) {
            this.multiselect = false;
            this.bufferselect = false;
            
            this.$select = function(o, xmlNode){
                //#ifdef __WITH_RENAME
                if (this.renaming)
                    this.stopRename(null, true);
                //#endif

                if (!o || !o.style)
                    return;

                if (lastrow != o) {
                    this.selected = xmlNode;
                    this.selectCell({target:o.childNodes[lastcol || 0]}, o);
                }

                return this.$setStyleClass(o, "selected");
            };
            
            /*this.addEventListener("onafterselect", function(e){
                if (lastrow != this.$selected && this.$selected)
                    this.selectCell({target:this.$selected.childNodes[lastcol || 0]}, 
                        this.$selected);
            });*/
        }
    };
    
    this.$destroy = function(){
        jpf.popup.removeContent(this.uniqueId);
        
        //@todo destroy this.oTxt here
        
        if (editors["dropdown_container"]) {
            editors["dropdown_container"].onmouseout  =
            editors["dropdown_container"].onmouseover = 
            editors["dropdown_container"].onmousedown = null;
        }
        
        jpf.removeNode(this.oDrag);
        this.oDrag = this.oExt.onclick = this.oInt.onresize = null;
        
        //#ifdef __WITH_LAYOUT
        jpf.layout.removeRule(this.oInt, "dg" + this.uniqueId);
        jpf.layout.activateRules(this.oInt);
        //#endif
    };
    
    this.counter = 0;
}).implement(
    //#ifdef __WITH_RENAME
    jpf.Rename,
    //#endif
    //#ifdef __WITH_DRAGDROP
    jpf.DragDrop,
    //#endif
    jpf.MultiSelect,
    jpf.Cache,  
    jpf.DataBinding,
    jpf.Presentation
);

//#endif

/**
 * @private
 */
jpf.convertIframe = function(iframe, preventSelect){
    var win = iframe.contentWindow;
    var doc = win.document;
    var pos;

    if (!jpf.isIE)
        jpf.importClass(jpf.runNonIe, true, win);
        
    //Load Browser Specific Code
    // #ifdef __SUPPORT_SAFARI
    if (this.isSafari) 
        this.importClass(jpf.runSafari, true, win);
    // #endif
    // #ifdef __SUPPORT_OPERA
    if (this.isOpera) 
        this.importClass(jpf.runOpera, true, win);
    // #endif
    // #ifdef __SUPPORT_GECKO
    if (this.isGecko || !this.isIE && !this.isSafari && !this.isOpera)
        this.importClass(jpf.runGecko, true, win);
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
            pos = jpf.getAbsolutePosition(iframe);

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
        
        if (preventSelect && !jpf.isIE)
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
            pos = jpf.getAbsolutePosition(iframe);
        
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
        pos = jpf.getAbsolutePosition(iframe);
    };

    doc.documentElement.onmousemove = function(e){
        if (!e) e = win.event;
        if (!pos)
            pos = jpf.getAbsolutePosition(iframe);
    
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
