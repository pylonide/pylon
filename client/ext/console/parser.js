define(function(require, exports, module) {
// Parses a CLI instruction line and returns an array of its arguments, respecting
// quotes and special cases.
module.exports = function(lineBuffer) {
    var argv = [];
    var cursor = 0;
    var currentQuote = "";
    var inSpace = false;
    var len = lineBuffer.length;

    for (var i=0; i<len; i++) {
        var ch = lineBuffer.charAt(i);
        if (!argv[cursor])
            argv[cursor] = "";

        if (/["'`]/.test(ch)) {
            argv[cursor] += ch;
            if (currentQuote.length) {
                if (currentQuote === ch)
                    currentQuote = "";
            }
            else {
                currentQuote = ch;
            }
            inSpace = false;
        }
        else if (/\s/.test(ch)) {
            if (currentQuote.length) {
                inSpace = false;
                argv[cursor] += ch;
            }
            else if (!inSpace) {
                inSpace = true;
                cursor += 1;
            }
        }
        else {
            inSpace = false;
            argv[cursor] += ch;
        }
    }

    if (argv[argv.length - 1] === "")
        argv.pop();

    return argv;
};
});
