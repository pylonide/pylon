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
 * backend data store.
 * Example:
 * <code>
 *   datagrid.getActionTracker().undo();
 * </code>
 * Remarks:
 * With offline support enabled the actiontracker can
 * serialize both its undo stack and its execution stack such that these can
 * be kept in between application sessions. This means that a user will be able
 * to close the application and start it at a later date whilst keeping his or
 * her entire undo/redo stack. Furthermore all changes done whilst being offline
 * will be synchronized to the data store when the application comes online.
 *
 * @constructor
 * @inherits apf.Class
 *
 * @define actiontracker
 * @addnode smartbinding, global
 * @event afterchange   Fires after a change to the action stack occurs
 *    object:
 *    {String} action the name of the action that was execution
 * @event beforechange  Fires before a change to the action stack will occur
 *   cancelable:    Prevents the execution of the action.
 *   object:
 *   {String}  action           the action to be executed
 *   {Array}   args             the arguments for the action
 *   {XmlNode} [xmlActionNode]  the rules to synchronize the changes to the server for both execution and undo. (See action rules)
 *   {AmlNode} [amlNode]        the GUI element that triggered the action
 *   {XmlNode} [selNode]        the relevant {@link term.datanode data node} to which the action node works on
 *   {Number}  [timestamp]      the start of the action that is now executed.
 * @event actionfail Fires when an action fails to be sent to the server.
 *   bubbles: true
 *   object:
 *     {Error}          error     the error object that is thrown when the event callback doesn't return false.
 *     {Number}         state     the state of the call
 *       Possible values:
 *       apf.SUCCESS  the request was successfull
 *       apf.TIMEOUT  the request has timed out.
 *       apf.ERROR    an error has occurred while making the request.
 *       apf.OFFLINE  the request was made while the application was offline.
 *     {mixed}          userdata  data that the caller wanted to be available in the callback of the http request.
 *     {XMLHttpRequest} http      the object that executed the actual http request.
 *     {String}         url       the url that was requested.
 *     {Http}           tpModule  the teleport module that is making the request.
 *     {Number}         id        the id of the request.
 *     {String}         message   the error message.
 * @see term.locking
 * @event actionsuccess Fires when an action is successfully sent to the server.
 *   bubbles: true
 *   object:
 *     {Number}         state     the state of the call
 *       Possible values:
 *       apf.SUCCESS  the request was successfull
 *       apf.TIMEOUT  the request has timed out.
 *       apf.ERROR    an error has occurred while making the request.
 *       apf.OFFLINE  the request was made while the application was offline.
 *     {mixed}          userdata  data that the caller wanted to be available in the callback of the http request.
 *     {XMLHttpRequest} http      the object that executed the actual http request.
 *     {String}         url       the url that was requested.
 *     {Http}           tpModule  the teleport module that is making the request.
 *     {Number}         id        the id of the request.
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.actiontracker = function(struct, tagName){
    this.$init(tagName || "actiontracker", apf.NODE_HIDDEN, struct);
    
    this.$stackDone   = [];
    this.$stackUndone = [];
    this.$execStack   = [];
};

