/**
 * baseclasses
 * alle classes die geen elements zijn
 * elements
 * methods
 * objects
 */

var navList = {
    "element"   : [],
    "baseclass" : [],
    "attribute" : [],
    "event"     : [],
    "binding"   : [],
    "action"    : [],
    "property"  : [],
    "method"    : [],
    "term"      : [],
    "object"    : []
}
var outputPathObj = null;
var outputFolder = "";
function parse_refguide_xml(docTree, outputFolderObj) {
    outputPathObj = outputFolderObj;
    outputFolder = (outputPathObj) ? outputPathObj.fullPath + "\\" : $o3.fs.fullPath + "\\";
    
    var list = [
        {name: "baseclass", list: docTree.baseclass}, 
//        {name: "class", list: docTree["class"]},
        {name: "element", list: docTree.element}, 
        {name: "object", list: docTree.object}
//        {name: "method", list: docTree.method}, 
    ];
    // add methods to apf.object
    if (docTree.object.apf)
	   docTree.object.apf.method = docTree.method;

    var output = [], created = [], createdTerms = [];
    for (var i = 0, l = list.length; i<l; i++) {
        if (!list[i]) break;
        var type = list[i].name;
        // process all but terms
        if (type != "term") {
            for (var name in list[i].list) {
                // ignore objects starting with $ and _
                if (["$", "_"].indexOf(list[i].list[name].name.charAt(0)) == -1) {
                    
                    var obj = new refguideDoc(list[i].list[name], docTree).parse();

                    if (docparser.outputXml)
                        obj.save();
                }
                //output.push(obj.xml.xml)
                created.push(obj);
                
                // add to navList
                if (type == "baseclass")
                    navList.baseclass.push({n: name.replace("apf.", "")});

                // o3 object, loop through child objects
                if (list[i].name == "object" && name == "o3") {
                    for (var objName in list[i].list[name].object) {
                        // ignore objects starting with $ and _
                        if (["$", "_"].indexOf(list[i].list[name].object[objName].name.charAt(0)) == -1) {
                            var obj = new refguideDoc(list[i].list[name].object[objName], docTree).parse();
                            
                            if (docparser.outputXml)
                                obj.save();
                        }
                        //output.push(obj.xml.xml)
                        created.push(obj);
                    }
                } 
            }
        }
        
        // process terms
        else {
            for (var t = 0, tl = list[i].list.length; t < tl; t++) {
                var obj = new refguideTerm(list[i].list[t]);
                if (docparser.outputXml)
                    obj.save();

                createdTerms.push(obj);
                
                // add to navList
                navList[type].push({n: list[i].list[t].name}); 
            }
        }
    }
    //apf.dispatchEvent("docgen_complete", {type: "xml files"});

    if (docparser.outputHtml) {
        var http = new apf.http();
        var lmFile = "file:///C:/development/javeline/docparser/docgen_refguide_html.lm";
        if (outputPathObj) {
            lmFile = "docparser/docgen_refguide_html.lm";
        }
        
        http.get(lmFile, {
            callback: function(str) {
                lm = apf.lm.compile(str);
                
                // all but terms
                for (var i = 0, l = created.length; i<l; i++) {
                    // ignore objects starting with $ and _
                    if (["$", "_"].indexOf(created[i].obj.name.charAt(0)) == -1) {
                        created[i].saveHtml(lm, "refguide/");
                    }
                }

                // terms
                for (var i = 0, l = createdTerms.length; i<l; i++) {
                    createdTerms[i].saveHtml(lm, "refguide/");
                }
                
                // finished generating html and xml files!!
                //apf.dispatchEvent("docgen_complete", {type: "html files"});
            }
        });
        
    }

    // nav.xml
    if (docparser.outputNav) {
        var navXml = apf.getXml("<sections />");
        var doc     = navXml.ownerDocument;
        
        var navListHeader = {
            "element"   : "Elements",
            "baseclass" : "Baseclasses",
            "attribute" : "Attribute",
            "event"     : "Events",
            "binding"   : "Bindings",
            "action"    : "Actions",
            "property"  : "Properties",
            "method"    : "Methods",
            "term"      : "Glossary",
            "object"    : "Objects"
        }
        for (var type in navList) {
            // add section
            var section = doc.createElement("subcat");
            section.setAttribute("n", navListHeader[type]);
            section.setAttribute("icon", navListHeader[type]);
            
            for (var added = null, n = 0, nl = navList[type].length; n < nl; n++) {
                if (!navList[type][n].p) {
                    if (!added) added = [];
                    
                    // skip if already added
                    if (added.indexOf(navList[type][n].n) > -1)
                        continue;
                        
                    var item = doc.createElement(type);
                    item.setAttribute("n", navList[type][n].n.toLowerCase());

                    section.appendChild(item);
                    added.push(navList[type][n].n);
                } else {
                    if (!added) added = {};
                    
                    // skip if already added
                    if (added[navList[type][n].p] && added[navList[type][n].p].indexOf(navList[type][n].n) > -1)
                        continue;

                    var item = doc.createElement(type);
                    item.setAttribute("n", navList[type][n].n.toLowerCase());

                    if (navList[type][n].p)
                        item.setAttribute("p", navList[type][n].p.toLowerCase());

                    section.appendChild(item);
                    if (!added[navList[type][n].p]) added[navList[type][n].p] = [];
                    added[navList[type][n].p].push(navList[type][n].n);
                }
            }
            
            navXml.appendChild(section);
        }
        
        var fileContent = '<?xml version="1.0"?>' + "\n" + navXml.xml;
        if (outputPathObj) {
            outputPathObj.get("nav/nav.xml").data = fileContent;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "nav\\nav.xml"});
        }
        else {
            $o3.fs.get("refguide/nav/nav.xml").data = fileContent;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "refguide\\nav.xml"});
        }
        apf.dispatchEvent("docgen_complete", {type: "Nav"});
    }
    
	//var win = window.open();
    //win.document.write(apf.formatXml(output.join("\n")));
}

