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
 * Component implementing XMPP IM protocol.
 * Depends on implementation of XMPP server supporting bosh or http-poll
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @classDescription This class intantiation a new XMPP connector object
 * @return {jpf.xmpp} A new XMPP connector object
 * @type {Object}
 * @constructor
 *
 * @namespace jpf
 */

jpf.xmpp = function(){
    this.server  = null;
    this.timeout = 10000;
    this.useHTTP = true;
    this.method  = "POST";

    this.oModel         = null;
    this.modelContent   = null;
    this.TelePortModule = true;
    this.isPoll;

    var _self = this;

    // Collection of shorthands for all namespaces known and used by this class
    this.NS   = {
        sasl    : 'urn:ietf:params:xml:ns:xmpp-sasl',
        httpbind: 'http://jabber.org/protocol/httpbind',
        bosh    : 'urn:xmpp:xbosh',
        jabber  : 'jabber:client',
        bind    : 'urn:ietf:params:xml:ns:xmpp-bind',
        session : 'urn:ietf:params:xml:ns:xmpp-session',
        roster  : 'jabber:iq:roster',
        stream  : 'http://etherx.jabber.org/streams'
    };

    if (!this.uniqueId) {
        jpf.makeClass(this);

        /**
         * @inherits jpf.BaseComm
         * @inherits jpf.http
         */
        this.inherit(jpf.BaseComm, jpf.http);
    }

    /**
     * Constructs a <body> tag that will be used according to XEP-0206, and
     * the more official RFCs.
     *
     * @param {Object} options
     * @param {String} content
     * @private
     */
    function createBodyTag(options, content) {
        var aOut = ["<body "];

        for (var i in options) {
            aOut.push(i, "='", options[i], "' ");
        }

        aOut.push(">", content || "", "</body>");

        return aOut.join('');
    }

    function createStreamTag(prepend, options, content) {
        var aOut = ["0,<stream:stream"];

        for (var i in options) {
            aOut.push(" ", i, "='", options[i], "'");
        }

        aOut.push(">", content ? content + "</stream:stream>" : "");

        return aOut.join('');
    }

    /**
     * A cnonce parameter is used by the SASL implementation to do some
     * additional client-server key exchange. You can say that this is the
     * part of the handshake that is powered by the client (i.e. 'us').
     *
     * @param {Number} size Length of the cnonce
     * @type {String}
     * @private
     */
    function generateCnonce(size) {
        var sTab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"; //length: 62
        var sCnonce = '';
        for (var i = 0; i < size; i++) {
            sCnonce += sTab.charAt(jpf.randomGenerator.generate(0, 61));
        }
        return sCnonce;
    }

    /**
     * Create a <response> tag completely according to the SASL rules as
     * described in RFC 2617.
     *
     * @param {Object} parts
     * @type {String}
     * @private
     */
    function createAuthBlock(parts) {
        var aOut = [];

        for (var i in parts) {
            aOut.push(i, '="', parts[i], '",');
        }
        var sOut = aOut.join('').replace(/,$/, '');

        return "<response xmlns='urn:ietf:params:xml:ns:xmpp-sasl'>"
            + jpf.crypto.Base64.encode(sOut) + "</response>";
    }

    /**
     * Create an <iq> message node which is part of the XMPP standard base
     * specification and may contain session data, bind/ stream information
     * and presence.
     *
     * @param {Object} parts
     * @param {String} content
     * @type {String}
     * @private
     */
    function createIqBlock(parts, content) {
        var aOut = ['<iq '];

        for (var i in parts) {
            aOut.push(i, "='", parts[i], "' ");
        }

        aOut.push(">", content || "", "</iq>");

        return aOut.join('');
    }

    /**
     * Create a <presence> message which is part of the XMPP standard base
     * specification and is used to transfer presence information (state of a
     * user) across the roster.
     *
     * @param {Object} options
     * @type {String}
     * @private
     */
    function createPresenceBlock(options) {
        var aOut = ["<presence xmlns='", _self.NS.jabber, "'"];
        if (options.type)
            aOut.push(" type='", options.type, "'");
        aOut.push('>');

        // show An XMPP complient status indicator. See the class constants
        // jpf.xmpp.STATUS_* for options
        if (options.status)
            aOut.push('<show>', options.status, '</show>');

        // Usually this is set to some human readable string indicating what the
        // user is doing/ feels like currently.
        if (options.custom)
            aOut.push('<status>', options.custom, '</status>');

        aOut.push('</presence>');
        return aOut.join('');
    }

    /**
     * Create a <presence> message which is part of the XMPP standard base
     * specification and may contain text messages, usually for instant
     * messaging applications.
     *
     * @param {Object} options
     * @param {String} body
     * @type {String}
     * @private
     */
    function createMessageBlock(options, body) {
        var aOut = ["<message xmlns='", _self.NS.jabber, "' from='", getVar('JID'),
        "' to='", options.to, "' id='message_", register('mess_count',
            parseInt(getVar('mess_count')) + 1), "' xml:lang='", options['xml:lang'], "'"];
        if (options.type)
            aOut.push(" type='", options.type, "'");
        aOut.push('>');

        // A subject to be sent along
        if (options.subject)
            aOut.push('<subject>', options.subject, '</subject>');

        // This is used to identify threads in chat conversations
        // A thread is usually a somewhat random hash.
        if (options.thread)
            aOut.push('<thread>', options.thread, '</thread>');

        aOut.push('<body>', body, '</body></message>');
        return aOut.join('');
    }

    var serverVars = {};
    /**
     * Simple helper function to store session variables in the private space.
     *
     * @param {String} name
     * @param {mixed} value
     * @type {mixed}
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
     * @type {void}
     * @private
     */
    function unregister() {
        for (var i = 0; i < arguments.length; i++) {
            if (typeof serverVars[arguments[i]] != "undefined") {
                serverVars[arguments[i]] = null;
                delete serverVars[arguments[i]];
            }
        }
    }

    /**
     * Simple helper function that retrieves a variable, stored in the private
     * space.
     *
     * @param {String} name
     * @type {mixed}
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
        return register('RID', getVar('RID') + 1);
    }

    /**
     * Append any string with an underscore '_' followed by a five character
     * long random number sequence.
     *
     * @param {String} s
     * @exception {Error} A general Error object
     * @type {String}
     * @private
     */
    function makeUnique(s) {
        if (typeof s != "string")
            throw new Error('Dependencies not met, please provide a string');

        return (s + "_").appendRandomNumber(5);
    }

    /**
     * Generic function that provides a basic method for making HTTP calls to
     * the XMPP server and processing the response in retries, error messages
     * or through a custom callback.
     *
     * @param {Function} callback
     * @param {String}   body
     * @param {Boolean}  isUserMessage Specifies whether this message is a
     *   message sent over the established connection or a protocol message.
     *   The user messages are recorded when offline and sent when the
     *   application comes online again.
     * @exception {Error} A general Error object
     * @type {XMLHttpRequest}
     */
    this.doXmlRequest = function(callback, body) {
        return this.get(this.server,
            function(data, state, extra) {
                if (state != jpf.SUCCESS) {
                    var cb = getVar('login_callback');
                    if (cb) {
                        unregister('login_callback');
                        return cb(null, jpf.ERROR, extra);
                    }
                    
                    var oError;

                    //#ifdef __DEBUG
                    oError = new Error(jpf.formatErrorString(0, 
                        _self, "XMPP Communication error", 
                        "Url: " + extra.url + "\nInfo: " + extra.message));
                    //#endif

                    if (extra.tpModule.retryTimeout(extra, state, _self, oError) === true)
                        return true;

                    throw oError;
                }

                if (typeof callback == "function")
                    callback.call(_self, data, state, extra);
            }, {
                nocache       : true,
                useXML        : true,
                ignoreOffline : true,
                data          : body || ""
            });
    };

    /**
     * Connect to the XMPP server with a username and password combination
     * provided.
     *
     * @param {String} username
     * @param {String} password
     * @type {void}
     */
    this.connect = function(username, password, callback) {
        this.reset();
        
        register('username',       username);
        register('password',       password);
        register('login_callback', callback);

        this.doXmlRequest(processConnect, this.isPoll
            ? createStreamTag(null, {
                to             : _self.domain,
                xmlns          : _self.NS.jabber,
                'xmlns:stream' : _self.NS.stream,
                version        : '1.0'
              })
            : createBodyTag({
                content        : 'text/xml; charset=utf-8',
                hold           : '1',
                rid            : getVar('RID'),
                to             : _self.domain,
                route          : 'xmpp:jabber.org:9999',
                secure         : 'true',
                wait           : '120',
                ver            : '1.6',
                'xml:lang'     : 'en',
                'xmpp:version' : '1.0',
                xmlns          : _self.NS.httpbind,
                'xmlns:xmpp'   : _self.NS.bosh
              })
        );
    };

    /**
     * Disconnect from the XMPP server. It suspends the connection with the
     * 'pause' attribute when using BOSH. Poll-based connection only need to
     * stop polling.
     *
     * @type {void}
     */
    this.disconnect = function() {
        if (!this.isPoll && getVar('connected')) {
            this.doXmlRequest(processDisconnect,  createBodyTag({
                pause : 120,
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : _self.NS.httpbind
            }));
        }
        else
            this.reset();
    };

    /**
     * Set all session variables to NULL, so the component may create a new
     * XMPP connection.
     *
     * @type {void}
     */
    this.reset = function() {
        // unregister ALL variables with a trick:
        for (var i in serverVars)
            unregister(i);
        if (this.oModel)
           this.oModel.load('<xmpp/>')

        // apply some initial values to the serverVars global scoped Array
        register('RID',        parseInt("".appendRandomNumber(10)));
        register('cnonce',     generateCnonce(14));
        register('nc',         '00000001');
        register('bind_count', 1);
        register('connected',  false);
        register('roster',     new jpf.xmpp.Roster(this.oModel, this.modelContent, this.resource));
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
     * @type {void}
     * @private
     */
    function processConnect(oXml) {
        //jpf.xmldb.getXml('<>'); <-- one way to convert XML string to DOM
        if (!this.isPoll) {
            register('SID', oXml.getAttribute('sid'));
            register('AUTH_ID', oXml.getAttribute('authid'));
        }

        var aMechanisms = oXml.getElementsByTagName('mechanism');
        var found = false;
        for (var i = 0; i < aMechanisms.length && !found; i++) {
            // PLAIN type challenge not supported by us: insecure!!
            if (aMechanisms[i].firstChild.nodeValue == "DIGEST-MD5") {
                register('AUTH_TYPE', 'DIGEST-MD5');
                found = true;
            }
        }

        if (!found)
            return notAuth("No supported authentication protocol found. We cannot continue!");

        // start the authentication process by sending a request
        var sAuth = "<auth xmlns='" + _self.NS.sasl + "' mechanism='" + getVar('AUTH_TYPE') + "'/>";
        this.doXmlRequest(processAuthRequest, this.isPoll
            ? sAuth
            : createBodyTag({
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : this.NS.httpbind
            }, sAuth)
        );
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
     * @type {void}
     * @private
     */
    function processDisconnect(oXml) {
        window.console.dir(oXml);
        this.reset();
    }

    /**
     * Check the response from the server to a challenge our connection manager
     * set up. When a <failure> node is detected, it means that the challenge
     * failed and thereby the authentication as well.
     *
     * @param {XMLDom} oXml
     * @type {Boolean}
     * @private
     */
    function processChallenge(oXml) {
        if (oXml.getElementsByTagName('failure').length)
            return false; // authentication failed!

        var oChallenge = oXml.getElementsByTagName("challenge")[0];
        if (oChallenge) {
            var b64_challenge = oChallenge.firstChild.nodeValue;
            var aParts        = jpf.crypto.Base64.decode(b64_challenge).split(',');

            for (var i = 0; i < aParts.length; i++) {
                var aChunk = aParts[i].split('=');
                register(aChunk[0], aChunk[1].trim().replace(/[\"\']/g, ''));
            }

            //#ifdef __DEBUG
            jpf.console.info('processChallenge: ' + aParts.join('    '), 'xmpp');
            //#endif
        }

        return true;
    }

    /**
     * Something went wrong during the authentication process; this function
     * provides a central mechanism for dealing with this situation
     *
     * @type {void}
     * @exception {Error} A general Error object
     * @private
     */
    function notAuth(msg) {
        unregister('password');

        var extra = {
            username : getVar('username'),
            server   : _self.server,
            message  : msg || "Access denied. Please check you username or password."
        }

        var cb = getVar('login_callback');
        if (cb) {
            cb(null, jpf.ERROR, extra);
            unregister('login_callback');
        }

        return _self.dispatchEvent("onauthfailure", extra);
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
     * @type {void}
     * @private
     */
    function processAuthRequest(oXml) {
        if (!processChallenge(oXml))
            return notAuth();

        if (!getVar('realm'))
            register('realm', ''); //DEV: option to provide realm with a default

        if (getVar('realm'))
            register('digest_uri', 'xmpp/' + getVar('realm'));

        // for the calculations of A1, A2 and sResp below, take a look at
        // RFC 2617, Section 3.2.2.1
        var A1 = jpf.crypto.MD5.str_md5(getVar('username') + ':' + getVar('realm')
            + ':' + getVar('password')) // till here we hash-up with MD5
        + ':' + getVar('nonce') + ':' + getVar('cnonce');

        var A2 = 'AUTHENTICATE:' + getVar('digest_uri');

        var sResp = jpf.crypto.MD5.hex_md5(jpf.crypto.MD5.hex_md5(A1) + ':'
            + getVar('nonce') + ':' + getVar('nc') + ':' + getVar('cnonce')
            + ':' + getVar('qop') + ':' + jpf.crypto.MD5.hex_md5(A2));

        //#ifdef __DEBUG
        jpf.console.info("response: " + sResp, 'xmpp');
        //#endif

        this.doXmlRequest(processFinalChallenge, createBodyTag({
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : _self.NS.httpbind
            }, createAuthBlock({
                    username   : getVar('username'),
                    realm      : getVar('realm'),
                    nonce      : getVar('nonce'),
                    cnonce     : getVar('cnonce'),
                    nc         : getVar('nc'),
                    qop        : getVar('qop'),
                    digest_uri : getVar('digest_uri'),
                    response   : sResp,
                    charset    : getVar('charset')
                })
            )
        );
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
     * @type {void}
     * @private
     */
    function processFinalChallenge(oXml) {
        // register the variables that are inside the challenge body
        // (probably only 'rspauth')
        if (!processChallenge(oXml))
            return notAuth();

        // the spec requires us to clear the password from our system(s)
        unregister('password');
        
        this.doXmlRequest(reOpenStream, createBodyTag({
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : _self.NS.httpbind
            }, createAuthBlock({}))
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
     * @type {void}
     * @private
     */
    function reOpenStream(oXml) {
        if (!processChallenge(oXml))
            return notAuth();

        //restart the stream request
        this.doXmlRequest(function(oXml) {
                if (oXml.getElementsByTagName('bind').length) {
                    // Stream restarted OK, so now we can actually start listening to messages!
                    _self.bind();
                }
            }, createBodyTag({
                rid            : getRID(),
                sid            : getVar('SID'),
                to             : _self.domain,
                'xml:lang'     : 'en',
                'xmpp:restart' : 'true',
                xmlns          : _self.NS.httpbind,
                'xmlns:xmpp'   : _self.NS.bosh
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
        this.doXmlRequest(processBindingResult, createBodyTag({
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : _self.NS.httpbind
            }, createIqBlock({
                id    : 'bind_' + register('bind_count', parseInt(getVar('bind_count')) + 1),
                type  : 'set',
                xmlns : this.NS.jabber
            }, "<bind xmlns='" + this.NS.bind + "'>\
                    <resource>" + this.resource + "</resource></bind>"))
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
     * @type {void}
     * @private
     */
    function processBindingResult(oXml) {
        var oJID = oXml.getElementsByTagName('jid')[0];
        if (oJID) {
            register('JID', oJID.firstChild.nodeValue);
            _self.doXmlRequest(function(oXml) {
                    parseData(oXml);
                    setInitialPresence();
                }, createBodyTag({
                    rid   : getRID(),
                    sid   : getVar('SID'),
                    xmlns : _self.NS.httpbind
                }, createIqBlock({
                    from  : getVar('JID'),
                    id    : sJAV_ID,
                    to    : _self.domain,
                    type  : 'set',
                    xmlns : _self.NS.jabber
                }, "<session xmlns='" + _self.NS.session + "'/>"))
            );
        }
        else {
            //@todo: check for binding failures!
            notAuth();
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
        _self.doXmlRequest(function(oXml) {
                register('connected', true);
                parseData(oXml);
                getRoster();
            }, createBodyTag({
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : _self.NS.httpbind
            }, createPresenceBlock({
                type  : jpf.xmpp.TYPE_AVAILABLE
            }))
        );
    }

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
        _self.doXmlRequest(function(oXml) {
                parseData(oXml);
                _self.listen();
                var cb = getVar('login_callback');
                if (cb) {
                    cb(null, jpf.SUCCESS, {
                        username : getVar('username')
                    });
                    unregister('login_callback');
                }
            }, createBodyTag({
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : _self.NS.httpbind
            }, createIqBlock({
                from  : getVar('JID'),
                type  : 'get',
                id    : makeUnique('roster')
            }, "<query xmlns='" + _self.NS.roster + "'/>"))
        );
    }

    var bListening = false;
    var sJAV_ID    = makeUnique('javRSB');
    /**
     * Open a PUSH connection to the XMPP server and wait for messages to
     * arrive (i.e. 'listen' to the stream).
     * Internal locking prevents us from firing more than one listener at a time.
     *
     * @type {void}
     */
    this.listen = function() {
        if (bListening === true) return;

        bListening = true;

        //#ifdef __DEBUG
        jpf.console.info('XMPP: Listening for messages...', 'xmpp');
        //#endif

        this.doXmlRequest(processStream, createBodyTag({
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : _self.NS.httpbind
            }, '')
        );
    };

    /**
     * If there is no proof that the 'listener' thread (or http connection) is
     * still open, reconnect it after the current callback sequence has completed
     * (hence the 'setTimeout' call).
     *
     * @see jpf.xmpp.listen
     * @type {void}
     * @private
     */
    function restartListener() {
        if (arguments.length)
            parseData(arguments[0]);

        if (getVar('connected') && !bListening)
            setTimeout(function() {
                _self.listen();
            }, 0);
    }

    /**
     * Handle the result of the stream listener and messages that arrived need
     * to be processed.
     *
     * @param {Object} oXml
     * @type {void}
     * @private
     */
    function processStream(oXml) {
        parseData(oXml);

        var bNoListener = (bListening === false); //experimental
        bListening = false;

        // start listening again...
        if (getVar('connected') && !bNoListener)
            setTimeout(function() {
                _self.listen();
            }, 0);
    }

    /**
     * Parse the XML envelope received from the XMPP server. Since one XML
     * envelope may contain more than one message type, no if...else block can
     * be found (we check for all possible message types).
     *
     * @param {Object} oXml
     * @type {void}
     * @private
     */
    function parseData(oXml) {
        if (oXml && oXml.nodeType) {
            // do other stuff... like processing the messages? :P
            var aMessages = oXml.getElementsByTagName('message');
            if (aMessages.length)
                parseMessagePackets(aMessages);

            var aPresence = oXml.getElementsByTagName('presence');
            
            //#ifdef __DEBUG
            jpf.console.info('Number of <PRESENCE> elements: ' + aPresence.length, 'xmpp');
            //#endif
            
            if (aPresence.length)
                parsePresencePackets(aPresence);

            var aIQs = oXml.getElementsByTagName('iq');
            if (aIQs.length)
                parseIqPackets(aIQs);
        }
        else {
            //#ifdef __DEBUG
            jpf.console.warn('!!!!! Exceptional state !!!!!', 'xmpp');
            //#endif
        }
    }

    /**
     * One or more (instant-)messages have are arrived that need to be processed
     * and parsed to eventually show up in the GUI
     *
     * @see jpf.xmpp.parseData
     * @param {Array} aMessages
     * @type {void}
     * @private
     */
    function parseMessagePackets(aMessages) {
        var sJID, oBody;

        for (var i = 0; i < aMessages.length; i++) {
            sJID = aMessages[i].getAttribute('from');
            if (sJID)
                oUser = getVar('roster').getUserFromJID(sJID);

            if (aMessages[i].getAttribute('type') == "chat") {
                oBody = aMessages[i].getElementsByTagName('body')[0];
                if (oBody && oBody.firstChild) {
                    // #ifdef __DEBUG
                    jpf.console.log('XMPP incoming chat message: ' + oBody.firstChild.nodeValue, 'xmpp');
                    // #endif
                    var sFrom = aMessages[i].getAttribute('from');
                    var sMsg  = oBody.firstChild.nodeValue
                    _self.dispatchEvent('onreceivechat', {
                        from   : sFrom,
                        message: sMsg
                    });
                    getVar('roster').updateMessageHistory(sFrom, sMsg);
                }
            }
            else if (aMessages[i].getAttribute('type') == "normal") { //normal = Remote SmartBindings
                oBody = aMessages[i].getElementsByTagName('body')[0];
                if (oBody && oBody.firstChild) {
                    //Remote SmartBindings support
                    
                    //#ifdef __DEBUG
                    jpf.console.info('received the following from the server: '
                        + oBody.firstChild.nodeValue.replace(/\&quot;/g, '"'), 'xmpp');
                    //#endif
                    
                    _self.dispatchEvent('ondatachange', {
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
     * @see jpf.xmpp.parseData
     * @param {Array} aPresence
     * @type {void}
     * @private
     */
    function parsePresencePackets(aPresence) {
        //#ifdef __DEBUG
        jpf.console.info('parsePresencePacket: ' + aPresence.length, 'xmpp');
        //#endif

        for (var i = 0; i < aPresence.length; i++) {
            var sJID = aPresence[i].getAttribute('from');
            if (sJID) {
                var oUser = getVar('roster').getUserFromJID(sJID);
                // record any status change...
                getVar('roster').update(oUser,
                    aPresence[i].getAttribute('type') || jpf.xmpp.TYPE_AVAILABLE);
            }
        }
    }

    /**
     * One or more Iq messages have arrived that notify the user of system wide
     * events and results of its actions, e.g. the failure or success of setting
     * presence, connection errors, probe for supported features of nodes results,
     * etc.
     *
     * @see jpf.xmpp.parseData
     * @param {Array} aIQs
     * @type {void}
     * @private
     */
    function parseIqPackets(aIQs) {
        //#ifdef __DEBUG
        jpf.console.info('parseIqPacket: ' + aIQs.length, 'xmpp');
        //#endif

        for (var i = 0; i < aIQs.length; i++) {
            if (aIQs[i].getAttribute('type') == "result") {
                var aQueries = aIQs[i].getElementsByTagName('query');
                for (var j = 0; j < aQueries.length; j++) {
                    //@todo: support more query types...whenever we need them
                    switch (aQueries[j].getAttribute('xmlns')) {
                        case _self.NS.roster:
                            var aItems  = aQueries[j].getElementsByTagName('item');
                            var oRoster = getVar('roster');
                            for (var k = 0; k < aItems.length; k++) {
                                //@todo: should we do something with the 'subscription' attribute?
                                var sGroup = (aItems[k].childNodes.length > 0)
                                ? aItems[k].firstChild.firstChild.nodeValue
                                : "";
                                oRoster.getUserFromJID(aItems[k].getAttribute('jid'), sGroup)
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    /**
     * Provides the ability to change the presence of the user on the XMPP
     * network to any of the types in the following format:
     * 'jpf.xmpp.STATUS_*'
     *
     * @param {String} type Status type according to the RFC
     * @param {String} status Message describing the status
     * @param {String} custom Custom status type
     * @type {void}
     * @public
     */
    this.setPresence = function(type, status, custom) {
        if (!getVar('connected')) return false;

        this.doXmlRequest(restartListener, createBodyTag({
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : _self.NS.httpbind
            }, createPresenceBlock({
                type  : type || jpf.xmpp.TYPE_AVAILABLE,
                status: status,
                custom: custom
            }))
        );
    };

    /**
     * Provides the ability to send a (chat-)message to any node inside the user's
     * Roster. If the 'type' property is set, it must be one of the constants in
     * the following format:
     * 'jpf.xmpp.MSG_*'
     *
     * @param {String} to Must be of the format 'node@domainname.ext'
     * @param {String} message
     * @param {String} thread Optional.
     * @param {String} type Optional.
     * @type {void}
     */
    this.sendMessage = function(to, message, thread, type, callback) {
        if (!message) return false;

        //#ifdef __WITH_OFFLINE
        /*
            Note: This mechanism can also be used to only sent chat messages
            to only contacts. This can be more useful than using XMPP's server
            storage solution, because of the feedback to user.
        */
        var _self = this;
        if (!jpf.offline.isOnline) {
            if (jpf.offline.queue.enabled) {
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
                    __object : [this.name, "new jpf.xmpp()"],
                    __retry  : "this.object.sendMessage(this.to, this.message, \
                        this.thread, this.type, this.callback)"
                };

                jpf.offline.queue.add(info);

                return;
            }

            /*
                Apparently we're doing an XMPP call even though we're offline
                I'm allowing it, because the developer seems to know more
                about it than I right now
            */

            //#ifdef __DEBUG
            jpf.console.warn("Trying to sent XMPP message even though \
                              application is offline.", 'xmpp');
            //#endif
        }
        //#endif

        if (!getVar('connected')) return false;

        var oUser;
        if (!to) { //What is the purpose of this functionality? (Ruben)
            oUser = getVar('roster').getLastAvailableUser();
            to    = oUser.jid;
        }
        if (!to) return false; //finally: failure :'(

        if (!oUser)
            oUser = getVar('roster').getUserFromJID(to);

        this.doXmlRequest(function(data, state, extra){
                if (callback)
                    callback.call(this, data, state, extra)

                restartListener.call(this, data)
            }, createBodyTag({
                rid   : getRID(),
                sid   : getVar('SID'),
                xmlns : _self.NS.httpbind
            }, createMessageBlock({
                type       : type || jpf.xmpp.MSG_CHAT,
                to         : oUser.node + '@' + oUser.domain + '/' + this.resource,
                thread     : thread,
                'xml:lang' : 'en'
            }, "<![CDATA[" + message + "]]>"))
        );
    };

    /**
     * Makes sure that a few header are sent along with all the requests to the
     * XMPP server. This function overrides the abstract found in jpf.http
     *
     * @see jpf.http
     * @param {Object} http
     * @type {void}
     */
    this.__HeaderHook = function(http) {
        http.setRequestHeader('Host', this.domain);
        if (this.xmppMethod & jpf.CONN_POST) {
            if (http.overrideMimeType)
                http.overrideMimeType('text/plain; charset=utf-8');
            http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        }
        else {
            http.setRequestHeader('Content-type', 'text/xml; charset=utf-8');
        }
    };

    /**
     * This is the connector function between the JML representation of this
     * Teleport module. If specified, it will also setup the Remote SmartBinding
     * feature.
     *
     * Sample JML:
     *   <j:teleport>
     *       <j:xmpp id="myXMPP" url="http://jabber.org:5280/http-bind" roster-model="myRoster" connection="poll|bosh" />
     *   </j:teleport>
     *
     * @param {XMLDom} x An XML document element that contains xmpp metadata
     * @exception {Error} A general Error object
     * @type {void}
     */
    this.load = function(x){
        this.server  = x.getAttribute('url');
        var url      = new jpf.url(this.server);

        // do some extra startup/ syntax error checking
        if (!url.host || !url.port || !url.protocol)
            throw new Error(jpf.formatErrorString(0, this, 
                "XMPP initialization error", 
                "Invalid XMPP server url provided."));

        this.domain  = url.host;
        this.tagName = "xmpp";

        this.xmppMethod = (x.getAttribute('connection') == "poll")
            ? jpf.xmpp.CONN_POLL
            : jpf.xmpp.CONN_BOSH;

        this.isPoll   = Boolean(this.xmppMethod & jpf.xmpp.CONN_POLL);

        this.timeout  = parseInt(x.getAttribute("timeout")) || this.timeout;
        this.resource = x.getAttribute('resource') || jpf.appsettings.name;

        // provide a virtual Model to make it possible to bind with this XMPP
        // instance remotely.
        // We agreed on the following format for binding: model-contents="roster|typing|chat"
        var sModel        = x.getAttribute('model');
        var aContents     = (x.getAttribute('model-contents') || "").split('|');
        this.modelContent = {
            roster: false,
            chat  : false,
            typing: false
        };
        for (var i = 0; i < aContents.length; i++) {
            aContents[i] = aContents[i].trim();
            if (!this.modelContent[aContents[i]])
                this.modelContent[aContents[i]] = true;
        }
        if (sModel && aContents.length) {
            this.oModel = jpf.setReference(sModel,
                jpf.nameserver.register("model", sModel, new jpf.Model()));
            // set the root node for this model
            this.oModel.load('<xmpp/>');
        }

        // parse any custom events formatted like 'onfoo="doBar();"'
        var attr = x.attributes;
        for (var i = 0; i < attr.length; i++) {
            if (attr[i].nodeName.indexOf("on") == 0)
                this.addEventListener(attr[i].nodeName,
                    new Function(attr[i].nodeValue));
        }
    };
};

/**
 * Component implementing a Roster service for the jpf.xmpp object.
 * The Roster is a centralised registry for Jabber ID's (JID) to which
 * the user subscribed. Whenever the presence info of a JID changes, the roster
 * will get updated accordingly.
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @classDescription This class intantiates a new XMPP Roster object
 * @return {jpf.xmpp.Roster} A new XMPP Roster object
 * @type {Object}
 * @constructor
 */
jpf.xmpp.Roster = function(model, modelContent, resource) {
    this.resource = resource;

    var aUsers = [];

    /**
     * Lookup function; searches for a JID with node object, domain and/ or
     * resource info provided.
     * It may return an collection of JID's when little info to search with is
     * provided.
     *
     * @param {String} node
     * @param {String} domain
     * @param {String} resource
     * @type {mixed}
     */
    this.getUser = function(node, domain, resource) {
        if (typeof node == "undefined") return null;

        var aResult = [];

        // the code below is just a failsafe for user items that arrive through
        // an <IQ> query for a roster.
        if (node.indexOf('@') != -1) {
            var aTemp = node.split('@');
            node      = aTemp[0];
            domain    = aTemp[1];
        }

        var bDomain   = (typeof domain   != "undefined");
        var bResource = (typeof resource != "undefined");

        var sJID = node + (bDomain ? '@' + domain : '')
        + (bResource ? '/' + resource : '');

        for (var i = 0; i < aUsers.length; i++) {
            if (aUsers[i].jid.indexOf(sJID) === 0)
                aResult.push(aUsers[i]);
        }

        if (aResult.length === 0) return null;

        return (aResult.length == 1) ? aResult[0] : aResult;
    };

    /**
     * Lookup function; searches for a JID object with JID info provided in the
     * following, common, XMPP format: 'node@domain/resource'
     *
     * @param {String} jid
     * @type {Object}
     */
    this.getUserFromJID = function(jid) {
        var resource = "", node;
        var sGroup = (arguments.length > 1) ? arguments[1] : "";

        if (jid.indexOf('/') != -1) {
            resource = jid.substring(jid.indexOf('/') + 1) || "";
            jid      = jid.substring(0, jid.indexOf('/'));
        }
        if (jid.indexOf('@') != -1) {
            node = jid.substring(0, jid.indexOf('@'));
            jid  = jid.substring(jid.indexOf('@') + 1);
        }
        var domain = jid;

        var oUser  = this.getUser(node, domain);//, resource);

        // Auto-add new users with status TYPE_UNAVAILABLE
        // Status TYPE_AVAILABLE only arrives with <presence> messages
        if (!oUser && node && domain) {
            // @todo: change the user-roster structure to be more 'resource-agnostic'
            resource = resource || this.resource;
            oUser = this.update({
                node     : node,
                domain   : domain,
                resources: [resource],
                jid      : node + '@' + domain + '/' + resource,
                group    : sGroup,
                status   : jpf.xmpp.TYPE_UNAVAILABLE
            });
        }
        else if (oUser && oUser.group !== sGroup)
            oUser.group = sGroup;

        //fix a missing 'resource' property...
        if (resource && !oUser.resources.contains(resource)) {
            oUser.resources.push(resource);
            oUser.jid = node + '@' + domain + '/' + resource
        }

        return oUser;
    };

    /**
     * When a JID is added, deleted or updated, it will pass this function that
     * marshalls the Roster contents.
     * It ensures that the Remote SmartBindings link with a model is synchronized
     * at all times.
     *
     * @param {Object} oUser
     * @type {Object}
     */
    this.update = function(oUser) {
        if (!this.getUser(oUser.node, oUser.domain, oUser.resource)) {
            aUsers.push(oUser);
            //Remote SmartBindings: update the model with the new User
            if (model && modelContent.roster) {
                oUser.xml = model.data.ownerDocument.createElement('user');
                this.updateUserXml(oUser);
                jpf.xmldb.appendChild(model.data, oUser.xml);
            }
        }

        if (arguments.length > 1)
            oUser.status = arguments[1];

        // update all known properties for now (bit verbose, might be changed
        // in the future)
        return this.updateUserXml(oUser);
    };

    var userProps = ['node', 'domain', 'resource', 'jid', 'status'];
    /**
     * Propagate any change in the JID to the model to which the XMPP connection
     * is attached.
     *
     * @param {Object} oUser
     * @type {Object}
     */
    this.updateUserXml = function(oUser) {
        userProps.forEach(function(item) {
            oUser.xml.setAttribute(item, oUser[item]);
        });
        jpf.xmldb.applyChanges('synchronize', oUser.xml);

        return oUser;
    };

    /**
     * Append incoming chat messages to the user XML element, so they are
     * accessible to the model.
     *
     * @param {String} sJID The Jabber Identifier of the sender
     * @param {String} sMsg The actual message
     * @type  {void}
     */
    this.updateMessageHistory = function(sJID, sMsg) {
        if (!model || !modelContent.chat) return;

        var oUser = this.getUserFromJID(sJID);
        if (!oUser || !oUser.xml) return;
        
        var oDoc = model.data.ownerDocument;
        var oMsg = oDoc.createElement('message');
        oMsg.appendChild(oDoc.createTextNode(sMsg));
        
        jpg.xmldb.appendChild(oUser.xml, oMsg);
        jpf.xmldb.applyChanges('synchronize', oUser.xml);
    };

    /**
     * Transform a JID object into a Stringified represention of XML.
     *
     * @param {Object} oUser
     * @type {String}
     */
    this.userToXml = function(oUser) {
        var aOut = ['<user '];

        userProps.forEach(function(item) {
            aOut.push(item, '="', oUser[item], '" ');
        });

        return aOut.join('') + '/>';
    };

    /**
     * API; return the last JID that has been appended to the Roster
     *
     * @type {Object}
     */
    this.getLastUser = function() {
        return aUsers[aUsers.length - 1];
    };

    /**
     * API; return the last JID that is available for messaging through XMPP.
     *
     * @type {Object}
     */
    this.getLastAvailableUser = function() {
        for (var i = aUsers.length - 1; i >= 0; i--) {
            if (aUsers[i].status !== jpf.xmpp.TYPE_UNAVAILABLE)
                return aUsers[i];
        }

        return null;
    };
};

jpf.xmpp.CONN_POLL = 0x0001;
jpf.xmpp.CONN_BOSH = 0x0002

jpf.xmpp.TYPE_AVAILABLE   = ""; //no need to send available
jpf.xmpp.TYPE_UNAVAILABLE = "unavailable";

jpf.xmpp.STATUS_SHOW = "show";
jpf.xmpp.STATUS_AWAY = "away";
jpf.xmpp.STATUS_XA   = "xa";
jpf.xmpp.STATUS_DND  = "dnd";

jpf.xmpp.MSG_CHAT      = "chat";
jpf.xmpp.MSG_GROUPCHAT = "groupchat";
jpf.xmpp.MSG_ERROR     = "error";
jpf.xmpp.MSG_HEADLINE  = "headline";
jpf.xmpp.MSG_NORMAL    = "normal";

// #ifdef __WITH_DSINSTR

/**
 * Instruction handler for XMPP protocols. It supports the following directives:
 * - xmpp:name.login(username, password)
 * - xmpp:name.logout()
 * - xmpp:name.notify(message, to_address, thread, type)
 *
 * @param {object} options  Valid options are
 *    instrType     {string}
 *    data          {string}
 *    multicall     {boolean}
 *    userdata      {variant}
 *    arg           {array}
 *    isGetRequest  {boolean}
 */
jpf.datainstr.xmpp = function(xmlContext, options, callback){
    var parsed = options.parsed || this.parseInstructionPart(
        options.instrData.join(":"), xmlContext, options.args, options);

    if (options.preparse) {
        options.parsed = parsed;
        options.preparse = false;
        return;
    }

    var oXmpp, name = parsed.name.split(".");
    if (name.length == 1) {
        var modules = jpf.teleport.modules;
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
        throw new Error(jpf.formatErrorString(0, null, "Saving/Loading data", 
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
            oXmpp.connect(args[0], args[1], callback);
            break;
        case "logout":
            //@todo
            break;
        case "notify":
            oXmpp.sendMessage(args[1], args[0], args[2], args[3], callback);
            break;
        default:
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, null, "Saving/Loading data", 
                "Invalid XMPP data instruction '" + options.instruction + "'"));
            //#endif
            break;
    }
};

// #endif

// #endif
