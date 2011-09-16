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

/**
 * Element implementing WebDAV remote filesystem protocol.
 * WebDAV stands for "Web-based Distributed Authoring and Versioning". It is a
 * set of extensions to the HTTP protocol which allows users to collaboratively
 * edit and manage files on remote web servers (from: {@link http://www.webdav.org}.
 * This Object aims to be a complete implementation of {@link http://www.webdav.org/specs/rfc4918.html RFC4981}
 * and provides a scriptable interface to any WebDAV server.
 * Example:
 * Writing to a file with a WebDAV connector
 * <code>
 *  <a:webdav id="myWebDAV" url="http://my-webdav-server.com/dav_files/" />
 *     
 *  <a:script>
 *      // write the text 'bar' to a file on the server called 'foo.txt'
 *      myWebDAV.writeFile('http://my-webdav-server.com/dav_files/foo.txt', 'bar');
 *  </a:script>
 * </code>
 *
 * Remarks:
 * Calls can be made to a server using a special {@link term.datainstruction data instruction}
 * format.
 * <code>
 *  get="{myWebdav.authenticate([@username], [@password])}"
 *  get="{myWebdav.login(...alias for authenticate...)}"
 *  set="{myWebdav.logout()}"
 *  get="{myWebdav.read([@path])}"
 *  get="{myWebdav.create([@path], 'New File.txt', '')}"
 *  set="{myWebdav.write([@path], [@data])}"
 *  set="{myWebdav.store(...alias for write...)}"
 *  set="{myWebdav.save(...alias for write...)}"
 *  set="{myWebdav.copy([@path], [../@path])}"
 *  set="{myWebdav.cp(...alias for copy...)}"
 *  set="{myWebdav.rename([@name], [@path])}"
 *  set="{myWebdav.move([@path], [../@path])}"
 *  set="{myWebdav.mv(...alias for move...)}"
 *  set="{myWebdav.remove([@path])}"
 *  set="{myWebdav.rmdir(...alias for remove...)}"
 *  set="{myWebdav.rm(...alias for remove...)}"
 *  set="{myWebdav.mkdir([@path])}"
 *  get="{myWebdav.readdir([@path])}"
 *  get="{myWebdav.scandir(...alias for readdir...)}"
 *  load="{myWebdav.getroot()}"
 *  set="{myWebdav.lock([@path])}"
 *  set="{myWebdav.unlock([@path])}"
 * </code>
 *
 * @event authfailure Fires when the authentication process failed or halted.
 *   bubbles: yes
 *   cancelable: Prevents an authentication failure to be thrown
 *   object:
 *     {String}        username   the username used for the login attempt
 *     {String}        server     the server address (URI) of the XMPP server
 *     {String}        message    a more detailed explanation of the error
 * @event connectionerror Fires when the connection with the WebDAV server dropped.
 *   bubbles: yes
 *   cancelable: Prevents an connection error to be thrown
 *   object:
 *     {String}        username   the username used for the last-active session
 *     {String}        server     the server address (URI) of the WebDAV server
 *     {String}        message    a more detailed explanation of the error
 * @event onfilecontents Fires when a {@link teleport.webdav.method.read read} request has
 * completed successfully and returns the content-body of the requested file
 *   bubbles: yes
 *   object:
 *      {String}       data       the ASCI representation of the file content-body
 *
 * @define webdav
 * @addnode teleport
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @constructor
 *
 * @inherits apf.Class
 * @inherits apf.BaseComm
 * @inherits apf.http
 * @namespace apf
 *
 * @default_private
 */

apf.webdav = function(struct, tagName){
    this.$init(tagName || "webdav", apf.NODE_HIDDEN, struct);

    this.$locks       = {};
    this.$lockedStack = [];
    this.$lockId      = 0;
    this.$serverVars  = {};
    this.$fsCache     = {};
};

