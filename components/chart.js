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
    axis_x_max : null,
    axis_x_min : null,
    axis_y_max : null,
    axis_y_min : null,

    area_x : null,
    area_y : null,
    height : null,
    width  : null,
    paddingTop    : 10,
    paddingBottom : 30,
    paddingLeft   : 30,
    paddingRight  : 10,
    defaultColor  : "red"
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
    jpf.chart.width = htmlElement.offsetWidth - jpf.chart.paddingLeft - jpf.chart.paddingRight - 6;
    jpf.chart.height = htmlElement.offsetHeight - jpf.chart.paddingBottom - jpf.chart.paddingTop - 6;

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
 * This function creates axes with scale based on data series
 * 
 * @param {htmlElement} area  Chart htmlElement 
 * @param {Array}       data  max and min values of X and Y
 * 
 * @see jpf.chart#calculateRanges
 */

jpf.chart.createAxes = function(pHtmlElement, area, data, options) {
    var axes_values_x = [];
	var axes_values_y = [];
	
	var axes = jpf.chart.calculateAxes(data);

    var x_max = jpf.chart.axis_x_max = jpf.chart.axis_x_max ? jpf.chart.axis_x_max : (jpf.chart.axis_x_max == 0 ? 0 : axes.x_max);
    var x_min = jpf.chart.axis_x_min = jpf.chart.axis_x_min ? jpf.chart.axis_x_min : (jpf.chart.axis_x_min == 0 ? 0 : axes.x_min);
    var y_max = jpf.chart.axis_y_max = jpf.chart.axis_y_max ? jpf.chart.axis_y_max : (jpf.chart.axis_y_max == 0 ? 0 : axes.y_max);
    var y_min = jpf.chart.axis_y_min = jpf.chart.axis_y_min ? jpf.chart.axis_y_min : (jpf.chart.axis_y_min == 0 ? 0 : axes.y_min);

    /* If developer sets the proportional = true */
    if(options.proportional){
        if(y_max !== 0 && y_min !==0) {
            y_min = y_max = Math.max(y_max, y_min);
        }
        if(x_max !== 0 && x_min !==0) {
            x_max = x_min = Math.max(x_max, x_min);
        }
    }
    
    //alert(x_max+" "+x_min+" "+y_max+" "+y_min)    
	
    var area_x = jpf.chart.area_x = (jpf.chart.width) / 6; 
    var area_y = jpf.chart.area_y = (jpf.chart.height) / 6;
    
    var p_x_m = Math.abs(x_min || x_max)/((x_min < 0 ? Math.abs(x_min) + x_max : x_max - x_min)) * (jpf.chart.width);
    var p_y_m = Math.abs(y_max || y_min)/((y_min > 0 ? y_max - y_min : Math.abs(y_min) + y_max)) * (jpf.chart.height);
    
    var x_axis = x_min > 0 ? -1 : Math.round(Math.abs(x_min) / (Math.abs(x_min) + x_max) * (jpf.chart.width));
    var y_axis = y_max < 0 || y_min > 0 ? -1 : Math.round(Math.abs(y_max) / (Math.abs(y_min) + y_max) * (jpf.chart.height));

    var counter = 0;
    if(jpf.isGecko) {
        for(var i = 0; i <= jpf.chart.height; i++) {

            var temp = Math.floor(area_y*counter + p_y_m % area_y);//area before display first line

            if(i == temp) {
                area.beginPath();
                area.changeStartPoint(0, temp);
                area.setLineColor("#ebebeb");
                area.setLineWidth(1);
                area.createLine(jpf.chart.width, temp);
                area.stroke();

				var temp2 = y_max - counter * ((Math.abs(y_max) || Math.abs(y_min)) / Math.floor(p_y_m / area_y));
				axes_values_y.push(temp2);
				
                new jpf.chart.addLabel (
                    pHtmlElement, /* parent */
                    temp2, /* innerHTML */
                    0, /* Left */
                    temp, /* Top */
                    false /* centered */
                );

                counter++;
            }

            if(i == y_axis) {
                area.beginPath();
                area.changeStartPoint(0, y_axis);
                area.setLineColor("#707070");
                area.setLineWidth(2);
                area.createLine(jpf.chart.width, y_axis);
                area.stroke();
            }
        }

        counter = 0;
        for(var i = 0; i <= jpf.chart.width; i++) {
            var temp = Math.floor(area_x * counter + p_x_m % area_x);//area before display first line

            if(i == temp) {
                area.beginPath();
                area.changeStartPoint(temp, 0);
                area.setLineColor("#ebebeb");
                area.setLineWidth(1);
                area.createLine(temp, jpf.chart.height);
                area.stroke();

					var temp2 = x_min + (x_min < 0 
                        		? - counter * ((x_min || x_max) / Math.floor(p_x_m / area_x))
                        		: counter * ((x_min || x_max) / Math.floor(p_x_m / area_x)));
					axes_values_x.push(temp2);

                new jpf.chart.addLabel (
                    pHtmlElement, /* parent */
                    temp2, /* innerHTML */
                    temp + 25, /* Left */
                    jpf.chart.height + 5, /* Top */
                    true /* centered */
                );

                counter++;
            }

            if(i == x_axis) {
                area.beginPath();
                area.changeStartPoint(x_axis, 0);
                area.setLineColor("#707070");
                area.setLineWidth(2);
                area.createLine(x_axis, jpf.chart.height);
                area.stroke();
            }
        }
    }
    else {

    }
    return {
        area : area,        
        y_max : y_max, y_min : y_min,
        x_max : x_max, x_min : x_min,
		p_x_m : p_x_m, p_y_m : p_y_m,
		area_x : area_x, area_y : area_y,
		axes_values_x : axes_values_x, axes_values_y : axes_values_y,
		x_axis : x_axis, y_axis : y_axis
    };
}

