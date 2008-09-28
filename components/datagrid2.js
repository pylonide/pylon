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

jpf.datagrid2 = jpf.component(jpf.GUI_NODE, function() {
    var ShadowGrid = {
        grid  : null,
        COLUMN: 0x0001,
        ROW   : 0x0002,
        CELL  : 0x0004,
        
        reset: function() {
            // the first column will only be used internally for caching, etc.
            this.grid = [
                { name: 'col0', caption: 'internal', visible: false, drawn: false, cells: ['col0row0', 'col0row1'] },
            ];
        },
        
        addColumn: function(sName, sCaption, iWidth, aData) {
            if (this.getColumnByName(sName)) return this;
            
            this.grid.push({
                name   : sName,
                caption: sCaption || sName,
                width  : parseInt(iWidth) || 0,
                visible: false,
                drawn  : false,
                cells  : (typeof aData == "array") ? aData : [aData]
            })
        },
        
        addRow: function(mData, iBeforeIndex, iHeight) {
            var oCol;// = this.getColByName(sCol);
            
            iBeforeIndex = parseInt(iBeforeIndex);
            for (var i = 1; i < this.grid.length; i++) {
                oCol = this.grid[i];
                
                if (iBeforeIndex == -1 || !oCol.cells[iBeforeIndex])
                    oCol.cells.push(mData);
                else if (iBeforeIndex === 0)
                    oCol.cells.unshift(mData); //oCol.cells = [mData].concat(oCol.cells); //<-- IE5.5 compat
                else
                    oColl.cells.insertIndex(mData, iBeforeIndex);
            }
        },
        
        update: function(iIndex, iWhat, aData) {
            if (this.COLUMN & iWhat) {
                
            }
            //must be ROW then!
            else if (this.ROW & iWhat) {
                
            }
        },
        
        'delete': function(iIndex, iWhat) {
            iIndex = parseInt(iIndex);
            if (this.COLUMN & iWhat) {
                if (this.grid[iIndex])
                    this.grid.remove(iIndex);
            }
            //must be ROW then!
            else if (this.ROW & iWhat) {
                for (var i = 1; i < this.grid.length; i++)
                    if (this.grid[i].cells[iIndex])
                        this.grid[i].cells.remove[iIndex];
            }
        },
        
        getColByName: function(sName) {
            for (var i = 1; i < this.grid.length; i++) {
                if (this.grid[i].name == sName)
                    return this.grid[i];
            }
            return null;
        },
        
        getCellByCoord: function(iCol, iRow) {
            iCol = parseInt(iCol - 1);
            return (this.grid[iCol] && this.grid[iColl].cells) 
                ? this.grid[iCol].cells[parseInt(iRow)] 
                : null;
        },
        
        getRows: function(iStart, iEnd) {
            var i, j, aRows = [];
            if (this.grid.length == 1)
                return aRows;
            iStart = Math.max(0, Math.min(iStart, this.grid[0].cells.length - 1));
            iEnd   = Math.min(iStart, iEnd);
            for (i = iStart; i <= iEnd; i++) {
                var aRow = aRows[i] = {};
                for (j = 1; j < this.grid.length; j++)
                    aRow[this.grid[j].name] = this.grid[j].cells[i];
            }
        },
        
        getDimensions: function() {
            var oDims = {
                width : this.grid.length - 2, //first column is used internally
                height: 0
            };
            if (this.grid.length > 1)
                oDims.height = this.grid[i].cells.length - 1;
            return oDims;
        }
        
    };
    
    this.init = function() {
        ShadowGrid.reset(); //initialize for the first time
    }
        
    this.draw = function() {
        this.oExt = this.$getExternal();
    }
    
    this.$loadJml = function(oXml) {
        
    }
}).implement(jpf.Presentation, jpf.DataBinding, jpf.DragDrop);
