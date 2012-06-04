var SandboxFs = require("./fs");

var Path = require("path");
var Fs = require("fs");

module.exports = function (workspaceDir, unixId) {
    return {
        setUp: function(callback) {
            this.fs = new SandboxFs(workspaceDir, unixId);
            
            var backup = { Path: {}, Fs: {} };
            Object.keys(Path).forEach(function (k) {
                backup.Path[k] = Path[k];
            });
            Object.keys(Fs).forEach(function (k) {
                backup.Fs[k] = Fs[k];
            });
            this.backup = backup;
            
            callback(null, this.fs);
        },
        
        tearDown: function(callback) {
            var backup = this.backup;
            
            Object.keys(backup.Path).forEach(function (k) {
                Path[k] = backup.Path[k];
            });
            Object.keys(backup.Fs).forEach(function (k) {
                Fs[k] = backup.Fs[k];
            });
            
            callback();
        }
    };
};