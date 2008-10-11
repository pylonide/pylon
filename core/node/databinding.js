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

__DATABINDING__ = 1 << 1;

// #ifdef __WITH_DATABINDING

/**
 * Baseclass adding Databinding features to this Component.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */
jpf.DataBinding = function(){
    /* ********************************************************************
                                        PROPERTIES
    *********************************************************************/

    var loadqueue;
    var cXmlOnLoad = [];
    var cXmlSelect = [];
    var cXmlChoice = [];

    this.$regbase  = this.$regbase | __DATABINDING__;
    this.mainBind  = "value";
    var _self      = this;

    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    /**
     * Gets the Xpath statement from the main bind rule.
     * Each databound component which does not implement MultiSelect has a main bind rule.
     * This method gets the Xpath statement in the select attribute of this rule.
     *
     * @return  {String}  the Xpath statement
     * @see  SmartBinding
     */
    this.getMainBindXpath = function(){
        if (this.hasFeature(__MULTIBINDING__))
            return this.getSelectionSmartBinding().getMainBindXpath();
        var m = this.getModel(true);
        return (m && m.connect
            ? m.connect.select + "/"
            : (this.dataParent
                ? this.dataParent.xpath + "/"
                : "")) + this.smartBinding.bindings[this.mainBind][0].getAttribute("select");
    };

    /**
     * Checks wether this component is completely bound.
     *
     * @return  {Boolean}  true   this component is fully bound or not bound at all
     *                   false  this component's bound process is not completed
     * @see  SmartBinding
     */
    this.isBoundComplete = function(){
        if (!this.smartBinding) return true;
        if (!this.xmlRoot) return false;

        if (this.hasFeature(__MULTIBINDING__) && !this.getSelectionSmartBinding().xmlRoot)
            return false;
        return true;
    };
    
    /**
     * Queries the bound data for a string value
     *
     * @param  {String}  xpath  required  Xpath to be queried on the data this component is bound on.
     * @return  {String}  value of the selected XML Node
     */
    this.query = function(xpath){
        return jpf.getXmlValue(this.xmlRoot, xpath );
    };
    
    /**
     * Queries the bound data for an array of string values
     *
     * @param  {String}  xpath  required  Xpath to be queried on the data this component is bound on.
     * @return  {String}  value of the selected XML Node
     */
    this.queryArray = function(xpath){
        return jpf.getXmlValues(this.xmlRoot, xpath );
    };
    
    /**
     * @deprecated  As of JPF 0.8
     *              {@link #isTraverseNode}
     */
    this.traverseNode = function(node){
        var nodes = node.parentNode.selectNodes(this.traverse);
        for (var i = 0; i < nodes.length; i++)
            if(nodes[i] == node)
                return true;
        return false;
    };
    
    /**
     * Loads the binding rules from the j:bindings element
     *
     * @param  {Array}  rules    required  the rules array created using {@link Kernel#getRules(xmlNode)}
     * @param  {XMLNode}  xmlNode  optional  reference to the j:bindings element
     * @see  SmartBinding
     */
    this.loadBindings = function(rules, node){
        if (this.bindingRules)
            this.unloadBindings();
        this.bindingRules = rules;
        
        //#ifdef __DEBUG
        jpf.console.info("Initializing Bindings for " + this.tagName + "[" + (this.name || '') + "]");
        //#endif
        
        if (this.bindingRules["traverse"])
            this.parseTraverse(this.bindingRules["traverse"][0]);

        if (this.$loaddatabinding)
            this.$loaddatabinding();

        this.$checkLoadQueue();
    };
    
    this.$checkLoadQueue = function(){
        // Load from queued load request
        if (loadqueue) {
            if (this.load(loadqueue[0], loadqueue[1]) != loadqueue)
                loadqueue = null;
        }
    };

    /**
     * Unloads the binding rules from this component
     *
     * @see  SmartBinding
     */
    this.unloadBindings = function(){
        if (this.$unloaddatabinding)
            this.$unloaddatabinding();
        
        var node = this.xmlBindings;//this.$jml.selectSingleNode("Bindings");
        if (!node || !node.getAttribute("connect"))
            return;

        //Fails if parent window is closing...
        try {
            var o = eval(node.getAttribute("connect"));
            o.disconnect(this, node.getAttribute("type"));
        }
        catch(e) {}//ignore that case

        this.bindingRules = null;

        return this.uniqueId;
    };

    /**
     * Loads the action rules from the j:actions element
     *
     * @param  {Array}  rules    required  the rules array created using {@link Kernel#getRules(xmlNode)}
     * @param  {XMLNode}  xmlNode  optional  reference to the j:bindings element
     * @see  SmartBinding
     */
    this.loadActions = function(rules, node){
        if (this.actionRules)
            this.unloadActions();
        this.actionRules = rules;
        
        //#ifdef __DEBUG
        jpf.console.info("Initializing Actions for " + this.tagName 
            + "[" + (this.name || '') + "]");
        //#endif

        //@todo revise this
        if (node && (jpf.isTrue(node.getAttribute("transaction"))
          || node.selectSingleNode("add|update"))){
            if (!this.hasFeature(__TRANSACTION__))
                this.inherit(jpf.Transaction); /** @inherits jpf.Transaction */
            
            //Load ActionTracker & xmldb
            if (!this.$at)
                this.$at = new jpf.ActionTracker(this);
            //xmldb = this.parentWindow ? this.parentWindow.xmldb : main.window.xmldb;
            
            this.$at.realtime = isTrue(node.getAttribute("realtime"));
            this.defaultMode              = node.getAttribute("mode") || "update";
            
            //Turn caching off, it collides with rendering views on copies of data with the same id's
            this.caching                  = false;
        
            //When is this called?
            //this.xmldb = new jpf.XmlDatabase().Init(main.window.xmldb, this.xmlRoot);
            //this.xmlRoot = jpf.xmldb.root;
        }
    };

    /**
     * Gets the ActionTracker this component communicates with.
     *
     * @return  {_ActionTracker}  Reference to the ActionTracker instance used by this component
     * @see  SmartBinding
     */
    this.getActionTracker = function(ignoreMe){
        if (!jpf.JmlDom)
            return jpf.window.$at;
        
        var pNode = this, tracker = ignoreMe ? null : this.$at;
        if (!tracker && this.connectId)
            tracker = self[this.connectId].$at;
        
        //jpf.xmldb.getInheritedAttribute(this.$jml, "actiontracker");
        while (!tracker) {
            //if(!pNode.parentNode) throw new Error(jpf.formatErrorString(1055, this, "ActionTracker lookup", "Could not find ActionTracker by traversing upwards"));
            if (!pNode.parentNode)
                return jpf.window.$at;
            
            tracker = (pNode = pNode.parentNode).$at;
        }
        return tracker;
    };
    
    /**
     * Unloads the action rules from this component
     *
     * @see  SmartBinding
     */
    this.unloadActions = function(){
        this.xmlActions  = null;
        this.actionRules = null;
        
        //Weird, this cannot be correct... (hack?)
        if (this.$at) {
            // #ifdef __DEBUG
            if (this.$at.undolength)
                jpf.console.warn("Component : " 
                    + this.name + " [" + this.tagName + "]\n\
                    Message : ActionTracker still have undo stack filled with " 
                    + this.ActionTracker.undolength + " items.");
            // #endif
        
            this.$at = null;
        }
    };
    
    //#ifdef __WITH_LOCKING
    var lock    = {};
    //#endif 
    var actions = {};
    
    /**
     *  Start the specified action, does optional locking and can be offline aware
     *  - This method can be cancelled by events, offline etc
     *  - This method can execute pessimistic locking calls (<j:name locking="datainstr" /> rule)
     *  - or for optimistic locking it will record the timestamp (a setting <j:appsettings locking="optimistic")
     *  - During offline work, pessimistic locks will always fail
     *  - During offline work, optimistic locks will be handled by taking the timestamp of going offline
     *  - This method is always optional! The server should not expect locking to exist.
     * Example:
     * <pre class="code">
     *     <j:rename set="..." lock="rpc:comm.lockFile(xpath:@path, unlock)" />
     * </pre>
     * Note: We are expecting the status codes specified in RFC4918 for the locking implementation
     *       http://tools.ietf.org/html/rfc4918#section-9.10.6
     */
    this.$startAction = function(name, xmlContext, fRollback){
        if (this.disabled)
            return false;
        
        var actionRule = this.getNodeFromRule(name, xmlContext, true);
        if (this.actionRules && !actionRule)
            return false;
        
        //#ifdef __WITH_OFFLINE
        if (!jpf.offline.canTransact())
            return false;
        //#endif
        
        if (this.dispatchEvent("" + name + "start", {
            xmlContext: xmlContext
        }) === false)
            return false;
        
        //#ifdef __WITH_LOCKING
        
        //Requesting a lock, whilst we still have one open
        if (lock[name] && !lock[name].stopped) {
            //#ifdef __WITH_DEBUG
            jpf.console.warn("Starting new action whilst previous \
                action wasn't terminated:" + name);
            //#endif
            
            this.$stopAction(); //or should we call: fRollback.call(this, xmlContext);
        }
        
        //Check if we should attain a lock (when offline, we just pretend to get it)
        var lockInstruction = actionRule ? actionRule.getAttribute("lock") : null;
        if ((!jpf.offline.enabled || !jpf.offline.isOnline) && lockInstruction) {
            var curLock = lock[name] = {
                start      : jpf.offline.isOnline
                                ? new Date().getTime()
                                : jpf.offline.offlineTime, 
                stopped    : false,
                xmlContext : xmlContext,
                instr      : lockInstruction,
                rollback   : fRollback
            };

            //Execute pessimistic locking request
            jpf.saveData(lockInstruction, xmlContext, null, function(data, state, extra){
                if (state == jpf.TIMEOUT && extra.retries < jpf.maxHttpRetries)
                    return extra.tpModule.retry(extra.id);
                
                if (state == jpf.SUCCESS) {
                    _self.dispatchEvent("locksuccess", jpf.extend({
                        state   : extra.http.status,
                        bubbles : true
                    }, extra));
                    
                    curLock.retrieved = true; //@todo Record timeout here... think of method
                    
                    //Action was apparently finished before the lock came in, cancelling lock
                    if (curLock.stopped)
                        _self.$stopAction(name, true, curLock);
                    
                    //That's it we're ready to go...
                }
                else {
                    if (curLock.stopped) //If the action has terminated we just let it go
                        return; //Do we want to take away the event from the developer??
                    
                    _self.dispatchEvent("lockfailed", jpf.extend({
                        state   : extra.http.status,
                        bubbles : true
                    }, extra));
                    
                    //Cancel the action, because we didnt get a lock
                    fRollback.call(this, xmlContext);
                }
            });
        }
        //#endif
        
        actions[name] = xmlContext;
        
        return true;
    };
    
    //#ifdef __WITH_RSB
    // @todo think about if this is only for rsb 
    this.addEventListener("xmlupdate", function(e){
        if (jpf.xmldb.disableRSB != 2)
            return;
        
        for (var name in actions) {
            if (jpf.xmldb.isChildOf(actions[name], e.xmlNode, true)) {
                //this.$stopAction(name, true);
                actions[name].rollback.call(this, actions[name].xmlContext);
            }
        }
    });
    //#endif
    
    this.$stopAction = function(name, isCancelled, curLock){
        delete actions[name];
        
        //#ifdef __WITH_LOCKING
        if (!curLock) curLock = lock[name];
        
        if (curLock && !curLock.stopped) {
            curLock.stopped = true;
            
            //The resource needs to unlock when the action is cancelled
            if (isCancelled && curLock.retrieved) {
                //Execute unlocking request
                jpf.saveData(curLock.instr, curLock.xmlContext, {
                        unlock     : true
                    }, 
                    function(data, state, extra){
                        if (state == jpf.TIMEOUT && extra.retries < jpf.maxHttpRetries)
                            return extra.tpModule.retry(extra.id);
                        
                        //Do we care if an unlock failed/succeeded?
                        _self.dispatchEvent(
                            (state == jpf.SUCCESS
                                ? "unlocksuccess"
                                : "unlockfailed"), 
                            jpf.extend({
                                state   : extra.http.status,
                                bubbles : true
                            }, extra));
                    });
            }
        }
        
        return curLock;
        //#endif
    };
     
    /**
     * Executes an action using action rules set in the j:actions element
     *
     * @param  {String}   atAction     required  specifying the function known to the ActionTracker of this component.
     * @param  {Array}    args         required  containing the arguments to the function specified in <code>atAction</code>.
     * @param  {String}   action       required  specifying the name of the action rule defined in j:actions for this component.
     * @param  {XMLNode}  xmlNode      required  specifying the context for the action rules.
     * @param  {Boolean}  noevent      optional  specifying wether or not to call events.
     * @param  {XMLNode}  contextNode  optional  setting the context node for action processing (such as RPC calls). Usually the same as <code>xmlNode</code>
     * @return {Boolean}  specifies success or failure
     * @see  SmartBinding
     */
    this.executeAction = function(atAction, args, action, xmlNode, noevent, contextNode){
        if (this.disabled) return; //hack

        //#ifdef __DEBUG
        jpf.console.info("Executing action '" + action + "' for " + this.name + " [" + (this.tagName || "") + "]");
        //#endif

        //#ifdef __WITH_OFFLINE
        if(!jpf.offline.canTransact())
            return false;
        //#endif

        //Get Rules from Array
        var rules = this.actionRules
            ? this.actionRules[action]
            : (!action.match(/change|select/) && jpf.appsettings.autoDisableActions
                ? false 
                : []);

        if (!rules)
            return false;

        //#ifdef __WITH_LOCKING
        var curLock = this.$stopAction(action);
        //#endif

        for (var node, i = 0; i < (rules.length || 1); i++) {
            if (!rules[i] || !rules[i].getAttribute("select")
                || xmlNode.selectSingleNode(rules[i].getAttribute("select"))) {
                
                var options = {
                    action        : atAction, 
                    args          : args,
                    xmlActionNode : rules[i],
                    jmlNode       : this,
                    selNode       : contextNode
                    //#ifdef __WITH_LOCKING
                    ,timestamp    : curLock 
                                      ? curLock.start 
                                      : new Date().getTime()
                    //#endif
                };
                
                //Call Event and cancel if it returns false
                if (!noevent) {
                    //Allow the action and arguments to be changed by the event
                    if (this.dispatchEvent("before" + action.toLowerCase(), 
                      options) === false)
                        return false;
                }
                
                //Call ActionTracker and return ID of Action in Tracker
                var UndoObj = this.getActionTracker().execute(options);

                //Call After Event
                this.dispatchEvent("after" + action.toLowerCase());

                return UndoObj;
            }
        }

        //Action not executed
        return false;
    };
    
    this.executeActionByRuleSet = function(atName, setName, xmlNode, value){
        var xpath, args, selInfo = this.getSelectFromRule(setName, xmlNode);
        var atAction, node = selInfo[1];

        if (node) {
            if (jpf.xmldb.getNodeValue(node) == value) return; // Do nothing if value is unchanged
            
            atAction = (node.nodeType == 1 || node.nodeType == 3
                || node.nodeType == 4) ? "setTextNode" : "setAttribute";
            args = (node.nodeType == 1)
                ? [node, value]
                : (node.nodeType == 3 || node.nodeType == 4
                    ? [node.parentNode, value]
                    : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
        }
        else {
            if (!this.createModel) return false;
            atAction = "setValueByXpath";
            xpath    = selInfo[0];
            
            if (!xmlNode) {
                //Assuming this component is connnected to a model
                var model   = this.getModel();
                if (!model || !model.data)
                    return false;

                xpath   = (model.getXpathByJmlNode(this) || ".")
                    + (xpath && xpath != "." ? "/" + xpath : "");
                xmlNode = model.data;
            }
            
            args = [xmlNode, value, xpath];
        }
        
        //Use Action Tracker
        this.executeAction(atAction, args, atName, xmlNode);
    };

    /**
     * Connects a JML component to this component. 
     * This connection is used to push data from this component to the other component.
     * Whenever this component loads data, (a selection of) the data is pushed to
     * the other component. For components inheriting from MultiSelect data is pushed
     * when a selection occurs.
     *
     * @param  {JmlNode}  oComponent  required  JmlNode specifying the component which is connected to this component.
     * @param  {Boolean}  dataOnly  optional  true  data is sent only once.
     *                                        false  default  real connection is made.
     * @param  {String}  xpath   optional  String specifying the Xpath statement used to select a subset of the data to sent.
     * @param  {String}  type   optional  select  default  sents data when a node is selected
     *                                        choice  sents data when a node is chosen (by double clicking, or pressing enter)
     * @see  SmartBinding
     * @see  #disconnect
     */
    this.connect = function(o, dataOnly, xpath, type, noselect){
        if (o.dataParent)
            o.dataParent.parent.disconnect(o);
        
        if (!this.signalXmlUpdate)
            this.signalXmlUpdate = {};

        o.dataParent = {
            parent: this,
            xpath : xpath
        };
        
        //Onload - check if problem when doing setConnections to early
        if (dataOnly) {
            // #ifdef __DEBUG
            if (!xpath && !this.selected) {
                throw new Error(jpf.formatErrorString(1056, null, "Connecting", "Illegal XPATH statement specified: '" + xpath + "'"));
            }
            // #endif

            if (cXmlOnLoad)
                return cXmlOnLoad.push([o, xpath]);
            else
                return o.load(xpath ? this.xmlRoot.selectSingleNode(xpath) : this.selected);//(this.selected || this.xmlRoot)
        }

        //jpf.debug Message
        //alert(this.tagName + ":" + o.tagName + " - " + type + "["+dataOnly+"]");

        //User action - Select || Choice
        if (!dataOnly)
            (!type || type == "select")
                ? cXmlSelect.push({o:o,xpath:xpath})
                : cXmlChoice.push({o:o,xpath:xpath});

        //Load Default
        if (type != "choice" && !noselect) {
            if (this.selected || !this.traverse && this.xmlRoot) {
                var xmlNode = this.selected || this.xmlRoot;
                if (xpath) {
                    xmlNode = xmlNode.selectSingleNode(xpath);
                    if (!xmlNode) {
                        //Hack!!
                        this.addEventListener("xmlupdate", function(){
                            this.connect(o, false, xpath, type);
                            this.removeEventListener("xmlupdate", arguments.callee);
                        });
                    }
                }
                
                if (xmlNode)
                    o.load(xmlNode);
            }
            else {
                if (o.clear && !o.hasFeature(__MULTIBINDING__))
                    o.clear(); //adding o.hasFeature(__MULTIBINDING__) is a quick fix. should be only with the bind="" level
                if (o.disable)
                    o.disable();
            }
        }
    };

    /**
     * Disconnects a JML component from this component. 
     *
     * @param  {JmlNode}  oComponent  required  JmlNode specifying the component to be disconnected from this component.
     * @param  {String}  type   optional  select  default  disconnects the select connection
     *                                        choice  disconnects the choice connection
     * @see  SmartBinding
     * @see  #connect
     */
    this.disconnect = function(o, type){
        //User action - Select || Choice
        var ar = (!type || type == "select") ? cXmlSelect : cXmlChoice; //This should be both when there is no arg set

        this.signalXmlUpdate[o.uniqueId] = null;
        delete this.signalXmlUpdate[o.uniqueId];
        o.dataParent = null;

        //CAN BE OPTIMIZED IF NEEDED TO ONLY SET TO null
        for (var i = 0; i < ar.length; i++){
            if (ar[i].o != o) continue;
    
            for (var j = i; j < ar.length; j++)
                ar[j] = ar[j + 1];
            ar.length--;
            i--;
        }
    };

    /**
     * Pushes data to connected components 
     *
     * @param  {XMLNode}  xmlNode  required  XML data node to be pushed to the connected components.
     * @param  {String}  type   optional  select  default  pushes data to the components registered for selection
     *                                     choice  pushes data to the components registered for choice
     * @see  SmartBinding
     * @see  #connect
     * @see  #disconnect
     */
    this.setConnections = function(xmlNode, type){
        var a = type == "both"
            ? cXmlChoice.concat(cXmlSelect)
            : (type == "choice" ? cXmlChoice : cXmlSelect);

        //Call Load of objects
        for (var i = 0; i < a.length; i++) {
            a[i].o.load((a[i].xpath && xmlNode)
                ? xmlNode.selectSingleNode(a[i].xpath)
                : xmlNode);
        }

        //Set Onload Connections only Once
        if (!cXmlOnLoad) return;

        for (var i = 0; i < cXmlOnLoad.length; i++)
            cXmlOnLoad[i][0].load(cXmlOnLoad[i][1]
                ? this.xmlRoot.selectSingleNode(cXmlOnLoad[i][1])
                : this.selected);//(this.selected || this.xmlRoot)

        cXmlOnLoad = null;
    };
    
    this.importConnections = function(x){
        cXmlSelect = x;
    };
    
    this.getConnections = function(){
        return cXmlSelect;
    };
    
    this.removeConnections = function(){
        cXmlSelect = [];
    };

    /**
     * Uses bind rules to convert data into a value string 
     *
     * @param  {String}  setname   required  String specifying the name of the binding rule set.
     * @param  {XMLNode}  cnode  required  XML node to which the binding rules are applied.
     * @param  {String}  def   optional  String specifiying the default (fallback) value for the query.
     * @return  {String}  the calculated value
     * @see  SmartBinding
     */
    this.applyRuleSetOnNode = function(setname, cnode, def){
        if (!cnode) return "";

        //Get Rules from Array
        var rules = (this.bindingRules || {})[setname];

        // #ifdef __DEBUG
        if (!this.$dcache)
            this.$dcache = {};
        
        if (!rules && !def && !this.$dcache[this.uniqueId + "." + setname]
          && typeof this[setname] != "string") {
            this.$dcache[this.uniqueId + "." + setname] = true;
            jpf.console.info("Could not find a binding rule for '" + setname 
                             + "' (" + this.tagName 
                             + " [" + (this.name || "") + "])")
        }
        // #endif

        if (!rules) {
            // #ifdef __WITH_INLINE_DATABINDING
            return typeof this[setname] == "string" 
                    && jpf.getXmlValue(cnode, this[setname]) 
                    || def && cnode.selectSingleNode(def) || false;
            /* #else
            return def && cnode.selectSingleNode(def) || false;
            #endif */
        }

        for (var node = null, i = 0; i < rules.length; i++) {
            var sel = jpf.parseExpression(rules[i].getAttribute("select")) || ".";
            var o = cnode.selectSingleNode(sel);

            if (o) {
                this.lastRule = rules[i];

                //Return Node if rule contains RPC definition
                if (rules[i].getAttribute("rpc"))
                    return rules[i];
                else if(rules[i].getAttribute("value")){ //Check for Default Value
                    /**
                     * @todo internationalization for <j:caption value="no value" />
                     */
                     
                    //#ifdef __WITH_LANG_SUPPORT
    				//jpf.KeywordServer.addElement(q.nodeValue.replace(/^\$(.*)\$$/,
                    //    "$1"), {htmlNode : pHtmlNode});
    				//#endif
                    
                    return rules[i].getAttribute("value");
                }

                // #ifdef __SUPPORT_XSLT || __SUPPORT_JSLT
                //Process XSLT/JSLT Stylesheet if needed
                else if(rules[i].childNodes.length) {
                    var xsltNode;
                    
                    //Check Cache
                    if (rules[i].getAttribute("cacheId")) {
                        xsltNode = jpf.nameserver.get("xslt",
                            rules[i].getAttribute("cacheId"));
                    }
                    else {
                        //Find Xslt Node
                        var prefix = jpf.findPrefix(rules[i], jpf.ns.xslt);
                        var xsltNode;
                        
                        if (rules[i].getElementsByTagNameNS) {
                            xsltNode = rules[i].getElementsByTagNameNS(jpf.ns.xslt, "*")[0];
                        }
                        else {
                            var prefix = jpf.findPrefix(rules[i], jpf.ns.xslt, true);
                            if (prefix) {
                                if (!jpf.supportNamespaces)
                                    rules[i].ownerDocument.setProperty("SelectionNamespaces", "xmlns:"
                                        + prefix + "='" + jpf.ns.xslt + "'");
                                xsltNode = rules[i].selectSingleNode(prefix + ":*");
                            }
                        }
                            
                        if (xsltNode) {
                            if (xsltNode[jpf.TAGNAME] != "stylesheet") {
                                //Add it
                                var baseXslt = jpf.nameserver.get("base", "xslt");
                                if (!baseXslt) {
                                    baseXslt = jpf.getXmlDom(
                                        '<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="node()"></xsl:template></xsl:stylesheet>')
                                        .documentElement;
                                    jpf.nameserver.register("base", "xslt", xsltNode);
                                }

                                var xsltNode = baseXslt.cloneNode(true);
                                for (var j = rules[i].childNodes.length; j >= 0; j++)
                                    xsltNode.firstChild.appendChild(rules[i].childNodes[j]);
                                
                                //Set cache Item
                                rules[i].setAttribute("cacheId",
                                    jpf.nameserver.add("xslt", xsltNode));
                            }
                        }
                    }
                    
                    //XSLT
                    if (xsltNode) {
                        var x = o.transformNode(xsltNode)
                            .replace(/^<\?xml version="1\.0" encoding="UTF-16"\?>/, "")
                            .replace(/\&lt\;/g, "<").replace(/\&gt\;/g, ">")
                            .replace(/\&amp\;/g, "&");
                    }
                    //JSLT
                    else {
                        var x = jpf.JsltInstance.apply(rules[i], o);
                        
                        //#ifdef $DEBUG:
                        var d = document.createElement("div");
                        var t = window.onerror;
                        window.onerror = function(){
                            window.onerror = t;
                            throw new Error(jpf.formatErrorString(0, this, "JSLT transform", "HTML Error:"+x,rules[i]));
                        }
                        d.innerHTML    = x;
                        d.innerHTML    = '';
                        window.onerror = t;
                        //#endif
                    }
                    
                    //#ifdef __DEBUG    
                    if (rules[i].getAttribute("method"))
                        try{eval(rules[i].getAttribute("method"));
                    }
                    catch(e) {
                        return false;//throw new Error("---- Javeline Error ----\nMessage : Could not find method '" + rules[i].getAttribute("method") + "' referenced in XML.")
                    }
                    //#endif
                    
                    return rules[i].getAttribute("method") ? self[rules[i].getAttribute("method")](x, this) : x;
                }
                // #endif

                //Execute Callback if any
                else if(rules[i].getAttribute("method")){
                    if(!self[rules[i].getAttribute("method")]){
                        // #ifdef __DEBUG
                        throw new Error(jpf.formatErrorString(1058, this, "Transforming data", "Could not find method '" + rules[i].getAttribute("method") + "' referenced in XML."));
                        // #endif
                        
                        return false;
                    }

                    return self[rules[i].getAttribute("method")](o, this);
                    //if(!res) continue;
                    //else return res;
                }
                //Execute Expression
                else if(rules[i].getAttribute("eval")){
                    var func = new Function('xmlNode', 'control', "return " + rules[i].getAttribute("eval"));
                    
                    var value = func.call(this, o, this);
                    if (!value) continue;
                    
                    return value;
                }
                //Process XMLElement
                else {
                    if (o.nodeType == 1) {
                        if (!o.firstChild || o.firstChild.nodeType == 1 || o.firstChild.nodeType > 4)
                            return " ";
                        //(!o.firstChild || o.firstChild.nodeType == 1 && o.firstChild.nodeType > 4) ? o.appendChild(o.ownerDocument.createTextNode("")) : 
                        
                        o = o.firstChild;
                    }
    
                    //Return TextValue of Attribute | Text Node | CDATA Section
                    //else if(o.nodeType == 2 || o.nodeType == 3 || o.nodeType == 4){
                    var value;
                    if (o.nodeType == 2) {
                        try {
                            value = decodeURI(o.nodeValue);
                        }
                        catch(e) {
                            value = o.nodeValue;
                        }
                        value = unescape(value);
                    }
                    else
                        value = o.nodeValue;

                    //Mask Support
                    if (rules[i].getAttribute("mask")) {
                        if (value.match(/^(?:true|false)$/))
                            value = value=="true"?1:0;
                        return rules[i].getAttribute("mask").split(";")[value];
                    }
                    else
                        return value;
                    //}
                    //else return true;
                }

                //return (rules[i].getAttribute("default") || decodeURI(o.nodeValue));//(o.nodeType == 3 ? o.nodeValue : o)
            }
        }

        // #ifdef __DEBUG
        if (!this.$dcache[this.uniqueId + "." + setname]) {
            this.$dcache[this.uniqueId + "." + setname] = true;
            jpf.console.warn("Could not find a SmartBindings rule for property \
                              '" + setname + "' which matches any data for \
                              component " + this.name + " [" + this.tagName + "].")
        }
        // #endif

        //Applying failed
        return false;
    };

    /**
     * Assigns a SmartBinding to this component
     *
     * @param  {variant}  sb  required  SmartBinding  object to be assigned to this component.
     *                                String  specifying the name of the SmartBinding.
     * @throws  Error  If no SmartBinding was passed to the method.
     * @see  SmartBinding
     */
    this.setSmartBinding = function(sb){
        this.$propHandlers["smartbinding"].call(this, sb);
        /*
            this.setProperty && this.setProperty("smartbinding", sb)
            || 
        */
    };
    
    /**
     * Removes the SmartBinding to this component
     *
     * @see  SmartBinding
     */
    this.removeSmartBinding = function(){
        this.setProperty("smartbinding", null);
    };
    
    /**
     * Gets the SmartBinding of this component
     *
     * @returns  {SmartBinding}  The SmartBinding object of this component
     * @see  SmartBinding
     */
    this.getSmartBinding = function(){
        return this.smartBinding;
    };
    
    /**
     * Gets the model to which this component is connected.
     * This is the model which acts as datasource for this component.
     *
     * @returns  {Model}  The model this component is connected to.
     * @see  SmartBinding
     */
    this.getModel = function(do_recur){
        if(do_recur && !this.$model)
            return this.dataParent ? this.dataParent.parent.getModel(true) : null;
        
        return this.$model;
    };
    
    /**
     * Sets the model to which this component is connected.
     * This is the model which acts as datasource for this component.
     *
     * @param  {Model}  model  required  The model this component is connected to.
     * @param  {String}  xpath  optional  XPath used to query a subset of the data presented by the model.
     * @see  SmartBinding
     */
    this.setModel = function(model, xpath){
        if (typeof model == "string")
            model = jpf.nameserver.get("model", model);
        
        model.register(this, xpath);
    };
    
    /**
     * Gets the data node or binding/action rule of a binding set.
     *
     * @param  {String}  setname   required  String specifying the name of the binding/action rule set.
     * @param  {XMLNode}  cnode  required  XML node to which the binding rules are applied.
     * @param  {Boolean}  isAction  optional  true  search is for an action rule.
     *                                        false  otherwise.
     * @param  {Boolean}  getRule  optional  true  search is for a binding rule.
     *                                        false  otherwise
     * @param  {Boolean}  createNode  optional  true  when the data node is not found it is created.
     *                                        false  the data is never changed
     * @returns  {XMLNode}  the requested node
     * @see  SmartBinding
     */
    this.getNodeFromRule = function(setname, cnode, isAction, getRule, createNode){
        //Get Rules from Array
        var rules = ((isAction ? this.actionRules : this.bindingRules) || {})[setname];
        if (!rules) {
            // #ifdef __WITH_INLINE_DATABINDING
            if (!isAction && !getRule && typeof this[setname] == "string") {
                return cnode.selectSingleNode(this[setname]) || (createNode 
                    ? jpf.xmldb.createNodeFromXpath(cnode, this[setname])
                    : false);
            }
            //#endif
            return false;
        }

        for(var i = 0; i < rules.length; i++) {
            //#ifdef __SUPPORT_Safari_Old
            if (!rules[i]) continue;
            //#endif
            
            var sel = jpf.parseExpression(rules[i].getAttribute("select")) || ".";
            
            if (!sel)
                return getRule ? rules[i] : false;
            if (!cnode) return false;
            
            var o = cnode.selectSingleNode(sel);
            if (o)
                return getRule ? rules[i] : o;
            
            if (createNode || rules[i].getAttribute("create") == "true") {
                var o = jpf.xmldb.createNodeFromXpath(cnode, sel);
                return getRule ? rules[i] : o;
            }
        }

        //Retrieving Failed
        return false;
    };
    
    this.getSelectFromRule = function(setname, cnode){ 
        var rules = this.bindingRules && this.bindingRules[setname];
        if (!rules || !rules.length) {
            //#ifdef __WITH_INLINE_DATABINDING
            return typeof this[setname] == "string" && [this[setname]] || ["."];
            /* #else
            return ["."];
            #endif */
                
        }

        for (var first, i = 0; i < rules.length; i++) {
            var sel = jpf.parseExpression(rules[i].getAttribute("select")) || ".";
            
            if (!cnode) return [sel];
            if (i == 0)
                first = sel;
            
            var o = cnode.selectSingleNode(sel);
            if (o)
                return [sel, o];
        }
        
        return [first];
    };

    /**
     * Reloads the data in this component.
     *
     */
    this.reload = function(){
        this.load(this.xmlRoot, this.cacheID, true);
    };

    /**
     * Loads xml data in this component.
     *
     * @param  {variant}  xmlRootNode  optional  XMLNode  XML node which is loaded in this component. 
     *                                          String  Serialize xml which is loaded in this component.
     *                                          Null  Giving null clears this component {@link Cache#clear}.
     * @param  {String}  cacheID   optional  XML node to which the binding rules are applied.
     * @param  {Boolean}  forceNoCache  optional  true  Loads data without checking for a cached rendering.
     *                                          false  default  Checks cache when loading the data.
     * @event  onbeforeload  Before loading data in this component.
     * @event  onafterload  After loading data in this component.
     * @see  SmartBinding
     * @see  Cache#clear
     */
    this.load = function(xmlRootNode, cacheID, forceNoCache, noClearMsg){
        //#ifdef __WITH_POPUP
        jpf.popup.forceHide(); //This should be put in a more general position
        //#endif

        // If control hasn't loaded databinding yet, buffer the call
        if (!this.bindingRules && this.$jml 
          && (!this.smartBinding || jpf.JmlParser.stackHasBindings(this.uniqueId))
          && (!this.$canLoadData || this.$canLoadData())
          && !this.traverse) {
            //#ifdef __DEBUG
            if (!jpf.JmlParser.stackHasBindings(this.uniqueId)) {
                jpf.console.warn("Could not load data yet in " + this.tagName 
                    + "[" + (this.name || "") + "]. The loaded data is queued \
                      until smartbinding rules are loaded or set manually.");
            }
            //#endif
            return loadqueue = [xmlRootNode, cacheID];
        }

        // Convert first argument to an xmlNode we can use;
        if (xmlRootNode)
            xmlRootNode = jpf.xmldb.getBindXmlNode(xmlRootNode);
        
        // If no xmlRootNode is given we clear the control, disable it and return
        if (this.dataParent && this.dataParent.xpath)
            this.dataParent.parent.signalXmlUpdate[this.uniqueId] = !xmlRootNode;
        
        if (!xmlRootNode) {
            //#ifdef __DEBUG
            jpf.console.warn("No xml root node was given to load in " 
                + this.tagName + "[" + (this.name || '') + "]. Clearing any \
                  loaded xml in this component");
            //#endif
            
            this.clear(noClearMsg, true);
            
            if (jpf.appsettings.autoDisable && !this.createModel)
                this.disable();
                
            this.setConnections();
            return;
        }
        
        //#ifdef __DEBUG
        jpf.console.info("Loading XML data in " 
            + this.tagName + "[" + (this.name || '') + "]");
        //#endif
        
        this.disabled = false;
        
        // Remove listen root if available (support for listening to non-available data)
        if (this.$listenRoot) {
            jpf.xmldb.removeNodeListener(this.$listenRoot, this);
            this.$listenRoot = null;
        }
        
        //Run onload event
        if (this.dispatchEvent("beforeload", {xmlNode : xmlRootNode}) === false)
            return false;
        
        // If reloading current document, and caching is disabled, exit
        if (this.caching && !forceNoCache && xmlRootNode == this.xmlRoot)
            return;
        
        // retrieve the cacheId
        if (!cacheID) {
            cacheID = xmlRootNode.getAttribute(jpf.xmldb.xmlIdTag) ||
                jpf.xmldb.nodeConnect(jpf.xmldb.getXmlDocId(xmlRootNode), xmlRootNode);
        }

        // Remove message notifying user the control is without data
        if (this.$removeClearMessage)
            this.$removeClearMessage();

        // Retrieve cached version of document if available
        if (this.caching && !forceNoCache && this.getCache(cacheID, xmlRootNode)) {
            
            if (!this.hasFeature(__MULTISELECT__))
                this.setConnections(this.xmlRoot, "select");
            else {
                var nodes = this.getTraverseNodes();
                
                //Information needs to be passed to the followers... even when cached...
                if (nodes.length && this.autoselect)
                    this.select(nodes[0], null, null, null, true);
                else
                    this.setConnections();

                if (!nodes.length)
                    this.$setClearMessage(this.emptyMsg, "empty");
            }
            
            this.dispatchEvent('afterload', {XMLRoot : xmlRootNode});
            return;
        }
        else
            this.clear(true);

        //Set usefull vars
        this.documentId = jpf.xmldb.getXmlDocId(xmlRootNode);
        this.cacheID    = cacheID;
        this.xmlRoot    = xmlRootNode;

        // Draw Content
        this.$load(xmlRootNode);

        // Check if subtree should be loaded
        this.$loadSubData(xmlRootNode);
        
        this.disabled = true; //force enabling
        this.enable();

        // Check Connections
        if (!this.hasFeature(__MULTISELECT__))
            this.setConnections(this.xmlRoot);

        // Run onafteronload event
        this.dispatchEvent('afterload', {XMLRoot : xmlRootNode});
    };
    
    this.$loadSubData = function(xmlRootNode){
        if (this.hasLoadStatus(xmlRootNode)) return;
        
        // #ifdef __WITH_OFFLINE_TRANSACTIONS
        if (!jpf.offline.isOnline) {
            jpf.offline.transactions.actionNotAllowed();
            this.loadedWhenOffline = true;

            if (!this.getTraverseNodes().length)
                this.$setClearMessage(this.offlineMsg, "offline");
            
            return;
        }
        //#endif
        
        //var loadNode = this.applyRuleSetOnNode("load", xmlRootNode);
        var loadNode, rule = this.getNodeFromRule("load", xmlRootNode, false, true);
        var sel = (rule && rule.getAttribute("select"))
            ? rule.getAttribute("select")
            : ".";

        if (rule && (loadNode = xmlRootNode.selectSingleNode(sel))) {
            this.setLoadStatus(xmlRootNode, "loading");
            
            this.$setClearMessage(this.loadingMsg, "loading");
            
            //||jpf.xmldb.findModel(xmlRootNode)
            var mdl = this.getModel(true);
            //#ifdef __DEBUG
            if (!mdl)
                throw new Error("Could not find model");
            //#endif

            var jmlNode = this;
            if (mdl.insertFrom(rule.getAttribute("get"), loadNode, {
                    insertPoint : this.xmlRoot, 
                    jmlNode     : this
                }, function(){
                    jmlNode.setConnections(jmlNode.xmlRoot);
                }) === false
            ) {
                this.clear(true);
                if (jpf.appsettings.autoDisable)
                    this.disable();
                this.setConnections(null, "select"); //causes strange behaviour
            }
        }
    };

    /**
     * @private
     */
    this.setLoadStatus = function(xmlNode, state, remove){
        //remove old status if any
        var ostatus = xmlNode.getAttribute("j_loaded");
        ostatus = ostatus
            ? ostatus.replace(new RegExp("\\|\\w+\\:" + this.uniqueId + "\\|", "g"), "")
            : "";
            
        if (!remove)
            ostatus += "|" + state + ":" + this.uniqueId + "|";
            
        xmlNode.setAttribute("j_loaded", ostatus);
    };
    
    /**
     * @private
     */
    this.removeLoadStatus = function(xmlNode){
        this.setLoadStatus(xmlNode, null, true);
    };

    /**
     * @private
     */
    this.hasLoadStatus = function(xmlNode, state){
        var ostatus = xmlNode.getAttribute("j_loaded");
        if (!ostatus) return false;

        return (ostatus.indexOf((state || "") + ":" + this.uniqueId + "|") != -1)
    };

    this.insert = function(XMLRoot, parentXMLNode, options){
        if (typeof XMLRoot != "object")
            XMLRoot = jpf.getXmlDom(XMLRoot).documentElement;
        if (!parentXMLNode)
            parentXMLNode = this.xmlRoot;
        
        if (this.dispatchEvent("beforeinsert", {xmlParentNode : parentXMLNode}) === false)
            return false;
        
        //Integrate XMLTree with parentNode
        var newNode = jpf.xmldb.integrate(XMLRoot, parentXMLNode, 
          jpf.extend(options, {copyAttributes: true}));

        //Call __XMLUpdate on all listeners
        jpf.xmldb.applyChanges("insert", parentXMLNode);

        //Select or propagate new data
        if (this.selectable && this.autoselect) {
            if (this.xmlRoot == newNode)
                this.$selectDefault(this.xmlRoot);
        }
        else if (this.xmlRoot == newNode)
            this.setConnections(this.xmlRoot, "select");
        
        if (this.hasLoadStatus(parentXMLNode, "loading"))
            this.setLoadStatus(parentXMLNode, "loaded");

        this.dispatchEvent("afterinsert");

        //Check Connections
        //this one shouldn't be called because they are listeners anyway...(else they will load twice)
        //if(this.selected) this.setConnections(this.selected, "select");
    };

    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/
    // #ifdef __WITH_MULTISELECT
    this.inherit(this.hasFeature(__MULTISELECT__)
        ? jpf.MultiselectBinding
        : jpf.StandardBinding);
    // #endif
    
    function findModel(x, isSelection) {
        return x.getAttribute((isSelection
            ? "ref"
            : "") + "model") || jpf.xmldb.getInheritedAttribute(x, null,
              function(xmlNode){
                if (isSelection && x == xmlNode)
                    return false;
                if (xmlNode.getAttribute("model")) {
                    /*
                    var isCompRef = xmlNode.getAttribute("model").substr(0,1) == "#";
                    if (xmlNode.getAttribute("id") 
                      && self[xmlNode.getAttribute("id")].hasFeature(__DATABINDING__)) {
                        var data = xmlNode.getAttribute("model").split(":", 3);
                        return "#" + xmlNode.getAttribute("id") + ((isCompRef 
                            ? data[2] 
                            : data[1]) || "");
                    }
                    */
                    return xmlNode.getAttribute("model");
                }
                if (xmlNode.getAttribute("smartbinding")) {
                    var bclass = x.getAttribute("smartbinding").split(" ")[0];
                    if (jpf.nameserver.get("model", bclass))
                        return bclass + ":select";
                }
                return false
              });
    }

    /**
     * @attribute  {String}  ref             Xpath specifying which node to bind to relative to the data loaded in this component.
     * @attribute  {String}  select-ref      Xpath specifying which node to bind to set the selection of this component.
     * @attribute  {String}  smartbinding    String specifying the name of the SmartBinding for this component.
     * @attribute  {String}  bindings        String specifying the name of the j:bindings element for this component.
     * @attribute  {String}  actions         String specifying the name of the j:actions element for this component.
     * @attribute  {String}  model           String specifying the data instruction to load data into this component
     * @attribute  {String}  empty-message   String containing the message displayed by this component when it contains no data.
     * @attribute  {String}  loading-message String containing the message displayed by this component when it's loading.
     * @attribute  {String}  offline-message String containing the message displayed by this component when it can't load data because the application is offline.
     */
    var initModelId = [];
    this.$addJmlLoader(function(x){
        //, this.ref && this.hasFeature(__MULTISELECT__)
        if (initModelId[0])
            jpf.setModel(initModelId[0], this);
        if (initModelId[1])
            jpf.setModel(initModelId[1], this, true);

        //Set the model for normal smartbinding
        if (!this.ref || this.hasFeature(__MULTISELECT__)) {
            var sb = jpf.JmlParser.sbInit[this.uniqueId] 
                && jpf.JmlParser.sbInit[this.uniqueId][0];

            //@todo experimental for traverse="" attributes
            if (this.traverse && (sb && !sb.model || !sb && this.hasFeature(__MULTISELECT__))) { 
                initModelId = findModel(x);

                if (initModelId) {
                    if (!sb)
                        this.smartBinding = true; //@todo experimental for traverse="" attributes
                    
                    jpf.setModel(initModelId, this, 0);
                }
            }
        }
        
        initModelId = null;

        if (this.hasFeature(__MULTISELECT__)) {
            //@todo An optimization might be to loop through the parents once
            var defProps = ["empty-message", "loading-message", "offline-message"];
    
            for (var i = 0, l = defProps.length; i < l; i++) {
                if (!x.getAttribute(defProps[i]))
                    this.$propHandlers[defProps[i]].call(this);
            }
        }
        
        if (!x.getAttribute("create-model"))
            this.$propHandlers["create-model"].call(this);
        
        if (!jpf.JmlParser.sbInit[this.uniqueId] && this.$setClearMessage 
          && !loadqueue && !this.xmlRoot && this.hasFeature(__MULTISELECT__))
            this.$setClearMessage(this.emptyMsg, "empty");
    });
    
    this.$jmlDestroyers.push(function(){
        // Remove data connections - Should be in DataBinding
        if (this.dataParent)
            this.dataParent.parent.disconnect(this);
        if (this.hasFeature(__DATABINDING__)) {
            this.unloadBindings();
            this.unloadActions();
        }
    });
    
    //@todo move these to the appropriate subclasses
    this.$booleanProperties["render-root"] = true;
    this.$supportedProperties.push("empty-message", "loading-message",
        "offline-message", "render-root", "smartbinding", "create-model",
        "bindings", "actions", "dragdrop");
    
    this.$propHandlers["empty-message"] = function(value){
        this.emptyMsg = value 
            || jpf.xmldb.getInheritedAttribute(this.$jml, "empty-message") 
            || "No items";
    };

    this.$propHandlers["loading-message"] = function(value){
        this.loadingMsg = value 
            || jpf.xmldb.getInheritedAttribute(this.$jml, "loading-message") 
            || "Loading...";
    };

    this.$propHandlers["offline-message"] = function(value){
        this.offlineMsg = value 
            || jpf.xmldb.getInheritedAttribute(this.$jml, "offline-message") 
            || "You are currently offline...";
    };

    this.$propHandlers["create-model"] = function(value){
        this.createModel = !jpf.isFalse(
            jpf.xmldb.getInheritedAttribute(this.$jml, "create-model"));
    };

    this.$propHandlers["smartbinding"] = function(value){
        var sb;
        
        if (value && typeof value == "string") {
            sb = jpf.JmlParser.getSmartBinding(value);
            
            //#ifdef __DEBUG
            if (!sb) 
                throw new Error(jpf.formatErrorString(1059, this, 
                    "Attaching a smartbinding to " + this.tagName 
                    + " [" + this.name + "]", 
                    "Smartbinding '" + value + "' was not found."));
            //#endf
        }
        else 
            sb = value;
        
        if (this.smartBinding)
            this.smartBinding.deinitialize(this)
        
        if (jpf.isParsing)
            return (this.smartBinding = sb.initialize(this));
            
        return (this.smartBinding = sb.markForUpdate(this));
    };

    this.$propHandlers["bindings"] = function(value){
        var sb = this.smartBinding || (jpf.isParsing 
            ? jpf.JmlParser.getFromSbStack(this.uniqueId)
            : this.$propHandlers["smartbinding"].call(this, new jpf.SmartBinding()));

        if (!value) {
            //sb.removeBindings();
            throw new Error("Not Implemented"); //@todo
            return;
        }

        // #ifdef __DEBUG
        if (!jpf.nameserver.get("bindings", value))
            throw new Error(jpf.formatErrorString(1064, this, 
                "Connecting bindings", 
                "Could not find bindings by name '" + value + "'", this.$jml));
        // #endif
        
        sb.addBindings(jpf.nameserver.get("bindings", value));
    };

    this.$propHandlers["actions"] = function(value){
        var sb = this.smartBinding || (jpf.isParsing 
            ? jpf.JmlParser.getFromSbStack(this.uniqueId)
            : this.$propHandlers["smartbinding"].call(this, new jpf.SmartBinding()));

        if (!value) {
            //sb.removeBindings();
            throw new Error("Not Implemented"); //@todo
            return;
        }

        // #ifdef __DEBUG
        if (!jpf.nameserver.get("actions", value))
            throw new Error(jpf.formatErrorString(1065, this, 
                "Connecting bindings", 
                "Could not find actions by name '" + value + "'", this.$jml));
        // #endif
        
        sb.addActions(jpf.nameserver.get("actions", value));
    };
    
    // #ifdef __WITH_INLINE_DATABINDING
    function refModelPropSet(strBindRef){
        var isSelection = this.hasFeature(__MULTISELECT__) ? 1 : 0;
        var o = isSelection
            ? this.getSelectionSmartBinding()
            : this;

        var sb = hasRefBinding && o.smartBinding || (jpf.isParsing 
            ? jpf.JmlParser.getFromSbStack(this.uniqueId, isSelection, true)
            : this.$propHandlers["smartbinding"].call(this, new jpf.SmartBinding()))
        
        //We don't want to change a shared smartbinding
        if (!hasRefBinding) {
            if (o.bindingRules)
                o.unloadBindings();
            o.bindingRules = {};
        }
        
        //Get or create bind rule
        var bindRule = (o.bindingRules[o.mainBind] ||
            (o.bindingRules[o.mainBind] 
                = [jpf.getXml("<" + (o.mainBind || "value") + " />")]))[0];
        
        //Check if the smartbinding has the rule (We assume all or nothing)
        ((sb.bindings || (sb.bindings = o.bindingRules))[o.mainBind])
            || (sb.bindings[o.mainBind] = [bindRule]);
        
        // Define model
        var model, modelId;
        if (!jpf.isParsing)
            model = o.getModel();
        
        if (!model) {
            modelId = o.lastModelId = 
                o.model || findModel(this.$jml, isSelection);
            
            //deprecated bindway: @todo test this!! with a model NOT a component (well that too)
    
            if (!modelId) {
                if (jpf.globalModel) {
                    //#ifdef __DEBUG
                    jpf.console.warn("Cannot find a model to connect to, will \
                                      try to use default model.");
                    //#endif
                    modelId = "@default";
                }
                //#ifdef __DEBUG
                else
                    throw new Error(jpf.formatErrorString(1062, this, "init", 
                        "Could not find model to get data from", o.$jml));
                //#endif
            }
        }
        
        /*
            We don't want to connect to the root, that would create a rush 
            of unnecessary update messages, so we'll find the element that's
            closest to the node that is gonna feed us the value
        */
        strBindRef.match(/^(.*?)((?:\@[\w-_\:]+|text\(\))(\[.*?\])?|[\w-_\:]+\[.*?\])?$/);
        var valuePath   = RegExp.$1;
        var valueSelect = RegExp.$2 || ".";
        
        if (valuePath === null) {
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(1063, this, 
                "Setting @ref", 
                "Could not find xpath to determine XMLRoot: " 
                + strBindRef, o.$jml));
            //#endif
            
            return;
        }
        
        if (modelId) {
            //Reconstructing modelId with new valuePath
            if (valuePath) {
                var modelIdParts = modelId.split(":", 3);
                
                modelId = modelIdParts.shift();
                if (modelId.indexOf("#") == 0) {
                    modelId += (modelIdParts[0] 
                        ? ":" + modelIdParts.shift() 
                        : ":select")
                }
                
                modelId += ":" + ((modelIdParts[0] ? modelIdParts[0] + "/" : "") 
                    + (valuePath || "."))
                    .replace(/\/$/, "")
                    .replace(/\/\/+/, "/");
            }
            
            if (jpf.isParsing)
                initModelId[isSelection] = modelId
            else 
                setModelQueue(modelId, isSelection);
        }
        else {
            var m = (o.lastModelId || "").split(":");
            var modelIdPart = ((m.shift().indexOf("#") == 0 
                &&  m.shift() && m.shift() || m.shift()) || "");

            model.$register(this, ((modelIdPart ? modelIdPart + "/" : "") 
                + (valuePath || "."))
                .replace(/\/$/, "")
                .replace(/\/\/+/, "/")); //Update model with new info
            
            //Add this item to the queue to reload
            sb.markForUpdate(this, "model");
        }
        
        bindRule.setAttribute("select", valueSelect);
    }
    //#endif
    
    var timer = [];
    function setModelQueue(modelId, isSelection){
        clearTimeout(timer[isSelection ? 1 : 0]);
        timer[isSelection ? 1 : 0] = setTimeout(function(){
            jpf.setModel(modelId, _self, isSelection);
        });
    }
    
    this.$propHandlers["model"] = function(value){
        if (!value) {
            this.clear();
            this.$model.unregister(this);
            this.$model = null;
            this.lastModelId = "";
            return;
        }

        this.lastModelId = value;
        
        if (!this.hasFeature(__MULTISELECT__)) {
            // #ifdef __WITH_INLINE_DATABINDING
            if (jpf.isParsing && this.$jml.getAttribute("ref")) //@todo setting attribute in script block will go wrong
                return; //Ref will take care of everything
    
            //We're changing the model, lets do it using the @ref way
            if (this.ref) {
                refModelPropSet.call(this, this.ref);
                return;
            }
            //#endif
        }
        
        if (jpf.isParsing)
            initModelId[0] = value;
        else
            setModelQueue(value, this.hasFeature(__MULTISELECT__));
    };
    
    // #ifdef __WITH_INLINE_DATABINDING
    var hasRefBinding;
    this.$propHandlers["ref"] = function(value){
        if (!value) {
            this.unloadBindings();
            hasRefBinding = false;
            return;
        }

        refModelPropSet.call(this, value);

        //if (isSelection && x.getAttribute("selectcaption"))
        //    strBind.push("/><caption select='", x.getAttribute("selectcaption"), "' "); //hack!
        
        hasRefBinding = value ? true : false;
    };
    //#endif
    
    // #ifdef __WITH_VIRTUALVIEWPORT
    this.$propHandlers["viewport"] = function(value){
        if (value != "virtual")
            return;
        
        this.inherit(jpf.VirtualViewport);
    };
    //#endif
};

