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
jpf.belatedpngfix = {

    ns :'jpf_belatedpng',

    createVmlNameSpace : function() { /* enable VML */
        if (document.namespaces && !document.namespaces[this.ns])
            document.namespaces.add(this.ns, 'urn:schemas-microsoft-com:vml');
        /*if (window.attachEvent) {
            window.attachEvent('onbeforeunload', function() {
                jpf.belatedpngfix = null;
            });
        }*/

        return this;
    },

    createVmlStyleSheet : function() { /* style VML, enable behaviors */
        /*
            Just in case lots of other developers have added
            lots of other stylesheets using document.createStyleSheet
            and hit the 31-limit mark, let's not use that method!
            further reading: http://msdn.microsoft.com/en-us/library/ms531194(VS.85).aspx
         */
        var style = document.createElement('style');
        document.documentElement.firstChild.insertBefore(style,
            document.documentElement.firstChild.firstChild);
        var styleSheet = style.styleSheet;
        styleSheet.addRule(this.ns + '\\:*', '{behavior:url(#default#VML)}');
        styleSheet.addRule(this.ns + '\\:rect', 'position:absolute;');
        styleSheet.addRule('img.'  + this.ns + '_sizeFinder',
            'position:absolute; z-index:-1; top:-10000px; visibility:hidden;'); /* large negative top value for avoiding vertical scrollbars for large images, suggested by James O'Brien, http://www.thanatopsic.org/hendrik/ */
        this.styleSheet = styleSheet;

        return this;
    },

    interceptPropertyChanges : function() {
        var el = event.srcElement;
        if (event.propertyName.search('background') != -1) {
            el.runtimeStyle.cssText = '';
            jpf.belatedpngfix.updateVmlFill.call(el);
        }
    },

    handlePseudoHover : function(el) {
        var self = this;
        // wouldn't work as intended without setTimeout
        setTimeout(function() {
            self.runtimeStyle.backgroundColor = '';
            self.runtimeStyle.backgroundImage = '';
            jpf.belatedpngfix.updateVmlFill.call(self);
        }, 1);
    },

    /**
     * This is the method to use in a document.
     * @param {String} selector - REQUIRED - a CSS selector, such as '#doc .container'
     **/
    fix : function(selector) {
        // multiple selectors supported, no need for multiple calls to this anymore
        var selectors = selector.split(',');
        for (var i = 0; i < selectors.length; i++) {
            // seems to execute the function without adding it to the stylesheet - interesting...
            this.styleSheet.addRule(selectors[i],
                'behavior:expression(jpf.belatedpngfix.fixPng.call(this))');
        }

        return this;
    },

    fixPng : function(isImg) {
        this.style.behavior = 'none';
        if (this.nodeName == 'BODY' || this.nodeName == 'TD'
          || this.nodeName == 'TR') { /* elements not supported yet */
            return this;
        }
        var self = this;
        var lib  = jpf.belatedpngfix;
        this.isImg = isImg;
        if (this.nodeName == 'IMG') {
            var thisStyle   = this.currentStyle;
            this.width      = this.clientWidth;
            this.height     = this.clientHeight;
            this.borderRect = document.createElement('div');
            var styles = {
                'backgroundColor': true,
                'borderStyle'    : true,
                'borderWidth'    : true,
                'borderColor'    : true,
                'display'        : true,
                'verticalAlign'  : true,
                'width'          : true,
                'height'         : true,
                'zIndex'         : true
            };
            for (var s in styles)
                this.borderRect.style[s] = thisStyle[s];
            this.parentNode.style.zoom     = 1;
            this.borderRect.style.backgroundImage    = 'url(' + this.src + ')';
            this.borderRect.style.backgroundRepeat   = 'no-repeat';
            this.borderRect.style.backgroundPosition = 'center center';
            this.borderRect.style.position = 'absolute';
            this.borderRect.style.left     = this.offsetLeft;
            this.borderRect.style.top      = this.offsetTop + 'px';
            this.parentNode.insertBefore(this.borderRect, this);
            lib.fixPng.call(this.borderRect, true);
            this.style.visibility          = 'hidden';
            return this;
        }
        this.bgSizeFinder = document.createElement('img');
        this.bgSizeFinder.className = lib.ns + '_sizeFinder';
        this.bgSizeFinder.attachEvent('onload', function() {
            lib.updateVmlDimensions.call(self);
        });
        document.body.insertBefore(this.bgSizeFinder, document.body.firstChild);
        this.imgRect   = document.createElement(lib.ns + ':rect');
        this.imgFill   = document.createElement(lib.ns + ':fill');
        this.colorRect = document.createElement(lib.ns + ':rect');
        this.rects = [this.imgRect, this.colorRect];
        for (var r = 0; r < 2; r++)
            this.rects[r].stroked = false;

        this.parentNode.insertBefore(this.colorRect, this);
        this.imgRect.appendChild(this.imgFill);
        this.parentNode.insertBefore(this.imgRect, this);

        /* attach handlers */
        var handlers = {
            'resize' : 'updateVmlDimensions',
            'move'   : 'updateVmlDimensions'
        };
        if (this.nodeName == 'A') {
            var moreForAs = {
                'mouseleave' : 'handlePseudoHover',
                'mouseenter' : 'handlePseudoHover',
                'focus'      : 'handlePseudoHover',
                'blur'       : 'handlePseudoHover'
            };
            for (var a in moreForAs)
                handlers[a] = moreForAs[a];
        }
        for (var h in handlers) {
            this.attachEvent('on' + h, function() {
                lib[handlers[h]].call(self);
            });
        }
        this.attachEvent('onpropertychange', lib.interceptPropertyChanges);

        /* set up element */
        setTimeout(function() {
            lib.updateVmlFill.call(self);
        }, 1);

        return this;
    },

    updateVmlFill : function() {
        var thisStyle = this.currentStyle;
        if (thisStyle.backgroundImage) {
            this.colorRect.style.zIndex = thisStyle.zIndex;
            this.imgRect.style.zIndex = thisStyle.zIndex;
            var giveLayout = function(el) {
                el.style.zoom = 1;
                if (el.currentStyle.position == 'static')
                    el.style.position = 'relative';
            };
            giveLayout(this);
            giveLayout(this.parentNode);
            var bg = thisStyle.backgroundImage;
            bg = bg.split('"')[1];
        }
        if (this.src)
            var bg = this.src;
        if (thisStyle.backgroundImage || this.src) {
            this.bgSizeFinder.src = bg;
            this.imgFill.src      = bg;
            this.imgFill.type     = 'tile';
        }
        this.colorRect.filled    = (thisStyle.backgroundColor != 'transparent');
        this.colorRect.fillColor = thisStyle.backgroundColor;
        this.runtimeStyle.backgroundImage = 'none';
        this.runtimeStyle.backgroundColor = 'transparent';

        return this;
    },

    /**
     * IE can't figure out what do when the offsetLeft and the clientLeft add up
     * to 1, and the VML ends up getting fuzzy... so we have to push/enlarge
     * things by 1 pixel and then clip off the excess
     *
     */
    updateVmlDimensions : function() {
        var thisStyle = this.currentStyle;
        var size = {
            'W'   : this.clientWidth + 1,
            'H'   : this.clientHeight + 1,
            'w'   : this.bgSizeFinder.width,
            'h'   : this.bgSizeFinder.height,
            'L'   : this.offsetLeft,
            'T'   : this.offsetTop,
            'bLW' : this.clientLeft,
            'bTW' : this.clientTop
        };
        var fudge = (size.L + size.bLW == 1) ? 1 : 0;
        if (size.W >= document.body.clientWidth)
            size.W = document.body.clientWidth - 1;
        for (var r = 0; r < 2; r++) {
            this.rects[r].style.width  = size.W + 'px';
            this.rects[r].style.height = size.H + 'px';
            this.rects[r].style.left   = (size.L + size.bLW - 1) + 'px';
            this.rects[r].style.top    = (size.T + size.bTW - 1) + 'px';
        }

        var bg = {
            'X': 0,
            'Y': 0
        };

        var figurePercentage = function(axis, position) {
            var fraction = true;
            switch (position) {
            case 'left':
            case 'top':
                bg[axis] = 0;
                break;
            case 'center':
                bg[axis] = .5;
                break;
            case 'right':
            case 'bottom':
                bg[axis] = 1;
                break;
            default:
                if (position.search('%') != -1)
                    bg[axis] = parseInt(position) * .01;
                else
                    fraction = false;
            }
            var horz = (axis == 'X');
            bg[axis] = Math.ceil(fraction
                ? ((size[horz ? 'W' : 'H'] * bg[axis]) - (size[horz
                    ? 'w'
                    : 'h'] * bg[axis]))
                : parseInt(position));
            if (bg[axis] == 0)
                bg[axis] = 1;
        };
        for (var b in bg)
            figurePercentage(b, thisStyle['backgroundPosition' + b]);

        this.imgFill.position = (bg.X / size.W) + ',' + (bg.Y / size.H);
        var bgR = thisStyle.backgroundRepeat;
        var dC  = {
            'T' : 1,
            'R' : size.W + fudge,
            'B' : size.H,
            'L' : 1 + fudge
        }; /* these are defaults for repeat of any kind */
        var altC = {
            'X' : {
                'b1' : 'L',
                'b2' : 'R',
                'd'  : 'W'
            },
            'Y' : {
                'b1' : 'T',
                'b2' : 'B',
                'd'  : 'H'
            }
        };
        if (bgR != 'repeat') {
            // these are defaults for no-repeat - clips down to the image location
            var c = {
                'T' : (bg.Y),
                'R' : (bg.X + size.w),
                'B' : (bg.Y + size.h),
                'L' : (bg.X)
            };
            // now let's revert to dC for repeat-x or repeat-y
            if (bgR.search('repeat-') != -1) {
                var v = bgR.split('repeat-')[1].toUpperCase();
                c[altC[v].b1] = 1;
                c[altC[v].b2] = size[altC[v].d];
            }
            if (c.B > size.H)
                c.B = size.H;
            this.imgRect.style.clip = 'rect(' + c.T + 'px ' + (c.R + fudge)
                + 'px ' + c.B + 'px ' + (c.L + fudge) + 'px)';
        } else {
            this.imgRect.style.clip = 'rect(' + dC.T + 'px ' + dC.R + 'px '
                + dC.B + 'px ' + dC.L + 'px)';
        }
        if (this.isImg) {
            dC.R++;
            dC.B++;
        }
        this.colorRect.style.clip = 'rect(' + dC.T + 'px ' + dC.R + 'px '
            + dC.B + 'px ' + dC.L + 'px)';

        return this;
    }
};

// #endif
