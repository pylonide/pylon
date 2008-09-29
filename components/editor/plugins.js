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

// #ifdef __EDITOR || __INC_ALL

jpf.editor.Plugin('contextualtyping', function() {
    this.name    = 'Contextualtyping';
    this.type    = Editor.TEXTMACRO;
    this.subType = null;
    this.hook    = 'ontyping';
    this.busy    = false;
    
    this.execute = function(editor, args) {
        this.busy = true;
        var i, iLength, j, content;
        var key = args[1];
        if (key == 32) {
            if (is_ie) {
                var crt_range = document.selection.createRange().duplicate();
                crt_range.moveStart("word", -5);
                for (i = editor.smileyImages.length - 1; i >= 0; i--) {
                    iLength = editor.smileyImages[i].length;
                    if (editor.smileyImages[i][iLength - 1].match(/http(s?):(\/){2}/))
                        src_prefix = "" ;
                    else
                        src_prefix = editor.smileyPath;
                    for (j = 0; j < iLength - 1; j++)
                        if (crt_range.findText(editor.smileyImages[i][j]))
                            crt_range.pasteHTML('&nbsp;<img src="' + src_prefix + editor.smileyImages[i][iLength - 1] + '" border="0" alt="">');
                }
            } else {
                var crt_sel = editor.oWin.getSelection();
                var crt_range = crt_sel.getRangeAt(0);
                var el = crt_range.startContainer;
                content = el.nodeValue;
                if (content) {
                    for (i = editor.smileyImages.length-1; i >= 0; i--) {
                        iLength = editor.smileyImages[i].length;
                        if (editor.smileyImages[i][iLength - 1].match(/http(s?):(\/){2}/))
                            src_prefix = "" ;
                        else
                            src_prefix = editor.smileyPath;

                        // Refresh content in case it has been changed by previous smiley replacement
                        content = el.nodeValue;

                        for (j = 0; j < iLength - 1; j++) {
                            // Find the position of the smiley sequence
                            var smileyPos = content.indexOf(editor.smileyImages[i][j]);
                            if (smileyPos > -1) {
                                // Create a range for the smiley sequence and remove the contents
                                crt_range.setStart(el, smileyPos);
                                crt_range.setEnd(el, smileyPos + editor.smileyImages[i][j].length);
                                crt_range.deleteContents();

                                // Add the smiley image to the range
                                smiley_img = new Image;
                                smiley_img.src = src_prefix + editor.smileyImages[i][iLength - 1];
                                smiley_img.border = 0;
                                crt_range.insertNode(smiley_img);

                                // And position the caret at the end of the next textNode
                                var nextTextNode = crt_range.endContainer.nextSibling;
                                while(nextTextNode.nodeType != 3) {
                                    nextTextNode = nextTextNode.nextSibling;
                                }
                                if(nextTextNode != crt_range.endContainer) {
                                    crt_range.setEnd(nextTextNode, nextTextNode.length);
                                    crt_range.collapse(false);
                                    crt_sel.removeAllRanges();
                                    crt_sel.addRange(crt_range);
                                }

                            }
                        }
                    }
                }
            }
        }
        this.busy = false;
    }
    
    this.queryState = function() {
        return this.state;
    }
});

jpf.editor.Plugin('restrictlength', function() {
    this.name    = 'RestrictLength';
    this.type    = Editor.TEXTMACRO;
    this.subType = null;
    this.hook    = 'ontyping';
    this.busy	 = false;
    this.execute = function(editor, args) {
        this.busy = true;
        var key = args[1];

        var oRoot = editor.oDoc || editor.oDoc.body;

        var aTextNodes = getElementsByNodeType(oRoot, 3);

        var iLength = 0;
        for(var i = 0; i < aTextNodes.length; i++) {
            iLength += aTextNodes[i].length;
        }

        var iMaxLength = editor.maxTextLength;
        if(iLength > iMaxLength) {
            var iExcessLength = iLength - iMaxLength;
            for(var i = aTextNodes.length -1 ; i >= 0; i--) {
                oTextNode = aTextNodes[i];
                if(oTextNode.length > iExcessLength) {
                    var s = oTextNode.nodeValue;
                    var oRemainder = oTextNode.splitText(oTextNode.length - iExcessLength);
                    oTextNode.parentNode.removeChild(oRemainder);
                    //this.setFocus();
                    break;
                }
                else {
                    iExcessLength -= oTextNode.length;
                    oTextNode.parentNode.removeChild(oTextNode);
                }
            }
        }

        this.busy = false;
    };
    
    this.queryState = function() {
        return this.state;
    }
});

jpf.editor.Plugin('emotions', function() {
    this.name        = 'emotions';
    this.icon        = 'emotions';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.buttonNode  = null;
    this.state       = jpf.editor.OFF;
    this.colspan     = 4;
    this.emotions    = [];

    var cacheId, panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor       = editor;
            this.emotionsPath = editor.$getOption("emotions", "path");
            
            // parse smiley images, or 'emotions'
            var i, node, oNode = editor.$getOption('emotions');
            for (i = 0; i < oNode.childNodes.length; i++) {
                node = oNode.childNodes[i];
                if (node.nodeType == 3 || node.nodeType == 4)
                    this.emotions = node.nodeValue.splitSafe(",");
            }
            
            this.createPanelBody();

            cacheId = this.editor.uniqueId + "_" + this.name;
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, jpf.isIE6 ? 118 : 115, 118);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };
    
    this.queryState = function() {
        return this.state;
    };
    
    this.submit = function(e) {
        this.editor.setFocus();
        var icon = e.target.getAttribute('rel');
        // @todo still iffy...
        if (!icon || icon == null)
            icon = e.target.parentNode.getAttribute('rel');
        if (!icon) return;
        this.editor.hidePopup();
        this.editor.insertHTML('<img src="' + this.emotionsPath
            + '/smiley-' + icon + '.gif' + '" alt="" border="0" />');
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>'];
        var emotions = this.emotions;
        var path     = this.emotionsPath;
        var rowLen = this.colspan - 1;
        for (var i = 0; i < emotions.length; i++) {
            if (i % this.colspan == 0)
                aHtml.push('<div class="editor_panelrow">');
                aHtml.push('<a class="editor_panelcell editor_largestcell" rel="',
                    emotions[i], '" href="javascript:;">\
                    <img border="0" src="', path, '/smiley-', emotions[i], '.gif" />\
                    </a>');
            if (i % this.colspan == rowLen)
                aHtml.push('</div>');
        }
        panelBody.innerHTML = aHtml.join('');

        panelBody.onclick = this.submit.bindWithEvent(this);
    };
});

