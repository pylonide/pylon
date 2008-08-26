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
    initialized: false,
    
    _available: null,
    _statusHandler: null,
    _flashReady: false,
    _pageReady: false,
    
    /**
     * @todo replace this with mikes flash code
     */
    init: function(){
        // initialize our Flash
        dojox.flash.addLoadedListener(dojo.hitch(this, function(){
          //console.debug("flashReady");
          // indicate our Flash subsystem is now loaded
          this._flashReady = true;
          if(this._flashReady && this._pageReady){
              this._loaded();
          }
        }));
        var swfLoc = dojo.moduleUrl("dojox", "storage/Storage.swf").toString();
        dojox.flash.setSwf(swfLoc, false);
        
        // wait till page is finished loading
        dojo.connect(dojo, "loaded", this, function(){
          //console.debug("pageReady");
          this._pageReady = true;
          if(this._flashReady && this._pageReady){
            this._loaded();
          }
        });
    },
    
    //    Set a new value for the flush delay timer.
    //    Possible values:
    //      0 : Perform the flush synchronously after each "put" request
    //    > 0 : Wait until 'newDelay' ms have passed without any "put" request to flush
    //     -1 : Do not  automatically flush
    setFlushDelay: function(newDelay){
        if(newDelay === null || typeof newDelay === "undefined" || isNaN(newDelay)){
            throw new Error("Invalid argunment: " + newDelay);
        }
        
        dojox.flash.comm.setFlushDelay(String(newDelay));
    },
    
    getFlushDelay: function(){
        return Number(dojox.flash.comm.getFlushDelay());
    },
    
    flush: function(namespace){
        //FIXME: is this test necessary?  Just use !namespace
        if(namespace == null || typeof namespace == "undefined"){
            namespace = jpf.storage.DEFAULT_NAMESPACE;        
        }
        dojox.flash.comm.flush(namespace);
    },

    /**
     * @todo replace this with mikes flash detection code
     */
    isAvailable: function(){
        return jpf.flash_helper.isEightAvailable();
    },

    put: function(key, value, namespace){
        //#ifdef __DEBUG
        if(this.isValidKey(key) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Setting name/value pair", "Invalid key given: " + key));
        //#endif
        
        if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Setting name/value pair", "Invalid namespace given: " + namespace));
        //#endif
            
        dojox.flash.comm.put(key, dojo.serialize(value), namespace);
    },

    putMultiple: function(keys, values, namespace){
        //#ifdef __DEBUG
		if(this.isValidKeyArray(keys) === false 
				|| ! values instanceof Array 
				|| keys.length != values.length){
			throw new Error(0, jpf.formatErrorString(0, null, "Setting multiple name/value pairs", "Invalid arguments: keys = [" + keys + "], values = [" + values + "]"));
		}
		//#endif
		
		if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Setting multiple name/value pairs", "Invalid namespace given: " + namespace));
        //#endif
        
        //    Convert the arguments on strings we can pass along to Flash
        var metaKey = keys.join(",");
        var lengths = [];
        for(var i=0;i<values.length;i++){
            values[i] = jpf.unserialize(values[i]);
            lengths[i] = values[i].length; 
        }
        var metaValue = values.join("");
        var metaLengths = lengths.join(",");
        
        dojox.flash.comm.putMultiple(metaKey, metaValue, metaLengths, this.namespace);
    },

    get: function(key, namespace){
       //#ifdef __DEBUG
        if(this.isValidKey(key) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid key given: " + key));
        //#endif
		
		if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;
		
		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid namespace given: " + namespace));
        //#endif
        
        var results = dojox.flash.comm.get(key, namespace);

        if(results == "")
            return null;
    
        return jpf.unserialize(results);
    },

    getMultiple: function(/*array*/ keys, /*string?*/ namespace){ /*Object*/
        //#ifdef __DEBUG
        if(this.isValidKeyArray(keys) === false){
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid key array given: " + keys));
        //#endif
		
		if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting multiple name/value pairs", "Invalid namespace given: " + namespace));
        //#endif
        
        var metaKey = keys.join(",");
        var metaResults = dojox.flash.comm.getMultiple(metaKey, this.namespace);
        var results = eval("(" + metaResults + ")");
        
        //    destringify each entry back into a real JS object
        //FIXME: use dojo.map
        for(var i = 0; i < results.length; i++){
            results[i] = (results[i] == "") ? null : jpf.unserialize(results[i]);
        }
        
        return results;        
    },

    _destringify: function(results){
        // destringify the content back into a 
        // real JavaScript object;
        // handle strings differently so they have better performance
        if(dojo.isString(results) && (/^string:/.test(results))){
            results = results.substring("string:".length);
        }else{
            results = dojo.fromJson(results);
        }
    
        return results;
    },
    
    getKeys: function(namespace){
       if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Clearing storage", "Invalid namespace given: " + namespace));
        //#endif
        
        var results = dojox.flash.comm.getKeys(namespace);
        
        // Flash incorrectly returns an empty string as "null"
        if(results == null || results == "null")
          results = "";
        
        results = results.split(",");
        results.sort();
        
        return results;
    },
    
    getNamespaces: function(){
        var results = dojox.flash.comm.getNamespaces();
        
        // Flash incorrectly returns an empty string as "null"
        if(results == null || results == "null"){
          results = jpf.storage.DEFAULT_NAMESPACE;
        }
        
        results = results.split(",");
        results.sort();
        
        return results;
    },

    clear: function(namespace){
        if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;
	    
        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Clearing storage", "Invalid namespace given: " + namespace));
        //#endif
        
        dojox.flash.comm.clear(namespace);
    },
    
    remove: function(key, namespace){
        if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

        //#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Removing key", "Invalid namespace given: " + namespace));
        //#endif
        
        dojox.flash.comm.remove(key, namespace);
    },
    
    removeMultiple: function(/*array*/ keys, /*string?*/ namespace){ /*Object*/
        //#ifdef __DEBUG
        if(this.isValidKeyArray(keys) === false){
            throw new Error(0, jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid key array given: " + keys));
        //#endif
		
		if(!namespace)
		    namespace = this.DEFAULT_NAMESPACE;

		//#ifdef __DEBUG
        if(this.isValidKey(namespace) == false)
            throw new Error(0, jpf.formatErrorString(0, null, "Getting multiple name/value pairs", "Invalid namespace given: " + namespace));
        //#endif
        
        var metaKey = keys.join(",");
        dojox.flash.comm.removeMultiple(metaKey, this.namespace);
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
        dojox.flash.comm.showSettings();
        dojox.flash.obj.setVisible(true);
        dojox.flash.obj.center();
    },

    hideSettingsUI: function(){
        // hide the dialog
        dojox.flash.obj.setVisible(false);
        
        // call anyone who wants to know the dialog is
        // now hidden
        if(dojo.isFunction(jpf.storage.onHideSettingsUI)){
            jpf.storage.onHideSettingsUI.call(null);    
        }
    },
    
    getResourceList: function(){ /* Array[] */
        // Dojo Offline no longer uses the FlashStorageProvider for offline
        // storage; Gears is now required
        return [];
    },
    
    /** Called when Flash and the page are finished loading. */
    _loaded: function(){
        // get available namespaces
        this._allNamespaces = this.getNamespaces();
        
        this.initialized = true;

        // indicate that this storage provider is now loaded
        jpf.storage.manager.loaded();
    },
    
    //    Called if the storage system needs to tell us about the status
    //    of a put() request. 
    _onStatus: function(statusResult, key, namespace){
      //console.debug("onStatus, statusResult="+statusResult+", key="+key);
        var ds = jpf.storage;
        var dfo = dojox.flash.obj;
        
        if(statusResult == ds.PENDING){
            dfo.center();
            dfo.setVisible(true);
        }
        else{
            dfo.setVisible(false);
        }
        
        if(ds._statusHandler)
            ds._statusHandler.call(null, statusResult, key, namespace);        
    }
};