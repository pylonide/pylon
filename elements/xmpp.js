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
// #define __AMLTELEPORT 1

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
 *  submission="{myXmpp.notify([@bar], 'john@my-jabber-server.com')}"
 *  submission="{myXmpp.login([@foo], [@bar])}"
 *  submission="{myXmpp.logout()}"
 * </code>
 *
 * @event authfailure Fires when the authentication process failed or halted.
 *   bubbles: yes
 *   cancelable: Prevents an authentication failure to be thrown
 *   object:
 *     {String}        username   the username used for the login attempt
 *     {String}        server     the server address (URI) of the XMPP server
 *     {String}        message    a more detailed explanation of the error
 * @event connectionerror Fires when the connection with the XMPP server dropped.
 *   bubbles: yes
 *   cancelable: Prevents an connection error to be thrown
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
 *     {String}        data       the data-instruction of the changed data that
 *                                the RSB implementation can grok
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

apf.xmpp = function(struct, tagName){
    this.$init(tagName || "xmpp", apf.NODE_HIDDEN, struct);

    this.$serverVars = {};
    this.$reqCount   = 0;
    this.$reqStack   = [];
    this.$listening  = false;
    this.$listener   = null;
    this.$sAJAX_ID   = this.$makeUnique("ajaxRSB");
    this.$retryCount = 0;
    this.$RID        = null;
};

