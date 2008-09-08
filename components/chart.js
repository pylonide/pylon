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
    height : null,
    width  : null,
    paddingTop    : 5, /* 10, 5 */
    paddingBottom : 25, /* 30, 25 */
    paddingLeft   : 35, /* 30, 25 */
    paddingRight  : 10, /* 10, 5 */  
	si : 0,
	vxmin : null,
	vxmax : null,
	vymin : null,
	vymax : null    
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
    jpf.chart.width = htmlElement.offsetWidth - jpf.chart.paddingLeft - jpf.chart.paddingRight - 6;
    jpf.chart.height = htmlElement.offsetHeight - jpf.chart.paddingBottom - jpf.chart.paddingTop - 6;

    if(jpf.isGecko) {
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", jpf.chart.width);
        canvas.setAttribute("height", jpf.chart.height);
        canvas.className = "canvas";
        canvas.id = "chart-canvas";
        htmlElement.appendChild(canvas);
        htmlElement = canvas.getContext('2d');
        //htmlElement = new jpf.vector.canvas(htmlElement);
    }
    
    return htmlElement;
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
	this.si = 0;
    _self = this;

    var data = [];

	if(options.xmin || options.xmin == 0){
		jpf.chart.vxmin = options.xmin;
	}
	if(options.xmax || options.xmax == 0){
		jpf.chart.vxmax = options.xmax;
	}
	if(options.ymin || options.ymin == 0){
		jpf.chart.vymin = options.ymin;
	}
	if(options.ymax || options.ymax == 0){
		jpf.chart.vymax = options.ymax;
	}		

    this.area = new jpf.chart.createChartArea(this.phtmlElement);	
	
    this.addSeries = function(dataSerie) {
        data.push(dataSerie);		
    }    

    this.paint = function() {
        this.axes = jpf.chart.calculateView(data);
	    this.drawCharts();
    } 
	
	this.drawCharts = function() {
        for(var i = 0; i< data.length; i++){
            switch(data[i].type){
                case "linear":
                    jpf.chart.drawLinearChart(this.area, data[i], this.axes);
                break;
            }
        }
    }
}


jpf.chart.drawLinearChart = function(area, data, axes) {    
    area.lineWidth = 1;    
	area.strokeStyle = "#ebebeb";
	
	function round_pow(x){
		return Math.pow(10, Math.round(Math.log(x) / Math.log(10)));
	}
 	
	area.beginPath(); 
	
	var vmx = jpf.chart.vxmin !== null ? jpf.chart.vxmin : axes.x_min,
	    vmy = jpf.chart.vymin !== null ? jpf.chart.vymin : axes.y_min,
	    vtx = jpf.chart.vxmax !== null ? jpf.chart.vxmax : axes.x_max,
	    vty = jpf.chart.vymax !== null ? jpf.chart.vymax : axes.y_max;
	    
    var view_w = (vtx-vmx), 
	    view_h = (vty-vmy),
        canvas_w = jpf.chart.width, 
		canvas_h = jpf.chart.height,
        sw = canvas_w/view_w, 
		sh = canvas_h/view_h,
        series = data.series, 
		len = series.length;
	
	//background
    for(var gx=round_pow(view_w/(canvas_w/25)), x=Math.round(vmx/gx)*gx-vmx-gx; x<view_w+gx; x+=gx ) {
        area.moveTo( x*sw, 0 );area.lineTo( x*sw, canvas_h );  
    }
    for(var gy=round_pow( view_h/(canvas_h/25) ), y=Math.round(vmy/gy)*gy-vmy-gy; y<view_h+gy; y+=gy ) {
        area.moveTo( 0, y*sh);area.lineTo( canvas_w, y*sh ); 
    }
	
    area.stroke();
	
    if(len<2) return;
	
    area.beginPath(); 
    area.strokeStyle = (data.options.color || jpf.chart.color);
    
    var s = series[0];    
	
	if(len<5){	    	
		area.moveTo( (s[0]-vmx)*sw, canvas_h - (s[1]-vmy)*sh);
    	for(var i = 1, s = series[i];i<len; s = series[++i])       
        	area.lineTo( (s[0]-vmx)*sw, canvas_h - (s[1]-vmy)*sh);
	} 
	else {		
		for(var i=1, s=series[1], lx=series[0][0], d=0; i<len && lx<=vtx; s=series[++i]){
			if((x=s[0])>=vmx) { 
		        if(!d++) {
					area.moveTo((lx - vmx) * sw, canvas_h - (series[i - 1][1] - vmy) * sh);
				}
		        area.lineTo( ((lx=x)-vmx)*sw, canvas_h - (s[1]-vmy)*sh );
		    }
		} 		
	}
	area.stroke();	
	
	/*area.beginPath(); 
    area.setLineColor("black");
	
	for(var si=jpf.chart.si; si>=0 && series[si][0]>=mx; si--);
	
	for(var i=si+1, s=series[i], lx=series[si][0], d=0; i<len && lx<=tx; s=series[++i]) if((x=s[0])>=mx){
        if (!d++) {
	        area.changeStartPoint((lx - mx) * sw, canvas_h - (series[this.si = (i - 1)][1] - my) * sh);
		}
        area.createLine( ((lx=x)-mx)*sw, canvas_h - (s[1]-my)*sh );
    }
	
       
    area.stroke();*/
}






/**
 * Function calculate maximal and minimal value of X and Y axes.
 * Based on maximal and minimal values of all Chart functions
 * 
 * @param {Array} data  Chart data series and Chart type.
 * 
 * @see #jpf.chart.[XX]Series
 */

jpf.chart.calculateView = function(data) {
    var x_max, x_min, y_max, y_min;
    x_max = x_min = 0;
    y_max = y_min = 0;
    //jpf.alert_r(data)
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