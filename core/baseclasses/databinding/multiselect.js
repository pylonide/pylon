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

//#ifdef __WITH_MULTISELECT && __WITH_DATABINDING
/**
 * All elements inheriting from this {@link term.baseclass baseclass} can bind to data
 * which contains multiple nodes.
 *
 * @allowchild  item, choices
 *
 *
 * @class apf.MultiselectBinding
 * @inherits apf.DataBinding
 * @baseclass
 * @default_private
 */
/**
 * @define  choices     Container for item nodes which receive presentation.
 * This element is part of the XForms specification. It is not necesary for
 * the Ajax.org Markup Language.
 * 
 * #### Example
 *
 * ```xml
 *  <a:list>
 *      <a:choices>
 *          <a:item>red</a:item>
 *          <a:item>blue</a:item>
 *          <a:item>green</a:item>
 *      </a:choices>
 *  </a:list>
 * ```
 * @allowchild  item
 */
apf.MultiselectBinding = function(){
    
    var FUDGE = "";
};

(function(){
    
}).call(apf.MultiselectBinding.prototype = new apf.DataBinding());
// #endif