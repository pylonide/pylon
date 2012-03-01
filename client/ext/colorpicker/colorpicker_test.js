if (typeof process !== "undefined") {
    require("amd-loader");
}


if (typeof process !== "undefined") {
    require("../../../support/paths");
    require.paths.unshift(__dirname + "/../..");
}

var regex = require("./colorpicker_regex");

define(function(require, exports, module) {
    var assert = require("assert");

    module.exports = {
        "test simple rgb": function(next) {
            var res = regex.isRgb("rgb(14, 235, 19)");
            
            assert.equal(!!res, true);
            assert.equal(res[1], "14");
            assert.equal(res[2], "235");
            assert.equal(res[3], "19");
            assert.equal(res[4], undefined);
            
            next();
        },
        "test simple rgba": function(next) {
            var res = regex.isRgb("rgba(14, 235, 19, .9)");
            
            assert.equal(!!res, true);
            assert.equal(res[1], "14");
            assert.equal(res[2], "235");
            assert.equal(res[3], "19");
            assert.equal(res[4], ", .9");
            
            next();
        },
        "test rgba with transparancy over 1": function(next) {
            var res = regex.isRgb("rgba(14, 235, 19, 1.9)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test rgb with values over 255": function(next) {
            var res = regex.isRgb("rgb(256, 19, 32)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test hsl": function(next) {
            var res = regex.isHsl("hsl(14, 99%, 33%)");
            
            assert.equal(!!res, true);
            assert.equal(res[1], "14");
            assert.equal(res[2], "99");
            assert.equal(res[3], "33");
            assert.equal(res[4], undefined);
            
            next();
        },
        "test hsla": function(next) {
            var res = regex.isHsl("hsla(14, 99%, 33%, .7)");
            
            assert.equal(!!res, true);
            assert.equal(res[1], "14");
            assert.equal(res[2], "99");
            assert.equal(res[3], "33");
            assert.equal(res[4], ", .7");
            
            next();
        },
        "test hsla positive transparancy": function(next) {
            var res = regex.isHsl("hsla(14, 99%, 33%, 3.7)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test hsla values too high": function(next) {
            var res = regex.isHsl("hsla(201, 101%, 00000411%, 0.7)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test hsla bullocks values": function(next) {
            var res = regex.isHsl("hsla(abc, def, geh, .9)");
            
            assert.equal(!!res, false);
            
            next();
        },
        "test text colors": function(next) {
            var res = regex.isColor("white");
            
            assert.equal(!!res, true);
            
            next();
        },
        "test text any string": function(next) {
            var res = regex.isColor("jan is cool");
            
            assert.equal(!!res, false);
            
            next();
        },  
    };
});

if (typeof module !== "undefined" && module === require.main) {
    require("asyncjs").test.testcase(module.exports).exec();
}