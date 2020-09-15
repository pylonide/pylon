/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var markup = require("text!ext/log/log.xml");
var menus = require("ext/menus/menus");

module.exports = ext.register("ext/log/log", {
    name   : "Log",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL,
    markup : markup,
    desp   : [],
    model  : new ppc.model().load("<events />"),

    nodes : [],

    hook : function(){
        var _self = this;
        this.nodes.push(
            menus.addItemByPath("Tools/Log...", new ppc.item({
                onclick : function(){
                    ext.initExtension(_self);
                    winLog.show();
                }
            }), 1500000)
        );

        var send = ide.send;
        ide.send = function(msg){
            _self.log(null, "websocket", msg);

            send.apply(ide, arguments);
        }

        ide.addEventListener("socketMessage", function(e){
            _self.log(null, "websocket_receive", null, e.message);
        });

        this.wrapHttp("ppc.http", "http");
        this.wrapHttp("ppc.webdav", "webdav");
        this.wrapInstance("require('ext/filesystem/filesystem').webdav", "fswebdav");
    },

    wrapHttp : function(expr, type){
        var _self = this;
        var http = eval(expr);
        var func = function(){
            var oHttp = new http();

            _self.wrap(oHttp, type);
            return oHttp;
        }
        eval(expr + " = func");
        ppc.extend(eval(expr), http);
    },

    wrapInstance : function(expr, type){
        var _self = this;
        var oHttp = eval(expr);
        _self.wrap(oHttp, type);
    },

    wrap : function(oHttp, type){
        var _self = this;

        var get = oHttp.get;
        oHttp.get = function(url, options){
            var callback = options.callback;
            options.callback = function(data, state, extra){
                ppc.xmldb.setAttribute(xmlNode, "response",
                    JSON.stringify({
                        state : state,
                        data : data
                    }));

                callback && callback.apply(this, arguments);
            }

            var xmlNode = _self.log(url, type, options);

            return get.apply(oHttp, arguments);
        }
    },

    log : function(url, type, request, response){
        if (this.model.data.childNodes.length > 1000) {
            ppc.xmldb.removeNode(this.model.data.firstChild);
        }

        var xmlNode = ppc.n("<event/>")
            .attr("time", new Date().getTime())
            .attr("url", url || "")
            .attr("type", type)
            .attr("response", (response && JSON.stringify(response)) || "")
            .node();

        xmlNode.appendChild(xmlNode.parentNode.createCDATASection(request
            ? JSON.stringify(request).replace("]]>", "]] >")
            : ""));

        return ppc.xmldb.appendChild(this.model.data, xmlNode);
    }
});

    }
);