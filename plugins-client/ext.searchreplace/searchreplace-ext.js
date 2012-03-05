module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("searchreplace", __dirname, register);
};