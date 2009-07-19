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

// #ifdef __JSTATUSBAR || __INC_ALL

/**
 * Element displaying a bar consisting of panels containing other text, icons
 * and more aml. This element is usually placed in the bottom of the screen to 
 * display context sensitive and other information about the state of the 
 * application.
 * Example:
 * <code>
 *   <j:statusbar align="bottom">
 *      <j:panel>
 *          Ajax.org Platform
 *      </j:panel>
 *      <j:progressbar value="{apf.offline.position}" />
 *      <j:panel>
 *      
 *      </j:panel>
 *  </j:statusbar>
 * </code>
 *
 * @constructor
 * @define statusbar
 * @allowchild panel
 * @allowchild progressbar
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 */

apf.statusbar = apf.component(apf.NODE_VISIBLE, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    /**** DOM Hooks ****/
    var insertChild;
    
    this.$domHandlers["removechild"].push(function(amlNode, doOnlyAdmin){
        if (doOnlyAdmin)
            return;

    });
    
    this.$domHandlers["insert"].push(insertChild = function (amlNode, beforeNode, withinParent){
        if (amlNode.tagName != "panel")
            return;
        
        amlNode.$propHandlers["caption"] = function(value){
            apf.xmldb.setNodeValue(
                this.$getLayoutNode("panel", "caption", this.oExt), value);
        }
        amlNode.$propHandlers["icon"] = function(value){
            var oIcon = this.$getLayoutNode("panel", "icon", this.oExt);
            if (!oIcon) return;
        
            if (value)
                this.$setStyleClass(this.oExt, this.baseCSSname + "Icon");
            else
                this.$setStyleClass(this.oExt, "", [this.baseCSSname + "Icon"]);
            
            if (oIcon.tagName == "img") 
                oIcon.setAttribute("src", value ? this.iconPath + value : "");
            else {
                oIcon.style.backgroundImage = value 
                    ? "url(" + this.iconPath + value + ")"
                    : "";
            }
        }
    });
    
    
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
            if (tagName == "panel") {
                bar = new apf.panel(this.oInt, tagName);
                bar.skinName = this.skinName
                insertChild.call(this, bar);
                bar.loadAml(node, this);
                
                bar.setCaption = function(value){
                    bar.oInt.innerHTML = value;
                }
                
                /*if (!bar.caption && node.childNodes.length == 1 
                  && "3|4".indexOf(node.childNodes.nodeType) > -1)
                    amlNode.setCaption(node.firstChild.nodeValue);*/
            }
            else if (tagName == "progressbar") {
                new apf.progressbar(this.oInt, tagName).loadAml(node, this);
            }
        }
        
        if (bar) {
            this.$setStyleClass(bar.oExt, bar.baseCSSname + "Last");
        }
    };
}).implement(apf.Presentation);

// #endif