(function(){
    this.$lastExecStackItem = null;

    this.realtime   = true;
    this.undolength = 0;
    this.redolength = 0;

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
                this.undolength = this.$stackDone.length;
                break;
            case "redolength":
                this.redolength = this.$stackUndone.length;
                break;
            //#ifdef __WITH_ALIAS
            case "alias":
                apf.GuiElement.propHandlers.alias.call(this, value);
            //#endif
            default:
                this[prop] = value;
        }
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (this.parentNode)
            this.parentNode.$at = this;
    });

    /**
     * Adds a new action handler which can be used by any actiontracker.
     * @param {String} action Specifies the name of the action
     * @param {Function} func Specifies the function that is executed when
     *                        Executing or undoing the action.
     */
    this.define = function(action, func){
        apf.actiontracker.actions[action] = func;
    };

    /**
     * Searches for the actiontracker that functions as a parent for this one.
     * @return {ActionTracker} Returns the parent actiontracker
     */
    this.getParent = function(){
        return this.parentNode && this.parentNode.getActionTracker
            ? this.parentNode.getActionTracker(true)
            : (apf.window.$at != this
                ? apf.window.$at
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
     *   {AmlNode} [amlNode]        the GUI element that triggered the action
     *   {XmlNode} [selNode]        the relevant {@link term.datanode data node} to which the action node works on
     *   {Number}  [timestamp]      the start of the action that is now executed.
     */
    this.execute = function(options){
        if (this.dispatchEvent("beforechange", options) === false)
            return;

        //Execute action
        var UndoObj = new apf.UndoData(options, this);
        if (options.action)
            apf.actiontracker.actions[options.action](UndoObj, false, this);

        //Add action to stack
        UndoObj.id = this.$stackDone.push(UndoObj) - 1;

        this.setProperty("undolength", this.$stackDone.length);

        //#ifdef __WITH_OFFLINE_STATE && __WITH_OFFLINE_TRANSACTIONS
        if (typeof apf.offline != "undefined") {
            var t = apf.offline.transactions;
            if (t.doStateSync) {
                t.addAction(this, UndoObj, "undo");
                t.clearActions(this, "redo");
            }
        }
        //#endif

        //Respond
        if (UndoObj.multiple) 
            this.$addToQueue(UndoObj.multiple, false, true);
        else
            this.$addToQueue(UndoObj, false);

        //Reset Redo Stack
        this.$stackUndone.length = 0;
        this.setProperty("redolength", this.$stackUndone.length);

        this.dispatchEvent("afterchange", {
            action   : "do"
        })

        //return stack id of action
        return UndoObj;
    };

    //deprecated??
    this.$addActionGroup = function(done, rpc){
        var UndoObj = new apf.UndoData("group", null, [
            //@todo apf.copyArray is deprecated and no longer exists
            apf.copyArray(done, UndoData), apf.copyArray(rpc, UndoData)
        ]);
        this.$stackDone.push(UndoObj);
        this.setProperty("undolength", this.$stackDone.length);

        this.dispatchEvent("afterchange", {action: "group", done: done});
    };

    /**
     * Synchronizes all held back changes to the data store.
     * @todo I don't really know if this stacking into the parent is
     * still used, for instance for apf.Transactions. please think
     * about it.
     */
    this.purge = function(nogrouping, forcegrouping){//@todo, maybe add noReset argument
        //var parent = this.getParent();

        //@todo Check if this still works together with transactions
        if (true) {//nogrouping && parent
            if (this.$execStack.length) {
                this.$execStack[0].undoObj.saveChange(this.$execStack[0].undo, this);
                this.$lastExecStackItem = this.$execStack[this.$execStack.length - 1];
            }
        }
        else if (parent) {
            /*
                Copy Stacked Actions as a single
                grouped action to parent ActionTracker
            */
            //parent.$addActionGroup(this.$stackDone, stackRPC);
            
            //Reset Stacks
            this.reset();
        }
    };

    /**
     * Empties the action stack. After this method is run running undo
     * or redo will not do anything.
     */
    this.reset = function(){
        this.$stackDone.length = this.$stackUndone.length = 0;

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
        var undoStack = undo ? this.$stackDone : this.$stackUndone, //local vars switch
            redoStack = undo ? this.$stackUndone : this.$stackDone; //local vars switch

        if (!undoStack.length) return;
        
        if (single) {
            var UndoObj = undoStack[id];
            if (!UndoObj) return;

            //#ifdef __DEBUG
            if (id != undoStack.length - 1) //@todo callstack got corrupted?
                throw new Error("callstack got corrupted");
            //#endif
            undoStack.length--;
            redoStack.push(UndoObj); //@todo check: moved from outside if(single)

            //#ifdef __WITH_OFFLINE_STATE && __WITH_OFFLINE_TRANSACTIONS
            if (typeof apf.offline != "undefined" && apf.offline.transactions.doStateSync) {
                apf.offline.transactions.removeAction(this, true, undo ? "undo" : "redo");
                apf.offline.transactions.addAction(this, UndoObj, undo ? "redo" : "undo");
            }
            //#endif

            //Undo Client Side Action
            if (UndoObj.action)
                apf.actiontracker.actions[UndoObj.action](UndoObj, undo, this);

            if (!rollback) {
                if (UndoObj.multiple) 
                    this.$addToQueue(UndoObj.multiple, undo, true);
                else
                    this.$addToQueue(UndoObj, undo);
            }

            //Set Changed Value
            this.setProperty("undolength", this.$stackDone.length);
            this.setProperty("redolength", this.$stackUndone.length);
            return UndoObj;
        }

        if (this.dispatchEvent("beforechange") === false)
            return;

        //#ifdef __DEBUG
        apf.console.info("Executing " + (undo ? "undo" : "redo"));
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
                apf.console.error("The actiontracker is in an invalid \
                                   state. The entire undo and redo stack will \
                                   be cleared to prevent further corruption\
                                   This is a serious error, please contact \
                                   a specialist.");
                //#endif

                this.$stackDone   = [];
                this.$stackUndone = [];

                //#ifdef __WITH_OFFLINE_STATE && __WITH_OFFLINE_TRANSACTIONS
                if (typeof apf.offline != "undefined") {
                    var t = apf.offline.transactions;
                    if (t.doStateSync)
                        t.clear("undo|redo");
                }
                //#endif

                return false;
            }
            else {
                change.call(this, undoStack.length - 1, true, undo, rollback);
                i++;
            }
        }

        this.dispatchEvent("afterchange", {
            action   : undo ? "undo" : "redo",
            rollback : rollback
        })
    }

    this.$receive = function(data, state, extra, UndoObj, callback){
        if (state == apf.TIMEOUT
          && extra.tpModule.retryTimeout(extra, state, this) === true)
            return true;

        if (state != apf.SUCCESS) {
            //Tell anyone that wants to hear about our failure :(
            if (this.dispatchEvent("actionfail", apf.extend(extra, {
                state   : state,
                message : "Could not sent Action RPC request for control "
                            + this.name
                            + "[" + this.localName + "] \n\n"
                            + extra.message,
                bubbles : true
            })) === false) {

                //#ifdef __DEBUG
                apf.console.warn("You have cancelled the automatic undo \
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
            if (typeof apf.offline != "undefined" && !apf.offline.reloading)
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
                this.$execStack = [];
                
                var oError = new Error(apf.formatErrorString(0, this, 
                    "Executing action",
                    "Error sending action to the server:\n"
                    + (extra.url ? "Url:" + extra.url + "\n\n" : "") 
                    + extra.message));

                if ((UndoObj && UndoObj.xmlActionNode || extra.amlNode || apf)
                  .dispatchEvent("error", apf.extend({
                    error   : oError,
                    state   : state,
                    bubbles : true
                }, extra)) === false)
                    return;
                    
                throw oError;
            }
        }
        else {
            //Tell anyone that wants to hear about our success
            this.dispatchEvent("actionsuccess", apf.extend(extra, {
                state   : state,
                bubbles : true
            }, extra));

            //#ifdef __WITH_RSB
            //Send out the RSB message, letting friends know of our change
            UndoObj.processRsbQueue();
            //#endif

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
        //@todo Implement this for isGroup if deemed useful
        if (!isGroup && this.$execStack.length && !UndoObj.state
          && this.$execStack[this.$execStack.length - 1].undoObj == UndoObj) {
            this.$execStack.length--;

            // #ifdef __WITH_OFFLINE_TRANSACTIONS
            if (typeof apf.offline != "undefined" && apf.offline.transactions.enabled) //We want to maintain the stack for sync
                apf.offline.transactions.removeAction(this, true, "queue");
            //#endif

            //#ifdef __WITH_RSB
            UndoObj.clearRsbQueue();
            //#endif

            return;
        }

        // Add the item to the queue
        if (isGroup) { //@todo currently no offline support for grouped actions
            var undoObj, qItem = this.$execStack.shift();
            for (var i = 0; i < UndoObj.length; i++) {
                undoObj = UndoObj[i];
                this.$execStack.unshift({
                    undoObj : (undoObj.tagName 
                        ? undoObj 
                        : new apf.UndoData(undoObj, this)).preparse(undo, this),
                    undo   : undo
                });
            }
            if (qItem)
                this.$execStack.unshift(qItem);

            return;
        }

        var qItem = {
            undoObj : UndoObj.preparse(undo, this),
            undo   : undo

        };
        this.$execStack.push(qItem) - 1;

        // #ifdef __WITH_OFFLINE_TRANSACTIONS
        if (typeof apf.offline != "undefined" && apf.offline.transactions.enabled) //We want to maintain the stack for sync
            apf.offline.transactions.addAction(this, qItem, "queue");
        //#endif

        //The queue was empty, yay! we're gonna exec immediately
        if (this.$execStack.length == 1 && this.realtime)
            UndoObj.saveChange(undo, this);
    };

    this.$queueNext = function(UndoObj, callback){
        /*
            These thow checks are so important, that they are also executed
            in release mode.
        */
        if (!this.$execStack[0] || this.$execStack[0].undoObj != UndoObj){
            throw new Error(apf.formatErrorString(0, this, "Executing Next \
                action in queue", "The execution stack was corrupted. This is \
                a fatal error. The application should be restarted. You will \
                lose all your changes. Please contact the administrator."));
        }

        //Reset the state of the undo item
        UndoObj.state = null;

        //Remove the action item from the stack
        var lastItem = this.$execStack.shift();

        // #ifdef __WITH_OFFLINE_TRANSACTIONS
        if (typeof apf.offline != "undefined" && apf.offline.transactions.enabled) //We want to maintain the stack for sync
            apf.offline.transactions.removeAction(this, null, "queue");
        //#endif

        //Check if there is a new action to execute;
        if (!this.$execStack[0] || lastItem == this.$lastExecStackItem)
            return;

        // @todo you could optimize this process by using multicall, but too much for now

        //Execute action next in queue
        this.$execStack[0].undoObj.saveChange(this.$execStack[0].undo, this, callback);
    };

    //#ifdef __WITH_OFFLINE_TRANSACTIONS
    this.$loadQueue = function(stack, type){
        if (type == "queue") {
            //#ifdef __DEBUG
            if (this.$execStack.length) { //@todo
                throw new Error("oops");
            }
            //#endif

            this.$execStack = stack;
        }

        //#ifdef __WITH_OFFLINE_STATE && __WITH_OFFLINE_TRANSACTIONS
        else if (type == "undo") {
            //#ifdef __DEBUG
            if (this.$stackDone.length) //@todo
                throw new Error("oops");
            //#endif

            this.$stackDone = stack;
        }
        else if (type == "redo") {
            //#ifdef __DEBUG
            if (this.$stackUndone.length) //@todo
                throw new Error("oops");
            //#endif

            this.$stackUndone = stack;
        }
        //#endif

        //#ifdef __DEBUG
        else //@todo
            throw new Error("unknown");
        //#endif
    };

    this.$getQueueLength = function(){
        return this.$execStack.length;
    };

    this.$startQueue = function(callback){
        if (!this.$execStack[0] || this.$execStack[0].undoObj.state) //@todo This is gonna go wrong, probably
            return false;

        //Execute action next in queue
        this.$execStack[0].undoObj.saveChange(this.$execStack[0].undo, this, callback);
    };
    //#endif
}).call(apf.actiontracker.prototype = new apf.AmlElement());

