module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("consolehints", __dirname, register);
};