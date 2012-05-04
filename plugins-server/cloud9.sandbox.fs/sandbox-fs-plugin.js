"use strict";

var assert = require("assert");
var SandboxFs = require("./fs");

module.exports = function setup(options, imports, register) {
    
    imports.sandbox.getProjectDir(function (err, projectDir) {
        if (err) return register(err);
        
        imports.sandbox.getUnixId(function (err, unixId) {
            if (err) return register(err);
            
            var fs = new SandboxFs(projectDir, unixId);
            
            register(null, {
                "sandbox.fs": fs
            });
        });
    });
};