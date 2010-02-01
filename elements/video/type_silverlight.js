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
 * Element displaying a Silverlight video
 *
 * @classDescription This class creates a new Silverlight video player
 * @return {TypeSilverlight} Returns a new Silverlight video player
 * @type {TypeSilverlight}
 * @constructor
 * @addnode elements:video
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
apf.video.TypeSilverlight = function(oVideo, node, options) {
    this.oVideo         = oVideo;
    if (!apf.video.TypeSilverlight.INITED) {
        apf.silverlight.startup();
        apf.video.TypeSilverlight.INITED = true;
    }

    // #ifndef __PACKAGED
    this.DEFAULT_PLAYER = (apf.config.resourcePath || apf.basePath) + "elements/video/wmvplayer.xaml";
    /* #else
    this.DEFAULT_PLAYER = (apf.config.resourcePath || apf.basePath) + "resources/wmvplayer.xaml";
    #endif */
    /* #ifdef __WITH_CDN
    this.DEFAULT_PLAYER = apf.CDN + apf.VERSION + "/resources/wmvplayer.xaml";
    #endif */
    this.htmlElement    = node;
    this.options        = {
        backgroundcolor: "000000",
        windowless:      "false",
        file:            "",
        image:           "",
        backcolor:       "000000",
        frontcolor:      "FFFFFF",
        lightcolor:      "FFFFFF",
        screencolor:     "FFFFFF",
        width:           "100%",
        height:          "100%",
        logo:            "",
        overstretch:     "true",
        shownavigation:  "false",
        showstop:        "false",
        showdigits:      "true",
        usefullscreen:   "true",
        usemute:         "false",
        autostart:       "true",
        bufferlength:    "3",
        duration:        "0",
        repeat:          "false",
        sender:          "",
        start:           "0",
        volume:          "90",
        link:            "",
        linkfromdisplay: "false",
        linktarget:      "_self"
    };
    this.options.file = options.src;

    for (var itm in this.options) {
        if (options[itm] != undefined) {
            if (itm.indexOf("color") > 0)
                this.options[itm] = options[itm].substr(options[itm].length - 6);
            else
                this.options[itm] = options[itm];
        }
    }

    apf.silverlight.createObjectEx({
        id:            this.oVideo.$uniqueId + "_Player",
        source:        this.DEFAULT_PLAYER,
        parentElement: node,
        properties:    {
            width:                "100%",
            height:               "100%",
            version:              "1.0",
            inplaceInstallPrompt: true,
            isWindowless:         this.options["windowless"],
            background:           "#" + this.options["backgroundcolor"]
        },
        events:        {
            onLoad:  this.onLoadHandler,
            onError: apf.silverlight.default_error_handler
        },
        context:       this
    });

    //apf.extend(this, apf.video.TypeInterface);
    //#ifdef __WITH_LAYOUT
    apf.layout.setRules(this.oVideo.$ext, this.oVideo.$uniqueId + "_silverlight",
        "apf.all[" + this.oVideo.$uniqueId + "].player.resizePlayer()");
    apf.layout.queue(this.oVideo.$ext);
    //#endif
};

apf.video.TypeSilverlight.isSupported = function(){
    return apf.silverlight.isAvailable("1.0");
};

apf.video.TypeSilverlight.INITED = false;

