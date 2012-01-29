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

String.prototype.escapeHTML = function() { return this; };

define(function(require, exports, module) {
    var assert = require("assert");
    var createItem = require("ext/console/logger").test.createItem;
    console.log(createItem);

    var ide = {
        workspaceDir: "sergi/exampleProject",
        davPrefix: "sergi/exampleProject"
    };

    module.exports = {
        "test create item": function(next) {
            var line1 = "    This is just normal output business";
            var expected1 = "<div>&nbsp;&nbsp;&nbsp;&nbsp;This is just normal output business</div>";

            var line1Created = createItem(line1, ide);
            assert.equal(line1Created, expected1);

            next();
        },
        "test create item with color": function(next) {
            var line2 = "This one with a little bit of [32mcolor";
            var expected2 = "<div>This one with a little bit of <span style='color: green'>color</div>";

            var line2Created = createItem(line2, ide);
            assert.equal(line2Created, expected2);

            var line3 = "This one with a little bit of [32mcolor [31mand even a red bit";
            var expected3 = "<div>This one with a little bit of <span style='color: green'>color "
                + "<span style='color: red'>and even a red bit</div>";

            var line3Created = createItem(line3, ide);
            assert.equal(line3Created, expected3);

            next();
        },
    };
});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}