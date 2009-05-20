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

// #ifdef __WITH_O3
/**
 * Helper class that aids in creating and controlling Ajax O3 instances
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       2.1
 * @namespace   o3
 * @private
 */
(function(global) {

var sId        = "AjaxO3",
    bAvailable = null,
    bEmbed     = false,
    iVersion   = null,
    oO3;

function detect() {
    var version;

    if (navigator.plugins && navigator.plugins["O3-XXXXXXX"]) {
        version = "1.0";//navigator.plugins["O3-XXXXXXX"].versionInfo;
    }
    else {
        try {
            var axo = new ActiveXObject("Ajax.o3");
            version = axo.GetVariable("$version");
        }
        catch (e) {}
    }

    if (version) {
        iVersion   = parseFloat(version);
        bAvailable = true;
    }
    else {
        iVersion   = 0;
        bAvailable = false;
    }
}

function sniff() {
    var sAgent = navigator.userAgent.toLowerCase();
    var is_opera     = sAgent.indexOf("opera") !== -1;
    var is_konqueror = sAgent.indexOf("konqueror") != -1;
    var is_safari    = !is_opera && ((navigator.vendor
            && navigator.vendor.match(/Apple/) ? true : false)
            || sAgent.indexOf("safari") != -1 || is_konqueror);
    var is_ie        = (document.all && !is_opera && !is_safari);
    bEmbed           = is_ie && !is_opera;
}


function escapeHtml(s) {
    var c, ret = "";

    if (s == null) return null;

    for (var i = 0, j = s.length; i < j; i++) {
        c = s.charCodeAt(i);
        if (((c > 96) && (c < 123)) || (( c > 64) && (c < 91))
          || ((c > 43) && (c < 58) && (c != 47)) || (c == 95))
            ret = ret + String.fromCharCode(c);
        else
            ret = ret + "&#" + c + ";";
    }
    return ret;
}

function createHtml(id, options) {
    var out = [], i, n, v;
    if (!options)
        options = {};
    options.id = id;
    if (typeof options.width == "undefined")
        options.width = 0;
    if (typeof options.height == "undefined")
        options.height = 0;

    out.push(bEmbed
        ? '<embed id="' + id + '" width="' + options.width + '" height="' 
            + options.height + '" '
        : '<object id="' + id + '" width="' + options.width + '" height="'
            + options.height + '">');
    for (i in options) {
        if (!options[i]) continue;
        n = escapeHtml(i);
        v = escapeHtml(options[i]);
        out.push(bEmbed 
            ? n + '="' + v + '" '
            : '<param name="' + n + '" value="' + v + '" /> ');
    }
    out.push(bEmbed ? '> </embed>' : '</object>');

    return out.join("");
}

function get(sObject) {
    return oO3 && typeof sObject == "string" ? oO3[sObject.toLowerCase()] : null;
}

// global API:
global.o3 = {
    isAvailable: function(version) {
        if (bAvailable === null)
            detect();

        return bAvailable && version ? iVersion === version : true;
    },

    getVersion: function() {
        if (iVersion === null)
            detect();

        return iVersion;
    },

    init: function(version, width, height) {
        if (!this.isAvailable(version))
            return false;

        // mini-browser sniffing:
        sniff();

        var options = {
            type: "application/o3-XXXXXXXX"
        };
        if (typeof width != "undefined")
            options.width = width;
        if (typeof height != "undefined")
            options.height = height;

        document.body.appendChild(document.createElement("div")).innerHTML
            = createHtml(sId, options);

        oO3 = document.getElementById(sId);
        
        return oO3 ? true : false;
    },

    get: get,
    on : get
};

})(this);

// #endif
