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

// #ifdef __TP_XMPP_MUC
// #define __AMLTELEPORT 1

/**
 * Interface implementing a Multi User Chat service for the apf.xmpp object.
 * The Multi User Chat class is a class that contains all the functions needed
 * to start, end, join, leave any XMPP/ Jabber chat room, and more.
 * @link http://xmpp.org/extensions/xep-0045.html
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       3.0
 * @classDescription This class intantiates a new XMPP MUC object
 * @return {apf.xmpp.Roster} A new XMPP MUC object
 * @type {Object}
 * @constructor
 */
apf.xmpp_muc = function(){
    var _self   = this,
        mucVars = {
            created: {} // list of room ID's that the user created him/herself
        },
        // keep reference to access class constants in function scope chain
        oXmpp   = apf.xmpp,
        // munge often-used strings
        SID     = "SID",
        JID     = "JID",
        CONN    = "connected";
    this.$mucRoster = new apf.xmpp_roster(this.$mucModel, {muc: true}, this.resource);

    /*
     * Wrapper function for apf.xmpp.$doXmlRequest. Since all MUC request are 
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
            _self.$serverVars["muc_callback"] = fCallback;
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
     * Get the status code from a server response XML document and compare it
     * with an expected status 'iStatus'. Status codes are usually located in a
     * 'code' attribute on a <status> stanza.
     *
     * @param {XMLDocument} oXml    Document that may contain <status> nodes
     * @param {Number}      iStatus Expected status code
     * @type  {mixed}
     */
    this.$getStatusCode = function(oXml, iStatus) {
        var aStatuses = oXml.getElementsByTagName("status");
        for (var i = 0, l = aStatuses.length; i < l; i++) {
            if (aStatuses[i]
              && parseInt(aStatuses[i].getAttribute("code")) == iStatus)
                return iStatus;
        }
        return false;
    }

    /**
     * Get a list of available chat rooms from the XMPP server.
     * 
     * @type {void}
     */
    this.queryRooms = function() {
        if (!this.$canMuc || !this.$serverVars[CONN]) return;
        doRequest(this.$createIqBlock({
                from  : this.$serverVars[JID],
                to    : this.$mucDomain,
                type  : "get",
                id    : this.$makeUnique("disco")
            }, "<query xmlns='" + oXmpp.NS.disco_items + "'/>")
        );
    };

    /**
     * Adds/ registers a room to the local Roster instance.
     * 
     * @param {String} sJID    Jabber ID of the room we're adding
     * @param {String} [sName] Optional name of the room
     */
    this.$addRoom = function(sJID, sName) {
        return this.$mucRoster.getEntityByJID(sJID.replace(/\/.*$/, ""), sName);
    };

    /**
     * Checks if a specified Jabber ID is registered locally as a chatroom.
     * 
     * @param {String} sJID Jabber ID to check
     * @type  {void}
     */
    this.$isRoom = function(sJID) {
        var parts = sJID.replace(/\/.*$/, "").split("@");
        return this.$mucRoster.getEntity(parts[0], parts[1], null, true) 
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
    this.$addRoomOccupant = function(sJID) {
        return this.$mucRoster.getEntityByJID(sJID);
    };

    /**
     * Provided a room, get all its info and capabilities.
     * Not implemented yet.
     * 
     * @param {String} sRoom
     */
    this.queryRoomInfo = function(sRoom) {
        // @todo Room info querying
    };

    this.getRoom = function(sRoom, callback) {
        if (!this.$canMuc || !this.$serverVars[CONN]) return;
        mucVars["room_cb_" + sRoom] = callback;
        doRequest(this.$createIqBlock({
                from  : this.$serverVars[JID],
                to    : sRoom,
                type  : "get",
                id    : this.$makeUnique("disco")
            }, "<query xmlns='" + oXmpp.NS.disco_items + "'/>")
        );
    };

    this.$mucSignal = function(iType, sRoom, oData) {
        sRoom  = sRoom.replace(/\/.*$/, "");
        var f  = "room_cb_" + sRoom,
            cb = mucVars[f];
        delete mucVars[f];
        switch (iType) {
            case apf.xmpp_muc.ROOM_CREATE:
            case apf.xmpp_muc.ROOM_EXISTS:
                if (typeof cb == "function")
                    cb(true);
                break;
            case apf.xmpp_muc.ROOM_NOTFOUND:
                if (typeof cb == "function")
                    cb(false);
                break;
            case oXmpp.NS.datastatus:
                // a datastatus message will typically look like this:
                // <iq from="romeo@shakespeare.net/home" type="result" xmlns="jabber:iq:rsbstatus">
                //     <item status="change" prevdelta="x" currdelta="y"><![CDATA[
                //         ...
                //     ]]></item>
                // </iq>
                
                // 'old' style data message passing
                this.dispatchEvent("datachange", {
                    model           : sRoom.split("@")[0],
                    body            : oData
                });
                break;
        }
    };

    this.joinRoom = function(sRoom, sPassword, sNick, fCallback) {
        // @todo check for reserved nickname as described in
        //       http://xmpp.org/extensions/xep-0045.html#reservednick
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNick)
            sNick = this.$serverVars["username"];
        var parts = sRoom.split("@");
        this.$mucRoster.registerAccount(parts[0], parts[1], sNick);
        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sRoom + "/" + sNick
            },
            "<x xmlns='" + oXmpp.NS.muc + (sPassword
                ? "'><password>" + sPassword + "</x>"
                : "'/>")),
            fCallback
        );
    };

    this.leaveRoom = function(sRoom, sMsg, sNick, fCallback) {
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNick)
            sNick = this.$serverVars["username"];
        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sRoom + "/" + sNick,
                type  : oXmpp.TYPE_UNAVAILABLE
            }, sMsg ? "<status>" + sMsg + "</status>" : ""), fCallback
        );
    };

    this.leaveAllRooms = function(sMsg, sNick) {
        if (!this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNick)
            sNick = this.$serverVars["username"];
        var i, l, aRooms = this.$mucRoster.getRooms();
        for (i = 0, l = aRooms.length; i < l; i++)
            this.leaveRoom(aRooms[i].bareJID, sMsg, sNick);
    };

    this.changeNick = function(sRoom, sNewNick, fCallback) {
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNewNick)
            sNewNick = this.username;
        var parts = sRoom.split("@");
        this.$mucRoster.registerAccount(parts[0], parts[1], sNewNick);
        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sRoom + "/" + sNewNick
            }), fCallback
        );
    };

    this.invite = function(sRoom, sJID, sReason, fCallback) {
        var oUser = this.$serverVars["roster"].getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(createMessageBlock({
                from : _self.$serverVars[JID],
                to   : sRoom
            },
            "<x xmlns='" + oXmpp.NS.muc_user + "'><invite to='"
            + oUser.bareJID + (sReason
                ? "'><reason>" + sReason + "</reason></invite>"
                : "'/>") + "</x>"),
            fCallback
        );
    };

    this.declineInvite = function(sRoom, sJID, sReason, fCallback) {
        var oUser = this.$serverVars["roster"].getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(createMessageBlock({
                from : _self.$serverVars[JID],
                to   : sRoom
            },
            "<x xmlns='" + oXmpp.NS.muc_user + "'><decline to='"
            + oUser.bareJID + (sReason
                ? "'><reason>" + sReason + "</reason></invite>"
                : "'/>") + "</x>"),
            fCallback
        );
    };

    this.moderate = function(action, options) {
        // @todo
    };

    this.createRoom = function(sRoom, sNick, fCallback) {
        // @todo implement/ support Reserved Rooms
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNick)
            sNick = this.$serverVars["username"];
        sRoom = this.$mucRoster.sanitizeJID(sRoom);
        var parts = sRoom.split("@"),
            f     = "room_cb_" + sRoom;
        this.$mucRoster.registerAccount(parts[0], parts[1], sNick);
        mucVars.created[sRoom] = false;

        mucVars[f] = function(bSuccess) {
            // @todo notify user
            delete mucVars[f];
            if (!bSuccess)
                return (typeof callback == "function" ? callback(bSuccess) : false);
            mucVars[f] = function(bSuccess) {
                delete mucVars[f];
                _self.$addRoom(sRoom, sRoom.substr(0, sRoom.indexOf("@")));
                mucVars.created[sRoom] = true;
                if (fCallback)
                    fCallback(bSuccess);
            };
            doRequest(_self.$createIqBlock({
                    from  : _self.$serverVars[JID],
                    to    : sRoom,
                    type  : "set",
                    id    : _self.$makeUnique("create")
                },
                "<query xmlns='" + oXmpp.NS.muc_owner + "'><x xmlns='"
                + oXmpp.NS.data + "' type='submit'/></query>")
            );
        };

        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sRoom + "/" + sNick
            },
            "<x xmlns='" + oXmpp.NS.muc + "'/>")
        );
    };

    this.joinOrCreateRoom = function(sRoom, sNick, fCallback) {
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNick)
            sNick = this.$serverVars["username"];
        var parts = sRoom.split("@");
        this.$mucRoster.registerAccount(parts[0], parts[1], sNick);
        sRoom = this.$mucRoster.sanitizeJID(sRoom);
        mucVars.created[sRoom] = false;
        this.getRoom(sRoom, function(bSuccess) {
            // a password may be returned from the 'muc-password' event handler
            if (bSuccess) {
                _self.joinRoom(sRoom, _self.dispatchEvent("muc-password") || null, 
                    sNick, fCallback);
            }
            else {
                _self.createRoom(sRoom, sNick, function(bSuccess2) {
                    if (bSuccess2)
                        _self.joinRoom(sRoom, null, sNick, fCallback);
                });
            }
        });
    };

    this.destroyRoom = function(sRoom, sReason) {
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        doRequest(this.$createIqBlock({
                from  : this.$serverVars[JID],
                to    : sRoom,
                type  : "set",
                id    : this.$makeUnique("create")
            },
            "<query xmlns='" + oXmpp.NS.muc_owner + "'><destroy jid='"
            + sRoom + (sReason 
                ? "'><reason>" + sReason + "</reason></destroy>"
                : "'/>")
            + "</query>")
        );
    };

    //#ifdef __WITH_RSB
    this.startRSB = function(sSession, fCallback) {
        if (!sSession)
            throw new Error(apf.formatErrorString(0, this, "Initiating RSB session", "Invalid model provided."));
        var sRoom = this.$mucRoster.sanitizeJID(sSession + "@" + this.$mucDomain);
        mucVars[sRoom + "started"] = fCallback;
        this.joinOrCreateRoom(sRoom, this.$serverVars["roster"].username, function() {
            if (mucVars.created[sRoom]) {
                // room was created, so no need to fetch the latest changes,
                // just start broadcasting them
                fCallback(sRoom.substring(0, sRoom.indexOf("@")));
                mucVars[sRoom + "started"] = null;
            }
            else {
                // room created, now it's time to get the latest model version
                // and metadata
                mucVars[sRoom + "started"].joined = 0;
            }
        });
    };

    this.endRSB = function(sSession) {
        if (!sSession)
            throw new Error(apf.formatErrorString(0, this, "Ending RSB session", "Invalid model provided."));
        // todo
    };

    this.syncRSB = function(oData) {
        // do not request data from rooms we created ourselves
        if (mucVars.created[oData.room]) return;

        var _self = this;
        $setTimeout(function() {
            _self.sendMessage({
                to   : _self.$serverVars["roster"].getEntity(oData.owner).fullJID,
                x    : "<field type='text-single' var='session'><value>"
                     + oData.room.substring(0, oData.room.indexOf("@"))
                     + "</value></field>"
                     + "<field type='text-single' var='baseline'><value>get</value></field>"
                     + "<field type='text-multi' var='modeldata'><value>" + oData.model + "</value></field>",
                xtype: "submit",
                type : oXmpp.MSG_NORMAL
            });
        });
    };

    this.sendSyncRSB = function(sTo, sSession, iBaseline, sData) {
        var _self = this;
        $setTimeout(function() {
            _self.sendMessage({
                to   : sTo,
                x    : "<field type='text-single' var='session'><value>" + sSession + "</value></field>"
                     + "<field type='text-single' var='baseline'><value>" + iBaseline + "</value></field>"
                     + (sData
                        ? "<field type='text-multi' var='modeldata'><value><![CDATA[" + sData + "]]></value></field>"
                        : ""),
                xtype: "result",
                type : oXmpp.MSG_NORMAL
            });
        });
    };

    this.sendRSB = function(sModel, sMsg) {
        var oRoster = this.$serverVars["roster"];
        if (!oRoster) return;
        var sRoom = this.$mucRoster.sanitizeJID(sModel + "@" + this.$mucDomain);
        this.sendMessage({
            to     : sRoom,
            message: sMsg,
            thread : "rsb",
            type   : oXmpp.MSG_GROUPCHAT
        });
    };

    this.addEventListener("receivedparticipant", function(oData) {
        var sPart     = oData.participant,
            iResIdx   = sPart.indexOf("/"),
            sRoom     = sPart.substring(0, iResIdx),
            sModel    = sRoom.substring(0, sRoom.indexOf("@")),
            sNick     = sPart.substring(iResIdx + 1),
            fCallback = mucVars[sRoom + "started"];
        // do not request data from rooms we created ourselves
        if (mucVars.created[sRoom] || (oData.affiliation != "owner"
          && sNick != this.$serverVars["roster"].username))
            return;

        if (oData.affiliation == "owner")
            fCallback.owner = sNick;
        if (++fCallback.joined == 2) {
            this.syncRSB({
                room : sRoom,
                model: sModel,
                owner: fCallback.owner
            });
            delete mucVars[sRoom + "started"];
        }
    });
    //#endif

    // @todo: implement room registration as per JEP-77
    // @todo: implement all moderator features
    // @todo: implement all admin & owner features
};

apf.xmpp_muc.ROOM_CREATE    = 1;
apf.xmpp_muc.ROOM_EXISTS    = 2;
apf.xmpp_muc.ROOM_NOTFOUND  = 3;
apf.xmpp_muc.ROOM_JOINED    = 4;
apf.xmpp_muc.ROOM_LEFT      = 5;
apf.xmpp_muc.ROOM_RSB       = 5;

apf.xmpp_muc.ACTION_SUBJECT = 0x0001;
apf.xmpp_muc.ACTION_KICK    = 0x0002;
apf.xmpp_muc.ACTION_BAN     = 0x0004;
apf.xmpp_muc.ACTION_GRANT   = 0x0008;
apf.xmpp_muc.ACTION_REVOKE  = 0x0010;

// #endif
