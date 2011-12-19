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

apf.__DATAACTION__ = 1 << 25;

// #ifdef __WITH_DATAACTION
/**
 * Baseclass adding data action features to this element. 
 */
apf.DataAction = function(){
    this.$regbase = this.$regbase | apf.__DATAACTION__;

    /**** Public Methods ****/

    /**
     * Gets the ActionTracker this element communicates with.
     *
     * @return {ActionTracker}
     * @see  element.smartbinding
     */
    this.getActionTracker = function(ignoreMe){
        if (!apf.AmlNode)
            return apf.window.$at;

        var pNode = this, tracker = ignoreMe ? null : this.$at;
        if (!tracker && this.dataParent)
            tracker = this.dataParent.parent.$at; //@todo apf3.0 change this to be recursive??

        while (!tracker) {
            if (!pNode.parentNode && !pNode.$parentNode) {
                var model;
                return (model = this.getModel && this.getModel(true)) && model.$at || apf.window.$at;
            }

            tracker = (pNode = pNode.parentNode || pNode.$parentNode).$at;
        }
        return tracker;
    };
 
    //#ifdef __WITH_LOCKING
    this.$lock = {};
    //#endif

    this.$actionsLog = {};
    this.$actions    = false;

    /**
     * @term locking {@link http://en.wikipedia.org/wiki/Lock_(computer_science) A lock} 
     * is a mechanism for enforcing limits on access to a resource in a 
     * multi-user environment. Locks are one way of enforcing concurrency 
     * control policies. Ajax.org Platform (apf) has support for locking in 
     * combination with {@link term.action action rules}. There are two 
     * types of locks; pessimistic and optimistic locks. Descriptions below are
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
     * For optimistic locking apf can run as if there would be no locking. 
     * Changed data is sent to the server and is either successfully saved or
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
     *  <a:rename set="..." lock="{comm.lockFile([@path], unlock)}" />
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
     * Note: APF understands the status codes specified in RFC4918 for the locking implementation
     *       {@link http://tools.ietf.org/html/rfc4918#section-9.10.6}
     */
     
    /**
     *  Start the specified action, does optional locking and can be offline aware
     *  - or for optimistic locking it will record the timestamp (a setting
     *    <a:appsettings locking="optimistic"/>)
     *  - During offline work, optimistic locks will be handled by taking the
     *    timestamp of going offline
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
        if (this.disabled || this.liveedit && name != "edit")
            return false;

        var actionRule = this.$actions && this.$actions.getRule(name, xmlContext);
        if (!actionRule && apf.config.autoDisableActions && this.$actions) {
            //#ifdef __DEBUG
            if (!xmlContext) {
                apf.console.warn("Tried starting new action but no xml \
                    context was specified.");
            }
            else {
                apf.console.warn("Tried starting new action but no '" + name 
                    + "' action rule was found.");
            }
            //#endif
            
            return false;
        }

        var bHasOffline = typeof apf.offline != "undefined";
        //#ifdef __WITH_OFFLINE
        if (bHasOffline && !apf.offline.canTransact())
            return false;
        //#endif

        if (this.dispatchEvent(name + "start", {
            xmlContext: xmlContext
        }) === false)
            return false;

        //#ifdef __WITH_LOCKING

        //Requesting a lock, whilst we still have one open
        if (this.$lock[name] && !this.$lock[name].stopped) {
            //#ifdef __DEBUG
            apf.console.warn("Starting new action whilst previous \
                action wasn't terminated:" + name);
            //#endif

            this.$stopAction(); //or should we call: fRollback.call(this, xmlContext);
        }

        //Check if we should attain a lock (when offline, we just pretend to get it)
        var lockInstruction = actionRule ? actionRule.lock : null;
        if ((bHasOffline && (!apf.offline.enabled || !apf.offline.onLine)) && lockInstruction) {
            var curLock = this.$lock[name] = {
                    start      : bHasOffline && !apf.offline.onLine
                                    ? apf.offline.offlineTime
                                    : new Date().getISOTime(),
                    stopped    : false,
                    xmlContext : xmlContext,
                    instr      : lockInstruction,
                    rollback   : fRollback
                },
                _self = this;

            //Execute pessimistic locking request
            apf.saveData(lockInstruction, {
              xmlNode  : xmlContext,
              unlock   : false,
              callback : function(data, state, extra){
                    if (state == apf.TIMEOUT && extra.retries < apf.maxHttpRetries)
                        return extra.tpModule.retry(extra.id);
    
                    if (state == apf.SUCCESS) {
                        _self.dispatchEvent("locksuccess", apf.extend({
                            state   : extra.status,
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
    
                        //Cancel the action, because we didnt get a lock
                        fRollback.call(_self, xmlContext);
                        
                        _self.dispatchEvent("lockfailed", apf.extend({
                            state   : extra.status,
                            bubbles : true
                        }, extra));
                    }
                }
              });
        }
        //#endif

        this.$actionsLog[name] = xmlContext;

        return true;
    };

    //#ifdef __WITH_RDB
    // @todo think about if this is only for rdb
    this.addEventListener("xmlupdate", function(e){
        if (apf.xmldb.disableRDB != 2)
            return;

        for (var name in this.$actionsLog) {
            if (apf.isChildOf(this.$actionsLog[name], e.xmlNode, true)) {
                //this.$stopAction(name, true);
                this.$actionsLog[name].rollback.call(this, this.$actionsLog[name].xmlContext);
            }
        }
    });
    //#endif

    this.$stopAction = function(name, isCancelled, curLock){
        delete this.$actionsLog[name];

        //#ifdef __WITH_LOCKING
        if (!curLock)
            curLock = this.$lock[name];

        if (curLock && !curLock.stopped) {
            curLock.stopped = true;

            //The resource needs to unlock when the action is cancelled
            if (isCancelled && curLock.retrieved) {
                //Execute unlocking request
                var _self = this;
                apf.saveData(curLock.instr, {
                  xmlNode    : curLock.xmlContext,
                  unlock     : true,
                  callback   : function(data, state, extra){
                        if (state == apf.TIMEOUT && extra.retries < apf.maxHttpRetries)
                            return extra.tpModule.retry(extra.id);

                        //Do we care if an unlock failed/succeeded?
                        _self.dispatchEvent(
                            (state == apf.SUCCESS
                                ? "unlocksuccess"
                                : "unlockfailed"),
                            apf.extend({
                                state   : extra.status,
                                bubbles : true
                            }, extra));
                    }
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
     *   setValueByXpath    sets the nodeValue of an xml node whiche is selected
     *                      by an xpath statement. Arguments are [xmlNode, xpath, value]
     *   multicall          calls multiple of these actions. Arguments is an array
     *                      of argument arrays for these actions each with a func
     *                      property which is the name of the action.
     * @param {Array}       args          the arguments to the function specified
     *                                    in <code>atAction</code>.
     * @param {String}      action        the name of the action rule defined in
     *                                    actions for this element.
     * @param {XMLElement}  xmlNode       the context for the action rules.
     * @param {Boolean}     [noevent]     whether or not to call events.
     * @param {XMLElement}  [contextNode] the context node for action processing
     *                                    (such as RPC calls). Usually the same
     *                                    as <code>xmlNode</code>
     * @return {Boolean} specifies success or failure
     * @see  element.smartbinding
     */
    this.$executeAction = function(atAction, args, action, xmlNode, noevent, contextNode, multiple){
        //#ifdef __WITH_OFFLINE
        if (typeof apf.offline != "undefined" && !apf.offline.canTransact())
            return false;
        //#endif

        //#ifdef __DEBUG
        apf.console.info("Executing action '" + action + "' for " + (this.name || "")
                         + " [" + (this.localName || "") + "]");
        //#endif

        //Get Rules from Array
        var rule = this.$actions && this.$actions.getRule(action, xmlNode);
        if (!rule && this.$actions && apf.config.autoDisableActions 
          && "action|change".indexOf(action) == -1) {
            apf.console.warn("Could not execute action '" + action + "'. \
              No valid action rule was found and auto-disable-actions is enabled");
            
            return false;
        }
        
        //#ifdef __WITH_LOCKING
        var curLock = this.$stopAction(action);
        //#endif
        
        var newMultiple;
        if (multiple) {
            newMultiple = [];
            for (var k = multiple.length - 1; k >= 0; k--) {
                newMultiple.unshift({
                    xmlActionNode : rule && rule[4],
                    amlNode       : this,
                    selNode       : multiple[k],
                    xmlNode       : multiple[k]
                })
            }
        }

        //@todo apf3.0 Shouldn't the contextNode be made by the match
        var ev = new apf.AmlEvent("before" + action.toLowerCase(), {
            action        : atAction,
            args          : args,
            xmlActionNode : rule,
            amlNode       : this,
            selNode       : contextNode,
            multiple      : newMultiple || false
            //#ifdef __WITH_LOCKING
            ,timestamp    : curLock
                              ? curLock.start
                              : new Date().getUTCTime()
            //#endif
        });

        //Call Event and cancel if it returns false
        if (!noevent) {
            //Allow the action and arguments to be changed by the event
            if (this.dispatchEvent(ev.name, null, ev) === false)
                return false;
            
            delete ev.currentTarget;
        }

        //Call ActionTracker and return ID of Action in Tracker
        var at      = this.getActionTracker(); 
        if (!at)// This only happens at destruction of apf
            return UndoObj;
        
        var UndoObj = at.execute(ev);
        ev.xmlNode = UndoObj.xmlNode;
        ev.undoObj = UndoObj;

        //Call After Event
        if (!noevent) { //@todo noevent is not implemented for before.. ???
            ev.name         = "after" + action.toLowerCase();
            ev.cancelBubble = false;
            delete ev.returnValue;
            delete ev.currentTarget;
            this.dispatchEvent(ev.name, null, ev);
        }

        return UndoObj;
    };

    /**
     * Executes an action based on the set name and the new value
     * @param {String}      atName   the name of the action rule defined in actions for this element.
     * @param {String}      setName  the name of the binding rule defined in bindings for this element.
     * @param {XMLElement}  xmlNode  the xml element to which the rules are applied
     * @param {String}      value    the new value of the node
     */
    this.$executeSingleValue = function(atName, setName, xmlNode, value, getArgList){
        var xpath, args, rule = this.$getBindRule(setName, xmlNode);
        
        //recompile bindrule to create nodes
        if (!rule) {
            //#ifdef __DEBUG
            if (this.$getBindRule(setName))
                throw new Error("There is no rule that matches the xml node for this operation.\
                                 Please make sure you are matching a node and using the value to \
                                 specify it's value <a:" + setName + " match='person' \
                                 value='[@name]' /> : " + xmlNode.xml); //@todo make apf Error
            else
            //#endif
                return false;
        }

        var compiled;
        ["valuematch", "match", "value"].each(function(type){
            if (!rule[type] || compiled)
                return;
            
            compiled = rule["c" + type]; //cvaluematch || (rule.value ? rule.cvalue : rule.cmatch);
            if (!compiled)
                compiled = rule.compile(type);
            
            if (compiled.type != 3)
                compiled = null;
        });
        
        //#ifdef __DEBUG
        if (!compiled)
            throw new Error("Cannot create from rule that isn't a single xpath"); //@todo make apf Error
        //#endif

        var atAction, model, node,
            sel        = compiled.xpaths, //get first xpath
            shouldLoad = false;
        
        if (sel[0] == "#" || sel[1] == "#") {
            var m = (rule.cvalue3 || (rule.cvalue3 = apf.lm.compile(rule.value, {
                xpathmode: 5
            })))(xmlNode);
            
            model = m.model && m.model.$isModel && m.model;
            if (model) {
                node  = model.queryNode(m.xpath);
                xmlNode = model.data;
            }
            else {
                model = apf.xmldb.findModel(m.model);
                node  = m.model.selectSingleNode(m.xpath);
                xmlNode = m.model;
            }

            sel[1] = m.xpath;
        }
        else {
            //#ifdef __WITH_NAMESERVER
            model = sel[0] && apf.nameserver.get("model", sel[0]) || this.$model,
            node  = model
                ? model.queryNode(sel[1])
                : (xmlNode || this.xmlRoot).selectSingleNode(sel[1]);
            if (model && !xmlNode)
                xmlNode = model.data; //@experimental, after changing this, please run test/test_rename_edge.html
            //#endif
        }

        if (node) {
            if (apf.queryValue(node) == value) return; // Do nothing if value is unchanged

            atAction = (node.nodeType == 1 || node.nodeType == 3
                || node.nodeType == 4) ? "setTextNode" : "setAttribute";
            args = (node.nodeType == 1)
                ? [node, value]
                : (node.nodeType == 3 || node.nodeType == 4
                    ? [node.parentNode, value]
                    : [node.ownerElement || node.selectSingleNode(".."), node.nodeName, value]);
        }
        else {
            if (!this.$createModel)
                return false;

            atAction = "setValueByXpath";
            xpath    = sel[1];

            if (!xmlNode) {
                //Assuming this component is connnected to a model
                if (!model)
                    model = this.getModel();
                if (model) {
                    if (!model.data)
                        model.load("<data />");
    
                    xpath   = (model.getXpathByAmlNode(this) || ".")
                        + (xpath && xpath != "." ? "/" + xpath : "");
                    xmlNode = model.data;
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
        
        if (getArgList) {
            return {
                action : atAction,
                args   : args
            };
        }

        //Use Action Tracker
        var result = this.$executeAction(atAction, args, atName, xmlNode);
        
        if (shouldLoad)
            this.load(xmlNode.selectSingleNode(xpath));
        
        return result;
    };
    
    /**
     * Changes the value of this element.
     * @action
     * @param  {String} [string] the new value of this element.
     * @todo apf3.0 maybe not for multiselect?? - why is clearError handling not
     *       in setProperty for value
     */
    this.change = function(value, force){
        // #ifdef __WITH_VALIDATION
        if (this.errBox && this.errBox.visible && this.isValid && this.isValid())
            this.clearError();
        // #endif

        // #ifdef __WITH_DATABINDING
        //Not databound
        if (!this.xmlRoot && !this.$createModel || !(this.$mainBind == "value" 
          && this.hasFeature(apf.__MULTISELECT__) 
            ? this.$attrBindings["value"] 
            : this.$hasBindRule(this.$mainBind))) {
        // #endif
            if (!force && value === this.value 
              || this.dispatchEvent("beforechange", {value : value}) === false)
                return false;

            //@todo in theory one could support actions
            //@todo disabled below, because it gives unexpected behaviour when 
            //form elements are used for layout and other UI alterations
            /*this.getActionTracker().execute({
                action        : "setProperty",
                args          : [this, "value", value, false, true],
                amlNode       : this
            });*/
            this.setProperty("value", value);

            return this.dispatchEvent("afterchange", {value : value});
        // #ifdef __WITH_DATABINDING
        }
        
        var valueRule = this.$attrBindings["eachvalue"] && "eachvalue" 
            || this.$bindings["value"] && "value"
            || this.$hasBindRule("caption") && "caption";
          
        if (value === (valueRule != "value" && (this.xmlRoot 
          && this.$applyBindRule("value", this.xmlRoot, null, true)) 
          || this.value))
            return false;

        this.$executeSingleValue("change", this.$mainBind, this.xmlRoot, value);
        // #endif
    };
    
    this.$booleanProperties["render-root"] = true;
    this.$supportedProperties.push("create-model", "actions");
    
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
     *  <a:bar>
     *      <a:label>Name</a:label>
     *      <a:textbox value="[name]" required="true" />
     * 
     *      <a:label>Address</a:label>
     *      <a:textarea value="[address]" />
     * 
     *      <a:label>Country</a:label>
     *      <a:dropdown 
     *        value   = "[mdlForm::country]" 
     *        model   = "countries.xml" 
     *        each    = "[country]" 
     *        caption = "[@name]" />
     *      <a:button action="submit">Submit</a:button>
     *  </a:bar>
     * </code>
     */
    this.$propHandlers["create-model"] = function(value){
        this.$createModel = value;
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (typeof this["create-model"] == "undefined" 
          && !this.$setInheritedAttribute("create-model")) {
            this.$createModel = true;
        }
    });
};

apf.config.$inheritProperties["create-model"] = 1;

//#endif