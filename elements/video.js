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
 * Element that is able to play a video file or remote stream
 * Example:
 * Plays a video at 340x180
 * <code>
 *  <a:video id="myVideo"
 *   src      = ""
 *   controls = "false"
 *   autoplay = "true"
 *   volume   = "20"
 *   width    = "340"
 *   height   = "180">
 *    Video Codec not supported.
 *  </a:video>
 * </code>
 * Example:
 * <code>
 *  <a:video id="myVideo2"
 *   autoplay = "true"
 *   controls = "false"
 *   volume   = "90">
 *    <a:source src="http://my-mediaserver.com/demo_video.flv" />
 *    <a:source src="http://my-mediaserver.com/demo_video.mov" />
 *    <a:source src="http://my-mediaserver.com/demo_video.wmv" />
 *    <a:source src="http://my-mediaserver.com/video.wmv" type="video/silverlight" />
 *    <a:source src="http://my-mediaserver.com/demo_video.ogg" />
 *    <a:nomedia>Video Codec not supported.</a:nomedia>
 *  </a:video>
 * </code>
 *
 * @return {Video} Returns a new video
 * @type {Video}
 * @inherits apf.Presentation
 * @inherits apf.Media
 * @constructor
 * @allowchild text, source, nomedia
 * @addnode elements:video
 * @link http://www.whatwg.org/specs/web-apps/current-work/#video
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */

