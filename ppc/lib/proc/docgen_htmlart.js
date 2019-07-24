apf.process.handler.html = function(oParser){
    apf.makeClass(this);
    this.inherit(apf.ProjectBase);
    
    this.generate = function(data, str, level){
        str.push(getHeader(level, data.name));
        for(var prop in data){
            if(typeof data[prop] != "object") continue;
            for(var item in data[prop]){
                if(typeof data[prop][item] != "object") continue;
                if(!data[prop].found){
                    str.push(getHeader(level+1, prop, prop));
                    data[prop].found = true;
                }
                this.parseItem(data[prop][item], prop, str, level+2);
            }
        }
    }
    
    function getHeader(level, caption, type){
        var tagName = level > 6 ? "div" : "h" + level;
        return "<" + tagName + " class='" + type + "'>" + caption + "</" + tagName + ">";
    }
    
    this.parseItem = function(obj, type, str, level){
        if(type == "functions" || type == "methods" || type == "actions"){
            if(obj.name.substr(0,2) == "__") return;
            for(var args=[],i=0;i<obj.args.length;i++) args.push(obj.args[i].trim());
            return str.push(getHeader(level, obj.name + " (<i>" + args.join(", ") + "</i>)", type));
        }
        else if(type == "properties" || type == "inheritance" || type == "events" || type == "jmlprop"){
            if(obj.name.substr(0,2) == "__") return;
            return str.push(getHeader(level, obj.name, type));
        }
        else if(type == "objects" || type == "classes" || type == "controls" || type == "baseclasses" || type == "teleport"){
            return this.generate(obj, str, level);
        }
        else if(type == "skinxml"){
            var name,attrs = [];
            for(var prop in obj){name=obj[prop].tagName;if(prop == "") continue;attrs.push(prop)};
            return str.push(getHeader(level, "&lt;" + name + " " + attrs.join("=\"\" ") + (attrs.length ? "=\"\"" : "") + "/&gt;", type));
        }
        else if(type == "bindings"){
            return str.push(getHeader(level, "&lt;" + obj.name + " select='' rpc='' arguments='' /&gt;", type));
        }
    }
    
    var fOutput;
    this.$loadPml = function(x){
        apf.console.info("Printing html documentation art...");

        var str = [];
        this.generate(oParser.data.global, str, 1);

        fOutput = fs.get(this.output);
        apf.console.info("Saved html art at " + fOutput.path);
        fOutput.data = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:j="javeline.dtd" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><head><style type="text/css">@import url(docs.css);</style></head><body>' 
            + str.join("\n") + '</body></html>';
    }
}