apf.video.TypeSilverlight.prototype = {
    /**
     * Play a WMV movie. Does a call to the XAML Silverlight player to load or
     * load & play the video, depending on the 'autoPlay' flag (TRUE for play).
     *
     * @param {String} videoPath Path to the movie.
     * @type  {Object}
     */
    load: function(videoPath) {
        this.video.Source = this.options["file"];

        this.oVideo.$readyHook({ type: "ready" });

        if (this.options["usemute"] == "true")
            this.setVolume(0);
        else
            this.setVolume(this.options["volume"]);
        if (this.options["autostart"] == "true")
            this.play();
        else
            this.pause();

        return this;
    },

    /**
     * Play and/ or resume a video that has been loaded already
     *
     * @type {Object}
     */
    play: function() {
        if (this.state == "buffering" || this.state == "playing") {
            if (this.options["duration"] == 0)
                this.stop();
            else
                this.pause();
        }
        else {
            this.video.Visibility   = "Visible";
            this.preview.Visibility = "Collapsed";
            if (this.state == "closed")
                this.video.Source = this.options["file"];
            else
                this.video.play();
        }
        return this;
    },

    /**
     * Toggle the pause state of the video.
     *
     * @type {Object}
     */
    pause: function() {
        if (!this.video) return this;
        this.video.pause();
        return this;
        //this.oVideo.$changeHook({
        //    type        : "change",
        //    playheadTime: Math.round(this.video.Position.Seconds * 10) / 10
        //});
    },

    /**
     * Stop playback of the video.
     *
     * @type {Object}
     */
    stop: function() {
        if (!this.video) return;
        this.stopPlayPoll();
        this.video.Visibility   = "Collapsed";
        this.preview.Visibility = "Visible";
        this.pause().seek(0);
        this.video.Source = "null";
        return this;
    },

    /**
     * Seek the video to a specific position.
     *
     * @param {Number} iTo The number of seconds to seek the playhead to.
     * @type {Object}
     */
    seek: function(iTo) {
        if (!this.video) return;
        this.stopPlayPoll();
        if (iTo < 2)
            iTo = 0;
        else if (iTo > this.options["duration"] - 4)
            iTo = this.options["duration"] - 4;
        //this.play();
        if (!isNaN(iTo)) {
            try{ //@todo added by ruben
                this.video.Position = this.oVideo.getCounter(iTo, "%H:%M:%S");//this.spanstring(iTo);
            }
            catch(e){}
        }
        if (this.state == "buffering" || this.state == "playing")
            this.play();
        else
            this.pause();
        return this;
    },

    /**
     * Set the volume of the video to a specific range (0 - 100)
     *
     * @param {Number} iVolume
     * @type {Object}
     */
    setVolume: function(iVolume) {
        if (!this.video) return;
        this.video.Volume = iVolume / 100;
        return this;
    },

    /**
     * Retrieve the total playtime of the video, in seconds.
     *
     * @type {Number}
     */
    getTotalTime: function() {
        if (!this.video) return 0;
        return this.options["duration"] || 0;
    },

    /**
     * Format a number of seconds to a format the player groks:
     * HH:MM:SS
     *
     * @param {Number} stp In seconds
     * @type {String}
     */
    spanstring: function(stp) {
        var hrs = Math.floor(stp / 3600);
        var min = Math.floor(stp % 3600 / 60);
        var sec = Math.round(stp % 60 * 10) / 10;
        var str = hrs + ":" + min + ":" + sec;
        return str;
    },

    /**
     * Fired when the XAML player object has loaded its resources (including
     * the video file inside the <MediaElement> object and is ready to play.
     * Captures the reference to the player object.
     *
     * @param {String} pId
     * @param {Object} _self  Context of the player ("this")
     * @param {Object} sender XAML Player object instance
     * @type {void}
     */
    onLoadHandler: function(pId, _self, sender) {
        // 'o = this' in this case, sent back to us from the Silverlight helper script

        _self.options["sender"] = sender;
        _self.video   = _self.options["sender"].findName("VideoWindow");
        _self.preview = _self.options["sender"].findName("PlaceholderImage");
        var str = {
            "true" : "UniformToFill",
            "false": "Uniform",
            "fit"  : "Fill",
            "none" : "None"
        }
        _self.state = _self.video.CurrentState.toLowerCase();
        _self.pollTimer;
        _self.video.Stretch   = str[_self.options["overstretch"]];
        _self.preview.Stretch = str[_self.options["overstretch"]];

        _self.display               = sender.findName("PlayerDisplay");
        _self.display.Visibility    = "Visible";

        _self.video.BufferingTime = _self.spanstring(_self.options["bufferlength"]);
        _self.video.AutoPlay      = true;

        _self.video.AddEventListener("CurrentStateChanged", function() {
            _self.handleState("CurrentStateChanged");
        });
        _self.video.AddEventListener("MediaEnded", function() {
            _self.handleState("MediaEnded");
        });
        // BufferProgressChanged is of no use in XAML
        _self.video.AddEventListener("DownloadProgressChanged", function(o) {
            _self.oVideo.$progressHook({
                bytesLoaded: Math.round(o.downloadProgress * 100), //percentage
                totalBytes : 100
            });
        });
        if (_self.options["image"] != "")
            _self.preview.Source = _self.options["image"];

        _self.resizePlayer();

        _self.oVideo.$initHook({state: _self.state});
    },

    /**
     * Process a 'CurrentStateChanged' event when the player fired it or a
     * 'MediaEnded' event when the video stopped playing.
     *
     * @param {Object} sEvent Name of the event that was fired (either 'CurrentStateChanged' or 'MediaEnded')
     * @type void
     */
    handleState: function(sEvent) {
        var state = this.video.CurrentState.toLowerCase();
        if (sEvent == "MediaEnded") {
            this.stopPlayPoll();
            this.oVideo.$changeHook({
                type        : "change",
                playheadTime: Math.round(this.video.Position.Seconds * 1000)
            });
            if (this.options["repeat"] == "true") {
                this.seek(0).play();
            } else {
                this.state              = "completed";
                this.video.Visibility   = "Collapsed";
                this.preview.Visibility = "Visible";
                this.seek(0).pause().oVideo.$completeHook({ type: "complete" });
            }
        }
        //CurrentStateChanged:
        else if (state != this.state) {
            this.state = state;
            this.options["duration"] = Math.round(this.video.NaturalDuration.Seconds * 1000);
            if (state != "playing" && state != "buffering" && state != "opening") {
                this.oVideo.$stateChangeHook({type: "stateChange", state: "paused"});
                this.stopPlayPoll();
            }
            else {
                this.oVideo.$stateChangeHook({type: "stateChange", state: "playing"});
                this.startPlayPoll();
            }
        }
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
            if (_self.oVideo && !_self.oVideo.ready && _self.video.CanSeek)
                _self.oVideo.setProperty("readyState", apf.Media.HAVE_ENOUGH_DATA);
            _self.oVideo.$changeHook({
                type        : "change",
                playheadTime: Math.round(_self.video.Position.Seconds * 1000)
            });
            _self.startPlayPoll();
        }, 100);
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

    /**
     * Resize the dimensions of the player object to the ones specified by the
     * <VIDEO> tag width and height properties. The video will be scaled/ stretched
     * accordingly
     *
     * @type {Object}
     */
    resizePlayer: function() {
        var oSender  = this.options["sender"];
        if (!oSender) return;
        var oContent = this.display.getHost().content;
        var width    = oContent.actualWidth;
        var height   = oContent.actualHeight;

        this.stretchElement("PlayerDisplay", width, height)
            .stretchElement("VideoWindow", width,height)
            .stretchElement("PlaceholderImage", width, height)
            .centerElement("BufferIcon", width, height)
            .centerElement("BufferText", width, height)
        this.display.findName("OverlayCanvas")["Canvas.Left"] = width -
        this.display.findName("OverlayCanvas").Width - 10;
        this.display.Visibility = "Visible";

        return this;
    },

    /**
     * Position a XAML element in the center of the canvas it is a member of
     *
     * @param {String} sName   Name or ID of the element
     * @param {Number} iWidth  Current width of the canvas
     * @param {Number} iHeight Current height of the canvas
     * @type {Object}
     */
    centerElement: function(sName, iWidth, iHeight) {
        var elm = this.options["sender"].findName(sName);
        elm["Canvas.Left"] = Math.round(iWidth  / 2 - elm.Width  / 2);
        elm["Canvas.Top"]  = Math.round(iHeight / 2 - elm.Height / 2);
        return this;
    },

    /**
     * Set the dimensions of a XAML element to be the same of the canvas it is
     * a member of.
     *
     * @param {Object} sName   Name or ID of the element
     * @param {Number} iWidth  Current width of the canvas
     * @param {Number} iHeight Current height of the canvas. Optional.
     * @type {Object}
     */
    stretchElement: function(sName, iWidth, iHeight) {
        var elm = this.options["sender"].findName(sName);
        elm.Width = iWidth;
        if (iHeight != undefined)
            elm.Height = iHeight;
        return this;
    },

    $destroy: function() {
        //#ifdef __WITH_LAYOUT
        apf.layout.removeRule(this.oVideo.$ext, this.oVideo.$uniqueId + "_silverlight");
        //#endif
        this.stopPlayPoll();
        if (this.player) {
            this.player = this.video = this.preview = null;
            delete this.player;
            delete this.video;
            delete this.preview
        }
        this.htmlElement.innerHTML = "";
        this.oVideo = this.htmlElement = null;
        delete this.oVideo;
        delete this.htmlElement;
    }
};
// #endif
