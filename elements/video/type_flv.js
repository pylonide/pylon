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
// #ifdef __AMLVIDEO || __INC_ALL

/**
 * Element displaying a Flash video
 *
 * @classDescription This class creates a new Flash video player
 * @return {TypeFlv} Returns a new Flash video player
 * @type {TypeFlv}
 * @constructor
 * @addnode elements:video
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
apf.video.TypeFlv = function(oVideo, node, options) {
    this.oVideo              = oVideo;
    // #ifndef __PACKAGED
    this.DEFAULT_SWF_PATH    = (apf.config.resourcePath || apf.basePath) + "elements/video/FAVideo.swf";
    /* #else
    this.DEFAULT_SWF_PATH    = (apf.config.resourcePath || apf.basePath) + "resources/FAVideo.swf";
    #endif */
    /* #ifdef __WITH_CDN
    this.DEFAULT_SWF_PATH    = apf.CDN + apf.VERSION + "/resources/videoplayer.swf";
    #endif */
    //this.DEFAULT_WIDTH       = "100%";
    //this.DEFAULT_HEIGHT      = "100%";

    this.id = apf.flash.addPlayer(this); // Manager manages multiple players
    this.inited       = false;
    this.resizeTimer  = null;

    // Div name, flash name, and container name
    this.divName      = this.oVideo.$uniqueId;
    this.htmlElement  = node;
    this.name         = "FAVideo_" + this.oVideo.$uniqueId;

    // Video props
    this.videoPath    = options.src;
    this.width        = "100%"; //(options.width  > 0) ? options.width  : this.DEFAULT_WIDTH;
    this.height       = "100%"; //(options.height > 0) ? options.height : this.DEFAULT_HEIGHT;

    // Initialize player
    this.player = null;
    apf.extend(this, apf.video.TypeInterface);

    this.initProperties().setOptions(options).createPlayer();
}

apf.video.TypeFlv.isSupported = function() {
    return apf.flash.isAvailable();
};

