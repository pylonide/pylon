define(function(require, exports, module) {

    var ext = require("core/ext");
    var ide = require("core/ide");
    var util = require("core/util");

    var ttycss = require("text!ext/terminal/static/style.css");

    require(["termjs"], function(){
        require(["ext/terminal/tty"]);
    });

    module.exports = ext.register("ext/terminal/terminal", {
        name     : "Cloud9 Terminal",
        dev      : "Sten Feldman",
        alone    : true,
        deps     : [],
        type     : ext.GENERAL,
        ttycss   : util.replaceStaticPrefix(ttycss),

        nodes : [],

        init : function(){
            var _self = this;
            apf.importCssString(this.ttycss);
        },

        hook : function(){
            var _self = this;
            ext.initExtension(this);
        },

        enable : function(){
            this.nodes.each(function(item){
                item.enable();
            });
        },

        disable : function(){
            this.nodes.each(function(item){
                item.disable();
            });
        },

        destroy : function(){
            this.nodes.each(function(item){
                item.destroy(true, true);
            });
            this.nodes = [];
        }
    });

});