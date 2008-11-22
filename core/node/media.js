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

var __MEDIA__ = 1 << 20;

// #ifdef __WITH_MEDIA

/**
 * Interface that adds Media node features and dynamics to this Element.
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#media7
 *
 * @constructor
 * @baseclass
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.Media = function(){
    this.$regbase = this.$regbase | __MEDIA__;

    this.$booleanProperties["paused"]   = true;
    this.$booleanProperties["seeking"]  = true;
    this.$booleanProperties["autoplay"] = true;
    this.$booleanProperties["controls"] = true;

    this.$supportedProperties.push("position", "networkState", "readyState",
        "buffered", "bufferedBytes", "totalBytes", "currentTime", "paused",
        "seeking", "volume", "type", "src", "autoplay", "controls");

    this.$propHandlers["readyState"] = function(value){ //in seconds
        if (this.readyState !== value)
            this.readyState = value;
        if (value == jpf.Media.DATA_UNAVAILABLE) {
            // #ifdef __DEBUG
            jpf.console.error("Unable to open medium with URL '" + this.src
                + "'. Please check if the URL you entered as src is pointing to \
                   a valid resource.");
            // #endif

            var oError = this.MediaError("Unable to open medium with URL '" + this.src
                + "'. Please check if the URL you entered as src is pointing to \
                   a valid resource.");
            if (this.dispatchEvent("dataunavailable", {
                error   : oError,
                bubbles : true
              }) === false)
                throw oError;
        }
        else if (value == jpf.Media.CAN_SHOW_CURRENT_FRAME)
            this.dispatchEvent("canshowcurrentframe");
        else if (value == jpf.Media.CAN_PLAY)
            this.dispatchEvent("canplay");
        else if (value == jpf.Media.CAN_PLAY_THROUGH)
            this.dispatchEvent("canplaythrough");
    };

    this.$propHandlers["position"] = function(value){
        if (this.duration > 0 && this.seek) {
            var isPlaying = !this.paused;
            if (isPlaying)
                this.pause();

            this.seek(Math.round(value * this.duration));

            this.setProperty('paused', !isPlaying);
        }
    };

    this.$propHandlers["currentTime"] = function(value){ //in milliseconds
        if (value >= 0 && this.seek)
            this.seek(value);
    };

    this.$propHandlers["volume"] = function(value){
        if (value < 1 && value > 0)
            value = value * 100;
        if (value >= 0) {
            if (this.setVolume)
                this.setVolume(value);
            this.muted = !(value > 0);
        }
        else
            this.muted = true;
    };

    this.$propHandlers["paused"] = function(value){
        if (this.player) {
            this.paused = jpf.isTrue(value);
            if (this.paused)
                this.player.pause();
            else
                this.player.play();
        }
    };

    var loadTimer = null;

    this.$propHandlers["type"] = function(value){
        if (loadTimer) return;

        var _self = this;
        loadTimer = window.setTimeout(function() {
            reload.call(_self);
        });
    };

    this.$propHandlers["src"] = function(value){
        if (loadTimer) return;

        var oUrl = new jpf.url(value);
        this.src = oUrl.uri;

        // #ifdef __DEBUG
        if (!oUrl.isSameLocation())
            jpf.console.warn("Media player: the medium with URL '" + this.src + "' \
                does not have the same origin as your web application. This can \
                cause the medium to not load and/ or play.", "media");
        if (oUrl.protocol == "file")
            jpf.console.warn("Media player: the medium with URL '" + this.src + "' \
                will be loaded through the 'file://' protocol. This can \
                cause the medium to not load and/ or play.", "media");
        // #endif

        if (this.src != this.currentSrc && this.networkState !== jpf.Media.LOADING) {
            var type = this.$guessType(this.src);
            if (type == this.type) {
                reset.call(this);
                this.load();
            }
            else {
                this.type = type;
                var _self = this;
                loadTimer = window.setTimeout(function() {
                    reload.call(_self);
                });
            }
        }
    };

    this.$propHandlers["ID3"] = function(value){
        // usually this feature is only made available BY media as getters
        if (typeof this.player.setID3 == "function")
            this.player.setID3(value);
    };

    /**** DOM Hooks ****/

    this.$domHandlers["remove"].push(function(doOnlyAdmin){
        jpf.console.log('Media: removing node...');
        reset.call(this);
    });

    this.$domHandlers["reparent"].push(function(beforeNode, pNode, withinParent){
        if (!this.$jmlLoaded)
            return;

        jpf.console.log('Media: reparenting - ', beforeNode, pNode);
        this.$draw();
        reload.call(this, true);
    });

    function reset() {
        this.setProperty('networkState',  jpf.Media.EMPTY);
        //this.setProperty('readyState',   jpf.Media.DATA_UNAVAILABLE);
        this.setProperty('buffered',      {start: 0, end: 0, length: 0});
        this.setProperty('bufferedBytes', {start: 0, end: 0, length: 0});
        this.setProperty('totalBytes',    0);

        this.setProperty('seeking',  false);
        this.setProperty('paused',   true);
        this.setProperty('position', 0);
        this.currentTime = this.duration = 0;
        this.played = this.seekable = null;
        this.ended  = false;

        this.start = this.end = this.loopStart = this.loopEnd =
            this.playCount = this.currentLoop = 0;
        this.controls = this.muted = false;
    }

    function reload(bNoReset) {
        jpf.console.log('Media: reloading medium with mimetype ', this.type);
        window.clearTimeout(loadTimer);
        loadTimer = null;

        if (!bNoReset)
            reset.call(this);

        this.$destroy(true); //bRuntime = true

        this.playerType = this.$getPlayerType(this.type);

        // sanity checking
        if (!this.playerType || !this.$isSupported()) {
            this.oExt.innerHTML = this.notSupported;
            return;
        }

        this.$initPlayer();
    }

    // error state
    this.MediaError = function(sMsg) {
        return new Error(jpf.formatErrorString(0, this, "Media", sMsg));
    };


    // network state
    this.src = this.currentSrc = null;
    this.networkState       = jpf.Media.EMPTY; //default state
    this.bufferingRate      = 0;
    this.bufferingThrottled = false;
    this.buffered           = {start: 0, end: 0, length: 0}; //TimeRanges container {start: Function(idx):Float, end: Function(idx):Float, length: n}
    this.bufferedBytes      = {start: 0, end: 0, length: 0}; //ByteRanges container {start: Function(idx):Number, end: Function(idx):Number, length: n}
    this.totalBytes         = 0;
    this.volume             = 100;

    this.load = function() {
        //must be overridden by the component
    };

    // ready state
    this.readyState = jpf.Media.DATA_UNAVAILABLE;
    this.seeking    = false;

    // playback state
    this.currentTime         = this.duration = 0;
    this.paused              = true;
    this.defaultPlaybackRate = this.playbackRate = 0;
    this.played              = null; // TimeRanges container
    this.seekable            = null; // TimeRanges container
    this.ended = this.autoplay = false;

    this.play = function() {
        this.setProperty('paused', false);
    };

    this.pause = function() {
        this.setProperty('paused', true);
    };

    // looping
    this.start = this.end = this.loopStart = this.loopEnd =
    this.playCount = this.currentLoop = 0;

    // cue ranges
    this.addCueRange = function(sClassName, sId, iStart, iEnd, bPauseOnExit, fEnterCallback, fExitCallback) {
        //to be overridden by the component
    };

    this.removeCueRanges = function(sClassName) {
        //to be overridden by the component
    };

    /**
     * Return a counter as you commonly see in front panels of CD/ DVD players
     *
     * @link  http://php.net/strftime
     * @param {Number}  iMillis  Amount of milliseconds to transform in a counter
     * @param {String}  sFormat  Format of the counter is the form of PHP's strftime function:
     *                             %H - hour as a decimal number using a 24-hour clock (range 00 to 23)
     *                             %M - minute as a decimal number
     *                             %S - second as a decimal number
     *                             %Q - Millisecond as decimal (000-999)
     *                             %n - newline character
     *                             %t - tab character
     *                             %T - current time, equal to %H:%M:%S
     *                             %% - a literal `%' character
     * @param {Boolean} bReverse Show the counter in reverse notation (countdown)
     * @type  {String}
     */
    this.getCounter = function(iMillis, sFormat, bReverse) {
        // for String.pad, 'jpf.PAD_LEFT' is implicit
        if (bReverse)
            iMillis = iMillis - this.duration;
        var iSeconds = Math.round(Math.abs(iMillis / 1000)),
            sHours   = String(Math.round(Math.abs(iSeconds / 60 / 60))).pad(2, "0"),
            sMinutes = String(Math.round(Math.abs(iSeconds / 60))).pad(2, "0"),
            sSeconds = String(iSeconds).pad(2, "0"),
            sMillis  = String(Math.round(Math.abs(iMillis % 1000))).pad(3, "0");
        return (bReverse ? "- " : "") + sFormat.replace(/\%T/g, "%H:%M:%S")
            .replace(/\%[a-zA-Z\%]/g, function(sMatch) {
                switch (sMatch) {
                case "%H":
                    return sHours;
                case "%M":
                    return sMinutes;
                case "%S":
                    return sSeconds;
                case "%Q":
                    return sMillis;
                case "%n":
                    return "\n";
                case "%t":
                    return "\t";
                case "%%":
                    return "%";
                }
            });
    };

    // controls
    this.controls = this.muted = false;
}

// network state (.networkState)
jpf.Media.EMPTY              = 0;
jpf.Media.LOADING            = 1;
jpf.Media.LOADED_METADATA    = 2;
jpf.Media.LOADED_FIRST_FRAME = 3;
jpf.Media.LOADED             = 4;

// ready state (.readyState)
jpf.Media.DATA_UNAVAILABLE       = 0;
jpf.Media.CAN_SHOW_CURRENT_FRAME = 1;
jpf.Media.CAN_PLAY               = 2;
jpf.Media.CAN_PLAY_THROUGH       = 3;

// #endif
