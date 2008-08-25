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
    jpf.chart.width = htmlElement.offsetWidth - jpf.chart.paddingLeft - jpf.chart.paddingRight;
    jpf.chart.height = htmlElement.offsetHeight - jpf.chart.paddingBottom - jpf.chart.paddingTop;

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
    
    var ctbd = 2; // correction to better display
    
    var area_x = jpf.chart.area_x = Math.floor((jpf.chart.width - 6) / 6); 
    var area_y = jpf.chart.area_y = Math.floor((jpf.chart.height - 6) / 6);
    
    var p_x_m = Math.abs(x_min || x_max)/((x_min < 0 ? Math.abs(x_min) + x_max : x_max - x_min)) * (jpf.chart.width - 6);
    var p_y_m = Math.abs(y_max || y_min)/((y_min > 0 ? y_max - y_min : Math.abs(y_min) + y_max)) * (jpf.chart.height - 6);
    
    var x_axis = x_min > 0 ? -1 : Math.abs(x_min) / (Math.abs(x_min) + x_max) * (jpf.chart.width - 6);
    var y_axis = y_max < 0 || y_min > 0 ? -1 : Math.abs(y_max) / (Math.abs(y_min) + y_max) * (jpf.chart.height - 6);

    var counter = 0;
    if(jpf.isGecko) {
        for(var i = 0; i <= jpf.chart.height - 6; i++) {

            var temp = Math.floor(area_y*counter + p_y_m % area_y);//area before display first line

            if(i == temp) {
                area.beginPath();
                area.changeStartPoint(ctbd, temp + ctbd);
                area.setLineColor("#ebebeb");
                area.setLineWidth(1);
                area.createLine(jpf.chart.width, temp + ctbd);
                area.stroke();

                new jpf.chart.addLabel (
                    pHtmlElement, /* parent */
                    y_max - counter * ((Math.abs(y_max) || Math.abs(y_min)) / Math.floor(p_y_m / area_y)), /* innerHTML */
                    ctbd, /* Left */
                    temp, /* Top */
                    false /* centered */
                );

                counter++;
            }

            if(i == y_axis) {
                area.beginPath();
                area.changeStartPoint(ctbd, y_axis + ctbd);
                area.setLineColor("black");
                area.setLineWidth(2);
                area.createLine(jpf.chart.width, y_axis + ctbd);
                area.stroke();
            }
        }

        counter = 0;
        for(var i = 0; i <= jpf.chart.width - 6; i++) {
            var temp = Math.floor(area_x * counter + p_x_m % area_x);//area before display first line

            if(i == temp) {
                area.beginPath();
                area.changeStartPoint(temp + ctbd, ctbd);
                area.setLineColor("#ebebeb");
                area.setLineWidth(1);
                area.createLine(temp + ctbd, jpf.chart.height);
                area.stroke();

                new jpf.chart.addLabel (
                    pHtmlElement, /* parent */
                    x_min + (x_min < 0 
                        ? - counter * ((x_min || x_max) / Math.floor(p_x_m / area_x))
                        : counter * ((x_min || x_max) / Math.floor(p_x_m / area_x))), /* innerHTML */
                    temp + ctbd + 25, /* Left */
                    jpf.chart.height + ctbd, /* Top */
                    true /* centered */
                );

                counter++;
            }

            if(i == x_axis) {
                area.beginPath();
                area.changeStartPoint(x_axis + ctbd, ctbd);
                area.setLineColor("black");
                area.setLineWidth(2);
                area.createLine(x_axis + ctbd, jpf.chart.height);
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

    var x_max = Math.abs(axes.x_max);
    var x_min = Math.abs(axes.x_min);
    var y_max = Math.abs(axes.y_max);
    var y_min = Math.abs(axes.y_min);

    var unit_x = jpf.chart.width / (x_min + x_max);
    var unit_y = jpf.chart.height / (y_min + y_max);

    area.beginPath();
    //alert(unit_x+" "+unit_y+" "+w+" "+h)
    for(var i = 0; i < data.series.length; i++){
        //for 1 and 4 quarter
        if((data.series[i][0] >= 0 && data.series[i][1] >= 0) || (data.series[i][0] >= 0 && data.series[i][1] < 0)) {
            var x = axes.proportional ? x_max + data.series[i][0] : x_min + data.series[i][0];
            var y = y_max - data.series[i][1];
        }
        //for 2 and 3 quarter
        else if((data.series[i][0] < 0 && data.series[i][1] >= 0) || (data.series[i][0] < 0 && data.series[i][1] < 0)) {
            var x = x_min + data.series[i][0];
            var y = y_max - data.series[i][1];
        }

        if(i == 0) {
            area.changeStartPoint(x * unit_x + 3, y * unit_y - 2);
        }
        else {
            area.createLine(x * unit_x + 3, y * unit_y - 2);
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
