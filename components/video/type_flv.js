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
//temp hack:
jpf.type_flv = {};

jpf.video.TypeFlvCompat = (function(){
    //v1.7
    // Flash Player Version Detection
    // Detect Client Browser type
    // Copyright 2005-2007 Adobe Systems Incorporated.  All rights reserved.
    function ControlVersion(){
        var version, axo, e;
        
        // NOTE : new ActiveXObject(strFoo) throws an exception if strFoo isn't in the registry
        try {
            // version will be set for 7.X or greater players
            axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
            version = axo.GetVariable("$version");
        } 
        catch (e) {}
        if (!version) {
            try {
                // version will be set for 6.X players only
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
                // installed player is some revision of 6.0
                // GetVariable("$version") crashes for versions 6.0.22 through 6.0.29,
                // so we have to be careful. 
                // default to the first public version
                version = "WIN 6,0,21,0";
                // throws if AllowScripAccess does not exist (introduced in 6.0r47)		
                axo.AllowScriptAccess = "always";
                // safe to call for 6.0r47 or greater
                version = axo.GetVariable("$version");
            } 
            catch (e) {}
        }
        
        if (!version) {
            try {
                // version will be set for 4.X or 5.X player
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
                version = axo.GetVariable("$version");
            } 
            catch (e) {}
        }
        
        if (!version) {
            try {
                // version will be set for 3.X player
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
                version = "WIN 3,0,18,0";
            } 
            catch (e) {}
        }
        
        if (!version) {
            try {
                // version will be set for 2.X player
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
                version = "WIN 2,0,0,11";
            } 
            catch (e) {
                version = -1;
            }
        }
        
        return version;
    }
    
    // JavaScript helper required to detect Flash Player PlugIn version information
    function GetSwfVer(){
        // NS/Opera version >= 3 check for Flash plugin in plugin array
        var flashVer = -1;
        var sAgent   = navigator.userAgent.toLowerCase();
        
        if (navigator.plugins != null && navigator.plugins.length > 0) {
            if (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]) {
                var swVer2   = navigator.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
                var swfDescr = navigator.plugins["Shockwave Flash" + swVer2].description;
                var aDescr   = swfDescr.split(" ");
                var aTempMaj = aDescr[2].split(".");
                var nMajor   = aTempMaj[0];
                var nMinor   = aTempMaj[1];
                var sRev     = aDescr[3];
                if (sRev == "")
                    sRev = aDescr[4];
                if (sRev[0] == "d")
                    sRev = sRev.substring(1);
                else if (sRev[0] == "r") {
                    sRev = sRev.substring(1);
                    if (sRev.indexOf("d") > 0)
                        sRev = sRev.substring(0, sRev.indexOf("d"));
                }
                var flashVer = nMajor + "." + nMinor + "." + sRev;
            }
        }
        // MSN/WebTV 2.6 supports Flash 4
        else if (sAgent.indexOf("webtv/2.6") != -1) 
            flashVer = 4;
        // WebTV 2.5 supports Flash 3
        else if (sAgent.indexOf("webtv/2.5") != -1) 
            flashVer = 3;
        // older WebTV supports Flash 2
        else if (sAgent.indexOf("webtv") != -1) 
            flashVer = 2;
        else if (jpf.isIE && !jpf.isOpera)
            flashVer = ControlVersion();

        return flashVer;
    }
    
    // When called with reqMajorVer, reqMinorVer, reqRevision returns true if that version or greater is available
    function DetectFlashVer(reqMajorVer, reqMinorVer, reqRevision){
        versionStr = GetSwfVer();
        if (versionStr == -1)
            return false;
        else if (versionStr != 0) {
            if (jpf.isIE && !jpf.isOpera) {
                // Given "WIN 2,0,0,11"
                aTemp     = versionStr.split(" "); // ["WIN", "2,0,0,11"]
                sTemp     = aTemp[1]; // "2,0,0,11"
                aVersions = sTemp.split(","); // ['2', '0', '0', '11']
            }
            else
                aVersions = versionStr.split(".");
            var nMajor = aVersions[0];
            var nMinor = aVersions[1];
            var sRev   = aVersions[2];
            
            // is the major.revision >= requested major.revision AND the minor version >= requested minor
            if (nMajor > parseFloat(reqMajorVer))
                return true;
            else if (nMajor == parseFloat(reqMajorVer)) {
                if (nMinor > parseFloat(reqMinorVer)) 
                    return true;
                else if (nMinor == parseFloat(reqMinorVer)) {
                    if (sRev >= parseFloat(reqRevision)) 
                        return true;
                }
            }
            return false;
        }
    }
    
    function AC_AddExtension(src, ext){
        if (src.indexOf('?') != -1) 
            return src.replace(/\?/, ext + '?');
        else 
            return src + ext;
    }
    
    function AC_Generateobj(objAttrs, params, embedAttrs){
        var str = '';
        if (jpf.isIE && !jpf.isOpera) {
            str += '<object ';
            for (var i in objAttrs)
                str += i + '="' + objAttrs[i] + '" ';
            str += '>';
            for (var i in params)
                str += '<param name="' + i + '" value="' + params[i] + '" /> ';
            str += '</object>';
        }
        else {
            str += '<embed ';
            for (var i in embedAttrs)
                str += i + '="' + embedAttrs[i] + '" ';
            str += '> </embed>';
        }
        
        document.write(str);
    }
    
    function AC_FL_RunContent(){
        var ret = AC_GetArgs(arguments, ".swf", "movie", 
            "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000", 
            "application/x-shockwave-flash");
        AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
    }
    
    function AC_SW_RunContent(){
        var ret = AC_GetArgs(arguments, ".dcr", "src", 
            "clsid:166B1BCA-3F9C-11CF-8075-444553540000", null);
        AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
    }
    
    function AC_GetArgs(args, ext, srcParamName, classid, mimeType){
        var ret        = {};
        ret.embedAttrs = {};
        ret.params     = {};
        ret.objAttrs   = {};
        for (var i = 0; i < args.length; i = i + 2) {
            var currArg = args[i].toLowerCase();
            
            switch (currArg) {
                case "classid":
                    break;
                case "pluginspage":
                    ret.embedAttrs[args[i]] = args[i + 1];
                    break;
                case "src":
                case "movie":
                    args[i + 1] = AC_AddExtension(args[i + 1], ext);
                    ret.embedAttrs["src"] = args[i + 1];
                    ret.params[srcParamName] = args[i + 1];
                    break;
                case "onafterupdate":
                case "onbeforeupdate":
                case "onblur":
                case "oncellchange":
                case "onclick":
                case "ondblClick":
                case "ondrag":
                case "ondragend":
                case "ondragenter":
                case "ondragleave":
                case "ondragover":
                case "ondrop":
                case "onfinish":
                case "onfocus":
                case "onhelp":
                case "onmousedown":
                case "onmouseup":
                case "onmouseover":
                case "onmousemove":
                case "onmouseout":
                case "onkeypress":
                case "onkeydown":
                case "onkeyup":
                case "onload":
                case "onlosecapture":
                case "onpropertychange":
                case "onreadystatechange":
                case "onrowsdelete":
                case "onrowenter":
                case "onrowexit":
                case "onrowsinserted":
                case "onstart":
                case "onscroll":
                case "onbeforeeditfocus":
                case "onactivate":
                case "onbeforedeactivate":
                case "ondeactivate":
                case "type":
                case "codebase":
                case "id":
                    ret.objAttrs[args[i]] = args[i + 1];
                    break;
                case "width":
                case "height":
                case "align":
                case "vspace":
                case "hspace":
                case "class":
                case "title":
                case "accesskey":
                case "name":
                case "tabindex":
                    ret.embedAttrs[args[i]] = ret.objAttrs[args[i]] = args[i + 1];
                    break;
                default:
                    ret.embedAttrs[args[i]] = ret.params[args[i]] = args[i + 1];
            }
        }
        ret.objAttrs["classid"] = classid;
        if (mimeType) 
            ret.embedAttrs["type"] = mimeType;
        return ret;
    }
    
    /* ----------------------------------------------------
     * FAVideoManager
     *
     * This manages the collection of FAVideo instances on the HTML page. It directs calls from embedded
     * FAVideo SWFs to the appropriate FAVideo instance in Javascript.
     *----------------------------------------------------- */
    var hash     = {};
    var uniqueID = 1;
    
    function addPlayer(player) {
        hash[++uniqueID] = player;
        return uniqueID;
    }
    
    function getPlayer(id) {
        return hash[id];
    }
    
    function callMethod(id, methodName) {
        var player = hash[id];
        if (player == null)
            alert("Player with id: " + id + " not found");
        if (player[methodName] == null)
            alert("Method " + methodName + " Not found");
        
        // Unable to use slice on arguments in some browsers. Iterate instead:
        var args = [];
        for (var i = 2; i < arguments.length; i++)
            args.push(arguments[i]);
        player[methodName].apply(player, args);
    }
    
    var isAvailable = null;
    function isValidAvailable() {
        if (isAvailable === null)
            isAvailable = DetectFlashVer(6, 0, 65);
        return isAvailable;
    }
    
    var isEightAvail = null;
    function isEightAvailable() {
        if (isEightAvail === null)
            isEightAvail = DetectFlashVer(8, 0, 0);
        return isEightAvail;
    }
    
    return {
        isValidAvailable: isValidAvailable,
        isEightAvailable: isEightAvailable,
        AC_GetArgs      : AC_GetArgs,
        addPlayer       : addPlayer,
        getPlayer       : getPlayer,
        callMethod      : callMethod
    };
})();

