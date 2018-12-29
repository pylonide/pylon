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

apf.__CHILDVALUE__ = 1 << 27;

//#ifdef __WITH_CHILDVALUE
apf.ChildValue = function(){
    if (!this.$childProperty)
        this.$childProperty = "value";
    
    this.$regbase = this.$regbase | apf.__CHILDVALUE__;
    
    var f, re = /^[\s\S]*?>(<\?lm)?([\s\S]*?)(?:\?>)?<[^>]*?>$/;
    this.addEventListener("DOMCharacterDataModified", f = function(e){
        if (e && (e.currentTarget == this 
          || e.currentTarget.nodeType == 2 && e.relatedNode == this)
          || this.$amlDestroyed)
            return;

        if (this.getAttribute(this.$childProperty))
            return;
        
        //Get value from xml (could also serialize children, but that is slower
        var m = this.serialize().match(re),
            v = m && m[2] || "";
        if (m && m[1])
            v = "{" + v + "}";

        this.$norecur = true;

        //#ifdef __WITH_PROPERTY_BINDING
        if (v.indexOf("{") > -1 || v.indexOf("[") > -1)
            this.$setDynamicProperty(this.$childProperty, v);
        else
        //#endif
        if (this[this.$childProperty] != v)
            this.setProperty(this.$childProperty, v);
       
        this.$norecur = false;
    });
    
    //@todo Should be buffered
    this.addEventListener("DOMAttrModified", f);
    this.addEventListener("DOMNodeInserted", f);
    this.addEventListener("DOMNodeRemoved", f);
    
    this.addEventListener("$skinchange", function(e){
       this.$propHandlers[this.$childProperty].call(this, this.caption || "");
    });
    
    this.$init(function(){
       this.addEventListener("prop." + this.$childProperty, function(e){
           if (!this.$norecur && !e.value && !this.getAttributeNode(this.$childProperty))
               f.call(this);
       });
    });

    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var hasNoProp = typeof this[this.$childProperty] == "undefined";
        
        //this.firstChild.nodeType != 7 && 
        if (hasNoProp
          && !this.getElementsByTagNameNS(this.namespaceURI, "*", true).length 
          && (this.childNodes.length > 1 || this.firstChild 
          && (this.firstChild.nodeType == 1 
          || this.firstChild.nodeValue.trim().length))) {
            //Get value from xml (could also serialize children, but that is slower
            var m = (this.$aml && this.$aml.xml || this.serialize()).match(re),
                v = m && m[2] || "";
            if (m && m[1])
                v = "{" + v + "}";

            //#ifdef __WITH_PROPERTY_BINDING
            if (v.indexOf("{") > -1 || v.indexOf("[") > -1)
                this.$setDynamicProperty(this.$childProperty, v);
            else
            //#endif
                this.setProperty(this.$childProperty, apf.html_entity_decode(v)); //@todo should be xml entity decode
        }
        else if (hasNoProp)
            this.$propHandlers[this.$childProperty].call(this, "");
    });
};
// #endif
