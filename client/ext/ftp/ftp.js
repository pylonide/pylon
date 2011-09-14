/**
 * FTP Module for the Cloud9 IDE
 *
 * @author Sergi Mansilla
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var ideConsole = require("ext/console/console");
var markup = require("text!ext/ftp/ftp.xml");
var css = require("text!ext/ftp/ftp.css");

module.exports = ext.register("ext/ftp/ftp", {
    name     : "FTP",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    offline  : false,
    markup   : markup,
    pageTitle: "FTP log",
    pageID   : "pgFtpConsole",
    hotitems : {},
    css      : css,
    nodes    : [],

    hook: function(){
        ext.initExtension(this);

        // hack to hide the dock panel!!
        if (window.dockPanelRight)
            dockPanelRight.setAttribute("visible", false);

        ide.addEventListener("socketMessage", this.onMessage.bind(this));
    },

    init: function(amlNode) {
        apf.importCssString(this.css || "");

        if (!this.$panel) {
            tabConsole.remove("console"); // remove Console tab
            tabConsole.remove("output"); // remove Output tab
            btnConsoleClear.hide();
            txtConsoleInput.hide();

            this.$panel = tabConsole.add(this.pageTitle, this.pageID);
            this.$panel.appendChild(ftpConsoleHbox);
            tabConsole.set(this.$panel);
        }
    },

    log: function(msg, type, code) {
        if (!tabConsole.visible)
            ideConsole.enable();

        // Converts HTML special characters to their entity equivalents.
        msg = apf.htmlentities("" + msg);

        if (type === "response")
            msg = msg.replace(/\n/gm, "<br>").replace(/\s/gm, "&nbsp;");

        txtFtpConsole.addValue("<div class='item console_" + type + "'>" + msg + "</div>");
    },

    write: function(lines) {
        var self = this;
        if (typeof lines == "string")
            aLines = lines.split("\n");

        lines.forEach(function(line) {
            self.log(line, "log")
        });
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
