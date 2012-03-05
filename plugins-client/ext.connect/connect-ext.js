module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("connect", __dirname, register);
};