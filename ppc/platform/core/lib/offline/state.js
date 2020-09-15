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

// #ifdef __WITH_OFFLINE_STATE

/**
 * Object recording the state of all elements. If the realtime attribute is
 * set the state of the elements is recorded realtime. Otherwise it is 
 * recorded only when the application exits. During startup the state of the 
 * application can be restored by cancelling the 'restore' event. In most cases 
 * the functionality of this object will be managed from within the offline 
 * element in AML.
 * Example:
 * <code>
 *  <a:offline 
 *    realtime  = "true" 
 *    set       = "store_session.jsp" 
 *    onrestore = "return confirm('Would you like to continue where you left of?')" />
 * </code>
 *
 * @event restore Fires before restoring the application to the predefined state.
 *   cancelable: Loads the stored state into the applicaton.
 *
 * @define offline
 * @attribute {String} [set]    a datainstruction that stores the state of the application to an external data store.
 *
 * @default_private
 * @todo optimize by not getting the default values from the aml
 */
ppc.offline.state = {
    enabled   : false,
    states    : {},
    realtime  : true,
    lookup    : {},

    init : function(aml){
        this.namespace = ppc.config.name + ".ppc.offline.state";
        
        if (aml.nodeType) {
            if (aml.getAttribute("realtime"))
                this.realtime = !ppc.isFalse(aml.getAttribute("realtime"));
            
            if (aml.getAttribute("set"))
                this.setInstruction = aml.getAttribute("set");
        }
        
        ppc.addEventListener("exit", function(){
            if (!ppc.offline.state.realtime) {
                //ppc.offline.state.search();
                var lookup  = ppc.offline.state.lookup;
                var storage = ppc.offline.storage;
                var ns      = ppc.offline.state.namespace;
                
                for (var key in lookup) {
                    var ns = ppc.offline.state.namespace;
                    storage.put(key, lookup[key], ns);
                }
            }
            
            if (ppc.offline.state.setInstruction)
                ppc.offline.state.send();
        });
        
        //#ifdef __WITH_REGISTRY
        var registry       = ppc.extend({}, ppc.offline.storage || ppc.storage);
        registry.namespace = ppc.config.name + ".ppc.registry";
        ppc.registry.$export(registry);
        ppc.registry       = registry;
        //#endif

        //@todo This could be optimized if needed
        if (ppc.offline.storage.getAllPairs(this.namespace, this.lookup)) {
            /*
                This is the moment the developer should do something like:
                return confirm("Would you like to continue your previous session?");
            */
            if (ppc.offline.dispatchEvent("restore") === false) {
                this.clear();
                this.lookup = {};
                
                //#ifdef __WITH_OFFLINE_TRANSACTIONS
                ppc.offline.transactions.clear("undo|redo");
                //#endif
            }
        }
        
        //#ifdef __WITH_OFFLINE_TRANSACTIONS

        ppc.offline.transactions.doStateSync = true;
        //#endif
        
        this.enabled = true;
    },

    warned  : false,
    timeout : {},
    set : function(obj, key, value){
        //#ifdef __DEBUG
        if (!obj.name && !this.warned) {
            this.warned = true;
            ppc.console.warn("Components found without name. This means that \
                              when the application changes the state \
                              serialization can break.");
        }
        //#endif

        if (!obj.tagName)
            return;
        
        var name    = obj.name || obj.$uniqueId + "_" + obj.tagName;
        var storage = ppc.offline.storage;
        
        //#ifdef __DEBUG
        if (!name || !storage.isValidKey(name)) { //@todo
            throw new Error("invalid")
        }
        
        if (!storage.isValidKey(key)) { //@todo
            throw new Error("invalid")
        }
        //#endif
        
        /*
            Using a timeout here, is an optimization for fast changing 
            properties such as slider values. 
        */
        key = name + "." + key;
        this.lookup[key] = value;
        
        if (!this.realtime)
            return;
        
        var ns = this.namespace;
        clearTimeout(this.timeout[key]);
        this.timeout[key] = $setTimeout(function(){
            storage.put(key, value, ns);
        }, 200);
    },
    
    get : function(obj, key, value){
        return this.lookup[(obj.name || obj.$uniqueId + "_" + obj.tagName) + "." + key];
        
        /*return ppc.offline.storage.get(
            (obj.name || obj.$uniqueId + "." + obj.tagName) + "." + key, 
            this.namespace);*/
    },
    
    //blrgh.. unoptimized
    getAll : function(obj) {
        var prop, res = {}, x,
            name = obj.name || obj.$uniqueId + "_" + obj.tagName;
        for (prop in this.lookup) {
            x = prop.split(".");
            if (x[0] == name)
                res[x[1]] = this.lookup[prop];
        }
        
        return res;
    },
    
    clear : function(){
        ppc.offline.storage.clear(this.namespace);
        
        var ns = ppc.registry.getNamespaces();
        for (var i = 0; i < ns.length; i++) {
            ppc.registry.clear(ns[i]);
        }
        
        //#ifdef __WITH_OFFLINE_TRANSACTIONS
        ppc.offline.transactions.clear("undo|redo");
        //#endif
    },

    search : function(){
        var storage = ppc.offline.storage;
        
        //Search for dynamic properties
        var props, i, j, nodes = ppc.all;
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
        var storage = ppc.offline.storage;
        
        var data = {};
        var keys = storage.getKeys(this.namespace);
        
        for (var i = 0; i < keys.length; i++) {
            data[keys[i]] = storage.get(keys[i], this.namespace);
        }
        
        ppc.saveData(this.setInstruction, {
            ignoreOffline : true,
            data          : JSON.stringify(data),
            callback      : function(data, state, extra){
                if (extra.tpModule.retryTimeout(extra, state, ppc.offline) === true)
                    return true;
            }
        });
    }
};
// #endif
