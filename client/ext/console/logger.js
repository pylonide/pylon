/**
 * Logger
 *
 * The logger outputs given messages into the console output, properly formatted.
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
exports.test = {};

// Maximum amount of buffer history
var MAX_LINES = 512;
var RE_relWorkspace = /(?:\s|^|\.\/)([\w\_\$-]+(?:\/[\w\_\$-]+)+(?:\.[\w\_\$]+))?(\:\d+)(\:\d+)*/g;
var RE_URL = /\b((?:(?:https?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/i;
var RE_COLOR = /\[(?:(\d+);)?(\d+)m/g;

var messages = {
    divider: "<span class='cli_divider'></span>",
    prompt: "<span style='color:#86c2f6'>__MSG__</span>",
    command: "<span style='color:#86c2f6'><span>&gt;&gt;&gt;</span><div>__MSG__</div></span>"
};

var colors = {
    0:  "#eee",
    31: "red",
    32: "green",
    33: "yellow",
    34: "blue",
    35: "magenta",
    36: "cyan"
};

// Remove as many elements in the console output area so that between
// the existing buffer and the stream coming in we have the right
// amount of lines according to MAX_LIMIT.
var balanceBuffer = function(elem, len) {
    while (elem.firstChild && (elem.childNodes.length + len) > MAX_LINES)
        elem.removeChild(elem.firstChild);
};

var stringRepeat = function(s, t) { return new Array(t + 1).join(s); };
var escapeRegExp = function(s) { return s.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1'); };

var createItem = module.exports.test.createItem = function(line, ide) {
    if (!line) return "";

    var workspaceDir = ide.workspaceDir;
    var davPrefix = ide.davPrefix;

    if (line.search(RE_relWorkspace) !== -1) {
        line = line.replace(RE_relWorkspace,
            "<a href='#' data-abWsp='" + davPrefix + "/$1\", \"$2\", \"$3'>$1$2$3</a>");
    }

    var wsRe = new RegExp(escapeRegExp(workspaceDir) + "\\/([^:]*)(:\\d+)(:\\d+)*", "g");
    if (line.search(wsRe) !== -1) {
        line = line.replace(wsRe,
            "<a href='#' data-relWsp='" + davPrefix + "/$1\", \"$2\", \"$3'>" + workspaceDir + "/$1$2$3</a>");
    }

    if (line.search(RE_URL) !== -1) {
        line = line.replace(RE_URL, "");
    }

    line = line.replace(/\s{2,}/g, function(str) { return stringRepeat("&nbsp;", str.length); })
        .replace(/(\u0007|\u001b)\[(K|2J)/g, "")
        .replace(RE_COLOR, function(m, extra, color) {
            var styles = [
                "color: " + (colors[color] || colors[0]),
                extra === 1 ? ";font-weight: bold" : "",
                extra === 4 ? ";text-decoration: underline" : ""
            ];
            return "<span style='" + styles.join("").trim() + "'>";
        });

    return "<div>" + line + "</div>";
};

module.exports.logNodeStream = function(data, stream, useOutput, ide) {
    var parentEl = useOutput ? txtOutput : txtConsole;
    var lines = data.split("\n", MAX_LINES);
    if (lines.length >= MAX_LINES)
        // If the stream coming in already contains more lines that our limit,
        // let's clear the console right away.
        parentEl.clear();
    else
        balanceBuffer(parentEl.$ext, lines.length);

    parentEl.$ext.innerHTML += lines.map(function(line) {
        return createItem(line, ide);
    }).join("");
};

module.exports.log = function(msg, type, pre, post, otherOutput){
    msg = msg.toString().escapeHTML();
    if (!type)
        type = "log";

    if (messages[type])
        msg = messages[type].replace("__MSG__", msg);

    var parentEl = otherOutput || txtConsole;
    balanceBuffer(parentEl.$ext, 1);

    parentEl.$ext.innerHTML +=
        "<div class='item console_" + type + "'>" +
            (pre || "") + msg + (post || "") +
        "</div>";
};

});
