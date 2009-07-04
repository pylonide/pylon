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
 * The layouting engine of Javeline PlatForm lets you store layouts and set them
 * dynamically. It's very easy to make a layout manager this way. For more 
 * information see {@link object.layout}
 * @addnode elements
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.hbox = 
jpf.vbox = jpf.component(jpf.NODE_HIDDEN, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    var _self = this;

    /**** DOM Hooks ****/
    
    this.$domHandlers["removechild"].push(function(jmlNode, doOnlyAdmin){
        if (doOnlyAdmin)
            return;
        
        jmlNode.disableAlignment();
        
        //#ifdef __WITH_ANCHORING
        if (jmlNode.enableAnchoring)
            jmlNode.enableAnchoring();
        //#endif
    });
    
    this.$domHandlers["insert"].push(function(jmlNode, bNode, withinParent){
        if (withinParent)
            return;
        
        if (!jmlNode.hasFeature(__ALIGNMENT__)) {
            jmlNode.implement(jpf.Alignment);
            if (jmlNode.hasFeature(__ANCHORING__))
                jmlNode.disableAnchoring();
        }
        
        jmlNode.enableAlignment();
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
        
        if (this.pHtmlNode != this.oExt)
            this.oExt.parentNode.removeChild(this.oExt);
    });

    /**** Init ****/
    
    var isParentOfChain;
    this.$draw = function(){
        isParentOfChain = !this.parentNode.tagName 
          || "vbox|hbox".indexOf(this.parentNode.tagName) == -1;

        if (isParentOfChain) {
            var x = this.$jml;
            
            this.oInt = 
            this.oExt = jpf.isParsing && jpf.xmldb.isOnlyChild(x)
                ? this.pHtmlNode 
                : this.pHtmlNode.appendChild(document.createElement("div"));
           
            if ("absolute|relative".indexOf(jpf.getStyle(this.oInt, "position")) == -1)
                this.oInt.style.position = "relative";
        }
    }
    
    this.$loadJml = function(x){
        var l = jpf.layout.get(this.oInt, jpf.getBox(this.margin || ""));
        var aData = jpf.layout.parseXml(x, l, null, true);
        
        if (isParentOfChain) {
            this.pData = aData;
            l.root = this.pData;
            jpf.JmlParser.parseChildren(x, this.oInt, this);
            
            if (this.pData.children.length && !jpf.isParsing) 
                jpf.layout.compileAlignment(this.pData);
            //if(jpf.JmlParser.loaded) 
            //jpf.layout.activateRules(this.oInt);
            
            //#ifdef __WITH_PROPERTY_WATCH
            if (!jpf.hasSingleResizeEvent && !this.oInt.offsetHeight) {
                function propChange(name, old, value){
                    if (jpf.isTrue(value) && _self.oExt.offsetHeight) {
                        jpf.layout.forceResize(_self.oInt);
                        
                        var p = _self;
                        while (p) {
                            p.unwatch("visible", propChange);
                            p = p.parentNode;
                        }
                    }
                };
                
                this.watch("visible", propChange);
                
                var p = this.parentNode;
                while(p) {
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
            
            jpf.JmlParser.parseChildren(x, this.pHtmlNode, this);
        }
    };
});

// #endif
