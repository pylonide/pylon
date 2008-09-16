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
                for (i = editor.options.smileyImages.length - 1; i >= 0; i--) {
                    iLength = editor.options.smileyImages[i].length;
                    if (editor.options.smileyImages[i][iLength - 1].match(/http(s?):(\/){2}/))
                        src_prefix = "" ;
                    else
                        src_prefix = editor.options.smileyPath;
                    for (j = 0; j < iLength - 1; j++)
                        if (crt_range.findText(editor.options.smileyImages[i][j]))
                            crt_range.pasteHTML('&nbsp;<img src="' + src_prefix + editor.options.smileyImages[i][iLength - 1] + '" border="0" alt="">');
                }
            } else {
                var crt_sel = editor.Win.contentWindow.getSelection();
                var crt_range = crt_sel.getRangeAt(0);
                var el = crt_range.startContainer;
                content = el.nodeValue;
                if (content) {
                    for (i = editor.options.smileyImages.length-1; i >= 0; i--) {
                        iLength = editor.options.smileyImages[i].length;
                        if (editor.options.smileyImages[i][iLength - 1].match(/http(s?):(\/){2}/))
                            src_prefix = "" ;
                        else
                            src_prefix = editor.options.smileyPath;

                        // Refresh content in case it has been changed by previous smiley replacement
                        content = el.nodeValue;

                        for (j = 0; j < iLength - 1; j++) {
                            // Find the position of the smiley sequence
                            var smileyPos = content.indexOf(editor.options.smileyImages[i][j]);
                            if (smileyPos > -1) {
                                // Create a range for the smiley sequence and remove the contents
                                crt_range.setStart(el, smileyPos);
                                crt_range.setEnd(el, smileyPos + editor.options.smileyImages[i][j].length);
                                crt_range.deleteContents();

                                // Add the smiley image to the range
                                smiley_img = new Image;
                                smiley_img.src = src_prefix + editor.options.smileyImages[i][iLength - 1];
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

        var oRoot = editor.Doc || editor.Doc.body;

        var aTextNodes = getElementsByNodeType(oRoot, 3);

        var iLength = 0;
        for(var i = 0; i < aTextNodes.length; i++) {
            iLength += aTextNodes[i].length;
        }

        var iMaxLength = editor.options.maxTextLength;
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

    var cacheId, panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_" + this.name;
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, 115);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    }
    
    this.queryState = function() {
        return this.state;
    }
    
    function onPanelClick(e) {
        this.editor.hidePopup();
        this.editor.setFocus();
        var icon = e.target.getAttribute('rel');
        // @todo still iffy...
        if (!icon || icon == null)
            icon = e.target.parentNode.getAttribute('rel');
        this.editor.insertHTML('<img src="' + this.editor.options.emotionsPath
            + '/smiley-' + icon + '.gif' + '" alt="" border="0" />');
//        this.editor.executeCommand('InsertImage', this.editor.options.emotionsPath
//            + '/smiley-' + e.target.getAttribute('rel') + '.gif');
    }

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst">&nbsp;</span>'];
        var emotions = this.editor.options.emotions;
        var path     = this.editor.options.emotionsPath;
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

        panelBody.onclick = onPanelClick.bindWithEvent(this);
    }
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
    
    this.init = function(editor) {
        this.buttonNode.className = this.buttonNode.className + " colorpicker";
        this.colorPreview = this.buttonNode.appendChild(document.createElement('div'));
        this.colorPreview.className = "colorpreview";
        var colorArrow = this.buttonNode.appendChild(document.createElement('span'));
        colorArrow.className = "selectarrow";

    }

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_" + this.name;
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, 273);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    }

    this.queryState = function(editor) {
        var cmdName = this.name == "forecolor" 
            ? 'ForeColor'
            : jpf.isIE ? 'BackColor' : 'HiliteColor';
        this.state = editor.getCommandState(cmdName);
        
        var currValue = editor.Selection.getContext().queryCommandValue(cmdName);
        if (currValue != this.colorPreview.style.backgroundColor)
            this.colorPreview.style.backgroundColor = currValue;
    }

    function onPanelClick(e) {
        this.editor.hidePopup();
        
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        this.editor.executeCommand(this.name == "forecolor" 
            ? 'ForeColor'
            : jpf.isIE ? 'BackColor' : 'HiliteColor',
            '#' + e.target.getAttribute('rel'));
    }

    this.createPanelBody = function() {
        if (!jpf.editor.colorPlugin.palette)
            generatePalette();

        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst">&nbsp;</span>'];

        var row, col, colorCode, palette = jpf.editor.colorPlugin.palette;
        for (row = 0; row < palette[0].length; row++) {
            aHtml.push('<div class="editor_panelrow">');
            for (col= 0; col < palette.length; col++) {
                colorCode = palette[col][row].red +
                    palette[col][row].green +
                    palette[col][row].blue;
                aHtml.push('<a class="editor_panelcell" style="background-color:#',
                    colorCode, ';" rel="', colorCode, '" href="javascript:;">\
                    &nbsp;</a>');
            }
            aHtml.push('</div>');
        }
        panelBody.innerHTML = aHtml.join('');

        panelBody.onclick = onPanelClick.bindWithEvent(this);
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

    var cacheId, panelBody;

    this.init = function(editor) {
        this.buttonNode.className = this.buttonNode.className + " fontpicker";
        this.fontPreview = this.buttonNode.getElementsByTagName('span')[0];
        this.fontPreview.className += " fontpreview";
        var fontArrow = this.buttonNode.appendChild(document.createElement('span'));
        fontArrow.className = "selectarrow";
    }

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
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
    }

    this.queryState = function(editor) {
        this.state = editor.getCommandState('FontName');

        var currValue = editor.Selection.getContext().queryCommandValue('FontName')
        if (editor.options.fontNames[currValue] && this.fontPreview.innerHTML != currValue) {
            this.fontPreview.style.fontFamily = editor.options.fontNames[currValue];
            this.fontPreview.innerHTML        = currValue;
        }
    }

    function onPanelClick(e) {
        this.editor.hidePopup();

        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        this.editor.executeCommand('FontName', e.target.getAttribute('rel'));
    }

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst">&nbsp;</span>'];

        for (var i in this.editor.options.fontNames) {
            aHtml.push('<a class="editor_panelcell editor_font" style="font-family:',
                this.editor.options.fontNames[i], ';" rel="', i,
                '" href="javascript:;">', i, '</a>');
        }
        panelBody.innerHTML = aHtml.join('');

        panelBody.onclick = onPanelClick.bindWithEvent(this);
    }
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
    }

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
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
    }

    this.queryState = function(editor) {
        this.state = editor.getCommandState('FontSize');

        var currValue = editor.Selection.getContext().queryCommandValue('FontSize')
        if (this.sizePreview.innerHTML != currValue) {
            this.sizePreview.innerHTML = currValue;
        }
    }

    function onPanelClick(e) {
        this.editor.hidePopup();

        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        this.editor.executeCommand('FontSize', e.target.getAttribute('rel'));
    }

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst">&nbsp;</span>'];

        var aSizes = this.editor.options.fontSizes;
        for (var i = 0; i < aSizes.length; i++) {
            aHtml.push('<a class="editor_panelcell editor_fontsize" style="font-size:',
                sizeMap[aSizes[i]], 'pt;height:', sizeMap[aSizes[i]], 'pt;line-height:', sizeMap[aSizes[i]], 'pt;" rel="', aSizes[i],
                '" href="javascript:;">', aSizes[i], ' (', sizeMap[aSizes[i]], 'pt)</a>');
        }
        panelBody.innerHTML = aHtml.join('');

        panelBody.onclick = onPanelClick.bindWithEvent(this);
    }
});

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
    }
    
    this.queryState = function(editor) {
        return editor.getCommandState(this.name == "bullist"
            ? 'InsertUnorderedList'
            : 'InsertOrderedList');
    }
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
    }
    
    this.queryState = function(editor) {
        return editor.getCommandState('FormatBlock');
    }
});

