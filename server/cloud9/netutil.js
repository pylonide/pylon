var net = require("net");
var exec = require("child_process").exec;

exports.findFreePort = function(start, hostname, callback) {
    var port = start;
    asyncRepeat(function(next, done) {
        var stream = net.createConnection(port, hostname);
        
        stream.on("connect", function() {
            stream.destroy();
            port++;
            next();
        });
        
        stream.on("error", function() {
            done();
        });
    }, function() {
        callback(port);
    });
};

exports.isPortOpen = function(hostname, port, timeout, callback) {
    var stream = net.createConnection(port, hostname);

    stream.on("connect", function() {
        clearTimeout(id);
        stream.destroy();
        callback(true);
    });
    
    stream.on("error", function() {
        clearTimeout(id);        
        stream.destroy();
        callback(false);
    });
    
    var id = setTimeout(function() {
        stream.destroy();
        callback(false);
    }, timeout);
};

exports.getHostName = function(callback) {
    exec("hostname", function (error, stdout, stderr) {
        if (error)
            return callback(stderr);
            
        callback(null, stdout.toString().split("\n")[0]);
    });
};

function asyncRepeat(callback, onDone) {
    callback(function() {
        asyncRepeat(callback, onDone);
    }, onDone);
}