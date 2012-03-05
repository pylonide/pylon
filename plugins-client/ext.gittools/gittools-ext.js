module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("gittools", __dirname, register);
};