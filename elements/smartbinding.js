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
 * An element containing information on how databound elements process data.
 *
 * The {@link term.smartbinding smartbinding} element specifies how data is transformed and rendered 
 * in databound elements. It also specifies how changes on the bound data are 
 * send to their original data source ({@link element.actions actions}) and
 * which {@link term.datanode data nodes} can be dragged and dropped ({@link element.dragdrop dragdrop}).
 * 
 * #### Remarks
 *
 * Each element has its own set of binding rules it uses to render the data 
 * elements. The same goes for it's actions. To give an example, a slider has 
 * one action called 'change'. This action is called when then value of the 
 * slider changes. A tree element has several actions - among others: 'add',
 * 'remove', 'move', 'copy' and 'rename'. 
 * 
 * Smartbindings enable many other features in a Ajax.org Platform
 * application. Actions done by the user can be undone by calling 
 * {@link element.actiontracker.method.undo} of the element. The 
 * Remote Databinding element can send changes on data to other clients.
 *
 * This element is created especially for reuse. Multiple elements can reference
 * a single smartbinding element by setting the value of the 'smartbinding'
 * attribute to the ID of this smartbinding element. If an element is only used
 * for a single other element it can be set as it's child. In fact, each of the
 * children of the smartbinding element can exist outside the smartbinding
 * element and referenced indepently.
 *
 * #### Example
 *
 * A simple example of a smartbinding transforming data into representation
 * 
 * ```xml
 *  <a:smartbinding id="sbProducts">
 *          <a:bindings>
 *               <a:caption match="[text()]" />
 *               <a:value match="[text()]" />
 *               <a:each match="[product]" />
 *           </a:bindings>
 *      </a:smartbinding>
 *     
 *      <a:list smartbinding="sbProducts" width="200">
 *          <a:model>
 *               <data>
 *                   <product>LCD Panel</product>
 *               </data>
 *           </a:model>
 *      </a:list>
 * ```
 * 
 * #### Example
 *
 * This is an elaborate example showing how to create a filesystem tree with
 * files and folders in a tree. The smartbinding element describes how the
 * files and folders are transformed to tree elements and how actions within
 * the tree are sent to the data source. In this case {@link teleport.webdav WebDAV}
 * is used. The drag and drop rules specify which elements can be dragged and
 * where they can be dropped.
 * 
 * ```xml
 *  <a:smartbinding id="sbFilesystem" model="{myWebdav.getRoot()}">
 *      <a:bindings>
 *          <a:insert match="[folder]" get="{myWebdav.readdir([@path])}" />
 *          <a:each match="[file|folder]" sort="[@name]" sort-method="filesort" />
 *          <a:caption match="[@name]" />
 *          <a:icon match="[folder]" value="icoFolder.png" />
 *          <a:icon match="[file]" method="getIcon" />
 *          <a:drag match="[folder|file]" copy="event.ctrlKey" /> 
 *          <a:drop 
 *            match  = "[folder|file]" 
 *            target = "[folder]" 
 *            action = "tree-append" /> 
 *      </a:bindings>
 *      <a:add type="folder" get="{myWebdav.mkdir([@id], 'New Folder')}" />
 *      <a:add type="file" get="{myWebdav.create([@id], 'New File', '')}" />
 *      <a:rename set="{myWebdav.move(oldValue, [@name], [@id])}"/>
 *      <a:copy match="[.]" set="{myWebdav.copy([@id], [../@id])}"/>
 *      <a:move match="[.]" set="{myWebdav.move()}"/>
 *      <a:remove match="[.]" set="{myWebdav.remove([@path])}"/>
 *  </a:smartbinding>
 *
 *  <a:tree 
 *    dragcopy     = "true" 
 *    model        = "mdlFilesystem" 
 *    smartbinding = "sbFilesystem" />
 *
 *  <a:script>
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
 *  </a:script>
 * ```
 *
 * #### Example
 *
 * This example shows a smartbinding element which references to its children as
 * stand alone elements.
 * 
 * ```xml
 *  <a:bindings id="bndExample">
 *      ...
 *  </a:bindings>
 *  <a:actions id="actExample">
 *      ...
 *  </a:actions>
 *  <a:dragdrop id="ddExample">
 *      ...
 *  </a:dragdrop>
 *  <a:model id="mdlExample" />
 *
 *  <a:smartbinding id="sbExample"
 *    actions  = "actExample" 
 *    bindings = "bndExample" 
 *    dragdrop = "ddExample" 
 *    model    = "mdlExample" />
 *
 *  <a:list smartbinding="sbExample" />
 *  <a:tree binding="bndExample" action="actExample" model="example.php" />
 * ```
 *
 * 
 * #### Example
 *
 * The shortest method to add binding rules to an element is as follows:
 * 
 * ```xml
 *  <a:tree each="[file|folder]" caption="[@name]" icon="[@icon]" />
 * ```
 *
 * @see baseclass.databinding
 * @see baseclass.databinding.attribute.smartbinding
 * @see term.smartbinding
 * @see term.binding
 * @see term.action
 * 
 * @define smartbinding
 * @allowchild bindings, actions, ref, action, dragdrop, model
 * @addnode smartbinding, global
 *
 * @class apf.smartbinding
 * @apfclass
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 *
 * @default_private
 */
apf.smartbinding = function(struct, tagName){
    this.$init(tagName || "smartbinding", apf.NODE_HIDDEN, struct);

    this.$bindNodes = {};
};

