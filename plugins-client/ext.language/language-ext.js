module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("language", __dirname, register);
};