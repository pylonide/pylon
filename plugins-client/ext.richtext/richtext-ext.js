module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("richtext", __dirname, register);
};