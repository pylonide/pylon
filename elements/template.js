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

// #ifdef __AMLTEMPLATE || __INC_ALL

/**
 * Defines a template for aml elements. 
 *
 * @constructor
 * @allowchild {elements}, {anyaml}
 *
 * @define template
 * @addnode elements
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       0.4
 */

apf.template = function(struct, tagName){
    this.$init(tagName || "template", apf.NODE_HIDDEN, struct);
};

(function(){
    this.$focussable     = false;
    
    this.$frags = {};
    this.getNewInstance = function(htmlNode, id, xmlNode, preventLastPass){
        if (this.$frags[id]) {
            var frag = this.$frags[id];
        }
        else {
            var model, xpath, attr, frag = this.$frags[id] = this.cloneNode(true);
            frag.$int = htmlNode;
            if (xmlNode) { //@todo apf3.0 is this generic enough?
                model = apf.xmldb.findModel(xmlNode);
                xpath = apf.xmlToXpath(xmlNode, model.data, true) || ".";
                frag.attributes.push(attr = new apf.AmlAttr(frag, "model", ""));
                attr.inheritedValue = [model.name, xpath]; //@todo apf3.0 to be tested
            }
            frag.ownerDocument.$domParser.$continueParsing(frag, {delay:true});
        }
        
        return frag;
    }
    
    this.destroyInstance = function(id){
        var frag = this.$frags[id];
        delete this.$frags[id];

        frag.destroy(true);
    }
}).call(apf.template.prototype = new apf.AmlElement());

apf.aml.setElement("template", apf.template);
// #endif
