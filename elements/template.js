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

// #ifdef __JTEMPLATE || __INC_ALL

/**
 * Defines a template for jml elements. 
 *
 * @constructor
 * @allowchild {elements}, {anyjml}
 *
 * @define template
 * @addnode elements
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.4
 */

jpf.template = jpf.component(jpf.NODE_HIDDEN, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    var instances = [];
    
    this.render = function(pHtmlNode, forceNewInstance){
        if (!instances.length || forceNewInstance) {
            //var p = jpf.document.createDocumentFragment();
            //p.oExt = p.oInt = pHtmlNode;
            instances.push(this.childNodes = []);
        }
        else {
            var nodes = this.childNodes = instances[0];
            for (var i = 0, l = nodes.length; i < l; i++) {
                pHtmlNode.appendChild(nodes[i].oExt);
            }
            
            return nodes;
        }
        
        jpf.JmlParser.parseMoreJml(this.$jml, pHtmlNode, this, true);
        
        return this.childNodes;
    }
    
    //this.$draw = function(pHtmlNode){};
    this.$loadJml = function(x){
        if (this.autoinit) {
            jpf.JmlParser.parseChildren(this.$jml, document.body, this);
            
            var nodes = this.childNodes;
            var p = nodes[0].oExt.parentNode;
            for (var i = 0, l = nodes.length; i < l; i++) {
                p.removeChild(nodes[i].oExt);
            }
            
            instances.push(this.childNodes);
        }
    };
});

// #endif