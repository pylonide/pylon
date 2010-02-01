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

// #ifdef __WITH_ALIGNMENT

/**
 * @constructor
 * @private
 */
apf.splitter = function(struct, tagName){
    this.$init(tagName || "splitter", apf.NODE_VISIBLE, struct);
    
    // #ifdef __WITH_PLANE
    apf.plane.init();
    // #endif
};

(function() {
    this.$focussable = true; // This object can get the focus
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.update = function(){
        //Optimize this to not recalc for certain cases
        var b = (this.type == "vertical")
            ? {
                fsize      : "fwidth",
                size       : "width",
                offsetPos  : "offsetLeft",
                offsetSize : "offsetWidth",
                pos        : "left"
              }
            : {
                fsize      : "fheight",
                size       : "height",
                offsetPos  : "offsetTop",
                offsetSize : "offsetHeight", 
                pos        : "top"
              };
        
        this.$ext.offsetTop; //@weird somehow this will fix a problem in IE8
        
        this.$amlNode = this.refNode;
        var htmlNode  = this.refHtml;

        var v          = apf.layout.vars;
        var oItem      = this.oItem;
        var needRecalc = false;
        
        var itemStart = htmlNode 
            ? htmlNode[b.offsetPos] 
            : v[b.pos + "_" + oItem.id];
        var itemSize  = htmlNode 
            ? htmlNode[b.offsetSize] 
            : v[b.size + "_" + oItem.id];

        var row = oItem.parent.children;
        for (var z = 0, i = 0; i < row.length; i++)
            if (!row[i][b.fsize])
                z++;

        if (!oItem[b.fsize] && z > 1) {
            for (var rTotal = 0, rSize = 0, i = oItem.stackId + 1; i < row.length; i++) {
                if (!row[i][b.fsize]) {
                    rTotal += row[i].weight || 1;
                    rSize  += (row[i].node 
                        ? row[i].oHtml[b.offsetSize] 
                        : v[b.size + "_" + row[i].id]);
                }
            }
            
            var diff  = this.$ext[b.offsetPos] - itemStart - itemSize;
            var rEach = (rSize - diff)/rTotal;
            
            for (var i = 0; i < oItem.stackId; i++) {
                if (!row[i][b.fsize])
                    row[i].original.weight = (row[i].node 
                        ? row[i].oHtml[b.offsetSize] 
                        : v[b.size + "_" + row[i].id]) / rEach;
            }

            oItem.original.weight = (itemSize + diff) / rEach
            needRecalc = true;
        }
        else {
            var isNumber     = oItem[b.fsize] ? oItem[b.fsize].match(/^\d+$/) : false;
            var isPercentage = oItem[b.fsize] ? oItem[b.fsize].match(/^([\d\.]+)\%$/) : false;
            if (isNumber || isPercentage || !oItem[b.fsize]) {
                var diff      = this.$ext[b.offsetPos] - itemStart - itemSize;
                var newHeight = this.$ext[b.offsetPos] - itemStart;
                
                for (var total = 0, size = 0, i = oItem.stackId + 1; i < row.length; i++) {
                    if (!row[i][b.fsize]) {
                        total += row[i].weight || 1;
                        size  += (row[i].node 
                            ? row[i].oHtml[b.offsetSize] 
                            : v[b.size + "_" + row[i].id]);
                    }
                }
                
                if (total > 0) {
                    var ratio = ((size-diff)/total)/(size/total);
                    for (var i = oItem.stackId + 1; i < row.length; i++)
                        row[i].original.weight = ratio * (row[i].weight || 1);
                }
                else {
                    for (var i = oItem.stackId + 1; i < row.length; i++) {
                        if (row[i][b.fsize].match(/^\d+$/)) {
                            //should check for max here as well
                            var nHeight = (row[i].node 
                                ? row[i].oHtml[b.offsetSize] 
                                : v[b.size + "_" + row[i].id]) - diff;
                            row[i].original[b.fsize] = "" + Math.max(0, nHeight, row[i].minheight || 0);
                            if (row[i][b.fsize] - nHeight != 0) 
                                diff = row[i][b.fsize] - nHeight;
                            else
                                break;
                        }
                        else
                            if (row[i][b.fsize].match(/^([\d\.]+)\%$/)) {
                                var nHeight = (row[i].node 
                                    ? row[i].oHtml[b.offsetSize] 
                                    : v[b.size + "_" + row[i].id]) - diff;
                                row[i].original[b.fsize] = Math.max(0,
                                    ((parseFloat(RegExp.$1) / (row[i].node 
                                    ? row[i].oHtml[b.offsetSize] 
                                    : v[b.size + "_" + row[i].id])) * nHeight)) + "%";
                                //check fheight
                                break;
                            }
                    }
                }
                
                if (oItem.original[b.fsize]) {
                    oItem.original[b.fsize] = isPercentage 
                        ? ((parseFloat(isPercentage[1])/itemSize) * newHeight) + "%" 
                        : "" + newHeight;
                }
                
                //if(total > 0  || isPercentage) needRecalc = true;
                needRecalc = true;
            }
        }

        if (needRecalc) {
            /*
            var l = apf.layout.layouts[this.$ext.parentNode.getAttribute("id")];
            apf.layout.compileAlignment(l.root);
            apf.layout.activateRules(this.$ext.parentNode);

            */
            
            apf.layout.compile(this.$ext.parentNode);
            apf.layout.activateRules(this.$ext.parentNode);
            
            if (apf.hasSingleRszEvent)
                apf.layout.forceResize();

            return;
        }

        apf.layout.forceResize(this.$ext.parentNode);
    };
    
    /* *********
        INIT
    **********/
    //this.implement(apf.GuiElement); /** @inherits apf.GuiElement */
    
    this.init = function(size, refNode, oItem){
        /*var li = size + min + max + (refNode.$uniqueId || refNode);
        if(li == this.$lastinit) return;
        this.$lastinit = li;*/
        this.min     = 0;
        this.max     = 1000000;
        this.size    = parseInt(size) || 3;
        this.refNode = null;
        this.refHtml = null;
        
        var pNode;
        if (refNode) {
            if (typeof refNode != "object")
                refNode = apf.lookup(refNode);
            this.refNode = refNode;
            this.refHtml = this.refNode.$ext;
            pNode        = this.refHtml.parentNode;

            oItem        = refNode.aData.calcData;
        }
        else
            pNode = oItem.pHtml;
        
        this.oItem = oItem;
        if (pNode && pNode != this.$ext.parentNode)
            pNode.appendChild(this.$ext);
        
        var diff = apf.getDiff(this.$ext);
        this.$verdiff  = diff[0];
        this.$hordiff  = diff[1];
        this.$sizeArr  = [];
        
        this.type = oItem.parent.vbox ? "horizontal" : "vertical";
        
        var layout = apf.layout.get(this.$ext.parentNode).layout;
        var name   = "splitter" + this.$uniqueId;
        layout.addRule("var " + name + " = apf.lookup(" + this.$uniqueId + ").$ext");
        
        var vleft   = [name + ".style.left = "];
        var vtop    = [name + ".style.top = "];
        var vwidth  = [name + ".style.width = -" + this.$hordiff + " + "];
        var vheight = [name + ".style.height = -" + this.$verdiff + " + "];
        var oNext   = oItem.parent.children[oItem.stackId+1];
        
        if (this.type == "horizontal") {
            vwidth.push("Math.max(");
            if (oItem.node) {
                vleft.push(oItem.id  + ".offsetLeft");
                vtop.push(oItem.id   + ".offsetTop + " + oItem.id + ".offsetHeight");
                vwidth.push(oItem.id + ".offsetWidth");
            }
            else {
                vleft.push("v.left_"   + oItem.id);
                vtop.push("v.top_"     + oItem.id + " + v.height_" + oItem.id);
                vwidth.push("v.width_" + oItem.id);
            }
            vwidth.push(",", oNext
                ? (oNext.node 
                    ? oNext.id + ".offsetWidth" 
                    : "v.width_" + oNext.id)
                :  0, ")");
            
            layout.addRule(vwidth.join(""));
            this.$ext.style.height = (oItem.splitter - this.$hordiff) + "px";
        }
        else {
            vheight.push("Math.max(");
            if (oItem.node) {
                vleft.push(oItem.id   + ".offsetLeft + " + oItem.id + ".offsetWidth");
                vtop.push(oItem.id    + ".offsetTop");
                vheight.push(oItem.id + ".offsetHeight");
            }
            else {
                vleft.push("v.left_"     + oItem.id + " + v.width_" + oItem.id);
                vtop.push("v.top_"       + oItem.id);
                vheight.push("v.height_" + oItem.id);
            }
            vheight.push(",", oNext 
                ? (oNext.node 
                    ? oNext.id + ".offsetHeight" 
                    : "v.height_" + oNext.id)
                : 0, ")");
            
            layout.addRule(vheight.join(""));
            this.$ext.style.width = (oItem.splitter - this.$hordiff) + "px";
        }
        
        layout.addRule(vleft.join(""));
        layout.addRule(vtop.join(""));

        //if(!apf.p) apf.p = new apf.ProfilerClass();
        //apf.p.start();
        
        //Determine min and max
        var row = oItem.parent.children;
        if (this.type == "vertical") {
            layout.addRule(name + ".host.min = " + (oItem.node 
                ? "document.getElementById('" + oItem.id + "').offsetLeft" 
                : "v.left_" + oItem.id) + " + "
                    + parseInt(oItem.minwidth || oItem.childminwidth || 10));

            var max = [], extra = [];
            for (var hasRest = false, i = oItem.stackId + 1; i < row.length; i++) {
                if (!row[i].fwidth)
                    hasRest = true;
            }
            
            for (var d, i = oItem.stackId + 1; i < row.length; i++) {
                d = row[i];
                
                //should take care here of minwidth due to html padding and html borders
                if (d.minwidth || d.childminheight)
                    max.push(parseInt(d.minwidth || d.childminheight));
                else
                    if (d.fwidth) {
                        if (!hasRest && i == oItem.stackId+1)
                            max.push(10);
                        else
                            if(d.fwidth.indexOf("%") != -1)
                                max.push("(" + d.parent.innerspace + ") * " 
                                    + (parseFloat(d.fwidth)/100));
                        else 
                            max.push(d.fwidth);
                    }
                else 
                    max.push(10);
                
                max.push(d.edgeMargin);
            }
            
            layout.addRule(name + ".host.max = v.left_" + oItem.parent.id 
                + " + v.width_" + oItem.parent.id + " - (" 
                + (max.join("+")||0) + ")");
        }
        else {
            layout.addRule(name + ".host.min = " + (oItem.node 
                ? "document.getElementById('" + oItem.id + "').offsetTop" 
                : "v.top_" + oItem.id) + " + " 
                    + parseInt(oItem.minheight || oItem.childminheight || 10));

            var max = [], extra = [];
            for (var hasRest = false, i = oItem.stackId + 1; i < row.length; i++) {
                if (!row[i].fheight) 
                    hasRest = true;
            }
            
            //This line prevents splitters from sizing minimized items without a rest
            if (!hasRest && oNext && oNext.state > 0)
                return this.$ext.parentNode.removeChild(this.$ext);
            
            for (var d, i = oItem.stackId + 1; i < row.length; i++) {
                d = row[i];
                
                //should take care here of minwidth due to html padding and html borders
                if (d.minheight || d.childminheight)
                    max.push(parseInt(d.minheight || d.childminheight));
                else if (d.fheight) {
                    if (!hasRest && i == oItem.stackId+1)
                        max.push(10);
                    else if(d.fheight.indexOf("%") != -1)
                        max.push("(" + d.parent.innerspace + ") * " 
                            + (parseFloat(d.fheight)/100));
                    else 
                        max.push(d.fheight);
                }
                else
                    max.push(10);
                
                if (d.edgeMargin)
                    max.push(d.edgeMargin);
            }

            layout.addRule(name + ".host.max = v.top_" + oItem.parent.id 
                + " + v.height_" + oItem.parent.id + " - (" 
                + (max.join("+")||0) + ")");
        }

        //apf.p.stop();
        //document.title = apf.p.totalTime;	
        
        this.$setStyleClass(this.$ext, this.type,
            [this.type == "horizontal" ? "vertical" : "horizontal"]);
        
        if (this.type == "vertical")
            this.$setStyleClass(this.$ext, "w-resize", ["n-resize"]);
        else
            this.$setStyleClass(this.$ext, "n-resize", ["w-resize"]);

        return this;
    };
    
    this.$draw = function(){
        //Build Main Skin
        this.$ext = this.$getExternal();

        var _self = this;
        this.$ext.onmousedown = function(e){
            if (!e)
                e = event;
            
            var amlNode = _self;//.$amlNode;
            var pos = apf.getAbsolutePosition(this);
            if (amlNode.type == "vertical")
                amlNode.tx = e.clientX - pos[0];
            else
                amlNode.ty = e.clientY - pos[1];
            amlNode.startPos = amlNode.type == "vertical" 
                ? this.offsetLeft 
                : this.offsetTop;
            
            e.returnValue  = false;
            e.cancelBubble = true;
            
            // #ifdef __WITH_PLANE
            apf.plane.show(this);
            // #endif

            amlNode.$setStyleClass(this, "moving");
            
            amlNode.$setStyleClass(document.body,
                amlNode.type == "vertical" ? "w-resize" : "n-resize",
                [amlNode.type == "vertical" ? "n-resize" : "w-resize"]);
            
            //@todo convert to proper way
            document.onmouseup = function(){
                amlNode.$setStyleClass(amlNode.$ext, "", ["moving"]);
        
                // #ifdef __WITH_PLANE
                apf.plane.hide();
                // #endif
        
                amlNode.update();
                amlNode.$setStyleClass(document.body, "", ["n-resize", "w-resize"]);
                
                document.onmouseup   = 
                document.onmousemove = null;
            };
            
            //@todo convert to proper way
            document.onmousemove = function(e){
                if(!e) e = event;
        
                if (amlNode.type == "vertical") {
                    if (e.clientX >= 0) {
                        var pos = apf.getAbsolutePosition(amlNode.$ext.offsetParent);
                        amlNode.$ext.style.left = (Math.min(amlNode.max,
                            Math.max(amlNode.min, (e.clientX - pos[0]) - amlNode.tx))) + "px";
                    }
                }
                else {
                    if (e.clientY >= 0) {
                        var pos = apf.getAbsolutePosition(amlNode.$ext.offsetParent);
                        amlNode.$ext.style.top = (Math.min(amlNode.max,
                            Math.max(amlNode.min, (e.clientY - pos[1]) - amlNode.ty))) + "px";
                    }
                }
                
                e.returnValue  = false;
                e.cancelBubble = true;
            };
        }
    };
        
    this.$loadAml = function(x){
        if (this.left || this.top) {
            var O1 = this.left || this.top;
            var O2 = this.right || this.bottom;
            O1 = O1.split(/\s*,\s*/);
            O2 = O2.split(/\s*,\s*/);
            
            for (var i = 0; i < O1.length; i++)
                O1[i] = O1[i];
            for (var i = 0; i < O2.length; i++)
                O2[i] = O2[i];
                
            //Not a perfect hack, but ok, for now
            var _self = this;
            $setTimeout(function(){
                this.$amlNode.init(_self.type,
                    _self.size, 
                    _self.min, 
                    _self.max, 
                    _self.change, O1, O2);
            });
        }
    };
}).call(apf.splitter.prototype = new apf.Presentation());

apf.aml.setElement("splitter", apf.splitter);
// #endif
