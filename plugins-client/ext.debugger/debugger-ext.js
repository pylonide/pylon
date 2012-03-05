module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("debugger", __dirname, register);
};