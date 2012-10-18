/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var editors = require("ext/editors/editors");
var dock = require("ext/dockpanel/dockpanel");
var fs = require("ext/filesystem/filesystem");
var Range = require("ace/range").Range;

/*global dbg dbgCallStack dgStack mdlDbgSources mdlDbgStack tabEditors*/

module.exports = {
    hook: function() {
        var name =  "ext/debugger/debugger";
        dock.register(name, "dbgCallStack", {
            menu : "Debugger/Call Stack",
            primary : {
                backgroundImage: ide.staticPrefix + "/ext/main/style/images/debugicons.png",
                defaultState: { x: -8, y: -47 },
                activeState: { x: -8, y: -47 }
            }
        }, function(type) {
            ext.initExtension(dbg.main);
            return dbgCallStack;
        });
    },

    init: function() {
        var _self = this;
        var modelName = "mdlDbgSources";
        var model = apf.nameserver.register("model", modelName, new apf.model());
        apf.setReference(modelName, model);
        mdlDbgSources.load("<sources/>");


        ide.addEventListener("afterfilesave", function(e) {
            if (!dbg.state)
                return;
            var path = e.node.getAttribute("path");
            var script = mdlDbgSources.queryNode("//file[@path=" + util.escapeXpathString(path) + "]");
            if (!script)
                return;

            var scriptId = script.getAttribute("scriptid");
            var value = e.value || e.doc.getValue();
            dbg.main.changeLive(scriptId, value, false, function(e) {
                //console.log("v8 updated", e);
            });
        });

        ide.addEventListener("dbg.changeFrame", function(e) {
            updateMarker(e.data);
        });

        ide.addEventListener("dbg.break", function(e) {
            _self.showDebugFrame(e.frame);
        });
        ide.addEventListener("dbg.exception", function(e) {
            _self.showDebugFrame(e.frame);
            // todo show ui for e.exception
        });

        // stack view
        modelName = "mdlDbgStack";
        model = apf.nameserver.register("model", modelName, new apf.model());
        apf.setReference(modelName, model);
        dbgCallStack.addEventListener("afterrender", function(){
            dgStack.addEventListener("afterselect", function(e) {
                e.selected && _self.showDebugFrame(e.selected);
                updateMarker(e.selected);
            });
        });

        function addMarker(session, type, row) {
            var marker = session.addMarker(new Range(row, 0, row + 1, 0), "ace_" + type, "line");
            session.addGutterDecoration(row, type);
            session["$" + type + "Marker"] = {lineMarker: marker, row: row};
        }

        function removeMarker(session, type) {
            var markerName = "$" + type + "Marker";
            session.removeMarker(session[markerName].lineMarker);
            session.removeGutterDecoration(session[markerName].row, type);
            session[markerName] = null;
        }

        function updateMarker(frame) {
            var ceEditor = editors.currentEditor && editors.currentEditor.ceEditor;
            var session = ceEditor && ceEditor.$editor.session;
            if (!session)
                return;

            session.$stackMarker && removeMarker(session, "stack");
            session.$stepMarker && removeMarker(session, "step");

            if (frame) {
                var path = ceEditor.xmlRoot.getAttribute("path");
                var framePath = frame.getAttribute("scriptPath");
                var row = parseInt(frame.getAttribute("line"), 10);
                if (frame.hasAttribute("istop")) {
                    if (path == framePath)
                        addMarker(session, "step", row);
                }
                else {
                    if (path == framePath)
                        addMarker(session, "stack", row);
                    if (dbg.topframe) {
                        framePath = dbg.topframe.getAttribute("scriptPath");
                        row = parseInt(dbg.topframe.getAttribute("line"), 10);
                        if (path == framePath)
                            addMarker(session, "step", row);
                    }
                }
            }
        }

        ide.addEventListener("dbg.changeState", function (e) {
            if (e.state != "stopped") {
                mdlDbgStack.load("<frames></frames>");
               // updateMarker();
            }
        });
        ide.addEventListener("tab.afterswitch", function(e) {
            updateMarker(dbg.activeframe);
        });
    },

    showDebugFrame: function(frame) {
        this.show({
            row: parseInt(frame.getAttribute("line"), 10),
            column: parseInt(frame.getAttribute("column"), 10),
            text: frame.getAttribute("name"),
            path: frame.getAttribute("scriptPath")
        });
    },

    showDebugFile: function(scriptId, row, column, text) {
        this.show({scriptId: scriptId, row: row, column: column, text: text});
    },

    /**
     *  show file
     *    options {path or scriptId, row, column}
     */
    show: function(options) {
        var row = options.row + 1;
        var column = options.column;
        var text = options.text || "" ;
        var path = options.path;
        var scriptId = options.scriptId;

        if (!path) {
            var script = mdlDbgSources.queryNode("//file[@scriptid='" + scriptId + "']");
            path = script && script.getAttribute("path");
        }
        else {
            var script = mdlDbgSources.queryNode("//file[@path=" + util.escapeXpathString(path) + "]");
            scriptId = script && script.getAttribute("scriptid");
        }

        if (path && path.substring(0, ide.davPrefix.length) == ide.davPrefix) {
            var file = fs.model.queryNode("//file[@path=" + util.escapeXpathString(path) + "]")
                || fs.createFileNodeFromPath(path);
            editors.jump({
                node    : file,
                row     : row,
                column  : column,
                text    : text,
                animate : false
            });
        }
        else if (scriptId) {
            var page = tabEditors.getPage(path);

            if (page) {
                editors.jump({
                    node    : page.xmlRoot,
                    page    : page,
                    row     : row,
                    column  : column,
                    text    : text,
                    animate : false
                });
            }
            else {
                var node = apf.n("<file />")
                    .attr("name", path.split("/").pop())
                    .attr("path", path)
                    .attr("contenttype", "application/javascript")
                    .attr("scriptid", scriptId)
                    .attr("debug", "1")
                    .attr("lineoffset", "0").node();

                dbg.main.loadSource(script, function(source) {
                    var doc = ide.createDocument(node, source);
                    editors.jump({
                        node    : node,
                        row     : row,
                        column  : column,
                        text    : text,
                        doc     : doc
                    });
                });
            }
        }
    }
}

});







