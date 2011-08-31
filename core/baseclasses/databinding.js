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

apf.__DATABINDING__ = 1 << 1;

// #ifdef __WITH_DATABINDING

/**
 * Baseclass adding data binding features to this element. Databinding takes
 * care of automatically going from data to representation and establishing a
 * permanent link between the two. In this way data that is changed will
 * change the representation as well. Furthermore, actions that are executed on
 * the representation will change the underlying data.
 * Example:
 * <code>
 *  <a:list>
 *      <a:model>
 *          <data>
 *              <item icon="ajax_org.gif">Item 1</item>
 *              <item icon="ajax_org.gif">Item 2</item>
 *          </data>
 *      </a:model>
 *      <a:bindings>
 *          <a:icon match="[@icon]" />
 *          <a:caption match="[text()]" />
 *          <a:each match="[item]" />
 *      </a:bindings>
 *  </a:list>
 * </code>
 *
 * @event error             Fires when a communication error has occured while
 *                          making a request for this element.
 *   cancelable: Prevents the error from being thrown.
 *   bubbles:
 *   object:
 *   {Error}          error     the error object that is thrown when the event
 *                              callback doesn't return false.
 *   {Number}         state     the state of the call
 *     cancellable: Prevents the error from being thrown.
 *     Possible values:
 *     apf.SUCCESS  the request was successfull
 *     apf.TIMEOUT  the request has timed out.
 *     apf.ERROR    an error has occurred while making the request.
 *     apf.OFFLINE  the request was made while the application was offline.
 *   {mixed}          userdata  data that the caller wanted to be available in
 *                              the callback of the http request.
 *   {XMLHttpRequest} http      the object that executed the actual http request.
 *   {String}         url       the url that was requested.
 *   {Http}           tpModule  the teleport module that is making the request.
 *   {Number}         id        the id of the request.
 *   {String}         message   the error message.
 * @event beforeretrieve    Fires before a request is made to retrieve data.
 *   cancelable: Prevents the data from being retrieved.
 * @event afterretrieve     Fires when the request to retrieve data returns both
 *                          on success and failure.
 * @event receive           Fires when data is successfully retrieved
 *   object:
 *   {String} data  the retrieved data
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 * @default_private
 */
