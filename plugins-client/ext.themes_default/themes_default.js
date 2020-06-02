/**
 * Code Editor for the Pylon IDE
 *
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ext = require("core/ext");
var themes = require("ext/themes/themes");

module.exports = ext.register("ext/themes_default/themes_default", {
    name    : "Themes",
    dev     : "Ajax.org",
    alone   : true,
    type    : ext.GENERAL,

    themes  : {
        "Ambiance" : "ace/theme/ambiance",
        "Chrome" : "ace/theme/chrome",
        "Clouds" : [
                       {"Clouds" : "ace/theme/clouds"},
                       {"Clouds Midnight" : "ace/theme/clouds_midnight"}
                   ],
        "Chaos" : "ace/theme/chaos",
        "Cobalt" : "ace/theme/cobalt",
        "Crimson Editor" : "ace/theme/crimson_editor",
        "Dawn" : "ace/theme/dawn",
        "Dracula" : "ace/theme/dracula",
        "Dreamweaver" : "ace/theme/dreamweaver",
        "Eclipse" : "ace/theme/eclipse",
        "GitHub" : "ace/theme/github",
        "Gob" : "ace/theme/gob",
        "Gruvbox" : "ace/theme/gruvbox",
        "Idle Fingers" : "ace/theme/idle_fingers",
        "iPlastic" : "ace/theme/iplastic",
        "Katzen Milch" : "ace/theme/katzenmilch",
        "Kuroir" : "ace/theme/kuroir",
        "Kr Theme" : "ace/theme/kr_theme",
        "Merbivore" : [
                          {"Merbivore" : "ace/theme/merbivore"},
                          {"Merbivore Soft" : "ace/theme/merbivore_soft"}
                      ],
        "Mono Industrial" : "ace/theme/mono_industrial",
        "Monokai" : "ace/theme/monokai",
        "Nord Dark" : "ace/theme/nord_dark",
        "Pastel On Dark" : "ace/theme/pastel_on_dark",
        "Solarized" : [
                        {"Solarized Dark" : "ace/theme/solarized_dark"},
                        {"Solarized Light" : "ace/theme/solarized_light"}
                      ],
        "SQL Server" : "ace/theme/sqlserver",
        "Terminal" : "ace/theme/terminal",
        "TextMate" : "ace/theme/textmate",
        "Tomorrow" :  [
                        {"Tomorrow" : "ace/theme/tomorrow"},
                        {"Tomorrow Night" : "ace/theme/tomorrow_night"},
                        {"Tomorrow Night Blue" : "ace/theme/tomorrow_night_blue"},
                        {"Tomorrow Night Bright" : "ace/theme/tomorrow_night_bright"},
                        {"Tomorrow Night Eighties" : "ace/theme/tomorrow_night_eighties"}
                     ],
        "Twilight" : "ace/theme/twilight",
        "Vibrant Ink" : "ace/theme/vibrant_ink",
        "Xcode" : "ace/theme/xcode"
    },

    init : function(){
        themes.register(this.themes);
    }
});

});