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

apf.XhtmlElement = function(struct, tagName){
    this.$init(tagName || true, apf.NODE_VISIBLE, struct);
    
    this.$xoe                = this.addEventListener;
    this.addEventListener    = this.$xae;
    this.removeEventListener = this.$xre;
    
    var _self = this;
    this.$de = function(e){
        _self.dispatchEvent(e.type, e);
    }
};

(function(){
    this.$xae = function(type, fn){
        this.$xoe.apply(this, arguments);
        
        //#ifdef __WITH_CONTENTEDITABLE
        if (this.editable && "contextmenu|keydown|keypress|keyup".indexOf(type) > -1)
            return;
        //#endif
        
        if (this.$ext)
            apf.addListener(this.$ext, type, this.$de);
    };
    
    this.$xre = function(type, fn) {
        apf.AmlElement.prototype.removeEventListener.apply(this, arguments);
        
        //#ifdef __WITH_CONTENTEDITABLE
        if (this.editable && "contextmenu|keydown|keypress|keyup".indexOf(type) > -1)
            return;
        //#endif
        
        if (this.$ext)
            apf.removeListener(this.$ext, type, this.$de);
    }
    
    this.$handlePropSet = function(name, value, force){
        if (this.$booleanProperties[name])
            value = apf.isTrue(value);

        this[name] = value;
        
        if (!this.$amlLoaded) return; //@todo optimize by namespacing attributes
        
        var handler = this.$propHandlers && this.$propHandlers[name]
          || apf.GuiElement.propHandlers[name];
        
        if (handler)
            handler.call(this, value, null, name);
        else if (this.$int) {
            this.$int.setAttribute(apf.isIE && name == "class" 
                ? "className" : name, value);
        }
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var pHtmlNode;
        if (!(pHtmlNode = this.$pHtmlNode = this.parentNode.$int)) 
            return;

        if (this.$aml) {
            this.$ext = 
            this.$int = apf.insertHtmlNode(this.$aml.serialize
                ? this.$aml 
                : this.$aml.cloneNode(false), pHtmlNode);
        }
        else {
            this.$ext = this.$int = 
              pHtmlNode.appendChild(document.createElement(this.localName));
        }
    }, true);
    
    //#ifdef __WITH_GUIELEMENT
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.$amlLoaded = true;
        this.$setLayout();
    });
    //#endif
}).call(apf.XhtmlElement.prototype = new apf.AmlElement());

apf.Init.addConditional(function(){
    if (apf.isO3) return;
    var prot = apf.XhtmlElement.prototype;

    //prot.implement(apf.Interactive);
    prot.implement(
        //#ifdef __WITH_ANCHORING
        apf.Anchoring
        //#endif
        //#ifdef __WITH_ALIGNMENT
        ,apf.Alignment
        //#endif
    );

    //#ifdef __WITH_GUIELEMENT
    prot.$drawn = true;
    prot.$setLayout = apf.GuiElement.prototype.$setLayout;
    
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

apf.xhtml.setElement("@default", apf.XhtmlElement);
//#endif
