/**
 * PHP linter worker.
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var baseLanguageHandler = require("ext/linereport/linereport_base");
var handler = module.exports = Object.create(baseLanguageHandler);

handler.disabled = false;
handler.$isInited = false;

handler.handlesLanguage = function(language) {
    return language === 'python';
};

handler.init = function(callback) {
    handler.initReporter("pylint --version", "exit 1 # pylint isn't installed", function(err, output) {
        if (err) {
            console.log("Unable to lint Python\n" + output);
            handler.disabled = true;
        }
        callback();
    });
};

handler.analyze = function(doc, fullAst, callback) {
    if (handler.disabled)
        return callback();
    handler.invokeReporter("pylint -i y -E " + handler.workspaceDir + "/" + handler.path,
        this.$postProcess, callback);
};

/**
 * Postprocess Python output to match the expected format
 * line:column: error message.
 */
handler.$postProcess = function(line) {
    var pylintRegex = /^E\d{4}:\s*(\d+),(\d+):(.*)$/;
    return pylintRegex.test(line) && line.replace(pylintRegex, "$1:$2: $3/");
};

});


