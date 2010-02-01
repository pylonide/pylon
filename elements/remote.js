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
 * collaborative application logic for Ajax.org Platform. The children of this
 * element specify how the uniqueness of {@link term.datanode data nodes} is determined. By pointing
 * models to this element, all changes to their data will be streamed through
 * this element to all listening client over a choosen protocol. 
 * Example:
 * This example shows a small application which is editable by all clients that
 * have started it. Any change to the data is synchronized to all participants.
 * <code>
 *  <a:teleport>
 *      <a:xmpp id="myXMPP"
 *        url           = "http://ajax.org:5280/http-bind" 
 *        model         = "mdlRoster" 
 *        connection    = "bosh" 
 *  </a:teleport>
 *  
 *  <a:remote transport="myXMPP" id="rmtPersons">
 *      <a:person unique="[@id]" />
 *  </a:remote>
 *  
 *  <a:model id="mdlPersons" remote="rmtPersons">
 *      <persons>
 *          <person id="1">mike</person>
 *          <person id="2">ruben</person>
 *      </persons>
 *  </a:model>
 *
 *  <a:list id="lstPersons" model="mdlPersons" width="200" height="100">
 *      <a:bindings>
 *          <a:each match="[person]" />
 *          <a:caption match="[text()]" />
 *          <a:icon value="icoUsers.gif" />
 *      </a:bindings>
 *  </a:list>
 *
 *  <a:button action="remove" target="lstPersons">Remove</a:button>
 *  <a:button action="rename" target="lstPersons">Rename</a:button>
 *  
 *  <a:button onclick="myXMPP.connect('testuser@ajax.org', 'testpass')">
 *      Login
 *  </a:button>
 * </code>
 * Remarks:
 * Although locking is solved in smartbindings it is directly connected
 * to remote smartbindings. When multiple people are working within the same
 * application it's important to have a system that prevents corruption of data
 * and data loss by either user overwriting records edited during the same period.
 * Ajax.org Platform has built in support for optimistic and pessimistic locking
 * in smartbindings. For more information please see {@link term.locking}.
 * 
 * Advanced:
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
 * serious scaling problem and is not preferred. apf.offline has built in support
 * for this type of timeout. By setting the rsb-timeout attribute it is aware
 * of when the server has timed out. When this timeout is reached the application 
 * will reload all it's data from the server and discard all offline rsb 
 * messages before reconnecting to the server.
 *
 * @attribute {String} transport the name of the teleport element that provides a
 * bidirectional connection to (a pool of) other clients.
 * 
 * @see element.auth
 *
 * @define remote
 * @allowchild unique, {any}
 * @addnode elements
 *
 * @define unique Element defining what is unique about a set of data
 * elements. This enables remote smartbindings to point to xml data in 
 * the same way on all clients. This way changes that happen to these 
 * elements are described non-ambiguously. The tagName can be replaced
 * by the tagName of the {@link term.datanode data node} for which the uniqueness is specified.
 * Example:
 * This example shows a complex data set and a remote smartbinding that
 * specifies the uniqueness of all nodes concerned.
 * <code>
 *  <a:model id="mdlPersons" remote="rmtPersons">
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
 *  </a:model>
 *
 *  <a:remote transport="myXMPP" id="rmtPersons">
 *      <a:person unique="[@number]" />
 *      <a:unique match="[self::galaxy]" unique="[@name]" />
 *      <a:planet unique="[@id]" />
 *      <a:species unique="[text()]" />
 *  </a:remote>
 * </code>
 * @attribute {String} select   the xpath that selects the set of {@link term.datanode data nodes} that share a similar uniqueness trait.
 * @attribute {String} unique   the xpath that retrieves the unique value for a specific {@link term.datanode data node}.
 */
/**
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.983
 *
 * @default_private
 * @constructor
 *
 * @todo Think about wrapping multiple messages in a single call
 * @todo Make RSB support different encoding protocols (think REX)
 */
apf.remote = function(struct, tagName){
    this.$init(tagName || "remote", apf.NODE_HIDDEN, struct);
};

