/**
 * General Purpose Offline Syncing Library
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
 * @property {Number}  progress  the progress of the sync. A number between 0 and 1.
 * @property {Number}  position  the progress of the sync. 
 * @property {Number}  length    the total length of items to sync.
 * @property {Boolean} syncing   whether the application is syncing while coming online.
 * @property {Boolean} onLine    whether the application is online. This property is false during sync.
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var Offline = module.exports = function(namespace, detectUrl){
    /**
     * whether the application is online.
     * @type {Boolean}
     */
    this.onLine    = -1;
    this.detectUrl = detectUrl;
    this.interval  = 5000;
    this.namespace = namespace;
    
    //navigator.onLine
    var cache = window.applicationCache;
    
    //@todo this is non-ie for now
    
    cache.addEventListener("offline", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("online", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("checking", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("downloading", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("progress", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("cached", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("noupdate", function(e){
        //console.log(e.type);
    }, false);
    
    cache.addEventListener("updateready", function(e){
        //console.log(e.type);
        cache.swapCache();
    }, false);
    
    cache.addEventListener("error", function(e){
        //console.log(e.type);
    }, false);
};

(function(){
    
    this.start = function(){
        // TODO: turned off because at this point the IDE is not up yet and
        // will result in JS errors
        this.offlineTime = parseInt(localStorage[this.namespace + ".offlinetime"] || 0, 10);

        //If we were offline lets stay offline
        if (this.offlineTime)
            this.goOffline();
        //I beleve these should be commented out for detection to pick up on the online state
        //else //Else we try to go online
            //this.goOnline();
        
        // NOTE: We now call [this].goOffline() and [this].goOnline() externally triggered by socket.io state.
        // this.startDetect();
    }
    
    /**** Offline Detection ****/
// NOTE: We now call [this].goOffline() and [this].goOnline() externally triggered by socket.io state.
/*    
    this.isSiteAvailable = function(callback){
        var _self = this;
        
        if (!this.http) {
            this.http = new apf.http();
            this.http.timeout = this.interval;
        }
        
        this.http.get(apf.getNoCacheUrl(this.detectUrl), {
            callback: function(data, state, extra){
                if (state != apf.SUCCESS){ // || !window.navigator.onLine
                    _self.goOffline(callback); //retry here??
                }
                else {
                    _self.goOnline(callback);
                }
            },
            ignoreOffline  : true,
            hideLogMessage : true
        });
    };
*/    
    this.startDetect = function(){
// NOTE: We now call [this].goOffline() and [this].goOnline() externally triggered by socket.io state.
/*        
        if (this.detectErrorHandler) //Detection already started
            return;
        
        var _self = this;
        
        apf.addEventListener("error", this.detectErrorHandler = function(e){
            //Timeout detected.. Network is probably gone
            if (e.state == apf.TIMEOUT) {
                //Let's try to go offline and return false to cancel the error
                return !_self.goOffline();//callback //@todo callback???
            }
        });
        
        //Check if we have connection right now
        this.isSiteAvailable();
        
        //#ifdef __DEBUG
        apf.console.info("Started automatic detection of network state");
        //#endif
        
        this.detectTimer = setInterval(function(){
            _self.isSiteAvailable();
        }, this.interval);
*/        
    }
    
    this.stopDetect = function(){
// NOTE: We now call [this].goOffline() and [this].goOnline() externally triggered by socket.io state.
/*        
//        clearInterval(this.detectTimer);
        apf.removeEventListener("error", this.detectErrorHandler);
        
        //#ifdef __DEBUG
        apf.console.info("Stopped automatic detection of network state");
        //#endif
*/
    }
    
    /**** Offline State Management ****/

    /**
     * Brings the application offline.
     */
    this.goOffline = function(){
        if (this.onLine === false)
            return false;

        if (this.dispatchEvent("beforeoffline") === false)
            return false;

        //We're offline, let's dim the light
        this.onLine    = false;

        if (!this.offlineTime) {
            this.offlineTime = new Date().getTime();
            // this can yield errors ('cause it's DOM):
            // [Exception... "Failure"  nsresult: "0x80004005 (NS_ERROR_FAILURE)"
            try {
                localStorage[this.namespace + ".offlinetime"] = this.offlineTime;
            }
            catch(ex) {}
        }

        this.dispatchEvent("afteroffline");

        return true;//success
    }

    /**
     * Brings the application online.
     */
    this.goOnline = function(){
        if (this.onLine === true)
            return false;

        if (this.dispatchEvent("beforeonline") === false)
            return false;

        //We're online, let's show the beacon
        this.onlineTime  = new Date().getTime();
        this.onLine      = true; //@todo Think about doing this in the callback, because of processes that will now intersect
        this.offlineTime = null;
        
        // this can yield errors ('cause it's DOM):
        // [Exception... "Failure"  nsresult: "0x80004005 (NS_ERROR_FAILURE)"
        try {
            delete localStorage[this.namespace + ".offlinetime"];
        }
        catch(ex) {}
        
        this.dispatchEvent("afteronline");

        return true;//success
    }
}).call(Offline.prototype = new apf.Class().$init());

});