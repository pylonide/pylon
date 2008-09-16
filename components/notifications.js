jpf.notifications = jpf.component(jpf.GUI_NODE, function() {   
	notificationsXML = [];
	notificationsHTML = [];
		
     this.__supportedProperties.push("margin", "position", "width" );

    this.draw = function() {
        //Build Main Skin
        this.oExt = this.__getExternal();
	}
    
	this.redraw = function(){		
		var ww = jpf.isIE ? document.documentElement.offsetWidth : window.innerWidth;
		var wh = jpf.isIE ? document.documentElement.offsetHeight : window.innerHeight;
		var m = jpf.getBox(this.margin);
		var h, w;
				
		for(var i=0, x = this.oInt.childNodes, l = x.length; i< l; i++){
			if (x[i].nodeType == 1){
				x[i].style.margin = m[0]+"px "+m[1]+"px "+m[2]+"px "+m[3]+"px";
				h = (x[i].offsetHeight || 0);	w = (x[i].offsetWidth || 0);	
				if(this.arrange == "horizontal")
					this.__setStyleClass(x[i], "horizontal");
				else
					this.__setStyleClass(x[i], "", ["horizontal"]);	
			}
		}
		
		if(this.position){
			var x = this.position.split("-");
			
			if(x[0] == "top")
				this.oExt.style.top = 0+"px";		
			else if(x[0] == "bottom")
				this.oExt.style.bottom = 0+"px";		
			else if(x[0] == "middle")
				this.oExt.style.top = (wh/2 - (this.arrange == "horizontal" ? 1 : notificationsHTML.length) * (h + m[0] + m[2])/2) + "px";
						
			if(x[1] == "left")
				this.oExt.style.left = 0+"px";		
			else if(x[1] == "right")
				this.oExt.style.right = 0+"px";			
			else if(x[1] == "center")
				this.oExt.style.left = (ww/2 - (this.arrange == "horizontal" ? notificationsHTML.length : 1) *(w + m[1] + m[3])/2) + "px";	
		}				
				
		
	}
	 
    this.__loadJML = function(x) {
		this.oInt = this.__getLayoutNode("main", "container", this.oExt);
		
		var nodes = x.childNodes;
		for (var i = 0, l = nodes.length; i < l; i++) {
		    if (nodes[i].nodeType == 1) {
				this.__getNewContext("event");
                var oEvent = this.__getLayoutNode("event");
				
				notificationsHTML.push(oEvent);
				notificationsXML.push(nodes[i]);
			}
		}
	
	jpf.xmldb.htmlImport(notificationsHTML, this.oInt);
			
    this.redraw();
	}	
	
}).implement(jpf.Presentation);