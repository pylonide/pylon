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
// #ifdef __LIVEMARKUP || __INC_ALL

/**
 * Live Markup processor for a processing instruction
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 */

apf.LiveTextPi = function(){
    //this.$data;
    this.$init();
};

(function(){
    this.mainBind = "data";
    
    this.implement(apf.StandardBinding);

    this.$propHandlers["calcdata"] = function(data){
        this.$int.innerHTML = data && apf.htmlentities(data) || "";
    };
}).call(apf.LiveTextPi.prototype = new apf.AmlProcessingInstruction(true));

apf.aml.setProcessingInstruction("lt", apf.LiveTextPi);
apf.aml.setProcessingInstruction("livetext", apf.LiveTextPi);

// #endif