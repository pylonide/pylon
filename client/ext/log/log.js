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
            _self.log(null, "websocket", msg);
                
            send.apply(ide, arguments);
        }

        ide.addEventListener("socketMessage", function(e){
            _self.log(null, "websocket_receive", null, e.message);
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

            _self.wrap(oHttp, type);
            return oHttp;
        }
        eval(expr + " = func");
        apf.extend(eval(expr), http);
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
                apf.xmldb.setAttribute(xmlNode, "response",
                    JSON.stringify({
                        state : state,
                        data : data
                    }));
    
                callback && callback.apply(this, arguments);
            }
    
            var xmlNode = _self.log(url, type, options);
    
            get.apply(oHttp, arguments);
        }
    },

    log : function(url, type, request, response){
        if (this.model.data.childNodes.length > 1000) {
            apf.xmldb.removeChild(this.model.data.firstChild);
        }

        var xmlNode = apf.getXml("<event time='" + new Date().getTime() 
            + "' url='" + (url || "") + "' type='" + type + "' "
            + "response='" + (response ? JSON.stringify(response) : "") + "'><![CDATA[" 
            + (request ? JSON.stringify(request) : "") + "]]></event>");
        return apf.xmldb.appendChild(this.model.data, xmlNode);
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