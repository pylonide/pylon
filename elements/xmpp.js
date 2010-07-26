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
 *      myXMPP.sendMessage({to: 'john@my-jabber-server.com/resource', message: 'A test message'});
 *  </a:script>
 * </code>
 * Remarks:
 * Calls can be made to a server using a special {@link term.datainstruction data instruction}
 * format.
 * <code>
 *  submission="{myXmpp.notify([@bar], 'john@my-jabber-server.com/resource')}"
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
 *                                the RDB implementation can grok
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
    this.$sAJAX_ID   = this.$makeUnique("ajaxRDB");
    this.$retryCount = 0;
    this.$RID        = null;
    this.$activeReq  = null;
};

(function() {
    var constants = {
        // Collection of shorthands for all namespaces known and used by this class
        NS   : {
            sasl        : "urn:ietf:params:xml:ns:xmpp-sasl",
            httpbind    : "http://jabber.org/protocol/httpbind",
            feature_reg : "http://jabber.org/features/iq-register",
            bosh        : "urn:xmpp:xbosh",
            time        : "urn:xmpp:time",
            jabber      : "jabber:client",
            bind        : "urn:ietf:params:xml:ns:xmpp-bind",
            session     : "urn:ietf:params:xml:ns:xmpp-session",
            auth        : "jabber:iq:auth",
            roster      : "jabber:iq:roster",
            register    : "jabber:iq:register",
            //#ifdef __WITH_RDB
            datastatus  : "jabber:iq:rdbstatus",
            //#endif
            data        : "jabber:x:data",
            stream      : "http://etherx.jabber.org/streams",
            disco_info  : "http://jabber.org/protocol/disco#info",
            disco_items : "http://jabber.org/protocol/disco#items",
            muc         : "http://jabber.org/protocol/muc",
            muc_user    : "http://jabber.org/protocol/muc#user",
            muc_owner   : "http://jabber.org/protocol/muc#owner",
            muc_admin   : "http://jabber.org/protocol/muc#admin",
            commands    : "http://jabber.org/protocol/commands"
        },
        CONN_POLL   : 0x0001,
        CONN_BOSH   : 0x0002,
        CONN_SOCKET : 0x0004,

        ERROR_AUTH : 0x0004,
        ERROR_CONN : 0x0008,
        ERROR_MUC  : 0x0010,
        ERROR_REG  : 0x0011,

        SUBSCR_FROM : "from",
        SUBSCR_TO   : "to",
        SUBSCR_BOTH : "both",
        SUBSCR_NONE : "none",

        TYPE_AVAILABLE   : "", //no need to send 'available'
        TYPE_UNAVAILABLE : "unavailable",
        TYPE_PROBE       : "probe",
        TYPE_SUBSCRIBED  : "subscribed",
        TYPE_SUBSCRIBE   : "subscribe",
        TYPE_UNSUBSCRIBE : "unsubscribe",
        TYPE_UNSUBSCRIBED: "unsubscribed",

        STATUS_ONLINE    : "online",
        STATUS_OFFLINE   : "offline",
        STATUS_SHOW      : "show",
        STATUS_AWAY      : "away",
        STATUS_XA        : "xa",
        STATUS_DND       : "dnd",
        STATUS_INVISIBLE : "invisible",
        STATUS_FFC       : "chat",

        MSG_CHAT      : "chat",
        MSG_GROUPCHAT : "groupchat",
        MSG_ERROR     : "error",
        MSG_HEADLINE  : "headline",
        MSG_NORMAL    : "normal"
    };
    apf.extend(apf.xmpp, constants);

    this.$server     = null;
    this.timeout     = 10000;
    this.maxrequests = 2;
    this.useHTTP     = true;
    this.method      = "POST";
    this.auth        = "DIGEST-MD5";
    this.connected   = false;

    this.$xmppMethod      = constants.CONN_BOSH;
    this.$isPoll          = false;
    this["poll-timeout"]  = 2000;
    this["auto-register"] = false;
    this["auto-confirm"]  = true;
    this["auto-deny"]     = false;
    this.$canMuc          = false;
    this.$canRDB          = false;
    this.$modelContent    = {
        roster: true,
        chat  : true,
        typing: true
    };

    var SASL_MECHS = {
            "PLAIN"     : 1,
            "DIGEST-MD5": 1,
            "ANONYMOUS" : 1
        },
        // munge often-used strings
        SID        = "SID",
        JID        = "JID",
        CONN       = "connected",
        ROSTER     = "roster",
        COOKIE     = "ajaxorg_xmpp";

    /**
     * @attribute {String}   [type]           The type of method used to connect
     *                                        to the server. Defaults to 'binding'
     *   Possible values:
     *   poll
     *   binding
     * @attribute {String}   [host]           Name of the Virtual Host of the Jabber
     *                                        network of which the user should be a
     *                                        member of
     * @attribute {String}   [auth]           Type of SASL/ Non-SASL authentication
     *                                        to use. Defaults to 'DIGEST-MD5'.
     *                                        Case insensitive.
     *   Possible values:
     *   PLAIN
     *   DIGEST-MD5
     *   ANONYMOUS
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
     * @attribute {String}   [muc-host]       Name of the Virtual Host of the Multi
     *                                        User Chat service of a Jabber server.
     *                                        Defaults to the domain that is parsed from
     *                                        {@link element.xmpp.url}.
     * @attribute {String}   [muc-model]      Name of the model where chat messages
     *                                        sent and received from Multi User
     *                                        Chats will be synchronized to.
     * @attribute {String}   [rdb-host]       Name of the Virtual Host of the Remote
     *                                        DataBinding service of a Jabber server.
     *                                        Defaults to the domain that is parsed
     *                                        from {@link element.xmpp.url}.
     * @attribute {String}   [rdb-model]      Name of the model where Remote
     *                                        DataBinding messages will be
     *                                        synchronized to.
     * @attribute {Boolean}  [rdb-bot]        Specifies if the this client will
     *                                        connect to the Jabber server as a bot
     * @attribute {Number}   [priority]       Specifies the load - as in 'workload'
     *                                        of the client - connected as a bot.
     */
    this.$booleanProperties["auto-register"] = true;
    this.$booleanProperties["auto-confirm"]  = true;
    this.$booleanProperties["auto-deny"]     = true;
    this.$booleanProperties[CONN]            = true;
    // #ifdef __TP_XMPP_RDB
    this.$booleanProperties["rdb-bot"]       = true;
    // #endif

    this.$supportedProperties.push("type", "auth", "poll-timeout", "resource",
        "host", "auto-register", "auto-confirm", "auto-deny", CONN
        // #ifdef __TP_XMPP_ROSTER
        , "model", "model-contents"
        // #endif
        // #ifdef __TP_XMPP_MUC
        , "muc-host", "muc-model"
        // #endif
        // #ifdef __TP_XMPP_RDB
        , "rdb-host", "rdb-model", "rdb-bot", "priority"
        // #endif
    );

    this.$propHandlers["type"] = function(value) {
        this.$xmppMethod = (value == "polling")
            ? constants.CONN_POLL
            : (value == "socket") ? constants.CONN_SOCKET : constants.CONN_BOSH;

        this.$isPoll = Boolean(this.$xmppMethod & constants.CONN_POLL)
            || Boolean(this.$xmppMethod & constants.CONN_SOCKET);
    };

    this.$propHandlers["auth"] = function(value) {
        value = (value || "").toUpperCase();
        this.auth = SASL_MECHS[value] ? value : "DIGEST_MD5";
    };

    this.$propHandlers["poll-timeout"] = function(value) {
        this["poll-timeout"] = parseInt(value) || 2000;
    };

    this.$propHandlers["resource"] = function(value) {
        this.resource = value || apf.config.name || "apf".appendRandomNumber(5);
    };

    // #ifdef __TP_XMPP_ROSTER
    this.$propHandlers["model-contents"] = function(value) {
        // provide a virtual Model to make it possible to bind with this XMPP
        // instance remotely.
        // We agreed on the following format for binding: model-contents="roster|typing|chat"
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

        if (this.$serverVars[ROSTER])
            this.$serverVars[ROSTER].rebuild(this.$modelContent);
    };
    // #endif

    // #ifdef __TP_XMPP_MUC
    this.$propHandlers["muc-model"] = function(value) {
        // parse MUC parameters
        this["muc-host"] = this["muc-host"] || "conference." + this.host;
        if (!this.$canMuc) {
            this.$canMuc   = true;
            // magic!
            this.implement(apf.xmpp_muc);
        }
    };

    this.$initMuc = function() {
        if (this.$canMuc) return;
        this.setProperty("muc-model", "$apf_muc");
    };
    // #endif

    // #ifdef __TP_XMPP_RDB
    this.$propHandlers["rdb-model"] = function(value) {
        // parse MUC parameters
        this["rdb-host"] = this["rdb-host"] || "rdb." + this.host;
        if (!this.$canRDB) {
            this.$canRDB   = true;
            // magic!
            this.implement(apf.xmpp_rdb);
        }
    };

    this.$propHandlers["priority"] = function(value) {
        // set the new prio
        this.priority = parseInt(value);
    };

    this.$initRDB = function() {
        if (this.$canRDB) return;
        this.setProperty("rdb-model", "$apf_rdb");
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
        var aOut = this.$xmppMethod & constants.CONN_SOCKET ? [] : [this.$serverVars[SID] || "0", ","];

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

        return "<response xmlns='" + constants.NS.sasl + "'>"
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
        var aOut = ["<presence xmlns='", constants.NS.jabber, "'"];
        if (options.type)
            aOut.push(" type='", options.type, "'");
        if (options.to)
            aOut.push(" to='", options.to, "'");
        if (options.from)
            aOut.push(" from='", options.from, "'");
        if (options.join)
            aOut.push(" join='", options.join, "'");
        if (options.prio)
	        aOut.push(" prio='", options.prio, "'");
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
    function createMessageBlock(options) {
        var aOut = ["<message xmlns='", constants.NS.jabber, "' from='",
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

        // support for xep-0004 in message stanza's
        if (options.x) {
            aOut.push("<x xmlns='", constants.NS.data, "' type='",
                options.xtype || "submit", "'>", options.x, "</x>")
        }

        if (options.message)
            aOut.push("<body><![CDATA[", encodeCDATA(options.message.trim()), "]]></body>");

        aOut.push("</message>");
        return aOut.join("");
    }

    var encRE = /<\!\[CDATA\[([\S\s]*?)\]\]>/g,
        decRE = /&lt;\[CDATA\[([\S\s]*?)\]\]&gt;/g;

    function encodeCDATA(s) {
        if (typeof s != "string")return s;
        return s.replace(encRE, "&lt;[CDATA[$1]]&gt;");
    }

    function decodeCDATA(s) {
        if (typeof s != "string") return s;
        return s.replace(decRE, "<![CDATA[$1]]>");
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
    this.$makeUnique          = makeUnique,
    this.$createBodyElement   = createBodyElement,
    this.$createStreamElement = createStreamElement,
    this.$createIqBlock       = createIqBlock,
    this.$createPresenceBlock = createPresenceBlock,
    this.$createMessageBlock  = createMessageBlock,
    this.$encodeCDATA         = encodeCDATA,
    this.$decodeCDATA         = decodeCDATA;

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
        if (cb && typeof s != "undefined")
            this.$reqStack.push({callback: cb, body: s});

        // execute this specific call AFTER the current one has finished...
        if (this.$reqCount >= this.maxrequests)
            return null;

        var _self = this,
            sock  = this.$xmppMethod & constants.CONN_SOCKET,
            req   = this.$reqStack.shift();
        if (!req) return null;
        //#ifdef __DEBUG
        apf.console.log("sending request: " + req.body);
        //#endif

        if (!sock)
            ++this.$reqCount;
        return this.$activeReq = this.get(this.url, {
            callback: function(data, state, extra) {
                if (!sock)
                    --_self.$reqCount;
                _self.$activeReq = null;
                if (_self.$reqStack.length)
                    _self.$doXmlRequest();

                //#ifdef __DEBUG
                apf.console.log("receiving data: " + data);
                //#endif

                if (_self.$isPoll) {
                    if (!data || data.replace(/^[\s\n\r]+|[\s\n\r]+$/g, "") == "") {
                        //state = apf.ERROR;
                        //extra.message = (extra.message ? extra.message + "\n" : "")
                        //                + "Received an empty XML document (0 bytes)";
                    }
                    else {
                        var start = "<stream:stream",
                            end   = "</stream:stream>";
                        if (data.indexOf(start) > -1) {
                            if (data.indexOf(end) == -1)

                                data = data + end;
                        }
                        else if (_self.$xmppMethod & constants.CONN_SOCKET) {
                            data = start + " xmlns:stream='" + constants.NS.stream + "'>" + data 
                                 + (data.indexOf(end) == -1 ? end : "");
                        }
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
                    onError.call(_self, !this.connected
                        ? constants.ERROR_AUTH
                        : constants.ERROR_CONN, extra.message, state);
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
        var bIsAuth = nType & constants.ERROR_AUTH,
            bIsConn = nType & constants.ERROR_CONN;
        if (bIsConn) {
            if (this.$retryCount == 3) {
                this.$retryCount = 0;
                clearTimeout(this.$listener);
                this.$listener = null;
                this.setProperty(CONN, false);
                this.dispatchEvent("reconnect", {
                    username: this.$serverVars["username"],
                    server  : this.url
                });
                return this.connect(this.$serverVars["username"], this.$serverVars["password"],
                    this.$serverVars["login_callback"],
                    this.$serverVars["register"] || this["auto-register"]);
            }
            this.$retryCount++;
            this.$listen();
        }
        else {
            this.$retryCount = 0;
        }

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
        //apf.console.error(extra.message + " (username: " + extra.username
        //                  + ", server: " + extra.server + ")", "xmpp");
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

        this.$serverVars["username"]       = username || this.resource;
        this.$serverVars["password"]       = password || "";
        this.$serverVars["login_callback"] = callback;
        this.$serverVars["register"]       = reg || this["auto-register"];
        this.$serverVars["previousMsg"]    = [];
        // #ifdef __TP_XMPP_ROSTER
        this.$serverVars[ROSTER].registerAccount(username, this.host);
        // #endif
        // #ifdef __TP_XMPP_MUC
        if (this.$canMuc)
            this.$mucRoster.registerAccount(username, this.host);
        // #endif
        // #ifdef __TP_XMPP_RDB
        if (this.$canRDB)
            this.$rdbRoster.registerAccount(username, this.host);
        // #endif
        this.$doXmlRequest(processConnect, this.$isPoll
            ? createStreamElement.call(this, {
                doOpen         : true,
                to             : this.host,
                xmlns          : constants.NS.jabber,
                "xmlns:stream" : constants.NS.stream,
                version        : "1.0"
              })
            : createBodyElement({
                content        : "text/xml; charset=utf-8",
                hold           : "1",
                rid            : this.$getRID(),
                to             : this.host,
                route          : "xmpp:jabber.org:9999",
                secure         : "true",
                wait           : "120",
                ver            : "1.6",
                "xml:lang"     : "en",
                "xmpp:version" : "1.0",
                xmlns          : constants.NS.httpbind,
                "xmlns:xmpp"   : constants.NS.bosh
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
        if (this.connected) {
            if (callback)
                this.$serverVars["logout_callback"] = callback;
            // #ifdef __TP_XMPP_MUC
            if (this.$canMuc)
                this.leaveAllRooms();
            // #endif
            // #ifdef __TP_XMPP_RDB
            if (this.$canRDB)
                this.leaveAllDocs();
            // #endif
            var sPresence = createPresenceBlock({
                type: constants.TYPE_UNAVAILABLE
            });
            //if (this.$activeReq)
            //    this.cancel(this.$activeReq);
            this.$doXmlRequest(processDisconnect, this.$isPoll
                ? createStreamElement.call(this, {
                    doClose: true
                  }, sPresence)
                : createBodyElement({
                      rid   : this.$getRID(),
                      sid   : this.$serverVars[SID],
                      type  : "terminate",
                      xmlns : constants.NS.httpbind
                  }, sPresence)
            );
        }
        else {
            this.reset();
            if (callback)
                callback(null, apf.SUCCESS);
        }
    };

    /**
     * If the client uses a BOSH session to connect to the XMPP server, the
     * connection can be paused to any number of seconds until the maximum set
     * by the server.
     *
     * @see http://xmpp.org/extensions/xep-0124.html#inactive
     * @param {Number} secs Number of seconds to pause the connection.
     *                      Defaults to the max set by the server. (usually 120)
     * @type {void}
     */
    this.pause = function(secs) {
        var max, v = this.$serverVars;
        if (!this.connected || this.$isPoll || !(max = v["MAXPAUSE"])) return;

        secs = parseInt(secs) || max;
        this.$doXmlRequest(processBindingResult, createBodyElement({
              rid   : this.$getRID(),
              sid   : v[SID],
              pause : secs > max ? max : secs,
              xmlns : constants.NS.httpbind
          })
        );
    };

    /*
     * The connection has been terminated (set to state 'paused'). Theoretically
     * it could be resumed, but doing a complete reconnect would be more secure
     * and stable for RDB and other implementations that rely on stable stream
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
        if (this.$activeReq)
            this.cancel(this.$activeReq);
        if (cb)
            cb(oXml, state, extra);
    }

    this.isConnected = function() {
        return this.connected;
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
        // #ifdef __TP_XMPP_RDB
        if (this.$canRDB && this.$rdbRoster)
            this.$rdbRoster.reset();
        // #endif
        // unregister ALL variables:
        for (var i in this.$serverVars)
            delete this.$serverVars[i];

        // apply some initial values to the serverVars global scoped Array
        this.$RID = null;
        this.$serverVars["cnonce"] = generateCnonce(14);
        this.$serverVars["nc"]     = "00000001";
        this.setProperty(CONN, false);
        // #ifdef __TP_XMPP_ROSTER
        this.$serverVars[ROSTER]   = new apf.xmpp_roster(this.model,
           this.$modelContent, this.resource);
        // #endif
        this.$serverVars["bind_count"] = 0;
        this.$serverVars["mess_count"] = 0;

        this.host = this.host || this.$host;
        // #ifdef __TP_XMPP_MUC
        if (!this.$canMuc)
            this.$initMuc();
        // #endif
        // #ifdef __TP_XMPP_RDB
        if (!this.$canRDB)
            this.$initRDB();
        // #endif

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
            return onError.call(this, constants.ERROR_AUTH, extra.message, state);

        // reset retry/ connection counter
        this.$retryCount = 0;
        if (!this.$isPoll) {
            this.$serverVars[SID]          = oXml.getAttribute("sid");
            this.$serverVars["AUTH_ID"]    = oXml.getAttribute("authid");
            // get other properties:
            this.$serverVars["WAIT"]       = (parseInt(oXml.getAttribute("wait"))       || 0) * 1000;
            this.$serverVars["REQUESTS"]   = parseInt(oXml.getAttribute("requests"))    || 0;
            this.$serverVars["INACTIVITY"] = (parseInt(oXml.getAttribute("inactivity")) || 0) * 1000;
            this.$serverVars["MAXPAUSE"]   = (parseInt(oXml.getAttribute("maxpause"))   || 0) * 1000;
            this.$serverVars["POLLING"]    = parseInt(oXml.getAttribute("polling"))     || 0;
            this.$serverVars["VER"]        = parseFloat(oXml.getAttribute("ver"))       || 1.1;
        }
        else {
            if (this.$xmppMethod & constants.CONN_POLL) {
                var aCookie = extra.http.getResponseHeader("Set-Cookie").splitSafe(";");
                this.$serverVars[SID]       = aCookie[0].splitSafe("=")[1];
            }
            this.$serverVars["AUTH_ID"] = oXml.firstChild.getAttribute("id");
        }
        var oMech  = oXml.getElementsByTagName("mechanisms")[0],
            sXmlns = oMech.getAttribute("xmlns");
        // @todo apf3.0 hack for o3, remove when o3 is fixed
        this.$serverVars["AUTH_SASL"] = apf.isO3 || (sXmlns && sXmlns == constants.NS.sasl);

        var aNodes = oXml.getElementsByTagName("mechanism"),
            i      = 0,
            l      = aNodes.length,
            found  = false,
            sMech;
        for (; i < l; i++) {
            sMech = aNodes[i].firstChild.nodeValue || "";
            if (sMech == this.auth) {
                this.$serverVars["AUTH_TYPE"] = sMech;
                found = true;
            }
        }
        // always fall back to anon authentication
        if (!found) {
            //#ifdef __DEBUG
            apf.console.error("No supported authentication protocol found. \
                               Falling back to anonymous authentication, but \
                               that could fail!", "xmpp");
            //#endif
            this.$serverVars["AUTH_TYPE"] = "ANONYMOUS";
        }

        // feature detection:
        aNodes = oXml.getElementsByTagName("register");
        for (i = 0, l = aNodes.length; i < l; i++) {
            this.$serverVars["AUTH_REG"] =
                (aNodes[i].getAttribute("xmlns") == constants.NS.feature_reg);
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
            "<query xmlns='" + constants.NS.register + "'><username>"
                + this.$serverVars["username"] + "</username><password>"
                + this.$serverVars["password"] + "</password></query>"
        ),
        _self = this;
        this.$doXmlRequest(function(oXml) {
                if (oXml && oXml.nodeType) {
                    var iq = oXml.getElementsByTagName("iq")[0];
                    if ((iq && iq.getAttribute("type") == "error")
                      || oXml.getElementsByTagName("error").length) {
                        onError.call(_self, constants.ERROR_REG,
                            "New account registration for account '"
                            + this.$serverVars["username"] + " failed.");
                    }
                    // registration successful, proceed with authentication
                    doAuthRequest.call(_self);
                }
                //#ifdef __DEBUG
                else if (!_self.$isPoll)
                    onError.call(_self, constants.ERROR_REG, null, apf.OFFLINE);
                //#endif
            }, _self.$isPoll
            ? createStreamElement.call(this, null, sIq)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
            }, sIq)
        );
    }

    /*
     * Proceeds with the authentication process after establishing a connection
     * or stream to the server OR after a successful In-Band registration
     * We also support Non-SASL Authentication
     * @see http://xmpp.org/extensions/attic/jep-0078-1.7.html
     * @see http://tools.ietf.org/html/rfc2245 SASL Anonymous
     * @see http://tools.ietf.org/html/rfc2595 SASL PLAIN
     * @see http://tools.ietf.org/html/rfc2831 SASL DIGEST-MD5
     *
     * @type {void}
     */
    function doAuthRequest() {
        if (this.$serverVars["AUTH_SASL"]) {
            // start the authentication process by sending a request
            var sType = this.$serverVars["AUTH_TYPE"],
                sAuth = "<auth xmlns='" + constants.NS.sasl + "' mechanism='"
                    + sType + (sType == "PLAIN" || sType == "ANONYMOUS"
                        ? "'>" + apf.crypto.Base64.encode(sType == "ANONYMOUS"
                            ? this.resource
                            : this.$serverVars["username"] + "@" + this.host
                                + String.fromCharCode(0) + this.$serverVars["username"]
                                + String.fromCharCode(0) + this.$serverVars["password"]
                          ) + "</auth>"
                        : "'/>");
            this.$doXmlRequest((sType == "ANONYMOUS" || sType == "PLAIN")
                ? reOpenStream // skip a few steps...
                : processAuthRequest, this.$isPoll
                ? createStreamElement.call(this, null, sAuth)
                : createBodyElement({
                      rid   : this.$getRID(),
                      sid   : this.$serverVars[SID],
                      xmlns : constants.NS.httpbind
                  }, sAuth)
            );
        }
        // do Non-SASL Authentication as described in JEP-0078
        else {
           var sIq = createIqBlock({
                    type  : "get",
                    id    : makeUnique("auth")
                },
                "<query xmlns='" + constants.NS.auth + "'><username>"
                    + this.$serverVars["username"] + "</username></query>"
            );
            this.$doXmlRequest(processAuthRequest, this.$isPoll
                ? createStreamElement.call(this, null, sIq)
                : createBodyElement({
                    rid   : this.$getRID(),
                    sid   : this.$serverVars[SID],
                    xmlns : constants.NS.httpbind
                }, sIq)
            );
        }
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
                return onError.call(this, constants.ERROR_AUTH);

            var sRealm = this.$serverVars["realm"],
                md5    = apf.crypto.MD5;
            if (!sRealm)
                this.$serverVars["realm"] = sRealm = this.host; //DEV: option to provide realm with a default

            if (sRealm)
                this.$serverVars["digest-uri"] = "xmpp/" + sRealm;

            //#ifdef __DEBUG
            apf.console.info("auth - digest-uri: " + this.$serverVars["digest-uri"], "xmpp");
            //#endif

            // for the calculations of A1, A2 and sResp below, take a look at
            // RFC 2617, Section 3.2.2.1
            var A1 = md5.str_md5(this.$serverVars["username"] + ":" + this.host
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
                ? createStreamElement.call(this, null, sAuth)
                : createBodyElement({
                      rid   : this.$getRID(),
                      sid   : this.$serverVars[SID],
                      xmlns : constants.NS.httpbind
                  }, sAuth)
            );
        }
        else {
            if (oXml && oXml.nodeType) {
                var iq = oXml.getElementsByTagName("iq")[0];
                if ((iq && iq.getAttribute("type") == "error")
                  || oXml.getElementsByTagName("error").length) {
                    return onError.call(this, constants.ERROR_AUTH);
                }
                var aDigest,
                    bDigest = (aDigest = oXml.getElementsByTagName("digest")
                                && aDigest[0]),
                    sIq     = createIqBlock({
                        type  : "set",
                        id    : makeUnique("auth")
                    },
                    "<query xmlns='" + constants.NS.auth + "'><username>"
                        + this.$serverVars["username"] + "</username><resource>"
                        + this.resource + "</resource>" + (bDigest
                            ? "<digest xmlns='" + constants.NS.auth + ">"
                                + apf.crypto.SHA1(this.$serverVars["AUTH_ID"]
                                + this.$serverVars["password"]) + "</digest>"
                            : "<password xmlns='" + constants.NS.auth + "'>"
                                + this.$serverVars["password"] + "</password>")
                        + "</query>"
                );
                this.$doXmlRequest(reOpenStream, this.$isPoll
                    ? createStreamElement.call(this, null, sIq)
                    : createBodyElement({
                        rid   : this.$getRID(),
                        sid   : this.$serverVars[SID],
                        xmlns : constants.NS.httpbind
                    }, sIq)
                );
            }
            //#ifdef __DEBUG
            else if (!this.$isPoll)
                onError.call(this, constants.ERROR_AUTH, null, apf.OFFLINE);
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
            return onError.call(this, constants.ERROR_AUTH);

        var sAuth = createAuthBlock({});
        this.$doXmlRequest(reOpenStream, this.$isPoll
            ? createStreamElement.call(this, null, sAuth)
            : createBodyElement({
                  rid   : this.$getRID(),
                  sid   : this.$serverVars[SID],
                  xmlns : constants.NS.httpbind
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
                return onError.call(this, constants.ERROR_AUTH);
        }
        else {
            if (oXml && oXml.nodeType) {
                var iq = oXml.getElementsByTagName("iq")[0];
                if ((iq && iq.getAttribute("type") == "error")
                  || oXml.getElementsByTagName("error").length) {
                    return onError.call(this, constants.ERROR_AUTH);
                }
                delete this.$serverVars["password"];
            }
            //#ifdef __DEBUG
            else if (!this.$isPoll)
                onError.call(this, constants.ERROR_AUTH, null, apf.OFFLINE);
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
            ? createStreamElement.call(this, {
                doOpen         : true,
                to             : this.host,
                xmlns          : constants.NS.jabber,
                "xmlns:stream" : constants.NS.stream,
                version        : "1.0"
              })
            : createBodyElement({
                  rid            : this.$getRID(),
                  sid            : this.$serverVars[SID],
                  to             : this.host,
                  "xml:lang"     : "en",
                  "xmpp:restart" : "true",
                  xmlns          : constants.NS.httpbind,
                  "xmlns:xmpp"   : constants.NS.bosh
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
            xmlns : this.$isPoll ? null : constants.NS.jabber
          },
          "<bind xmlns='" + constants.NS.bind + "'>" +
             "<resource>" + this.resource + "</resource>" +
          "</bind>"
        );
        this.$doXmlRequest(processBindingResult, this.$isPoll
            ? createStreamElement.call(this, null, sIq)
            : createBodyElement({
                  rid   : this.$getRID(),
                  sid   : this.$serverVars[SID],
                  xmlns : constants.NS.httpbind
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
                    to    : this.host,
                    type  : "set",
                    xmlns : constants.NS.jabber
                },
                "<session xmlns='" + constants.NS.session + "'/>"
            ),
            _self = this;
            this.$doXmlRequest(function(oXml) {
                    parseData.call(_self, oXml);
                    setInitialPresence.call(_self);
                }, this.$isPoll
                ? createStreamElement.call(this, null, sIq)
                : createBodyElement({
                    rid   : this.$getRID(),
                    sid   : this.$serverVars[SID],
                    xmlns : constants.NS.httpbind
                }, sIq)
            );
        }
        else {
            //@todo: check for binding failures!
            onError.call(this, constants.ERROR_AUTH);
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
            type: constants.TYPE_AVAILABLE
        }),
        _self = this;
        this.$doXmlRequest(function(oXml) {
                parseData.call(_self, oXml);
                // #ifdef __TP_XMPP_ROSTER
                if (_self["model"]) // @todo 3.0 improve detection for retrieving roster
                    getRoster.call(_self);
                else
                    connected.call(_self);
                /* #else
                connected.call(_self);
                #endif */
            }, this.$isPoll
            ? createStreamElement.call(this, null, sPresence)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
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
            "<query xmlns='" + constants.NS.roster + "'/>"
        ),
        _self = this;
        this.$doXmlRequest(function(oXml) {
                parseData.call(_self, oXml);
                connected.call(_self);
            }, this.$isPoll
            ? createStreamElement.call(this, null, sIq)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
            }, sIq)
        );
    }
    // #endif

    function connected() {
        var v   = this.$serverVars,
            cb  = v["login_callback"],
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
                this.sendMessage.apply(this, msg[i]);
            delete msg;
            v["previousMsg"] = [];
        }

        // flag as 'connected'
        this.setProperty(CONN, true);
        this.dispatchEvent(CONN, {username: v["username"]});
        // poll the server again for messages
        this.$listen();
    }
    /**
     * Open a PUSH connection to the XMPP server and wait for messages to
     * arrive (i.e. 'listen' to the stream).
     * Internal locking prevents us from firing more than one listener at a time.
     *
     * @type {void}
     */
    this.$listen = function() {
        if ((!(this.$xmppMethod & constants.CONN_SOCKET) && this.$listening === true)
          || !this.connected) return;
        clearTimeout(this.$listener);
        this.$listener  = null;

        this.$listening = true;

        //#ifdef __DEBUG
        apf.console.info("XMPP: Listening for messages...", "xmpp");
        //#endif

        this.$doXmlRequest(processStream, this.$isPoll
            ? createStreamElement.call(this)
            : createBodyElement({
                  rid   : this.$getRID(),
                  sid   : this.$serverVars[SID],
                  xmlns : constants.NS.httpbind
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

        var _self = this;
        this.$listener = $setTimeout(function() {
            _self.$listen();
        }, this["poll-timeout"] || 0);

        // parse incoming data AFTER connection is respawned - more stable!
        if (data || state) {
            if (state != apf.SUCCESS)
                return onError.call(this, constants.ERROR_CONN, extra.message, state);
            else
                parseData.call(this, data);
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

        var bNoListener = (this.$listening === false); //experimental
        this.$listening = false;

        // start listening again...
        if (this.connected && !bNoListener) {
            var _self = this;
            this.$listener = $setTimeout(function() {
                _self.$listen();
            }, this["poll-timeout"] || 0);
        }
        // parse incoming data AFTER connection is respawned - more stable!
        parseData.call(this, oXml);
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
        //#ifdef __TP_XMPP_MUC
        if (this.$serverVars["muc_callback"]) {
            this.$serverVars["muc_callback"](oXml);
            delete this.$serverVars["muc_callback"];
        }
        //#endif
        //#ifdef __TP_XMPP_RDB
        if (this.$serverVars["rdb_callback"]) {
            this.$serverVars["rdb_callback"](oXml);
            delete this.$serverVars["rdb_callback"];
        }
        //#endif
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

            if (!aMessages.length && !aPresence.length && !aIQs.length)
                this.dispatchEvent("unknownstanza", {data: oXml});
        }
        //#ifdef __DEBUG
        else if (!this.$isPoll)
            onError.call(this, constants.ERROR_CONN, null, apf.OFFLINE);
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
        if (!oNode) return null;
        var node,
            msg = [],
            i   = 0,
            l   = oNode.childNodes.length;
        for (i = 0; i < l; i++) {
            if ((node = oNode.childNodes[i]) && node.nodeType == 3)
                msg.push(node.nodeValue);
        }
        return decodeCDATA(msg.join("").replace(/\&quot;/g, '"'));
    }

    function fieldsToObject(aFields) {
        if (!aFields || !aFields.length)
            return {};
        /*<field type='text-single' var='baseline'><value>get</value></field>
         *<field type='text-multi' var='modeldata'><value>mdlpersons</value></field>
         */
        var oField, oVal,
            res = {},
            i   = 0,
            l   = aFields.length;
        for (; i < l; ++i) {
            oField = aFields[i],
            oVal   = oField.getElementsByTagName("value")[0];
            if (oVal.firstChild.nodeType == 4) // CDATA section
                oVal = oVal.firstChild;
            res[oField.getAttribute("var")] = {
                type: oField.getAttribute("type"),
                value: oVal.firstChild.nodeValue
            };
        }
        return res;
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
        var oMsg, sJID, sType, oThread, sThread, sMsg, sFrom, oBody, bRoom,
            i = 0,
            l = aMessages.length;
        //#ifdef __DEBUG
        apf.console.info("parseMessagePackets: " + l, "xmpp");
        //#endif

        for (; i < l; i++) {
            oMsg    = aMessages[i];
            sJID    = oMsg.getAttribute("from");
            sType   = oMsg.getAttribute("type");
            bRoom   = (sType == "groupchat");
            // #ifdef __TP_XMPP_ROSTER
            if (sJID && !bRoom)
                this.$serverVars[ROSTER].getEntityByJID(sJID); //unsed var...yet?
            // #endif

            oBody = oMsg.getElementsByTagName("body")[0];
            //if (!(oBody && oBody.childNodes.length)) continue;

            oThread = oMsg.getElementsByTagName("thread");
            if (oThread.length)
                sThread = oThread[0].firstChild.nodeValue.trim();
            sFrom = oMsg.getAttribute("from");
            sMsg  = getMessage(oBody);
            // #ifdef __TP_XMPP_ROSTER
            // #ifdef __TP_XMPP_MUC
            if (bRoom && sFrom == this.$mucRoster.fullJID)
                return;
            // #endif

            if ((bRoom ? this.$mucRoster : this.$serverVars[ROSTER])
              .updateMessageHistory(sFrom, sMsg, sThread)) {
            // #endif
                if (sMsg && sType == constants.MSG_CHAT && sThread != "rdb") {
                    this.dispatchEvent("receivechat", {
                        from   : sFrom,
                        message: sMsg
                    });
                }
                // #ifdef __WITH_RDB
                else if (sType == constants.MSG_NORMAL) {
                    var oX = oMsg.getElementsByTagName("x")[0];
                    if (!oX) continue;
                    sType = oX.getAttribute("type");
                    this.dispatchEvent("datastatuschange", {
                        type      : sType,
                        annotator : sFrom,
                        fields    : fieldsToObject(oX.getElementsByTagName("field"))
                    });
                }
                else if (sMsg && sThread == "rdb") {
                    //#ifdef __DEBUG
                    apf.console.info("received the following from the server: "
                        + sMsg, "xmpp");
                    //#endif
                    this.$rdbSignal(oMsg, sMsg);
                }
                // #endif
            // #ifdef __TP_XMPP_ROSTER
            }
            // #endif
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
        var oP, sType, sJID, aX, bMuc, bRDB, o, k, l2, sRoom,
            i = 0,
            l = aPresence.length
        for (; i < l; i++) {
            oP    = aPresence[i],
            sType = oP.getAttribute("type"),
            sJID  = oP.getAttribute("from"),
            aX    = oP.getElementsByTagName("x"),
            bMuc  = (sJID.indexOf(this["muc-host"]) > -1),
            bRDB  = (sJID.indexOf(this["rdb-host"]) > -1 || sType == "rpc" || sType == "result");
            // #ifdef __TP_XMPP_MUC
            if (aX.length) {
                for (k = 0, l2 = aX.length; k < l2; k++) {
                    switch (aX[k].getAttribute("xmlns")) {
                        case constants.NS.muc_user:
                            if (this.$getStatusCode(aX[k], 201)) {
                                this.$mucSignal(apf.xmpp_muc.ROOM_CREATE, sJID);
                                break;
                            }
                            // status code=110 means ME
                            if (!this.$isRoom(sJID) || this.$getStatusCode(aX[k], 110))
                                break;
                            o = aX[k].getElementsByTagName("item")[0];
                            if (!o) break;
                            sRoom = sJID.substring(0, sJID.indexOf("/"));
                            this.$mucSignal(apf.xmpp_muc.ROOM_JOINED, sRoom, {
                                fullJID    : sJID,
                                roomJID    : o.getAttribute("jid") || null,
                                affiliation: o.getAttribute("affiliation"),
                                role       : o.getAttribute("role"),
                                status     : oP.getAttribute("type") || constants.TYPE_AVAILABLE
                            });
                            break;
                    }
                }
            }
            // #endif
            // #ifdef __TP_XMPP_RDB
            if (bRDB)
                this.$rdbSignal(oP);
            // #endif
            if (sJID && !bMuc && !bRDB) {
                var oRoster = this.$serverVars[ROSTER],
                    oUser   = oRoster.getEntityByJID(sJID);

                if (sType == constants.TYPE_SUBSCRIBE) {
                    // incoming subscription request, deal with it!
                    incomingAdd.call(this, aPresence[i].getAttribute("from"));
                }
                // record any status change...
                if (oUser)
                    oRoster.update(oUser, sType || constants.TYPE_AVAILABLE);
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
                    case constants.NS.roster:
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
                            if (sSubscr == constants.SUBSCR_TO
                              || sSubscr == constants.SUBSCR_BOTH)
                                pBlocks.push(oContact);
                            else if (oContact.subscription == constants.TYPE_SUBSCRIBED)
                                confirmAdd.call(this, oContact);
                        }
                        if (pBlocks.length)
                            this.requestPresence(pBlocks);
                        break;
                    // #endif
                    // #ifdef __TP_XMPP_MUC
                    case constants.NS.disco_items:
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
                    case constants.NS.muc_user:
                        // @todo implement;
                        break;
                    case constants.NS.muc_owner:
                        this.$mucSignal(apf.xmpp_muc.ROOM_CREATE, sFrom);
                        break;
                    // #ifdef __WITH_RDB
                    case constants.NS.datastatus:
                        this.$mucSignal(constants.NS.datastatus, sFrom, aIQs[i]);
                        break;
                    // #endif
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
        if (!this.connected) return false;

        this.$doXmlRequest(restartlistener, createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
            },
            createPresenceBlock({
                type  : type || constants.TYPE_AVAILABLE,
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
        if (!this.connected) return false;
        // #ifdef __TP_XMPP_ROSTER
        var oRoster = this.$serverVars[ROSTER];
        if (typeof from == "string")
            from = oRoster.getEntityByJID(from);
        if (!from) return false;

        var sPresence, aPresence = [];
        if (apf.isArray(from)) {
            for (var i = 0, l = from.length; i < l; i++) {
                aPresence.push(createPresenceBlock({
                    type: constants.TYPE_PROBE,
                    to  : from[i].fullJID,
                    from: oRoster.fullJID
                }));
            }
        }
        else {
            aPresence.push(createPresenceBlock({
                type  : constants.TYPE_PROBE,
                to    : from.fullJID,
                from  : oRoster.fullJID
            }));
        }
        sPresence = aPresence.join("");

        this.$doXmlRequest(restartListener, this.$isPoll
            ? createStreamElement.call(this, null, sPresence)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
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
        if (oContact && (oContact.subscription == constants.SUBSCR_TO
          || oContact.subscription == constants.SUBSCR_BOTH))
            return this.requestPresence(oContact);

        // all clear, now we request a new roster item
        var sIq = createIqBlock({
                type  : "set",
                id    : makeUnique("set")
            },
            "<query xmlns='" + constants.NS.roster + "'><item jid='" + jid
                + "' /></query>"
        ),
        _self = this;
        this.$doXmlRequest(function(oXml) {
                _self.$listen();
                parseData.call(_self, oXml);
                // if all is well, a contact is added to the roster.
                // <presence to='contact@example.org' type='subscribe'/>
                var sPresence = createPresenceBlock({
                    type  : constants.TYPE_SUBSCRIBE,
                    to    : jid
                });
                _self.$doXmlRequest(function(oXml) {
                        if (!oXml || !oXml.nodeType) {
                            return !_self.$isPoll
                                ? onError.call(_self, constants.ERROR_CONN, null, apf.OFFLINE)
                                : null;
                        }
                        _self.$listen();

                        var oPresence = oXml.getElementsByTagName("presence")[0];
                        if (oPresence.getAttribute("error")) {
                            sPresence = createPresenceBlock({
                                type  : constants.TYPE_UNSUBSCRIBE,
                                to    : jid
                            });
                            _self.$doXmlRequest(function(data, state, extra){
                                if (callback)
                                    callback.call(_self, data, state, extra);

                                restartListener.call(_self, data, state, extra);
                            }, _self.$isPoll
                                ? createStreamElement.call(this, null, sPresence)
                                : createBodyElement({
                                    rid   : this.$getRID(),
                                    sid   : this.$serverVars[SID],
                                    xmlns : constants.NS.httpbind
                                }, sPresence)
                            );
                        }
                        // all other events should run through the parseData()
                        // function and delegated to the Roster
                    }, _self.$isPoll
                    ? createStreamElement.call(_self, null, sPresence)
                    : createBodyElement({
                        rid   : _self.$getRID(),
                        sid   : _self.$serverVars[SID],
                        xmlns : constants.NS.httpbind
                    }, sPresence)
                );
            }, this.$isPoll
            ? createStreamElement.call(this, null, sIq)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
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
        if (this["auto-confirm"]) {
            var sMsg = createIqBlock({
                    from  : this.$serverVars[JID],
                    type  : "get",
                    id    : makeUnique("roster")
                },
                "<query xmlns='" + constants.NS.roster + "'><item jid='" + sJID
                    + "' /></query>"
            ) +  createPresenceBlock({
                type  : constants.TYPE_SUBSCRIBED,
                to    : sJID
            });
            this.$doXmlRequest(restartListener, this.$isPoll
                ? createStreamElement.call(this, null, sMsg)
                : createBodyElement({
                    rid   : this.$getRID(),
                    sid   : this.$serverVars[SID],
                    xmlns : constants.NS.httpbind
                }, sMsg)
            );
        }
        if (this["auto-deny"]) {
            // <presence to='user@example.com' type='unsubscribed'/>
            var sPresence = createPresenceBlock({
                type  : constants.TYPE_UNSUBSCRIBED,
                to    : sJID
            });
            this.$doXmlRequest(restartListener, this.$isPoll
                ? createStreamElement.call(this, null, sPresence)
                : createBodyElement({
                    rid   : this.$getRID(),
                    sid   : this.$serverVars[SID],
                    xmlns : constants.NS.httpbind
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
            type  : constants.TYPE_SUBSCRIBED,
            to    : oContact.jid
        });
        this.$doXmlRequest(restartListener, this.$isPoll
            ? createStreamElement.call(this, null, sPresence)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
            }, sPresence)
        );
    }
    // #endif
    var statusMap = {
        "online"      : constants.STATUS_ONLINE,
        "offline"     : constants.STATUS_OFFLINE,
        "away"        : constants.STATUS_AWAY,
        "xa"          : constants.STATUS_XA,
        "extendedaway": constants.STATUS_XA,
        "onvacation"  : constants.STATUS_XA,
        "dnd"         : constants.STATUS_DND,
        "donotdisturb": constants.STATUS_DND,
        "invisible"   : constants.STATUS_INVISIBLE,
        "ffc"         : constants.STATUS_FFC,
        "chatty"      : constants.STATUS_FFC,
        "freeforchat" : constants.STATUS_FFC
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
        sStatus = statusMap[sStatus] || constants.STATUS_ONLINE;
        
        return this.setPresence(sStatus, sStatus);
    };

    /**
     * Provides the ability to send a (chat-)message to any node inside the user's
     * Roster. If the 'type' property is set, it must be one of the constants in
     * the following format:
     * 'apf.xmpp.MSG_*'
     *
     * @param {Object}   options    An object containing all the details for the
     *                              message to be sent:
     *      {String}   to         Must be of the format 'node@hostname.ext'
     *      {String}   message
     *      {String}   [thread]   For threading messages, i.e. to log a conversation
     *      {String}   [type]     Message type, defaults to 'chat'
     *      {Function} [callback] Synchronisation callback for Datainstructions
     * @type  {void}
     */
    this.sendMessage = function(options) {
        if (!options || !(options.message || options.x)) return false;
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
                    options  : options,
                    retry    : function(){
                        _self.sendMessage(this.options);
                    },
                    $object : [this.name, "new apf.xmpp()"],
                    $retry  : "this.object.sendMessage(this.options)"
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

        if (!this.connected) return false;

        var bRoom = (this.$canMuc && options.type == constants.MSG_GROUPCHAT),
            aArgs = Array.prototype.slice.call(arguments),
            oUser;
        // #ifdef __TP_XMPP_ROSTER
        if (!bRoom)
            oUser = this.$serverVars[ROSTER].getEntityByJID(options.to);
        // #endif

        //#ifdef __DEBUG
        if (!oUser && !bRoom){
            apf.console.error("XMPP sendMessage error: no valid 'to' address provided"
                + options.to + "\nMessage: " + options.message, "xmpp");
        }
        //#endif

        var sMsg = createMessageBlock.call(this, apf.extend({
                type       : constants.MSG_CHAT,
                "xml:lang" : "en"
            }, options));

        this.$doXmlRequest(function(data, state, extra){
                if (options.callback)
                    options.callback.call(_self, data, state, extra);

                _self.$serverVars["previousMsg"] = aArgs;
                restartListener.call(_self, data, state, extra);
            }, this.$isPoll
            ? createStreamElement.call(this, null, sMsg)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
            }, sMsg)
        );
    };

    /**
     * Provides the ability to send a message to any node inside the user's
     * Roster, of any type. In this way the client may send custom XML stanza's,
     * e.g. for a proprietary protocol or to aid in protocol design.
     *
     * @param {Object}   options    An object containing all the details for the
     *                              message to be sent:
     *      {String}   to         Must be of the format 'node@hostname.ext'
     *      {String}   message    The XML message to be sent
     *      {Function} [callback] Function to be executed on completion of the request
     * @type  {void}
     */
    this.sendXml = function(options) {
        if (!options || !(options.message || options.x)) return false;
        var _self = this;

        //#ifdef __WITH_OFFLINE
        if (typeof apf.offline != "undefined" && !apf.offline.onLine) {
            if (apf.offline.queue.enabled) {
                var info = {
                    options  : options,
                    retry    : function(){
                        _self.sendMessage(this.options);
                    },
                    $object : [this.name, "new apf.xmpp()"],
                    $retry  : "this.object.sendMessage(this.options)"
                };

                apf.offline.queue.add(info);

                return true;
            }
            //#ifdef __DEBUG
            apf.console.warn("Trying to sent XMPP message even though \
                              application is offline.", "xmpp");
            //#endif
        }
        //#endif

        if (!this.connected) return false;

        this.$doXmlRequest(function(data, state, extra){
                if (options.callback)
                    options.callback.call(_self, data, state, extra);

                restartListener.call(_self, data, state, extra);
            }, this.$isPoll
            ? createStreamElement.call(this, null, options.message)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
            }, options.message)
        );
    };

    /**
     * Retrieves the local time of a JID, if it supports such a query.
     *
     * @param {String}   sEntity   Jabber ID to send the query to
     * @param {Function} sCallback Function to be executed when the result gets back.
     *                             Its first argument will be 'false' on failure of
     *                             any kind or {Object} upon success:
     *                             {String} tzo Time Zone Offset
     *                             {String} utc Timestamp in Universal Time
     * @type  {void}
     */
    this.getTime = function(sEntity, fCallback) {
        var sIq = createIqBlock({
                type  : "get",
                id    : makeUnique("time"),
                from  : this.$serverVars[ROSTER].fullJID,
                to    : sEntity
            },
            "<time xmlns='" + constants.NS.time + "'/>"
        ),
        _self = this;
        this.$doXmlRequest(function(oXml) {
                if (oXml && oXml.nodeType) {
                    var iq = oXml.getElementsByTagName("iq")[0];
                    if (iq && iq.getAttribute("type") == "result"
                      && iq.getElementsByTagName("time").length) {
                        return fCallback({
                            tzo: iq.getElementsByTagName("tzo")[0].firstChild.nodeValue,
                            utc: iq.getElementsByTagName("utc")[0].firstChild.nodeValue
                        });
                    }
                }
                fCallback(false);
            }, _self.$isPoll
            ? createStreamElement.call(this, null, sIq)
            : createBodyElement({
                rid   : this.$getRID(),
                sid   : this.$serverVars[SID],
                xmlns : constants.NS.httpbind
            }, sIq)
        );
    };

    this.normalizeEntity = function(sEnt) {
        return this.$serverVars[ROSTER].sanitizeJID(sEnt);
    };

    /**
     * Makes sure that a few header are sent along with all the requests to the
     * XMPP server. This function overrides the abstract found in apf.http
     *
     * @see teleport.http
     * @param {Object} http
     * @type {void}
     */
    this.$headerHook = function(http) {
        if (!apf.isWebkit)
            http.setRequestHeader("Host", this.$host);
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
        var v = this.$serverVars;
        if (v["MAXPAUSE"] && this.connected && this.auth.toLowerCase() != "anonymous") {
            delete v[ROSTER];
            apf.setcookie(COOKIE, apf.serialize(v) + "|" + (new Date()).valueOf()
                + "|" + this.resource + "|" + this.$RID);
            this.pause();
        }
        else {

            apf.delcookie(COOKIE);
        }

        //this.disconnect();
    });

    /*
     * Boot - check if a previous session exists and if so, start the session
     * again!
     *
     * @type {void}
     */
    this.addEventListener("DOMNodeInsertedIntoDocument", function() {
        // retrieve cookie and check if we can simply restart the session
        var c = apf.getcookie ? apf.getcookie(COOKIE) : null;
        if (c && (c = c.split("|")).length == 4) {
            var v   = apf.unserialize(c[0]),
                max = v["MAXPAUSE"],
                t   = parseInt(c[1]),
                now = (new Date()).valueOf();

            if (!this.connected || !max || Math.abs(now - t) >= max)
                return;
            this.setAttribute("resource", c[2]);
            this.setProperty(CONN, false);
            this.$serverVars = v;
            this.$RID        = parseInt(c[3]);
            // #ifdef __TP_XMPP_ROSTER
            this.$serverVars[ROSTER] = new apf.xmpp_roster(this.model,
               this.$modelContent, this.resource);
            // #endif
            this.host = this.host || this.$host;
            // #ifdef __TP_XMPP_MUC
            if (!this.$canMuc)
                this.$initMuc();
            // #endif
            // #ifdef __TP_XMPP_RDB
            if (!this.$canRDB)
                this.$initRDB();
            // #endif
        }
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
                this.disconnect();
                break;
            case "notify":
                this.sendMessage({
                    to      : args[1],
                    message : args[0],
                    thread  : args[2],
                    type    : args[3],
                    callback: callback
                });
                break;
            case "sendXml":
                this.sendXml(args[0]);
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

// #endif
