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
 *  <a:datagrid model="mdlNews" options="move|size">
 *      <a:bindings>
 *          <a:column type="icon" width="16" value="newspaper.png" />
 *          <a:column caption="Date" select="publication/@date" width="70" />
 *            <a:column caption="Title" width="180" select="title" />
 *          <a:column caption="Subtitle" select="subtitle" width="100%" />
 *          <a:traverse select="news" />
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
 *          <a:traverse select="record" />
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
 * @inherits apf.MultiSelect
 * @inherits apf.Cache   
 * @inherits apf.Presentation
 * @inherits apf.DataBinding
 * @inherits apf.DragDrop
 * @inherits apf.Rename
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
 *                  <a:traverse select="node()[local-name()]" />
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
 *  <a:list>
 *      <a:bindings>
 *          <a:caption select="@caption" />
 *          <a:css select="message[@unread]" value="highlighUnread" />
 *          <a:icon select="@icon" />
 *          <a:icon select="self::folder" value="icoFolder.gif" />
 *          <a:traverse select="folder" />
 *      </bindings>
 *  </list>
 * </code>
 * @binding invalidmsg  Determines the error message that is shown when a cell is not valid.
 * @binding description Determines the text that is displayed under the expanded row.
 * @binding template    Determines the template that sets the column definition (for the datagrid) or property definition (for property editor).

 */
