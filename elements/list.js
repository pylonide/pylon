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
 *  <a:list multiselect="false">
 *      <a:item>The Netherlands</a:item>
 *      <a:item>United States of America</a:item>
 *      <a:item>United Kingdom</a:item>
 *      ...
 *  </a:list>
 * </code>
 * Example:
 * A databound list with items loaded from an xml file.
 * <code>
 *  <a:list model="url:users.xml" traverse="user" caption="@name" />
 * </code>
 * Example:
 * A databound list using the bindings element
 * <code>
 *  <a:list model="url:users.xml">
 *      <a:bindings>
 *          <a:caption  select="@name" />
 *          <a:css      select="self::node()[@type='friend']" value="friend" />
 *          <a:traverse select="users" />
 *      </a:bindings>
 *  </a:list>
 * </code>
 * Example:
 * A small product search application using a list to display results.
 * <code>
 *  <a:bar>
 *      <h1>Search for a product</h1>
 *      
 *      <a:textbox id="txtSearch" selectfocus="true" />
 *      <a:button onclick="search()" default="true" />
 *  </a:bar>
 *  
 *  <a:model id="mdlSearch" />
 *
 *  <a:list 
 *    model         = "mdlSearch"
 *    autoselect    = "false" 
 *    caching       = "false" 
 *    empty-message = "No products found">
 *      <a:bindings>
 *          <a:caption select="."><![CDATA[
 *              <h2>{title}</h2>
 *              <img src="{img}" />
 *              <p>{decs}</p>
 *          ]]></a:caption>
 *          <a:traverse select="product" />
 *      </a:bindings>
 *  </a:list>
 *
 *  <a:script>
 *      function search(){
 *          mdlSearch.loadFrom("url:search.php?keyword=" + txtSearch.getValue());
 *      }
 *  </a:script>
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
 * @inherits apf.DragDrop
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.thumbnail = 
apf.select    = 
apf.select1   = 
apf.list      = apf.component(apf.NODE_VISIBLE, function(){
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
     * This is an xforms property and only available if apf is compiled 
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
     * {@link element.list.attribute.mode} is set to check or radio. For instance in a form.
     * Example:
     * This example shows a list in form offering the user several options. The
     * user can add a new option. A server script could remember the addition
     * and present it to all new users of the form.
     * <code>
     *  <a:label>Which newspapers do you read?</a:label>
     *  <a:list ref="krant" 
     *    more  = "caption:Other newspaper" 
     *    model = "mdlSuggestions:question[@key='krant']">
     *      <a:bindings>
     *          <a:caption select="text()" />
     *          <a:value select="text()" />
     *          <a:traverse select="answer" />
     *      </a:bindings>
     *      <a:actions>
     *          <a:rename select="self::node()[@custom='1']" />
     *          <a:remove select="self::node()[@custom='1']" />
     *          <a:add>
     *              <answer custom="1" />
     *          </a:add>
     *      </a:actions>
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
            this.removeEventListener("afterload", $xmlUpdate);
            //this.removeEventListener("afterrename", $afterRenameMore);
            //this.removeEventListener("beforeselect", $beforeSelect);
        }
    };
    
    function $xmlUpdate(e){
        if (!e.action || "insert|add|synchronize|move".indexOf(e.action) > -1)
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
    var diffX, diffY, multiple;
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
        
        document.body.appendChild(this.oDrag);
        if (!multiple)
            this.$updateNode(this.selected, this.oDrag);
        
        return this.oDrag;
    };
    
    this.$hideDragIndicator = function(success){
        if (!multiple && !success) {
            var pos = apf.getAbsolutePosition(this.$selected);
            apf.tween.multi(this.oDrag, {
                anim     : apf.tween.EASEIN,
                steps    : 15,
                interval : 10,
                tweens   : [
                    {type: "left", from: this.oDrag.offsetLeft, to: pos[0]},
                    {type: "top",  from: this.oDrag.offsetTop,  to: pos[1]}
                ],
                onfinish : function(){
                    _self.oDrag.style.display = "none";
                }
            });
        }
        else
            this.oDrag.style.display = "none";
    };
    
    this.$moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX + diffX) + "px";// - this.oDrag.startX
        this.oDrag.style.top  = (e.clientY + diffY + (multiple ? 15 : 0)) + "px";// - this.oDrag.startY
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
    this.$dragout = function(dragdata){
        if (lastel)
            this.$setStyleClass(lastel, "", ["dragDenied", "dragInsert",
                "dragAppend", "selected", "indicate"]);
        
        var sel = this.$getSelection(true);
        for (var i = 0, l = sel.length; i < l; i++) 
            this.$setStyleClass(sel[i], "selected", ["dragDenied",
                "dragInsert", "dragAppend", "indicate"]);
        
        lastel = null;
    };

    this.$dragover = function(el, dragdata, extra){
        if(el == this.oExt) return;

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

    this.$dragdrop = function(el, dragdata, extra){
        if (lastel)
            this.$setStyleClass(lastel, "", 
              ["dragDenied", "dragInsert", "dragAppend", "selected", "indicate"]);
        
        var sel = this.$getSelection(true);
        for (var i = 0, l = sel.length; i < l; i++) 
            this.$setStyleClass(sel[i], "selected", ["dragDenied",
                "dragInsert", "dragAppend", "indicate"]);
        
        lastel = null;
    };
    // #endif
    
    /**** Init ****/
    
    this.$draw = function(){
        this.appearance = this.$aml.getAttribute("appearance") || "compact";
        var mode = this.$aml.getAttribute("mode");

        if (this.tagName == "select" && (this.appearance == "full" 
          || this.appearance == "minimal") || mode == "check") {
            this.$aml.setAttribute("mode", "check");
            if (!this.$aml.getAttribute("skin")) {
                this.skinName = null;
                this.skin = "checklist"
                this.$loadSkin();
            }
        }
        else if (this.tagName == "select1" && this.appearance == "full"
          || mode == "radio") {
            this.$aml.setAttribute("mode", "radio");
            if (!this.$aml.getAttribute("skin")) {
                this.skinName = null;
                this.skin = "radiolist";
                this.$loadSkin();
            }
        }
        else if (this.tagName == "select1" && this.appearance == "compact") 
            this.multiselect = false;
        
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        
        if (apf.hasCssUpdateScrollbarBug && !this.mode)
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
    
    this.$loadAml = function(x){
        if (this.$aml.childNodes.length) 
            this.$loadInlineData(this.$aml);
    };
    
    this.$destroy = function(){
        this.oExt.onclick = null;
        apf.destroyHtmlNode(this.oDrag);
        this.oDrag = null;
    };
}).implement(
    // #ifdef __WITH_RENAME
    apf.Rename,
    // #endif
    // #ifdef __WITH_DRAGDROP
    apf.DragDrop, 
    // #endif
    apf.BaseList
);
// #endif
