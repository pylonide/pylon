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
 *  <j:teleport>
 *      <j:rpc id="comm" protocol="cgi">
 *          <j:method
 *            name    = "searchProduct"
 *            url     = "http://example.com/search.php"
 *            receive = "processSearch">
 *              <j:variable name="search" />
 *              <j:variable name="page" />
 *              <j:variable name="textbanner" value="1" />
 *          </j:method>
 *          <j:method
 *            name = "loadProduct"
 *            url  = "http://example.com/show-product.php">
 *              <j:variable name="id" />
 *              <j:variable name="search_id" />
 *          </j:method>
 *      </j:rpc>
 *  </j:teleport>
 *
 *  <j:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *          alert(data)
 *      }
 *
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </j:script>
 * </code>
 * Example:
 * Example of the {@link teleport.soap rpc module with the soap protocol}.
 * <code>
 *  <j:teleport>
 *      <j:rpc id="comm" 
 *        protocol    = "soap" 
 *        url         = "http://example.com/show-product.php" 
 *        soap-prefix = "m" 
 *        soap-xmlns  = "http://example.com">
 *          <j:method 
 *            name    = "searchProduct" 
 *            receive = "processSearch">
 *              <j:variable name="search" />
 *              <j:variable name="page" />
 *              <j:variable name="textbanner" value="1" />
 *          </j:method>
 *          <j:method 
 *            name = "loadProduct">
 *              <j:variable name="id" />
 *              <j:variable name="search_id" />
 *          </j:method>
 *      </j:rpc>
 *  </j:teleport>
 *
 *  <j:script>
 *      //This function is called when the search returns
 *      function processSearch(data, state, extra){
 *          alert(data)
 *      }
 *
 *      //Execute a search for the product car
 *      comm.searchProduct('car', 10);
 *  </j:script>
 * </code>
 * Example:
 * Writing to a file with a WebDAV connector
 * <code>
 *  <j:teleport>
 *      <j:webdav id="myWebDAV"
 *        url   = "http://my-webdav-server.com/dav_files/" />
 *  </j:teleport>
 *     
 *  <j:script>
 *      // write the text 'bar' to a file on the server called 'foo.txt'
 *      myWebDAV.write('http://my-webdav-server.com/dav_files/foo.txt', 'bar');
 *  </j:script>
 * </code>
 * Example:
 * XMPP connector with new message notification
 * <code>
 *  <j:teleport>
 *      <j:xmpp id="myXMPP"
 *        url           = "http://my-jabber-server.com:5280/http-bind"
 *        model         = "mdlRoster"
 *        connection    = "bosh"
 *        onreceivechat = "messageReceived(arguments[0].from)" />
 *  </j:teleport>
 *
 *  <j:script>
 *      // This function is called when a message has arrived
 *      function messageReceived(from){
 *          alert('Received message from ' + from);
 *      }
 *
 *      // Send a message to John
 *      myXMPP.sendMessage('john@my-jabber-server.com', 'A test message', '',
 *          jpf.xmpp.MSG_CHAT);
 *  </j:script>
 * </code>
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
        jpf.implement.call(this, jpf.JmlDom); /** @inherits jpf.JmlDom */
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
        
        // Implement the specified baseclass
        if (!jpf[this.type]) 
            throw new Error(jpf.formatErrorString(1023, null, "Teleport baseclass", "Could not find Javeline Teleport Component '" + this.type + "'", this.$jml));
        
        this.implement(jpf[this.type]);
        if (this.useHTTP) {
            // Implement HTTP Module
            if (!jpf.http) 
                throw new Error(jpf.formatErrorString(1024, null, "Teleport baseclass", "Could not find Javeline Teleport HTTP Component", this.$jml));
            this.implement(jpf.http);
        }
        
        if (this.$jml.getAttribute("protocol")) {
            // Implement Module
            var proto = this.$jml.getAttribute("protocol").toLowerCase();
            if (!jpf[proto]) 
                throw new Error(jpf.formatErrorString(1025, null, "Teleport baseclass", "Could not find Javeline Teleport RPC Component '" + proto + "'", this.$jml));
            this.implement(jpf[proto]);
        }
    }
    
    // Load Comm definition
    if (this.$jml) 
        this.load(this.$jml);
};

// #endif

jpf.Init.run('Teleport');
