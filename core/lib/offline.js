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

/**
 * Adds offline support for jml applications. It can store and restore the state
 * of the application, the models, any transaction that occurred whilst being
 * offline, queuing actions (ActionTracker state) and state of the runtime
 * application itself (all properties of each element). This allows the 
 * application to return to the exact state the user left it, when needed. This
 * means that when enabled you can at any moment turn of your computer (i.e. 
 * remove the battery) and when your computer starts up whilst sitting in the 
 * train start the application and continue working as if the application
 * was never closed.
 * Example:
 * <code>
 *  <j:appsettings>
 *      <j:offline providers="gears" 
 *        resources     = "application|models|transactions|queue|state"
 *        rsb-timeout   = "10000"
 *        detect-url    = "network.txt"
 *        detection     = "auto"
 *        realtime      = "true"
 *        onrestore     = "return confirm('Would you like to continue your previous session?');" 
 *        onlosechanges = "" />
 *  </j:appsettings>
 * </code>
 * @default_private
 */
jpf.namespace("offline", {
    /**
     * {Boolean} wether offline support is enabled.
     */
    enabled     : false,
    
    /**
     * {Boolean} wether the application is online.
     */
    onLine      : -1,
    resources   : ["application", "models", "transactions", "queue", "state"],
    autoInstall : false,
    storage     : null,
    inited      : false,
    rsbTimeout  : 600000,//After 10 minutes, we assume the RSB messaged will be destroyed
    
    init : function(jml){
        jpf.makeClass(this);
        
        //Read configuration
        if (jml) {
            this.$jml = jml;
            
            if (typeof jml == "string") {
                
            }
            else if (jml.nodeType) {
                /**
                 * @attribute {String} resources the resources that should be 
                 * kept offline and synced later. This is a pipe '|' seperated
                 * list.
                 *   Possible values:
                 *   application    deals with making the actual application offline avaible.
                 *   models         takes care of having the data of the models offline available.
                 *   transactions   records the state of the actiontrackers so that these are available offline.
                 *   queue          handles queuing of actions that can only be executed whilst online.
                 *   state          records the state of all elements in this application on a property level.
                 */
                if (jml.getAttribute("resources"))
                    this.providers = jml.getAttribute("resources").split("|");
                
                /** 
                 * @attribute {Number} rsb-timeout the number of milliseconds 
                 * after the remote smartbindings server considers a client 
                 * offline and destroys all saved offline messages.
                 */
                if (jml.getAttribute("rsb-timeout"))
                    this.rsbTimeout = parseInt(jml.getAttribute("rsb-timeout"));
                
                //Events
                var a, i, attr = jml.attributes;
                for (i = 0; i < attr.length; i++) {
                    a = attr[i];
                    if (a.nodeName.indexOf("on") == 0)
                        this.addEventListener(a.nodeName, new Function(a.nodeValue));
                }
            }
            else {
                jpf.extend(this, jml);
            }
        }
        
        // #ifdef __WITH_OFFLINE_APPLICATION
        var provider = jpf.offline.application.init(jml)
        // #endif

        //Check for storage provider
        if (provider) {
            this.storage = jpf.storage.getProvider(provider);
            
            //#ifdef __DEBUG
            if (this.storage)
                jpf.console.info("Installed storage provider '" + provider + "'");
            //#endif
        }

        if (!this.storage) {
            this.storage = jpf.storage.initialized 
                ? jpf.storage 
                : jpf.storage.init(); //autodetect
        }
        
        if (!this.storage) {
            //#ifdef __DEBUG
            throw new Error("Offline failed to attain access \
                               to a storage provider");
            //#endif
            
            return;
        }
        
        if (!this.storage.isPermanent()) {
            jpf.addEventListener("exit", function(){
                return jpf.offline.dispatchEvent("losechanges");
            });
        }
        
        if (this.storage.asyncInit) {
            jpf.JmlParser.shouldWait = true;
            this.storage.ready(function(){
                jpf.offline.storage.onready = null; //Prevent being called twice
                jpf.offline.continueInit();
                jpf.JmlParser.continueStartup();
            });
            
            return;
        }
        
        this.continueInit();
    },
    
    continueInit : function(){
        // Check if all specified resources are available
        for (i = this.resources.length - 1; i >= 0; i--) {
            if (!this[this.resources[i]])
                this.resources.removeIndex(i);
            else
                this[this.resources[i]].init(this.$jml);
        }
        
        this.enabled = true;
        
        //#ifdef __WITH_OFFLINE_DETECTOR
        this.detector.init(this.$jml);
        //#endif
        
        this.offlineTime = parseInt(this.storage.get("offlinetime", this.namespace));
        
        //If we were offline lets stay offline
        if (this.offlineTime)
            this.goOffline();
        else //Else we try to go online
            this.goOnline();
        
        jpf.offline.dispatchEvent("load");
    },
    
    $destroy : function(){
        //#ifdef __DEBUG
        jpf.console.info("Cleaning offline");
        //#endif
        
        if (this.provider && this.provider.destroy)
            this.provider.destroy();
        
        if (this.storage && this.storage.destroy)
            this.storage.destroy();
        
        for (i = this.resources.length - 1; i >= 0; i--) {
            if (this[this.resources[i]].destroy)
                this[this.resources[i]].destroy();
        }
    },
    
    IDLE       : 0, //idle
    TO_OFFLINE : 1, //going offline
    TO_ONLINE  : 2, //going online
    STOPPING   : 3, //stopping going online
    
    /** 
     * Indicates what's happening right now
     */
    inProcess : 0,
    
    /**
     * Example:
     * <j:modalwindow title="Synchronizing" visible="{offline.syncing}">
     *    <j:Label>Synchronizing your changes</j:label>
     *    <j:progressbar value="{offline.progress}" />
     *    <j:button onclick="jpf.offline.stopSync()">Cancel</j:button>
     *    <j:button onclick="this.parentNode.hide()">Hide Window</j:button>
     * </j:modalwindow>
     */
    $supportedProperties : ["syncing", "position", "length", "progress", "onLine"],
    handlePropSet : function(prop, value, force){
        this[prop] = value;
        //All read-only properties
    },
    
    /**
     * Brings the application offline.
     */
    goOffline : function(){
        if (!this.enabled || this.onLine === false 
          || this.inProcess == this.TO_OFFLINE)
            return false;
        
        //We can't go offline yet, we'll terminate current process and wait
        if (this.inProcess) {
            this.inProcess = this.STOPPING;
            return false;
        }
        
        if (this.dispatchEvent("beforeoffline") === false)
            return false;
        
        //We're offline, let's dim the light
        this.setProperty("onLine", false);
        this.inProcess = this.TO_OFFLINE;
        
        if (!this.offlineTime) {
            this.offlineTime = new Date().getTime();
            this.storage.put("offlinetime", this.offlineTime, this.namespace);
        }
        
        //#ifdef __WITH_AUTH
        //if (jpf.auth.retry) //Don't want to ruin the chances of having a smooth ride on a bad connection
        //    jpf.auth.loggedIn = false; //we're logged out now, we'll auto-login when going online
        //#endif
        
        //#ifdef __WITH_OFFLINE_DETECTOR
        //Turn off detection if needed
        if (this.detector.enabled && this.detector.detection != "manual")
            this.detector.start();
        //#endif
        
        //#ifdef __WITH_RSB
        if (!this.initial) {
            this.initial = {
                disableRSB : jpf.xmldb.disableRSB //@todo record this in storage
            }
        }
        jpf.xmldb.disableRSB = true;
        //#endif

        this.inProcess = this.IDLE;

        this.dispatchEvent("afteroffline");
        
        //#ifdef __DEBUG
        jpf.console.info("The application is now working offline.")
        //#endif
        
        return true;//success
    },
    
    /**
     * Brings the application online.
     */
    goOnline : function(){
        if (!this.enabled || this.onLine === true 
          || this.inProcess == this.TO_ONLINE)
            return false;
        
        if (this.dispatchEvent("beforeonline") === false)
            return false;
        
        //We're online, let's show the beacon
        this.setProperty("onLine", true); //@todo Think about doing this in the callback, because of processes that will now intersect
        this.inProcess  = this.TO_ONLINE;
        this.onlineTime = new Date().getTime();
        this.reloading  = false;
        
        //#ifdef __DEBUG
        jpf.console.info("Trying to go online.")
        //#endif
        
        //#ifdef __WITH_OFFLINE_DETECTOR
        //Turn off detection if needed
        if (this.detector.enabled && this.detector.detection == "error")
            this.detector.stop();
        //#endif
        
        //#ifdef __WITH_RSB
        //Check if we have to reload all models
        this.$checkRsbTimeout();
        
        //Reset RSB in original state
        if (this.initial)
            jpf.xmldb.disableRSB = this.initial.disableRSB;
        //#endif
        
        var callback = function(){
            /*
                @todo syncing should probably be patched to take a random 
                time before starting to prevent blasting a server during a 
                glitch, of course decent loadbalancing would solve this as well.
            */
            this.startSync();
            
            this.dispatchEvent("afteronline");
        }
        
        //#ifdef __WITH_AUTH
        //First let's log in to the services that need it before syncing changes
        if (jpf.auth.needsLogin && jpf.auth.loggedIn) { // && !jpf.auth.loggedIn
            jpf.auth.authRequired({
                object : this, 
                retry  : callback
            });
        }
        else
        //#endif
        {
            callback.call(this);
        }

        return true;//success
    },

    //#ifdef __WITH_RSB
    /**
     *  If we've been offline for a long time, 
     *  let's clear the models, we can't trust the data anymore
     */    
    $checkRsbTimeout : function(){
        if (!this.rsbTimeout)
            return;

        var i, j, rsbs = jpf.nameserver.getAll("remote");
        for (i = 0; i < rsbs.length; i++) {
            var rsb = rsbs[i];
            if (this.reloading 
              || this.onlineTime - this.offlineTime > this.rsbTimeout) {
                if (!this.reloading) {
                    if (this.dispatchEvent("beforereload") === false) {
                        //#ifdef __DEBUG
                        jpf.console.warn("Warning, potential data corruption\
                            because you've cancelled reloading the data of all \
                            remote smartbinding synchronized models.");
                        //#endif
                        
                        break;
                    }
                    
                    this.reloading = true;
                }
                
                rsb.discardBefore = this.onlineTime;
                
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
        
        if (this.reloading) {
            //#ifdef __DEBUG
            jpf.console.warn("The application has been offline longer than the \
                              server timeout. To maintain consistency the models\
                              are reloaded. All undo stacks will be purged.");
            //#endif
            
            //#ifdef __WITH_OFFLINE_TRANSACTIONS && __WITH_OFFLINE_STATE
            jpf.offline.transactions.clear("undo|redo");
            //#endif
            
            var ats = jpf.nameserver.getAll("actiontracker");
            for (var i = 0; i < ats.length; i++) {
                ats[i].reset();
            }
        }
    },
    //#endif
    
    $goOnlineDone : function(success){
        //this.reloading = true;
        this.inProcess = this.IDLE; //We're done
        this.setProperty("syncing", false);
        
        if (success) {
            this.offlineTime = null;
            this.initial     = null;
            this.storage.remove("offlinetime", this.namespace);
            
            //#ifdef __DEBUG
            jpf.console.info("Syncing done.")
            jpf.console.info("The application is now working online.")
            //#endif
        }
        else {
            //#ifdef __DEBUG
            jpf.console.info("Syncing was cancelled. Going online failed")
            //#endif
            
            //Going online has failed. Going offline again
            this.goOffline();
        }
    },
    
    /**
     * Clears all offline data.
     */
    clear : function(){
        if (!this.enabled)
            return false;
        
        //#ifdef __DEBUG
        jpf.console.info("Clearing all offline and state cache");
        //#endif
        
         for (i = this.resources.length - 1; i >= 0; i--) {
            if (this[this.resources[i]].clear)
                this[this.resources[i]].clear();
        }
    },
    
    /**
     * Does cleanup after we've come online
     * @private
     */
    startSync : function(){
        if (this.syncing)
            return;
        
        this.setProperty("syncing", true);
        
        //#ifdef __DEBUG
        jpf.console.info("Start syncing offline changes.")
        //#endif

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
            if (fln.inProcess == fln.STOPPING) {
                if (!extra.finished && extra.length - 1 != extra.position) {
                    syncRes.stopSync(function(){ //@todo if(syncRes) ??
                        fln.$goOnlineDone(false);
                    });
                } 
                else {
                    fln.$goOnlineDone(false);
                }
                
                return;
            }
            
            if (extra.finished) {
                if (syncResources.length) {
                    syncRes = syncResources.pop();
                    syncRes.sync(callback);
                }
                else {
                    //@todo check if we need to sync more..
                    
                    fln.$goOnlineDone(true);
                }
                
                return;
            }
            
            if (!extra.start)
                syncPos++;
            
            fln.setProperty("progress", parseInt(syncPos/syncLength*100));
            fln.setProperty("position", syncPos);
            fln.setProperty("length", syncLength);
            
            fln.dispatchEvent("sync", jpf.extend(extra, {
                position : syncPos,
                length   : syncLength
            }));
        }
        
        if (syncLength) {
            callback({start    : true});
            callback({finished : true});
        }
        else {
            //#ifdef __DEBUG
            jpf.console.info("Nothing to synchronize.")
            //#endif
            
            this.$goOnlineDone(true);
        }
        
        //#ifdef __WITH_OFFLINE_TRANSACTIONS
        /*
            When going online check loadedWhenOffline of 
            the multiselect widgets and reload() them
        */
        var nodes = jpf.all; //@todo maintaining a list is more efficient, is it necesary??
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].loadedWhenOffline)
                nodes[i].reload();
        }
        //#endif
    },
    
    stopSync : function(){
        debugger;
        if (this.syncing)
            this.inProcess = this.STOPPING;
    }
});
/*#else
jpf.offline = {
    onLine : true
}
#endif */
