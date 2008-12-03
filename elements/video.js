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

/**
 * @classDescription This class creates a new video
 * @return {Video} Returns a new video
 * @type {Video}
 * @inherits jpf.Presentation
 * @inherits jpf.Media
 * @constructor
 * @allowchild {text}
 * @addnode elements:video
 * @link http://www.whatwg.org/specs/web-apps/current-work/#video
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */

jpf.video = jpf.component(jpf.NODE_VISIBLE, function(){

    this.mainBind = "src";

    /**
     * Load a video by setting the URL pointer to a different video file
     *
     * @param {String} sVideo
     * @type {Object}
     */
    var dbLoad = this.load;
    this.load = function() {
        if (!arguments.length) {
            if (this.player) {
                this.setProperty('currentSrc',   this.src);
                this.setProperty('networkState', jpf.Media.NETWORK_LOADING);
                this.player.load(this.src);
            }
        }
        else {
            dbLoad.apply(this, arguments);
        }

        return this;
    };

    /**
     * Seek the video to a specific position.
     *
     * @param {Number} iTo The number of seconds to seek the playhead to.
     * @type {Object}
     */
    this.seek = function(iTo) {
        if (this.player && iTo >= 0 && iTo <= this.duration)
            this.player.seek(iTo);
    };

    /**
     * Set the volume of the video to a specific range (0 - 100)
     *
     * @param {Number} iVolume
     * @type {Object}
     */
    this.setVolume = function(iVolume) {
        if (this.player) {
            this.player.setVolume(iVolume);
        }
    };

    /**
     * Guess the mime-type of a video file, based on its filename/ extension.
     *
     * @param {String} path
     * @type {String}
     */
    this.$guessType = function(path) {
        // make a best-guess, based on the extension of the src attribute (file name)
        var ext  = path.substr(path.lastIndexOf('.') + 1);
        var type = "";
        switch (ext) {
            case "mov":
                type = "video/quicktime";
                break;
            case "flv":
                type = "video/flv";
                break;
            case "asf":
            case "asx":
            case "avi":
            case "wmv":
                type = "video/wmv";
                break;
            case "3gp":
            case "3gpp":
            case "3g2":
            case "3gpp2":
            case "divx":
            case "mp4":
            case "mpg4":
            case "mpg":
            case "mpeg":
            case "mpe":
            case "ogg":
            case "vob":
                type = "video/vlc";
        }
        if (!jpf.isWin && !jpf.isMac && type == "video/wmv")
            type = "video/vlc";
        return type;
    };

    /**
     * Find the correct video player type that will be able to playback the video
     * file with a specific mime-type provided.
     *
     * @param {String} mimeType
     * @type {String}
     */
    this.$getPlayerType = function(mimeType) {
        if (!mimeType) return null;

        var playerType = null;

        var aMimeTypes = mimeType.splitSafe(',');
        if (aMimeTypes.length == 1)
            aMimeTypes = aMimeTypes[0].splitSafe(';');
        for (var i = 0; i < aMimeTypes.length; i++) {
            mimeType = aMimeTypes[i];
            
            if (mimeType.indexOf('flv') > -1)
                playerType = "TypeFlv";
            else if (mimeType.indexOf('quicktime') > -1)
                playerType = "TypeQT";
            else if (mimeType.indexOf('wmv') > -1)
                playerType = "TypeWmp";
            else if (mimeType.indexOf('silverlight') > -1)
                playerType = "TypeSilverlight";
            else if (mimeType.indexOf('vlc') > -1)
                playerType = "TypeVlc";
                
            if (playerType == "TypeWmp") {
                if (!jpf.isIE && typeof jpf.video.TypeVlc != "undefined" 
                  && jpf.video.TypeVlc.isSupported())
                    playerType = "TypeVlc";
                else if (jpf.isMac)
                    playerType = "TypeQT";
            }

            if (playerType && jpf.video[playerType] &&
              jpf.video[playerType].isSupported()) {
                this.$lastMimeType = i;
                return playerType;
            }
        }

        this.$lastMimeType = -1;
        return null;//playerType;
    };

    /**
     * Checks if a specified playerType is supported by JPF or not...
     *
     * @type {Boolean}
     */
    this.$isSupported = function() {
        return (jpf.video[this.playerType]
            && jpf.video[this.playerType].isSupported());
    };

    /**
     * Initialize and instantiate the video player provided by getPlayerType()
     *
     * @type {Object}
     */
    this.$initPlayer = function() {
        this.player = new jpf.video[this.playerType](this, this.oExt, {
            src         : this.src.splitSafe(",")[this.$lastMimeType] || this.src,
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
     *
     * @ignore
     * @type {void}
     */
    this.$initHook = function() {
        this.load();
    };

    /**
     * The 'cuePoint' event hook is called when the player has set a cue point in
     * the video file.
     *
     * @ignore
     * @type {void}
     */
    this.$cuePointHook = function() {}; //ignored

    /**
     * The 'playheadUpdate' event hook is called when the position of the playhead
     * that is currently active (or 'playing') is updated.
     * This feature is currently handled by {@link jpf.video.$changeHook}
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
        jpf.console.error(e.error);
    };

    /**
     * The 'progress' event hook is called when the progress of the loading sequence
     * of an video file is updated. The control signals us on how many bytes are
     * loaded and how many still remain.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$progressHook = function(e) {
        this.setProperty('bufferedBytes', {start: 0, end: e.bytesLoaded});
        this.setProperty('totalBytes', e.totalBytes);
        var iDiff = Math.abs(e.bytesLoaded - e.totalBytes);
        if (iDiff <= 20)
            this.setProperty('readyState', jpf.Media.HAVE_ENOUGH_DATA);
    };

    /**
     * The 'stateChange' event hook is called when the internal state of a control
     * changes. The state of internal properties of an video control may be
     * propagated through this function.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$stateChangeHook = function(e) {
        //loading, playing, seeking, paused, stopped, connectionError
        if (e.state == "loading")
            this.setProperty('networkState', this.networkState = jpf.Media.NETWORK_LOADING);
        else if (e.state == "connectionError")
            this.$propHandlers["readyState"].call(this, this.networkState = jpf.Media.HAVE_NOTHING);
        else if (e.state == "playing" || e.state == "paused") {
            if (e.state == "playing")
                this.$readyHook({type: 'ready'});
            this.paused = Boolean(e.state == "paused");
            this.setProperty('paused', this.paused);
        }
        else if (e.state == "seeking") {
            this.seeking = true;
            this.setProperty('seeking', true);
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
            //this.setProperty('volume', e.volume);
        }
        else {
            this.duration = this.player.getTotalTime();
            this.position = e.playheadTime / this.duration;
            if (isNaN(this.position)) return;
            this.setProperty('position', this.position);
            this.currentTime = e.playheadTime;
            this.setProperty('currentTime', this.currentTime);
        }
    };

    /**
     * The 'complete' event hook is called when a control has finished playing
     * an video file completely, i.e. the progress is at 100%.
     *
     * @param {Object} e Event data, specific to this hook, containing player data.
     * @type {void}
     */
    this.$completeHook = function(e) {
        this.paused = true;
        this.setProperty('paused', true);
    };

    /**
     * When a video player signals that is has initialized properly and is ready
     * to play, this function sets all the flags and behaviors properly.
     *
     * @type {Object}
     */
    this.$readyHook = function(e) {
        this.setProperty('networkState', jpf.Media.NETWORK_LOADED);
        this.setProperty('readyState',   jpf.Media.HAVE_FUTURE_DATA);
        this.setProperty('duration', this.player.getTotalTime());
        this.seeking  = false;
        this.seekable = true;
        this.setProperty('seeking', false);
        return this;
    };

    /**
     * The 'metadata' event hook is called when a control receives metadata of an
     * video file.
     *
     * @ignore
     * @type {void}
     */
    this.$metadataHook = function(e) {
        this.oVideo.setProperty('readyState', jpf.Media.HAVE_METADATA);
    };

    /**
     * Unsubscribe from all the events that we have subscribed to with
     * startListening()
     *
     * @type {Object}
     */
    this.stopListening = function() {
        if (!this.player) return this;

        return this;
    };

    /**
     * Build Main Skin
     *
     * @type {void}
     */
    this.$draw = function(){
        this.oExt = this.$getExternal();
    };

    /**
     * Parse the block of JML that constructs the HTML5 compatible <VIDEO> tag
     * for arguments like URL of the video, width, height, etc.
     *
     * @param {XMLRootElement} x
     * @type {void}
     */
    this.$loadJml = function(x){
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);

        if (x.firstChild && x.firstChild.nodeType == 3)
            this.notSupported = x.firstChild.nodeValue; //@todo add Html Support

        this.width    = parseInt(this.width)  || null;
        this.height   = parseInt(this.height) || null;

        if (typeof this.type == "undefined" && this.src)
            this.type = this.$guessType(this.src);
        this.$propHandlers["type"].call(this, this.type);

        jpf.JmlParser.parseChildren(this.$jml, null, this);
    };

    this.$destroy = function(bRuntime) {
        if (this.player && this.player.$destroy)
            this.player.$destroy();
        delete this.player;
        this.player = null;

        if (bRuntime)
            this.oExt.innerHTML = "";
    };
}).implement(
    //#ifdef __WITH_DATABINDING
    jpf.DataBinding,
    //#endif
    jpf.Presentation,
    jpf.Media
);

jpf.video.TypeInterface = {
    properties: ["src", "width", "height", "volume", "showControls",
        "autoPlay", "totalTime", "mimeType"],

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
        var elem;

        if (typeof id == "object")
            return id;
        if (jpf.isIE)
            return window[id];
        else {
            elem = document[id] ? document[id] : document.getElementById(id);
            if (!elem)
                elem = jpf.lookup(id);
            return elem;
        }
    }
};

// #endif
