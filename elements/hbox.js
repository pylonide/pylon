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
// #ifdef __JHBOX || __JVBOX || __INC_ALL

/**
 * @define vbox Container that stacks it's children vertically.
 * @see element.hbox
 * @define hbox Container that stacks it's children horizontally.
 * Example:
 * <code>
 *  <j:hbox>
 *      <j:vbox>
 *          <j:bar caption="Some Window"/>
 *          <j:bar caption="Another Window"/>
 *          <j:hbox>
 *              <j:bar caption="Redmond Window"/>
 *              <j:vbox>
 *                  <j:bar caption="Ping Window"/>
 *                  <j:bar caption="YAW window"/>
 *              </j:vbox>
 *          </j:hbox>
 *      </j:vbox>
 *      <j:bar caption="Down Window"/>
 *  </j:hbox>
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
apf.hbox = 
apf.vbox = apf.component(apf.NODE_HIDDEN, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    var _self = this;

    /**** DOM Hooks ****/
    
    this.$domHandlers["removechild"].push(function(amlNode, doOnlyAdmin){
        if (doOnlyAdmin)
            return;
        
        if (amlNode.disableAlignment)
            amlNode.disableAlignment();
        
        //#ifdef __WITH_ANCHORING
        if (amlNode.enableAnchoring)
            amlNode.enableAnchoring();
        //#endif
    });
    
    this.$domHandlers["insert"].push(function(amlNode, bNode, withinParent){
        if (withinParent)
            return;
        
        if (!amlNode.hasFeature(__ALIGNMENT__)) {
            amlNode.implement(apf.Alignment);
            if (amlNode.hasFeature(__ANCHORING__))
                amlNode.disableAnchoring();
        }
        
        amlNode.enableAlignment();
    });
    
    this.$domHandlers["reparent"].push(
        function(bNode, pNode, withinParent, oldParentHtmlNode){
            if (withinParent)
                return;
            
            if (oldParentHtmlNode == this.oExt) {
                pNode.oInt.insertBefofore(
                    document.createElement("div"),
                    bNode && bNode.oExt || null
                );
            }
        });
    
    this.$domHandlers["remove"].push(function(doOnlyAdmin){
        if (!doOnlyAdmin)
        
        if (this.pHtmlNode != this.oExt && this.oExt.parentNode)
            this.oExt.parentNode.removeChild(this.oExt);
    });

    /**** Init ****/
    
    var isParentOfChain;
    this.$draw = function(){
        isParentOfChain = !this.parentNode.tagName 
          || "vbox|hbox".indexOf(this.parentNode.tagName) == -1;

        if (isParentOfChain) {
            var x = this.$aml;
            
            this.oInt = 
            this.oExt = false && apf.isParsing && apf.xmldb.isOnlyChild(x)
                ? this.pHtmlNode 
                : this.pHtmlNode.appendChild(document.createElement("div"));
           
            if ("absolute|relative".indexOf(apf.getStyle(this.oInt, "position")) == -1)
                this.oInt.style.position = "relative";
            this.oInt.style.overflow = "hidden";
            
            this.implement(apf.Anchoring); /** @inherits apf.Anchoring */
            this.enableAnchoring();
        }
    }
    
    this.$loadAml = function(x){
        var l = apf.layout.get(this.oInt || this.pHtmlNode, apf.getBox(this.margin || ""));
        var aData = apf.layout.parseXml(x, l, null, true);
        
        if (isParentOfChain) {
            this.pData = aData;
            l.root = this.pData;
            
            apf.AmlParser.parseChildren(x, this.oInt, this);
            
            if (this.pData.children.length && !apf.isParsing) 
                apf.layout.compileAlignment(this.pData);
            //if(apf.AmlParser.loaded) 
            //apf.layout.activateRules(this.oInt);
            
            //#ifdef __WITH_PROPERTY_WATCH
            if (!this.oInt.offsetHeight) {
                function propChange(name, old, value){
                    if (apf.isTrue(value) && _self.oExt.offsetHeight) {
                        apf.layout.forceResize(_self.oInt);
                        
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
            
            apf.AmlParser.parseChildren(x, this.pHtmlNode, this);
        }
    };
});

// #endif
