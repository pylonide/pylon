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

var __DATABINDING__ = 1 << 1;

// #ifdef __WITH_DATABINDING

/**
 * Baseclass adding databinding features to this element. Databinding takes
 * care of automatically going from data to representation and establishing a
 * permanent link between the two. In this way data that is changed will
 * change the representation as well. Furthermore, actions that are executed on
 * the representation will change the underlying data.
 * Example:
 * <code>
 *  <j:list>
 *      <j:bindings>
 *          <j:icon select="@icon" />
 *          <j:caption select="text()" />
 *          <j:traverse select="item" />
 *      </j:bindings>
 *  </j:list>
 * </code>
 *
 * @event error             Fires when a communication error has occured while making a request for this element.
 *   cancellable: Prevents the error from being thrown.
 *   bubbles:
 *   object:
 *   {Error}          error     the error object that is thrown when the event callback doesn't return false.
 *   {Number}         state     the state of the call
 *     Possible values:
 *     jpf.SUCCESS  the request was successfull
 *     jpf.TIMEOUT  the request has timed out.
 *     jpf.ERROR    an error has occurred while making the request.
 *     jpf.OFFLINE  the request was made while the application was offline.
 *   {mixed}          userdata  data that the caller wanted to be available in the callback of the http request.
 *   {XMLHttpRequest} http      the object that executed the actual http request.
 *   {String}         url       the url that was requested.
 *   {Http}           tpModule  the teleport module that is making the request.
 *   {Number}         id        the id of the request.
 *   {String}         message   the error message.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 * @default_private
 */
