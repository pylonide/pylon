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
apf.LiveEdit.colorPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.buttonNode  = null;
    this.state       = apf.OFF;
    this.colspan     = 18;

    var panelBody;

    var colorAtoms = ["00", "33", "66", "99", "CC", "FF"];
    function generatePalette() {
        apf.LiveEdit.colorPlugin.palette = [];
        var r, g, b, iCol;
        for (r = 0; r < colorAtoms.length; r++) {
            for (g = 0; g < colorAtoms.length; g++) {
                iCol = (r % 3) * 6 + g;
                for (b = 0; b < colorAtoms.length; b++) {
                    if (!apf.LiveEdit.colorPlugin.palette[iCol])
                        apf.LiveEdit.colorPlugin.palette[iCol] = [];
                    apf.LiveEdit.colorPlugin.palette[iCol][(r < 3 ? 0 : 6) + b] = {
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
        if (typeof c == "string" && c.length > 0) {
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
        this.buttonNode.className = this.buttonNode.className + " dropdown_small";
        var oArrow = this.buttonNode.getElementsByTagName("div")[0];
        this.colorPreview = this.buttonNode.insertBefore(document.createElement("div"),
            oArrow);
        this.colorPreview.className = "colorpreview";
        var colorArrow = this.buttonNode.insertBefore(document.createElement("span"),
            oArrow);
        colorArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            apf.popup.setContent(this.$uniqueId, this.createPanelBody());
        }

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, apf.isIE6 ? 296 : 292, 167);
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
            this.editor.$activeDocument.execCommand("styleWithCSS", false, useSpan);
        }
        catch (ex) {
            this.editor.$activeDocument.execCommand("useCSS", false, !useSpan);
        }
    };

    this.queryState = function(editor) {
        var cmdName   = this.name == "forecolor"
            ? "ForeColor"
            : apf.isIE ? "BackColor" : "HiliteColor";
        this.state    = editor.$queryCommandState(cmdName);
        var currValue = "";
        try {
            currValue = editor.$queryCommandValue(cmdName);
        }
        catch (ex) {}
        if (apf.isIE)
            currValue = "#" + RGBToBGRToRGB(int2Color(currValue));
        if (currValue != this.colorPreview.style.backgroundColor)
            this.colorPreview.style.backgroundColor = currValue;
    };

    this.submit = function(e) {
        var el = e.target || e.srcElement;
        while (el.tagName.toLowerCase() != "a" && el.className != "editor_popup")
            el = el.parentNode;
        var sColor = el.getAttribute("rel");
        if (sColor) {
            apf.popup.forceHide();
//            if (this.name == "backcolor" && apf.isGecko)
//                this.setStyleMethod(true);
            this.editor.$execCommand(this.name == "forecolor"
                ? "ForeColor"
                : apf.isIE ? "BackColor" : "HiliteColor",
                "#" + sColor);
//            if (this.name == "backcolor" && apf.isGecko)
//                this.setStyleMethod(false);
        }
    };

    this.createPanelBody = function() {
        if (!apf.LiveEdit.colorPlugin.palette)
            generatePalette();

        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var aHtml = [];

        var row, col, colorCode, palette = apf.LiveEdit.colorPlugin.palette;
        for (row = 0; row < palette[0].length; row++) {
            aHtml.push('<div class="editor_panelrow">');
            for (col= 0; col < palette.length; col++) {
                colorCode = palette[col][row].red +
                    palette[col][row].green +
                    palette[col][row].blue;
                aHtml.push('<a class="editor_smallcell editor_panelcell" style="background-color:#',
                    colorCode, ';" rel="', colorCode,
                    '" href="javascript:;" onmousedown="apf.lookup(', this.$uniqueId,
                    ').submit(event);">\
                    &nbsp;</a>');
            }
            aHtml.push("</div>");
        }
        panelBody.innerHTML = aHtml.join("");

        return panelBody;
    }

    this.destroy = function() {
        panelBody = this.colorPreview = null;
        delete panelBody;
        delete this.colorPreview;
    };
};
apf.LiveEdit.colorPlugin.palette = null;

apf.LiveEdit.plugin("forecolor", apf.LiveEdit.colorPlugin);
apf.LiveEdit.plugin("backcolor", apf.LiveEdit.colorPlugin);

// #endif
