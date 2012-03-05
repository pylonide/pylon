module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("gotofile", __dirname, register);
};