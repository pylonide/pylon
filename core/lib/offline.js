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
 * @define offline
 * Adds offline support for aml applications. It can store and restore the state
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
 *  <a:appsettings>
 *      <a:offline providers="gears"
 *        resources     = "application|models|transactions|queue|state"
 *        rdb-timeout   = "10000"
 *        detect-url    = "network.txt"
 *        detection     = "auto"
 *        realtime      = "true"
 *        onrestore     = "return confirm('Continue your previous session?');"
 *        onlosechanges = "" />
 *  </a:appsettings>
 * </code>
 *
 * @event losechanges   Fires before the offline state is removed.
 *   cancelable: Prevents the application from losing it's recorded offline state.
 * @event beforeoffline Fires before bringing the application offline.
 *   cancelable: Prevents the application from going offline
 * @event afteroffline  Firest after the application is brought offline.
 * @event beforeonline  Fires before bringing the application online.
 *   cancelable: Prevents the application from going online
 * @event afteronline   Fires after the application is brought online.
 * @event beforeload    Fires before loading the offline state into this application.
 *   cancelable: Prevents the application from reloading it's offline state.
 * @event sync          Fires at each sync item's completion.
 *   object:
 *   {Number} position the number of the item in the list that is currently processed.
 *   {Number} length   the total number of items in the list.
 *
 * @inherits apf.Class
 *
 * @attribute {Number}  progress  the progress of the sync. A number between 0 and 1.
 * Example:
 * <code>
 * <a:modalwindow title="Synchronizing" visible="{offline.syncing}">
 *    <a:Label>Synchronizing your changes</a:label>
 *    <a:progressbar value="{offline.progress}" />
 *    <a:button onclick="apf.offline.stopSync()">Cancel</a:button>
 *    <a:button onclick="this.parentNode.hide()">Hide Window</a:button>
 * </a:modalwindow>
 * </code>
 * @attribute {Number}  position  the progress of the sync. 
 * @attribute {Number}  length    the total length of items to sync.
 * @attribute {Boolean} syncing   whether the application is syncing while coming online.
 * @attribute {Boolean} onLine    whether the application is online. This property is false during sync.
 * @attribute {String} resources the resources that should be
 * kept offline and synced later. This is a pipe '|' seperated list.
 *   Possible values:
 *   application    deals with making the actual application offline avaible.
 *   models         takes care of having the data of the models offline available.
 *   transactions   records the state of the actiontrackers so that these are available offline.
 *   queue          handles queuing of actions that can only be executed whilst online.
 *   state          records the state of all elements in this application on a property level.
 * @attribute {Number} rdb-timeout the number of milliseconds
 * after the remote databindings server considers a client
 * offline and destroys all saved offline messages.
 * 
 * @default_private
 */
