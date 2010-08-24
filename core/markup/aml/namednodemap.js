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

// #ifdef __WITH_AMLNAMEDNODEMAP
//@todo apf3.0
apf.AmlNamedNodeMap = function(host){
    this.$host = host;
};

(function(){
    this.getNamedItem    = function(name){
        for (var i = 0; i < this.length; i++) {
            if (this[i].name == name)
                return this[i];
        }
        return false;
    };
    
    this.setNamedItem    = function(node){
        var name = node.name;
        for (var item, i = this.length - 1; i >= 0; i--) {
            if (this[i].name == name) {
                this[i].ownerElement = null;
                this.splice(i, 1);
                break;
            }
        }
        
        this.push(node);
        
        node.ownerElement = this.$host;
        node.ownerDocument = this.$host.ownerDocument;
        node.$triggerUpdate();
    };
    
    //@todo apf3.0 domattr
    this.removeNamedItem = function(name){
        //Should deconstruct dynamic properties
        
        for (var item, i = this.length - 1; i >= 0; i--) {
            if (this[i].name == name) {
                item = this[i];
                this.splice(i, 1);
                break;
            }
        }
        if (!item) return false;

        //@todo hack!
        //this should be done properly
        var oldValue = item.nodeValue;
        item.nodeValue = item.value = "";
        item.$triggerUpdate(null, oldValue);
        item.ownerElement = null;
        item.nodeValue    = item.value = oldValue;
        
        return item;
    };
    
    this.item            = function(i){
        return this[i];
    };

    //if (apf.isIE < 8) { //Only supported by IE8 and above
        this.length = 0;
        
        this.splice = function(pos, length){
            for (var i = pos, l = this.length - length; i < l; i++) {
                this[i] = this[i + 1];
            }
            delete this[i];
            this.length -= length;
        }
        
        this.push = function(o) {
            this[this.length++] = o;
            return this.length;
        }
    //}
    
    this.join = function(glue){
        var x = [];
        for (var e, a, i = 0, l = this.length; i < l; i++) {
            if ((e = (a = this[i]).ownerElement) && e.$inheritProperties[a.nodeName] != 2)
                x.push(this[i]);
        }
        return x.join(glue);
    }
}).call(apf.AmlNamedNodeMap.prototype = {}); //apf.isIE < 8 ? {} : []
// #endif