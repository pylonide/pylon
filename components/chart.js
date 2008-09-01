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
 * Component implementing creating charts
 */

jpf.chart = {    
    axis_x_max : null,
	axis_x_min : null,
	axis_y_max : null,
	axis_y_min : null, 	
	mainwidth : null,
	mainheight : null,
	height : null,
    width  : null,
	top : 0,
	left : 0,    
    defaultColor  : "#97b9d4",

    area : null,
    labels_in_use : [],
    labels_temp : []
}

/**
 * This function prepare chart container. For Firefox create Canvas
 * and insert it into cointainer
 * 
 * @param {htmlElement} htmlElement of Chart area
 * 
 * @return {htmlElement} Chart container, for IE: <div></div>
 *                                        for FF: <div><canvas></canvas></div> 
 */

jpf.chart.createChartArea = function(htmlElement) {
    htmlElement.className = "chartArea";
    jpf.chart.mainwidth = htmlElement.offsetWidth;
    jpf.chart.mainheight = htmlElement.offsetHeight;
	
	var htmlElementY = document.getElementById("y_axis");
	htmlElementY.style.width = 45+"px";
	htmlElementY.style.height = (jpf.chart.mainheight-45) +"px";
	
	var htmlElementX = document.getElementById("x_axis");
	htmlElementX.style.height = 45+"px";
	htmlElementX.style.width = jpf.chart.mainwidth +"px";
	
	var htmlElementW = document.getElementById("chart_window");
	htmlElementW.style.width = (jpf.chart.mainwidth-45)+"px";
	htmlElementW.style.height = (jpf.chart.mainheight-45) +"px";
   
   	if(jpf.isGecko) {
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", jpf.chart.mainwidth-45);
        canvas.setAttribute("height", jpf.chart.mainheight-45);
		jpf.chart.width = jpf.chart.mainwidth - 45;
		jpf.chart.height = jpf.chart.mainheight - 45;
        canvas.style.top = jpf.chart.top + "px";
		canvas.style.left = jpf.chart.left + "px";
		
		canvas.className = "canvas";
        canvas.id = "chart-canvas";
        
		htmlElementW.appendChild(canvas);
        htmlElementW = canvas.getContext('2d');
        htmlElementW = new jpf.vector.canvas(htmlElementW);         
    }
   
    return htmlElementW;
}

/**
 * This function creates axes with scale based on data series
 * or (if set) user values
 * 
 * @param {htmlElement} pHtmlElement Chart htmlElement
 * @param {htmlElement} area         Chart htmlElement, for FF Canvas, for IE is useless 
 * @param {Array}       data         max and min values of X and Y
 * @param {Hash Array}  options      some options
 * 
 * @see jpf.chart#calculateRanges
 */

jpf.chart.createAxes = function(area, data, options) {
    var axes = jpf.chart.calculateAxes(data); 
    
	var x_max = jpf.chart.axis_x_max = jpf.chart.axis_x_max ? jpf.chart.axis_x_max : (jpf.chart.axis_x_max == 0 ? 0 : axes.x_max);
    var x_min = jpf.chart.axis_x_min = jpf.chart.axis_x_min ? jpf.chart.axis_x_min : (jpf.chart.axis_x_min == 0 ? 0 : axes.x_min);
    var y_max = jpf.chart.axis_y_max = jpf.chart.axis_y_max ? jpf.chart.axis_y_max : (jpf.chart.axis_y_max == 0 ? 0 : axes.y_max);
    var y_min = jpf.chart.axis_y_min = jpf.chart.axis_y_min ? jpf.chart.axis_y_min : (jpf.chart.axis_y_min == 0 ? 0 : axes.y_min);
	
	
	
	//jpf.alert_r(jpf.chart)
    //jpf.alert_r(axes); 
}

jpf.chart.addLabel = function(parent, value, left, top, center) {
    var label = jpf.chart.labels_temp.length ? jpf.chart.labels_temp.pop() : document.createElement("span");
    jpf.chart.labels_in_use.push(label);

    label.style.display = "block";
    label.className = "axielabel";
    label.innerHTML = value.toString().length > 5 ? value.toString().substr(0, 5) : value;

    label.style.width = parseInt(label.innerHTML.length) * 4 + "px";
    label.style.left = (center ? left-parseInt(label.style.width) / 2 : left) + "px";
    label.style.top = top + "px";
    parent.appendChild(label);
}

