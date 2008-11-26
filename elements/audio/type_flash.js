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
// #ifdef __JAUDIO || __INC_ALL

/**
 * Element displaying a Flash audio
 *
 * @classDescription This class creates a new Flash audio player
 * @return {TypeFlash} Returns a new Flash audio player
 * @type {TypeFlash}
 * @constructor
 * @addnode elements:audio
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */

jpf.audio.TypeFlash = function(oAudio, oNode, options) {
    this.oAudio              = oAudio;
    this.isNine              = jpf.flash.isAvailable('9.0.0');

    // #ifndef __PACKAGED
    this.DEFAULT_SWF_PATH    = jpf.basePath + "elements/audio/soundmanager2"
                                + (this.isNine ? "_flash9" : "") + ".swf";
    this.NULL_MP3_PATH       = jpf.basePath + "elements/audio/null.mp3";
    /* #else
    this.DEFAULT_SWF_PATH    = jpf.basePath + "resources/soundmanager2"
                                + (this.isNine ? "_flash9" : "") + ".swf";
    this.NULL_MP3_PATH       = jpf.basePath + "resources/null.mp3";
    #endif */
    /* #ifdef __WITH_CDN
    this.DEFAULT_SWF_PATH    = jpf.CDN + jpf.VERSION + "/resources/soundmanager2"
                                + (this.isNine ? "_flash9" : "") + ".swf";
    this.NULL_MP3_PATH       = jpf.CDN + jpf.VERSION + "/resources/null.mp3";
    #endif */

    this.id = jpf.flash.addPlayer(this); // Manager manages multiple players
    this.inited = false;

    // Div name, flash name, and container name
    this.divName      = oAudio.uniqueId;
    this.htmlElement  = oNode;
    this.name         = "soundmgr_" + oAudio.uniqueId;

    // Audio props
    this.audioPath  = options.src;
    this.paused     = false;

    // Initialize player
    this.player = null;
    jpf.extend(this, jpf.audio.TypeInterface);

    this.initProperties().setOptions(options).createPlayer();
}

jpf.audio.TypeFlash.isSupported = function() {
    return jpf.flash.isAvailable();
};

