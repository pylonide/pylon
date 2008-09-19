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

jpf.namespace("storage.modules.memory", {
    initialized: true,
    store      : {},
    
    isAvailable: function(){
        return true;
    },

    put: function(key, value, namespace){
        //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Setting name/value pair", 
                "Invalid key given: " + key));
        //#endif
        
        if (!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Setting name/value pair", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        // serialize the value;
        value = jpf.serialize(value);
        
        // store the value    
        if (!this.store[namespace])
            this.store[namespace] = {};
        
        this.store[namespace][key] = value;
    },

    get: function(key, namespace){
        //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Getting name/value pair", 
                "Invalid key given: " + key));
        //#endif
		
		if (!namespace)
		    namespace = this.namespace;
		
		//#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Getting name/value pair", 
                "Invalid namespace given: " + namespace));
        //#endif

        if (!this.store[namespace] || !this.store[namespace][key])
            return null;
          
        return jpf.unserialize(this.store[namespace][key]);
    },
    
    getNamespaces: function(){
        var results = [ this.namespace ];
        
        for (var ns in this.store)
            results.push(ns);
        
        return results;
    },

    getKeys: function(namespace){
        if (!namespace)
		    namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Clearing storage", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        var results = [];
        for (var prop in this.store[namespace])
            results.push(prop);
        
        return results;
    },

    clear: function(namespace){
        if (!namespace)
		    namespace = this.namespace;
	    
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Clearing storage", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        delete this.store[namespace]
    },
    
    remove: function(key, namespace){
        if (!namespace)
		    namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Removing key", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        if (this.store[namespace])
            delete this.store[namespace][key];
    },
    
    putMultiple: function(keys, values, namespace) {
        //#ifdef __DEBUG
		if (this.isValidKeyArray(keys) === false 
				|| ! values instanceof Array 
				|| keys.length != values.length){
			
			throw new Error(jpf.formatErrorString(0, null, 
			    "Setting multiple name/value pairs", 
			    "Invalid arguments: keys = [" + keys + "], \
			                        values = [" + values + "]"));
		}
		//#endif
		
		if (!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Setting multiple name/value pairs", 
                "Invalid namespace given: " + namespace));
        //#endif

         // store the value    
        if (!this.store[namespace])
            this.store[namespace] = {};
        
        // try to store the value    
        for (var i=0;i<keys.length;i++) {
            this.store[namespace][keys[i]] = jpf.serialize(values[i]);
        }
        
        return true;
    },

    getMultiple: function(keys, namespace){
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Getting name/value pair", 
                "Invalid key array given: " + keys));
        //#endif
		
		if (!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Getting multiple name/value pairs", 
                "Invalid namespace given: " + namespace));
        //#endif
        
         if (!this.store[namespace])
            return [];
        
        var results = [];
        for (var i = 0; i < keys.length; i++){
            if (this.store[namespace][keys[i]])
                results.push(jpf.unserialize(this.store[namespace][keys[i]]));
        }
        
        return results;
    },
    
    removeMultiple: function(keys, namespace){
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Removing name/value pair", 
                "Invalid key array given: " + keys));
        //#endif
		
		if (!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
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
});
