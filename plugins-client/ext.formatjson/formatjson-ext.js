module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("formatjson", __dirname, register);
};