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
var ideConsole = require("ext/console/console");
var markup = require("text!ext/ftp/ftp.xml");
var css = require("text!ext/ftp/ftp.css");

module.exports = ext.register("ext/ftp/ftp", {
    name     : "FTP",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    offline  : false,
    autodisable  : ext.ONLINE,
    markup   : markup,
    pageTitle: "FTP log",
    pageID   : "pgFtpConsole",
    css      : css,
    nodes    : [],

    pageId: "ftpConsoleHbox",

    hook: function(){
        // hack to hide the dock panel!!
//        if (window.dockPanelRight)
//            dockPanelRight.setAttribute("visible", false);
        ide.addEventListener("socketMessage", this.onMessage.bind(this));
        ext.initExtension(this);
    },

    init: function(amlNode) {
        var _self = this;

        apf.importCssString(this.css || "");

        if (!this.$panel) {
            ide.addEventListener("init.ext/console/console", function() {
                // remove the console and output panels and add a super FTP panel
                // to the console
                var console = window.tabConsole;

                // append our own panel to the console
                self.$panel = console.add("FTP Log", _self.pageId);
                self.$panel.setAttribute("closebtn", false);
                self.$panel.appendChild(ftpConsoleHbox);

                // make ourselves the active panel
                // first show then activate
                ftpConsoleHbox.show();
                console.set(_self.pageID);

                // remove the other tabs, until we refactored them out nicely
                console.remove("console");
                console.remove("output");
            });
        }
    },

    log: function(msg, type) {
        if (typeof tabConsole !== "undefined" && tabConsole.visible)
            ideConsole.enable();

        // Converts HTML special characters to their entity equivalents.
        msg = apf.escapeXML("" + msg);

        if (type === "response")
            msg = msg.replace(/\n/gm, "<br>").replace(/\s/gm, "&nbsp;");

        txtFtpConsole.addValue("<div class='item console_" + type + "'>" + msg + "</div>");
    },

    write: function(lines) {
        var self = this;
        if (typeof lines === "string")
            lines = lines.split("\n");

        lines.forEach(function(line) {
            self.log(line, "log");
        });
    },

    onMessage: function(e) {
        var message = e.message;
        if (message.type !== "transcript") {
            return;
        }

        if (message.body === "noop") {
            return;
        }

        this.log(message.body, message.subtype);
    }
});

});
