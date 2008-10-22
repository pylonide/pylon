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

// #ifdef __JTAB || __JPAGES || __JSWITCH || __INC_ALL
// #define __WITH_PRESENTATION 1
// #define __JBASETAB 1

/**
 * Component displaying a page and several buttons allowing a
 * user to switch between the pages. Each page can contain
 * arbitrary JML. Each page can render it's content during
 * startup of the application or when the page is activated.
 *
 * @classDescription		This class creates a new tab component
 * @return {Tab} Returns a new tab component
 * @type {Tab}
 * @constructor
 * @allowchild page
 * @addnode components:tab
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.1
 *
 * @inherits jpf.BaseTab
 */

jpf["switch"] = 
jpf.pages     =
jpf.tab       = jpf.component(jpf.NODE_VISIBLE, function(){

    this.$hasButtons = this.tagName == "tab";
    this.$focussable = jpf.KEYBOARD; // This object can get the focus from the keyboard
    
    /**** Init ****/
    
    this.inherit(jpf.JmlElement); /** @inherits jpf.JmlElement */
    
    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
    };
    
    this.$loadJml = function(x){
        this.switchType = x.getAttribute("switchtype") || "incremental";
        this.$loadChildren();
    };
}).implement(jpf.BaseTab);

// #endif