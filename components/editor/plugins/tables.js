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

// #ifdef __EDITOR || __INC_ALL

jpf.editor.Plugin('table', function() {
    this.name        = 'table';
    this.icon        = 'table';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+t';
    this.state       = jpf.editor.OFF;
    
    var panelBody, oTable, oStatus;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            jpf.popup.setContent(this.uniqueId, this.createPanelBody());
        }
        else
            resetTableMorph.call(this);
        this.editor.showPopup(this, this.uniqueId, this.buttonNode);
        setTimeout(function() {
            var iWidth  = oTable.rows[0].cells.length * (jpf.isIE ? 25 : 22);
            var iHeight = oTable.rows.length * (jpf.isIE ? 25 : 22);

            panelBody.style.width  = (iWidth + 6) + "px";
            panelBody.style.height = (iHeight + 36) + "px";
        });
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };
    
    this.queryState = function(editor) {
        return this.state;
    };
    
    this.submit = function(oSize) {
        jpf.popup.forceHide();

        if (oSize[0] < 0 || oSize[1] < 0) return;
        
        var i, j, k, l, aOut = ['<table border="0" width="50%" class="itemTable">'];
        for (i = 0, j = oSize[0]; i <= j; i++) {
            aOut.push('<tr>');
            for (k = 0, l = oSize[1]; k <= l; k++)
                aOut.push('<td><br _jpf_placeholder="true" /></td>');
            aOut.push('</tr>')
        }
        aOut.push('<table>')

        this.storeSelection();
        this.editor.insertHTML(aOut.join(''));
        this.restoreSelection();
        this.editor.Selection.collapse(false);
    };

    this.getCellCoords = function(oCell) {
        var oRow;
        for (var i = 0, j = oTable.rows.length; i < j; i++) {
            oRow = oTable.rows[i];
            if (oRow != oCell.parentNode) continue;
            for (var k = 0, l = oRow.cells.length; k < l; k++)
                if (oRow.cells[k] == oCell)
                    return [i, k];
        }
        return [-1, -1];
    }

    var bMorphing = false, oMorphCurrent, oMorphCell;
    function mouseDown(e) {
        if (e.target.tagName != "TD") return;
        var coords = this.getCellCoords(e.target);
        // check if we're dealing with the last visible table cell:
        if (coords[0] != oTable.rows.length - 1
          || coords[1] != oTable.rows[oTable.rows.length - 1].cells.length - 1)
            return;

        bMorphing = true;
        oMorphCurrent = e.client;
        oMorphCell = e.target;
        var _self = this;
        document.onmousemove = function(e) {
            if (!bMorphing) return;
            e = new jpf.AbstractEvent(e || window.event);
            var oLastRow = oTable.rows[oTable.rows.length - 1];
            if (e.target.tagName == "TD" && oLastRow.cells[oLastRow.cells.length - 1] != e.target)
               return mouseUp.call(_self, e, true);
            morphTable(e.client);
        }
    }

    function mouseUp(e, noSubmit) {
        bMorphing   = false;
        oMorphCurrent = null;
        document.onmousemove = null;
        if (e.target.tagName == "TD" && noSubmit !== true)
            return this.submit(this.getCellCoords(e.target));
        mouseOver.call(this, e);
        return false;
    }

    function morphTable(oClient) {
        var i, j, oCell, oRow;
        var deltaX = Math.floor((oClient.x - oMorphCurrent.x) / 2);
        if (deltaX > 0) {
            panelBody.style.width = (panelBody.offsetWidth + deltaX) + "px";
            //bordermargin = 8
            deltaX = Math.floor(((panelBody.offsetWidth - 8) - oTable.offsetWidth) / 26);
            if (deltaX >= 1){
                // add a row to the start of the table (selected)...
                while (deltaX) {
                    for (i = 0, j = oTable.rows.length; i < j; i++) {
                        oCell = oTable.rows[i].insertCell(0);
                        oCell.className = "selected";
                    }
                    --deltaX;
                }
            }
        }
        var deltaY = Math.floor((oClient.y - oMorphCurrent.y) / 2);
        if (deltaY > 0) {
            panelBody.style.height = (panelBody.offsetHeight + deltaY) + "px";
            //topbar = 8, bottombar = 20
            deltaY = Math.floor(((panelBody.offsetHeight - 28) - oTable.offsetHeight) / 26);
            if (deltaY >= 1){
                // add a column to the start of the table (selected)
                while (deltaY) {
                    oRow = oTable.insertRow(-1);
                    for (i = 0, j = oTable.rows[0].cells.length; i < j; i++) {
                        oCell = oRow.insertCell(-1);
                        oCell.className = "selected";
                    }
                    --deltaY;
                }
            }
        }
        oMorphCurrent = oClient;
    }

    function resetTableMorph() {
        var i, j, oRow;
        mouseOut.call(this, {target: {tagName: ""}});
        for (i = oTable.rows.length - 1; i >= 0; i--) {
            if (i >= 5) {
                oTable.deleteRow(i);
                continue;
            }
            oRow = oTable.rows[i];
            for (j = oRow.cells.length - 1; j >= 5; j--)
                oRow.deleteCell(i);
        }
    }
    
    function mouseOver(e) {
        if (e.target.tagName != "TD" && !bMorphing) return;
        var oRow, oCell, coords = this.getCellCoords(e.target);
        for (var i = 0, j = oTable.rows.length; i < j; i++) {
            oRow = oTable.rows[i];  
            for (var k = 0, l = oRow.cells.length; k < l; k++) {
                oCell = oRow.cells[k];
                if ((i <= coords[0] && k <= coords[1]) || bMorphing)
                    oCell.className = "selected";
                else
                    oCell.className = "";
            }
        }
        if (bMorphing)
            oStatus.innerHTML = oTable.rows.length + " x " + oTable.rows[0].cells.length + " Table";
        else if (coords[0] >= 0 && coords[1] >= 0)
            oStatus.innerHTML = (coords[0] + 1) + " x " + (coords[1] + 1) + " Table";
    }
    
    function mouseOut(e) {
        if (bMorphing || e.target.tagName == "TD" || e.target.tagName == "TBODY") return;
        var i, j, oRow;
        for (i = 0, j = oTable.rows.length; i < j; i++) {
            oRow = oTable.rows[i];
            for (var k = 0, l = oRow.cells.length; k < l; k++)
                oRow.cells[k].className = "";
        }
        oStatus.innerHTML = "Cancel";
    }

    function statusClick(e) {
        mouseOut.call(this, e);
        jpf.popup.forceHide();
    }

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup editor_tablepopup";
        var idTable   = 'editor_' + this.editor.uniqueId + '_table';
        var idStatus  = 'editor_' + this.editor.uniqueId + '_table_status';
        panelBody.innerHTML =
           '<span class="editor_panelfirst"><a href="javascript:jpf.popup.forceHide();">x</a></span>\
            <table cellpadding="0" cellspacing="2" border="0" id="' + idTable + '" class="editor_paneltable">\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            </table>\
            <div id="' + idStatus + '" class="editor_paneltablecancel">Cancel</div>';

        oTable = document.getElementById(idTable);
        oTable.onmousedown  = mouseDown.bindWithEvent(this);
        oTable.onmouseup    = mouseUp.bindWithEvent(this);
        oTable.onmouseover  = mouseOver.bindWithEvent(this);
        oTable.onmouseout   = mouseOut.bindWithEvent(this);
        oStatus = document.getElementById(idStatus);
        oStatus.onmouseover = mouseOut.bindWithEvent(this);
        oStatus.onmousedown = statusClick.bindWithEvent(this);
        panelBody.onselectstart = function() { return false; };
        return panelBody;
    };
});