(function(){
    this.lookup     = {};
    this.select     = [];
    this.models     = [];
    this.rsbQueue   = {};
    this.queueTimer = null;
    
    //#ifdef __WITH_OFFLINE
    this.discardBefore = null;
    //#endif

    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        match : 1
    }, this.$attrExcludePropBind);
    
    this.sendChange = function(args, model){
        if (apf.xmldb.disableRSB)
            return;

        clearTimeout(this.queueTimer);
        //return this.transport.sendRSB(apf.serialize(args)); 
        this.queueMessage(args, model, this);
        if (!apf.isO3) {
            // use a timeout to batch consecutive calls into one RSB call
            var _self = this;
            this.queueTimer = $setTimeout(function() {
                _self.processQueue(_self);
            });
        }
        else {
            this.processQueue(this);
        }
    };
    
    this.buildMessage = function(args, model){
        for (var i = 0, l = args.length; i < l; i++) {
            if (args[i] && args[i].nodeType)
                args[i] = this.xmlToXpath(args[i], model.data);
        }
        
        return {
            model     : model.name,
            args      : args,
            timestamp : new Date().toGMTString()
        };
    };
    
    this.queueMessage = function(args, model, qHost){
        if (!model.id)
            model.setAttribute("id", "rmtRsbGen".appendRandomNumber(5));

        if (!qHost.rsbQueue)
            qHost.rsbQueue = {};
        if (!qHost.rsbQueue[model.id]) {
            qHost.rsbQueue[model.id] = [];
            qHost.rsbModel           = model;
        }
        // @todo do some more additional processing here...
        qHost.rsbQueue[model.id].push(this.buildMessage(args, model));
    };
    
    this.processQueue = function(qHost){
        if (qHost === this)
            clearTimeout(this.queueTimer);
        if (apf.xmldb.disableRSB) return;

        for (var model in qHost.rsbQueue) {
            if (!qHost.rsbQueue[model].length) continue;
            //#ifdef __DEBUG
            apf.console.info("Sending RSB message\n" + apf.serialize(qHost.rsbQueue[model]));
            //#endif
            this.transport.sendRSB(apf.serialize(qHost.rsbQueue[model]));
        }
        qHost.rsbQueue = {};
    };
    
    this.receiveChange = function(message){
        if (apf.xmldb.disableRSB)
            return;

        //#ifdef __WITH_OFFLINE
        // @todo apf3.0 implement proper offline support in RSB
        if (apf.offline && apf.offline.inProcess == 2) { //We're coming online, let's queue until after sync
            queue.push(message);
            return;
        }
        //#endif
        
        //this.lastTime = new Date().getTime();
        if (message.timestamp < this.discardBefore)
            return;
        
        var model = apf.nameserver.get("model", message.model),
            q     = message.args;
        
        //#ifdef __DEBUG
        if (!model) {
            //Maybe make this a warning?
            throw new Error(apf.formatErrorString(0, this, 
                "Remote Smartbinding Received", "Could not find model when "
              + "receiving data for it with name '" + message.model + "'"));
        }
        //#endif
        
        //Maybe make this an error?
        var xmlNode = this.xpathToXml(q[1], model.data);
        //#ifdef __DEBUG
        if (!xmlNode) {
            throw new Error(apf.formatErrorString(0, this,
                "Remote Smartbinding Received", "Could get XML node from model "
              + "with Xpath '" + q[1] + "'"));
        }
        /*#else
        if (!xmlNode) return;
        #endif*/
        
        var disableRSB       = apf.xmldb.disableRSB,
            beforeNode;
        apf.xmldb.disableRSB = 2; //Feedback prevention

        switch (q[0]) {
            case "setTextNode":
                apf.xmldb.setTextNode(xmlNode, q[2], q[3]);
                break;
            case "setAttribute":
                apf.xmldb.setAttribute(xmlNode, q[2], q[3], q[4]);
                break;
            case "addChildNode":
                apf.xmldb.addChildNode(xmlNode, q[2], q[3],
                    this.xpathToXml(q[4], model.data), q[5]);
                break;
            case "appendChild":
                beforeNode = (q[3] ? this.xpathToXml(q[3], model.data) : null);
                if (typeof q[2] == "string")
                    q[2] = apf.getXml(q[2]);
                apf.xmldb.appendChild(xmlNode, //@todo check why there's cleanNode here
                    apf.xmldb.cleanNode(q[2]), beforeNode, q[4], q[5]);
                break;
            case "moveNode":
                beforeNode = (q[3] ? this.xpathToXml(q[3], model.data) : null);
                var sNode = this.xpathToXml(q[2], model.data);
                apf.xmldb.appendChild(xmlNode, sNode, beforeNode,
                    q[4], q[5]);
                break;
            case "removeNode":
                apf.xmldb.removeNode(xmlNode, q[2]);
                break;
        }

        apf.xmldb.disableRSB = disableRSB;
    };
    
    this.xmlToXpath = apf.xmlToXpath;
    this.xpathToXml = apf.xpathToXml;
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //#ifdef __DEBUG
        apf.console.info(this.id
            ? "Creating remote [" + this.id + "]"
            : "Creating implicitly assigned remote");
        //#endif

        var _self = this;

        //#ifdef __WITH_OFFLINE
        if (apf.offline && apf.offline.enabled) {
            var queue = [];
            apf.offline.addEventListener("afteronline", function(){
                for (var i = 0, l = queue.length; i < l; i++)
                    _self.receiveChange(queue[i]);

                queue.length = 0;
            });
        }
        //#endif
        
        /**
         * @attribute {String} transport the id of the teleport module instance 
         * that provides a means to sent change messages to other clients.
         */
        this.transport = self[this["transport"]];

        //#ifdef __DEBUG
        if (!this.transport) {
            throw new Error("Missing transport");//@todo make this a proper apf3.0 error
        }
        //#endif

        this.transport.addEventListener("datachange", function(e){
            var data = apf.unserialize(e.data),
                i    = 0,
                l    = data.length;//@todo error check here.. invalid message
            for (; i < l; i++)
                _self.receiveChange(data[i]);
        });
    });
}).call(apf.remote.prototype = new apf.AmlElement());

apf.aml.setElement("remote", apf.remote);
apf.aml.setElement("unique", apf.BindingRule);


// #endif
