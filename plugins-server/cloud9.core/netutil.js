var net = require("net");
var exec = require("child_process").exec;

exports.findFreePort = function(start, end, hostname, callback) {
    var pivot = Math.floor(Math.random() * (end-start)) + start;
    var port = pivot;
    asyncRepeat(function(next, done) {
        var stream = net.createConnection(port, hostname);
        var finito = false;

        stream.on("connect", function() {
            stream.destroy();
            port++;
            if (port > end)
                port = start;

            if (port == pivot)
                return done("Could not find free port.");

            next();
        });

        stream.on("error", function() {
            if (finito)
                return;
            done();
            finito = true;
        });

        stream.on("timeout", function() {
            if (finito)
                return;
            done();
            finito = true;
        });
    }, function(err) {
        callback(err, port);
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
    }, timeout || 1000);
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