jpf.editor.Plugin('tablewizard', function() {
    this.name        = 'tablewizard';
    this.icon        = 'tablewizard';
    this.type        = jpf.editor.CONTEXTPANEL;
    this.hook        = 'oncontext';
    this.state       = jpf.editor.OFF;
    this.oTable      = null;
    this.oRow        = null;
    this.oCell       = null;
    
    var activeNode, _self = this;

    this.execute = function(editor, e) {
        if (this.queryState(editor) != jpf.editor.ON)
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
        
        if (!jpf.editor.oMenu) {
            this.editor = editor;
            this.createContextMenu();
        }
        jpf.editor.oMenu.parentNode = this;
        e.stop();
        jpf.editor.oMenu.display(e.client.x + 140, e.client.y + 150);
    };
    
    this.queryState = function(editor) {
        var oNode = editor.Selection.getSelectedNode();
        if (oNode.tagName == "TABLE" || oNode.tagName == "TBODY" 
          || oNode.tagName == "TR" || oNode.tagName == "TD") {
            activeNode = oNode;
            return jpf.editor.ON;
        }

        return jpf.editor.OFF;
    };
    
    this.createContextMenu = function(){
        var aMenu = '<j:menu xmlns:j="' + jpf.ns.jpf + '">\
                <j:item value="rowbefore">Insert row before</j:item>\
                <j:item value="rowbefore">Insert row after</j:item>\
                <j:item value="deleterow">Delete row</j:item>\
                <j:divider />\
                <j:item value="colbefore">Insert column before</j:item>\
                <j:item value="colafter">Insert column after</j:item>\
                <j:item value="deletecol">Delete column</j:item>\
                <j:divider />\
                <j:item value="splitcells">Split merged table cells</j:item>\
                <j:item value="mergecells">Merge table cells</j:item>\
                <j:divider />\
                <j:item value="rowprops">Table row properties</j:item>\
                <j:item value="colprops">Table column properties</j:item>\
            </j:menu>';

        var oMenu = jpf.document.createElement(aMenu);
        jpf.document.documentElement.appendChild(oMenu);
        oMenu.parentNode = this.editor;
        oMenu.addEventListener("onitemclick", function(e){
            if (this.parentNode != _self)
                return;
           
            var oRow, i, j, idx = 0;
            
            if (_self.oCell) {
                for (i = 0, j = _self.oRow.cells.length; i < j; i++)
                    if (_self.oRow.cells[i] == _self.oCell)
                        idx = i;
            }

            switch (e.value) {
                case "rowbefore":
                    oRow = document.createElement('tr');
                    for (i = 0, j = _self.oRow.cells.length; i < j; i++)
                        oRow.insertCell(-1);

                    _self.oRow.parentNode.insertBefore(oRow, _self.oRow);
                    break;
                case "rowafter":
                    oRow = document.createElement('tr');
                    for (i = 0, j = _self.oRow.cells.length; i < j; i++)
                        oRow.insertCell(-1);

                    _self.oRow.parentNode.insertBefore(oRow, _self.oRow.nextSibling);
                    break;
                case "deleterow":
                    if (!_self.oRow.parentNode) return;
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
                    for (i = 0, j = _self.oTable.rows.length; i < j; i++)
                        _self.oTable.rows[i].deleteCell(idx);
                    break;
                case "splitcells":
                    
                    break;
                case "mergecells":
                    
                    break;
           }
        });
        jpf.editor.oMenu = oMenu;
    };
});

// #endif
