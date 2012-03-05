module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("watcher", __dirname, register);
};