apf.DataBinding = function(){
    this.$init(true);
    
    this.$loadqueue = 
    this.$dbTimer   = null;
    this.$regbase   = this.$regbase | apf.__DATABINDING__;
    this.$mainBind  = "value";
    
    this.$bindings     = 
    this.$cbindings    = 
    this.$attrBindings = false;

    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        model     : 1,
        each      : 1
        //eachvalue : 1 //disabled because of line 1743 valueRule = in multiselect.js
    }, this.$attrExcludePropBind);

    /**** Public Methods ****/

    /**
     * Sets a value of an XMLNode based on an xpath statement executed on the data of this model.
     *
     * @param  {String}  xpath  the xpath used to select a XMLNode.
     * @param  {String}  value  the value to set.
     * @return  {XMLNode}  the changed XMLNode
     */
    this.setQueryValue = function(xpath, value, type){
        var node = apf.createNodeFromXpath(this[type || 'xmlRoot'], xpath);
        if (!node)
            return null;

        apf.setNodeValue(node, value, true);
        //apf.xmldb.setTextNode(node, value);
        return node;
    };

    /**
     * Queries the bound data for a string value
     *
     * @param {String} xpath  the xpath statement which queries on the data this element is bound on.
     * @param {String} type   the node that is used as the context node for the query.
     * Possible values:
     * selected     the selected data anode of this element.
     * xmlRoot      the root data node that this element is bound on.
     * indicator    the data node that is highlighted for keyboard navigation.
     * @return {String} value of the selected XML Node
     * @todo
     *  lstRev.query('revision/text()', 'selected');
     *  lstRev.query('revision/text()', 'xmlRoot');
     *  lstRev.query('revision/text()', 'indicator');
     */
    this.queryValue = function(xpath, type){
        return apf.queryValue(this[type || 'xmlRoot'], xpath );
    };
	/**
     * Queries the bound data for an array of string values
     *
     * @param {String} xpath the xpath statement which queries on the data this element is bound on.
     * @param {String} type   the node that is used as the context node for the query.
     * Possible values:
     * selected     the selected data anode of this element.
     * xmlRoot      the root data node that this element is bound on.
     * indicator    the data node that is highlighted for keyboard navigation.
     * @return {String} value of the selected XML Node
     */
    this.queryValues = function(xpath, type){
        return apf.queryValues(this[type || 'xmlRoot'], xpath );
    };
	
    /**
     * Executes an xpath statement on the data of this model
     *
     * @param  {String}   xpath    the xpath used to select the XMLNode(s).
     * @param {String} type   the node that is used as the context node for the query.
     * Possible values:
     * selected     the selected data anode of this element.
     * xmlRoot      the root data node that this element is bound on.
     * indicator    the data node that is highlighted for keyboard navigation.
     * @return  {variant}  XMLNode or NodeList with the result of the selection
     */
    this.queryNode = function(xpath, type){
        var n = this[type||'xmlRoot'];
		return n ? n.selectSingleNode(xpath) : null;
    };

    /**
     * Executes an xpath statement on the data of this model
     *
     * @param  {String}   xpath    the xpath used to select the XMLNode(s).
     * @param {String} type   the node that is used as the context node for the query.
     * Possible values:
     * selected     the selected data anode of this element.
     * xmlRoot      the root data node that this element is bound on.
     * indicator    the data node that is highlighted for keyboard navigation.
     * @return  {variant}  XMLNode or NodeList with the result of the selection
     */
    this.queryNodes = function(xpath, type){
        var n = this[type||'xmlRoot'];
		return n ? n.selectNodes(xpath) : [];
    };
	
    this.$checkLoadQueue = function(){
        // Load from queued load request
        if (this.$loadqueue) {
            if (!this.caching)
                this.xmlRoot = null;
            var q = this.load(this.$loadqueue[0], {cacheId: this.$loadqueue[1]});
            if (!q || q.dataType != apf.ARRAY || q != this.$loadqueue)
                this.$loadqueue = null;
        }
        else return false;
    };
    
    //setProp
    this.$execProperty = function(prop, xmlNode, undoObj){
        var attr = this.$attrBindings[prop];
        
        //@todo this is a hacky solution for replaceNode support - Have to rethink this.
        if (this.nodeType == 7) {
            if (xmlNode != this.xmlRoot)
                this.xmlRoot = xmlNode;
        }
        
        //#ifdef __DEBUG
        if (!attr) {
            apf.console.error("Could not find attribute handler for property '" 
                + prop + "' on " + this.localName + ":" + (this.id || ""));
            return;
        }
        //#endif
        
        //#ifdef __WITH_LANG_SUPPORT
        apf.$lm_has_lang = false;
        //#endif

        /*#ifndef __DEBUG
        try {
        #endif */
            if (attr.cvalue.asyncs) { //if async
                var _self = this;
                return attr.cvalue.call(this, xmlNode, function(value){
                    _self.setProperty(prop, value, true);
                    
                    //#ifdef __WITH_LANG_SUPPORT
                    //@todo apf3.0
                    if (apf.$lm_has_lang)
                        apf.language.addProperty(this, prop, attr.cvalue); //@todo should auto remove
                    //#endif
                
                }); 
            }
            else {
                var value = attr.cvalue.call(this, xmlNode);
            }
        /*#ifndef __DEBUG
        }
        catch(e){
            apf.console.warn("[400] Could not execute binding for property "
                + prop + "\n\n" + e.message);
            return;
        }
        #endif */
        
        this.setProperty(prop, undoObj && undoObj.extra.range || value, true); //@todo apf3.0 range
        
        //#ifdef __WITH_LANG_SUPPORT
        //@todo apf3.0
        if (apf.$lm_has_lang)
            apf.language.addProperty(this, prop, attr.cvalue); //@todo should auto remove
        //#endif
    };
    
    //@todo apf3.0 contentEditable support
    this.$applyBindRule = function(name, xmlNode, defaultValue, callback, oHtml){
        var handler = this.$attrBindings[name] 
          && this.$attrBindings[name].cvalue || this.$cbindings[name];

        return handler ? handler.call(this, xmlNode, callback) : defaultValue || "";
    };

    //#ifdef __WITH_AML_BINDINGS
    this.addEventListener("$clear", function(){
        var queue;
        if (!this.$amlBindQueue || !(queue = this.$amlBindQueue.caption))
            return;

        for (var id in queue) {
            var lm = queue[id];
            if (lm.destroy) {
                lm.parentNode = lm.$focusParent = lm.$model = lm.xmlRoot = null;
                lm.destroy();
            }
            delete queue[id];
        }
        
        //delete this.$amlBindQueue;
    });
    
    var afterloadUpdate;
    this.addEventListener("afterload", afterloadUpdate = function(){
        var queue;
        if (!this.$amlBindQueue 
          || !(queue = this.$amlBindQueue.caption || this.$amlBindQueue.column))
            return;

        var div, doc = this.ownerDocument;
        for (var lm, i = 0, l = queue.length; i < l; i++) {
            if (!queue[i]) continue; //@todo check out why this happens
            
            div = document.getElementById("placeholder_" 
                + this.$uniqueId + "_" + i);
            
            lm = doc.createProcessingInstruction("lm", this.$cbindings.caption 
              || this.$cbindings.column);
            lm.$model  = this.$model;
            lm.xmlRoot = queue[i]; //xmlNode
            lm.$noInitModel = true;
            //lm.$useXmlDiff  = true;
            lm.$focusParent = this;
            lm.parentNode   = this;
            lm.dispatchEvent("DOMNodeInsertedIntoDocument", {
                pHtmlNode: div
            });
            queue[lm.xmlRoot.getAttribute(apf.xmldb.xmlIdTag)] = lm;
            delete queue[i];
        }
        
        queue.length = 0;
    });
    
    //Add and remove handler
    this.addEventListener("xmlupdate", function(e){
        if (e.xmlNode != e.traverseNode) //@todo this should be more specific
            return;
        
        if ("insert|add|synchronize|move".indexOf(e.action) > -1)
            afterloadUpdate.call(this, e);
        else if ("remove|move-away".indexOf(e.action) > -1) {
            var queue;
            if (!this.$amlBindQueue || !(queue = this.$amlBindQueue.caption))
                return;

            /*var htmlNode = apf.xmldb.findHtmlNode(e.xmlNode, this);
            var captionNode = this.$getLayoutNode("caption", htmlNode);
            var id = captionNode.getAttribute("id").split("_")[2];
            var lm = queue[id];*/
            var lm = queue[e.xmlNode.getAttribute(apf.xmldb.xmlIdTag)];
            lm.parentNode = lm.$focusParent = lm.$model = lm.xmlRoot = null;
            lm.destroy();
        }
    });
    //#endif
    
    this.$hasBindRule = function(name){
        return this.$attrBindings[name] || this.$bindings 
          && this.$bindings[name];
    };
    
    this.$getBindRule = function(name, xmlNode){
        return this.$attrBindings[name] || this.$bindings 
          && this.$bindings.getRule(name, xmlNode);
    };
    
    var ruleIsMatch = {"drag":1,"drop":1,"dragcopy":1}
    this.$getDataNode = function(name, xmlNode, createNode, ruleList, multiple){
        var node, rule = this.$attrBindings[name];
        if (rule) { //@todo apf3.0 find out why drag and drop rules are already compiled here
            if (rule.cvalue.type != 3) //@todo warn here?
                return false;
            
            var func = rule.cvalue2 || rule.compile("value", {
                xpathmode  : multiple ? 4 : 3,
                parsecode  : 1,
                injectself : ruleIsMatch[name]
            });
            if (func && (node = func(xmlNode, createNode))) {
                if (ruleList)
                    ruleList.push(rule);

                return node;
            }
            
            return false;
        }
        
        return this.$bindings 
           && this.$bindings.getDataNode(name, xmlNode, createNode, ruleList, multiple);
    };
    
    /**
     * Sets the model of the specified element
     *
     * @param  {Model}  The model this element is going to connect to.
     * 
     */
    //#ifdef __WITH_CONVENIENCE_API
    this.setModel = function(model){
        this.setAttribute("model", model, false, true);
    };
    //#endif
    
    /**
     * Gets the model to which this element is connected.
     * This is the model which acts as a datasource for this element.
     *
     * @param {Boolean} doRecur whether the model should be searched recursively up the data tree.
     * @returns  {Model}  The model this element is connected to.
     * @see  element.smartbinding
     */
    this.getModel = function(doRecur){
        if (doRecur && !this.$model)
            return this.dataParent ? this.dataParent.parent.getModel(true) : null;

        return this.$model;
    };
    
    /**
     * Reloads the data in this element.
     *
     */
    this.reload = this.reload || function(){
        this.load(this.xmlRoot, {cacheId: this.cacheId, force: true});
    };
    
    /**
     * Loads data in to this element using binding rules to transform the
     * data in to a presentation.
     * Example:
     * <code>
     *  <a:list id="lstExample">
     *      <a:bindings>
     *          <a:caption match="[text()]" />
     *          <a:icon match="[@icon]" />
     *          <a:each match="[image]" />
     *      </a:bindings>
     *  </a:list>
     *  
     *  <a:script><!--
     *      apf.onload = function() {
     *      lstExample.load('<images>\
     *          <image icon="icoTest.gif">image 1</image>\
     *          <image icon="icoTest.gif">image 2</image>\
     *          <image icon="icoTest.gif">image 3</image>\
     *          </images>');
     *      }
     *  --></a:script>
     * </code>
     *
     * @param {mixed}  [xmlNode]
     *   Possible Values:
     *   {XMLElement}  an xml element loaded in to this element.
     *   {String}      an xml string which is loaded in this element.
     *   {String}      an instruction to load data from a remote source.
     *   {Null}        null clears this element from it's data {@link baseclass.cache.method.clear}.
     * @param {Object} [options]
     *   Properties:
     *   {XMLElement} [xmlNode]    the {@link term.datanode data node} that provides
     *                             context to the data instruction.
     *   {Function}   [callback]   the code executed when the data request returns.
     *   {mixed}      []           Custom properties available in the data instruction.
     *   {String}     [cacheId]    the xml element to which the binding rules are applied.
     *   {Boolean}    [force]      whether cache is checked before loading the data.
     *   {Boolean}    [noClearMsg] wether a message is set when clear is called.
     *
     * @event beforeload  Fires before loading data in this element.
     *   cancelable: Prevents the data from being loaded.
     *   object:
     *   {XMLElement} xmlNode the node that is loaded as the root {@link term.datanode data node}.
     * @event afterload   Fires after loading data in this element.
     *   object:
     *   {XMLElement} xmlNode the node that is loaded as the root {@link term.datanode data node}.
     * @see  element.smartbinding
     * @see  baseclass.cache.method.clear
     */
    this.load = function(xmlNode, options){
        if (options) {
            var cacheId      = options.cacheId,
                forceNoCache = options.force,
                noClearMsg   = options.noClearMsg;
        }
        
        if (cacheId && cacheId == this.cacheId && !forceNoCache)
            return;

        //#ifdef __WITH_POPUP
        if (apf.popup.isShowing(this.$uniqueId))
            apf.popup.forceHide(); //This should be put in a more general position
        //#endif

        // Convert first argument to an xmlNode we can use;
        if (xmlNode) {
            if (typeof xmlNode == "string") {
                if (xmlNode.charAt(0) == "<")
                    xmlNode = apf.getXmlDom(xmlNode).documentElement;
                else {
                    return apf.model.prototype.$loadFrom.call(this, xmlNode, options);
                }
            }
            else if (xmlNode.nodeType == 9) {
                xmlNode = xmlNode.documentElement;
            }
            else if (xmlNode.nodeType == 3 || xmlNode.nodeType == 4) {
                xmlNode = xmlNode.parentNode;
            }
            else if (xmlNode.nodeType == 2) {
                xmlNode = xmlNode.ownerElement 
                    || xmlNode.parentNode 
                    || xmlNode.selectSingleNode("..");
            }
        }

        // If control hasn't loaded databinding yet, queue the call
        if (this.$preventDataLoad || !this.$canLoadData 
          && ((!this.$bindings && (!this.$canLoadDataAttr || !this.each)) || !this.$amlLoaded) 
          && (!this.hasFeature(apf.__MULTISELECT__) || !this.each) 
          || this.$canLoadData && !this.$canLoadData()) {
            
            if (!this.caching || !this.hasFeature(apf.__CACHE__)) {
                
                //@todo this is wrong. It is never updated when there are only
                //Property binds and then it just leaks xml nodes
                this.xmlRoot = xmlNode;
                
                //#ifdef __WITH_PROPERTY_BINDING
                this.setProperty("root", this.xmlRoot);
                //#endif
            }
            
            //#ifdef __DEBUG
            if (this.$amlLoaded && !this.$attrBindings) {
                apf.console.warn("Could not load data yet in " + (this.localName
                  ? this.localName + "[" + (this.name || "") + "]"
                  : this.nodeName) + ". The loaded data is queued "
                      + "until smartbinding rules are loaded or set manually.");
            }
            //#endif

            return this.$loadqueue = [xmlNode, cacheId];
        }

        // If no xmlNode is given we clear the control, disable it and return
        if (this.dataParent && this.dataParent.xpath)
            this.dataParent.parent.signalXmlUpdate[this.$uniqueId] = !xmlNode;

        if (!xmlNode && (!cacheId || !this.$isCached || !this.$isCached(cacheId))) {
            //#ifdef __DEBUG
            apf.console.warn("No xml root node was given to load in "
                + this.localName + "[" + (this.name || '') + "]. Clearing any "
                + "loaded xml in this component");
            //#endif

            this.clear(noClearMsg);

            //#ifdef __WITH_PROPERTY_BINDING
            if (apf.config.autoDisable && this.$createModel === false)
                this.setProperty("disabled", true);

            //@todo apf3.0 remove , true in clear above
            //this.setProperty("selected", null);
            //#endif
            return;
        }
        
        // If reloading current document, and caching is disabled, exit
        if (!this.caching && !forceNoCache && xmlNode 
          && !this.$loadqueue && xmlNode == this.xmlRoot)
            return;

        var disabled = this.disabled;
        this.disabled = false;

        //Run onload event
        if (this.dispatchEvent("beforeload", {xmlNode : xmlNode}) === false)
            return false;

        //#ifdef __DEBUG
        apf.console.info("Loading XML data in "
          + (this.localName 
            ? this.localName + "[" + (this.name || '') + "]"
            : this.nodeName));
        //#endif

        this.clear(true, true);

        this.cacheId = cacheId;

        if (this.dispatchEvent("$load", {
          forceNoCache : forceNoCache, 
          xmlNode  : xmlNode
        }) === false) {
            //delete this.cacheId;
            return;
        }
        
        //Set usefull vars
        this.documentId = apf.xmldb.getXmlDocId(xmlNode);
        this.xmlRoot    = xmlNode;
        
        //#ifdef __WITH_PROPERTY_BINDING
        this.setProperty("root", this.xmlRoot);
        //#endif

        //#ifdef __WITH_LANG_SUPPORT
        apf.$lm_has_lang = false;
        //#endif

        // Draw Content
        this.$load(xmlNode);
        
        //#ifdef __WITH_LANG_SUPPORT
        //@todo apf3.0
        if (apf.$lm_has_lang)
            apf.language.addBinding(this); //@todo should auto remove
        else
            apf.language.removeBinding(this);
        //#endif

        // Check if subtree should be loaded
        this.$loadSubData(xmlNode);

        if (this.$createModel === false) {
            this.disabled = true;
            this.setProperty("disabled", false);
        }
        else
            this.disabled = disabled;

        // Run onafteronload event
        this.dispatchEvent('afterload', {xmlNode : xmlNode});
    };
    
    /**
     * @binding load Determines how new data is loaded data is loaded into this
     * element. Usually this is only the root node containing no children.
     * Example:
     * This example shows a load rule in a text element. It gets its data from
     * a list. When a selection is made on the list the data is loaded into the
     * text element.
     * <code>
     *  <a:list id="lstExample" width="200" height="200">
     *      <a:bindings>
     *          <a:caption match="[text()]" />
     *          <a:value match="[text()]" />
     *          <a:each match="[message]" />
     *      </a:bindings>
     *      <a:model>
     *          <messages>
     *              <message id="1">message 1</message>
     *              <message id="2">message 2</message>
     *          </messages>
     *      </a:model>
     *  </a:list>
     * 
     *  <a:text model="{lstExample.selected}" width="200" height="150">
     *      <a:bindings>
     *          <a:load get="http://localhost/getMessage.php?id=[@id]" />
     *          <a:contents match="[message/text()]" />
     *      </a:bindings>
     *  </a:text>
     * </code>
     * @attribute {string} get the {@link term.datainstruction data instruction}
     *                     that is used to load data into the xmlRoot of this component.
     */
    this.$loadSubData = function(xmlRootNode){
        if (this.$hasLoadStatus(xmlRootNode) && !this.$hasLoadStatus(xmlRootNode, "potential")) 
            return;

        //var loadNode = this.$applyBindRule("load", xmlRootNode);
        var rule = this.$getBindRule("load", xmlRootNode);
        if (rule && (!rule[1] || rule[1](xmlRootNode))) {
            // #ifdef __WITH_OFFLINE_TRANSACTIONS
            if (typeof apf.offline != "undefined" && !apf.offline.onLine) {
                apf.offline.transactions.actionNotAllowed();
                this.$loadedWhenOffline = true;
    
                //this.hasFeature(apf.__MULTISELECT__)
                if (this.$setClearMessage && !this.getTraverseNodes().length)
                    this.$setClearMessage(this["offline-message"], "offline");
    
                return;
            }
            //#endif
            
            this.$setLoadStatus(xmlRootNode, "loading");

            if (this.$setClearMessage)
                this.$setClearMessage(this["loading-message"], "loading");

            //||apf.xmldb.findModel(xmlRootNode)
            var mdl = this.getModel(true);
            //#ifdef __DEBUG
            if (!mdl)
                throw new Error("Could not find model");
            //#endif

            var amlNode = this;
            if (mdl.$insertFrom(rule.getAttribute("get"), {
              xmlNode     : xmlRootNode,  //@todo apf3.0
              insertPoint : xmlRootNode, //this.xmlRoot,
              amlNode     : this,
              callback    : function(){
                    //#ifdef __WITH_PROPERTY_BINDING
                    amlNode.setProperty(amlNode.hasFeature(apf.__MULTISELECT__) 
                        ? "selected" 
                        : "root", xmlRootNode);
                    //#endif
                }
              }) === false
            ) {
                this.clear(true);
                //#ifdef __WITH_PROPERTY_BINDING
                if (apf.config.autoDisable)
                    this.setProperty("disabled", true);

                //amlNode.setProperty("selected", null); //@todo is this not already done in clear?
                //#endif
            }
        }
    };
    
    /**
     * Unloads data from this element and resets state displaying an empty message.
     * Empty message is set on the {@link baseclass.guielement.property.msg}.
     *
     * @param {Boolean} [nomsg]   whether to display the empty message.
     * @param {Boolean} [doEvent] whether to sent select events.
     * @see baseclass.databinding.method.load
     * @private
     */
    //@todo this function is called way too much for a single load of a tree
    //@todo should clear listener
    this.clear = function(nomsg, doEvent, fakeClear){
        if (!this.$container)
            return;//@todo apf3.0

        if (this.clearSelection)
            this.clearSelection(true);//!doEvent);//@todo move this to the $clear event in multiselect.js

        var lastHeight = this.$container.offsetHeight;

        if (this.dispatchEvent("$clear") !== false)
            this.$container.innerHTML = ""; //@todo apf3.0

        if (typeof nomsg == "string") {
            var msgType = nomsg;
            nomsg = false;
            
            //@todo apf3.0 please use attr. inheritance
            if (!this[msgType + "-message"]) {
                this.$setInheritedAttribute(msgType + "-message");
            }
        }
        this.$lastClearType = msgType || null;

        if (!nomsg && this.$setClearMessage) {
            this.$setClearMessage(msgType 
              ? this[msgType + "-message"] 
              : this["empty-message"], msgType || "empty", lastHeight);

            //this.setProperty("selected", null); //@todo apf3.0 get the children to show loading... as well (and for each selected, null
            //c[i].o.clear(msgType, doEvent);
        }
        else if(this.$removeClearMessage)
            this.$removeClearMessage();

        if (!fakeClear)
            this.documentId = this.xmlRoot = this.cacheId = null;

        //#ifdef __WITH_PROPERTY_BINDING
        if (!nomsg) {
            if (this.hasFeature(apf.__MULTISELECT__)) //@todo this is all wrong
                this.setProperty("length", 0);
            //else 
                //this.setProperty("value", ""); //@todo redo apf3.0
        }
        //#endif
    };
    
    this.clearMessage = function(msg){
        this.customMsg = msg;
        this.clear("custom");
    };

    /**
     * @private
     */
    //@todo optimize this
    this.$setLoadStatus = function(xmlNode, state, remove){
        var group  = this.loadgroup || "default";
        var re     = new RegExp("\\|(\\w+)\\:" + group + ":(\\d+)\\|");
        var loaded = xmlNode.getAttribute("a_loaded") || "";

        var m;        
        if (!remove && (m = loaded.match(re)) && m[1] != "potential" && m[2] != this.$uniqueId)
            return;
        
        //remove old status if any
        var ostatus = loaded.replace(re, "")
        if (!remove)
            ostatus += "|" + state + ":" + group + ":" + this.$uniqueId + "|";

        xmlNode.setAttribute("a_loaded", ostatus);
    };

    /**
     * @private
     */
    this.$removeLoadStatus = function(xmlNode){
        this.$setLoadStatus(xmlNode, null, true);
    };

    /**
     * @private
     */
    this.$hasLoadStatus = function(xmlNode, state, unique){
        if (!xmlNode)
            return false;
        var ostatus = xmlNode.getAttribute("a_loaded");
        if (!ostatus)
            return false;
    
        var group  = this.loadgroup || "default";
        var re     = new RegExp("\\|" + (state || "\\w+") + ":" + group + ":" + (unique ? this.$uniqueId : "\\d+") + "\\|");
        return ostatus.match(re) ? true : false;
    };

    /**
     * @event beforeinsert Fires before data is inserted.
     *   cancelable: Prevents the data from being inserted.
     *   object:
     *   {XMLElement} xmlParentNode the parent in which the new data is inserted
     * @event afterinsert Fires after data is inserted.
     */

    /**
     * @private
     */
    this.insert = function(xmlNode, options){
        if (typeof xmlNode == "string") {
            if (xmlNode.charAt(0) == "<") {
                
                if (options.whitespace === false)
                    xmlNode = xmlNode.replace(/>[\s\n\r]*</g, "><");
                
                xmlNode = apf.getXmlDom(xmlNode).documentElement;
            }
            else {
                if (!options.insertPoint)
                    options.insertPoint = this.xmlRoot;
                return apf.model.prototype.$insertFrom.call(this, xmlNode, options);
            }
        }
        
        var insertPoint = options.insertPoint || this.xmlRoot;

        if (this.dispatchEvent("beforeinsert", {
          xmlParentNode : insertPoint
        }) === false)
            return false;

        //Integrate XMLTree with parentNode
        if (typeof options.copyAttributes == "undefined")
            options.copyAttributes = true;
            
        var newNode = apf.mergeXml(xmlNode, insertPoint, options);

        //Call __XMLUpdate on all listeners
        apf.xmldb.applyChanges("insert", insertPoint);

        //Select or propagate new data
        if (this.selectable && this.autoselect) {
            if (this.xmlNode == newNode)
                this.$selectDefault(this.xmlNode);
        }
        //#ifdef __WITH_PROPERTY_BINDING
        else if (this.xmlNode == newNode) {
            this.setProperty("root", this.xmlNode);
        }
        //#endif

        if (this.$hasLoadStatus(insertPoint, "loading"))
            this.$setLoadStatus(insertPoint, "loaded");

        this.dispatchEvent("afterinsert");

        //Check Connections
        //this one shouldn't be called because they are listeners anyway...(else they will load twice)
        //if(this.selected) this.setConnections(this.selected, "select");
    };
    
    /**
     * @attribute {Boolean} render-root whether the xml element loaded into this
     * element is rendered as well. Default is false.
     * Example:
     * This example shows a tree which also renders the root element.
     * <code>
     *  <a:tree render-root="true">
     *      <a:model>
     *          <root name="My Computer">
     *              <drive name="C">
     *                  <folder name="/Program Files" />
     *                  <folder name="/Desktop" />
     *              </drive>
     *          </root>
     *      </a:model>
     *      <a:bindings>
     *          <a:caption match="[@name]"></a:caption>
     *          <a:each match="[root|drive|folder]"></a:each>
     *      </a:bindings>
     *  </a:tree>
     * </code>
     */
    this.$booleanProperties["render-root"] = true;
    this.$supportedProperties.push("empty-message", "loading-message",
        "offline-message", "render-root", "smartbinding",
        "bindings", "actions");

    /**
     * @attribute {Boolean} render-root wether the root node of the data loaded
     * into this element is rendered as well. 
     * @see element.tree
     */
    this.$propHandlers["render-root"] = function(value){
        this.renderRoot = value;
    };
    
    /**
     * @attribute {String} empty-message the message displayed by this element
     * when it contains no data. This property is inherited from parent nodes.
     * When none is found it is looked for on the appsettings element. Otherwise
     * it defaults to the string "No items".
     */
    this.$propHandlers["empty-message"] = function(value){
        this["empty-message"] = value;

        if (this.$updateClearMessage) 
            this.$updateClearMessage(this["empty-message"], "empty");
    };

    /**
     * @attribute {String} loading-message  the message displayed by this
     * element when it's loading. This property is inherited from parent nodes.
     * When none is found it is looked for on the appsettings element. Otherwise
     * it defaults to the string "Loading...".
     * Example:
     * This example uses property binding to update the loading message. The
     * position of the progressbar should be updated by the script taking care
     * of loading the data.
     * <code>
     *  <a:list loading-message="{'Loading ' + Math.round(progress1.value*100) + '%'}" />
     *  <a:progressbar id="progress1" />
     * </code>
     * Remarks:
     * Usually a static loading message is displayed for only 100 milliseconds
     * or so, whilst loading the data from the server. This is done for instance
     * when the load binding rule is used. In the code example below a list
     * binds on the selection of a tree displaying folders. When the selection
     * changes, the list loads new data by extending the model. During the load
     * of this new data the loading message is displayed.
     * <code>
     *  <a:list model="[trFolders::element]">
     *      <a:bindings>
     *          ...
     *          <a:load get="{comm.getFiles([@path])}" />
     *      </bindings>
     *  </a:list>
     * </code>
     */
    this.$propHandlers["loading-message"] = function(value){
        this["loading-message"] = value;

        if (this.$updateClearMessage)
            this.$updateClearMessage(this["loading-message"], "loading");
    };

    /**
     * @attribute {String} offline-message  the message displayed by this
     * element when it can't load data because the application is offline.
     * This property is inherited from parent nodes. When none is found it is
     * looked for on the appsettings element. Otherwise it defaults to the
     * string "You are currently offline...".
     */
    this.$propHandlers["offline-message"] = function(value){
        this["offline-message"] = value;

        if (this.$updateClearMessage)
            this.$updateClearMessage(this["offline-message"], "offline");
    };

    /**
     * @attribute {String} smartbinding  the name of the SmartBinding for this
     * element. A smartbinding is a collection of rules which define how data
     * is transformed into representation, how actions on the representation are
     * propagated to the data and it's original source, how drag&drop actions
     * change the data and where the data is loaded from. Each of these are
     * optionally defined in the smartbinding set and can exist independently
     * of the smartbinding object.
     * Example:
     * This example shows a fully specified smartbinding. Usually only parts
     * are used. This example shows a tree with files and folders.
     * <code>
     *  <a:tree smartbinding="sbExample" />
     * 
     *  <a:smartbinding id="sbExample">
     *      <a:bindings>
     *          <a:caption  match  = "[@caption|@filename]"/>
     *          <a:icon     match  = "[file]"
     *                      value  = "icoFile.gif" />
     *          <a:icon     value  = "icoFolder.gif" />
     *          <a:each     match  = "[file|folder|drive]" />
     *          <a:drag     match  = "[folder|file]" />
     *          <a:drop     match  = "[folder]" 
     *                      target = "[root]"
     *                      action = "tree-append" />
     *          <a:drop     match  = "[folder]" 
     *                      target = "[folder]"
     *                      action = "insert-before" />
     *          <a:drop     match  = "[file]"   
     *                      target = "[folder|root]" 
     *                      action = "tree-append" />
     *          <a:drop     match  = "[file]"   
     *                      target = "[file]"
     *                      action = "insert-before" />
     *      </a:bindings>
     *      <a:actions>
     *          <a:remove set = "remove.php?path=[@path]" />
     *          <a:rename set = "move.php?from=oldValue&amp;to=[@path]" />
     *      </a:actions>
     *      <a:model src="xml/filesystem.xml" />
     *  </a:smartbinding>
     * </code>
     * Remarks:
     * The smartbinding parts can also be assigned to an element by adding them
     * directly as a child in aml.
     * <code>
     *  <a:tree>
     *      <a:bindings>
     *          ...
     *      </bindings>
     *      <a:model />
     *  </a:tree>
     * </code>
     *
     * See:
     * There are several ways to be less verbose in assigning certain rules.
     * <ul>
     *  <li>{@link baseclass.multiselectbinding.binding.each}</li>
     *  <li>{@link baseclass.dragdrop.attribute.drag}</li>
     *  <li>{@link element.bindings}</li>
     *  <li>{@link element.actions}</li>
     *  <li>{@link element.dragdrop}</li>
     * </ul>
     */
    this.$propHandlers["smartbinding"] = 
    
    /**
     * @attribute {String} actions the id of the actions element which
     * provides the action rules for this element. Action rules are used to
     * send changes on the bound data to a server.
     * Example:
     * <code>
     *  <a:tree 
     *    id             = "tree" 
     *    height         = "200" 
     *    width          = "250" 
     *    actions       = "actExample"
     *    model          = "xml/filesystem.xml"
     *    actiontracker  = "atExample"
     *    startcollapsed = "false" 
     *    onerror        = "alert('Sorry this action is not permitted');return false">
     *      <a:each match="[folder|drive]">
     *          <a:caption match="[@caption|@filename]" />
     *          <a:icon value="Famfolder.gif" />
     *      </a:each>
     *  </a:tree>
     *  
     *  <a:actions id="actExample">
     *      <a:rename match = "[file]"   
     *               set    = "rename_folder.php?id=[@fid]" />
     *      <a:rename match = "[folder]" 
     *               set    = "rename_file.php?id=[@fid]" />
     *  </a:actions>
     *  
     *  <a:button 
     *    caption = "Rename"
     *    right   = "10" 
     *    top     = "10"
     *    onclick = "tree.startRename()" />
     *  <a:button onclick="tree.getActionTracker().undo();">Undo</a:button>
     * </code>
     */
    this.$propHandlers["actions"] = 

    /**
     * @attribute {String} bindings the id of the bindings element which
     * provides the binding rules for this element.
     * Example:
     * This example shows a set of binding rules that transform data into the
     * representation of a list. In this case it displays the names of
     * several email accounts, with after each account name the number of unread
     * mails in that account. It uses JSLT to transform the caption.
     * <code>
     *  <a:model id="mdlExample">
     *      <data>
     *          <account icon="application.png">Account 1
     *              <mail read="false" />
     *              <mail read="false" />
     *              <mail read="true" />
     *          </account>
     *          <account icon="application.png">Account 2</account>
     *      </data>
     *  </a:model>
     *  <a:list bindings="bndExample" model="mdlExample" />
     * 
     *   <a:bindings id="bndExample">
     *      <a:caption>[text()] (#[mail[@read != 'true']])</a:caption>
     *      <a:icon match="[@icon]" />
     *      <a:each match="[account]" sort="[text()]" />
     *  </a:bindings>
     * </code>
     * Remarks:
     * Bindings can also be assigned directly by putting the bindings tag as a
     * child of this element.
     *
     * If the rule only contains a select attribute, it can be written in a
     * short way by adding an attribute with the name of the rule to the
     * element itself:
     * <code>
     *  <a:list 
     *    caption = "[text()] (#[mail[@read != 'true']])"
     *    icon    = "[@icon]"
     *    each    = "[account]"
     *    sort    = "[text()]" />
     * </code>
     */
    this.$propHandlers["bindings"] = function(value, prop){
        var local = "$" + prop + "Element";
        if (this[local])
            this[local].unregister(this);
        
        if (!value)
            return;
        //#ifdef __WITH_NAMESERVER
        // #ifdef __DEBUG
        if (!apf.nameserver.get(prop, value))
            throw new Error(apf.formatErrorString(1064, this,
                "Setting " + prop,
                "Could not find " + prop + " by name '" + value + "'"));
        // #endif

        apf.nameserver.get(prop, value).register(this);
        //#endif
        
        if (prop != "actions" && 
          this.$checkLoadQueue() === false && this.$amlLoaded)
            1+1; //@todo add reload queue.
            //this.reload();
    };

    //#ifdef __WITH_INLINE_DATABINDING
    var eachBinds = {"caption":1, "icon":1, "select":1, "css":1, "sort":1,
                     "drop":2, "drag":2, "dragcopy":2, "eachvalue":1}; //Similar to apf.Class
    // #endif
    this.$addAttrBind = function(prop, fParsed, expression) {
        //Detect if it uses an external model
        if (fParsed.models) {
            //#ifdef __WITH_MULTISELECT
            if (this.hasFeature(apf.__MULTISELECT__)) {
                //#ifdef __DEBUG
                if (eachBinds[prop]) {
                    //throw new Error("Cannot use external model inside " + prop + " rule"); //@todo apf3.0 convert to apf error
                }
                //#endif
            }
            //#endif
        }

        //Set listener for all models
        var i, xpath, modelId, model,
            paths = fParsed.xpaths,
            list  = {};
        //@todo when there is no model in xpath modelId == null...
        for (i = 0; i < paths.length; i+=2) {
            if (!list[(modelId = paths[i])])
                list[modelId] = 1;
            else list[modelId]++
        }
        
        if (!this.$propsUsingMainModel)
            this.$propsUsingMainModel = {};

        var rule = (this.$attrBindings || (this.$attrBindings = {}))[prop] = {
            cvalue  : fParsed,
            value   : expression,
            compile : apf.BindingRule.prototype.$compile,
            models  : []
        };

        delete this.$propsUsingMainModel[prop];
        for (xpath, i = 0; i < paths.length; i+=2) {
            modelId = paths[i];
            if (list[modelId] == -1)
                continue;

            xpath = paths[i + 1];

            if (modelId == "#" || xpath == "#") {
                var m = (rule.cvalue3 || (rule.cvalue3 = apf.lm.compile(rule.value, {
                    xpathmode: 5
                })))(this.xmlRoot);
                
                //@todo apf3 this needs to be fixed in live markup
                if (typeof m != "string") {
                    model = m.model && m.model.$isModel && m.model;
                    if (model)
                        xpath = m.xpath;
                    else if (m.model) {
                        model = typeof m.model == "string" ? apf.xmldb.findModel(m.model) : m.model;
                        xpath = apf.xmlToXpath(m.model, model.data) + (m.xpath ? "/" + m.xpath : ""); //@todo make this better
                    }
                    else {
                        //wait until model becomes available
                        this.addEventListener("prop." + prop, function(e){
                            var m = (rule.cvalue3 || (rule.cvalue3 = apf.lm.compile(rule.value, {
                                xpathmode: 5
                            })))(this.xmlRoot);
                            
                            if (m.model) {
                                this.removeEventListener("prop." + prop, arguments.callee);
                                var _self = this;
                                setTimeout(function(){
                                    _self.$clearDynamicProperty(prop);
                                    _self.$setDynamicProperty(prop, expression);
                                }, 10);
                            }
                        });
                        continue;
                    }
                }
                else model = null;
            }
            else model = null;

            if (!model) {
                if (modelId) {
                    //#ifdef __WITH_NAMESERVER
                    //@todo apf3.0 how is this cleaned up???
                    //Add change listener to the data of the model
                    model = apf.nameserver.get("model", modelId) //is model creation useful here?
                        || apf.setReference(modelId, apf.nameserver.register("model", modelId, new apf.model()));
                    //#endif
                }
                else {
                    if (!this.$model && !this.$initingModel)
                        initModel.call(this);
    
                    model = this.$model;

                    if (!this.hasFeature(apf.__MULTISELECT__) 
                      && eachBinds[prop] != 2 || !eachBinds[prop]) //@experimental - should not set this because model will load these attributes
                        this.$propsUsingMainModel[prop] = {
                            xpath    : xpath,
                            optimize : list[modelId] == 1
                        };
                }
            }
            
            //@todo warn here if no model??
            if (model && (!this.hasFeature(apf.__MULTISELECT__) 
              && eachBinds[prop] != 2 || !eachBinds[prop])) {
                //Create the attribute binding
                //@todo: remove listenRoot = expression.indexOf("*[") > -1 -> because it doesnt make sense in certain context. recheck selection handling
                model.$bindXmlProperty(this, prop, xpath, list[modelId] == 1); 
                rule.models.push(model);
            }
            
            list[modelId] = -1;
        }
        
        rule.xpath = xpath;

        this.$canLoadDataAttr = eachBinds[prop] == 1; //@todo apf3.0 remove
        this.$checkLoadQueue();
    }
    
    this.$removeAttrBind = function(prop){
        //@todo apf3.0
        //$model.$unbindXmlProperty
        var rule = this.$attrBindings[prop]
        if (!rule)
            return;
        
        delete this.$attrBindings[prop];
        delete this.$propsUsingMainModel[prop]
        
        var models = rule.models;
        if (models.length)
            for (var i = 0; i < models.length; i++) {
                models[i].$unbindXmlProperty(this, prop);
            }
        else if (this.$model)
            this.$model.$unbindXmlProperty(this, prop);
    };
    
    this.$initingModel;
    function initModel(){
        this.$initingModel = true;
        this.$setInheritedAttribute("model");
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //Set empty message if there is no data
        if (!this.model && this.$setClearMessage && !this.value)
            this.$setClearMessage(this["empty-message"], "empty");
        
        this.$amlLoaded = true; //@todo this can probably be removed
        this.$checkLoadQueue();
    });
    
    // #ifdef __WITH_LANG_SUPPORT
    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        apf.language.removeBinding(this);
    });
    // #endif

    /**
     * @attribute {String} model the name of the model to load data from or a
     * datainstruction to load data.
     * Example:
     * <code>
     *  <a:model id="mdlExample" src="filesystem.xml" />
     *   <a:tree 
     *     height         = "200" 
     *     width          = "250" 
     *     model          = "mdlExample">
     *       <a:each match="[folder|drive]">
     *           <a:caption match="[@caption]" />
     *           <a:icon value="Famfolder.gif" />
     *       </a:each>
     *   </a:tree>
     * </code>
     * Example:
     * <code>
     *  <a:tree 
     *    height         = "200" 
     *    width          = "250" 
     *    model          = "filesystem.xml">
     *      <a:each match="[folder|drive]">
     *          <a:caption match="[@caption]" />
     *          <a:icon value="Famfolder.gif" />
     *      </a:each>
     *  </a:tree>
     * </code>
     * Example:
     * <code>
     *  <a:tree 
     *     id             = "tree"
     *     height         = "200" 
     *     width          = "250" 
     *     model          = "filesystem.xml">
     *       <a:each match="[folder|drive]">
     *           <a:caption match="[@caption]" />
     *           <a:icon value="Famfolder.gif" />
     *       </a:each>
     *   </a:tree>
     *   <a:text 
     *     model  = "{tree.selected}" 
     *     value  = "[@caption]" 
     *     width  = "250" 
     *     height = "100" />
     * </code>
     * Remarks:
     * This attribute is inherited from a parent when not set. You can use this
     * to tell sets of elements to use the same model.
     * <code>
     *  <a:bar model="mdlForm">
     *      <a:label>Name</a:label>
     *      <a:textbox value="[name]" />
     * 
     *      <a:label>Happiness</a:label>
     *      <a:slider value="[happiness]" min="0" max="10" />
     *  </a:bar>
     * 
     *  <a:model id="mdlForm">
     *      <data />
     *  </a:model>
     * </code>
     * When no model is specified the default model is chosen. The default
     * model is the first model that is found without a name, or if all models
     * have a name, the first model found.
     * Example:
     * This example shows a dropdown from which the user can select a country.
     * The list of countries is loaded from a model. Usually this would be loaded
     * from a separate url, but for clarity it's inlined. When the user selects
     * a country in the dropdown the value of the item is stored in the second
     * model (mdlForm) at the position specified by the ref attribute. In this
     * case this is the country element.
     * <code>
     *  <a:label>Name</a:label>
     *  <a:textbox value="[name]" model="mdlForm" />
     * 
     *  <a:label>Country</a:label>
     *  <a:dropdown
     *    value   = "[mdlForm::country]"
     *    each    = "[mdlCountries::country]"
     *    caption = "[text()]">
     *  </a:dropdown>
     * 
     *  <a:model id="mdlCountries">
     *      <countries>
     *          <country value="USA">USA</country>
     *          <country value="GB">Great Britain</country>
     *          <country value="NL">The Netherlands</country>
     *      </countries>
     *  </a:model>
     * 
     *  <a:model id="mdlForm">
     *      <data>
     *          <name />
     *          <country />
     *      </data>
     *  </a:model>
     * </code>
     * @see baseclass.databinding.attribute.model
     */
    this.$propHandlers["model"] = function(value){
        //Unset model
        if (!value && !this.$modelParsed) {
            if (this.$model) {
                this.clear();
                this.$model.unregister(this);
                this.$model = null;
                this.lastModelId = "";
            }
            else if (this.dataParent)
                this.dataParent.parent = null; //Should be autodisconnected by property binding

            return;
        }
        this.$initingModel = true;

        var fParsed;
        //Special case for property binding
        if ((fParsed = this.$modelParsed) && fParsed.type != 2) {
            var found, pb = fParsed.props;
            
            if (this.dataParent)
                this.dataParent = null; //Should be autodisconnected by property binding

            //Try to figure out who is the dataParent
            for (var prop in pb){
                //#ifdef __SUPPORT_SAFARI2
                if (typeof pb[prop] == "function")
                    continue;
                //#endif

                this.dataParent = {
                    parent : self[prop.split(".")[0]],
                    xpath  : null,
                    model  : this.$modelParsed.instruction
                };
        
                found = true;
                break; // We currently only support one data parent
            }
            
            if (found) {
                //@todo this statement doesnt make sense
                /*//Maybe a compound model is found
                if (!this.dataParent && (pb = fParsed.xpaths && fParsed.xpaths[0])) {
                    this.dataParent = {
                        parent : self[pb.split(".")[0]],
                        xpath  : fParsed.xpaths[1],
                        model  : this.$modelParsed.instruction
                    };
                }*/
                
                if (this.dataParent && !this.dataParent.signalXmlUpdate)
                    this.dataParent.signalXmlUpdate = {};
            }
            
            this.$modelParsed = null;
        }

        //Analyze the data
        var model;
        if (typeof value == "object") {
            if (value.dataType == apf.ARRAY) { //Optimization used for templating
                //#ifdef __WITH_NAMESERVER
                model = apf.nameserver.get("model", value[0]);
                model.register(this, value[1]);
                return;
                //#endif
            }
            else if (value.$isModel) { // A model node is passed
                //Convert model object to value;
                model = value;
                value = this.model = model.name;
                if (!value)
                    model.setProperty("id", value = this.model = "model" + model.$uniqueId);
                
                //@todo why not set directly here?
            }
            else { //if (this.dataParent) { //Data came through data parent
                if (this.dataParent)
                    this.model = this.dataParent.model; //reset this property

                model = apf.xmldb.findModel(value);
                if (!model) //@todo very strange, this should never happen, but it does
                    return;
                var xpath = apf.xmlToXpath(value, null, true) || ".";
                
                //#ifdef __DEBUG
                if (model.queryNode(xpath) != value) {
                    throw new Error("xml data node is not attached to model (" 
                        + xpath + ") : " + value + ":" + (value && value.xml));
                }
                //#endif
                
                model.register(this, xpath);
                return;
            }
            /*else {
                //@todo Error ??
            }*/
        }
        else if (value.indexOf("[::") > -1) { //@experimental
            var model, pNode = this;
            do {
                pNode = pNode.parentNode
                model = pNode.getAttribute("model");
            }
            while (pNode.parentNode && pNode.parentNode.nodeType == 1 && (!model || model == value));

            if (model && typeof model == "object")
                model = model.id;

            this.$inheritProperties.model = 3;
            if (model) {
                value = value.replace(/\[\:\:/g, "[" + model + "::");
            }
            else {
                apf.console.warn("No found model on any of the parents for this element while trying to overload model: " + value);
                return;
            }
        }

        //Optimize xmlroot position and set model async (unset the old one)
        //@todo apf3.0 this could be optimized by using apf.queue and only when not all info is there...
        clearTimeout(this.$dbTimer);
        if (!this.$amlLoaded && this.nodeType == 1) {
            var _self = this;
            this.$dbTimer = $setTimeout(function(){
                if (!_self.$amlDestroyed)
                    apf.setModel(value, _self);
            });
        }
        else
            apf.setModel(value, this);
    };

    // #ifdef __WITH_VIRTUALVIEWPORT
    /**
     * @attribute {String} viewport the way this element renders its data.
     * Possible values:
     * virtual  this element only renders data that it needs to display.
     * normal   this element renders all data at startup.
     * @experimental
     */
    this.$propHandlers["viewport"] = function(value){
        if (value != "virtual")
            return;

        this.implement(apf.VirtualViewport);
    };
    //#endif
};
// #ifdef __WITH_PRESENTATION
    apf.DataBinding.prototype = new apf[apf.Presentation ? "Presentation" : "AmlElement"]();
/* #else
    apf.DataBinding.prototype = new apf.AmlElement();
#endif*/

apf.config.$inheritProperties["model"]           = 1;
apf.config.$inheritProperties["empty-message"]   = 1;
apf.config.$inheritProperties["loading-message"] = 1;
apf.config.$inheritProperties["offline-message"] = 1;
apf.config.$inheritProperties["noloading"]       = 1;

apf.Init.run("databinding");

// #endif
