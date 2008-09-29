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

jpf.datagrid2 = jpf.component(jpf.NODE_VISIBLE, function() {
    this.init = function() {
        ShadowGrid.reset(); //initialize for the first time
    }
        
    this.$draw = function() {
        this.oExt = this.$getExternal();
    }
    
    this.$loadJml = function(oXml) {
        
    }
}).implement(jpf.Presentation, jpf.DataBinding, jpf.DragDrop);

jpf.datagrid2.COLUMN = 0x0001;
jpf.datagrid2.ROW    = 0x0002;
jpf.datagrid2.CELL   = 0x0004;
