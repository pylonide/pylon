/*global tabEditors:true, winQuestion:true, winAlert:true, winAlertHeader:true
winAlertMsg:true, winConfirm:true */

/**
 * Utilities for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {

var ide = require("core/ide");
var markup = require("text!core/util.xml");

exports.escapeXpathString = function(name){
    if (!name)
        return "";

    if (name.indexOf('"') > -1) {
        var out = [];
        var parts = name.split('"');
        parts.each(function(part) {
            out.push(part == "" ? "'\"'" : '"' + part + '"');
        });
        return "concat(" + out.join(", ") + ")";
    }
    return '"' + name + '"';
};

exports.isNewPage = function(page) {
    return parseInt(page.$model.data.getAttribute("newfile"), 10) === 1;
};

exports.alert = function(title, header, msg, onhide) {
    if (!self.winAlert)
        apf.document.documentElement.insertMarkup(markup);

    winAlert.show();
    winAlert.setAttribute("title", title);
    winAlertHeader.$ext.innerHTML = exports.escapeXml(header);
    winAlertMsg.$ext.innerHTML = exports.escapeXml(msg);
    if (onhide)
        winAlert.onhide = function() {
            winAlertMsg.onhide = null;
            onhide();
        };
    else
        winAlert.onhide = null;
};

exports.confirm = function(title, header, msg, onconfirm, oncancel) {
    if (!self.winConfirm)
        apf.document.documentElement.insertMarkup(markup);

    winConfirm.show();
    winConfirm.setAttribute("title", title);
    winConfirmHeader.$ext.innerHTML = exports.escapeXml(header);
    winConfirmMsg.$ext.innerHTML = exports.escapeXml(msg);
    btnConfirmOk.onclick = onconfirm;
    btnConfirmCancel.onclick = oncancel;
};

exports.question = function(title, header, msg, onyes, onyestoall, onno, onnotoall) {
    if (!self.winQuestion)
        apf.document.documentElement.insertMarkup(markup);

    winQuestion.show();
    winQuestion.setAttribute("title", title);
    winQuestionHeader.$ext.innerHTML = exports.escapeXml(header);
    winQuestionMsg.$ext.innerHTML = exports.escapeXml(msg);
    btnQuestionYes.onclick = onyes;
    btnQuestionYesToAll.onclick = onyestoall;
    btnQuestionNo.onclick = onno;
    btnQuestionNoToAll.onclick = onnotoall;
};

exports.removeInteractive = function (amlNode) {
    if (ide.readonly == true)
        return false;

    if (amlNode.confirmed == undefined)
        amlNode.confirmed = false;

    if (!amlNode.confirmed) {
        var files = amlNode.getSelection();

        function confirm(file) {
            var name = file.getAttribute("name");
            var type = file.getAttribute("type");
            exports.question(
                "Confirm Remove",
                "You are about to remove the " + (type || "item") + " " + name,
                "Do you want continue? (This change cannot be undone)",
                function () { // Yes
                    file.setAttribute("deleted", true);
                    amlNode.confirmed = true;
                    amlNode.remove(file);
                    amlNode.confirmed = false;
                    if (files.length > 0)
                        confirm(files.shift());
                    else
                        winQuestion.hide();
                },
                function () { // Yes to all
                    amlNode.confirmed = true;
                    amlNode.remove(file);
                    files.forEach(function (file) {
                        file.setAttribute("deleted", true);
                        amlNode.remove(file);
                    });
                    amlNode.confirmed = false;
                    winQuestion.hide();
                },
                function () { // No
                    if (files.length > 0)
                        confirm(files.shift());
                    else
                        winQuestion.hide();
                },
                function () { // No to all
                    winQuestion.hide();
                }
            );
            btnQuestionYesToAll.setAttribute("visible", files.length > 0);
            btnQuestionNoToAll.setAttribute("visible", files.length > 0);
        }
        confirm(files.shift());
        return false;
    } else {
        return true;
    }
};

var SupportedIcons = {
   "application/xhtml+xml":"html",
   "text/css": "css",
   "text/x-scss": "css",
   "text/x-sass": "css",
   "text/html":"html",
    "application/pdf":"page_white_acrobat",
    "image":"image",
    "application/xml":"page_white_code_red",
    "image/svg+xml": "page_white_picture",
    "text/plain": "page_white_text",
    "application/javascript": "page_white_code",
    "application/json": "page_white_code",
    "text/x-script.python": "page_white_code",
    "text/x-script.ocaml": "page_white_code",
    "text/x-script.clojure": "page_white_code",
    "application/x-httpd-php": "page_white_php",
    "application/x-sh": "page_white_wrench",
    "text/x-coldfusion": "page_white_coldfusion",
    "text/x-script.ruby": "page_white_ruby",
    "text/x-script.coffeescript": "page_white_cup",
    "text/cpp": "page_white_cplusplus",
    "text/x-c": "page_white_c",
    "text/x-csharp": "page_white_csharp",
    "text/text/x-java-source": "page_white_cup",
    "text/x-markdown": "page_white_text",
    "text/x-xquery": "page_white_code"
};

var contentTypes = {
    "c9search": "text/x-c9search",

    "js": "application/javascript",
    "json": "application/json",
    "css": "text/css",
    "scss": "text/x-scss",
    "sass": "text/x-sass",

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
    "phtml": "application/x-httpd-php",
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
    "hpp": "text/x-c",

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
    "svgz": "image",
    "tif": "image",
    "tiff": "image",
    "xbm": "image",
    "xpm": "image",

    "clj": "text/x-script.clojure",
    "ml": "text/x-script.ocaml",
    "mli": "text/x-script.ocaml",
    "cfm": "text/x-coldfusion",
    "sql": "text/x-sql",

    "sh": "application/x-sh",
    "bash": "application/x-sh",

    "xq": "text/x-xquery",

    "terminal": "terminal"
};

exports.getFileIcon = function(xmlNode) {
    var name = xmlNode.getAttribute("name");
    var icon  = "page_white_text";
    var ext;

    if (name) {
        ext = name.split(".").pop().toLowerCase();
        icon = SupportedIcons[contentTypes[ext]] || "page_white_text";
    }
    return icon + ".png";
};


exports.getContentType = function(filename) {
    var type = filename.split(".").pop().split("!").pop().toLowerCase() || "";
    return contentTypes[type] || "text/plain";
};

// taken from http://xregexp.com/
exports.escapeRegExp = function(str) {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s"']/g, "\\$&");
};

exports.escapeXml = apf.escapeXML;
exports.isTrue = apf.isTrue;
exports.isFalse = apf.isFalse;

exports.replaceStaticPrefix = function (string) {
    return string.replace(new RegExp("{ide.staticPrefix}", "g"), window.cloud9config.staticUrl);
};

/*
 * JavaScript Linkify - v0.3 - 6/27/2009
 * http://benalman.com/projects/javascript-linkify/
 *
 * Copyright (c) 2009 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 *
 * Some regexps adapted from http://userscripts.org/scripts/review/7122
 */
