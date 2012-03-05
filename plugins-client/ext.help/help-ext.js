module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("help", __dirname, register);
};