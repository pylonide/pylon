module.exports = function(module, require) {

    return function(name, deps, callback) {
        if (typeof name !== "string") {
            callback = deps;
            deps = name;
        }

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

