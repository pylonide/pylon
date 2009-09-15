function fade(name,steps){
	if(!steps)steps = 3;
	apf.tween.single(document.getElementById(name), {
		type: "fade",
		from: 0,
		to: 1,
		steps: steps,
		interval: 10
	});		
}

var presentation = [
    {
        //Go to the next page
        next : function(){
			fade("pg0",15);
			pgPres.set(0);
        }
    },
    {
        next : function(){
			fade("pg1");
            pgPres.set(1);
        },

    },
    {
        next : function(){
			fade("pg2");
            pgPres.set(2);
        },
    },
    {
        next : function(){
			fade("pg3");
            pgPres.set(3);
        }
    },
    {
        next : function(){
		fade("pg4");
            pgPres.set(4);
        }
    },
    {
        next : function(){
		fade("pg5");
            pgPres.set(5);
        }
    },
    {
        next : function(){
		fade("pg6");
            pgPres.set(6);
        }
    }	
];

var curPage = 0;
function goNext(){
    if (curPage > presentation.length - 2)
        return;
    
    presentation[++curPage].next();
}

function goBack(){
    if (curPage < 1) 
        return;
    if(!presentation[--curPage].back)
		presentation[curPage].next();
	else 
		presentation[curPage].back();
}

apf.onload = function(){
    document.oncontextmenu = function(e){
        if (!e) e = event;
        //mnuNav.display(e.x, e.y);
    }

	while(initpage>0){
		goNext(); initpage--;
	}
    
    //document.onclick = function(e){
    //    if (!e) e = event;
    //    goNext();
    //}
    
    document.onkeydown = function(e){
        if (!e) e = event;
        if (e.keyCode == 39)
            goNext();
        else if (e.keyCode == 37)
            goBack();
    }
}

