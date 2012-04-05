({
    optimize: "none",
    baseUrl: "./client",
    paths: {
        "text" : "../text", // plugin for pulling in text! files,
        "order" : "../order", // plugin for demanding order
        "ace": "empty:",//../support2/ace/lib/ace",
        "c9/ext" : "empty:",
        "debug" : "../support/lib-v8debug/lib/v8debug",
        "treehugger" : "../support/treehugger/lib/treehugger",
        "apf"     : "apf"
    },
    include: [
        "js/apf_release.js",
        "core/ide", 
        "core/ext", 
        "core/util",
        "core/settings",
        "ext/main/main",
    ],
    out: "./client/build/core.packed.js",
    inlineText: true,
    findNestedDependencies: true,
    optimizeAllPluginResources: false,
    useStrict: true,
    wrap: true
})