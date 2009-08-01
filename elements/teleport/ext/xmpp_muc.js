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
 * Element implementing a Multi User Chat service for the apf.xmpp object.
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
apf.xmpp_muc = function(oXmpp){
    var oRooms = {},
        _self  = this;

    this.queryRooms = function(sServer) {
        
    };

    this.queryRoomInfo = function(sRoom) {
        
    };

    this.getRoom = function() {

    };

    this.joinRoom = function(sNick, sPassword) {

    };

    this.leaveRoom = function(sMsg) {

    };

    this.changeNick = function() {

    };

    this.invite = function(sReason) {

    };

    this.declineInvite = function(sReason) {

    };

    this.moderate = function(action, options) {

    };

    this.createRoom = function() {

    };

    this.destroyRoom = function() {

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
