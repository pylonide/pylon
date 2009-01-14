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

// #ifdef __ENABLE_EDITOR_CODE || __INC_ALL

jpf.editor.plugin('code', function() {
    this.name        = 'code';
    this.icon        = 'code';
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = 'ctrl+shift+h';
    this.state       = jpf.editor.OFF;
    this.noDisable   = true;
    this.regex       = null;

    var oPreview, protectedData;

    this.execute = function(editor) {
        //this.buttonNode.onclick(editor.mimicEvent());
        if (!oPreview)
            drawPreview(editor);

        if (oPreview.style.display == "none") {
            // update the contents of the hidden textarea
            oPreview.value = format.call(this, editor.getValue());
            // disable the editor...
            editor.$propHandlers['state'].call(editor, jpf.editor.DISABLED);
            // show the textarea and position it correctly...
            setSize(editor);
            oPreview.style.display = "";
        }
        else {
            oPreview.style.display = "none";
            if (editor.parseHTML(oPreview.value.replace(/\n/g, '')) != editor.getValue())
                editor.setHTML(oPreview.value.replace(/\n/g, ''));
            editor.$propHandlers['state'].call(editor, jpf.editor.OFF);
            editor.$focus();
        }
        editor.notify('code', this.queryState());
    };

    function drawPreview(editor) {
        oPreview = editor.oExt.appendChild(document.createElement('textarea'));
        oPreview.rows = 15;
        oPreview.cols = 10;
        setSize(editor);
        oPreview.style.display  = "none";
        jpf.sanitizeTextbox(oPreview);
    }

    function setSize(editor) {
        if (!oPreview || !editor) return;
        oPreview.style.width    = editor.oExt.offsetWidth - 2 + "px";
        oPreview.style.height   = editor.oExt.offsetHeight - editor.oToolbar.offsetHeight - 4 + "px";
    }

    function protect(outer, opener, data, closer) {
        return opener + "___JPFpd___" + protectedData.push(data) + closer;
    }

    function format(sHtml) {
        if (!this.regex)
            setupRegex.call(this);
        protectedData = [];

        var sFmt = sHtml.replace(this.regex.protectedTags, protect);
        // Line breaks.
        sFmt = sFmt.replace(this.regex.blocksOpener, '\n$&')
                   .replace(this.regex.blocksCloser, '$&\n')
                   .replace(this.regex.newLineTags,  '$&\n')
                   .replace(this.regex.mainTags,     '\n$&\n');

        // Indentation.
        var i, j,
            sIdt    = "",
            asLines = sFmt.split(this.regex.lineSplitter);
        sFmt        = "";
        for (i = 0, j = asLines.length; i < j; i++) {
            var sLn = asLines[i];
            if (sLn.length == 0)
                continue ;
            if (this.regex.decreaseIndent.test(sLn))
                sIdt = sIdt.replace(this.regex.formatIndentatorRemove, '');
            sFmt += sIdt + sLn + "\n";
            if (this.regex.increaseIndent.test(sLn))
                sIdt += '    ';
        }

        // Now we put back the protected data.
        for (i = 0, j = protectedData.length; i < j; i++) {
            var oRegex = new RegExp('___JPFpd___' + i);
            sFmt = sFmt.replace(oRegex, protectedData[i].replace(/\$/g, '$$$$'));
        }

        return sFmt.trim();
    }

    function setupRegex() {
        // Regex for line breaks.
        this.regex = {
            blocksOpener  : /\<(P|DIV|H1|H2|H3|H4|H5|H6|ADDRESS|PRE|OL|UL|LI|TITLE|META|LINK|BASE|SCRIPT|LINK|TD|TH|AREA|OPTION)[^\>]*\>/gi,
            blocksCloser  : /\<\/(P|DIV|H1|H2|H3|H4|H5|H6|ADDRESS|PRE|OL|UL|LI|TITLE|META|LINK|BASE|SCRIPT|LINK|TD|TH|AREA|OPTION)[^\>]*\>/gi,
            newLineTags   : /\<(BR|HR)[^\>]*\>/gi,
            mainTags      : /\<\/?(HTML|HEAD|BODY|FORM|TABLE|TBODY|THEAD|TR)[^\>]*\>/gi,
            lineSplitter  : /\s*\n+\s*/g,
            // Regex for indentation.
            increaseIndent: /^\<(HTML|HEAD|BODY|FORM|TABLE|TBODY|THEAD|TR|UL|OL)[ \/\>]/i,
            decreaseIndent: /^\<\/(HTML|HEAD|BODY|FORM|TABLE|TBODY|THEAD|TR|UL|OL)[ \>]/i,
            protectedTags : /(<PRE[^>]*>)([\s\S]*?)(<\/PRE>)/gi,
            formatIndentatorRemove: /^    /
        };
    }

    this.queryState = function(editor) {
        if (!oPreview || oPreview.style.display == "none")
            return jpf.editor.OFF;
        return jpf.editor.ON;
    };
});

// #endif
