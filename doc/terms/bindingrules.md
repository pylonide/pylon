# Binding Rules

Binding rules determine how an element displays the data that 
 its bound to (for example, the caption rule), 
 and determines how it can be interacted with 
 (for example, the select rule).

 Binding rules are part of the [smartbinding concept](./smartbinding.html).
 

 Let's take a simple example, that of a [textbox](./textbox.html). A 
 textbox has a `value` attribute. This
 attribute can be set like this:

```xml
  <a:textbox value="The text" />
```

 In many cases it's handy to bind the value of the textbox to data. Imagine
 you are editing a contact's name in a textbox. In this case you would want to 
 bind the value of the textbox to the XML data. The binding rule is configured
 to determine this value based on the bound XML. Let's look at an example:

```xml
  <a:model id="mdlExample">
      <contact>
          <name>Test</name>
      </contact>
  </a:model>
  
  <a:textbox value="[mdlExample::name]" />
```

 The textbox binds to the data of the model. The bind rule sets how the value
 is retrieved from the bound data. In this case the value of the name node is
 retrieved. **When the user changes the value of the textbox, the name
 node is updated with that value.** Subsequently **when the XML
 changes the value of the textbox is updated**.

 Each attribute on an element can be bound to data by using the attribute
 name as the name of the binding rule. In the next example, the visible
 attribute of a textbox is based on the availability of a [data node](./datanode.html):
 
```xml
  <a:model>
      <data name="false" />
  </a:model>
  
  <a:textbox visible="[@name]" value="Text" />
```

 Each element has a primary bind rule that can be accessed in a short format.
 This is usually the value bind rule. The short format works as follows:

```xml
  <a:model id="mdlExample">
      <contact>
          <name>Test</name>
      </contact>
  </a:model>
  <a:textbox value="[name]" model="mdlExample" />
```

## Advanced

 For multi node components databinding adds another conceptual step. The basics
 stay the same, though a way is introduced to do 'foreach' on the data to 
 determine which nodes are rendered. This is done using the each binding rule and
 the selected nodes are called each nodes.

 When the set of each nodes is determined, each is rendered based on other
 binding rules that determine whatever is deemed necesary by the component. 
 This can be the caption, icon, tooltip, whether an item is seletable and so on.
 In the next example a list is bound to some data representing a contact list.
 Each contact's name is displayed as the caption of the item.
 
 ```xml
  <a:model id="mdlSmart1">
      <data>
          <contact>
              <name>Ruben</name>
              <company>Javeline</company>
          </contact>
          <contact>
              <name>Łukasz</name>
              <company>Javeline</company>
          </contact>
      </data>
  </a:model>
  <a:list model="mdlSmart1">
      <a:bindings>
          <a:caption value="[name]" />
          <a:icon value="contact.png" />
          <a:each match="[contact]" />
      </a:bindings>
  </a:list>
 ```
 
## Fallbacks

 By stacking multiple binding rules it's possible to define different ways to
 determine the value for an attribute. Let's say we have a tree that displays
 files and folders. A file and a folder can have custom icons. If these are 
 not specified, they each default to an icon representing their type. This would
 be encoded like this:
 
 ```xml
  <a:model id="mdlSmart1">
      <data>
          <folder caption="folder 1">
              <file caption="file 1" />
              <file caption="file 2" />
              <file caption="unknown" icon="icoAnything.gif" />
          </folder>
      </data>
  </a:model>
  <a:tree model="mdlSmart1">
      <a:bindings>
          <a:caption value="[@caption]" />
          <a:icon match="[@icon]" />
          <a:icon match="[folder]" value="Famfolder.gif" />
          <a:icon match="[file]" value="icoEmpty.png" />
          <a:each match="[folder|file]" />
      </a:bindings>
  </a:tree>
 ```

## Processors

 There are several ways to convert the data retrieved from the xml data into
 the needed string or boolean. The following example uses [live markup](./livemarkup.html)
 to determine the icon by the extension of the filename:
 
 ```xml
  <a:model id="mdlSmart1">
      <data>
          <contact>
              <name>Ruben</name>
              <filename>Baseclasses</filename>
          </contact>
          <contact>
              <name>Łukasz</name>
              <filename>application.png</filename>
          </contact>
      </data>
  </a:model>
  <a:list model="mdlSmart1">
      <a:bindings>
          <a:caption value="[name]" />
          <a:icon><?lm
              var ext = {[filename].split(".").shift()};
              ext == [filename] ? "unknown.png" : ext + ".png";
          ?></a:icon>
          <a:each match="[contact]" />
      </a:bindings>
  </a:list>
 ```

 Instead of live markup you can use xslt as well. Furthermore you can apply some
 javascript to the result by calling a method. The following examples shows
 a caption where a javascript method inserts smileys.
 
 ```xml
  <a:model id="mdlSmart1">
      <data>
          <file caption="file 1" />
          <file caption="file 2" />
      </data>
  </a:model>
  <a:tree model="mdlSmart1" height="100">
      <a:script>
          function insertSmileys(value) {
              //do something with value
              return value;
          }
      </a:script>
      <a:bindings>
          <a:caption value="{insertSmileys([@caption])}" />
          <a:each match="[file]" />
      </a:bindings>
  </a:tree>
 ```

## Extending

 Two special binding rules are the load
 and the insert bindings. These bindings
 are used to load and insert new data into the data bound to the element that
 uses them. With these rules an application can start out with only a bit of
 data and when the user needs it extends the data. A simple example is that of
 a tree element that loads subnodes whenever a user expands a node. This can
 be achieved in the following way:
 
 ```xml
  <a:model id="mdlSmart2">
      <data>
          <group name="Group 1">
              <user name="User 1" id="1" leaf="long"></user>
              <user name="User 2" id="2"></user>
          </group>
          <group name="Group 2">
              <user name="User 3" id="3" leaf="long"></user>
              <user name="User 4" id="4"></user>
          </group>
      </data>
  </a:model>
  
  <a:tree model="mdlSmart2">
      <a:bindings>
          <a:caption match="[@name]" />
          <a:insert  
            match = "[user[not(@leaf)]]" 
            get   = "http://localhost/get_person.php?id=[@id]" />
          <a:each match="[user|group]" />
      </a:bindings>
  </a:tree>
```

 For more information about how data can be loaded into aml elements please
 check [data instructions](./datainstruction.html).