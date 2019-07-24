# Eachnode

An each node is a [data node](./datanode.html) that is in the set selected by the 
`each` binding rule}.

These data nodes get representation within the visual element. For instance
each item in a list is connected to such a each node. A each node
can be selected, removed, added, dragged, dropped and so on. 

## Example
In this example the person nodes that have the show attribute set to 1 are the 
each nodes of the list. This list will display three items.

```xml
 <a:list>
     <a:bindings>
         <a:caption match="[@name]" />
         <a:each match="[person[@show='1']]" />
     </a:bindings>
     <a:model>
         <data>
             <person name="test 5"/>
             <person show="1" name="test 3"/>
             <person name="test 4"/>
             <person show="1" name="test 2"/>
             <person show="1" name="test 1"/>
         </data>
     </a:model>
 </a:list>
```

## Remarks

A somewhat advanced topic is understanding how an element can use the 
each [binding rule](./bindingrule.html). For the tree, these binding rules
can be used to create a virtual tree mapping of the XML.
