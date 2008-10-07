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

//#ifdef __WITH_RSB

/**
 * @classDescription		This class creates a new remote smartbinding
 * @return {RemoteSmartBinding} Returns a new remote smartbinding
 * @type {RemoteSmartBinding}
 * @constructor
 * @jpfclass
 *
 * @done
 *   - add ,offline argument to get
 *   - Add offline="false" to RPC methods
 *   - Add the receive method handling to actiontracker, change it to use options, 
 *     also do this for post/get and please merge them into rest
 *   - Make AT queue action requests
 *   - Make login abstraction that works with http 401 messages.
 *   - Change the actiontracker to execute RSB after an affirmative call from the server
 *   - Sent the timestamp recorded at the start of the action in a header X-JPF-ActionStart
 *   - Undo the action when the server gives a locking error (seperate http state) (onlockfailed event)
 *   - Undo the action when the server gives a general error (onerror event)
 *   - Using an ignore-fail="true" attribute on an action it's possible to prevent stack clearing during offline sync
 *   - have xmpp network-detect and such use the offline argument of get
 *   - How are RSB messages distinguished from other ones?
 *   - How is the actionstack associated met de cached http messages such that undo-ing them 
 *      removes them from the queue, both in offline and rebooted offline states?
 *   - Create sync
 *   - Move the offline modules to seperate files
 *   - Cancel the action cancelAction() when a pessimistic lock failed (onlockfailed event)
 *   - Create the main online/offline handler in jpf.offline
 *   - Create a sync dependency chain of logging into the application (xmpp, http, etc)
 *   - Create memory based storage provider for offline
 *   - Cancel the action cancelAction() when an rsb update comes
 *   - Where to decide when to clear the state/registry
 *   - Make it possible to restart the application in exactly the same state it was in before by:
 *       - Hooking into the undo/do stacks and recording them
 *       - Record the state of components
 *       - Make init for the application that sets these
 *   - An rsb enabled model should record the timestamp at which it requested the data in itself
 *   - For offline this should also be recorded between sessions
 *   - The moment of loss of network access should be recorded when using RSB
 *   - After X time models should reinit themselves instead of processing the incoming RSB messages when coming online
 *      - Before this timeout, the sync should happen first, after the sync the reinit happens
 *
 * @todo locking, undo, RSB and offline:
 *   
 *   TEST TEST TEST and DEBUG
 *
 *   - Record the state of the selection of multiselect items
 *   - Add undo-length="" property. Default the undo stack length to the Math.max(execStack.calc_length, 30)
 *   - Add a warning screen to debug.js
 *
 *   NOTICES
 *
 *   - The RSB server should have the same dynamic with the same timeout
 *   - Optionally there should be a way to receive this timeout (for instance during model load, or a seperate call)
 *       - This should possibly be done seperately by the developer
 *   
 *   - We accept that there is a theoretical possibility of a user initiating and finishing an action
 *     during the latency period of receiving the rsb message of the change.
 *       - The extra problem with this is when the user went offline before receiving this rsb message
 *       - This might be solved by recording the starttime of the action minus the mean of the latency time of rsb messages
 *
 *   - A consequence of this system is that offline changes of data have a high probability of changing, meaning
 *     that offline use of a multiuser environment will often not be able to synchronize changes 
 *       - This could in theory be solved by adding a SVN like system of merging/conflicts, but that seems to go beyond
 *         the point and usefulness of such an application.
 *   
 *   Single Client Locking
 *   - Because of the increased complexity of this, when a lock fails (either pessimistic or optimistic)
 *     the developer should handle this by reloading that part of the content for which the lock failed.
 *     It is impossible for JPF to know which part this is and what to update
 *
 *   MIKE:
 *   - Each protocol needs to implement support for jpf.auth
 *      Add to xmpp:   if (jpf.login.authRequired(extra) === true) return
 *   - add xmpp data instructions with 'current' conversation logic
 *   - Hook in connection loss
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.983
 *
 * @todo Think about wrapping multiple messages in a single call
 * @todo Make RSB support different encoding protocols (think REX)
 */
