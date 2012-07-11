/**
 * Cloud9 Language Foundation, project analysis support
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

var ide = require("core/ide");

define(function(require, exports, module) {
    
    var model;
    
    module.exports.hook = function() {
        var _self = this;
        
        ide.addEventListener("init.ext/filesystem/filesystem", function(e) {
            _self.model = e.ext.model;
        });
    
        ide.addEventListener("settings.load", function(e) {
            console.log("settings loadened!");
        });
    };
});