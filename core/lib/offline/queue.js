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

// #ifdef __WITH_OFFLINE_QUEUE

/**
 * Object handling queuing of actions that can only be executed whilst online.
 * These actions are stored in the queue and executed in serie when the 
 * application comes online again. This is done after apf.auth has logged the
 * user into the application again, if necesary. This object is used for HTTP
 * XMPP and Webdav, but is general purpose and can be used to store any 
 * action that should only be executed while online. 
 *
 * @default_private
 */
apf.offline.queue = {
    enabled : false,
    stack   : [],
    
    init : function(){
        this.namespace = apf.config.name + ".apf.offline.queue";
        this.enabled   = true;
    },
    
    add : function(commInfo){
        var namespace = this.namespace;
        var storage   = apf.offline.storage;
        var len       = parseInt(storage.get("length", namespace)) || 0;
        
        //Add the commInfo to the stack
        this.stack[len] = commInfo; //retry this on sync
        
        //Check here for xml nodes in storeInfo??
        
        //Store http info
        storage.put(len, apf.serialize(commInfo), namespace);
        storage.put("length", ++len, namespace);

        /*
            If there's a callback, we'll inform it that we're not
            executing the call because we're offline. 
        */
        var callback = commInfo.callback;
        if (!commInfo.undoObj && callback) {
            //#ifdef __DEBUG
            var strWarn = "The application is currently offline. Your \
                           request will be retried when the application \
                           goes online again. Please be aware that when the\
                           request is finally made, this callback might\
                           not be available anymore. Therefore the state of\
                           the data should already represent the state of\
                           the application that a succesfull execution of\
                           the request communicates. You might want to look\
                           at using an actiontracker.";
            
            apf.console.warn(strWarn);
            //#endif
            
            callback(null, apf.OFFLINE, apf.extend({
                offline : true
                //#ifdef __DEBUG
                , message : strWarn
                //#endif
            }, commInfo));
        }
    },
    
    stopSync : function(callback){
        this.stop = callback;
    },
    
    getSyncLength : function(){
        return parseInt(apf.offline.storage.get("length", this.namespace)) || 0;
    },
    
    //Sync all transactions, let offline decide when
    sync : function(callback, isStarted){
        if (this.stop) {
            this.stop();
            this.stop = null;
            return 
        }

        var namespace = this.namespace;
        var storage   = apf.offline.storage;
        var len       = parseInt(storage.get("length", namespace)) || 0;
        var start     = parseInt(storage.get("start", namespace)) || 0;
        var commInfo;

        if (this.stack[start]) {
            commInfo = this.stack[start];
        }
        else {
            commInfo = this.$getCommInfo(storage.get(start, namespace));
            if (!commInfo) {
                //#ifdef __DEBUG
                apf.console.error("Error syncing queue items. This is a serious\
                error. The queue stack has become corrupted. It will now be \
                cleared and the queued offline messages will be lost!"); //@todo
                //#endif
                
                this.clear();
                apf.offline.stopSync();
                
                return callback({finished: true});
            }
            
            this.stack[start] = commInfo;
        }
        
        if (!commInfo.callback2) {
            commInfo.callback2 = commInfo.callback;

            commInfo.callback  = function(data, state, extra){
                //We'll let the main callback decide if this one should be retries
                if (commInfo.callback2 && 
                  commInfo.callback2.apply(window, arguments) === true) {
                    //@todo: Warning here??
                    
                    return true;
                }
                
                // We're done with this one
                storage.remove(start, namespace);
                storage.put("start", start+1, namespace);
                apf.offline.queue.stack[start] = null;
                
                callback({
                    position : start,
                    length   : len,
                    info     : commInfo
                });
                
                if (start == len - 1) {
                    //Sync is completely done
                    storage.clear(namespace);
                    
                    callback({
                        finished : true
                    });
                }
                else {
                    //Next!
                    apf.offline.queue.sync(callback, true);
                }
            }
        }
        
        this.stack[start].retry();
    },
    
    clear : function(){
         apf.offline.storage.clear(this.namespace);
    },
    
    $getCommInfo : function(strCommItem){
        if (!strCommItem)
            return false;
        
        var commObject, commInfo = apf.unserialize(strCommItem);
        for (var i = 0; i < commInfo.$object.length; i++) {
            commObject = self[commInfo.$object[i]] || eval(commInfo.$object[i]);
            if (commObject)
                break;
        }
        
        //#ifdef __DEBUG
        if (!commObject) {
            //@todo
        }
        //#endif
        
        commInfo.object = commObject;
        commInfo.retry  = new Function(commInfo.$retry);
        
        return commInfo;
    }
};

// #endif
