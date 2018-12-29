apf.process.handler.refguide = function(oParser){
    apf.makeClass(this);
    this.inherit(apf.ProjectBase);

    var parser = this;
    var files = [];
    var state = {};
    var done = {};
    
    var bcused = {};

    function Doc(filename, type){
        this.output = apf.xmldb.getXml("<" + type + " />");
        files.push(this);
        /*if (!state[type])
            state[type] = [];
        state[type].push(this);*/
        var doc = this.output.ownerDocument;
        
        if(!done[type]) done[type] = {};
        if (done[type][this.data.name]) 
            this.output = done[type][this.data.name].output;

        done[type][this.data.name] = this;

        filename = filename.toLowerCase();
        this.filename = filename;

        if (this.data.metadata.deprecated) this.output.setAttribute("deprecated", "true");
        if (this.data.metadata.experimental) this.output.setAttribute("experimental", "true");
        
        this.alias = [];
        this.parseJML = function(data){
            //Handle define, allowchild here
            if (!data)
                data = this.data;

            if (data.metadata.define && data.metadata.define[0]) {
                var start = 0;
                if (data.metadata.isConstructor || data.metadata.define[0].isConstructor || data.metadata.define[0].name == data.name) {
                    start = 1;
                    this.alias = this.alias.concat(data.metadata.define[0].name.splitSafe(","));
                    if (data.metadata.define[0].description)
                        parseDescription(this, data.metadata.define[0].description[0], this.output);
                    if (data.metadata.define[0].allowchild)
                        this.createList("child", data.metadata.define[0].allowchild);
                    if (data.metadata.define[0].attribute)
                        this.createList("attribute", data.metadata.define[0].attribute);
                    if (data.metadata.define[0].event)
                        this.createList("event", data.metadata.define[0].event);
                    if (data.metadata.define[0].inherits)
                        this.createList("inherit", data.metadata.define[0].inherits);
                }
                //else o3.out(data.name + "\n");

                var items = data.metadata.define;
                var type = "element";
                for (var i = start; i < items.length; i++) {
                    /*if (items[i].binding == "") {
                        //Create binding
                        var node = this.handler["binding"].call(this, items[i].name + " " 
                            + (items[i].description && items[i].description[0]), this.output, "binding");
                        this.createList("attribute", items[i].attribute, node);
                        var node = this.create("used", this.data.name, node);
                        node.setAttribute("filename", this.filename);
                        continue;
                    }*/
                    
                    var name = items[i].name;
                    if(!done[type] || !done[type][name]) 
                        addState("Elements", new Component({name:name,metadata:items[i]}));
                    else {
                        if (items[i].description)
                            parseDescription(this, items[i].description[0], done[type][name].output);

                        done[type][name].createList("attribute", items[i].attribute);
                    }
                }
            }
        }
        
        this.create = function(type, name, pNode, desc){
            if (name && !name.match) apf.console.warn(arguments.callee.caller.toString());
            if(name && name.match(/^__/)) return;
            
            if(!pNode) pNode = this.output;
            var p = pNode.appendChild(doc.createElement(type));
            if(name) p.setAttribute("name", name);
            if(desc) p.appendChild(doc.createTextNode(desc));
            return p;
        }
        
        this.createList = function(type, list, pNode, defPrivate, notMoved, fname, subname){
            if(!list) return;
            if(!pNode) pNode = this.output;

            var node;
            if(list.length && typeof list.length == "number"){
                for(var i=0;i<list.length;i++){
                    if (notMoved && list[i].moved)
                        continue;

                    //if(type == "inherit" && !oParser.data.global.baseclasses[list[i].replace(/^apf\./, "")])
                        //continue;

                    if (list[i].metadata && list[i].metadata["private"] || list[i]["private"] 
                      || defPrivate && !list[i].metadata.description) {
                        //if (list[i].metadata && list[i].metadata.define)
                            //this.parseJML(list[i]);
                        continue;
                    }

                    if (!this.handler[type])
                        apf.console.error("Could not find handler for " + type);

                    node = this.handler[type].call(this, list[i], pNode, type);
                    if (node) {
                        //if (type != "property" || node.selectSingleNode("description")) {
                            addState(type.uCaseFirst(), {
                                filename : ((fname || this.filename) + "." + type + "." + node.getAttribute("name")).toLowerCase(),
                                data : {
                                    name : node.getAttribute("name")
                                }
                            });
                        //}

                        if (list[i].metadata) {
                            if (list[i].metadata.deprecated) node.setAttribute("deprecated", "true");
                            if (list[i].metadata.experimental) node.setAttribute("experimental", "true");
                        }
                        if (type != "used") {
                            var node = this.create("used", subname || this.data.name, node);
                            node.setAttribute("filename", fname || this.filename);
                        }
                    }
                }
            }
            else{
                var item;
                for(var name in list){
                    if(name.match(/^__/) || notMoved && list[name].moved) 
                        continue;
                    item = list[name];

                   if (item.metadata && item.metadata["private"] || item.private
                     || defPrivate && !item.metadata.description) {
                        //if (item.metadata && item.metadata.define)
                            //this.parseJML(item);
                        continue;
                   }
                        
                    //if(this.handler[type] && (!done[type] || !done[type][name])) 
                    if (!this.handler[type])
                        apf.console.error("Could not find handler for " + type);

                    node = this.handler[type].call(this, item, pNode, type);
                    if (node) {
                        addState(type.uCaseFirst(), {
                            filename : ((fname || this.filename) + "." + type + "." + item.name).toLowerCase(),
                            data : {
                                name : item.name
                            }
                        });

                        if (item.metadata) {
                            if (item.metadata.deprecated) node.setAttribute("deprecated", "true");
                            if (item.metadata.experimental) node.setAttribute("experimental", "true");
                        }
                        if (type != "used") {
                            var node = this.create("used", subname || this.data.name, node);
                            node.setAttribute("filename", fname || this.filename);
                        }
                    }
                    
                }
            }
        }
        
        this.handler = {
            "alias" : function(info, pNode, type){
            },

            "see" : function(info, pNode, type){
                 var node = this.create(type, null, pNode);
                node.setAttribute("filename", info);
                return node;

            },

            "used" : function(info, pNode, type){
                var node = this.create(type, info[0], pNode);
                node.setAttribute("filename", info[1]);
                return node;
            },

            "object" : function(info, pNode, type) {
                if (!info.metadata)
                    info.metadata = {};
                
                data = info.metadata.description && info.metadata.description[0] 
                  || "{Object} " + info.name;
                var m = data.match(/^\s*(?:\{(.*?)\})?(?:[ \s\n\r]+([\S\s]*))?$/);
                if (!m) {
                    if (!info.name) {
                        //apf.console.error("Found object without a name", info);
                        return;
                    }

                    m = [null, (data.type || "Object"), info.metadata.description && info.metadata.description[0] || ""];
                    //return;
                }
    
                var name = info.name;
                var node = this.create(type, name, pNode);
                node.setAttribute("type", m[1] || "Object");
                 
                parseDescription(this, m[2], node);

                this.createList("method", info.methods, node, info.metadata.default_private, null, filename + ".property." + name.toLowerCase());
                this.createList("property", info.properties, node, true, null, filename + ".property." + name.toLowerCase());
                if (data.metadata)
                    this.createList("see", data.metadata.see, node);

                this.parseJML(info);
                
                return node;
            },
            
            "property" : function(info, pNode, type) {
                if (!info.metadata)
                    info.metadata = {};
                data = info.metadata.description && info.metadata.description[0] 
                  || "{Unkown} " + info.name;
                var m = data.match(/^\s*\{(.*?)\}[ \s]+(\!)?([\[\]\$\w-]+)(?:[ \s\n\r]+([\S\s]*))?$/);
                if (!m) {
                    apf.console.warn("Invalid property format: " + data);
                    return;
                }
    
                var name = m[3].replace(/[\[\]]/g, "");
                if (name[0] == "o" && name[1].toUpperCase() == name[1] || !name || name[0] == "$")
                    return; //oExt oInt and such exclusion

                var node = this.create(type, name, pNode);
                node.setAttribute("type", m[1]);
                if (m[2] == "!")
                    node.setAttribute("readonly", "true");
                 
                parseDescription(this, m[4], node);

                if (data.metadata)
                    this.createList("see", data.metadata.see, node);

                return node;
            },

            "attribute" : function(data, pNode, type) {
                var m = data.match(/^\s*\{(.*?)\}[ \s]+(\!)?([\[\]\w-]+)(?:[ \s\n\r]+([\S\s]*))?$/);
                if (!m) {
                    apf.console.warn("Invalid attribute format: " + data);
                    return;
                }
    
                var name = m[3].replace(/[\[\]]/g, "");
                if (!name.trim()) return;

                var node = this.create(type, name, pNode);
                node.setAttribute("type", m[1]);
                if (name.length == m[3].length)
                    node.setAttribute("required", "true");
                if (m[2] == "!")
                    node.setAttribute("readonly", "true");
                    
                parseDescription(this, m[4], node);

                if (data.metadata)
                    this.createList("see", data.metadata.see, node);

                return node;
            },
    
            "action" : function(data, pNode, type) {
                var node = this.create(type, data.name, pNode);
            
                if (data.metadata.description)
                    parseDescription(this, data.metadata.description[0], node);
                
                this.createList("attribute", data.metadata.attribute, node, null, null, filename + ".action." + data.name.toLowerCase(), data.name);

                if (data.metadata)
                    this.createList("see", data.metadata.see, node);

                return node;
            },
            
            "binding" : function(data, pNode, type) {
                /*var m = data.match(/^\s*([\w-]+)(?:[ \s\n\r]+([\S\s]*))?$/);
                if (!m) {
                    apf.console.warn("Invalid binding format: " + data + "\n");
                    return;
                }
                
                var name = m[1];
                var node = this.create(type, name, pNode);
                    
                parseDescription(this, m[2], node);

                var names = data.splitSafe(",");
                for (var i = 0; i < names.length; i++) {
                    node = this.create(type, names[i], pNode);
                }*/

                var node = this.create(type, data.name, pNode);

                if (data.description)
                    parseDescription(this, data.description[0], node);
                
                this.createList("attribute", data.attribute, node, null, null, filename + ".binding." + data.name.toLowerCase(), data.name);

                if (data.metadata)
                    this.createList("see", data.metadata.see, node);

                return node;
            },
            
            "event" : function(data, pNode, type) {
                var m = data.match(/^\s*([\w-]+)(?:[ \s\n\r]+([\S\s]*))?$/);
                if (!m) {
                    apf.console.warn("Invalid event format: " + data + "\n");
                    return;
                }
    
                var name = m[1];
                var node = this.create(type, name, pNode);
                    
                parseDescription(this, m[2], node);

                if (data.metadata)
                    this.createList("see", data.metadata.see, node);

                return node;
            },

            "child" : function(data, pNode, type) {
                var m = data.splitSafe(",");
                for (var name, node, i = 0; i < m.length; i++) {
                    name = m[i].replace(/[\{\}]/g, "")
                    node = this.create(type, name, pNode);
                    if (m[i].length != name.length)
                        node.setAttribute("set", "true");
                }
            },
            
            "method" : function(data, pNode, type) {
                if (!data.metadata) data.metadata = {};
                if (!data.name) data.name = "_";
                var node = this.create(type, data.name, pNode);
                
                if (data.metadata.description)
                    parseDescription(this, data.metadata.description[0], node);
                
                //Parameters
                var m, p, i, name, info, type, usage, desc, params = data.metadata.param || [];
                for (i = 0; i < params.length; i++){
                    m = params[i].match(/^\s*\{(.*?)\}[ \s]+(\!)?([\[\]\w-]+)(?:[ \s\n\r]+([\S\s]*))?$/);
                    if (!m) {
                        apf.console.warn("Invalid parameter format" + params[i] + "\n");
                        return;
                    }
                    
                    name = m[3].replace(/[\[\]]/g, "");
                    p = this.create("param", name, node);
                    p.setAttribute("type", m[1]);
                    if (name.length == m[3].length)
                        p.setAttribute("required", "true");
                    
                    if (m[4])
                        parseDescription(this, m[4], p);
                }
                
                //Return
                var ret = data.metadata.returns || data.metadata["return"];
                if (ret){
                    var info = ret[0].trim().split(/ /);
                    var type = info.shift().replace(/[{}]/g, "").trim();
                    var desc = info.join(" ");
                    
                    var rnode = this.create("return")
                    rnode.setAttribute("type", type);
                    parseDescription(this, desc, rnode);
                }

                if (data.metadata)
                    this.createList("see", data.metadata.see, node);

                return node;
            },
            
            "skinitem" : function(data, pNode, type) {
                if (!data.metadata) data.metadata = {};
                if (!data.name || typeof data.name != "string") {
                    for (name in data) {
                        data.name = data[name].tagName;
                        break;
                    }
                    if (!data.name) return;
                }

                var node = this.create(type, data.name, pNode);
        
                if (data.metadata.description)
                    parseDescription(this, data.metadata.description[0], node);
                
                for(var name in data){
                    if (name == "metadata" || name == "name" || !name) continue;
                    this.create("attribute", name, node, 
                        data[name].metadata && data[name].metadata.description 
                        && data[name].metadata.description[0] || "");
                }

                return node;
            },

            "inherit" : function(data, pNode, type) {
                var name = data.trim().replace(/^apf\./, "");
                this.create("inherit", name, pNode);
                if (!bcused[name]) bcused[name] = [];
                bcused[name].push([this.data.name, this.filename]);
            }
        }
        
        this.save = function(){
            //o3.out(parser.output + filename + ".xml | " + this.alias.join(",") + "\n");
            //o3.out(this.output.xml + "\n");

            //.cloneNode(true)
            var file = o3.fs.get(parser.output + "xml/" + filename + ".xml");
            file.data = this.output.xml;//.replace(/[\t\r\n]/g, "");//apf.formatXML();
            o3.out(".");

            for (var i = 0; i < this.alias.length; i++) {
                if (!this.alias[i] || this.alias[i].trim() == this.data.name.trim())
                    continue;

                file = o3.fs.get(parser.output + "xml/" + filename.replace(/\.([\w-]+)$/, "." + this.alias[i] + ".xml"));
                addState("Elements", {
                    name : this.alias[i],
                    data : {
                        name : this.alias[i]
                    },
                    filename : "element." + this.alias[i], //filename,
                    output : this.output
                });
                if (!file.exists)
                    file.data = "<?xml version=\"1.0\" ?>\n<alias file='" + filename + ".xml' />";
            }
        }

        this.saveHtml = function(){
            var xml = this.output;

            self.loadFile = function(filename){
                if (filename == "baseclass.http")
                    filename = "teleport.http";
            
                if (!self.cache)
                    self.cache = {};

                if (self.cache[filename]) 
                    return self.cache[filename];

                var file = o3.fs.get(parser.output + "xml/" + filename + ".xml");
                var pbase = ["core", "teleport", "element", "baseclass"];
                while (pbase.length && (!file.exists || !file.data)) {
                    file = o3.fs.get(parser.output + "xml/" + filename.replace(/^\w+\./, pbase.shift() + ".") + ".xml");
                }
                if (!file.exists || !file.data) {
                    apf.console.warn("Missing file: " + filename + ".xml");
                    return apf.getXml("<empty />");
                }
                var data = apf.getXml(file.data);
                self.cache[filename] = data;

                return data;
            }

            self.checkBase = function(n, type){
                var nodes = n.selectNodes("inherit");
                for (var i = 0; i < nodes.length; i++){
                    n = self.loadFile('baseclass.' + nodes[i].getAttribute("name").toLowerCase());
                    if (n && (n.selectSingleNode(type) || self.checkBase(n, type)))
                        return true;
                }
                return false;
            }

            apf.console.info("Processing " + filename + ".xml");
            var file = o3.fs.get(parser.output + "html/" + filename + ".html");
            if (file.exists) return;
            file.data = parser.$jslt.apply(parser.$jsltdoc, xml);

            var nodes = xml.selectNodes("attribute|event|binding|action|method|property|object|skinitem");
            for (var i = 0; i < nodes.length; i++) {
                var fname = parser.output + "html/" + filename.replace(/\.xml$/, "")
                  + "." + nodes[i].tagName + "." + nodes[i].getAttribute("name").toLowerCase()
                var file = o3.fs.get(fname + ".html");
                if (file.exists) continue;
                file.data = parser.$jslt.apply(parser.$jsltdoc, nodes[i]);

                var subnodes = nodes[i].selectNodes("attribute|event");
                for (var j = 0; j < subnodes.length; j++) {
                    file = o3.fs.get(fname + "." + subnodes[j].tagName + "." 
                      + subnodes[j].getAttribute("name").toLowerCase() + ".html");
                    file.data = parser.$jslt.apply(parser.$jsltdoc, subnodes[j]);
                }
            }

            for (var i = 0; i < this.alias.length; i++) {
                if (!this.alias[i] || this.alias[i].trim() == this.data.name.trim())
                    continue;
                
                file = o3.fs.get(parser.output + "xml/" + filename.replace(/\.([\w-]+)$/, "." + this.alias[i] + ".xml"));
                xml = apf.getXml(file.data);

                file = o3.fs.get(parser.output + "html/" + file.name.replace(/\.xml$/, "") + ".html");
                file.data = parser.$jslt.apply(parser.$jsltdoc, xml);
            }
        }
    }

    function parseDescription(obj, str, pNode){
        var sections = (str || "")
            .replace(/^\s*((?:Possible values|\w+)\:)/mg, "=-~!@=$1\n")
            .split("=-~!@=");
        var m = sections[0].split(/\.[\s\n\r ]/);
        if (m[0] || m.shift())
            obj.create("description", null, pNode, m.shift().trim() + ".");
        if (m[0] && m[0].trim())
            obj.create("desclong", null, pNode, m.join("."));
        var jstype, type, name, i, strPV, p, j, q, s, optional;

        var lastsection, lastspace;
        for (i = 1; i < sections.length; i++) {
            m = sections[i].split(":");
            type  = m.shift().trim();
            lastspace = null;
            
            if (type == "Possible values" || type == "object" || type == "Properties") {
                strPV = m.join(":").split("\n");
                p = obj.create("section", type, pNode);

                for (j = 0; j < strPV.length; j++) {
                    if (!lastspace)
                        lastspace = (strPV[j].match(/^([ \s]+)/) || [])[1];
                    else if (lastsection && strPV[j] && (strPV[j].match(/^([ \s] +)/) || [])[1] != lastspace) {
                        lastnode.appendChild(p);
                        p = lastsection[0]; //only 1 deep
                        type = lastsection[1];
                        lastspace = (strPV[j].match(/^([ \s]+)/) || [])[1];
                    }

                    q = strPV[j].trim().split(" "); 
                    name = q.shift().trim();
                    if (name) {
                        if (type == "Properties" || type == "object") {
                            q = (name + " " + q.join(" ")).trim().match(/(?:\{(.*?)\})?\s+([\w\[\]-]+)(.*)/);//split(" ");
                            jstype = q[1];//name.replace(/[\{\}]/g, "");
                            name = q[2];//q.shift().trim();
                            optional = name[0] == "[";
                            node = obj.create("item", name.replace(/[\[\]]/g, ""), p, q[3]);//q.join(" ").trim());
                            node.setAttribute("type", jstype);
                            if (!optional)
                                node.setAttribute("required", "true");
                        }
                        else if(name[0] == "{") {
                            node = obj.create("item", "", p, q.join(" ").trim());
                            node.setAttribute("type", name.replace(/[\{\}]/g, ""));
                        }
                        else
                            node = obj.create("item", name, p, q.join(" ").trim());
                    }
                }
            }
            else
                p = obj.create("section", type, pNode, m.join(":").trim());
            
            lastnode = node;
            lastsection = [p, type];
        }
    }
    
    function Baseclass(data){
        this.data = data;
        if(!data.metadata) data.metadata = {};
        
        var filename = "baseclass." + data.name;
        Doc.call(this, filename, "baseclass");
        
        this.output.setAttribute("name", data.name);
        if (data.metadata.description)
            parseDescription(this, data.metadata.description[0]);
        
        this.parseJML();

        var dpriv = data.metadata.default_private;
        this.createList("event", data.metadata.event);
        this.createList("binding", data.metadata.binding);
        //this.createList("binding", data.bindings);
        this.createList("action", data.actions);
        this.createList("property", data.properties, null, true);
        this.createList("object", data.objects, null, dpriv);
        this.createList("method", data.methods, null, dpriv);
        this.createList("skinitem", data.skinxml);
        this.createList("inherit", data.metadata.inherits);
        this.createList("attribute", data.metadata.attribute);
        this.createList("see", data.metadata.see);

        this.createList("used", bcused[data.name]);
    }
    
    var lastControl;
    function Component(data){
        this.data = data;
        if(!data.metadata) data.metadata = {};
        
        var filename = "element." + data.name;
        Doc.call(this, filename, "element");
        
        this.output.setAttribute("name", data.name);
        if (data.metadata.description)
            parseDescription(this, data.metadata.description[0]);
        
        this.parseJML();
        
        //Aliasses (should be done using complexType ref but dirty for now)
        lastControl = data.name;

        var dpriv = data.metadata.default_private;
        this.createList("alias", data.metadata.alias);
        this.createList("event", data.metadata.event);
        this.createList("binding", data.metadata.binding);
        //this.createList("binding", data.bindings);
        this.createList("action", data.actions, null, dpriv);
        this.createList("property", data.properties, null, true);
        this.createList("object", data.objects, null, dpriv);
        this.createList("method", data.methods, null, dpriv);
        this.createList("skinitem", data.skinxml);
        this.createList("inherit", data.metadata.inherits);
        this.createList("attribute", data.metadata.attribute)
        this.createList("child", data.metadata.allowchild);
        this.createList("see", data.metadata.see);
    }

    function Term(data){
        this.data = data;
        if(!data.metadata) data.metadata = {};
        
        var filename = "term." + data.name;
        Doc.call(this, filename, "term");
        
        this.output.setAttribute("name", data.name);
        if (data.description)
            parseDescription(this, data.description[0]);
    }
   
    function KernelModule(data){
        this.data = data;
        if(!data.metadata) data.metadata = {};
        if(!data.name) data.name = "_";
        
        var filename = "core." + data.name;
        Doc.call(this, filename, "object");
        
        this.output.setAttribute("name", data.name);
        if (data.metadata.description)
            parseDescription(this, data.metadata.description[0]);
        
        this.parseJML();
        
        var dpriv = data.metadata.default_private;
        this.createList("event", data.metadata.event);
        this.createList("property", data.properties, null, dpriv);
        this.createList("object", data.objects, null, dpriv, data.name == "apf");
        //this.createList("property", data.servers);
        this.createList("method", data.methods, null, dpriv);
        this.createList("attribute", data.metadata.attribute);
        this.createList("see", data.metadata.see);
    }
    
    function TelePortModule(data){
        this.data = data;
        if(!data.metadata) data.metadata = {};
        
        var filename = "teleport." + data.name;
        Doc.call(this, filename, "teleport");
        
        this.output.setAttribute("name", data.name);
        if (data.metadata.description)
            parseDescription(this, data.metadata.description[0]);
        
        this.parseJML();
        
        //Aliasses (should be done using complexType ref but dirty for now)
        var dpriv = data.metadata.default_private;
        this.createList("event", data.metadata.event);
        this.createList("property", data.properties, null, dpriv);
        this.createList("method", data.methods, null, dpriv);
        this.createList("inherit", data.metadata.inherits);
        this.createList("attribute", data.metadata.attribute);
        this.createList("see", data.metadata.see);
    }

    var states = {"Namespace":1,"Elements":1,"Teleport":1,"Classes":1,"Parsers":1,"Objects":1,"Glossary":1,"Property":"Properties","Method":"Methods","Action":"Actions","Binding":"Bindings","Event":"Events", "Attribute":"Attributes", "Baseclasses":1}
    function addState(type, obj){
        if (!states[type] || obj.data.name.match(/^\$|^\d|^_/) || obj.data.name.length < 2)
            return;

        type = states[type] == 1 ? type : states[type];
        if (!state[type])
            state[type] = [];

        var s = state[type];
        for (var i = 0; i < s.length; i++) {
            if (s[i].data.name == obj.data.name && s[i].filename == obj.filename)
                return;
        }

        state[type].push(obj)
    }

    this.generate = function(){
        var data = oParser.data.global;
        
        var apf = new KernelModule(data.objects.apf);
        addState("Namespace", apf);
        for(var name in data.controls) {
            addState("Elements", new Component(data.controls[name]));
        }
        for(var name in data.teleport) {
            addState("Teleport", new TelePortModule(data.teleport[name]));
        }
        for(var name in data.classes){
            addState("Classes", new KernelModule(data.classes[name]));
        }
        for(var name in data.parsers){
            addState("Parsers", new KernelModule(data.parsers[name]));
        }
        for(var name in data.objects.apf.objects) {
            if (!data.objects.apf.objects[name].moved && !data.objects.apf.objects[name].metadata["private"] )
                addState("Objects", new KernelModule(data.objects.apf.objects[name]));
        }
        var terms = data.objects.apf.metadata.term;
        for(var i = 0; i < terms.length; i++) {
            addState("Glossary", new Term(terms[i]));
        }
        
        //Classes
        for(var name in data.baseclasses){
            var bc = data.baseclasses[name];
            if (bc.metadata.inherits) {
                for (var x = 0; x < bc.metadata.inherits.length; x++){
                    var xname = bc.metadata.inherits[x].trim().split("apf.")[1];
                    if (!bcused[xname]) bcused[xname] = [];
                    bcused[xname].push([bc.name, "baseclass." + bc.name.toLowerCase()]);
                }
            }
        }
        for(var name in data.baseclasses){
            addState("Baseclasses", new Baseclass(data.baseclasses[name]));
        }
    }
    
    var docFrag, itemSequence, fOutput;
    this.$loadPml = function(x){
        apf.console.info("Generating refguide xml.");
        this.generate();
        
        apf.console.info("Saving xml files...");

        //Proces queue
        var index = apf.getXml("<sections />");
        var doc = index.ownerDocument;
        for (var i = 0; i < files.length; i++) {
            files[i].save();
        }

        if (this.jslt) {
            o3.out("\n");
            apf.console.info("Saving html files...");

            this.$jslt = new apf.JsltImplementation();
            this.$jsltdoc = o3.fs.get(this.jslt).data;

           for (var i = 0; i < files.length; i++) {
                files[i].saveHtml();
            }
        }

        //var indexer = new XmlIndexer(this.output);
        //indexer.start();
        
        o3.out("\n");
        apf.console.info("Saving index file...");
        var prop, item, subitem;
        var seq = ["Namespace", "Elements", "Teleport", "Baseclasses", "Attributes", "Events", "Properties", "Methods", "Bindings", "Actions", "Parsers", "Objects", "Glossary"];
        //for (var prop in state) {
        for (var j = 0; j < seq.length; j++) {
            prop = seq[j];
            item = index.appendChild(doc.createElement("section"));
            item.setAttribute("n", prop);
            state[prop].sort(function(a, b){
                if (a.data.name.toLowerCase() < b.data.name.toLowerCase())
                    return -1;
                if (a.data.name.toLowerCase() > b.data.name.toLowerCase())
                    return 1;
                return 0;
            });
            for (var i = 0; i < state[prop].length; i++) {
                names = state[prop][i].filename.toLowerCase().split(".");
                name = state[prop][i].data.name;names.pop(); 
                subitem = item.appendChild(doc.createElement(names.pop()));//doc.createElement("item"));//state[prop][i].filename.split(".")[0]));
                subitem.setAttribute("n", name);
                if (names.length)
                    subitem.setAttribute("p", names.join("."));
                /*if (state[prop][i].output) {
                    subitem.setAttribute("description", 
                      apf.getXmlValue(state[prop][i].output, "description")
                        .replace(/[\n\r\s]+/mg, " "));//metadata.description[0].split(".")[0].replace(/[\n\r\s]+/g, " "));
                }*/
            }
        }

        o3.fs.get(this.output + "nav.xml").data = index.xml.replace(/(<.*>)|[\s \n\r]/g, "$1");

        apf.console.info("done.");
    }
}

