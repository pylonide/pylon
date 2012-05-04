var Path = require("path"),
    Fs   = require("fs");

/**
 * Reads defines and has utility function to deal with ifdefs
 */
apf.definesCls = function() {
    this.$init(true);
};
(function(){
    this.check = function(expr){
        with (defines) {
            try{
                return eval(expr);
            }
            catch(e){
                apf.console.error("Error parsing ifdef: " + expr + "\n" + e.message, "defines");
            }
        }
    };
    
    this.get = function(name){
        return defines[name];
    };
    
    this.set = function(name, value){
        defines[name] = value;
    };

    this.checkRequired = function() {
        var i, j, k, req, 
            errors    = [],
            warnings  = [],
            msg_error = "%s\trequires %s\tto be defined. Please correct this error in your Project file.",
            msg_warn  = "%s\trequires %s\tto be defined, but may be ignored if __INC_ALL is enabled.",
            bIncAll   = (defines["__INC_ALL"] === 1);
   
       recurSel(defines); 

       function recurSel (defines) {
           var restart = true;
           while (restart) {
                restart = false;
                for(var i in defines){ 
                    // don't check defines that aren't going to be included anyway:
                    if (!defines[i]) continue;

                    req = requires[i];
                    // check if the define has any requirements at all
                    if (!req || !req.length)
                        continue;
                    // apparently we do, so check if all the requirements have been
                    // defined AND enabled.
                    for (j = 0, k = req.length; j < k; j++) {
                        //Define isn't set yet, we'll set it for the user.
                        //orig: this makes no sense...
                        if (!defines[req[j]] && defines[req[j]] != 1) {
                            defines[req[j]] = 1;
                            recurSel(defines);
                        }

                    }
                }
            }          
        }

        // Output the warnings to stdout
        for (i = 0, j = warnings.length; i < j; i++)
            apf.console.warn(warnings[i], "defines");
        // Throw an error to stdout that some of the requirements are not fulfilled.
        if (errors.length) {
            apf.console.error(errors.join("\n"), "defines", apf.vardump(defines, null, false));
            throw new Error;
        }

        return true;
    };
    
    this.parse = function(data, path){
        var line, m, j, l,
            output        = [],
            blockdefdata  = [],
            nowrite       = -1,
            level         = 0,
            blockdef      = "",
            lines         = data.split("\n"),
            _self = this;
        for (j = 0, l = lines.length; j < l; j++) {
            line = lines[j].replace(/\/\*\s*\#ifdef\s*(.*?)\s*\*\/(.*?)\/\*\s*\#endif\s*\*\//g, function(m, test, contents){
                return _self.check(test) ? contents : "";
            });
            m = line.match(/^(.*)\s*\/(?:\/|\*)\s*\#(\w+)\s*(.*)/)
                || line.match(/^(.*)\s*(?:\/\/)?\s*#(\w+)\s*\*\//);
            if (m) line = m[1];
                
            if (nowrite == -1) {
                //data = this.check(line);
                
                if (blockdef)
                    blockdefdata.push(line);
                else
                    output.push(line);
            }

            if (!m)
                continue;

            switch (m[2]) {
                case "begindef": 
                    if (blockdef){
                        apf.console.error(path + "(" + (j + 1)
                            + ") - Fatal: Cannot nest #begindef", "defines");
                        throw new Error();
                    }
                    
                    blockdefdata = [];
                    blockdef     = m[3].trim();
                    break;
                case "enddef":
                    if (!blockdef){
                        apf.console.error(path + "(" + (j + 1)
                            + ") - Fatal: #enddef without #begindef", "defines");
                        return;
                    }
                    
                    // lets store our blockdef
                    var blockdefd = blockdefdata.join("\n");
                    
                    if (defines[blockdef] !== blockdefd) {
                        apf.console.warn(path + "(" + (j + 1)
                            + ") - WARNING differently defining Block:" 
                            + blockdef + "", "defines");
                    }
                    else {
                        apf.console.info(path + "(" + (j + 1)
                            + ") - Defining Block:#" + blockdef + "#", "definess");
                    }
                    
                    defines[blockdef] = blockdefd;
                    blockdef          = "";
                    break;
                case "ifdef":  
                    level++;
                    if (!this.check(m[3]) && nowrite == -1){
                        nowrite = level; 
                        apf.console.warn(path + "(" + (j + 1)
                            + ") - Ignoring code by ifdef " + m[3] + "", "defines");
                    }
                    break;
                case "ifndef": 
                    level++; //else if is similar case to ifndef
                case "elseif":
                    if ( this.check(m[3]) && nowrite == -1){
                        nowrite = level;
                        apf.console.warn(path + "(" + (j + 1)
                            + ") - Ignoring code by ifndef " + m[3] + "", "defines");
                    }
                    break;
                case "endif":    
                    if (level == nowrite)
                        nowrite = -1;
                    level--; //inside or outside??
                
                    if (level < 0){
                        apf.console.error(path + "(" + (j + 1)
                            + ") - Fatal: #endif missing #ifdef/ifndef " + level,
                            "defines");
                        return;
                    }
                break;
                case "define":
                    if (nowrite == -1 ){
                        var def = m[3].split(" ");
                        
                        if (!defines[def[0]]){
                            apf.console.info(path + "(" + (j + 1)
                                + ") - Defining:" + def[0] + " as:" 
                                + def[1] + "", "defines");

                            defines[def[0]] = def[1];
                        }
                    }
                    break;
                case "undef":
                    if (nowrite == -1 )
                    {
                        apf.console.info(path + "(" + (j + 1)
                            + ") - Undefining:" + m[3] + "", "defines");

                        delete defines[trim(m[3])];
                    }
                    break;
                case "else": 
                    if (nowrite == -1)
                        nowrite = level;
                    else if (level == nowrite)
                        nowrite = -1; 
                break;
            }
        }
        
        if (blockdef){
            apf.console.error(path + "(" + (j + 1)
                + ") - Fatal: #begindef without #enddef", "defines");
            return;
        }
        
        if (level > 0){
            apf.console.error(path + "(" + (j + 1)
                + ") - Fatal: #ifdef/#ifndef without #endif " + level + "", "defines");
            return;
        }
        
        return output.join("\n");
    };

    var defines, requires;
    this.$loadPml = function(x){
        var n, i, l, v, node, name, fpath = "unknown";

        defines  = {};
        requires = {};

        if (x.getAttribute("defaults")) {
            fpath = Path.normalize(__dirname + "/../projects/" + apf.settings.parseAttribute(x.getAttribute("defaults")));
            try {
                var file = Fs.readFileSync(fpath, "utf8");
                file.path = fpath;
                file.name = Path.basename(fpath);
            }
            catch (ex) {
                apf.console.error("File not found " + fpath);
                throw new Error();
            }

            var xml = apf.getXml(file);

            //n = xml.selectNodes("//p:define");//childNodes;
            n = xml.getElementsByTagName("define");
            for (i = 0, l = n.length; i < l; i++) {
               // apf.console.log('defines   ' + n[i].getAttribute("name"));
                if (n[i].nodeType != 1)
                    continue;

                node = n[i];
                v    = apf.settings.parseAttribute(node.getAttribute("value"));
                name = node.getAttribute("name");
                defines[name] = (parseFloat(v) == v ? parseFloat(v) : v) || 0;

                // check for requirements
                requires[name] = [];
                if (node.getAttribute("requires"))
                    requires[name] = node.getAttribute("requires").splitSafe("\\|");
                while (node.parentNode && (node.parentNode.tagName == "define"
                  || node.parentNode.tagName == "group")) {
                    if (node.parentNode.tagName != "group")
                        requires[name].push(node.parentNode.getAttribute("name"));
                    if (node.parentNode.getAttribute("requires")) {
                        requires[name] = requires[name].concat(
                            node.parentNode.getAttribute("requires").splitSafe("\\|")
                        );
                    }
                    node = node.parentNode;
                }
            }
        }

        n = x.childNodes;
        for (i = 0, l = n.length; i < l; i++) {
            if (n[i].nodeType != 1)
                continue;
            v = apf.settings.parseAttribute(n[i].getAttribute("value"));
            defines[n[i].getAttribute("name")] = (parseFloat(v) == v 
                ? parseFloat(v) 
                : v) || 0;
        }

        apf.console.info("Defines loaded from " + fpath, "defines");

        this.checkRequired();
    };
}).call(apf.definesCls.prototype = new apf.ProjectBase());
apf.defines = new apf.definesCls();
