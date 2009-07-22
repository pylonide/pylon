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
// #ifdef __JGRID || __JGRID || __INC_ALL

/**
 * Any child element of this element is placed in a grid. The size of the 
 * columns and rows of the grid can be set by attributes. Child elements can
 * span multiple columns. Using '*' as a size indicator will use the remaining
 * size for that column or row, when the grid's size is set.
 * Example:
 * This example shows a window with a grid and two buttons that change the 
 * orientation of the grid runtime. The textarea and it's label have a span set
 * to '*'. This means they will span the entire width of all columns, no matter
 * how many columns there are.
 * <code>
 *  <a:window>
 *      <a:grid id="gridTest" 
 *        columns = "80, *"
 *        margin  = "10 10 10 10"
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
 *              height = "*" 
 *              span   = "*" />
 *      </a:grid>
 *      
 *      <a:button 
 *          caption = "Two Columns"
 *          onclick = "gridTest.setAttribute('columns', '80, *');"/>
 *          
 *      <a:button 
 *          caption = "Four Columns"
 *          onclick = "gridTest.setAttribute('columns', '60, 120, 60, *');"/>
 *  </a:window>
 * </code>
 * Remarks:
 * This is one of three positioning methods.
 * See {@link baseclass.alignment}
 * See {@link baseclass.anchoring}
 *
 * @define grid
 * @allowchild {elements}, {anyaml}
 * @addnode elements
 * @constructor
 *
 * @author      Ruben Daniels (ruben AT javeline DOT com)
 * @version     %I%, %G%
 * @since       1.0
 */
