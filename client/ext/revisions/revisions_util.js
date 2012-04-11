define(function(require, exports, module) {

var TIMELAPSE = 10 * 60 * 1000;
exports.compactRevisions = function(timestamps) {
    if (!timestamps.length) {
        return [];
    }
    else if (timestamps.length === 1) {
        return [timestamps];
    }

    return timestamps.reduce(function(prev, curr) {
        var p = [prev];
        var c = [curr];

        if (prev.length) {
            var last = prev[prev.length - 1];
            if (curr < (last[0] + TIMELAPSE)) {
                last.push(curr);
            }
            else {
                prev.push(c);
            }
            return prev;
        }
        else {
            if (curr < (prev + TIMELAPSE)) {
                p.push(curr);
                return [[prev, curr]];
            }
            else {
                return [p, c];
            }
        }
    });
};

exports.localDate = function(ts) {
    var getTZOffset = function(ts) {
        return -(new Date()).getTimezoneOffset() * 60000;
    };

    return new Date(ts + getTZOffset(ts));
};
});
