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
 * @term smartbinding Smartbinding is a type of bidirectional databinding where 
 * rules specify how data is rendered in a component <i>and</i> how changes to
 * the bound data are sent back to the server (or other data source). 
 * Smartbindings are specifically designed to solve the problem of databinding
 * for Ajax applications that connect to remote (non-local) datasources.
 * A j:smartbinding element can contain three elements; {@link element.bindings j:bindings}, 
 * {@link element.actions j:actions} and {@link element.model j:model}.
 *
 * See also more information about {@link term.binding binding rules} and
 * {@link term.action action rules}.
 *
 * Model:
 * The model is the place where your xml data resides. Data is loaded into the
 * model using a {@link term.datainstruction data instruction} as the following
 * example shows:
 * <code>
 *  <j:model load="url:get_person.php?id=10" />
 * </code>
 * An element can connect directly to a model in order to bind to data.
 * <code>
 *  <j:model id="mdlExample" />
 *  <j:tree model="mdlExample" />
 * </code>
 *
 * The model can also be part of a smartbinding that is used by the element. 
 * A smartbinding can be used by multiple elements referenced by id:
 * <code>
 *  <j:smartbinding id="sbExample">
 *      <j:model />
 *      ...
 *  </j:smartbinding>
 *  <j:tree smartbinding="sbExample" />
 * </code>
 *
 * Bindings:
 * The bindings element is a container for binding rules. Binding rules determine
 * how an element renders the data that it's bound to. Some binding rules specify
 * how data can be interacted with (i.e. {@link baseclass.multiselect.binding.select the select rule}).
 * Check the {@link term.binding term binding rules} for more information.
 *
 * Actions:
 * The actions element is a container for action rules. Action rules influence 
 * and trigger several parts of the user interaction. 
 * <ol>
 *  <li>It determines whether a user action can be executed on the bound and/or 
 *      selected {@link term.datanode data node}.</li>
 *  <li>It dispatches events, before and after the data is changed.</li>
 *  <li>It creates a {@link http://en.wikipedia.org/wiki/Command_pattern command object} 
 *      that is pushed on the undo stack of the {@link element.actiontracker actiontracker} 
 *      connected to the element that triggered the action.</li>
 *  <li>The command object contains all the information to send the change back 
 *      to the server</li>
 * </ol>
 * So in short, an action rule is always triggered by the user, creates an 
 * undo item and sends the change back to the server.
 * Check the {@link term.action term action rules} for more information.
 *
 * See:
 * {@link baseclass.databinding.attribute.smartbinding}
 */

/**
 * @term binding Binding rules determine how an element displays the data that 
 * its bound to (ex.: {@link element.tree.binding.caption the caption rule}), 
 * and determines how it can be interacted with 
 * (ex.: {@link baseclass.multiselect.binding.select the select rule}).
 * Binding rules are part of the {@link term.smartbinding smartbinding concept}.
 * 
 * Basic:
 * Let's take a simple example, that of a {@link element.textbox textbox}. A 
 * textbox has a {@link element.textbox.attribute.value value attribute}. This
 * attribute can be set like this:
 * <code>
 *  <j:textbox value="The text" />
 * </code>
 * In many cases it's handy to bind the value of the textbox to data. Imagine
 * you are editing a contact's name in a textbox. In this case you would want to 
 * bind the value of the textbox to the xml data. The binding rule is configured
 * to determine this value based on the bound xml. Let's look at an example:
 * <code>
 *  <j:model id="mdlExample">
 *      <contact>
 *          <name>Test</name>
 *      </contact>
 *  </j:model>
 *
 *  <j:textbox model="mdlExample">
 *      <j:bindings>
 *          <j:value select="name" />
 *      </j:bindings>
 *  </j:textbox>
 * </code>
 * The textbox binds to the data of the model. The bind rule sets how the value
 * is retrieved from the bound data. In this case the value of the name node is
 * retrieved. <strong>When the user changes the value of the textbox, the name
 * node is updated with that value.</strong> Subsequently <strong>when the xml
 * changes the value of the textbox is updated</strong>.
 *
 * Each attribute on an element can be bound to data by using the attribute
 * name as the name of the binding rule. In the next example, the visible
 * attribute of a textbox is based on the availability of a {@link term.datanode data node}:
 * <code>
 *  <j:textbox>
 *      <j:bindings>
 *          <j:visible select="name" value="true" />
 *      </j:bindings>
 *  </j:textbox>
 * </code>
 * Each element has a primary bind rule that can be accessed in a short format.
 * This is usually the value bind rule. The short format works as follows:
 * <code>
 *  <j:textbox ref="name" model="mdlExample" />
 * </code>
 *
 * Advanced:
 * For multi node components databinding adds another conceptual step. The basics
 * stay the same, though a way is introduced to do 'foreach' on the data to 
 * determine which nodes are rendered. This is done using the 
 * {@link element.multiselectbinding.binding.traverse traverse binding rule} and
 * the selected nodes are called {@link term.traversenode traverse nodes}.
 *
 * When the set of traverse nodes is determined, each is rendered based on other
 * binding rules that determine whatever is deemed necesary by the component. 
 * This can be the caption, icon, tooltip, whether an item is seletable and so on.
 * In the next example a list is bound to some data representing a contact list.
 * Each contact's name is displayed as the caption of the item.
 * <code>
 *  <j:list>
 *      <j:bindings>
 *          <j:caption select="name" />
 *          <j:icon value="contact.png" />
 *          <j:tooltip select="company" />
 *          <j:traverse select="contact" />
 *      </j:bindings>
 *  </j:list>
 * </code>
 * 
 * Fallbacks:
 * By stacking multiple binding rules it's possible to define different ways to
 * determine the value for an attribute. Let's say we have a tree that displays
 * files and folders. A file and a folder can have custom icons. If these are 
 * not specified, they each default to an icon representing their type. This would
 * be encoded like this:
 * <code>
 *  <j:bindings>
 *      <j:icon select="@icon" />
 *      <j:icon select="self::folder" value="folder.png" />
 *      <j:icon select="self::file" value="file.png" />
 *  </j:bindings>
 * </code>
 *
 * Processors:
 * There are several ways to convert the data retrieved from the xml data into
 * the needed string or boolean. The following example uses {@link core.jpf.object.jsltImplementation jslt}
 * to determine the icon by the extension of the filename:
 * <code>
 *  <j:bindings>
 *      <j:icon select="."><![CDATA[
 *          [var ext = $'@filename'.split(".").pop();
 *           %ext == $'@filename' ? "unknown.png" : ext + ".png";]
 *      ]]></j:icon>
 *  </j:bindings>
 * </code>
 * Instead of jslt you can use xslt as well. Furthermore you can apply some
 * javascript to the result by calling a method. The following examples shows
 * a caption where a javascript method inserts smileys.
 * <code>
 *  <j:bindings>
 *      <j:caption select="body" method="insertSmileys" />
 *  </j:bindings>
 * </code>
 *
 * Extending:
 * Two special binding rules are the {@link baseclass.databinding.binding.load load}
 * and the {@link element.tree.binding.insert insert} bindings. These bindings
 * are used to load and insert new data into the data bound to the element that
 * uses them. With these rules an application can start out with only a bit of
 * data and when the user needs it extends the data. A simple example is that of
 * a tree element that loads subnodes whenever a user expands a node. This can
 * be achieved in the following way:
 * <code>
 *  <j:tree>
 *      <j:bindings>
 *          <j:caption select="@name" />
 *          <j:insert select = "self::category[not(@leaf)]" 
 *                    get    = "url:get_categories.php?parent={@id}" />
 *          <j:traverse select="category" />
 *      </j:bindings>
 *  </j:tree>
 * </code>
 * For more information about how data can be loaded into jml elements please
 * check {@link term.datainstruction data instructions}.
 */

/**
 * @term action Action rules determine whether a user can execute an action and
 * takes care of executing the change both locally and on a remote server. Each
 * triggered action creates an item on the undo stack.
 * Action rules are part of the {@link term.smartbinding smartbinding concept}.
 *
 * Syntax:
 * Actions are added to {@link element.actions}. The <i>select</i> attribute specifies
 * whether an action can be executed. The <i>set</i> attribute specifies how the change
 * to the data is send to the server. The following example shows a remove 
 * action on a datagrid. A jsp script is called to process the change. This is
 * specified using a {@link term.datainstruction data instruction}.
 * <code>
 *  <j:datagrid>
 *      <j:actions>
 *          <j:remove select = "self::contact[not(@readonly)]"
 *                    set    = "url:remove_contact.jsp?id={@dbid}" />
 *      </j:actions>
 *  </j:datagrid>
 * </code>
 *
 * Defaults:
 * The default behaviour for all components is to enable all actions when no
 * actions element has been assigned. This can be change by setting 
 * {@link element.appsettings.attribute.auto-disable-actions}. When a j:actions
 * element <i>is</i> assigned, all actions are disabled unless they are specified.
 * When the select attribute on an action is not set the action will always be
 * allowed. 
 * 
 * Flow:
 * Action rules influence and trigger several parts of the user interaction. 
 * <ol>
 *  <li>It determines whether a user action can be executed on the bound and/or 
 *      selected {@link term.datanode data node}.</li>
 *  <li>It dispatches events, before and after the data is changed.</li>
 *  <li>It creates a {@link http://en.wikipedia.org/wiki/Command_pattern command object} 
 *      that is pushed on the undo stack of the {@link element.actiontracker actiontracker} 
 *      connected to the element that triggered the action.</li>
 *  <li>The command object ({@link core.undodata UndoData}) contains all the 
 *      information to send the change back to the server.</li>
 * </ol>
 *
 * Fallbacks:
 * By stacking multiple action rules it's possible to define different ways to
 * deal with user actions. Let's say we have a tree that displays
 * files and folders. Renaming a file and a folder might have different handlers. 
 * This would be encoded like this:
 * <code>
 *  <j:actions>
 *      <j:rename select = "self::file"   
 *                set    = "url:rename_folder.php?path={@path}&name={@name}" />
 *      <j:rename select = "self::folder" 
 *                set    = "url:rename_file.php?path={@path}&name={@name}" />
 *  </j:actions>
 * </code>
 *
 * Undo:
 * When an action is execute it creates an entry on the undostack of an 
 * actiontracker. Undo can be triggered by calling the undo method.
 * <code>
 *  myTree.getActionTracker().undo();
 * </code>
 * Executing will revert the change to the data. This will also be communicated
 * to the server. In some cases the call to the server is not symmetric; the set
 * call cannot be used to revert. For these situations set the undo attribute.
 * <code>
 *  <j:actions>
 *      <j:remove set  = "url:remove.php?id={@id}"
 *                undo = "url:undo_remove.php?id={@id}" />
 *      </j:remove>
 *  </j:actions>
 * </code>
 * In the example above the server is required to support reverting remove. 
 * Another possibility is to add the item again as shown in this example:
 * <code>
 *  <j:actions>
 *      <j:remove set  = "url:remove.php?id={@id}"
 *                undo = "url:add.php?xml={.}" />
 *      </j:remove>
 *  </j:actions>
 * </code>
 *
 * Javascript:
 * Each action has a method associated with it that exists on the element that
 * the action rule is assigned to. The method has the same name as the action 
 * and can be called from javascript. For instance, the {@link baseclass.multiselect.binding.remove remove action}:
 * <code>
 *  myTree.remove();
 *  myTree.remove(dataNode);
 * </code>
 *
 * Add:
 * Adding {@link term.datanode data nodes} to an element is a bit more advanced because the origin of
 * the new data can be encoded in {@link baseclass.multiselect.binding.add the add action rule}. 
 * There are three ways to provide the data to add a node. 
 * 
 * The first is by calling the add method using javascript.
 * <code>
 *  <j:list id="myList">
 *      <j:actions>
 *          <j:add set="rpc:comm.addProduct({.})" />
 *      </j:actions>
 *  </j:list>
 *  <j:script>
 *      myList.add('<product name="USB drive" type="storage" />');
 *  </j:script>
 * </code>
 *
 * The second by specifying the template as a child of the add action rule:
 *  <j:actions>
 *      <j:add set="rpc:comm.addProduct({.})">
 *          <product name="USB drive" type="storage" />
 *      </j:add>
 *  </j:actions>
 *
 * The third way gets the added node from the server.
 * <code>
 *  <j:actions>
 *      <j:add get="rpc:comm.createNewProduct()" />
 *  </j:actions>
 * </code>
 *
 * Purging:
 * Sometimes it's necesary to not send the changes directly to the server. For
 * instance when the application offers a <i>save</i> button. To achieve this
 * set the {@link element.actiontracker.attribute.realtime realtime attribute}
 * of the actiontracker to false. The save button can call the 
 * {@link element.actiontracker.method.purge purge method} to have the 
 * actiontracker send the calls.
 * <code>
 *  <j:actiontracker id="myAt" realtime="false" />
 *  <j:list actiontracker="myAt" />
 *  <j:button onclick="myAt.purge()">Save</j:button>
 * </code>
 * N.B. At a certain amount of changes this way will become inefficient and 
 * you'll want to send the state of your data to the server directly. You can
 * do that like this:
 * <code>
 *  <j:list id="myList">
 *      <j:actions>
 *          <j:rename />
 *          <j:remove />
 *      </j:actions>
 *  </j:list>
 *  <j:button onclick="myList.getModel().submit('url:save.php', myList.xmlRoot)">
 *      Save
 *  </j:button>
 * </code>
 * See also {@link element.model.method.submit}.
 * 
 * Transactions:
 * A transaction is a 
 * set of changes to data which are treated as one change. When one of the 
 * changes in the set fails, all the changes will be cancelled. In the case of
 * a gui this is happens when a user decides to cancel after 
 * making several changes. A good example are the well known <i>Properties</i> 
 * windows with an ok, cancel and apply button. 
 *
 * When a user edits data, for instance user information, all the changes are
 * seen as one edit and put on the undo stack as a single action. Thus clicking
 * undo will undo the entire transaction, not just the last change done by that
 * user in the edit window. Transaction support both optimistic and pessimistic 
 * locking. For more information on transactions see {@link baseclass.transaction}.
 */
 
/**
 * @term datanode A data node is the term used for any xml node (attribute, 
 * element, textnode or otherwise) that is used in a databound context. So when
 * xml is loaded into a {@link element.model model} we refer to those xml nodes 
 * as data nodes.
 */
 
/**
 * Element containing information on how databound elements process data.
 * The {@link term.smartbinding smartbinding} element specifies how data is transformed and rendered 
 * in databound elements. It also specifies how changes on the bound data are 
 * send to their original data source ({@link element.actions actions}) and
 * which {@link term.datanode data nodes} can be dragged and dropped ({@link element.dragdrop dragdrop}).
 * Example:
 * A simple example of a smartbinding transforming data into representation
 * <code>
 *  <j:smartbinding id="sbUsers">
 *      <j:bindings>
 *          <j:caption select="text()" />
 *          <j:icon value="icoUser.png" />
 *          <j:traverse select="user" />
 *      </j:bindings>
 *  </j:smartbinding>
 * 
 *  <j:list smartbinding="sbUsers" />
 * </code>
 * Example:
 * This is an elaborate example showing how to create a filesystem tree with
 * files and folders in a tree. The smartbinding element describes how the
 * files and folders are transformed to tree elements and how actions within
 * the tree are sent to the data source. In this case {@link teleport.webdav WebDAV}
 * is used. The drag and drop rules specify which elements can be dragged and
 * where they can be dropped.
 * <code>
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
 * </code>
 * Remarks:
 * Each element has it's own set of binding rules it uses to render the data 
 * elements. The same goes for it's actions. To give an example, a slider has 
 * one action called 'change'. This action is called when then value of the 
 * slider changes. A tree element has several actions - among others: 'add',
 * 'remove', 'move', 'copy' and 'rename'. 
 * 
 * Smartbindings enable many other features in a Javeline PlatForm
 * application. Actions done by the user can be undone by calling 
 * {@link element.actiontracker.method.undo} of the element. The 
 * Remote Smartbinding element can send changes on data to other clients.
 *
 * This element is created especially for reuse. Multiple elements can reference
 * a single smartbinding element by setting the value of the 'smartbinding'
 * attribute to the ID of this smartbinding element. If an element is only used
 * for a single other element it can be set as it's child. In fact, each of the
 * children of the smartbinding element can exist outside the smartbinding
 * element and referenced indepently.
 * Example:
 * This example shows a smartbinding element which references to its children as
 * stand alone elements.
 * <code>
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
 * </code>
 * Example:
 * This example shows the children of the smartbinding directly as a children of
 * the element that they apply to.
 * <code>
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
 * </code>
 * Example:
 * The shortest method to add binding rules to an element is as follows:
 * <code>
 *  <j:tree traverse="file|folder" caption="@name" icon="@icon" />
 * </code>
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
     * @param  {mixed}  xmlNode the {@link term.datanode data node} loaded into
     * the model of this smartbinding element. This can be an XMLElement, a 
     * string or null. 
     * @private
     */
    this.load = function(xmlNode){
        this.setModel(new jpf.model().load(xmlNode));
    };
    
    /**
     * @private
     *
     * @attribute {String} bindings the id of the bindings element that contains 
     * the {@link term.binding binding rules} for all elements connected to 
     * this smartbinding element
     * Example:
     * <code>
     *  <j:smartbinding id="sbExample" bindings="bndExample" />
     * </code>
     * @see element.bindings
     * @see term.binding
     * @see term.smartbinding
     *
     * @attribute {String} actions  the id of the actions element that provides 
     * the {@link term.action action rules} for all elements connected to 
     * this smartbinding element
     * Example:
     * <code>
     *  <j:smartbinding id="sbExample" bindings="actExample" />
     * </code>
     * @see element.actions
     * @see term.action
     * @see term.smartbinding
     *
     * @attribute {String} dragdrop the id of the dragdrop element that provides 
     * the drag and drop rules for all elements connected to this smartbinding 
     * element
     * Example:
     * <code>
     *  <j:smartbinding id="sbExample" dragdrop="ddExample" />
     * </code>
     * @see element.dragdrop
     * @see term.smartbinding
     *
     * @attribute {String} model    the id of the model element that provides 
     * the data for all elements connected to this smartbinding element.
     * Example:
     * <code>
     *  <j:smartbinding id="sbExample" model="mdlExample" />
     * </code>
     * @see element.model
     * @see term.smartbinding
     *
     * @define bindings element containing all the binding rules for the data 
     * bound elements referencing this element.
     * Example:
     * <code>
     *  <j:bindings id="bndFolders" >
     *      <j:caption select="@name" />
     *      <j:icon select="@icon" />
     *      <j:traverse select="folder" sort="@name" />
     *  </j:bindings>
     *
     *  <j:tree bindings="bndFolders" />
     * </code>
     * @see element.smartbinding
     * @allowchild {bindings}
     * @addnode smartbinding, global
     * @define actions  element containing all the action rules for the data 
     * bound elements referencing this element.
     * Example:
     * <code>
     *  <j:actions id="actPerson" >
     *      <j:add set="rpc:comm.addPerson({.})">
     *          <person name="New person" />
     *      </j:add
     *      <j:rename set="rpc.comm.renamePerson({@id}, {@name})" />
     *      <j:remove select="@new" set="rpc:comm.removePerson({@id})"/>
     *  </j:actions>
     *
     *  <j:tree actions="actPerson" />
     * </code>
     * @allowchild {actions}
     * @addnode smartbinding, global
     * @define dragdrop element containing all the dragdrop rules for the data 
     * bound elements referencing this element.
     * Example:
     * This example shows drag and drop rules for a tree with person and
     * office elements. A person can be dragged to an office. An office can be
     * dragged but not dropped within this element. Possible an other element
     * does allow receiving an office element.
     * <code>
     *  <j:dragdrop>
     *      <j:allow-drag select="person|office" /> 
     *      <j:allow-drop select="person" target="office" 
     *          operation="tree-append" copy-condition="event.ctrlKey" /> 
     *  </j:dragdrop>
     * </code>
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

