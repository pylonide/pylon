/**
 * Python Runtime Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
"use strict";

var Path = require("path");
var Plugin = require("../cloud9.core/plugin");
var util = require("util");
var netutil = require("../cloud9.core/netutil");
var EclipseClient = require("jvm_features").EclipseClient;

var ECLIPSE_START_PORT = 10000;
var name = "jvm-features";

module.exports = function setup(options, imports, register) {
    imports.ide.register(name, JVMFeatures, register);
};

var JVMFeatures = function(ide, workspace) {
    Plugin.call(this, ide, workspace);

    this.hooks = ["connect", "disconnect", "command"];
    this.name = name;
    // remove the project name
    this.workspaceDir  = Path.dirname(ide.workspaceDir);
    this.projectId = Path.basename(ide.workspaceDir);
};

util.inherits(JVMFeatures, Plugin);

(function() {

    this.command = function(user, message, client) {
        var cmd = message.command;
        if (cmd != "jvmfeatures")
            return false;

        var _self = this;
        var subCmd = (message.subcommand || "").toLowerCase();

        if (! this.eclipseClient)
          return this.$error("No eclipse session running! " + cmd+":"+subCmd+":"+message.file, 2);

        function resultSender(data) {
            if (! data.success)
                console.error("Could not execute " + subCmd + " request");
            _self.sendResult(0, cmd + ":" + subCmd, {
                success: data.success,
                body: data.body || null
            });
        }

        var res = true;
        switch (subCmd) {
            case "complete":
                this.eclipseClient.codeComplete(this.projectId, message.file, message.offset,
                  resultSender);
              break;

            // get locations of a variable or funcion call in the same file
            case "get_locations":
                this.eclipseClient.getLocations(this.projectId, message.file, message.offset, message.length,
                  function(data) {
                    var matches = data.body || [];
                    data.body = {
                        uses: matches.filter(function(match) {
                            return match.type == "reference";
                        }),
                        declarations: matches.filter(function(match) {
                            return match.type == "declaration";
                        })
                    };
                    resultSender(data);
                });
              break;

            // Do refactoring
            case "refactor":
                this.eclipseClient.refactor(this.projectId, message.file,
                    message.newname, message.offset, message.length, resultSender);
              break;

            case "outline":
                this.eclipseClient.outline(this.projectId, message.file, resultSender);
                break;

            case "code_format":
                this.eclipseClient.codeFormat(this.projectId, message.file, resultSender);
                break;

            case "analyze_file":
              this.eclipseClient.analyzeFile(this.projectId, message.file, resultSender);
                break;

            case "hierarchy":
              this.eclipseClient.hierarchy(this.projectId, message.file, message.offset,
                  message.type, resultSender);
                break;

            case "build":
              this.eclipseClient.buildProject(this.projectId, resultSender);
                break;

            case "navigate":
              this.eclipseClient.navigate(this.projectId, message.file, message.navType,
                  message.offset, message.length, resultSender);
                break;

            default:
                res = false;
                break;
        }
        return res;
    };

    this.$error = function(message, code, data) {
        this.ide.broadcast(JSON.stringify({
            "type": "error",
            "message": message,
            "code": code || 0,
            "data": data || ""
        }), this.name);
    };

    // TODO: start only in case of a java project
    this.connect = function(user, client) {
        var _self = this;

        //  init the eclipse instance for that user
        netutil.findFreePort(ECLIPSE_START_PORT, 64000, "localhost",
          function(err, port) {
            if (err)
              return _self.$error("Could not find a free port", 1, err);
            var eclipseClient = _self.eclipseClient  = new EclipseClient("localhost", port,
               _self.workspaceDir);
            eclipseClient.on("output", console.log);
            eclipseClient.on("err", console.error);
            eclipseClient.initEclipseSession();
        });
        return true;
    };

    this.disconnect = function(user, client) {
        if (this.eclipseClient) {
          this.eclipseClient.disconnect();
          this.eclipseClient = null;
          console.log("Eclipse session disposed");
        }
        return true;
    };

    this.dispose = function(callback) {
        callback();
    };

}).call(JVMFeatures.prototype);
