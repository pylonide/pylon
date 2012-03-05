module.exports = function setup(options, imports, register) {
    imports["client-plugins"].register("extmgr", __dirname);
    register(null, {
        "ext.extmgr": {}
    })
};