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
 *   {XmlNode} [xmlActionNode]  the rules to synchronize the changes to the server
 *                              for both execution and undo. (See action rules)
 *   {AmlNode} [amlNode]        the GUI element that triggered the action
 *   {XmlNode} [selNode]        the relevant {@link term.datanode data node} to
 *                              which the action node works on
 *   {Number}  [timestamp]      the start of the action that is now executed.
 * @event actionfail Fires when an action fails to be sent to the server.
 *   bubbles: true
 *   object:
 *     {Error}          error     the error object that is thrown when the event
 *                                callback doesn't return false.
 *     {Number}         state     the state of the call
 *       Possible values:
 *       apf.SUCCESS  the request was successfull
 *       apf.TIMEOUT  the request has timed out.
 *       apf.ERROR    an error has occurred while making the request.
 *       apf.OFFLINE  the request was made while the application was offline.
 *     {mixed}          userdata  data that the caller wanted to be available in
 *                                the callback of the http request.
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
 *     {mixed}          userdata  data that the caller wanted to be available in
 *                                the callback of the http request.
 *     {XMLHttpRequest} http      the object that executed the actual http request.
 *     {String}         url       the url that was requested.
 *     {Http}           tpModule  the teleport module that is making the request.
 *     {Number}         id        the id of the request.
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
apf.actiontracker = function(struct, tagName){
    this.$init(tagName || "actiontracker", apf.NODE_HIDDEN, struct);

    this.$undostack = [];
    this.$redostack = [];
    this.$execstack = [];
    //#ifdef __ENABLE_ACTIONTRACKER_TRANSACTIONS
    this.$transtack = {};
    //#endif
};

