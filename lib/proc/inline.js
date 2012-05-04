var Path = require("path"),
    Fs   = require("fs");

/**
 * Parse an HTML file and inline all the AML specific stuff.
 */
apf.process.handler.inline = function(x){
    var s      = apf.settings,
        file   = Path.normalize(s.parseAttribute(x.getAttribute("in"))),
        output = Path.normalize(s.parseAttribute(x.getAttribute("out"))),
        type   = s.parseAttribute(x.getAttribute("type")),
        data   = Fs.readFileSync(file, "utf8").toString(),
        path   = Path.dirname(file);

    //now parse for <link> elements first
    data = data.replace(/<link[^>]*?type=[\"\']text\/css[\"\'][^>]*?href=[\"\'](.*?)[\'\"][^>]*?\/>/g, function(m, href) {
        if (href.indexOf("http://") > -1)
            return m;
        try {
            var s = Fs.readFileSync(path + "/" + href, "utf8").toString();
        }
        catch(ex) {
            apf.console.error("Stylesheet not found: " + path + "/" + href, "inline");
            return m;
        }
        return '<style type="text/css">' + s.replace(/(skinimg|images)\//g, "style/$1/") + '</style>';
    });

    global.TESTING = false;

    //parse for <a:inclide> elements
    function inlineInclude(str, path) {
        str = str.replace(/<a:include[^>]*?src=\"(.*?)\"[^>]*?\/>/g, function(m, src) {
            src = s.parseAttribute(src);
            if (src.indexOf("http://") > -1)
                return m; //@todo fetch over HTTP
            try {
                var file = path + "/" + src,
                    t    = inlineInclude(Fs.readFileSync(file, "utf8").toString(), path).replace(/<\/?a:application[^>]*?>/g, "");
            }
            catch(ex) {
                apf.console.error("Include file not found: " + path + "/" + src, "inline");
                return m;
            }
            return t;
        });
        return str;
    }

    data = inlineInclude(data, path);

    Fs.writeFileSync(output, data, "utf8");
};