jpf.RemoteSmartBinding = function(name, xmlNode, parentNode){
    this.name   = name;
    this.lookup = {};
    this.select = [];
    this.models = [];
    
    //#ifdef __WITH_DOM_COMPLETE
    this.parentNode = parentNode;
    jpf.inherit.call(this, jpf.JmlDom); /** @inherits jpf.JmlDom */
    //#endif
    
    //#ifdef __WITH_OFFLINE
    this.discardBefore = null;
    //#endif
    
    var _self = this;
    
    this.sendChange = function(args, model){
        if (!jpf.xmldb.disableRSB)
            return;
        
        var message = [this.buildMessage(args, model)];
        
        //#ifdef __DEBUG
        jpf.console.info('Sending RSB message\n' + jpf.serialize(message));
        //#endif
        
        this.transport.sendMessage(null, jpf.serialize(message),
            null, jpf.xmpp.MSG_NORMAL); //@todo hmmm xmpp here? thats not good
    };
    
    this.buildMessage = function(args, model){
        for (var i = 0; i < args.length; i++)
            if(args[i] && args[i].nodeType) 
                args[i] = this.xmlToXpath(args[i], model.data);
        
        return {
            model     : model.name,
            args      : args,
            timestamp : new Date().getTime() //@todo Who has a date conversion function to set all dates to GMT?
        }
    };
    
    this.queueMessage = function(args, model, qHost){
        if (!qHost.rsbQueue) {
            qHost.rsbQueue = [];
            qHost.rsbModel = model;
        }
        
        qHost.rsbQueue.push(this.buildMessage(args, model));
    };
    
    this.processQueue = function(qHost){
        if (!jpf.xmldb.disableRSB || !qHost.rsbQueue || !qHost.rsbQueue.length) 
            return;
        
        //#ifdef __DEBUG
        jpf.console.info('Sending RSB message\n' + jpf.serialize(qHost.rsbQueue));
        //#endif
        
        this.transport.sendMessage(null, jpf.serialize(qHost.rsbQueue), 
            null, jpf.xmpp.MSG_NORMAL); //@todo hmmm xmpp here? thats not good
        
        qHost.rsbQueue = [];
    };
    
    //#ifdef __WITH_OFFLINE
    if (jpf.offline.enabled) {
        var queue = [];
        jpf.offline.addEventListener("afteronline", function(){
            for (var i = 0; i < queue.length; i++) {
                _self.receiveChange(queue[i]);
            }
            
            queue.length = 0;
        });
    }
    //#endif
    
    this.receiveChange = function(message){
        if (jpf.xmldb.disableRSB)
            return;

        //#ifdef __WITH_OFFLINE
        if (jpf.offline.inProcess == 2) { //We're coming online, let's queue until after sync
            queue.push(message);
            return;
        }
        //#endif
        
        //this.lastTime = new Date().getTime();
        if (message.timestamp < this.discardBefore)
            return;
        
        var model = jpf.nameserver.get("model", message.model);
        var q = message.args;
        
        //#ifdef __DEBUG
        if (!model) {
            //Maybe make this a warning?
            throw new Error(jpf.formatErrorString(0, this, 
                "Remote Smartbinding Received", "Could not find model when \
                 receiving data for it with name '" + message.model + "'"));
        }
        //#endif
        
        //Maybe make this an error?
        var xmlNode = this.xpathToXml(q[1], model.data);
        if (!xmlNode) return;
        
        var disableRSB       = jpf.xmldb.disableRSB;
        jpf.xmldb.disableRSB = 2; //Feedback prevention

        switch (q[0]) {
            case "setTextNode":
                jpf.xmldb.setTextNode(xmlNode, q[2], q[3]);
                break;
            case "setAttribute":
                jpf.xmldb.setAttribute(xmlNode, q[2], q[3], q[4]);
                break;
            case "addChildNode":
                jpf.xmldb.addChildNode(xmlNode, q[2], q[3],
                    this.xpathToXml(q[4], model.data), q[5]);
                break;
            case "appendChild":
                var beforeNode = (q[3] ? this.xpathToXml(q[3], model.data) : null);
                jpf.xmldb.appendChild(xmlNode, //@todo check why there's clearConnections here
                    jpf.xmldb.clearConnections(q[2]), beforeNode, q[4], q[5]);
                break;
            case "moveNode":
                var beforeNode = (q[3] ? this.xpathToXml(q[3], model.data) : null);
                var sNode = this.xpathToXml(q[2], model.data);
                jpf.xmldb.appendChild(xmlNode, sNode, beforeNode,
                    q[4], q[5]);
                break;
            case "removeNode":
                jpf.xmldb.removeNode(xmlNode, q[2]);
                break;
        }

        jpf.xmldb.disableRSB = disableRSB;
    };
    
    this.xmlToXpath = jpf.RemoteSmartBinding.xmlToXpath;
    this.xpathToXml = jpf.RemoteSmartBinding.xpathToXml;
    
    //#ifdef __DEBUG
    jpf.console.info(name
        ? "Creating RemoteSmartBinding [" + name + "]"
        : "Creating implicitly assigned RemoteSmartBinding");
    //#endif
    
    this.loadJml = function(x){
        this.name = x.getAttribute("id");
        this.jml  = x;
        
        this.transport = self[x.getAttribute("transport")];
        this.transport.addEventListener('datachange', function(e){
            var data = jpf.unserialize(e.data); //@todo error check here.. invalid message
            for (var i = 0; i < data.length; i++)
                _self.receiveChange(data[i]);
        });
        
        var nodes = x.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) continue;
            
            if (nodes[i].getAttribute("select")) 
                this.select.push(nodes[i].getAttribute("select"),
                    nodes[i].getAttribute("unique"));
            else 
                this.lookup[nodes[i][jpf.TAGNAME]] = nodes[i].getAttribute("unique");
        }
    };
    
    if (xmlNode)
        this.loadJml(xmlNode);
}

