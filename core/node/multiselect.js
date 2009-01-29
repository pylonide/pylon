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

var __MULTISELECT__ = 1 << 8;

// #ifdef __WITH_MULTISELECT

/**
 * Baseclass adding selection features to this element. This includes handling
 * for multiselect and several keyboard based selection interaction. It also
 * takes care of caret handling when multiselect is enabled.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.5
 *
 * @inherits jpf.MultiselectBinding
 */
jpf.MultiSelect = function(){
    var noEvent;
    var selSmartbinding;
    var valueList    = [];
    var selectedList = [];
    var _self        = this;

    this.$regbase    = this.$regbase|__MULTISELECT__;

    /**** Properties ****/

    this.selected     = null;
    this.$selected    = null;
    this.indicator    = null;
    this.$indicator   = null;
    this.useindicator = true;

    // #ifdef __WITH_DATABINDING

    /**
     * Removes an xml data element from the data of this element.
     * Example:
     * A simple list showing products. This list is used in all following examples.
     * <code>
     *  <j:list id="myList">
     *      <j:bindings>
     *          <j:caption select="@name" />
     *          <j:value select="@id" />
     *          <j:icon>{@type}.png</j:icon>
     *          <j:traverse select="product" />
     *      </j:bindings>
     *      <j:model>
     *          <products>
     *              <product name="Soundblaster" type="audio"    id="product10" />
     *              <product name="Teapot"       type="3d"       id="product13" />
     *              <product name="Coprocessor"  type="chips"    id="product15" />
     *              <product name="Keyboard"     type="input"    id="product17" />
     *              <product name="Diskdrive"    type="storage"  id="product20" />
     *          </products>
     *      </j:model>
     *  </j:list>
     * </code>
     * Example:
     * This example selects a product by it's value and then removes the
     * selection.
     * <code>
     *  myList.setValue("product20");
     *  myList.remove();
     * </code>
     * Example:
     * This example gets a product by it's value and then removes it.
     * <code>
     *  var xmlNode = myList.findXmlNodeByValue("product20");
     *  myList.remove(xmlNode);
     * </code>
     * Example:
     * This example retrieves all nodes from a list. All items with a length
     * greater than 10 are singled out and removed.
     * <code>
     *  var list = myList.getTraverseNodes(); //get all nodes from a list.
     *  var removeList = [];
     *  for (var i = 0; i < list.length; i++) {
     *      if (list[i].getAttribute("length") > 10)
     *          removeList.push(list[i]);
     *  }
     *  myList.remove(removeList); //remove the list of nodes
     * </code>
     * Remarks:
     * Another way to trigger this method is by using the action attribute on a
     * button.
     * <code>
     *  <j:button action="remove" target="myList">Remove item</j:button>
     * </code>
     * Using the action methodology you can let the original data source
     * (usually the server) know that the user removed an item.
     * <code>
     *  <j:actions>
     *      <j:remove set="url:remove_product.php?id={@id}" />
     *  </j:actions>
     * </code>
     * For undo this action should be extended and the server should maintain a
     * copy of the deleted item.
     * <code>
     *  <j:actions>
     *      <j:remove set="url:remove_product.php?id={@id}">
     *          <j:undo set="url:undo_remove_product.php?id={@id}" />
     *      </j:remove>
     *  </j:actions>
     * </code>
     * @action
     * @param  {mixed} [nodeList]  the data element(s) to be removed. If none are specified, the current selection is removed.
     *   Possible values:
     *   {NodeList}   the xml data elements to be removed.
     *   {XMLElement} the data element to be removed.
     * @return  {Boolean}  specifies if the removal succeeded
     */
    this.remove = function(nodeList){
        //Use the current selection if no xmlNode is defined
        if (!nodeList)
            nodeList = valueList;

        //If we're an xml node let's convert
        if (nodeList.nodeType)
            nodeList = [nodeList];

        //If there is no selection we'll exit, nothing to do
        if (!nodeList || !nodeList.length)
            return;

        //#ifdef __DEBUG
        //We're not removing the XMLRoot, that would be suicide ;)
        if (nodeList.contains(this.xmlRoot)) {
            throw new Error(jpf.formatErrorString(0,
                "Removing nodes",
                "You are trying to delete the xml root of this \
                 component. This is not allowed."));
        }
        //#endif

        var rValue;
        if (nodeList.length > 1 && (!this.actionRules
          || this.actionRules["removegroup"] || !this.actionRules["remove"])) {
            rValue = this.executeAction("removeNodeList", nodeList,
                "removegroup", nodeList[0]);
        }
        else {
            for (var i = 0; i < nodeList.length; i++) {
                rValue = this.executeAction("removeNode",
                    [nodeList[i]], "remove", nodeList[i], i != 0);
            }
        }

        return rValue;
    };

    /**
     * Adds an xml data element to the data of this element.
     * Example:
     * A simple list showing products. This list is used in all following examples.
     * <code>
     *  <j:list id="myList">
     *      <j:bindings>
     *          <j:caption select="@name" />
     *          <j:value select="@id" />
     *          <j:icon>{@type}.png</j:icon>
     *          <j:traverse select="product" />
     *      </j:bindings>
     *      <j:model>
     *          <products>
     *              <product name="Soundblaster" type="audio"    id="product10" />
     *              <product name="Teapot"       type="3d"       id="product13" />
     *              <product name="Coprocessor"  type="chips"    id="product15" />
     *              <product name="Keyboard"     type="input"    id="product17" />
     *              <product name="Diskdrive"    type="storage"  id="product20" />
     *          </products>
     *      </j:model>
     *  </j:list>
     * </code>
     * Example:
     * This example adds a product to this element.
     * selection.
     * <code>
     *  myList.add('<product name="USB drive" type="storage" />');
     * </code>
     * Example:
     * This example copy's the selected product, changes it's name and then
     * adds it. After selecting the new node the user is offered a rename input
     * box.
     * <code>
     *  var xmlNode = jpf.xmldb.copy(myList.selected);
     *  xmlNode.setAttribute("name", "New product");
     *  myList.add(xmlNode);
     *  myList.select(xmlNode);
     *  myList.startRename();
     * </code>
     * Remarks:
     * Another way to trigger this method is by using the action attribute on a
     * button.
     * <code>
     *  <j:button action="add" target="myList">Add new product</j:button>
     * </code>
     * Using the action methodology you can let the original data source
     * (usually the server) know that the user added an item.
     * <code>
     *  <j:actions>
     *      <j:add set="rpc:comm.addProduct({.})" />
     *  </j:actions>
     * </code>
     * For undo this action should be extended as follows.
     * <code>
     *  <j:actions>
     *      <j:add set="url:add_product.php?id={.}">
     *          <j:undo set="url:remove_product.php?id={@id}" />
     *      </j:add>
     *  </j:actions>
     * </code>
     * In some cases the server needs to create the new product before it's
     * added. This is done as follows.
     * <code>
     *  <j:actions>
     *      <j:add get="rpc:comm.createNewProduct()" />
     *  </j:actions>
     * </code>
     * Alternatively the template for the addition can be provided as a child of
     * the action rule.
     * <code>
     *  <j:actions>
     *      <j:add set="url:add_product.php?id={.}">
     *          <product name="USB drive" type="storage" />
     *      </j:add>
     *  </j:actions>
     * </code>
     * @action
     * @param  {XMLElement} [xmlNode]    the xml data element which is added. If none is specified the action will use the action rule to try to retrieve a new node to add.
     * @param  {XMLElement} [pNode]      the parent node of the added xml data element.
     * @param  {XMLElement} [beforeNode] the position where the xml element should be inserted.
     * @return  {XMLElement} the added xml data element or false on failure.
     */
    this.add = function(xmlNode, pNode, beforeNode){
        var node;

        if (this.actionRules) {
            if (xmlNode && xmlNode.nodeType)
                node = this.getNodeFromRule("add", xmlNode, true);
            else if (typeof xmlNode == "string") {
                if (xmlNode.trim().charAt(0) == "<") {
                    xmlNode = jpf.getXml(xmlNode);
                    node = this.getNodeFromRule("add", xmlNode, true);
                }
                else {
                    var rules = this.actionRules["add"];
                    for (var i = 0, l = rules.length; i < l; i++) {
                        if (rules[i].getAttribute("type") == xmlNode) {
                            xmlNode = null;
                            node = rules[i];
                            break;
                        }
                    }
                }
            }

            if (!node && this.actionRules["add"])
                node = this.actionRules["add"][0];
        }
        else
            node = null;

        //#ifdef __WITH_OFFLINE
        if (!jpf.offline.canTransact())
            return false;

        if (!jpf.offline.onLine && (!xmlNode || !node.getAttribute("get")))
            return false;
        //#endif
        
        var refNode  = this.isTreeArch ? this.selected || this.xmlRoot : this.xmlRoot;
        var jmlNode  = this; //PROCINSTR
        var callback = function(addXmlNode, state, extra){
            if (state != jpf.SUCCESS) {
                var oError;

                //#ifdef __DEBUG
                oError = new Error(jpf.formatErrorString(1032, jmlNode,
                    "Loading xml data",
                    "Could not add data for control " + jmlNode.name
                    + "[" + jmlNode.tagName + "] \nUrl: " + extra.url
                    + "\nInfo: " + extra.message + "\n\n" + xmlNode));
                //#endif

                if (extra.tpModule.retryTimeout(extra, state, jmlNode, oError) === true)
                    return true;

                throw oError;
            }

            if (typeof addXmlNode != "object")
                addXmlNode = jpf.getXmlDom(addXmlNode).documentElement;
            if (addXmlNode.getAttribute(jpf.xmldb.xmlIdTag))
                addXmlNode.setAttribute(jpf.xmldb.xmlIdTag, "");

            var actionNode = jmlNode.getNodeFromRule("add", jmlNode.isTreeArch
                ? jmlNode.selected
                : jmlNode.xmlRoot, true, true);
            if (!pNode) {
                if (actionNode && actionNode.getAttribute("parent")) {
                    pNode = jmlNode.xmlRoot
                        .selectSingleNode(actionNode.getAttribute("parent"));
                }
                else {
                    pNode = jmlNode.isTreeArch
                        ? jmlNode.selected || jmlNode.xmlRoot
                        : jmlNode.xmlRoot
                }
            }

            if (!pNode)
                pNode = jmlNode.xmlRoot;

            if (jpf.isSafari && pNode.ownerDocument != addXmlNode.ownerDocument)
                addXmlNode = pNode.ownerDocument.importNode(addXmlNode, true); //Safari issue not auto importing nodes

            if (jmlNode.executeAction("appendChild",
              [pNode, addXmlNode, beforeNode], "add", addXmlNode) !== false
              && jmlNode.autoselect)
                jmlNode.select(addXmlNode);

            return addXmlNode;
        }

        if (xmlNode)
            return callback(xmlNode, jpf.SUCCESS);
        else {
            //#ifdef __DEBUG
            if (!node) {
                throw new Error(jpf.formatErrorString(0, this,
                    "Executing add action",
                    "Missing add action defined in action rules. Unable to \
                     perform action."));
            }
            //#endif

            if (node.getAttribute("get"))
                return jpf.getData(node.getAttribute("get"), refNode, null, callback)
            else if (node.firstChild)
                return callback(jpf.getNode(node, [0]).cloneNode(true), jpf.SUCCESS);
        }

        return addXmlNode;
    };

    if (!this.setValue) {
        /**
         * Sets the value of this element.The value
         * corresponds to an item in the list of loaded data elements. This
         * element will receive the selection. If no data element is found, the
         * selection is cleared.
         *
         * @param  {String}  value  the new value for this element.
         * @param  {Boolean} disable_event
         * @see #getValue
         */
        this.setValue = function(value, disable_event){
            noEvent = disable_event;
            this.setProperty("value", value);
            noEvent = false;
        };
    }

    /**
     * Retrieves an xml data element that has a value that corresponds to the
     * string that is searched on.
     * @param {String} value the value to match.
     */
    this.findXmlNodeByValue = function(value){
        var nodes = this.getTraverseNodes();
        var bindSet = this.bindingRules && this.bindingRules[this.mainBind]
            ? this.mainBind
            : "caption";

        for (var i = 0; i < nodes.length; i++) {
            if (this.applyRuleSetOnNode(bindSet, nodes[i]) == value)
                return nodes[i];
        }
    };

    if (!this.getValue) {
        /**
         * Retrieves the value of this element. This is the value of the
         * first selected data element.
         * @see #setValue
         */
        this.getValue = function(xmlNode){
            if (!this.bindingRules && !this.caption) 
                return false;

            // #ifdef __DEBUG
            if (!this.caption && !this.bindingRules[this.mainBind] && !this.bindingRules["caption"])
                throw new Error(jpf.formatErrorString(1074, this,
                    "getValue Method",
                    "Could not find default value bind rule for this control."));
            // #endif

            // #ifdef __WITH_MULTIBINDING
            if (!this.multiselect && !this.xmlRoot && selSmartbinding && selSmartbinding.xmlRoot)
                return selSmartbinding.applyRuleSetOnNode(selSmartbinding.mainBind,
                    selSmartbinding.xmlRoot, null, true);
            // #endif

            return this.applyRuleSetOnNode(this.mainBind, xmlNode || this.selected, null, true)
                || this.applyRuleSetOnNode("caption", xmlNode || this.selected, null, true);

        };
    }

    /**
     * Sets the second level SmartBinding for Multilevel Databinding.
     * For more information see {@link MultiLevelBinding}
     *
     * @return  {SmartBinding}
     * @see #getSelectionBindClass
     * @private
     */
    this.$setMultiBind = function(smartbinding, part){
        if (!selSmartbinding)
            selSmartbinding = new jpf.MultiLevelBinding(this);

        selSmartbinding.setSmartBinding(smartbinding, part);

        this.dispatchEvent("initselbind", {smartbinding : selSmartbinding});
    };

    /**
     * Gets the second level SmartBinding for Multilevel Databinding.
     * For more information see {@link MultiLevelBinding}
     *
     * @return  {SmartBinding}
     * @see #setSelectionBindClass
     * @private
     */
    this.$getMultiBind = function(){
        return (selSmartbinding
            || (selSmartbinding = new jpf.MultiLevelBinding(this)));
    };

    // #endif

    /**
     * Select the current selection again.
     *
     * @todo Add support for multiselect
     */
    this.reselect = function(){
        if (this.selected) this.select(this.selected, null, this.ctrlselect,
            null, true);//no support for multiselect currently.
    };

    /**
     * Selects a single, or set of {@info TraverseNodes "Traverse Nodes"}.
     * The selection can be visually represented in this element.
     *
     * @param {mixed}   xmlNode      the identifier to determine the selection.
     *   Possible values:
     *   {XMLElement}  the xml data element to be used in the selection as a start/end point or to toggle the selection on the node.
     *   {HTMLElement} the html element node used as visual representation of data node. Used to determine the xml data element for selection.
     *   {String}      the value of the xml data element to be select.
     * @param {Boolean} [ctrlKey]    whether the Ctrl key was pressed
     * @param {Boolean} [shiftKey]   whether the Shift key was pressed
     * @param {Boolean} [fakeselect] whether only visually a selection is made
     * @param {Boolean} [force]      whether reselect is forced.
     * @param {Boolean} [noEvent]    whether to not call any events
     * @return  {Boolean}  whether the selection could be made
     *
     * @event  beforeselect  Fires before a selection is made
     *   object:
     *   {XMLElement} xmlNode   the xml data element that will be selected.
     *   {HTMLElement} htmlNode the html element that visually represents the xml data element.
     * @event  afterselect  Fires after a selection is made
     *   object:
     *   {XMLElement} xmlNode   the xml data element that was selected.
     *   {HTMLElement} htmlNode the html element that visually represents the xml data element.
     */
    var buffered = null;
    this.select  = function(xmlNode, ctrlKey, shiftKey, fakeselect, force, noEvent){
        if (!this.selectable || this.disabled) return;

        if (this.ctrlselect && !shiftKey)
            ctrlKey = true;

        // Selection buffering (for async compatibility)
        if (!this.xmlRoot) {
            buffered        = [arguments, this.autoselect];
            this.autoselect = true;
            return;
        }

        if (buffered) {
            var x    = buffered;
            buffered = null;
            if (this.autoselect)
                this.autoselect = x[1];
            return this.select.apply(this, x[0]);
        }

        var htmlNode;

        /* **** Type Detection *****/
        if (!xmlNode) {
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(1075, this,
                "Making a selection",
                "No selection was specified"))
            //#endif

            return false;
        }

        if (typeof xmlNode != "object") {
            var str = xmlNode;
            xmlNode = jpf.xmldb.getNodeById(xmlNode);

            //Select based on the value of the xml node
            if (!xmlNode) {
                xmlNode = this.findXmlNodeByValue(str);
                if (!xmlNode) {
                    this.clearSelection(null, noEvent);
                    return;
                }
            }
        }
        if (!xmlNode.style)
            htmlNode = this.caching
                ? this.getNodeFromCache(xmlNode.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                : document.getElementById(xmlNode.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
        else {
            var id = (htmlNode = xmlNode).getAttribute(jpf.xmldb.htmlIdTag);
            while (!id && htmlNode.parentNode)
                id = (htmlNode = htmlNode.parentNode).getAttribute(
                    jpf.xmldb.htmlIdTag);

            xmlNode = jpf.xmldb.getNodeById(id, this.xmlRoot);
        }

        if(!noEvent && this.dispatchEvent('beforeselect', {
            xmlNode : xmlNode,
            htmlNode: htmlNode,
            ctrlKey : ctrlKey,
            shiftKey : shiftKey}) === false)
              return false;

        /**** Selection ****/

        var lastIndicator = this.indicator;
        this.indicator    = xmlNode;

        //Multiselect with SHIFT Key.
        if (shiftKey && this.multiselect) {
            var range = this.$calcSelectRange(valueList[0] || lastIndicator,
                xmlNode);

            if (this.$indicator)
                this.$deindicate(this.$indicator);

            this.selectList(range);

            this.$selected  =
            this.$indicator = this.$indicate(htmlNode);
        }
        else if (ctrlKey && this.multiselect) { //Multiselect with CTRL Key.
            //Node will be unselected
            if (valueList.contains(xmlNode)) {
                if (!fakeselect) {
                    selectedList.remove(htmlNode);
                    valueList.remove(xmlNode);
                }

                if (this.selected == xmlNode) {
                    var ind = this.$indicator;
                    this.clearSelection(true, true);
                     this.$deindicate(ind);

                    if (valueList.length && !fakeselect) {
                        //this.$selected = selectedList[0];
                        this.selected = valueList[0];
                    }
                }
                else
                    this.$deselect(htmlNode, xmlNode);

                if (htmlNode != this.$indicator)
                    this.$deindicate(this.$indicator);

                this.$selected  =
                this.$indicator = this.$indicate(htmlNode);
            }
            // Node will be selected
            else {
                if (this.$indicator)
                    this.$deindicate(this.$indicator);
                this.$indicator = this.$indicate(htmlNode);

                this.$selected   = this.$select(htmlNode);
                this.selected     = xmlNode;

                if (!fakeselect) {
                    selectedList.push(htmlNode);
                    valueList.push(xmlNode);
                }
            }
        }
        else if (htmlNode && selectedList.contains(htmlNode) && fakeselect) //Return if selected Node is htmlNode during a fake select
            return;
        else { //Normal Selection
            if (!force && htmlNode && this.$selected == htmlNode
              && valueList.length <= 1 && !this.reselectable
              && selectedList.contains(htmlNode))
                return;

            if (this.$selected)
                this.$deselect(this.$selected);
            if (this.$indicator)
                this.$deindicate(this.$indicator);
            if (this.selected)
                this.clearSelection(null, true);

            this.$indicator = this.$indicate(htmlNode, xmlNode);
            this.$selected  = this.$select(htmlNode, xmlNode);
            this.selected    = xmlNode;

            selectedList.push(htmlNode);
            valueList.push(xmlNode);
        }

        if (!noEvent) {
            if (this.delayedselect){
                var jNode = this;
                setTimeout(function(){
                    jNode.dispatchEvent("afterselect", {
                        list    : valueList,
                        xmlNode : xmlNode}
                    );
                }, 10);
            }
            else
                this.dispatchEvent("afterselect", {
                    list    : valueList,
                    xmlNode : xmlNode
                });
        }

        return true;
    };

    /**
     * Choose a selected item. This is done by double clicking on the item or
     * pressing the Enter key.
     *
     * @param {mixed}   xmlNode      the identifier to determine the selection.
     *   Possible values:
     *   {XMLElement}  the xml data element to be choosen.
     *   {HTMLElement} the html element node used as visual representation of data node. Used to determine the xml data element.
     *   {String}      the value of the xml data element to be choosen.
     * @event  beforechoose  Fires before a choice is made.
     *   object:
     *   {XMLElement} xmlNode   the xml data element that was choosen.
     * @event  afterchoose   Fires after a choice is made.
     *   object:
     *   {XMLElement} xmlNode   the xml data element that was choosen.
     */
    this.choose = function(xmlNode){
        if (!this.selectable || this.disabled) return;

        if (this.dispatchEvent("beforechoose", {xmlNode : xmlNode}) === false)
            return false;

        if (xmlNode && !xmlNode.style)
            this.select(xmlNode);

        if (this.hasFeature(__DATABINDING__)
          && this.dispatchEvent("afterchoose", {xmlNode : this.selected}) !== false)
            this.setConnections(this.selected, "choice");
    };

    /**
     * Removes the selection of one or more selected nodes.
     *
     * @param {Boolean} [singleNode] whether to only deselect the indicated node
     * @param {Boolean} [noEvent]    whether to not call any events
     * @event  beforedeselect  before a choice is made
     *   object:
     *   {XMLElement} xmlNode   the xml data element that will be deselected.
     * @event  afterdeselect   after a choice is made
     *   object:
     *   {XMLElement} xmlNode   the xml data element that is deselected.
     */
    this.clearSelection = function(singleNode, noEvent){
        if (!this.selectable || this.disabled) return;

        var clSel = singleNode ? this.selected : valueList;
        if (!noEvent && this.dispatchEvent("beforedeselect", {
            xmlNode : clSel
          }) === false)
            return false;

        var htmlNode;
        if (this.selected) {
            htmlNode = this.caching
                ? this.getNodeFromCache(this.selected.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                : document.getElementById(this.selected.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
            this.$deselect(htmlNode);
        }

        //if(this.$selected) this.$deselect(this.$selected);
        this.$selected = this.selected = null;

        if (!singleNode) {
            for (var i = valueList.length - 1; i >= 0; i--) {
                htmlNode = this.caching
                    ? this.getNodeFromCache(valueList[i].getAttribute(
                        jpf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                    : document.getElementById(valueList[i].getAttribute(
                        jpf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
                this.$deselect(htmlNode);
            }
            //for(var i=selectedList.length-1;i>=0;i--) this.$deselect(selectedList[i]);
            selectedList = [];
            valueList    = [];
        }

        if (this.indicator) {
            htmlNode = this.caching
                ? this.getNodeFromCache(this.indicator.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                : document.getElementById(this.indicator.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55

            this.$selected  =
            this.$indicator = this.$indicate(htmlNode);
        }

        if (!noEvent)
            this.dispatchEvent("afterdeselect", {xmlNode : clSel});
    };

    /**
     * Selects a set of items
     *
     * @param {Array} xmlNodeList the xml data elements that will be selected.
     */
    //@todo I think there are missing events here?
    this.selectList = function(xmlNodeList, noEvent, selected){
        if (!this.selectable || this.disabled) return;

        if (!noEvent && this.dispatchEvent("beforeselect", {
            xmlNode : selected
          }) === false)
            return false;

        this.clearSelection(null, true);

        for (var sel, i=0;i<xmlNodeList.length;i++) {
            if (!xmlNodeList[i] || xmlNodeList[i].nodeType != 1) continue; //@todo fix select state in unserialize after removing
            var xmlNode = xmlNodeList[i];

            //Type Detection
            if (typeof xmlNode != "object")
                xmlNode = jpf.xmldb.getNodeById(xmlNode);
            if (!xmlNode.style)
                htmlNode = this.$findNode(null, xmlNode.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
            else {
                htmlNode = xmlNode;
                xmlNode  = jpf.xmldb.getNodeById(htmlNode.getAttribute(
                    jpf.xmldb.htmlIdTag));
            }

            if (!xmlNode) {
                // #ifdef __DEBUG
                jpf.console.warn("Component : " + this.name + " ["
                    + this.tagName + "]\nMessage : xmlNode whilst selecting a list of xmlNodes could not be found. Ignoring.")
                // #endif
                continue;
            }

            //Select Node
            if (htmlNode) {
                if (!sel && selected == htmlNode)
                    sel = htmlNode;

                this.$select(htmlNode);
                selectedList.push(htmlNode);
            }
            valueList.push(xmlNode);
        }

        this.$selected = sel || selectedList[0];
        this.selected   = selected || valueList[0];

        if (!noEvent) {
            this.dispatchEvent("afterselect", {
                list    : valueList,
                xmlNode : this.selected
            });
        }
    };

    /**
     * Sets the caret on an item to indicate to the user that the keyboard
     * actions are done relevant to that item. Using the keyboard
     * a user can change the position of the indicator using the Ctrl and arrow
     * keys while not making a selection. When making a selection with the mouse
     * or keyboard the indicator is always set to the selected node. Unlike a
     * selection there can be only one indicator item.
     *
     * @param {mixed}   xmlNode      the identifier to determine the indicator.
     *   Possible values:
     *   {XMLElement}  the xml data element to be set as indicator.
     *   {HTMLElement} the html element node used as visual representation of data node. Used to determine the xml data element.
     *   {String}      the value of the xml data element to be set as indicator.
     * @event indicate Fires when an item becomes the indicator.
     */
    this.setIndicator = function(xmlNode){
        if (!xmlNode) {
            if (this.$indicator)
                this.$deindicate(this.$indicator);
            this.indicator  =
            this.$indicator = null;
            return;
        }

        /* **** Type Detection *****/
        var htmlNode;
        if (typeof xmlNode != "object")
            xmlNode = jpf.xmldb.getNodeById(xmlNode);
        if (!xmlNode.style)
            htmlNode = this.caching
                ? this.getNodeFromCache(xmlNode.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId)
                : document.getElementById(xmlNode.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId); //IE55
        else {
            var id = (htmlNode = xmlNode).getAttribute(jpf.xmldb.htmlIdTag);
            while (!id && htmlNode.parentNode)
                id = (htmlNode = htmlNode.parentNode).getAttribute(
                    jpf.xmldb.htmlIdTag);

            xmlNode = jpf.xmldb.getNodeById(id);
        }

        if (this.$indicator)
            this.$deindicate(this.$indicator);
        this.indicator  = xmlNode;
        this.$indicator = this.$indicate(htmlNode);

        this.dispatchEvent("indicate");
    };

    this.setTempSelected = function(xmlNode, ctrlKey, shiftKey){
        clearTimeout(this.timer);

        if (ctrlKey || this.ctrlselect) {
            if (this.$tempsel) {
                this.select(this.$tempsel);
                this.$tempsel = null;
            }

            this.setIndicator(xmlNode);
        }
        else if (shiftKey){
            if (this.$tempsel) {
                this.$deselect(this.$tempsel);
                this.$tempsel = null;
            }

            this.select(xmlNode, null, shiftKey);
        }
        else if (!this.bufferselect) {
            this.select(xmlNode);
        }
        else {
            var id = jpf.xmldb.getID(xmlNode, this);

            this.$deselect(this.$tempsel || this.$selected);
            this.$deindicate(this.$tempsel || this.$indicator);
            this.$tempsel = this.$indicate(document.getElementById(id));
            this.$select(this.$tempsel);

            this.timer = setTimeout(function(){
                _self.selectTemp();
            }, 400);
        }
    };

    this.selectTemp = function(){
        if (!this.$tempsel)
            return;

        clearTimeout(this.timer);
        this.select(this.$tempsel);
        this.$tempsel = null;
        this.timer    = null;
    };

    /**
     * Selects all the {@info TraverseNodes "Traverse Nodes"} of this element
     *
     */
    this.selectAll = function(){
        if (!this.multiselect || !this.selectable
          || this.disabled || !this.$selected)
            return;

        var nodes = this.getTraverseNodes();
        //this.select(nodes[0]);
        //this.select(nodes[nodes.length-1], null, true);
        this.selectList(nodes);
    };

    /**
     * Retrieves an array or a document fragment containing all the selected
     * xml data elements from this element.
     *
     * @param {Boolean} [xmldoc] whether the method should return a document fragment.
     * @return {mixed} the selection of this element.
     */
    this.getSelection = function(xmldoc){
        var i, r;
        if (xmldoc) {
            r = this.xmlRoot
                ? this.xmlRoot.ownerDocument.createDocumentFragment()
                : jpf.getXmlDom().createDocumentFragment();
            for (i = 0; i < valueList.length; i++)
                jpf.xmldb.clearConnections(r.appendChild(
                    valueList[i].cloneNode(true)));
        }
        else
            for (r = [], i = 0; i < valueList.length; i++)
                r.push(valueList[i]);

        return r;
    };

    /**
     * Selects the next xml data element to be selected.
     *
     * @param  {XMLElement}  xmlNode  the context data element.
     * @param  {Boolean}     isTree
     */
    this.defaultSelectNext = function(xmlNode, isTree){
        var next = this.getNextTraverseSelected(xmlNode);
        //if(!next && xmlNode == this.xmlRoot) return;

        //Why not use this.isTreeArch ??
        if (next || !isTree)
            this.select(next ? next : this.getTraverseParent(xmlNode));
        else
            this.clearSelection(null, true);
    };

    /**
     * Selects the next xml data element when available.
     */
    this.selectNext = function(){
        var xmlNode = this.getNextTraverse();
        if (xmlNode)
            this.select(xmlNode);
    };

    /**
     * Selects the previous xml data element when available.
     */
    this.selectPrevious = function(){
        var xmlNode = this.getNextTraverse(null, -1);
        if (xmlNode)
            this.select(xmlNode);
    };

    /**
     * @private
     */
    this.getDefaultNext = function(xmlNode, isTree){
        var next = this.getNextTraverseSelected(xmlNode);
        //if(!next && xmlNode == this.xmlRoot) return;

        return (next && next != xmlNode)
            ? next
            : (isTree
                ? this.getTraverseParent(xmlNode)
                : null); //this.getFirstTraverseNode()
    };

    /**
     * Determines whether a node is selected.
     *
     * @param  {XMLElement} xmlNode  The xml data element to be checked.
     * @return  {Boolean} whether the element is selected.
     */
    this.isSelected = function(xmlNode){
        if (!xmlNode) return false;

        for (var i = 0; i < valueList.length; i++) {
            if (valueList[i] == xmlNode)
                return true;
        }

        return false;
    };

    /**
     * This function checks whether the current selection is still correct.
     * Selection can become invalid when updates to the underlying data
     * happen. For instance when a selected node is removed.
     */
    this.$checkSelection = function(nextNode){
        if (valueList.length > 1) {
            //Fix selection if needed
            for (var lst = [], i = 0, l = valueList.length; i < l; i++) {
                if (jpf.xmldb.isChildOf(this.xmlRoot, valueList[i]))
                    lst.push(valueList[i]);
            }

            if (lst.length > 1) {
                this.selectList(lst);
                if(this.indicator
                  && !jpf.xmldb.isChildOf(this.xmlRoot, this.indicator)) {
                    this.setIndicator(nextNode || this.selected);
                }
                return;
            }
            else if (lst.length) {
                //this.clearSelection(null, true); //@todo noEvents here??
                nextNode = lst[0];
            }
        }

        if (!nextNode) {
            if (this.selected
              && !jpf.xmldb.isChildOf(this.xmlRoot, this.selected)) {
                nextNode = this.getFirstTraverseNode();
            }
            else if(this.selected && this.indicator
              && !jpf.xmldb.isChildOf(this.xmlRoot, this.indicator)) {
                this.setIndicator(this.selected);
            }
            else if (!this.selected){
                nextNode = this.xmlRoot
                    ? this.getFirstTraverseNode()
                    : null;
            }
            else {
                return; //Nothing to do
            }
        }

        if (nextNode) {
            if (this.autoselect) {
                this.select(nextNode);
            }
            else {
                if (!this.multiselect)
                    this.clearSelection();
                this.setIndicator(nextNode);
            }
        }
        else
            this.clearSelection();

        //if(action == "synchronize" && this.autoselect) this.reselect();
    };

    /**
     * @attribute {Boolean} [multiselect]  whether the user may select multiple items. Default is true, false for j:dropdown
     * @attribute {mixed} [autoselect]
     *   Possible values:
     *   {Boolean} whether a selection is made after data is loaded. Default is true, false for j:Dropdown.
     *   {String}
     *     Possible values:
     *     all  all items are selected after data is loaded.
     * @attribute {Boolean} [selectable]    whether this element can receive a selection.
     * @attribute {Boolean} [ctrlselect]    whether the user makes a selection as if it was holding the Ctrl key.
     * @attribute {Boolean} [allowdeselect] whether the user can remove the selection of an element.
     * @attribute {Boolean} [reselectable]  whether selected nodes can be selected again such that the select events are called.
     * @attribute {String}  [selected]      the value of the xml data element which should be selected after loading data in this element.
     */
    this.selectable = true;
    if (this.ctrlselect === undefined)
        this.ctrlselect = false;
    if (this.multiselect === undefined)
        this.multiselect = true;
    if (this.autoselect === undefined)
        this.autoselect = true;
    if (this.delayedselect === undefined)
        this.delayedselect = true;
    if (this.allowdeselect === undefined)
        this.allowdeselect = true;
    this.reselectable = false;

    this.$booleanProperties["selectable"]    = true;
    //this.$booleanProperties["ctrlselect"]    = true;
    this.$booleanProperties["multiselect"]   = true;
    this.$booleanProperties["autoselect"]    = true;
    this.$booleanProperties["delayedselect"] = true;
    this.$booleanProperties["allowdeselect"] = true;
    this.$booleanProperties["reselectable"]  = true;

    this.$supportedProperties.push("selectable", "ctrlselect", "multiselect",
        "autoselect", "delayedselect", "allowdeselect", "reselectable", "value");

    this.$propHandlers["value"] = function(value){
        if (!this.bindingRules && !this.caption || !this.xmlRoot)
            return;

        // #ifdef __DEBUG
        if (!this.caption && !this.bindingRules["caption"]
          && !this.bindingRules[this.mainBind] && !this.caption)
            throw new Error(jpf.formatErrorString(1074, this,
                "Setting the value of this component",
                "Could not find default value bind rule for this control."))
        // #endif

        if (jpf.isNot(value))
            return this.clearSelection(null, noEvent);

        if (!this.xmlRoot)
            return this.select(value);

        var xmlNode = this.findXmlNodeByValue(value);
        if (xmlNode)
            this.select(xmlNode, null, null, null, null, noEvent);
        else
            return this.clearSelection(null, noEvent);
    };

    this.$propHandlers["allowdeselect"] = function(value){
        if (value) {
            var _self = this;
            this.oInt.onmousedown = function(e){
                if (!e) e = event;
                if (e.ctrlKey || e.shiftKey)
                    return;

                var srcElement = e.srcElement || e.target;
                if (_self.allowdeselect && (srcElement == this
                  || srcElement.getAttribute(jpf.xmldb.htmlIdTag)))
                    _self.clearSelection(); //hacky
            }
        }
        else {
            this.oInt.onmousedown = null;
        }
    };

    this.$propHandlers["ctrlselect"] = function(value){
        if (value != "enter")
            this.ctrlselect = jpf.isTrue(value);
    }

    function fAutoselect(){this.selectAll();}
    this.$propHandlers["autoselect"] = function(value){
        if (value == "all" && this.multiselect) {
            this.addEventListener("afterload", fAutoselect);
        }
        else {
            this.removeEventListener("afterload", fAutoselect);
        }
    };

    this.$propHandlers["multiselect"] = function(value){
        if (!value && valueList.length > 1) {
            this.select(this.selected);
        }

        if (value)
            this.bufferselect = false; //@todo doesn't return to original value
    };

    // Select Bind class
    // #ifdef __WITH_DATABINDING
    this.addEventListener("beforeselect", function(e){
        if (this.applyRuleSetOnNode("select", e.xmlNode, ".") === false)
            return false;
    });
    // #endif

    // #ifdef __WITH_PROPERTY_BINDING || __WITH_OFFLINE_STATE
    this.addEventListener("afterselect", function (e){
        //#ifdef __WITH_PROPERTY_BINDING
        if (this.bindingRules && (this.bindingRules["value"]
          || this.bindingRules["caption"]) || this.caption) {
            this.value = this.applyRuleSetOnNode(this.bindingRules && this.bindingRules["value"]
                ? "value"
                : "caption", e.xmlNode);

            //@todo this will also set the xml again - actually I don't think so because of this.value == value;
            this.setProperty("value", this.value);
        }

        if (this.sellength != valueList.length)
            this.setProperty("sellength", valueList.length);
        //#endif

        //#ifdef __WITH_OFFLINE_STATE
        if (jpf.offline.state.enabled && jpf.offline.state.realtime) {  //@todo please optimize
            for (var sel = [], i = 0; i < valueList.length; i++)
                sel.push(jpf.remote.xmlToXpath(valueList[i], null, true));

            jpf.offline.state.set(this, "selection", sel);
            fSelState.call(this);
        }
        //#endif
    });
    // #endif

    //#ifdef __WITH_OFFLINE_STATE
    function fSelState(){
        if (jpf.offline.state.enabled && jpf.offline.state.realtime) {
            jpf.offline.state.set(this, "selstate",
                [this.indicator
                    ? jpf.remote.xmlToXpath(this.indicator, null, true)
                    : "",
                 this.selected
                    ? jpf.remote.xmlToXpath(this.selected, null, true)
                    : ""]);
        }
    }

    this.addEventListener("indicate", fSelState);
    //#endif
};

/**
 * @private
 */
jpf.MultiSelectServer = {
    /**
     * @private
     */
    objects : {},

    /**
     * @private
     */
    register : function(xmlId, xmlNode, selList, jNode){
        if (!this.uniqueId)
            this.uniqueId = jpf.all.push(this) - 1;

        this.objects[xmlId] = {
            xml   : xmlNode,
            list  : selList,
            jNode : jNode
        };
    },

    $xmlUpdate : function(action, xmlNode, listenNode, UndoObj){
        if (action != "attribute") return;

        var data = this.objects[xmlNode.getAttribute(jpf.xmldb.xmlIdTag)];
        if (!data) return;

        var nodes = xmlNode.attributes;

        for (var j = 0; j < data.list.length; j++) {
            //data[j].setAttribute(UndoObj.name, xmlNode.getAttribute(UndoObj.name));
            jpf.xmldb.setAttribute(data.list[j], UndoObj.name,
                xmlNode.getAttribute(UndoObj.name));
        }

        //jpf.xmldb.synchronize();
    }
};

// #endif
