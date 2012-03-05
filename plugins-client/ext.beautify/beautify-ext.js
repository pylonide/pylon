module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("beautify", __dirname, register);
};