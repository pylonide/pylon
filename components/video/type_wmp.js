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

jpf.type_wmp = {};

jpf.video.TypeWmpCompat = (function() {
    var hasWMP = false;
    
    function WMP_getVersion() {
        // Windows Media Player checking code adapted from
        // eMedia Communications Strategies information and Microsoft documentation
        // see http://www.emediacommunications.biz/sm5/articlesm5.html
        // and http://support.microsoft.com/default.aspx?scid=kb;en-us;279022
        //
        //Note: Windows Media Player version 7+ ships with the old 6.4
        //      control as well as the newest version.  For this reason,
        //      is_WMP64 will remain true even if is_WMP7up
        //      is set to true.
        
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
    
    function WMP_generateParamTag(name, value) {
        if (!name || !value) return "";
        return '<param name="' + name + '" value="' + value + '" />';
    }
    
    function WMP_generateOBJECTText(url, width, height, params) {
        var out = ['<object width="', width, '" height="', height, '" \
        	classid="clsid:6BF52A52-394A-11d3-B153-00C04F79FAA6" \
        	type="application/x-oleobject">',
            WMP_generateParamTag('URL', url),
            WMP_generateParamTag('SendPlayStateChangeEvents', 'true')];
        for (var param in params) {
            out.push(WMP_generateParamTag(param, params[param]));
        }
        return out.join('') + '</object>';
    }
    
    function WMP_isValidAvailable() {
        return WMP_getVersion() >= 7 && hasWMP;
    }
    
    return  {
        isValidAvailable  : WMP_isValidAvailable,
        generateOBJECTText: WMP_generateOBJECTText
    }
})();

jpf.video.TypeWmp = function(id, node, options) {
    this.name = "WMP_" + id;
    this.htmlElement = node;
    
    this.player = null;
    
    this.setOptions(options).draw();
};

jpf.video.TypeWmp.isSupported = function(){
    return jpf.video.TypeWmpCompat.isValidAvailable();
};

jpf.video.TypeWmp.prototype = {
    play: function() {
        if (this.player)
            this.player.controls.play();
    },
    
    pause: function() {
        if (this.player)
            this.player.controls.pause();
    },
    
    stop: function() {
        if (this.player)
            this.player.controls.stop();
    },
    
    seek: function(iTo) {
        
    },
    
    setVolume: function(iVolume) {
        
    },
    
    getTotalTime: function() {
        
    },
    
    /**
     * Add an event listener to the video.
     *
     * @param eventType A string representing the type of event.  e.g. "init"
     * @param object The scope of the listener function (usually "this").
     * @param function The function to be called when the event is dispatched.
     */
    addEventListener: function(eventType, object, functionRef) {
        if (this.listeners == null)
            this.listeners = {};

        if (this.listeners[eventType] == null)
            this.listeners[eventType] = [];
        else
            this.removeEventListener(eventType, object, functionRef);

        this.listeners[eventType].push({target:object, func:functionRef});
        return this;
    },
    
    /**
     * Remove an event listener from the video.
     *
     * @param eventType A string representing the type of event.  e.g. "init"
     * @param object The scope of the listener function (usually "this").
     * @param functionRef The function to be called when the event is dispatched.
     */
    removeEventListener: function(eventType, object, functionRef) {
        for (var i = 0; i < this.listeners[eventType].length; i++) {
            var listener = this.listeners[eventType][i];
            if (listener.target == object && listener.func == functionRef) {
                this.listeners[eventType].splice(i, 1);
                break;
            }
        }
        return this;
    },
    
    // Notify all listeners when a new event is dispatched.
    dispatchEvent: function(eventObj) {
        if (this.listeners == null) return;
        var type = eventObj.type;
        var items = this.listeners[type];
        if (items == null) return this;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            item.func.apply(item.target, [eventObj]);
        }
        return this;
    },
    
    setOptions: function(options) {
        if (options == null) return this;
        // Create a hash of acceptable properties
        var hash = ["src", "width", "height", "volume", "showControls", 
            "autoPlay", "totalTime", "mimeType"];
        for (var i = 0; i < hash.length; i++) {
            var prop = hash[i];
            if (options[prop] == null) continue;
            this[prop] = options[prop];
        }
        
        return this;
    },
    
    draw: function() {
        this.htmlElement.innerHTML = "<div id='" + this.name + "_Container' class='jpfVideo'\
            style='width:" + this.width + "px;height:" + this.height + "px;'>" +
            jpf.video.TypeWmpCompat.generateOBJECTText(this.src, this.width, 
                this.height, {
                    'AutoStart': this.autoPlay.toString(),
                    'uiMode'   : this.showControls ? 'mini' : 'none',
                    'PlayCount': 1 //TODO: implement looping
                }) + 
            "</div>";
        
        this.player = this.htmlElement.getElementsByTagName('object')[0];
        var _self = this;
        this.player.onplaystatechange = function(e) {
            if (!e) e = window.event;
            _self.handleEvent(e);
        }
        
        jpf.alert_r(this.player);
        return this;
    },
    
    handleEvent: function(e) {
        jpf.dumpEvent(e);
    }
};