(function(){
    this.$lastExecStackItem = null;

    this.realtime   = true;
    this.undolength = 0;
    this.redolength = 0;
    //#ifdef __ENABLE_ACTIONTRACKER_SLIDER
    this.length     = 0;
    this.position   = 0;
    //#endif

    /**
     * @attribute {Number}  !undolength the length of the undo stack.
     * @attribute {Number}  !redolength the length of the redo stack.
     * @attribute {Number}  !length     the length of the undo/redo stack combined.
     *                                  Use this attribute to bind a slider's max
     *                                  attribute to.
     * @attribute {Number}  position    the position within the total length (same
     *                                  value as undolength). Use this attribute
     *                                  to bind a slider's value attribute to.
     * @attribute {Boolean} realtime    whether changes are immediately send to
     * the datastore, or held back until purge() is called.
     */
    this.$booleanProperties = {};
    this.$booleanProperties["realtime"] = true;
    this.$supportedProperties = ["realtime", "undolength", "redolength", "alias", "length", "position"];
    this.$handlePropSet = function(prop, value, force){
        if (this.$booleanProperties[prop])
            value = apf.isTrue(value);

        //Read only properties
        switch (prop) {
            case "undolength":
                this.undolength = this.$undostack.length;
                //#ifdef __ENABLE_ACTIONTRACKER_SLIDER
                this.setProperty("position", this.position = this.undolength);
                //#endif
                break;
            case "redolength":
                this.redolength = this.$redostack.length;
                break;
            //#ifdef __ENABLE_ACTIONTRACKER_SLIDER
            case "position":
                var d = this.undolength - (this.position = value);
                if (d > 0)
                    change.call(this, d, false, true);
                else if (d < 0)
                    change.call(this, -1 * d);

                break;
            case "length":
                this.length = this.undolength + this.redolength;
                break;
            //#endif
            //#ifdef __WITH_ALIAS
            case "alias":
                apf.GuiElement.propHandlers.alias.call(this, value);
            //#endif
            default:
                this[prop] = value;
        }
    };

    /*this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (this.parentNode)
            this.parentNode.$at = this;
    });*/

    //#ifdef __ENABLE_ACTIONTRACKER_HTML5
    this.item = function(index){
        if (index < this.$undostack.length)
            return this.$undostack[index];

        return this.$redostack[index - this.$undostack.length];
    }

    this.add = function(data, title){
        throw new Error("Not implemented yet");
    }

    this.remove = function(index){
        throw new Error("Not implemented yet");
    }

    this.clearUndo = function(){
        this.setProperty("undolength", this.$undostack.length = 0);
        //#ifdef __ENABLE_ACTIONTRACKER_SLIDER
        this.setProperty("length", this.$redostack.length);
        //#endif

        this.dispatchEvent("afterchange", {action: "clear-undo"});
    }

    this.clearRedo = function(){
        this.setProperty("redolength", this.$redostack.length = 0);
        //#ifdef __ENABLE_ACTIONTRACKER_SLIDER
        this.setProperty("length", this.$undostack.length);
        //#endif

        this.dispatchEvent("afterchange", {action: "clear-redo"});
    }
    //#endif

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
            : (apf.window.$at != this ? apf.window.$at : null);
    };

    this.getDone = function(time) {
        if (typeof time != "number")
            return [];
        for (var o, i = this.$undostack.length; i >= 0; --i) {
            if (!(o = this.$undostack[i]) || !o.timestamp) continue;
            if (o.timestamp >= time)
                return this.$undostack.slice(i);
        }
        return [];
    };

    this.getUndone = function(time) {
        if (typeof time != "number")
            return [];
        for (var o, i = 0, l = this.$redostack.length; i < l; ++i) {
            if (!(o = this.$redostack[i]) || !o.timestamp) continue;
            if (o.timestamp <= time)
                return this.$redostack.slice(0, i + 1);
        }
        return [];
    };

    /**
     * Executes an action, which later can be undone and of which the execution
     * can be synchronized to the data store.
     * @param {Object} options the details of the execution.
     *   Properties:
     *   {String}  action           the action to be executed
     *   {Array}   args             the arguments for the action
     *   {XmlNode} [xmlActionNode]  the rules to synchronize the changes to the
     *                              server for both execution and undo. (See action rules)
     *   {AmlNode} [amlNode]        the GUI element that triggered the action
     *   {XmlNode} [selNode]        the relevant {@link term.datanode data node}
     *                              to which the action node works on
     *   {Number}  [timestamp]      the start of the action that is now executed.
     *   {String}  [annotator]      the name or identifier of the entity that is
     *                              responsible for the action
     */
    this.execute = function(options){
        if (this.dispatchEvent("beforechange", options) === false)
            return false;

        //Execute action
        var UndoObj = new apf.UndoData(options, this);
        if (options.action && !options.transaction)
            apf.actiontracker.actions[options.action](UndoObj, false, this);

        //Add action to stack
        UndoObj.id = this.$undostack.push(UndoObj) - 1;

        this.setProperty("undolength", this.$undostack.length);

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
        // @todo for rdb refactor we have to deal with collision handling within the at
        if (!options.rdb) {
            this.$redostack.length = 0;
            this.setProperty("redolength", this.$redostack.length);

            //#ifdef __ENABLE_ACTIONTRACKER_SLIDER
            this.setProperty("length", this.$undostack.length);
            //#endif
        }

        this.dispatchEvent("afterchange", {
            action   : "do"
        })

        //return stack id of action
        return UndoObj;
    };

    //deprecated??
    /*this.$addActionGroup = function(done, rpc){
        var UndoObj = new apf.UndoData("group", null, [
            //@todo apf.copyArray is deprecated and no longer exists
            apf.copyArray(done, UndoData), apf.copyArray(rpc, UndoData)
        ]);
        this.$undostack.push(UndoObj);
        this.setProperty("undolength", this.$undostack.length);

        //@todo reset redo here?

        //#ifdef __ENABLE_ACTIONTRACKER_SLIDER
        this.setProperty("length", this.$undostack.length);
        //#endif

        this.dispatchEvent("afterchange", {action: "group", done: done});
    };*/

    /**
     * Synchronizes all held back changes to the data store.
     * @todo I don't really know if this stacking into the parent is
     * still used, for instance for apf.Transaction. please think
     * about it.
     */
    this.purge = function(nogrouping, forcegrouping){//@todo, maybe add noReset argument
        //var parent = this.getParent();

        //@todo Check if this still works together with transactions
        if (true) {//nogrouping && parent
            if (this.$execstack.length) {
                this.$execstack[0].undoObj.saveChange(this.$execstack[0].undo, this);
                this.$lastExecStackItem = this.$execstack[this.$execstack.length - 1];
            }
        }
        else if (parent) {
            /*
                Copy Stacked Actions as a single
                grouped action to parent ActionTracker
            */
            //parent.$addActionGroup(this.$undostack, stackRPC);

            //Reset Stacks
            this.reset();
        }
    };

    //#ifdef __ENABLE_ACTIONTRACKER_TRANSACTIONS
    /**
     * Starts recording a transaction. The transaction can either be committed
     * or rolled back. Changes won't be executed until committed for xml data
     * nodes. For apf based data nodes (i.e. aml nodes) changes are executed
     * immediately and reverted on rollback.
     * @see element.actiontracker.method.commit
     * @see element.actiontracker.method.rollback
     */
    this.begin = function(dataNode, bClear){
        var id;
        //Currently only supports nodes inheriting from apf.Class
        //In the future this same method should be used for xml dom elements
        //that support the mutation events
        if (dataNode && (dataNode.$regbase || dataNode.$regbase === 0)) {
            id = dataNode.$uniqueId;
            if (this.$transtack[id] && !bClear) {
                //throw new Error("Existing transaction found!");
                return;
            }

            dataNode.$stack = this.$transtack[id] = [];

            dataNode.addEventListener("DOMCharacterDataModified", domCharMod);
            dataNode.addEventListener("DOMAttrModified",          domCharMod);
            dataNode.addEventListener("DOMNodeInserted",          domNodeIns);
            dataNode.addEventListener("DOMNodeRemoved",           domNodeRem);
        }
        //Assuming normal actiontracker use
        else {
            //@todo (for mike) for the new rdb method to work properly, it should
            //be really easy to add xml changes to the actiontracker using this
            //begin commit method. We could add an at.exec(function(){}) that lasts
            //during the length of the function. Point is that we need to change
            //the xmldb to somehow find the right actiontracker, because we don't
            //have mutation events yet. One way is to add an a_at="" attribute
            //that can be looked up to find actiontracker listeners.

            id = apf.xmldb.nodeConnect(apf.xmldb.getXmlDocId(dataNode), dataNode);

            //Set listener
            if (dataNode)
                apf.xmldb.addNodeListener(dataNode, this); //should be unique for for xml node xmldb.xmlIdTag

            if (this.$transtack[id] && !bClear) {
                //throw new Error("Existing transaction found!");
                return;
            }

            this.$transtack[id] = [];
            this.$transtack[id].$native = true;

            if (!this.$execute) {
                this.$execute = this.execute;
                this.execute = function(options){
                    var inTrans = false;

                    //Find transaction
                    if (options.selNode)
                        inTrans = this.$transtack[options.selNode.getAttribute(apf.xmldb.xmlIdTag)];

                    //Either stack or execute immediately
                    if (inTrans)
                        inTrans.push(options);
                    else
                        this.$execute(options);
                }
            }
        }
    }
    
    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj, lastParent){
        
    }

    /**
     * Rolls back a transaction
     */
    this.rollback = function(dataNode){
        var id;
        if (dataNode && (dataNode.$regbase || dataNode.$regbase === 0)) {
            id = dataNode.$uniqueId;
            var stack = this.$transtack[id];
            if (!stack)
                return;

            //undo all changes (in reverse order)
            for (var s, i = stack.length - 1; i >= 0; i--) {
                s = stack[i];
                apf.actiontracker.actions[s.action].call(s, true, this);
            }

            dataNode.removeEventListener("DOMCharacterDataModified", domCharMod);
            dataNode.removeEventListener("DOMAttrModified",          domCharMod);
            dataNode.removeEventListener("DOMNodeInserted",          domNodeIns);
            dataNode.removeEventListener("DOMNodeRemoved",           domNodeRem);
            delete dataNode.$stack;
        }
        else
            id = dataNode.getAttribute(apf.xmldb.xmlIdTag);

        delete this.$transtack[id];
    }

    /**
     * Commits a transaction
     */
    this.commit = function(dataNode){
        var id, stack;
        if (dataNode && (dataNode.$regbase || dataNode.$regbase === 0)) {
            id = dataNode.$uniqueId;
            stack = this.$transtack[id];
            if (!stack) {
                //#ifdef __DEBUG
                this.log && this.log("Commit called without transaction started");
                //#endif
                return;
            }

            if (stack.length)
                this.execute({
                    xmlNode     : dataNode,
                    action      : "multicall",
                    transaction : true,
                    args        : stack
                });

            dataNode.removeEventListener("DOMCharacterDataModified", domCharMod);
            dataNode.removeEventListener("DOMAttrModified",          domCharMod);
            dataNode.removeEventListener("DOMNodeInserted",          domNodeIns);
            dataNode.removeEventListener("DOMNodeRemoved",           domNodeRem);
            delete dataNode.$stack;
        }
        else {
            id = dataNode.getAttribute(apf.xmldb.xmlIdTag);
            stack = this.$transtack[id];

            if (stack.length)
                this.execute({
                    xmlNode : dataNode,
                    action  : "multicall",
                    args    : stack
                });
        }

        delete this.$transtack[id];
    }

    this.pause = function(dataNode, bContinue){
        var id = dataNode && (dataNode.$regbase || dataNode.$regbase === 0)
            ? dataNode.$uniqueId
            : dataNode.getAttribute(apf.xmldb.xmlIdTag);

        var stack = this.$transtack[id];
        if (!stack) {
            //#ifdef __DEBUG
            throw new Error("Pausing non existent transaction");
            //#endif
            return;
        }

        if (bContinue) {
            dataNode.addEventListener("DOMCharacterDataModified", domCharMod);
            dataNode.addEventListener("DOMAttrModified",          domCharMod);
            dataNode.addEventListener("DOMNodeInserted",          domNodeIns);
            dataNode.addEventListener("DOMNodeRemoved",           domNodeRem);
        }
        else {
            dataNode.removeEventListener("DOMCharacterDataModified", domCharMod);
            dataNode.removeEventListener("DOMAttrModified",          domCharMod);
            dataNode.removeEventListener("DOMNodeInserted",          domNodeIns);
            dataNode.removeEventListener("DOMNodeRemoved",           domNodeRem);
        }
    }

    /**
     * Executes a function as a single transaction
     */
    this.transact = function(func, dataNode){
        this.begin(dataNode);
        func();
        this.commit(dataNode);
    }

    var domCharMod = function(e){
        if (e.$didtrans || !e.currentTarget.$amlLoaded)
            return;

        var context = e.name == "DOMAttrModified"
            ? e.relatedNode
            : e.currentTarget;

        if (context.nodeName.substr(0,2) != "a_") //ignore special apf attr
            this.$stack.push({
                action : context.nodeType == 2
                  ? "setAttribute"
                  : "setTextNode",
                args   : context.nodeType == 2
                  ? [e.currentTarget, e.attrName, e.newValue]
                  : [e.currentTarget, e.newValue],
                extra  : {
                    name     : e.attrName,
                    oldValue : e.prevValue
                }
            });

        e.$didtrans = true;
    };

    var domNodeIns = function(e){
        if (e.$didtrans)
            return;

        var n = e.currentTarget;
        if (n.nodeType == 1) {
            this.$stack.push({
                action  : "appendChild",
                args    : [e.relatedNode, n, n.nextSibling],
                xmlNode : n
            });
        }
        else if (n.nodeType == 2) {
            if (n.nodeName.substr(0,2) != "a_") //ignore special apf attr
                this.$stack.push({
                    action : "setAttribute",
                    args   : [n.ownerElement, n.nodeName, n.nodeValue],
                    extra  : {
                        name : n.nodeValue
                    }
                });
        }
        else {
            this.$stack.push({
                action : "setTextNode",
                args   : [n, n.nodeValue],
                extra  : {}
            });
        }

        e.$didtrans = true;
    };

    var domNodeRem = function(e){
        if (e.$didtrans)
            return;

        this.$stack.push({
            action : "removeNode",
            args   : [e.currentTarget],
            extra  : {
                parent      : e.relatedNode,
                removedNode : e.currentTarget,
                beforeNode  : e.currentTarget.nextSibling
            }
        });
        e.$didtrans = true;
    };
    //#endif

    /**
     * Empties the action stack. After this method is run running undo
     * or redo will not do anything.
     */
    this.reset = function(){
        this.$undostack.length = this.$redostack.length = 0;

        this.setProperty("undolength", 0);
        this.setProperty("redolength", 0);
        //#ifdef __ENABLE_ACTIONTRACKER_SLIDER
        this.setProperty("length", 0);
        //#endif

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
        var undoStack = undo ? this.$undostack : this.$redostack, //local vars switch
            redoStack = undo ? this.$redostack : this.$undostack; //local vars switch

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
            this.setProperty("undolength", this.$undostack.length);
            this.setProperty("redolength", this.$redostack.length);
            return UndoObj;
        }

        if (this.dispatchEvent("beforechange") === false)
            return;

        //#ifdef __DEBUG
        this.log && this.log("Executing " + (undo ? "undo" : "redo"));
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
                                   the system administrator.");
                //#endif

                this.$undostack = [];
                this.$redostack = [];

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
                this.log && this.log("You have cancelled the automatic undo \
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
                this.$execstack = [];

                var oError = new Error(apf.formatErrorString(0, this,
                    "Executing action",
                    "Error sending action to the server:\n"
                    + (extra.url ? "Url:" + extra.url + "\n\n" : "")
                    + extra.message));

                //(UndoObj && UndoObj.xmlActionNode || extra.amlNode || apf)
                if (this.dispatchEvent("error", apf.extend({
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

            //#ifdef __WITH_RDB
            //Send out the RDB message, letting friends know of our change
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
        if (!isGroup && this.$execstack.length && !UndoObj.state
          && this.$execstack[this.$execstack.length - 1].undoObj == UndoObj) {
            this.$execstack.length--;

            // #ifdef __WITH_OFFLINE_TRANSACTIONS
            //We want to maintain the stack for sync
            if (typeof apf.offline != "undefined" && apf.offline.transactions.enabled)
                apf.offline.transactions.removeAction(this, true, "queue");
            //#endif

            //#ifdef __WITH_RDB
            UndoObj.clearRsbQueue();
            //#endif

            return;
        }

        var idx, undoObj, qItem;
        // Add the item to the queue
        if (isGroup) { //@todo currently no offline support for grouped actions
            var undoObj, qItem = this.$execstack.shift();
            for (var i = 0; i < UndoObj.length; i++) {
                undoObj = UndoObj[i];
                this.$execstack.unshift({
                    undoObj : (undoObj.tagName
                        ? undoObj
                        : new apf.UndoData(undoObj, this)).preparse(undo, this),
                    undo   : undo
                });
            }
            if (qItem)
                this.$execstack.unshift(qItem);

            return;
        }

        qItem = {
            undoObj: UndoObj.preparse(undo, this),
            undo   : undo

        };
        this.$execstack.push(qItem) - 1;

        // #ifdef __WITH_OFFLINE_TRANSACTIONS
        //We want to maintain the stack for sync
        if (typeof apf.offline != "undefined" && apf.offline.transactions.enabled)
            apf.offline.transactions.addAction(this, qItem, "queue");
        //#endif

        //The queue was empty, yay! we're gonna exec immediately
        if (this.$execstack.length == 1 && this.realtime)
            UndoObj.saveChange(undo, this);
    };

    this.$queueNext = function(UndoObj, callback){
        /*
            These thow checks are so important, that they are also executed
            in release mode.
        */
        if (!this.$execstack[0] || this.$execstack[0].undoObj != UndoObj){
            throw new Error(apf.formatErrorString(0, this, "Executing Next \
                action in queue", "The execution stack was corrupted. This is \
                a fatal error. The application should be restarted. You will \
                lose all your changes. Please contact the administrator."));
        }

        //Reset the state of the undo item
        UndoObj.state = null;

        //Remove the action item from the stack
        var lastItem = this.$execstack.shift();

        // #ifdef __WITH_OFFLINE_TRANSACTIONS
        //We want to maintain the stack for sync
        if (typeof apf.offline != "undefined" && apf.offline.transactions.enabled)
            apf.offline.transactions.removeAction(this, null, "queue");
        //#endif

        //Check if there is a new action to execute;
        if (!this.$execstack[0] || lastItem == this.$lastExecStackItem)
            return;

        // @todo you could optimize this process by using multicall, but too much for now

        //Execute action next in queue
        this.$execstack[0].undoObj.saveChange(this.$execstack[0].undo, this, callback);
    };

    //#ifdef __WITH_OFFLINE_TRANSACTIONS
    this.$loadQueue = function(stack, type){
        if (type == "queue") {
            //#ifdef __DEBUG
            if (this.$execstack.length) { //@todo
                throw new Error("oops");
            }
            //#endif

            this.$execstack = stack;
        }

        //#ifdef __WITH_OFFLINE_STATE && __WITH_OFFLINE_TRANSACTIONS
        else if (type == "undo") {
            //#ifdef __DEBUG
            if (this.$undostack.length) //@todo
                throw new Error("oops");
            //#endif

            this.$undostack = stack;
        }
        else if (type == "redo") {
            //#ifdef __DEBUG
            if (this.$redostack.length) //@todo
                throw new Error("oops");
            //#endif

            this.$redostack = stack;
        }
        //#endif

        //#ifdef __DEBUG
        else //@todo
            throw new Error("unknown");
        //#endif
    };

    this.$getQueueLength = function(){
        return this.$execstack.length;
    };

    this.$startQueue = function(callback){
        if (!this.$execstack[0] || this.$execstack[0].undoObj.state) //@todo This will probably cause a bug
            return false;

        //Execute action next in queue
        this.$execstack[0].undoObj.saveChange(this.$execstack[0].undo, this, callback);
    };
    //#endif
}).call(apf.actiontracker.prototype = new apf.AmlElement());

apf.aml.setElement("actiontracker", apf.actiontracker);

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
#endif */
