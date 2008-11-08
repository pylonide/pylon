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

// #ifdef __WITH_IEPNGFIX

jpf.iePngFix = {
    data       : {},
    updateTimer: 0,
    hookEnabled: false,

    init: function() {
        if (jpf.supportPng24) return;
        window.attachEvent('onresize', function() {
            clearTimeout(jpf.iePngFix.updateTimer);
            jpf.iePngFix.updateTimer = setTimeout(jpf.iePngFix.update, 100);
        });
    },

    /**
     * Apply the filter to background images (CSS) during runtime. The user may
     * notice a slight delay in applying the transparency filter in IE.
     * 
     * @param {DOMNode} A reference to a DOM element
     * @param {String}  The PNG src file pathname
     * @param {Boolean} hidden "ready-to-run" passed when called back after image preloading.
     */
    tileBg: function(elm, pngSrc, ready) {
        var data = this.data[elm.uniqueID],
            elmW = Math.max(elm.clientWidth, elm.scrollWidth),
            elmH = Math.max(elm.clientHeight, elm.scrollHeight),
            bgX  = elm.currentStyle.backgroundPositionX,
            bgY  = elm.currentStyle.backgroundPositionY,
            bgR  = elm.currentStyle.backgroundRepeat;

        // Cache of DIVs created per element, and image preloader/data.
        if (!data.tiles) {
            data.tiles = {
                elm  : elm,
                src  : '',
                cache: [],
                img  : new Image(),
                old  : {}
            };
        }
        var tiles = data.tiles,
            pngW  = tiles.img.width,
            pngH  = tiles.img.height;

        if (pngSrc) {
            if (!ready && pngSrc != tiles.src) {
                // New image? Preload it with a callback to detect dimensions.
                tiles.img.onload = function() {
                    this.onload = null;
                    jpf.iePngFix.tileBg(elm, pngSrc, true);
                };
                return tiles.img.src = pngSrc;
            }
        } else {
            // No image?
            if (tiles.src)
                ready = true;
            pngW = pngH = 0;
        }
        tiles.src = pngSrc;

        if (!ready && elmW == tiles.old.w && elmH == tiles.old.h &&
          bgX == tiles.old.x && bgY == tiles.old.y && bgR == tiles.old.r)
            return;

        // Convert English and percentage positions to pixels.
        var pos = {
                top   : '0%',
                left  : '0%',
                center: '50%',
                bottom: '100%',
                right : '100%'
            },
            x,
            y,
            pc;
        x = pos[bgX] || bgX;
        y = pos[bgY] || bgY;
        if (pc = x.match(/(\d+)%/))
            x = Math.round((elmW - pngW) * (parseInt(pc[1]) / 100));
        if (pc = y.match(/(\d+)%/))
            y = Math.round((elmH - pngH) * (parseInt(pc[1]) / 100));
        x = parseInt(x);
        y = parseInt(y);

        // Handle backgroundRepeat.
        var repeatX = { 'repeat': 1, 'repeat-x': 1 }[bgR],
            repeatY = { 'repeat': 1, 'repeat-y': 1 }[bgR];
        if (repeatX) {
            x %= pngW;
            if (x > 0)
                x -= pngW;
        }
        if (repeatY) {
            y %= pngH;
            if (y > 0)
                y -= pngH;
        }

        // Go!
        this.hookEnabled = false;
        if (!({ relative: 1, absolute: 1 }[elm.currentStyle.position]))
            elm.style.position = 'relative';
        var count = 0, xPos, yPos,
            maxX  = repeatX ? elmW : x + 0.1,
            maxY  = repeatY ? elmH : y + 0.1,
            d, s, isNew;
        if (pngW && pngH) {
            for (xPos = x; xPos < maxX; xPos += pngW) {
                for (yPos = y; yPos < maxY; yPos += pngH) {
                    isNew = 0;
                    if (!tiles.cache[count]) {
                        tiles.cache[count] = document.createElement('div');
                        isNew = 1;
                    }
                    var clipR = (xPos + pngW > elmW ? elmW - xPos : pngW),
                        clipB = (yPos + pngH > elmH ? elmH - yPos : pngH);
                    d = tiles.cache[count];
                    s = d.style;
                    s.behavior = 'none';
                    s.left     = xPos  + 'px';
                    s.top      = yPos  + 'px';
                    s.width    = clipR + 'px';
                    s.height   = clipB + 'px';
                    s.clip     = 'rect(' +
                        (yPos < 0 ? 0 - yPos : 0) + 'px,' +
                        clipR + 'px,' +
                        clipB + 'px,' +
                        (xPos < 0 ? 0 - xPos : 0) + 'px)';
                    s.display  = 'block';
                    if (isNew) {
                        s.position = 'absolute';
                        s.zIndex   = -999;
                        if (elm.firstChild)
                            elm.insertBefore(d, elm.firstChild);
                        else
                            elm.appendChild(d);
                    }
                    this.fix(d, pngSrc, 0);
                    count++;
                }
            }
        }
        while (count < tiles.cache.length) {
            this.fix(tiles.cache[count], '', 0);
            tiles.cache[count++].style.display = 'none';
        }

        this.hookEnabled = true;

        // Cache so updates are infrequent.
        tiles.old = {
            w: elmW,
            h: elmH,
            x: bgX,
            y: bgY,
            r: bgR
        };
    },
    
    update: function() {
        // Update all PNG backgrounds.
        for (var i in jpf.iePngFix.data) {
            var t = jpf.iePngFix.data[i].tiles;
            if (t && t.elm && t.src) {
                jpf.iePngFix.tileBg(t.elm, t.src);
            }
        }
    }
};

// #endif
