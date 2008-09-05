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

jpf.nameserver = {
    lookup : {},
    
    add : function(type, xmlNode){
        if (!this.lookup[type])
            this.lookup[type] = [];
        
        //#ifdef __DEBUG
        if(this.onchange)
            this.onchange(type, xmlNode);
        //#endif
        
        return this.lookup[type].push(xmlNode) - 1;
    },
    
    register : function(type, id, xmlNode){
        if (!this.lookup[type])
            this.lookup[type] = {};

        //#ifdef __DEBUG
        if (this.onchange)
            this.onchange(type, xmlNode, id);
        //#endif

        return (this.lookup[type][id] = xmlNode);
    },
    
    get : function(type, id){
        return this.lookup[type] ? this.lookup[type][id] : null;
    },
    
    getAll : function(type){
        var name, arr = [];
        for (name in this.lookup[type]) {
            //#ifdef __SUPPORT_Safari_Old
            if (jpf.isSafariOld
              && (!this.lookup[type][name]
              || typeof this.lookup[type][name] != "object"))
                continue;
            //#endif
            arr.push(this.lookup[type][name]);
        }
        return arr;
    }, 
    
    getAllNames : function(type){
        var name, arr = [];
        for (name in this.lookup[type]){
            if (parseInt(name) == name) continue;
            arr.push(name);
        }
        return arr;
    }
}

//#ifdef __WITH_REGISTRY

jpf.registry = jpf.extend({
    put : function(key, value, namespace){
        this.register(namespace, key, value);
    },
    getNamespaces : function(){
        
    },
    getKeys : function(namespace){
        return this.getAllNames(namespace);
    },
    remove : function(key, namespace){
        delete this.lookup[namespace][key];
    },
    clear : function(namespace){
        this.lookup = {}; //@todo
    },
    __export : function(storage){
        var namespace, key;

        for (namespace in this.lookup) {
            for (key in this.lookup[namespace]) {
                storage.put(key, this.lookup[key][namespace], namespace);
            }
        }
    }
}, jpf.nameserver);

jpf.registry.lookup = {};
jpf.registry.get    = function(key, namespace){
    return this.lookup[namespace] ? this.lookup[namespace][key] : null;
};

//#endif