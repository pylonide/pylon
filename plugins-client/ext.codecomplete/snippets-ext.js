module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("snippets", __dirname, register);
};