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
// #ifdef __AMLAUDIO || __INC_ALL

/**
 * Element displaying an &lt;audio&gt; element
 *
 * @classDescription This class creates a &lt;audio&gt; element
 * @return {TypeNative} Returns a new &lt;audio&gt; element
 * @type {TypeNative}
 * @constructor
 *
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */

apf.audio.TypeNative = function(oAudio, oNode, options) {
    this.oAudio = oAudio;

    this.inited = false;

    // Div name, flash name, and container name
    this.divName      = oAudio.$uniqueId;
    this.htmlElement  = oNode;
    this.name         = "soundmgr_" + oAudio.$uniqueId;

    // Audio props
    this.audioPath    = options.src;
    this.paused       = false;

    // Initialize player
    this.player       = null;
    apf.extend(this, apf.audio.TypeInterface);

    this.setOptions(options).createPlayer();
};

apf.audio.TypeNative.isSupported = function() {
    return apf.hasAudio;
};

apf.audio.TypeNative.prototype = {
    /**
     * Load an audio file.
     *
     * @param {String} audioPath Path to the mp3 file. If the audioPath is null,
     *                           and the mp3 is playing, it will act as a play/pause toggle.
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
        this.setVolume(this.volume);
        //    .callMethod("loadSound", this.audioPath, true, this.autoPlay);
        return this;
    },

    /**
     * Play and/ or resume a audio that has been loaded already
     *
     * @type {Object}
     */
    play: function() {
        if (!this.paused)
            return this.player.play();
        return this.pause(); //toggle pause
    },

    /**
     * Toggle the pause state of the audio.
     *
     * @param {Boolean} pauseState The pause state. Setting pause state to true
     *                             will pause the audio.
     * @type {Object}
     */
    pause: function() {
        return this.player.pause();
    },

    /**
     * Stop playback of the audio.
     *
     * @type {Object}
     */
    stop: function() {
        return this.player.stop();
    },

    /**
     * Seek the audio to a specific position.
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
        this.totalTime = parseInt(value);
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
                this.oAudio.$initHook(apf.extend(evtObj, apf.flash.getSandbox(evtObj.sandboxType)));
                break;
            case "id3":
                this.oAudio.$metadataHook({
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
        div.style.position = "absolute";
        div.style.width    = "1px";
        div.style.height   = "1px";
        div.style.left     = "-2000px";
        var a = this.player = document.createElement("audio");
        a.setAttribute("src", this.audioPath);
        a.setAttribute("volume", this.volume);
        if (this.autoPlay)
            a.setAttribute("autoplay", "true");
        div.appendChild(a);

        var _self = this,
            timeHandler;
        a.addEventListener("canplay", function() {
            _self.oAudio.$readyHook({type:"ready"});
        }, false);
        a.addEventListener("timeupdate", timeHandler = function(e) {
            //console.dir(e);
            //console.log("playing: ", _self.player.currentTime, _self.player.duration);
            _self.playheadTime = parseInt(_self.player.currentTime || 0) * 1000;
            _self.totalTime    = parseInt(_self.player.duration) * 1000;
            _self.oAudio.$changeHook({
                type        : "change",
                playheadTime: _self.playheadTime,
                totalTime   : _self.totalTime
            });
        }, false);
        a.addEventListener("duration", timeHandler, false);
        a.addEventListener("volumechange", function() {
            _self.oAudio.$changeHook({
                type   : "change",
                volume : _self.player.muted ? 0 : parseInt(_self.player.volume) * 100
            });
        }, false);
        a.addEventListener("progress", function(e) {
            _self.bytesLoaded = e.loaded;
            _self.totalBytes  = e.total;
            _self.oAudio.$progressHook({
                type       : "progress",
                bytesLoaded: _self.bytesLoaded,
                totalBytes : _self.totalBytes
            });
        }, false);
        a.addEventListener("ended", function() {
            _self.oAudio.$completeHook({type:"complete"});
        }, false);
        a.addEventListener("error", function(e) {
            throw new Error(apf.formatErrorString(0, _self, "Audio playback",
                e.message, _self.oAudio));
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
