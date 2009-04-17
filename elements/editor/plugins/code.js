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

    var oCont, oToolbar, oButtons = {}, oPreview, protectedData, lastLoaded,
        _self = this;

    this.execute = function(editor) {
        //this.buttonNode.onclick(editor.mimicEvent());
        if (!oPreview)
            this.drawPreview(editor);

        if (oCont.style.display == "none") {
            // remember the selection for IE
            editor.selection.cache();

            this.update(editor);

            editor.plugins.active = this;
            // disable the editor...
            editor.setProperty('state', jpf.editor.DISABLED);

            // show the textarea and position it correctly...
            this.setSize(editor);
            oCont.style.display = "";

            oPreview.focus();
        }
        else {
            editor.plugins.active = null;
            
            oCont.style.display = "none";
            editor.setProperty('state', jpf.editor.OFF);
            
            propagateChange();
            
            setTimeout(function() {
                editor.selection.set();
                editor.$visualFocus();
            });
        }
        editor.notify('code', this.queryState(editor));

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
    };

    this.update = function(editor, sHtml) {
        if (changeTimer) {
            lastLoaded = sHtml;
            return;
        }
        // update the contents of the (hidden) textarea
        oPreview.value = format.call(this, sHtml 
            ? editor.exportHtml(sHtml)
            : (lastLoaded = editor.getValue()));
    };

    this.getValue = function() {
        return oPreview.value;
    };

    function propagateChange() {
        if (lastLoaded == oPreview.value) return false;
        var html = _self.editor.exportHtml(oPreview.value
            .replace(/<\/p>/gi, "</p><p></p>")
            .replace(/\n/g, ''));

        try{
            jpf.getXml('<source>' + html.replace(/&.{3,5};/g, "") + '</source>');
        }
        catch(e){
            if (confirm("Er zit een fout in de html. Klik op OK om deze \
                         te corrigeren, of op Cancel om door te gaan")){
                //@todo mike: finish this
                return false;
            }
        }

        if (_self.editor.$value.replace(/[\r\n]/g, "") == html.replace(/[\r\n]/g, "")) {
            _self.editor.$propHandlers["value"].call(_self.editor, html);
        }
        else 
            _self.editor.change(html);

        return true;
    }

    var changeTimer = null;

    function resumeChangeTimer() {
        if (!_self.editor.realtime || changeTimer !== null) return;
        changeTimer = setTimeout(function() {
            clearTimeout(changeTimer);
            _self.editor.change(oPreview.value);
            changeTimer = null;
        }, 200);
    }

    function onKeydown(e) {
        e = e || window.event;
        var code = e.which || e.keyCode;
        if (!e.ctrlKey && !e.altKey && (code < 112 || code > 122)
          && (code == 32 || code > 42 || code == 8 || code == 13)) {
            resumeChangeTimer();
        }
    }

    this.drawPreview = function(editor) {
        this.editor = editor;

        //this.editor.$getNewContext("code");
        oCont = editor.$getExternal('code', editor.oExt);//.appendChild(this.editor.$getLayoutNode("code"));

        oToolbar = oCont.getElementsByTagName('div')[0];
        //oToolbar.className = "";
        this.editor.drawToolbars(oToolbar, 'codetoolbar',
            'jpf.all[' + this.uniqueId + '].$buttonClick(event, this);', true);
        // @todo make this hack disappear...
        oToolbar.innerHTML = oToolbar.innerHTML;
        var btns = oToolbar.getElementsByTagName("div");
        for (var item, i = btns.length - 1; i >= 0; i--) {
            item = btns[i].getAttribute("type");
            if (!item) continue;

            oButtons[item] = btns[i];
            jpf.setStyleClass(btns[i], 'editor_enabled',
                ['editor_selected', 'editor_disabled']);
            btns[i].disabled = false;
        }

        oPreview = oCont.getElementsByTagName('textarea')[0];//oCont.appendChild(document.createElement('textarea'));
        // make selections in IE possible.
        if (jpf.isIE)
            oPreview.onselectstart = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
        oPreview.onkeydown = onKeydown;

        this.setSize(editor);
        oCont.style.display  = "none";
        jpf.sanitizeTextbox(oPreview);
    }

    this.setSize = function(editor) {
        if (!oPreview || !editor) return;
        
        var w = editor.oExt.offsetWidth - 2;
        var h = editor.oExt.offsetHeight - editor.oToolbar.offsetHeight - 4;
        oCont.style.top       = editor.oToolbar.offsetHeight + "px";
        oCont.style.width     = 
        oToolbar.style.width  = w + "px";
        oPreview.style.width  = w - (jpf.isIE ? 2 : 0) + "px";
        oCont.style.height    = h + (jpf.isIE ? 2 : 3) + "px";
        oPreview.style.height = h - (jpf.isIE ? 26 : 24) + "px";
    };

    var elements = {
        "bullist"   : ["<ul>", "</ul>"],
        "numlist"   : ["<ol>", "</ol>"],
        "listitem"  : ["<li>", "</li>"],
        "nbsp"      : ["&nbsp;", null],
        "break"     : ["<br />", null],
        "paragraph" : ["<p>", "</p>"]
    };

    this.$buttonClick = function(e, oButton) {
        jpf.setStyleClass(oButton, "active");
        var item = oButton.getAttribute("type");
        if (elements[item])
            insertElement.apply(this, elements[item]);

        this.editor.$visualFocus();
        oPreview.focus();

        jpf.setStyleClass(oButton, "", ["active"]);
    }

    function insertElement(sStart, sEnd) {
        if (!sStart) return;
        var range, val, end;
        if (!sEnd) {
            // no end tag provided, so insert sStart at the current caret position
            if (jpf.hasMsRangeObject) {
                range = document.selection.createRange();
                range.collapse();
                range.text = sStart;
                range.moveEnd("character", sStart.length);
                range.collapse();
                if (jpf.window.focussed == this.editor)
                    range.select();
            }
            else {
                val = oPreview.value;
                end = oPreview.selectionEnd;
                oPreview.selectionStart = end;
                oPreview.value          = val.substr(0, end) + sStart
                    + val.substr(end);
                oPreview.selectionStart = oPreview.selectionEnd = end
                    + sStart.length;
            }
        }
        else {
            // end tag provided, so we need to encapsulate the selection with
            // sStart and sEnd
            if (jpf.hasMsRangeObject) {
                range = document.selection.createRange();
                val   = range.text;
                range.text = sStart + val + sEnd;
                range.moveStart("character", -(val.length + sEnd.length));
                range.moveEnd("character", -sEnd.length);
                if (jpf.window.focussed == this.editor)
                    range.select();
            }
            else {
                var start  = oPreview.selectionStart;
                val        = oPreview.value;
                end        = oPreview.selectionEnd;
                oPreview.value = val.substr(0, start) + sStart
                    + val.substr(start, end - start) + sEnd + val.substr(end);
                oPreview.selectionStart = start + sStart.length;
                oPreview.selectionEnd   = end + sEnd.length - 1;
            }
        }
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
        if (editor.plugins.active == this)
            return jpf.editor.SELECTED;
        return jpf.editor.OFF;
    };

    this.destroy = function() {
        oPreview = this.regex = null;
        delete oPreview;
        delete this.regex;
    };
});

// #endif
