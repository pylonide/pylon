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
        mucVars = {},
        // munge often-used strings
        SID     = "SID",
        JID     = "JID",
        CONN    = "connected";
    this.$mucRoster = new apf.xmpp_roster(this.oMucModel, {muc: true}, this.resource);

    /*
     * Wrapper function for apf.xmpp.$doXmlRequest. Since all MUC request are 
     * asynchronous - responses to each call return via the message poll/ push -
     * the only variable left for each request is the text body.
     * 
     * @param {String} sBody
     * @private
     */
    function doRequest(sBody) {
        if (!sBody) return;
        _self.$doXmlRequest(_self.$restartListener, _self.$isPoll
            ? _self.$createStreamElement(null, null, sBody)
            : _self.$createBodyElement({
                rid   : _self.$getRID(),
                sid   : _self.$serverVars[SID],
                xmlns : apf.xmpp.NS.httpbind
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
            }, "<query xmlns='" + apf.xmpp.NS.disco_items + "'/>")
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
            }, "<query xmlns='" + apf.xmpp.NS.disco_items + "'/>")
        );
    };

    this.$mucSignal = function(iType, sRoom) {
        sRoom  = sRoom.replace(/\/.*$/, "");
        var f  = "room_cb_" + sRoom,
            cb = mucVars[f];
        delete mucVars[f];
        if (typeof cb != "function") return;
        switch (iType) {
            case apf.xmpp_muc.ROOM_CREATE:
            case apf.xmpp_muc.ROOM_EXISTS:
                cb(true);
                break;
            case apf.xmpp_muc.ROOM_NOTFOUND:
                cb(false);
                break;
        }
    };

    this.joinRoom = function(sRoom, sPassword, sNick) {
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
            "<x xmlns='" + apf.xmpp.NS.muc + (sPassword
                ? "'><password>" + sPassword + "</x>"
                : "'/>"))
        );
    };

    this.leaveRoom = function(sRoom, sMsg, sNick) {
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNick)
            sNick = this.$serverVars["username"];
        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sRoom + "/" + sNick,
                type  : apf.xmpp.TYPE_UNAVAILABLE
            }, sMsg ? "<status>" + sMsg + "</status>" : "")
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

    this.changeNick = function(sRoom, sNewNick) {
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNewNick)
            sNewNick = this.username;
        var parts = sRoom.split("@");
        this.$mucRoster.registerAccount(parts[0], parts[1], sNewNick);
        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sRoom + "/" + sNewNick
            })
        );
    };

    this.invite = function(sRoom, sJID, sReason) {
        var oUser = this.$serverVars["roster"].getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(createMessageBlock({
                from : _self.$serverVars[JID],
                to   : sRoom
            },
            "<x xmlns='" + apf.xmpp.NS.muc_user + "'><invite to='"
            + oUser.bareJID + (sReason
                ? "'><reason>" + sReason + "</reason></invite>"
                : "'/>") + "</x>")
        );
    };

    this.declineInvite = function(sRoom, sJID, sReason) {
        var oUser = this.$serverVars["roster"].getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(createMessageBlock({
                from : _self.$serverVars[JID],
                to   : sRoom
            },
            "<x xmlns='" + apf.xmpp.NS.muc_user + "'><decline to='"
            + oUser.bareJID + (sReason
                ? "'><reason>" + sReason + "</reason></invite>"
                : "'/>") + "</x>")
        );
    };

    this.moderate = function(action, options) {
        // @todo
    };

    this.createRoom = function(sRoom, sNick, callback) {
        // @todo implement/ support Reserved Rooms
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNick)
            sNick = this.$serverVars["username"];
        sRoom = this.$mucRoster.sanitizeJID(sRoom);
        var parts = sRoom.split("@"),
            f     = "room_cb_" + sRoom;
        this.$mucRoster.registerAccount(parts[0], parts[1], sNick);

        mucVars[f] = function(bSuccess) {
            // @todo notify user
            delete mucVars[f];
            if (!bSuccess)
                return (typeof callback == "function" ? callback(bSuccess) : false);
            mucVars[f] = function(bSuccess) {
                delete mucVars[f];
                _self.$addRoom(sRoom, sRoom.substr(0, sRoom.indexOf("@")));
                if (callback)
                    callback(bSuccess);
            };
            doRequest(_self.$createIqBlock({
                    from  : _self.$serverVars[JID],
                    to    : sRoom,
                    type  : "set",
                    id    : _self.$makeUnique("create")
                },
                "<query xmlns='" + apf.xmpp.NS.muc_owner + "'><x xmlns='"
                + apf.xmpp.NS.data + "' type='submit'/></query>")
            );
        };

        doRequest(this.$createPresenceBlock({
                from  : this.$serverVars[JID],
                to    : sRoom + "/" + sNick
            },
            "<x xmlns='" + apf.xmpp.NS.muc + "'/>")
        );
    };

    this.joinOrCreateRoom = function(sRoom, sNick) {
        if (!sRoom || !this.$canMuc || !this.$serverVars[CONN]) return;
        if (!sNick)
            sNick = this.$serverVars["username"];
        var parts = sRoom.split("@");
        this.$mucRoster.registerAccount(parts[0], parts[1], sNick);
        sRoom = this.$mucRoster.sanitizeJID(sRoom);
        this.getRoom(sRoom, function(bSuccess) {
            if (bSuccess) //@todo should we provide a password input prompt?
                return _self.joinRoom(sRoom, null, sNick);
            _self.createRoom(sRoom, sNick, function(bSuccess2) {
                if (bSuccess2)
                    _self.joinRoom(sRoom, null, sNick);
            });
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
            "<query xmlns='" + apf.xmpp.NS.muc_owner + "'><destroy jid='"
            + sRoom + (sReason 
                ? "'><reason>" + sReason + "</reason></destroy>"
                : "'/>")
            + "</query>")
        );
    };

    // @todo: implement room registration as per JEP-77
    // @todo: implement all moderator features
    // @todo: implement all admin & owner features
};

apf.xmpp_muc.ROOM_CREATE    = 1;
apf.xmpp_muc.ROOM_EXISTS    = 2;
apf.xmpp_muc.ROOM_NOTFOUND  = 3;
apf.xmpp_muc.ROOM_JOINED    = 4;
apf.xmpp_muc.ROOM_LEFT      = 5;

apf.xmpp_muc.ACTION_SUBJECT = 0x0001;
apf.xmpp_muc.ACTION_KICK    = 0x0002;
apf.xmpp_muc.ACTION_BAN     = 0x0004;
apf.xmpp_muc.ACTION_GRANT   = 0x0008;
apf.xmpp_muc.ACTION_REVOKE  = 0x0010;

// #endif
