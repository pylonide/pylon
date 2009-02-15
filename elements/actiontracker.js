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

// #ifdef __WITH_ACTIONTRACKER

/**
 * Element keeping track of all user actions that are triggered in GUI
 * elements. This element maintains a stack of actions and knows how to
 * undo & redo them. It is aware of how to synchronize the changes to the
 * backend data store. With offline support enabled the actiontracker can
 * serialize both its undo stack and its execution stack such that these can
 * be kept in between application sessions. This means that a user will be able
 * to close the application and start it at a later date whilst keeping his or
 * her entire undo/redo stack. Furthermore all changes done whilst being offline
 * will be synchronized to the data store when the application comes online.
 *
 * @constructor
 *
 * @define actiontracker
 * @addnode smartbinding, global
 * @event afterchange   Fires after a change to the action stack occurs
 * @event beforechange  Fires before a change to the action stack will occur
 *   cancellable:    Prevents the execution of the action
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.8
 */
jpf.actiontracker = function(parentNode){
    jpf.makeClass(this);

    var _self       = this;
    var stackDone   = [];
    var stackUndone = [];
    var execStack   = [];
    var lastExecStackItem;

    this.realtime   = true;
    this.undolength = 0;
    this.redolength = 0;

    //#ifdef __WITH_JMLDOM_FULL
    this.tagName    = "actiontracker";
    if (parentNode)
        this.parentNode = parentNode;
    this.inherit(jpf.JmlDom); /** @inherits jpf.JmlDom */
    //#endif

    /**
     * @attribute {Number}  !undolength the length of the undo stack.
     * @attribute {Number}  !redolength the length of the redo stack.
     * @attribute {Boolean} realtime    whether changes are immediately send to
     * the datastore, or held back until purge() is called.
     */
    this.$booleanProperties = {};
    this.$booleanProperties["realtime"] = true;
    this.$supportedProperties = ["realtime", "undolength", "redolength", "alias"];
    this.$handlePropSet = function(prop, value, force){
        //Read only properties
        switch (prop) {
            case "undolength":
                this.undolength = stackDone.length;
                break;
            case "redolength":
                this.redolength = stackUndone.length;
                break;
            case "alias":
                jpf.JmlElement.propHandlers.alias.call(this, value);
            default:
                this[prop] = value;
        }
    };
    
    
    this.loadJml = function(x){
        this.$jml = x;
        
        //Events
        var value, a, i, attr = x.attributes;
        for (i = 0; i < attr.length; i++) {
            a = attr[i];
            if (a.nodeName.indexOf("on") == 0) {
                this.addEventListener(a.nodeName, new Function(a.nodeValue));
            }
            else {
                value = this.$booleanProperties[a.nodeName]
                  ? jpf.isTrue(a.nodeValue)
                  : a.nodeValue;
                this.setProperty(a.nodeName, value);
            }
        }
    }

    /**
     * Adds a new action handler which can be used by any actiontracker.
     * @param {String} action Specifies the name of the action
     * @param {Function} func Specifies the function that is executed when
     *                        Executing or undoing the action.
     */
    this.define = function(action, func){
        jpf.actiontracker.actions[action] = func;
    };

    /**
     * Searches for the actiontracker that functions as a parent for this one.
     * @return {ActionTracker} Returns the parent actiontracker
     */
    this.getParent = function(){
        return this.parentNode && this.parentNode.getActionTracker
            ? this.parentNode.getActionTracker(true)
            : (jpf.window.$at != this
                ? jpf.window.$at
                : null);
    };

    /**
     * Executes an action, which later can be undone and of which the execution
     * can be synchronized to the data store.
     * @param {Object} options the details of the execution.
     *   Properties:
     *   {String}  action           the action to be executed
     *   {Array}   args             the arguments for the action
     *   {XmlNode} [xmlActionNode]  the rules to synchronize the changes to the server for both execution and undo. (See action rules)
     *   {JmlNode} [jmlNode]        the GUI element that triggered the action
     *   {XmlNode} [selNode]        the relevant data node to which the action node works on
     *   {Number}  [timestamp]      the start of the action that is now executed.
     */
    this.execute = function(options){
        if (this.dispatchEvent("beforechange", options) === false)
            return;

        //Execute action
        var UndoObj = new jpf.UndoData(options, this);
        if (options.action)
            jpf.actiontracker.actions[options.action](UndoObj, false, this);

        //Add action to stack
        UndoObj.id = stackDone.push(UndoObj) - 1;

        this.setProperty("undolength", stackDone.length);

        //#ifdef __WITH_OFFLINE_STATE && __WITH_OFFLINE_TRANSACTIONS
        var t = jpf.offline.transactions;
        if (t.doStateSync) {
            t.addAction(this, UndoObj, "undo");
            t.clearActions(this, "redo");
        }
        //#endif

        //Respond
        this.$addToQueue(UndoObj, false);

        //Reset Redo Stack
        stackUndone.length = 0;
        this.setProperty("redolength", stackUndone.length);

        //return stack id of action
        return UndoObj;
    };

    //deprecated??
    this.$addActionGroup = function(done, rpc){
        var UndoObj = new jpf.UndoData("group", null, [
            //@todo jpf.copyArray is deprecated and no longer exists
            jpf.copyArray(done, UndoData), jpf.copyArray(rpc, UndoData)
        ]);
        stackDone.push(UndoObj);
        this.setProperty("undolength", stackDone.length);

        this.dispatchEvent("afterchange", {action: "group", done: done});
    };

    /**
     * Synchronizes all held back changes to the data store.
     * @todo I don't really know if this stacking into the parent is
     * still used, for instance for jpf.Transactions. please think
     * about it.
     */
    this.purge = function(nogrouping, forcegrouping){//@todo, maybe add noReset argument
        //var parent = this.getParent();

        //@todo Check if this still works together with transactions
        if (true) {//nogrouping && parent
            if (execStack.length) {
                execStack[0].undoObj.saveChange(execStack[0].undo, this);
                lastExecStackItem = execStack[execStack.length - 1];
            }
        }
        else if (parent) {
            /*
                Copy Stacked Actions as a single
                grouped action to parent ActionTracker
            */
            //parent.$addActionGroup(stackDone, stackRPC);
            
            //Reset Stacks
            this.reset();
        }
    };

    /**
     * Empties the action stack. After this method is run running undo
     * or redo will not do anything.
     */
    this.reset = function(){
        stackDone.length = stackUndone.length;

        this.setProperty("undolength", 0);
        this.setProperty("redolength", 0);

        this.dispatchEvent("afterchange", {action: "reset"});
    };

    /**
     * Revert the most recent action on the action stack
     */
    this.undo = function(id, single, rollback){
        change.call(this, id, single, true, rollback);
    };

    /**
     * Re-executes the last undone action
     */
    this.redo = function(id, single, rollback){
        change.call(this, id, single, false, rollback);
    };

    function change(id, single, undo, rollback){
        var undoStack = undo ? stackDone : stackUndone; //local vars switch
        var redoStack = undo ? stackUndone : stackDone; //local vars switch

        if (!undoStack.length) return;

        if (single) {
            var UndoObj = undoStack[id];
            if (!UndoObj) return;

            //#ifdef __DEBUG
            if (id != undoStack.length - 1) { //@todo callstack got corrupted?
                throw new Error("callstack got corrupted");
            }
            //#endif
            undoStack.length--;
            redoStack.push(UndoObj); //@todo check: moved from outside if(single)

            //#ifdef __WITH_OFFLINE_STATE && __WITH_OFFLINE_TRANSACTIONS
            if (jpf.offline.transactions.doStateSync) {
                jpf.offline.transactions.removeAction(this, true, undo ? "undo" : "redo");
                jpf.offline.transactions.addAction(this, UndoObj, undo ? "redo" : "undo");
            }
            //#endif

            //Undo Client Side Action
            if (UndoObj.action)
                jpf.actiontracker.actions[UndoObj.action](UndoObj, undo, this);

            if (!rollback)
                this.$addToQueue(UndoObj, undo);

            //Set Changed Value
            this.setProperty("undolength", stackDone.length);
            this.setProperty("redolength", stackUndone.length);
            return UndoObj;
        }

        //#ifdef __DEBUG
        jpf.console.info("Executing " + (undo ? "undo" : "redo"));
        //#endif

        //Undo the last X places - where X = id;
        if (id == -1)
            id = undoStack.length;

        if (!id)
            id = 1;

        var i = 0;
        while (i < id && undoStack.length > 0) {
            if (!undoStack[undoStack.length - 1]) {
                undoStack.length--;

                //#ifdef __DEBUG
                jpf.console.error("The actiontracker is in an invalid \
                                   state. The entire undo and redo stack will \
                                   be cleared to prevent further corruption\
                                   This is a serious error, please contact \
                                   a specialist.");
                //#endif

                stackDone = [];
                stackUndone = [];

                //#ifdef __WITH_OFFLINE_STATE && __WITH_OFFLINE_TRANSACTIONS
                var t = jpf.offline.transactions;
                if (t.doStateSync)
                    t.clear("undo|redo");
                //#endif

                return false;
            }
            else {
                change.call(this, undoStack.length - 1, true, undo);
                i++;
            }
        }

        this.dispatchEvent("afterchange", {
            action   : undo ? "undo" : "redo",
            rollback : rollback
        })
    }

    this.$receive = function(data, state, extra, UndoObj, callback){
        if (state == jpf.TIMEOUT
          && extra.tpModule.retryTimeout(extra, state, this) === true)
            return true;

        if (state != jpf.SUCCESS) {
            //Tell anyone that wants to hear about our failure :(
            if (this.dispatchEvent("actionfail", jpf.extend(extra, {
                state   : state,
                message : "Could not sent Action RPC request for control "
                            + this.name
                            + "[" + this.tagName + "] \n\n"
                            + extra.message,
                bubbles : true
            })) === false) {

                //#ifdef __DEBUG
                jpf.console.warn("You have cancelled the automatic undo \
                    process! Please be aware that if you don't retry this call \
                    the queue will fill up and none of the other actions will \
                    be sent through.");
                //#endif

                return true; //don't delete the call from the queue
            }

            /*
                Undo the failed action. We're only undoing one item of the stack
                if the developer has told us using the @ignore-fail attribute
                that it's ok, the data will be safe if we undo only this one.

                @todo: Shouldn't the stackUndone be cleared after this... or
                       is it intuitive enough for the user that redo will
                       let the user retry the action??
            */
            if (!jpf.offline.reloading)
                this.undo(UndoObj.id, extra.userdata, true);

            if (callback)
                callback(!extra.userdata);

            if (!extra.userdata) {
                /*
                    Clearing the execStack, none of the changes will be send to
                    the server. This seems the best way right now and is related
                    to the todo item above.
                    
                    @todo: Think about adding ignore-fail to settings and 
                           actiontracker.
                */
                execStack = [];
                
                throw new Error(jpf.formatErrorString(0, this, 
                    "Executing action",
                    "Error sending action to the server:\n"
                    + (extra.url ? "Url:" + extra.url + "\n\n" : "") 
                    + extra.message));
                
                return;
            }
        }
        else {
            //Tell anyone that wants to hear about our success
            this.dispatchEvent("actionsuccess", jpf.extend(extra, {
                state   : state,
                bubbles : true
            }, extra));

            //Sent out the RSB message, letting friends know of our change
            UndoObj.processRsbQueue();

            if (callback)
                callback();
        }

        this.$queueNext(UndoObj, callback);
    };

    this.$addToQueue = function(UndoObj, undo, isGroup){
        /*
            Remove item from the execution stack if it's not yet executed
            to keep the stack clean
        */
        if (execStack.length && !UndoObj.state
          && execStack[execStack.length - 1].undoObj == UndoObj) {
            execStack.length--;

            // #ifdef __WITH_OFFLINE_TRANSACTIONS
            if (jpf.offline.transactions.enabled) //We want to maintain the stack for sync
                jpf.offline.transactions.removeAction(this, true, "queue");
            //#endif

            UndoObj.clearRsbQueue();

            return;
        }

        // Add the item to the queue
        if (isGroup) { //@todo currently no offline support for grouped actions
            var qItem = execStack.shift();
            for (var i = 0; i < UndoObj.length; i++) {
                execStack.unshift({
                    undoObj : UndoObj[i],
                    undo   : undo
                });
            }
            if (qItem)
                execStack.unshift(qItem);

            return;
        }

        var qItem = {
            undoObj : UndoObj.preparse(undo, this),
            undo   : undo

        };
        execStack.push(qItem) - 1;

        // #ifdef __WITH_OFFLINE_TRANSACTIONS
        if (jpf.offline.transactions.enabled) //We want to maintain the stack for sync
            jpf.offline.transactions.addAction(this, qItem, "queue");
        //#endif

        //The queue was empty, yay! we're gonna exec immediately
        if (execStack.length == 1 && this.realtime)
            UndoObj.saveChange(undo, this);
    };

    this.$queueNext = function(UndoObj, callback){
        /*
            These thow checks are so important, that they are also executed
            in release mode.
        */
        if (execStack[0].undoObj != UndoObj){
            throw new Error(jpf.formatErrorString(0, this, "Executing Next \
                action in queue", "The execution stack was corrupted. This is \
                a fatal error. The application should be restarted. You will \
                lose all your changes. Please contact the administrator."));
        }

        //Reset the state of the undo item
        UndoObj.state = null;

        //Remove the action item from the stack
        var lastItem = execStack.shift();

        // #ifdef __WITH_OFFLINE_TRANSACTIONS
        if (jpf.offline.transactions.enabled) //We want to maintain the stack for sync
            jpf.offline.transactions.removeAction(this, null, "queue");
        //#endif

        //Check if there is a new action to execute;
        if (!execStack[0] || lastItem == lastExecStackItem)
            return;

        // @todo you could optimize this process by using multicall, but too much for now

        //Execute action next in queue
        execStack[0].undoObj.saveChange(execStack[0].undo, this, callback);
    };

    //#ifdef __WITH_OFFLINE_TRANSACTIONS
    this.$loadQueue = function(stack, type){
        if (type == "queue") {
            //#ifdef __DEBUG
            if (execStack.length) { //@todo
                throw new Error("oops");
            }
            //#endif

            execStack = stack;
        }

        //#ifdef __WITH_OFFLINE_STATE && __WITH_OFFLINE_TRANSACTIONS
        else if (type == "undo") {
            //#ifdef __DEBUG
            if (stackDone.length) { //@todo
                throw new Error("oops");
            }
            //#endif

            stackDone = stack;
        }
        else if (type == "redo") {
            //#ifdef __DEBUG
            if (stackUndone.length) { //@todo
                throw new Error("oops");
            }
            //#endif

            stackUndone = stack;
        }
        //#endif

        //#ifdef __DEBUG
        else { //@todo
            throw new Error("unknown");
        }
        //#endif
    };

    this.$getQueueLength = function(){
        return execStack.length;
    };

    this.$startQueue = function(callback){
        if (!execStack[0] || execStack[0].undoObj.state) //@todo This is gonna go wrong, probably
            return false;

        //Execute action next in queue
        execStack[0].undoObj.saveChange(execStack[0].undo, this, callback);
    };
    //#endif
};

