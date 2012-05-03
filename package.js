require("asyncjs");

// used by apf-node below
XMLParser = require('libxml/lib/libxml');

require("apf");
require("node-o3-xml");
require("node-o3-xml-v4");

var Util   = require("util"),
    Fs    = require("fs"),
    Path  = require("path");

boot();

function boot() {
    require("apf/apf-node");

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

    var project = (argv.length == 3) ? argv[2] : "apf_release.apr";
    Util.puts("using file: " + __dirname + "/projects/" + project);

    if (!Path.existsSync(project)) {
        project = __dirname + "/projects/" + project;
        if (!Path.existsSync(project)) {
            console.log("ERROR: unable to find project file");
            return process.exit(1);
        }
    }
    apf.ProcParser.parse(Fs.readFileSync(project, "utf8"));
    setTimeout(function(){process.exit();}, 1000); // we want to remove this, but the process is hanging. investigate with bert and ben
}
