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
 * Element containing information on how databound elements should deal with 
 * data. The smartbinding element specifies how data is transformed and rendered 
 * in databound elements. It also specifies how changes on the bound data are 
 * send to their original data source (actions) and which data elements can be 
 * dragged and dropped (dragdrop). 
 * Example:
 * A simple example of a smartbinding transforming data into representation
 * <pre class="code">
 *  <j:smartbinding id="sbUsers">
 *      <j:bindings>
 *          <j:caption select="text()" />
 *          <j:icon value="icoUser.png" />
 *          <j:traverse select="user" />
 *      </j:bindings>
 *  </j:smartbinding>
 * 
 *  <j:list smartbinding="sbUsers" />
 * </pre>
 * Example:
 * This is an elaborate example showing how to create a filesystem tree with
 * files and folders in a tree. The smartbinding element describes how the
 * files and folders are transformed to tree elements and how actions within
 * the tree are sent to the data source. In this case webdav is used. The drag
 * and drop rules specify which elements can be dragged and where they can be
 * dropped.
 * <pre class="code">
 *  <j:smartbinding id="sbFilesystem" model="webdav:getRoot()">
 *      <j:bindings>
 *          <j:insert select="self::folder" get="webdav:readdir({@path})" />
 *          <j:traverse select="file|folder" sort="@name" sort-method="filesort" />
 *          <j:caption select="@name" />
 *          <j:icon select="self::folder" value="icoFolder.png" />
 *          <j:icon select="self::file" method="getIcon" />
 *      </j:bindings>
 *      <j:actions>
 *         <j:add type="folder" get="webdav:mkdir({@id}, 'New Folder')" />
 *         <j:add type="file" get="webdav:create({@id}, 'New File', '')" />
 *         <j:rename set="webdav:move(oldValue, {@name}, {@id})"/>
 *         <j:copy select="." set="webdav:copy({@id}, {../@id})"/>
 *         <j:move select="." set="webdav:move()"/>
 *         <j:remove select="." set="webdav:remove({@path})"/>
 *      </j:actions>
 *      <j:dragdrop>
 *          <j:allow-drag select="folder|file" /> 
 *          <j:allow-drop select="folder|file" target="folder" 
 *              operation="tree-append" copy-condition="event.ctrlKey" /> 
 *      </j:dragdrop>
 *  </j:smartbinding>
 *
 *  <j:tree model="mdlFilesystem" smartbinding="sbFilesystem" />
 *
 *  <j:script>
 *      function filesort(value, args, xmlNode) {
 *          return (xmlNode.tagName == "folder" ? 0 : 1) + value;
 *      }
 *
 *      function getIcon(xmlNode){
 *          xmlNode.getAttribute('name').match(/\.([^\.]*)$/);
 *              
 *          var ext = RegExp.$1;
 *          return (SupportedIcons[ext.toUpperCase()]
 *              ? SupportedIcons[ext.toUpperCase()] + ".png" 
 *              : "unknown.png");
 *      }
 *  </j:script>
 * </pre>
 * Remarks:
 * Each element has it's own set of binding rules it uses to render the data 
 * elements. The same goes for it's actions. To give an example, a slider has 
 * one action called 'change'. This action is called when then value of the 
 * slider changes. A tree elements has several actions amongs others 'add',
 * 'remove', 'move', 'copy' and 'rename'. 
 * 
 * Smartbindings give rise to many other features in a Javeline PlatForm 
 * application. Actions done by the user can be undone by calling 
 * {@link element.actiontracker.method.undo} of the element. The 
 * remote smartbinding element can send changes to data to other clients.
 *
 * This element is created especially for reuse. Multiple elements can reference
 * this elements by setting the smartbinding attribute. If an element is sonly
 * used to for a single element it can be set as it's child. Moreover each of
 * the children of the smartbinding element can exist outside the smartbinding
 * element and referenced indepently. 
 * Example:
 * This example shows a smartbinding element which references it's children as
 * stand alone elements.
 * <pre class="code">
 *  <j:bindings id="bndExample">
 *      ...
 *  </j:bindings>
 *  <j:actions id="actExample">
 *      ...
 *  </j:actions>
 *  <j:dragdrop id="ddExample">
 *      ...
 *  </j:dragdrop>
 *  <j:model id="mdlExample" />
 *
 *  <j:smartbinding id="sbExample"
 *    actions  = "actExample" 
 *    bindings = "bndExample" 
 *    dragdrop = "ddExample" 
 *    model    = "mdlExample" />
 *
 *  <j:list smartbinding="sbExample" />
 *  <j:tree binding="bndExample" action="actExample" model="url:example.php" />
 * </pre>
 * Example:
 * This example shows the children of the smartbinding directly as a child of 
 * the element that they apply on.
 * <pre class="code">
 *  <j:tree>
 *      <j:bindings>
 *          ...
 *      </j:bindings>
 *      <j:actions>
 *          ...
 *      </j:actions>
 *      <j:dragdrop>
 *          ...
 *      </j:dragdrop>
 *  </j:tree>
 * </pre>
 * Example:
 * The shortest way to add binding rules to an element is as follows:
 * <pre class="code">
 *  <j:tree traverse="file|folder" caption="@name" icon="@icon" />
 * </pre>
 * 
 * @define smartbinding
 * @allowchild bindings, actions, ref, action, dragdrop, model
 * @addnode smartbinding, global
 *
 * @constructor
 * @jpfclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 *
 * @default_private
 */
