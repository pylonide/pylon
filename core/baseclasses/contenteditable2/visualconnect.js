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

//#ifdef __WITH_CONTENTEDITABLE
/**
 * @private
 */
apf.visualConnect = function (sel){
    this.activate = function(e){
        apf.plane.show();
        
        var hNode, pos, selection = sel.$getNodeList();
        for (var i = 0, il = selection.length; i < il; i++) {
            hNode = selection[i].$ext;
            pos = apf.getAbsolutePosition(hNode);
            pos.push(hNode.offsetWidth, hNode.offsetHeight);
            
            //draw the line
        }
        
        apf.dragMode = true; //prevents selection
        
        document.onmousemove = function(e){
            if (!e) e = event;

            
        }

        document.onmouseup = function(e){
            apf.plane.hide();
            apf.dragMode = false; //prevents selection
            
            if (!e) e = event;
            var htmlNode = document.elementFromPoint(e.offsetX, e.offsetY);
            var amlNode = apf.findHost(amlNode);
            
            _self.deactivate();
        };
    };

    this.deactivate = function(){
        apf.plane.hide();
    };
};
//#endif