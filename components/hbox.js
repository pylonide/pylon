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
jpf.vbox = jpf.component(jpf.NOGUI_NODE, function(){

    /**** DOM Hooks ****/
    
    this.__domHandlers["removechild"].push(function(jmlNode, doOnlyAdmin){
        if (doOnlyAdmin)
            return;
        
        jmlNode.disableAlignment();
        
        //#ifdef __WITH_ANCHORING
        if (jmlNode.enableAlignment)
            jmlNode.enableAlignment();
        //#endif
    });
    
    this.__domHandlers["insert"].push(function(jmlNode, bNode, withinParent){
        if (withinParent)
            return;
        
        if (!jmlNode.hasFeature(__ALIGNMENT__))
            jmlNode.inherit(jpf.Alignment);
        
        jmlNode.enableAlignment();
    });
    
    this.__domHandlers["reparent"].push(
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
    
    this.__domHandlers["remove"].push(function(doOnlyAdmin){
        if (!doOnlyAdmin)
        
        if (this.pHtmlNode != this.oExt)
            this.oExt.parentNode.removeChild(this.oExt);
    });

    /**** Init ****/
    
    this.__loadJml = function(x){
        var isParentOfChain = !this.parentNode.tagName 
          || "vbox|hbox".indexOf(this.parentNode.tagName) == -1;
        
        if (isParentOfChain) {
            this.oInt = 
            this.oExt = jpf.isParsing && jpf.xmldb.isOnlyChild(x)
                ? pHtmlNode 
                : pHtmlNode.appendChild(document.createElement("div"));
        }
        
        var l = jpf.layoutServer.get(pHtmlNode, 
            jpf.getBox(x.getAttribute("margin") || ""));
        var aData = jpf.layoutServer.parseXml(x, l, null, true);
        
        jpf.JmlParser.parseChildren(x, pHtmlNode, this);
        
        if (isParentOfChain) {
            this.pData = aData;
            l.root = this.pData;
            
            if (this.pData.children.length && !jpf.isParsing) 
                jpf.layoutServer.compileAlignment(this.pData);
            //if(jpf.JmlParser.loaded) 
            //jpf.layoutServer.activateRules(pHtmlNode);
        }
        else {
            this.aData = aData;
            this.aData.stackId = this.parentNode.aData.children.push(this.aData) - 1;
            this.aData.parent  = this.parentNode.aData;
        }
    }
}

// #endif
