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

apf.video.TypeWmpCompat = (function() {
    var hasWMP = false;

    /**
     * Windows Media Player checking code adapted from
     * eMedia Communications Strategies information and Microsoft documentation
     * see http://www.learningapi.com/sm5/articlesm5.html
     * and http://support.microsoft.com/default.aspx?scid=kb;en-us;279022
     *
     * Note: Windows Media Player version 7+ ships with the old 6.4
     *       control as well as the newest version.  For this reason,
     *       is_WMP64 will remain true even if is_WMP7up
     *       is set to true.
     *
     * @type {Number}
     */
    function WMP_getVersion() {
        var is_WMP64  = false,
            is_WMP7up = false;

        if (apf.isWin && apf.isIE) {  //use ActiveX test
            var oMP;
            try {
                oMP      = new ActiveXObject("MediaPlayer.MediaPlayer.1");
                hasWMP   = true;
                is_WMP64 = true;
            }
            catch (objError) {
                hasWMP   = false;
                is_WMP64 = false;
            }

            if (hasWMP) {
                try {
                    oMP       = new ActiveXObject("WMPlayer.OCX");
                    is_WMP7up = true;
                }
                catch (objError) {
                    is_WMP7up = false;
                }
            }
        }
        else {  //use plugin test (this not tested yet)
            for (var i = 0, j = navigator.plugins.length; i < j; i++) {
                if (navigator.plugins[i].name.indexOf("Windows Media Player") != -1) {
                    hasWMP    = true;
                    is_WMP64  = true;
                    is_WMP7up = true; //no way to know this with certainty, because M$ doesn't provide version info...
                    oMP       = { versionInfo: "7.3" };
                }
            }
        }

        var WMPVer;
        if (is_WMP7up) {
            WMPVer = oMP.versionInfo;
            oMP    = null;
        }
        else
            WMPVer = "6.4";

        return parseFloat(WMPVer);
    }

    /**
     * Create the HTML for a <PARAM> tag inside the <OBJECT> tag of the player.
     *
     * @param {String} name
     * @param {String} value
     * @type  {String}
     */
    function WMP_generateParamTag(name, value) {
        if (!name || !value) return "";
        return '<param name="' + name + '" value="' + value + '" />';
    }

    /**
     * Create the HTML for the Windows Media Player <OBJECT> HTML tag.
     *
     * @param {String} id
     * @param {String} url
     * @param {Number} width
     * @param {Number} height
     * @param {Object} params
     * @type  {String}
     */
    function WMP_generateOBJECTText(id, url, width, height, params) {
        params.URL = url;
        params.src = url;
        params.SendPlayStateChangeEvents = "true";
        params.StretchToFit = "true";
        var out = ['<object id="', id, '" width="', width, '" height="', height, '" \
            classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6" \
            type="application/x-oleobject">'];
        var emb = ['<embed id="', id, 'emb" width="', width, '" height="', height, '"'];
        for (var param in params) {
            if (!param || !params[param]) continue;
            out.push('<param name="', param, '" value="', params[param], '" />');
            emb.push(' ', param, '="', params[param], '"');
        }
        return out.join("") + emb.join("") + " /></object>";
    }

    var bIsAvailable = null;
    /*
     * Checks whether a valid version of Windows Media Player is available on
     * the clients' system. The version number needs to be higher than 7 in order
     * to be able to control the movie with JScript.
     *
     * @type {Boolean}
     */
    function WMP_isAvailable() {
        if (bIsAvailable === null)
            bIsAvailable = WMP_getVersion() >= 7 && hasWMP;
        return bIsAvailable;
    }

    return  {
        isAvailable       : WMP_isAvailable,
        generateOBJECTText: WMP_generateOBJECTText
    }
})();

