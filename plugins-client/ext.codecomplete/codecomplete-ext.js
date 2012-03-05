module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("codecomplete", __dirname, register);
};