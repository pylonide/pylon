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

jpf.vector = {
}

jpf.vector.canvas = function(ctx){
    this.ctx = ctx;

    /**
     * Function init path
     */
	this.beginPath = function() {
        this.ctx.beginPath();
    }
    /**
     * Function changing start point of line.
     * 
     * @param {Number} x  position of start point 
     * @param {Number} y  position of start point
     */
    this.changeStartPoint = function(x, y) {
        this.ctx.moveTo(x, y);
    }
	
	/**
	 * Function creates line between start point and 
	 * x y position
	 * 
	 * @param {Number} x  position of end point
	 * @param {Number} y  position of end point
	 */
    this.createLine = function(x, y) {
        this.ctx.lineTo(x,y);
    }

    /**
     * Function draw line path. 
     * 
     * @see jpf.vector#fill
     */
    this.stroke = function(){
        this.ctx.stroke();
    }
}

