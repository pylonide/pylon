var Path = require("path"),
    Fs   = require("fs");

/**
 * Combines multiple files into one. Optionally it can process ifdefs while
 * combining the files.
 */
apf.process.handler.combine = function(x){
    var defines,
        s      = apf.settings,
        group  = s.parseAttribute(x.getAttribute("group")),
        output = Path.normalize(s.parseAttribute(x.getAttribute("out"))),
        strip  = s.parseAttribute(x.getAttribute("strip")),
        files  = apf.files.get(group),
        out    = [],
        type   = s.parseAttribute(x.getAttribute("type"));

    if (type == "xml") {
        var prefix = s.parseAttribute(x.getAttribute("prefix")),
            xmlns  = s.parseAttribute(x.getAttribute("xmlns")),
            root   = s.parseAttribute(x.getAttribute("root")) || "xml",
            parse  = apf.isTrue(s.parseAttribute(x.getAttribute("parse")));
        
        out.push("<?xml version='1.0'?>\n<" 
            + (prefix ? prefix + ":" : "") + root 
            + " " + (xmlns ? "xmlns" : "")
            + (prefix ? ":" + prefix : "") + "=\"" + xmlns + "\">\n");
    }
    else {
        defines = apf.isTrue(s.parseAttribute(x.getAttribute("defines")));
    }
    var fhead  = apf.isTrue(s.parseAttribute(x.getAttribute("filehead")));
    
    files.each(function(file){
        
        if (!/\/doc\//.test(file.path)) { // ignore doc folder
            apf.console.info("Adding file : " + file.path + " size: " + file.size);
            
            if (fhead) {
                if (type == "xml") {
                    out.push("<!-- PACKFILE:" + file.path 
                        + " SIZE:" + file.size + " -->");
                }
                else {
                    out.push("\n/*FILEHEAD(" + file.path + ")SIZE("
                        + file.size + ")TIME(" + new Date(file.mtime).toGMTString() + ")*/\n");
                }
            }
            
            if (type == "xml") {
                if (prefix && xmlns) {
                    file.data = file.data.replace(new RegExp("(<" + prefix + ":[^>]*?)xmlns:"
                        + prefix + "=\"[^\"]*?\"([^>]*?>)", "g"), "$1$2");
                }
                //@todo maybe add define support here (see mwa subscribe)
                if (parse) {
                    var x = apf.getXml(file.data.replace(/<\?xml.*$/m,"")); //errors
                    if (x)
                        out.push(x.xml);
                }
                else {
                    out.push(file.data.replace(/<\?xml.*$/m,""));
                }
            }
            else {
                out.push(defines
                    ? apf.defines.parse(file.data, file.name)
                    : file.data);
            }
        }
    });
    
    if (type == "xml")
        out.push("</" + (prefix ? prefix + ":" : "") + root + ">");
    
    var result = out.join("\n");

    if (strip) {
        result = result
            .replace(/\/\*(?:[\r\n]|.)+?\*\//gm, "")
            /*.replace(/('(?:\\\\+|\\'|[^'])*')|("(?:\\\\+|\\"|[^"])*")|(\/(?:(?:\\\\)+|\\\/|[^\/\n\r])+\/(?!\/))|(\/\/.*$)/gm,
               function(m, str1, str2, re, co){
                //out.write((str1 || str2 || re || co) + "\n" + "===========");

                if (str1 || str2) return str1 || str2;
                if (re) return re;
                if (co) return "";
            })*/
            .replace(/((\r?\n)+( +)?)+/g, "\n");
    }

    if (type != "xml" && s.version) {
        result = result.replace(/apf = \{/, "apf = {\nVERSION:'"
            + s.version.replace(/(\d+\.\d+)\.\d*\./, "$1").toLowerCase() + "',");
    }

    Fs.writeFile(output, result, "utf8");

    apf.console.info("Combine done. Written to " + output);
};
