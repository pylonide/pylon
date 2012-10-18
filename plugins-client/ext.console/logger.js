/**
 * The logger formats and outputs messages to the console
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
var RE_COLOR = /\u001b\[([\d;]+)?m/g;

var BUFFER_INTERVAL = 100;
var OUTPUT_CUTOFF = 2003;

var openLinkedFile = function(path, row, column) {
    row = parseInt(row.slice(1), 10);
    column = column ? parseInt(column.slice(1), 10) : 0;
    editors.gotoDocument({
        path: path,
        row: row,
        column: column
    });
};

var strRepeat = function(s, t) { return new Array(t + 1).join(s); };
var escRegExp = function(s) { return s.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1'); };

var createItem = module.exports.test.createItem = function(line, ide) {
    if (!line)
        return "";

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
        line = line.replace(RE_URL, "<a onclick='require(\"ext/preview/preview\").preview(\"$1\"); return false;' href='$1' target='_blank'>$1</a>");
    }

    // escape HTML/ XML, but preserve the links
    var links = [];
    var replacer = "###$#$#$##0";
    line = line.replace(/(<a.*?a>)/gi, function(m) {
        links.push(m);
        return replacer;
    });
    line = apf.escapeXML(line);
    line = line.replace(replacer, function() {
        return links.shift();
    });

    var openSpanTagCount = 0;
    line = line
        .replace(/\s{2,}/g, function(str) { return strRepeat("&nbsp;", str.length); })
        .replace(RE_COLOR, function(m, style) {
            if (!style)
                return "";
            var splits = style.split(";");
            var html = "";
            // check for end of style delimiters
            if (openSpanTagCount > 0 && (style === 39 || (style < 30 && style > 20))) {
                --openSpanTagCount;
                return "</span>";
            }
            else {
                if (splits[0] === "1") {
                    splits.splice(0, 1);
                    ++openSpanTagCount;
                    html += "<span class=\"term_boldColor\" style=\"font-weight:bold\">";
                }
                style = parseInt(splits[0], 10);
                if (! style)
                    return html;
                if (style >= 30 && style <= 37) {
                    ++openSpanTagCount;
                    var ansiColor = (style % 30);
                    if (ansiColor >= 10)
                        ansiColor -= 2;
                    html += "<span class=\"term_ansi" + ansiColor + "Color\">";
                }
                style = parseInt(splits[1], 10);
                if (! style)
                    return html;
                if (style >= 40 && style <= 47) {
                    ++openSpanTagCount;
                    var ansiBg = (style % 30);
                    if (ansiBg >= 10)
                        ansiBg -= 2;
                    // TODO: actual background coloring -> tweak theme generator
                    html += "<span style='background-color: rgb(0, 0, 0);'>";
                }
                return html;
            }
        })
        .replace(/(\u0007|\u001b)\[(K|2J)/g, "");

    if (openSpanTagCount > 0)
        return line + (new Array(openSpanTagCount + 1).join("</span>"));

    return line;
};

var childBuffer = {};
var childBufferInterval = {};
var eventsAttached;

var preInitConsoleBuffer = document.createElement("div");
var preInitOutputBuffer = document.createElement("div");

document.body.appendChild(preInitConsoleBuffer);
document.body.appendChild(preInitOutputBuffer);

// Modify this to create a document fragment if txtOutput is not defined
var getOutputElement = function(getTxtOutput) {

    // this is a hack for commands that are not associated with anything
    // if this happens we usually write it to `txtConsole`
    // but if we don't have that one, we just pump it to /dev/null
    // in this case the preInitConsoleBuffer
    var defaultHandler = typeof txtConsole !== "undefined" && txtConsole && txtConsole.$ext
                            ? txtConsole.$ext
                            : preInitOutputBuffer;

    if (typeof getTxtOutput === "object" && getTxtOutput && getTxtOutput.$ext && getTxtOutput.id) {
        return {
            element: getTxtOutput.$ext,
            id: getTxtOutput.id
        };
    }

    if (typeof txtOutput === "undefined") {
        if (getTxtOutput) {
            return {
                element: preInitOutputBuffer,
                id: "output"
            };
        }

        return {
            element: preInitConsoleBuffer,
            id: "console"
        };
    }

    if (typeof getTxtOutput === "boolean" && getTxtOutput) {
        return {
            element: txtOutput.$ext,
            id: "output"
        };
    }
    else if (getTxtOutput === "undefined" || !getTxtOutput) {
        return {
            element: defaultHandler,
            id: "console"
        };
    }


    if (!getTxtOutput.$ext) {
        getTxtOutput.$ext = defaultHandler;
    }

    return {
        element: getTxtOutput.$ext,
        id: getTxtOutput.id
    };
}

module.exports.appendConsoleFragmentsAfterInit = function() {
    while(preInitConsoleBuffer.childNodes.length)
        txtConsole.$ext.appendChild(preInitConsoleBuffer.childNodes[0]);
    while(preInitOutputBuffer.childNodes.length)
        txtOutput.$ext.appendChild(preInitOutputBuffer.childNodes[0]);
};

module.exports.logNodeStream = function(data, stream, useOutput, ide) {
    var out = getOutputElement(useOutput);
    var parentEl = out.element;
    var outputId = out.id;

    if (parentEl.eventsAttached !== true) {
        parentEl.addEventListener("click", function(e) {
            var node = e.target;
            if (node.hasAttribute("data-wsp")) {
                openLinkedFile.apply(null, e.target.getAttribute("data-wsp").split(","));
                apf.preventDefault(e);
                return false;
            }
        });
        parentEl.eventsAttached = true;
    }

    // Interval console output so the browser doesn't crash from high-volume
    // buffers
    if (!childBuffer[outputId]) {
        childBuffer[outputId] = document.createDocumentFragment();
        function outputBuffer() {
            if (parentEl) {
                parentEl.appendChild(childBuffer[outputId]);
                childBuffer[outputId] = document.createDocumentFragment();

                // childNodes[3] are the actual lines of output that come after
                // the spinner, prompt and divider
                var numChildNodesOverflow = parentEl.childNodes.length - OUTPUT_CUTOFF;
                for (var i = 0; i < numChildNodesOverflow; i++)
                    parentEl.removeChild(parentEl.childNodes[3]);
            }
            else {
                if (typeof txtOutput !== "undefined") {
                    txtOutput.$ext.appendChild(childBuffer[outputId]);
                    childBuffer[outputId] = document.createDocumentFragment();
                }
            }
        }

        childBufferInterval[outputId] = setInterval(function() {
            outputBuffer();
        }, BUFFER_INTERVAL);
    }

    var lines = (data.toString()).split("\n", MAX_LINES);
    var fragment = document.createDocumentFragment();
    for (var i=0, l = lines.length; i<l; i++) {
        var div = document.createElement("div");
        var divContent = createItem(lines[i], ide);
        if (divContent && divContent.length) {
            div.innerHTML = divContent;
            fragment.appendChild(div);
        }
    }

    childBuffer[outputId].appendChild(fragment);

    //@todo this implementation is hacking the apf abstraction
    //      so we have to trigger the scrollbar update ourselves
    if (window["tabConsole"]) {
        setTimeout(function(){
            tabConsole.getPage().getElementsByTagNameNS(apf.ns.aml, "scrollbar")[0].$update();
        }, 1000);
    }
};

module.exports.killBufferInterval = function(sectionNumber) {
    var sectionId = "section" + sectionNumber;
    if (childBufferInterval[sectionId]) {
        // Wait for the remaining buffer to output
        setTimeout(function() {
            clearInterval(childBufferInterval[sectionId]);
        }, BUFFER_INTERVAL + (BUFFER_INTERVAL/2));
    }
};

var messages = {
    prompt: "<span style='color:#86c2f6'>__MSG__</span>",
    command: "<span style='color:#86c2f6'><span>&gt;&gt;&gt;</span><div>__MSG__</div></span>"
};

module.exports.log = function(msg, type, pre, post, useOutput, tracerId) {
    msg = apf.escapeXML(msg.toString());
    if (!type)
        type = "log";

    if (messages[type])
        msg = messages[type].replace("__MSG__", msg);

    var containerOutput = ['<div'];
    if (tracerId)
        containerOutput.push(' id="', tracerId, '"');
    containerOutput.push(" class='item output_section console_",
            type, "'>", (pre || ""), msg, (post || ""), "</div>");

    var out = getOutputElement(useOutput);
    var parentEl = out.element;
    if (parentEl.innerHTML)
        parentEl.innerHTML += containerOutput.join("");
    else
        parentEl.innerHTML = containerOutput.join("");

    //@todo this implementation is hacking the apf abstraction
    //      so we have to trigger the scrollbar update ourselves
    if (window["tabConsole"]) {
        setTimeout(function(){
            tabConsole.getPage().getElementsByTagNameNS(apf.ns.aml, "scrollbar")[0].$update();
        }, 1000);
    }
};

});
