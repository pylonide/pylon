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

apf.LiveEdit.pasteDialog = function(sName) {
    this.name        = sName;
    this.icon        = sName == "pasteworddialog" ? "pasteword" : sName;
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARPANEL;
    this.hook        = "ontoolbar";
    this.keyBinding  = sName == "pastetext" ? "ctrl+shift+v" : "ctrl+shift+w";
    this.state       = apf.OFF;

    var panelBody;

    this.init = function() {
        this.buttonNode.className = this.buttonNode.className + " dropdown_small";
        this.buttonNode.insertBefore(document.createElement("span"),
            this.buttonNode.getElementsByTagName("div")[0])
          .className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;
            apf.popup.setContent(this.$uniqueId, this.createPanelBody());
        }

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});

        this.editor.$showPopup(this, this.$uniqueId, this.buttonNode, 300, 270);
        if (panelBody.style.visibility == "hidden")
            panelBody.style.visibility = "visible";
        var _self = this;
        $setTimeout(function() {
            try {
                _self.oArea.focus();
            }
            catch (ex) {}
        }, 100); // 100ms, because of the $focusfix code...
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
        apf.popup.forceHide();

        var sContent = this.oArea.value;
        if (!sContent || sContent.length == 0) return;

        if (this.name == "pastetext") {
            var rl = ["\u2122", "<sup>TM</sup>", "\u2026", "...", "\u201c|\u201d",
                "\"", "\u2019,'", "\u2013|\u2014|\u2015|\u2212", "-"];
            sContent = sContent.replace(/\u2122/gi, "<sup>TM</sup>")
                .replace(/\u2026/gi, "...")
                .replace(/\u201c|\u201d/gi, "\"")
                .replace(/\u2019,'/gi, "'")
                .replace(/\u2013|\u2014|\u2015|\u2212/gi, "-")
                .replace(/\r\n/g, "<br />")
                .replace(/\r/g, "<br />")
                .replace(/\n/g, "<br />");
        }
        else {
            sContent = this.editor.$plugins["pasteword"].parse(sContent);
        }
        this.editor.$insertHtml(sContent);

        apf.stopEvent(e);
        return false;
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement("div"));
        panelBody.className = "editor_popup";
        panelBody.style.display = "none";
        var idArea = "editor_" + this.$uniqueId + "_input",
            idBtns = "editor_" + this.$uniqueId + "_btns";
        panelBody.innerHTML =
           '<label for="' + idArea + '">' +
           this.editor.$translate("paste_keyboardmsg").sprintf(apf.isMac ? "CMD+V" : "CTRL+V")
           + '</label>\
            <textarea id="' + idArea + '" name="' + idArea + '"  wrap="soft" dir="ltr" \
              cols="60" rows="10" class="editor_textarea"></textarea>\
            <div class="editor_panelrow" style="position:absolute;bottom:0;width:100%" id="' + idBtns + '"></div>';

        this.oArea = document.getElementById(idArea);

        //#ifdef __WITH_WINDOW_FOCUS
        apf.sanitizeTextbox(this.oArea);
        // #endif

        if (apf.isIE) {
            this.oArea.onselectstart = this.oArea.onpaste = function(e) {
                e = e || window.event;
                e.cancelBubble = true;
            };
        }

        new apf.toolbar({
            htmlNode: document.getElementById(idBtns),
            skinset: apf.getInheritedAttribute(this.editor.parentNode, "skinset"),
            childNodes: [
                new apf.bar({
                    childNodes: [new apf.button({
                        caption: this.editor.$translate("insert"),
                        onclick: "apf.lookup(" + this.$uniqueId + ").submit(event)"
                    })]
                })
            ]
        });

        return panelBody;
    };

    this.destroy = function() {
        panelBody = this.oArea = null;
        delete panelBody;
        delete this.oArea;
    };
};

apf.LiveEdit.plugin("pasteworddialog", apf.LiveEdit.pasteDialog);
apf.LiveEdit.plugin("pastetext", apf.LiveEdit.pasteDialog);

