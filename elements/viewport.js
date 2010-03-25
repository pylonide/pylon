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

// #ifdef __AMLVIEWPORT || __INC_ALL

/**
 * Element that helps Ajax.org GWT specifying a render area.
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.viewport = function(struct, tagName){
    this.$init(tagName || "viewport", apf.NODE_VISIBLE, struct);
    
    if (document.documentElement)
        this.$ext = this.$int = document.documentElement.appendChild(document.createElement("div"));
};

(function(){
    this.$focussable = false;
    
    this.$draw = function(){
        if (!this.$ext)
            this.$ext = this.$int = document.documentElement.appendChild(document.createElement("div"));
    };

    this.$loadAml = function(x){
        
    };
    
}).call(apf.viewport.prototype = new apf.AmlElement());

apf.aml.setElement("viewport", apf.viewport);


// #endif
