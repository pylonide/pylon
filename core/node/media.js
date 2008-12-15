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

    this.muted = false;

    this.$booleanProperties["paused"]     = true;
    this.$booleanProperties["muted"]      = true;
    this.$booleanProperties["seeking"]    = true;
    this.$booleanProperties["autoplay"]   = true;
    this.$booleanProperties["controls"]   = true;
    this.$booleanProperties["ready"]      = false;
    this.$booleanProperties["fullscreen"] = true;

    this.$supportedProperties.push("position", "networkState", "readyState",
        "progress", "buffered", "bufferedBytes", "totalBytes", "currentTime",
        "paused", "seeking", "volume", "type", "src", "autoplay", "controls");

    this.$propHandlers["readyState"] = function(value){ //in seconds
        if (this.readyState !== value)
            this.readyState = value;
        if (value == jpf.Media.HAVE_NOTHING) {
            // #ifdef __DEBUG
            jpf.console.error("Unable to open medium with URL '" + this.src
                + "'. Please check if the URL you entered as src is pointing to \
                   a valid resource.");
            // #endif

            var oError = this.MediaError("Unable to open medium with URL '" + this.src
                + "'. Please check if the URL you entered as src is pointing to \
                   a valid resource.");
            if (this.dispatchEvent("havenothing", {
                error   : oError,
                bubbles : true
              }) === false)
                throw oError;
        }
        else if (value == jpf.Media.HAVE_CURRENT_DATA)
            this.dispatchEvent("havecurrentdata");
        else if (value == jpf.Media.HAVE_FUTURE_DATA)
            this.dispatchEvent("havefuturedata");
        else if (value == jpf.Media.HAVE_ENOUGH_DATA) {
            this.dispatchEvent("haveenoughdata");
            this.setProperty('ready', true);
        }
    };

    this.$propHandlers["bufferedBytes"] = function(value) {
        this.setProperty("progress", this.totalBytes
            ? value.end / this.totalBytes
            : 0);
    };

    this.$propHandlers["position"] = function(value){
        if (this.duration > 0 && this.seek) {
            // first, check if the seek action doesn't go beyond the download progress of the media element.
            if (value >= this.progress)
                value = this.progress - 0.05;

            var isPlaying = !this.paused;
            if (isPlaying)
                this.pause();

            if (value < 0)
                value = 0;
            else if (value > 1)
                value = 1;

            this.seek(Math.round(value * this.duration));

            this.setProperty('paused', !isPlaying);
        }
    };

    this.$propHandlers["currentTime"] = function(value){ //in milliseconds
        if (value >= 0 && this.seek)
            this.seek(value);
    };

    this.$propHandlers["volume"] = function(value){
        if (!this.player) return;
        // #ifdef __DEBUG
        if (value < 0)
            throw this.MediaError("Attempt to set the volume to a negative volue  '" + value);
        // #endif

        if (value < 1 && value > 0)
            value = value * 100;

        if (this.setVolume)
            this.setVolume(value);
        if (value > 0 && this.muted)
            this.setProperty("muted", false);
    };

    var oldVolume = null;

    this.$propHandlers["muted"] = function(value){
        if (!this.player || !this.setVolume) return;

        if (value) { //mute the player
            oldVolume = this.volume;
            this.setVolume(0);
        }
        else
            this.setVolume(oldVolume || 20);
    };

    this.$propHandlers["paused"] = function(value){
        if (!this.player) return;

        this.paused = jpf.isTrue(value);
        if (this.paused)
            this.player.pause();
        else
            this.player.play();
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
        if (!this.player) return;
        // usually this feature is only made available BY media as getters
        if (typeof this.player.setID3 == "function")
            this.player.setID3(value);
    };

    var oldStyle = null; //will hold old style of the media elements' parentNode on fullscreen
    this.$propHandlers["fullscreen"] = function(value) {
        if (!this.player || (typeof this.$supportFullscreen != "undefined"
          && this.$supportFullscreen !== true))
            return;
        // only go fullscreen when the feature is supported by the active player
        if (typeof this.player.setFullscreen == "function")
            this.player.setFullscreen(value);
        else if (this.parentNode && this.parentNode.tagName != "application"
          && this.parentNode.setWidth) {
            // we're going into fullscreen mode...
            if (value) {
                oldStyle = {
                    width    : this.parentNode.getWidth(),
                    height   : this.parentNode.getHeight(),
                    top      : this.parentNode.getTop(),
                    left     : this.parentNode.getLeft(),
                    position : jpf.getStyle(this.parentNode.oExt, 'position'),
                    zIndex   : jpf.getStyle(this.parentNode.oExt, 'z-index'),
                    hadNext  : this.parentNode.oExt.nextSibling || null,
                    oldParent: this.parentNode.oExt.parentNode
                }
                document.body.appendChild(this.parentNode.oExt);
                this.parentNode.oExt.style.position = "absolute";
                this.parentNode.oExt.style.zIndex = "1000000";
                this.parentNode.setWidth('100%');
                this.parentNode.setHeight('100%');
                this.parentNode.setTop('0');
                this.parentNode.setLeft('0');
            }
            // we're going back to normal mode...
            else if (oldStyle) {
                oldStyle.oldParent.insertBefore(this.parentNode.oExt, oldStyle.hadNext);
                this.parentNode.oExt.style.zIndex = oldStyle.zIndex;
                this.parentNode.oExt.style.position = oldStyle.position;
                this.parentNode.setWidth(oldStyle.width);
                this.parentNode.setHeight(oldStyle.height);
                this.parentNode.setTop(oldStyle.top);
                this.parentNode.setLeft(oldStyle.left);
                oldStyle = null;
            }
            var _self = this;
            window.setTimeout(function() {
                jpf.layout.forceResize(_self.parentNode.oExt);
            }, 100)
        }
    };

    /**** DOM Hooks ****/

    this.$domHandlers["remove"].push(function(doOnlyAdmin){
        // #ifdef __DEBUG
        jpf.console.log('Media: removing node...');
        // #endif
        reset.call(this);
    });

    this.$domHandlers["reparent"].push(function(beforeNode, pNode, withinParent){
        if (!this.$jmlLoaded)
            return;

        // #ifdef __DEBUG
        jpf.console.log('Media: reparenting - ' + beforeNode + ', ' + pNode);
        // #endif

        this.$draw();
        reload.call(this, true);
    });

    /**** Event listeners ****/

    /* #ifdef __WITH_KEYBOARD
    this.addEventListener("keydown", function(e){
        window.console.log('keydown on media element');
        switch (e.keyCode) {
            case 13 && (e.ctrlKey || e.altKey): //(CTRL | ALT) + RETURN
            case 70: //f
                this.setPropery("fullscreen", true);
                break;
            case 80:
                this.setProperty("paused", !this.paused);
                break;
            case 27: //ESC
                this.setProperty("fullscreen", false);
                break;
            default:
                break;
        };

        return false;
    }, true);
    // #endif*/

    function reset() {
        this.setProperty('networkState',  jpf.Media.NETWORK_EMPTY);
        //this.setProperty('readyState',   jpf.Media.HAVE_NOTHING);
        this.setProperty('ready',         false);
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
        // #ifdef __DEBUG
        jpf.console.log('Media: reloading medium with mimetype ', this.type);
        // #endif

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
    this.networkState       = jpf.Media.NETWORK_EMPTY; //default state
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
    this.readyState = jpf.Media.HAVE_NOTHING;
    this.seeking    = false;

    // playback state
    this.currentTime         = this.duration = 0;
    this.paused              = true;
    this.defaultPlaybackRate = this.playbackRate = 0;
    this.played              = null; // TimeRanges container
    this.seekable            = null; // TimeRanges container
    this.ended = this.autoplay = false;

    /**
     * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#dom-navigator-canplaytype
     */
    this.canPlayType = function(sType) {
        if (this.$getPlayerType) {
            var sPlayer = this.$getPlayerType(sType);
            if (!sPlayer || !this.$isSupported(sPlayer))
                return "no";
            if (sPlayer.indexOf("Wmp") != -1)
                return "maybe";
            return "probably"; //we're sooo confident ;)
        }

        return "no";
    };

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

    /**
     * Set the source for a media element by going through all the &lt;source&gt;
     * child elements of the &lt;audio&gt; or &lt;video&gt; node, searching for
     * a valid source media file that is playable by one of our plugins.
     * The 'src' and 'type' attributes respectively have precedence over any
     * &lt;source&gt; element.
     * It also parses the &lt;nomedia&gt; tag that specifies what text or HTML to
     * display when a medium is not supported and/ or playable.
     *
     * @param  {XmlDomElement} [jml] Parent Jml node of the player
     * @return {Boolean}             Tells the client that no supported/ playable source file was found
     */
    this.setSource = function(jml) {
        jml = jml || this.$jml;
        // first get the 'Not supported' placeholder...
        var aNodes = $xmlns(jml, "nomedia", jpf.ns.jml);
        if (!aNodes.length) {
            this.notSupported = (jml.firstChild && jml.firstChild.nodeType == 3)
                ? jml.firstChild.nodeValue
                : "Unable to playback, medium not supported.";
        }
        else
            this.notSupported = aNodes[0].innerHTML;

        if (!this.src) { // no direct src-attribute set
            var src, type, oSources = $xmlns(jml, "source", jpf.ns.jml);
            // iterate through all the <source> tags from left to right
            for (var i = 0, j = oSources.length; i < j; i++) {
                src  = oSources[i].getAttribute("src");
                if (!src) continue;
                type = oSources[i].getAttribute("type");
                if (!type) // auto-detect type, based on file extension
                    type = this.$guessType(src);
                if (this.canPlayType(type) != "no") {
                    // yay! we found a type that we can play for the client
                    this.src  = src;
                    this.type = type;
                    break; //escape!
                }
            }
        }
        else if (!this.type) {
            this.type = this.$guessType(this.src);
            if (this.canPlayType(this.type) == "no")
                return false;
        }

        return (this.src && this.type);
    };
};

// network state (.networkState)
jpf.Media.NETWORK_EMPTY   = 0;
jpf.Media.NETWORK_IDLE    = 1;
jpf.Media.NETWORK_LOADING = 2;
jpf.Media.NETWORK_LOADED  = 3;

// ready state (.readyState)
jpf.Media.HAVE_NOTHING      = 0;
jpf.Media.HAVE_METADATA     = 1;
jpf.Media.HAVE_SOME_DATA    = 2; //wtf??
jpf.Media.HAVE_CURRENT_DATA = 3;
jpf.Media.HAVE_FUTURE_DATA  = 4;
jpf.Media.HAVE_ENOUGH_DATA  = 5;

// #endif
