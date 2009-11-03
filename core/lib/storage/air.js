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

// #ifdef __WITH_STORAGE_AIR

// summary: 
//		Storage provider that uses features in the Adobe AIR runtime to achieve
//		permanent storage
			
apf.storage.modules.air = {
    init: function(){
        this.ByteArray = window.runtime.flash.utils.ByteArray;
        this.EncryptedLocalStore = window.runtime.flash.data.EncryptedLocalStore;
    },

    isAvailable: function(){
        return apf.isAIR;
    },
	
    _getItem: function(key){
        var storedValue = this.EncryptedLocalStore.getItem("__apf_" + key);
        return storedValue ? storedValue.readUTFBytes(storedValue.length) : "";
    },
	
    _setItem: function(key, value){
        var bytes = new this.ByteArray();
        bytes.writeUTFBytes(value);
        this.EncryptedLocalStore.setItem("__apf_" + key, bytes);
    },
	
    _removeItem: function(key){
        this.EncryptedLocalStore.removeItem("__apf_" + key);
    },
	
    put: function(key, value, namespace){
        //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(apf.formatErrorString(0, null,
                "Setting name/value pair", "Invalid key given: " + key));
        //#endif
        
        if(!namespace)
            namespace = this.namespace;
		    
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null,
                "Setting name/value pair", "Invalid namespace given: " + namespace));
        //#endif
		
        // try to store the value
        try {
            var namespaces = this._getItem("namespaces") || '';
            if(namespaces.indexOf('|' + namespace + '|') == -1)
                this._setItem("namespaces", namespaces + namespace + '|');

            var keys = this._getItem(namespace + "_keys") || '';
            if(keys.indexOf('|' + key + '|') == -1)
                this._setItem(namespace + "_keys", keys + key + '|');

            this._setItem('_' + namespace + '_' + key, value);
        }
        catch(e) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, null,
                "Setting name/value pair", "Error writing: " + e.message));
            //#endif
            
            return false;
        }
		
        return true;
    },
	
    get: function(key, namespace){
        //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(apf.formatErrorString(0, null, "Getting name/value pair", "Invalid key given: " + key));
        //#endif
		
        if (!namespace)
            namespace = this.namespace;
		
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null,
                "Getting name/value pair", "Invalid namespace given: " + namespace));
        //#endif
		
        return this._getItem('_' + namespace + '_' + key);
    },
	
    getNamespaces: function(){
        var results = [ this.namespace ];
        var namespaces = (this._getItem("namespaces") || '').split('|');
        for (var i=0;i<namespaces.length;i++){
            if (namespaces[i] && namespaces[i] != this.namespace)
                results.push(namespaces[i]);
        }
        return results;
    },

    getKeys: function(namespace){
        if (!namespace)
            namespace = this.namespace;
		    
        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, "Getting keys",
                "Invalid namespace given: " + namespace));
        //#endif

        var results = [];
        var keys = (this._getItem(namespace + "_keys") || '').split('|');
        for (var i = 0; i < keys.length; i++) {
            if (keys[i])
                results.push(keys[i]);
        }
		
        return results;
    },
	
    clear: function(namespace){
        if (!namespace)
            namespace = this.namespace;
	    
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, "Clearing storage",
                "Invalid namespace given: " + namespace));
        //#endif
        
        var namespaces = this._getItem("namespaces") || '';
        if (namespaces.indexOf('|' + namespace + '|') != -1)
            this._setItem("namespaces", namespaces.replace('|' + namespace + '|', '|'));

        var keys = (this._getItem(namespace + "_keys") || '').split('|');
        for (var i = 0; i < keys.length; i++)
            if (keys[i].length)
                this._removeItem(namespace + "_" + keys[i]);

        this._removeItem(namespace + "_keys");
    },
	
    remove: function(key, namespace){
        if (!namespace)
            namespace = this.namespace;
	    
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, "Removing key",
                "Invalid namespace given: " + namespace));
        //#endif
		
        var keys = this._getItem(namespace + "_keys") || '';
        if (keys.indexOf('|' + key + '|') != -1)
            this._setItem(namespace + "_keys", keys.replace('|' + key + '|', '|'));

        this._removeItem('_' + namespace + '_' + key);
    },
	
    putMultiple: function(keys, values, namespace) {
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false
            || ! values instanceof Array
            || keys.length != values.length){
            throw new Error(apf.formatErrorString(0, null, 
                "Setting multiple name/value pairs", "Invalid arguments: keys = ["
                + keys + "], values = [" + values + "]"));
        }
        //#endif
		
        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Setting multiple name/value pairs", "Invalid namespace given: "
                + namespace));
        //#endif

        // try to store the value
        try {
            for (var i = 0; i < keys.length; i++)
                this.put(keys[i], value[i], null, namespace);
        }
        catch(e) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, null,
                "Writing multiple name/value pair", "Error writing file: "
                + e.message));
            //#endif
            return false;
        }
		
        return true;
    },

    getMultiple: function(keys, namespace){
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(apf.formatErrorString(0, null,
                "Getting name/value pair", "Invalid key array given: " + keys));
        //#endif
		
        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Getting multiple name/value pairs", "Invalid namespace given: "
                + namespace));
        //#endif

        var results = [];
        for (var i = 0; i < keys.length; i++)
            results[i] = this.get(keys[i], namespace);

        return results;
    },
	
    removeMultiple: function(keys, namespace){
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(apf.formatErrorString(0, null,
                "Removing name/value pair", "Invalid key array given: " + keys));
        //#endif
		
        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Removing multiple name/value pairs", "Invalid namespace given: "
                + namespace));
        //#endif
        
        for (var i = 0; i < keys.length; i++)
            this.remove(keys[i], namespace);
    },
	
    isPermanent: function(){
        return true;
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

//#endif