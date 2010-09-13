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

// #ifdef __WITH_AMLTEXT
apf.AmlText = function(isPrototype){
    this.$init(isPrototype);
};

(function(){
    this.nodeType = this.NODE_TEXT;
    this.nodeName = "#text";
    
    this.serialize = function(){
        return apf.xmlentities(this.nodeValue).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    
    //#ifdef __ENABLE_LIVETEXT
    this.$handlePropSet = function(prop, value, force){
        this[prop] = value;
        if (prop == "data") {
            this.$clearDynamicProperty("calcdata");
            this.$setDynamicProperty(prop, value);
        }
        else if (this.$propHandlers[prop]) {
            this.$propHandlers[prop].call(this, value, prop);
        }
    };
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = {
        data : 0 //Start in code mode
    };
    
    this.getAttribute = function(){};
    
    this.mainBind = "data";
    //#endif
    
    //@todo think about using this.replaceData();
    this.$setValue = function(value){
        //if (!this.$amlLoaded)
            //return;
        
        this.dispatchEvent("DOMCharacterDataModified", {
            bubbles   : true,
            prevValue : this.nodeValue,
            newValue  : this.nodeValue = value
        });
        
        if (this.$amlLoaded && this.$ext)
            this.$ext.nodeValue = value;
    }

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var pHtmlNode;
        if (!(pHtmlNode = this.parentNode.$int) || this.parentNode.hasFeature(apf.__CHILDVALUE__)) 
            return;

        this.$amlLoaded = true;
        
        var nodeValue = this.nodeValue;

        //@todo optimize for inside elements?
        if (apf.config.liveText && !this.parentNode.hasFeature(apf.__CHILDVALUE__) 
          && (nodeValue.indexOf("{") > -1 || nodeValue.indexOf("[") > -1)) {
            
            //Convert to live markup pi
            this.$supportedProperties = [];
            this.$propHandlers        = {};
            this.$booleanProperties   = {};
            this.$inheritProperties   = {};
            
            this.$propHandlers["calcdata"] = apf.LiveMarkupPi.prototype.$propHandlers["calcdata"];
            
            this.$setInheritedAttribute = apf.AmlElement.prototype.$setInheritedAttribute;
            //#ifdef __WITH_DATABINDING
            this.implement(apf.StandardBinding);
            //#endif
            
            pHtmlNode.appendChild(this.$ext = document.createElement("span"));
            this.$setDynamicProperty("calcdata", this.nodeValue);
            
            return;
        }

        if (apf.hasTextNodeWhiteSpaceBug) {
            var nodeValue = nodeValue.replace(/[\t\n\r ]+/g, " ");

            if (nodeValue && nodeValue != " ")
                this.$ext = pHtmlNode.appendChild(
                  pHtmlNode.ownerDocument.createTextNode(nodeValue));
        }
        else
            this.$ext = pHtmlNode.appendChild(
              pHtmlNode.ownerDocument.createTextNode(nodeValue));
    }, true);
}).call(apf.AmlText.prototype = new apf.AmlCharacterData());
// #endif
