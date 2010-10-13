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
// #ifdef __AMLLIST || __AMLSELECT || __AMLSELECT1 || __INC_ALL

/**
 * Element displaying a skinnable list of options which can be selected.
 * Selection of multiple items can be allowed. Items can be renamed
 * and removed. The list can be used as a collection of checkboxes or 
 * radiobuttons. This is especially useful for use in forms.
 * This element is one of the most often used elements. It can display lists
 * of items in a cms style interface or display a list of search results in 
 * a more website like interface.
 * Example:
 * A simple list with inline items.
 * <code>
 *  <a:list multimatch="[false]">
 *      <a:item>The Netherlands</a:item>
 *      <a:item>United States of America</a:item>
 *      <a:item>United Kingdom</a:item>
 *      ...
 *  </a:list>
 * </code>
 * Example:
 * A databound list with items loaded from an xml file.
 * <code>
 *  <a:list model="friends.xml" each="[friend]" caption="[@name]" />
 * </code>
 * Example:
 * A databound list using the bindings element
 * <code>
 *  <a:model id="mdlList">
 *      <data>
 *          <item date="2009-11-12" deleted="0"></item>
 *          <item date="2009-11-11" deleted="0"></item>
 *          <item date="2009-11-10" deleted="0"></item>
 *          <item date="2009-11-09" deleted="1"></item>
 *          <item date="2009-11-08" deleted="1"></item>
 *      </data>
 *  </a:model>
 *  <a:list id="list" width="200" height="200" model="mdlList">
 *      <a:bindings>
 *          <a:caption match="[@date]" />
 *          <a:each match="[item[not(@deleted='1')]]" />
 *      </a:bindings>
 *  </a:list>
 * </code>
 *
 * @event click Fires when a user presses a mouse button while over this element.
 *
 * @constructor
 * @define list, select, select1, thumbnail
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @inherits apf.BaseList
 * @inherits apf.Rename
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.list      = function(struct, tagName){
    this.$init(tagName || "list", apf.NODE_VISIBLE, struct);
};

/**
 * Example:
 * A small product search application using a list to display results.
 * <code>
 *  <a:bar>
 *      <h1>Search for a product</h1>
 *      <a:textbox id="txtSearch" selectfocus="true" />
 *      <a:button onclick="search()" default="true">Search</a:button>
 *  </a:bar>
 * 
 *  <a:model id="mdlSearch">
 *      <data>
 *          <item title="Title 1" src="siteimg/slideshow_img/img1_small.jpg" descr="Descr 1"></item>
 *          <item title="Title 2" src="siteimg/slideshow_img/img2_small.jpg" descr="Descr 2"></item>
 *      </data>
 *  </a:model>
 * 
 *  <a:thumbnail 
 *    model         = "mdlSearch"
 *    autoselect    = "false" 
 *    width         = "400"
 *    height        = "400"
 *    caching       = "false" 
 *    empty-message = "No products found">
 *      <a:bindings>
 *          <a:caption match="[@title]" />
 *          <a:image match="[@src]" />
 *          <a:each match="[item]" />
 *      </a:bindings>
 *  </a:thumbnail>
 * 
 *  <a:script>
 *      function search(){
 *          mdlSearch.$loadFrom("http://localhost/search.php?keyword=" + txtSearch.getValue());
 *      }
 *  </a:script>
 * </code>
 */
apf.thumbnail = function(struct, tagName){
    this.$init(tagName || "thumbnail", apf.NODE_VISIBLE, struct);
};

apf.select    = function(struct, tagName){
    this.$init(tagName || "select", apf.NODE_VISIBLE, struct);
};

apf.select1   = function(struct, tagName){
    this.$init(tagName || "selectl", apf.NODE_VISIBLE, struct);
};

