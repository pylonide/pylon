var Sys  = require("sys"),
    Path = require("path"),
    Fs   = require("fs"),
    Spawn = require("child_process").spawn;

/**
 * compress JS or CSS
 */
apf.process.handler.compress = function(x){
    var s      = apf.settings,
        cmd    = s.parseAttribute(x.getAttribute("cmd")),
        file   = Path.normalize(s.parseAttribute(x.getAttribute("in"))),
        output = Path.normalize(s.parseAttribute(x.getAttribute("out"))),
        type   = s.parseAttribute(x.getAttribute("type"));

    if (cmd == "yuicompressor") 
    {
        var t = ["-jar",
            "yuicompressor-2.4.2.jar","--preserve-semi","--charset","utf-8",
            file,"-o", output];
        var yuic = Spawn("java", t, {cwd: Path.normalize(__dirname + "/../yuicompressor/build")});
        apf.console.log("Executing YUIC");
        yuic.stdout.on("data", function(data){
            apf.console.log("stdout: " + data);
        })
        yuic.stderr.on("data", function(data){
            apf.console.error("stderr: " + data);
        })
    }
};