module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("stripws", __dirname, register);
};