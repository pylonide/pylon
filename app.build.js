({
    //optimize: "none",
    baseUrl: "./client",
    paths: {
        "text" : "../text", // plugin for pulling in text! files
        "ace": "empty:", //../support/ace/lib/ace",
        "c9/ext" : "empty:",
        "debug" : "../support/lib-v8debug/lib/v8debug",
        "treehugger" : "../support/treehugger/lib/treehugger",
        "apf"     : "apf"
    },
    include: ["build/core.packed", "ext/all"],
    out: "./client/build/packed.js",
    inlineText: true,
    findNestedDependencies: true,
    optimizeAllPluginResources: false,
    useStrict: true,
    wrap: true
})