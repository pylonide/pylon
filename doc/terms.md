

 @term propertybinding With property binding you can define the way a
 property is calculated. <img src="http://www.rubendaniels.com/images/propbind.gif" align="right" />
 This statement is usually based on a javascript
 expression including one or more properties on other objects. The value of
 the property will always be kept up to date. This means that when one of the
 dependent properties changes, the property is recalculated. See the picture
 for a graphical explanation.
 Example:
 Let me give you an example to make it a bit straightforward. This example
 sets the visibility of the slider based on the state of the checkbox.
 <code>
  <a:slider visible="{myCheckbox.value}" />
  <a:checkbox id="myCheckbox">Toggle this</a:checkbox>
 </code>

 #### Expressions
 
 The use of { and } tell Ajax.org Platform(APF) that the visible property will
 be bound. By specifying myCheckbox.value APF knows that the value of
 myCheckbox should be retrieved for this property. Whenever the checkbox
 changes, the slider will show or hide.

 #### Bidirectional

 Sometimes it's necessary to make a binding from one property to another one,
 and vice versa. Think of a slider that is connected to the position property
 of a video element. When the video plays, the value of the slider should be
 updated. When the slider is dragged the video should be updated. This works
 in the same way as above, but instead of using curly braces
 you use brackets: [ and ]. The next example keeps the state of a dropdown in
 sync with the state of the tab page.
 <code>
  <a:tab activepage="[myDropdown.value]">
     <a:page caption="Page 1" />
     <!-- etc -->
  </a:tab>
  <a:dropdown id="myDropdown">
     <a:item value="0">Page 1</a:item>
     <!-- etc -->
  </a:dropdown>
 </code>

 For more information visit {@link http://www.rubendaniels.com/2008/07/04/property-binding/ this blog article}.</a>

 Internals:
 Property binding in apf is a flavor of a {@link http://en.wikipedia.org/wiki/Publish/subscribe publish/subscribe}
 system. When a binding is established the element that receives the value sets
 a listener on the property of another element. There can be any number of
 elements referenced in a single expression. When any of the properties that
 are listened to change, the subscriber gets notified to update the value
 of it's property.
/


 @term baseclass A baseclass in Ajax.org Platform (apf) is a class that
 adds properties, methods, attributes, bindings and actions to the class that
 inherits from it. Javascript doesn't have most object oriented concepts like
 classes, class inheritance, interfaces, protected members and so on. When
 using apf you will find that some of these concepts have
 been implemented in a way that enables the core developers of apf to think in
 those concepts. The most important one is class inheritance. Because of the
 freedoms that javascript allows, it is possible to implement
 {@link http://en.wikipedia.org/wiki/Inheritance_(computer_science) inheritance}
 and even {@link http://en.wikipedia.org/wiki/Multiple_inheritance multiple inheritance}.

 Usage:
 In apf multiple inheritance is used on all elements to assign specific traits
 to aml elements. Check the list of baseclasses on the right to familiarize
 yourself with the traits that are available (i.e. dragdrop, rename, multiselect,
 databinding, alignment, etc). At the article of each element that inherits
 from a baseclass you will find an inheritance tree on the right. This tree
 will show you <strong>from which baseclasses that element has received traits</strong>.
 Compared to Java and other strict OOP languages, the inheritance tree is
 inverted. To give an example, in Java for instance, a Lamborghini inherits from
 Car which inherits from Vehicle. In apf Audi inherits from Engine, Wheels,
 Seats and Airco. So we can make the latest Lamborghini inherit from Airco too.

 Class:
 The apf.Class baseclass provides all basic features a apf element needs, such
 as event system, property binding and multiple inheritance with state defined
 by each baseclass.
 By setting the prototype of a function to an instance of apf.Class
 these  <i title="an inherited characteristic (merriam-webster)">traits</i> are
 transferred to your class.

 API:
 The first method is the one that tells an object to implement traits from a
 baseclass.
 It works as follows:
 <code>
  var myClass = function(){
      this.$init();
  }
  myClass.prototype = new apf.Class();
 </code>
 There is a class tree that you can use to create your own elements. For
 instance to create a visible element that uses skinning you can inherit from
 apf.Presentation:
 <code>
  var myElement = function(){
      this.$init();
  }
  myElement.prototype = new apf.Presentation();
 </code>
 Please find a full description of the inheritance tree below.

 To check whether an object has inherited from baseclass use the following
 syntax:
 <code>
  myObj.hasFeature(apf.__PRESENTATION__);
 </code>
 Where the constant is the name of the baseclass in all caps.

 Apf supports multiple inheritance. Use the implement method to add a
 baseclass to your class that is not part of the inheritance tree:
 <code>
  var myElement = function(){
      this.$init();

      this.implement(apf.Rename);
  }
  myElement.prototype = new apf.MultiSelect();
 </code>

 Inheritance Tree:
 <code>
  - apf.Class
      - apf.AmlNode
          - apf.AmlElement
              - apf.Teleport
              - apf.GuiElement
                  - apf.Presentation
                      - apf.BaseTab
                      - apf.DataBinding
                          - apf.StandardBinding
                              - apf.BaseButton
                              - apf.BaseSimple
                              - apf.Media
                          - apf.MultiselectBinding
                              - apf.MultiSelect
                                  - apf.BaseList
 </code>
 Generally elements inherit from AmlElement, Presentation, StandardBinding,
 MultiselectBinding, or one of the leafs.

 The following classes are implemented using the implement method:
 <code>
 - apf.Cache
 - apf.ChildValue
 - apf.LiveEdit
 - apf.DataAction
 - apf.Media
 - apf.MultiCheck
 - apf.Rename
 - apf.Xforms
 </code>

 The following classes are automatically implemented when needed by apf.GuiElement.
 <code>
 - apf.Anchoring
 - apf.DelayedRender
 - apf.DragDrop
 - apf.Focussable
 - apf.Interactive
 - apf.Transaction
 - apf.Validation
 </code>

 The following class is automatically implemented by apf.MultiselectBinding
 <code>
 - apf.VirtualViewport
 </code>


/**
 * @term datainstruction Data instructions offer a single and consistent way for
 * storing and retrieving
 * data from different data sources. For instance from a webserver using REST
 * or RPC, or from local data sources such as gears, air, o3, html5, as well as
 * from in memory sources from javascript or cookies. There is often an xml
 * element which is relevant to storing information. This element can be
 * accessed using xpath statements in the data instruction using curly braces.
 *
 *  - for complex model expr. replace model.
 *  - use property binding for selection, instead of setConnections
 *  <a:bar model="{tree.selected}">
 *      <a:textbox value="[persons/person/text]" />
 *      <a:textbox value="[persons/person/text1]" />
 *      <a:textbox value="[persons/person/text2]" />
 *      <a:textbox value="[persons/person/text3]" />
 *      <a:textbox value="[persons/person/text4]" />
 *  </a:bar>
 *  - create exec function for async objects
 *  - have list of async objects
 *
 * Syntax:
 * Using data instructions to retrieve data
 * <code>
 *  model="name_of_model"
 *  model="[name_of_model::xpath]"
 *  model="{element.selected}"
 *  model="[local(element.selected) {xpath}]"
 *  model="{element.choose}"
 *      model="[local(element.choose) {xpath}]"
 *      model="[local(element.root) {xpath}]"
 *      load="<specialtag>[comm.doCall([@id], test(), 5+10).xml]</specialtag>"
 *      get="example.jsp"
 *      get="http://www.bla.nl?blah=10&foo=[@bar]&example=[10+5]"
 *      get="{comm.submit('abc', [@bar])}"
 *      get="[local(comm.submit('abc', [@bar])) return [xpath]]"
 *      get="[submit('abc', [@bar])]"
 *      get="{xmpp.login(username, password)}"
 *      get="{webdav.getRoot()}"
 *      get="[10+5]"
 * </code>
 *
 * Syntax:
 * Using data instructions to store data
 * <code>
 *  set="http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
 *  set="post http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
 * <a:add set="[[@uid] = comm.addPerson('abc', {/bar})]" />
 *  set="[submit('abc', {/bar})]"
 *  set="[example=[@name]]"
 *  set="[apf.setcookie('something', [.])]"
 *  set="[o3.fs.get('/var/test.xml').data = [.]]"
 * </code>
 *
 * [
 *  function test(){
 *      var blah = comm.blah();
 *      return blah;
 *  }
 * ]
 * <a:add set="[test([.])]" />
 *
 * See:
 * <ul>
 *  <li>{@link teleport.cgi the cgi teleport module}</li>
 *  <li>{@link teleport.rpc the rpc teleport module}</li>
 *  <li>{@link teleport.webdav the webdav teleport module}</li>
 *  <li>{@link teleport.xmpp the xmpp teleport module}</li>
 * </ul>
 */


 /**
 * @term eachnode A each node is a {@link term.datanode data node} that is in the set selected by the 
 * {@link baseclass.multiselectbinding.binding.each each binding rule}.
 * These {@link term.datanode data nodes} get representation within the visual element. For instance
 * each item in a list is connected to such a each node. A each node
 * can be selected, removed, added, dragged, dropped and so on. 
 * Example:
 * In this example the person nodes that have the show attribute set to 1 are the 
 * each nodes of the list. This list will display three items.
 * <code>
 *  <a:list>
 *      <a:bindings>
 *          <a:caption match="[@name]" />
 *          <a:each match="[person[@show='1']]" />
 *      </a:bindings>
 *      <a:model>
 *          <data>
 *              <person name="test 5"/>
 *              <person show="1" name="test 3"/>
 *              <person name="test 4"/>
 *              <person show="1" name="test 2"/>
 *              <person show="1" name="test 1"/>
 *          </data>
 *      </a:model>
 *  </a:list>
 * </code>
 * Remarks:
 * A somewhat advanced topic is understanding how an element can use the 
 * each {@link term.binding binding rule}. For the tree this binding rules
 * can be used to create a virtual tree mapping of the xml.
 */

/**
 * @term caret When selecting nodes in a list using the keyboard, the caret is 
 * the indication of the position within that list. The item that the caret is
 * on might or might not be selected. This feature is especially useful when 
 * holding the control key or using the shift key to multi select items.
 */

 /**
     * @term locking {@link http://en.wikipedia.org/wiki/Lock_(computer_science) A lock}
     * is a mechanism for enforcing limits on access to a resource in a
     * multi-user environment. Locks are one way of enforcing concurrency
     * control policies. Ajax.org Platform (apf) has support for locking in
     * combination with {@link term.action action rules}. There are two
     * types of locks; pessimistic and optimistic locks. Descriptions below are
     * from {@link http://en.wikipedia.org/wiki/Lock_(computer_science) wikipedia}.
     *
     * Optimistic:
     * This allows multiple concurrent users access to the database whilst the
     * system keeps a copy of the initial-read made by each user. When a user
     * wants to update a record, the application determines whether another user
     * has changed the record since it was last read. The application does this
     * by comparing the initial-read held in memory to the database record to
     * verify any changes made to the record. Any discrepancies between the
     * initial-read and the database record violates concurrency rules and hence
     * causes the system to disregard any update request. An error message is
     * generated and the user is asked to start the update process again.
     * It improves database performance by reducing the amount of locking
     * required, thereby reducing the load on the database server. It works
     * efficiently with tables that require limited updates since no users are
     * locked out. However, some updates may fail. The downside is constant
     * update failures due to high volumes of update requests from multiple
     * concurrent users - it can be frustrating for users.
     *
     * For optimistic locking apf can run as if there would be no locking.
     * Changed data is sent to the server and is either successfully saved or
     * not. When the action isn't changed and the server returns an error code
     * the {@link element.actiontracker actiontracker} <strong>automatically
     * reverts the change</strong>.
     *
     * Pessimistic:
     * This is whereby a user who reads a record with the intention of updating
     * it, places an exclusive lock on the record to prevent other users from
     * manipulating it. This means no one else can manipulate that record until
     * the user releases the lock. The downside is that users can be locked out
     * for a long time thereby causing frustration.
     *
     * For pessimistic locking add the locking attribute to the {@link term.action action rules}
     * that need it. The following example shows a lock request for a rename
     * action on a file browser tree.
     * <code>
     *  <a:rename set="..." lock="{comm.lockFile([@path], unlock)}" />
     * </code>
     * The unlock variable is true when the lock needs to be released. This is
     * done when the action was cancelled after getting a lock. For instance
     * when the user presses escape while renaming.
     *
     * MultiUser:
     * In multi user environments it can be handy
     * to be signalled of changes by others within the application. For more
     * information on this please look at {@link element.remote}.
     *
     * Remarks:
     * During offline works pessimistic locks will always fail. If the application
     * does not use {@link element.remote remote smart bindings} the developer
     * should reload the part of the content for which the lock failed. See
     * {@link baseclass.databinding.event.lockfailed}.
     *
     * Note: APF understands the status codes specified in RFC4918 for the locking implementation
     *       {@link http://tools.ietf.org/html/rfc4918#section-9.10.6}
     */

/**
 * @term livemarkup
 * Live Markup is an extension to Javascript, and it allows APF to have
 * a simple consistent syntax for all attribute values and templates.
 * Live markup is used for templating, rpc, data binding,
 * property binding, formatting and even events.
 * Live Markup generates text-output via the default-output of statements,
 * and APF maintains knowledge of all properties and data used to create
 * this output allowing for a Live update when any of this information changes.
 * Nearly all attributes in APF are processed as a live markup " " string
 * Some attributes (like events) and <?lm ?> blocks are processed as code.
 * LiveMarkup features:
 * <ol>
 *  <li>inline xpaths</li>
 *  <li>E4X-like xml literals</li>
 *  <li>automatic statement/expression output and concat</li>
 *  <li>code and xpath expansion in-strings</li>
 *  <li>virtual-sync of async calls</li>
 * </ol>
 * Examples:
 * <code>
 *    var x = [folder/@name]; // value of xpath
 *    [folder/@name] = 'hello'; // set an attribute
 *    [folder/file] += <file/>; // add a new file node to folder/file list
 *    var y = <folder><file name={x}/></folder> // e4x-style xml
 *    x; //automatic output
 *    <xml/>; // automatic output
 *    if(a)func(); // automatic output of function returnvalue
 *    x = 15; // not outputted, assignments are never output.
 *    var z = "string with jsvars: {x} and xpath: [folder/@name]";
 *    alert(comm.someRpcCall(x)); // async call returns sync value
 * </code>
 * LiveMarkup syntax has one conflict with normal JS syntax; an array of 1 item vs xpath.
 * Arrays are recognised if there is atleast one , present: [1,2] and 1 item: [,1]
 *
 * Another important feature of LiveMarkup is that its infinitely nestable:
 * Outer construct: inner constructs
 * <ol>
 *  <li>string: xpath, code</li>
 *  <li>xpath: code, xpath(its a sub-xpath when NOT after [)\w] or IS inside "str" or 'str' )</li>
 *  <li>code: xpath, code, string, xml</li>
 *  <li>xml: xpath, code</li>
 * </ol>
 * Example of code in xpath in xml in code in string, for the sake of argument:
 * <code>
 * var x = "str{<xml id=[xp{y}]/>}"
 * </code>
 * since code has an auto-output, it is also possible to use scope { } delimiters holding a value
 * and used as an expression.
 * var x = {..code with auto output..}
 * The ^ character at the beginning of a statement can force 'no output' but is very rarely needed.
 *
 * It is important to realise that Live Markup is converted to normal Javascript
 * in a single compile pass, and does not constitute black-magic.
 * As rarely debugging might force you to look at generated code, its useful to know it exists.
 * For instance:
 * XML literals are turned into normal JS strings: <xml/> becomes "<xml/>"
 * in generated code. This is different from E4X where they are special type of object.
 * xpaths and operators are turned into functioncalls: [xpath] becomes _val(_n,"xpath")
 * and nesting becomes concatenation: "a{x}b" becomes ("str"+(x)+"str")
 *
 * Live markup xpath reference
 * Different xpath types:
 * [xpath] - value xpath (string)
 * %[xpath] - single node
 * *[xpath] - node set
 * #[xpath] - number of nodes selected by xpath
 * $[symbol] - language 'xpath', fetches value from language symbol library
 * [model::xpath] - xpath value on model with name 'model'
 * [{x}::xpath] - xpath value on xml node or model with js variable x
 * [{rpc.thing()}::xpath] - xpath value on an rpc call
 * [xpath] = 'value' - assign text-value to xpath (nodeValue = ..)
 * [xpath] = <xml/> - replace node with right hand xml
 * [xpath] = xmlNode - replace node with right hand node, removing xmlNode from its old position
 * [xpath] += 'value' - appends text-value to nodeValue
 * [xpath] += <xml/> - appends the <xml/> after the selected node
 * [xpath] += xmlNode - appends the node and removes from its old position
 *
 * Macro reference
 * localName(n) - returns the localName of the context node or supplied argument
 * tagName(n) - tagName of context node or supplied argument
 * nodeValue(n) - value of context nore or supplied argment similar to [.]
 * local(n){..code..} - a codeblock with a new context node n, n can be xml-string too
 * each(set){..code..) iterates over the set. usually used as: each(*[xpath]){}
 *
 */

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