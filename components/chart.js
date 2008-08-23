/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */


/**
 * Component implementing creating a charts
 */

jpf.chart = {
    scale  : 1,
	range_x_max : null,
	range_x_min : null,
	range_y_max : null,
	range_y_min : null,
	area_x : null,
	area_y : null,
    height : null,
    width  : null,
	paddingTop : 5,
	paddingBottom : 25,
	paddingLeft : 25,
	paddingRight : 5,
	defaultColor : "red"
}

/**
 * This function prepare chart container, for Firefox create Canvas
 * and insert them into cointainer
 * 
 * @param {htmlElement} htmlElement of Chart area
 * 
 * @return {htmlElement} Chart container, for IE: <div></div>
 *                                        for FF: <div><canvas></canvas></div> 
 */

jpf.chart.createChartArea = function(htmlElement) {
    htmlElement.className = "chartArea";
    jpf.chart.width = htmlElement.offsetWidth-jpf.chart.paddingLeft-jpf.chart.paddingRight;
    jpf.chart.height = htmlElement.offsetHeight-jpf.chart.paddingBottom-jpf.chart.paddingTop;
    	
    if(jpf.isGecko) {
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", jpf.chart.width);
        canvas.setAttribute("height", jpf.chart.height);
		canvas.className = "canvas";
        htmlElement.appendChild(canvas);
        htmlElement = canvas.getContext('2d');
		htmlElement = new jpf.vector.canvas(htmlElement);
    }
    return htmlElement;
}

/**
 * This function creates axes with scale based on values series
 * 
 * @param {htmlElement} area  Chart htmlElement 
 * @param {Array}       data  max and min values of X and Y
 * 
 * @see jpf.chart#calculateRanges
 */

jpf.chart.createAxes = function(pHtmlElement, area, data, options) {
    var ranges = jpf.chart.calculateRanges(data);
	
	var x_max = jpf.chart.range_x_max = jpf.chart.range_x_max ? jpf.chart.range_x_max : (jpf.chart.range_x_max == 0 ? 0 : ranges.x_max);
	var x_min = jpf.chart.range_x_min = jpf.chart.range_x_min ? jpf.chart.range_x_min : (jpf.chart.range_x_min == 0 ? 0 : ranges.x_min);
	var y_max = jpf.chart.range_y_max = jpf.chart.range_y_max ? jpf.chart.range_y_max : (jpf.chart.range_y_max == 0 ? 0 : ranges.y_max);
	var y_min = jpf.chart.range_y_min = jpf.chart.range_y_min ? jpf.chart.range_y_min : (jpf.chart.range_y_min == 0 ? 0 : ranges.y_min);	
	
	/* If developer sets the proportional = true */
	if(options.proportional){
		if(y_max !== 0 && y_min !==0){				
			y_min = y_max = Math.max(y_max, y_min);				
		}
		if(x_max !== 0 && x_min !==0){
			x_max = x_min = Math.max(x_max, x_min);
		}				
	}
	
	//alert(x_max+" "+x_min+" "+y_max+" "+y_min)
	
	var ctbd = 5; // correction to better display
	
	var area_x = (jpf.chart.area_x = Math.floor((jpf.chart.width-6) / 6))*jpf.chart.scale; 
	var area_y = (jpf.chart.area_y = Math.floor((jpf.chart.height-6) / 6))*jpf.chart.scale;
	
	var p_x_m = Math.ceil(Math.abs(x_min)/(Math.abs(x_min)+Math.abs(x_max))*(jpf.chart.width-6));
	var p_y_m = Math.ceil(Math.abs(y_max)/(Math.abs(y_min)+Math.abs(y_max))*(jpf.chart.height-6));
	
		
	var counter = 0;
	if(jpf.isGecko){ 		
		for(var i = 0; i<=jpf.chart.height-6; i++){			
						
			var temp = Math.floor(area_y*counter + p_y_m%area_y);	
											
			if(i == temp){					
				area.beginPath();
				area.changeStartPoint(ctbd, temp+ctbd);			
				area.setLineColor("#ebebeb");				
				area.setLineWidth(1);
				area.createLine(jpf.chart.width, temp+ctbd);
				area.stroke();					
				
				var label = document.createElement("span");
				label.className = "axielabel";
				//alert((Math.floor((area_y/(jpf.chart.height-6))*100)/100))
				label.innerHTML = y_max-counter*(y_max/Math.floor(p_y_m/area_y));
				//label.style.width = parseInt(label.innerHTML.length)*4+"px";					
				label.style.left = ctbd+"px";
				label.style.top = temp+"px";
				pHtmlElement.appendChild(label);
				
				counter++;
			}			
			
			if(i == p_y_m+1){
				area.beginPath();
				area.changeStartPoint(ctbd, p_y_m+1+ctbd);			
				area.setLineColor("black");				
				area.setLineWidth(2);
				area.createLine(jpf.chart.width, p_y_m+1+ctbd);
				area.stroke();	
			}			
		}		
		//alert(x_min+" "+x_max +" "+p_x_m+" "+y_min+" " + y_max+" "+p_y_m+" "+jpf.chart.width+" "+jpf.chart.height)
		counter = 0;
		for(var i = 0; i<=jpf.chart.width-6; i++){							
			var temp = Math.floor(area_x*counter + p_x_m%area_x);											
			if(i == temp){				
				area.beginPath();
				area.changeStartPoint(temp+ctbd, ctbd);			
				area.setLineColor("#ebebeb");				
				area.setLineWidth(1);
				area.createLine(temp+ctbd, jpf.chart.height);
				area.stroke();
				
				var label = document.createElement("span");
				label.className = "axielabel";
				//alert((Math.floor((area_y/(jpf.chart.height-6))*100)/100))
				label.innerHTML = x_min-counter*(x_min/Math.floor(p_x_m/area_x));
				//label.style.width = parseInt(label.innerHTML.length)*4+"px";					
				label.style.left = (temp+ctbd+20)+"px";
				label.style.top = (jpf.chart.height+ctbd)+"px";
				pHtmlElement.appendChild(label);
				
					
				counter++;
			}		
			
			
			if(i == p_x_m+1){
				area.beginPath();
				area.changeStartPoint(p_x_m+1+ctbd, ctbd);			
				area.setLineColor("black");
				area.setLineWidth(2);				
				area.createLine(p_x_m+1+ctbd, jpf.chart.height);
				area.stroke();	
			}							
		}		
		
    }
    else {

    }
    return {
		area : area, 		
		area_x : area_x, area_y : area_y,
		y_max : y_max, y_min : y_min,
		x_max : x_max, x_min : x_min		
	};
}