/**
 * @constructor
 */
jpf.UndoData = function(settings, at){
    this.tagName = "UndoData";
    this.extra   = {};
    jpf.extend(this, settings);

    if (at)
        this.at = at;

    //Copy Constructor
    else if (settings && settings.tagName == "UndoData") {
        this.args    = settings.args.slice();
        this.rsbArgs = settings.rsbArgs.slice();
    }
    //Constructor
    else {
        /*
            @todo: Please check the requirement for this and how to solve
            this. Goes wrong with multiselected actions!
        */
        this.selNode = this.selNode || (this.action == "removeNode"
            ? this.args[0]
            : (this.jmlNode
                ? this.jmlNode.selected
                : null));
    }

    var options, _self = this;

    this.getActionXmlNode = function(undo){
        if (!this.xmlActionNode)  return false;
        if (!undo) return this.xmlActionNode;

        var xmlNode = $xmlns(this.xmlActionNode, "undo", jpf.ns.jml)[0];
        if (!xmlNode)
            xmlNode = this.xmlActionNode;

        return xmlNode;
    };

    // #ifdef __WITH_OFFLINE_TRANSACTIONS
    var serialState;
    this.$export = function(){
        if (serialState) //Caching
            return serialState;

        serialState = {
            action    : this.action,
            rsbModel  : this.rsbModel ? this.rsbModel.name : null,
            rsbQueue  : this.rsbQueue,
            at        : this.at.name,
            timestamp : this.timestamp,
            parsed    : options ? options.parsed : null, //errors when options is not defined
            userdata  : options ? options.userdata : null,
            extra     : {}
        };

        //this can be optimized
        var rsb = this.rsbModel
            ? this.rsbModel.rsb
            : jpf.remote;

        //Record arguments
        var sLookup = jpf.offline.sLookup || (jpf.offline.sLookup = {});
        if (!sLookup.count) sLookup.count = 0;
        var xmlNode, xmlId, args = this.args.slice();

        for (var i = 0; i < args.length; i++) {
            if(args[i] && args[i].nodeType) {
                if (!serialState.argsModel) {
                    var model = jpf.nameserver.get("model",
                        jpf.xmldb.getXmlDocId(args[i]));

                    if(model)
                        serialState.argsModel = model.name || model.uniqueId;
                }

                args[i] = serializeNode(args[i]);
            }
        }

        var item, name;
        for (name in this.extra) {
            item = this.extra[name];
            serialState.extra[name] = item && item.nodeType
                ? serializeNode(item)
                : item;
        }

        //check this state and the unserialize function state and check the args and extra props
        serialState.args = args;

        //#ifdef __DEBUG
        if (!serialState.argsModel)
            jpf.console.warn("Could not determine model for serialization \
                of undo state. Will not be able to undo the state when the \
                server errors. This creates a potential risk of loosing \
                all changes on sync!")
        //#endif

        return serialState;

        function serializeNode(xmlNode){
            /*
                If it's an attribute or directly connected to the root of the
                model we'll just record the xpath
            */
            if (xmlNode.nodeType == 2
              || jpf.xmldb.isChildOf(model.data, xmlNode, true)) {
                xmlId = xmlNode.getAttribute(jpf.xmldb.xmlIdTag);
                return {
                    xpath  : rsb.xmlToXpath(xmlNode, model.data, true),
                    lookup : xmlId
                };
            }
            // So we've got a disconnected branch, lets serialize it
            else {
                var contextNode = xmlNode;
                while(contextNode.parentNode && contextNode.parentNode.nodeType == 1) //find topmost parent
                    contextNode = xmlNode.parentNode;

                xmlId = contextNode.getAttribute(jpf.xmldb.xmlIdTag);
                if (!xmlId) {
                    xmlId = "serialize" + sLookup.count++;
                    contextNode.setAttribute(jpf.xmldb.xmlIdTag, xmlId);
                }

                var obj = {
                    xpath  : rsb.xmlToXpath(xmlNode, contextNode, true),
                    lookup : xmlId
                }

                if (!sLookup[xmlId]) {
                    contextNode.setAttribute(jpf.xmldb.xmlDocTag,
                        jpf.xmldb.getXmlDocId(contextNode));

                    sLookup[xmlId] = contextNode;
                    obj.xml        = contextNode.xml || contextNode.serialize();
                }

                return obj;
            }
        }
    };

    this.$import = function(){
        if (this.rsbModel)
            this.rsbModel = jpf.nameserver.get("model", this.rsbModel);

        if (this.argsModel) {
            var model = jpf.nameserver.get("model", this.argsModel)
                || jpf.lookup(this.argsModel);

            //Record arguments
            var sLookup = jpf.offline.sLookup || (jpf.offline.sLookup = {});
            if (!sLookup.count) sLookup.count = 0;

            var args = this.args;
            var rsb  = this.rsbModel
                ? this.rsbModel.rsb
                : jpf.remote;

            for (var xmlNode, i = 0; i < args.length; i++) {
                if(args[i] && args[i].xpath)
                    args[i] = unserializeNode(args[i], model);
            }

            var item, name;
            for (name in this.extra) {
                item = this.extra[name];
                if(item && item.xpath)
                    this.extra[name] = unserializeNode(item, model);
            }

            this.args = args;
        }

        options = {
            undoObj   : this,
            userdata  : this.userdata,
            parsed    : this.parsed
        }

        //#ifdef __WITH_LOCKING
        if (this.timestamp) {
            options.actionstart = this.timestamp;
            options.headers     = {"X-JPF-ActionStart": this.timestamp};
        }
        //#endif

        return this;

        function unserializeNode(xmlSerial, model){
            if (xmlSerial.xml) {
                xmlNode = jpf.xmldb.getXml(xmlSerial.xml);
                sLookup[xmlNode.getAttribute(jpf.xmldb.xmlIdTag)] = xmlNode;
            }
            else if (xmlSerial.lookup) {
                xmlNode = sLookup[xmlSerial.lookup];

                //#ifdef __DEBUG
                if (!xmlSerial.xpath) { //@todo
                    throw new Error("Serialization error");
                }
                //#endif
            }
            else xmlNode = null;

            return rsb.xpathToXml(xmlSerial.xpath, xmlNode || model.data);
        }
    };
    //#endif

    //Send RSB Message..
    this.processRsbQueue = function(){
        if (this.rsbModel)
            this.rsbModel.rsb.processQueue(this);
    };

    this.clearRsbQueue = function(){
        this.rsbQueue = null;
        this.rsbModel = null;
    };

    this.saveChange = function(undo, at, callback){
        //Grouped undo/redo support
        if (this.action == "group") {
            var rpcNodes = this.args[1];
            at.$addToQueue(rpcNodes, undo, true);
            return at.$queueNext(this);
        }

        var xmlActionNode = this.getActionXmlNode(undo);
        if (!xmlActionNode || !xmlActionNode.getAttribute("set"))
            return at.$queueNext(this);

        this.state = undo ? "restoring" : "saving";

        //#ifdef __DEBUG
        if (!options || options.preparse != -1) {//@todo test if this ever happens
            throw new Error("Hmm, so sometimes preparse isn't called");
        }
        //#endif
        options.preparse = false;

        jpf.saveData(xmlActionNode.getAttribute("set"), null, options,
            function(data, state, extra){
                return at.$receive(data, state, extra, _self, callback);
            }, {ignoreOffline: true});
    };

    this.preparse = function(undo, at, multicall){
        var xmlActionNode = this.getActionXmlNode(undo);
        if (!xmlActionNode || !xmlActionNode.getAttribute("set"))
            return this;

        options = jpf.extend({
            //undoObj   : this,
            userdata  : jpf.isTrue(xmlActionNode.getAttribute("ignore-fail")),
            multicall : multicall,
            preparse  : true
        }, this.extra);

        //#ifdef __WITH_LOCKING
        if (this.timestamp) {
            options.actionstart = this.timestamp;
            options.headers     = {"X-JPF-ActionStart": this.timestamp};
        }
        //#endif

        jpf.saveData(xmlActionNode.getAttribute("set"),
            this.selNode || this.xmlNode, options); //@todo please check if at the right time selNode is set

        return this;
    };
};

