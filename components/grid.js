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
        
        var pWidth  = "pWidth";
        var pHeight = "pHeight";

        var col, row, oExt, diff, j, m, cellInfo;
        this.ids = [];
        var jNodes = this.childNodes;
        for (var nodes = [], c = 0, i = 0; i < jNodes.length; i++) {
            if (jNodes[i].nodeType != jpf.GUI_NODE)
                continue;
            
            //#ifdef __WITH_ANCHORING
            if (jNodes[i].hasFeature(__ANCHORING__))
                jNodes[i].disableAnchoring();
            //#endif
            
            m = jpf.getBox(jNodes[i].getAttribute("margin"));
            //for (j = 0; j < 4; j++)
                //m[j] += this.padding;

            diff = jpf.getDiff(jNodes[i].oExt);
            oExt = jNodes[i].oExt;
            if (!oExt.getAttribute("id")) 
                jpf.setUniqueHtmlId(oExt);
            oExt.style.position = "absolute";
            
            cellInfo = {
                span    : jNodes[i].getAttribute("span") || 1,
                m       : m,
                height  : setPercentage(jNodes[i].height, pHeight),
                width   : jNodes[i].width,
                oHtml   : oExt,
                hordiff : diff[0],
                verdiff : diff[1],
                id      : "item" + (this.ids.push(oExt) - 1)
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
        
        if (nodes.length == 0) 
            return;
        
        var combCol, fillColl, fillRow;
        var rule = [
            "var total = 0, pHeight = " + id + ".offsetHeight - " 
                + ((rowheight.length - 1) * this.padding),
            "var pWidth  = " + id + ".offsetWidth - " 
                + ((collength - 1) * this.padding)
        ];
        
        rule.push("var ids = jpf.all[" + this.uniqueId + "].ids");
        for (i = 0; i < this.ids.length; i++) {
            rule.push("var item" + i + " = ids[" + i + "]");
        }

        //Set column widths (only support for one *)
        for (i = 0; i < collength; i++) {
            if (cols[i] == "*")
                fillColl = "var colw" + i + " = " + pWidth 
                    + " - total - " + (margin[1] + margin[3]);
            else
                rule.push("var colw" + i + "; total += colw" 
                    + i + " = " + cols[i]);
        }
        if (fillColl)
            rule.push(fillColl);
        
        //Set column start position
        rule.push("var coll0 = " + margin[3]);
        for (i = 1; i < collength; i++)
            rule.push("var coll" + i + " = coll" + (i - 1) + " + colw" 
                + (i - 1) + " + " + this.padding);
        
        //Set row heights
        rule.push("total = 0");
        for (i = 0; i < rowheight.length; i++) {
            if (rowheight[i] == "*")
                fillRow = "var rowh" + i + " = " + pHeight 
                    + " - total - " + (margin[0] + margin[2]);
            else
                rule.push("var rowh" + i + "; total += rowh" 
                    + i + " = " + rowheight[i]);
        }
        if (fillRow)
            rule.push(fillRow);
        
        //Set column start position
        rule.push("var rowt0 = " + margin[3]);
        for (i = 1; i < rowheight.length; i++)
            rule.push("var rowt" + i + " = rowt" + (i - 1) + " + rowh" 
                + (i - 1) + " + " + this.padding);
        
        //Set all cells
        for (c = 0, i = 0; i < nodes.length; i++) {
            cellInfo = nodes[i]
            col      = c % collength;
            row      = Math.floor(c / collength);
            c       += cellInfo.span; //no check on span overflow
            id       = cellInfo.id;
            
            rule.push(id + ".style.top    = rowt" 
                + row + " + " + cellInfo.m[0] + " + 'px'");
            rule.push(id + ".style.left   = coll" 
                + col + " + " + cellInfo.m[3] + " + 'px'");
            
            if (cellInfo.span && cellInfo.span > 1 && !cellInfo.width) {
                for (combCol = [], j = 0; j < cellInfo.span; j++)
                    combCol.push("colw" + (col + j - 1));
                
                rule.push(id + ".style.width = (" + combCol.join(" + ") 
                    + " - " + (cellInfo.m[1] + cellInfo.m[3]) 
                    + " - " + cellInfo.hordiff + ") + 'px'");
            }
            else
                rule.push(id + ".style.width = (" 
                    + (cellInfo.width || "colw" + col) + " - " 
                    + (cellInfo.m[1] + cellInfo.m[3]) + " - " 
                    + cellInfo.hordiff + ") + 'px'");

            rule.push(id + ".style.height = (" 
                + (cellInfo.height || "rowh" + row) + " - " 
                + (cellInfo.m[0] + cellInfo.m[2]) + " - " 
                + cellInfo.verdiff + ") + 'px'");
        }
        
        //rule.join("\n"), true);
        jpf.layoutServer.setRules(this.oExt, "grid", (rule.length 
            ? "try{" + rule.join(";}catch(e){};try{") + ";}catch(e){};" 
            : ""), true);
        
        //Set size of grid if necesary here...
    }
    
    this.draw = function(){
        this.oExt = this.pHtmlNode.appendChild(document.createElement("div"));
        this.oInt = this.oExt;
        
        if (!this.oExt.getAttribute("id")) 
            jpf.setUniqueHtmlId(this.oExt);

        id = jpf.hasHtmlIdsInJs 
            ? this.oExt.getAttribute("id")
            : "document.getElementById('" + this.oExt.getAttribute("id") + "')";
        
        this.oExt.style.height = "80%"
        this.oExt.style.width = "100%"
        this.oExt.style.top = 0;
    }
    
    this.__loadJML = function(x){
        jpf.JmlParser.parseChildren(x, this.oInt, this, true);
        
        this.__updateGrid();
    }
});

// #endif
