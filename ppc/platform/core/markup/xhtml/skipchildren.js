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
ppc.XhtmlSkipChildrenElement = function(struct, tagName){
    this.$init(tagName, ppc.NODE_VISIBLE, struct);
};

(function(){
    this.canHaveChildren = false;
    
    this.$redraw = function(){
        var _self = this;
        ppc.queue.add("redraw" + this.$uniqueId, function(){
            var pHtmlNode  = _self.$ext.parentNode;
            var beforeNode = _self.$ext.nextSibling;
            pHtmlNode.removeChild(_self.$ext);
            
            _self.$ext = ppc.insertHtmlNode(null, pHtmlNode, beforeNode, _self.$aml 
                ? (_self.$aml.serialize ? _self.$aml.serialize() : _self.$aml.xml)
                : _self.serialize());
        });
    }
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        var pHtmlNode;
        if (!(pHtmlNode = this.parentNode.$int)) 
            return;

        this.$ext = ppc.insertHtmlNode(null, pHtmlNode, null, this.$aml 
            ? (this.$aml.serialize ? this.$aml.serialize() : this.$aml.xml)
            : this.serialize());
    }, true);
}).call(ppc.XhtmlSkipChildrenElement.prototype = new ppc.AmlElement());

ppc.xhtml.setElement("object", ppc.XhtmlSkipChildrenElement);
ppc.xhtml.setElement("embed", ppc.XhtmlSkipChildrenElement);
ppc.xhtml.setElement("table", ppc.XhtmlSkipChildrenElement);

ppc.xhtml.setElement("pre", ppc.XhtmlSkipChildrenElement);
//#endif