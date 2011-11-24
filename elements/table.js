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
// #ifdef __AMLTABLE || __INC_ALL

/**
 * Any child element of this element is placed in a table. The size of the 
 * columns and rows of the table can be set by attributes. Child elements can
 * span multiple columns. Using '*' as a size indicator will use the remaining
 * size for that column or row, when the table's size is set.
 * Example:
 * This example shows a window with a table and two buttons that change the 
 * orientation of the table runtime. The textarea and it's label have a span set
 * to '*'. This means they will span the entire width of all columns, no matter
 * how many columns there are.
 * <code>
 *  <a:window visible="true" width="500" height="400">
 *      <a:table id="tableTest" 
 *        columns = "80, *"
 *        edge    = "10 10 10 10"
 *        padding = "5"
 *        bottom  = "35"
 *        top     = "0">
 *          <a:label>Name</a:label>
 *          <a:textbox />
 *          <a:label>Address</a:label>
 *          <a:textarea height="50" />
 *          <a:label>Country</a:label>
 *          <a:dropdown />
 *          
 *          <a:label span="*">Message</a:label>
 *          <a:textarea id="txtMessage" 
 *            height = "*" 
 *            span   = "*" />
 *      </a:table>
 *      
 *      <a:button 
 *        caption = "Two Columns"
 *        bottom  = "10"
 *        left    = "10"
 *        onclick = "tableTest.setAttribute('columns', '80, *');"/>
 *              
 *      <a:button 
 *        bottom  = "10"
 *        left    = "125"
 *        caption = "Four Columns"
 *        onclick = "tableTest.setAttribute('columns', '60, 120, 60, *');"/>
 *  </a:window>
 * </code>
 * Remarks:
 * This is one of three positioning methods.
 * See {@link baseclass.alignment}
 * See {@link baseclass.anchoring}
 *
 * @define table
 * @allowchild {elements}, {anyaml}
 * @addnode elements
 * @constructor
 *
 * @author      Ruben Daniels (ruben AT ajax DOT org)
 * @version     %I%, %G%
 * @since       1.0
 */
apf.table = function(struct, tagName){
    this.$init(tagName || "table", apf.NODE_VISIBLE, struct);
};

