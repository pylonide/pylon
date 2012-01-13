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
                    options.callback(apf.escapeXML(source), apf.SUCCESS);
                }
                else {
                    // callback("<file>" + apf.escapeXML(source) + "</file>", apf.SUCCESS);
                    // TODO: ugly text() bug workaround
                    callback("<file><![CDATA[" + source.replace("]]>", "]] >") + "]]></file>", apf.SUCCESS);
                }
            });
        }
        else if (method == "loadObject") {
            var dbg = args[0].main;
            var item = args[1];

            dbg.loadObject(item, function(xml) {
                if (options && options.callback) {
                    options.callback(xml, apf.SUCCESS);
                }
                else {
                    callback(xml, apf.SUCCESS);
                }
            });
        }
        else if (method == "loadFrame") {
            var dbg = args[0].main;
            var frame = args[1];

            dbg.loadFrame(frame, function(xml) {
                if (options && options.callback) {
                    options.callback(xml, apf.SUCCESS);
                }
                else {
                    callback(xml, apf.SUCCESS);
                }
            });
        }
    }
};

(apf.$asyncObjects || (apf.$asyncObjects = {}))["adbg"] = 1;


module.exports = {
    // registers global objects needed for apf ui elements
    registerDebugger: function(_debugger) {
        if (window.dbg)
            return;
        new apf.state({
            "id" : "dbg"
        });

        dbg.main = _debugger;
        dbg.breakpoints = _debugger.breakpoints;
        dbg.sources = _debugger.sources;

        ide.addEventListener("dbg.changeState", function(e) {
            apf.xmldb.setAttribute(dbg, "state", e.state || false);
        });

        ide.addEventListener("dbg.changeFrame", function(e) {
            apf.xmldb.setAttribute(dbg, "activeframe", e.data || false);
            dbg.topframe = e.data || null;
        });
    }
}

});

