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

// #ifdef __WITH_OFFLINE_TRANSACTIONS

/**
 * Object recording the state of actiontrackers. When an application goes 
 * offline, the state is maintained such that it can be synced at a later date.
 * The actiontracker state can be maintained even when the application restarts.
 * In most cases the functionality of this object will be managed from within 
 * the offline element in AML.
 * Example:
 * <code>
 *  <a:offline ontransactioncancel="alert('You are currently offline')" />
 * </code>
 *
 * @define offline
 * @event transactioncancel Fires before installation of an offline provider
 *   enableable Cancels the installation of the offline provider
 *
 * @default_private
 * @todo remove serialize here
 */
apf.offline.transactions = {
    enabled   : false,
       
    init : function(){
        this.namespace = apf.config.name + ".apf.offline.transactions";
        this.enabled   = true;
        
        //#ifdef __WITH_OFFLINE_STATE
        apf.addEventListener("load", function(){
            apf.offline.transactions.rebuildActionQueues();
            apf.removeEventListener("load", arguments.callee);
        });
        //#endif
    },
        
    /*
     * data GET requests aren't synced but disallowed, 
     * such as load/insert bindings and model load=""
     * This function will sent the ontransactioncancel event which 
     * can be used to notify the user that we're offline.
     */
    actionNotAllowed : function(){
        apf.offline.dispatchEvent("transactioncancel", {
            message : "Transaction is not allowed",
            bubbles : true
        });
        
        return;
    },
    
    //@todo you might want to error on dotts in the at name
    addAction : function(at, qItem, type){
        //#ifdef __DEBUG
        if (!at.name || !apf.storage.base.isValidKey(at.name)) {
            //@todo
            throw new Error("Invalid or missing name for actiontracker \
                used for offline transactions '" + at.name + "'.");
        }
        //#endif
        
        var namespace = this.namespace + "." + at.name + "." + type;
        var storage   = apf.offline.storage;
        var len       = parseInt(storage.get("length", namespace)) || 0;
        
        storage.put(len, apf.serialize(type == "queue"
            ? {
                undo    : qItem.undo,
                undoObj : qItem.undoObj.$export()
            }
            : qItem.$export()), namespace);
        storage.put("length", ++len, namespace);
    },
    
    removeAction : function(at, fromTop, type){
        var namespace = this.namespace + "." + at.name + "." + type;
        var storage   = apf.offline.storage;
        
        //@todo add checks for stack sanity
        if (fromTop) {
            var len = parseInt(storage.get("length", namespace)) - 1;
            var start = parseInt(storage.get("start", namespace)) || 0;
            
            //#ifdef __DEBUG
            if (len < 0) {//@todo
                throw new Error("something went terribly wrong"); 
            }
            //#endif
            
            if (start == len || len < 0) {
                storage.clear(namespace);
                return;
            }
            
            storage.remove(len, namespace);
            storage.put("length", len, namespace);
        }
        else {
            var start = parseInt(storage.get("start", namespace)) || 0;
            var len = parseInt(storage.get("length", namespace)) || 0;
            
            if (start + 1 == len) {
                storage.clear(namespace);
                return;
            }
            
            storage.remove(start, namespace)
            storage.put("start", ++start, namespace);
        }
    },
    
    rebuildActionQueues : function(){
        var storage    = apf.offline.storage;
        var namespaces = storage.getNamespaces();
        if (!namespaces) return;
        var lookup, re = new RegExp(this.namespace + "\\.([^\\.]*)\\.([^\\.]*)");

        for (var ats = [], i = 0; i < namespaces.length; i++) {
            if (namespaces[i].match(re))
                ats.push([RegExp.$1, RegExp.$2]);
        }
        
        var i, j, qItem, stack, namespace, at, start, len, type;
        //#ifdef __WITH_NAMESERVER
        for (i = 0; i < ats.length; i++) {
            at        = apf.nameserver.get("actiontracker", ats[i][0]);
            type      = ats[i][1];
            
            //#ifdef __DEBUG
            if (!at) { //@todo
                throw new Error(apf.formatErrorString(0, null,
                    "Rebuilding Action Queue",
                    "An actiontracker could not be found by the name of '" 
                    + ats[i][0] + "'"));
            }
            //#endif
            
            lookup    = {};
            namespace = this.namespace + "." + at.name + "." + type;
            storage.getAllPairs(namespace, lookup);
            
            start     = parseInt(lookup["start"]) || 0;
            len       = parseInt(lookup["length"]) || 0;
            stack     = [];
            
            //#ifdef __DEBUG
            apf.console.info("Restoring " + type + " stack for " 
                             + (at.name == "default"
                                ? "the default actiontracker"
                                : "the '" + at.name + "' actiontracker")
                             + " of " + len + " items.");
            //#endif

            if (type == "queue") {
                for (j = len - 1; j >= start; j--) {
                    qItem            = apf.unserialize(lookup[j]);
                    qItem.undoObj    = new apf.UndoData(qItem.undoObj, at).$import();
                    stack.unshift(qItem);
                }
            }
            else {
                for (j = len - 1; j >= start; j--) {
                    qItem    = apf.unserialize(lookup[j]);
                    stack.unshift(new apf.UndoData(qItem, at).$import());
                }
            }
            
            at.$loadQueue(stack, type);
            
            apf.offline.sLookup = null;
        }
        //#endif
    },
    
    clearActions : function(at, type){
        apf.offline.storage.clear(this.namespace + "." + at.name + "." + type);
    },
    
    clear : function(queues){
        if (!queues)
            queues = "undo|redo|queue";
        
        var storage    = apf.offline.storage;
        var namespaces = storage.getNamespaces();
        var re         = new RegExp(this.namespace + "\\.([^\\.]*)\\.(" + queues + ")");
        
        for (var i = 0; i < namespaces.length; i++) {
            if (namespaces[i].match(re))
                storage.clear(namespaces[i]);
        }
    },
    
    stopSync : function(callback){
        //No stopping here.. the queue will fill itself automatically
        callback();
    },

    getSyncLength : function(){
        //#ifdef __WITH_NAMESERVER
        var ats = apf.nameserver.getAll("actiontracker");
        
        var len = 0;
        for (var i = 0; i < ats.length; i++)
            len += ats[i].$getQueueLength();
        
        return len;
        //#endif
    },

    sync : function(callback){
        //#ifdef __WITH_NAMESERVER
        var ats = apf.nameserver.getAll("actiontracker");
        
        var qNr = 0, len = 0;
        for (var i = 0; i < ats.length; i++) {
            if (ats[i].$getQueueLength()) {
                len += ats[i].$getQueueLength();
                ats[i].$startQueue(function(last){
                    if (qNr >= len - 1)
                        return false; //silently ignore later changes... (might be wrong)
                    
                    if (last)
                        qNr = len;
                    
                    callback({
                        position : ++qNr,
                        length   : len
                    });
                    
                    if(qNr >= len - 1)
                        callback({finished: true});
                });
            }
        }
        //#endif
    }
};

/**
 * Determines whether it's possible to start a new action.
 * @private
 * @method
 */
apf.offline.canTransact = function(){
    if(!apf.offline.enabled || this.onLine || this.transactions.enabled)
        return true;
    
    //Transactions can be enabled from this event
    if(this.dispatchEvent("transactioncancel", {
        message : "Could not execute transaction whilst being offline,\
                   silently doing nothing",
        bubbles : true
    }) === true)
        return true;
    
    return false;
};
// #endif
