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

//#ifdef __WITH_CLASS

/**
 * @term propertybinding With property binding you can define the way a 
 * property is calculated. <img src="http://www.rubendaniels.com/images/propbind.gif" align="right" />
 * This statement is usually based on a javascript 
 * expression including one or more properties on other objects. The value of 
 * the property will always be kept up to date. This means that when one of the 
 * dependent properties changes, the property is recalculated. See the picture 
 * for a graphical explanation. 
 * Example:
 * Let me give you an example to make it a bit straightforward. This example 
 * sets the visibility of the slider based on the state of the checkbox.
 * <code>
 * <j:slider visible="{myCheckbox.value}" />
 * <j:checkbox id="myCheckbox">Toggle this</j:checkbox>
 * </code>
 *
 * Expressions:
 * The use of { and } tell Javeline PlatForm(JPF) that the visible property will 
 * be bound. By specifying myCheckbox.value JPF knows that the value of 
 * myCheckbox should be retrieved for this property. Whenever the checkbox 
 * changes, the slider will show or hide.
 *
 * Bidirectional:
 * Sometimes it's necessary to make a binding from one property to another one, 
 * and vice versa. Think of a slider that is connected to the position property
 * of a video element. When the video plays, the value of the slider should be 
 * updated. When the slider is dragged the video should be updated. This works 
 * in the same way as above, but instead of using curly braces 
 * you use brackets: [ and ]. The next example keeps the state of a dropdown in 
 * sync with the state of the tab page.
 * <code>
 *  <j:tab activepage="[myDropdown.value]">
 *     <j:page caption="Page 1" />
 *     <!-- etc -->
 *  </j:tab>
 *  <j:dropdown id="myDropdown">
 *     <j:item value="0">Page 1</j:item>
 *     <!-- etc -->
 *  </j:dropdown>
 * </code>
 *
 * For more information visit {@link http://www.rubendaniels.com/2008/07/04/property-binding/ this blog article}.</a>
 *
 * Internals:
 * Property binding in jpf is a flavor of a {@link http://en.wikipedia.org/wiki/Publish/subscribe publish/subscribe}
 * system. When a binding is established the element that receives the value sets
 * a listener on the property of another element. There can be any number of 
 * elements referenced in a single expression. When any of the properties that 
 * are listened to change, the subscriber gets notified to update the value
 * of it's property.
 */

