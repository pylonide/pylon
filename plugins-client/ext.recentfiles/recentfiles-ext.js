module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("recentfiles", __dirname, register);
};