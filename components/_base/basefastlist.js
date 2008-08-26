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

// #ifdef __JBASEFASTLIST || __INC_ALL
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1
// #define __WITH_SCROLLBAR 1

/**
 * Baseclass of a Fastlist component
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.BaseFastList = function(){
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

    this.scrollTo = function(xmlNode, updateScrollbar){
        this.lastScroll = xmlNode;
        
        var xNodes = this.getTraverseNodes();
        for (var j = xNodes.length - 1; j >= 0; j--) {
            if (xNodes[j] == xmlNode)
                break;
        }
        
        if (updateScrollbar) {
            this.sb.setPosition(j / (xNodes.length - this.nodeCount), true);
        }
        
        var sNodes = {}, selNodes = this.getSelection();
        for (var i = selNodes.length - 1; i >= 0; i--) {
            sNodes[selNodes[i].getAttribute(jpf.XMLDatabase.xmlIdTag)] = true;
            this.__deselect(document.getElementById(selNodes[i]
                .getAttribute(jpf.XMLDatabase.xmlIdTag) + "|" + this.uniqueId));
        }
        
        var nodes = this.oInt.childNodes;
        for(var id, i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;
            xmlNode = xNodes[j++];
            
            if (!xmlNode)
                nodes[i].style.display = "none";
            else {
                nodes[i].setAttribute(jpf.XMLDatabase.htmlIdTag,
                    xmlNode.getAttribute(jpf.XMLDatabase.xmlIdTag)
                    + "|" + this.uniqueId);
                this.__updateNode(xmlNode, nodes[i]);
                nodes[i].style.display = "block"; // or inline
                
                if (sNodes[xmlNode.getAttribute(jpf.XMLDatabase.xmlIdTag)])
                    this.__select(nodes[i]);
            }
        }
    }

    this.__updateNode = function(xmlNode, htmlNode){
        //Update Identity (Look)
        var elIcon = this.__getLayoutNode("Item", "icon", htmlNode);
        
        if (elIcon) {
            if (elIcon.nodeType == 1)
                elIcon.style.backgroundImage = "url(" + this.iconPath
                    + this.applyRuleSetOnNode("icon", xmlNode) + ")";
            else
                elIcon.nodeValue = this.iconPath + this.applyRuleSetOnNode("icon", xmlNode);
        }
        else {
            var elImage = this.__getLayoutNode("Item", "image", htmlNode);//.style.backgroundImage = "url(" + this.applyRuleSetOnNode("image", xmlNode) + ")";
            if (elImage) {
                if (elImage.nodeType == 1)
                    elImage.style.backgroundImage = "url("
                        + this.applyRuleSetOnNode("image", xmlNode) + ")";
                else
                    elImage.nodeValue = this.applyRuleSetOnNode("image", xmlNode);
            }
        }
            
        //this.__getLayoutNode("Item", "caption", htmlNode).nodeValue = this.applyRuleSetOnNode("caption", xmlNode);
        var elCaption = this.__getLayoutNode("Item", "caption", htmlNode);
        if (elCaption) {
            if (elCaption.nodeType == 1)
                elCaption.innerHTML = this.applyRuleSetOnNode("caption", xmlNode);
            else
                elCaption.nodeValue = this.applyRuleSetOnNode("caption", xmlNode);
        }

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass || this.dynCssClasses.length) {
            this.__setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass))
                this.dynCssClasses.push(cssClass);
        }
        // #endif
    }
    
    this.__moveNode = function(xmlNode, htmlNode){
        if(!htmlNode) return;

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
    this.__keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if (!this.__selected) return;
        //error after delete...
        
        var jNode = this;
        function selscroll(sel, scroll){
            if (!jNode.__selected) {
                jNode.scrollTo(scroll || sel, true);
                
                if (ctrlKey)
                    jNode.setIndicator(sel);
                else
                    jNode.select(sel, null, shiftKey);
            }
        }

        switch (key) {
            case 13:
                this.choose(this.__selected);
                break;
            case 32:
                this.select(this.indicator, true);
                break;
            case 46:
            //DELETE
                if(this.disableremove) return;
            
                this.remove(null, true);
                break;
            case 37:
            //LEFT
                var margin = jpf.getBox(jpf.getStyle(this.__selected, "margin"));
            
                if(!this.selected) return;
                var node = this.getNextTraverseSelected(this.indicator || this.selected, false);
                if (node) {
                    if(ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                    
                    if (!this.__selected)
                        selscroll(node, this.getNextTraverse(this.lastScroll, true));
                    if (!this.__selected)
                        selscroll(node, node);
                }
                break;
            case 38:
            //UP
                var margin = jpf.getBox(jpf.getStyle(this.__selected, "margin"));
                
                if (!this.selected && !this.indicator) return;

                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items     = Math.floor((this.oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (this.__selected.offsetWidth
                    + margin[1] + margin[3]));
                var node      = this.getNextTraverseSelected(this.indicator
                    || this.selected, false, items);

                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                    
                    if (!this.__selected)
                        selscroll(node, this.getNextTraverse(this.lastScroll, true));
                    if (!this.__selected)
                        selscroll(node, node);
                }
                break;
            case 39:
            //RIGHT
                var margin = jpf.getBox(jpf.getStyle(this.__selected, "margin"));
                
                if (!this.selected) return;

                var node = this.getNextTraverseSelected(this.indicator || this.selected, true);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                    
                    if (!this.__selected)
                        selscroll(node, this.getNextTraverse(this.lastScroll, true));
                    if (!this.__selected)
                        selscroll(node, node);
                }
                break;
            case 40:
            //DOWN
                var margin = jpf.getBox(jpf.getStyle(this.__selected, "margin"));
                if (!this.selected && !this.indicator) return;

                var hasScroll = this.oExt.scrollHeight > this.oExt.offsetHeight;
                var items     = Math.floor((this.oExt.offsetWidth
                    - (hasScroll ? 15 : 0)) / (this.__selected.offsetWidth
                    + margin[1] + margin[3]));
                var node = this.getNextTraverseSelected(this.indicator
                    || this.selected, true, items);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);

                    var s2 = this.getNextTraverseSelected(node, true, items);
                    if (s2 && !document.getElementById(s2.getAttribute(
                      jpf.XMLDatabase.xmlIdTag) + "|" + this.uniqueId)){
                        if (!this.__selected)
                            selscroll(node, this.getNextTraverse(this.lastScroll));
                        if (!this.__selected)
                            selscroll(node, node);
                    }
                    else if(s2 == node) {
                        var nodes = this.getTraverseNodes();
                        if (!this.__selected)
                            selscroll(node, nodes[nodes.length-this.nodeCount + 1]);
                        if (!this.__selected)
                            selscroll(node, node);
                    }
                }
                
                //if(this.__selected.offsetTop + this.__selected.offsetHeight > this.oExt.scrollTop + this.oExt.offsetHeight - (hasScroll ? 10 : 0))
                    //this.oExt.scrollTop = this.__selected.offsetTop - this.oExt.offsetHeight + this.__selected.offsetHeight + 10 + (hasScroll ? 10 : 0);
                
                break;
            case 33:
            //PGUP
                if (!this.selected && !this.indicator) return;
                
                var node = this.getNextTraverseSelected(this.indicator 
                    || this.selected, false, this.nodeCount-1);//items*lines);
                if (!node)
                    node = this.getFirstTraverseNode();
                 
                this.scrollTo(node, true);
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                break;
            case 34:
            //PGDN
                if (!this.selected && !this.indicator)
                    return;
                var node = this.getNextTraverseSelected(this.indicator
                    || this.selected, true, this.nodeCount-1);
                if (!node)
                    node = this.getLastTraverseNode();
                
                var xNodes = this.getTraverseNodes();
                for (var j = xNodes.length - 1; j >= 0; j--)
                    if(xNodes[j] == node)
                        break;

                if (j > xNodes.length - this.nodeCount - 1)
                    j = xNodes.length-this.nodeCount+1;
                this.scrollTo(xNodes[j], true);
                if (xNodes[j] != node)
                    node = xNodes[xNodes.length - 1];
                
                if (node) {
                    if (ctrlKey)
                        this.setIndicator(node);
                    else
                        this.select(node, null, shiftKey);
                }
                break;
            case 36:
                //HOME
                var xmlNode = this.getFirstTraverseNode();
                this.scrollTo(xmlNode, true);
                this.select(xmlNode, null, shiftKey);
                //this.oInt.scrollTop = 0;
                //Q.scrollIntoView(true);
                break;
            case 35:
                //END
                var nodes = this.getTraverseNodes(xmlNode || this.XMLRoot);//.selectNodes(this.ruleTraverse);
                this.scrollTo(nodes[nodes.length - this.nodeCount+1], true);
                this.select(nodes[nodes.length - 1], null, shiftKey);
                //Q.scrollIntoView(true);
                break;
            default:
                if (key == 65 && ctrlKey) {
                    this.selectAll();
                }
                else if(this.bindingRules["caption"]){
                    //this should move to a onkeypress based function
                    if(!this.lookup || new Date().getTime()
                      - this.lookup.date.getTime() > 300)
                        this.lookup = {
                            str  : "",
                            date : new Date()
                        };
                    
                    this.lookup.str += String.fromCharCode(key);
    
                    var nodes = this.getTraverseNodes();
                    for (var i = 0; i < nodes.length; i++) {
                        if(this.applyRuleSetOnNode("caption", nodes[i])
                          .substr(0, this.lookup.str.length).toUpperCase()
                          == this.lookup.str) {
                            this.scrollTo(nodes[i], true);
                            this.select(nodes[i]);
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
    
    this.nodes     = [];
    
    this.nodeCount = 0;
    this.__add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode){
        if (!this.oInt.childNodes.length)
            this.nodeCount = 0;
        
        //Check if more items should be added
        if (this.nodeCount > 9) {//this.oInt.scrollHeight >= this.oInt.offsetHeight){
            // || this.oInt.scrollWidth > this.oInt.offsetWidth
            return false;
        }
        this.nodeCount++;
        
        //Build Row
        this.__getNewContext("item");
        var Item       = this.__getLayoutNode("item");
        var elSelect   = this.__getLayoutNode("item", "select");
        var elIcon     = this.__getLayoutNode("item", "icon");
        var elImage    = this.__getLayoutNode("item", "image");
        var elCheckbox = this.__getLayoutNode("item", "checkbox");
        var elCaption  = this.__getLayoutNode("item", "caption");
        
        Item.setAttribute("id", Lid);
        
        //elSelect.setAttribute("oncontextmenu", 'jpf.lookup(' + this.uniqueId + ').dispatchEvent("oncontextmenu", event);');
        elSelect.setAttribute("ondblclick", 'jpf.lookup('
            + this.uniqueId + ').choose()');
        elSelect.setAttribute(this.itemSelectEvent || "onmousedown",
            'jpf.lookup(' + this.uniqueId
            + ').select(this, event.ctrlKey, event.shiftKey)'); 
        elSelect.setAttribute("onmouseover", 'jpf.lookup(' + this.uniqueId
            + ').__setStyleClass(this, "hover");');
        elSelect.setAttribute("onmouseout", 'jpf.lookup(' + this.uniqueId
            + ').__setStyleClass(this, "", ["hover"]);'); 
        
        //Setup Nodes Identity (Look)
        if (elIcon) {
            if (elIcon.nodeType == 1)
                elIcon.setAttribute("style", "background-image:url("
                    + this.iconPath + this.applyRuleSetOnNode("icon", xmlNode) + ")");
            else
                elIcon.nodeValue = this.iconPath + this.applyRuleSetOnNode("icon", xmlNode);
        }
        else if (elImage) {
            if (elImage.nodeType == 1)
                elImage.setAttribute("style", "background-image:url("
                    + this.applyRuleSetOnNode("image", xmlNode) + ")");
            else
                elImage.nodeValue = this.applyRuleSetOnNode("image", xmlNode);
        }
        
        if (elCaption)
            jpf.XMLDatabase.setNodeValue(elCaption,
                this.applyRuleSetOnNode("caption", xmlNode));
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass) {
            this.__setStyleClass(Item, cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        // #endif

        jpf.XMLDatabase.htmlImport(Item, htmlParentNode || this.oInt, beforeNode);
        /*
        if(htmlParentNode) jpf.XMLDatabase.htmlImport(Item, htmlParentNode || this.oInt, beforeNode);
        else this.nodes.push(Item);
        */
    }
    
    this.__fill = function(){
        //jpf.XMLDatabase.htmlImport(this.nodes, this.oInt);
        //this.nodes.length = 0;
        //alert((this == prevMainBG) + ":" + this.oInt.outerHTML + ":" + this.XMLRoot.xml);
        
        var jmlNode = this;
        this.lastScroll = this.getFirstTraverseNode();
        if (this.sb)
            this.sb.attach(this.oExt, this.nodeCount,
                this.getTraverseNodes().length, function(time, perc){
                    var nodes = jmlNode.getTraverseNodes();
                    jmlNode.scrollTo(nodes[Math.round((nodes.length-jmlNode.nodeCount+1)*perc)]);
                });
    }
    
    /* ***********************
                SELECT
    ************************/
    
    this.__calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r = [], loopNode = xmlStartNode;
        while (loopNode && loopNode != xmlEndNode.nextSibling) {
            if (this.applyRuleSetOnNode("select", loopNode, ".") !== false)
                r.push(loopNode);
            loopNode = loopNode.nextSibling;
        }

        if (r[r.length-1] != xmlEndNode) {
            var r = [], loopNode = xmlStartNode;
            while (loopNode && loopNode != xmlEndNode.previousSibling) {
                if (this.applyRuleSetOnNode("select", loopNode, ".") !== false)
                    r.push(loopNode);
                loopNode = loopNode.previousSibling;
            };
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
    
    this.loadInlineData = function(x){
        var hasIcon, strData = [], nodes = x.childNodes;

        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].nodeType != 1)
                continue;
            if (nodes[i][jpf.TAGNAME] != "item")
                continue;
            
            hasIcon = nodes[i].getAttribute("icon") || "icoAnything.gif";
            strData.unshift("<item " + (hasIcon ? "icon='" + hasIcon + "'" : "")
                + " value='" + (nodes[i].getAttributeNode("value")
                  ? nodes[i].getAttribute("value")
                  : nodes[i].firstChild.nodeValue) + "'>"
                + nodes[i].firstChild.nodeValue + "</item>");
            nodes[i].parentNode.removeChild(nodes[i]);
        }

        if (strData.length) {
            var sNode = new jpf.SmartBinding(null, jpf.getObject("XMLDOM",
                "<smartbindings xmlns='" + jpf.ns.jpf + "'>\
                    <bindings>\
                        <caption select='text()' />"
                      + (hasIcon ? "<icon select='@icon'/>" : "")
                      + "<value select='@value'/>\
                        <traverse select='item' />\
                    </bindings>\
                    <model>\
                        <items>"
                      + strData.join("") + "\
                        </items>\
                    </model>\
                </smartbindings>").documentElement);
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
            strData.push("<item>" + (i + "").pad(Math.max(parts[0].length,
                parts[1].length), "0") + "</item>");
        }
        
        if (strData.length) {
            var sNode = new jpf.SmartBinding(null, jpf.getObject("XMLDOM",
                "<smartbindings xmlns='" + jpf.ns.jpf + "'>\
                    <bindings>\
                        <caption select='text()' />\
                        <value select='text()'/>\
                        <traverse select='item' />\
                    </bindings>\
                    <model>\
                        <items>"
                         + strData.join("") + "\
                         </items>\
                     </model>\
                 </smartbindings>")
                .documentElement);
            jpf.JMLParser.addToSbStack(this.uniqueId, sNode);
        }
    }
}

// #endif
