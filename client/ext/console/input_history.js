/**
 * Utility for pushing and retrieving input
 * 
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

module.exports = (function() {
    function InputHistory() {
        this._history = [""];
        this._index = 0;
    }

    InputHistory.prototype = {
        push: function(cmd) {
            this._history.push(cmd);
            this._index = this.length();
        },

        length: function() {
            return this._history.length;
        },

        getNext: function() {
            this._index += 1;
            var cmd = this._history[this._index] || "";
            this._index = Math.min(this.length(), this._index);
            return cmd;
        },

        getPrev: function() {
            this._index = Math.max(0, this._index - 1);
            return this._history[this._index];
        }
    };

    return InputHistory;
})();

});