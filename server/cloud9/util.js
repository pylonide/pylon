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