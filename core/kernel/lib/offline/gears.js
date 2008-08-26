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

// #ifdef __WITH_OFFLINE_GEARS

jpf.offline.modules.gears = {
    localServer : null,
    lastStore   : null,
    cancelID    : null,
    refreshing  : false,
    fileIndex   : 0,
    
    init : function(name){
        // clip at 64 characters, the max length of a resource store name
        this.name = name.length >= 64
            ? name.substring(0, 63)
            : name;
        
        try{
            this.localServer = google.gears.factory.create("beta.this.localServer", "1.0");
        }catch(exp){
            jpf.issueWarning(0, "Error loading gears: " + e.message);
            return false;
        }
    },
    
    install : function(){
        //@todo make a script to install gears here
        
        jpf.isGears = true;
    },
    
    isAvailable : function(){
        return jpf.isGears;
    },
    
    store : function(listOfURLs, callback, newVersion){
        // refresh everything by simply removing
        // any older stores
        this.localServer.removeStore(this.name);
        
        // open/create the resource store
        this.localServer.openStore(this.name);
        var store = this.lastStore = this.localServer.createStore(this.name);

        // add our list of files to capture
        this.refreshing = true;
        this.fileIndex  = 0;
        this.cancelID   = store.capture(listOfURLs, function(url, success, captureId){
            if(!success && _self.refreshing){
                _self.cancelID = null;
                _self.refreshing = false;
                
                callback(true, ["Unable to capture: " + url]);
                return;
            }
            else if(success){
                _self.fileIndex++;
            }
            
            if(success && _self.fileIndex >= listOfURLs.length){
                _self.cancelID = null;
                _self.refreshing = false;
                
                if(newVersion)
					jpf.storage.put("oldVersion", newVersion, null,
									jpf.offline.application.STORAGE_NAMESPACE);
                
                callback(false, []);
            }
        });
    },
    
    abort: function(){
		// summary:
		//	For advanced usage; most developers can ignore this.
		//	Aborts and cancels a refresh.
		if (!this.refreshing)
			return;
		
		this.lastStore.abortCapture(this.cancelID);
		this.refreshing = false;
	},
}

// #endif
