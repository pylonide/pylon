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
 * @namespace apf
 * @private
 */
apf.flash = (function(){
    /**
     * Flash Player Version Detection, version 1.7
     * Detect Client Browser type
     *
     * @type {String}
     */
    function getControlVersion(){
        var version, axo;

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
        var flashVer = -1,
            sAgent   = navigator.userAgent.toLowerCase();

        if (navigator.plugins != null && navigator.plugins.length > 0) {
            if (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]) {
                var swVer2   = navigator.plugins["Shockwave Flash 2.0"] ? " 2.0" : "",
                    swfDescr = navigator.plugins["Shockwave Flash" + swVer2].description,
                    aDescr   = swfDescr.split(" "),
                    aTempMaj = aDescr[2].split("."),
                    nMajor   = aTempMaj[0],
                    nMinor   = aTempMaj[1],
                    sRev     = aDescr[3];
                if (sRev == "")
                    sRev = aDescr[4];
                if (sRev[0] == "d") {
                    sRev = sRev.substring(1);
                }
                else if (sRev[0] == "r") {
                    sRev = sRev.substring(1);
                    if (sRev.indexOf("d") > 0)
                        sRev = sRev.substring(0, sRev.indexOf("d"));
                }
                flashVer = nMajor + "." + nMinor + "." + sRev;
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
        else if (apf.isIE && !apf.isOpera)
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
        if (versionStr != 0) {
            var aVersions;
            if (apf.isIE && !apf.isOpera) {
                // Given "WIN 2,0,0,11"
                var aTemp = versionStr.split(" "), // ["WIN", "2,0,0,11"]
                    sTemp = aTemp[1];              // "2,0,0,11"
                aVersions = sTemp.split(",");      // ['2', '0', '0', '11']
            }
            else {
                aVersions = versionStr.split(".");
            }
            var nMajor = aVersions[0],
                nMinor = aVersions[1],
                sRev   = aVersions[2];

            // is the major.revision >= requested major.revision AND the minor version >= requested minor
            if (nMajor > parseFloat(reqMajorVer))
                return true;
            if (nMajor == parseFloat(reqMajorVer)) {
                if (nMinor > parseFloat(reqMinorVer))
                    return true;
                if (nMinor == parseFloat(reqMinorVer)
                  && sRev >= parseFloat(reqRevision)) {
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
        var i, str = [];
        if (apf.isIE && !apf.isOpera) {
            str.push("<object ");
            for (i in objAttrs)
                str.push(i, "=\"", objAttrs[i], "\" ");
            str.push(">");
            for (i in params)
                str.push("<param name=\"", i, "\" value=\"", params[i], "\" />");
            str.push("</object>");
        }
        else {
            str.push("<embed ");
            for (i in embedAttrs)
                str.push(i, "=\"", embedAttrs[i], "\" ");
            str.push("></embed>");
        }
        var sOut = str.join("");

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
    function AC_FL_RunContent(options){
        var ret = AC_GetArgs(options,
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
    function buildContent(options) {
        var v = isEightAvailable();
        if (isAvailable() && !v)
            return buildInstaller(options || {});
        if (v)
            return AC_FL_RunContent(options);
        return 'This content requires the \
            <a href="http://www.adobe.com/go/getflash/">Adobe Flash Player</a>.';
    }

    function embed(options) {
        var obj  = options.context,
            node = options.htmlNode,
            prop = options.property || "$player";
        delete options.context, delete options.htmlNode, delete options.property;
        
        var content = buildContent(options),
            // using timeouts INSIDE the callback, because I explicitly want to
            // wait for APF to finish drawing the elements, i.e. wait for DOM
            // elements to be drawn.
            cb      = function() {
                $setTimeout(function() {
                    node.innerHTML = content;
                    obj[prop]      = getElement(options.id);
                    //console.log("flash movie loaded: ", _self.player);

                    $setTimeout(function() {
                        var fail = null;
                        if (!obj[prop]) {
                            fail = "The Flash movie failed to load. "
                                 + "Please check if you're loading the movie on a "
                                 + "website running through http://.";
                        }
                        else if (!obj[prop].parentNode) {
                            fail = "The movie has to be enabled "
                                 + "manually because of Flashblock. No browser refresh is required.";
                        }
                        else if (obj[prop].style.display == "none") {
                            fail = "Adblock Plus blocks or hides the "
                                 + "movie. Please enable it and refresh your browser.";
                        }
                        else if (!obj[prop].offsetWidth) {
                            fail = "The Flash movie failed to load. "
                                 + "Please check if the file exists and the path is correct.";
                        }

                        if (fail) {
                            // #ifdef __DEBUG
                            apf.console.error(fail, "flash");
                            // #endif
                            if (options.onError)
                                options.onError({message: fail});
                            else
                                obj.dispatchEvent("error", {message: fail});
                        }
                    }, 1000);
                }, 200);
            };

        return apf.loaded ? cb() : apf.addEventListener("load", cb);
    }

    /**
     * Build the <OBJECT> tag that will load the Adobe installer for Flash
     * upgrades.
     */
    function buildInstaller(options) {
        if (!options)
            options = {};
        var ret = AC_GetArgs(options,
            "movie", "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000",
            "application/x-shockwave-flash"),
            MMPlayerType  = (apf.isIE == true) ? "ActiveX" : "PlugIn",
            MMredirectURL = window.location;
        document.title    = document.title.slice(0, 47) + " - Flash Player Installation";
        var MMdoctitle    = document.title;

        return AC_FL_RunContent({
            src              : "playerProductInstall",
            FlashVars        : "MMredirectURL=" + MMredirectURL + "&MMplayerType="
                + MMPlayerType + "&MMdoctitle=" + MMdoctitle + "",
            width            : "100%",
            height           : "100%",
            align            : "middle",
            id               : ret.embedAttrs["name"],
            quality          : "high",
            bgcolor          : "#000000",
            name             : ret.embedAttrs["name"],
            allowScriptAccess: "always",
            type             : "application/x-shockwave-flash",
            pluginspage      : "http://www.adobe.com/go/getflashplayer"
        });
    }

    var sSrc = "src|movie",
        sObj = "onafterupdate|onbeforeupdate|onblur|oncellchange|onclick|ondblclick"
             + "|ondrag|ondragend|ondragenter|ondragleave|ondragover|ondrop|onfinish"
             + "|onfocus|onhelp|onmousedown|onmouseup|onmouseover|onmousemove"
             + "|onmouseout|onkeypress|onkeydown|onkeyup|onload|onlosecapture"
             + "|onpropertychange|onreadystatechange|onrowsdelete|onrowenter"
             + "|onrowexit|onrowsinserted|onstart|onscroll|onbeforeeditfocus"
             + "|onactivate|onbeforedeactivate|ondeactivate|type|codebase|id",
        sEmb = "width|height|align|vspace|hspace|class|title|accesskey|name|tabindex";

    /**
     * Augments options from AC_FL_RunContent and AC_SW_RunContent to sane
     * object that can be used to generate <OBJECT> and <EMBED> tags (depending
     * on the clients' browser, but this function will generate both)
     *
     * @param {Object} options
     * @param {Object} srcParamName
     * @param {Object} classid
     * @param {Object} mimeType
     * @type {Object}
     */
    function AC_GetArgs(options, srcParamName, classid, mimeType){
        var i, name,
            ret  = {
                embedAttrs: {},
                params    : {},
                objAttrs  : {}
            };

        for (i in options) {
            name = i.toLowerCase();
            if (name == "classid") continue;
            
            if (name == "pluginspage") {
                ret.embedAttrs[i] = options[i];
            }
            else if (sSrc.indexOf(name) > -1) {
                ret.embedAttrs["src"]    = options[i];
                ret.params[srcParamName] = options[i];
            }
            else if (sObj.indexOf(name) > -1) {
                ret.objAttrs[i] = options[i];
            }
            else if (sEmb.indexOf(name) > -1) {
                ret.embedAttrs[i] = ret.objAttrs[i] = options[i];
            }
            else {
                ret.embedAttrs[i] = ret.params[i] = options[i];
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
        if (apf.isIE) {
            return self[id];
        }
        else {
            elem = document[id] ? document[id] : document.getElementById(id);
            if (!elem)
                elem = apf.lookup(id);
            return elem;
        }
    }

    var hash     = {},
        uniqueID = 1;

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
            throw new Error(apf.formatErrorString(0, this, "Player with id: " + id + " not found"));
        if (player[methodName] == null)
            throw new Error(apf.formatErrorString(0, this, "Method " + methodName + " Not found"));

        // #ifdef __DEBUG
        apf.console.info("[FLASH] received method call for player '" + id + "', '" + methodName + "'");
        // #endif

        var args = [],
            i    = 2,
            l    = arguments.length;
        for (; i < l; i++)
            args.push(decode(arguments[i]));
        player[methodName].apply(player, args);
    }

    /**
     * Directs a call from a JS object to an embedded SWF
     *
     * @param {mixed}  o  DOM reference of the Flash movie (or its ID as a string)
     * @param {String} fn Name of the function to be called on the Flash movie, exposed by ExternalInterface
     * @type {void}
     */
    function remote(o, fn) {
        if (typeof o == "string")
            o = hash[o];
        var rs = o.CallFunction('<invoke name="' + fn + '" returntype="javascript">'
               + __flash__argumentsToXML(arguments, 2) + '</invoke>');
        return eval(rs);
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
        return data.replace(/\&([^;]*)\;/g, "&amp;$1;")
                   // entity encode XML-ish characters, or Flash's broken XML
                   // serializer breaks
                   .replace(/</g, "&lt;")
                   .replace(/>/g, "&gt;")
                   // transforming \ into \\ doesn't work; just use a custom encoding
                   .replace("\\", "&custom_backslash;")
                   // null character
                   .replace(/\0/g, "\\0")
                   .replace(/\"/g, "&quot;");
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
        // ExternalInterface; these are encoded into a custom encoding, rather
        // than the standard entity encoding, because otherwise we won't be able
        // to differentiate between our own encoding and any entity characters
        // that are being used in the string itself
        return data.replace(/\&custom_lt\;/g, "<")
                   .replace(/\&custom_gt\;/g, ">")
                   .replace(/\&custom_backslash\;/g, '\\')
                   // needed for IE; \0 is the NULL character
                   .replace(/\\0/g, "\0");
    }

    var aIsAvailable = {};
    /*
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

    /*
     * Shorthand function to call and cache isAvailable() with version
     * number 8.0.0
     *
     * @type {Boolean}
     */
    function isEightAvailable() {
        return isAvailable("8.0.0");
    }

    var oSandboxTypes = {
        remote          : "remote (domain-based) rules",
        localwithfile   : "local with file access (no internet access)",
        localwithnetwork: "local with network (internet access only, no local access)",
        localtrusted    : "local, trusted (local + internet access)"
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
        oSandbox.description = oSandboxTypes[(typeof oSandboxTypes[oSandbox.type] != "undefined"
            ? oSandbox.type
            : "unknown")];
        if (oSandbox.type == "localwithfile") {
            oSandbox.noRemote = true;
            oSandbox.noLocal  = false;
            oSandbox.error    = "Flash security note: Network/internet URLs will not \
                                 load due to security restrictions.\
                                 Access can be configured via Flash Player Global Security\
                                 Settings Page: \
                                 http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html";
        }
        else if (oSandbox.type == "localwithnetwork") {
            oSandbox.noRemote = false;
            oSandbox.noLocal  = true;
        }
        else if (oSandbox.type == "localtrusted") {
            oSandbox.noRemote = false;
            oSandbox.noLocal  = false;
        }

        return oSandbox;
    }

    return {
        isAvailable     : isAvailable,
        isEightAvailable: isEightAvailable,
        buildContent    : buildContent,
        embed           : embed,
        encode          : encode,
        decode          : decode,
        getElement      : getElement,
        addPlayer       : addPlayer,
        getPlayer       : getPlayer,
        callMethod      : callMethod,
        getSandbox      : getSandbox,
        remote          : remote
    };
})();
// #endif
