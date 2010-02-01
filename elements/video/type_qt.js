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

apf.video.TypeQTCompat = (function(){
    var gTagAttrs           = null;
    var gQTBehaviorID       = "qt_event_source";
    var gQTEventsEnabled    = true;

    /**
     * Create an <OBJECT> tag for Internet Explorer only, that will enable us to
     * capture events from the Quicktime Player object.
     *
     * @type {String}
     */
    function _QTGenerateBehavior(){
        return apf.isIE
            ? '<object id="' + gQTBehaviorID
              + '" classid="clsid:CB927D12-4FF7-4a9e-A169-56E4B8A75598" \
              codebase="http://www.apple.com/qtactivex/qtplugin.cab#version=7,3,0,0"></object>'
            : '';
    }

    /**
     * Check if the behavior object from _QTGenerateBehavior() has been inserted
     * into the DOM already.
     *
     * @param {String} callingFcnName
     * @param {Object} args
     * @type  {Boolean}
     */
    function _QTPageHasBehaviorObject(callingFcnName, args){
        var haveBehavior = false;
        var objects = document.getElementsByTagName("object");

        for (var ndx = 0, obj; obj = objects[ndx]; ndx++) {
            if (obj.getAttribute("classid") == "clsid:CB927D12-4FF7-4a9e-A169-56E4B8A75598") {
                if (obj.getAttribute("id") == gQTBehaviorID)
                    haveBehavior = false;
                break;
            }
        }

        return haveBehavior;
    }

    /**
     * Check if we should insert an object tag for behaviors seperately, in order
     * to be able to catch events.
     *
     * @type {Boolean}
     */
    function _QTShouldInsertBehavior(){
        var shouldDo = false;

        if (gQTEventsEnabled && apf.isIE && !_QTPageHasBehaviorObject())
            shouldDo = true;

        return shouldDo;
    }

    /**
     * Apple function soup.
     *
     * @param {String} prefix
     * @param {String} slotName
     * @param {String} tagName
     */
    function _QTAddAttribute(prefix, slotName, tagName){
        var value;

        value = gTagAttrs[prefix + slotName];
        if (null == value)
            value = gTagAttrs[slotName];

        if (null != value) {
            if (0 == slotName.indexOf(prefix) && (null == tagName))
                tagName = slotName.substring(prefix.length);
            if (null == tagName)
                tagName = slotName;
            return ' ' + tagName + '="' + value + '"';
        }
        else
            return "";
    }

    /**
     * Apple function soup.
     *
     * @param {String} slotName
     * @param {String} tagName
     */
    function _QTAddObjectAttr(slotName, tagName){
        // don't bother if it is only for the embed tag
        if (0 == slotName.indexOf("emb#"))
            return "";

        if (0 == slotName.indexOf("obj#") && (null == tagName))
            tagName = slotName.substring(4);

        return _QTAddAttribute("obj#", slotName, tagName);
    }

    /**
     * Create and parse an attribute of the <EMBED> that is created.
     *
     * @param {String} slotName
     * @param {String} tagName
     * @type  {String}
     */
    function _QTAddEmbedAttr(slotName, tagName){
        // don't bother if it is only for the object tag
        if (0 == slotName.indexOf("obj#"))
            return "";

        if (0 == slotName.indexOf("emb#") && (null == tagName))
            tagName = slotName.substring(4);

        return _QTAddAttribute("emb#", slotName, tagName);
    }

    /**
     * Create a <PARAM> tag to be placed inside an <OBJECT> tag
     *
     * @param {String}  slotName
     * @param {Boolean} generateXHTML
     * @type  {String}
     */
    function _QTAddObjectParam(slotName, generateXHTML){
        var paramValue;
        var paramStr = "";
        var endTagChar = (generateXHTML) ? " />" : ">";

        if (-1 == slotName.indexOf("emb#")) {
            // look for the OBJECT-only param first. if there is none, look for a generic one
            paramValue = gTagAttrs["obj#" + slotName];
            if (null == paramValue)
                paramValue = gTagAttrs[slotName];

            if (0 == slotName.indexOf("obj#"))
                slotName = slotName.substring(4);

            if (null != paramValue)
                paramStr = '<param name="' + slotName + '" value="' + paramValue + '"' + endTagChar;
        }

        return paramStr;
    }

    /**
     * Unset all globally declared attributes to its original values.
     *
     * @type {void}
     */
    function _QTDeleteTagAttrs(){
        for (var ndx = 0; ndx < arguments.length; ndx++) {
            var attrName = arguments[ndx];
            delete gTagAttrs[attrName];
            delete gTagAttrs["emb#" + attrName];
            delete gTagAttrs["obj#" + attrName];
        }
    }

    /**
     * Generate an embed and object tag, return as a string
     *
     * @param {String}  callingFcnName
     * @param {Boolean} generateXHTML
     * @param {Array}   args
     * @type  {String}
     */
    function _QTGenerate(callingFcnName, generateXHTML, args){
        // allocate an array, fill in the required attributes with fixed place params and defaults
        gTagAttrs = {
            src        : args[0],
            width      : args[1],
            height     : args[2],
            classid    : "clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B",
            //Important note: It is recommended that you use this exact classid in order to ensure a seamless experience for all viewers
            pluginspage: "http://www.apple.com/quicktime/download/"
        };

        // set up codebase attribute with specified or default version before parsing args so
        // anything passed in will override
        var activexVers = args[3]
        if ((null == activexVers) || ("" == activexVers))
            activexVers = "7,3,0,0";
        gTagAttrs["codebase"] = "http://www.apple.com/qtactivex/qtplugin.cab#version=" + activexVers;

        var attrName, attrValue;

        // add all of the optional attributes to the array
        for (var ndx = 4; ndx < args.length; ndx += 2) {
            attrName = args[ndx].toLowerCase();
            attrValue = args[ndx + 1];

            gTagAttrs[attrName] = attrValue;

            if (("postdomevents" == attrName) && (attrValue.toLowerCase() != "false")) {
                gQTEventsEnabled = true;
                if (apf.isIE)
                    gTagAttrs["obj#style"] = "behavior:url(#" + gQTBehaviorID + ")";
            }
        }

        // init both tags with the required and "special" attributes
        var objTag = ["<object ",
            _QTAddObjectAttr("classid"),
            _QTAddObjectAttr("width"),
            _QTAddObjectAttr("height"),
            _QTAddObjectAttr("codebase"),
            _QTAddObjectAttr("name"),
            _QTAddObjectAttr("id"),
            _QTAddObjectAttr("tabindex"),
            _QTAddObjectAttr("hspace"),
            _QTAddObjectAttr("vspace"),
            _QTAddObjectAttr("border"),
            _QTAddObjectAttr("align"),
            _QTAddObjectAttr("class"),
            _QTAddObjectAttr("title"),
            _QTAddObjectAttr("accesskey"),
            _QTAddObjectAttr("noexternaldata"),
            _QTAddObjectAttr("obj#style"),
            ">",
            _QTAddObjectParam("src", generateXHTML)];
        var embedTag = ["<embed ",
            _QTAddEmbedAttr("src"),
            _QTAddEmbedAttr("width"),
            _QTAddEmbedAttr("height"),
            _QTAddEmbedAttr("pluginspage"),
            _QTAddEmbedAttr("name"),
            _QTAddEmbedAttr("id"),
            _QTAddEmbedAttr("align"),
            _QTAddEmbedAttr("tabindex")];

        // delete the attributes/params we have already added
        _QTDeleteTagAttrs("src", "width", "height", "pluginspage", "classid",
            "codebase", "name", "tabindex", "hspace", "vspace", "border",
            "align", "noexternaldata", "class", "title", "accesskey", "id", "style");

        // and finally, add all of the remaining attributes to the embed and object
        for (var attrName in gTagAttrs) {
            attrValue = gTagAttrs[attrName];
            if (null != attrValue) {
                embedTag.push(_QTAddEmbedAttr(attrName));
                objTag.push(_QTAddObjectParam(attrName, generateXHTML));
            }
        }

        // end both tags, we're done
        return objTag.join("") + embedTag.join("") + "></em" + "bed></ob" + "ject" + ">";
    }

    /**
     * Generate an embed and object tag, return as a string and append a behavior
     * script if necessary.
     *
     * @type {String}
     */
    function QT_GenerateOBJECTText(){
        var txt = _QTGenerate("QT_GenerateOBJECTText_XHTML", true, arguments);
        if (_QTShouldInsertBehavior())
            txt = _QTGenerateBehavior() + txt;
        return txt;
    }

    /**
     * Checks if Apple QuickTime has been installed and is accessible on the
     * client's browser.
     *
     * @type {Boolean}
     */
    function QT_IsInstalled(){
        var U = false;
        if (navigator.plugins && navigator.plugins.length) {
            for(var M = 0; M < navigator.plugins.length; M++) {
                var g = navigator.plugins[M];
                if (g.name.indexOf("QuickTime") > -1)
                    U = true;
            }
        }
        else {
            var qtObj = false;
            execScript("on error resume next: qtObj = IsObject(CreateObject(\"QuickTimeCheckObject.QuickTimeCheck.1\"))", "VBScript");
            U = qtObj;
        }
        return U;
    }

    /**
     * Retrieve the version number of the Apple Quicktime browser plugin.
     *
     * @type {String}
     */
    function QT_GetVersion() {
        var U = "0";
        if (navigator.plugins && navigator.plugins.length) {
            for (var g = 0; g < navigator.plugins.length; g++) {
                var S = navigator.plugins[g];
                var M = S.name.match(/quicktime\D*([\.\d]*)/i);
                if (M && M[1])
                    U = M[1];
            }
        }
        else {
            var ieQTVersion = null;
            execScript("on error resume next: ieQTVersion = CreateObject(\"QuickTimeCheckObject.QuickTimeCheck.1\").QuickTimeVersion", "VBScript");
            if (ieQTVersion) {
                var temp = "";
                U = (ieQTVersion).toString(16) / 1000000 + "";//(ieQTVersion>>24).toString(16);
                temp += parseInt(U) + ".";
                temp += ((parseFloat(U) - parseInt(U)) * 1000) / 100 + "";
                U = temp;
            }
        }
        return U;
    }

    /**
     * Check if the currently installed version of Apple Quicktime is compatible
     * with the version specified with major number as g and minor as j.
     *
     * @param {String} g
     * @param {String} j
     * @type  {Boolean}
     */
    function QT_IsCompatible(g, j){
        function M(w, R) {
            var i = parseInt(w[0], 10);
            if (isNaN(i))
                i = 0;
            var V = parseInt(R[0], 10);
            if (isNaN(V))
                V = 0;
            if (i === V) {
                if (w.length > 1)
                    return M(w.slice(1), R.slice(1));
                else
                    return true;
            }
            else
                return (i < V);
        }
        var S = g.split(/\./);
        var U = j ? j.split(/\./) : QT_GetVersion().split(/\./);
        return M(S, U);
    }

    var aIsAvailable = {};
    /*
     * Checks whether a valid version of Apple Quicktime is available on the
     * clients' system. Default version to check for is 7.2.1, because that was
     * the first version that supported the scripting interface.
     *
     * @param {String} sVersion
     * @type  {Boolean}
     */
    function QT_IsValidAvailable(sVersion) {
        if (typeof sVersion == "undefined")
            sVersion = "7.2.1";
        if (typeof aIsAvailable[sVersion] == "undefined")
            aIsAvailable[sVersion] = QT_IsInstalled() && QT_IsCompatible(sVersion);
        return aIsAvailable[sVersion];
    }

    return {
        generateOBJECTText: QT_GenerateOBJECTText,
        isAvailable       : QT_IsValidAvailable
    };
})();