jpf.chart.createAxesValues = function(pHtmlElement, axes) {
    
	if(jpf.isGecko){
		var l = axes.y_plus + axes.y_minus;	
		var l2 = axes.x_plus + axes.x_minus;		
		
		for(var i = 0; i<=l; i++){									
			for(var j = 0; j<=l2; j++){	
				if(j == 0){
					var label = document.createElement("span");
					label.className = "axielabel";
					label.innerHTML = axes.y_plus-i;
					label.style.width = parseInt(label.innerHTML.length)*4+"px";					
					label.style.left = (j*axes.area_x+jpf.chart.paddingLeft - parseInt(label.style.width)/2)+"px";//+5
					label.style.top = (i*axes.area_y-1)+"px";//-1
					pHtmlElement.appendChild(label);
				}	
				if(i == l){
					var label = document.createElement("span");
					label.className = "axielabel";
					label.innerHTML = -1*axes.x_minus+j;
					label.style.width = parseInt(label.innerHTML.length)*4+"px";
					label.style.left = (j*axes.area_x +jpf.chart.paddingLeft+parseInt(label.style.width)/2)+"px";//+12
					label.style.top = (i*axes.area_y+5)+"px";//+5
					pHtmlElement.appendChild(label);
				}										
			}						
		}
		
    }
    else {

    }    
}


/**
 * Function creates Chart with axes. It's possible to add 
 * more functions on one Chart
 * 
 * @param {htmlElement} htmlElement Chart container
 * @param {Hash Array}  options     axis, title and other captions
 */
