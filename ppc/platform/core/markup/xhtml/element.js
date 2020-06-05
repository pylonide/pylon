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

//#ifdef __PARSER_XHTML

ppc.XhtmlElement = function(struct, tagName){
    this.$init(tagName || true, ppc.NODE_VISIBLE, struct);
    
    this.$xoe                = this.addEventListener;
    this.addEventListener    = this.$xae;
    this.removeEventListener = this.$xre;
    
    var _self = this;
    this.$de = function(e){
        _self.dispatchEvent(e.type, null, e);
    }
};

(function(){
    var excludedEvents = {
        "contextmenu": 1,
        "keydown": 1,
        "keypress": 1,
        "keyup": 1,
        "DOMNodeInserted": 2,
        "DOMNodeInsertedIntoDocument": 2,
        "DOMNodeRemoved": 2,
        "DOMNodeRemovedFromDocument": 2
    };
    
    this.$xae = function(type, fn){
        this.$xoe.apply(this, arguments);
        
        if (excludedEvents[type] > (this.editable ? 0 : 1)
          || type.substr(0, 5) == "prop.")
            return;
        
        if (this.$ext) {
            if (type.substr(0,2) == "on")
                type = type.substr(2);
            ppc.addListener(this.$ext, type, this.$de);
        }
    };
    
    this.$xre = function(type, fn) {
        ppc.AmlElement.prototype.removeEventListener.apply(this, arguments);
        
        //#ifdef __WITH_CONTENTEDITABLE
        if (this.editable && "contextmenu|keydown|keypress|keyup".indexOf(type) > -1)
            return;
        //#endif
        
        if (this.$ext)
            ppc.removeListener(this.$ext, type, this.$de);
    }
    
    this.$handlePropSet = function(name, value, force, inherit){
        if (this.$booleanProperties[name])
            value = ppc.isTrue(value);

        this[name] = value;
        var handler = this.$propHandlers && this.$propHandlers[name]
          || ppc.GuiElement.propHandlers[name];

        if (handler)
            handler.call(this, value, null, name);
        else if (this.$int && (force || this.$amlLoaded)) {
            this.$int.setAttribute(ppc.isIE && ppc.isIE < 8 && name == "class" 
                ? "className" : name, value);
        }
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var pHtmlNode;
        if (!(pHtmlNode = this.$pHtmlNode = this.parentNode.$int)) 
            return;

        var str, aml = this.$aml;
        if (aml) {
            if (aml.serialize)
                str = aml.serialize();
            else {
                aml = aml.cloneNode(false);
                str = aml.xml || aml.nodeValue;
            }

            str = str.replace(/ on\w+="[^"]*"| on\w+='[^']*'/g, "");
            
            this.$ext = 
            this.$int = ppc.insertHtmlNode(null, pHtmlNode, null, ppc.html_entity_decode(str));
        }
        else {
            this.$ext = this.$int = 
              pHtmlNode.appendChild(document.createElement(this.localName));
        }
        
        if (this.localName != "a")
            this.$ext.host = this;

        this.style = this.$ext.style;
    }, true);
    
    //#ifdef __WITH_GUIELEMENT
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.$amlLoaded = true;
        
        if (this.$setLayout)
            this.$setLayout();
    });
    //#endif
}).call(ppc.XhtmlElement.prototype = new ppc.AmlElement());

ppc.Init.addConditional(function(){
    if (ppc.isO3) return;
    var prot = ppc.XhtmlElement.prototype;

    //prot.implement(ppc.Interactive);
    prot.implement(
        //#ifdef __WITH_ANCHORING
        ppc.Anchoring
        //#endif
    );

    //#ifdef __WITH_GUIELEMENT
    prot.$drawn = true;
    prot.$setLayout = ppc.GuiElement.prototype.$setLayout;
    
    prot.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget == this 
          && "vbox|hbox|table".indexOf(this.parentNode.localName) == -1) {
            this.$setLayout();
        }
    }); 
    /* #else
    prot.$enableAnchoring();
    #endif */
}, null, ["interactive"]);

ppc.xhtml.setElement("@default", ppc.XhtmlElement);
//#endif
