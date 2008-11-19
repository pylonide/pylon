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

// #ifdef __ENABLE_EDITOR_FONTS || __INC_ALL

jpf.editor.Plugin('blockformat', function() {
    this.name         = 'blockformat';
    this.icon         = 'blockformat';
    this.type         = jpf.editor.TOOLBARITEM;
    this.subType      = jpf.editor.TOOLBARPANEL;
    this.hook         = 'ontoolbar';
    this.buttonNode   = null;
    this.state        = jpf.editor.OFF;
    this.blockFormats = null;

    var panelBody;

    // this hashmap maps font size number to it's equivalent in points (pt)
    var blocksMap = {
        'p'       : 'Paragraph',
        'pre'     : 'Preformatted',
        'address' : 'Address',
        'h1'      : 'Header 1',
        'h2'      : 'Header 2',
        'h3'      : 'Header 3',
        'h4'      : 'Header 4',
        'h5'      : 'Header 5',
        'h6'      : 'Header 6'
    };

    this.init = function(editor) {
        this.buttonNode.className = this.buttonNode.className + " blockformatpicker";
        this.sizePreview = this.buttonNode.getElementsByTagName('span')[0];
        this.sizePreview.className += " blockformatpreview";
        var sizeArrow = this.buttonNode.appendChild(document.createElement('span'));
        sizeArrow.className = "selectarrow";
    };

    this.execute = function(editor) {
        if (!panelBody) {
            this.editor = editor;

            // parse font sizes
            var i, node, oNode = editor.$getOption('blockformats');
            for (i = 0; i < oNode.childNodes.length; i++) {
                node = oNode.childNodes[i];
                if (node.nodeType == 3 || node.nodeType == 4)
                    this.blockFormats = node.nodeValue.splitSafe(",");
            }

            jpf.popup.setContent(this.uniqueId, this.createPanelBody());
        }
        this.editor.showPopup(this, this.uniqueId, this.buttonNode, 203);
        //return button id, icon and action:
        return {
            id: this.name,
            action: null
        };
    };

    this.queryState = function(editor) {
//        this.state = editor.getCommandState('FontSize');
//
//        var currValue = editor.Selection.getContext().queryCommandValue('FontSize')
//        if (!currValue || this.sizePreview.innerHTML != currValue) {
//            this.sizePreview.innerHTML = currValue ? currValue : "Size";
//        }
        return this.state;
    };

    this.submit = function(e) {
        e = new jpf.AbstractEvent(e || window.event);
        while (e.target.tagName.toLowerCase() != "a" && e.target.className != "editor_popup")
            e.target = e.target.parentNode;
        var sSize = e.target.getAttribute('rel');
        if (sSize) {
            jpf.popup.forceHide();
            if (jpf.isIE && this.editor.Selection.isCollapsed()) {
                this.editor.$visualFocus();
                var r = this.editor.Selection.getRange();
                r.moveStart('character', -1);
                r.select();
            }
            this.editor.executeCommand('FontSize', sSize);
            if (jpf.isIE)
                this.editor.Selection.collapse(false);
        }
    };

    this.createPanelBody = function() {
        panelBody = document.body.appendChild(document.createElement('div'));
        panelBody.className = "editor_popup";
        var aHtml = [];

        var aFormats = this.blockFormats;
        for (var i = 0; i < aFormats.length; i++) {
            aHtml.push('<a class="editor_panelcell editor_blockformat" rel="',
                aFormats[i], '" href="javascript:;" onmousedown="jpf.lookup(',
                this.uniqueId, ').submit(event);"><', aFormats[i], '>',
                blocksMap[aFormats[i]], '</', aFormats[i], '></a>');
        }
        panelBody.innerHTML = aHtml.join('');
        return panelBody;
    };
});

// #endif

