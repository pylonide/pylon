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

//#ifdef __WITH_RDB

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
 *  <a:remote transport="myXMPP" id="rmtPersons" />
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
 * to remote databindings. When multiple people are working within the same
 * application it's important to have a system that prevents corruption of data
 * and data loss by either user overwriting records edited during the same period.
 * Ajax.org Platform has built in support for optimistic and pessimistic locking
 * in smartbindings. For more information please see {@link term.locking}.
 * 
 * Advanced:
 * There is a very small theoretical risk that a user initiates and finishes an 
 * action during the latency period of the rdb communication. Usually this
 * latency is no more than 100 to 300ms which is near impossible for such action
 * to be performed. Therefor this is deemed acceptable.
 * 
 * Working in a multi user environment usually implies that data has a high
 * probability of changing. This might become a problem when syncing offline
 * changes after several hours. This should be a consideration for the 
 * application architect.
 *
 * Another concern for offline use is the offline messaging feature of certain
 * collaborative protocols (i.e. xmpp). In many cases offline rdb messages should
 * not be stored after the user has been offline for longer then a certain time.
 * For instance 10 minutes. An accumulation of change messages would create a
 * serious scaling problem and is not preferred. apf.offline has built in support
 * for this type of timeout. By setting the rdb-timeout attribute it is aware
 * of when the server has timed out. When this timeout is reached the application 
 * will reload all its data from the server and discard all offline rdb
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
 * @define unique Element defining what is unique about a set of data elements.
 * This enables remote databindings to point to xml data in  the same way on all
 * clients. This way changes that happen to these elements are described
 * non-ambiguously. The tagName can be replaced by the tagName of the
 * {@link term.datanode data node} for which the uniqueness is specified.
 * Example:
 * This example shows a complex data set and a remote databinding that
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
 *  <a:remote transport="myXMPP" id="rmtPersons" />
 * </code>
 * @attribute {String} transport   ID of a Teleport element that is able to serve
 *                                 as a transport for RDB message like {@link element.xmpp xmpp}
 */
/**
 * @author      Mike de Boer (mike AT ajax DOT org)
 * @version     %I%, %G%
 * @since       3.0
 *
 * @default_private
 * @constructor
 *
 * @todo Think about wrapping multiple messages in a single call
 * @todo Make RDB support different encoding protocols (think REX)
 */
apf.remote = function(struct, tagName){
    this.$init(tagName || "remote", apf.NODE_HIDDEN, struct);
    
    this.lookup              = {};
    this.select              = [];
    this.sessions            = {};
    this.rdbQueue            = {};
    this.queueTimer          = null;
    this.pendingSessions     = {};
    this.pendingTerminations = {};
};

