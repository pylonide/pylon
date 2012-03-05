module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("acebugs", __dirname, register);
};