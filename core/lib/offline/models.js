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

// #ifdef __WITH_OFFLINE_MODEL

/**
 * Object dealing with the storing the state of models for use offline. In
 * most cases the functionality of this object will be managed from within the
 * offline element in JML.
 * Example:
 * <pre class="code">
 *  <j:offline realtime="true" />
 * </pre>
 *
 * @define offline
 * @attribute {Boolean} [realtime]  whether changes are stored realtime.
 *
 * @default_private
 */
jpf.namespace("offline.models", {
    enabled   : false,
    timer     : null,
    models    : {},
    initQueue : [],
    realtime  : true,

    init      : function(jml){
        this.namespace = jpf.appsettings.name + ".jpf.offline.models";

        if (jml.nodeType && jml.getAttribute("realtime"))
            this.realtime = !jpf.isFalse(jml.getAttribute("realtime"));

        if (!this.realtime) {
            jpf.addEventListener("exit", function(){
                jpf.offline.models.search();
            });
        }

        //@todo what to do if we're not realtime

        this.enabled = true;
    },

    markForUpdate : function(model){
       this.models[model.uniqueId] = model;

        if(!this.timer){
            var _self = this;
            this.timer = setTimeout(function(){
                _self.timer = null;
                var models  = _self.models;

                for (var mId in models) {
                    _self.updateModel(models[mId]);
                }

                _self.models = {};
            }, 2000);
        }
    },

    clear : function(){
        jpf.offline.storage.clear(this.namespace);
    },

    removeModel : function(model){
        var name = model.name || model.uniqueId + ".model";

        //Remove recorded data of this model
        jpf.offline.storage.remove(name, this.namespace);

        //Remove the model from the init queue
        this.initQueue.remove(model);
    },

    updateModel : function(model){
        var name = model.name || model.uniqueId + ".model";

        //#ifdef __DEBUG
        jpf.console.info("Updating model '" + name + "'");
        //#endif

        /*
            This could be optimized by only recording the changes to the
            data. At load/exit these could be purged.
        */

        var docId = model.data.getAttribute(jpf.xmldb.xmlDocTag);
        model.data.setAttribute(jpf.xmldb.xmlDocTag + "_length",
            jpf.xmldb.nodeCount[docId]);

        jpf.offline.storage.put(name, model.data.xml || model.data.serialize(), this.namespace);
    },

    loadModel : function(model){
        var name = model.name || model.uniqueId + ".model";

        var data = jpf.offline.storage.get(name, this.namespace);
        if (!data) return false;

        //#ifdef __DEBUG
        jpf.console.info("Loading model '" + name + "' from local storage");
        //#endif

        var xmlNode = jpf.getXmlDom(data).documentElement;
        var docId   = xmlNode.getAttribute(jpf.xmldb.xmlDocTag);
        jpf.xmldb.nodeCount[docId]
            = parseInt(xmlNode.getAttribute(jpf.xmldb.xmlDocTag + "_length"));

        model.load(xmlNode);
        return true;
    },

    search : function(){
        //Save all the models

        var done = {}, models = jpf.nameserver.getAll("model");
        for (var i = 0; i < models.length; i++) {
            if (done[models[i].uniqueId])
                continue;

            done[models[i].uniqueId] = true;
            this.updateModel(models[i]);
        }

        return true;
    },

    addToInitQueue : function(model){
        this.initQueue.pushUnique(model);
        model.session = false;
    },

    stopSync : function(callback){
        //No stopping here.. the queue will fill itself automatically
        callback();
    },

    getSyncLength : function(){
        return this.initQueue.length;
    },

    sync : function(callback){
        //We assume we're online now, but just in case we clear the queue
        var queue = this.initQueue.slice();
        this.initQueue.length = 0;

        var qNr = 0, len = queue.length;
        for (var i = 0; i < queue.length; i++) {
            queue[i].init(function(){
                callback({
                    position : ++qNr,
                    length   : len
                });

                if(qNr == len - 1)
                    callback({finished: true});
            });
        }
    }
});

// #endif
