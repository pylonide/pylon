module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("res", __dirname, register);
};