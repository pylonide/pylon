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
 * Baseclass of a List component
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.BaseList = function(){
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/

    //Options
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    this.focussable  = true; // This object can get the focus
    this.multiselect = true; // Initially Disable MultiSelect
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif

    this.__deInitNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;

        //Remove htmlNodes from tree
        htmlNode.parentNode.removeChild(htmlNode);
    }
    
    this.__updateNode = function(xmlNode, htmlNode, noModifier){
        //Update Identity (Look)
        var elIcon = this.__getLayoutNode("Item", "icon", htmlNode);
        
        if (elIcon) {
            if (elIcon.nodeType == 1)
                elIcon.style.backgroundImage = "url(" + this.iconPath
                    + this.applyRuleSetOnNode("icon", xmlNode) + ")";
            else
                elIcon.nodeValue = this.iconPath
                    + this.applyRuleSetOnNode("icon", xmlNode);
        } else {
            var elImage = this.__getLayoutNode("Item", "image", htmlNode);//.style.backgroundImage = "url(" + this.applyRuleSetOnNode("image", xmlNode) + ")";
            if (elImage) {
                if (elImage.nodeType == 1)
                    elImage.style.backgroundImage = "url(" + this.mediaPath
                        + this.applyRuleSetOnNode("image", xmlNode) + ")";
                else
                    elImage.nodeValue = this.mediaPath
                        + this.applyRuleSetOnNode("image", xmlNode);
            }
        }
            
        //this.__getLayoutNode("Item", "caption", htmlNode).nodeValue = this.applyRuleSetOnNode("Caption", xmlNode);
        var elCaption = this.__getLayoutNode("Item", "caption", htmlNode);
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
            this.__setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass))
                this.dynCssClasses.push(cssClass);
        }
        // #endif
        
        if (!noModifier && this.__updateModifier)
            this.__updateModifier(xmlNode, htmlNode);
    }
    
    this.__moveNode = function(xmlNode, htmlNode){
        if (!htmlNode) return;

        var oPHtmlNode = htmlNode.parentNode;
        var beforeNode = xmlNode.nextSibling
            ? jpf.XMLDatabase.findHTMLNode(this.getNextTraverse(xmlNode), this)
            : null;

        oPHtmlNode.insertBefore(htmlNode, beforeNode);
        
        //if(this.emptyMessage && !oPHtmlNode.childNodes.length) this.setEmpty(oPHtmlNode);
    }
    
    /* ***********************
        Keyboard Support
    ************************/
    // #ifdef __WITH_KBSUPPORT
    
    //Handler for a plane list
    /**
     * @todo  something goes wrong when selecting using space, doing mode="check"
     */
    this.__keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if (!this.__selected) return;
        //error after delete...

        switch (key) {
            case 13:
                this.select(this.indicator, true);
                this.choose(this.__selected);
                break;
            case 32:
                this.select(this.indicator, true);
                break;
            case 109:
            case 46:
            //DELETE
                if (this.disableremove) return;
            
                this.remove(null, this.mode != "check");
                break;
            case 37:
            //LEFT
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
            
                if (!this.selected && !this.indicator) return;

                var node = this.getNextTraverseSelected(this.indicator || this.selected, false);
                if (node) {
                    if (ctrlKey || this.ctrlSelect)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                
                if (this.__selected.offsetTop < this.oExt.scrollTop)
                    this.oExt.scrollTop = this.__selected.offsetTop - margin[0];
                break;
            case 38:
            //UP
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
                
                if (!this.selected && !this.indicator)
                    return;

                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items     = Math.floor((this.oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (this.__selected.offsetWidth
                    + margin[1] + margin[3]));
                var node      = this.getNextTraverseSelected(this.indicator
                    || this.selected, false, items);
                if (node) {
                    if (ctrlKey || this.ctrlSelect)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                
                if (this.__selected.offsetTop < this.oExt.scrollTop)
                    this.oExt.scrollTop = this.__selected.offsetTop - margin[0];
                break;
            case 39:
            //RIGHT
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
                
                if (!this.selected && !this.indicator) return;

                var node = this.getNextTraverseSelected(this.indicator || this.selected, true);
                if (node) {
                    if (ctrlKey || this.ctrlSelect)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                
                if (this.__selected.offsetTop + this.__selected.offsetHeight
                  > this.oExt.scrollTop + this.oExt.offsetHeight)
                    this.oExt.scrollTop = this.__selected.offsetTop
                        - this.oExt.offsetHeight + this.__selected.offsetHeight
                        + margin[0];
                    
                break;
            case 40:
            //DOWN
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
                
                if (!this.selected && !this.indicator) return;

                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items     = Math.floor((this.oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (this.__selected.offsetWidth
                    + margin[1] + margin[3]));
                var node = this.getNextTraverseSelected(this.indicator
                    || this.selected, true, items);
                if (node) {
                    if (ctrlKey || this.ctrlSelect)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                
                if (this.__selected.offsetTop + this.__selected.offsetHeight
                  > this.oExt.scrollTop + this.oExt.offsetHeight - (hasScroll ? 10 : 0))
                    this.oExt.scrollTop = this.__selected.offsetTop
                        - this.oExt.offsetHeight + this.__selected.offsetHeight
                        + 10 + (hasScroll ? 10 : 0);
                
                break;
            case 33:
            //PGUP
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
                
                if (!this.selected && !this.indicator) return;

                var hasScrollY = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var hasScrollX = this.oExt.scrollWidth > this.oExt.offsetWidth;
                var items      = Math.floor((this.oExt.offsetWidth
                    - (hasScrollY ? 15 : 0)) / (this.__selected.offsetWidth
                    + margin[1] + margin[3]));
                var lines      = Math.floor((this.oExt.offsetHeight
                    - (hasScrollX ? 15 : 0)) / (this.__selected.offsetHeight
                    + margin[0] + margin[2]));
                var node       = this.getNextTraverseSelected(this.indicator
                    || this.selected, false, items*lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                if (node) {
                    if (ctrlKey || this.ctrlSelect)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                
                if (this.__selected.offsetTop < this.oExt.scrollTop)
                    this.oExt.scrollTop = this.__selected.offsetTop - margin[0];
                break;
            case 34:
            //PGDN
                var margin = jpf.compat.getBox(jpf.getStyle(this.__selected, "margin"));
                
                if(!this.selected && !this.indicator) return;

                var hasScrollY = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var hasScrollX = this.oExt.scrollWidth > this.oExt.offsetWidth;
                var items      = Math.floor((this.oExt.offsetWidth - (hasScrollY ? 15 : 0))
                    / (this.__selected.offsetWidth + margin[1] + margin[3]));
                var lines      = Math.floor((this.oExt.offsetHeight - (hasScrollX ? 15 : 0))
                    / (this.__selected.offsetHeight + margin[0] + margin[2]));
                var node       = this.getNextTraverseSelected(this.indicator
                    || this.selected, true, items * lines);
                if (!node)
                    node = this.getLastTraverseNode();
                if (node) {
                    if (ctrlKey || this.ctrlSelect)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                
                if (this.__selected.offsetTop + this.__selected.offsetHeight
                  > this.oExt.scrollTop + this.oExt.offsetHeight - (hasScrollY ? 10 : 0))
                    this.oExt.scrollTop = this.__selected.offsetTop
                        - this.oExt.offsetHeight + this.__selected.offsetHeight
                        + 10 + (hasScrollY ? 10 : 0);
                break;
            case 36:
                //HOME
                this.select(this.getFirstTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = 0;
                //Q.scrollIntoView(true);
                break;
            case 35:
                //END
                this.select(this.getLastTraverseNode(), false, shiftKey);
                this.oInt.scrollTop = this.oInt.scrollHeight;
                //Q.scrollIntoView(true);
                break;
            case 107:
                //+
                if (this.more)
                    this.startMore();
                break;
            default:
                if (key == 65 && ctrlKey) {
                    this.selectAll();
                } else if (this.bindingRules["caption"]) {
                    if (!this.XMLRoot) return;
                    
                    //this should move to a onkeypress based function
                    if (!this.lookup || new Date().getTime()
                      - this.lookup.date.getTime() > 300)
                        this.lookup = {
                            str  : "",
                            date : new Date()
                        };
                    
                    this.lookup.str += String.fromCharCode(key);
    
                    var nodes = this.getTraverseNodes();
                    for (var v, i = 0; i < nodes.length; i++) {
                        v = this.applyRuleSetOnNode("caption", nodes[i]);
                        if (v && v.substr(0, this.lookup.str.length)
                          .toUpperCase() == this.lookup.str) {
                            if (!this.isSelected(nodes[i]))
                                this.select(nodes[i]);
                            if (this.__selected)
                                this.oInt.scrollTop = this.__selected.offsetTop
                                    - (this.oInt.offsetHeight
                                    - this.__selected.offsetHeight) / 2;
                            return;
                        }
                    }
                    return;
                }
                break;
        };
        
        this.lookup = null;
        return false;
    }
    
    // #endif
    
    /* ***********************
            DATABINDING
    ************************/
    
    this.nodes = [];
    
    this.__add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        //Build Row
        this.__getNewContext("Item");
        var Item       = this.__getLayoutNode("Item");
        var elSelect   = this.__getLayoutNode("Item", "select");
        var elIcon     = this.__getLayoutNode("Item", "icon");
        var elImage    = this.__getLayoutNode("Item", "image");
        var elCheckbox = this.__getLayoutNode("Item", "checkbox");
        var elCaption  = this.__getLayoutNode("Item", "caption");
        
        Item.setAttribute("id", Lid);
        
        //elSelect.setAttribute("oncontextmenu", 'jpf.lookup(' + this.uniqueId + ').dispatchEvent("oncontextmenu", event);');
        elSelect.setAttribute("onmouseover", 'jpf.lookup(' + this.uniqueId
            + ').__setStyleClass(this, "hover");');
        elSelect.setAttribute("onmouseout", 'jpf.lookup(' + this.uniqueId
            + ').__setStyleClass(this, "", ["hover"]);'); 

        if (this.hasFeature(__RENAME__)) {
            elSelect.setAttribute("ondblclick", 'var o = jpf.lookup(' + this.uniqueId + '); ' +
                // #ifdef __WITH_RENAME
                'o.cancelRename();' + 
                // #endif
                ' o.choose()');
            elSelect.setAttribute(this.itemSelectEvent || "onmousedown",
                'var o = jpf.lookup(' + this.uniqueId
                + ');if(!o.renaming && o.isFocussed() && jpf.XMLDatabase.isChildOf(o.__selected, this, true) && o.selected) this.dorename = true;o.select(this, event.ctrlKey, event.shiftKey)'); 
            elSelect.setAttribute("onmouseup", 'if(this.dorename) jpf.lookup('
                + this.uniqueId + ').startDelayedRename(event); this.dorename = false;');
        } else {
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
        } else if(elImage) {
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
                } else {
                    elImage.nodeValue = this.mediaPath
                        + this.applyRuleSetOnNode("image", xmlNode);
                }
            }
        }
        
        if (elCaption) {
            jpf.XMLDatabase.setNodeValue(elCaption,
                this.applyRuleSetOnNode("caption", xmlNode));
            
            //#ifdef __WITH_JML_BINDINGS
            if (this.lastRule.getAttribute("parse") == "jml")
                this.doJmlParsing = true;
            //#endif
        }
        Item.setAttribute("title", this.applyRuleSetOnNode("title", xmlNode) || "");
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass) {
            this.__setStyleClass(Item, cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        // #endif

        if (this.__addModifier)
            this.__addModifier(xmlNode, Item);

        if (htmlParentNode)
            jpf.XMLDatabase.htmlImport(Item, htmlParentNode, beforeNode);
        else
            this.nodes.push(Item);
    }
    
    this.__fill = function(){
        if (this.more && !this.moreItem) {
            this.__getNewContext("Item");
            var Item      = this.__getLayoutNode("Item");
            var elCaption = this.__getLayoutNode("Item", "caption");
            var elSelect  = this.__getLayoutNode("Item", "select");
            
            Item.setAttribute("class", "more");
            elSelect.setAttribute("onmousedown", 'jpf.lookup(' + this.uniqueId
                + ').__setStyleClass(this, "more_down");');
            elSelect.setAttribute("onmouseout", 'jpf.lookup(' + this.uniqueId
                + ').__setStyleClass(this, "", ["more_down"]);');
            elSelect.setAttribute("onmouseup", 'jpf.lookup(' + this.uniqueId
                + ').startMore(this)');
            
            if (elCaption)
                jpf.XMLDatabase.setNodeValue(elCaption,
                    this.jml.getAttribute("more").match(/Caption:(.*)(;|$)/)[1]);
            this.nodes.push(Item);
        }
        
        jpf.XMLDatabase.htmlImport(this.nodes, this.oInt);
        this.nodes.length = 0;

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
    this.startMore = function(o){
        this.__setStyleClass(o, "", ["more_down"]);
        
        var addedNode = this.add();
        this.select(addedNode, null, null, null, null, true);
        this.oInt.appendChild(this.moreItem);
        
        var undoLastAction = function(){
            this.getActionTracker().undo(this.autoselect ? 2 : 1);
            
            this.removeEventListener("oncancelrename", undoLastAction);
            this.removeEventListener("onbeforerename", removeSetRenameEvent);
            this.removeEventListener("onafterrename",  afterRename);
        }
        var afterRename = function(){
            //this.select(addedNode);
            this.removeEventListener("onafterrename",  afterRename);
        };
        var removeSetRenameEvent = function(e){
            this.removeEventListener("oncancelrename", undoLastAction);
            this.removeEventListener("onbeforerename", removeSetRenameEvent);
            
            //There is already a choice with the same value
            var xmlNode = this.findXmlNodeByValue(e.arguments[1]);
            if (xmlNode || !e.arguments[1]) {
                this.getActionTracker().undo(this.autoselect ? 2 : 1);
                if (!this.isSelected(xmlNode))
                    this.select(xmlNode);
                this.removeEventListener("onafterrename", afterRename);
                return false;
            }
        };
        
        this.addEventListener("oncancelrename", undoLastAction);
        this.addEventListener("onbeforerename", removeSetRenameEvent);
        this.addEventListener("onafterrename",  afterRename);
        
        if (this.mode == "radio") {
            this.moreItem.style.display = "none";
            if (lastAddedMore)
                this.removeEventListener("onxmlupdate", lastAddedMore);
            lastAddedMore = function(){
                this.moreItem.style.display = addedNode.parentNode
                    ? "none"
                    : "block";
                };
            this.addEventListener("onxmlupdate", lastAddedMore);
        }
        
        this.startDelayedRename({}, 1);
    }
    
    /* ***********************
                SELECT
    ************************/
    
    this.__calcSelectRange = function(xmlStartNode, xmlEndNode){
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
    
    this.__selectDefault = function(XMLRoot){
        this.select(this.getTraverseNodes()[0]);
    }
    
    /**
     * @inherits jpf.MultiSelect
     * @inherits jpf.Cache
     * @inherits jpf.Presentation
     * @inherits jpf.DataBinding
     */
    this.inherit(jpf.MultiSelect, jpf.Cache, jpf.Presentation, jpf.DataBinding);
    
    //Added XForms support
    
    /**
     * @private
     *
     * @allowchild  item, choices
     * @define  item 
     * @attribute  value  
     * @attribute  icon  
     * @attribute  image  
     * @allowchild  [cdata], label
     * @define  choices 
     * @allowchild  item
     */
    this.loadInlineData = function(x){
        var value, caption, hasImage, hasIcon, strData = [],
            nodes = ($xmlns(x, "choices", jpf.ns.jpf)[0] || x).childNodes;

        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].nodeType != 1) continue;
            if (nodes[i][jpf.TAGNAME] != "item") continue;
            
            hasIcon  = nodes[i].getAttribute("icon") || "icoAnything.gif";
            hasImage = nodes[i].getAttribute("image");
            caption  = jpf.getXmlValue(nodes[i], "label/text()|text()");// || (nodes[i].firstChild ? nodes[i].firstChild.nodeValue : "")
            value    = jpf.getXmlValue(nodes[i], "value/text()|@value|text()")
                .replace(/'/g, ""); // hack

            strData.unshift(
                "<item " + 
                (hasImage ? "image='" + hasImage + "'" : (hasIcon ? "icon='" + hasIcon + "'" : "")) + 
                " value='" + value + "'>" + caption + "</item>");

            nodes[i].parentNode.removeChild(nodes[i]);
        }

        if(strData.length){
            var sNode = new jpf.SmartBinding(null, jpf.getObject("XMLDOM",
                "<smartbindings xmlns='" + jpf.ns.jpf
                 + "'><bindings><caption select='text()' />"
                 + (hasImage ? "<image select='@image' />" : (hasIcon ? "<icon select='@icon'/>" : "")) 
                 + "<value select='@value'/><traverse select='item' /></bindings><model><items>" 
                 + strData.join("") + "</items></model></smartbindings>")
                .documentElement);
            jpf.JMLParser.addToSbStack(this.uniqueId, sNode);
        }
        
        if (x.childNodes.length)
            jpf.JMLParser.parseChildren(x, null, this);
    }
    
    this.loadFillData = function(str){
        var parts = str.split("-");
        var start = parseInt(parts[0]);
        var end   = parseInt(parts[1]);
        
        strData = [];
        for (var i = start; i < end + 1; i++) {
            strData.push("<item>" + (i + "")
                .pad(Math.max(parts[0].length, parts[1].length), "0")
              + "</item>");
        }
        
        if (strData.length) {
            var sNode = new jpf.SmartBinding(null,
                jpf.getObject("XMLDOM", "<smartbindings xmlns='" 
                    + jpf.ns.jpf
                    + "'><bindings><caption select='text()' /><value select='text()'/><traverse select='item' /></bindings><model><items>"
                    + strData.join("") + "</items></model></smartbindings>")
                  .documentElement);
            jpf.JMLParser.addToSbStack(this.uniqueId, sNode);
        }
    }
}

// #endif
