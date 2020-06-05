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

// #ifdef __AMLAPPLICATION || __INC_ALL

/**
 * @todo description
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
ppc.application = function(){
    this.$init("application", ppc.NODE_HIDDEN);
    
    if (!ppc.isO3) {    
        this.$int        = document.body;
        this.$tabList    = []; //Prevents documentElement from being focussed
        this.$focussable = ppc.KEYBOARD;
        this.focussable  = true;
        this.visible     = true;
        this.$isWindowContainer = true;
        this.focus = function(){ this.dispatchEvent("focus"); };
        this.blur  = function(){ this.dispatchEvent("blur"); };
    
        //#ifdef __WITH_FOCUS
        ppc.window.$addFocus(this);
        //#endif
    }
};
ppc.application.prototype = new ppc.AmlElement();
ppc.aml.setElement("application", ppc.application);
// #endif
