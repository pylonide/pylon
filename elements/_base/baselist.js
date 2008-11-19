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

// #ifdef __JBASELIST || __INC_ALL
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1

/**
 * Baseclass of elements that allows the user to select one or more items
 * out of a list. (i.e. a {@link list} or {@link dropdown})
 *
 * @constructor
 * @baseclass
 *
 * @inherits jpf.MultiSelect
 * @inherits jpf.Cache
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * @inherits jpf.Validation
 * @inherits jpf.XForms
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */

jpf.BaseList = function(){
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); 
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); 
    //#endif
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif
    
    /**** Properties and Attributes ****/
    
    this.$focussable = true; // This object can get the focus
    this.multiselect = true; // Initially Disable MultiSelect
    
    /**
     * @attribute {String} fill the set of items that should be loaded into this 
     * element. A start and an end seperated by a -.
     * Example:
     * This example loads a list with items starting at 1980 and ending at 2050.
     * <code>
     *  <j:dropdown fill="1980-2050" />
     * </code>
     */
    this.$propHandlers["fill"] = function(value){
        if (value)
            this.loadFillData(this.$jml.getAttribute("fill"));
        else
            this.clear();
    }
    
    /**** Keyboard support ****/
    
    // #ifdef __WITH_KEYBOARD
    
    //Handler for a plane list
    /**
     * @todo  something goes wrong when selecting using space, doing mode="check"
     */
    this.$keyHandler = function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        var selHtml  = this.$selected || this.$indicator;
        
        if (!selHtml || this.renaming) //@todo how about allowdeselect?
            return;

        var selXml = this.indicator || this.selected;
        var oExt   = this.oExt;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.selectTemp();
            
                this.choose(selHtml);
                break;
            case 32:
                //if (ctrlKey || this.mode)
                    this.select(this.indicator, true);
                break;
            case 109:
            case 46:
                //DELETE
                if (this.disableremove) 
                    return;
            
                if (this.$tempsel)
                    this.selectTemp();
            
                this.remove(this.mode ? this.indicator : null); //this.mode != "check"
                break;
            case 36:
                //HOME
                this.select(this.getFirstTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = 0;
                break;
            case 35:
                //END
                this.select(this.getLastTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = this.oInt.scrollHeight;
                break;
            case 107:
                //+
                if (this.more)
                    this.startMore();
                break;
            case 37:
                //LEFT
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                var margin    = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var items     = Math.floor((oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                    
                var margin = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                
                node = this.getNextTraverseSelected(node, false);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop < oExt.scrollTop) {
                    oExt.scrollTop = Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                        ? 0
                        : selHtml.offsetTop - margin[0];
                }
                break;
            case 38:
                //UP
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;

                var margin    = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScroll = oExt.scrollHeight > oExt.offsetHeight;
                var items     = Math.floor((oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, false, items);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                    
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop < oExt.scrollTop) {
                    oExt.scrollTop = Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                        ? 0
                        : selHtml.offsetTop - margin[0];
                }
                break;
            case 39:
                //RIGHT
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                
                node = this.getNextTraverseSelected(node, true);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oExt.scrollTop + oExt.offsetHeight)
                    oExt.scrollTop = selHtml.offsetTop
                        - oExt.offsetHeight + selHtml.offsetHeight
                        + margin[0];
                    
                break;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin    = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScroll = oExt.scrollHeight > oExt.offsetHeight;
                var items     = Math.floor((oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                
                node = this.getNextTraverseSelected(node, true, items);
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oExt.scrollTop + oExt.offsetHeight) // - (hasScroll ? 10 : 0)
                    oExt.scrollTop = selHtml.offsetTop
                        - oExt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ (hasScroll ? 10 : 0)
                
                break;
            case 33:
                //PGUP
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin     = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScrollY = oExt.scrollHeight > oExt.offsetHeight;
                var hasScrollX = oExt.scrollWidth > oExt.offsetWidth;
                var items      = Math.floor((oExt.offsetWidth
                    - (hasScrollY ? 15 : 0)) / (selHtml.offsetWidth
                    + margin[1] + margin[3]));
                var lines      = Math.floor((oExt.offsetHeight
                    - (hasScrollX ? 15 : 0)) / (selHtml.offsetHeight
                    + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(node, false, items * lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop < oExt.scrollTop) {
                    oExt.scrollTop = Array.prototype.indexOf.call(this.getTraverseNodes(), node) < items
                        ? 0
                        : selHtml.offsetTop - margin[0];
                }
                break;
            case 34:
                //PGDN
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var margin     = jpf.getBox(jpf.getStyle(selHtml, "margin"));
                var hasScrollY = oExt.scrollHeight > oExt.offsetHeight;
                var hasScrollX = oExt.scrollWidth > oExt.offsetWidth;
                var items      = Math.floor((oExt.offsetWidth - (hasScrollY ? 15 : 0))
                    / (selHtml.offsetWidth + margin[1] + margin[3]));
                var lines      = Math.floor((oExt.offsetHeight - (hasScrollX ? 15 : 0))
                    / (selHtml.offsetHeight + margin[0] + margin[2]));
                
                node = this.getNextTraverseSelected(selXml, true, items * lines);
                if (!node)
                    node = this.getLastTraverseNode();
                if (node)
                   this.setTempSelected(node, ctrlKey, shiftKey);
                else return;
                
                selHtml = jpf.xmldb.findHTMLNode(node, this);
                if (selHtml.offsetTop + selHtml.offsetHeight
                  > oExt.scrollTop + oExt.offsetHeight) // - (hasScrollY ? 10 : 0)
                    oExt.scrollTop = selHtml.offsetTop
                        - oExt.offsetHeight + selHtml.offsetHeight
                        + margin[0]; //+ 10 + (hasScrollY ? 10 : 0)
                break;
            
            default:
                if (key == 65 && ctrlKey) {
                    this.selectAll();
                } else if (this.caption || (this.bindingRules || {})["caption"]) {
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
        return false;
    };
    
    // #endif
    
    /**** Private databinding functions ****/
    
    this.$deInitNode   = function(xmlNode, htmlNode){
        if (!htmlNode) return;

        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    }
    
    this.$updateNode   = function(xmlNode, htmlNode, noModifier){
        //Update Identity (Look)
        var elIcon = this.$getLayoutNode("item", "icon", htmlNode);
        
        if (elIcon) {
            if (elIcon.nodeType == 1)
                elIcon.style.backgroundImage = "url(" + this.iconPath
                    + this.applyRuleSetOnNode("icon", xmlNode) + ")";
            else
                elIcon.nodeValue = this.iconPath
                    + this.applyRuleSetOnNode("icon", xmlNode);
        }
        else {
            var elImage = this.$getLayoutNode("item", "image", htmlNode);//.style.backgroundImage = "url(" + this.applyRuleSetOnNode("image", xmlNode) + ")";
            if (elImage) {
                if (elImage.nodeType == 1)
                    elImage.style.backgroundImage = "url(" + this.mediaPath
                        + this.applyRuleSetOnNode("image", xmlNode) + ")";
                else
                    elImage.nodeValue = this.mediaPath
                        + this.applyRuleSetOnNode("image", xmlNode);
            }
        }

        //this.$getLayoutNode("item", "caption", htmlNode).nodeValue = this.applyRuleSetOnNode("Caption", xmlNode);
        var elCaption = this.$getLayoutNode("item", "caption", htmlNode);
        if (elCaption) {
            if (elCaption.nodeType == 1)
                elCaption.innerHTML = this.applyRuleSetOnNode("caption", xmlNode);
            else
                elCaption.nodeValue = this.applyRuleSetOnNode("caption", xmlNode);
        }
        
        htmlNode.title = this.applyRuleSetOnNode("title", xmlNode) || "";

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);

        if (cssClass || this.dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass)) {
                this.dynCssClasses.push(cssClass);
            }
        }
        // #endif

        if (!noModifier && this.$updateModifier)
            this.$updateModifier(xmlNode, htmlNode);
    }
    
    this.$moveNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;

        var oPHtmlNode = htmlNode.parentNode;
        var beforeNode = xmlNode.nextSibling
            ? jpf.xmldb.findHTMLNode(this.getNextTraverse(xmlNode), this)
            : null;

        oPHtmlNode.insertBefore(htmlNode, beforeNode);
        
        //if(this.emptyMessage && !oPHtmlNode.childNodes.length) this.setEmpty(oPHtmlNode);
    }
    
    var nodes = [];
    
    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build Row
        this.$getNewContext("item");
        var Item       = this.$getLayoutNode("item");
        var elSelect   = this.$getLayoutNode("item", "select");
        var elIcon     = this.$getLayoutNode("item", "icon");
        var elImage    = this.$getLayoutNode("item", "image");
        var elCheckbox = this.$getLayoutNode("item", "checkbox");
        var elCaption  = this.$getLayoutNode("item", "caption");
        
        Item.setAttribute("id", Lid);
        
        //elSelect.setAttribute("oncontextmenu", 'jpf.lookup(' + this.uniqueId + ').dispatchEvent("contextmenu", event);');
        elSelect.setAttribute("onmouseover", 'jpf.lookup(' + this.uniqueId
            + ').$setStyleClass(this, "hover");');
        elSelect.setAttribute("onmouseout", 'jpf.lookup(' + this.uniqueId
            + ').$setStyleClass(this, "", ["hover"]);'); 

        if (this.hasFeature(__RENAME__)) {
            elSelect.setAttribute("ondblclick", 'var o = jpf.lookup(' + this.uniqueId + '); ' +
                // #ifdef __WITH_RENAME
                'o.stopRename();' + 
                // #endif
                ' o.choose()');
            elSelect.setAttribute(this.itemSelectEvent || "onmousedown",
                'var o = jpf.lookup(' + this.uniqueId
                + ');if(!o.renaming && o.hasFocus() \
                  && jpf.xmldb.isChildOf(o.$selected, this, true) \
                  && o.selected) this.dorename = true;\
                  if (!o.hasFeature(__DRAGDROP__) || !event.ctrlKey)\
                      o.select(this, event.ctrlKey, event.shiftKey)');
            elSelect.setAttribute("onmouseup", 'var o = jpf.lookup(' + this.uniqueId + ');\
                if(this.dorename && o.mode == "normal")\
                    o.startDelayedRename(event); \
                this.dorename = false;\
                if (o.hasFeature(__DRAGDROP__) && event.ctrlKey)\
                    o.select(this, event.ctrlKey, event.shiftKey)');
        } 
        else {
            elSelect.setAttribute("ondblclick", 'var o = jpf.lookup('
                + this.uniqueId + '); o.choose()');
            elSelect.setAttribute(this.itemSelectEvent
                || "onmousedown", 'var o = jpf.lookup(' + this.uniqueId
                + '); o.select(this, event.ctrlKey, event.shiftKey)'); 
        }
        
        //Setup Nodes Identity (Look)
        if (elIcon) {
            if (elIcon.nodeType == 1)
                elIcon.setAttribute("style", "background-image:url("
                    + this.iconPath + this.applyRuleSetOnNode("icon", xmlNode)
                    + ")");
            else
                elIcon.nodeValue = this.iconPath
                    + this.applyRuleSetOnNode("icon", xmlNode);
        }
        else if (elImage) {
            if (elImage.nodeType == 1)
                elImage.setAttribute("style", "background-image:url(" 
                    + this.mediaPath + this.applyRuleSetOnNode("image", xmlNode)
                    + ")");
            else {
                if (jpf.isSafariOld) { //HAAAAACCCCKKKKKK!!! this should be changed... blrgh..
                    var p = elImage.ownerElement.parentNode;
                    var img = p.appendChild(p.ownerDocument.createElement("img"));
                    img.setAttribute("src", this.mediaPath
                        + this.applyRuleSetOnNode("image", xmlNode));
                }
                else {
                    elImage.nodeValue = this.mediaPath
                        + this.applyRuleSetOnNode("image", xmlNode);
                }
            }
        }
        
        if (elCaption) {
            jpf.xmldb.setNodeValue(elCaption,
                this.applyRuleSetOnNode("caption", xmlNode));
            
            //#ifdef __WITH_JML_BINDINGS
            if (this.lastRule && this.lastRule.getAttribute("parse") == "jml")
                this.doJmlParsing = true;
            //#endif
        }
        Item.setAttribute("title", this.applyRuleSetOnNode("title", xmlNode) || "");
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(Item, cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        // #endif

        if (this.$addModifier)
            this.$addModifier(xmlNode, Item);

        if (htmlParentNode)
            jpf.xmldb.htmlImport(Item, htmlParentNode, beforeNode);
        else
            nodes.push(Item);
    }
    
    this.$fill = function(){
        if (this.more && !this.moreItem) {
            this.$getNewContext("item");
            var Item      = this.$getLayoutNode("item");
            var elCaption = this.$getLayoutNode("item", "caption");
            var elSelect  = this.$getLayoutNode("item", "select");
            
            Item.setAttribute("class", "more");
            elSelect.setAttribute("onmousedown", 'jpf.lookup(' + this.uniqueId
                + ').$setStyleClass(this, "more_down");');
            elSelect.setAttribute("onmouseout", 'jpf.lookup(' + this.uniqueId
                + ').$setStyleClass(this, "", ["more_down"]);');
            elSelect.setAttribute("onmouseup", 'jpf.lookup(' + this.uniqueId
                + ').startMore(this)');
            
            if (elCaption)
                jpf.xmldb.setNodeValue(elCaption,
                    this.more.match(/caption:(.*)(;|$)/)[1]);
            nodes.push(Item);
        }
        
        jpf.xmldb.htmlImport(nodes, this.oInt);
        nodes.length = 0;

        //#ifdef __WITH_JML_BINDINGS
        if (this.doJmlParsing) {
            var x = document.createElement("div");
            while (this.oExt.childNodes.length)
                x.appendChild(this.oExt.childNodes[0]);
            Application.loadSubNode(x, this.oExt, null, null, true);    
        }
        //#endif
        
        if (this.more && !this.moreItem) {
            this.moreItem = this.oInt.lastChild;
        }
    }
    
    var lastAddedMore;
    
    /**
     * Adds a new item to the list and lets the users type in the new name.
     * This functionality is especially useful in the interface when 
     * {@link list#mode} is set to check or radio. For instance in a form.
     * @see {@link list#more}
     */
    this.startMore = function(o){
        this.$setStyleClass(o, "", ["more_down"]);
        
        var xmlNode;
        if (!this.actionRules || !this.actionRules["add"])
            xmlNode = "<j:item xmlns:j='" + jpf.ns.jpf + "' />";

        var addedNode = this.add(xmlNode);
        this.select(addedNode, null, null, null, null, true);
        this.oInt.appendChild(this.moreItem);
        
        var undoLastAction = function(){
            this.getActionTracker().undo(this.autoselect ? 2 : 1);
            
            this.removeEventListener("stoprename", undoLastAction);
            this.removeEventListener("beforerename", removeSetRenameEvent);
            this.removeEventListener("afterrename",  afterRename);
        }
        var afterRename = function(){
            //this.select(addedNode);
            this.removeEventListener("afterrename",  afterRename);
        };
        var removeSetRenameEvent = function(e){
            this.removeEventListener("stoprename", undoLastAction);
            this.removeEventListener("beforerename", removeSetRenameEvent);
            
            //There is already a choice with the same value
            var xmlNode = this.findXmlNodeByValue(e.args[1]);
            if (xmlNode || !e.args[1]) {
                this.getActionTracker().undo(this.autoselect ? 2 : 1);
                if (!this.isSelected(xmlNode))
                    this.select(xmlNode);
                this.removeEventListener("afterrename", afterRename);
                return false;
            }
        };
        
        this.addEventListener("stoprename",   undoLastAction);
        this.addEventListener("beforerename", removeSetRenameEvent);
        this.addEventListener("afterrename",  afterRename);
        
        /*if (this.mode == "radio") {
            this.moreItem.style.display = "none";
            if (lastAddedMore)
                this.removeEventListener("xmlupdate", lastAddedMore);
                
            lastAddedMore = function(){
                this.moreItem.style.display = addedNode.parentNode
                    ? "none"
                    : "block";
            };
            this.addEventListener("xmlupdate", lastAddedMore);
        }*/

        this.startDelayedRename({}, 1);
    }
    
    /**** Selection ****/
    
    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r = [];
        var nodes = this.getTraverseNodes();
        for (var f = false, i = 0; i < nodes.length; i++) {
            if (nodes[i] == xmlStartNode)
                f = true;
            if (f)
                r.push(nodes[i]);
            if (nodes[i] == xmlEndNode)
                f = false;
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
    }
    
    this.$selectDefault = function(XMLRoot){
        this.select(this.getTraverseNodes()[0]);
    }
    
    this.inherit(jpf.MultiSelect, 
                 jpf.Cache, 
                 jpf.Presentation, 
                 jpf.DataBinding);
    
    /**
     * Generates a list of items based on a string.
     * @param {String} str the description of the items. A start and an end seperated by a -.
     * Example:
     * This example loads a list with items starting at 1980 and ending at 2050.
     * <code>
     *  lst.loadFillData("1980-2050");
     * </code>
     */
    this.loadFillData = function(str){
        var parts = str.split("-");
        var start = parseInt(parts[0]);
        var end   = parseInt(parts[1]);
        
        var strData = [];
        for (var i = start; i < end + 1; i++) {
            strData.push("<item>" + (i + "")
                .pad(Math.max(parts[0].length, parts[1].length), "0")
              + "</item>");
        }
        
        if (strData.length) {
            var sNode = new jpf.smartbinding(null,
                jpf.getXmlDom("<smartbindings xmlns='" 
                    + jpf.ns.jpf
                    + "'><bindings><caption select='text()' /><value select='text()'/><traverse select='item' /></bindings><model><items>"
                    + strData.join("") + "</items></model></smartbindings>")
                  .documentElement);
            jpf.JmlParser.addToSbStack(this.uniqueId, sNode);
        }
    }
}

// #endif
