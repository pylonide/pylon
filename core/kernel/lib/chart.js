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
    scale  : 100,
    height : 0,
    width  : 0,
	paddingTop : 5,
	paddingLeft : 15
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
    jpf.chart.width = htmlElement.offsetWidth-30;
    jpf.chart.height = htmlElement.offsetHeight-30;
    	
    if(jpf.isGecko) {
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", jpf.chart.width);
        canvas.setAttribute("height", jpf.chart.height);
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

jpf.chart.createAxes = function(area, data, options) {
    var ranges = jpf.chart.calculateRanges(data);
	
	if(jpf.isGecko){             
		var l;	
		
		var y_plus = jpf.chart.calculateAxieSize(ranges.y_max);
		var y_minus = jpf.chart.calculateAxieSize(ranges.y_min);
		var x_plus = jpf.chart.calculateAxieSize(ranges.x_max);
		var x_minus = jpf.chart.calculateAxieSize(ranges.x_min);
		
		/* If developer sets the proportional = true */
		if(options.proportional){
			if(y_plus !== 0){
				y_plus = Math.max(y_plus, y_minus);				
			}
			if(x_plus !== 0){
				x_plus = Math.max(x_plus, x_minus);
			}
			if(y_minus !==0){
				y_minus = Math.max(y_plus, y_minus);
			}
			if(x_minus !==0){
				x_minus = Math.max(y_plus, y_minus);
			}
			
			//y_plus = y_minus = Math.max(y_plus, y_minus);	
			//x_plus = x_minus = Math.max(x_plus, x_minus);		
		}
		
		var area_x = Math.ceil((jpf.chart.width-10)/(x_plus + x_minus)); 
		var area_y = Math.ceil((jpf.chart.height-10)/(y_plus + y_minus));
		
		
		//alert(x_plus+" "+x_minus+" "+y_plus+" "+y_minus)
		l = y_plus + y_minus;	
				
		for(var i = 0; i<=l; i++){
			area.beginPath();
			area.changeStartPoint(0, i*area_y+5);			
			area.setLineColor((i == y_plus ? "black" : "#ebebeb"));				
			area.setLineWidth((i == y_plus ? 2 : 1));
			area.createLine(jpf.chart.width, i*area_y+5);
			area.stroke();	
			
		}
		
		l = x_plus + x_minus;
		for(var i = 0; i<=l; i++){
			area.beginPath();
			area.changeStartPoint(i*area_x+5, 0);			
			area.setLineColor((i == x_minus ? "black" : "#ebebeb"));
			area.setLineWidth((i == x_minus ? 2 : 1));				
			area.createLine(i*area_x+5, jpf.chart.height);
			area.stroke();					
		}		
		
    }
    else {

    }
    return {
		area : area, 
		y_plus : y_plus, y_minus : y_minus,
		x_plus : x_plus, x_minus : x_minus,
		area_x : area_x, area_y : area_y,
		y_max : ranges.y_max, y_min : ranges.y_min,
		x_max : ranges.x_max, x_min : ranges.x_min
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


jpf.chart.calculateAxieSize = function(value) {	
	var start = 10;
	var temp = 0;
	
	value = Math.abs(value);
	//alert(value)	
	for(;;){
		if(value < start){			
			temp = start.toString();			
			temp = temp.substr(0, temp.length-1);			
			temp = parseInt(temp);
			
			return Math.floor(value / temp);
		}
		else{
			start *= 10;
		}
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
	this.proportional  = options.proportional;  
	    
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
		this.axes = jpf.chart.createAxes(this.area, this.data, this.options);
		this.area = this.axes.area;
					jpf.chart.createAxesValues(this.phtmlElement, this.axes);
		_self.drawChart();
	}
}

jpf.chart.drawLinearChart = function(area, data, axes) {
	area.setLineColor("red");	
	
	for(var i=0; i<data.series.length; i++){
		area.beginPath();
		
		var x = data.series[i][0];
		var y = (axes.y_plus+axes.x_minus)-data.series[i][1];
		
		//alert(data.series[i][0]+" "+ data.series[i][1]+" "+x+" "+y)
		area.changeStartPoint(x*axes.area_x+5, y*axes.area_y+5);				
		area.createLine(x*axes.area_x+5, (y + data.series[i][1])*axes.area_y+5);
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
	//alert(x_max+" "+x_min+" "+y_max+" "+y_min)
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

jpf.chart.tableSeries = function(series, type) {
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
        type : type
    };
}