jpf.editor.Plugin('hr', function(){
    this.name        = 'hr';
    this.icon        = 'hr';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+h';
    this.buttonBuilt = false;
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        if (jpf.isGecko || jpf.isIE)
            editor.insertHTML('<hr />');
        else
            editor.executeCommand('InsertHorizontalRule');
    }
    
    this.queryState = function(editor) {
        return this.state;
    }
});

jpf.editor.Plugin('link', function(){
    this.name        = 'link';
    this.icon        = 'link';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+l';
    this.buttonBuilt = false;
    this.state       = jpf.editor.OFF;
    
    var cacheId, panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_link";
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode, 190);
        this.oUrl.focus();
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    }

    this.queryState = function(editor) {
        if (editor.Selection.isCollapsed() || editor.Selection.getSelectedNode().nodeName == "A")
            return jpf.editor.DISABLED;
        return this.state;
    }

    function onButtonClick(e) {
        this.editor.hidePopup();
        
        if (!this.oUrl.value) return;
        
        this.editor.executeCommand('CreateLink', 'javascript:jpftmp(0);');
        var oLink, aLinks = this.editor.Doc.getElementsByTagName('a');
        for (var i = 0; i < aLinks.length && !oLink; i++)
            if (aLinks[i].href == 'javascript:jpftmp(0);')
                oLink = aLinks[i];
        if (oLink) {
            oLink.href   = this.oUrl.value;
            oLink.target = this.oTarget.value;
            oLink.title  = this.oTitle.value;
        }
        this.editor.Selection.collapse(false);
    }

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var idUrl    = 'editor_' + this.editor.uniqueId + '_link_url';
        var idTarget = 'editor_' + this.editor.uniqueId + '_link_target';
        var idTitle  = 'editor_' + this.editor.uniqueId + '_link_title';
        var idButton = 'editor_' + this.editor.uniqueId + '_link_button';
        panelBody.innerHTML = [
           '<div class="editor_panelrow">\
                <label for="', idUrl, '">Link URL</label>\
                <input type="text" id="', idUrl, '" name="', idUrl, '" value="" />\
            </div>\
            <div class="editor_panelrow">\
                <label for="', idTarget, '">Target</label>\
                <select id="', idTarget, '" name="', idTarget, '">\
                    <option value="_self">Open in this window/ frame</option>\
                    <option value="_blank">Open in new window (_blank)</option>\
                    <option value="_parent">Open in parent window/ frame (_parent)</option>\
                    <option value="_top">Open in top frame (replaces all frames) (_top)</option>\
                </select>\
            </div>\
            <div class="editor_panelrow">\
                <label for="', idTitle, '">Title</label>\
                <input type="text" id="', idTitle, '" name="', idTitle, '" value="" />\
            </div>\
            <div class="editor_panelrow">\
                <button id="', idButton, '">Insert</button>\
            </div>'
        ].join('');

        document.getElementById(idButton).onclick = onButtonClick.bindWithEvent(this);
        this.oUrl    = document.getElementById(idUrl);
        this.oTarget = document.getElementById(idTarget);
        this.oTitle  = document.getElementById(idTitle);
    }
});

