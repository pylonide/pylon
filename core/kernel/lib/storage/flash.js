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

// #ifdef __WITH_STORAGE_FLASH

// summary: 
//        Storage provider that uses features in Flash to achieve permanent
//        storage
// description:

jpf.storage.modules.flash = {
    initialized   : false,
    
    _available    : null,
    _statusHandler: null,
    _flashReady   : false,
    _pageReady    : false,
    
    delayCalls    : [],
    
    /**
     * @todo replace this with mikes flash code
     */
    init: function(){
        this.name        = "flashStorage";
        this.STORAGE_SWF = "/core/kernel/lib/storage/resources/jpfStorage.swf";
        
        this.id = jpf.flash.addPlayer(this);
        
        // IE/Flash has an evil bug that shows up some time: if we load the
        // Flash and it isn't in the cache, ExternalInterface works fine --
        // however, the second time when its loaded from the cache a timing
        // bug can keep ExternalInterface from working. The trick below 
        // simply invalidates the Flash object in the cache all the time to
        // keep it loading fresh. -- Brad Neuberg
        var url = this.STORAGE_SWF + "?cachebust=" + new Date().getTime();
        
        var flash = jpf.flash.buildContent(
            "src",              url,
            "width",            "215",
            "height",           "138",
            "align",            "middle",
            "id",               this.name,
            "quality",          "high",
            "bgcolor",          "#ffffff",
            "allowFullScreen",  "true", 
            "name",             this.name,
            "flashvars",        "playerID=" + this.id,
            "allowScriptAccess","always",
            "type",             "application/x-shockwave-flash",
            "pluginspage",      "http://www.adobe.com/go/getflashplayer",
            "menu",             "true");
        
        this.content = "<div id='" + this.name + "_Container' class='jpfVideo'\
            style='width:" + this.width + "px;height:" + this.height + "px;'>"
            + flash + "</div>";
        
        this.player = jpf.flash.getElement(this.name);
        
        // get available namespaces
        this._allNamespaces = this.getNamespaces();
        
        this.initialized = this._flashReady = this._pageReady = true;

        // indicate that this storage provider is now loaded
        jpf.storage.manager.loaded();
    },
    
    /**
     * All public methods use this proxy to make sure that methods called before
     * initialization are properly called after the player is ready.
     * Supply three arguments maximum, because function.apply does not work on 
     * the flash object.
     * 
     * @param {String} param1
     * @param {String} param2
     * @param {String} param3
     * @type {Object}
     */  
    callMethod: function(param1, param2, param3, param4, param5) {
        if (this.initialized) {
            this.player.callMethod(jpf.flash.encode(param1),
              jpf.flash.encode(param2),
              jpf.flash.encode(param3),
              jpf.flash.encode(param4),
              jpf.flash.encode(param5)); // function.apply does not work on the flash object
        } else
            this.delayCalls.push(arguments);
        return this;
    },
    
    /**
     * Call methods that were made before the player was initialized.
     * 
     * @type {Object}
     */
    makeDelayCalls: function() {
        for (var i = 0; i < this.delayCalls.length; i++)
            this.callMethod.apply(this, this.delayCalls[i]);
        return this;
    },
    
    events: function(sEventName, oData) {
        jpf.status('Event called: ' + sEventName);
    },
    
    //    Set a new value for the flush delay timer.
    //    Possible values:
    //      0 : Perform the flush synchronously after each "put" request
    //    > 0 : Wait until 'newDelay' ms have passed without any "put" request to flush
    //     -1 : Do not  automatically flush
    setFlushDelay: function(newDelay){
        if (newDelay === null || typeof newDelay === "undefined" || isNaN(newDelay))
            throw new Error("Invalid argunment: " + newDelay);
        
        this.callMethod('setFlushDelay', String(newDelay));
    },
    
    getFlushDelay: function(){
        return Number(dojox.flash.comm.getFlushDelay());
    },
    
    flush: function(namespace){
        //FIXME: is this test necessary?  Just use !namespace
        if(namespace == null || typeof namespace == "undefined"){
            namespace = jpf.storage.DEFAULT_NAMESPACE;        
        }
        this.callMethod('flush', namespace);
    },

    /**
     * @todo replace this with mikes flash detection code
     */
    isAvailable: function(){
        return jpf.flash_helper.isEightAvailable();
    },

    put: function(key, value, namespace){
        //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Setting name/value pair", "Invalid key given: " + key));
        //#endif
        
        if (!namespace)
            namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Setting name/value pair", "Invalid namespace given: " + namespace));
        //#endif
            
        this.callMethod('put', key, dojo.serialize(value), namespace);
    },

    putMultiple: function(keys, values, namespace){
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false 
                || ! values instanceof Array 
                || keys.length != values.length){
            throw new Error(0, jpf.formatErrorString(0, null, "Setting multiple name/value pairs", "Invalid arguments: keys = [" + keys + "], values = [" + values + "]"));
        }
        //#endif
        
        if(!namespace)
            namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Setting multiple name/value pairs", "Invalid namespace given: " + namespace));
        //#endif
        
        //    Convert the arguments on strings we can pass along to Flash
        var metaKey = keys.join(",");
        var lengths = [];
        for (var i = 0; i < values.length; i++) {
            values[i]  = jpf.unserialize(values[i]);
            lengths[i] = values[i].length; 
        }
        var metaValue   = values.join("");
        var metaLengths = lengths.join(",");
        this.callMethod('putMultiple', metaKey, metaValue, metaLengths, this.namespace);
    },

    get: function(key, namespace){
       //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid key given: " + key));
        //#endif
        
        if (!namespace)
            namespace = this.DEFAULT_NAMESPACE;
        
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid namespace given: " + namespace));
        //#endif
        
        var results = this.callMethod('get', namespace);

        if (results == "")
            return null;
    
        return jpf.unserialize(results);
    },

    getMultiple: function(/*array*/ keys, /*string?*/ namespace){ /*Object*/
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid key array given: " + keys));
        //#endif
        
        if (!namespace)
            namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting multiple name/value pairs", "Invalid namespace given: " + namespace));
        //#endif
        
        var metaKey     = keys.join(",");
        var metaResults = this.callMethod('getMultiple', metaKey, this.namespace);
        var results     = eval("(" + metaResults + ")");
        
        //    destringify each entry back into a real JS object
        //FIXME: use dojo.map
        for (var i = 0; i < results.length; i++)
            results[i] = (results[i] == "") ? null : jpf.unserialize(results[i]);
        
        return results;        
    },

    _destringify: function(results){
        // destringify the content back into a 
        // real JavaScript object;
        // handle strings differently so they have better performance
        if (dojo.isString(results) && (/^string:/.test(results)))
            results = results.substring("string:".length);
        else
            results = dojo.fromJson(results);
    
        return results;
    },
    
    getKeys: function(namespace){
       if (!namespace)
            namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Clearing storage", "Invalid namespace given: " + namespace));
        //#endif
        
        var results = this.callMethod('getKeys', namespace);
        
        // Flash incorrectly returns an empty string as "null"
        if (results == null || results == "null")
          results = "";
        
        results = results.split(",");
        results.sort();
        
        return results;
    },
    
    getNamespaces: function(){
        var results = dojox.flash.comm.getNamespaces();
        
        // Flash incorrectly returns an empty string as "null"
        if (results == null || results == "null")
            results = jpf.storage.DEFAULT_NAMESPACE;
        
        results = results.split(",");
        results.sort();
        
        return results;
    },

    clear: function(namespace){
        if (!namespace)
            namespace = this.DEFAULT_NAMESPACE;
        
        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Clearing storage", "Invalid namespace given: " + namespace));
        //#endif
        
        this.callMethod('clear', namespace);
    },
    
    remove: function(key, namespace){
        if (!namespace)
            namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Removing key", "Invalid namespace given: " + namespace));
        //#endif
        
        this.callMethod('remove', key, namespace);
    },
    
    removeMultiple: function(/*array*/ keys, /*string?*/ namespace){ /*Object*/
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid key array given: " + keys));
        //#endif
        
        if (!namespace)
            namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting multiple name/value pairs", "Invalid namespace given: " + namespace));
        //#endif
        
        var metaKey = keys.join(",");
        this.callMethod('removeMultiple', metaKey, this.namespace);
    },

    isPermanent: function(){
        return true;
    },

    getMaximumSize: function(){
        return jpf.storage.SIZE_NO_LIMIT;
    },

    hasSettingsUI: function(){
        return true;
    },

    showSettingsUI: function(){
        this.callMethod('showSettings');
        //dojox.flash.obj.setVisible(true);
        //dojox.flash.obj.center();
    },

    hideSettingsUI: function(){
        // hide the dialog
        //dojox.flash.obj.setVisible(false);
        
        // call anyone who wants to know the dialog is
        // now hidden
        if (dojo.isFunction(jpf.storage.onHideSettingsUI)){
            jpf.storage.onHideSettingsUI.call(null);    
        }
    },
    
    getResourceList: function(){ /* Array[] */
        // Dojo Offline no longer uses the FlashStorageProvider for offline
        // storage; Gears is now required
        return [];
    },
    
    //    Called if the storage system needs to tell us about the status
    //    of a put() request. 
    _onStatus: function(statusResult, key, namespace){
      //console.debug("onStatus, statusResult="+statusResult+", key="+key);
        var ds = jpf.storage;
        var dfo = dojox.flash.obj;
        
        if (statusResult == ds.PENDING){
            dfo.center();
            dfo.setVisible(true);
        }
        else
            dfo.setVisible(false);
        
        if (ds._statusHandler)
            ds._statusHandler.call(null, statusResult, key, namespace);        
    }
};