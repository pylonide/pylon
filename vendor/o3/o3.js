var version = process.version.substr(1).split(".")

if (process.platform == "darwin") 
	var platform = "-osx";
else if (process.platform == "cygwin")
	var platform = "win32";
else					
    var platform = "-linux";

var versions = [
    "-" + version.join("."),
    "-" + version.slice(0, 2).join(".") + ".x",
    "-" + version[0] + ".x.x",
    ""
]

for (var i=0; i<versions.length; i++) {
    var o3;
    try {
        o3 = require("./o3" + platform + versions[i])
    } catch (e) {}
    
    if (o3) {
        module.exports = o3.root;
        break;
    }        
}
