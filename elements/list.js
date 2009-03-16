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
// #ifdef __JLIST || __JSELECT || __JSELECT1 || __INC_ALL
// #define __JBASELIST 1

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
 *  <j:list multiselect="false">
 *      <j:item>The Netherlands</j:item>
 *      <j:item>United States of America</j:item>
 *      <j:item>United Kingdom</j:item>
 *      ...
 *  </j:list>
 * </code>
 * Example:
 * A databound list with items loaded from an xml file.
 * <code>
 *  <j:list model="url:users.xml" traverse="user" caption="@name" />
 * </code>
 * Example:
 * A databound list using the j:bindings element
 * <code>
 *  <j:list model="url:users.xml">
 *      <j:bindings>
 *          <j:caption  select="@name" />
 *          <j:css      select="self::node()[@type='friend']" value="friend" />
 *          <j:traverse select="users" />
 *      </j:bindings>
 *  </j:list>
 * </code>
 * Example:
 * A small product search application using a list to display results.
 * <code>
 *  <j:bar>
 *      <h1>Search for a product</h1>
 *      
 *      <j:textbox id="txtSearch" selectfocus="true" />
 *      <j:button onclick="search()" default="true" />
 *  </j:bar>
 *  
 *  <j:model id="mdlSearch" />
 *
 *  <j:list 
 *    model         = "mdlSearch"
 *    autoselect    = "false" 
 *    caching       = "false" 
 *    empty-message = "No products found">
 *      <j:bindings>
 *          <j:caption select="."><![CDATA[
 *              <h2>{title}</h2>
 *              <img src="{img}" />
 *              <p>{decs}</p>
 *          ]]></j:caption>
 *          <j:traverse select="product" />
 *      </j:bindings>
 *  </j:list>
 *
 *  <j:script>
 *      function search(){
 *          mdlSearch.loadFrom("url:search.php?keyword=" + txtSearch.getValue());
 *      }
 *  </j:script>
 * </code>
 *
 * @constructor
 * @define list, select, select1, thumbnail
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @inherits jpf.BaseList
 * @inherits jpf.Rename
 * @inherits jpf.DragDrop
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
 