jpf.editor.Plugin('unlink', function(){
    this.name        = 'unlink';
    this.icon        = 'unlink';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+l';
    this.buttonBuilt = false;
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        if (this.queryState(editor) == jpf.editor.DISABLED)
            return;
        
        var oNode = editor.Selection.getSelectedNode();
        if (oNode.nodeName == "A") {
            var txt = oNode.innerHTML;
            editor.Selection.selectNode(oNode);
            editor.Selection.remove();
            editor.Selection.collapse();
            editor.insertHTML(txt);
        }
    }
    
    this.queryState = function(editor) {
        if (editor.Selection.getSelectedNode().nodeName == "A")
            return jpf.editor.OFF;

        return jpf.editor.DISABLED;
    }
});

jpf.editor.dateTimePlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = sName == "insertdate" ? 'ctrl+d' : 'ctrl+t';
    this.buttonBuilt = false;
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
    }
    
    this.queryState = function() {
        return this.state;
    }
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
    this.buttonBuilt = false;
    this.state       = jpf.editor.OFF;

    this.execute = function(editor) {
        if (jpf.isGecko)
            editor.executeCommand(this.name == "sub" ? 'subscript' : 'superscript');
        else {
            // @todo build support for IE on this one...
        }
    }
    
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
    }
}
jpf.editor.Plugin('sub', jpf.editor.subSupCommand);
jpf.editor.Plugin('sup', jpf.editor.subSupCommand);

jpf.editor.Plugin('charmap', function() {
    this.name        = 'charmap';
    this.icon        = 'charmap';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.buttonBuilt = false;
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
        this.editor.showPopup(this, cacheId, this.buttonNode, 403);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    }
    
    this.queryState = function() {
        return this.state;
    }

    var chars = ["!","&quot;","#","$","%","&amp;","\\'","(",")","*",
              "+","-",".","/","0","1","2","3","4","5","6","7","8","9",":",
              ";","&lt;","=","&gt;","?","@","A","B","C","D","E","F","G","H",
              "I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W",
              "X","Y","Z","[","]","^","_","`","a","b","c","d","e","f","g",
              "h","i","j","k","l","m","n","o","p","q","r","s","t","u","v",
              "w","x","y","z","{","|","}","~","&euro;","&lsquo;","&rsquo;",
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
              "&rArr;","&hArr;","&diams;","&asymp;"]

    function onPanelClick(e) {
        this.editor.hidePopup();

        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sCode = e.target.getAttribute('rel');
        if (sCode)
            this.editor.insertHTML(sCode);
        // @todo There are a few weird bugging characters in FF
    }

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst">&nbsp;</span>'];
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

        panelBody.onclick = onPanelClick.bindWithEvent(this);
    }
});

// #endif