var exec = require("child_process").exec;

exec("make apfdebug", function (error, stdout, stderr) {
    if (error) {
        console.error(stderr);
        process.exit(1);
    }
    
    console.log(stdout);
});