/**
 * @term baseclass A baseclass in Javeline Platform (jpf) is a class that 
 * adds properties, methods, attributes, bindings and actions to the class that
 * inherits from it. Javascript doesn't have most object oriented concepts like
 * classes, class inheritance, interfaces, protected members and so on. When
 * using jpf you will find that some of these concepts have
 * been implemented in a way that enables the core developers of jpf to think in
 * those concepts. The most important one is class inheritance. Because of the
 * freedoms that javascript allows, it is possible to implement {@link http://en.wikipedia.org/wiki/Inheritance_(computer_science) inheritance}
 * and even {@link http://en.wikipedia.org/wiki/Multiple_inheritance multiple inheritance}.
 * 
 * Usage:
 * In jpf multiple inheritance is used on all elements to assign specific traits
 * to jml elements. Check the list of baseclasses on the right to familiarize 
 * yourself with the traits that are available (i.e. dragdrop, rename, multiselect,
 * databinding, alignment, etc). At the article of each element that inherits
 * from a baseclass you will find an inheritance tree on the right. This tree
 * will show you <strong>from which baseclasses that element has received traits</strong>.
 * Compared to Java and other strict OOP languages, the inheritance tree is
 * inverted. To give an example, in Java for instance, a Lamborghini inherits from 
 * Car which inherits from Vehicle. In jpf Audi inherits from Engine, Wheels,
 * Seats and Airco. So we can make the latest Lamborghini inherit from Airco too.
 *
 * Class:
 * The jpf.Class baseclass provides all basic features a jpf element needs, such
 * as event system, property binding and a constructor / destructor.
 * By calling {@link core.jpf.method.makeClass} an object is created that inherits
 * all <i title="an inherited characteristic (merriam-webster)">traits</i> from
 * jpf.Class. 
 * More importantly two functions are added that help with dealing with multiple
 * inheritance.
 *
 * API:
 * The first method is the one that tells an object to inherit from a baseclass.
 * It works as follows:
 * <code>
 *  myObj.inherit(jpf.Presentation);
 * </code>
 * That lines causes all traits of jpf.Presentation to be added to myObj. Now we
 * can check if myObj actually has inherited from this baseclass.
 * <code>
 *  myObj.hasFeature(__PRESENTATION__);
 * </code>
 * Another way to set up inheritance is using the implement method on a class
 * generated using the jpf.component function.
 * <code>
 *  var x = jpf.component(jpf.NODE_VISIBLE, function(){
 *      //code
 *  }).implement(
 *      jpf.Presentation,
 *      jpf.Rename
 *  );
 * </code>
 */

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have {@link term.propertybinding property binding},
 * event handling and constructor & destructor hooks. The event system is 
 * implemented following the W3C specification, similar to the 
 * {@link http://en.wikipedia.org/wiki/DOM_Events event system of the HTML DOM}.
 *
 * @constructor
 * @baseclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 *
 * @event propertychange Fires when a property changes.
 *   object:
 *     {String} name          the name of the changed property
 *     {Mixed}  originalvalue the value it had before the change
 *     {Mixed}  value         the value it has after the change
 *
 */
jpf.Class = function(){
    this.$jmlLoaders   = [];
    this.$addJmlLoader = function(func){
        if (!this.$jmlLoaders)
            func.call(this, this.$jml);
        else
            this.$jmlLoaders.push(func);
    };

    this.$jmlDestroyers   = [];

    this.$regbase         = 0;
    /**
     * Tests whether this object has inherited from a {@link term.baseclass baseclass}.
     * @param {Number} test the unique number of the {@link term.baseclass baseclass}.
     */
    this.hasFeature       = function(test){
        return this.$regbase&test;
    };

    /* ***********************
        PROPERTY BINDING
    ************************/

    //#ifdef __WITH_PROPERTY_BINDING

    //#ifdef __WITH_PROPERTY_WATCH
    var watchCallbacks     = {};
    //#endif

    var boundObjects       = {};
    var myBoundPlaces      = {};
    
    if (!this.$handlePropSet) {
        this.$handlePropSet    = function(prop, value){
            this[prop] = value;
        };
    }
    
    /*
    for (var i = 0; i < this.$supportedProperties.length;i++) {
        var p = uCaseFirst(this.$supportedProperties[i]);
        this["set" + p] = function(prop){return function(value){
            this.setProperty(prop, value);
        }}(this.$supportedProperties[i]);

        this["get" + p] = function(prop){return function(){
            return this.getProperty(prop);
        }}(this.$supportedProperties[i]);
    }
    */

    /**
     * Bind a property of another compontent to a property of this element.
     *
     * @param  {String} myProp           the name of the property of this element of which the value is communicated to <code>bObject</code>.
     * @param  {Class}  bObject          the object which will receive the property change message.
     * @param  {String} bProp            the property of <code>bObject</code> which will be set using the value of <code>myProp</code> optionally processed using <code>strDynamicProp</code>.
     * @param  {String} [strDynamicProp] a javascript statement which contains the value of <code>myProp</code>. The string is used to calculate a new value.
     * @private
     */
    this.bindProperty = function(myProp, bObject, bProp, strDynamicProp){
        //#--ifdef __DEBUG
        if (!boundObjects[myProp])
            boundObjects[myProp] = {};
        if (!boundObjects[myProp][bObject.uniqueId])
            boundObjects[myProp][bObject.uniqueId] = [];

        if (boundObjects[myProp][bObject.uniqueId].contains(bProp)) {
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, this,
                "Property-binding",
                "Already bound " + bObject.name + "." + bProp + " to " + myProp));
            //#endif
            return;
        }

        if (strDynamicProp)
            boundObjects[myProp][bObject.uniqueId].push([bProp, strDynamicProp]);
        else
            boundObjects[myProp][bObject.uniqueId].pushUnique([bProp]); //The new array is always unique... right?
        /* #--else

        if(!boundObjects[myProp]) boundObjects[myProp] = [];
        boundObjects[myProp].push([bObject, bProp, strDynamicProp]);

        #--endif */

        bObject.$handlePropSet(bProp, strDynamicProp ? eval(strDynamicProp) : this[myProp]);
    };

    /**
     * Remove the binding of a property of another compontent to a property of this element.
     *
     * @param  {String} myProp  the name of the property of this element for which the property bind was registered.
     * @param  {Class}  bObject the object receiving the property change message.
     * @param  {String} bProp   the property of <code>bObject</code>.
     * @private
     */
    this.unbindProperty = function(myProp, bObject, bProp){
        //#--ifdef __DEBUG
        boundObjects[myProp][bObject.uniqueId].remove(bProp);
        /* #--else

        if(!boundObjects[myProp]) return;
        for(var i=0;i<boundObjects[myProp].length;i++){
                if(boundObjects[myProp][0] == bObject && boundObjects[myProp][1] == bProp){
                        return boundObjects[myProp].removeIndex(i);
                }
        }

        #--endif */
    };
    
    //#ifdef __WITH_PROPERTY_WATCH
    /**
     * Adds a listener to listen for changes to a certain property. 
     * Implemented as Mozilla suggested see {https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Object/watch their site}.
     */
    this.watch = function(propName, callback){
        (watchCallbacks[propName] || (watchCallbacks[propName] = []))
            .push(callback);
    }
    
    /**
     * Removes a listener to listen for changes to a certain property. 
     */
    this.unwatch = function(propName, callback){
        if (!watchCallbacks[propName])
            return;
        
        watchCallbacks[propName].remove(callback);
    }
    //#endif

    /**
     * Unbinds all bound properties for this component.
     * @private
     */
    this.unbindAllProperties = function(){
        var prop;
        for (prop in myBoundPlaces) {
            //Remove any bounds if relevant
            if (myBoundPlaces[prop] && typeof myBoundPlaces[prop] != "function") {
                for (var i = 0; i < myBoundPlaces[prop].length; i++) {
                    if (!self[myBoundPlaces[prop][i][0]]) continue;

                    self[myBoundPlaces[prop][i][0]]
                        .unbindProperty(myBoundPlaces[prop][i][1], this, prop);
                }
            }
        }
    };

    /**
     * Gets an array of properties for this element which can be bound.
     */
    this.getAvailableProperties = function(){
        return this.$supportedProperties.slice();
    };

    /**
     * Sets a dynamic property from a string.
     * The string used for this function is the same as used in JML to set a dynamic property:
     * <j:button visible="{rbTest.value == 'up'}" />
     *
     * @param  {String}  prop   the name of the property of this element to set using a dynamic rule.
     * @param  {String}  pValue the dynamic property binding rule.
     */
    this.setDynamicProperty = function(prop, pValue){
        //pValue.match(/^([{\[])(.*)[}\]]$/); // Find dynamic or calculated property
        var pStart = pValue.substr(0,1);

        // #ifdef __DEBUG
        var pEnd = pValue.substr(pValue.length-1, 1);
        if (pStart == "[" && pEnd != "]" || pStart == "{" && pEnd != "}" ) {
            throw new Error(jpf.formatErrorString(0, this,
                "Dynamic Property Binding",
                "Invalid binding found: " + pValue));
        }
        // #endif

        //Remove any bounds if relevant
        if (myBoundPlaces[prop]) {
            for (var i = 0; i < myBoundPlaces[prop].length; i++) {
                self[myBoundPlaces[prop][i][0]].unbindProperty(myBoundPlaces[prop][i][1], this, prop);
            }
        }

        //Two Way property binds
        if (pStart == "[") {
            var p = pValue.substr(1,pValue.length-2).split(".");
            if (!self[p[0]]) return;

            if (!p[1])
                p[1] = self[p[0]].$supportedProperties[0]; // Default state property

            //Two way property binding
            self[p[0]].bindProperty(p[1], this, prop);
            myBoundPlaces[prop] = [p];
            this.bindProperty(prop, self[p[0]], p[1]);
        }
        else if (pStart == "{") { //One Way Dynamic Properties
            var o, node, bProp, p, matches = {};
            pValue = pValue.substr(1, pValue.length - 2);
            pValue.replace(/["'](?:\\.|[^"']+)*["']|\\(?:\\.|[^\\]+)*\/|(?:\W|^)([a-z]\w*\.\w+(?:\.\w+)*)(?!\()(?:\W|$)/gi,
                function(m, m1){
                    if(m1) matches[m1] = true;
                });

            pValue = pValue.replace(/\Wand\W/g, "&&").replace(/\Wor\W/g, "||");  //.replace(/\!\=|(\=)/g, function(m, m1){if(!m1) return m; return m1+"="})
            myBoundPlaces[prop] = [];

            var found = false;
            for (p in matches) {
                //#ifdef __SUPPORT_SAFARI2
                if (typeof matches[p] == "function")
                    continue;
                //#endif

                o = p.split(".");
                if (o.length > 2) { //jpf.offline.syncing
                    bProp = o.pop();
                    //#ifdef __DEBUG
                    try{
                        node  = eval(o.join("."));
                    }
                    catch(e){
                        throw new Error(jpf.formatErrorString(0, this,
                            "Creating a dynamic property bind",
                            "invalid bind statement '" + pValue + "'"));
                    }
                    /* #else
                    node  = eval(o.join("."));
                    #endif*/

                    if (typeof node != "object" || !node.$regbase) {
                        bProp = o[1];
                        node  = self[o[0]];
                    }
                    else
                        o.push(bProp);
                }
                else {
                    bProp = o[1];
                    node  = self[o[0]];
                }

                if (!node || !node.bindProperty)
                    continue;  //return

                node.bindProperty(bProp, this, prop, pValue);
                myBoundPlaces[prop].push(o);
                found = true;
            }

            ///!WARNING, bound properties got a set-call twice, no idea why it was commented out before
            if (!found){
                //this.$handlePropSet(prop, eval(pValue));
                var value = eval(pValue);
                this[prop] = !value;
                this.setProperty(prop, value);
            }
        }
        else {
            //this.$handlePropSet(prop, pValue);
            var value = eval(pValue);
            this[prop] = !value;
            this.setProperty(prop, eval(pValue));
        }
    }

    // #endif

    //#ifdef __WITH_MULTI_LANG
    var isMultiLang = {};
    //#endif

    /**
     * Sets the value of a property of this element.
     * Note: Only the value is set, dynamic properties will remain bound and the value will be overridden.
     *
     * @param  {String}  prop        the name of the property of this element to set using a dynamic rule.
     * @param  {String}  value       the value of the property to set.
     * @param  {Boolean} [reqValue]  Whether the method should return when value is null.
     * @param  {Boolean} [forceOnMe] Whether the property should be set even when its the same value.
     */
    this.setProperty = function(prop, value, reqValue, forceOnMe){
        if (reqValue && !value || !jpf || this.$ignoreSignals)
            return;

        //#ifdef __WITH_MULTI_LANG
        if (!forceOnMe) {
            if (isMultiLang[prop]) {
                jpf.language.removeElement(isMultiLang[prop][0], 
                  isMultiLang[prop][1]);
                
                delete isMultiLang[prop];
            }
            
            if (/^\$(.*)\$$/.test(value)) {
                isMultiLang[prop] = [value, jpf.language.addElement(RegExp.$1, {
                    jmlNode: this,
                    prop : prop
                })];
                return;
            }
        }
        //#endif

        var oldvalue = this[prop];
        if (String(this[prop]) !== String(value) || typeof value == "object") {
            //#ifdef __WITH_OFFLINE_STATE_REALTIME
            if (typeof jpf.offline != "undefined") {
                if (jpf.loaded && jpf.offline.state.enabled
                  && (!this.bindingRules || !this.bindingRules[prop]
                  || this.traverse)) {
                    jpf.offline.state.set(this, prop, typeof value == "object"
                        ? value.name
                        : value);
                }
                else if (jpf.offline.enabled) {

                }
            }
            //#endif
            if (this.$handlePropSet(prop, value, forceOnMe) === false) {
                this[prop] = oldvalue;
                return false;
            }
        }
        
        // #ifdef __WITH_PROPERTY_WATCH
        var cb = watchCallbacks[prop];
        if (cb) {
            for (var i = 0; i < cb.length; i++)
                cb[i].call(this, prop, oldvalue, value);
        }
        //#endif
        
        // #ifdef __WITH_PROPERTY_CHANGE
        if (this["onpropertychange"] || events_stack["propertychange"]) {
            this.dispatchEvent("propertychange", {
                name          : prop,
                value         : value,
                originalvalue : oldvalue
            });
        }
        //#endif
        
        //#ifdef __WITH_PROPERTY_BINDING
        var nodes = boundObjects[prop];
        if (!nodes) return;

        //#--ifdef __DEBUG
        var id, ovalue = this[prop];//value;
        for (id in nodes) {
            if (jpf.isSafari && (typeof nodes[id] != "object" || !nodes[id]))
                continue;

            for (var o = jpf.lookup(id), i = nodes[id].length - 1; i >= 0; --i) {
                try {
                    value = nodes[id][i][1] ? eval(nodes[id][i][1]) : ovalue;
                }
                catch(e) {
                    throw new Error(jpf.formatErrorString(0, this,
                        "Property-binding",
                        "Could not execute binding test: " + nodes[id][i][1]));
                }

                if (typeof o != "undefined" && o[nodes[id][i][0]] != value)
                    o.setProperty(nodes[id][i][0], value);//__handlePropSet
            }
        }
        /* #--else

        for(var i=0;i<nodes.length;i++){
        try{
            nodes[i][0].$handlePropSet(nodes[i][1],
            nodes[i][2] ? eval(nodes[i][2]) : value);
        }catch(e){}
        }
        #--endif */

        //#endif

        return value;
    };

    /**
     * Gets the value of a property of this element.
     *
     * @param  {String}  prop   the name of the property of this element for which to get the value.
     */
    this.getProperty = function(prop){
        return this[prop];
    };

    /* ***********************
        EVENT HANDLING
    ************************/

    var capture_stack = {}, events_stack = {};
    /**
     * Calls all functions that are registered as listeners for an event.
     *
     * @param  {String}  eventName  the name of the event to dispatch.
     * @param  {Object}  [options]  the properties of the event object that will be created and passed through.
     *   Properties:
     *   {Boolean} bubbles  whether the event should bubble up to it's parent
     * @return {mixed} return value of the event
     */
    this.dispatchEvent = function(eventName, options, e){
        var arr, result, rValue;

        /* #ifdef __WITH_EDITMODE
        if(this.editable && this.editableEvents && this.editableEvents[eventName]) return false;
        #endif */

        if (options && options.name)
            e = options;
        else if (!e)
            e = new jpf.Event(eventName, options);

        if (this.disabled)
            result = false;
        else {
            if (!e.originalElement) {
                e.originalElement = this;
    
                //Capture support
                if (arr = capture_stack[eventName]) {
                    for (var i = 0; i < arr.length; i++) {
                        rValue = arr[i].call(this, e);
                        if (rValue != undefined)
                            result = rValue;
                    }
                }
            }
            
            if (options && options.captureOnly)
                return e.returnValue || rValue;
            else {
                if (this["on" + eventName])
                    result = this["on" + eventName].call(this, e); //Backwards compatibility
    
                if (arr = events_stack[eventName]) {
                    for (var i = 0; i < arr.length; i++) {
                        rValue = arr[i].call(this, e);
                        if (rValue != undefined)
                            result = rValue;
                    }
                }
            }
        }
        
        //#ifdef __WITH_EVENT_BUBBLING
        if (e.bubbles && !e.cancelBubble && this != jpf) {
            rValue = (this.parentNode || jpf).dispatchEvent(eventName, null, e);

            if (rValue != undefined)
                result = rValue;
        }
        //#endif

        return e.returnValue !== undefined ? e.returnValue : result;
    };

    /**
     * Add a function to be called when a event is called.
     *
     * @param  {String}   eventName the name of the event for which to register a function.
     * @param  {function} callback  the code to be called when event is dispatched.
     */
    this.addEventListener = function(eventName, callback, useCapture){
        //#ifdef __PROFILER
        if (jpf.profiler)
            jpf.profiler.wrapFunction(Profiler_functionTemplate());
        //#endif

        if (eventName.indexOf("on") == 0)
            eventName = eventName.substr(2);

        var stack = useCapture ? capture_stack : events_stack;
        if (!stack[eventName])
            stack[eventName] = [];
        stack[eventName].pushUnique(callback);
    }

    /**
     * Remove a function registered for an event.
     *
     * @param  {String}   eventName the name of the event for which to unregister a function.
     * @param  {function} callback  the function to be removed from the event stack.
     */
    this.removeEventListener = function(eventName, callback, useCapture){
        var stack = useCapture ? capture_stack : events_stack;
        if (stack[eventName])
            stack[eventName].remove(callback);
    };

    /**
     * Checks if there is an event listener specified for the event.
     *
     * @param  {String}  eventName  the name of the event to check.
     * @return {Boolean} whether the event has listeners
     */
    this.hasEventListener = function(eventName){
        return (events_stack[eventName] && events_stack[eventName].length > 0);
    };

    /**
     * Destructor of a Class.
     * Calls all destructor functions and removes all mem leaking references.
     * This function is called when exiting the application or closing the window.
     * @param {Boolean} deep whether the children of this element should be destroyed.
     * @method
     */
    this.destroy = this.destroy || function(deep){
        if (!this.$jmlDestroyers) //@todo check why this happens
            return;

        if (this.$destroy)
            this.$destroy();

        for (var i = this.$jmlDestroyers.length - 1; i >= 0; i--)
            this.$jmlDestroyers[i].call(this);
        this.$jmlDestroyers = undefined;

        //Remove from jpf.all
        if (typeof this.uniqueId == "undefined")
            return;

        jpf.all[this.uniqueId] = undefined;

        if (!this.nodeFunc) { //If this is not a JmlNode, we're done.
            //Remove id from global js space
            if (this.name)
                self[this.name] = null;
            return;
        }

        if (this.oExt && !this.oExt.isNative && this.oExt.nodeType == 1) {
            this.oExt.oncontextmenu = this.oExt.host = null;
        }
        if (this.oInt && !this.oExt.isNative && this.oInt.nodeType == 1)
            this.oInt.host = null;

        if (this.$jml)
            this.$jml.parentNode.removeChild(this.$jml);
        this.$jml = null;

        //Remove from DOM tree if we are still connected
        if (this.parentNode)
            this.removeNode();

        //Remove from focus list - Should be in JmlNode
        if (this.$focussable && this.focussable)
            jpf.window.$removeFocus(this);

        //#ifdef __WITH_PROPERTY_BINDING
        //Remove dynamic properties
        this.unbindAllProperties();
        //#endif

        //Clear all children too
        if (deep && this.childNodes) {
            var i, nodes = this.childNodes;
            for (i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].destroy)
                    nodes[i].destroy(true);
            }
            this.childNodes = null;
        }

        //#ifdef __DEBUG
        if (deep !== false && this.childNodes) {
            jpf.console.warn("You have destroyed a Jml Node without destroying\
                              it's children. Please be aware that if you don't\
                              maintain a reference, memory might leak");
        }
        //#endif

        //#ifdef __WITH_MULTI_LANG
        for (prop in isMultiLang) {
            jpf.language.removeElement(isMultiLang[prop][0], 
                isMultiLang[prop][1]);
        }
        //#endif

        //Remove id from global js space
        if (this.name)
            self[this.name] = null;
    };
};

