var Util = require("util");

var levels = {
    "info":  ["\033[1m\033[90m", "\033[39m\033[22m"], // grey
    "error": ["\033[31m", "\033[39m"], // red
    "fatal": ["\033[35m", "\033[39m"], // magenta
    "exit":  ["\033[36m", "\033[39m"]  // cyan
};
var _slice = Array.prototype.slice;


var log = function() {
    var args = _slice.call(arguments);
    var lastArg = args[args.length - 1];

    var level = levels[lastArg] ? args.pop() : "info";
    if (!args.length)
        return;

    var msg = args.map(function(arg) {
        return typeof arg != "string" ? Util.inspect(arg) : arg;
    }).join(" ");
    var pfx = levels[level][0] + "[" + level + "]" + levels[level][1];

    msg.split("\n").forEach(function(line) {
        console.log(pfx + " " + line);
    });
};

log("This is info");
log("This is error", "error");
log("This is fatal", "fatal");
log("This is exit", "exit");

console.log("");

// classic, additional test:
var T = "gYw";   // The test text

console.log("\n                 40m     41m     42m     43m\
     44m     45m     46m     47m");

['    m', '   1m', '  30m', '1;30m', '  31m', '1;31m', '  32m', '1;32m', '  33m', 
 '1;33m', '  34m', '1;34m', '  35m', '1;35m', '  36m', '1;36m', '  37m', 
 '1;37m'].forEach(function(FGs) {
    var FG = FGs.replace(/[\s\t]+/g, "");
    console.log(" " + FGs + " \033[" + FG + "  " + T + "  ");
    //["40m", "41m", "42m,", "43m", "44m", "45m", "46m", "47m"].forEach(function(BG) {
    //    console.log("\033[" + FG + "\033[" + BG + "  " + T + "  \033[0m");
    //});
});

log("<b>" + levels["fatal"][0] + "Lastly:" + levels["fatal"][1] + " some HTML!</b>");
