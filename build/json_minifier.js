var args = process.argv.slice(2),
    fileIn = args[0],
    fileOut = args[1],
    fs = require("fs");

    fs.readFile(fileIn, "utf8", function(err, json) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        
        fs.writeFileSync(fileOut, JSON.stringify(JSON.parse(json), null));
    });