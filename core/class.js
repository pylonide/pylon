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
 * BaseClass for any object offering property binding,
 * event handling, constructor and destructor hooks.
 *
 * @constructor
 * @baseclass
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 *
 * @event propertychagne Fires when a property changes.
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
    this.hasFeature       = function(test){
        return this.$regbase&test;
    };

    /* ***********************
        PROPERTY BINDING
    ************************/

    //#ifdef __WITH_PROPERTY_BINDING

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

    /**
     * Unbinds all bound properties for this componet.
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

            if (!found)
                this.$handlePropSet(prop, eval(pValue));
        }
        else
            this.$handlePropSet(prop, pValue);
    }

    // #endif

    /**
     * Sets the value of a property of this element.
     * Note: Only the value is set, dynamic properties will remain bound and the value will be overridden.
     *
     * @param  {String}  prop        the name of the property of this element to set using a dynamic rule.
     * @param  {String}  value       the value of the property to set.
     * @param  {Boolean} [reqValue]  Wether the method should return when value is null.
     * @param  {Boolean} [forceOnMe] Wether the property should be set even when its the same value.
     */
    this.setProperty = function(prop, value, reqValue, forceOnMe){
        if (reqValue && !value || !jpf || this.$ignoreSignals)
            return;

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
            var oldvalue = this[prop];
            if (this.$handlePropSet(prop, value, forceOnMe) === false) {
                this[prop] = oldvalue;
                return false;
            }
        }
        
        // @todo place ifdef here
        if (this["onpropertychange"] || events_stack["propertychange"]) {
            this.dispatchEvent("propertychange", {
                name          : prop,
                value         : value,
                originalvalue : oldvalue
            });
        }
        
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
     * Calls all functions associated with the event.
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
        else if (this.disabled)
            result = false;
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

        this.$jml = null;

        //Remove from DOM tree if we are still connected
        if (this.parentNode)
            this.removeNode();

        //Remove from focus list - Should be in JmlNode
        if (this.$focussable && this.focussable)
            jpf.window.$removeFocus(this);

        //Remove dynamic properties
        this.unbindAllProperties();

        //Clear all children too
        if (deep && this.childNodes) {
            var i, l, nodes = this.childNodes;
            for (i = 0, l = nodes.length; i < l; i++) {
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

        //Remove id from global js space
        if (this.name)
            self[this.name] = null;
    };
};

/**
 * @constructor
 */
jpf.Event = function(name, data){
    this.name = name;

    //#ifdef __WITH_EVENT_BUBBLING
    this.bubbles = false;
    this.cancelBubble = false;
    //#endif

    this.preventDefault = function(){
        this.returnValue = false;
    }

    this.stopPropagation = function(){
        this.cancelBubble = true;
    }

    //@todo should be implemented;
    this.isCharacter = function(){
        return (this.keyCode < 112 || this.keyCode > 122) 
          && (this.keyCode < 33  && this.keyCode > 31 || this.keyCode > 42 || this.keyCode == 8);
        
    }

    jpf.extend(this, data);
    //this.returnValue = undefined;
};

jpf.inherit(jpf.Class);
jpf.Init.run('class');

// #endif