jpf.editor.colorPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.buttonNode  = null;
    this.state       = jpf.editor.OFF;
    this.colspan     = 18;

    var cacheId, panelBody;

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
        this.colorPreview = this.buttonNode.appendChild(document.createElement('div'));
        this.colorPreview.className = "colorpreview";
        var colorArrow = this.buttonNode.appendChild(document.createElement('span'));
        colorArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_" + this.name;
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, jpf.isIE6 ? 276 : 273, 170);
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
        
        var currValue = editor.Selection.getContext().queryCommandValue(cmdName);
        if (jpf.isIE)
            currValue = '#' + RGBToBGRToRGB(int2Color(currValue));
        
        if (currValue != this.colorPreview.style.backgroundColor)
            this.colorPreview.style.backgroundColor = currValue;
    };

    this.submit = function(e) {
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sColor = e.target.getAttribute('rel');
        if (sColor) {
            this.editor.hidePopup();
            if (this.name == "backcolor" && jpf.isGecko)
                this.setStyleMethod(true);
            this.editor.executeCommand(this.name == "forecolor" 
                ? 'ForeColor'
                : jpf.isIE ? 'BackColor' : 'HiliteColor',
                '#' + sColor);
            if (this.name == "backcolor" && jpf.isGecko)
                this.setStyleMethod(false);
        }
    };

    this.createPanelBody = function() {
        if (!jpf.editor.colorPlugin.palette)
            generatePalette();

        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>'];

        var row, col, colorCode, palette = jpf.editor.colorPlugin.palette;
        for (row = 0; row < palette[0].length; row++) {
            aHtml.push('<div class="editor_panelrow">');
            for (col= 0; col < palette.length; col++) {
                colorCode = palette[col][row].red +
                    palette[col][row].green +
                    palette[col][row].blue;
                aHtml.push('<a class="editor_smallcell editor_panelcell" style="background-color:#',
                    colorCode, ';" rel="', colorCode, '" href="javascript:;">\
                    &nbsp;</a>');
            }
            aHtml.push('</div>');
        }
        panelBody.innerHTML = aHtml.join('');

        panelBody.onclick = this.submit.bindWithEvent(this);
    }
};
jpf.editor.colorPlugin.palette = null;

jpf.editor.Plugin('forecolor', jpf.editor.colorPlugin);
jpf.editor.Plugin('backcolor', jpf.editor.colorPlugin);

jpf.editor.Plugin('fonts', function() {
    this.name        = 'fonts';
    this.icon        = 'fonts';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.buttonNode  = null;
    this.state       = jpf.editor.OFF;
    this.colspan     = 1;
    this.fontNames   = {};

    var cacheId, panelBody;

    this.init = function(editor) {
        this.buttonNode.className = this.buttonNode.className + " fontpicker";
        this.fontPreview = this.buttonNode.getElementsByTagName('span')[0];
        this.fontPreview.className += " fontpreview";
        var fontArrow = this.buttonNode.appendChild(document.createElement('span'));
        fontArrow.className = "selectarrow";
        
        this.editor = editor;
            
        // parse fonts
        var l, j, font, fonts, node;
        var oNode = editor.$getOption('fonts').childNodes[0];
        while(oNode) {
            fonts = oNode.nodeValue.splitSafe('(?:;|=)');
            if (fonts[0]) {
                for (j = 0, l = fonts.length; j < l; j++)
                    this.fontNames[fonts[j]] = fonts[++j];
                break;
            }
            oNode = oNode.nextSibling
        }
    };

    this.execute = function() {
        if (!panelBody) {
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_fonts";
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, 105);
        //return button id, icon and action:
        
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        this.state = editor.getCommandState('FontName');

        var currValue = editor.Selection.getContext().queryCommandValue('FontName')
        if (jpf.isGecko && !currValue && editor.Selection.isCollapsed()) {
        }
        if (!currValue || (this.fontNames[currValue] && this.fontPreview.innerHTML != currValue)) {
            this.fontPreview.style.fontFamily = currValue ? this.fontNames[currValue] : "inherit";
            this.fontPreview.innerHTML = currValue ? currValue : "Font";
        }
    };

    this.submit = function(e) {
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sFont = e.target.getAttribute('rel');
        if (sFont) {
            this.editor.hidePopup();
            this.editor.executeCommand('FontName', sFont);
        }
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>'];

        for (var i in this.fontNames) {
            aHtml.push('<a class="editor_panelcell editor_font" style="font-family:',
                this.fontNames[i], ';" rel="', i,
                '" href="javascript:;">', i, '</a>');
        }
        panelBody.innerHTML = aHtml.join('');

        panelBody.onclick = this.submit.bindWithEvent(this);
    };
});

