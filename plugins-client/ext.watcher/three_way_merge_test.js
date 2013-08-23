if (typeof process !== "undefined") {
    require("amd-loader");
}

define(function(require, exports, module) {
"use strict";

var Document = require("ace/lib/ace/document").Document;
var merge = require("./three_way_merge");
var assert = require("assert");

module.exports = {
    "test remote changed": function() {
        var root = "Hello World";
        var theirs = "Hello Peter";
        var ours = new Document(root);

        merge.merge(root, theirs, ours);
        assert.equal(ours.getValue(), "Hello Peter");
    },

    "test ours changed": function() {
        var root = "Hello World";
        var theirs = "Hello World";
        var ours = new Document("Hello Max");

        merge.merge(root, theirs, ours);
        assert.equal(ours.getValue(), "Hello Max");
    },

    "test both changed": function() {
        var root = "Hello World";
        var theirs = "Hello Peter";
        var ours = new Document("Hallo World");

        merge.merge(root, theirs, ours);
        assert.equal(ours.getValue(), "Hallo Peter");
    },

    "test multi line": function() {
        var root = [
            "Hello Peter",
            "abcdefg",
            "o my god"
        ].join("\n");
        var theirs = [
            "Hello Max",
            "abcdefg",
            "bla bla",
            "o my god"
        ].join("\n");
        var ours = new Document([
            "Hello Paul",
            "abcdefg",
            "o my"
        ]);

        merge.merge(root, theirs, ours);

        assert.equal(ours.getValue(), [
            "<<<<<<<<< saved version",
            "Hello Max",
            "=========",
            "Hello Paul",
            ">>>>>>>>> local version",
            "abcdefg",
            "bla bla",
            "o my"
            ].join("\n")
        );
    },

    "test both changed with conflict": function() {
        var root = "Hello World";
        var theirs = "Hello Peter";
        var ours = new Document("Hello Max");

        merge.merge(root, theirs, ours);
        assert.equal(ours.getValue(), [
            "<<<<<<<<< saved version",
            "Hello Peter",
            "=========",
            "Hello Max",
            ">>>>>>>>> local version"].join("\n")
        );
    },

    "test multi line diff3": function() {
        var root = [
            "Hello Peter",
            "abcdefg",
            "o my god"
        ].join("\n");
        var theirs = [
            "Hello Max",
            "abcdefg",
            "bla bla",
            "o my god"
        ].join("\n");
        var ours = [
            "Hello Paul",
            "abcdefg",
            "o my"
        ].join("\n");

        var merged = merge.diff3(theirs, root, ours);

        assert.equal(merged, [
            "<<<<<<<<< saved version",
            "Hello Max",
            "=========",
            "Hello Paul",
            ">>>>>>>>> local version",
            "abcdefg",
            "bla bla",
            "o my"
            ].join("\n")
        );
    },

    "test patch ace": function() {
        var value = "Juhu kinners";
        var newValue = "Juhu max";
        var doc = new Document(value);

        merge.patchAce(value, newValue, doc);
        assert.equal(newValue, doc.getValue());
    },
    
    "test patch bigger file": function() {
        var value = require("fs").readFileSync(__filename, "utf8");
        var doc = new Document(value);
        var newValue = value.replace(/function/g, "def");

        console.time("patch");
        merge.patchAce(value, newValue, doc);
        console.timeEnd("patch");
        
        assert.equal(newValue, doc.getValue());
    },
    
    "!test merge indexes": function() {
        console.log(require("./diff").diff_indices("Juhu Kinners", "Juhu Fabian"));
    }
};

});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}