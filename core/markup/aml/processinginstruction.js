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

// #ifdef __WITH_AMLPROCESSINGINSTRUCTION
apf.AmlProcessingInstruction = function(isPrototype){
    this.$init(isPrototype);
    
    //@todo apf3.0 possibly move this to an init function
    this.$supportedProperties = [];
    this.$propHandlers        = {};
    this.$booleanProperties   = {};
    this.$inheritProperties   = {};
};

(function(){
    this.nodeType = this.NODE_PROCESSING_INSTRUCTION;
    
    /**
     * @todo docs
     */
    this.data   = null;
    
    /**
     * @todo docs
     */
    this.target = null;
    
    this.serialize = function(){
        return "<?" + this.target + "\n" + apf.xmlentities(this.nodeValue) + "\n?>";
    };
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        calcdata : 0 //Start in code mode
    }, this.$attrExcludePropBind);
    
    this.getAttribute = function(){};
    this.$setInheritedAttribute = apf.AmlElement.prototype.$setInheritedAttribute;
    
    this.$handlePropSet = function(prop, value, force){
        this[prop] = value;
        
        if (prop == "data") {
            this.$clearDynamicProperty("calcdata");
            this.$setDynamicProperty("calcdata", value);
        }
        else if (prop == "target") {
            //not implemented
        }
        else if (this.$propHandlers[prop]) {
            this.$propHandlers[prop].call(this, value, prop);
        }
    };

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var pHtmlNode;
        if (this.parentNode.$bindingRule || !(pHtmlNode = this.parentNode.$int)) 
            return;

        pHtmlNode.appendChild(this.$ext = this.$int = document.createElement("span"));
        this.$ext.host = this;

        this.$setDynamicProperty("calcdata", this.data);
    }, true);
    
    this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        this.$clearDynamicProperty("calcdata");
    });
}).call(apf.AmlProcessingInstruction.prototype = new apf.AmlNode());
// #endif