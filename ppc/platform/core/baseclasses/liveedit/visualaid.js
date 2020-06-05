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

// #ifdef __ENABLE_EDITOR_VISUALAID || __INC_ALL

ppc.LiveEdit.plugin("visualaid", function(){
    this.name        = "visualaid";
    this.icon        = "visualaid";
    this.type        = ppc.TOOLBARITEM;
    this.subType     = ppc.TOOLBARBUTTON;
    this.hook        = "ontoolbar";
    this.keyBinding  = "ctrl+shift+v";
    this.state       = ppc.OFF;

    this.execute = function(editor) {
        var state = this.queryState(editor);
        editor.$activeDocument.body.className = (state == ppc.ON) ? "" : "visualAid";
        editor.$notifyButton(this.name);

        ppc.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
    };

    this.queryState = function(editor) {
        this.state = ppc[editor.$activeDocument.body.className == "visualAid" ? "ON" : "OFF"];
        return this.state;
    };
});

// #endif
