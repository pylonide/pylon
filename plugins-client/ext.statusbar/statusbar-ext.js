module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("statusbar", __dirname, register);
};