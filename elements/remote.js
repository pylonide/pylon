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
 * Element allowing data synchronization between multiple clients using the same
 * application or application part. This element is designed as thecore of 
 * collaborative application logic for Javeline PlatForm. The children of this
 * element specify how the uniqueness of data elements is determined. By pointing
 * models to this element, all changes to their data will be streamed through
 * this element to all listening client over a choosen protocol. 
 * Example:
 * This example shows a small application which is editable by all clients that
 * have started it. Any change to the data is synchronized to all participants.
 * <pre class="code">
 *  <j:teleport>
 *      <j:xmpp id="myXMPP"
 *        url           = "http://javeline.com:5280/http-bind" 
 *        model         = "mdlRoster" 
 *        connection    = "bosh" 
 *  </j:teleport>
 *  
 *  <j:remote transport="myXMPP" id="rmtPersons">
 *      <j:person unique="@id" />
 *  </j:remote>
 *  
 *  <j:model id="mdlPersons" remote="rmtPersons">
 *      <persons>
 *          <person id="1">mike</person>
 *          <person id="2">ruben</person>
 *      </persons>
 *  </j:model>
 *
 *  <j:list id="lstPersons" model="mdlPersons" width="200" height="100">
 *      <j:bindings>
 *          <j:traverse select="person" />
 *          <j:caption select="text()" />
 *          <j:icon value="icoUsers.gif" />
 *      </j:bindings>
 *  </j:list>
 *
 *  <j:button action="remove" target="lstPersons">Remove</j:button>
 *  <j:button action="rename" target="lstPersons">Rename</j:button>
 *  
 *  <j:button onclick="myXMPP.connect('testuser@javeline.com', 'testpass')">
 *      Login
 *  </j:button>
 * </pre>
 * Remarks:
 * Although locking is solved in smartbindings it is directly connected
 * to remote smartbindings. When multiple people are working within the same
 * application it's important to have a system that prevents corruption of data
 * and data loss by either user overwriting records edited during the same period.
 * Javeline PlatForm has built in support for optimistic and pessimistic locking
 * in smartbindings. For more information please see {@link term.locking}.
 * 
 * Advanced Remarks:
 * There is a very small theoretical risk that a user initiates and finishes an 
 * action during the latency period of the rsb communication. Usually this 
 * latency is no more than 100 to 300ms which is near impossible for such action
 * to be performed. Therefor this is deemed acceptable.
 * 
 * Working in a multi user environment could imply that data has a high 
 * probability of changing. This might be a problem when syncing offline 
 * changes after several hours. This should be a consideration for the 
 * application architect.
 *
 * Another concern for offline use is the offline messaging feature of certain
 * collaborative protocols (i.e. xmpp). In many cases offline rsb messages should 
 * not be stored after the user has been offline for longer then a certain time.
 * For instance 10 minutes. An accumulation of change messages would create a
 * serious scaling problem and is not preferred. jpf.offline has built in support
 * for this type of timeout. By setting the rsb-timeout attribute it is aware
 * of when the server has timed out. When this timeout is reached the application 
 * will reload all it's data from the server and discard all offline rsb 
 * messages before reconnecting to the hyve.
 * 
 * @see auth
 *
 * @define remote
 * @allowchild unique, {any}
 * @addnode elements
 *
 * @define unique Element defining what is unique about a set of data
 * elements. This enables remote smartbindings to point to xml data in 
 * the same way on all clients. This way changes that happen to these 
 * elements are described non-ambiguously. The tagName can be replaced
 * by the tagName of the data element for which the uniqueness is specified.
 * Example:
 * This example shows a complex data set and a remote smartbinding that
 * specifies the uniqueness of all nodes concerned.
 * <pre class="code">
 *  <j:model id="mdlPersons" remote="rmtPersons">
 *      <universe>
 *          <galaxy name="milkyway">
 *              <planet id="ALS-3947">
 *                  <species>3564</species>
 *                  <species>8104</species>
 *              </planet>
 *              <planet id="Earth">
 *                  <person number="802354897">Mike</person>
 *                  <person number="836114798">Rik</person>
 *              </planet>
 *          </galaxy>
 *      </universe>
 *  </j:model>
 *
 *  <j:remote transport="myXMPP" id="rmtPersons">
 *      <j:person unique="@number" />
 *      <j:unique select="self::galaxy" unique="@name" />
 *      <j:planet unique="@id" />
 *      <j:species unique="text()" />
 *  </j:remote>
 * </pre>
 * @attribute {String} select   the xpath that selects the set of data elements that share a similar uniqueness trait.
 * @attribute {String} unique   the xpath that retrieves the unique value for a specific data element.
 */
/**
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.983
 *
 * @default_private
 * @constructor
 *
 * @todo Think about wrapping multiple messages in a single call
 * @todo Make RSB support different encoding protocols (think REX)
 */
jpf.remote = function(name, xmlNode, parentNode){
    this.name   = name;
    this.lookup = {};
    this.select = [];
    this.models = [];
    
    //#ifdef __WITH_JMLDOM_FULL
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
            timestamp : new Date().toGMTString()
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
    
    this.xmlToXpath = jpf.remote.xmlToXpath;
    this.xpathToXml = jpf.remote.xpathToXml;
    
    //#ifdef __DEBUG
    jpf.console.info(name
        ? "Creating remote [" + name + "]"
        : "Creating implicitly assigned remote");
    //#endif
    
    this.loadJml = function(x){
        this.name = x.getAttribute("id");
        this.$jml  = x;
        
        /**
         * @attribute {String} transport the id of the teleport module instance 
         * that provides a means to sent change messages to other clients.
         */
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
jpf.remote.xmlToXpath = function(xmlNode, xmlContext, useJid){
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
jpf.remote.xpathToXml = function(xpath, xmlNode){
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
