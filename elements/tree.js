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
// #define __WITH_TWEEN 1

/**
 * Element displaying data in a list where each item in the list can contain
 * such a list. This element gives the user the ability to walk through this
 * tree of data by clicking open elements to show more elements. The tree
 * can grow by fetching more data when the user requests it.
 * Example:
 * A tree with inline items.
 * <code>
 *  <j:tree id="tree" align="right">
 *      <j:item caption="root" icon="icoUsers.gif">
 *          <j:item icon="icoUsers.gif" caption="test">
 *              <j:item icon="icoUsers.gif" caption="test" />
 *              <j:item icon="icoUsers.gif" caption="test" />
 *              <j:item icon="icoUsers.gif" caption="test" />
 *          </j:item>
 *          <j:item icon="icoUsers.gif" caption="test" />
 *          <j:item icon="icoUsers.gif" caption="test" />
 *          <j:item icon="icoUsers.gif" caption="test" />
 *      </j:item>
 *  </j:tree>
 * </code>
 * Example:
 * <code>
 *  <j:tree model="url:items.xml">
 *      <j:bindings>
 *          <j:caption select="@name" />
 *          <j:icon select="@icon"/>
 *          <j:traverse select="file|folder" />
 *      </j:bindings>
 *  </j:tree>
 * </code>
 *
 * @constructor
 * @define tree
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits jpf.Validation
 * @inherits jpf.XForms
 * @inherits jpf.DragDrop
 * @inherits jpf.MultiSelect
 * @inherits jpf.Cache
 * @inherits jpf.Presentation
 * @inherits jpf.DataBinding
 * @inherits jpf.Rename
 *
 * @binding insert Determines how new data is loaded when the user expands 
 * an item. For instance by clicking on the + button. This way only the root nodes
 * need to be loaded at the start of the application. All other children are
 * received on demand when the user requests it by navigating throught the tree.
 * Example:
 * This example shows an insert rule that only works on folder elements. It will
 * read the directory contents using webdav and insert it under the selected 
 * tree node.
 * <code>
 *  <j:bindings>
 *      <j:caption select="@caption" />
 *      <j:insert select="self::folder" get="webdav:readdir({@id})" />
 *      <j:traverse select="folder" />
 *  </j:bindings>
 * </code>
 * @attribute {String} get the {@link term.datainstruction data instruction} that is used to load the new data.
 * @binding caption  Determines the caption of a tree node.
 * @binding icon     Determines the icon of a tree node.
 * @binding css      Determines a css class for a tree node.
 * Example:
 * In this example a node is bold when the folder contains unread messages:
 * <code>
 *  <j:tree>
 *      <j:bindings>
 *          <j:caption select="@caption" />
 *          <j:css select="message[@unread]" value="highlighUnread" />
 *          <j:icon select="@icon" />
 *          <j:icon select="self::folder" value="icoFolder.gif" />
 *          <j:traverse select="folder" />
 *      </j:bindings>
 *  </j:tree>
 * </code>
 * @binding tooltip  Determines the tooltip of a tree node.
 * @binding empty    Determines the empty message of a node.
 * Example:
 * This example shows a gouped contact list, that displays a message under 
 * empty groups.
 * <code>
 *  <j:tree>
 *      <j:bindings>
 *          <j:caption select="@caption" />
 *          <j:icon select="self::contact" value="icoContact.png" />
 *          <j:icon select="self::group" value="icoFolder.png" />
 *          <j:empty select="self::group" value="Drag a contact to this group." />
 *          <j:traverse select="group|contact" />
 *      </j:bindings>
 *  </j:tree>
 * </code>
 */