jpf.chart.createChart = function(htmlElement, options) {
    this.phtmlElement = htmlElement;
    this.options = options;
	_self = this;

    this.data = [];
    
    this.x_axis = options.x_axis;
    this.y_axis = options.y_axis;
    this.title  = options.title;    
	
	if(options.range_x_max || options.range_x_max == 0)
		jpf.chart.range_x_max = options.range_x_max;
	if(options.range_x_min || options.range_x_min == 0)
		jpf.chart.range_x_min = options.range_x_min;
	if(options.range_y_max || options.range_y_max == 0)
		jpf.chart.range_y_max = options.range_y_max;
	if(options.range_y_min || options.range_y_min == 0)
		jpf.chart.range_y_min = options.range_y_min;
	
	if(options.scale)
		jpf.chart.scale = options.scale;	
	    
    this.addSeries = function(data) {
        this.data.push(data);				    
    }
	
	this.drawChart = function() {
		for(var i = 0; i< this.data.length; i++){
			switch(this.data[i].type){
				case "linear":
					jpf.chart.drawLinearChart(this.area, this.data[i], this.axes);
				break;
			}
		}
	}
	
	this.paint = function(){			
		this.area = new jpf.chart.createChartArea(this.phtmlElement); 
		this.axes = jpf.chart.createAxes(this.phtmlElement, this.area, this.data, this.options);
		//this.area = this.axes.area;
					//jpf.chart.createAxesValues(this.phtmlElement, this.axes);
		//_self.drawChart();
	}
}

jpf.chart.drawLinearChart = function(area, data, axes) {
	area.setLineColor(data.options.color || jpf.chart.color);	
	
	for(var i=0; i<data.series.length; i++){
		area.beginPath();		
		
		//for 1 and 4 quarter
		if((data.series[i][0]>=0 && data.series[i][1]>=0) || (data.series[i][0]>=0 && data.series[i][1]<=0)){
			var x = axes.proportional ? axes.x_plus+data.series[i][0] : axes.x_minus+data.series[i][0];
			var y = axes.y_plus-data.series[i][1];	
			area.changeStartPoint(x*axes.area_x+5, y*axes.area_y+5);				
			area.createLine(x*axes.area_x+5, (y + data.series[i][1])*axes.area_y+5);		
		}
		//for 2 and 3 quarter
		else if((data.series[i][0]<0 && data.series[i][1]>0) || (data.series[i][0]<0 && data.series[i][1]<0)){			
			//alert("dsds"+axes.x_plus+" "+axes.x_minus+" "+ axes.y_plus+" "+ axes.y_minus )
			var x = axes.x_minus+data.series[i][0];
			var y = axes.y_plus-data.series[i][1];
			area.changeStartPoint(x*axes.area_x+5, y*axes.area_y+5);				
			area.createLine(x*axes.area_x+5, (y + data.series[i][1])*axes.area_y+5);
		}
		
		//alert(data.series[i][0]+" "+ data.series[i][1]+" "+x+" "+y)
		
		area.stroke();		
	}
}


/**
 * Function calculate maximal and minimal value of X and Y axes.
 * Based on maximal and minimal values of all Chart functions
 * 
 * @param {Array} data  Chart data series and Chart type.
 * 
 * @see #jpf.chart.[XX]Series
 */

jpf.chart.calculateRanges = function(data) {
    var x_max, x_min, y_max, y_min;
    x_max = x_min = 0;
    y_max = y_min = 0;
    
    for(var i = 0; i < data.length; i++) {
        if(data[i].x_max > x_max) {
            x_max = data[i].x_max;
        }
        if(data[i].x_min < x_min) {
            x_min = data[i].x_min;
        }
        if(data[i].y_max > y_max) {
            y_max = data[i].y_max;
        }
        if(data[i].y_min < y_min) {
            y_min = data[i].y_min;
        }
    }
	    
	return {
        x_max : x_max, x_min : x_min,
        y_max : y_max, y_min : y_min
    }
}

/**
 * Function get data series from tables, and return them in
 * compatible version to Chart 
 * 
 * @param {Array} series  data series [[x,y],[x1,y1]...]
 * @param {String} type   type of chart
 * 
 * @return {Hash Array}   Series, type, maximal and minimal values of X and Y axes
 */

jpf.chart.tableSeries = function(series, type, options) {
    var x_max, x_min, y_max, y_min;
    //Set X & Y range
    if(type !== "pie"){
        x_max = x_min = series[0][0];
        y_max = y_min = series[0][1];
        
        for(var i = 0; i < series.length; i++) {
            if(series[i][0] > x_max) {
                x_max = series[i][0];
            }
            if(series[i][0] < x_min) {
                x_min = series[i][0];
            }
            if(series[i][1] > y_max) {
                y_max = series[i][1];
            }
            if(series[i][1] < y_min) {
                y_min = series[i][1];
            }
        }
    //End of set X & Y range
    }
    else{
        x_max = x_min = 0;
        y_max = y_min = 0;
    }

    return {
        series : series, 
        x_max : x_max, x_min : x_min,
        y_max : y_max, y_min : y_min,
        type : type,
		options : options
    };
}
