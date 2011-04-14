/**
 * Utilities for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
    
var ide = require("core/ide");

exports.alert = function(title, header, msg, onhide) {
    winAlert.show();
    winAlert.setAttribute('title', title);
    winAlertHeader.$ext.innerHTML = header;
    winAlertMsg.$ext.innerHTML = msg;
    if (onhide)
        winAlert.onhide = function() {
            winAlertMsg.onhide = null;
            onhide();
        };
    else
        winAlert.onhide = null;
};

exports.confirm = function(title, header, msg, onconfirm, oncancel) {
    winConfirm.show();   
    winConfirm.setAttribute("title", title);
    winConfirmHeader.$ext.innerHTML = header;
    winConfirmMsg.$ext.innerHTML = msg;
    btnConfirmOk.onclick = onconfirm;
    btnConfirmCancel.onclick = oncancel;
};

exports.question = function(title, header, msg, onyes, onyestoall, onno, onnotoall) {
    winQuestion.show();   
    winQuestion.setAttribute("title", title);
    winQuestionHeader.$ext.innerHTML = header;
    winQuestionMsg.$ext.innerHTML = msg;
    btnQuestionYes.onclick = onyes;
    btnQuestionYesToAll.onclick = onyestoall;
    btnQuestionNo.onclick = onno;
    btnQuestionNoToAll.onclick = onnotoall;
};

var SupportedIcons = {
   "application/xhtml+xml":'html',
   "text/css": "css",
   "text/html":'html',
    "application/pdf":'page_white_acrobat',
    "image":'image',
    "application/xml":'page_white_code_red',
    "image/svg+xml": "page_white_picture",
    "text/plain": 'page_white_text',
    "application/javascript": 'page_white_code',
    "application/json": 'page_white_code',
    "text/x-script.python": 'script_code',
    "application/x-httpd-php": 'page_white_php',
    "text/x-script.ruby": "page_white_ruby",
    "text/x-script.coffeescript": 'script_code',
    "text/cpp": 'page_white_cplusplus',
    "text/x-c": 'page_white_c',
    "text/x-csharp": 'page_white_csharp',
    "text/text/x-java-source": 'page_white_cup'
};
        
var contentTypes = {
    "js": "application/javascript",
    "json": "application/json",
    "css": "text/css",
    
    "xml": "application/xml",
    "rdf": "application/rdf+xml",
    "rss": "application/rss+xml",
    "svg": "image/svg+xml",
    "wsdl": "application/wsdl+xml",
    "xslt": "application/xslt+xml",
    "atom": "application/atom+xml",
    "mathml": "application/mathml+xml",
    "mml": "application/mathml+xml",
    
    "php": "application/x-httpd-php",
    "html": "text/html",
    "xhtml": "application/xhtml+xml",
    "coffee": "text/x-script.coffeescript",
    "py": "text/x-script.python",
    
    "ru": "text/x-script.ruby",
    "gemspec": "text/x-script.ruby",
    "rake": "text/x-script.ruby",
    "rb": "text/x-script.ruby",
    
    "c": "text/x-c",
    "cc": "text/x-c",
    "cpp": "text/x-c",
    "cxx": "text/x-c",
    "h": "text/x-c",
    "hh": "text/x-c",
    
    "bmp": "image",
    "djv": "image",
    "djvu": "image",
    "gif": "image",
    "ico": "image",
    "jpeg": "image",
    "jpg": "image",
    "pbm": "image",
    "pgm": "image",
    "png": "image",
    "pnm": "image",
    "ppm": "image",
    "psd": "image",
    "svg": "image",
    "svgz": "image",
    "tif": "image",
    "tiff": "image",
    "xbm": "image",
    "xpm": "image"
};
    
exports.getFileIcon = function(xmlNode) {
    var name = xmlNode.getAttribute('name');
    var icon  = "page_white_text";
    var ext;
    
    if (name) {
        ext = name.split(".").pop();
        icon = SupportedIcons[contentTypes[ext]] || "page_white_text";
    }
    return icon + ".png";
};

    
exports.getContentType = function(filename) {
    var type = filename.split(".").pop() || "";
    return contentTypes[type] || "text/plain";
};

});