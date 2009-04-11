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

//#ifdef __WITH_NAMESERVER

/**
 * @private
 */
jpf.namespace("nameserver", {
    lookup : {},
    
    add : function(type, item){
        if (!this.lookup[type])
            this.lookup[type] = [];
        
        //#ifdef __DEBUG
        if(this.onchange)
            this.onchange(type, item);
        //#endif
        
        return this.lookup[type].push(item) - 1;
    },
    
    register : function(type, id, item){
        if (!this.lookup[type])
            this.lookup[type] = {};

        //#ifdef __DEBUG
        if (this.onchange)
            this.onchange(type, item, id);
        //#endif

        return (this.lookup[type][id] = item);
    },
    
    get : function(type, id){
        return this.lookup[type] ? this.lookup[type][id] : null;
    },
    
    getAll : function(type){
        var name, arr = [];
        for (name in this.lookup[type]) {
            //#ifdef __SUPPORT_SAFARI2
            if (jpf.isSafariOld
              && (!this.lookup[type][name]
              || typeof this.lookup[type][name] != "object"))
                continue;
            //#endif
            arr.push(this.lookup[type][name]);
        }
        return arr;
    }, 
    
    getAllNames : function(type){
        var name, arr = [];
        for (name in this.lookup[type]){
            if (parseInt(name) == name) continue;
            arr.push(name);
        }
        return arr;
    }
});

//#endif

//#ifdef __WITH_REGISTRY
/**
 * Object which provides a means to store key values pairs in a named context.
 * @see core.storage
 */
jpf.registry = jpf.extend({
    /**
     * Stores a key value pair.
     * @param {String} key       the identifier of the information.
     * @param {mixed}  value     the information to store.
     * @param {String} namespace the named context into which to store the key value pair.
     */
    put : function(key, value, namespace){
        this.register(namespace, key, value);
    },
    
    /**
     * @private
     */
    getNamespaces : function(){
        
    },
    
    /**
     * Retrieves all the keys of a namespace.
     * @param {String} namespace the named context of the keys to retrieve.
     * @return {Array} the list of keys in the namespace.
     */
    getKeys : function(namespace){
        return this.getAllNames(namespace);
    },
    
    /**
     * Removes a key in a namespace.
     * @param {String} key       the identifier of the information.
     * @param {String} namespace the named context of the keys to remove.
     */
    remove : function(key, namespace){
        delete this.lookup[namespace][key];
    },
    
    /**
     * @private
     */
    clear : function(namespace){
        this.lookup = {}; //@todo
    },
    
    $export : function(storage){
        var namespace, key;

        for (namespace in this.lookup) {
            for (key in this.lookup[namespace]) {
                storage.put(key, this.lookup[key][namespace], namespace);
            }
        }
    }
}, jpf.nameserver);

/**
 * @private
 */
jpf.registry.lookup = {};

/**
 * Retrieves a keys in a namespace.
 * @param {String} key       the identifier of the information.
 * @param {String} namespace the named context of the keys to retrieve.
 * @return {mixed} the value that correspond to the key in the namespace.
 */
jpf.registry.get = function(key, namespace){
    return this.lookup[namespace] ? this.lookup[namespace][key] : null;
};

//#endif
