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

// #ifdef __TP_XMPP_RDB

/**
 * Description
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       3.0
 * @classDescription This class intantiates a new XMPP RDB object
 * @return {apf.xmpp_rdb} A new XMPP RDB object
 * @type {Object}
 * @constructor
 */
apf.xmpp_rdb = function(){
    var _self   = this,
        rdbVars = {},
        // keep reference to access class constants in function scope chain
        oXmpp   = apf.xmpp,
        // munge often-used strings
        SID     = "SID",
        JID     = "JID",
        CONN    = "connected";
    this.$rdbRoster = new apf.xmpp_roster(this["rdb-model"], {rdb: true}, this.resource);

    /*
     * Wrapper function for apf.xmpp.$doXmlRequest. Since all RDB request are
     * asynchronous - responses to each call return via the message poll/ push -
     * the only variable left for each request is the text body.
     *
     * @param {String}   sBody
     * @param {Function} [fCallback]
     * @private
     */
    function doRequest(sBody, fCallback) {
        if (!sBody) return;
        if (fCallback)
            _self.$serverVars["rdb_callback"] = fCallback;
        _self.$doXmlRequest(_self.$restartListener, _self.$isPoll
            ? _self.$createStreamElement(null, null, sBody)
            : _self.$createBodyElement({
                rid   : _self.$getRID(),
                sid   : _self.$serverVars[SID],
                xmlns : oXmpp.NS.httpbind
            }, sBody)
        );
    }

    /**
     * Adds/ registers a room to the local Roster instance.
     *
     * @param {String} sJID    Jabber ID of the room we're adding
     * @param {String} [sName] Optional name of the room
     */
    this.$addDoc = function(sJID, sName) {
        return this.$rdbRoster.getEntityByJID(sJID.replace(/\/.*$/, ""), sName);
    };

    /**
     * Checks if a specified Jabber ID is registered locally as a chatroom.
     *
     * @param {String} sJID Jabber ID to check
     * @type  {void}
     */
    this.$isDoc = function(sJID) {
        var parts = sJID.replace(/\/.*$/, "").split("@");
        return this.$rdbRoster.getEntity(parts[0], parts[1], null, true)
            ? true
            : false;
    };

    /**
     * Add a Jabber ID - who most probably just joined - to a chatroom and
     * thereby to the Roster.
     *
     * @param {String} sJID Jabber ID that just joined a chatroom
     * @type  {Object}
     */
    this.$addDocOccupant = function(sJID) {
        return this.$rdbRoster.getEntityByJID(sJID);
    };

    this.$rdbSignal = function(oNode) {
        var idx, oEnt,
            sDoc  = null,
            sJoin = oNode.getAttribute("join") || null,
            sJID  = oNode.getAttribute("from");
        if ((idx = sJID.indexOf("@")) > -1)
            sDoc = sJID.substring(0, idx);
        var f     = "doc_cb_" + (sDoc || "generic"),
            cb    = rdbVars[f];
        delete rdbVars[f];

        // bot logic...
        if (this["rdb-bot"]) {
            if (sJoin) {
                this.$addDoc(sJID);
                oEnt = this.$rdbRoster.getEntityByJID(sJoin, {
                    room       : sDoc,
                    roomJID    : sJID,
                    affiliation: "participant",
                    role       : "member",
                    status     : "",
                    isRDB      : true
                });
                // join request from a client, acknowledge it and send the document
                this.dispatchEvent("datastatuschange", {
                    annotator: sJoin,
                    session  : sDoc,
                    type     : "submit",
                    baseline : 1,
                    modeldata: 1,
                    fields   : {}
                });
            }
            else if (cb) {
                // callback, probably the result of the bot registering itself
                cb(oNode);
            }
            else if (sDoc) {
                this.$addDoc(sJID);
                // a new document session is started
                oEnt = this.$rdbRoster.getEntityByJID(this.$serverVars[JID], {
                    room       : sDoc,
                    roomJID    : sJID,
                    affiliation: "owner",
                    role       : "owner",
                    status     : "",
                    isRDB      : true
                });
            }
        }
        // client logic...
        else {
            if (sJoin) {
                // a new document session is started
                this.$addDoc(sJID);
                oEnt = this.$rdbRoster.getEntityByJID(this.$serverVars[JID], {
                    room       : sDoc,
                    roomJID    : sJID,
                    affiliation: "participant",
                    role       : "member",
                    status     : "",
                    isRDB      : true
                });

                // check for baseline time and initial dataset
                var aBaseline = oNode.getElementsByTagName("baseline"),
                    aData     = oNode.getElementsByTagName("data");

                this.dispatchEvent("datastatuschange", {
                    type     : "result",
                    annotator: sJID,
                    fields   : {
                        session  : sDoc,
                        baseline : aBaseline.length ? aBaseline[0].firstChild.nodeValue : "",
                        modeldata: aData.length     ? aData[0].firstChild.nodeValue : ""
                    }
                });
            }
            else if (arguments[1] && sJID != oNode.getAttribute("to")) {
                this.dispatchEvent("datachange", {
                    annotator: sJID,
                    session  : sDoc,
                    body     : arguments[1]
                });
            }
        }
    };

    this.joinDoc = function(sDoc, sPassword, fCallback) {
        if (!sDoc || !this.$canRDB || !this.$serverVars[CONN]) return;
        var parts = sDoc.split("@");
        this.$rdbRoster.registerAccount(parts[0], parts[1], this.$serverVars["username"]);
        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sDoc
            }, sPassword
                ? "<x xmlns='" + oXmpp.NS.rdb + "'><password>" + sPassword + "</password></x>"
                : ""
            ), fCallback
        );
    };

    this.leaveDoc = function(sDoc, sMsg, fCallback) {
        if (!sDoc || !this.$canRDB || !this.$serverVars[CONN]) return;
        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sDoc,
                type  : oXmpp.TYPE_UNAVAILABLE
            }, sMsg ? "<status>" + sMsg + "</status>" : ""), fCallback
        );
    };

    this.leaveAllDocs = function(sMsg, sNick) {
        if (!this.$canRDB || !this.$serverVars[CONN]) return;
        if (!sNick)
            sNick = this.$serverVars["username"];
        var i, l, aDocs = this.$rdbRoster.getRooms();
        for (i = 0, l = aDocs.length; i < l; i++)
            this.leaveDoc(aDocs[i].bareJID, sMsg);
    };

    this.invite = function(sDoc, sJID, sReason, fCallback) {
        var oUser = this.$serverVars["roster"].getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(createMessageBlock({
                from : _self.$serverVars[JID],
                to   : sDoc
            },
            "<x xmlns='" + oXmpp.NS.rdb_user + "'><invite to='"
            + oUser.bareJID + (sReason
                ? "'><reason>" + sReason + "</reason></invite>"
                : "'/>") + "</x>"),
            fCallback
        );
    };

    this.declineInvite = function(sDoc, sJID, sReason, fCallback) {
        var oUser = this.$serverVars["roster"].getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(createMessageBlock({
                from : _self.$serverVars[JID],
                to   : sDoc
            },
            "<x xmlns='" + oXmpp.NS.rdb_user + "'><decline to='"
            + oUser.bareJID + (sReason
                ? "'><reason>" + sReason + "</reason></invite>"
                : "'/>") + "</x>"),
            fCallback
        );
    };

    this.setPrivileges = function(sDoc, sTo, sAffiliation, fCallback) {
        var oOwner    = this.$rdbRoster.getRoomOwner(sDoc),
            oRoster   = this.$serverVars["roster"],
            sType     = oOwner.nick == oRoster.username ? "owner" : "admin",
            sNS       = oOwner.nick == oRoster.username
                ? oXmpp.NS.rdb_owner
                : oXmpp.NS.rdb_admin;
        doRequest(_self.$createIqBlock({
                from  : _self.$serverVars[JID],
                to    : sDoc,
                type  : "set",
                id    : _self.$makeUnique(sType)
            },
            "<query xmlns='" + sNS + "'><item affiliation='" + sAffiliation
                + "' jid='" + sTo + "'/></query>"),
            fCallback
        );
    };

    this.sendSyncRDB = function(sTo, sSession, iBaseline, sData) {
        var _self = this;
        $setTimeout(function() {
            doRequest(_self.$createPresenceBlock({
                    from  : _self.$serverVars[JID],
                    to    : sSession + "@" + _self["rdb-domain"],
                    join  : sTo
                }, sData
                    ? "<x xmlns='" + oXmpp.NS.data + "'><baseline>" + iBaseline
                      + "</baseline><data><![CDATA[" + sData + "]]></data></x>"
                    : ""
                )
            );
        });
    };

    this.startRDB = function(sSession, fCallback) {
        if (!sSession)
            throw new Error(apf.formatErrorString(0, this, "Initiating RDB session", "Invalid model provided."));
        var sDoc  = this.$rdbRoster.sanitizeJID(sSession + "@" + this["rdb-domain"]),
            _self = this,
            f     = function() {
                rdbVars["bot_started"] = true;
                // room was created, so no need to fetch the latest changes,
                // just start broadcasting them
                if (fCallback)
                    fCallback(sDoc.substring(0, sDoc.indexOf("@")));
                // room joined, now wait till we get the latest model version
                // and metadata from the owner of the room
            };
        if (this["rdb-bot"] && !rdbVars["bot_started"]) {
            clearTimeout(rdbVars["bot_timer"]);
            rdbVars["bot_timer"] = $setTimeout(function() {
                _self.botRegister(_self["rdb-domain"], f);
            }, 200);
        }
        else {
            // a password may be returned from the 'rdb-password' event handler
            this.joinDoc(sDoc, this.dispatchEvent("rdb-password") || null, f);
        }
    };

    this.endRDB = function(sSession) {
        if (!sSession)
            throw new Error(apf.formatErrorString(0, this, "Ending RDB session", "Invalid model provided."));
        if (this["rdb-bot"] && rdbVars["bot_started"]) {
            var _self = this;
            clearTimeout(rdbVars["bot_timer2"]);
            rdbVars["bot_timer2"] = $setTimeout(function() {
                _self.botUnregister(_self["rdb-domain"], function() {
                    rdbVars["bot_started"] = false;
                });
            });
        }
        else {
            this.leaveDoc(sSession);
        }
    };

    this.sendRDB = function(sModel, sMsg) {
        this.sendMessage({
            to     : this.$rdbRoster.sanitizeJID(sModel + "@" + this["rdb-domain"]),
            message: sMsg,
            thread : "rdb"
        });
    };

    this.botRegister = function(sDomain, fCallback) {
        if (!sDomain || !this.$canRDB || !this.$serverVars[CONN]) return;
        this.$rdbRoster.registerAccount(this.$serverVars["username"], sDomain);
        var _self = this;
        rdbVars["doc_cb_generic"] = function(oNode) {
            // success if the server returned us a presence message
            _self.$canRDB = (oNode && oNode.tagName == "presence"
                && !oNode.getElementsByTagName("error").length);
            if (fCallback)
                fCallback(_self.$canRDB, oNode);
        };
        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sDomain,
                prio  : this.dispatchEvent("priority") || this.priority || null
            })
        );
    };

    this.botUnregister = function(sDomain, fCallback) {
        if (!sDomain || !this.$canRDB || !this.$serverVars[CONN]) return;
        this.$rdbRoster.reset();
        rdbVars["doc_cb_generic"] = function(oXml) {
            // success if the server returned us a presence message
            if (!fCallback) return;
            fCallback(oXml && oXml.getElementsByTagName("presence").length
                && !oXml.getElementsByTagName("error").length)
        };
        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sDomain,
                type  : apf.xmpp.TYPE_UNAVAILABLE
            })
        );
    };
};

apf.xmpp_rdb.DOC_CREATE    = 1;
apf.xmpp_rdb.DOC_EXISTS    = 2;
apf.xmpp_rdb.DOC_NOTFOUND  = 3;
apf.xmpp_rdb.DOC_JOINED    = 4;
apf.xmpp_rdb.DOC_LEFT      = 5;
apf.xmpp_rdb.DOC_RDB       = 6;

apf.xmpp_rdb.ACTION_SUBJECT = 0x0001;
apf.xmpp_rdb.ACTION_KICK    = 0x0002;
apf.xmpp_rdb.ACTION_BAN     = 0x0004;
apf.xmpp_rdb.ACTION_GRANT   = 0x0008;
apf.xmpp_rdb.ACTION_REVOKE  = 0x0010;

// #endif
