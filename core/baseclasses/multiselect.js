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

apf.__MULTISELECT__ = 1 << 8;

// #ifdef __WITH_MULTISELECT

/**
 * @term eachnode A each node is a {@link term.datanode data node} that is in the set selected by the 
 * {@link baseclass.multiselectbinding.binding.each each binding rule}.
 * These {@link term.datanode data nodes} get representation within the visual element. For instance
 * each item in a list is connected to such a each node. A each node
 * can be selected, removed, added, dragged, dropped and so on. 
 * Example:
 * In this example the person nodes that have the show attribute set to 1 are the 
 * each nodes of the list. This list will display three items.
 * <code>
 *  <a:list>
 *      <a:bindings>
 *          <a:caption match="[@name]" />
 *          <a:each match="[person[@show='1']]" />
 *      </a:bindings>
 *      <a:model>
 *          <data>
 *              <person name="test 5"/>
 *              <person show="1" name="test 3"/>
 *              <person name="test 4"/>
 *              <person show="1" name="test 2"/>
 *              <person show="1" name="test 1"/>
 *          </data>
 *      </a:model>
 *  </a:list>
 * </code>
 * Remarks:
 * A somewhat advanced topic is understanding how an element can use the 
 * each {@link term.binding binding rule}. For the tree this binding rules
 * can be used to create a virtual tree mapping of the xml.
 */

/**
 * @term caret When selecting nodes in a list using the keyboard, the caret is 
 * the indication of the position within that list. The item that the caret is
 * on might or might not be selected. This feature is especially useful when 
 * holding the control key or using the shift key to multi select items.
 */

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have selection features. This includes handling
 * for multiselect and several keyboard based selection interaction. It also
 * takes care of {@link term.caret caret} handling when multiselect is enabled. Furthermore features 
 * for dealing with multinode component are included like adding and removing 
 * {@link term.datanode data nodes}.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.5
 *
 * @inherits apf.MultiselectBinding
 *
 * @binding select Determines whether the {@link term.eachnode each node} can be selected.
 * Example:
 * In this example the tree contains nodes that have a disabled flag set. 
 * These nodes cannot be selected
 * <code>
 *  <a:list width="200">
 *      <a:bindings>
 *          <a:selectable match="[self::node()[not(@disabled) or @disabled != 'true']]" />
 *          <a:each match="[person]"></a:each>
 *          <a:caption match="[@name]"></a:caption>
 *      </a:bindings>
 *      <a:model>
 *          <data>
 *              <person disabled="false" name="test 5"/>
 *              <person disabled="true" name="test 3"/>
 *              <person name="test 4"/>
 *              <person disabled="true" name="test 2"/>
 *              <person disabled="true" name="test 1"/>
 *          </data>
 *      </a:model>
 *  </a:list>
 * </code>
 * @binding value  Determines the way the value for the element is retrieved
 * from the selected node. The value property contains this value.
 * Example:
 * <code>
 *  <a:dropdown onafterchange="alert(this.value)">
 *      <a:bindings>
 *          <a:caption match="[text()]" />
 *          <a:value match="[@value]" />
 *          <a:each match="[item]" />
 *      </a:bindings>
 *      <a:model>
 *          <items>
 *              <item value="#FF0000">red</item>
 *              <item value="#00FF00">green</item>
 *              <item value="#0000FF">blue</item>
 *          </items>
 *      </a:model>
 *  </a:dropdown>
 * </code>
 */
apf.MultiSelect = function(){
    this.$init(function(){
        this.$valueList       = [];
        this.$selectedList    = [];
    });
};

