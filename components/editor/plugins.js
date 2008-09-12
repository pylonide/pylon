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
    this.name        = 'Smilies';
    this.icon        = 'plugin.smilies.gif';
    this.type        = Editor.TOOLBARITEM;
    this.subType     = Editor.TOOLBARPANEL;
    this.hook        = 'onToolbar';
    this.buttonBuilt = false;
    this.buttonNode  = null;
    this.panelBuilt  = false;
    this.opened      = false;
    this.updatePanelBody = false;
    this.colspan     = 20;
    
    this.execute = function(editor) {
        if (!this.panelBuilt) {
            this.editor = editor;
            this.Panel = new Editor.Panel(this.name, this.editor);
            this.createPanelBody();
            this.panelBuilt = true;
        } else {
            if (this.Panel.opened && !is_ie)
                this.Panel.hide();
            else {
                if(this.updatePanelBody)
                    this.createPanelBody();
                this.Panel.show(this.buttonNode);
            }
        }
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    }
    
    this.queryState = function() {
        return this.state;
    }
    
    this.createPanelBody = function() {
        ;;;startMeter('createPanelBody');
        var oTable = this.Panel._Document.createElement('TABLE');
        oTable.style.tableLayout = 'fixed';
        oTable.cellPadding = 0;
        oTable.cellSpacing = 2;
        oTable.border = 0;
        oTable.width = (27 * this.colspan);
        var oCell = oTable.insertRow(-1).insertCell(-1);
        oCell.colSpan = this.colspan;
        var aImages = this.editor.options.smileyImages;
        var iCounter = 0;
        var iLength = 0;
        var sUrl = "";
        while(iCounter < aImages.length) {
            var oRow = oTable.insertRow(-1);
            for(var i = 0; i < this.colspan && iCounter < aImages.length; i++, iCounter++) {
                iLength = aImages[iCounter].length;
                sUrl = this.editor.options.smileyPath + aImages[iCounter][iLength - 1];
                oDiv = oRow.insertCell(-1).appendChild(this.createSelectionDiv());
                oDiv.parentNode.width = 23;
                oDiv.innerHTML = "<div style=\"width:20px;height:20px;background:url(" + sUrl + ") no-repeat center center;\"></div>";
                oDiv.SmileyImage = sUrl;
                oDiv.Command = this;
                oDiv.onclick = this.onSmileySelect;
            }
        }
        this.Panel.setContent(oTable);
        this.updatePanelBody = false;
        ;;;stopMeter();
    }

    this.createSelectionDiv = function() {
        var oDiv = this.Panel._Document.createElement("DIV") ;
        oDiv.className     = "itemDeselected";
        oDiv.onmouseover   = function() {
            this.className = "itemSelected";
        };
        oDiv.onmouseout    = function() {
            this.className = "itemDeselected"
        };
        return oDiv ;
    }

    this.onSmileySelect = function() {
        this.Command.editor.insertHTML('<img src="' + this.SmileyImage + '" alt="" border="0">');
        this.Command.Panel.hide();
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
    this.colspan     = 8;

    var cacheId, panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            this.createPanelBody();
            cacheId = this.editor.uniqueId + "_" + this.name;
            jpf.Popup.setContent(cacheId, panelBody)
        }
        this.editor.showPopup(this, cacheId, this.buttonNode);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    }

    this.queryState = function(oEditor) {
        if (jpf.isGecko) {
            return oEditor.getCommandState(this.name == "forecolor" 
                ? 'ForeColor'
                : 'HiliteColor');
        }
        return this.state;
    }

    function onPanelClick(e) {
        this.editor.hidePopup();
        this.editor.setFocus();
        this.editor.executeCommand(this.name == "forecolor" 
            ? 'ForeColor'
            : 'HiliteColor', '#' + e.target.getAttribute('rel'));
    }

    this.createPanelBody = function() {
        var i, colors = this.editor.options.fontColors;
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = ['<span class="editor_panelfirst">&nbsp;</span>'];
        var rowLen = this.colspan - 1;
        for (i = 0; i < colors.length; i++) {
            if (i % this.colspan == 0)
                aHtml.push('<div class="editor_panelrow">');
            aHtml.push('<a class="editor_panelcell" style="background-color:#',
                colors[i], ';" rel="', colors[i], '" href="javascript:;">\
                &nbsp;</a>');
            if (i % this.colspan == rowLen)
                aHtml.push('</div>');
        }
        panelBody.innerHTML = aHtml.join('');

        panelBody.onclick = onPanelClick.bindWithEvent(this);
    }
};

