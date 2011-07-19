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
 *  <a:model src="products.xml" />
 * </code>
 * Example:
 * A small form where the bound data is submitted to a server using a model.
 * <code>
 *  <a:model id="mdlForm" submission="save_form.asp">
 *      <data name="Lukasz" address="Poland"></data>
 *  </a:model>
 * 
 *  <a:frame model="mdlForm">
 *      <a:label>Name</a:label>
 *      <a:textbox value="[@name]" />
 *      <a:label>Address</a:label>
 *      <a:textarea 
 *        value  = "[@address]" 
 *        width  = "100" 
 *        height = "50" />
 *      <a:button 
 *        default = "true" 
 *        action  = "submit">Submit</a:button>
 *  </a:frame>
 * </code>
 *
 * @event beforeretrieve    Fires before a request is made to retrieve data.
 *   cancelable: Prevents the data from being retrieved.
 * @event afterretrieve     Fires when the request to retrieve data returns both on success and failure.
 * @event receive           Fires when data is successfully retrieved
 *   object:
 *   {String} data  the retrieved data
 * @event beforeload        Fires before data is loaded into the model.
 *   cancelable:
 * @event afterload         Fires after data is loaded into the model.
 * @event beforesubmit      Fires before data is submitted.
 *   cancelable: Prevents the submit.
 *   object:
 *   {String} instruction The data instruction used to store the data.
 * @event submiterror       Fires when submitting data has failed.
 * @event submitsuccess     Fires when submitting data was successfull.
 * @event aftersubmit       Fires after submitting data.
 * @event error             Fires when a communication error has occured while making a request for this element.
 *   cancelable: Prevents the error from being thrown.
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
 * @attribute  {String}  src          the data instruction on how to load data from the data source into this model.
 * @attribute  {String}  submission   the data instruction on how to record the data from the data source from this model.
 * @attribute  {String}  session      the data instruction on how to store the session data from this model.
 * @attribute  {Boolean} autoinit     whether to initialize the model immediately. If set to false you are expected to call init() when needed. This is useful when the system has to log in first.
 * @attribute  {Boolean} enablereset  whether to save the original state of the data. This enables the use of the reset() call.
 * @attribute  {String}  remote       the id of the {@link element.remote} element to use for data synchronization between multiple clients.
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.model = function(struct, tagName){
    this.$init(tagName || "model", apf.NODE_HIDDEN, struct);
    
    this.$amlNodes = {};
    this.$propBinds = {};
    
    this.$listeners = {};
    this.$proplisteners = {};

    if (!apf.globalModel) {
        apf.globalModel = this;
        //#ifdef __WITH_NAMESERVER
        apf.nameserver.register("model", "@default", this);
        //#endif
    }
};