(function(){
    //#ifdef __WITH_OFFLINE
    this.discardBefore = null;
    //#endif

    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        match : 1
    }, this.$attrExcludePropBind);

    this.$supportedProperties.push("transport");
    
    function checkProtocol(resource) {
        if (resource.indexOf("rdb__") === 0)
            return "rdb:" + resource.substr(3).replace(/_/g, "/");
        return resource;
    }

    this.$propHandlers["transport"] = function(value) {
        this.transport = typeof value == "object" ? value : self[this["transport"]];

        //#ifdef __DEBUG
        if (!this.transport) {
            throw new Error(apf.formatErrorString(0, this, "RDB: Missing transport",
                "A transport element with ID '" + value + "' could not be found."));
        }
        //#endif

        var _self = this;

        this.transport.addEventListener("connected", function() {
            var s, t;
            for (s in _self.pendingTerminations)
                _self.endSession(_self.pendingTerminations[s], s.split(":")[1]);
            for (t in _self.pendingSessions)
                _self.startSession(_self.pendingSessions[t], t.split(":")[1]);
            if (!t)
                _self.startEmptySession();
        });

        this.transport.addEventListener("reconnect", function() {
            var s, o, model, xpath;
            for (s in _self.sessions) {
                o = _self.sessions[s],
                model = o.model,
                xpath = o.xpath,
                o     = null;
                delete _self.sessions[s];
                _self.startSession(model, xpath);
            }
            if (!s)
                _self.startEmptySession();
        });

        this.transport.addEventListener("datachange", function(e){
            var oData    = typeof e.body == "string" ? apf.unserialize(e.body) : e.body,
                oSession = _self.sessions[e.session],
                i        = 0,
                l        = oData.length;//@todo error check here.. invalid message
            for (; i < l; i++)
                _self.receiveChange(oData[i], oSession, e.annotator);
        });

        this.transport.addEventListener("datastatuschange", function(e) {
            // e looks like { type: "submit", annotator: "benvolio@shakespeare.lit", fields: [] }
            // #ifdef __DEBUG
            apf.console.log("datastatuschange msg: " + e);
            // #endif

            if (!e.session && !e.fields["session"]) return;
            var iBaseline, sModel,
                sSession = e.session || e.fields["session"].value,
                oSession = _self.sessions[sSession],
                f        = function(oSession) {
                    if (e.type == "submit") {
                        iBaseline = e.baseline  || e.fields["baseline"]  ? oSession.baseline : 0,
                        sModel    = e.modeldata || e.fields["modeldata"] ? oSession.model.getXml().xml : "";

                        _self.transport.sendSyncRDB(e.annotator, sSession, iBaseline, sModel);
                    }
                    else if (e.type == "result") {
                        iBaseline = e.baseline  || (e.fields["baseline"]  ? e.fields["baseline"].value  : null),
                        sModel    = e.modeldata || (e.fields["modeldata"] ? e.fields["modeldata"].value : null);
                        if (sModel)
                            _self.sessions[sSession].model.load(sModel);
                        _self.sessionStarted(sSession, iBaseline);
                    }
                }

            if (!oSession)
                oSession = _self.createDynamicModel(e, f);
            else
                f(oSession);
        });

        this.transport.addEventListener("rpc", function(e) {
            _self.dispatchEvent("rpc", apf.extend({
                sid     : e.sid,
                resource: e.annotator,
                from    : e.from,
                command : e.command
            }, e.data ? JSON.parse(e.data) : {}));
        });
    };

    this.startSession = function(model, xpath) {
        if (!model) return;
        if (!model.id)
            model.setAttribute("id", "rmtRsbGen".appendRandomNumber(5));
        model.$hasResource = (model.src && model.src.indexOf("rdb://") === 0);
        xpath  = xpath || "//";
        var o,
            id = model.$hasResource ? model.src : model.id + ":" + xpath;
        apf.console.log("Starting session with ID: " + id + ", " + model.src);
        this.sessions[id] = model;
        if (this.transport && this.transport.isConnected()) {
            delete this.sessions[id];
            delete this.pendingSessions[id];
            if (model.$hasResource)
                delete this.sessions[model.src];
            id = this.transport.normalizeEntity(id);
            o = this.sessions[id] = {
                model: model,
                xpath: xpath
            };
            var _self = this;
            this.transport.startRDB(id, function(sSession, iTime) {
                _self.sessionStarted(sSession, iTime);
            });
            return o;
        }
        else {
            this.pendingSessions[id] = model;
        }
    };

    this.startEmptySession = function() {
        if (this.transport && this.transport.isConnected())
            this.transport.startRDB("empty");
    };

    this.endSession = function(model, xpath) {
        xpath  = xpath || "//";
        var id = model.$hasResource ? this.transport.normalizeEntity(model.src) : model.id + ":" + xpath;
        if (this.transport && this.transport.isConnected()) {
            delete this.pendingTerminations[id];
            this.transport.endRDB(this.transport.normalizeEntity(id));
        }
        else {
            this.pendingTerminations[id] = model;
        }
        delete this.sessions[id];
    };

    this.sessionStarted = function(sSession, iTime) {
        var oSession;
        if (!(oSession = this.sessions[sSession])) {
	    apf.console.warn("Could not find session: " + sSession);
	    return;
	}
        // check if time is provided, otherwise user created the session
        oSession.baseline = iTime ? parseInt(iTime) : new Date().getTime();
        // #ifdef __DEBUG
        apf.console.log("session started: " + sSession + ", " + oSession.baseline);
        // #endif
    };

    this.pauseSession = function() {
        // @todo
    };

    this.createDynamicModel = function(e, callback) {
        //if (!this["resource-uri"])
        //    return; //@todo implement error messaging (like '404, data not found')
        var model, f,
            id       = e.session || e.fields["session"].value,
            resource = checkProtocol(id);
        apf.console.log("creating dynamic model " + id + ", " + resource);
        if (!(model = apf.nameserver.get(id))) {
            model = apf.setReference(id,
                apf.nameserver.register("model", id, new apf.model()));
            if (model === 0)
                model = self[id];
            else
                model.id = model.name = id;
            model.src = resource;
            model.setProperty("remote", this.id);
        }
        var o = this.getSessionByModel(id);
        if (!o)
            o = this.startSession(model);
        // set the root node for this model
        model.addEventListener("afterload", f = function() {
            model.removeEventListener("afterload", f);
            callback(o);
        });
        this.dispatchEvent("rdbinit", {
            model    : model,
            resource : resource,
            session  : id,
            fields   : e.fields,
            annotator: e.annotator
        });
    };
    
    this.sendChange = function(args, model){
        if (apf.xmldb.disableRDB)
            return;

        clearTimeout(this.queueTimer);
        //return this.transport.sendRDB(apf.serialize(args));
        this.queueMessage(args, model, this);
        if (!apf.isO3) {
            // use a timeout to batch consecutive calls into one RDB call
            var _self = this;
            this.queueTimer = $setTimeout(function() {
                _self.processQueue(_self);
            });
        }
        else {
            this.processQueue(this);
        }
    };

    this.sendRPC = function(iId, oParams) {
        var oData     = oParams.data,
            fCallback = oParams.callback,
            sSession  = oData["session"] ? this.transport.normalizeEntity(oData["session"]) : null,
            sCommand  = oData["command"];
        delete oData["command"];
        if (typeof oParams != "string")
            oParams = JSON.stringify(oParams);
        this.transport.sendRPC(iId, sSession, sCommand, oParams, fCallback);
    };

    this.sendRPCResult = function(oParams) {
        var oData    = oParams.data;
        if (typeof oData != "string")
            oData = JSON.stringify(oData);
        this.transport.sendRPCResult(oParams.sid, oParams.status || 500,
            oParams.to, oParams.command, oData);
    };

    this.getSessionByModel = function(sModel) {
        if (typeof sModel != "string")
            sModel = sModel.id;
        for (var i in this.sessions) {
            if (this.sessions[i].model && this.sessions[i].model.id == sModel)
                return this.sessions[i];
        }
        return null;
    };
    
    this.buildMessage = function(args, model){
        var oSession = this.getSessionByModel(model.id),
            i        = 0,
            l        = args.length;
        // #ifdef __DEBUG
        if (!oSession) {
            throw new Error(apf.formatErrorString(0, this, "RDB: sending message",
                "No session initiated yet, please login first!"));
        }
        // #endif

        for (; i < l; ++i) {
            if (args[i] && args[i].nodeType)
                args[i] = this.xmlToXpath(args[i], model.data);
        }

        return {
            model     : model.$hasResource ? model.src : model.id,
            args      : args,
            currdelta : new Date().getTime() - oSession.baseline
        };
    };
    
    this.queueMessage = function(args, model, qHost){
        if (!qHost.rdbQueue)
            qHost.rdbQueue = {};

        var id = model.$hasResource ? this.transport.normalizeEntity(model.src) : model.id;
        if (!qHost.rdbQueue[id]) {
            qHost.rdbQueue[id] = [];
            qHost.rdbModel     = model;
        }
        // @todo do some more additional processing here...
        qHost.rdbQueue[id].push(this.buildMessage(args, model));
    };
    
    this.processQueue = function(qHost){
        if (qHost === this)
            clearTimeout(this.queueTimer);
        if (apf.xmldb.disableRDB) return;

        for (var model in qHost.rdbQueue) {
            if (!qHost.rdbQueue[model].length) continue;
            //#ifdef __DEBUG
            apf.console.info("Sending RDB message\n" + apf.serialize(qHost.rdbQueue[model]));
            //#endif
            this.transport.sendRDB(model, apf.serialize(qHost.rdbQueue[model]));
        }
        qHost.rdbQueue = {};
    };
    
    this.receiveChange = function(oMessage, oSession, sAnnotator){
        if (apf.xmldb.disableRDB)
            return;

        //#ifdef __WITH_OFFLINE
        // @todo apf3.0 implement proper offline support in RDB
        if (apf.offline && apf.offline.inProcess == 2) { //We're coming online, let's queue until after sync
            queue.push(oMessage);
            return;
        }
        //#endif
        
        //this.lastTime = new Date().getTime();
        if (oMessage.timestamp < this.discardBefore)
            return;

        var model = oSession ? oSession.model : apf.nameserver.get("model", oMessage.model),
            q     = oMessage.args;
        
        if (!model) {
            //#ifdef __DEBUG
            apf.console.warn("Remote Databinding Received: Could not find model when \
                 receiving data for it with name '" + oMessage.model + "'");
            //#endif
            return;
        }
        if (!model.$at)
            model.$at = apf.window.$at; //@todo find better solution to the case of a missing ActionTracker...

        var oError, xmlNode,
            disableRDB       = apf.xmldb.disableRDB;
        apf.xmldb.disableRDB = 2; //Feedback prevention

        if (!oSession && oMessage.model)
            oSession = this.sessions[this.transport.normalizeEntity(oMessage.model)];
        if (!oSession) {
            // #ifdef __DEBUG
            //Maybe make this a warning?
            throw new Error(apf.formatErrorString(0, this,
                "Remote Databinding Received", "Could not find session when \
                 receiving data for it with name '"
               + this.transport.normalizeEntity(oMessage.model) + "'"));
            // #endif
            apf.xmldb.disableRDB = disableRDB;
            return;
        }

        // correct timestamp with the session baseline
        oMessage.currdelta = oSession.baseline + parseInt(oMessage.currdelta);

        // #ifdef __DEBUG
        apf.console.log("timestamp comparison (base: " + oSession.baseline + ") : " 
            + (new Date().toGMTString())
            + ", " + (new Date(oMessage.currdelta).toGMTString()));
        // #endif
        var aUndos = model.$at.getDone(oMessage.currdelta),
            i      = 0,
            l      = aUndos.length;
        if (l) {
            for (; i < l; ++i)
                aUndos[i].$dontapply = true;
            model.$at.undo(l);
        }

        xmlNode = this.xpathToXml(q[1], model.data);
        if (xmlNode) {
            var action = q.splice(0, 2)[0];

            // transform xpaths to actual nodes
            if (action == "addChildNode")
                q[2] = this.xpathToXml(q[2], model.data);
            else if (action == "appendChild") {
                //@todo check why there's cleanNode here:
                q[0] = typeof q[0] == "string" ? apf.getXml(q[0]) : q[0];//apf.xmldb.cleanNode(typeof q[0] == "string" ? apf.getXml(q[0]) : q[0]);
                q[1] = q[1] ? this.xpathToXml(q[1], model.data) : null;
            }
            else if (action == "moveNode") {
                q[0] = this.xpathToXml(q[0], model.data);
                q[1] = q[1] ? this.xpathToXml(q[1], model.data) : null;
            }
            else if (action == "replaceNode") {
                q[0] = typeof q[0] == "string" ? apf.getXml(q[0]) : q[0];//apf.xmldb.cleanNode(typeof q[0] == "string" ? apf.getXml(q[0]) : q[0]);
            }
	    else if (action == "setValueByXpath") {}

            q.unshift(xmlNode);
            // pass the action to the actiontracker to execute it
            model.$at.execute({
                action   : action,
                args     : q,
                annotator: sAnnotator,
                message  : oMessage
            });

            this.dispatchEvent("change", {
                resource : model.src,
                model    : model,
                xmlNode  : xmlNode,
                message  : oMessage
            });
        }
        //#ifdef __DEBUG
        else {
            oError = new Error(apf.formatErrorString(0, this,
                "Remote Databinding Received", "Could not get XML node from \
                 model with Xpath '" + q[1] + "'"));
        }
        //#endif

        if (l) {
            model.$at.redo(l);
            for (i = 0; i < l; ++i)
                aUndos[i].$dontapply = false;
        }

        apf.xmldb.disableRDB = disableRDB;

        if (oError)
            throw oError;
    };
    
    this.xmlToXpath = apf.xmlToXpath;
    this.xpathToXml = apf.xpathToXml;
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        //#ifdef __DEBUG
        apf.console.info(this.id
            ? "Creating remote [" + this.id + "]"
            : "Creating implicitly assigned remote");
        //#endif

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
    });

    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        for (var i = 0, l = this.sessions.length; i < l; ++i)
            this.endSession(this.sessions[i].model, this.sessions[i].xpath);
    });
}).call(apf.remote.prototype = new apf.AmlElement());

apf.aml.setElement("remote", apf.remote);

// #endif
