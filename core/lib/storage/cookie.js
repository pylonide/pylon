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

// #ifdef __WITH_STORAGE_MEMORY

/**
 * Storage module using browsers cookies objects to store the data. 
 * Only use this storage when using the file protocol, or if you're absolutely
 * certain that you know what you are doing.
 * @default_private
 * @todo only the put/get/remove methods are implemented correctly
 */
apf.storage.modules.cookie = {
    initialized: true,
    
    isAvailable: function(){
        return true;
    },

    /**
     * Stores a key value pair in a namespace.
     * @param {String} key       the identifier of the information.
     * @param {mixed}  value     the information to store.
     * @param {String} namespace the named context into which to store the key value pair.
     */
    put: function(key, value, namespace){
        //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Setting name/value pair", 
                "Invalid key given: " + key));
        //#endif
        
        if (!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Setting name/value pair", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        // serialize the value;
        value = apf.serialize(value);
        
        // store the value    
        apf.setcookie(namespace + "~" + key, value, 
            new Date().getTime() + (60*60*24*365*10000));
    },
    
    /**
     * Retrieves a keys in a namespace.
     * @param {String} key       the identifier of the information.
     * @param {String} namespace the named context of the keys to retrieve.
     * @return {mixed} the value that correspond to the key in the namespace.
     */
    get: function(key, namespace){
        //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Getting name/value pair", 
                "Invalid key given: " + key));
        //#endif
		
		if (!namespace)
		    namespace = this.namespace;
		
		//#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Getting name/value pair", 
                "Invalid namespace given: " + namespace));
        //#endif

        var value = apf.getcookie(namespace + "~" + key);
        return value ? apf.unserialize(value) : null;
    },
    
    /**
     * Retrieves all the namespaces in use.
     * @return {Array} list of namespaces.
     */
    getNamespaces: function(){
        throw new Error("Not Implemented");
        var results = [ this.namespace ];
        
        for (var ns in this.store)
            results.push(ns);
        
        return results;
    },

    /**
     * Retrieves all the keys of a namespace.
     * @param {String} namespace the named context of the keys to retrieve.
     * @return {Array} the list of keys in the namespace.
     */
    getKeys: function(namespace){
        throw new Error("Not Implemented");
        if (!namespace)
		    namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Clearing storage", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        var results = [];
        for (var prop in this.store[namespace])
            results.push(prop);
        
        return results;
    },

    /** 
     * Removes all keys from a namespace
     */
    clear: function(namespace){
        throw new Error("Not Implemented");
        if (!namespace)
		    namespace = this.namespace;
	    
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Clearing storage", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        delete this.store[namespace]
    },
    
    /**
     * Removes a key in a namespace.
     * @param {String} key       the identifier of the information.
     * @param {String} namespace the named context of the keys to remove.
     */
    remove: function(key, namespace){
        if (!namespace)
		    namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Removing key", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        apf.delcookie(namespace + "~" + key);
    },
    
    /**
     * Stores a key value pair in a namespace.
     * @param {Array}  keys      a list of keys that identify the information stored.
     * @param {Array}  values    a list of values to store.
     * @param {String} namespace the named context into which to store the key value pair.
     */
    putMultiple: function(keys, values, namespace) {
        throw new Error("Not Implemented");
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false
          || ! values instanceof Array
          || keys.length != values.length) {
            throw new Error(apf.formatErrorString(0, null,
                "Setting multiple name/value pairs",
                "Invalid arguments: keys = [" + keys + "], \
                                    values = [" + values + "]"));
        }
        //#endif

        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Setting multiple name/value pairs", 
                "Invalid namespace given: " + namespace));
        //#endif

         // store the value    
        if (!this.store[namespace])
            this.store[namespace] = {};
        
        // try to store the value    
        for (var i = 0; i < keys.length; i++) {
            this.store[namespace][keys[i]] = apf.serialize(values[i]);
        }
        
        return true;
    },

    /**
     * Retrieves all the values of several keys in a namespace.
     * @param {Array}  keys      a list of keys that identify the information retrieved.
     * @param {String} namespace the named context into which to store the key value pair.
     * @returns {Array} list of values that have been retrieved.
     */
    getMultiple: function(keys, namespace){
        throw new Error("Not Implemented");
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(apf.formatErrorString(0, null, 
                "Getting name/value pair", 
                "Invalid key array given: " + keys));
        //#endif
		
		if (!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Getting multiple name/value pairs", 
                "Invalid namespace given: " + namespace));
        //#endif
        
         if (!this.store[namespace])
            return [];
        
        var results = [];
        for (var i = 0; i < keys.length; i++){
            if (this.store[namespace][keys[i]])
                results.push(apf.unserialize(this.store[namespace][keys[i]]));
        }
        
        return results;
    },
    
    /**
     * Removes a key in a namespace.
     * @param {Array}  keys      a list of keys that identify the information to be removed.
     * @param {String} namespace the named context of the keys to remove.
     */
    removeMultiple: function(keys, namespace){
        throw new Error("Not Implemented");
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(apf.formatErrorString(0, null, 
                "Removing name/value pair", 
                "Invalid key array given: " + keys));
        //#endif

        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Removing multiple name/value pairs", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        if (!this.store[namespace])
            return;
        
        for (var  i = 0; i < keys.length; i++)
            delete this.store[namespace][keys[i]];
    },                 
    
    isPermanent: function(){
        return false;
    },

    getMaximumSize: function(){
        return this.SIZE_NO_LIMIT;
    },

    hasSettingsUI: function(){
        return false;
    },
    
    showSettingsUI: function(){
        throw new Error(this.declaredClass 
            + " does not support a storage settings user-interface");
    },
    
    hideSettingsUI: function(){
        throw new Error(this.declaredClass 
            + " does not support a storage settings user-interface");
    }
};
// #endif
