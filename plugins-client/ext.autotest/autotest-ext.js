module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("autotest", __dirname, register);
};