jpf.chart.addLabel = function(parent, value, left, top, center) {
    var label = document.createElement("span");
    label.className = "axielabel";

    label.innerHTML = value.toString().length > 5 ? value.toString().substr(0, 5) : value;

    label.style.width = parseInt(label.innerHTML.length) * 4 + "px";
    label.style.left = (center ? left-parseInt(label.style.width) / 2 : left) +"px";
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
    this.phtmlElement = htmlElement;
    this.options = options;
    _self = this;

    this.data = [];

    this.x_axis = options.x_axis;
    this.y_axis = options.y_axis;
    this.title  = options.title;    

    if(options.axis_x_max || options.axis_x_max == 0)
        jpf.chart.axis_x_max = options.axis_x_max;
    if(options.axis_x_min || options.axis_x_min == 0)
        jpf.chart.axis_x_min = options.axis_x_min;
    if(options.axis_y_max || options.axis_y_max == 0)
        jpf.chart.axis_y_max = options.axis_y_max;
    if(options.axis_y_min || options.axis_y_min == 0)
        jpf.chart.axis_y_min = options.axis_y_min;

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
    
    this.paint = function() {
        this.area = new jpf.chart.createChartArea(this.phtmlElement); 
        this.axes = jpf.chart.createAxes(this.phtmlElement, this.area, this.data, this.options);
        this.area = this.axes.area;
        _self.drawChart();
    }
    
    this.zoom = function(x1, x2, y1, y2) {
        jpf.chart.axis_x_max = x2;
        jpf.chart.axis_x_min = x1;
        jpf.chart.axis_y_max = y2;
        jpf.chart.axis_y_min = y1;

        _self.paint();
    }
}

/**
 * Creates Linear Chart
 * 
 * @param {Object} area  Chart area object (for FF is Canvas)
 * @param {Object} data  Data series and other properties 
 * @param {Object} axes  usefull variables from createAxes() functions
 */

jpf.chart.drawLinearChart = function(area, data, axes) {
    area.setLineColor(data.options.color || jpf.chart.color);	
	area.setLineWidth(1);
	alert(axes.x_axis+" "+axes.y_axis)
	area.translate(axes.x_axis, axes.y_axis);
	alert("ok")
	
    var x_max = Math.abs(axes.x_max);
    var x_min = Math.abs(axes.x_min);
    var y_max = Math.abs(axes.y_max);
    var y_min = Math.abs(axes.y_min);
    		
	
	var area_value_x = axes.axes_values_x[axes.axes_values_x.length-1]- axes.axes_values_x[axes.axes_values_x.length-2];
	var area_value_y = axes.axes_values_y[axes.axes_values_y.length-1]- axes.axes_values_y[axes.axes_values_y.length-2];	
    
	
	area.beginPath();
    var min_x = null, min_y = null, count_x = null, count_y = null;
	
	for(var i = 0; i < data.series.length-1; i++){
        alert()		
        //alert(min_x+" - "+data.series[i][1]+" = "+(Math.abs(min_y-data.series[i][1]))+" maximal: "+area_value_y);
		//var rest_x = count_x*axes.area_x + (Math.abs(min_x+data.series[i][0])/area_value_x)*axes.area_x + axes.p_x_m % axes.area_x;
		//var rest_y = count_y*axes.area_y + (Math.abs(min_y-data.series[i][1])/area_value_y)*axes.area_y + axes.p_y_m % axes.area_y;
        
		var rest_x = (data.series[i][0]/area_value_x)*axes.area_x;
		var rest_y = (data.series[i][1]/area_value_y)*axes.area_y;
		alert(rest_x+" "+rest_y)
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
