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

// #ifdef __AMLTREE || __INC_ALL
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
 *  <a:tree id="tree" align="right">
 *      <a:item caption="root" icon="icoUsers.gif">
 *          <a:item icon="icoUsers.gif" caption="test">
 *              <a:item icon="icoUsers.gif" caption="test" />
 *              <a:item icon="icoUsers.gif" caption="test" />
 *              <a:item icon="icoUsers.gif" caption="test" />
 *          </a:item>
 *          <a:item icon="icoUsers.gif" caption="test" />
 *          <a:item icon="icoUsers.gif" caption="test" />
 *          <a:item icon="icoUsers.gif" caption="test" />
 *      </a:item>
 *  </a:tree>
 * </code>
 * Example:
 * <code>
 *  <a:tree model="filesystem.xml">
 *      <a:bindings>
 *          <a:caption match="[@caption|@filename]" />
 *          <a:icon match="[@icon]" />
 *          <a:each match="[drive|file|folder]" />
 *      </a:bindings>
 *  </a:tree>
 * </code>
 *
 * @constructor
 * @define tree
 * @allowchild {smartbinding}
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.XForms
 * @inherits apf.MultiSelect
 * @inherits apf.Cache
 * @inherits apf.DataAction
 * @inherits apf.Rename
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
 *  <a:tree model="filesystem.xml">
 *      <a:bindings>
 *          <a:caption match="[@caption]" />
 *          <a:insert match="[folder]" get="{myWebdav.readdir([@id])}" />
 *          <a:each match="[folder]" />
 *      </a:bindings>
 *  </a:tree>
 * </code>
 * @attribute {String} get the {@link term.datainstruction data instruction} that is used to load the new data.
 * @binding caption  Determines the caption of a tree node.
 * @binding icon     Determines the icon of a tree node.
 * @binding css      Determines a css class for a tree node.
 * Example:
 * In this example a node is bold when the folder contains unread messages:
 * <code>
 *  <a:tree model="messages.xml">
 *      <a:bindings>
 *          <a:caption match="[@caption]" />
 *          <a:css match="[folder/message[@unread]]" value="highlighUnread" />
 *          <a:icon match="[@icon]" />
 *          <a:icon match="[folder]" value="icoDir.png" />
 *          <a:each match="[folder|message]" />
 *      </a:bindings>
 *  </a:tree>
 * </code>
 * @binding tooltip  Determines the tooltip of a tree node.
 * @binding empty    Determines the empty message of a node.
 * Example:
 * This example shows a gouped contact list, that displays a message under 
 * empty groups.
 * <code>
 *  <a:tree>
 *      <a:bindings>
 *          <a:caption select="@caption" />
 *          <a:icon select="self::contact" value="icoContact.png" />
 *          <a:icon select="self::group" value="icoFolder.png" />
 *          <a:empty select="self::group" value="Drag a contact to this group." />
 *          <a:each select="group|contact" />
 *      </a:bindings>
 *  </a:tree>
 * </code>
 */
apf.tree = function(struct, tagName){
    this.$init(tagName || "tree", apf.NODE_VISIBLE, struct);
    
    this.nodes = [];
    
    // #ifdef __WITH_CSS_BINDS
    this.dynCssClasses = [];
    // #endif
};

