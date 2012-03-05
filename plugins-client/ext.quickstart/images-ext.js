module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("images", __dirname, register);
};