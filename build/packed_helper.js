
var fs = require('fs');

var config = require("../configs/default.js");
var extensions;

for (var c in config) {
    if (config[c].clientPlugins) {
        extensions = config[c].clientPlugins;
        break;
    }
}

var clientPlugins = [ ];
var clientMappings = [ ];

var arguments = process.argv.splice(2);
var isClean = parseInt(arguments[0]);

//console.log(extensions);

for (var e in extensions) {
    var name = extensions[e].split("/")[1];

    if (name === "log")
        continue;
    
    var dir = "plugins-client/ext." + name;
    var mapping = "ext/" + name;

    clientMappings.push(mapping + "': '" + dir);
    clientPlugins.push(mapping + "/" + name);
}

clientMappings.push("ext/uploadfiles': 'plugins-client/ext.uploadfiles"); // TODO: why is this not automatically added?
clientPlugins = "'" + clientPlugins.join("',\n\t'") + "'";
clientMappings = "'" + clientMappings.join("',\n\t'") + "'";

var appTemplate = fs.readFileSync("./build/app.build.tmpl.js", "utf8");

// transform all variable paths out
var appFile = appTemplate.replace(/%b/g, "build").replace(/%d/g, "plugins-client").replace('"%a"', '"node_modules/ace/lib/ace/worker"').replace('"%s"', clientPlugins).replace('"%m"', clientMappings).replace('"%o"', '"../plugins-client/lib.packed/www/c9os.min.js"');

if (isClean)
    appFile = appFile.replace(/\/\/\s*optimize/, 'optimize');

fs.writeFile("./build/app.build.js", appFile, "utf8", function(err) {
    if (err) {
        console.error("Couldn't write app.build.js!")
        console.error(err);
        process.exit(1);
    } 
});