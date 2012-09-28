/**
 * PHP linter worker.
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
    
var baseLanguageHandler = require("ext/linereport/linereport_base");
var handler = module.exports = Object.create(baseLanguageHandler);

/**
 * Postprocess PHP output to match the expected format
 * line:column: error message.
 */
var POSTPROCESS = 's/(.*)on line ([0-9]+)/\\2:1: \\1/';

handler.disabled = false;

handler.handlesLanguage = function(language) {
    return language === 'php';
};

handler.init = function(callback) {
    handler.initReporter("php --version", "exit 1 # can't really install php", function(err, output) {
        if (err) {
            console.log("Unable to lint PHP\n" + output);
            handler.disabled = true;
        }
        callback();
    });
};

handler.analyze = function(doc, fullAst, callback) {
    if (handler.disabled)
        return callback();
    handler.invokeReporter("php -l " + handler.path.replace(/^\/workspace/, window.ide.workspaceDir) +
        " | sed -E '"+ POSTPROCESS + "'", callback);
};

});