function refguideTerm(obj){
    this.obj = obj;
    this.xml    = apf.getXml("<term />");
    var doc     = this.xml.ownerDocument;
    this.xml.setAttribute("name", obj.name);
    
    for (var i = 0, l = obj.description.length; i < l; i++) {
        if (obj.description[i].description && typeof obj.description[i].description == "object" && obj.description[i].description.length) {
            obj.description[i].description = obj.description[i].description.join("\n");
        }
    }
    
    parseDescXml(this.xml, obj.description);
    
    /*
    if (obj.description.indexOf(". ") > -1) {
        var split = obj.description.split(". ");
        var description = split.shift() + ".";
        var desclong = split.join("\n");
    }
    
    this.xml.appendChild(doc.createElement("description")).appendChild(doc.createTextNode(description));

    if (desclong) {
        this.xml.appendChild(doc.createElement("desclong")).appendChild(doc.createTextNode(desclong));
    }
    */    
    this.save = function() {
        this.xmlFilename = "term." + this.obj.name.toLowerCase();
        this.createXMLFile(this.xmlFilename + ".xml", this.xml.xml);
    }
    
    this.createXMLFile = function(name, content) {
        var fileContent = '<?xml version="1.0"?>' + "\n" + content;
        if (outputPathObj) {
            outputPathObj.get("xml/" + name).data = fileContent;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + name});
        }
        else {
            $o3.fs.get("refguide/xml/" + name).data = fileContent;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "refguide\\xml\\" + name});
        }
        
    }
    
    this.saveHtml = function(fParsed, output){
        var xml = this.xml;

        var filename = this.xmlFilename;
        apf.console.info("Processing " + filename + ".xml");
        
        var file = (outputPathObj) ? outputPathObj.get("html/" + filename + ".html") : $o3.fs.get(output + "html\\" + filename + ".html");
        
        //if (file.exists) return;
        file.data = fParsed(xml);
        
        if (outputPathObj)
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + name});
        else
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + output + "html\\" + filename  + ".html"});
    }
}

