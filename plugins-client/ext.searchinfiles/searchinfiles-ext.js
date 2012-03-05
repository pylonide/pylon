module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("searchinfiles", __dirname + "/searchinfiles", register);
};