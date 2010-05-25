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

// #ifdef __ENABLE_EDITOR_SUBSUP || __INC_ALL

apf.LiveEdit.subSupCommand = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARBUTTON;
    this.hook        = "ontoolbar";
    this.keyBinding  = sName == "sub" ? "ctrl+alt+s" : "ctrl+shift+s";
    this.state       = apf.OFF;

    this.execute = function(editor) {
        var other = this.name == "sub" ? "Superscript" : "Subscript";
        if (editor.$queryCommandState(other) == apf.ON)
            editor.$execCommand(other);
        editor.$execCommand(this.name == "sub" ? "Subscript" : "Superscript");

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
    };

    this.queryState = function(editor) {
        return editor.$queryCommandState(this.name == "sub"
            ? "Subscript"
            : "Superscript");
    };
}
apf.LiveEdit.plugin("sub", apf.LiveEdit.subSupCommand);
apf.LiveEdit.plugin("sup", apf.LiveEdit.subSupCommand);

// #endif
