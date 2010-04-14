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
apf.offline.state = {
    enabled   : false,
    states    : {},
    realtime  : true,
    lookup    : {},

    init : function(aml){
        this.namespace = apf.config.name + ".apf.offline.state";
        
        if (aml.nodeType) {
            if (aml.getAttribute("realtime"))
                this.realtime = !apf.isFalse(aml.getAttribute("realtime"));
            
            if (aml.getAttribute("set"))
                this.setInstruction = aml.getAttribute("set");
        }
        
        apf.addEventListener("exit", function(){
            if (!apf.offline.state.realtime) {
                //apf.offline.state.search();
                var lookup  = apf.offline.state.lookup;
                var storage = apf.offline.storage;
                var ns      = apf.offline.state.namespace;
                
                for (var key in lookup) {
                    var ns = apf.offline.state.namespace;
                    storage.put(key, lookup[key], ns);
                }
            }
            
            if (apf.offline.state.setInstruction)
                apf.offline.state.send();
        });
        
        //#ifdef __WITH_REGISTRY
        var registry       = apf.extend({}, apf.offline.storage || apf.storage);
        registry.namespace = apf.config.name + ".apf.registry";
        apf.registry.$export(registry);
        apf.registry       = registry;
        //#endif

        //@todo This could be optimized if needed
        if (apf.offline.storage.getAllPairs(this.namespace, this.lookup)) {
            /*
                This is the moment the developer should do something like:
                return confirm("Would you like to continue your previous session?");
            */
            if (apf.offline.dispatchEvent("restore") === false) {
                this.clear();
                this.lookup = {};
                
                //#ifdef __WITH_OFFLINE_TRANSACTIONS
                apf.offline.transactions.clear("undo|redo");
                //#endif
            }
        }
        
        //#ifdef __WITH_OFFLINE_TRANSACTIONS

        apf.offline.transactions.doStateSync = true;
        //#endif
        
        this.enabled = true;
    },

    warned  : false,
    timeout : {},
    set : function(obj, key, value){
        //#ifdef __DEBUG
        if (!obj.name && !this.warned) {
            this.warned = true;
            apf.console.warn("Components found without name. This means that \
                              when the application changes the state \
                              serialization can break.");
        }
        //#endif

        if (!obj.tagName)
            return;
        
        var name    = obj.name || obj.$uniqueId + "_" + obj.tagName;
        var storage = apf.offline.storage;
        
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
        
        /*return apf.offline.storage.get(
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
        apf.offline.storage.clear(this.namespace);
        
        var ns = apf.registry.getNamespaces();
        for (var i = 0; i < ns.length; i++) {
            apf.registry.clear(ns[i]);
        }
        
        //#ifdef __WITH_OFFLINE_TRANSACTIONS
        apf.offline.transactions.clear("undo|redo");
        //#endif
    },

    search : function(){
        var storage = apf.offline.storage;
        
        //Search for dynamic properties
        var props, i, j, nodes = apf.all;
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
        var storage = apf.offline.storage;
        
        var data = {};
        var keys = storage.getKeys(this.namespace);
        
        for (var i = 0; i < keys.length; i++) {
            data[keys[i]] = storage.get(keys[i], this.namespace);
        }
        
        apf.saveData(this.setInstruction, {
            ignoreOffline : true,
            data          : apf.serialize(data),
            callback      : function(data, state, extra){
                if (extra.tpModule.retryTimeout(extra, state, apf.offline) === true)
                    return true;
            }
        });
    }
};
// #endif
