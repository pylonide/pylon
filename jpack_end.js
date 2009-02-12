jpf.Init.addConditional(function(){
    jpf.dispatchEvent("domready");
}, null, ["body", "class"]);

/*if(document.body)
    jpf.Init.run('body');
else*/
    jpf.addDomLoadEvent(function(){jpf.Init.run('body');});

//Start
jpf.start();
