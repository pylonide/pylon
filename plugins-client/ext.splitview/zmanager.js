/**
 * Manage z-indexes
 *
 * @copyright 2010, Ajax.org B.V.
 * @author Mike de Boer <mike AT c9 DOT io>
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

module.exports = function(startIndex, increment) {
    var base = startIndex || 1;
    var incrBy = increment || 2;

    this.set = function(htmlNode) {
        htmlNode.$storedZ = apf.getStyle(htmlNode, "zIndex");
        base += incrBy;
        htmlNode.style.zIndex = base;
    };

    this.clear = function(htmlNode) {
        if (typeof htmlNode.$storedZ == "undefined")
            return;
        htmlNode.style.zIndex = htmlNode.$storedZ;
        delete htmlNode.$storedZ;
    };

    this.resetAll = function(nodes) {
        if (!apf.isArray(nodes) || !nodes.length)
            return;

        base = startIndex || 1;

        var i = 0;
        var l = nodes.length;
        for (; i < l; ++i)
            this.clear(nodes[i]);
        for (i = 0; i < l; ++i)
            this.set(nodes[i]);
    };

};

});
