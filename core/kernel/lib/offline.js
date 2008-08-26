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
    isOnline    : true,
    interval    : 5000,
    providers   : ["deskrun", "air", "gears", "flash"],
    resources   : ["application", "data", "transactions"],
    modules     : {},
    detection   : "manual", //manual|true|error
    autoInstall : false,
    storeName   : "jpf_store_" + (jpf.appsettings.name 
        || window.location.href.replace(/[^0-9A-Za-z_]/g, "_"));
    storage     : null,
    
    init : function(jml){
        jpf.makeClass(this);
        
        //Read configuration
        if (jml) {
            if (typeof jml == "string") {
                this.providers = jml.split("|");
            }
            else if (jml.nodeType) {
                this.jml = jml;
                
                if (jml.getAttribute("interval"))
                    this.interval = parseInt(jml.getAttribute("interval"));
                
                if (jml.getAttribute("providers"))
                    this.providers = jml.getAttribute("providers").split("|");
                
                if (jml.getAttribute("resources"))
                    this.providers = jml.getAttribute("resources").split("|");
                
                if (jml.getAttribute("detection"))
                    this.detection = jpf.isTrue(jml.getAttribute("detection"))
                        ? "auto" 
                        : jml.getAttribute("detection");
                
                if (jml.getAttribute("detect-file"))
                    this.detector.availabilityURL = jml.getAttribute("detect");
                
                if (jml.getAttribute("auto-install"))
                    this.autoInstall = jpf.isTrue(jml.getAttribute("auto-install"));
                
                if (jml.getAttribute("version-file"))
                    this.application.versionURL = jml.getAttribute("version-file");
                
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
        
        //Check for an available offline provider
        for (var i = 0; i < this.providers.length; i++) {
            if (!this.modules[this.providers[i]]) {
                //#ifdef __DEBUG
                jpf.issueWarning("Module not loaded for offline provider: " + this.providers[i]);
                //#endif
                continue;
            }
            
            if (this.modules[this.providers[i]].isAvailable()) {
                this.provider = this.modules[this.providers[i]].init(this.storeName);
                this.provider.name = this.providers[i];
                if (this.provider !== false)
                    break;
            }
        }
        
        //@todo if online please check if the latest version is loaded here
        
        if (!this.provider) {
            if (this.autoInstall) {
                if (this.install() === false) {
                    //#ifdef __DEBUG
                    jpf.issueWarning("Could not install of the preferred offline providers:" + this.providers.join(", "));
                    //#endif
                    return false;
                }
            }
            else {
                //#ifdef __DEBUG
                //throw new Error(0, jpf.formatErrorString(0, this, "Finding offline provider", "Could not find any of the specified offline providers:" + this.providers.join(", "));
                jpf.issueWarning("Could not find any of the specified offline providers:" + this.providers.join(", "));
                //#endif
                return false;
            }
        }
        
        //Check for storage provider
        this.storage = jpf.storage.get(this.provider.name);
        if(!this.storage) 
            this.storage = jpf.storage.initialized 
                ? jpf.storage 
                : jpf.storage.init(); //autodetect
        
        if (!this.storage) {
            //#ifdef __DEBUG
            jpf.issueWarning("Offline failed to attain access to a storage provider");
            //#endif
        }
        
        //Turn on network detection
        this.detector.init();
    },
    
    install : function(){
        if (this.dispatchEvent("onbeforeinstall") === false) {
            //#ifdef __DEBUG
            jpf.issueWarning("Installation cancelled");
            //#endif
            return false;
        }
        
        for (var i = 0; i < this.providers.length; i++) {
            if (!this.modules[this.providers[i]])
                continue;
            
            if (this.modules[this.providers[i]].install()) {
                this.provider = this.modules[this.providers[i]].init(this.storeName);
                if (this.provider !== false)
                    return;
            }
        }
        
        this.dispatchEvent("onafterinstall");
    },
    
    //Detect if we have network, the detection moments can be manual, auto, error
    detector : {
        availabilityURL : jpf.basePath + "core/kernel/lib/offline/network_check.txt",
        
        init : function(){
            this.oHttp = new jpf.http();
            this.oHttp.timeout = jpf.offline.interval;
            
            if (jpf.offline.detection == "auto") {
                this.start();
            }
            else if (jpf.offline.detection == "error") {
                jpf.document.addEventListener("onerror", function(e){
                    //Timeout detected.. Network is probably gone
                    if (e.state && e.state == __HTTP_TIMEOUT__) {
                        //Let's try to go offline and return false to cancel the error
                        return !jpf.offline.__setOffline(callback); 
                    }
                });
            }
        },
    
        isSiteAvailable : function(callback){
            this.oHttp.get(this.getAvailabilityURL(), function(data, state, extra){
                if(state == __HTTP_ERROR__ || state == __HTTP_TIMEOUT__){
                    jpf.offline.__setOffline(callback); //retry here??
                }
                else{
                    jpf.offline.__setOnline(callback);
                }
            });
        },
    
        start : function(){
            clearInterval(this.timer);
            
            var _self = this;
            this.timer = setInterval(function(){
                _self.isSiteAvailable();
            }, jpf.offline.interval);
        },
        
        stop : function(){
            clearInterval(this.timer);
        },
    
        getAvailabilityURL : function(){
            return this.availabilityURL 
                + (this.availabilityURL.indexOf("?") == -1 ? "?" : "&") 
                + "browserbust=" + new Date().getTime();
        }
    },
    
    STORAGE_NAMESPACE: "_dot",
    _STORAGE_APP_NAME: window.location.href.replace(/[^0-9A-Za-z_]/g, "_"),
    goingOnline: false,
    
    goOffline: function(){ /* void */
        // summary:
        //        For advanced usage; most developers can ignore this.
        //        Manually goes offline, away from the network.
        if((jpf.offline.sync.isSyncing)||(this.goingOnline)){ return; }
        
        this.goingOnline = false;
        this.isOnline = false;
    },
    
    goOnline: function(callback){ /* void */
        if(jpf.offline.sync.isSyncing || jpf.offline.goingOnline){
            return;
        }
        
        this.goingOnline = true;
        this.isOnline = false;
        
        // see if can reach our web application's web site
        this.isSiteAvailable(callback);
    },
    
    __setOffline: function(){
        if(this.dispatchEvent("onbeforeoffline") === false)
            return;
        
        //Ask to go offline or event
        //start detector if necesary
        //if not transactions started, disable actions
        
        var initial = {
            disableRSB : jpf.XMLDatabase.disableRSB;
        }
        
        jpf.XMLDatabase.disableRSB = true;
        
        this.dispatchEvent("onafteroffline");
        
        return true;//success
    },
    
    __setOnline: function(){
        if(this.dispatchEvent("onbeforeonline") === false)
            return;
        
        //stop detector if not necesary  
        //start syncing
        
        jpf.XMLDatabase.disableRSB = initial.disableRSB;
        
        this.dispatchEvent("onafteronline")
        
        return true;//success
    },
    
    application : {
        urls      : [],
        namespace : "__JPF_OFFLINE_APP_" + (jpf.appsettings.name || "DEFAULT"),
    
        cache : function(url){
            if(!new jpf.url(url).isSameLocation())
                return;
                
            this.urls.pushUnique(url.replace(/\#.*$/, ""));
        },
        
        remove : function(url){
            this.urls.remove(url)
        },
        
        refresh : function(callback){
            var storage = jpf.offline.storage;
            
            if(this.versionURL){
                var oldVersion = storage.get("oldVersion", this.namespace);
                var newVersion = null;
                var _self      = this;
                
                jpf.oHttp.get(this.versionURL + "?browserbust=" + new Date().getTime(), 
                    function(newVersion, state, extra){
                        if(state == __HTTP_ERROR__ || state == __HTTP_TIMEOUT__){
                            storage.remove("oldVersion", _self.namespace);
                        }
                        
                        if(jpf.debug || !newVersion || !oldVersion 
                            || oldVersion != newVersion){
                            
                            //#ifdef __STATUS
                            jpf.status("Refreshing offline file list");
                            //#endif
                            
                            jpf.offline.provider.store(this.urls, callback, newVersion);
                        }else{
                            //#ifdef __DEBUG
                            jpf.status("No need to refresh offline file list");
                            //#endif

                            callback(false, []);
                        }
                    });
            }
            else{
                //#ifdef __STATUS
                jpf.status("Refreshing offline file list");
                //#endif

                jpf.offline.provider.store(this.urls, callback);
            }
        },
        
        //forEach???
        search : function(){
            //Html based sources
            this.cache(window.location.href);

            var nodes = document.getElementsByTagName("script");
            for (var i = 0; i < nodes.length; i++)
                this.cache(nodes[i].getAttribute("src"));
            
            var nodes = document.getElementsByTagName("link");
            for (var i = 0; i < nodes.length; i++){
                if((nodes[i].getAttribute("rel") || "").toLowerCase() == "stylesheet")
                    continue;
                
                this.cache(nodes[i].getAttribute("href"));
            }
            
            var nodes = document.getElementsByTagName("img");
            for (var i = 0; i < nodes.length; i++)
                this.cache(nodes[i].getAttribute("src"));
            
            var nodes = document.getElementsByTagName("a");
            for (var i = 0; i < nodes.length; i++)
                this.cache(nodes[i].getAttribute("href"));
            
            // @todo handle 'object' and 'embed' tag
            
            // parse our style sheets for inline URLs and imports
            var sheets = document.styleSheets;
            for (var i = 0; i < sheets.length; i++) {
                var sheet = sheets[i];
                
                for (var j = 0; j < sheet[jpf.styleSheetRules].length; j++) {
                    var rule = sheet[jpf.styleSheetRules][j];
                    if(!rule.cssText) 
                        continue;
                    
                    var matches = rule.cssText.match(/url\(\s*([^\) ]*)\s*\)/i);
                    if(!matches)
                        return;
                    
                    for(var i = 1; i < matches.length; i++)
                        this.cache(matches[i])
                }
            }
            
            //Jml based sources
            if (jpf.JMLParser.jml) {
                var _self = this;
                function callback(item){
                    if(!item.nodeType) return;
                    
                    var nodes = item.selectNodes("//include/@src|//skin/@src");
                    for (var i = 0; i < nodes.length; i++) {
                        _self.cache(nodes[i].nodeValue);
                    }
                }
                
                callback(jpf.JMLParser.jml);
                jpf.IncludeStack.forEach(callback);
            }
            
            //Cached resources??
        },
        
        save : function(){
            this.search();
            this.refresh();
        }
    },
    
    data : {
        enabled   : false,
        timer     : null,
        models    : {},
        namespace : "__JPF_OFFLINE_DATA_"  + (jpf.appsettings.name 
            || window.location.href.replace(/[^0-9A-Za-z_]/g, "_")),
        
        markForUpdate : function(model){
            models[model.uniqueId] = model;

            if(!this.timer){
                var _self = this;
                this.timer = setTimeout(function(){
                    _self.timer = null;
                    var models  = _self.models;
                    
                    for (var mId in models) {
                        _self.updateModel(models[mId]);
                    }
                });
            }
        },
        
        updateModel : function(model){
            if (!model.name) //temporary workaround... should be fixed neatly
                continue;
            
            jpf.offline.storage.put(model.name, model.getXml(), this.namespace);
        },

        start : function(){
            //start listening for changes in the data and record it, 
            //we don't want to loose the changes when the browser crashes
            
            this.enabled = true;
        },
        
        save : function(){
            //Save all the models
            //Save all actiontracker non-purged states
            
            var models = jpf.NameServer.getAll("models");
            for (var i = 0; i < models.length; i++) {
                this.updateModel(models[mId]);
            }
        },
        
        /*
            This process should probably be enhanced a lot to lock into the load
            of the model to simulate normal loading. Of course this depends on
            the detection of the offline state. If the provider tells us this 
            in a relative early state we can easily load the model data early on.
        */
        load : function(){
            var storage = jpf.offline.storage;
            var models = storage.getKeys(this.namespace);
            for (var i = 0; i < models.length; i++) {
                jpf.NameServer.get("model", models[i]).load(storage.get(models[i]));
            }
        }
    },

    canTransact : function(){
        if(this.isOnline || this.transactions.enabled)
            return true;
        
        //Transactions can be enabled from this event
        if(this.dispatchEvent("ontransactioncancel", {
            message : "Could not execute transaction whilst being offline, silently doing nothing",
            bubbles : true
        }) === true)
            return true;
        
        return false;
    },
    
    transactions : {
        enabled : true,
        
        //Not RSB (xmpp, or otherwise)
        //Well normal
        //Connect to actiontracker?
        //What about basic xmlhttp req??
        
        //Sync to server, execute undo where necesary
        
        start : function(){
            //start listening for transactions to be sent to the server and record them
        },
        
        save : function(){
            
        }
    }
}
//#endif


/*
_onLoad: function(){
        //console.debug("jpf.offline._onLoad");
        
        // both local storage and the page are finished loading
        
        // cache the Dojo JavaScript -- just use the default dojo.js
        // name for the most common scenario
        // FIXME: TEST: Make sure syncing doesn't break if dojo.js
        // can't be found, or report an error to developer
        jpf.offline.files.cache(dojo.moduleUrl("dojo", "dojo.js"));
        
        // pull in the files needed by Dojo
        this._cacheDojoResources();
        
        // FIXME: need to pull in the firebug lite files here!
        // workaround or else we will get an error on page load
        // from Dojo that it can't find 'console.debug' for optimized builds
        // jpf.offline.files.cache(dojo.config.baseRelativePath + "src/debug.js");
        
        // make sure that resources needed by all of our underlying
        // Dojo Storage storage providers will be available
        // offline
        jpf.offline.files.cache(jpf.storage.manager.getResourceList());
        
        // slurp the page if the end-developer wants that
        jpf.offline.files._slurp();
        
        // see if we have an offline cache; when done, move
        // on to the rest of our startup tasks
        this._checkOfflineCacheAvailable(dojo.hitch(this, "_onOfflineCacheChecked"));
    },
    
    _onOfflineCacheChecked: function(){
        // this method is part of our _onLoad series of startup tasks
        
        // if we have an offline cache, see if we have been added to the 
        // list of available offline web apps yet
        if(this.hasOfflineCache && this.enabled){
            // load framework data; when we are finished, continue
            // initializing ourselves
            this._load(dojo.hitch(this, "_finishStartingUp"));
        }else if(this.hasOfflineCache && !this.enabled){
            // we have an offline cache, but it is disabled for some reason
            // perhaps due to the user denying a core operation
            this._finishStartingUp();
        }else{
            this._keepCheckingUntilInstalled();
        }
    },
    
    _keepCheckingUntilInstalled: function(){
        // this method is part of our _onLoad series of startup tasks
        
        // kick off a background interval that keeps
        // checking to see if an offline cache has been
        // installed since this page loaded
            
        // FIXME: Gears: See if we are installed somehow after the
        // page has been loaded
        
        // now continue starting up
        this._finishStartingUp();
    },
    
    _finishStartingUp: function(){
        //console.debug("jpf.offline._finishStartingUp");
        
        // this method is part of our _onLoad series of startup tasks
        
        if(!this.hasOfflineCache){
            this.onLoad();
        }else if(this.enabled){
            // kick off a thread to check network status on
            // a regular basis
            this._startNetworkThread();

            // try to go online
            this.goOnline(dojo.hitch(this, function(){
                //console.debug("Finished trying to go online");
                // indicate we are ready to be used
                jpf.offline.onLoad();
            }));
        }else{ // we are disabled or a core operation failed
            if(this.coreOpFailed){
                this.onFrameworkEvent("coreOperationFailed");
            }else{
                this.onLoad();
            }
        }
    },
    
    _onPageLoad: function(){
        //console.debug("jpf.offline._onPageLoad");
        this._pageLoaded = true;
        
        if(this._storageLoaded && this._initializeCalled){
            this._onLoad();
        }
    },
    
    _onStorageLoad: function(){
        //console.debug("jpf.offline._onStorageLoad");
        this._storageLoaded = true;
        
        // were we able to initialize storage? if
        // not, then this is a core operation, and
        // let's indicate we will need to fail fast
        if(!jpf.storage.manager.isAvailable()
            && jpf.storage.manager.isInitialized()){
            this.coreOpFailed = true;
            this.enabled = false;
        }
        
        if(this._pageLoaded && this._initializeCalled){
            this._onLoad();        
        }
    },
*/