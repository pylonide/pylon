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
// #ifdef __AMLBASESIMPLE || __INC_ALL

/**
 * Baseclass of a simple element. These are usually displaying elements 
 * (_i.e._ {@link ppc.label}, {@link ppc.img})
 *
 * @class ppc.BaseSimple
 * @baseclass
 *
 * @inherits ppc.StandardBinding
 * @inherits ppc.DataAction
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.8
 */
ppc.BaseSimple = function(){
    this.$init(true);
};

(function() {
    //#ifdef __WITH_DATAACTION
    this.implement(ppc.DataAction);
    //#endif
    
    this.getValue = function(){
        return this.value;
    };
// #ifdef __WITH_DATABINDING
}).call(ppc.BaseSimple.prototype = new ppc.StandardBinding());
/* #else
}).call(ppc.BaseSimple.prototype = new ppc.Presentation());
#endif */

//#endif
