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
            throw new Error(0, jpf.formErrorString(0, this, "Remote Smartbinding Receiev", "Could not find model when receiving data for it with name '" + message.model + "'"));
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