/**
 * Implementation of W3C event object. An instance of this class is passed as
 * the first argument of any event handler. Per event it will contain different
 * properties giving context based information about the event.
 * @constructor
 * @default_private
 */
jpf.Event = function(name, data){
    this.name = name;

    // #ifdef __WITH_EVENT_BUBBLING
    this.bubbles = false;
    this.cancelBubble = false;
    // #endif

    /**
     * Cancels the event if it is cancelable, without stopping further 
     * propagation of the event. 
     */
    this.preventDefault = function(){
        this.returnValue = false;
    };

    // #ifdef __WITH_EVENT_BUBBLING
    /**
     * Prevents further propagation of the current event. 
     */
    this.stopPropagation = function(){
        this.cancelBubble = true;
    };
    // #endif

    this.stop = function() {
        this.returnValue = false;
        // #ifdef __WITH_EVENT_BUBBLING
        this.cancelBubble = true;
        // #endif
    };
    
    /**
     * Determines whether the keyboard input was a character that can influence
     * the value of an element (like a textbox).
     */
    this.isCharacter = function(){
        return (this.keyCode < 112 || this.keyCode > 122)
          && (this.keyCode == 32 || this.keyCode > 42 || this.keyCode == 8);
    }

    jpf.extend(this, data);
    //this.returnValue = undefined;
};

jpf.inherit(jpf.Class);
jpf.Init.run('class');

// #endif
