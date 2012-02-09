/**
 * Console unit tests.
 *
 * @author Sergi Mansilla <sergi AT ajax DOT org>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
}
define(function(require, exports, module) {
    var assert = require("assert");
    var parseLine = require("ext/console/parser");
    module.exports = {
        "test normal cli": function(next) {
            var expected1 = ["this", "is", "-a", "test"];
            assert.equal(parseLine("this is -a test").toString(), expected1.toString());
            next();
        },
        "test quoted cli": function(next) {
            var expected = ["this", "\"is\"", "'a'", "`test`"];
            assert.equal(parseLine("this \"is\" 'a' `test`").toString(), expected.toString());
            next();
        },
        "test spaces in cli": function(next) {
            var expected = ["this", "is", "a", "test"];
            assert.equal(parseLine("this      is    a     test     ").toString(), expected.toString());
            next();
        },
        "test quoted spaces cli": function(next) {
            var expected = ["this", "\"is\"", "'a really awesome'", "`test`"];
            assert.equal(parseLine("this \"is\" 'a really awesome' `test`").toString(), expected.toString());
            next();
        }
    };
});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}