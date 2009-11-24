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

apf.__DOCKING__ = 1 << 18;

// #ifdef __WITH_DOCKING

/**
 * All elements inheriting from this {@link term.baseclass baseclass} have docking features.
 *
 * @constructor
 * @baseclass
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       0.5
 *
 * @see baseclass.alignment
 */
apf.Docking = function(){
    this.$regbase = this.$regbase | apf.__DOCKING__;
    
    /**
     * @private
     */
    this.startDocking = function(e){
        //#ifdef __DEBUG
        if (!this.aData) 
            return apf.console.warn("Docking start without alignment set on this element");
        //#endif

        apf.DockServer.start(this.aData, this, e);
    };
};

/**
 * @private
 */
apf.DockServer = {
    edge: 30,
    inited: false,
    
    init: function(){
        if (this.inited) 
            return;
        this.inited = true;
        
        if (!this.nextPositionMarker) {
            this.nextPositionMarker = document.body.appendChild(document.createElement("div"));
            this.nextPositionMarker.style.border   = "4px solid #555";
            this.nextPositionMarker.style.position = "absolute";
            this.nextPositionMarker.style.zIndex   = 10000;
            this.nextPositionMarker.style.filter   = "progid:DXImageTransform.Microsoft.Alpha(opacity=50);"
            this.nextPositionMarker.style.opacity  = 0.5;
            apf.setUniqueHtmlId(this.nextPositionMarker);
        }
    },
    
    start: function(oItem, amlNode, e){
        if (!this.inited) 
            apf.DockServer.init();
        
        this.dragdata = {
            item: oItem,
            amlNode: amlNode,
            x: e.offsetX || e.layerX,
            y: e.offsetY || e.layerY
        }
        
        apf.dragMode         = true;
        document.onmousemove = this.onmousemove;
        document.onmouseup   = this.onmouseup;

        // #ifdef __WITH_PLANE
        apf.plane.show(this.nextPositionMarker);
        // #endif

        var pos  = apf.getAbsolutePosition(oItem.oHtml),
            diff = apf.getDiff(this.nextPositionMarker);

        this.nextPositionMarker.style.left    = pos[0] + "px";
        this.nextPositionMarker.style.top     = pos[1] + "px";
        this.nextPositionMarker.style.width   = (oItem.oHtml.offsetWidth  - diff[0]) + "px"
        this.nextPositionMarker.style.height  = (oItem.oHtml.offsetHeight - diff[1]) + "px";
        this.nextPositionMarker.style.display = "block";
        //#ifdef __WITH_LAYOUT
        apf.layout.pause(oItem.oHtml.parentNode);
        //#endif
    },
    
    floatElement: function(e){
        this.dragdata.item.setPosition(e.clientX - this.dragdata.x,
            e.clientY - this.dragdata.y)
        
        if (this.dragdata.item.hidden != 3) {
            this.dragdata.item.setFloat();
            this.dragdata.amlNode.$purgeAlignment();
        }
        //#ifdef __WITH_LAYOUT
        else 
            apf.layout.play(this.dragdata.item.oHtml.parentNode);
        //#endif
    },
    
    setPosition: function(e){
        var diff = apf.getDiff(this.nextPositionMarker);
        
        this.nextPositionMarker.style.left   = (e.clientX - this.dragdata.x) + "px";
        this.nextPositionMarker.style.top    = (e.clientY - this.dragdata.y) + "px";
        this.nextPositionMarker.style.width  = (this.dragdata.item.size[0] - diff[0]) + "px";
        this.nextPositionMarker.style.height = ((this.dragdata.item.state < 0
            ? this.dragdata.item.size[1]
            : this.dragdata.item.fheight) - diff[1]) + "px";
        
        document.body.style.cursor = "default";
        //apf.setStyleClass(document.body, "", ["same", "south", "east", "north", "west"]);
    },
    
    onmousemove: function(e){
        if (!e) 
            e = event;
        if (apf.isIE && e.button < 1) 
            return false;
        
        // #ifdef __WITH_PLANE
        apf.plane.hide();
        // #endif

        apf.DockServer.nextPositionMarker.style.top = "10000px";
        //apf.DockServer.dragdata.amlNode.$ext.style.top = "10000px";
        
        var el = document.elementFromPoint(e.clientX
            + document.documentElement.scrollLeft,
            e.clientY + document.documentElement.scrollTop);

        // #ifdef __WITH_PLANE
        apf.plane.show(apf.DockServer.nextPositionMarker);
        // #endif

        var o = el;
        while (o && !o.host && o.parentNode) 
            o = o.parentNode;
        var amlNode  = o && o.host ? o.host : false,
            htmlNode = amlNode.$ext;
        if (!amlNode.aData || !amlNode.dock) {
            document.body.style.cursor = "";
            apf.setStyleClass(document.body, "same",
                ["south", "east", "north", "west"]);
            return apf.DockServer.setPosition(e);
        }
        
        if (apf.DockServer.dragdata.item == amlNode.aData && amlNode.aData.hidden == 3) 
            return apf.DockServer.setPosition(e);
        
        var calcData = amlNode.aData.calcData, // @todo apf3.0 UNUSED VAR
            pos = apf.getAbsolutePosition(htmlNode),
            l   = e.clientX - pos[0],
            t   = e.clientY - pos[1],
        
            diff    = apf.getDiff(apf.DockServer.nextPositionMarker),
            verdiff = diff[1],
            hordiff = diff[0],
        
            vEdge = Math.min(apf.DockServer.edge, htmlNode.offsetHeight / 2),
            hEdge = Math.min(apf.DockServer.edge, htmlNode.offsetWidth  / 2),
        
            r = htmlNode.offsetWidth - l,
            b = htmlNode.offsetHeight - t,
            region,
        
            p = b / vEdge,
            q = l / hEdge,
            z = t / vEdge,
            w = r / hEdge;
        
        if (p < Math.min(q, w, z)) {
            if (b <= vEdge) 
                region = "south";
        }
        else if (w < Math.min(p, z, q)) {
            if (r <= hEdge) 
                region = "east";
        }
        else if (q < Math.min(p, z, w)) {
            if (l <= hEdge) 
                region = "west";
        }
        else if (z < Math.min(q, w, p)) {
            if (t <= vEdge) 
                region = "north";
        }
        
        if (apf.DockServer.dragdata.item == amlNode.aData) 
            region = "same";
        
        if (!region) 
            return apf.DockServer.setPosition(e);
        
        var nextPositionMarker = apf.DockServer.nextPositionMarker;
        if (region == "west") {
            nextPositionMarker.style.left   = pos[0] + "px";
            nextPositionMarker.style.top    = pos[1] + "px";
            nextPositionMarker.style.width  = ((htmlNode.offsetWidth / 2) - hordiff) + "px"
            nextPositionMarker.style.height = (htmlNode.offsetHeight - verdiff) + "px";
        }
        else if (region == "north") {
            nextPositionMarker.style.left   = pos[0] + "px";
            nextPositionMarker.style.top    = pos[1] + "px";
            nextPositionMarker.style.width  = (htmlNode.offsetWidth - hordiff) + "px"
            nextPositionMarker.style.height = (Math.ceil(htmlNode.offsetHeight / 2) - verdiff) + "px";
        }
        else if (region == "east") {
            nextPositionMarker.style.left   = (pos[0] + Math.ceil(htmlNode.offsetWidth / 2)) + "px";
            nextPositionMarker.style.top    = pos[1] + "px";
            nextPositionMarker.style.width  = ((htmlNode.offsetWidth / 2) - hordiff) + "px"
            nextPositionMarker.style.height = (htmlNode.offsetHeight - verdiff) + "px";
        }
        else if (region == "south") {
            nextPositionMarker.style.left   = pos[0] + "px";
            nextPositionMarker.style.top    = (pos[1] + Math.ceil(htmlNode.offsetHeight / 2)) + "px";
            nextPositionMarker.style.width  = (htmlNode.offsetWidth - hordiff) + "px"
            nextPositionMarker.style.height = (Math.ceil(htmlNode.offsetHeight / 2) - verdiff) + "px";
        }
        else if (region == "same") {
            nextPositionMarker.style.left   = pos[0] + "px";
            nextPositionMarker.style.top    = pos[1] + "px";
            nextPositionMarker.style.width  = (htmlNode.offsetWidth - hordiff) + "px"
            nextPositionMarker.style.height = (htmlNode.offsetHeight - verdiff) + "px";
        }
        
        document.body.style.cursor = "";
        apf.setStyleClass(document.body, region,
            ["same", "south", "east", "north", "west"]);
    },
    
    onmouseup: function(e){
        if (!e) 
            e = event;
        if (apf.isIE && e.button < 1) 
            return false;
        
        // #ifdef __WITH_PLANE
        apf.plane.hide();
        // #endif

        apf.dragMode         = false;
        document.onmousemove = 
        document.onmouseup   = null;
        
        apf.DockServer.nextPositionMarker.style.display = "none";
        //apf.DockServer.dragdata.amlNode.$ext.style.top = "10000px";
        document.body.className = "";
        
        var el = document.elementFromPoint(e.clientX
               + document.documentElement.scrollLeft,
                 e.clientY + document.documentElement.scrollTop),
            o = el;
        while (o && !o.host && o.parentNode) 
            o = o.parentNode;
        var amlNode  = o && o.host ? o.host : false,
            htmlNode = amlNode.$ext,
            aData    = amlNode.aData;
        
        if (!amlNode.aData || !amlNode.dock
          || apf.DockServer.dragdata.item == amlNode.aData
          && amlNode.aData.hidden == 3) {
            //apf.layout.play(htmlNode.parentNode);
            return apf.DockServer.floatElement(e);
        }
        //#ifdef __WITH_LAYOUT
        if (apf.DockServer.dragdata.item == amlNode.aData) 
            return apf.layout.play(htmlNode.parentNode);
        //#endif
        var pos = apf.getAbsolutePosition(htmlNode),
            l   = e.clientX - pos[0],
            t   = e.clientY - pos[1],
        
            region,
            vEdge = Math.min(apf.DockServer.edge, htmlNode.offsetHeight / 2),
            hEdge = Math.min(apf.DockServer.edge, htmlNode.offsetWidth  / 2),
        
            r = htmlNode.offsetWidth - l,
            b = htmlNode.offsetHeight - t,
        
            p = b / vEdge,
            q = l / hEdge,
            z = t / vEdge,
            w = r / hEdge;
        
        if (p < Math.min(q, w, z)) {
            if (b <= vEdge) 
                region = "b";
        }
        else if (w < Math.min(p, z, q)) {
            if (r <= hEdge) 
                region = "r";
        }
        else if (q < Math.min(p, z, w)) {
            if (l <= hEdge) 
                region = "l";
        }
        else if (z < Math.min(q, w, p)) {
            if (t <= vEdge) 
                region = "t";
        }
        
        if (!region) 
            return apf.DockServer.floatElement(e);
        
        var pHtmlNode = htmlNode.parentNode;
        //#ifdef __WITH_LAYOUT
        l             = apf.layout.layouts[pHtmlNode.getAttribute("id")];
        //#endif
        if (!l) 
            return false;
        
        var root = l.root;//.copy();
        var current = aData;
        
        if (apf.DockServer.dragdata.item.hidden == 3) 
            apf.DockServer.dragdata.item.unfloat();
        
        var newItem = apf.DockServer.dragdata.item,
            pItem = newItem.parent;
        if (pItem.children.length == 2) {
            var fixItem     = pItem.children[(newItem.stackId == 0) ? 1 : 0];
            fixItem.parent  = pItem.parent;
            fixItem.stackId = pItem.stackId;
            fixItem.parent.children[fixItem.stackId] = fixItem;
            fixItem.weight  = pItem.weight;
            fixItem.fwidth  = pItem.fwidth;
            fixItem.fheight = pItem.fheight;
        }
        else {
            var nodes = pItem.children;
            for (var j = newItem.stackId; j < nodes.length; j++) {
                nodes[j] = nodes[j + 1];
                if (nodes[j]) 
                    nodes[j].stackId = j;
            }
            nodes.length--;
        }
        
        var type   = (region == "l" || region == "r") ? "hbox" : "vbox",
            parent = current.parent
            //#ifdef __WITH_LAYOUT
            ,newBox = apf.layout.getData(type, l.layout);
            //#endif

        newBox.splitter   = current.splitter;
        newBox.edgeMargin = current.edgeMargin;
        //#ifdef __WITH_LAYOUT
        newBox.id         = apf.layout.metadata.push(newBox) - 1;
        //#endif
        newBox.parent     = parent;
        parent.children[current.stackId] = newBox;
        newBox.stackId    = current.stackId;
        newBox.children   = (region == "b" || region == "r")
            ? [current, newItem]
            : [newItem, current];
        current.parent    = newItem.parent = newBox
        current.stackId   = (region == "b" || region == "r") ? 0 : 1;
        newItem.stackId   = (region == "b" || region == "r") ? 1 : 0;
        
        //if(type == "vbox") 
        newBox.fwidth = current.fwidth;
        //else if(type == "hbox") 
        newBox.fheight = current.fheight;
        
        newItem.weight = current.weight  = 1;//current.weight / 2;
        current.fwidth = current.fheight = null;
        
        var root = root.copy();
        l.layout.compile(root);
        l.layout.reset();
        //#ifdef __WITH_LAYOUT
        apf.layout.activateRules(l.layout.parentNode);
        //#endif
    }
};

// #endif
