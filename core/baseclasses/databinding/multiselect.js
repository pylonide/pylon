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

//#ifdef __WITH_MULTISELECT && __WITH_DATABINDING
/**
 * All elements inheriting from this {@link term.baseclass baseclass} can bind to data 
 * which contains multiple nodes.
 *
 * @allowchild  item, choices
 * @define  choices     Container for item nodes which receive presentation. 
 * This element is part of the XForms specification. It is not necesary for 
 * the Ajax.org Markup Language.
 * Example:
 * <code>
 *  <a:list>
 *      <a:choices>
 *          <a:item>red</a:item>
 *          <a:item>blue</a:item>
 *          <a:item>green</a:item>
 *      </a:choices>
 *  </a:list>
 * </code>
 * @allowchild  item
 *
 * @constructor
 * @baseclass
 * @default_private
 */
apf.MultiselectBinding = function(){
    if (!this.setQueryValue)
        this.implement(apf.DataBinding);

    this.$regbase    = this.$regbase|apf.__MULTISELECT__; //We're pretending to have multiselect even though we might not.

    this.$init(function(){
        this.$selectTimer = {};
    });
};

(function(){
    this.length = 0;
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        caption   : 2,
        icon      : 2,
        eachvalue : 2,
        select    : 2,
        css       : 2,
        sort      : 2,
        drag      : 2,
        drop      : 2,
        dragcopy  : 2,
        selected  : 3,
        //caret     : 2,
        each      : 1,
        "selection"             : 3, //only databound when has an xpath
        "selection-unique"      : 3, //only databound when has an xpath
        "selection-constructor" : 3 //only databound when has an xpath
    }, this.$attrExcludePropBind);

     //#ifdef __WITH_SORTING
    /**
     * Change the sorting order of this element
     *
     * @param {Object}  options  the new sort options. These are applied incrementally.
     *                           Any property not set is maintained unless the clear
     *                           parameter is set to true.
     *   Properties:
     *   {String}   order        see {@link baseclass.multiselectbinding.binding.each.attribute.order}
     *   {String}   [xpath]      see {@link baseclass.multiselectbinding.binding.each.attribute.sort}
     *   {String}   [type]       see {@link baseclass.multiselectbinding.binding.each.attribute.data-type}
     *   {String}   [method]     see {@link baseclass.multiselectbinding.binding.each.attribute.sort-method}
     *   {Function} [getNodes]   Function that retrieves a list of nodes.
     *   {String}   [dateFormat] see {@link baseclass.multiselectbinding.binding.each.attribute.date-format}
     *   {Function} [getValue]   Function that determines the string content based
     *                           on an xml node as it's first argument.
     * @param {Boolean} clear    removes the current sort options.
     * @param {Boolean} noReload whether to reload the data of this component.
     * @see   baseclass.multiselectbinding.binding.each
     */
    this.resort = function(options, clear, noReload){
        if (!this.$sort)
            this.$sort = new apf.Sort();
 
        this.$sort.set(options, clear);
        
        if (this.clearAllCache)
            this.clearAllCache();

        if (noReload)
            return;

        //#ifdef __WITH_VIRTUALVIEWPORT
        /*if(this.hasFeature(apf.__VIRTUALVIEWPORT__)){
            this.$clearVirtualDataset(this.xmlRoot);
            this.reload();

            return;
        }*/
        //#endif

        var _self = this;
        (function sortNodes(xmlNode, htmlParent) {
            if(!xmlNode)
                return;
            var sNodes = _self.$sort.apply(
                apf.getArrayFromNodelist(xmlNode.selectNodes(_self.each)));

            for (var i = 0; i < sNodes.length; i++) {
                if (_self.$isTreeArch || _self.$withContainer){
                    var htmlNode = apf.xmldb.findHtmlNode(sNodes[i], _self);

                    //#ifdef __DEBUG
                    if (!_self.$findContainer){
                        throw new Error(apf.formatErrorString(_self,
                            "Sorting Nodes",
                            "This component does not \
                             implement _self.$findContainer"));
                    }
                    //#endif

                    var container = _self.$findContainer(htmlNode);

                    htmlParent.appendChild(htmlNode);
                    if (!apf.isChildOf(htmlNode, container, true))
                        htmlParent.appendChild(container);

                    sortNodes(sNodes[i], container);
                }
                else
                    htmlParent.appendChild(apf.xmldb.findHtmlNode(sNodes[i], _self));
            }
        })(this.xmlRoot, this.$container);

        return options;
    };

    /**
     * Change sorting from ascending to descending and vice versa.
     */
    this.toggleSortOrder = function(){
        return this.resort({"ascending" : !this.$sort.get().ascending}).ascending;
    };

    /**
     * Retrieves the current sort options
     *
     * @returns {Object}  the current sort options.
     *   Properties:
     *   {String}   order      see {@link baseclass.multiselectbinding.binding.each.attribute.order}
     *   {String}   xpath      see {@link baseclass.multiselectbinding.binding.each.attribute.sort}
     *   {String}   type       see {@link baseclass.multiselectbinding.binding.each.attribute.data-type}
     *   {String}   method     see {@link baseclass.multiselectbinding.binding.each.attribute.sort-method}
     *   {Function} getNodes   Function that retrieves a list of nodes.
     *   {String}   dateFormat see {@link baseclass.multiselectbinding.binding.each.attribute.date-format}
     *   {Function} getValue   Function that determines the string content based on
     *                         an xml node as it's first argument.
     * @see    baseclass.multiselectbinding.binding.each
     */
    this.getSortSettings = function(){
        return this.$sort.get();
    };
    //#endif

    /**
     * Optimizes load time when the xml format is very simple.
     */
    this.$propHandlers["simpledata"] = function(value){
        if (value) {
            this.getTraverseNodes = function(xmlNode){
                return (xmlNode || this.xmlRoot).childNodes;
            };
        
            this.getFirstTraverseNode = function(xmlNode){
                return (xmlNode || this.xmlRoot).childNodes[0];
            };
        
            this.getLastTraverseNode = function(xmlNode){
                var nodes = (xmlNode || this.xmlRoot).childNodes;
                return nodes[nodes.length - 1];
            };
        
            this.getTraverseParent = function(xmlNode){
                if (!xmlNode.parentNode || xmlNode == this.xmlRoot) 
                    return false;
                    
                return xmlNode.parentNode;
            };
        }
        else {
            delete this.getTraverseNodes;
            delete this.getFirstTraverseNode;
            delete this.getLastTraverseNode;
            delete this.getTraverseParent;
        }
    }

    /**
     * Retrieves a nodelist containing the {@link term.datanode data nodes} which
     * are rendered by this element (see each nodes, see
     * {@link baseclass.multiselectbinding.binding.each}).
     *
     * @param {XMLElement} [xmlNode] the parent element on which the each query is applied.
     */
    this.getTraverseNodes = function(xmlNode){
        //#ifdef __DEBUG
        if (!this.each) {
            throw new Error("Could not render bound data. Missing 'each' rule for " 
                + this.localName + (this.id && "[" + this.id + "]" || "")); //@todo apf3.0 make into proper apf error
        }
        //#endif
        
        //#ifdef __WITH_SORTING
        if (this.$sort) {
            var nodes = apf.getArrayFromNodelist((xmlNode || this.xmlRoot).selectNodes(this.each));
            return this.$sort.apply(nodes);
        }
        //#endif

        return (xmlNode || this.xmlRoot).selectNodes(this.each);
    };

    /**
     * Retrieves the first {@link term.datanode data node} which gets representation
     * in this element
     * (see each nodes, see {@link baseclass.multiselectbinding.binding.each}).
     *
     * @param {XMLElement} [xmlNode] the parent element on which the each query is executed.
     * @return {XMLElement}
     */
    this.getFirstTraverseNode = function(xmlNode){
        //#ifdef __WITH_SORTING
        if (this.$sort) {
            var nodes = (xmlNode || this.xmlRoot).selectNodes(this.each);
            return this.$sort.apply(nodes)[0];
        }
        //#endif

        return (xmlNode || this.xmlRoot).selectSingleNode(this.each);
    };

    /**
     * Retrieves the last {@link term.datanode data node} which gets representation
     * in this element
     * (see each nodes, see {@link baseclass.multiselectbinding.binding.each}).
     *
     * @param {XMLElement} [xmlNode] the parent element on which the each query is executed.
     * @return {XMLElement} the last {@link term.datanode data node}
     * @see    baseclass.multiselectbinding.binding.each
     */
    this.getLastTraverseNode = function(xmlNode){
        var nodes = this.getTraverseNodes(xmlNode || this.xmlRoot);
        return nodes[nodes.length-1];
    };

    /**
     * Determines whether an {@link term.datanode data node} is a each node (see
     * {@link baseclass.multiselectbinding.binding.each})
     *
     * @param {XMLElement} [xmlNode] the parent element on which the each query is executed.
     * @return  {Boolean}  whether the xml element is a each node.
     * @see  baseclass.multiselectbinding.binding.each
     */
    this.isTraverseNode = function(xmlNode){
        /*
            Added optimization, only when an object has a tree architecture is it
            important to go up to the each parent of the xmlNode, else the node
            should always be based on the xmlroot of this component
        */
        //this.$isTreeArch
        var nodes = this.getTraverseNodes(
          this.getTraverseParent(xmlNode) || this.xmlRoot);
        for (var i = 0; i < nodes.length; i++)
            if (nodes[i] == xmlNode)
                return true;
        return false;
    };

    /**
     * Retrieves the next each node (see {@link baseclass.multiselectbinding.binding.each})
     * to be selected
     * from a given each node. The method can do this in either direction and
     * also return the Nth node for this algorithm.
     *
     * @param {XMLElement}  xmlNode  the starting point for determining the next selection.
     * @param {Boolean}     [up]     the direction of the selection. Default is false.
     * @param {Integer}     [count]  the distance in number of nodes. Default is 1.
     * @return  {XMLElement} the {@link term.datanode data node} to be selected next.
     * @see  baseclass.multiselectbinding.binding.each
     */
    this.getNextTraverseSelected = function(xmlNode, up, count){
        if (!xmlNode)
            xmlNode = this.selected;
        if (!count)
            count = 1;

        var i = 0;
        var nodes = this.getTraverseNodes(this.getTraverseParent(xmlNode) || this.xmlRoot);
        while (nodes[i] && nodes[i] != xmlNode)
            i++;

        var node = (up == null)
            ? nodes[i + count] || nodes[i - count]
            : (up ? nodes[i + count] : nodes[i - count]);

        //arguments[2]
        return node || count && (i < count || (i + 1) > Math.floor(nodes.length / count) * count)
            ? node
            : (up ? nodes[nodes.length-1] : nodes[0]);
    };

    /**
     * Retrieves the next each node (see {@link baseclass.multiselectbinding.binding.each}).
     * The method can do this in either direction and also return the Nth next node.
     *
     * @param {XMLElement}  xmlNode     the starting point for determining the next node.
     * @param {Boolean}     [up]        the direction. Default is false.
     * @param {Integer}     [count]     the distance in number of nodes. Default is 1.
     * @return  {XMLElement} the next each node
     * @see  baseclass.multiselectbinding.binding.each
     */
    this.getNextTraverse = function(xmlNode, up, count){
        if (!count)
            count = 1;
        if (!xmlNode)
            xmlNode = this.selected;

        var i = 0;
        var nodes = this.getTraverseNodes(this.getTraverseParent(xmlNode) || this.xmlRoot);
        while (nodes[i] && nodes[i] != xmlNode)
            i++;
        
        var ind = i + (up ? -1 * count : count);
        return nodes[ind < 0 ? 0 : ind];
    };

    /**
     * Retrieves the parent each node (see {@link baseclass.multiselectbinding.binding.each}).
     * In some cases the each rules has a complex form like 'children/item'. In
     * those cases the generated tree has a different structure from that of the xml
     * data. For these situations the xmlNode.parentNode property won't return
     * the each parent, this method will give you the right parent.
     *
     * @param {XMLElement} xmlNode the node for which the parent element will be determined.
     * @return  {XMLElement} the parent node or null if none was found.
     * @see  baseclass.multiselectbinding.binding.each
     */
    this.getTraverseParent = function(xmlNode){
        if (!xmlNode.parentNode || xmlNode == this.xmlRoot) 
            return false;

        //@todo this can be removed when we have a new xpath implementation
        if (xmlNode.$regbase)
            return xmlNode.parentNode;

        var x, id = xmlNode.getAttribute(apf.xmldb.xmlIdTag);
        if (!id) {
            //return false;
            xmlNode.setAttribute(apf.xmldb.xmlIdTag, "temp");
            id = "temp";
        }

        /*
        do {
            xmlNode = xmlNode.parentNode;
            if (xmlNode == this.xmlRoot)
                return false;
            if (this.isTraverseNode(xmlNode))
                return xmlNode;
        } while (xmlNode.parentNode);
        */

        //This is not 100% correct, but good enough for now

        x = xmlNode.selectSingleNode("ancestor::node()[(("
            + this.each + ")/@" + apf.xmldb.xmlIdTag + ")='"
            + id + "']");

        if (id == "temp")
            xmlNode.removeAttribute(apf.xmldb.xmlIdTag);
        return x;
    };
    
    /**
     * Finds HTML presentation node in cache by ID
     *
     * @param  {String} id  the id of the HTMLElement which is looked up.
     * @return {HTMLElement} the HTMLElement found. When no element is found, null is returned.
     */
    if (!this.$findHtmlNode) { //overwritten by apf.Cache
        this.$findHtmlNode = function(id){
            return this.$pHtmlDoc.getElementById(id);
        };
    }
    
    this.$setClearMessage = function(msg, className, lastHeight){
        if (this.more && this.$addMoreItem) this.$addMoreItem();
        if (!this.$empty) {
            if (!this.$hasLayoutNode("empty"))
                return;
            
            this.$getNewContext("empty");

            var xmlEmpty = this.$getLayoutNode("empty");
            if (!xmlEmpty) return;

            this.$empty = apf.insertHtmlNode(xmlEmpty, this.$container);
        }
        else {
            this.$container.appendChild(this.$empty);
        }

        var empty = this.$getLayoutNode("empty", "caption", this.$empty);

        if (empty)
            apf.setNodeValue(empty, msg || "");

        this.$empty.setAttribute("id", "empty" + this.$uniqueId);
        apf.setStyleClass(this.$empty, className, ["loading", "empty", "offline"]);
        
        //@todo apf3.0 cleanup?
        var extH = apf.getStyle(this.$ext, "height");
        this.$empty.style.height = (lastHeight && (!extH || extH == "auto") && className != "empty")
            ? (Math.max(10, (lastHeight
               - apf.getHeightDiff(this.$empty)
               - apf.getHeightDiff(this.$ext))) + "px")
            : "";
    };

    this.$updateClearMessage = function(msg, className) {
        if (!this.$empty || this.$empty.parentNode != this.$container
          || this.$empty.className.indexOf(className) == -1)
            return;

        var empty = this.$getLayoutNode("empty", "caption", this.$empty);
        if (empty)
            apf.setNodeValue(empty, msg || "");
    }

    this.$removeClearMessage = function(){
        if (!this.$empty)
            this.$empty = document.getElementById("empty" + this.$uniqueId);
        if (this.$empty && this.$empty.parentNode)
            this.$empty.parentNode.removeChild(this.$empty);
    };
    
    /**
     * Set listeners, calls HTML creation methods and
     * initializes select and focus states of object.
     */
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(XMLRoot, this);

        var length = this.getTraverseNodes(XMLRoot).length;
        if (!this.renderRoot && !length)
            return this.clear(null, null, true); //@todo apf3.0 this should clear and set a listener

        //Traverse through XMLTree
        var nodes = this.$addNodes(XMLRoot, null, null, this.renderRoot, null, "load");

        //Build HTML
        this.$fill(nodes);

        //Select First Child
        if (this.selectable) {
            //#ifdef __WITH_OFFLINE_STATE
            //@todo move this to multiselect event handler inside multiselect.js
            var sel, bHasOffline = (typeof apf.offline != "undefined");
            if (!this.firstLoad && bHasOffline && apf.offline.state.enabled
              && apf.offline.state.realtime) {
                sel = apf.offline.state.get(this, "selection");
                this.firstLoad = true;
            }

            if (sel) {
                var selstate = apf.offline.state.get(this, "selstate");

                if (sel.length == 0) {
                    this.clearSelection();
                }
                else {
                    for (var i = 0; i < sel.length; i++) {
                        sel[i] = apf.xpathToXml(sel[i],
                            this.xmlRoot);
                    }

                    if (selstate[1]) {
                        var selected = apf.remote
                            .xpathToXml(selstate[1], this.xmlRoot);
                    }

                    this.selectList(sel, null, selected);
                }

                if (selstate[0]) {
                    this.setCaret(apf.remote
                        .xpathToXml(selstate[0], this.xmlRoot));
                }
            }
            else
            //#endif
            //@todo apf3.0 optimize to not set selection when .selection or .selected is set on initial load
            if (this.autoselect) {
                if (!this.selected) {
                    if (this.renderRoot)
                        this.select(XMLRoot, null, null, null, true);
                    else if (nodes.length)
                        this.$selectDefault(XMLRoot);
                    //else @todo apf3.0 this one doesnt seem needed
                        //this.clearSelection();
                }
            }
            else {
                this.clearSelection(true);
                var xmlNode = this.renderRoot
                    ? this.xmlRoot
                    : this.getFirstTraverseNode(); //should this be moved to the clearSelection function?
                if (xmlNode)
                    this.setCaret(xmlNode);
                //#ifdef __WITH_PROPERTY_BINDING
                if (this.selected)
                    this.setProperty("selected", null);
                if (this.choosen)
                    this.setProperty("choosen", null);
                //#endif
            }
        }

        if (this.focussable)
            apf.document.activeElement == this ? this.$focus() : this.$blur();

        //#ifdef __WITH_PROPERTY_BINDING
        if (length != this.length)
            this.setProperty("length", length);
        //#endif
    };

    var actionFeature = {
        "insert"      : 127,//11111110
        "replacenode" : 127,//11110110
        "attribute"   : 255,//11110111
        "add"         : 251,//11110111
        "remove"      : 46, //01011100
        "redo-remove" : 79, //10011110
        "synchronize" : 127,//11111110
        "move-away"   : 233,//11010011
        "move"        : 77  //10011011
    };

    /**
     * Loops through parents of changed node to find the first
     * connected node. Based on the action it will change, remove
     * or update the representation of the data.
     *
     * @event xmlupdate Fires when xml of this element is updated.
     *   object:
     *   {String}     action   the action that was executed on the xml.
     *      Possible values:
     *      text        a text node is set.
     *      attribute   an attribute is set.
     *      update      an xml node is updated.
     *      insert      xml nodes are inserted.
     *      add         an xml node is added.
     *      remove      an xml node is removed (parent still set).
     *      redo-remove an xml node is removed (parent not set).
     *      synchronize unknown update.
     *      move-away   an xml node is moved (parent not set).
     *      move        an xml node is moved (parent still set).
     *   {XMLElement} xmlNode  the node that is subject to the update.
     *   {Mixed}      result   the result.
     *   {UndoObj}    UndoObj  the undo information.
     */
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj, lastParent){
        if (!this.xmlRoot)
            return; //@todo think about purging cache when xmlroot is removed

        var result, length, pNode, htmlNode,
            startNode = xmlNode;
        if (!listenNode)
            listenNode = this.xmlRoot;

        if (action == "redo-remove") {
            lastParent.appendChild(xmlNode); //ahum, i'm not proud of this one
            var eachNode = this.isTraverseNode(xmlNode);
            lastParent.removeChild(xmlNode);
            
            if (!eachNode)
                xmlNode = lastParent;
        }

        //Get First ParentNode connected
        do {
            if (action == "add" && this.isTraverseNode(xmlNode)
              && startNode == xmlNode)
                break; //@todo Might want to comment this out for adding nodes under a eachd node

            if (xmlNode.getAttribute(apf.xmldb.xmlIdTag)) {
                htmlNode = this.$findHtmlNode(
                    xmlNode.getAttribute(apf.xmldb.xmlIdTag)
                    + "|" + this.$uniqueId);

                if (xmlNode == listenNode && !this.renderRoot) {
                    if (xmlNode == this.xmlRoot && action != "insert" && action != "replacenode") {
                        //@todo apf3.0 - fix this for binding on properties
                        this.dispatchEvent("xmlupdate", {
                            action : action,
                            xmlNode: xmlNode,
                            UndoObj: UndoObj
                        });
                        return;
                    }
                    break;
                }

                if (htmlNode && actionFeature[action] & 2
                  && !this.isTraverseNode(xmlNode))
                    action = "remove"; //@todo why not break here?

                else if (!htmlNode && actionFeature[action] & 4
                  && this.isTraverseNode(xmlNode)){
                    action = "add";
                    break;
                }
                
                else if (htmlNode
                  && (startNode != xmlNode || xmlNode == this.xmlRoot)) {
                    if (actionFeature[action] & 1)
                        action = "update";
                    else if (action == "remove")
                        return;
                }

                if (htmlNode  || action == "move")
                    break;
            }
            else if (actionFeature[action] & 8 && this.isTraverseNode(xmlNode)){
                action = "add";
                break;
            }

            if (xmlNode == listenNode) {
                if (actionFeature[action] & 128) //The change is not for us.
                    return;
                
                break;
            }
            xmlNode = xmlNode.parentNode;
        }
        while (xmlNode && xmlNode.nodeType != 9);

        //#ifdef __WITH_LANG_SUPPORT
        apf.$lm_has_lang = false;
        //#endif

        // #ifdef __WITH_VIRTUALVIEWPORT
        /**
         * @todo Think about not having this code here
         */
        if (this.hasFeature(apf.__VIRTUALVIEWPORT__)) {
            if(!this.$isInViewport(xmlNode)) //xmlNode is a eachd node
                return;
        }
        // #endif

        //if(xmlNode == listenNode && !action.match(/add|synchronize|insert/))
        //    return; //deleting nodes in parentData of object

        var foundNode = xmlNode;
        if (xmlNode && xmlNode.nodeType == 9)
            xmlNode = startNode;

        if (action == "replacenode") {
            //var tmpNode;
            //Case for replacing the xmlroot or its direct parent
            if (UndoObj ? UndoObj.args[1] == this.xmlRoot : !this.xmlRoot.parentNode)
                return this.load(UndoObj ? UndoObj.xmlNode : listenNode, {force: true});
            
            //Case for replacing a node between the xmlroot and the traverse nodes
            var nodes = this.getTraverseNodes();
            for (var i = 0, l = nodes.length; i < l; i++) {
                if (apf.isChildOf(startNode, nodes[i]))
                    return this.load(this.xmlRoot, {force: true}); //This can be more optimized by using addNodes
            }
            //if ((tmpNode = this.getFirstTraverseNode()) && apf.isChildOf(startNode, tmpNode))
        }

        //Action Tracker Support - && xmlNode correct here??? - UndoObj.xmlNode works but fishy....
        if (UndoObj && xmlNode && !UndoObj.xmlNode)
            UndoObj.xmlNode = xmlNode;

        //Check Move -- if value node isn't the node that was moved then only perform a normal update
        if (action == "move" && foundNode == startNode) {
            //if(!htmlNode) alert(xmlNode.getAttribute("id")+"|"+this.$uniqueId);
            var isInThis  = apf.isChildOf(this.xmlRoot, xmlNode.parentNode, true); //@todo this.getTraverseParent(xmlNode)
            var wasInThis = apf.isChildOf(this.xmlRoot, UndoObj.extra.parent, true);

            //Move if both previous and current position is within this object
            if (isInThis && wasInThis)
                this.$moveNode(xmlNode, htmlNode, UndoObj.extra.oldParent);
            else if (isInThis) //Add if only current position is within this object
                action = "add";
            else if (wasInThis) //Remove if only previous position is within this object
                action = "remove";
        }
        else if (action == "move-away") {
            var goesToThis = apf.isChildOf(this.xmlRoot, UndoObj.extra.parent, true);
            if (!goesToThis)
                action = "remove";
        }

        //Remove loading message
        if (this.$removeClearMessage && this.$setClearMessage) {
            if (this.getFirstTraverseNode())
                this.$removeClearMessage();
            else
                this.$setClearMessage(this["empty-message"], "empty")
        }

        //Check Insert
        if (action == "insert" && (this.$isTreeArch || xmlNode == this.xmlRoot)) {
            if (!xmlNode)
                return;
            
            if (this.$hasLoadStatus(xmlNode) && this.$removeLoading)
                this.$removeLoading(xmlNode);

            if (this.$container.firstChild && !apf.xmldb.getNode(this.$container.firstChild)) {
                //Appearantly the content was cleared
                this.$container.innerHTML = "";

                if (!this.renderRoot) {
                    length = this.getTraverseNodes().length;
                    if (!length)
                        this.clear();
                }
            }

            result = this.$addNodes(xmlNode, null, true, false, null, null, "insert");//this.$isTreeArch??
            
            this.$fillParentHtml = (this.$getParentNode
                ? this.$getParentNode(htmlNode)
                : htmlNode);
            this.$fillParent = xmlNode;
            this.$fill(result);

            // #ifdef __DEBUG
            if (this.selectable && !this.xmlRoot.selectSingleNode(this.each))
                apf.console.warn("No traversable nodes were found for "
                                 + this.name + " [" + this.localName + "]\n\
                                  Traverse Rule : " + this.$getBindRule("each")[4].getAttribute("match"));
            // #endif

            if (this.selectable && (length === 0 || !this.xmlRoot.selectSingleNode(this.each)))
                return;
        }
        else if (action == "add") {// || !htmlNode (Check Add)
            var parentHTMLNode;
            pNode = this.getTraverseParent(xmlNode);

            if (pNode == this.xmlRoot)
                parentHTMLNode = this.$container;
            
            if (!parentHTMLNode && this.$isTreeArch) {
                parentHTMLNode = this.$findHtmlNode(
                    pNode.getAttribute(apf.xmldb.xmlIdTag) + "|" + this.$uniqueId); 
            }
            
            //This should be moved into a function (used in setCache as well)
            //#ifdef __WITH_CACHE
            if (!parentHTMLNode && this.getCacheItem)
                parentHTMLNode = this.getCacheItem(pNode.getAttribute(apf.xmldb.xmlIdTag)
                    || (pNode.getAttribute(apf.xmldb.xmlDocTag)
                         ? "doc" + pNode.getAttribute(apf.xmldb.xmlDocTag)
                         : false));
            //#endif

            //Only update if node is in current representation or in cache
            if (parentHTMLNode || this.$isTreeArch 
              && pNode == this.xmlRoot) { //apf.isChildOf(this.xmlRoot, xmlNode)
                parentHTMLNode = (this.$findContainer && parentHTMLNode
                    ? this.$findContainer(parentHTMLNode)
                    : parentHTMLNode) || this.$container;

                result = this.$addNodes(xmlNode, parentHTMLNode, true, true,
                    apf.xmldb.getHtmlNode(this.getNextTraverse(xmlNode), this));

                if (parentHTMLNode)
                    this.$fill(result);
            }
        }
        else if (action == "remove") { //Check Remove
            //&& (!xmlNode || foundNode == xmlNode && xmlNode.parentNode
            //if (!xmlNode || startNode != xmlNode) //@todo unsure if I can remove above commented out statement
                //return;
            //I've commented above code out, because it disabled removing a 
            //subnode of a node that through an each rule makes the traverse 
            //node no longer a traverse node.

            //Remove HTML Node
            if (htmlNode)
                this.$deInitNode(xmlNode, htmlNode);
            else if (startNode == this.xmlRoot) {
                return this.load(null, {
                    noClearMsg: !this.dataParent || !this.dataParent.autoselect
                });
            }
        }
        else if (htmlNode) {
            //#ifdef __WITH_SORTING
            if (this.$sort)
                this.$moveNode(xmlNode, htmlNode);
            //#endif
            
            this.$updateNode(xmlNode, htmlNode);

            //Transaction 'niceties'
            if (action == "replacenode" && this.hasFeature(apf.__MULTISELECT__)
              && this.selected && xmlNode.getAttribute(apf.xmldb.xmlIdTag)
              == this.selected.getAttribute(apf.xmldb.xmlIdTag)) {
                this.selected = xmlNode;
            }

            //if(action == "synchronize" && this.autoselect) this.reselect();
        }
        else if (action == "redo-remove") { //Check Remove of the data (some ancestor) that this component is bound on
            var testNode = this.xmlRoot;
            while (testNode && testNode.nodeType != 9)
                testNode = testNode.parentNode;

            if (!testNode) {
                //Set Component in listening state until data becomes available again.
                var model = this.getModel(true);

                //#ifdef __DEBUG
                if (!model)
                    throw new Error(apf.formatErrorString(0, this,
                        "Setting change notifier on component",
                        "Component without a model is listening for changes",
                        this.$aml));
                //#endif

                return model.$waitForXml(this);
            }
        }
        
        //#ifdef __WITH_LANG_SUPPORT
        //@todo apf3.0
        if (apf.$lm_has_lang)
            apf.language.addBinding(this); //@todo should auto remove
        //#endif

        //For tree based nodes, update all the nodes up
        pNode = xmlNode ? xmlNode.parentNode : lastParent;
        if (this.$isTreeArch && !this.$preventRecursiveUpdate 
          && pNode && pNode.nodeType == 1) {
            do {
                htmlNode = this.$findHtmlNode(pNode.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);

                if (htmlNode)
                    this.$updateNode(pNode, htmlNode);
            }
            while ((pNode = this.getTraverseParent(pNode)) && pNode.nodeType == 1);
        }

        //Make sure the selection doesn't become corrupted
        if (actionFeature[action] & 32 && this.selectable
          && startNode == xmlNode
          && (action != "insert" || xmlNode == this.xmlRoot)) {

            clearTimeout(this.$selectTimer.timer);
            // Determine next selection
            if (action == "remove" && apf.isChildOf(xmlNode, this.selected, true)
              || xmlNode == this.$selectTimer.nextNode)
                this.$selectTimer.nextNode = this.getDefaultNext(xmlNode, this.$isTreeArch);

            //@todo Fix this by putting it after xmlUpdate when its using a timer
            var _self = this;
            this.$selectTimer.timer = $setTimeout(function(){
                _self.$checkSelection(_self.$selectTimer.nextNode);
                _self.$selectTimer.nextNode = null;
            });
        }

        //#ifdef __WITH_PROPERTY_BINDING
        //Set dynamic properties that relate to the changed content
        if (actionFeature[action] & 64) {
            if (!length)
                length = this.xmlRoot.selectNodes(this.each).length;
            if (length != this.length)
                this.setProperty("length", length);
        }
        //#endif

        //Let's signal components that are waiting for xml to appear (@todo what about clearing the signalXmlUpdate)
        if (this.signalXmlUpdate && actionFeature[action] & 16) {
            var uniqueId;
            for (uniqueId in this.signalXmlUpdate) {
                if (parseInt(uniqueId) != uniqueId) continue; //safari_old stuff

                var o = apf.lookup(uniqueId);
                if (!this.selected) continue;

                xmlNode = this.selected.selectSingleNode(o.dataParent.xpath);
                if (!xmlNode) continue;

                o.load(xmlNode);
            }
        }

        this.dispatchEvent("xmlupdate", {
            action : action,
            xmlNode: startNode,
            traverseNode : xmlNode,
            result : result,
            UndoObj: UndoObj
        });
    };

    /**
     * Loop through NodeList of selected Traverse Nodes
     * and check if it has representation. If it doesn't
     * representation is created via $add().
     */
    this.$addNodes = function(xmlNode, parent, checkChildren, isChild, insertBefore, depth, action){
        // #ifdef __DEBUG
        if (!this.each) {
            throw new Error(apf.formatErrorString(1060, this,
                "adding Nodes for load",
                "No each SmartBinding rule was specified. This rule is \
                 required for a " + this.localName + " component.", this.$aml));
        }
        // #endif

        var htmlNode, lastNode;
        isChild          = (isChild && (this.renderRoot && xmlNode == this.xmlRoot
            || this.isTraverseNode(xmlNode)));
        var nodes        = isChild ? [xmlNode] : this.getTraverseNodes(xmlNode);
        /*var loadChildren = nodes.length && this.$bindings["insert"]
            ? this.$applyBindRule("insert", xmlNode)
            : false; << UNUSED */

        //#ifdef __WITH_CACHE
        var cId, cItem;
        if (this.$isTreeArch && this.caching 
          && (!this.$bindings || !this.$bindings.each || !this.$bindings.each.filter)
          && (cItem = this.cache[(cId = xmlNode.getAttribute(apf.xmldb.xmlIdTag))])) {
            if (this.$subTreeCacheContext || this.$needsDepth) {
                //@todo
                //We destroy the current items, because currently we 
                //don't support multiple treecachecontexts
                //and because datagrid needs to redraw depth
                this.clearCacheItem(cId);
            }
            else {
                this.$subTreeCacheContext = {
                    oHtml      : cItem,
                    container  : parent,
                    parentNode : null,
                    beforeNode : null
                };

                var htmlNode;
                while (cItem.childNodes.length)
                    (parent || this.$container).appendChild(htmlNode = cItem.childNodes[0]);
                
                return nodes;
            }
        }
        //#endif

        if (this.$isTreeArch && depth === null && action == "insert") {
            depth = 0, loopNode = xmlNode;
            while(loopNode && loopNode != this.xmlRoot) {
                depth++;
                loopNode = this.getTraverseParent(loopNode);
            }
        }

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) {
                //#ifdef __WITH_MARKUPEDIT
                if (this.$addNonElement)
                    this.$addNonElement(nodes[i], parent || this.$container, checkChildren, insertBefore, depth);
                //#endif
                continue;
            }

            if (checkChildren) {
                htmlNode = this.$findHtmlNode(nodes[i]
                    .getAttribute(apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);
            }

            if (!htmlNode) {
                //Retrieve DataBind ID
                var Lid = apf.xmldb.nodeConnect(this.documentId, nodes[i], null, this);

                //Add Children
                var beforeNode = isChild
                        ? insertBefore
                        : (lastNode ? lastNode.nextSibling : null),//(parent || this.$container).firstChild);
                    parentNode = this.$add(nodes[i], Lid, isChild ? xmlNode.parentNode : xmlNode,
                        beforeNode ? parent || this.$container : parent, beforeNode,
                        (!beforeNode && i == nodes.length - 1), depth, nodes[i + 1], action);//Should use getTraverParent

                //Exit if component tells us its done with rendering
                if (parentNode === false) {
                    //Tag all needed xmlNodes for future reference
                    // @todo apf3.0 code below looks harmful... hence commented out (Mike)
                    /*for (var j = i; j < nodes.length; j++)
                        apf.xmldb.nodeConnect(this.documentId, nodes[j],
                            null, this);*/
                    break;
                }

                //Parse Children Recursively -> optimize: don't check children that can't exist
                //if(this.$isTreeArch) this.$addNodes(nodes[i], parentNode, checkChildren);
            }

            if (checkChildren)
                lastNode = htmlNode;// ? htmlNode.parentNode.parentNode : null;
        }

        return nodes;
    };

    this.$handleBindingRule = function(value, prop){
        if (!value)
            this[prop] = null;

        //@todo apf3.0 fix parsing
        if (prop == "each") {
            value = value.charAt(0) == "[" && value.charAt(value.length - 1) == "]"
                ? value.replace(/^\[|\]$/g, "")
                : value;
            
            if (value.indexOf("::") > -1) {
                var model = value.split("::"); //@todo could be optimized
                if (!apf.xPathAxis[model[0]]) {
                    this.setProperty("model", model[0]);
                    this.each = model[1];
                }
                else 
                    this.each = value;
            }
            else
                this.each = value;
            
            if (this.each == this.$lastEach)
                return;
            
            this.$lastEach = value;
            
            if (!this.$model && !this.$initingModel) {
                this.$initingModel = true;
                this.$setInheritedAttribute("model");
                
                return; //@experimental
            }
            
            if (this.$checkLoadQueue() !== false) //@experimental
                return;
        }

        //@todo apf3.0 find a better heuristic (portal demo)
        if (this.xmlRoot && !this.$bindRuleTimer && this.$amlLoaded) {
            var _self = this;
            apf.queue.add("reload" + this.$uniqueId, function(){
                //#ifdef __DEBUG
                apf.console.log("Reloading multiselect based on attribute '" 
                                 + prop + "' bind change to value '" 
                                 + value + "'\n\n" + _self.serialize(true));
                //#endif
                _self.reload();
            });
        }
    };
    
    this.$select = function(o){
        //#ifdef __WITH_RENAME
        if (this.renaming)
            this.stopRename(null, true);
        //#endif

        if (!o || !o.style)
            return;
        return this.$setStyleClass(o, "selected");
    };

    this.$deselect = function(o){
        //#ifdef __WITH_RENAME
        if (this.renaming) {
            this.stopRename(null, true);

            if (this.ctrlselect)
                return false;
        }
        //#endif

        if (!o)
            return;
        return this.$setStyleClass(o, "", ["selected", "indicate"]);
    };

    this.$indicate = function(o){
        //#ifdef __WITH_RENAME
        if (this.renaming)
            this.stopRename(null, true);
        //#endif

        if (!o)
            return;
        return this.$setStyleClass(o, "indicate");
    };

    this.$deindicate = function(o){
        //#ifdef __WITH_RENAME
        if (this.renaming)
            this.stopRename(null, true);
        //#endif

        if (!o)
            return;
        return this.$setStyleClass(o, "", ["indicate"]);
    };

    // #ifdef __WITH_INLINE_DATABINDING
    /**
     * @attribute {String} each the xpath statement that determines which
     * {@link term.datanode data nodes} are rendered by this element (also known
     * as {@link term.eachnode each nodes}. See
     * {@link baseclass.multiselectbinding.binding.each} for more information.
     * Example:
     * <code>
     *  <a:label>Country</a:label>
     *  <a:dropdown
     *      model     = "mdlCountries"
     *      each      = "[country]"
     *      eachvalue = "[@value]"
     *      caption   = "[text()]">
     *  </a:dropdown>
     *
     *  <a:model id="mdlCountries">
     *      <countries>
     *          <country value="USA">USA</country>
     *          <country value="GB">Great Brittain</country>
     *          <country value="NL">The Netherlands</country>
     *          ...
     *      </countries>
     *  </a:model>
     * </code>
     * @see  baseclass.multiselectbinding.binding.each
     */
    this.$propHandlers["each"] =

    /**
     * @attribute {String} caption the xpath statement that determines from
     * which xml node the caption is retrieved.
     * Example:
     * <code>
     *  <a:list caption="[text()]" each="[item]" />
     * </code>
     */
    this.$propHandlers["caption"]  =
    
    /**
     * @attribute {String} valuerule the xpath statement that determines from
     * which xml node the value is retrieved.
     * Example:
     * <code>
     *  <a:list value="[@value]" each="[item]" />
     * </code>
     * @see  baseclass.multiselect.binding.value
     */
    this.$propHandlers["eachvalue"]  =

    /**
     * @attribute {String} icon the xpath statement that determines from
     * which xml node the icon url is retrieved.
     * Example:
     * <code>
     *  <a:list icon="[@icon]" each="[item]" />
     * </code>
     */
    this.$propHandlers["icon"]     =

    /**
     * @attribute {String} tooltip the xpath statement that determines from
     * which xml node the tooltip text is retrieved.
     * Example:
     * <code>
     *  <a:list tooltip="[text()]" each="[item]" />
     * </code>
     */
    this.$propHandlers["tooltip"]  = this.$handleBindingRule;

    //#ifdef __WITH_SORTING
    /**
     * @attribute {String} sort the xpath statement that selects the sortable value.
     * Example:
     * <code>
     *  <a:list sort="[@name]" each="[person]" />
     * </code>
     * @see  element.each.attribute.sort
     */
    this.$propHandlers["sort"] = function(value){
        if (value) {
            this.$sort = new apf.Sort()
            this.$sort.set({
                getValue : apf.lm.compile(value)
            });
        }
        else {
            this.$sort = null;
        }
    }
    //#endif

    /**
     * @attribute {String} select the xpath statement that determines whether
     * this node is selectable.
     * Example:
     * <code>
     *  <a:list match="{[@disabled] != 1}" each="[item]" />
     * </code>
     * @see  baseclass.multiselect.binding.select
     */
    //this.$propHandlers["select"]   = 
    //#endif
}).call(apf.MultiselectBinding.prototype = new apf.DataBinding());
// #endif