/**
 * @constructor
 * @private
 */
jpf.StandardBinding = function(){
    if (!this.defaultValue) //@todo please use this in a sentence
        this.defaultValue = "";

    /**
     * Load XML into this component
     * @private
     */
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(XMLRoot, this);

        //Set Properties
        
        //#ifdef __WITH_PROPERTY_BINDINGS
        var lrule, rule;
        for (rule in this.bindingRules) {
            lrule = rule.toLowerCase();
            if (this.$supportedProperties.contains(lrule))
                this.setProperty(lrule, this.applyRuleSetOnNode(rule,
                    this.xmlRoot) || "", null, true); 
        }
        /* #else
        
        this.setProperty("value", this.applyRuleSetOnNode(this.mainBind, this.xmlRoot) || this.defaultValue, null, true);
        
        #endif */
        
        //Think should be set in the event by the Validation Class
        if (this.errBox && this.isValid())
            this.clearError(); 
    };

    /**
     * Set xml based properties of this component
     * @private
     */
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Clear this component if some ancestor has been detached
        if (action == "redo-remove") {
            var testNode = this.xmlRoot;
            while (testNode && testNode.nodeType != 9)
                testNode = testNode.parentNode;
                
            if (!testNode) {
                //Set Component in listening state untill data becomes available again.
                var model = this.getModel();
                
                //#ifdef __DEBUG
                if (!model)
                    throw new Error(jpf.formatErrorString(0, this, "Setting change notifier on component", "Component without a model is listening for changes", this.$jml));
                //#endif
                
                return model.loadInJmlNode(this, model.getXpathByJmlNode(this));
            }
        }
        
        //Action Tracker Support
        if (UndoObj)
            UndoObj.xmlNode = this.xmlRoot;

        //Set Properties
    
        //#ifdef __WITH_PROPERTY_BINDINGS
        var lrule, rule;
        for (rule in this.bindingRules) {
            lrule = rule.toLowerCase();
            if (this.$supportedProperties.contains(lrule)) {
                var value = this.applyRuleSetOnNode(rule, this.xmlRoot) || "";
                
                if (this[lrule] != value)
                    this.setProperty(lrule, value, null, true);
            }
        }
        /* #else

        var value = this.applyRuleSetOnNode(this.mainBind, this.xmlRoot) || this.defaultValue;
        if(this.selected != value) this.setProperty("value", value, null, true);
        
        #endif */
        
        //Think should be set in the event by the Validation Class
        if (this.errBox && this.isValid())
            this.clearError(); 
    };
    
    if (!this.clear) {
        this.clear = function(nomsg, do_event){
            this.documentId = this.xmlRoot = this.cacheID = null;
            
            if (this.$clear)
                this.$clear(nomsg, do_event);
        };
    }
};