apf.offline = {
    /**
     * whether offline support is enabled.
     * @type {Boolean}
     */
    enabled     : false,

    /**
     * whether the application is online.
     * @type {Boolean}
     */
    onLine      : -1,
    resources   : ["application", "models", "transactions", "queue", "state"],
    autoInstall : false,
    storage     : null,
    inited      : false,
    rdbTimeout  : 600000,//After 10 minutes, we assume the RDB messaged will be destroyed

    init : function(aml){
        apf.makeClass(this);

        //Read configuration
        if (aml) {
            this.$aml = aml;

            if (typeof aml == "string") {

            }
            else if (aml.nodeType) {
                if (aml.getAttribute("resources"))
                    this.providers = aml.getAttribute("resources").split("|");

                /**
                 * @private
                 */
                if (aml.getAttribute("rdb-timeout"))
                    this.rdbTimeout = parseInt(aml.getAttribute("rdb-timeout"));

                //Events
                var a, i, attr = aml.attributes;
                for (i = 0; i < attr.length; i++) {
                    a = attr[i];
                    if (a.nodeName.indexOf("on") == 0)
                        this.addEventListener(a.nodeName, 
                          // #ifdef __WITH_JSLT_EVENTS
                          apf.lm.compile(a.nodeValue, {event: true, parsecode: true})
                          /* #else
                          new Function('event', a.nodeValue)
                          #endif */
                        );
                }
            }
            else {
                apf.extend(this, aml);
            }
        }

        // #ifdef __WITH_OFFLINE_APPLICATION
        var provider = apf.offline.application.init(aml)
        // #endif

        //Check for storage provider
        if (provider) {
            this.storage = apf.storage.getProvider(provider);

            //#ifdef __DEBUG
            if (this.storage)
                apf.console.info("Installed storage provider '" + provider + "'");
            //#endif
        }

        if (!this.storage) {
            this.storage = apf.storage.initialized
                ? apf.storage
                : apf.storage.init(); //autodetect
        }

        if (!this.storage) {
            //#ifdef __DEBUG
            throw new Error("Offline failed to attain access \
                               to a storage provider");
            //#endif

            return;
        }

        if (!this.storage.isPermanent()) {
            apf.addEventListener("exit", function(){
                return apf.offline.dispatchEvent("losechanges");
            });
        }

        if (this.storage.asyncInit) {
            apf.document.$domParser.$shouldWait++; //@todo apf3.0 make this work again
            this.storage.ready(function(){
                apf.offline.storage.onready = null; //Prevent being called twice
                apf.offline.continueInit();
                apf.document.$domParser.$continueParsing(apf.document.documentElement);
            });

            return;
        }

        this.continueInit();
    },

    continueInit : function(){
        // Check if all specified resources are available
        for (var i = this.resources.length - 1; i >= 0; i--) {
            if (!this[this.resources[i]])
                this.resources.removeIndex(i);
            else
                this[this.resources[i]].init(this.$aml);
        }

        this.enabled = true;

        //#ifdef __WITH_OFFLINE_DETECTOR
        this.detector.init(this.$aml);
        //#endif

        this.offlineTime = parseInt(this.storage.get("offlinetime", this.namespace));

        //If we were offline lets stay offline
        if (this.offlineTime)
            this.goOffline();
        else //Else we try to go online
            this.goOnline();

        apf.offline.dispatchEvent("load");
    },

    $destroy : function(){
        //#ifdef __DEBUG
        apf.console.info("Cleaning offline");
        //#endif

        if (this.provider && this.provider.destroy)
            this.provider.destroy();

        if (this.storage && this.storage.destroy)
            this.storage.destroy();

        for (var i = this.resources.length - 1; i >= 0; i--) {
            if (this[this.resources[i]] && this[this.resources[i]].destroy)
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
        //if (apf.auth.retry) //Don't want to ruin the chances of having a smooth ride on a bad connection
        //    apf.auth.loggedIn = false; //we're logged out now, we'll auto-login when going online
        //#endif

        //#ifdef __WITH_OFFLINE_DETECTOR
        //Turn off detection if needed
        if (this.detector.enabled && this.detector.detection != "manual")
            this.detector.start();
        //#endif

        //#ifdef __WITH_RDB
        if (!this.initial) {
            /**
             * @private
             */
            this.initial = {
                disableRDB : apf.xmldb.disableRDB //@todo record this in storage
            }
        }
        apf.xmldb.disableRDB = true;
        //#endif

        this.inProcess = this.IDLE;

        this.dispatchEvent("afteroffline");

        //#ifdef __DEBUG
        apf.console.info("The application is now working offline.")
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
        apf.console.info("Trying to go online.")
        //#endif

        //#ifdef __WITH_OFFLINE_DETECTOR
        //Turn off detection if needed
        if (this.detector.enabled && this.detector.detection == "error")
            this.detector.stop();
        //#endif

        //#ifdef __WITH_RDB
        //Check if we have to reload all models
        this.$checkRsbTimeout();

        //Reset RDB in original state
        if (this.initial)
            apf.xmldb.disableRDB = this.initial.disableRDB;
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
        var auth = apf.document.getElementsByTagNameNS(apf.ns.apf, "auth")[0];
        if (!auth)
            return;
        //First let's log in to the services that need it before syncing changes
        if (auth.needsLogin && auth.loggedIn) { // && !auth.loggedIn
            auth.authRequired({
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

    //#ifdef __WITH_RDB
    /**
     *  If we've been offline for a long time,
     *  let's clear the models, we can't trust the data anymore
     */
    $checkRsbTimeout : function(){
        if (!this.rdbTimeout)
            return;
        //#ifdef __WITH_NAMESERVER
        var i, j, k, rdbs = apf.nameserver.getAll("remote");
        for (i = 0; i < rdbs.length; i++) {
            var rdb = rdbs[i];
            if (this.reloading
              || this.onlineTime - this.offlineTime > this.rdbTimeout) {
                if (!this.reloading) {
                    if (this.dispatchEvent("beforereload") === false) {
                        //#ifdef __DEBUG
                        apf.console.warn("Warning, potential data corruption\
                            because you've cancelled reloading the data of all \
                            remote databinding synchronized models.");
                        //#endif

                        break;
                    }

                    this.reloading = true;
                }

                rdb.discardBefore = this.onlineTime;

                for (j = 0; k < rdb.models.length; j++) {
                    rdb.models[j].clear();

                    // #ifdef __WITH_OFFLINE_MODEL
                    apf.offline.models.addToInitQueue(rdb.models[j])
                    /* #else
                    rbs[i].models[j].init();
                    #endif */
                }
            }
        }
        //#endif
        if (this.reloading) {
            //#ifdef __DEBUG
            apf.console.warn("The application has been offline longer than the \
                              server timeout. To maintain consistency the models\
                              are reloaded. All undo stacks will be purged.");
            //#endif

            //#ifdef __WITH_OFFLINE_TRANSACTIONS && __WITH_OFFLINE_STATE
            apf.offline.transactions.clear("undo|redo");
            //#endif

            //#ifdef __WITH_NAMESERVER
            var ats = apf.nameserver.getAll("actiontracker");
            for (var i = 0; i < ats.length; i++) {
                ats[i].reset();
            }
            //#endif
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
            apf.console.info("Syncing done.")
            apf.console.info("The application is now working online.")
            //#endif
        }
        else {
            //#ifdef __DEBUG
            apf.console.info("Syncing was cancelled. Going online failed")
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
        apf.console.info("Clearing all offline and state cache");
        //#endif

         for (var i = this.resources.length - 1; i >= 0; i--) {
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
        apf.console.info("Start syncing offline changes.")
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

        var fln      = apf.offline;
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

            fln.dispatchEvent("sync", apf.extend(extra, {
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
            apf.console.info("Nothing to synchronize.")
            //#endif

            this.$goOnlineDone(true);
        }

        //#ifdef __WITH_OFFLINE_TRANSACTIONS
        /*
            When going online check $loadedWhenOffline of
            the multiselect widgets and reload() them
        */
        var nodes = apf.all; //@todo maintaining a list is more efficient, is it necesary??
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].$loadedWhenOffline)
                nodes[i].reload();
        }
        //#endif
    },

    stopSync : function(){
        if (this.syncing)
            this.inProcess = this.STOPPING;
    }
};
/*#else
apf.offline = {
    onLine : true
}
#endif */
