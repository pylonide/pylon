jpf.chart = {
	  width : 600,
	  height : 400, 
	  step : 20
}

jpf.chart.add = function(){
    this.htmlElement = document.getElementById("chart");	
	    
    var canvas = this.htmlElement;
    
	if (document.all && !window.opera) {
       
		//this.ctx = document.body.appendChild(vml);
							      
    }
	else {	
		
		this.ctx = canvas.getContext('2d');

        this.ctx.beginPath();
		this.ctx.moveTo(0,0);
		this.ctx.lineTo(0,400);
		this.ctx.lineTo(600,400);		
		this.ctx.stroke();
		this.ctx.fillStyle = "rgb(200,0,0)";
 		this.ctx.fillRect (10, 10, 50, 50);

		this.ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
 		this.ctx.fillRect (30, 30, 50, 50);
		this.ctx.moveTo(0, jpf.chart.height);
	}
	
	this.paint = function() {
		this.ctx.stroke();
	}
	
	this.addValue = function(x, value){		
		this.ctx.moveTo(x*jpf.chart.step, jpf.chart.height-value);
		this.ctx.lineTo(x*jpf.chart.step, jpf.chart.height);		
	}	
	
	this.addValue2 = function(x, value){	
		this.ctx.lineTo(x*jpf.chart.step, jpf.chart.height-value);		
	}	
	
	this.addValue3 = function() {
		//ctx.arc(x,y,radius,startAngle,endAngle, anticlockwise);
		this.ctx.arc(200,200,100,0,Math.PI+(Math.PI*2)/2, false);
		this.ctx.stroke();
		
		/*
		var values = [30, 30, 40];
		var startAngle = 0, endAngle;
		this.ctx.fillStyle = "rgba(0, 200, 200, 0.5)";
		for(var i=0; i<values.length; i++){
			endAngle = 2*Math.PI/(values[i]/100);
			this.ctx.arc(180,180,100,startAngle,endAngle, false);
			this.ctx.stroke();			
		}*/
	}
	
	this.finish = function(){
		this.ctx.closePath();
		this.ctx.fill();
	}
	
	
}

