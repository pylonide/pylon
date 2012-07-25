/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

require("apf/elements/codeeditor");

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var dock = require("ext/dockpanel/dockpanel");
var fs = require("ext/filesystem/filesystem");
var commands = require("ext/commands/commands");


module.exports = {
    init: function() {
        var _self = this;
        var modelName = "mdlDbgSources"
        var model = apf.nameserver.register("model", modelName, new apf.model());
        apf.setReference(modelName, model);
        mdlDbgSources.load("<sources/>");

        ide.addEventListener("afterfilesave", function(e) {
            var node = e.node;
            var doc = e.doc;

            var path = node.getAttribute("path");
            var scriptId = _self.getScriptIdFromPath(path);
            if (!scriptId)
                return;

            var value = e.value || doc.getValue();
            // TODO move to dbg-node ?
            var NODE_PREFIX = "(function (exports, require, module, __filename, __dirname) { ";
            var NODE_POSTFIX = "\n});";
            dbg.main.changeLive(scriptId, NODE_PREFIX + value + NODE_POSTFIX, false, function(e) {
                //console.log("v8 updated", e);
            });
        });
        
        ide.addEventListener("dbg.changeFrame", function(e) {
            e.data && _self.showDebugFrame(e.data);
        });
        
        this.paths = {};
    },

    getScriptIdFromPath: function(path) {
        if (path.substring(0, ide.davPrefix.length) == ide.davPrefix) {
            path = ide.workspaceDir + path.substr(ide.davPrefix.length);
        }
        var file = mdlDbgSources.queryNode("//file[@scriptname='" + path + "']");
        if (!file) {
            path = path.replace(/\//g, "\\")
            file = mdlDbgSources.queryNode("//file[@scriptname='" + path + "']");
        }
        if (file)
            return file.getAttribute("scriptid");
    },

    getPathFromScriptId: function(scriptId) {
        var script = mdlDbgSources.queryNode("//file[@scriptid='" + scriptId + "']");
        if (!script)
            return;
        var path = ide.davPrefix + script.getAttribute("scriptname");
        path = path.replace(/\\/g, "/"); // windows
        return path;
    },
    
    showDebugFrame:  function(frame) {
        var row = parseInt(frame.getAttribute("line")) + 1;
        var column = parseInt(frame.getAttribute("column"));
        var text = frame.getAttribute("name");
        var path = frame.getAttribute("script");

        if (path.substring(0, ide.workspaceDir.length) == ide.workspaceDir) {
            path = ide.davPrefix + path.substr(ide.workspaceDir.length);
            // windows paths come here independantly from vfs
            path = path.replace(/\\/g, "/"); 
            
            var file = fs.model.queryNode("//file[@path='" + path + "']") 
                || fs.createFileNodeFromPath(path);
            editors.jump({
                node    : file, 
                row     : row, 
                column  : column, 
                text    : text,
                animate : false
            });
        } else {
            var scriptId = frame.getAttribute("scriptid");
            var script = mdlDbgSources.queryNode("//file[@scriptid='" + scriptId + "']");
            if (!script)
                return;
            var path = ide.davPrefix + script.getAttribute("scriptname");
            path = path.replace(/\\/g, "/"); // windows
            
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
            } else {
                var node = apf.n("<file />")
                    .attr("name", path.split("/").pop())
                    .attr("path", path)
                    .attr("contenttype", "application/javascript")
                    .attr("scriptid", script.getAttribute("scriptid"))
                    .attr("scriptname", script.getAttribute("scriptname"))
                    .attr("debug", "1")
                    .attr("lineoffset", "0").node();

                dbg.main.loadScript(script, function(source) {
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
    },
    
    showDebugFile: function(scriptId, row, column, text) {
        var file = fs.model.queryNode("//file[@scriptid='" + scriptId + "']");

        if (file) {
            
        }
        else {
           
            if (!script)
                return;

            var name = script.getAttribute("scriptname");
            var value = name.split("/").pop();

            if (name.indexOf(ide.workspaceDir) === 0) {
                var path = ide.davPrefix + name.slice(ide.workspaceDir.length);
                // TODO this has to be refactored to support multiple tabs
                var page = tabEditors.getPage(path);
                if (page)
                    var node = page.xmlRoot;
                else {
                    var node = apf.n("<file />")
                        .attr("name", value)
                        .attr("path", path)
                        .attr("contenttype", "application/javascript")
                        .attr("scriptid", script.getAttribute("scriptid"))
                        .attr("scriptname", script.getAttribute("scriptname"))
                        .attr("lineoffset", "0").node();
                }
                editors.jump({
                    node    : node, 
                    row     : row, 
                    column  : column, 
                    text    : text, 
                    animate : page ? false : true
                });
            }
            else {
                
            }
        }
    },
    
    
    $clearMarker: function () {
        if (this.$marker) {
            this.$editor.renderer.removeGutterDecoration(this.$lastRow[0], this.$lastRow[1]);
            this.$editor.getSession().removeMarker(this.$marker);
            this.$marker = null;
        }
    },

    $updateMarker: function (data) {
        this.$clearMarker();
        
        if (!data) {
            return;
        }
        
        var row = data.line;

        var range = new Range(row, 0, row + 1, 0);
        this.$marker = this.$editor.getSession().addMarker(range, "ace_step", "line");
        var type = "arrow";
        this.$lastRow = [row, type];
        this.$editor.renderer.addGutterDecoration(row, type);
        this.$editor.gotoLine(row + 1, data.column, false);
    }

}

});






  
