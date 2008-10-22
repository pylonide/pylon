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

// #ifdef __ENABLE_EDITOR_LIST || __INC_ALL

/*
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
    var crt_sel = editor.EditorWindow.contentWindow.getSelection();
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
*/

jpf.editor.listPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = sName == "bullist" ? "ctrl+shift+u" : "ctrl+shift+o";
    this.state       = jpf.editor.OFF;
    
    var emptyRegex = jpf.isIE 
        ? /^(&nbsp;)?<DIV[^>]*_jpf_placeholder="1">(&nbsp;)?<\/DIV>$/gi
        : /^(&nbsp;)?<BR\/?>$/gi;

    this.execute = function(editor) {
        editor.executeCommand(this.name == "bullist"
            ? 'InsertUnorderedList'
            : 'InsertOrderedList');

        this.correctLists(editor);
        editor.$visualFocus();
    };

    function moveListItems(from, to) {
        var i, oNode, oLastNode,
            listNode = (this.name == "bullist") ? "OL" : "UL";
        for (i = from.childNodes.length; i >= 0; i--) {
            oNode = from.childNodes[i];
            if (!oNode) continue;
            if (oNode.tagName == listNode) break;
            if (!oLastNode)
                to.appendChild(oNode);
            else
                to.insertBefore(oNode, oLastNode);
            oLastNode = oNode;
        }
        from.parentNode.removeChild(from);
    }

    function getEmptyLi(oParent) {
        if (!oParent || oParent.nodeType != 1) return;
        var sHtml, aNodes = oParent.getElementsByTagName('li');
        for (var i = 0, j = aNodes.length; i < j; i++) {
            sHtml = aNodes[i].innerHTML.trim();
            if (sHtml == "" || sHtml == "&nbsp;" || sHtml.match(emptyRegex))
                return aNodes[i];
        }
        return null;
    }

    this.correctLists = function(editor) {
        var oNode = editor.Selection.getSelectedNode();
        //window.console.log('correcting lists0: ', oNode);
        //window.console.dir(editor.Selection.getRange());
        if (oNode.tagName != "LI") {
            oNode = getEmptyLi(oNode);
            if (!oNode || oNode.tagName != "LI")
                return false;
        }
        var oParent   = oNode.parentNode,
            oSiblingP = oNode.parentNode.previousSibling,
            oHasBr    = null;
        if (!oSiblingP) return false
        if (oSiblingP && oSiblingP.tagName == "BR") {
            oHasBr    = oSiblingP;
            oSiblingP = oSiblingP.previousSibling;
        }
        var oSibling = (oSiblingP && oSiblingP.tagName == oParent.tagName)
            ? oSiblingP
            : null;
        if (!oSibling) return;
        if (oHasBr)
            oParent.removeChild(oHasBr);

        moveListItems(oParent, oSibling);

        //while (oSibling.nextSibling && oSibling.tagName == oSibling.nextSibling.tagName)
        //    moveListItems(oSibling.nextSibling, oSibling);

        editor.Selection.selectNode(oNode);
        if (!jpf.isIE)
            editor.Selection.getRange().setStart(oNode, 0);
        editor.Selection.collapse(!jpf.isIE);
        editor.$visualFocus();
        return true;
    };

    this.correctIndentation = function(editor, dir) {
        //this.correctLists(editor);
        editor.executeCommand(dir);
        this.correctLists(editor);
    };
    
    this.queryState = function(editor) {
        return editor.getCommandState(this.name == "bullist"
            ? 'InsertUnorderedList'
            : 'InsertOrderedList');
    };
};

jpf.editor.Plugin('bullist', jpf.editor.listPlugin);
jpf.editor.Plugin('numlist', jpf.editor.listPlugin);

// #endif
