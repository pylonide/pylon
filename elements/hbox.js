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
// #ifdef __AMLHBOX || __AMLVBOX || __INC_ALL

/**
 * @define vbox Container that stacks it's children vertically.
 * @see element.hbox
 * @define hbox Container that stacks it's children horizontally.
 * Example:
 * <code>
 *  <a:hbox>
 *      <a:vbox>
 *          <a:bar caption="Some Window"/>
 *          <a:bar caption="Another Window"/>
 *          <a:hbox>
 *              <a:bar caption="Redmond Window"/>
 *              <a:vbox>
 *                  <a:bar caption="Ping Window"/>
 *                  <a:bar caption="YAW window"/>
 *              </a:vbox>
 *          </a:hbox>
 *      </a:vbox>
 *      <a:bar caption="Down Window"/>
 *  </a:hbox>
 * </code>
 * Remarks:
 * The layouting engine of Ajax.org Platform lets you store layouts and set them
 * dynamically. It's very easy to make a layout manager this way. For more 
 * information see {@link object.layout}
 * @addnode elements
 * @constructor
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.9
 */
apf.hbox = function(struct, tagName){
    this.$init(tagName || "hbox", apf.NODE_VISIBLE, struct);
};
apf.vbox = function(struct, tagName){
    this.$init(tagName || "vbox", apf.NODE_VISIBLE, struct);
};

(function(){
    this.$focussable     = false;
    
    /**** DOM Hooks ****/
    //@todo rewrite these
    this.addEventListener("AMLRemoveChild", function(amlNode, doOnlyAdmin){
        if (doOnlyAdmin)
            return;
        
        if (amlNode.disableAlignment)
            amlNode.disableAlignment();
        
        //#ifdef __WITH_ANCHORING
        if (amlNode.enableAnchoring)
            amlNode.enableAnchoring();
        //#endif
    });
    
    this.addEventListener("AMLInsert",function(amlNode, bNode, withinParent){
        if (withinParent)
            return;
        
        if (!amlNode.hasFeature(apf.__ALIGNMENT__)) {
            amlNode.implement(apf.Alignment);
            if (amlNode.hasFeature(apf.__ANCHORING__))
                amlNode.$disableAnchoring();
        }
        
        amlNode.enableAlignment();
    });
    
    this.addEventListener("AMLReparent", 
        function(bNode, pNode, withinParent, oldParentHtmlNode){
            if (withinParent)
                return;
            
            if (oldParentHtmlNode == this.$ext) {
                pNode.$int.insertBefofore(
                    document.createElement("div"),
                    bNode && bNode.$ext || null
                );
            }
        });
    
    this.addEventListener("AMLRemove", function(doOnlyAdmin){
        if (!doOnlyAdmin)
        
        if (this.$pHtmlNode != this.$ext && this.$ext.parentNode)
            this.$ext.parentNode.removeChild(this.$ext);
    });

    /**** Init ****/
    
    var isParentOfChain;
    this.$draw = function(){
        isParentOfChain = !this.parentNode.tagName 
          || "vbox|hbox".indexOf(this.parentNode.tagName) == -1;

        if (isParentOfChain) {
            this.$int = 
            this.$ext = this.$pHtmlNode.appendChild(document.createElement("div"));
            this.$int.style.minHeight = "1px";
           
            if ("absolute|relative".indexOf(apf.getStyle(this.$int, "position")) == -1)
                this.$int.style.position = "relative";
            this.$int.style.overflow = "visible";
            
            //@todo shouldn't this be generic?
            //this.implement(apf.Anchoring); /** @inherits apf.Anchoring */
            //this.enableAnchoring();
        }
    }
    
    this.$loadAml = function(x){
        var l     = apf.layout.get(this.$int || this.$pHtmlNode, apf.getBox(this.margin || "")),
            aData = apf.layout.parseXml(this, l, null, true);

        if (isParentOfChain) {
            this.pData = aData;
            l.root = this.pData;

            if (this.childNodes.length)
                apf.layout.queue(this.$int || this.$pHtmlNode, null, l.root);

            //#ifdef __WITH_PROPERTY_WATCH
            if (!this.$int.offsetHeight) {
                var _self = this;
                function propChange(name, old, value){
                    if (apf.isTrue(value) && _self.$ext.offsetHeight) {
                        //apf.layout.forceResize(_self.$int);
                        apf.layout.queue(_self.$int, null, l.root);

                        var p = _self;
                        while (p) {
                            if (p.unwatch)
                                p.unwatch("visible", propChange);
                            p = p.parentNode;
                        }
                    }
                };
                
                this.watch("visible", propChange);
                
                var p = this.parentNode;
                while(p) {
                    if (p.watch)
                        p.watch("visible", propChange);
                    p = p.parentNode;
                }
                
                return;
            }
            //#endif
        }
        else {
            var pData = this.parentNode.aData || this.parentNode.pData;
            this.aData = aData;
            this.aData.stackId = pData.children.push(this.aData) - 1;
            this.aData.parent  = pData;
        }
    };
}).call(apf.vbox.prototype = new apf.GuiElement());

apf.hbox.prototype = apf.vbox.prototype;

apf.aml.setElement("hbox", apf.hbox);
apf.aml.setElement("vbox", apf.vbox);
// #endif
