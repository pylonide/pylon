/**
 * Line reporter for the Cloud9 IDE
 *
 * @copyright 2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

module.exports = {
    
    parseOutput: function(output) {
        var lines = output.split("\n");
        var results = [];
        for (var i = 0; i < lines.length; i++) {
            results.push(this.parseOutputLine(lines[i]));
        }
        return results;
    },
    
    parseOutputLine: function(line) {
        var match = line.match(/^\s*(\d+):\s*(\d+):\s*(.*)/);
        if (!match)
            return;
        var warningMatch = match[3].match(/^\s.?warning.?:?\s*(.*)/i);
        var errorMatch = match[3].match(/^\.?error.?:?\s*(.*)/i);
        var infoMatch = match[3].match(/^\.?info.?:?\s*(.*)/i);
        return {
            pos: { sl: parseInt(match[1], 10), sc: parseInt(match[2], 10) },
            type: 'unused',
            level: warningMatch ? 'warning' : infoMatch ? 'info' : 'error',
            message: warningMatch ? warningMatch[1] :
                     infoMatch ? infoMatch[1] :
                     errorMatch ? errorMatch[1] :
                     match[3]
        };   
    }

};

});