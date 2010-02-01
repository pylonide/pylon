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

// #ifdef __WITH_VIDEO_VLC && (__AMLVIDEO || __INC_ALL)

apf.video.TypeVlcCompat = (function() {
    var iVersion = 0;

    function getVersion() {
        if (iVersion !== 0)
            return iVersion;

        var hasVlc  = false,
            version = 0;

        if (apf.isWin && apf.isIE) {  //use ActiveX test
            var oVlc;
            try{
                oVlc    = new ActiveXObject("VideoLAN.VLCPlugin.2");
                hasVlc  = true;
                version = "0.8.6";
            }
            catch(e){
                try {
                    oVlc    = new ActiveXObject("VideoLAN.VLCPlugin.1");
                    hasVlc  = true;
                    version = "0.8.5";
                }
                catch(e) {
                    hasVlc  = false;
                }
            }
        }
        else {  //use plugin test (this not tested yet)
            for (var i = 0, j = navigator.plugins.length; i < j && !hasVlc; i++) {
                if (navigator.plugins[i].name.indexOf("VLC") != -1) {
                    hasVlc = true;
                    version = navigator.plugins[i].description.match(/Version ([0-9\.]+)/)[1];
                }
            }
        }

        version = version.split(".")
        return iVersion = parseFloat(version.shift() + "." + version.join(""));
    }

    function isAvailable() {
        return (getVersion() >= 0.86);
    }

    function getHtml(id, width, height, options) {
        var i, out = [], options = options || {};
        if (apf.isIE) {
            out.push('<object id="', id, '"  \
                codebase="http://downloads.videolan.org/pub/videolan/vlc/latest/win32/axvlc.cab"  \
                classid="clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921" \
                width="', width, '" height="', height, '">');
            for (i in options)
                out.push('<param name="', i, '" value="', options[i], '" />');
            out.push('</object>');
        }
        else {
            out.push('<embed type="application/x-vlc-plugin" \
                pluginspage="http://www.videolan.org" version="',
                ((getVersion() >= 0.86) ? "VideoLAN.VLCPlugin.2" : "VideoLAN.VLCPlugin.1"),
                '" width="', width, '" height="', height, '" id="', id,
                '" name="', id, '"');
            for (i in options)
                out.push(' ', i, '="', options[i], '"');
            out.push(' />');
        }

        return out.join("");
    }

    return {
        getHtml    : getHtml,
        getVersion : getVersion,
        isAvailable: isAvailable
    };
})();

