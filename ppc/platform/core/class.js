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
 * All elements that implemented this {@link term.baseclass baseclass} have
 * {@link term.propertybinding property binding},
 * event handling and constructor & destructor hooks. The event system is
 * implemented following the W3C specification, similar to the
 * {@link http://en.wikipedia.org/wiki/DOM_Events event system of the HTML DOM}.
 *
 * @class apf.Class
 *
 * @baseclass
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */

/**
 * @event propertychange Fires when a property changes.
 * @param {Object} e An object containing the following properties:
 * - name ([[String]]): The name of the changed property
 * - originalvalue (`Mixed`): The value it had before the change
 * - value (`Mixed`): The value it has after the change
 *
 */
apf.Class = function(){};

apf.Class.prototype = new (function(){
    // privates
    var FUN   = "function",
        OBJ   = "object",
        UNDEF = "undefined",
        SEL   = "model", //selected|selection|properties|
        PROP  = "prop.",
        MODEL = "model",
        VALUE = "value";

    this.$regbase   = 0;
    /**
     * Tests whether this object has implemented a {@link term.baseclass baseclass}.
     * @param {Number} test The unique number of the {@link term.baseclass baseclass}.
     */
    this.hasFeature = function(test){
        return this.$regbase & test;
    };

    this.$initStack    = [];
    this.$bufferEvents = [];
    this.$init = function(callback, nodeFunc, struct){
        if (typeof callback == FUN || callback === true) {
            this.$bufferEvents = this.$bufferEvents.slice();

            if (callback === true)
                return this;

            this.$initStack = this.$initStack.slice(); //Our own private stack
            this.$initStack.push(callback);

            return this;
        }

        this.addEventListener = realAddEventListener;
        //this.$removalQueue = [];

        if (this.nodeType != 2) //small little hack
            this.$uniqueId = apf.all.push(this) - 1;

        this.$captureStack = {};
        this.$eventsStack  = {};
        this.$funcHandlers = {};

        var i = 0, l = this.$initStack.length;
        for (; i < l; i++)
            this.$initStack[i].apply(this, arguments);

        for (i = 0, l = this.$bufferEvents.length; i < l; i++)
            this.addEventListener.apply(this, this.$bufferEvents[i]);

        delete realAddEventListener;
        delete this.$initStack;
        delete this.$bufferEvents;

        if (struct && (struct.htmlNode || this.nodeFunc == apf.NODE_HIDDEN)) {
            this.$pHtmlNode = struct.htmlNode;

            /*#ifdef __SUPPORT_GWT
                var domParser = this.ownerDocument.$domParser;
                this.ownerDocument.documentElement.appendChild(this);
            #else*/
                if (this.ownerDocument && this.ownerDocument.$domParser)
                    this.ownerDocument.$domParser.$continueParsing(this);

                // #ifdef __WITH_QUEUE
                apf.queue.empty();
                // #endif
            // #endif
        }

        return this;
    };

    this.implement = apf.implement;

    // **** Property Binding **** //

    this.$handlePropSet = function(prop, value){
        this[prop] = value;
    };

    //#ifdef __WITH_PROPERTY_BINDING

    /**
     * Binds a property of another compontent to a property of this element.
     *
     * @param  {String} myProp           the name of the property of this element
     *                                   of which the value is communicated to
     *                                   `bObject`.
     * @param  {Class}  bObject          the object which will receive the property
     *                                   change message.
     * @param  {String} bProp            the property of `bObject` which
     *                                   will be set using the value of
     *                                   `myProp` optionally
     *                                   processed using `strDynamicProp`.
     * @param  {String} [strDynamicProp] a javascript statement which contains the
     *                                   value of `myProp`. The string
     *                                   is used to calculate a new value.
     * @private
     */
    this.$bindProperty = function(myProp, bObject, bProp, fParsed, bRecip){
        if (!fParsed)
            return bObject.$handlePropSet(bProp, this[myProp]);

        var eventName = PROP + myProp, eFunc, isBeingCalled, isLang;
        (this.$eventsStack[eventName] || (this.$eventsStack[eventName] = [])).push(eFunc = function(e){
            if (isBeingCalled) //Prevent circular refs
                return;

            //#ifdef __WITH_LANG_SUPPORT
            apf.$lm_has_lang = false;
            //#endif
            isBeingCalled = true;

            try {
                if (fParsed.asyncs) { //if async
                    return fParsed.call(bObject, bObject.xmlRoot, function(value){
                        bObject.setProperty(bProp, value, true, false, 10);

                        //#ifdef __WITH_LANG_SUPPORT
                        //@todo apf3.0
                        if (apf.$lm_has_lang && !isLang) {
                            isLang = true;
                            //@todo should auto remove
                            apf.language.addProperty(bObject, bProp, fParsed);
                        }
                        //#endif

                        isBeingCalled = false;
                    });
                }
                else {
                    var value = fParsed.call(bObject, bObject.xmlRoot);
                }
            }
            catch(e) {
                apf.console.warn("[331] Could not execute binding for property "
                    + bProp + "\n\n" + e.message);

                isBeingCalled = false;

                return;
            }

            //Can't do this when using xml nodes, doesnt seem needed anyway
            //if (bObject[bProp] != value)
                bObject.setProperty(bProp, value, true, false, 10);//e.initial ? 0 :

            //#ifdef __WITH_LANG_SUPPORT
            //@todo apf3.0
            if (apf.$lm_has_lang && !isLang) {
                isLang = true;
                //@todo should auto remove
                apf.language.addProperty(bObject, bProp, fParsed);
            }
            //#endif

            isBeingCalled = false;
        });

        //Bi-directional property binding
        if (bRecip) {
            eventName = PROP + bProp;
            var _self = this;
            // add bidirectional binding to funcHandlers for visualconnect
            //#ifdef __WITH_CONTENTEDITABLE
            if (!this.$funcHandlers[bProp])
                this.$funcHandlers[bProp] = [];

            this.$funcHandlers[bProp].push({
                amlNode : bObject,
                prop    : bProp
            });
            //#endif

            (bObject.$eventsStack[eventName] || (bObject.$eventsStack[eventName] = [])).push(
                eFunc.recip = function(){
                    if (isBeingCalled) //Prevent circular refs
                        return;

                    isBeingCalled = true;
                    _self.setProperty(myProp, bObject[bProp], false, false, 10);//e.initial ? 0 :
                    isBeingCalled = false;
                });
        };

        //eFunc({initial: true});

        return eFunc;
    };

    /**
     * Sets a dynamic property from a string.
     *
     * The string used for this function is the same as used in AML to set a
     * dynamic property:
     * ```xml
     *  <a:button visible="{rbTest.value == 'up'}" />
     *  <a:textbox id="rbTest" value="" />
     * ```
     *
     * @param  {String}  prop   The name of the property of this element to set
     *                          using a dynamic rule.
     * @param  {String}  pValue The dynamic property binding rule.
     */
    this.$attrExcludePropBind = false;
    this.$setDynamicProperty = function(prop, pValue){
        var exclNr = this.$attrExcludePropBind[prop],
            options;

        //@todo apf3.0, please generalize this - cache objects, seems slow
        if (SEL.indexOf(prop) > -1 || exclNr == 3) {
            options = {
                xpathmode : 2
                //parsecode : true //@todo is this also good for exclNr 3 ?
            }
        }
        else if (exclNr == 2) {
            options = {nostring : true};
        }
        else if (exclNr === 0) {
            options = {
                parsecode : true
                /*#ifdef __DEBUG */, nothrow : this.target.match(/-debug$/) ? true : false /* #endif */
            };
        }

        if (this.liveedit)
            (options || (options = {})).liveedit = true;

        //#ifdef __DEBUG
        if (apf.config.debugLm)
            (options || (options = {})).nothrow = true;
        //#endif

        //Compile pValue through JSLT parser
        //#ifdef __WITH_AML_BINDINGS
        if (pValue && pValue.dataType == apf.FUNCTION) {
             var fParsed = pValue;
             pValue = "";
        }
        else
        //#endif
        {
            var fParsed = apf.lm.compile(pValue, options);
        }

        //Special case for model due to needed extra signalling
        if (prop == MODEL)
            (this.$modelParsed = fParsed).instruction = pValue
        // #ifdef __DEBUG
        else if (exclNr === 0)
            this.$lastFParsed = fParsed;
        // #endif

        //if it's only text return setProperty()
        if (fParsed.type == 2) {
            this[prop] = !pValue; //@todo apf3.0 is this needed?
            return this.setProperty(prop, fParsed.str, null, null, 10); //@todo is 10 here right?
        }

        //if there's xpath: Add apf.DataBinding if not inherited.
        //Add compiled binding rule. Load databinding if not loaded.
        //#ifdef __WITH_DATABINDING
        var check = 1;
        if (exclNr == 2 || fParsed.xpaths.length && exclNr != 1) {
            if (!this.hasFeature(apf.__DATABINDING__)) {
                this.implement(apf.StandardBinding);
                if (this.$attrExcludePropBind[prop] == 1)
                    check = 0;
            }

            if (check)
                this.$addAttrBind(prop, fParsed, pValue);
        }
        //#endif

        //if there's prop binding: Add generated function to each obj/prop in the list
        var matches = exclNr && exclNr != 3 && prop != MODEL ? {} : fParsed.props, //@todo apf3.0 sign of broken abstraction, please fix this with a bit mask
            found   = false,
            _self   = this,
            o, node, bProp, p;

        for (p in matches) {
            //#ifdef __SUPPORT_SAFARI2
            if (typeof matches[p] == FUN)
                continue;
            //#endif

            o = p.split(".");
            if (o.length > 2) { //apf.offline.syncing
                bProp = o.pop();
                try{
                    node  = eval(o.join("."));
                }
                catch(e){
                    if (arguments[2]) {
                        apf.console.warn("[287] Could not execute binding test : "
                            + pValue.replace(/</g, "&lt;") + "\n\n" + e.message);
                    }
                    else {
                        apf.queue.add(prop + ":" + this.$uniqueId, function(){
                            _self.$clearDynamicProperty(prop);
                            _self.$setDynamicProperty(prop, pValue, true);
                        });
                    }
                    continue;
                }

                if (!node || typeof node != OBJ || (!node.$regbase && node.$regbase !== 0)) {
                    bProp = o[1];
                    node  = self[o[0]] || apf.nameserver.get("all", o[0]);
                }
                else {
                    o.push(bProp);
                }
            }
            else {
                bProp = o[1];
                node  = self[o[0]] || apf.nameserver.get("all", o[0]) || o[0] == "this" && this;
            }

            if (!node) {
                if (arguments[2]) {
                    apf.console.warn("[287] Could not create property binding: "
                        + " '"  + o[0] + "' does not exist. \n"
                        + pValue.replace(/</g, "&lt;").substr(0, 400));

                    var _self = this;
                    apf.nameserver.waitFor(o[0], function(){
                        _self.$setDynamicProperty(prop, pValue);
                    })
                    return;
                }
                else {
                    //@todo this is sloppy and not efficient - shouldn't clear
                    //and reset and should check if was changed or removed when
                    //it's set
                    apf.queue.add(prop + ":" + this.$uniqueId, function(){
                        _self.$clearDynamicProperty(prop);
                        _self.$setDynamicProperty(prop, pValue, true);
                    });
                    return;
                }
            }

            if (!node.$bindProperty)
                continue;  //return

            if (!this.$funcHandlers[prop])
                this.$funcHandlers[prop] = [];

            var last;
            this.$funcHandlers[prop].push(last = {
                amlNode : node,
                prop    : bProp,
                handler : node.$bindProperty(bProp, this, prop, fParsed,
                    //@todo check if it breaks something. I removed
                    // "&& exclNr != 3" from the expression to enable two way
                    // binding of selections
                    fParsed.type == 4 && SEL.indexOf(prop) == -1) /*,
                bidir   :
                  && this.$bindProperty(prop, node, bProp, function(){
                    return _self[prop];
                  })*/
            });

            found = true;
        }

        if (found) {
            last.handler({initial: true});
        }
        else {
            //@todo optimize this
            if (exclNr)
                return this.setProperty(prop, pValue, null, null, 10); //@todo is 10 here right?

            //#ifdef __WITH_LANG_SUPPORT
            apf.$lm_has_lang = false;
            //#endif

            try {
                if (fParsed.asyncs) { //if async
                    return fParsed.call(this, this.xmlRoot, function(value){
                        _self.setProperty(prop, value, true, null, 10); //@todo is 10 here right?

                        //#ifdef __WITH_LANG_SUPPORT
                        //@todo apf3.0
                        if (apf.$lm_has_lang)
                            apf.language.addProperty(this, prop, fParsed); //@todo should auto remove
                        //#endif
                    });
                }
                else {
                    var value = fParsed.call(this, this.xmlRoot);
                }
            }
            catch(e){
                apf.console.warn("[331] Could not execute binding test or: "
                    + pValue.replace(/</g, "&lt;") + "\n\n" + e.message);
                return;
            }

            this[prop] = !value; //@todo isnt this slow and unneccesary?
            this.setProperty(prop, value, true, null, 10); //@todo is 10 here right?

            //#ifdef __WITH_LANG_SUPPORT
            //@todo apf3.0
            if (apf.$lm_has_lang)
                apf.language.addProperty(this, prop, fParsed); //@todo should auto remove
            //#endif
        }
    };

    //@todo setAttribute should delete this from apf.language when not doing
    //$setDynamicProperty
    this.$clearDynamicProperty = function(prop){
        if (this.$removeAttrBind)
            this.$removeAttrBind(prop);

        //#ifdef __WITH_LANG_SUPPORT
        //@todo apf3.0
        apf.language.removeProperty(this, prop);
        //#endif

        if (this.$inheritProperties)
            delete this.$inheritProperties[prop];

        if (prop == MODEL)
            this.$modelParsed = null;

        //Remove any bounds if relevant
        var f, i, l, h = this.$funcHandlers[prop];
        if (h && typeof h != FUN) {
            for (i = 0, l = h.length; i < l; i++) {
                (f = h[i]).amlNode.removeEventListener(PROP + f.prop, f.handler);
                if (f.handler && f.handler.recip) //@todo handler shouldn't be unset - how does this happen?
                    this.removeEventListener(PROP + prop, f.handler.recip);
            }
            delete this.$funcHandlers[prop];
        }
    };

    //#ifdef __WITH_PROPERTY_WATCH
    /**
     * Adds a listener to listen for changes to a certain property.
     *
     * Implemented as Mozilla suggests; see
     * {@link https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Object/watch their site}.
     * @param {String} propName The property to watch
     * @param {Function} callback A function to call once the property changes
     */
    this.watch = function(propName, callback){
        var eventName = PROP + propName,
            wrapper   = function(e){
                callback.call(this, propName, e.oldvalue, e.value);
            };
        wrapper.callback = callback;

        (this.$eventsStack[eventName] || (this.$eventsStack[eventName] = []))
            .push(wrapper);
    };

    /**
     * Removes a listener to listen for changes to a certain property.
     * @param {String} propName The property to stop watching
     * @param {Function} callback The function to remove from the property
     */
    this.unwatch = function(propName, callback){
        var list, eventName = PROP + propName;
        if (!(list = this.$eventsStack[eventName]))
            return;

        for (var i = 0, l = list.length; i < l; i++) {
            if (list[i].callback == callback) {
                list.remove(i);
                return;
            }
        }
    };
    //#endif

    // #endif

    /**
     * Gets an array of properties for this element which can be bound.
     * @returns {Array}
     */
    this.getAvailableProperties = function(){
        return this.$supportedProperties.slice();
    };

    /**
     * Sets the value of a property of this element.
     *
     * Note: The value is the only thing set. Dynamic properties remain bound and the
     * value will be overridden.
     *
     * @param  {String}  prop        The name of the property of this element to
     *                               set using a dynamic rule.
     * @param  {String}  value       The value of the property to set.
     * @param  {Boolean} [forceOnMe] Specifies whether the property should be set even when
     *                               it has the same value.
     */
    this.setProperty = function(prop, value, forceOnMe, setAttr, inherited){
        var s, r, arr, e, i, l,
            oldvalue = this[prop],
            eventName = PROP + prop;//@todo prop event should be called too;

        //Try catch here, because comparison of a string with xmlnode gives and error in IE
        try{
            var isChanged = (typeof value == OBJ)
                ? value != (typeof oldvalue == OBJ ? oldvalue : null)
                : (this.$booleanProperties && this.$booleanProperties[prop]
                    ? oldvalue != apf.isTrue(value)
                    : String(oldvalue) !== String(value));
        } catch(e){
            var isChanged = true;
        }

        //Check if property has changed
        if (isChanged) {
            if (!forceOnMe) { //Recursion protection
                //Check if this property is bound to data
                if (typeof value != OBJ //this.xmlRoot &&
                  && (!(s = this.$attrExcludePropBind[prop]))// || s == 2
                  && (r = (this.$attrBindings && this.$attrBindings[prop]
                  || prop != VALUE && this.xmlRoot && this.$bindings[prop]
                  && this.$bindings[prop][0]))) {

                    //Check if rule has single xpath
                    if (r.cvalue.type == 3) {
                        //#ifdef __ENABLE_UIRECORDER_HOOK
                        if (apf.uirecorder && apf.uirecorder.captureDetails && inherited != 10 && inherited != 2) {
                            if (apf.uirecorder.isRecording || apf.uirecorder.isTesting) {// only capture events when recording  apf.uirecorder.isLoaded
                                if (this.ownerDocument && this.$aml && this.$amlLoaded)
                                    apf.uirecorder.capture.capturePropertyChange(this, prop, value, oldvalue);
                            }
                        }
                        //#endif

                        //Set the xml value - this should probably use execProperty
                        return apf.setNodeValue(
                            this.$getDataNode(prop.toLowerCase(), this.xmlRoot, true),
                            value, true);
                    }
                }
                //#ifdef __WITH_OFFLINE_STATE_REALTIME
                else if (typeof apf.offline != UNDEF) {
                    if (apf.loaded && apf.offline.state.enabled) {
                        apf.offline.state.set(this, prop, typeof value == OBJ
                            ? value.name
                            : value);
                    }
                    else if (apf.offline.enabled) {

                    }
                }
                //#endif
            }

            if (setAttr && !this.$funcHandlers[prop])
                this.setAttribute(prop, value, true);

            if (this.$handlePropSet(prop, value, forceOnMe) === false)
                return;

            //#ifdef __ENABLE_UIRECORDER_HOOK
            if (apf.uirecorder && apf.uirecorder.captureDetails && inherited != 10 && inherited != 2) {
                if (apf.uirecorder.isRecording || apf.uirecorder.isTesting) {// only capture events when recording  apf.uirecorder.isLoaded
                    if (this.ownerDocument && this.$aml && this.$amlLoaded)
                        apf.uirecorder.capture.capturePropertyChange(this, prop, this[prop], oldvalue);
                }
            }
            //#endif

            value = this[prop];
        }

        //Optimized event calling
        if ((arr = this.$eventsStack[eventName]) && isChanged) {
            /*for (i = 0, l = arr.length; i < l; i++) {
                if (arr[i].call(this, e || (e = new apf.AmlEvent(eventName, {
                    prop     : prop,
                    value    : value,
                    oldvalue : oldvalue
                }))) === false) {
                    e.returnValue = false;
                }
            }*/
            if (this.dispatchEvent(eventName, {
                prop     : prop,
                value    : value,
                oldvalue : oldvalue,
                changed  : isChanged
            }) === false) {
                e.returnValue = false;
            }
        }

        //#ifdef __WITH_PROPERTY_INHERITANCE
        /*
            States:
                    -1 Set
             undefined Pass through
                     2 Inherited
                     3 Semi-inherited
                    10 Dynamic property
        */
        //@todo this whole section should be about attribute inheritance and moved
        //      to AmlElement
        if ((aci || (aci = apf.config.$inheritProperties))[prop]) {
            //@todo this is actually wrong. It should be about removing attributes.
            var resetting = value === "" || typeof value == "undefined";
            if (inherited != 10 && !value) {
                delete this.$inheritProperties[prop];
                if (this.$setInheritedAttribute && this.$setInheritedAttribute(prop))
                    return;
            }
            else if (inherited != 10) { //Keep the current setting (for dynamic properties)
                this.$inheritProperties[prop] = inherited || -1;
            }

            //cancelable, needed for transactions
            //@todo the check on $amlLoaded is not as optimized as can be because $loadAml is not called yet
            if (this.$amlLoaded && (!e || e.returnValue !== false) && this.childNodes) {
                var inheritType = aci[prop];

                (function recur(nodes) {
                    var i, l, node, n;
                    for (i = 0, l = nodes.length; i < l; i++) {
                        node = nodes[i];
                        if (node.nodeType != 1 && node.nodeType != 7)
                            continue;

                        //Pass through
                        n = node.$inheritProperties[prop];
                        if (inheritType == 1 && !n)
                            recur(node.childNodes);

                        //Set inherited property
                        //@todo why are dynamic properties overwritten??
                        else if(!(n < 0)) {//Will also pass through undefined - but why??? @todo seems inefficient
                            if (n == 3 || inherited == 3) { //Because when parent sets semi-inh. prop the value can be the same
                                var sameValue = node[prop];
                                node[prop] = null;
                            }
                            node.setProperty(prop, n != 3
                                ? value
                                : sameValue, false, false, n || 2); //This is recursive already
                        }
                    }
                })(this.childNodes);
            }
        }
        //#endif

        return value;
    };
    var aci;

    /**
     * Gets the value of a property of this element.
     *
     * @param  {String}  prop   The name of the property of this element for which to get the value.
     */
    this.getProperty = function(prop){
        return this[prop];
    };

    // *** Event Handling ****/

    apf.$eventDepth = 0;
    this.$eventDepth = 0;

    /**
     * Calls all functions that are registered as listeners for an event.
     *
     * @param  {String}  eventName  The name of the event to dispatch.
     * @param  {Object}  [options]  The properties of the event object that will be created and passed through. These can be:
     *  - bubbles ([[Boolean]]): Specifies whether the event should bubble up to it's parent
     *  - captureOnly ([[Boolean]]): Specifies whether only the captured event handlers should be executed
     * @return {Mixed} return value of the event
     */
    this.dispatchEvent = function(eventName, options, e){
    //var allowEvents = {"DOMNodeInsertedIntoDocument":1,"DOMNodeRemovedFromDocument":1};
        var arr, result, rValue, i, l;

        if (!apf.AmlEvent)
            return;

        apf.$eventDepth++;
        this.$eventDepth++;

        e = options && options.name ? options : e;

        /*if (this.disabled && !allowEvents[eventName]) {
            result = false;
        }
        else {*/
            //#ifdef __DEBUG
            if (options && !options.bubbles && options.currentTarget && options.currentTarget != this)
                throw new Error("Invalid use of options detected in dispatch Event");
            //#endif

            //@todo rewrite this and all dependencies to match w3c
            if ((!e || !e.currentTarget) && (!options || !options.currentTarget)) {
                if (!(options || (options = {})).currentTarget)
                    options.currentTarget = this;

                //Capture support
                if (arr = this.$captureStack[eventName]) {
                    for (i = 0, l = arr.length; i < l; i++) {
                        rValue = arr[i].call(this, e || (e = new apf.AmlEvent(eventName, options)));
                        if (typeof rValue != UNDEF)
                            result = rValue;
                    }
                }
            }

            //@todo this should be the bubble point

            if (options && options.captureOnly) {
                return e && typeof e.returnValue != UNDEF ? e.returnValue : result;
            }
            else {
                if (this["on" + eventName]) {
                    result = this["on" + eventName].call(this, e
                        || (e = new apf.AmlEvent(eventName, options))); //Backwards compatibility
                }

                if (arr = this.$eventsStack[eventName]) {
                    for (i = 0, l = arr.length; i < l; i++) {
                        if (!arr[i]) continue;
                        rValue = arr[i].call(this, e
                            || (e = new apf.AmlEvent(eventName, options)));
                        if (typeof rValue != UNDEF)
                            result = rValue;
                    }
                }
            }
        //}

        /*var p;
        while (this.$removalQueue.length) {
            p = this.$removalQueue.shift();
            p[0].remove(p[1]);
        }*/

        //#ifdef __WITH_EVENT_BUBBLING
        if ((e && e.bubbles && !e.cancelBubble || !e && options && options.bubbles) && this != apf) {
            rValue = (this.parentNode || this.ownerElement || apf).dispatchEvent(eventName, options, e);
            // || (e = new apf.AmlEvent(eventName, options))

            if (typeof rValue != UNDEF)
                result = rValue;
        }
        //#endif

        if (--apf.$eventDepth == 0 && this.ownerDocument
          && !this.ownerDocument.$domParser.$parseContext
          && !apf.isDestroying && apf.loaded
          //#ifdef __DEBUG
          && eventName != "debug"
          //#endif
          && apf.queue
        ) {
            apf.queue.empty();
        }

        this.$eventDepth--;

        //#ifdef __ENABLE_UIRECORDER_HOOK
        if (apf.uirecorder && apf.uirecorder.captureDetails) {
            if (["debug"].indexOf(eventName) == -1 && (!e || e.currentTarget == this)) { // ,"DOMNodeRemoved","DOMNodeRemovedFromDocument","DOMNodeInsertedIntoDocument"
                //if (apf.uirecorder.isLoaded) { // skip init loading and drawing of elements
                    if (apf.uirecorder.isRecording || apf.uirecorder.isTesting) { // only capture events when recording
                        apf.uirecorder.capture.captureEvent(eventName, e || (e = new apf.AmlEvent(eventName, options)));
                    }
                //}
                // when eventName == "load" all elements are loaded and drawn
                /*
                if (eventName == "load" && this.isIE != undefined)
                    apf.uirecorder.isLoaded = true;
                */
            }
        }
        //#endif

        if (options) {
            try {
                delete options.currentTarget;
            }
            catch(ex) {
                options.currentTarget = null;
            }
        }

        return e && typeof e.returnValue != UNDEF ? e.returnValue : result;
    };

    /**
     * Adds a function to be called when a event is called.
     *
     * @param  {String}   eventName The name of the event for which to register
     *                              a function.
     * @param  {Function} callback  The code to be called when an event is dispatched.
     */
    this.addEventListener = function(a, b, c){
        this.$bufferEvents.push([a,b,c]);
    };

    var realAddEventListener = function(eventName, callback, useCapture){
        //#ifdef __PROFILER
        if (apf.profiler)
            apf.profiler.wrapFunction(Profiler_functionTemplate());
        //#endif

        if (eventName.substr(0, 2) == "on")
            eventName = eventName.substr(2);

        var s, stack = useCapture ? this.$captureStack : this.$eventsStack;
        if (!(s = stack[eventName]))
            s = stack[eventName] = [];

        if (s.indexOf(callback) > -1)
            return;

        s.unshift(callback);

        var f;
        if (f = this.$eventsStack["$event." + eventName])
            f[0].call(this, callback);
    };

    /**
     * Removes a function registered for an event.
     *
     * @param  {String}   eventName The name of the event for which to unregister
     *                              a function.
     * @param  {Function} callback  The function to be removed from the event stack.
     */
    this.removeEventListener = function(eventName, callback, useCapture){
        var stack = (useCapture ? this.$captureStack : this.$eventsStack)[eventName];

        //@todo is this the best way?
        if (stack) {
            if (this.$eventDepth)
                stack = (useCapture ? this.$captureStack : this.$eventsStack)[eventName] = stack.slice()

            stack.remove(callback);
            if (!stack.length)
                delete (useCapture ? this.$captureStack : this.$eventsStack)[eventName];
        }
    };

    /**
     * Checks if there is an event listener specified for the event.
     *
     * @param  {String}  eventName  The name of the event to check.
     * @return {Boolean} Specifies whether the event has listeners
     */
    this.hasEventListener = function(eventName){
        return (this.$eventsStack[eventName] && this.$eventsStack[eventName].length > 0);
    };

    /**
     * The destructor of a Class.
     * Calls all the destructor functions, and removes all memory leaking references.
     * This function is called when exiting the application or closing the window.
     * @param {Boolean} deep whether the children of this element should be destroyed.
     * @param {Boolean} [clean]
     */
    this.destroy = function(deep, clean){
        //Remove from apf.all
        if (typeof this.$uniqueId == UNDEF && this.nodeType != 2)
            return;

        this.$amlLoaded    = false;
        this.$amlDestroyed = true;

        if (this.$destroy)
            this.$destroy();

        this.dispatchEvent("DOMNodeRemoved", {
            relatedNode  : this.parentNode,
            bubbles      : !apf.isDestroying
        });
        this.dispatchEvent("DOMNodeRemovedFromDocument");

        apf.all[this.$uniqueId] = undefined;

        // != 2 && this.nodeType != 3
        if (!this.nodeFunc && !this.nodeType) { //If this is not a AmlNode, we're done.
            //Remove id from global js space
            try {
                if (this.id || this.name)
                    delete self[this.id || this.name];
            }
            catch (ex) {}
            return;
        }

        if (this.$ext && !this.$ext.isNative) { // && this.$ext.nodeType == 1
            if (this.nodeType == 1 && this.localName != "a")
                this.$ext.oncontextmenu = this.$ext.host = null;
            if (clean) {
                if (this.localName != "collection" && this.$ext.parentNode)
                    this.$ext.parentNode.removeChild(this.$ext);
            }
        }
        if (this.$int && !this.$int.isNative && this.$int.nodeType == 1 && this.localName != "a")
            this.$int.host = null;

        //if (this.$aml && this.$aml.parentNode)
            //this.$aml.parentNode.removeChild(this.$aml);
        this.$aml = null;

        //Clear all children too
        if (deep && this.childNodes) {
            var nodes = this.childNodes;
            for (i = nodes.length - 1; i >= 0; i--) {
                if (nodes[i].destroy)
                    nodes[i].destroy(true, clean && this.localName == "collection");
            }
            this.childNodes = null;
        }

        //Remove from DOM tree if we are still connected
        if (this.parentNode && this.removeNode)
            this.removeNode();
        else if (this.ownerElement && !this.ownerElement.$amlDestroyed)
            this.ownerElement.removeAttributeNode(this);

        //Remove from focus list - Should be in AmlNode
        //#ifdef __WITH_FOCUS
        if (this.$focussable && this.focussable)
            apf.window.$removeFocus(this);
        //#endif

        //#ifdef __WITH_PROPERTY_BINDING
        //Remove dynamic properties
        /*var f, i, l, h;
        for (prop in this.$funcHandlers) {
            h = this.$funcHandlers[prop];

            //Remove any bounds if relevant
            if (h && typeof h != FUN) {
                for (i = 0, l = h.length; i < l; i++) {
                    (f = h[i]).amlNode.removeEventListener(PROP + f.prop, f.handler);
                }
            }
        }*/
        //#endif

        if (this.attributes) {
            var attr = this.attributes;
            for (var i = attr.length - 1; i >= 0; i--) {
                //#ifdef __WITH_PROPERTY_BINDING
                this.$clearDynamicProperty(attr[i].nodeName);
                //#endif
                attr[i].destroy();
            }
        }

        //#ifdef __DEBUG
        if (deep !== false && this.childNodes && this.childNodes.length) {
            apf.console.warn("You have destroyed an Aml Node without destroying "
                           + "it's children. Please be aware that if you don't "
                           + "maintain a reference, memory might leak");
        }
        //#endif

        //Remove id from global js space
        try {
            if (this.id || this.name)
                self[this.id || this.name] = null;
        }
        catch (ex) {}

        for (var prop in this.$captureStack) this.$captureStack[prop] = null;
        for (var prop in this.$eventsStack) this.$eventsStack[prop] = null;
        for (var prop in this.$funcHandlers) this.$funcHandlers[prop] = null;

        if (this.$bufferEvents) {
            for (var i = this.$bufferEvents.length - 1; i >= 0; i--)
                this.$bufferEvents = null;
        }

        //#ifdef __WITH_NAMESERVER
        apf.nameserver.remove(this.localName, this);
        //#endif
    };
})();

apf.extend(apf, new apf.Class().$init());
apf.Init.run("class");
// #endif