jpf.thumbnail = 
jpf.select    = 
jpf.select1   = 
jpf.list      = jpf.component(jpf.NODE_VISIBLE, function(){
    var _self = this;
    
    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function(){
        if (!(this.$indicator || this.$selected))
            return;
        
        var x = this.$getLayoutNode("item", "caption", this.$indicator || this.$selected);
        if (!x) 
            return;
        return x.nodeType == 1 ? x : x.parentNode;
    };
    // #endif
    
    // #ifdef __JSUBMITFORM || __INC_ALL
    this.addEventListener("afterselect", function(e){
        if (this.hasFeature(__VALIDATION__)) 
            this.validate(true);
    });
    // #endif
    
    /**** Properties and Attributes ****/
    
    this.$supportedProperties.push("appearance", "mode", "more");
    
    /**
     * @attribute {String} appearance the type of select this element is. 
     * This is an xforms property and only available if jpf is compiled 
     * with __WITH_XFORMS set to 1.
     *   Possible values:
     *   full     depending on the tagName this element is either a list of radio options or of checked options.
     *   compact  this elements functions like a list with multiselect off.
     *   minimal  this element functions as a dropdown element.
     */
    this.$propHandlers["appearance"] = function(value){
        
    };
    
    /**
     * @attribute {String} mode Sets the way this element interacts with the user.
     *   Possible values:
     *   check  the user can select a single item from the list. The selected item is indicated.
     *   radio  the user can select multiple items from a list. Each selected item is indicated.
     */
    this.mode = "normal";
    this.$propHandlers["mode"] = function(value){
        this.mode = value || "normal";
        
        if ("check|radio".indexOf(this.mode) > -1) {
            this.allowdeselect = false;
            
            this.addEventListener("afterrename", $afterRenameMode);
            
            if (this.mode == "check") {
                this.autoselect = false;
                this.ctrlselect    = true;
            }
            else if (this.mode == "radio")
                this.multiselect = false;
            
            //if (!this.actionRules) //default disabled
                //this.actionRules = {}
        }
        else {
            //@todo undo actionRules setting
            this.ctrlselect = false;
            this.removeEventListener("afterrename", $afterRenameMode);
        }
    };
    
    function $afterRenameMode(){
        var sb = this.$getMultiBind();
        if (!sb) 
            return;
        
        //Make sure that the old value is removed and the new one is entered
        sb.$updateSelection();
        //this.reselect(this.selected);
    }
    
    //#ifdef __WITH_RENAME
    /**
     * @attribute {String} more Adds a new item to the list and lets the users 
     * type in the new name. This is especially useful in the interface when 
     * {@link #mode} is set to check or radio. For instance in a form.
     * Example:
     * This example shows a list in form offering the user several options. The
     * user can add a new option. A server script could remember the addition
     * and present it to all new users of the form.
     * <code>
     *  <j:label>Which newspapers do you read?</j:label>
     *  <j:list ref="krant" 
     *    more  = "caption:Other newspaper" 
     *    model = "mdlSuggestions:question[@key='krant']">
     *      <j:bindings>
     *          <j:caption select="text()" />
     *          <j:value select="text()" />
     *          <j:traverse select="answer" />
     *      </j:bindings>
     *      <j:actions>
     *          <j:rename select="self::node()[@custom='1']" />
     *          <j:remove select="self::node()[@custom='1']" />
     *          <j:add>
     *              <answer custom="1" />
     *          </j:add>
     *      </j:actions>
     *  </j:list>
     * </code>
     */
    this.$propHandlers["more"] = function(value){
        if (value) {
            this.delayedselect = false;
            this.addEventListener("xmlupdate", $xmlUpdate);
            //this.addEventListener("afterrename", $afterRenameMore);
            //this.addEventListener("beforeselect", $beforeSelect);
            
            this.$setClearMessage    = function(msg){
                if (!this.moreItem)
                    this.$fill();
                this.oInt.appendChild(this.moreItem);
            };
            this.$updateClearMessage = function(){}
            this.$removeClearMessage = function(){};
        }
        else {
            this.removeEventListener("xmlupdate", $xmlUpdate);
            //this.removeEventListener("afterrename", $afterRenameMore);
            //this.removeEventListener("beforeselect", $beforeSelect);
        }
    };
    
    function $xmlUpdate(e){
        if ("insert|add|synchronize|move".indexOf(e.action) > -1)
            this.oInt.appendChild(this.moreItem);
    }
    
    /*function $afterRenameMore(){
        var caption = this.applyRuleSetOnNode("caption", this.indicator)
        var xmlNode = this.findXmlNodeByValue(caption);

        var curNode = this.indicator;
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
            this.setIndicator(e.xmlNode);
            this.selected = e.xmlNode;
            debugger;
            setTimeout(function(){
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
    
    /**** Drag & Drop ****/
    
    // #ifdef __WITH_DRAGDROP
    this.$showDragIndicator = function(sel, e){
        var x = e.offsetX;
        var y = e.offsetY;
        
        this.oDrag.startX = x;
        this.oDrag.startY = y;
        
        document.body.appendChild(this.oDrag);
        this.$updateNode(this.selected, this.oDrag);
        
        return this.oDrag;
    };
    
    this.$hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    };
    
    this.$moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX - this.oDrag.startX) + "px";
        this.oDrag.style.top  = (e.clientY - this.oDrag.startY) + "px";
    };
    
    this.$initDragDrop = function(){
        if (!this.$hasLayoutNode("dragindicator")) 
            return;

        this.oDrag = jpf.xmldb.htmlImport(
            this.$getLayoutNode("dragindicator"), document.body);

        this.oDrag.style.zIndex   = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor   = "default";
        this.oDrag.style.display  = "none";
    };
    
    this.findValueNode = function(el){
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
        
        this.$setStyleClass(this.lastel = this.findValueNode(el), extra 
            ? (extra[1] && extra[1].getAttribute("operation") == "insert-before" 
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
    
    /**** Init ****/
    
    this.$draw = function(){
        this.appearance = this.$jml.getAttribute("appearance") || "compact";
        var mode = this.$jml.getAttribute("mode");
        
        if (this.tagName == "select" && (this.appearance == "full" 
          || this.appearance == "minimal") || mode == "check") {
            this.$jml.setAttribute("mode", "check");
            if (!this.$jml.getAttribute("skin"))
                this.$loadSkin("default:checklist"); //@todo use getOption here
        }
        else if (this.tagName == "select1" && this.appearance == "full"
          || mode == "radio") {
            this.$jml.setAttribute("mode", "radio");
            if (!this.$jml.getAttribute("skin")) 
                this.$loadSkin("default:radiolist"); //@todo use getOption here
        }
        else if (this.tagName == "select1" && this.appearance == "compact") 
            this.multiselect = false;
        
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        
        if (jpf.hasCssUpdateScrollbarBug && !this.mode)
            this.$fixScrollBug();
        
        this.oExt.onclick = function(e){
            _self.dispatchEvent("click", {
                htmlEvent: e || event
            });
        }
        
        //Get Options form skin
        //Types: 1=One dimensional List, 2=Two dimensional List
        this.listtype  = parseInt(this.$getOption("main", "type")) || 1;
        //Types: 1=Check on click, 2=Check independent
        this.behaviour = parseInt(this.$getOption("main", "behaviour")) || 1; 
    };
    
    this.$loadJml = function(x){
        if (this.$jml.childNodes.length) 
            this.$loadInlineData(this.$jml);
    };
    
    this.$destroy = function(){
        this.oExt.onclick = null;
        jpf.removeNode(this.oDrag);
        this.oDrag = null;
    };
}).implement(
    // #ifdef __WITH_RENAME
    jpf.Rename,
    // #endif
    // #ifdef __WITH_DRAGDROP
    jpf.DragDrop, 
    // #endif
    jpf.BaseList
);
// #endif
