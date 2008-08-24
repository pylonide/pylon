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

// #ifdef __WITH_STORAGE_AIR_FILE

// summary: 
//		Storage provider that uses features in the Adobe AIR runtime to achieve
//		permanent storage

jpf.storage["air.file"] = {
	initialized: false,
	
	storagePath: "__JPF_" + (jpf.appsettings.name 
	    ? jpf.appsettings.name.toUpperCase() 
	    : "STORAGE") + "/",

	initialize: function(){
        this.File = window.runtime.flash.filesystem.File;
		this.FileStream = window.runtime.flash.filesystem.FileStream;
		this.FileMode = window.runtime.flash.filesystem.FileMode;

		// need to initialize our storage directory
		try{
			var dir = this.File.applicationStorageDirectory.resolvePath(this.storagePath);
			if (!dir.exists){
				dir.createDirectory();
			}
			this.initialized = true;
		}catch(e){
		    jpf.issueWarning(0, e.message);
			return false;
		}
	},

	isAvailable: function(){
		return jpf.isAIR;
	},
	
	put: function(key, value, namespace){
		//#ifdef __DEBUG
        if(this.isValidKey(key) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Setting name/value pair", "Invalid key given: " + key));
        //#endif
        
        if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Setting name/value pair", "Invalid namespace given: " + namespace));
        //#endif
		
		// try to store the value
		try{
			this.remove(key, namespace);
			
			var dir = this.File.applicationStorageDirectory.resolvePath(this.storagePath + namespace);
			if (!dir.exists)
				dir.createDirectory();
			
			var file = dir.resolvePath(key);
			var stream = new this.FileStream();
			stream.open(file, this.FileMode.WRITE);
			stream.writeObject(value);
			stream.close();
		}catch(e){
			//#ifdef __DEBUG
            throw new Error(0, jpf.formatErrorString(0, null, "Setting name/value pair", "Error writing file: " + e.message));
            //#endif
			
			return false;
		}
		
		return true;
	},
	
	get: function(key, namespace){
		//#ifdef __DEBUG
        if(this.isValidKey(key) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid key given: " + key));
        //#endif
		
		if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;
		
		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid namespace given: " + namespace));
        //#endif
		
		var file = this.File.applicationStorageDirectory.resolvePath(this.storagePath + namespace + '/' + key);
		if (!file.exists || file.isDirectory)
		    return false;

		var stream = new this.FileStream();
		stream.open(file, this.FileMode.READ);
		var results = stream.readObject();
		stream.close();
		
		return results;
	},
	
	getNamespaces: function(){
		var results = [ this.DEFAULT_NAMESPACE ];
		var dir = this.File.applicationStorageDirectory.resolvePath(this.storagePath);
		var files = dir.getDirectoryListing();
		for (i = 0; i < files.length; i++) {
			if(files[i].isDirectory && files[i].name != this.DEFAULT_NAMESPACE)
				results.push(files[i].name);
		}
		
		return results;
	},

	getKeys: function(namespace){
		if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Clearing storage", "Invalid namespace given: " + namespace));
        //#endif

		var results = [];
		var dir = this.File.applicationStorageDirectory.resolvePath(this.storagePath + namespace);
		if (dir.exists && dir.isDirectory){
			var files = dir.getDirectoryListing();
			for (i = 0; i < files.length; i++) {
				results.push(files[i].name);
			}
		}
		return results;
	},
	
	clear: function(namespace){
	    if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;
	    
        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Clearing storage", "Invalid namespace given: " + namespace));
        //#endif
		
		var dir = this.File.applicationStorageDirectory.resolvePath(this.storagePath + namespace);
		if (dir.exists && dir.isDirectory)
			dir.deleteDirectory(true);
	},
	
	remove: function(key, namespace){
	    if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Removing key", "Invalid namespace given: " + namespace));
        //#endif

		var file = this.File.applicationStorageDirectory.resolvePath(this.storagePath + namespace + '/' + key);
		if (file.exists && !file.isDirectory)
			file.deleteFile();
	},
	
	putMultiple: function(keys, values, namespace) {
	    //#ifdef __DEBUG
		if(this.isValidKeyArray(keys) === false 
				|| ! values instanceof Array 
				|| keys.length != values.length){
			throw new Error(0, jpf.formatErrorString(0, null, "Setting multiple name/value pairs", "Invalid arguments: keys = [" + keys + "], values = [" + values + "]"));
		}
		//#endif
		
		if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Setting multiple name/value pairs", "Invalid namespace given: " + namespace));
        //#endif

		// try to store the value	
		try{
			for(var i=0;i<keys.length;i++) {
				this.put(keys[i], value[i], null, namespace);
			}
		}catch(e){
			//#ifdef __DEBUG
            throw new Error(0, jpf.formatErrorString(0, null, "Writing multiple name/value pair", "Error writing file: " + e.message));
            //#endif
			return false;
		}
		
		return true;
	},

	getMultiple: function(keys, namespace){
		//#ifdef __DEBUG
        if(this.isValidKeyArray(keys) === false){
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid key array given: " + keys));
        //#endif
		
		if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting multiple name/value pairs", "Invalid namespace given: " + namespace));
        //#endif

		var results = [];
		for(var i=0;i<keys.length;i++)
			results[i] = this.get(keys[i], namespace);

		return results;
	},
	
	removeMultiple: function(keys, namespace){
		//#ifdef __DEBUG
        if(this.isValidKeyArray(keys) === false){
            throw new Error(0, jpf.formatErrorString(0, null, "Removing name/value pair", "Invalid key array given: " + keys));
        //#endif
		
		if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Removing multiple name/value pairs", "Invalid namespace given: " + namespace));
        //#endif
		
		for(var i=0;i<keys.length;i++)
			this.remove(keys[i], namespace);
	}, 				
	
	isPermanent: function(){ return true; },

	getMaximumSize: function(){ return this.SIZE_NO_LIMIT; },

	hasSettingsUI: function(){ return false; },
	
	showSettingsUI: function(){
		throw new Error(this.declaredClass + " does not support a storage settings user-interface");
	},
	
	hideSettingsUI: function(){
		throw new Error(this.declaredClass + " does not support a storage settings user-interface");
	}
};

//#endif