var registerIdePlugin = require("./run-shell-ide");
var RunShell = require("./run-shell");
var fsnode = require("vfs-nodefs-adapter");

module.exports = function (options, imports, register) {
    var runShell = new RunShell(imports["process-manager"], fsnode(imports.vfs), imports.eventbus);
    
    registerIdePlugin(runShell, imports.ide, imports.eventbus, function (err) {
        if (err) {
            return register(err);
        }
        
        register();
    });
};