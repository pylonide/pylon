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

// #ifdef __AMLCONTEXTMENU || __INC_ALL

/**
 * element specifying which menu is shown when a
 * contextmenu is requested by a user for a aml node.
 * Example:
 * This example shows a list that shows the mnuRoot menu when the user
 * right clicks on the root {@link term.datanode data node}. Otherwise the mnuItem menu is
 * shown.
 * <code>
 *  <a:list>
 *      <a:contextmenu menu="mnuRoot" match="[root]" />
 *      <a:contextmenu menu="mnuItem" />
 *  </a:list>
 * </code>
 * @attribute {String} menu   the id of the menu element.
 * @attribute {String} select the xpath executed on the selected element of the databound element which determines whether this contextmenu is shown.
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */
apf.contextmenu = function(){
    this.$init("contextmenu", apf.NODE_HIDDEN);
};

(function(){
    this.$amlNodes = [];
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        "match" : 1
    }, this.$attrExcludePropBind);
    
    this.register = function(amlParent){
        if (!amlParent.contextmenus)
            amlParent.contextmenus = [];
        amlParent.contextmenus.push(this);
    };
    
    this.unregister = function(amlParent){
        amlParent.contextmenus.remove(this);
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.register(this.parentNode);
    });
}).call(apf.contextmenu.prototype = new apf.AmlElement());

apf.aml.setElement("contextmenu", apf.contextmenu);

// #endif
