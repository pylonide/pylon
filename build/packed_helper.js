var fs = require('fs');

var extensions = require("../configs/default.js").containers.master.plugins;
var clientPlugins = [ ];

//console.log(extensions);

for (var i in extensions) {
    if (extensions[i].packagePath && extensions[i].packagePath.indexOf("cloud9.core") >= 0) {
        //console.log(extensions[i].clientPlugins);
        for (var p in extensions[i].clientPlugins) {
        	var name = extensions[i].clientPlugins[p].split("/");
        	var ext = "plugins-client/ext." + name[1] + "/" + name[1];
        	clientPlugins.push(ext);
        }
        clientPlugins = "'" + clientPlugins.join("',\n\t'") + "'";
        break;
    }
}

var appTemplate = fs.readFileSync("./build/app.build.tmpl.js", "utf8");

var appFile = appTemplate.replace('"%s"', clientPlugins);

fs.writeFile("./build/app.build.js", appFile, "utf8", function(err) {
    if (err) {
        console.error("Couldn't write app.build.js!")
        console.error(err);
        process.exit(1);
    } 
});