jpf.editor.Plugin('fontsize', function() {
    this.name        = 'fontsize';
    this.icon        = 'fontsize';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.buttonNode  = null;
    this.state       = jpf.editor.OFF;

    var cacheId, panelBody;

    // this hashmap maps font size number to it's equivalent in points (pt)
    var sizeMap = {
        '1' : '8',
        '2' : '10',
        '3' : '12',
        '4' : '14',
        '5' : '18',
        '6' : '24',
        '7' : '36'
    };

    this.init = function(editor) {
        this.buttonNode.className = this.buttonNode.className + " fontsizepicker";
        this.sizePreview = this.buttonNode.getElementsByTagName('span')[0];
        this.sizePreview.className += " fontsizepreview";
        var sizeArrow = this.buttonNode.appendChild(document.createElement('span'));
        sizeArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            
            // parse font sizes
            var i, node, oNode = editor.$getOption('fontsizes');
            for (i = 0; i < oNode.childNodes.length; i++) {
                node = oNode.childNodes[i];
                if (node.nodeType == 3 || node.nodeType == 4)
                    this.fontSizes = node.nodeValue.splitSafe(",");
            }
            
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_fontsize";
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, 203);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        this.state = editor.getCommandState('FontSize');

        var currValue = editor.Selection.getContext().queryCommandValue('FontSize')
        if (!currValue || this.sizePreview.innerHTML != currValue) {
            this.sizePreview.innerHTML = currValue ? currValue : "Size";
        }
    };

    this.submit = function(e) {
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sSize = e.target.getAttribute('rel');
        if (sSize) {
            this.editor.hidePopup();
            this.editor.executeCommand('FontSize', sSize);
        }
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>'];

        var aSizes = this.fontSizes;
        for (var i = 0; i < aSizes.length; i++) {
            aHtml.push('<a class="editor_panelcell editor_fontsize" style="font-size:',
                sizeMap[aSizes[i]], 'pt;height:', sizeMap[aSizes[i]], 'pt;line-height:', sizeMap[aSizes[i]], 'pt;" rel="', aSizes[i],
                '" href="javascript:;">', aSizes[i], ' (', sizeMap[aSizes[i]], 'pt)</a>');
        }
        panelBody.innerHTML = aHtml.join('');

        panelBody.onclick = this.submit.bindWithEvent(this);
    };
});

