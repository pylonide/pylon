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
 * Defines a template for aml elements. 
 *
 * @constructor
 * @allowchild {elements}, {anyaml}
 *
 * @define template
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.4
 */

apf.template = apf.subnode(apf.NODE_HIDDEN, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    var instances = [];
    var attached;
    
    //render is deprecated
    this.render = 
    this.attach = function(pHtmlNode, forceNewInstance, clearParent){
        attached = pHtmlNode;

        if (clearParent)
            pHtmlNode.innerHTML = "";
        
        if (!instances.length || forceNewInstance) {
            //var p = apf.document.createDocumentFragment();
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
        
        apf.AmlParser.parseMoreAml(this.$aml, pHtmlNode, this, true);
        
        return this.childNodes;
    }
    
    this.$domHandlers["insert"].push(function(amlNode, bNode, withinParent){
        if (withinParent)
            return;
        
        //Detach unless we're attached
        if (attached) 
            attached.insertBefore(amlNode.oExt, bNode && bNode.oExt);
        else 
            amlNode.oExt.parentNode.removeChild(amlNode.oExt);
        
        if (!instances.length)
            instances.push(this.childNodes);
    });
    
    this.detach = function(){
        attached = false;
        
        var nodes = this.childNodes;
        var p = nodes[0].oExt.parentNode;
        if (!p || p.nodeType != 1)
            return;

        for (var i = 0, l = nodes.length; i < l; i++) {
            p.removeChild(nodes[i].oExt);
        }
    }
    
    //this.$draw = function(pHtmlNode){};
    this.loadAml = function(x){
        if (this.autoinit) {
            apf.AmlParser.parseChildren(this.$aml, document.body, this);
            this.detach();
            
            instances.push(this.childNodes);
        }
    };
});

// #endif
