jpf.Init.addConditional(function(){
    jpf.dispatchEvent("ondomready");
}, null, ["body"]);

if(document.body) 
    jpf.Init.run('body');
else 
    window.onload = function(){jpf.Init.run('body');}

//Start
jpf.start();