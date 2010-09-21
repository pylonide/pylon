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

// #ifdef __WITH_ACTIONTRACKER

/**
 * UndoData is the command object for the actiontracker. Each instance of this class
 * contains information about a single event in the application. It can be undone
 * and it knows how to synchronize the change to a (remote) data source.
 *
 * @constructor
 * @default_private
 */
apf.UndoData = function(settings, at){
    this.localName = "UndoData";
    this.extra     = {};
    //#ifdef __WITH_RDB
    this.rdbQueue  = {};
    //#endif
    apf.extend(this, settings);

    if (!this.timestamp)
        this.timestamp = (new Date()).getUTCTime();

    if (at)
        this.at = at;
    //Copy Constructor
    else if (settings && settings.tagName == "UndoData") {
        this.args    = settings.args.slice();
        //#ifdef __WITH_RDB
        this.rdbArgs = settings.rdbArgs.slice();
        //#endif
    }
    //Constructor
    else {
        /*
            @todo: Please check the requirement for this and how to solve
            this. Goes wrong with multiselected actions!
        */
        this.selNode = this.selNode || (this.action == "removeNode"
            ? this.args[0]
            : (this.amlNode
                ? this.amlNode.selected
                : null));
    }

    var options, _self = this;

    // #ifdef __WITH_OFFLINE_TRANSACTIONS
    var serialState;
    this.$export = function(){
        if (serialState) //Caching
            return serialState;

        serialState = {
            action    : this.action,
            //#ifdef __WITH_RDB
            rdbModel  : this.rdbModel ? this.rdbModel.name : null,
            rdbQueue  : this.rdbQueue,
            //#endif
            at        : this.at.name,
            timestamp : this.timestamp,
            parsed    : options ? options.parsed : null, //errors when options is not defined
            userdata  : options ? options.userdata : null,
            extra     : {}
        };

        //#ifdef __WITH_RDB
        //this can be optimized
        var rdb = this.rdbModel
            ? this.rdbModel.rdb
            : apf.remote;
        //#endif

        //Record arguments
        var sLookup = (typeof apf.offline != "undefined" && apf.offline.sLookup)
            ? apf.offline.sLookup
            : (apf.offline.sLookup = {});
        if (!sLookup.count) sLookup.count = 0;
        var xmlNode, xmlId, args = this.args.slice();

        for (var i = 0; i < args.length; i++) {
            if (args[i] && args[i].nodeType) {
                if (!serialState.argsModel) {
                    //#ifdef __WITH_NAMESERVER
                    var model = apf.nameserver.get("model",
                        apf.xmldb.getXmlDocId(args[i]));

                    if(model)
                        serialState.argsModel = model.name || model.$uniqueId;
                    //#endif
                }

                args[i] = serializeNode(args[i]);
            }
        }

        var item, name;
        for (name in this.extra) {
            item = this.extra[name];
            serialState.extra[name] = item && item.nodeType
                ? serializeNode(item)
                : item;
        }

        //check this state and the unserialize function state and check the args and extra props
        serialState.args = args;

        //#ifdef __DEBUG
        if (!serialState.argsModel)
            apf.console.warn("Could not determine model for serialization \
                of undo state. Will not be able to undo the state when the \
                server errors. This creates a potential risk of loosing \
                all changes on sync!")
        //#endif

        return serialState;

        function serializeNode(xmlNode){
            /*
                If it's an attribute or directly connected to the root of the
                model we'll just record the xpath
            */
            if (xmlNode.nodeType == 2
              || apf.isChildOf(model.data, xmlNode, true)) {
                xmlId = xmlNode.getAttribute(apf.xmldb.xmlIdTag);
                return {
                    xpath  : rdb.xmlToXpath(xmlNode, model.data, true),
                    lookup : xmlId
                };
            }
            // So we've got a disconnected branch, lets serialize it
            else {
                var contextNode = xmlNode;
                while (contextNode.parentNode && contextNode.parentNode.nodeType == 1) //find topmost parent
                    contextNode = xmlNode.parentNode;

                xmlId = contextNode.getAttribute(apf.xmldb.xmlIdTag);
                if (!xmlId) {
                    xmlId = "serialize" + sLookup.count++;
                    contextNode.setAttribute(apf.xmldb.xmlIdTag, xmlId);
                }

                var obj = {
                    xpath  : rdb.xmlToXpath(xmlNode, contextNode, true),
                    lookup : xmlId
                }

                if (!sLookup[xmlId]) {
                    contextNode.setAttribute(apf.xmldb.xmlDocTag,
                        apf.xmldb.getXmlDocId(contextNode));

                    sLookup[xmlId] = contextNode;
                    obj.xml        = contextNode.xml || contextNode.serialize();
                }

                return obj;
            }
        }
    };

    this.$import = function(){
        //#ifdef __WITH_NAMESERVER
        //#ifdef __WITH_RDB
        if (this.rdbModel)
            this.rdbModel = apf.nameserver.get("model", this.rdbModel);
        //#endif
        //#endif

        if (this.argsModel) {
            //#ifdef __WITH_NAMESERVER
            var model = apf.nameserver.get("model", this.argsModel)
                || apf.lookup(this.argsModel);

            //Record arguments
            var sLookup =  (typeof apf.offline != "undefined" && apf.offline.sLookup)
                ? apf.offline.sLookup
                : (apf.offline.sLookup = {});
            if (!sLookup.count) sLookup.count = 0;

            var args = this.args,
                //#ifdef __WITH_RDB
                rdb  = this.rdbModel
                    ? this.rdbModel.rdb
                    : apf.remote,
                //#endif
                xmlNode, i, l, item, name;

            for (i = 0, l = args.length; i < l; i++) {
                if (args[i] && args[i].xpath)
                    args[i] = unserializeNode(args[i], model);
            }

            for (name in this.extra) {
                item = this.extra[name];
                if (item && item.xpath)
                    this.extra[name] = unserializeNode(item, model);
            }

            this.args = args;
            //#endif
        }

        options = {
            undoObj   : this,
            userdata  : this.userdata,
            parsed    : this.parsed
        }

        //#ifdef __WITH_LOCKING
        if (this.timestamp) {
            options.actionstart = this.timestamp;
            options.headers     = {"X-APF-ActionStart": this.timestamp};
        }
        //#endif

        return this;

        function unserializeNode(xmlSerial, model){
            if (xmlSerial.xml) {
                xmlNode = apf.xmldb.getXml(xmlSerial.xml);
                sLookup[xmlNode.getAttribute(apf.xmldb.xmlIdTag)] = xmlNode;
            }
            else if (xmlSerial.lookup) {
                xmlNode = sLookup[xmlSerial.lookup];

                //#ifdef __DEBUG
                if (!xmlSerial.xpath) //@todo
                    throw new Error("Serialization error");
                //#endif
            }
            else
                xmlNode = null;

            return rdb.xpathToXml(xmlSerial.xpath, xmlNode || model.data);
        }
    };
    //#endif

    //#ifdef __WITH_RDB
    //Send RDB Message..
    this.processRsbQueue = function(){
        if (this.rdbModel)
            this.rdbModel.rdb.$processQueue(this);
    };

    this.clearRsbQueue = function(){
        this.rdbQueue =
        this.rdbModel = null;
    };
    //#endif

    /**
     * Save the change to a data source.
     * @param {Boolean} undo whether the change is undone.
     */
    this.saveChange = function(undo, at, callback){
        //Grouped undo/redo support
        if (this.action == "group") {
            var rpcNodes = this.args[1];
            at.$addToQueue(rpcNodes, undo, true);
            return at.$queueNext(this);
        }

        var dataInstruction;
        if (this.xmlActionNode) {
            dataInstruction = this.xmlActionNode.getAttribute(undo ? "undo" : "set");
            if (undo && !dataInstruction)
                dataInstruction = this.xmlActionNode.getAttribute("set");
        }

        if (!dataInstruction) {
            //#ifdef __WITH_RDB
            this.processRsbQueue();
            //#endif
            return at.$queueNext(this);
        }

        this.state = undo ? "restoring" : "saving";

        if (!options.asyncs) { //Precall didnt contain any async calls
            return at.$receive(null, apf.SUCCESS, {amlNode: this.amlNode},
                this, callback);
        }

        options.ignoreOffline = true;
        apf.saveData(dataInstruction, options);
    };

    this.preparse = function(undo, at, multicall, callback){
        var dataInstruction;
        if (this.xmlActionNode) {
            dataInstruction = this.xmlActionNode.getAttribute(undo ? "undo" : "set");
            if (undo && !dataInstruction)
                dataInstruction = this.xmlActionNode.getAttribute("set");
        }

        if (!dataInstruction)
            return this;

        options = apf.extend({
            xmlNode   : this.action == "multicall"
              ? this.args[0].xmlNode
              : this.selNode || this.xmlNode,
            userdata  : apf.isTrue(this.xmlActionNode.getAttribute("ignore-fail")),
            multicall : multicall,
            undo      : undo,
            precall   : true,

            //Callback is only for async calls
            callback  : function(data, state, extra){
                if (options.asyncs) { //Set by apf.saveData
                    extra.amlNode = _self.amlNode;
                    return at.$receive(data, state, extra, _self, callback);
                }
            }
        }, this.extra);

        //#ifdef __WITH_LOCKING
        if (this.timestamp) {
            options.actionstart = this.timestamp;
            options.headers     = {"X-JPF-ActionStart": this.timestamp};
        }
        //#endif

        apf.saveData(dataInstruction, options); //@todo please check if at the right time selNode is set

        return this;
    };
};
/* #elseif __WITH_DATAACTION
apf.actiontracker = function(){
    this.execute = function(){
        //Execute action
        var UndoObj = new apf.UndoData();
        if (options.action)
            apf.actiontracker.actions[options.action](UndoObj, false, this);
        return UndoObj;
    };

    this.reset = function(){}
}

apf.UndoData = function(){
    this.localName = "UndoData";
    this.extra   = {};
}
#endif */