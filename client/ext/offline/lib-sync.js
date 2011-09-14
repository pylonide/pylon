/**
 * Offline Support for Cloud9
 *
 * @copyright 2011, Ajax.org B.V.
 */

define(function(require, exports, module) {

var Sync = module.exports = function(namespace){
    this.namespace = namespace;
    
    this.items = localStorage[this.namespace + ".syncitems"]
        ? apf.unserialize(localStorage[this.namespace + ".syncitems"])
        : {length: 100};
    
};

(function(){
    this.getLength = function(){
        return this.items.length;
    }
    
    /**
     * Clears all offline data.
     */
    this.clear = function(){
        if (!this.enabled)
            return false;
    
        //#ifdef __DEBUG
        apf.console.info("Clearing all offline and state cache");
        //#endif
    
         this.items = {length: 0};
         localStorage[this.namespace + ".syncitems"] = apf.serialize(this.items);
    }
    
    this.add = function(id, syncItem){
        this.items[id] = syncItem;
        this.items.length++;
        
        localStorage[this.namespace + ".syncitems"] = apf.serialize(this.items);
        
        //@todo error handling
    }
    
    /**
     * Does cleanup after we've come online
     * @private
     */
     this.start = function(handler){
        if (this.syncing)
            return;
        
        var syncItems  = apf.extend({}, this.items),
            syncLength = this.items.length,
            len, i;
    
        var _self = this;
        var next = function(error, start){
            if (!_self.syncing)
                return false;

            if (!start) {
                syncItems.length--;
                localStorage[_self.namespace + ".syncitems"] = apf.serialize(syncItems); //Save state up to now
            }
            
            if (syncItems.length < 1) {
                _self.items = {length: 0};
                localStorage[_self.namespace + ".syncitems"] = apf.serialize(_self.items);
                
                return -1;
            }
    
            var item;
            for (var id in syncItems) {
                if (id == "length") 
                    continue;
                    
                item = syncItems[id];
                delete syncItems[id];
                break;
            }
            if (item === undefined)
                return -1;
            
            handler({
                item     : item,
                progress : parseInt((syncLength - syncItems.length)/syncLength*100),
                position : (syncLength - syncItems.length),
                length   : syncLength
            }, next);
            
            return 1;
        }
    
        this.syncing = true;
        next(null, true);
    };
    
    this.stop = function(){
        if (this.syncing)
            this.syncing = false;
    };
}).call(Sync.prototype);

});