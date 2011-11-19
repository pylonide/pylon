/**
 * @copyright 2011, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
exports.extend = function(dest, src) {
    for (var prop in src) {
        dest[prop] = src[prop];
    }
    return dest;
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i = 0; i < arr.length; i++)
        map[arr[i]] = 1;
    return map;
};