//#ifdef __WITH_MULTISELECT
/**
 * @constructor
 * @private
 */
jpf.MultiselectBinding = function(){
    /**
     * @private
     * <j:traverse select="" sort="@blah" data-type={"string" | "number" | "date"} date-format="" sort-method="" order={"ascending" | "descending"} case-order={"upper-first" | "lower-first"} />
     *
     * <j:traverse select="group|contact" sort="self::group/@name|self::contact/screen/text()" order="ascending" case-order="upper-first" />
     * <j:traverse select="group|contact" sort="@date" date-format="DD-MM-YYYY" order="descending"/>
     * <j:traverse select="group|contact" sort-method="compare" />
     */
    this.parseTraverse = function (xmlNode){
        this.traverse = xmlNode.getAttribute("select");
        
        //#ifdef __WITH_SORTING
        this.$sort = xmlNode.getAttribute("sort") ? new jpf.Sort(xmlNode) : null;
        //#endif
    };
    
     //#ifdef __WITH_SORTING
    /**
     * Change the sorting order of this component
     *
     * @param  {struct}  struct  required  Struct specifying the new sort options
     * @see    jpf.Sort
     */
    this.resort = function(struct, clear){
        this.$sort.set(struct, clear);
        this.clearAllCache();
        
        //#ifdef __WITH_VIRTUALVIEWPORT
        /*if(this.hasFeature(__VIRTUALVIEWPORT__)){
            jpf.xmldb.clearVirtualDataset(this.xmlRoot);
            this.reload();
            
            return;
        }*/
        //#endif
        
        (function sortNodes(xmlNode, htmlParent) {
            var sNodes = this.$sort.apply(
                jpf.xmldb.getArrayFromNodelist(xmlNode.selectNodes(_self.traverse)));
            
            for (var i = 0; i < sNodes.length; i++) {
                if (_self.isTreeArch){
                    var htmlNode = jpf.xmldb.findHTMLNode(sNodes[i], _self);
                    
                    //#ifdef __DEBUG
                    if (!_self.$findContainer){
                        throw new Error(jpf.formatErrorString(_self, 
                            "Sorting Nodes", 
                            "This component does not \
                             implement this.$findContainer"));
                    }
                    //#endif
                    
                    var container = _self.$findContainer(htmlNode);

                    htmlParent.appendChild(htmlNode);
                    if (!jpf.xmldb.isChildOf(htmlNode, container, true))
                        htmlParent.appendChild(container);
                    
                    sortNodes(sNodes[i], container);
                }
                else
                    htmlParent.appendChild(jpf.xmldb.findHTMLNode(sNodes[i], _self));
            }
        })(this.xmlRoot, this.oInt);
    };
    
    this.toggleSortOrder = function(){
        this.resort({"ascending" : !this.$sort.get().ascending});
    };
    
    this.getSortSettings = function(){
        return this.$sort.get();
    };
    //#endif
    
    /**
     * Sets the bind rule that determines which data nodes are iterated.
     *
     * @param  {xpath}  str  required  Xpath specifying a selection of the current dataset
     * @see    SmartBinding
     */
    this.setTraverseRule = function(str){
        var tNode = this.bindingRules["traverse"][0];
        tNode.setAttribute("select", str);
        this.parseTraverse(tNode);
        this.reload();
    };
    
    /**
     * Gets a nodelist containing the data nodes which get representation in this component 
     * (also known as {@info TraverseNodes "Traverse Nodes"}).
     *
     * @param  {XMLNode}  xmlNode  optional  XML Node specifying the parent node on which the traverse Xpath query is executed.
     * @see    SmartBinding
     * @define  TraverseNodes  Traverse Nodes are data nodes selected using the j:Traverse bind rule and are looped through to create items which are represented within a databound JML component.
     */
    this.getTraverseNodes = function(xmlNode){
        //#ifdef __WITH_SORTING
        if (this.$sort) {
            var nodes = jpf.xmldb.getArrayFromNodelist((xmlNode || this.xmlRoot)
                .selectNodes(this.traverse));
            return this.$sort.apply(nodes);
        }
        //#endif
        
        return (xmlNode || this.xmlRoot).selectNodes(this.traverse);
    };
    
    /**
     * Gets the first data node which gets representation in this component 
     * (also known as {@info TraverseNodes "Traverse Node"}).
     *
     * @param  {XMLNode}  xmlNode  optional  XML Node specifying the parent node on which the traverse Xpath query is executed.
     * @return  {XMLNode}  the first data node
     * @see    SmartBinding
     */
    this.getFirstTraverseNode = function(xmlNode){
        //#ifdef __WITH_SORTING
        if (this.$sort) {
            var nodes = jpf.xmldb.getArrayFromNodelist((xmlNode || this.xmlRoot)
                .selectNodes(this.traverse));
            return this.$sort.apply(nodes)[0];
        }
        //#endif
        
        return (xmlNode || this.xmlRoot).selectSingleNode(this.traverse);
    };

    /**
     * Gets the last data node which gets representation in this component 
     * (also known as {@info TraverseNodes "Traverse Node"}).
     *
     * @param  {XMLNode}  xmlNode  optional  XML Node specifying the parent node on which the traverse Xpath query is executed.
     * @return  {XMLNode}  the last data node 
     * @see    SmartBinding
     */
    this.getLastTraverseNode = function(xmlNode){
        var nodes = this.getTraverseNodes(xmlNode || this.xmlRoot);//.selectNodes(this.traverse);
        return nodes[nodes.length-1];
    };

    /**
     * Determines wether an XML Node is a {@info TraverseNodes "Traverse Node"}
     *
     * @param  {XMLNode}  xmlNode  optional  XML Node specifying the parent node on which the traverse Xpath query is executed.
     * @return  {Boolean}  true   if the XML Node is a Traverse Node
     *                   false  otherwise.
     * @see  SmartBinding
     */
    this.isTraverseNode = function(xmlNode){
        /*
            Added optimization, only when an object has a tree architecture is it 
            important to go up to the traverse parent of the xmlNode, else the node 
            should always be based on the xmlroot of this component
        */
        var nodes = this.getTraverseNodes(this.isTreeArch
            ? this.getTraverseParent(xmlNode) || this.xmlRoot
            : this.xmlRoot);
        for (var i = 0; i < nodes.length; i++)
            if (nodes[i] == xmlNode)
                return true;
        return false;
    };

    /**
     * Gets the next {@info TraverseNodes "Traverse Node"} to be selected from a given
     * Traverse Node. The method can do this in either direction and also return the Nth
     * node for this algorithm.
     *
     * @param  {XMLNode}  xmlNode  required  XML Node specifying the starting point for determining the next selection.
     * @param  {Boolean}  up  optional  false  Boolean specifying the direction of the selection.
     * @param  {Integer}  count  optional  1   Integer specifying the distance in number of nodes.
     * @return  {XMLNode}  the data node to be selected next
     * @see  SmartBinding
     */
    this.getNextTraverseSelected = function(xmlNode, up, count){
        if (!xmlNode)
            var xmlNode = this.selected;
        if (!count)
            count = 1;

        var i = 0;
        var nodes = this.getTraverseNodes(this.getTraverseParent(xmlNode) || this.xmlRoot);//.selectNodes(this.traverse);
        while (nodes[i] && nodes[i] != xmlNode)
            i++;

        var node = (up == null)
            ? nodes[i + count] || nodes[i - count]
            : (up ? nodes[i + count] : nodes[i - count]);

        return node || arguments[2] && (i < count || (i + 1) > Math.floor(nodes.length / count) * count)
            ? node
            : (up ? nodes[nodes.length-1] : nodes[0]);
    };

    /**
     * Gets the next {@info TraverseNodes "Traverse Node"}.
     * The method can do this in either direction and also return the Nth next node.
     *
     * @param  {XMLNode}  xmlNode  required  XML Node specifying the starting point for determining the next node.
     * @param  {Boolean}  up  optional  false  Boolean specifying the direction.
     * @param  {Integer}  count  optional  1      Integer specifying the distance in number of nodes.
     * @return  {XMLNode}  the next Traverse Node
     * @see  SmartBinding
     */
    this.getNextTraverse = function(xmlNode, up, count){
        if (!count)
            count = 1;
        if (!xmlNode)
            xmlNode = this.selected;
        
        var i = 0;
        var nodes = this.getTraverseNodes(this.getTraverseParent(xmlNode) || this.xmlRoot);//.selectNodes(this.traverse);
        while (nodes[i] && nodes[i] != xmlNode)
            i++;
        
        return nodes[i + (up ? -1 * count : count)];
    };
    
    this.getPreviousTraverse = function(xmlNode){
        return this.getNextTraverse(xmlNode, true);
    };

    /**
     * Gets the parent {@info TraverseNodes "Traverse Node"}.
     * In some cases the traverse rules has a complex form like 'children/product'. 
     * In that case the data tree is not used for representation, but a more complex transition,
     * collapsing multiple levels into a single tree depth. For these situations the
     * xmlNode.parentNode property won't give you the Traverse Parent, but this method
     * will give you the right parent. 
     *
     * @param  {XMLNode}  xmlNode  required    XML Node for which the parent node will be determined.
     * @return  {XMLNode}  the parent node
     * @see  SmartBinding
     */
    this.getTraverseParent = function(xmlNode){
        if (!xmlNode.parentNode || xmlNode == this.xmlRoot) return false;
        
        var x, id = xmlNode.getAttribute(jpf.xmldb.xmlIdTag);
        if (!id) {
            //return false;
            xmlNode.setAttribute(jpf.xmldb.xmlIdTag, "temp");
            id = "temp";
        }

        /*
        do {
            xmlNode = xmlNode.parentNode;
            if (xmlNode == this.xmlRoot)
                return false;
            if (this.isTraverseNode(xmlNode))
                return xmlNode;
        } while (xmlNode.parentNode);
        */
        
        //This is not 100% correct, but good enough for now
        
        //temp untill I fixed the XPath implementation
        if (jpf.isSafari) {
            var y = this.traverse.split("\|");
            for (var i = 0; i < y.length; i++) {
                x = xmlNode.selectSingleNode("ancestor::node()[("
                    + y[i] + "/@" + jpf.xmldb.xmlIdTag + "='" + id + "')]");
                break;
            }
        } else {
            x = xmlNode.selectSingleNode("ancestor::node()[(("
                + this.traverse + ")/@" + jpf.xmldb.xmlIdTag + ")='"
                + id + "']");
        }
        
        if (id == "temp")
            xmlNode.removeAttribute(jpf.xmldb.xmlIdTag);
        return x;
    };
    
    /* ******** __LOAD ***********
        Set listeners, calls HTML creation methods and
        initializes select and focus states of object.

        INTERFACE:
        this.$load(XMLRoot);
    ****************************/
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(XMLRoot, this);

        var length = this.getTraverseNodes(XMLRoot).length;
        if (!this.renderRoot && !length)
            return this.clearAllTraverse();

        //Traverse through XMLTree
        var nodes = this.$addNodes(XMLRoot, null, null, this.renderRoot);

        //Build HTML
        this.$fill(nodes);

        //Select First Child
        if (this.selectable) {
            //#ifdef __WITH_OFFLINE_STATE
            var sel
            if (!this.firstLoad && jpf.offline.state.enabled && jpf.offline.state.realtime) {
                sel = jpf.offline.state.get(this, "selection");
                this.firstLoad = true;
            }
            
            if (sel) {
                var selstate = jpf.offline.state.get(this, "selstate");
                
                if (sel.length == 0) {
                    this.clearSelection();
                }
                else {
                    for (var i = 0; i < sel.length; i++) {
                        sel[i] = jpf.RemoteSmartBinding.xpathToXml(sel[i], 
                            this.xmlRoot);
                    }
                    
                    if (selstate[1]) {
                        var selected = jpf.RemoteSmartBinding
                            .xpathToXml(selstate[1], this.xmlRoot);
                    }
                    
                    this.selectList(sel, null, selected);
                }
                
                if (selstate[0]) {
                    this.setIndicator(jpf.RemoteSmartBinding
                        .xpathToXml(selstate[0], this.xmlRoot));
                }
            }
            else
            //#endif
            if (this.autoselect) {
                if (this.renderRoot)
                    this.select(XMLRoot);
                else if (nodes.length)
                    this.$selectDefault(XMLRoot);
                else
                    this.setConnections();
            }
            else {
                this.clearSelection(null, true);
                var xmlNode = this.renderRoot
                    ? this.xmlRoot
                    : this.getFirstTraverseNode(); //should this be moved to the clearSelection function?
                if (xmlNode)
                    this.setIndicator(xmlNode);
                this.setConnections(null, "both");
            }
        }
        
        if (this.focussable)
            jpf.window.hasFocus(this) ? this.$focus() : this.$blur();
        
        //#ifdef __WITH_PROPERTY_BINDING
        if (length != this.length)
            this.setProperty("length", length);
        //#endif
    };

    var selectTimer = {}, _self = this;
    var actionFeature = {
        "insert"      : 127,//1111111
        "add"         : 123,//1111011
        "remove"      : 47, //0101111
        "redo-remove" : 79, //1001111
        "synchronize" : 127,//1111111
        "move-away"   : 104,//1101000
        "move"        : 76  //1001100
    };

    /**
     * Loops through parents of changed node to find the first
     * connected node. Based on the action it will change, remove
     * or update the representation of the data.
     */
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj, lastParent){
        if (!this.xmlRoot)
            return; //@todo think about purging cache when xmlroot is removed
        
        var result, startNode = xmlNode;
        if (!listenNode)
            listenNode = this.xmlRoot;

		if (action == "redo-remove" && !this.isTraverseNode(xmlNode))
			xmlNode = lastParent;

        //Get First ParentNode connected
        do {
			if (action == "add" && this.isTraverseNode(xmlNode) 
			  && startNode == xmlNode)
                break; //@todo Might want to comment this out for adding nodes under a traversed node

            if (xmlNode.getAttribute(jpf.xmldb.xmlIdTag)) {
                var htmlNode = this.getNodeFromCache(
                    xmlNode.getAttribute(jpf.xmldb.xmlIdTag)
                    + "|" + this.uniqueId);

				if (htmlNode 
				  && (startNode != xmlNode || xmlNode == this.xmlRoot) 
				  && actionFeature[action] & 1)
				    action = "update";
                    
                if (xmlNode == listenNode) {
                    if (xmlNode == this.xmlRoot)
                        return;
                    break;
                }
                
				if (htmlNode && actionFeature[action] & 2 
				  && !this.isTraverseNode(xmlNode))
                    action = "remove"; //@todo why not break here?

				if (!htmlNode && actionFeature[action] & 4 
				  && this.isTraverseNode(xmlNode)){
                    action = "add";
                    break;
                }

                if (htmlNode  || action == "move")
                    break;
            }
			else if (actionFeature[action] & 8 && this.isTraverseNode(xmlNode)){
                action = "add";
                break;
            }
            
            if (xmlNode == listenNode) break;
            xmlNode = xmlNode.parentNode;
        }
        while(xmlNode && xmlNode.nodeType != 9);
        
        // #ifdef __WITH_VIRTUALVIEWPORT
        /**
         * @todo Think about not having this code here
         */
        if (this.hasFeature(__VIRTUALVIEWPORT__)) {
            if(!this.$isInViewport(xmlNode)) //xmlNode is a traversed node
                return;
        }
        // #endif

        //if(xmlNode == listenNode && !action.match(/add|synchronize|insert/))
        //    return; //deleting nodes in parentData of object

        var foundNode = xmlNode;
        if (xmlNode && xmlNode.nodeType == 9)
            xmlNode = startNode;
        
        if (action == "replacechild"
          && (UndoObj ? UndoObj.args[0] == this.xmlRoot : !this.xmlRoot.parentNode)) {
            return this.load(UndoObj ? UndoObj.args[1] : listenNode); //Highly doubtfull this is exactly right...
        }

        //Action Tracker Support - && xmlNode correct here??? - UndoObj.xmlNode works but fishy....
        if (UndoObj && xmlNode && !UndoObj.xmlNode)
            UndoObj.xmlNode = xmlNode;

        //Check Move -- if value node isn't the node that was moved then only perform a normal update
        if (action == "move" && foundNode == startNode) {
            //if(!htmlNode) alert(xmlNode.getAttribute("id")+"|"+this.uniqueId);
            var isInThis  = jpf.xmldb.isChildOf(this.xmlRoot, xmlNode.parentNode, true);
            var wasInThis = jpf.xmldb.isChildOf(this.xmlRoot, UndoObj.pNode, true);

            //Move if both previous and current position is within this object
            if (isInThis && wasInThis)
                this.$moveNode(xmlNode, htmlNode);
            else if (isInThis) //Add if only current position is within this object
                action = "add";
            else if (wasInThis) //Remove if only previous position is within this object
                action = "remove";
        }
        else if (action == "move-away") {
            var goesToThis = jpf.xmldb.isChildOf(this.xmlRoot, UndoObj.toPnode, true);
            if (!goesToThis)
                action = "remove";
        }
        
        //Remove loading message
        if (this.$removeClearMessage && this.$setClearMessage) {
            if (this.getFirstTraverseNode())
                this.$removeClearMessage();
            else
                this.$setClearMessage(this.emptyMsg, "empty")
        }

        //Check Insert
        if (action == "insert" && (this.isTreeArch || xmlNode == this.xmlRoot)) {
            if (this.hasLoadStatus(xmlNode) && this.$removeLoading)
                this.$removeLoading(htmlNode);
                
            result = this.$addNodes(xmlNode, (this.$getParentNode
                ? this.$getParentNode(htmlNode)
                : htmlNode), true, false);//this.isTreeArch??
                
            this.$fill(result);

            // #ifdef __DEBUG
            if (this.selectable && !this.xmlRoot.selectSingleNode(this.traverse))
                jpf.console.warn("No traversable nodes were found for " 
                                 + this.name + " [" + this.tagName + "]\n\
                                  Traverse Rule : " + this.traverse);
            // #endif
            if (this.selectable && !this.xmlRoot.selectSingleNode(this.traverse))
                return;
        }
        else if (action == "add") {// || !htmlNode (Check Add)
            //var parentHTMLNode = this.getCacheItemByHtmlId(xmlNode.getAttribute(jpf.xmldb.xmlIdTag)+"|"+this.uniqueId);
            //xmlNode.parentNode == this.xmlRoot ? this.oInt : 
            var parentHTMLNode = xmlNode.parentNode == this.xmlRoot
                ? this.oInt
                : this.getNodeFromCache(xmlNode.parentNode.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId); //This code should use getTraverseParent()
            
            //this.getCacheItem(xmlNode.parentNode.getAttribute(jpf.xmldb.xmlIdTag))
            
            //This should be moved into a function (used in setCache as well)
            if (!parentHTMLNode)
                parentHTMLNode = this.getCacheItem(xmlNode.parentNode.getAttribute(jpf.xmldb.xmlIdTag)
                    || (xmlNode.parentNode.getAttribute(jpf.xmldb.xmlDocTag)
                         ? "doc" + xmlNode.parentNode.getAttribute(jpf.xmldb.xmlDocTag)
                         : false))
                    || this.oInt; //This code should use getTraverseParent()

            //Only update if node is in current representation or in cache
            if (parentHTMLNode || jpf.xmldb.isChildOf(this.xmlRoot, xmlNode)) {
                parentHTMLNode = (this.$findContainer && parentHTMLNode
                    ? this.$findContainer(parentHTMLNode)
                    : parentHTMLNode) || this.oInt;

                result = this.$addNodes(xmlNode, parentHTMLNode, true, true, 
                    this.getNodeByXml(this.getNextTraverse(xmlNode)));

                if (parentHTMLNode)
                    this.$fill(result);
            }
        }
        else if ((action == "remove") && foundNode == xmlNode && xmlNode.parentNode) { //Check Remove
            //Remove HTML Node
            if (htmlNode)
                this.$deInitNode(xmlNode, htmlNode);
            else if (xmlNode == this.xmlRoot) {
                return this.load(null, null, null, 
                    !this.dataParent || !this.dataParent.autoselect);
            }
        }
        else if (htmlNode) {
            this.$updateNode(xmlNode, htmlNode);
            
            //Transaction 'niceties'
            if (action == "replacechild" && this.hasFeature(__MULTISELECT__)
              && this.selected && xmlNode.getAttribute(jpf.xmldb.xmlIdTag)
              == this.selected.getAttribute(jpf.xmldb.xmlIdTag)) {
                this.selected = xmlNode;
            }
            
            //if(action == "synchronize" && this.autoselect) this.reselect();
        }
        else if (action == "redo-remove") { //Check Remove of the data (some ancestor) that this component is bound on
            var testNode = this.xmlRoot;
            while (testNode && testNode.nodeType != 9)
                testNode = testNode.parentNode;
            
            if (!testNode) {
                //Set Component in listening state until data becomes available again.
                var model = this.getModel();
                
                //#ifdef __DEBUG
                if (!model)
                    throw new Error(jpf.formatErrorString(this, 
                        "Setting change notifier on componet", 
                        "Component without a model is listening for changes", 
                        this.$jml));
                //#endif
                
                return model.loadInJmlNode(this, model.getXpathByJmlNode(this));
            }
        }

        //For tree based nodes, update all the nodes up
        var pNode = xmlNode ? xmlNode.parentNode : lastParent;
        if (this.isTreeArch && pNode && pNode.nodeType == 1) {
            do {
                var htmlNode = this.getNodeFromCache(pNode.getAttribute(
                    jpf.xmldb.xmlIdTag) + "|" + this.uniqueId);
                    
                if (htmlNode)
                    this.$updateNode(pNode, htmlNode);
            }
            while ((pNode = this.getTraverseParent(pNode)) && pNode.nodeType == 1);
        }
        
        //Make sure the selection doesn't become corrupted
        if (actionFeature[action] & 32 && this.selectable 
          && startNode == xmlNode 
          && (action != "insert" || xmlNode == this.xmlRoot)) {

            clearTimeout(selectTimer.timer);
            // Determine next selection
            if (action == "remove" && xmlNode == this.selected 
              || xmlNode == selectTimer.nextNode)
                selectTimer.nextNode = this.getDefaultNext(xmlNode);
            
            //@todo Fix this by putting it after xmlUpdate when its using a timer
            selectTimer.timer = setTimeout(function(){
                _self.$checkSelection(selectTimer.nextNode);
            });
        }
        
        //#ifdef __WITH_PROPERTY_BINDING
        //Set dynamic properties that relate to the changed content
        if (actionFeature[action] & 64) {
            var l = this.xmlRoot.selectNodes(this.traverse).length;
            if (l != this.length)
                this.setProperty("length", l);
        }
        //#endif

        //Let's signal components that are waiting for xml to appear (@todo what about clearing the signalXmlUpdate)
        if (this.signalXmlUpdate && actionFeature[action] & 16) {
            var uniqueId;
            for (uniqueId in this.signalXmlUpdate) {
                if (parseInt(uniqueId) != uniqueId) continue; //safari_old stuff
                
                var o = jpf.lookup(uniqueId);
                if (!this.selected) continue;
                
                var xmlNode = this.selected.selectSingleNode(o.dataParent.xpath);
                if (!xmlNode) continue;
                
                o.load(xmlNode);
            }
        }

        this.dispatchEvent("xmlupdate", {
            action : action,
            xmlNode: xmlNode,
            result : result
        });
    };
    
    /* ******** __ADDNODES ***********
        Loop through NodeList of selected Traverse Nodes
        and check if it has representation. If it doesn't
        representation is created via __add().

        @todo:
        <Traverse select="" sort="@blah" data-type={"text" | "number" | "script"} method="" order={"ascending" | "descending"} case-order={"upper-first" | "lower-first"} />
        - Also: inserts (auto-sort) see e-messenger behaviour

        INTERFACE:
        this.$addNodes(xmlNode, HTMLParent, checkChildren);
    ****************************/
    this.$addNodes = function(xmlNode, parent, checkChildren, isChild, insertBefore){
        // #ifdef __DEBUG
        if (!this.traverse) {
            throw new Error(jpf.formatErrorString(1060, this, 
                "adding Nodes for load", 
                "No traverse SmartBinding rule was specified. This rule is \
                 required for a " + this.tagName + " component.", this.$jml));
        }
        // #endif

        var htmlNode, lastNode;
        var isChild      = (isChild && (this.renderRoot && xmlNode == this.xmlRoot
            || this.isTraverseNode(xmlNode)));
        var nodes        = isChild ? [xmlNode] : this.getTraverseNodes(xmlNode);//.selectNodes(this.traverse);
        var loadChildren = nodes.length && (this.bindingRules || {})["insert"]
            ? this.applyRuleSetOnNode("insert", xmlNode)
            : false;

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;

            if (checkChildren)
                htmlNode = this.getNodeFromCache(nodes[i].getAttribute(jpf.xmldb.xmlIdTag)
                    + "|" + this.uniqueId);

            if (!htmlNode) {
                //Retrieve DataBind ID
                var Lid = jpf.xmldb.nodeConnect(this.documentId, nodes[i], null, this);

                //Add Children
                var beforeNode = isChild ? insertBefore : (lastNode ? lastNode.nextSibling : null);//(parent || this.oInt).firstChild);
                var parentNode = this.$add(nodes[i], Lid, isChild ? xmlNode.parentNode : xmlNode,
                     beforeNode ? parent || this.oInt : parent, beforeNode,
                     !beforeNode && i==nodes.length-1);//Should use getTraverParent
                
                //Exit if component tells us its done with rendering
                if (parentNode === false) {
                    //Tag all needed xmlNodes for future reference
                    for (var i = i; i < nodes.length; i++)
                        jpf.xmldb.nodeConnect(this.documentId, nodes[i],
                            null, this);
                    break;
                }

                //Parse Children Recursively -> optimize: don't check children that can't exist
                //if(this.isTreeArch) this.$addNodes(nodes[i], parentNode, checkChildren);
            }

            if (checkChildren)
                lastNode = htmlNode;// ? htmlNode.parentNode.parentNode : null;
        }

        return nodes;
    };
    
    //Trigger Databinding Connections
    this.addEventListener("beforeselect", function(e){
        var combinedvalue = null;
        
        //#ifdef __WITH_MULTISELECT_BINDINGS
        if (this.indicator == this.selected || e.list && e.list.length > 1
          && this.getConnections().length) {
            //Multiselect databinding handling... [experimental]
            if (e.list && e.list.length > 1 && this.getConnections().length) {
                var oEl  = this.xmlRoot.ownerDocument.createElement(this.selected.tagName);
                var attr = {};
                
                //Fill basic nodes
                var nodes = e.list[0].attributes;
                for (var j = 0; j < nodes.length; j++)
                    attr[nodes[j].nodeName] = nodes[j].nodeValue;
                
                //Remove nodes
                for (var i = 1; i < e.list.length; i++) {
                    for (prop in attr) {
                        if (typeof attr[prop] != "string") continue;
                        
                        if (!e.list[i].getAttributeNode(prop))
                            attr[prop] = undefined;
                        else if(e.list[i].getAttribute(prop) != attr[prop])
                            attr[prop] = "";
                    }
                }
                
                //Set attributes
                for (prop in attr) {
                    if (typeof attr[prop] != "string") continue;
                    oEl.setAttribute(prop, attr[prop]);
                }
                
                //missing is childnodes... will implement later when needed...
                
                oEl.setAttribute(jpf.xmldb.xmlIdTag, this.uniqueId);
                jpf.MultiSelectServer.register(oEl.getAttribute(jpf.xmldb.xmlIdTag),
                    oEl, e.list, this);
                jpf.xmldb.addNodeListener(oEl, jpf.MultiSelectServer);
                
                combinedvalue = oEl;
            }
        }
        //#endif

        var jNode = this;
        setTimeout(function(){
            jNode.setConnections(combinedvalue || jNode.selected);
        }, 10);
    });
    
    this.addEventListener("afterdeselect", function(){
        var _self = this;
        setTimeout(function(){
            _self.setConnections(null);
        }, 10);
    });
    
    /**
     * @private
     *
     * @allowchild  item, choices
     * @define  item 
     * @attribute  value  
     * @attribute  icon  
     * @attribute  image  
     * @allowchild  [cdata], label
     * @define  choices 
     * @allowchild  item
     */
    this.loadInlineData = function(x){
        if (!$xmlns(x, "item", jpf.ns.jpf).length)
            return jpf.JmlParser.parseChildren(x, null, this);
        
        //#ifdef __WITH_XFORMS
        var parent = $xmlns(x, "choices", jpf.ns.jpf)[0] || x;
        /* #else
        var parent = x;
        #endif */

        var prefix = jpf.findPrefix(x, jpf.ns.jpf);
            
        this.icon     = "@icon";
        this.image    = "@image";
        this.caption  = "label/text()|text()|@caption";
        this.value    = "value/text()|@value|text()";
        this.traverse = prefix + ":item";
        
        this.load(x);
    };
    
    var timer;
    this.$handleBindingRule = function(value, f, prop){
        if (!value)
            this[prop] = null;
        
        if (this.xmlRoot && !timer && !jpf.isParsing) {
            timer = setTimeout(function(){
                _self.reload();
                timer = null;
            });
        }
    };
    
    // #ifdef __WITH_INLINE_DATABINDING
    this.$propHandlers["traverse"] = 
    this.$propHandlers["css"]      = 
    this.$propHandlers["caption"]  = 
    this.$propHandlers["icon"]     = 
    this.$propHandlers["title"]    = 
    this.$propHandlers["select"]   = this.$handleBindingRule;
    //#endif
};
// #endif

// #endif
