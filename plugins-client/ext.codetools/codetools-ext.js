module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("codetools", __dirname, register);
};