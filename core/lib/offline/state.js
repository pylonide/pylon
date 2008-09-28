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

// #ifdef __WITH_OFFLINE_STATE_REALTIME
// #define __WITH_OFFLINE_STATE 1
// #endif

// #ifdef __WITH_OFFLINE_STATE

//@todo optimize by not getting the default values from the jml
jpf.namespace("offline.state", {
    enabled   : false,
    states    : {},
    realtime  : true,
    lookup    : {},

    init : function(jml){
        this.namespace = jpf.appsettings.name + ".jpf.offline.state";
        
        if (jml.nodeType) {
            if (jml.getAttribute("realtime"))
                this.realtime = !jpf.isFalse(jml.getAttribute("realtime"));
            
            if (jml.getAttribute("set"))
                this.setInstruction = jml.getAttribute("set");
        }
        
        jpf.addEventListener("onexit", function(){
            if (!jpf.offline.state.realtime)
                jpf.offline.state.search();
            
            if (jpf.offline.state.setInstruction)
                jpf.offline.state.send();
        });
        
        //#ifdef __WITH_REGISTRY
        var registry       = jpf.extend({}, jpf.offline.storage || jpf.storage);
        registry.namespace = jpf.appsettings.name + ".jpf.registry";
        jpf.registry.$export(registry);
        jpf.registry       = registry;
        //#endif

        //@todo This could be optimized if needed
        if (jpf.offline.storage.getAllPairs(this.namespace, this.lookup)) {
            /*
                This is the moment the developer should do something like:
                return confirm("Would you like to continue your previous session?");
            */
            if (jpf.offline.dispatchEvent("onrestoresession") === false) {
                this.clear();
                this.lookup = {};
                
                //#ifdef __WITH_OFFLINE_TRANSACTIONS
                jpf.offline.transactions.clear("undo|redo");
                //#endif
            }
        }
        
        //#ifdef __WITH_OFFLINE_TRANSACTIONS

        jpf.offline.transactions.doStateSync = true;
        //#endif
        
        this.enabled = true;
    },

    warned  : false,
    timeout : {},
    set : function(obj, key, value){
        //#ifdef __DEBUG
        if (!obj.name && !this.warned) {
            this.warned = true;
            jpf.console.warn("Components found without name. This means that \
                              when the application changes the state \
                              serialization can break.");
        }
        //#endif

        if (!obj.tagName)
            return;
        
        var name    = obj.name || obj.uniqueId + "." + obj.tagName;
        var storage = jpf.offline.storage;
        
        //#ifdef __DEBUG
        if (!name || !storage.isValidKey(name)) { //@todo
            throw new Error("invalid")
        }
        
        if (!storage.isValidKey(key)) { //@todo
            throw new Error("invalid")
        }
        //#endif
        
        /*
            Using a timeout here, is an optimizing for fast changing properties
            such as slider values. 
        */
        key = name + "." + key, ns = this.namespace;
        clearTimeout(this.timeout[key]);
        this.timeout[key] = setTimeout(function(){
            storage.put(key, value, ns);
        }, 200);
    },
    
    get : function(obj, key, value){
        return this.lookup[(obj.name || obj.uniqueId + "." + obj.tagName) + "." + key];
        
        /*return jpf.offline.storage.get(
            (obj.name || obj.uniqueId + "." + obj.tagName) + "." + key, 
            this.namespace);*/
    },
    
    clear : function(){
        jpf.offline.storage.clear(this.namespace);
        
        var ns = jpf.registry.getNamespaces();
        for (var i = 0; i < ns.length; i++) {
            jpf.registry.clear(ns[i]);
        }
        
        //#ifdef __WITH_OFFLINE_TRANSACTIONS
        jpf.offline.transactions.clear("undo|redo");
        //#endif
    },

    search : function(){
        var storage = jpf.offline.storage;
        
        //Search for dynamic properties
        var props, i, j, nodes = jpf.all;
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].name && nodes[i].getAvailableProperties) {
                props = nodes[i].getAvailableProperties();
                for (j = 0; j < props.length; j++) {
                    if (nodes[i][props[j]])
                        this.set(nodes[i], props[j], nodes[i][props[j]]);
                }
            }
        }
        
        //@todo Search for actiontracker stacks
        
        //@todo Search for selection states
    },
    
    send : function(){
        var storage = jpf.offline.storage;
        
        var data = {};
        var keys = storage.getKeys(this.namespace);
        
        for (var i = 0; i < keys.length; i++) {
            data[keys[i]] = storage.get(keys[i], this.namespace);
        }
        
        jpf.saveData(this.setInstruction, null, {
            ignoreOffline : true,
            data          : jpf.serialize(data)
        }, function(data, state, extra){
            if (extra.tpModule.retryTimeout(extra, state, jpf.offline) === true)
                return true;
        });
    }
});
// #endif
