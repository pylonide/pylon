/**
 * Logger unit tests.
 *
 * @author Sergi Mansilla <sergi AT ajax DOT org>
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
}

var assert = require("assert");
var parseLine = require("ext/console/logger");
module.exports = {
    "test create item": function(next) {
        var line1 = "    This is just normal output business";
        var line1 = "This one with a little bit of color";
        assert.equal(parseLine("this is -a test").toString(), expected1.toString());
        next();
    }
};

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec()
}
