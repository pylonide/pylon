# Property Bindings

With property binding you can define the way a
 property is calculated. 
 
 This statement is usually based on a JavaScript
 expression including one or more properties on other objects. The value of
 the property will always be kept up to date. This means that when one of the
 dependent properties changes, the property is recalculated. 
 
 #### Example
 
 Let me give you an example to make it a bit straightforward. This example
 sets the visibility of the slider based on the state of the checkbox.

```xml
  <a:slider visible="{myCheckbox.value}" />
  <a:checkbox id="myCheckbox">Toggle this</a:checkbox>
 ```

 ### Expressions
 
 The use of `{` and `}` tell APF that the visible property will
 be bound. By specifying `myCheckbox.value`, APF knows that the value of
 `myCheckbox` should be retrieved for this property. Whenever the checkbox
 changes, the slider will show or hide.

 ### Bidirectional

 Sometimes, it's necessary to make a binding from one property to another one,
 and vice versa. Think of a slider that is connected to the position property
 of a video element. When the video plays, the value of the slider should be
 updated. When the slider is dragged the video should be updated. This works
 in the same way as above, but instead of using curly braces
 you use brackets: `[` and `]`. The next example keeps the state of a dropdown in
 sync with the state of the tab page.
 
```xml
  <a:tab activepage="[myDropdown.value]">
     <a:page caption="Page 1" />
     <!-- etc -->
  </a:tab>
  <a:dropdown id="myDropdown">
     <a:item value="0">Page 1</a:item>
     <!-- etc -->
  </a:dropdown>
```


## Internals
 
Property binding in APF is a flavor of a [publish/subscribe](http://en.wikipedia.org/wiki/Publish/subscribe)
 system. 
 
 When a binding is established, the element that receives the value sets
 a listener on the property of another element. There can be any number of
 elements referenced in a single expression. When any of the properties that
 are listened to change, the subscriber gets notified to update the value
 of its property.