/* ----------------------------------------------------
 * FAVideo
 *
 * FAVideo represents a video player instance on the page. It allows you to instantiate, control,
 * and listen to events from a Flash video player through Javascript.
 *----------------------------------------------------- */
jpf.video.TypeFlv = function(id, node, options) {
    this.DEFAULT_SWF_PATH    = "components/video/FAVideo"; // dot swf is added by AC_RunActiveContent
    this.DEFAULT_SKIN_PATH   = "components/video/ClearOverAll.swf";
    this.DEFAULT_WIDTH       = 320;
    this.DEFAULT_HEIGHT      = 240;
    this.ERROR_DIV_NOT_FOUND = "The specified DIV element was not found.";
    
    //this.DEFAULT_SKIN_PATH = "skins/ClearExternalAll.swf";
    
    this.id = jpf.video.TypeFlvCompat.addPlayer(this); // Manager manages multiple players
    this.rendered = this.inited = false;
    
    // Div name, flash name, and container name
    this.divName      = id;
    this.htmlElement  = node;
    this.name         = "FAVideo_" + id;
    
    // Video props
    this.videoPath = options.src;
    this.width     = (options.width > 0)  ? options.width  : this.DEFAULT_WIDTH;
    this.height    = (options.height > 0) ? options.height : this.DEFAULT_HEIGHT;
    
    // Initialize player
    this.player = null;
    jpf.extend(this, jpf.video.TypeInterface);
    this.initProperties().setOptions(options).createPlayer().render();
}