exports.linkify=function(){var k="[a-z\\d.-]+://",h="(?:(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])\\.){3}(?:[0-9]|[1-9]\\d|1\\d{2}|2[0-4]\\d|25[0-5])",c="(?:(?:[^\\s!@#$%^&*()_=+[\\]{}\\\\|;:'\",.<>/?]+)\\.)+",n="(?:ac|ad|aero|ae|af|ag|ai|al|am|an|ao|aq|arpa|ar|asia|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|biz|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|cat|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|coop|com|co|cr|cu|cv|cx|cy|cz|de|dj|dk|dm|do|dz|ec|edu|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gov|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|info|int|in|io|iq|ir|is|it|je|jm|jobs|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mil|mk|ml|mm|mn|mobi|mo|mp|mq|mr|ms|mt|museum|mu|mv|mw|mx|my|mz|name|na|nc|net|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|org|pa|pe|pf|pg|ph|pk|pl|pm|pn|pro|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sy|sz|tc|td|tel|tf|tg|th|tj|tk|tl|tm|tn|to|tp|travel|tr|tt|tv|tw|tz|ua|ug|uk|um|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|xn--0zwm56d|xn--11b5bs3a9aj6g|xn--80akhbyknj4f|xn--9t4b11yi5a|xn--deba0ad|xn--g6w251d|xn--hgbk6aj7f53bba|xn--hlcj6aya9esc7a|xn--jxalpdlp|xn--kgbechtv|xn--zckzah|ye|yt|yu|za|zm|zw)",f="(?:"+c+n+"|"+h+")",o="(?:[;/][^#?<>\\s]*)?",e="(?:\\?[^#<>\\s]*)?(?:#[^<>\\s]*)?",d="\\b"+k+"[^<>\\s]+",a="\\b"+f+o+e+"(?!\\w)",m="mailto:",j="(?:"+m+")?[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@"+f+e+"(?!\\w)",l=new RegExp("(?:"+d+"|"+a+"|"+j+")","ig"),g=new RegExp("^"+k,"i"),b={"'":"`",">":"<",")":"(","]":"[","}":"{","B;":"B+","b:":"b9"},i={callback:function(q,p){return p?'<a href="'+p+'" title="'+p+'">'+q+"</a>":q},punct_regexp:/(?:[!?.,:;'"]|(?:&|&amp;)(?:lt|gt|quot|apos|raquo|laquo|rsaquo|lsaquo);)$/};return function(u,z){z=z||{};var w,v,A,p,x="",t=[],s,E,C,y,q,D,B,r;for(v in i){if(z[v]===undefined){z[v]=i[v]}}while(w=l.exec(u)){A=w[0];E=l.lastIndex;C=E-A.length;if(/[\/:]/.test(u.charAt(C-1))){continue}do{y=A;r=A.substr(-1);B=b[r];if(B){q=A.match(new RegExp("\\"+B+"(?!$)","g"));D=A.match(new RegExp("\\"+r,"g"));if((q?q.length:0)<(D?D.length:0)){A=A.substr(0,A.length-1);E--}}if(z.punct_regexp){A=A.replace(z.punct_regexp,function(F){E-=F.length;return""})}}while(A.length&&A!==y);p=A;if(!g.test(p)){p=(p.indexOf("@")!==-1?(!p.indexOf(m)?"":m):!p.indexOf("irc.")?"irc://":!p.indexOf("ftp.")?"ftp://":"http://")+p}if(s!=C){t.push([u.slice(s,C)]);s=E}t.push([A,p])}t.push([u.substr(s)]);for(v=0;v<t.length;v++){x+=z.callback.apply(window,t[v])}return x||u}}();

exports.pageHasChanged = function(page) {
    if (!page) {
        throw new Error("Page object parameter missing");
    }
    return page.changed === 1;
};

exports.pageIsCode = function(page) {
    if (!page) {
        throw new Error("Page object parameter missing");
    }

    return page.type === "ext/code/code";
};

exports.stripWSFromPath = function(path) {
    var docPath = (path || "").replace(window.cloud9config.davPrefix.replace(/\/+$/, ""), "");
    docPath = docPath.charAt(0) === "/" ? docPath.substr(1) : docPath;
    return docPath;
};

exports.getDocPath = function(page) {
    if (!page && tabEditors) {
        if (!ide.getActivePage)
            ide = require("core/" + "ide");
        page = ide.getActivePage();
    }

    // Can we rely on `name`?
    // What follows is a hacky way to get a path that we can use on
    // the server. I am sure that these workspace string manipulation
    // functions are somewhere...to be fixed.
    return exports.stripWSFromPath(page.name);
};

/**
 * Generate an XML tag that contains properties according to a property-map defined
 * in `attrs`.
 *
 * @param {String} tag Name of the XML tag
 * @param {Object} attrs Map of name-value pairs of XML properties
 * @param {Boolean} noclose If TRUE, the XML tag will be returned UNclosed. Defaults to FALSE.
 * @type {String}
 */
exports.toXmlTag = function (tag, attrs, noclose) {
    return "<" + tag + " " + exports.toXmlAttributes(attrs) + (noclose ? ">" : " />");
};

/**
 * Converts a map of name-value pairs to XML properties.
 *
 * @param {Object} obj Map of name-value pairs of XML properties
 * @type {String}
 */
exports.toXmlAttributes = function(obj) {
    var xml = Object.keys(obj)
        .map(function (k) {
            return k + '="' + apf.escapeXML(obj[k]) + '"';
        })
        .join(" ");

    return xml;
};

});
