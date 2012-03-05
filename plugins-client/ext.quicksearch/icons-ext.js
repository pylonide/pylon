module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("icons", __dirname, register);
};