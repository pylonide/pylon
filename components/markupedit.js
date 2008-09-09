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
 * Component for editing markup
 *
 * @classDescription        This class creates a new markupedit component
 * @return {Markupedit}   Returns a new markupedit component
 * @type {Markupedit}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:markupedit
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.98.3
 */
jpf.markupedit = function(pHtmlNode){
    jpf.register(this, "markupedit", jpf.GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc  = this.pHtmlNode.ownerDocument;
    
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/
    
    //Options
    this.isTreeArch = true; // Tree Architecture for loading Data
    this.focussable = true; // This object can get the focus
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    this.inherit(jpf.Validation); /** @inherits jpf.Validation */
    //#endif
    //#ifdef __WITH_XFORMS
    this.inherit(jpf.XForms); /** @inherits jpf.XForms */
    //#endif
    
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
    }
    
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
    }
    
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
    }
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/
    
    /* ***********************
        Sliding Functions
    ************************/
    
    this.slideToggle = function(htmlNode, force){
        if (this.noCollapse) return;

        var id = htmlNode.getAttribute(jpf.xmldb.htmlIdTag);
        while (!id && htmlNode.parentNode)
            var id = (htmlNode = htmlNode.parentNode).getAttribute(jpf.xmldb.htmlIdTag);

        /*var xmlNode = jpf.xmldb.getNodeById(id);
        var hasChildren = this.getTraverseNodes(xmlNode).length || this.emptyMessage && this.applyRuleSetOnNode("empty", xmlNode);
        if(!hasChildren) return false;
        else if(!htmlNode.className.match(/plus|min/)) this.fixItem(xmlNode, htmlNode);*/

        var container = this.__getLayoutNode("Item", "container", htmlNode);
        if (!force && jpf.getStyle(container, "display") == "block") {
            if (force == 1) return;
            var elClass = this.__getLayoutNode("Item", "openclose", htmlNode);
            elClass.className = elClass.className.replace(/min/, "plus");
            this.slideClose(container, jpf.xmldb.getNode(htmlNode));
        }
        else {
            if (force == 2) return;
            var elClass = this.__getLayoutNode("Item", "openclose", htmlNode);
            elClass.className = elClass.className.replace(/plus/, "min");
            this.slideOpen(container, jpf.xmldb.getNode(htmlNode));
        }
    }
    
    //htmlNode || xmlNode
    var lastOpened = {};
    this.slideOpen = function(container, xmlNode){
        var htmlNode = jpf.xmldb.findHTMLNode(xmlNode, this);
        if (!container)
            container = this.__findContainer(htmlNode);

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode)
            var p = (pNode || this.XMLRoot).getAttribute(jpf.xmldb.xmlIdTag);
            if (lastOpened[p] && lastOpened[p][1] != xmlNode 
              && this.getTraverseParent(lastOpened[p][1]) == pNode) 
                this.slideToggle(lastOpened[p][0], 2);//lastOpened[p][1]);
            lastOpened[p] = [htmlNode, xmlNode];
        }
        
        container.style.display = "block";

        jpf.tween.single(container, {
            type:     'scrollheight', 
            from:     0, 
            to:       container.scrollHeight, 
            anim:     this.animType, 
            steps:    this.animSteps,
            interval: this.animSpeed,
            onfinish: function(container, data){
                if (data[1] && data[0].hasLoadStatus(data[1], "potential")) {
                    //'jpf.lookup(' + data[0].uniqueId + ').doUpdate(jpf.xmldb.getElementById("' + data[1].getAttribute(jpf.xmldb.xmlIdTag) + '"));'
                    setTimeout(function(){data[0].doUpdate(data[1], container);});
                    container.style.height = "auto";
                }
                else {
                    //container.style.overflow = "visible";
                    container.style.height = "auto";
                }
            }, 
            userdata: [this, xmlNode]
        });
    }

    this.slideClose = function(container, xmlNode){
        if (this.noCollapse) return;
        
        if (this.singleopen){
            var p = (this.getTraverseParent(xmlNode) || this.XMLRoot)
                .getAttribute(jpf.xmldb.xmlIdTag);
            lastOpened[p] = null;
        }
        
        container.style.height = container.offsetHeight;
        container.style.overflow = "hidden";

        jpf.tween.single(container, {
            type:     'scrollheight', 
            from:     container.scrollHeight, 
            to:       0, 
            anim:     this.animType, 
            steps:    this.animSteps,
            interval: this.animSpeed,
            onfinish: function(container, data){
               container.style.display = "none";
            }
        });
    }

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
                var result = this.__addNodes(xmlNode, container, true); //checkChildren ???
                xmlUpdateHandler.call(this, "insert", xmlNode, result);
            }
    }
    
    /* ***********************
                Skin
    ************************/

    this.State = {};
    this.State[0]                                     = "";
    this.State[HAS_CHILD]                             = "min";
    this.State[HAS_CHILD | IS_CLOSED]                 = "plus";
    this.State[IS_LAST]                               = "last";
    this.State[IS_LAST | HAS_CHILD]                   = "minlast";
    this.State[IS_LAST | HAS_CHILD | IS_CLOSED]       = "pluslast";
    this.State[IS_ROOT]                               = "root";

    this.fixItem = function(xmlNode, htmlNode, isDeleting, oneLeft, noChildren){
        if (!htmlNode) return;

        if (isDeleting) {
            //if isLast fix previousSibling
            if (prevSib = this.getNextTraverse(xmlNode, true))
                this.fixItem(prevSib, this.getNodeFromCache(
                    prevSib.getAttribute(jpf.xmldb.xmlIdTag) + "|" 
                    + this.uniqueId), null, true);

            //if no sibling fix parent
            if (!this.emptyMessage 
              && xmlNode.parentNode.selectNodes(this.ruleTraverse).length == 1)
                this.fixItem(xmlNode.parentNode, this.getNodeFromCache(
                    xmlNode.parentNode.getAttribute(jpf.xmldb.xmlIdTag) 
                    + "|" + this.uniqueId), null, false, true); 
        }
        else {
            var container = this.__getLayoutNode("Item", "container", htmlNode);
            
            if (noChildren)
                var hasChildren = false;
            else
                if (xmlNode.selectNodes(this.ruleTraverse).length > 0)
                    var hasChildren = true;
            else
                if (this.bindingRules["insert"] && this.getNodeFromRule("insert", xmlNode))
                    var hasChildren = true;
            else
                var hasChildren = false;
            
            var isClosed = hasChildren && container.style.display != "block";
            var isLast   = this.getNextTraverse(xmlNode, null, oneLeft ? 2 : 1) 
                ? false 
                : true;

            var state = (hasChildren ? HAS_CHILD : 0) | (isClosed ? IS_CLOSED : 0) 
                | (isLast ? IS_LAST : 0);
            this.__setStyleClass(this.__getLayoutNode("Item", "openclose", 
                htmlNode), this.State[state], ["min", "plus", "last", "minlast", 
                "pluslast"]);
            this.__setStyleClass(this.__getLayoutNode("Item", "container", 
                htmlNode), this.State[state], ["min", "plus", "last", "minlast", 
                "pluslast"]);
            
            if (!hasChildren)
                container.style.display = "none";
            
            if (state & HAS_CHILD) {
                //this.__getLayoutNode("Item", "openclose", htmlNode).onmousedown = new Function('e', 'if(!e) e = event; if(e.button == 2) return;var o = jpf.lookup(' + this.uniqueId + ');o.slideToggle(this);if(o.onmousedown) o.onmousedown(e, this);jpf.cancelBubble(e, o);');
                //this.__getLayoutNode("Item", "icon", htmlNode)[this.opencloseaction || "ondblclick"] = new Function('var o = jpf.lookup(' + this.uniqueId + '); o.slideToggle(this);o.choose();');
                //this.__getLayoutNode("Item", "select", htmlNode)[this.opencloseaction || "ondblclick"] = new Function('e', 'var o = jpf.lookup(' + this.uniqueId + '); o.slideToggle(this, true);o.choose();(e||event).cancelBubble=true;');
            }
            /*else{
                //Experimental
                this.__getLayoutNode("Item", "openclose", htmlNode).onmousedown = null;
                this.__getLayoutNode("Item", "icon", htmlNode)[this.opencloseaction || "ondblclick"] = null;
                this.__getLayoutNode("Item", "select", htmlNode)[this.opencloseaction || "ondblclick"] = null;
            }*/
        }
    }
    
    /**
     * @todo  Make it xmlNode locked
     * @todo  Use escape(27) key to cancel change (see rename)
     */
    function addAttribute(pNode, name, value, htmlNode){
        _self.__getNewContext("Attribute");
        var elName = _self.__getLayoutNode("Attribute", "name");
        var elValue = _self.__getLayoutNode("Attribute", "value");
        jpf.xmldb.setNodeValue(elName, name);
        jpf.xmldb.setNodeValue(elValue, (value.length > 50 ? "..." : value));
        if (value.length > 50)
            elValue.setAttribute("title", value);
        
        elName.setAttribute("onmousedown", "this.contentEditable=true;\
            jpf.selectTextHtml(this);\
            this.className='textedit';");
        elName.setAttribute("onmouseup", "jpf.selectTextHtml(this);\
            event.cancelBubble=true;\
            return false;");
        elName.setAttribute("onkeydown", "if (event.keyCode==13) {\
              this.blur();\
              return false;\
            };\
            event.cancelBubble=true;");
        elName.setAttribute("onselectstart", "event.cancelBubble = true;");
        elName.setAttribute("ondblclick", "event.cancelBubble = true;");
        elName.setAttribute("onblur", "var o = jpf.lookup(" + _self.uniqueId + ");\
            var xmlNode = o.selected;\
            o.renameAttribute(xmlNode, '" + name + "', this.innerHTML);\
            this.contentEditable=false;this.className=''");
        
        elValue.setAttribute("onmousedown", "this.contentEditable=true;\
            jpf.selectTextHtml(this);\
            this.className='textedit'");
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
        elValue.setAttribute("onblur", "var o = jpf.lookup(" + _self.uniqueId + ");\
            var xmlNode = o.selected;\
            o.setAttributeValue(xmlNode, '" + name + "', this.innerHTML);\
            this.contentEditable=false;this.className=''");
        
        if (pNode.style) {
            var htmlNode = jpf.xmldb.htmlImport(
                _self.__getLayoutNode("Attribute"), 
                pNode, 
                _self.__getLayoutNode("Item", "begintag", htmlNode).nextSibling);
            
            animHighlight(htmlNode);
            animHighlight(_self.__getLayoutNode("Attribute", "name", htmlNode));
            animHighlight(_self.__getLayoutNode("Attribute", "value", htmlNode));
        }
        else
            pNode.appendChild(_self.__getLayoutNode("Attribute"));
    }
    
    function addTextnode(pNode, value){
        _self.__getNewContext("Textnode");
        var elTextNode = _self.__getLayoutNode("Textnode", "text");
        var elTag = _self.__getLayoutNode("Textnode", "tag");
        jpf.xmldb.setNodeValue(elTextNode, (value.length > 50 ? "..." : value));
        if (value.length > 50)
            elTextNode.setAttribute("title", value);
        
        elTextNode.setAttribute("onmousedown", "this.contentEditable=true;\
            jpf.selectTextHtml(this);\
            this.className='textedit'");
        elTextNode.setAttribute("onmouseup", "jpf.selectTextHtml(this);\
            event.cancelBubble=true;\
            return false;");
        elTextNode.setAttribute("onkeydown", "if (event.keyCode==13) {\
              this.blur();\
              return false;\
            };\
            event.cancelBubble=true;");
        elTextNode.setAttribute("onselectstart", "event.cancelBubble = true;");
        elTextNode.setAttribute("ondblclick", "event.cancelBubble = true;");
        elTextNode.setAttribute("onblur", "var o = jpf.lookup(" + _self.uniqueId + ");\
            var xmlNode = o.selected;\
            o.setTextNode(xmlNode, this.innerHTML);\
            this.contentEditable=false;this.className=''");
        
        jpf.xmldb.setNodeValue(elTag, "&gt;");
        
        if (pNode.style) {
            var htmlNode = jpf.xmldb.htmlImport(
                _self.__getLayoutNode("Textnode"), pNode, pNode.lastChild);
            animHighlight(_self.__getLayoutNode("Textnode", "text", htmlNode));
        }
        else
            pNode.appendChild(_self.__getLayoutNode("Textnode"));
    }

    //This can be optimized by NOT using getLayoutNode all the time
    this.initNode = function(xmlNode, state, Lid){
        //Setup Nodes Interaction
        this.__getNewContext("Item");
        
        var hasChildren = (state & HAS_CHILD || this.emptyMessage 
            && this.applyRuleSetOnNode("empty", xmlNode));
        
        //should be restructured and combined events set per element 
        var elItem = this.__getLayoutNode("Item");
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
        this.__setStyleClass(this.__getLayoutNode("Item", "openclose"), 
            this.State[state]);
        this.__setStyleClass(this.__getLayoutNode("Item", "container"), 
            this.State[state])
        var elOpenClose = this.__getLayoutNode("Item", "openclose");
        if (hasChildren)
            elOpenClose.setAttribute(this.opencloseaction || "onmousedown",
                "var o = jpf.lookup(" + this.uniqueId + ");\
                o.slideToggle(this);\
                if (o.onmousedown) \
                    o.onmousedown(event, this);\
                jpf.cancelBubble(event,o);");
        
        //Select interaction
        var elSelect = this.__getLayoutNode("Item", "select");
        if (hasChildren) {
            var strFunc2 = "var o = jpf.lookup(" + this.uniqueId + ");\
                o.slideToggle(this, true);";
            //if(this.opencloseaction != "onmousedown") elSelect.setAttribute(this.opencloseaction || "ondblclick", strFunc2);
        }
        //if(event.button != 1) return; 
        //jpf.xmldb.isChildOf(o.__selected, this) && o.selected [REMOVED THIS LINE... dunno what the repurcusions are exactly]
        elSelect.setAttribute("onmousedown", "var o = jpf.lookup(" + this.uniqueId + ");\
            jpf.cancelBubble(event, o);\
            if (o.isFocussed()) \
                o.select(this);\
            if (o.onmousedown) \
                o.onmousedown(event, this);" 
            + (strFunc2 && this.opencloseaction == "onmousedown" ? strFunc2 : ""));
        //if(!elSelect.getAttribute("ondblclick")) elSelect.setAttribute("ondblclick", 'var o = jpf.lookup(' + this.uniqueId + ');o.choose();');

        //elItem.setAttribute("contextmenu", 'alert(1);var o = jpf.lookup(' + this.uniqueId + ');o.dispatchEvent("oncontextMenu", o.selected);');
        
        var elBegin = this.__getLayoutNode("Item", "begintag");
        jpf.xmldb.setNodeValue(elBegin, "&lt;" + xmlNode.tagName);
        
        //attributes
        var elAttributes = this.__getLayoutNode("Item", "attributes");
        for (var i = 0; i < xmlNode.attributes.length; i++) {
            if (xmlNode.attributes[i].nodeName.match(/j_id|j_listen|j_doc|j_loaded/))
                continue;
            
            addAttribute(elAttributes, xmlNode.attributes[i].nodeName, 
                xmlNode.attributes[i].nodeValue);
        }
        
        var elBeginTail = this.__getLayoutNode("Item", "begintail");
        var elEnd = this.__getLayoutNode("Item", "endtag");
        if (!(state&HAS_CHILD)) {
            elEnd.setAttribute("style", "display:none");

            if (xmlNode.childNodes.length) {
                addTextnode(elAttributes, xmlNode.childNodes[0].nodeValue);
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
            this.__setStyleClass(this.__getLayoutNode("Item", null, 
                this.__getLayoutNode("Item")), cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        //#endif

        return this.__getLayoutNode("Item");
    }
    
    this.__deInitNode = function(xmlNode, htmlNode){
        //Lookup container
        var containerNode = this.__getLayoutNode("Item", "container", htmlNode);
        var pContainer    = htmlNode.parentNode;
        
        //Remove htmlNodes from tree
        containerNode.parentNode.removeChild(containerNode);
        pContainer.removeChild(htmlNode);
        
        //Fix Images (+, - and lines)
        if (xmlNode.parentNode != this.XMLRoot)
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
    }
    
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
    
    this.__updateNode = function(xmlNode, htmlNode){
        //Attributes
        var aLookup      = {};
        var elAttributes = this.__getLayoutNode("Item", "attributes", htmlNode);
        var elEnd        = this.__getLayoutNode("Item", "endtag", htmlNode);
        var elBeginTail  = this.__getLayoutNode("Item", "begintail", htmlNode);
        
        for (var i = 0; i < xmlNode.attributes.length; i++) {
            if (xmlNode.attributes[i].nodeName.match(/j_id|j_listen|j_doc|j_loaded/))
                continue;
            aLookup[xmlNode.attributes[i].nodeName] = xmlNode.attributes[i].nodeValue;
        }

        var doneFirstChild = false;
        var cnodes         = elAttributes.childNodes;
        for (var nodes = [], i = 0; i < cnodes.length; i++)
            nodes.push(cnodes[i]);
        
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1)
                continue;
            
            if (nodes[i].className.indexOf("textnode") > -1) {
                if (xmlNode.childNodes.length == 1 
                  && xmlNode.childNodes[0].nodeType == 3) {
                    var elText = this.__getLayoutNode("Textnode", "text", nodes[i]);
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
            
            var elName  = this.__getLayoutNode("Attribute", "name", nodes[i]);
            var elValue = this.__getLayoutNode("Attribute", "value", nodes[i]);
            
            //Remove attribute if it no longer exists
            var name = elName.innerHTML;
            if (!aLookup[name])
                nodes[i].parentNode.removeChild(nodes[i]);//jpf.removeChild here??
            //Change it
            else
                if(aLookup[name] != elValue.innerHTML) {
                    elValue.innerHTML = aLookup[name];
                    animHighlight(elValue);
                    //Animate change here...
                    delete aLookup[name];
                } 
            else
                if(aLookup[name])
                    delete aLookup[name];
        }
        
        //Add the remaining attributes
        for (var attr in aLookup) {
            addAttribute(elAttributes, attr, aLookup[attr], htmlNode);
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
            this.__setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass))
                this.dynCssClasses.push(cssClass);
        }
        // #endif
    }
    
    this.clearEmpty = function(container){
        container.innerHTML = "";
    }
        
    this.setEmpty = function(container){
        this.__getNewContext("empty");
        var oItem = this.__getLayoutNode("empty");
        this.__getLayoutNode("empty", "caption").nodeValue = this.emptyMessage;
        jpf.xmldb.htmlImport(oItem, container);
        
        if (!this.startClosed) {
            if (container.style) {
                //container.style.display = "block";
                //container.style.height = "auto";
            }
            //else container.setAttribute("style", "display:block;height:auto;");
        }
    }
    
    this.__setLoading = function(xmlNode, container){
        this.__getNewContext("Loading");
        this.setLoadStatus(xmlNode, "potential");
        jpf.xmldb.htmlImport(this.__getLayoutNode("Loading"), container);
    }
    
    this.__removeLoading = function(htmlNode){
        if (!htmlNode) return;
        this.__getLayoutNode("Item", "container", htmlNode).innerHTML = "";
    }
    
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
            var container = this.__getLayoutNode("Item", "container", htmlNode);
            this.slideOpen(container, e.xmlNode);
        }
        else
            this.fixItem(e.xmlNode, htmlNode);
        
        //Can this be removed?? (because it was added in the insert function)
        if (this.hasLoadStatus(e.xmlNode, "loading"))
            this.setLoadStatus(e.xmlNode, "loaded");
    }
    
    this.addEventListener("onxmlupdate", xmlUpdateHandler);
    
    /* ***********************
        Keyboard Support
    ************************/
    
    // #ifdef __WITH_KBSUPPORT
    this.keyHandler = function(key, ctrlKey, shiftKey, altKey){
        if (!this.__selected) return;
        //if(!this.__selected || this.dragging) return;
        //var img = this.__selected.parentNode.parentNode.firstChild.firstChild;

        switch (key) {
            case 109:
            case 37:
                //LEFT
                if (this.tempsel) {
                    clearTimeout(this.timer);
                    this.select(this.tempsel);
                    this.tempsel = this.timer = null;
                }
            
                if (this.selected.selectSingleNode(this.ruleTraverse))
                    this.slideToggle(this.__selected, 2)
                break;
            case 107:
            case 39:
                //RIGHT
                if (this.tempsel) {
                    clearTimeout(this.timer);
                    this.select(this.tempsel);
                    this.tempsel = this.timer = null;
                }
            
                if (this.selected.selectSingleNode(this.ruleTraverse))
                    this.slideToggle(this.__selected, 1)
                break;
            case 46:
                //DELETE
                var xmlNode = this.selected;
                var i = 0, ln = 1, nextNode = xmlNode;
                this.remove(xmlNode, true);
                break;
            case 187:
                //+
                if (shiftKey)
                    this.keyHandler(39);
                break;
            case 189:
                //-
                if (!shiftKey)
                    this.keyHandler(37);
                break;
            case 38:
                //UP
                if (!this.selected && !this.tempsel) return;
                var node = this.tempsel 
                    ? jpf.xmldb.getNode(this.tempsel) 
                    : this.selected;
                
                var sNode = this.getNextTraverse(node, true);
                if (sNode) {
                    var nodes = sNode.selectNodes(this.ruleTraverse);
                    
                    do {
                        var container = this.__getLayoutNode("Item", "container", 
                            this.getNodeFromCache(jpf.xmldb.getID(sNode, this)));
                        if (jpf.getStyle(container, "display") == "block") {
                            if (nodes.length)
                                sNode = nodes[nodes.length-1];
                            else 
                                break;
                        }
                        else 
                            break;
                    } while (sNode && (nodes = sNode.selectNodes(this.ruleTraverse)).length);
                }
                else 
                    if (node.parentNode == this.XMLRoot) 
                        return;
                else 
                    sNode = node.parentNode;

                if (sNode && sNode.nodeType == 1) {
                    clearTimeout(this.timer);
                    var id = jpf.xmldb.getID(sNode, this);
                    this.__deselect(this.tempsel || this.__selected);
                    this.tempsel = this.__select(document.getElementById(id));//SHOULD BE FAKE SELECT
                    this.timer = setTimeout("var o = jpf.lookup(" + this.uniqueId + ");\
                        o.tempsel = o.timer = null;\
                        o.select(document.getElementById('" + id + "'));", 300);
                }
                
                if (this.tempsel && this.tempsel.offsetTop < this.oExt.scrollTop)
                    this.oExt.scrollTop = this.tempsel.offsetTop;
                
                return false;
                break;
            case 40:
                //DOWN
                if (!this.selected && !this.tempsel) return;
                var node = this.tempsel 
                    ? jpf.xmldb.getNode(this.tempsel) 
                    : this.selected;
                
                var sNode = node.selectSingleNode(this.ruleTraverse);
                if (sNode) {
                    var container = this.__getLayoutNode("Item", "container", 
                        this.getNodeFromCache(jpf.xmldb.getID(node, this)));
                    if (jpf.getStyle(container, "display") != "block")
                        sNode = null;
                }
                
                while (!sNode && node.parentNode) {
                    var i     = 0; 
                    var nodes = node.parentNode.selectNodes(this.ruleTraverse);
                    while (nodes[i] && nodes[i] != node)
                        i++;
                    sNode     = nodes[i+1];
                    node      = node.parentNode;
                }
                
                if (sNode && sNode.nodeType == 1) {
                    clearTimeout(this.timer);
                    var id       = jpf.xmldb.getID(sNode, this);
                    this.__deselect(this.tempsel || this.__selected);
                    this.tempsel = this.__select(document.getElementById(id));//SHOULD BE FAKE SELECT
                    this.timer   = setTimeout("var o = jpf.lookup(" + this.uniqueId + ");\
                        o.tempsel = null;\
                        o.select(document.getElementById('" + id + "'));", 300);
                }
                
                if (this.tempsel && (this.tempsel.offsetTop 
                  + this.tempsel.offsetHeight) > this.oExt.scrollTop 
                  + this.oExt.offsetHeight)
                    this.oExt.scrollTop = this.tempsel.offsetTop 
                        - this.oExt.offsetHeight + this.tempsel.offsetHeight + 10;
                
                return false;
                break;
        }
    }
    // #endif
    
    /* ***********************
            DATABINDING
    ************************/

    this.nodes = [];

    this.__add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode, isLast){
        //Why is this function called 3 times when adding one node? (hack/should)
        var loadChildren = this.bindingRules["insert"] 
            ? this.getNodeFromRule("insert", xmlNode) 
            : false;
        var hasChildren  = (loadChildren 
            || xmlNode.selectSingleNode(this.ruleTraverse)) ? true : false;
        
        var startClosed  = this.startClosed;// || this.applyRuleSetOnNode("collapse", xmlNode, ".") !== false;
        var state        = (hasChildren ? HAS_CHILD : 0) 
            | (startClosed && hasChildren  || loadChildren ? IS_CLOSED : 0) 
            | (isLast ? IS_LAST : 0);

        var htmlNode     = this.initNode(xmlNode, state, Lid);
        var container    = this.__getLayoutNode("Item", "container");
        if (!startClosed && !this.noCollapse)
            container.setAttribute("style", "overflow:visible;height:auto;display:block;");
        
        //TEMP on for dynamic subloading
        if (!hasChildren || loadChildren)
            container.setAttribute("style", "display:none;");
        
        //Dynamic SubLoading (Insertion) of SubTree
        if (loadChildren && !this.hasLoadStatus(xmlNode))
            this.__setLoading(xmlNode, container);
        else if(!this.getTraverseNodes(xmlNode).length 
          && this.applyRuleSetOnNode("empty", xmlNode))
            this.setEmpty(container);

        if (!htmlParentNode && (xmlParentNode == this.XMLRoot 
          || xmlNode == this.XMLRoot)) {
            this.nodes.push(htmlNode);
            if (!jpf.xmldb.isChildOf(htmlNode, container, true))
                this.nodes.push(container);
            
            this.__setStyleClass(htmlNode,  "root");
            this.__setStyleClass(container, "root");
            
            //if(xmlNode == xmlParentNode) return container;
        }
        else {
            if (!htmlParentNode) {
                var htmlParentNode = jpf.xmldb.findHTMLNode(xmlNode.parentNode, this);
                htmlParentNode = htmlParentNode 
                    ? this.__getLayoutNode("Item", "container", htmlParentNode) 
                    : this.oInt;
            }
            
            if (htmlParentNode == this.oInt) {
                this.__setStyleClass(htmlNode,  "root");
                this.__setStyleClass(container, "root");
                
                if (this.renderRoot) {
                    var realParent = jpf.xmldb.findHTMLNode(this.XMLRoot, this);
                    htmlParentNode = this.__getLayoutNode("Item", "container", realParent);
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
                animHighlight(this.__getLayoutNode("Item", "select", q));
                
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
            this.__addNodes(xmlNode, container, true); //checkChildren (optimization) ???
        else
            this.setLoadStatus(xmlNode, "potential");

        return container;
    }
    
    this.__fill = function(){
        var container;

        //Please please consider moving this to jpf.databinding and make it generic.. this is a mess
        /*if(this.renderRoot){
            var htmlNode = jpf.xmldb.findHTMLNode(this.XMLRoot, this);
            if(!htmlNode || htmlNode.parentNode != this.oInt){
                var nodes = this.nodes;
                this.nodes = [];
                
                var Lid = jpf.xmldb.nodeConnect(this.documentId, this.XMLRoot, null, this);
                var p = this.__add(this.XMLRoot, Lid, this.XMLRoot, null, null, true);
                for(var i=0;i<nodes.length;i++) p.appendChild(nodes[i]);
            }
            else{
                container = this.__getLayoutNode("Item", "container", htmlNode);
            }
        }*/

        jpf.xmldb.htmlImport(this.nodes, container || this.oInt);
        this.nodes.length = 0;
    }
    
    this.__getParentNode = function(htmlNode){
        return htmlNode 
            ? this.__getLayoutNode("Item", "container", htmlNode) 
            : this.oInt;
    }
    
    /* ***********************
            SELECT
    ************************/
    
    this.__calcSelectRange = function(xmlStartNode, xmlEndNode){
        //should be implemented :)
        return [xmlStartNode, xmlEndNode];
    }
    
    this.__findContainer = function(htmlNode){
        return this.__getLayoutNode("Item", "container", htmlNode);
    }
    
    /**
     * @inherits jpf.MultiSelect
     * @inherits jpf.Cache
     */
    this.inherit(jpf.MultiSelect, jpf.Cache);
    this.multiselect = false; // Initially Disable MultiSelect
    
    this.__selectDefault = function(xmlNode){
        if(this.select(this.getFirstTraverseNode(xmlNode))) return true;
        else{
            var nodes = this.getTraverseNodes(xmlNode);
            for(var i=0;i<nodes.length;i++){
                if(this.__selectDefault(nodes[i])) return true;
            }
        }
    }
    
    /* ***********************
      Other Inheritance
    ************************/
    /**
     * @inherits jpf.Presentation
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.Presentation, jpf.DataBinding, jpf.JmlNode);
    
    this.__select = function(o){
        if(!o || !o.style) return;
        this.__setStyleClass(this.__getLayoutNode("Item", "class", o), "selected");
        return o;
    }

    this.__deselect = function(o){
        if(!o) return;
        this.__setStyleClass(this.__getLayoutNode("Item", "class", o), "", ["selected", "indicate"]);
        return o;
    }
    
    this.__indicate = function(o){
        if(!o) return;
        this.__setStyleClass(this.__getLayoutNode("Item", "class", o), "indicate");
        return o;
    }

    this.__deindicate = function(o){
        if(!o) return;
        this.__setStyleClass(this.__getLayoutNode("Item", "class", o), "", ["indicate"]);
        return o;
    }
    
    /* *********
        INIT
    **********/
    //render the outer framework of this object
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(); 
        this.oInt = this.__getLayoutNode("Main", "container", this.oExt);
        this.opencloseaction = this.__getOption("Main", "openclose");
        
        //Need fix...
        //this.oExt.style.MozUserSelect = "none";

        this.oExt.onclick = function(e){
            this.host.dispatchEvent("onclick", {htmlEvent : e || event});
        }
    }
    
    this.__loadJML = function(x){
        this.openOnAdd   = !jpf.isFalse(x.getAttribute("openonadd"));
        this.startClosed = !jpf.isFalse(this.jml.getAttribute("startclosed") 
            || this.__getOption("Main", "startclosed"));
        this.noCollapse  = jpf.isTrue(this.jml.getAttribute("nocollapse"));
        if (this.noCollapse)
            this.startClosed = false;
        this.singleopen  = jpf.isTrue(this.jml.getAttribute("singleopen"));
        this.prerender   = !jpf.isFalse(this.jml.getAttribute("prerender"));
        
        jpf.JMLParser.parseChildren(this.jml, null, this);
    }
    
    this.__destroy = function(){
        this.oExt.onclick = null;
        jpf.removeNode(this.oDrag);
        this.oDrag = null;
    }
}

// #endif
