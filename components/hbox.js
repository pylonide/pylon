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
 * @define vbox
 * @define hbox
 */

jpf.hbox = 
jpf.vbox = jpf.component(jpf.NODE_HIDDEN, function(){
    this.canHaveChildren = true;
    this.$focussable     = false;

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
            jmlNode.inherit(jpf.Alignment);
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
    
    this.$loadJml = function(x){
        var isParentOfChain = !this.parentNode.tagName 
          || "vbox|hbox".indexOf(this.parentNode.tagName) == -1;
        
        if (isParentOfChain) {
            this.oInt = 
            this.oExt = jpf.isParsing && jpf.xmldb.isOnlyChild(x)
                ? this.pHtmlNode 
                : this.pHtmlNode.appendChild(document.createElement("div"));
        }
        
        var l = jpf.layout.get(this.pHtmlNode, jpf.getBox(this.margin || ""));
        var aData = jpf.layout.parseXml(x, l, null, true);
        
        if (isParentOfChain) {
            this.pData = aData;
            l.root = this.pData;
            
            jpf.JmlParser.parseChildren(x, this.pHtmlNode, this);
            
            if (this.pData.children.length && !jpf.isParsing) 
                jpf.layout.compileAlignment(this.pData);
            //if(jpf.JmlParser.loaded) 
            //jpf.layout.activateRules(pHtmlNode);
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
