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

// #ifdef __TP_WEBDAV
// #define __WITH_TELEPORT 1

/**
 * Component implementing WebDAV remote filesystem protocol.
 * Depends on implementation of WebDAV server.
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @constructor
 *
 * @inherits jpf.BaseComm
 * @inherits jpf.http
 * @namespace jpf
 */

jpf.webdav = function(){
    this.server  = null;
    this.timeout = 10000;
    this.useHTTP = true;
    this.method  = "GET";

    this.TelePortModule = true;

    this.model    = null;
    this.useModel = false;

    var oLocks       = {},
        iLockId      = 0,
        aLockedStack = [],
        oServerVars  = {},
        _self        = this;

    // Collection of shorthands for all namespaces known and used by this class
    this.NS   = {
        D    : "DAV:",
        ns0  : "DAV:",
        lp1  : "DAV:",
        lp2  : "http://apache.org/dav/props/"
    };

    if (!this.uniqueId) {
        jpf.makeClass(this);

        this.inherit(jpf.BaseComm, jpf.http);
    }

    /**
     * Simple helper function to store session variables in the private space.
     *
     * @param {String} name
     * @param {mixed}  value
     * @type  {mixed}
     * @private
     */
    function register(name, value) {
        oServerVars[name] = value;

        return value;
    }

    /**
     * Simple helper function to complete remove variables that have been
     * stored in the private space by register()
     *
     * @param {String} name
     * @type  {void}
     * @private
     */
    function unregister() {
        for (var i = 0; i < arguments.length; i++) {
            if (typeof oServerVars[arguments[i]] != "undefined") {
                oServerVars[arguments[i]] = null;
                delete oServerVars[arguments[i]];
            }
        }
    }

    /**
     * Simple helper function that retrieves a variable, stored in the private
     * space.
     *
     * @param {String} name
     * @type  {mixed}
     * @private
     */
    function getVar(name) {
        return oServerVars[name] || "";
    }

    this.doRequest = function(fCallback, sPath, sBody, oHeaders, bUseXml, fCallback2) {
        if (!getVar("authenticated")) {
            return onAuth({
                method : this.doRequest,
                context: this,
                args   : arguments
            });
        }
        
        if (bUseXml) {
            if (!oHeaders)
                oHeaders = {};
            oHeaders["Content-type"] = "text/xml; charset=utf-8";
        }
        return this.get(this.server + sPath || "",
            function(data, state, extra) {
                if (state != jpf.SUCCESS) {
                    var oError;

                    //#ifdef __DEBUG
                    oError = WebDAVError("Url: " + extra.url + "\nInfo: " + extra.message);
                    //#endif

                    if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                        return true;

                    throw oError;
                }

                var iStatus = parseInt(extra.http.status);
                if (iStatus == 401) //authentication requested
                    return; // 401's are handled by the browser already, so no need for additional processing...

                var sResponse = (extra.http.responseText || "");
                if (sResponse.replace(/^[\s\n\r]+|[\s\n\r]+$/g, "") != ""
                  && sResponse.indexOf('<?xml version=') == 0) {
                    try {
                        data = (extra.http.responseXML && extra.http.responseXML.documentElement)
                            ? jpf.xmlParseError(extra.http.responseXML)
                            : jpf.getXmlDom(extra.http.responseText);

                        if (!jpf.supportNamespaces)
                            data.setProperty("SelectionLanguage", "XPath");

                        extra.data = data.documentElement;
                    }
                    catch(e) {
                        throw WebDAVError("Received invalid XML\n\n" + e.message);
                    }
                }

                if (typeof fCallback == "function")
                    fCallback.call(_self, data, state, extra, fCallback2);
            }, {
                nocache       : false,
                useXML        : false,//true,
                ignoreOffline : true,
                data          : sBody || "",
                headers       : oHeaders,
                username      : getVar("auth-username") || null,
                password      : getVar("auth-password") || null
            });
    };

    /**
     * Something went wrong during the authentication process; this function
     * provides a central mechanism for dealing with this situation
     *
     * @param     {String}  msg
     * @type      {Boolean}
     * @exception {Error} A general Error object
     * @private
     */
    function notAuth(msg) {
        unregister('auth-password');

        var extra = {
            username : getVar('auth-username'),
            server   : _self.server,
            message  : msg || "Access denied. Please check you username or password."
        }

        var cb = getVar('auth-callback');
        if (cb) {
            cb(null, jpf.ERROR, extra);
            unregister('auth-callback');
        }

        // #ifdef __DEBUG
        jpf.console.error(extra.message + ' (username: ' + extra.username
                          + ', server: ' + extra.server + ')', 'webdav');
        // #endif

        return _self.dispatchEvent("authfailure", extra);
    }

    /**
     * Our connection to the server has dropped, or the WebDAV server can not be
     * reached at the moment. We will cancel the authentication process and
     * dispatch a 'connectionerror' event
     *
     * @param {String}  msg
     * @type  {Boolean}
     * @private
     */
    function connError(msg) {
        unregister('auth-password');

        var extra = {
            username : getVar('auth-username'),
            server   : _self.server,
            message  : msg || "Could not connect to server, please contact your System Administrator."
        }

        var cb = getVar('auth-callback');
        if (cb) {
            cb(null, jpf.ERROR, extra);
            unregister('auth-callback');
        }

        // #ifdef __DEBUG
        jpf.console.error(extra.message + ' (username: ' + extra.username
                          + ', server: ' + extra.server + ')', 'webdav');
        // #endif

        return _self.dispatchEvent("connectionerror", extra);
    }

    function WebDAVError(sMsg) {
        return new Error(jpf.formatErrorString(0, _self,
                         "WebDAV Communication error", sMsg));
    }

    function onAuth(callback) {
        var oDoc, authRequired = false;
        if (jpf.isIE) {
            try {
                oDoc = new ActiveXObject("Msxml2.DOMDocument");
            }
            catch(e) {}
        }
        else if (document.implementation && document.implementation.createDocument) {
            try {
                oDoc = document.implementation.createDocument("", "", null);
            }
            catch (e) {}
        }

        try {
            if (jpf.isIE) { // only support IE for now, other browsers cannot detect 401's silently yet...
                oDoc.async = false;
                oDoc.load(_self.server + _self.rootPath);
            }
        }
        catch (e) {
            authRequired = true;
        }

        if (authRequired)
            jpf.auth.authRequired(callback);
        else {
            register("authenticated", true);
            if (callback && callback.method)
                callback.method.apply(callback.context, callback.args);
        }
    }

    this.authenticate = function(username, password, callback) {
        register("auth-username", username);
        register("auth-password", password);
        register("auth-callback", callback);

        this.doRequest(function(data, state, extra) {
            if (extra.http.status == 401)
                return jpf.auth.authRequired();
            register("authenticated", true);
            var cb = getVar("auth-callback");
            if (cb) {
                cb(null, state, extra);
                unregister('auth-callback');
            }
        }, this.rootPath, null, {}, false, null);
    };

    this.reset = function() {
        unregister("authenticated");
        unregister("auth-username");
        unregister("auth-password");
        unregister("auth-callback");
    };

    //------------ Filesystem operations ----------------//

    this.read = function(sPath, callback) {
        this.method = "GET";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 403) { //Forbidden
                var oError = WebDAVError("Unable to read file. Server says: "
                             + jpf.webdav.STATUS_CODES["403"]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
            else {
                callback
                    ? callback.call(_self, data, state, extra)
                    : this.dispatchEvent('onfilecontents', {data: data});
            }
        }, sPath);
    };

    this.readDir = function(sPath, callback) {
        if (sPath.charAt(sPath.length - 1) != "/")
            sPath += "/";
        return this.getProperties(sPath, 1, callback);
    };

    this.write = function(sPath, sContent, sLock, callback) {
        var oLock = this.lock(sPath);
        if (!oLock.token)
            return updateLockedStack(oLock, "write", arguments);

        this.method = "PUT";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 409 || iStatus == 405) { //Conflict || Not Allowed
                var oError = WebDAVError("Unable to write to file. Server says: "
                             + jpf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
        }, sPath, sContent, sLock ? {
            "If": "<" + sLock + ">"
        } : null, true, callback);
    };

    this.copy = function(sFrom, sTo, bOverwrite, callback) {
        if (!sTo || sFrom == sTo) return;
        
        var oLock = this.lock(sFrom);
        if (!oLock.token)
            return updateLockedStack(oLock, "copy", arguments);

        this.method = "COPY";
        var oHeaders = {
            "Destination": this.server + sTo
        };
        if (typeof bOverwrite == "undefined")
            bOverwrite = true;
        if (!bOverwrite)
            oHeaders["Overwrite"] = "F";
        if (oLock.token)
            oHeaders["If"] = "<" + oLock.token + ">";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 403 || iStatus == 409 || iStatus == 412 
              || iStatus == 423 || iStatus == 424 || iStatus == 502
              || iStatus == 507) {
                var oError = WebDAVError("Unable to copy file '" + sFrom 
                             + "' to '" + sTo + "'. Server says: "
                             + jpf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
        }, sFrom, null, oHeaders, true, callback);
    };

    this.move = function(sFrom, sTo, bOverwrite, callback) {
        if (!sTo || sFrom == sTo) return;
        
        var oLock = this.lock(sFrom);
        if (!oLock.token)
            return updateLockedStack(oLock, "move", arguments);

        this.method = "MOVE";
        var oHeaders = {
            "Destination": this.server + sTo
        };
        if (typeof bOverwrite == "undefined")
            bOverwrite = true;
        if (!bOverwrite)
            oHeaders["Overwrite"] = "F";
        if (oLock.token)
            oHeaders["If"] = "<" + oLock.token + ">";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 403 || iStatus == 409 || iStatus == 412
              || iStatus == 423 || iStatus == 424 || iStatus == 502) {
                var oError = WebDAVError("Unable to move file '" + sFrom
                             + "' to '" + sTo + "'. Server says: "
                             + jpf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
        }, sFrom, null, oHeaders, true, callback);
    };

    this.remove = function(sPath, callback) {
        var oLock = this.lock(sPath);
        if (!oLock.token)
            return updateLockedStack(oLock, "remove", arguments);

        this.method = "DELETE";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 423 || iStatus == 424) { //Failed dependency (collections only)
                var oError = WebDAVError("Unable to remove file '" + sPath
                             + "'. Server says: "
                             + jpf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
        }, sPath, null, oLock.token ? {
            "If": "<" + oLock.token + ">"
        } : null, true, callback);
    };

    this.mkdir = function(sPath, callback) {
        var oLock = this.lock(sPath);
        if (!oLock.token)
            return updateLockedStack(oLock, "mkdir", arguments);
        
        this.method = "MKCOL";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 201) { //Created
                // TODO: refresh parent node...
            }
            else if (iStatus == 403 || iStatus == 405 || iStatus == 409
              || iStatus == 415 || iStatus == 507) {
                var oError = WebDAVError("Unable to create directory '" + sPath
                             + "'. Server says: "
                             + jpf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
            _self.unlock(oLock);
        }, sPath, null, oLock.token ? {
            "If": "<" + oLock.token + ">"
        } : null, true, callback);
    };

    this.list = function(sPath) {
        return this.getProperties(sPath, 0);
    };

    /**
     *
     * @param {String} sPath
     * @param {String} sOwner   URL of the owning party (e.g. 'javeline.com')
     * @param {Number} iDepth   Depth of lock recursion down the tree, should be '1' or 'Infinity'
     * @param {String} sType    Type of the lock, default is 'write' (no other possibility)
     * @param {Number} iTimeout
     * @param {String} sLock    Previous lock token
     * @type  {void}
     */
    this.lock = function(sPath, iDepth, iTimeout, sLock, callback) {
        // first, check for existing lock
        var oLock = getLock(sPath);
        if (oLock && oLock.token) {
            // renew the lock (if needed - check timeout)...
            return oLock;
        }

        this.method = "LOCK"

        iTimeout = iTimeout ? "Infinite, Second-4100000000" : "Second-" + iTimeout;
        var oHeaders = {
            "Timeout": iTimeout
        };
        if (iDepth)
            oHeaders["Depth"] = iDepth || "Infinity";
        if (sLock)
            oHeaders["If"] = "<" + sLock + ">";
        var xml = '<?xml version="1.0" encoding="utf-8"?>\
            <D:lockinfo xmlns:D="' + this.NS.D + '">\
                <D:lockscope><D:exclusive /></D:lockscope>\
                <D:locktype><D:write /></D:locktype>\
                <D:owner><D:href>'
                + document.location.toString().escapeHTML() +
                '</D:href></D:owner>\
            </D:lockinfo>';
        this.doRequest(registerLock, sPath, xml, oHeaders, true, callback);
        return newLock(sPath);
    };

    this.unlock = function(oLock, callback) {
        if (typeof oLock == "string")
            oLock = getLock(oLock);
        if (!oLock || !oLock.token) return;

        this.method = "UNLOCK";
        this.doRequest(unregisterLock, oLock.path, null, {
            "Lock-Token": "<" + oLock.token + ">"
        }, true, callback);
    };

    function newLock(sPath) {
        return oLocks[sPath] = {
            path : sPath,
            id   : iLockId++,
            token: null
        };
    }

    function registerLock(data, state, extra) {
        var iStatus = parseInt(extra.http.status),
            sPath = extra.url.replace(this.server, ''),
            oLock = getLock(sPath) || newLock(sPath);
        if (iStatus == 409 || iStatus == 423 || iStatus == 412) {
            // lock failed, so unregister it immediately
            unregisterLock(data, state, extra);
            var oError = WebDAVError("Unable to apply lock to '" + sPath
                         + "'. Server says: "
                         + jpf.webdav.STATUS_CODES[String(iStatus)]);
            if (this.dispatchEvent("error", {
                error   : oError,
                bubbles : true
              }) === false)
                throw oError;
        }
        
        var oOwner = $xmlns(data, "owner",     _self.NS.ns0)[0];
        var oToken = $xmlns(data, "locktoken", _self.NS.D)[0];
        oLock.path    = sPath;
        oLock.type    = "write";
        oLock.scope   = $xmlns(data,   "exclusive", _self.NS.D).length ? "exclusive" : "shared";
        oLock.depth   = $xmlns(data,   "depth",     _self.NS.D)[0].firstChild.nodeValue;
        oLock.owner   = $xmlns(oOwner, "href",      _self.NS.ns0)[0].firstChild.nodeValue;
        oLock.timeout = $xmlns(data,   "timeout",   _self.NS.D)[0].firstChild.nodeValue;
        oLock.token   = $xmlns(oToken, "href",      _self.NS.D)[0].firstChild.nodeValue.split(":")[1];

        purgeLockedStack(oLock);
    }

    function unregisterLock(data, state, extra) {
        var sPath = extra.url.replace(this.server, ''),
            oLock = getLock(sPath);
        if (!oLock) return;
        purgeLockedStack(oLock, true);
        oLocks[sPath] = oLock = null;
        delete oLocks[sPath];
    }

    function getLock(sPath) {
        return oLocks[sPath] || null;
    }

    function updateLockedStack(oLock, sFunc, aArgs) {
        return aLockedStack.push({
            lockId: oLock.id,
            func  : sFunc,
            args  : aArgs
        });
    }

    function purgeLockedStack(oLock, bFailed) {
        for (var i = aLockedStack.length - 1; i >= 0; i--) {
            if (aLockedStack[i].lockId != oLock.id) continue;
            if (!bFailed)
                _self[aLockedStack[i].func].apply(_self, aLockedStack[i].args);
            aLockedStack.remove(i);
        }
    }

    this.getProperties = function(sPath, iDepth, callback, oHeaders) {
        // Note: caching is being done by an external model
        this.method = "PROPFIND";
        // XXX maybe we want to change this to allow getting selected props
        var xml = '<?xml version="1.0" encoding="utf-8" ?>\
                    <D:propfind xmlns:D="' + this.NS.D + '">\
                        <D:allprop />\
                    </D:propfind>';
        oHeaders = oHeaders || {};
        oHeaders["Depth"] = typeof iDepth != "undefined" ? iDepth : 1
        this.doRequest(parsePropertyPackets, sPath, xml, oHeaders, true, callback);
    };

    this.setProperties = function(sPath, oPropsSet, oPropsDel, sLock) {
        this.method = "PROPPATCH";
        
        this.doRequest(function(data, state, extra) {
            jpf.console.dir(data);
        }, sPath, buildPropertiesBlock(oPropsSet, oPropsDel),
           sLock ? {"If": "<" + sLock + ">"} : null, true);
    };

    /**
     * create the XML for a PROPPATCH request.
     * 
     * @param {Object} oPropsSet A mapping from namespace to a mapping of key/value pairs (where value is an *entitized* XML string)
     * @param {Object} oPropsDel A mapping from namespace to a list of names
     * @type  {String}
     * @private
     */
    function buildPropertiesBlock(oPropsSet, oPropsDel) {
        var aOut = ['<?xml version="1.0" encoding="utf-8" ?>',
            '<D:propertyupdate xmlns:D="', _self.NS.D, '">'];

        var bHasProps = false, ns, i, j;
        for (ns in oPropsSet) {
            bHasProps = true;
            break;
        }
        if (bHasProps) {
            aOut.push('<D:set>\n');
            for (ns in oPropsSet) {
                for (i in oPropsSet[ns])
                    aOut.push('<D:prop>', oPropsSet[ns][i], '</D:prop>')
            }
            aOut.push('</D:set>');
        }
        bHasProps = false;
        for (ns in oPropsDel) {
            bHasProps = true;
            break;
        }
        if (bHasProps) {
            aOut.push('<D:remove><D:prop>');
            for (ns in oPropsDel) {
                for (i = 0, j = oPropsDel[ns].length; i < j; i++)
                    aOut.push('<', oPropsDel[ns][i], ' xmlns="', ns, '"/>')
            }
            aOut.push('</D:prop></D:remove>');
        }

        aOut.push('</D:propertyupdate>');
        return aOut.join('');
    }

    function parsePropertyPackets(oXml, state, extra, callback) {
        if (parseInt(extra.http.status) == 403) {
            // TODO: dispatch onerror event
            return;
        }

        var aResp = $xmlns(oXml, 'response', _self.NS.D),
            aOut = [];
        if (aResp.length) //we got a valid result set, so assume that any possible AUTH has succeeded
            register("authenticated", true);
        for (var i = aResp.length > 1 ? 1 : 0, j = aResp.length; i < j; i++)
            aOut.push(itemToXml(aResp[i]));
        if (callback)
            callback.call(_self, "<files>" + aOut.join('') + "</files>", state, extra);
    }

    function itemToXml(oNode) {
        var sType       = $xmlns(oNode, "collection", _self.NS.D).length > 0 ? "folder" : "file";
        var aExecutable = $xmlns(oNode, "executable", _self.NS.lp2);
        var aCType      = $xmlns(oNode, "getcontenttype", _self.NS.D);
        var sPath       = $xmlns(oNode, "href", _self.NS.D)[0].firstChild.nodeValue.replace(/[\\\/]+$/, '');
        return "<" + sType + " " +
            "path='" + sPath + "' " +
            "type='" + sType + "' " +
            "size='" + parseInt(sType == "file"
                ? $xmlns(oNode, "getcontentlength", _self.NS.lp1)[0].firstChild.nodeValue
                : 0) + "' " +
            "name='" + decodeURIComponent(sPath.split("/").pop()) + "' " +
            "contenttype='" + (sType == "file" && aCType.length
                ? aCType[0].firstChild.nodeValue
                : "") + "' " +
            "creationdate='" + $xmlns(oNode, "creationdate", _self.NS.lp1)[0].firstChild.nodeValue + "' " +
            "lastmodified='" + $xmlns(oNode, "getlastmodified", _self.NS.lp1)[0].firstChild.nodeValue + "' " +
            "etag='" + $xmlns(oNode, "getetag", _self.NS.lp1)[0].firstChild.nodeValue + "' " +
            "lockable='" + ($xmlns(oNode, "locktype", _self.NS.D).length > 0).toString() + "' " +
            "executable='" + (aExecutable.length > 0 && aExecutable[0].firstChild.nodeValue == "T").toString() +
            "'/>";
    }

    this.$xmlUpdate = function(action, xmlNode, listenNode, UndoObj) {
        if (!this.useModel) return;
        jpf.console.log('$xmlUpdate called: ', action);
        jpf.console.dir(xmlNode);
        jpf.console.dir(listenNode);
        jpf.console.dir(UndoObj);
    };

    /**
     * This is the connector function between the JML representation of this
     * Teleport module. If specified, it will also setup the Remote SmartBinding
     * feature.
     *
     * Sample JML:
     *   <j:teleport>
     *       <j:webdav id="myWebDAV" url="http://http://test.webdav.org" model="myFilesystem" model-contents="all" />
     *   </j:teleport>
     *
     * @param     {XMLDom} x An XML document element that contains WebDAV metadata
     * @type      {void}
     * @exception {Error}  A general Error object
     */
    this.load = function(x){
        this.server  = x.getAttribute('url');
        var i, url   = new jpf.url(this.server);

        // do some extra startup/ syntax error checking
        if (!url.host || !url.protocol)
            throw new Error(jpf.formatErrorString(0, this,
                "WebDAV initialization error",
                "Invalid WebDAV server url provided."));

        this.domain   = url.host;
        this.rootPath = url.path;
        this.server   = this.server.replace(new RegExp(this.rootPath + "$"), "");
        this.tagName  = "webdav";

        this.timeout  = parseInt(x.getAttribute("timeout")) || this.timeout;
        this.resource = x.getAttribute('resource') || jpf.appsettings.name;

        var sModel    = x.getAttribute('model') || null;
        if (sModel)
            this.model = self[sModel] || null;
        this.useModel = this.model ? true : false;
        if (this.useModel)
            jpf.xmldb.addNodeListener(this.model, this);

        //TODO: implement model updating mechanism (model="mdlFoo")
        //      with corresponding 'this.$xmlUpdate' handler function for model updates

        // parse any custom events formatted like 'onfoo="doBar();"'
        var attr = x.attributes;
        for (i = 0; i < attr.length; i++) {
            if (attr[i].nodeName.indexOf("on") == 0)
                this.addEventListener(attr[i].nodeName,
                    new Function(attr[i].nodeValue));
        }
    };
};

