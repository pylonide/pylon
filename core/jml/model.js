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
 * Class Model represents a data model which can retrieve data from a data source.
 * This data can be edited, partially loaded, extended and resetted to it's original state.
 *
 * @classDescription		This class creates a new model
 * @return {Model} Returns a new model
 * @type {Model}
 * @constructor
 * @jpfclass
 *
 * @allowchild [cdata], instance, load, submission, offline
 * @addnode smartbinding:model, global:model
 * @attribute  id
 * @attribute  load
 * @attribute  submission
 * @attribute  session
 * @attribute  offline
 * @attribute  schema
 * @attribute  init
 * @attribute  saveoriginal
 * @attribute  remote
 * @define instance
 * @attribute  src
 * @define load
 * @attribute  get
 * @define submission
 * @attribute  ref
 * @attribute  bind
 * @attribute  action
 * @attribute  method
 * @attribute  set
 * @todo define offline place holder element, not functional yet
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.Model = function(data, caching){
    jpf.register(this, "model", jpf.NOGUI_NODE);/** @inherits jpf.Class */
    this.data    = data;
    this.caching = caching;
    this.cache   = {};
    var _self    = this;
    
    if (!jpf.globalModel)
        jpf.globalModel = this;
    
    //#ifdef __WITH_XFORMS
    this.saveOriginal = true;
    //#endif
    
    //#ifdef __DEBUG
    jpf.console.info("Creating Model");
    //#endif
    
    this.loadInJmlNode = function(jmlNode, xpath){
        if (this.data && xpath) {
            if (!jpf.supportNamespaces && (this.data.prefix || this.data.scopeName)) 
                (this.data.nodeType == 9 ? this.data : this.data.ownerDocument)
                    .setProperty("SelectionNamespaces", "xmlns:"
                     + (this.data.prefix || this.data.scopeName) + "='"
                     + this.data.namespaceURI + "'");
            
            var xmlNode = this.data.selectSingleNode(xpath);
            if (!xmlNode) 
                jmlNode.listenRoot = jpf.xmldb.addNodeListener(this.data, jmlNode);
        }
        else 
            xmlNode = this.data || null;
        
        jmlNode.load(xmlNode);
    }
    
    var jmlNodes = {};
    /**
     * Registers a JmlNode to this model in order for the JmlNode to receive data
     * loaded in this model.
     *
     * @param  {JMLNode}  jmlNode  required  The JmlNode to be registered.
     * @param  {String}  xpath   optional  String specifying an xpath query which is executed on the data of the model to select the node to be loaded in the <code>jmlNode</code>.
     * @return  {Model}  this model
     */
    this.register = function(jmlNode, xpath){
        if (!jmlNode) 
            return this;

        jmlNodes[jmlNode.uniqueId] = [jmlNode, xpath];
        jmlNode.__model = this;
        //if(!jmlNode.smartBinding) return this; //Setting model too soon causes object not to have XMLRoot which is incorrect
        
        if (this.connect) {
            //This model is a connect proxy
            if (this.connect.type) 
                this.connect.node.connect(jmlNode, null, this.connect.select, this.connect.type);
            else 
                this.connect.node.connect(jmlNode, true, this.connect.select);
        }
        else {
            jmlNode.__model = this;
            
            if (this.data) 
                this.loadInJmlNode(jmlNode, xpath);
        }
        
        return this;
    }
    this.__register = function(jmlNode, xpath){
        jmlNodes[jmlNode.uniqueId][1] = xpath;
    }
    
    /**
     * Removes a JmlNode from the group of registered JmlNodes.
     * The JmlNode will not receive any updates from this model, however the data loaded
     * in the JmlNode component is not unloaded.
     *
     * @param  {JMLNode}  jmlNode  required  The JmlNode to be unregistered.
     */
    this.unregister = function(jmlNode){
        //if (this.connect) 
            //this.connect.node.disconnect(jmlNode);
        if(jmlNode.dataParent)
            jmlNode.dataParent.parent.disconnect(jmlNode);
        
        delete jmlNodes[jmlNode.uniqueId]
    }
    
    this.getXpathByJmlNode = function(jmlNode){
        var n = jmlNodes[jmlNode.uniqueId];
        if (!n) 
            return false;

        return n[1];
    }
    
    /**
     * @copy   JmlNode#setValue
     */
    this.toString = function(){
        return this.data
            ? jpf.formatXML(jpf.xmldb.clearConnections(this.data.cloneNode(true)).xml)
            : "Model has no data.";
    }
    
    /**
     * Gets a copy of current state of the XML of this model.
     *
     * @return  {XMLNode}  context of this model
     */
    this.getXml = function(){
        return this.data
            ? jpf.xmldb.clearConnections(this.data.cloneNode(true))
            : false;
    }
    
    /**
     * Sets a value of an XMLNode based on a xpath statement executed on the data of this model.
     *
     * @param  {String}  xpath  required  String specifying the xpath used to select a XMLNode.
     * @param  {String}  value  required  String specifying the value to set.
     * @return  {XMLNode}  the changed XMLNode
     */
    this.setByXPath = function(xpath, value){
        var node = this.data.selectSingleNode(xpath);
        if (!node) 
            return null;

        jpf.xmldb.setTextNode(node, value);
        return node;
    }
    
    /**
     * Gets the value of an XMLNode based on a xpath statement executed on the data of this model.
     *
     * @param  {String}  xpath  required  String specifying the xpath used to select a XMLNode.
     * @return  {String}  value of the XMLNode
     */
    this.getByXPath = function(xpath){
        return jpf.getXmlValue(this.data, xpath);
    }
    
    /**
     * Executes an xpath statement on the data of this model
     *
     * @param  {String}  xpath   required  String specifying the xpath used to select the XMLNode(s).
     * @param  {Boolean}  single  optional  When set to true a maximum of 1 nodes is returned.
     * @return  {variant}  XMLNode or NodeList with the result of the selection
     */
    this.getNodeByXPath = function(xpath, single){
        return single
            ? this.data.selectSingleNode(xpath)
            : this.data.selectNodes(xpath);
    }
    
    /**
     * Appends a copy of the xmlNode or model to this model as a child
     * of it's root node
     */
    this.appendChild = function(xmlNode){
        xmlNode = !model.nodeType //Check if a model was passed
            ? model.getXml()
            : jpf.xmldb.copyNode(xmlNode);
        
        if(!xmlNode) return;
        
        jpf.xmldb.appendChild(this.data, xmlNode);
    }
    
    //#ifdef __WITH_MODEL_VALIDATION || __WITH_XFORMS
    this.getBindNode = function(bindId){
        var bindObj = jpf.nameserver.get("bind", bindId);
        
        //#ifdef __DEBUG
        if (!bindObj) {
            throw new Error(jpf.formatErrorString(0, this, 
                "Binding Component", "Could not find bind element with name '" 
                + x.getAttribute("bind") + "'"));
        }
        //#endif
        
        return bindObj;
    }
    
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
    }
    //#endif
    
    //#ifdef __WITH_XFORMS
    this.getInstanceDocument = function(instanceName){
        return this.data;
    }
    
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
    }
    
    this.dispatchXFormsEvent = function(name, model, noEvent){
        if (XEvents[name] && XEvents[name].call(this, model) !== false && !noEvent) 
            this.dispatchEvent.apply(this, name);
    }
    
    this.rebuild     = function(){};
    
    this.recalculate = function(){};
    
    this.revalidate  = function(){
        if (this.isValid()) {
            this.dispatchEvent("xforms-valid"); //Is this OK, or should this be called on a element
        } else {
            this.dispatchEvent("xforms-invalid"); //Is this OK, or should this be called on a element
        }
    }
    
    this.refresh = function(){};
    //#endif
    
    this.clear = function(){
        this.load(null);
        doc = null; //Fix for safari refcount issue;
    }
    
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
    }
    
    /**
     * Sets a new save point based on the current state of the data in this model.
     *
     */
    this.savePoint = function(){
        this.copy = this.data.cloneNode(true);
    }
    
    this.reloadJmlNode = function(uniqueId){
        if (!this.data) 
            return;

        var xmlNode = jmlNodes[uniqueId][1] ? this.data.selectSingleNode(jmlNodes[uniqueId][1]) : this.data;
        jmlNodes[uniqueId][0].load(xmlNode);
    }
    
    /* *********** PARSE ***********/
    
    /*
     <j:model
     + [id=""]
     + [load="rpc:"]
     + [submission="eval:"]
     + [session="cookie:"]
     [offline="gears:name"]
     [schema="MySchema.xsd"]
     + [init="false"]
     + [save-original="boolean"]
     >
     + <j:instance>
     + 	<data />
     + </j:instance>
     + <j:instance src="" />
     + <j:load get="" />
     + <j:submission id="" ref="/" bind="" action="url" method="post|get|urlencoded-post" set="" />
     <j:offline [name=""] protocol="file" type="gears" />
     </j:model>
     */
    //#ifdef __WITH_XFORMS
    //@todo move this to use jpf.subnode
    var model = this;
    function cSubmission(x){
        this.tagName = "submission";
        this.name = x.getAttribute("id");
        this.parentNode = model;
        
        this.getModel = function(){
            return model;
        }
        
        jpf.makeClass(this);
        
        this.inherit(jpf.XForms); /** @inherits jpf.XForms */
        //#ifdef __WITH_JMLDOM
        this.inherit(jpf.JmlDomApi); /** @inherits jpf.JmlDomApi */
        //#endif
    }
    function cBind(x){
        this.tagName    = "bind";
        this.name       = x.getAttribute("id");
        this.parentNode = this;
        this.nodeset    = x.getAttribute("nodeset");
        this.type       = x.getAttribute("type");
        this.jml        = x;
        
        this.selectSingleNode = function(){
            return this.parentNode.data.selectSingleNode(this.nodeset);
        }
        
        this.selectNodes = function(){
            return this.parentNode.data.selectNodes(this.nodeset);
        }
        
        this.isValid = function(){
            var value, nodes = this.selectNodes();
            
            //#ifdef __DEBUG
            if (!typeHandlers[this.type]) {
                throw new Error(jpf.formatErrorString(0, this, "Validating based on a bind node", "Could not find type: " + this.type, x));
            }
            //#endif
            
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].childNodes > 1) 
                    continue; //The association is ignored since the element contains child elements.
                if (!jpf.XSDParser.checkType(this.type, nodes[i])) 
                    return false;
            }
            
            return true;
        }
        
        jpf.makeClass(this);
        
        //#ifdef __WITH_JMLDOM
        this.inherit(jpf.JmlDomApi); /** @inherits jpf.JmlDomApi */
        //#endif
    }
    //#endif
    
    var bindValidation = [], defSubmission, submissions = {}, loadProcInstr;
    this.loadJml = function(x, parentNode){
        this.name = x.getAttribute("id");
        this.jml  = x;
        
        //#ifdef __WITH_DOM_COMPLETE
        this.parentNode = parentNode;
        this.inherit(jpf.JmlDomApi); /** @inherits jpf.JmlDomApi */
        //#endif
        
        //Events
        var attr  = x.attributes;
        for (var i = 0, l = attr.length; i < l; i++) {
            if (attr[i].nodeName.indexOf("on") == 0) 
                this.addEventListener(attr[i].nodeName, new Function(attr[i].nodeValue));
        }
        
        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-model-construct");
        //#endif
        
        if (x.getAttribute("save-original") == "true") 
            this.saveOriginal = true;
        
        //Parse submissions
        var oSub;
        //#ifdef __WITH_XFORMS
        var subs = $xmlns(x, "submission", jpf.ns.jpf);
        for (var i = 0; i < subs.length; i++) {
            if (!subs[i].getAttribute("id")) {
                if (!defSubmission) 
                    defSubmission = subs[i];
                continue;
            }
            
            submissions[subs[i].getAttribute("id")] = subs[i];
            oSub = jpf.setReference(subs[i].getAttribute("id"), new cSubmission(subs[i]));
        }
        //#endif
        
        if (!defSubmission) 
            defSubmission = x.getAttribute("submission"); //Javeline Extension on XForms

        this.submitType    = x.getAttribute("submittype");
        this.useComponents = x.getAttribute("useComponents");

        //Session support
        this.session = x.getAttribute("session");

        //Find load string
        var instanceNode;
        loadProcInstr = x.getAttribute("load") || x.getAttribute("get");
        if (!loadProcInstr) {
            var prefix = jpf.findPrefix(x, jpf.ns.jpf);
            if (!jpf.supportNamespaces) 
                if (prefix) 
                    (x.nodeType == 9
                        ? x
                        : x.ownerDocument).setProperty("SelectionNamespaces",
                            "xmlns:" + prefix + "='" + jpf.ns.jpf + "'");
            if (prefix) 
                prefix += ":";
            
            var loadNode = x.selectSingleNode(prefix + "load");//$xmlns(x, "load", jpf.ns.jpf)[0];
            if (loadNode) 
                loadProcInstr = loadNode.getAttribute("get");
            //#ifdef __WITH_XFORMS
            else {
                instanceNode = $xmlns(x, "instance", jpf.ns.jpf)[0];
                if (instanceNode && instanceNode.getAttribute("src")) 
                    loadProcInstr = "url:" + instanceNode.getAttribute("src");
            }
            //#endif
        }
        
        //Process bind nodes
        //#ifdef __WITH_XFORMS
        var binds = $xmlns(x, "bind", jpf.ns.jpf);
        for (var i = 0; i < binds.length; i++) {
            bindValidation.push([binds[i].getAttribute("nodeset"), binds[i]]);
            if (binds[i].getAttribute("id")) 
                jpf.nameserver.register("bind", binds[i].getAttribute("id"),
                    new cBind(binds[i]));
        }
        //#endif
        
        //Load literal model
        if (!oSub && !loadProcInstr) {
            var xmlNode = instanceNode || x;
            if (xmlNode.childNodes.length && jpf.getNode(xmlNode, [0])) {
                this.load((xmlNode.xml || xmlNode.serialize())
                    .replace(new RegExp("^<" + xmlNode.tagName + "[^>]*>"), "")
                    .replace(new RegExp("<\/\s*" + xmlNode.tagName + "[^>]*>$"), "")
                    .replace(/xmlns=\"[^"]*\"/g, ""));
            }
        }
        
        //Default data for XForms models without an instance but with a submission node
        if (oSub && !this.data && !instanceNode) 
            this.load("<data />");
        
        //Load data into model if allowed
        if (!jpf.isFalse(x.getAttribute("init"))) 
            this.init();
        
        //Connect to a remote smartbinding
        if (x.getAttribute("remote")) {
            this.rsb = jpf.nameserver.get("remote", x.getAttribute("remote"));
            
            //#ifdef __DEBUG
            if (!this.rsb || !this.rsb.models) {
                throw new Error(jpf.formatErrorString(0, null, 
                    "Loading JML into model", 
                    "Could not find reference to remote smartbinding: '" 
                    + x.getAttribute("remote") + "'", x))
            }
            //#endif
            
            this.rsb.models.push(this);
        }
        
        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-model-construct-done");
        //#endif
        
        return this;
    }
    
    /**
     * Changes the JmlNode that provides data to this model.
     * Only relevant for models that are a connect proxy.
     * A connect proxy is set up like this:
     * <j:model connect="component_name" type="select" select="xpath" />
     *
     * @param  {JMLNode}  jmlNode  required  The JmlNode to be registered.
     * @param  {String}  type   optional  select  default  sents data when a node is selected
     *                                     choice  sents data when a node is chosen (by double clicking, or pressing enter)
     * @param  {String}  select   optional  String specifying an xpath query which is executed on the data of the model to select the node to be loaded in the <code>jmlNode</code>.
     */
    //Only when model is a connect proxy
    this.setConnection = function(jmlNode, type, select){
        if (!this.connect) 
            this.connect = {};
        var oldNode = this.connect.node;
        
        this.connect.type   = type;
        this.connect.node   = jmlNode;
        this.connect.select = select;
        
        for (var uniqueId in jmlNodes) {
            if (oldNode) 
                oldNode.disconnect(jmlNodes[uniqueId][0]);
            this.register(jmlNodes[uniqueId][0]);
        }
    }
    
    //callback here is private
    this.init = function(callback){
        if (this.session) {
            this.loadFrom(this.session, null, {isSession: true});
        } 
        else {
            //#ifdef __WITH_OFFLINE_MODELS
            if (jpf.offline.models.enabled) {
                //Check if there's stored data
                if (jpf.offline.models.loadModel(this)) {
                    return;
                }
                
                //Hmm we're offline, lets wait until we're online again
                //@todo this will ruin getting data from offline resources
                if (loadProcInstr && !jpf.offline.isOnline) {
                    jpf.offline.models.addToInitQueue(this);
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
    }
    
    /* *********** LOADING ****************/
    
    //isSession
    this.loadFrom = function(instruction, xmlContext, options){
        var data      = instruction.split(":");
        var instrType = data.shift();
        
        // #ifdef __WITH_OFFLINE_MODELS
        if (!options || !options.isSession) {
            loadProcInstr = instruction;
            //jpf.offline.models.removeModel(this);
        }
        //#endif
        
        /*
            Make connectiong with a jml element to get data streamed in 
            from existing client side source
        */
        if (instrType.substr(0, 1) == "#") {
            instrType = instrType.substr(1);
            
            try {
                eval(instrType).test
            }
            catch (e) {
                throw new Error(jpf.formatErrorString(1031, null, 
                    "Model Creation", "Could not find object reference to \
                    connect databinding: '" + instrType + "'", dataNode))
            }
            
            this.setConnection(eval(instrType), data[0], data[1]);
            
            return this;
        }
        
        //Loading data in non-literal model
        this.dispatchEvent("onbeforecomm");
        
        jpf.getData(instruction, xmlContext, options, function(data, state, extra){
            _self.dispatchEvent("onaftercomm");
            
            //#ifdef __WITH_OFFLINE_MODELS
            if (state == jpf.OFFLINE) {
                jpf.offline.models.addToInitQueue(this);
                return false;
            }
            //#endif
            
            if (state != jpf.SUCCESS) {
                var oError;
                
                //#ifdef __DEBUG
                oError = new Error(jpf.formatErrorString(1032, 
                    null, "Inserting xml data", "Could not load data for \
                    control " + this.name + "[" + this.tagName + "] \n\
                    Instruction:" + instruction + "\n\
                    Url: " + extra.url + "\n\
                    Info: " + extra.message + "\n\n" + data));
                //#endif
                
                if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                    return true;
                
                throw oError;
            }
            
            if (options && options.isSession && !data) {
                if (loadProcInstr) 
                    return _self.loadFrom(loadProcInstr);
            }
            else {
                _self.load(data);
                _self.dispatchEvent("onreceive", {
                    data: data
                });
                
                if (options.callback)
                    options.callback.apply(this, arguments);
            }
        });
        
        return this;
    }
    
    /**
     * Loads data in this model
     *
     * @param  {XMLNode}  xmlNode  optional  The XML data node to load in this model. Null will clear the data from this model.
     * @param  {Boolean}  nocopy  optional  When set to true the data loaded will not overwrite the reset point.
     */
    var doc;
    this.load = function(xmlNode, nocopy){
        if (this.dispatchEvent("onbeforeload") === false) 
            return false;
        
        if (typeof xmlNode == "string")
            var xmlNode = jpf.getXmlDom(xmlNode).documentElement;

        doc = xmlNode ? xmlNode.ownerDocument : null; //Fix for safari refcount issue;
        
        //FU IE
        //if(jpf.isIE) xmlNode.ownerDocument.setProperty("SelectionNamespaces", "xmlns:j='http://www.javeline.com/2001/PlatForm'");
        
        if (xmlNode) {
            jpf.xmldb.nodeConnect(
                jpf.xmldb.getXmlDocId(xmlNode, this), xmlNode, null, this);
            
            if (!nocopy && this.saveOriginal) 
                this.copy = xmlNode.cloneNode(true);
        }
        
        this.data = xmlNode;
        
        var uniqueId;
        for (uniqueId in jmlNodes) {
            if (!jmlNodes[uniqueId] || !jmlNodes[uniqueId][0]) 
                continue;
            
            this.loadInJmlNode(jmlNodes[uniqueId][0], jmlNodes[uniqueId][1]);
            //var xmlNode = this.data ? (jmlNodes[uniqueId][1] ? this.data.selectSingleNode(jmlNodes[uniqueId][1]) : this.data) : null;
            //jmlNodes[uniqueId][0].load(xmlNode);
        }
        
        this.dispatchEvent("onafterload");
        
        return this;
    }
    
    /* *********** INSERT ****************/
    
    //PROCINSTR
    //insertPoint, jmlNode, callback
    this.insertFrom = function(instruction, xmlContext, options, callback){
        if (!instruction) return false;
        
        this.dispatchEvent("onbeforecomm");
        
        // #ifdef __DEBUG
        var jmlNode = options.jmlNode;
        //#endif
        
        jpf.getData(instruction, xmlContext, options, function(data, state, extra){
            _self.dispatchEvent("onaftercomm");
            
            if (state != jpf.SUCCESS) {
                var oError;
                
                //#ifdef __DEBUG
                oError = new Error(jpf.formatErrorString(1032, 
                    null, "Inserting xml data", "Could not insert data for \
                    control " + this.name + "[" + this.tagName + "] \n\
                    Instruction:" + instruction + "\n\
                    Url: " + extra.url + "\n\
                    Info: " + extra.message + "\n\n" + data));
                //#endif
                
                if (extra.tpModule.retryTimeout(extra, state, jmlNode || _self, oError) === true)
                    return true;
                
                throw oError;
            }
            
            //#ifdef __DEBUG
            if (!options.insertPoint) {
                throw new Error(jpf.formatErrorString(0, jmlNode || _self, 
                    "Inserting data", "Could not determine insertion point for \
                    instruction: " + instruction));
            }
            //#endif
            
            //Checking for xpath
            if (typeof options.insertPoint == "string") 
                insertPoint = _self.data.selectSingleNode(options.insertPoint);
            
            //Call insert function 
            (options.jmlNode || _self).insert(data, options.insertPoint, jpf.extend({
                clearContents: jpf.isTrue(extra.userdata[1])
            }, options));

            if (callback)
                callback.call(this, data);
        });
    }
    
    /**
     * Inserts data in this model as a child of the currently loaded data.
     *
     * @param  {XMLNode}  XMLRoot  required  The XML data node to insert in this model.
     * @param  {Boolean}  parent  optional  XMLNode where the loaded data will be appended on.
     */
    this.insert = function(XMLRoot, parentXMLNode, options, jmlNode){
        if (typeof XMLRoot != "object") 
            XMLRoot = jpf.getXmlDom(XMLRoot).documentElement;
        if (!parentXMLNode) 
            parentXMLNode = this.data;
        
        //if(this.dispatchEvent("onbeforeinsert", parentXMLNode) === false) return false;
        
        //Integrate XMLTree with parentNode
        var newNode = jpf.xmldb.integrate(XMLRoot, parentXMLNode, 
          jpf.extend({copyAttributes: true}, options));
        
        //Call __XMLUpdate on all listeners
        jpf.xmldb.applyChanges("insert", parentXMLNode);
        
        //this.dispatchEvent("onafterinsert");
        
        return XMLRoot;
    }
    
    /* *********** SUBMISSION ****************/
    
    //Json
    //@todo rewrite this function
    this.getJsonObject = function(){
        var data = {};
        
        for (var p in this.elements) {
            var name = this.elements[p].jml.getAttribute("name") || this.elements[p].name;
            if (name) 
                data[name] = this.elements[p].getValue();
        }
        
        return data;
    }
    
    //URL encoded
    this.getCgiString = function(){
        //use components
        var uniqueId, k, sel, oJmlNode, name, value, str = [];
        
        for (uniqueId in jmlNodes) {
            oJmlNode = jmlNodes[uniqueId][0];
            //if(!elements[i].active) continue;
            if (oJmlNode.disabled || !oJmlNode.change && !oJmlNode.hasFeature(__MULTISELECT__)) 
                continue;
            if (oJmlNode.tagName == "MultiBinding") 
                oJmlNode = oJmlNode.getHost();
            
            if (oJmlNode.multiselect) {
                sel = oJmlNode.getSelection();
                for (k = 0; k < sel.length; k++) {
                    name = oJmlNode.jml.getAttribute("name");//oJmlNode.jml.getAttribute("id")
                    if (!name && oJmlNode.jml.getAttribute("ref")) 
                        name = oJmlNode.jml.getAttribute("ref").replace(/[\/\]\[@]/g, "_");
                    if (!name) 
                        name = sel[k].tagName;
                    if (!name.match(/\]$/)) 
                        name += "[]";
                    
                    value = oJmlNode.applyRuleSetOnNode("value", sel[k])
                        || oJmlNode.applyRuleSetOnNode("caption", sel[k]);
                    if (value) 
                        str.push(name + "=" + encodeURIComponent(value));
                }
            }
            else {
                name = oJmlNode.jml.getAttribute("name")
                    || oJmlNode.jml.getAttribute("id");
                if (!name && oJmlNode.jml.getAttribute("ref")) 
                    name = oJmlNode.jml.getAttribute("ref").replace(/[\/\]\[@]/g, "_");
                if (!name && oJmlNode.XMLRoot) 
                    name = oJmlNode.XMLRoot.tagName;
                
                if (!name) 
                    continue;
                
                value = oJmlNode.getValue();//oJmlNode.applyRuleSetOnNode(oJmlNode.mainBind, oJmlNode.XMLRoot);
                if (value) 
                    str.push(name + "=" + encodeURIComponent(value));
            }
        }
        
        return str.join("&");
    }
    
    /*
     <j:teleport>
         <j:rpc id="savesettings" protocol="gears" type="file" />
     </j:teleport>
     
     offline="gears:name:value"
     offline:gears:name:value
     offline:cookie:name:value
     offline:air:name:value
     offline:deskrun:name:value
     offline:prism:name:value
     offline:flash:name:value
     
     URI scheme method Serialization Submission
     http https mailto "post" application/xml HTTP POST or equivalent
     http https file 	"get" application/x-www-form-urlencoded HTTP GET or equivalent
     http https file 	"put" application/xml HTTP PUT or equivalent
     http https mailto "multipart-post" multipart/related HTTP POST or equivalent
     http https mailto "form-data-post" multipart/form-data HTTP POST or equivalent
     http https mailto "urlencoded-post" (Deprecated) application/x-www-form-urlencoded HTTP POST or equivalent
     (any) 				any other QNAME with no prefix N/A N/A
     (any) 				any QNAME with a prefix implementation-defined implementation-defined
     */
    //PROCINSTR
    //@todo: PUT ??
    //@todo: build in instruction support
    this.submit = function(instruction, type, useComponents, xSelectSubTree){
        //#ifdef __WITH_MODEL_VALIDATION || __WITH_XFORMS
        if (!this.isValid()) {
            //#ifdef __WITH_XFORMS
            this.dispatchEvent("xforms-submit-error");
            //#endif
            this.dispatchEvent("onsubmiterror");
            return;
        }
        //#endif
        
        if (!instruction && !defSubmission) 
            return false;
        if (!instruction && typeof defSubmission == "string") 
            instruction = defSubmission;
        
        //First check if instruction is a known submission
        var sub;
        if (submissions[instruction] || !instruction && defSubmission) {
            sub = submissions[instruction] || defSubmission;
            
            //<j:submission id="" ref="/" bind="" action="url" method="post|get|urlencoded-post" set="" />
            var useComponents  = false;
            var type           = sub.getAttribute("method")
                .match(/^(?:urlencoded-post|get)$/) ? "native" : "xml";
            var xSelectSubTree = sub.getAttribute("ref") || "/";//Bind support will come later
            var instruction    = (sub.getAttribute("method")
                .match(/post/) ? "url.post:" : "url:") + sub.getAttribute("action");
            var file           = sub.getAttribute("action");
            
            //set contenttype oRpc.contentType
        }
        else 
            if (instruction) {
                if (!type) 
                    type = this.submitType;
                if (!useComponents) 
                    useComponents = this.useComponents;
            }
            else {
                //#ifdef __DEBUG
                throw new Error(jpf.formatErrorString(0, "Submitting a Model", "Could not find a submission with id '" + id + "'"));
                //#endif
            }
        
        //#ifdef __DEBUG
        //if(type == "xml" || type == "post") 
        //	throw new Error(jpf.formatErrorString(0, this, "Submitting form", "This form has no model specified", this.jml));
        //#endif
        
        if (this.dispatchEvent("onbeforesubmit", {
            instruction: instruction
        }) === false) 
            return false;
        
        //#ifdef __WITH_XFORMS
        this.dispatchEvent("xforms-submit");
        //#endif
        
        //this.showLoader();
        
        var model = this;
        function cbFunc(data, state, extra){
            if (state == jpf.TIMEOUT && extra.retries < jpf.maxHttpRetries) 
                return extra.tpModule.retry(extra.id);
            else 
                if (state != jpf.SUCCESS) {
                    model.dispatchEvent("onsubmiterror", extra);
                    
                    //#ifdef __WITH_XFORMS
                    /* For an error response nothing in the document is replaced, and submit processing concludes after dispatching xforms-submit-error.*/
                    model.dispatchEvent("xforms-submit-error");
                    //#endif
                }
                else {
                    model.dispatchEvent("onsubmitsuccess", jpf.extend({
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
                                        var xml = jpf.xmldb.getXml(xml);
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
        
        if (type == "array" || type == "xml") {
            var data = type == "array"
                ? this.getJsonObject()
                : jpf.xmldb.serializeNode(this.data);

            jpf.saveData(instruction, this.data, {args : [data]}, cbFunc);
        }
        else 
            if (type == "native") {
                var data = useComponents
                    ? this.getCgiString()
                    : jpf.xmldb.convertXml(this.getXml(), "cgivars");
                
                if (instruction.match(/^rpc\:/)) {
                    rpc = rpc.split(".");
                    var oRpc = self[rpc[0]];
                    oRpc.callWithString(rpc[1], data, cbFunc);
                    //Loop throught vars
                    //Find components with the same name
                    //Set arguments and call method
                }
                else {
                    if (instruction.match(/^url/)) 
                        instruction += (instruction.match(/\?/) ? "&" : "?") + data;
                    
                    jpf.saveData(instruction, this.data, null, cbFunc);
                }
            }
        
        this.dispatchEvent("onaftersubmit")
    }
    
    /* ******* DESTROY ***********/
    
    this.destroy = function(){
        if (this.session && this.data) 
            jpf.saveData(this.session, this.getXml());
    }
}


//#endif
