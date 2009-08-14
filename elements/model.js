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

//#ifdef __WITH_MODEL

/**
 * Element functioning as the central access point for xml data. Data can be
 * retrieved from any data source using data instructions. Data can be
 * submitted using data instructions in a similar way to html form posts. The
 * modal can be reset to it's original state. It has support for offline use and
 * {@link element.remove synchronization between multiple clients}.
 * Example:
 * <code>
 *  <a:model load="url:products.xml" />
 * </code>
 * Example:
 * A small form where the bound data is submitted to a server using a model.
 * <code>
 *  <a:model id="mdlForm" submission="url:save_form.asp" />
 *
 *  <a:bar model="mdlForm">
 *      <a:label>Name</a:label>
 *      <a:textbox ref="name" />
 *      <a:label>Address</a:label>
 *      <a:textarea ref="address" />
 *      ...
 *
 *      <a:button default="true" action="submit">Submit</a:button>
 *  </a:bar>
 * </code>
 *
 * @event beforeretrieve    Fires before a request is made to retrieve data.
 *   cancellable: Prevents the data from being retrieved.
 * @event afterretrieve     Fires when the request to retrieve data returns both on success and failure.
 * @event receive           Fires when data is successfully retrieved
 *   object:
 *   {String} data  the retrieved data
 * @event beforeload        Fires before data is loaded into the model.
 *   cancellable:
 * @event afterload         Fires after data is loaded into the model.
 * @event beforesubmit      Fires before data is submitted.
 *   cancellable: Prevents the submit.
 *   object:
 *   {String} instruction The data instruction used to store the data.
 * @event submiterror       Fires when submitting data has failed.
 * @event submitsuccess     Fires when submitting data was successfull.
 * @event aftersubmit       Fires after submitting data.
 * @event error             Fires when a communication error has occured while making a request for this element.
 *   cancellable: Prevents the error from being thrown.
 *   bubbles:
 *   object:
 *   {Error}          error     the error object that is thrown when the event callback doesn't return false.
 *   {Number}         state     the state of the call
 *     Possible values:
 *     apf.SUCCESS  the request was successfull
 *     apf.TIMEOUT  the request has timed out.
 *     apf.ERROR    an error has occurred while making the request.
 *     apf.OFFLINE  the request was made while the application was offline.
 *   {mixed}          userdata  data that the caller wanted to be available in the callback of the http request.
 *   {XMLHttpRequest} http      the object that executed the actual http request.
 *   {String}         url       the url that was requested.
 *   {Http}           tpModule  the teleport module that is making the request.
 *   {Number}         id        the id of the request.
 *   {String}         message   the error message.
 *
 * @constructor
 * @define model
 * @allowchild [cdata], instance, load, submission
 * @addnode smartbinding, global
 * @attribute  {String}  load         the data instruction on how to load data from the data source into this model.
 * @attribute  {String}  submission   the data instruction on how to record the data from the data source from this model.
 * @attribute  {String}  session      the data instruction on how to store the session data from this model.
 * @attribute  {String}  schema       not implemented.
 * @attribute  {Boolean} init         whether to initialize the model immediately. If set to false you are expected to call init() when needed. This is useful when the system has to log in first.
 * @attribute  {Boolean} save-original whether to save the original state of the data. This enables the use of the reset() call.
 * @attribute  {String}  remote       the id of the {@link element.remote} element to use for data synchronization between multiple clients.
 * @define instance     Element defining a container for data. This element is optional for normal use, but is required for xforms compatibility.
 * @attribute  {String}  src          the url to retrieve the data from.
 * @see element.model
 * @define load         Element defining how data is loaded into a model.
 * @attribute  {String}  get          the data instruction on how to load data from the data source into this model.
 * @see element.model
 * @see element.model.attribute.load
 * @define submission   Element serving as a referencable entry to a way of submitting data to the server.
 * @attribute  {String}  action       the url to post the data to.
 * @attribute  {String}  method       the way of data serializing, and the transport method.
 *   Possible values:
 *   post            sent xml using the http post protocol. (application/xml)
 *   get             sent urlencoded form data using the http get protocol. (application/x-www-form-urlencoded)
 *   put             sent xml using the http put protocol. (application/xml)
 *   multipart-post  not implemented (multipart/related)
 *   form-data-post  not implemented (multipart/form-data)
 *   urlencoded-post sent urlencoded form data using the http get protocol. (application/x-www-form-urlencoded)
 * @attribute  {String}  set          the {@link term.datainstruction data instruction} on how to record the data from the data source from this model.
 * @see element.model
 * @see element.model.attribute.submission
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.model = function(data, caching){
    apf.register(this, "model", apf.NODE_HIDDEN);/** @inherits apf.Class */
    this.data    = data;
    this.caching = caching;
    this.cache   = {};
    var _self    = this;

    if (!apf.globalModel)
        apf.globalModel = this;

    this.saveOriginal = true;

    //#ifdef __DEBUG
    apf.console.info("Creating Model");
    //#endif

    this.$supportedProperties = ["submission", "load"];
    this.$handlePropSet = function(prop, value, force){
        if (prop == "submission")
            defSubmission = value;
        else if (prop == "validation")
            apf.nameserver.get("validation", value).register(this); //@todo error handling
        else if (prop == "actiontracker")
            apf.AmlElement.propHandlers.actiontracker.call(this, value);
    }
    
    //#ifdef __WITH_MODEL_VALIDATION
    this.validate = function(xmlNode, checkRequired, validityState, amlNode){
        if (!this.$validation) //@todo warn
            return;

        if (!xmlNode) {
            //Validate entire model.. not implemented yet...
        }
        else {
            validityState = this.$validation.validate(xmlNode, checkRequired, validityState);
            if (validityState.valid) {
                amlNode.clearError();
                return true;
            }
            else {
                amlNode.setError();
                return false;
            }
            
            //@todo detect amlNode based xmlNode listeners
        }
    }
    //@todo add xmlupdate hook here
    
    //#endif

    /**
     * @private
     */
    this.loadInAmlNode = function(amlNode, xpath){
        if (this.data && xpath) {
            if (!apf.supportNamespaces && (this.data.prefix || this.data.scopeName))
                (this.data.nodeType == 9 ? this.data : this.data.ownerDocument)
                    .setProperty("SelectionNamespaces", "xmlns:"
                     + (this.data.prefix || this.data.scopeName) + "='"
                     + this.data.namespaceURI + "'");

            var xmlNode = this.data.selectSingleNode(xpath);
            if (!xmlNode)
                amlNode.$listenRoot = apf.xmldb.addNodeListener(this.data, amlNode);
        }
        else
            xmlNode = this.data || null;

        amlNode.load(xmlNode);
    };

    var amlNodes = {};
    /**
     * Registers a aml element to this model in order for the aml element to
     * receive data loaded in this model.
     *
     * @param  {AMLElement}  amlNode  The aml element to be registered.
     * @param  {String}      [xpath]  the xpath query which is executed on the data of the model to select the node to be loaded in the <code>amlNode</code>.
     * @return  {Model}  this model
     * @private
     */
    this.register = function(amlNode, xpath){
        if (!amlNode)
            return this;

        amlNodes[amlNode.uniqueId] = [amlNode, xpath];
        amlNode.$model = this;
        //if(!amlNode.smartBinding) return this; //Setting model too soon causes object not to have XMLRoot which is incorrect

        if (this.connect) {
            //This model is a connect proxy
            if (this.connect.type)
                this.connect.node.connect(amlNode, null, this.connect.select, this.connect.type);
            else
                this.connect.node.connect(amlNode, true, this.connect.select);
        }
        else {
            //amlNode.$model = this;
            if (this.state == 1 && amlNode.clear) {
                if (!apf.isTrue(apf.getInheritedAttribute(amlNode, "noloading")))
                    amlNode.clear("loading");//@todo apf3.0
            }
            else if (this.data)
                this.loadInAmlNode(amlNode, xpath);
        }

        return this;
    };

    this.$register = function(amlNode, xpath){
        amlNodes[amlNode.uniqueId][1] = xpath;
    };

    /**
     * Removes a aml element from the group of registered aml elements.
     * The aml element will not receive any updates from this model, however
     * the data loaded in the aml element is not unloaded.
     *
     * @param  {AMLElement}  amlNode  The aml element to be unregistered.
     * @private
     */
    this.unregister = function(amlNode){
        //if (this.connect)
            //this.connect.node.disconnect(amlNode);
        if (amlNode.dataParent)
            amlNode.dataParent.parent.disconnect(amlNode);

        delete amlNodes[amlNode.uniqueId];
    };

    /**
     * @private
     */
    this.getXpathByAmlNode = function(amlNode){
        var n = amlNodes[amlNode.uniqueId];
        if (!n)
            return false;

        return n[1];
    };

    /**
     * Returns a string representation of the data in this model.
     */
    this.toString = function(){
        if (!this.data) return "Model has no data.";
        
        var xml = apf.xmldb.cleanNode(this.data.cloneNode(true));
        return apf.formatXml(xml.xml || xml.serialize());
    };

    /**
     * Gets a copy of current state of the xml of this model.
     *
     * @return  {XMLNode}  context of this model
     */
    this.getXml = function(){
        return this.data
            ? apf.xmldb.cleanNode(this.data.cloneNode(true))
            : false;
    };

    /**
     * Sets a value of an XMLNode based on an xpath statement executed on the data of this model.
     *
     * @param  {String}  xpath  the xpath used to select a XMLNode.
     * @param  {String}  value  the value to set.
     * @return  {XMLNode}  the changed XMLNode
     */
    this.setQueryValue = function(xpath, value){
        var node = apf.createNodeFromXpath(this.data, xpath);
        if (!node)
            return null;

        apf.setNodeValue(node, value, true);
        //apf.xmldb.setTextNode(node, value);
        return node;
    };

    /**
     * Gets the value of an XMLNode based on a xpath statement executed on the data of this model.
     *
     * @param  {String}  xpath  the xpath used to select a XMLNode.
     * @return  {String}  value of the XMLNode
     */
    this.queryValue = function(xpath){
        return apf.queryValue(this.data, xpath);
    };
	
    /**
     * Gets the value of an XMLNode based on a xpath statement executed on the data of this model.
     *
     * @param  {String}  xpath  the xpath used to select a XMLNode.
     * @return  {String}  value of the XMLNode
     */	
    this.queryValues = function(xpath){
        return apf.queryValue(this.data, xpath);
    };
	
    /**
     * Executes an xpath statement on the data of this model
     *
     * @param  {String}   xpath    the xpath used to select the XMLNode(s).
     * @return  {variant}  XMLNode or NodeList with the result of the selection
     */
    this.queryNode = function(xpath){
        return this.data.selectSingleNode(xpath)
    };
    /**
     * Executes an xpath statement on the data of this model
     *
     * @param  {String}   xpath    the xpath used to select the XMLNode(s).
     * @return  {variant}  XMLNode or NodeList with the result of the selection
     */
    this.queryNodes = function(xpath){
        return this.data.selectNodes(xpath);
    };

    /**
     * Appends a copy of the xmlNode or model to this model as a child
     * of it's root node
     */
    this.appendXml = function(xmlNode){
        if (typeof xmlNode == "string")
            xmlNode = apf.getXml(xmlNode);
        else {
            xmlNode = !model.nodeType //Check if a model was passed
                ? model.getXml()
                : apf.xmldb.getCleanCopy(xmlNode);
        }
        
        if (!xmlNode) return;

        apf.xmldb.appendChild(this.data, xmlNode);
    };
    
    this.removeXml = function(xmlNode){
        if (typeof xmlNode == "string")
            xmlNode = this.data.selectNodes(xmlNode);
        else if (!xmlNode.length)
            xmlNode = [xmlNode];
        
        if (xmlNode)
            apf.xmldb.removeNodeList(xmlNode);
    };

    //#ifdef __WITH_MODEL_VALIDATION || __WITH_XFORMS
    /**
     * @private
     */
    this.getBindNode = function(bindId){
        var bindObj = apf.nameserver.get("bind", bindId);

        //#ifdef __DEBUG
        if (!bindObj) {
            throw new Error(apf.formatErrorString(0, this,
                "Binding Component", "Could not find bind element with name '"
                + x.getAttribute("bind") + "'"));
        }
        //#endif

        return bindObj;
    };

    /**
     * @private
    this.isValid = function(){
        //Loop throug bind nodes and process their rules.
        for (var bindNode, i = 0; i < bindValidation.length; i++) {
            bindNode = bindValidation[i];
            if (!bindNode.isValid()) {
                //Not valid
                return false;
            }
        }

        //Valid
        return true;
    };
    */
    //#endif

    //#ifdef __WITH_XFORMS
    /**
     * @private
     */
    this.getInstanceDocument = function(instanceName){
        return this.data;
    };

    var XEvents = {
        "xforms-submit": function(){
            this.submit();
            return false;
        },
        "xforms-reset": function(model){
            this.reset();
            return false;
        },
        "xforms-revalidate": function(model){
            this.revalidate();
        }
    };

    /**
     * @private
     */
    this.dispatchXFormsEvent = function(name, model, noEvent){
        if (XEvents[name] && XEvents[name].call(this, model) !== false && !noEvent)
            this.dispatchEvent.apply(this, name);
    };

    /**
     * @private
     */
    this.rebuild     = function(){};

    /**
     * @private
     */
    this.recalculate = function(){};

    /**
     * @private
     */
    this.revalidate  = function(){
        if (this.validate()) {
            this.dispatchEvent("xforms-valid"); //Is this OK, or should this be called on an element
        }
        else {
            this.dispatchEvent("xforms-invalid"); //Is this OK, or should this be called on an element
        }
    };

    /**
     * @private
     */
    this.refresh = function(){};
    //#endif

    /**
     * Clears the loaded data from this model.
     */
    this.clear = function(){
        this.load(null);
        doc = null; //Fix for safari refcount issue;
    };

    /**
     * Resets data in this model to the last saved point.
     *
     */
    this.reset = function(){
        this.load(this.copy);

        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-reset");

        //These should do something, that is now implied
        this.dispatchEvent("xforms-recalculate");
        this.dispatchEvent("xforms-revalidate");
        this.dispatchEvent("xforms-refresh");
        //#endif
    };

    /**
     * Sets a new saved point based on the current state of the data in this
     * model. The reset() method returns the model to this point.
     */
    this.savePoint = function(){
        this.copy = apf.xmldb.getCleanCopy(this.data);
    };


    /**
     * @private
     */
    this.reloadAmlNode = function(uniqueId){
        if (!this.data)
            return;

        var xmlNode = amlNodes[uniqueId][1] ? this.data.selectSingleNode(amlNodes[uniqueId][1]) : this.data;
        amlNodes[uniqueId][0].load(xmlNode);
    };

    /* *********** PARSE ***********/

    //#ifdef __WITH_XFORMS
    //@todo move this to use apf.subnode
    var model = this;
    function cSubmission(x){
        this.tagName = "submission";
        this.name = x.getAttribute("id");
        this.parentNode = model;

        this.getModel = function(){
            return model;
        }

        apf.makeClass(this);

        this.implement(apf.XForms); /** @inherits apf.XForms */
        //#ifdef __WITH_AMLDOM
        this.implement(apf.AmlDom); /** @inherits apf.AmlDom */
        //#endif
    }
    function cBind(x){
        this.tagName    = "bind";
        this.name       = x.getAttribute("id");
        this.parentNode = this;
        this.nodeset    = x.getAttribute("nodeset");
        this.type       = x.getAttribute("type");
        this.$aml        = x;

        this.selectSingleNode = function(){
            return this.parentNode.data.selectSingleNode(this.nodeset);
        };

        this.selectNodes = function(){
            return this.parentNode.data.selectNodes(this.nodeset);
        };

        this.isValid = function(){
            var value, nodes = this.selectNodes();

            //#ifdef __DEBUG
            if (!typeHandlers[this.type]) {
                throw new Error(apf.formatErrorString(0, this, "Validating based on a bind node", "Could not find type: " + this.type, x));
            }
            //#endif

            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].childNodes > 1)
                    continue; //The association is ignored since the element contains child elements.
                // #ifdef __PARSER_XSD
                if (!apf.XSDParser.checkType(this.type, nodes[i]))
                    return false;
                // #endif
            }

            return true;
        };

        apf.makeClass(this);

        //#ifdef __WITH_AMLDOM
        this.implement(apf.AmlDom); /** @inherits apf.AmlDom */
        //#endif
    }
    //#endif

    var bindValidation = [], defSubmission, submissions = {}, 
        loadProcInstr, loadProcOptions;

    /**
     * @private
     */
    //@todo refactor this to properly parse things
    this.loadAml = function(x, parentNode){
        this.name = x.getAttribute("id");
        this.$aml  = x;

        //#ifdef __WITH_AMLDOM_FULL
        this.parentNode = parentNode;
        this.implement(apf.AmlDom); /** @inherits apf.AmlDom */
        //#endif

        //Events
        var attr  = x.attributes;
        for (var i = 0, l = attr.length; i < l; i++) {
            if (attr[i].nodeName.indexOf("on") == 0)
                this.addEventListener(attr[i].nodeName, 
                  new Function('event', attr[i].nodeValue));
        }

        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-model-construct");
        //#endif

        if (x.getAttribute("save-original") == "true")
            this.saveOriginal = true;

        //Parse submissions
        var oSub;
        //#ifdef __WITH_XFORMS
        var subs = $xmlns(x, "submission", apf.ns.aml);
        for (var i = 0; i < subs.length; i++) {
            if (!subs[i].getAttribute("id")) {
                if (!defSubmission)
                    defSubmission = subs[i];
                continue;
            }

            submissions[subs[i].getAttribute("id")] = subs[i];
            oSub = apf.setReference(subs[i].getAttribute("id"), new cSubmission(subs[i]));
        }
        //#endif

        if (!defSubmission)
            defSubmission = x.getAttribute("submission");

        this.submitType    = x.getAttribute("submittype");
        this.useComponents = x.getAttribute("useComponents");

        //Session support
        this.session = x.getAttribute("session");

        //Find load string
        var instanceNode;
        loadProcInstr = apf.parseExpression(x.getAttribute("load") || x.getAttribute("get"));
        if (!loadProcInstr) {
            var prefix = apf.findPrefix(x, apf.ns.aml);
            if (!apf.supportNamespaces)
                if (prefix)
                    (x.nodeType == 9
                        ? x
                        : x.ownerDocument).setProperty("SelectionNamespaces",
                            "xmlns:" + prefix + "='" + apf.ns.aml + "'");
            if (prefix)
                prefix += ":";

            var loadNode = x.selectSingleNode(prefix + "load");//$xmlns(x, "load", apf.ns.aml)[0];
            if (loadNode)
                loadProcInstr = loadNode.getAttribute("get");
            //#ifdef __WITH_XFORMS
            else {
                instanceNode = $xmlns(x, "instance", apf.ns.aml)[0];
                if (instanceNode && instanceNode.getAttribute("src"))
                    loadProcInstr = "url:" + instanceNode.getAttribute("src");
            }
            //#endif
        }

        //Process bind nodes
        //#ifdef __WITH_XFORMS
        var binds = $xmlns(x, "bind", apf.ns.aml);
        for (var i = 0; i < binds.length; i++) {
            bindValidation.push([binds[i].getAttribute("nodeset"), binds[i]]);
            if (binds[i].getAttribute("id"))
                apf.nameserver.register("bind", binds[i].getAttribute("id"),
                    new cBind(binds[i]));
        }
        //#endif

        //Load literal model
        if (!oSub && !loadProcInstr) {
            var xmlNode = instanceNode || x;
            if (xmlNode.childNodes.length) {
                if (apf.getNode(xmlNode, [0])) {
                    this.load((xmlNode.xml || xmlNode.serialize())
                        .replace(new RegExp("^<" + xmlNode.tagName + "[^>]*>"), "")
                        .replace(new RegExp("<\/\s*" + xmlNode.tagName + "[^>]*>$"), "")
                        .replace(/xmlns=\"[^"]*\"/g, ""));
                }
                // we also support JSON data loading in a model CDATA section
                else if (apf.isJson(xmlNode.childNodes[0].nodeValue)) {
                    this.load(xmlNode.childNodes[0].nodeValue);
                }
            }
        }

        //Default data for XForms models without an instance but with a submission node
        if (oSub && !this.data && !instanceNode)
            this.load("<data />");

        //Load data into model if allowed
        if (!apf.isFalse(x.getAttribute("init")))
            this.init();

        //Connect to a remote smartbinding
        if (x.getAttribute("remote")) {
            this.rsb = apf.nameserver.get("remote", x.getAttribute("remote"));

            //#ifdef __DEBUG
            if (!this.rsb || !this.rsb.models) {
                throw new Error(apf.formatErrorString(0, null,
                    "Loading AML into model",
                    "Could not find reference to remote smartbinding: '"
                    + x.getAttribute("remote") + "'", x))
            }
            //#endif

            this.rsb.models.push(this);
        }

        if (x.getAttribute("validation"))
            apf.nameserver.get("validation", x.getAttribute("validation")).register(this);

        if (x.getAttribute("actiontracker"))
            apf.AmlElement.propHandlers.actiontracker.call(this, x.getAttribute("actiontracker"));

        //@todo actions apf3.0

        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-model-construct-done");
        //#endif

        return this;
    };

    /**
     * Changes the aml element that provides data to this model.
     * Only relevant for models that are a connect proxy.
     * A connect proxy is set up like this:
     * Example:
     * <code>
     *  <a:model connect="element_name" type="select" select="xpath" />
     * </code>
     *
     * @param  {AMLElement} amlNode  the aml element to be registered.
     * @param  {String}     [type]   select
     *   Possible values:
     *   default  sents data when a node is selected
     *   choice   sents data when a node is chosen (by double clicking, or pressing enter)
     * @param  {String}     [select] an xpath query which is executed on the data of the model to select the node to be loaded in the aml element.
     * @private
     */
    //Only when model is a connect proxy
    this.setConnection = function(amlNode, type, select){
        if (!this.connect)
            this.connect = {};
        var oldNode = this.connect.node;

        this.connect.type   = type;
        this.connect.node   = amlNode;
        this.connect.select = select;

        for (var uniqueId in amlNodes) {
            if (oldNode)
                oldNode.disconnect(amlNodes[uniqueId][0]);
            this.register(amlNodes[uniqueId][0]);
        }
    };

    /**
     * Loads the initial data into this model.
     * @see element.model.attribute.init
     */
    //callback here is private
    this.init = function(callback){
        if (this.session) {
            this.loadFrom(this.session, null, {isSession: true});
        }
        else {
            //#ifdef __WITH_OFFLINE_MODELS
            if (typeof apf.offline != "undefined" && apf.offline.models.enabled) {
                //Check if there's stored data
                if (apf.offline.models.loadModel(this)) {
                    return;
                }

                //Hmm we're offline, lets wait until we're online again
                //@todo this will ruin getting data from offline resources
                if (loadProcInstr && !apf.offline.onLine) {
                    apf.offline.models.addToInitQueue(this);
                    return;
                }
            }
            //#endif

            if (loadProcInstr)
                this.loadFrom(loadProcInstr, null, {callback: callback});
            //loadProcInstr = null;
        }

        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-ready");
        //#endif
    };

    /* *********** LOADING ****************/
    this.state = 0;//1 = loading

    /**
     * Loads data into this model using a data instruction.
     * @param {String}     instruction  the data instrution how to retrieve the data.
     * @param {XMLElement} xmlContext   the {@link term.datanode data node} that provides context to the data instruction.
     * @param {Object}     options
     *   Properties:
     *   {Function} callback   the code executed when the data request returns.
     *   {mixed}    <>         Custom properties available in the data instruction.
     */
    this.loadFrom = function(instruction, xmlContext, options, callback){
        var data      = instruction.split(":");
        var instrType = data.shift();

        if (!options || !options.isSession) {
            loadProcInstr   = instruction;
            loadProcOptions = [instruction, xmlContext, options, callback];
        }

        if (!callback && options)
            callback = options.callback;

        /*
            Make connectiong with a aml element to get data streamed in
            from existing client side source
        */
        if (instrType.substr(0, 1) == "#") {
            instrType = instrType.substr(1);

            try {
                eval(instrType).test
            }
            catch (e) {
                throw new Error(apf.formatErrorString(1031, null,
                    "Model Creation", "Could not find object reference to \
                    connect databinding: '" + instrType + "'", dataNode))
            }

            this.setConnection(eval(instrType), data[0] || "select", data[1]);

            return this;
        }

        //Loading data in non-literal model
        this.dispatchEvent("beforeretrieve");
        
        //Set all components on loading...        
        var uniqueId;
        for (uniqueId in amlNodes) {
            if (!amlNodes[uniqueId] || !amlNodes[uniqueId][0])
                continue;

            //@todo apf3.0
            if (!apf.isTrue(apf.getInheritedAttribute(amlNodes[uniqueId][0], "noloading")))
                amlNodes[uniqueId][0].clear("loading");
        }

        this.state = 1;
        apf.getData(instruction, xmlContext, options, function(data, state, extra){
            _self.dispatchEvent("afterretrieve");

            //#ifdef __WITH_OFFLINE_MODELS
            if (state == apf.OFFLINE) {
                apf.offline.models.addToInitQueue(this);
                return false;
            }
            //#endif

            _self.state = 0;

            if (state != apf.SUCCESS) {
                var oError;

                oError = new Error(apf.formatErrorString(1032,
                    _self, "Inserting xml data", "Could not load data \
                    Instruction:" + instruction + "\n\
                    Url: " + extra.url + "\n\
                    Info: " + extra.message + "\n\n" + data));

                if (callback && callback.apply(this, arguments) === true)
                    return true;

                if (extra.tpModule && extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                    return true;

                throw oError;
            }

            if (options && options.isSession && !data) {
                if (loadProcInstr)
                    return _self.loadFrom(loadProcInstr);
            }
            else {
                if (options && options.cancel)
                    return;

                _self.load(data);
                _self.dispatchEvent("receive", {
                    data: data
                });

                if (callback)
                    callback.apply(this, arguments);
            }
        });

        return this;
    };
    
    /**
     * Loads the data from the datasource specified for init.
     */
    this.reload = function(){
        if (!this.data)
            return;
        
        if (loadProcOptions)
            this.loadFrom.apply(this, loadProcOptions);
        else if (loadProcInstr)
            this.loadFrom(loadProcInstr);
    }

    /**
     * Loads data in this model
     *
     * @param  {XMLElement} [xmlNode]  the data to load in this model. null will clear the data from this model.
     * @param  {Boolean}    [nocopy]   Whether the data loaded will not overwrite the reset point.
     */
    var doc;
    this.load = function(xmlNode, nocopy){
        if (this.dispatchEvent("beforeload", {xmlNode: xmlNode}) === false)
            return false;

        if (typeof xmlNode == "string")
            xmlNode = apf.getXmlDom(xmlNode).documentElement;

        doc = xmlNode ? xmlNode.ownerDocument : null; //Fix for safari refcount issue;

        if (apf.isIE && this.$aml && this.$aml.getAttribute("ns"))
            xmlNode.ownerDocument.setProperty("SelectionNamespaces", this.$aml.getAttribute("ns"));
        
        if (xmlNode) {
            apf.xmldb.nodeConnect(
                apf.xmldb.getXmlDocId(xmlNode, this), xmlNode, null, this);

            if (!nocopy && this.saveOriginal)
                this.copy = apf.xmldb.getCleanCopy(xmlNode);
        }

        this.data = xmlNode;

        var uniqueId;
        for (uniqueId in amlNodes) {
            if (!amlNodes[uniqueId] || !amlNodes[uniqueId][0])
                continue;

            this.loadInAmlNode(amlNodes[uniqueId][0], amlNodes[uniqueId][1]);
            //var xmlNode = this.data ? (amlNodes[uniqueId][1] ? this.data.selectSingleNode(amlNodes[uniqueId][1]) : this.data) : null;
            //amlNodes[uniqueId][0].load(xmlNode);
        }

        this.dispatchEvent("afterload", {xmlNode: xmlNode});

        return this;
    };

    /**** INSERT ****/

    /**
     * Inserts data into the data of this model using a data instruction.
     * @param {String}     instruction  the data instrution how to retrieve the data.
     * @param {XMLElement} xmlContext   the {@link term.datanode data node} that provides context to the data instruction.
     * @param {Object}     options
     *   Properties:
     *   {XMLElement} insertPoint  the parent element for the inserted data.
     *   {mixed}      <>           Custom properties available in the data instruction.
     * @param {Function} callback       the code executed when the data request returns.
     */
    this.insertFrom = function(instruction, xmlContext, options, callback){
        if (!instruction) return false;

        this.dispatchEvent("beforeretrieve");

        // #ifdef __DEBUG
        var amlNode = options.amlNode;
        //#endif

        apf.getData(instruction, xmlContext, options, function(data, state, extra){
            _self.dispatchEvent("afterretrieve");

            if (state != apf.SUCCESS) {
                var oError;

                //#ifdef __DEBUG
                oError = new Error(apf.formatErrorString(1032,
                    _self, "Inserting xml data", "Could not insert data for \
                    Instruction:" + instruction + "\n\
                    Url: " + extra.url + "\n\
                    Info: " + extra.message + "\n\n" + data));
                //#endif

                if (extra.tpModule.retryTimeout(extra, state, 
                  options.amlNode || _self, oError) === true)
                    return true;

                throw oError;
            }

            //#ifdef __DEBUG
            if (!options.insertPoint) {
                throw new Error(apf.formatErrorString(0, amlNode || _self,
                    "Inserting data", "Could not determine insertion point for \
                    instruction: " + instruction));
            }
            //#endif

            //Checking for xpath
            if (typeof options.insertPoint == "string")
                options.insertPoint = _self.data.selectSingleNode(options.insertPoint);

            //Call insert function
            (options.amlNode || _self).insert(data, options.insertPoint, apf.extend({
                clearContents: apf.isTrue(extra.userdata[1])
            }, options));

            if (callback)
                callback.call(this, extra.data);
        });
    };

    /**
     * Inserts data in this model as a child of the currently loaded data.
     *
     * @param  {XMLElement} XMLRoot         the {@link term.datanode data node} to insert into this model.
     * @param  {XMLElement} [parentXMLNode] the parent element for the inserted data.
     */
    this.insert = function(XMLRoot, parentXMLNode, options, amlNode){
        if (typeof XMLRoot != "object")
            XMLRoot = apf.getXmlDom(XMLRoot).documentElement;
        if (!parentXMLNode)
            parentXMLNode = this.data;

        //if(this.dispatchEvent("beforeinsert", parentXMLNode) === false) return false;

        //Integrate XMLTree with parentNode
        var newNode = apf.mergeXml(XMLRoot, parentXMLNode,
          apf.extend({copyAttributes: true}, options));

        //Call __XMLUpdate on all listeners
        apf.xmldb.applyChanges("insert", parentXMLNode);

        //this.dispatchEvent("afterinsert");

        return XMLRoot;
    };

    /* *********** SUBMISSION ****************/

    /**
     * Serialize the full XML DOM to a format specified by 'type'
     * 
     * @param {String} type  how to serialize the data
     */
    this.serialize = function(type) {
        if (!type)
            return this.data.xml;

        return apf.convertXml(this.data, type);
    };

    /**
     * Submit the data of the model to a data source.
     * @param {String} instruction  the id of the submission element or the data instruction on how to sent data to the data source.
     * @param {String} type         how to serialize the data, and how to sent it.
     *   Possible values:
     *   post            sent xml using the http post protocol. (application/xml)
     *   get             sent urlencoded form data using the http get protocol. (application/x-www-form-urlencoded)
     *   put             sent xml using the http put protocol. (application/xml)
     *   multipart-post  not implemented (multipart/related)
     *   form-data-post  not implemented (multipart/form-data)
     *   urlencoded-post sent urlencoded form data using the http get protocol. (application/x-www-form-urlencoded)
     * @todo: PUT ??
     * @todo: build in instruction support
     */
     //@todo rewrite this for apf3.0
    this.submit = function(instruction, xmlNode, type, useComponents, xSelectSubTree){
        //#ifdef __WITH_MODEL_VALIDATION || __WITH_XFORMS
        /*if (!this.isValid()) {
            //#ifdef __WITH_XFORMS
            this.dispatchEvent("xforms-submit-error");
            //#endif
            this.dispatchEvent("submiterror");
            return;
        }*/
        //#endif

        if (!instruction && !defSubmission)
            return false;
        if (!xmlNode)
            xmlNode = this.data;
        if (!instruction && typeof defSubmission == "string")
            instruction = defSubmission;

        //#ifdef __DEBUG
        if (!xmlNode) {
            throw new Error(apf.formatErrorString(0, this, 
                "Submitting model",
                "Could not submit data, because no data was passed and the \
                 model does not have data loaded."));
        }
        //#endif

        //First check if instruction is a known submission
        var sub;
        if (submissions[instruction] || !instruction && defSubmission) {
            sub = submissions[instruction] || defSubmission;

            //<a:submission id="" ref="/" bind="" action="url" method="post|get|urlencoded-post" set="" />
            useComponents  = false;
            type           = sub.getAttribute("method")
                .match(/^(?:urlencoded-post|get)$/) ? "native" : "xml";
            xSelectSubTree = sub.getAttribute("ref") || "/";//Bind support will come later
            instruction    = (sub.getAttribute("method")
                .match(/post/) ? "url.post:" : "url:") + sub.getAttribute("action");
            var file       = sub.getAttribute("action");

            //set contenttype oRpc.contentType
        }
        else
            if (instruction) {
                if (!type)
                    type = this.submitType || "native";
                if (!useComponents)
                    useComponents = this.useComponents;
            }
            else {
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, "Submitting a Model", "Could not find a submission with id '" + id + "'"));
                //#endif
            }

        //#ifdef __DEBUG
        //if(type == "xml" || type == "post")
        //    throw new Error(apf.formatErrorString(0, this, "Submitting form", "This form has no model specified", this.$aml));
        //#endif

        if (this.dispatchEvent("beforesubmit", {
            instruction: instruction
        }) === false)
            return false;

        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-submit");
        //#endif

        //this.showLoader();

        var model = this;
        function cbFunc(data, state, extra){
            if ((state == apf.TIMEOUT 
              || (_self.retryOnError && state == apf.ERROR))
              && extra.retries < apf.maxHttpRetries)
                return extra.tpModule.retry(extra.id);
            else
                if (state != apf.SUCCESS) {
                    model.dispatchEvent("submiterror", extra);

                    //#ifdef __WITH_XFORMS
                    /* For an error response nothing in the document is replaced, and submit processing concludes after dispatching xforms-submit-error.*/
                    model.dispatchEvent("xforms-submit-error");
                    //#endif
                }
                else {
                    model.dispatchEvent("submitsuccess", apf.extend({
                        data: data
                    }, extra));

                    //#ifdef __WITH_XFORMS
                    if (sub) {
                        /* For a success response including a body, when the value of the replace attribute on element submission is "all", the event xforms-submit-done is dispatched, and submit processing concludes with entire containing document being replaced with the returned body.*/
                        if (sub.getAttribute("replace") == "all") {
                            document.body.innerHTML = data; //Should just unload all elements and parse the new document.
                            model.dispatchEvent("xforms-submit-done");
                        }
                        /*
                            For a success response including a body, when the value of the replace attribute on element submission is "none", submit processing concludes after dispatching xforms-submit-done.
                            For a success response not including a body, submit processing concludes after dispatching xforms-submit-done.
                        */
                        else if (sub.getAttribute("replace") == "none") {
                            model.dispatchEvent("xforms-submit-done");
                        }
                        else {
                            /* For a success response including a body of an XML media type (as defined by the content type specifiers in [RFC 3023]), when the value of the replace attribute on element submission is "instance", the response is parsed as XML. An xforms-link-exception (4.5.2 The xforms-link-exception Event) occurs if the parse fails. If the parse succeeds, then all of the internal instance data of the instance indicated by the instance attribute setting is replaced with the result. Once the XML instance data has been replaced, the rebuild, recalculate, revalidate and refresh operations are performed on the model, without dispatching events to invoke those four operations. This sequence of operations affects the deferred update behavior by clearing the deferred update flags associated with the operations performed. Submit processing then concludes after dispatching xforms-submit-done.*/
                            if ((extra.http.getResponseHeader("Content-Type") || "").indexOf("xml") > -1) {
                                if (sub.getAttribute("replace") == "instance") {
                                    try {
                                        var xml = apf.xmldb.getXml(xml);
                                        this.load(xml);
                                        model.dispatchEvent("xforms-submit-done");
                                    }
                                    catch (e) {
                                        model.dispatchEvent("xforms-link-exception"); //Invalid XML sent
                                    }
                                }
                            }
                            else {
                                /* For a success response including a body of a non-XML media type (i.e. with a content type not matching any of the specifiers in [RFC 3023]), when the value of the replace attribute on element submission is "instance", nothing in the document is replaced and submit processing concludes after dispatching xforms-submit-error.*/
                                if (sub.getAttribute("replace") == "instance") {
                                    model.dispatchEvent("xforms-submit-error");
                                }
                                else {
                                    model.dispatchEvent("xforms-submit-done");
                                }
                            }
                        }
                    }
                //#endif
                }

            //this.hideLoader();
        }

        if (type == "array" || type == "json" || type == "xml") {
            var data = type == "xml"
                ? apf.getXmlString(xmlNode)
                : apf.convertXml(xmlNode, "json");

            apf.saveData(instruction, xmlNode, {args : [data]}, cbFunc);
        }
        else {
            var data = useComponents
                ? this.getCgiString()
                : apf.convertXml(apf.xmldb.getCleanCopy(xmlNode), 
                    type != "native" ? type : "cgivars");

            /*if (instruction.match(/^rpc\:/)) {
                var rpc  = rpc.split("."),
                    oRpc = self[rpc[0]];
                oRpc.callWithString(rpc[1], data, cbFunc);
                //Loop throught vars
                //Find components with the same name
                //Set arguments and call method
            }
            else {*/
                if (instruction.match(/^url/))
                    instruction += (instruction.match(/\?/) ? "&" : "?") + data;

                apf.saveData(instruction, xmlNode, null, cbFunc);
            //}
        }

        this.dispatchEvent("aftersubmit");
    };

    this.$destroy = function(){
        if (this.session && this.data)
            apf.saveData(this.session, this.getXml());
    };
};


//#endif
