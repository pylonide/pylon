define(function(require, exports, module) {
    module.exports = {
        "fun": "function ^^() {\n    \n}",
        "fn": "function() {\n    ^^\n}",
        "sc": "(function() {\n    ^^\n})();",
        "if": "if (^^) {\n    \n}",
        "while": "while (^^) {\n    \n}",
        "switch": "switch (^^) {\n    default:\n}",
        "fora": "for (var i = 0; i < ^^.length; i++) {\n    \n}",
        "log": "console.log(^^);",
        "setTimeout": "setTimeout(function() {\n    ^^\n}, 0);"
    };
});