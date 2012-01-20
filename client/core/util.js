/**
 * Utilities for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
define(function(require, exports, module) {
    
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

exports.removeInteractive = function (amlNode) {
    if (window.cloud9config.readonly == true)
        return false;
    
    if (amlNode.confirmed == undefined)
        amlNode.confirmed = false;
    
    if (!amlNode.confirmed) {
        var files = amlNode.getSelection();

        function confirm(file) {
            var name = file.getAttribute("name");
            require("core/util").question(
                "Remove file?",
                "You are about to remove the file " + name,
                "Do you want continue? (This change cannot be undone)",
                function () { // Yes
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
    } else
        return true;
};

var SupportedIcons = {
   "application/xhtml+xml":'html',
   "text/css": "css",
   "text/x-scss": "css",
   "text/x-sass": "css",
   "text/html":'html',
    "application/pdf":'page_white_acrobat',
    "image":'image',
    "application/xml":'page_white_code_red',
    "image/svg+xml": "page_white_picture",
    "text/plain": 'page_white_text',
    "application/javascript": 'page_white_code',
    "application/json": 'page_white_code',
    "text/x-script.python": 'page_white_code',
    "text/x-script.ocaml": 'page_white_code',
    "text/x-script.clojure": 'page_white_code',
    "application/x-httpd-php": 'page_white_php',
    "text/x-coldfusion": 'page_white_php',
    "text/x-script.ruby": "page_white_ruby",
    "text/x-script.coffeescript": 'page_white_cup',
    "text/cpp": 'page_white_cplusplus',
    "text/x-c": 'page_white_c',
    "text/x-csharp": 'page_white_csharp',
    "text/text/x-java-source": 'page_white_cup',
    "text/x-markdown": 'page_white_text'
};
        
var contentTypes = {
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
    "sql": "text/x-sql"
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

exports.xmlEntityMap = {
    "quot": "34", "amp": "38", "apos": "39", "lt": "60", "gt": "62",
    "nbsp": "160", "iexcl": "161", "cent": "162", "pound": "163", "curren": "164",
    "yen": "165", "brvbar": "166", "sect": "167", "uml": "168", "copy": "169",
    "ordf": "170", "laquo": "171", "not": "172", "shy": "173", "reg": "174",
    "macr": "175", "deg": "176", "plusmn": "177", "sup2": "178", "sup3": "179",
    "acute": "180", "micro": "181", "para": "182", "middot": "183", "cedil": "184",
    "sup1": "185", "ordm": "186", "raquo": "187", "frac14": "188", "frac12": "189",
    "frac34": "190", "iquest": "191", "agrave": "192", "aacute": "193",
    "acirc": "194", "atilde": "195", "auml": "196", "aring": "197", "aelig": "198",
    "ccedil": "199", "egrave": "200", "eacute": "201", "ecirc": "202",
    "euml": "203", "igrave": "204", "iacute": "205", "icirc": "206", "iuml": "207",
    "eth": "208", "ntilde": "209", "ograve": "210", "oacute": "211", "ocirc": "212",
    "otilde": "213", "ouml": "214", "times": "215", "oslash": "216", "ugrave": "217",
    "uacute": "218", "ucirc": "219", "uuml": "220", "yacute": "221", "thorn": "222",
    "szlig": "223", "agrave": "224", "aacute": "225", "acirc": "226", "atilde": "227",
    "auml": "228", "aring": "229", "aelig": "230", "ccedil": "231", "egrave": "232",
    "eacute": "233", "ecirc": "234", "euml": "235", "igrave": "236", "iacute": "237",
    "icirc": "238", "iuml": "239", "eth": "240", "ntilde": "241", "ograve": "242",
    "oacute": "243", "ocirc": "244", "otilde": "245", "ouml": "246", "divide": "247",
    "oslash": "248", "ugrave": "249", "uacute": "250", "ucirc": "251", "uuml": "252",
    "yacute": "253", "thorn": "254", "yuml": "255", "oelig": "338", "oelig": "339",
    "scaron": "352", "scaron": "353", "yuml": "376", "fnof": "402", "circ": "710",
    "tilde": "732", "alpha": "913", "beta": "914", "gamma": "915", "delta": "916",
    "epsilon": "917", "zeta": "918", "eta": "919", "theta": "920", "iota": "921",
    "kappa": "922", "lambda": "923", "mu": "924", "nu": "925", "xi": "926",
    "omicron": "927", "pi": "928", "rho": "929", "sigma": "931", "tau": "932",
    "upsilon": "933", "phi": "934", "chi": "935", "psi": "936", "omega": "937",
    "alpha": "945", "beta": "946", "gamma": "947", "delta": "948", "epsilon": "949",
    "zeta": "950", "eta": "951", "theta": "952", "iota": "953", "kappa": "954",
    "lambda": "955", "mu": "956", "nu": "957", "xi": "958", "omicron": "959",
    "pi": "960", "rho": "961", "sigmaf": "962", "sigma": "963", "tau": "964",
    "upsilon": "965", "phi": "966", "chi": "967", "psi": "968", "omega": "969",
    "thetasym": "977", "upsih": "978", "piv": "982", "ensp": "8194", "emsp": "8195",
    "thinsp": "8201", "zwnj": "8204", "zwj": "8205", "lrm": "8206", "rlm": "8207",
    "ndash": "8211", "mdash": "8212", "lsquo": "8216", "rsquo": "8217",
    "sbquo": "8218", "ldquo": "8220", "rdquo": "8221", "bdquo": "8222",
    "dagger": "8224", "dagger": "8225", "bull": "8226", "hellip": "8230",
    "permil": "8240", "prime": "8242", "prime": "8243", "lsaquo": "8249",
    "rsaquo": "8250", "oline": "8254", "frasl": "8260", "euro": "8364",
    "image": "8465", "weierp": "8472", "real": "8476", "trade": "8482",
    "alefsym": "8501", "larr": "8592", "uarr": "8593", "rarr": "8594",
    "darr": "8595", "harr": "8596", "crarr": "8629", "larr": "8656", "uarr": "8657",
    "rarr": "8658", "darr": "8659", "harr": "8660", "forall": "8704", "part": "8706",
    "exist": "8707", "empty": "8709", "nabla": "8711", "isin": "8712",
    "notin": "8713", "ni": "8715", "prod": "8719", "sum": "8721", "minus": "8722",
    "lowast": "8727", "radic": "8730", "prop": "8733", "infin": "8734",
    "ang": "8736", "and": "8743", "or": "8744", "cap": "8745", "cup": "8746",
    "int": "8747", "there4": "8756", "sim": "8764", "cong": "8773", "asymp": "8776",
    "ne": "8800", "equiv": "8801", "le": "8804", "ge": "8805", "sub": "8834",
    "sup": "8835", "nsub": "8836", "sube": "8838", "supe": "8839", "oplus": "8853",
    "otimes": "8855", "perp": "8869", "sdot": "8901", "lceil": "8968",
    "rceil": "8969", "lfloor": "8970", "rfloor": "8971", "lang": "9001",
    "rang": "9002", "loz": "9674", "spades": "9824", "clubs": "9827",
    "hearts": "9829", "diams": "9830"
};

/**
 * Escape an xml string making it ascii compatible.
 * @param  {String}  str      the xml string to escape.
 * @param  {Boolean} noQuotes do not escape quotes.
 * @return {String} the escaped string.
 */
exports.escapeXml = function(str, noQuotes) {
    str = (String(str) || "")
        .replace(/&/g, "&#38;")
        .replace(/</g, "&#60;")
        .replace(/>/g, "&#62;");
    if (!noQuotes) {
        str = str.replace(/"/g, "&#34;")
                 .replace(/'/g, "&#39;");
    }
    return str.replace(/&([a-z]+);/gi, function(a, m) {
        if (exports.xmlEntityMap[(m = m.toLowerCase())])
            return "&#" + exports.xmlEntityMap[m] + ";";
        return a;
    });
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

});