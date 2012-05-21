require("amd-loader");
var DMP = require("./diff_match_patch");
var stdin = process.stdin;
var Diff = new DMP();
var dataString = "";

stdin.resume();
stdin.on("data",function(chunk) { // called on each line of input
  dataString += chunk.toString();
});

stdin.on("end",function() {
    var diff;
    try { diff = JSON.parse(dataString); }
    catch(e) { console.error("Error parsing JSON."); }

    if (diff) {
        var result = Diff[diff.type](diff.param1, diff.param2);
        if (typeof result !== "string") {
            result = JSON.stringify(result);
        }
        console.log(result);
    }
});
