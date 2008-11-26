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

jpf.namespace("storage.modules.flash", {
    initialized   : false,
    asyncInit     : true,

    _available    : null,
    _statusHandler: null,
    _flashReady   : false,
    _pageReady    : false,

    delayCalls    : [],

    init: function(){
        this.name = "flashStorage";
        this.id   = jpf.flash.addPlayer(this);

        // IE/Flash has an evil bug that shows up some time: if we load the
        // Flash and it isn't in the cache, ExternalInterface works fine --
        // however, the second time when its loaded from the cache a timing
        // bug can keep ExternalInterface from working. The trick below
        // simply invalidates the Flash object in the cache all the time to
        // keep it loading fresh. -- Brad Neuberg
        // #ifndef __PACKAGED
        this.STORAGE_SWF = jpf.basePath
        + "core/lib/storage/resources/jpfStorage.swf?cachebust="
        + new Date().getTime();
        /* #else
        this.STORAGE_SWF = jpf.basePath
            + "resources/jpfStorage.swf?cachebust="
            + new Date().getTime();
        #endif */
        /* #ifdef __WITH_CDN
        this.STORAGE_SWF = jpf.CDN + jpf.VERSION
            + "/resources/jpfStorage.swf?cachebust="
            + new Date().getTime();
        #endif */

        var flash = jpf.flash.buildContent(
            "src",              this.STORAGE_SWF,
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

        this.container = document.createElement('div');
        this.container.id           =  this.name + "_Container";
        this.container.className    = "jpfVideo";
        with (this.container.style) {
            width = height = "0px";
            overflow = "hidden";
        }
        document.body.appendChild(this.container);
        this.container.innerHTML    = flash;

        //this.container = document.getElementById(this.name + "_Container");
        this.player    = jpf.flash.getElement(this.name);

        // get available namespaces
        this._allNamespaces = this.getNamespaces();

        this._flashReady = this._pageReady = true;
    },

    /**
     * Sets the visibility of this Flash object.
     *
     * @param {Boolean} visible
     */
    setVisible: function(visible){
        if (visible == true) {
            this.container.style.position   = "absolute"; // IE -- Brad Neuberg
            this.container.style.visibility = "visible";
        }
        else {
            with (this.container.style) {
                position = "absolute";
                x = "-1000px";
                y = "-1000px";
                visibility = "hidden";
            }
        }
        return this;
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
        if (this.initialized && typeof this.player.callMethod == "function") {
            return this.player.callMethod(
                jpf.flash.encode(param1),
                jpf.flash.encode(param2),
                jpf.flash.encode(param3),
                jpf.flash.encode(param4),
                jpf.flash.encode(param5)
            ); // function.apply does not work on the flash object
        }
        else
            this.delayCalls.push(arguments);
    },

    /**
     * Call methods that were made before the player was initialized.
     *
     * @type {Object}
     */
    delayedCallTimer: null,
    makeDelayCalls  : function() {
        clearTimeout(this.delayedCallTimer);

        if (!this.delayCalls.length) {
            if (typeof this['onready'] == "function")
                this.onready();
            return this;
        }

        this.callMethod.apply(this, this.delayCalls[0]);
        this.delayCalls.splice(0, 1);

        //run timeout, we're interfacing with Flash here :S
        var _self = this;
        this.delayedCallTimer = window.setTimeout(function() {
            _self.makeDelayCalls();
        }, 1);

        return this;
    },

    ready : function(callback){
        if (this.initialized)
            callback();
        else
            this.onready = callback;
    },

    event: function(sEventName, oData) {
        //jpf.console.info('Event called: ' + sEventName + ', ' + oData);
        if (sEventName == "status") {
            // Called if the storage system needs to tell us about the status
            // of a put() request.
            var ds  = jpf.storage;

            if (statusResult == ds.PENDING) {
                //dfo.center();
                this.setVisible(true);
            }
            else
                this.setVisible(false);

            if (ds._statusHandler)
                ds._statusHandler.call(null, oData.status, oData.keyName, oData.namespace);
        }
        else if (sEventName == "loaded") {
            this.initialized = true;
            this.setVisible(false).makeDelayCalls();
        }
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
        return Number(this.callMethod('getFlushDelay'));
    },

    flush: function(namespace){
        //@fixme: is this test necessary?  Just use !namespace
        if (namespace == null || typeof namespace == "undefined") {
            namespace = jpf.storage.namespace;
        }
        this.callMethod('flush', namespace);
    },

    /**
     * @todo replace this with mikes flash detection code
     */
    isAvailable: function(){
        return location.protocol != "file:" && jpf.flash.isEightAvailable();
    },

    put: function(key, value, namespace){
        //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(jpf.formatErrorString(0, null,
                "Setting name/value pair", "Invalid key given: " + key));
        //#endif

        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null,
                "Setting name/value pair", "Invalid namespace given: " + namespace));
        //#endif

        this.callMethod('put', key, jpf.serialize(value), namespace);
    },

    putMultiple: function(keys, values, namespace){
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false
                || ! values instanceof Array
                || keys.length != values.length){
            throw new Error(jpf.formatErrorString(0, null,
                "Setting multiple name/value pairs", "Invalid arguments: keys = ["
                + keys + "], values = [" + values + "]"));
        }
        //#endif

        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, "Setting multiple name/value pairs", "Invalid namespace given: " + namespace));
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
        this.callMethod('putMultiple', metaKey, metaValue, metaLengths, namespace);
    },

    get: function(key, namespace){
       //#ifdef __DEBUG
        if (this.isValidKey(key) == false)
            throw new Error(jpf.formatErrorString(0, null, "Getting name/value pair", "Invalid key given: " + key));
        //#endif

        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null,
                "Getting name/value pair", "Invalid namespace given: " + namespace));
        //#endif

        var results = this.callMethod('get', key, namespace);
        if (results == "")
            return null;

        return jpf.unserialize(jpf.flash.decode(results));
    },

    getMultiple: function(keys, namespace){
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(jpf.formatErrorString(0, null,
                "Getting name/value pair", "Invalid key array given: " + keys));
        //#endif

        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null,
                "Getting multiple name/value pairs", "Invalid namespace given: "
                + namespace));
        //#endif

        var metaKey     = keys.join(",");
        var metaResults = this.callMethod('getMultiple', metaKey, namespace);
        var results     = eval("(" + metaResults + ")");

        // destringify each entry back into a real JS object
        for (var i = 0; i < results.length; i++)
            results[i] = (results[i] == "") ? null : jpf.unserialize(jpf.flash.decode(results[i]));

        return results;
    },

    _destringify: function(results){
        // destringify the content back into a
        // real JavaScript object;
        // handle strings differently so they have better performance
        if (typeof results == "string" && (/^string:/.test(results)))
            results = results.substring("string:".length);
        else
            results = eval(results);

        return results;
    },

    getKeys: function(namespace){
       if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, "Clearing storage",
                "Invalid namespace given: " + namespace));
        //#endif

        var results = this.callMethod('getKeys', namespace);

        // Flash incorrectly returns an empty string as "null"
        if (results == this || results == null || results == "null")
          results = "";

        results = results.split(",");
        results.sort();

        return results;
    },

    getNamespaces: function(){
        var results = this.callMethod('getNamespaces');

        // Flash incorrectly returns an empty string as "null"
        if (results == this || results == null || results == "null")
            results = jpf.storage.namespace || "default";

        results = results.split(",");
        results.sort();

        return results;
    },

    clear: function(namespace){
        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, "Clearing storage",
                "Invalid namespace given: " + namespace));
        //#endif

        this.callMethod('clear', namespace);
    },

    remove: function(key, namespace){
        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null, "Removing key",
                "Invalid namespace given: " + namespace));
        //#endif

        this.callMethod('remove', key, namespace);
    },

    removeMultiple: function(/*array*/ keys, /*string?*/ namespace){ /*Object*/
        //#ifdef __DEBUG
        if (this.isValidKeyArray(keys) === false)
            throw new Error(jpf.formatErrorString(0, null,
                "Getting name/value pair", "Invalid key array given: " + keys));
        //#endif

        if (!namespace)
            namespace = this.namespace;

        //#ifdef __DEBUG
        if (this.isValidKey(namespace) == false)
            throw new Error(jpf.formatErrorString(0, null,
                "Getting multiple name/value pairs", "Invalid namespace given: "
                + namespace));
        //#endif

        var metaKey = keys.join(",");
        this.callMethod('removeMultiple', metaKey, namespace);
    },

    isPermanent: function(){
        return true;
    },

    getMaximumSize: function(){
        return this.SIZE_NO_LIMIT;
    },

    hasSettingsUI: function(){
        return false;
    },

    showSettingsUI: function(){
        throw new Error(jpf.formatErrorString(0, null, this.declaredClass
            + " does not support a storage settings user-interface"));
    },

    hideSettingsUI: function(){
        throw new Error(jpf.formatErrorString(0, null, this.declaredClass
            + " does not support a storage settings user-interface"));
    },

    getResourceList: function(){ /* Array[] */
        // @todo: implement offline support icw Flash storage
        return [];
    }
});
// #endif
