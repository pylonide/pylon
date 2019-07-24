/**
 * Helper class that aids in creating and controlling Javeline OnEdit instances
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       2.0
 * @namespace   onedit
 * @private
 */

 
(function(global) {

var sId         = "Javeline",
    sDefProduct = "OnEdit",
    bAvailable  = null,
    iVersion    = null,
    bEmbed      = false,
    sPlatform   = null,
    oOnEdit     = null,
    oOptions    = null,
    oHttp       = null;

function detect(o) {
    var version,
        name = o && o.fullname ? o.fullname : "Javeline OnEdit";

    if (navigator.plugins && navigator.plugins[name]) {
        version = navigator.plugins[name].description.match(/v([\d]+\.[\d]+)/)[1];
    }
    else {
        try {
            var axo = new ActiveXObject(name);            
            version = axo.versionInfo.match(/v([\d]+\.[\d]+)/)[1];
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
    var sAgent = navigator.userAgent.toLowerCase(),
        is_opera     = sAgent.indexOf("opera") !== -1,
        is_konqueror = sAgent.indexOf("konqueror") != -1,
        is_safari    = !is_opera && ((navigator.vendor
            && navigator.vendor.match(/Apple/) ? true : false)
            || sAgent.indexOf("safari") != -1 || is_konqueror),
        is_ie        = (document.all && !is_opera && !is_safari);
    bEmbed           = !(is_ie && !is_opera);

    // OS sniffing:

    // windows...
    if (sAgent.indexOf("win") != -1 || sAgent.indexOf("16bit") != -1) {
        sPlatform = "win";
        if (sAgent.indexOf("win16") != -1
          || sAgent.indexOf("16bit") != -1
          || sAgent.indexOf("windows 3.1") != -1
          || sAgent.indexOf("windows 16-bit") != -1)
            sPlatform += "16";
        else if (sAgent.indexOf("win32") != -1
          || sAgent.indexOf("32bit") != -1)
            sPlatform += "32";
        else if (sAgent.indexOf("win32") != -1
          || sAgent.indexOf("32bit") != -1)
            sPlatform += "64";
    }
    // mac...
    if (sAgent.indexOf("mac") != -1) {
        sPlatform = "mac";
        if (sAgent.indexOf("ppc") != -1 || sAgent.indexOf("powerpc") != -1)
            sPlatform += "ppc";
        else if (sAgent.indexOf("os x") != -1)
            sPlatform += "osx";
    }
    // linux...
    if (sAgent.indexOf("inux") != -1) {
        sPlatform = "linux";
        if (sAgent.indexOf("i686") > -1 || sAgent.indexOf("i386") > -1)
            sPlatform += "32";
        else if (sAgent.indexOf("86_64"))
            sPlatform += "64";
        else if (sAgent.indexOf("arm"))
            sPlatform += "arm";
    }
}

function installerUrl(o) {
    return "http://www.ajax.org/o3/installer" 
        + (sPlatform ? "/platform/" + sPlatform : "")
        + (o.guid    ? "/guid/"     + encodeURIComponent(o.guid) : "");
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

function createHtml(options) {
    var out = [];
    if (typeof options.width == "undefined")
        options.width = 0;
    if (typeof options.height == "undefined")
        options.height = 0;

    out.push(bEmbed
        ? '<embed id="' + options.id + '" width="' + options.width 
            + '" height="' + options.height + '" '
        : '<object id="' + options.id + '" width="' + options.width 
            + '" height="' + options.height + '"' + (options.guid 
                ? ' classid="CLSID:' + options.guid + '"' 
                : '') + '>');
    if (options.params) {
        var i, n, v;
        for (i in options.params) {
            if (!options.params[i]) continue;
            n = escapeHtml(i);
            v = escapeHtml(options.params[i]);
            out.push(bEmbed
                ? n + '="' + v + '" '
                : '<param name="' + n + '" value="' + v + '" /> ');
        }
    }
    out.push(bEmbed ? '> </embed>' : '</object>');

    return out.join("");
}

function destroy() {
    if (!oOnEdit) return;
    /*for (var i in oOnEdit) {
        if (typeof oOnEdit[i] == "function")
            oOnEdit[i] = null;
    }*/
    oOnEdit.parentNode.removeChild(oOnEdit);
    oHttp = oOnEdit = null;
    delete oHttp;
    delete oOnEdit;
}

// global API:
global.onedit = {
    isAvailable: function(o) {
        if (bAvailable === null)
            detect(o);

        return bAvailable && ((o && o.version) ? iVersion === o.version : true);
    },

    getVersion: function() {
        if (iVersion === null)
            detect();

        return iVersion;
    },

    init: function(guid, options) {
        if (!options && typeof guid == "object") {
            options      = guid;
            options.guid = false;
        }
        else {
            options      = options || {};
            options.guid = guid || false;
        }
        if (!options["fullname"]) {
            options.fullname = (options.product || sDefProduct) 
                + (options.guid ? "-" + options.guid : "")
        }

        // mini-browser sniffing:
        sniff();
        
        if (!this.isAvailable(options)) {
            var sUrl = installerUrl(options);
            return typeof options["oninstallprompt"] == "function"
                ? options.oninstallprompt(sUrl)
                : window.open(sUrl, "_blank");
        }

        if (typeof options["params"] == "undefined")
            options.params = {};
        if (typeof options.params["type"] == "undefined")
            options.params.type = "application/" + (options.fullname || "o3-XXXXXXXX");

        options.id = sId + (options.name ? options.name : "");

        (options["parent"] || document.body).appendChild(
          document.createElement("div")).innerHTML = createHtml(options);

        oOnEdit = document.getElementById(options.id);
        if (oOnEdit) {
            // set onunload handler to destroy...
            var old_unload = window.onunload;
            window.onunload = function() {
                destroy();
                if (typeof old_unload == "function")
                    old_unload();
            };

            oOptions = options;
            oHttp    = oOnEdit.http();
            if (typeof options["onprogress"] == "function")
                oHttp.onprogress = options.onprogress;
            if (typeof options["onready"] == "function")
                options.onready(oOnEdit);
            return oOnEdit;
        }
        
        return false;
    },
    
    getFs : function(){
        return oOnEdit.fs();
    },
    
    open: function(file) {
        var verb    = "GET",
            getFile = file,
            putFile = file;
        if (typeof oOptions["onbeforedownload"] == "function") {
            var res = oOptions.onbeforedownload(file);
            if (typeof res == "string") {
                getFile = res;
            }
            else if (res) {
                if (typeof res["verb"] == "string")
                    verb = res.verb;
                if (typeof res["url"] == "string")
                    getFile = res.url;
            }
        }
        
        oHttp.open(verb, getFile, true);
        oHttp.onreadystatechange = function() {
            if (oHttp.readyState != 4) return;
            oHttp.onreadystatechange = null;
            
            if (typeof oOptions["onafterdownload"] == "function")
                oOptions.onafterdownload(file, getFile);
            var parent = oOnEdit.fs().get("OnEdit"),
                res    = parent.createDir(),
                oFile  = oHttp.responseOpen(parent);
            oFile.onchange = function() {
                verb = "PUT";
                if (typeof oOptions["onbeforeupload"] == "function") {
                    res = oOptions.onbeforeupload(file);
                    if (typeof res == "string") {
                        putFile = res;
                    }
                    else if (res) {
                        if (typeof res["verb"] == "string")
                            verb = res.verb;
                        if (typeof res["url"] == "string")
                            putFile = res.url;
                    }
                }
                oHttp.open(verb, putFile, true);
                oHttp.onreadystatechange = function() {
                    if (oHttp.readyState != 4) return;
                    oHttp.onreadystatechange = null;

                    if (typeof oOptions["onafterupload"] == "function")
                        oOptions.onafterupload(file, putFile);
                }
                oHttp.send(oFile.blob);
            };
        }
        oHttp.send("");
    }
};

})(this);
// #endif
