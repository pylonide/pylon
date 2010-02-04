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

// #ifdef __WITH_STORAGE_AIR_SQL

// summary: 
//		Storage provider that uses features in the Adobe AIR runtime to achieve
//		permanent storage

apf.storage.modules['air.sql'] = {
    database_file: "apf.db",

    initialized: false,
    _db: null,
	
    init: function(){
        this.File          = window.runtime.flash.filesystem.File;
        this.SQLConnection = window.runtime.flash.data.SQLConnection;
        this.SQLStatement  = window.runtime.flash.data.SQLStatement;
        
        this.table_name = "__APF_" + (apf.config.name
            ? apf.config.name.toUpperCase()
            : "STORAGE");

        // need to initialize our storage database
        try {
            this._db = new this.SQLConnection();
            this._db.open(this.File.applicationStorageDirectory.resolvePath(this.database_file));
			
            this._sql("CREATE TABLE IF NOT EXISTS " + this.table_name
                + "(namespace TEXT, key TEXT, value TEXT)");
            this._sql("CREATE UNIQUE INDEX IF NOT EXISTS namespace_key_index ON "
                + this.table_name + " (namespace, key)");
			
            this.initialized = true;
        }
        catch(e) {
            apf.console.warn(e.message);
            return false;
        }
    },
	
    _sql: function(query, params){
        var stmt = new this.SQLStatement();
        stmt.sqlConnection = this._db;
        stmt.text          = query;
        if (params)
            apf.extend(stmt.parameters, params);

        stmt.execute();
        return stmt.getResult();
    },
	
    isAvailable: function(){
        return apf.isAIR;
    },
	
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
		
        // try to store the value
        try {
            this._sql("DELETE FROM " + this.table_name
                + " WHERE namespace = :namespace AND key = :key",
            {
                ":namespace": namespace,
                ":key"      : key
            });
            this._sql("INSERT INTO " + this.table_name
                + " VALUES (:namespace, :key, :value)",
            {
                ":namespace": namespace,
                ":key"      : key,
                ":value"    : value
            });
        }
        catch(e) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, null,
                "Setting name/value pair",
                "Error writing file: " + e.message));
            //#endif
			
            return false;
        }
		
        return true;
    },
	
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
		
        var results = this._sql("SELECT * FROM " + this.table_name
            + " WHERE namespace = :namespace AND key = :key",
        {
            ":namespace": namespace,
            ":key"      : key
        });
		
        if (results.data && results.data.length)
            return results.data[0].value;
		
        return null;
    },
	
    getNamespaces: function(){
        var results = [ this.namespace ];
        var rs = this._sql("SELECT namespace FROM " + this.table_name + " DESC GROUP BY namespace");
        if (rs.data) {
            for (var i = 0; i < rs.data.length; i++) {
                if (rs.data[i].namespace != this.namespace)
                    results.push(rs.data[i].namespace);
            }
        }
        return results;
    },

    getKeys: function(namespace){
        if(!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null,
                "Clearing storage",
                "Invalid namespace given: " + namespace));
        //#endif
		
        var results = [];
        var rs = this._sql("SELECT key FROM " + this.table_name
            + " WHERE namespace = :namespace", {
            ":namespace": namespace
        });
        if (rs.data) {
            for (var i = 0; i < rs.data.length; i++)
                results.push(rs.data[i].key);
        }
        return results;
    },
	
    clear: function(namespace){
        if (!namespace)
            namespace = this.namespace;
	    
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null,
                "Clearing storage",
                "Invalid namespace given: " + namespace));
        //#endif
        
        this._sql("DELETE FROM " + this.table_name
            + " WHERE namespace = :namespace", {
            ":namespace":namespace
        });
    },
	
    remove: function(key, namespace){
        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null,
                "Removing key",
                "Invalid namespace given: " + namespace));
        //#endif
        
        this._sql("DELETE FROM " + this.table_name
            + " WHERE namespace = :namespace AND key = :key",
        {
            ":namespace": namespace,
            ":key"      : key
        });
    },
	
    putMultiple: function(keys, values, namespace) {
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false
            || ! values instanceof Array
            || keys.length != values.length){
            throw new Error(apf.formatErrorString(0, null,
                "Setting multiple name/value pairs",
                "Invalid arguments: keys = [" + keys + "], values = [" + values + "]"));
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

        // try to store the value
        try {
            this._db.begin();
            for (var i = 0; i < keys.length; i++) {
                this._sql("DELETE FROM " + this.table_name
                    + " WHERE namespace = :namespace AND key = :key",
                {
                    ":namespace": namespace,
                    ":key"      : key[i]
                });
                this._sql("INSERT INTO " + this.table_name
                    + " VALUES (:namespace, :key, :value)",
                {
                    ":namespace": namespace,
                    ":key"      : key[i],
                    ":value"    : value
                });
            }
            this._db.commit();
        }
        catch(e) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, null,
                "Writing multiple name/value pair",
                "Error writing file: " + e.message));
            //#endif
            return false;
        }
		
        return true;
    },

    getMultiple: function(keys, namespace){
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

        var results = [];
        for (var i = 0; i < keys.length; i++) {
            var result = this._sql("SELECT * FROM " + this.table_name
                + " WHERE namespace = :namespace AND key = :key",
            {
                ":namespace": namespace,
                ":key"      : keys[i]
            });
            results[i] = result.data && result.data.length 
                ? result.data[0].value
                : null;
        }
		
        return results;
    },
	
    removeMultiple: function(keys, namespace){
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
		
        this._db.begin();
        for (var i = 0; i < keys.length;i++) {
            this._sql("DELETE FROM " + this.table_name
                + " WHERE namespace = namespace = :namespace AND key = :key",
            {
                ":namespace": namespace,
                ":key"      : keys[i]
            });
        }
        this._db.commit();
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
        throw new Error(this.declaredClass + " does not support a storage settings user-interface");
    },
	
    hideSettingsUI: function(){
        throw new Error(this.declaredClass + " does not support a storage settings user-interface");
    }
};

//#endif