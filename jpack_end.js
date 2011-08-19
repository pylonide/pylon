// #ifndef __SUPPORT_GWT

//Conditional compilation workaround... (can this be improved??)
if (document.all) {
    var oldWinError = window.onerror, z;
    window.onerror = z = function(m){
        apf.console.error("Error caught from early startup. Might be a html parser syntax error (not your fault). " + m);

        if (!arguments.caller)
            return true;
    }
}
apf.Init.addConditional(function(){
    if (document.all && window.onerror == z) //Conditional compilation workaround... (can this be improved??)
        window.onerror = oldWinError;

    apf.dispatchEvent("domready");
}, null, ["body", "class"]);

/*if(document.body)
    apf.Init.run("body");
else*/
    apf.addDomLoadEvent(function(){apf.Init.run('body');});

//Start
if (typeof requirejs !== "undefined") {
    var deps = [];
    // #ifdef __AMLCODEEDITOR || __INC_ALL
    deps.push("apf/elements/codeeditor");
    // #endif
    
    // #ifdef __AMLDEBUGGER || __INC_ALL
    deps.push("apf/elements/debugger", "apf/elements/debughost");
    // #endif
    
    if (deps.length) {
        require(
            deps
        , function() {
            apf.start();
        });
    }
    else 
        apf.start();
}
else
    apf.start();

// #endif
