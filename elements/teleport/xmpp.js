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

// #ifdef __TP_XMPP
// #define __WITH_TELEPORT 1

/**
 * Element implementing XMPP IM protocol.
 * Depends on implementation of XMPP server supporting bosh or http-poll,
 * because apf.xmpp creates connections through the HTTP protocol via {@link teleport.http}.
 * Example:
 * XMPP connector with new message notification
 * <code>
 *  <a:teleport>
 *      <a:xmpp id="myXMPP"
 *        url           = "http://my-jabber-server.com:5280/http-bind"
 *        model         = "mdlRoster"
 *        connection    = "bosh"
 *        onreceivechat = "messageReceived(arguments[0].from)" />
 *  </a:teleport>
 *
 *  <a:script>
 *      // This function is called when a message has arrived
 *      function messageReceived(from){
 *          alert('Received message from ' + from);
 *      }
 *
 *      // Send a message to John
 *      myXMPP.sendMessage('john@my-jabber-server.com', 'A test message', '',
 *          apf.xmpp.MSG_CHAT);
 *  </a:script>
 * </code>
 * Remarks:
 * Calls can be made to a server using a special {@link term.datainstruction data instruction}
 * format.
 * <code>
 *  submission="xmpp:notify({@bar}, 'john@my-jabber-server.com')"
 *  submission="xmpp:login({@foo}, {@bar})"
 *  submission="xmpp:logout()"
 * </code>
 *
 * @event authfailure Fires when the authentication process failed or halted.
 *   bubbles: yes
 *   cancellable: Prevents an authentication failure to be thrown
 *   object:
 *     {String}        username   the username used for the login attempt
 *     {String}        server     the server address (URI) of the XMPP server
 *     {String}        message    a more detailed explanation of the error
 * @event connectionerror Fires when the connection with the XMPP server dropped.
 *   bubbles: yes
 *   cancellable: Prevents an connection error to be thrown
 *   object:
 *     {String}        username   the username used for the last-active session
 *     {String}        server     the server address (URI) of the XMPP server
 *     {String}        message    a more detailed explanation of the error
 * @event connected Fires when a login attempt has succeeded, and a session has been setup.
 *   bubbles: yes
 *   object:
 *     {String}        username   the username used for the last-active session
 * @event receivechat Fires when the user received a chat message from a contact.
 *   bubbles: yes
 *   object:
 *     {String}        from       the username of the contact that sent the message
 *     {String}        message    the body of the chat message
 * @event datachange Fires when a data-change message is received from one of the contacts.
 *   bubbles: yes
 *   object:
 *     {String}        data       the data-instruction of the changed data that the RSB implementation can grok
 *
 * @define xmpp
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

apf.xmpp = function(){
    this.server  = null;
    this.timeout = 10000;
    this.useHTTP = true;
    this.method  = "POST";

    this.oModel         = null;
    this.modelContent   = null;
    this.TelePortModule = true;
    this.$isPoll         = false;

    if (!this.uniqueId) {
        apf.makeClass(this);

        this.implement(apf.BaseComm, apf.http);
    }

    /**
     * Append any string with an underscore '_' followed by a five character
     * long random number sequence.
     *
     * @param     {String} s
     * @type      {String}
     * @exception {Error}  A general Error object
     * @private
     */
    function makeUnique(s) {
        if (typeof s != "string")
            throw new Error("Dependencies not met, please provide a string");

        return (s + "_").appendRandomNumber(5);
    }

    var _self      = this,
        serverVars = {},
        bListening = false,
        tListener  = null,
        sAJAX_ID   = makeUnique("ajaxRSB"),
        retryCount = 0;

    /**
     * Constructs a <body> tag that will be used according to XEP-0206, and
     * the more official RFCs.
     *
     * @param {Object} options
     * @param {String} content
     * @type  {String}
     * @private
     */
    function createBodyElement(options, content) {
        var i, aOut = ["<body "];

        for (i in options) {
            if (options[i] == null) continue;
            aOut.push(i, "='", options[i], "' ");
        }

        aOut.push(">", content || "", "</body>");

        return aOut.join("");
    }

    /**
     * Constructs a <stream> tag that will be used when polling is active instead
     * of the regular BOSH implementation.
     *
     * @param {String} prepend
     * @param {Object} options
     * @param {String} content
     * @type  {String}
     * @private
     */
    function createStreamElement(options, content) {
        if (!options)
            options = {};
        var aOut = [getVar("SID") || "0", ","];

        if (options.doOpen) {
            aOut.push("<stream:stream");
            for (var i in options) {
                if (i == "doOpen" || i == "doClose" || options[i] == null)
                    continue;
                aOut.push(" ", i, "='", options[i], "'");
            }
            aOut.push(">");
        }

        aOut.push(content || "");

        if (options.doClose)
            aOut.push("</stream:stream>");

        return aOut.join("");
    }

    /**
     * A cnonce parameter is used by the SASL implementation to do some
     * additional client-server key exchange. You can say that this is the
     * part of the handshake that is powered by the client (i.e. 'us').
     *
     * @param {Number} size Length of the cnonce
     * @type  {String}
     * @private
     */
    function generateCnonce(size) {
        var sTab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", //length: 62
            i, sCnonce = "";
        for (i = 0; i < size; i++)
            sCnonce += sTab.charAt(apf.randomGenerator.generate(0, 61));
        return sCnonce;
    }

    /**
     * Create a <response> tag completely according to the SASL rules as
     * described in RFC 2617.
     *
     * @param {Object} parts
     * @type  {String}
     * @private
     */
    function createAuthBlock(parts) {
        var i, aOut = [];

        for (i in parts) {
            if (parts[i] == null) continue;
            aOut.push(i, '="', parts[i], '",');
        }
        var sOut = aOut.join("").replace(/,$/, "");

        return "<response xmlns='" + apf.xmpp.NS.sasl + "'>"
            + apf.crypto.Base64.encode(sOut) + "</response>";
    }

    /**
     * Create an <iq> message node which is part of the XMPP standard base
     * specification and may contain session data, bind/ stream information
     * and presence.
     *
     * @param {Object} parts
     * @param {String} content
     * @type  {String}
     * @private
     */
    function createIqBlock(parts, content) {
        var i, aOut = ["<iq "];

        for (i in parts) {
            if (parts[i] == null) continue;
            aOut.push(i, "='", parts[i], "' ");
        }

        aOut.push(">", content || "", "</iq>");

        return aOut.join("");
    }

    /**
     * Create a <presence> message which is part of the XMPP standard base
     * specification and is used to transfer presence information (state of a
     * user) across the roster.
     *
     * @param {Object} options
     * @type  {String}
     * @private
     */
    function createPresenceBlock(options, content) {
        var aOut = ["<presence xmlns='", apf.xmpp.NS.jabber, "'"];
        if (options.type)
            aOut.push(" type='", options.type, "'");
        if (options.to)
            aOut.push(" to='", options.to, "'");
        if (options.from)
            aOut.push(" from='", options.from, "'");
        aOut.push(">");

        // show An XMPP complient status indicator. See the class constants
        // apf.xmpp.STATUS_* for options
        if (options.status)
            aOut.push("<show>", options.status, "</show>");

        // Usually this is set to some human readable string indicating what the
        // user is doing/ feels like currently.
        if (options.custom)
            aOut.push("<status>", options.custom, "</status>");

        aOut.push(content || "");

        aOut.push("</presence>");
        return aOut.join("");
    }

    /**
     * Create a <presence> message which is part of the XMPP standard base
     * specification and may contain text messages, usually for instant
     * messaging applications.
     *
     * @param {Object} options
     * @param {String} body
     * @type  {String}
     * @private
     */
    function createMessageBlock(options, body) {
        var aOut = ["<message xmlns='", apf.xmpp.NS.jabber, "' from='", getVar("JID"),
            "' to='", options.to, "' id='message_", register("mess_count",
            parseInt(getVar("mess_count") || 0) + 1), "' xml:lang='", options["xml:lang"], "'"];
        if (options.type)
            aOut.push(" type='", options.type, "'");
        aOut.push(">");

        // A subject to be sent along
        if (options.subject)
            aOut.push("<subject>", options.subject, "</subject>");

        // This is used to identify threads in chat conversations
        // A thread is usually a somewhat random hash.
        if (options.thread)
            aOut.push("<thread>", options.thread, "</thread>");

        aOut.push("<body>", body, "</body></message>");
        return aOut.join("");
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
        serverVars[name] = value;

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
        for (var i = 0, l = arguments.length, arg; i < l; i++) {
            arg = arguments[i];
            if (typeof serverVars[arg] != "undefined") {
                serverVars[arg] = null;
                delete serverVars[arg];
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
        return serverVars[name] || "";
    }

    /**
     * Special version of getVar('RID'), because RID needs to upped by one each
     * time a request is sent to the XMPP server.
     *
     * @type {Number}
     * @private
     */
    function getRID() {
        return register("RID", getVar("RID") + 1);
    }

    // expose functions to interfaces:
    this.$makeUnique          = makeUnique;
    this.$createBodyElement   = createBodyElement;
    this.$createStreamElement = createStreamElement;
    this.$createIqBlock       = createIqBlock;
    this.$createPresenceBlock = createPresenceBlock;
    this.$createMessageBlock  = createMessageBlock;
    this.$getVar              = getVar;
    this.$getRID              = getRID;

    /**
     * Generic function that provides a basic method for making HTTP calls to
     * the XMPP server and processing the response in retries, error messages
     * or through a custom callback.
     *
     * @param     {Function} callback
     * @param     {String}   body
     * @param     {Boolean}  isUserMessage Specifies whether this message is a
     *   message sent over the established connection or a protocol message.
     *   The user messages are recorded when offline and sent when the
     *   application comes online again.
     * @exception {Error}    A general Error object
     * @type      {XMLHttpRequest}
     */
    this.$doXmlRequest = function(callback, body) {
        return this.get(this.server,
            function(data, state, extra) {
                if (_self.$isPoll) {
                    if (!data || data.replace(/^[\s\n\r]+|[\s\n\r]+$/g, "") == "") {
                        //state = apf.ERROR;
                        //extra.message = (extra.message ? extra.message + "\n" : "")
                        //                + "Received an empty XML document (0 bytes)";
                    }
                    else {
                        if (data.indexOf("<stream:stream") > -1
                          && data.indexOf("</stream:stream>") == -1)
                            data = data + "</stream:stream>";
                        data = apf.getXmlDom(data);
                        if (!apf.supportNamespaces)
                            data.setProperty("SelectionLanguage", "XPath");
                    }
                }

                if (state != apf.SUCCESS) {
                    var oError;
                    
                    oError = new Error(apf.formatErrorString(0, 
                        _self, "XMPP Communication error", 
                        "Url: " + extra.url + "\nInfo: " + extra.message));
                    
                    if (typeof callback == "function") {
                        callback.call(_self, data, state, extra);
                        return true;
                    }
                    else if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                        return true;
                    
                    onError(apf.xmpp.ERROR_CONN, extra.message, state); //@TBD:Mike please talk to me about how to integrate onError() properly
                    throw oError;
                }

                if (typeof callback == "function")
                    callback.call(_self, data, state, extra);
            }, {
                nocache       : true,
                useXML        : !this.$isPoll,
                ignoreOffline : true,
                data          : body || ""
            });
    };

    /**
     * ERROR_AUTH: Something went wrong during the authentication process; this function
     *             provides a central mechanism for dealing with this situation
     *
     * ERROR_CONN: Our connection to the server has dropped, or the XMPP server can not be
     *             reached at the moment. We will cancel the authentication process and
     *             dispatch a 'connectionerror' event
     *
     * @param {Number}  nType  Type of the error (apf.xmpp.ERROR_AUTH or apf.xmpp.ERROR_CONN)
     * @param {String}  sMsg   Error message/ description. Optional.
     * @param {Number}  nState State of the http connection. Optional, defaults to apf.ERROR.
     * @type  {Boolean}
     * @private
     */
    function onError(nType, sMsg, nState) {
        if (nType & apf.xmpp.ERROR_CONN) {
            if (retryCount == 3) {
                retryCount = 0;
                clearTimeout(tListener);
                tListener = null;
                return _self.connect(getVar("username"), getVar("password"),
                    getVar("register") || _self.autoRegister)
            }
            retryCount++;
        }
        else {
            retryCount = 0;
        }

        // #ifdef __DEBUG
        apf.console.log("[XMPP-" + (nType & apf.xmpp.ERROR_AUTH
            ? "AUTH"
            : "CONN") + "] onError called.", "xmpp");
        // #endif
        clearTimeout(tListener);
        tListener = null;
        //unregister("password");

        var extra = {
            username : getVar("username"),
            server   : _self.server,
            message  : sMsg || (nType & apf.xmpp.ERROR_AUTH
                ? "Access denied. Please check your username or password."
                : "Could not connect to server, please contact your System Administrator.")
        },
        cb = getVar("login_callback");
        if (cb) {
            unregister("login_callback");
            return cb(null, nState || apf.ERROR, extra);
        }

        // #ifdef __DEBUG
        apf.console.error(extra.message + " (username: " + extra.username
                          + ", server: " + extra.server + ")", "xmpp");
        // #endif

        return _self.dispatchEvent(nType & apf.xmpp.ERROR_AUTH 
            ? "authfailure"
            : "connectionerror", extra);
    }

    /**
     * Connect to the XMPP server with a username and password combination
     * provided.
     *
     * @param {String} username
     * @param {String} password
     * @type  {void}
     */
    this.connect = function(username, password, reg, callback) {
        this.reset();

        register("username",       username);
        register("password",       password);
        register("login_callback", callback);
        register("register",       reg || this.autoRegister);
        // #ifdef __TP_XMPP_ROSTER
        getVar("roster").registerAccount(username, this.domain);
        // #endif
        // #ifdef __TP_XMPP_MUC
        if (this.canMuc)
            this.$mucRoster.registerAccount(username, this.domain);
        // #endif
        this.$doXmlRequest(processConnect, this.$isPoll
            ? createStreamElement(null, {
                doOpen         : true,
                to             : _self.domain,
                xmlns          : apf.xmpp.NS.jabber,
                "xmlns:stream" : apf.xmpp.NS.stream,
                version        : "1.0"
              })
            : createBodyElement({
                content        : "text/xml; charset=utf-8",
                hold           : "1",
                rid            : getVar("RID"),
                to             : _self.domain,
                route          : "xmpp:jabber.org:9999",
                secure         : "true",
                wait           : "120",
                ver            : "1.6",
                "xml:lang"     : "en",
                "xmpp:version" : "1.0",
                xmlns          : apf.xmpp.NS.httpbind,
                "xmlns:xmpp"   : apf.xmpp.NS.bosh
              })
        );
    };

    /**
     * Disconnect from the XMPP server. It suspends the connection with the
     * 'pause' attribute when using BOSH. Poll-based connection only need to
     * stop polling.
     *
     * @param {Function} callback Data instruction callback
     * @type {void}
     */
    this.disconnect = function(callback) {
        if (getVar("connected")) {
            register("logout_callback", callback);
            this.$doXmlRequest(processDisconnect, this.$isPoll
                ? createStreamElement(null, {
                    doClose: true
                  })
                : createBodyElement({
                      pause : 120,
                      rid   : getRID(),
                      sid   : getVar("SID"),
                      xmlns : apf.xmpp.NS.httpbind
                  })
            );
        }
        else {
            this.reset();
            callback(null, apf.SUCCESS);
        }
    };

    /**
     * Set all session variables to NULL, so the element may create a new
     * XMPP connection.
     *
     * @type {void}
     */
    this.reset = function() {
        var oRoster = getVar("roster");
        if (oRoster)
            oRoster.reset();
        // #ifdef __TP_XMPP_MUC
        if (this.canMuc && this.$mucRoster)
            this.$mucRoster.reset();
        // #endif
        // unregister ALL variables with a trick:
        for (var i in serverVars)
            unregister(i);

        // apply some initial values to the serverVars global scoped Array
        register("RID",        parseInt("".appendRandomNumber(10)));
        register("cnonce",     generateCnonce(14));
        register("nc",         "00000001");
        register("bind_count", 1);
        register("connected",  false);
        // #ifdef __TP_XMPP_ROSTER
        register("roster",     new apf.xmpp_roster(this.oModel,
                                   this.modelContent, this.resource));
        // #endif
        register("mess_count", 0);
    };

    /**
     * A new stream has been created, now we need to process the response body.
     *
     * Example:
     *   <body xmpp:version='1.0'
     *         authid='ServerStreamID'
     *         xmlns='http://jabber.org/protocol/httpbind'
     *         xmlns:xmpp='urn:xmpp:xbosh'
     *         xmlns:stream='http://etherx.jabber.org/streams'>
     *     <stream:features>
     *       <mechanisms xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>
     *         <mechanism>DIGEST-MD5</mechanism>
     *         <mechanism>PLAIN</mechanism>
     *       </mechanisms>
     *     </stream:features>
     *   </body>
     *
     * @param {Object} oXml
     * @param {Number} state
     * @param {mixed}  extra
     * @type  {void}
     * @private
     */
    function processConnect(oXml, state, extra) {
        if (state != apf.SUCCESS)
            return onError(apf.xmpp.ERROR_CONN, extra.message, state);

        // reset retry/ connection counter
        retryCount = 0;
        //apf.xmldb.getXml('<>'); <-- one way to convert XML string to DOM
        if (!this.$isPoll) {
            register("SID", oXml.getAttribute("sid"));
            register("AUTH_ID", oXml.getAttribute("authid"));
        }
        else {
            var aCookie = extra.http.getResponseHeader("Set-Cookie").splitSafe(";");
            register("SID", aCookie[0].splitSafe("=")[1])
            register("AUTH_ID", oXml.firstChild.getAttribute("id"));
        }

        var oMech = oXml.getElementsByTagName("mechanisms")[0],
            sXmlns = oMech.getAttribute("xmlns");
        register("AUTH_SASL", (sXmlns && sXmlns == apf.xmpp.NS.sasl));

        var aMechanisms = oXml.getElementsByTagName("mechanism"),
            sMech, i, found = false;
        for (i = 0; i < aMechanisms.length && !found; i++) {
            sMech = aMechanisms[i].firstChild.nodeValue;
            if (sMech == "DIGEST-MD5" || sMech == "PLAIN") {
                register("AUTH_TYPE", sMech);
                found = true;
            }
        }

        if (!found) {
            return onError(apf.xmpp.ERROR_AUTH, 
             "No supported authentication protocol found. We cannot continue!");
        }

        return getVar("register") ? doRegRequest() : doAuthRequest();
    }

    /**
     * In-Band registration support; allows for automatically registering a
     * username to the XMPP server and direct login.
     * @see http://xmpp.org/extensions/attic/jep-0077-2.0.html
     * 
     * @type {void}
     * @private
     */
    function doRegRequest() {
        var sIq = createIqBlock({
                type  : "set",
                id    : makeUnique("reg")
            },
            "<query xmlns='" + apf.xmpp.NS.register + "'><username>"
                + getVar("username") + "</username><password>"
                + getVar("password") + "</password></query>"
        );
        _self.$doXmlRequest(function(oXml) {
                if (oXml && oXml.nodeType) {
                    var iq = oXml.getElementsByTagName("iq")[0];
                    if ((iq && iq.getAttribute("type") == "error")
                      || oXml.getElementsByTagName("error").length) {
                        return onError(apf.xmpp.ERROR_AUTH,
                            "New account registration for account '"
                            + getVar("username") + " failed.");
                    }
                    // registration successful, proceed with authentication
                    doAuthRequest();
                }
                //#ifdef __DEBUG
                else if (!_self.$isPoll)
                    onError(apf.xmpp.ERROR_CONN, null, apf.OFFLINE);
                //#endif
            }, _self.$isPoll
            ? createStreamElement(null, null, sIq)
            : createBodyElement({
                rid   : getRID(),
                sid   : getVar("SID"),
                xmlns : apf.xmpp.NS.httpbind
            }, sIq)
        );
    }

    /**
     * Proceeds with the authentication process after establishing a connection
     * or stream to the server OR after a successful In-Band registration
     * We also support Non-SASL Authentication
     * @see http://xmpp.org/extensions/attic/jep-0078-1.7.html
     *
     * @type {void}
     */
    function doAuthRequest() {
        if (getVar("AUTH_SASL")) {
            // start the authentication process by sending a request
            var sType = getVar("AUTH_TYPE"),
                sAuth = "<auth xmlns='" + apf.xmpp.NS.sasl + "' mechanism='"
                    + sType + (sType == "PLAIN"
                        ? "'>" + getVar("username") + "@" + this.domain
                            + String.fromCharCode(0) + getVar("username")
                            + String.fromCharCode(0) + getVar("password")
                            + "</auth>"
                        : "'/>");
            _self.$doXmlRequest((sType == "ANONYMOUS" || sType == "PLAIN")
                ? reOpenStream // skip a few steps...
                : processAuthRequest, _self.$isPoll
                ? createStreamElement(null, null, sAuth)
                : createBodyElement({
                      rid   : getRID(),
                      sid   : getVar("SID"),
                      xmlns : apf.xmpp.NS.httpbind
                  }, sAuth)
            );
        }
        // do Non-SASL Authentication as described in JEP-0078
        else {
           var sIq = createIqBlock({
                    type  : "get",
                    id    : makeUnique("auth")
                },
                "<query xmlns='" + apf.xmpp.NS.auth + "'><username>"
                    + getVar("username") + "</username></query>"
            );
            _self.$doXmlRequest(processAuthRequest, _self.$isPoll
                ? createStreamElement(null, null, sIq)
                : createBodyElement({
                    rid   : getRID(),
                    sid   : getVar("SID"),
                    xmlns : apf.xmpp.NS.httpbind
                }, sIq)
            );
        }
    }

    /**
     * The connection has been terminated (set to state 'paused'). Theoretically
     * it could be resumed, but doing a complete reconnect would be more secure
     * and stable for RSB and other implementations that rely on stable stream
     * traffic.
     *
     * Example:
     *   @todo: put the spec response here...
     *
     * @param {Object} oXml
     * @type  {void}
     * @private
     */
    function processDisconnect(oXml, state, extra) {
        // #ifdef __DEBUG
        apf.console.dir(oXml);
        // #endif
        var cb = getVar("logout_callback");
        this.reset();
        if (cb)
            cb(oXml, state, extra);
    }

    /**
     * Check the response from the server to a challenge our connection manager
     * set up. When a <failure> node is detected, it means that the challenge
     * failed and thereby the authentication as well.
     *
     * @param {XMLDom} oXml
     * @type  {Boolean}
     * @private
     */
    function processChallenge(oXml) {
        if (!oXml || oXml.getElementsByTagName("failure").length)
            return false; // authentication failed!

        var oChallenge = oXml.getElementsByTagName("challenge")[0];
        if (oChallenge) {
            var i, l, aChunk,
                b64_challenge = oChallenge.firstChild.nodeValue,
                aParts        = apf.crypto.Base64.decode(b64_challenge).split(",");

            for (i = 0, l = aParts.length; i < l; i++) {
                aChunk = aParts[i].split("=");
                register(aChunk[0], aChunk[1].trim().replace(/[\"\']/g, ""));
            }

            //#ifdef __DEBUG
            apf.console.info("processChallenge: " + aParts.join("    "), "xmpp");
            //#endif
        }

        return true;
    }

    /**
     * The first challenge result should be be processed here and the second
     * challenge is sent to the server
     *
     * Response example:
     *   <body xmlns='http://jabber.org/protocol/httpbind'>
     *     <challenge xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>
     *       cmVhbG09InNvbWVyZWFsbSIsbm9uY2U9Ik9BNk1HOXRFUUdtMmhoIixxb3A9
     *       ImF1dGgiLGNoYXJzZXQ9dXRmLTgsYWxnb3JpdGhtPW1kNS1zZXNzCg==
     *     </challenge>
     *   </body>
     *
     * @param {Object} oXml
     * @type  {void}
     * @private
     */
    function processAuthRequest(oXml) {
        if (getVar("AUTH_SASL")) {
            if (!processChallenge(oXml))
                return onError(apf.xmpp.ERROR_AUTH);

            var sRealm = getVar("realm"),
                md5    = apf.crypto.MD5;
            if (!sRealm)
                register("realm", sRealm = _self.domain); //DEV: option to provide realm with a default

            if (sRealm)
                register("digest-uri", "xmpp/" + sRealm);

            //#ifdef __DEBUG
            apf.console.info("auth - digest-uri: " + getVar("digest-uri"), "xmpp");
            //#endif

            // for the calculations of A1, A2 and sResp below, take a look at
            // RFC 2617, Section 3.2.2.1
            var A1 = md5.str_md5(getVar("username") + ":" + _self.domain
                    + ":" + getVar("password")) // till here we hash-up with MD5
                    + ":" + getVar("nonce") + ":" + getVar("cnonce"),

                A2 = "AUTHENTICATE:" + getVar("digest-uri"),

                sResp = md5.hex_md5(md5.hex_md5(A1) + ":"
                    + getVar("nonce") + ":" + getVar("nc") + ":" + getVar("cnonce")
                    + ":" + getVar("qop") + ":" + md5.hex_md5(A2));

            //#ifdef __DEBUG
            apf.console.info("response: " + sResp, "xmpp");
            //#endif

            var sAuth = createAuthBlock({
                username    : getVar("username"),
                realm       : sRealm,
                nonce       : getVar("nonce"),
                cnonce      : getVar("cnonce"),
                nc          : getVar("nc"),
                qop         : getVar("qop"),
                "digest-uri": getVar("digest-uri"),
                response    : sResp,
                charset     : getVar("charset")
            });
            _self.$doXmlRequest(processFinalChallenge, _self.$isPoll
                ? createStreamElement(null, null, sAuth)
                : createBodyElement({
                      rid   : getRID(),
                      sid   : getVar("SID"),
                      xmlns : apf.xmpp.NS.httpbind
                  }, sAuth)
            );
        }
        else {
            if (oXml && oXml.nodeType) {
                var iq = oXml.getElementsByTagName("iq")[0];
                if ((iq && iq.getAttribute("type") == "error")
                  || oXml.getElementsByTagName("error").length) {
                    return onError(apf.xmpp.ERROR_AUTH);
                }
                var aDigest,
                    bDigest = (aDigest = oXml.getElementsByTagName("digest")
                                && aDigest[0]),
                    sIq     = createIqBlock({
                        type  : "set",
                        id    : makeUnique("auth")
                    },
                    "<query xmlns='" + apf.xmpp.NS.auth + "'><username>"
                        + getVar("username") + "</username><resource>"
                        + _self.resource + "</resource>" + (bDigest
                            ? "<digest xmlns='" + apf.xmpp.NS.auth + ">"
                                + apf.crypto.SHA1(getVar("AUTH_ID")
                                + getVar("password")) + "</digest>"
                            : "<password xmlns='" + apf.xmpp.NS.auth + "'>"
                                + getVar("password") + "</password>")
                        + "</query>"
                );
                _self.$doXmlRequest(reOpenStream, _self.$isPoll
                    ? createStreamElement(null, null, sIq)
                    : createBodyElement({
                        rid   : getRID(),
                        sid   : getVar("SID"),
                        xmlns : apf.xmpp.NS.httpbind
                    }, sIq)
                );
            }
            //#ifdef __DEBUG
            else if (!_self.$isPoll)
                onError(apf.xmpp.ERROR_CONN, null, apf.OFFLINE);
            //#endif
        }
    }

    /**
     * The second a last part of the authentication process (handshake) should
     * be processed here. If the handshake was successful, we can close the
     * authentication/ handshake process.
     *
     * Response example:
     *   <body xmlns='http://jabber.org/protocol/httpbind'>
     *     <challenge xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>
     *       cnNwYXV0aD1lYTQwZjYwMzM1YzQyN2I1NTI3Yjg0ZGJhYmNkZmZmZAo=
     *     </challenge>
     *   </body>
     *
     * @param {Object} oXml
     * @type  {void}
     * @private
     */
    function processFinalChallenge(oXml) {
        // register the variables that are inside the challenge body
        // (probably only 'rspauth')
        if (!processChallenge(oXml))
            return onError(apf.xmpp.ERROR_AUTH);

        // the spec requires us to clear the password from our system(s)
        //unregister("password");

        var sAuth = createAuthBlock({});
        _self.$doXmlRequest(reOpenStream, _self.$isPoll
            ? createStreamElement(null, null, sAuth)
            : createBodyElement({
                  rid   : getRID(),
                  sid   : getVar("SID"),
                  xmlns : apf.xmpp.NS.httpbind
              }, sAuth)
        );
    }

    /**
     * Check if the authentication process has been closed and confirmed by the
     * XMPP server. If successful, we can start listening for incoming messages.
     *
     * Response example:
     *   <body xmlns='http://jabber.org/protocol/httpbind'>
     *     <success xmlns='urn:ietf:params:xml:ns:xmpp-sasl'/>
     *   </body>
     *
     * @param {Object} oXml
     * @type  {void}
     * @private
     */
    function reOpenStream(oXml) {
        if (getVar("AUTH_SASL")) {
            if (!processChallenge(oXml))
                return onError(apf.xmpp.ERROR_AUTH);
        }
        else {
            if (oXml && oXml.nodeType) {
                var iq = oXml.getElementsByTagName("iq")[0];
                if ((iq && iq.getAttribute("type") == "error")
                  || oXml.getElementsByTagName("error").length) {
                    return onError(apf.xmpp.ERROR_AUTH);
                }
                unregister("password");
            }
            //#ifdef __DEBUG
            else if (!_self.$isPoll)
                onError(apf.xmpp.ERROR_CONN, null, apf.OFFLINE);
            //#endif
        }

        //restart the stream request
        this.$doXmlRequest(function(oXml) {
                if (_self.$isPoll || oXml.getElementsByTagName("bind").length) {
                    // Stream restarted OK, so now we can actually start
                    // listening to messages!
                    _self.bind();
                }
            }, _self.$isPoll
            ? createStreamElement(null, {
                doOpen         : true,
                to             : _self.domain,
                xmlns          : apf.xmpp.NS.jabber,
                "xmlns:stream" : apf.xmpp.NS.stream,
                version        : "1.0"
              })
            : createBodyElement({
                  rid            : getRID(),
                  sid            : getVar("SID"),
                  to             : _self.domain,
                  "xml:lang"     : "en",
                  "xmpp:restart" : "true",
                  xmlns          : apf.xmpp.NS.httpbind,
                  "xmlns:xmpp"   : apf.xmpp.NS.bosh
              })
        );
    }

    /**
     * Tell the XMPP server that the authentication/ handshake has been completed
     * and that we want to start listening for messages for this user.
     *
     * @type {void}
     */
    this.bind = function() {
        var sIq = createIqBlock({
            id    : "bind_" + register("bind_count", parseInt(getVar("bind_count")) + 1),
            type  : "set",
            xmlns : this.$isPoll ? null : apf.xmpp.NS.jabber
          },
          "<bind xmlns='" + apf.xmpp.NS.bind + "'>" +
             "<resource>" + this.resource + "</resource>" +
          "</bind>"
        );
        this.$doXmlRequest(processBindingResult, _self.$isPoll
            ? createStreamElement(null, null, sIq)
            : createBodyElement({
                  rid   : getRID(),
                  sid   : getVar("SID"),
                  xmlns : apf.xmpp.NS.httpbind
              }, sIq)
        );
    };

    /**
     * Checks if the request to bind the message stream with the the current
     * user was successful and if YES, then we store the full Jabber ID (JID)
     * and can start listening for incoming messages.
     *
     * Response example:
     *  <body xmlns='http://jabber.org/protocol/httpbind'>
     *     <iq id='bind_1'
     *         type='result'
     *         xmlns='jabber:client'>
     *       <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'>
     *         <jid>stpeter@jabber.org/httpclient</jid>
     *       </bind>
     *     </iq>
     *   </body>
     *
     * @param {Object} oXml
     * @type  {void}
     * @private
     */
    function processBindingResult(oXml) {
        var oJID = oXml.getElementsByTagName("jid")[0];
        if (oJID) {
            register("JID", oJID.firstChild.nodeValue);
            var sIq = createIqBlock({
                    from  : getVar("JID"),
                    id    : sAJAX_ID,
                    to    : _self.domain,
                    type  : "set",
                    xmlns : apf.xmpp.NS.jabber
                },
                "<session xmlns='" + apf.xmpp.NS.session + "'/>"
            );
            _self.$doXmlRequest(function(oXml) {
                    parseData(oXml);
                    setInitialPresence();
                }, _self.$isPoll
                ? createStreamElement(null, null, sIq)
                : createBodyElement({
                    rid   : getRID(),
                    sid   : getVar("SID"),
                    xmlns : apf.xmpp.NS.httpbind
                }, sIq)
            );
        }
        else {
            //@todo: check for binding failures!
            onError(apf.xmpp.ERROR_AUTH);
        }
    }

    /**
     * On connect, the presence of the user needs to be broadcasted to all the
     * nodes in the roster to 'available' (or whatever the default status is).
     * The response of this presence callback is also the indicator for any
     * successful login sequence.
     *
     * @type {void}
     * @private
     */
    function setInitialPresence() {
        // NOW only we set the actual presence tag!
        var sPresence = createPresenceBlock({
            type: apf.xmpp.TYPE_AVAILABLE
        });
        _self.$doXmlRequest(function(oXml) {
                register("connected", true);
                _self.dispatchEvent("connected", {username: getVar("username")});
                parseData(oXml);
                // #ifdef __TP_XMPP_ROSTER
                getRoster();
                // #endif
            }, _self.$isPoll
            ? createStreamElement(null, null, sPresence)
            : createBodyElement({
                rid   : getRID(),
                sid   : getVar("SID"),
                xmlns : apf.xmpp.NS.httpbind
            }, sPresence)
        );
    }
    // #ifdef __TP_XMPP_ROSTER
    /**
     * Retrieve the roster information from the XMPP server. The roster contains
     * a list of nodes to which user has subscribed to. Each roster item will
     * contain presence information and optionally group metadata.
     * Generally, this data is only used for IM applications (see RFC 3921,
     * Section 7.2).
     * This function SHOULD only be called on login.
     *
     * @type {void}
     * @private
     */
    function getRoster() {
        var sIq = createIqBlock({
                from  : getVar("JID"),
                type  : "get",
                id    : makeUnique("roster")
            },
            "<query xmlns='" + apf.xmpp.NS.roster + "'/>"
        );
        _self.$doXmlRequest(function(oXml) {
                parseData(oXml);
                _self.$listen();
                var cb = getVar("login_callback");
                if (cb) {
                    cb(null, apf.SUCCESS, {
                        username : getVar("username")
                    });
                    unregister("login_callback");
                }
            }, _self.$isPoll
            ? createStreamElement(null, null, sIq)
            : createBodyElement({
                rid   : getRID(),
                sid   : getVar("SID"),
                xmlns : apf.xmpp.NS.httpbind
            }, sIq)
        );
    }
    // #endif
    /**
     * Open a PUSH connection to the XMPP server and wait for messages to
     * arrive (i.e. 'listen' to the stream).
     * Internal locking prevents us from firing more than one listener at a time.
     *
     * @type {void}
     */
    this.$listen = function() {
        if (bListening === true) return;

        bListening = true;

        //#ifdef __DEBUG
        apf.console.info("XMPP: Listening for messages...", "xmpp");
        //#endif

        this.$doXmlRequest(processStream, _self.$isPoll
            ? createStreamElement()
            : createBodyElement({
                  rid   : getRID(),
                  sid   : getVar("SID"),
                  xmlns : apf.xmpp.NS.httpbind
              }, "")
        );
    };

    /**
     * If there is no proof that the 'listener' thread (or http connection) is
     * still open, reconnect it after the current callback sequence has completed
     * (hence the 'setTimeout' call).
     *
     * @see teleport.xmpp.methodlisten
     * @param {mixed}  data
     * @param {Number} state
     * @param {Object} extra
     * @type {void}
     * @private
     */
    function restartListener(data, state, extra) {
        clearTimeout(tListener);
        tListener = null;
        if (data || state) {
            if (state != apf.SUCCESS)
                return onError(apf.xmpp.ERROR_CONN, extra.message, state);
            else
                parseData(data);
        }

        if (getVar("connected") && !bListening) {
            tListener = setTimeout(function() {
                _self.$listen();
            }, _self.pollTimeout || 0);
        }
    }

    this.$restartListener = restartListener;

    /**
     * Handle the result of the stream listener and messages that arrived need
     * to be processed.
     *
     * @param {Object} oXml
     * @type  {void}
     * @private
     */
    function processStream(oXml, state) {
        clearTimeout(tListener);
        tListener = null;
        parseData(oXml);

        var bNoListener = (bListening === false); //experimental
        bListening = false;

        // start listening again...
        if (getVar("connected") && !bNoListener) {
            tListener = setTimeout(function() {
                _self.$listen();
            }, _self.pollTimeout || 0);
        }
    }

    /**
     * Parse the XML envelope received from the XMPP server. Since one XML
     * envelope may contain more than one message type, no if...else block can
     * be found (we check for all possible message types).
     *
     * @param {Object} oXml
     * @type  {void}
     * @private
     */
    function parseData(oXml) {
        if (oXml && oXml.nodeType) {
            // do other stuff... like processing the messages? :P
            var aMessages = oXml.getElementsByTagName("message");
            if (aMessages.length)
                parseMessagePackets(aMessages);

            var aPresence = oXml.getElementsByTagName("presence");
            
            //#ifdef __DEBUG
            apf.console.info("Number of <PRESENCE> elements: " + aPresence.length, "xmpp");
            //#endif
            
            if (aPresence.length)
                parsePresencePackets(aPresence);

            var aIQs = oXml.getElementsByTagName("iq");
            if (aIQs.length)
                parseIqPackets(aIQs);
        }
        //#ifdef __DEBUG
        else if (!_self.$isPoll)
            onError(apf.xmpp.ERROR_CONN, null, apf.OFFLINE);
        //#endif
    }

    this.$parseData = parseData;

    /**
     * One or more (instant-)messages have are arrived that need to be processed
     * and parsed to eventually show up in the GUI
     *
     * @see teleport.xmpp.methodparseData
     * @param {Array} aMessages
     * @type  {void}
     * @private
     */
    function parseMessagePackets(aMessages) {
        var i, sJID, oUser, oBody, bRoom;

        for (i = 0; i < aMessages.length; i++) {
            sJID = aMessages[i].getAttribute("from");
            bRoom = (aMessages[i].getAttribute("type") == "groupchat");
            // #ifdef __TP_XMPP_ROSTER
            if (sJID && !bRoom)
                oUser = getVar("roster").getEntityByJID(sJID); //unsed var...yet?
            // #endif

            if (aMessages[i].getAttribute("type") == "chat" || bRoom) {
                oBody = aMessages[i].getElementsByTagName("body")[0];
                if (oBody && oBody.firstChild) {
                    // #ifdef __DEBUG
                    apf.console.log("XMPP incoming chat message: " + oBody.firstChild.nodeValue, "xmpp");
                    // #endif
                    var sFrom = aMessages[i].getAttribute("from"),
                        sMsg  = oBody.firstChild.nodeValue
                    // #ifdef __TP_XMPP_ROSTER
                    // #ifdef __TP_XMPP_MUC
                    if (bRoom && sFrom == _self.$mucRoster.fullJID)
                        return;
                    // #endif
                    if ((bRoom ? _self.$mucRoster : getVar("roster")).updateMessageHistory(sFrom, sMsg)) {
                    // #endif
                        _self.dispatchEvent("receivechat", {
                            from   : sFrom,
                            message: sMsg
                        });
                    // #ifdef __TP_XMPP_ROSTER
                    }
                    // #endif
                }
            }
            else if (aMessages[i].getAttribute("type") == "normal") { //normal = Remote SmartBindings
                oBody = aMessages[i].getElementsByTagName("body")[0];
                if (oBody && oBody.firstChild) {
                    //Remote SmartBindings support
                    
                    //#ifdef __DEBUG
                    apf.console.info("received the following from the server: "
                        + oBody.firstChild.nodeValue.replace(/\&quot;/g, '"'), "xmpp");
                    //#endif
                    
                    _self.dispatchEvent("datachange", {
                        data: oBody.firstChild.nodeValue.replace(/\&quot;/g, '"')
                    });
                }
            }
        }
    }

    /**
     * One or more Presence messages have arrived that indicate something has
     * changed in the roster, e.g. the status of a node changed, a node was
     * disconnected, etc. All of these messages will update the local Roster.
     *
     * @see teleport.xmpp.methodparseData
     * @param {Array} aPresence
     * @type  {void}
     * @private
     */
    function parsePresencePackets(aPresence) {
        //#ifdef __DEBUG
        apf.console.info("parsePresencePacket: " + aPresence.length, "xmpp");
        //#endif
        // #ifdef __TP_XMPP_ROSTER
        for (var i = 0, l = aPresence.length; i < l; i++) {
            var sJID = aPresence[i].getAttribute("from"),
                aX   = aPresence[i].getElementsByTagName("x"),
                bMuc = (sJID.indexOf(_self.mucDomain) > -1);
            // #ifdef __TP_XMPP_MUC
            if (aX.length && _self.$isRoom(sJID)) {
                for (var o, k = 0, l2 = aX.length; k < l2; k++) {
                    switch (aX[k].getAttribute("xmlns")) {
                        case apf.xmpp.NS.muc_user:
                            // status code=110 means ME
                            if (_self.$getStatusCode(aX[k], 110)) break;
                            o = aX[k].getElementsByTagName("item")[0];
                            if (!o) break;
                            _self.$mucRoster.getEntityByJID(sJID, {
                                roomJID    : o.getAttribute("jid"),
                                affiliation: o.getAttribute("affiliation"),
                                role       : o.getAttribute("role"),
                                status     : aPresence[i].getAttribute("type")
                                    || apf.xmpp.TYPE_AVAILABLE
                            });
                            break;
                    }
                }
            }
            // #endif
            if (sJID && !bMuc) {
                var oRoster = getVar("roster"),
                    oUser   = oRoster.getEntityByJID(sJID),
                    sType   = aPresence[i].getAttribute("type");
                    
                if (sType == apf.xmpp.TYPE_SUBSCRIBE) {
                    // incoming subscription request, deal with it!
                    incomingAdd(aPresence[i].getAttribute("from"));
                }
                // record any status change...
                if (oUser)
                    oRoster.update(oUser, sType || apf.xmpp.TYPE_AVAILABLE);
            }
        }
        // #endif
    }

    /**
     * One or more Iq messages have arrived that notify the user of system wide
     * events and results of its actions, e.g. the failure or success of setting
     * presence, connection errors, probe for supported features of nodes results,
     * etc.
     *
     * @see teleport.xmpp.methodparseData
     * @param {Array} aIQs
     * @type  {void}
     * @private
     */
    function parseIqPackets(aIQs) {
        //#ifdef __DEBUG
        apf.console.info("parseIqPacket: " + aIQs.length, "xmpp");
        //#endif

        for (var i = 0, l = aIQs.length; i < l; i++) {
            if (aIQs[i].getAttribute("type") != "result") continue;
            var aQueries = aIQs[i].getElementsByTagName("query"),
                sFrom    = aIQs[i].getAttribute("to");
            for (var j = 0, l2 = aQueries.length; j < l2; j++) {
                var aItems, k, l3;
                switch (aQueries[j].getAttribute("xmlns")) {
                    // #ifdef __TP_XMPP_ROSTER
                    case apf.xmpp.NS.roster:
                        aItems  = aQueries[j].getElementsByTagName("item");
                        var oRoster = getVar("roster"),
                            pBlocks = [];
                        for (k = 0, l3 = aItems.length; k < l3; k++) {
                            var sSubscr  = aItems[k].getAttribute("subscription"),
                                sGroup   = (aItems[k].childNodes.length > 0)
                                    ? aItems[k].firstChild.firstChild.nodeValue
                                    : "",
                                sJid     = aItems[k].getAttribute("jid");

                            var oContact = oRoster.getEntityByJID(sJid, {
                                subscription: sSubscr,
                                group       : sGroup
                            });
                            // now that we have a contact added to our roster,
                            // it's time to ask for presence
                            if (sSubscr == apf.xmpp.SUBSCR_TO
                              || sSubscr == apf.xmpp.SUBSCR_BOTH)
                                pBlocks.push(oContact);
                            else if (oContact.subscription == apf.xmpp.TYPE_SUBSCRIBED)
                                confirmAdd(oContact);
                        }
                        if (pBlocks.length)
                            _self.requestPresence(pBlocks);
                        break;
                    // #endif
                    // #ifdef __TP_XMPP_MUC
                    case apf.xmpp.NS.disco_items:
                        if (!_self.canMuc) break;
                        /*
                         Room(s):
                         <query xmlns='http://jabber.org/protocol/disco#items'>
                            <item jid='test@conference.somedomain.com' name='test (1)'/>
                         </query>
                         Room Occupant(s):
                         <query xmlns='http://jabber.org/protocol/disco#items'>
                            <item jid='contact1@somedomain.com'/>
                         </query>
                         */
                        aItems = aQueries[j].getElementsByTagName("item");
                        sFrom  = aIQs[i].getAttribute("from");
                        var oRoom = _self.$addRoom(sFrom, sFrom.substr(0, sFrom.indexOf("@"))),
                            sJID;
                        // @todo: add support for paging (<set> element)
                        for (k = 0, l3 = aItems.length; k < l3; k++) {
                            sJID  = aItems[k].getAttribute("jid");
                            if (sJID.indexOf("/") != -1)
                                _self.$addRoomOccupant(sJID);
                            else if (aItems[k].hasAttribute("name"))
                                oRoom.subscription = aItems[k].getAttribute("name");

                        }
                        break;
                    case apf.xmpp.NS.muc_user:
                        // @todo implement;
                    // #endif
                    default:
                        break;
                }
            }
        }
    }

    /**
     * Provides the ability to change the presence of the user on the XMPP
     * network to any of the types in the following format:
     * 'apf.xmpp.STATUS_*'
     *
     * @param {String} type   Status type according to the RFC
     * @param {String} status Message describing the status
     * @param {String} custom Custom status type
     * @type  {void}
     */
    this.setPresence = function(type, status, custom) {
        if (!getVar("connected")) return false;

        this.$doXmlRequest(restartListener, createBodyElement({
                rid   : getRID(),
                sid   : getVar("SID"),
                xmlns : apf.xmpp.NS.httpbind
            },
            createPresenceBlock({
                type  : type || apf.xmpp.TYPE_AVAILABLE,
                status: status,
                custom: custom
            }))
        );
    };

    /**
     * Provides the ability to request the presence of a contact from a users
     * roster.
     * 
     * @param {mixed} from Contact to get the presence data from (object or JID string)
     * @type  {void}
     */
    this.requestPresence = function(from) {
        if (!getVar("connected")) return false;
        // #ifdef __TP_XMPP_ROSTER
        var oRoster = getVar("roster");
        if (typeof from == "string")
            from = oRoster.getEntityByJID(from);
        if (!from) return false;

        var sPresence, aPresence = [];
        if (apf.isArray(from)) {
            for (var i = 0, l = from.length; i < l; i++) {
                aPresence.push(createPresenceBlock({
                    type: apf.xmpp.TYPE_PROBE,
                    to  : from[i].fullJID,
                    from: oRoster.fullJID
                }));
            }
        }
        else {
            aPresence.push(createPresenceBlock({
                type  : apf.xmpp.TYPE_PROBE,
                to    : from.fullJID,
                from  : oRoster.fullJID
            }));
        }
        sPresence = aPresence.join("");

        this.$doXmlRequest(restartListener, _self.$isPoll
            ? createStreamElement(null, null, sPresence)
            : createBodyElement({
                rid   : getRID(),
                sid   : getVar("SID"),
                xmlns : apf.xmpp.NS.httpbind
            }, sPresence)
        );
        // #endif
    };

    /**
     * Provides the ability to add a new contact to the roster of a user.
     * Depending on the settings and/ or action of the contact, the add request
     * will be accepted or denied.
     * @see protocol description in RFC 3921
     * @link http://tools.ietf.org/html/rfc3921#page-27
     * 
     * @param {String}   jid        Contact to be added to the user's Roster
     * @param {Function} [callback] Synchronisation callback for Datainstructions
     * @type  {void}
     */
    this.addContact = function(jid, callback) {
        // #ifdef __TP_XMPP_ROSTER
        if (typeof jid != "string") return false;
        var oRoster  = getVar("roster"),
            oContact = oRoster.getEntityByJID(jid);
        if (oContact && (oContact.subscription == apf.xmpp.SUBSCR_TO
          || oContact.subscription == apf.xmpp.SUBSCR_BOTH))
            return this.requestPresence(oContact);

        // all clear, now we request a new roster item
        var sIq = createIqBlock({
                type  : "set",
                id    : makeUnique("set")
            },
            "<query xmlns='" + apf.xmpp.NS.roster + "'><item jid='" + jid
                + "' /></query>"
        );
        this.$doXmlRequest(function(oXml) {
                parseData(oXml);
                _self.$listen();
                // if all is well, a contact is added to the roster.
                // <presence to='contact@example.org' type='subscribe'/>
                var sPresence = createPresenceBlock({
                    type  : apf.xmpp.TYPE_SUBSCRIBE,
                    to    : jid
                });
                _self.$doXmlRequest(function(oXml) {
                        if (!oXml || !oXml.nodeType) {
                            return !_self.$isPoll
                                ? onError(apf.xmpp.ERROR_CONN, null, apf.OFFLINE)
                                : null;
                        }
                        _self.$listen();

                        var oPresence = oXml.getElementsByTagName("presence")[0];
                        if (oPresence.getAttribute("error")) {
                            sPresence = createPresenceBlock({
                                type  : apf.xmpp.TYPE_UNSUBSCRIBE,
                                to    : jid
                            });
                            _self.$doXmlRequest(function(data, state, extra){
                                if (callback)
                                    callback.call(_self, data, state, extra);

                                restartListener(data, state, extra);
                            }, _self.$isPoll
                                ? createStreamElement(null, null, sPresence)
                                : createBodyElement({
                                    rid   : getRID(),
                                    sid   : getVar("SID"),
                                    xmlns : apf.xmpp.NS.httpbind
                                }, sPresence)
                            );
                        }
                        // all other events should run through the parseData()
                        // function and delegated to the Roster
                    }, _self.$isPoll
                    ? createStreamElement(null, null, sPresence)
                    : createBodyElement({
                        rid   : getRID(),
                        sid   : getVar("SID"),
                        xmlns : apf.xmpp.NS.httpbind
                    }, sPresence)
                );
            }, _self.$isPoll
            ? createStreamElement(null, null, sIq)
            : createBodyElement({
                rid   : getRID(),
                sid   : getVar("SID"),
                xmlns : apf.xmpp.NS.httpbind
            }, sIq)
        );
        // #endif
    };
    // #ifdef __TP_XMPP_ROSTER
    /**
     * Handler function that takes care of responses to the XMPP server upon
     * presence subscription request of the current user.
     * Depending on the settings of {@link attribute.auto-accept} and
     * {@link attribute.auto-deny} a contact will be denied to the Roster or
     * added.
     *
     * @param {String} sJID Contact that requested a subscription the user's presence information
     * @type  {void}
     * @private
     */
    function incomingAdd(sJID) {
        if (_self.autoConfirm) {
            var sMsg = createIqBlock({
                    from  : getVar("JID"),
                    type  : "get",
                    id    : makeUnique("roster")
                },
                "<query xmlns='" + apf.xmpp.NS.roster + "'><item jid='" + sJID
                    + "' /></query>"
            ) +  createPresenceBlock({
                type  : apf.xmpp.TYPE_SUBSCRIBED,
                to    : sJID
            });
            _self.$doXmlRequest(restartListener, _self.$isPoll
                ? createStreamElement(null, null, sMsg)
                : createBodyElement({
                    rid   : getRID(),
                    sid   : getVar("SID"),
                    xmlns : apf.xmpp.NS.httpbind
                }, sMsg)
            );
        }
        if (_self.autoDeny) {
            // <presence to='user@example.com' type='unsubscribed'/>
            var sPresence = createPresenceBlock({
                type  : apf.xmpp.TYPE_UNSUBSCRIBED,
                to    : sJID
            });
            _self.$doXmlRequest(restartListener, _self.$isPoll
                ? createStreamElement(null, null, sPresence)
                : createBodyElement({
                    rid   : getRID(),
                    sid   : getVar("SID"),
                    xmlns : apf.xmpp.NS.httpbind
                }, sPresence)
            );
        }
    }

    /**
     * Handler function that takes care of the final stage of adding a contact
     * to the user's roster: confirmation of the subscription state.
     *
     * @param {Object} oContact Contact that has accepted the invitation to connect
     * @type  {void}
     */
    function confirmAdd(oContact) {
        var sPresence = createPresenceBlock({
            type  : apf.xmpp.TYPE_SUBSCRIBED,
            to    : oContact.jid
        });
        _self.$doXmlRequest(restartListener, _self.$isPoll
            ? createStreamElement(null, null, sPresence)
            : createBodyElement({
                rid   : getRID(),
                sid   : getVar("SID"),
                xmlns : apf.xmpp.NS.httpbind
            }, sPresence)
        );
    }
    // #endif
    var statusMap = {
        "online"      : apf.xmpp.STATUS_ONLINE,
        "offline"     : apf.xmpp.STATUS_OFFLINE,
        "away"        : apf.xmpp.STATUS_AWAY,
        "xa"          : apf.xmpp.STATUS_XA,
        "extendedaway": apf.xmpp.STATUS_XA,
        "onvacation"  : apf.xmpp.STATUS_XA,
        "dnd"         : apf.xmpp.STATUS_DND,
        "donotdisturb": apf.xmpp.STATUS_DND,
        "invisible"   : apf.xmpp.STATUS_INVISIBLE,
        "ffc"         : apf.xmpp.STATUS_FFC,
        "chatty"      : apf.xmpp.STATUS_FFC,
        "freeforchat" : apf.xmpp.STATUS_FFC
    };

    /**
     * Set the currently connected users' status to the status string provided
     * by sStatus, defaults to 'online'
     * 
     * @param {String} [sStatus] Optional. Possible values: online, offline,
     *                           away, extendedaway, onvacation, dnd,
     *                           donotdisturb, invisible, chatty, freeforchat.
     * @type  {void}
     */
    this.setStatus = function(sStatus) {
        sStatus = statusMap[sStatus] || "online";
        
        return this.setPresence(sStatus, sStatus);
    };

    /**
     * Provides the ability to send a (chat-)message to any node inside the user's
     * Roster. If the 'type' property is set, it must be one of the constants in
     * the following format:
     * 'apf.xmpp.MSG_*'
     *
     * @param {String}   to         Must be of the format 'node@domainname.ext'
     * @param {String}   message
     * @param {String}   [thread]   For threading messages, i.e. to log a conversation
     * @param {String}   [type]     Message type, defaults to 'chat'
     * @param {Function} [callback] Synchronisation callback for Datainstructions
     * @type  {void}
     */
    this.sendMessage = function(to, message, thread, type, callback) {
        if (!message) return false;

        //#ifdef __WITH_OFFLINE
        /*
            Note: This mechanism can also be used to only sent chat messages
            to only contacts. This can be more useful than using XMPP's server
            storage solution, because of the feedback to user.
        */
        if (typeof apf.offline != "undefined" && !apf.offline.onLine) {
            if (apf.offline.queue.enabled) {
                //Let's record all the necesary information for future use (during sync)
                var info = {
                    to       : to,
                    message  : message,
                    thread   : thread,
                    callback : callback,
                    type     : type,
                    retry    : function(){
                        _self.sendMessage(this.to, this.message, 
                            this.thread, this.type, this.callback);
                    },
                    $object : [this.name, "new apf.xmpp()"],
                    $retry  : "this.object.sendMessage(this.to, this.message, \
                        this.thread, this.type, this.callback)"
                };

                apf.offline.queue.add(info);

                return true;
            }

            /*
                Apparently we're doing an XMPP call even though we're offline
                I'm allowing it, because the developer seems to know more
                about it than I right now
            */

            //#ifdef __DEBUG
            apf.console.warn("Trying to sent XMPP message even though \
                              application is offline.", "xmpp");
            //#endif
        }
        //#endif

        if (!getVar("connected")) return false;

        var bRoom = (this.canMuc && type == "groupchat"),
            oUser;
        // #ifdef __TP_XMPP_ROSTER
        if (!to && !bRoom) { //What is the purpose of this functionality? (Ruben)
            oUser = getVar("roster").getLastAvailableEntity();
            to    = bRoom ? oUser.bareJID : oUser.fullJID;
        }
        // #endif
        if (!to) return false; //finally: failure :'(
        // #ifdef __TP_XMPP_ROSTER
        if (!oUser && !bRoom)
            oUser = getVar("roster").getEntityByJID(to);
        // #endif

        var sMsg = createMessageBlock({
            type       : type || apf.xmpp.MSG_CHAT,
            to         : (oUser && !bRoom) ? oUser.fullJID : to,
            thread     : thread,
            "xml:lang" : "en"
        },
        "<![CDATA[" + message + "]]>");

        this.$doXmlRequest(function(data, state, extra){
                if (callback)
                    callback.call(this, data, state, extra);

                restartListener(data, state, extra);
            }, this.$isPoll
            ? createStreamElement(null, null, sMsg)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$getVar("SID"),
                xmlns : apf.xmpp.NS.httpbind
            }, sMsg)
        );
    };

    /**
     * Makes sure that a few header are sent along with all the requests to the
     * XMPP server. This function overrides the abstract found in apf.http
     *
     * @see teleport.http
     * @param {Object} http
     * @type {void}
     */
    this.$HeaderHook = function(http) {
        http.setRequestHeader("Host", this.domain);
        http.setRequestHeader("Content-Type", this.$isPoll
            ? "application/x-www-form-urlencoded"
            : "text/xml; charset=utf-8");
    };

    /**
     * This is the connector function between the AML representation of this
     * Teleport module. If specified, it will also setup the Remote SmartBinding
     * feature.
     *
     * @attribute {String}   url              The URL to the XMPP/ Jabber server, including protocol, hostname and port number
     * @attribute {String}   [type]           The type of method used to connect to the server. Defaults to 'binding'
     *   Possible values:
     *   poll
     *   bosh
     * @attribute {Number}   [poll-timeout]   The number of milliseconds between each poll-request
     * @attribute {String}   [resource]       Name that will identify this client as it logs on the the Jabber network. Defaults to the application name.
     * @attribute {Boolean}  [auto-register]  Specifies if an entered username should be registered on the Jabber network automatically. Defaults to 'false'.
     * @attribute {String}   [auto-accept]    Specifies if an icoming presence subscription request should be accepted automatically. Defaults to 'true'
     * @attribute {String}   [auto-deny]      Specifies if an icoming presence subscription request should be denied automatically. Defaults to 'false'
     * @attribute {String}   model            Name of the model which will store the Roster items
     * @attribute {String}   [model-contents] Specifies the items that will be stored inside the model. Defaults to 'all'
     *   Possible values:
     *   all
     *   roster
     *   chat
     *   typing
     *   roster|typing
     *   roster|chat
     *   chat|typing
     *
     * @param     {XMLDom} x An XML document element that contains xmpp metadata
     * @type      {void}
     * @exception {Error}  A general Error object
     */
    this.load = function(x){
        this.server  = apf.parseExpression(x.getAttribute("url"));
        var i, l, url   = new apf.url(this.server);

        // do some extra startup/ syntax error checking
        if (!url.host || !url.protocol) {
            throw new Error(apf.formatErrorString(0, this, 
                "XMPP initialization error", 
                "Invalid XMPP server url provided."));
        }

        this.domain  = url.host;
        this.tagName = "xmpp";

        this.xmppMethod = (x.getAttribute("type") == "polling")
            ? apf.xmpp.CONN_POLL
            : apf.xmpp.CONN_BOSH;

        this.$isPoll    = Boolean(this.xmppMethod & apf.xmpp.CONN_POLL);
        if (this.$isPoll)
            this.pollTimeout = parseInt(x.getAttribute("poll-timeout")) || 2000;

        this.timeout      = parseInt(x.getAttribute("timeout")) || this.timeout;
        this.resource     = apf.parseExpression(x.getAttribute("resource"))
                             || apf.appsettings.name;
        this.autoRegister = apf.isTrue(x.getAttribute("auto-register"));
        this.autoConfirm  = apf.isFalse(x.getAttribute("auto-confirm"));
        this.autoDeny     = apf.isTrue(x.getAttribute("auto-deny"));

        // #ifdef __TP_XMPP_ROSTER
        // provide a virtual Model to make it possible to bind with this XMPP
        // instance remotely.
        // We agreed on the following format for binding: model-contents="roster|typing|chat"
        var sModel        = x.getAttribute("model"),
            aContents     = (x.getAttribute("model-contents") || "all")
                            .splitSafe("\\|", 0, true);
        this.modelContent = {
            roster: aContents[0] == "all",
            chat  : aContents[0] == "all",
            typing: aContents[0] == "all"
        };
        for (i = 0, l = aContents.length; i < l; i++) {
            aContents[i] = aContents[i].trim();
            if (!this.modelContent[aContents[i]])
                this.modelContent[aContents[i]] = true;
        }
        if (sModel && aContents.length) {
            this.oModel = apf.setReference(sModel,
                apf.nameserver.register("model", sModel, new apf.model()));
            // set the root node for this model
            this.oModel.id   = 
            this.oModel.name = sModel;
            this.oModel.load("<xmpp/>");
        }
        // #endif

        // #ifdef __TP_XMPP_MUC
        // parse MUC parameters
        this.mucDomain = x.getAttribute("muc-domain") || "conference."
                         + this.domain;
        var sMucModel  = x.getAttribute("muc-model");
        if (sMucModel) {
            this.canMuc    = true;
            this.oMucModel = apf.setReference(sMucModel,
                apf.nameserver.register("model", sMucModel, new apf.model()));
            // set the root node for this model
            this.oMucModel.id   =
            this.oMucModel.name = sMucModel;
            this.oMucModel.load("<xmpp_muc/>");

            // magic!
            this.implement(apf.xmpp_muc);
        }
        else {
            this.canMuc = false;
        }
        // #endif

        // parse any custom events formatted like 'onfoo="doBar();"'
        var attr = x.attributes;
        for (i = 0, l = attr.length; i < l; i++) {
            if (attr[i].nodeName.indexOf("on") == 0)
                this.addEventListener(attr[i].nodeName,
                    new Function(attr[i].nodeValue));
        }
    };
};

// Collection of shorthands for all namespaces known and used by this class
apf.xmpp.NS   = {
    sasl       : "urn:ietf:params:xml:ns:xmpp-sasl",
    httpbind   : "http://jabber.org/protocol/httpbind",
    bosh       : "urn:xmpp:xbosh",
    jabber     : "jabber:client",
    bind       : "urn:ietf:params:xml:ns:xmpp-bind",
    session    : "urn:ietf:params:xml:ns:xmpp-session",
    auth       : "jabber:iq:auth",
    roster     : "jabber:iq:roster",
    register   : "jabber:iq:register",
    data       : "jabber:x:data",
    stream     : "http://etherx.jabber.org/streams",
    disco_info : "http://jabber.org/protocol/disco#info",
    disco_items: "http://jabber.org/protocol/disco#items",
    muc        : "http://jabber.org/protocol/muc",
    muc_user   : "http://jabber.org/protocol/muc#user"
};

apf.xmpp.CONN_POLL = 0x0001;
apf.xmpp.CONN_BOSH = 0x0002;

apf.xmpp.ERROR_AUTH = 0x0004;
apf.xmpp.ERROR_CONN = 0x0008;

apf.xmpp.SUBSCR_FROM = "from";
apf.xmpp.SUBSCR_TO   = "to";
apf.xmpp.SUBSCR_BOTH = "both";
apf.xmpp.SUBSCR_NONE = "none";

apf.xmpp.TYPE_AVAILABLE   = ""; //no need to send 'available'
apf.xmpp.TYPE_UNAVAILABLE = "unavailable";
apf.xmpp.TYPE_PROBE       = "probe";
apf.xmpp.TYPE_SUBSCRIBED  = "subscribed";
apf.xmpp.TYPE_SUBSCRIBE   = "subscribe";
apf.xmpp.TYPE_UNSUBSCRIBE = "unsubscribe";
apf.xmpp.TYPE_UNSUBSCRIBED= "unsubscribed";

apf.xmpp.STATUS_ONLINE    = "online";
apf.xmpp.STATUS_OFFLINE   = "offline";
apf.xmpp.STATUS_SHOW      = "show";
apf.xmpp.STATUS_AWAY      = "away";
apf.xmpp.STATUS_XA        = "xa";
apf.xmpp.STATUS_DND       = "dnd";
apf.xmpp.STATUS_INVISIBLE = "invisible";
apf.xmpp.STATUS_FFC       = "chat";

apf.xmpp.MSG_CHAT      = "chat";
apf.xmpp.MSG_GROUPCHAT = "groupchat";
apf.xmpp.MSG_ERROR     = "error";
apf.xmpp.MSG_HEADLINE  = "headline";
apf.xmpp.MSG_NORMAL    = "normal";

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
apf.datainstr.xmpp = function(xmlContext, options, callback){
    var parsed = options.parsed || this.parseInstructionPart(
        options.instrData.join(":"), xmlContext, options.args, options);

    if (options.preparse) {
        options.parsed = parsed;
        options.preparse = -1;
        return;
    }

    var oXmpp, name = parsed.name.split(".");
    if (name.length == 1) {
        var modules = apf.teleport.modules;
        for (var i = 0; i < modules.length; i++) {
            if (modules[i].obj.tagName == "xmpp") {
                oXmpp = modules[i].obj;
                break;
            }
        }
    }
    else {
        oXmpp = self[name[0]];
    }
    
    //#ifdef __DEBUG
    if (!oXmpp) {
        throw new Error(apf.formatErrorString(0, null, "Saving/Loading data", 
            name.length
                ? "Could not find XMPP object by name '" + name[0] + "' in \
                   data instruction '" + options.instruction + "'"
                : "Could not find any XMPP object to execute data \
                   instruction with"));
    }
    //#endif
    
    var args = parsed.arguments;
    switch(name.shift()){
        case "login":
            oXmpp.connect(args[0], args[1], args[2] || false, callback);
            break;
        case "logout":
            oXmpp.disconnect(callback);
            break;
        case "notify":
            oXmpp.sendMessage(args[1], args[0], args[2], args[3], callback);
            break;
        // #ifdef __TP_XMPP_ROSTER
        case "add":
            oXmpp.addContact(args[0], callback);
        // #endif
        default:
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, null, "Saving/Loading data", 
                "Invalid XMPP data instruction '" + options.instruction + "'"));
            //#endif
            break;
    }
};

// #endif

// #endif
