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

// #ifdef __WITH_TELEPORT

/**
 * Element which specifies the ways the application can communicate to remote
 * data sources.
 * 
 * @define teleport
 * @addnode global
 * @allowchild {teleport}
 *
 * @default_private
 */
jpf.teleport = {
    //#ifdef __WITH_JMLDOM_FULL
    tagName  : "teleport",
    nodeFunc : jpf.NODE_HIDDEN,
    //#endif
    
    modules: new Array(),
    named: {},
    
    register: function(obj){
        var id = false, data = {
            obj: obj
        };
        
        return this.modules.push(data) - 1;
    },
    
    getModules: function(){
        return this.modules;
    },
    
    getModuleByName: function(defname){
        return this.named[defname]
    },
    
    // Load Teleport Definition
    loadJml: function(x, parentNode){
        this.$jml        = x;
        
        //#ifdef __WITH_JMLDOM_FULL
        this.parentNode = parentNode;
        jpf.inherit.call(this, jpf.JmlDom); /** @inherits jpf.JmlDom */
        //#endif
        
        var id, obj, nodes = this.$jml.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) 
                continue;
            
            obj = new jpf.BaseComm(nodes[i]);
            
            if (id = nodes[i].getAttribute("id"))
                jpf.setReference(id, obj);
        }
        
        this.loaded = true;

        if (this.onload) 
            this.onload();
        
        return this;
    },
    
    availHTTP  : [],
    releaseHTTP: function(http){
        if (jpf.brokenHttpAbort) 
            return;
        if (self.XMLHttpRequestUnSafe && http.constructor == XMLHttpRequestUnSafe) 
            return;
        
        http.onreadystatechange = function(){};
        http.abort();
        this.availHTTP.push(http);
    },
    
    destroy: function(){
        //#ifdef __DEBUG
        jpf.console.info("Cleaning teleport");
        //#endif
        
        for (var i = 0; i < this.availHTTP.length; i++) {
            this.availHTTP[i] = null;
        }
    }
};

/**
 * @constructor
 * @baseclass
 * @private
 */
jpf.BaseComm = function(x){
    jpf.makeClass(this);
    this.uniqueId = jpf.all.push(this) - 1;
    this.$jml      = x;
    
    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[Javeline Teleport Component : " + (this.name || "")
            + " (" + this.type + ")]";
    }
    
    if (this.$jml) {
        this.name = x.getAttribute("id");
        this.type = x[jpf.TAGNAME];
        
        // Inherit from the specified baseclass
        if (!jpf[this.type]) 
            throw new Error(jpf.formatErrorString(1023, null, "Teleport baseclass", "Could not find Javeline Teleport Component '" + this.type + "'", this.$jml));
        
        this.inherit(jpf[this.type]);
        if (this.useHTTP) {
            // Inherit from HTTP Module
            if (!jpf.http) 
                throw new Error(jpf.formatErrorString(1024, null, "Teleport baseclass", "Could not find Javeline Teleport HTTP Component", this.$jml));
            this.inherit(jpf.http);
        }
        
        if (this.$jml.getAttribute("protocol")) {
            // Inherit from Module
            var proto = this.$jml.getAttribute("protocol").toLowerCase();
            if (!jpf[proto]) 
                throw new Error(jpf.formatErrorString(1025, null, "Teleport baseclass", "Could not find Javeline Teleport RPC Component '" + proto + "'", this.$jml));
            this.inherit(jpf[proto]);
        }
    }
    
    // Load Comm definition
    if (this.$jml) 
        this.load(this.$jml);
};

// #endif

jpf.Init.run('Teleport');
