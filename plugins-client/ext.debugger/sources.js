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
var Range = require("ace/range").Range

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
        var modelName = "mdlDbgSources"
        var model = apf.nameserver.register("model", modelName, new apf.model());
        apf.setReference(modelName, model);
        mdlDbgSources.load("<sources/>");
        

        ide.addEventListener("afterfilesave", function(e) {
            if (!dbg.state)
                return;
            var path = e.node.getAttribute("path");
            var scriptId = _self.getScriptIdFromPath(path);
            if (!scriptId)
                return;

            var value = e.value || e.doc.getValue();
            dbg.main.changeLive(scriptId, value, false, function(e) {
                //console.log("v8 updated", e);
            });
        });
        
        ide.addEventListener("dbg.changeFrame", function(e) {
            e.data && _self.showDebugFrame(e.data);
        });
        
        this.paths = {};
        
        // stack view
        modelName = "mdlDbgStack";
        model = apf.nameserver.register("model", modelName, new apf.model());
        apf.setReference(modelName, model);
        dbgCallStack.addEventListener("afterrender", function(){
            dgStack.addEventListener("afterselect", function(e) {
                e.selected && _self.showDebugFrame(e.selected);
            });
        });
        
        ide.addEventListener("dbg.changeState", function (e) {
            if (e.state != "stopped") {
                mdlDbgStack.load("<frames></frames>");
                
            }
        });
        ide.addEventListener("tab.afterswitch", function(e) {
            var page = e.nextPage;
            if (!page || !page.$editor || !page.$editor.ceEditor)
                return;
            var ace = page.$editor.ceEditor.$editor
            if (!ace.$breakpointListener)
                _self.$updateMarker()
        });
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
        
        
        ceEditor.$editor.session.addMarker(
            new Range(3,0,4,0),
            "ace_step","line"    
        )
        ceEditor.$editor.session.addMarker(
            new Range(3,0,4,0),
            "ace_stack","line"    
        )
        ceEditor.$editor.renderer.addGutterDecoration(3, "stack")
        ceEditor.$editor.renderer.addGutterDecoration(3, "step")
        ceEditor.$editor.renderer.addGutterDecoration(4, "step")
    }

}

});






  