/**
 * Element displaying a Windows Media Player video
 *
 * @classDescription This class creates a new Windows Media Player video player
 * @return {TypeWmp} Returns a new Windows Media Player video player
 * @type {TypeWmp}
 * @constructor
 * @addnode elements:video
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
apf.video.TypeWmp = function(oVideo, node, options) {
    this.oVideo      = oVideo;
    this.name        = "WMP_" + this.oVideo.$uniqueId;
    this.htmlElement = node;

    this.player    = this.pollTimer = null;
    this.volume    = 50; //default WMP
    this.videoPath = options.src;
    apf.extend(this, apf.video.TypeInterface);

    this.setOptions(options);
    var _self = this;
    window.setTimeout(function() {
        _self.oVideo.$initHook({state: 1});
    }, 1);
};

apf.video.TypeWmp.isSupported = function(){
    return apf.video.TypeWmpCompat.isAvailable();
};

apf.video.TypeWmp.prototype = {
    /**
     * Play a Quicktime movie. Does a call to the embedded QT object to load or
     * load & play the video, depending on the 'autoPlay' flag (TRUE for play).
     *
     * @param {String} videoPath Path to the movie.
     * @type  {Object}
     */
    load: function(videoPath) {
        this.videoPath = videoPath.splitSafe(",")[this.oVideo.$lastMimeType] || videoPath;
        return this.$draw();
    },

    /**
     * Play and/ or resume a video that has been loaded already
     *
     * @type {Object}
     */
    play: function() {
        if (this.player)
            this.player.controls.play();

        return this;
    },

    /**
     * Toggle the pause state of the video.
     *
     * @type {Object}
     */
    pause: function() {
        if (this.player)
            this.player.controls.pause();
        return this;
    },

    /**
     * Stop playback of the video.
     *
     * @type {Object}
     */
    stop: function() {
        if (this.player)
            this.player.controls.stop();
        return this;
    },

    /**
     * Seek the video to a specific position.
     *
     * @param {Number} iTo The number of seconds to seek the playhead to.
     * @type  {Object}
     */
    seek: function(iTo) {
        if (this.player) {
            this.player.controls.pause(); //@todo fix by ruben to enable seeking in wmp
            this.player.controls.currentPosition = iTo / 1000;
            if (!this.oVideo.paused)
                this.player.controls.play(); //@todo fix by ruben to enable seeking in wmp
        }
        return this;
    },

    fullscreen : function(value){
        this.player.fullscreen = value ? true : false;
    },

    /**
     * Set the volume of the video to a specific range (0 - 100)
     *
     * @param {Number} iVolume
     * @type  {Object}
     */
    setVolume: function(iVolume) {
        if (this.player)
            this.player.settings.volume = iVolume;
        return this;
    },

    /**
     * Retrieve the total playtime of the video, in seconds.
     *
     * @type {Number}
     */
    getTotalTime: function() {
        if (!this.player)
            return 0;
        return Math.round(this.player.controls.currentItem.duration * 1000);
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
            this.stopPlayPoll();
            delete this.player;
            this.player = null;
        }

        var playerId = this.name + "_Player";

        this.htmlElement.innerHTML = apf.video.TypeWmpCompat.generateOBJECTText(playerId,
            this.videoPath, "100%", "100%", {
                "AutoStart": this.autoPlay.toString(),
                "uiMode"   : this.showControls ? "mini" : "none",
                "PlayCount": 1 //@todo: implement looping
            });

        this.player = this.getElement(playerId);//.object;
        var _self = this;
        try {
            this.player[window.addEventListener ? "addEventListener" : "attachEvent"]("PlayStateChange", function(iState) {
              _self.handleEvent(iState);
            });
        } catch (e) {
            this.player.onplaystatechange = function(iState) {
              _self.handleEvent(iState);
            }
        }

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
        switch (iState) {
            case 1:   //Stopped - Playback of the current media clip is stopped.
            case 8:   //MediaEnded - Media has completed playback and is at its end.
                this.oVideo.$completeHook({type: "complete"});
                this.stopPlayPoll();
                break;
            case 2:   //Paused - Playback of the current media clip is paused. When media is paused, resuming playback begins from the same location.
                this.oVideo.$stateChangeHook({type: "stateChange", state: "paused"});
                this.stopPlayPoll();
                break;
            case 3:   //Playing - The current media clip is playing.
                this.oVideo.$stateChangeHook({type: "stateChange", state: "playing"})
                if (!this.oVideo.ready)
                    this.oVideo.setProperty("readyState", apf.Media.HAVE_ENOUGH_DATA);
                this.startPlayPoll();
                break;
            case 10:  //Ready - Ready to begin playing.
                this.oVideo.$stateChangeHook({type: "ready"});
                break;
            case 4:  //ScanForward - The current media clip is fast forwarding.
            case 5:  //ScanReverse - The current media clip is fast rewinding.
            case 6:  //Buffering - The current media clip is getting additional data from the server.
            case 7:  //Waiting - Connection is established, however the server is not sending bits. Waiting for session to begin.
            case 9:  //Transitioning - Preparing new media.
            case 11: //Reconnecting - Reconnecting to stream.
                break;
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
            if (!_self.player || !_self.player.controls) return;
            _self.oVideo.$changeHook({
                type        : "change",
                playheadTime: Math.round(_self.player.controls.currentPosition * 1000)
            });
            _self.startPlayPoll();
        }, 200);
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
            try {
                this.player.controls.stop();
            } catch(e) {}
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
