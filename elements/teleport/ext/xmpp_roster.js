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
// #define __WITH_TELEPORT 1

/**
 * Element implementing a Roster service for the apf.xmpp object.
 * The Roster is a centralised registry for Jabber ID's (JID) to which
 * the user subscribed. Whenever the presence info of a JID changes, the roster
 * will get updated accordingly.
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 * @classDescription This class intantiates a new XMPP Roster object
 * @return {apf.xmpp.Roster} A new XMPP Roster object
 * @type {Object}
 * @constructor
 */
apf.xmpp_roster = function(model, modelContent, resource) {
    this.resource = resource;
    this.username = this.domain = this.fullJID = "";

    var aEntities = [];

    this.registerAccount = function(username, domain) {
        this.username = username || "";
        this.domain   = domain   || "";
        this.fullJID  = this.username + "@" + this.domain
            + (this.resource ? "/" + this.resource : "");
    };

    /**
     * Lookup function; searches for a JID with node object, domain and/ or
     * resource info provided.
     * It may return an collection of JID's when little info to search with is
     * provided.
     *
     * @param {String} node
     * @param {String} domain
     * @param {String} resource
     * @type  {mixed}
     */
    this.getEntity = function(node, domain, resource, bRoom) {
        if (typeof node == "undefined") return null;

        var aResult = [];

        // the code below is just a failsafe for user items that arrive through
        // an <IQ> query for a roster.
        if (node.indexOf("@") != -1) {
            var aTemp = node.split("@");
            node      = aTemp[0];
            domain    = aTemp[1];
        }

        var n, i, bResource = (typeof resource != "undefined");

        for (i = 0; i < aEntities.length; i++) {
            n = aEntities[i]
            if (n && n.node == node && n.domain == domain
              && (!bResource || n.resource == resource)
              && (!bRoom || n.isRoom))
                aResult.push(n);
        }

        if (aResult.length === 0) return null;

        return (aResult.length == 1) ? aResult[0] : aResult;
    };

    /**
     * Lookup function; searches for a JID object with JID info provided in the
     * following, common, XMPP format: 'node@domain/resource'
     *
     * @param {String}  jid
     * @param {String}  [sSubscr]
     * @param {String}  [sGroup]
     * @param {Boolean} [bRoom]
     * @type  {Object}
     */
    this.getEntityByJID = function(jid, sSubscr, sGroup) {
        var resource = null, node;
        sSubscr = sSubscr || "";
        sGroup  = sGroup  || "";

        if (jid.indexOf("/") != -1) {
            resource = jid.substring(jid.indexOf("/") + 1) || "";
            jid      = jid.substring(0, jid.indexOf("/"));
        }
        if (jid.indexOf("@") != -1) {
            node = jid.substring(0, jid.indexOf("@"));
            jid  = jid.substring(jid.indexOf("@") + 1);
        }

        var domain  = jid,
            oEnt    = this.getEntity(node, domain,
                        modelContent.muc ? resource : null),
            bareJID = node + "@" + domain;

        // Auto-add new users with status TYPE_UNAVAILABLE
        // Status TYPE_AVAILABLE only arrives with <presence> messages
        if (!oEnt && node && domain) {
            var bIsRoom = (modelContent.muc && !resource);
            oEnt = this.update({
                node        : node,
                domain      : domain,
                resources   : resource ? [resource] : [],
                bareJID     : bareJID,
                fullJID     : bareJID + (resource ? "/" + resource : ""),
                isRoom      : bIsRoom,
                room        : (modelContent.muc && resource),
                subscription: sSubscr,
                affiliation : null,
                role        : null,
                group       : sGroup,
                status      : (bIsRoom) 
                    ? apf.xmpp.TYPE_AVAILABLE
                    : apf.xmpp.TYPE_UNAVAILABLE
            });
        }
        else if (oEnt && oEnt.group !== sGroup)
            oEnt.group = sGroup;
        else if (oEnt && oEnt.subscription !== sSubscr)
            oEnt.subscription = sSubscr;

        //adding of an additional 'resource'...except for chat rooms
        if (resource && oEnt && !oEnt.isRoom && !oEnt.resources.contains(resource)) {
            oEnt.resources.push(resource);
            oEnt.fullJID = bareJID + "/" + resource;
        }

        return oEnt;
    };

    /**
     * When a JID is added, deleted or updated, it will pass this function that
     * marshalls the Roster contents.
     * It ensures that the Remote SmartBindings link with a model is synchronized
     * at all times.
     *
     * @param {Object} oEnt
     * @param {Number} status
     * @type  {Object}
     */
    this.update = function(oEnt, status) {
        if (!oEnt.xml) {
            var bIsAccount = (oEnt.node == this.username
                              && oEnt.domain == this.domain);
            aEntities.push(oEnt);
            // Update the model with the new User
            if (model && (modelContent.roster || modelContent.muc)) {
                oEnt.xml = model.data.ownerDocument.createElement(bIsAccount
                    ? "account"
                    : oEnt.isRoom ? "room" : "user");
                this.updateEntityXml(oEnt);
                apf.xmldb.appendChild((oEnt.room && !oEnt.isRoom)
                    ? this.getEntity(oEnt.node, oEnt.domain, null, true).xml
                    : model.data, oEnt.xml);
            }
        }

        if (typeof status != "undefined")
            oEnt.status = status;

        return this.updateEntityXml(oEnt);
    };

    var userProps = {"node": 1, "domain": 1, "resource": 1, "bareJID": 1, "fullJID": 1, "status": 1};
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
            if (typeof oEnt[i] != "undefined")
                oEnt.xml.setAttribute(i, oEnt[i]);
        }
        if (modelContent.muc) {
            oEnt.xml.setAttribute("name", oEnt.isRoom 
                ? oEnt.subscription
                : oEnt.resources[oEnt.resources.length - 1]);
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
    this.updateMessageHistory = function(sJID, sMsg) {
        if (!model || !(modelContent.chat || modelContent.muc)) return false;

        var oEnt = this.getEntityByJID(sJID);
        if (!oEnt || !oEnt.xml) return false;

        var oDoc = model.data.ownerDocument,
            oMsg = oDoc.createElement("message");
        oMsg.setAttribute("from", sJID);
        oMsg.appendChild(oDoc.createTextNode(sMsg));

        apf.xmldb.appendChild(oEnt.xml, oMsg);
        apf.xmldb.applyChanges("synchronize", oEnt.xml);

        // only send events to messages from contacts, not the acount itself
        return !(oEnt.node == this.username && oEnt.domain == this.domain);
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

    this.getAllUsers = function() {
        return aEntities;
    };
};

// #endif