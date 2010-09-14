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

// #ifdef __AMLTELEPORT

/**
 * Element which specifies the ways the application can communicate to remote
 * data sources.
 * Example:
 * Example of the {@link teleport.cgi rpc module with the cgi protocol}.
 * <code>
 *  <a:rpc id="comm" protocol="cgi">
 *      <a:method
 *        name    = "searchProduct"
 *        url     = "http://example.com/search.php"
 *        receive = "processSearch">
 *          <a:param name="search" />
 *          <a:param name="page" />
 *          <a:param name="textbanner" value="1" />
 *      </a:method>
 *      <a:method
 *        name = "loadProduct"
 *        url  = "http://example.com/show-product.php">
 *          <a:param name="id" />
 *          <a:param name="search_id" />
 *      </a:method>
 *  </a:rpc>
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
 *  <a:rpc id="comm" 
 *    protocol    = "soap" 
 *    url         = "http://example.com/show-product.php" 
 *    soap-prefix = "m" 
 *    soap-xmlns  = "http://example.com">
 *      <a:method 
 *        name    = "searchProduct" 
 *        receive = "processSearch">
 *          <a:param name="search" />
 *          <a:param name="page" />
 *          <a:param name="textbanner" value="1" />
 *      </a:method>
 *      <a:method 
 *        name = "loadProduct">
 *          <a:param name="id" />
 *          <a:param name="search_id" />
 *      </a:method>
 *  </a:rpc>
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
 *   <a:webdav id="myWebDAV"
 *    url   = "http://my-webdav-server.com/dav_files/" />
 *     
 *  <a:script>
 *      // write the text 'bar' to a file on the server called 'foo.txt'
 *      myWebDAV.write('http://my-webdav-server.com/dav_files/foo.txt', 'bar');
 *  </a:script>
 * </code>
 * Example:
 * XMPP connector with new message notification
 * <code>
 *  <a:xmpp id="myXMPP"
 *    url           = "http://my-jabber-server.com:5280/http-bind"
 *    model         = "mdlRoster"
 *    connection    = "bosh"
 *    onreceivechat = "messageReceived(arguments[0].from)" />
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
 * @attribute {String}  url              the location of the server that is
 *                                       recipient of the rpc messages.
 * @attribute {String}  [route-server]   String specifying the url to the route script.
 *                                       Remarks:
 *                                       The route script will receive the route information in 3 extra headers:
 *                                           X-Route-Request     - Containing the destination url.<br />
 *                                           X-Proxy-Request     - Containing the destination url.<br />
 *                                           X-Compress-Response - Set to 'gzip'.<br />
 * @attribute {Boolean} [autoroute]      whether the call should be routed
 *                                       through a proxy when a permission
 *                                       error occurs due to the same domein policy.
 * @attribute {Number}  [timeout]        the number of milliseconds after
 *                                       which the call is considered timed out.
 *
 * 
 * @define teleport
 * @addnode global
 * @allowchild {teleport}
 *
 * @default_private
 */
apf.Teleport = function(){
    this.$init(true);
};

apf.__TELEPORT__ = 1 << 28;

(function() {
    this.$parsePrio = "002";
    
    this.$regbase = this.$regbase | apf.__TELEPORT__;

    this.$booleanProperties["autoroute"] = true;
    
    this.$supportedProperties.push("url", "timeout", "protocol", "route-server",
        "autoroute");

    this.$propHandlers["url"] = function(value) {
        var url = new apf.url(value);

        // do some extra startup/ syntax error checking
        if (!url.protocol) {
            return apf.console.error(apf.formatErrorString(0, this,
                "Communication (Teleport) initialization error",
                "Invalid server url provided: '" + value + "'"));
        }

        this.$host     = url.host;
        this.$rootPath = url.path;
        this.$server   = value.replace(new RegExp(this.$rootPath + "$"), "");
    };

    this.$propHandlers["timeout"] = function(value) {
        this.timeout = parseInt(value) || 10000;
    };

    this.$propHandlers["protocol"] = function(value) {
        var proto = value.toLowerCase();
        if (!apf[proto]) {
            throw new Error(apf.formatErrorString(1025, null, "Teleport baseclass",
                "Could not find Ajax.org Teleport RPC Component '" + proto + "'", this));
        }
        this.implement(apf[proto]);
    };
    
    /**
     * Returns a string representation of this object.
     */
    this.toString = function(){
        return "[Ajax.org Teleport Component : " + (this.name || "")
            + " (" + this.type + ")]";
    };

    this.addEventListener("DOMNodeInsertedIntoDocument", function() {
        var error;
        if (this.type && this.type == "socket") {
            // Implement Socket Module
            if (!apf.socket)
                error = "Socket";
            else
                this.implement(apf.socket);
        }
        else {
            // Implement HTTP Module
            if (!apf.http)
                error = "HTTP";
            else
                this.implement(apf.http);
        }
        if (error) {
            throw new Error(apf.formatErrorString(1024, null, "Teleport baseclass", 
                    "Could not find Ajax.org Teleport " + error + " Component", this.$aml));
        }

        if (this.id)
            apf.$asyncObjects[this.id] = 1;
    });
}).call(apf.Teleport.prototype = new apf.AmlElement());

//#ifdef __DEBUG
apf.teleportLog = function(extra){
    var xml, request = extra.method + " " + extra.url + " HTTP/1.1\n\n" + extra.data;

    this.setXml = function(pNode){
        if (!xml) {
            var doc = pNode.ownerDocument;
            xml = doc.createElement(extra.tp.localName || extra.type || "http");
            xml.appendChild(doc.createElement("request")).appendChild(doc.createTextNode(request || "-"));
            xml.appendChild(doc.createElement("response")).appendChild(doc.createTextNode(response || "-"));
        }

        apf.xmldb.appendChild(pNode, xml);
    }

    this.request = function(headers){
        request = request.replace(/\n\n/, "\n" + headers.join("\n") + "\n\n");

        if (xml)
            apf.setQueryValue(xml, "request/text()", request);

        this.request = function(){}
    }

    var response = "";
    this.response = function(extra){
        try {
            var headers = extra.http.getAllResponseHeaders();
            response = "HTTP/1.1 " + extra.status + " " + extra.statusText + "\n"
                + (headers ? headers + "\n" : "\n")
                + extra.http.responseText;

            if (xml)
                apf.setQueryValue(xml, "response/text()", response);
        } catch(ex) {}
    }
}
//#endif

// #endif

apf.Init.run("teleport");
