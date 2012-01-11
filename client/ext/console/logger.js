/**
 * Console for the Cloud9 IDE
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");

// Maximum amount of buffer history
var MAX_LINES = 512;
// relative workspace files
var wsrRe = /(?:\s|^|\.\/)([\w\_\$-]+(?:\/[\w\_\$-]+)+(?:\.[\w\_\$]+))?(\:\d+)(\:\d+)*/g;
// URL regexp
var urlRe = /\b((?:(?:https?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/i;
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

var messages = {
    divider: "<span style='display:block;border-top:1px solid #444; margin:6px 0 6px 0;'></span>",
    prompt: "<span style='color:#86c2f6'>__MSG__</span>",
    command: "<span style='color:#86c2f6'><span style='float:left'>&gt;&gt;&gt;</span><div style='margin:0 0 0 25px'>__MSG__</div></span>"
};

// Remove as many elements in the console output area so that between
// the existing buffer and the stream coming in we have the right
// amount of lines according to MAX_LIMIT.
var balanceBuffer = function(elem, len) {
    while (elem.firstChild && (elem.childNodes.length + len) > MAX_LINES)
        elem.removeChild(elem.firstChild);
};

var stringRepeat = function(str, times) {
    return new Array(times + 1).join(str);
};

var escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.logNodeStream = function(data, stream, useOutput) {
    var workspaceDir = ide.workspaceDir;
    var davPrefix = ide.davPrefix;
    var style = "color:#eee;";
    var log = [];

    var parentEl = useOutput ? txtOutput : txtConsole;
    var lines = data.split("\n", MAX_LINES);

    if (lines.length >= MAX_LINES) 
        // If the stream coming in already contains more lines that our limit,
        // let's clear the console right away.
        parentEl.clear();
    else 
        balanceBuffer(parentEl.$ext, lines.length);

    // Probably nice to take this RegExp generation outside the function at
    // some point
    var wsRe = new RegExp(escapeRegExp(workspaceDir) + "\\/([^:]*)(:\\d+)(:\\d+)*", "g");
    for (var i = 0, l = lines.length; i < l; i++) {
        if (!lines[i])
            continue;

        // The following is heinous, feel free to refactor it properly, I 
        // cleaned it up before but I didn't have the time or the heart to refactor.
        log.push("<div class='item'><span style='" + style + "'>" + apf.htmlentities(lines[i])
            .replace(urlRe, "<a href='$1' target='_blank'>$1</a>")
            .replace(wsRe, "<a href='#' onclick='require(\"ext/console/console\").jump(\"" + davPrefix + "/$1\", \"$2\", \"$3\")'>" + workspaceDir + "/$1$2$3</a>")
            .replace(wsrRe, "<a href='#' onclick='require(\"ext/console/console\").jump(\"" + davPrefix + "/$1\", \"$2\", \"$3\")'>$1$2$3</a>")
            .replace(/\s{2,}/g, function(str) {
                return stringRepeat("&nbsp;", str.length);
            })
            // tty escape sequences (http://ascii-table.com/ansi-escape-sequences.php)
            .replace(/(\u0007|\u001b)\[(K|2J)/g, "")
            .replace(/\033\[(?:(\d+);)?(\d+)m/g, function(m, extra, color) {
                style = "color:" + (colors[color] || "#eee");
                if (extra == 1)
                    style += ";font-weight=bold";
                else if (extra == 4)
                    style += ";text-decoration=underline";
                return "</span><span style='" + style + "'>";
            }) + "</span></div>");
    }
    parentEl.addValue(log.join(""));
};

exports.log = function(msg, type, pre, post, otherOutput){
    msg = apf.htmlentities(msg.toString());

    if (!type)
        type = "log";

    if (messages[type])
        msg = messages[type].replace("__MSG__", msg);

    var parentEl = otherOutput || txtConsole;
    balanceBuffer(parentEl.$ext, 1);

    parentEl.addValue("<div class='item console_" + type + "'>" + (pre || "") + msg + (post || "") + "</div>");
};

});
