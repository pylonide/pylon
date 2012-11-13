/**
 * Shell Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 */

"use strict";

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");

var cmdId = 0;

module.exports = ext.register("ext/shell/shell", {
    dev        : "Ajax.org",
    name       : "Save",
    alone      : true,
    type       : ext.GENERAL,
    offline    : true,
    nodes      : [],

    commands: {
        cd : {
            hint: "change working directory",
            commands: {
                "[PATH]": { hint: "path pointing to a folder. Autocomplete with [TAB]" }
            }
        },
        ls : {
            hint: "list directory contents",
            commands: {
                "[PATH]": { hint: "path pointing to a folder. Autocomplete with [TAB]" }
            }
        },
        rm : {
            hint: "remove a file",
            commands: {
                "[PATH]": { hint: "path pointing to a folder. Autocomplete with [TAB]" }
            }
        }
    },

    hook: function() {
        //this.processCount = 0;
    },

    execute: function(data) {
        data.id = cmdId++;
        data.type = "run";
        ide.send(data);
    },

    canShutdown: function() {
        //return this.processCount === 0;
    }
});
});
