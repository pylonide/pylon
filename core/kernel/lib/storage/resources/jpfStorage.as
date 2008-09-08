﻿import flash.external.ExternalInterface;class jpfStorage{	public static var SUCCESS = "success";	public static var FAILED = "failed";	public static var PENDING = "pending";		//	Wait the following number of milliseconds before flushing	public static var FLUSH_DELAY_DEFAULT = 500;		public var flush_delay;	public var so;	public var timer;		private var _NAMESPACE_KEY = "allNamespaces";    private var playerID:String;	private var playerPath:String;		public function jpfStorage(){		flush_delay = jpfStorage.FLUSH_DELAY_DEFAULT;        playerID    = _root.playerID;		playerPath  = (_root.playerPath == undefined) ? "" : _root.playerPath;	        ExternalInterface.addCallback("callMethod", this, function(){            var params = [];            if (arguments && arguments.length){                for (var i = 0; i < arguments.length; i++) {                    params[i] = this.decodeData(arguments[i]);                }            }                        var results = this.callMethod.apply(this, params);            results     = this.encodeData(results);                        return results;        });				// preload the System Settings finished button movie for offline		// access so it is in the cache		_root.createEmptyMovieClip("_settingsBackground", 1);		//_root._settingsBackground.loadMovie(playerPath + "storage_dialog.swf");		this.sendEvent('loaded', null);	}        private function sendEvent(event:String, object:Object):Object {		return ExternalInterface.call('jpf.flash.callMethod', this.playerID || 1, 'event', event, object);	}        public function callJS(method:String, data:Object):Object {		return ExternalInterface.call('jpf.flash.callMethod', this.playerID || 1, method, data);	}        public function callMethod(sName:String, arg1:Object, arg2:Object, arg3:Object, arg4:Object):Object {		sendEvent('system', sName + " - " + arg1);		if (typeof this[sName] == "function")			return this[sName](arg1, arg2, arg3, arg4);		return null;	}        /**        Utility trace implementation that prints out to console.debug.    */    public function trace(msg:String):Void {        this.callJS("console.debug", "FLASH: " + msg);    }        private function decodeData(sData:String):String {        if (!sData || typeof sData != "string")            return sData;                // we have to use custom encodings for certain characters when passing        // them over; for example, passing a backslash over as //// from JavaScript        // to Flash doesn't work        sData = this.replaceStr(sData, "&custom_backslash;", "\\");                sData = this.replaceStr(sData, "\\\'", "\'");        sData = this.replaceStr(sData, "\\\"", "\"");                return sData;    }        private function encodeData(sData:String):String {        if (!sData || typeof sData != "string")            return sData;                // certain XMLish characters break Flash's wire serialization for        // ExternalInterface; encode these into a custom encoding, rather than        // the standard entity encoding, because otherwise we won't be able to        // differentiate between our own encoding and any entity characters        // that are being used in the string itself        sData = this.replaceStr(sData, '<', '&custom_lt;');        sData = this.replaceStr(sData, '>', '&custom_gt;');                // needed for IE        sData = this.replaceStr(sData, '\\', '&custom_backslash;');                // encode control characters and JavaScript delimiters        sData = this.replaceStr(sData, "\n", "\\n");        sData = this.replaceStr(sData, "\r", "\\r");        sData = this.replaceStr(sData, "\f", "\\f");        sData = this.replaceStr(sData, "'", "\\'");        sData = this.replaceStr(sData, '"', '\"');                return sData;    }        /**      * Flash ActionScript has no String.replace method or support for     * Regular Expressions! We roll our own very simple one.     */    public function replaceStr(inputStr:String, replaceThis:String, withThis:String):String {        var splitStr = inputStr.split(replaceThis);        if (!splitStr)            return inputStr;                inputStr = splitStr.join(withThis);        return inputStr;    }	  //  FIXME: Whoever added this Flush code did not document why it  //  exists. Please also put your name and a bug number so I know   //  who to contact. -- Brad Neuberg		//	Set a new value for the flush delay timer.	//	Possible values:	//	  0 : Perform the flush synchronously after each "put" request	//	> 0 : Wait until 'newDelay' ms have passed without any "put" request to flush	//	 -1 : Do not automatically flush	public function setFlushDelay(newDelay:String):Void {		this.flush_delay = Number(newDelay);	}		public function getFlushDelay():String {		return String(this.flush_delay);	}		public function flush(ns:String):Void {		if (this.timer) {			_global.clearTimeout(this.timer);			delete this.timer;		}			var so = SharedObject.getLocal(ns);		var flushResults = so.flush();		// return results of this command to JavaScript		var statusResults;		if (flushResults == true)			statusResults = jpfStorage.SUCCESS;		else if (flushResults == "pending")			statusResults = jpfStorage.PENDING;		else			statusResults = jpfStorage.FAILED;				this.sendEvent("status", {            result   : statusResults,            keyName  : null,            namespace: ns        });	}	public function put(keyName:String, keyValue:String, ns:String):Void {		// Get the SharedObject for these values and save it		so = SharedObject.getLocal(ns);				//  Save the key and value		so.data[keyName] = keyValue;				// Save the namespace		// FIXME: Tie this into the flush/no-flush stuff below; right now		// we immediately write out this namespace. -- Brad Neuberg    	this.addNamespace(ns, keyName);		//	Do all the flush/no-flush stuff		var keyNames = new Array(); 		keyNames[0] = keyName;		this.postWrite(so, keyNames, ns);	}	    /**     * FIXME: Whoever added this code did not document what the	 *  put/get multiple functionality is and why it exists. Please	 *  also put your name and a bug number so I know who to contact.	 *  -- Brad Neuberg	 *      * @param {Object} metaKey     * @param {Object} metaValue     * @param {Object} metaLengths     * @param {Object} namespace     */	public function putMultiple(metaKey:String, metaValue:String, metaLengths:String, ns:String):Void {		// Get the SharedObject for these values and save it		so = SharedObject.getLocal(ns);				//	Create array of keys and value lengths		var keys    = metaKey.split(",");		var lengths = metaLengths.split(",");				//	Loop through the array and write the values		for (var i = 0; i < keys.length; i++) {			so.data[keys[i]] = metaValue.slice(0,lengths[i]);			metaValue        = metaValue.slice(lengths[i]);		}				//	Do all the flush/no-flush stuff		this.postWrite(so, keys, ns);	}	public function postWrite(so:Object, keyNames:Array, ns:String):Void {		//	TODO: Review all this 'handler' stuff. In particular, the flush 		//  could now be with keys pending from several different requests, not 		//  only the ones passed in this method call		// prepare a storage status handler		var _self = this;		so.onStatus = function(infoObject:Object){			//trace("onStatus, infoObject="+infoObject.code);						// delete the data value if the request was denied			if (infoObject.code == "SharedObject.Flush.Failed"){				for (var i = 0; i < keyNames.length; i++)					delete _self.so.data[keyNames[i]];			}						var statusResults;			if (infoObject.code == "SharedObject.Flush.Failed")				statusResults = jpfStorage.FAILED;			else if (infoObject.code == "SharedObject.Flush.Pending")				statusResults = jpfStorage.PENDING;			else if (infoObject.code == "SharedObject.Flush.Success") {				// if we have succeeded saving our value, see if we				// need to update our list of namespaces				if (_self.hasNamespace(ns) == true)					statusResults = jpfStorage.SUCCESS;				else {					// we have a new namespace we must store					_self.addNamespace(ns, keyNames[0]);					return;				}			}			//trace("onStatus, statusResults="+statusResults);						// give the status results to JavaScript			_self.sendEvent("status", {                result   : statusResults,                keyName  : keyNames[0],                namespace: ns            });		}				//	Clear any pending flush timers		if (this.timer)			_global.clearTimeout(this.timer);				//	If we have a flush delay set, set a timer for its execution		if (this.flush_delay > 0)			this.timer = _global.setTimeout(this.flush, this.flush_delay, ns);		//	With a flush_delay value of 0, execute the flush request synchronously		else if (this.flush_delay == 0)			this.flush(ns);		//	Otherwise just don't flush - will be probably be flushed manually	}	public function get(keyName:String, ns:String):Object {		// Get the SharedObject for these values and save it		so = SharedObject.getLocal(ns);		var results = so.data[keyName];				return results;	}		//	Returns an array with the contents of each key value on the metaKeys array	public function getMultiple(metaKeys:String, ns:String):String {		//	get the storage object		so = SharedObject.getLocal(ns);				//	Create array of keys to read		var keys    = metaKeys.split(",");		var results = new Array();				//	Read from storage into results array		for (var i = 0; i < keys.length; i++) {			var val = so.data[keys[i]];			val = val.split("\\").join("\\\\");			val = val.split('"').join('\\"');			results.push(val);		}					//	Make the results array into a string		var metaResults = '["' + results.join('","') + '"]';				return metaResults;	}			public function showSettings():Void {		// Show the configuration options for the Flash player, opened to the		// section for local storage controls (pane 1)		System.showSettings(1);				// there is no way we can intercept when the Close button is pressed, allowing us		// to hide the Flash dialog. Instead, we need to load a movie in the		// background that we can show a close button on.		_root.createEmptyMovieClip("_settingsBackground", 1);		//_root._settingsBackground.loadMovie(playerPath + "storage_dialog.swf");	}		public function clear(ns:String):Void {		so = SharedObject.getLocal(ns);		so.clear();		so.flush();				// remove this namespace entry now		this.removeNamespace(ns);	}		public function getKeys(ns:String):String {		// Returns a list of the available keys in this namespace				// get the storage object		so = SharedObject.getLocal(ns);		// get all of the keys		var results = [];		for (var i in so.data)			results.push(i);				// remove our key that records our list of namespaces		for (var i = 0; i < results.length; i++) {			if (results[i] == _NAMESPACE_KEY) {				results.splice(i, 1);				break;			}		}				// a bug in ExternalInterface transforms Arrays into		// Strings, so we can't use those here! -- BradNeuberg		results = results.join(",");				return results;	}		public function getNamespaces():String {		var allNamespaces = SharedObject.getLocal(_NAMESPACE_KEY);		var results = [];				for (var i in allNamespaces.data)			results.push(i);				// a bug in ExternalInterface transforms Arrays into		// Strings, so we can use those here! -- BradNeuberg		results = results.join(",");				return results;	}		public function remove(keyName:String, ns:String):Void {		// Removes a key		// get the storage object		so = SharedObject.getLocal(ns);				// delete this value		delete so.data[keyName];				// save the changes		so.flush();				// see if we are the last entry for this namespace		var availableKeys = this.getKeys(ns);		if (availableKeys == "") // we are empty			this.removeNamespace(ns);	}		//	Removes all the values for each keys on the metaKeys array	public function removeMultiple(metaKeys:String, ns:String):Void {		//	get the storage object		so = SharedObject.getLocal(ns);				//	Create array of keys to read		var keys    = metaKeys.split(",");		var results = new Array();		//	Delete elements		for (var i = 0; i < keys.length; i++)			delete so.data[keys[i]];		// see if there are no more entries for this namespace		var availableKeys = this.getKeys(ns);		if (availableKeys == "") // we are empty			this.removeNamespace(ns);	}		private function hasNamespace(ns:String):Boolean {		// Get the SharedObject for the namespace list		var allNamespaces = SharedObject.getLocal(_NAMESPACE_KEY);				var results = false;		for (var i in allNamespaces.data) {			if (i == ns) {				results = true;				break;			}		}				return results;	}		// FIXME: This code has gotten ugly -- refactor	private function addNamespace(ns:String, keyName:String):Void {		if (hasNamespace(ns) == true)			return;				// Get the SharedObject for the namespace list		var allNamespaces = SharedObject.getLocal(_NAMESPACE_KEY);				// prepare a storage status handler if the keyName is		// not null		if (keyName != null && typeof keyName != "undefined") {			var _self = this;			allNamespaces.onStatus = function(infoObject:Object) {				// delete the data value if the request was denied				if (infoObject.code == "SharedObject.Flush.Failed")					delete _self.so.data[keyName];								var statusResults;				if (infoObject.code == "SharedObject.Flush.Failed")					statusResults = jpfStorage.FAILED;				else if (infoObject.code == "SharedObject.Flush.Pending")					statusResults = jpfStorage.PENDING;				else if (infoObject.code == "SharedObject.Flush.Success")					statusResults = jpfStorage.SUCCESS;								// give the status results to JavaScript				_self.sendEvent("status", {                    result   : statusResults,                    keyName  : keyName,                    namespace: ns                });			}		}				// save the namespace list		allNamespaces.data[ns] = true;		var flushResults = allNamespaces.flush();				// return results of this command to JavaScript		if (keyName != null && typeof keyName != "undefined") {			var statusResults;			if (flushResults == true)				statusResults = jpfStorage.SUCCESS;			else if (flushResults == "pending")				statusResults = jpfStorage.PENDING;			else				statusResults = jpfStorage.FAILED;						this.sendEvent("status", {                result   : statusResults,                keyName  : keyName,                namespace: ns            });		}	}		// FIXME: This code has gotten ugly -- refactor	private function removeNamespace(ns:String):Void {		if (hasNamespace(ns) == false)			return;				// try to save the namespace list; don't have a return		// callback; if we fail on this, the worst that will happen		// is that we have a spurious namespace entry		var allNamespaces = SharedObject.getLocal(_NAMESPACE_KEY);		delete allNamespaces.data[ns];		allNamespaces.flush();	}	static function main(mc){		_root.app = new jpfStorage(); 	}}