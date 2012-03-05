module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("clipboard", __dirname, register);
};