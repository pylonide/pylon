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

jpf.editor.dateTimePlugin = function(sName) {
    this.name        = sName;
    this.icon        = sName;
    this.type        = jpf.editor.TOOLBARITEM;
    this.subType     = jpf.editor.TOOLBARBUTTON;
    this.hook        = 'ontoolbar';
    this.keyBinding  = sName == "insertdate" ? 'ctrl+shift+d' : 'ctrl+shift+t';
    this.state       = jpf.editor.OFF;
    this.i18n        = { //default English (en_GB)
        date_format  :"%Y-%m-%d",
        time_format  :"%H:%M:%S",
        months_long  :"January,February,March,April,May,June,July,August,September,October,November,December",
        months_short :"Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",
        days_long    :"Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday",
        days_short   :"Sun,Mon,Tue,Wed,Thu,Fri,Sat,Sun"
    };

    function addZeros(value, len) {
        value = "" + value;
        if (value.length < len) {
            for (var i = 0; i < (len - value.length); i++)
                value = "0" + value;
        }
        return value;
    }

    this.execute = function(editor) {
        if (typeof this.i18n.months_long == "string") {
            this.i18n.months_long  = this.i18n.months_long.split(',');
            this.i18n.months_short = this.i18n.months_short.split(',');
            this.i18n.days_long    = this.i18n.days_long.split(',');
            this.i18n.days_short   = this.i18n.days_short.split(',');
        }
        var d = new Date();
        var fmt = (this.name == "insertdate") ? this.i18n.date_format : this.i18n.time_format;
        fmt = fmt.replace("%D", "%m/%d/%y")
                 .replace("%r", "%I:%M:%S %p")
                 .replace("%Y", "" + d.getFullYear())
                 .replace("%y", "" + d.getYear())
                 .replace("%m", addZeros(d.getMonth()+1, 2))
                 .replace("%d", addZeros(d.getDate(), 2))
                 .replace("%H", "" + addZeros(d.getHours(), 2))
                 .replace("%M", "" + addZeros(d.getMinutes(), 2))
                 .replace("%S", "" + addZeros(d.getSeconds(), 2))
                 .replace("%I", "" + ((d.getHours() + 11) % 12 + 1))
                 .replace("%p", "" + (d.getHours() < 12 ? "AM" : "PM"))
                 .replace("%B", "" + this.i18n.months_long[d.getMonth()])
                 .replace("%b", "" + this.i18n.months_short[d.getMonth()])
                 .replace("%A", "" + this.i18n.days_long[d.getDay()])
                 .replace("%a", "" + this.i18n.days_short[d.getDay()])
                 .replace("%%", "%");
        editor.insertHTML(fmt);
    };
    
    this.queryState = function() {
        return this.state;
    };
};

jpf.editor.Plugin('insertdate', jpf.editor.dateTimePlugin);
jpf.editor.Plugin('inserttime', jpf.editor.dateTimePlugin);

// #endif