(function() {
    this.$server     = null;
    this.timeout     = 10000;
    this.maxrequests = 2;
    this.useHTTP     = true;
    this.method      = "POST";

    this.$model         = null;
    this.$modelContent  = null;
    this.$xmppMethod    = apf.xmpp.CONN_BOSH;
    this.$isPoll        = false;
    this.$pollTimeout   = 2000;
    this.$autoRegister  = false;
    this.$autoConfirm   = true;
    this.$autoDeny      = false;
    this.$canMuc        = false;
    this.$modelContent  = {
        roster: true,
        chat  : true,
        typing: true
    };

    // munge often-used strings
    var SID     = "SID",
        JID     = "JID",
        CONN    = "connected",
        ROSTER  = "roster";

    /**
     * @attribute {String}   [type]           The type of method used to connect
     *                                        to the server. Defaults to 'binding'
     *   Possible values:
     *   poll
     *   binding
     * @attribute {Number}   [poll-timeout]   The number of milliseconds between
     *                                        each poll-request
     * @attribute {String}   [resource]       Name that will identify this client as it
     *                                        logs on the the Jabber network.
     *                                        Defaults to the application name.
     * @attribute {Boolean}  [auto-register]  Specifies if an entered username
     *                                        should be registered on the Jabber
     *                                        network automatically. Defaults to 'false'.
     * @attribute {String}   [auto-accept]    Specifies if an icoming presence
     *                                        subscription request should be accepted
     *                                        automatically. Defaults to 'true'
     * @attribute {String}   [auto-deny]      Specifies if an icoming presence
     *                                        subscription request should be denied
     *                                        automatically. Defaults to 'false'
     * @attribute {String}   [model]          Name of the model where roster and
     *                                        (chat) messages will be synchronized to.
     * @attribute {String}   [model-contents] Specifies the items that will be
     *                                        stored inside the model. Defaults to 'all'
     *   Possible values:
     *   all
     *   roster
     *   chat
     *   typing
     *   roster|typing
     *   roster|chat
     *   chat|typing
     * @attribute {String}   [muc-domain]     Domain name of the Multi User Chat
     *                                        service of an XMPP server. Defaults
     *                                        to the domain that is parsed from
     *                                        {@link element.xmpp.url}.
     * @attribute {String}   [muc-model]      Name of the model where chat messages
     *                                        sent and received from Multi User
     *                                        Chats will be synchronized to.
     */
    this.$booleanProperties["auto-register"] = true;
    this.$booleanProperties["auto-confirm"]  = true;
    this.$booleanProperties["auto-deny"]     = true;

    this.$supportedProperties.push("poll-timeout", "resource", "auto-register",
        "auto-confirm", "auto-deny", "model", "model-contents", "muc-domain",
        "muc-model");

    this.$propHandlers["type"] = function(value) {
        this.$xmppMethod = (value == "polling")
            ? apf.xmpp.CONN_POLL
            : apf.xmpp.CONN_BOSH;

        this.$isPoll = Boolean(this.$xmppMethod & apf.xmpp.CONN_POLL);
    };

    this.$propHandlers["poll-timeout"] = function(value) {
        this.$pollTimeout = parseInt(value) || 2000;
    };

    this.$propHandlers["resource"] = function(value) {
        this.resource = value || apf.config.name || "apf".appendRandomNumber(5);
    };

    this.$propHandlers["auto-register"] = function(value) {
        this.$autoRegister = value;
    };

    this.$propHandlers["auto-confirm"] = function(value) {
        this.$autoConfirm = value;
    };

    this.$propHandlers["auto-deny"] = function(value) {
        this.$autoDeny = value;
    };

    // #ifdef __TP_XMPP_ROSTER
    this.$propHandlers["model"] = function(value) {
        if (!value) return;
        // provide a virtual Model to make it possible to bind with this XMPP
        // instance remotely.
        // We agreed on the following format for binding: model-contents="roster|typing|chat"
        this.$model = apf.setReference(value,
            apf.nameserver.register("model", value, new apf.model()));
        // set the root node for this model
        this.$model.id = this.$model.name = value;
        this.$model.load("<xmpp/>");
    };

    this.$propHandlers["model-contents"] = function(value) {
        var aContents = (value || "all").splitSafe("\\|", 0, true),
            i         = 0,
            l         = aContents.length;
        this.$modelContent = {
            roster: aContents[0] == "all",
            chat  : aContents[0] == "all",
            typing: aContents[0] == "all"
        };
        for (; i < l; i++) {
            aContents[i] = aContents[i].trim();
            if (!this.$modelContent[aContents[i]])
                this.$modelContent[aContents[i]] = true;
        }
    };
    // #endif

    // #ifdef __TP_XMPP_MUC
    this.$propHandlers["muc-model"] = function(value) {
        // parse MUC parameters
        this.$mucDomain = this["muc-domain"] || "conference." + this.$domain;
        if (value) {
            this.$canMuc   = true;
            this.$mucModel = apf.setReference(value,
                apf.nameserver.register("model", value, new apf.model()));
            // set the root node for this model
            this.$mucModel.id   =
            this.$mucModel.name = value;
            this.$mucModel.load("<xmpp_muc/>");

            // magic!
            this.implement(apf.xmpp_muc);
        }
    };
    // #endif

    /*
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

    /*
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

    /*
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
        var aOut = [this.$serverVars[SID] || "0", ","];

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

    /*
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

    /*
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

    /*
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

    /*
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

    /*
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
        var aOut = ["<message xmlns='", apf.xmpp.NS.jabber, "' from='", 
            this.$serverVars[JID], "' to='", options.to, "' id='message_",
            ++this.$serverVars["mess_count"], "' xml:lang='",
            options["xml:lang"], "'"];
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

    /*
     * Special version of getVar('RID'), because RID needs to upped by one each
     * time a request is sent to the XMPP server.
     *
     * @type {Number}
     * @private
     */
    this.$getRID = function() {
        if (this.$RID === null)
            this.$RID = parseInt("".appendRandomNumber(10));
        return this.$RID++;
    };

    // expose functions to interfaces:
    this.$makeUnique          = makeUnique;
    this.$createBodyElement   = createBodyElement;
    this.$createStreamElement = createStreamElement;
    this.$createIqBlock       = createIqBlock;
    this.$createPresenceBlock = createPresenceBlock;
    this.$createMessageBlock  = createMessageBlock;

    /*
     * Generic function that provides a basic method for making HTTP calls to
     * the XMPP server and processing the response in retries, error messages
     * or through a custom callback.
     *
     * @param     {Function} cb      Callback handling function to be executed when
     *                               the response is available
     * @param     {String}   s       Body of the request, usually an XML stanza
     * @param     {Boolean}  bIsBind Specifies whether this message is a message
     *                               sent over the established connection or a
     *                               protocol message. The user messages are
     *                               recorded when offline and sent when the
     *                               application comes online again.
     * @exception {Error}    A general Error object
     * @type      {XMLHttpRequest}
     */
    this.$doXmlRequest = function(cb, s) {
        if (cb && s)
            this.$reqStack.push({callback: cb, body: s});

        // execute this specific call AFTER the current one has finished...
        if (this.$reqCount >= this.maxrequests)
            return null;

        var _self = this,
            req   = this.$reqStack.shift();
        ++this.$reqCount;
        return this.get(this.url, {
            callback: function(data, state, extra) {
                --_self.$reqCount;
                if (_self.$reqStack.length)
                    _self.$doXmlRequest();

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
                    
                    if (typeof req.callback == "function") {
                        req.callback.call(_self, data, state, extra);
                        return true;
                    }
                    else if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                        return true;
                    
                    //@TBD:Mike please talk to me about how to integrate onError() properly
                    onError.call(_self, apf.xmpp.ERROR_CONN, extra.message, state);
                    throw oError;
                }

                if (typeof req.callback == "function")
                    req.callback.call(_self, data, state, extra);
            }, 
            nocache       : true,
            useXML        : !this.$isPoll,
            ignoreOffline : true,
            data          : req.body || ""
        });
    };

    /*
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
            if (this.$retryCount == 3) {
                this.$retryCount = 0;
                clearTimeout(this.$listener);
                this.$listener = null;
                return this.connect(this.$serverVars["username"], this.$serverVars["password"],
                    this.$serverVars["login_callback"],
                    this.$serverVars["register"] || this.$autoRegister)
            }
            this.$retryCount++;
        }
        else {
            this.$retryCount = 0;
        }

        var bIsAuth = nType & apf.xmpp.ERROR_AUTH,
            bIsConn = nType & apf.xmpp.ERROR_CONN;

        // #ifdef __DEBUG
        apf.console.log("[XMPP-" + (bIsAuth
            ? "AUTH"
            : bIsConn ? "CONN" : "REG")
            + "] onError called.", "xmpp");
        // #endif
        clearTimeout(this.$listener);
        this.$listener = null;
        //delete this.$serverVars["password"];

        var extra = {
            username : this.$serverVars["username"],
            server   : this.url,
            message  : sMsg || (bIsAuth
                ? "Access denied. Please check your username or password."
                : bIsConn 
                    ? "Could not connect to server, please contact your System Administrator."
                    : "Could not register for a new user account")
        },
        cb = this.$serverVars["login_callback"];
        if (cb) {
            delete this.$serverVars["login_callback"];
            return cb(null, nState || apf.ERROR, extra);
        }

        // #ifdef __DEBUG
        apf.console.error(extra.message + " (username: " + extra.username
                          + ", server: " + extra.server + ")", "xmpp");
        // #endif

        return this.dispatchEvent(bIsAuth
            ? "authfailure"
            : bIsConn ? "connectionerror" : "registererror", extra);
    }

    /**
     * Connect to the XMPP server with a username and password combination
     * provided.
     *
     * @param {String}   username   Name of the user on the XMPP server Virtual
     *                              Host
     * @param {String}   password   Password of the user
     * @param {Function} [callback] Function that will be called after the Async
     *                              login request
     * @param {Boolean}  [reg]      Specifies whether to auto-register a new user
     * @type  {void}
     */
    this.connect = function(username, password, callback, reg) {
        this.reset();

        this.$serverVars["username"]       = username;
        this.$serverVars["password"]       = password;
        this.$serverVars["login_callback"] = callback;
        this.$serverVars["register"]       = reg || this.$autoRegister;
        this.$serverVars["previousMsg"]    = [];
        // #ifdef __TP_XMPP_ROSTER
        this.$serverVars[ROSTER].registerAccount(username, this.$domain);
        // #endif
        // #ifdef __TP_XMPP_MUC
        if (this.$canMuc)
            this.$mucRoster.registerAccount(username, this.$domain);
        // #endif
        this.$doXmlRequest(processConnect, this.$isPoll
            ? createStreamElement.call(this, null, {
                doOpen         : true,
                to             : this.$domain,
                xmlns          : apf.xmpp.NS.jabber,
                "xmlns:stream" : apf.xmpp.NS.stream,
                version        : "1.0"
              })
            : createBodyElement({
                content        : "text/xml; charset=utf-8",
                hold           : "1",
                rid            : this.$getRID(),
                to             : this.$domain,
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
     * @param {Function} callback Data instruction callback that will be called
     *                            after the Async request
     * @type {void}
     */
    this.disconnect = function(callback) {
        if (this.$serverVars[CONN]) {
            if (callback)
                this.$serverVars["logout_callback"] = callback;
            // #ifdef __TP_XMPP_MUC
            if (this.$canMuc)
                this.leaveAllRooms();
            // #endif
            this.$doXmlRequest(processDisconnect, this.$isPoll
                ? createStreamElement.call(this, null, {
                    doClose: true
                  })
                : createBodyElement({
                      pause : 120,
                      rid   : this.$getRID(),
                      sid   : this.$serverVars[SID],
                      xmlns : apf.xmpp.NS.httpbind
                  })
            );
        }
        else {
            this.reset();
            if (callback)
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
        var oRoster = this.$serverVars[ROSTER];
        if (oRoster)
            oRoster.reset();
        // #ifdef __TP_XMPP_MUC
        if (this.$canMuc && this.$mucRoster)
            this.$mucRoster.reset();
        // #endif
        // unregister ALL variables:
        for (var i in this.$serverVars)
            delete this.$serverVars[i];

        // apply some initial values to the serverVars global scoped Array
        this.$RID = null;
        this.$serverVars["cnonce"] = generateCnonce(14);
        this.$serverVars["nc"]     = "00000001";
        this.$serverVars[CONN]     = false;
        // #ifdef __TP_XMPP_ROSTER
        this.$serverVars[ROSTER]   = new apf.xmpp_roster(this.$model,
           this.$modelContent, this.resource);
        // #endif
        this.$serverVars["bind_count"] = 0;
        this.$serverVars["mess_count"] = 0;

    };

    /*
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
            return onError.call(this, apf.xmpp.ERROR_CONN, extra.message, state);

        // reset retry/ connection counter
        this.$retryCount = 0;
        if (!this.$isPoll) {
            this.$serverVars[SID]       = oXml.getAttribute("sid");
            this.$serverVars["AUTH_ID"] = oXml.getAttribute("authid");
        }
        else {
            var aCookie = extra.http.getResponseHeader("Set-Cookie").splitSafe(";");
            this.$serverVars[SID]       = aCookie[0].splitSafe("=")[1];
            this.$serverVars["AUTH_ID"] = oXml.firstChild.getAttribute("id");
        }

        var oMech  = oXml.getElementsByTagName("mechanisms")[0],
            sXmlns = oMech.getAttribute("xmlns");
        // @todo apf3.0 hack for o3, remove when o3 is fixed
        this.$serverVars["AUTH_SASL"] = apf.isO3 || (sXmlns && sXmlns == apf.xmpp.NS.sasl);

        var aNodes = oXml.getElementsByTagName("mechanism"),
            i      = 0,
            l      = aNodes.length,
            found  = false,
            sMech;
        for (; i < l && !found; i++) {
            sMech = aNodes[i].firstChild.nodeValue;
            if (sMech == "DIGEST-MD5" || sMech == "PLAIN") {
                this.$serverVars["AUTH_TYPE"] = sMech;
                found = true;
            }
        }

        // feature detection:
        aNodes = oXml.getElementsByTagName("register");
        for (i = 0, l = aNodes.length; i < l; i++) {
            this.$serverVars["AUTH_REG"] =
                (aNodes[i].getAttribute("xmlns") == apf.xmpp.NS.feature_reg);
        }

        if (!found) {
            return onError.call(this, apf.xmpp.ERROR_AUTH,
                "No supported authentication protocol found. We cannot continue!");
        }
        return (this.$serverVars["AUTH_REG"] && this.$serverVars["register"])
            ? doRegRequest.call(this)
            : doAuthRequest.call(this);
    }

    /*
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
                + this.$serverVars["username"] + "</username><password>"
                + this.$serverVars["password"] + "</password></query>"
        ),
        _self = this;
        this.$doXmlRequest(function(oXml) {
                if (oXml && oXml.nodeType) {
                    var iq = oXml.getElementsByTagName("iq")[0];
                    if ((iq && iq.getAttribute("type") == "error")
                      || oXml.getElementsByTagName("error").length) {
                        onError.call(_self, apf.xmpp.ERROR_REG,
                            "New account registration for account '"
                            + this.$serverVars["username"] + " failed.");
                    }
                    // registration successful, proceed with authentication
                    doAuthRequest.call(_self);
                }
                //#ifdef __DEBUG
                else if (!_self.$isPoll)
                    onError.call(_self, apf.xmpp.ERROR_CONN, null, apf.OFFLINE);
                //#endif
            }, _self.$isPoll
            ? createStreamElement.call(this, null, null, sIq)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : apf.xmpp.NS.httpbind
            }, sIq)
        );
    }

    /*
     * Proceeds with the authentication process after establishing a connection
     * or stream to the server OR after a successful In-Band registration
     * We also support Non-SASL Authentication
     * @see http://xmpp.org/extensions/attic/jep-0078-1.7.html
     *
     * @type {void}
     */
    function doAuthRequest() {
        if (this.$serverVars["AUTH_SASL"]) {
            // start the authentication process by sending a request
            var sType = this.$serverVars["AUTH_TYPE"],
                sAuth = "<auth xmlns='" + apf.xmpp.NS.sasl + "' mechanism='"
                    + sType + (sType == "PLAIN"
                        ? "'>" + this.$serverVars["username"] + "@" + this.$domain
                            + String.fromCharCode(0) + this.$serverVars["username"]
                            + String.fromCharCode(0) + this.$serverVars["password"]
                            + "</auth>"
                        : "'/>");
            this.$doXmlRequest((sType == "ANONYMOUS" || sType == "PLAIN")
                ? reOpenStream // skip a few steps...
                : processAuthRequest, this.$isPoll
                ? createStreamElement.call(this, null, null, sAuth)
                : createBodyElement({
                      rid   : this.$getRID(),
                      sid   : this.$serverVars[SID],
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
                    + this.$serverVars["username"] + "</username></query>"
            );
            this.$doXmlRequest(processAuthRequest, this.$isPoll
                ? createStreamElement.call(this, null, null, sIq)
                : createBodyElement({
                    rid   : this.$getRID(),
                    sid   : this.$serverVars[SID],
                    xmlns : apf.xmpp.NS.httpbind
                }, sIq)
            );
        }
    }

    /*
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
        var cb = this.$serverVars["logout_callback"];
        this.reset();
        if (cb)
            cb(oXml, state, extra);
    }

    /*
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

        var oChallenge = oXml.getElementsByTagName("challenge");
        if (oChallenge.length && (oChallenge = oChallenge[0])) {
            var i, l, aChunk,
                b64_challenge = oChallenge.firstChild.nodeValue,
                aParts        = apf.crypto.Base64.decode(b64_challenge).split(",");

            for (i = 0, l = aParts.length; i < l; i++) {
                aChunk = aParts[i].split("=");
                this.$serverVars[aChunk[0]] = aChunk[1].trim().replace(/[\"\']/g, "");
            }

            //#ifdef __DEBUG
            apf.console.info("processChallenge: " + aParts.join("    "), "xmpp");
            //#endif
        }

        return true;
    }

    /*
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
        if (this.$serverVars["AUTH_SASL"]) {
            if (!processChallenge.call(this, oXml))
                return onError.call(this, apf.xmpp.ERROR_AUTH);

            var sRealm = this.$serverVars["realm"],
                md5    = apf.crypto.MD5;
            if (!sRealm)
                this.$serverVars["realm"] = sRealm = this.$domain; //DEV: option to provide realm with a default

            if (sRealm)
                this.$serverVars["digest-uri"] = "xmpp/" + sRealm;

            //#ifdef __DEBUG
            apf.console.info("auth - digest-uri: " + this.$serverVars["digest-uri"], "xmpp");
            //#endif

            // for the calculations of A1, A2 and sResp below, take a look at
            // RFC 2617, Section 3.2.2.1
            var A1 = md5.str_md5(this.$serverVars["username"] + ":" + this.$domain
                    + ":" + this.$serverVars["password"]) // till here we hash-up with MD5
                    + ":" + this.$serverVars["nonce"] + ":" + this.$serverVars["cnonce"],

                A2 = "AUTHENTICATE:" + this.$serverVars["digest-uri"],

                sResp = md5.hex_md5(md5.hex_md5(A1) + ":"
                    + this.$serverVars["nonce"] + ":" + this.$serverVars["nc"]
                    + ":" + this.$serverVars["cnonce"]
                    + ":" + this.$serverVars["qop"] + ":" + md5.hex_md5(A2));

            //#ifdef __DEBUG
            apf.console.info("response: " + sResp, "xmpp");
            //#endif

            var sAuth = createAuthBlock({
                username    : this.$serverVars["username"],
                realm       : sRealm,
                nonce       : this.$serverVars["nonce"],
                cnonce      : this.$serverVars["cnonce"],
                nc          : this.$serverVars["nc"],
                qop         : this.$serverVars["qop"],
                "digest-uri": this.$serverVars["digest-uri"],
                response    : sResp,
                charset     : this.$serverVars["charset"]
            });
            this.$doXmlRequest(processFinalChallenge, this.$isPoll
                ? createStreamElement.call(this, null, null, sAuth)
                : createBodyElement({
                      rid   : this.$getRID(),
                      sid   : this.$serverVars[SID],
                      xmlns : apf.xmpp.NS.httpbind
                  }, sAuth)
            );
        }
        else {
            if (oXml && oXml.nodeType) {
                var iq = oXml.getElementsByTagName("iq")[0];
                if ((iq && iq.getAttribute("type") == "error")
                  || oXml.getElementsByTagName("error").length) {
                    return onError.call(this, apf.xmpp.ERROR_AUTH);
                }
                var aDigest,
                    bDigest = (aDigest = oXml.getElementsByTagName("digest")
                                && aDigest[0]),
                    sIq     = createIqBlock({
                        type  : "set",
                        id    : makeUnique("auth")
                    },
                    "<query xmlns='" + apf.xmpp.NS.auth + "'><username>"
                        + this.$serverVars["username"] + "</username><resource>"
                        + this.resource + "</resource>" + (bDigest
                            ? "<digest xmlns='" + apf.xmpp.NS.auth + ">"
                                + apf.crypto.SHA1(this.$serverVars["AUTH_ID"]
                                + this.$serverVars["password"]) + "</digest>"
                            : "<password xmlns='" + apf.xmpp.NS.auth + "'>"
                                + this.$serverVars["password"] + "</password>")
                        + "</query>"
                );
                this.$doXmlRequest(reOpenStream, this.$isPoll
                    ? createStreamElement.call(this, null, null, sIq)
                    : createBodyElement({
                        rid   : this.$getRID(),
                        sid   : this.$serverVars[SID],
                        xmlns : apf.xmpp.NS.httpbind
                    }, sIq)
                );
            }
            //#ifdef __DEBUG
            else if (!this.$isPoll)
                onError.call(this, apf.xmpp.ERROR_CONN, null, apf.OFFLINE);
            //#endif
        }
    }

    /*
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
        if (!processChallenge.call(this, oXml))
            return onError.call(this, apf.xmpp.ERROR_AUTH);

        var sAuth = createAuthBlock({});
        this.$doXmlRequest(reOpenStream, this.$isPoll
            ? createStreamElement.call(this, null, null, sAuth)
            : createBodyElement({
                  rid   : this.$getRID(),
                  sid   : this.$serverVars[SID],
                  xmlns : apf.xmpp.NS.httpbind
              }, sAuth)
        );
    }

    /*
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
        if (this.$serverVars["AUTH_SASL"]) {
            if (!processChallenge.call(this, oXml))
                return onError.call(this, apf.xmpp.ERROR_AUTH);
        }
        else {
            if (oXml && oXml.nodeType) {
                var iq = oXml.getElementsByTagName("iq")[0];
                if ((iq && iq.getAttribute("type") == "error")
                  || oXml.getElementsByTagName("error").length) {
                    return onError.call(this, apf.xmpp.ERROR_AUTH);
                }
                delete this.$serverVars["password"];
            }
            //#ifdef __DEBUG
            else if (!this.$isPoll)
                onError.call(this, apf.xmpp.ERROR_CONN, null, apf.OFFLINE);
            //#endif
        }

        //restart the stream request
        var _self = this;
        this.$doXmlRequest(function(oXml) {
                if (_self.$isPoll || oXml.getElementsByTagName("bind").length) {
                    // Stream restarted OK, so now we can actually start
                    // listening to messages!
                    _self.bind();
                }
            }, this.$isPoll
            ? createStreamElement.call(this, null, {
                doOpen         : true,
                to             : this.$domain,
                xmlns          : apf.xmpp.NS.jabber,
                "xmlns:stream" : apf.xmpp.NS.stream,
                version        : "1.0"
              })
            : createBodyElement({
                  rid            : this.$getRID(),
                  sid            : this.$serverVars[SID],
                  to             : this.$domain,
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
            id    : "bind_" + ++this.$serverVars["bind_count"],
            type  : "set",
            xmlns : this.$isPoll ? null : apf.xmpp.NS.jabber
          },
          "<bind xmlns='" + apf.xmpp.NS.bind + "'>" +
             "<resource>" + this.resource + "</resource>" +
          "</bind>"
        );
        this.$doXmlRequest(processBindingResult, this.$isPoll
            ? createStreamElement.call(this, null, null, sIq)
            : createBodyElement({
                  rid   : this.$getRID(),
                  sid   : this.$serverVars[SID],
                  xmlns : apf.xmpp.NS.httpbind
              }, sIq)
        );
    };

    /*
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
            this.$serverVars[JID] = oJID.firstChild.nodeValue;
            var sIq = createIqBlock({
                    from  : this.$serverVars[JID],
                    id    : this.$sAJAX_ID,
                    to    : this.$domain,
                    type  : "set",
                    xmlns : apf.xmpp.NS.jabber
                },
                "<session xmlns='" + apf.xmpp.NS.session + "'/>"
            ),
            _self = this;
            this.$doXmlRequest(function(oXml) {
                    parseData.call(_self, oXml);
                    setInitialPresence.call(_self);
                }, this.$isPoll
                ? createStreamElement.call(this, null, null, sIq)
                : createBodyElement({
                    rid   : this.$getRID(),
                    sid   : this.$serverVars[SID],
                    xmlns : apf.xmpp.NS.httpbind
                }, sIq)
            );
        }
        else {
            //@todo: check for binding failures!
            onError.call(this, apf.xmpp.ERROR_AUTH);
        }
    }

    /*
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
        }),
        _self = this;
        this.$doXmlRequest(function(oXml) {
                parseData.call(_self, oXml);
                // #ifdef __TP_XMPP_ROSTER
                getRoster.call(_self);
                // #endif
            }, this.$isPoll
            ? createStreamElement.call(this, null, null, sPresence)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : apf.xmpp.NS.httpbind
            }, sPresence)
        );
    }
    // #ifdef __TP_XMPP_ROSTER
    /*
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
                from  : this.$serverVars[JID],
                type  : "get",
                id    : makeUnique("roster")
            },
            "<query xmlns='" + apf.xmpp.NS.roster + "'/>"
        ),
        _self = this,
        v     = this.$serverVars;
        this.$doXmlRequest(function(oXml) {
                parseData.call(_self, oXml);
                _self.$listen();
                var cb  = v["login_callback"],
                    msg = v["previousMsg"];
                if (cb) {
                    cb(null, apf.SUCCESS, {
                        username : v["username"]
                    });
                    delete v["login_callback"];
                }
                // @todo apf3.0 properly test the delayed messaging after reconnect
                if (msg && msg.length) {
                    for (var i = 0, l = msg.length; i < l; i++)
                        _self.sendMessage.apply(_self, msg[i]);
                    delete msg;
                    v["previousMsg"] = [];
                }

                // flag as 'connected'
                v[CONN] = true;
                _self.dispatchEvent(CONN, {username: v["username"]});
            }, this.$isPoll
            ? createStreamElement.call(this, null, null, sIq)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
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
        if (this.$listening === true) return;

        this.$listening = true;

        //#ifdef __DEBUG
        apf.console.info("XMPP: Listening for messages...", "xmpp");
        //#endif

        this.$doXmlRequest(processStream, this.$isPoll
            ? createStreamElement.call(this)
            : createBodyElement({
                  rid   : this.$getRID(),
                  sid   : this.$serverVars[SID],
                  xmlns : apf.xmpp.NS.httpbind
              }, "")
        );
    };

    /*
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
        clearTimeout(this.$listener);
        this.$listener = null;
        if (data || state) {
            if (state != apf.SUCCESS)
                return onError.call(this, apf.xmpp.ERROR_CONN, extra.message, state);
            else
                parseData.call(this, data);
        }

        if (this.$serverVars[CONN] && !this.$listening) {
            var _self = this;
            this.$listener = $setTimeout(function() {
                _self.$listen();
            }, this.$pollTimeout || 0);
        }
    }

    this.$restartListener = restartListener;

    /*
     * Handle the result of the stream listener and messages that arrived need
     * to be processed.
     *
     * @param {Object} oXml
     * @type  {void}
     * @private
     */
    function processStream(oXml, state) {
        clearTimeout(this.$listener);
        this.$listener = null;
        parseData.call(this, oXml);

        var bNoListener = (this.$listening === false); //experimental
        this.$listening = false;

        // start listening again...
        if (this.$serverVars[CONN] && !bNoListener) {
            var _self = this;
            this.$listener = $setTimeout(function() {
                _self.$listen();
            }, this.$pollTimeout || 0);
        }
    }

    /*
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
            this.$serverVars["previousMsg"] = [];
            // do other stuff... like processing the messages? :P
            var aMessages = oXml.getElementsByTagName("message");
            if (aMessages.length)
                parseMessagePackets.call(this, aMessages);

            var aPresence = oXml.getElementsByTagName("presence");
            
            if (aPresence.length)
                parsePresencePackets.call(this, aPresence);

            var aIQs = oXml.getElementsByTagName("iq");
            if (aIQs.length)
                parseIqPackets.call(this, aIQs);
        }
        //#ifdef __DEBUG
        else if (!this.$isPoll)
            onError.call(this, apf.xmpp.ERROR_CONN, null, apf.OFFLINE);
        //#endif
    }

    this.$parseData = parseData;

    /*
     * Retrieve a message by collecting all textnodes from a <body> element.
     *
     * @param {XMLDomElement} oNode
     * @type  {String}
     */
    function getMessage(oNode) {
        var node,
            msg = [],
            i   = 0,
            l   = oNode.childNodes.length;
        for (i = 0; i < l; i++) {
            if ((node = oNode.childNodes[i]) && node.nodeType == 3)
                msg.push(node.nodeValue);
        }
        return msg.join("").replace(/\&quot;/g, '"');
    }

    /*
     * One or more (instant-)messages have are arrived that need to be processed
     * and parsed to eventually show up in the GUI
     *
     * @see teleport.xmpp.methodparseData
     * @param {Array} aMessages
     * @type  {void}
     * @private
     */
    function parseMessagePackets(aMessages) {
        var sMsg, sFrom, sJID, oBody, bRoom,
            i = 0,
            l = aMessages.length;

        for (; i < l; i++) {
            sJID  = aMessages[i].getAttribute("from");
            bRoom = (aMessages[i].getAttribute("type") == "groupchat");
            // #ifdef __TP_XMPP_ROSTER
            if (sJID && !bRoom)
                this.$serverVars[ROSTER].getEntityByJID(sJID); //unsed var...yet?
            // #endif

            if (aMessages[i].getAttribute("type") == "chat" || bRoom) {
                oBody = aMessages[i].getElementsByTagName("body")[0];
                if (!(oBody && oBody.childNodes.length)) continue;
                
                sFrom = aMessages[i].getAttribute("from");
                sMsg  = getMessage(oBody);
                // #ifdef __TP_XMPP_ROSTER
                // #ifdef __TP_XMPP_MUC
                if (bRoom && sFrom == this.$mucRoster.fullJID)
                    return;
                // #endif
                if ((bRoom ? this.$mucRoster : this.$serverVars[ROSTER])
                  .updateMessageHistory(sFrom, sMsg)) {
                // #endif
                    this.dispatchEvent("receivechat", {
                        from   : sFrom,
                        message: sMsg
                    });
                // #ifdef __TP_XMPP_ROSTER
                }
                // #endif
            }
            else if (aMessages[i].getAttribute("type") == "normal") { //normal = Remote SmartBindings
                oBody = aMessages[i].getElementsByTagName("body")[0];
                if (!(oBody && oBody.childNodes.length)) continue;

                //Remote SmartBindings support
                sMsg = getMessage(oBody);
                //#ifdef __DEBUG
                apf.console.info("received the following from the server: "
                    + sMsg, "xmpp");
                //#endif
                this.dispatchEvent("datachange", { data: sMsg });
            }
        }
    }

    /*
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
        apf.console.info("parsePresencePackets: " + aPresence.length, "xmpp");
        //#endif
        // #ifdef __TP_XMPP_ROSTER
        for (var i = 0, l = aPresence.length; i < l; i++) {
            var sJID = aPresence[i].getAttribute("from"),
                aX   = aPresence[i].getElementsByTagName("x"),
                bMuc = (sJID.indexOf(this.$mucDomain) > -1);
            // #ifdef __TP_XMPP_MUC
            if (aX.length) {
                for (var o, k = 0, l2 = aX.length; k < l2; k++) {
                    switch (aX[k].getAttribute("xmlns")) {
                        case apf.xmpp.NS.muc_user:
                            if (this.$getStatusCode(aX[k], 201)) {
                                this.$mucSignal(apf.xmpp_muc.ROOM_CREATE, sJID);
                                break;
                            }
                            // status code=110 means ME
                            if (!this.$isRoom(sJID) || this.$getStatusCode(aX[k], 110))
                                break;
                            o = aX[k].getElementsByTagName("item")[0];
                            if (!o) break;
                            this.$mucRoster.getEntityByJID(sJID, {
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
                var oRoster = this.$serverVars[ROSTER],
                    oUser   = oRoster.getEntityByJID(sJID),
                    sType   = aPresence[i].getAttribute("type");
                    
                if (sType == apf.xmpp.TYPE_SUBSCRIBE) {
                    // incoming subscription request, deal with it!
                    incomingAdd.call(this, aPresence[i].getAttribute("from"));
                }
                // record any status change...
                if (oUser)
                    oRoster.update(oUser, sType || apf.xmpp.TYPE_AVAILABLE);
            }
        }
        // #endif
    }

    /*
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
        apf.console.info("parseIqPackets: " + aIQs.length, "xmpp");
        //#endif

        for (var i = 0, l = aIQs.length; i < l; i++) {
            if (aIQs[i].getAttribute("type") != "result"
              && aIQs[i].getAttribute("type") != "error") continue;
            var aQueries = aIQs[i].getElementsByTagName("query"),
                sFrom    = aIQs[i].getAttribute("from");
            for (var j = 0, l2 = aQueries.length; j < l2; j++) {
                var aItems, k, l3;
                switch (aQueries[j].getAttribute("xmlns")) {
                    // #ifdef __TP_XMPP_ROSTER
                    case apf.xmpp.NS.roster:
                        aItems  = aQueries[j].getElementsByTagName("item");
                        var oRoster = this.$serverVars[ROSTER],
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
                                confirmAdd.call(this, oContact);
                        }
                        if (pBlocks.length)
                            this.requestPresence(pBlocks);
                        break;
                    // #endif
                    // #ifdef __TP_XMPP_MUC
                    case apf.xmpp.NS.disco_items:
                        if (!this.$canMuc) break;

                        var aErrors = aIQs[i].getElementsByTagName("error");
                        if (aErrors.length
                          && parseInt(aErrors[0].getAttribute("code")) == 404) {
                            // room not found, signal failure...
                            this.$mucSignal(apf.xmpp_muc.ROOM_NOTFOUND, sFrom);
                            break;
                        }

                        // no error found, we continue...
                        aItems = aQueries[j].getElementsByTagName("item");
                        var oRoom = this.$addRoom(sFrom, sFrom.split("@")[0]),
                            sJID;

                        this.$mucSignal(apf.xmpp_muc.ROOM_EXISTS, sFrom);

                        // @todo: add support for paging (<set> element)
                        for (k = 0, l3 = aItems.length; k < l3; k++) {
                            sJID  = aItems[k].getAttribute("jid");
                            if (sJID.indexOf("/") != -1)
                                this.$addRoomOccupant(sJID);
                            else if (aItems[k].hasAttribute("name"))
                                oRoom.subscription = aItems[k].getAttribute("name");
                        }
                        break;
                    case apf.xmpp.NS.muc_user:
                        // @todo implement;
                        break;
                    case apf.xmpp.NS.muc_owner:
                        this.$mucSignal(apf.xmpp_muc.ROOM_CREATE, sFrom);
                        break;
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
        if (!this.$serverVars[CONN]) return false;

        this.$doXmlRequest(restartlistener, createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
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
        if (!this.$serverVars[CONN]) return false;
        // #ifdef __TP_XMPP_ROSTER
        var oRoster = this.$serverVars[ROSTER];
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

        this.$doXmlRequest(restartListener, this.$isPoll
            ? createStreamElement.call(this, null, null, sPresence)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
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
        var oRoster  = this.$serverVars[ROSTER],
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
        ),
        _self = this;
        this.$doXmlRequest(function(oXml) {
                parseData.call(_self, oXml);
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
                                ? onError.call(_self, apf.xmpp.ERROR_CONN, null, apf.OFFLINE)
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

                                restartListener.call(_self, data, state, extra);
                            }, _self.$isPoll
                                ? createStreamElement.call(this, null, null, sPresence)
                                : createBodyElement({
                                    rid   : this.$getRID(),
                                    sid   : this.$serverVars[SID],
                                    xmlns : apf.xmpp.NS.httpbind
                                }, sPresence)
                            );
                        }
                        // all other events should run through the parseData()
                        // function and delegated to the Roster
                    }, _self.$isPoll
                    ? createStreamElement.call(_self, null, null, sPresence)
                    : createBodyElement({
                        rid   : _self.$getRID(),
                        sid   : _self.$serverVars[SID],
                        xmlns : apf.xmpp.NS.httpbind
                    }, sPresence)
                );
            }, this.$isPoll
            ? createStreamElement.call(this, null, null, sIq)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : apf.xmpp.NS.httpbind
            }, sIq)
        );
        // #endif
    };
    // #ifdef __TP_XMPP_ROSTER
    /*
     * Handler function that takes care of responses to the XMPP server upon
     * presence subscription request of the current user.
     * Depending on the settings of {@link attribute.auto-accept} and
     * {@link attribute.auto-deny} a contact will be denied to the Roster or
     * added.
     *
     * @param {String} sJID Contact that requested a subscription the user's
     *                      presence information
     * @type  {void}
     * @private
     */
    function incomingAdd(sJID) {
        if (this.$autoConfirm) {
            var sMsg = createIqBlock({
                    from  : this.$serverVars[JID],
                    type  : "get",
                    id    : makeUnique("roster")
                },
                "<query xmlns='" + apf.xmpp.NS.roster + "'><item jid='" + sJID
                    + "' /></query>"
            ) +  createPresenceBlock({
                type  : apf.xmpp.TYPE_SUBSCRIBED,
                to    : sJID
            });
            this.$doXmlRequest(restartListener, this.$isPoll
                ? createStreamElement.call(this, null, null, sMsg)
                : createBodyElement({
                    rid   : this.$getRID(),
                    sid   : this.$serverVars[SID],
                    xmlns : apf.xmpp.NS.httpbind
                }, sMsg)
            );
        }
        if (this.$autoDeny) {
            // <presence to='user@example.com' type='unsubscribed'/>
            var sPresence = createPresenceBlock({
                type  : apf.xmpp.TYPE_UNSUBSCRIBED,
                to    : sJID
            });
            this.$doXmlRequest(restartListener, this.$isPoll
                ? createStreamElement.call(this, null, null, sPresence)
                : createBodyElement({
                    rid   : this.$getRID(),
                    sid   : this.$serverVars[SID],
                    xmlns : apf.xmpp.NS.httpbind
                }, sPresence)
            );
        }
    }

    /*
     * Handler function that takes care of the final stage of adding a contact
     * to the user's roster: confirmation of the subscription state.
     *
     * @param {Object} oContact Contact that has accepted the invitation to connect
     * @type  {void}
     * @private
     */
    function confirmAdd(oContact) {
        var sPresence = createPresenceBlock({
            type  : apf.xmpp.TYPE_SUBSCRIBED,
            to    : oContact.jid
        });
        this.$doXmlRequest(restartListener, this.$isPoll
            ? createStreamElement.call(this, null, null, sPresence)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
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
        sStatus = statusMap[sStatus] || apf.xmpp.STATUS_ONLINE;
        
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
        var _self = this;

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

        if (!this.$serverVars[CONN]) return false;

        var bRoom = (this.$canMuc && type == "groupchat"),
            aArgs = Array.prototype.slice.call(arguments),
            oUser;
        // #ifdef __TP_XMPP_ROSTER
        if (!bRoom)
            oUser = this.$serverVars[ROSTER].getEntityByJID(to);
        // #endif

        if (!oUser){
            //#ifdef __DEBUG
            throw new Error(apf.formatErrorString(0, this,
                        "XMPP sendMessage error: no valid 'to' address provided",
                        "To: " + to + "\nMessage: " + message));
            //#endif
            return false;
        }

        var sMsg = createMessageBlock.call(this, {
                type       : type || apf.xmpp.MSG_CHAT,
                to         : to,
                thread     : thread,
                "xml:lang" : "en"
            },
            "<![CDATA[" + message + "]]>");

        this.$doXmlRequest(function(data, state, extra){
                if (callback)
                    callback.call(_self, data, state, extra);

                _self.$serverVars["previousMsg"] = aArgs;
                restartListener.call(_self, data, state, extra);
            }, this.$isPoll
            ? createStreamElement.call(this, null, null, sMsg)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : apf.xmpp.NS.httpbind
            }, sMsg)
        );
    };

    //#ifdef __WITH_RSB
    this.sendRSB = function(message) {
        var oRoster = this.$serverVars[ROSTER];
        if (!oRoster) return;
        var aUsers = oRoster.getAllEntities(apf.xmpp.TYPE_AVAILABLE),
            i      = 0,
            l      = aUsers.length;
        for (; i < l; i++)
            this.sendMessage(aUsers[i].bareJID, message, null, apf.xmpp.MSG_NORMAL);
    };
    // #endif

    /**
     * Makes sure that a few header are sent along with all the requests to the
     * XMPP server. This function overrides the abstract found in apf.http
     *
     * @see teleport.http
     * @param {Object} http
     * @type {void}
     */
    this.$headerHook = function(http) {
        http.setRequestHeader("Host", this.$domain);
        http.setRequestHeader("Content-Type", this.$isPoll
            ? "application/x-www-form-urlencoded"
            : "text/xml; charset=utf-8");
    };

    /*
     * Shutdown and disconnect properly from the (running) XMPP session.
     * Disconnect and Garbage Collect.
     *
     * @type {void}
     */
    this.addEventListener("DOMNodeRemovedFromDocument", function() {
        this.disconnect();
    });
    
    // #ifdef __WITH_DATA
    
    /**
     * Instruction handler for XMPP protocols. It supports the following directives:
     * - xmpp:name.login(username, password)
     * - xmpp:name.logout()
     * - xmpp:name.notify(message, to_address, thread, type)
     */
    this.exec = function(method, args, callback){
        switch(method){
            case "login":
                this.connect(args[0], args[1], callback);
                break;
            case "logout":
                //@todo
                break;
            case "notify":
                this.sendMessage(args[1], args[0], args[2], args[3], callback);
                break;
            default:
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, null, "Saving/Loading data", 
                    "Invalid XMPP method '" + method + "'"));
                //#endif
                break;
        }
    };
    
    // #endif
}).call(apf.xmpp.prototype = new apf.Teleport());

apf.aml.setElement("xmpp", apf.xmpp);

// Collection of shorthands for all namespaces known and used by this class
apf.xmpp.NS   = {
    sasl        : "urn:ietf:params:xml:ns:xmpp-sasl",
    httpbind    : "http://jabber.org/protocol/httpbind",
    feature_reg : "http://jabber.org/features/iq-register",
    bosh        : "urn:xmpp:xbosh",
    jabber      : "jabber:client",
    bind        : "urn:ietf:params:xml:ns:xmpp-bind",
    session     : "urn:ietf:params:xml:ns:xmpp-session",
    auth        : "jabber:iq:auth",
    roster      : "jabber:iq:roster",
    register    : "jabber:iq:register",
    data        : "jabber:x:data",
    stream      : "http://etherx.jabber.org/streams",
    disco_info  : "http://jabber.org/protocol/disco#info",
    disco_items : "http://jabber.org/protocol/disco#items",
    muc         : "http://jabber.org/protocol/muc",
    muc_user    : "http://jabber.org/protocol/muc#user",
    muc_owner   : "http://jabber.org/protocol/muc#owner"
};

apf.xmpp.CONN_POLL = 0x0001;
apf.xmpp.CONN_BOSH = 0x0002;

apf.xmpp.ERROR_AUTH = 0x0004;
apf.xmpp.ERROR_CONN = 0x0008;
apf.xmpp.ERROR_MUC  = 0x0010;
apf.xmpp.ERROR_REG  = 0x0011;

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

// #endif
