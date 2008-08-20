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
    
    this.__supportedProperties = ["position", "networkState", "readyState", "currentTime", "paused", "seeking", "volume", "type", "src"];
    this.__handlePropSet = function(prop, value) {
        switch (prop) {
            case "position":
                if (this.duration > 0 && this.seek) {
                    var isPlaying = !this.paused;
                    if (isPlaying)
                        this.pause();
                    this.seek(Math.round(value * this.duration));
                    if (isPlaying)
                        this.play();
                    else
                        this.pause();
                }
                break;
            case "currentTime": //in seconds
                if (value >= 0 && this.seek)
                    this.seek(value);
                break;
            case "volume":
                if (value < 1 && value > 0)
                    value = value * 100;
                if (this.value > 0) {
                    if (this.setVolume) 
                        this.setVolume(value);
                    this.muted = false;
                }
                else 
                    this.muted = true;
                break;
            case "type":
                //this.__reinitPlayer();
                break;
            case "src":
                //this.__changeSource(this.sc);
                break;
        }
    }
    
    // error state
    this.MediaError = function(sMsg) {
        return new Error(0, jpf.formatErrorString(this, sMsg));
    }
    
    // network state
    this.src = this.currentSrc = null;
    this.networkState       = jpf.Media.EMPTY; //default state
    this.bufferingRate      = 0;
    this.bufferingThrottled = false;
    this.buffered           = null; //TimeRanges container
    this.bufferedBytes      = null; //ByteRanges container {start: x, end: y}
    this.totalBytes         = 0;
    
    this.load = function() {
        //must be overridden by the component
    };
    
    // ready state
    this.readyState = jpf.Media.DATA_UNAVAILABLE;
    this.seeking    = false;
    
    // playback state
    this.currentTime         = this.duration = 0;
    this.paused              = true;
    this.defaultPlaybackRate = playbackRate = 0;
    this.played              = null; // TimeRanges container
    this.seekable            = null; // TimeRanges container
    this.ended = this.autoplay = false;
    
    this.play = function() {
        if (this.player && this.paused)
            this.player.play();
    };
    this.pause = function() {
        if (this.player && !this.paused)
            this.player.pause();
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
    this.volume   = 0;
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