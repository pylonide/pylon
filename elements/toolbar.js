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
 * Element displaying a bar containing buttons and other aml elements.
 * This element is usually positioned in the top of an application allowing
 * the user to choose from grouped buttons.
 * Example:
 * <code>
 *  <a:toolbar>
 *      <a:menubar>
 *          <a:button submenu="mnuFile">File</a:button>
 *          <a:button submenu="mnuEdit">Edit</a:button>
 *      </a:menubar>
 *      <a:bar>
 *          <a:button>Questions</a:button>
 *          <a:divider />
 *          <a:button icon="icoEmail.gif">e-mail</a:button>
 *          <a:button id="btnTest" 
 *              icon    = "icoPhone.gif"
 *              caption = "Change Skin" />
 *          <a:divider />
 *          <a:progressbar value="apf.offline.position" />
 *      </a:bar>
 *  </a:toolbar>
 *
 *  <a:menu id="mnuFile">
 *      ...
 *  </a:menu>
 *  
 *  <a:menu id="mnuEdit">
 *      ...
 *  </a:menu>
 * </code>
 *
 * @constructor
 * @define toolbar
 * @addnode elements
 * @allowchild bar, menubar
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 *
 * @inherits apf.Presentation
 */

apf.toolbar = apf.component(apf.NODE_VISIBLE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    /**** DOM Hooks ****/
    
    
    /**** Init ****/

    this.$draw = function(){
        //Build Main Skin
        this.oExt = this.$getExternal();
        this.oInt = this.$getLayoutNode("main", "container", this.oExt);
    };
    
    this.$loadAml = function(x){
        var bar, tagName, i, l, node, nodes = this.$aml.childNodes;
        
        //Let's not parse our children, when we've already have them
        if (!this.oInt && this.childNodes.length) 
            return;
        
        //@todo Skin switching here...
        
        for (i = 0, l = nodes.length; i < l; i++) {
            node = nodes[i];
            if (node.nodeType != 1) 
                continue;
            
            tagName = node[apf.TAGNAME];
            if ("bar|menubar".indexOf(tagName) > -1) {
                bar = new apf.bar(this.oInt, tagName);
                bar.skinName = this.skinName
                bar.loadAml(node, this);
                
                if (tagName == "menubar") {
                    this.$setStyleClass(bar.oExt, "menubar");
    
                    //#ifdef __DEBUG
                    bar.$domHandlers["insert"].push(function(amlNode){
                        if (amlNode.tagName != "button") {
                            throw new Error(apf.formatErrorStrin(0, this,
                                "Appending a child",
                                "A menubar can only contain button elements"));
                        }
                    });
                    //#endif
                }
            }
        }
    };
}).implement(apf.Presentation);

// #endif
