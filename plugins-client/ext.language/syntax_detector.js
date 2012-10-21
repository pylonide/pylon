/**
 * Cloud9 Language Foundation
 *
 * @copyright 2011, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

// Future: maybe maintain a syntax tree for an opened file
var mixedLanguages = {
    php: {
        "default": "html",
        "php-start": /<\?(?:php|\=)?/,
        "php-end": /\\?>/,
        "css-start": /<style.*>/,
        "css-end": /<\/style>/,
        "javascript-start": /<script.*>/,
        "javascript-end": /<\/script>/
    },
    html: {
        "css-start": /<style.*>/,
        "css-end": /<\/style>/,
        "javascript-start": /<script.*>/,
        "javascript-end": /<\/script>/
    }
};

// Now: One level syntax nesting supported
// Future: maybe have a stack to repesent it - if worth it
function getSyntaxRegions(doc, originalSyntax) {
     if (! mixedLanguages[originalSyntax])
        return null;
    var lines = doc.getAllLines();
    var type = mixedLanguages[originalSyntax];
    var defaultSyntax = type["default"] || originalSyntax;
    var starters = Object.keys(type).filter(function (m) {
        return m.indexOf("-start") === m.length - 6;
    });
    var syntax = defaultSyntax;
    var regions = [{syntax: syntax, sl: 0, sc: 0}];
    var endLang;
    var i, m;

    for (var row = 0; row < lines.length; row++) {
        var line = lines[row];
        if (endLang) {
            m = endLang.exec(line);
            if (m) {
                endLang = null;
                syntax = defaultSyntax;
                regions[regions.length-1].el = row;
                regions[regions.length-1].ec = m.index;
                regions.push({
                    syntax: syntax,
                    sl: row,
                    sc: m.index
                });
                lines[row] = line.substring(m.index + m[0].length);
                row--; // continue processing of the line
            }
        }
        else {
            for (i = 0; i < starters.length; i++) {
                var starter = starters[i];
                m = type[starter].exec(line);
                if (m) {
                    syntax = starter.replace("-start", "");
                    endLang = type[syntax+"-end"];
                    regions[regions.length-1].el = row;
                    regions[regions.length-1].ec = m.index + m[0].length;
                    regions.push({
                        syntax: syntax,
                        sl: row,
                        sc: m.index + m[0].length
                    });
                    lines[row] = line.substring(m.index + m[0].length);
                    row--; // continue processing of the line
                }
            }
        }
    }
    regions[regions.length-1].el = lines.length;
    regions[regions.length-1].ec = lines[lines.length-1].length;
    return regions;
}

function getContextSyntax(doc, pos, originalSyntax) {
     if (! mixedLanguages[originalSyntax])
        return originalSyntax;
    var regions = getSyntaxRegions(doc, originalSyntax);
    for (var i = 0; i < regions.length; i++) {
        var region = regions[i];
        if ((pos.row > region.sl && pos.row < region.el) ||
            (pos.row === region.sl && pos.column >= region.sc) ||
            (pos.row === region.el && pos.column <= region.ec))
            return region.syntax;
    }
    return null; // should never happen
}

exports.getContextSyntax = getContextSyntax;
exports.getSyntaxRegions = getSyntaxRegions;

});