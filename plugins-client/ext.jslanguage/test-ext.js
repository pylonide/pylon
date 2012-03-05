module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("test", __dirname, register);
};