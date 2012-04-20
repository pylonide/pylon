/**
 * Extension Manager for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
 define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var markup = require("text!ext/log/log.xml");

module.exports = ext.register("ext/log/log", {
    name   : "Log",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    desp   : [],
    model  : new apf.model().load("<events />"),
    
    nodes : [],
    
    hook : function(){
        var _self = this;
        this.nodes.push(
            mnuWindows.insertBefore(new apf.item({
                caption : "Log...",
                onclick : function(){
                    ext.initExtension(_self);
                    winLog.show();
                }
            }), mnuWindows.firstChild)
        );
        
        var send = ide.send;
        ide.send = function(msg){
            _self.model.appendXml("<event time='" + new Date().getTime() 
                + "' type='websocket'><![CDATA[" + JSON.stringify(msg) + "]]></event>");
                
            send.apply(ide, arguments);
        }

        ide.addEventListener("socketMessage", function(e){
            _self.model.appendXml("<event time='" + new Date().getTime() 
                + "' type='websocket_receive' response='" + JSON.stringify(e.message) + "' />");
        });

        this.wrapHttp("apf.http", "http");
        this.wrapHttp("apf.webdav", "webdav");
        this.wrapInstance("require('ext/filesystem/filesystem').webdav", "fswebdav");
    },

    wrapHttp : function(expr, type){
        var _self = this;
        var http = eval(expr);
        var func = function(){
            var oHttp = new http();
            var get = oHttp.get;
            oHttp.get = function(url, options){
                var callback = options.callback;
                options.callback = function(data, state, extra){
                    apf.xmldb.setAttribute(xmlNode, "response",
                        JSON.stringify({
                            state : state,
                            data : data
                        }));

                    callback && callback.apply(this, arguments);
                }

                var xmlNode = apf.getXml("<event time='" + new Date().getTime() 
                    + "' url='" + url + "' type='" + type + "'><![CDATA[" 
                    + JSON.stringify(options) + "]]></event>");

                xmlNode = apf.xmldb.appendChild(_self.model.data, xmlNode);
                
                get.apply(oHttp, arguments);
            }
            return oHttp;
        }
        eval(expr + " = func");
        apf.extend(eval(expr), http);
    },

    wrapInstance : function(expr, type){
        var _self = this;
        var oHttp = eval(expr);
        var get = oHttp.get;
        oHttp.get = function(url, options){
            var callback = options.callback;
            options.callback = function(data, state, extra){
                apf.xmldb.setAttribute(xmlNode, "response",
                    JSON.stringify({
                        state : state,
                        data : data
                    }));

                callback && callback.apply(this, arguments);
            }

            var xmlNode = apf.getXml("<event time='" + new Date().getTime() 
                + "' url='" + url + "' type='" + type + "'><![CDATA[" 
                + JSON.stringify(options) + "]]></event>");

            xmlNode = apf.xmldb.appendChild(_self.model.data, xmlNode);
            
            get.apply(oHttp, arguments);
        }
    },

    init : function(amlNode){},

    enable : function(){
        if (!this.disabled) return;
        
        this.nodes.each(function(item){
            item.enable();
        });
        this.disabled = false;
    },
    
    disable : function(){
        if (this.disabled) return;
        
        this.nodes.each(function(item){
            item.disable();
        });
        this.disabled = true;
    },
    
    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

    }
);