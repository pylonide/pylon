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

jpf.offline.canTransact = function(){
    if(!jpf.offline.enabled || this.isOnline || this.transactions.enabled)
        return true;
    
    //Transactions can be enabled from this event
    if(this.dispatchEvent("ontransactioncancel", {
        message : "Could not execute transaction whilst being offline,\
                   silently doing nothing",
        bubbles : true
    }) === true)
        return true;
    
    return false;
};

jpf.offline.transactions = {
    enabled   : false,
    namespace : jpf.appsettings.name + ".jpf.offline.transactions",
       
    init : function(){
        this.enabled = true;
    },
        
    /**
     * data GET requests aren't be synced but disallowed, 
     * such as j:load/j:insert bindings ans model load=""
     * This function will sent the ontransactioncancel event which 
     * can be used to notify the user that we're offline.
     */
    actionNotAllowed : function(){
        jpf.offline.dispatchEvent("ontransactioncancel", {
            message : "Transaction is not allowed",
            bubbles : true
        });
        
        return;
    },
    
    //@todo you might want to error on dotts in the at name
    addAction : function(at, qItem, type){
        //#ifdef __DEBUG
        if (!at.name || !jpf.storage.base.isValidKey(at.name)) {
            //@todo
            alert("error");
        }
        //#endif
        
        var namespace = this.namespace + "." + at.name + "." + type;
        var storage   = jpf.offline.storage;
        var len       = parseInt(storage.get("length", namespace)) || 0;
        
        storage.put(len, jpf.serialize({
            undo    : qItem.undo,
            undoObj : qItem.undoObj.__export()
        }), namespace);
        storage.put("length", ++len, namespace);
    },
    
    removeAction : function(at, fromTop, type){
        var namespace = this.namespace + "." + at.name + "." + type;
        var storage   = jpf.offline.storage;
        
        //@todo add checks for stack sanity
        if (fromTop) {
            var len = parseInt(storage.get("length", namespace)) - 1;
            
            if (len < 0) //@todo
                throw new Error(0, "something went terribly wrong"); 
            
            storage.remove(len, namespace);
            storage.put("length", len, namespace);
        }
        else {
            var start = parseInt(storage.get("start", namespace)) || 0;
            storage.remove(start, namespace)
            storage.put("start", ++start, namespace);
        }
    },
    
    rebuildActionQueues : function(){
        var storage    = jpf.offline.storage;
        var namespaces = storage.getNamespaces();
        var re         = new RegExp(this.namespace + "\\.([^\\.]*)\\.([^\\.]*)");
        
        for (var ats = [], i = 0;i < namespaces.length; i++) {
            if (namespaces[i].match(re))
                ats.push([RegExp.$1, RegExp.$2]);
        }
        
        var i, j, qItem, stack, namespace, at, start, len, type;
        for (i = 0; i < ats.length; i++) {
            at        = jpf.nameserver.get("actiontracker", ats[i][0]);
            type      = ats[i][1];
            
            //#ifdef __DEBUG
            if (!at) { //@todo
                throw new Error(0, "arrggg");
            }
            //#endif
            
            namespace = this.namespace + "." + at.name;
            start     = parseInt(storage.get("start", namespace)) || 0;
            len       = parseInt(storage.get("length", namespace)) || 0;
            stack     = [];
            
            for (j = start; j < len; j++) {
                qItem         = jpf.unserialize(storage.get(len, namespace));
                qItem.at      = at;
                qItem.undoObj = new jpf.UndoData().__import(qItem);
                stack.push(qItem);
            }
            
            at.__loadQueue(stack, type);
        }
    },
    
    clear : function(queues){
        if (!queues)
            queues = "undo|redo|exec";
        
        var storage    = jpf.offline.storage;
        var namespaces = storage.getNamespaces();
        var re         = new RegExp(this.namespace + "\\.([^\\.]*)\\.(" + queues + ")");
        
        for (var i = 0; i < namespaces.length; i++) {
            if (namespaces[i].match(re))
                storage.clear(namespaces[i]);
        }
    },
    
    load : function(){
        this.rebuildActionQueues();
    },
    
    stopSync : function(callback){
        //No stopping here.. the queue will fill itself automatically
        callback();
    },

    getSyncLength : function(){
        var ats = jpf.nameserver.getAll("actiontracker");
        
        var len = 0;
        for (var i = 0; i < ats.length; i++)
            len += ats[i].__getQueueLength();
        
        return len;
    },

    sync : function(callback){
        var ats = jpf.nameserver.getAll("actiontracker");
        
        var qNr = 0, len = 0;
        for (var i = 0; i < ats.length; i++) {
            if (ats[i].__getQueueLength()) {
                len += ats[i].__getQueueLength();
                ats[i].__startQueue(function(last){
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
    }
}
// #endif