jpf.video.TypeFlv.isSupported = function() {
    return jpf.video.TypeFlvCompat.isValidAvailable();
};

jpf.video.TypeFlv.prototype = {
    /* ----------------------------------------------------
     * Public API methods
     *----------------------------------------------------- */
    /**
     * Play an FLV.  Sets autoPlay to true.
     * 
     * @param videoPath Path to the FLV. If the videoPath is null, and the FLV is playing, it will act as a play/pause toggle.
     * @param totalTime Optional totalTime to override the FLV's built in totalTime
     */
    playFile: function(videoPath, totalTime) {
        this.autoPlay = true;
        if (totalTime != null)
            this.setTotalTime(totalTime);
        if (videoPath != null)
            this.videoPath = videoPath;
        if (this.videoPath == null && !this.firstLoad) { 
            this.dispatchEvent({type:"error", error:"FAVideo::play - No videoPath has been set."});
            return this;
        }
        if (videoPath == null && this.firstLoad && !this.autoLoad) // Allow play(null) to toggle playback 
            videoPath = this.videoPath;
        this.firstLoad = false;
        this.callMethod("playVideo", videoPath, totalTime);	
        return this;
    },
    
    /**
     * Load a video.  Sets autoPlay to false.
     *
     * @param videoPath Path the the FLV.
     */
    load: function(videoPath) {
        if (videoPath != null) this.videoPath = videoPath;
        if (this.videoPath == null) { 
            this.dispatchEvent({type:"error", error:"FAVideo::loadVideo - No videoPath has been set."});
            return this;
        }
        this.firstLoad = this.autoPlay = false;
        this.callMethod("loadVideo", this.videoPath);
        return this;
    },
    
    /**
     * Play and/ or resume a video that has been loaded already
     */
    play: function() {
        return this.pause(false);
    },
    
    /**
     * Toggle the pause state of the video.
     *
     * @param pauseState The pause state. Setting pause state to true will pause the video.
     */
    pause: function(pauseState) {
        if (typeof pauseState == "undefined")
            pauseState = true;
        this.callMethod("pause", pauseState);
        return this;
    },
    
    /**
     * Stop playback of the video.
     */
    stop: function() {
        this.callMethod("stop");
        return this;
    },
    
    /**
     * Seek the video to a specific position.
     *
     * @param seconds The number of seconds to seek the playhead to.
     */
    seek: function(seconds) {
        this.callMethod("seek", seconds);
        return this;
    },
    
    /**
     * Set the size of the video.
     *
     * @param width The width of the video.
     * @param height The height of the video.
     */	
    setSize: function(width, height) {
        this.width  = width;
        this.height = height;
        // Change the DOM.  Do not rerender.
        this.container.style.width  = this.width + "px";
        this.container.style.height = this.height + "px";
        this.callMethod("setSize", this.width, this.height);
        return this;
    },

    /* ----------------------------------------------------
     * Public API property access methods
     *----------------------------------------------------- */
    
    /**
     * Specifies the position of the playhead, in seconds.
     * @default null
     */
    getPlayheadTime: function() { return this.playheadTime; },
    setPlayheadTime: function(value) {
        this.setProperty("playheadTime", value);
    },
    
    /**
     * Determines the total time of the video.  The total time is automatically determined
     * by the player, unless the user overrides it.
     * @default null
     */
    getTotalTime: function() { return this.totalTime; },
    setTotalTime: function(value) {
        this.setProperty("totalTime", value);
    },
        
    /*
     * Events dispatched by FAVideo instances
     *	> init: The player is initialized
     *	> ready: The video is ready
     *	> progress: The video is downloading. Properties: bytesLoaded, bytesTotal
     *	> playHeadUpdate: The video playhead has moved.  Properties: playheadTime, totalTime
     *	> stateChange: The state of the video has changed. Properties: state
     *	> change: The player has changed.
     *	> complete: Playback is complete.
     *	> metaData: The video has returned meta-data. Properties: infoObject
     *	> cuePoint: The video has passed a cuePoint. Properties: infoObject
     *	> error: An error has occurred.  Properties: error
     */
    
    
    /* ----------------------------------------------------
     * Callbacks from flash
     *----------------------------------------------------- */
    update: function(props) {
        for (var n in props)
            this[n] = props[n]; // Set the internal property
        props.type = "change";
        this.dispatchEvent(props); // This needs to have an array of changed props.
    },

    event: function(eventName, evtObj) {
        switch (eventName) {
            case "progress":
                this.bytesLoaded = evtObj.bytesLoaded;
                this.bytesTotal  = evtObj.bytesTotal;
                this.dispatchEvent({
                    type       : "progress",
                    bytesLoaded: this.bytesLoaded,
                    bytesTotal : this.bytesTotal
                });
                break;
            case "playheadUpdate":
                this.playheadTime = evtObj.playheadTime;
                this.totalTime    = evtObj.totalTime;
                this.dispatchEvent({
                    type        : "playheadUpdate",
                    playheadTime: this.playheadTime,
                    totalTime   : this.totalTime
                });
                break;
            case "stateChange":
                this.state = evtObj.state;
                this.dispatchEvent({type:"stateChange", state:this.state});
                break;
            case "change":
                this.dispatchEvent({type:"change"});
                break;
            case "complete":
                this.dispatchEvent({type:"complete"});
                break;
            case "ready":
                this.dispatchEvent({type:"ready"});
                break;
            case "metaData":
                this.dispatchEvent({type:"metaData", infoObject:evtObj});
                break;
            case "cuePoint":
                this.dispatchEvent({type:"cuePoint", infoObject:evtObj});
                break;
            case "init":
                this.inited = true;
                // There is a bug in IE innerHTML. Tell flash what size it is.
                // This will probably not work with liquid layouts in IE.
                this.callMethod("setSize", this.width, this.height)
                 .invalidateProperty("clickToTogglePlay", "skinVisible", 
                    "skinAutoHide", "autoPlay", "autoLoad", "volume", "bufferTime", 
                    "videoScaleMode", "videoAlign", "playheadUpdateInterval", 
                    "skinPath", "previewImagePath").validateNow().makeDelayCalls();
                if (this.autoPlay)
                    this.playFile(this.videoPath);
                else if (this.autoLoad)
                    this.load(this.videoPath);
                
                this.dispatchEvent({type:"init"});
                break;
        }
    },

    /* ----------------------------------------------------
     * Initialization methods
     *----------------------------------------------------- */
    render: function() {
        var div = this.htmlElement || this.getElement(this.divName);
        if (div == null) return this;

        this.pluginError = false;
        div.innerHTML = this.content;
        
        this.player    = this.getElement(this.name);
        this.container = this.getElement(this.name + "_Container");		
        this.rendered  = true;
        
        return this;
    },
    
    setOptions: function(options) {
        if (options == null) return this;
        // Create a hash of acceptable properties
        if (typeof options['showControls'] != "undefined")
            options.skinVisible = options.showControls;
        var hash = ["volume", "skinAutoHide", "skinVisible", "autoPlay",
            "clickToTogglePlay", "autoLoad", "playHeadTime", "totalTime",
            "bufferTime", "videoScaleMode", "videoAlign", "playheadUpdateInterval",
            "skinPath", "previewImagePath"];
        for (var i = 0; i < hash.length; i++) {
            var prop = hash[i];
            if (options[prop] == null) continue;
            this.setProperty(prop, options[prop]);
        }
        
        return this;
    },
    
    // Mark out the properties, so they are initialized, and documented.
    initProperties: function() {
        this.delayCalls = [];
        
        // Properties set by flash player
        this.videoWidth = this.videoHeight = this.totalTime = this.bytesLoaded = this.bytesTotal = 0;
        this.state = null;
        
        // Internal properties that match get/set methods
        this.clickToTogglePlay = this.autoPlay = this.autoLoad = this.skinVisible = true;
        this.volume                 = 50;
        this.skinAutoHide           = false;
        this.skinPath               = this.DEFAULT_SKIN_PATH;
        this.playheadTime           = null;
        this.bufferTime             = 0.1;
        this.videoScaleMode         = "maintainAspectRatio"; // Also "noScale", "fitToWindow"
        this.videoAlign             = "center";
        this.playheadUpdateInterval = 1000;
        this.previewImagePath       = this.themeColor = null
        
        this.firstLoad   = true;
        this.pluginError = false;
        
        return this;
    },
    
    // Create the HTML to render the player.
    createPlayer: function() {
        this.content = "";
        var flash = "";
        var hasProductInstall   = jpf.video.TypeFlvCompat.isValidAvailable();
        var hasRequestedVersion = jpf.video.TypeFlvCompat.isEightAvailable();		
        if (hasProductInstall && !hasRequestedVersion) {
            var MMPlayerType = (jpf.isIE == true) ? "ActiveX" : "PlugIn";
            var MMredirectURL = window.location;
            document.title = document.title.slice(0, 47) + " - Flash Player Installation";
            var MMdoctitle = document.title;
            
            flash = this.AC_FL_RunContent(
                "src", "playerProductInstall",
                "FlashVars", "MMredirectURL=" + MMredirectURL + "&MMplayerType=" 
                    + MMPlayerType + "&MMdoctitle=" + MMdoctitle + "",
                "width", "100%",
                "height", "100%",
                "align", "middle",
                "id", this.name,
                "quality", "high",
                "bgcolor", "#000000",
                "name", this.name,
                "allowScriptAccess","always",
                "type", "application/x-shockwave-flash",
                "pluginspage", "http://www.adobe.com/go/getflashplayer"
            );
        } else if (hasRequestedVersion) {
            flash = this.AC_FL_RunContent(
                "src", this.DEFAULT_SWF_PATH,
                "width", "100%",
                "height", "100%",
                "align", "middle",
                "id", this.name,
                "quality", "high",
                "bgcolor", "#000000",
                "allowFullScreen", "true", 
                "name", this.name,
                "flashvars","playerID=" + this.id + "&initialVideoPath=" 
                    + this.videoPath,
                "allowScriptAccess","always",
                "type", "application/x-shockwave-flash",
                "pluginspage", "http://www.adobe.com/go/getflashplayer",
                "menu", "true"
            );
        } else {
            flash = "This content requires the <a href=http://www.adobe.com/go/getflash/>Adobe Flash Player</a>.";
            this.pluginError = true;
        }
    
        this.content = "<div id='" + this.name + "_Container' class='jpfVideo'\
            style='width:" + this.width + "px;height:" + this.height + "px;'>"
            + flash + "</div>";
        return this;
    },
    
        
    /* ----------------------------------------------------
     * Utility methods
     *----------------------------------------------------- */
    getElement: function(id) {
        var elem;
        
        if (typeof id == "object")
            return id;
        if (jpf.isIE)
            return window[id];
        else {
            if (document[id])
                elem = document[id];
            else
                elem = document.getElementById(id);

            if (!elem)
                elem = jpf.lookup(id);
            return elem;
        }
    },
    
    // Mark a property as invalid, and create a timeout for redraw
    invalidateProperty: function() {
        if (this.invalidProperties == null)
            this.invalidProperties = {};

        for (var i = 0; i < arguments.length; i++)
            this.invalidProperties[arguments[i]] = true;
        
        if (this.validateInterval == null && this.inited) {
            var _this = this;
            this.validateInterval = setTimeout(function() {
                _this.validateNow();
            }, 100);
        }
        
        return this;
    },
    
    // Updated player with properties marked as invalid.
    validateNow: function() {
        this.validateInterval = null;
        var props = {};
        for (var n in this.invalidProperties)
            props[n] = this[n];
        this.invalidProperties = {};
        this.player.callMethod("update", props);
        return this;
    },
        
    // All public methods use this proxy to make sure that methods called before
    // initialization are properly called after the player is ready.
    callMethod: function(param1, param2, param3) {
        if (this.inited)
            this.player.callMethod(param1, param2, param3); // function.apply does not work on the flash object
        else
            this.delayCalls.push(arguments);
        return this;
    },
    
    // Call methods that were made before the player was initialized.
    makeDelayCalls: function() {
        for (var i = 0; i < this.delayCalls.length; i++)
            this.callMethod.apply(this, this.delayCalls[i]);
        return this;
    },
    
    // All public properties use this proxy to minimize player updates
    setProperty: function(property, value) {
        this[property] = value; // Set the internal property
        if (this.inited)
            this.invalidateProperty(property); // Otherwise, it is already invalidated on init.
        return this;
    },

    /* ----------------------------------------------------
     * Include ActiveContent methods that we need to
     * override. Avoids collision with the default file
     *----------------------------------------------------- */
    AC_Generateobj: function(objAttrs, params, embedAttrs) { 
        var str = [];
        if (jpf.isIE && !jpf.isOpera) {
            str.push('<object ');
            for (var i in objAttrs)
                str.push(i, '="', objAttrs[i], '" ');
            str.push('>');
            for (var i in params)
                str.push('<param name="', i, '" value="', params[i], '" /> ');
            str.push('</object>');
        } else {
            str.push('<embed ');
            for (var i in embedAttrs)
                str.push(i, '="', embedAttrs[i], '" ');
            str.push('> </embed>');
        }
        return str.join(''); // Instead of document.write
    },
    
    AC_FL_RunContent: function() {
        var ret = jpf.video.TypeFlvCompat.AC_GetArgs(arguments, ".swf",
            "movie", "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000",
            "application/x-shockwave-flash");
        return this.AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
    }
};
