

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