jpf.editor.clipboardPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = this.name == "pastetext" ? 'ctrl+shift+v' : 'ctrl+shift+w';
    this.state       = jpf.editor.OFF;

    var cacheId, panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_" + this.name;
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, 300, 290);
        this.oArea.focus();
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        return this.state;
    };

    this.submit = function(e) {
        this.editor.hidePopup();
        
        var sContent = this.oArea.value;
        if (!sContent || sContent.length == 0) return;

        var rl = ['\u2122', '<sup>TM</sup>', '\u2026', '...', '\u201c|\u201d', '"', '\u2019,\'', '\u2013|\u2014|\u2015|\u2212', '-'];
        for (var i = 0; i < rl.length; i += 2)
            sContent = sContent.replace(new RegExp(rl[i], 'gi'), rl[i+1]);
        
        if (this.name == "pastetext") {
            sContent = sContent.replace(/\r\n/g, '<br />')
                .replace(/\r/g, '<br />')
                .replace(/\n/g, '<br />');
        }
        else {
            // Cleanup Word content
            var bull   = String.fromCharCode(8226);
            var middot = String.fromCharCode(183);
            // convert headers to strong typed character (BOLD)
            sContent   = sContent.replace(new RegExp('<p class=MsoHeading.*?>(.*?)<\/p>', 'gi'), '<p><b>$1</b></p>')
                .replace(new RegExp('tab-stops: list [0-9]+.0pt">', 'gi'), '">' + "--list--")
                .replace(new RegExp(bull + "(.*?)<BR>", "gi"), "<p>" + middot + "$1</p>")
                .replace(new RegExp('<SPAN style="mso-list: Ignore">', 'gi'), "<span>" + bull) // Covert to bull list
                .replace(/<o:p><\/o:p>/gi, "")
                .replace(new RegExp('<br style="page-break-before: always;.*>', 'gi'), '-- page break --') // Replace pagebreaks
                .replace(new RegExp('<(!--)([^>]*)(--)>', 'g'), "")  // Word comments
                .replace(/<\/?span[^>]*>/gi, "") //remove Word-generated superfluous spans
                .replace(new RegExp('<(\\w[^>]*) style="([^"]*)"([^>]*)', 'gi'), "<$1$3") //remove inline style attributes
                .replace(/<\/?font[^>]*>/gi, "")
                .replace(/<(\w[^>]*) class=([^ |>]*)([^>]*)/gi, "<$1$3") // Strips class attributes.
                //.replace(new RegExp('<(\\w[^>]*) class="?mso([^ |>]*)([^>]*)', 'gi'), "<$1$3"); //MSO class attributes
                //.replace(new RegExp('href="?' + this._reEscape("" + document.location) + '', 'gi'), 'href="' + this.editor.documentBaseURI.getURI());
                .replace(/<(\w[^>]*) lang=([^ |>]*)([^>]*)/gi, "<$1$3")
                .replace(/<\\?\?xml[^>]*>/gi, "")
                .replace(/<\/?\w+:[^>]*>/gi, "")
                .replace(/-- page break --\s*<p>&nbsp;<\/p>/gi, "") // Remove pagebreaks
                .replace(/-- page break --/gi, "") // Remove pagebreaks
                .replace('', '' ,'gi')
                .replace('</p>', '<br /><br />' ,'gi') //convert <p> newlines to <br> ones
                .replace(/<\/?p[^>]*>/gi, "")
                .replace(/<\/?div[^>]*>/gi, "");
                //.replace(/\/?&nbsp;*/gi, ""); &nbsp;
                //.replace(/<p>&nbsp;<\/p>/gi, '');

            // Convert all middlot lists to UL lists
            var div = document.createElement("div");
            div.innerHTML = sContent;
            // Convert all middot paragraphs to li elements
            while (this._convertMiddots(div, "--list--")); // bull
            while (this._convertMiddots(div, middot, "unIndentedList")); // Middot
            while (this._convertMiddots(div, bull)); // bull
            sContent = div.innerHTML;

            // Replace all headers with strong and fix some other issues
            //sContent = sContent.replace(/<h[1-6]>&nbsp;<\/h[1-6]>/gi, '<p>&nbsp;&nbsp;</p>')
            //    .replace(/<h[1-6]>/gi, '<p><b>')
            //    .replace(/<\/h[1-6]>/gi, '</b></p>')
            //    .replace(/<b>&nbsp;<\/b>/gi, '<b>&nbsp;&nbsp;</b>')
            //    .replace(/^(&nbsp;)*/gi, '');
            sContent = sContent.replace(/--list--/gi, ""); // Remove temporary --list--
        }
        this.editor.insertHTML(sContent);
    };
    
    this._convertMiddots = function(div, search, class_name) {
        var mdot = String.fromCharCode(183), bull = String.fromCharCode(8226);
        var nodes, prevul, i, p, ul, li, np, cp;

        nodes = div.getElementsByTagName("p");
        for (i = 0; i < nodes.length; i++) {
            p = nodes[i];

            // Is middot
            if (p.innerHTML.indexOf(search) != 0) continue;

            ul = document.createElement("ul");
            if (class_name)
                ul.className = class_name;

            // Add the first one
            li = document.createElement("li");
            li.innerHTML = p.innerHTML.replace(new RegExp('' + mdot + '|' + bull + '|--list--|&nbsp;', "gi"), '');
            ul.appendChild(li);

            // Add the rest
            np = p.nextSibling;
            while (np) {
                // If the node is whitespace, then
                // ignore it and continue on.
                if (np.nodeType == 3 && new RegExp('^\\s$', 'm').test(np.nodeValue)) {
                    np = np.nextSibling;
                    continue;
                }

                if (search == mdot) {
                    if (np.nodeType == 1 && new RegExp('^o(\\s+|&nbsp;)').test(np.innerHTML)) {
                        // Second level of nesting
                        if (!prevul) {
                            prevul = ul;
                            ul = document.createElement("ul");
                            prevul.appendChild(ul);
                        }
                        np.innerHTML = np.innerHTML.replace(/^o/, '');
                    }
                    else {
                        // Pop the stack if we're going back up to the first level
                        if (prevul) {
                            ul = prevul;
                            prevul = null;
                        }
                        // Not element or middot paragraph
                        if (np.nodeType != 1 || np.innerHTML.indexOf(search) != 0)
                            break;
                    }
                }
                else {
                    // Not element or middot paragraph
                    if (np.nodeType != 1 || np.innerHTML.indexOf(search) != 0)
                        break;
                }

                cp = np.nextSibling;
                li = document.createElement("li");
                li.innerHTML = np.innerHTML.replace(new RegExp('' + mdot + '|' + bull + '|--list--|&nbsp;', "gi"), '');
                np.parentNode.removeChild(np);
                ul.appendChild(li);
                np = cp;
            }
            p.parentNode.replaceChild(ul, p);
            return true;
        }
        return false;
    };
    
    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var idArea   = 'editor_' + this.editor.uniqueId + '_' + this.name + '_input';
        var idInsert = 'editor_' + this.editor.uniqueId + '_' + this.name + '_insert';
        panelBody.innerHTML = [
           '<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idArea, '">Use CTRL+V on your keyboard to paste the text into the window.</label>\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <textarea id="', idArea, '" name="', idArea, '"  wrap="soft" dir="ltr" \
                  cols="60" rows="10" class="editor_textarea"></textarea>\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <button class="editor_positionedbutton" id="' + idInsert + '">Insert</button>\
            </div>'
        ].join('');

        this.oArea = document.getElementById(idArea);
        document.getElementById(idInsert).onclick = this.submit.bindWithEvent(this);
    };
};

jpf.editor.Plugin('pastetext', jpf.editor.clipboardPlugin);
jpf.editor.Plugin('pasteword', jpf.editor.clipboardPlugin);