jpf.tree = jpf.component(jpf.NODE_VISIBLE, function(){
    //Options
    this.isTreeArch   = true; // This element has a tree architecture.
    this.$focussable  = true; // This object can get the focus.
    this.multiselect  = false; // Initially multiselect is disabled.
    this.bufferselect = true;
    
    this.startcollapsed  = true;
    this.animType        = jpf.tween.NORMAL;
    this.animOpenStep    = 3;
    this.animCloseStep   = 1;
    this.animSpeed       = 10;
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif
    
    var HAS_CHILD = 1 << 1;
    var IS_CLOSED = 1 << 2;
    var IS_LAST   = 1 << 3;
    var IS_ROOT   = 1 << 4;
    
    var _self     = this;
    var treeState = {};
    this.nodes    = [];
    
    treeState[0]                               = "";
    treeState[HAS_CHILD]                       = "min";
    treeState[HAS_CHILD | IS_CLOSED]           = "plus";
    treeState[IS_LAST]                         = "last";
    treeState[IS_LAST | HAS_CHILD]             = "minlast";
    treeState[IS_LAST | HAS_CHILD | IS_CLOSED] = "pluslast";
    treeState[IS_ROOT]                         = "root";
    
    /**** Properties and Attributes ****/

    /**
     * @attribute {Boolean} openadd         whether the tree expands the parent to which a node is added. Defaults to true.
     * @attribute {Boolean} startcollapsed  whether the tree collapses all nodes that contain children on load. Defaults to true.
     * @attribute {Boolean} nocollapse      whether the user cannot collapse a node. Defaults to false.
     * @attribute {Boolean} singleopen      whether the tree will expand a node by a single click. Defaults to false.
     * @attribute {Boolean} prerender       whether the tree will render all the nodes at load. Defaults to true.
     */
    this.$booleanProperties["openadd"]        = true;
    this.$booleanProperties["startcollapsed"] = true;
    this.$booleanProperties["nocollapse"]     = true;
    this.$booleanProperties["singleopen"]     = true;
    this.$booleanProperties["prerender"]      = true;
    
    this.openadd        = true;
    this.startcollapsed = 1;
    this.prerender      = true;
    
    /**
     * @attribute {String} mode Sets the way this element interacts with the user.
     *   Possible values:
     *   check  the user can select a single item from this element. The selected item is indicated.
     *   radio  the user can select multiple items from this element. Each selected item is indicated.
     */
    this.mode = "normal";
    this.$propHandlers["mode"] = function(value){
        this.mode = value || "normal";
        
        if ("check|radio".indexOf(this.mode) > -1) {
            this.allowdeselect = false;
            
            this.addEventListener("afterrename", $afterRenameMode);
            
            if (this.mode == "check") {
                this.autoselect    = false;
                this.ctrlselect    = true;
                this.bufferselect  = false;
                this.multiselect   = true;
                this.delayedselect = false;
                
                this.addEventListener("afterselect", function(e){
                    var pNode = this.getTraverseParent(e.xmlNode);
                    
                    if (pNode != this.xmlRoot) {
                        var nodes = this.getTraverseNodes(pNode);
                        var sel   = e.list;
                        
                        var count = 0;
                        for (var i = 0; i < nodes.length; i++) {
                            if (sel.contains(nodes[i]))
                                count++;
                        }
                        
                        if (count) {
                            var htmlNode = jpf.xmldb.findHTMLNode(this.getTraverseParent(e.xmlNode), this);
                            jpf.setStyleClass(htmlNode, count == nodes.length 
                                ? "selected"
                                : "partial", ["partial", "selected"]);
                            
                            if (!this.isSelected(pNode))
                                this.select(pNode, null, null, null, null, true);
                        }
                        else {
                            var htmlNode = jpf.xmldb.findHTMLNode(pNode, this);
                            jpf.setStyleClass(htmlNode, "", ["partial", "selected"]);
                            
                            if (this.isSelected(pNode))
                                this.select(pNode);
                        }
                    }
                    
                    var to = this.isSelected(e.xmlNode);
                    nodes  = this.getTraverseNodes(e.xmlNode);
                    if (nodes.length) {
                        for (var i = 0; i < nodes.length; i++) {
                            if (to != this.isSelected(nodes[i]))
                                this.select(nodes[i]);
                        }

                        jpf.setStyleClass(jpf.xmldb.findHTMLNode(e.xmlNode, this), 
                            to ? "selected" : "", ["partial", "selected"]);
                    }
                    
                    this.setIndicator(e.xmlNode);
                });
            }
            else if (this.mode == "radio")
                this.multiselect = false;
            
            //if (!this.actionRules) //default disabled
                //this.actionRules = {}
        }
        else {
            //@todo undo actionRules setting
            this.ctrlselect = false;
            this.bufferselect = true;//hmm fishy
            this.multiselect = false;//hmm fishy
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
    
    /**** Public Methods ****/
    
    /**
     * @notimplemented
     * @todo who's volunteering?
     * @private
     */
    this.openAll    = function(){};
    
    /**
     * @notimplemented
     * @todo who's volunteering?
     * @private
     */
    this.closeAll   = function(){};
    
    /**
     * @notimplemented
     * @todo who's volunteering?
     * @private
     */
    this.selectPath = function(path){};
    
    /**** Sliding functions ****/
    
    /**
     * @private
     */
    this.slideToggle = function(htmlNode, force){
        if (this.nocollapse)
            return;
        
        if (!htmlNode)
            htmlNode = this.$selected;
        
        var id = htmlNode.getAttribute(jpf.xmldb.htmlIdTag);
        while (!id && htmlNode.parentNode)
            id = (htmlNode = htmlNode.parentNode)
                .getAttribute(jpf.xmldb.htmlIdTag);
        var container = this.$getLayoutNode("item", "container", htmlNode);
        if (jpf.getStyle(container, "display") == "block") {
            if (force == 1) return;
            htmlNode.className = htmlNode.className.replace(/min/, "plus");
            this.slideClose(container, jpf.xmldb.getNode(htmlNode));
        }
        else {
            if (force == 2) return;
            htmlNode.className = htmlNode.className.replace(/plus/, "min");
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
        if (this.nocollapse) 
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
    
    /**** DragDrop Support ****/
    
    // #ifdef __WITH_DRAGDROP
    this.$showDragIndicator = function(sel, e){
        var x = e.offsetX + 22;
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
        if (!this.$hasLayoutNode("dragindicator")) return;
        this.oDrag = jpf.xmldb.htmlImport(
            this.$getLayoutNode("dragindicator"), document.body);
        
        this.oDrag.style.zIndex   = 1000000;
        this.oDrag.style.position = "absolute";
        this.oDrag.style.cursor   = "default";
        this.oDrag.style.display  = "none";
    };
    
    /**
     * @private
     */
    this.$findValueNode = function(el){
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
        
        this.$setStyleClass(this.lastel = this.$findValueNode(el), extra 
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
    
    /**** Databinding Support ****/

    //@todo refactor
    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode, isLast){
        var loadChildren = this.bindingRules && this.bindingRules["insert"] 
            ? this.getNodeFromRule("insert", xmlNode) 
            : false;
        var hasTraverseNodes = xmlNode.selectSingleNode(this.traverse) ? true : false;
        var hasChildren = loadChildren || hasTraverseNodes;
        
        var startcollapsed = this.startcollapsed;// || this.applyRuleSetOnNode("collapse", xmlNode, ".") !== false;
        var state       = (hasChildren ? HAS_CHILD : 0) | (startcollapsed && hasChildren 
            || loadChildren ? IS_CLOSED : 0) | (isLast ? IS_LAST : 0);

        var htmlNode  = this.$initNode(xmlNode, state, Lid);
        var container = this.$getLayoutNode("item", "container");
        if (!startcollapsed && !this.nocollapse)
            container.setAttribute("style", "overflow:visible;height:auto;display:block;");
        
        var removeContainer = (!this.removecontainer || hasChildren);
        
        //TEMP on for dynamic subloading
        if (!hasChildren || loadChildren) {
            container.setAttribute("style", "display:none;");
        }
        
        //Dynamic SubLoading (Insertion) of SubTree
        if (!this.prerender)
            var traverseLength = this.getTraverseNodes(xmlNode).length;

        if (loadChildren && (!this.hasLoadStatus(xmlNode) 
          || this.hasLoadStatus(xmlNode, "potential")) 
          || hasChildren && !this.prerender && traverseLength > 2)
            this.$setLoading(xmlNode, container);
        else if (!hasTraverseNodes && this.applyRuleSetOnNode("empty", xmlNode))
            this.$setClearMessage(container);

        if ((!htmlParentNode || htmlParentNode == this.oInt) 
          && xmlParentNode == this.xmlRoot && !beforeNode) {
            this.nodes.push(htmlNode);
            if (!jpf.xmldb.isChildOf(htmlNode, container, true) && removeContainer)
                this.nodes.push(container);
            
            this.$setStyleClass(htmlNode,  "root");
            this.$setStyleClass(container, "root");
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
            }
            
            if (!beforeNode && this.getNextTraverse(xmlNode))
                beforeNode = jpf.xmldb.findHTMLNode(this.getNextTraverse(xmlNode), this);
            if (beforeNode && beforeNode.parentNode != htmlParentNode)
                beforeNode = null;
        
            if (htmlParentNode.style 
              && this.getTraverseNodes(xmlNode.parentNode).length == 1) 
                this.$removeClearMessage(htmlParentNode);
        
            //alert("|" + htmlNode.nodeType + "-" + htmlParentNode.nodeType + "-" + beforeNode + ":" + container.nodeType);
            //Insert Node into Tree
            if (htmlParentNode.style) {
                jpf.xmldb.htmlImport(htmlNode, htmlParentNode, beforeNode);
                if (!jpf.xmldb.isChildOf(htmlNode, container, true) && removeContainer) 
                    var container = jpf.xmldb.htmlImport(container, 
                        htmlParentNode, beforeNode);
            }
            else {
                htmlParentNode.insertBefore(htmlNode, beforeNode);
                if (!jpf.xmldb.isChildOf(htmlParentNode, container, true) && removeContainer) 
                    htmlParentNode.insertBefore(container, beforeNode);
            }

            //Fix parent if child is added to drawn parentNode
            if (htmlParentNode.style) {
                if (!startcollapsed && this.openadd && htmlParentNode != this.oInt 
                  && htmlParentNode.style.display != "block") 
                    this.slideOpen(htmlParentNode, xmlParentNode, true);
                
                //this.$fixItem(xmlNode, htmlNode); this one shouldn't be called, because it should be set right at init
                this.$fixItem(xmlParentNode, jpf.xmldb.findHTMLNode(xmlParentNode, this));
                if (this.getNextTraverse(xmlNode, true)) { //should use traverse here
                    this.$fixItem(this.getNextTraverse(xmlNode, true), 
                        jpf.xmldb.findHTMLNode(this.getNextTraverse(xmlNode, true),
                        this));
                }
            }
        }

        if (this.prerender || traverseLength < 3)
            this.$addNodes(xmlNode, container, false); //checkChildren ???
        /*else {
            this.setLoadStatus(xmlNode, "potential");
        }*/

        return container;
    };
    
    this.$fill = function(){
        //if(!this.nodes.length) return;
        //this.oInt.innerHTML = "";
        jpf.xmldb.htmlImport(this.nodes, this.oInt);
        this.nodes.length = 0;

        //for(var i=0;i<this.nodes.length;i++)
            //jpf.xmldb.htmlImport(this.nodes[i], this.oInt);
        //this.nodes.length = 0;
    };
    
    this.$getParentNode = function(htmlNode){
        return htmlNode 
            ? this.$getLayoutNode("item", "container", htmlNode) 
            : this.oInt;
    };

    this.$fixItem = function(xmlNode, htmlNode, isDeleting, oneLeft, noChildren){
        if (!htmlNode) return;

        if (isDeleting) {
            //if isLast fix previousSibling
            if (prevSib = this.getNextTraverse(xmlNode, true))
                this.$fixItem(prevSib, this.getNodeFromCache(prevSib
                    .getAttribute(jpf.xmldb.xmlIdTag) + "|" 
                    + this.uniqueId), null, true);

            //if no sibling fix parent
            if (!this.emptyMessage && xmlNode.parentNode.selectNodes(this.traverse).length == 1)
                this.$fixItem(xmlNode.parentNode, this.getNodeFromCache(
                    xmlNode.parentNode.getAttribute(jpf.xmldb.xmlIdTag) 
                    + "|" + this.uniqueId), null, false, true); 
        }
        else {
            var container   = this.$getLayoutNode("item", "container", htmlNode);
            var hasChildren = false;
            if (noChildren) 
                hasChildren = false;
            else if (xmlNode.selectNodes(this.traverse).length > 0)
                hasChildren = true;
            //this.bindingRules && this.bindingRules["insert"] && this.getNodeFromRule("insert", xmlNode) 
            else if (this.hasLoadStatus(xmlNode, "potential"))
                hasChildren = true;
            else
                hasChildren = false;
            
            var isClosed = hasChildren && container.style.display != "block";
            var isLast   = this.getNextTraverse(xmlNode, null, oneLeft ? 2 : 1) 
                ? false 
                : true;

            var state = (hasChildren ? HAS_CHILD : 0) 
                | (isClosed ? IS_CLOSED : 0) | (isLast ? IS_LAST : 0);
            this.$setStyleClass(this.$getLayoutNode("item", "class", htmlNode),
                treeState[state], ["min", "plus", "last", "minlast", "pluslast"]);
            this.$setStyleClass(this.$getLayoutNode("item", "container", htmlNode),
                treeState[state], ["min", "plus", "last", "minlast", "pluslast"]);
            
            if (!hasChildren && container)
                container.style.display = "none";

            if (state & HAS_CHILD) {
                //@todo please rewrite this to a normal way of doing this
                var elOpenClose = this.$getLayoutNode("item", "openclose", htmlNode);
                if (elOpenClose) {
                    elOpenClose.onmousedown = new Function('e', "if(!e) e = event;\
                        if (e.button == 2) return;\
                        var o = jpf.lookup(" + this.uniqueId + ");\
                        o.slideToggle(this);\
                        if (o.onmousedown) o.onmousedown(e, this);\
                        jpf.cancelBubble(e, o);");
                }
                
                var elIcon = this.$getLayoutNode("item", "icon", htmlNode);
                if (elIcon) {
                    elIcon[this.opencloseaction || "ondblclick"]
                        = new Function("var o = jpf.lookup(" + this.uniqueId + "); " +
                        //#ifdef __WITH_RENAME
                        "o.stopRename();" + 
                        //#endif
                        " o.slideToggle(this);\
                        o.choose();");
                }
                
                this.$getLayoutNode("item", "select", htmlNode)[this.opencloseaction || "ondblclick"]
                    = new Function("var o = jpf.lookup(" + this.uniqueId + "); " +
                    //#ifdef __WITH_RENAME
                    "o.stopRename();" + 
                    //#endif
                    " this.dorename=false;\
                    o.slideToggle(this);\
                    o.choose();");
            }
            /*else{
                //Experimental
                this.$getLayoutNode("item", "openclose", htmlNode).onmousedown = null;
                this.$getLayoutNode("item", "icon", htmlNode)[this.opencloseaction || "ondblclick"] = null;
                this.$getLayoutNode("item", "select", htmlNode)[this.opencloseaction || "ondblclick"] = null;
            }*/
        }
    };

    //@todo please upgrade all the event calls to the 21st century, it hurts my eyes.
    this.$initNode = function(xmlNode, state, Lid){
        //Setup Nodes Interaction
        this.$getNewContext("item");
        
        var hasChildren = state & HAS_CHILD || this.emptyMessage && this.applyRuleSetOnNode("empty", xmlNode);
        
        //should be restructured and combined events set per element 
        var oItem = this.$getLayoutNode("item");
        //@todo this should use dispatchEvent, and be moved to oExt
        oItem.setAttribute("onmouseover",
            "var o = jpf.lookup(" + this.uniqueId + ");\
            if (o.onmouseover) o.onmouseover(event, this);\
            jpf.setStyleClass(this, 'hover');");
        oItem.setAttribute("onmouseout",
            "var o = jpf.lookup(" + this.uniqueId + ");\
            if (o.onmouseout) o.onmouseout(event, this);\
            jpf.setStyleClass(this, '', ['hover']);");
        oItem.setAttribute("onmousedown",
            "var o = jpf.lookup(" + this.uniqueId + ");\
            if (o.onmousedown) o.onmousedown(event, this);");
        
        //Set open/close skin class & interaction
        this.$setStyleClass(this.$getLayoutNode("item", "class"), treeState[state]).setAttribute(jpf.xmldb.htmlIdTag, Lid);
        this.$setStyleClass(this.$getLayoutNode("item", "container"), treeState[state])
        //this.$setStyleClass(oItem, xmlNode.tagName)
        var elOpenClose = this.$getLayoutNode("item", "openclose");
        if (hasChildren && elOpenClose) {
            elOpenClose.setAttribute(this.opencloseaction || "onmousedown",
                "var o = jpf.lookup(" + this.uniqueId + ");\
                o.slideToggle(this);\
                if (o.onmousedown) o.onmousedown(event, this);\
                jpf.cancelBubble(event, o);");
        }
        
        //Icon interaction
        var elIcon = this.$getLayoutNode("item", "icon");
        if (elIcon) {
            if (hasChildren) {
                var strFunc = "var o = jpf.lookup(" + this.uniqueId + ");\
                    o.choose()" + 
                    //#ifdef __WITH_RENAME
                    "o.stopRename();" + 
                    //#endif
                    "o.slideToggle(this);\
                    jpf.cancelBubble(event,o);";
                
                if (this.opencloseaction != "onmousedown")
                    elIcon.setAttribute(this.opencloseaction || "ondblclick", strFunc);
            }

            elIcon.setAttribute("onmousedown", 
                "jpf.lookup(" + this.uniqueId + ").select(this, event.ctrlKey, event.shiftKey);" 
                + (strFunc && this.opencloseaction == "onmousedown" ? strFunc : ""));
                
            if (!elIcon.getAttribute("ondblclick"))
                elIcon.setAttribute("ondblclick", "var o = jpf.lookup(" + this.uniqueId + ");\
                    o.choose();" +
                    //#ifdef __WITH_RENAME
                    "o.stopRename();" +
                    //#endif
                    ""
                );
        }
        
        //Select interaction
        var elSelect = this.$getLayoutNode("item", "select");
        if (hasChildren) {
            var strFunc2 = "var o = jpf.lookup(" + this.uniqueId + ");\
                o.choose();" +
                //#ifdef __WITH_RENAME
                "o.stopRename();" + 
                //#endif
                "o.slideToggle(this);\
                jpf.cancelBubble(event,o);";
            if (this.opencloseaction != "onmousedown")
                elSelect.setAttribute(this.opencloseaction || "ondblclick", strFunc2);
        }
        //if(event.button != 1) return; 
        elSelect.setAttribute("onmousedown",
            "var o = jpf.lookup(" + this.uniqueId + ");\
             if (!o.renaming && o.hasFocus() \
               && jpf.xmldb.isChildOf(o.$selected, this) && o.selected)\
                 this.dorename = true;\
             o.select(this, event.ctrlKey, event.shiftKey);\
             if (o.onmousedown)\
                o.onmousedown(event, this);" 
             + (strFunc2 && this.opencloseaction == "onmousedown" ? strFunc2 : ""));

        if (!elSelect.getAttribute("ondblclick"))
            elSelect.setAttribute("ondblclick", 
                "var o = jpf.lookup(" + this.uniqueId + ");" +
                //#ifdef __WITH_RENAME
                "o.stopRename();" + 
                //#endif
                "o.choose();");

        //#ifdef __WITH_RENAME
        elSelect.setAttribute("onmouseup", 
            "var o = jpf.lookup(" + this.uniqueId + ");\
            if (this.dorename && o.mode == 'normal') \
                o.startDelayedRename(event);\
            this.dorename = false;");
        //#endif
        
        //elItem.setAttribute("contextmenu", "alert(1);var o = jpf.lookup(" + this.uniqueId + ");o.dispatchEvent("contextMenu", o.selected);");
        
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

        var elCaption = this.$getLayoutNode("item", "caption");
        if (elCaption) 
            jpf.xmldb.setNodeValue(elCaption,
                this.applyRuleSetOnNode("caption", xmlNode));
        
        var strTooltip = this.applyRuleSetOnNode("tooltip", xmlNode)
        if (strTooltip)
            oItem.setAttribute("title", strTooltip);
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass) {
            this.$setStyleClass(this.$getLayoutNode("item", null, oItem), cssClass);
            this.$setStyleClass(this.$getLayoutNode("item", "container", oItem), cssClass);
            this.dynCssClasses.push(cssClass);
        }
        // #endif

        return oItem;
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
            this.$fixItem(xmlNode, htmlNode, true);
        
        if (this.emptyMessage && !pContainer.childNodes.length)
            this.$setClearMessage(pContainer);
        
        //Fix look (tree thing)
        this.$fixItem(xmlNode, htmlNode, true);
        //this.$fixItem(xmlNode.parentNode, jpf.xmldb.findHTMLNode(xmlNode.parentNode, this));
        /*throw new Error();
        if(xmlNode.previousSibling) //should use traverse here
            this.$fixItem(xmlNode.previousSibling, jpf.xmldb.findHTMLNode(xmlNode.previousSibling, this));*/
    };
    
    this.$moveNode = function(xmlNode, htmlNode){
        if (!self.jpf.debug && !htmlNode) 
            return;
            
        if (this.hasLoadStatus(xmlNode.parentNode, "potential")) {
            var container  = this.$getLayoutNode("item", "container", htmlNode);
            htmlNode.parentNode.removeChild(htmlNode);
            container.parentNode.removeChild(container);
            this.$extend(xmlNode.parentNode);
            return;
        }
        
        var oPHtmlNode = htmlNode.parentNode;
        var pHtmlNode  = jpf.xmldb.findHTMLNode(xmlNode.parentNode, this);
        //if(!pHtmlNode) return;
        
        var nSibling = this.getNextTraverse(xmlNode);
        var beforeNode = nSibling 
            ? jpf.xmldb.findHTMLNode(nSibling, this) 
            : null;
        var pContainer = pHtmlNode 
            ? this.$getLayoutNode("item", "container", pHtmlNode) 
            : this.oInt;
        var container  = this.$getLayoutNode("item", "container", htmlNode);

        if (pContainer != oPHtmlNode && this.getTraverseNodes(xmlNode.parentNode).length == 1)
            this.$removeClearMessage(pContainer);

        pContainer.insertBefore(htmlNode, beforeNode);
        pContainer.insertBefore(container, beforeNode);
        
        /*if (!this.startcollapsed) {
            pContainer.style.display = "block";
            pContainer.style.height = "auto";
        }*/
        
        if (this.emptyMessage && !oPHtmlNode.childNodes.length)
            this.$setClearMessage(oPHtmlNode);
        
        if (this.openadd && pHtmlNode != this.oInt && pContainer.style.display != "block") 
            this.slideOpen(pContainer, pHtmlNode, true);
        
        //Fix look (tree thing)
        this.$fixItem(xmlNode, htmlNode);
        
        var tParent = this.getTraverseParent(xmlNode);
        this.$fixItem(tParent, jpf.xmldb.findHTMLNode(tParent, this));
        if (this.getNextTraverse(xmlNode, true)) { //should use traverse here
            this.$fixItem(this.getNextTraverse(xmlNode, true),
                jpf.xmldb.findHTMLNode(this.getNextTraverse(xmlNode, true),
                this));
        }
    };
    
    this.$updateNode = function(xmlNode, htmlNode){
        var elIcon = this.$getLayoutNode("item", "icon", htmlNode);
        var iconURL = this.applyRuleSetOnNode("icon", xmlNode);
        if (elIcon && iconURL) {
            if (elIcon.tagName && elIcon.tagName.match(/^img$/i))
                elIcon.src = this.iconPath + iconURL;
            else
                elIcon.style.backgroundImage = "url(" + this.iconPath + iconURL + ")";
        }

        var elCaption = this.$getLayoutNode("item", "caption", htmlNode);
        if (elCaption) {
            /*if (elCaption.nodeType == 1)
                elCaption.innerHTML = this.applyRuleSetOnNode("caption", xmlNode);
            else
                elCaption.nodeValue = this.applyRuleSetOnNode("caption", xmlNode);*/
            
            if (elCaption.nodeType != 1)
                elCaption = elCaption.parentNode;

            elCaption.innerHTML = this.applyRuleSetOnNode("caption", xmlNode);
        }
        
        var strTooltip = this.applyRuleSetOnNode("tooltip", xmlNode);
        if (strTooltip) 
            htmlNode.setAttribute("title", strTooltip);

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.applyRuleSetOnNode("css", xmlNode);
        if (cssClass || this.dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass))
                this.dynCssClasses.push(cssClass);
        }
        // #endif
    };
    
    this.$setLoading = function(xmlNode, container){
        this.setLoadStatus(xmlNode, "potential");
        
        if (!this.getTraverseNodes(xmlNode).length) {
            this.$getNewContext("loading");
            jpf.xmldb.htmlImport(this.$getLayoutNode("loading"), container);
        }
    };
    
    this.$removeLoading = function(htmlNode){
        if (!htmlNode) return;
        this.$getLayoutNode("item", "container", htmlNode).innerHTML = "";
    };
    
    //check databinding for how this is normally implemented
    this.$extend = function(xmlNode, container){
        var rule       = this.getNodeFromRule("insert", xmlNode, null, true);
        var xmlContext = rule 
            ? xmlNode.selectSingleNode(rule.getAttribute("select") || ".") 
            : null;

        if (rule && xmlContext) {
            this.setLoadStatus(xmlNode, "loading");
            
            if (rule.getAttribute("get")) {
                // #ifdef __WITH_OFFLINE_TRANSACTIONS
                if (!jpf.offline.onLine) {
                    jpf.offline.transactions.actionNotAllowed();
                    this.slideClose(container, xmlNode);
                    return;
                }
                //#endif
                
                this.getModel().insertFrom(rule.getAttribute("get"), xmlContext, {
                    insertPoint : xmlContext, 
                    jmlNode     : this
                });
            }
            else {
                var data = this.applyRuleSetOnNode("insert", xmlNode);
                if (data)
                    this.insert(data, xmlContext);
            }
        }
        else if (!this.prerender) {
            this.setLoadStatus(xmlNode, "loading");
            this.$removeLoading(jpf.xmldb.findHTMLNode(xmlNode, this));
            var result = this.$addNodes(xmlNode, container, true); //checkChildren ???
            xmlUpdateHandler.call(this, {
                action  : "insert", 
                xmlNode : xmlNode, 
                result  : result,
                anim    : true
            });
        }
    };
    
    function xmlUpdateHandler(e){
        /*
            Display the animation if the item added is 
            * Not in the cache
            - Being insterted using xmlUpdate
            - there is at least 1 child inserted
        */
        
        if (e.action == "move-away")
            this.$fixItem(e.xmlNode, jpf.xmldb.findHTMLNode(e.xmlNode, this), true);

        if (e.action != "insert") return;
        
        var htmlNode = this.getNodeFromCache(e.xmlNode.getAttribute(
            jpf.xmldb.xmlIdTag) + "|" + this.uniqueId);
        if (!htmlNode) return;
        
        if (this.hasLoadStatus(e.xmlNode, "loading") && e.result.length > 0) {
            var container = this.$getLayoutNode("item", "container", htmlNode);
            this.slideOpen(container, e.xmlNode, e.anim ? false : true);
        }
        else
            this.$fixItem(e.xmlNode, htmlNode);
        
        //Can this be removed?? (because it was added in the insert function)
        if (this.hasLoadStatus(e.xmlNode, "loading"))
            this.setLoadStatus(e.xmlNode, "loaded");
    }
    
    this.addEventListener("xmlupdate", xmlUpdateHandler);
    
    /**** Keyboard Support ****/
    
    // #ifdef __WITH_RENAME
    this.addEventListener("beforerename", function(){
        if (this.$tempsel) {
            clearTimeout(this.timer);
            this.select(this.$tempsel);
            this.$tempsel = null;
            this.timer   = null;
        }
    });
    // #endif
    
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
    
    /**** Rename Support ****/
    
    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function(){
        var x = this.$getLayoutNode("item", "caption", this.$selected);
        return x.nodeType == 1 ? x : x.parentNode;
    };
    // #endif
    
    /**** Selection Support ****/
    
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
    
    this.$findContainer = function(htmlNode){
        return this.$getLayoutNode("item", "container", htmlNode);
    };
    
    this.$selectDefault = function(xmlNode){
        if (this.select(this.getFirstTraverseNode(xmlNode)))
            return true;
        else {
            var nodes = this.getTraverseNodes(xmlNode);
            for (var i = 0; i < nodes.length; i++) {
                if (this.$selectDefault(nodes[i]))
                    return true;
            }
        }
    };
    
    /**** Init ****/
    
    /**
     * @event click Fires when the user presses a mousebutton while over this element and then let's the mousebutton go. 
     * @see baseclass.multiselect.event.beforeselect
     * @see baseclass.multiselect.event.afterselect
     * @see baseclass.multiselect.event.beforechoose
     * @see baseclass.multiselect.event.afterchoose
     */
    this.$draw = function(){
        if (!this.$jml.getAttribute("skin")) {
            var mode = this.$jml.getAttribute("mode");
            if (mode == "check")
                this.$loadSkin("default:checktree"); //@todo use getOption here
            else if (mode == "radio")
                this.$loadSkin("default:radiotree"); //@todo use getOption here
        }
        
        //Build Main Skin
        this.oExt = this.$getExternal(); 
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
        this.opencloseaction = this.$getOption("main", "openclose");
        
        //Need fix...
        //this.oExt.style.MozUserSelect = "none";

        if (jpf.hasCssUpdateScrollbarBug && !this.mode)
            this.$fixScrollBug();
        
        this.oExt.onclick = function(e){
            _self.dispatchEvent("click", {htmlEvent : e || event});
        };
    };
    
    this.$loadJml = function(x){
        if (this.nocollapse)
            this.startcollapsed = false;
        else if (this.startcollapsed === 1)
            this.startcollapsed = !jpf.isFalse(this.$getOption("main", "startcollapsed"));
        
        if (this.$jml.childNodes.length) 
            this.$loadInlineData(this.$jml);
    };
    
    this.$destroy = function(){
        this.oExt.onclick = null;
        
        jpf.removeNode(this.oDrag);
        this.oDrag = null;
    };
}).implement(
    //#ifdef __WITH_VALIDATION || __WITH_XFORMS
    jpf.Validation, 
    //#endif
    //#ifdef __WITH_XFORMS
    jpf.XForms,
    //#endif
    //#ifdef __WITH_RENAME
    jpf.Rename,
    //#endif
    //#ifdef __WITH_DRAGDROP
    jpf.DragDrop, 
    //#endif
    
    jpf.MultiSelect, 
    jpf.Cache,
    jpf.Presentation, 
    jpf.DataBinding
);

// #endif
