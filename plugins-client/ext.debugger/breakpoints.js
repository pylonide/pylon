/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var dock   = require("ext/dockpanel/dockpanel");
var commands = require("ext/commands/commands");


module.exports = {
    hook: function() {
        var _self = this;
        // register model
        var modelName = "mdlDbgBreakpoints"
        this.model = apf.nameserver.register("model", modelName, new apf.model());
        apf.setReference(modelName, this.model);
        mdlDbgBreakpoints.load("<breakpoints/>");
        
        ide.addEventListener("settings.load", function (e) {
            // restore the breakpoints from the IDE settings
            var bpFromIde = e.model.data.selectSingleNode("//breakpoints");
            // not there yet, create element
            if (!bpFromIde) {
                bpFromIde = e.model.data.ownerDocument.createElement("breakpoints");
                e.model.data.appendChild(bpFromIde);
            }
            // bind it to the Breakpoint model
            mdlDbgBreakpoints.load(bpFromIde);
            _self.$syncOpenFiles();
        });

        // register dock panel
        var name =  "ext/debugger/debugger";
        dock.register(name, "dbgBreakpoints", {
            menu : "Debugger/Breakpoints",
            primary : {
                backgroundImage: ide.staticPrefix + "/ext/main/style/images/debugicons.png",
                defaultState: { x: -8, y: -88 },
                activeState: { x: -8, y: -88 }
            }
        }, function(type) {
            ext.initExtension(dbg.main);
            return dbgBreakpoints;
        });
        
        ide.addEventListener("afterfilesave", function(e) {
            var page = e.nextPage;
            if (!page || !page.$editor || !page.$editor.ceEditor)
                return;
            var ace = page.$editor.ceEditor.$editor         
            if (ace.session.$breakpoints.length)
                _self.updateBreakpointModel(session);
        });
        
        ide.addEventListener("tab.afterswitch", function(e) {
            var page = e.nextPage;
            if (!page || !page.$editor || !page.$editor.ceEditor)
                return;
            var ace = page.$editor.ceEditor.$editor
            if (!ace.$breakpointListener)
                _self.initEditor(ace);
            
            if (!ace.session.$breakpointListener)
                _self.initSession(ace.session);

            _self.updateSession(ace.session, page.$doc.getNode());
        });
    },

    init: function() {
        var _self = this;
        dbgBreakpoints.addEventListener("afterrender", function() {
            lstBreakpoints.addEventListener("afterselect", function(e) {
                if (e.selected) {
                    _self.gotoBreakpoint(e.selected)
                }
            });
            
            lstBreakpoints.addEventListener("aftercheck", function(e) {
                _self.setBreakPointEnabled(e.xmlNode, 
                    apf.isTrue(e.xmlNode.getAttribute("enabled")));
            });
        });

        dbgBreakpoints.addEventListener("dbInteractive", function(){
            lstScripts.addEventListener("afterselect", function(e) {
                e.selected && _self.gotoBreakpoint(e.selected);
            });
        });
    },
    
    initEditor: function(editor) {
        var _self = this;
        //todo this breaks annotation tooltip
        //var el = document.createElement("div");
        //editor.renderer.$gutter.appendChild(el);
        //el.style.cssText = "position:absolute;top:0;bottom:0;left:0;width:18px;cursor:pointer"
        
        editor.on("guttermousedown", editor.$breakpointListener = function(e) {
            if (!editor.isFocused())
                return;
            var gutterRegion = editor.renderer.$gutterLayer.getRegion(e);
            if (gutterRegion != "markers")
                return;
            var row = e.getDocumentPosition().row;

            var session = editor.session;
            var bp = session.getBreakpoints()[row];
            var i = bp ? bp.indexOf("disabled") == -1 ? 1 : 2 : 0;
            if (e.getShiftKey())
                i = (i + 1) %3;
            bp = [" ace_breakpoint ", " ace_breakpoint disabled ", null][i];

            session.setBreakpoint(row, bp);
            _self.updateBreakpointModel(session);
        });
    },
    initSession: function(session) {
        session.$breakpointListener = function(e) {
        	var delta = e.data;
			var range = delta.range;
			var len, firstRow, f1;
            
            if (range.end.row == range.start.row)
                return;
			
            len = range.end.row - range.start.row;
			if (delta.action == "insertText") {
				firstRow = range.start.column == 0 ? range.start.row: range.start.row + 1;
			} else {
				firstRow = range.start.row;
			}

			if (len > 0) {
				args = Array(len);
				args.unshift(firstRow, 0);
				this.$breakpoints.splice.apply(this.$breakpoints, args);
            } else if (len < 0) {
                var rem = this.$breakpoints.splice(firstRow + 1, -len);
				
                if(!this.$breakpoints[firstRow]){
					for (var i in rem)
						if (rem[i]) {
							this.$breakpoints[firstRow] = rem[i];
							break;
						}
				}
			}
        }.bind(session);
        session.on("change", session.$breakpointListener);
    },
    updateSession: function(session, node) {
        var rows = [];
        if (node) {
            var path = node.getAttribute("path");
            var breakpoints = mdlDbgBreakpoints.queryNodes("//breakpoint[@path='" + path + "']");

            for (var i=0; i< breakpoints.length; i++) {
                var bp = breakpoints[i]
                var line = parseInt(bp.getAttribute("line"), 10);
                var offset = parseInt(bp.getAttribute("lineoffset"), 10);
                var enabled = apf.isTrue(bp.getAttribute("enabled"));
                rows[line] = " ace_breakpoint " + (enabled ? "" : "disabled ");
            }
        }
        session.setBreakpoints(rows);
    },
    
    gotoBreakpoint: function(bp) {
        var line = parseInt(bp.getAttribute("line"), 10);
        var column = parseInt(bp.getAttribute("column"), 10);
        if (isNaN(line)) line = null;
        if (isNaN(column)) column = null;
        var scriptPath = bp.getAttribute("scriptPath");
        
        
        
    },
    
    removeBreakpoint: function(path, row) {
        var bp = mdlDbgBreakpoints.queryNode("breakpoint[@path='" + path
            + "' and @line='" + row + "']");
        bp && apf.xmldb.removeNode(bp);
    },
    
    addBreakpoint: function(path, row, content) {
        var displayText = path;
        var tofind = ide.davPrefix;
        if (path.indexOf(tofind) > -1) {
            displayText = path.substring(path.indexOf(tofind) + tofind.length);
        }

        var bp = apf.n("<breakpoint/>")
            .attr("path", path)
            .attr("line", row)
            .attr("text", displayText + ":" + (row + 1))
            .attr("lineoffset", 0)
            .attr("content", content)
            .attr("enabled", "true")
            .node();
        mdlDbgBreakpoints.appendXml(bp);
    },
    
    removeBreakpoint: function(path, row) {
        var bp = mdlDbgBreakpoints.queryNode("breakpoint[@path='" + path
            + "' and @line='" + row + "']");
        bp && apf.xmldb.removeNode(bp);
    },
    
    updateBreakpointModel: function(session) {
        var path = session.c9doc.getNode().getAttribute("path");
        var breakpoints = session.$breakpoints;
        var displayText = path;
        var tofind = ide.davPrefix;
        if (path.indexOf(tofind) == 0)
            displayText = path.substring(tofind.length + 1);
        
        var bpList = mdlDbgBreakpoints.queryNodes("breakpoint[@path='" + path + "']");
        for (var i = bpList.length; i--; ) {
            apf.xmldb.removeNode(bpList[i]);
        }
        // iterate over sparse array
        breakpoints.forEach(function(breakpoint, row) {
            if (!breakpoint)
                return
            var bp = apf.n("<breakpoint/>")
                .attr("path", path)
                .attr("line", row)
                .attr("text", displayText + ":" + (+row + 1))
                .attr("lineoffset", 0)
                .attr("content", session.getLine(row))
                .attr("enabled", breakpoint.indexOf("disabled") == -1)
                .node();
            mdlDbgBreakpoints.appendXml(bp);
        })
    },
    
    setBreakPointEnabled : function(node, value){
        node.setAttribute("enabled", value ? true : false);
    },
    
    $syncOpenFiles: function() {
        
        return
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
    }
}

});