(function(){
    this.implement(
        //#ifdef __WITH_XFORMS
        //apf.XForms,
        //#endif
        //#ifdef __WITH_RENAME
        apf.Rename,
        //#endif
        //#ifdef __WITH_DATAACTION
        apf.DataAction,
        //#endif
        //#ifdef __WITH_CACHE
        apf.Cache
        //#endif
    );
    
    //Options
    this.$isTreeArch   = true; // This element has a tree architecture.
    this.$focussable   = true; // This object can get the focus.
    this.multiselect   = false; // Initially multiselect is disabled.
    this.bufferselect  = true;
    
    this.startcollapsed  = true;
    this.animType        = apf.tween.NORMAL;
    this.animOpenStep    = 3;
    this.animCloseStep   = 1;
    this.animSpeed       = 10;
    
    var HAS_CHILD = 1 << 1,
        IS_CLOSED = 1 << 2,
        IS_LAST   = 1 << 3,
        IS_ROOT   = 1 << 4,
    
        treeState = {};
    
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
    this.$booleanProperties["removecontainer"] = true;
    
    this.openadd        = true;
    this.startcollapsed = 1;
    this.prerender      = true;
    
    /**
     * @attribute {String} mode Sets the way this element interacts with the user.
     *   Possible values:
     *   check  the user can select a single item from this element. The selected item is indicated.
     *   radio  the user can select multiple items from this element. Each selected item is indicated.
     */
    this.$mode = 0;
    this.$propHandlers["mode"] = function(value){
        if ("check|radio".indexOf(value) > -1) {
            this.implement(apf.MultiCheck);
            
            this.addEventListener("afterrename", $afterRenameMode); //what does this do?
            
            this.multicheck = value == "check"; //radio is single
            this.$mode = this.multicheck ? 1 : 2;
        }
        else {
            //@todo undo actionRules setting
            this.removeEventListener("afterrename", $afterRenameMode);
            //@todo unimplement??
            this.$mode = 0;
        }
    };
    
    //@todo apf3.0 retest this completely
    function $afterRenameMode(){
    }
    
    /**** Public Methods ****/
    
    /**
     * Expands all items in the tree
     */
    this.expandAll    = function(){
        var xpath = this.each.split('|')
                        .join('[' + this.each.replace(/\|/g, " or ") + ']|.//'),
            _self = this;
        (function(node){
            var nodes = node.selectNodes(xpath);
            //for (var i = nodes.length - 1; i >= 0; i--) {
            for (var i = 0; i < nodes.length; i++) {
                _self.slideToggle(apf.xmldb.getHtmlNode(nodes[i], _self), 1, true);
                arguments.callee(nodes[i]);
            }
        })(this.xmlRoot);
    };
    
    /**
     * Collapses all items in the tree
     */
    this.collapseAll   = function(){
        var pNodes = this.xmlRoot.selectNodes(".//" + this.each
          .split('|').join('[' + this.each.replace(/\|/g, " or ") + ']|.//'));
        
        for (var i = pNodes.length - 1; i >=0; i--)
            this.slideToggle(apf.xmldb.getHtmlNode(pNodes[i], this), 2, true);
    };
    
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
    this.slideToggle = function(htmlNode, force, immediate){
        if (this.nocollapse)
            return;
        
        if (!htmlNode)
            htmlNode = this.$selected;
        
        var id = htmlNode.getAttribute(apf.xmldb.htmlIdTag);
        while (!id && htmlNode.parentNode)
            id = (htmlNode = htmlNode.parentNode)
                .getAttribute(apf.xmldb.htmlIdTag);

        var container = this.$getLayoutNode("item", "container", htmlNode);
        if (!container) return;
        
        if (apf.getStyle(container, "display") == "block") {
            if (force == 1) return;
            htmlNode.className = htmlNode.className.replace(/min/, "plus");
            this.slideClose(container, apf.xmldb.getNode(htmlNode), immediate);
        }
        else {
            if (force == 2) return;
            htmlNode.className = htmlNode.className.replace(/plus/, "min");
            this.slideOpen(container, apf.xmldb.getNode(htmlNode), immediate);
        }
    };
    
    this.isCollapsed = function(xmlNode){
        return (apf.getStyle(this.$getLayoutNode("item", "container",
            apf.xmldb.getHtmlNode(xmlNode, this)), "display") == "none");
    }
    
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
        
        //We don't slide open elements without children.
        if (!container.innerHTML && !this.getTraverseNodes(xmlNode).length)
            return; 

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode),
                p     = (pNode || this.xmlRoot).getAttribute(apf.xmldb.xmlIdTag);
            if (lastOpened[p] && lastOpened[p][1] != xmlNode 
              && this.getTraverseParent(lastOpened[p][1]) == pNode)
                this.slideToggle(lastOpened[p][0], 2);//lastOpened[p][1]);
            lastOpened[p] = [htmlNode, xmlNode];
        }
        
        container.style.display = "block";
        
        if (!this.prerender && this.$hasLoadStatus(xmlNode, "potential") 
          && !container.innerHTML) {
            this.$extend(xmlNode, container, immediate);
            return;
        }
        
        if (immediate) {
            container.style.height = "auto";
            return;
        }

        var _self = this;
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
    this.slideClose = function(container, xmlNode, immediate){
        if (this.nocollapse) 
            return;
        
        if (!xmlNode)
            xmlNode = this.selected;
        
        if (this.singleopen) {
            var p = (this.getTraverseParent(xmlNode) || this.xmlRoot)
                .getAttribute(apf.xmldb.xmlIdTag);
            lastOpened[p] = null;
        }
        
        if (!container) {
            var htmlNode = apf.xmldb.findHtmlNode(xmlNode, this);
            container = this.$findContainer(htmlNode);
        }
        
        container.style.height   = container.offsetHeight;
        container.style.overflow = "hidden";
        
        if (immediate) {
            container.style.height = 0;
            container.style.display = "none";
            return;
        }

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
    
    /**** Databinding Support ****/

    //@todo apf3.x refactor
    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode, isLast){
        var loadChildren     = this.$getBindRule("insert", xmlNode) ? true : false,
            traverseNodes    = this.getTraverseNodes(xmlNode),
            hasTraverseNodes = traverseNodes.length ? true : false,
            hasChildren      = loadChildren || hasTraverseNodes,
            startcollapsed   = this.$hasBindRule("collapsed")
                ? (this.$getDataNode("collapsed", xmlNode) ? true : false)
                : this.startcollapsed,
            state            = (hasChildren ? HAS_CHILD : 0) | (startcollapsed && hasChildren
                || loadChildren ? IS_CLOSED : 0) | (isLast ? IS_LAST : 0),

            htmlNode         = this.$initNode(xmlNode, state, Lid),
            container        = this.$getLayoutNode("item", "container"),
            eachLength;
        if (!startcollapsed && !this.nocollapse)
            container.setAttribute("style", "overflow:visible;height:auto;display:block;");
        
        var msg, removeContainer = (!this.removecontainer || hasChildren);
        
        //TEMP on for dynamic subloading
        if (!hasChildren || loadChildren)
            container.setAttribute("style", "display:none;");
        
        //Dynamic SubLoading (Insertion) of SubTree
        if (!this.prerender)
            eachLength = traverseNodes.length;

        if (hasChildren && !this.prerender && eachLength > 2 && startcollapsed
          || loadChildren && (!this.$hasLoadStatus(xmlNode) 
          || this.$hasLoadStatus(xmlNode, "potential")))
            this.$setLoading(xmlNode, container);
        else if (!hasTraverseNodes && (msg = this.$applyBindRule("empty", xmlNode))) {
            this.$setEmptyMessage(container, msg);
        }

        if ((!htmlParentNode || htmlParentNode == this.$int) 
          && xmlParentNode == this.xmlRoot && !beforeNode) {
            this.nodes.push(htmlNode);
            if (!apf.isChildOf(htmlNode, container, true) && removeContainer)
                this.nodes.push(container);
            
            this.$setStyleClass(htmlNode,  "root");
            this.$setStyleClass(container, "root");
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
            }
            
            if (!beforeNode && this.getNextTraverse(xmlNode))
                beforeNode = apf.xmldb.findHtmlNode(this.getNextTraverse(xmlNode), this);
            if (beforeNode && beforeNode.parentNode != htmlParentNode)
                beforeNode = null;
        
            if (htmlParentNode.style 
              && this.getTraverseNodes(xmlNode.parentNode).length == 1) 
                this.$removeEmptyMessage(htmlParentNode);
        
            //alert("|" + htmlNode.nodeType + "-" + htmlParentNode.nodeType + "-" + beforeNode + ":" + container.nodeType);
            //Insert Node into Tree
            if (htmlParentNode.style) {
                apf.insertHtmlNode(htmlNode, htmlParentNode, beforeNode);
                if (!apf.isChildOf(htmlNode, container, true) && removeContainer) 
                    var container = apf.insertHtmlNode(container, 
                        htmlParentNode, beforeNode);
            }
            else {
                htmlParentNode.insertBefore(htmlNode, beforeNode);
                if (!apf.isChildOf(htmlParentNode, container, true) && removeContainer) 
                    htmlParentNode.insertBefore(container, beforeNode);
            }

            //Fix parent if child is added to drawn parentNode
            if (htmlParentNode.style) {
                if (!startcollapsed && this.openadd && htmlParentNode != this.$int 
                  && htmlParentNode.style.display != "block") 
                    this.slideOpen(htmlParentNode, xmlParentNode, true);
                
                //this.$fixItem(xmlNode, htmlNode); this one shouldn't be called, because it should be set right at init
                this.$fixItem(xmlParentNode, apf.xmldb.findHtmlNode(xmlParentNode, this));
                if (this.getNextTraverse(xmlNode, true)) { //should use each here
                    this.$fixItem(this.getNextTraverse(xmlNode, true), 
                        apf.xmldb.findHtmlNode(this.getNextTraverse(xmlNode, true),
                        this));
                }
            }
        }

        if ((this.prerender || eachLength < 3 || !startcollapsed) && (xmlNode.namespaceURI != apf.ns.apf || xmlNode.localName != "item")) {
            this.$addNodes(xmlNode, container, false); //checkChildren ???
        }
        /*else {
            this.$setLoadStatus(xmlNode, "potential");
        }*/

        return container;
    };
    
    this.$fill = function(){
        //if(!this.nodes.length) return;
        //this.$int.innerHTML = "";
        apf.insertHtmlNodes(this.nodes, this.$int);
        this.nodes.length = 0;

        //for(var i=0;i<this.nodes.length;i++)
            //apf.insertHtmlNodes(this.nodes[i], this.$int);
        //this.nodes.length = 0;
    };
    
    this.$getParentNode = function(htmlNode){
        return htmlNode 
            ? this.$getLayoutNode("item", "container", htmlNode) 
            : this.$int;
    };

    this.$fixItem = function(xmlNode, htmlNode, isDeleting, oneLeft, noChildren){
        if (!htmlNode) return;

        if (isDeleting) {
            //if isLast fix previousSibling
            var prevSib;
            if (prevSib = this.getNextTraverse(xmlNode, true))
                this.$fixItem(prevSib, this.$findHtmlNode(prevSib
                    .getAttribute(apf.xmldb.xmlIdTag) + "|" 
                    + this.$uniqueId), null, true);

            //if no sibling fix parent
            if (!this.emptyMessage && xmlNode.parentNode.selectNodes(this.each).length == 1)
                this.$fixItem(xmlNode.parentNode, this.$findHtmlNode(
                    xmlNode.parentNode.getAttribute(apf.xmldb.xmlIdTag) 
                    + "|" + this.$uniqueId), null, false, true); 
        }
        else {
            var container   = this.$getLayoutNode("item", "container", htmlNode),
                hasChildren = false;
            if (noChildren) 
                hasChildren = false;
            else if (this.getTraverseNodes(xmlNode).length > 0)
                hasChildren = true;
            else if (this.$hasLoadStatus(xmlNode, "potential"))
                hasChildren = true;
            else
                hasChildren = false;
            
            var isClosed = hasChildren && container.style.display != "block",
                isLast   = this.getNextTraverse(xmlNode, null, oneLeft ? 2 : 1)
                    ? false
                    : true,
                state = (hasChildren ? HAS_CHILD : 0)
                    | (isClosed ? IS_CLOSED : 0) | (isLast ? IS_LAST : 0);
            this.$setStyleClass(this.$getLayoutNode("item", "class", htmlNode),
                treeState[state], ["min", "plus", "last", "minlast", "pluslast"]);
            this.$setStyleClass(this.$getLayoutNode("item", "container", htmlNode),
                treeState[state], ["min", "plus", "last", "minlast", "pluslast"]);

            if(this.$getLayoutNode("item", "openclose", htmlNode))
                this.$getLayoutNode("item", "openclose", htmlNode)
                    .setAttribute("children", hasChildren);
            
            if (!hasChildren && container)
                container.style.display = "none";
        }
    };

    //@todo please upgrade all the event calls to the 21st century, it hurts my eyes.
    this.$initNode = function(xmlNode, state, Lid){
        //Setup Nodes Interaction
        this.$getNewContext("item");
        
        var hasChildren = state & HAS_CHILD || this.emptyMessage 
            && this.$applyBindRule("empty", xmlNode),
            //should be restructured and combined events set per element
            oItem = this.$getLayoutNode("item");
        //@todo this should use dispatchEvent, and be moved to oExt
        oItem.setAttribute("onmouseover",
            "var o = apf.lookup(" + this.$uniqueId + ");\
            if (o.onmouseover) o.onmouseover(event, this);\
            apf.setStyleClass(this, 'hover');");
        oItem.setAttribute("onmouseout",
            "var o = apf.lookup(" + this.$uniqueId + ");\
            if (o.onmouseout) o.onmouseout(event, this);\
            apf.setStyleClass(this, '', ['hover']);");
        oItem.setAttribute("onmousedown",
            "var o = apf.lookup(" + this.$uniqueId + ");\
            if (o.onmousedown) o.onmousedown(event, this);");
        
        //Set open/close skin class & interaction
        this.$setStyleClass(this.$getLayoutNode("item", "class"), treeState[state]).setAttribute(apf.xmldb.htmlIdTag, Lid);
        this.$setStyleClass(this.$getLayoutNode("item", "container"), treeState[state])
        //this.$setStyleClass(oItem, xmlNode.tagName)
        var elOpenClose = this.$getLayoutNode("item", "openclose");
        if (elOpenClose) { //hasChildren && 
            elOpenClose.setAttribute("children", hasChildren);
            elOpenClose.setAttribute("onmousedown",
                "if (this.getAttribute('children') == false) return;\
                var o = apf.lookup(" + this.$uniqueId + ");\
                o.slideToggle(this);\
                if (o.onmousedown) o.onmousedown(event, this);\
                apf.cancelBubble(event, o);");
            
            elOpenClose.setAttribute("ondblclick", "event.cancelBubble = true");
        }
        
        if (this.$mode) {
            var elCheck = this.$getLayoutNode("item", "check");
            if (elCheck) {
                elCheck.setAttribute("onmousedown",
                    "var o = apf.lookup(" + this.$uniqueId + ");\
                    o.checkToggle(this);\o.$skipSelect = true;");

                if (this.isChecked(xmlNode))
                    this.$setStyleClass(oItem, "checked");
            }
            else {
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, this,
                        "Could not find check attribute",
                        'Maybe the attribute check is missing from your skin file:\
                            <a:item\
                              class        = "."\
                              caption      = "label/u/text()"\
                              icon         = "label"\
                              openclose    = "span"\
                              select       = "label"\
                              check        = "label/b"\
                              container    = "following-sibling::blockquote"\
                            >\
                                <div><span> </span><label><b> </b><u>-</u></label></div>\
                                <blockquote> </blockquote>\
                            </a:item>\
                        '));
                //#endif
                return false;
            }
        }
        
        var ocAction = this.opencloseaction || "ondblclick";
        
        //Icon interaction
        var elIcon = this.$getLayoutNode("item", "icon");
        if (elIcon && elIcon != elOpenClose) {
            if (ocAction != "ondblclick") {
                elIcon.setAttribute(ocAction, 
                  "var o = apf.lookup(" + this.$uniqueId + ");" +
                   (ocAction == "onmousedown" ? "o.select(this, event.ctrlKey, event.shiftKey);" : "") +
                   (true ? "o.slideToggle(this);" : ""));
            }
            if (ocAction != "onmousedown") {
                elIcon.setAttribute("onmousedown", 
                  "apf.lookup(" + this.$uniqueId + ").select(this, event.ctrlKey, event.shiftKey);");
            }
            
            elIcon.setAttribute("ondblclick", 
              "var o = apf.lookup(" + this.$uniqueId + ");\
              o.choose();" + 
              //#ifdef __WITH_RENAME
              "o.stopRename();" + 
              //#endif
              (true && !ocAction == "ondblclick" ? "o.slideToggle(this);" : "") +
              "apf.cancelBubble(event,o);");
        }

        //Select interaction
        var elSelect = this.$getLayoutNode("item", "select"),
            strMouseDown;
        
        //#ifdef __WITH_RENAME || __WITH_DRAGDROP
        if (this.hasFeature(apf.__RENAME__) || this.hasFeature(apf.__DRAGDROP__)) {
            strMouseDown =
                'var o = apf.lookup(' + this.$uniqueId + ');\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 this.hasPassedDown = true;\
                 if (!o.renaming && o.hasFocus() && isSelected == 1) \
                    this.dorename = true;\
                 if (!o.hasFeature(apf.__DRAGDROP__) || !isSelected && !event.ctrlKey)\
                     o.select(this, event.ctrlKey, event.shiftKey);';
            
            elSelect.setAttribute("onmouseout", 'this.hasPassedDown = false;' + (elSelect.getAttribute("onmouseout") || ""));
            elSelect.setAttribute("onmouseup", 'if (!this.hasPassedDown) return;\
                var o = apf.lookup(' + this.$uniqueId + ');'
                // #ifdef __WITH_RENAME
                + 'if (this.dorename && !o.mode)\
                    o.startDelayedRename(event);' +
                // #endif
                'this.dorename = false;\
                 var xmlNode = apf.xmldb.findXmlNode(this);\
                 var isSelected = o.isSelected(xmlNode);\
                 if (o.hasFeature(apf.__DRAGDROP__))\
                     o.select(this, event.ctrlKey, event.shiftKey);');
        }
        else 
        //#endif 
        {
            strMouseDown = "o.select(this, event.ctrlKey, event.shiftKey);";
        }
        
        if (ocAction != "ondblclick") {
            elSelect.setAttribute(ocAction, 
              "var o = apf.lookup(" + this.$uniqueId + ");" +
               (ocAction == "onmousedown" ? strMouseDown : "") +
               (true ? "o.slideToggle(this);" : ""));
        }
        if (ocAction != "onmousedown") {
            elSelect.setAttribute("onmousedown", 
              "var o = apf.lookup(" + this.$uniqueId + ");" + strMouseDown);
        }

        elSelect.setAttribute("ondblclick", 
          "var o = apf.lookup(" + this.$uniqueId + ");\
          o.choose();" + 
          //#ifdef __WITH_RENAME
          "o.stopRename();this.dorename=false;" + 
          //#endif
          (ocAction == "ondblclick" ? "o.slideToggle(this);" : "") +
          "apf.cancelBubble(event,o);");
        
        //Setup Nodes Identity (Look)
        if (elIcon) {
            var iconURL = this.$applyBindRule("icon", xmlNode);
            if (iconURL) {
                if (elIcon.tagName.match(/^img$/i))
                    elIcon.setAttribute("src", this.iconPath + iconURL);
                else
                    elIcon.setAttribute("style", "background-image:url(" + this.iconPath + iconURL + ")");
            }
        }

        var elCaption = this.$getLayoutNode("item", "caption");
        if (elCaption) {
            apf.setNodeValue(elCaption,
                this.$applyBindRule("caption", xmlNode));
        }
        
        var strTooltip = this.$applyBindRule("tooltip", xmlNode)
        if (strTooltip)
            oItem.setAttribute("title", strTooltip);
        
        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
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
        var containerNode = this.$getLayoutNode("item", "container", htmlNode),
            pContainer    = htmlNode.parentNode;
        
        //Remove htmlNodes from tree
        containerNode.parentNode.removeChild(containerNode);
        pContainer.removeChild(htmlNode);
        
        //Fix Images (+, - and lines)
        if (xmlNode.parentNode != this.xmlRoot)
            this.$fixItem(xmlNode, htmlNode, true);
        
        var msg;
        if (!pContainer.childNodes.length && (msg = this.$applyBindRule("empty", xmlNode)))
            this.$setEmptyMessage(pContainer, msg);
        
        //Fix look (tree thing)
        this.$fixItem(xmlNode, htmlNode, true);
        //this.$fixItem(xmlNode.parentNode, apf.xmldb.findHtmlNode(xmlNode.parentNode, this));
        /*throw new Error();
        if(xmlNode.previousSibling) //should use each here
            this.$fixItem(xmlNode.previousSibling, apf.xmldb.findHtmlNode(xmlNode.previousSibling, this));*/
    };
    
    this.$moveNode = function(xmlNode, htmlNode){
        if (!self.apf.debug && !htmlNode) 
            return;
            
        var container;
        if (this.$hasLoadStatus(xmlNode.parentNode, "potential")) {
            container = this.$getLayoutNode("item", "container", htmlNode);
            htmlNode.parentNode.removeChild(htmlNode);
            container.parentNode.removeChild(container);
            this.$extend(xmlNode.parentNode);
            return;
        }
        
        var oPHtmlNode = htmlNode.parentNode,
            pHtmlNode  = apf.xmldb.findHtmlNode(xmlNode.parentNode, this),
        //if(!pHtmlNode) return;
        
            nSibling = this.getNextTraverse(xmlNode),
            beforeNode = nSibling
                ? apf.xmldb.findHtmlNode(nSibling, this)
                : null,
            pContainer = pHtmlNode
                ? this.$getLayoutNode("item", "container", pHtmlNode)
                : this.$int;
        container  = this.$getLayoutNode("item", "container", htmlNode);

        if (pContainer != oPHtmlNode && this.getTraverseNodes(xmlNode.parentNode).length == 1)
            this.$removeEmptyMessage(pContainer);

        pContainer.insertBefore(htmlNode, beforeNode);
        if (container)
            pContainer.insertBefore(container, beforeNode);
        
        /*if (!this.startcollapsed) {
            pContainer.style.display = "block";
            pContainer.style.height = "auto";
        }*/
        
        var msg;
        if (!oPHtmlNode.childNodes.length && (msg = this.$applyBindRule("empty", xmlNode)))
            this.$setEmptyMessage(oPHtmlNode, msg);
        
        if (this.openadd && pHtmlNode != this.$int && pContainer.style.display != "block") 
            this.slideOpen(pContainer, pHtmlNode, true);
        
        //Fix look (tree thing)
        this.$fixItem(xmlNode, htmlNode);
        
        var tParent = this.getTraverseParent(xmlNode);
        this.$fixItem(tParent, apf.xmldb.findHtmlNode(tParent, this));
        if (this.getNextTraverse(xmlNode, true)) { //should use each here
            this.$fixItem(this.getNextTraverse(xmlNode, true),
                apf.xmldb.findHtmlNode(this.getNextTraverse(xmlNode, true),
                this));
        }
    };
    
    this.$updateNode = function(xmlNode, htmlNode){
        var elIcon  = this.$getLayoutNode("item", "icon", htmlNode),
            iconURL = this.$applyBindRule("icon", xmlNode);
        if (elIcon && iconURL) {
            if (elIcon.tagName && elIcon.tagName.match(/^img$/i))
                elIcon.src = this.iconPath + iconURL;
            else
                elIcon.style.backgroundImage = "url(" + this.iconPath + iconURL + ")";
        }

        var elCaption = this.$getLayoutNode("item", "caption", htmlNode);
        if (elCaption) {
            /*if (elCaption.nodeType == 1)
                elCaption.innerHTML = this.$applyBindRule("caption", xmlNode);
            else
                elCaption.nodeValue = this.$applyBindRule("caption", xmlNode);*/
            
            if (elCaption.nodeType != 1)
                elCaption = elCaption.parentNode;

            elCaption.innerHTML = this.$applyBindRule("caption", xmlNode);
        }
        
        var strTooltip = this.$applyBindRule("tooltip", xmlNode);
        if (strTooltip) 
            htmlNode.setAttribute("title", strTooltip);

        // #ifdef __WITH_CSS_BINDS
        var cssClass = this.$applyBindRule("css", xmlNode);
        if (cssClass || this.dynCssClasses.length) {
            this.$setStyleClass(htmlNode, cssClass, this.dynCssClasses);
            if (cssClass && !this.dynCssClasses.contains(cssClass))
                this.dynCssClasses.push(cssClass);
        }
        // #endif
    };
    
    this.$setLoading = function(xmlNode, container){
        this.$setLoadStatus(xmlNode, "potential");
        
        if (!this.getTraverseNodes(xmlNode).length) {
            this.$getNewContext("loading");
            apf.insertHtmlNode(this.$getLayoutNode("loading"), container);
        }
    };
    
    this.$removeLoading = function(htmlNode){
        if (!htmlNode) return;
        this.$getLayoutNode("item", "container", htmlNode).innerHTML = "";
    };
    
    //check databinding for how this is normally implemented
    this.$extend = function(xmlNode, container, immediate){
        var rule       = this.$getBindRule("insert", xmlNode),
            xmlContext = rule && rule.match
                ? (rule.cmatch || rule.compile("match"))(xmlNode)
                : xmlNode;

        if (rule && xmlContext) {
            this.$setLoadStatus(xmlNode, "loading");
            
            if (rule.get) {
                // #ifdef __WITH_OFFLINE_TRANSACTIONS
                if (!apf.offline.onLine) {
                    apf.offline.transactions.actionNotAllowed();
                    this.slideClose(container, xmlNode);
                    return;
                }
                //#endif
                
                this.getModel().$insertFrom(rule.getAttribute("get"), {
                    xmlNode     : xmlContext,
                    insertPoint : xmlContext, 
                    amlNode     : this
                });
            }
            else {
                if (this.$applyBindRule("insert", xmlNode))
                    this.insert(data, {insertPoint: xmlContext});
            }
        }
        else if (!this.prerender) {
            this.$setLoadStatus(xmlNode, "loading");
            this.$removeLoading(apf.xmldb.findHtmlNode(xmlNode, this));
            xmlUpdateHandler.call(this, {
                action  : "insert", 
                xmlNode : xmlNode, 
                result  : this.$addNodes(xmlNode, container, true), //checkChildren ???
                anim    : !immediate
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
            this.$fixItem(e.xmlNode, apf.xmldb.findHtmlNode(e.xmlNode, this), true);

        if (e.action != "insert") return;
        
        var htmlNode = this.$findHtmlNode(e.xmlNode.getAttribute(
            apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);
        if (!htmlNode) return;
        
        if (this.$hasLoadStatus(e.xmlNode, "loading") && e.result.length > 0) {
            var container = this.$getLayoutNode("item", "container", htmlNode);
            this.slideOpen(container, e.xmlNode, e.anim ? false : true);
        }
        else
            this.$fixItem(e.xmlNode, htmlNode);
        
        //Can this be removed?? (because it was added in the insert function)
        if (this.$hasLoadStatus(e.xmlNode, "loading"))
            this.$setLoadStatus(e.xmlNode, "loaded");
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
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            selHtml  = this.$caret || this.$selected,
            pos, top, el, node, nodes, sNode, pNode, container;

        if (!selHtml || this.renaming) 
            return;

        var selXml = this.caret || this.selected,
            oExt   = this.$ext;

        switch (key) {
            case 13:
                if (this.$tempsel)
                    this.$selectTemp();
            
                if (this.ctrlselect == "enter")
                    this.select(this.caret, true);
            
                this.choose(selHtml);
                break;
            case 32:
                if (this.$tempsel)
                    this.$selectTemp();

                if (this.$mode && !ctrlKey) {
                    var sel = this.getSelection();
                    if (!sel.length || !this.multiselect)
                        this.checkToggle(this.caret);
                    else
                        this.checkList(sel, this.isChecked(this.selected), true);
                }
                else if (ctrlKey || !this.isSelected(this.caret))
                    this.select(this.caret, true);
                return false;
            case 46:
                if (this.$tempsel)
                    this.$selectTemp();
            
                //DELETE
                //this.remove();
                this.remove(this.caret); //this.mode != "check"
                break;
            case 36:
                //HOME
                this.$setTempSelected(this.getFirstTraverseNode(), false, shiftKey);
                oExt.scrollTop = 0;
                return false;
            case 35:
                //END
                var lastNode = this.getLastTraverseNode();
                while (!this.isCollapsed(lastNode))
                    lastNode = this.getLastTraverseNode(lastNode);
                
                this.$setTempSelected(lastNode, false, shiftKey, true);
                oExt.scrollTop = oExt.scrollHeight;
                return false;
            case 37:
                //LEFT
                if (this.$tempsel)
                    this.$selectTemp();
                    
                if (this.caret.selectSingleNode(this.each) 
                  && !this.isCollapsed(this.caret))
                    this.slideToggle(this.$caret || this.$selected, 2)
                else if (pNode = this.getTraverseParent(this.caret))
                    this.select(pNode)
                return false;
            case 107: //+
            case 187: //+
            case 39:
                //RIGHT
                if (this.$tempsel)
                    this.$selectTemp();
            
                if (this.$hasLoadStatus(this.caret, "potential") 
                  || this.getFirstTraverseNode(this.caret))
                    this.slideToggle(this.$caret || this.$selected, 1)
                break;
            case 109:
            case 189:
                //-
                if (this.getFirstTraverseNode(this.caret))
                    this.slideToggle(this.$caret || this.$selected, 2)
                break;
            case 38:
                //UP
                if (!selXml && !this.$tempsel) 
                    return;
                
                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel) 
                    : selXml;
                
                sNode = this.getNextTraverse(node, true);
                if (sNode) {
                    nodes = this.getTraverseNodes(sNode);
                    
                    do {
                        container = this.$getLayoutNode("item", "container",
                            this.$findHtmlNode(apf.xmldb.getID(sNode, this)));
                        if (container && apf.getStyle(container, "display") == "block" 
                          && nodes.length) {
                                sNode = nodes[nodes.length-1];
                        }
                        else {
                            break;
                        }
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
                   this.$setTempSelected(sNode, ctrlKey, shiftKey, true);
                else
                    return false;
                
                selHtml = apf.xmldb.findHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$int)[1]
                     - (selHtml.offsetHeight/2);
                if (top <= oExt.scrollTop)
                    oExt.scrollTop = top;
                
                return false;
            case 40:
                //DOWN
                if (!selXml && !this.$tempsel) 
                    return;

                node = this.$tempsel 
                    ? apf.xmldb.getNode(this.$tempsel)
                    : selXml;
                
                sNode = this.getFirstTraverseNode(node);
                if (sNode) {
                    container = this.$getLayoutNode("item", "container",
                        this.$findHtmlNode(apf.xmldb.getID(node, this)));
                    if (container && apf.getStyle(container, "display") != "block")
                        sNode = null;
                }
                
                while (!sNode) {
                    pNode = this.getTraverseParent(node);
                    if (!pNode) break;
                    
                    var i = 0;
                    nodes = this.getTraverseNodes(pNode);
                    while (nodes[i] && nodes[i] != node)
                        i++;
                    sNode = nodes[i+1];
                    node  = pNode;
                }

                if (sNode && sNode.nodeType == 1)
                   this.$setTempSelected(sNode, ctrlKey, shiftKey);
                else
                    return false;
                    
                selHtml = apf.xmldb.findHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$int)[1]
                    + (selHtml.offsetHeight/2);
                if (top > oExt.scrollTop + oExt.offsetHeight)
                    oExt.scrollTop = top - oExt.offsetHeight;
                
                return false;
            case 33: //@todo
                //PGUP
                pos   = apf.getAbsolutePosition(this.$int);
                el    = document.elementFromPoint(pos[0] + this.$int.offsetWidth
                      - 2, pos[1] + 2);
                sNode = apf.xmldb.findXmlNode(el);
                if (sNode == this.selected) {
                    oExt.scrollTop -= oExt.offsetHeight - apf.getHeightDiff(oExt);
                    el    = document.elementFromPoint(pos[0] + this.$int.offsetWidth
                          - 2, pos[1] + 2);
                    sNode = apf.xmldb.findXmlNode(el);
                }
                this.select(sNode);
                
                selHtml = apf.xmldb.findHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$int)[1]
                     - (selHtml.offsetHeight / 2);
                if (top <= oExt.scrollTop)
                    oExt.scrollTop = top;
                break;
            case 34: //@todo
                //PGDN
                pos   = apf.getAbsolutePosition(this.$int);
                el    = document.elementFromPoint(pos[0] + this.$int.offsetWidth
                      - 2, pos[1] + this.$ext.offsetHeight - 4);
                sNode = apf.xmldb.findXmlNode(el);
                if (sNode == this.selected) {
                    oExt.scrollTop += oExt.offsetHeight - apf.getHeightDiff(oExt);
                    el    = document.elementFromPoint(pos[0] + this.$int.offsetWidth
                          - 2, pos[1] + this.$ext.offsetHeight - 4);
                    sNode = apf.xmldb.findXmlNode(el);
                }
                this.select(sNode);
                
                selHtml = apf.xmldb.findHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$int)[1]
                    + (selHtml.offsetHeight/2);
                if (top > oExt.scrollTop + oExt.offsetHeight)
                    oExt.scrollTop = top - oExt.offsetHeight;
                break;
            default:
                if (key == 65 && ctrlKey)
                    this.selectAll();
                break;
        }
    }, true);
    // #endif
    
    /**** Rename Support ****/
    
    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function(){
        if (!this.$selected) return false;
        var x = this.$getLayoutNode("item", "caption", this.$selected);
        return x.nodeType == 1 ? x : x.parentNode;
    };
    // #endif
    
    /**** Selection Support ****/
    
    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r     = [],
            f     = false,
            i     = 0,
            nodes = this.xmlRoot.selectNodes(".//" + this.each
                .split('|').join('|.//'));

        for (; i < nodes.length; i++) {
            if (nodes[i] == xmlStartNode)
                f = true;
            if (f)
                r.push(nodes[i]);
            if (nodes[i] == xmlEndNode)
                f = false;
        }
        
        if (!r.length || f) {
            r = [];
            for (f = false, i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i] == xmlStartNode)
                    f = true;
                if (f)
                    r.push(nodes[i]);
                if (nodes[i] == xmlEndNode)
                    f = false;
            }
        }
        
        return r;
    };
    
    this.$findContainer = function(htmlNode){
        return this.$getLayoutNode("item", "container", htmlNode);
    };
    
    this.$selectDefault = function(xmlNode){
        if (this.select(this.getFirstTraverseNode(xmlNode), null, null, null, true)) {
            return true;
        }
        else {
            var nodes = this.getTraverseNodes(xmlNode);
            for (var i = 0; i < nodes.length; i++) {
                if (this.$selectDefault(nodes[i]))
                    return true;
            }
        }
    };
    
    this.$setEmptyMessage = function(htmlNode, msg){
        this.$getNewContext("empty");
        var xmlEmpty = this.$getLayoutNode("empty");
        if (!xmlEmpty) return;

        var empty = apf.insertHtmlNode(xmlEmpty, htmlNode);
        var caption = this.$getLayoutNode("empty", "caption", empty);

        if (caption)
            apf.setNodeValue(caption, msg || "");
        
        if (htmlNode.style)
            this.slideOpen(htmlNode, null, true);
        else
            htmlNode.setAttribute("style", "overflow:visible;height:auto;display:block;");
    }
    
    this.$removeEmptyMessage = function(htmlNode){
        var cNode = htmlNode.firstChild;
        if (!cNode)
            return;

        do {
            if (cNode.className == "message") { //@todo hack
                htmlNode.removeChild(cNode);
                return;
            }
            cNode = cNode.nextSibling;
        }
        while(cNode);
    }
    
    /**** Init ****/
    
    /**
     * @event click Fires when the user presses a mousebutton while over this
     *              element and then let's the mousebutton go.
     * @see baseclass.multiselect.event.beforeselect
     * @see baseclass.multiselect.event.afterselect
     * @see baseclass.multiselect.event.beforechoose
     * @see baseclass.multiselect.event.afterchoose
     */
    this.$draw = function(){
        //@todo apf3.0 checkmode, radiomode
        /*if (!this.getAttribute("skin")) {
            var mode = this.getAttribute("mode");
            this.skinName = null;
            this.skin = mode + "tree";
            this.$loadSkin();
        }*/
        
        //Build Main Skin
        this.$ext = this.$getExternal(); 
        this.$int = this.$getLayoutNode("main", "container", this.$ext);
        this.opencloseaction = this.$getOption("main", "openclose");
        
        //Need fix...
        //this.$ext.style.MozUserSelect = "none";

        if (apf.hasCssUpdateScrollbarBug && !this.mode)
            this.$fixScrollBug();
        
        var _self = this;
        this.$ext.onclick = function(e){
            _self.dispatchEvent("click", {htmlEvent : e || event});
        };
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(){
        if (this.nocollapse)
            this.startcollapsed = false;
        else if (this.startcollapsed === 1)
            this.startcollapsed = !apf.isFalse(this.$getOption("main", "startcollapsed"));
    });
    
    this.$destroy = function(){
        this.$ext.onclick = null;
        
        apf.destroyHtmlNode(this.oDrag);
        this.oDrag = null;
    };
// #ifdef __WITH_MULTISELECT
}).call(apf.tree.prototype = new apf.MultiSelect());
/* #elseif __WITH_DATABINDING
}).call(apf.tree.prototype = new apf.MultiselectBinding());
   #else
}).call(apf.tree.prototype = new apf.Presentation());
#endif*/

apf.aml.setElement("tree", apf.tree);
// #endif