//@todo investigate if selectedList can be deprecated
(function() {
    this.$regbase    = this.$regbase|apf.__MULTISELECT__;

    /**** Properties ****/

    /**
     * the last selected item of this element.
     * @type {XMLElement} 
     */
    this.sellength    = 0;
    this.selected     = null;
    this.$selected    = null;
    
    /**
     * the xml element that has the {@link term.caret caret}.
     * @type {XMLElement} 
     */
    this.caret    = null;
    this.$caret   = null;
    
    /**
     * whether to use a {@link term.caret caret} in the interaction of this element.
     * @type {Boolean} 
     */
    this.useindicator = true;

    // #ifdef __WITH_DATABINDING

    /**
     * Removes an {@link term.datanode data node} from the data of this element.
     * Example:
     * A simple list showing products. This list is used in all following examples.
     * <code>
     *  <a:list id="myList">
     *      <a:bindings>
     *          <a:caption match="[@name]" />
     *          <a:value match="[@id]" />
     *          <a:icon>[@type].png</a:icon>
     *          <a:each match="[product]" />
     *      </a:bindings>
     *      <a:model>
     *          <products>
     *              <product name="Soundblaster" type="audio"    id="product10" length="12" />
     *              <product name="Teapot"       type="3d"       id="product13" />
     *              <product name="Coprocessor"  type="chips"    id="product15" />
     *              <product name="Keyboard"     type="input"    id="product17" />
     *              <product name="Diskdrive"    type="storage"  id="product20" />
     *          </products>
     *      </a:model>
     *  </a:list>
     * </code>
     * Example:
     * This example selects a product by it's value and then removes the
     * selection.
     * <code>
     *  <a:script><!--
     *      apf.onload = function() {
     *          myList.setValue("product20");
     *          myList.remove();
     *      }
     *  --></a:script>
     * </code>
     * Example:
     * This example gets a product by it's value and then removes it.
     * <code>
     *  <a:script>
     *      var xmlNode = myList.findXmlNodeByValue("product20");
     *      myList.remove(xmlNode);
     *  </a:script>
     * </code>
     * Example:
     * This example retrieves all nodes from a list. All items with a length
     * greater than 10 are singled out and removed.
     * <code>
     *  <a:script><![CDATA[
     *      apf.onload = function() {
     *          var list = myList.getTraverseNodes();
     * 
     *          var removeList = [];
     *          for (var i = 0; i < list.length; i++) {
     *              if (list[i].getAttribute("length") > 10)
     *                  removeList.push(list[i]);
     *          }
     *          myList.remove(removeList);
     *      }
     *   ]]></a:script>
     * </code>
     * Remarks:
     * Another way to trigger this method is by using the action attribute on a
     * button.
     * <code>
     *  <a:button action="remove" target="myList">Remove item</a:button>
     * </code>
     * Using the action methodology you can let the original data source
     * (usually the server) know that the user removed an item.
     * <code>
     *     <a:list>
     *         <a:bindings />
     *         <a:remove set="remove_product.php?id=[@id]" />
     *     </a:list>
     * </code>
     * For undo this action should be extended and the server should maintain a
     * copy of the deleted item.
     * <code>
     *  <a:list actiontracker="atList">
     *      <a:bindings />
     *      <a:remove set  = "remove_product.php?id=[@id]"
     *                undo = "undo_remove_product.php?id=[@id]" />
     *  </a:list>
     *  <a:button 
     *    action = "remove" 
     *    target = "myList">Remove item</a:button>
     *   <a:button 
     *     caption  = "Undo"
     *     disabled = "{!atList.undolength}" 
     *     onclick  = "atList.undo()" />
     * </code>
     * @action
     * @param  {mixed} [nodeList]  the {@link term.datanode data node}(s) to be removed. If none are specified, the current selection is removed.
     *   Possible values:
     *   {NodeList}   the {@link term.datanode data nodes} to be removed.
     *   {XMLElement} the {@link term.datanode data node} to be removed.
     * @return  {Boolean}  specifies if the removal succeeded
     */
    this.remove = function(nodeList){
        //Use the current selection if no xmlNode is defined
        if (!nodeList)
            nodeList = this.$valueList;

        //If we're an xml node let's convert
        if (nodeList.nodeType)
            nodeList = [nodeList];

        //If there is no selection we'll exit, nothing to do
        if (!nodeList || !nodeList.length)
            return;

        //#ifdef __DEBUG
        //We're not removing the XMLRoot, that would be suicide ;)
        if (nodeList.contains(this.xmlRoot)) {
            throw new Error(apf.formatErrorString(0,
                "Removing nodes",
                "You are trying to delete the xml root of this \
                 element. This is not allowed."));
        }
        //#endif

        var changes = [];
        for (var i = 0; i < nodeList.length; i++) {
            changes.push({
                action : "removeNode",
                args   : [nodeList[i]]
            });
        }

        if (this.$actions["removegroup"])
            return this.$executeAction("multicall", changes, "removegroup", nodeList[0]);
        else {
            return this.$executeAction("multicall", changes, "remove", 
              nodeList[0], null, null, nodeList.length > 1 ? nodeList : null);
        }
    };
    //#endif
    /**
     * Adds an {@link term.datanode data node} to the data of this element.
     * Example:
     * A simple list showing products. This list is used in all following examples.
     * <code>
     *  <a:list id="myList">
     *      <a:bindings>
     *          <a:caption match="[@name]" />
     *          <a:value match="[@id]" />
     *          <a:icon>[@type].png</a:icon>
     *          <a:each match="[product]" />
     *      </a:bindings>
     *      <a:model>
     *          <products>
     *              <product name="Soundblaster" type="audio"    id="product10" />
     *              <product name="Teapot"       type="3d"       id="product13" />
     *              <product name="Coprocessor"  type="chips"    id="product15" />
     *              <product name="Keyboard"     type="input"    id="product17" />
     *              <product name="Diskdrive"    type="storage"  id="product20" />
     *          </products>
     *      </a:model>
     *  </a:list>
     * </code>
     * Example:
     * This example adds a product to this element.
     * selection.
     * <code>
     *  <a:script><![CDATA[
     *      apf.onload = function() {
     *          myList.add('<product name="USB drive" type="storage" />');
     *      }
     *  ]]></a:script>
     * </code>
     * Example:
     * This example copy's the selected product, changes it's name and then
     * adds it. After selecting the new node the user is offered a rename input
     * box.
     * <code>
     *  <a:script><![CDATA[
     *      apf.onload = function() {
     *          var xmlNode = apf.xmldb.copy(myList.selected);
     *          xmlNode.setAttribute("name", "New product");
     *          myList.add(xmlNode);
     *          myList.select(xmlNode);
     *          myList.startRename();
     *      }
     *  ]]></a:script>
     * </code>
     * Remarks:
     * Another way to trigger this method is by using the action attribute on a
     * button.
     * <code>
     *  <a:list>
     *      <a:bindings />
     *      <a:model />
     *      <a:actions>
     *          <a:add>
     *              <product name="New item" />
     *          </a:add>
     *      </a:actions>
     *  </a:list>
     *  <a:button action="add" target="myList">Add new product</a:button>
     * </code>
     * Using the action methodology you can let the original data source
     * (usually the server) know that the user added an item.
     * <code>
     *  <a:add get="{comm.addProduct()}" />
     * </code>
     * For undo this action should be extended as follows.
     * <code>
     *  <a:list id="myList" actiontracker="atList">
     *      <a:bindings />
     *      <a:model />
     *      <a:actions>
     *          <a:add set  = "add_product.php?xml=%[.]"
     *              undo = "remove_product.php?id=[@id]">
     *              <product name="New product" id="productId" />
     *          </a:add>
     *      </a:actions>
     *  </a:list>
     *  <a:button 
     *    action = "add" 
     *    target = "myList">Add new product</a:button>
     *  <a:button
     *     caption  = "Undo"
     *     disabled = "{!atList.undolength}" 
     *     onclick  = "atList.undo()" />
     * </code>
     * In some cases the server needs to create the new product before it's
     * added. This is done as follows.
     * <code>
     *  <a:add get="{comm.createNewProduct()}" />
     * </code>
     * Alternatively the template for the addition can be provided as a child of
     * the action rule.
     * <code>
     *  <a:add set="add_product.php?xml=%[.]">
     *      <product name="USB drive" type="storage" />
     *  </a:add>
     * </code>
     * @action
     * @param  {XMLElement} [xmlNode]    the {@link term.datanode data node} which is added. If none is specified the action will use the action rule to try to retrieve a new node to add.
     * @param  {XMLElement} [pNode]      the parent node of the added {@link term.datanode data node}.
     * @param  {XMLElement} [beforeNode] the position where the xml element should be inserted.
     * @return  {XMLElement} the added {@link term.datanode data node} or false on failure.
     */
    this.add = function(xmlNode, pNode, beforeNode, userCallback){
        var rule;

        if (this.$actions) {
            if (xmlNode && xmlNode.nodeType)
                rule = this.$actions.getRule("add", xmlNode);
            else if (typeof xmlNode == "string") {
                if (xmlNode.trim().charAt(0) == "<") {
                    xmlNode = apf.getXml(xmlNode);
                    rule = this.$actions.getRule("add", xmlNode);
                }
                else {
                    var rules = this.$actions["add"];
                    for (var i = 0, l = rules.length; i < l; i++) {
                        if (rules[i].getAttribute("type") == xmlNode) {
                            xmlNode = null;
                            rule = rules[i];
                            break;
                        }
                    }
                }
            }

            if (!rule) 
                rule = (this.$actions["add"] || {})[0];
        }
        else
            rule = null;
            
        //#ifdef __WITH_OFFLINE
        var bHasOffline = (typeof apf.offline != "undefined");
        if (bHasOffline && !apf.offline.canTransact())
            return false;

        if (bHasOffline && !apf.offline.onLine && (!xmlNode || !rule.get))
            return false;
        //#endif
        
        var refNode  = this.$isTreeArch ? this.selected || this.xmlRoot : this.xmlRoot,
            amlNode  = this,
        callback = function(addXmlNode, state, extra){
            if (state != apf.SUCCESS) {
                var oError;

                oError = new Error(apf.formatErrorString(1032, amlNode,
                    "Loading xml data",
                    "Could not add data for control " + amlNode.name
                    + "[" + amlNode.tagName + "] \nUrl: " + extra.url
                    + "\nInfo: " + extra.message + "\n\n" + xmlNode));

                if (extra.tpModule.retryTimeout(extra, state, amlNode, oError) === true)
                    return true;

                throw oError;
            }

            /*if (apf.supportNamespaces && node.namespaceURI == apf.ns.xhtml) {
                node = apf.getXml(node.xml.replace(/xmlns\=\"[^"]*\"/g, ""));
                //@todo import here for webkit?
            }*/

            if (typeof addXmlNode != "object")
                addXmlNode = apf.getXmlDom(addXmlNode).documentElement;
            if (addXmlNode.getAttribute(apf.xmldb.xmlIdTag))
                addXmlNode.setAttribute(apf.xmldb.xmlIdTag, "");

            var actionNode = amlNode.$actions &&
              amlNode.$actions.getRule("add", amlNode.$isTreeArch
                ? amlNode.selected
                : amlNode.xmlRoot);
            if (!pNode) {
                if (actionNode && actionNode.parent) {
                    pNode = (actionNode.cparent 
                      || actionNode.compile("parent", {
                        xpathmode  : 2, 
                        injectself : true
                      }))(amlNode.$isTreeArch
                          ? amlNode.selected || amlNode.xmlRoot
                          : amlNode.xmlRoot);
                }
                else {
                    pNode = amlNode.$isTreeArch
                      ? amlNode.selected || amlNode.xmlRoot
                      : amlNode.xmlRoot
                }
            }

            if (!pNode)
                pNode = amlNode.xmlRoot;

            //Safari issue not auto importing nodes:
            if (apf.isWebkit && pNode.ownerDocument != addXmlNode.ownerDocument)
                addXmlNode = pNode.ownerDocument.importNode(addXmlNode, true); 

            //#ifdef __DEBUG
            if (!pNode) {
                throw new Error(apf.formatErrorString(0, amlNode,
                    "Executing add action",
                    "Missing parent node. You can only add nodes to a list if it\
                     has data loaded. Unable to perform action."));
            }
            //#endif

            if (amlNode.$executeAction("appendChild",
              [pNode, addXmlNode, beforeNode], "add", addXmlNode) !== false
              && amlNode.autoselect)
                amlNode.select(addXmlNode);

            if (userCallback)
                userCallback.call(amlNode, addXmlNode);

            return addXmlNode;
        };

        if (xmlNode)
            return callback(xmlNode, apf.SUCCESS);
        else {
            if (rule.get)
                return apf.getData(rule.get, {xmlNode: refNode, callback: callback})
            else {
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, this,
                    "Executing add action",
                    "Missing add action defined in action rules. Unable to \
                     perform action."));
                //#endif
            }
        }

        return addXmlNode;
    };

    if (!this.setValue) {
        /**
         * Sets the value of this element.The value
         * corresponds to an item in the list of loaded {@link term.datanode data nodes}. This
         * element will receive the selection. If no {@link term.datanode data node} is found, the
         * selection is cleared.
         *
         * @param  {String}  value  the new value for this element.
         * @param  {Boolean} disable_event
         * @see baseclass.multiselect.method.getValue
         */
        this.setValue = function(value, disable_event){
            // @todo apf3.0 what does noEvent do? in this scope it's useless and
            // doesn't improve codeflow with a global lookup and assignment
            noEvent = disable_event;
            this.setProperty("value", value, false, true);
            noEvent = false;
        };
    }

    /**
     * Retrieves an {@link term.datanode data node} that has a value that corresponds to the
     * string that is searched on.
     * @param {String} value the value to match.
     */
    this.findXmlNodeByValue = function(value){
        var nodes   = this.getTraverseNodes(),
            bindSet = this.$attrBindings["eachvalue"]
                && "eachvalue" || this.$bindings["value"]
                && "value" || this.$hasBindRule("caption") && "caption";
        
        if (!bindSet)
            return false;
            
        for (var i = 0; i < nodes.length; i++) {
            if (this.$applyBindRule(bindSet, nodes[i]) == value)
                return nodes[i];
        }
    };

    if (!this.getValue) {
        /**
         * Retrieves the value of this element. This is the value of the
         * first selected {@link term.datanode data node}.
         * @see #setValue
         */
        this.getValue = function(xmlNode, noError){
            return this.value;
            /*
            if (!this.bindingRules && !this.caption) 
                return false;

            // #ifdef __DEBUG
            if (!this.caption && !this.bindingRules[this.$mainBind] && !this.bindingRules["caption"]) {
                if (noError)
                    return false;
                
                throw new Error(apf.formatErrorString(1074, this,
                    "Retrieving the value of this component.",
                    "No value rule has been defined. There is no way \
                     to determine the value of the selected item."));
            }
            // #endif

            return this.$applyBindRule(this.$mainBind, xmlNode || this.selected, null, true)
                || this.$applyBindRule("caption", xmlNode || this.selected, null, true);
            */
        };
    }

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
     * Selects a single, or set of {@link term.eachnode each nodes}.
     * The selection can be visually represented in this element.
     *
     * @param {mixed}   xmlNode      the identifier to determine the selection.
     *   Possible values:
     *   {XMLElement}  the {@link term.datanode data node} to be used in the selection as a start/end point or to toggle the selection on the node.
     *   {HTMLElement} the html element node used as visual representation of {@link term.datanode data node}. Used to determine the {@link term.datanode data node} for selection.
     *   {String}      the value of the {@link term.datanode data node} to be select.
     * @param {Boolean} [ctrlKey]    whether the Ctrl key was pressed
     * @param {Boolean} [shiftKey]   whether the Shift key was pressed
     * @param {Boolean} [fakeselect] whether only visually a selection is made
     * @param {Boolean} [force]      whether reselect is forced.
     * @param {Boolean} [noEvent]    whether to not call any events
     * @return  {Boolean}  whether the selection could be made
     *
     * @event  beforeselect  Fires before a {@link baseclass.multiselect.method.select selection} is made
     *   object:
     *   {XMLElement}  selected the {@link term.datanode data node} that will be selected.
     *   {Array}       selection an array of {@link term.datanode data node} that will be selected.
     *   {HTMLElement} htmlNode the html element that visually represents the {@link term.datanode data node}.
     * @event  afterselect  Fires after a {@link baseclass.multiselect.method.select selection} is made
     *   object:
     *   {XMLElement}  selected  the {@link term.datanode data node} that was selected.
     *   {Array}       selection an array of {@link term.datanode data node} that are selected.
     *   {HTMLElement} htmlNode the html element that visually represents the {@link term.datanode data node}.
     */
    this.select  = function(xmlNode, ctrlKey, shiftKey, fakeselect, force, noEvent, userAction){
        if (!this.selectable || userAction && this.disabled) 
            return;

        if (parseInt(fakeselect) == fakeselect) {
            //Don't select on context menu
            if (fakeselect == 2) {
                fakeselect = true;
    	      	userAction = true;
            }
            else {
    	      	fakeselect = false;
    	      	userAction = true;
    	    }
        }

        if (this.$skipSelect) {
            this.$skipSelect = false;
            return;
        }

        if (this.ctrlselect && !shiftKey)
            ctrlKey = true;

        if (!this.multiselect)
            ctrlKey = shiftKey = false;
        
        // Selection buffering (for async compatibility)
        if (!this.xmlRoot) {
            if (!this.$buffered) {
                var f;
                this.addEventListener("afterload", f = function(){
                    this.select.apply(this, this.$buffered);
                    this.removeEventListener("afterload", f);
                    delete this.$buffered;
                });
            }

            this.$buffered = Array.prototype.slice.call(arguments);
            return;
        }

        var htmlNode;

        /**** Type Detection ****/
        if (!xmlNode) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(1075, this,
                "Making a selection",
                "No selection was specified"))
            //#endif

            return false;
        }

        if (typeof xmlNode != "object") {
            var str = xmlNode; xmlNode = null;
            if (typeof xmlNode == "string")
                xmlNode = apf.xmldb.getNodeById(str);

            //Select based on the value of the xml node
            if (!xmlNode) {
                xmlNode = this.findXmlNodeByValue(str);
                if (!xmlNode) {
                    this.clearSelection(noEvent);
                    return;
                }
            }
        }
        
        if (!(typeof (xmlNode.style || "") == "object")) {
            htmlNode = this.$findHtmlNode(xmlNode.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);
        }
        else {
            var id = (htmlNode = xmlNode).getAttribute(apf.xmldb.htmlIdTag);
            while (!id && htmlNode.parentNode)
                id = (htmlNode = htmlNode.parentNode).getAttribute(
                    apf.xmldb.htmlIdTag);

            xmlNode = apf.xmldb.getNodeById(id);//, this.xmlRoot);
        }

        if (!shiftKey && !ctrlKey && !force && !this.reselectable 
          && this.$valueList.length <= 1 && this.$valueList.indexOf(xmlNode) > -1)
            return;

        if (this.dispatchEvent('beforeselect', {
            selected    : xmlNode,
            htmlNode    : htmlNode,
            ctrlKey     : ctrlKey,
            shiftKey    : shiftKey,
            force       : force,
            captureOnly : noEvent
        }) === false)
              return false;

        /**** Selection ****/

        var lastIndicator = this.caret;
        this.caret        = xmlNode;

        //Multiselect with SHIFT Key.
        if (shiftKey) {
            var range = this.$calcSelectRange(
              this.$valueList[0] || lastIndicator, xmlNode);

            if (this.$caret)
                this.$deindicate(this.$caret);

            this.selectList(range);

            this.$selected  =
            this.$caret     = this.$indicate(htmlNode);
        }
        else if (ctrlKey) { //Multiselect with CTRL Key.
            //Node will be unselected
            if (this.$valueList.contains(xmlNode)) {
                if (this.selected == xmlNode) {
                    this.$deselect(this.$findHtmlNode(this.selected.getAttribute(
                        apf.xmldb.xmlIdTag) + "|" + this.$uniqueId));
                    
                    this.$deindicate(this.$caret);

                    if (this.$valueList.length && !fakeselect) {
                        //this.$selected = this.$selectedList[0];
                        this.selected = this.$valueList[0];
                    }
                }
                else
                    this.$deselect(htmlNode, xmlNode);

                if (!fakeselect) {
                    this.$selectedList.remove(htmlNode);
                    this.$valueList.remove(xmlNode);
                }

                if (htmlNode != this.$caret)
                    this.$deindicate(this.$caret);

                this.$selected  =
                this.$caret     = this.$indicate(htmlNode);
            }
            // Node will be selected
            else {
                if (this.$caret)
                    this.$deindicate(this.$caret);
                this.$caret = this.$indicate(htmlNode, xmlNode);

                this.$selected   = this.$select(htmlNode, xmlNode);
                this.selected    = xmlNode;

                if (!fakeselect) {
                    this.$selectedList.push(htmlNode);
                    this.$valueList.push(xmlNode);
                }
            }
        }
        else if (fakeselect && htmlNode && this.$selectedList.contains(htmlNode)) {//Return if selected Node is htmlNode during a fake select
            return;
        }
        else { //Normal Selection
            //htmlNode && this.$selected == htmlNode && this.$valueList.length <= 1 && this.$selectedList.contains(htmlNode)
            if (this.$selected)
                this.$deselect(this.$selected);
            if (this.$caret)
                this.$deindicate(this.$caret);
            if (this.selected)
                this.clearSelection(true);

            this.$caret = this.$indicate(htmlNode, xmlNode);
            this.$selected  = this.$select(htmlNode, xmlNode);
            this.selected   = xmlNode;

            this.$selectedList.push(htmlNode);
            this.$valueList.push(xmlNode);
        }

        if (this.delayedselect && (typeof ctrlKey == "boolean")){
            var _self = this;
            $setTimeout(function(){
                if (_self.selected == xmlNode)
                    _self.dispatchEvent("afterselect", {
                        selection   : _self.$valueList,
                        selected    : xmlNode,
                        caret       : _self.caret,
                        captureOnly : noEvent
                    });
            }, 10);
        }
        else {
            this.dispatchEvent("afterselect", {
                selection   : this.$valueList,
                selected    : xmlNode,
                caret       : this.caret,
                captureOnly : noEvent
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
     *   {XMLElement}  the {@link term.datanode data node} to be choosen.
     *   {HTMLElement} the html element node used as visual representation of {@link term.datanode data node}. Used to determine the {@link term.datanode data node}.
     *   {String}      the value of the {@link term.datanode data node} to be choosen.
     * @event  beforechoose  Fires before a choice is made.
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that was choosen.
     * @event  afterchoose   Fires after a choice is made.
     *   object:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that was choosen.
     */
    this.choose = function(xmlNode, userAction){
        if (!this.selectable || userAction && this.disabled) return;

        if (this.dispatchEvent("beforechoose", {xmlNode : xmlNode}) === false)
            return false;

        if (xmlNode && !(typeof (xmlNode.style || "") == "object"))
            this.select(xmlNode);

        //#ifdef __WITH_PROPERTY_BINDING
        if (this.hasFeature(apf.__DATABINDING__)
          && this.dispatchEvent("afterchoose", {xmlNode : this.selected}) !== false)
            this.setProperty("chosen", this.selected);
        //#endif
    };

    /**
     * Removes the selection of one or more selected nodes.
     *
     * @param {Boolean} [singleNode] whether to only deselect the indicated node
     * @param {Boolean} [noEvent]    whether to not call any events
     */
    this.clearSelection = function(noEvent, userAction){
        if (!this.selectable || userAction && this.disabled || !this.$valueList.length)
            return;

        if (!noEvent) {
            if (this.dispatchEvent("beforeselect", {
                selection : [],
                selected  : null,
                caret     : this.caret
            }) === false)
                return false;
        }
        
        //Deselect html nodes
        var htmlNode;
        for (var i = this.$valueList.length - 1; i >= 0; i--) {
            htmlNode = this.$findHtmlNode(this.$valueList[i].getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);
            this.$deselect(htmlNode);
        }
        
        //Reset internal variables
        this.$selectedList.length = 0;
        this.$valueList.length    = 0;
        this.$selected            =
        this.selected             = null;

        //Redraw indicator
        if (this.caret) {
            htmlNode = this.$findHtmlNode(this.caret.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);

            this.$caret = this.$indicate(htmlNode);
        }

        if (!noEvent) {
            this.dispatchEvent("afterselect", {
                selection : this.$valueList,
                selected  : null,
                caret     : this.caret
            });
        }
    };

    /**
     * Selects a set of items
     *
     * @param {Array} xmlNodeList the {@link term.datanode data nodes} that will be selected.
     */
    //@todo I think there are missing events here?
    this.selectList = function(xmlNodeList, noEvent, selected, userAction){
        if (!this.selectable || userAction && this.disabled) return;

        if (this.dispatchEvent("beforeselect", {
            selection   : xmlNodeList,
            selected    : selected || xmlNodeList[0],
            caret       : this.caret,
            captureOnly : noEvent
          }) === false)
            return false;

        this.clearSelection(true);

        for (var sel, i = 0; i < xmlNodeList.length; i++) {
            //@todo fix select state in unserialize after removing
            if (!xmlNodeList[i] || xmlNodeList[i].nodeType != 1) continue;
            var htmlNode,
                xmlNode = xmlNodeList[i];

            //Type Detection
            if (typeof xmlNode != "object")
                xmlNode = apf.xmldb.getNodeById(xmlNode);
            if (!(typeof (xmlNode.style || "") == "object"))
                htmlNode = this.$pHtmlDoc.getElementById(xmlNode.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);
            else {
                htmlNode = xmlNode;
                xmlNode  = apf.xmldb.getNodeById(htmlNode.getAttribute(
                    apf.xmldb.htmlIdTag));
            }

            if (!xmlNode) {
                // #ifdef __DEBUG
                apf.console.warn("Component : " + this.name + " ["
                    + this.localName + "]\nMessage : xmlNode whilst selecting a "
                    + "list of xmlNodes could not be found. Ignoring.")
                // #endif
                continue;
            }

            //Select Node
            if (htmlNode) {
                if (!sel && selected == htmlNode)
                    sel = htmlNode;

                this.$select(htmlNode, xmlNode);
                this.$selectedList.push(htmlNode);
            }
            this.$valueList.push(xmlNode);
        }

        this.$selected = sel || this.$selectedList[0];
        this.selected  = selected || this.$valueList[0];

        this.dispatchEvent("afterselect", {
            selection   : this.$valueList,
            selected    : this.selected,
            caret       : this.caret,
            captureOnly : noEvent
        });
    };

    /**
     * Sets the {@link term.caret caret} on an item to indicate to the user that the keyboard
     * actions are done relevant to that item. Using the keyboard
     * a user can change the position of the indicator using the Ctrl and arrow
     * keys while not making a selection. When making a selection with the mouse
     * or keyboard the indicator is always set to the selected node. Unlike a
     * selection there can be only one indicator item.
     *
     * @param {mixed}   xmlNode      the identifier to determine the indicator.
     *   Possible values:
     *   {XMLElement}  the {@link term.datanode data node} to be set as indicator.
     *   {HTMLElement} the html element node used as visual representation of
     *                 {@link term.datanode data node}. Used to determine the {@link term.datanode data node}.
     *   {String}      the value of the {@link term.datanode data node} to be set as indicator.
     * @event indicate Fires when an item becomes the indicator.
     */
    this.setCaret = function(xmlNode){
        if (!xmlNode) {
            if (this.$caret)
                this.$deindicate(this.$caret);
            this.caret  =
            this.$caret = null;
            return;
        }

        /**** Type Detection ****/
        var htmlNode;
        if (typeof xmlNode != "object")
            xmlNode = apf.xmldb.getNodeById(xmlNode);
        if (!(typeof (xmlNode.style || "") == "object")) {
            htmlNode = this.$findHtmlNode(xmlNode.getAttribute(
                    apf.xmldb.xmlIdTag) + "|" + this.$uniqueId);
        }
        else {
            var id = (htmlNode = xmlNode).getAttribute(apf.xmldb.htmlIdTag);
            while (!id && htmlNode.parentNode && htmlNode.parentNode.nodeType == 1)
                id = (htmlNode = htmlNode.parentNode).getAttribute(
                    apf.xmldb.htmlIdTag);
            if (!id) alert(this.$int.outerHTML);

            xmlNode = apf.xmldb.getNodeById(id);
        }

        if (this.$caret) {
            //this.$deindicate(this.$findHtmlNode(this.caret.getAttribute(
                //apf.xmldb.xmlIdTag) + "|" + this.$uniqueId));
            this.$deindicate(this.$caret);
        }
        
        this.$caret = this.$indicate(htmlNode);
        this.setProperty("caret", this.caret = xmlNode);
    };

    /**
     * @private
     */
    this.$setTempSelected = function(xmlNode, ctrlKey, shiftKey, down){
        clearTimeout(this.timer);

        if (this.$bindings.selectable) {
            while (xmlNode && !this.$getDataNode("selectable", xmlNode)) {
                xmlNode = this.getNextTraverseSelected(xmlNode, !down);
            }
            if (!xmlNode) return;
        }

        if (!this.multiselect)
            ctrlKey = shiftKey = false;

        if (ctrlKey || this.ctrlselect) {
            if (this.$tempsel) {
                this.select(this.$tempsel);
                this.$tempsel = null;
            }

            this.setCaret(xmlNode);
        }
        else if (shiftKey){
            if (this.$tempsel) {
                this.$selectTemp();
                this.$deselect(this.$tempsel);
                this.$tempsel = null;
            }

            this.select(xmlNode, null, shiftKey);
        }
        else if (!this.bufferselect || this.$valueList.length > 1) {
            this.select(xmlNode);
        }
        else {
            var id = apf.xmldb.getID(xmlNode, this);

            this.$deselect(this.$tempsel || this.$selected);
            this.$deindicate(this.$tempsel || this.$caret);
            this.$tempsel = this.$indicate(document.getElementById(id));
            this.$select(this.$tempsel);

            var _self = this;
            this.timer = $setTimeout(function(){
                _self.$selectTemp();
            }, 400);
        }
    };

    /**
     * @private
     */
    this.$selectTemp = function(){
        if (!this.$tempsel)
            return;

        clearTimeout(this.timer);
        this.select(this.$tempsel);

        this.$tempsel = null;
        this.timer    = null;
    };

    /**
     * Selects all the {@link term.eachnode each nodes} of this element
     *
     */
    this.selectAll = function(userAction){
        if (!this.multiselect || !this.selectable
          || userAction && this.disabled || !this.xmlRoot)
            return;

        var nodes = this.$isTreeArch
            ? this.xmlRoot.selectNodes(".//" 
              + this.each.split("|").join("|.//"))
            : this.xmlRoot.selectNodes(this.each);
        
        this.selectList(nodes);
    };

    /**
     * Retrieves an array or a document fragment containing all the selected
     * {@link term.datanode data nodes} from this element.
     *
     * @param {Boolean} [xmldoc] whether the method should return a document fragment.
     * @return {mixed} the selection of this element.
     */
    this.getSelection = function(xmldoc){
        var i, r;
        if (xmldoc) {
            r = this.xmlRoot
                ? this.xmlRoot.ownerDocument.createDocumentFragment()
                : apf.getXmlDom().createDocumentFragment();
            for (i = 0; i < this.$valueList.length; i++)
                apf.xmldb.cleanNode(r.appendChild(
                    this.$valueList[i].cloneNode(true)));
        }
        else {
            for (r = [], i = 0; i < this.$valueList.length; i++)
                r.push(this.$valueList[i]);
        }

        return r;
    };
    
    this.$getSelection = function(htmlNodes){
        return htmlNodes ? this.$selectedList : this.$valueList;
    };

    /**
     * Selects the next {@link term.datanode data node} to be selected.
     *
     * @param  {XMLElement}  xmlNode  the context {@link term.datanode data node}.
     * @param  {Boolean}     isTree
     */
    this.defaultSelectNext = function(xmlNode, isTree){
        var next = this.getNextTraverseSelected(xmlNode);
        //if(!next && xmlNode == this.xmlRoot) return;

        //Why not use this.$isTreeArch ??
        if (next || !isTree)
            this.select(next ? next : this.getTraverseParent(xmlNode));
        else
            this.clearSelection(true);
    };

    /**
     * Selects the next {@link term.datanode data node} when available.
     */
    this.selectNext = function(){
        var xmlNode = this.getNextTraverse();
        if (xmlNode)
            this.select(xmlNode);
    };

    /**
     * Selects the previous {@link term.datanode data node} when available.
     */
    this.selectPrevious = function(){
        var xmlNode = this.getNextTraverse(null, -1);
        if (xmlNode)
            this.select(xmlNode);
    };

    /**
     * @private
     */
    this.getDefaultNext = function(xmlNode, isTree){  //@todo why is isTree an argument
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
     * @param  {XMLElement} xmlNode  The {@link term.datanode data node} to be checked.
     * @return  {Boolean} whether the element is selected.
     */
    this.isSelected = function(xmlNode){
        if (!xmlNode) return false;

        for (var i = 0; i < this.$valueList.length; i++) {
            if (this.$valueList[i] == xmlNode)
                return this.$valueList.length;
        }

        return false;
    };

    /**
     * This function checks whether the current selection is still correct.
     * Selection can become invalid when updates to the underlying data
     * happen. For instance when a selected node is removed.
     */
    this.$checkSelection = function(nextNode){
        if (this.$valueList.length > 1) {
            //Fix selection if needed
            for (var lst = [], i = 0, l = this.$valueList.length; i < l; i++) {
                if (apf.isChildOf(this.xmlRoot, this.$valueList[i]))
                    lst.push(this.$valueList[i]);
            }

            if (lst.length > 1) {
                this.selectList(lst);
                if(this.caret
                  && !apf.isChildOf(this.xmlRoot, this.caret)) {
                    this.setCaret(nextNode || this.selected);
                }
                return;
            }
            else if (lst.length) {
                //this.clearSelection(true); //@todo noEvents here??
                nextNode = lst[0];
            }
        }

        if (!nextNode) {
            if (this.selected
              && !apf.isChildOf(this.xmlRoot, this.selected)) {
                nextNode = this.getFirstTraverseNode();
            }
            else if(this.selected && this.caret
              && !apf.isChildOf(this.xmlRoot, this.caret)) {
                this.setCaret(this.selected);
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
                this.clearSelection();
                this.setCaret(nextNode);
            }
        }
        else
            this.clearSelection();

        //if(action == "synchronize" && this.autoselect) this.reselect();
    };

    /**
     * @attribute {Boolean} [multiselect]   whether the user may select multiple items. Default is true, false for dropdown. 
     * @attribute {Boolean} [autoselect]    whether a selection is made after data is loaded. Default is true, false for dropdown. When the string 'all' is set, all {@link term.datanode data nodes} are selected.
     * @attribute {Boolean} [selectable]    whether the {@link term.datanode data nodes} of this element can be selected. Default is true.
     * @attribute {Boolean} [ctrlselect]    whether when a selection is made as if the user is holding the Ctrl key. When set to true each mouse selection will add to the current selection. selecting an already selected element will deselect it.
     * @attribute {Boolean} [allowdeselect] whether the user can remove the selection of this element. When set to true it is possible for this element to have no selected {@link term.datanode data node}.
     * @attribute {Boolean} [reselectable]  whether selected nodes can be selected again and the selection events are called again. Default is false. When set to false a selected {@link term.datanode data node} cannot be selected again.
     * @attribute {String}  [default]       the value that this component has when no selection is made.
     * @attribute {String}  [eachvalue]     the {@link term.expression expression} that determines the value for each {@link term.datanode data nodes} in the dataset of the element.
     * Remarks:
     * 
     * Example:
     *
     * @see baseclass.multiselect.attribute.eachvalue
     */
    this.selectable = true;
    if (typeof this.ctrlselect == "undefined")
        this.ctrlselect = false;
    if (typeof this.multiselect == "undefined")
        this.multiselect = true;
    if (typeof this.autoselect == "undefined")
        this.autoselect = true;
    if (typeof this.delayedselect == "undefined")
        this.delayedselect = true;
    if (typeof this.allowdeselect == "undefined")
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
        "autoselect", "delayedselect", "allowdeselect", "reselectable", 
        "selection", "selected", "default", "value", "caret");

    /**
     * @attribute {String} [value]   the value of the element that is selected.
     * Remarks:
     * 
     * Example:
     *
     * @see baseclass.multiselect.attribute.eachvalue
     */
    //@todo add check here
    this.$propHandlers["value"] = function(value){
        if (this.$lastValue == value) {
            delete this.$lastValue;
            return;
        }

        if (!this.$attrBindings["eachvalue"] && !this.$amlLoaded
          && this.getAttribute("eachvalue")) {
            var _self = this;
            return apf.queue.add("value" + this.$uniqueId, function(){
                _self.$propHandlers["value"].call(_self, value);
            });
        }
        
        //#ifdef __DEBUG
        var rule = this.$getBindRule("value", this.xmlRoot);
        if (rule) {
            /*var compiled = rule.cvalue || rule.cmatch;
            if (compiled.type != 3) {
                throw new Error(apf.formatErrorString(0,
                    "Setting value attribute",
                    "Value attribute does not have legal value."));
            }*/

            if (rule.models[0] == this.$model && rule.cvalue.xpaths[0] != "#") {
                throw new Error(apf.formatErrorString(0, this,
                    "Setting value attribute",
                    "Value should not point to the same model where the items\
                     are loaded from. Please use value=\"[mdlName::xpath]\" to\
                     specify the value. Use selected=\"[xpath]\" to just select\
                     a node without making a databinding to it."));
            }
        }
        //#endif

        if (value || value === 0 || this["default"])
            this.select(String(value) || this["default"]);
        else
            this.clearSelection();
    }
    
    this.$propHandlers["default"] = function(value, prop){
        if (!this.value || !this.$amlLoaded && !(this.getAttribute("value") 
          || this.getAttribute("selected") || this.getAttribute("selection"))) {
            this.$propHandlers["value"].call(this, "");
        }
    }
    
    /**
     * @attribute {String} [value]   the value of the element that is selected.
     * Remarks:
     * 
     * Example:
     *
     * @see baseclass.multiselect.attribute.selected, baseclass.multiselect.attribute.selection
     */
    //@todo fill this in
    this.$propHandlers["caret"] = function(value, prop){
        if (value)
            this.setCaret(value);
    }
    
    //#ifdef __WITH_SELECTION_BINDING
    
    //@todo optimize this thing. Also implement virtual dataset support.
    /**
     * @attribute {String} [selection]   the {@link term.expression expression} that determines the selection for this element. A reference to an xml nodelist can be passed as well.
     * Remarks:
     * 
     * Example:
     *
     * @see baseclass.multiselect.attribute.selected, baseclass.multiselect.attribute.selection
     */
    this.$propHandlers["selection"] = 
    
    /**
     * @attribute {String} [selected]   the {@link term.expression expression} that determines the selected node for this element. A reference to an xml element can be passed as well.
     * Remarks:
     * 
     * Example:
     *
     * @see baseclass.multiselect.attribute.selected, baseclass.multiselect.attribute.selection
     */
    this.$propHandlers["selected"] = function(value, prop) {
        if (!value) value = this[prop] = null;

        if (prop == "selected" && typeof value != "string") { // && value == this.selected
            if (value && value.nodeType != 1)
                value = value.nodeValue;
            else
            //this.selected = null; //I don't remember why this is here. It removes the selected property without setting it again. (dropdown test)
                return;
        }
        
        //#ifdef __DEBUG
        if (prop == "selection" && (this.getAttribute("selection") || "*").substr(0, 1) != "*"){
            apf.console.warn("Selection attribute (" + this.getAttributeNode("selection") 
                + ") should select multiple nodes. Please prefix xpath query with a * (ex.: *[item]).");
        }
        //#endif

        if (this.$isSelecting) {
            this.selection = this.$valueList;
            return false;
        }

        var nodes, bindSet, getValue, i, j, c, d;
        //Update the selection
        if (prop == "selection") {
            if (typeof value == "object" && value == this.$valueList) {
                var pNode;
                //We're using an external model. Need to update bound nodeset
                if ((c = this.$attrBindings[prop]) && c.cvalue.models) { //added check, @todo whats up with above assumption?
                    this.$isSelecting = true; //Prevent reentrance (optimization)
    
                    bindSet = this.$attrBindings["eachvalue"] 
                        && "eachvalue" || this.$bindings["value"]
                        && "value" || this.$hasBindRule("caption") && "caption";
                    
                    if (!bindSet)
                        throw new Error("Missing bind rule set: eachvalue, value or caption");//@todo apf3.0 make this into a proper error
                    
                    //@todo this may be optimized by keeping a copy of the selection
                    var selNodes = this.$getDataNode(prop, this.xmlRoot);
                    nodes        = value;
                    getValue     = (d = this.$attrBindings["selection-unique"]) && d.cvalue;
                    
                    if (selNodes.length) {
                        pNode = selNodes[0].parentNode;
                    }
                    else {
                        var model, path;
                        if (c.cvalue.xpaths[0] == "#" || c.cvalue.xpaths[1] == "#") {
                            var m = (c.cvalue3 || (c.cvalue3 = apf.lm.compile(c.value, {
                                xpathmode: 5
                            })))(this.xmlRoot);
                            
                            model = m.model && m.model.$isModel && m.model;
                            if (model)
                                path = m.xpath;
                            else if (m.model) {
                                model = apf.xmldb.findModel(m.model);
                                path = apf.xmlToXpath(m.model, model.data) + (m.xpath ? "/" + m.xpath : ""); //@todo make this better
                            }
                            else {
                                //No selection - nothing to do
                            }
                        }
                        else {
                            //#ifdef __WITH_NAMESERVER
                            model = apf.nameserver.get("model", c.cvalue.xpaths[0]);
                            //#endif
                            path  = c.cvalue.xpaths[1];
                        }

                        if (!model || !model.data) {
                            this.$isSelecting = false;
                            return false;
                        }
                        
                        pNode = model.queryNode(path.replace(/\/[^\/]+$|^[^\/]*$/, "") || ".");

                        if (!pNode)
                            throw new Error("Missing parent node"); //@todo apf3.0 make this into a proper error
                    }
                    
                    //Nodes removed
                    remove_loop:
                    for (i = 0; i < selNodes.length; i++) {
                        //Value is either determined by special property or in the 
                        //same way as the value for the bound node.
                        value = getValue 
                          ? getValue(selNodes[i]) 
                          : this.$applyBindRule(bindSet, selNodes[i]);
    
                        //Compare the value with the traverse nodes
                        for (j = 0; j < nodes.length; j++) {
                            if (this.$applyBindRule(bindSet, nodes[j]) == value) //@todo this could be cached
                                continue remove_loop;
                        }
                        
                        //remove node
                        apf.xmldb.removeNode(selNodes[i]);
                    }
                    
                    //Nodes added
                    add_loop:
                    for (i = 0; i < nodes.length; i++) {
                        //Value is either determined by special property or in the 
                        //same way as the value for the bound node.
                        value = this.$applyBindRule(bindSet, nodes[i]);
    
                        //Compare the value with the traverse nodes
                        for (j = 0; j < selNodes.length; j++) {
                            if (getValue 
                              ? getValue(selNodes[j]) 
                              : this.$applyBindRule(bindSet, selNodes[j]) == value) //@todo this could be cached
                                continue add_loop;
                        }
                        
                        //add node
                        var node = this.$attrBindings["selection-constructor"] 
                          && this.$getDataNode("selection-constructor", nodes[i])
                          || apf.getCleanCopy(nodes[i]);
                        apf.xmldb.appendChild(pNode, node);
                    }
                    
                    //@todo above changes should be via the actiontracker
                    this.$isSelecting = false;
                }
                
                return;
            }
            this.selection = this.$valueList;
        }
        else {
            this.selected = null;
        }
        
        if (!this.xmlRoot) {
            if (!this.$buffered) {
                var f;
                this.addEventListener("afterload", f = function(){
                    this.removeEventListener("afterload", f);
                    this.$propHandlers["selected"].call(this, value, prop);
                    delete this.$buffered;
                });
                this.$buffered = true;
            }
            this[prop] = null;
            return false;
        }

        if (!value || typeof value != "object") {
            //this[prop] = null;

            if (this.$attrBindings[prop]) {
                //Execute the selection query
                nodes = this.$getDataNode(prop, this.xmlRoot);
                if (nodes && (nodes.length || nodes.nodeType == 1)) {
                    this.setProperty("selection", nodes);
                    return;
                }
                
                if (!nodes || nodes.length === 0)
                    return;
                
                //Current model, it's an init selection, we'll clear the bind
                /*if (typeof value == "string" 
                  && !this.$attrBindings[prop].cvalue.xpaths[0]) {
                    this.$removeAttrBind(prop);
                }*/
            }
            
            if (!value) {
                this.clearSelection();
            }
            else {
                this.select(value);
            }

            return false; //Disable signalling the listeners to this property
        }
        else if (typeof value.length == "number") {
            nodes = value;
            if (!nodes.length) {
                this.selected = null;
                if (this.$valueList.length) { //dont clear selection when no selection exists (at prop init)
                    this.clearSelection();
                    return false; //Disable signalling the listeners to this property
                }
                else return;
            }
            
            //For when nodes are traverse nodes of this element
            if (this.isTraverseNode(nodes[0]) 
              && apf.isChildOf(this.xmlRoot, nodes[0])) {
                if (!this.multiselect) {
                    this.select(nodes[0]);
                }
                else {
                    //this[prop] = null; //??
                    this.selectList(nodes);
                }
                return false; //Disable signalling the listeners to this property
            }
            
            //if external model defined, loop through items and find mate by value
            if (this.$attrBindings[prop]) { //Can assume an external model is in place
                bindSet = this.$attrBindings["eachvalue"] 
                    && "eachvalue" || this.$bindings["value"]
                    && "value" || this.$hasBindRule("caption") && "caption";
                
                if (!bindSet)
                    throw new Error("Missing bind rule set: eachvalue, value or caption");//@todo apf3.0 make this into a proper error
                
                var tNodes = !this.each 
                    ? this.getTraverseNodes()
                    : this.xmlRoot.selectNodes("//" + this.each.split("|").join("|//"));
                
                getValue = (c = this.$attrBindings["selection-unique"]) && c.cvalue;
                var selList  = [];
                for (i = 0; i < nodes.length; i++) {
                    //Value is either determined by special property or in the 
                    //same way as the value for the bound node.
                    value = getValue 
                        ? getValue(nodes[i]) 
                        : this.$applyBindRule(bindSet, nodes[i]);

                    //Compare the value with the traverse nodes
                    for (j = 0; j < tNodes.length; j++) {
                        if (this.$applyBindRule(bindSet, tNodes[j]) == value) //@todo this could be cached
                            selList.push(tNodes[j]);
                    }
                }
                
                //this[prop] = null; //???
                this.selectList(selList, true); //@todo noEvent to distinguish between user actions and not user actions... need to rethink this
                return false;
            }
            
            throw new Error("Show me which case this is");
        }
        else if (this.$valueList.indexOf(value) == -1) {
            //this.selected = null;
            this.select(value);
        }
    };
    
    //#endif
    
    this.$propHandlers["allowdeselect"] = function(value){
        if (value) {
            var _self = this;
            this.$container.onmousedown = function(e){
                if (!e)
                    e = event;
                if (e.ctrlKey || e.shiftKey)
                    return;

                var srcElement = e.srcElement || e.target;
                if (_self.allowdeselect && (srcElement == this
                  || srcElement.getAttribute(apf.xmldb.htmlIdTag)))
                    _self.clearSelection(); //hacky
            }
        }
        else {
            this.$container.onmousedown = null;
        }
    };

    this.$propHandlers["ctrlselect"] = function(value){
        if (value != "enter")
            this.ctrlselect = apf.isTrue(value);
    }

    function fAutoselect(){
        this.selectAll();
    }
    
    this.$propHandlers["autoselect"] = function(value){
        if (value == "all" && this.multiselect)
            this.addEventListener("afterload", fAutoselect);
        else
            this.removeEventListener("afterload", fAutoselect);
    };

    this.$propHandlers["multiselect"] = function(value){
        if (!value && this.$valueList.length > 1)
            this.select(this.selected);

        //if (value)
            //this.bufferselect = false; //@todo doesn't return to original value
    };

    // Select Bind class
    // #ifdef __WITH_DATABINDING
    this.addEventListener("beforeselect", function(e){
        if (this.$bindings.selectable && !this.$getDataNode("selectable", e.selected))
            return false;
    }, true);
    // #endif

    // #ifdef __WITH_PROPERTY_BINDING || __WITH_OFFLINE_STATE
    this.addEventListener("afterselect", function (e){
        //#ifdef __WITH_PROPERTY_BINDING
        var combinedvalue = null;

        //#ifdef __WITH_MULTISELECT_COLLAPSE
        //@todo refactor below
        /*if (this.caret == this.selected || e.list && e.list.length > 1 && hasConnections) {
            //Multiselect databinding handling... [experimental]
            if (e.list && e.list.length > 1 && this.$getConnections().length) { //@todo this no work no more apf3.0
                var oEl  = this.xmlRoot.ownerDocument.createElement(this.selected.tagName);
                var attr = {};

                //Fill basic nodes
                var nodes = e.list[0].attributes;
                for (var j = 0; j < nodes.length; j++)
                    attr[nodes[j].nodeName] = nodes[j].nodeValue;

                //Remove nodes
                for (var prop, i = 1; i < e.list.length; i++) {
                    for (prop in attr) {
                        if (typeof attr[prop] != "string") continue;

                        if (!e.list[i].getAttributeNode(prop))
                            attr[prop] = undefined;
                        else if(e.list[i].getAttribute(prop) != attr[prop])
                            attr[prop] = "";
                    }
                }

                //Set attributes
                for (prop in attr) {
                    if (typeof attr[prop] != "string") continue;
                    oEl.setAttribute(prop, attr[prop]);
                }

                //missing is childnodes... will implement later when needed...

                oEl.setAttribute(apf.xmldb.xmlIdTag, this.$uniqueId);
                apf.MultiSelectServer.register(oEl.getAttribute(apf.xmldb.xmlIdTag),
                    oEl, e.list, this);
                apf.xmldb.addNodeListener(oEl, apf.MultiSelectServer);

                combinedvalue = oEl;
            }
        }*/
        //#endif
        
        //Set caret property
        this.setProperty("caret", e.caret);

        //Set selection length
        if (this.sellength != e.selection.length)
            this.setProperty("sellength", e.selection.length);
        
        //Set selection property
        delete this.selection;
        this.setProperty("selection", e.selection);
        if (!e.selection.length) {
            //Set selected property
            this.setProperty("selected", e.selected);
            
            //Set value property
            if (this.value)
                this.setProperty("value", "");
        }
        else {
            //Set selected property
            this.$chained = true;
            if (!e.force && (!this.dataParent || !this.dataParent.parent.$chained)) {
                var _self = this;
                $setTimeout(function(){
                    //#ifdef __WITH_PROPERTY_BINDING
                    if (_self.selected == e.selected)
                        _self.setProperty("selected", combinedvalue || e.selected);
                    //#endif
                    delete _self.$chained;
                }, 10);
            }
            else {
                //#ifdef __WITH_PROPERTY_BINDING
                this.setProperty("selected", combinedvalue || e.selected);
                //#endif
                delete this.$chained;
            }
            
            //Set value property
            var valueRule = this.$attrBindings["eachvalue"] && "eachvalue" 
                || this.$bindings["value"] && "value" 
                || this.$hasBindRule("caption") && "caption";

            if (valueRule) {
                //@todo this will call the handler again - should be optimized

                this.$lastValue = this.$applyBindRule(valueRule, e.selected)
                //this.$attrBindings["value"] && 
                if (this.$lastValue != 
                  (valueRule != "value" && (this.xmlRoot
                  && this.$applyBindRule("value", this.xmlRoot, null, true)) 
                  || this.value)) {
                    if (valueRule == "eachvalue" || this.xmlRoot != this)
                        this.change(this.$lastValue);
                    else
                        this.setProperty("value", this.$lastValue);
                }
                /*else {
                    this.setProperty("value", this.$lastValue);
                }*/
                delete this.$lastValue;
            }
        }
        
        //#ifdef __WITH_OFFLINE_STATE
        //@todo this should be generalized and collapsed with setProperty
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled
          && apf.offline.state.realtime) {  //@todo please optimize
            for (var sel = [], i = 0; i < e.selection.length; i++)
                sel.push(apf.xmlToXpath(e.selection[i], null, true));

            apf.offline.state.set(this, "selection", sel);
            fSelState.call(this);
        }
        //#endif

        //#endif
    }, true);
    // #endif
    
    //#ifdef __WITH_OFFLINE_STATE
    function fSelState(){
        if (typeof apf.offline != "undefined" && apf.offline.state.enabled
          && apf.offline.state.realtime) {
            apf.offline.state.set(this, "selstate",
                [this.caret
                    ? apf.xmlToXpath(this.caret, null, true)
                    : "",
                 this.selected
                    ? apf.xmlToXpath(this.selected, null, true)
                    : ""]);
        }
    }

    this.addEventListener("prop.caret", fSelState);
    //#endif
// #ifdef __WITH_DATABINDING
}).call(apf.MultiSelect.prototype = new apf.MultiselectBinding());
/* #else
}).call(apf.MultiSelect.prototype = new apf.Presentation());
 #endif*/

//#ifdef __WITH_MULTISELECT_COLLAPSE
//@todo refactor below
/**
 * @private
 */
/*
apf.MultiSelectServer = {
    objects : {},

    register : function(xmlId, xmlNode, selList, jNode){
        if (!this.$uniqueId)
            this.$uniqueId = apf.all.push(this) - 1;

        this.objects[xmlId] = {
            xml   : xmlNode,
            list  : selList,
            jNode : jNode
        };
    },

    $xmlUpdate : function(action, xmlNode, listenNode, UndoObj){
        if (action != "attribute") return;

        var data = this.objects[xmlNode.getAttribute(apf.xmldb.xmlIdTag)];
        if (!data) return;

        var nodes = xmlNode.attributes;

        for (var j = 0; j < data.list.length; j++) {
            //data[j].setAttribute(UndoObj.name, xmlNode.getAttribute(UndoObj.name));
            apf.xmldb.setAttribute(data.list[j], UndoObj.name,
                xmlNode.getAttribute(UndoObj.name));
        }

        //apf.xmldb.synchronize();
    }
};
*/
// #endif
// #endif
