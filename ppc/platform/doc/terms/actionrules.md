# Action Rules

Action rules determine whether a user can execute an action and
takes care of executing the change both locally and on a remote server. Each
triggered action creates an item on the undo stack.
Action rules are part of the [smartbinding concept](./smartbinding.html).

## Syntax

Actions are added to [`apf.actions`](./actions.html). The `select` attribute specifies
whether an action can be executed. The `set` attribute specifies how the change
to the data is send to the server. The following example shows a remove 
action on a datagrid. A jsp script is called to process the change. This is
specified using a [data instruction](./datainstruction.html).

```xml
 <a:datagrid>
     <a:actions>
         <a:remove 
           match = "[contact[not(@readonly)]]" 
           set   = "php/remove_contact.php?id=[@id]" />
     </a:actions>
 </a:datagrid>
```

## Defaults

The default behaviour for all components is to enable all actions when no
actions element has been assigned. This can be change by setting the appsettings to `auto-disable-actions`. When an actions
element _is_ assigned, all actions are disabled unless they are specified.
When the select attribute on an action is not set the action will always be
allowed. 

## Flow:
Action rules influence and trigger several parts of the user interaction. 

1. It determines whether a user action can be executed on the bound and/or 
     selected [data node](./datanode.html)
2. It dispatches events, before and after the data is changed.
3. It creates a [command object](http://en.wikipedia.org/wiki/Command_pattern)
     that is pushed on the undo stack of the `apf.actiontracker`
     connected to the element that triggered the action.
4. The command object (`apf.UndoData`) contains all the 
     information to send the change back to the server.

## Fallbacks:

By stacking multiple action rules it's possible to define different ways to
deal with user actions. Let's say we have a tree that displays
files and folders. Renaming a file and a folder might have different handlers. 
This would be encoded like this:

```xml
 <a:tree 
   id             = "tree" 
   height         = "200" 
   width          = "250"
   model          = "filesystem.xml"
   actiontracker  = "atExample"
   startcollapsed = "false" 
   onerror        = "alert('Sorry this action is not permitted');return false">
     <a:each match="[folder|drive]">
         <a:caption match="[@caption]" />
         <a:icon value="Famfolder.gif" />
     </a:each>
     <a:rename match = "[file]"   
               set    = "rename_folder.php?id=[@fid]" />
     <a:rename match = "[folder]" 
               set    = "rename_file.php?id=[@fid]" />
</a:tree>
      
<a:button 
  caption = "Rename"
  right   = "10" 
  top     = "10"
  onclick = "tree.startRename()" />
<a:button onclick="tree.getActionTracker().undo();">Undo</a:button>
```

## Undo
When an action is execute it creates an entry on the undostack of an 
actiontracker. Undo can be triggered by calling the undo method.

```javascript
 myTree.getActionTracker().undo();
 //or
 ActionTracker.undo();
```

Executing will revert the change to the data. This will also be communicated
to the server. In some cases the call to the server is not symmetric; the set
call cannot be used to revert. For these situations set the undo attribute.

```xml
 <a:tree id="tree" height="200" width="250"
   model          = "filesystem.xml"
   actiontracker  = "atExample"
   startcollapsed = "false" 
   onerror        = "alert('Sorry this action is not permitted');return false">
     <a:each match="[folder|drive]">
         <a:caption match="[@caption]" />
         <a:icon value="Famfolder.gif" />
     </a:each>
     <a:remove set  = "remove.php?id=[@fid]"
               undo = "undo_remove.php?id=[@fid]">
     </a:remove>
 </a:tree>
 <a:button onclick="tree.getActionTracker().undo();">Undo</a:button>
 <a:button onclick="tree.remove();">Remove</a:button>
```

In the example above the server is required to support reverting remove. 
Another possibility is to add the item again as shown in this example:

```xml
 <a:remove set  = "remove.php?id=[@id]"
           undo = "add.php?xml=[.]">
 </a:remove>
```

## Javascript

Each action has a method associated with it that exists on the element that
the action rule is assigned to. The method has the same name as the action 
and can be called from javascript:

```javascript
 myTree.remove();
 myTree.remove(dataNode);
```

## Add

Adding [data nodes](./datanode.html) to an element is a bit more advanced because the origin of
the new data can be encoded in the add action rule. 

There are three ways to provide the data to add a node. 

The first is by calling the `add` method using Javascript.

```xml
 <a:list id="myList">
     <a:add set="{comm.addProduct([.])}" />
 </a:list>
 <a:script>
     myList.add('<product name="USB drive" type="storage" />');
 </a:script>
```

The second is by specifying the template as a child of the add action rule:

```xml
 <a:add set="{comm.addProduct([.])}">
     <product name="USB drive" type="storage" />
 </a:add>
```

The third way gets the added node from the server.

```xml
 <a:rpc id="comm" protocol="cgi">
     <a:method 
       name = "createNewProduct" 
       url  = "http://yourserver.com/create_product.php" />
 </a:rpc>
 <a:list id="myList" width="200">
     <a:bindings>
         <a:caption match="[text()]" />
         <a:value match="[text()]" />
         <a:each match="[product]" />
     </a:bindings>
     <a:add get="{comm.createNewProduct()}" />
     <a:model>
         <data>
             <product>LCD Panel</product>
         </data>
     </a:model>
 </a:list>
 <a:button onclick="myList.add()">Add product</a:button>
```

## Purging

Sometimes, it's necesary to not send the changes directly to the server. For
instance when the application offers a _save_ button. To achieve this
set the [realtime attribute](./actiontracker.html#realtime)
of the actiontracker to zfalsez. The save button can call [`purge()`](./actiontracker.html#purge)
to have the 
actiontracker send the calls.

```xml
 <a:actiontracker id="myAt" realtime="false" />
 <a:list actiontracker="myAt" />
 <a:button onclick="myAt.purge()">Save</a:button>
```

At a certain amount of changes this way will become inefficient and 
you'll want to send the state of your data to the server directly. You can
do that like this:

```xml
 <a:list id="myList" width="200">
     <a:bindings>
         <a:caption match="[text()]" />
         <a:value match="[text()]" />
         <a:each match="[product]" />
     </a:bindings>
     <a:model>
         <data>
             <product>LCD Panel</product>
         </data>
     </a:model>
     <a:rename />
     <a:remove />
 </a:list>
 <a:button onclick="myList.getModel().submit('save.php', myList.xmlRoot)">
     Save
 </a:button>
```

## Transactions

A transaction is a 
set of changes to data which are treated as one change. When one of the 
changes in the set fails, all the changes will be cancelled. In the case of
a gui this is happens when a user decides to cancel after 
making several changes. A good example are the well known _Properties_
windows with an ok, cancel and apply button. 

When a user edits data, for instance user information, all the changes are
seen as one edit and put on the undo stack as a single action. Thus clicking
undo will undo the entire transaction, not just the last change done by that
user in the edit window. Transaction support both optimistic and pessimistic 
locking. 