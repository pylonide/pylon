/**
 * Build Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var util = require("core/util");
var editors = require("ext/editors/editors");
var Range = require("ace/range").Range;
var ideConsole = require("ext/console/console");
var markup = require("text!ext/build/build.xml");

var calculatePosition = function(doc, offset) {
    var row = 0, column, newLineLength = doc.getNewLineCharacter().length;;
    while (offset > 0) {
      offset -= doc.getLine(row++).length;
      offset -= newLineLength; // consider the new line character(s)
    }
    if (offset < 0) {
      row--;
      offset += newLineLength; // add the new line again
      column = doc.getLine(row).length + offset;
    } else {
      column = 0;
    }
    return {
      row: row,
      column: column
    };
};

module.exports = ext.register("ext/build/build", {
    name     : "Build projects",
    dev      : "Ajax.org",
    type     : ext.GENERAL,
    alone    : true,
    offline  : false,
    markup   : markup,
    commands  : {
        "build": {hint: "build a project and show all errors and warnings"}
    },
    pageTitle: "Problems",
    pageID   : "pgBuildProblems",
    hotitems : {},

    nodes    : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            menus.addItemByPath("Edit/~", new apf.divider()),
            menus.addItemByPath("Edit/Build project", new apf.item({
                onclick : function() {
                    _self.execBuild();
                }
            }))
        );

        this.hotitems.build = [this.nodes[1]];
        ext.initExtension(this);
    },

    init : function(amlNode) {
        var _self = this;

        ide.addEventListener("socketMessage", function(e) {
            var message = e.message;
            if (message.subtype == "jvmfeatures:build") {
                _self.execBuild(true);
                var msg = message.body;
                if (! msg.success) {
                    var err = "Build failed with runtime errors !!";
                    console.error(err);
                    trDGBuild.setAttribute("empty-message", err);
                    return;
                }
                var problems = msg.body;
                // if no problems at all, show the build succeeded message
                if (problems.length == 0) {
                    trDGBuild.setAttribute("empty-message", "Build succeeded");
                } else {
                    var filterType = function(type) {
                        return problems.filter(function(problem){
                            return problem.type == type;
                        });
                    };
                    var sortedProblems = filterType("error").concat(filterType("warning"));
                    var problemsXML = _self.problemsJsonToXml(sortedProblems);
                    _self.$model.load(apf.getXml('<problems>' + problemsXML + '</problems>'));
                }
            }
        });
        /*trBuildHbox.addEventListener("afterrender", function(){
            trDGBuild.addEventListener("afterchoose", function(e) {
                var path,
                    root = trFiles.xmlRoot.selectSingleNode("folder[1]"),
                    node = trSFResult.selected,
                    line = 0,
                    text = "";
                if (node.tagName == "d:maxreached" || node.tagName == "d:querydetail")
                    return;
                if (node.tagName == "d:excerpt") {
                    path = node.parentNode.getAttribute("path");
                    line = node.getAttribute("line");
                    text = node.parentNode.getAttribute("query");
                }
                else {
                    path = node.getAttribute("path");
                    text = node.getAttribute("query");
                }
                editors.showFile(root.getAttribute("path") + "/" + path, line, 0, text);
            });
        });*/
        //ideConsole.show();
    },

    problemsJsonToXml: function(problems) {
        function escape(str) {
            return str.replace(/"/g, "'")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        }
        var xmlS = [];
        var filePrefix = '/' + window.cloud9config.projectName + '/';
        for (var i = 0; i < problems.length; i++) {
            var elem = problems[i];
            xmlS.push('<problem');
                xmlS.push(' icon="'); xmlS.push(elem.type || "warning");
                xmlS.push('" desc="'); xmlS.push(escape(elem.message));
                xmlS.push('" path="'); xmlS.push(filePrefix); xmlS.push(elem.file);
                xmlS.push('" file="'); xmlS.push(elem.file.substring(elem.file.lastIndexOf('/')+1));
                xmlS.push('" line="') && xmlS.push(elem.line);
                xmlS.push('" offset="') && xmlS.push(elem.offset);
                xmlS.push('" length="') && xmlS.push(elem.length);
                xmlS.push('"/>\n');
        }
        return xmlS.join('');
    },

    execBuild: function(noRequest) {
        var _self = this;
        // show the console (also used by the debugger):
        ideConsole.show();
        if (!this.$panel) {
            this.$panel = tabConsole.add(this.pageTitle, this.pageID);
            this.$panel.setAttribute("closebtn", true);
            this.$panel.appendChild(trBuildHbox);
            trBuildHbox.show();
            trDGBuild.setProperty("visible", true);
            this.$model = mdlProblems;
            // make sure the tab is shown when results come in
            this.$model.addEventListener("afterload", function() {
                tabConsole.set(_self.pageID);
            });

            this.$panel.addEventListener("afterclose", function(){
                this.removeNode();
                return false;
            });
        }

        // show the tab
        tabConsole.set(this.pageID);

        var projectName = window.cloud9config.projectName;
        trDGBuild.setAttribute("empty-message", "Building '" + projectName + "'...");
        this.$model.clear();

        if (! noRequest) {
            // send build request
            var command = {
              command : "jvmfeatures",
              subcommand : "build",
              project: projectName
            };
            ide.send(JSON.stringify(command));
        }
    },

    jumpTo: function(el) {
        setTimeout(function() {
            // a source file is available
            var path = el.getAttribute("path");
            var line = el.getAttribute("line");
            var offset = el.getAttribute("offset");
            var length = el.getAttribute("length");
            if (path) {
                // open the file (if not already open) and switch focus
                var filepath = path.replace("/" + window.cloud9config.projectName, window.cloud9config.davPrefix);
                editors.showFile(filepath, line, 0);
                /*
                var editor = editors.currentEditor.ceEditor.$editor;
                var doc = editor.getSession().getDocument();
                var pos = calculatePosition(doc, offset);
                var range = new Range(line, pos.column, line, pos.column + length);
                editor.selection.setSelectionRange(range);
                editor.centerSelection();
                */
            }
        });
    },

    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

});
