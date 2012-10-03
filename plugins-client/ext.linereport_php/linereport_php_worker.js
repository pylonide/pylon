/**
 * PHP linter worker.
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define("ext/linereport_php/linereport_php_worker", ["require", "exports", "module"], function(require, exports, module) {
    
var baseLanguageHandler = require("ext/linereport/linereport_base");
var handler = module.exports = Object.create(baseLanguageHandler);



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
    handler.invokeReporter("php -l " + handler.path.replace(/^\/workspace/, handler.workspaceDir),
        this.$postProcess, callback);
};

/**
 * Postprocess PHP output to match the expected format
 * line:column: error message.
 */
handler.$postProcess = function(line) {
    return line.replace(/(.*) (in .*? )?on line ([0-9]+)$/, "$3:1: $1/");
};

});