function refguideDoc(obj, docTree){
    this.obj = obj;
    
    var type = obj.type;
    /*
    if (type == "class") {
        if (this.obj.elementNames) {
            type = "element";
        }
    } 
    */
    this.type = type;
    this.xml = apf.getXml("<" + type + " />");
    
    // set xml node attributes
    if (this.obj.filename) this.xml.setAttribute("file", this.obj.filename);
    //this.xml.setAttribute("line", "@todo");
    this.xml.setAttribute("name", this.obj.name);
    
    var doc     = this.xml.ownerDocument;
    
    this.parse = function(){
        // description
        var desc = [];
        // set description from define
        if (this.obj.description && this.obj.description.length) {
            desc = desc.concat(this.obj.description);
        }
        if (this.obj.type == "element" && docTree.defines[this.obj.name] && docTree.defines[this.obj.name].description) {
            desc = desc.concat(docTree.defines[this.obj.name].description);
        }
        if (desc.length)
            parseDescXml(this.xml, desc);
        
        var tList = {}
        tList["baseclass"] = ["event", "binding", "action", "allowchild", "prototype", "method", "attribute", "property", "see"]; // "inherits", 
        //tList["class"]     = ["event", "binding", "action", "allowchild", "inherits", "prototype", "method", "attribute", "property", "see"];
        tList["element"]   = ["event", "binding", "action", "allowchild", "inherits", "prototype", "method", "attribute", "property", "see"];
        tList["object"]    = ["event", "binding", "action", "allowchild", "inherits", "prototype", "method", "attribute", "property", "see", "object"];
        //tList["method"]    = ["param", "return", "used"];

        for (var t in tList[this.obj.type]) {
            var n = (this.obj[tList[this.obj.type][t]] != undefined) ? this.obj[tList[this.obj.type][t]] : [];
            var type = tList[this.obj.type][t];

            // add items from define
            // overwrite items with same name
            if (this.obj.type == "element" && docTree.defines[this.obj.name] && docTree.defines[this.obj.name][type]) {
                var nCopy = n.slice(0);
                for (var di = 0, dl = docTree.defines[this.obj.name][type].length; di < dl; di++) {
                    for (var duplicate = false, ni = 0, nl = nCopy.length; ni < nl; ni++) {
                        if (nCopy[ni].name == docTree.defines[this.obj.name][type][di].name) {
                            duplicate  = true;
                            break;
                        }
                    }
                    
                    if (duplicate) {
                        nCopy[ni] = docTree.defines[this.obj.name][type][di];
                    }
                    else {
                        nCopy.push(docTree.defines[this.obj.name][type][di]);
                    }
                }
                n = nCopy;
                //n = n.concat(docTree.defines[this.obj.name][type]);
            }
            
            // loop through indexed array
            // ignore objects with name "length"
            if (n.length && typeof n.length != "object" && typeof (n) != "string") {
                for (var i = 0, l = n.length; i < l; i++) {
                    if (type == "allowchild") {
                        var s =  doc.createElement("child");
                        s.setAttribute("name", n[i])
                        s.setAttribute("set", "true");
                        
                        this.xml.appendChild(s);
                    } 
                    
                    else if (type == "see") {
                        var s = doc.createElement("see");
                        s.setAttribute("filename", n[i]);
                        var sc = doc.createElement("used");
                        sc.setAttribute("name", this.obj["see"].used);
                        sc.setAttribute("filename", this.obj.filename);
                        s.appendChild(sc)
                            
                        this.xml.appendChild(s);
                    }
                    
                    else if (["event", "attribute", "param", "binding", "action", "property"].indexOf(type) > -1) {
                        n[i].toXml(this.xml);

                        // add to navList                        
                        if (type != "param") {
                            var pType = (this.obj.type == "class") ? "element" : this.obj.type;
                            
                            if (this.obj.fullname.substr(0, 4) == "apf.")
                                navList[type].push({n: n[i].name, p: pType + "." + this.obj.fullname.substr(4)}); 
                            else
                                navList[type].push({n: n[i].name, p: pType + "." + this.obj.fullname});
                        }
                    }
                    
                    else {
                        var name = (type == "inherits") ? "inherit" : type;
                        if (type == "inherits") {
                            // check if value is saved as baseclass
                            // and doesn't inherit from prototype to prevent duplicate
                            var addInherit = true;
                            
                            if (!docTree.baseclass[n[i]]) continue;
                            
                            if (this.obj.prototype && docTree.baseclass[this.obj.prototype]) {
                                var tree = getTreeList(docTree.baseclass[this.obj.prototype]);
                                if (tree.indexOf(n[i]) > -1) 
                                    continue
                            }

                                //if (docTree.baseclass[n[i]] && n[i] != this.obj.prototype && !inheritFrom(docTree.baseclass[n[i]], this.obj.prototype, docTree)) {
                            var value = (n[i].toLowerCase().substr(0, 4) == "apf.") ? n[i].substr(4) : n[i];
                            this.xml.appendChild(doc.createElement(name))
                            .setAttribute("name", value);
                                //}
                        } else {
                            this.xml.appendChild(doc.createElement(name))
                                .setAttribute("name", n[i]);
                        }
                    }
                     
                    // check if object has toXml method
                    /*
                    else if (n[i].toXml != undefined) {

                        n[i].toXml(this.xml);
                    }
                    // if not object, probably string
                    else {
                        debugger;
                        var name = (tList[this.obj.type][t] == "inherits") ? "inherit" : tList[this.obj.type][t];
                        switch (tList[this.obj.type][t]) {
                            case "see":
                                break;
                            default:
                                this.xml.appendChild(doc.createElement(name))
                                    .setAttribute("name", n[i]);
                        }
                    }
                    */
                }
                
            // loop through associative object
            } 
            else if (type == "method" || type == "object" || type == "property") {
                for (var j in n) {
                    if (n[j].toXml != undefined && j.charAt(0) != "$") {
                        // ignore private methods
                        if (type == "method" && (n[j].isPrivate || ["$", "_"].indexOf(n[j].name.charAt(0)) > -1)) continue;

                        n[j].toXml(this.xml);

                        // add to navList
                        //if (type == "method") {
                            if (this.obj.context.name != "o3" && this.obj.name != "o3"){
                                var pType = (this.obj.type == "class") ? "element" : this.obj.type;
                                if (this.obj.fullname.substr(0, 4) == "apf.")
                                    navList[type].push({n: n[j].name, p: pType + "." + this.obj.fullname.substr(4)});
                                else
                                    navList[type].push({n: n[j].name, p: pType + "." + this.obj.fullname});
                            }
                            else {
                                if (this.obj.name == "o3")
                                    navList[type].push({n: n[j].name});
                                else
                                    navList[type].push({n: n[j].name, p: this.obj.type + "." + this.obj.name});
                            }
                        //}
                        
                    }
                }
            } 
            else if (type == "prototype" && typeof n == "string") {
                // check if value is saved as baseclass

                if (docTree.baseclass[n]) {
                    var inheritList = this.xml.selectNodes("//inherit");
                    var addPrototype = true;
                    for (var tree, ini = 0, inl = inheritList.length; ini < inl; ini++) {
                        if (!docTree.baseclass["apf." + inheritList[ini].getAttribute("name")]) continue;
                        tree = getTreeList(docTree.baseclass["apf." + inheritList[ini].getAttribute("name")]);
                        if (tree.indexOf(n) > -1) { 
                            addPrototype = false;
                            break;
                        }
                        //
                    }

                    if (addPrototype) {
                        var value = (n.toLowerCase().substr(0, 4) == "apf.") ? n.substr(4) : n;
                        this.xml.appendChild(doc.createElement("inherit"))
                        .setAttribute("name", value);
                    }
                } 
                
                //else
                    //debugger;
                
            // if values are stored in description
            } else if (this.obj[tList[this.obj.type][t]]) {
                if (tList[this.obj.type][t] == "return") {
                    var s = doc.createElement("return");
                    s.setAttribute("type", n.type);
                    var sc = doc.createElement("description")
                                .appendChild(doc.createTextNode(n.description[0].description));
                    s.appendChild(sc);
                    this.xml.appendChild(s);
                }
            }
        }
        
        // used
        //if (this.obj.type == "baseclass")
        if (docTree.used[this.obj.name] && this.obj.name != "toString") {
            for (var uString in docTree.used[this.obj.name]) {
                var u = this.xml.appendChild(doc.createElement("used"));
                u.setAttribute("name", docTree.used[this.obj.name][uString]);
                var uType = uString.split(".")[0];
                var uName = uString.split(".")[1];
                var el;
                var types = ["baseclass", "class", "element", "method"];
                for (var i = 0; i < types.length; i++) {
                    el = docTree[types[i]]["apf." + uName] || docTree[types[i]][uName];
                    if (el) break;
                }
                //el = docTree[uType]["apf." + uName] || docTree[uType][uName];
                
                var type = ((el && el.elementNames) || docTree.element[uName]) ? "element" : types[i];
                
                u.setAttribute("filename", type + "." + uName);
            }
        }
        
        return this;
    }
    
    this.save = function(){
        if (!this.fileList) this.fileList = [];
        /*
        if (this.obj.elementNames) {
            for (var xml, name, i = 0; i < this.obj.elementNames.length; i++) {
                name = this.obj.elementNames[i];
                //add to navList
                navList.element.push({n: name});

//                if (docTree.element[name]) continue;

                this.xml.setAttribute("name", name);
                this.fileList.push({
                    filename: "element." + name.toLowerCase(),
                    name: name,
                    type : "element"
                });
                
                //this.xmlFilenames.push();
                xml = this.xml.xml.replace("<" + this.type, "<element").replace("</" + this.type + ">", "</element>");
                this.createXMLFile("element." + name.toLowerCase() + ".xml", xml);
            }       
        }
        */
        //if (this.type != "class"){
            this.xml.setAttribute("name", name = this.obj.name);
            if (this.obj.context.name == "o3")
                this.xml.setAttribute("context", "o3");


            this.fileList.push({
                filename: this.type + "." + name.toLowerCase(),
                name: name,
                type : this.type
            });

            if (type == "element")
                navList.element.push({n: name});
            
            this.createXMLFile(this.type + "." + name.toLowerCase() + ".xml", this.xml.xml);
        //}

        //document.getElementById("divlog").innerHTML += "<pre>" + apf.htmlentities(apf.formatXml(this.xml.xml)) + "</pre>";
        //debugger;
    }
    
    this.createXMLFile = function(name, content) {
        var fileContent = '<?xml version="1.0"?>' + "\n" + content;
        if (outputPathObj) {
            outputPathObj.get("xml/" + name).data = fileContent;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + name});
        }
        else {
            $o3.fs.get("refguide/xml/" + name).data = fileContent;
            apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "refguide\\xml\\" + name});
        }
        
        
        
    }

    this.saveHtml = function(fParsed, output){
        if (this.obj.name.charAt(0) == "$")
            return;
            
        self.loadFile = function(filename){
            if (!filename)
                debugger;
            //var filename = this.xmlFilename;
            if (filename == "baseclass.http")
                filename = "teleport.http";
        
            if (!self.cache)
                self.cache = {};

            if (self.cache[filename]) 
                return self.cache[filename];

            var file = (outputPathObj) ? outputPathObj.get("xml/" + filename + ".xml") : $o3.fs.get(output + "xml/" + filename + ".xml");

            var pbase = ["core", "teleport", "element", "baseclass"];
            while (pbase.length && (!file.exists || !file.data)) {
                file = (outputPathObj) ? outputPathObj.get("xml/" + filename.replace(/^\w+\./, pbase.shift() + ".") + ".xml") : $o3.fs.get(output + "xml/" + filename.replace(/^\w+\./, pbase.shift() + ".") + ".xml");
            }

            if (!file.exists || !file.data) {
                apf.console.warn("Missing file: " + filename + ".xml");
                return apf.getXml("<empty />");
            }
            var data = apf.getXml(file.data, null, true);
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

        var fileList = this.fileList;
        
        for (var xml, filename, fi = 0, fl = fileList.length; fi < fl; fi++) {
            filename = fileList[fi].filename;
            
            xml = this.xml;
            xml.setAttribute("name", fileList[fi].name);
            
            if (this.type != fileList[fi].type)
                xml = apf.getXml(xml.xml.replace("<" + this.type, "<" + fileList[fi].type).replace("</" + this.type + ">", "</" + fileList[fi].type + ">"));

            //apf.console.info("Processing " + filename + ".xml");
            
            var file = (outputPathObj) ? outputPathObj.get("html/" + filename + ".html") : $o3.fs.get(output + "html/" + filename + ".html");
            
            //if (file.exists) return;
            file.data = fParsed(xml);
            if (outputPathObj)
                apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + "html\\" + filename + ".html"});
            else
                apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + output + "html\\" + filename + ".html"});
            
            var nodes = xml.selectNodes("attribute|event|binding|action|method|property|object|skinitem");
            for (var i = 0; i < nodes.length; i++) {
                // ignore private stuff $
                if (nodes[i].getAttribute("name").charAt(0) == "$")
                    continue;
                    
                //var fname = output + "html/" + filename.replace(/\.xml$/, "");
                var fname = (outputPathObj) ? "html/" + filename + "." + nodes[i].tagName + "." + nodes[i].getAttribute("name").toLowerCase() : output + "html/" + filename + "." + nodes[i].tagName + "." + nodes[i].getAttribute("name").toLowerCase();
                var file = (outputPathObj) ? outputPathObj.get(fname + ".html") : $o3.fs.get(fname + ".html");
                //if (file.exists) continue;
                file.data = fParsed(nodes[i]);
                
                if (outputPathObj)
                    apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + fname + ".html"});
                else
                    apf.dispatchEvent("docgen_message", {message: "Generated: " + outputFolder + output + fname + ".html"});
                
                var subnodes = nodes[i].selectNodes("attribute|event");
                for (var j = 0; j < subnodes.length; j++) {
                    file = (outputPathObj) 
                        ? outputPathObj.get(fname + "." + subnodes[j].tagName + "." + subnodes[j].getAttribute("name").toLowerCase() + ".html") 
                        : $o3.fs.get(fname + "." + subnodes[j].tagName + "." + subnodes[j].getAttribute("name").toLowerCase() + ".html");

                    file.data = fParsed(subnodes[j]);
                    apf.dispatchEvent("docgen_message", {message: "Generated: " + fname + "." + subnodes[j].tagName + "." + subnodes[j].getAttribute("name").toLowerCase() + ".html"});
                }
            }
        }
