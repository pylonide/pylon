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

// #ifdef __JMARKUPEDIT || __INC_ALL
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1
// #define __WITH_GANIM 1

var HAS_CHILD = 1 << 1;
var IS_CLOSED = 1 << 2;
var IS_LAST   = 1 << 3;
var IS_ROOT   = 1 << 4;

/**
 * Element for editing markup in the same way firebug provides.
 *
 * @experimental
 * @todo see if it's possible to create a tree baseclass
 * @constructor
 * @allowchild {smartbinding}
 * @addnode elements:markupedit
 *
 * @inherits jpf.Validation
 * @inherits jpf.XForms
 * @inherits jpf.MultiSelect
 * @inherits jpf.Cache
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * @inherits jpf.JmlElement
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.98.3
 *
 * @binding css      Determines a css class for a node.
 * @binding empty    Determines the empty message of a node.
 */
jpf.markupedit = jpf.component(jpf.NODE_VISIBLE, function(){
    this.isTreeArch  = true; // Tree Architecture for loading Data
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
     * @action
     */
    this.setAttributeValue = function(xmlNode, name, value){
        if (!xmlNode)
            xmlNode = this.indicator || this.selected;

        if (!xmlNode || xmlNode.getAttribute(name) == value) 
            return;
        
        this.executeAction("setAttribute", [xmlNode, name, value],
            "setAttributeValue", xmlNode);
    };
    
    /**
     * Renames an attribute of an xml node
     *
     * @action
     */
    this.renameAttribute = function(xmlNode, name, newName){
        if (!xmlNode)
            xmlNode = this.indicator || this.selected;

        if (!xmlNode || name == newName) 
            return;
        
        this.executeAction("multicall", [
              {func: "removeAttribute", args: [xmlNode, name]},
              {func: "setAttribute", args: [xmlNode, newName, xmlNode.getAttribute(name)]}
            ], "renameAttribute", xmlNode);
    };
    
    /**
     * Sets a text node to an xml node
     *
     * @action
     */
    this.setTextNode = function(xmlNode, value){
        if (!xmlNode)
            xmlNode = this.indicator || this.selected;

        if (!xmlNode || jpf.getXmlValue(xmlNode, "text()") == value) 
            return;
        
        this.executeAction("setTextNode", [xmlNode, value], "setTextNode", xmlNode);
    };
    
    
    /**
     * @private
     */
    this.slideToggle = function(htmlNode, force){
        if(this.noCollapse) 
            return;
        
        if (!htmlNode)
            htmlNode = this.$selected;
        
        var id = htmlNode.getAttribute(jpf.xmldb.htmlIdTag);
        while (!id && htmlNode.parentNode)
            var id = (htmlNode = htmlNode.parentNode)
                .getAttribute(jpf.xmldb.htmlIdTag);

        var elClass, container = this.$getLayoutNode("item", "container", htmlNode);
        if (jpf.getStyle(container, "display") == "block") {
            if (force == 1) return;
            elClass = this.$getLayoutNode("item", "openclose", htmlNode);
            elClass.className = elClass.className.replace(/min/, "plus");
            this.slideClose(container, jpf.xmldb.getNode(htmlNode));
        }
        else {
            if (force == 2) return;
            elClass = this.$getLayoutNode("item", "openclose", htmlNode);
            elClass.className = elClass.className.replace(/plus/, "min");
            this.slideOpen(container, jpf.xmldb.getNode(htmlNode));
        }
    };
    
    var lastOpened = {};
    /**
     * @private
     */
    this.slideOpen = function(container, xmlNode, immediate){
        if (!xmlNode)
            xmlNode = this.selected;
        
        var htmlNode = jpf.xmldb.findHTMLNode(xmlNode, this);
        if (!container)
            container = this.$findContainer(htmlNode);

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode)
            var p = (pNode || this.xmlRoot).getAttribute(jpf.xmldb.xmlIdTag);
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

        jpf.tween.single(container, {
            type    : 'scrollheight', 
            from    : 0, 
            to      : container.scrollHeight, 
            anim    : this.animType, 
            steps   : this.animOpenStep,
            interval: this.animSpeed,
            onfinish: function(container){
                if (xmlNode && _self.hasLoadStatus(xmlNode, "potential")) {
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
        if (this.noCollapse) 
            return;
        
        if (!xmlNode)
            xmlNode = this.selected;
        
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
        var rule       = this.getNodeFromRule("insert", xmlNode, null, true);
        var xmlContext = rule 
            ? xmlNode.selectSingleNode(rule.getAttribute("select") || ".") 
            : null;
        
        if (rule && xmlContext) {
            this.setLoadStatus(xmlNode, "loading");
            
            if (rule.getAttribute("get")) {
                this.getModel().insertFrom(rule.getAttribute("get"), xmlContext, {
                    insertPoint : xmlContext, 
                    jmlNode     : this
                });
            }
            else {
                var data = this.applyRuleSetOnNode("Insert", xmlNode);
                if (data)
                    this.insert(data, xmlContext);
            }
        }
        else
            if (!this.prerender) {
                this.setLoadStatus(xmlNode, "loading");
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
                this.fixItem(prevSib, this.getNodeFromCache(
                    prevSib.getAttribute(jpf.xmldb.xmlIdTag) + "|" 
                    + this.uniqueId), null, true);

            //if no sibling fix parent
            if (!this.emptyMessage 
              && xmlNode.parentNode.selectNodes(this.traverse).length == 1)
                this.fixItem(xmlNode.parentNode, this.getNodeFromCache(
                    xmlNode.parentNode.getAttribute(jpf.xmldb.xmlIdTag) 
                    + "|" + this.uniqueId), null, false, true); 
        }
        else {
            var hasChildren, container = this.$getLayoutNode("item", "container", htmlNode);
            
            if (noChildren)
                hasChildren = false;
            else
                if (xmlNode.selectNodes(this.traverse).length > 0)
                    hasChildren = true;
            else
                if (this.bindingRules["insert"] && this.getNodeFromRule("insert", xmlNode))
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
                //this.$getLayoutNode("item", "openclose", htmlNode).onmousedown = new Function('e', 'if(!e) e = event; if(e.button == 2) return;var o = jpf.lookup(' + this.uniqueId + ');o.slideToggle(this);if(o.onmousedown) o.onmousedown(e, this);jpf.cancelBubble(e, o);');
                //this.$getLayoutNode("item", "icon", htmlNode)[this.opencloseaction || "ondblclick"] = new Function('var o = jpf.lookup(' + this.uniqueId + '); o.slideToggle(this);o.choose();');
                //this.$getLayoutNode("item", "select", htmlNode)[this.opencloseaction || "ondblclick"] = new Function('e', 'var o = jpf.lookup(' + this.uniqueId + '); o.slideToggle(this, true);o.choose();(e||event).cancelBubble=true;');
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
        
        var xmlNode = jpf.xmldb.getNodeById(Lid);
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
            this.oTxt[jpf.hasContentEditable ? "innerHTML" : "value"] = attrName;
    }
    
    /**
     * @todo  Make it xmlNode locked
     * @todo  Use escape(27) key to cancel change (see rename)
     */
    function addAttribute(pNode, name, value, htmlNode, Lid){
        _self.$getNewContext("attribute");
        var elName = _self.$getLayoutNode("attribute", "name");
        var elValue = _self.$getLayoutNode("attribute", "value");
        jpf.xmldb.setNodeValue(elName, name);
        jpf.xmldb.setNodeValue(elValue, (value.length > 50 ? "..." : value));
        if (value.length > 50)
            elValue.setAttribute("title", value);
        
        elName.setAttribute("aname", name);
        elName.setAttribute("onmousedown", "jpf.lookup(" + _self.uniqueId + ").startRenameThis(this, '" + Lid + "', true);\
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
        elValue.setAttribute("onmousedown", "jpf.lookup(" + _self.uniqueId + ").startRenameThis(this, '" + Lid + "');\
            event.cancelBubble=true;");
        elValue.setAttribute("onmouseup", "jpf.selectTextHtml(this);\
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
            htmlNode = jpf.xmldb.htmlImport(
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
        jpf.xmldb.setNodeValue(elTextNode, (value.length > 50 ? "..." : value));
        if (value.length > 50)
            elTextNode.setAttribute("title", value);
        
        elTextNode.setAttribute("onmousedown", "jpf.lookup(" + _self.uniqueId + ").startRenameThis(this, '" + Lid + "');");
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
        
        jpf.xmldb.setNodeValue(elTag, "&gt;");
        
        if (pNode.style) {
            var htmlNode = jpf.xmldb.htmlImport(
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
            && this.applyRuleSetOnNode("empty", xmlNode));
        
        //should be restructured and combined events set per element 
        var elItem = this.$getLayoutNode("item");
        elItem.setAttribute("onmouseover", 'var o = jpf.lookup(' + this.uniqueId + ');\
            if (o.onmouseover) \
                o.onmouseover(event, this);');
        elItem.setAttribute("onmouseout", 'var o = jpf.lookup(' + this.uniqueId + ');\
            if(o.onmouseout) \
                o.onmouseout(event, this)');
        elItem.setAttribute("onmousedown", 'var o = jpf.lookup(' + this.uniqueId + ');\
            if (o.onmousedown) \
                o.onmousedown(event, this);');
        elItem.setAttribute(jpf.xmldb.htmlIdTag, Lid);
        
        //Set open/close skin class & interaction
        this.$setStyleClass(this.$getLayoutNode("item", "openclose"), 
            treeState[state]);
        this.$setStyleClass(this.$getLayoutNode("item", "container"), 
            treeState[state])
        var elOpenClose = this.$getLayoutNode("item", "openclose");
        if (hasChildren)
            elOpenClose.setAttribute(this.opencloseaction || "onmousedown",
                "var o = jpf.lookup(" + this.uniqueId + ");\
                o.slideToggle(this);\
                if (o.onmousedown) \
                    o.onmousedown(event, this);\
                jpf.cancelBubble(event,o);");
        
        //Select interaction
        var elSelect = this.$getLayoutNode("item", "select");
        if (hasChildren) {
            var strFunc2 = "var o = jpf.lookup(" + this.uniqueId + ");\
                o.slideToggle(this, true);";
            //if(this.opencloseaction != "onmousedown") elSelect.setAttribute(this.opencloseaction || "ondblclick", strFunc2);
        }
        //if(event.button != 1) return; 
        //jpf.xmldb.isChildOf(o.$selected, this) && o.selected [REMOVED THIS LINE... dunno what the repurcusions are exactly]
        elSelect.setAttribute("onmousedown", "var o = jpf.lookup(" + this.uniqueId + ");\
            jpf.cancelBubble(event, o);\
            if (o.hasFocus()) \
                o.select(this);\
            if (o.onmousedown) \
                o.onmousedown(event, this);" 
            + (strFunc2 && this.opencloseaction == "onmousedown" ? strFunc2 : ""));
        //if(!elSelect.getAttribute("ondblclick")) elSelect.setAttribute("ondblclick", 'var o = jpf.lookup(' + this.uniqueId + ');o.choose();');

        //elItem.setAttribute("contextmenu", 'alert(1);var o = jpf.lookup(' + this.uniqueId + ');o.dispatchEvent("contextMenu", o.selected);');
        
        var elBegin = this.$getLayoutNode("item", "begintag");
        jpf.xmldb.setNodeValue(elBegin, "&lt;" + xmlNode.tagName);
        
        //attributes
        var elAttributes = this.$getLayoutNode("item", "attributes");
        var len = xmlNode.attributes.length;
        if (typeof len == "function")
            len = xmlNode.attributes.length();
        for (var i = 0; i < len; i++) {
            var attr = xmlNode.attributes.item(i);
            if (attr.nodeName.match(/j_id|j_listen|j_doc|j_loaded/))
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
                jpf.xmldb.setNodeValue(elBeginTail, "&lt;/" + xmlNode.tagName + "&gt;");
            }
            else
                jpf.xmldb.setNodeValue(elBeginTail, " /&gt;");
        }
        else {
            jpf.xmldb.setNodeValue(elEnd, "&lt;/" + xmlNode.tagName + "&gt;");
            jpf.xmldb.setNodeValue(elBeginTail, "&gt;");
        }
        elBeginTail.parentNode.appendChild(elBeginTail);
        
        elEnd.setAttribute("onmousedown", 'var o = jpf.lookup(' + this.uniqueId + ');jpf.cancelBubble(event, o);');
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
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
        
        //this.fixItem(xmlNode.parentNode, jpf.xmldb.findHTMLNode(xmlNode.parentNode, this));
        /*throw new Error();
        if(xmlNode.previousSibling) //should use traverse here
            this.fixItem(xmlNode.previousSibling, jpf.xmldb.findHTMLNode(xmlNode.previousSibling, this));*/
    };
    
    function animHighlight(oHtml){
        if (!oHtml.offsetHeight) return;
        
        jpf.setStyleClass(oHtml, "highlight");
        setTimeout(function(){
            jpf.tween.css(oHtml, "highlight", {
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
            if (attr.nodeName.match(/j_id|j_listen|j_doc|j_loaded/))
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
                    nodes[i].parentNode.removeChild(nodes[i]);//jpf.removeChild here??
                    jpf.xmldb.setNodeValue(elBeginTail, " /&gt;");
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
                nodes[i].parentNode.removeChild(nodes[i]);//jpf.removeChild here??
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
            addAttribute(elAttributes, attr, aLookup[attr], htmlNode, xmlNode.getAttribute(jpf.xmldb.xmlIdTag));
        }
        
        //Add textnode if its not there yet
        if (!doneFirstChild && xmlNode.childNodes.length == 1 
          && xmlNode.childNodes[0].nodeType == 3) {
            addTextnode(elAttributes, xmlNode.childNodes[0].nodeValue);
            jpf.xmldb.setNodeValue(elBeginTail, "</" + xmlNode.tagName + ">");
        }
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
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
        jpf.xmldb.htmlImport(oItem, container);
        
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
        this.setLoadStatus(xmlNode, "potential");
        jpf.xmldb.htmlImport(this.$getLayoutNode("loading"), container);
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
            this.fixItem(e.xmlNode, jpf.xmldb.findHTMLNode(e.xmlNode, this), true);

        if (e.action != "insert") return;
        
        var htmlNode = this.getNodeFromCache(e.xmlNode.getAttribute(jpf.xmldb.xmlIdTag)+"|"+this.uniqueId);
        if (!htmlNode) return;
        if (this.hasLoadStatus(e.xmlNode, "loading") && e.result.length > 0) {
            var container = this.$getLayoutNode("item", "container", htmlNode);
            this.slideOpen(container, e.xmlNode);
        }
        else
            this.fixItem(e.xmlNode, htmlNode);
        
        //Can this be removed?? (because it was added in the insert function)
        if (this.hasLoadStatus(e.xmlNode, "loading"))
            this.setLoadStatus(e.xmlNode, "loaded");
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
        var selHtml  = this.$indicator || this.$selected;
        
        if (!selHtml || this.renaming) 
            return;

        var selXml = this.indicator || this.selected;
        var oExt   = this.oExt;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.selectTemp();
            
                if (this.ctrlselect == "enter")
                    this.select(this.indicator, true);
            
                this.choose(selHtml);
                break;
            case 32:
                //if (ctrlKey)
                    this.select(this.indicator, true);
                break;
            case 46:
                if (this.$tempsel)
                    this.selectTemp();
            
                //DELETE
                //this.remove();
                this.remove(this.mode ? this.indicator : null); //this.mode != "check"
                break;
            case 109:
            case 37:
                //LEFT
                if (this.$tempsel)
                    this.selectTemp();
                    
                if (this.indicator.selectSingleNode(this.traverse))
                    this.slideToggle(this.$indicator || this.$selected, 2)
                break;
            case 107:
            case 39:
                //RIGHT
                if (this.$tempsel)
                    this.selectTemp();
            
                if (this.indicator.selectSingleNode(this.traverse))
                    this.slideToggle(this.$indicator || this.$selected, 1)
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
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var sNode = this.getNextTraverse(node, true);
                if (sNode) {
                    var nodes = this.getTraverseNodes(sNode);
                    
                    do {
                        var container = this.$getLayoutNode("item", "container",
                            this.getNodeFromCache(jpf.xmldb.getID(sNode, this)));
                        if (container && jpf.getStyle(container, "display") == "block" 
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
                   this.setTempSelected(sNode, ctrlKey, shiftKey);
                
                if (this.$tempsel && this.$tempsel.offsetTop < oExt.scrollTop)
                    oExt.scrollTop = this.$tempsel.offsetTop;
                
                return false;
             
                break;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel) 
                    return;
                    
                var node = this.$tempsel 
                    ? jpf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                var sNode = this.getFirstTraverseNode(node);
                if (sNode) {
                    var container = this.$getLayoutNode("item", "container",
                        this.getNodeFromCache(jpf.xmldb.getID(node, this)));
                    if (container && jpf.getStyle(container, "display") != "block")
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
                   this.setTempSelected(sNode, ctrlKey, shiftKey);
                
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
        var loadChildren = this.bindingRules["insert"] 
            ? this.getNodeFromRule("insert", xmlNode) 
            : false;
        var hasChildren  = (loadChildren 
            || xmlNode.selectSingleNode(this.traverse)) ? true : false;
        
        var startClosed  = this.startClosed;// || this.applyRuleSetOnNode("collapse", xmlNode, ".") !== false;
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
        if (loadChildren && !this.hasLoadStatus(xmlNode))
            this.$setLoading(xmlNode, container);
        else if(!this.getTraverseNodes(xmlNode).length 
          && this.applyRuleSetOnNode("empty", xmlNode))
            this.setEmpty(container);

        if (!htmlParentNode && (xmlParentNode == this.xmlRoot 
          || xmlNode == this.xmlRoot)) {
            nodes.push(htmlNode);
            if (!jpf.xmldb.isChildOf(htmlNode, container, true))
                nodes.push(container);
            
            this.$setStyleClass(htmlNode,  "root");
            this.$setStyleClass(container, "root");
            
            //if(xmlNode == xmlParentNode) return container;
        }
        else {
            if (!htmlParentNode) {
                htmlParentNode = jpf.xmldb.findHTMLNode(xmlNode.parentNode, this);
                htmlParentNode = htmlParentNode 
                    ? this.$getLayoutNode("item", "container", htmlParentNode) 
                    : this.oInt;
            }
            
            if (htmlParentNode == this.oInt) {
                this.$setStyleClass(htmlNode,  "root");
                this.$setStyleClass(container, "root");
                
                if (this.renderRoot) {
                    var realParent = jpf.xmldb.findHTMLNode(this.xmlRoot, this);
                    htmlParentNode = this.$getLayoutNode("item", "container", realParent);
                }
            }
            
            if (!beforeNode && this.getNextTraverse(xmlNode))
                beforeNode = jpf.xmldb.findHTMLNode(this.getNextTraverse(xmlNode), this);
            if (beforeNode && beforeNode.parentNode != htmlParentNode)
                beforeNode = null;

            if (htmlParentNode.style && this.getTraverseNodes(xmlNode.parentNode).length == 1) 
                this.clearEmpty(htmlParentNode);
        
            //alert("|" + htmlNode.nodeType + "-" + htmlParentNode.nodeType + "-" + beforeNode + ":" + container.nodeType);
            //Insert Node into Tree
            if (htmlParentNode.style) {
                var q = jpf.xmldb.htmlImport(htmlNode, htmlParentNode, beforeNode);
                animHighlight(this.$getLayoutNode("item", "select", q));
                
                if (!jpf.xmldb.isChildOf(htmlNode, container, true)) 
                    var container = jpf.xmldb.htmlImport(container, htmlParentNode, beforeNode);
            }
            else {
                htmlParentNode.insertBefore(htmlNode, beforeNode);
                if (!jpf.xmldb.isChildOf(htmlParentNode, container, true)) 
                    htmlParentNode.insertBefore(container, beforeNode);
            }

            //Fix parent if child is added to drawn parentNode
            if (htmlParentNode.style) {
                if(!startClosed && this.openOnAdd 
                  && htmlParentNode != this.oInt 
                  && htmlParentNode.style.display != "block") 
                    this.slideOpen(htmlParentNode, xmlParentNode);
                
                //this.fixItem(xmlNode, htmlNode); this one shouldn't be called, because it should be set right at init
                this.fixItem(xmlParentNode, jpf.xmldb.findHTMLNode(xmlParentNode, this));
                if (this.getNextTraverse(xmlNode, true)) { //should use traverse here
                    this.fixItem(this.getNextTraverse(xmlNode, true), 
                        jpf.xmldb.findHTMLNode(this.getNextTraverse(xmlNode, true), this));
                }
            }
        }
        
        if (this.prerender) 
            this.$addNodes(xmlNode, container, true); //checkChildren (optimization) ???
        else
            this.setLoadStatus(xmlNode, "potential");

        return container;
    };
    
    this.$fill = function(){
        var container;

        //Please please consider moving this to jpf.databinding and make it generic.. this is a mess
        /*if(this.renderRoot){
            var htmlNode = jpf.xmldb.findHTMLNode(this.xmlRoot, this);
            if(!htmlNode || htmlNode.parentNode != this.oInt){
                var nodes = nodes;
                nodes = [];
                
                var Lid = jpf.xmldb.nodeConnect(this.documentId, this.xmlRoot, null, this);
                var p = this.$add(this.xmlRoot, Lid, this.xmlRoot, null, null, true);
                for(var i=0;i<nodes.length;i++) p.appendChild(nodes[i]);
            }
            else{
                container = this.$getLayoutNode("item", "container", htmlNode);
            }
        }*/

        jpf.xmldb.htmlImport(nodes, container || this.oInt);
        nodes.length = 0;
    };
    
    this.$getParentNode = function(htmlNode){
        return htmlNode 
            ? this.$getLayoutNode("item", "container", htmlNode) 
            : this.oInt;
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
        if(this.select(this.getFirstTraverseNode(xmlNode))) return true;
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
        this.oExt = this.$getExternal(); 
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        this.opencloseaction = this.$getOption("Main", "openclose");
        
        //Need fix...
        //this.oExt.style.MozUserSelect = "none";

        this.oExt.onclick = function(e){
            this.host.dispatchEvent("click", {htmlEvent : e || event});
        }
    };
    
    this.$loadJml = function(x){
        this.openOnAdd   = !jpf.isFalse(x.getAttribute("openonadd"));
        this.startClosed = !jpf.isFalse(this.$jml.getAttribute("startclosed") 
            || this.$getOption("Main", "startclosed"));
        this.noCollapse  = jpf.isTrue(this.$jml.getAttribute("nocollapse"));
        if (this.noCollapse)
            this.startClosed = false;
        this.singleopen  = jpf.isTrue(this.$jml.getAttribute("singleopen"));
        this.prerender   = !jpf.isFalse(this.$jml.getAttribute("prerender"));
        
        jpf.JmlParser.parseChildren(this.$jml, null, this);
    };
    
    this.$destroy = function(){
        this.oExt.onclick = null;
        jpf.removeNode(this.oDrag);
        this.oDrag = null;
    };
}).implement(
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    //jpf.Validation,
    //#endif
    //#ifdef __WITH_XFORMS
    jpf.XForms,
    //#endif
    jpf.Rename,
    jpf.MultiSelect, 
    jpf.Cache,
    jpf.Presentation, 
    jpf.DataBinding
);

// #endif