jpf.webdav.STATUS_CODES = {
    '100': 'Continue',
    '101': 'Switching Protocols',
    '102': 'Processing',
    '200': 'OK',
    '201': 'Created',
    '202': 'Accepted',
    '203': 'None-Authoritive Information',
    '204': 'No Content',
    '1223': 'No Content',
    '205': 'Reset Content',
    '206': 'Partial Content',
    '207': 'Multi-Status',
    '300': 'Multiple Choices',
    '301': 'Moved Permanently',
    '302': 'Found',
    '303': 'See Other',
    '304': 'Not Modified',
    '305': 'Use Proxy',
    '307': 'Redirect',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '402': 'Payment Required',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '406': 'Not Acceptable',
    '407': 'Proxy Authentication Required',
    '408': 'Request Time-out',
    '409': 'Conflict',
    '410': 'Gone',
    '411': 'Length Required',
    '412': 'Precondition Failed',
    '413': 'Request Entity Too Large',
    '414': 'Request-URI Too Large',
    '415': 'Unsupported Media Type',
    '416': 'Requested range not satisfiable',
    '417': 'Expectation Failed',
    '422': 'Unprocessable Entity',
    '423': 'Locked',
    '424': 'Failed Dependency',
    '500': 'Internal Server Error',
    '501': 'Not Implemented',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Time-out',
    '505': 'HTTP Version not supported',
    '507': 'Insufficient Storage'//,
//    12002 ERROR_INTERNET_TIMEOUT
//    12007 ERROR_INTERNET_NAME_NOT_RESOLVED
//    12029 ERROR_INTERNET_CANNOT_CONNECT
//    12030 ERROR_INTERNET_CONNECTION_ABORTED
//    12031 ERROR_INTERNET_CONNECTION_RESET
//    12152 ERROR_HTTP_INVALID_SERVER_RESPONSE
};

