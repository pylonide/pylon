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

jpf.SUCCESS = 1;
jpf.TIMEOUT = 2;
jpf.ERROR   = 3;
//#ifdef __WITH_OFFLINE
jpf.OFFLINE = 4;
//#endif

// #ifdef __WITH_TELEPORT

/**
 * @define teleport
 * @allowchild  rpc, poll, socket
 */
jpf.teleport = {
    //#ifdef __WITH_DOM_COMPLETE
    tagName  : "teleport",
    nodeType : jpf.NOGUI_NODE,
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
    
    // Set Communication
    Init: function(){
        this.inited = true;
        
        var comdef = document.documentElement.getElementsByTagName("head")[0]
            .getElementsByTagName(IS_IE ? "teleport" : "j:teleport")[0];
        if (!comdef && document.documentElement.getElementsByTagNameNS) 
            comdef = document.documentElement.getElementsByTagNameNS("http://javeline.nl/j", "j:teleport")[0];
        if (!comdef) {
            this.isInited = true;
            return issueWarning(1006, "Could not find Javeline Teleport Definition")
        }
        if (comdef.getAttribute("src")) {
            new HTTP().getXml(HOST_PATH + comdef.getAttribute("src"),
                function(xmlNode, state, extra){
                    if (state != jpf.SUCCESS) {
                        if (extra.retries < MAX_RETRIES) 
                            return HTTP.retry(extra.id);
                        else 
                            throw new Error(jpf.formErrrorString(1021, null, "Application", "Could not load Javeline Teleport Definition:\n\n" + extra.message));
                    }
                    
                    jpf.teleport.xml      = xmlNode;
                    jpf.teleport.isInited = true;
                    
                    //if(self.PACKAGED) jpf.teleport.load();
                }, true);
        }
        else {
            var xmlNode = comdef.firstChild
                ? jpf.xmldb.getDataIsland(comdef.firstChild)
                : null;
            
            jpf.teleport.xml      = xmlNode;
            jpf.teleport.isInited = true;
            
            //if(self.PACKAGED) jpf.teleport.load();
        }
    },
    
    // Load Teleport Definition
    loadJml: function(x, parentNode){
        this.jml        = x;
        
        //#ifdef __WITH_DOM_COMPLETE
        this.parentNode = parentNode;
        jpf.inherit.call(this, jpf.JmlDomApi); /** @inherits jpf.JmlDomApi */
        //#endif
        
        var nodes = this.jml.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) 
                continue;
            
            tagName = nodes[i][jpf.TAGNAME];
            
            //@todo make socket and poll basecomm nodes
            switch(tagName){
                case "socket": //Socket Communication
                    jpf.setReference(nodes[i].getAttribute("id"), new jpf.socket()).load(nodes[i]);
                    break;
                case "poll": //Polling Engine
                    jpf.setReference(nodes[i].getAttribute("id"), new jpf.poll().load(nodes[i]));
                    break;
                default:
                    jpf.setReference(nodes[i].getAttribute("id"), new jpf.BaseComm(nodes[i]));
            }
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
}

/**
 * @constructor
 * @baseclass
 */
jpf.BaseComm = function(x){
    jpf.makeClass(this);
    this.uniqueId = jpf.all.push(this) - 1;
    this.jml      = x;
    
    this.toString = function(){
        return "[Javeline Teleport Component : " + (this.name || "")
            + " (" + this.type + ")]";
    }
    
    if (this.jml) {
        this.name = x.getAttribute("id");
        this.type = x[jpf.TAGNAME];
        
        // Inherit from the specified baseclass
        if (!jpf[this.type]) 
            throw new Error(jpf.formatErrorString(1023, null, "Teleport baseclass", "Could not find Javeline Teleport Component '" + this.type + "'", this.jml));
        
        this.inherit(jpf[this.type]); /** @inherits jpf[this.type] */
        if (this.useHTTP) {
            // Inherit from HTTP Module
            if (!jpf.http) 
                throw new Error(jpf.formatErrorString(1024, null, "Teleport baseclass", "Could not find Javeline Teleport HTTP Component", this.jml));
            this.inherit(jpf.http); /** @inherits jpf.http */
        }
        
        if (this.jml.getAttribute("protocol")) {
            // Inherit from Module
            var proto = this.jml.getAttribute("protocol").toLowerCase();
            if (!jpf[proto]) 
                throw new Error(jpf.formatErrorString(1025, null, "Teleport baseclass", "Could not find Javeline Teleport RPC Component '" + proto + "'", this.jml));
            this.inherit(jpf[proto]); /** @inherits jpf[proto] */
        }
    }
    
    // Load Comm definition
    if (this.jml) 
        this.load(this.jml);
}

// #endif

jpf.Init.run('Teleport');
