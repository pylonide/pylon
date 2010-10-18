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
            "lib/yuicompressor/build/yuicompressor-2.4.2.jar","--preserve-semi","--charset","utf-8",
            file,"-o",output];
        console.log(t);
        var yuic = Spawn("java",t);
        apf.console.log("Executing YUIC");
        yuic.stdout.on('data',function(data){
            console.log("stdout: " + data);
        })
        yuic.stderr.on('data',function(data){
            console.log("stderr: " + data);
        })
    }
};