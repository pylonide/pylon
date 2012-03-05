module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("src", __dirname, register);
};