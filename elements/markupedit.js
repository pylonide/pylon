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

// #ifdef __AMLMARKUPEDIT || __INC_ALL
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1
// #define __WITH_GANIM 1

var HAS_CHILD = 1 << 1,
    IS_CLOSED = 1 << 2,
    IS_LAST   = 1 << 3,
    IS_ROOT   = 1 << 4;

/**
 * Element for editing markup in the same way firebug provides.
 *
 * @experimental
 * @todo see if it's possible to create a tree baseclass
 * @constructor
 * @allowchild {smartbinding}
 * @addnode elements:markupedit
 *
 * @inherits apf.XForms
 * @inherits apf.MultiSelect
 * @inherits apf.Cache
 * @inherits apf.DataAction
 * @inherits apf.GuiElement
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.98.3
 * @default_private
 *
 * @binding css      Determines a css class for a node.
 * @binding empty    Determines the empty message of a node.
 */
apf.markupedit = function(struct, tagName){
    this.$init(tagName || "markupedit", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        //#ifdef __WITH_XFORMS
        //apf.XForms,
        //#endif
        //#ifdef __WITH_DATAACTION
        apf.DataAction,
        //#endif
        apf.Rename,
        apf.MultiSelect,
        apf.Cache
    );

    this.$isTreeArch  = true; // Tree Architecture for loading Data
    this.$focussable = true; // This object can get the focus
    
    this.clearMessage  = "There are no items";
    this.startClosed   = true;
    this.animType      = 0;
    this.animSteps     = 3;
    this.animSpeed     = 20;
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif
    
    var _self = this;
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    /**
     * Sets an attribute to an xml node
     *
     */
    this.setAttributeValue = function(xmlNode, name, value){
        if (!xmlNode)
            xmlNode = this.caret || this.selected;

        if (!xmlNode || xmlNode.getAttribute(name) == value) 
            return;
        
        this.$executeAction("setAttribute", [xmlNode, name, value],
            "setAttributeValue", xmlNode);
    };
    
    /**
     * Renames an attribute of an xml node
     *
     */
    this.renameAttribute = function(xmlNode, name, newName){
        if (!xmlNode)
            xmlNode = this.caret || this.selected;

        if (!xmlNode || name == newName) 
            return;
        
        this.$executeAction("multicall", [
              {func: "removeAttribute", args: [xmlNode, name]},
              {func: "setAttribute", args: [xmlNode, newName, xmlNode.getAttribute(name)]}
            ], "renameAttribute", xmlNode);
    };
    
    /**
     * Sets a text node to an xml node
     *
     */
    this.setTextNode = function(xmlNode, value){
        if (!xmlNode)
            xmlNode = this.caret || this.selected;

        if (!xmlNode || apf.queryValue(xmlNode, "text()") == value) 
            return;
        
        this.$executeAction("setTextNode", [xmlNode, value], "setTextNode", xmlNode);
    };
    
    
    /**
     * @private
     */
    this.slideToggle = function(htmlNode, force){
        if(this.noCollapse) 
            return;
        
        if (!htmlNode)
            htmlNode = this.$selected;
        
        var id = htmlNode.getAttribute(apf.xmldb.htmlIdTag);
        while (!id && htmlNode.parentNode)
            var id = (htmlNode = htmlNode.parentNode)
                .getAttribute(apf.xmldb.htmlIdTag);

        var elClass, container = this.$getLayoutNode("item", "container", htmlNode);
        if (apf.getStyle(container, "display") == "block") {
            if (force == 1) return;
            elClass = this.$getLayoutNode("item", "openclose", htmlNode);
            elClass.className = elClass.className.replace(/min/, "plus");
            this.slideClose(container, apf.xmldb.getNode(htmlNode));
        }
        else {
            if (force == 2) return;
            elClass = this.$getLayoutNode("item", "openclose", htmlNode);
            elClass.className = elClass.className.replace(/plus/, "min");
            this.slideOpen(container, apf.xmldb.getNode(htmlNode));
        }
    };
    
    var lastOpened = {};
    /**
     * @private
     */
    this.slideOpen = function(container, xmlNode, immediate){
        if (!xmlNode)
            xmlNode = this.selected;
        
        var htmlNode = apf.xmldb.findHtmlNode(xmlNode, this);
        if (!container)
            container = this.$findContainer(htmlNode);

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode)
            var p = (pNode || this.xmlRoot).getAttribute(apf.xmldb.xmlIdTag);
            if (lastOpened[p] && lastOpened[p][1] != xmlNode 
              && this.getTraverseParent(lastOpened[p][1]) == pNode) 
                this.slideToggle(lastOpened[p][0], 2);//lastOpened[p][1]);
            lastOpened[p] = [htmlNode, xmlNode];
        }
        
        container.style.display = "block";
        
        if (immediate) {
            container.style.height = "auto";
            return;
        }

        apf.tween.single(container, {
            type    : 'scrollheight', 
            from    : 0, 
            to      : container.scrollHeight, 
            anim    : this.animType, 
            steps   : this.animOpenStep,
            interval: this.animSpeed,
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
        if (this.noCollapse) 
            return;
        
        if (!xmlNode)
            xmlNode = this.selected;
        
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
            steps   : this.animCloseStep,
            interval: this.animSpeed,
            onfinish: function(container, data){
               container.style.display = "none";
            }
        });
    };

    //check databinding for how this is normally implemented
    //PROCINSTR
    this.doUpdate = function(xmlNode, container){
        var rule       = this.$getBindRule("insert", xmlNode);
        var xmlContext = rule && rule[1] 
            ? rule[1](xmlNode) 
            : null;
        
        if (rule && xmlContext) {
            this.$setLoadStatus(xmlNode, "loading");
            
            if (rule.getAttribute("get")) {
                this.getModel().$insertFrom(rule.getAttribute("get"), {
                    xmlNode     : xmlContext,
                    insertPoint : xmlContext, 
                    amlNode     : this
                });
            }
            else {
                var data = this.$applyBindRule("Insert", xmlNode);
                if (data)
                    this.insert(data, {insertPoint: xmlContext});
            }
        }
        else
            if (!this.prerender) {
                this.$setLoadStatus(xmlNode, "loading");
                var result = this.$addNodes(xmlNode, container, true); //checkChildren ???
                xmlUpdateHandler.call(this, "insert", xmlNode, result);
            }
    };
    
    /* ***********************
                Skin
    ************************/

    var treeState = {};
    treeState[0]                                     = "";
    treeState[HAS_CHILD]                             = "min";
    treeState[HAS_CHILD | IS_CLOSED]                 = "plus";
    treeState[IS_LAST]                               = "last";
    treeState[IS_LAST | HAS_CHILD]                   = "minlast";
    treeState[IS_LAST | HAS_CHILD | IS_CLOSED]       = "pluslast";
    treeState[IS_ROOT]                               = "root";

    this.fixItem = function(xmlNode, htmlNode, isDeleting, oneLeft, noChildren){
        if (!htmlNode) return;

        if (isDeleting) {
            //if isLast fix previousSibling
            var prevSib;
            if (prevSib = this.getNextTraverse(xmlNode, true))
                this.fixItem(prevSib, this.$findHtmlNode(
                    prevSib.getAttribute(apf.xmldb.xmlIdTag) + "|" 
                    + this.$uniqueId), null, true);

            //if no sibling fix parent
            if (!this.emptyMessage 
              && xmlNode.parentNode.selectNodes(this.each).length == 1) //@todo each parent??
                this.fixItem(xmlNode.parentNode, this.$findHtmlNode(
                    xmlNode.parentNode.getAttribute(apf.xmldb.xmlIdTag) 
                    + "|" + this.$uniqueId), null, false, true); 
        }
        else {
            var hasChildren, container = this.$getLayoutNode("item", "container", htmlNode);
            
            if (noChildren)
                hasChildren = false;
            else
                if (xmlNode.selectNodes(this.each).length > 0)
                    hasChildren = true;
            else
                if (this.$getBindRule("insert", xmlNode))
                    hasChildren = true;
            else
                hasChildren = false;
            
            var isClosed = hasChildren && container.style.display != "block";
            var isLast   = this.getNextTraverse(xmlNode, null, oneLeft ? 2 : 1) 
                ? false 
                : true;

            var state = (hasChildren ? HAS_CHILD : 0) | (isClosed ? IS_CLOSED : 0) 
                | (isLast ? IS_LAST : 0);
            this.$setStyleClass(this.$getLayoutNode("item", "openclose", 
                htmlNode), treeState[state], ["min", "plus", "last", "minlast", 
                "pluslast"]);
            this.$setStyleClass(this.$getLayoutNode("item", "container", 
                htmlNode), treeState[state], ["min", "plus", "last", "minlast", 
                "pluslast"]);
            
            if (!hasChildren)
                container.style.display = "none";
            
            if (state & HAS_CHILD) {
                //this.$getLayoutNode("item", "openclose", htmlNode).onmousedown = new Function('e', 'if(!e) e = event; if(e.button == 2) return;var o = apf.lookup(' + this.$uniqueId + ');o.slideToggle(this);if(o.onmousedown) o.onmousedown(e, this);apf.cancelBubble(e, o);');
                //this.$getLayoutNode("item", "icon", htmlNode)[this.opencloseaction || "ondblclick"] = new Function('var o = apf.lookup(' + this.$uniqueId + '); o.slideToggle(this);o.choose();');
                //this.$getLayoutNode("item", "select", htmlNode)[this.opencloseaction || "ondblclick"] = new Function('e', 'var o = apf.lookup(' + this.$uniqueId + '); o.slideToggle(this, true);o.choose();(e||event).cancelBubble=true;');
            }
            /*else{
                //Experimental
                this.$getLayoutNode("item", "openclose", htmlNode).onmousedown = null;
                this.$getLayoutNode("item", "icon", htmlNode)[this.opencloseaction || "ondblclick"] = null;
                this.$getLayoutNode("item", "select", htmlNode)[this.opencloseaction || "ondblclick"] = null;
            }*/
        }
    };
    
    this.startRenameThis = function(oHtml, Lid, isName){
        this.$getCaptionElement = function(){
            return oHtml;
        }
        
        var attrName = oHtml.getAttribute("aname");
        
        var xmlNode = apf.xmldb.getNodeById(Lid);
        this.$getCaptionXml = function(){ //@todo
            return attrName ? xmlNode.getAttributeNode(attrName) : xmlNode.firstChild;
        }
        
        this.getSelectFromRule = function(setname, cnode){
            return [null, attrName ? xmlNode.getAttributeNode(attrName) : xmlNode.firstChild];
        };
        
        if (isName) {
            var renCallback = function(e){
                this.removeEventListener("beforerename", renCallback, true);
                this.removeEventListener("stoprename", renRemove, true);

                if (e.args[2] == attrName)
                    return false;
                    
                var changes = [];
                changes.push({
                    func : "removeAttribute",
                    args : [xmlNode, attrName]
                });
                
                changes.push({
                    func : "setAttribute",
                    args : [xmlNode, e.args[2], xmlNode.getAttribute(attrName) || ""]
                });
                
                e.action = "multicall";
                e.args   = changes;
            };
            var renRemove = function(){
                this.removeEventListener("beforerename", renCallback, true);
                this.removeEventListener("stoprename", renRemove, true);
            };
            this.addEventListener("beforerename", renCallback, true);
            this.addEventListener("stoprename", renRemove, true);
        }
        
        this.startRename();
        
        if (isName)
            this.oTxt[apf.hasContentEditable ? "innerHTML" : "value"] = attrName;
    }
    
    /**
     * @todo  Make it xmlNode locked
     * @todo  Use escape(27) key to cancel change (see rename)
     */
    function addAttribute(pNode, name, value, htmlNode, Lid){
        _self.$getNewContext("attribute");
        var elName = _self.$getLayoutNode("attribute", "name");
        var elValue = _self.$getLayoutNode("attribute", "value");
        apf.setNodeValue(elName, name);
        apf.setNodeValue(elValue, (value.length > 50 ? "..." : value));
        if (value.length > 50)
            elValue.setAttribute("title", value);
        
        elName.setAttribute("aname", name);
        elName.setAttribute("onmousedown", "apf.lookup(" + _self.$uniqueId + ").startRenameThis(this, '" + Lid + "', true);\
            event.cancelBubble=true;");
        elName.setAttribute("onmouseup", "\
            event.cancelBubble=true;\
            return false;");
        elName.setAttribute("onkeydown", "if (event.keyCode==13) {\
              this.blur();\
              return false;\
            };\
            event.cancelBubble=true;");
        elName.setAttribute("onselectstart", "event.cancelBubble = true;");
        elName.setAttribute("ondblclick", "event.cancelBubble = true;");
        
        elValue.setAttribute("aname", name);
        elValue.setAttribute("onmousedown", "apf.lookup(" + _self.$uniqueId + ").startRenameThis(this, '" + Lid + "');\
            event.cancelBubble=true;");
        elValue.setAttribute("onmouseup", "apf.selectTextHtml(this);\
            event.cancelBubble=true;\
            return false;");
        elValue.setAttribute("onkeydown", "if (event.keyCode==13) {\
              this.blur();\
              return false;\
            };\
            event.cancelBubble=true;");
        elValue.setAttribute("onselectstart", "event.cancelBubble = true;");
        elValue.setAttribute("ondblclick", "event.cancelBubble = true;");
        
        if (pNode.style) {
            htmlNode = apf.insertHtmlNode(
                _self.$getLayoutNode("attribute"), 
                pNode, 
                _self.$getLayoutNode("item", "begintag", htmlNode).nextSibling);
            
            animHighlight(htmlNode);
            animHighlight(_self.$getLayoutNode("attribute", "name", htmlNode));
            animHighlight(_self.$getLayoutNode("attribute", "value", htmlNode));
        }
        else
            pNode.appendChild(_self.$getLayoutNode("attribute"));
    }
    
    function addTextnode(pNode, value, Lid){
        _self.$getNewContext("textnode");
        var elTextNode = _self.$getLayoutNode("textnode", "text");
        var elTag = _self.$getLayoutNode("textnode", "tag");
        apf.setNodeValue(elTextNode, (value.length > 50 ? "..." : value));
        if (value.length > 50)
            elTextNode.setAttribute("title", value);
        
        elTextNode.setAttribute("onmousedown", "apf.lookup(" + _self.$uniqueId + ").startRenameThis(this, '" + Lid + "');");
        elTextNode.setAttribute("onmouseup", "\
            event.cancelBubble=true;\
            return false;");
        elTextNode.setAttribute("onkeydown", "if (event.keyCode==13) {\
              this.blur();\
              return false;\
            };\
            event.cancelBubble=true;");
        elTextNode.setAttribute("onselectstart", "event.cancelBubble = true;");
        elTextNode.setAttribute("ondblclick", "event.cancelBubble = true;");
        
        apf.setNodeValue(elTag, "&gt;");
        
        if (pNode.style) {
            var htmlNode = apf.insertHtmlNode(
                _self.$getLayoutNode("textnode"), pNode, pNode.lastChild);
            animHighlight(_self.$getLayoutNode("textnode", "text", htmlNode));
        }
        else
            pNode.appendChild(_self.$getLayoutNode("textnode"));
    }

    //This can be optimized by NOT using getLayoutNode all the time
    this.initNode = function(xmlNode, state, Lid){
        //Setup Nodes Interaction
        this.$getNewContext("item");
        
        var hasChildren = (state & HAS_CHILD || this.emptyMessage 
            && this.$applyBindRule("empty", xmlNode));
        
        //should be restructured and combined events set per element 
        var elItem = this.$getLayoutNode("item");
        elItem.setAttribute("onmouseover", 'var o = apf.lookup(' + this.$uniqueId + ');\
            if (o.onmouseover) \
                o.onmouseover(event, this);');
        elItem.setAttribute("onmouseout", 'var o = apf.lookup(' + this.$uniqueId + ');\
            if(o.onmouseout) \
                o.onmouseout(event, this)');
        elItem.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId + ');\
            if (o.onmousedown) \
                o.onmousedown(event, this);');
        elItem.setAttribute(apf.xmldb.htmlIdTag, Lid);
        
        //Set open/close skin class & interaction
        this.$setStyleClass(this.$getLayoutNode("item", "openclose"), 
            treeState[state]);
        this.$setStyleClass(this.$getLayoutNode("item", "container"), 
            treeState[state])
        var elOpenClose = this.$getLayoutNode("item", "openclose");
        if (hasChildren)
            elOpenClose.setAttribute(this.opencloseaction || "onmousedown",
                "var o = apf.lookup(" + this.$uniqueId + ");\
                o.slideToggle(this);\
                if (o.onmousedown) \
                    o.onmousedown(event, this);\
                apf.cancelBubble(event,o);");
        
        //Select interaction
        var elSelect = this.$getLayoutNode("item", "select");
        if (hasChildren) {
            var strFunc2 = "var o = apf.lookup(" + this.$uniqueId + ");\
                o.slideToggle(this, true);";
            //if(this.opencloseaction != "onmousedown") elSelect.setAttribute(this.opencloseaction || "ondblclick", strFunc2);
        }
        //if(event.button != 1) return; 
        //apf.isChildOf(o.$selected, this) && o.selected [REMOVED THIS LINE... dunno what the repurcusions are exactly]
        elSelect.setAttribute("onmousedown", "var o = apf.lookup(" + this.$uniqueId + ");\
            apf.cancelBubble(event, o);\
            if (o.hasFocus()) \
                o.select(this);\
            if (o.onmousedown) \
                o.onmousedown(event, this);" 
            + (strFunc2 && this.opencloseaction == "onmousedown" ? strFunc2 : ""));
        //if(!elSelect.getAttribute("ondblclick")) elSelect.setAttribute("ondblclick", 'var o = apf.lookup(' + this.$uniqueId + ');o.choose();');

        //elItem.setAttribute("contextmenu", 'alert(1);var o = apf.lookup(' + this.$uniqueId + ');o.dispatchEvent("contextMenu", o.selected);');
        
        var elBegin = this.$getLayoutNode("item", "begintag");
        apf.setNodeValue(elBegin, "&lt;" + xmlNode.tagName);
        
        //attributes
        var elAttributes = this.$getLayoutNode("item", "attributes");
        var len = xmlNode.attributes.length;
        if (typeof len == "function")
            len = xmlNode.attributes.length();
        for (var i = 0; i < len; i++) {
            var attr = xmlNode.attributes.item(i);
            if (attr.nodeName.match(/a_id|a_listen|a_doc|a_loaded/))
                continue;
            
            addAttribute(elAttributes, attr.nodeName, 
                attr.nodeValue, null, Lid);
        }
        
        var elBeginTail = this.$getLayoutNode("item", "begintail");
        var elEnd = this.$getLayoutNode("item", "endtag");
        if (!(state&HAS_CHILD)) {
            elEnd.setAttribute("style", "display:none");

            if (xmlNode.childNodes.length) {
                addTextnode(elAttributes, xmlNode.childNodes[0].nodeValue, Lid);
                apf.setNodeValue(elBeginTail, "&lt;/" + xmlNode.tagName + "&gt;");
            }
            else
                apf.setNodeValue(elBeginTail, " /&gt;");
        }
        else {
            apf.setNodeValue(elEnd, "&lt;/" + xmlNode.tagName + "&gt;");
            apf.setNodeValue(elBeginTail, "&gt;");
        }
        elBeginTail.parentNode.appendChild(elBeginTail);
        
        elEnd.setAttribute("onmousedown", 'var o = apf.lookup(' + this.$uniqueId + ');apf.cancelBubble(event, o);');
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(this.$getLayoutNode("item", null, 
                this.$getLayoutNode("item")), cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        //#endif

        return this.$getLayoutNode("item");
    };
    
    this.$deInitNode = function(xmlNode, htmlNode){
        //Lookup container
        var containerNode = this.$getLayoutNode("item", "container", htmlNode);
        var pContainer    = htmlNode.parentNode;
        
        //Remove htmlNodes from tree
        containerNode.parentNode.removeChild(containerNode);
        pContainer.removeChild(htmlNode);
        
        //Fix Images (+, - and lines)
        if (xmlNode.parentNode != this.xmlRoot)
            this.fixItem(xmlNode, htmlNode, true);
        
        if (this.emptyMessage && !pContainer.childNodes.length)
            this.setEmpty(pContainer);
        
        //Fix look (tree thing)
        this.fixItem(xmlNode, htmlNode, true);
        
        if (xmlNode == this.selected)
            this.clearSelection();
        
        //this.fixItem(xmlNode.parentNode, apf.xmldb.findHtmlNode(xmlNode.parentNode, this));
        /*throw new Error();
        if(xmlNode.previousSibling) //should use each here
            this.fixItem(xmlNode.previousSibling, apf.xmldb.findHtmlNode(xmlNode.previousSibling, this));*/
    };
    
    function animHighlight(oHtml){
        if (!oHtml.offsetHeight) return;
        
        apf.setStyleClass(oHtml, "highlight");
        $setTimeout(function(){
            apf.tween.css(oHtml, "highlight", {
                anim    : 0, 
                steps   : 20, 
                interval: 30}, true);
        }, 400);
    }
    
    this.$updateNode = function(xmlNode, htmlNode){
        //Attributes
        var len, i, aLookup   = {};
        var elAttributes = this.$getLayoutNode("item", "attributes", htmlNode);
        var elEnd        = this.$getLayoutNode("item", "endtag", htmlNode);
        var elBeginTail  = this.$getLayoutNode("item", "begintail", htmlNode);

        //if (typeof len == "function")
            len = xmlNode.attributes.length;
        for (var i = 0; i < len; i++) {
            var attr = xmlNode.attributes.item(i);
            if (attr.nodeName.match(/a_id|a_listen|a_doc|a_loaded/))
                continue;
            aLookup[attr.nodeName] = attr.nodeValue;
        }

        var doneFirstChild     = false;
        var nodes = [], cnodes = elAttributes.childNodes;
        for (i = 0; i < cnodes.length; i++)
            nodes.push(cnodes[i]);
        
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1)
                continue;
            
            if (nodes[i].className.indexOf("textnode") > -1) {
                if (xmlNode.childNodes.length == 1 
                  && xmlNode.childNodes[0].nodeType == 3) {
                    var elText = this.$getLayoutNode("textnode", "text", nodes[i]);
                    if (xmlNode.firstChild.nodeValue != elText.innerHTML) {
                        elText.innerHTML = xmlNode.firstChild.nodeValue;
                        //Animate change here
                        animHighlight(elText);
                    }
                }
                else {
                    nodes[i].parentNode.removeChild(nodes[i]);//apf.removeChild here??
                    apf.setNodeValue(elBeginTail, " /&gt;");
                }
                
                doneFirstChild = true;
            }
            
            if (nodes[i].className.indexOf("attribute") == -1) 
                continue;
            
            var elName  = this.$getLayoutNode("attribute", "name", nodes[i]);
            var elValue = this.$getLayoutNode("attribute", "value", nodes[i]);
            
            //Remove attribute if it no longer exists
            var name = elName.innerHTML;
            if (!aLookup[name])
                nodes[i].parentNode.removeChild(nodes[i]);//apf.removeChild here??
            //Change it
            else if(aLookup[name] != elValue.innerHTML) {
                elValue.innerHTML = aLookup[name];
                
                animHighlight(elValue);
                //Animate change here...
                delete aLookup[name];
            } 
            else if(aLookup[name])
                delete aLookup[name];
            
            elName.setAttribute("aname", name);
            elValue.setAttribute("aname", name);
        }
        
        //Add the remaining attributes
        for (var attr in aLookup) {
            addAttribute(elAttributes, attr, aLookup[attr], htmlNode, xmlNode.getAttribute(apf.xmldb.xmlIdTag));
        }
        
        //Add textnode if its not there yet
        if (!doneFirstChild && xmlNode.childNodes.length == 1 
          && xmlNode.childNodes[0].nodeType == 3) {
            addTextnode(elAttributes, xmlNode.childNodes[0].nodeValue);
            apf.setNodeValue(elBeginTail, "</" + xmlNode.tagName + ">");
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass || this.dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass))
                this.dynCssClasses.push(cssClass);
        }
        // #endif
    };
    
    this.clearEmpty = function(container){
        container.innerHTML = "";
    };
        
    this.setEmpty = function(container){
        this.$getNewContext("empty");
        var oItem = this.$getLayoutNode("empty");
        this.$getLayoutNode("empty", "caption").nodeValue = this.emptyMessage;
        apf.insertHtmlNode(oItem, container);
        
        if (!this.startClosed) {
            if (container.style) {
                //container.style.display = "block";
                //container.style.height = "auto";
            }
            //else container.setAttribute("style", "display:block;height:auto;");
        }
    };
    
    this.$setLoading = function(xmlNode, container){
        this.$getNewContext("Loading");
        this.$setLoadStatus(xmlNode, "potential");
        apf.insertHtmlNode(this.$getLayoutNode("loading"), container);
    };
    
    this.$removeLoading = function(htmlNode){
        if (!htmlNode) return;
        this.$getLayoutNode("item", "container", htmlNode).innerHTML = "";
    };
    
    function xmlUpdateHandler(e){
        /*
            Display the animation if the item added is 
            * Not in the cache
            - Being insterted using xmlUpdate
            - there is at least 1 child inserted
        */
        
        if (e.action == "move-away")
            this.fixItem(e.xmlNode, apf.xmldb.findHtmlNode(e.xmlNode, this), true);

        if (e.action != "insert") return;
        
        var htmlNode = this.$findHtmlNode(e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)+"|"+this.$uniqueId);
        if (!htmlNode) return;
        if (this.$hasLoadStatus(e.xmlNode, "loading") && e.result.length > 0) {
            var container = this.$getLayoutNode("item", "container", htmlNode);
            this.slideOpen(container, e.xmlNode);
        }
        else
            this.fixItem(e.xmlNode, htmlNode);
        
        //Can this be removed?? (because it was added in the insert function)
        if (this.$hasLoadStatus(e.xmlNode, "loading"))
            this.$setLoadStatus(e.xmlNode, "loaded");
    }
    
    this.addEventListener("xmlupdate", xmlUpdateHandler);
    
    /* ***********************
        Keyboard Support
    ************************/
    
    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode;
        var ctrlKey  = e.ctrlKey;
        var shiftKey = e.shiftKey;
        var selHtml  = this.$caret || this.$selected;
        
        if (!selHtml || this.renaming) 
            return;

        var selXml = this.caret || this.selected;
        var oExt   = this.$ext;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.$selectTemp();
            
                if (this.ctrlselect == "enter")
                    this.select(this.caret, true);
            
                this.choose(selHtml);
                break;
            case 32:
                if (ctrlKey)
                    this.select(this.caret, true);
                break;
            case 46:
                if (this.$tempsel)
                    this.$selectTemp();
            
                //DELETE
                //this.remove();
                this.remove(this.mode ? this.caret : null); //this.mode != "check"
                break;
            case 109:
            case 37:
                //LEFT
                if (this.$tempsel)
                    this.$selectTemp();
                    
                if (this.caret.selectSingleNode(this.each))
                    this.slideToggle(this.$caret || this.$selected, 2)
                break;
            case 107:
            case 39:
                //RIGHT
                if (this.$tempsel)
                    this.$selectTemp();
            
                if (this.caret.selectSingleNode(this.each))
                    this.slideToggle(this.$caret || this.$selected, 1)
                break;
            case 187:
                //+
                if (shiftKey)
                    arguments.callee(39);
            break;
            case 189:
                //-
                if (!shiftKey)
                    arguments.callee(37);
                break;
            case 38:
                //UP
                if (!selXml && !this.$tempsel) 
                    return;
                
                var node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var sNode = this.getNextTraverse(node, true);
                if (sNode) {
                    var nodes = this.getTraverseNodes(sNode);
                    
                    do {
                        var container = this.$getLayoutNode("item", "container",
                            this.$findHtmlNode(apf.xmldb.getID(sNode, this)));
                        if (container && apf.getStyle(container, "display") == "block" 
                          && nodes.length) {
                                sNode = nodes[nodes.length-1];
                        }
                        else 
                            break;
                    }
                    while (sNode && (nodes = this.getTraverseNodes(sNode)).length);
                }
                else if (this.getTraverseParent(node) == this.xmlRoot) {
                    this.dispatchEvent("selecttop");
                    return;
                }
                else
                    sNode = this.getTraverseParent(node);

                if (sNode && sNode.nodeType == 1)
                   this.$setTempSelected (sNode, ctrlKey, shiftKey);
                
                if (this.$tempsel && this.$tempsel.offsetTop < oExt.scrollTop)
                    oExt.scrollTop = this.$tempsel.offsetTop;
                
                return false;
             
                break;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var sNode = this.getFirstTraverseNode(node);
                if (sNode) {
                    var container = this.$getLayoutNode("item", "container",
                        this.$findHtmlNode(apf.xmldb.getID(node, this)));
                    if (container && apf.getStyle(container, "display") != "block")
                        sNode = null;
                }
                
                while (!sNode) {
                    var pNode = this.getTraverseParent(node);
                    if (!pNode) break;
                    
                    var i = 0;
                    var nodes = this.getTraverseNodes(pNode);
                    while (nodes[i] && nodes[i] != node)
                        i++;
                    sNode = nodes[i+1];
                    node  = pNode;
                }
                
                if (sNode && sNode.nodeType == 1)
                   this.$setTempSelected (sNode, ctrlKey, shiftKey);
                
                if (this.$tempsel && this.$tempsel.offsetTop + this.$tempsel.offsetHeight
                  > oExt.scrollTop + oExt.offsetHeight)
                    oExt.scrollTop = this.$tempsel.offsetTop 
                        - oExt.offsetHeight + this.$tempsel.offsetHeight + 10;
                
                return false;
                break;
            case 33: //@todo
                //PGUP
                break;
            case 34: //@todo
                //PGDN
                break;
            case 36: //@todo
                //HOME
                break;
            case 35: //@todo
                //END
                break;
        }
    }, true);
    // #endif
    
    /* ***********************
            DATABINDING
    ************************/

    var nodes = [];

    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode, isLast){
        //Why is this function called 3 times when adding one node? (hack/should)
        var loadChildren = this.$getBindRule("insert", xmlNode) ? true : false;
        var hasChildren  = (loadChildren 
            || xmlNode.selectSingleNode(this.each)) ? true : false;
        
        var startClosed  = this.startClosed;// || this.$applyBindRule("collapse", xmlNode, ".") !== false;
        var state        = (hasChildren ? HAS_CHILD : 0) 
            | (startClosed && hasChildren  || loadChildren ? IS_CLOSED : 0) 
            | (isLast ? IS_LAST : 0);

        var htmlNode     = this.initNode(xmlNode, state, Lid);
        var container    = this.$getLayoutNode("item", "container");
        if (!startClosed && !this.noCollapse)
            container.setAttribute("style", "overflow:visible;height:auto;display:block;");
        
        //TEMP on for dynamic subloading
        if (!hasChildren || loadChildren)
            container.setAttribute("style", "display:none;");
        
        //Dynamic SubLoading (Insertion) of SubTree
        if (loadChildren && !this.$hasLoadStatus(xmlNode))
            this.$setLoading(xmlNode, container);
        else if(!this.getTraverseNodes(xmlNode).length 
          && this.$applyBindRule("empty", xmlNode))
            this.setEmpty(container);

        if (!htmlParentNode && (xmlParentNode == this.xmlRoot 
          || xmlNode == this.xmlRoot)) {
            nodes.push(htmlNode);
            if (!apf.isChildOf(htmlNode, container, true))
                nodes.push(container);
            
            this.$setStyleClass(htmlNode,  "root");
            this.$setStyleClass(container, "root");
            
            //if(xmlNode == xmlParentNode) return container;
        }
        else {
            if (!htmlParentNode) {
                htmlParentNode = apf.xmldb.findHtmlNode(xmlNode.parentNode, this);
                htmlParentNode = htmlParentNode 
                    ? this.$getLayoutNode("item", "container", htmlParentNode) 
                    : this.$int;
            }
            
            if (htmlParentNode == this.$int) {
                this.$setStyleClass(htmlNode,  "root");
                this.$setStyleClass(container, "root");
                
                if (this.renderRoot) {
                    var realParent = apf.xmldb.findHtmlNode(this.xmlRoot, this);
                    htmlParentNode = this.$getLayoutNode("item", "container", realParent);
                }
            }
            
            if (!beforeNode && this.getNextTraverse(xmlNode))
                beforeNode = apf.xmldb.findHtmlNode(this.getNextTraverse(xmlNode), this);
            if (beforeNode && beforeNode.parentNode != htmlParentNode)
                beforeNode = null;

            if (htmlParentNode.style && this.getTraverseNodes(xmlNode.parentNode).length == 1) 
                this.clearEmpty(htmlParentNode);
        
            //alert("|" + htmlNode.nodeType + "-" + htmlParentNode.nodeType + "-" + beforeNode + ":" + container.nodeType);
            //Insert Node into Tree
            if (htmlParentNode.style) {
                var q = apf.insertHtmlNode(htmlNode, htmlParentNode, beforeNode);
                animHighlight(this.$getLayoutNode("item", "select", q));
                
                if (!apf.isChildOf(htmlNode, container, true)) 
                    var container = apf.insertHtmlNode(container, htmlParentNode, beforeNode);
            }
            else {
                htmlParentNode.insertBefore(htmlNode, beforeNode);
                if (!apf.isChildOf(htmlParentNode, container, true)) 
                    htmlParentNode.insertBefore(container, beforeNode);
            }

            //Fix parent if child is added to drawn parentNode
            if (htmlParentNode.style) {
                if(!startClosed && this.openOnAdd 
                  && htmlParentNode != this.$int 
                  && htmlParentNode.style.display != "block") 
                    this.slideOpen(htmlParentNode, xmlParentNode);
                
                //this.fixItem(xmlNode, htmlNode); this one shouldn't be called, because it should be set right at init
                this.fixItem(xmlParentNode, apf.xmldb.findHtmlNode(xmlParentNode, this));
                if (this.getNextTraverse(xmlNode, true)) { //should use each here
                    this.fixItem(this.getNextTraverse(xmlNode, true), 
                        apf.xmldb.findHtmlNode(this.getNextTraverse(xmlNode, true), this));
                }
            }
        }
        
        if (this.prerender) 
            this.$addNodes(xmlNode, container, true); //checkChildren (optimization) ???
        else
            this.$setLoadStatus(xmlNode, "potential");

        return container;
    };
    
    this.$fill = function(){
        var container;

        //Please please consider moving this to apf.databinding and make it generic.. this is a mess
        /*if(this.renderRoot){
            var htmlNode = apf.xmldb.findHtmlNode(this.xmlRoot, this);
            if(!htmlNode || htmlNode.parentNode != this.$int){
                var nodes = nodes;
                nodes = [];
                
                var Lid = apf.xmldb.nodeConnect(this.documentId, this.xmlRoot, null, this);
                var p = this.$add(this.xmlRoot, Lid, this.xmlRoot, null, null, true);
                for(var i=0;i<nodes.length;i++) p.appendChild(nodes[i]);
            }
            else{
                container = this.$getLayoutNode("item", "container", htmlNode);
            }
        }*/

        apf.insertHtmlNodes(nodes, container || this.$int);
        nodes.length = 0;
    };
    
    this.$getParentNode = function(htmlNode){
        return htmlNode 
            ? this.$getLayoutNode("item", "container", htmlNode) 
            : this.$int;
    };
    
    /* ***********************
            SELECT
    ************************/
    
    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        //should be implemented :)
        return [xmlStartNode, xmlEndNode];
    };
    
    this.$findContainer = function(htmlNode){
        return this.$getLayoutNode("item", "container", htmlNode);
    };
    
    this.multiselect = false; // Initially Disable MultiSelect
    
    this.$selectDefault = function(xmlNode){
        if (this.select(this.getFirstTraverseNode(xmlNode), null, null, null, true)) 
            return true;
        else{
            var nodes = this.getTraverseNodes(xmlNode);
            for(var i=0;i<nodes.length;i++){
                if(this.$selectDefault(nodes[i])) return true;
            }
        }
    };
    
    this.$select = function(o){
        if(!o || !o.style) return;
        this.$setStyleClass(this.$getLayoutNode("item", "class", o), "selected");
        return o;
    };

    this.$deselect = function(o){
        if(!o) return;
        this.$setStyleClass(this.$getLayoutNode("item", "class", o), "", ["selected", "indicate"]);
        return o;
    };
    
    this.$indicate = function(o){
        if(!o) return;
        this.$setStyleClass(this.$getLayoutNode("item", "class", o), "indicate");
        return o;
    };

    this.$deindicate = function(o){
        if(!o) return;
        this.$setStyleClass(this.$getLayoutNode("item", "class", o), "", ["indicate"]);
        return o;
    };
    
    /* *********
        INIT
    **********/
    //render the outer framework of this object
    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal(); 
        this.$int = this.$getLayoutNode("main", "container", this.$ext);
        this.opencloseaction = this.$getOption("Main", "openclose");
        
        //Need fix...
        //this.$ext.style.MozUserSelect = "none";

        this.$ext.onclick = function(e){
            this.host.dispatchEvent("click", {htmlEvent : e || event});
        }
    };
    
    this.$loadAml = function(x){
        this.openOnAdd   = !apf.isFalse(x.getAttribute("openonadd"));
        this.startClosed = !apf.isFalse(this.getAttribute("startclosed") 
            || this.$getOption("Main", "startclosed"));
        this.noCollapse  = apf.isTrue(this.getAttribute("nocollapse"));
        if (this.noCollapse)
            this.startClosed = false;
        this.singleopen  = apf.isTrue(this.getAttribute("singleopen"));
        this.prerender   = !apf.isFalse(this.getAttribute("prerender"));
    };
    
    this.$destroy = function(){
        this.$ext.onclick = null;
        apf.destroyHtmlNode(this.oDrag);
        this.oDrag = null;
    };
}).call(apf.markupedit.prototype = new apf.GuiElement());

apf.aml.setElement("markupdit", apf.markupedit);
// #endif
