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

// #ifdef __ENABLE_EDITOR_COLOR || __INC_ALL

jpf.editor.colorPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.buttonNode  = null;
    this.state       = jpf.editor.OFF;
    this.colspan     = 18;

    var panelBody;

    var colorAtoms = ['00', '33', '66', '99', 'CC', 'FF'];
    function generatePalette() {
        jpf.editor.colorPlugin.palette = [];
        var r, g, b, iCol;
        for (r = 0; r < colorAtoms.length; r++) {
            for (g = 0; g < colorAtoms.length; g++) {
                iCol = (r % 3) * 6 + g;
                for (b = 0; b < colorAtoms.length; b++) {
                    if (!jpf.editor.colorPlugin.palette[iCol])
                        jpf.editor.colorPlugin.palette[iCol] = [];
                    jpf.editor.colorPlugin.palette[iCol][(r < 3 ? 0 : 6) + b] = {
                        red  : colorAtoms[r],
                        green: colorAtoms[g],
                        blue : colorAtoms[b]
                    };
                }
            }
        }
    }

    /**
     * Color code from MS sometimes differ from RGB; it's BGR. This method
     * converts both ways
     *
     * @param {color} c code - RGB-->BGR or BGR-->RGB
     * @type String
     * @return RGB<-->BGR
     */
    function RGBToBGRToRGB(c) {
        if (typeof c == 'string' && c.length > 0) {
            //c = c.parseColor();
            var tmp = [];
            var ch1 = c.charAt(0);
            var ch2 = c.charAt(4);
            tmp[0] = ch2;
            tmp[4] = ch1;
            ch1 = c.charAt(1);
            ch2 = c.charAt(5);
            tmp[1] = ch2;
            tmp[5] = ch1;
            return tmp[0] + tmp[1] + c.charAt(2) + c.charAt(3) + tmp[4] + tmp[5];
        }
        return c;
    }

    function int2Color(intVal) {
        var colorVal = (intVal & 0xFFFFFF).toString(16);
        return ("000000").substring(0, 6 - colorVal.length) + colorVal;
    }

    this.init = function(editor, btn) {
        this.buttonNode.className = this.buttonNode.className + " colorpicker";
        var oArrow = this.buttonNode.getElementsByTagName("div")[0];
        this.colorPreview = this.buttonNode.insertBefore(document.createElement('div'),
            oArrow);
        this.colorPreview.className = "colorpreview";
        var colorArrow = this.buttonNode.insertBefore(document.createElement('span'),
            oArrow);
        colorArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            jpf.popup.setContent(this.uniqueId, this.createPanelBody());
        }
        this.editor.showPopup(this, this.uniqueId, this.buttonNode, jpf.isIE6 ? 296 : 292, 181);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.setStyleMethod = function(useSpan) {
        if (typeof useSpan == "undefined")
            useSpan = true;
        // Tell Gecko to use or not the <SPAN> tag for the bold, italic and underline.
        try {
            this.editor.oDoc.execCommand('styleWithCSS', false, useSpan);
        }
        catch (ex) {
            this.editor.oDoc.execCommand('useCSS', false, !useSpan);
        }
    };

    this.queryState = function(editor) {
        var cmdName = this.name == "forecolor"
            ? 'ForeColor'
            : jpf.isIE ? 'BackColor' : 'HiliteColor';
        this.state = editor.getCommandState(cmdName);
        var currValue = editor.oDoc.queryCommandValue(cmdName);
        if (jpf.isIE)
            currValue = '#' + RGBToBGRToRGB(int2Color(currValue));
        if (currValue != this.colorPreview.style.backgroundColor)
            this.colorPreview.style.backgroundColor = currValue;
    };

    this.submit = function(e) {
        e = new jpf.AbstractEvent(e || window.event);
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sColor = e.target.getAttribute('rel');
        if (sColor) {
            jpf.popup.forceHide();
//            if (this.name == "backcolor" && jpf.isGecko)
//                this.setStyleMethod(true);
            this.editor.executeCommand(this.name == "forecolor"
                ? 'ForeColor'
                : jpf.isIE ? 'BackColor' : 'HiliteColor',
                '#' + sColor);
//            if (this.name == "backcolor" && jpf.isGecko)
//                this.setStyleMethod(false);
        }
    };

    this.createPanelBody = function() {
        if (!jpf.editor.colorPlugin.palette)
            generatePalette();

        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst"><a href="javascript:void(0);" onmousedown="jpf.popup.forceHide();">x</a></span>'];

        var row, col, colorCode, palette = jpf.editor.colorPlugin.palette;
        for (row = 0; row < palette[0].length; row++) {
            aHtml.push('<div class="editor_panelrow">');
            for (col= 0; col < palette.length; col++) {
                colorCode = palette[col][row].red +
                    palette[col][row].green +
                    palette[col][row].blue;
                aHtml.push('<a class="editor_smallcell editor_panelcell" style="background-color:#',
                    colorCode, ';" rel="', colorCode,
                    '" href="javascript:;" onmousedown="jpf.lookup(', this.uniqueId,
                    ').submit(event);">\
                    &nbsp;</a>');
            }
            aHtml.push('</div>');
        }
        panelBody.innerHTML = aHtml.join('');
        return panelBody;
    }
};
jpf.editor.colorPlugin.palette = null;

jpf.editor.Plugin('forecolor', jpf.editor.colorPlugin);
jpf.editor.Plugin('backcolor', jpf.editor.colorPlugin);

// #endif
