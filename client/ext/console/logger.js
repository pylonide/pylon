/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

var Ide = require("core/ide");
var Lang = require("pilot/lang");

exports.logNodeStream = function(data, stream, useOutput) {
    var colors = {
        30: "#eee",
        31: "red",
        32: "green",
        33: "yellow",
        34: "blue",
        35: "magenta",
        36: "cyan",
        37: "#eee"
    };

    workspaceDir = Ide.workspaceDir;
    davPrefix = Ide.davPrefix;

    var lines = data.split("\n");
    var style = "color:#eee;";
    var log = [];
    // absolute workspace files
    var wsRe = new RegExp(Lang.escapeRegExp(workspaceDir) + "\\/([^:]*)(:\\d+)(:\\d+)*", "g");
    // relative workspace files
    var wsrRe = /(?:\s|^|\.\/)([\w\_\$-]+(?:\/[\w\_\$-]+)+(?:\.[\w\_\$]+))?(\:\d+)(\:\d+)*/g;

    for (var i = 0, l = lines.length; i < l; i++) {
        if (!lines[i])
            continue;
        log.push("<div class='item'><span style='" + style + "'>" + lines[i]
            .replace(wsRe, "<a href='javascript:void(0)' onclick='require(\"ext/console/console\").jump(\"" + davPrefix + "/$1\", \"$2\", \"$3\")'>" + workspaceDir + "/$1$2$3</a>")
            .replace(wsrRe, "<a href='javascript:void(0)' onclick='require(\"ext/console/console\").jump(\"" + davPrefix + "/$1\", \"$2\", \"$3\")'>$1$2$3</a>")
            .replace(/\s{2,}/g, function(str) {
                return Lang.stringRepeat("&nbsp;", str.length);
            })
            .replace(/(((http:\/\/)|(www\.))[\w\d\.-]*(:\d+)?(\/[\w\d]+)?)/, "<a href='$1' target='_blank'>$1</a>")
            // tty escape sequences (http://ascii-table.com/ansi-escape-sequences.php)
            .replace(/(\u0007|\u001b)\[(K|2J)/g, "")
            .replace(/\033\[(?:(\d+);)?(\d+)m/g, function(m, extra, color) {
                style = "color:" + (colors[color] || "#eee");
                if (extra == 1)
                    style += ";font-weight=bold";
                else if (extra == 4)
                    style += ";text-decoration=underline";
                return "</span><span style='" + style + "'>"
            }) + "</span></div>");
    }

    (useOutput ? txtOutput : txtConsole).addValue(log.join(""));
};

exports.log = function(msg, type, pre, post, otherOutput){
    msg = apf.htmlentities(String(msg));

    if (!type)
        type = "log";
    else if (type == "divider") {
        msg = "<span style='display:block;border-top:1px solid #444; margin:6px 0 6px 0;'></span>";
    }
    else if (type == "prompt") {
        msg = "<span style='color:#86c2f6'>" + msg + "</span>";
    }
    else if (type == "command") {
        msg = "<span style='color:#86c2f6'><span style='float:left'>&gt;&gt;&gt;</span><div style='margin:0 0 0 25px'>"
            + msg + "</div></span>";
    }
    (otherOutput || txtConsole).addValue("<div class='item console_" + type + "'>" + (pre || "") + msg + (post || "") + "</div>");
};

});