function XmlIndexer(rootPath){
    //var rootPath = "/cwd/output/docs/PlatForm/";
    var ignorables = new Array("not", "a","the","it","open","ten","the","name",
        "seem","simple","of","very","together","several","to","through","next",
        "vowel","and","just","white","toward","a","form","children","war","in",
        "much","begin","lay","is","great","got","against","it","think","walk",
        "pattern","you","say","example","slow","that","help","ease","center",
        "he","low","paper","love","was","line","often","person","for","before",
        "always","money","on","turn","music","serve","are","cause","those",
        "appear","with","same","both","road","as","mean","mark","map","I",
        "differ","book","science","his","move","letter","rule","they","right",
        "until","govern","be","boy","mile","pull","at","old","river","cold",
        "one","too","car","notice","have","does","feet","voice","this","tell",
        "care","fall","from","sentence","second","power","or","set","group",
        "town","had","three","carry","fine","by","want","took","certain","hot",
        "air","rain","fly","but","well","eat","unit","some","also","room","lead",
        "what","play","friend","cry","there","small","began","dark","we","end",
        "idea","machine","can","put","fish","note","out","home","mountain","wait",
        "other","read","north","plan","were","hand","once","figure","all","port",
        "base","star","your","large","hear","box","when","spell","horse","noun",
        "up","add","cut","field","use","even","sure","rest","word","land","watch",
        "correct","how","here","color","able","said","must","face","pound","an",
        "big","wood","done","each","high","main","beauty","she","such","enough",
        "drive","which","follow","plain","stood","do","act","girl","contain",
        "their","why","usual","front","time","ask","young","teach","if","men",
        "ready","week","will","change","above","final","way","went","ever",
        "gave","about","light","red","green","many","kind","list","oh","then",
        "off","though","quick","them","need","feel","develop","would","house",
        "talk","sleep","write","picture","bird","warm","like","try","soon",
        "free","so","us","body","minute","these","again","dog","strong","her",
        "animal","family","special","long","point","direct","mind","make",
        "mother","pose","behind","thing","world","leave","clear","see","near",
        "song","tail","him","build","measure","produce","two","self","state",
        "fact","has","earth","product","street","look","father","black","inch",
        "more","head","short","lot","day","stand","numeral","nothing","could",
        "own","class","course","go","page","wind","stay","come","should",
        "question","wheel","did","country","happen","full","my","found",
        "complete","force","sound","answer","ship","blue","no","school","area",
        "object","most","grow","half","decide","number","study","rock","surface",
        "who","still","order","deep","over","learn","fire","moon","know","plant",
        "south","island","water","cover","problem","foot","than","food","piece",
        "yet","call","sun","told","busy","first","four","knew","test","people",
        "thought","pass","record","may","let","farm","boat","down","keep","top",
        "common","side","eye","whole","gold","been","never","king","possible",
        "now","last","size","plane","find","door","heard","age","any","between",
        "best","dry","new","city","hour","wonder","work","tree","better","laugh",
        "part","cross","true",".","thousand","take","since","during","ago","get",
        "hard","hundred","ran","place","start","am","check","made","might",
        "remember","game","live","story","step","shape","where","saw","early",
        "yes","after","far","hold","hot","back","sea","west","miss","little",
        "draw","ground","brought","only","left","interest","heat","round","late",
        "reach","snow","man","run","fast","bed","year","don't","five","bring",
        "came","while","sing","sit","show","press","listen","perhaps","every",
        "close","six","fill","good","night","table","east","me","real","travel",
        "weight","give","life","less","language","our","few","morning","among",
        "under","stop","Component","event","Baseclass","Action","Action","Binding",
        "Smart","Kernel","Method","Object","Property","Skin","SkinItem","ie","eg",
        "Adds","chunk","xml","jml","data","using","usually","via","retrieved",
        "specify","specified","current","file");

    var inheritLookup = {};
    var a = false;
    var FID_MOUNT = 1;
    var FID_FOLDER = 2;
    var FID_FILE = 3;

    /**************************
        INDEX SEARCH
    **************************/
    
    this.start = function(){
        //if(!confirm("This will take several minutes during which this window might not respond. Are you sure you want to continue?")) return;
        
        apf.console.info("Creating search index...");
        createSearchIndex(rootPath);
        apf.console.info("done.");
        
        /*var strXML = o3.fs.root.GetChild(rootPath + "search.xml").data;
        if(!strXML) alert("Could not read Index file.");
        else DBINDEX = apf.xmldb.getXml(strXML);*/
    
        apf.console.info("Creating file index...");
        createFileIndex(rootPath);
        apf.console.info("done.");
    }
    
    function createSearchIndex(directory){
        var filedata = [], files = getXMLFiles(directory);
        
        for(var i=0;i<files.length;i++){
            //Build fildata array
            
            var path = files[i][2];//.split("\\")[0];
            var filename = files[i][0];//.name;//files[i].split("\\")[1].split(".")[0];
            
            if(path.match(/elements/)){
                var xmldoc = apf.xmldb.getXml(files[i][1]);
                //var nodelist = strXML.selectNodes("//Inherited");
                var nodelist = xmldoc.getElementsByTagName("inherit");
                
                for(var j=0;j<nodelist.length;j++){
                    var cls = nodelist.item(j).getAttribute("class");
                    if(!inheritLookup[cls]) inheritLookup[cls] = [];
                    inheritLookup[cls].push(files[i]);
                }
            }
        }
            
        //Generate XML Document
        wordXMLdoc = apf.xmldb.getXml("<words />").ownerDocument;
        
        for(var i=0;i<files.length;i++){
            createIndex(files[i], wordXMLdoc.xml, inheritLookup);
        }

        o3.fs.CreateChild(directory + "/search.xml", FID_FILE).data = wordXMLdoc.documentElement.xml;//.replace(/\<(Instance|Word)/g, "\n<$1"));
    }
    
    function getXMLFiles(dir, xmlfiles){
        //if(!dir.match(/^app\//)) dir = "app/" + dir;

        var files = o3.fs.get(dir).children;
    
        if(!xmlfiles) xmlfiles = new Array();
        for(var i=0;i<files.length;i++){
            if(files[i].name == ".svn" || files[i].name.match(/^_|(xslt|js|gif|jpg|css|html|php|index\.xml|search\.xml)$/)) continue;
            
            if(files[i].isDir){
                //recursion
                getXMLFiles(dir.replace(/\/$/, "") + "/" + files[i].name, xmlfiles);
            }
            else{
                xmlfiles.push([files[i].name, files[i].data || "", dir]);
            }
        }
        
        return xmlfiles;
    }
    
    function createIndex(file, xmldoc, inherited){
        //var type=url.split("\\")[0];
        var path = file[2]
        var strXML = file[1];
        var filename = file[0];//url.split("\\")[1].split(".")[0];
    
        strXML = strXML.replace(/\<\!\[CDATA\[/g, "");
        strXML = strXML.replace(/\]\]\>/g, "");
        strXML = strXML.replace(/\<[^\>]*\>/g, "");
        strXML = strXML.replace(/[^A-Za-z-_\@]/g, " ");
        strXML += filename;//path.replace(/\//g, " ") + " " + 
        
        // Splitten op whitespace. Daarvoor eerst dubbele whitespaces weghalen
        strXML = " " + strXML.replace(/\s\s+/g, " ") + " ";
        
        // Te negeren woorden weghalen.
        var result = null;
        do{
            if(result) strXML = result;
            result = strXML.replace(new RegExp(" (" + ignorables.join("|") + ") ", "gi"), " ");
        }while(result.length != strXML.length);
        
        strXML = strXML.replace(/\s*/,"");
        strXML = strXML.replace(/\s*$/,"");
    
        var arWords = strXML.split(" ");
        
        // Aantal keer dat een woord voorkomt tellen.
        var lookup = {};
        for(var j=0;j<arWords.length;j++){
            if(!lookup[arWords[j]]) lookup[arWords[j]] = 0;
            lookup[arWords[j]]++;
        }
        
        for(prop in lookup){
            if(typeof lookup[prop] != "number") continue;
            addXmlRef(prop, lookup[prop], path + "/" + filename, wordXMLdoc);//title
            
            if(path.match(/BaseClass/)){
                var bccomps = inherited[filename];
                Z = true;
    
                for(bcprop in bccomps){
                    if(typeof bccomps[bcprop] != "string") continue;
                    addXmlRef(prop, lookup[prop], bccomps[bcprop], wordXMLdoc);
                }
            }
        }
    }
    
    function addXmlRef(name, nr, url, xmldoc){
        var wordXML = xmldoc.selectSingleNode("//word[translate(@name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='" + name.toLowerCase() + "']");
        if(!wordXML){
            var wordXML = xmldoc.documentElement.appendChild(xmldoc.createElement("word"));
            wordXML.setAttribute("name", name);
        }
    
        var instance = wordXML.selectSingleNode("instance[@url='" + url + "']");
        if(instance){
            instance.firstChild.nodeValue = parseInt(instance.firstChild.nodeValue) + nr;
        }
        else{
            var instance = wordXML.appendChild(xmldoc.createElement("instance"));
            instance.setAttribute("title", url.replace(/^.*\/([^\/]*)\.xml$/, "$1"));
            instance.setAttribute("url", "docs/" + url.replace(/^\/cwd\/output\/docs\//, ""));//PlatForm\/
            instance.appendChild(xmldoc.createTextNode(nr));
        }
    }
    
    /* create folder index files in each folder */
    
    $ROOTDIRS = {
        action : "Actions",
        baseclass : "BaseClasses",
        binding : "Bindings",
        element : "Components",
        event : "Events",
        kernel : "Kernel Modules",
        communication : "Communication",
        method : "Methods",
        object : "Objects",
        property : "Properties",
        skinitem : "Skin Items"
    };
    
    function htmlentities(str){
        str = str.replace(/\&/g, "&amp;");
        return str;
    }
    
    function createFileIndex(path){
        var docNode = o3.fs.GetChild(rootPath);
        var strXML = getXML(docNode, true);
    
        docNode.CreateChild("index.xml", FID_FILE).data = strXML;
    }
    
    // Collects Directory information and returns this as an XML string.
    function getXML(dirNode, isRoot, path){
        var strXML = "";
        
        // Get files index
        generateFiles(dirNode, path);
        
        // Build Tree XML
        if(isRoot) strXML = "<data><root name='Reference Guide'>";
        var folders = dirNode.children;
        if(!path) path = "";
        
        for(var i=0;i<folders.length;i++){
            if(!folders[i].isDir || folders[i].name == ".svn") continue;
            var folderName = $ROOTDIRS[folders[i].name] || folders[i].name;
            var newpath = (isRoot ? "docs/PlatForm/" : path + "/") + folders[i].name;
            strXML += "<folder name='" + htmlentities(newpath) + "' caption='" + htmlentities(folderName) + "'>";
            strXML += getXML(folders[i], false, newpath);
            strXML += "</folder>";
        }
        
        if(isRoot) strXML += "</root></data>";
        
        return strXML;
    }
    
    function generateFiles(dirNode, path){
        var name = dirNode.name;
        
        var strXML = "<?xml version=\"1.0\"?><?xml-stylesheet type=\"text/xsl\" href=\"/docs/index.xslt\"?>\n<files caption='" + htmlentities($ROOTDIRS[dirNode.name] || dirNode.name) + "'>";
        var files = dirNode.children;
        
        for(var i=0;i<files.length;i++){
            if(!files[i].name.match(/^_|(xslt|js|gif|jpg|css|php|index\.xml|search\.xml)$/) && !files[i].isDir){
                var str = files[i].data || "";
                var matches = str.match(/\<description\>\n?\s*(.*)\s*\<\/description\>/);
                strXML += "<file name='" + htmlentities(files[i].name.replace(/\.xml$/, "")) + "' url='" + htmlentities(path + "/" + files[i].name) + "'><![CDATA[" + (matches ? matches[1] : "") + "]]></file>";
            }
        }
        
        strXML += "</files>";
    
        dirNode.get("index.xml").data = strXML;
    }
}


