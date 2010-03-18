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
 * Element that is able to play an audio file or remote stream
 * Example:
 * <code>
 *  <a:audio id="myAudio"
 *   src      = "http://my-mediaserver.com/demo.mp3"
 *   autoplay = "true"
 *   volume   = "20">
 *    Audio Codec not supported.
 *  </a:audio>
 * </code>
 * 
 * @return {Audio} Returns a new audio
 * @type {Audio}
 * @inherits apf.Media
 * @constructor
 * @allowchild {text}
 * @addnode elements:audio
 *
 * @link http://www.whatwg.org/specs/web-apps/current-work/#audio
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
apf.audio = function(struct, tagName){
    this.$init(tagName || "audio", apf.NODE_VISIBLE, struct);
};

(function() {
    this.$supportedProperties.push("waveform", "peak", "EQ", "ID3");

    this.$mainBind = "src";

    /**
     * Load a audio by setting the URL pointer to a different audio file
     *
     * @param {String} sAudio
     * @type {Object}
     */
    this.loadMedia = function() {
        if (!this.player) return this;

        this.setProperty("currentSrc",   this.src);
        this.setProperty("networkState", apf.Media.NETWORK_LOADING);
        this.player.load(this.src);
        return this;
    };

    /**
     * Seek the audio to a specific position.
     *
     * @param {Number} iTo The number of seconds to seek the playhead to.
     * @type {Object}
     */
    this.seek = function(iTo) {
        if (this.player && iTo >= 0 && iTo <= this.duration)
            this.player.seek(iTo);
    };

    /**
     * Set the volume of the audio to a specific range (0 - 100)
     *
     * @param {Number} iVolume
     * @type {Object}
     */
    this.setVolume = function(iVolume) {
        if (this.player)
            this.player.setVolume(iVolume);
    };

    /**
     * Guess the mime-type of a audio file, based on its filename/ extension.
     *
     * @param {String} path
     * @type {String}
     */
    this.$guessType = function(path) {
        // make a best-guess, based on the extension of the src attribute (file name)
        var ext  = path.substr(path.lastIndexOf(".") + 1),
            type = "";
        if (apf.hasAudio && ((ext == "ogg" || ext == "wav") || (ext == "mp3" && apf.isWebkit)))
            type = "audio/ogg";
        else if (ext == "mp3")
            type = "audio/flash";

        return type;
    };

    /**
     * Find the correct audio player type that will be able to playback the audio
     * file with a specific mime-type provided.
     *
     * @param {String} mimeType
     * @type {String}
     */
    this.$getPlayerType = function(mimeType) {
        if (!mimeType) return null;

        var playerType = null;

        var aMimeTypes = mimeType.splitSafe(",");
        if (aMimeTypes.length == 1)
            aMimeTypes = aMimeTypes[0].splitSafe(";");

        for (var i = 0, l = aMimeTypes.length; i < l; i++) {
            if (mimeType.indexOf("ogg") > -1)
                playerType = "TypeNative";
            if (mimeType.indexOf("flash") > -1)
                playerType = "TypeFlash";
            else if (mimeType.indexOf("quicktime") > -1)
                playerType = "TypeQT";
            else if (mimeType.indexOf("wmv") > -1)
                playerType = apf.isMac ? "TypeQT" : "TypeWmp";
            else if (mimeType.indexOf("silverlight") > -1)
                playerType = "TypeSilverlight";

            if (this.$isSupported(playerType))
                return playerType;
        }

        return playerType;
    };

    /**
     * Checks if a specified playerType is supported by APF or not...
     *
     * @param {String} [playerType]
     * @type {Boolean}
     */
    this.$isSupported = function(playerType) {
        playerType = playerType || this.playerType;
        return (apf.audio[playerType]
            && apf.audio[playerType].isSupported());
    };

    /**
     * Initialize and instantiate the audio player provided by getPlayerType()
     *
     * @type {Object}
     */
    this.$initPlayer = function() {
        this.player = new apf.audio[this.playerType](this, this.$ext, {
            src         : this.src,
            width       : this.width,
            height      : this.height,
            autoLoad    : true,
            autoPlay    : this.autoplay,
            showControls: this.controls,
            volume      : this.volume,
            mimeType    : this.type
        });
        return this;
    };

    /**
     * The 'init' event hook is called when the player control has been initialized;
     * usually that means that the active control (flash, QT or WMP) has been loaded
     * and is ready to load a file.
     * Possible initialization errors are also passed to this function.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$initHook = function(e) {
        if (e.error) {
            var oError = this.MediaError(e.error);
            if (this.dispatchEvent("error", {
                error  : oError,
                bubbles: true
              }) === false)
                throw oError;
        }

        this.loadMedia();
    };

    /**
     * The 'cuePoint' event hook is called when the player has set a cue point in
     * the audio file.
     *
     * @ignore
     * @type {void}
     */
    this.$cuePointHook = function() {}; //ignored

    /**
     * The 'playheadUpdate' event hook is called when the position of the playhead
     * that is currently active (or 'playing') is updated.
     * This feature is currently handled by {@link element.audio.method.$changeHook}
     *
     * @ignore
     * @type {void}
     */
    this.$playheadUpdateHook = function() {}; //ignored

    /**
     * The 'error' event hook is called when an error occurs within the internals
     * of the player control.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$errorHook = function(e) {
        apf.console.log("Error: <audio>");
        apf.console.error(e.error);
    };

    /**
     * The 'progress' event hook is called when the progress of the loading sequence
     * of an audio file is updated. The control signals us on how many bytes are
     * loaded and how many still remain.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$progressHook = function(e) {
        // bytesLoaded, totalBytes
        this.setProperty("bufferedBytes", {start: 0, end: e.bytesLoaded, length: e.bytesLoaded});
        this.setProperty("totalBytes", e.totalBytes);
        var iDiff = Math.abs(e.bytesLoaded - e.totalBytes);
        if (iDiff <= 20)
            this.setProperty("readyState", apf.Media.HAVE_ENOUGH_DATA);
    };

    /**
     * The 'stateChange' event hook is called when the internal state of a control
     * changes. The state of internal properties of an audio control may be
     * propagated through this function.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$stateChangeHook = function(e) {
        //for audio, we only use this for connection errors: connectionError
        if (e.state == "connectionError") {
            this.networkState = apf.Media.HAVE_NOTHING;
            //this.setProperty("readyState", this.networkState);
            this.$propHandlers["readyState"].call(this, this.networkState);
        }
    };

    /**
     * The 'change' event hook is called when a) the volume level changes or
     * b) when the playhead position changes.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$changeHook = function(e) {
        if (typeof e.volume != "undefined") {
            this.volume = e.volume;
            this.muted  = (e.volume > 0);
            this.setProperty("volume", e.volume);
        }
        else {
            this.duration = this.player.getTotalTime();
            this.position = e.playheadTime / this.duration;
            if (isNaN(this.position)) return;
            this.setProperty("position", this.position);
            this.currentTime = e.playheadTime;
            this.setProperty("currentTime", this.currentTime);
        }
    };

    /**
     * The 'complete' event hook is called when a control has finished playing
     * an audio file completely, i.e. the progress is at 100%.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$completeHook = function(e) {
        this.paused = true;
        this.setProperty("paused", true);
    };

    /**
     * When a audio player signals that is has initialized properly and is ready
     * to play, this function sets all the flags and behaviors properly.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {Object}
     */
    this.$readyHook = function(e) {
        this.setProperty("networkState", apf.Media.NETWORK_LOADED);
        this.setProperty("readyState",   apf.Media.HAVE_FUTURE_DATA);
        this.setProperty("duration",     this.player.getTotalTime());
        this.seeking  = false;
        this.seekable = true;
        this.setProperty("seeking", false);
        if (this.autoplay)
            this.play();
        return this;
    };

    /**
     * The 'metadata' event hook is called when a control receives metadata of an
     * audio file, like ID3, waveform pattern, peak and equalizer data.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$metadataHook = function(e) {
        this.oVideo.setProperty("readyState", apf.Media.HAVE_METADATA);
        if (e.waveData)
            this.setProperty("waveform", e.waveData);
        if (e.peakData)
            this.setProperty("peak", e.peakData);
        if (e.eqData)
            this.setProperty("EQ", e.eqData);
        if (e.id3Data)
            this.setProperty("ID3", e.id3Data);
    };

    /**
     * Build Main Skin
     *
     * @type {void}
     */
    this.$draw = function(){
        this.$ext = this.$pHtmlNode.appendChild(document.createElement("div"));
        this.$ext.className = "apf_audio " + (this.getAttributeNode("class") || "");
        this.$ext;
    };

    /**
     * Parse the block of AML that constructs the HTML5 compatible <AUDIO> tag
     * for arguments like URL of the audio, volume, mimetype, etc.
     *
     * @type {void}
     */
    this.addEventListener("DOMNodeInsertedIntoDocument", function() {
        if (this.setSource())
            this.$propHandlers["type"].call(this, this.type);
    });

    this.$destroy = function(bRuntime) {
        if (this.player && this.player.$detroy)
            this.player.$destroy();
        delete this.player;
        this.player = null;

        if (bRuntime)
            this.$ext.innerHTML = "";
    };
}).call(apf.audio.prototype = new apf.Media());

apf.aml.setElement("audio", apf.audio);

apf.audio.TypeInterface = {
    properties: ["src", "volume", "showControls", "autoPlay", "totalTime", "mimeType"],

    /**
     * Set and/or override the properties of this object to the values
     * specified in the opions argument.
     *
     * @param {Object} options
     * @type {Object}
     */
    setOptions: function(options) {
        if (options == null) return this;
        // Create a hash of acceptable properties
        var hash = this.properties;
        for (var i = 0; i < hash.length; i++) {
            var prop = hash[i];
            if (options[prop] == null) continue;
            this[prop] = options[prop];
        }
        return this;
    },

    /**
     * Utility method; get an element from the browser's document object, by ID.
     *
     * @param {Object} id
     * @type {HTMLDomElement}
     */
    getElement: function(id) {
        return apf.flash.getElement(id);
    }
};

// #endif
