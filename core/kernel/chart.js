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
    width  : 0
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
    jpf.chart.width = htmlElement.offsetWidth;
    jpf.chart.height = htmlElement.offsetHeight;
    
    if(jpf.isGecko) {
        var canvas = document.createElement("canvas");
        canvas.setAttribute("width", jpf.chart.width);
        canvas.setAttribute("height", jpf.chart.height);
        htmlElement.appendChild(canvas);
        htmlElement = canvas.getContext('2d');
    }
    return htmlElement;
}

/**
 * This function creates axes with scale based on values series
 * 
 * @param {htmlElement} area  Chart htmlElement 
 * @param {Array}       data  max and min values of X and Y
 * 
 * @see #jpf.chart.calculateRanges
 */

jpf.chart.createAxes = function(area, data) {
    if(jpf.isGecko){
        area = new jpf.vector.canvas(area);
        area.beginPath();
        area.changeStartPoint(0, 0);
        area.createLine(0, jpf.chart.height);
        area.createLine(jpf.chart.width, jpf.chart.height);
        area.stroke();

        var ranges = jpf.chart.calculateRanges(data);

    }
    else {

    }
    return area;
}

/**
 * Function creates Chart with axes. It's possible to add 
 * more functions on one Chart
 * 
 * @param {htmlElement} htmlElement Chart container
 * @param {Hash Array}  options     axis and title captions
 */
jpf.chart.createChart = function(htmlElement, options) {
    this.phtmlElement = htmlElement;
    this.options = options;

    this.data = [];
    
    this.x_axis = options.x_axis;
    this.y_axis = options.y_axis;
    this.title  = options.title;
    this.area = new jpf.chart.createChartArea(this.phtmlElement);
    
    this.addSeries = function(data) {
        this.data.push(data);
        this.area = jpf.chart.createAxes(this.area, this.data);
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
    x_max = x_min = data[0].x_max;
    y_max = y_min = data[0].y_max;
    
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
