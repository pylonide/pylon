var exec = require("child_process").exec;

exports.killTree = function(pid, signal) {
    if (pid <= 0)
        return;

    exports.childrenOfPid(pid, function(err, pids) {
        if (err)
            return;

        pids.forEach(function(pid) {
            try {
                process.kill(pid, signal);
            } catch (e) {}
        });
    });
};

exports.childrenOfPid = function(pid, callback) {
    exec("ps -A -oppid,pid", function(error, stdout, stderr) {
        if (error)
            return callback(stderr);

        var parents = {};
        stdout.split("\n").slice(1).forEach(function(line) {
            var columns = line.trim().split(/\s+/g);
            var ppid = columns[0];
            var pid = columns[1];

            if (!parents[ppid])
                parents[ppid] = [pid];
            else
                parents[ppid].push(pid);
        });

        function search(roots) {
            var res = roots.concat();
            for (var i = 0; i < roots.length; i++) {
                var children = parents[roots[i]];

                if (children && children.length)
                    res.push.apply(res, search(children));
            }
            return res;
        }

        var children = search([pid]);

        callback(null, children);
    });
};