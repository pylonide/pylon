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

// #ifdef __TP_RPC_CGI
// #define __TP_RPC 1

/**
 * Implementation of the Common Gateway Interface (CGI) as a module for the RPC
 * plugin of apf.teleport.
 * Example:
 * Ajax.org Markup Language
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
 * Remarks:
 * Calls can be made to a server using cgi variables with a special {@link term.datainstruction data instruction}
 * format.
 * <code>
 *  get="url:http://www.bla.nl?blah=10&foo={@bar}&example=[10+5]"
 *  set="url.post:http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
 * </code>
 *
 * @addenum rpc[@protocol]:cgi
 *
 * @constructor
 *
 * @inherits apf.Class
 * @inherits apf.BaseComm
 * @inherits apf.http
 * @inherits apf.rpc
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @default_private
 */
apf.cgi = function(){
    this.supportMulticall = false;
    this.namedArguments   = true;

    // Register Communication Module
    apf.teleport.register(this);

    // Stand Alone
    if (!this.uniqueId) {
        apf.makeClass(this);
        this.implement(apf.BaseComm, apf.http, apf.rpc);
    }

    this.unserialize = function(str){
        return str;
    };

    this.getSingleCall = function(name, args, obj){
        obj.push(args);
    };

    // Create message to send
    this.serialize = function(functionName, args){
        var prop, vars    = [];

        function recur(o, stack){
            if (o && o.dataType == "array") {
                for (var j = 0; j < o.length; j++)
                    recur(o[j], stack + "%5B" + j + "%5D");//" + j + "
            }
            else if (typeof o == "object") {
                for (prop in o) {
                    //#ifdef __SUPPORT_SAFARI2
                    if (apf.isSafariOld && (!o[prop] || typeof p[prop] != "object"))
                        continue;
                    //#endif

                    if (typeof o[prop] == "function")
                        continue;
                    recur(o[prop], stack + "%5B" + encodeURIComponent(prop) + "%5D");
                }
            }
            else {
                if (typeof o != "undefined" && o !== null) 
                    vars.push(stack + "=" + encodeURIComponent(o));
            }
        };

        if (this.multicall) {
            vars.push("func" + "=" + this.mcallname);
            for (var i = 0; i < args[0].length; i++)
                recur(args[0][i], "f%5B" + i + "%5D");
        }
        else {
            for (prop in args) {
                //#ifdef __SUPPORT_SAFARI2
                if (apf.isSafariOld && (!args[prop] || typeof args[prop] == "function"))
                    continue;
                //#endif

                recur(args[prop], prop);
            }
        }

        if (!this.baseUrl)
            this.baseUrl = this.url;

        this.url = this.urls[functionName]
            ? this.urls[functionName]
            : this.baseUrl;

        if (this.method != "GET")
            return vars.join("&");

        this.url = this.url + (vars.length
            ? (this.url.indexOf("?") > -1 ? "&" : "?") + vars.join("&")
            : "");

        return "";
    };

    this.$load = function(x){
        this.method      = (x.getAttribute("http-method") || "GET").toUpperCase();
        this.contentType = this.method == "GET"
            ? null
            : "application/x-www-form-urlencoded";

        if (x.getAttribute("method-name")) {
            var mName = x.getAttribute("method-name");
            var nodes = x.childNodes;

            for (var v, i = 0; i < nodes.length; i++) {
                if (nodes[i].nodeType != 1)
                    continue;

                v = nodes[i].insertBefore(x.ownerDocument.createElement("variable"),
                    nodes[i].firstChild);
                v.setAttribute("name",  mName);
                v.setAttribute("value", nodes[i].getAttribute("name"));
            }
        }
    };

    /**
     * Submit a form with ajax (GET)
     *
     * @param {HTMLElement} form      the html form element to submit.
     * @param {Function}       callback  called when the http call returns.
     */
    this.submitForm = function(form, callback){
        if (!this['postform'])
            this.addMethod('postform', callback);

        var args = [];
        for (var i = 0; i < form.elements.length; i++) {
            if (!form.elements[i].name)
                continue;
            if (form.elements[i].tagname = 'input'
              && (form.elements[i].type == 'checkbox'
              || form.elements[i].type == 'radio')
              && !form.elements[i].checked)
                continue;

            if (form.elements[i].tagname = 'select' && form.elements[i].multiple) {
                for (j = 0; j < form.elements[i].options.length; j++) {
                    if (form.elements[i].options[j].selected)
                        args.push(form.elements[i].name
                            + "="
                            + encodeURIComponent(form.elements[i].options[j].value));
                }
            }
            else {
                args.push(form.elements[i].name
                    + "="
                    + encodeURIComponent(form.elements[i].value));
            }
        }

        var loc               = (form.action || location.href);
        this.urls['postform'] = loc + (loc.indexOf("?") > -1 ? "&" : "?") + args.join("&");
        this['postform'].call(this);

        return false;
    };
};

// #ifdef __WITH_DATA_INSTRUCTIONS
apf.namespace("datainstr.url", function(xmlContext, options, callback){
    if (!options.parsed) {
        var url = options.instrData.join(":");
        
        if (xmlContext) {
            //Xpath
            url = url.replace(/\{(.*?)\}/g,
              function(m, xpath){
                var o = xmlContext.selectSingleNode(xpath);
                return o
                    ? (o.nodeType >= 2 && o.nodeType <= 4
                        ? o.nodeValue
                        : o.xml || o.serialize())
                    : ""
            });
        }
        
        //Javascript
        url = url.replace(/\((.*?)\)/g,
          function(m, js){
            var o;
            
            try{
                with (options) {
                    o = eval(js);
                }
            }
            catch(e){
                //#ifdef __DEBUG
                throw new Error(apf.formatErrorString(0, null,
                    "Saving/Loading data", "Could not execute javascript \
                    code in process instruction '" + js
                    + "' with error " + e.message));
                //#endif
            }
            
            return o || "";
        });

        var split    = url.split("?");
            url      = split.shift();
        var query    = split.join("?");
        var args     = options.args;
        var httpBody = (args && args.length)
            ? (args[0].nodeType
                ? args[0].xml || args[0].serialize()
                : apf.serialize(args[0]))
            : query;

        if (options.preparse) {
            options.parsed = [url, query, httpBody];
            options.preparse = -1;
            return;
        }
    }
    else {
        var url      = options.parsed[0];
        var query    = options.parsed[1];
        var httpBody = options.parsed[2];
    }

    var oHttp = apf.oHttp;
    oHttp.contentType = "application/x-www-form-urlencoded";
    oHttp.method = (options.instrType.replace(/url.?/, "") || "GET").toUpperCase();
    oHttp.get(apf.getAbsolutePath(apf.appsettings.baseurl, url + (oHttp.method == "GET" ? "?" + query : "")), callback,
        apf.extend(oHttp.method == "GET" ? {} : {data : httpBody}, options));
});

// #endif

// #endif
