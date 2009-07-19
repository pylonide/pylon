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
 * Element displaying a page and several buttons allowing a
 * user to switch between the pages. Each page can contain
 * arbitrary jml. Each page can render it's content during
 * startup of the application or when the page is activated.
 * Example:
 * <code>
 *  <j:tab id="tab">
 *      <j:page caption="General">
 *          <j:checkbox>Example</j:checkbox>
 *          <j:button>Example</j:button>
 *      </j:page>
 *      <j:page caption="Advanced">
 *          <j:checkbox>Test checkbox</j:checkbox>
 *          <j:checkbox>Test checkbox</j:checkbox>
 *          <j:checkbox>Test checkbox</j:checkbox>
 *      </j:page>
 *      <j:page caption="Ajax.org">
 *          <j:checkbox>This ok?</j:checkbox>
 *          <j:checkbox>This better?</j:checkbox>
 *      </j:page>
 *  </j:tab>
 * </code>
 *
 * @constructor
 * @define tab, pages, switch
 * @allowchild page
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.1
 *
 * @inherits apf.BaseTab
 */

apf["switch"] =
apf.pages     =
apf.tab       = apf.component(apf.NODE_VISIBLE, function(){
    this.$hasButtons = this.tagName == "tab";
    this.$focussable = apf.KEYBOARD; // This object can get the focus from the keyboard

    /**** Init ****/

    this.$draw = function(bSkinChange){
        //Build Main Skin
        this.oExt = this.$getExternal();
    };

    this.$loadJml = function(x){
        this.switchType = x.getAttribute("switchtype") || "incremental";
        this.$loadChildren();
    };
}).implement(apf.BaseTab);

// #endif
