({
    optimize: "none",
    baseUrl: "../",
    paths: {
        "text" : "text", // plugin for pulling in text! files
        "core" : "plugins-client/cloud9.core/www/core",
        "treehugger" : "plugins-client/lib.treehugger",
        "lib-v8debug/lib/v8debug": "plugins-client/lib.v8debug"
    },
    include: [
        "node_modules/ace/build/src/ace-uncompressed",
        "plugins-client/lib.apf/www/apf-packaged/apf_release",
        "core/document", 
        "core/ext", 
        "core/ide", 
        "core/settings", 
        "core/util",  
        "treehugger/treehugger-lib",
        "lib-v8debug/lib/v8debug/v8debug-lib"
    ],
    out: "./src/core.packed.js",
    inlineText: true,
    findNestedDependencies: true,
    optimizeAllPluginResources: false,
    useStrict: true,
    wrap: true
})