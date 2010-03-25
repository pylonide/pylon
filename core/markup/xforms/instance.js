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

// #ifdef __WITH_XFORMSINSTANCEELEMENT
/**
 * Element defining a container for data. This element is optional for normal use, but is required for xforms compatibility.
 * @attribute  {String}  src          the url to retrieve the data from.
 * @see element.model
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.XformsInstanceElement = function(struct, tagName){
    this.$init(tagName || "Instance", apf.NODE_VISIBLE, struct);
};

(function(){
    
}).call(apf.XformsInstanceElement.prototype = new apf.XformsElement());

apf.xforms.setElement("html", apf.XformsInstanceElement);
// #endif