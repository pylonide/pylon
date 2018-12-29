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

// #ifdef __WITH_AMLTEXTRECTANGLE
apf.AmlTextRectangle = function(host){
    var _self = this;
    function handler(){
        var pos = _self.getAbsolutePosition(_self.$ext);
        _self.setProperty("left", pos[0]);
        _self.setProperty("top", pos[1]);
        _self.setProperty("right", document.documentElement.offsetWidth - pos[0]);
        _self.setProperty("bottom", document.documentElement.offsetWidth - pos[1]);
    }
    
    host.addEventListener("prop.width", handler);
    host.addEventListener("prop.height", handler);
    host.addEventListener("prop.left", handler);
    host.addEventListener("prop.top", handler);

    handler.call(host);
};
apf.AmlTextRectangle.prototype = new apf.Class();
// #endif