//@todo this function needs to be 100% proof, it's the core of the system
//for RSB: xmlNode --> Xpath statement
jpf.RemoteSmartBinding.xmlToXpath = function(xmlNode, xmlContext, useJid){
    if (useJid) {
        //#ifdef __DEBUG
        if (!xmlNode.getAttribute(jpf.xmldb.xmlIdTag)) {
            throw new Error(jpf.formatErrorString(0, null, 
                "Converting XML to Xpath", 
                "Error xml node without j_id found whilst \
                 trying to use it.", xmlNode));
        }
        //#endif
        
        return "//node()[@" + jpf.xmldb.xmlIdTag + "='" 
            + xmlNode.getAttribute(jpf.xmldb.xmlIdTag) + "']";
    }
    
    if (this.lookup && this.select) {
        var def = this.lookup[xmlNode.tagName];
        if (def) {
            //unique should not have ' in it... -- can be fixed...
            var unique = xmlNode.selectSingleNode(def).nodeValue;
            return "//" + xmlNode.tagName + "[" + def + "='" + unique + "']";
        }
        
        for (var i = 0; i < this.select.length; i++) {
            if (xmlNode.selectSingleNode(this.select[i][0])) {
                var unique = xmlNode.selectSingleNode(this.select[i][1]).nodeValue;
                return "//" + this.select[i][0] + "[" + this.select[i][1]
                    + "='" + unique + "']";
            }
        }
    }

    if (xmlNode == xmlContext)
        return ".";

    if (!xmlNode.parentNode) {
        //#ifdef __DEBUG
        throw new Error(jpf.formatErrorString(0, null, 
            "Converting XML to Xpath", 
            "Error xml node without parent and non matching context cannot\
             be converted to xml.", xmlNode));
        //#endif
        
        return false;
    }

    var str = [], lNode = xmlNode;
    do {
        str.unshift(lNode.tagName);
        lNode = lNode.parentNode;
    } while(lNode && lNode.nodeType == 1 && lNode != xmlContext);
    
    return str.join("/") + "[" + (jpf.xmldb.getChildNumber(xmlNode) + 1) + "]";
};
    
//for RSB: Xpath statement --> xmlNode
jpf.RemoteSmartBinding.xpathToXml = function(xpath, xmlNode){
    if (!xmlNode) {
        //#ifdef __DEBUG
        throw new Error(jpf.formatErrorString(0, null, 
            "Converting Xpath to XML", 
            "Error context xml node is empty, thus xml node cannot \
             be found for '" + xpath + "'"));
        //#endif
        
        return false;
    }
    
    return xmlNode.selectSingleNode(xpath);
};

// #endif
