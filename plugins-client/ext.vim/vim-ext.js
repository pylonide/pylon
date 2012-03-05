module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("vim", __dirname + "/vim", register);
};