apf.propedit    =
apf.spreadsheet = 
apf.datagrid    = apf.component(apf.NODE_VISIBLE, function(){
    this.$focussable  = true; // This object can get the focus
    this.multiselect  = true; // Enable MultiSelect
    this.bufferselect = false;
    
    this.startClosed  = true;
    this.animType     = apf.tween.NORMAL;
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
     * @attribute {Boolean} cellselect whether this element has selectable rows (false) or selected cells (true). Default is false for datagrid and true for propedit and spreadsheet.
     * @attribute {Boolean} celledit   whether this element has editable cells. This requires cellselect to be true. Default is false for datagrid and true for propedit and spreadsheet.
     * @attribute {Boolean} namevalue  whether each row only contains a name and a value column. Default is false for datagrid and spreadsheet and true for propedit.
     * @attribute {Boolean} iframe     whether this element is rendered inside an iframe. This is only supported for IE. Default is false for datagrid and true for spreadsheet and propedit.
     */
    this.$booleanProperties["cellselect"] = true;
    this.$booleanProperties["celledit"]   = true;
    this.$booleanProperties["namevalue"]  = true;
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
            this.implement(apf.Validation);
            
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
             * @param  {AMLElement} [page]           the page for which the children will be checked. When not specified all elements of this validation group will be checked.
             * @return  {Boolean}  specifying whether the checked elements are valid.
             * @method isValid, validate, checkValidity
             */
            this.isValid = function(checkRequired, node){
                if (!this.xmlRoot || !this.xmlData || this.disabled)
                    return true;
                
                var nodes, isValid = true;
                var cacheId = this.xmlRoot.getAttribute(apf.xmldb.xmlIdTag);
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
                    valueNode = this.xmlData.selectSingleNode(apf.queryValue(node, "@select|field/@select"));
                    value = valueNode && (!type || type == "text")
                        ? valueNode.nodeType == 1 ? apf.queryValue(valueNode, '.') : valueNode.nodeValue
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
                        this.validityState.errorHtml = apf.xmldb.findHtmlNode(node, this).childNodes[1];
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
            
            var vgroup = apf.getInheritedAttribute(this.$aml, "validgroup");
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
            
            if (apf.isIE)
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
                this.setTempSelected(this.getFirstTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = 0;
                return false;
            case 35:
                //END
                this.setTempSelected(this.getLastTraverseNode(), false, shiftKey);
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
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;

                var margin    = apf.getBox(apf.getStyle(selHtml, "margin"));
                var hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                var items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, false, items);
                if (node)
                    this.setTempSelected(node, ctrlKey, shiftKey);
                else return false;

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
                    
                var node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin    = apf.getBox(apf.getStyle(selHtml, "margin"));
                var hasScroll = oInt.scrollHeight > oInt.offsetHeight;
                var items     = Math.floor((oInt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, true, items);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return false;
                
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
                    
                var node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin     = apf.getBox(apf.getStyle(selHtml, "margin"));
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

                var node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin     = apf.getBox(apf.getStyle(selHtml, "margin"));
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
        if (!this.oExt || (apf.isIE && useiframe && this.cssfix)) //@todo fix this by fixing focussing for this component
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

        if (!this.oExt || (apf.isIE && useiframe && this.cssfix)) //@todo fix this by fixing focussing for this component
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
    
    var lastOpened = {};
    /**
     * @private
     */
    this.slideOpen = function(container, xmlNode){
        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, this);
        if (!container)
            container = htmlNode.nextSibling;

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode)
            var p     = (pNode || this.xmlRoot).getAttribute(apf.xmldb.xmlIdTag);
            if (lastOpened[p] && lastOpened[p][1] != xmlNode 
              && this.getTraverseParent(lastOpened[p][1]) == pNode) 
                this.slideToggle(lastOpened[p][0], 2);//lastOpened[p][1]);
            lastOpened[p] = [htmlNode, xmlNode];
        }
        
        container.style.display = "block";

        apf.tween.single(container, {
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
                .getAttribute(apf.xmldb.xmlIdTag);
            lastOpened[p] = null;
        }
        
        container.style.height   = container.offsetHeight;
        container.style.overflow = "hidden";

        apf.tween.single(container, {
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

            var cols = (this.columns || this.$aml.getAttribute("columns")
                || "50%,50%").splitSafe(",");
            
            //@todo ask rik how this can be cached
            //@todo get xmlUpdate to be called only once per document update for propedit
            var xml = 
              apf.getXml('<a:root xmlns:a="' + apf.ns.apf + '">\
                <a:column caption="Property" width="' + cols[0] + '"><![CDATA[[%($"@caption" + ($"@required" ? " *" : ""));]]]></a:column>\
                <a:column caption="Value" width="' + cols[1] + '" css="' + this.baseCSSname + '_{@type}{@multiple}"><![CDATA[[\
                    var dg = apf.lookup(' + this.uniqueId + ');\
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
                        var v = apf.queryValue(dg.xmlData, select);\
                        %value("item[@value=\'" + v + "\']");\
                    }\
                    else if (type == "lookup" && $"@multiple" == "multiple"){\
                        ]<div class="newitem"> </div>[\
                        var vs = $"@descfield";\
                        if (vs) {\
                            n = dg.xmlData;\
                            foreach(select) {]\
                                <div class="item"><i onclick="apf.lookup(' + this.uniqueId + ').$removePropItem(\'[%value(vs).replace(/\'/g, "\\\\\'").replace(/"/g, "&amp;quot;");]\')">x</i>[%value(vs)]</div>\
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
                                    <div class="item"><i onclick="apf.lookup(' + this.uniqueId + ').$removePropItem(\'[%value(vs).replace(/\'/g, "\\\\\'").replace(/"/g, "&amp;quot;");]\', \'node()\')">x</i>[%value(vs)]</div>\
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
                        %apf.queryValue(dg.xmlData, select + (vs ? "/" + vs : ""));\
                    }\
                    else if (type == "custom") {\
                        var sep = $"@separator" || "";\
                        var v, output = [];\
                        foreach("field"){\
                            v = apf.queryValue(dg.xmlData, $"@select");\
                            if (v) output.push(v);\
                        }\
                        if ($"@mask")\
                            output.push($"@mask");\
                        else if (!output.length && select)\
                            output.push(apf.queryValue(dg.xmlData, select));\
                        %output.join(sep);\
                    }\
                    else {\
                        %apf.queryValue(dg.xmlData, select);\
                    }\
                ]]]></a:column>\
                <a:traverse select="property|prop" />\
                <a:required select="self::node()/@required" />\
                <a:datatype select="@datatype" />\
                <a:pattern><![CDATA[[\
                    var validate;\
                    if ((validate = $"@decimals"))\
                        %("/\\.\\d{" + validate + "}/");\
                    else if ((validate = $"@validate") && validate.chartAt(0) == "/")\
                        %("/" + validate.replace(/^\\/|\\/$/g, "") + "/");\
                ]]]></a:pattern>\
                <a:maxlength select="@maxlength" />\
                <a:invalidmsg><![CDATA[[\
                     out = $"@invalidmsg" || "Invalid entry;Please correct your entry";\
                ]]]></a:invalidmsg>\
              </a:root>');
              <!-- mask -->
            
            //<a:select select="self::node()[not(@frozen)]" />\
            
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
                var tagName = nodes[i][apf.TAGNAME];
                (this.bindingRules[tagName]
                    || (this.bindingRules[tagName] = [])).push(nodes[i]);
            }
        }
        
        //#ifdef __DEBUG
        if (!heads) {
            throw new Error(apf.formatErrorString(0, this,
                "Parsing bindings aml",
                "No column definition found"));
        }
        //#endif
        
        //@todo This should support multiple color rules, by inserting the rules at the right place.
        if (this.bindingRules && this.bindingRules.color) {
            var clr = this.bindingRules.color[0];
            apf.setStyleRule("." + this.baseCSSname + (apf.isIE
                ? " .records .highlight SPAN"
                : " .records .highlight span"), "color", clr.getAttribute("text"), null, this.oWin);
            apf.setStyleRule("." + this.baseCSSname + (apf.isIE
                ? " .records .highlight SPAN"
                : " .records .highlight span"), "backgroundColor", clr.getAttribute("row"), null, this.oWin);
            apf.setStyleRule("." + this.baseCSSname + (apf.isIE
                ? " .records .highlight"
                : " .records .highlight"), "backgroundColor", clr.getAttribute("row"), null, this.oWin);
            /*apf.importCssString(document, 
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
                    + apf.getAbsolutePath(this.iconPath, h.icon) 
                    +")");
                hCaption.nodeValue = "&nbsp;";
            }
            else
                hCaption.nodeValue = h.caption;

            //nodes.push(oHead);
            h.htmlNode = apf.xmldb.htmlImport(oHead, this.oHead);
        }
        
        //apf.xmldb.htmlImport(nodes, this.oHead);

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
            cssRules.push(["." + this.baseCSSname + " .row" + this.uniqueId, 
                "padding-right:" + vLeft + "px;margin-right:-" + vLeft + "px"]);
        
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
        
        apf.destroyHtmlNode(this.oDragHeading);
        this.oDragHeading = null;
        apf.destroyHtmlNode(this.oSplitter);
        this.oSplitter = null;
        apf.destroyHtmlNode(this.oSplitterLeft);
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
        
        oRow.setAttribute("ondblclick", 'var o = apf.lookup(' + this.uniqueId + ');o.choose();'
            + (this.$withContainer ? 'o.slideToggle(this);' : '')
            + (this.celledit && !this.namevalue ? 'o.startRename();' : ''));
        
        if (this.hasFeature(__DRAGDROP__)) {
            oRow.setAttribute("onmouseout", 'this.hasPassedDown = false;');
            oRow.setAttribute("onmousedown", 'var o = apf.lookup(' + this.uniqueId + ');\
                var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 this.hasPassedDown = true;\
                 if (!o.hasFeature(__DRAGDROP__) || !isSelected && !event.ctrlKey)\
                     o.select(this, event.ctrlKey, event.shiftKey);'
                + (this.cellselect || this.namevalue ? 'o.selectCell(event, this, isSelected);' : ''));
            
            oRow.setAttribute("onmouseup", 'if (!this.hasPassedDown) return;\
                var o = apf.lookup(' + this.uniqueId + ');\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 if (o.hasFeature(__DRAGDROP__) && (isSelected || event.ctrlKey))\
                     o.select(this, event.ctrlKey, event.shiftKey);');
        } //@todo add DRAGDROP ifdefs
        else {
            oRow.setAttribute("onmousedown", 'var o = apf.lookup(' + this.uniqueId + ');\
                var wasSelected = o.$selected == this;\
                o.select(this, event.ctrlKey, event.shiftKey);'
                + (this.cellselect || this.namevalue ? 'o.selectCell(event, this, wasSelected);' : ''));
        }
        
        //Build the Cells
        for(var c, h, i = 0; i < headings.length; i++){
            h = headings[i];
            
            this.$getNewContext("cell");
            
            if (h.css)
                apf.setStyleClass(this.$getLayoutNode("cell"), apf.JsltInstance.apply(h.css, xmlNode));

            if (h.type == "icon"){
                var node = this.$getLayoutNode("cell", "caption",
                    oRow.appendChild(this.$setStyleClass(this.$getLayoutNode("cell"),
                    h.className)));
                apf.setNodeValue(node, "&nbsp;");
                (node.nodeType == 1 && node || node.parentNode)
                    .setAttribute("style", "background-image:url(" 
                        + apf.getAbsolutePath(this.iconPath, 
                            this.applyRuleSetOnNode([h.xml], xmlNode)) 
                        + ")");
            }
            else {
                apf.setNodeValue(this.$getLayoutNode("cell", "caption",
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

        //return apf.xmldb.htmlImport(oRow, htmlParentNode || this.oInt, beforeNode);
        if (htmlParentNode)
            apf.xmldb.htmlImport(oRow, htmlParentNode, beforeNode);
        else
            this.nodes.push(oRow);
        
        if (this.$withContainer) {
            var desc = this.applyRuleSetOnNode("description", xmlNode);
            this.$getNewContext("container");
            var oDesc = this.$getLayoutNode("container");
            apf.setNodeValue(this.$getLayoutNode("container", "container",
                oDesc), desc);
            oDesc.setAttribute("class", (oDesc.getAttribute("class") || "")
                + " row" + this.uniqueId);
            
            if(htmlParentNode) 
                apf.xmldb.htmlImport(oDesc, htmlParentNode, beforeNode);
            else 
                this.nodes.push(oDesc);
        }
    };
    
    var useTable = false;
    this.$fill = function(nodes){
        if (useiframe)
            this.pHtmlDoc = this.oDoc;

        if (useTable) {
            apf.xmldb.htmlImport(this.nodes, this.oInt, null,
                 "<table class='records' cellpadding='0' cellspacing='0'><tbody>", 
                 "</tbody></table>");
        }
        else {
            apf.xmldb.htmlImport(this.nodes, this.oInt);
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
        
        for (var h, i = this.namevalue ? 1 : 0, l = nodes.length; i < l; i++) {
            h = headings[nodes[i].getAttribute("hid")];
            
            //@todo fake optimization
            node = this.$getLayoutNode("cell", "caption", htmlNodes[i]) || htmlNodes[i];//htmlNodes[i].firstChild || 
            
            if (h.type == "icon") {
                (node.nodeType == 1 && node || node.parentNode)
                    .style.backgroundImage = "url(" 
                        + apf.getAbsolutePath(this.iconPath, 
                            this.applyRuleSetOnNode([h.xml], xmlNode))
                        + ")";
            }
            else {
                node.innerHTML = (this.applyRuleSetOnNode([h.xml], xmlNode)
                    || "").trim() || ""; //@todo for IE but seems not a good idea
                //apf.setNodeValue(node, 
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
            ? apf.xmldb.findHtmlNode(this.getNextTraverse(xmlNode), this)
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
     * @param {Number} hid the heading number; this number is based on the sequence of the column elements.
     */
    this.getColumn = function(nr){
        return headings[nr || lastcol || 0];
    }
    
    /**
     * @private
     */
    this.selectCell = function(e, rowHtml, wasSelected) {
        var htmlNode = e.srcElement || e.target;
        if (htmlNode == rowHtml || !apf.isChildOf(rowHtml, htmlNode))
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
                apf.setStyleClass(lastcell.parentNode.childNodes[0], "", ["celllabel"]);
                apf.setStyleClass(lastcell.parentNode.childNodes[1], "", ["cellselected"]);
            }
            else {
                apf.setStyleClass(lastcell, "", ["cellselected"]);
            }
        }

        var col = apf.xmldb.getChildNumber(htmlNode);
        var h   = headings[this.oHead.childNodes[col].getAttribute("hid")];

        if (this.namevalue || h.type == "dropdown") {
            if (this.namevalue) {
                apf.setStyleClass(htmlNode.parentNode.childNodes[0], "celllabel");
                apf.setStyleClass(htmlNode.parentNode.childNodes[1], "cellselected");
                
                var type     = this.selected.getAttribute("type");
                var multiple = this.selected.getAttribute("multiple") == "multiple";
            }
            else {
                var type     = h.type;
                var multiple = false;

                apf.setStyleClass(htmlNode, "cellselected");
            }
            
            if (apf.popup.isShowing(this.uniqueId))
                apf.popup.forceHide();
            
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
            apf.setStyleClass(htmlNode, "cellselected");
            
            if (apf.popup.isShowing(this.uniqueId))
                apf.popup.forceHide();
            
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
    var diffX, diffY, multiple, lastDragNode;
    this.$showDragIndicator = function(sel, e){
        multiple = sel.length > 1;
        
        if (multiple) {
            diffX = e.scrollX;
            diffY = e.scrollY;
        }
        else {
            diffX = -1 * e.offsetX;
            diffY = -1 * e.offsetY;
        }
        
        var prefix = this.oDrag.className.split(" ")[0]
        this.$setStyleClass(this.oDrag, multiple
            ? prefix + "_multiple" : "", [prefix + "_multiple"]);

        if (multiple) {
            document.body.appendChild(this.oDrag);
            return this.oDrag;
        }
        else {
            if (lastDragNode)
                apf.destroyHtmlNode(lastDragNode);
            
            var sel = this.$selected || this.$indicator;
            var oDrag = document.body.appendChild(sel.cloneNode(true));
            oDrag.style.position = "absolute";
            oDrag.style.width    = sel.offsetWidth + "px";
            oDrag.style.display  = "none";
            oDrag.removeAttribute("id");
            this.$setStyleClass(oDrag, "draggrid");
            var nodes = sel.childNodes;
            var dragnodes = oDrag.childNodes;
            for (var i = nodes.length - 1; i >= 0; i--)
                dragnodes[i].style.width = apf.getStyle(nodes[i], "width");
            oDrag.removeAttribute("onmousedown");
            oDrag.removeAttribute("onmouseup");
            oDrag.removeAttribute("onmouseout");
            oDrag.removeAttribute("ondblclick");
            return (lastDragNode = oDrag);
        }
    };
    
    this.$hideDragIndicator = function(success){
        var oDrag = lastDragNode || this.oDrag;
        if (!multiple && !success && oDrag.style.display == "block") {
            var pos = apf.getAbsolutePosition(this.$selected || this.$indicator);
            apf.tween.multi(oDrag, {
                anim     : apf.tween.EASEIN,
                steps    : 15,
                interval : 10,
                tweens   : [
                    {type: "left", from: oDrag.offsetLeft, to: pos[0]},
                    {type: "top",  from: oDrag.offsetTop,  to: pos[1]}
                ],
                onfinish : function(){
                    if (lastDragNode) {
                        apf.destroyHtmlNode(lastDragNode);
                        lastDragNode = null;
                    }
                    else
                        _self.oDrag.style.display = "none";
                }
            });
        }
        else if (lastDragNode) {
            apf.destroyHtmlNode(lastDragNode);
            lastDragNode = null;
        }
        else
            this.oDrag.style.display = "none";
    };
    
    this.$moveDragIndicator = function(e){
        var oDrag = lastDragNode || this.oDrag;
        oDrag.style.left = (e.clientX + diffX) + "px";// - this.oDrag.startX
        oDrag.style.top  = (e.clientY + diffY + (multiple ? 15 : 0)) + "px";// - this.oDrag.startY
    };
    
    this.$initDragDrop = function(){
        if (!this.$hasLayoutNode("dragindicator")) 
            return;

        this.oDrag = apf.xmldb.htmlImport(
            this.$getLayoutNode("dragindicator"), document.body);

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
          && !el.getAttribute(apf.xmldb.htmlIdTag)) {
            el = el.parentNode;
        }

        return (el && el.nodeType == 1 && el.getAttribute(apf.xmldb.htmlIdTag)) 
            ? el 
            : null;
    };

    var lastel;
    this.$dragout  =
    this.$dragdrop = function(el, dragdata, extra){
        if (lastel)
            this.$setStyleClass(lastel, "", ["dragDenied", "dragInsert",
                "dragAppend", "selected", "indicate"]);
        
        var sel = this.$getSelection(true);
        for (var i = 0, l = sel.length; i < l; i++) 
            this.$setStyleClass(sel[i], "selected", ["dragDenied",
                "dragInsert", "dragAppend", "indicate"]);
        
        this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Drop"]);
        
        lastel = null;
    };

    this.$dragover = function(el, dragdata, extra){
        this.$setStyleClass(this.oExt, this.baseCSSname + "Drop");
        
        //if (el == this.oExt)
            //return;

        var sel = this.$getSelection(true);
        for (var i = 0, l = sel.length; i < l; i++) 
            this.$setStyleClass(sel[i], "", ["dragDenied",
                "dragInsert", "dragAppend", "selected", "indicate"]);
        
        if (lastel)
            this.$setStyleClass(lastel, "", ["dragDenied",
                "dragInsert", "dragAppend", "selected", "indicate"]);
        
        this.$setStyleClass(lastel = this.$findValueNode(el), extra 
            ? (extra[1] && extra[1].getAttribute("action") == "insert-before" 
                ? "dragInsert" 
                : "dragAppend") 
            : "dragDenied");
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
        var newNode = apf.xmldb.getCleanCopy(dataNode);

        if (multiple != "multiple") {
            var tagName;
            
            var s = select.split("/");
            if ((tagName = s.pop()).match(/^@|^text\(\)/)) 
                tagName = s.pop();
            select = s.join("/") || null;
            
            if (tagName && tagName != newNode.tagName) {
                newNode = apf.mergeXml(newNode, 
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
        
        if (apf.popup.isShowing(this.uniqueId))
            apf.popup.hide();
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
        if (self[this.lookupaml].childNodes.length
          && self[this.lookupaml].childNodes[0].parentNode != oContainer) {
            self[this.lookupaml].detach();
            oContainer.innerHTML = "";
        }
        
        var lookupAml = self[this.lookupaml].render(oContainer);
        
        if (!apf.popup.isShowing(this.uniqueId)) {
            var mirrorNode = oHtml;
            //this.$setStyleClass(oContainer, mirrorNode.className);
            //oContainer.style.height = "auto";
            oContainer.className     = "ddamlcontainer";
            oContainer.style.display = "block";
            var height = oContainer.scrollHeight;
            oContainer.style.display = "none";
            /*oContainer.style[apf.supportOverflowComponent 
                ? "overflowY"
                : "overflow"] = "hidden";*/

            var widthdiff = apf.getWidthDiff(oContainer);
            apf.popup.show(this.uniqueId, {
                x       : -1,
                y       : (isMultiple ? mirrorNode.firstChild.firstChild.offsetHeight : mirrorNode.offsetHeight) - 1,
                animate : true,
                ref     : mirrorNode,
                width   : mirrorNode.offsetWidth - widthdiff + 4, //Math.max(self[this.lookupaml].minwidth, 
                height  : height,
                callback: function(){
                    oContainer.style.height = "auto";
                    /*oContainer.style[apf.supportOverflowComponent 
                        ? "overflowY"
                        : "overflow"] = "auto";*/
                }
            });
        }
        
        this.selected.setAttribute("a_lastsearch", value);
        
        this.dispatchEvent("afterlookup", {
            value    : value,
            xmlNode  : this.selected,
            htmlNode : oHtml,
            nodes    : lookupAml
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
                    this.$lookup(this.selected.getAttribute("a_lastsearch") || "", isMultiple);
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
                ? apf.createNodeFromXpath(this.xmlData, this.selected.getAttribute("select"))
                : 
            */
            return this.xmlData.selectSingleNode(this.selected.getAttribute("select")) ||
              this.selected.getAttribute("lookup") && apf.getXml("<stub />");
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
                    ? apf.createNodeFromXpath(this.xmlData, sel)
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
     * @param {Number} hid the heading number; this number is based on the sequence of the column elements.
     */
    this.sortColumn = function(hid){
        var h;
        
        if (hid == lastSorted) {
            apf.setStyleClass(headings[hid].htmlNode, 
                this.toggleSortOrder()
                    ? "ascending"
                    : "descending", ["descending", "ascending"]);
            return;
        }

        if (typeof lastSorted != "undefined") {
            h = headings[lastSorted];
            apf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "background", "white"); //This breaks row coloring
            apf.setStyleClass(h.htmlNode, "", ["descending", "ascending"]);
        }
        
        h = headings[hid];
        apf.setStyleRule("." + this.baseCSSname + " .records ." + h.className, "background", "#f3f3f3");
        apf.setStyleClass(h.htmlNode, "ascending", ["descending", "ascending"]);
        
        this.resort({
            order : "ascending",
            xpath : h.select
            //type : 
        });
        
        lastSorted = hid;
    };
    
    /** 
     * Resizes a column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the column elements. 
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
                apf.setStyleRule("." + this.baseCSSname + " .headings ."
                    + n.className, "width", n.width + "%"); //Set
                apf.setStyleRule("." + this.baseCSSname + " .records ."
                    + n.className, "width", n.width + "%", null, this.oWin); //Set
            }
            
            h.width = newPerc;
            apf.setStyleRule("." + this.baseCSSname + " .headings ."
                + h.className, "width", h.width + "%"); //Set
            apf.setStyleRule("." + this.baseCSSname + " .records ."
                + h.className, "width", h.width + "%", null, this.oWin); //Set
        }
        else {
            var diff = newsize - h.width;
            h.width = newsize;
            if (apf.isIE && this.oIframe)
                h.htmlNode.style.width = newsize + "px";
            else
                apf.setStyleRule("." + this.baseCSSname + " .headings ."
                    + h.className, "width", newsize + "px"); //Set
            apf.setStyleRule("." + this.baseCSSname + " .records ."
                + h.className, "width", newsize + "px", null, this.oWin); //Set
            
            var hFirst = headings[this.$first];
            this.$fixed += diff;
            var vLeft = (this.$fixed + 5) + "px";

            if (!this.$isFixedGrid) {
                //apf.setStyleRule("." + this.baseCSSname + " .headings ." + hFirst.className, "marginLeft", "-" + vLeft); //Set
                //apf.setStyleRule("." + this.baseCSSname + " .records ." + hFirst.className, "marginLeft", "-" + vLeft); //Set
                apf.setStyleRule("." + this.baseCSSname + " .row" + this.uniqueId, "paddingRight", vLeft, null, this.oWin); //Set
                apf.setStyleRule("." + this.baseCSSname + " .row" + this.uniqueId, "marginRight", "-" + vLeft, null, this.oWin); //Set
            
                //headings and records have same padding-right
                this.oInt.style.paddingRight  =
                this.oHead.style.paddingRight = vLeft;
            }
        }
    };

    /**
     * Hides a column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the column elements. 
     */
    this.hideColumn = function(nr){
        var h = headings[nr];
        apf.setStyleRule("." + this.baseCSSname + " .records ." + h.className,
            "visibility", "hidden", null, this.oWin);
        
        //Change percentages here
    };
    
    /**
     * Shows a hidden column.
     * @param {Number} hid      the heading number; this number is based on the sequence of the column elements. 
     */
    this.showColumn = function(nr){
        var h = headings[nr];
        apf.setStyleRule("." + this.baseCSSname + " .records ." + h.className,
            "visibility", "visible", null, this.oWin);
        
        //Change percentages here
    };
    
    /**
     * Moves a column to another position.
     * @param {Number} fromHid the heading number of the column to move; this number is based on the sequence of the column elements.
     * @param {Number} toHid   the position the column is moved to;
     */
    this.moveColumn = function(from, to){
        if (to && from == to) 
            return;
        
        var hFrom = headings[from];
        var hTo   = headings[to];
        
        var childNrFrom = apf.xmldb.getChildNumber(hFrom.htmlNode);
        var childNrTo   = hTo && apf.xmldb.getChildNumber(hTo.htmlNode);
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
            
            apf.setStyleRule("." + this.baseCSSname + " .headings ."
                + hReset.className, "marginLeft", "-5px"); //Reset
            apf.setStyleRule("." + this.baseCSSname + " .records ."
                + hReset.className, "marginLeft", "-5px"); //Reset
            
            this.$first = this.oHead.firstChild.getAttribute("hid");
            var h = headings[this.$first];
            var vLeft = "-" + (this.$fixed + 5) + "px";

            apf.setStyleRule("." + this.baseCSSname + " .headings ."
                + h.className, "marginLeft", vLeft); //Set
            apf.setStyleRule("." + this.baseCSSname + " .records ."
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
            if (apf.popup.isShowing(this.uniqueId)){
                apf.popup.forceHide();
            }
            else {
                var oContainer = editors["dropdown_container"];
                
                if (self[this.lookupaml]) 
                    self[this.lookupaml].detach();
                
                var mirrorNode = this.namevalue
                    ? oHtml.parentNode.childNodes[1]
                    : oHtml.parentNode;
                //this.$setStyleClass(oContainer, mirrorNode.className);
                oContainer.className = "propeditcontainer" + type;
                oContainer.style[apf.supportOverflowComponent 
                    ? "overflowY"
                    : "overflow"] = "hidden";
                
                var str = [],
                    s   = this.selected.selectNodes("item");
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
                        values.push(n[i].nodeValue || apf.queryValue(n[i], "."));
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
                    
                    apf.setStyleClass(target, "hover");
                };
                
                oContainer.firstChild.onmouseout = function(e){
                    if (!e) e = event;
                    var target = e.srcElement || e.target;
                    
                    if (target == this) 
                        return;
                    
                    while (target.parentNode != this)
                        target = target.parentNode;
                    
                    apf.setStyleClass(target, "", ["hover"]);
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
                            apf.setStyleClass(target, "", ["checked"]);
                        else
                            apf.setStyleClass(target, "checked");
                    }
                    else {
                        _self.rename(_self.selected, target.getAttribute("tag"));
                        apf.popup.forceHide();
                    }
                };
                
                var sel = this.selected;
                apf.popup.show(this.uniqueId, {
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
                    throw new Error(apf.formatErrorString(0, _self,
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
                    throw new Error(apf.formatErrorString(0, _self,
                        "Executing the code inside the exec property",
                        "Could not find exec by name '" + this.selected.getAttribute("exec")
                        + "'\nError: " + e.message, this.selected));
                }
                // #endif
            }
        }
        else if (!force && type == "children") {
            var select  = this.selected.getAttribute("select");
            var xmlNode = apf.createNodeFromXpath(this.xmlData, select);//newNodes
            
            this.dispatchEvent("multiedit", {
                xmlNode  : this.selected,
                dataNode : xmlNode
            });
        }
        
        if (force || "dropdown|set".indexOf(oHtml.getAttribute("type")) == -1 
          || !apf.popup.isShowing(this.uniqueId))
            this.$setStyleClass(oHtml, "", ["down"]);
    };
    
    this.$btnout = function(oHtml, force){
        if (force || "dropdown|set".indexOf(oHtml.getAttribute("type")) == -1
          || !apf.popup.isShowing(this.uniqueId))
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
        useiframe    = apf.isIE && (apf.isTrue(this.$getOption("main", "iframe")) || this.iframe);

        apf.AmlParser.parseChildren(this.$aml, null, this);
        
        //Initialize Iframe 
        if (useiframe && !this.oIframe) {
            //this.oInt.style.overflow = "hidden";
            //var sInt = this.oInt.outerHTML 
            var sClass   = this.oInt.className;
            //this.oInt.parentNode.removeChild(this.oInt);
            this.oIframe = this.oInt.appendChild(document.createElement(apf.isIE 
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
            this.oInt = this.oDoc.body;//.firstChild;
            this.oInt.className = sClass;//this.oIframe.parentNode.className;
            this.oDoc.documentElement.className = this.oExt.className;
            //this.oDoc.body.className = this.oExt.className;

            apf.skins.loadCssInWindow(this.skinName, this.oWin, this.mediaPath, this.iconPath);
            
            if (apf.isIE) //@todo this can be removed when focussing is fixed for this component
                this.$setStyleClass(this.oDoc.documentElement, this.baseCSSname + "Focus");
            
            apf.convertIframe(this.oIframe, true);

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
            
            if (apf.getStyle(this.oDoc.documentElement, apf.isIE 
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
                    apf.popup.forceHide();
            }
                        
            this.oDoc.documentElement.onscroll = 
                function(){
                    if (_self.$isFixedGrid)
                        _self.oHead.scrollLeft = _self.oDoc.documentElement.scrollLeft;
                };
        }
        else {
            if (apf.getStyle(this.oInt, apf.isIE 
              ? "overflowY" : "overflow-y") == "auto") {
                this.$resize = function(){
                    _self.oHead.style.marginRight = 
                      _self.oInt.scrollHeight > _self.oInt.offsetHeight 
                        ? "16px" : "0";
                }
                
                //#ifdef __WITH_LAYOUT
                apf.layout.setRules(this.oExt, this.uniqueId + "_datagrid",
                    "var o = apf.all[" + this.uniqueId + "];\
                     if (o) o.$resize()");
                apf.layout.activateRules(this.oExt);
                //#endif
                
                this.addEventListener("afterload", this.$resize);
                this.addEventListener("xmlupdate", this.$resize);
            }
            
            this.oInt.onmousedown = function(e){
                if (!e) e = event;
                if ((e.srcElement || e.target) == this)
                    apf.popup.forceHide();
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

            apf.setStyleClass(target, "hover", ["down"]);
        };
        
        this.oHead.onmouseup = function(e){
            if (!e) e = event;
            var target = e.srcElement || e.target;
            
            if (target == this || !apf.isChildOf(dragging, target, true)) 
                return;
            
            while (target.parentNode != this)
                target = target.parentNode;
            
            apf.setStyleClass(target, "hover", ["down"]);
            
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
            var pos   = apf.getAbsolutePosition(target),
                sLeft = _self.oHead.scrollLeft;
            var d     = e.clientX - pos[0] + sLeft;
            if (d < 4 || target.offsetWidth - d - 8 < 3) {
                var t = d < 4 && target.previousSibling || target;
                
                if (headings[t.getAttribute("hid")].resizable) {
                    pos   = apf.getAbsolutePosition(t);
                    apf.setStyleClass(_self.oPointer, "size_pointer", ["move_pointer"]);
                    _self.oPointer.style.display = "block";
                    _self.oPointer.style.left    = (t.offsetLeft - sLeft - 1) + "px";
                    _self.oPointer.style.width   = (t.offsetWidth - widthdiff + 1) + "px";
                    
                    // #ifdef __WITH_PLANE
                    apf.plane.show(_self.oPointer, null, true);
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
                        apf.plane.hide();
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
            
            apf.setStyleClass(target, "down", ["hover"]);
            
            //Moving
            if (!headings[target.getAttribute("hid")].movable) {
                document.onmouseup = function(e){
                    document.onmouseup = null;
                    dragging = false;
                };
                
                return;
            }
            
            apf.setStyleClass(_self.oPointer, "move_pointer", ["size_pointer"]);
            
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
                    var pos = apf.getAbsolutePosition(el);
                    var beforeNode = (e.clientX - pos[0] > el.offsetWidth / 2
                        ? el.nextSibling
                        : el);

                    _self.moveColumn(target.getAttribute("hid"), 
                        beforeNode ? beforeNode.getAttribute("hid") : null);
                }
                
                apf.destroyHtmlNode(copy);
            };

            document.onmousemove = function(e){
                if (!e) e = event;
                
                if (!copy) {
                    if (Math.abs(e.clientX - sX) < 3 && Math.abs(e.clientY - sY) < 3)
                        return;
                    
                    copy = target.cloneNode(true);
                    copy.style.position = "absolute";
                    var diff = apf.getWidthDiff(target);
                    copy.style.width    = (target.offsetWidth - diff
                        - widthdiff + 2) + "px";
                    copy.style.left     = target.offsetLeft;
                    copy.style.top      = target.offsetTop;
                    copy.style.margin   = 0;
                    copy.removeAttribute("hid")
                    
                    apf.setStyleClass(copy, "drag", ["ascending", "descending"]);
                    target.parentNode.appendChild(copy);
                }
                
                copy.style.top               = "-100px";
                _self.oPointer.style.display = "none";
                
                var el = document.elementFromPoint(e.clientX, e.clientY);
                if (el.parentNode == copy.parentNode) {
                    var pos = apf.getAbsolutePosition(el);
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
            
            apf.setStyleClass(target, "", ["hover", "down"]);
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
            
            var pos   = apf.getAbsolutePosition(target),
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
    this.$loadAml = function(x){
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
                    c.setAttribute("onmousedown", "apf.lookup(" + this.uniqueId
                        + ").$btndown(this, event);");
                    c.setAttribute("onmouseup", "apf.lookup(" + this.uniqueId
                        + ").$btnup(this)");
                    c.setAttribute("onmouseout", "apf.lookup(" + this.uniqueId
                        + ").$btnout(this)");
                    c.setAttribute("type", edit);
                    
                    editors[edit] = apf.xmldb.htmlImport(c, this.oInt)
                }
                else {
                    editors[edit] = c = apf.xmldb.htmlImport(c, this.oExt)
                    editors[edit].style.zIndex = 100000;
                    
                    apf.popup.setContent(this.uniqueId, editors[edit],
                        apf.skins.getCssString(this.skinName));
                    
                    //if (apf.isTrue(this.$getOption(edit, "aml")))
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
                        if (apf.isChildOf(xmlNode, _self.xmlData.selectSingleNode(s), true) ||
                            apf.isChildOf(_self.xmlData.selectSingleNode(s), xmlNode, true)){
                            lstUpdate.pushUnique(node.tagName == "field"
                                ? node.parentNode
                                : node);
                        }
                    }
                    
                    if (action == "redo-remove")
                        oParent.removeChild(xmlNode);
                    
                    for (var i = 0, l = lstUpdate.length; i < l; i++) {
                        _self.$updateNode(lstUpdate[i], 
                            apf.xmldb.findHtmlNode(lstUpdate[i], _self));
                    }*/
                    
                    if (_self.renaming)
                        _self.stopRename();
                    
                    if (_self.$lastUpdated) {
                        _self.$updateNode(_self.$lastUpdated, 
                            apf.xmldb.findHtmlNode(_self.$lastUpdated, _self));
                        _self.$lastUpdated = null
                    }
                    else {
                        var nodes = _self.getTraverseNodes();
                        for (var i = 0, l = nodes.length; i < l; i++) {
                            _self.$updateNode(nodes[i], 
                                apf.xmldb.findHtmlNode(nodes[i], _self));
                        }
                    }
                                        
                    _self.dispatchEvent("xmlupdate", {
                        action : action,
                        xmlNode: xmlNode
                    });
                }
            };
            changeListener.uniqueId = apf.all.push(changeListener) - 1;
            
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
                        apf.xmldb.addNodeListener(xmlRoot, changeListener);

                    apf.setModel(template, {
                        $xmlUpdate : function(){
                            //debugger;
                        },
                        
                        load: function(xmlNode){
                            if (!xmlNode || this.isLoaded)
                                return;

                            // retrieve the cacheId
                            if (!cacheId) {
                                cacheId = xmlNode.getAttribute(apf.xmldb.xmlIdTag) ||
                                    apf.xmldb.nodeConnect(apf.xmldb.getXmlDocId(xmlNode), xmlNode);
                            }

                            if (!_self.isCached(cacheId)) {
                                _self.$_load(xmlNode);
                            }
                            else {
                                //this.xmlRoot = null;
                                _self.$_load(xmlNode);
                                
                                var nodes = _self.getTraverseNodes();
                                for (var s, i = 0, htmlNode, l = nodes.length; i < l; i++) {
                                    htmlNode = apf.xmldb.findHtmlNode(nodes[i], _self);
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
        apf.popup.removeContent(this.uniqueId);
        
        //@todo destroy this.oTxt here
        
        if (editors["dropdown_container"]) {
            editors["dropdown_container"].onmouseout  =
            editors["dropdown_container"].onmouseover = 
            editors["dropdown_container"].onmousedown = null;
        }
        
        apf.destroyHtmlNode(this.oDrag);
        this.oDrag = this.oExt.onclick = this.oInt.onresize = null;
        
        //#ifdef __WITH_LAYOUT
        apf.layout.removeRule(this.oInt, "dg" + this.uniqueId);
        apf.layout.activateRules(this.oInt);
        //#endif
    };
    
    this.counter = 0;
}).implement(
    //#ifdef __WITH_RENAME
    apf.Rename,
    //#endif
    //#ifdef __WITH_DRAGDROP
    apf.DragDrop,
    //#endif
    apf.MultiSelect,
    apf.Cache,  
    apf.DataBinding,
    apf.Presentation
);

//#endif

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
    // #ifdef __SUPPORT_SAFARI
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