jpf.editor.searchPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = this.name == "search" ? 'ctrl+f' : 'ctrl+shift+f';
    this.state       = jpf.editor.OFF;

    var cacheId, panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_" + this.name;
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, this.name == "search" ? 200 : 260, this.name == "search" ? 96 : 116);
        // prefill search box with selected text
        this.oSearch.value = this.editor.Selection.getContent();
        this.oSearch.focus();
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        return this.state;
    };

    this.submit = function(e) {
        var val = this.oSearch.value, bMatchCase = this.oCase.checked, flag = 0;
        if (!val)
            return;

        this.editor.Selection.collapse(false);

        if (bMatchCase) //IE specific flagging
            flag = flag | 4;

        var found = false;

        if (jpf.isIE) {
            var range = this.editor.Selection.getRange();
            if (range.findText(val, 1, flag)) {
                range.scrollIntoView();
                range.select();
                found = true;
            }
            this.storeSelection();
        }
        else {
            if (this.editor.oWin.find(val, bMatchCase, false, true, false, false, false))
                found = true;
            //else
            //    fix();
        }
        if (this.oReplBtn)
            this.oReplBtn.disabled = !found;
        if (!found)
            alert("No occurences found for '" + val + "'");
    };

    function onDoReplClick(e) {
        if (!this.editor.Selection.isCollapsed())
            this.replace();
    }

    function onReplAllClick(e) {
        var val = this.oSearch.value, bMatchCase = this.oCase.checked, flag = 0;
        // Move caret to beginning of text
        this.editor.executeCommand('SelectAll');
        this.editor.Selection.collapse(true);

        var range = this.editor.Selection.getRange(), found = 0;
        
        if (bMatchCase) //IE specific flagging
            flag = flag | 4;

        if (jpf.isIE) {
            while (range.findText(val, 1, flag)) {
                range.scrollIntoView();
                range.select();
                this.replace();
                found++;
            }
            this.storeSelection();
        } else {
            while (this.editor.oWin.find(val, bMatchCase, false, false, false, false, false)) {
                this.replace();
                found++;
            }
        }

        if (found > 0)
            alert(found + " occurences found and replaced with '" + this.oReplace.value + "'");
        else
            alert("No occurences found for '" + val + "'");
    }
    
    this.replace = function() {
        var sRepl = this.oReplace.value;
        // Needs to be duplicated due to selection bug in IE
        if (jpf.isIE) {
            this.restoreSelection();
            this.editor.Selection.getRange().duplicate().pasteHTML(sRepl);
        } else
            this.editor.Selection.getContext().execCommand('InsertHTML', false, sRepl);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var idSearch  = 'editor_' + this.editor.uniqueId + '_' + this.name + '_input';
        var idReplace = 'editor_' + this.editor.uniqueId + '_' + this.name + '_replace';
        var idCase    = 'editor_' + this.editor.uniqueId + '_' + this.name + '_case';
        var idFind    = 'editor_' + this.editor.uniqueId + '_' + this.name + '_find';
        var idDoRepl  = 'editor_' + this.editor.uniqueId + '_' + this.name + '_dorepl';
        var idReplAll = 'editor_' + this.editor.uniqueId + '_' + this.name + '_replall';
        panelBody.innerHTML = [
           '<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idSearch, '">Find what</label>\
                <input type="text" id="', idSearch, '" class="editor_input" name="', idSearch, '" value="" />\
            </div>',
            this.name == "replace" ?
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idReplace + '">Replace with</label>\
                <input type="text" id="' + idReplace + '" class="editor_input" name="' + idReplace + '" value="" />\
            </div>' : '',
           '<div class="editor_panelrow editor_panelrowinput">\
                <label for="', idCase, '">Match case</label>\
                <input type="checkbox" id="', idCase, '" name="', idCase, '" class="editor_checkbox" value="" />\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <button id="', idFind, '">Find next</button>',
                this.name == "replace" ?
               '<button id="' + idDoRepl + '">Replace</button>\
                <button id="' + idReplAll + '">Replace all</button>' : '',
           '</div>'
        ].join('');

        this.oSearch    = document.getElementById(idSearch);
        this.oCase      = document.getElementById(idCase);
        document.getElementById(idFind).onclick = this.submit.bindWithEvent(this);
        if (this.name == "replace") {
            this.oReplace    = document.getElementById(idReplace);
            this.oReplBtn    = document.getElementById(idDoRepl);
            this.oReplAllBtn = document.getElementById(idReplAll);
            this.oReplBtn.onclick    = onDoReplClick.bindWithEvent(this);
            this.oReplAllBtn.onclick = onReplAllClick.bindWithEvent(this);
            this.oReplBtn.disabled   = true;
        }
    };
};

jpf.editor.Plugin('search',  jpf.editor.searchPlugin);
jpf.editor.Plugin('replace', jpf.editor.searchPlugin);

jpf.editor.listPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        editor.executeCommand(this.name == "bullist"
            ? 'InsertUnorderedList'
            : 'InsertOrderedList');
    };
    
    this.queryState = function(editor) {
        return editor.getCommandState(this.name == "bullist"
            ? 'InsertUnorderedList'
            : 'InsertOrderedList');
    };
};

jpf.editor.Plugin('bullist', jpf.editor.listPlugin);
jpf.editor.Plugin('numlist', jpf.editor.listPlugin);

jpf.editor.Plugin('blockquote', function(){
    this.name        = 'blockquote';
    this.icon        = 'blockquote';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+b';
    this.buttonBuilt = false;
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        editor.executeCommand('FormatBlock', 'BLOCKQUOTE');
    };
    
    this.queryState = function(editor) {
        return editor.getCommandState('FormatBlock');
    };
});

jpf.editor.Plugin('link', function(){
    this.name        = 'link';
    this.icon        = 'link';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+l';
    this.state       = jpf.editor.OFF;
    
    var cacheId, panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_link";
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, jpf.isIE6 ? 200 : 193);
        this.oUrl.focus();
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
        if (editor.Selection.isCollapsed() || editor.Selection.getSelectedNode().tagName == "A")
            return jpf.editor.DISABLED;
        return this.state;
    };

    this.submit = function(e) {
        this.editor.hidePopup();
        
        if (!this.oUrl.value) return;
        
        this.editor.executeCommand('CreateLink', 'javascript:jpftmp(0);');
        var oLink, aLinks = this.editor.oDoc.getElementsByTagName('a');
        for (var i = 0; i < aLinks.length && !oLink; i++)
            if (aLinks[i].href == 'javascript:jpftmp(0);')
                oLink = aLinks[i];
        if (oLink) {
            oLink.href   = this.oUrl.value;
            oLink.target = this.oTarget.value;
            oLink.title  = this.oTitle.value;
        }
        this.editor.Selection.collapse(false);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var idUrl    = 'editor_' + this.editor.uniqueId + '_link_url';
        var idTarget = 'editor_' + this.editor.uniqueId + '_link_target';
        var idTitle  = 'editor_' + this.editor.uniqueId + '_link_title';
        var idButton = 'editor_' + this.editor.uniqueId + '_link_button';
        panelBody.innerHTML = [
           '<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idUrl, '">Link URL</label>\
                <input type="text" id="', idUrl, '" name="', idUrl, '" class="editor_input" value="" />\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idTarget, '">Target</label>\
                <select id="', idTarget, '" name="', idTarget, '">\
                    <option value="_self">Open in this window/ frame</option>\
                    <option value="_blank">Open in new window (_blank)</option>\
                    <option value="_parent">Open in parent window/ frame (_parent)</option>\
                    <option value="_top">Open in top frame (replaces all frames) (_top)</option>\
                </select>\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idTitle, '">Title</label>\
                <input type="text" id="', idTitle, '" name="', idTitle, '" class="editor_input" value="" />\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <button id="', idButton, '">Insert</button>\
            </div>'
        ].join('');

        document.getElementById(idButton).onclick = this.submit.bindWithEvent(this);
        this.oUrl    = document.getElementById(idUrl);
        this.oTarget = document.getElementById(idTarget);
        this.oTitle  = document.getElementById(idTitle);
    };
});

