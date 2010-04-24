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

//#ifdef __WITH_CONTENTEDITABLE

/*
    Adds complex resize/drag behaviour for contentEditable2
*/
(function(){
    function isCoord(n){
        return n || n === 0;
    }
    
    function coord(n, other){
        return n || n === 0 ? n : other;
    }
    
    var dragIndicator1, dragIndicator2, dragIndicator3, dragIndicator4, 
        dragIndicator5, inited = false, indicators = [], outline, dragOutline;
    function init(){
        var div, classes = [null,
            "dragindicate", "dragindicate indicate_common indicate_horizontal",
            "dragindicate indicate_common", "dragindicate indicate_common indicate_horizontal",
            "dragindicate dragreparent", "dragindicate dragelsort", "dragindicate dragelsort"
        ];
        for (var i = 1; i < 8; i++) {
            div = document.body.appendChild(document.createElement("div"));
            div.style.position = "absolute";
            div.className = classes[i];
            div.style.zIndex = 1000000;
            div.style.display = "none";
            div.host = false;
            eval("dragIndicator" + i + " = indicators[" + (i-1) + "] = div;"); //ahum...
        }
        
        outline = dragOutline = document.getElementById("apf_outline");
        
        inited = true;
    }
    
    var lastReparent, movePosition;
    function doReparentDrag(el, amlNode, e){
        if (lastReparent == amlNode)
            return;
        
        var htmlNode = outline;
        var pHtmlNode = amlNode.$int;
        var isBody = pHtmlNode.tagName == "BODY";

        var pos1 = isBody ? [0,0] : apf.getAbsolutePosition(pHtmlNode);
        pos1[2] = isBody ? apf.getWindowWidth() : pHtmlNode.offsetWidth;
        pos1[3] = isBody ? apf.getWindowHeight() : pHtmlNode.offsetHeight;
        var lastPHtmlNode = lastReparent ? lastReparent.$int : el.$ext.parentNode;
        var pos2 = lastPHtmlNode.tagName == "BODY"
            ? [0,0] : apf.getAbsolutePosition(lastPHtmlNode, null, true);

        amlNode.$int.appendChild(htmlNode);
    
        hideIndicators();
    
        dragIndicator5.style.left = pos1[0] + "px";
        dragIndicator5.style.top = pos1[1] + "px";
        var diff = apf.getDiff(dragIndicator5);
        dragIndicator5.style.width = (pos1[2] - diff[0]) + "px";
        dragIndicator5.style.height = (pos1[3] - diff[1]) + "px";
        dragIndicator5.style.display = "block";

        apf.tween.single(dragIndicator5, {
            type  : "fade",
            from  : 0,
            to    : 1,
            anim  : apf.tween.easeInSine,
            steps : 5
        });
        
        htmlNode.style.left = (apf.getHtmlLeft(htmlNode) - (pos1[0] - pos2[0])) + "px";
        htmlNode.style.top = (apf.getHtmlTop(htmlNode) - (pos1[1] - pos2[1])) + "px";
    
        lastReparent = amlNode;
        el.$ext.onmousedown(e, true);
    }

    //@todo these functions should be improved to work on a map of the objects, so that it doesnt depend on hovering
    var lastAmlNode;
    var showDrag = {
        vbox : function(l, t, htmlNode, e){
            if (e) {
                var prevTop = htmlNode.style.top;
                var el = this;
                apf.plane.plane.style.top = 
                htmlNode.style.top = "-2000px";
                var amlNode = apf.findHost(document.elementFromPoint(e.clientX, e.clientY));
                apf.plane.plane.style.top = 0;
                htmlNode.style.top = prevTop;
                
                if (amlNode && amlNode != el && (amlNode.parentNode == (lastReparent || el.parentNode))) {
                    var ext1 = amlNode.$altExt || amlNode.$ext;
                    var ext2 = el.$altExt || el.$ext;
                    var h = ext1.offsetHeight;
                    var pos = apf.getAbsolutePosition(ext1);
                    if (pos[1] + (h/2) > e.clientY) {
                        if (ext1.previousSibling != ext2) {
                            //ext1.parentNode.insertBefore(ext2, ext1);
                            //_self.regrab();
                            dragIndicator1.style.display = "block";
                            dragIndicator1.style.top = (pos[1] - dragIndicator1.offsetHeight) + "px";
                            dragIndicator1.style.left = (pos[0]) + "px";
                            dragIndicator1.style.width = (ext1.offsetWidth - apf.getWidthDiff(dragIndicator1)) + "px";
                            dragIndicator1.style.height = amlNode.parentNode.padding + "px";
                            movePosition = {where: "before", amlNode: amlNode}
                        }
                        else {
                            dragIndicator1.style.display = "none";
                            movePosition = null;
                        }
                    }
                    else {
                        if (ext1.nextSibling != ext2) {
                            //ext1.parentNode.insertBefore(ext2, ext1.nextSibling);
                            //_self.regrab();
                            dragIndicator1.style.display = "block";
                            dragIndicator1.style.top = (pos[1] + h) + "px";
                            dragIndicator1.style.left = (pos[0]) + "px";
                            dragIndicator1.style.width = (ext1.offsetWidth - apf.getWidthDiff(dragIndicator1)) + "px";
                            dragIndicator1.style.height = amlNode.parentNode.padding + "px";
                            movePosition = {where: "after", amlNode: amlNode}
                        }
                        else {
                            dragIndicator1.style.display = "none";
                            movePosition = null;
                        }
                    }
                }
                else
                    dragIndicator1.style.display = "none";
            }
        },
        
        hbox : function(l, t, htmlNode, e){
            if (e) {
                var prevTop = htmlNode.style.top;
                var el = this;
                apf.plane.plane.style.top = 
                htmlNode.style.top = "-2000px";
                var amlNode = apf.findHost(document.elementFromPoint(e.clientX, e.clientY));
                apf.plane.plane.style.top = 0;
                htmlNode.style.top = prevTop;
    
                showDrag.reparent.call(this, amlNode, el, e);
    
                if (amlNode && amlNode != el && (amlNode.parentNode == (lastReparent || el.parentNode))) {
                    var ext1 = amlNode.$altExt || amlNode.$ext;
                    var ext2 = el.$altExt || el.$ext;
                    var h = ext1.offsetWidth;
                    var pos = apf.getAbsolutePosition(ext1);
                    if (pos[0] + (h/2) > e.clientX) {
                        if (ext1.previousSibling != ext2) {
                            dragIndicator1.style.display = "block";
                            dragIndicator1.style.top = (pos[1]) + "px";
                            dragIndicator1.style.left = (pos[0] - dragIndicator1.offsetWidth) + "px";
                            dragIndicator1.style.width = amlNode.parentNode.padding + "px";
                            dragIndicator1.style.height = (ext1.offsetHeight - apf.getHeightDiff(dragIndicator1)) + "px";
                            movePosition = {where: "before", amlNode: amlNode}
                        }
                        else {
                            dragIndicator1.style.display = "none";
                            movePosition = null;
                        }
                    }
                    else {
                        if (ext1.nextSibling != ext2) {
                            dragIndicator1.style.display = "block";
                            dragIndicator1.style.top = (pos[1]) + "px";
                            dragIndicator1.style.left = (pos[0] + h) + "px";
                            dragIndicator1.style.width = amlNode.parentNode.padding + "px";
                            dragIndicator1.style.height = (ext1.offsetHeight - apf.getHeightDiff(dragIndicator1)) + "px";
                            movePosition = {where: "after", amlNode: amlNode}
                        }
                        else {
                            dragIndicator1.style.display = "none";
                            movePosition = null;
                        }
                    }
                }
                else {
                    dragIndicator1.style.display = "none";
                    movePosition = null;
                }
            }
        },
        
        table : function(l, t, htmlNode, e){
            if (e) {
                var prevTop = htmlNode.style.top;
                var el = this;
                dragIndicator1.style.top = 
                apf.plane.plane.style.top = 
                htmlNode.style.top = "-2000px";
                var amlNode = apf.findHost(document.elementFromPoint(e.clientX, e.clientY));
                apf.plane.plane.style.top = 0;
                htmlNode.style.top = prevTop;
                
                showDrag.reparent.call(this, amlNode, el, e);
                
                if (amlNode && amlNode != el && (amlNode.parentNode == (lastReparent || el.parentNode))) {
                    var ext1 = amlNode.$altExt || amlNode.$ext;
                    var ext2 = el.$altExt || el.$ext;
                    var pos = apf.getAbsolutePosition(ext1);
                    if (ext1.previousSibling != ext2) {
                        dragIndicator1.style.display = "block";
                        dragIndicator1.style.top = pos[1] + "px";
                        dragIndicator1.style.left = pos[0] + "px";
                        dragIndicator1.style.width = (amlNode.$ext.offsetWidth - apf.getWidthDiff(dragIndicator1)) + "px";
                        dragIndicator1.style.height = (amlNode.$ext.offsetHeight - apf.getHeightDiff(dragIndicator1)) + "px";
                        movePosition = {where: "before", amlNode: amlNode}
                    }
                    else {
                        dragIndicator1.style.display = "none";
                        movePosition = null;
                    }
                }
                else
                    dragIndicator1.style.display = "none";
            }
        },
        
        reparent : function(amlNode, el, e){
            var htmlNode = outline || el.$ext;

            while (amlNode && !amlNode.$int)
                amlNode = amlNode.parentNode;

            if (!amlNode.editable)
                return;
            
            if (lastAmlNode && lastAmlNode[0] == amlNode 
              && Math.abs(e.clientX - lastAmlNode[2]) < 2
              && Math.abs(e.clientY - lastAmlNode[3]) < 2) {
                //do Nothing
    
            }
            else {
                if (lastAmlNode)
                    clearTimeout(lastAmlNode[4]);
                if (el && amlNode != el && amlNode.$int 
                  && htmlNode.parentNode != amlNode.$int 
                  && !apf.isChildOf(el.$ext, amlNode.$int, true)) {
                    if (el.$adding) {
                        lastAmlNode = [];
                        doReparentDrag(el, amlNode, ev);
                    }

                    var ev = {clientX: e.clientX, clientY: e.clientY}
                    lastAmlNode = [amlNode, new Date().getTime(), e.clientX, e.clientY,
                        setTimeout(function(){
                            doReparentDrag(el, amlNode, ev);
                        }, 300)];
                }
                else
                    lastAmlNode = [];
            }
        },
        
        common : function(l, t, htmlNode, e, change, snapDiff){
            var oOutline = this.$ext;
            var prevTop = htmlNode.style.top;
            
            var el = this;
            dragIndicator1.style.top = 
            apf.plane.plane.style.top = 
            htmlNode.style.top = "-2000px";
            var amlNode = apf.findHost(document.elementFromPoint(e.clientX, e.clientY));
            apf.plane.plane.style.top = 0;
            htmlNode.style.top = prevTop;
    
            showDrag.reparent.call(this, amlNode, el, e);
            
            var d = dragInfo;
            showDrag.common_resize.call(this, l, t, d.width, 
                d.height, e, change, true, true, true, true, true);
            
            apf.config.setProperty("x", change.l || (change.l === 0 ? 0 : apf.getHtmlLeft(oOutline)));
            apf.config.setProperty("y", change.t || (change.t === 0 ? 0 : apf.getHtmlTop(oOutline)));
            apf.config.setProperty("w", d.width);
            apf.config.setProperty("h", d.height);
        },
        
        common_resize : function(l, t, w, h, e, change, we, no, ea, so, isDrag, sd){
            var snapDiff = sd || 8;
            var lpos = false, tpos = false, loffset = 0, toffset = 0;
            var wpos = false, hpos = false;
            var force, d = dragInfo;
    
            if (e.ctrlKey) {
                hideIndicators();
                return;
            }
            
            if (isDrag && e.shiftKey) {
                var dt = d.top - t;
                var dl = d.left - l;
                var corner = (Math.atan(Math.abs(dt) / Math.abs(dl)) * 2) / Math.PI; //normalize corner
                if (corner < 1/3) { //horizontal
                    change.st = t = d.top;
                }
                else if (corner < 2/3) { //diagonal
                    if (l > d.left && t < d.top || l < d.left && t > d.top) {
                        var min = Math.min(Math.abs(dl), Math.abs(dt));
                        change.l = d.left + (dl < 0 ? 1 : -1) * min;
                        change.t = d.top + (dt < 0 ? 1 : -1) * min;
                    }
                    else {
                        var min = Math.min(Math.abs(dl), Math.abs(dt));
                        change.l = d.left + (dl < 0 ? 1 : -1) * min;
                        change.t = d.top + (dt < 0 ? 1 : -1) * min;
                    }
                    dragIndicator1.style.display = "none";
                    dragIndicator2.style.display = "none";
                    return;
                }
                else { //vertical
                    change.sl = l = d.left;
                }
                force = true;
            }
            
            //Container
            if (apf.config.snapcontainer) {
                var c = d.container;

                //Left
                if (Math.abs(l) < snapDiff) {
                    change.l = 0;
                    change.lsticky = 5;
                }
                if (Math.abs(c[2] - l - w) < snapDiff) {
                    if (change.l == undefined)
                        change.l = c[2] - w;
                    change.rsticky = 5;
                }
                
                //Top
                if (Math.abs(t) < snapDiff) {
                    change.t = 0;
                    change.tsticky = 5;
                }
                if (Math.abs(c[3] - t - h) < snapDiff) {
                    if (change.t == undefined)
                        change.t = c[3] - h;
                    change.bsticky = 5;
                }
                
                if (!isDrag) {
                    //Width
                    if (Math.abs(c[2] - w - l) < (ea ? snapDiff : 1)) {
                        change.w = c[2] - l;
                        change.rsticky = 5;
                    }
                    
                    //Height
                    if (Math.abs(c[3] - h - t) < (so ? snapDiff : 1)) {
                        change.h = c[3] - t;
                        change.bsticky = 5;
                    }
                }
            }
            
            //Elements - X
            if (d.xl.length && (typeof change.l == "undefined" || force)) {
                //Left
                for (var i = 0, il = d.xl.length; i < il; i++) {
                    if (Math.abs(d.xl[i] - l) < (we ? snapDiff : 1)) {
                        change.l = lpos = d.xl[i];
                        change.loffset = loffset = -2;
                        change.lsticky = i == 0;
                        break;
                    }
                }
                
                //Right
                if (lpos === false) {
                    for (var i = 0, il = d.xr.length; i < il; i++) {
                        if (Math.abs(d.xr[i] - l - w) < (ea ? snapDiff : 1)) {
                            change.l = (lpos = d.xr[i]) - w;
                            change.loffset = loffset = 0;
                            change.rsticky = i == 0;
                            break;
                        }
                    }
                }
                
                //Middle
                if (lpos === false) {
                    for (var i = 0, il = d.xm.length; i < il; i++) {
                        if (Math.abs(d.xm[i] - l - d.cwidth) < snapDiff) {
                            change.l = (lpos = d.xm[i]) - d.cwidth;
                            break;
                        }
                    }
                }
            }
    
            if (d.xr.length && (typeof change.w == "undefined") && change.rsticky != 5) {
                for (var i = 0, il = d.xr.length; i < il; i++) {
                    if (Math.abs(d.xr[i] - w - (change.l || l)) < 
                      (!ea || isDrag && typeof change.l != "undefined" ? 1 : snapDiff)) {
                        if (!isDrag)
                            change.w = (wpos = d.xr[i]) - l;
                        else
                            wpos = d.xr[i];
                        change.rsticky = i == 0;
                        break;
                    }
                }
            }
            
            //Elements - Y
            if (d.yl.length && (typeof change.t == "undefined" || force)) {
                for (var i = 0, il = d.yl.length; i < il; i++) {
                    if (Math.abs(d.yl[i] - t) < (no ? snapDiff : 1)) {
                        change.t = tpos = d.yl[i];
                        change.toffset = toffset = -2;
                        change.tsticky = i == 0;
                        break;
                    }
                }
                
                if (tpos === false) {
                    for (var i = 0, il = d.yr.length; i < il; i++) {
                        if (Math.abs(d.yr[i] - t - h) < (so ? snapDiff : 1)) {
                            change.t = (tpos = d.yr[i]) - h;
                            change.toffset = toffset = 0;
                            change.bsticky = i == 0;
                            break;
                        }
                    }
                }
                
                if (tpos === false) {
                    for (var i = 0, il = d.ym.length; i < il; i++) {
                        if (Math.abs(d.ym[i] - t - d.cheight) < snapDiff) {
                            change.t = (tpos = d.ym[i]) - d.cheight;
                            change.toffset = toffset = -1;
                            break;
                        }
                    }
                }
            }
            
            if (d.yr.length && (typeof change.h == "undefined") && change.bsticky != 5) {
                for (var i = 0, il = d.yr.length; i < il; i++) {
                    if (Math.abs(d.yr[i] - h - (change.t || t)) < 
                      (!so || isDrag && typeof change.t != "undefined" ? 1 : snapDiff)) {
                        if (!isDrag)
                            change.h = (hpos = d.yr[i]) - t;
                        else
                            hpos = d.yr[i];
                        change.bsticky = i == 0;
                        break;
                    }
                }
            }
            
            //Elements - Opposite sides - X
            var oppDiff = 5, oloffset, olpos = false;
            if (d.xl.length) {
                //Left
                if (!change.lsticky) {
                    for (var i = 0, il = d.xr.length; i < il; i++) {
                        if ((Math.max(0, l - d.xr[i]) || 10000) - oppDiff < (we ? snapDiff : 1)) {
                            change.ol = (olpos = d.xr[i]) + oppDiff;
                            change.oloffset = oloffset = 0;
                            break;
                        }
                    }
                }
                
                //Right
                if (!change.rsticky) {
                    for (var i = 0, il = d.xl.length; i < il; i++) {
                        if ((Math.max(0, d.xl[i] - l - w) || 10000) - oppDiff < (ea ? snapDiff : 1)) {
                            change.or = (olpos = d.xl[i] - oppDiff) - w;
                            change.oloffset = oloffset = 0;
                            break;
                        }
                    }
                }
            }
    
            //Elements - Opposite sides - Y
            var otoffset, otpos = false;
            if (d.yl.length) {
                if (!change.tsticky) {
                    for (var i = 0, il = d.yr.length; i < il; i++) {
                        if ((Math.max(0, t - d.yr[i]) || 10000) - oppDiff  < (no ? snapDiff : 1)) {
                            change.ot = (otpos = d.yr[i]) + oppDiff;
                            change.otoffset = otoffset = 0;
                            break;
                        }
                    }
                }
                
                if (!change.bsticky) {
                    for (var i = 0, il = d.yl.length; i < il; i++) {
                        if ((Math.max(0, d.yl[i] - t - h) || 10000) - oppDiff < (so ? snapDiff : 1)) {
                            change.ob = (otpos = d.yl[i] - oppDiff) - h;
                            change.otoffset = otoffset = 0;
                            break;
                        }
                    }
                }
            }
            
            //Grid
            if (apf.config.snapgrid) {
                var r, gs = apf.config.gridsize;
                if (tpos === false)
                    change.t = t - (r = t % gs) + (r/gs > 0.5 ? gs : 0);
                if (lpos === false)
                    change.l = l - (r = l % gs) + (r/gs > 0.5 ? gs : 0);
                if (!we && hpos === false)
                    change.w = w - (r = w % gs) + (r/gs > 0.5 ? gs : 0);
                if (!no && wpos === false)
                    change.h = h - (r = h % gs) + (r/gs > 0.5 ? gs : 0);
            }
            
            if (lpos !== false) {
                dragIndicator1.style.left = (lpos + loffset + d.container[0]) + "px";
                dragIndicator1.style.top = d.container[1] + "px";
                dragIndicator1.style.height = (d.container[3]) + "px"
                dragIndicator1.style.display = "block";
                dragIndicator1.style.borderWidth = "0 0 0 2px";
            }
            else
                dragIndicator1.style.display = "none";
            
            if (tpos !== false) {
                dragIndicator2.style.left = (d.container[0]) + "px";
                dragIndicator2.style.top = (tpos + toffset + d.container[1]) + "px";
                dragIndicator2.style.width = (d.container[2]) + "px"
                dragIndicator2.style.display = "block";
                dragIndicator2.style.borderWidth = "2px 0 0";
            }
            else
                dragIndicator2.style.display = "none";
            
            if (wpos !== false) {
                dragIndicator3.style.left = (wpos + d.container[0]) + "px";
                dragIndicator3.style.top = d.container[1] + "px";
                dragIndicator3.style.height = (d.container[3]) + "px"
                dragIndicator3.style.display = "block";
                dragIndicator3.style.borderWidth = "0 0 0 2px";
            }
            else {
                dragIndicator3.style.display = "none";
            }
            
            if (hpos !== false) {
                dragIndicator4.style.left = (d.container[0]) + "px";
                dragIndicator4.style.top = (hpos + d.container[1]) + "px";
                dragIndicator4.style.width = (d.container[2]) + "px"
                dragIndicator4.style.display = "block";
                dragIndicator4.style.borderWidth = "2px 0 0";
            }
            else
                dragIndicator4.style.display = "none";
            
            if (olpos !== false) {
                dragIndicator6.style.left = (olpos + oloffset + d.container[0]) + "px";
                dragIndicator6.style.top = d.container[1] + "px";
                dragIndicator6.style.height = (d.container[3]) + "px"
                dragIndicator6.style.display = "block";
                dragIndicator6.style.borderWidth = "0 0 0 " + oppDiff + "px";
            }
            else
                dragIndicator6.style.display = "none";
            
            if (otpos !== false) {
                dragIndicator7.style.left = (d.container[0]) + "px";
                dragIndicator7.style.top = (otpos + otoffset + d.container[1]) + "px";
                dragIndicator7.style.width = (d.container[2]) + "px"
                dragIndicator7.style.display = "block";
                dragIndicator7.style.borderWidth = oppDiff + "px 0 0";
            }
            else
                dragIndicator7.style.display = "none";
            
            //Correction
            if (!isDrag) {
                if (!we) change.l = l;
                if (!no) change.t = t;
                if (we) {
                    if (change.l != undefined)
                        change.w = d.width + (d.left - change.l);
                    else if (change.ol != undefined) {
                        change.w = d.width + (d.left - change.ol);
                        change.l = change.ol;
                    }
                }
                else if (ea && change.or != undefined)
                    change.w = olpos - d.left;
                if (no) {
                    if (change.t != undefined)
                        change.h = d.height + (d.top - change.t);
                    else if (change.ot != undefined) {
                        change.h = d.height + (d.top - change.ot);
                        change.t = change.ot;
                    }
                }
                else if (so && change.ob != undefined)
                    change.h = otpos - d.top;
            }
            else {
                if (olpos != false)
                    change.l = change.ol || change.or;
                if (otpos != false)
                    change.t = change.ot || change.ob;
            }
            
            if (isDrag && e.shiftKey) {
                if (change.sl) change.l = change.sl;
                if (change.st) change.t = change.st;
            }
        }
    };

    var dragInfo;
    function setDragInfo(el, pEl, isDrag) {
        apf.setStyleClass(dragIndicator1, "indicate_common", 
            ["indicate_vbox", "indicate_hbox", "indicate_table", "indicate_common"]);

        if (pEl.localName == "html")
            pEl = pEl.ownerDocument.body;

        var container = pEl.$int;
        var isBody    = pEl.$int.tagName == "BODY";
        var htmlEl = isDrag ? outline : el.$ext;
        var d = dragInfo = {
            left   : apf.getHtmlLeft(htmlEl),
            top    : apf.getHtmlTop(htmlEl),
            width  : htmlEl.offsetWidth,
            height : htmlEl.offsetHeight
        }
        d.cwidth = Math.round(d.width/2);
        d.cheight = Math.round(d.height/2);
        
        //Container
        d.container = isBody ? [0,0] : apf.getAbsolutePosition(container, null, true); //@todo should check for position relative..
        if (isBody) var m = apf.getMargin(container);
        d.container.push(
            (isBody ? apf.getWindowWidth() : apf.getHtmlInnerWidth(container)), 
            (isBody ? apf.getWindowHeight() : apf.getHtmlInnerHeight(container)));
    
        //Elements
        var els = pEl.getElementsByTagName("*", true); //Fetch all siblings incl me
        var xl  = d.xl = [], yl = d.yl = [], curel;
        var xm  = d.xm = [], ym = d.ym = [];
        var xr  = d.xr = [], yr = d.yr = []; 
        
        //Container element
        if (apf.config.snapcontainer) {
            xl.push(10);
            xr.push(d.container[2] - 10);
            yl.push(10);
            yr.push(d.container[3] - 10);
        }
        
        if (apf.config.snapelement) {
            var selected = apf.document.$getVisualSelect().getLastSelection();//apf.document.getSelection().$getNodeList(); //@todo maybe optimize by requesting from visualselect
            
            var q = apf.getBorderOffset(container);
            var bLeft = q[0];
            var bTop  = q[1];
            for (var l, t, h, w, i = 0, il = els.length; i < il; i++) {
                if (selected.indexOf(curel = els[i]) > -1 || !curel.$ext)
                    continue;
    
                l = curel.$ext.offsetLeft - bLeft;
                xl.push(l);
                xm.push(l + Math.round((w = curel.$ext.offsetWidth)/2));
                xr.push(l + w);
                
                t = curel.$ext.offsetTop - bTop;
                yl.push(t);
                ym.push(t + Math.round((h = curel.$ext.offsetHeight)/2));
                yr.push(t + h);
            }
        }
    }

    function setStickyEdges(el){
        var s = el.$stick, d = dragInfo, t = el.$stuck || (el.$stuck = [false, false, false, false]);
        var setOpp = false;

        if (!apf.config.snapcontainer)
            return;
    
        if (isCoord(s.w) && s.rsticky) {
            if (!isCoord(el.right)) {
                el.setAttribute("right", d.container[2] - coord(s.l, d.left) - s.w);
                t[1] = true;
            }
            setOpp = true;
        }
        if (isCoord(s.l)) {
            if (s.lsticky && !isCoord(el.left)) { //Left
                el.setAttribute("left", s.l);
                t[3] = true;
            }
            
            if (!setOpp) {
                if (s.rsticky) {
                    if (!isCoord(el.right)) {
                        el.setAttribute("right", d.container[2] - s.l - coord(s.w, d.width));
                        t[1] = true;
                    }
                    setOpp = true;
                }
                else if (t[1] && isCoord(el.right) && s.lsticky) {
                    el.setAttribute("right", "");
                    el.setAttribute("width", el.$ext.offsetWidth);
                    t[1] = false;
                }
            }
        }
        if (t[3] && isCoord(el.left) && (setOpp || isCoord(el.right)) && (!isCoord(s.l) || !s.lsticky)) {
            el.setAttribute("left", "");
            el.setAttribute("width", el.$ext.offsetWidth);
            t[3] = false;
        }
        
        var setOpp = false;
    
        if (isCoord(s.h) && s.rsticky) {
            if (!isCoord(el.bottom)) {
                el.setAttribute("bottom", d.container[3] - coord(s.t, d.top) - s.h);
                t[2] = true;
            }
            setOpp = true;
        }
        if (isCoord(s.t)) {
            if (s.tsticky && !isCoord(el.top)) { //Top
                el.setAttribute("top", s.t);
                t[0] = true;
            }
            
            if (!setOpp) {
                if (s.bsticky) {
                    if (!isCoord(el.bottom)) {
                        el.setAttribute("bottom", d.container[3] - s.t - coord(s.h, d.height));
                        t[2] = true;
                    }
                    setOpp = true;
                }
                else if (t[2] && isCoord(el.bottom) && s.tsticky) {
                    el.setAttribute("bottom", "");
                    el.setAttribute("height", el.$ext.offsetHeight);
                    t[2] = false;
                }
            }
        }
        if (t[0] && isCoord(el.top) && (setOpp || isCoord(el.bottom)) && (!isCoord(s.t) || !s.tsticky)) {
            el.setAttribute("top", "");
            el.setAttribute("height", el.$ext.offsetHeight);
            t[0] = false;
        }
    }

    var control = {stop:apf.K};
    function hideIndicators(animate){
        if (!dragIndicator1)
            return;
        
        if (animate) {
            control = {};
            
            var tweens = [];
            for (var i = 0; i < 5; i ++) {
                if (indicators[i].style.display == "block") {
                    tweens.push({
                        oHtml : indicators[i],
                        type  : "fade",
                        from  : 1,
                        to    : 0
                    });
                }
            }
            
            function done(){
                for (var i = 0; i < tweens.length; i++) {
                    tweens[i].oHtml.style.filter = "";
                    tweens[i].oHtml.style.display = "none";
                }
            }
            
            apf.tween.multi(dragIndicator1, {
                anim     : apf.tween.easeInQuad,
                tweens   : tweens,
                steps    : 20,
                control  : control,
                onfinish : done,
                onstop   : done
            });
        }
        else {
            dragIndicator1.style.display = "none";
            dragIndicator2.style.display = "none";
            dragIndicator3.style.display = "none";
            dragIndicator4.style.display = "none";
            dragIndicator5.style.display = "none";
            dragIndicator6.style.display = "none";
            dragIndicator7.style.display = "none";
        }
    }

    var lastPos;
    function beforedragstart(e){
        //Prevent dragging when this node isn't selected
        var selection = apf.document.$getVisualSelect().getLastSelection();

        outline = selection.length > 1 && !e.htmlEvent.ctrlKey
            ? apf.document.$getVisualSelect().$getOutline()
            : dragOutline;
        
        this.$setOutline(outline);
    }
    
    function beforedrag(e, reparent, add){
        var name, pEl;

        var selection = apf.document.$getVisualSelect().getLastSelection();
        if ((this.$multidrag = selection.length > 1) 
          && selection.indexOf(this) == -1)
            return false;
        
        if (outline != (selection.length > 1
          ? apf.document.$getVisualSelect().$getOutline()
          : dragOutline))
            return false; //@todo this is a small hack to prevent dragging with the wrong outline. We should rethink the outline situation.
        
        control.stop();
        
        if (lastReparent && !add) {
            pEl = lastReparent;//apf.findHost(el.$pHtmlDoc.getElementById("apf_outline").parentNode);
            name = pEl.localName;
        }
        else {
            if (!e) e = event;
            name = (pEl = this.parentNode).localName;
        }

        if (!lastPos)
            lastPos = apf.getAbsolutePosition(outline, outline.offsetParent);

        if ("vbox|hbox|table".indexOf(name) > -1) {
            this.realtime  = true;
            
            apf.setStyleClass(dragIndicator1, "indicate_" + name, 
                ["indicate_vbox", "indicate_hbox", "indicate_table", "indicate_common"]);
            
            dragIndicator1.style.borderWidth = "";
            this.$showDrag = showDrag[pEl.localName];
        }
        else if (pEl.editable || add || this.$adding) {
            this.realtime = true;

            setDragInfo(this, pEl, true);

            this.$showDrag = showDrag.common;
        }
        else
            this.realtime = false;
    }

    function afterdrag(e){
        if (lastAmlNode) {
            clearTimeout(lastAmlNode[4]);
            lastAmlNode = null;
        }
        lastReparent = null;
    
        var el = this;
        var htmlNode = outline || this.$ext;
        
        delete this.$multidrag;
        
        if (el.$adding) {
            //this.$ext = oOutline;
        }
        
        var selected = apf.document.$getVisualSelect().getLastSelection();//.getSelection().$getNodeList(); //@todo maybe optimize by requesting from visualselect

        if (movePosition) {
            if (el.$adding || htmlNode.parentNode != el.$ext.parentNode) {
                //@todo review this... strange things
                var pNode = apf.findHost(htmlNode.parentNode);
    
                //@todo this shouldnt be here but done automatically by vbox/hbox/table
                for (var i = 0; i < selected.length; i++) {
                    selected[i].$ext.style.left = 
                    selected[i].$ext.style.top = 
                    selected[i].$ext.style.right = 
                    selected[i].$ext.style.width = 
                    selected[i].$ext.style.height = 
                    selected[i].$ext.style.bottom = "";
                    selected[i].$ext.style.position = "static";
                }
            }
            else
                var pNode = el.parentNode;
            
            if ("vbox|hbox|table".indexOf(pNode.localName) > -1) {
                for (var i = 0; i < selected.length; i++) {
                    pNode.insertBefore(selected[i], movePosition.where == "after"
                        ? movePosition.amlNode.nextSibling
                        : movePosition.amlNode);
                }
            }
            movePosition = null;
        }
        else {
            //reparent happened
            if (el.$adding || htmlNode.parentNode != el.$ext.parentNode) {
                var amlNode = apf.findHost(htmlNode.parentNode);
    
                for (var i = 0; i < selected.length; i++) {
                    amlNode.appendChild(selected[i]);
                }
                
                apf.document.getSelection().$selectList(selected);
            }
            
            //@todo for multiselect this becomes complex (just like multiresize)
            if (selected.length == 1 && el.$stick) {
                setStickyEdges(el);
                el.$stick = null;
            }
        }
        
        if (selected.length > 1 && lastPos) {
            var deltaX = apf.getHtmlLeft(htmlNode) - lastPos[0];
            var deltaY = apf.getHtmlTop(htmlNode)  - lastPos[1];

            if (deltaX || deltaY) {
                for (var n, i = 0; i < selected.length; i++) {
                    n = selected[i];
                    var diff = apf.getDiff(n.$ext);
                    n.$updateProperties(
                        apf.getHtmlLeft(n.$ext) + deltaX, 
                        apf.getHtmlTop(n.$ext) + deltaY, 
                        n.$ext.offsetWidth - diff[0], 
                        n.$ext.offsetHeight - diff[1], diff[0], diff[1]);
                }
            }
            
            lastPos = null;
        }

        hideIndicators();

        this.ownerDocument.execCommand("commit");

        apf.layout.processQueue();
        
        //oOutline.style.display = "none";
        
        if (el.$adding) {
            delete el.$adding;
            el.focus();
        }
        else {
            this.ownerDocument.$getVisualSelect().updateGeo();
        }
        
        lastPos = null;
    };

    function beforeresize(e){
        var type = e.type;
        var name = this.parentNode.localName;
        
        control.stop();
        
        if (name == "vbox") {
            var pack = this.align || this.parentNode.pack;
            if (pack != "middle") {
                var xType = pack == "start" ? "n" : "s";
                type = type.replace(xType, "");
                type = type.replace("w", "");
                if (!type) return;
            }

            this.realtime    = true;
            this.$showResize = function(l, t, w, h, e, c, we, no, ea, so) {
                if (h && (no || so))
                    this.setProperty("height", h);
                if (w && (ea || we))
                    this.setProperty("width", w);
                apf.layout.processQueue();
            }
        }
        else if (name == "hbox") {
            var pack = this.align || this.parentNode.pack;
            if (pack != "middle") {
                var xType = pack == "start" ? "w" : "e";
                type = type.replace(xType, "");
                type = type.replace("n", "");
                if (!type) return;
            }
            
            this.realtime    = true;
            this.$showResize = function(l, t, w, h) {
                this.setProperty("width", w);
                if (h)
                    this.setProperty("height", h);
                apf.layout.processQueue();
            }
        }
        else if (this.parentNode.editable && name != "table") {
            this.realtime = true;
            
            setDragInfo(this, this.parentNode);
            
            this.$showResize = showDrag.common_resize;
        }
        else
            this.realtime = false;
        
        if ("hbox|vbox|table".indexOf(name) == -1
          && apf.getStyle(this.$ext, "position") != "absolute") { //ignoring fixed for now...
            this.$ext.style.width = (this.$ext.offsetWidth - apf.getWidthDiff(this.$ext)) + "px";
            this.$ext.style.height = (this.$ext.offsetHeight - apf.getHeightDiff(this.$ext)) + "px";
            this.$ext.style.left = apf.getHtmlLeft(this.$ext) + "px";
            this.$ext.style.top = apf.getHtmlTop(this.$ext) + "px";
            this.$ext.style.position = "absolute";
        }

        //@todo move everything below into vbox/table/anchoring
        var m, edge;
        if (name == "vbox") {
            this.maxheight = Math.min(this.maxheight || 10000, 
              this.parentNode.$ext.offsetHeight 
                - apf.getVerBorders(this.parentNode.$ext)
                - (this.parentNode.$hasPerc ? this.parentNode.$totalPerc * 5 : 0) 
                - this.parentNode.$totalFixed
                + this.$ext.offsetHeight);
            
            if (this.margin)
                m = apf.getBox(this.margin);
            if (this.parentNode.edge)
                edge = apf.getBox(this.parentNode.edge);
            this.maxwidth = Math.min(this.maxwidth || 10000, 
              this.parentNode.$ext.offsetWidth
                - apf.getHorBorders(this.parentNode.$ext)
                - (edge ? edge[1] + edge[3] : 0)
                - (m ? m[1] + m[3] : 0));
        }
        else if (name == "hbox") {
            //if (this.parentNode.$hasPerc) {
                this.maxwidth = Math.min(this.maxwidth || 10000, 
                  this.parentNode.$ext.offsetWidth
                    - apf.getHorBorders(this.parentNode.$ext)
                    - (this.parentNode.$hasPerc ? this.parentNode.$totalPerc * 5 : 0) 
                    - this.parentNode.$totalFixed
                    + this.$ext.offsetWidth);
            //}

            if (this.margin)
                m = apf.getBox(this.margin);
            if (this.parentNode.edge)
                edge = apf.getBox(this.parentNode.edge);
            this.maxheight = Math.min(this.maxheight || 10000, 
              this.parentNode.$ext.offsetHeight 
                - apf.getVerBorders(this.parentNode.$ext)
                - (edge ? edge[0] + edge[2] : 0)
                - (m ? m[0] + m[2] : 0));
        }

        e.setType(name == "table" ? "s" : type);
    };
    
    function afterresize(){
        //this.$ext = oOutline;

        hideIndicators();
        
        var name = this.parentNode.localName;
        
        //Sizing the edge will stick it to the side
        if (name == "hbox") {
            if (this.maxheight == this.$ext.offsetHeight && this.height)
                this.setAttribute("height", "");
        }
        //Sizing the edge will stick it to the side
        else if (name == "vbox") {
            if (this.maxwidth == this.$ext.offsetWidth && this.width)
                this.setAttribute("width", "");
        }
        //Sizing the edge will stick it to the side
        else if (this.$stick) {
            setStickyEdges(this); //@todo bugs with placing toolbar in ipad skin
        }
        this.$stick = null;

        this.ownerDocument.execCommand("commit");
        
        //apf.layout.processQueue();
        this.ownerDocument.$getVisualSelect().$finishResize();
    };
    
    function keydown(e){
        var selected = apf.document.$getVisualSelect().getLastSelection();//apf.document.getSelection().$getNodeList(); //@todo maybe optimize by requesting from visualselect
        if (!selected.length)
            return;
        
        //@todo this should be solved in the capturing phase
        if (apf.document.queryCommandState("rename"))
            return;
            
        var name = selected[0].parentNode.localName;
        if ("vbox|hbox|table".indexOf(name) > -1)
            return;
        
        var dirX = 0, dirY = 0;
        switch(e.keyCode) {
            case 38: //UP
                dirY = -1;
                break;
            case 40: //DOWN
                dirY = 1;
                break;
            case 39: //RIGHT
                dirX = 1;
                break;
            case 37: //LEFT
                dirX = -1;
                break;
            default:
                return;
        }
        
        control.stop();
        
        var l, t, w, h, n = selected[0], ext, d;
        n.ownerDocument.execCommand("begin"); //@todo Use a system here to combine these commits as well as possible
        for (var i = 0, il = selected.length; i < il; i++) {
            n = selected[i];
            ext = n.$ext;
            d = apf.getDiff(ext);
        
            n.$updateProperties(
                l = apf.getHtmlLeft(ext) + (dirX * (e.ctrlKey ? 10 : (e.shiftKey ? 30 : 1))), 
                t = apf.getHtmlTop(ext) + (dirY * (e.ctrlKey ? 10 : (e.shiftKey ? 30 : 1))), 
                (w = ext.offsetWidth) - d[0], 
                (h = ext.offsetHeight) - d[1], d[0], d[1]);
        }
        n.ownerDocument.execCommand("commit"); //@todo Use a system here to combine these commits as well as possible
        
        apf.layout.processQueue();
        n.ownerDocument.$getVisualSelect().updateGeo();
        
        if (selected.length > 1) {
            var vOutline = n.ownerDocument.$getVisualSelect().$getOutline();
            l = apf.getHtmlLeft(vOutline);
            t = apf.getHtmlTop(vOutline);
            w = vOutline.offsetWidth;
            h = vOutline.offsetheight;
        }
        
        setDragInfo(n, n.parentNode, true);
        showDrag.common_resize.call(n, l, t, w, h, {}, 
            {}, true, true, true, true, true, 1);
        
        hideIndicators(true);
    }
    
    apf.addEventListener("keydown", keydown);

    apf.ContentEditable2.addInteraction    = function(amlNode){
        if (!inited)
            init();
        
        amlNode.addEventListener("beforedragstart", beforedragstart);
        amlNode.addEventListener("beforedrag",      beforedrag);
        amlNode.addEventListener("beforeresize",    beforeresize);
        amlNode.addEventListener("afterdrag",       afterdrag);
        amlNode.addEventListener("afterresize",     afterresize);
        
        amlNode.$stuck = [amlNode.$adding || amlNode.top || amlNode.top === 0, amlNode.right 
            || amlNode.right === 0, amlNode.bottom || amlNode.bottom === 0, amlNode.left 
            || amlNode.$adding || amlNode.left === 0];
        var s = amlNode.$stuck;
        if (s[0] && s[1] && s[2] && s[3])
            amlNode.$stuck = [false, false, false, false];
    }
    
    apf.ContentEditable2.removeInteraction = function(amlNode){
        amlNode.removeEventListener("beforedragstart", beforedragstart);
        amlNode.removeEventListener("beforedrag",      beforedrag);
        amlNode.removeEventListener("beforeresize",    beforeresize);
        amlNode.removeEventListener("afterdrag",       afterdrag);
        amlNode.removeEventListener("afterresize",     afterresize);

        delete amlNode.$stuck;
    }
})();

//#endif