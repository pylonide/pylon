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

/**
 *  Storage provider that uses Google Gears to store data.
 */
apf.storage.modules.gears = 
apf.storage.modules["gears.sql"] = {
    //#ifdef __WITH_NAMESERVER
    // instance methods and properties
    table_name  : "STORAGE",
    initialized : false,
    
    $available  : null,
    $db         : null,
    
    init: function(){
        this.factory = apf.nameserver.get("google", "gears");
        this.database_name = apf.config.name.substr(0, 46) + ".apf.offline.gears";

        this.$db = this.factory.create('beta.database', '1.0');
        this.$db.open(this.database_name);

        // create the table that holds our data
        try {
            this.$sql("CREATE TABLE IF NOT EXISTS " + this.table_name + "( "
                        + " namespace TEXT, "
                        + " key TEXT, "
                        + " value TEXT "
                        + ")"
                    );
            this.$sql("CREATE UNIQUE INDEX IF NOT EXISTS namespace_key_index" 
                        + " ON " + this.table_name
                        + " (namespace, key)");
           
            this.initialized = true;
        }
        catch(e) {
            apf.console.warn(e.message);
            return false;
        }
    },
    
    $sql: function(query, params){
        var rs = this.$db.execute(query, params);
        
        return this.$normalizeResults(rs); //can I do this after I close db?
    },
    
    destroy : function(){
        //if (!apf.isIE)
        this.$db.close();
    },
    
    $normalizeResults: function(rs){
        var results = [];
        if (!rs) return [];
    
        while (rs.isValidRow()) {
            var row = {};
        
            for (var i = 0; i < rs.fieldCount(); i++) {
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
        return apf.isGears;
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
        
        value = apf.serialize(value);
        
        // try to store the value    
        try {
            this.$sql("DELETE FROM " + this.table_name
                        + " WHERE namespace = ? AND key = ?",
                        [namespace, key]);
            this.$sql("INSERT INTO " + this.table_name
                        + " VALUES (?, ?, ?)",
                        [namespace, key, value]);
        }
        catch(e) {
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, null, 
                "Setting name/value pair", 
                "Error setting name/value pair: " + e.message));
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
        
        // try to find this key in the database
        var results = this.$sql("SELECT * FROM " + this.table_name
                                    + " WHERE namespace = ? AND "
                                    + " key = ?",
                                    [namespace, key]);

        if (!results.length)
            return null;

        return apf.unserialize(results[0].value);
    },
    
    getNamespaces: function(){
        var results = [ this.namespace ];
        
        var rs = this.$sql("SELECT namespace FROM " + this.table_name
                            + " DESC GROUP BY namespace");
        for (var i = 0; i < rs.length; i++) {
            if (rs[i].namespace != this.namespace)
                results.push(rs[i].namespace);
        }
        
        return results;
    },

    getKeys: function(namespace){
        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(apf.formatErrorString(0, null, 
                "Retrieving keys", 
                "Invalid namespace given: " + namespace));
        //#endif
        
        var rs = this.$sql("SELECT key FROM " + this.table_name
                            + " WHERE namespace = ?",
                            [namespace]);
        
        var results = [];
        for (var i = 0; i < rs.length; i++)
            results.push(rs[i].key);
        
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
        
        this.$sql("DELETE FROM " + this.table_name 
                    + " WHERE namespace = ?",
                    [namespace]);
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
        
        this.$sql("DELETE FROM " + this.table_name 
                    + " WHERE namespace = ? AND"
                    + " key = ?",
                    [namespace, key]);
    },
    
    putMultiple: function(keys, values, namespace) {
        //#ifdef __DEBUG
        if(this.isValidKeyArray(keys) === false
                        || ! values instanceof Array
                        || keys.length != values.length){
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

        // try to store the value    
        try {
            this.$sql.open();
            this.$sql.db.execute("BEGIN TRANSACTION");
            var stmt = "REPLACE INTO " + this.table_name + " VALUES (?, ?, ?)";
            for(var i=0;i<keys.length;i++) {
                // serialize the value;
                // handle strings differently so they have better performance
                var value = apf.serialize(values[i]);

                this.$sql.db.execute(stmt, [namespace, keys[i], value]);
            }
            this.$sql.db.execute("COMMIT TRANSACTION");
            this.$sql.close();
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
        
        var stmt = "SELECT * FROM " + this.table_name    + 
            " WHERE namespace = ? AND "    + " key = ?";
        
        var results = [];
        for (var i = 0; i < keys.length; i++) {
            var result = this.$sql(stmt, [namespace, keys[i]]);
            results[i] = result.length
                ? apf.unserialize(result[0].value)
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
        
        this.$sql.open();
        this.$sql.db.execute("BEGIN TRANSACTION");
        var stmt = "DELETE FROM " + this.table_name + " WHERE namespace = ? AND key = ?";

        for (var i = 0; i < keys.length; i++)
            this.$sql.db.execute(stmt, [namespace, keys[i]]);

        this.$sql.db.execute("COMMIT TRANSACTION");
        this.$sql.close();
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
    //#endif
};
// #endif
