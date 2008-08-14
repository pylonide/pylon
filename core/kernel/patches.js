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

//#ifdef __WITH_APP

jpf.compat = {
    maxWidth : 0,
    maxHeight: 0,
    
    getNumber: function(pos){
        return (/^\d+/.exec(pos) ? parseInt(RegExp.$1) : 0)
    },
    
    getBox: function(value){
        if (value == null || (!parseInt(value) && parseInt(value) != 0)) 
            return [0, 0, 0, 0];
        
        var x = value.split(" ");
        for (var i = 0; i < x.length; i++) 
            x[i] = parseInt(x[i]) || 0;
        switch (x.length) {
            case 1:
                x[1] = x[0];
                x[2] = x[0];
                x[3] = x[0];
                break;
            case 2:
                x[2] = x[0];
                x[3] = x[1];
                break;
            case 3:
                x[3] = x[1];
                break;
        }
        
        return x;
    },
    
    getNode: function(data, tree){
        var nc = 0;//nodeCount
        //node = 1
        if (data != null) {
            for (var i = 0; i < data.childNodes.length; i++) {
                if (data.childNodes[i].nodeType == 1) {
                    if (nc == tree[0]) {
                        data = data.childNodes[i];
                        if (tree.length > 1) {
                            tree.shift();
                            data = this.getNode(data, tree);
                        }
                        return data;
                    }
                    nc++
                }
            }
        }
        
        return false;
    },
    
    getFirstElement: function(xmlNode){
        // #ifdef __DEBUG
        try {
            xmlNode.firstChild.nodeType == 1
                ? xmlNode.firstChild
                : xmlNode.firstChild.nextSibling
        }
        catch (e) {
            throw new Error(1052, jpf.formatErrorString(1052, null, "Skinning Engine", "Could not find first element for skin:\n" + (xmlNode ? xmlNode.xml : "null")));
        }
        // #endif
        
        return xmlNode.firstChild.nodeType == 1
            ? xmlNode.firstChild
            : xmlNode.firstChild.nextSibling;
    },
    
    getLastElement: function(xmlNode){
        // #ifdef __DEBUG
        try {
            xmlNode.lastChild.nodeType == 1
                ? xmlNode.lastChild
                : xmlNode.lastChild.nextSibling
        } 
        catch (e) {
            throw new Error(1053, jpf.formatErrorString(1053, null, "Skinning Engine", "Could not find last element for skin:\n" + (xmlNode ? xmlNode.xml : "null")));
        }
        // #endif
        
        return xmlNode.lastChild.nodeType == 1
            ? xmlNode.lastChild
            : xmlNode.lastChild.previousSibling;
    },
    
    /*
     HTMLElement.prototype.__defineGetter__("runtimeStyle", function() {
     return document.defaultView.getComputedStyle(this, null);
     });
     */
    getStyle: function(el, prop){
        if (typeof document.defaultView != "undefined"
          && typeof document.defaultView.getComputedStyle != "undefined") {
            var cStyle = document.defaultView.getComputedStyle(el, '');
            return !cStyle ? "" : cStyle.getPropertyValue(prop);
        }
        
        return el.currentStyle[prop];
    },
    
    isInRect: function(oHtml, x, y){
        var pos = this.getAbsolutePosition(oHtml);
        if (x < pos[0] || y < pos[1] || x > oHtml.offsetWidth + pos[0] - 10
          || y > oHtml.offsetHeight + pos[1] - 10) 
            return false;
        return true;
    },
    
    getWidthDiff: function(oHtml){
        return jpf.isIE
            ? Math.max(0, (parseInt(jpf.compat.getStyle(oHtml, "paddingLeft")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "paddingRight")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "borderLeftWidth")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "borderRightWidth")) || 0))
            : Math.max(0, oHtml.offsetWidth - parseInt(jpf.compat.getStyle(oHtml, "width")));
    },
    
    getHeightDiff: function(oHtml){
        return jpf.isIE
            ? Math.max(0, (parseInt(jpf.compat.getStyle(oHtml, "paddingTop")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "paddingBottom")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "borderTopWidth")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "borderBottomWidth")) || 0))
            : Math.max(0, oHtml.offsetHeight - parseInt(jpf.compat.getStyle(oHtml, "height")));
    },
    
    getDiff: function(oHtml){
        if (!jpf.isIE && oHtml.tagName == "INPUT") 
            return [6, 6];
        
        var pNode;
        if (!oHtml.offsetHeight) {
            pNode        = oHtml.parentNode;
            var nSibling = oHtml.nextSibling;
            document.body.appendChild(oHtml);
        }
        
        var diff = jpf.isIE
            ? [Math.max(0, (parseInt(jpf.compat.getStyle(oHtml, "paddingLeft")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "paddingRight")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "borderLeftWidth")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "borderRightWidth")) || 0)),
                Math.max(0, (parseInt(jpf.compat.getStyle(oHtml, "paddingTop")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "paddingBottom")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "borderTopWidth")) || 0)
                + (parseInt(jpf.compat.getStyle(oHtml, "borderBottomWidth")) || 0))]
            : [Math.max(0, oHtml.offsetWidth - parseInt(jpf.compat.getStyle(oHtml, "width"))),
                Math.max(0, oHtml.offsetHeight - parseInt(jpf.compat.getStyle(oHtml, "height")))];
        
        if (pNode) 
            pNode.insertBefore(oHtml, nSibling);
        
        return diff;
    },
    
    getOverflowParent: function(o){
        //not sure if this is the correct way. should be tested
        
        var o = o.offsetParent;
        while (o && (this.getStyle(o, "overflow") != "hidden"
          || "absolute|relative".indexOf(this.getStyle(o, "position")) == -1)) {
            o = o.offsetParent;
        }
        return o || document.documentElement;
    },
    
    getPositionedParent: function(o){
        var o = o.offsetParent;
        while (o && o.tagName.toLowerCase() != "body"
          && "absolute|relative".indexOf(this.getStyle(o, "position")) == -1) {
            o = o.offsetParent;
        }
        return o || document.documentElement;
    },
    
    getAbsolutePosition: function(o, refParent, inclSelf){
        var s, wt = inclSelf ? 0 : o.offsetLeft, ht = inclSelf ? 0 : o.offsetTop;
        var o = inclSelf ? o : o.offsetParent;
        while (o && o.tagName.toLowerCase() != "body" && o != refParent) {
            wt += (jpf.isOpera ? 0 : parseInt(this.getStyle(o, jpf.descPropJs
                ? "borderLeftWidth" : "border-left-width")) || 0) + o.offsetLeft;
            ht += (jpf.isOpera ? 0 : parseInt(this.getStyle(o, jpf.descPropJs
                ? "borderTopWidth" : "border-top-width")) || 0) + o.offsetTop;
            
            if (o.tagName.toLowerCase() == "table") {
                ht -= parseInt(o.border || 0) + parseInt(o.cellSpacing || 0);
                wt -= parseInt(o.border || 0) + parseInt(o.cellSpacing || 0) * 2;
            } else 
                if (o.tagName.toLowerCase() == "tr") {
                    ht -= (cp = parseInt(o.parentNode.parentNode.cellSpacing));
                    while (o.previousSibling) 
                        ht -= (o = o.previousSibling).offsetHeight + cp;
                }
            
            o = o.offsetParent;
        }
        
        return [wt, ht];
    },
    
    selectTextHtml : function(oHtml){
        if (!jpf.hasMsRangeObject) return;// oHtml.focus();
        
        var r = document.selection.createRange();
        try {r.moveToElementText(oHtml);} catch(e){}
        r.select();
    }
    
    //#ifdef __WITH_GRID
    ,gridPlace: function(jmlNode){
        var jNodes = jmlNode.childNodes;
        for (var nodes = [], i = 0; i < jNodes.length; i++) {
            if (jNodes[i].jml.getAttribute("left") || jNodes[i].jml.getAttribute("top")
              || jNodes[i].jml.getAttribute("right") || jNodes[i].jml.getAttribute("bottom")) 
                continue;
            nodes.push(jNodes[i].oExt);
        }
        
        if (nodes.length == 0) 
            return;
        
        var parentnode = jmlNode.jml;
        var rowheight  = parseInt(parentnode.getAttribute("cellheight")) || 22;
        var between    = parseInt(parentnode.getAttribute("cellpadding")) || 2;
        var columns    = parentnode.getAttribute("grid").split(/\s*,\s*/);
        
        var margin     = parentnode.getAttribute("margin")
            ? parentnode.getAttribute("margin").split(",")
            : [0, 0, 0, 0];

        for (var i = 0; i < margin.length; i++) 
            if (typeof margin[i] == "string") 
                margin[i] = parseInt(margin[i]);
        
        // Calculate column widths
        var parentWidth = nodes[0].parentNode.offsetWidth;
        if (!parentWidth) 
            return; // Do nothing of the sort.

        var colWidths       = new Array();
        var nColumns        = columns.length;
        var totalWidth      = 0;
        var assignedColumns = 0;
        var clientWidth     = parentWidth - ((nColumns - 1) * between + margin[3] + margin[1]);
        for (var x = 0; x < nColumns; x++) {
            if (typeof columns[x] == "number") 
                colWidths[x] = columns[x];
            else
                if (typeof columns[x] == "string") {
                    if (columns[x].indexOf("%") > -1) {
                        colWidths[x] = Math.floor((parseInt(columns[x]) * clientWidth) / 100);
                    } else 
                        colWidths[x] = parseInt(columns[x]); // And if this is undefined, we'll catch it later.
                }
            
            if (colWidths[x]) {
                assignedColumns++;
                totalWidth += colWidths[x];
            }
        }
        
        // Distribute whatever is left of the parent over the undefined columns.
        if (assignedColumns < nColumns) {
            var leftOver = Math.floor((parentWidth - totalWidth - ((nColumns - 1)
                * between + margin[1] + margin[3])) / (nColumns - assignedColumns));
            for (var x = 0; x < nColumns; x++) 
                if (!colWidths[x] && colWidths[x] !== 0) 
                    colWidths[x] = leftOver;
        }
        
        var nTop  = margin[0];
        var iNode = 0; // Node eye-terator.
        for (var y = 0; y < nodes.length; y += nColumns) {
            if (y) 
                nTop += between;
            var maxHeight = rowheight;
            var oldHeight = maxHeight;
            var nLeft     = margin[3];
            for (var x = 0; x < nColumns; x++) {
                if (!nodes[iNode]) 
                    break; // Done, break.
                nodes[iNode].style.position = "absolute";
                nodes[iNode].style.top      = nTop + "px";
                nodes[iNode].style.left     = nLeft + "px";
                
                //var diff = jpf.compat.getDiff(nodes[iNode]);
                
                if (jNodes[iNode].jml.getAttribute("width") == null) // Only if not directly specified.
                    nodes[iNode].style.width = Math.max(colWidths[x]
                        - (jpf.compat.getWidthDiff(nodes[iNode]) || 0), 0) + "px";
                
                //nColumns != 1 || 
                maxHeight = Math.max(
                    (jNodes[iNode].jml.getAttribute("autosize") != "true" && !jNodes[iNode].nonSizingHeight) ? maxHeight : 0,
                    nodes[iNode].offsetHeight,
                    (jpf.compat.getStyle(nodes[iNode], "overflow") == "visible") ? nodes[iNode].scrollHeight : 0
                );
                //maxHeight = Math.max(columns.length != 1 || jNodes[iNode].jml.getAttribute("autosize") != "true" ? maxHeight : 0, nodes[iNode].offsetHeight, jpf.compat.getStyle(nodes[iNode], "overflow") == "visible" ? nodes[iNode].scrollHeight : 0);
                
                nLeft += Math.max(colWidths[x], 0) + between; // Equal to nodes[iNode].offsetWidth + between.
                iNode++;
            }
            
            //if(maxHeight > oldHeight){
            for (var x = 0; x < nColumns; x++) {
                var j = jNodes[iNode - x - 1];
                var h = nodes[iNode - x - 1];
                if (!j.nonSizingHeight && j.jml.getAttribute("autosize") != "true"
                  && j.jml.getAttribute("height") == null) { // Only if not directly specified.
                    h.style.height = Math.max(0,
                        (maxHeight - (jpf.compat.getHeightDiff(h) || 0))) + "px";
                }
            }
            //}
            
            nTop += maxHeight;
        }
        
        // Resize the parent, if necessary - This should be optional...
        if (jmlNode.jml.getAttribute("height") == null
          && jmlNode.jml.getAttribute("autosize") != "false") 
            jmlNode.oExt.style.height = Math.max(nTop + margin[2], 0) + "px";
    }
    //#endif
}

// #endif
