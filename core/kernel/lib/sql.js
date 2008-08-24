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

// #ifdef __WITH_SQL

jpf.sql = {
    provider : function(){
        
    },
    
    use : function(dbName){
        
    },
    
    query : function(q, p){
        
    }
}

//#endif
/*
	dbName: null,
	
	// summary:
	//	If true, then we print out any SQL that is executed
	//	to the debug window
	debug: (dojo.exists("dojox.sql.debug")?dojox.sql.debug:false),

	open: function(dbName){
		if(this._dbOpen && (!dbName || dbName == this.dbName)){
			return;
		}
		
		if(!this.dbName){
			this.dbName = "dot_store_" 
				+ window.location.href.replace(/[^0-9A-Za-z_]/g, "_");
			// database names in Gears are limited to 64 characters long
			if(this.dbName.length > 63){
			  this.dbName = this.dbName.substring(0, 63);
			}
		}
		
		if(!dbName){
			dbName = this.dbName;
		}
		
		try{
			this._initDb();
			this.db.open(dbName);
			this._dbOpen = true;
		}catch(exp){
			throw exp.message||exp;
		}
	},

	close: function(dbName){
		// on Internet Explorer, Google Gears throws an exception
		// "Object not a collection", when we try to close the
		// database -- just don't close it on this platform
		// since we are running into a Gears bug; the Gears team
		// said it's ok to not close a database connection
		if(dojo.isIE){ return; }
		
		if(!this._dbOpen && (!dbName || dbName == this.dbName)){
			return;
		}
		
		if(!dbName){
			dbName = this.dbName;
		}
		
		try{
			this.db.close(dbName);
			this._dbOpen = false;
		}catch(exp){
			throw exp.message||exp;
		}
	},
	
	_exec: function(params){
		try{	
			// get the Gears Database object
			this._initDb();
		
			// see if we need to open the db; if programmer
			// manually called dojox.sql.open() let them handle
			// it; otherwise we open and close automatically on
			// each SQL execution
			if(!this._dbOpen){
				this.open();
				this._autoClose = true;
			}
		
			// determine our parameters
			var sql = null;
			var callback = null;
			var password = null;

			var args = dojo._toArray(params);

			sql = args.splice(0, 1)[0];

			// does this SQL statement use the ENCRYPT or DECRYPT
			// keywords? if so, extract our callback and crypto
			// password
			if(this._needsEncrypt(sql) || this._needsDecrypt(sql)){
				callback = args.splice(args.length - 1, 1)[0];
				password = args.splice(args.length - 1, 1)[0];
			}

			// 'args' now just has the SQL parameters

			// print out debug SQL output if the developer wants that
			if(this.debug){
				this._printDebugSQL(sql, args);
			}

			// handle SQL that needs encryption/decryption differently
			// do we have an ENCRYPT SQL statement? if so, handle that first
			if(this._needsEncrypt(sql)){
				var crypto = new dojox.sql._SQLCrypto("encrypt", sql, 
													password, args, 
													callback);
				return; // encrypted results will arrive asynchronously
			}else if(this._needsDecrypt(sql)){ // otherwise we have a DECRYPT statement
				var crypto = new dojox.sql._SQLCrypto("decrypt", sql, 
													password, args, 
													callback);
				return; // decrypted results will arrive asynchronously
			}

			// execute the SQL and get the results
			var rs = this.db.execute(sql, args);
			
			// Gears ResultSet object's are ugly -- normalize
			// these into something JavaScript programmers know
			// how to work with, basically an array of 
			// JavaScript objects where each property name is
			// simply the field name for a column of data
			rs = this._normalizeResults(rs);
		
			if(this._autoClose){
				this.close();
			}
		
			return rs;
		}catch(exp){
			exp = exp.message||exp;
			
			console.debug("SQL Exception: " + exp);
			
			if(this._autoClose){
				try{ 
					this.close(); 
				}catch(e){
					console.debug("Error closing database: " 
									+ e.message||e);
				}
			}
		
			throw exp;
		}
	},

	_initDb: function(){
		if(!this.db){
			try{
				this.db = google.gears.factory.create('beta.database', '1.0');
			}catch(exp){
				dojo.setObject("google.gears.denied", true);
				dojox.off.onFrameworkEvent("coreOperationFailed");
				throw "Google Gears must be allowed to run";
			}
		}
	},

	_printDebugSQL: function(sql, args){
		var msg = "dojox.sql(\"" + sql + "\"";
		for(var i = 0; i < args.length; i++){
			if(typeof args[i] == "string"){
				msg += ", \"" + args[i] + "\"";
			}else{
				msg += ", " + args[i];
			}
		}
		msg += ")";
	
		console.debug(msg);
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

	_needsEncrypt: function(sql){
		return /encrypt\([^\)]*\)/i.test(sql);
	},

	_needsDecrypt: function(sql){
		return /decrypt\([^\)]*\)/i.test(sql);
	}
});*/