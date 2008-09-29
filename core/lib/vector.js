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
 * Class implementing drawing lines, curves, rects and other objects
 * 
 */

jpf.vector = {};

jpf.vector.canvas = function(ctx){
    this.ctx = ctx;

    /**
     * Function init path
     */
    this.beginPath = function() {
        this.ctx.beginPath();
    };
    /**
     * Function changing start point of line.
     * 
     * @param {Number} x  position of start point 
     * @param {Number} y  position of start point
     */
    this.changeStartPoint = function(x, y) {
        if(isFinite(x) && !isNaN(x) && isFinite(y) && !isNaN(y)) {
            this.ctx.moveTo(x, y);
        }
        
    };

    /**
     * Function changing color of line
     * 
     * @param {Color} color #0000, "red", "rgb(255,165,0)", "rgba(255,165,0,1)"
     */
    this.setLineColor = function(color) {
        this.ctx.strokeStyle = color;
    };

    /**
     * Function changing line width
     * 
     * @param {Number} size  Line width (for example: 2)
     * 
     */
    this.setLineWidth = function(size) {
        this.ctx.lineWidth = size;
    };

    /**
     * Function restore last saved properties
     */
    this.restore = function() {
        this.ctx.restore();
    };

    /**
     * Function save properties
     */
    this.save = function() {
        this.ctx.save();
    };

    /**
     * Function changing (0,0) point to (x, y) on Canvas
     * 
     * @param {Number} x  position x
     * @param {Number} y  position y
     */
    this.translate = function(x, y) {
        if (isFinite(x) && !isNaN(x) && isFinite(y) && !isNaN(y)) {
            this.ctx.translate(x, y);
        }
    };


    /**
     * Function creates line between start point and 
     * x y position
     * 
     * @param {Number} x  position of end point
     * @param {Number} y  position of end point
     */
    this.createLine = function(x, y) {
        if (isFinite(x) && !isNaN(x) && isFinite(y) && !isNaN(y)) {
            this.ctx.lineTo(x,y);
        }        
    };

    /**
     * Function draw line path. 
     * 
     * @see jpf.vector#fill
     */
    this.stroke = function() {
        this.ctx.stroke();
    };

    this.clearRect = function(x, y, width, height) {
        this.ctx.clearRect(x, y, width, height);
    };
    /**
     *
     * @param {Number} m11   - width of element
     * @param {Number} m12   - translate top value of right top corner
     * @param {Number} m21   - translate left value of right top corner
     * @param {Number} m22   - height
     * @param {Number} dx    - translate x
     * @param {Number} dy    - translate y
     */

    this.transform = function(m11, m12, m21, m22, dx, dy){
        this.ctx.transform(m11, m12, m21, m22, dx, dy);
    };
    
    this.setTransform = function(m11, m12, m21, m22, dx, dy){
        this.ctx.setTransform(m11, m12, m21, m22, dx, dy);
    };

    this.drawImage = function(img, x, y){
        this.ctx.drawImage(img, x, y);
    };
};
