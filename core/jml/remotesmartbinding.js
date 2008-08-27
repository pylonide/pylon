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
 * @todo locking, undo, RSB and offline:
 *   - Generalize the startAction methodology, by creating a method for it
 *       - This method can be cancelled by events, offline etc
 *       - This method can execute pessimistic locking calls (<j:aname locking="datainstr" /> rule)
 *       - or for optimistic locking it can record the timestamp (based on a setting <j:appsettings locking="optimistic")
 *       - During offline work, pessimistic locks will always fail
 *       - During offline work, optimistic locks will be handled by taking the timestamp of going offline
 *   - Cancel the action cancelAction() when an rsb update comes
 *   - Cancel the action cancelAction() when a pessimistic lock failed (onlockfailed event)
 *   - Sent the timestamp recorded at the start of the action in a header X-JPF-ActionStart
 *   - Undo the action when the server gives a locking error (seperate http state) (onlockfailed event)
 *   - Undo the action when the server gives a general error (onerror event)
 *   
 *   - Using an ignore-fail="true" attribute on an action it's possible to prevent stack clearing during offline sync
 *
 *   - An rsb enabled model should record the timestamp at which it requested the data in itself
 *   - For offline this should also be recorded between sessions
 *   - The moment of loss of network access should be recorded when using RSB
 *   - After X time models should reinit themselves instead of processing the incoming RSB messages
 *      - Before this timeout, the sync should happen first, after the sync the reinit happens
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
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.983
 */
jpf.RemoteSmartBinding = function(name, xmlNode){
    this.name     = name;
    this.lookup   = {};
    this.select   = [];
    
    var _self = this;
    
    this.sendChange = function(args, model){
        for (var i = 0; i < args.length; i++)
            if(args[i] && args[i].nodeType) 
                args[i] = this.xmlToXpath(args[i]);
        
        var message = {
            model : model.name,
            args : args
        }
        
        //#ifdef __STATUS
        jpf.status('Sending RSB message\n' + jpf.serialize(message));
        //#endif
        
        this.transport.sendMessage(null, jpf.serialize(message),
            null, jpf.xmpp.MSG_NORMAL);
    }
    
    this.receiveChange = function(message){
        var model = jpf.NameServer.get("model", message.model);
        var q = message.args;
        
        //#ifdef __DEBUG
        if(!model){
            //Maybe make this a warning?
            throw new Error(0, jpf.formatErrorString(0, this, "Remote Smartbinding Receiev", "Could not find model when receiving data for it with name '" + message.model + "'"));
        }
        //#endif
        
        //Maybe make this an error?
        var xmlNode = this.xpathToXml(q[1], model);
        if (!xmlNode) return;
        
        jpf.XMLDatabase.disableRSB = true; //Feedback prevention

        switch (q[0]) {
            case "setTextNode":
                jpf.XMLDatabase.setTextNode(xmlNode, q[2], q[3]);
                break;
            case "setAttribute":
                jpf.XMLDatabase.setAttribute(xmlNode, q[2], q[3], q[4]);
                break;
            case "addChildNode":
                jpf.XMLDatabase.addChildNode(xmlNode, q[2], q[3],
                    this.xpathToXml(q[4], model), q[5]);
                break;
            case "appendChildNode":
                var beforeNode = (q[3] ? this.xpathToXml(q[3], model) : null);
                jpf.XMLDatabase.appendChildNode(xmlNode,
                    jpf.XMLDatabase.clearConnections(q[2]), beforeNode, q[4], q[5]);
                break;
            case "moveNode":
                var beforeNode = (q[3] ? this.xpathToXml(q[3], model) : null);
                var sNode = this.xpathToXml(q[2], model);
                jpf.XMLDatabase.appendChildNode(xmlNode, sNode, beforeNode,
                    q[4], q[5]);
                break;
            case "removeNode":
                jpf.XMLDatabase.removeNode(xmlNode, q[2]);
                break;
        }

        jpf.XMLDatabase.disableRSB = false;
    }
    
    //for RSB: xmlNode --> Xpath statement
    this.xmlToXpath = function(xmlNode){
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
        
        //THIS SHOULD BE THE COMPLETE PATH
        jpf.status('serializXml: ' + xmlNode.tagName);
        
        //DIRTY HACK MIKE:
        if (!xmlNode.parentNode)
            return "//" + xmlNode.tagName + "[0]";
            
        return "//" + xmlNode.parentNode.tagName + "/" + xmlNode.tagName
            + "[" + (jpf.XMLDatabase.getChildNumber(xmlNode) + 1) + "]";
    }
    
    //for RSB: Xpath statement --> xmlNode
    this.xpathToXml = function(xpath, model){
        if(!model.data) return false; //error?
        return model.data.selectSingleNode(xpath);
    }
    
    //#ifdef __STATUS
    jpf.status(name
        ? "Creating RemoteSmartBinding [" + name + "]"
        : "Creating implicitly assigned RemoteSmartBinding");
    //#endif
    
    this.loadJML = function(x){
        this.name = x.getAttribute("id");
        this.jml  = x;
        
        this.transport = self[x.getAttribute("transport")];
        this.transport.addEventListener('ondatachange', function(e){
            _self.receiveChange(jpf.unserialize(e.data));
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
    }
    
    if (xmlNode)
        this.loadJML(xmlNode);
}

// #endif