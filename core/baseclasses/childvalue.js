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
    this.$regbase       = this.$regbase | apf.__CHILDVALUE__;
    
    var f;
    this.addEventListener("DOMCharacterDataModified", f = function(e){
        if (e.currentTarget == this)
            return;
        
        //Get value from xml (could also serialize children, but that is slower
        var m = this.serialize().match(/^[\s\S]*?>([\s\S]*)<[\s\S]*?$/),
            v = m && m[1] || "";

        //#ifdef __WITH_PROPERTY_BINDING
        if (v.indexOf("{") > -1 || v.indexOf("[") > -1) {
            this.$setDynamicProperty(this.$childProperty, v);
        }
        else
        //#endif
            this.setProperty(this.$childProperty, v);
    });
    
    this.addEventListener("DOMNodeInserted", f);
    this.addEventListener("DOMNodeRemoved", f);
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        if (!this.getElementsByTagNameNS(this.namespaceURI, "*").length 
          && (this.childNodes.length > 1 || this.firstChild 
          && (this.firstChild.nodeType == 1 
          || this.firstChild.nodeType != 7 
          && this.firstChild.nodeValue.trim().length))) {
            //Get value from xml (could also serialize children, but that is slower
            var m = (this.$aml && this.$aml.xml || this.serialize()).match(/^[\s\S]*?>([\s\S]*)<[\s\S]*?$/),
                v = m && m[1] || "";

            //#ifdef __WITH_PROPERTY_BINDING
            if (v.indexOf("{") > -1 || v.indexOf("[") > -1)
                this.$setDynamicProperty(this.$childProperty, v);
            else
            //#endif
                this.setProperty(this.$childProperty, v);
        }
        else if (typeof this[this.$childProperty] == "undefined")
            this.$propHandlers[this.$childProperty].call(this, "");
    });
};
// #endif
