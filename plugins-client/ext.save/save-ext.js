module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("save", __dirname, register);
};