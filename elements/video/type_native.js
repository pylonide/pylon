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
 * Element displaying an &lt;video&gt; element
 *
 * @classDescription This class creates a &lt;video&gt; element
 * @return {TypeNative} Returns a new &lt;video&gt; element
 * @type {TypeNative}
 * @constructor
 * @addnode elements:video
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */

apf.video.TypeNative = function(oVideo, oNode, options) {
    this.oVideo = oVideo;

    this.inited = false;

    // Div name, flash name, and container name
    this.divName      = oVideo.$uniqueId;
    this.htmlElement  = oNode;
    this.name         = "soundmgr_" + oVideo.$uniqueId;

    // Audio props
    this.videoPath    = options.src;
    this.paused       = false;

    // Initialize player
    this.player       = null;
    apf.extend(this, apf.video.TypeInterface);

    this.setOptions(options).createPlayer();
};

apf.video.TypeNative.isSupported = function() {
    return apf.hasVideo;
};

apf.video.TypeNative.prototype = {
    /**
     * Load an video file.
     *
     * @param {String} videoPath Path to the ogg file. If the videoPath is null,
     *                           and the ogg is playing, it will act as a play/pause toggle.
     * @param {Number} totalTime Optional totalTime to override the ogg's built in totalTime
     */
    load: function(videoPath, totalTime) {
        if (totalTime != null)
            this.setTotalTime(totalTime);
        if (videoPath != null)
            this.videoPath = videoPath;
        if (this.videoPath == null && !this.firstLoad)
            return this.oVideo.$errorHook({type:"error", error:"SoundManager::play - No videoPath has been set."});

        if (videoPath == null && this.firstLoad && !this.autoLoad) // Allow play(null) to toggle playback
            videoPath = this.videoPath;
        this.firstLoad = false;
        this.setVolume(this.volume);
        //    .callMethod("loadSound", this.videoPath, true, this.autoPlay);
        return this;
    },

    /**
     * Play and/ or resume a video that has been loaded already
     *
     * @type {Object}
     */
    play: function() {
        if (!this.paused)
            return this.player.play();
        return this.pause(); //toggle pause
    },

    /**
     * Toggle the pause state of the video.
     *
     * @param {Boolean} pauseState The pause state. Setting pause state to true will pause the video.
     * @type {Object}
     */
    pause: function() {
        return this.player.pause();
    },

    /**
     * Stop playback of the video.
     *
     * @type {Object}
     */
    stop: function() {
        return this.player.stop();
    },

    /**
     * Seek the video to a specific position.
     *
     * @param {Number} seconds The number of seconds to seek the playhead to.
     * @type {Object}
     */
    seek: function(ms) {
        return this.player.currentTime = parseInt(ms) / 1000;
    },

    /**
     * Not supported.
     *
     * @type {Object}
     */
    setVolume: function(iVol) {
        this.player.volume = parseInt(iVol) / 100;
        return this;
    },

    /**
     * Retrive the position of the playhead, in seconds.
     *
     * @type {Number}
     */
    getPlayheadTime: function() {
        return this.player.playheadTime;
    },

    /**
     * Specifies the position of the playhead, in seconds.
     *
     * @default null
     * @type {Object}
     */
    setPlayheadTime: function(value) {
        this.playheadTime = parseInt(value);
        return this;
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
        this.totalTime = parseInt(value);
        return this;
    },

    /**
     * Callback from flash; whenever the Flash movie bubbles an event up to the
     * javascript interface, it passes through to this function.
     * Events dispatched by SoundManager instances:
     *    > init: The player is initialized
     *    > ready: The video is ready
     *    > progress: The video is downloading. Properties: bytesLoaded, totalBytes
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
        switch (eventName) {
            case "progress":
                this.bytesLoaded = evtObj.bytesLoaded;
                this.totalBytes  = evtObj.totalBytes;
                this.oVideo.$progressHook({
                    type       : "progress",
                    bytesLoaded: this.bytesLoaded,
                    totalBytes : this.totalBytes
                });
                break;
            case "playheadUpdate":
                this.playheadTime = evtObj.playheadTime;
                this.totalTime    = evtObj.totalTime;
                this.oVideo.$changeHook({
                    type        : "change",
                    playheadTime: this.playheadTime,
                    totalTime   : this.totalTime
                });
                if (evtObj.waveData || evtObj.peakData || evtObj.eqData)
                    this.oVideo.$metadataHook({
                        type    : "metadata",
                        waveData: evtObj.waveData,
                        peakData: evtObj.peakData,
                        eqData  : evtObj.eqData
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
                if (this.paused && this.autoPlay)
                    this.paused = false;
                this.oVideo.$readyHook({type:"ready"});
                break;
            case "metaData":
                this.oVideo.$metadataHook({type:"metaData", infoObject:evtObj});
                break;
            case "cuePoint":
                this.oVideo.$cuePointHook({type:"cuePoint", infoObject:evtObj});
                break;
            case "init":
                this.inited = true;
                this.oVideo.$initHook(apf.extend(evtObj, apf.flash.getSandbox(evtObj.sandboxType)));
                break;
            case "id3":
                this.oVideo.$metadataHook({
                    type: 'metadata',
                    id3Data: evtObj
                });
                break;
            case "debug":
                apf.console.log(">> SWF DBUG: " + evtObj.msg);
                break;
        }
    },

    /**
     * Create the HTML to render the player.
     *
     * @type {Object}
     */
    createPlayer: function() {
        var div = this.htmlElement;
        if (div == null) return this;

        // place the HTML node outside of the viewport
        var a = this.player = document.createElement("video");
        a.setAttribute("src", this.videoPath);
        a.setAttribute("volume", this.volume);
        if (this.autoPlay)
            a.setAttribute("autoplay", "true");
        div.appendChild(a);

        var _self = this,
            timeHandler;
        a.addEventListener("canplay", function() {
            _self.oVideo.$readyHook({type:"ready"});
        }, false);
        a.addEventListener("timeupdate", timeHandler = function(e) {
            //console.dir(e);
            //console.log("playing: ", _self.player.currentTime, _self.player.duration);
            _self.playheadTime = parseInt(_self.player.currentTime || 0) * 1000;
            _self.totalTime    = parseInt(_self.player.duration) * 1000;
            _self.oVideo.$changeHook({
                type        : "change",
                playheadTime: _self.playheadTime,
                totalTime   : _self.totalTime
            });
        }, false);
        a.addEventListener("duration", timeHandler, false);
        a.addEventListener("volumechange", function() {
            _self.oVideo.$changeHook({
                type   : "change",
                volume : _self.player.muted ? 0 : parseInt(_self.player.volume) * 100
            });
        }, false);
        a.addEventListener("progress", function(e) {
            _self.bytesLoaded = e.loaded;
            _self.totalBytes  = e.total;
            _self.oVideo.$progressHook({
                type       : "progress",
                bytesLoaded: _self.bytesLoaded,
                totalBytes : _self.totalBytes
            });
        }, false);
        a.addEventListener("ended", function() {
            _self.oVideo.$completeHook({type:"complete"});
        }, false);
        a.addEventListener("error", function(e) {
            throw new Error(apf.formatErrorString(0, _self, "Audio playback",
                e.message, _self.oVideo));
        }, false);

        a.load();

        return this;
    },

    $destroy: function() {
        if (!this.player) return;
        this.player.setAttribute("src", "");
        delete this.player;
        this.player = null;
    }
};
// #endif
