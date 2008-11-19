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

// #ifdef __ENABLE_EDITOR_CLIPBOARD || __INC_ALL

jpf.editor.clipboardPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARPANEL;
    this.hook        = 'ontoolbar';
    this.keyBinding  = this.name == "pastetext" ? 'ctrl+shift+v' : 'ctrl+shift+w';
    this.state       = jpf.editor.OFF;

    var panelBody;

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            jpf.popup.setContent(this.uniqueId, this.createPanelBody());
        }
        this.editor.showPopup(this, this.uniqueId, this.buttonNode, 300, 300);
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
        jpf.popup.forceHide();

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
        panelBody.innerHTML =
           '<span class="editor_panelfirst"><a href="javascript:void(0);" onmousedown="jpf.popup.forceHide();">x</a></span>\
            <div class="editor_panelrow editor_panelrowinput">\
                <label for="' + idArea + '">Use CTRL+V on your keyboard to paste the text into the window.</label>\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <textarea id="' + idArea + '" name="' + idArea + '"  wrap="soft" dir="ltr" \
                  cols="60" rows="10" class="editor_textarea"></textarea>\
            </div>\
            <div class="editor_panelrow editor_panelrowinput">\
                <button class="editor_positionedbutton" id="' + idInsert + '">Insert</button>\
            </div>';

        this.oArea = document.getElementById(idArea);
        document.getElementById(idInsert).onclick = this.submit.bindWithEvent(this);
        return panelBody;
    };
};

jpf.editor.Plugin('pastetext', jpf.editor.clipboardPlugin);
jpf.editor.Plugin('pasteword', jpf.editor.clipboardPlugin);

// #endif
