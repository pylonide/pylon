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

// #ifdef __WITH_XFORMSLOADELEMENT
/**
 * Element defining how data is loaded into a model.
 * @attribute  {String}  get          the data instruction on how to load data from the data source into this model.
 * @see element.model
 * @see element.model.attribute.load
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.XformsLoadElement = function(struct, tagName){
    this.$init(tagName || "Load", apf.NODE_VISIBLE, struct);
};

(function(){
    
}).call(apf.XformsLoadElement.prototype = new apf.XformsElement());

apf.xforms.setElement("html", apf.XformsLoadElement);
// #endif