jpf.DataBinding = function(){
    var loadqueue;
    var cXmlOnLoad = [];
    var cXmlSelect = [];
    var cXmlChoice = [];

    this.$regbase  = this.$regbase | __DATABINDING__;
    this.mainBind  = "value";
    var _self      = this;

    /**** Public Methods ****/

    /**
     * Gets the xpath statement from the primary bind rule. Each databound
     * element which does not implement jpf.MultiSelect has a primary bind rule.
     * This method gets the xpath statement in the select attribute of this rule.
     *
     * @return  {String}  the xpath statement
     * @see  element.smartbinding
     * @private
     */
    this.getMainBindXpath = function(){
        if (this.hasFeature(__MULTIBINDING__))
            return this.$getMultiBind().getMainBindXpath();
        var m = this.getModel(true);
        return (m && m.connect
            ? m.connect.select + "/"
            : (this.dataParent
                ? this.dataParent.xpath + "/"
                : "")) + this.smartBinding.bindings[this.mainBind][0].getAttribute("select");
    };

    /**
     * Checks whether this element is completely bound.
     *
     * @return  {Boolean}
     * @private
     */
    this.isBoundComplete = function(){
        if (!this.smartBinding) return true;
        if (!this.xmlRoot) return false;

        if (this.hasFeature(__MULTIBINDING__) && !this.$getMultiBind().xmlRoot)
            return false;
        return true;
    };

    /**
     * Queries the bound data for a string value
     *
     * @param {String} xpath  the xpath statement which queries on the data this element is bound on.
     * @return {String} value of the selected XML Node
     * @todo
     *  lstRev.query('revision/text()', 'selected');
     *  lstRev.query('revision/text()', 'xmlRoot');
     *  lstRev.query('revision/text()', 'indicator');
     */
    this.queryValue = function(xpath, type){
        return jpf.getXmlValue(this[type || 'xmlRoot'], xpath );
    };
	/**
     * Queries the bound data for an array of string values
     *
     * @param {String} xpath the xpath statement which queries on the data this element is bound on.
     * @return {String} value of the selected XML Node
     */
    this.queryValues = function(xpath, type){
        return jpf.getXmlValues(this[type || 'xmlRoot'], xpath );
    };
	
    /**
     * Executes an xpath statement on the data of this model
     *
     * @param  {String}   xpath    the xpath used to select the XMLNode(s).
     * @return  {variant}  XMLNode or NodeList with the result of the selection
     */
    this.queryNode = function(xpath, type){
        var n = this[type||'xmlRoot'];
		return n?n.selectSingleNode(xpath):null;
    };

    /**
     * Executes an xpath statement on the data of this model
     *
     * @param  {String}   xpath    the xpath used to select the XMLNode(s).
     * @return  {variant}  XMLNode or NodeList with the result of the selection
     */
    this.queryNodes = function(xpath, type){
        var n = this[type||'xmlRoot'];
		return n?n.selectNodes(xpath):null;
    };
	
    /**
     * Loads the binding rules from the j:bindings element
     *
     * @param {Array}   rules     the rules array created using {@link core.jpf.method.getrules}
     * @param {XMLElement} [xmlNode] the reference to the j:bindings xml element
     * @see  element.smartbinding
     * @private
     */
    this.loadBindings = function(rules, node){
        if (this.bindingRules)
            this.unloadBindings();
        this.bindingRules = rules;

        //#ifdef __DEBUG
        jpf.console.info("Initializing Bindings for " + this.tagName + "[" + (this.name || '') + "]");
        //#endif

        if (this.$loaddatabinding)
            this.$loaddatabinding();

        if (this.bindingRules["traverse"])
            this.parseTraverse(this.bindingRules["traverse"][0]);

        this.$checkLoadQueue();
    };

    this.$checkLoadQueue = function(){
        // Load from queued load request
        if (loadqueue) {
            var q = this.load(loadqueue[0], loadqueue[1]);
            if (!q || q.dataType != "array" || q != loadqueue)
                loadqueue = null;
        }
    };

    /**
     * Unloads the binding rules from this element
     *
     * @see  element.smartbinding
     * @private
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
     * @param {Array}       rules     the rules array created using {@link core.jpf.method.getrules}
     * @param {XMLElement}  [xmlNode] the reference to the j:bindings element
     * @see  element.smartbinding
     * @private
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
        //#ifdef __WITH_TRANSACTION
        if (node && (jpf.isTrue(node.getAttribute("transaction"))
          || node.selectSingleNode("add|update"))){
            if (!this.hasFeature(__TRANSACTION__))
                this.implement(jpf.Transaction); /** @inherits jpf.Transaction */

            //Load ActionTracker & xmldb
            if (!this.$at)
                this.$at = new jpf.actiontracker(this);

            this.$at.realtime = isTrue(node.getAttribute("realtime"));
            this.defaultMode  = node.getAttribute("mode") || "update";

            //Turn caching off, it collides with rendering views on copies of data with the same id's
            this.caching      = false;
        }
        //#endif
    };

    /**
     * Gets the ActionTracker this element communicates with.
     *
     * @return {ActionTracker}
     * @see  element.smartbinding
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
     * Unloads the action rules from this element
     *
     * @see  element.smartbinding
     * @private
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
                    Message : ActionTracker still has undo stack filled with "
                    + this.$at.undolength + " items.");
            // #endif

            this.$at = null;
        }
    };

    //#ifdef __WITH_LOCKING
    var lock    = {};
    //#endif
    var actions = {};

    /**
     * @term locking {@link http://en.wikipedia.org/wiki/Lock_(computer_science) A lock} 
     * is a mechanism for enforcing limits on access to a resource in a 
     * multi-user environment. Locks are one way of enforcing concurrency 
     * control policies. Javeline Platform (jpf) has support for locking in 
     * combination with {@link term.action action rules}. There are two 
     * types of locks; pessimistic and optimistic locks. Descriptions below is
     * from {@link http://en.wikipedia.org/wiki/Lock_(computer_science) wikipedia}. 
     *
     * Optimistic:
     * This allows multiple concurrent users access to the database whilst the 
     * system keeps a copy of the initial-read made by each user. When a user 
     * wants to update a record, the application determines whether another user 
     * has changed the record since it was last read. The application does this 
     * by comparing the initial-read held in memory to the database record to 
     * verify any changes made to the record. Any discrepancies between the 
     * initial-read and the database record violates concurrency rules and hence 
     * causes the system to disregard any update request. An error message is 
     * generated and the user is asked to start the update process again. 
     * It improves database performance by reducing the amount of locking 
     * required, thereby reducing the load on the database server. It works 
     * efficiently with tables that require limited updates since no users are 
     * locked out. However, some updates may fail. The downside is constant 
     * update failures due to high volumes of update requests from multiple 
     * concurrent users - it can be frustrating for users.
     *
     * For optimistic locking jpf can run as if there would be no locking. 
     * Changed data is send to the server and is either successfully saved or
     * not. When the action isn't changed and the server returns an error code
     * the {@link element.actiontracker actiontracker} <strong>automatically 
     * reverts the change</strong>. 
     *
     * Pessimistic:
     * This is whereby a user who reads a record with the intention of updating 
     * it, places an exclusive lock on the record to prevent other users from 
     * manipulating it. This means no one else can manipulate that record until 
     * the user releases the lock. The downside is that users can be locked out 
     * for a long time thereby causing frustration. 
     * 
     * For pessimistic locking add the locking attribute to the {@link term.action action rules}
     * that need it. The following example shows a lock request for a rename
     * action on a file browser tree.
     * <code>
     *  <j:rename set="..." lock="rpc:comm.lockFile({@path}, unlock)" />
     * </code>
     * The unlock variable is true when the lock needs to be released. This is
     * done when the action was cancelled after getting a lock. For instance
     * when the user presses escape while renaming.
     *
     * MultiUser:
     * In multi user environments it can be handy
     * to be signalled of changes by others within the application. For more 
     * information on this please look at {@link element.remote}.
     *
     * Remarks:
     * During offline works pessimistic locks will always fail. If the application
     * does not use {@link element.remote remote smart bindings} the developer
     * should reload the part of the content for which the lock failed. See
     * {@link baseclass.databinding.event.lockfailed}.
     *
     * Note: JFF understands the status codes specified in RFC4918 for the locking implementation
     *       {@link http://tools.ietf.org/html/rfc4918#section-9.10.6}
     */
     
    /**
     *  Start the specified action, does optional locking and can be offline aware
     *  - or for optimistic locking it will record the timestamp (a setting <j:appsettings locking="optimistic")
     *  - During offline work, optimistic locks will be handled by taking the timestamp of going offline
     *  - This method is always optional! The server should not expect locking to exist.
     *
     * @event locksuccess   Fires when a lock request succeeds
     *   bubbles: yes
     *   object:
     *     {Number} state    the return code of the lock request
     * @event lockfailed    Fires when a lock request failes
     *   bubbles: yes
     *   object:
     *     {Number} state    the return code of the lock request
     * @event unlocksuccess Fires when an unlock request succeeds
     *   bubbles: yes
     *   object:
     *     {Number} state    the return code of the unlock request
     * @event unlockfailed  Fires when an unlock request fails
     *   bubbles: yes
     *   object:
     *     {Number} state    the return code of the unlock request
     */
    this.$startAction = function(name, xmlContext, fRollback){
        if (this.disabled)
            return false;

        var actionRule = this.getNodeFromRule(name, xmlContext, true);
        if (jpf.appsettings.autoDisableActions && !this.actionRules 
          || this.actionRules && !actionRule) {
            //#ifdef __DEBUG
            if (!xmlContext) {
                jpf.console.warn("Tried starting new action but no xml \
                    context was specified.");
            }
            else {
                jpf.console.warn("Tried starting new action but no '" + name 
                    + "' action rule was found.");
            }
            //#endif
            
            return false;
        }

        var bHasOffline = typeof jpf.offline != "undefined";
        //#ifdef __WITH_OFFLINE
        if (bHasOffline && !jpf.offline.canTransact())
            return false;
        //#endif

        if (this.dispatchEvent(name + "start", {
            xmlContext: xmlContext
        }) === false)
            return false;

        //#ifdef __WITH_LOCKING

        //Requesting a lock, whilst we still have one open
        if (lock[name] && !lock[name].stopped) {
            //#ifdef __DEBUG
            jpf.console.warn("Starting new action whilst previous \
                action wasn't terminated:" + name);
            //#endif

            this.$stopAction(); //or should we call: fRollback.call(this, xmlContext);
        }

        //Check if we should attain a lock (when offline, we just pretend to get it)
        var lockInstruction = actionRule ? actionRule.getAttribute("lock") : null;
        if ((bHasOffline && (!jpf.offline.enabled || !jpf.offline.onLine)) && lockInstruction) {
            var curLock = lock[name] = {
                start      : bHasOffline && !jpf.offline.onLine
                                ? jpf.offline.offlineTime
                                : new Date().getTime(),
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
     * Executes an action using action rules set in the {@link element.actions actions element}.
     *
     * @param {String}      atAction      the name of the action to be performed by the ActionTracker.
     *   Possible values:
     *   setTextNode        sets the first text node of an xml element. {@link core.xmldb.method.setTextNode}
     *   setAttribute       sets the attribute of an xml element. {@link core.xmldb.method.setAttribute}
     *   removeAttribute    removes an attribute from an xml element. {@link core.xmldb.method.removeAttribute}
     *   setAttributes      sets multiple attribute on an xml element. Arguments are [xmlNode, Array]
     *   replaceNode        replaces an xml child with another one. {@link core.xmldb.method.replaceNode}
     *   addChildNode       adds a new xml node to a parent node. {@link core.xmldb.method.addChildNode}
     *   appendChild        appends an xml node to a parent node. {@link core.xmldb.method.appendChild}
     *   moveNode           moves an xml node from one parent to another. {@link core.xmldb.method.moveNode}
     *   removeNode         removes a node from it's parent. {@link core.xmldb.method.removeNode}
     *   removeNodeList     removes multiple nodes from their parent. {@link core.xmldb.method.removeNodeList}
     *   setValueByXpath    sets the nodeValue of an xml node whiche is selected by an xpath statement. Arguments are [xmlNode, xpath, value]
     *   multicall          calls multiple of these actions. Arguments is an array of argument arrays for these actions each with a func property which is the name of the action.
     * @param {Array}       args          the arguments to the function specified in <code>atAction</code>.
     * @param {String}      action        the name of the action rule defined in j:actions for this element.
     * @param {XMLElement}  xmlNode       the context for the action rules.
     * @param {Boolean}     [noevent]     whether or not to call events.
     * @param {XMLElement}  [contextNode] the context node for action processing (such as RPC calls). Usually the same as <code>xmlNode</code>
     * @return {Boolean} specifies success or failure
     * @see  element.smartbinding
     * @private
     */
    this.executeAction = function(atAction, args, action, xmlNode, noevent, contextNode, multiple){
        if (this.disabled) return; //hack

        //#ifdef __DEBUG
        jpf.console.info("Executing action '" + action + "' for " + this.name
                         + " [" + (this.tagName || "") + "]");
        //#endif

        //#ifdef __WITH_OFFLINE
        if(typeof jpf.offline != "undefined" && !jpf.offline.canTransact())
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

                var ev = new jpf.Event("before" + action.toLowerCase(), {
                    action        : atAction,
                    args          : args,
                    xmlActionNode : rules[i],
                    jmlNode       : this,
                    selNode       : contextNode,
                    multiple      : multiple || false
                    //#ifdef __WITH_LOCKING
                    ,timestamp    : curLock
                                      ? curLock.start
                                      : new Date().getTime()
                    //#endif
                });

                //Call Event and cancel if it returns false
                if (!noevent) {
                    //Allow the action and arguments to be changed by the event
                    if (this.dispatchEvent(ev.name, null, ev) === false)
                        return false;
                }

                //Call ActionTracker and return ID of Action in Tracker
                var UndoObj = this.getActionTracker().execute(ev);
                ev.xmlNode = UndoObj.xmlNode;
                ev.undoObj = UndoObj;

                //Call After Event
                if (!noevent) {
                    ev.name         = "after" + action.toLowerCase();
                    ev.cancelBubble = false;
                    delete ev.returnValue;
                    this.dispatchEvent(ev.name, null, ev);
                }

                return UndoObj;
            }
        }

        //Action not executed
        return false;
    };

    /**
     * Executes an action based on the set name and the new value
     * @param {String}      atName   the name of the action rule defined in j:actions for this element.
     * @param {String}      setName  the name of the binding rule defined in j:bindings for this element.
     * @param {XMLElement}  xmlNode  the xml element to which the rules are applied
     * @param {String}      value    the new value of the node
     * @private
     */
    this.executeActionByRuleSet = function(atName, setName, xmlNode, value){
        var xpath, args, selInfo = this.getSelectFromRule(setName, xmlNode);
        var shouldLoad = false, atAction, node = selInfo[1];

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
            if (!this.createModel)
                return false;

            atAction = "setValueByXpath";
            xpath    = selInfo[0];

            if (!xmlNode) {
                //Assuming this component is connnected to a model
                var model   = this.getModel();
                if (model) {
                    if (model.connect) {
                        xmlNode = model.connect.node.selected || model.connect.node.xmlRoot;
                        xpath = (model.connect.select || ".")
                            + (xpath && xpath != "." ? "/" + xpath : "");
                        shouldLoad = true;
                    }
                    else {
                        if (!model.data)
                            model.load("<data />");
        
                        xpath   = (model.getXpathByJmlNode(this) || ".")
                            + (xpath && xpath != "." ? "/" + xpath : "");
                        xmlNode = model.data;
                    }
                }
                else {
                    if (!this.dataParent)
                        return false;

                    xmlNode = this.dataParent.parent.selected || this.dataParent.parent.xmlRoot;
                    if (!xmlNode)
                        return false;
                    
                    xpath = (this.dataParent.xpath || ".")
                        + (xpath && xpath != "." ? "/" + xpath : "");
                    shouldLoad = true;
                }
            }

            args = [xmlNode, value, xpath];
        }

        //Use Action Tracker
        this.executeAction(atAction, args, atName, xmlNode);
        
        if (shouldLoad)
            this.load(xmlNode.selectSingleNode(xpath));
    };

    /**
     * Connects another element to this element. This connection is used
     * to push data from this element to the other element. Whenever this
     * element loads data, (a selection of) the data is pushed to the other
     * element. For elements inheriting from MultiSelect data is pushed
     * when a selection occurs.
     * Example:
     * This is how it's achieved using the javeline markup language.
     * <code>
     *  <j:list id="lstExample" />
     *  <j:text model="#lstExample:select" />
     * </code>
     *
     * @param {JmlNode} oElement  JmlNode specifying the element which is connected to this element.
     * @param {Boolean} [dataOnly]
     *   Possible values:
     *   true   data is sent only once.
     *   false  real connection is made.
     * @param {String}  [xpath]     the Xpath statement used to select a subset of the data to sent.
     * @param {String}  [type]
     *   Possible values:
     *   select  sents data when a node is selected
     *   choice  sents data when a node is chosen (by double clicking, or pressing enter)
     * @see  element.smartbinding
     * @see  baseclass.databinding.method.disconnect
     * @private
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
                throw new Error(jpf.formatErrorString(1056, null, 
                    "Connecting", 
                    "Illegal XPATH statement specified: '" + xpath + "'"));
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
                if (o.disable && o.createModel)
                    o.setProperty("disabled", true);
            }
        }
    };

    /**
     * Disconnects a previously established connection with another element.
     *
     * @param {JmlNode} oElement  the element to be disconnected from this element.
     * @param {String}  [type]
     *   Possible values:
     *   select  disconnects the select connection
     *   choice  disconnects the choice connection
     * @see  element.smartbinding
     * @see  baseclass.databinding.method.connect
     * @private
     */
    this.disconnect = function(o, type){
        //User action - Select || Choice
        var ar = (!type || type == "select") ? cXmlSelect : cXmlChoice; //This should be both when there is no arg set

        if (this.signalXmlUpdate) {
            this.signalXmlUpdate[o.uniqueId] = null;
            delete this.signalXmlUpdate[o.uniqueId];
        }
        
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
     * Pushes data to connected elements
     *
     * @param {XMLElement}  xmlNode  the {@link term.datanode data node} to be pushed to the connected elements.
     * @param {String}      [type]
     *   Possible Values:
     *   select  pushes data to the elements registered for selection
     *   choice  pushes data to the elements registered for choice
     * @see  element.smartbinding
     * @see  baseclass.databinding.method.connect
     * @see  baseclass.databinding.method.disconnect
     * @private
     */
    this.setConnections = function(xmlNode, type){
        var a = type == "both"
            ? cXmlChoice.concat(cXmlSelect)
            : (type == "choice" ? cXmlChoice : cXmlSelect);

        //Call Load of objects
        for (var x, o, i = 0; i < a.length; i++) {
            o     = a[i].o;
            xpath = a[i].xpath;
            o.load((xpath && xmlNode)
                ? xmlNode.selectSingleNode(xpath)
                : xmlNode);
            if (xmlNode && o.disabled && o.createModel)
                o.setProperty("disabled", false);
        }

        //Set Onload Connections only Once
        if (!cXmlOnLoad) return;

        for (var i = 0; i < cXmlOnLoad.length; i++)
            cXmlOnLoad[i][0].load(cXmlOnLoad[i][1]
                ? this.xmlRoot.selectSingleNode(cXmlOnLoad[i][1])
                : this.selected);//(this.selected || this.xmlRoot)

        cXmlOnLoad = null;
    };

    /**
     * @private
     */
    this.importConnections = function(x){
        cXmlSelect = x;
    };

    /**
     * @private
     */
    this.getConnections = function(){
        return cXmlSelect;
    };

    /**
     * @private
     */
    this.removeConnections = function(){
        cXmlSelect = [];
    };

    /**
     * Uses bind rules to convert data into a value string
     *
     * @param {String}      setname  the name of the binding rule set.
     * @param {XMLElement}  cnode    the xml element to which the binding rules are applied.
     * @param {String}      [def]    the default (fallback) value for the query.
     * @return  {String} the calculated value
     * @see  element.smartbinding
     */
    this.applyRuleSetOnNode = function(setname, cnode, def){
        if (!cnode) return "";

        var returnValue;

        //Get Rules from Array
        var rules = typeof setname == "string"
            ? (this.bindingRules || {})[setname]
            : setname;

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
            if (setname == "value") setname = "valuerule";
            returnValue = typeof this[setname] == "string" && setname != "value"
                    && jpf.getXmlValue(cnode, this[setname])
                    || def && cnode.selectSingleNode(def) || false;
            /* #else
            returnValue = def && cnode.selectSingleNode(def) || false;
            #endif */
            
            //#ifdef __WITH_MULTI_LANG_BINDING
            //@todo speed optimize
            if (typeof returnValue == "string") {
                var keys = jpf.language.getBinding(this, this.cacheID);
                returnValue = returnValue.replace(/\$([\w\.]+)\$/g, function(m, m1){
                    keys[m1] = true;
                    return jpf.language.getWord(m1);
                });
            }
            //#endif
            
            return returnValue;
        }
        
        var node = null, sel, i, o, v, rule;
        for (i = 0; i < rules.length; i++) {
            rule = rules[i];
            sel  = jpf.parseExpression(rule.getAttribute("select")) || ".";
            o    = cnode.selectSingleNode(sel);
            
            if (o) {
                this.lastRule = rule;

                if (v = rule.getAttribute("value")){ //Check for Default Value
                    returnValue = v;
                    break;
                }

                //#ifdef (__ENABLE_BINDING_JSLT || __ENABLE_BINDING_XSLT) && (__PARSER_XSLT || __PARSER_JSLT)
                //Process XSLT/JSLT Stylesheet if needed
                else if(rule.childNodes.length && (rule.childNodes.length != 1 || rule.childNodes[0].nodeValue.trim() != "")) {
                    var xsltNode;

                    //Check Cache
                    if (v = rule.getAttribute("cacheId")) {
                        xsltNode = jpf.nameserver.get("xslt", v);
                    }
                    else {
                        //Find Xslt Node
                        var prefix = jpf.findPrefix(rule, jpf.ns.xslt);
                        var xsltNode;

                        if (rule.getElementsByTagNameNS) {
                            xsltNode = rule.getElementsByTagNameNS(jpf.ns.xslt, "*")[0];
                        }
                        else {
                            var prefix = jpf.findPrefix(rule, jpf.ns.xslt, true);
                            if (prefix) {
                                if (!jpf.supportNamespaces)
                                    rule.ownerDocument.setProperty("SelectionNamespaces", "xmlns:"
                                        + prefix + "='" + jpf.ns.xslt + "'");
                                xsltNode = rule.selectSingleNode(prefix + ":*");
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
                                for (var j = rule.childNodes.length; j >= 0; j++)
                                    xsltNode.firstChild.appendChild(rule.childNodes[j]);

                                //Set cache Item
                                rule.setAttribute("cacheId",
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
                        var x = jpf.JsltInstance.apply(rule, o);

                        //#ifdef __DEBUG
                        var d = document.createElement("div");
                        var t = window.onerror;
                        window.onerror = function(){
                            window.onerror = t;
                            throw new Error(jpf.formatErrorString(0, this, "JSLT transform", "HTML Error:"+x,rule));
                        }
                        d.innerHTML    = x;
                        d.innerHTML    = '';
                        window.onerror = t;
                        //#endif
                    }

                    //#ifdef __DEBUG
                    if (v = rule.getAttribute("method")) {
                        try{
                            eval(v);
                        }
                        catch(e) {
                            jpf.console.warn("Method not available (yet): '" + v + "'");
                            return false;
                        }
                    }
                    //#endif

                    returnValue = rule.getAttribute("method") ? self[rule.getAttribute("method")](x, this) : x;
                    break;
                }
                // #endif

                //#ifdef __ENABLE_BINDING_METHOD
                //Execute Callback if any
                else if(v = rule.getAttribute("method")){
                    if(!self[v]){
                        // #ifdef __DEBUG
                        jpf.console.warn("Method not available (yet): '" + v + "'");
                        // #endif

                        return false;
                    }

                    returnValue = self[v](o, this);
                    break;
                }
                //#endif
                //#ifdef __ENABLE_BINDING_EVAL
                //Execute Expression
                else if(v = rule.getAttribute("eval")){
                    var func = new Function('xmlNode', 'control', "return " + v);

                    var value = func.call(this, o, this);
                    if (!value) continue;

                    returnValue = value;
                    break;
                }
                //#endif
                //Process XMLElement
                else {
                    var value;
                    if (o.nodeType == 2) {
                        try {
                            value = unescape(decodeURI(o.nodeValue));
                        }
                        catch(e) {
                            value = unescape(o.nodeValue);
                        }
                    }
                    else {
                        if (o.nodeType == 1) {
                            if (!o.firstChild || o.firstChild.nodeType == 1 || o.firstChild.nodeType > 4)
                                return "";
    
                            value = o.firstChild.nodeValue;
                        }
                        else                        
                            value = o.nodeValue;
                    }

                    //Mask Support
                    //#ifdef __ENABLE_BINDING_MASKS
                    if (v = rule.getAttribute("mask")) {
                        if (value.match(/^(?:true|false)$/))
                            value = value == "true" ? 1 : 0;
                        
                        returnValue = v.split(";")[value];
                        break;
                    }
                    else
                    //#endif
                    {
                        returnValue = value;
                        break;
                    }
                }
            }
        }
        
        if (returnValue) {
            //#ifdef __WITH_MULTI_LANG_BINDING
            //@todo speed optimize
            var keys = jpf.language.getBinding(this, this.cacheID);
            returnValue = returnValue.replace(/\$([\w\.]+)\$/g, function(m, m1){
                keys[m1] = true;
                return jpf.language.getWord(m1);
            });
            //#endif
            
            return returnValue;
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
     * Assigns a smartbinding definition to this element
     *
     * @param {mixed} sb
     *   Possible values:
     *   {SmartBinding}  object to be assigned to this element.
     *   {String}        the name of the SmartBinding.
     * @throws  Error  If no SmartBinding was passed to the method.
     * @see  element.smartbinding
     */
    this.setSmartBinding = function(sb){
        this.$propHandlers["smartbinding"].call(this, sb);
        /*
            this.setProperty && this.setProperty("smartbinding", sb)
            ||
        */
    };

    /**
     * Removes the smartbinding from this element
     *
     * @see  element.smartbinding
     */
    this.removeSmartBinding = function(){
        this.setProperty("smartbinding", null);
    };

    /**
     * Gets the smartbinding of this element
     *
     * @returns  {SmartBinding}  The SmartBinding object of this element
     * @see  element.smartbinding
     */
    this.getSmartBinding = function(){
        return this.smartBinding;
    };

    /**
     * Gets the model to which this element is connected.
     * This is the model which acts as a datasource for this element.
     *
     * @param {Boolean} doRecur whether the model should be searched recursively up the data tree.
     * @returns  {Model}  The model this element is connected to.
     * @see  element.smartbinding
     */
    this.getModel = function(doRecur){
        if(doRecur && !this.$model)
            return this.dataParent ? this.dataParent.parent.getModel(true) : null;

        return this.$model;
    };

    /**
     * Sets the model to which this element is connected.
     * This is the model which acts as datasource for this element.
     *
     * @param {Model}  model   the model this element will be connected to.
     * @param {String} [xpath] the xpath statement used to query a subset of the data presented by the model.
     * @see  element.smartbinding
     */
    this.setModel = function(model, xpath){
        if (this.$model)
            this.$model.unregister(this);
        
        if (typeof model == "string")
            model = jpf.nameserver.get("model", model);

        this.$model = model;
        model.register(this, xpath);
    };

    /**
     * Gets the {@link term.datanode data node} or binding / action rule of a binding set.
     *
     * @param {String}      setname       the name of the binding/action rule set.
     * @param {XMLElement}  cnode         the xml element to which the binding rules are applied.
     * @param {Boolean}     [isAction]    whether search is for an action rule.
     * @param {Boolean}     [getRule]     whether search is for a binding rule.
     * @param {Boolean}     [createNode]  whether the {@link term.datanode data node}is created when it doesn't exist.
     * @returns  {XMLElement}  the requested node.
     * @see  element.smartbinding
     * @private
     */
    this.getNodeFromRule = function(setname, cnode, isAction, getRule, createNode){
        //Get Rules from Array
        var rules = ((isAction ? this.actionRules : this.bindingRules) || {})[setname];
        if (!rules) {
            // #ifdef __WITH_INLINE_DATABINDING
            if (setname == "value") setname = "valuerule";
            if (!isAction && !getRule && typeof this[setname] == "string") {
                return cnode.selectSingleNode(this[setname]) || (createNode
                    ? jpf.xmldb.createNodeFromXpath(cnode, this[setname])
                    : false);
            }
            //#endif
            return false;
        }

        for(var i = 0; i < rules.length; i++) {
            //#ifdef __SUPPORT_SAFARI2
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

    /**
     * Returns the select statement of a binding or action rule
     *
     * @param {String}      setname  the name of the binding/action rule set.
     * @param {XMLElement}  cnode    the xml element to which the binding rules are applied.
     * @returns {String}
     * @private
     */
    this.getSelectFromRule = function(setname, cnode){
        var rules = this.bindingRules && this.bindingRules[setname];
        if (!rules || !rules.length) {
            //#ifdef __WITH_INLINE_DATABINDING
            if (setname == "value") setname = "valuerule";
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
     * Reloads the data in this element.
     *
     */
    this.reload = function(){
        var sb = this.getSmartBinding();
        if (sb && sb.$isMarkedForUpdate(this)) {
            sb.$updateMarkedItems();
        }
        else
            this.load(this.xmlRoot, this.cacheID, true);
    };

    /**
     * Loads data in to this element using binding rules to transform the
     * data in to a presentation.
     * Example:
     * <code>
     *  <j:list id="lstExample">
     *      <j:bindings>
     *          <j:caption select="text()" />
     *          <j:icon select="@icon" />
     *          <j:traverse select="image" />
     *      </j:bindings>
     *  </j:list>
     *
     *  <j:script>
     *      lstExample.load('<images>\
     *          <image icon="icoTest.gif">image 1</image>\
     *          <image icon="icoTest.gif">image 2</image>\
     *          <image icon="icoTest.gif">image 3</image>');
     *  </j:script>
     * </code>
     *
     * @param {mixed}  [xmlRootNode]
     *   Possible Values:
     *   {XMLElement}  an xml element loaded in to this element.
     *   {String}      an xml string which is loaded in this element.
     *   {Null         null clears this element from it's data {@link baseclass.cache.method.clear}.
     * @param {String}  [cacheID]       the xml element to which the binding rules are applied.
     * @param {Boolean} [forceNoCache]  whether cache is checked before loading the data.
     * @event beforeload  Fires before loading data in this element.
     *   cancellable: Prevents the data from being loaded.
     *   object:
     *   {XMLElement} xmlNode the node that is loaded as the root {@link term.datanode data node}.
     * @event afterload   Fires after loading data in this element.
     *   object:
     *   {XMLElement} xmlNode the node that is loaded as the root {@link term.datanode data node}.
     * @see  element.smartbinding
     * @see  baseclass.cache.method.clear
     * @private
     */
    this.load = function(xmlRootNode, cacheID, forceNoCache, noClearMsg){
        //#ifdef __WITH_POPUP
        if (jpf.popup.isShowing(this.uniqueId))
            jpf.popup.forceHide(); //This should be put in a more general position
        //#endif

        // If control hasn't loaded databinding yet, queue the call
        if ((!this.bindingRules && this.$jml
            && (!this.smartBinding && !this.traverse 
            || jpf.JmlParser.stackHasBindings(this.uniqueId))) 
            || (this.$canLoadData && !this.$canLoadData())) {
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

        if (!xmlRootNode && (!cacheID || !this.isCached(cacheID))) {
            //#ifdef __DEBUG
            jpf.console.warn("No xml root node was given to load in "
                + this.tagName + "[" + (this.name || '') + "]. Clearing any \
                  loaded xml in this component");
            //#endif

            this.clear(noClearMsg, true);

            if (jpf.appsettings.autoDisable && !this.createModel)
                this.setProperty("disabled", true);

            this.setConnections();
            return;
        }

        var disabled = this.disabled;
        this.disabled = false;

        // Remove listen root if available (support for listening to non-available data)
        if (this.$listenRoot) {
            jpf.xmldb.removeNodeListener(this.$listenRoot, this);
            this.$listenRoot = null;
        }

        //Run onload event
        if (this.dispatchEvent("beforeload", {xmlNode : xmlRootNode}) === false)
            return false;

        //#ifdef __DEBUG
        jpf.console.info("Loading XML data in "
            + this.tagName + "[" + (this.name || '') + "]");
        //#endif

        // If reloading current document, and caching is disabled, exit
        if (this.caching && !forceNoCache && xmlRootNode && xmlRootNode == this.xmlRoot)
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
        var fromCache;
        if (this.caching && !forceNoCache && (fromCache = this.getCache(cacheID, xmlRootNode))) {
            if (fromCache == -1)
                return;

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

            //#ifdef __WITH_PROPERTY_BINDING
            //@todo move this to getCache??
            if (this.hasFeature(__MULTISELECT__) && nodes.length != this.length)
                this.setProperty("length", nodes.length);
            //#endif

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

        if (!this.createModel) {
            this.disabled = true;
            this.setProperty("disabled", false);
        }
        else
            this.disabled = disabled;

        // Check Connections
        if (!this.hasFeature(__MULTISELECT__))
            this.setConnections(this.xmlRoot);

        // Run onafteronload event
        this.dispatchEvent('afterload', {xmlNode : xmlRootNode});
    };

    /**
     * @binding load Determines how new data is loaded data is loaded into this
     * element. Usually this is only the root node containing no children.
     * Example:
     * This example shows a load rule in a text element. It gets its data from
     * a list. When a selection is made on the list the data is loaded into the
     * text element.
     * <code>
     *  <j:list id="lstExample" smartbinding="..." />
     *
     *  <j:text model="#lstExample">
     *      <j:bindings>
     *          <j:load get="url:getMessage.php?id={@id}" />
     *          <j:contents select="message/text()" />
     *      </j:bindings>
     *  </j:text>
     * </code>
     * @attribute {string} get the {@link term.datainstruction data instruction} that is used to load data into the xmlRoot of this component.
     */
    this.$loadSubData = function(xmlRootNode){
        if (this.hasLoadStatus(xmlRootNode)) return;

        // #ifdef __WITH_OFFLINE_TRANSACTIONS
        if (typeof jpf.offline != "undefined" && !jpf.offline.onLine) {
            jpf.offline.transactions.actionNotAllowed();
            this.loadedWhenOffline = true;

            if (this.hasFeature(__MULTISELECT__) && !this.getTraverseNodes().length)
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

            if (this.$setClearMessage)
                this.$setClearMessage(this.loadingMsg, "loading");

            //||jpf.xmldb.findModel(xmlRootNode)
            var mdl = this.getModel(true);
            //#ifdef __DEBUG
            if (!mdl)
                throw new Error("Could not find model");
            //#endif

            var jmlNode = this;
            if (mdl.insertFrom(rule.getAttribute("get"), loadNode, {
                    insertPoint : xmlRootNode, //this.xmlRoot,
                    jmlNode     : this
                }, function(){
                    jmlNode.setConnections(xmlRootNode);//jmlNode.xmlRoot);
                }) === false
            ) {
                this.clear(true);
                if (jpf.appsettings.autoDisable)
                    this.setProperty("disabled", true);
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

    /**
     * @event beforeinsert Fires before data is inserted.
     *   cancellable: Prevents the data from being inserted.
     *   object:
     *   {XMLElement} xmlParentNode the parent in which the new data is inserted
     * @event afterinsert Fires after data is inserted.
     */

    /**
     * @private
     */
    this.insert = function(XMLRoot, parentXMLElement, options){
        if (typeof XMLRoot != "object")
            XMLRoot = jpf.getXmlDom(XMLRoot).documentElement;
        if (!parentXMLElement)
            parentXMLElement = this.xmlRoot;

        if (this.dispatchEvent("beforeinsert", {xmlParentNode : parentXMLElement}) === false)
            return false;

        //Integrate XMLTree with parentNode
        var newNode = jpf.xmldb.integrate(XMLRoot, parentXMLElement,
          jpf.extend(options, {copyAttributes: true}));

        //Call __XMLUpdate on all listeners
        jpf.xmldb.applyChanges("insert", parentXMLElement);

        //Select or propagate new data
        if (this.selectable && this.autoselect) {
            if (this.xmlRoot == newNode)
                this.$selectDefault(this.xmlRoot);
        }
        else if (this.xmlRoot == newNode)
            this.setConnections(this.xmlRoot, "select");

        if (this.hasLoadStatus(parentXMLElement, "loading"))
            this.setLoadStatus(parentXMLElement, "loaded");

        this.dispatchEvent("afterinsert");

        //Check Connections
        //this one shouldn't be called because they are listeners anyway...(else they will load twice)
        //if(this.selected) this.setConnections(this.selected, "select");
    };

    // #ifdef __WITH_MULTISELECT
    this.implement(this.hasFeature(__MULTISELECT__)
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

    var initModelId = [];
    this.$addJmlLoader(function(x){
        //, this.ref && this.hasFeature(__MULTISELECT__)
        if (initModelId[0])
            jpf.setModel(initModelId[0], this);
        if (initModelId[1])
            jpf.setModel(initModelId[1], this, true);

        var hasModel = initModelId.length;

        //Set the model for normal smartbinding
        if ((!this.ref || this.hasFeature(__MULTISELECT__)) && !this.xmlRoot) {
            var sb = jpf.JmlParser.sbInit[this.uniqueId]
                && jpf.JmlParser.sbInit[this.uniqueId][0];

            //@todo experimental for traverse="" attributes
            if (this.traverse && (sb && !sb.model
              || !sb && this.hasFeature(__MULTISELECT__))
              || !initModelId[0] && sb) {
                initModelId = findModel(x);

                if (initModelId) {
                    if (!sb)
                        this.smartBinding = true; //@todo experimental for traverse="" attributes

                    jpf.setModel(initModelId, this, 0);
                }
            }
        }

        initModelId = null;

        if (this.hasFeature(__MULTISELECT__) || this.$hasStateMessages) {
            //@todo An optimization might be to loop through the parents once
            var defProps = ["empty-message", "loading-message", "offline-message"];

            for (var i = 0, l = defProps.length; i < l; i++) {
                if (!x.getAttribute(defProps[i]))
                    this.$propHandlers[defProps[i]].call(this);
            }
        }

        if (!x.getAttribute("create-model"))
            this.$propHandlers["create-model"].call(this);

        var hasInitSb = jpf.JmlParser.sbInit[this.uniqueId] ? true : false;
        if ((!hasInitSb || !hasModel) && this.$setClearMessage
          && (!loadqueue && !this.xmlRoot && (this.hasFeature(__MULTISELECT__)
          || this.ref || hasInitSb)))
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

    /**
     * @attribute {Boolean} render-root whether the xml element loaded into this
     * element is rendered as well. Default is false.
     * Example:
     * This example shows a tree which also renders the root element.
     * <code>
     *  <j:tree render-root="true">
     *      <j:model>
     *          <root name="My Computer">
     *              <drive letter="C">
     *                  <folder path="/Program Files" />
     *                  <folder path="/Desktop" />
     *              </drive>
     *          </root>
     *      </j:model>
     *  </j:tree>
     * </code>
     */
    this.$booleanProperties["render-root"] = true;
    this.$supportedProperties.push("empty-message", "loading-message",
        "offline-message", "render-root", "smartbinding", "create-model",
        "bindings", "actions", "dragdrop");

    this.$propHandlers["render-root"] = function(value){
        this.renderRoot = value;
    }
    
    /**
     * @attribute {String} empty-message the message displayed by this element
     * when it contains no data. This property is inherited from parent nodes.
     * When none is found it is looked for on the appsettings element. Otherwise
     * it defaults to the string "No items".
     */
    this.$propHandlers["empty-message"] = function(value){
        this.emptyMsg = value
            || jpf.xmldb.getInheritedAttribute(this.$jml, "empty-message")
            || "No items";

        if (!jpf.isParsing) 
            this.$updateClearMessage(this.emptyMsg, "empty");
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
     *  <j:list loading-message="{'Loading ' + Math.round(progress1.value*100) + '%'}" />
     *  <j:progressbar id="progress1" />
     * </code>
     * Remarks:
     * Usually a static loading message is displayed for only 100 milliseconds
     * or so, whilst loading the data from the server. This is done for instance
     * when the load binding rule is used. In the code example below a list
     * binds on the selection of a tree displaying folders. When the selection
     * changes, the list loads new data by extending the model. During the load
     * of this new data the loading message is displayed.
     * <code>
     *  <j:list model="#trFolders">
     *      <j:bindings>
     *          ...
     *          <j:load load="rpc:comm.getFiles({@path})" />
     *      </j:bindings>
     *  </j:list>
     * </code>
     */
    this.$propHandlers["loading-message"] = function(value){
        this.loadingMsg = value
            || jpf.xmldb.getInheritedAttribute(this.$jml, "loading-message")
            || "Loading...";

        if (!jpf.isParsing)
            this.$updateClearMessage(this.loadingMsg, "loading");
    };

    /**
     * @attribute {String} offline-message  the message displayed by this
     * element when it can't load data because the application is offline.
     * This property is inherited from parent nodes. When none is found it is
     * looked for on the appsettings element. Otherwise it defaults to the
     * string "You are currently offline...".
     */
    this.$propHandlers["offline-message"] = function(value){
        this.offlineMsg = value
            || jpf.xmldb.getInheritedAttribute(this.$jml, "offline-message")
            || "You are currently offline...";

        if (!jpf.isParsing)
            this.$updateClearMessage(this.offlineMsg, "offline");
    };

    /**
     * @attribute {Boolean} create-model whether the model this element connects
     * to is extended when the data pointed to does not exist. Defaults to true.
     * Example:
     * In this example a model is extended when the user enters information in
     * the form elements. Because no model is specified for the form elements
     * the first available model is chosen. At the start it doesn't have any
     * data, this changes when for instance the name is filled in. A root node
     * is created and under that a 'name' element with a textnode containing
     * the entered text.
     * <code>
     *  <j:model id="mdlForm" submission="url:save_form.php" />
     *
     *  <j:bar>
     *      <j:label>Name</j:label>
     *      <j:textbox ref="name" required="true" />
     *
     *      <j:label>Address</j:label>
     *      <j:textarea ref="address" />
     *
     *      <j:label>Country</j:label>
     *      <j:dropdown 
     *        ref      = "country" 
     *        model    = "url:countries.xml" 
     *        traverse = "country" 
     *        caption  = "@name" />
     *
     *      <j:button action="submit">Submit</j:button>
     *  </j:bar>
     * </code>
     */
    this.$propHandlers["create-model"] = function(value){
        this.createModel = !jpf.isFalse(
            jpf.xmldb.getInheritedAttribute(this.$jml, "create-model"));
            
        var mb;
        if (this.getMultibinding && (mb = this.getMultibinding()))
            mb.createModel = this.createModel;
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
     *  <j:tree smartbinding="sbExample" />
     *
     *  <j:smartbinding id="sbExample">
     *      <j:bindings>
     *          <j:caption  select = "@name"/>
     *          <j:icon     select = "self::file"
     *                      value  = "icoFile.gif" />
     *          <j:icon     value  = "icoFolder.gif" />
     *          <j:traverse select = "file|folder|root" />
     *      </j:bindings>
     *      <j:actions>
     *          <j:remove set = "url:remove.php?path={@path}" />
     *          <j:rename set = "url:move.php?from=oldValue&to={@path}" />
     *      </j:actions>
     *      <j:dragdrop>
     *          <j:allow-drag select = "folder|file" />
     *          <j:allow-drop select = "folder" 
     *                        target = "root"
     *                        operation = "tree-append" />
     *          <j:allow-drop select = "folder" 
     *                        target = "folder"
     *                        operation = "insert-before" />
     *          <j:allow-drop select = "file"   
     *                        target = "folder|root" 
     *                        soperation = "tree-append" />
     *          <j:allow-drop select = "file"   
     *                        target = "file"        
     *                        operation = "insert-before" />
     *      </j:dragdrop>
     *      <j:model load="url:get_listing.php" />
     *  </j:smartbinding>
     * </code>
     * Remarks:
     * The smartbinding parts can also be assigned to an element by adding them
     * directly as a child in jml.
     * <code>
     *  <j:tree>
     *      <j:bindings>
     *          ...
     *      </j:bindings>
     *      <j:actions>
     *          ...
     *      </j:actions>
     *      <j:dragdrop>
     *          ...
     *      </j:dragdrop>
     *      <j:model />
     *  </j:tree>
     * </code>
     *
     * See:
     * There are several ways to be less verbose in assigning certain rules.
     * <ul>
     *  <li>{@link baseclass.multiselectbinding.binding.traverse}</li>
     *  <li>{@link baseclass.dragdrop.attribute.dragEnabled}</li>
     *  <li>{@link element.bindings}</li>
     *  <li>{@link element.actions}</li>
     *  <li>{@link element.dragdrop}</li>
     * </ul>
     */
    this.$propHandlers["smartbinding"] = function(value, forceInit){
        var sb;

        if (value && typeof value == "string") {
            sb = jpf.JmlParser.getSmartBinding(value);

            //#ifdef __DEBUG
            if (!sb)
                throw new Error(jpf.formatErrorString(1059, this,
                    "Attaching a smartbinding to " + this.tagName
                    + " [" + this.name + "]",
                    "Smartbinding '" + value + "' was not found."));
            //#endif
        }
        else
            sb = value;

        if (this.smartBinding && this.smartBinding.deinitialize)
            this.smartBinding.deinitialize(this)

        if (jpf.isParsing) {
            if (forceInit === true) {
                this.smartBinding = sb.initialize(this);
                this.$checkLoadQueue();
                return this.smartBinding;
            }

            return jpf.JmlParser.addToSbStack(this.uniqueId, sb);
        }

        return (this.smartBinding = sb.markForUpdate(this));
    };

    /**
     * @attribute {String} bindings the id of the j:bindings element which
     * provides the binding rules for this element.
     * Example:
     * This example shows a set of binding rules that transform data into the
     * representation of a list. In this case it displays the names of
     * several email accounts, with after each account name the number of unread
     * mails in that account. It uses JSLT to transform the caption.
     * <code>
     *  <j:list bindings="bndExample" />
     *
     *  <j:bindings id="bndExample">
     *      <j:caption>{text()} (#'mail[@read=0]')</j:caption>
     *      <j:icon     select = "@icon" />
     *      <j:traverse select = "account" sort="text()" />
     *  </j:bindings>
     * </code>
     * Remarks:
     * Bindings can also be assigned directly by putting the bindings tag as a
     * child of this element.
     *
     * If the rule only contains a select attribute, it can be written in a
     * short way by adding an attribute with the name of the rule to the
     * element itself:
     * <code>
     *  <j:list caption="text()" icon="@icon" traverse="item" />
     * </code>
     */
    this.$propHandlers["bindings"] = function(value){
        var sb = this.smartBinding || (jpf.isParsing
            ? jpf.JmlParser.getFromSbStack(this.uniqueId)
            : this.$propHandlers["smartbinding"].call(this, new jpf.smartbinding()));

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

        var xmlNode = jpf.nameserver.get("bindings", value);
        sb.addBindings(jpf.getRules(xmlNode), xmlNode);
    };

    /**
     * @attribute {String} actions the id of the j:actions element which
     * provides the action rules for this element. Action rules are used to
     * send changes on the bound data to a server.
     * Example:
     * <code>
     *  <j:tree actions="actExample" />
     *
     *  <j:actions id="actExample">
     *      <j:rename set="rpc:comm.update({@id}, {@name})" />
     *      <j:remove set="rpc:comm.remove({@id})" />
     *      <j:add get="rpc:comm.add({../@id})" />
     *  </j:actions>
     * </code>
     */
    this.$propHandlers["actions"] = function(value){
        var sb = this.smartBinding || (jpf.isParsing
            ? jpf.JmlParser.getFromSbStack(this.uniqueId)
            : this.$propHandlers["smartbinding"].call(this, new jpf.smartbinding()));

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

        var xmlNode = jpf.nameserver.get("actions", value);
        sb.addActions(jpf.getRules(xmlNode), xmlNode);
    };

    // #ifdef __WITH_INLINE_DATABINDING
    function refModelPropSet(strBindRef){
        var isSelection = this.hasFeature(__MULTISELECT__) ? 1 : 0;
        var o = isSelection
            ? this.$getMultiBind()
            : this;

        var sb = hasRefBinding && o.smartBinding || (jpf.isParsing
            ? jpf.JmlParser.getFromSbStack(this.uniqueId, isSelection, true)
            : this.$propHandlers["smartbinding"].call(this, new jpf.smartbinding()))

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
            if (modelId == "@default") {
                valueSelect = strBindRef;
            }
            else if (valuePath) {
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

            if (jpf.isParsing && initModelId)
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

    /**
     * @attribute {String} model the name of the model to load data from or a
     * datainstruction to load data.
     * Example:
     * <code>
     *  <j:tree model="mdlExample" />
     *  <j:model id="mdlExample" load="url:example.xml" />
     * </code>
     * Example:
     * <code>
     *  <j:list model="url:friends.xml" />
     * </code>
     * Example:
     * <code>
     *  <j:tree id="trContacts" model="rpc:comm.getContacts()" />
     *  <j:text model="#trContacts" />
     * </code>
     * Remarks:
     * This attribute is inherited from a parent when not set. You can use this
     * to tell sets of elements to use the same model.
     * <code>
     *  <j:bar model="mdlForm">
     *      <j:label>Name</j:label>
     *      <j:textbox ref="name" />
     *
     *      <j:label>Happiness</j:label>
     *      <j:slider ref="happiness" min="0" max="10"/>
     *  </j:bar>
     *
     *  <j:model id="mdlForm">
     *      <data />
     *  </j:model>
     * </code>
     * When no model is specified the default model is choosen. The default
     * model is the first model that is found without a name, or if all models
     * have a name, the first model found.
     *
     * @attribute {String} select-model the name of the model or a
     * datainstruction to load data that determines the selection of this
     * element.
     * Example:
     * This example shows a dropdown from which the user can select a country.
     * The list of countries is loaded from a model. Usually this would be loaded
     * from a seperate url, but for clarity it's inlined. When the user selects
     * a country in the dropdown the value of the item is stored in the second
     * model (mdlForm) at the position specified by the ref attribute. In this
     * case this is the country element.
     * <code>
     *  <j:label>Name</j:label>
     *  <j:textbox ref="name" model="mdlForm" />
     *
     *  <j:label>Country</j:label>
     *  <j:dropdown
     *      ref          = "country"
     *      model        = "mdlCountries"
     *      select-model = "mdlForm"
     *      traverse     = "country"
     *      value        = "@value"
     *      caption      = "text()">
     *  </j:dropdown>
     *
     *  <j:model id="mdlCountries">
     *      <countries>
     *          <country value="USA">USA</country>
     *          <country value="GB">Great Brittain</country>
     *          <country value="NL">The Netherlands</country>
     *          ...
     *      </countries>
     *  </j:model>
     *
     *  <j:model id="mdlForm">
     *      <data>
     *          <name />
     *          <country />
     *      </data>
     *  </j:model>
     * </code>
     * Remarks:
     * In most cases this attribute isn't used because the model is inherited
     * from a parent element. In a typical form this will happen as follows:
     * <code>
     *  <j:bar model="mdlForm">
     *      <j:label>Name</j:label>
     *      <j:textbox ref="name" />
     *
     *      <j:label>Country</j:label>
     *      <j:dropdown
     *          ref          = "country"
     *          model        = "url:countries.xml"
     *          traverse     = "country"
     *          value        = "@value"
     *          caption      = "text()">
     *      </j:dropdown>
     *  </j:bar>
     *
     *  <j:model id="mdlForm">
     *      <data />
     *  </j:model>
     * </code>
     * @see baseclass.databinding.attribute.model
     */
    this.$propHandlers["model"] = function(value){
        if (this.$modelIgnoreOnce) {
            delete this.$modelIgnoreOnce;
            return;
        }
        
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
    /**
     * @attribute {String} ref  an xpath statement used to select the data xml
     * element to which this element is bound to.
     * Example:
     * <code>
     *  <j:slider ref="@value" model="mdlExample" />
     *
     *  <j:model id="mdlExample">
     *      <data value="0.3" />
     *  </j:model>
     * </code>
     */
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

        this.implement(jpf.VirtualViewport);
    };
    //#endif
};

/**
 * @constructor
 * @private
 * @baseclass
 */
jpf.StandardBinding = function(){
    if (!this.defaultValue) //@todo please use this in a sentence
        this.defaultValue = "";

    /**
     * Load XML into this element
     * @private
     */
    this.$load = function(XMLRoot){
        //Add listener to XMLRoot Node
        jpf.xmldb.addNodeListener(XMLRoot, this);

        //Set Properties

        //#ifdef __WITH_PROPERTY_BINDING
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
     * Set xml based properties of this element
     * @private
     */
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //Clear this component if some ancestor has been detached
        if (action == "redo-remove") {
            var retreatToListenMode = false, model = this.getModel(true);
            if (model) {
                var xpath = model.getXpathByJmlNode(this);
                if (xpath) {
                    var xmlNode = model.data.selectSingleNode(xpath);
                    if (xmlNode != this.xmlRoot)
                        retreatToListenMode = true;
                }
            }
            
            if (retreatToListenMode || this.xmlRoot == xmlNode) {
                /*#ifdef __DEBUG
                //RLD: Disabled because sometimes indeed components do not 
                //have a model when their xmlRoot is removed.
                if (!model) {
                    throw new Error(jpf.formatErrorString(0, this, 
                        "Setting change notifier on component", 
                        "Component without a model is listening for changes", 
                        this.$jml));
                }
                #endif*/

                //Set Component in listening state untill data becomes available again.
                return model.loadInJmlNode(this, xpath);
            }
        }

        //Action Tracker Support
        if (UndoObj && !UndoObj.xmlNode)
            UndoObj.xmlNode = this.xmlRoot;

        //Set Properties

        //#ifdef __WITH_PROPERTY_BINDING
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
 * All elements inheriting from this {@link term.baseclass baseclass} can bind to data 
 * which contains multiple nodes.
 *
 * @allowchild  item, choices
 * @define  choices     Container for item nodes which receive presentation. 
 * This element is part of the XForms specification. It is not necesary for 
 * the javeline markup language.
 * Example:
 * <code>
 *  <j:list>
 *      <j:choices>
 *          <j:item>red</j:item>
 *          <j:item>blue</j:item>
 *          <j:item>green</j:item>
 *      </j:choices>
 *  </j:list>
 * </code>
 * @allowchild  item
 *
 * @constructor
 * @baseclass
 * @default_private
 */
jpf.MultiselectBinding = function(){
    this.length = 0;

    /**
     * @define bindings
     * @allowchild traverse
     * @binding traverse Determines the list of elements for which each
     * gets a visual representation within the element. It also can determine
     * the sequence of how the elements are visualized by offering a way to
     * specify the sort order. (N.B. The sorting mechanism is very similar to
     * that of XSLT)
     * Example:
     * This example contains a list that displays elements with the tagName
     * 'mail' that do not have a deleted attribute set to 1.
     * <code>
     *  <j:list>
     *      <j:bindings>
     *          ...
     *          <j:traverse select="mail[not(@deleted='1')]" />
     *      </j:bindings>
     *  </j:list>
     * </code>
     * Example:
     * This example shows how to use the traverse rule to order files based
     * on their modified data.
     * <code>
     *  <j:traverse
     *      select      = "file"
     *      sort        = "@date"
     *      date-format = "DD-MM-YYYY"
     *      order       = "descending" />
     * </code>
     * Example:
     * This example shows how to do complex sorting using a javascript callback function.
     * <code>
     *  <j:traverse select="file|folder" sort="@name" sort-method="compare" />
     *  <j:script>
     *      function compare(value, args, xmlNode) {
     *          //Sort all folders together and all files and then sort on alphabet.
     *          return (xmlNode.tagName == "folder" ? 0 : 1) + value;
     *      }
     *  </j:script>
     * </code>
     * @attribute {String} select       an xpath statement which selects the nodes which will be rendered.
     * @attribute {String} sort         an xpath statement which selects the value which is subject to the sorting algorithm.
     * @attribute {String} data-type    the way sorting is executed. See {@link baseclass.multiselectbinding.binding.traverse.attribute.sort-method} for how to specify a custom sort method.
     *   Possible values:
     *   string  Sorts alphabetically
     *   number  Sorts based on numerical value (i.e. 9 is lower than 10).
     *   date    Sorts based on the date sequence (21-6-1980 is lower than 1-1-2000). See {@link baseclass.multiselectbinding.binding.traverse.attribute.date-format} for how to specify the date format.
     * @attribute {String} date-format  the format of the date on which is sorted.
     *   Possible values:
     *   YYYY   Full year
     *   YY     Short year
     *   DD     Day of month
     *   MM     Month
     *   hh     Hours
     *   mm     Minutes
     *   ss     Seconds
     * Example:
     * <code>
     *  date-format="DD-MM-YYYY"
     * </code>
     * @attribute {String} sort-method  the name of a javascript function to executed to determine the value to sort on.
     * @attribute {String} order        the order of the sorted list.
     *   Possible values:
     *   ascending  Default sorting order
     *   descending Reverses the default sorting order.
     * @attribute {String} case-order   whether upper case characters have preference above lower case characters.
     *   Possible values:
     *   upper-first    Upper case characters are higher.
     *   lower-first    Lower case characters are higher.
     */
    /**
     * @private
     */
    this.parseTraverse = function (xmlNode){
        this.traverse = xmlNode.getAttribute("select");

        //#ifdef __WITH_SORTING
        this.$sort = xmlNode.getAttribute("sort") ? new jpf.Sort(xmlNode) : null;
        //#endif
    };

     //#ifdef __WITH_SORTING
    /**
     * Change the sorting order of this element
     *
     * @param {Object}  options  the new sort options. These are applied incrementally. Any property not set is maintained unless the clear parameter is set to true.
     *   Properties:
     *   {String}   order        see {@link baseclass.multiselectbinding.binding.traverse.attribute.order}
     *   {String}   [xpath]      see {@link baseclass.multiselectbinding.binding.traverse.attribute.sort}
     *   {String}   [type]       see {@link baseclass.multiselectbinding.binding.traverse.attribute.data-type}
     *   {String}   [method]     see {@link baseclass.multiselectbinding.binding.traverse.attribute.sort-method}
     *   {Function} [getNodes]   Function that retrieves a list of nodes.
     *   {String}   [dateFormat] see {@link baseclass.multiselectbinding.binding.traverse.attribute.date-format}
     *   {Function} [getValue]   Function that determines the string content based on an xml node as it's first argument.
     * @param {Boolean} clear    removes the current sort options.
     * @param {Boolean} noReload whether to reload the data of this component.
     * @see   baseclass.multiselectbinding.binding.traverse
     */
    this.resort = function(options, clear, noReload){
        if (!this.$sort)
            this.$sort = new jpf.Sort();
 
        this.$sort.set(options, clear);
        this.clearAllCache();

        if (noReload)
            return;

        //#ifdef __WITH_VIRTUALVIEWPORT
        /*if(this.hasFeature(__VIRTUALVIEWPORT__)){
            jpf.xmldb.clearVirtualDataset(this.xmlRoot);
            this.reload();

            return;
        }*/
        //#endif

        (function sortNodes(xmlNode, htmlParent) {
            var sNodes = _self.$sort.apply(
                jpf.xmldb.getArrayFromNodelist(xmlNode.selectNodes(_self.traverse)));

            for (var i = 0; i < sNodes.length; i++) {
                if (_self.isTreeArch || _self.$withContainer){
                    var htmlNode = jpf.xmldb.findHTMLNode(sNodes[i], _self);

                    //#ifdef __DEBUG
                    if (!_self.$findContainer){
                        throw new Error(jpf.formatErrorString(_self,
                            "Sorting Nodes",
                            "This component does not \
                             implement _self.$findContainer"));
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

        return options;
    };

    /**
     * Change sorting from ascending to descending and vice versa.
     */
    this.toggleSortOrder = function(){
        return this.resort({"ascending" : !this.$sort.get().ascending}).ascending;
    };

    /**
     * Retrieves the current sort options
     *
     * @returns {Object}  the current sort options.
     *   Properties:
     *   {String}   order      see {@link baseclass.multiselectbinding.binding.traverse.attribute.order}
     *   {String}   xpath      see {@link baseclass.multiselectbinding.binding.traverse.attribute.sort}
     *   {String}   type       see {@link baseclass.multiselectbinding.binding.traverse.attribute.data-type}
     *   {String}   method     see {@link baseclass.multiselectbinding.binding.traverse.attribute.sort-method}
     *   {Function} getNodes   Function that retrieves a list of nodes.
     *   {String}   dateFormat see {@link baseclass.multiselectbinding.binding.traverse.attribute.date-format}
     *   {Function} getValue   Function that determines the string content based on an xml node as it's first argument.
     * @see    baseclass.multiselectbinding.binding.traverse
     */
    this.getSortSettings = function(){
        return this.$sort.get();
    };
    //#endif

    /**
     * Retrieves a nodelist containing the {@link term.datanode data nodes} which are rendered by
     * this element (see traverse nodes, see {@link baseclass.multiselectbinding.binding.traverse}).
     *
     * @param {XMLElement} [xmlNode] the parent element on which the traverse query is applied.
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
     * Retrieves the first {@link term.datanode data node} which gets representation in this element
     * (see traverse nodes, see {@link baseclass.multiselectbinding.binding.traverse}).
     *
     * @param {XMLElement} [xmlNode] the parent element on which the traverse query is executed.
     * @return {XMLElement}
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
     * Retrieves the last {@link term.datanode data node} which gets representation in this element
     * (see traverse nodes, see {@link baseclass.multiselectbinding.binding.traverse}).
     *
     * @param {XMLElement} [xmlNode] the parent element on which the traverse query is executed.
     * @return {XMLElement} the last {@link term.datanode data node}
     * @see    baseclass.multiselectbinding.binding.traverse
     */
    this.getLastTraverseNode = function(xmlNode){
        var nodes = this.getTraverseNodes(xmlNode || this.xmlRoot);//.selectNodes(this.traverse);
        return nodes[nodes.length-1];
    };

    /**
     * Determines whether an {@link term.datanode data node} is a traverse node (see {@link baseclass.multiselectbinding.binding.traverse})
     *
     * @param {XMLElement} [xmlNode] the parent element on which the traverse query is executed.
     * @return  {Boolean}  whether the xml element is a traverse node.
     * @see  baseclass.multiselectbinding.binding.traverse
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
     * Retrieves the next traverse node (see {@link baseclass.multiselectbinding.binding.traverse}) to be selected
     * from a given traverse node. The method can do this in either direction and
     * also return the Nth node for this algorithm.
     *
     * @param {XMLElement}  xmlNode  the starting point for determining the next selection.
     * @param {Boolean}     [up]     the direction of the selection. Default is false.
     * @param {Integer}     [count]  the distance in number of nodes. Default is 1.
     * @return  {XMLElement} the {@link term.datanode data node} to be selected next.
     * @see  baseclass.multiselectbinding.binding.traverse
     */
    this.getNextTraverseSelected = function(xmlNode, up, count){
        if (!xmlNode)
            xmlNode = this.selected;
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
     * Retrieves the next traverse node (see {@link baseclass.multiselectbinding.binding.traverse}).
     * The method can do this in either direction and also return the Nth next node.
     *
     * @param {XMLElement}  xmlNode     the starting point for determining the next node.
     * @param {Boolean}     [up]        the direction. Default is false.
     * @param {Integer}     [count]     the distance in number of nodes. Default is 1.
     * @return  {XMLElement} the next traverse node
     * @see  baseclass.multiselectbinding.binding.traverse
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

    /**
     * Retrieves the parent traverse node (see {@link baseclass.multiselectbinding.binding.traverse}). In some
     * cases the traverse rules has a complex form like 'children/item'. In those
     * cases the generated tree has a different structure from that of the xml
     * data. For these situations the xmlNode.parentNode property won't return
     * the traverse parent, this method will give you the right parent.
     *
     * @param {XMLElement} xmlNode the node for which the parent element will be determined.
     * @return  {XMLElement} the parent node or null if none was found.
     * @see  baseclass.multiselectbinding.binding.traverse
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

    /**
     * Set listeners, calls HTML creation methods and
     * initializes select and focus states of object.
     */
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
            var sel, bHasOffline = (typeof jpf.offline != "undefined");
            if (!this.firstLoad && bHasOffline && jpf.offline.state.enabled
              && jpf.offline.state.realtime) {
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
                        sel[i] = jpf.remote.xpathToXml(sel[i],
                            this.xmlRoot);
                    }

                    if (selstate[1]) {
                        var selected = jpf.remote
                            .xpathToXml(selstate[1], this.xmlRoot);
                    }

                    this.selectList(sel, null, selected);
                }

                if (selstate[0]) {
                    this.setIndicator(jpf.remote
                        .xpathToXml(selstate[0], this.xmlRoot));
                }
            }
            else
            //#endif
            if (this.autoselect) {
                if (this.value) {
                    var value = this.value;
                    this.value = !this.value;
                    this.setProperty("value", value);
                }
                
                if (!this.selected) {
                    if (this.renderRoot)
                        this.select(XMLRoot);
                    else if (nodes.length)
                        this.$selectDefault(XMLRoot);
                    else
                        this.setConnections();
                }
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
            jpf.window.focussed == this ? this.$focus() : this.$blur();

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
        "move-away"   : 105,//1101001
        "move"        : 77  //1001101
    };

    /**
     * Loops through parents of changed node to find the first
     * connected node. Based on the action it will change, remove
     * or update the representation of the data.
     *
     * @event xmlupdate Fires when xml of this element is updated.
     *   object:
     *   {String}     action   the action that was executed on the xml.
     *      Possible values:
     *      text        a text node is set.
     *      update      an xml node is updated.
     *      insert      xml nodes are inserted.
     *      add         an xml node is added.
     *      remove      an xml node is removed (parent still set).
     *      redo-remove an xml node is removed (parent not set).
     *      synchronize unknown update.
     *      move-away   an xml node is moved (parent not set).
     *      move        an xml node is moved (parent still set).
     *   {XMLElement} xmlNode  the node that is subject to the update.
     *   {Mixed}      result   the result.
     *   {UndoObj}    UndoObj  the undo information.
     */
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj, lastParent){
        if (!this.xmlRoot)
            return; //@todo think about purging cache when xmlroot is removed

        var result, startNode = xmlNode, length;
        if (!listenNode)
            listenNode = this.xmlRoot;

        if (action == "redo-remove") {
            lastParent.appendChild(xmlNode); //ahum, i'm not proud of this one
            var traverseNode = this.isTraverseNode(xmlNode);
            lastParent.removeChild(xmlNode);
            
            if (!traverseNode)
                xmlNode = lastParent;
        }

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
                    if (xmlNode == this.xmlRoot && action != "insert")
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
            var wasInThis = jpf.xmldb.isChildOf(this.xmlRoot, UndoObj.extra.parent, true);

            //Move if both previous and current position is within this object
            if (isInThis && wasInThis)
                this.$moveNode(xmlNode, htmlNode);
            else if (isInThis) //Add if only current position is within this object
                action = "add";
            else if (wasInThis) //Remove if only previous position is within this object
                action = "remove";
        }
        else if (action == "move-away") {
            var goesToThis = jpf.xmldb.isChildOf(this.xmlRoot, UndoObj.extra.parent, true);
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
            if (!xmlNode)
                return;
            
            if (this.hasLoadStatus(xmlNode) && this.$removeLoading)
                this.$removeLoading(htmlNode);

            if (this.oInt.firstChild && !jpf.xmldb.getNode(this.oInt.firstChild)) {
                //Appearantly the content was cleared
                this.oInt.innerHTML = "";

                if (!this.renderRoot) {
                    length = this.getTraverseNodes().length;
                    if (!length)
                        this.clearAllTraverse();
                }
            }

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

            if (this.selectable && (length === 0 || !this.xmlRoot.selectSingleNode(this.traverse)))
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
        else if ((action == "remove") && (!xmlNode || foundNode == xmlNode && xmlNode.parentNode)) { //Check Remove
            if (!xmlNode)
                return;
            
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
                var model = this.getModel(true);

                //#ifdef __DEBUG
                if (!model)
                    throw new Error(jpf.formatErrorString(0, this,
                        "Setting change notifier on component",
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
            if (action == "remove" && jpf.xmldb.isChildOf(xmlNode, this.selected, true)
              || xmlNode == selectTimer.nextNode)
                selectTimer.nextNode = this.getDefaultNext(xmlNode);

            //@todo Fix this by putting it after xmlUpdate when its using a timer
            selectTimer.timer = setTimeout(function(){
                _self.$checkSelection(selectTimer.nextNode);
                selectTimer.nextNode = null;
            });
        }

        //#ifdef __WITH_PROPERTY_BINDING
        //Set dynamic properties that relate to the changed content
        if (actionFeature[action] & 64) {
            if (!length)
                length = this.xmlRoot.selectNodes(this.traverse).length;
            if (length != this.length)
                this.setProperty("length", length);
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
            result : result,
            UndoObj: UndoObj
        });
    };

    /**
     * Loop through NodeList of selected Traverse Nodes
     * and check if it has representation. If it doesn't
     * representation is created via $add().
     */
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
        isChild          = (isChild && (this.renderRoot && xmlNode == this.xmlRoot
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

        this.$chained = true;
        if (!this.dataParent || !this.dataParent.parent.$chained) {
            var _self = this;
            setTimeout(function(){
                _self.setConnections(combinedvalue || _self.selected);
                delete _self.$chained;
            }, 10);
        }
        else {
            this.setConnections(combinedvalue || this.selected);
            delete this.$chained;
        }
    });

    this.addEventListener("afterdeselect", function(){
        var _self = this;
        setTimeout(function(){
            _self.setConnections(null);
        }, 10);
    });

    this.$loadInlineData = function(x){
        if (!$xmlns(x, "item", jpf.ns.jml).length)
            return jpf.JmlParser.parseChildren(x, null, this);

        //#ifdef __WITH_XFORMS
        var parent = $xmlns(x, "choices", jpf.ns.jml)[0] || x;
        /* #else
        var parent = x;
        #endif */

        //#ifdef __DEBUG
        if (x.getAttribute("model")) {
            throw new Error(jpf.formatErrorString(0, this, 
                "Loading inline data",
                "Found model attribute set. This will conflict with loading\
                the inline data. Please remove it. If you would like to set\
                the model to receive the selection value, please set the \
                select-model attribute.", x));
        }
        //#endif

        var prefix = jpf.findPrefix(x, jpf.ns.jml);

        if (jpf.isIE) {
            x.ownerDocument.setProperty("SelectionNamespaces", "xmlns:"
                + prefix + "='" + jpf.ns.jpf + "'");
        }
    
        //@todo think about using setProperty for this, for consistency (at the price of speed)
        this.icon      = "@icon";
        this.image     = "@image";
        this.caption   = "label/text()|text()|@caption";//|@value
        this.valuerule = "value/text()|@value|text()";
        this.traverse  = prefix + ":item";

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
    /**
     * @attribute {String} traverse the xpath statement that determines which
     * {@link term.datanode data nodes} are rendered by this element (also known
     * as {@link term.traversenode traverse nodes}. See
     * {@link baseclass.multiselectbinding.binding.traverse} for more information.
     * Example:
     * <code>
     *  <j:label>Country</j:label>
     *  <j:dropdown
     *      model        = "mdlCountries"
     *      traverse     = "country"
     *      value        = "@value"
     *      caption      = "text()">
     *  </j:dropdown>
     *
     *  <j:model id="mdlCountries">
     *      <countries>
     *          <country value="USA">USA</country>
     *          <country value="GB">Great Brittain</country>
     *          <country value="NL">The Netherlands</country>
     *          ...
     *      </countries>
     *  </j:model>
     * </code>
     * @see  baseclass.multiselectbinding.binding.traverse
     */
    this.$propHandlers["traverse"] =

    /**
     * @attribute {String} caption the xpath statement that determines from
     * which xml node the caption is retrieved.
     * Example:
     * <code>
     *  <j:list caption="text()" traverse="item" />
     * </code>
     */
    this.$propHandlers["caption"]  =
    
    /**
     * @attribute {String} valuerule the xpath statement that determines from
     * which xml node the value is retrieved.
     * Example:
     * <code>
     *  <j:list valuerule="@value" traverse="item" />
     * </code>
     * @see  baseclass.multiselect.binding.value
     */
    this.$propHandlers["valuerule"]  =

    /**
     * @attribute {String} icon the xpath statement that determines from
     * which xml node the icon url is retrieved.
     * Example:
     * <code>
     *  <j:list icon="@icon" traverse="item" />
     * </code>
     */
    this.$propHandlers["icon"]     =

    /**
     * @attribute {String} tooltip the xpath statement that determines from
     * which xml node the tooltip text is retrieved.
     * Example:
     * <code>
     *  <j:list tooltip="text()" traverse="item" />
     * </code>
     */
    this.$propHandlers["tooltip"]  =

    /**
     * @attribute {String} select the xpath statement that determines whether
     * this node is selectable.
     * Example:
     * <code>
     *  <j:list select="self::node()[not(@disabled='1')]" traverse="item" />
     * </code>
     * @see  baseclass.multiselect.binding.select
     */
    this.$propHandlers["select"]   = this.$handleBindingRule;
    //#endif
};
// #endif

// #endif