/**
 * Default actions, that are known to the actiontracker
 * @todo test if .extra has impact on speed
 */
jpf.actiontracker.actions = {
    "setTextNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Set Text Node
        if (!undo)
            jpf.xmldb.setTextNode(q[0], q[1], q[2], UndoObj);
        else //Undo Text Node Setting
            jpf.xmldb.setTextNode(q[0], UndoObj.extra.oldValue, q[2]);
    },

    "setAttribute" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Set Attribute
        if (!undo) {
            //Set undo info
            UndoObj.extra.name = q[1];
            UndoObj.extra.oldValue = q[0].getAttribute(q[1]);

            jpf.xmldb.setAttribute(q[0], q[1], q[2], q[3], UndoObj);
        }
        // Undo Attribute Setting
        else {
            if (!UndoObj.extra.oldValue)
                jpf.xmldb.removeAttribute(q[0], q[1]);
            else
                jpf.xmldb.setAttribute(q[0], q[1], UndoObj.extra.oldValue, q[3]);
        }
    },

    "removeAttribute" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Remove Attribute
        if (!undo) {
            // Set undo info
            UndoObj.extra.name = q[1];
            UndoObj.extra.oldValue = q[0].getAttribute(q[1]);

            jpf.xmldb.removeAttribute(q[0], q[1], q[2], UndoObj);
        }
        //Undo Attribute Removal
        else
            jpf.xmldb.setAttribute(q[0], q[1], UndoObj.extra.oldValue, q[2]);
    },

    /**
     * @deprecated Use "multicall" from now on
     */
    "setAttributes" : function(UndoObj, undo){
        var prop, q = UndoObj.args;

        // Set Attribute
        if (!undo) {
            // Set undo info
            var oldValues = {};
            for (prop in q[1]) {
                oldValues[prop] = q[0].getAttribute(prop);
                q[0].setAttribute(prop, q[1][prop]);
            }
            UndoObj.extra.oldValues = oldValues;

            jpf.xmldb.applyChanges("attribute", q[0], UndoObj);
        }
        //Undo Attribute Setting
        else {
            for (prop in UndoObj.oldValues) {
                if (!UndoObj.extra.oldValues[prop])
                    q[0].removeAttribute(prop);
                else
                    q[0].setAttribute(prop, UndoObj.extra.oldValues[prop]);
            }

            jpf.xmldb.applyChanges("attribute", q[0], UndoObj);
        }
    },

    "replaceNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Set Attribute
        if (!undo)
            jpf.xmldb.replaceNode(q[0], q[1], q[2], UndoObj);
        //Undo Attribute Setting
        else
            jpf.xmldb.replaceNode(q[1], q[0], q[2]);
    },

    "addChildNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Add Child Node
        if (!undo)
            jpf.xmldb.addChildNode(q[0], q[1], q[2], q[3], UndoObj);
        //Remove Child Node
        else
            jpf.xmldb.removeNode(UndoObj.extra.addedNode);
    },

    "appendChild" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Append Child Node
        if (!undo)
            jpf.xmldb.appendChild(q[0], q[1], q[2], q[3], q[4], UndoObj);
        //Remove Child Node
        else
            jpf.xmldb.removeNode(q[1]);
    },

    "moveNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Move Node
        if (!undo)
            jpf.xmldb.moveNode(q[0], q[1], q[2], q[3], UndoObj);
        //Move Node to previous position
        else
            jpf.xmldb.moveNode(UndoObj.extra.pNode, q[1],
                UndoObj.extra.beforeNode, q[3]);
    },

    "removeNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Remove Node
        if (!undo)
            jpf.xmldb.removeNode(q[0], q[1], UndoObj);
        //Append Child Node
        else
            jpf.xmldb.appendChild(UndoObj.extra.pNode,
                UndoObj.extra.removedNode, UndoObj.extra.beforeNode);
    },

    /**
     * @deprecated Use "multicall" from now on
     */
    "removeNodeList" : function(UndoObj, undo){
        if (undo) {
            var d = UndoObj.extra.removeList;
            for (var i = d.length - 1; i >= 0; i--) {
                jpf.xmldb.appendChild(d[i].pNode,
                    d[i].removedNode, d[i].beforeNode);
            }
        }
        else
            jpf.xmldb.removeNodeList(UndoObj.args, UndoObj);
    },

    "setUndoObject" : function(UndoObj, undo){
        var q = UndoObj.args;
        UndoObj.xmlNode = q[0];
    },

    "group" : function(UndoObj, undo, at){
        if (!UndoObj.stackDone) {
            var done = UndoObj.args[0];
            UndoObj.stackDone = done;
            UndoObj.stackUndone = [];
        }

        at[undo ? "undo" : "redo"](UndoObj.stackDone.length, false,
            UndoObj.stackDone, UndoObj.stackUndone);
    },
    
    "setValueByXpath" : function(UndoObj, undo){
        var q = UndoObj.args;//xmlNode, value, xpath
        // Setting NodeValue and creating the node if it doesnt exist
        if (!undo) {
            if (UndoObj.extra.newNode) {
                jpf.xmldb.appendChild(q[0], UndoObj.extra.newNode);
            }
            else {
                var newNodes = [];
                jpf.xmldb.setNodeValue(q[0], q[1], true, {
                    undoObj  : UndoObj,
                    xpath    : q[2],
                    newNodes : newNodes,
                    forceNew : q[3]
                });
    
                UndoObj.extra.newNode = newNodes[0];
            }
        }
        // Undo Setting NodeValue
        else {
            if (UndoObj.extra.newNode) {
                jpf.xmldb.removeNode(UndoObj.extra.newNode);
            }
            else
                jpf.xmldb.setNodeValue(UndoObj.extra.appliedNode, UndoObj.extra.oldValue, true);
        }
    },

    //@todo please change .func to .action for constency reasons
    "multicall" : function(UndoObj, undo, at){
        var prop, q = UndoObj.args;

        // Set Calls
        if (!undo) {
            for(var i = 0; i < q.length; i++) {
                if (!q[i].extra)
                    q[i].extra = {}
                jpf.actiontracker.actions[q[i].func](q[i], false, at);
            }
        }
        // Undo Calls
        else {
            for (var i = q.length - 1; i >= 0; i--)
                jpf.actiontracker.actions[q[i].func](q[i], true, at);
        }
    },

    /**
     * @deprecated Use "multicall" from now on
     */
    "addRemoveNodes" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Set Text Node
        if (!undo) {
            // Add
            for (var i = 0; i < q[1].length; i++){
                jpf.xmldb.appendChild(q[0], q[1][i],
                    null, null, null, UndoObj);
            }

            // Remove
            for (var i = 0; i < q[2].length; i++)
                jpf.xmldb.removeNode(q[2][i], null, UndoObj);
        }
        // Undo Text Node Setting
        else {
            // Add
            for (var i = 0; i < q[2].length; i++)
                jpf.xmldb.appendChild(q[0], q[2][i]);

            // Remove
            for (var i = 0; i < q[1].length; i++)
                jpf.xmldb.removeNode(q[1][i]);
        }
    }
};
//#endif
