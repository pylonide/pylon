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
// #define __AMLTELEPORT 1

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
 *  <a:webdav id="myWebDAV"
 *    url   = "http://my-webdav-server.com/dav_files/" />
 *     
 *  <a:script>
 *      // write the text 'bar' to a file on the server called 'foo.txt'
 *      myWebDAV.write('http://my-webdav-server.com/dav_files/foo.txt', 'bar');
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
 *  get="{myWebdav.read([@id])}"
 *  get="{myWebdav.create([@id], 'New File.txt', '')}"
 *  set="{myWebdav.write([@id], [@data])}"
 *  set="{myWebdav.store(...alias for write...)}"
 *  set="{myWebdav.save(...alias for write...)}"
 *  set="{myWebdav.copy([@id], [../@id])}"
 *  set="{myWebdav.cp(...alias for copy...)}"
 *  set="{myWebdav.rename([@name], [@id])}"
 *  set="{myWebdav.move([@id], [../@id])}"
 *  set="{myWebdav.mv(...alias for move...)}"
 *  set="{myWebdav.remove([@id])}"
 *  set="{myWebdav.rmdir(...alias for remove...)}"
 *  set="{myWebdav.rm(...alias for remove...)}"
 *  get="{myWebdav.readdir([@id])}"
 *  get="{myWebdav.scandir(...alias for readdir...)}"
 *  load="{myWebdav.getroot()}"
 *  set="{myWebdav.lock([@id])}"
 *  set="{myWebdav.unlock([@id])}"
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
    this.$fsCache     = [];
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
     * @param {Function}  [fCallback2] Optional second callback, passed to fCallback as arguments. Used mainly by the data instructions
     * @type  {void}
     */
    this.doRequest = function(fCallback, sPath, sBody, oHeaders, bUseXml, fCallback2) {
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
        return this.get(this.$server + sPath || "", {
            callback: function(data, state, extra) {
                if (state != apf.SUCCESS) {
                    var oError;

                    oError = WebDAVError.call(this, "Url: " + extra.url + "\nInfo: " + extra.message);

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
                            ? apf.xmlParseError(extra.http.responseXML)
                            : apf.getXmlDom(extra.http.responseText);

                        if (!apf.supportNamespaces)
                            data.setProperty("SelectionLanguage", "XPath");

                        extra.data = data.documentElement;
                    }
                    catch(e) {
                        throw WebDAVError.call(this, "Received invalid XML\n\n" + e.message);
                    }
                }

                if (typeof fCallback == "function")
                    fCallback.call(_self, data, state, extra, fCallback2);
            },
            nocache       : false,
            useXML        : false,//true,
            ignoreOffline : true,
            data          : sBody || "",
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
        apf.console.error(extra.message + ' (username: ' + extra.username
                          + ', server: ' + extra.server + ')', 'webdav');
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
                oDoc.load(this.$server + this.$rootPath);
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
            if (extra.http.status == 401)
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
     * Read the content of a file as plaintext and pass the data to a callback
     * function
     * 
     * @param {String}   sPath    Path to the file on the WebDAV server
     * @param {Function} callback Function to execute when the request was successful
     * @type  {void}
     */
    this.read = function(sPath, callback) {
        this.method = "GET";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 403) { //Forbidden
                var oError = WebDAVError.call(this, "Unable to read file. Server says: "
                             + apf.webdav.STATUS_CODES["403"]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
            else {
                callback
                    ? callback.call(this, data, state, extra)
                    : this.dispatchEvent('onfilecontents', {data: data});
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
    this.readDir = function(sPath, callback) {
        if (sPath.charAt(sPath.length - 1) != "/")
            sPath += "/";
        return this.getProperties(sPath, 1, callback);
    };

    /**
     * Creates a new directory resource on the WebDAV server.
     * 
     * @param {String}   sPath    Path of the new directory on the WebDAV server
     * @param {Function} callback Function to execute when the request was successful
     * @type  {void}
     */
    this.mkdir = function(sPath, callback) {
        var oLock = this.lock(sPath);
        if (!oLock.token)
            return updateLockedStack.call(this, oLock, "mkdir", arguments);

        this.method = "MKCOL";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 201) { //Created
                // TODO: refresh parent node...
            }
            else if (iStatus == 403 || iStatus == 405 || iStatus == 409
              || iStatus == 415 || iStatus == 507) {
                var oError = WebDAVError.call(this, "Unable to create directory '" + sPath
                             + "'. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
            this.unlock(oLock);
        }, sPath, null, oLock.token
            ? { "If": "<" + oLock.token + ">" }
            : null, true, callback);
    };

    /**
     * Reads the properties of a resource on the server.
     * see {@link teleport.webdav.method.getProperties}
     *
     * @param {String}   sPath    Path to the resource on the WebDAV server
     * @type  {void}
     */
    this.list = function(sPath) {
        return this.getProperties(sPath, 0);
    };

    /**
     * Write new contents (plaintext) to a file resource on the server, with or
     * without an existing lock on the resource.
     * 
     * @param {String}   sPath    Path to the file on the WebDAV server
     * @param {String}   sContent New content-body of the file
     * @param {String}   [sLock]  Lock token that MAY be omitted in preference of a lock refresh
     * @param {Function} callback Function to execute when the request was successful
     * @type  {void}
     */
    this.write = function(sPath, sContent, sLock, callback) {
        var oLock = this.lock(sPath);
        if (!oLock.token)
            return updateLockedStack.call(this, oLock, "write", arguments);

        this.method = "PUT";
        this.doRequest(function(data, state, extra) {
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 409 || iStatus == 405) { //Conflict || Not Allowed
                var oError = WebDAVError.call(this, "Unable to write to file. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
                callback.call(this, data, apf.ERROR, extra);
            }
            else {
                this.getProperties(sPath, 0, callback);
            }
        }, sPath, sContent, sLock
            ? {"If": "<" + sLock + ">"}
            : null);
    };

    /**
     * Copies a file or directory resource to any location on the same WebDAV
     * server.
     * 
     * @param {String}   sFrom      Path to the file on the WebDAV server to be copied
     * @param {String}   sTo        New location to place the copy at
     * @param {Boolean}  bOverwrite Tells whether to overwrite any existing resource
     * @param {Function} callback   Function to execute when the request was successful
     * @type  {void}
     */
    this.copy = function(sFrom, sTo, bOverwrite, callback) {
        if (!sTo || sFrom == sTo) return;
        
        var oLock = this.lock(sFrom);
        if (!oLock.token)
            return updateLockedStack.call(this, oLock, "copy", arguments);

        this.method  = "COPY";
        var oHeaders = {
            "Destination": this.$server + sTo
        };
        if (typeof bOverwrite == "undefined")
            bOverwrite = true;
        if (!bOverwrite)
            oHeaders["Overwrite"] = "F";
        if (oLock.token)
            oHeaders["If"] = "<" + oLock.token + ">";
        this.doRequest(function(data, state, extra) {
            unregisterLock.call(this, sFrom);
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 403 || iStatus == 409 || iStatus == 412 
              || iStatus == 423 || iStatus == 424 || iStatus == 502
              || iStatus == 507) {
                var oError = WebDAVError.call(this, "Unable to copy file '" + sFrom
                             + "' to '" + sTo + "'. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
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
     * @param {String}   sFrom      Path to the file on the WebDAV server to be moved
     * @param {String}   sTo        New location to move the resource to
     * @param {Boolean}  bOverwrite Tells whether to overwrite any existing resource
     * @param {Function} callback   Function to execute when the request was successful
     * @type  {void}
     */
    this.move = function(sFrom, sTo, bOverwrite, callback) {
        if (!sTo || sFrom == sTo) return;
        
        var oLock = this.lock(sFrom);
        if (!oLock.token)
            return updateLockedStack.call(this, oLock, "move", arguments);

        this.method  = "MOVE";
        var oHeaders = {
            "Destination": this.$server + sTo
        };
        if (typeof bOverwrite == "undefined")
            bOverwrite = true;
        if (!bOverwrite)
            oHeaders["Overwrite"] = "F";
        if (oLock.token)
            oHeaders["If"] = "<" + oLock.token + ">";
        this.doRequest(function(data, state, extra) {
            unregisterLock.call(this, sFrom);
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 403 || iStatus == 409 || iStatus == 412
              || iStatus == 423 || iStatus == 424 || iStatus == 502) {
                var oError = WebDAVError.call(this, "Unable to move file '" + sFrom
                             + "' to '" + sTo + "'. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
            else { //success!!
                getItemByPath.call(this, sFrom).path = sTo;
            }
            callback.call(this, data, state, extra);
        }, sFrom, null, oHeaders);
    };

    /**
     * Removes an existing directory or file resource from the WebDAV server.
     * 
     * @param {String}   sPath    Path to the resource to be removed from the WebDAV server
     * @param {Function} callback Function to execute when the request was successful
     * @type  {void}
     */
    this.remove = function(sPath, callback) {
        var oLock = this.lock(sPath);
        if (!oLock.token)
            return updateLockedStack.call(this, oLock, "remove", arguments);

        this.method = "DELETE";
        this.doRequest(function(data, state, extra) {
            unregisterLock.call(this, sPath);
            var iStatus = parseInt(extra.http.status);
            if (iStatus == 423 || iStatus == 424) { //Failed dependency (collections only)
                var oError = WebDAVError.call(this, "Unable to remove file '" + sPath
                             + "'. Server says: "
                             + apf.webdav.STATUS_CODES[String(iStatus)]);
                if (this.dispatchEvent("error", {
                    error   : oError,
                    bubbles : true
                  }) === false)
                    throw oError;
            }
            callback.call(this, data, state, extra);
        }, sPath, null, oLock.token 
            ? { "If": "<" + oLock.token + ">" }
            : null);
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
        this.doRequest(registerLock, sPath, xml, oHeaders, true, callback);
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
        return $this.locks[sPath] = {
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
     * @param {Number}      state Internal - JPF defined - state of the request
     * @param {Object}      extra Simple object that contains additional request data
     * @type  {void}
     * @private
     */
    function registerLock(data, state, extra) {
        var iStatus = parseInt(extra.http.status),
            sPath   = extra.url.replace(this.$server, ''),
            oLock   = this.$locks[sPath] || newLock.call(this, sPath);
        if (iStatus == 409 || iStatus == 423 || iStatus == 412) {
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
        this.doRequest(parsePropertyPackets, sPath, xml, oHeaders, true, callback);
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
     * @param {Number}      state    Internal - JPF defined - state of the request
     * @param {Object}      extra    Simple object that contains additional request data
     * @param {Function}    callback Function to be executed when all the property packets have been parsed
     * @type  {void}
     * @private
     */
    function parsePropertyPackets(oXml, state, extra, callback) {
        if (parseInt(extra.http.status) == 403) {
            // TODO: dispatch onerror event
            return;
        }

        var aResp = $xmlns(oXml, "response", apf.webdav.NS.D),
            aOut = [];
        if (aResp.length) //we got a valid result set, so assume that any possible AUTH has succeeded
            this.$regVar("authenticated", true);
        for (var i = aResp.length > 1 ? 1 : 0, j = aResp.length; i < j; i++)
            aOut.push(parseItem.call(this, aResp[i]));

        if (callback)
            callback.call(this, "<files>" + aOut.join("") + "</files>", state, extra);
    }

    /*
     * Turn an XML WebDAV node that represents a resource and turn it into a 
     * reusable JS object, cache it so that it can be reused later.
     * 
     * @param {XmlNode} oNode
     * @type  {String}
     * @private
     */
    function parseItem(oNode) {
        var NS      = apf.webdav.NS,
            sPath   = $xmlns(oNode, "href", NS.D)[0].firstChild
                      .nodeValue.replace(/[\\\/]+$/, ""),
            sName   = decodeURIComponent(sPath.split("/").pop()),
            bHidden = (sName.charAt(0) == ".");

        if (!this.$showHidden && bHidden)
            return "";
        
        var iId, oItem = getItemByPath.call(this, sPath);
        if (oItem && typeof oItem.id == "number")
            iId = oItem.id;
        else
            iId = this.$fsCache.length;

        var sType  = $xmlns(oNode, "collection", NS.D).length > 0 ? "folder" : "file",
            aCType = $xmlns(oNode, "getcontenttype", NS.D),
            aExec  = $xmlns(oNode, "executable", NS.lp2);
        oItem = this.$fsCache[iId] = {
            id          : iId,
            path        : sPath,
            type        : sType,
            size        : parseInt(sType == "file"
                ? $xmlns(oNode, "getcontentlength", NS.lp1)[0].firstChild.nodeValue
                : 0),
            name        : sName,
            contentType : (sType == "file" && aCType.length
                ? aCType[0].firstChild.nodeValue
                : ""),
            creationDate: $xmlns(oNode, "creationdate", NS.lp1)[0].firstChild.nodeValue,
            lastModified: $xmlns(oNode, "getlastmodified", NS.lp1)[0].firstChild.nodeValue,
            etag        : $xmlns(oNode, "getetag", NS.lp1)[0].firstChild.nodeValue,
            lockable    : ($xmlns(oNode, "locktype", NS.D).length > 0),
            executable  : (aExec.length > 0 && aExec[0].firstChild.nodeValue == "T")
        };
        
        return oItem.xml = "<" + sType + " id='" + iId + "'  type='" + sType
            + "' size='" + oItem.size + "' name='" + oItem.name + "' contenttype='"
            + oItem.contentType + "' creationdate='" + oItem.creationDate
            + "' lockable='" + oItem.lockable.toString() + "' hidden='"
            + bHidden.toString() + "' executable='" + oItem.executable.toString()
            + "'/>";
    }

    /*
     * Retrieve a file or directory resource from cache by searching for a 
     * matching path name.
     * 
     * @param {String} sPath Path pointing to a resource on the server
     * @type  {Object}
     * @private
     */
    function getItemByPath(sPath) {
        for (var i = 0, j = this.$fsCache.length; i < j; i++) {
            if (this.$fsCache[i].path == sPath)
                return this.$fsCache[i];
        }
        return null;
    }

    /**
     * Retrieve a file or directory resource from cache by searching for a 
     * matching resource identifier.
     * 
     * @param {Number} iId WebDAV resource identifier pointing to a resource on the server
     * @type  {Object}
     * @private
     */
    this.getItemById = function(iId) {
        if (typeof iId == "string")
            iId = parseInt(iId);
        return this.$fsCache[iId] || null;
    };

    // #ifdef __WITH_DATA

    /**
     * Instruction handler for WebDav protocols.
     */
    this.exec = function(method, args, callback){
        var oItem = this.getItemById(args[0]);
        // RULE for case aliases: first, topmost match is the preferred term for any
        //                        action and should be used in demos/ examples in
        //                        favor of other aliases.
        switch (method) {
            case "login":
            case "authenticate":
                this.authenticate(args[0], args[1], callback);
                break;
            case "logout":
                this.reset();
                break;
            case "read":
                this.read(oItem.path, callback);
                break;
            case "create":
                this.write(oItem.path + "/" + args[1], args[2], null, callback);
                break;
            case "write":
            case "store":
            case "save":
                this.write(oItem.path, args[1], null, callback);
                break;
            case "copy":
            case "cp":
                var oItem2 = this.getItemById(args[1]);
                this.copy(oItem.path, oItem2.path, args[2], callback);
                break;
            case "rename":
                oItem = this.getItemById(args[1]);
                if (!oItem) break;
    
                var sBasepath = oItem.path.replace(oItem.name, '');
                //TODO: implement 'Overwrite' setting...
                this.move(oItem.path, sBasepath + args[0], false, callback);
                break;
            case "move":
            case "mv":
                //TODO: implement 'Overwrite' setting...
                this.move(oItem.path, this.getItemById(args[1]).path + "/"
                    + oItem.name, false, callback);
                break;
            case "remove":
            case "rmdir":
            case "rm":
                this.remove(oItem.path, callback);
                break;
            case "scandir":
            case "readdir":
                this.readDir(oItem.path, callback);
                break;
            case "getroot":
                this.getProperties(this.$rootPath, 0, callback);
                break;
            case "mkdir":
                break;
            case "lock":
                this.lock(oItem.path, null, null, null, callback);
                break;
            case "unlock":
                this.unlock(oItem.path, callback);
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
