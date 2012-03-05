var fs = require("fs");

var dirs = fs.readdirSync(__dirname).filter(function(dir) {
    return dir.indexOf("ext.") == 0;
})

console.log(dirs)

dirs.forEach(function(dir) {
    var pkg = __dirname + "/" + dir;
    var name = fs.readdirSync(pkg).filter(function(dir) {
        return dir.indexOf("-ext.js") !== -1;
    })[0].replace("-ext.js", "");
    
    var src = pkg;
    var dest = __dirname + "/ext." + name;
    /*
    try {
    if (src !== dest)
        fs.renameSync(src, dest);
    } catch (e) {
        console.log(e)
    }
    */
      
    //console.log("mv %s/%s/* %s", pkg, name, pkg)
    //console.log("rm -rf %s/%s", pkg, name)
      
    package(pkg, name);
    ext(pkg, name)
    //console.log(name, dest)
})

function ext(pkg, name) {
    console.log(pkg, name)
    var file = [
'module.exports = function setup(options, imports, register) {',
'    imports["client-plugins"].register("' + name + '", __dirname);',
'    register(null, {',
'        "ext.' + name + '": {}',
'    })',
'};'].join("\n");

    console.log(file)
    fs.writeFileSync(pkg + "/" + name + "-ext.js", file);
}

function package(pkg, name) {
    var json = {
        "name": "ext." + name,
        "version": "0.0.1",
        "main": name + "-ext.js",
        "private": true,
        "plugin": {
            "provides": ["ext." + name],
            "consumes": ["client-plugins"]
        }
    }
    console.log(pkg + "/package.json", JSON.stringify(json, null, 4))
    fs.writeFileSync(pkg + "/package.json", JSON.stringify(json, null, 4))
}

