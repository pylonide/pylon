module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("closeconfirmation", __dirname, register);
};