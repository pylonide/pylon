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

//#ifdef __WITH_ZMANAGER
/**
 * Manages the z-index of all elements in the UI. It takes care of different
 * regions in the z dimension preserved for certain common UI scenarios.
 *
 * Remarks:
 *  The following regions are defined:
 *  From:         To:           For:
 *            10        100000  Common Elements (each element a unique z index)
 *       1000000       1100000  Plane (Modal Windows / Maximized Panels) (latest shown highest)
 *       2000000       2100000  Popup (Menus / Dropdown Containers) (latest shown highest)
 *       3000000       3100000  Notifiers
 *       4000000       4100000  Drag Indicators
 *      10000000      11000000  Print
 *
 * @private
 */
apf.zmanager = function(){
    var count = {
        "default" : {
            level  : 10
        },
        "plane" : {
            level  : 1000000
        },
        "popup" : {
            level  : 2000000
        },
        "notifier" : {
            level  : 3000000
        },
        "drag" : {
            level  : 4000000
        },
        "print" : {
            level  : 10000000
        }
    };
    
    this.set = function(type, main, companion){
        main.style.zIndex = count[type].level++;
        if (companion) {
            if (companion.$storedZ == undefined)
                companion.$storedZ = companion.style.zIndex;
            companion.style.zIndex = count[type].level++
        }
    }
    
    this.clear = function(main, companion){
        if (companion.$storedZ == main.style.zIndex + 1) {
            companion.style.zIndex = companion.$storedZ;
            companion.$storedZ = undefined;
        }
    }
};
//#endif
