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

// #ifdef __TP_RPC_RDB
// #define __WITH_RDB 1

/**
 * Implementation of the Remote DataBinding (RDB) RPC protocol as a module for the
 * RPC plugin of apf.teleport.
 * Example:
 * Ajax.org Markup Language
 * <code>
 *  <a:rpc id="comm" protocol="rdb" remote="rmtProducts">
 *      <a:method
 *        name    = "searchProduct"
 *        receive = "processSearch">
 *          <a:param name="search" />
 *          <a:param name="page" />
 *          <a:param name="textbanner" value="1" />
 *      </a:method>
 *      <a:method
 *        name = "loadProduct"
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
 * Remarks:
 * Calls can be made to a server using cgi variables with a special
 * {@link term.datainstruction data instruction}
 * format.
 * <code>
 *  get="http://www.bla.nl?blah=10&foo=[@bar]&example=[10+5]"
 *  set="post http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
 * </code>
 *
 * @addenum rpc[@protocol]:rdb
 *
 * @constructor
 *
 * @inherits apf.Teleport
 * @inherits apf.http
 * @inherits apf.rpc
 *
 * @author      Mike de Boer (mike AT ajax DOT org)
 * @version     %I%, %G%
 * @since       3.0RC1
 *
 * @default_private
 */
apf.rdb = function(){
    this.supportMulticall = false;
    this.namedArguments   = true;

    this.queue = [];

    this.unserialize = function(str){
        return str;
    };

    this.getSingleCall = function(name, args, obj){
        obj.push(args);
    };

    // Create message to send
    this.createMessage = function(functionName, args){
        var prop,
            vars     = {};

        function recur(o, stack){
            if (o && o.dataType == apf.ARRAY) {
                for (var j = 0, l = o.length; j < l; j++)
                    recur(o[j], stack);
            }
            else if (o && typeof o == "object") {
                if (o.nodeType) {
                    var s;
                    try {
                        s = o.outerHTML || o.serialize && o.serialize() 
                          || apf.getCleanCopy(o).xml;
                    }
                    catch(e){
                        s = "Could not serialize object";
                    }
                    vars[stack] = s;
                }
                else {
                    for (prop in o) {
                        //#ifdef __SUPPORT_SAFARI2
                        if (apf.isSafariOld && (!o[prop] || typeof o[prop] != "object"))
                            continue;
                        //#endif
    
                        if (typeof o[prop] == "function")
                            continue;
                        recur(o[prop], prop);
                    }
                }
            }
            else {
                if (typeof o != "undefined" && o !== null)
                    vars[stack] = o;
            }
        }

        if (this.multicall) {
            vars.func = this.mcallname;
            for (var i = 0; i < args[0].length; i++)
                recur(args[0][i]);
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
        vars["command"] = functionName;

        return vars;
    };

    this.$get = function(url, options) {
        // url, ignored.
        //#ifdef __DEBUG
        if (!this["remote"]) {
            throw new Error(apf.formatErrorString(0, this, "Sending RDB-RPC request",
                "No remote element found. Please specify one prior to making a request."));
        }
        //#endif

        if (!this.$remote) {
            //#ifdef __WITH_NAMESERVER
            this.$remote = apf.nameserver.get(this.remote) || self[this.remote];
            // #ifdef __DEBUG
            var _self = this;
            this.$remote.transport.addEventListener("rpcresult", function(e) {
                if (!e.sid) return;
                var t   = _self.queue[parseInt(e.sid)],
                    log = t ? t.log : null;
                if (!log) return;
                log.response({
                    http: {
                        getAllResponseHeaders: apf.K,
                        status: e.status,
                        statusText: "",
                        responseText: JSON.stringify(e.data)
                    }
                });
            });
            //#endif
            //#endif
        }

        var id = this.queue.push({options: options}) - 1;

        // #ifdef __DEBUG
        if (!options.hideLogMessage) {
            var data = options.data || "";
            this.queue[id] = {options: options};
            
            apf.console.teleport(this.queue[id].log = new apf.teleportLog({
                id      : id,
                tp      : this,
                type    : "rpc",
                method  : "GET",
                url     : data.command,
                data    : JSON.stringify(data),
                start   : new Date()
            }));
            this.queue[id].log.request([]);
        }
        //#endif

        this.$remote.sendRPC(id, options);
    };

    /**
     * Submit a form with ajax (GET)
     *
     * @param {HTMLElement} form      the html form element to submit.
     * @param {Function}       callback  called when the http call returns.
     */
    this.submitForm = function(form, callback){
        return false; //@todo apf3.0 is this still an implemented feature?
        if (!this['postform'])
            this.addMethod('postform', callback);

        var args = [];
        for (var i = 0, l = form.elements.length; i < l; i++) {
            if (!form.elements[i].name)
                continue;
            if (form.elements[i].tagname == "input"
              && (form.elements[i].type  == "checkbox"
              || form.elements[i].type   == "radio")
              && !form.elements[i].checked)
                continue;

            if (form.elements[i].tagname = "select" && form.elements[i].multiple) {
                for (var j = 0; j < form.elements[i].options.length; j++) {
                    if (form.elements[i].options[j].selected)
                        args.push(form.elements[i].name
                            + "="
                            + form.elements[i].options[j].value);
                }
            }
            else {
                args.push(form.elements[i].name
                    + "="
                    + form.elements[i].value);
            }
        }

        var loc               = (form.action || location.href);
        this.urls['postform'] = loc + (loc.indexOf("?") > -1 ? "&" : "?") + args.join("&");
        this['postform'].call(this);

        return false;
    };
};

// #endif
