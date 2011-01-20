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

exports.isPortOpen = function(hostname, port, timeout, callback) {
    var stream = net.createConnection(port, hostname);

    stream.on("connect", function() {
        clearTimeout(id);
        stream.end();
        callback(true);
    });
    
    stream.on("error", function() {
        clearTimeout(id);        
        callback(false);
    });
    
    var id = setTimeout(function() {
        stream.end();
        callback(false);
    }, timeout);
};

function asyncRepeat(callback, onDone) {
    callback(function() {
        asyncRepeat(callback, onDone);
    }, onDone);
}