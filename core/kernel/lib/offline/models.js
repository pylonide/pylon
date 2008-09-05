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

jpf.offline.models = {
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
            jpf.addEventListener("onexit", function(){
                jpf.offline.models.search();
            });
        }
        
        this.enabled = true;
    },
    
    markForUpdate : function(model){
        models[model.uniqueId] = model;

        if(!this.timer){
            var _self = this;
            this.timer = setTimeout(function(){
                _self.timer = null;
                var models  = _self.models;
                
                for (var mId in models) {
                    _self.updateModel(models[mId]);
                }
                
                _self.models = {};
            });
        }
    },
    
    removeModel : function(model){
        if (!model.name) //temporary workaround... should be fixed neatly
            return;
            
        //Remove recorded data of this model
        jpf.offline.storage.remove(model.name, this.namespace);
        
        //Remove the model from the init queue
        this.initQueue.remove(model);
    },
    
    updateModel : function(model){
        if (!model.name) //temporary workaround... should be fixed neatly
            return;
        
        /*
            This could be optimized by only recording the changes to the
            data. At load/exit these could be purged.
        */
        jpf.offline.storage.put(model.name, model.getXml(), this.namespace);
    },
    
    loadModel : function(model){
        if (!model.name) //temporary workaround... should be fixed neatly
            return false;
        
        var data = jpf.offline.storage.get(model.name, this.namespace);
        if (!data) return false;
        
        model.load(data);
        return true;
    },
    
    search : function(){
        //Save all the models
        
        var models = jpf.nameserver.getAll("models");
        for (var i = 0; i < models.length; i++) {
            this.updateModel(models[mId]);
        }
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
}

// #endif
