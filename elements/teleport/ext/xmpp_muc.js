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
// #define __WITH_TELEPORT 1

/**
 * Interface implementing a Multi User Chat service for the apf.xmpp object.
 * The Multi User Chat class is a class that contains all the functions needed
 * to start, end, join, leave any XMPP/ Jabber chat room, and more.
 * @link http://xmpp.org/extensions/xep-0045.html
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @classDescription This class intantiates a new XMPP MUC object
 * @return {apf.xmpp.Roster} A new XMPP MUC object
 * @type {Object}
 * @constructor
 */
apf.xmpp_muc = function(){
    var _self   = this,
        mucVars = {};
    this.$mucRoster = new apf.xmpp_roster(this.oMucModel, {muc: true}, this.resource);

    /**
     * Simple helper function to store session variables in the private space.
     *
     * @param {String} name
     * @param {mixed}  value
     * @type  {mixed}
     * @private
     */
    function register(name, value) {
        mucVars[name] = value;

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
            if (typeof mucVars[arg] != "undefined") {
                mucVars[arg] = null;
                delete mucVars[arg];
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
        return mucVars[name] || "";
    }

    function doRequest(sBody) {
        if (!sBody) return;
        _self.$doXmlRequest(_self.$restartListener, _self.$isPoll
            ? _self.$createStreamElement(null, null, sBody)
            : _self.$createBodyElement({
                rid   : _self.$getRID(),
                sid   : _self.$getVar("SID"),
                xmlns : apf.xmpp.NS.httpbind
            }, sBody)
        );
    }

    this.$getStatusCode = function(oXml, iStatus) {
        var aStatuses = oXml.getElementsByTagName("status");
        for (var i = 0, l = aStatuses.length; i < l; i++) {
            if (aStatuses[i]
              && parseInt(aStatuses[i].getAttribute("code")) == iStatus)
                return iStatus;
        }
        return false;
    }

    this.queryRooms = function() {
        if (!this.canMuc || !this.$getVar("connected")) return;
        doRequest(this.$createIqBlock({
                from  : this.$getVar("JID"),
                to    : this.mucDomain,
                type  : "get",
                id    : this.$makeUnique("disco")
            }, "<query xmlns='" + apf.xmpp.NS.disco_items + "'/>")
        );
    };

    this.$addRoom = function(sJID, sName) {
        return this.$mucRoster.getEntityByJID(sJID.replace(/\/.*$/, ""), sName);
    };

    this.$isRoom = function(sJID) {
        var parts = sJID.replace(/\/.*$/, "").split("@");
        return this.$mucRoster.getEntity(parts[0], parts[1], null, true) ? true : false;
    }

    this.$addRoomOccupant = function(sJID) {
        return this.$mucRoster.getEntityByJID(sJID);
    }

    this.queryRoomInfo = function(sRoom) {
        // @todo Room info querying
    };

    this.getRoom = function(sRoom, callback) {
        if (!this.canMuc || !this.$getVar("connected")) return;
        register("room_cb_" + sRoom, callback);
        doRequest(this.$createIqBlock({
                from  : this.$getVar("JID"),
                to    : sRoom,
                type  : "get",
                id    : this.$makeUnique("disco")
            }, "<query xmlns='" + apf.xmpp.NS.disco_items + "'/>")
        );
    };

    this.$mucSignal = function(iType, sRoom) {
        sRoom  = sRoom.replace(/\/.*$/, "");
        var f  = "room_cb_" + sRoom,
            cb = getVar(f);
        unregister(f);
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
    }

    this.joinRoom = function(sRoom, sPassword, sNick) {
        // @todo check for reserved nickname as described in
        //       http://xmpp.org/extensions/xep-0045.html#reservednick
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        if (!sNick)
            sNick = this.$getVar("username");
        var parts = sRoom.split("@");
        this.$mucRoster.registerAccount(parts[0], parts[1], sNick);
        doRequest(this.$createPresenceBlock({
                from  : this.$getVar("JID"),
                to    : sRoom + "/" + sNick
            },
            "<x xmlns='" + apf.xmpp.NS.muc + (sPassword
                ? "'><password>" + sPassword + "</x>"
                : "'/>"))
        );
    };

    this.leaveRoom = function(sRoom, sMsg, sNick) {
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        if (!sNick)
            sNick = this.$getVar("username");
        doRequest(this.$createPresenceBlock({
                from  : this.$getVar("JID"),
                to    : sRoom + "/" + sNick,
                type  : apf.xmpp.TYPE_UNAVAILABLE
            }, sMsg ? "<status>" + sMsg + "</status>" : "")
        );
    };

    this.leaveAllRooms = function(sMsg, sNick) {
        if (!this.canMuc || !this.$getVar("connected")) return;
        if (!sNick)
            sNick = this.$getVar("username");
        var i, l, aRooms = this.$mucRoster.getRooms();
        for (i = 0, l = aRooms.length; i < l; i++)
            this.leaveRoom(aRooms[i].node, sMsg, sNick);
    };

    this.changeNick = function(sRoom, sNewNick) {
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        if (!sNewNick)
            sNewNick = this.username;
        var parts = sRoom.split("@");
        this.$mucRoster.registerAccount(parts[0], parts[1], sNewNick);
        doRequest(this.$createPresenceBlock({
                from  : this.$getVar("JID"),
                to    : sRoom + "/" + sNewNick
            })
        );
    };

    this.invite = function(sRoom, sJID, sReason) {
        var oUser = this.$getVar("roster").getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(createMessageBlock({
                from : _self.$getVar("JID"),
                to   : sRoom
            },
            "<x xmlns='" + apf.xmpp.NS.muc_user + "'><invite to='"
            + oUser.bareJID + (sReason
                ? "'><reason>" + sReason + "</reason></invite>"
                : "'/>") + "</x>")
        );
    };

    this.declineInvite = function(sRoom, sJID, sReason) {
        var oUser = this.$getVar("roster").getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(createMessageBlock({
                from : _self.$getVar("JID"),
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
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        if (!sNick)
            sNick = this.$getVar("username");
        sRoom = this.$mucRoster.sanitizeJID(sRoom);
        var parts = sRoom.split("@"),
            f     = "room_cb_" + sRoom;
        this.$mucRoster.registerAccount(parts[0], parts[1], sNick);

        register(f, function(bSuccess) {
            // @todo notify user
            unregister(f);
            if (!bSuccess)
                return (typeof callback == "function" ? callback(bSuccess) : false);
            register(f, function(bSuccess) {
                unregister(f);
                _self.$addRoom(sRoom, sRoom.substr(0, sRoom.indexOf("@")));
                if (callback)
                    callback(bSuccess);
            });
            doRequest(_self.$createIqBlock({
                    from  : _self.$getVar("JID"),
                    to    : sRoom,
                    type  : "set",
                    id    : _self.$makeUnique("create")
                },
                "<query xmlns='" + apf.xmpp.NS.muc_owner + "'><x xmlns='"
                + apf.xmpp.NS.data + "' type='submit'/></query>")
            );
        });

        doRequest(this.$createPresenceBlock({
                from  : this.$getVar("JID"),
                to    : sRoom + "/" + sNick
            },
            "<x xmlns='" + apf.xmpp.NS.muc + "'/>")
        );
    };

    this.joinOrCreateRoom = function(sRoom, sNick) {
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        if (!sNick)
            sNick = this.$getVar("username");
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
    }

    this.destroyRoom = function(sRoom, sReason) {
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        doRequest(this.$createIqBlock({
                from  : this.$getVar("JID"),
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
