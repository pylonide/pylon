require("./paths");
var Sys   = require("sys"),
    Fs    = require("fs"),
    Path  = require("path");

if (module === require.main) {
    if (!Path.existsSync(__dirname + "/support/apf")) {
        console.log("Setting up path to Ajax.org Platform (apf)");
        require("child_process").exec("ln -s " + Path.normalize(__dirname + "/../apf") + " " + __dirname + "/support/apf", function(err) {
            if (err) {
                console.log("ERROR: could not create symlink: ", err);
                return process.exit(1);
            }
            boot();
        });
    }
    else
        boot();
}


function boot() {
    require("apf-node");
    
    require("proc");
    require("files");
    require("defines");
    require("xslt");
    require("proc/combine");
    require("proc/compress");
    require("proc/encoder");
    require("proc/inline");
    require("proc/docgen");
    //require("proc/vcs");
    
    var argv = process.argv;

    var project = (argv.length == 3) ? argv[2] : "apf_release.apr";
    Sys.puts("using file: " + __dirname + "/projects/" + project);

    if (!Path.existsSync(project)) {
        project = __dirname + "/projects/" + project;
        if (!Path.existsSync(project)) {
            console.log("ERROR: unable to find project file");
            return process.exit(1);
        }
    }
    apf.ProcParser.parse(Fs.readFileSync(project, "utf8"));
    setTimeout(function(){process.exit();}, 1000);
}