apf.grid = apf.component(apf.NODE_VISIBLE, function(){
    var id;
    var update  = false;
    var l       = apf.layout;
    var _self   = this;
    var updater = {
        $updateLayout : function(){
            _self.$updateGrid();
        }
    };
    
    /**** Properties and Attributes ****/
    
    this.canHaveChildren = true;
    this.$focussable     = false;
    
    this.columns    = "100,*";
    this.padding    = 2;
    this.margin     = "5 5 5 5";
    this.cellheight = 19;
    
    /**
     * @attribute {String} columns      a comma seperated list of column sizes. A column size can be specified in a number (size in pixels) or using a number and a % sign to indicate a percentage. A '*' indicates the column spans the rest space. There can be only one '*' in the column string.
     * Example:
     * <code>
     *  <a:grid columns="150, *, 20%" />
     * </code>
     * @attribute {String} padding      the space between each element. Defaults to 2.
     * @attribute {String} margin       the space between the container and the elements, space seperated in pixels for each side. Similar to css in the sequence top right bottom left. Defaults to "5 5 5 5".
     * Example:
     * <code>
     *  <a:grid margin="10 10 40 10" />
     * </code>
     * @attribute {String} cellheight   the default height of each element. This can be overriden by setting a height on an element. The height will always size all elements of the same row. Defaults to 19.
     */
    this.$supportedProperties.push("columns", "padding", "margin", 
        "cellheight", "span");
    
    var amlHideShow                  =
    this.$updateTrigger              =
    this.$propHandlers["columns"]    =
    this.$propHandlers["padding"]    =
    this.$propHandlers["margin"]     =
    this.$propHandlers["cellheight"] = function(value){
        if (!update && apf.loaded)
            l.queue(_self.oExt, updater);
        update = true;
    };
    
    /**** DOM Hooks ****/
    
    this.$domHandlers["removechild"].push(function(amlNode, doOnlyAdmin){
        if (doOnlyAdmin)
            return;
        
        amlNode.$propHandlers["width"]  = 
        amlNode.$propHandlers["height"] = 
        amlNode.$propHandlers["span"]   = null;
        
        amlNode.$hide = amlNode.$_hide;
        amlNode.$show = amlNode.$_show;
        
        /* Removing is probably not a good idea, because we're not sure if the node is reparented
        //#ifdef __WITH_ALIGNMENT
        if (amlNode.hasFeature(__ALIGNMENT__) && amlNode.aData)
            amlNode.enableAlignment();
        //#endif
        */
        
        //#ifdef __WITH_ANCHORING
        if (amlNode.hasFeature(__ANCHORING__) && amlNode.$hasAnchorRules())
            amlNode.$setAnchoringEnabled();
        //#endif
        
        l.queue(this.oExt, updater);
        update = true;
    });
    
    this.$domHandlers["insert"].push(function(amlNode, bNode, withinParent){
        if (withinParent)
            return;
        
        //#ifdef __WITH_ALIGNMENT
        if (amlNode.hasFeature(__ALIGNMENT__) && amlNode.aData)
            amlNode.disableAlignment();
        //#endif
        
        //#ifdef __WITH_ANCHORING
        else if (amlNode.hasFeature(__ANCHORING__) && amlNode.$hasAnchorRules())
            amlNode.disableAnchoring();
        //#endif
        
        amlNode.$propHandlers["width"]  = 
        amlNode.$propHandlers["height"] = 
        amlNode.$propHandlers["span"]   = this.$updateTrigger;
        
        amlNode.$_hide = amlNode.$hide;
        amlNode.$_show = amlNode.$show;
        amlNode.$hide = amlHideShow;
        amlNode.$show = amlHideShow;
        
        l.queue(this.oExt, updater);
        update = true;
    });
    
    //#ifdef __WITH_PROPERTY_WATCH
    function propChange(name, old, value){
        if (update && apf.isTrue(value) && _self.oExt.offsetHeight) {
            _self.$updateGrid();
            apf.layout.activateRules(_self.oExt);
            
            var p = _self;
            while (p) {
                p.unwatch("visible", propChange);
                p = p.parentNode;
            }
        }
    };
    //#endif
    
    /**
     * @macro
     */
    function setPercentage(expr, value){
        return typeof expr == "string" 
            ? expr.replace(apf.percentageMatch, "((" + value + " * $1)/100)")
            : expr;
    }
    
    this.$updateGrid = function(){
        if (!update)
            return;

        //@todo when not visible make all property settings rule based
        //#ifdef __WITH_PROPERTY_WATCH
        if (!this.oExt.offsetHeight) {
            this.watch("visible", propChange);
            
            var p = this.parentNode;
            while(p) {
                p.watch("visible", propChange);
                p = p.parentNode;
            }
            
            return;
        }
        //#endif
        
        var pWidth  = "pWidth";
        var pHeight = "pHeight";

        this.cellheight = parseInt(this.cellheight);
        var cols        = setPercentage(this.columns, pWidth).split(/\s*,\s*/);
        var collength   = cols.length;
        var margin      = apf.getBox(this.margin);
        var rowheight   = [];
        this.padding    = parseInt(this.padding);
        
        var oCols   = [];
        var col, row, oExt, diff, j, m, cellInfo;
        this.ids = [this.oExt];
        var span, jNode, jNodes = this.childNodes;
        for (var nodes = [], c = 0, i = 0, l = jNodes.length; i < l; i++) {
            jNode = jNodes[i];
            if (jNode.nodeFunc != apf.NODE_VISIBLE || !jNode.visible)
                continue;
            
            //#ifdef __WITH_ANCHORING
            if (jNode.hasFeature(__ANCHORING__))
                jNode.disableAnchoring();
            //#endif
            
            m = apf.getBox(jNode.getAttribute("margin"));
            //for (j = 0; j < 4; j++)
                //m[j] += this.padding;

            diff = apf.getDiff(jNode.oExt);
            oExt = jNode.oExt;
            if (!oExt.getAttribute("id")) 
                apf.setUniqueHtmlId(oExt);
            if (apf.isIE)
                oExt.style.position = "absolute"; //Expensive
            
            span = jNode.getAttribute("span");
            
            cellInfo = {
                span    : span == "*" ? collength : parseInt(span) || 1,
                m       : m,
                height  : setPercentage(jNode.height, pHeight),
                width   : jNode.width,
                oHtml   : oExt,
                hordiff : diff[0],
                verdiff : diff[1],
                id      : (apf.hasHtmlIdsInJs 
                    ? oExt.getAttribute("id")
                    : "document.getElementById('" + oExt.getAttribute("id") + "')")
                //"ids[" + (this.ids.push(oExt) - 1) + "]"
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
                    parseFloat(cellInfo.height || this.cellheight) 
                    + cellInfo.m[0] + cellInfo.m[2]);
            }
        }
        var dt = new Date().getTime();
        
        if (nodes.length == 0) 
            return;

        var total, combCol, fillCol = null, fillRow = null;
        var rule = [
            "var ids = apf.all[" + this.uniqueId + "].ids",
            "var total = 0, pHeight = ids[0].offsetHeight - " 
                + ((rowheight.length - 1) * this.padding + margin[0] + margin[2]),
            "var pWidth  = ids[0].offsetWidth - " 
                + ((collength - 1) * this.padding + margin[1] + margin[3]) 
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
                    + " - total - " + total);
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
        var needcalc = false;
        for (total = 0, i = 0; i < rowheight.length; i++) {
            if (rowheight[i] == "*")
                fillRow = i;
            else {
                if (parseFloat(rowheight[i]) != rowheight[i]) {
                    needcalc = true;
                    rule.push("var rowh" + i + "; total += rowh" 
                        + i + " = " + rowheight[i]);
                    rowheight[i] = "rowh" + i;
                }
                else
                    total += rowheight[i] = parseFloat(rowheight[i]);
            }
        }
        if (fillRow !== null) {
            needcalc = true;
            rule.push("var rowh" + fillRow + " = " + pHeight 
                    + " - total - " + total);
            rowheight[fillRow] = "rowh" + fillRow;
        }
        
        if (!needcalc)
            this.oExt.style.height = (total + ((rowheight.length-1) * this.padding) + margin[0] + margin[2]) + "px";
        
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
                    if (typeof cols[col + j] == "number") {
                        cTotal += cols[col + j];
                    }
                    else {
                        combCol.push("colw" + (col + j));
                        cTotal -= 1000000;
                    }
                    
                    //if (j != cellInfo.span - 1)
                        //cTotal += this.padding;
                }

                var spanPadding = (cellInfo.span - 1) * this.padding;
                if (cTotal > 0) {
                    cellInfo.oHtml.style.width = (cTotal 
                        + spanPadding - (cellInfo.m[1] + cellInfo.m[3] 
                        + cellInfo.hordiff)) + "px";
                }
                else {
                    if (cTotal > -1000000)
                        combCol.push(cTotal + 1000000);
                    rule.push(id + ".style.width = (" + combCol.join(" + ") 
                        + " + " + spanPadding + " - " + (cellInfo.m[1] + cellInfo.m[3] 
                        + cellInfo.hordiff) + ") + 'px'");
                }
            }
            else {
                if (parseFloat(cellInfo.width) == cellInfo.width
                  || typeof cols[col] == "number")
                    cellInfo.oHtml.style.width = ((cellInfo.width || cols[col]) 
                        - (cellInfo.m[1] + cellInfo.m[3] + cellInfo.hordiff)) + "px";
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
        apf.layout.setRules(this.oExt, "grid", (rule.length 
            ? "try{" + rule.join(";}catch(e){};\ntry{") + ";}catch(e){};" 
            : ""), true);

        //Set size of grid if necesary here...
        update = false;
    };
    
    this.$draw = function(){
        this.oExt = this.pHtmlNode.appendChild(document.createElement("div"));
        this.oExt.className = "grid " + (this.$aml.getAttributeNode("class") || "");
        this.oInt = this.oExt;
        this.oExt.host = this;
        
        if (!this.oExt.getAttribute("id")) 
            apf.setUniqueHtmlId(this.oExt);

        id = apf.hasHtmlIdsInJs 
            ? this.oExt.getAttribute("id")
            : "document.getElementById('" + this.oExt.getAttribute("id") + "')";
        
        //this.oExt.style.height = "80%"
        //this.oExt.style.top       = 0;
        this.oExt.style.position  = "relative";
        this.oExt.style.minHeight = "10px";
        
        if (this.$aml.getAttribute("class")) 
            apf.setStyleClass(this.oExt, this.$aml.getAttribute("class"));

        if (!apf.isIE && !apf.grid.$initedcss) {
            apf.importCssString(document, ".grid>*{position:absolute}");
            apf.grid.$initedcss = true;
        }
    };
    
    this.$loadAml = function(x){
        apf.AmlParser.parseChildren(x, this.oInt, this, true);

        if (!this.width && (apf.getStyle(this.oExt, "position") == "absolute"
          || this.left || this.top || this.right || this.bottom || this.anchors))
            this.oExt.style.width  = "100%"
        
        var amlNode, nodes = this.childNodes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            amlNode = nodes[i];
            amlNode.$_hide = amlNode.$hide;
            amlNode.$_show = amlNode.$show;
            amlNode.$hide = amlHideShow;
            amlNode.$show = amlHideShow;
        }
        
        this.$updateGrid();
    };
});

// #endif
