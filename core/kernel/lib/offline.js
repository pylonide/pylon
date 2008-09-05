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

// #ifdef __WITH_OFFLINE
jpf.offline = {
    enabled     : false,
    isOnline    : true,
    resources   : ["application", "models", "transactions", "queue", "state"],
    autoInstall : false,
    storage     : null,
    inited      : false,
    rsbTimeout  : 600000,//After 10 minutes, we assume the RSB messaged will be destroyed
    
    init : function(jml){
        jpf.makeClass(this);
        
        //Read configuration
        if (jml) {
            if (typeof jml == "string") {
                this.providers = jml.split("|");
            }
            else if (jml.nodeType) {
                this.jml = jml;
                
                if (jml.getAttribute("resources"))
                    this.providers = jml.getAttribute("resources").split("|");
                
                if (jml.getAttribute("rsb-timeout"))
                    this.rsbTimeout = parseInt(jml.getAttribute("rsb-timeout"));
                
                //Events
                var attr = jml.attributes;
                for (var i = 0; i < attr.length; i++) {
                    if (attr[i].nodeName.substr(0,2) == "on")
                        this.addEventListener(attr[i].nodeName,
                            new Function(attr[i].nodeValue));
                }
            }
            else {
                jpf.extend(this, jml);
            }
        }
        
        // #ifdef __WITH_OFFLINE_APPLICATION
        jpf.offline.application.init(jml)
        // #endif
        
        //Check for storage provider
        if (this.provider)
            this.storage = jpf.storage.get(this.provider.name);

        if (!this.storage) {
            this.storage = jpf.storage.initialized 
                ? jpf.storage 
                : jpf.storage.init(); //autodetect
        }
        
        if (!this.storage) {
            //#ifdef __DEBUG
            throw new Error(0, "Offline failed to attain access \
                               to a storage provider");
            //#endif
            
            return;
        }
        
        if (!this.storage.isPermanent()) {
            jpf.addEventListener("onexit", function(){
                return jpf.offline.dispatchEvent("onlosechanges");
            });
        }
        
        // Check if all specified resources are available
        for (i = this.resources.length - 1; i >= 0; i--) {
            if (!this[this.resources[i]])
                this.resources.removeIndex(i);
            else
                this[this.resources[i]].init(jml);
        }
        
        //#ifdef __WITH_OFFLINE_DETECTOR
        this.detector.init(jml);
        //#endif
        
        this.offlineTime = 
            parseInt(this.storage.get("offlinetime", this.namespace))
            || new Date().getTime();
        
        this.enabled = true;
    },
    
    destroy : function(){
        //@todo
    },
    
    /** 
     * Indicates what's happening right now
     * 0 = idle
     * 1 = going offline
     * 2 = going online
     * 3 = stopping
     */
    inProcess : 0,
    
    __supportedProperties : ["syncing", "position", "length"],
    handlePropSet : function(prop, value, force){
        this[prop] = value;
        //All read-only properties
    },
    
    goOffline : function(){
        if (!this.inited || !this.isOnline || this.inProcess)
            return false;
        
        if(this.dispatchEvent("onbeforeoffline") === false)
            return false;
        
        //We're offline, let's dim the light
        this.isOnline    = false;
        this.inProcess   = 1;
        
        if (!this.offlineTime) {
            this.offlineTime = new Date().getTime();
            this.storage.put("offlinetime", this.offlineTime, this.namespace);
        }
        
        //#ifdef __WITH_AUTH
        if (jpf.auth.retry) //Don't want to ruin the chances of having a smooth ride on a bad connection
            jpf.auth.loggedIn = false; //we're logged out now, we'll auto-login when going online
        //#endif
        
        //#ifdef __WITH_OFFLINE_DETECTOR
        //Turn off detection if needed
        if (this.detector.enabled && this.detector.detection != "manual")
            this.detector.start();
        //#endif
        
        //#ifdef __WITH_RSB
        this.initial = {
            disableRSB : jpf.xmldb.disableRSB
        }
        jpf.xmldb.disableRSB = true;
        //#endif
        
        this.dispatchEvent("onafteroffline");
        
        return true;//success
    },
    
    goOnline : function(){
        if (!this.inited || this.isOnline || this.inProcess)
            return false;
        
        if (this.dispatchEvent("onbeforeonline") === false)
            return false;
        
        //We're online, let's show the beacon
        this.isOnline   = true; //@todo Think about doing this in the callback, because of processes that will now intersect
        this.inProcess  = 2;
        this.onlineTime = new Date().getTime();
        this.reloading  = false;
        
        //#ifdef __WITH_OFFLINE_DETECTOR
        //Turn off detection if needed
        if (this.detector.enabled && this.detector.detection != "auto")
            this.detector.stop();
        //#endif
        
        //#ifdef __WITH_RSB
        //Check if we have to reload all models
        this.__checkRsbTimeout();
        
        //Reset RSB in original state
        jpf.xmldb.disableRSB = initial.disableRSB;
        //#endif
        
        var callback = function(){
            /*
                @todo syncing should probably be patched to take a random 
                time before starting to prevent blasting a server during a 
                glitch, of course decent loadbalancing would solve this as well.
            */
            this.startSync();
            
            this.dispatchEvent("onafteronline");
        }
        
        //#ifdef __WITH_AUTH
        //First let's log in to the services that need it before syncing changes
        if (jpf.auth.needsLogin && !jpf.auth.loggedIn) {
            jpf.auth.authRequired({object: this, retry: callback});
        }
        else
        //#endif
        {callback.call(this);}
        
        return true;//success
    },

    //#ifdef __WITH_RSB
    /**
     *  If we've been offline for a long time, 
     *  let's clear the models, we can't trust the data anymore
     */    
    __checkRsbTimeout : function(){
        if (!this.rsbTimeout)
            return;

        var i, j, rsbs = jpf.nameserver.getAll("remote");
        for (i = 0; i < rsbs.length; i++) {
            var rsb = rsbs[i];
            if (this.reloading || this.onlineTime - this.offlineTime > this.rsbTimeout) {
                if (!this.reloading) {
                    if (this.dispatchEvent("onbeforereload") === false) {
                        //#ifdef __DEBUG
                        jpf.issueWarning(0, "Warning, potential data corruption\
                            because you've cancelled reloading the data of all \
                            remote smartbinding synchronized models.");
                        //#endif
                        
                        break;
                    }
                    
                    this.reloading = true;
                }
                
                rsb.discardBefore = this.onlineTime;
                
                //#ifdef __WITH_TRANSACTIONS
                jpf.offline.transactions.clear("undo|redo");
                //#endif
                
                for (j = 0; k < rsb.models.length; j++) {
                    rsb.models[j].clear();
                    
                    // #ifdef __WITH_OFFLINE_MODEL
                    jpf.offline.models.addToInitQueue(rsb.models[j])
                    /* #else
                    rbs[i].models[j].init();
                    #endif */
                }
            }
        }
    },
    //#endif
    
    __goOnlineDone : function(success){
        //this.reloading = true;
        this.inProcess  = 0; //We're done
        this.setProperty("syncing", false);
        
        if (success) {
            this.offlineTime = null;
            this.storage.remove("offlinetime", this.namespace);
        }
        else {
            //Going online has failed. Going offline again
            this.goOffline();
        }
    },
    
    /**
     * Does cleanup after we've come online
     */
    startSync : function(){
        if (this.syncing)
            return;
        
        this.setProperty("syncing", true);
        
        var syncResources = [],
            syncLength    = 0,
            syncPos       = 0,
            syncRes       = null,
            len, i;
        
        //Start finding all resources to sync
        for (i = this.resources.length - 1; i >= 0; i--) {
            if (this[this.resources[i]].sync) {
                len = this[this.resources[i]].getSyncLength();
                
                if (len) {
                    syncResources.push(this[this.resources[i]]);
                    syncLength += len;
                }
            }
        }
        
        var fln      = jpf.offline;
        var callback = function(extra){
            if (fln.inProcess == 3) {
                if (!extra.finished && extra.length - 1 != extra.position) {
                    syncRes.stopSync(function(){ //@todo if(syncRes) ??
                        fln.__goOnlineDone(false);
                    });
                } 
                else {
                    fln.__goOnlineDone(false);
                }
                
                return;
            }
            
            if (extra.finished) {
                if (syncResources.length) {
                    syncRes = syncResources.pop();
                    syncRes.sync(callback);
                }
                else {
                    fln.__goOnlineDone(true);
                }
                
                return;
            }
            
            if (!extra.start)
                syncPos++;
            
            fln.setProperty("position", syncPos);
            fln.setProperty("length", syncLength);
            
            fln.dispatchEvent("onsync", jpf.extend(extra, {
                position : syncPos,
                length   : syncLength
            }));
        }
        
        callback({start    : true});
        callback({finished : true});
        
        //#ifdef __WITH_OFFLINE_TRANSACTIONS
        /*
            When going online check loadedWhenOffline of 
            the multiselect widgets and reload() them
        */
        var nodes = document.all; //@todo maintaining a list is more efficient, is it necesary??
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].loadedWhenOffline)
                nodes[i].reload();
        }
        //#endif
    },
    
    stopSync : function(){
        if (this.syncing)
            this.inProcess = 3;
    }
}
//#endif