// #ifdef __WITH_DATA_INSTRUCTIONS

/**
 * Instruction handler for XMPP protocols. It supports the following directives:
 * - xmpp:name.login(username, password)
 * - xmpp:name.logout()
 * - xmpp:name.notify(message, to_address, thread, type)
 *
 * @param {XMLDoc}  xmlContext
 * @param {Object}  options    Valid options are
 *    instrType     {String}
 *    data          {String}
 *    multicall     {Boolean}
 *    userdata      {mixed}
 *    arg           {Array}
 *    isGetRequest  {Boolean}
 * @param {Function} callback
 * @type  {void}
 */
jpf.datainstr.webdav = function(xmlContext, options, callback){
    var parsed = options.parsed || this.parseInstructionPart(
        options.instrData.join(":"), xmlContext, options.args, options);

    if (options.preparse) {
        options.parsed = parsed;
        options.preparse = -1;
        return;
    }

    var oWebDAV, name = parsed.name.split(".");
    if (name.length == 1) {
        var modules = jpf.teleport.modules;
        for (var i = 0; i < modules.length; i++) {
            if (modules[i].obj.tagName == "webdav") {
                oWebDAV = modules[i].obj;
                break;
            }
        }
    }
    else {
        oWebDAV = self[name[0]];
    }

    //#ifdef __DEBUG
    if (!oWebDAV) {
        throw new Error(jpf.formatErrorString(0, null, "Saving/Loading data",
            name.length
                ? "Could not find WebDAV object by name '" + name[0] + "' in \
                   data instruction '" + options.instruction + "'"
                : "Could not find any WebDAV object to execute data \
                   instruction with"));
    }
    //#endif

    var args  = parsed.arguments;
    var sPath = args[0];
    // RULE for case aliases: first, topmost match is the preferred term for any
    //                        action and should be used in demos/ examples in
    //                        favor of other aliases.
    switch (name.shift()) {
        case "login":
        case "authenticate":
            oWebDAV.authenticate(args[0], args[1], callback);
            break;
        case "logout":
            oWebDAV.reset();
            break;
        case "read":
            oWebDAV.read(sPath, callback);
            break;
        case "write":
        case "store":
        case "save":
            oWebDAV.write(sPath, args[1], callback);
            break;
        case "copy":
        case "cp":
            oWebDAV.copy(args[0], args[1], args[2], callback);
            break;
        case "move":
        case "rename":
        case "mv":
            sPath = args[2].replace(args[0], "");
            oWebDAV.move(args[2], sPath + args[1], args[3], callback);
            break;
        case "remove":
        case "rmdir":
        case "rm":
            oWebDAV.remove(sPath, callback);
            break;
        case "scandir":
        case "readdir":
            oWebDAV.readDir(sPath, callback);
            break;
        case "getroot":
            oWebDAV.getProperties(oWebDAV.rootPath, 0, callback);
            break;
        case "mkdir":
            break;
        case "lock":
            oWebDAV.lock(sPath, null, null, null, callback);
            break;
        case "unlock":
            oWebDAV.unlock(sPath, callback);
            break;
        default:
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, null, "Saving/Loading data",
                "Invalid WebDAV data instruction '" + options.instruction + "'"));
            //#endif
            break;
    }
};

// #endif

// #endif
