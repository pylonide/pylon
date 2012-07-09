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
var dock   = require("ext/dockpanel/dockpanel");
var commands = require("ext/commands/commands");
var fs = require("ext/filesystem/filesystem");
var noderunner = require("ext/noderunner/noderunner");


module.exports = {
    init: function() {
        var _self = this;
        var modelName = "mdlDbgSources"
        var model = apf.nameserver.register("model", modelName, new apf.model());
        apf.setReference(modelName, model);
        mdlDbgSources.load("<sources/>");
        
        
        mdlDbgSources.addEventListener("afterload", function() {
            _self.$syncTree();
        });
        mdlDbgSources.addEventListener("update", function(e) {
            if (e.action !== "add") return;

            // TODO: optimize this!
            _self.$syncTree();
        });
        fs.model.addEventListener("update", function(e) {
            if (e.action != "insert")
                return;
            // TODO: optimize this!
            _self.$syncTree();
        });

        ide.addEventListener("afterfilesave", function(e) {
            var node = e.node;
            var doc = e.doc;

            var scriptId = node.getAttribute("scriptid");
            if (!scriptId)
                return;

            var value = e.value || doc.getValue();
            var NODE_PREFIX = "(function (exports, require, module, __filename, __dirname) { ";
            var NODE_POSTFIX = "\n});";
            dbg.changeLive(scriptId, NODE_PREFIX + value + NODE_POSTFIX, false, function(e) {
                //console.log("v8 updated", e);
            });
        });
        
        this.paths = {};
    },
    
    getScriptIdFromPath: function() {
    
    },
    
    getPathFromScriptId: function() {
    
    },
    
    
    
    $syncTree: function() {
        if (this.inSync) return;
        this.inSync = true;
        var dbgFiles = mdlDbgSources.data.childNodes;

        var workspaceDir = ide.workspaceDir;
        for (var i=0,l=dbgFiles.length; i<l; i++) {
            var dbgFile = dbgFiles[i];
            var name = dbgFile.getAttribute("scriptname");
            if (name.indexOf(workspaceDir) !== 0)
                continue;
            this.paths[name] = dbgFile;
        }
        var treeFiles = fs.model.data.getElementsByTagName("file");
        var tabFiles = ide.getAllPageModels();
        var files = tabFiles.concat(Array.prototype.slice.call(treeFiles, 0));

        var davPrefix = ide.davPrefix;
        for (var i=0,l=files.length; i<l; i++) {
            var file = files[i];
            var path = file.getAttribute("scriptname");

            var dbgFile = this.paths[path];
            if (dbgFile)
                apf.b(file).attr("scriptid", dbgFile.getAttribute("scriptid"));
        }
        this.inSync = false;
    },
    
    showDebugFile: function(scriptId, row, column, text) {
        var file = fs.model.queryNode("//file[@scriptid='" + scriptId + "']");

        // check prerequisites
        if (editors.currentEditor && !editors.currentEditor.amlEditor.$updateMarkerPrerequisite()) {
            return;
        }

        if (file) {
            editors.jump({
                node    : file, 
                row     : row, 
                column  : column, 
                text    : text,
                animate : false
            });
        }
        else {
            var script = mdlDbgSources.queryNode("//file[@scriptid='" + scriptId + "']");
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
                var page = tabEditors.getPage(value);
                if (page)
                    editors.jump({
                        node    : page.xmlRoot, 
                        doc     : page.$doc,
                        row     : row, 
                        column  : column, 
                        text    : text, 
                        animate : false
                    });
                else {
                    var node = apf.n("<file />")
                        .attr("name", value)
                        .attr("path", name)
                        .attr("contenttype", "application/javascript")
                        .attr("scriptid", script.getAttribute("scriptid"))
                        .attr("scriptname", script.getAttribute("scriptname"))
                        .attr("debug", "1")
                        .attr("lineoffset", "0").node();

                    dbg.loadScript(script, function(source) {
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
    },

}

});
