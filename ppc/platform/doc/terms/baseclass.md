# Baseclass

A baseclass in Pylon Platform Code (PPC) is a class that
 adds properties, methods, attributes, bindings and actions to the class that
 inherits from it. Javascript doesn't have most object oriented concepts like
 classes, class inheritance, interfaces, protected members and so on. When
 using PPC you will find that some of these concepts have
 been implemented in a way that enables the core developers of PPC to think in
 those concepts. The most important one is class inheritance. Because of the
 freedoms that javascript allows, it is possible to implement
[inheritance](http://en.wikipedia.org/wiki/Inheritance_(computer_science))
 and even [multiple inheritance](http://en.wikipedia.org/wiki/Multiple_inheritance).


## Usage

 In PPC multiple inheritance is used on all elements to assign specific traits
 to aml elements. Check the list of baseclasses on the right to familiarize
 yourself with the traits that are available (i.e. dragdrop, rename, multiselect,
 databinding, alignment, etc). At the article of each element that inherits
 from a baseclass you will find an inheritance tree on the right. This tree
 will show you <strong>from which baseclasses that element has received traits</strong>.
 Compared to Java and other strict OOP languages, the inheritance tree is
 inverted. To give an example, in Java for instance, a Lamborghini inherits from
 Car which inherits from Vehicle. In PPC Audi inherits from Engine, Wheels,
 Seats and Airco. So we can make the latest Lamborghini inherit from Airco too.

## Class

 The `ppc.Class` baseclass provides all basic features a PPC element needs, such
 as event system, property binding and multiple inheritance with state defined
 by each baseclass.
 
 By setting the prototype of a function to an instance of `ppc.Class`,
 these traits are
 transferred to your class.

## API

 The first method is the one that tells an object to implement traits from a
 baseclass.
 It works as follows:
 
 ```javascript
  var myClass = function(){
      this.$init();
  }
  myClass.prototype = new ppc.Class();
 ```
 
 There is a class tree that you can use to create your own elements. For
 instance to create a visible element that uses skinning you can inherit from
 `ppc.Presentation`:
 
 ```javascript
  var myElement = function(){
      this.$init();
  }
  myElement.prototype = new ppc.Presentation();
 ```

 A full description of the inheritance tree is below.

 To check whether an object has inherited from baseclass use the following
 syntax:
 
 ```javascript
  myObj.hasFeature(ppc.__PRESENTATION__);
 ```

 Where the constant is the name of the baseclass in capital letters.

 PPC also supports multiple inheritance. Use the implement method to add a
 baseclass to your class that is not part of the inheritance tree:
 
 ```javascript
  var myElement = function(){
      this.$init();

      this.implement(ppc.Rename);
  }
  myElement.prototype = new ppc.MultiSelect();
 ```

## Inheritance Tree

An inheritance tree might look something like this:

 ```
  - ppc.Class
      - ppc.AmlNode
          - ppc.AmlElement
              - ppc.Teleport
              - ppc.GuiElement
                  - ppc.Presentation
                      - ppc.BaseTab
                      - ppc.DataBinding
                          - ppc.StandardBinding
                              - ppc.BaseButton
                              - ppc.BaseSimple
                              - ppc.Media
                          - ppc.MultiselectBinding
                              - ppc.MultiSelect
                                  - ppc.BaseList
 ```

Generally, elements inherit from AmlElement, Presentation, StandardBinding,
 MultiselectBinding, or one of the leafs.

 The following classes are implemented using the implement method:
 
 ```
 - ppc.Cache
 - ppc.ChildValue
 - ppc.LiveEdit
 - ppc.DataAction
 - ppc.Media
 - ppc.MultiCheck
 - ppc.Rename
 - ppc.Xforms
 ```

 The following classes are automatically implemented when needed by `ppc.GuiElement`:
 
 ```
 - ppc.Anchoring
 - ppc.DelayedRender
 - ppc.DragDrop
 - ppc.Focussable
 - ppc.Interactive
 - ppc.Transaction
 - ppc.Validation
 ```

 The following class is automatically implemented by `ppc.MultiselectBinding`:
 
 ```
 - ppc.VirtualViewport
 ```