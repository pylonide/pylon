/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var modes = require("ace/ext/modelist").modes;

var specialMimeTypes = {
    c_cpp: "text/x-c",
    clojure: "text/x-script.clojure",
    coffee: "text/x-script.coffeescript",
    css: "text/css",
    golang: "text/x-go",
    haml: "text/haml",
    haxe: "text/haxe",
    html: "text/html",
    java: "text/x-java-source",
    javascript: "application/javascript",
    json: "application/json",
    latex: "application/x-latex",
    objectivec: "text/objective-c",
    ocaml: "text/x-script.ocaml",
    perl: "text/x-script.perl",
    php: "application/x-httpd-php",
    powershell: "text/x-script.powershell",
    python: "text/x-script.python",
    ruby: "text/x-script.ruby",
    sh: "application/x-sh",
    svg: "image/svg+xml",
    text: "text/plain",
    textile: "text/x-web-textile",
    xml: "application/xml"
};
var primaryModes = ["c_cpp","clojure","coffee","csharp","css","dart","golang",
    "html","jade","java","javascript","json","less","lua","perl","php","python",
    "ruby","scala","scss","sh","stylus","sql","text","typescript","xml","xquery",
    "yaml"];

var hiddenModes = ["c9search", "text", "snippets"];
var SupportedModes = {};
var fileExtensions = {};
var ModesCaption = {};
var contentTypes = {};
modes.forEach(function(mode) {
    if (!mode || typeof mode.extensions != "string") {
        console.error && console.error(name, mode);
        return;
    }
    var caption = mode.caption;
    var name = mode.name;

    mode.id = name;
    mode.mime = specialMimeTypes[name] || "text/x-" + name;
    mode.hidden = hiddenModes.indexOf(mode.name) != -1;
    mode.isPrimary = primaryModes.indexOf(mode.name) != -1;
    // todo change customtypes filename character to match with ace
    mode.ext = mode.extensions.replace(/\^/g, "*");
    mode.ext.split("|").forEach(function(ext) {
        fileExtensions[ext] = name;
    });
    
    SupportedModes[name] = mode;
    ModesCaption[caption] = name;

    contentTypes[mode.mime] = name;
});


module.exports = {
    all: SupportedModes, 
    extensions: fileExtensions,
    captions: ModesCaption,
    types: contentTypes
}
});


