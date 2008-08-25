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
jpf.type_qt = {};

jpf.video.TypeQTCompat = (function(){
    /*
     * This class contains functions to generate OBJECT and EMBED tags for QuickTime content.
     */
    var gTagAttrs           = null;
    var gQTBehaviorID       = "qt_event_source";
    var gQTEventsEnabled    = false;
    
    function _QTGenerateBehavior(){
        return objTag = '<!--[if IE]>' +
        '<object id="' +
        gQTBehaviorID +
        '" classid="clsid:CB927D12-4FF7-4a9e-A169-56E4B8A75598"></object>' +
        '<![endif]-->';
    }
    
    function _QTPageHasBehaviorObject(callingFcnName, args){
        var haveBehavior = false;
        var objects = document.getElementsByTagName('object');
        
        for (var ndx = 0, obj; obj = objects[ndx]; ndx++) {
            if (obj.getAttribute('classid') == "clsid:CB927D12-4FF7-4a9e-A169-56E4B8A75598") {
                if (obj.getAttribute('id') == gQTBehaviorID) 
                    haveBehavior = false;
                break;
            }
        }
        
        return haveBehavior;
    }
    
    function _QTShouldInsertBehavior(){
        var shouldDo = false;
        
        if (gQTEventsEnabled && jpf.isIE && !_QTPageHasBehaviorObject()) 
            shouldDo = true;
        
        return shouldDo;
    }
    
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
    
    function _QTAddObjectAttr(slotName, tagName){
        // don't bother if it is only for the embed tag
        if (0 == slotName.indexOf("emb#")) 
            return "";
        
        if (0 == slotName.indexOf("obj#") && (null == tagName)) 
            tagName = slotName.substring(4);
        
        return _QTAddAttribute("obj#", slotName, tagName);
    }
    
    function _QTAddEmbedAttr(slotName, tagName){
        // don't bother if it is only for the object tag
        if (0 == slotName.indexOf("obj#")) 
            return "";
        
        if (0 == slotName.indexOf("emb#") && (null == tagName)) 
            tagName = slotName.substring(4);
        
        return _QTAddAttribute("emb#", slotName, tagName);
    }
    
    function _QTAddObjectParam(slotName, generateXHTML){
        var paramValue;
        var paramStr = "";
        var endTagChar = (generateXHTML) ? ' />' : '>';
        
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
    
    function _QTDeleteTagAttrs(){
        for (var ndx = 0; ndx < arguments.length; ndx++) {
            var attrName = arguments[ndx];
            delete gTagAttrs[attrName];
            delete gTagAttrs["emb#" + attrName];
            delete gTagAttrs["obj#" + attrName];
        }
    }
    
    // generate an embed and object tag, return as a string
    function _QTGenerate(callingFcnName, generateXHTML, args){
        // allocate an array, fill in the required attributes with fixed place params and defaults
        gTagAttrs = {
            src        : args[0],
            width      : args[1],
            height     : args[2],
            classid    : "clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B",
            //Impportant note: It is recommended that you use this exact classid in order to ensure a seamless experience for all viewers
        	pluginspage: "http://www.apple.com/quicktime/download/"
        };
        
        // set up codebase attribute with specified or default version before parsing args so
        //  anything passed in will override
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
                if (jpf.isIE) 
                    gTagAttrs["obj#style"] = "behavior:url(#" + gQTBehaviorID + ")";
            }
        }
        
        // init both tags with the required and "special" attributes
        var objTag = ['<object ',
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
            '>',
            _QTAddObjectParam("src", generateXHTML)];
        var embedTag = ['<embed ',
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
        return objTag.join('') + embedTag.join('') + '></em' + 'bed></ob' + 'ject' + '>';
    }
        
    function QT_GenerateOBJECTText(){
        var txt = _QTGenerate("QT_GenerateOBJECTText_XHTML", true, arguments);
        if (_QTShouldInsertBehavior()) 
            txt = _QTGenerateBehavior() + txt;
        return txt;
    }
        
    function QT_IsInstalled(){
        var U = false;
        if (navigator.plugins && navigator.plugins.length) {
            for(var M = 0; M < navigator.plugins.length; M++) {
                var g = navigator.plugins[M];
                if (g.name.indexOf("QuickTime") > -1)
                    U = true;
            }
        } else {
            qtObj = false;
            execScript("on error resume next: qtObj = IsObject(CreateObject(\"QuickTimeCheckObject.QuickTimeCheck.1\"))", "VBScript");
            U = qtObj;
        }
        return U;
    }
    
    function QT_GetVersion() {
        var U = "0";
        if (navigator.plugins && navigator.plugins.length) {
            for (var g = 0; g < navigator.plugins.length; g++) {
                var S = navigator.plugins[g];
                var M = S.name.match(/quicktime\D*([\.\d]*)/i);
                if (M && M[1])
                    U = M[1];
            }
        } else {
            ieQTVersion = null;
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
    
    function QT_IsCompatible(g, j){
        function M(w, R) {
            var i = parseInt(w[0], 10);
            if (isNaN(i))
                i = 0;
            var V = parseInt(R[0], 10);
            if (isNaN(V))
                V = 0;
            if (i === V) {
                if (w.length>1)
                    return M(w.slice(1),R.slice(1));
                else
                    return true;
            } else {
                if (i < V)
                    return true;
                else
                    return false;
            }
        }
        var S = g.split(/\./);
        var U = j ? j.split(/\./) : QT_GetVersion().split(/\./);
        return M(S, U);
    }
    
    var isAvailable = null;
    function QT_IsValidAvailable(U) {
        if (isAvailable === null)
            isAvailable = QT_IsInstalled() && QT_IsCompatible(U);
        return isAvailable;
    }
    
    return {
        generateOBJECTText: QT_GenerateOBJECTText,
        isValidAvailable  : QT_IsValidAvailable
    };
})();

jpf.video.TypeQT = function(id, node, options) {
    this.name = "QT_" + id;
    this.htmlElement = node;
    
    // Properties set by QT player
    this.videoWidth = this.videoHeight = this.totalTime = 
        this.bytesLoaded = this.bytesTotal = 0;
    this.state = null;
    
    // Internal properties that match get/set methods
    this.autoPlay = this.autoLoad = this.showControls = true;
    this.volume   = 50;
    this.mimeType = "video/quicktime";
    
    this.firstLoad   = true;
    this.pluginError = false;
    
    this.pollTimer   = null;
    
    this.player = null;
    jpf.extend(this, jpf.video.TypeInterface);
    
    this.setOptions(options).draw().attachEvents();
}

jpf.video.TypeQT.isSupported = function() {
    // QuickTime 7.2.1 is the least we'd expect, no?
    return jpf.video.TypeQTCompat.isValidAvailable('7.2.1');
}

jpf.video.TypeQT.prototype = {
    draw: function() {
        this.htmlElement.innerHTML = "<div id='" + this.name + "_Container' class='jpfVideo'\
            style='width:" + this.width + "px;height:" + this.height + "px;'>" +
            jpf.video.TypeQTCompat.generateOBJECTText(this.src, this.width, 
                this.height, '', 'autoplay', this.autoPlay.toString(), 
                'controller', this.showControls.toString(), 
                'kioskmode', 'true', 'showlogo', 'true', 'bgcolor', 'black', 
                'scale', 'aspect', 'align', 'middle', 'enablejavascript', 'true', 
                'postdomevents', 'true', 'target', 'myself', 'cache', 'false', 
                'qtsrcdontusebrowser', 'true', 'type', this.mimeType, 
                'obj#id', this.name, 'emb#NAME', this.name, 
                'emb#id', this.name + 'emb') + 
            "</div>";
        
        this.player = document[this.name];
        return this;
    },
    
    attachEvents: function() {
        var nodeEvents = document.getElementById(this.name);
        if (!nodeEvents || !jpf.isIE) //try the embed otherwise ;)
            nodeEvents = document.getElementById(this.name + 'emb');
        
        var _self = this;
        function exec(e) {
            if (!e) e = window.event;
            _self.handleEvent(e);
        }
        
        var hook = nodeEvents.addEventListener ? 'addEventListener' : 'attachEvent';
        var pfx  = nodeEvents.addEventListener ? '' : 'on';
        ['qt_begin', 'qt_abort', 'qt_canplay', 'qt_canplaythrough',
         'qt_durationchange', 'qt_ended', 'qt_error', 'qt_load', 
         'qt_loadedfirstframe', 'qt_loadedmetadata', 'qt_pause', 'qt_play', 
         'qt_progress', 'qt_stalled', 'qt_timechanged', 'qt_volumechange', 
         'qt_waiting'].forEach(function(evt) {
            nodeEvents[hook](pfx + evt, exec, false);
        });
    },
    
    handleEvent: function(e) {
        switch (e.type) {
            case "qt_play":
                this.dispatchEvent({type: 'stateChange', state: 'playing'});
                this.startPlayPoll();
                break;
            case "qt_pause":
                this.dispatchEvent({type: 'stateChange', state: 'paused'});
                this.stopPlayPoll();
                break;
            case "qt_volumechange":
                jpf.status('qt_volumechange: ' + (this.player.GetVolume() / 256) * 100);
                // volume has to be normalized to 100 (Apple chose a range from 0-256)
                this.dispatchEvent({
                    type  : 'change',
                    volume: Math.round((this.player.GetVolume() / 256) * 100)
                });
                break;
            case "qt_timechanged":
                jpf.status('qt_timechanged: ' + this.player.GetTime());
                this.dispatchEvent({
                    type        : 'change',
                    playheadTime: this.player.GetTime()
                });
                break;
            case "qt_stalled":
                this.dispatchEvent({type: 'complete'});
                this.stopPlayPoll();
                break;
            case "qt_canplay":
                this.dispatchEvent({type: 'ready'});
                break;
        }
    },
    
    startPlayPoll: function() {
        clearTimeout(this.pollTimer);
        var _self = this;
        this.pollTimer = setTimeout(function() {
            _self.dispatchEvent({
                type        : 'change',
                playheadTime: _self.player.GetTime()
            });
            _self.startPlayPoll();
        }, 1000);
    },
    
    stopPlayPoll: function() {
        clearTimeout(this.pollTimer);
    },
    
    play: function() {
        if (this.player)
            this.player.Play();
    },
    
    pause: function() {
        if (this.player)
            this.player.Stop();
    },
    
    stop: function() {
        this.pause();
    },
    
    seek: function(iTo) {
        if (!this.player) return;
        this.player.SetTime(iTo);
    },
    
    setVolume: function(iVolume) {
        if (this.player)
            this.player.SetVolume(iVolume);
    },
    
    getTotalTime: function() {
        if (!this.player) return 0;
        return this.player.GetDuration();
    }
};
// #endif
