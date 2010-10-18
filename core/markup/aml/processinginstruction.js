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
    
    this.reload = function(){
        this.$handlePropSet("data", this.data);
    };
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = apf.extend({
        calcdata : 0 //Start in code mode
    }, this.$attrExcludePropBind);
    
    this.getAttribute = function(){};
    this.$setInheritedAttribute = apf.AmlElement.prototype.$setInheritedAttribute;
    this.$supportedProperties = [];
    this.$propHandlers        = {};
    this.$booleanProperties   = {};
    this.$inheritProperties   = {};
    
    //#ifdef __WITH_LIVEEDIT
    apf.LiveEdit && this.implement(apf.LiveEdit);
    //#endif
    
    this.$setValue = function(value){
        this.setProperty("data", value);
    };
    
    this.$handlePropSet = function(prop, value, force){
        this[prop] = value;
        if (prop == "data") {
            this.$clearDynamicProperty("calcdata");
            this.$setDynamicProperty("calcdata", value);
        }
        // #ifdef __WITH_LIVEEDIT
        else if (prop == "liveedit") {
            this.$propHandlers["liveedit"].call(this, value);

            this.$clearDynamicProperty("calcdata");
            this.$setDynamicProperty("calcdata", this.data);
        }
        // #endif
        else if (prop == "target") {
            //not implemented
        }
        else if (this.$propHandlers[prop]) {
            this.$propHandlers[prop].call(this, value, prop);
        }
    };

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var pHtmlNode = e.pHtmlNode;
        if (!pHtmlNode && (this.parentNode.$bindingRule 
          || !(pHtmlNode = this.parentNode.$int))) 
            return;

        pHtmlNode.appendChild(this.$ext = document.createElement("span"));
        this.$ext.host = this;

        // #ifdef __WITH_LIVEEDIT
        if (!this.hasFeature(apf.__LIVEEDIT__)) {
            this.implement(apf.LiveEdit);
        }
        
        this.liveedit = apf.isTrue(apf.getInheritedAttribute(this, "liveedit"));
        if (this.liveedit) {
            //this.implement(apf.LiveEdit);
            this.$inheritProperties["liveedit"] = 2;
            this.$propHandlers["liveedit"].call(this, this.liveedit);
        }
        //#endif

        this.$setDynamicProperty("calcdata", this.data);
        
        //#ifdef __DEBUG
        if (this.target.match(/\-debug$/)) {
            apf.console.info(this.$lastFParsed.toString());
        }
        //#endif
    }, true);
    
    /*this.addEventListener("DOMNodeRemovedFromDocument", function(e){
        this.$clearDynamicProperty("calcdata");
    });*/
    
    this.$destroy = function(){
        this.$clearDynamicProperty("calcdata");
        this.$propHandlers["calcdata"].call(this, "");
    };
}).call(apf.AmlProcessingInstruction.prototype = new apf.AmlNode());
// #endif