jpf.editor.Plugin('unlink', function(){
    this.name        = 'unlink';
    this.icon        = 'unlink';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+l';
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        if (this.queryState(editor) == jpf.editor.DISABLED)
            return;
        
        var oNode = editor.Selection.getSelectedNode();
        if (oNode.tagName == "A") {
            var txt = oNode.innerHTML;
            editor.Selection.selectNode(oNode);
            editor.Selection.remove();
            editor.Selection.collapse();
            editor.insertHTML(txt);
        }
    };
    
    this.queryState = function(editor) {
        if (editor.Selection.getSelectedNode().tagName == "A")
            return jpf.editor.OFF;

        return jpf.editor.DISABLED;
    };
});

jpf.editor.Plugin('anchor', function() {
    this.name        = 'anchor';
    this.icon        = 'anchor';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+a';
    this.state       = jpf.editor.OFF;
    
    var cacheId, panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_anchor";
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, 215, 72);
        this.oName.focus();
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };
    
    this.queryState = function(editor) {
        // @todo: for webkit compat, we need to insert images instead of inline a elements
        var oNode = editor.Selection.getSelectedNode();
        if (oNode.tagName == "A" && oNode.getAttribute('name'))
            return jpf.editor.ON;

        return this.state;
    };
    
    this.submit = function(e) {
        this.editor.hidePopup();
        
        if (!this.oName.value) return;

        this.storeSelection();
        this.editor.insertHTML('<a name="' + this.oName.value + '" class="itemAnchor" />');
        this.restoreSelection();
        this.editor.Selection.collapse(false);
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var idName   = 'editor_' + this.editor.uniqueId + '_anchor_url';
        var idButton = 'editor_' + this.editor.uniqueId + '_anchor_button';
        panelBody.innerHTML = [
           '<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="', idName, '">Anchor name</label>\
                <input type="text" id="', idName, '" name="', idName, '" class="editor_input" value="" />\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <button id="', idButton, '">Insert</button>\
            </div>'
        ].join('');

        document.getElementById(idButton).onclick = this.submit.bindWithEvent(this);
        this.oName = document.getElementById(idName);
    };
});

