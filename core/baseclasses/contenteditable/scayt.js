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

// #ifdef __ENABLE_EDITOR_HELP || __INC_ALL

apf.ContentEditable.plugin("scayt", function(){
    this.name        = "scayt";
    this.icon        = "scayt";
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARBUTTON;
    this.hook        = "ontoolbar";
    this.keyBinding  = "ctrl+h";
    this.state       = apf.OFF;

    this.execute = function(editor) {
        // @todo: implement this plugin

        // cmd=get_opt
        // customerid=1:rvyy72-5NS5o3-yXVS13-hNbyY1-GNda0-KjkQH1-jWrIR3-03eg64-J9VJ93-LXmzy4-FeHKe2-VO5TF3
        // sessionid=
        // ---------------------
        // cmd=scayt_spelltext
        // customerid=1:rvyy72-5NS5o3-yXVS13-hNbyY1-GNda0-KjkQH1-jWrIR3-03eg64-J9VJ93-LXmzy4-FeHKe2-VO5TF3
        // sessionid=1
        // text={urlencoded, html-tag-free text}
        // slang=en
        // intlang=en
        // sug_len=14
        apf.oHttp.get(function() {

        }, {});

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
    };

    this.queryState = function(editor) {
        return this.state;
    };
});

// #endif
