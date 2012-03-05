module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("tabbehaviors", __dirname, register);
};