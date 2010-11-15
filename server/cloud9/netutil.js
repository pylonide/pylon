var net = require("net");

exports.findFreePort = function(start, hostname, callback) {
    var port = start;
    asyncRepeat(function(next, done) {
        var stream = net.createConnection(port, hostname);
        
        stream.on("connect", function() {
            stream.end();
            port++;
            next();
        });
        
        stream.on("error", function() {
            done();
        });
    }, function() {
        callback(port);
    });
}

function asyncRepeat(callback, onDone) {
    callback(function() {
        asyncRepeat(callback, onDone);
    }, onDone);
}