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

//#ifdef __WITH_GRID
jpf.gridPlace = function(jmlNode){
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
            
            //var diff = jpf.getDiff(nodes[iNode]);
            
            if (jNodes[iNode].jml.getAttribute("width") == null) // Only if not directly specified.
                nodes[iNode].style.width = Math.max(colWidths[x]
                    - (jpf.getWidthDiff(nodes[iNode]) || 0), 0) + "px";
            
            //nColumns != 1 || 
            maxHeight = Math.max(
                (jNodes[iNode].jml.getAttribute("autosize") != "true" && !jNodes[iNode].nonSizingHeight) ? maxHeight : 0,
                nodes[iNode].offsetHeight,
                (jpf.getStyle(nodes[iNode], "overflow") == "visible") ? nodes[iNode].scrollHeight : 0
            );
            //maxHeight = Math.max(columns.length != 1 || jNodes[iNode].jml.getAttribute("autosize") != "true" ? maxHeight : 0, nodes[iNode].offsetHeight, jpf.getStyle(nodes[iNode], "overflow") == "visible" ? nodes[iNode].scrollHeight : 0);
            
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
                    (maxHeight - (jpf.getHeightDiff(h) || 0))) + "px";
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