jpf.editor.Plugin('table', function() {
    this.name        = 'table';
    this.icon        = 'table';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+t';
    this.state       = jpf.editor.OFF;
    
    var cacheId, panelBody, oTable, oStatus;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_table";
            jpf.Popup.setContent(cacheId, panelBody)
        }
        else
            resetTableMorph.call(this);
        this.editor.showPopup(this, cacheId, this.buttonNode);
        setTimeout(function() {
            var iWidth  = oTable.rows[0].cells.length * (jpf.isIE ? 25 : 22);
            var iHeight = oTable.rows.length * (jpf.isIE ? 25 : 22);

            panelBody.style.width  = (iWidth + 6) + "px";
            panelBody.style.height = (iHeight + 36) + "px";
        });
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };
    
    this.queryState = function(editor) {
        return this.state;
    };
    
    this.submit = function(oSize) {
        this.editor.hidePopup();

        if (oSize[0] < 0 || oSize[1] < 0) return;
        
        var i, j, k, l, aOut = ['<table cellpadding="2" cellspacing="0" border="1" width="100%">'];
        for (i = 0, j = oSize[0]; i <= j; i++) {
            aOut.push('<tr>');
            for (k = 0, l = oSize[1]; k <= l; k++)
                aOut.push('<td></td>');
            aOut.push('</tr>')
        }
        aOut.push('<table>')

        this.storeSelection();
        this.editor.insertHTML(aOut.join(''));
        this.restoreSelection();
        this.editor.Selection.collapse(false);
    };

    this.getCellCoords = function(oCell) {
        var oRow;
        for (var i = 0, j = oTable.rows.length; i < j; i++) {
            oRow = oTable.rows[i];
            if (oRow != oCell.parentNode) continue;
            for (var k = 0, l = oRow.cells.length; k < l; k++)
                if (oRow.cells[k] == oCell)
                    return [i, k];
        }
        return [-1, -1];
    }

    var bMorphing = false, oMorphCurrent, oMorphCell;
    function mouseDown(e) {
        if (e.target.tagName != "TD") return;
        var coords = this.getCellCoords(e.target);
        // check if we're dealing with the last visible table cell:
        if (coords[0] != oTable.rows.length - 1
          || coords[1] != oTable.rows[oTable.rows.length - 1].cells.length - 1)
            return;

        bMorphing = true;
        oMorphCurrent = e.client;
        oMorphCell = e.target;
        var _self = this;
        document.onmousemove = function(e) {
            if (!bMorphing) return;
            e = new jpf.AbstractEvent(e || window.event);
            var oLastRow = oTable.rows[oTable.rows.length - 1];
            if (e.target.tagName == "TD" && oLastRow.cells[oLastRow.cells.length - 1] != e.target)
               return mouseUp.call(_self, e, true);
            morphTable(e.client);
        }
    }

    function mouseUp(e, noSubmit) {
        bMorphing   = false;
        oMorphCurrent = null;
        document.onmousemove = null;
        if (e.target.tagName == "TD" && !noSubmit)
            return this.submit(this.getCellCoords(e.target));
        mouseOver.call(this, e);
        return false;
    }

    function morphTable(oClient) {
        var i, j, oCell, oRow;
        var deltaX = Math.floor((oClient.x - oMorphCurrent.x) / 2);
        if (deltaX > 0) {
            panelBody.style.width = (panelBody.offsetWidth + deltaX) + "px";
            //bordermargin = 8
            deltaX = Math.floor(((panelBody.offsetWidth - 8) - oTable.offsetWidth) / 26);
            if (deltaX >= 1){
                // add a row to the start of the table (selected)...
                while (deltaX) {
                    for (i = 0, j = oTable.rows.length; i < j; i++) {
                        oCell = oTable.rows[i].insertCell(0);
                        oCell.className = "selected";
                    }
                    --deltaX;
                }
            }
        }
        var deltaY = Math.floor((oClient.y - oMorphCurrent.y) / 2);
        if (deltaY > 0) {
            panelBody.style.height = (panelBody.offsetHeight + deltaY) + "px";
            //topbar = 8, bottombar = 20
            deltaY = Math.floor(((panelBody.offsetHeight - 28) - oTable.offsetHeight) / 26);
            if (deltaY >= 1){
                // add a column to the start of the table (selected)
                while (deltaY) {
                    oRow = oTable.insertRow(-1);
                    for (i = 0, j = oTable.rows[0].cells.length; i < j; i++) {
                        oCell = oRow.insertCell(-1);
                        oCell.className = "selected";
                    }
                    --deltaY;
                }
            }
        }
        oMorphCurrent = oClient;
    }
    
    function resetTableMorph() {
        var i, j, oRow;
        mouseOut.call(this, {target: {tagName: ""}});
        for (i = oTable.rows.length - 1; i >= 0; i--) {
            if (i >= 5) {
                oTable.deleteRow(i);
                continue;
            }
            oRow = oTable.rows[i];
            for (j = oRow.cells.length - 1; j >= 5; j--)
                oRow.deleteCell(i);
        }
    }
    
    function mouseOver(e) {
        if (e.target.tagName != "TD" && !bMorphing) return;
        var oRow, oCell, coords = this.getCellCoords(e.target);
        for (var i = 0, j = oTable.rows.length; i < j; i++) {
            oRow = oTable.rows[i];  
            for (var k = 0, l = oRow.cells.length; k < l; k++) {
                oCell = oRow.cells[k];
                if ((i <= coords[0] && k <= coords[1]) || bMorphing)
                    oCell.className = "selected";
                else
                    oCell.className = "";
            }
        }
        if (bMorphing)
            oStatus.innerHTML = oTable.rows.length + " x " + oTable.rows[0].cells.length + " Table";
        else if (coords[0] >= 0 && coords[1] >= 0)
            oStatus.innerHTML = (coords[0] + 1) + " x " + (coords[1] + 1) + " Table";
    }
    
    function mouseOut(e) {
        if (bMorphing || e.target.tagName == "TD" || e.target.tagName == "TBODY") return;
        var i, j, oRow;
        for (i = 0, j = oTable.rows.length; i < j; i++) {
            oRow = oTable.rows[i];
            for (var k = 0, l = oRow.cells.length; k < l; k++)
                oRow.cells[k].className = "";
        }
        oStatus.innerHTML = "Cancel";
    }

    function statusClick(e) {
        mouseOut.call(this, e);
        this.editor.hidePopup();
    }

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup editor_tablepopup";
        var idTable   = 'editor_' + this.editor.uniqueId + '_table';
        var idStatus  = 'editor_' + this.editor.uniqueId + '_table_status';
        panelBody.innerHTML =
           '<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>\
            <table cellpadding="0" cellspacing="2" border="0" id="' + idTable + '" class="editor_paneltable">\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            <tr>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
                <td>&nbsp;</td>\
            </tr>\
            </table>\n\
            <div id="' + idStatus + '" class="editor_paneltablecancel">Cancel</div>';

        oTable = document.getElementById(idTable);
        oTable.onmousedown = mouseDown.bindWithEvent(this);
        oTable.onmouseup   = mouseUp.bindWithEvent(this);
        oTable.onmouseover = mouseOver.bindWithEvent(this);
        oTable.onmouseout  = mouseOut.bindWithEvent(this);
        oStatus = document.getElementById(idStatus);
        oStatus.onmouseover = mouseOut.bindWithEvent(this);
        oStatus.onmousedown = statusClick.bindWithEvent(this);
        panelBody.onselectstart = function() { return false; };
    };
});

jpf.editor.Plugin('code', function() {
    this.name        = 'code';
    this.icon        = 'code';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+h';
    this.state       = jpf.editor.OFF;

    var oPreview;

    this.execute = function(editor) {
        //this.buttonNode.onclick(editor.mimicEvent());
        if (!oPreview)
            drawPreview(editor);

        if (oPreview.style.display == "none") {
            // update the contents of the hidden textarea
            oPreview.value = editor.getValue();
            // show the textarea and position it correctly...
            oPreview.style.display = "";
        }
        else {
            oPreview.style.display = "none";
            if (editor.parseHTML(oPreview.value.replace(/\n/g, '')) != editor.getValue())
                editor.setHTML(oPreview.value);
        }
        editor.notify('code', this.queryState());
    };

    function drawPreview(editor) {
        oPreview = editor.oExt.appendChild(document.createElement('textarea'));
        oPreview.rows = 15;
        oPreview.cols = 10;
        // show the textarea and position it correctly...
        oPreview.style.width    = editor.oExt.offsetWidth - 4 + "px";
        oPreview.style.height   = editor.oExt.offsetHeight - editor.oToolbar.offsetHeight - 4 + "px";
        oPreview.style.display  = "none";
    }
    
    this.queryState = function(editor) {
        if (!oPreview || oPreview.style.display == "none")
            return jpf.editor.OFF;
        return jpf.editor.ON;
    };
});

