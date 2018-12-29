var Path = require("path"),
    Fs   = require("fs"),
    Exec = require("child_process").exec;

/**
 * Version Control System handler
 */
apf.process.handler.vcs = function(x){
    var s       = apf.settings,
        type    = s.parseAttribute(x.getAttribute("type")),
        cmd     = s.parseAttribute(x.getAttribute("cmd")),
        repo    = Path.normalize(s.parseAttribute(x.getAttribute("repository"))),
        command = null;
        
    switch (type) {
        case "svn":
        case "subversion":
            command = "cd " + repo + " && svn " + cmd;
            break;
        case "git":
            command = "cd " + repo + " && git " + cmd;
            break;
        case "cvs":
            break;
        case "perforce":
            break;
        case "hg":
        case "mercurial":
            break;
        default:
            //@todo show warning of some sort...
            break;
    }
    
    if (!command)
        return;

    Exec(command,
        function (error, stdout, stderr) {
            if (stdout && stdout.length)
                console.log("stdout: " + stdout);
            if (stderr && stderr.length)
                console.log("stderr: " + stderr);
            if (error !== null) {
                console.log("exec error: " + error);
        }
    });
};
