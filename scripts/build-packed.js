var EXEC = require("child_process").exec;

EXEC("make package", function (error, stdout, stderr) {
    if (error) {
        console.error(stderr);
        process.exit(1);
    }
    
    console.log(stdout);
});