(function(){
    this.$parsePrio = "020";
    this.$isModel   = true;
    
    this.canHaveChildren  = false;
    this.enablereset       = false;

    this.$state = 0;//1 = loading

    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        submission : 1,
        src        : 1,
        session    : 1
    }, this.$attrExcludePropBind);

    this.$booleanProperties["whitespace"] = true;
    this.$booleanProperties["autoinit"]   = true;
    this.$booleanProperties.enablereset   = true;
    this.$supportedProperties = ["submission", "src", "session", "autoinit", 
        "enablereset", "remote", "whitespace"];
    
    this.$propHandlers["src"] = 
    this.$propHandlers["get"] = function(value, prop){
        if (this.$amlLoaded)
            this.$loadFrom(value);
    };

    //#ifdef __WITH_RDB
    //Connect to a remote databinding
    this.$propHandlers["remote"] = function(value, prop){
        if (value) {
            if (this.src && this.src.indexOf("rdb://") === 0) {
                var _self = this;
                apf.queue.add("rdb_load_" + this.$uniqueId, function(){
                    _self.unshare();
                    _self.share();
                });
            }
        }
        else
            this.unshare();
    };

    this.share = function(xpath) {
        this.rdb = typeof this.remote == "string"
            ? 
            //#ifdef __WITH_NAMESERVER
            apf.nameserver.get("remote", this.remote)
            /* #else
            {}
            #endif */
            : this.remote;

        //#ifdef __DEBUG
        if (!this.rdb || !this.rdb.$sessions) {
            throw new Error(apf.formatErrorString(0, null,
                "Loading AML into model",
                "Could not find reference to remote databinding: '"
                + this.remote + "'", this))
        }
        //#endif

        this.rdb.createSession(this.src, this, xpath);
    };

    this.unshare = function(xpath) {
        if (!this.rdb) return;
        this.rdb.endSession(this.src);
        this.rdb = null;
    };
    //#endif

    /**
     * Registers a aml element to this model in order for the aml element to
     * receive data loaded in this model.
     *
     * @param  {AMLElement}  amlNode  The aml element to be registered.
     * @param  {String}      [xpath]  the xpath query which is executed on the
     *                                data of the model to select the node to be
     *                                loaded in the <code>amlNode</code>.
     * @return  {Model}  this model
     * @private
     */
    this.register = function(amlNode, xpath){
        if (!amlNode || !amlNode.load) //hasFeature(apf.__DATABINDING__))
            return this;

        var isReloading = amlNode.$model == this;

        //Remove previous model
        if (amlNode.$model && !isReloading)
            amlNode.$model.unregister(amlNode);

        //Register the aml node
        var item = this.$amlNodes[amlNode.$uniqueId] = {
            amlNode : amlNode, 
            xpath   : xpath
        };
        amlNode.$model = this;

        if (typeof amlNode.noloading == "undefined"
          && amlNode.$setInheritedAttribute 
          && !amlNode.$setInheritedAttribute("noloading"))
            amlNode.noloading = false;

        //amlNode.$model = this;
        if (this.$state == 1) {
            if (amlNode.clear && !amlNode.noloading)
                amlNode.clear("loading");//@todo apf3.0
        }
        else if (this.data) {
            this.$loadInAmlNode(item);
            //this.$loadInAmlProp(amlNode);
        }
        else { //@experimental
            if (amlNode.hasFeature(apf.__CACHE__)) // amlNode.clear
                amlNode.clear("empty");
        }

        var p, node, list = amlNode.$propsUsingMainModel, id = amlNode.$uniqueId;
        for (var prop in list) {
            this.$unbindXmlProperty(amlNode, prop);
            p = this.$bindXmlProperty(amlNode, prop, 
                    list[prop].xpath, list[prop].optimize);
            
            if (this.data) {
                //if (node = p.root || p.listen ? this.data.selectSingleNode(p.root || p.listen) : this.data) {
                if (node = p.listen ? this.data.selectSingleNode(p.listen) : this.data) {
                    amlNode.$execProperty(prop, node);
                }
                else
                    this.$waitForXml(amlNode, prop);
            }
        }
        
        return this;
    };

    this.$register = function(amlNode, xpath){
        //@todo apf3.0 update this.$propBinds;
        
        this.$amlNodes[amlNode.$uniqueId].xpath = xpath;
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
        delete this.$amlNodes[amlNode.$uniqueId];
        
        var list = amlNode.$propsUsingMainModel;
        for (var prop in list)
            this.$unbindXmlProperty(amlNode, prop);
            
        amlNode.dispatchEvent("unloadmodel");
    };

    /**
     * @private
     */
    this.getXpathByAmlNode = function(amlNode){
        var n = this.$amlNodes[amlNode.$uniqueId];
        if (!n)
            return false;

        return n.xpath;
    };
    
    /**
     * @private
     */
    this.$loadInAmlNode = function(item){
        var xmlNode;
        var xpath   = item.xpath;
        var amlNode = item.amlNode;
        
        if (this.data && xpath) {
            xmlNode = this.data.selectSingleNode(xpath);
        }
        else
            xmlNode = this.data || null;
        
        if (xmlNode) {
            delete this.$listeners[amlNode.$uniqueId];
            amlNode.load(xmlNode);
        }
        else 
            this.$waitForXml(amlNode);
    };
    
    this.$loadInAmlProp = function(id, xmlNode){
        var prop, node, p = this.$propBinds[id], amlNode = apf.all[id];
        if (!amlNode){
             delete this.$propBinds[id];
             return;
        }
        //#ifdef __WITH_AML_BINDINGS
        if (amlNode.$noInitModel) {
            delete amlNode.$noInitModel;
            return;
        }
        //#endif

        for (prop in p) {
            if (xmlNode && (node = p[prop].listen 
              ? xmlNode.selectSingleNode(p[prop].listen) 
              : xmlNode)) {
                apf.xmldb.addNodeListener(xmlNode, amlNode, 
                  "p|" + id + "|" + prop + "|" + this.$uniqueId);
                
                delete this.$proplisteners[id + prop];
                amlNode.$execProperty(prop, node);
            }
            else
                this.$waitForXml(amlNode, prop);
        }            
    };
    
    /*
        We don't want to connect to the root, that would create a rush
        of unnecessary update messages, so we'll find the element that's
        closest to the node that is going to feed us the value
        
        mdlBlah::bli/persons
        mdlBlah::bli/persons/person
        
        $attrBindings
        //split / join, pop, indexOf
        
        <a:textbox value="[persons/person/@blah]" width="[persons/blah/@width]" height="[@height]" model="[mdlBlah::bli]"/>
    */
    this.$bindXmlProperty = function(amlNode, prop, xpath, optimize, listenRoot) {
        var q ,p, id = amlNode.$uniqueId;
        if (!this.$propBinds[id]) 
            this.$propBinds[id] = {};

        /*
            Store
            0 - Original xpath
            1 - Store point of change listener
            2 - Xpath to determine data node passed into load
        */
        p = this.$propBinds[id][prop] = {
            bind: xpath
        };

        //@todo apf3.0
        //Optimize root point, doesnt work right now because it doesnt change the original rule
        if (optimize && false) {
            //Find xpath for bind on this model of the amlNode
            if ((q = this.$amlNodes[id]) && q.xpath)
                xpath = (p.root = q.xpath) + "/" + xpath;
            
            var l = xpath.split("/"), z = l.pop();
            if (z.indexOf("@") == 0 
              || z.indexOf("text()") > -1 
              || z.indexOf("node()") > -1) {
                p.listen = l.join("/");
            }
            else p.listen = xpath;
        }
        else {
            if ((q = this.$amlNodes[id]) && q.xpath)
                p.listen = q.xpath;
        }
        
        if (listenRoot)
            p.listen = ".";

        if (this.data) {
            var xmlNode = 
              //#ifdef __WITH_AML_BINDINGS
              amlNode.$noInitModel ? amlNode.xmlRoot : 
              //#endif
              (p.listen ? this.data.selectSingleNode(p.listen) : this.data);

            if (xmlNode) {
                apf.xmldb.addNodeListener(xmlNode, amlNode, 
                  "p|" + amlNode.$uniqueId + "|" + prop + "|" + this.$uniqueId);
                
                return p;
            }
        }
        
        this.$waitForXml(amlNode, prop);
        
        return p;
    };
    
    this.$unbindXmlProperty = function(amlNode, prop){
        var id = amlNode.$uniqueId;

        //@todo apf3.0
        var p = this.$propBinds[id] && this.$propBinds[id][prop];
        if (!p) return;
        
        if (this.data) {
            var xmlNode = p.listen ? this.data.selectSingleNode(p.listen) : this.data;
            if (xmlNode) {
                apf.xmldb.removeNodeListener(xmlNode, amlNode, 
                  "p|" + id + "|" + prop + "|" + this.$uniqueId);
            }
        }
        
        delete this.$proplisteners[id + prop];
        delete this.$propBinds[id][prop];
        return p;
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
        if (!this.data)
            return false;
        
        var node = apf.createNodeFromXpath(this.data, xpath);
        if (!node)
            return null;

        apf.setNodeValue(node, value, true);
        //apf.xmldb.setTextNode(node, value);
        return node;
    };
    
    /**
     * Sets a value of a set of xml nodes based on an xpath statement executed on the data of this model.
     *
     * @param  {String}  xpath  the xpath used to select a the nodeset.
     * @param  {String}  value  the value to set.
     * @return  {XMLNodeSet}  the changed XMLNodeSet
     */
    this.setQueryValues = function(xpath, value){
        if (!this.data)
            return [];
        
        var nodes = this.data.selectNodes(xpath);
        for (var i = 0, l = nodes.length; i < l; i++)
            apf.setNodeValue(node, value, true);

        return nodes;
    };

    /**
     * Gets the value of an XMLNode based on a xpath statement executed on the data of this model.
     *
     * @param  {String}  xpath  the xpath used to select a XMLNode.
     * @return  {String}  value of the XMLNode
     */
    this.queryValue = function(xpath){
        if (!this.data)
            return false;
        
        return apf.queryValue(this.data, xpath);
    };
	
    /**
     * Gets the value of an XMLNode based on a xpath statement executed on the data of this model.
     *
     * @param  {String}  xpath  the xpath used to select a XMLNode.
     * @return  {String}  value of the XMLNode
     */	
    this.queryValues = function(xpath){
        if (!this.data)
            return [];
        
        return apf.queryValue(this.data, xpath);
    };
	
    /**
     * Executes an xpath statement on the data of this model
     *
     * @param  {String}   xpath    the xpath used to select the XMLNode(s).
     * @return  {variant}  XMLNode or NodeList with the result of the selection
     */
    this.queryNode = function(xpath){
        if (!this.data)
            return null;
        
        return this.data.selectSingleNode(xpath)
    };

    /**
     * Executes an xpath statement on the data of this model
     *
     * @param  {String}   xpath    the xpath used to select the XMLNode(s).
     * @return  {variant}  XMLNode or NodeList with the result of the selection
     */
    this.queryNodes = function(xpath){
        if (!this.data)
            return [];
        
        return this.data.selectNodes(xpath);
    };

    /**
     * Appends a copy of the xmlNode or model to this model as a child
     * of it's root node
     */
    this.appendXml = function(xmlNode, xpath){
        var insertNode = xpath
          ? apf.createNodeFromXpath(this.data, xpath)
          : this.data;
        if (!insertNode)
            return null;
        
        if (typeof xmlNode == "string")
            xmlNode = apf.getXml(xmlNode);
        else {
            xmlNode = !xmlNode.nodeType //Check if a model was passed
                ? xmlNode.getXml()
                : apf.xmldb.getCleanCopy(xmlNode);
        }
        
        if (!xmlNode) return;

        apf.xmldb.appendChild(insertNode, xmlNode);
        
        this.dispatchEvent("update", {xmlNode: xmlNode});
        return xmlNode;
    };

    /**
     * Removes xmlNode from this model 
     */
    this.removeXml = function(xmlNode){
        if (typeof xmlNode == "string")
            var xmlNodes = this.data.selectNodes(xmlNode);
        else if (!xmlNode.length)
            xmlNodes = [xmlNode];
        
        if (xmlNodes.length)
            apf.xmldb.removeNodeList(xmlNodes);
    };

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
        var doc = this.data.ownerDocument;
        //doc.removeChild(this.data);
        //var node = doc.appendChild(apf.isWebkit ? doc.importNode(this.$copy, true) : this.$copy);
        this.data.parentNode.replaceChild(this.$copy, this.data);
        this.load(this.$copy);
    };

    /**
     * Sets a new saved point based on the current state of the data in this
     * model. The reset() method returns the model to this point.
     */
    this.savePoint = function(){
        this.$copy = apf.xmldb.getCleanCopy(this.data);
    };

    /**
     * @private
     */
    this.reloadAmlNode = function(uniqueId){
        if (!this.data)
            return;

        var item = this.$amlNodes[uniqueId];
        var xmlNode = item.xpath 
            ? this.data.selectSingleNode(item.xpath) 
            : this.data;
        item.amlNode.load(xmlNode);
    };

    /**
     * @private
     */
    //@todo refactor this to use .blah instead of getAttribute
    //@todo move this to propHandlers
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var x = this.$aml;
        if (this.parentNode && this.parentNode.hasFeature(apf.__DATABINDING__)) {
            if (!this.name)
                this.setProperty("id", "model" + this.parentNode.$uniqueId);
            //this.parentNode.$aml.setAttribute("model", this.name); //@todo don't think this is necesary anymore...
            this.register(this.parentNode);
        }

        //Load literal model
        if (!this.src) {
            var strXml, xmlNode = x;
            if (xmlNode && xmlNode.childNodes.length) {
                if (apf.getNode(xmlNode, [0])) {
                    if ((strXml = xmlNode.xml || xmlNode.serialize()).match(/^[\s\S]*?>([\s\S]*)<[\s\S]*?$/)) {
                        strXml = RegExp.$1; //@todo apf3.0 test this with json
                        if (!apf.supportNamespaces)
                            strXml = strXml.replace(/xmlns=\"[^"]*\"/g, "");
                    }
                    
                    if (this.whitespace === false)
                        strXml = strXml.replace(/>[\s\n\r]*</g, "><");
                    
                    return this.load(apf.getXmlDom(strXml).documentElement);
                }
                // we also support JSON data loading in a model CDATA section
                else if (apf.isJson(xmlNode.childNodes[0].nodeValue)) {
                    return this.load(apf.getXmlDom(xmlNode.childNodes[0].nodeValue).documentElement);
                }
            }
            
            //Default data for XForms models without an instance but with a submission node
            if (this.submission)
                this.load("<data />");
        }

        //Load data into model if allowed
        if (!apf.isFalse(this.autoinit))
            this.init();

        //@todo actions apf3.0

        return this;
    });

    /**
     * Loads the initial data into this model.
     * @see element.model.attribute.init
     */
    //callback here is private
    this.init = function(callback){
        if (this.session) {
            this.$loadFrom(this.session, {isSession: true});
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
                if (this.src && !apf.offline.onLine) {
                    apf.offline.models.addToInitQueue(this);
                    return;
                }
            }
            //#endif

            if (this.src)
                this.$loadFrom(this.src, {callback: callback});
        }
    };

    /* *********** LOADING ****************/

    /**
     * Loads data into this model using a data instruction.
     * @param {String}     instruction  the data instrution how to retrieve the data.
     * @param {Object}     options
     *   Properties:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that provides context to the data instruction.
     *   {Function}   callback  the code executed when the data request returns.
     *   {mixed}      []        Custom properties available in the data instruction.
     */
    this.$loadFrom = function(instruction, options){
        //#ifdef __WITH_RDB
        if (instruction.indexOf("rdb://") === 0) {
            this.src = instruction; //@todo
            return this.$propHandlers["remote"].call(this, this.remote);
        }
        //#endif
        var data = instruction.split(":");

        if (!options)
            options = {};

        if (!options.isSession) {
            this.src   = instruction;
            this.$srcOptions = [instruction, options];
        }

        //Loading data in non-literal model
        this.dispatchEvent("beforeretrieve");
        
        //Set all components on loading...
        var uniqueId, item;
        for (uniqueId in this.$amlNodes) {
            if (!(item = this.$amlNodes[uniqueId]) || !item.amlNode)
                continue;

            //@todo apf3.0
            if (!item.amlNode.noloading)
                item.amlNode.clear("loading");
        }

        this.$state = 1;
        if (!this.$callCount)
            this.$callCount = 1;
        else
            this.$callCount++;

        var _self     = this,
            callCount = this.$callCount,
            callback  = options.callback;
        options.callback = function(data, state, extra){
            if (callCount != _self.$callCount)
                return; //another call has invalidated this one
            
            _self.dispatchEvent("afterretrieve");

            //#ifdef __WITH_OFFLINE_MODELS
            if (state == apf.OFFLINE) {
                apf.offline.models.addToInitQueue(this);
                return false;
            }
            //#endif

            if (state != apf.SUCCESS) {
                var oError;

                oError = new Error(apf.formatErrorString(1032,
                    _self, "Loading xml data", "Could not load data\n"
                  + "Instruction: " + instruction + "\n"
                  + "Url: " + extra.url + "\n"
                  + "Info: " + extra.message + "\n\n" + data));

                if (callback && callback.apply(this, arguments) === true)
                    return true;

                if (extra.tpModule && extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                    return true;

                _self.$state = 0;

                throw oError;
            }

            if (options && options.isSession && !data) {
                if (this.src)
                    return _self.$loadFrom(this.src);
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
        };

        return apf.getData(instruction, options);
    };
    
    /**
     * Loads the data from the datasource specified for init.
     */
    this.reload = function(){
        if (!this.data)
            return;
        
        if (this.$srcOptions)
            this.$loadFrom.apply(this, this.$srcOptions);
        else if (this.src)
            this.$loadFrom(this.src);
    };

    /**
     * Loads data in this model
     *
     * @param  {mixed} [xmlNode]  the data to load in this model. A string specifies the data instruction how to retrieve the data, which can be an xml string. null will clear the data from this model.
     * @param {Object}     options
     *   Properties:
     *   {XMLElement} xmlNode   the {@link term.datanode data node} that provides context to the data instruction.
     *   {Function}   callback  the code executed when the data request returns.
     *   {mixed}      []        Custom properties available in the data instruction.
     *   {Boolean}    [nocopy]   Whether the data loaded will not overwrite the reset point.
     */
    this.load = function(xmlNode, options){
        if (typeof xmlNode == "string") {
            if (xmlNode.charAt(0) == "<") { //xml
                if (xmlNode.substr(0, 5).toUpperCase() == "<!DOC")
                    xmlNode = xmlNode.substr(xmlNode.indexOf(">")+1);
                if (!apf.supportNamespaces)
                    xmlNode = xmlNode.replace(/xmlns\=\"[^"]*\"/g, "");
                xmlNode = apf.getXmlDom(xmlNode, null, true).documentElement; //@todo apf3.0 whitespace issue
            }
            //#ifdef __WITH_JSON2XML
            else if (apf.isJson(xmlNode)) {
                xmlNode = apf.json2Xml(xmlNode).documentElement
            }
            //#endif
            else
                return this.$loadFrom(xmlNode, options);
        }

        if (this.ownerDocument && this.ownerDocument.$domParser.$shouldWait) {
            //if (!this.$queueLoading) {
                var _self = this;
                this.data = xmlNode; //@todo expirement //this.$copy = 
                apf.xmldb.getXmlDocId(xmlNode, this); //@todo experiment
                
                this.$queueLoading = true;
                apf.queue.add("modelload" + this.$uniqueId, function(){
                    if (_self.ownerDocument && _self.ownerDocument.$domParser.$shouldWait)
                        apf.queue.add("modelload" + _self.$uniqueId, arguments.callee);
                    else {
                        _self.load(xmlNode, options);
                        _self.$queueLoading = false;
                    }
                });
            //}
            return;
        }
        else if (this.$queueLoading)
            apf.queue.remove("modelload" + this.$uniqueId);
        
        this.$state = 0;

        if (this.dispatchEvent("beforeload", {xmlNode: xmlNode}) === false)
            return false;

        var doc = xmlNode ? xmlNode.ownerDocument : null; //Fix for safari refcount issue;

        //if (apf.isIE && this.$aml && this.getAttribute("ns"))
            //doc.setProperty("SelectionNamespaces", this.getAttribute("ns"));
        
        if (xmlNode) {
            if (!apf.supportNamespaces) {
                /* && (xmlNode.prefix || xmlNode.scopeName)) {
                doc.setProperty("SelectionNamespaces", "xmlns:"
                     + (xmlNode.prefix || xmlNode.scopeName) + "='"
                     + xmlNode.namespaceURI + "'");*/
                var xmlns = [], attr = xmlNode.attributes;
                for (var i = 0, l = attr.length; i < l; i++) {
                    if (attr[i].nodeName.substr(0, 5) == "xmlns") {
                        xmlns.push(attr[i].xml);
                    }
                }
                if (xmlns.length)
                    doc.setProperty("SelectionNamespaces", xmlns.join(" "));
            }
            
            apf.xmldb.addNodeListener(xmlNode, this); //@todo this one can be added for this.$listeners and when there are none removed
            apf.xmldb.nodeConnect(
                apf.xmldb.getXmlDocId(xmlNode, this), xmlNode, null, this);

            if ((!options || !options.nocopy) && this.enablereset)
                this.$copy = apf.xmldb.getCleanCopy(xmlNode);
        }

        this.data = xmlNode;
        
        this.dispatchEvent("afterload", {xmlNode: xmlNode});
        this.dispatchEvent("update", {xmlNode: xmlNode});
        
        for (var id in this.$amlNodes)
            this.$loadInAmlNode(this.$amlNodes[id]);

        for (id in this.$propBinds)
            this.$loadInAmlProp(id, xmlNode);

        return this;
    };
    
    //Listening nodes should be removed in unregister
    this.$waitForXml = function(amlNode, prop){
        if (prop)
            this.$proplisteners[amlNode.$uniqueId + prop] = {
                id      : amlNode.$uniqueId, 
                amlNode : amlNode, 
                prop    : prop
            };
        else 
            this.$listeners[amlNode.$uniqueId] = amlNode;
        
        //When data is not available at model load but element had already data
        //loaded, it is cleared here.
        if (amlNode.xmlRoot)
            amlNode.clear();
    };
    
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //@todo optimize by only doing this for add, sync etc actions
        
        if (action == "replacenode" && xmlNode == this.data.ownerDocument.documentElement) {
            var _self = this;
            setTimeout(function(){
                _self.load(xmlNode);
            });
            return;
        }
        
        //#ifdef __WITH_RDB
        if (this.rdb && !this.$at && UndoObj)
            this.$at = UndoObj.at;
        //#endif

        //#ifdef __WITH_UIRECORDER
        if (apf.uirecorder && apf.uirecorder.captureDetails) {
            if (apf.uirecorder.isLoaded && (apf.uirecorder.isRecording || apf.uirecorder.isTesting)) {// only capture events when recording
                if (this.ownerDocument && this.$aml) {
                    apf.uirecorder.capture.captureModelChange({
                        action      : action,
                        amlNode     : this,
                        xmlNode     : xmlNode,
                        listenNode  : listenNode,
                        UndoObj     : UndoObj
                    }); 
                }
            }
        }
        //#endif
        
        var p, b;
        for (var id in this.$listeners) {
            if (xmlNode = this.data.selectSingleNode(this.$amlNodes[id].xpath || ".")) {
                this.$listeners[id].load(xmlNode);
                delete this.$listeners[id];
            }
        }

        for (id in this.$proplisteners) {
            p = this.$proplisteners[id];
            b = this.$propBinds[p.id][p.prop];
            if (xmlNode = b.listen ? this.data.selectSingleNode(b.listen) : this.data) {
                delete this.$proplisteners[id];
                
                apf.xmldb.addNodeListener(xmlNode, p.amlNode, 
                  "p|" + p.id + "|" + p.prop + "|" + this.$uniqueId);
                
                p.amlNode.$execProperty(p.prop, b.root 
                  ? this.data.selectSingleNode(b.root) 
                  : this.data);
            }
        }
        
        this.dispatchEvent("update", {xmlNode: xmlNode, action: action, undoObj: UndoObj});
    };

    /**** INSERT ****/

    /**
     * Inserts data into the data of this model using a data instruction.
     * @param {String}     instruction  the data instrution how to retrieve the data.
     * @param {Object}     options
     *   Properties:
     *   {XMLElement} insertPoint  the parent element for the inserted data.
     *   {Boolean}    clearContents wether the contents of the insertPoint should be cleared before inserting the new children.
     *   {Boolean}    copyAttributes  wether the attributes of the merged element are copied.
     *   {Function}   callback     the code executed when the data request returns.
     *   {mixed}      <>           Custom properties available in the data instruction.
     */
    this.$insertFrom = function(instruction, options){
        if (!instruction) return false;

        this.dispatchEvent("beforeretrieve");

        // #ifdef __DEBUG
        var amlNode = options.amlNode;
        //#endif

        var callback = options.callback, _self = this;
        options.callback = function(data, state, extra){
            _self.dispatchEvent("afterretrieve");

            if (!extra)
                extra = {};

            if (state != apf.SUCCESS) {
                var oError;

                //#ifdef __DEBUG
                oError = new Error(apf.formatErrorString(0,
                    _self, "Inserting xml data", "Could not insert data\n"
                  + "Instruction:" + instruction + "\n"
                  + "Url: " + extra.url + "\n"
                  + "Info: " + extra.message + "\n\n" + data));
                //#endif

                if (extra.tpModule.retryTimeout(extra, state, 
                  options.amlNode || _self, oError) === true)
                    return true;

                if (callback 
                  && callback.call(this, extra.data, state, extra) === false)
                    return;

                throw oError;
            }

            //Checking for xpath
            if (typeof options.insertPoint == "string")
                options.insertPoint = _self.data.selectSingleNode(options.insertPoint);

            if (typeof options.clearContents == "undefined" && extra.userdata) 
                options.clearContents = apf.isTrue(extra.userdata[1]); //@todo is this still used?

            if (options.whitespace == undefined)
                options.whitespace = _self.whitespace;

            //Call insert function
            (options.amlNode || _self).insert(data, options);

            if (callback)
                callback.call(this, extra.data, state, extra);
        };

        apf.getData(instruction, options);
    };

    /**
     * Inserts data in this model as a child of the currently loaded data.
     *
     * @param  {XMLElement} XMLRoot         the {@link term.datanode data node} to insert into this model.
     * @param {Object}     options
     *   Properties:
     *   {XMLElement} insertPoint  the parent element for the inserted data.
     *   {Boolean}    clearContents wether the contents of the insertPoint should be cleared before inserting the new children.
     *   {Boolean}    copyAttributes  wether the attributes of the merged element are copied.
     *   {Function}   callback     the code executed when the data request returns.
     *   {mixed}      <>           Custom properties available in the data instruction.
     */
    this.insert = function(xmlNode, options){
        if (typeof xmlNode == "string") {
            if (xmlNode.charAt(0) == "<") {
                if (xmlNode.substr(0, 5).toUpperCase() == "<!DOC")
                    xmlNode = xmlNode.substr(xmlNode.indexOf(">")+1);
                if (!apf.supportNamespaces)
                    xmlNode = xmlNode.replace(/xmlns\=\"[^"]*\"/g, "");
                
                if (this.whitespace === false)
                    xmlNode = xmlNode.replace(/>[\s\n\r]*</g, "><");
                
                xmlNode = apf.getXmlDom(xmlNode).documentElement;
            }
            //#ifdef __WITH_JSON2XML
            else if (apf.isJson(xmlNode)) {
                xmlNode = apf.json2Xml(xmlNode).documentElement
            }
            //#endif
            else
                return this.$insertFrom(xmlNode, options);
        }

        if (!options.insertPoint)
            options.insertPoint = this.data;

        //#ifdef __DEBUG
        if (!options.insertPoint) {
            throw new Error(apf.formatErrorString(0, amlNode || _self,
                "Inserting data", "Could not determine insertion point for "
              + "instruction: " + instruction));
        }
        //#endif

        //if(this.dispatchEvent("beforeinsert", parentXMLNode) === false) return false;

        //Integrate XMLTree with parentNode
        if (typeof options.copyAttributes == "undefined")
            options.copyAttributes = true;
        
        var newNode = apf.mergeXml(xmlNode, options.insertPoint, options);

        //Call __XMLUpdate on all this.$listeners
        apf.xmldb.applyChanges("insert", options.insertPoint);//parentXMLNode);

        //this.dispatchEvent("afterinsert");

        return xmlNode;
    };

    /* *********** SUBMISSION ****************/

    /**
     * Serialize the full XML DOM to a format specified by 'type'
     * 
     * @param {String} type  how to serialize the data
     */
    this.convertXml = function(type) {
        if (!type)
            return this.data.xml;

        return apf.convertXml(this.data, type);
    };

    /**
     * Submit the data of the model to a data source.
     * @param {String} instruction  the instruction for sending the data, or the url to send the data to.
     * @param {String} type         how to serialize the data.
     *   Possible values:
     *   xml, application/xml
     *   form, application/x-www-form-urlencoded
     *   json, application/json
     * @param {XMLElement} xmlNode  the data node to send to the server.
     */
     //@todo rewrite this for apf3.0
    this.submit = function(instruction, type, xmlNode, options){
        if (!instruction)
            instruction = this.submission;
        
        if (!xmlNode)
            xmlNode = this.data;

        //#ifdef __DEBUG
        if (!xmlNode) {
            throw new Error(apf.formatErrorString(0, this, 
                "Submitting model",
                "Could not submit data, because no data was passed and the "
              + "model does not have data loaded."));
        }
        //#endif

        if (!type)
            type = "form";

        if (this.dispatchEvent("beforesubmit", {
            instruction: instruction
        }) === false)
            return false;

        var model = this;
        function cbFunc(data, state, extra){
            if ((state == apf.TIMEOUT 
              || (model.retryOnError && state == apf.ERROR))
              && extra.retries < apf.maxHttpRetries) {
                return extra.tpModule.retry(extra.id);
            }
            else {
                if (state != apf.SUCCESS) {
                    model.dispatchEvent("submiterror", extra);
                }
                else {
                    model.dispatchEvent("submitsuccess", apf.extend({
                        data: data
                    }, extra));
                }
            }
        }
        
        var data;
        if (type.indexOf("xml") > -1)
            data = apf.getXmlString(xmlNode);
        else if (type.indexOf("form") > -1)
            data = apf.convertXml(apf.xmldb.getCleanCopy(xmlNode), "cgiobjects");
        else if (type.indexOf("json") > -1)
            data = apf.convertXml(xmlNode, "json");

        apf.saveData(instruction, apf.extend({
            xmlNode  : xmlNode,
            data     : data,
            callback : cbFunc
        }, options));

        this.dispatchEvent("aftersubmit");
    };

    this.$destroy = function(){
        if (this.session && this.data)
            apf.saveData(this.session, {xmlNode: this.getXml()});
    };
}).call(apf.model.prototype = new apf.AmlElement());

apf.aml.setElement("model", apf.model);

//#endif