/**
 * Function creates Chart with axes. It's possible to add 
 * more functions on one Chart
 * 
 * @param {htmlElement} htmlElement Chart container
 * @param {Hash Array}  options     axis, title and other captions
 */
jpf.chart.createChart = function(htmlElement, options) {
    this.htmlElement = htmlElement;
	this.options = options;
	this.data = [];
	
	this.area = new jpf.chart.createChartArea(htmlElement);
	
	var _self = this;
	
	if(options.axis_x_max || options.axis_x_max == 0)
        jpf.chart.axis_x_max = options.axis_x_max;
    if(options.axis_x_min || options.axis_x_min == 0)
        jpf.chart.axis_x_min = options.axis_x_min;
    if(options.axis_y_max || options.axis_y_max == 0)
        jpf.chart.axis_y_max = options.axis_y_max;
    if(options.axis_y_min || options.axis_y_min == 0)
        jpf.chart.axis_y_min = options.axis_y_min;
	
	
	/* Events */
	
	/* Grab */
    var timer;	
    this.area.ctx.canvas.onmousedown = function(e) {
        var e = (e || event);
		var left = jpf.chart.left;
		var top = jpf.chart.top;
		var stepX = 0, stepY = 0, cy = e.clientY, cx = e.clientX;	
			
        clearInterval(timer);
        timer = setInterval(function() {            
			_self.move(top + stepY, left + stepX);        	
		}, 10);

        document.onmousemove = function(e) {
            var e = (e || event);
            var y = e.clientY;
            var x = e.clientX;

            stepY = -(cy - y);
            stepX = -(cx - x);   
				
        }

        document.onmouseup = function(e){
            clearInterval(timer);
            document.onmousemove = null;
        }
    }


	/* Functions */
	
	this.addSeries = function(data) {
        this.data.push(data);
    }
	
	this.paint = function() {
        this.axes = jpf.chart.createAxes(this.area, this.data, this.options);
        //this.area = this.axes.area;
        //_self.drawChart();
    }	
	
	
	this.move = function(top, left) {
		jpf.chart.left = left;
		jpf.chart.top = top;		
		this.area.ctx.canvas.style.left = left + "px";
		this.area.ctx.canvas.style.top = top + "px";
	}
	
	
}

/**
 * Creates Linear Chart
 * 
 * @param {Canvas}     area  Chart area object (for FF is Canvas)
 * @param {Hash Array} data  Data series and other properties 
 * @param {Hash Array} axes  usefull variables from createAxes() functions
 */

jpf.chart.drawLinearChart = function(area, data, axes) {
    area.setLineColor(data.options.color || jpf.chart.color);
    area.setLineWidth(1);    
	
    var x_max = Math.abs(axes.x_max);
    var x_min = Math.abs(axes.x_min);
    var y_max = Math.abs(axes.y_max);
    var y_min = Math.abs(axes.y_min);

    var area_value_x = axes.move ? -jpf.chart.value_per_x_axis : axes.axes_values_x[axes.axes_values_x.length - 1] - axes.axes_values_x[axes.axes_values_x.length - 2];
    var area_value_y = axes.move ? -jpf.chart.value_per_y_axis : axes.axes_values_y[axes.axes_values_y.length - 1] - axes.axes_values_y[axes.axes_values_y.length - 2];
	
    area.beginPath();

    for(var i = 0; i < data.series.length; i++) {
        var rest_x = (data.series[i][0] / area_value_x) * axes.area_x;
        var rest_y = (data.series[i][1] / area_value_y) * axes.area_y;

        if(i == 0) {
            area.changeStartPoint(rest_x, rest_y);
        }
        else {
            area.createLine(rest_x, rest_y);
        }
    }
    area.stroke();
}


/**
 * Function calculate maximal and minimal value of X and Y axes.
 * Based on maximal and minimal values of all Chart functions
 * 
 * @param {Array} data  Chart data series and Chart type.
 * 
 * @see #jpf.chart.[XX]Series
 */

jpf.chart.calculateAxes = function(data) {
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