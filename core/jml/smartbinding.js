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

//#ifdef __WITH_DATABINDING

/**
 * Class SmartBinding represents a connection between a component and data.
 * The SmartBinding presents a way of translating data into representation and back.
 * It offers the possibility to synchronize a second data set on a remote location (server).
 * A SmartBinding also offers the ability to specify rules for drag&drop data handling.
 *
 * @classDescription		This class creates a new smartbinding
 * @return {SmartBinding} Returns a new smartbinding
 * @type {SmartBinding}
 * @constructor
 * @jpfclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.SmartBinding = function(name, xmlNode, parentNode){
    this.xmlbindings = null;
    this.xmlactions  = null;
    this.xmldragdrop = null;
    this.bindings    = null;
    this.actions     = null;
    this.dragdrop    = null;

    this.jmlNodes    = {};
    this.modelXpath  = {};
    this.name        = name;
    var _self        = this;
    
    //#ifdef __WITH_DOM_COMPLETE
    this.tagName    = "smartbinding";
    this.nodeFunc   = jpf.NODE_HIDDEN;
    this.parentNode = parentNode;
    jpf.inherit.call(this, jpf.JmlDom); /** @inherits jpf.JmlDom */
    //#endif

    var parts        = {
        bindings: 'loadBindings',
        actions : 'loadActions',
        dragdrop: 'loadDragDrop'
    };
    
    //#ifdef __DEBUG
    jpf.console.info(name
        ? "Creating SmartBinding [" + name + "]"
        : "Creating implicitly assigned SmartBinding");
    //#endif
    
    /**
     * @private
     */
    this.initialize = function(jmlNode, part){
        //register element
        this.jmlNodes[jmlNode.uniqueId] = jmlNode;
        
        if (part)
            return jmlNode[parts[part]](this[part], this["xml" + part]);
        
        if (jmlNode.$jml && this.name) //@todo is this still relevant?
            jmlNode.$jml.setAttribute("smartbinding", this.name);

        for (part in parts) {
            //#ifdef __SUPPORT_Safari_Old
            if (typeof parts[part] != "string") continue;
            //#endif

            if (!this[part]) continue;

            //#ifdef __DEBUG
            if (!jmlNode[parts[part]]) {
                throw new Error(jpf.formatErrorString(1035, jmlNode, 
                    "initializing smartBinding", 
                    "Could not find handler for '" + part + "'."));
            }
            //#endif

            jmlNode[parts[part]](this[part], this["xml" + part]);
        }
        
        if (this.model)
            this.model.register(jmlNode, this.modelXpath[jmlNode.getHost
                ? jmlNode.getHost().uniqueId
                : jmlNode.uniqueId] || this.modelBaseXpath); //this is a hack.. by making MOdels with links to other models possible, this should not be needed
        else if (jmlNode.$model && (jmlNode.smartBinding && jmlNode.smartBinding != this))
            jmlNode.$model.reloadJmlNode(jmlNode.uniqueId);//.load(jmlNode.model.data.selectSingleNode("Accounts/Account[1]"));
        
        return this;
    };
    
    /**
     * @private
     */
    this.deinitialize = function(jmlNode){
        //unregister element
        this.jmlNodes[jmlNode.uniqueId] = null;
        delete this.jmlNodes[jmlNode.uniqueId];
        
        for (part in parts) {
            //#ifdef __SUPPORT_Safari_Old
            if (typeof parts[part] != "string") continue;
            //#endif

            if (!this[part]) continue;
            
            //#ifdef __DEBUG
            if (!jmlNode["un" + parts[part]]) {
                throw new Error(jpf.formatErrorString(1035, jmlNode, 
                    "deinitializing smartBinding", 
                    "Could not find handler for '" + part + "'."));
            }
            //#endif
            
            jmlNode["un" + parts[part]]();
        }
        
        if (this.model)
            this.model.unregister(jmlNode);
    };
    
    var timer, queue = {};
    this.markForUpdate = function(jmlNode, part){
        (queue[jmlNode.uniqueId] 
            || (queue[jmlNode.uniqueId] = {}))[part || "all"] = jmlNode;

        if (!timer) {
            timer = setTimeout(function(){
                _self.$updateMarkedItems();
            });
        }
        
        return this;
    };
    
    this.$updateMarkedItems = function(){
        var jmlNode, q = queue; timer = null; queue = {}
        for (var id in q) {
            //We're only processing nodes that are registered here
            if (!this.jmlNodes[id])
                continue;
            
            if (q[id]["all"]) {
                jmlNode = q[id]["all"];
                //model isn't done here
                for (part in parts) {
                    if (!this[part]) continue;
                    jmlNode[parts[part]](this[part], this["xml" + part]);
                }
                jmlNode.reload();
            }
            else {
                for (part in q[id]) {
                    jmlNode = q[id][part];
                    if (part == "model") {
                        jmlNode.getModel().reloadJmlNode(jmlNode.uniqueId);
                        continue;
                    }
                    
                    jmlNode[parts[part]](this[part], this["xml" + part]);
                    if (part == "bindings")
                        jmlNode.reload();
                }
            }
        }
    };
    
    /**
     * @private
     */
    this.addBindRule = function(xmlNode, jmlParent){
        var str = xmlNode[jpf.TAGNAME] == "ref"
            ? jmlParent ? jmlParent.mainBind : "value"
            : xmlNode.tagName;
        if (!this.bindings)
            this.bindings = {};
        if (!this.bindings[str])
            this.bindings[str] = [xmlNode];
        else
            this.bindings[str].push(xmlNode);
    };
    
    /**
     * @private
     */
    this.addBindings = function(rules){
        this.bindings    = rules;//jpf.getRules(xmlNode);
        this.xmlbindings = xmlNode;
        
        if (!jpf.isParsing) {
            //@todo, dynamically update part
        }
        
        if (!jpf.isParsing)
            this.markForUpdate(null, "bindings");
    };
    
    /**
     * @private
     */
    this.addActionRule = function(xmlNode){
        var str = xmlNode[jpf.TAGNAME] == "action" ? "Change" : xmlNode.tagName;
        if (!this.actions)
            this.actions = {};
        if (!this.actions[str])
            this.actions[str] = [xmlNode];
        else
            this.actions[str].push(xmlNode);
    };
    
    /**
     * @private
     */
    this.addActions = function(rules, xmlNode){
        this.actions    = rules;//jpf.getRules(xmlNode);
        this.xmlactions = xmlNode;
        
        if (!jpf.isParsing)
            this.markForUpdate(null, "bindings");
    };
    
    /**
     * @private
     */
    this.addDropRule = 
    this.addDragRule = function(xmlNode){
        if (!this.dragdrop)
            this.dragdrop = {};
        if (!this.dragdrop[xmlNode[jpf.TAGNAME]])
            this.dragdrop[xmlNode[jpf.TAGNAME]] = [xmlNode];
        else
            this.dragdrop[xmlNode[jpf.TAGNAME]].push(xmlNode);
    };
    
    /**
     * @private
     */
    this.addDragDrop = function(rules, xmlNode){
        this.dragdrop    = rules;//jpf.getRules(xmlNode);
        this.xmldragdrop = xmlNode;
        
        if (!jpf.isParsing)
            this.markForUpdate(null, "dragdrop");
    };
    
    /**
     * @private
     */
    this.setModel = function(model, xpath){
        if (typeof model == "string")
            model = jpf.nameserver.get("model", model);
        
        this.model          = jpf.nameserver.register("model", this.name, model);
        this.modelBaseXpath = xpath;
        
        for (var uniqueId in this.jmlNodes) {
            this.model.unregister(this.jmlNodes[uniqueId]);
            this.model.register(jmlNode, this.modelXpath[jmlNode.getHost
                ? jmlNode.getHost().uniqueId
                : jmlNode.uniqueId] || this.modelBaseXpath); //this is a hack.. by making Models with links to other models possible, this should not be needed
            //this.jmlNodes[uniqueId].load(this.model);
        }
    };
    
    /**
     * Loads xml data in all the components using this SmartBinding.
     * 
     * @param  {variant}  xmlRootNode  optional  XMLNode  XML node which is loaded in this component. 
     *                                          String  Serialize xml which is loaded in this component.
     *                                          Null  Giving null clears this component {@link Cache#clear}.
     */
    this.load = function(xmlNode){
        this.setModel(new jpf.Model().load(xmlNode));
    };
    
    this.loadJml = function(xmlNode){
        this.name = xmlNode.getAttribute("id");
        this.$jml  = xmlNode;
        
        //Bindings
        if (xmlNode.getAttribute("bindings")) {
            //#ifdef __DEBUG
            if (!jpf.nameserver.get("bindings", xmlNode.getAttribute("bindings")))
                throw new Error(jpf.formatErrorString(1036, this, "Connecting bindings", "Could not find bindings by name '" + xmlNode.getAttribute("bindings") + "'"));
            //#endif
            
            var cNode = jpf.nameserver.get("bindings", xmlNode.getAttribute("bindings"));
            this.addBindings(jpf.getRules(cNode), cNode);
        }
        
        //Actions
        if (xmlNode.getAttribute("actions")) {
            //#ifdef __DEBUG
            if (!jpf.nameserver.get("actions", xmlNode.getAttribute("actions")))
                throw new Error(jpf.formatErrorString(1037, this, "Connecting bindings", "Could not find actions by name '" + xmlNode.getAttribute("actions") + "'"));
            //#endif
            
            var cNode = jpf.nameserver.get("actions", xmlNode.getAttribute("actions"));
            this.addActions(jpf.getRules(cNode), cNode);
        }
        
        //DragDrop
        if (xmlNode.getAttribute("dragdrop")) {
            //#ifdef __DEBUG
            if (!jpf.nameserver.get("dragdrop", xmlNode.getAttribute("dragdrop")))
                throw new Error(jpf.formatErrorString(1038, this, "Connecting dragdrop", "Could not find dragdrop by name '" + xmlNode.getAttribute("dragdrop") + "'"));
            //#endif
            
            var cNode = jpf.nameserver.get("dragdrop", xmlNode.getAttribute("dragdrop"));
            this.addDragDrop(jpf.getRules(cNode), cNode);
        }
        
        var data_node, nodes = xmlNode.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;
    
            switch (nodes[i][jpf.TAGNAME]) {
                case "model":
                    data_node = nodes[i];
                    break;
                case "bindings":
                    this.addBindings(jpf.getRules(nodes[i]), nodes[i]);
                    break;
                case "actions":
                    this.addActions(jpf.getRules(nodes[i]), nodes[i]);
                    break;
                case "dragdrop":
                    this.addDragDrop(jpf.getRules(nodes[i]), nodes[i]);
                    break;
                case "ref":
                    this.addBindRule(nodes[i]);
                    break;
                case "action":
                    this.addActionRule(nodes[i]);
                    break;
                default:
                    throw new Error(jpf.formatErrorString(1039, this, "setSmartBinding Method", "Could not find handler for '" + nodes[i].tagName + "' node."));
                    //when an unknown found assume that this is an implicit bindings node
                    //this.addBindings(jpf.getRules(xmlNode)); 
                    break;
            }
        }
        
        //Set Model
        if (data_node)
            this.setModel(new jpf.Model().loadJml(data_node));
        else if (xmlNode.getAttribute("model"))
            jpf.setModel(xmlNode.getAttribute("model"), this);
    };
    
    if (xmlNode)
        this.loadJml(xmlNode);
};

// #endif

