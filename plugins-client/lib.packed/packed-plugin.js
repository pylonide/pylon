module.exports = function setup(options, imports, register) {
    var base = __dirname + "/www";
    var aceActual = __dirname + "/../lib.ace"
    var aceBase = require.resolve("ace/package.json").slice(0, -13);

    imports.static.addStatics([{
        path: base,
        mount: "/"
    }, {
        path: aceActual + "/www",
        mount: "/ace"
    }]);

    register(null, {
        
    });
};