/*
        for (var i = 0; i < this.alias.length; i++) {
            if (!this.alias[i] || this.alias[i].trim() == this.data.name.trim())
                continue;
            
            file = $o3.fs.get(output + "xml/" + filename.replace(/\.([\w-]+)$/, "." + this.alias[i] + ".xml"));
            xml = apf.getXml(file.data);

            file = $o3.fs.get(output + "html/" + file.name.replace(/\.xml$/, "") + ".html");
            file.data = fParsed(xml);
            apf.dispatchEvent("docgen_message", {message: "Generated: html\\" + file.name.replace(/\.xml$/, "") + ".html"});
        }
*/
    }
}


function parseDescXml(pNode, desc) {
    var doc     = pNode.ownerDocument;
    if (desc.description)
        desc = desc.description;

    if (typeof desc == "string")
        var strDesc = desc;
    else {
        if (typeof desc[0].description == "string") {
            var strDesc = desc[0].description;
            desc = desc.slice(1);
        }
    }
    
    if (strDesc) {
        var pos     = strDesc.indexOf(". ");
    
        // add first line of description
        if (pos > -1) {
            pNode.appendChild(doc.createElement("description"))
                 .appendChild(doc.createTextNode(strDesc.substr(0, pos + 1).split("\n").join(" ")));
            
            // add desclong description if description more than one line
            if (strDesc.length > pos + 1) {
                pNode.appendChild(doc.createElement("desclong"))
                     .appendChild(doc.createTextNode(strDesc.substr(pos + 1).split("\n").join(" ")));
            }
        } else {
            strDesc = (strDesc.description) ? strDesc.description : strDesc;
            if (strDesc && typeof strDesc == "string" && strDesc.trim() != "")
                pNode.appendChild(doc.createElement("description"))
                     .appendChild(doc.createTextNode(strDesc.split("\n").join(" ")));
        }
    }
    // when description is string, no recursive looping neccesary
    //if (typeof strDesc == "string")
        //return;
        
    (function recur(parent, list) {
        var s;
        if (typeof list == "string" || list.length == 0)
            return;
        for (var d, i = 0, l = list.length; i < l; i++) {
            d = list[i];

            if (d.name) {
                s = parent.appendChild(doc.createElement("item"));
                s.setAttribute("name", d.name);
                if (d.type) s.setAttribute("type", d.type);
                
                // set required attribute is optional = false and parentNode != "Possible values" of "return"
                if (!d.optional && s.parentNode.getAttribute("name") && ["possible values", "return"].indexOf(s.parentNode.getAttribute("name").toLowerCase()) == -1) { 
                    s.setAttribute("required", "true");
                }
            }
            else {
                if (d.type) {
                    s = parent.appendChild(doc.createElement("section"));
                    s.setAttribute("name", d.type);
                } else {
                    continue;
                }
            }
                
            if (typeof d.description == "string") {
                if (d.description.trim() != "")
                    s.appendChild(doc.createTextNode(d.description));
            }
            else {
                //recursive
                if (d.description && d.description.length) {
                    if (d.type == "Example") {
                        s.appendChild(doc.createTextNode(d.description.join("\n")));
                    } else {
                        if (typeof d.description[0].description == "string") {
                            s.appendChild(doc.createTextNode(d.description[0].description));
                        }
                        recur(s, d.description);
                    }
                }
            }
        }
    })(pNode, desc);
}

