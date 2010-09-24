module.exports = function(module) {

    return function(name, deps, callback) {
        if (!callback) {
            callback = deps;
            deps = [];
        }
        var modules = deps.map(function(dep) {
            return require(dep);
        });
        module.exports = callback.apply(this, modules);
    };
};

