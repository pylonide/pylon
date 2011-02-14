/**
 * Offline Support for Cloud9
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/offline/offline", ["core/ext", "core/ide", "ext/offline/lib-offline", "ext/offline/lib-sync", "ext/filesystem/filesystem"],
    function(ext, ide, Offline, Sync, fs) {

return ext.register("ext/offline/offline", {
    dev         : "Ajax.org",
    name        : "Offline",
    alone       : true,
    type        : ext.GENERAL,
    deps        : [fs],
    
    test : function(online){
        this.offline.stopDetect();
        if (online)
            this.offline.goOnline();
        else
            this.offline.goOffline();
    },
    
    init : function(){
        var offline = this.offline = new Offline("cloud9", "static/ext/offline/ping.txt");
        var sync    = this.sync    = new Sync("cloud9");
        
        //Forward Events
        offline.dispatchEvent = function(name, e){
            ide.dispatchEvent(name, e);
        };
        
        ide.onLine = -1;
        
        //If we are syncing stop sync.
        ide.addEventListener("beforeoffline", function(){
            if (sync.syncing)
                sync.stop();
        });
        
        ide.addEventListener("afteroffline", function(){
            if (!fs.realWebdav)
                fs.realWebdav = fs.webdav;
            fs.webdav = offlineWebdav
            
            ide.onLine = false;
        });
        
        //If we need to sync first, prevent Cloud9 from coming online
        ide.addEventListener("beforeonline", function(){
            if (sync.getLength()) {
                sync.start(function(data, next){
                    var item = data.item;
                    //Execute sync task here
                    console.log("SYNC ITEM");
                    item.handler(item);
                    
                    if (next() < 0) //End of loop
                        offline.goOnline();
                });
                return false;
            }
        });
        
        ide.addEventListener("afteronline", function(e){
            if (fs.realWebdav)
                fs.webdav = fs.realWebdav;
            
            ide.onLine = true;
        });
        
        var offlineWebdav = {
            read : function(path, callback){
                this.handleError(callback);
            },
            write : function(path, data, x, callback){
                sync.add(path, {
                    path: path,
                    data: data,
                    handler: function(){}
                });
                
                if (callback)
                    callback("", apf.SUCCESS, {});
            },
            list : function(path, callback){
                this.handleError(callback);
            },
            exec : function(type, args, callback) {
                switch(type) {
                    case "create":
                        //args = [path, filename];
                    break;
                    case "mkdir":
                        //args = [path, name]
                    break;
                    default:
                        //No can do
                        this.handleError(callback);
                }
            },
            handleError : function(callback){
                alert("Sorry, you are offline right now and cannot perform this operation");
                callback(null, apf.ERROR, {});
            }
        }
        
        offline.start();
    },
    
    enable : function(){
    },
    
    disable : function(){
    },
    
    destroy : function(){
        //Remove all events
    }
});

/*

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

        //#ifdef __WITH_AUTH
//if (apf.auth.retry) //Don't want to ruin the chances of having a smooth ride on a bad connection
//    apf.auth.loggedIn = false; //we're logged out now, we'll auto-login when going online
//#endif

var _self = this;
apf.addEventListener("exit", function(){
    return _self.dispatchEvent("losechanges");
});
*/

});