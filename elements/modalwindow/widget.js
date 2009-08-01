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

// #ifdef (__JPORTAL || __ENABLE_WINDOW_WIDGET) && (__JMODALWINDOW || __INC_ALL)

/**
 * @private
 * @constructor
 */
apf.modalwindow.widget = function(){
    var nX, nY, verdiff, hordiff, cData;
    var _self   = this;
    
    this.isWindowContainer = false;
    this.kbclose          = false;
    this.$isWidget         = true;

    this.dragStart = function(e){
        if (!e) e = event;

        if (_self.state.indexOf("maximized") > -1 || !_self.draggable)
            return;

        nX = _self.oExt.offsetLeft - e.clientX - document.documentElement.scrollLeft;
        nY = _self.oExt.offsetTop - e.clientY - document.documentElement.scrollTop;

        var htmlNode = _self.oExt;
        var p        = _self.positionHolder;
        if (!p)
            var p = this.positionHolder = document.body.appendChild(document.createElement("div"));
        p.className  = "position_holder";

        htmlNode.parentNode.insertBefore(p, htmlNode);
        //p.style.width = (htmlNode.offsetWidth - 2) + "px";
        p.style.height  = (htmlNode.offsetHeight - (apf.isIE6 ? 0 : apf.getHeightDiff(p))) + "px";

        //var diff     = apf.getDiff(htmlNode);
        var lastSize = [htmlNode.style.width, htmlNode.style.height];
        htmlNode.style.width = (htmlNode.offsetWidth - apf.getWidthDiff(htmlNode)) + "px";
        //htmlNode.style.height = (htmlNode.offsetHeight - diff[1]) + "px";

        htmlNode.style.left = (e.clientX + nX) + "px";
        htmlNode.style.top  = (e.clientY + nY) + "px";
        htmlNode.style.position = "absolute";
        htmlNode.style.zIndex   = htmlNode.parentNode.style.zIndex = 100000;
        //htmlNode.parentNode.style.position = "relative";
        htmlNode.parentNode.style.left     = "0"; //hack
        htmlNode.parentNode.style.minHeight = (htmlNode.parentNode.offsetHeight - apf.getHeightDiff(htmlNode.parentNode)) + "px";
        //apf.tween.fade(htmlNode, 0.8);

        apf.dragmode.mode = true; //simulate using dragmode

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

            htmlNode.parentNode.style.minHeight = ""; //@todo apf3.0 animate here

            p.parentNode.insertBefore(htmlNode, p);
            p.parentNode.removeChild(p);
            apf.tween.fade(htmlNode, 1);
            
            _self.parentNode.$moveDocklet(_self);
            
            if (!apf.supportOpacity)
                htmlNode.style.filter = "";

            apf.layout.forceResize(_self.oInt); //@todo recursive

            apf.dragmode.mode = null;
        };
        
        if (apf.isIE) //@todo hack to solve IE bug... should investigate
            document.onmousemove();

        e.cancelBubble = true;
        return false;
    };

    //Search for insert position
    function insertInColumn(el, ey){
        var pos   = apf.getAbsolutePosition(el);
        var cy    = ey - pos[1];
        var nodes = el.childNodes;

        for (var th = 0, i = 0, l = nodes.length; i < l; i++) {
            var node = nodes[i];
            if (node.nodeType != 1
              || apf.getStyle(node, "position") == "absolute")
                continue;

            th = node.offsetTop + node.offsetHeight;
            if (th > cy) {
                el.insertBefore(cData[1],
                    th - (node.offsetHeight / 2) > cy
                        ? node
                        : node.nextSibling);
                break;
            }
        }

        if (i == nodes.length)
            el.appendChild(cData[1]);
    }

    this.dragMove = function(e){
        if (!e) e = event;

        _self.oExt.style.top = "10000px";
        var ex  = e.clientX;// + document.documentElement.scrollLeft;
        var ey  = e.clientY;// + document.documentElement.scrollTop;
        var el  = document.elementFromPoint(ex, ey);
        
        if (el) {
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
        }
        
        _self.oExt.style.left = (e.clientX + nX + document.documentElement.scrollLeft) + "px";
        _self.oExt.style.top  = (e.clientY + nY + document.documentElement.scrollTop) + "px";

        e.cancelBubble = true;
    };

    this.$loadAml = function(x) {
        //this.$aml = x;

        this.$init();

        var oInt      = this.$getLayoutNode("main", "container", this.oExt);
        var oSettings = this.$getLayoutNode("main", "settings_content", this.oExt);

        var oConfig = $xmlns(x, "config", apf.ns.aml)[0];
        if (oConfig)
            oConfig.parentNode.removeChild(oConfig);
        var oBody = $xmlns(x, "body", apf.ns.aml)[0];
        if (!oBody) return; //Skin change detection (apf3.0) found out why there is xml in the model attr of aml in the portal demo
        oBody.parentNode.removeChild(oBody);

        apf.AmlParser.parseChildren(x, null, this);

        if (oConfig)
            x.appendChild(oConfig);
        x.appendChild(oBody);

        if (oSettings && oConfig) {
            this.oSettings = this.oSettings
                ? apf.AmlParser.replaceNode(oSettings, this.oSettings)
                : apf.AmlParser.parseChildren(oConfig, oSettings, this, true);
        }

        this.oInt = this.oInt
            ? apf.AmlParser.replaceNode(oInt, this.oInt)
            : apf.AmlParser.parseChildren(oBody, oInt, this, true);

        if (oBody.getAttribute("class"))
            this.$setStyleClass(this.oInt, oBody.getAttribute("class"))
    };
    
    this.$init = function(){
        apf.WinServer.setTop(this);

        var diff = apf.getDiff(this.oExt);
        hordiff  = diff[0];
        verdiff  = diff[1];
        
        this.oDrag.onmousedown = this.dragStart;

        this.collapsedHeight = this.$getOption("Main", "collapsed-height");

        if (this.resizable)
            this.resizable = false;

        if (this.draggable === undefined)
            this.draggable = true;

        this.minwidth  = this.$getOption("Main", "min-width");
        this.minheight = this.$getOption("Main", "min-height");
    }
};
//#endif
