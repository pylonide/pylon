module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("refactor", __dirname, register);
};