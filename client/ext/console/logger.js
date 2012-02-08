/**
 * Logger
 * The logger outputs given messages into the console output, properly formatted.
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 * @contributor Sergi Mansilla <sergi AT c9 DOT io>
 */
define(function(require, exports, module) {
var editors = require("ext/editors/editors");

exports.test = {};
var MAX_LINES = 512;
var RE_relwsp = /(?:\s|^|\.\/)([\w\_\$-]+(?:\/[\w\_\$-]+)+(?:\.[\w\_\$]+))?(\:\d+)(\:\d+)*/g;
var RE_URL = /\b((?:(?:https?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()[\]{};:'".,<>?«»“”‘’]))/i;
var RE_COLOR = /\[(?:(\d+);)?(\d+)m/g;
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
var balanceBuffer = function(elem) {
    var len = elem.childNodes.length;
    if (len <= MAX_LINES)
        return;

    len = len - MAX_LINES;
    for (var i = 0; i < len; i++)
        elem.removeChild(elem.firstChild);
};

var jump = function(path, row, column) {
    row = parseInt(row.slice(1), 10);
    column = column ? parseInt(column.slice(1), 10) : 0;
    editors.showFile(path, row, column);
};

// Maximum amount of buffer history
var bufferInterval;
var setBufferInterval = function(el) {
    bufferInterval = setInterval(function() {
        balanceBuffer(el);
    }, 1000);
};

var strRepeat = function(s, t) { return new Array(t + 1).join(s); };
var escRegExp = function(s) { return s.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1'); };

var createItem = module.exports.test.createItem = function(line, ide) {
    if (!line) return "";

    var workspaceDir = ide.workspaceDir;
    var davPrefix = ide.davPrefix;
    var wsRe = new RegExp(escRegExp(workspaceDir) + "\\/([^:]*)(:\\d+)(:\\d+)*", "g");

    if ((line.search(RE_relwsp) !== -1) || (line.search(wsRe) !== -1)) {
        var html = "<a href='#' data-wsp='" + davPrefix + "/$1,$2,$3'>___$1$2$3</a>";
        line = line
            .replace(RE_relwsp, html.replace("___", ""))
            .replace(wsRe, html.replace("___", workspaceDir + "/"));
    }
    else if (line.search(RE_URL) !== -1) {
        line = line.replace(RE_URL, "<a href='$1' target='_blank'>$1</a>");
    }

    return line
        .replace(/\s{2,}/g, function(str) { return strRepeat("&nbsp;", str.length); })
        .replace(/(\u0007|\u001b)\[(K|2J)/g, "")
        .replace(RE_COLOR, function(m, extra, color) {
            var styles = [
                "color: " + (colors[color] || colors[0]),
                extra === 1 ? ";font-weight: bold" : "",
                extra === 4 ? ";text-decoration: underline" : ""
            ];
            return "<span style='" + styles.join("").trim() + "'>";
        });
};

var childBuffer;
var childBufferInterval;
var eventsAttached;
module.exports.logNodeStream = function(data, stream, useOutput, ide) {
    var parentEl = (useOutput ? txtOutput : txtConsole).$ext;

    if (eventsAttached !== true) {
        parentEl.addEventListener("click", function(e) {
            var node = e.target;
            if (node.hasAttribute("data-wsp"))
                jump.apply(null, e.target.getAttribute("data-wsp").split(","));
        });
        eventsAttached = true;
    }

    if (!bufferInterval) {
        setBufferInterval(parentEl);
    }

    // This is a bit cumbersome, but it solves the issue in which logging stuff
    // in the console at a high speed keeps the browser incredibly busy, and
    // sometimes it even crashes. An interval is created in which every 100ms
    // The lines stored in the document fragment are appended in the actual console
    // output.
    if (!childBuffer) {
        childBuffer = document.createDocumentFragment();
        childBufferInterval = setInterval(function() {
            parentEl.appendChild(childBuffer);
            childBuffer = document.createDocumentFragment();
        }, 100);
    }

    var lines = data.split("\n", MAX_LINES);
    var fragment = document.createDocumentFragment();
    for (var i=0, l = lines.length; i<l; i++) {
        var div = document.createElement("div");
        var divContent = createItem(lines[i], ide);
        if (divContent && divContent.length) {
            div.innerHTML = divContent;
            fragment.appendChild(div);
        }
    }
    childBuffer.appendChild(fragment);
};

var messages = {
    divider: "<span class='cli_divider'></span>",
    prompt: "<span style='color:#86c2f6'>__MSG__</span>",
    command: "<span style='color:#86c2f6'><span>&gt;&gt;&gt;</span><div>__MSG__</div></span>"
};

module.exports.log = function(msg, type, pre, post, otherOutput) {
    msg = msg.toString().escapeHTML();
    if (!type)
        type = "log";

    if (messages[type]) {
        msg = messages[type].replace("__MSG__", msg);
    }

    var parentEl = (otherOutput || txtConsole).$ext;
    if (!bufferInterval) {
        setBufferInterval(parentEl);
    }

    parentEl.innerHTML +=
        "<div class='item console_" + type + "'>" +
            (pre || "") + msg + (post || "") +
        "</div>";
};
});
