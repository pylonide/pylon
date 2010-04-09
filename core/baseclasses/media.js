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

apf.__MEDIA__ = 1 << 20;

// #ifdef __WITH_MEDIA

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have media node features and dynamics.
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/video.html#media7
 *
 * @attribute {Boolean} seeking
 * @attribute {Boolean} autoplay
 * @attribute {Boolean} controls
 * @attribute {Boolean} ready
 * @attribute {Number}  bufferedBytes
 * @attribute {Number}  totalBytes
 *
 * @constructor
 * @baseclass
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
apf.Media = function(){
    this.$init(true);
};

(function() {
    this.$regbase = this.$regbase | apf.__MEDIA__;

    this.muted = false;

    this.$booleanProperties["paused"]     = true;
    this.$booleanProperties["muted"]      = true;
    this.$booleanProperties["seeking"]    = true;
    this.$booleanProperties["autoplay"]   = true;
    this.$booleanProperties["controls"]   = true;
    this.$booleanProperties["ready"]      = true;

    this.$supportedProperties.push("position", "networkState", "readyState",
        "progress", "buffered", "bufferedBytes", "totalBytes", "currentTime",
        "paused", "seeking", "volume", "type", "src", "autoplay", "controls");

    this.$mainBind  = "src";
    this.$sources   = [];
    this.$nomedia   = null;
    this.$amlTimer  = null;
    this.$loadTimer = null;
    this.$posTimer  = null;
    this.$volTimer  = null;

    /**
     * @attribute {Number} readyState 
     */
    this.$propHandlers["readyState"] = function(value){ //in seconds
        if (this.readyState !== value)
            this.readyState = value;
        if (value == apf.Media.HAVE_NOTHING) {
            // #ifdef __DEBUG
            apf.console.error("Unable to open medium with URL '" + this.src
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
        else if (value == apf.Media.HAVE_CURRENT_DATA)
            this.dispatchEvent("havecurrentdata");
        else if (value == apf.Media.HAVE_FUTURE_DATA)
            this.dispatchEvent("havefuturedata");
        else if (value == apf.Media.HAVE_ENOUGH_DATA) {
            this.dispatchEvent("haveenoughdata");
            this.setProperty("ready", true);
        }
    };

    /**
     * @attribute {Object} bufferedBytes
     *   Object:
     *    {Number} start
     *    {Number} end
     *    {Number} total
     */
    this.$propHandlers["bufferedBytes"] = function(value) {
        this.setProperty("progress", this.totalBytes
            ? value.end / this.totalBytes
            : 0);
    };

    /**
     * @attribute {Number} position
     */
    this.$propHandlers["position"] = function(value){
        clearTimeout(this.$posTimer);
        if (this.duration <= 0 || !this.seek) return;

        var _self = this;
        this.$posTimer = $setTimeout(function() {
            // first, check if the seek action doesn't go beyond the download
            // progress of the media element.
            if (value >= _self.progress)
                value = _self.progress - 0.05;

            var isPlaying = !_self.paused;
            if (isPlaying)
                _self.pause();

            if (value < 0)
                value = 0;
            else if (value > 1)
                value = 1;

            _self.seek(Math.round(value * _self.duration));

            _self.setProperty("paused", !isPlaying);
        });
    };

    /**
     * @attribute {Number} currentTime
     */
    this.$propHandlers["currentTime"] = function(value){ //in milliseconds
        if (value >= 0 && this.seek)
            this.seek(value);
    };

    /**
     * @attribute {Number} volume
     */
    this.$propHandlers["volume"] = function(value){
        if (!this.player) return;
        // #ifdef __DEBUG
        if (value < 0)
            throw this.MediaError("Attempt to set the volume to a negative value  '" + value + "'");
        // #endif

        if (value < 1 && value > 0)
            value = value * 100;

        if (this.setVolume)
            this.setVolume(value);
        if (value > 0 && this.muted)
            this.setProperty("muted", false);
    };

    this.oldVolume = null;

    /**
     * @attribute {Boolean} muted
     */
    this.$propHandlers["muted"] = function(value){
        if (!this.player || !this.setVolume) return;

        if (value) { //mute the player
            this.oldVolume = this.volume;
            this.setVolume(0);
        }
        else
            this.setVolume(this.oldVolume || 20);
    };

    /**
     * @attribute {Boolean} paused
     */
    this.$propHandlers["paused"] = function(value){
        if (!this.player) return;

        this.paused = apf.isTrue(value);
        if (this.paused)
            this.player.pause();
        else
            this.player.play();
    };

    /**
     * @attribute {String} type
     */
    this.$propHandlers["type"] = function(value){
        if (this.$loadTimer) return;

        var _self = this;
        this.$loadTimer = window.setTimeout(function() {
            reload.call(_self);
        });
    };

    /**
     * @attribute {String} src
     */
    this.$propHandlers["src"] = function(value){
        //@todo for mike: please check if this is the best behaviour for setting an empty value
        if (this.$loadTimer || !value) return;

        var oUrl = new apf.url(value);
        this.src = oUrl.uri;

        // #ifdef __DEBUG
        if (oUrl.protocol == "file")
            apf.console.warn("Media player: the medium with URL '" + this.src + "'\n"
                + "will be loaded through the 'file://' protocol.\nThis can "
                + "cause the medium to not load and/ or play.", "media");
        else if (!oUrl.isSameLocation())
            apf.console.warn("Media player: the medium with URL '" + this.src + "'\n"
                + "does not have the same origin as your web application.\nThis can "
                + "cause the medium to not load and/ or play.", "media");
        // #endif

        if (this.src != this.currentSrc && this.networkState !== apf.Media.LOADING) {
            var type = this.$guessType(this.src);
            if (type == this.type) {
                reset.call(this);
                this.loadMedia();
            }
            else {
                this.type = type;
                var _self = this;
                this.$loadTimer = window.setTimeout(function() {
                    reload.call(_self);
                });
            }
        }
    };

    /**
     * @attribute {Object} ID3
     */
    this.$propHandlers["ID3"] = function(value){
        if (!this.player) return;
        // usually this feature is only made available BY media as getters
        if (typeof this.player.setID3 == "function")
            this.player.setID3(value);
    };

    /**** DOM Hooks ****/

    this.addEventListener("AMLRemove", function(doOnlyAdmin){
        // #ifdef __DEBUG
        apf.console.log("Media: removing node...");
        // #endif
        reset.call(this);
    });

    this.addEventListener("AMLReparent", function(beforeNode, pNode, withinParent){
        if (!this.$amlLoaded)
            return;

        // #ifdef __DEBUG
        apf.console.log("Media: reparenting - " + beforeNode + ", " + pNode);
        // #endif

        this.$draw();
        reload.call(this, true);
    });

    function reset() {
        this.setProperty("networkState",  apf.Media.NETWORK_EMPTY);
        //this.setProperty("readyState",   apf.Media.HAVE_NOTHING);
        this.setProperty("ready",         false);
        //this.setProperty("buffered",      {start: 0, end: 0, length: 0});
        //this.setProperty("bufferedBytes", {start: 0, end: 0, length: 0});
        this.buffered      = {start: 0, end: 0, length: 0};
        this.bufferedBytes = {start: 0, end: 0, length: 0};
        this.totalBytes    = 0;
        this.setProperty("progress", 0);
        //this.setProperty("totalBytes",    0);

        this.setProperty("seeking",  false);
        this.setProperty("paused",   true);
        this.setProperty("position", 0);
        this.currentTime = this.duration = 0;
        this.played = this.seekable = null;
        this.ended  = false;

        this.start = this.end = this.loopStart = this.loopEnd =
            this.playCount = this.currentLoop = 0;
        this.controls = this.muted = false;
    }

    function reload(bNoReset) {
        // #ifdef __DEBUG
        apf.console.log("Media: reloading medium with mimetype '" + this.type + "'");
        // #endif

        window.clearTimeout(this.$loadTimer);
        this.$loadTimer = null;

        if (!bNoReset)
            reset.call(this);

        this.$destroy(true); //bRuntime = true

        this.playerType = this.$getPlayerType(this.type);

        // sanity checking
        if (!this.playerType || !this.$isSupported()) {
            this.$ext.innerHTML = this.notSupported;
            return;
        }

        this.$initPlayer();
    }

    /**
     * Returns an error state related to media
     *
     */
    this.MediaError = function(sMsg) {
        return new Error(apf.formatErrorString(0, this, "Media", sMsg));
    };

    // network state
    this.src = this.currentSrc = null;
    this.networkState       = apf.Media.NETWORK_EMPTY; //default state
    this.bufferingRate      = 0;
    this.bufferingThrottled = false;
    //TimeRanges container {start: Function(idx):Float, end: Function(idx):Float, length: n}
    this.buffered           = {start: 0, end: 0, length: 0};
    //ByteRanges container {start: Function(idx):Number, end: Function(idx):Number, length: n}
    this.bufferedBytes      = {start: 0, end: 0, length: 0};
    this.totalBytes         = 0;
    this.volume             = 100;

    this.loadMedia = function() {
        //must be overridden by the component
    };

    // ready state
    this.readyState = apf.Media.HAVE_NOTHING;
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
    
    /**
     * Starts playing the media requested
     *
     */
    this.play = function() {
        this.setProperty("paused", false);
    };

    /**
     * Pauses playing the media requested
     *
     */
    this.pause = function() {
        this.setProperty("paused", true);
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
        // for String.pad, 'apf.PAD_LEFT' is implicit
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
     * @param  {XmlDomElement} [aml] Parent Aml node of the player
     * @return {Boolean}             Tells the client that no supported/ playable source file was found
     */
    this.setSource = function() {
        if (!this.src) { // no direct src-attribute set
            var src, type, oSources = this.$sources;
            // iterate through all the <source> tags from left to right
            for (var i = 0, j = oSources.length; i < j; i++) {
                src  = oSources[i].src;
                if (!src) continue;
                type = oSources[i].type;
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

    this.$addSource = function(amlNode) {
        clearTimeout(this.$amlTimer);

        if (amlNode.localName != "source"){
            // #ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, this,
                "Parsing Media node",
                "Found element which is not a source element", this));
            // #endif
            return false;
        }

        this.$sources.pushUnique(amlNode);

        var _self = this;
        this.$amlTimer = $setTimeout(function() {
            clearTimeout(_self.$amlTimer);
            _self.dispatchEvent("AMLMediaReady");
        });
    };

    this.$removeSource = function(amlNode) {
        this.$sources.remove(amlNode);
    };

    this.addEventListener("DOMNodeInserted", function(e){
        if (e.relatedNode != this || e.currentTarget.nodeType != 1) //@todo shouldn't this check for localName?
            return;

        this.$addSource(e.currentTarget);
    });

    this.addEventListener("DOMNodeRemoved", function(e){
        var node = e.currentTarget;
        // we support two levels deep:
        if (!(node.parentNode == this || node.parentNode.parentNode == this))
            return;

        this.$removeSource(node);
    });

// #ifdef __WITH_DATABINDING
}).call(apf.Media.prototype = new apf.StandardBinding());
/* #else
}).call(apf.Media.prototype = new apf.Presentation());
#endif*/

apf.nomedia = function(struct, tagName) {
    this.$init(tagName || "nomedia", apf.NODE_HIDDEN, struct);
};

(function() {
    this.addEventListener("DOMNodeInsertedIntoDocument", function() {
        this.parentNode.notSupported =
            apf.getXmlString(this.$aml).replace(/<\/?a:nomedia[^>]*>/g, "");
    });
}).call(apf.nomedia.prototype = new apf.AmlElement());

apf.aml.setElement("nomedia", apf.nomedia);

// network state (.networkState)
apf.Media.NETWORK_EMPTY   = 0;
apf.Media.NETWORK_IDLE    = 1;
apf.Media.NETWORK_LOADING = 2;
apf.Media.NETWORK_LOADED  = 3;

// ready state (.readyState)
apf.Media.HAVE_NOTHING      = 0;
apf.Media.HAVE_METADATA     = 1;
apf.Media.HAVE_SOME_DATA    = 2; //wtf??
apf.Media.HAVE_CURRENT_DATA = 3;
apf.Media.HAVE_FUTURE_DATA  = 4;
apf.Media.HAVE_ENOUGH_DATA  = 5;

// #endif
