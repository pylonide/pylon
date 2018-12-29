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

// #ifdef __ENABLE_EDITOR_TABLES || __INC_ALL

apf.LiveEdit.plugin("table", function() {
    this.name       = "table",
    this.icon       = "table",
    this.type       = apf.TOOLBARITEM,
    this.subType    = apf.TOOLBARPANEL,
    this.hook       = "ontoolbar",
    this.keyBinding = "ctrl+alt+shift+t",
    this.state      = apf.OFF;

    var panelBody, oTableCont, oTableSel, oTable, oStatus, oTablePos,
        iCurrentX   = 0,
        iCurrentY   = 0,
        _self       = this,
        TABLE_SIZE  = 164,
        CELL_SIZE   = 23,
        GUTTER_SIZE = 4,
        BUTTON_SIZE = 20;

    this.init = function(editor, btn) {
        this.buttonNode.className = this.buttonNode.className + " dropdown_small";
        var oArrow = this.buttonNode.insertBefore(document.createElement("span"),
            this.buttonNode.getElementsByTagName("div")[0]);
        oArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            oDoc = editor.useIframe ? document : editor.$activeDocument;
            apf.popup.setContent(this.$uniqueId, this.createPanelBody());
        }
        else
            resetTableMorph();

        //this.storeSelection();

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode);
        window.setTimeout(function() {
            panelBody.style.width  = (oTableCont.offsetWidth + (GUTTER_SIZE * 2)) + "px",
            panelBody.style.height = (oTableCont.offsetWidth + BUTTON_SIZE) + "px",
            oTablePos = apf.getAbsolutePosition(oTable);
        });
    };

    this.queryState = function(editor) {
        return this.state;
    };

    this.submit = function(oSize) {
        apf.popup.forceHide();

        if (oSize[0] < 0 || oSize[1] < 0) return;

        var k, l,
            i       = 0,
            j       = oSize[0],
            oEditor = this.editor,
            aOut    = ['<table border="0" width="50%">'];
        for (; i < j; i++) {
            aOut.push("<tr>");
            for (k = 0, l = oSize[1]; k < l; k++)
                aOut.push("<td>", (apf.isIE ? "" : '&nbsp;<br _apf_placeholder="1" />'),"</td>");
            aOut.push("</tr>")
        }
        aOut.push("</table>")

        oEditor.$insertHtml(aOut.join(""), true);
        oEditor.$selection.collapse(false);
    };

    var bMorphing = false, oMorphCurrent, iMorphXCount, iMorphYCount;
    function mouseDown(e) {
        bMorphing     = true;
        oMorphCurrent = e.client;
        iMorphXCount  = iMorphYCount = 0;
        //apf.plane.show(panelBody, true);
        document.onmousemove = function(e) {
            if (!bMorphing) return;
            e = new apf.AbstractEvent(e || window.event);
            // only morph the table when the mouse reaches beyond the table
            if (e.client.x  > oTablePos[0] + oTable.offsetWidth
              || e.client.y > oTablePos[1] + oTable.offsetHeight)
                morphTable(e);
            e.stop();
            return false;
        }
        document.onmouseup = function(e) {
            e = new apf.AbstractEvent(e || window.event);
            mouseUp.call(_self, e);
            e.stop();
            return false;
        }
        //e.stop();
        return false;
    }

    function mouseUp(e) {
        if (bMorphing) {
            bMorphing     = false,
            oMorphCurrent = document.onmousemove = document.onmouseup = null,
            iMorphXCount  = iMorphYCount = 0;
            //apf.plane.hide();
        }
        mouseOver.call(this, e);
        if (iCurrentX > 0 && iCurrentY > 0)
            this.submit([iCurrentY, iCurrentX]);
        e.stop();
        return false;
    }

    function morphTable(e) {
        oMorphCurrent = e.client;
        iMorphXCount  = (Math.floor((oMorphCurrent.x - oTablePos[0]) / CELL_SIZE) * CELL_SIZE) + CELL_SIZE;
        if (iMorphXCount > oTable.offsetWidth) {
            panelBody.style.width  = (iMorphXCount + (BUTTON_SIZE / 2)) + "px",
            oTableCont.style.width = (iMorphXCount + GUTTER_SIZE) + "px",
            oTable.style.width     = (iMorphXCount) + "px",
            oTableSel.style.width  = (iMorphXCount) + "px";
        }
        iMorphYCount = (Math.floor((oMorphCurrent.y - oTablePos[1]) / CELL_SIZE) * CELL_SIZE) + CELL_SIZE;
        if (iMorphYCount > oTable.offsetHeight) {
            panelBody.style.height  = (iMorphYCount + BUTTON_SIZE) + "px",
            oTableCont.style.height = (iMorphYCount + GUTTER_SIZE) + "px",
            oTable.style.height     = (iMorphYCount) + "px",
            oTableSel.style.height  = (iMorphYCount) + "px";
        }
    }

    function resetTableMorph() {
        oTableCont.style.width = oTableCont.style.height = TABLE_SIZE + "px",
        oTableSel.style.width  = oTableSel.style.height  = "0px",
        oTable.style.width     = oTable.style.height     = TABLE_SIZE - GUTTER_SIZE + "px";
    }

    var sCurrentCaption = "";

    function mouseOver(e) {
        if (typeof oTablePos == "undefined") return;
        iCurrentX = Math.ceil((e.page.x - oTablePos[0]) / CELL_SIZE);
        iCurrentY = Math.ceil((e.page.y - oTablePos[1]) / CELL_SIZE);
        if (iCurrentX > 0 && iCurrentY > 0) {
            oTableSel.style.width  = Math.min((iCurrentX * CELL_SIZE), oTable.offsetWidth)  + "px";
            oTableSel.style.height = Math.min((iCurrentY * CELL_SIZE), oTable.offsetHeight) + "px";
            var sCaption = iCurrentY + " x " + iCurrentX + " " 
                + _self.editor.$translate("table_noun");
            if (sCurrentCaption != sCaption)
                oStatus.innerHTML = sCurrentCaption = sCaption;
        }
        else
            iCurrentX = iCurrentY = 0;
    }

    function mouseOut(e) {
        if (bMorphing) return;
        oTableSel.style.width = oTableSel.style.height = "0px";
        iCurrentX = iCurrentY = 0;
        oStatus.innerHTML = sCurrentCaption = _self.editor.$translate("cancel");
    }

    function statusClick(e) {
        mouseOut.call(this, e);
        apf.popup.forceHide();
    }

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup editor_tablepopup";
        panelBody.style.display = "none";

        var idTableCont = "editor_" + this.$uniqueId + "_tablecont",
            idTableSel  = "editor_" + this.$uniqueId + "_tablesel",
            idTable     = "editor_" + this.$uniqueId + "_table",
            idStatus    = "editor_" + this.$uniqueId + "_table_status";
        panelBody.innerHTML =
           '<div id="' + idTableCont + '" class="editor_paneltable_cont">\
                <div id="' + idTableSel + '" class="editor_paneltable_sel"></div>\
                <div id="' + idTable + '" class="editor_paneltable"></div>\
            </div>\
            <div id="' + idStatus + '" class="editor_paneltablecancel">' 
                + this.editor.$translate("cancel") + '</div>';

        oTableCont = document.getElementById(idTableCont),
        oTableSel  = document.getElementById(idTableSel),
        oTable     = document.getElementById(idTable),
        oTable.onmousedown  = mouseDown.bindWithEvent(this, true),
        oTable.onmouseup    = mouseUp.bindWithEvent(this, true),
        oTable.onmousemove  = mouseOver.bindWithEvent(this, true),
        oTable.onmouseout   = mouseOut.bindWithEvent(this, true),
        oStatus = document.getElementById(idStatus),
        oStatus.onmousedown = statusClick.bindWithEvent(this, true),
        panelBody.onselectstart = function() { return false; },
        resetTableMorph();

        return panelBody;
    };

    this.destroy = function() {
        //oTableCont, oTableSel, oTable, oStatus, oTablePos, oDoc
        panelBody = oTableCont = oTableSel = oTable = oStatus = oTablePos
            = oDoc = null;
        delete panelBody,
        delete oTableCont,
        delete oTableSel,
        delete oTable,
        delete oStatus,
        delete oTablePos,
        delete oDoc;
    };
});

