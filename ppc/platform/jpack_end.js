// #ifndef __SUPPORT_GWT

//Conditional compilation workaround... (can this be improved??)
if (document.all) {
    var oldWinError = window.onerror, z;
    window.onerror = z = function(m){
        ppc.console.error("Error caught from early startup. Might be a html parser syntax error (not your fault). " + m);

        if (!arguments.caller)
            return true;
    }
}
ppc.Init.addConditional(function(){
    if (document.all && window.onerror == z) //Conditional compilation workaround... (can this be improved??)
        window.onerror = oldWinError;

    ppc.dispatchEvent("domready");
}, null, ["body", "class"]);

/*if(document.body)
    ppc.Init.run("body");
else*/
    ppc.addDomLoadEvent(function(){ppc.Init.run('body');});

//Start
ppc.start();

// #endif
