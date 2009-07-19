apf.Init.addConditional(function(){
    apf.dispatchEvent("domready");
}, null, ["body", "class"]);

/*if(document.body)
    apf.Init.run('body');
else*/
    apf.addDomLoadEvent(function(){apf.Init.run('body');});

//Start
apf.start();
