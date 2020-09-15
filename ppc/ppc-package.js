// used by ppc-node below
XPath = require('xpath');
DOMParser = require('xmldom').DOMParser;

var Fs = require("fs");

boot();

function boot() {
    require("./platform/ppc-node");

    require("./lib/proc");
    require("./lib/files");
    require("./lib/defines");
    require("./lib/xslt");
    require("./lib/proc/combine");
    require("./lib/proc/compress");
    require("./lib/proc/encoder");
    require("./lib/proc/inline");
    require("./lib/proc/docgen");
    //require("proc/vcs");

    var argv = process.argv;

    var project = (argv.length == 3) ? argv[2] : "default.ppp";
    console.log("using file: " + __dirname + "/projects/" + project);

    if (!Fs.existsSync(project)) {
        project = __dirname + "/projects/" + project;
        if (!Fs.existsSync(project)) {
            console.log("ERROR: unable to find project file");
            return process.exit(1);
        }
    }
    ppc.ProcParser.parse(Fs.readFileSync(project, "utf8"));
    ppc.unload();
}