oFunc.prototype.toXml = function(pNode){
    var doc     = pNode.ownerDocument;
    
    var n = pNode.appendChild(doc.createElement(this.type))
    n.setAttribute("name", this.name);
    if (this.filename) n.setAttribute("file", this.filename);

    if (this.context && this.context.context && this.context.context.name == "o3")
        n.setAttribute("context", "o3");

    //n.setAttribute("line", "@todo");

    if (this.description && this.description.length) parseDescXml(n, this.description);
    childParse(n, this, "attribute");
    childParse(n, this, "event");
    childParse(n, this, "param");
    
    childParse(n, this, "return", "description");
    childParse(n, this, "used");
    childParse(n, this, "see");
}

oProperty.prototype.toXml = function(pNode){
    var doc     = pNode.ownerDocument;
    
    var n = pNode.appendChild(doc.createElement(this.type))
    n.setAttribute("name", this.name);
    if (this.dataType) n.setAttribute("dataType", this.dataType);
    if (this.filename) n.setAttribute("file", this.filename);

    if (this.context && this.context.context && this.context.context.name == "o3")
        n.setAttribute("context", "o3");
    
    if (this.description && this.description.length) parseDescXml(n, this.description);
    
    childParse(n, this, "used");
    childParse(n, this, "see");
}

