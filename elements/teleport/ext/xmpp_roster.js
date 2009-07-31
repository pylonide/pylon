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

// #ifdef __TP_XMPP && __WITH_XMPP_ROSTER
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
apf.xmpp.Roster = function(model, modelContent, resource) {
    this.resource = resource;
    this.username = this.domain = this.jid = "";

    var aUsers = [];

    this.registerAccount = function(username, domain) {
        this.username = username || "";
        this.domain   = domain   || "";
        this.jid      = this.username + "@" + this.domain
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
    this.getUser = function(node, domain, resource) {
        if (typeof node == "undefined") return null;

        var aResult = [];

        // the code below is just a failsafe for user items that arrive through
        // an <IQ> query for a roster.
        if (node.indexOf("@") != -1) {
            var aTemp = node.split("@");
            node      = aTemp[0];
            domain    = aTemp[1];
        }

        var bDomain   = (typeof domain   != "undefined"),
            bResource = (typeof resource != "undefined"),

            sJID = node + (bDomain ? "@" + domain : "")
                    + (bResource ? "/" + resource : "");

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
     * @type  {Object}
     */
    this.getUserFromJID = function(jid) {
        var resource = "", node;
        if (arguments.length > 1) {
            var sSubscr = arguments[1] || "",
                sGroup  = arguments[2] || "";
        }


        if (jid.indexOf("/") != -1) {
            resource = jid.substring(jid.indexOf("/") + 1) || "";
            jid      = jid.substring(0, jid.indexOf("/"));
        }
        if (jid.indexOf("@") != -1) {
            node = jid.substring(0, jid.indexOf("@"));
            jid  = jid.substring(jid.indexOf("@") + 1);
        }

        var domain = jid,
            oUser  = this.getUser(node, domain);//, resource);

        // Auto-add new users with status TYPE_UNAVAILABLE
        // Status TYPE_AVAILABLE only arrives with <presence> messages
        if (!oUser && node && domain) {
            // @todo: change the user-roster structure to be more 'resource-agnostic'
            //resource = resource || this.resource;
            oUser = this.update({
                node        : node,
                domain      : domain,
                resources   : [resource],
                jid         : node + "@" + domain
                              + (resource ? "/" + resource : ""),
                subscription: sSubscr,
                group       : sGroup,
                status      : apf.xmpp.TYPE_UNAVAILABLE
            });

        }
        else if (oUser && oUser.group !== sGroup)
            oUser.group = sGroup;
        else if (oUser && oUser.subscription !== sSubscr)
            oUser.subscription = sSubscr;

        //fix a missing 'resource' property...
        if (resource && oUser && !oUser.resources.contains(resource)) {
            oUser.resources.push(resource);
            oUser.jid = node + "@" + domain + "/" + resource
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
     * @type  {Object}
     */
    this.update = function(oUser) {
        if (!this.getUser(oUser.node, oUser.domain, oUser.resource)) {
            var bIsAccount = (oUser.node == this.username
                              && oUser.domain == this.domain);
            aUsers.push(oUser);
            //Remote SmartBindings: update the model with the new User
            if (model && modelContent.roster) {
                oUser.xml = model.data.ownerDocument.createElement(bIsAccount
                    ? "account"
                    : "user");
                this.updateUserXml(oUser);
                apf.xmldb.appendChild(model.data, oUser.xml);
            }
        }

        if (arguments.length > 1)
            oUser.status = arguments[1];

        // update all known properties for now (bit verbose, might be changed
        // in the future)
        return this.updateUserXml(oUser);
    };

    var userProps = ["node", "domain", "resource", "jid", "status"];
    /**
     * Propagate any change in the JID to the model to which the XMPP connection
     * is attached.
     *
     * @param {Object} oUser
     * @type  {Object}
     */
    this.updateUserXml = function(oUser) {
        if (!oUser || !oUser.xml) return null;
        userProps.forEach(function(item) {
            oUser.xml.setAttribute(item, oUser[item]);
        });
        apf.xmldb.applyChanges("synchronize", oUser.xml);

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

        var oDoc = model.data.ownerDocument,
            oMsg = oDoc.createElement("message");
        oMsg.setAttribute("from", sJID);
        oMsg.appendChild(oDoc.createTextNode(sMsg));

        apf.xmldb.appendChild(oUser.xml, oMsg);
        apf.xmldb.applyChanges("synchronize", oUser.xml);

        // only send events to messages from contacts, not the acount itself
        return !(oUser.node == this.username && oUser.domain == this.domain);
    };

    /**
     * Transform a JID object into a Stringified represention of XML.
     *
     * @param {Object} oUser
     * @type  {String}
     */
    this.userToXml = function(oUser) {
        var aOut = ["<user "];

        userProps.forEach(function(item) {
            aOut.push(item, '="', oUser[item], '" ');
        });

        return aOut.join("") + "/>";
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
            if (aUsers[i].status !== apf.xmpp.TYPE_UNAVAILABLE)
                return aUsers[i];
        }

        return null;
    };

    this.getAllUsers = function() {
        return aUsers;
    };
};

// #endif