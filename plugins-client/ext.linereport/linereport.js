/**
 * Line reporter core for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

module.exports = {
    
    parseOutputLines: function(output) {
        var lines = output.split("\n");
        var results = [];
        for (var i = 0; i < lines.length; i++) {
            var match = lines[i].match(/^\s*(\d+):\s*(\d+):\s*(.*)/);
            if (!match)
                continue;
            var warningMatch = match[3].match(/^\swarning:?\s*(.*)/i);
            var errorMatch = match[3].match(/^\error:?\s*(.*)/i);
            var infoMatch = match[3].match(/^\info:?\s*(.*)/i);
            results.push({
                pos: { sl: parseInt(match[1], 10), sc: parseInt(match[2], 10) },
                type: 'unused',
                level: warningMatch ? 'warning' : infoMatch ? 'info' : 'error',
                message: warningMatch ? warningMatch[1] :
                         infoMatch ? infoMatch[1] :
                         errorMatch ? errorMatch[1] :
                         match[3]
            });
        }
        return results;
    }

};

});