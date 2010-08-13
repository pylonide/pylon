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
 * A smartbinding element can contain three elements; {@link element.bindings bindings}, 
 * {@link element.actions actions} and {@link element.model model}.
 *
 * See also more information about {@link term.binding binding rules} and
 * {@link term.action action rules}.
 *
 * Model:
 * The model is the place where your xml data resides. Data is loaded into the
 * model using a {@link term.datainstruction data instruction} as the following
 * example shows:
 * <code>
 *  <a:model src="get_person.php?id=10" />
 * </code>
 * An element can connect directly to a model in order to bind to data.
 * <code>
 *  <a:model id="mdlExample" />
 *  <a:tree model="mdlExample" />
 * </code>
 *
 * The model can also be part of a smartbinding that is used by the element. 
 * A smartbinding can be used by multiple elements referenced by id:
 * <code>
 *  <a:smartbinding id="sbExample">
 *      <a:model id="mdlList" src="http://localhost/get_person.php?id=10" />
 *      <a:bindings>
 *          <a:caption match="[@name]" />
 *          <a:each match="[user]"/>
 *      </a:bindings>
 *  </a:smartbinding>
 *
 *  <a:list width="300" smartbinding="sbExample" />
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
 *  <a:textbox value="The text" />
 * </code>
 * In many cases it's handy to bind the value of the textbox to data. Imagine
 * you are editing a contact's name in a textbox. In this case you would want to 
 * bind the value of the textbox to the xml data. The binding rule is configured
 * to determine this value based on the bound xml. Let's look at an example:
 * <code>
 *  <a:model id="mdlExample">
 *      <contact>
 *          <name>Test</name>
 *      </contact>
 *  </a:model>
 *  
 *  <a:textbox value="[mdlExample::name]" />
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
 *  <a:model>
 *      <data name="false" />
 *  </a:model>
 *  
 *  <a:textbox visible="[@name]" value="Text" />
 * </code>
 * Each element has a primary bind rule that can be accessed in a short format.
 * This is usually the value bind rule. The short format works as follows:
 * <code>
 *  <a:model id="mdlExample">
 *      <contact>
 *          <name>Test</name>
 *      </contact>
 *  </a:model>
 *  <a:textbox value="[name]" model="mdlExample" />
 * </code>
 *
 * Advanced:
 * For multi node components databinding adds another conceptual step. The basics
 * stay the same, though a way is introduced to do 'foreach' on the data to 
 * determine which nodes are rendered. This is done using the 
 * {@link element.multiselectbinding.binding.each each binding rule} and
 * the selected nodes are called {@link term.eachnode each nodes}.
 *
 * When the set of each nodes is determined, each is rendered based on other
 * binding rules that determine whatever is deemed necesary by the component. 
 * This can be the caption, icon, tooltip, whether an item is seletable and so on.
 * In the next example a list is bound to some data representing a contact list.
 * Each contact's name is displayed as the caption of the item.
 * <code>
 *  <a:model id="mdlSmart1">
 *      <data>
 *          <contact>
 *              <name>Ruben</name>
 *              <company>Javeline</company>
 *          </contact>
 *          <contact>
 *              <name>Łukasz</name>
 *              <company>Javeline</company>
 *          </contact>
 *      </data>
 *  </a:model>
 *  <a:list model="mdlSmart1">
 *      <a:bindings>
 *          <a:caption value="[name]" />
 *          <a:icon value="contact.png" />
 *          <a:each match="[contact]" />
 *      </a:bindings>
 *  </a:list>
 * </code>
 * 
 * Fallbacks:
 * By stacking multiple binding rules it's possible to define different ways to
 * determine the value for an attribute. Let's say we have a tree that displays
 * files and folders. A file and a folder can have custom icons. If these are 
 * not specified, they each default to an icon representing their type. This would
 * be encoded like this:
 * <code>
 *  <a:model id="mdlSmart1">
 *      <data>
 *          <folder caption="folder 1">
 *              <file caption="file 1" />
 *              <file caption="file 2" />
 *              <file caption="unknown" icon="icoAnything.gif" />
 *          </folder>
 *      </data>
 *  </a:model>
 *  <a:tree model="mdlSmart1">
 *      <a:bindings>
 *          <a:caption value="[@caption]" />
 *          <a:icon match="[@icon]" />
 *          <a:icon match="[folder]" value="Famfolder.gif" />
 *          <a:icon match="[file]" value="icoEmpty.png" />
 *          <a:each match="[folder|file]" />
 *      </a:bindings>
 *  </a:tree>
 * </code>
 *
 * Processors:
 * There are several ways to convert the data retrieved from the xml data into
 * the needed string or boolean. The following example uses {@link term.livemarkup live markup}
 * to determine the icon by the extension of the filename:
 * <code>
 *  <a:model id="mdlSmart1">
 *      <data>
 *          <contact>
 *              <name>Ruben</name>
 *              <filename>Baseclasses</filename>
 *          </contact>
 *          <contact>
 *              <name>Łukasz</name>
 *              <filename>application.png</filename>
 *          </contact>
 *      </data>
 *  </a:model>
 *  <a:list model="mdlSmart1">
 *      <a:bindings>
 *          <a:caption value="[name]" />
 *          <a:icon><?lm
 *              var ext = {[filename].split(".").shift()};
 *              ext == [filename] ? "unknown.png" : ext + ".png";
 *          ?></a:icon>
 *          <a:each match="[contact]" />
 *      </a:bindings>
 *  </a:list>
 * </code>
 * Instead of live markup you can use xslt as well. Furthermore you can apply some
 * javascript to the result by calling a method. The following examples shows
 * a caption where a javascript method inserts smileys.
 * <code>
 *  <a:model id="mdlSmart1">
 *      <data>
 *          <file caption="file 1" />
 *          <file caption="file 2" />
 *      </data>
 *  </a:model>
 *  <a:tree model="mdlSmart1" height="100">
 *      <a:script>
 *          function insertSmileys(value) {
 *              //do something with value
 *              return value;
 *          }
 *      </a:script>
 *      <a:bindings>
 *          <a:caption value="{insertSmileys([@caption])}" />
 *          <a:each match="[file]" />
 *      </a:bindings>
 *  </a:tree>
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
 *  <a:model id="mdlSmart2">
 *      <data>
 *          <group name="Group 1">
 *              <user name="User 1" id="1" leaf="long"></user>
 *              <user name="User 2" id="2"></user>
 *          </group>
 *          <group name="Group 2">
 *              <user name="User 3" id="3" leaf="long"></user>
 *              <user name="User 4" id="4"></user>
 *          </group>
 *      </data>
 *  </a:model>
 *  
 *  <a:tree model="mdlSmart2">
 *      <a:bindings>
 *          <a:caption match="[@name]" />
 *          <a:insert  
 *            match = "[user[not(@leaf)]]" 
 *            get   = "http://localhost/get_person.php?id=[@id]" />
 *          <a:each match="[user|group]" />
 *      </a:bindings>
 *  </a:tree>
 * </code>
 * For more information about how data can be loaded into aml elements please
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
 *  <a:datagrid>
 *      <a:actions>
 *          <a:remove 
 *            match = "[contact[not(@readonly)]]" 
 *            set   = "php/remove_contact.php?id=[@id]" />
 *      </a:actions>
 *  </a:datagrid>
 * </code>
 *
 * Defaults:
 * The default behaviour for all components is to enable all actions when no
 * actions element has been assigned. This can be change by setting 
 * {@link element.appsettings.attribute.auto-disable-actions}. When a actions
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
 *  <a:tree 
 *    id             = "tree" 
 *    height         = "200" 
 *    width          = "250"
 *    model          = "filesystem.xml"
 *    actiontracker  = "atExample"
 *    startcollapsed = "false" 
 *    onerror        = "alert('Sorry this action is not permitted');return false">
 *      <a:each match="[folder|drive]">
 *          <a:caption match="[@caption]" />
 *          <a:icon value="Famfolder.gif" />
 *      </a:each>
 *      <a:rename match = "[file]"   
 *                set    = "rename_folder.php?id=[@fid]" />
 *      <a:rename match = "[folder]" 
 *                set    = "rename_file.php?id=[@fid]" />
 * </a:tree>
 *       
 * <a:button 
 *   caption = "Rename"
 *   right   = "10" 
 *   top     = "10"
 *   onclick = "tree.startRename()" />
 * <a:button onclick="tree.getActionTracker().undo();">Undo</a:button>
 * </code>
 *
 * Undo:
 * When an action is execute it creates an entry on the undostack of an 
 * actiontracker. Undo can be triggered by calling the undo method.
 * <code>
 *  myTree.getActionTracker().undo();
 *  //or
 *  ActionTracker.undo();
 * </code>
 * Executing will revert the change to the data. This will also be communicated
 * to the server. In some cases the call to the server is not symmetric; the set
 * call cannot be used to revert. For these situations set the undo attribute.
 * <code>
 *  <a:tree id="tree" height="200" width="250"
 *    model          = "filesystem.xml"
 *    actiontracker  = "atExample"
 *    startcollapsed = "false" 
 *    onerror        = "alert('Sorry this action is not permitted');return false">
 *      <a:each match="[folder|drive]">
 *          <a:caption match="[@caption]" />
 *          <a:icon value="Famfolder.gif" />
 *      </a:each>
 *      <a:remove set  = "remove.php?id=[@fid]"
 *                undo = "undo_remove.php?id=[@fid]">
 *      </a:remove>
 *  </a:tree>
 *  <a:button onclick="tree.getActionTracker().undo();">Undo</a:button>
 *  <a:button onclick="tree.remove();">Remove</a:button>
 * </code>
 * In the example above the server is required to support reverting remove. 
 * Another possibility is to add the item again as shown in this example:
 * <code>
 *  <a:remove set  = "remove.php?id=[@id]"
 *            undo = "add.php?xml=[.]">
 *  </a:remove>
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
 *  <a:list id="myList">
 *      <a:add set="{comm.addProduct([.])}" />
 *  </a:list>
 *  <a:script>
 *      myList.add('<product name="USB drive" type="storage" />');
 *  </a:script>
 * </code>
 *
 * The second by specifying the template as a child of the add action rule:
 * <code>
 *  <a:add set="{comm.addProduct([.])}">
 *      <product name="USB drive" type="storage" />
 *  </a:add>
 * </code>
 * The third way gets the added node from the server.
 * <code>
 *  <a:rpc id="comm" protocol="cgi">
 *      <a:method 
 *        name = "createNewProduct" 
 *        url  = "http://yourserver.com/create_product.php" />
 *  </a:rpc>
 *  <a:list id="myList" width="200">
 *      <a:bindings>
 *          <a:caption match="[text()]" />
 *          <a:value match="[text()]" />
 *          <a:each match="[product]" />
 *      </a:bindings>
 *      <a:add get="{comm.createNewProduct()}" />
 *      <a:model>
 *          <data>
 *              <product>LCD Panel</product>
 *          </data>
 *      </a:model>
 *  </a:list>
 *  <a:button onclick="myList.add()">Add product</a:button>
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
 *  <a:actiontracker id="myAt" realtime="false" />
 *  <a:list actiontracker="myAt" />
 *  <a:button onclick="myAt.purge()">Save</a:button>
 * </code>
 * N.B. At a certain amount of changes this way will become inefficient and 
 * you'll want to send the state of your data to the server directly. You can
 * do that like this:
 * <code>
 *  <a:list id="myList" width="200">
 *      <a:bindings>
 *          <a:caption match="[text()]" />
 *          <a:value match="[text()]" />
 *          <a:each match="[product]" />
 *      </a:bindings>
 *      <a:model>
 *          <data>
 *              <product>LCD Panel</product>
 *          </data>
 *      </a:model>
 *      <a:rename />
 *      <a:remove />
 *  </a:list>
 *  <a:button onclick="myList.getModel().submit('save.php', myList.xmlRoot)">
 *      Save
 *  </a:button>
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
 * </code>
 * Example:
 * This is an elaborate example showing how to create a filesystem tree with
 * files and folders in a tree. The smartbinding element describes how the
 * files and folders are transformed to tree elements and how actions within
 * the tree are sent to the data source. In this case {@link teleport.webdav WebDAV}
 * is used. The drag and drop rules specify which elements can be dragged and
 * where they can be dropped.
 * <code>
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
 * </code>
 * Remarks:
 * Each element has it's own set of binding rules it uses to render the data 
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
 * Example:
 * This example shows a smartbinding element which references to its children as
 * stand alone elements.
 * <code>
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
 * </code>
 * Example:
 * The shortest method to add binding rules to an element is as follows:
 * <code>
 *  <a:tree each="[file|folder]" caption="[@name]" icon="[@icon]" />
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
     * Loads xml data in the model of this smartbinding element.
     * 
     * @param  {mixed}  xmlNode the {@link term.datanode data node} loaded into
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
    
    /**
     * @private
     *
     * @attribute {String} bindings the id of the bindings element that contains 
     * the {@link term.binding binding rules} for all elements connected to 
     * this smartbinding element
     * Example:
     * <code>
     *  <a:smartbinding id="sbExample" bindings="bndExample" />
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
     *  <a:smartbinding id="sbExample" actions="actExample" />
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
     *  <a:smartbinding id="sbExample" bindings="bndExample" />
     * </code>
     * @see element.dragdrop
     * @see term.smartbinding
     *
     * @attribute {String} model    the id of the model element that provides 
     * the data for all elements connected to this smartbinding element.
     * Example:
     * <code>
     *  <a:smartbinding id="sbExample" model="mdlExample" />
     * </code>
     * @see element.model
     * @see term.smartbinding
     *
     * @define bindings element containing all the binding rules for the data 
     * bound elements referencing this element.
     * Example:
     * <code>
     *  <a:bindings id="bndFolders" >
     *      <a:caption match="[@name]" />
     *      <a:icon match="[@icon]" />
     *      <a:each match="[folder]" sort="[@name]" />
     *  </a:bindings>
     *
     *  <a:tree bindings="bndFolders" />
     * </code>
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
