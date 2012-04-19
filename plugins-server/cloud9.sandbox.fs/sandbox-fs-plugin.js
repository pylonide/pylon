"use strict";

var assert = require("assert");
var SandboxFs = require("./fs");

module.exports = function setup(options, imports, register) {
    var fs = new SandboxFs(imports.sandbox);
    
    register(null, {
        "sandbox.fs": fs
    });
};