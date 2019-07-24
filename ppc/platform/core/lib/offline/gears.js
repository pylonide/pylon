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

/**
 * Offline provider that uses Google gears.
 * @default_private
 */
apf.offline.application.gears = {
    localServer : null,
    lastStore   : null,
    cancelID    : null,
    refreshing  : false,
    fileIndex   : 0,
    
    init : function(){
        //#ifdef __WITH_NAMESERVER
        // clip at 64 characters, the max length of a resource store name
        this.name = this.storeName.truncate(64);
        this.storeName = apf.config.name + ".apf.offline";
        
        try{
            this.localServer = apf.nameserver.get("google", "gears").create("beta.localserver", "1.0");
        }
        catch(e){
            apf.console.warn("Error loading gears: " + e.message);
            return false;
        }
        
        return this;
    },
    
    install : function(){
        //@todo make a script to install gears here
        
        apf.isGears = true;
    },
    
    isAvailable : function(){
        return apf.isGears && location.protocol != "file:";
    },
    
    clear : function(){
        this.localServer.removeStore(this.name);
    },
    
    store : function(listOfURLs, callback, newVersion){
        // refresh everything by simply removing
        // any older stores
        this.localServer.removeStore(this.name);
        
        // open/create the resource store
        this.localServer.openStore(this.name);
        
        try {
            var store = this.lastStore = this.localServer.createStore(this.name);
        }
        catch(e) {
            //#ifdef __DEBUG;
            apf.console.warn("Gears failed to start local storage: " + e.message);
            //#endif
            
            return false;
        }

        // add our list of files to capture
        var _self       = this;
        this.refreshing = true;
        this.fileIndex  = 0;
        this.cancelID   = store.capture(listOfURLs, 
            function(url, success, captureId){
                if (!success && _self.refreshing) {
                    _self.cancelID   = null;
                    _self.refreshing = false;
                    
                    if (callback) {
                        callback({
                            error   : true,
                            message : "Unable to capture " + url
                        });
                    }
                    
                    return;
                }
                else if (success) {
                    _self.fileIndex++;
                    
                    if (callback) {
                        callback({
                            position : _self.fileIndex,
                            length   : listOfURLS.length // @fixme: where is listOfURLS ???
                        });
                    }
                }
                
                if (success && _self.fileIndex >= listOfURLs.length) {
                    _self.cancelID   = null;
                    _self.refreshing = false;
                    
                    if(newVersion)
                        apf.storage.put("oldVersion", newVersion, null,
                            apf.offline.application.storeName);
                    
                    if (callback) {
                        callback({
                            finished : true
                        });
                    }
                }
            });
    },
    
    abort: function(){
        // summary:
        //    For advanced usage; most developers can ignore this.
        //    Aborts and cancels a refresh.
        if (!this.refreshing)
            return;
        
        this.lastStore.abortCapture(this.cancelID);
        this.refreshing = false;
    }
    // #endif
};

// #endif
