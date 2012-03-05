

var fs = require("fs");

var dirs = fs.readdirSync(__dirname).filter(function(dir) {
    return dir.indexOf("cloud9.client.ext.") == 0;
})

console.log(dirs)

dirs.forEach(function(dir) {
    var pkg = __dirname + "/" + dir;
    var name = fs.readdirSync(pkg).filter(function(dir) {
        return dir.indexOf(".") == -1;
    })[0];
    
    var src = pkg;
    var dest = __dirname + "/ext." + name;
    
    try {
    if (src !== dest)
        fs.renameSync(src, dest);
    } catch (e) {
        console.log(e)
    }
      
      
    //package(pkg, name);
    //ext(pkg, name)
    console.log(name, dest)
})

function ext(pkg, name) {
    var file = [
'module.exports = function setup(options, imports, register) {',
'    imports.ide.registerClientPlugin("' + name + '", __dirname + "/' + name +'");',
'',
'    register(null, {',
'        "client.ext.' + name + '": {}',
'    });',
'};'].join("\n");

    console.log(file)
    fs.writeFileSync(pkg + "/" + name + "-ext.js", file);
}

function package(pkg, name) {
    var json = {
        "name": "cloud9.client.ext." + name,
        "version": "0.0.1",
        "main": name + "-ext.js",
        "private": true,

        "dependencies": {
        },

        "plugin": {
            "provides": ["client.ext." + name],
            "consumes": ["ide"]
        }
    }
    console.log(pkg + "/package.json", JSON.stringify(json, null, 4))
    fs.writeFileSync(pkg + "/package.json", JSON.stringify(json, null, 4))
}

