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

// #ifdef (__JPORTAL || __ENABLE_WINDW_WIDGET) && (__JMODALWINDOW || __INC_ALL)

jpf.modalwindow.widget = function(){
    var nX, nY, verdiff, hordiff, cData;
    var _self   = this;

    this.dragStart = function(e){
        if (!e) e = event;

        nX = _self.oExt.offsetLeft - e.clientX;
        nY = _self.oExt.offsetTop - e.clientY;

        var htmlNode = _self.oExt;
        var p        = _self.positionHolder;
        p.className  = "position_holder";
        
        htmlNode.parentNode.insertBefore(p, htmlNode);
        //p.style.width = (htmlNode.offsetWidth - 2) + "px";
        p.style.height  = (htmlNode.offsetHeight - (jpf.isIE6 ? 0 : 13)) + "px";
        
        var diff     = jpf.getDiff(htmlNode);
        var lastSize = [htmlNode.style.width, htmlNode.style.height];
        htmlNode.style.width = (htmlNode.offsetWidth - diff[0]) + "px";
        //htmlNode.style.height = (htmlNode.offsetHeight - diff[1]) + "px";
        
        htmlNode.style.left = (e.clientX - nX) + "px";
        htmlNode.style.top  = (e.clientY - nY) + "px";
        htmlNode.style.position = "absolute";
        htmlNode.style.zIndex   = htmlNode.parentNode.style.zIndex = 100000;
        htmlNode.parentNode.style.position = "relative";
        htmlNode.parentNode.style.left     = "0"; //hack
        // @todo: should we rewrite this to use jpf.tween?
        jpf.Animate.fade(htmlNode, 0.8);
        
        jpf.dragmode.mode = true; //simulate using dragmode

        cData                = [htmlNode, p];
        document.onmousemove = _self.dragMove;
        document.onmouseup   = function(){
            document.onmousemove = document.onmouseup = null;
            
            htmlNode.style.position = "";//relative";
            htmlNode.style.left     = 0;
            htmlNode.style.top      = 0;
            htmlNode.style.width    = lastSize[0];
            //htmlNode.style.height = lastSize[1];
            htmlNode.style.zIndex   = htmlNode.parentNode.style.zIndex = 1;
            //htmlNode.parentNode.style.position = "static";
            
            p.parentNode.insertBefore(htmlNode, p);
            p.parentNode.removeChild(p);
            jpf.Animate.fade(htmlNode, 1);
            
            //@todo please move this to datagrid internals
            var grids = _self.getElementsByTagName("datagrid");
            for(var i = 0; i < grids.length; i++) {
                grids[i].updateWindowSize(true);
            }
            
            jpf.dragmode.mode = null;
        };
        
        e.cancelBubble = true;
        return false;
    };
    
    //Search for insert position
    function insertInColumn(el, ey){
        var pos   = jpf.getAbsolutePosition(el);
        var cy    = ey - pos[1];
        var nodes = el.childNodes;

        for (var th = 0, i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];
            if (node.nodeType != 1 
              || jpf.getStyle(node, "position") == "absolute")
                continue;

            th = node.offsetTop + node.offsetHeight;
            if (th > cy) {
                el.insertBefore(cData[1], 
                    th - (node.offsetHeight / 2) > cy
                        ? node
                        : node.nextSibling);
            }
        }

        if (i == nodes.length)
            el.appendChild(cData[1]);	
    }
    
    this.dragMove = function(e){
        if (!e) e = event;
        
        _self.oExt.style.top = "10000px";
        var ex  = e.clientX + document.documentElement.scrollLeft;
        var ey  = e.clientY + document.documentElement.scrollTop;
        var el  = document.elementFromPoint(ex, ey);
        
        if (el.isColumn){
            insertInColumn(el, ey);
        }
        else {
            //search for element
            while (el.parentNode && !el.isColumn) {
                el = el.parentNode;
            }
            
            if (el.isColumn)
                insertInColumn(el, ey);
        }
        
        _self.oExt.style.left = (e.clientX - nX) + "px";
        _self.oExt.style.top  = (e.clientY - nY) + "px";
        
        e.cancelBubble = true;
    };
    
    this.$loadJml = function(x) {
        jpf.WinServer.setTop(this);
        
        var diff = jpf.getDiff(this.oExt);
        hordiff  = diff[0];
        verdiff  = diff[1];
        
        var oInt      = this.$getLayoutNode("main", "container", this.oExt);
        var oSettings = this.$getLayoutNode("main", "settings_content", this.oExt);
            
        //Should be moved to an init function
        this.positionHolder = document.body.appendChild(document.createElement("div"));
        
        var oConfig = $xmlns(this.$jml, "config", jpf.ns.jpf)[0];
        if (oConfig)
            oConfig.parentNode.removeChild(oConfig);
        var oBody = $xmlns(this.$jml, "body", jpf.ns.jpf)[0];//jpf.xmldb.selectSingleNode("j:body", this.$jml);
        oBody.parentNode.removeChild(oBody);

        jpf.JmlParser.parseChildren(this.$jml, null, this);
        
        if (oConfig)
            this.$jml.appendChild(oConfig);
        this.$jml.appendChild(oBody);
    
        if (oSettings && oConfig) {
            this.oSettings = this.oSettings 
                ? jpf.JmlParser.replaceNode(oSettings, this.oSettings) 
                : jpf.JmlParser.parseChildren(oConfig, oSettings, this, true);
        }
        
        this.oInt = this.oInt 
            ? jpf.JmlParser.replaceNode(oInt, this.oInt) 
            : jpf.JmlParser.parseChildren(oBody, oInt, this, true);
        
        if (oBody.getAttribute("class"))
            this.$setStyleClass(this.oInt, oBody.getAttribute("class"))
        
        this.oDrag.onmousedown = this.dragStart;
        
        if (this.resizable)
            this.resizable = false;
        
        if (this.draggable === undefined)
            this.draggable = true;
        
        this.minwidth  = this.$getOption("Main", "min-width");
        this.minheight = this.$getOption("Main", "min-height");        
    };
};
//#endif