apf.LiveEdit.plugin("pasteword", function() {
    this.name        = "pasteword";
    this.icon        = "pasteword";
    this.type        = apf.CMDMACRO;
    this.hook        = "onpaste";
    this.keyBinding  = "ctrl+shift+v";
    this.state       = apf.OFF;
    
    this.parse = function(sContent) {
        var bull   = String.fromCharCode(8226),
            middot = String.fromCharCode(183);

        // Remove comments [SF BUG-1481861].
        sContent = sContent.replace(new RegExp("<p class=MsoHeading.*?>(.*?)<\/p>", "gi"), "<p><b>$1</b></p>")
            .replace(new RegExp("tab-stops: list [0-9]+.0pt\">", "gi"), "\">--list--")
            .replace(new RegExp(bull + "(.*?)<BR>", "gi"), "<p>" + middot + "$1</p>")
            // Covert to bull list
            .replace(new RegExp('<SPAN style="mso-list: Ignore">', "gi"), "<span>" + bull)
            // Replace pagebreaks.replace(/<\!--[\s\S]*?-->/g, "")
            .replace(new RegExp('<br style="page-break-before: always;.*>', "gi"), "-- page break --")
            .replace(/<o:p>\s*<\/o:p>/g, "")
            .replace(/<o:p>[\s\S]*?<\/o:p>/g, "&nbsp;")
            // Remove mso-xxx styles.
            .replace(/\s*mso-[^:]+:[^;"]+;?/gi, "")
            // Remove margin styles.
            .replace(/\s*MARGIN: 0(?:cm|in) 0(?:cm|in) 0pt\s*;/gi, "")
            .replace(/\s*MARGIN: 0(?:cm|in) 0(?:cm|in) 0pt\s*"/gi, "\"")
            .replace(/\s*TEXT-INDENT: 0cm\s*;/gi, "")
            .replace(/\s*TEXT-INDENT: 0cm\s*"/gi, "\"")
            .replace(/\s*TEXT-ALIGN: [^\s;]+;?"/gi, "\"")
            .replace(/\s*PAGE-BREAK-BEFORE: [^\s;]+;?"/gi, "\"")
            .replace(/\s*FONT-VARIANT: [^\s;]+;?"/gi, "\"")
            .replace(/\s*tab-stops:[^;"]*;?/gi, "")
            .replace(/\s*tab-stops:[^"]*/gi, "")
            // Remove Class attributes
            .replace(/<(\w[^>]*) class=([^ |>]*)([^>]*)/gi, "<$1$3")
            // Remove pagebreaks
            .replace(/-- page break --\s*<p>&nbsp;<\/p>/gi, "")
            // Remove pagebreaks
            .replace(/-- page break --/gi, "")
            //convert <p> newlines to <br> ones
            .replace(/<\/p>/gi, "<br /><br />")
            .replace(/<TABLE[^>]*cellPadding=[^>]*>/gi, '<table border="0">') //correct tables
            .replace(/<td[^>]*vAlign=[^>]*>/gi, "<td>");;

        // Remove FONT face attributes.
        // @todo make this a checkbox in the UI
        if (true) {//ignoreFont) {
            sContent = sContent.replace(/\s*face="[^"]*"/gi, "")
                .replace(/\s*face=[^ >]*/gi, "")
                .replace(/\s*FONT-FAMILY:[^;"]*;?/gi, "");
        }

        // Remove styles.
        // @todo make this a checkbox in the UI
        if (true)//removeStyles)
            sContent = sContent.replace(/<(\w[^>]*) style="([^\"]*)"([^>]*)/gi, "<$1$3" );

        // Remove style, meta and link tags
        sContent = sContent.replace(/<STYLE[^>]*>[\s\S]*?<\/STYLE[^>]*>/gi, "")
            .replace(/<(?:META|LINK)[^>]*>\s*/gi, "")
            // Remove empty styles.
            .replace(/\s*style="\s*"/gi, "")
            .replace(/<SPAN\s*[^>]*>\s*&nbsp;\s*<\/SPAN>/gi, "&nbsp;")
            .replace(/<SPAN\s*[^>]*><\/SPAN>/gi, "")
            // Remove Lang attributes
            .replace(/<(\w[^>]*) lang=([^ |>]*)([^>]*)/gi, "<$1$3")
            .replace(/<SPAN\s*>([\s\S]*?)<\/SPAN>/gi, "$1")
            .replace(/<FONT\s*>([\s\S]*?)<\/FONT>/gi, "$1")
            // Remove XML elements and declarations
            .replace(/<\\?\?xml[^>]*>/gi, "")
            // Remove w: tags with contents.
            .replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, "")
            // Remove Tags with XML namespace declarations: <o:p><\/o:p>
            .replace(/<\/?\w+:[^>]*>/gi, "")
            .replace(/<(U|I|STRIKE)>&nbsp;<\/\1>/g, "&nbsp;")
            .replace(/<H\d>\s*<\/H\d>/gi, "")
            // Remove "display:none" tags.
            .replace(/<(\w+)[^>]*\sstyle="[^"]*DISPLAY\s?:\s?none[\s\S]*?<\/\1>/ig, "")
            // Remove language tags
            .replace(/<(\w[^>]*) language=([^ |>]*)([^>]*)/gi, "<$1$3")
            // Remove onmouseover and onmouseout events (from MS Word comments effect)
            .replace(/<(\w[^>]*) onmouseover="([^\"]*)"([^>]*)/gi, "<$1$3")
            .replace(/<(\w[^>]*) onmouseout="([^\"]*)"([^>]*)/gi, "<$1$3")
            // The original <Hn> tag send from Word is something like this: <Hn style="margin-top:0px;margin-bottom:0px">
            .replace(/<H(\d)([^>]*)>/gi, "<h$1>")
            // Word likes to insert extra <font> tags, when using MSIE. (Wierd).
            .replace(/<(H\d)><FONT[^>]*>([\s\S]*?)<\/FONT><\/\1>/gi, "<$1>$2<\/$1>")
            .replace(/<(H\d)><EM>([\s\S]*?)<\/EM><\/\1>/gi, "<$1>$2<\/$1>");

        // Convert all middlot lists to UL lists
        var div = document.createElement("div");
        div.innerHTML = sContent;
        // Convert all middot paragraphs to li elements
        while (this._convertMiddots(div, "--list--")); // bull
        while (this._convertMiddots(div, middot, "unIndentedList")); // Middot
        while (this._convertMiddots(div, bull)); // bull
        sContent = div.innerHTML;
    
        return sContent.replace(/--list--/gi, ""); // Remove temporary --list--
    };

    this._convertMiddots = function(div, search, class_name) {
        var mdot = String.fromCharCode(183),
            bull = String.fromCharCode(8226),
            nodes, prevul, i, p, ul, li, np, cp;

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
            li.innerHTML = p.innerHTML.replace(new RegExp("" + mdot + "|" + bull + "|--list--|&nbsp;", "gi"), "");
            ul.appendChild(li);

            // Add the rest
            np = p.nextSibling;
            while (np) {
                // If the node is whitespace, then
                // ignore it and continue on.
                if (np.nodeType == 3 && new RegExp("^\\s$", "m").test(np.nodeValue)) {
                    np = np.nextSibling;
                    continue;
                }

                if (search == mdot) {
                    if (np.nodeType == 1 && new RegExp("^o(\\s+|&nbsp;)").test(np.innerHTML)) {
                        // Second level of nesting
                        if (!prevul) {
                            prevul = ul;
                            ul = document.createElement("ul");
                            prevul.appendChild(ul);
                        }
                        np.innerHTML = np.innerHTML.replace(/^o/, "");
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
                li.innerHTML = np.innerHTML.replace(new RegExp("" + mdot + "|" + bull + "|--list--|&nbsp;", "gi"), "");
                np.parentNode.removeChild(np);
                ul.appendChild(li);
                np = cp;
            }
            p.parentNode.replaceChild(ul, p);
            return true;
        }
        return false;
    };
});

// #endif
