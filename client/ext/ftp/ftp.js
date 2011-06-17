/**
 * FTP Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {
 
 var ide = require("core/ide");
 var ext = require("core/ext");
 var util = require("core/util");
 var canon = require("pilot/canon");
 var editors = require("ext/editors/editors");
 var ideConsole = require("ext/console/console");
 var markup = require("text!ext/ftp/ftp.xml");
  
return ext.register("ext/ftp/ftp", {
    name     : "FTP",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    offline  : false,
    markup   : markup,
    pageTitle: "FTP",
    pageID   : "pgFtpConsole",
    hotitems : {},

    nodes    : [],

    hook : function(){
        ext.initExtension(this);
    },

    init : function(amlNode){
        if (!this.$panel) {
            tabConsole.remove("console"); // remove Console tab
            tabConsole.remove("output"); // remove Output tab
            btnConsoleClear.hide();
            txtConsoleInput.hide();
            
            this.$panel = tabConsole.add(this.pageTitle, this.pageID);
            this.$panel.appendChild(ftpConsoleHbox);
            tabConsole.set(this.pageID);
        }
    },
    
    log : function(msg, type, pre, post, otherOutput){
        if (!tabConsole.visible)
            ideConsole.enable();
        
        msg = apf.htmlentities(String(msg));

        if (!type)
            type = "log";
        else if (type == "command") {
            msg = "<span style='color:#0066FF'><span style='float:left'>Command:</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        else if (type == "response") {
            msg = "<span style='color:#66FF66'><span style='float:left'>Response:</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        else if (type == "status") {
            msg = "<span style='color:#FFFFFFactivity'><span style='float:left'>Status:</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        else if (type == "error") {
            msg = "<span style='color:#FF3300'><span style='float:left'>Error:</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        (otherOutput || txtFtpConsole).addValue("<div class='item console_" + type + "'>" + (pre || "") + msg + (post || "") + "</div>");
    },

    write: function(aLines) {
        if (typeof aLines == "string")
            aLines = aLines.split("\n");
        for (var i = 0, l = aLines.length; i < l; ++i)
            this.log(aLines[i], "log");
        //this.log("", "divider");
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