(function(){
    this.morePos = "end";
    
    // #ifdef __WITH_RENAME
    if (!apf.isIphone)
        this.implement(apf.Rename);
    // #endif
    
    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function(){
        if (!(this.$caret || this.$selected))
            return;
        
        var x = this.$getLayoutNode("item", "caption", this.$caret || this.$selected);
        if (!x) 
            return;
        return x.nodeType == 1 ? x : x.parentNode;
    };
    // #endif
    
    //#ifdef __WITH_LISTGRID
    this.$selectSeries = function(e) {
        e = e || event;
        //e.cancelBubble = true;
        var target = e.target || e.srcElement;

        if (e.type == "mouseover") {
            var target = (target.className || "").indexOf("item") != -1 
                ? target 
                : target.parentNode;
                
            this.highlight(target);
        }
        else {
            target = e.toElement 
                ? e.toElement 
                : (e.relatedTarget 
                    ? e.relatedTarget 
                    : null);
            
            if (!apf.isChildOf(this.$ext, target, true)) {
                this.highlight(this.$selected);
            }
        }
    };
    
    this.highlight = function(target) {
        var options     = this.$ext.childNodes;
        var options_len = options.length;
        var deselect    = false;

        for (var i = 0; i < options_len; i++) {
            if ((options[i].className || "").indexOf("item") != -1) {
                if (!deselect) {
                    this.$setStyleClass(options[i], "selected");
                }
                else {
                    this.$setStyleClass(options[i], "", ["selected"]);
                }
                
                if (options[i] == target) {
                    deselect = true;
                }
            }
        }
    };
    // #endif
    
    
    // #ifdef __AMLSUBMITFORM || __INC_ALL
    this.addEventListener("afterselect", function(e){
        if (this.hasFeature(apf.__VALIDATION__)) 
            this.validate(true);
    });
    // #endif
    
    /**** Properties and Attributes ****/
    
    this.$supportedProperties.push("appearance", "mode", "more", "thumbsize", "morepos");
    
    this.$propHandlers["morepos"] = function(value) {
        this.morePos = value; 
    };
    
    this.$propHandlers["thumbsize"] = function(value){
        var className = this.thumbclass;
        
        if (apf.isIE) { //@todo detection??
            className = className.splitSafe(",");
            for (var i = 0; i < className.length; i++) {
                apf.setStyleRule(className[i], "width", value + "px");
                apf.setStyleRule(className[i], "height",  value + "px");
            }
            return;
        }
        
        apf.setStyleRule(className, "width", value + "px");
        apf.setStyleRule(className, "height",  value + "px");
    };
    
    
    /**
     * @attribute {String} appearance the type of select this element is. 
     * This is an xforms property and only available if apf is compiled 
     * with __WITH_XFORMS set to 1.
     *   Possible values:
     *   full     depending on the tagName this element is either a list of radio options or of checked options.
     *   compact  this elements functions like a list with multiselect off.
     *   minimal  this element functions as a dropdown element.
     */
    this.$propHandlers["appearance"] = function(value){
        
    };
    
    //#ifdef __WITH_RENAME
    /**
     * @attribute {String} more Adds a new item to the list and lets the users 
     * type in the new name. This is especially useful in the interface when 
     * {@link element.list.attribute.mode} is set to check or radio. For instance in a form.
     * Example:
     * This example shows a list in form offering the user several options. The
     * user can add a new option. A server script could remember the addition
     * and present it to all new users of the form.
     * <code>
     *  <a:model id="mdlSuggestions">
     *      <suggestions>
     *          <question key="krant">
     *              <answer>Suggestion 1</answer>
     *              <answer>Suggestion 2</answer>
     *          </question>
     *      </suggestions>
     * </a:model>
     * <a:label>Which newspapers do you read?</a:label>
     * <a:list value="[krant]" 
     *   more  = "caption:Add new suggestion" 
     *   model = "[mdlSuggestions::question[@key='krant']]">
     *     <a:bindings>
     *         <a:caption match="[text()]" />
     *         <a:value match="[text()]" />
     *         <a:each match="[answer]" />
     *     </a:bindings>
     *     <a:actions>
     *         <a:rename match="[node()[@custom='1']]" />
     *         <a:remove match="[node()[@custom='1']]" />
     *         <a:add>
     *             <answer custom="1">New Answer</answer>
     *         </a:add>
     *     </a:actions>
     *  </a:list>
     * </code>
     */
    this.$propHandlers["more"] = function(value){
        if (value) {
            this.delayedselect = false;
            this.addEventListener("xmlupdate", $xmlUpdate);
            this.addEventListener("afterload", $xmlUpdate);
            //this.addEventListener("afterrename", $afterRenameMore);
            //this.addEventListener("beforeselect", $beforeSelect);
            
            this.$addMoreItem    = function(msg){
                if (!this.moreItem)
                    this.$fill();
                if (this.morePos == "begin")
                    this.$container.insertBefore(this.moreItem, this.$container.firstChild);
                else
                    this.$container.appendChild(this.moreItem);
            };
            this.$updateClearMessage = function(){}
            this.$removeClearMessage = function(){};
        }
        else {
            this.removeEventListener("xmlupdate", $xmlUpdate);
            this.removeEventListener("afterload", $xmlUpdate);
            //this.removeEventListener("afterrename", $afterRenameMore);
            //this.removeEventListener("beforeselect", $beforeSelect);
        }
    };
    
    function $xmlUpdate(e){
        if ((!e.action || "insert|add|synchronize|move".indexOf(e.action) > -1) && this.moreItem) {
            if (this.morePos == "begin")
                this.$container.insertBefore(this.moreItem, this.$container.firstChild);
            else
                this.$container.appendChild(this.moreItem);
        }
    }
    
    /*function $afterRenameMore(){
        var caption = this.$applyBindRule("caption", this.caret)
        var xmlNode = this.findXmlNodeByValue(caption);

        var curNode = this.caret;
        if (xmlNode != curNode || !caption) {
            if (xmlNode && !this.isSelected(xmlNode)) 
                this.select(xmlNode);
            this.remove(curNode);
        }
        else 
            if (!this.isSelected(curNode)) 
                this.select(curNode);
    }
    
    function $beforeSelect(e){
        //This is a hack
        if (e.xmlNode && this.isSelected(e.xmlNode) 
          && e.xmlNode.getAttribute('custom') == '1') {
            this.setCaret(e.xmlNode);
            this.selected = e.xmlNode;
            $setTimeout(function(){
                _self.startRename()
            });
            return false;
        }
    }*/
    //#endif
    
    /**** Keyboard support ****/
    
    //#ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", this.$keyHandler, true);
    //#endif
    
    /**** Init ****/
    
    this.$draw = function(){
        this.appearance = this.getAttribute("appearance") || "compact";

        //Build Main Skin
        this.$ext = this.$getExternal();
        this.$container = this.$getLayoutNode("main", "container", this.$ext);
        
        if (apf.hasCssUpdateScrollbarBug && !this.mode)
            this.$fixScrollBug();
        
        var _self = this;
        this.$ext.onclick = function(e){
            _self.dispatchEvent("click", {
                htmlEvent: e || event
            });
        }
        
        //#ifdef __WITH_LISTGRID
        this.$gridlist = apf.isTrue(this.$getOption("main", "grid"));
        
        if (this.$gridlist) {
            this.$ext.setAttribute("onmouseout", this.$ext.getAttribute("onmouseout") 
                + ';var o = apf.lookup(' + this.$uniqueId + ');o.$selectSeries(event);');
        }
        //#endif 
        
        //Get Options form skin
        //Types: 1=One dimensional List, 2=Two dimensional List
        this.listtype  = parseInt(this.$getOption("main", "type")) || 1;
        //Types: 1=Check on click, 2=Check independent
        this.behaviour = parseInt(this.$getOption("main", "behaviour")) || 1; 
        
        this.thumbsize  = this.$getOption("main", "thumbsize");
        this.thumbclass = this.$getOption("main", "thumbclass");
    };
    
    this.$loadAml = function(x){
    };
    
    this.$destroy = function(){
        if (this.$ext)
            this.$ext.onclick = null;
        apf.destroyHtmlNode(this.oDrag);
        this.oDrag = null;
    };
}).call(apf.list.prototype = new apf.BaseList());

apf.thumbnail.prototype =
apf.select.prototype    =
apf.select1.prototype   = apf.list.prototype;

apf.aml.setElement("thumbnail", apf.thumbnail);
apf.aml.setElement("select",    apf.select);
apf.aml.setElement("select1",   apf.select1);
apf.aml.setElement("list",      apf.list);
// #endif
