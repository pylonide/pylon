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
// #ifdef __WITH_GRID || __JGRID || __INC_ALL

/**
 * All children of this component will be placed in a grid
 *
 * @define grid
 * @classDescription		
 * @return
 * @type
 * @constructor
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.grid = jpf.component(jpf.GUI_NODE, function(){
    var id;
    var update  = false;
    var l       = jpf.layoutServer;
    var _self   = this;
    var updater = {
        __updateLayout : function(){
            _self.__updateGrid();
        }
    };
    
    this.columns    = "100,*";
    this.padding    = 2;
    this.margin     = "5 5 5 5";
    this.cellheight = 22;
    
    this.__supportedProperties.push("columns", "padding", "margin", "cellheight"); 
    this.__propHandlers["columns"] =
    this.__propHandlers["padding"] =
    this.__propHandlers["margin"] =
    this.__propHandlers["cellheight"] = function(value){
        if (!update && jpf.loaded)
            l.queue(this, updater);
        update = true;
    };
    
    /**
     * @macro
     */
    function setPercentage(expr, value){
        return typeof expr == "string" 
            ? expr.replace(jpf.percentageMatch, "((" + value + " * $1)/100)")
            : expr;
    }
    
    this.__updateGrid = function(){
        if (!update)
            return;

        var cols      = setPercentage(this.columns, pWidth).split(/\s*,\s*/);
        var collength = cols.length;
        var margin    = jpf.getBox(this.margin);
        var rowheight = [];
        this.padding  = parseInt(this.padding);
        
        var pWidth  = "pWidth";
        var pHeight = "pHeight";

        var oCols   = [];

        var col, row, oExt, diff, j, m, cellInfo;
        this.ids = [this.oExt];
        var jNode, jNodes = this.childNodes;
        for (var nodes = [], c = 0, i = 0, l = jNodes.length; i < l; i++) {
            jNode = jNodes[i];
            if (jNode.nodeType != jpf.GUI_NODE)
                continue;
            
            //#ifdef __WITH_ANCHORING
            if (jNode.hasFeature(__ANCHORING__))
                jNode.disableAnchoring();
            //#endif
            
            m = jpf.getBox(jNode.getAttribute("margin"));
            //for (j = 0; j < 4; j++)
                //m[j] += this.padding;

            diff = jpf.getDiff(jNode.oExt);
            oExt = jNode.oExt;
            if (!oExt.getAttribute("id")) 
                jpf.setUniqueHtmlId(oExt);
            if (jpf.isIE)
                oExt.style.position = "absolute"; //Expensive
            
            cellInfo = {
                span    : jNode.getAttribute("span") || 1,
                m       : m,
                height  : setPercentage(jNode.height, pHeight),
                width   : jNode.width,
                oHtml   : oExt,
                hordiff : diff[0],
                verdiff : diff[1],
                id      : "ids[" + (this.ids.push(oExt) - 1) + "]"
            }
            
            nodes.push(cellInfo);
            
            row = Math.floor(c / collength);
            c += cellInfo.span; //no check on span overflow
            
            if (cellInfo.height == "*" || rowheight[row] == "*") {
                rowheight[row] = "*";
                cellInfo.height = null;
            }
            else if(cellInfo.height && parseInt(cellInfo.height) != cellInfo.height) {
                rowheight[row] = cellInfo.height;
            }
            else if(typeof rowheight[row] != "string") {
                rowheight[row] = Math.max(rowheight[row] || 0, 
                    (cellInfo.height || this.cellheight) 
                    + cellInfo.m[0] + cellInfo.m[2]);
            }
        }
        var dt = new Date().getTime();
        
        if (nodes.length == 0) 
            return;
        
        var total, combCol, fillCol = null, fillRow = null;
        var rule = [
            "var ids = jpf.all[" + this.uniqueId + "].ids",
            "var total = 0, pHeight = ids[0].offsetHeight - " 
                + ((rowheight.length - 1) * this.padding),
            "var pWidth  = ids[0].offsetWidth - " 
                + ((collength - 1) * this.padding)
        ];
        
        /*for (i = 0; i < this.ids.length; i++) {
            rule.push("var item" + i + " = ids[" + i + "]");
        }*/

        //Set column widths (only support for one *)
        for (total = 0, i = 0; i < collength; i++) {
            if (cols[i] == "*")
                fillCol = i;
            else {
                if (parseFloat(cols[i]) != cols[i]) {
                    rule.push("var colw" + i + "; total += colw" 
                        + i + " = " + cols[i]);
                    cols[i] = "colw" + i;
                }
                else
                    total += cols[i] = parseFloat(cols[i]);
            }
        }
        if (fillCol !== null) {
            rule.push("var colw" + fillCol + " = " + pWidth 
                    + " - total - " + total + " - " + (margin[1] + margin[3]));
            cols[fillCol] = "colw" + fillCol;
        }
        
        //Set column start position
        var colstart = [margin[3]];
        rule.push("var coll0 = " + margin[3]);
        for (i = 1; i < collength; i++) {
            if (typeof colstart[i-1] == "number" && typeof cols[i-1] == "number") {
                colstart[i] = colstart[i-1] + cols[i-1] + this.padding;
            }
            else {
                rule.push("var coll" + i + " = coll" + (i - 1) + " + colw" 
                    + (i - 1) + " + " + this.padding);
                colstart[i] = "coll" + i;
            }
        }
        
        //Set row heights
        rule.push("total = 0");
        for (total = 0, i = 0; i < rowheight.length; i++) {
            if (rowheight[i] == "*")
                fillRow = i;
            else {
                if (parseFloat(rowheight[i]) != rowheight[i]) {
                    rule.push("var rowh" + i + "; total += rowh" 
                        + i + " = " + rowheight[i]);
                    rowheight[i] = "rowh" + i;
                }
                else
                    total += rowheight[i] = parseFloat(rowheight[i]);
            }
        }
        if (fillRow !== null) {
            rule.push("var rowh" + fillRow + " = " + pHeight 
                    + " - total - " + total + " - " + (margin[0] + margin[2]));
            rowheight[fillRow] = "rowh" + fillRow;
        }
        
        //Set column start position
        var rowstart = [margin[0]];
        rule.push("var rowt0 = " + margin[0]);
        for (i = 1; i < rowheight.length; i++) {
            if (typeof rowstart[i-1] == "number" && typeof rowheight[i-1] == "number") {
                rowstart[i] = rowstart[i-1] + rowheight[i-1] + this.padding;
            }
            else {
                rule.push("var rowt" + i + " = rowt" + (i - 1) + " + rowh" 
                    + (i - 1) + " + " + this.padding);
                rowstart[i] = "rowt" + i;
            }
        }
        
        //Set all cells
        for (c = 0, i = 0; i < nodes.length; i++) {
            cellInfo = nodes[i]
            col      = c % collength;
            row      = Math.floor(c / collength);
            c       += cellInfo.span; //no check on span overflow
            id       = cellInfo.id;
            
            //Top
            if (typeof rowstart[row] == "number")
                cellInfo.oHtml.style.top = (rowstart[row] + cellInfo.m[0]) + "px";
            else
                rule.push(id + ".style.top    = rowt" 
                    + row + " + " + cellInfo.m[0] + " + 'px'");
            
            //Left
            if (typeof colstart[col] == "number")
                cellInfo.oHtml.style.left = (colstart[col] + cellInfo.m[3]) + "px";
            else
                rule.push(id + ".style.left   = coll" 
                    + col + " + " + cellInfo.m[3] + " + 'px'");
            
            //Width
            if (cellInfo.span && cellInfo.span > 1 && !cellInfo.width) {
                var cTotal = 0;
                for (combCol = [], j = 0; j < cellInfo.span; j++) {
                    if (typeof cols[col + j - 1] == "number")
                        cTotal += cols[col + j - 1];
                    else {
                        combCol.push("colw" + (col + j - 1));
                        cTotal = -1000000;
                    }
                }
                
                if (cTotal > 0) {
                    cellInfo.oHtml.style.width = (cTotal - (cellInfo.m[1] 
                        + cellInfo.m[3] + cellInfo.m[3])) + "px";
                }
                else{
                    rule.push(id + ".style.width = (" + combCol.join(" + ") 
                        + " - " + (cellInfo.m[1] + cellInfo.m[3] 
                        + cellInfo.hordiff) + ") + 'px'");
                }
            }
            else {
                if (parseFloat(cellInfo.width) == cellInfo.width
                    || typeof cols[col] == "number")
                    cellInfo.oHtml.style.width = (cellInfo.width || cols[col] 
                        - (cellInfo.m[1] + cellInfo.m[3]) + cellInfo.hordiff) + "px";
                else
                    rule.push(id + ".style.width = (" 
                        + (cellInfo.width || "colw" + col) + " - " 
                        + (cellInfo.m[1] + cellInfo.m[3] + cellInfo.hordiff) 
                        + ") + 'px'");
            }
            
            //Height
            if (parseFloat(cellInfo.height) == cellInfo.height
                || typeof rowheight[row] == "number")
                cellInfo.oHtml.style.height = (cellInfo.height || rowheight[row] 
                    - (cellInfo.m[0] + cellInfo.m[2] + cellInfo.verdiff)) + "px";
            else
                rule.push(id + ".style.height = (" 
                    + (cellInfo.height || "rowh" + row) + " - " 
                    + (cellInfo.m[0] + cellInfo.m[2] + cellInfo.verdiff)
                    + ") + 'px'");
        }

        //rule.join("\n"), true);
        jpf.layoutServer.setRules(this.oExt, "grid", (rule.length 
            ? "try{" + rule.join(";}catch(e){};\ntry{") + ";}catch(e){};" 
            : ""), true);

        //Set size of grid if necesary here...
    }
    
    this.draw = function(){
        this.oExt = this.pHtmlNode.appendChild(document.createElement("div"));
        this.oExt.className = "grid " + (this.jml.getAttributeNode("class") || "");
        this.oInt = this.oExt;
        
        if (!this.oExt.getAttribute("id")) 
            jpf.setUniqueHtmlId(this.oExt);

        id = jpf.hasHtmlIdsInJs 
            ? this.oExt.getAttribute("id")
            : "document.getElementById('" + this.oExt.getAttribute("id") + "')";
        
        this.oExt.style.height = "80%"
        this.oExt.style.width = "100%"
        this.oExt.style.top = 0;
        
        if (!jpf.isIE)
            jpf.importCssString(document, ".grid>*{position:absolute}");
    }
    
    this.__loadJml = function(x){
        jpf.JmlParser.parseChildren(x, this.oInt, this, true);
        
        this.__updateGrid();
    }
});

// #endif
