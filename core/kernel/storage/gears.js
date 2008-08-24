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

// #ifdef __WITH_STORAGE_GEARS

// summary:
//		Storage provider that uses the features of Google Gears
//		to store data (it is saved into the local SQL database
//		provided by Gears, using dojox.sql)
// description: 
//		You can disable this storage provider with the following djConfig
//		variable:
//		var djConfig = { disableGearsStorage: true };
			
jpf.storage.gears = {
	// instance methods and properties
	table_name: "__JPF_" + (jpf.appsettings.name 
	    ? jpf.appsettings.name.toUpperCase() 
	    : "STORAGE"),
	initialized: false,
	
	_available: null,
	
	initialize: function(){
		// create the table that holds our data
		try{
			dojox.sql("CREATE TABLE IF NOT EXISTS " + this.table_name + "( "
						+ " namespace TEXT, "
						+ " key TEXT, "
						+ " value TEXT "
						+ ")"
					);
			dojox.sql("CREATE UNIQUE INDEX IF NOT EXISTS namespace_key_index" 
						+ " ON " + this.table_name
						+ " (namespace, key)");
		}catch(e){
			console.debug("dojox.storage.GearsStorageProvider.initialize:", e);
			
			this.initialized = false; // we were unable to initialize
			dojox.storage.manager.loaded();
			return;
		}
		
		// indicate that this storage provider is now loaded
		this.initialized = true;
		dojox.storage.manager.loaded();	
	},
	
	initGears : function(){
    	// summary: 
    	//		factory method to get a Google Gears plugin instance to
    	//		expose in the browser runtime environment, if present
    	var factory;
    	var results;
    	
    	var gearsObj = jpf.NameServer.get("google", "gears");
    	if(gearsObj)
    	    return gearsObj; // already defined elsewhere
    	
    	if(typeof GearsFactory != "undefined"){ // Firefox
    		factory = new GearsFactory();
    	}else{
    		if(dojo.isIE){
    			// IE
    			try{
    				factory = new ActiveXObject("Gears.Factory");
    			}catch(e){
    				// ok to squelch; there's no gears factory.  move on.
    			}
    		}else if(navigator.mimeTypes["application/x-googlegears"]){
    			// Safari?
    			factory = document.createElement("object");
    			factory.setAttribute("type", "application/x-googlegears");
    			factory.setAttribute("width", 0);
    			factory.setAttribute("height", 0);
    			factory.style.display = "none";
    			document.documentElement.appendChild(factory);
    		}
    	}
    
    	// still nothing?
    	if(!factory)
    	    return null;
    	
    	return jpf.NameServer.register("google", "gears", factory);
    },
    
	isAvailable: function(){
	    if(typeof jpf.isGears == "undefined")
	        jpf.isGears = !!jpf.storage.gears.initGears() || 0;

		// is Google Gears available and defined?
		return jpf.isGears;
	},

	put: function(key, value, resultsHandler, namespace){
		if(this.isValidKey(key) == false){
			throw new Error("Invalid key given: " + key);
		}
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		// serialize the value;
		// handle strings differently so they have better performance
		if(dojo.isString(value)){
			value = "string:" + value;
		}else{
			value = dojo.toJson(value);
		}
		
		// try to store the value	
		try{
			dojox.sql("DELETE FROM " + this.table_name
						+ " WHERE namespace = ? AND key = ?",
						namespace, key);
			dojox.sql("INSERT INTO " + this.table_name
						+ " VALUES (?, ?, ?)",
						namespace, key, value);
		}catch(e){
			// indicate we failed
			console.debug("dojox.storage.GearsStorageProvider.put:", e);
			resultsHandler(this.FAILED, key, e.toString());
			return;
		}
		
		if(resultsHandler){
			resultsHandler(dojox.storage.SUCCESS, key, null);
		}
	},

	get: function(key, namespace){
		if(this.isValidKey(key) == false){
			throw new Error("Invalid key given: " + key);
		}
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		// try to find this key in the database
		var results = dojox.sql("SELECT * FROM " + this.table_name
									+ " WHERE namespace = ? AND "
									+ " key = ?",
									namespace, key);
		if(!results.length){
			return null;
		}else{
			results = results[0].value;
		}
		
		// destringify the content back into a 
		// real JavaScript object;
		// handle strings differently so they have better performance
		if(dojo.isString(results) && (/^string:/.test(results))){
			results = results.substring("string:".length);
		}else{
			results = dojo.fromJson(results);
		}
		
		return results;
	},
	
	getNamespaces: function(){
		var results = [ dojox.storage.DEFAULT_NAMESPACE ];
		
		var rs = dojox.sql("SELECT namespace FROM " + this.table_name
							+ " DESC GROUP BY namespace");
		for(var i = 0; i < rs.length; i++){
			if(rs[i].namespace != dojox.storage.DEFAULT_NAMESPACE){
				results.push(rs[i].namespace);
			}
		}
		
		return results;
	},

	getKeys: function(namespace){
		namespace = namespace||this.DEFAULT_NAMESPACE;
		if(this.isValidKey(namespace) == false){
			throw new Error("Invalid namespace given: " + namespace);
		}
		
		var rs = dojox.sql("SELECT key FROM " + this.table_name
							+ " WHERE namespace = ?",
							namespace);
		
		var results = [];
		for(var i = 0; i < rs.length; i++){
			results.push(rs[i].key);
		}
		
		return results;
	},

	clear: function(namespace){
		if(this.isValidKey(namespace) == false){
			throw new Error("Invalid namespace given: " + namespace);
		}
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		dojox.sql("DELETE FROM " + this.table_name 
					+ " WHERE namespace = ?",
					namespace);
	},
	
	remove: function(key, namespace){
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		dojox.sql("DELETE FROM " + this.table_name 
					+ " WHERE namespace = ? AND"
					+ " key = ?",
					namespace,
					key);
	},
	
	putMultiple: function(keys, values, resultsHandler, namespace) {
		if(this.isValidKeyArray(keys) === false 
				|| ! values instanceof Array 
				|| keys.length != values.length){
			throw new Error("Invalid arguments: keys = [" 
							+ keys + "], values = [" + values + "]");
		}
		
		if(namespace == null || typeof namespace == "undefined"){
			namespace = dojox.storage.DEFAULT_NAMESPACE;		
		}

		if(this.isValidKey(namespace) == false){
			throw new Error("Invalid namespace given: " + namespace);
		}

		this._statusHandler = resultsHandler;

		// try to store the value	
		try{
			dojox.sql.open();
			dojox.sql.db.execute("BEGIN TRANSACTION");
			var _stmt = "REPLACE INTO " + this.table_name + " VALUES (?, ?, ?)";
			for(var i=0;i<keys.length;i++) {
				// serialize the value;
				// handle strings differently so they have better performance
				var value = values[i];
				if(dojo.isString(value)){
					value = "string:" + value;
				}else{
					value = dojo.toJson(value);
				}
		
				dojox.sql.db.execute( _stmt,
					[namespace, keys[i], value]);
			}
			dojox.sql.db.execute("COMMIT TRANSACTION");
			dojox.sql.close();
		}catch(e){
			// indicate we failed
			console.debug("dojox.storage.GearsStorageProvider.putMultiple:", e);
			if(resultsHandler){
				resultsHandler(this.FAILED, keys, e.toString());
			}
			return;
		}
		
		if(resultsHandler){
			resultsHandler(dojox.storage.SUCCESS, key, null);
		}
	},

	getMultiple: function(keys, namespace){
		//	TODO: Maybe use SELECT IN instead

		if(this.isValidKeyArray(keys) === false){
			throw new ("Invalid key array given: " + keys);
		}
		
		if(namespace == null || typeof namespace == "undefined"){
			namespace = dojox.storage.DEFAULT_NAMESPACE;		
		}
		
		if(this.isValidKey(namespace) == false){
			throw new Error("Invalid namespace given: " + namespace);
		}

		var _stmt = "SELECT * FROM " + this.table_name	+ 
			" WHERE namespace = ? AND "	+ " key = ?";
		
		var results = [];
		for(var i=0;i<keys.length;i++){
			var result = dojox.sql( _stmt, namespace, keys[i]);
				
			if( ! result.length){
				results[i] = null;
			}else{
				result = result[0].value;
				
				// destringify the content back into a 
				// real JavaScript object;
				// handle strings differently so they have better performance
				if(dojo.isString(result) && (/^string:/.test(result))){
					results[i] = result.substring("string:".length);
				}else{
					results[i] = dojo.fromJson(result);
				}
			}
		}
		
		return results;
	},
	
	removeMultiple: function(keys, namespace){
		namespace = namespace||this.DEFAULT_NAMESPACE;
		
		dojox.sql.open();
		dojox.sql.db.execute("BEGIN TRANSACTION");
		var _stmt = "DELETE FROM " + this.table_name + " WHERE namespace = ? AND key = ?";

		for(var i=0;i<keys.length;i++){
			dojox.sql.db.execute( _stmt,
				[namespace, keys[i]]);
		}
		dojox.sql.db.execute("COMMIT TRANSACTION");
		dojox.sql.close();
	}, 				
	
	isPermanent: function(){ return true; },

	getMaximumSize: function(){ return this.SIZE_NO_LIMIT; },

	hasSettingsUI: function(){ return false; },
	
	showSettingsUI: function(){
		throw new Error(this.declaredClass 
							+ " does not support a storage settings user-interface");
	},
	
	hideSettingsUI: function(){
		throw new Error(this.declaredClass 
							+ " does not support a storage settings user-interface");
	}
};
