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

// #ifdef __WITH_AMLATTR
apf.AmlAttr = function(ownerElement, name, value){
    this.$init();
    
    if (ownerElement) {
        this.ownerElement  = ownerElement;
        this.ownerDocument = ownerElement.ownerDocument;
    }
    
    this.nodeName  = this.name  = name;
    this.nodeValue = this.value = value;
};

(function(){
    this.nodeType  = this.NODE_ATTRIBUTE;
    
    this.MODIFICATION = 1;
    this.ADDITION     = 2;
    this.REMOVAL      = 3;
    
    this.serialize = 
    this.toString  = function(){
        return this.name + "=\"" + apf.xmlentities(String(this.value))
            .replace(/</g, "&lt;").replace(/>/g, "&gt;") + "\"";
    };
    
    //#ifndef __PACKAGED
    /**
     * Attribute name
     */
    this.name = null;
    
    /**
     * Attribute value
     */
    this.value = null;
    
    /**
     * References the element that the attribute belongs to
     */
    this.ownerElement = null;
    
    /**
     * Indicates wether the value of the attribute is specified or not
     */
    this.specifed = false;
    //#endif
    
    this.$setValue = function(value){
        this.nodeValue = this.value = value;
        this.specified = true;

        //@todo apf3.0 domattr
        this.ownerElement.dispatchEvent("DOMAttrModified", {
            relatedNode : this,
            attrChange  : this.MODIFICATION,
            attrName    : this.name,
            newValue    : value,
            prevValue   : this.$lastValue || "",
            bubbles     : true
        });
        
        this.$lastValue = value;
    };
    
    this.$triggerUpdate = function(e, oldValue){
        var name  = this.name,
            value = this.value || this.nodeValue,
            host  = this.ownerElement;

        if (name == "id" && !this.specified && host.id) {
            this.specified = true;
            return;
        }

        if (name.substr(0, 2) == "on") {
            if (host.$events[name])
                host.removeEventListener(name.replace(/^on/, ""), host.$events[name]);
            if (value)
                host.addEventListener(name, (host.$events[name] = 
                  (typeof value == "string"
                    ? // #ifdef __WITH_JSLT_EVENTS
                      apf.lm.compile(value, {event: true, parsecode: true})
                      /* #else
                      new Function('event', value)
                      #endif */
                    : value)));
            return;
        }
        //#ifdef __WITH_PROPERTY_BINDING
        if (this.specified)
            host.$clearDynamicProperty(name);
        
        if (typeof value == "string" && (host.$attrExcludePropBind[name] || 
          (value.indexOf("{") > -1 || value.indexOf("[") > -1)))
            host.$setDynamicProperty(name, value);
        else
        //#endif
        {
            host.setProperty(name, value); //@todo apf3.0 is this a lot slower?
        }
        //host.$handlePropSet(name, value);

        if (this.specified) {
            //@todo apf3.0 domattr - slow?
            host.dispatchEvent("DOMAttrModified", { //@todo this is not good, node might not be specified at init
                relatedNode : this,
                attrChange  : this.MODIFICATION,
                attrName    : name,
                newValue    : value,
                prevValue   : this.$lastValue || "",
                bubbles     : true
            });
        }
        else this.specified = true;
            
        this.$lastValue = value;
    };
    
    //@todo apf3.0 domattr
    this.addEventListener("DOMNodeInsertedIntoDocument", this.$triggerUpdate);
}).call(apf.AmlAttr.prototype = new apf.AmlNode());
// #endif