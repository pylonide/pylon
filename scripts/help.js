
var PATH = require("path");
var FS = require("fs");


exports.main = function(options) {

    var TERM = options.TERM;
    
    var readmePath = PATH.join(__dirname, "../HELP.md");
    var readme = FS.readFileSync(readmePath).toString();
    
//    // TODO: Use proper markdown parsing here.
//    var workflow = readme.match(/\n\nWorkflow:\n\n([\s\S\n]*?)\n\n/);

    TERM.stdout.writenl("  " + readme.replace(/(^\n*|\n*$)/g, "").split("\n").join("\n  "));
}
