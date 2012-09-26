

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