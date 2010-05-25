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

apf.LiveEdit.listPlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARBUTTON;
    this.hook        = "ontoolbar";
    this.keyBinding  = sName == "bullist" ? "ctrl+shift+u" : "ctrl+shift+o";
    this.state       = apf.OFF;

    var emptyRegex = apf.isIE
        ? /^(&nbsp;)?<DIV[^>]*_apf_placeholder(="1">&nbsp;)?<\/DIV>$/gi
        : /^(&nbsp;)?<BR\/?>$/gi;

    this.execute = function(editor) {
            editor.$execCommand(this.name == "bullist"
                ? "InsertUnorderedList"
                : "InsertOrderedList");

        this.correctLists(editor);
        editor.$visualFocus();

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
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
        var sHtml, aNodes = oParent.getElementsByTagName("li");
        for (var i = 0, j = aNodes.length; i < j; i++) {
            sHtml = aNodes[i].innerHTML.trim();
            if (sHtml == "" || sHtml == "&nbsp;" || sHtml.match(emptyRegex))
                return aNodes[i];
        }
        return null;
    }

    this.correctLists = function(editor) {
        editor.$selection.set();

        var oNode = editor.$selection.getSelectedNode();
        //window.console.log("correcting lists0: ", oNode);
        //window.console.dir(editor.$selection.getRange());
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

        editor.$selection.selectNode(oNode);
        if (!apf.isIE)
            editor.$selection.getRange().setStart(oNode, 0);
        editor.$selection.collapse(!apf.isIE);
        editor.$visualFocus();
        return true;
    };

    this.correctIndentation = function(editor, dir) {
        //this.correctLists(editor);
        editor.$execCommand(dir);
        this.correctLists(editor);
    };

    this.queryState = function(editor) {
        var state = editor.$queryCommandState(this.name == "bullist"
            ? "InsertUnorderedList"
            : "InsertOrderedList");
        if (state == apf.DISABLED)
            return apf.OFF;
        return state;
    };
};

apf.LiveEdit.plugin("bullist", apf.LiveEdit.listPlugin);
apf.LiveEdit.plugin("numlist", apf.LiveEdit.listPlugin);

// #endif
