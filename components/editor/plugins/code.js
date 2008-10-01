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

// #endif
