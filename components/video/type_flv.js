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

// #ifdef __JVIDEO || __INC_ALL
// #define __WITH_PRESENTATION 1

/* ----------------------------------------------------
 * FAVideo
 *
 * FAVideo represents a video player instance on the page. It allows you to instantiate, control,
 * and listen to events from a Flash video player through Javascript.
 *----------------------------------------------------- */
jpf.video.TypeFlv = function(id, node, options) {
    this.DEFAULT_SWF_PATH    = "components/video/FAVideo"; // dot swf is added by AC_RunActiveContent
    this.DEFAULT_SKIN_PATH   = "components/video/ClearOverPlayMute.swf";
    this.DEFAULT_WIDTH       = 320;
    this.DEFAULT_HEIGHT      = 240;
    this.ERROR_DIV_NOT_FOUND = "The specified DIV element was not found.";
    
    //this.DEFAULT_SKIN_PATH = "skins/ClearExternalAll.swf";
    
    this.id = jpf.flash_helper.addPlayer(this); // Manager manages multiple players
    this.rendered = this.inited = false;
    
    // Div name, flash name, and container name
    this.divName      = id;
    this.htmlElement  = node;
    this.name         = "FAVideo_" + id;
    
    // Video props
    this.videoPath  = options.src;
    this.width      = (options.width  > 0) ? options.width  : this.DEFAULT_WIDTH;
    this.height     = (options.height > 0) ? options.height : this.DEFAULT_HEIGHT;
    
    // Initialize player
    this.player = null;
    jpf.extend(this, jpf.video.TypeInterface);

    this.initProperties().setOptions(options).createPlayer().render();
}

jpf.video.TypeFlv.isSupported = function() {
    return jpf.flash_helper.isValidAvailable();
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
    
    // Mark out the properties, so they are initialized, and documented.
    initProperties: function() {
        this.delayCalls = [];
        
        // Properties set by flash player
        this.videoWidth = this.videoHeight = this.totalTime = this.bytesLoaded = this.bytesTotal = 0;
        this.state = null;
        
        // Internal properties that match get/set methods
        this.clickToTogglePlay = this.autoPlay = this.autoLoad = this.skinVisible = true;
        this.volume                 = 50;
        this.skinVisible            = false;
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
        
        this.properties = ["volume", "skinAutoHide", "showControls", "autoPlay",
            "clickToTogglePlay", "autoLoad", "playHeadTime", "totalTime",
            "bufferTime", "videoScaleMode", "videoAlign", "playheadUpdateInterval",
            "skinPath", "previewImagePath"];
        
        return this;
    },
    
    // Create the HTML to render the player.
    createPlayer: function() {
        this.content = "";
        var flash = "";
        var hasProductInstall   = jpf.flash_helper.isValidAvailable();
        var hasRequestedVersion = jpf.flash_helper.isEightAvailable();		
        if (hasProductInstall && !hasRequestedVersion) {
            var MMPlayerType = (jpf.isIE == true) ? "ActiveX" : "PlugIn";
            var MMredirectURL = window.location;
            document.title = document.title.slice(0, 47) + " - Flash Player Installation";
            var MMdoctitle = document.title;
            
            flash = jpf.flash_helper.AC_FL_RunContent(
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
            flash = jpf.flash_helper.AC_FL_RunContent(
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
    }
};
// #endif
