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

//#ifdef __WITH_IEPNGFIX

/**
 * @private
 */
apf.iepngfix = (function() {
    var sNodes           = null, 
        aNodes           = null,
        applyPositioning = true,
        // Path to a transparent GIF image
        shim,

        fnLoadPngs = function() {
            if (!shim)
                shim = apf.skins.skins["default"].mediaPath + '/blank.gif';

            if (aNodes === null) {
                if (sNodes)
                    aNodes = sNodes.splitSafe(',');
                else
                    aNodes = [document];
            }

            function fixMe(obj) {
                // background pngs
                if (obj.currentStyle.backgroundImage.match(/\.png/i) !== null)
                    bg_fnFixPng(obj);
                // image elements
                if (obj.tagName == 'IMG' && obj.src.match(/\.png$/i) !== null)
                    el_fnFixPng(obj);
                // apply position to 'active' elements
                if (applyPositioning && (obj.tagName == 'A' || obj.tagName == 'INPUT')
                  && obj.style.position === '') {
                    obj.style.position = 'relative';
                }
            }

            for (var j = 0, l = aNodes.length, node; j < l; j++) {
                if (typeof aNodes[j] == "string")
                    aNodes[j] = document.getElementById(aNodes[j]);
                node = aNodes[j];
                if (!node) continue;

                if (node != document)
                    fixMe(node);

                for (var i = node.all.length - 1, obj = null; (obj = node.all[i]); i--)
                    fixMe(obj);
            }
        },

        bg_fnFixPng = function(obj) {
            var mode = 'scale',
                bg   = obj.currentStyle.backgroundImage,
                src  = bg.substring(5, bg.length - 2);

            if (obj.currentStyle.backgroundRepeat == 'no-repeat')
                mode = 'crop';
            obj.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"
                + src + "', sizingMethod='" + mode + "')";
            obj.style.backgroundImage = "url(" + shim + ")";
        },

        el_fnFixPng = function(img) {
            var src          = img.src;
            img.style.width  = img.width  + "px";
            img.style.height = img.height + "px";
            img.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"
                + src + "', sizingMethod='scale')";
            img.src          = shim;
        };

    return {
        limitTo: function(s) {
            sNodes = s;
            return this;
        },
        run: fnLoadPngs
    };
})();

// #endif