/**
 * Element displaying a Apple Quicktime video (.mov)
 *
 * @classDescription This class creates a new Quicktime video player
 * @return {TypeQT} Returns a new Quicktime video player
 * @type {TypeQT}
 * @constructor
 * @addnode elements:video
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
apf.video.TypeQT = function(oVideo, node, options) {
    this.oVideo      = oVideo;
    this.name        = "QT_" + this.oVideo.$uniqueId;
    this.htmlElement = node;

    // Properties set by QT player
    this.videoWidth = this.videoHeight = this.totalTime =
        this.bytesLoaded = this.totalBytes = 0;
    this.state = null;

    // Internal properties that match get/set methods
    this.autoPlay = this.autoLoad = this.showControls = true;
    this.volume   = 50;
    this.mimeType = "video/quicktime";

    this.firstLoad   = true;
    this.pluginError = false;

    this.pollTimer   = null;
    this.videoPath   = options.src;

    this.player = null;
    apf.extend(this, apf.video.TypeInterface);

    this.setOptions(options);
    var _self = this;
    window.setTimeout(function() {
        _self.oVideo.$initHook({state: 1});
    }, 1);
}

apf.video.TypeQT.isSupported = function() {
    // QuickTime 7.2.1 is the least we'd expect, no?
    return apf.video.TypeQTCompat.isAvailable();
}

apf.video.TypeQT.prototype = {
    /**
     * Play a Quicktime movie. Does a call to the embedded QT object to load or
     * load & play the video, depending on the 'autoPlay' flag (TRUE for play).
     *
     * @param {String} videoPath Path to the movie.
     * @type  {Object}
     */
    load: function(videoPath) {
        this.videoPath = videoPath.splitSafe(",")[this.oVideo.$lastMimeType] || videoPath;
        return this.$draw().attachEvents();
    },

    /**
     * Play and/ or resume a video that has been loaded already
     *
     * @type {Object}
     */
    play: function() {
        if (this.player) {
            try {
                this.player.Play();
                if (apf.isIE)
                    this.handleEvent({type: "qt_play"});
            }
            catch(e) {
                this.oVideo.$stateChangeHook({type: "stateChange", state: "connectionError"});
            }
        }
        return this;
    },

    /**
     * Toggle the pause state of the video.
     *
     * @type {Object}
     */
    pause: function() {
        if (this.player) {
            try {
                this.player.Stop();
                if (apf.isIE)
                    this.handleEvent({type: "qt_pause"});
            }
            catch(e) {
                this.oVideo.$stateChangeHook({type: "stateChange", state: "connectionError"});
            }
        }
        return this;
    },

    /**
     * Stop playback of the video.
     *
     * @type {Object}
     */
    stop: function() {
        return this.pause();
    },

    /**
     * Seek the video to a specific position.
     *
     * @param {Number} iTo The number of seconds to seek the playhead to.
     * @type  {Object}
     */
    seek: function(iTo) {
        if (!this.player) return;
        try {
            this.player.SetTime(iTo);
        }
        catch(e) {
            this.oVideo.$stateChangeHook({type: "stateChange", state: "connectionError"});
        }
        return this;
    },

    /**
     * Set the volume of the video to a specific range (0 - 100)
     *
     * @param {Number} iVolume
     * @type  {Object}
     */
    setVolume: function(iVolume) {
        if (this.player) {
            try {
                this.player.SetVolume(Math.round((iVolume / 100) * 256));
            }
            catch(e) {
                this.oVideo.$stateChangeHook({type: "stateChange", state: "connectionError"});
            }
        }
        return this;
    },

    /**
     * Retrieve the total playtime of the video, in seconds.
     *
     * @type {Number}
     */
    getTotalTime: function() {
        if (!this.player) return 0;
        return this.player.GetDuration();
    },

    /**
     * Draw the HTML for an Apple Quicktime video control (<OBJECT> tag)
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

        this.htmlElement.innerHTML = apf.video.TypeQTCompat.generateOBJECTText(
                this.videoPath, "100%", "100%", "",
                "autoplay",            apf.isIE ? "false" : this.autoPlay.toString(), //Not unloading of plugin, bad bad bad hack by Ruben
                "controller",          this.showControls.toString(),
                "kioskmode",           "true",
                "showlogo",            "true",
                "bgcolor",             "black",
                "scale",               "aspect",
                "align",               "middle",
                "EnableJavaScript",    "True",
                "postdomevents",       "True",
                "target",              "myself",
                "cache",               "false",
                "qtsrcdontusebrowser", "true",
                "type",                this.mimeType.splitSafe(",")[this.oVideo.$lastMimeType] || this.mimeType,
                "obj#id",              this.name,
                "emb#NAME",            this.name,
                "emb#id",              this.name + "emb");

        this.player = document[this.name];

        return this;
    },

    events: ["qt_begin", "qt_abort", "qt_canplay", "qt_canplaythrough",
             "qt_durationchange", "qt_ended", "qt_error", "qt_load",
             "qt_loadedfirstframe", "qt_loadedmetadata", "qt_pause", "qt_play",
             "qt_progress", "qt_stalled", "qt_timechanged", "qt_volumechange",
             "qt_waiting"],

    /**
     * Subscribe to events that will be fired by the Quicktime player during playback
     * of the mov file.
     *
     * @type {Object}
     */
    attachEvents: function() {
        var nodeEvents = document.getElementById(this.name);
        if (!nodeEvents) //try the embed otherwise ;)
            nodeEvents = document.getElementById(this.name + "emb");
        var _self = this;
        function exec(e) {
            if (!e) e = window.event;
            _self.handleEvent(e);
        }

        var hook = nodeEvents.addEventListener ? "addEventListener" : "attachEvent";
        var pfx  = nodeEvents.addEventListener ? "" : "on";
        this.events.forEach(function(evt) {
            nodeEvents[hook](pfx + evt, exec, false);
        });

        if (apf.isIE && this.autoPlay)
            this.handleEvent({type: "qt_play"});

        return this;
    },

    /**
     * Callback from Quicktime plugin; whenever the player bubbles an event up
     * to the javascript interface, it passes through to this function.
     *
     * @param {Object} e
     * @type  {Object}
     */
    handleEvent: function(e) {
        switch (e.type) {
            case "qt_play":
                this.oVideo.$stateChangeHook({type: "stateChange", state: "playing"});
                this.startPlayPoll();
                break;
            case "qt_pause":
                this.oVideo.$stateChangeHook({type: "stateChange", state: "paused"});
                this.stopPlayPoll();
                break;
            case "qt_volumechange":
                // volume has to be normalized to 100 (Apple chose a range from 0-256)
                this.oVideo.$changeHook({
                    type  : "change",
                    volume: Math.round((this.player.GetVolume() / 256) * 100)
                });
                break;
            case "qt_timechanged":
                this.oVideo.$changeHook({
                    type        : "change",
                    playheadTime: this.player.GetTime()
                });
                break;
            case "qt_stalled":
                this.oVideo.$completeHook({type: "complete"});
                this.stopPlayPoll();
                break;
            case "qt_canplay":
                this.oVideo.$readyHook({type: "ready"});
                break;
            // unique QT stuff:
            //case "qt_loadedmetadata":
            //    this.oVideo.$metadataHook();
            //    break;
            case "qt_load":
            case "qt_canplaythrough":
                this.oVideo.setProperty("readyState", apf.Media.HAVE_ENOUGH_DATA);
                if (this.autoPlay && apf.isIE) //Not unloading of plugin, bad bad bad hack by Ruben
                    this.player.Play();
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
            if (!_self.player) return;
            try {
                _self.handleEvent({type: "qt_timechanged"});
                var iLoaded = _self.player.GetMaxBytesLoaded();
                var iTotal  = _self.player.GetMovieSize();
                _self.oVideo.$progressHook({
                    bytesLoaded: iLoaded,
                    totalBytes : iTotal
                });
                if (!_self.oVideo.ready && Math.abs(iLoaded - iTotal) <= 20)
                    _self.handleEvent({type: "qt_load"});
            }
            catch (e) {}
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

    $destroy: function() {
        this.stopPlayPoll();
        if (this.player) {
            try {
                this.player.Stop();
            }
            catch (e) {}
            this.player = null;
            delete this.player;
        }
        this.oVideo = this.htmlElement = null;
        delete this.oVideo;
        delete this.htmlElement;
    }
};
// #endif
