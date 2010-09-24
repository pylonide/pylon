var yuicompressor = "java -jar /var/lib/packager/yuicompressor-2.4.2/build/yuicompressor-2.4.2.jar --preserve-semi --charset utf-8 %s -o %s";

var Sys  = require("sys"),
    Path = require("path"),
    Fs   = require("fs"),
    Exec = require("child_process").exec;

/**
 * compress JS or CSS
 */
apf.process.handler.compress = function(x){
    var s      = apf.settings,
        cmd    = s.parseAttribute(x.getAttribute("cmd")),
        file   = Path.normalize(s.parseAttribute(x.getAttribute("in"))),
        output = Path.normalize(s.parseAttribute(x.getAttribute("out"))),
        type   = s.parseAttribute(x.getAttribute("type"));

    if (cmd == "yuicompressor") {
        var command = "java -jar " + __dirname
            + "/../yuicompressor/build/yuicompressor-2.4.2.jar --preserve-semi --charset utf-8 "
            + file + " -o " + output;
        apf.console.log("Executing command: " + command);
        var yuic = Exec(command,
            function (error, stdout, stderr) {
                if (stdout && stdout.length)
                    console.log("stdout: " + stdout);
                if (stderr && stderr.length)
                    console.log("stderr: " + stderr);
                if (error !== null) {
                    console.log("exec error: " + error);
            }
        });
    }
};