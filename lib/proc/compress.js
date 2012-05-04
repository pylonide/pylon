var Path = require("path"),
    Fs   = require("fs"),
    Spawn = require("child_process").spawn;

function compressWithYUI(file, output) {
	var t = ["-jar",
		"yuicompressor-2.4.2.jar","--preserve-semi","--nomunge","--charset","utf-8","--line-break","78",
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
	
/**
 * compress JS or CSS
 */
apf.process.handler.compress = function(x){
    var s      = apf.settings,
        cmd    = s.parseAttribute(x.getAttribute("cmd")),
        file   = Path.normalize(s.parseAttribute(x.getAttribute("in"))),
        output = Path.normalize(s.parseAttribute(x.getAttribute("out")));
		
    if (cmd == "yuicompressor") 
    {
		if (process.platform == "cygwin")	// Java does not accept cygwin style path names
		{
			var cpFile = Spawn("cygpath", ["-w",file]);
			cpFile.stdout.on("data", function(data) {
				file = String(data).replace(/\s/,'');	// Remove line breaks and other white spaces
				
				var cpOutput = Spawn("cygpath", ["-w",output]);
				cpOutput.stdout.on("data", function(data) {
					output = String(data).replace(/\s/,'');	// Remove line breaks and other white spaces
							
					compressWithYUI(file, output);
				});
			});
		}
		else
		{
			compressWithYUI(file, output);
		}
    }
};
