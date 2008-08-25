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

// #ifdef _WITH_FLASH
jpf.flash_helper = (function(){
    // v1.7
    // Flash Player Version Detection
    // Detect Client Browser type
    // Copyright 2005-2007 Adobe Systems Incorporated.  All rights reserved.
    function ControlVersion(){
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
    
    // JavaScript helper required to detect Flash Player PlugIn version information
    function GetSwfVer(){
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
            flashVer = ControlVersion();

        return flashVer;
    }
    
    // When called with reqMajorVer, reqMinorVer, reqRevision returns true if that version or greater is available
    function DetectFlashVer(reqMajorVer, reqMinorVer, reqRevision){
        versionStr = GetSwfVer();
        if (versionStr == -1)
            return false;
        else if (versionStr != 0) {
            if (jpf.isIE && !jpf.isOpera) {
                // Given "WIN 2,0,0,11"
                aTemp     = versionStr.split(" "); // ["WIN", "2,0,0,11"]
                sTemp     = aTemp[1]; // "2,0,0,11"
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
    
    function AC_AddExtension(src, ext){
        if (src.indexOf('?') != -1) 
            return src.replace(/\?/, ext + '?');
        else 
            return src + ext;
    }
    
    function AC_Generateobj(objAttrs, params, embedAttrs){
        var str = '';
        if (jpf.isIE && !jpf.isOpera) {
            str += '<object ';
            for (var i in objAttrs)
                str += i + '="' + objAttrs[i] + '" ';
            str += '>';
            for (var i in params)
                str += '<param name="' + i + '" value="' + params[i] + '" /> ';
            str += '</object>';
        }
        else {
            str += '<embed ';
            for (var i in embedAttrs)
                str += i + '="' + embedAttrs[i] + '" ';
            str += '> </embed>';
        }
        
        document.write(str);
    }
    
    function AC_FL_RunContent(){
        var ret = AC_GetArgs(arguments, ".swf", "movie", 
            "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000", 
            "application/x-shockwave-flash");
        AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
    }
    
    function AC_SW_RunContent(){
        var ret = AC_GetArgs(arguments, ".dcr", "src", 
            "clsid:166B1BCA-3F9C-11CF-8075-444553540000", null);
        AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
    }
    
    function AC_GetArgs(args, ext, srcParamName, classid, mimeType){
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
                    args[i + 1] = AC_AddExtension(args[i + 1], ext);
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
    
    /* ----------------------------------------------------
     * FAVideoManager
     *
     * This manages the collection of FAVideo instances on the HTML page. It directs calls from embedded
     * FAVideo SWFs to the appropriate FAVideo instance in Javascript.
     *----------------------------------------------------- */
    var hash     = {};
    var uniqueID = 1;
    
    function addPlayer(player) {
        hash[++uniqueID] = player;
        return uniqueID;
    }
    
    function getPlayer(id) {
        return hash[id];
    }
    
    function callMethod(id, methodName) {
        var player = hash[id];
        if (player == null)
            throw new Error(0, jpf.formatErrorString(0, this, "Player with id: " + id + " not found"));
        if (player[methodName] == null)
            throw new Error(0, jpf.formatErrorString(0, this, "Method " + methodName + " Not found"));
        
        // Unable to use slice on arguments in some browsers. Iterate instead:
        var args = [];
        for (var i = 2; i < arguments.length; i++)
            args.push(arguments[i]);
        player[methodName].apply(player, args);
    }
    
    var isAvailable = null;
    function isValidAvailable() {
        if (isAvailable === null)
            isAvailable = DetectFlashVer(6, 0, 65);
        return isAvailable;
    }
    
    var isEightAvail = null;
    function isEightAvailable() {
        if (isEightAvail === null)
            isEightAvail = DetectFlashVer(8, 0, 0);
        return isEightAvail;
    }
    
    return {
        isValidAvailable: isValidAvailable,
        isEightAvailable: isEightAvailable,
        AC_GetArgs      : AC_GetArgs,
        addPlayer       : addPlayer,
        getPlayer       : getPlayer,
        callMethod      : callMethod
    };
})();
// #endif
