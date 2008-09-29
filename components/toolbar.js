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
// #ifdef __JTOOLBAR || __INC_ALL
// #define __WITH_PRESENTATION 1

/**
 * Component displaying a bar containing Buttons and other JML components.
 * This component is usually positioned in the top of an application allowing
 * the user to choose from grouped tool buttons.
 *
 * @classDescription		This class creates a new toolbar
 * @return {Toolbar} Returns a new toolbar
 * @type {Toolbar}
 * @constructor
 * @define toolbar
 * @allowchild bar
 * @define bar
 * @allowchild divider
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits jpf.Presentation
 */

jpf.toolbar = jpf.component(jpf.GUI_NODE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    /**** DOM Hooks ****/
    
    
    /**** Init ****/

    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
    };
    
    this.$loadJml = function(x){
        var bar, tagName, i, l, node, nodes = this.jml.childNodes;
        
        //Let's not parse our children, when we've already have them
        if (!this.oInt && this.childNodes.length) 
            return;
        
        //@todo Skin switching here...
        
        for (i = 0, l = nodes.length; i < l; i++) {
            node = nodes[i];
            if (node.nodeType != 1) 
                continue;
            
            tagName = node[jpf.TAGNAME];
            if ("bar|menubar".indexOf(tagName) > -1) {
                bar = new jpf.bar(this.oInt, tagName);
                bar.skinName = this.skinName
                bar.loadJml(node, this);
                
                if (tagName == "menubar") {
                    this.$setStyleClass(bar.oExt, "menubar");
    
                    //#ifdef __DEBUG
                    bar.$domHandlers["insert"].push(function(jmlNode){
                        if (jmlNode.tagName != "button") {
                            throw new Error(jpf.formatErrorStrin(0, this,
                                "Appending a child",
                                "A menubar can only contain j:button elements"));
                        }
                    });
                    //#endif
                }
            }
        }
    };
}).implement(jpf.Presentation);

// #endif