(function() {
    this.useHTTP = true;
    this.method  = "GET";

    this.$showHidden = false;

    /**
     * @attribute {String}  [show-hidden] Flag that specifies if hidden files
     *                                    should be passed
     */
    this.$booleanProperties["showhidden"]  = true;
    this.$supportedProperties.push("showhidden");

    this.$propHandlers["showhidden"]  = function(value) {
        this.$showHidden = value;
    };

    /*
     * Simple helper function to store session variables in the private space.
     *
     * @param {String} name
     * @param {mixed}  value
     * @type  {mixed}
     * @private
     */
    this.$regVar = function(name, value) {
        this.$serverVars[name] = value;

        return value;
    };

    /*
     * Simple helper function to complete remove variables that have been
     * stored in the private space by register()
     *
     * @param {String} name
     * @type  {void}
     * @private
     */
    function unregister() {
        for (var i = 0; i < arguments.length; i++) {
            if (typeof this.$serverVars[arguments[i]] != "undefined") {
                this.$serverVars[arguments[i]] = null;
                delete this.$serverVars[arguments[i]];
            }
        }
    }

    /*
     * Simple helper function that retrieves a variable, stored in the private
     * space.
     *
     * @param {String} name
     * @type  {mixed}
     * @private
     */
    this.$getVar = function(name) {
        return this.$serverVars[name] || "";
    };

    /**
     * Wrapper function that handles and executes each HTTP request. It also takes
     * care of streams that are incomplete or different than usual, thus produce
     * invalid XML that needs to be tidied prior to processing.
     * It also takes care of processing authentication process/ negotiation
     *
     * @param {Function}  fCallback    Function to execute when the request was successful
     * @param {String}    sPath        Path to the WebDAV resource
     * @param {sBody}     [sBody]      Optional body text (used for PUTs, for example)
     * @param {Object}    [oHeaders]   Additional headers in key: value format
     * @param {Boolean}   [bUseXml]    Tells the function whether to return XML. Defaults to FALSE
     * @param {Object}    [oBinary]    Object with properties for binary upload in modern browsers
     * @param {Function}  [fCallback2] Optional second callback, passed to fCallback as arguments. Used mainly by the data instructions
     * @type  {void}
     */
    this.doRequest = function(fCallback, sPath, sBody, oHeaders, bUseXml, oBinary, fCallback2) {
        if (!this.$getVar("authenticated")) {
            return onAuth.call(this, {
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

        var _self = this;
        return this.get(sPath || this.$server, {
            callback: function(data, state, extra) {
                if (state != apf.SUCCESS) {
                    var oError;

                    oError = WebDAVError.call(_self, "Url: " + extra.url + "\nInfo: " + extra.message);

                    //if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                    //    return true;
                    if (fCallback)
                        return fCallback.call(_self, data, state, extra, fCallback2);
                    else
                        throw oError;
                }
                
                extra.headers = oHeaders;

                var iStatus = parseInt(extra.status);
                if (iStatus == 401) //authentication requested
                    return; // 401's are handled by the browser already, so no need for additional processing...

                var sResponse = (extra.http.responseText || "");
                if (sResponse.replace(/^[\s\n\r]+|[\s\n\r]+$/g, "") != ""
                  && sResponse.indexOf('<?xml version=') == 0) {
                    try {
                        data = (extra.http.responseXML && extra.http.responseXML.documentElement)
                            ? apf.xmlParseError(extra.http.responseXML)
                            : apf.getXmlDom(extra.http.responseText);

                        if (!apf.supportNamespaces)
                            data.setProperty("SelectionLanguage", "XPath");

                        data = data.documentElement;
                        extra.data = data;//.documentElement;
                    }
                    catch(e) {
                        if (fCallback)
                            return fCallback.call(_self, data, state, extra, fCallback2);
                        else
                            throw WebDAVError.call(_self, "Received invalid XML\n\n" + e.message);
                    }
                }

                if (typeof fCallback == "function")
                    fCallback.call(_self, data, state, extra, fCallback2);
            },
            nocache       : false,
            useXML        : false,//true,
            ignoreOffline : true,
            data          : sBody || "",
            binary        : oBinary || false,
            headers       : oHeaders,
            username      : this.$getVar("auth-username") || null,
            password      : this.$getVar("auth-password") || null
        });
    };

    /*
     * Something went wrong during the authentication process; this function
     * provides a central mechanism for dealing with this situation
     *
     * @param     {String}  msg
     * @type      {Boolean}
     * @exception {Error} A general Error object
     * @private
     */
    function notAuth(msg) {
        unregister.call(this, 'auth-password');

        var extra = {
            username : this.$getVar('auth-username'),
            server   : this.$server,
            message  : msg || "Access denied. Please check you username or password."
        }

        var cb = this.$getVar('auth-callback');
        if (cb) {
            cb(null, apf.ERROR, extra);
            unregister.call(this, 'auth-callback');
        }

        // #ifdef __DEBUG
        try{
            apf.console.error(extra.message.toString() + ' (username: ' + extra.username
                              + ', server: ' + extra.server + ')', 'webdav');
        }
        catch(ex){}
        // #endif

        return this.dispatchEvent("authfailure", extra);
    }

    /*
     * Our connection to the server has dropped, or the WebDAV server can not be
     * reached at the moment. We will cancel the authentication process and
     * dispatch a 'connectionerror' event
     *
     * @param {String}  msg
     * @type  {Boolean}
     * @private
     */
    function connError(msg) {
        unregister.call(this, 'auth-password');

        var extra = {
            username : this.$getVar('auth-username'),
            server   : this.$server,
            message  : msg || "Could not connect to server, please contact your System Administrator."
        }

        var cb = this.$getVar('auth-callback');
        if (cb) {
            cb(null, apf.ERROR, extra);
            unregister.call(this, 'auth-callback');
        }

        // #ifdef __DEBUG
        apf.console.error(extra.message + ' (username: ' + extra.username
                          + ', server: ' + extra.server + ')', 'webdav');
        // #endif

        return this.dispatchEvent("connectionerror", extra);
    }

    /*
     * Wrapper function for generation WebDAV-specific Error reporting
     * 
     * @param {String} sMsg Message that lists the error details
     * @type  {Error}
     * @private
     */
    function WebDAVError(sMsg) {
        return new Error(apf.formatErrorString(0, this,
                         "WebDAV Communication error", sMsg));
    }

    /*
     * Integration with {@link auth} to implement application wide single
     * sign-on for WebDAV
     *
     * @param {Function} callback Will be executed upon successful authentication
     * @type  {void}
     * @private
     */
    function onAuth(callback) {
        var oDoc, authRequired = false;
        if (apf.isIE) {
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
            if (apf.isIE) { // only support IE for now, other browsers cannot detect 401's silently yet...
                oDoc.async = false;
                oDoc.load(this.$rootPath);
            }
        }
        catch (e) {
            authRequired = true;
        }
        
        var auth = this.ownerDocument.getElementsByTagNameNS(apf.ns.apf, "auth")[0];
        if (authRequired) {
            auth.authRequired(callback);
        }
        else {
            this.$regVar("authenticated", true);
            if (callback && callback.method)
                callback.method.apply(callback.context, callback.args);
        }
    }

    /**
     * Attempts to authenticate the session using HTTP-AUTH (simple
     * authentication mechanism)
     *
     * @param {String}   username Username of the password-protected WebDAV resource
     * @param {String}   password Password in plaintext format
     * @param {Function} callback Function to be executed when the authentication succeeded
     * @type  {void}
     */
    this.authenticate = function(username, password, callback) {
        this.$regVar("auth-username", username);
        this.$regVar("auth-password", password);
        this.$regVar("auth-callback", callback);

        var auth = apf.document.getElementsByTagNameNS(apf.ns.apf, "auth")[0];
        if (!auth)
            return;
        
        this.doRequest(function(data, state, extra) {
            if (extra.status == 401)
                return auth.authRequired();
            this.$regVar("authenticated", true);
            var cb = this.$getVar("auth-callback");
            if (cb) {
                cb(null, state, extra);
                unregister.call(this, 'auth-callback');
            }
        }, this.$rootPath, null, {}, false, null);
    };

    /**
     * Unset all cached values.
     * 
     * @type {void}
     */
    this.reset = function() {
        unregister.call(this, "authenticated");
        unregister.call(this, "auth-username");
        unregister.call(this, "auth-password");
        unregister.call(this, "auth-callback");
    };

    //------------ Filesystem operations ----------------//
    
    /**
     * Check whether a file or directory  exists on the remote filesystem and pass 
     * that information to a callback function
     * 
     * @param {String}   sPath    Path to the file or directory on the WebDAV server
     * @param {Function} callback Function to execute when the request was successful
     * @type  {void}
     */
    this.exists = function(sPath, callback) {
        this.getProperties(sPath, 0, function(data, state, extra) {
            callback(state === apf.SUCCESS);
        });
    };

    /**
     * Read the content of a file as plaintext and pass the data to a callback
     * function
     * 
     * @param {String}   sPath    Path to the file on the WebDAV server
     * @param {Function} callback Function to execute when the request was successful
     * @type  {void}
     */
    this.readFile =
    this.read = function(sPath, callback) {
        this.method = "GET";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.status);
            if (iStatus == 403) { //Forbidden
                var oError = WebDAVError.call(this, "Unable to read file. Server says: "
                             + apf.webdav.STATUS_CODES["403"]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false && !callback)
                    throw oError;
            }
            else {
                callback
                    ? callback.call(this, extra.http.responseText, state, extra)
                    : this.dispatchEvent("onfilecontents", {data: extra.http.responseTex});
            }
        }, sPath);
    };

    /**
     * Reads the contents of a directory resource (one level deep) and passes
     * the resulting XML to a  callback function to be processed further.
     * see {@link teleport.webdav.method.getProperties}
     *
     * @param {String}   sPath    Path to the file on the WebDAV server
     * @param {Function} callback Function to execute when the request was successful
     * @type  {void}
     */
    this.readdir = function(sPath, callback) {
        if (sPath.charAt(sPath.length - 1) != "/")
            sPath += "/";
        return this.getProperties(sPath, 1, callback);
    };

    /**
     * Creates a new directory resource on the WebDAV server.
     * 
     * @param {String}   sPath      Path of the new directory on the WebDAV server
     * @param {Boolean}  [bLock]    Whether to require a lock before copy
     * @param {Function} [callback] Function to execute when the request was successful
     * @type  {void}
     */
    this.mkdir = function(sPath, bLock, callback) {
        if (bLock) {
            var oLock = this.lock(sPath);
            if (!oLock.token)
                return updateLockedStack.call(this, oLock, "mkdir", arguments);
        }

        var _self = this;

        this.method = "MKCOL";
        this.doRequest(function(data, state, extra) {
            bLock && unregisterLock.call(this, sPath);
            var iStatus = parseInt(extra.status);
            if (iStatus == 201) { //Created
                _self.readdir(sPath.substr(0, sPath.lastIndexOf("/")), callback);
            }
            else if (iStatus == 400 || iStatus == 403 || iStatus == 405 || iStatus == 409
              || iStatus == 415 || iStatus == 507) {
                var oError = WebDAVError.call(this, "Unable to create directory '" + sPath
                             + "'. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false && callback)
                    callback(oError);
            }
        }, sPath, null, bLock && oLock.token
            ? {"If": "<" + oLock.token + ">"}
            : null, true);
    };

    /**
     * Reads the properties of a resource on the server.
     * see {@link teleport.webdav.method.getProperties}
     *
     * @param {String}   sPath    Path to the resource on the WebDAV server
     * @param {Function} callback Function to execute when the request was successful
     * @type  {void}
     */
    this.list = function(sPath, callback) {
        return this.getProperties(sPath, 0, callback);
    };

    /**
     * Write new contents (plaintext) to a file resource on the server, with or
     * without an existing lock on the resource.
     * 
     * @param {String}   sPath     Path to the file on the WebDAV server
     * @param {String}   sContent  New content-body of the file
     * @param {Boolean}  [bLock]   Whether to require a lock before write
     * @param {Object}   [oBinary] Object with properties for binary upload in modern browsers
     * @param {Function} callback  Function to execute when the request was successful
     * @type  {void}
     */
    this.writeFile =
    this.write = function(sPath, sContent, bLock, oBinary, callback) {
        if (bLock) {
            var oLock = this.lock(sPath);
            if (!oLock.token)
                return updateLockedStack.call(this, oLock, "write", arguments);
        }
        // binary option has been added later, keep fallback possible
        if (typeof callback == "undefined" && typeof oBinary == "function") {
            callback = oBinary;
            oBinary  = null;
        }

        this.method = "PUT";
        var _self = this;
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.status);
            if (state != apf.SUCCESS) {
                var oError = WebDAVError.call(this, "Unable to write to file. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false && !callback)
                    throw oError;
                callback && callback.call(this, data, apf.ERROR, extra);
            }
            else {
                _self.getProperties(sPath, 0, callback);
            }
        }, sPath, sContent, bLock && oLock.token
            ? {"If": "<" + oLock.token + ">"}
            : null, null, oBinary);
    };

    /**
     * Copies a file or directory resource to any location on the same WebDAV
     * server.
     * 
     * @param {String}   sFrom        Path to the file on the WebDAV server to be copied
     * @param {String}   sTo          New location to place the copy at
     * @param {Boolean}  [bOverwrite] Tells whether to overwrite any existing resource
     * @param {Boolean}  [bLock]      Whether to require a lock before copy
     * @param {Function} callback     Function to execute when the request was successful
     * @type  {void}
     */
    this.copy = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (!sTo || sFrom == sTo) 
            return (callback && callback("", apf.SUCCESS, {}));
        
        if (bLock) {
            var oLock = this.lock(sFrom);
            if (!oLock.token)
                return updateLockedStack.call(this, oLock, "copy", arguments);
        }

        this.method  = "COPY";
        var oHeaders = {
            "Destination": sTo || this.$server
        };
        if (typeof bOverwrite == "undefined")
            bOverwrite = true;
        if (!bOverwrite)
            oHeaders["Overwrite"] = "F";
        if (bLock && oLock.token)
            oHeaders["If"] = "<" + oLock.token + ">";
        this.doRequest(function(data, state, extra) {
            bLock && unregisterLock.call(this, sFrom);
            var iStatus = parseInt(extra.status);
            if (iStatus == 400 || iStatus == 403 || iStatus == 409 || iStatus == 412 
              || iStatus == 423 || iStatus == 424 || iStatus == 502
              || iStatus == 507) {
                var oError = WebDAVError.call(this, "Unable to copy file '" + sFrom
                             + "' to '" + sTo + "'. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false && !callback)
                    throw oError;
                callback && callback.call(this, data, state, extra);
            }
            else {
                // nodes needs to be added to the cache, callback passed through
                // to notify listener(s)
                this.getProperties(sTo, 0, callback);
            }
        }, sFrom, null, oHeaders);
    };

    /**
     * Moves a file or directory resource to any location on the same WebDAV
     * server.
     * 
     * @param {String}   sFrom        Path to the file on the WebDAV server to be moved
     * @param {String}   sTo          New location to move the resource to
     * @param {Boolean}  [bOverwrite] Tells whether to overwrite any existing resource
     * @param {Boolean}  [bLock]      Whether to require a lock before move
     * @param {Function} callback     Function to execute when the request was successful
     * @type  {void}
     */
    this.rename =
    this.move = function(sFrom, sTo, bOverwrite, bLock, callback) {
        if (!sTo || sFrom == sTo) 
            return (callback && callback("", apf.SUCCESS, {}));
        
        if (bLock) {
            var oLock = this.lock(sFrom);
            if (!oLock.token)
                return updateLockedStack.call(this, oLock, "move", arguments);
        }

        this.method  = "MOVE";
        var oHeaders = {
            "Destination": sTo || this.$server
        };
        if (typeof bOverwrite == "undefined")
            bOverwrite = true;
        if (!bOverwrite)
            oHeaders["Overwrite"] = "F";
        if (bLock && oLock.token)
            oHeaders["If"] = "<" + oLock.token + ">";
        this.doRequest(function(data, state, extra) {
            bLock && unregisterLock.call(this, sFrom);
            var iStatus = parseInt(extra.status);
            if (iStatus == 400 || iStatus == 403 || iStatus == 409 || iStatus == 412
              || iStatus == 423 || iStatus == 424 || iStatus == 501 || iStatus == 502 || iStatus == 500) {
                var oError = WebDAVError.call(this, "Unable to move file '" + sFrom
                             + "' to '" + sTo + "'. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false && !callback)
                    throw oError;
            }
            else { //success!!
                if (this.$fsCache[sFrom]) {
                    this.$fsCache[sTo] = this.$fsCache[sFrom];
                    this.$fsCache[sTo].path = sTo;
                    delete this.$fsCache[sFrom];
                }
            }
            callback && callback.call(this, data, state, extra);
        }, sFrom, null, oHeaders);
    };

    /**
     * Removes an existing directory or file resource from the WebDAV server.
     * 
     * @param {String}   sPath    Path to the resource to be removed from the WebDAV server
     * @param {Boolean}  [bLock]  Whether to require a lock before remove
     * @param {Function} callback Function to execute when the request was successful
     * @type  {void}
     */
    this.remove = function(sPath, bLock, callback) {
        if (bLock) {
            var oLock = this.lock(sPath);
            if (!oLock.token)
                return updateLockedStack.call(this, oLock, "remove", arguments);
        }

        this.method = "DELETE";
        this.doRequest(function(data, state, extra) {
            bLock && unregisterLock.call(this, sPath);
            var iStatus = parseInt(extra.status);
            if (iStatus == 400 || iStatus == 423 || iStatus == 424) { //Failed dependency (collections only)
                var oError = WebDAVError.call(this, "Unable to remove file '" + sPath
                             + "'. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false && !callback)
                    throw oError;
            }
            callback && callback.call(this, data, state, extra);
        }, sPath, null, bLock && oLock.token
            ? {"If": "<" + oLock.token + ">"}
            : null);
    };

    this.report = function(sPath, reportName, oProperties, callback) {
        var aCont = ['<?xml version="1.0" encoding="utf-8" ?>',
            '<D:' + reportName + ' xmlns:D="', apf.webdav.NS.D, '">'];
        if (oProperties) {
            for (var prop in oProperties) {
                aCont.push('<D:' + prop, (oProperties[prop]
                    ? '>' + apf.xmlentities(apf.escapeXML(oProperties[prop])) + '</D:' + prop + '>'
                    : '/>'));
            }
        }
        aCont.push('</D:', reportName, '>');

        this.method = "REPORT";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.status);
            if (state != apf.SUCCESS) {
                var oError = WebDAVError.call(this, "Unable to fetch report on '" + sPath
                             + "'. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false && !callback)
                    throw oError;
            }
            callback && callback.call(this, data, state, extra);
        }, sPath, aCont.join(""));
    };

    /**
     * Wrapper function that centrally manages locking of resources. Files and
     * directories (resources) can be locked prior to any modifying operation to
     * prevent the resource being modified by another user before the transaction
     * of this user has finished or even started.
     *
     * @see teleport.webdav.method.unlock
     * @param {String}   sPath      Path to the resource on the server to be locked
     * @param {Number}   [iDepth]   Depth of lock recursion down the tree, should be '1' or 'Infinity'
     * @param {Number}   [iTimeout] Lifetime of the lock, in seconds. Defaults to Infinite.
     * @param {String}   [sLock]    Previous lock token
     * @param {Function} [callback] Function that is executed upon a successful LOCK request
     * @type  {Object}
     */
    this.lock = function(sPath, iDepth, iTimeout, sLock, callback) {
        // first, check for existing lock
        var oLock = this.$locks[sPath];
        if (oLock && oLock.token) {
            //@todo renew the lock (if needed - check timeout)...
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
        var xml = '<?xml version="1.0" encoding="utf-8"?>'
                + '<D:lockinfo xmlns:D="' + apf.webdav.NS.D + '">'
                +     '<D:lockscope><D:exclusive /></D:lockscope>'
                +     '<D:locktype><D:write /></D:locktype>'
                +     '<D:owner><D:href>'
                +      document.location.toString().escapeHTML() +
                +     '</D:href></D:owner>'
                + '</D:lockinfo>';
        this.doRequest(registerLock, sPath, xml, oHeaders, true, null, callback);
        return newLock.call(this, sPath);
    };

    /**
     * Wrapper function that centrally manages the unlocking of resources that
     * have been locked earlier on.
     *
     * @see teleport.webdav.method.lock
     * @param {Object}   oLock    Object representing a Lock on a resource
     * @param {Function} callback Function that is executed upon a successful UNLOCK request
     * @type  {void}
     */
    this.unlock = function(oLock, callback) {
        if (typeof oLock == "string")
            oLock = this.$locks[oLock];
        if (!oLock || !oLock.token) return;

        this.method = "UNLOCK";
        this.doRequest(function(data, state, extra) {
            unregisterLock.call(this, extra.url.replace(this.$server, ''));
        }, oLock.path, null, {
            "Lock-Token": "<" + oLock.token + ">"
        }, true, callback);
    };

    /*
     * Add a new lock token/ object to the stack
     * 
     * @path {String} sPath Path pointing to the resource on the server
     * @type {Object}
     * @private
     */
    function newLock(sPath) {
        return this.$locks[sPath] = {
            path : sPath,
            id   : this.$lockId++,
            token: null
        };
    }

    /*
     * Handler function that registers a lock globally when a LOCK request was
     * successful. It parses all the info it received from the server response
     * and caches that info for reuse.
     * 
     * @param {XmlDocument} data  Actual XML data, received from the server
     * @param {Number}      state Internal - APF defined - state of the request
     * @param {Object}      extra Simple object that contains additional request data
     * @type  {void}
     * @private
     */
    function registerLock(data, state, extra) {
        var iStatus = parseInt(extra.status),
            sPath   = extra.url.replace(this.$server, ''),
            oLock   = this.$locks[sPath] || newLock.call(this, sPath);
        if (iStatus == 400 || iStatus == 409 || iStatus == 423 || iStatus == 412) {
            // lock failed, so unregister it immediately
            unregisterLock.call(this, extra.url.replace(this.$server, ''));
            var oError = WebDAVError.call(this, "Unable to apply lock to '" + sPath
                         + "'. Server says: "
                         + apf.webdav.STATUS_CODES[String(iStatus)]);
            if (this.dispatchEvent("error", {
                error   : oError,
                bubbles : true
              }) === false)
                throw oError;
        }
        
        var NS     = apf.webdav.NS,
            oOwner = $xmlns(data, "owner",     NS.ns0)[0],
            oToken = $xmlns(data, "locktoken", NS.D)[0];
        oLock.path    = sPath;
        oLock.type    = "write";
        oLock.scope   = $xmlns(data,   "exclusive", NS.D).length ? "exclusive" : "shared";
        oLock.depth   = $xmlns(data,   "depth",     NS.D)[0].firstChild.nodeValue;
        oLock.owner   = $xmlns(oOwner, "href",      NS.ns0)[0].firstChild.nodeValue;
        oLock.timeout = $xmlns(data,   "timeout",   NS.D)[0].firstChild.nodeValue;
        oLock.token   = $xmlns(oToken, "href",      NS.D)[0].firstChild.nodeValue.split(":")[1];

        purgeLockedStack.call(this, oLock);
    }

    /*
     * Removes a Lock token/ object from the stack.
     * 
     * @param {String} sPath Path pointing to the resource on the server
     * @type  {void}
     * @private
     */
    function unregisterLock(sPath) {
        var oLock = this.$locks[sPath];
        if (!oLock) return;
        purgeLockedStack.call(this, oLock, true);
        this.$locks[sPath] = oLock = null;
        delete this.$locks[sPath];
    }

    /*
     * Update the stack of lock requests (NOT the stack of valid locks!) with a
     * new Lock, or an updated one (lifetime may have changed)
     * 
     * @param {Object} oLock Object that contains specific info about the Lock
     * @param {String} sFunc Name of the function that requested the lock
     * @param {Array}  aArgs List of arguments that should get passed to that function when the lock is available
     * @type  {Object}
     * @private
     */
    function updateLockedStack(oLock, sFunc, aArgs) {
        return this.$lockedStack.push({
            lockId: oLock.id,
            func  : sFunc,
            args  : aArgs
        });
    }

    /*
     * Purge the stack of lock requests, called when a lock request returned a
     * result. If bFailed is set to TRUE, the function that requested the lock
     * will be executed.
     *
     * @param {Object}  oLock   Simple object that represents a validated Lock
     * @param {Boolean} bFailed Tells whether the requesting function may be excuted
     * @type  {void}
     * @private
     */
    function purgeLockedStack(oLock, bFailed) {
        for (var i = this.$lockedStack.length - 1; i >= 0; i--) {
            if (this.$lockedStack[i].lockId != oLock.id) continue;
            if (!bFailed)
                this[this.$lockedStack[i].func].apply(this, this.$lockedStack[i].args);
            this.$lockedStack.remove(i);
        }
    }

    /**
     * Request the server to list the properties of a specific resource and,
     * possibly, its children.
     *
     * @param {String}   sPath    Path pointing to the resource on the server
     * @param {Number}   iDepth   Depth of lock recursion down the tree, should be '1' or 'Infinity'
     * @param {Function} callback Function that is executed upon a successful LOCK request
     * @param {Object}   oHeaders Additional headers in key: value format
     * @type  {void}
     */
    this.getProperties = function(sPath, iDepth, callback, oHeaders) {
        // Note: caching is being done by an external model
        this.method = "PROPFIND";
        // XXX maybe we want to change this to allow getting selected props
        var xml = '<?xml version="1.0" encoding="utf-8" ?>'
                + '<D:propfind xmlns:D="' + apf.webdav.NS.D + '">'
                +       '<D:allprop />'
                + '</D:propfind>';
        oHeaders = oHeaders || {};
        oHeaders["Depth"] = typeof iDepth != "undefined" ? iDepth : 1
        this.doRequest(parsePropertyPackets, sPath, xml, oHeaders, true, null, callback);
    };

    /**
     * Request the server to change and set properties of a specific resource
     * with different values.
     * @todo Untested functionality
     * 
     * @param {String} sPath     Path pointing to the resource on the server
     * @param {Object} oPropsSet A mapping from namespace to a mapping of key/value pairs (where value is an *entitized* XML string)
     * @param {Object} oPropsDel A mapping from namespace to a list of names
     * @param {String} sLock     Lock identifier
     * @private
     */
    this.setProperties = function(sPath, oPropsSet, oPropsDel, sLock) {
        this.method = "PROPPATCH";
        
        this.doRequest(function(data, state, extra) {
            // #ifdef __DEBUG
            apf.console.dir(data);
            // #endif
        }, sPath, buildPropertiesBlock.call(this, oPropsSet, oPropsDel),
           sLock ? {"If": "<" + sLock + ">"} : null, true);
    };

    /*
     * create the XML for a PROPPATCH request.
     * 
     * @param {Object} oPropsSet A mapping from namespace to a mapping of key/value pairs (where value is an *entitized* XML string)
     * @param {Object} oPropsDel A mapping from namespace to a list of names
     * @type  {String}
     * @private
     */
    function buildPropertiesBlock(oPropsSet, oPropsDel) {
        var aOut = ['<?xml version="1.0" encoding="utf-8" ?>',
            '<D:propertyupdate xmlns:D="', apf.webdav.NS.D, '">'];

        var bHasProps = false, ns, i, j;
        for (ns in oPropsSet) {
            bHasProps = true;
            break;
        }
        if (bHasProps) {
            aOut.push('<D:set>');
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

    /*
     * Handler function that parses the response of a successful PROPFIND 
     * request. It parses all the info it received from the server response
     * and caches that info for reuse.
     *
     * @param {XmlDocument} data     Actual XML data, received from the server
     * @param {Number}      state    Internal - APF defined - state of the request
     * @param {Object}      extra    Simple object that contains additional request data
     * @param {Function}    callback Function to be executed when all the property packets have been parsed
     * @type  {void}
     * @private
     */
    function parsePropertyPackets(oXml, state, extra, callback) {
        var status = parseInt(extra.status)
        if (status == 403 || status == 401 || !oXml)
            return callback ? callback.call(this, null, state, extra) : notAuth.call(this);

        if (typeof oXml == "string")
            oXml = apf.getXml(oXml);
        
        var aResp = $xmlns(oXml, "response", apf.webdav.NS.D),
            aOut = [];
        if (aResp.length) //we got a valid result set, so assume that any possible AUTH has succeeded
            this.$regVar("authenticated", true);
            
        var sPath;
        for (var sa = [], data, i = 0, j = aResp.length; i < j; i++) {
            // Exclude requesting URL if it matches node's HREF (same node)
            sPath = decodeURIComponent($xmlns(aResp[i], "href", apf.webdav.NS.D)[0].firstChild.nodeValue);
            if (sPath === extra.url)
                continue;
                
            parseItem.call(this, aResp[i], data = {});
            if (data.data) 
                sa.push({
                    toString: function(){
                        return this.v;
                    },
                    data : data.data,
                    v    : (data.data.type == "file" ? 1 : 0) + "" + data.data.name.toLowerCase()
                });
        }
        
        sa.sort();
        
        for (var i = 0, l = sa.length; i < l; i++) {
            aOut.push(sa[i].data.xml);
        }
        
//        var start = (extra.headers && typeof extra.headers.Depth != "undefined" && extra.headers.Depth == 0) ? 0 : 1;
//        for (var i = start, j = aResp.length; i < j; i++)
//            aOut.push(parseItem.call(this, aResp[i]));

        callback && callback.call(this, "<files>" + aOut.join("") + "</files>", state, extra);
    }

    /*
     * Turn an XML WebDAV node that represents a resource and turn it into a 
     * reusable JS object, cache it so that it can be reused later.
     * 
     * @param {XmlNode} oNode
     * @type  {String}
     * @private
     */
    function parseItem(oNode, extra) {
        var NS      = apf.webdav.NS,
            sPath   = decodeURIComponent($xmlns(oNode, "href", NS.D)[0].firstChild
                      .nodeValue.replace(/[\\\/]+$/, "")),
            sName   = sPath.split("/").pop(),
            bHidden = (sName.charAt(0) == ".");

        if (!this.$showHidden && bHidden)
            return "";

        var t, oItem,
            sType  = $xmlns(oNode, "collection", NS.D).length > 0 ? "folder" : "file",
            aCType = $xmlns(oNode, "getcontenttype", NS.D),
            aExec  = $xmlns(oNode, "executable", NS.lp2);
        oItem = this.$fsCache[sPath] = apf.extend(this.$fsCache[sPath] || {}, {
            path        : sPath,
            type        : sType,
            size        : parseInt(sType == "file"
                ? (t = $xmlns(oNode, "getcontentlength", NS.lp1)).length ? t[0].firstChild.nodeValue : 0
                : 0),
            name        : sName,
            contentType : (sType == "file" && aCType.length
                ? aCType[0].firstChild.nodeValue
                : ""),
            creationDate: (t = $xmlns(oNode, "creationdate", NS.lp1)).length ? t[0].firstChild.nodeValue : "",
            lastModified: (t = $xmlns(oNode, "getlastmodified", NS.lp1)).length ? t[0].firstChild.nodeValue : "",
            etag        : (t = $xmlns(oNode, "getetag", NS.lp1)).length ? t[0].firstChild.nodeValue : "",
            lockable    : ($xmlns(oNode, "locktype", NS.D).length > 0),
            executable  : (aExec.length > 0 && aExec[0].firstChild.nodeValue == "T")
        });
        
        if (extra)
            extra.data = oItem;
        
        return oItem.xml = "<" + sType + " path='" + sPath + "'  type='" + sType
            + "' size='" + oItem.size + "' name='" + oItem.name + "' contenttype='"
            + oItem.contentType + "' modifieddate='" + oItem.lastModified + "' creationdate='" + oItem.creationDate
            + "' lockable='" + oItem.lockable.toString() + "' hidden='"
            + bHidden.toString() + "' executable='" + oItem.executable.toString()
            + "'/>";
    }

    // #ifdef __WITH_DATA

    /**
     * Instruction handler for WebDav protocols.
     */
    this.exec = function(method, args, callback){
        var cb = function(data, state, extra) {
            extra.originalArgs = args
            if (typeof args[args.length - 1] == "function")
                args[args.length - 1](data, state, extra);
            callback && callback(data, state, extra);
        };
        // RULE for case aliases: first, topmost match is the preferred term for any
        //                        action and should be used in demos/ examples in
        //                        favor of other aliases.
        switch (method) {
            case "login":
            case "authenticate":
                this.authenticate(args[0], args[1], cb);
                break;
            case "logout":
                this.reset();
                break;
            case "exists":
                this.exists(args[0], cb);
                break;
            case "read":
                this.readFile(args[0], cb);
                break;
            case "create":
                var path = args[0] ? args[0] : "";
                if (path.charAt(path.length - 1) != "/")
                    path = path + "/";
                this.writeFile(path + args[1], args[2], args[3] || false, cb);
                break;
            case "write":
            case "store":
            case "save":
                this.writeFile(args[0], args[1], args[2] || false, cb);
                break;
            case "copy":
            case "cp":
                this.copy(args[0], args[1], args[2] || true, args[3] || false, cb);
                break;
            case "rename":
                var sBasepath = args[1].substr(0, args[1].lastIndexOf("/") + 1);
                this.rename(args[1], sBasepath + args[0], args[2] || false, args[3] || false, cb);
                break;
            case "move":
            case "mv":
                path = args[1];
                if (path.charAt(path.length - 1) != "/")
                    path = path + "/";
                this.rename(args[0], path + args[0].substr(args[0].lastIndexOf("/") + 1),
                    args[2] || false, args[3] || false, cb);
                break;
            case "remove":
            case "rmdir":
            case "rm":
                this.remove(args[0], args[1] || false, cb);
                break;
            case "readdir":
            case "scandir":
                this.readdir(args[0], cb);
                break;
            case "getroot":
                this.getProperties(this.$rootPath, 0, cb);
                break;
            case "mkdir":
                path = args[0] ? args[0] : "";
                if (path.charAt(path.length - 1) != "/")
                    path = path + "/";
                this.mkdir(path + args[1], args[2] || false, cb)
                break;
            case "lock":
                this.lock(args[0], null, null, null, cb);
                break;
            case "unlock":
                this.unlock(args[0], cb);
                break;
            case "report":
                this.report(args[0], args[1], args[2], cb);
                break;
            default:
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, null, "Saving/Loading data",
                    "Invalid WebDAV method '" + method + "'"));
                //#endif
                break;
        }
    };
    
    // #endif
}).call(apf.webdav.prototype = new apf.Teleport());

apf.aml.setElement("webdav", apf.webdav);

// Collection of shorthands for all namespaces known and used by this class
apf.webdav.NS = {
    D    : "DAV:",
    ns0  : "DAV:",
    lp1  : "DAV:",
    lp2  : "http://apache.org/dav/props/"
};

apf.webdav.STATUS_CODES = {
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

// #endif
