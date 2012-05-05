var fs = require('fs');

var extensions = require("../configs/default.js").containers.master.plugins;
var clientPlugins = [ ];
var clientMappings = [ ];

//console.log(extensions);

for (var i in extensions) {
    if (extensions[i].packagePath && extensions[i].packagePath.indexOf("cloud9.core") >= 0) {
        for (var p in extensions[i].clientPlugins) {
        	var name = extensions[i].clientPlugins[p].split("/")[1];
        	var dir = "plugins-client/ext." + name;
            var mapping = "ext/" + name;

            clientMappings.push(mapping + "': '" + dir);
        	clientPlugins.push(mapping + "/" + name);
        }
        break; // stop looking for cloud9.core
    }
}

/*var clientPlugins = [];
var clientMappings = [];
var clientDirs = fs.readdirSync(__dirname + "/../plugins-client");
var defineRegExp = new RegExp(/plugins-client\/ext.(\w+)/g);

for (var i = 0; i < clientDirs.length; i++) {
    var dir = clientDirs[i];

    if (dir.indexOf("ext.") !== 0 || dir.indexOf("helloworld") !== 0)
        continue;

    var name = dir.split(".")[1];
    var path = "plugins-client/" + dir + "/" + name;

    try {
        stats = fs.lstatSync(process.cwd() + "/" + path + ".js");

        var match;
        if ( (match = path.match(defineRegExp) ) ) {
            for (var m in match) {
                var name = match[m].split("/")[1].split(".")[1];
                var mapping = "ext/" + name;
                clientMappings.push(mapping + "': 'plugins-client/" + dir);
                clientPlugins.push(mapping + "/" + name);
            }
        }
    }
    catch (e) {
        console.error("Missing " + process.cwd() + "/" + path + ".js");
        console.error(e);
    }
}*/


clientPlugins = "'" + clientPlugins.join("',\n\t'") + "'";
clientMappings = "'" + clientMappings.join("',\n\t'") + "'";

var appTemplate = fs.readFileSync("./build/app.build.tmpl.js", "utf8");

var appFile = appTemplate.replace('"%s"', clientPlugins).replace('"%m"', clientMappings);

fs.writeFile("./build/app.build.js", appFile, "utf8", function(err) {
    if (err) {
        console.error("Couldn't write app.build.js!")
        console.error(err);
        process.exit(1);
    } 
});