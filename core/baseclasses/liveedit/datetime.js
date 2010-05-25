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

// #ifdef __ENABLE_EDITOR_DATETIME || __INC_ALL

apf.LiveEdit.dateTimePlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = apf.TOOLBARITEM;
    this.subType     = apf.TOOLBARBUTTON;
    this.hook        = "ontoolbar";
    this.keyBinding  = sName == "insertdate" ? "ctrl+shift+d" : "ctrl+shift+t";
    this.state       = apf.OFF;
    this.i18n        = { //default English (en_GB)
        date_format  :"%Y-%m-%d",
        time_format  :"%H:%M:%S",
        months_long  :"January,February,March,April,May,June,July,August,September,October,November,December",
        months_short :"Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",
        days_long    :"Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
        days_short   :"Sun,Mon,Tue,Wed,Thu,Fri,Sat,Sun"
    };

    this.execute = function(editor) {
        if (typeof this.i18n.months_long == "string") {
            this.i18n.months_long  = this.i18n.months_long.split(",");
            this.i18n.months_short = this.i18n.months_short.split(",");
            this.i18n.days_long    = this.i18n.days_long.split(",");
            this.i18n.days_short   = this.i18n.days_short.split(",");
        }
        var d = new Date();
        var fmt = (this.name == "insertdate") ? this.i18n.date_format : this.i18n.time_format;
        fmt = fmt.replace("%D", "%m/%d/%y")
                 .replace("%r", "%I:%M:%S %p")
                 .replace("%Y", "" + d.getFullYear())
                 .replace("%y", "" + d.getYear())
                 .replace("%m", ("" + d.getMonth() + 1).pad(2, "0"))
                 .replace("%d", ("" + d.getDate()).pad(2, "0"))
                 .replace("%H", ("" + d.getHours()).pad(2, "0"))
                 .replace("%M", ("" + d.getMinutes()).pad(2, "0"))
                 .replace("%S", ("" + d.getSeconds()).pad(2, "0"))
                 .replace("%I", "" + (d.getHours() + 11) % 12 + 1)
                 .replace("%p", "" + (d.getHours() < 12 ? "AM" : "PM"))
                 .replace("%B", "" + this.i18n.months_long[d.getMonth()])
                 .replace("%b", "" + this.i18n.months_short[d.getMonth()])
                 .replace("%A", "" + this.i18n.days_long[d.getDay()])
                 .replace("%a", "" + this.i18n.days_short[d.getDay()])
                 .replace("%%", "%");

        editor.$insertHtml(fmt, true);

        editor.dispatchEvent("pluginexecute", {name: this.name, plugin: this});
    };

    this.queryState = function() {
        return this.state;
    };
};

apf.LiveEdit.plugin("insertdate", apf.LiveEdit.dateTimePlugin);
apf.LiveEdit.plugin("inserttime", apf.LiveEdit.dateTimePlugin);

// #endif
