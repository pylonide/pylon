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
//        Storage provider that uses the features of Google Gears
//        to store data 

jpf.storage.modules.gears = 
jpf.storage.modules["gears.sql"] = {
    // instance methods and properties
    database_name: "__JPF_" + (jpf.appsettings.name 
        ? jpf.appsettings.name.toUpperCase() 
        : "STORAGE"),
    table_name: "STORAGE",
    initialized: false,
    
    _available: null,
    _db: null,
    
    init: function(){
        this.factory = jpf.nameserver.get("google", "gears");

        this._db = this.factory.create('beta.database', '1.0');
        this._db.open(this.database_name);

        // create the table that holds our data
        try{
            this._sql("CREATE TABLE IF NOT EXISTS " + this.table_name + "( "
                        + " namespace TEXT, "
                        + " key TEXT, "
                        + " value TEXT "
                        + ")"
                    );
            this._sql("CREATE UNIQUE INDEX IF NOT EXISTS namespace_key_index" 
                        + " ON " + this.table_name
                        + " (namespace, key)");
           
            this.initialized = true;
        }
        catch(e){
            jpf.console.warn(e.message);
			return false;
        }
    },
    
    _sql: function(query, params){
        var rs = this._db.execute(query, params);
        
        return this._normalizeResults(rs); //can I do this after I close db?
    },
    
    destroy : function(){
        //if (!jpf.isIE)
            this._db.close();
    },
    
    _normalizeResults: function(rs){
        var results = [];
        if(!rs){ return []; }
    
        while(rs.isValidRow()){
            var row = {};
        
            for(var i = 0; i < rs.fieldCount(); i++){
                var fieldName = rs.fieldName(i);
                var fieldValue = rs.field(i);
                row[fieldName] = fieldValue;
            }
        
            results.push(row);
        
            rs.next();
        }
    
        rs.close();
        
        return results;
    },
    
    isAvailable: function(){
        // is Google Gears available and defined?
        return jpf.isGears;
    },

    put: function(key, value, namespace){
        //#ifdef __DEBUG
        if(this.isValidKey(key) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Setting name/value pair", 
                "Invalid key given: " + key));
        //#endif
        
        if(!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Setting name/value pair", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        value = jpf.serialize(value);
        
        // try to store the value    
        try{
            this._sql("DELETE FROM " + this.table_name
                        + " WHERE namespace = ? AND key = ?",
                        [namespace, key]);
            this._sql("INSERT INTO " + this.table_name
                        + " VALUES (?, ?, ?)",
                        [namespace, key, value]);
        }catch(e){
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, null, 
                "Setting name/value pair", 
                "Error setting name/value pair: " + e.message));
            //#endif
			
			return false;
        }
        
        return true;
    },

    get: function(key, namespace){
        //#ifdef __DEBUG
        if(this.isValidKey(key) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Getting name/value pair", 
                "Invalid key given: " + key));
        //#endif
		
		if(!namespace)
		    namespace = this.namespace;
		
		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Getting name/value pair", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        // try to find this key in the database
        var results = this._sql("SELECT * FROM " + this.table_name
                                    + " WHERE namespace = ? AND "
                                    + " key = ?",
                                    [namespace, key]);

        if(!results.length)
            return null;

        return jpf.unserialize(results[0].value);
    },
    
    getNamespaces: function(){
        var results = [ this.namespace ];
        
        var rs = this._sql("SELECT namespace FROM " + this.table_name
                            + " DESC GROUP BY namespace");
        for(var i = 0; i < rs.length; i++){
            if(rs[i].namespace != this.namespace){
                results.push(rs[i].namespace);
            }
        }
        
        return results;
    },

    getKeys: function(namespace){
        if(!namespace)
		    namespace = this.namespace;

        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Retrieving keys", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        var rs = this._sql("SELECT key FROM " + this.table_name
                            + " WHERE namespace = ?",
                            [namespace]);
        
        var results = [];
        for(var i = 0; i < rs.length; i++)
            results.push(rs[i].key);
        
        return results;
    },

    clear: function(namespace){
        if(!namespace)
		    namespace = this.namespace;
	    
        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Clearing storage", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        this._sql("DELETE FROM " + this.table_name 
                    + " WHERE namespace = ?",
                    [namespace]);
    },
    
    remove: function(key, namespace){
        if(!namespace)
		    namespace = this.namespace;

        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Removing key", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        this._sql("DELETE FROM " + this.table_name 
                    + " WHERE namespace = ? AND"
                    + " key = ?",
                    [namespace, key]);
    },
    
    putMultiple: function(keys, values, namespace) {
        //#ifdef __DEBUG
		if(this.isValidKeyArray(keys) === false 
				|| ! values instanceof Array 
				|| keys.length != values.length){
			throw new Error(jpf.formatErrorString(0, null, 
			    "Setting multiple name/value pairs", 
			    "Invalid arguments: keys = [" + keys + "], \
			                        values = [" + values + "]"));
		}
		//#endif
		
		if(!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Setting multiple name/value pairs", 
                "Invalid namespace given: " + namespace));
        //#endif

        // try to store the value    
        try{
            this._sql.open();
            this._sql.db.execute("BEGIN TRANSACTION");
            var stmt = "REPLACE INTO " + this.table_name + " VALUES (?, ?, ?)";
            for(var i=0;i<keys.length;i++) {
                // serialize the value;
                // handle strings differently so they have better performance
                var value = jpf.serialize(values[i]);
        
                this._sql.db.execute(stmt, [namespace, keys[i], value]);
            }
            this._sql.db.execute("COMMIT TRANSACTION");
            this._sql.close();
        }catch(e){
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, null, 
                "Writing multiple name/value pair", 
                "Error writing file: " + e.message));
            //#endif
			return false;
        }
        
        return true;
    },

    getMultiple: function(keys, namespace){
        //#ifdef __DEBUG
        if(this.isValidKeyArray(keys) === false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Getting name/value pair", 
                "Invalid key array given: " + keys));
        //#endif
		
		if(!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Getting multiple name/value pairs", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        var stmt = "SELECT * FROM " + this.table_name    + 
            " WHERE namespace = ? AND "    + " key = ?";
        
        var results = [];
        for(var i=0;i<keys.length;i++){
            var result = this._sql(stmt, [namespace, keys[i]]);
            results[i] = result.length
                ? jpf.unserialize(result[0].value)
                : null;
        }
        
        return results;
    },
    
    removeMultiple: function(keys, namespace){
        //#ifdef __DEBUG
        if(this.isValidKeyArray(keys) === false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Removing name/value pair", 
                "Invalid key array given: " + keys));
        //#endif
		
		if(!namespace)
		    namespace = this.namespace;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, 
                "Removing multiple name/value pairs", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        this._sql.open();
        this._sql.db.execute("BEGIN TRANSACTION");
        var stmt = "DELETE FROM " + this.table_name + " WHERE namespace = ? AND key = ?";

        for(var i=0;i<keys.length;i++)
            this._sql.db.execute(stmt, [namespace, keys[i]]);

        this._sql.db.execute("COMMIT TRANSACTION");
        this._sql.close();
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
