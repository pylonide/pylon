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

// #ifdef __AMLBASETREE || __INC_ALL

/**
 * Baseclass of elements that allows the user to select one or more items
 * from a tree based element.
 *
 * @class apf.BaseTree
 * @baseclass
 *
 * @inherits apf.MultiSelect
 * @inheritsElsewhere apf.XForms
 * @inherits apf.Cache
 * @inherits apf.DataAction
 * @inherits apf.Rename
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 * @default_private
 *
 */
apf.BaseTree = function(){
    this.$init(true);

    // #ifdef __WITH_CSS_BINDS
    this.$dynCssClasses = [];
    // #endif

    this.$nodes = [];
};

(function() {
    //#ifdef __WITH_RENAME || __WITH_DATAACTION || __WITH_CACHE
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
        apf.Cache,
        //#endif
        apf.K
    );
    //#endif

    // *** Properties and Attributes *** //

    //Options
    this.$isTreeArch   = true; // This element has a tree architecture.
    this.$focussable   = true; // This object can get the focus.
    this.multiselect   = false; // Initially multiselect is disabled.
    this.bufferselect  = true;

    this.startcollapsed  = true;
    this.$animType       = apf.tween.NORMAL;
    this.$animOpenStep   = 3;
    this.$animCloseStep  = 1;
    this.$animSpeed      = 10;

    var HAS_CHILD = 1 << 1,
        IS_CLOSED = 1 << 2,
        IS_LAST   = 1 << 3,
        IS_ROOT   = 1 << 4;

    var treeState = this.$treeState = {};
    this.$treeState[0]                               = "";
    this.$treeState[HAS_CHILD]                       = "min";
    this.$treeState[HAS_CHILD | IS_CLOSED]           = "plus";
    this.$treeState[IS_LAST]                         = "last";
    this.$treeState[IS_LAST | HAS_CHILD]             = "minlast";
    this.$treeState[IS_LAST | HAS_CHILD | IS_CLOSED] = "pluslast";
    this.$treeState[IS_ROOT]                         = "root";

    // *** Properties and Attributes *** //

    /**
     * @attribute {Boolean} openadd         Sets or gets whether the tree expands the parent to which a node is added. Defaults to `true`.
     */
    /**
     * @attribute {Boolean} startcollapsed  Sets or gets whether the tree collapses all nodes that contain children on load. Defaults to `true`.
    */
    /**
     *  @attribute {Boolean} nocollapse      Sets or gets whether the user cannot collapse a node. Defaults to `false`.
     */
    /**
     *  @attribute {Boolean} singleopen      Sets or gets whether the tree will expand a node by a single click. Defaults to `false`.
     */
    /**
     *  @attribute {Boolean} prerender       Sets or gets whether the tree will render all the nodes at load. Defaults to `true`.
     */
    /**
     *  @attribute {Boolean} disableremove   Sets or gets whether the tree disallows removing nodes with the keyboard, by pressing [[keys: Del]]. Defaults to `false`.
     */
    this.$booleanProperties["openadd"]         = true;
    this.$booleanProperties["startcollapsed"]  = true;
    this.$booleanProperties["nocollapse"]      = true;
    this.$booleanProperties["singleopen"]      = true;
    this.$booleanProperties["animation"]       = true;
    this.$booleanProperties["prerender"]       = true;
    this.$booleanProperties["removecontainer"] = true;
    this.$booleanProperties["dragroot"]        = true;
    this.$booleanProperties["disableremove"]   = true;

    this.$supportedProperties.push("openadd", "startcollapsed", "nocollapse",
        "singleopen", "prerender", "removecontainer", "animation", "dragroot",
        "disableremove");

    this.openadd        = true;
    this.startcollapsed = 1;
    this.prerender      = true;
    this.disableremove  = false;

    // *** Public Methods *** //

    /**
     * Expands all items in the tree.
     */
    this.expandAll    = function(){
        if (!this.xmlRoot)
            return;

        var xpath = this.each.split('|')
                        .join('[' + this.each.replace(/\|/g, " or ") + ']|.//'),
            _self = this;
        (function(node){
            var nodes = node.selectNodes(xpath);
            //for (var i = nodes.length - 1; i >= 0; i--) {
            for (var o, i = 0; i < nodes.length; i++) {
                if (o = apf.xmldb.getHtmlNode(nodes[i], _self))
                    _self.slideToggle(o, 1, true);
                arguments.callee(nodes[i]);
            }
        })(this.xmlRoot);
    };

    /**
     * Collapses all items in the tree.
     */
    this.collapseAll   = function(){
        if (!this.xmlRoot)
            return;

        var pNodes = this.xmlRoot.selectNodes(".//" + this.each
          .split('|').join('[' + this.each.replace(/\|/g, " or ") + ']|.//'));

        for (var o, i = pNodes.length - 1; i >=0; i--) {
            if (o = apf.xmldb.getHtmlNode(pNodes[i], this))
                this.slideToggle(o, 2, true);
        }
    };

    /**
     * Collapse a single node in the tree.
     * - xmlNode ([[XMLNode]]): The node to collapse
     */
    this.collapse = function(xmlNode) {
        if (!this.xmlRoot)
            return;

        if (this.isCollapsed(xmlNode))
            return;
        var htmlNode = apf.xmldb.getHtmlNode(xmlNode, this);
        if (!htmlNode)
            return;
        this.slideToggle(htmlNode, 2, true);
    };

    /**
     * Selects a node and expands each parent of it.
     * - xmlNode ([[XMLNode]]): The node to expand
     */
    this.expandAndSelect = function(xmlNode) {
        if (!this.xmlRoot)
            return;

        var _self = this;
        if ((function _recur(loopNode){
            var pNode = _self.getTraverseParent(loopNode);
            if (pNode == _self.xmlRoot)
                return true;

            if (!pNode || _recur(pNode) === false)
                return false;

            _self.slideToggle(apf.xmldb.getHtmlNode(pNode, _self), 1, true);
        })(xmlNode) !== false)
            this.select(xmlNode);
    };

    /**
     * Loads a list of folders.
     * paths {[String]} Array of strings in the form of `'folder[1]/folder[2]'` representing a list of folders
     * onFinished {Function} A callback to be called when finished
     */
    this.expandList = function (paths, onFinished) {
        var _self = this;
        var root = this.xmlRoot;

        // recursive load function
        function expand(currentSelector, allSelectors) {
            var selectorNode = root.selectSingleNode(currentSelector);

            // if the node could not be found,
            // just tell the consumer that it has expanded
            if (!selectorNode) {
                return hasExpanded(currentSelector);
            }

            // first expand the item passed in
            _self.slideToggle(apf.xmldb.getHtmlNode(selectorNode, _self), 1, true, null, function () {
                // the number of times the callback has fired, prevent it from executing forever
                var timesRan = 0;

                // the callback fires, but we might be waiting for data from the server
                var callback = function () {
                    // check whether the node is loaded
                    if (!_self.$hasLoadStatus(root.selectSingleNode(currentSelector), "loaded")) {
                        // if not, retry after a second (max 3 times)
                        if (++timesRan < 3) {
                            return setTimeout(function () {
                                _self.slideToggle(apf.xmldb.getHtmlNode(selectorNode, _self), 1, true, null, callback);
                            }, 1000);
                        }
                        else {
                            // still failing? call 'hasExpanded' for this one and all its children
                            // cause we're ignoring everything from now;
                            // and we need the callback to be fired anyway
                            var allAncestors = allSelectors.filter(function (s) {
                                return s.indexOf(currentSelector + "/") === 0;
                            });

                            hasExpanded(currentSelector);
                            allAncestors.forEach(function (sel) {
                                hasExpanded(sel);
                            });

                            return null;
                        }
                    }

                    // notify
                    hasExpanded();

                    // when finished, find all the other selectors that start with the current selector
                    // plus a slash to make it really really sure
                    // plus we check whether it's a child and not a grand child
                    var childSelectors = allSelectors.filter(function (s) {
                        return s.indexOf(currentSelector + "/") === 0
                                && currentSelector.split("/").length + 1 === s.split("/").length;
                    });

                    // then expand each of the child items
                    childSelectors.forEach(function (selector) {
                        expand(selector, allSelectors);
                    });
                };
                callback();
            });
        }

        // function to be called when an item has expanded, used to determine whether we finished
        var expandCount = 0;
        function hasExpanded() {
            // if we have expanded all items, invoke the callback
            if (++expandCount === paths.length) {
                onFinished();
            }
        }

        // find all rootNodes (nodes without a slash in them)
        var rootNodes = paths.filter(function (p) { return p.split("/").length === 1; });

        // expand all root nodes, expand will recursively expand all child items
        rootNodes.forEach(function (node) {
            expand(node, paths);
        });
    };

    /*
     * @notimplemented
     * @todo who's volunteering?
     * @private
     */
    this.selectPath = function(path){};

    // *** Sliding functions *** //

    /*
     * @private
     */
    this.slideToggle = function(htmlNode, force, immediate, userAction, callback){
        callback = typeof callback === "function" ? callback : function () {};

        if (this.nocollapse || userAction && this.disabled)
            return callback();

        if (!htmlNode)
            htmlNode = this.$selected;

        if (!htmlNode)
            return callback();

        var id = htmlNode.getAttribute(apf.xmldb.htmlIdTag);
        while (!id && htmlNode.parentNode)
            id = (htmlNode = htmlNode.parentNode)
                .getAttribute(apf.xmldb.htmlIdTag);

        var container = this.$getLayoutNode("item", "container", htmlNode);
        if (!container) return callback();

        if (apf.getStyle(container, "display") == "block") {
            if (force == 1) {
                if (callback) callback();
                return;
            }
            htmlNode.className = htmlNode.className.replace(/min/, "plus");
            this.slideClose(container, apf.xmldb.getNode(htmlNode), immediate, callback);
        }
        else {
            if (force == 2) {
                if (callback) callback();
                return;
            }
            htmlNode.className = htmlNode.className.replace(/plus/, "min");
            this.slideOpen(container, apf.xmldb.getNode(htmlNode), immediate, callback);
        }
    };

    this.isCollapsed = function(xmlNode){
        return (apf.getStyle(this.$getLayoutNode("item", "container",
            apf.xmldb.getHtmlNode(xmlNode, this)), "display") == "none");
    }

    var lastOpened = {};
    /*
     * @event expand Fires when a tree leaf is expanded from collapsed view to
     *               reveal its children leaves.
     * @private
     */
    this.slideOpen = function(container, xmlNode, immediate, callback){
        if (!xmlNode)
            xmlNode = this.selected;

        var htmlNode = apf.xmldb.getHtmlNode(xmlNode, this);
        if (!container)
            container = this.$findContainer(htmlNode);

        //We don't slide open elements without children.
        if ((!container.childNodes.length || container.firstChild.nodeType == 3
          && container.firstChild.nodeValue.trim() == "")
          && !this.$getBindRule("insert", xmlNode)
          && !this.getTraverseNodes(xmlNode).length)
            return callback && callback();

        if (this.singleopen) {
            var pNode = this.getTraverseParent(xmlNode),
                p     = (pNode || this.xmlRoot).getAttribute(apf.xmldb.xmlIdTag);
            if (lastOpened[p] && lastOpened[p][1] != xmlNode
              && this.getTraverseParent(lastOpened[p][1]) == pNode)
                this.slideToggle(lastOpened[p][0], 2);//lastOpened[p][1]);
            lastOpened[p] = [htmlNode, xmlNode];
        }

        if (!this.nocollapse)
            container.style.display = "block";

        if (!this.prerender && this.$hasLoadStatus(xmlNode, "potential")
          && !container.childNodes.length) {
            this.$extend(xmlNode, container, immediate, callback);
            return;
        }

        if (immediate || container.scrollHeight > 1000) {
            var _scrollTop = container.scrollHeight
                                - container.offsetHeight - diff - (apf.isGecko ? 16 : 0);
            container.scrollTop = _scrollTop == 0 ? 100 : 0;
            if (!this.nocollapse && container != this.$container) {
                container.style.height = "auto";
                container.style.overflow = "visible";
            }

            if (this.$hasLoadStatus(xmlNode, "potential"))
                return this.$extend(xmlNode, container, immediate, callback);

            this.dispatchEvent("expand", {xmlNode: xmlNode});
            return callback && callback();
        }

        var _self = this;
        var prevHeight = container.style.height;
        container.style.overflow = "visible";
        if (!apf.isIE7) {
            container.style.height = apf.hasHeightAutoDrawBug ? "100%" : "auto";
        }
        var height = container.scrollHeight;
        container.style.overflow = "hidden";
        container.style.height = prevHeight;

        function finishSlide() {
            if (xmlNode && _self.$hasLoadStatus(xmlNode, "potential")) {
                $setTimeout(function(){
                    if (container != this.$container) {
                        container.style.height = container.scrollHeight + "px";
                        container.style.overflow = "hidden";
                    }
                    _self.$extend(xmlNode, container, null, callback);
                });
                if (container != this.$container) {
                    if (!apf.isIE7) {
                        container.style.height = apf.hasHeightAutoDrawBug ? "100%" : "auto";
                    }
                    container.style.overflow = "visible";
                }
            }
            else if (container != this.$container) {
                container.style.overflow = "visible";
                if (!apf.isIE7) {
                    container.style.height = apf.hasHeightAutoDrawBug ? "100%" : "auto";
                }
                _self.dispatchEvent("expand", {xmlNode: xmlNode});
            }
        }

        if (!this.animation) {
                var diff = apf.getHeightDiff(container),
                    oInt = container;
    
                // This fixes a bug that was introduced in Chrome 20
                container.style.height = "10px";
                oInt.scrollTop = 0;
                // End fix
                container.style.height = Math.max((height), 0) + "px";
                _scrollTop = oInt.scrollHeight
                    - oInt.offsetHeight - diff - (apf.isGecko ? 16 : 0);
                oInt.scrollTop = _scrollTop == 0 ? 100 : 0;
                finishSlide();
        }
        else {
            apf.tween.single(container, {
                type    : 'scrollheight',
                from    : container.offsetHeight,
                to      : height,
                anim    : this.$animType,
                steps   : this.$animOpenStep,
                interval: this.$animSpeed,
                onfinish: function(container){
                    finishSlide();
                }
            });
        }
    };

    /*
     * @event collapse Fires when a tree leaf is collapsed from expanded view to
     *                 conceal its children leaves.
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
            var htmlNode = apf.xmldb.getHtmlNode(xmlNode, this);
            container = this.$findContainer(htmlNode);
        }

        if (container != this.$container) {
            container.style.height   = container.offsetHeight;
            container.style.overflow = "hidden";
        }

        if (immediate) {
            if (container != this.$container)
                container.style.height = 0;
            container.style.display = "none";
            this.dispatchEvent("collapse", {xmlNode: xmlNode});
            return;
        }

        var _self = this;
        apf.tween.single(container, {
            type    : 'scrollheight',
            from    : container.scrollHeight,
            to      : 0,
            anim    : this.$animType,
            steps   : this.$animCloseStep,
            interval: this.$animSpeed,
            onfinish: function(container, data){
               container.style.display = "none";
               _self.dispatchEvent("collapse", {xmlNode: xmlNode});
            }
        });
    };

    // *** Databinding Support *** //

    this.$isStartCollapsed = function(xmlNode){
        return this.$hasBindRule("collapsed")
            ? (this.$getDataNode("collapsed", xmlNode) ? true : false)
            : (this.$hasBindRule("expanded")
                ? (this.$getDataNode("expanded", xmlNode) ? false : true)
                : this.startcollapsed);
    }

    //@todo apf3.x refactor
    this.$add = function(xmlNode, Lid, xmlParentNode, htmlParentNode, beforeNode, isLast, depth, nextNode, action){
        if (this.$isTreeArch && this.$needsDepth && typeof depth == "undefined") {
            var loopNode = xmlParentNode; depth = 0;
            while(loopNode != this.xmlRoot) {
                depth++;
                loopNode = loopNode.parentNode;
            }
        }

        var loadChildren     = this.$getBindRule("insert", xmlNode) ? true : false,
            traverseNodes    = this.getTraverseNodes(xmlNode),
            hasTraverseNodes = traverseNodes.length ? true : false,
            hasChildren      = loadChildren || hasTraverseNodes,
            startcollapsed   = this.$isStartCollapsed(xmlNode),
            state            = (hasChildren ? HAS_CHILD : 0) | (startcollapsed && hasChildren
                || loadChildren ? IS_CLOSED : 0) | (isLast ? IS_LAST : 0),

            htmlNode         = this.$initNode(xmlNode, state, Lid, depth),
            container        = this.$getLayoutNode("item", "container", htmlNode),
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

        if ((!htmlParentNode || htmlParentNode == this.$container)
          && xmlParentNode == this.xmlRoot && !beforeNode
          || action == "insert") {
            this.$nodes.push(htmlNode);
            if (!apf.isChildOf(htmlNode, container, true) && removeContainer)
                this.$nodes.push(container);

            if (action != "insert") {
                this.$setStyleClass(htmlNode,  "root");
                this.$setStyleClass(container, "root");
            }
        }
        else {
            if (!htmlParentNode) {
                htmlParentNode = apf.xmldb.getHtmlNode(xmlNode.parentNode, this);
                htmlParentNode = htmlParentNode
                    ? this.$getLayoutNode("item", "container", htmlParentNode)
                    : this.$container;
            }

            if (htmlParentNode == this.$container) {
                this.$setStyleClass(htmlNode,  "root");
                this.$setStyleClass(container, "root");
            }

            var next;
            if (action != "load" && action != "extend") {
                if (!beforeNode && (next = this.getNextTraverse(xmlNode)))
                    beforeNode = apf.xmldb.getHtmlNode(next, this);
            }
            if (beforeNode && beforeNode.parentNode != htmlParentNode)
                beforeNode = null;

            if (htmlParentNode.style
              && this.getTraverseNodes(xmlNode.parentNode).length == 1)
                this.$removeEmptyMessage(htmlParentNode);

            //alert("|" + htmlNode.nodeType + "-" + htmlParentNode.nodeType + "-" + beforeNode + ":" + container.nodeType);
            //Insert Node into Tree
            if (htmlParentNode.style) {
                var isChildOfHtmlNode = !apf.isChildOf(htmlNode, container, true)
                htmlNode = apf.insertHtmlNode(htmlNode, htmlParentNode, beforeNode);
                if (isChildOfHtmlNode && removeContainer)
                    var container = apf.insertHtmlNode(container,
                        htmlParentNode, beforeNode);
                else
                    var container = this.$getLayoutNode("item", "container", htmlNode);
            }
            else {
                htmlParentNode.insertBefore(htmlNode, beforeNode);
                if (!apf.isChildOf(htmlNode, container, true) && removeContainer)
                    htmlParentNode.insertBefore(container, beforeNode);
            }

            //Fix parent if child is added to drawn parentNode
            if (htmlParentNode.style) {
                if (this.openadd && htmlParentNode != this.$container
                  && htmlParentNode.style.display != "block") {
                    if (!this.$isStartCollapsed(xmlParentNode))
                        this.slideOpen(htmlParentNode, xmlParentNode, true);
                }

                if (!this.$fillParent)
                    this.$fillParent = xmlParentNode;

                var next = nextNode == undefined ? this.getNextTraverse(xmlNode, true) : nextNode;

                var html;
                if (next && (html = apf.xmldb.getHtmlNode(next, this))) //should use each here
                    this.$fixItem(next, html);
            }
        }

        if ((this.prerender || eachLength < 3 || !startcollapsed) && (xmlNode.namespaceURI != apf.ns.apf || xmlNode.localName != "item")) {
            this.$addNodes(xmlNode, container, false, null, null, (depth || 0) + 1); //checkChildren ???
        }
        /*else {
            this.$setLoadStatus(xmlNode, "potential");
        }*/

        return container;
    };

    this.$fill = function(){
        if (this.$useiframe)
            this.$pHtmlDoc = this.oDoc;

        if (this.$nodes.length) {
            apf.insertHtmlNodes(this.$nodes, this.$fillParentHtml || this.$container);
            this.$nodes.length = 0;
            delete this.$fillParentHtml;
        }

        if (this.$fillParent) {
            this.$fixItem(this.$fillParent, apf.xmldb.getHtmlNode(this.$fillParent, this));
            delete this.$fillParent;
        }
    };

    this.$getParentNode = function(htmlNode){
        return htmlNode
            ? this.$getLayoutNode("item", "container", htmlNode)
            : this.$container;
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

            var isClosed = hasChildren && apf.getStyle(container, "display") == "none"; //htmlNode.className.indexOf("min") == -1;//container.style.display != "block",
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

            if (container) {
                if (!hasChildren)
                    container.style.display = "none";
                else if (!isClosed)
                    container.style.display = "block";
            }
        }
    };

    this.$deInitNode = function(xmlNode, htmlNode){
        //Lookup container
        var containerNode = this.$getLayoutNode("item", "container", htmlNode),
            pContainer    = htmlNode.parentNode;

        //Remove htmlNodes from tree
        if (containerNode)
            containerNode.parentNode.removeChild(containerNode);
        pContainer.removeChild(htmlNode);

        //Datagrid??
        if (this.$withContainer)
            htmlNode.parentNode.removeChild(htmlNode.nextSibling);

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

    this.$moveNode = function(xmlNode, htmlNode, oldXmlParent){
        if (!apf.debug && !htmlNode)
            return;

        var container;
        if (this.$hasLoadStatus(xmlNode.parentNode, "potential")) {
            container = this.$getLayoutNode("item", "container", htmlNode);
            htmlNode.parentNode.removeChild(htmlNode);
            container.parentNode.removeChild(container);
            this.$extend(xmlNode.parentNode);
            return;
        }

        var nSibling = this.getNextTraverse(xmlNode),
            beforeNode = nSibling
                ? apf.xmldb.getHtmlNode(nSibling, this)
                : null;

        var next = htmlNode.nextSibling;
        if (next && next.tagName != htmlNode.tagName)
            next = next.nextSibling;
        if (next && beforeNode == next)
            return;

        var oPHtmlNode = htmlNode.parentNode,
            tParent    = this.getTraverseParent(xmlNode),
            pHtmlNode  = apf.xmldb.getHtmlNode(tParent, this),
        //if(!pHtmlNode) return;

            pContainer = pHtmlNode
                ? this.$getLayoutNode("item", "container", pHtmlNode)
                : this.$container;

        container = this.$getLayoutNode("item", "container", htmlNode);

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
        if (!this.getTraverseNodes(oldXmlParent).length && (msg = this.$applyBindRule("empty", oldXmlParent)))
            this.$setEmptyMessage(oPHtmlNode, msg);

//        if (this.openadd && pHtmlNode != this.$container && pContainer.style.display != "block")
//            this.slideOpen(pContainer, pHtmlNode, true);

        //Fix look (tree thing)
        this.$fixItem(xmlNode, htmlNode);

        this.$fixItem(tParent, apf.xmldb.getHtmlNode(tParent, this));
        this.$updateNode(oldXmlParent, apf.xmldb.getHtmlNode(oldXmlParent, this));
        var next;
        if (next = this.getNextTraverse(xmlNode, true)) { //should use each here
            this.$fixItem(next, apf.xmldb.getHtmlNode(next, this));
        }
    };

    //???
    this.$setLoading = function(xmlNode, container){
        this.$setLoadStatus(xmlNode, "potential");

        var len = this.getTraverseNodes(xmlNode).length;
        if (!len || len > 20) {
            this.$getNewContext("loading");
            apf.insertHtmlNode(this.$getLayoutNode("loading"), container);
        }
    };

    //???
    this.$removeLoading = function(xmlNode){
        if (!xmlNode) return;

        if (this.$timers)
            clearTimeout(this.$timers[xmlNode.getAttribute(apf.xmldb.xmlIdTag)]);

        var htmlNode = apf.xmldb.getHtmlNode(xmlNode, this);
        if (htmlNode) {
            this.$getLayoutNode("item", "container", htmlNode).innerHTML = "";
            this.$setStyleClass(htmlNode, "", ["loading"]);
        }
    };

    //check databinding for how this is normally implemented
    this.$extend = function(xmlNode, container, immediate, callback){
        if (!this.$hasLoadStatus(xmlNode, "potential"))
            return;

        var rule       = this.$getBindRule("insert", xmlNode),
            _self      = this,
            xmlContext = rule && rule.match
                ? (rule.cmatch || rule.compile("match"))(xmlNode)
                : xmlNode;

        if (rule && xmlContext) {
            this.$setLoadStatus(xmlNode, "loading");

            var _self = this;
            (this.$timers || (this.$timers = {}))[xmlNode.getAttribute(apf.xmldb.xmlIdTag)] = $setTimeout(function(){;
                _self.$setStyleClass(apf.xmldb.getHtmlNode(xmlNode, _self), "loading");
            }, 100);

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
                    amlNode     : this,
                    callback    : function(data, state, extra){
                        if (state != apf.SUCCESS) {
                            _self.$setLoadStatus(xmlNode, "potential");
                            _self.$removeLoading(xmlNode);
                            _self.slideToggle(apf.xmldb.getHtmlNode(xmlNode, _self), 2, true);
                        }
                        else {
                            _self.slideOpen(null, xmlNode);
                        }

                        if (callback)
                            callback(data, state, extra);
                    }
                });
            }
            else {
                if (this.$applyBindRule("insert", xmlNode))
                    this.insert(data, {insertPoint: xmlContext});
            }
        }
        else if (!this.prerender) {
            this.$setLoadStatus(xmlNode, "loaded");
            this.$removeLoading(xmlNode);
            xmlUpdateHandler.call(this, {
                action  : "insert",
                xmlNode : xmlNode,
                result  : this.$addNodes(xmlNode, container, true, null, null, null, "extend"), //checkChildren ???
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

        //this.$hasLoadStatus(e.xmlNode, "loading")
        if (e.action == "insert" && e.result.length > 0) {
            if (this.$hasLoadStatus(e.xmlNode, "loaded", true)) {
                var container = this.$getLayoutNode("item", "container", htmlNode);
                this.slideOpen(container, e.xmlNode);//, e.$anim ? false : true
            }
            else if (this.$hasLoadStatus(e.xmlNode, "potential", true)) {
                this.$setLoadStatus(e.xmlNode, "loaded");
            }
        }
        else
            this.$fixItem(e.xmlNode, htmlNode);

        //Can this be removed?? (because it was added in the insert function)
        //if (this.$hasLoadStatus(e.xmlNode, "loading"))
            //this.$setLoadStatus(e.xmlNode, "loaded");
    }

    this.addEventListener("xmlupdate", xmlUpdateHandler);

    // *** Keyboard Support *** //

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

    this.scrollIntoView = function(sNode, onTop) {
        var selHtml = apf.xmldb.getHtmlNode(sNode, this), top;
        if (!selHtml)
            return;

        top     = apf.getAbsolutePosition(selHtml, this.$container)[1];

        if (onTop) {
            if (top <= this.$container.scrollTop)
                this.$container.scrollTop = top;
        }
        else {
            if (top > this.$container.scrollTop + this.$container.offsetHeight)
                this.$container.scrollTop = top - this.$container.offsetHeight + selHtml.offsetHeight;
        }
    }

    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        var key      = e.keyCode,
            ctrlKey  = e.ctrlKey,
            shiftKey = e.shiftKey,
            selHtml  = this.$caret || this.$selected,
            pos, top, el, node, nodes, sNode, pNode, container;

        if (e.returnValue == -1 || !selHtml || this.renaming) //@todo how about allowdeselect?
            return;

        var selXml = this.caret || this.selected,
            oExt   = this.$container;

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

                // #ifdef __WITH_MULTICHECK
                if (this.$mode && !ctrlKey) {
                    var sel = this.getSelection();
                    if (!sel.length || !this.multiselect)
                        this.checkToggle(this.caret, true);
                    else
                        this.checkList(sel, this.isChecked(this.selected), true, false, true);
                }
                else
                //#endif
                if (ctrlKey || !this.isSelected(this.caret))
                    this.select(this.caret, true);
                return false;
            case 46:
                if (this.disableremove)
                    return;

                if (this.$tempsel)
                    this.$selectTemp();

                //DELETE
                //this.remove();
                this.remove(); //this.mode != "check"
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
                else if ((pNode = this.getTraverseParent(this.caret))
                  && pNode != this.xmlRoot)
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
                if (sNode && sNode != node) {
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

                selHtml = apf.xmldb.getHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$container)[1]
                     //- (selHtml.offsetHeight);
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

                selHtml = apf.xmldb.getHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$container)[1]
                    + (selHtml.offsetHeight);
                if (top > oExt.scrollTop + oExt.offsetHeight)
                    oExt.scrollTop = top - oExt.offsetHeight;
                return false;
            case 33: //@todo
                //PGUP
                pos   = apf.getAbsolutePosition(this.$container);
                el    = document.elementFromPoint(pos[0] + this.$container.offsetWidth
                      - 2, pos[1] + 2);
                sNode = apf.xmldb.findXmlNode(el);
                if (sNode == this.selected) {
                    oExt.scrollTop -= oExt.offsetHeight - apf.getHeightDiff(oExt);
                    el    = document.elementFromPoint(pos[0] + this.$container.offsetWidth
                          - 2, pos[1] + 2);
                    sNode = apf.xmldb.findXmlNode(el);
                }
                this.select(sNode);

                selHtml = apf.xmldb.getHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$container)[1]
                     - (selHtml.offsetHeight);
                if (top <= oExt.scrollTop)
                    oExt.scrollTop = top;
                break;
            case 34: //@todo
                //PGDN
                pos   = apf.getAbsolutePosition(this.$container);
                el    = document.elementFromPoint(pos[0] + this.$container.offsetWidth
                      - 2, pos[1] + this.$ext.offsetHeight - 4);
                sNode = apf.xmldb.findXmlNode(el);
                if (sNode == this.selected) {
                    oExt.scrollTop += oExt.offsetHeight - apf.getHeightDiff(oExt);
                    el    = document.elementFromPoint(pos[0] + this.$container.offsetWidth
                          - 2, pos[1] + this.$ext.offsetHeight - 4);
                    sNode = apf.xmldb.findXmlNode(el);
                }
                this.select(sNode);

                selHtml = apf.xmldb.getHtmlNode(sNode, this);
                top     = apf.getAbsolutePosition(selHtml, this.$container)[1]
                    + (selHtml.offsetHeight);
                if (top > oExt.scrollTop + oExt.offsetHeight)
                    oExt.scrollTop = top - oExt.offsetHeight;
                break;
            default:
                if (this.celledit) {
                    if (!ctrlKey && !e.altKey && (key > 46 && key < 112 || key > 123))
                        this.startRename(null, true);
                    return;
                }
                else if (key == 65 && ctrlKey) {
                    this.selectAll();
                    return false;
                }
                //@todo make this work with the sorted column
                else if (this.caption || (this.bindingRules || {})["caption"]) {
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
                        v = this.$applyBindRule("caption", nodes[i]);
                        if (v && v.substr(0, this.lookup.str.length)
                          .toUpperCase() == this.lookup.str) {

                            if (!this.isSelected(nodes[i]))
                                this.select(nodes[i]);

                            if (selHtml)
                                this.$container.scrollTop = selHtml.offsetTop
                                    - (this.$container.offsetHeight
                                    - selHtml.offsetHeight) / 2;
                            return;
                        }
                    }
                    return;
                }
                break;
        }
    }, true);
    // #endif

    // *** Rename Support *** //

    // #ifdef __WITH_RENAME
    this.$getCaptionElement = function(){
        if (!this.$selected) return false;
        var x = this.$getLayoutNode("item", "caption", this.$selected);
        return x.nodeType == 1 ? x : x.parentNode;
    };
    // #endif

    // *** Selection Support *** //
    /*
        nodes = this.hasFeature(apf.__VIRTUALVIEWPORT__)
                ? this.xmlRoot.selectNodes(this.$isTreeArch
                    ? this.each
                    : ".//" + this.each.split('|').join('|.//'))
                :
    */
    this.$calcSelectRange = function(xmlStartNode, xmlEndNode){
        var r     = [],
            f     = false,
            i     = 0,
            pNodeStart = this.getTraverseParent(xmlStartNode),
            pNodeEnd   = this.getTraverseParent(xmlEndNode),
            nodes      = this.getTraverseNodes(pNodeStart);

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
        var firstNode = this.getFirstTraverseNode(xmlNode);
        if (!firstNode)
            return;

        if (this.select(firstNode, null, null, null, true)) {
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
        empty.setAttribute("empty", "true");
        var caption = this.$getLayoutNode("empty", "caption", empty);

        if (caption)
            apf.setNodeValue(caption, msg || "");

        if (htmlNode.style)
            this.slideOpen(htmlNode, null, true);
        else if (this.nocollapse)
            htmlNode.setAttribute("style", "display:inline-block;");
        else
            htmlNode.setAttribute("style", "overflow:visible;height:auto;display:block;");

    }

    this.$removeEmptyMessage = function(htmlNode){
        var cNode = htmlNode.firstElementChild || htmlNode.firstChild;
        if (!cNode)
            return;

        do {
            if (cNode.getAttribute && cNode.getAttribute("empty")) { //@todo hack
                htmlNode.removeChild(cNode);
                return;
            }
            cNode = cNode.nextSibling;
        }
        while(cNode);
    }

    // *** Init *** //

    /**
     * @event click Fires when the user presses a mousebutton while over this
     *              element, and then lets the mousebutton go
     *
     */
    this.$drawBase = function(){
        //@todo apf3.0 checkmode, radiomode
        /*if (!this.getAttribute("skin")) {
            var mode = this.getAttribute("mode");
            this.skinName = null;
            this.skin = mode + "tree";
            this.$loadSkin();
        }*/

        //Build Main Skin
        this.$ext = this.$getExternal();
        this.$container = this.$getLayoutNode("main", "container", this.$ext);
        this.opencloseaction = this.$getOption("main", "openclose");

        //Need fix...
        //this.$ext.style.MozUserSelect = "none";

        if (apf.hasCssUpdateScrollbarBug && !this.mode)
            this.$fixScrollBug();

        var _self = this;
        this.$ext.onclick = function(e){
            _self.dispatchEvent("click", {htmlEvent : e || event});
        };
        this.$ext.onmousedown = function(e){
            _self.dispatchEvent("mousedown", {htmlEvent : e || event});
        };
        this.$ext.onmouseover = function(e){
            _self.dispatchEvent("mouseover", {htmlEvent : e || event});
        };
        this.$ext.onmouseout = function(e){
            _self.dispatchEvent("mouseout", {htmlEvent : e || event});
        };
        this.$ext.onmousemove = function(e){
            _self.dispatchEvent("mousemove", {htmlEvent : e || event});
        };
    };

    this.addEventListener("DOMNodeInsertedIntoDocument", function(){
        if (this.nocollapse)
            this.startcollapsed = false;
        else if (this.startcollapsed === 1)
            this.startcollapsed = !apf.isFalse(this.$getOption("main", "startcollapsed"));
    });

    this.addEventListener("DOMNodeRemovedFromDocument", function(){
        this.$ext.onclick = null;

        apf.destroyHtmlNode(this.oDrag);
        this.oDrag = null;
    });
// #ifdef __WITH_MULTISELECT
}).call(apf.BaseTree.prototype = new apf.MultiSelect());
/* #elseif __WITH_DATABINDING
}).call(apf.BaseTree.prototype = new apf.MultiselectBinding());
#else
}).call(apf.BaseTree.prototype = new apf.Presentation());
#endif*/

// #endif