apf.LiveEdit.plugin("tablewizard", function() {
    this.name        = "tablewizard";
    this.icon        = "tablewizard";
    this.type        = apf.CONTEXTPANEL;
    this.hook        = "context";
    this.state       = apf.OFF;
    this.oTable      = null;
    this.oRow        = null;
    this.oCell       = null;

    var activeNode, oDoc, _self = this;

    this.execute = function(editor, e) {
        if (this.queryState(editor) != apf.ON)
            return;
        // get the active table, row and cell nodes:
        this.oTable = this.oRow = this.oCell = null;
        while (activeNode.tagName != "TABLE") {
            if (activeNode.tagName == "TD")
                this.oCell = activeNode;
            else if (activeNode.tagName == "TR")
                this.oRow = activeNode;
            activeNode = activeNode.parentNode;
        }
        this.oTable = activeNode;

        if (!this.editor)
            this.editor = editor;
        if (!apf.editor.oMenu)
            this.createContextMenu();
        if (!oDoc)
            oDoc = editor.useIframe ? document : editor.$activeDocument;
        apf.editor.oMenu.tablePlugin = this;

        var pos = apf.getAbsolutePosition(editor.iframe);
        if (!e.client)
            e = new apf.AbstractEvent(e);
        apf.editor.oMenu.display(e.client.x + pos[0], e.client.y + pos[1], true);

        e.stop();

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
        
        return false;
    };

    this.queryState = function(editor) {
        var oNode = editor.$selection.getSelectedNode();
        while (oNode.nodeType != 1 || oNode.tagName != "BODY") {
            if (oNode.tagName == "TABLE" || oNode.tagName == "TBODY"
              || oNode.tagName == "TR" || oNode.tagName == "TD") {
                activeNode = oNode;
                return apf.ON;
            }
            oNode = oNode.parentNode;
        }

        return apf.OFF;
    };

    function addRows(td_elm, tr_elm, rowspan) {
        // Add rows
        td_elm.rowSpan = 1;
        var trNext = nextElm(tr_elm, ["TR"]);
        for (var i = 1; i < rowspan && trNext; i++) {
            var newTD = oDoc.createElement("td");
            if (!apf.isIE)
                newTD.innerHTML = '<br mce_bogus="1"/>';
            if (apf.isIE)
                trNext.insertBefore(newTD, trNext.cells(td_elm.cellIndex));
            else
                trNext.insertBefore(newTD, trNext.cells[td_elm.cellIndex]);
            trNext = nextElm(trNext, ["TR"]);
        }
    }

    function getColRowSpan(td) {
        var colspan = td.getAttribute("colspan") || "";
        var rowspan = td.getAttribute("rowspan") || "";

        return {
            colspan : colspan == "" ? 1 : parseInt(colspan),
            rowspan : rowspan == "" ? 1 : parseInt(rowspan)
        };
    }

    function getTableGrid(table) {
        var grid = [], rows = table.rows, x, y, td, sd, xstart, x2, y2;

        for (y = 0; y < rows.length; y++) {
            for (x = 0; x < rows[y].cells.length; x++) {
                td = rows[y].cells[x];
                sd = getColRowSpan(td);

                // All ready filled
                for (xstart = x; grid[y] && grid[y][xstart]; xstart++){}

                // Fill box
                for (y2 = y; y2 < y + sd.rowspan; y2++) {
                    if (!grid[y2])
                        grid[y2] = [];

                    for (x2 = xstart; x2 < xstart + sd.colspan; x2++)
                        grid[y2][x2] = td;
                }
            }
        }

        return grid;
    }

    function getCellPos(grid, td) {
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[i].length; j++) {
                if (grid[i][j] == td)
                    return {cellindex : j, rowindex : i};
            }
        }

        return null;
    }

    function getCell(grid, row, col) {
        if (grid[row] && grid[row][col])
            return grid[row][col];
        return null;
    }

    function nextElm(node, names) {
        while ((node = node.nextSibling) != null) {
            for (var i = 0; i < names.length; i++) {
                if (node.nodeName.toLowerCase() == names[i].toLowerCase())
                    return node;
            }
        }
        return null;
    }

    this.createContextMenu = function(){
        var idMenu = "editor_" + this.$uniqueId + "_menu";
        this.appendAmlNode('\
            <a:menu xmlns:a="' + apf.ns.aml + '" id="' + idMenu + '">\
                <a:item value="rowbefore">Insert row before</a:item>\
                <a:item value="rowbefore">Insert row after</a:item>\
                <a:item value="deleterow">Delete row</a:item>\
                <a:divider />\
                <a:item value="colbefore">Insert column before</a:item>\
                <a:item value="colafter">Insert column after</a:item>\
                <a:item value="deletecol">Delete column</a:item>\
                <a:divider />\
                <a:item value="splitcells">Split merged table cells</a:item>\
                <a:item value="mergecells">Merge table cells</a:item>\
            </a:menu>', document.body);
        //nodes disabled:
        // <a:divider />\
        // <a:item value="rowprops">Table row properties</a:item>\
        // <a:item value="colprops">Table column properties</a:item>\
        var oMenu = apf.editor.oMenu = self[idMenu];
        oMenu.addEventListener("onitemclick", function(e){
            if (this.tablePlugin != _self)
                return;

            var oRow, i, j,
                idx     = 0,
                oEditor = _self.editor;

            if (_self.oCell) {
                for (i = 0, j = _self.oRow.cells.length; i < j; i++)
                    if (_self.oRow.cells[i] == _self.oCell)
                        idx = i;
            }

            oEditor.$selection.set();

            switch (e.value) {
                case "rowbefore":
                    oRow = oDoc.createElement("tr");
                    _self.oRow.parentNode.insertBefore(oRow, _self.oRow);
                    for (i = 0, j = _self.oRow.cells.length; i < j; i++)
                        oRow.insertCell(0);
                    break;
                case "rowafter":
                    oRow = oDoc.createElement("tr");
                    _self.oRow.parentNode.insertBefore(oRow, _self.oRow.nextSibling);
                    for (i = 0, j = _self.oRow.cells.length; i < j; i++)
                        oRow.insertCell(0);
                    break;
                case "deleterow":
                    if (!_self.oRow || !_self.oRow.parentNode) return;
                    _self.oRow.parentNode.removeChild(_self.oRow);
                    break;
                case "colbefore":
                    if (!_self.oCell) return;
                    for (i = 0, j = _self.oTable.rows.length; i < j; i++)
                        _self.oTable.rows[i].insertCell(idx);
                    break;
                case "colafter":
                    if (!_self.oCell) return;
                    idx += 1;
                    for (i = 0, j = _self.oTable.rows.length; i < j; i++)
                        _self.oTable.rows[i].insertCell(idx);
                    break;
                case "deletecol":
                    if (!_self.oCell || _self.oTable.rows[0].cells.length == 1)
                        return;
                    //@todo: fix this to understand cell spanning
                    for (i = 0, j = _self.oTable.rows.length; i < j; i++) {
                        if (_self.oTable.rows[i].cells[idx])
                            _self.oTable.rows[i].deleteCell(idx);
                    }
                    break;
                case "splitcells":
                    if (!_self.oRow || !_self.oCell)
                        return true;

                    var spandata = getColRowSpan(_self.oCell);

                    var colspan = spandata["colspan"];
                    var rowspan = spandata["rowspan"];

                    // Needs splitting
                    if (colspan > 1 || rowspan > 1) {
                        // Generate cols
                        _self.oCol.colSpan = 1;
                        for (i = 1; i < colspan; i++) {
                            var newTD = oDoc.createElement("td");
                            if (!apf.isIE)
                                newTD.innerHTML = '<br _apf_placeholder="1"/>';

                            _self.oRow.insertBefore(newTD, nextElm(_self.oCell, ["TD","TH"]));

                            if (rowspan > 1)
                                addRows(newTD, _self.oRow, rowspan);
                        }

                        addRows(_self.oCell, _self.oRow, rowspan);
                    }
                    break;
                case "mergecells":
                    var rows = [], cells = [],
                        oSel = oEditor.$selection.get(),
                        grid = getTableGrid(_self.oTable),
                        oCellPos, aRows, aRowCells, aBrs, oTd, k;

                    if (apf.isIE || oSel.rangeCount == 1) {
                        var numRows = 1;
                        var numCols = 1;
                        oCellPos = getCellPos(grid, _self.oCell);

                        // Get rows and cells
                        aRows = _self.oTable.rows;
                        for (i = oCellPos.rowindex; i < grid.length; i++) {
                            aRowCells = [];

                            for (j = oCellPos.cellindex; j < grid[i].length; j++) {
                                oTd = getCell(grid, i, j);

                                if (oTd && !rows.contains(oTd) && !aRowCells.contains(oTd)) {
                                    var cp = getCellPos(grid, oTd);
                                    // Within range
                                    if (cp.cellindex < oCellPos.cellindex + numCols
                                      && cp.rowindex < oCellPos.rowindex + numRows)
                                        aRowCells[aRowCells.length] = oTd;
                                }
                            }
                            if (aRowCells.length > 0)
                                rows[rows.length] = aRowCells;

                            oTd = getCell(grid, oCellPos.rowindex, oCellPos.cellindex);
                            aBrs = oTd.getElementsByTagName("br");
                            if (aBrs.length > 1) {
                                for (j = aBrs.length; j >= 1; j--) {
                                    if (aBrs[j].getAttribute("_apf_placeholder"))
                                        aBrs[j].parentNode.removeChild(aBrs[j]);
                                }
                            }
                        }
                    }
                    else {
                        var x1 = -1, y1 = -1, x2, y2;

                        // Only one cell selected, whats the point?
                        if (oSel.rangeCount < 2)
                            return true;

                        // Get all selected cells
                        for (i = 0; i < oSel.rangeCount; i++) {
                            var rng = oSel.getRangeAt(i);
                            _self.oCell = rng.startContainer.childNodes[rng.startOffset];
                            if (!_self.oCell)
                                break;
                            if (_self.oCell.nodeName == "TD" || _self.oCell.nodeName == "TH")
                                cells.push(_self.oCell);
                        }

                        // Get rows and cells
                        aRows = _self.oTable.rows;
                        for (i = 0; i < aRows.length; i++) {
                            aRowCells = [];
                            for (j = 0; j < aRows[i].cells.length; j++) {
                                oTd = aRows[i].cells[j];
                                for (k = 0; k < cells.length; k++) {
                                    if (oTd != cells[k]) continue;
                                    aRowCells.push(oTd);
                                }
                            }
                            if (aRowCells.length > 0)
                                rows.push(aRowCells);
                        }

                        // Find selected cells in grid and box
                        for (i = 0; i < grid.length; i++) {
                            for (j = 0; j < grid[i].length; j++) {
                                grid[i][j]._selected = false;
                                for (k = 0; k < cells.length; k++) {
                                    if (grid[i][j] != cells[k]) continue;
                                    // Get start pos
                                    if (x1 == -1) {
                                        x1 = j;
                                        y1 = i;
                                    }
                                    // Get end pos
                                    x2 = j;
                                    y2 = i;
                                    grid[i][j]._selected = true;
                                }
                            }
                        }

                        // Is there gaps, if so deny
                        for (i = y1; i <= y2; i++) {
                            for (j = x1; j <= x2; j++) {
                                if (!grid[i][j]._selected) {
                                    alert("Invalid selection for merge.");
                                    return true;
                                }
                            }
                        }
                    }

                    // Validate selection and get total rowspan and colspan
                    var rowSpan = 1, colSpan = 1;

                    // Validate horizontal and get total colspan
                    var sd, lastRowSpan = -1;
                    for (i = 0; i < rows.length; i++) {
                        var rowColSpan = 0;
                        for (j = 0, k = rows[i].length; j < k; j++) {
                            sd = getColRowSpan(rows[i][j]);
                            rowColSpan += sd.colspan;
                            if (lastRowSpan != -1 && sd.rowspan != lastRowSpan) {
                                alert("Invalid selection for merge.");
                                return true;
                            }
                            lastRowSpan = sd.rowspan;
                        }
                        if (rowColSpan > colSpan)
                            colSpan = rowColSpan;
                        lastRowSpan = -1;
                    }

                    // Validate vertical and get total rowspan
                    var lastColSpan = -1;
                    for (j = 0; j < rows[0].length; j++) {
                        var colRowSpan = 0;
                        for (i = 0; i < rows.length; i++) {
                            sd = getColRowSpan(rows[i][j]);
                            colRowSpan += sd.rowspan;
                            if (lastColSpan != -1 && sd.colspan != lastColSpan) {
                                alert("Invalid selection for merge.");
                                return true;
                            }
                            lastColSpan = sd.colspan;
                        }
                        if (colRowSpan > rowSpan)
                            rowSpan = colRowSpan;
                        lastColSpan = -1;
                    }

                    // Setup td
                    _self.oCell = rows[0][0];
                    _self.oCell.rowSpan = rowSpan;
                    _self.oCell.colSpan = colSpan;

                    // Merge cells
                    for (i = 0; i < rows.length; i++) {
                        for (j = 0; j < rows[i].length; j++) {
                            var html = rows[i][j].innerHTML;
                            var chk = html.replace(/[ \t\r\n]/g, "");
                            if (chk != "<br/>" && chk != '<br _apf_placeholder="1"/>'
                              && (j + i > 0))
                                _self.oCell.innerHTML += html;

                            // Not current cell
                            if (rows[i][j] == _self.oCell && rows[i][j]._deleted)
                                continue;
                            oCellPos = getCellPos(grid, rows[i][j]);
                            var tr = rows[i][j].parentNode;

                            tr.removeChild(rows[i][j]);
                            rows[i][j]._deleted = true;

                            if (tr.hasChildNodes()) continue;
                            // Empty TR, remove it
                            tr.parentNode.removeChild(tr);

                            var cellElm, lastCell = null;
                            for (k = 0; cellElm = getCell(grid, oCellPos.rowindex, k); k++) {
                                if (cellElm != lastCell && cellElm.rowSpan > 1)
                                    cellElm.rowSpan--;
                                lastCell = cellElm;
                            }
                            if (_self.oCell.rowSpan > 1)
                                _self.oCell.rowSpan--;
                        }
                    }

                    // Remove all but one bogus br
                    aBrs = _self.oCell.getElementsByTagName("br");
                    if (aBrs.length > 1) {
                        for (i = aBrs.length; i >= 1; i--) {
                            if (aBrs[i] && aBrs[i].getAttribute("_apf_placeholder"))
                                aBrs[i].parentNode.removeChild(aBrs[i]);
                        }
                    }
                    break;
           }

           oEditor.$restoreFocus();
           // #ifdef __WITH_DATAACTION
           oEditor.change(_self.editor.getValue());
           /* #else
           _self.editor.setProperty("value", _self.editor.getValue())
           #endif*/
        });
    };
});

// #endif
