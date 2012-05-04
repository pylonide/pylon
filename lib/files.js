var Path = require("path"),
    Fs   = require("fs");

/**
 * Reads the files from xml or loader.js and makes them accessible to the 
 * processor.
 */
apf.filesCls = function() {
    this.$init(true);

    this.groups = {};
};
(function(){
    this.get = function(group){
        if (!this.groups[group]) {
            apf.console.error("Unknown group: " + group, "files", apf.vardump(this.groups));
            throw new Error();
        }

        return this.groups[group].slice(0);
    };
    
    this.$loadPml = function(x){
        var value,
            _self = this,
            s     = apf.settings;
       
        //Read from loader.js
        if (value = s.parseAttribute(x.getAttribute("parse"))) {
            var data = Fs.readFileSync(value, "utf8").toString();
            //Parse loader.js
        }
        
        //Read from children
        else {
            (function fileLoop(nodes, dir, group, mask){
                var fpath, recur, node, file, i, l, filter = {}, fgroup, fmask;

                for (i = 0, l = nodes.length; i < l; i++) {
                    node = nodes[i];
                    if (node.nodeType != 1)
                        continue;                   

                    //fpath = (dir ? dir.path : "") + (!fpath || fpath.length > 0 ? "/" : "")
                    //    + s.parseAttribute(node.getAttribute("path"));
                    fpath = (dir ? dir.path+"/" : "") + s.parseAttribute(node.getAttribute("path"));
                    //fpath = Path.normalize(fpath.replace(/\/\//g, "/"));
                    //console.log(s.parseAttribute(node.getAttribute("path")));
                    try {
                        file = Fs.statSync(fpath, "utf8");
                        file.path = fpath;
                        file.name = Path.basename(fpath);
                        file.data = !file.isDirectory() ? Fs.readFileSync(fpath).toString() : "";
                    }
                    catch (ex) {
                        apf.console.error("File not found: " + fpath);
                        throw ex;
                    }
                    
                    fgroup = s.parseAttribute(node.getAttribute("group")) || group;
                    
                    fmask = s.parseAttribute(node.getAttribute("mask")) || mask;
                    
                    filter[file.path] = true;

                    if (file.isDirectory()) {//directory
                        recur = s.parseAttribute(node.getAttribute("recursive"));
                        if (!apf.isFalse(recur))
                            fileLoop(node.childNodes, file, fgroup, fmask);
                    }
                    else {
                        if (fmask && !file.name.match(new RegExp("^" + fmask
                          .replace(/\./, "\\.")
                          .replace(/\*/, ".*") + "$"))) {
                            continue; //Excluding file
                        }
                        
                        if (!fgroup) {
                            apf.console.error("No group was specified for: "
                                + file.path, "files");
                            throw new Error();
                        }
                        
                        fgroup.split("|").each(function(g){
                            (_self.groups[g] || (_self.groups[g] = [])).push(file);
                        });
                    }
                }

                if (dir) {
                    var files = Fs.readdirSync(dir.path);
                    var reMask = mask && new RegExp("^" + mask
                              .replace(/\./, "\\.")
                              .replace(/\*/, ".*") + "$");
                    
                    if (!group) {
                        apf.console.error("No group was specified for: "
                            + dir.path, "files");
                        throw new Error();
                    }
                    
                    var sgroup = group.split("|");
                    
                    var later = [];
                    for (i = 0, l = files.length; i < l; i++) {
                        try {
                            files[i] = dir.path + "/" + files[i];
                            file = Fs.statSync(files[i]);
                            file.path = files[i];
                            file.name = Path.basename(files[i]);
                            file.data = !file.isDirectory() ? Fs.readFileSync(files[i]).toString() : "";
                        }
                        catch(ex) {
                            continue;
                        }
                        if (filter[file.path] || file.name.charAt(0) == ".")
                            continue;
                        
                        if (file.isDirectory())
                            later.push(file);
                        else {
                            if (mask && !file.name.match(reMask))
                                continue; //Excluding file
                            
                            sgroup.each(function(g){
                                (_self.groups[g] || (_self.groups[g] = [])).push(file);
                            });
                        }
                    }

                    for (i = 0; i < later.length; i++) {
                        file = later[i];
                        if (file.isDirectory())//directory
                            fileLoop([], file, group, mask);
                    }
                }
            })(x.childNodes);

            apf.console.info("Getting filelist done.", "files");
        }
    };
}).call(apf.filesCls.prototype = new apf.ProjectBase());
apf.files = new apf.filesCls();