jpf.editor.Plugin('forecolor', jpf.editor.colorPlugin);
jpf.editor.Plugin('backcolor', jpf.editor.colorPlugin);

jpf.editor.Plugin('fonts', function() {
    this.name        = 'Fonts';
    this.icon        = 'plugin.fontname.gif';
    this.type        = Editor.TOOLBARITEM;
    this.subType     = Editor.TOOLBARPANEL;
    this.hook        = 'onToolbar';
    this.buttonBuilt = false;
    this.buttonNode  = null;
    this.panelBuilt  = false;
    this.bodyBuilt   = false;
    this.opened      = false;
    this.colspan     = 1;

    this.execute = function(editor) {
        if (!this.panelBuilt) {
            this.editor = editor;
            this.Panel = new Editor.Panel(this.name, this.editor);
            this.createPanelBody();
            this.panelBuilt = true;
        } else {
            if (this.Panel.opened && !is_ie)
                this.Panel.hide();
            else
                this.Panel.show(this.buttonNode);
        }
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    }
    
    this.queryState = function() {
        return this.state;
    }

    this.createPanelBody = function() {
        var oTable = this.Panel._Document.createElement('TABLE');
        oTable.style.tableLayout = 'fixed';
        oTable.cellPadding = 0;
        oTable.cellSpacing = 2;
        oTable.border = 0;
        oTable.width = 150;
        var oCell = oTable.insertRow(-1).insertCell(-1);
        oCell.colSpan = this.colspan;
        var aFonts = this.editor.options.fontNames;
        var iCounter = 0;
        while(iCounter < aFonts.length) {
            var oRow = oTable.insertRow(-1);
            for(var i = 0; i < this.colspan && iCounter < aFonts.length; i++, iCounter++) {
                oDiv = oRow.insertCell(-1).appendChild(this.createSelectionDiv());
                oDiv.innerHTML = '<font face="' + aFonts[iCounter] + '" style="font-size: 12px; color: black;">' + aFonts[iCounter] + '</font>';
                oDiv.FontName = aFonts[iCounter];
                oDiv.Command = this;
                oDiv.onclick = this.onFontSelect;
            }
        }
        this.Panel.setContent(oTable);
    }
});

jpf.editor.listPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.buttonBuilt = false;
    this.state       = jpf.editor.OFF;

    this.execute = function(oEditor) {
        if (jpf.isGecko) {
            oEditor.executeCommand(this.name == "bullist"
                ? 'insertunorderedlist'
                : 'insertorderedlist');
        }
        else {
            this.buttonNode.onclick(oEditor.mimicEvent());
            oEditor.insertHTML(this.name == "bullist"
                ? '<ul><li>Item 1</li></ul>'
                : '<ol><li>Item 1</li></ol>');
        }
    }
    
    this.queryState = function(oEditor) {
        if (jpf.isGecko) {
            return oEditor.getCommandState(this.name == "bullist"
                ? 'insertunorderedlist'
                : 'insertorderedlist');
        }
        return this.state;
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
    this.buttonBuilt = false;
    this.state       = jpf.editor.OFF;

    this.execute = function(oEditor) {
        if (jpf.isGecko) {
            oEditor.executeCommand('formatblock', 'BLOCKQUOTE');
        }
        else {
            // @todo insert blockquote in other browsers too...
        }
    }
    
    this.queryState = function(oEditor) {
        if (jpf.isGecko) {
            return oEditor.getCommandState('formatblock');
        }
        return this.state;
    }
});

jpf.editor.dateTimePlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.buttonBuilt = false;
    this.state       = jpf.editor.OFF;

    this.execute = function(oEditor) {
        this.buttonNode.onclick(oEditor.mimicEvent());
        // @todo Internationalize this!
        var dt = new Date();
        if (this.name == "insertdate")
            oEditor.insertHTML(dt.getDate() + '-' + dt.getMonth() + '-' + dt.getFullYear());
        else
            oEditor.insertHTML(dt.getHours().toPrettyDigit() + ":"
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
    this.buttonBuilt = false;
    this.state       = jpf.editor.OFF;

    this.execute = function(oEditor) {
        if (jpf.isGecko)
            oEditor.executeCommand(this.name == "sub" ? 'subscript' : 'superscript');
    }
    
    this.queryState = function(oEditor) {
        if (jpf.isGecko) {
            return oEditor.getCommandState(this.name == "sub" 
                ? 'subscript'
                : 'superscript');
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
        this.editor.showPopup(this, cacheId, this.buttonNode);
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
        this.editor.setFocus();
        this.editor.insertHTML(e.target.getAttribute('rel'))
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