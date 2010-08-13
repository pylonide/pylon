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

// #ifdef __TP_XMPP_ROSTER

/**
 * Element implementing a Roster service for the apf.xmpp object.
 * The Roster is a centralised registry for Jabber ID's (JID) to which
 * the user subscribed. Whenever the presence info of a JID changes, the roster
 * will get updated accordingly.
 * @todo implement removal of entities
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       3.0
 * @classDescription This class intantiates a new XMPP Roster object
 * @return {apf.xmpp.Roster} A new XMPP Roster object
 * @type {Object}
 * @constructor
 */
apf.xmpp_roster = function(model, modelContent, res) {
    this.resource = res;
    this.username = this.host = this.fullJID = "";

    var bMuc      = (modelContent.muc || modelContent.rdb),
        aEntities = [],
        aRooms    = [],
        userProps = {"node": 1, "host": 1, "resource": 1, "bareJID": 1,
                     "fullJID": 1, "status": 1, "affiliation": 1, "role": 1,
                     "nick": 1};

    if (typeof model == "string") {
        //#ifdef __WITH_NAMESERVER
        var sModel = model;
        if (!(model = apf.nameserver.get(sModel))) {
            model = apf.setReference(sModel,
                apf.nameserver.register("model", sModel, new apf.model()));
            if (model === 0)
                model = self[sModel];
            else
                model.id = model.name = sModel;
        }
        //#endif
        // set the root node for this model
        model.load("<xmpp/>");
    }

    this.registerAccount = function(username, host, resource) {
        if (!resource)
            resource = this.resource;
        else
            this.resource = resource;
        this.username = username || "";
        this.host     = host   || "";
        this.bareJID  = this.username + "@" + this.host;
        this.fullJID  = this.username + "@" + this.host
            + (resource ? "/" + resource : "");
    };

    /**
     * Lookup function; searches for a JID with node object, host and/ or
     * resource info provided.
     * It may return an collection of JID's when little info to search with is
     * provided.
     *
     * @param {String}  node
     * @param {String}  [host]
     * @param {String}  [resource]
     * @param {Boolean} [bRoom]
     * @type  {mixed}
     */
    this.getEntity = function(node, host, resource, bRoom) {
        if (typeof node == "undefined") return null;

        var aResult = [];

        // the code below is just a failsafe for user items that arrive through
        // an <IQ> query for a roster.
        if (node.indexOf("@") != -1) {
            var aTemp = node.split("@");
            node      = aTemp[0];
            host      = aTemp[1];
        }
        host = host || this.host;

        var n, i, l, oExact,
            bResource = (resource && !bRoom),
            fullJID   = node + "@" + host + (resource ? "/" + resource : "");

        for (i = 0, l = aEntities.length; i < l; i++) {
            n = aEntities[i]
            if (n && n.node == node && n.host == host
              && (!bResource || n.resource == resource)
              && (!bRoom || n.isRoom)) {
                aResult.push(n);
                if (n.fullJID == fullJID)
                    oExact = n;
            }
        }

        if (aResult.length === 0)
            return null;

        if (aResult.length > 1 && oExact)
            return oExact;

        return (aResult.length == 1) ? aResult[0] : aResult;
    };

    /**
     * Lookup function; searches for a JID object with JID info provided in the
     * following, common, XMPP format: 'node@host/resource'
     *
     * @param {String}  jid
     * @param {String}  [sSubscr]
     * @param {String}  [sGroup]
     * @param {Boolean} [bRoom]
     * @type  {Object}
     */
    this.getEntityByJID = function(jid, options) {
        var resource = null, node;
        if (!options)
            options = {};

        if (jid.indexOf("/") != -1) {
            resource = jid.substring(jid.indexOf("/") + 1) || "";
            jid      = jid.substring(0, jid.indexOf("/"));
        }
        if (jid.indexOf("@") != -1) {
            node = jid.substring(0, jid.indexOf("@"));
            jid  = jid.substring(jid.indexOf("@") + 1);
        }

        var host    = jid,
            oEnt    = this.getEntity(node, host, resource),
            bareJID = node + "@" + host;
        if (!resource) {
            apf.console.warn("No resource provided for Jabber entity '" + bareJID
                + "'. Roster may get corrupted this way!", "xmpp");
        }
        else if (oEnt) {
            //adding of an additional 'resource'...except for chat rooms
            if (!apf.isArray(oEnt))
                oEnt = [oEnt];
            for (var i = 0, l = oEnt.length; i < l; ++i) {
                if (!oEnt[i] || oEnt[i].resource) continue;
                oEnt = oEnt[i];
                oEnt.resource = resource;
                oEnt.fullJID  = bareJID + "/" + resource;
                break;
            }
        }

        if (apf.isArray(oEnt))
            oEnt = oEnt[0];

        // Auto-add new users with status TYPE_UNAVAILABLE
        // Status TYPE_AVAILABLE only arrives with <presence> messages
        if (!oEnt) {// && node && host) {
            var bIsRoom = (bMuc && !resource);
            oEnt = this.update({
                node        : node,
                host        : host,
                resource    : resource || null,
                bareJID     : bareJID,
                fullJID     : bareJID + (resource ? "/" + resource : ""),
                isRoom      : bIsRoom,
                isRDB       : options.isRDB ? true : false,
                room        : (bMuc && resource) ? bareJID : null,
                nick        : (bMuc && resource) ? resource : null,
                roomJID     : options.roomJID,
                subscription: options.subscription || "",
                affiliation : options.affiliation || null,
                role        : options.role || null,
                group       : options.group || "",
                status      : (bIsRoom || (bMuc && resource))
                    ? apf.xmpp.TYPE_AVAILABLE
                    : apf.xmpp.TYPE_UNAVAILABLE
            });
        }
        else {
            this.update(apf.extend(oEnt, options));
        }

        return oEnt;
    };

    /**
     * When a JID is added, deleted or updated, it will pass this function that
     * marshalls the Roster contents.
     * It ensures that the Remote Databindings link with a model is synchronized
     * at all times.
     *
     * @param {Object} oEnt
     * @param {Number} status
     * @type  {Object}
     */
    this.update = function(oEnt, status) {
        if (bMuc && oEnt.room && oEnt.role == "none") {
            // a contact is leaving the chatroom
            if (oEnt.xml) {
                apf.xmldb.removeNode(oEnt.xml);
                aEntities.remove(oEnt);
            }
            return oEnt;
        }

        if (!oEnt.xml) {
            var bIsAccount = (oEnt.node == this.username
                              && oEnt.host == this.host
                              && (!bMuc || oEnt.resource == this.resource));
            aEntities.push(oEnt);
            if (oEnt.isRoom)
                aRooms.push(oEnt);
            // Update the model with the new User
            if (model && (modelContent.roster || bMuc)) {
                oEnt.xml = model.data.ownerDocument.createElement(bIsAccount
                    ? "account"
                    : oEnt.isRoom ? "room" : "user");
                this.updateEntityXml(oEnt);
                var oRoom,
                    room = oEnt.roomJID ? oEnt.roomJID.split("@") : null,
                    node = (oEnt.room && !oEnt.isRoom && oEnt.isRDB) ? room[0] : oEnt.node,
                    host = (oEnt.room && !oEnt.isRoom && oEnt.isRDB) ? room[1] : oEnt.host;
                apf.xmldb.appendChild((oEnt.room && !oEnt.isRoom)
                    ? (oRoom = this.getEntity(node, host, null, true)) ? oRoom.xml : model.data
                    : model.data, oEnt.xml);
            }
        }

        if (typeof status != "undefined")
            oEnt.status = status;

        return this.updateEntityXml(oEnt);
    };

    /**
     * Propagate any change in the JID to the model to which the XMPP connection
     * is attached.
     *
     * @param {Object} oEnt
     * @type  {Object}
     */
    this.updateEntityXml = function(oEnt) {
        if (!oEnt || !oEnt.xml) return null;
        for (var i in userProps) {
            if (typeof oEnt[i] != "undefined" && oEnt[i] !== null)
                oEnt.xml.setAttribute(i, oEnt[i]);
        }

        apf.xmldb.applyChanges("synchronize", oEnt.xml);

        return oEnt;
    };

    /**
     * Append incoming chat messages to the user XML element, so they are
     * accessible to the model.
     *
     * @param {String} sJID The Jabber Identifier of the sender
     * @param {String} sMsg The actual message
     * @type  {void}
     */
    this.updateMessageHistory = function(sJID, sMsg, sThread) {
        // #ifdef __WITH_RDB
        if (sThread == "rdb") return true;
        // #endif
        if (!model || !(modelContent.chat || bMuc)) return false;

        var oEnt, oRoom;
        if (bMuc)
            oRoom = this.getEntityByJID(sJID.replace(/\/.*$/, ""));
        oEnt = this.getEntityByJID(sJID);
        if (!oEnt || !oEnt.xml) return false;

        var oDoc = model.data.ownerDocument,
            oMsg = oDoc.createElement("message");
        oMsg.setAttribute("from", sJID);
        oMsg.appendChild(oDoc.createTextNode(sMsg));

        apf.xmldb.appendChild((oRoom ? oRoom.xml : oEnt.xml), oMsg);
        apf.xmldb.applyChanges("synchronize", oEnt.xml);

        // only send events to messages from contacts, not the acount itself
        return !(oEnt.node == this.username && oEnt.host == this.host);
    };

    /**
     * API; return the last JID that is available for messaging through XMPP.
     *
     * @type {Object}
     */
    this.getLastAvailableEntity = function() {
        for (var i = aEntities.length - 1; i >= 0; i--) {
            if (aEntities[i].status !== apf.xmpp.TYPE_UNAVAILABLE)
                return aEntities[i];
        }

        return null;
    };

    /**
     * Get the full list (Array) of rooms that are currently active/ used/ 
     * available.
     * 
     * @type {Array}
     */
    this.getRooms = function() {
        return aRooms;
    };

    this.getRoomParticipants = function(sRoom) {
        var o,
            res = [],
            i   = 0,
            l   = aEntities.length;
        for (; i < l; i++) {
            if ((o = aEntities[i]).room == sRoom)
                res.push(o);
        }
        return res;
    };

    this.getRoomOwner = function(sRoom) {
        var o,
            i = 0,
            l = aEntities.length;
        for (; i < l; i++) {
            if ((o = aEntities[i]).room == sRoom && o.affiliation == "owner")
                return o;
        }
        return null;
    };

    /**
     * Get the full list (Array) of entities (users/ contacts).
     * 
     * @param {Number}  [iStatus]  Optional. Required status of the returned entities
     * @param {Boolean} [bIncSelf] Optional. Whether to include the user himself
     * @type  {Array}
     */
    this.getAllEntities = function(iStatus, bIncSelf) {
        if (typeof iStatus != "string")
            return aEntities;

        var o = [],
            i = 0,
            l = aEntities.length;
        for (; i < l; i++) {
            if (!bIncSelf && aEntities[i].bareJID == this.bareJID) continue;
            if (aEntities[i].status == iStatus)
                o.push(aEntities[i]);
        }

        return o;
    };

    this.rebuild = function(mc) {
        if (mc) {
            modelContent = mc;
            bMuc         = (modelContent.muc || modelContent.rdb);
        }
        if (!model || !(modelContent.roster || bMuc))
            return;
        model.load("<xmpp/>");
        var i = 0,
            l = aEntities.length;
        for (; i < l; i++) {
            delete aEntities[i].xml;
            this.updateEntityXml(aEntities[i]);
        }
    };

    /**
     * Reset this roster instance to its original values.
     *
     * @type {void}
     */
    this.reset = function() {
        if (model)
            model.reset();
        aEntities = [];
        aRooms    = [];
        this.username = this.host = this.fullJID = "";
    };

    /**
     * Clean a JID (Jabber ID) of unwanted cruft.
     * 
     * @param {String} sJID Jabber ID to process.
     * @type  {String}
     */
    this.sanitizeJID = function(sJID) {
        return sJID.replace(/[\"\s\&\\\:<>]+/g, "").replace(/\//g, "_").toLowerCase();
    };
};

// #endif