oObject.prototype.toXml = function(pNode){
    var doc     = pNode.ownerDocument;
    
    var n = pNode.appendChild(doc.createElement(this.type))
    n.setAttribute("name", this.name);
    if (this.filename) n.setAttribute("file", this.filename);

    if (this.context && this.context.context && this.context.context.name == "o3")
        n.setAttribute("context", "o3");

    if (this.description && this.description.length) parseDescXml(n, this.description);
    childParse(n, this, "method");
    childParse(n, this, "property");
    childParse(n, this, "used");
    childParse(n, this, "see");
}

oOther.prototype.toXml = function(pNode){
    var doc     = pNode.ownerDocument;
    
    var n = pNode.appendChild(doc.createElement(this.type))
    n.setAttribute("name", this.name);
    
    // set dataType
    if (this.type == "attribute") {
        if (this.dataType)
        n.setAttribute("type", this.dataType);
    }

    if (this.context && this.context.context && this.context.context.name == "o3")
        n.setAttribute("context", "o3");

    if (this.description && this.description.length) parseDescXml(n, this.description);

    if (this.type == "binding") {
        childParse(n, this, "attribute");
    }
    childParse(n, this, "used");
    childParse(n, this, "see");
}

function childParse(pNode, parent, type, container) {
    if (type == "method" || type == "property") {
        for (var name in parent[type]) {
            parent[type][name].toXml(pNode);
        }
        //return;
    }
    var doc     = pNode.ownerDocument;
    if (!parent[type])
        return;
        
    var list2;
    if (container)
        list2 = parent[type][container];
    else
        list2 = parent[type];
    if (list2) {
        for (var i = 0, l = list2.length; i<l; i++) {
            var c = list2[i];

            // ignore private methods
            if (type == "method" && (c.isPrivate || ["$", "_"].indexOf(c.name.charAt(0))) > -1) continue;

            if ((typeof c == "string" || !c.length) && type != "param")
                continue;
                
            var n = pNode.appendChild(doc.createElement(type))
            if (c.name) n.setAttribute("name", c.name);
            
            if (type == "used") {
                debugger;
                type = (c.elementNames) ? "element" : type; 
                n.setAttribute("filename", type + "." + c.name);
                
				//n.setAttribute("name", parent.context.name);
                //if (parent.context) n.setAttribute("filename", parent.context.type + "." + parent.context.name);
			}
			else if (type == "Example") {
				n.appendChild(doc.createTextNode(c.description));
			}
			else {
				var tp = (type == "return") ? parent[type].type : c.dataType;
				if (tp)
					n.setAttribute("type", tp);
				if (!c.optional && type != "return")
					n.setAttribute("required", "true");
				if (c.description && c.description.length) { 
					parseDescXml(n, c.description);
                }
            }
            
        }
    }
}
