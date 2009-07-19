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
 * Example:
 * Example of the {@link teleport.cgi rpc module with the cgi protocol}.
 * <code>
 *  <a:teleport>
 *      <a:rpc id="comm" protocol="cgi">
 *          <a:method
 *            name    = "searchProduct"
 *            url     = "http://example.com/search.php"
 *            receive = "processSearch">
 *              <a:variable name="search" />
 *              <a:variable name="page" />
 *              <a:variable name="textbanner" value="1" />
 *          </a:method>
 *          <a:method
 *            name = "loadProduct"
 *            url  = "http://example.com/show-product.php">
 *              <a:variable name="id" />
 *              <a:variable name="search_id" />
 *          </a:method>
 *      </a:rpc>
 *  </a:teleport>
 *
 *  <a:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *          alert(data)
 *      }
 *
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </a:script>
 * </code>
 * Example:
 * Example of the {@link teleport.soap rpc module with the soap protocol}.
 * <code>
 *  <a:teleport>
 *      <a:rpc id="comm" 
 *        protocol    = "soap" 
 *        url         = "http://example.com/show-product.php" 
 *        soap-prefix = "m" 
 *        soap-xmlns  = "http://example.com">
 *          <a:method 
 *            name    = "searchProduct" 
 *            receive = "processSearch">
 *              <a:variable name="search" />
 *              <a:variable name="page" />
 *              <a:variable name="textbanner" value="1" />
 *          </a:method>
 *          <a:method 
 *            name = "loadProduct">
 *              <a:variable name="id" />
 *              <a:variable name="search_id" />
 *          </a:method>
 *      </a:rpc>
 *  </a:teleport>
 *
 *  <a:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *          alert(data)
 *      }
 *
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </a:script>
 * </code>
 * Example:
 * Writing to a file with a WebDAV connector
 * <code>
 *  <a:teleport>
 *      <a:webdav id="myWebDAV"
 *        url   = "http://my-webdav-server.com/dav_files/" />
 *  </a:teleport>
 *     
 *  <a:script>
 *      // write the text 'bar' to a file on the server called 'foo.txt'
 *      myWebDAV.write('http://my-webdav-server.com/dav_files/foo.txt', 'bar');
 *  </a:script>
 * </code>
 * Example:
 * XMPP connector with new message notification
 * <code>
 *  <a:teleport>
 *      <a:xmpp id="myXMPP"
 *        url           = "http://my-jabber-server.com:5280/http-bind"
 *        model         = "mdlRoster"
 *        connection    = "bosh"
 *        onreceivechat = "messageReceived(arguments[0].from)" />
 *  </a:teleport>
 *
 *  <a:script>
 *      // This function is called when a message has arrived
 *      function messageReceived(from){
 *          alert('Received message from ' + from);
 *      }
 *
 *      // Send a message to John
 *      myXMPP.sendMessage('john@my-jabber-server.com', 'A test message', '',
 *          apf.xmpp.MSG_CHAT);
 *  </a:script>
 * </code>
 * 
 * @define teleport
 * @addnode global
 * @allowchild {teleport}
 *
 * @default_private
 */
apf.teleport = {
    //#ifdef __WITH_AMLDOM_FULL
    tagName  : "teleport",
    nodeFunc : apf.NODE_HIDDEN,
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
    loadAml: function(x, parentNode){
        this.$aml        = x;
        
        //#ifdef __WITH_AMLDOM_FULL
        this.parentNode = parentNode;
        apf.implement.call(this, apf.AmlDom); /** @inherits apf.AmlDom */
        //#endif
        
        var id, obj, nodes = this.$aml.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1) 
                continue;
            
            obj = new apf.BaseComm(nodes[i]);
            
            if (id = nodes[i].getAttribute("id"))
                apf.setReference(id, obj);
        }
        
        this.loaded = true;

        if (this.onload) 
            this.onload();
        
        return this;
    },
    
    availHTTP  : [],
    releaseHTTP: function(http){
        if (apf.brokenHttpAbort) 
            return;
        if (self.XMLHttpRequestUnSafe && http.constructor == XMLHttpRequestUnSafe) 
            return;
        
        http.onreadystatechange = function(){};
        http.abort();
        this.availHTTP.push(http);
    },
    
    destroy: function(){
        //#ifdef __DEBUG
        apf.console.info("Cleaning teleport");
        //#endif
        
        for (var i = 0; i < this.availHTTP.length; i++)
            this.availHTTP[i] = null;
        
        this.availHTTP.length = 0;
    }
};

/**
 * @constructor
 * @baseclass
 * @private
 */
apf.BaseComm = function(x){
    apf.makeClass(this);
    this.uniqueId = apf.all.push(this) - 1;
    this.$aml      = x;
    
    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[Ajax.org Teleport Component : " + (this.name || "")
            + " (" + this.type + ")]";
    }
    
    if (this.$aml) {
        this.name = x.getAttribute("id");
        this.type = x[apf.TAGNAME];
        
        // Implement the specified baseclass
        if (!apf[this.type]) 
            throw new Error(apf.formatErrorString(1023, null, "Teleport baseclass", "Could not find Ajax.org Teleport Component '" + this.type + "'", this.$aml));
        
        this.implement(apf[this.type]);
        if (this.useHTTP) {
            // Implement HTTP Module
            if (!apf.http) 
                throw new Error(apf.formatErrorString(1024, null, "Teleport baseclass", "Could not find Ajax.org Teleport HTTP Component", this.$aml));
            this.implement(apf.http);
        }
        
        if (this.$aml.getAttribute("protocol")) {
            // Implement Module
            var proto = this.$aml.getAttribute("protocol").toLowerCase();
            if (!apf[proto]) 
                throw new Error(apf.formatErrorString(1025, null, "Teleport baseclass", "Could not find Ajax.org Teleport RPC Component '" + proto + "'", this.$aml));
            this.implement(apf[proto]);
        }
    }
    
    // Load Comm definition
    if (this.$aml) 
        this.load(this.$aml);
};

// #endif

apf.Init.run('Teleport');