apf.aml.setElement("actiontracker", apf.actiontracker);

/**
 * UndoData is the command object for the actiontracker. Each instance of this class
 * contains information about a single event in the application. It can be undone
 * and it knows how to synchronize the change to a (remote) data source.
 *
 * @constructor
 * @default_private
 */
apf.UndoData = function(settings, at){
    this.localName = "UndoData";
    this.extra     = {};
    //#ifdef __WITH_RSB
    this.rsbQueue  = {};
    //#endif
    apf.extend(this, settings);

    if (at)
        this.at = at;
    //Copy Constructor
    else if (settings && settings.tagName == "UndoData") {
        this.args    = settings.args.slice();
        //#ifdef __WITH_RSB
        this.rsbArgs = settings.rsbArgs.slice();
        //#endif
    }
    //Constructor
    else {
        /*
            @todo: Please check the requirement for this and how to solve
            this. Goes wrong with multiselected actions!
        */
        this.selNode = this.selNode || (this.action == "removeNode"
            ? this.args[0]
            : (this.amlNode
                ? this.amlNode.selected
                : null));
    }

    var options, _self = this;

    // #ifdef __WITH_OFFLINE_TRANSACTIONS
    var serialState;
    this.$export = function(){
        if (serialState) //Caching
            return serialState;

        serialState = {
            action    : this.action,
            //#ifdef __WITH_RSB
            rsbModel  : this.rsbModel ? this.rsbModel.name : null,
            rsbQueue  : this.rsbQueue,
            //#endif
            at        : this.at.name,
            timestamp : this.timestamp,
            parsed    : options ? options.parsed : null, //errors when options is not defined
            userdata  : options ? options.userdata : null,
            extra     : {}
        };

        //#ifdef __WITH_RSB
        //this can be optimized
        var rsb = this.rsbModel
            ? this.rsbModel.rsb
            : apf.remote;
        //#endif

        //Record arguments
        var sLookup = (typeof apf.offline != "undefined" && apf.offline.sLookup)
            ? apf.offline.sLookup
            : (apf.offline.sLookup = {});
        if (!sLookup.count) sLookup.count = 0;
        var xmlNode, xmlId, args = this.args.slice();

        for (var i = 0; i < args.length; i++) {
            if (args[i] && args[i].nodeType) {
                if (!serialState.argsModel) {
                    var model = apf.nameserver.get("model",
                        apf.xmldb.getXmlDocId(args[i]));

                    if(model)
                        serialState.argsModel = model.name || model.$uniqueId;
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
            apf.console.warn("Could not determine model for serialization \
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
              || apf.isChildOf(model.data, xmlNode, true)) {
                xmlId = xmlNode.getAttribute(apf.xmldb.xmlIdTag);
                return {
                    xpath  : rsb.xmlToXpath(xmlNode, model.data, true),
                    lookup : xmlId
                };
            }
            // So we've got a disconnected branch, lets serialize it
            else {
                var contextNode = xmlNode;
                while (contextNode.parentNode && contextNode.parentNode.nodeType == 1) //find topmost parent
                    contextNode = xmlNode.parentNode;

                xmlId = contextNode.getAttribute(apf.xmldb.xmlIdTag);
                if (!xmlId) {
                    xmlId = "serialize" + sLookup.count++;
                    contextNode.setAttribute(apf.xmldb.xmlIdTag, xmlId);
                }

                var obj = {
                    xpath  : rsb.xmlToXpath(xmlNode, contextNode, true),
                    lookup : xmlId
                }

                if (!sLookup[xmlId]) {
                    contextNode.setAttribute(apf.xmldb.xmlDocTag,
                        apf.xmldb.getXmlDocId(contextNode));

                    sLookup[xmlId] = contextNode;
                    obj.xml        = contextNode.xml || contextNode.serialize();
                }

                return obj;
            }
        }
    };

    this.$import = function(){
        //#ifdef __WITH_RSB
        if (this.rsbModel)
            this.rsbModel = apf.nameserver.get("model", this.rsbModel);
        //#endif

        if (this.argsModel) {
            var model = apf.nameserver.get("model", this.argsModel)
                || apf.lookup(this.argsModel);

            //Record arguments
            var sLookup =  (typeof apf.offline != "undefined" && apf.offline.sLookup)
                ? apf.offline.sLookup
                : (apf.offline.sLookup = {});
            if (!sLookup.count) sLookup.count = 0;

            var args = this.args,
                //#ifdef __WITH_RSB
                rsb  = this.rsbModel
                    ? this.rsbModel.rsb
                    : apf.remote,
                //#endif
                xmlNode, i, l, item, name;

            for (i = 0, l = args.length; i < l; i++) {
                if (args[i] && args[i].xpath)
                    args[i] = unserializeNode(args[i], model);
            }

            for (name in this.extra) {
                item = this.extra[name];
                if (item && item.xpath)
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
                xmlNode = apf.xmldb.getXml(xmlSerial.xml);
                sLookup[xmlNode.getAttribute(apf.xmldb.xmlIdTag)] = xmlNode;
            }
            else if (xmlSerial.lookup) {
                xmlNode = sLookup[xmlSerial.lookup];

                //#ifdef __DEBUG
                if (!xmlSerial.xpath) //@todo
                    throw new Error("Serialization error");
                //#endif
            }
            else
                xmlNode = null;

            return rsb.xpathToXml(xmlSerial.xpath, xmlNode || model.data);
        }
    };
    //#endif

    //#ifdef __WITH_RSB
    //Send RSB Message..
    this.processRsbQueue = function(){
        if (this.rsbModel)
            this.rsbModel.rsb.processQueue(this);
    };

    this.clearRsbQueue = function(){
        this.rsbQueue = 
        this.rsbModel = null;
    };
    //#endif

    /**
     * Save the change to a data source.
     * @param {Boolean} undo whether the change is undone.
     */
    this.saveChange = function(undo, at, callback){
        //Grouped undo/redo support
        if (this.action == "group") {
            var rpcNodes = this.args[1];
            at.$addToQueue(rpcNodes, undo, true);
            return at.$queueNext(this);
        }

        var dataInstruction;
        if (this.xmlActionNode) {
            dataInstruction = this.xmlActionNode.getAttribute(undo ? "undo" : "set");
            if (undo && !dataInstruction)
                dataInstruction = this.xmlActionNode.getAttribute("set");
        }

        if (!dataInstruction) {
            //#ifdef __WITH_RSB
            this.processRsbQueue();
            //#endif
            return at.$queueNext(this);
        }

        this.state = undo ? "restoring" : "saving";

        //#ifdef __DEBUG
        if (!options || options._pc === true) {
            throw new Error("Error in data instruction:" + dataInstruction); //@todo apf3.0 turn this into a proper apf error
        }
        //#endif
        
        if (options._pc == -2) {
            return at.$receive(null, apf.SUCCESS, {amlNode: this.amlNode}, 
                this, callback);
        }
        
        //options._precall = false;
        options.callback = function(data, state, extra){
            extra.amlNode = _self.amlNode;
            return at.$receive(data, state, extra, _self, callback);
        }
        options.ignoreOffline = true;

        apf.saveData(dataInstruction, options);
    };

    this.preparse = function(undo, at, multicall){
        var dataInstruction;
        if (this.xmlActionNode) {
            dataInstruction = this.xmlActionNode.getAttribute(undo ? "undo" : "set");
            if (undo && !dataInstruction)
                dataInstruction = this.xmlActionNode.getAttribute("set");
        }

        if (!dataInstruction)
            return this;

        options = apf.extend({
            //undoObj   : this,
            xmlNode   : this.action == "multicall" 
              ? this.args[0].xmlNode
              : this.selNode || this.xmlNode,
            userdata  : apf.isTrue(this.xmlActionNode.getAttribute("ignore-fail")),
            multicall : multicall,
            undo      : undo,
            _pc       : true,
            callback  : function(data, state, extra){
                options._pc = -2;
            }
        }, this.extra);

        //#ifdef __WITH_LOCKING
        if (this.timestamp) {
            options.actionstart = this.timestamp;
            options.headers     = {"X-JPF-ActionStart": this.timestamp};
        }
        //#endif

        apf.saveData(dataInstruction, options); //@todo please check if at the right time selNode is set
        
        if (options._pc === true)
            options._pc = -1; //if this is set then it overwrites the values set by livemarkup
        
        return this;
    };
};
/* #elseif __WITH_DATAACTION
apf.actiontracker = function(){
    this.execute = function(){
        //Execute action
        var UndoObj = new apf.UndoData();
        if (options.action)
            apf.actiontracker.actions[options.action](UndoObj, false, this);
        return UndoObj;
    };
    
    this.reset = function(){}
}

apf.UndoData = function(){
    this.localName = "UndoData";
    this.extra   = {};
}
#endif */

//#ifdef __WITH_ACTIONTRACKER || __WITH_DATAACTION
/**
 * Default actions, that are known to the actiontracker
 * @todo test if the .extra speed impact matters
 * @todo ifdef the undo sections to only be there when the actiontracker is enabled
 * @private
 */
apf.actiontracker.actions = {
    "setTextNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Set Text Node
        if (!undo)
            apf.xmldb.setTextNode(q[0], q[1], q[2], UndoObj);
        else //Undo Text Node Setting
            apf.xmldb.setTextNode(q[0], UndoObj.extra.oldValue, q[2]);
    },

    "setAttribute" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Set Attribute
        if (!undo) {
            //Set undo info
            UndoObj.extra.name = q[1];
            UndoObj.extra.oldValue = q[0].getAttribute(q[1]);

            apf.xmldb.setAttribute(q[0], q[1], q[2], q[3], UndoObj);
        }
        // Undo Attribute Setting
        else {
            if (!UndoObj.extra.oldValue)
                apf.xmldb.removeAttribute(q[0], q[1]);
            else
                apf.xmldb.setAttribute(q[0], q[1], UndoObj.extra.oldValue, q[3]);
        }
    },

    "removeAttribute" : function(UndoObj, undo){
        var q = UndoObj.args;

        // Remove Attribute
        if (!undo) {
            // Set undo info
            UndoObj.extra.name = q[1];
            UndoObj.extra.oldValue = q[0].getAttribute(q[1]);

            apf.xmldb.removeAttribute(q[0], q[1], q[2], UndoObj);
        }
        //Undo Attribute Removal
        else
            apf.xmldb.setAttribute(q[0], q[1], UndoObj.extra.oldValue, q[2]);
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

            apf.xmldb.applyChanges("attribute", q[0], UndoObj);
        }
        //Undo Attribute Setting
        else {
            for (prop in UndoObj.oldValues) {
                if (!UndoObj.extra.oldValues[prop])
                    q[0].removeAttribute(prop);
                else
                    q[0].setAttribute(prop, UndoObj.extra.oldValues[prop]);
            }

            apf.xmldb.applyChanges("attribute", q[0], UndoObj);
        }
    },

    "replaceNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Set Attribute
        if (!undo)
            apf.xmldb.replaceNode(q[1], q[0], q[2], UndoObj);
        //Undo Attribute Setting
        else
            apf.xmldb.replaceNode(q[0], q[1], q[2], UndoObj);
    },

    "addChildNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Add Child Node
        if (!undo)
            apf.xmldb.addChildNode(q[0], q[1], q[2], q[3], UndoObj);
        //Remove Child Node
        else
            apf.xmldb.removeNode(UndoObj.extra.addedNode);
    },

    "appendChild" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Append Child Node
        if (!undo)
            apf.xmldb.appendChild(q[0], q[1], q[2], q[3], q[4], UndoObj);
        //Remove Child Node
        else
            apf.xmldb.removeNode(UndoObj.xmlNode);//q[1]
    },

    "moveNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Move Node
        if (!undo)
            apf.xmldb.moveNode(q[0], q[1], q[2], q[3], UndoObj);
        //Move Node to previous position
        else
            apf.xmldb.moveNode(UndoObj.extra.oldParent, q[1],
                UndoObj.extra.beforeNode, q[3]);
    },

    "removeNode" : function(UndoObj, undo){
        var q = UndoObj.args;

        //Remove Node
        if (!undo)
            apf.xmldb.removeNode(q[0], q[1], UndoObj);
        //Append Child Node
        else
            apf.xmldb.appendChild(UndoObj.extra.parent,
                UndoObj.extra.removedNode, UndoObj.extra.beforeNode);
    },

    /**
     * @deprecated Use "multicall" from now on
     */
    "removeNodeList" : function(UndoObj, undo){
        if (undo) {
            var d = UndoObj.extra.removeList;
            for (var i = d.length - 1; i >= 0; i--) {
                apf.xmldb.appendChild(d[i].pNode,
                    d[i].removedNode, d[i].beforeNode);
            }
        }
        else
            apf.xmldb.removeNodeList(UndoObj.args, UndoObj);
    },

    "setUndoObject" : function(UndoObj, undo){
        var q = UndoObj.args;
        UndoObj.xmlNode = q[0];
    },

    "group" : function(UndoObj, undo, at){
        if (!UndoObj.$stackDone) {
            var done = UndoObj.args[0];
            UndoObj.$stackDone = done;
            UndoObj.$stackUndone = [];
        }

        at[undo ? "undo" : "redo"](UndoObj.$stackDone.length, false,
            UndoObj.$stackDone, UndoObj.$stackUndone);
    },
    
    "setProperty" : function(UndoObj, undo){
        var q = UndoObj.args;//amlNode, name, value

        if (!undo) {
            UndoObj.extra.oldValue = q[0][q[1]];
            q[0].setProperty(q[1], q[2], q[3], q[4]);
        }
        // Undo 
        else {
            q[0].setProperty(q[1], UndoObj.extra.oldValue);
        }
    },
    
    "setValueByXpath" : function(UndoObj, undo){
        var q = UndoObj.args;//xmlNode, value, xpath
        // Setting NodeValue and creating the node if it doesnt exist
        if (!undo) {
            if (UndoObj.extra.newNode) {
                apf.xmldb.appendChild(UndoObj.extra.parentNode, UndoObj.extra.newNode);
            }
            else {
                var newNodes = [];
                apf.setNodeValue(q[0], q[1], true, {
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
                UndoObj.extra.parentNode = UndoObj.extra.newNode.parentNode;
                apf.xmldb.removeNode(UndoObj.extra.newNode);
            }
            else
                apf.setNodeValue(UndoObj.extra.appliedNode, UndoObj.extra.oldValue, true);
        }
    },

    //@todo please change .func to .action for constency reasons
    "multicall" : function(UndoObj, undo, at){
        var q = UndoObj.args;

        var dUpdate = apf.xmldb.delayUpdate;
        apf.xmldb.delayUpdate = true;

        // Set Calls
        if (!undo) {
            for(var i = 0; i < q.length; i++) {
                if (!q[i].extra)
                    q[i].extra = {};
                //#ifdef __WITH_RSB
                if (q[0].rsbModel)
                    q[i].rsbQueue = q[0].rsbQueue;
                //#endif
                apf.actiontracker.actions[q[i].func](q[i], false, at);
            }
            //#ifdef __WITH_RSB
            if (q[0].rsbModel) {
                UndoObj.rsbModel = q[0].rsbModel;
                UndoObj.rsbQueue = q[0].rsbQueue;
            }
            //#endif
        }
        // Undo Calls
        else {
            for (var i = q.length - 1; i >= 0; i--)
                apf.actiontracker.actions[q[i].func](q[i], true, at);
        }

        apf.xmldb.delayUpdate = dUpdate;

        //if (!dUpdate)
            //apf.xmldb.notifyQueued();
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
                apf.xmldb.appendChild(q[0], q[1][i],
                    null, null, null, UndoObj);
            }

            // Remove
            for (var i = 0; i < q[2].length; i++)
                apf.xmldb.removeNode(q[2][i], null, UndoObj);
        }
        // Undo Text Node Setting
        else {
            // Add
            for (var i = 0; i < q[2].length; i++)
                apf.xmldb.appendChild(q[0], q[2][i]);

            // Remove
            for (var i = 0; i < q[1].length; i++)
                apf.xmldb.removeNode(q[1][i]);
        }
    }
};

//#endif