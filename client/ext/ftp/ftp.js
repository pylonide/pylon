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
    pageTitle: "Transcript",
    pageID   : "pgFtpConsole",
    hotitems : {},

    nodes    : [],

    hook : function(){
        ext.initExtension(this);
        ide.addEventListener("socketMessage", this.onMessage.bind(this));
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
    
    log : function(msg, type, code){
        if (!tabConsole.visible)
            ideConsole.enable();
        
        msg = apf.htmlentities(String(msg));

        if (!type)
            type = "log";
        else if (type == "command") {
            msg = "<span style='color:#0066FF'><span style='float:left'>Cmd:</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        else if (type == "response") {
            msg = "<span style='color:#66FF66'><span style='float:left'>" + code + ":</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        else if (type == "status") {
            msg = "<span style='color:#FFFFFF'><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        else if (type == "error") {
            msg = "<span style='color:#FF3300'><span style='float:left'>" + code + ":</span><div style='margin:0 0 0 80px'>"
                + msg + "</div></span>"
        }
        txtFtpConsole.addValue("<div class='item console_" + type + "'>" + msg + "</div>");
    },

    write: function(aLines) {
        if (typeof aLines == "string")
            aLines = aLines.split("\n");
        for (var i = 0, l = aLines.length; i < l; ++i)
            this.log(aLines[i], "log");
        //this.log("", "divider");
    },
    
    onMessage: function(e) {
        var message = e.message;
        if (message.type !== "transcript")
            return;
        
        this.log(message.body, message.subtype, message.code);
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