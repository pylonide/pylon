module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("console", __dirname, register);
};