jpf.editor.dateTimePlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = sName == "insertdate" ? 'ctrl+shift+d' : 'ctrl+shift+t';
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        this.buttonNode.onclick(editor.mimicEvent());
        // @todo Internationalize this!
        var dt = new Date();
        if (this.name == "insertdate")
            editor.insertHTML(dt.getDate() + '-' + dt.getMonth() + '-' + dt.getFullYear());
        else
            editor.insertHTML(dt.getHours().toPrettyDigit() + ":"
              + dt.getMinutes().toPrettyDigit() + ":"
              + dt.getSeconds().toPrettyDigit());
    };
    
    this.queryState = function() {
        return this.state;
    };
};

jpf.editor.Plugin('insertdate', jpf.editor.dateTimePlugin);
jpf.editor.Plugin('inserttime', jpf.editor.dateTimePlugin);

jpf.editor.subSupCommand = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = sName == "sub" ? 'ctrl+alt+s' : 'ctrl+shift+s';
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        if (jpf.isGecko)
            editor.executeCommand(this.name == "sub" ? 'subscript' : 'superscript');
        else {
            // @todo build support for IE on this one...
        }
    };
    
    this.queryState = function(editor) {
        if (jpf.isGecko) {
            return editor.getCommandState(this.name == "sub"
                ? 'subscript'
                : 'superscript');
        }
        else {
            // @todo build support for IE on this one...
        }
        return this.state;
    };
}
jpf.editor.Plugin('sub', jpf.editor.subSupCommand);
jpf.editor.Plugin('sup', jpf.editor.subSupCommand);

jpf.editor.Plugin('hr', function(){
    this.name        = 'hr';
    this.icon        = 'hr';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+h';
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        if (jpf.isGecko || jpf.isIE)
            editor.insertHTML('<hr />');
        else
            editor.executeCommand('InsertHorizontalRule');
    };
    
    this.queryState = function(editor) {
        return this.state;
    };
});

jpf.editor.Plugin('charmap', function() {
    this.name        = 'charmap';
    this.icon        = 'charmap';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.buttonNode  = null;
    this.state       = jpf.editor.OFF;
    this.colspan     = 20;

    var cacheId, panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_" + this.name;
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, jpf.isIE6 ? 406 : 403, 212);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };
    
    this.queryState = function() {
        return this.state;
    };

    var chars = ["!","&quot;","#","$","%","&amp;","\\'","(",")","*",
              "+","-",".","/","0","1","2","3","4","5","6","7","8","9",":",
              ";","&lt;","=","&gt;","?","@","A","B","C","D","E","F","G","H",
              "I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W",
              "X","Y","Z","[","]","^","_","`","a","b","c","d","e","f","g",
              "h","i","j","k","l","m","n","o","p","q","r","s","t","u","v",
              "w","x","y","z","{","|","}","~","&#8364;","&lsquo;","&rsquo;",
              "&rsquo;","&ldquo;","&rdquo;","&ndash;","&mdash;","&iexcl;",
              "&cent;","&pound;","&curren;","&yen;","&brvbar;","&sect;",
              "&uml;","&copy;","&ordf;","&laquo;","&not;","&reg;","&macr;",
              "&deg;","&plusmn;","&sup2;","&sup3;","&acute;","&micro;","&para;",
              "&middot;","&cedil;","&sup1;","&ordm;","&raquo;","&frac14;",
              "&frac12;","&frac34;","&iquest;","&Agrave;","&Aacute;","&Acirc;",
              "&Atilde;","&Auml;","&Aring;","&AElig;","&Ccedil;","&Egrave;",
              "&Eacute;","&Ecirc;","&Euml;","&Igrave;","&Iacute;","&Icirc;",
              "&Iuml;","&ETH;","&Ntilde;","&Ograve;","&Oacute;","&Ocirc;",
              "&Otilde;","&Ouml;","&times;","&Oslash;","&Ugrave;","&Uacute;",
              "&Ucirc;","&Uuml;","&Yacute;","&THORN;","&szlig;","&agrave;",
              "&aacute;","&acirc;","&atilde;","&auml;","&aring;","&aelig;",
              "&ccedil;","&egrave;","&eacute;","&ecirc;","&euml;","&igrave;",
              "&iacute;","&icirc;","&iuml;","&eth;","&ntilde;","&ograve;",
              "&oacute;","&ocirc;","&otilde;","&ouml;","&divide;","&oslash;",
              "&ugrave;","&uacute;","&ucirc;","&uuml;","&uuml;","&yacute;",
              "&thorn;","&yuml;","&OElig;","&oelig;","&sbquo;","&#8219;",
              "&bdquo;","&hellip;","&trade;","&#9658;","&bull;","&rarr;",
              "&rArr;","&hArr;","&diams;","&asymp;"];

    this.submit = function(e) {
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sCode = e.target.getAttribute('rel');
        if (sCode) {
            this.editor.hidePopup();
            this.editor.insertHTML(sCode);
        }
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst"><a href="javascript:jpf.Popup.hide();">x</a></span>'];
        var rowLen = this.colspan - 1;
        for (var i = 0; i < chars.length; i++) {
            if (i % this.colspan == 0)
                aHtml.push('<div class="editor_panelrow">');
            aHtml.push('<a class="editor_panelcell editor_largecell" style="background-color:#',
                chars[i], ';" rel="', chars[i], '" href="javascript:;">\
                <span>', chars[i],'</span>\
                </a>');
            if (i % this.colspan == rowLen)
                aHtml.push('</div>');
        }
        panelBody.innerHTML = aHtml.join('');

        panelBody.onclick = this.submit.bindWithEvent(this);
    };
});

// #endif