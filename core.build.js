({
    optimize: "none",
    baseUrl: "./client",
    paths: {
        "text" : "../text", // plugin for pulling in text! files,
        "order" : "../order", // plugin for demanding order
        "ace": "empty:", //../support/ace/lib/ace",
        "c9/ext" : "empty:",
        "debug" : "../support/lib-v8debug/lib/v8debug",
        "treehugger" : "../support/treehugger/lib/treehugger",
        "apf"     : "apf"
    },
    include: [
        "js/apf_release",
        "core/ide", 
        "core/ext", 
        "core/util",
        "core/settings",
        "ext/main/main",
        "../support/ace/build/src/ace",
        "debug/Breakpoint",
        "debug/ChromeDebugMessageStream",
        "debug/WSChromeDebugMessageStream",
        "debug/V8DebuggerService",
        "debug/DevToolsService",
        "debug/V8Debugger",
        "debug/StandaloneV8DebuggerService",
        "debug/WSV8DebuggerService",
        "treehugger/traverse",
        "treehugger/js/parse",
    ],
    out: "./client/build/core.packed.js",
    inlineText: true,
    findNestedDependencies: true,
    optimizeAllPluginResources: false,
    useStrict: true,
    wrap: true
})
