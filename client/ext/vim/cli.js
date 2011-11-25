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
    w: function(editor, data) {
        if (!save)
            save = require("ext/save/save");

        var page = tabEditors.getPage();
        if (!page)
            return;

        var lines = editor.session.getLength();
        if (data.argv.length === 2) {
            var path = ("/workspace/" + data.argv[1]).replace(/\/+/, "/");
            page.$model.data.setAttribute("path", path);

            save.saveas(page, function() {
                console.log(path + " [New] " + lines + "L, ##C written");
            });
        }
        else {
            save.quicksave(null, function() {
                console.log(page.name + " " + lines +"L, ##C written");
            });
        }
    }
};

// aliases
cmds.write = cmds.w;

});
