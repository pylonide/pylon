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

// #ifdef __WITH_FLASH
/**
 * Helper class that aids in creating and controlling Adobe Flash
 * elements.
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @namespace jpf
 */
jpf.flash = (function(){
    /**
     * Flash Player Version Detection, version 1.7
     * Detect Client Browser type
     *
     * @type {String}
     */
    function getControlVersion(){
        var version, axo, e;

        // NOTE : new ActiveXObject(strFoo) throws an exception if strFoo isn't in the registry
        try {
            // version will be set for 7.X or greater players
            axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
            version = axo.GetVariable("$version");
        }
        catch (e) {}
        if (!version) {
            try {
                // version will be set for 6.X players only
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
                // installed player is some revision of 6.0
                // GetVariable("$version") crashes for versions 6.0.22 through 6.0.29,
                // so we have to be careful.
                // default to the first public version
                version = "WIN 6,0,21,0";
                // throws if AllowScripAccess does not exist (introduced in 6.0r47)
                axo.AllowScriptAccess = "always";
                // safe to call for 6.0r47 or greater
                version = axo.GetVariable("$version");
            }
            catch (e) {}
        }

        if (!version) {
            try {
                // version will be set for 4.X or 5.X player
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
                version = axo.GetVariable("$version");
            }
            catch (e) {}
        }

        if (!version) {
            try {
                // version will be set for 3.X player
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
                version = "WIN 3,0,18,0";
            }
            catch (e) {}
        }

        if (!version) {
            try {
                // version will be set for 2.X player
                axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
                version = "WIN 2,0,0,11";
            }
            catch (e) {
                version = -1;
            }
        }

        return version;
    }

    /**
     * JavaScript helper, required to detect Flash Player PlugIn version
     * information.
     * @see getControlVersion() for Internet Explorer (ActiveX detection)
     *
     * @type {String}
     */
    function getSwfVersion(){
        // NS/Opera version >= 3 check for Flash plugin in plugin array
        var flashVer = -1;
        var sAgent   = navigator.userAgent.toLowerCase();

        if (navigator.plugins != null && navigator.plugins.length > 0) {
            if (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]) {
                var swVer2   = navigator.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
                var swfDescr = navigator.plugins["Shockwave Flash" + swVer2].description;
                var aDescr   = swfDescr.split(" ");
                var aTempMaj = aDescr[2].split(".");
                var nMajor   = aTempMaj[0];
                var nMinor   = aTempMaj[1];
                var sRev     = aDescr[3];
                if (sRev == "")
                    sRev = aDescr[4];
                if (sRev[0] == "d")
                    sRev = sRev.substring(1);
                else if (sRev[0] == "r") {
                    sRev = sRev.substring(1);
                    if (sRev.indexOf("d") > 0)
                        sRev = sRev.substring(0, sRev.indexOf("d"));
                }
                var flashVer = nMajor + "." + nMinor + "." + sRev;
            }
        }
        // MSN/WebTV 2.6 supports Flash 4
        else if (sAgent.indexOf("webtv/2.6") != -1)
            flashVer = 4;
        // WebTV 2.5 supports Flash 3
        else if (sAgent.indexOf("webtv/2.5") != -1)
            flashVer = 3;
        // older WebTV supports Flash 2
        else if (sAgent.indexOf("webtv") != -1)
            flashVer = 2;
        else if (jpf.isIE && !jpf.isOpera)
            flashVer = getControlVersion();

        return flashVer;
    }

    /**
     * When called with reqMajorVer, reqMinorVer, reqRevision returns true if
     * that version or greater is available on the clients' system.
     *
     * @param {Number} reqMajorVer
     * @param {Number} reqMinorVer
     * @param {Number} reqRevision
     * @type {Boolean}
     */
    function detectFlashVersion(reqMajorVer, reqMinorVer, reqRevision){
        var versionStr = getSwfVersion();
        if (versionStr == -1)
            return false;
        else if (versionStr != 0) {
            var aVersions;
            if (jpf.isIE && !jpf.isOpera) {
                // Given "WIN 2,0,0,11"
                var aTemp = versionStr.split(" "); // ["WIN", "2,0,0,11"]
                var sTemp = aTemp[1]; // "2,0,0,11"
                aVersions = sTemp.split(","); // ['2', '0', '0', '11']
            }
            else
                aVersions = versionStr.split(".");
            var nMajor = aVersions[0];
            var nMinor = aVersions[1];
            var sRev   = aVersions[2];

            // is the major.revision >= requested major.revision AND the minor version >= requested minor
            if (nMajor > parseFloat(reqMajorVer))
                return true;
            else if (nMajor == parseFloat(reqMajorVer)) {
                if (nMinor > parseFloat(reqMinorVer))
                    return true;
                else if (nMinor == parseFloat(reqMinorVer)) {
                    if (sRev >= parseFloat(reqRevision))
                        return true;
                }
            }
            return false;
        }
    }

    /**
     * Generate ActiveContent for a Flash or Shockwave movie, while ensuring
     * compatibility with the clients' browser.
     *
     * @param {Object} objAttrs
     * @param {Object} params
     * @param {Object} embedAttrs
     * @param {Boolean} stdout If TRUE, the resulting string will be passed to the output buffer through document.write()
     * @type {String}
     */
    function generateObj(objAttrs, params, embedAttrs, stdout){
        if (stdout == "undefined")
            stdout = false;
        var str = [];
        if (jpf.isIE && !jpf.isOpera) {
            str.push('<object ');
            for (var i in objAttrs)
                str.push(i, '="', objAttrs[i], '" ');
            str.push('>');
            for (var i in params)
                str.push('<param name="', i, '" value="', params[i], '" /> ');
            str.push('</object>');
        } else {
            str.push('<embed ');
            for (var i in embedAttrs)
                str.push(i, '="', embedAttrs[i], '" ');
            str.push('> </embed>');
        }
        var sOut = str.join('');

        if (stdout === true)
            document.write(sOut);

        return sOut;
    }

    /**
     * Use this function to generate the HTML tags for a Flash movie object.
     * It takes any number of arguments as parameters:
     * arguments: 'name1', 'value1', 'name2', 'value2', etc.
     *
     * @type {String}
     */
    function AC_FL_RunContent(){
        var ret = AC_GetArgs(arguments,
            "movie", "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000",
            "application/x-shockwave-flash");
        return generateObj(ret.objAttrs, ret.params, ret.embedAttrs);
    }

    /**
     * Generate the HTML for a Flash movie, with checks for general availability
     * of a compatible Flash Player. If not, it will redirect to the installer
     * (a seperate Flash Movie to upgrade) or diplay a link.
     *
     * @type {String}
     */
    function buildContent() {
        var hasRequestedVersion = isEightAvailable();
        if (isAvailable() && !hasRequestedVersion)
            return jpf.flash.buildInstaller();
        if (hasRequestedVersion)
            return AC_FL_RunContent.apply(null, Array.prototype.slice.call(arguments));
        return 'This content requires the \
            <a href="http://www.adobe.com/go/getflash/">Adobe Flash Player</a>.';
    }

    /**
     * Build the <OBJECT> tag that will load the Adobe installer for Flash
     * upgrades.
     */
    function buildInstaller() {
        var MMPlayerType  = (jpf.isIE == true) ? "ActiveX" : "PlugIn";
        var MMredirectURL = window.location;
        document.title = document.title.slice(0, 47) + " - Flash Player Installation";
        var MMdoctitle = document.title;

        return AC_FL_RunContent(
            "src", "playerProductInstall",
            "FlashVars", "MMredirectURL=" + MMredirectURL + "&MMplayerType="
            + MMPlayerType + "&MMdoctitle=" + MMdoctitle + "",
            "width", "100%",
            "height", "100%",
            "align", "middle",
            "id", this.name,
            "quality", "high",
            "bgcolor", "#000000",
            "name", this.name,
            "allowScriptAccess","always",
            "type", "application/x-shockwave-flash",
            "pluginspage", "http://www.adobe.com/go/getflashplayer"
            );
    }

    /**
     * Transforms arguments from AC_FL_RunContent and AC_SW_RunContent to sane
     * object that can be used to generate <OBJECT> and <EMBED> tags (depending
     * on the clients' browser, but this function will generate both)
     *
     * @param {Object} args
     * @param {Object} ext
     * @param {Object} srcParamName
     * @param {Object} classid
     * @param {Object} mimeType
     * @type {Object}
     */
    function AC_GetArgs(args, srcParamName, classid, mimeType){
        var ret        = {};
        ret.embedAttrs = {};
        ret.params     = {};
        ret.objAttrs   = {};
        for (var i = 0; i < args.length; i = i + 2) {
            var currArg = args[i].toLowerCase();

            switch (currArg) {
                case "classid":
                    break;
                case "pluginspage":
                    ret.embedAttrs[args[i]] = args[i + 1];
                    break;
                case "src":
                case "movie":
                    ret.embedAttrs["src"] = args[i + 1];
                    ret.params[srcParamName] = args[i + 1];
                    break;
                case "onafterupdate":
                case "onbeforeupdate":
                case "onblur":
                case "oncellchange":
                case "onclick":
                case "ondblClick":
                case "ondrag":
                case "ondragend":
                case "ondragenter":
                case "ondragleave":
                case "ondragover":
                case "ondrop":
                case "onfinish":
                case "onfocus":
                case "onhelp":
                case "onmousedown":
                case "onmouseup":
                case "onmouseover":
                case "onmousemove":
                case "onmouseout":
                case "onkeypress":
                case "onkeydown":
                case "onkeyup":
                case "onload":
                case "onlosecapture":
                case "onpropertychange":
                case "onreadystatechange":
                case "onrowsdelete":
                case "onrowenter":
                case "onrowexit":
                case "onrowsinserted":
                case "onstart":
                case "onscroll":
                case "onbeforeeditfocus":
                case "onactivate":
                case "onbeforedeactivate":
                case "ondeactivate":
                case "type":
                case "codebase":
                case "id":
                    ret.objAttrs[args[i]] = args[i + 1];
                    break;
                case "width":
                case "height":
                case "align":
                case "vspace":
                case "hspace":
                case "class":
                case "title":
                case "accesskey":
                case "name":
                case "tabindex":
                    ret.embedAttrs[args[i]] = ret.objAttrs[args[i]] = args[i + 1];
                    break;
                default:
                    ret.embedAttrs[args[i]] = ret.params[args[i]] = args[i + 1];
            }
        }
        ret.objAttrs["classid"] = classid;
        if (mimeType)
            ret.embedAttrs["type"] = mimeType;
        return ret;
    }

    /**
     * Utility method; get an element from the browser's document object, by ID.
     *
     * @param {Object} id
     * @type {HTMLDomElement}
     */
    function getElement(id) {
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

    /* ----------------------------------------------------
     * FAVideoManager
     *
     * This manages the collection of FAVideo instances on the HTML page. It directs calls from embedded
     * FAVideo SWFs to the appropriate FAVideo instance in Javascript.
     *----------------------------------------------------- */
    var hash     = {};
    var uniqueID = 1;

    /**
     * FAVideoManager: add a FAVideo instance to the stack for callbacks later on
     * and return a unique Identifier for the FAVideo instance to remember.
     *
     * @param {Object} player
     * @type {Number}
     */
    function addPlayer(player) {
        hash[++uniqueID] = player;
        return uniqueID;
    }

    /**
     * FAVideoManager: retrieve the FAVideo instance that is paired to the
     * unique identifier (id).
     *
     * @param {Object} id
     * @type {FAVideo}
     */
    function getPlayer(id) {
        return hash[id];
    }

    /**
     * Directs a call from embedded FAVideo SWFs to the appropriate FAVideo
     * instance in Javascript
     *
     * @param {Object} id
     * @param {Object} methodName
     * @type {void}
     */
    function callMethod(id, methodName) {
        var player = hash[id];
        if (player == null)
            throw new Error(jpf.formatErrorString(0, this, "Player with id: " + id + " not found"));
        if (player[methodName] == null)
            throw new Error(jpf.formatErrorString(0, this, "Method " + methodName + " Not found"));

        // Unable to use slice on arguments in some browsers. Iterate instead:
        var args = [];
        for (var i = 2; i < arguments.length; i++)
            args.push(decode(arguments[i]));
        player[methodName].apply(player, args);
    }

    /**
     * Encodes our data to get around ExternalInterface bugs that are still
     * present even in Flash 9.
     *
     * @param {Object} data
     */
    function encode(data) {
        if (!data || typeof data != "string")
            return data;
        // double encode all entity values, or they will be mis-decoded
        // by Flash when returned
        data = data.replace(/\&([^;]*)\;/g, "&amp;$1;");

        // entity encode XML-ish characters, or Flash's broken XML serializer
        // breaks
        data = data.replace(/</g, "&lt;");
        data = data.replace(/>/g, "&gt;");

        // transforming \ into \\ doesn't work; just use a custom encoding
        data = data.replace("\\", "&custom_backslash;");

        data = data.replace(/\0/g, "\\0"); // null character
        data = data.replace(/\"/g, "&quot;");

        return data;
    }

    /**
     * Decodes our data to get around ExternalInterface bugs that are still
     * present even in Flash 9.
     *
     * @param {String} data
     */
    function decode(data) {
        // wierdly enough, Flash sometimes returns the result as an
        // 'object' that is actually an array, rather than as a String;
        // detect this by looking for a length property; for IE
        // we also make sure that we aren't dealing with a typeof string
        // since string objects have length property there
        if (data && data.length && typeof data != "string")
            data = data[0];
        if (!data || typeof data != "string")
            return data;

        // certain XMLish characters break Flash's wire serialization for
        // ExternalInterface; these are encoded on the
        // DojoExternalInterface side into a custom encoding, rather than
        // the standard entity encoding, because otherwise we won't be able to
        // differentiate between our own encoding and any entity characters
        // that are being used in the string itself
        data = data.replace(/\&custom_lt\;/g, "<");
        data = data.replace(/\&custom_gt\;/g, ">");
        data = data.replace(/\&custom_backslash\;/g, '\\');

        // needed for IE; \0 is the NULL character
        data = data.replace(/\\0/g, "\0");

        return data;
    }

    var aIsAvailable = {};
    /**
     * Checks whether a valid version of Adobe Flash is available on the clients'
     * system. Default version to check for is 6.0.65.
     *
     * @param {String} sVersion
     * @type {Boolean}
     */
    function isAvailable(sVersion) {
        if (typeof sVersion != "string")
            sVersion = "6.0.65";
        var aVersion = sVersion.split('.');
        while (aVersion.length < 3)
            aVersion.push('0');
        if (typeof aIsAvailable[sVersion] == "undefined")
            aIsAvailable[sVersion] = detectFlashVersion(parseInt(aVersion[0]),
                parseInt(aVersion[1]), parseInt(aVersion[2]));
        return aIsAvailable[sVersion];
    }

    /**
     * Shorthand function to call and cache isAvailable() with version
     * number 8.0.0
     *
     * @type {Boolean}
     */
    function isEightAvailable() {
        return isAvailable('8.0.0');
    }

    var oSandboxTypes = {
        remote          : 'remote (domain-based) rules',
        localwithfile   : 'local with file access (no internet access)',
        localwithnetwork: 'local with network (internet access only, no local access)',
        localtrusted    : 'local, trusted (local + internet access)'
    };

    function getSandbox(sType) {
        var oSandbox = {
            type       : null,
            description: null,
            noRemote   : false,
            noLocal    : false,
            error      : null
        };
        oSandbox.type = sType.toLowerCase();
        oSandbox.description = oSandboxTypes[(typeof oSandboxTypes[oSandbox.type] != 'undefined'
            ? oSandbox.type
            : 'unknown')];
        if (oSandbox.type == 'localwithfile') {
            oSandbox.noRemote = true;
            oSandbox.noLocal  = false;
            oSandbox.error    = "Flash security note: Network/internet URLs will not \
                                 load due to security restrictions.\
                                 Access can be configured via Flash Player Global Security\
                                 Settings Page: \
                                 http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html";
        }
        else if (oSandbox.type == 'localwithnetwork') {
            oSandbox.noRemote = false;
            oSandbox.noLocal  = true;
        }
        else if (oSandbox.type == 'localtrusted') {
            oSandbox.noRemote = false;
            oSandbox.noLocal  = false;
        }

        return oSandbox;
    }

    return {
        isAvailable     : isAvailable,
        isEightAvailable: isEightAvailable,
        buildContent    : buildContent,
        encode          : encode,
        decode          : decode,
        getElement      : getElement,
        addPlayer       : addPlayer,
        getPlayer       : getPlayer,
        callMethod      : callMethod,
        getSandbox      : getSandbox
    };
})();
// #endif