jpf.smartbinding = function(name, xmlNode, parentNode){
    this.xmlbindings = null;
    this.xmlactions  = null;
    this.xmldragdrop = null;
    this.bindings    = null;
    this.actions     = null;
    this.dragdrop    = null;

    this.jmlNodes    = {};
    this.$modelXpath = {};
    this.name        = name;
    var _self        = this;
    //this.uniqueId    = jpf.all.push(this) - 1;
    
    //#ifdef __WITH_JMLDOM_FULL
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
            //#ifdef __SUPPORT_SAFARI2
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

        if (this.$model) {
            this.$model.register(jmlNode, this.$modelXpath[jmlNode.getHost
                ? jmlNode.getHost().uniqueId
                : jmlNode.uniqueId] || this.modelBaseXpath); //this is a hack.. by making MOdels with links to other models possible, this should not be needed
        }
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
            //#ifdef __SUPPORT_SAFARI2
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
        
        if (!this.jmlNodes[jmlNode.uniqueId])
            this.jmlNodes[jmlNode.uniqueId] = jmlNode;

        if (!timer) {
            timer = setTimeout(function(){
                _self.$updateMarkedItems();
            });
        }
        
        return this;
    };
    
    this.$isMarkedForUpdate = function(jmlNode){
        return queue[jmlNode.uniqueId] ? true : false;
    }
    
    this.$updateMarkedItems = function(){
        clearTimeout(timer);
        
        var jmlNode, model, q = queue; timer = null; queue = {}
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
                
                model = jmlNode.getModel();
                if (model)
                    model.reloadJmlNode(jmlNode.uniqueId);
                else
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
            this.model.register(jmlNode, this.$modelXpath[jmlNode.getHost
                ? jmlNode.getHost().uniqueId
                : jmlNode.uniqueId] || this.modelBaseXpath); //this is a hack.. by making Models with links to other models possible, this should not be needed
            //this.jmlNodes[uniqueId].load(this.model);
        }
    };
    
    /**
     * Loads xml data in the model of this smartbinding element.
     * 
     * @param  {mixed}  xmlNode
     *   Possible values:
     *   {XMLElement} the xml data element loaded in the model of this smartbinding element. 
     *   {String}     the serialized xml which is loaded in the model of this smartbinding element. 
     *   {null}       clears this element.
     */
    this.load = function(xmlNode){
        this.setModel(new jpf.model().load(xmlNode));
    };
    
    /**
     * @private
     *
     * @attribute {String} bindings the id of the bindings element that provides the binding rules for all elements connected to this smartbinding element
     * @attribute {String} actions  the id of the actions element that provides the action rules for all elements connected to this smartbinding element
     * @attribute {String} dragdrop the id of the dragdrop element that provides the drag and drop rules for all elements connected to this smartbinding element
     * @attribute {String} model    the id of the model element that provides the data for all elements connected to this smartbinding element.
     * @define bindings element containing all the binding rules for the data 
     * bound elements referencing this element.
     * Example:
     * <pre class="code">
     *  <j:bindings id="bndFolders" >
     *      <j:caption select="@name" />
     *      <j:icon select="@icon" />
     *      <j:traverse select="folder" sort="@name" />
     *  </j:bindings>
     *
     *  <j:tree bindings="bndFolders" />
     * </pre>
     * @see smartbinding
     * @allowchild {bindings}
     * @addnode smartbinding, global
     * @define actions  element containing all the action rules for the data 
     * bound elements referencing this element.
     * Example:
     * <pre class="code">
     *  <j:actions id="actPerson" >
     *      <j:add set="rpc:comm.addPerson({.})">
     *          <person name="New person" />
     *      </j:add
     *      <j:rename set="rpc.comm.renamePerson({@id}, {@name})" />
     *      <j:remove select="@new" set="rpc:comm.removePerson({@id})"/>
     *  </j:actions>
     *
     *  <j:tree actions="actPerson" />
     * </pre>
     * @allowchild {actions}
     * @addnode smartbinding, global
     * @define dragdrop element containing all the dragdrop rules for the data 
     * bound elements referencing this element.
     * Example:
     * This example shows drag and drop rules for a tree with person and
     * office elements. A person can be dragged to an office. An office can be
     * dragged but not dropped within this element. Possible an other element
     * does allow receiving an office element.
     * <pre class="code">
     *  <j:dragdrop>
     *      <j:allow-drag select="person|office" /> 
     *      <j:allow-drop select="person" target="office" 
     *          operation="tree-append" copy-condition="event.ctrlKey" /> 
     *  </j:dragdrop>
     * </pre>
     * @allowchild allow-drag, allow-drop
     * @addnode smartbinding, global
     * @define ref      shorthand for the default binding rule
     * @addnode smartbinding
     * @define action   shorthand for the default action rule.
     * @addnode smartbinding
     */
    var known = {
        actions  : "addActions",
        bindings : "addBindings",
        dragdrop : "addDragDrop"
    };

    this.loadJml = function(xmlNode){
        this.name = xmlNode.getAttribute("id");
        this.$jml  = xmlNode;
        
        var name, attr = xmlNode.attributes, l = attr.length;
        for (var i = 0; i < l; i++) {
            name = attr[i].nodeName;
            if (name == "model")
                continue;
            
            if (!known[name])
                continue;
            
            //#ifdef __DEBUG
            if (!jpf.nameserver.get(name, attr[i].nodeValue))
                throw new Error(jpf.formatErrorString(1036, this, 
                    "Connecting " + name, 
                    "Could not find " + name + " by name '" 
                    + attr[i].nodeValue + "'"));
            //#endif
            
            var cNode = jpf.nameserver.get(name, attr[i].nodeValue);
            this[known[name]](jpf.getRules(cNode), cNode);
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
                    throw new Error(jpf.formatErrorString(1039, this, 
                        "setSmartBinding Method", 
                        "Could not find handler for '" 
                        + nodes[i].tagName + "' node."));
                    break;
            }
        }
        
        //Set Model
        if (data_node)
            this.setModel(new jpf.model().loadJml(data_node));
        else if (xmlNode.getAttribute("model"))
            jpf.setModel(xmlNode.getAttribute("model"), this);
    };
    
    if (xmlNode)
        this.loadJml(xmlNode);
};

// #endif

