/**
 * Vim mode for the Cloud9 IDE
 *
 * @author Sergi Mansilla <sergi AT c9 DOT io>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var save;
var cmds = module.exports = {
    w: function(data) {
        if (!save)
            save = require("ext/save/save");

        console.log("Save current buffer", save);
    }
};

// aliases
cmds.write = cmds.w;

});