(function(){
    this.$supportedProperties = ["bindings", "actions", "model"];
    this.$handlePropSet = function(prop, value, force){
        switch(prop) {
            //@todo apf3 change this to use apf.setModel();
            case "model":
                //#ifdef __WITH_NAMESERVER
                if (typeof value == "string")
                    value = apf.nameserver.get("model", value);
                this.model          = apf.nameserver.register("model", this.name, value);
                //this.modelBaseXpath = xpath;
                
                var amlNode;
                for (var uniqueId in this.$bindNodes) {
                    amlNode = this.$bindNodes[uniqueId];
                    this.model.unregister(amlNode);
                    this.model.register(amlNode, this.$modelXpath[amlNode.getHost
                        ? amlNode.getHost().$uniqueId
                        //this is a hack.. by making Models with links to other
                        //models possible, this should not be needed
                        : amlNode.$uniqueId] || this.modelBaseXpath);
                    //this.$bindNodes[uniqueId].load(this.model);
                }
                //#endif
                break;
            case "bindings":
                if (this.$bindings)
                    this.remove(this.$bindings);
                
                this.$bindings = typeof value == "object" 
                    ? value 
                    : 
                    //#ifdef __WITH_NAMESERVER
                    apf.nameserver.lookup("bindings", value);
                    /* #else
                    {}
                    #endif */
                
                this.add(this.$bindings);
                
                break;
            case "actions":
                if (this.$actions)
                    this.remove(this.$actions);
                
                this.$actions = typeof value == "object" 
                    ? value 
                    :
                    //#ifdef __WITH_NAMESERVER
                    apf.nameserver.lookup("actions", value);
                    /* #else
                    {}
                    #endif */
                
                this.add(this.$actions);
            
                break;
        }
        
        this[prop] = value;
        
        //#ifdef __DEBUG
        /*if (!apf.nameserver.get(name, attr[i].nodeValue))
            throw new Error(apf.formatErrorString(1036, this, 
                "Connecting " + name, 
                "Could not find " + name + " by name '" 
                + attr[i].nodeValue + "'"));*/
        //#endif
    };
    
    this.add = function(node){
        for (var uId in this.$bindNodes)
            node.register(this.$bindNodes[uId]);
        
        this["$" + node.localName] = node;
    };
    
    this.remove = function(node){
        for (var uId in this.$bindNodes)
            node.unregister(this.$bindNodes[uId]);
    };
    
    this.register = function(amlNode){
        this.$bindNodes[amlNode.$uniqueId] = amlNode;
        
        if (this.$bindings)
            this.$bindings.register(amlNode);
        if (this.$actions)
            this.$actions.register(amlNode);
        if (this.$model)
            this.$model.register(amlNode);
    };

    this.unregister = function(amlNode){
        //unregister element
        this.$bindNodes[amlNode.$uniqueId] = null;
        delete this.$bindNodes[amlNode.$uniqueId];
        
        if (this.$bindings)
            this.$bindings.unregister(amlNode);
        if (this.$actions)
            this.$actions.unregister(amlNode);
        if (this.$model)
            this.$model.unregister(amlNode);
    };
    
    /**
     * Loads XML data in the model of this smartbinding element.
     * 
     * @param  {Mixed}  xmlNode the {@link term.datanode data node} loaded into
     * the model of this smartbinding element. This can be an XMLElement, a 
     * string or null. 
     * @private
     */
    this.load = function(xmlNode){
        //@todo fix this
        new apf.model().register(this).load(xmlNode);
    };
    
    this.clear = function(state){
        //for all elements do clear(state);
    };
    
    /*
     * @private
     *
     * @attribute {String} bindings the id of the bindings element that contains 
     * the {@link term.binding binding rules} for all elements connected to 
     * this smartbinding element
     * 
     * #### Example
     *   
     * ```xml
     *  <a:smartbinding id="sbExample" bindings="bndExample" />
     * ```
     * @see element.bindings
     * @see term.binding
     * @see term.smartbinding
     *
     * @attribute {String} actions  the id of the actions element that provides 
     * the {@link term.action action rules} for all elements connected to 
     * this smartbinding element
     * 
     * #### Example
     * 
     * ```xml
     *  <a:smartbinding id="sbExample" actions="actExample" />
     * ```
     * @see element.actions
     * @see term.action
     * @see term.smartbinding
     *
     * @attribute {String} dragdrop the id of the dragdrop element that provides 
     * the drag and drop rules for all elements connected to this smartbinding 
     * element
     * 
     * #### Example
     * 
     * ```xml
     *  <a:smartbinding id="sbExample" bindings="bndExample" />
     * ```
     * @see element.dragdrop
     * @see term.smartbinding
     *
     * @attribute {String} model    the id of the model element that provides 
     * the data for all elements connected to this smartbinding element.
     * 
     * #### Example
     * 
     * ```xml
     *  <a:smartbinding id="sbExample" model="mdlExample" />
     * ```
     * @see element.model
     * @see term.smartbinding
     *
     * @define bindings element containing all the binding rules for the data 
     * bound elements referencing this element.
     * 
     * #### Example
     * 
     * ```xml
     *  <a:bindings id="bndFolders" >
     *      <a:caption match="[@name]" />
     *      <a:icon match="[@icon]" />
     *      <a:each match="[folder]" sort="[@name]" />
     *  </a:bindings>
     *
     *  <a:tree bindings="bndFolders" />
     * ```
     * @see element.smartbinding
     * @allowchild {bindings}
     * @addnode smartbinding, global
     * @addnode smartbinding, global
     */
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (this.parentNode.hasFeature(apf.__DATABINDING__))
            this.register(this.parentNode);

        //#ifdef __DEBUG
        apf.console.info(this.name
            ? "Creating SmartBinding [" + this.name + "]"
            : "Creating implicitly assigned SmartBinding");
        //#endif
    });
}).call(apf.smartbinding.prototype = new apf.AmlElement());

apf.aml.setElement("smartbinding", apf.smartbinding);
// #endif