/**
 * Element displaying a VLC video
 * NOTE: might not work under windows, because of a bug in the VLC browser plugins:
 *
 *
 * @classDescription This class creates a new VLC video player
 * @return {TypeVlc} Returns a new VLC video player
 * @type {TypeVlc}
 * @constructor
 * @addnode elements:video
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
apf.video.TypeVlc = function(oVideo, node, options) {
    this.oVideo      = oVideo;
    this.name        = "VLC_" + this.oVideo.$uniqueId;
    this.htmlElement = node;
    this.ready       = false;
    this.currState   = null;
    this.currItem    = -1;
    this.videoPath   = options.src;

    this.player    = this.pollTimer = null;
    apf.extend(this, apf.video.TypeInterface);

    this.setOptions(options);
    var _self = this;
    window.setTimeout(function() {
        _self.oVideo.$initHook({state: 1});
    }, 1);
};

apf.video.TypeVlc.isSupported = function(){
    return apf.video.TypeVlcCompat.isAvailable();
};

apf.video.TypeVlc.prototype = {
    /**
     * Play a Quicktime movie. Does a call to the embedded QT object to load or
     * load & play the video, depending on the 'autoPlay' flag (TRUE for play).
     *
     * @param {String} videoPath Path to the movie.
     * @type  {Object}
     */
    load: function(videoPath) {
        // TODO: turn into a MRL
        this.videoPath = videoPath.splitSafe(",")[this.oVideo.$lastMimeType] || videoPath;
        return this.$draw();
    },

    /**
     * Play and/ or resume a video that has been loaded already
     *
     * @type {Object}
     */
    play: function() {
        if (!this.player) return this;
        if (this.pollTimer)
            this.player.playlist.play();
        else if (this.currItem != -1) {
            // play MRL
            this.player.playlist.playItem(this.currItem);
            this.startPlayPoll();
        }

        return this;
    },

    /**
     * Toggle the pause state of the video.
     *
     * @type {Object}
     */
    pause: function() {
        if (this.player && this.player.playlist.isPlaying)
            this.player.playlist.togglePause();

        return this;
    },

    /**
     * Stop playback of the video.
     *
     * @type {Object}
     */
    stop: function() {
        if (!this.player) return this;
        this.player.stop();
        this.stopPlayPoll();

        return this;
    },

    /**
     * Seek the video to a specific position.
     *
     * @param {Number} iTo The number of seconds to seek the playhead to.
     * @type  {Object}
     */
    seek: function(iTo) {
        if (this.player)
            this.player.input.time = iTo;
        return this;
    },

    /**
     * Set the fullscreen property of the video to switch between fullscreen and
     * normal mode.
     *
     * @param {Boolean} value Set to TRUE is switching to fullscreen mode is required
     * @type  {Object}
     */
    setFullscreen : function(value){
        if (this.player)
            this.player.video.fullscreen = value;
        return this;
    },

    /**
     * Set the volume of the video to a specific range (0 - 200)
     *
     * @param {Number} iVolume
     * @type  {Object}
     */
    setVolume: function(iVolume) {
        if (this.player && this.player.audio)
            this.player.audio.volume = (iVolume * 2);
        return this;
    },

    /**
     * Retrieve the total playtime of the video, in milliseconds.
     *
     * @type {Number}
     */
    getTotalTime: function() {
        if (!this.player)
            return 0;
        return Math.round(this.player.input.length);
    },

    /**
     * Draw the HTML for a Windows Media Player video control (<OBJECT> tag)
     * onto the browser canvas into a container element (usually a <DIV>).
     * When set, it captures the reference to the newly created object.
     *
     * @type {Object}
     */
    $draw: function() {
        if (this.player) {
            this.player.clear_playlist()
            this.stopPlayPoll();
            delete this.player;
            this.player = null;
        }

        var playerId = this.name + "_Player";

        this.htmlElement.innerHTML = apf.video.TypeVlcCompat.getHtml(playerId,
            "100%", "100%", {
                //MRL        : "",
                ShowDisplay: "True",
                AutoLoop   : "False",
                AutoPlay   : "False",
                Volume     : this.volume,
                StartTime  : 0
            });

        var _self = this;
        window.setTimeout(function() {
            _self.player = _self.getElement(playerId);
            _self.player.log.verbosity = 10; // disable VLC error logging

            _self.currItem = parseInt(_self.player.playlist.add(_self.videoPath, _self.videoPath,
                apf.isIE ? [] : ""));
            if (_self.autoPlay)
                _self.play();
        });

        return this;
    },

    /**
     * Callback from flash; whenever the Window Media Player video bubbles an
     * event up to the javascript interface, it passes through to this function.
     *
     * @param {Number} iState
     * @type  {Object}
     */
    handleEvent: function(iState) {
        // #ifdef __DEBUG
        if (this.player.log.messages.count > 0) {
            // there is one or more messages in the log
            var iter = this.player.log.messages.iterator();
            while (iter.hasNext) {
                var msg = iter.next();
                var msgtype = msg.type.toString();
                //apf.console.info(msg.message);
            }
            // clear the log once finished to avoid clogging
            this.player.log.messages.clear();
        }
        // #endif
        if (iState != this.currState) {
            this.currState = iState;
            if (!this.ready && (iState == 3 || iState == 4)) {
                this.oVideo.$stateChangeHook({type: "ready"});
                this.ready = true;
            }
            switch (iState) {
                case 0:   //IDLE/CLOSE - Playback of the current media clip is stopped.
                case 8:   //ENDED - Media has completed playback and is at its end.
                    this.oVideo.$completeHook({type: "complete"});
                    this.stopPlayPoll();
                    break;
                case 3:   //PLAYING - The current media clip is playing.
                    this.oVideo.$stateChangeHook({type: "stateChange", state: "playing"});
                    if (!this.oVideo.ready) {
                        this.oVideo.setProperty("readyState", apf.Media.HAVE_ENOUGH_DATA);
                        // @todo for now, set the downloadprogress to a maximum
                        this.oVideo.$progressHook({bytesLoaded: 100, totalBytes: 100});
                    }
                    this.startPlayPoll();
                    break;
                case 4:   //PAUSED - Playback of the current media clip is paused. When media is paused, resuming playback begins from the same location.
                    this.oVideo.$stateChangeHook({type: "stateChange", state: "paused"});
                    this.stopPlayPoll();
                    break;
                case 1:  //OPENING   - Connection is established, however the server is not sending bits. Waiting for session to begin.
                case 2:  //BUFFERING - The current media clip is getting additional data from the server.
                case 5:  //STOPPING
                case 6:  //FORWARD   - The current media clip is fast forwarding.
                case 7:  //BACKWARD  - The current media clip is fast rewinding.
                case 9:  //ERROR
                    //alert('gettin here... what code? '  +iState);
                    break;
            }
        }
        if (iState == 3) { //PLAYING
            this.oVideo.$changeHook({
                type        : "change",
                playheadTime: Math.round(this.player.input.time)
            });
        }

        return this;
    },

    /**
     * Start the polling mechanism that checks for progress in playtime of the
     * video.
     *
     * @type {Object}
     */
    startPlayPoll: function() {
        clearTimeout(this.pollTimer);
        var _self = this;
        this.pollTimer = $setTimeout(function() {
            if (!_self.player) return;
            _self.handleEvent(_self.player.input.state)
            _self.startPlayPoll();
        }, 500);
        return this;
    },

    /**
     * Stop the polling mechanism, started by startPlayPoll().
     *
     * @type {Object}
     */
    stopPlayPoll: function() {
        clearTimeout(this.pollTimer);
        return this;
    },

    $destroy: function() {
        this.stopPlayPoll();
        if (this.player) {
            //this.player = null;
            delete this.player;
        }
        this.htmlElement.innerHTML = "";
        this.oVideo = this.htmlElement = null;
        delete this.oVideo;
        delete this.htmlElement;
    }
};
// #endif
