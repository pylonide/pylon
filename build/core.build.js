({
    optimize: "none",
    baseUrl: "../",
    paths: {
        "text" : "text", // plugin for pulling in text! files
        "core" : "plugins-client/cloud9.core/www/core"
    },
    include: [
        "node_modules/ace/build/src/ace-uncompressed",
        "plugins-client/lib.apf/www/apf-packaged/apf_release",
        "plugins-client/cloud9.core/www/core/document", 
        "plugins-client/cloud9.core/www/core/ext", 
        "plugins-client/cloud9.core/www/core/ide", 
        "plugins-client/cloud9.core/www/core/settings", 
        "plugins-client/cloud9.core/www/core/util",  
        "plugins-client/lib.treehugger/treehugger-lib",
        "plugins-client/lib.v8debug/v8debug-lib"
    ],
    out: "./src/core.packed.js",
    inlineText: true,
    findNestedDependencies: true,
    optimizeAllPluginResources: false,
    useStrict: true,
    wrap: true
})