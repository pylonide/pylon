require("./paths");
require("apf");

require("proc");
require("files");
require("defines");
require("xslt");
require("proc/combine");
require("proc/compress");
require("proc/encoder");
require("proc/inline");
require("proc/docgen");

var Sys   = require("sys"),
    Fs    = require("fs");

if (module === require.main) {
    var argv = process.argv;

    var project = (argv.length == 3) ? argv[2] : "apf_release.apr";
    Sys.puts("using file: " + __dirname + "/projects/" + project);

    apf.ProcParser.parse(Fs.readFileSync(__dirname + "/projects/" + project, "utf8"));
//    if (argv.length == 4 && argv[2] == "-c")
//        var config = require("./config/" + argv[3])
//    else
//        var config = require("./config/devel")

}
