# Smartbinding

Smartbinding is a type of bidirectional databinding where 
rules specify how data is rendered in a component _and_ how changes to
the bound data are sent back to the server (or other data source). 

Smartbindings are specifically designed to solve the problem of databinding
for Ajax applications that connect to remote (non-local) datasources.

A smartbinding element can contain three elements: bindings, actions, and models.

See also more information about [binding rules](./binding.html) and [action rules](./action.html).

## Model:

The model is the place where your xml data resides. Data is loaded into the
model using a [data instruction](./datainstruction.html) as the following
example shows:

```xml
 <a:model src="get_person.php?id=10" />
```

An element can connect directly to a model in order to bind to data.

```xml
 <a:model id="mdlExample" />
 <a:tree model="mdlExample" />
```

The model can also be part of a smartbinding that is used by the element. 
A smartbinding can be used by multiple elements referenced by id:

```xml
 <a:smartbinding id="sbExample">
     <a:model id="mdlList" src="http://localhost/get_person.php?id=10" />
     <a:bindings>
         <a:caption match="[@name]" />
         <a:each match="[user]"/>
     </a:bindings>
 </a:smartbinding>

 <a:list width="300" smartbinding="sbExample" />
```

## Bindings

The bindings element is a container for binding rules. Binding rules determine
how an element renders the data that it's bound to. Some binding rules specify
how data can be interacted with (_i.e._, the `select` rule).
Check the [binding rules page](./binding_rules.html) for more information.

## Actions

The actions element is a container for action rules. Action rules influence 
and trigger several parts of the user interaction. 

* It determines whether a user action can be executed on the bound and/or 
     selected [data node](./datanode.html).
* It dispatches events, before and after the data is changed.
* It creates a [command object](http://en.wikipedia.org/wiki/Command_pattern)
     that is pushed on the undo stack of the [action tracker](./actiontracker.html)
     connected to the element that triggered the action.
* The command object contains all the information to send the change back 
     to the server

In short, an action rule is always triggered by the user, creates an 
undo item and sends the change back to the server.