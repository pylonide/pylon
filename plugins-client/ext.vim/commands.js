/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {
// commands that are present only in c9

"use strict";

exports.searchStore = {
    current: "",
    options: {
        needle: "",
        backwards: false,
        wrap: true,
        caseSensitive: false,
        wholeWord: false,
        regExp: false
    }
};


exports.actions = {
    ":": {
        fn: function(editor, range, count, param) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue(":");
        }
    },
    "/": {
        fn: function(editor, range, count, param) {
            editor.blur();
            txtConsoleInput.focus();
            txtConsoleInput.setValue("/");
        }
    }    
};


});
