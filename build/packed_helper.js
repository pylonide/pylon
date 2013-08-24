var fs = require('fs');
var path = require('path');

var outDir = __dirname + "/src/";
var arguments = process.argv.splice(2);
var isClean = parseInt(arguments[0], 10);

var templates = fs.readdirSync(path.resolve(__dirname + "/../configs/ide-templates"));

// create a dummy object so require(tmplPath) doesn't complain
var project = {
    remote: {
        metadata: {
            connect: {
                host: ""
            },
            system: {
                home: ""
            },
            node: {}
        }
    }

};

var options = {
    collab : {
        env : ""
    },
    static: {
        staticUrlPrefix: ""
    }
};

var pluginList = require(path.resolve(__dirname + "/../configs/client_plugins"));

for (var f in templates) {
    var tmplPath = path.resolve(__dirname + "/../configs/ide-templates/" + templates[f]);
    console.log("Reading " + tmplPath);
    var tmplFile = require(tmplPath)("blank", project, pluginList, options);

    var idePlugin = tmplFile.plugins.filter(function(plugin) {
        return plugin.packagePath && plugin.packagePath.indexOf("cloud9.core") !== -1;
    })[0];
    var scmPluginList = idePlugin.clientPlugins;

    if (templates[f] === "openshift.js")
        scmPluginList.push("ext/strongloop/strongloop");

    scmPluginList = scmPluginList.filter(function(p) {
        if (p === "ext/log/log")
            return false;
        return true;
    });

    rewriteMappings(templates[f], scmPluginList, function(err, plugins, mappings) {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        createBuildFile(templates[f], plugins, eliminateDuplicates(mappings));
    });
}

function rewriteMappings(type, pluginList, callback) {
    var pluginMappings = [ ];
    pluginList = eliminateDuplicates(pluginList);

    // rewrite mappings for build file
    for (var l in pluginList) {
        var name = pluginList[l].split("/")[1];
        var dir = "";
        var c9Prefix = "../plugins-client/ext.";
        var infraPrefix = "../plugins-client/ext.";
        var exists = fs.existsSync || path.existsSync;

        if (!exists(path.normalize(__dirname + "/" + c9Prefix + name))) {
            //console.warn("Couldn't find " + path.normalize(__dirname + "/" + c9Prefix + name) + "; looking elsewhere...");
            if (!exists(path.normalize(__dirname + "/" + infraPrefix + name))) {
                //console.warn("Couldn't find " + path.normalize(__dirname + "/" + infraPrefix + name) + "; looking elsewhere...");
                
                console.error("We have a problem. I have no idea where " + name + " is referenced.");
                console.error("I'm in " + __dirname + "!");
                console.error("I tried " + c9Prefix + name + "!");
                console.error("I tried " + infraPrefix + name + "!");
                process.exit(1);
            }
            else
                dir = infraPrefix + name;
        }
        else
            dir = c9Prefix + name;
        
        var mapping = "ext/" + name;
    
        pluginMappings.push("'" + mapping + "': '" + dir + "'");
    }

    if (type == "ftp.js") {
        // otherwise, packager cries and breaks for missing dependencies
        pluginMappings.push("'ext/gotofile': '" + c9Prefix + "gotofile'");
        pluginMappings.push("'ext/searchinfiles': '" + c9Prefix + "searchinfiles'");
        pluginMappings.push("'ext/noderunner': '" + c9Prefix + "noderunner'");
        pluginMappings.push("'ext/language':  '" + c9Prefix + "language'");
    }
    
    callback(null, "'" + pluginList.join("',\n\t'") + "'", pluginMappings);
}

function createBuildFile(configName, plugins, mappings) {
    fs.readFile("./build/app.build.tmpl.js", "utf8", function(err, template) {
        if (err) {
            console.error("Couldn't read app.build.tmpl.js!");
            console.error(err);
            process.exit(1);
        }
        var newBuildFile = template
            .replace(/%b/g, "../build")
            .replace('"%a"', '"../node_modules/ace/lib/ace"')
            .replace(/%d/g, '../plugins-client')
            .replace('"%s"', plugins)
            .replace('"%m"', mappings.join(",\n\t"))
            .replace('"%o"', '"../../plugins-client/lib.packed/www/' + configName.replace(".js", ".min.js") + '"');

        if (isClean)
            newBuildFile = newBuildFile.replace(/\/\/\s*optimize/, 'optimize');

        fs.writeFile(outDir + "/app.build." + configName, newBuildFile, "utf8", function(err) {
            if (err) {
                console.error("Couldn't write app.build." + configName + ".js!");
                console.error(err);
                process.exit(1);
            }
        });
    });
}

// r.js hates duplicates
function eliminateDuplicates(arr) {
  var i,
      len=arr.length,
      out=[],
      obj={};

  for (i=0;i<len;i++) {
    obj[arr[i]]=0;
  }
  for (i in obj) {
    out.push(i);
  }
  return out;
}
