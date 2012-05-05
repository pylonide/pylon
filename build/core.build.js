({
    optimize: "none",
    baseUrl: "../",
    paths: {
        "text" : "build/text", // plugin for pulling in text! files
        "core" : "plugins-client/cloud9.core/www/core",
        "treehugger" : "node_modules/treehugger/lib/treehugger",
        "debug": "node_modules/v8debug/lib/v8debug",  
        "ext/main": "plugins-client/ext.main",
        "apf-packaged": "plugins-client/lib.apf/www/apf-packaged"
    },
    include: [
        "node_modules/ace/build/src/ace-uncompressed",
        "apf-packaged/apf_release",
        "core/document", 
        "core/ext", 
        "core/ide", 
        "core/settings", 
        "core/util", 
        "ext/main/main", 
        "treehugger/traverse",
        "treehugger/js/parse",
        "debug/Breakpoint",
        "debug/ChromeDebugMessageStream",
        "debug/WSChromeDebugMessageStream",
        "debug/WSV8DebuggerService",
        "debug/DevToolsService",
        "debug/StandaloneV8DebuggerService",
        "debug/V8DebuggerService",
        "debug/V8Debugger"
    ],
    out: "./src/core.packed.js",
    inlineText: true,
    findNestedDependencies: true,
    optimizeAllPluginResources: false,
    useStrict: true,
    wrap: true
})