jpf.audio.TypeFlash.prototype = {
    /**
     * Load an audio file.
     *
     * @param {String} audioPath Path to the mp3 file. If the audioPath is null, and the mp3 is playing, it will act as a play/pause toggle.
     * @param {Number} totalTime Optional totalTime to override the mp3's built in totalTime
     */
    load: function(audioPath, totalTime) {
        if (totalTime != null)
            this.setTotalTime(totalTime);
        if (audioPath != null)
            this.audioPath = audioPath;
        if (this.audioPath == null && !this.firstLoad)
            return this.oAudio.$errorHook({type:"error", error:"SoundManager::play - No audioPath has been set."});

        if (audioPath == null && this.firstLoad && !this.autoLoad) // Allow play(null) to toggle playback
            audioPath = this.audioPath;
        this.firstLoad = false;
        this.callMethod('unloadSound', this.NULL_MP3_PATH);
        if (this.isNine)
            this.callMethod("createSound", this.audioPath, 0, true, true, true);
        else
            this.callMethod("createSound", 0);
        this.callMethod("loadSound", this.audioPath, true, this.autoPlay);
        return this;
    },

    /**
     * Play and/ or resume a audio that has been loaded already
     *
     * @type {Object}
     */
    play: function() {
        if (!this.paused)
            return this.callMethod("startSound", 1, 0);
        return this.pause(); //toggle pause
    },

    /**
     * Toggle the pause state of the audio.
     *
     * @param {Boolean} pauseState The pause state. Setting pause state to true will pause the audio.
     * @type {Object}
     */
    pause: function() {
        this.paused = !this.paused;
        return this.callMethod("pauseSound");
    },

    /**
     * Stop playback of the audio.
     *
     * @type {Object}
     */
    stop: function() {
        return this.callMethod("stopSound", true);
    },

    /**
     * Seek the audio to a specific position.
     *
     * @param {Number} seconds The number of seconds to seek the playhead to.
     * @type {Object}
     */
    seek: function(seconds) {
        return this.callMethod("setPosition", seconds, this.paused);
    },

    /**
     * Not supported.
     *
     * @type {Object}
     */
    setVolume: function(iVol) {
        return this.callMethod("setVolume", iVol);
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
     * Retrieve the total playtime of the audio, in seconds.
     *
     * @type {Number}
     */
    getTotalTime: function() {
        return this.totalTime;
    },

    /**
     * Determines the total time of the audio.  The total time is automatically determined
     * by the player, unless the user overrides it.
     *
     * @default null
     * @type {Object}
     */
    setTotalTime: function(value) {
        return this.setProperty("totalTime", value);
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
     * @param {String} param4
     * @param {String} param5
     * @param {String} param6
     * @type {Object}
     */
    callMethod: function(param1, param2, param3, param4, param5, param6) {
        if (this.inited && this.player && this.player.callMethod) {
            if (typeof param2 == "undefined")
                this.player.callMethod(param1);
            else if (typeof param3 == "undefined")
                this.player.callMethod(param1, param2);
            else if (typeof param4 == "undefined")
                this.player.callMethod(param1, param2, param3);
            else if (typeof param5 == "undefined")
                this.player.callMethod(param1, param2, param3, param4);
            else if (typeof param6 == "undefined")
                this.player.callMethod(param1, param2, param3, param4, param5); // function.apply does not work on the flash object
            else
                this.player.callMethod(param1, param2, param3, param4, param5, param6);
        }
        else
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

    /**
     * Callback from flash; whenever the Flash movie bubbles an event up to the
     * javascript interface, it passes through to this function.
     * Events dispatched by SoundManager instances:
     *    > init: The player is initialized
     *    > ready: The audio is ready
     *    > progress: The audio is downloading. Properties: bytesLoaded, totalBytes
     *    > playHeadUpdate: The audio playhead has moved.  Properties: playheadTime, totalTime
     *    > stateChange: The state of the audio has changed. Properties: state
     *    > change: The player has changed.
     *    > complete: Playback is complete.
     *    > metaData: The audio has returned meta-data. Properties: infoObject
     *    > cuePoint: The audio has passed a cuePoint. Properties: infoObject
     *    > error: An error has occurred.  Properties: error
     *
     * @param {Object} eventName
     * @param {Object} evtObj
     * @type {void}
     */
    event: function(eventName, evtObj) {
        switch (eventName) {
            case "progress":
                this.bytesLoaded = evtObj.bytesLoaded;
                this.totalBytes  = evtObj.totalBytes;
                this.oAudio.$progressHook({
                    type       : "progress",
                    bytesLoaded: this.bytesLoaded,
                    totalBytes : this.totalBytes
                });
                break;
            case "playheadUpdate":
                this.playheadTime = evtObj.playheadTime;
                this.totalTime    = evtObj.totalTime;
                this.oAudio.$changeHook({
                    type        : "change",
                    playheadTime: this.playheadTime,
                    totalTime   : this.totalTime
                });
                if (evtObj.waveData || evtObj.peakData || evtObj.eqData)
                    this.oAudio.$metadataHook({
                        type    : "metadata",
                        waveData: evtObj.waveData,
                        peakData: evtObj.peakData,
                        eqData  : evtObj.eqData
                    });
                break;
            case "stateChange":
                this.state = evtObj.state;
                this.oAudio.$stateChangeHook({type:"stateChange", state:this.state});
                break;
            case "change":
                this.oAudio.$changeHook({type:"change"});
                break;
            case "complete":
                this.oAudio.$completeHook({type:"complete"});
                break;
            case "ready":
                this.callMethod("setVolume", this.volume).callMethod("setPan", 0);
                if (this.paused && this.autoPlay)
                    this.paused = false;
                this.oAudio.$readyHook({type:"ready"});
                break;
            case "metaData":
                this.oAudio.$metadataHook({type:"metaData", infoObject:evtObj});
                break;
            case "cuePoint":
                this.oAudio.$cuePointHook({type:"cuePoint", infoObject:evtObj});
                break;
            case "init":
                this.inited = true;
                this.invalidateProperty("autoPlay", "autoLoad", "volume", "bufferTime",
                    "playheadUpdateInterval").validateNow().makeDelayCalls();
                this.oAudio.$initHook(jpf.extend(evtObj, jpf.flash.getSandbox(evtObj.sandboxType)));
                break;
            case "id3":
                this.oAudio.$metadataHook({
                    type: 'metadata',
                    id3Data: evtObj
                });
                break;
            case "debug":
                jpf.console.log(">> SWF DBUG: " + evtObj);
                break;
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
        this.totalTime = this.bytesLoaded = this.totalBytes = 0;
        this.state = null;

        // Internal properties that match get/set methods
        this.autoPlay = this.autoLoad = true;
        this.volume                 = 50;
        this.playheadTime           = null;
        this.bufferTime             = 0.1;
        this.playheadUpdateInterval = 1000;

        this.firstLoad   = true;
        this.pluginError = false;

        this.properties = ["volume", "autoPlay", "autoLoad", "playHeadTime",
            "totalTime", "bufferTime", "playheadUpdateInterval"];

        return this;
    },

    /**
     * Create the HTML to render the player.
     *
     * @type {Object}
     */
    createPlayer: function() {
        this.content = "";
        var flash = jpf.flash.buildContent(
            "src",              this.DEFAULT_SWF_PATH,
            "width",            "1",
            "height",           "1",
            "align",            "middle",
            "id",               this.name,
            "quality",          "high",
            "bgcolor",          "#000000",
            "allowFullScreen",  "true",
            "name",             this.name,
            "flashvars",        "playerID=" + this.id,
            "allowScriptAccess","always",
            "type",             "application/x-shockwave-flash",
            "pluginspage",      "http://www.adobe.com/go/getflashplayer",
            "menu",             "true");

        this.content = "<div id='" + this.name + "_Container' class='jpfAudio'\
            style='width:1px;height:1px;'>" + flash + "</div>";

        var div = this.htmlElement || jpf.flash.getElement(this.divName);
        if (div == null) return this;

        this.pluginError = false;
        div.innerHTML = this.content;

        this.player    = jpf.flash.getElement(this.name);
        this.container = jpf.flash.getElement(this.name + "_Container");

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
            this.validateInterval = setTimeout(function() {
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
        this.player.callMethod("setPolling", true);
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
        this.callMethod('destroySound');
        if (this.player) {
            delete this.player;
            this.player = null;
        }
    }
};
// #endif