apf.video.TypeFlv.prototype = {
    /**
     * Play an FLV. Does a call to the flash player to load or load & play the
     * video, depending on the 'autoPlay' flag (TRUE for play).
     *
     * @param {String} videoPath Path to the FLV. If the videoPath is null, and the FLV is playing, it will act as a play/pause toggle.
     * @param {Number} totalTime Optional totalTime to override the FLV's built in totalTime
     * @type  {Object}
     */
    load: function(videoPath, totalTime) {
        videoPath = videoPath.splitSafe(",")[this.oVideo.$lastMimeType] || videoPath;

        if (totalTime != null)
            this.setTotalTime(totalTime);
        if (videoPath != null)
            this.videoPath = videoPath;
        if (this.videoPath == null && !this.firstLoad)
            return this.oVideo.$errorHook({type:"error", error:"FAVideo::play - No videoPath has been set."});

        if (videoPath == null && this.firstLoad && !this.autoLoad) // Allow play(null) to toggle playback
            videoPath = this.videoPath;

        this.firstLoad = false;
        if (this.autoPlay)
            this.callMethod("playVideo", videoPath, totalTime);
        else
            this.callMethod("loadVideo", this.videoPath);
        return this;
    },

    /**
     * Play and/ or resume a video that has been loaded already
     *
     * @type {Object}
     */
    play: function() {
        return this.pause(false);
    },

    /**
     * Toggle the pause state of the video.
     *
     * @param {Boolean} pauseState The pause state. Setting pause state to true will pause the video.
     * @type {Object}
     */
    pause: function(pauseState) {
        if (typeof pauseState == "undefined")
            pauseState = true;
        this.callMethod("pause", pauseState);
        return this;
    },

    /**
     * Stop playback of the video.
     *
     * @type {Object}
     */
    stop: function() {
        this.callMethod("stop");
        return this;
    },

    /**
     * Seek the video to a specific position.
     *
     * @param {Number} millis The number of milliseconds to seek the playhead to.
     * @type {Object}
     */
    seek: function(millis) {
        this.callMethod("seek", millis / 1000);
        return this;
    },

    /**
     * Set the volume of the video to a specific range (0 - 100)
     *
     * @param {Number} iVolume
     * @type  {Object}
     */
    setVolume: function(iVolume) {
        this.callMethod("setVolume", iVolume);
        return this;
    },

    /**
     * Resize event handler, used by the layoutManager hook
     *
     * @type {void}
     */
    onResize: function() {
        clearTimeout(this.resizeTimer);
        var _self = this;
        this.resizeTimer = window.setTimeout(function() {
            _self.setSize();
        }, 20);
    },

    /**
     * Set the size of the video.
     *
     * @type {Object}
     */
    setSize: function() {
        this.callMethod("setSize", this.htmlElement.offsetWidth,
            this.htmlElement.offsetHeight);
        return this;
    },

    /**
     * Retrive the position of the playhead, in seconds.
     *
     * @type {Number}
     */
    getPlayheadTime: function() {
        return this.playheadTime;
    },

    /**
     * Specifies the position of the playhead, in seconds.
     *
     * @default null
     * @type {Object}
     */
    setPlayheadTime: function(value) {
        return this.setProperty("playheadTime", value);
    },

    /**
     * Retrieve the total playtime of the video, in seconds.
     *
     * @type {Number}
     */
    getTotalTime: function() {
        return this.totalTime;
    },

    /**
     * Determines the total time of the video.  The total time is automatically determined
     * by the player, unless the user overrides it.
     *
     * @default null
     * @type {Object}
     */
    setTotalTime: function(value) {
        return this.setProperty("totalTime", value);
    },

    /*setFullscreen: function(value) {
        apf.console.info('video::flash - going fullscreen = ' + value);
        return this.callMethod('setFullscreen', value);
    },*/

    /**
     * All public methods use this proxy to make sure that methods called before
     * initialization are properly called after the player is ready.
     *
     * @type {Object}
     */
    callMethod: function() {
        if (!this.inited || !this.player || !this.player.callMethod) {
            this.delayCalls.push(arguments);
        }
        else {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(this.player, "callMethod");
            apf.flash.remote.apply(null, args);
        }

        return this;
    },

    /**
     * Call methods that were made before the player was initialized.
     *
     * @type {Object}
     */
    makeDelayCalls: function() {
        for (var i = 0, l = this.delayCalls.length; i < l; i++)
            this.callMethod.apply(this, this.delayCalls[i]);
        return this;
    },

    /**
     * Callback from flash; synchronizes the state of properties of the Flash
     * movie with the properties of the javascript object
     *
     * @param {Object} props
     * @type {void}
     */
    update: function(props) {
        for (var n in props) {
            if (n.indexOf("Time") != -1 && typeof props[n] == "number")
                props[n] = props[n] * 1000;
            this[n] = props[n]; // Set the internal property
        }
        props.type = "change";
        this.oVideo.$changeHook(props); // This needs to have an array of changed props.
    },

    /**
     * Callback from flash; whenever the Flash movie bubbles an event up to the
     * javascript interface, it passes through to this function.
     * Events dispatched by FAVideo instances:
     *    > init: The player is initialized
     *    > ready: The video is ready
     *    > progress: The video is downloading. Properties: bytesLoaded, bytesTotal
     *    > playHeadUpdate: The video playhead has moved.  Properties: playheadTime, totalTime
     *    > stateChange: The state of the video has changed. Properties: state
     *    > change: The player has changed.
     *    > complete: Playback is complete.
     *    > metaData: The video has returned meta-data. Properties: infoObject
     *    > cuePoint: The video has passed a cuePoint. Properties: infoObject
     *    > error: An error has occurred.  Properties: error
     *
     * @param {Object} eventName
     * @param {Object} evtObj
     * @type {void}
     */
    event: function(eventName, evtObj) {
        apf.console.log("[FLASH] video event: " + eventName + ", " + evtObj);
        switch (eventName) {
            case "progress":
                this.bytesLoaded = evtObj.bytesLoaded;
                this.totalBytes  = evtObj.bytesTotal;
                this.oVideo.$progressHook({
                    type       : "progress",
                    bytesLoaded: this.bytesLoaded,
                    totalBytes : this.totalBytes
                });
                break;
            case "playheadUpdate":
                this.playheadTime = evtObj.playheadTime * 1000;
                this.totalTime    = evtObj.totalTime * 1000;
                this.oVideo.$playheadUpdateHook({
                    type        : "playheadUpdate",
                    playheadTime: this.playheadTime,
                    totalTime   : this.totalTime
                });
                break;
            case "stateChange":
                this.state = evtObj.state;
                this.oVideo.$stateChangeHook({type:"stateChange", state:this.state});
                break;
            case "change":
                this.oVideo.$changeHook({type:"change"});
                break;
            case "complete":
                this.oVideo.$completeHook({type:"complete"});
                break;
            case "ready":
                this.oVideo.$readyHook({type:"ready"});
                break;
            case "metaData":
                this.oVideo.$metadataHook({type:"metadata", infoObject:evtObj});
                break;
            case "cuePoint":
                this.oVideo.$cuePointHook({type:"cuePoint", infoObject:evtObj});
                break;
            case "fullscreen":
                apf.console.log('fullscreen: ', evtObj.state);
                this.oVideo.fullscreen = false;
            case "init":
                this.inited = true;
                // There is a bug in IE innerHTML. Tell flash what size it is.
                // This will probably not work with liquid layouts in IE.
                this.invalidateProperty("clickToTogglePlay", "skinVisible",
                    "skinAutoHide", "autoPlay", "autoLoad", "volume", "bufferTime",
                    "videoScaleMode", "videoAlign", "playheadUpdateInterval",
                    "previewImagePath").validateNow().makeDelayCalls();

                this.oVideo.$initHook({type:"init"});
                this.onResize();
                var node = this.oVideo.$int;
                //#ifdef __WITH_LAYOUT
                $setTimeout(function() {
                    apf.layout.forceResize(node);
                }, 1000);
                //#endif
                break;
            // #ifdef __DEBUG
            case "debug":
                apf.console.log('Flash debug: ' + evtObj.msg);
                break;
            // #endif
        }
    },

    /**
     * Mark out the properties, so they are initialized, and documented.
     *
     * @type {Object}
     */
    initProperties: function() {
        this.delayCalls = [];

        // Properties set by flash player
        this.videoWidth = this.videoHeight = this.totalTime = this.bytesLoaded = this.totalBytes = 0;
        this.state = null;

        // Internal properties that match get/set methods
        this.clickToTogglePlay = this.autoPlay = this.autoLoad = this.skinVisible = true;
        this.volume                 = 50;
        this.skinVisible            = false;
        this.skinAutoHide           = false;
        this.playheadTime           = null;
        this.bufferTime             = 0.1;
        this.videoScaleMode         = "maintainAspectRatio"; //maintainAspectRatio || exactFit || noScale
        this.videoAlign             = "center";
        this.playheadUpdateInterval = 1000;
        this.previewImagePath       = this.themeColor = null

        this.firstLoad   = true;
        this.pluginError = false;

        this.properties = ["volume", "skinAutoHide", "showControls", "autoPlay",
            "clickToTogglePlay", "autoLoad", "playHeadTime", "totalTime",
            "bufferTime", "videoScaleMode", "videoAlign", "playheadUpdateInterval",
            "previewImagePath"];
        //#ifdef __WITH_LAYOUT
        apf.layout.setRules(this.oVideo.$ext, this.oVideo.$uniqueId + "_favideo",
            "(apf.all[" + this.oVideo.$uniqueId + "].player && apf.all["
            + this.oVideo.$uniqueId + "].player.onResize \
                ? apf.all[" + this.oVideo.$uniqueId + "].player \
                : {onResize:apf.K}).onResize()");
        apf.layout.queue(this.oVideo.$ext);
        //#endif
        return this;
    },

    /**
     * Create the HTML to render the player.
     *
     * @type {Object}
     */
    createPlayer: function() {
        if (this.htmlElement == null) return this;

        this.pluginError = false;
        
        apf.flash.embed({
            // apf.flash#embed properties
            context          : this,
            htmlNode         : this.htmlElement,
            property         : "player",
            // movie properties
            src              : this.DEFAULT_SWF_PATH,
            width            : "100%",
            height           : "100%",
            align            : "middle",
            id               : this.name,
            quality          : "high",
            bgcolor          : "#000000",
            allowFullScreen  : "true",
            name             : this.name,
            flashvars        : "playerID=" + this.id + "&volume=" + this.volume
            /* #ifdef __WITH_CDN
            + "&secureDomain=" + window.location.protocol + "//" + window.location.host
            #endif */
            ,
            allowScriptAccess: "always",
            type             : "application/x-shockwave-flash",
            pluginspage      : "http://www.adobe.com/go/getflashplayer",
            menu             : "true"
        });

        return this;
    },

    /**
     * Mark a property as invalid, and create a timeout for redraw
     *
     * @type {Object}
     */
    invalidateProperty: function() {
        if (this.invalidProperties == null)
            this.invalidProperties = {};

        for (var i = 0; i < arguments.length; i++)
            this.invalidProperties[arguments[i]] = true;

        if (this.validateInterval == null && this.inited) {
            var _this = this;
            this.validateInterval = $setTimeout(function() {
                _this.validateNow();
            }, 100);
        }

        return this;
    },

    /**
     * Updated player with properties marked as invalid.
     *
     * @type {Object}
     */
    validateNow: function() {
        this.validateInterval = null;
        var props = {};
        for (var n in this.invalidProperties)
            props[n] = this[n];
        this.invalidProperties = {};
        this.callMethod("update", props);
        return this;
    },

    /**
     * All public properties use this proxy to minimize player updates
     *
     * @param {String} property
     * @param {String} value
     * @type {Object}
     */
    setProperty: function(property, value) {
        this[property] = value; // Set the internal property
        if (this.inited)
            this.invalidateProperty(property); // Otherwise, it is already invalidated on init.
        return this;
    },

    $destroy: function() {
        //#ifdef __WITH_LAYOUT
        if (apf.layout)
            apf.layout.removeRule(this.oVideo.$ext, this.oVideo.$uniqueId + "_favideo");
        //#endif
        if (this.player) {
            try {
                this.stop();
            }
            catch(e) {}
            this.player = null;
            delete this.player;
        }
        this.htmlElement.innerHTML = "";
        this.oVideo = this.htmlElement = null;
        delete this.oVideo;
        delete this.htmlElement;
    }
};
// #endif
