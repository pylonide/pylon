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

var __MULTIBINDING__ = 1 << 7;

// #ifdef __WITH_MULTIBINDING

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have the ability to databind 
 * the selection of this Element.
 * Example:
 * In this example the selection of the dropdown determines the value of the city
 * xml element in mdlForm. The dropdown is filled with information from mdlCities.
 * <code>
 *  <a:model id="mdlCities" load="url:cities.php" />
 *  <a:model id="mdlForm">
 *      <form>
 *          <name />
 *          <city />
 *      </form>
 *  </a:model>
 *
 *  <a:bar model="mdlForm">
 *      <a:textbox ref="name" />
 *      <a:dropdown ref="city" model="mdlCities">
 *          <a:bindings>
 *              <a:caption select="text()" />
 *              <a:value select="@code" />
 *              <a:traverse select="city" />
 *          </a:bindings>
 *      </a:dropdown>
 *  </a:bar>
 * </code>
 *
 * @see element.dropdown
 * @private
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.5
 */
apf.MultiLevelBinding = function(amlNode){
    this.uniqueId = apf.all.push(this) - 1;
    this.nodeFunc = apf.NODE_HIDDEN;
    this.tagName  = "MultiBinding";
    this.name     = amlNode.name + "_multibinding";

    this.$propHandlers = {}; //@todo fix this in each component
    this.$domHandlers  = {
        "remove"      : [],
        "insert"      : [],
        "reparent"    : [],
        "removechild" : []
    };
    this.$booleanProperties = {};
    this.$supportedProperties = [];
    
    amlNode.$regbase = amlNode.$regbase | __MULTIBINDING__;
    
    apf.makeClass(this);
    this.implement(apf.DataBinding); /** @inherits apf.DataBinding */

    this.getActionTracker = function(ignoreMe){
        return amlNode.getActionTracker(ignoreMe);
    };
    
    this.getHost = function(){
        return amlNode;
    };
    
    this.changeSelection = function(list){
        var i, k, addList, removeList, xmlNode,
            selNodes      = this.getSelectionNodes(),
            traverseNodes = amlNode.getTraverseNodes();
        
        //#ifdef __DEBUG
        if (!amlNode.traverse && !amlNode.bindingRules[amlNode.mainBind]) {
            throw new Error(apf.formatErrorString(0, amlNode, 
              "Executing selection change",
              "The default bind rule isn't set. Expected '" 
              + amlNode.mainBind + "' rule to exist"));
        }
        //#endif
        
        //@todo the following section is too simple.
        if (!this.xmlRoot) {
            var model   = this.getModel();
            if (!model)
                throw new Error();
                
            if (!model.data)
                model.load("<data />");
            
            //@todo hack. The xpath stored for this component in the model is wrong!
            this.$listenRoot = null; 
            this.xmlRoot = model.data;
        }

        //Find nodes that are removed from the selection
        for (removeList = [], i = 0; i < selNodes.length; i++) {
            for (k = 0; k < traverseNodes.length; k++) {
                xmlNode = null;
                if (this.compareNodes(selNodes[i], traverseNodes[k])) {
                    xmlNode = traverseNodes[k];
                    break;
                }
            }
            
            if (!xmlNode || !list.contains(xmlNode)) 
                removeList.push(selNodes[i]);
        }
        
        //Find nodes that are added to the selection
        for (addList = [], i = 0; i < list.length; i++) {
            var found = false;
            for (k = 0; k < selNodes.length; k++) {
                if (this.compareNodes(selNodes[k], list[i])) {
                    found = true;
                    break;
                }
            }
            
            if (!found) 
                addList.push(mlNode.createSelectionNode(list[i]));
        }

        //Use Action Tracker
        this.executeAction("addRemoveNodes", [this.xmlRoot, addList, removeList],
            "changeselection", amlNode.selected);
    };
    
    this.change = function(value){
        // #ifdef __WITH_VALIDATION
        if (this.errBox && this.errBox.visible && this.isValid())
            this.clearError();
        // #endif
        
        if ((!this.createModel || !this.dataParent && !this.getModel()) && !this.xmlRoot) { //!this.$aml.getAttribute("ref")
            //Not databound
            if (this.dispatchEvent("beforechange", {value : value}) === false)
                return;

            this.setProperty("value", value);
            return this.dispatchEvent("afterchange", {value : value});
        }
        
        this.executeActionByRuleSet("change", this.mainBind, this.xmlRoot, value);
    };
    
    if (amlNode.hasFeature(__VALIDATION__)) {
        this.addEventListener("beforechange", function(){
            amlNode.dispatchEvent("beforechange")
        });
        this.addEventListener("afterchange", function(){
            amlNode.dispatchEvent("afterchange")
        });
    }
    
    this.clear = function(nomsg, do_event){
        this.documentId = this.xmlRoot = this.cacheID = subTreeCacheContext = null;

        //@todo fix 'default' behaviour
        /*if (!nomsg && amlNode["default"])
            amlNode.setValue(amlNode["default"]); //@todo setting action
        else*/
            amlNode.clearSelection();
        //else if (amlNode.$showSelection) 
            //amlNode.$showSelection("");
    };

    this.disable = function(){
        amlNode.disable();
        this.disabled = true
    };

    this.enable = function(){
        amlNode.enable();
        this.disabled = false
    };
    
    var updateTimer;
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        if (UndoObj) 
            UndoObj.xmlNode = this.xmlRoot;
        
        clearTimeout(updateTimer)
        updateTimer = setTimeout(function(){
            mlNode.$updateSelection();
        });
        
        //@todo fix 'default' behaviour
        //if (amlNode["default"] && !amlNode.getValue())
            //amlNode.setValue(amlNode["default"]);
        
        this.dispatchEvent("xmlupdate", {
            action    : action,
            xmlNode   : xmlNode,
            listenNode: listenNode
        });
    };
    
    this.$load = function(XMLRoot){
        //if(amlNode.name == "refSMArt_Situatie") debugger;
        //Add listener to XMLRoot Node
        apf.xmldb.addNodeListener(XMLRoot, this);

        this.$updateSelection();
        
        //@todo fix 'default' behaviour
        //if (amlNode["default"] && !amlNode.getValue())
            //amlNode.setValue(amlNode["default"]);
        
        if (!this.createModel && this.disabled != amlNode.disabled)
            amlNode.setProperty("disabled", this.disabled);
    };
    
    this.$updateSelection = function(){
        if (!amlNode.xmlRoot || !mlNode.xmlRoot) 
            return;

        var i, k, xmlNode;
        if (amlNode.multiselect) {
            var selNodes      = this.getSelectionNodes();
            var traverseNodes = amlNode.getTraverseNodes();
            
            //Check if a selected node is not selected yet
            for (i = 0; i < selNodes.length; i++) {
                for (k = 0; k < traverseNodes.length; k++) {
                    xmlNode = null;
                    if (this.compareNodes(selNodes[i], traverseNodes[k])) {
                        xmlNode = traverseNodes[k];
                        break;
                    }
                }
                
                if (xmlNode && !amlNode.isSelected(xmlNode)) {
                    amlNode.select(xmlNode, null, null, null, null, true);
                }
            }
            
            //Check if a currently selected item should be deselected
            var jSelNodes = amlNode.getSelection();
            for (i = 0; i < jSelNodes.length; i++) {
                for (k = 0; k < selNodes.length; k++) {
                    xmlNode = false;
                    if (this.compareNodes(selNodes[k], jSelNodes[i])) {
                        xmlNode = true;
                        break;
                    }
                }
                
                if (!xmlNode) {
                    amlNode.select(jSelNodes[i], null, null, null, null, true);
                }
            }
            
            //amlNode.selectList(selList);
        }
        else {
            if (!amlNode.xmlRoot) {
                //Selection is maintained and visualized, but no Nodes are selected
                if (amlNode.$showSelection) 
                    amlNode.$showSelection();
                return;
            }
            
            xmlNode = amlNode.findXmlNodeByValue(this.applyRuleSetOnNode(this.mainBind, this.xmlRoot));
            if (xmlNode) {
                if (amlNode.$showSelection) 
                    amlNode.$showSelection(amlNode.applyRuleSetOnNode("caption", xmlNode));
                if (amlNode.selected != xmlNode) {
                    amlNode.select(xmlNode);//, null, null, null, null, true);
                    //amlNode.dispatchEvent("updateselect");
                    amlNode.setConnections(xmlNode);
                }
            }
            //if (amlNode.clearOnNoSelection) 
            else {
                amlNode.clearSelection(null, true);
            }
        }
    };
    
    this.getSelectionNodes = function(){
        return this.xmlRoot 
            ? this.xmlRoot.selectNodes(this.mode == "copy" ? amlNode.traverse : amlNode.$aml.getAttribute("ref"))
            : [];//This should be read from the bindingRule //this.getTraverseNodes();
    };
    
    this.getSelectionValue = function(xmlNode){
        return apf.queryValue(xmlNode, "text()")
    };
    
    this.getSelectionNodeByValue = function(value, nodes){
        if (!nodes) 
            nodes = this.getSelectionNodes();
        for (var i = 0; i < nodes.length; i++) {
            if (this.getSelectionValue(nodes[i]) == value) 
                return nodes[i];
        }
        
        return false;
    };
    
    this.mode  = "default";//"copy";//"default";//"copy"
    this.xpath = "text()";
    
    this.createSelectionNode = function(xmlNode){
        if (this.mode == "copy") {
            return apf.xmldb.cleanNode(xmlNode.cloneNode(true));
        }
        else if (this.xmlRoot) {
            var value   = amlNode.applyRuleSetOnNode(amlNode.mainBind, xmlNode);
            var selNode = this.xmlRoot.ownerDocument.createElement(amlNode.$aml.getAttribute("ref"));
            apf.createNodeFromXpath(selNode, this.xpath);
            apf.setNodeValue(selNode.selectSingleNode(this.xpath), value);
            
            return selNode;
        }
    };
    
    this.compareNodes = function(selNode, traverseNode){
        if (this.mode == "copy") {
            //Other ways of linking should be considered here
            return amlNode.applyRuleSetOnNode(amlNode.mainBind, traverseNode)
              == amlNode.applyRuleSetOnNode(amlNode.mainBind, selNode);
        }
        else {
            return amlNode.applyRuleSetOnNode(amlNode.mainBind, traverseNode)
              == this.getSelectionValue(selNode);
        }
    };
    
    var mlNode = this;
    amlNode.addEventListener("afterselect", function(e){
        if (!mlNode.xmlRoot && (!this.createModel || !mlNode.$model)) {
            if (this.value)
                mlNode.change(this.value);
            
            return;
        }

        if (this.multiselect)
            mlNode.changeSelection(e.list);
        else
            mlNode.change(this.applyRuleSetOnNode(this.mainBind, e.xmlNode));
    });
    
    //amlNode.addEventListener("xmlupdate", function(action, xmlNode){
    //    updateSelection.call(this, null, this.selected);
    //});
    amlNode.addEventListener("afterload", function(){
        if (this.multiselect) {
            //skipped...
        }
        else {
            var xmlNode = this.findXmlNodeByValue(mlNode.applyRuleSetOnNode(
                mlNode.mainBind, mlNode.xmlRoot));
            if (xmlNode) {
                if (amlNode.$showSelection) 
                    amlNode.$showSelection(amlNode.applyRuleSetOnNode("caption", xmlNode));
                amlNode.select(xmlNode, null, null, null, null, true);
                amlNode.setConnections(xmlNode);
            }
            else if (amlNode.clearOnNoSelection) {
                //This seems cumbersome... check abstraction
                xmlNode = mlNode.getNodeFromRule(mlNode.mainBind,
                    mlNode.xmlRoot, null, null, true);
                apf.setNodeValue(xmlNode, "");
                if (this.$updateOtherBindings) 
                    this.$updateOtherBindings();
                if (this.$showSelection) 
                    this.$showSelection();
            }
        }
    });
    
    amlNode.addEventListener("afterdeselect", function(){
        if (!mlNode.xmlRoot) 
            return;
        
        //Remove sel nodes
        if (this.multiselect) {
            /*
             //Translate sel to a list of nodes in this xml space
             for(var removeList=[],xmlNode, value, i=0;i<sel.length;i++){
                 xmlNode = mlNode.findXmlNodeByValue(this.applyRuleSetOnNode(this.mainBind, sel[i]));
                 //Node to be unselected (removed) cannot be found. This should not happen.
                 if (!xmlNode) continue;
                 removeList.push(xmlNode);
             }
             
             //Remove node using ActionTracker
             if (removeList.length)
                 mlNode.SelectRemove(removeList);
             */
        }
        //Set value to ""
        else
            if (amlNode.clearOnNoSelection) {
                this.$updateOtherBindings();
                //mlNode.change("");
                
                //This should be researched better....
                apf.setNodeValue(apf.createNodeFromXpath(mlNode.xmlRoot,
                    mlNode.bindingRules[mlNode.mainBind][0].getAttribute("select")),
                    "", true);
            }
    });
};

// #endif
