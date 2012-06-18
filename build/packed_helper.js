
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

clientMappings.push("ext/uploadfiles': 'plugins-client/ext.uploadfiles"); // TODO: why is this not automatically added?
clientPlugins = "'" + clientPlugins.join("',\n\t'") + "'";
clientMappings = "'" + clientMappings.join("',\n\t'") + "'";

var appTemplate = fs.readFileSync("./build/app.build.tmpl.js", "utf8");

// transform all variable paths out
var appFile = appTemplate.replace(/%b/g, "build").replace(/%d/g, "plugins-client").replace('"%a"', '"node_modules/ace/lib/ace/worker"').replace('"%s"', clientPlugins).replace('"%m"', clientMappings).replace('"%o"', '"../plugins-client/lib.packed/www/packed.js"');

fs.writeFile("./build/app.build.js", appFile, "utf8", function(err) {
    if (err) {
        console.error("Couldn't write app.build.js!")
        console.error(err);
        process.exit(1);
    } 
});