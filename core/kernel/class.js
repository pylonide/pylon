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

//#ifdef __WITH_APP || __WITH_TELEPORT

/**
 * BaseClass for any JavaScript Class offering property binding, 
 * event handling, constructor and destructor hooks.
 *
 * @classDescription		This class creates a new class
 * @return {Class} Returns a new class
 * @type {Class}
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.Class = function(){
    this.__jmlLoaders   = [];
    this.__addJmlLoader = function(func){
        if (!this.__jmlLoaders)
            func.call(this, this.jml);
        else
            this.__jmlLoaders.push(func);
    }

    this.__jmlDestroyers   = [];
    this.__addJmlDestroyer = function(func){
        this.__jmlDestroyers.push(func);
    }

    this.__regbase         = 0;
    this.hasFeature        = function(test){
        return this.__regbase&test
    }

    /* ***********************
        PROPERTY BINDING
    ************************/

    //#ifdef __WITH_PROPERTY_BINDING

    var boundObjects       = {};
    var myBoundPlaces      = {}

    /*
    for (var i = 0; i < this.__supportedProperties.length;i++) {
        var p = uCaseFirst(this.__supportedProperties[i]);
        this["set" + p] = function(prop){return function(value){
            this.setProperty(prop, value);
        }}(this.__supportedProperties[i]);

        this["get" + p] = function(prop){return function(){
            return this.getProperty(prop);
        }}(this.__supportedProperties[i]);
    }
    */

    /**
     * Bind a property of another compontent to a property of this component.
     *
     * @param  {String}  myProp  required  String specifying the name of the property of this component of which the value is communicated to <code>bObject</code>.
     * @param  {Class}  bObject   required  Instance of Class which will receive the property change message.
     * @param  {String}  bProp  required  String specifying property of <code>bObject</code> which will be set using the value of <code>myProp</code> optionally processed using <code>strDynamicProp</code>.
     * @param  {String}  strDynamicProp  optional  String specifying a JavaScript statement which contains the value of <code>myProp</code>. The string is used to calculate a new value.
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
		
        bObject.handlePropSet(bProp, strDynamicProp ? eval(strDynamicProp) : this[myProp]);
    }
	
    /**
     * Remove the binding of a property of another compontent to a property of this component.
     *
     * @param  {String}  myProp  required  String specifying the name of the property of this component for which the property bind was registered.
     * @param  {Class}  bObject   required  Instance of Class which received the property change message.
     * @param  {String}  bProp  required  String specifying property of <code>bObject</code>.
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
    }
	
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
    }
	
    /**
     * Gets an array of properties for this component which can be bound.
     */
    this.getAvailableProperties = function(){
        return this.__supportedProperties.slice();
    }
	
    /**
     * Sets a dynamic property from a string
     * The string used for this function is the same as used in JML to set a dynamic property:
     * <j:Button visible="{rbTest.value == 'up'}" />
     *
     * @param  {String}  prop  required  String specifying the name of the property of this component to set using a dynamic rule.
     * @param  {String}  pValue  required  String specifying the dynamic property binding rule.
     */
    this.setDynamicProperty = function(prop, pValue){
        //pValue.match(/^([{\[])(.*)[}\]]$/); // Find dynamic or calculated property
        var pStart = pValue.substr(0,1);

        // #ifdef __DEBUG
        var pEnd = pValue.substr(pValue.length-1,1);
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
                p[1] = self[p[0]].__supportedProperties[0]; // Default state property
			
            //Two way property binding
            self[p[0]].bindProperty(p[1], this, prop);
            myBoundPlaces[prop] = [p];
            this.bindProperty(prop, self[p[0]], p[1]);
        }
        else if(pStart == "{") { //One Way Dynamic Properties
            var o, node, bProp, p, matches = {}, pValue = pValue.substr(1,pValue.length-2);
            pValue.replace(/["'](?:\\.|[^"']+)*["']|\/(?:\\.|[^\/\\]+)*\/|(?:\W|^)([a-z]\w*\.\w+(?:\.\w+)*)(?!\()(?:\W|$)/g,
                function(m, m1){
                    if(m1) matches[m1] = true;
                });
			
            pValue = pValue.replace(/\Wand\W/g, "&&").replace(/\Wor\W/g, "||");//.replace(/\!\=|(\=)/g, function(m, m1){if(!m1) return m; return m1+"="})
            myBoundPlaces[prop] = [];

            for (p in matches) {
                if (typeof matches[p] == "function")
                    continue;

                o = p.split(".");
                if (o.length > 2) {
                    bProp = o.pop();
                    node  = eval(o.join("."));
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
            }
			
        }
        else
            this.handlePropSet(prop, pValue);
    }
	
	// #endif
	
	/**
	 * Sets the value of a property of this component.
	 * Note: Only the value is set, dynamic properties will remain bound and the value will be overridden.
	 *
	 * @param  {String}  prop   required  String specifying the name of the property of this component to set using a dynamic rule.
	 * @param  {String}  value   required  String specifying the value of the property to set.
	 * @param  {Boolean}  reqValue  optional  When set to true and <code>value</code> is null the method will return.
	 * @param  {Boolean}  forceOnMe  optional  When set to true the function will set the property even though its the same value.
	 */
	this.setProperty = function(prop, value, reqValue, forceOnMe){
		if (reqValue && !value) return;

		if (String(this[prop]) !== String(value)) {
		    //#ifdef __WITH_OFFLINE_STATE_REALTIME
	        if (jpf.loaded && jpf.offline.state.enabled && jpf.offline.state.realtime
	          && (!this.bindingRules || !this.bindingRules[prop] || this.ruleTraverse))
	            jpf.offline.state.set(this, prop, value);
		    else if (jpf.offline.enabled) {
		        
		    }
		    //#endif
		    
			var oldvalue = this[prop];
			if (this.handlePropSet(prop, value, forceOnMe) === false) {
				this[prop] = oldvalue;
				return false;
			}
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

                if (o[nodes[id][i][0]] != value)
                    o.setProperty(nodes[id][i][0], value);//__handlePropSet
            }
        }
        /* #--else

        for(var i=0;i<nodes.length;i++){
        try{
            nodes[i][0].handlePropSet(nodes[i][1],
            nodes[i][2] ? eval(nodes[i][2]) : value);
        }catch(e){}
        }
        #--endif */

        //#endif
    }
	
    /**
     * Gets the value of a property of this component.
     *
     * @param  {String}  prop   required  String specifying the name of the property of this component for which to get the value.
     */
    this.getProperty = function(prop){
        return this[prop];
    }
	
    /* ***********************
        EVENT HANDLING
    ************************/

    var events_stack = {};
    /**
     * Calls all functions associated with the event.
     *
     * @param  {String}  eventName  required  String specifying the name of the event to dispatch.
     * @param  {Object}  options    optional  Simple object that specifies event bubbling etc, for the jpf.Event object
     * @return  {variant}  return value of the event
     */
    this.dispatchEvent = function(eventName, options, e){
        var result, rValue;
		
        /* #ifdef __WITH_EDITMODE
        if(this.editable && this.editableEvents && this.editableEvents[eventName]) return false;
        #endif */

        if (!e)
            e = new jpf.Event(eventName, options);
        if (!eventName)
            eventName = e.name; //maybe remove this???
		
        if (this.disabled)
            result = false;
        else {
            var arr = events_stack[eventName];
			
            if (arr && arr.length || this[eventName]) {
                //for(var args=[],i=1;i<arguments.length;i++) args.push(arguments[i]);
                if (this[eventName])
                    result = this[eventName].call(this, e); //Backwards compatibility
				
                if (arr) {
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
    }
	
    /**
     * Add a function to be called when a event is called.
     *
     * @param  {String}  eventName    required  String specifying the name of the event for which to register a function.
     * @param  {function}  func  required  Function to be called when event is dispatched.
     */
    this.addEventListener = function(eventName, func){
        //#ifdef __PROFILER
        if (jpf.profiler)
            jpf.profiler.wrapFunction(Profiler_functionTemplate());
        //#endif
        
        if (!events_stack[eventName])
            events_stack[eventName] = [];
        events_stack[eventName].pushUnique(func);
    }
	
    /**
     * Remove a function registered for an event.
     *
     * @param  {String}  eventName    required  String specifying the name of the event for which to unregister a function.
     * @param  {function}  func  required  Function to be removed from the event.
     */
    this.removeEventListener = function(eventName, func){
        if (events_stack[eventName])
            events_stack[eventName].remove(func);
    }
	
    /**
     * Checks if there is an event listener specified for the event.
     *
     * @param  {String}  eventName    required  String specifying the name of the event to check.
     * @return  {Boolean}  Boolean specifying wether the event has listeners
     */
    this.hasEventListener = function(eventName){
        return (events_stack[eventName] && events_stack[eventName].length > 0);
    }
    
    /**
     * Destructor of a Class.
     * Calls all destructor functions and removes all mem leaking references.
     * This function is called when exiting the application or closing the window.
     */
    this.destroy = this.destroy || function(){
        if (!this.__jmlDestroyers) //@todo check why this happens
            return;
        
        if (this.__destroy)
            this.__destroy();
		
        for (var i = this.__jmlDestroyers.length - 1; i >= 0; i--)
            this.__jmlDestroyers[i].call(this);
        this.__jmlDestroyers = undefined;
		
        if (this.oExt && !this.oExt.isNative && this.oExt.nodeType == 1) {
            this.oExt.oncontextmenu = this.oExt.host = null;
        }
        if (this.oInt && !this.oExt.isNative && this.oInt.nodeType == 1)
            this.oInt.host = null;
		
        this.jml = null;
		
        // Remove from jpf.all
        if (this.uniqueId) return;
        jpf.all[this.uniqueId] = this.uniqueId = null;
    }
	
    /**
     * Removes all the registrations of this component.
     * Call this function to runtime remove this component.
     */
    this.destroySelf = function(){
        if (!this.hasFeature) return;
		
        //Update JMLDOMApi as well
		
        // Remove id from global js space
        if (this.name)
            self[this.name] = null;
	
        // Remove from window.onresize - Should be in Anchoring or Alignment
        if (this.hasFeature(__ANCHORING__))
            this.disableAnchoring();
        if (this.hasFeature(__ALIGNMENT__))
            this.disableAlignment();
		
        // Remove dynamic properties - Should be in Class (clear events???)
        this.unbindAllProperties();
		
        // Remove data connections - Should be in DataBinding
        if (this.dataParent)
            this.dataParent.parent.disconnect(this);
        if (this.hasFeature(__DATABINDING__)) {
            this.unloadBindings();
            this.unloadActions();
        }
        if (this.hasFeature(__DRAGDROP__))
            this.unloadDragDrop();
		
        // Remove from focus list - Should be in JmlNode
        if (this.focussable)
            jpf.window.__removeFocus(this);
		
        // Remove from multilang list listener (also on skin switching) - Should be in MultiLang
        if (this.hasFeature(__MULTILANG__))
            this.__removeEditable();
		
        //Remove all cached Items - Should be in Cache
        if (this.hasFeature(__CACHE__))
            this.clearAllCache();
		
        if (this.childNodes) {
            for (var i = 0; i < this.childNodes.length; i++) {
                if (this.childNodes[i].destroySelf)
                    this.childNodes[i].destroySelf();
                else
                    jpf.removeNode(this.childNodes[i].oExt);
            }
        }
		
        if (this.destroy)
            this.destroy();
    }
}

/**
 * @constructor
 */
jpf.Event = function(name, data){
    this.name = name;
	
    //#ifdef __WITH_EVENT_BUBBLING
    this.bubbles = false;
    this.cancelBubble = false;
    //#endif
	
    jpf.extend(this, data);
    //this.returnValue = undefined;
}

// #endif
