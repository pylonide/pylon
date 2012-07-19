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
var editors = require("ext/editors/editors");
var ideConsole = require("ext/console/console");
var markup = require("text!ext/buildproject/buildproject.xml");

module.exports = ext.register("ext/buildproject/buildproject", {
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

    hook : function() {
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
            if (message.subtype == "buildproject") {
                _self.execBuild(true);
                var msg = message.body;
                if (! msg.success) {
                    var err = "Build failed with runtime errors !!";
                    console.error(err);
                    trDGBuild.setAttribute("empty-message", err);
                    return;
                }
                var problems = msg.body || [];
                // if no problems at all, show the build succeeded message
                var errors = [];
                var warnings = [];
                if (problems.length === 0) {
                    trDGBuild.setAttribute("empty-message", "Build succeeded");
                } else {
                    var filterType = function(type) {
                        return problems.filter(function(problem){
                            return problem.type == type;
                        });
                    };
                    errors = filterType("error");
                    warnings = filterType("warning");
                    var sortedProblems = errors.concat(warnings);
                    var problemsXML = _self.problemsJsonToXml(sortedProblems);
                    _self.$model.load(apf.getXml('<problems>' + problemsXML + '</problems>'));
                }
                
                var srcPath, binPath, srcPostfix, binPostfix;
                var jpType = ["java", "gae-java", "java-web"].indexOf(ddRunnerSelector.value);
                if (jpType > -1) {
                    srcPath = "src";
                    binPath = "bin";
                    srcPostfix = "java";
                    binPostfix = "class";
                }
                if (jpType > 0)
                    binPath = "war/WEB-INF/classes";
                ide.dispatchEvent("projectbuilt", {
                    errors: errors,
                    warnings: warnings,
                    srcPath: srcPath,
                    binPath: binPath,
                    srcPostfix: srcPostfix,
                    binPostfix: binPostfix
                });
            }
        });

        ide.addEventListener("buildproject", function (e) {
            _self.execBuild();
        });
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
              command : "buildproject",
              // TODO: ddRunnerSelector.value
              // Sometimes ddRunnerSelector isn't defined
              runner: "java"
            };
            ide.send(command);
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
