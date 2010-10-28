/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var Events = require("events");

function cloud9Plugin() {}

(function() {
    this.getHooks = function() {
        return this.hooks || [];
    };
}).call(cloud9Plugin.prototype = new Events.EventEmitter());

module.exports = cloud9Plugin;
