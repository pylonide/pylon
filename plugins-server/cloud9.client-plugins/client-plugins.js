
module.exports = function startup(options, imports, register) {

    var log = imports.log;
    var clientPlugins = [];

    register(null, {
        "client-plugins": {
            register: function(name, path, callback) {
                log.info("IDE CLIENT PLUGIN: ", name, path);
                clientPlugins.push("ext/" + name + "/" + name);
                imports.static.addStatics([{
                    path: path,
                    mount: "/ext/" + name
                }]);
                callback();
            }
        }
    });
};