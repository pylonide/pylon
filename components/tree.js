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

// #ifdef __JTREE || __INC_ALL
// #define __WITH_CACHE 1
// #define __WITH_DATABINDING 1
// #define __WITH_MULTISELECT 1
// #define __WITH_PRESENTATION 1
// #define __WITH_GANIM 1

/* ***************
    TREE
****************/

var HAS_CHILD = 1 << 1;
var IS_CLOSED = 1 << 2;
var IS_LAST   = 1 << 3;
var IS_ROOT   = 1 << 4;

/**
 * Component displaying data whilst being aware of it's tree like structure and
 * allowing for special interaction to walk and view the data in an intuitive
 * manner for the user.
 *
 * @classDescription        This class creates a new tree
 * @return {Tree} Returns a new tree
 * @type {Tree}
 * @constructor
 * @allowchild {smartbinding}
 * @addnode components:tree
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.tree = function(pHtmlNode){
    jpf.register(this, "tree", GUI_NODE);/** @inherits jpf.Class */
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
    /**
     * @inherits jpf.DragDrop
     * @inherits jpf.MultiSelect
     * @inherits jpf.Cache
     */
    this.inherit(jpf.DragDrop, jpf.MultiSelect, jpf.Cache);

    this.multiselect = false; // Initially Disable MultiSelect
    
    /**
     * @inherits jpf.Presentation
     * @inherits jpf.DataBinding
     * @inherits jpf.JmlNode
     */
    this.inherit(jpf.Presentation, jpf.DataBinding, jpf.JmlNode);
    
    // #ifdef __WITH_RENAME
    this.inherit(jpf.Rename); /** @inherits jpf.Rename */
    // #endif
    
    this.clearMessage = "There are no items";
    this.startClosed  = true;
    this.animType     = jpf.tween.NORMAL;
    this.animSteps    = 3;
    this.animSpeed    = 20;
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.openAll = function(){};

    this.closeAll = function(){};
    
    this.selectPath = function(path){};
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/
    
    /* ***********************
            DRAGDROP
    ************************/
    // #ifdef __WITH_DRAGDROP
    this.__showDragIndicator = function(sel, e){
        var x = e.offsetX + 22;
        var y = e.offsetY;

        this.oDrag.startX = x;
        this.oDrag.startY = y;
        
        document.body.appendChild(this.oDrag);
        //this.oDrag.getElementsByTagName("DIV")[0].innerHTML = this.__selected.innerHTML;
        //this.oDrag.getElementsByTagName("IMG")[0].src = this.__selected.parentNode.parentNode.childNodes[1].firstChild.src;
        this.__updateNode(this.selected, this.oDrag);
        
        return this.oDrag;
    }
    
    this.__hideDragIndicator = function(){
        this.oDrag.style.display = "none";
    }
    
    this.__moveDragIndicator = function(e){
        this.oDrag.style.left = (e.clientX - this.oDrag.startX) + "px";
        this.oDrag.style.top  = (e.clientY - this.oDrag.startY) + "px";
    }
    
    this.__initDragDrop = function(){
        if (!this.__hasLayoutNode("dragindicator")) return;
        this.oDrag = jpf.XMLDatabase.htmlImport(
            this.__getLayoutNode("dragindicator"), document.body);
        
        this.oDrag.style.zIndex   = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor   = "default";
        this.oDrag.style.display  = "none";
    }
    
    this.findValueNode = function(el){
        if (!el) return null;

        while(el && el.nodeType == 1 
          && !el.getAttribute(jpf.XMLDatabase.htmlIdTag)) {
            el = el.parentNode;
        }

        return (el && el.nodeType == 1 && el.getAttribute(jpf.XMLDatabase.htmlIdTag)) 
            ? el 
            : null;
    }
    
    this.__dragout = function(dragdata){
        if (this.lastel)
            this.__setStyleClass(this.lastel, "", ["dragDenied", "dragInsert",
                "dragAppend", "selected", "indicate"]);
        this.__setStyleClass(this.__selected, "selected", ["dragDenied",
            "dragInsert", "dragAppend", "indicate"]);
        
        /*if(this.lastel) this.__dragdeselect(this.lastel);
        this.__dragdeselect(this.__selected);
        this.__select(this.__selected);*/
        this.lastel = null;
    }

    this.__dragover = function(el, dragdata, extra){
        if(el == this.oExt) return;
        
        this.__setStyleClass(this.lastel || this.__selected, "", ["dragDenied",
            "dragInsert", "dragAppend", "selected", "indicate"]);
        //if(this.lastel) this.__dragdeselect(this.lastel);
        //else this.__dragdeselect(this.__selected);
        
        
        this.__setStyleClass(this.lastel = this.findValueNode(el), extra 
            ? (extra[1].getAttribute("operation") == "insert-before" 
                ? "dragInsert" 
                : "dragAppend") 
            : "dragDenied");
        //this.__dragselect(this.lastel = this.findValueNode(el));
    }

    this.__dragdrop = function(el, dragdata, extra){
        this.__setStyleClass(this.lastel || this.__selected,
            !this.lastel && (this.__selected || this.lastel == this.__selected) 
                ? "selected" 
                : "", 
                ["dragDenied", "dragInsert", "dragAppend", "selected", "indicate"]);
        //if(this.lastel) this.__dragdeselect(this.lastel);
        //this.__dragdeselect(this.__selected);
        //this.__select(this.__selected);
        
        this.lastel = null;
    }
    
    // #endif
    
    /* ***********************
        Sliding Functions
    ************************/
    
    this.slideToggle = function(htmlNode, force){
        if(this.noCollapse) return;
        
        var id = htmlNode.getAttribute(jpf.XMLDatabase.htmlIdTag);
        while (!id && htmlNode.parentNode)
            var id = (htmlNode = htmlNode.parentNode)
                .getAttribute(jpf.XMLDatabase.htmlIdTag);

        /*var xmlNode = jpf.XMLDatabase.getNodeById(id);
        var hasChildren = this.getTraverseNodes(xmlNode).length || this.emptyMessage && this.applyRuleSetOnNode("empty", xmlNode);
        if(!hasChildren) return false;
        else if(!htmlNode.className.match(/plus|min/)) this.fixItem(xmlNode, htmlNode);*/

        var container = this.__getLayoutNode("Item", "container", htmlNode);
        if (jpf.getStyle(container, "display") == "block") {
            if(force == 1) return;
            htmlNode.className = htmlNode.className.replace(/min/, "plus");
            this.slideClose(container, jpf.XMLDatabase.getNode(htmlNode));
        }
        else {
            if (force == 2) return;
            htmlNode.className = htmlNode.className.replace(/plus/, "min");
            this.slideOpen(container, jpf.XMLDatabase.getNode(htmlNode));
        }
    }
    
    //htmlNode || xmlNode
    var lastOpened = {};
    this.slideOpen = function(container, xmlNode){
        var htmlNode = jpf.XMLDatabase.findHTMLNode(xmlNode, this);
        if (!container)
            container = this.__findContainer(htmlNode);

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode)
            var p = (pNode || this.XMLRoot).getAttribute(jpf.XMLDatabase.xmlIdTag);
            if (lastOpened[p] && lastOpened[p][1] != xmlNode 
              && this.getTraverseParent(lastOpened[p][1]) == pNode) 
                this.slideToggle(lastOpened[p][0], 2);//lastOpened[p][1]);
            lastOpened[p] = [htmlNode, xmlNode];
        }
        
        container.style.display = "block";

        jpf.tween.single(container, {
            type    : 'scrollheight', 
            from    : 0, 
            to      : container.scrollHeight, 
            anim    : this.animType, 
            steps   : this.animSteps,
            interval: this.animSpeed,
            onfinish: function(container, data){
                if (data[1] && data[0].hasLoadStatus(data[1], "potential")) {
                    //'jpf.lookup(' + data[0].uniqueId + ').doUpdate(jpf.XMLDatabase.getElementById("' + data[1].getAttribute(jpf.XMLDatabase.xmlIdTag) + '"));'
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
        
        if (this.singleopen) {
            var p = (this.getTraverseParent(xmlNode) || this.XMLRoot)
                .getAttribute(jpf.XMLDatabase.xmlIdTag);
            lastOpened[p] = null;
        }
        
        container.style.height   = container.offsetHeight;
        container.style.overflow = "hidden";

        jpf.tween.single(container, {
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
            
            if (rule.getAttribute("get"))
                this.getModel().insertFrom(rule.getAttribute("get"), xmlContext,
                    xmlContext, this);
            else {
                var data = this.applyRuleSetOnNode("insert", xmlNode);
                if (data)
                    this.insert(data, xmlContext);
            }
        }
        else if (!this.prerender) {
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
                this.fixItem(prevSib, this.getNodeFromCache(prevSib
                    .getAttribute(jpf.XMLDatabase.xmlIdTag) + "|" 
                    + this.uniqueId), null, true);

            //if no sibling fix parent
            if (!this.emptyMessage && xmlNode.parentNode.selectNodes(this.ruleTraverse).length == 1)
                this.fixItem(xmlNode.parentNode, this.getNodeFromCache(
                    xmlNode.parentNode.getAttribute(jpf.XMLDatabase.xmlIdTag) 
                    + "|" + this.uniqueId), null, false, true); 
        }
        else {
            var container = this.__getLayoutNode("Item", "container", htmlNode);
            
            if (noChildren) 
                var hasChildren = false;
            else if (xmlNode.selectNodes(this.ruleTraverse).length > 0)
                 var hasChildren = true;
            else if (this.bindingRules["insert"] 
              && this.getNodeFromRule("insert", xmlNode))
                var hasChildren = true;
            else
                var hasChildren = false;
            
            var isClosed = hasChildren && container.style.display != "block";
            var isLast   = this.getNextTraverse(xmlNode, null, oneLeft ? 2 : 1) 
                ? false 
                : true;

            var state = (hasChildren ? HAS_CHILD : 0) 
                | (isClosed ? IS_CLOSED : 0) | (isLast ? IS_LAST : 0);
            this.__setStyleClass(this.__getLayoutNode("Item", "class", htmlNode),
                this.State[state], ["min", "plus", "last", "minlast", "pluslast"]);
            this.__setStyleClass(this.__getLayoutNode("Item", "container", htmlNode),
                this.State[state], ["min", "plus", "last", "minlast", "pluslast"]);
            
            if (!hasChildren)
                container.style.display = "none";

            if (state & HAS_CHILD) {
                this.__getLayoutNode("Item", "openclose", htmlNode)
                    .onmousedown = new Function('e', "if(!e) e = event;\
                        if (e.button == 2) return;\
                        var o = jpf.lookup(" + this.uniqueId + ");\
                        o.slideToggle(this);\
                        if (o.onmousedown) o.onmousedown(e, this);\
                        jpf.cancelBubble(e, o);");
                this.__getLayoutNode("Item", "icon", htmlNode)[this.opencloseaction || "ondblclick"]
                    = new Function("var o = jpf.lookup(" + this.uniqueId + "); " +
                    //#ifdef __WITH_RENAME
                    "o.cancelRename();" + 
                    //#endif
                    " o.slideToggle(this);\
                    o.choose();");
                this.__getLayoutNode("Item", "select", htmlNode)[this.opencloseaction || "ondblclick"]
                    = new Function("var o = jpf.lookup(" + this.uniqueId + "); " +
                    //#ifdef __WITH_RENAME
                    "o.cancelRename();" + 
                    //#endif
                    " this.dorename=false;\
                    o.slideToggle(this);\
                    o.choose();");
            }
            /*else{
                //Experimental
                this.__getLayoutNode("Item", "openclose", htmlNode).onmousedown = null;
                this.__getLayoutNode("Item", "icon", htmlNode)[this.opencloseaction || "ondblclick"] = null;
                this.__getLayoutNode("Item", "select", htmlNode)[this.opencloseaction || "ondblclick"] = null;
            }*/
        }
    }

    //This can be optimized by NOT using getLayoutNode all the time
    this.initNode = function(xmlNode, state, Lid){
        //Setup Nodes Interaction
        this.__getNewContext("item");
        
        var hasChildren = state & HAS_CHILD || this.emptyMessage && this.applyRuleSetOnNode("empty", xmlNode);
        
        //should be restructured and combined events set per element 
        this.__getLayoutNode("item").setAttribute("onmouseover",
            "var o = jpf.lookup(" + this.uniqueId + ");\
            if (o.onmouseover) o.onmouseover(event, this)");
        this.__getLayoutNode("item").setAttribute("onmouseout",
            "var o = jpf.lookup(" + this.uniqueId + ");\
            if (o.onmouseout) o.onmouseout(event, this)");
        this.__getLayoutNode("item").setAttribute("onmousedown",
            "var o = jpf.lookup(" + this.uniqueId + ");\
            if (o.onmousedown) o.onmousedown(event, this);");
        
        //Set open/close skin class & interaction
        this.__setStyleClass(this.__getLayoutNode("Item", "class"), this.State[state]).setAttribute(jpf.XMLDatabase.htmlIdTag, Lid);
        this.__setStyleClass(this.__getLayoutNode("item", "container"), this.State[state])
        //this.__setStyleClass(this.__getLayoutNode("item"), xmlNode.tagName)
        var elOpenClose = this.__getLayoutNode("item", "openclose");
        if (hasChildren)
            elOpenClose.setAttribute(this.opencloseaction || "onmousedown",
                "var o = jpf.lookup(" + this.uniqueId + ");\
                o.slideToggle(this);\
                if (o.onmousedown) o.onmousedown(event, this);\
                jpf.cancelBubble(event, o);");
        
        //Icon interaction
        var elIcon = this.__getLayoutNode("item", "icon");
        if (hasChildren) {
            var strFunc = "var o = jpf.lookup(" + this.uniqueId + "); " +
                //#ifdef __WITH_RENAME
                "o.cancelRename();" + 
                //#endif
                "o.slideToggle(this);\
                jpf.cancelBubble(event,o);\
                o.choose();";
            if (this.opencloseaction != "onmousedown")
                elIcon.setAttribute(this.opencloseaction || "ondblclick", strFunc);
        }
        if (elIcon) {
            elIcon.setAttribute("onmousedown", 
                "jpf.lookup(" + this.uniqueId + ").select(this);" 
                + (strFunc && this.opencloseaction == "onmousedown" ? strFunc : ""));
            if (!elIcon.getAttribute("ondblclick"))
                elIcon.setAttribute("ondblclick", "jpf.lookup(" + this.uniqueId + ").choose();");
        }
        
        //Select interaction
        var elSelect = this.__getLayoutNode("item", "select");
        if (hasChildren) {
            var strFunc2 = "var o = jpf.lookup(" + this.uniqueId + ");" +
                //#ifdef __WITH_RENAME
                "o.cancelRename();" + 
                //#endif
                "o.slideToggle(this);\
                jpf.cancelBubble(event,o)";
            if (this.opencloseaction != "onmousedown")
                elSelect.setAttribute(this.opencloseaction || "ondblclick", strFunc2);
        }
        //if(event.button != 1) return; 
        elSelect.setAttribute("onmousedown",
            "var o = jpf.lookup(" + this.uniqueId + ");\
            if (!o.renaming && o.isFocussed() \
              && jpf.XMLDatabase.isChildOf(o.__selected, this) && o.selected)\
                this.dorename = true;\
              o.select(this);\
              if (o.onmousedown)\
              o.onmousedown(event, this);" 
              + (strFunc2 && this.opencloseaction == "onmousedown" ? strFunc2 : ""));
        if (!elSelect.getAttribute("ondblclick"))
            elSelect.setAttribute("ondblclick", 
                "var o = jpf.lookup(" + this.uniqueId + ");" +
                //#ifdef __WITH_RENAME
                "o.cancelRename();" + 
                //#endif
                "o.choose();");

        //#ifdef __WITH_RENAME
        elSelect.setAttribute("onmouseup", 
            "if(this.dorename) jpf.lookup(" + this.uniqueId + ").startDelayedRename(event);\
            this.dorename = false;");
        //#endif
        
        //elItem.setAttribute("contextmenu", "alert(1);var o = jpf.lookup(" + this.uniqueId + ");o.dispatchEvent("oncontextMenu", o.selected);");
        
        //Setup Nodes Identity (Look)
        if (elIcon) {
            var iconURL = this.applyRuleSetOnNode("icon", xmlNode);
            if (iconURL) {
                if (elIcon.tagName.match(/^img$/i))
                    elIcon.setAttribute("src", this.iconPath + iconURL);
                else
                    elIcon.setAttribute("style", "background-image:url(" + this.iconPath + iconURL + ")");
            }
        }

        var elCaption = this.__getLayoutNode("item", "caption");
        if (elCaption) 
            jpf.XMLDatabase.setNodeValue(elCaption,
                this.applyRuleSetOnNode("caption", xmlNode));
        
        var strTooltip = this.applyRuleSetOnNode("tooltip", xmlNode)
        if (strTooltip)
            this.__getLayoutNode("item").setAttribute("title", strTooltip);
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass) {
            this.__setStyleClass(this.__getLayoutNode("item", null,
                 this.__getLayoutNode("item")), cssClass);
            if (cssClass)
                this.dynCssClasses.push(cssClass);
        }
        // #endif

        return this.__getLayoutNode("item");
    }
    
    this.__deInitNode = function(xmlNode, htmlNode){
        //Lookup container
        var containerNode = this.__getLayoutNode("item", "container", htmlNode);
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
        //this.fixItem(xmlNode.parentNode, jpf.XMLDatabase.findHTMLNode(xmlNode.parentNode, this));
        /*throw new Error();
        if(xmlNode.previousSibling) //should use traverse here
            this.fixItem(xmlNode.previousSibling, jpf.XMLDatabase.findHTMLNode(xmlNode.previousSibling, this));*/
    }
    
    this.__moveNode = function(xmlNode, htmlNode){
        if (!self.jpf.debug && !htmlNode) return;
        
        var oPHtmlNode = htmlNode.parentNode;
        var pHtmlNode  = jpf.XMLDatabase.findHTMLNode(xmlNode.parentNode, this);
        //if(!pHtmlNode) return;
        
        var beforeNode = xmlNode.nextSibling 
            ? jpf.XMLDatabase.findHTMLNode(this.getNextTraverse(xmlNode), this) 
            : null;
        var pContainer = pHtmlNode 
            ? this.__getLayoutNode("item", "container", pHtmlNode) 
            : this.oInt;
        var container  = this.__getLayoutNode("item", "container", htmlNode);

        if (pContainer != oPHtmlNode && this.getTraverseNodes(xmlNode.parentNode).length == 1)
            this.clearEmpty(pContainer);

        pContainer.insertBefore(htmlNode, beforeNode);
        pContainer.insertBefore(container, beforeNode);
        
        /*if (!this.startClosed) {
            pContainer.style.display = "block";
            pContainer.style.height = "auto";
        }*/
        
        if (this.emptyMessage && !oPHtmlNode.childNodes.length)
            this.setEmpty(oPHtmlNode);
        
        if (this.openOnAdd && pHtmlNode != this.oInt && pContainer.style.display != "block") 
            this.slideOpen(pContainer, pHtmlNode);
        
        //Fix look (tree thing)
        this.fixItem(xmlNode, htmlNode);
        this.fixItem(xmlNode.parentNode,
            jpf.XMLDatabase.findHTMLNode(xmlNode.parentNode, this));
        if (this.getNextTraverse(xmlNode, true)) { //should use traverse here
            this.fixItem(this.getNextTraverse(xmlNode, true),
                jpf.XMLDatabase.findHTMLNode(this.getNextTraverse(xmlNode, true),
                this));
        }
    }
    
    this.__updateNode = function(xmlNode, htmlNode){
        //Update Identity (Look)
        var elIcon = this.__getLayoutNode("item", "icon", htmlNode);
        //if(!elIcon) alert(htmlNode.outerHTML);
        var iconURL = this.applyRuleSetOnNode("icon", xmlNode);
        if (elIcon && iconURL) {
            if (elIcon.tagName && elIcon.tagName.match(/^img$/i))
                elIcon.src = this.iconPath + iconURL;
            else
                elIcon.style.backgroundImage = "url(" + this.iconPath + iconURL + ")";
        }

        var elCaption = this.__getLayoutNode("item", "caption", htmlNode);
        if (elCaption) {
            if (elCaption.nodeType == 1)
                elCaption.innerHTML = this.applyRuleSetOnNode("caption", xmlNode);
            else
                elCaption.nodeValue = this.applyRuleSetOnNode("caption", xmlNode);
        }
        
        var strTooltip = this.applyRuleSetOnNode("tooltip", xmlNode);
        if (strTooltip) 
            htmlNode.setAttribute("title", strTooltip);

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
        jpf.XMLDatabase.htmlImport(oItem, container);
        
        /*if (!this.startClosed) {
            if (container.style) {
                container.style.display = "block";
                container.style.height = "auto";
            }
            else
                container.setAttribute("style", "display:block;height:auto;");
        }*/
    }
    
    this.__setLoading = function(xmlNode, container){
        this.__getNewContext("Loading");
        this.setLoadStatus(xmlNode, "potential");
        jpf.XMLDatabase.htmlImport(this.__getLayoutNode("Loading"), container);
    }
    
    this.__removeLoading = function(htmlNode){
        if (!htmlNode) return;
        this.__getLayoutNode("item", "container", htmlNode).innerHTML = "";
    }
    
    function xmlUpdateHandler(e){
        /*
            Display the animation if the item added is 
            * Not in the cache
            - Being insterted using xmlUpdate
            - there is at least 1 child inserted
        */
        
        if (e.action == "move-away")
            this.fixItem(e.xmlNode, jpf.XMLDatabase.findHTMLNode(e.xmlNode, this), true);

        if (e.action != "insert") return;
        
        var htmlNode = this.getNodeFromCache(e.xmlNode.getAttribute(
            jpf.XMLDatabase.xmlIdTag) + "|" + this.uniqueId);
        if (!htmlNode) return;
        if (this.hasLoadStatus(e.xmlNode, "loading") && e.result.length > 0) {
            var container = this.__getLayoutNode("item", "container", htmlNode);
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
    // #ifdef __WITH_RENAME
    this.addEventListener("onbeforerename", function(){
        if (this.tempsel) {
            clearTimeout(this.timer);
            this.select(this.tempsel);
            this.tempsel = null;
            this.timer   = null;
        }
    });
    // #endif
    
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
                    this.tempsel = null;
                    this.timer   = null;
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
                    this.tempsel = null;
                    this.timer   = null;
                }
            
                if (this.selected.selectSingleNode(this.ruleTraverse))
                    this.slideToggle(this.__selected, 1)
                break;
            case 46:
                //DELETE
                var xmlNode  = this.selected;
                var i        = 0;
                var ln       = 1
                var nextNode = xmlNode;
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
                    ? jpf.XMLDatabase.getNode(this.tempsel) 
                    : this.selected;
                
                var sNode = this.getNextTraverse(node, true);
                if (sNode) {
                    var nodes = this.getTraverseNodes(sNode);//.selectNodes(this.ruleTraverse);
                    
                    do {
                        var container = this.__getLayoutNode("item", "container",
                            this.getNodeFromCache(jpf.XMLDatabase.getID(sNode, this)));
                        if (jpf.getStyle(container, "display") == "block") {
                            if (nodes.length)
                                sNode = nodes[nodes.length-1];
                            else
                                break;
                        }
                        else 
                            break;
                    }
                    while (sNode && (nodes = this.getTraverseNodes(sNode)).length);//sNode.selectNodes(this.ruleTraverse)
                }
                else 
                    if (this.getTraverseParent(node) == this.XMLRoot) return;
                else
                    sNode = this.getTraverseParent(node);

                if (sNode && sNode.nodeType == 1) {
                    clearTimeout(this.timer);
                    var id = jpf.XMLDatabase.getID(sNode, this);
                    this.__deselect(this.tempsel || this.__selected);
                    this.tempsel = this.__select(document.getElementById(id));//SHOULD BE FAKE SELECT
                    this.timer = setTimeout("var o = jpf.lookup(" + this.uniqueId + ");\
                        o.tempsel = null;\
                        o.timer   = null;\
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
                    ? jpf.XMLDatabase.getNode(this.tempsel) 
                    : this.selected;
                
                var sNode = this.getFirstTraverseNode(node);//node.selectSingleNode(this.ruleTraverse);
                if (sNode) {
                    var container = this.__getLayoutNode("item", "container",
                        this.getNodeFromCache(jpf.XMLDatabase.getID(node, this)));
                    if (jpf.getStyle(container, "display") != "block")
                        sNode = null;
                }
                
                while (!sNode) {
                    var pNode = this.getTraverseParent(node);
                    if (!pNode) break;
                    
                    var i = 0;
                    var nodes = this.getTraverseNodes(pNode);//node.parentNode.selectNodes(this.ruleTraverse);
                    while (nodes[i] && nodes[i] != node)
                        i++;
                    sNode = nodes[i+1];
                    node  = pNode;
                }
                
                if(sNode && sNode.nodeType == 1) {
                    clearTimeout(this.timer);
                    var id = jpf.XMLDatabase.getID(sNode, this);
                    this.__deselect(this.tempsel || this.__selected);
                    this.tempsel = this.__select(document.getElementById(id));//SHOULD BE FAKE SELECT
                    this.timer = setTimeout("var o = jpf.lookup(" + this.uniqueId + ");\
                        o.tempsel=null;\
                        o.select(document.getElementById('" + id + "'));", 300);
                }
                
                if (this.tempsel && this.tempsel.offsetTop + this.tempsel.offsetHeight
                  > this.oExt.scrollTop + this.oExt.offsetHeight)
                    this.oExt.scrollTop = this.tempsel.offsetTop 
                        - this.oExt.offsetHeight + this.tempsel.offsetHeight + 10;
                
                return false;
                break;
        }
    }
    // #endif
    
    /* ***********************
              RENAME
    ************************/
    // #ifdef __WITH_RENAME
    this.__getCaptionElement = function(){
        var x = this.__getLayoutNode("item", "caption", this.__selected);
        return x.nodeType == 1 ? x : x.parentNode;
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
        var hasChildren = loadChildren || xmlNode.selectSingleNode(
            this.ruleTraverse) ? true : false;
        
        var startClosed = this.startClosed;// || this.applyRuleSetOnNode("collapse", xmlNode, ".") !== false;
        var state       = (hasChildren ? HAS_CHILD : 0) | (startClosed && hasChildren 
            || loadChildren ? IS_CLOSED : 0) | (isLast ? IS_LAST : 0);

        var htmlNode  = this.initNode(xmlNode, state, Lid);
        var container = this.__getLayoutNode("item", "container");
        if (!startClosed && !this.noCollapse)
            container.setAttribute("style", "overflow:visible;height:auto;display:block;");
        
        //TEMP on for dynamic subloading
        if (!hasChildren || loadChildren)
            container.setAttribute("style", "display:none;");
        
        //Dynamic SubLoading (Insertion) of SubTree
        if (loadChildren && !this.hasLoadStatus(xmlNode))
            this.__setLoading(xmlNode, container);
        else if (!this.getTraverseNodes(xmlNode).length 
          && this.applyRuleSetOnNode("empty", xmlNode))
            this.setEmpty(container);
        
        if (!htmlParentNode && xmlParentNode == this.XMLRoot) {
            this.nodes.push(htmlNode);
            if (!jpf.XMLDatabase.isChildOf(htmlNode, container, true))
                this.nodes.push(container);
            
            this.__setStyleClass(htmlNode,  "root");
            this.__setStyleClass(container, "root");
        }
        else {
            if (!htmlParentNode) {
                var htmlParentNode = jpf.XMLDatabase.findHTMLNode(
                    xmlNode.parentNode, this);
                htmlParentNode     = htmlParentNode 
                    ? this.__getLayoutNode("item", "container", htmlParentNode) 
                    : this.oInt;
            }
            
            if (htmlParentNode == this.oInt) {
                this.__setStyleClass(htmlNode,  "root");
                this.__setStyleClass(container, "root");
            }
            
            if (!beforeNode && this.getNextTraverse(xmlNode))
                beforeNode = jpf.XMLDatabase.findHTMLNode(this.getNextTraverse(xmlNode), this);
            if (beforeNode && beforeNode.parentNode != htmlParentNode)
                beforeNode = null;
        
            if (htmlParentNode.style 
              && this.getTraverseNodes(xmlNode.parentNode).length == 1) 
                this.clearEmpty(htmlParentNode);
        
            //alert("|" + htmlNode.nodeType + "-" + htmlParentNode.nodeType + "-" + beforeNode + ":" + container.nodeType);
            //Insert Node into Tree
            if (htmlParentNode.style) {
                jpf.XMLDatabase.htmlImport(htmlNode, htmlParentNode, beforeNode);
                if (!jpf.XMLDatabase.isChildOf(htmlNode, container, true)) 
                    var container = jpf.XMLDatabase.htmlImport(container, 
                        htmlParentNode, beforeNode);
            }
            else {
                htmlParentNode.insertBefore(htmlNode, beforeNode);
                if (!jpf.XMLDatabase.isChildOf(htmlParentNode, container, true)) 
                    htmlParentNode.insertBefore(container, beforeNode);
            }

            //Fix parent if child is added to drawn parentNode
            if (htmlParentNode.style) {
                if (!startClosed && this.openOnAdd && htmlParentNode != this.oInt 
                  && htmlParentNode.style.display != "block") 
                    this.slideOpen(htmlParentNode, xmlParentNode);
                
                //this.fixItem(xmlNode, htmlNode); this one shouldn't be called, because it should be set right at init
                this.fixItem(xmlParentNode, jpf.XMLDatabase.findHTMLNode(xmlParentNode, this));
                if (this.getNextTraverse(xmlNode, true)) { //should use traverse here
                    this.fixItem(this.getNextTraverse(xmlNode, true), 
                        jpf.XMLDatabase.findHTMLNode(this.getNextTraverse(xmlNode, true),
                        this));
                }
            }
        }
        
        if (this.prerender)
            this.__addNodes(xmlNode, container, true); //checkChildren ???
        else {
            this.setLoadStatus(xmlNode, "potential");
        }

        return container;
    }
    
    this.__fill = function(){
        //if(!this.nodes.length) return;
        //this.oInt.innerHTML = "";
        jpf.XMLDatabase.htmlImport(this.nodes, this.oInt);
        this.nodes.length = 0;

        //for(var i=0;i<this.nodes.length;i++)
            //jpf.XMLDatabase.htmlImport(this.nodes[i], this.oInt);
        //this.nodes.length = 0;
    }
    
    this.__getParentNode = function(htmlNode){
        return htmlNode 
            ? this.__getLayoutNode("item", "container", htmlNode) 
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
        return this.__getLayoutNode("item", "container", htmlNode);
    }
    
    this.__selectDefault = function(xmlNode){
        if (this.select(this.getFirstTraverseNode(xmlNode)))
            return true;
        else {
            var nodes = this.getTraverseNodes(xmlNode);
            for (var i = 0; i < nodes.length; i++) {
                if (this.__selectDefault(nodes[i]))
                    return true;
            }
        }
    }
    
    /* ***********************
              INIT
    ************************/
    
    //render the outer framework of this object
    this.draw = function(){
        //Build Main Skin
        this.oExt = this.__getExternal(); 
        this.oInt = this.__getLayoutNode("main", "container", this.oExt);
        this.opencloseaction = this.__getOption("main", "openclose");
        
        //Need fix...
        //this.oExt.style.MozUserSelect = "none";

        this.oExt.onclick = function(e){
            this.host.dispatchEvent("onclick", {htmlEvent : e || event});
        }
    }
    
    this.__loadJML = function(x){
        this.openOnAdd   = !jpf.isFalse(x.getAttribute("openonadd"));
        this.startClosed = !jpf.isFalse(this.jml.getAttribute("startclosed") 
            || this.__getOption("main", "startclosed"));
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
        this.oDrag       = null;
    }
}

// #endif