(function(){
    /**** Properties and Attributes ****/
    
    this.$focussable = false;
    this.$useLateDom = true; 
    this.$layout     = true;
    
    this.columns    = null;//"150,200";
    this.padding    = 2;
    this.$edge      = [5, 5, 5, 5];
    this.cellheight = 19;
    
    /**
     * @attribute {String} columns      a comma seperated list of column sizes. A column size can be specified in a number (size in pixels) or using a number and a % sign to indicate a percentage. A '*' indicates the column spans the rest space. There can be only one '*' in the column string.
     * Example:
     * <code>
     *  <a:table columns="150, *, 20%" />
     * </code>
     * @attribute {String} padding      the space between each element. Defaults to 2.
     * @attribute {String} edge         the space between the container and the elements, space seperated in pixels for each side. Similar to css in the sequence top right bottom left. Defaults to "5 5 5 5".
     * Example:
     * <code>
     *  <a:table edge="10 10 40 10" />
     * </code>
     */
    this.$supportedProperties.push("columns", "padding", "edge", 
        "cellheight", "span");
    
    this.$propHandlers["columns"] = function(value){
        if (!value.match(/^((?:\d+\%?|\*)\s*(?:,\s*|\s*$))+$/)) {
            //#ifdef __DEBUG
            apf.console.warn("Invalid column string found for table: " + value);
            //#endif
            return;
        }
        
        var col, colsize = this.$columns = value.splitSafe(",");

        var total = 0, cols = this.$table.getElementsByTagName("col");
        if (cols.length) {
            for (var sz, i = 0, l = Math.min(cols.length, colsize.length); i < l; i++) {
                cols[i].style.width = (sz = colsize[i]).indexOf("%") > -1 ? sz : sz + "px";
                total += parseInt(sz);
            }
        }
        
        var start = cols.length - colsize.length;
        if (start > 0) {
            for (var i = cols.length - start; i < cols.length; i++) {
                cols[i].parentNode.removeChild(cols[i]);
            }
        }
        else if (start < 0) {
            for (var i = colsize.length + start; i < colsize.length; i++) {
                col = this.$table.appendChild(document.createElement("col"));
                col.style.width = (sz = colsize[i]).indexOf("%") > -1 ? sz : sz + "px";
                col.setAttribute("valign", "top");
                total += parseInt(sz);
            }
        }

        this.$table.style.width = String(value).indexOf("%") > -1 
            ? "auto" 
            : (total + ((colsize.length - 1) * this.padding) 
                + this.$edge[0] + this.$edge[2]) + "px";

        var cells = this.$tbody.firstChild.getElementsByTagName("td");
        for (var i = cells.length - 1; i >= 0; i--)
            cells[i].parentNode.removeChild(cells[i]);
        
        for (var sz, c, i = 0; i < colsize.length; i++) {
            c = this.$tbody.firstChild.appendChild(document.createElement("td"));
            c.style.width = (sz = colsize[i]).indexOf("%") > -1 ? sz : sz + "px";
            
            /*if (colsize[i].indexOf("%") > -1)
                c.appendChild(document.createElement("div")).style.width = "50px";*/
        }
        
        if (start && this.$amlLoaded)
            visibleHandler({sync: true, parentNode: this});
        
        this.$resize();
    }

    this.$propHandlers["padding"] = function(value){
        if (!this.$columns) return;
        var cells = this.$table.getElementsByTagName("td");
        var lastCol, lastRow, cell, lRow = this.$tbody.lastChild;
        for (var i = this.$columns.length, l = cells.length; i < l; i++) {
            lastCol = (cell = cells[i]).parentNode.lastChild == cell;
            lastRow = cell.parentNode == lRow;
            cell.style.padding = "0px " + (lastCol ? 0 : value) + "px " + (lastRow ? 0 : value) + "px 0px";
        }
        this.$resize();
    }
    
    this.$propHandlers["edge"] = function(value){
        this.$table.style.padding = (this.$edge = apf.getBox(value)).join("px ") + "px";
        this.$resize();
    }
    
    function visibleHandler(e){
        var table = e.parentNode || this.parentNode;
        if (e.sync || e.value && !this.$altExt || !e.value && this.$altExt) {
            var nodes = table.childNodes;

            var cells = apf.getArrayFromNodelist(table.$tbody.getElementsByTagName("td"));
            var rows  = table.$tbody.getElementsByTagName("tr");
            var empty = [], row = 1, cs, rs, collen = table.$columns.length;
            var z = table.$columns.length, lastCol;
            for (var node, td, last, l = nodes.length, i = 0; i < l; i++) {
                if ((node = nodes[i]).visible === false)
                    continue;

                td = node.$altExt = last = cells[z++];
                if (!td) break;
                    //td = node.$altExt = last = document.createElement("td");
                
                if (!rows[row])
                    table.$tbody.appendChild(document.createElement("tr"));
                
                rows[row].appendChild(td);
                td.appendChild(node.$ext);
                td.setAttribute("colspan", cs = Math.min(collen - (empty[0] || 0), parseInt(node.colspan || node.span || 1)));
                td.setAttribute("rowspan", rs = parseInt(node.rowspan || 1));
                
                //@todo this is wrong it should be cs * rs
                if (!empty[0])
                    empty[0] = 0;
                empty[0] += cs;

                if (rs > 1) {
                    for (var k = 1; k < rs; k++) {
                        if (!empty[k])
                            empty[k] = 0;
                        empty[k] += cs;
                    }
                }

                if (empty[0] >= collen) {
                    lastCol = true;
                    empty.shift();
                    row++;
                }
                else lastCol = false;

                td.style.padding = "0px " + (lastCol ? 0 : table.padding) 
                    + "px " + (i == l - 1 ? 0 : table.padding) + "px 0px";
            }
            
            //Fix padding of last row
            var lastCells = rows[rows.length - 1].getElementsByTagName("td");
            for (i = 0, il = lastCells.length; i < il; i++) {
                lastCells[i].style.padding = "0 " 
                    + (i == il - 1 ? 0 : table.padding) + "px 0 0"
            } 
            
            for (;z < cells.length; z++)
                cells[z].parentNode.removeChild(cells[z]);
            
            if (e.sync) return;

            if (e.value)
                table.$addTd(nodes[l - 1]); //what if it's not visible
            else {
                //last.parentNode.removeChild(last);
                this.$altExt = null;
            }
        }
    }
    
    this.$addTd = function(amlNode){
        var cells = this.$table.getElementsByTagName("td");
        var total = 0, collen = this.$columns.length;
        for (var cell, i = 0; i < cells.length; i++) {
            total +=  Math.min(collen, 
                (parseInt((cell = cells[i]).getAttribute("colspan") || 1) 
                * parseInt(cell.getAttribute("rowspan") || 1)));
        }
        
        if (total % collen == 0) { //New Row
            var row = this.$tbody.appendChild(document.createElement("tr"));
        }
        else
            row = cells[cells.length - 1].parentNode;

        //Add a new cell in the last row
        var cel = row.appendChild(document.createElement("td"));
        cel.style.position = "relative";
        
        if (amlNode.colspan || amlNode.span)
            cel.setAttribute("colspan", amlNode.colspan || amlNode.span);
        if (amlNode.rowspan)
            cel.setAttribute("rowspan", amlNode.rowspan);

        cel.appendChild(amlNode.$ext);

        amlNode.$altExt = cel;
    }
    
    var propHandlers = {
        "width" : function(value){
            this.$ext.style.width = "";/*value 
                ? Math.max(0, value - apf.getWidthDiff(this.$ext)) + "px"
                : "";*/
        },
        
        "height" : function(value){
            this.$ext.style.height = value 
                ? Math.max(0, value - apf.getHeightDiff(this.$ext)) + "px"
                : "";
            this.parentNode.$resize();
        },
        
        "margin" : function(value){
            this.$ext.style.margin = apf.getBox(value).join("px ") + "px";
            this.parentNode.$resize();
        },
        
        "colspan" : function(value){
            if (!value)
                this.$altExt.removeAttribute("colspan");
            else
                this.$altExt.setAttribute("colspan", value);

            visibleHandler.call(this, {sync: true});
            this.parentNode.$resize();
        },
        
        "rowspan" : function(value){
            if (!value)
                this.$altExt.removeAttribute("rowspan");
            else
                this.$altExt.setAttribute("rowspan", value);
        
            visibleHandler.call(this, {sync: true});
            this.parentNode.$resize();
        },
        
        "valign" : function(value){
            this.$altExt.valign = value;
        },
        
        "align" : function(value){
            if ("left|right".indexOf(value) == -1)
                return;
            
            this.$altExt.align = value;
        }
    }
    propHandlers.span = propHandlers.colspan;
    
    //@todo move this to enableTable, disableTable
    this.register = function(amlNode){
        if (amlNode.$altExt) //@todo hack, need to rearch layouting
            return;

        amlNode.$propHandlers["left"]   = 
        amlNode.$propHandlers["top"]    = 
        amlNode.$propHandlers["right"]  = 
        amlNode.$propHandlers["bottom"] = apf.K;
        
        for (var prop in propHandlers) {
            amlNode.$propHandlers[prop] = propHandlers[prop];
        }
        
        amlNode.addEventListener("prop.visible", visibleHandler);

        this.$addTd(amlNode);
        
        this.$noResize = true;
        
        if (amlNode.margin)
            propHandlers.margin.call(amlNode, amlNode.margin);
        
        //Why was this commented out?
        if (amlNode.$ext.tagName == "INPUT") {
            //amlNode.$ext.style.width = "100%";
        }
        else
            amlNode.$ext.style.width = "auto";
        
        if (this.lastChild == amlNode)
            this.$propHandlers["padding"].call(this, this.padding);
        
        delete this.$noResize;
    }
    
    this.unregister = function(amlNode){
        amlNode.$propHandlers["left"]   = 
        amlNode.$propHandlers["top"]    = 
        amlNode.$propHandlers["right"]  = 
        amlNode.$propHandlers["bottom"] = null;
        
        for (var prop in propHandlers) {
            delete amlNode.$propHandlers[prop];
        }
        
        amlNode.removeEventListener("prop.visible", visibleHandler);
        visibleHandler.call(amlNode, {value: false}); //maybe parent is already reset here?
        
        if (amlNode.margin)
            amlNode.$ext.style.margin = "";
        
        if (amlNode.width)
            amlNode.$ext.style.width = "";
    }
    /*
         this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        this.register(this.parentNode);
    });
    */
    
    /**** DOM Hooks ****/
    
    this.addEventListener("DOMNodeRemoved", function(e){
        if (e.$doOnlyAdmin || e.currentTarget == this)
            return;

        if (e.relatedNode == this){
            this.unregister(e.currentTarget);
            //e.currentTarget.$setLayout();
        }
    });

    this.addEventListener("DOMNodeInserted", function(e){
        if (e.currentTarget == this || e.currentTarget.nodeType != 1)
            return;

        if (e.relatedNode == this) {
            if (e.$isMoveWithinParent) {
                visibleHandler.call(e.currentTarget, {sync: true}); 
            }
            else {
                e.currentTarget.$setLayout("table");
                if (e.currentTarget.nextSibling)
                    visibleHandler.call(e.currentTarget, {sync: true});
            }
        }
    });
    
    this.$draw = function(){
        this.$ext = apf.insertHtmlNode(null, this.$pHtmlNode, null, 
            "<div><table cellSpacing='0' cellPadding='0'><tbody><tr class='first'></tr></tbody></table></div>");
        this.$table = this.$ext.firstChild;
        this.$tbody = this.$table.firstChild;
        this.$ext.className = "table " + (this.getAttribute("class") || "");
        //this.$ext.style.overflow = "hidden";
        this.$int = this.$ext;
        this.$ext.host = this;

        if (this.getAttribute("class")) 
            apf.setStyleClass(this.$ext, this.getAttribute("class"));
        
        this.addEventListener("resize", this.$resize);
        this.$originalMin = [this.minwidth || 0,  this.minheight || 0];
    };
    
    //@todo implement percentage by using fixed and add functionality here
    this.$resize = function(){
        if (!this.$amlLoaded || this.$noResize)
            return;
        
        if (this.$table.offsetWidth >= this.$ext.offsetWidth)
            this.$ext.style.minWidth = (this.minwidth = Math.max(0, this.$table.offsetWidth 
                - apf.getWidthDiff(this.$ext))) + "px";
        else {
            this.$ext.style.minWidth = "";
            this.minwidth = this.$originalMin[0];
        }

        if (this.$table.offsetHeight >= this.$ext.offsetHeight)
            this.$ext.style.minHeight = (this.minheight = Math.max(0, this.$table.offsetHeight 
                - apf.getHeightDiff(this.$ext))) + "px";
        else {
            this.$ext.style.minHeight = "";
            this.minheight = this.$originalMin[1];
        }
    }
    
    this.$loadAml = function(x){
        this.$amlLoaded = false; //@todo hack

        if (!this.$columns)
            this.$propHandlers.columns.call(this, this.columns = "150, 200");
        this.$amlLoaded = true; //@todo hack
    };
}).call(apf.table.prototype = new apf.GuiElement());

apf.aml.setElement("table", apf.table);
// #endif
