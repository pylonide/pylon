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

// #ifdef __ENABLE_EDITOR_PRINTING || __INC_ALL

apf.LiveEdit.plugin("print", function(){
    this.name        = "print";
    this.icon        = "print";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARBUTTON;
    this.hook        = "ontoolbar";
    this.keyBinding  = "ctrl+p";
    this.state       = apf.OFF;

    this.execute = function(editor) {
        if (apf.print)
            apf.print(editor.getValue());

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
    };

    this.queryState = function() {
        return this.state;
    };
});

apf.LiveEdit.plugin("preview", function(){
    this.name        = "preview";
    this.icon        = "preview";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARBUTTON;
    this.hook        = "ontoolbar";
    this.keyBinding  = "ctrl+shift+p";
    this.state       = apf.OFF;

    this.execute = function(editor) {
        if (apf.printer)
            apf.printer.preview(editor.getValue()).show();

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
    };

    this.queryState = function() {
        return this.state;
    };
});

// #endif
