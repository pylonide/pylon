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
    var _self   = this;
    this.$mucRoster = new apf.xmpp_roster(this.oMucModel, {muc: true}, this.resource);

    function doRequest(cb, sBody) {
        if (!cb || !sBody) return;
        _self.$doXmlRequest(cb, _self.$isPoll
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
        /*
         <iq from='hag66@shakespeare.lit/pda'
             id='disco2'
             to='chat.shakespeare.lit'
             type='get'>
           <query xmlns='http://jabber.org/protocol/disco#items'/>
         </iq>
        */
        if (!this.canMuc || !this.$getVar("connected")) return;
        doRequest(function(oXml) {
                _self.$parseData(oXml);
                _self.$listen();
            }, this.$createIqBlock({
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
        // todo
    };

    this.getRoom = function(sRoom, callback) {
        /*
         <iq from='hag66@shakespeare.lit/pda'
            id='disco4'
            to='darkcave@chat.shakespeare.lit'
            type='get'>
          <query xmlns='http://jabber.org/protocol/disco#items'/>
        </iq>
        */
        if (!this.canMuc || !this.$getVar("connected")) return;
        doRequest(function(oXml, state) {
                if (state == apf.SUCCESS) {
                    var aErrors = oXml.getElementsByTagName("error");
                    var bFail = aErrors.length ? true : false;
                    if (!bFail)
                        _self.$parseData(oXml);
                    if (callback)
                        callback(!bFail, bFail ? aErrors[0] : null);
                }
                _self.$listen();
            }, this.$createIqBlock({
                from  : this.$getVar("JID"),
                to    : sRoom,
                type  : "get",
                id    : this.$makeUnique("disco")
            }, "<query xmlns='" + apf.xmpp.NS.disco_items + "'/>")
        );
    };

    this.joinRoom = function(sRoom, sPassword, sNick) {
        /*
         <presence
            from='hag66@shakespeare.lit/pda'
            to='darkcave@chat.shakespeare.lit/thirdwitch'/>
        */
        // @todo check for reserved nickname as described in
        //       http://xmpp.org/extensions/xep-0045.html#reservednick
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        if (!sNick)
            sNick = this.$getVar("username");
        var parts = sRoom.split("@");
        this.$mucRoster.registerAccount(parts[0], parts[1], sNick);
        doRequest(function(oXml, state) {
                _self.$parseData(oXml);
                _self.$listen();
            }, this.$createPresenceBlock({
                from  : this.$getVar("JID"),
                to    : sRoom + "/" + sNick
            },
            "<x xmlns='" + apf.xmpp.NS.muc + (sPassword
                ? "'><password>" + sPassword + "</x>"
                : "'/>"))
        );
    };

    this.leaveRoom = function(sRoom, sMsg, sNick) {
        /*
         <presence
            from='hag66@shakespeare.lit/pda'
            to='darkcave@chat.shakespeare.lit/thirdwitch'
            type='unavailable'/>
        */
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        if (!sNick)
            sNick = this.$getVar("username");
        doRequest(function(oXml) {
                _self.$parseData(oXml);
                _self.$listen();
            }, this.$createPresenceBlock({
                from  : this.$getVar("JID"),
                to    : sRoom + "/" + sNick
            }, sMsg ? "<status>" + sMsg + "</status>" : "")
        );
    };

    this.changeNick = function(sRoom, sNewNick) {
        /*
         <presence
            from='hag66@shakespeare.lit/pda'
            to='darkcave@chat.shakespeare.lit/thirdwitch'/>
        */
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        if (!sNewNick)
            sNewNick = this.username;
        var parts = sRoom.split("@");
        this.$mucRoster.registerAccount(parts[0], parts[1], sNewNick);
        doRequest(function(oXml, state) {
                _self.$parseData(oXml);
                _self.$listen();
            }, this.$createPresenceBlock({
                from  : this.$getVar("JID"),
                to    : sRoom + "/" + sNewNick
            })
        );
    };

    this.invite = function(sRoom, sJID, sReason) {
        /*
         <message
             from='crone1@shakespeare.lit/desktop'
             to='darkcave@chat.shakespeare.lit'>
           <x xmlns='http://jabber.org/protocol/muc#user'>
             <invite to='hecate@shakespeare.lit'>
               <reason>
                 Hey Hecate, this is the place for all good witches!
               </reason>
             </invite>
           </x>
         </message>
        */
        var oUser = this.$getVar("roster").getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(this.$restartListener, createMessageBlock({
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
        /*
         <message
             from='hecate@shakespeare.lit/broom'
             to='darkcave@chat.shakespeare.lit'>
           <x xmlns='http://jabber.org/protocol/muc#user'>
             <decline to='crone1@shakespeare.lit'>
               <reason>
                 Sorry, I'm too busy right now.
               </reason>
             </decline>
           </x>
         </message>
        */
        var oUser = this.$getVar("roster").getEntityByJID(sJID);
        if (!oUser) return;

        doRequest(this.$restartListener, createMessageBlock({
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

    };

    this.createRoom = function(sRoom, sNick) {
        /*
         <presence
             from='crone1@shakespeare.lit/desktop'
             to='darkcave@chat.shakespeare.lit/firstwitch'>
           <x xmlns='http://jabber.org/protocol/muc'/>
         </presence>

         Instant Room creation
         <iq from='crone1@shakespeare.lit/desktop'
             id='create1'
             to='darkcave@chat.shakespeare.lit'
             type='set'>
           <query xmlns='http://jabber.org/protocol/muc#owner'>
             <x xmlns='jabber:x:data' type='submit'/>
           </query>
         </iq>
        */
        // @todo implement/ support Reserved Rooms
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        if (!sNick)
            sNick = this.$getVar("username");
        doRequest(function(oXml, state, extra) {
                // @todo notify user
                if (state != apf.SUCCESS || !this.$getStatusCode(oXml, 201))
                    return _self.$listen();
                doRequest(function(oXml) {
                        _self.$parseData(oXml);
                        _self.$listen();
                    }, this.$createIqBlock({
                        from  : this.$getVar("JID"),
                        to    : sRoom,
                        type  : "set",
                        id    : this.$makeUnique("create")
                    },
                    "<query xmlns='" + apf.xmpp.NS.muc_owner + "'><x xmlns='"
                    + apf.xmpp.NS.data + "' type='submit'/></query>")
                );
            }, this.$createPresenceBlock({
                from  : this.$getVar("JID"),
                to    : sRoom + "/" + sNick
            },
            "<x xmlns='" + apf.xmpp.NS.muc + "'/>")
        );
    };

    this.destroyRoom = function(sRoom, sReason) {
        /*
         <iq from='crone1@shakespeare.lit/desktop'
             id='begone'
             to='heath@chat.shakespeare.lit'
             type='set'>
           <query xmlns='http://jabber.org/protocol/muc#owner'>
             <destroy jid='darkcave@chat.shakespeare.lit'>
               <reason>Macbeth doth come.</reason>
             </destroy>
           </query>
         </iq>
        */
        if (!sRoom || !this.canMuc || !this.$getVar("connected")) return;
        doRequest(this.$restartListener, this.$createIqBlock({
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

apf.xmpp_muc.ACTION_SUBJECT = 0x0001;
apf.xmpp_muc.ACTION_KICK    = 0x0002;
apf.xmpp_muc.ACTION_BAN     = 0x0004;
apf.xmpp_muc.ACTION_GRANT   = 0x0008;
apf.xmpp_muc.ACTION_REVOKE  = 0x0010;

// #endif
