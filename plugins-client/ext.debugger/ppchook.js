/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global dbg */

define(function(require, exports, module) {
var ide = require("core/ide");

window.adbg = {
    exec : function(method, args, callback, options) {
        if (method == "loadSource") {
            var dbg = args[0].main;
            var script = args[1];
            dbg.loadSource(script, function(source) {
                if (options && options.callback) {
                    options.callback(ppc.escapeXML(source), ppc.SUCCESS);
                }
                else {
                    // callback("<file>" + ppc.escapeXML(source) + "</file>", ppc.SUCCESS);
                    // TODO: ugly text() bug workaround
                    callback("<file><![CDATA[" + source.replace("]]>", "]] >") + "]]></file>", ppc.SUCCESS);
                }
            });
        }
        else if (method == "loadObject") {
            var dbg = args[0].main;
            var item = args[1];

            dbg.loadObject(item, function(xml) {
                if (options && options.callback) {
                    options.callback(xml, ppc.SUCCESS);
                }
                else {
                    callback(xml, ppc.SUCCESS);
                }
            });
        }
        else if (method == "loadFrame") {
            var dbg = args[0].main;
            var frame = args[1];

            dbg.loadFrame(frame, function(xml) {
                if (options && options.callback) {
                    options.callback(xml, ppc.SUCCESS);
                }
                else {
                    callback(xml, ppc.SUCCESS);
                }
            });
        }
    }
};

(ppc.$asyncObjects || (ppc.$asyncObjects = {}))["adbg"] = 1;


module.exports = {
    // registers global objects needed for ppc ui elements
    registerDebugger: function(_debugger) {
        if (window.dbg)
            return;
        new ppc.state({
            "id" : "dbg"
        });

        dbg.main = _debugger;
        dbg.breakpoints = _debugger.breakpoints;
        dbg.sources = _debugger.sources;

        ide.addEventListener("dbg.changeState", function(e) {
            ppc.xmldb.setAttribute(dbg, "state", e.state || false);
        });

        ide.addEventListener("dbg.changeFrame", function(e) {
            ppc.xmldb.setAttribute(dbg, "activeframe", e.data || false);
            dbg.topframe = e.data || null;
        });
    }
}

});

