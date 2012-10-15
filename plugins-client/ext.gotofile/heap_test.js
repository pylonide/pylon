/*
 * @copyright Copyright(c) 2011 Ajax.org B.V. <info AT ajax.org>
 * @author Mostafa Eweda <mostafa AT c9 DOT io>
 */

if (typeof process !== "undefined")
    require("amd-loader");

define(function(require, exports, module) {

var assert = require("assert");
var Heap = require("./heap");

module.exports = {

    "test heap array": function(next) {
        var h = new Heap([10, 5, 20, 1, 3]);
        assert.equal(h.pop(), 1);
        assert.equal(h.pop(), 3);
        assert.equal(h.pop(), 5);
        assert.equal(h.pop(), 10);
        assert.equal(h.pop(), 20);
        next();
    },

    "test heap functions": function (next) {
        var h = new Heap();
        h.push(1250); h.push(410); h.push(150);
        h.push(400); h.push(150);
        assert.equal(h.N, 5);
        assert.equal(h.pop(), 150);
        assert.equal(h.pop(), 150);
        assert.equal(h.pop(), 400);
        assert.equal(h.pop(), 410);
        assert.equal(h.pop(), 1250);
        assert.equal(h.N, 0);
        next();
    }
};

});

if (typeof module !== "undefined" && module === require.main)
    require("asyncjs").test.testcase(module.exports).exec();
