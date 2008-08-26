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

// #ifdef __JVIDEO || __INC_ALL
// #define __WITH_PRESENTATION 1
jpf.type_wmp = {};

jpf.video.TypeWmpCompat = (function() {
    var hasWMP = false;
    
    /**
     * Windows Media Player checking code adapted from
     * eMedia Communications Strategies information and Microsoft documentation
     * see http://www.emediacommunications.biz/sm5/articlesm5.html
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
        var is_WMP64  = false;
        var is_WMP7up = false;
        
        if (jpf.isWin && jpf.isIE) {  //use ActiveX test
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
            var numPlugins = navigator.plugins.length;
            for (var i = 0; i < numPlugins; i++) {
                if (navigator.plugins[i].name.substring(0, 20) == "Windows Media Player") {
                    hasWMP   = true;
                    is_WMP64 = true;
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
     * @type {String}
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
     * @type {String}
     */
    function WMP_generateOBJECTText(id, url, width, height, params) {
        var out = ['<object id="', id, '" width="', width, '" height="', height, '" \
        	classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6" \
        	type="application/x-oleobject">',
            WMP_generateParamTag('URL', url),
            WMP_generateParamTag('SendPlayStateChangeEvents', 'true'),
            WMP_generateParamTag('StretchToFit', 'true')];
        for (var param in params) {
            out.push(WMP_generateParamTag(param, params[param]));
        }
        return out.join('') + '</object>';
    }
    
    var bIsAvailable = null;
    /**
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
 * Component displaying a Windows Media Player video
 *
 * @classDescription This class creates a new Windows Media Player video player
 * @return {TypeWmp} Returns a new Windows Media Player video player
 * @type {TypeWmp}
 * @constructor
 * @addnode components:video
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.video.TypeWmp = function(id, node, options) {
    this.name = "WMP_" + id;
    this.htmlElement = node;
    
    this.player = this.pollTimer = null;
    this.volume = 50; //default WMP
    jpf.extend(this, jpf.video.TypeInterface);
    
    this.setOptions(options).draw();
};

jpf.video.TypeWmp.isSupported = function(){
    return jpf.video.TypeWmpCompat.isAvailable();
};

jpf.video.TypeWmp.prototype = {
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
     * @type {Object}
     */
    seek: function(iTo) {
        if (this.player)
            this.player.controls.currentPosition = iTo;
        return this;
    },
    
    /**
     * Set the volume of the video to a specific range (0 - 100)
     * 
     * @param {Number} iVolume
     * @type {Object}
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
        return this.player.controls.currentItem.duration;
    },
    
    /**
     * Draw the HTML for a Windows Media Player video control (<OBJECT> tag)
     * onto the browser canvas into a container element (usually a <DIV>).
     * When set, it captures the reference to the newly created object.
     * 
     * @type {Object}
     */
    draw: function() {
        var playerId = this.name + "_Player";
        this.htmlElement.innerHTML = "<div id='" + this.name + "_Container' class='jpfVideo'\
            style='width:" + this.width + "px;height:" + this.height + "px;'>" +
            jpf.video.TypeWmpCompat.generateOBJECTText(playerId, 
                this.src, this.width, this.height, {
                    'AutoStart': this.autoPlay.toString(),
                    'uiMode'   : this.showControls ? 'mini' : 'none',
                    'PlayCount': 1 //TODO: implement looping
                }) + 
            "</div>";

        this.player = this.htmlElement.getElementsByTagName('object')[0];//.object;
        var _self = this;
        this.player.attachEvent('PlayStateChange', function(iState) {
            _self.handleEvent(iState);
        });
        
        return this;
    },
    
    /**
     * Callback from flash; whenever the Window Media Player video bubbles an
     * event up to the javascript interface, it passes through to this function.
     * 
     * @param {Number} iState
     * @type {Object}
     */
    handleEvent: function(iState) {
        switch (iState) {
            case 1:   //Stopped - Playback of the current media clip is stopped.
            case 8:   //MediaEnded - Media has completed playback and is at its end.
                this.dispatchEvent({type: 'complete'});
                this.stopPlayPoll();
                break;
            case 2:   //Paused - Playback of the current media clip is paused. When media is paused, resuming playback begins from the same location.
                this.dispatchEvent({type: 'stateChange', state: 'paused'});
                this.stopPlayPoll();
                break;
            case 3:   //Playing - The current media clip is playing.
                this.dispatchEvent({type: 'stateChange', state: 'playing'});
                this.startPlayPoll();
                break;
            case 10:  //Ready - Ready to begin playing.
                this.dispatchEvent({type: 'ready'});
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
        this.pollTimer = setTimeout(function() {
            _self.dispatchEvent({
                type        : 'change',
                playheadTime: _self.player.controls.currentPosition
            });
            _self.startPlayPoll();
        }, 1000);
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
    }
};
// #endif
