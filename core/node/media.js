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

__MEDIA__ = 1 << 20;

// #ifdef __WITH_MEDIA

/**
 * Interface that adds Media node features and dynamics to this Component.
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#media7
 *
 * @constructor
 * @baseclass
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.Media = function(){
    this.__regbase = this.__regbase | __MEDIA__;
    
    this.__booleanProperties["paused"]   = true;
    this.__booleanProperties["seeking"]  = true;
    this.__booleanProperties["autoplay"] = true;
    this.__booleanProperties["controls"] = true;
    
    this.__supportedProperties.push("position", "networkState", "readyState", 
        "buffered", "bufferedBytes", "totalBytes", "currentTime", "paused", 
        "seeking", "volume", "type", "src", "autoplay", "controls");

    this.__propHandlers["readyState"] = function(value){ //in seconds
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
            if (this.dispatchEvent("ondataunavailable", {
                error   : oError,
                bubbles : true
              }) === false)
                throw oError;
        }
        else if (value == jpf.Media.CAN_SHOW_CURRENT_FRAME)
            this.dispatchEvent("oncanshowcurrentframe");
        else if (value == jpf.Media.CAN_PLAY)
            this.dispatchEvent("oncanplay");
        else if (value == jpf.Media.CAN_PLAY_THROUGH)
            this.dispatchEvent("oncanplaythrough");
    };
    
    this.__propHandlers["position"] = function(value){
        if (this.duration > 0 && this.seek) {
            var isPlaying = !this.paused;
            if (isPlaying)
                this.pause();
                
            this.seek(Math.round(value * this.duration));
            
            this.setProperty('paused', !isPlaying);
        }
    };
    
    this.__propHandlers["currentTime"] = function(value){ //in seconds
        if (value >= 0 && this.seek)
            this.seek(value);
    };

    this.__propHandlers["volume"] = function(value){
        if (value < 1 && value > 0)
            value = value * 100;
        if (this.value > 0) {
            if (this.setVolume) 
                this.setVolume(value);
            this.muted = false;
        }
        else 
            this.muted = true;
    };

    this.__propHandlers["paused"] = function(value){
        if (this.player) {
            this.paused = jpf.isTrue(value);
            if (this.paused)
                this.player.pause();
            else
                this.player.play();
        }
    };

    this.__propHandlers["type"] = function(value){
        //@fixme are we going to support this... please mail the author with a
        //       valid reason! ;)
        
        //@fixme dynamically change player type
        this.playerType = this.__getPlayerType(value);
        
        // sanity checking
        if (!this.playerType || !this.__isSupported()) {
            this.oExt.innerHTML = this.notSupported;
            return;
        }
        
        this.__initPlayer();
    };

    this.__propHandlers["src"] = function(value){
        //@todo implement the change of src in real time (complex!)
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

        if (this.currentSrc && this.src != this.currentSrc && this.networkState !== jpf.Media.LOADING) {
            var type = this.__guessType(this.src);
            if (type == this.type) {
                this.reset();
                this.load();
            }
            else {
                //this.__destroy();
                this.__propHandlers['type'].call(this, type);
            }
        }
    };

    this.__propHandlers["ID3"] = function(value){
        // usually this feature is only made available BY media as getters
        if (typeof this.player.setID3 == "function")
            this.player.setID3(value);
    };
    
    // error state
    this.MediaError = function(sMsg) {
        return new Error(jpf.formatErrorString(0, this, "Media", sMsg));
    };
    
    
    // network state
    this.src = this.currentSrc = null;
    this.networkState       = jpf.Media.EMPTY; //default state
    this.bufferingRate      = 0;
    this.bufferingThrottled = false;
    this.buffered           = null; //TimeRanges container {start: Function(idx):Float, end: Function(idx):Float, length: n}
    this.bufferedBytes      = null; //ByteRanges container {start: Function(idx):Number, end: Function(idx):Number, length: n}
    this.totalBytes         = 0;
    this.volume             = 100;
    
    this.load = function() {
        //must be overridden by the component
    };

    this.reset = function() {
        this.setProperty('networkState', jpf.Media.EMPTY);
        //this.setProperty('readyState',   jpf.Media.DATA_UNAVAILABLE);
        this.buffered = this.bufferedBytes = null;
        this.totalBytes = 0;

        this.seeking = false;
        this.setProperty('paused', true);
        this.setProperty('position', 0);
        this.currentTime = this.duration = 0;
        this.played = this.seekable = null;
        this.ended  = false;

        this.start = this.end = this.loopStart = this.loopEnd =
            this.playCount = this.currentLoop = 0;
        this.controls = this.muted = false;
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