apf.video = function(struct, tagName){
    this.$init(tagName || "video", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        //#ifdef __WITH_DATAACTION
        apf.DataAction
        //#endif
    );

    this.$booleanProperties["fullscreen"] = true;

    var oldStyle = null; //will hold old style of the media elements' parentNode on fullscreen
    //var placeHolder = null;
    this.$propHandlers["fullscreen"] = function(value) {
        if (!this.player) return;
        // only go fullscreen when the feature is supported by the active player
        if (typeof this.player.setFullscreen == "function")
            this.player.setFullscreen(value);
        else if (this.parentNode && this.parentNode.tagName != "application"
          && this.parentNode.setWidth) {
            // we're going into fullscreen mode...
            var i, node, oParent = this.parentNode.$ext;
            if (value) {
                oldStyle = {
                    width    : this.parentNode.getWidth(),
                    height   : this.parentNode.getHeight(),
                    top      : this.parentNode.getTop(),
                    left     : this.parentNode.getLeft(),
                    position : apf.getStyle(oParent, 'position'),
                    zIndex   : apf.getStyle(oParent, 'zIndex'),
                    resizable: this.parentNode.resizable,
                    nodes    : []
                }

                if (oParent != document.body) {
                    while (oParent.parentNode != document.body) {
                        var node = oParent.parentNode;
                        i = oldStyle.nodes.push({
                            pos:  apf.getSyle(node, 'position') || "",
                            top:  apf.getSyle(node, 'top')  || node.offsetTop + "px",
                            left: apf.getSyle(node, 'left') || node.offsetLeft + "px",
                            node: node
                        }) - 1;
                        node.style.position = "absolute";
                        node.style.top      = "0";
                        node.style.left     = "0";
                        /*window.console.log('still reparenting!');
                        window.console.dir(oParent.parentNode);
                        placeHolder = document.createElement('div');
                        placeHolder.setAttribute('id', 'apf.__apf_video_placeholder__');
                        placeHolder.style.display = "none";
                        oParent.parentNode.insertBefore(placeHolder, oParent);

                        document.body.appendChild(oParent);*/
                    }
                }

                this.parentNode.$ext.style.position = "absolute";
                this.parentNode.$ext.style.zIndex = "1000000";
                this.parentNode.setWidth('100%');
                this.parentNode.setHeight('100%');
                this.parentNode.setTop('0');
                this.parentNode.setLeft('0');

                if (this.parentNode.resizable)
                    this.parentNode.setAttribute("resizable", false);
            }
            // we're going back to normal mode...
            else if (oldStyle) {
                var coll;
                if (oldStyle.nodes.length) {
                    for (i = oldStyle.nodes.length - 1; i >= 0; i--) {
                        coll = oldStyle.nodes[i];
                        node = coll.node;
                        node.style.position = coll.pos;
                        node.style.top      = coll.top;
                        node.style.left     = coll.left;
                    }
                }
                /*if (placeHolder) {
                    window.console.log('still reparenting!');
                    placeHolder.parentNode.insertBefore(oParent, placeHolder);
                    placeHolder.parentNode.removeChild(placeHolder);
                    placeHolder = null;
                }*/

                this.parentNode.$ext.style.zIndex = oldStyle.zIndex;
                this.parentNode.$ext.style.position = oldStyle.position;
                this.parentNode.setWidth(oldStyle.width);
                this.parentNode.setHeight(oldStyle.height);
                this.parentNode.setTop(oldStyle.top);
                this.parentNode.setLeft(oldStyle.left);

                if (oldStyle.resizable)
                    this.parentNode.setAttribute("resizable", true);

                oldStyle = null;
                delete oldStyle;
            }

            if (this.player.onAfterFullscreen)
                this.player.onAfterFullscreen(value);

            var _self = this;
            //#ifdef __WITH_LAYOUT
            window.setTimeout(function() {
                apf.layout.forceResize(_self.parentNode.$ext);
            }, 100);
            //#endif
        }
    };

    /**** Event listeners ****/

    // #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        switch (e.keyCode) {
            case 13 && (e.ctrlKey || e.altKey): //(CTRL | ALT) + RETURN
            case 70: //f
                this.setPropery("fullscreen", true);
                return false;
                break;
            case 80:
                this.setProperty("paused", !this.paused);
                return false;
                break;
            case 27: //ESC
                this.setProperty("fullscreen", false);
                return false;
                break;
            default:
                break;
        };
    }, true);
    // #endif

    this.$mainBind = "src";

    /**
     * Load a video by setting the URL pointer to a different video file
     *
     * @param {String} sVideo
     * @type {Object}
     */
    this.loadMedia = function() {
        if (this.player) {
            this.setProperty('currentSrc',   this.src);
            this.setProperty('networkState', apf.Media.NETWORK_LOADING);
            this.player.load(this.src);
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

    var typesQT = "mov",
        typesFLV = "flv",
        typesWMP = "asf|asx|avi|wmv",
        typesNtv = "ogg",
        typesVLC = "3gp|3gpp|3g2|3gpp2|divx|mp4|mpg4|mpg|mpeg|mpe|ogg|vob";

    /**
     * Guess the mime-type of a video file, based on its filename/ extension.
     *
     * @param {String} path
     * @type {String}
     */
    this.$guessType = function(path) {
        // make a best-guess, based on the extension of the src attribute (file name)
        var ext  = path.substr(path.lastIndexOf('.') + 1),
            type = "";
        if (typesQT.indexOf(ext) != -1)
            type = "video/quicktime";
        else if (typesFLV.indexOf(ext) != -1)
            type = "video/flv";
        else if (typesWMP.indexOf(ext) != -1)
            type = "video/wmv";
        else if (typesNtv.indexOf(ext) != -1 && apf.hasVideo)
            type = "video/ogg";
        else if (typesVLC.indexOf(ext) != -1)
            type = "video/vlc";
        // mpeg video is better to be played by native players
        if (ext == "mpg" || ext == "mpeg" || ext == "mpe")
            type = apf.isMac ? "video/quicktime" : "video/wmv";
        // default to VLC on *NIX machines
        if (!apf.isWin && !apf.isMac && type == "video/wmv")
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

            if (mimeType.indexOf('ogg') > -1)
                playerType = "TypeNative";
            else if (mimeType.indexOf('flv') > -1)
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
                if (!apf.isIE && typeof apf.video.TypeVlc != "undefined"
                  && apf.video.TypeVlc.isSupported())
                    playerType = "TypeVlc";
                else if (apf.isMac)
                    playerType = "TypeQT";
            }

            if (playerType && apf.video[playerType] &&
              apf.video[playerType].isSupported()) {
                this.$lastMimeType = i;
                return playerType;
            }
        }

        this.$lastMimeType = -1;
        return null;//playerType;
    };

    /**
     * Checks if a specified playerType is supported by APF or not...
     *
     * @type {Boolean}
     */
    this.$isSupported = function(sType) {
        sType = sType || this.playerType;
        return (apf.video[sType] && apf.video[sType].isSupported());
    };

    /**
     * Initialize and instantiate the video player provided by getPlayerType()
     *
     * @type {Object}
     */
    this.$initPlayer = function() {
        this.player = new apf.video[this.playerType](this, this.$ext, {
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
        this.loadMedia();
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
     * This feature is currently handled by {@link element.video.method.$changeHook}
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
        apf.console.error(e.error);
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
            this.setProperty('readyState', apf.Media.HAVE_ENOUGH_DATA);
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
        if (e.state == "loading") {
            this.setProperty('networkState', this.networkState = apf.Media.NETWORK_LOADING);
        }
        else if (e.state == "connectionError") {
            this.$propHandlers["readyState"].call(this, this.networkState = apf.Media.HAVE_NOTHING);
        }
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
            if (!this.muted)
                this.setProperty("volume", this.volume);
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
        this.setProperty('networkState', apf.Media.NETWORK_LOADED);
        this.setProperty('readyState',   apf.Media.HAVE_FUTURE_DATA);
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
        this.oVideo.setProperty('readyState', apf.Media.HAVE_METADATA);
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
        this.$ext = this.$getExternal();
    };

    /**
     * Parse the block of AML that constructs the HTML5 compatible <VIDEO> tag
     * for arguments like URL of the video, width, height, etc.
     *
     * @param {XMLRootElement} x
     * @type {void}
     */
    this.addEventListener("DOMNodeInsertedIntoDocument", function(){
        this.$int   = this.$getLayoutNode("main", "container", this.$ext);

        this.width  = parseInt(this.width)  || null;
        this.height = parseInt(this.height) || null;
    });

    this.addEventListener("AMLMediaReady", function() {
        if (this.setSource())
            this.$propHandlers["type"].call(this, this.type);
    });

    this.$destroy = function(bRuntime) {
        if (this.player && this.player.$destroy)
            this.player.$destroy();
        delete this.player;
        this.player = null;

        if (bRuntime)
            this.$ext.innerHTML = "";
    };
}).call(apf.video.prototype = new apf.Media());

apf.aml.setElement("video", apf.video);

apf.video.TypeInterface = {
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
        if (apf.isIE)
            return window[id];
        else {
            elem = document[id] ? document[id] : document.getElementById(id);
            if (!elem)
                elem = apf.lookup(id);
            return elem;
        }
    }
};

// #endif
