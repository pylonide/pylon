/**
 * @author Linh Nguyen
 */

// globals
var docTree = null;
var comments = [];
var nonParsedComments = [];

// init
var docparser = {
    outputXml       : false,
    outputHtml      : false,
    outputNav       : false,
    outputPropedit  : false,
    outputXmlSchema : false
};

//apf.onload = function() {
    docparser.generate = function(srcString, outputPathObj) {
        if (!this.outputXml && !this.outputHtml && !this.outputNav && !this.outputPropedit && !this.outputXmlSchema) {
            alert("no output specified");
            return;
        }
        // html output requires xml output
        if (this.outputHtml)
            this.outputXml = true;

        if (!docTree) {
            docTree = {
                "class":    {},
                baseclass:  {},
                property:   {},
                element:    {},
                object:     {},
                method:     {},
                namespaces: {}, //name: http://xxxx
                term:       [], // array of objects {name: description: }
                trash:      [],
                used:       {},
                defines :   {}
            };
            
            // read .js file
            var http = new apf.http();
            
            // parse content of file
            //file:///C:/development/javeline/docparser/o3docs.js
            //file:///C:/development/javeline/docparser/apf_genapi_debug.js
            //file:///C:/development/javeline/docparser/apf_debug.js
            
            var content = srcString || "file:///C:/development/javeline/docparser/apf_debug.js";
            http.get(content, {
                callback: function(str){
                    // get parsed tree
                    var t = JsParser.parse(str).tree;

                    var ignore = {6:1, "var":1}; // 7:1, 
                    var ignorePar = {"Date": 1, "Function": 1, "Array": 1, "Number": 1, "RegExp": 1, "String": 1, "Object": 1, "Boolean": 1};
                    
                    for (var o, name, i = 0, j, l = t.length; i < l; i += 3) {
                        if (ignore[t[i]])
                            continue;

                        // comment /** **/
                        if (t[i] == 7 && t[i + 2].substr(0, 3) == "/**") {
                            comments.push(t[i + 2]);
                        }
                        
                        // Methods, Classes, Baseclasses
                        // xx = function
                        // apf.xx.prototype.xx = function(){
                        else if (t[i + 2] == "function" && t[i - 1] == "=") {
                            if (t[i-7].indexOf(".propHandlers") == -1)
                                addFunc(t, i, docTree, docTree, t[i + 8]);
                            else {
                                o = getContext(docTree, t[i - 7]);
                                o.parseCode(t[i + 8]);
                            }
                        }
                        
                        // global functions
                        // function xxx
                        else if (t[i + 2] == "function" && t[i + 3] == 5) {
                            // add global function to docTree
                            addMethodTo(t, i, docTree, t[i + 11], t[i + 5]);
                        }
                        
                        // xx.prototype = yy.prototype
                        else if (t[i + 2].indexOf(".prototype") == t[i + 2].length - ".prototype".length && 
                                 t[i - 1] == "=" && 
                                 t[i - 4].indexOf(".prototype") == t[i - 4].length - ".prototype".length) {
                            
                            name = (t[i - 9] == 2) ? t[i - 10] + t[i - 7][2] + t[i - 7][5] + t[i - 7][8] : t[i - 4];
                            o = getContext(docTree, name);
                            var descObj;
                            if (o.description) descObj = o;
                            var check = i - 1;

                            while (t[check] == "=") {
                                check += 6;
                                if (!descObj) {
                                    var obj = getContext(docTree, t[check-3]);
                                    if (obj && obj.description)
                                        descObj = obj;
                                }
                            }
                            check -= 3;

                            var source = getContext(docTree, t[check]);
                            o.copyFrom(source);
                            if (descObj && o != descObj) {
                                o.setDescription(descObj);
                                
                                // set desc for last object
                                var lastObj = getContext(docTree, t[check]);
                                if (o != lastObj)
                                    lastObj.setDescription(descObj)
                            }
                            if (o.type == "method") 
                                o.moveTo("class");
                        }
                        
                        // xx = 
                        else if (t[i + 2] == "=" && t[i + 5] != "function") {
                            // xx = (
                            // xx = {
                            if (t[i + 3] == 2) {
                                j = loopToNextChild(t[i+5], 0);
                                
                                // xx = (function
                                if (t[i + 5][j + 2] == "(" && t[i + 5][j + 5] == "function") {
                                    addFunc(t, i + 3, docTree, docTree, t[i + 5][11]);
                                }
                                
                                // xx = {}
                                // xx.prototype = {}
                                // xx.prototype.methodName = {}
                                // apf.GuiElement.propHandlers = {}
                                else if (t[i + 5][j + 2] == "{") {
                                    // if prototype has ".prototype" in name
                                    if (t[i - 1].indexOf(".prototype") > -1) {
                                        name = t[i - 1];
                                        o = getContext(docTree, name);

                                        if (o.type == "method") 
                                            o.moveTo("class");
                                        o.parseCode(t[i + 5]);
                                    }
                                    
                                    else {
                                        // if object already exists add to existing object
                                        if (docTree.object[t[i-4]]) {
                                            updObj(t, i + 3, docTree.object[t[i-4]], t[i + 5]);
                                        }                            
                                        else if (t[i-1] == "apf.GuiElement.propHandlers") {
                                            o = docTree.baseclass["apf.GuiElement"];
                                            o.parseCode(t[i + 5]);
                                        }
                                        //else create new object
                                        else {
                                            addObj(t, i + 3, docTree, docTree, t[i + 5]);
                                        }
                                    }
                                }
                            }
                            
                            //xx = apf.extend({})
                            else if (t[i + 5] == "apf.extend" && t[i + 6] == 2) {
                                j = loopToNextChild(t[i + 8], 0);
                                
                                if (t[i + 8][j + 3] == 2) {
                                    o = addObj(t, i + 3, docTree, docTree, t[i + 8][j + 5]);
                                    
                                    // xx = apf.extend({}, apf.xx);
                                    if (t[i + 8][j + 9] && t[i + 8][j + 9] == 5) {
                                        var source = getContext(docTree, t[i + 8][j + 11]);
                                        
                                        if (source) {
                                            o.copyFrom(source);
                                        }
                                        else {
                                            docTree.trash.noContext.push(t[i + 8][j + 11]);
                                        }
                                    }
                                }
                            }
                            
                            // xx.prototype = new
                            // if name ends with ".prototype"
                            else if (t[i - 1].indexOf(".prototype") > -1 && t[i - 1].indexOf(".prototype") == t[i - 1].length - 10 && t[i + 5] == "new") {
                                name = t[i - 1].substr(0, t[i - 1].length - ".prototype".length);
                                o = getContext(docTree, name);

                                // xxx.prototype = new apf.Class()
                                if (t[i + 6] == 5) {
                                    var prototypeName = (typeof t[i + 8] == "string") ? t[i + 8] : "";

                                    if (o) {
                                        if (o.type == "method") {
                                            o.moveTo("class");
                                        }
                                        if (prototypeName.indexOf("apf.") > -1) 
                                            o.prototype = prototypeName;
                                    }
                                    else {
                                        throw new Error("class " + name + " does not exist or is not parsed yet.");
                                    }
                                }
                                
                                // xxx.prototype = new(function() {
                                else if (t[i + 6] == 2 && t[i + 8][2] == "(" && t[i + 8][5] == "function") {
                                    // class already exist, just parse
                                    if (o.type == "method") 
                                        o.moveTo("class");
                                    
                                    o.parseCode(t[i + 8][11], true);
                                }
                            }

                            // apf.xx.prototype.property = "xxx";
                            else if (t[i - 1].indexOf(".prototype") > -1 && !ignorePar[t[i - 1].split(".")[0]] && t[i + 5].indexOf(".prototype") == -1) {
                                name = (t[i - 6] == 2) ? t[i - 7] + t[i - 4][2] + t[i - 4][5] + t[i - 4][8] : t[i - 1];
                                
                                o = getContext(docTree, name);
                                if (o.type == "method") 
                                    o.moveTo("class");
                                addPropTo(t, i - 3, o, name, t[i + 5]);
                            }
                            
                            // xx = new (function() {
                            else if (t[i + 5] == "new" && t[i + 6] == 2 && t[i + 8][5] == "function") {
                                // add and parse as function, but save as object
                                o = addFunc(t, i, docTree, docTree, t[i + 8][11]);
                                o.moveTo("object");
                            }

                        } 
                        
                        // }).call(x.prototype = new x());
                        else if (t[i] == 2 && t[i + 2][5] == "function" && t[i + 5] == ".call") {
                            name = t[i + 8][5].substr(0, t[i + 8][5].length - ".prototype".length);
                            o = docTree.method[name];

                            var prototypeName = (typeof t[i+8][14] == "string") ? t[i+8][14] : "";

                            if (o) {
                                // set prototype name
                                o.moveTo("class");
                            } else {
                                o = docTree["class"][name] || docTree.baseclass[name];
                            }

                            if (prototypeName.indexOf("apf.") > -1) 
                                o.prototype = prototypeName;

                            if (!o)
                                throw new Error("class " + name + " does not exist or is not parsed yet.");
                            
                            if (t[i+2][9] == 2) {
                                o.parseCode(t[i+2][11], true);
                            }
                        }
                        
                        // set namespace
                        //apf.setNamespace("http://ajax.org/2005/aml", apf.aml);
                        else if (t[i + 2].indexOf("setNamespace") > -1){
                            if (t[i + 5][11]) {
                                if (t[i + 5][11].indexOf(".") > -1)
                                    var namespace = t[i + 5][11].split(".").pop();
                                docTree.namespaces[namespace] = t[i + 5][5];
                                
                            }
                            
                            // reset comments
                            comments = [];
                        }
                        
                        // setElement()
                        else if (t[i + 2].indexOf(".setElement") > -1 && t[i + 3] == 2 && t[i + 5][2] == "(") {
                            if(t[i + 2].substr(0, 7) != "apf.aml") continue;
                            o = getContext(docTree, t[i + 5][11]);

                            name = (t[i + 5][5].charAt(0) == '"' && t[i + 5][5].charAt(t[i + 5][5].length - 1) == '"') ? t[i + 5][5].substr(1, t[i + 5][5].length - 2) : t[i + 5][5];
                            // ignore elements starting with @ like @default
                            if (name.charAt(0) == "@") continue;
                            
                            // context found
                            if (o) {
                                //var className = t[i + 2].substr(0, t[i + 2].length - ".setElement".length);
                                //className = (className.substr(0, 4) == "apf.") ? className.substr(4) : className;
                                
                                if (!o.elementNames) 
                                    o.elementNames = [];
                                o.elementNames.push(name);
                                
                                // element not created yet using @define
                                if (!docTree.element[name]) {
                                    docTree.element[name] = o.duplicateEl(name);
                                }
                                // add to existing element, element created using @define
                                else {
                                    docTree.element[name] = o.mergeWithEl(docTree.element[name]);
                                }
                            }

                            // reset comments
                            comments = [];
                        }
                    }

                    /*
                    // docTree before defines
                    debugger;
                    
                    // merge defines with elements
                    for (var elName in docTree.defines) {
                        for (var type in docTree.defines[elName]) {
                            // array or object
                            if (typeof docTree.defines[elName][type] == "object") {
                                // array
                                if (docTree.defines[elName][type].length && typeof docTree.defines[elName][type].length != "string") {
                                    if (!docTree.element[elName][type]) docTree.element[elName][type] = [];
            //                        docTree.element[elName][type] = docTree.element[elName][type].concat(docTree.defines[elName][type]);
                                    
                                    for (var di = 0, dl = docTree.defines[elName][type].length; di < dl; di++) {
                                        if (!docTree.defines[elName][type][di].name) continue;
                                        //if (elName == "input") debugger;
                                        //docTree.element[elName][type][docTree.element[elName][type].length] = docTree.defines[elName][type][di];
                                        
                                        // @todo if item already defined overwrite item
                                        var overwrite = false;
                                        for (var ei = 0, el = docTree.element[elName][type].length; ei < el; ei++) {
                                            if (docTree.element[elName][type][ei].name == docTree.defines[elName][type][di].name) {
                                                docTree.element[elName][type][ei] = docTree.defines[elName][type][di];
                                                overwrite = true;
                                                break;
                                            }
                                        }
                                        if (!overwrite)
                                            docTree.element[elName][type].push(docTree.defines[elName][type][di]);
                                    }
                                }
                                //object
                                else {
                                    if (!docTree.element[elName][type]) docTree.element[elName][type] = {};
                                    for (var i in docTree.defines[elName][type]) {
                                        if (!docTree.element[elName][type][i])
                                            docTree.element[elName][type][i] = docTree.defines[elName][type][i];
                                        else
                                            debugger;
                                    }
                                }
                            }
                            // value
                            else {
                                docTree.element[elName][type] = docTree.defines[elName][type];
                            }
                        }
                    }
                    */
                    // doctree generated, nothing parsed yet

                    apf.dispatchEvent("docgen_message", {message: "docTree generated..."});
                    
                    if (docparser.outputXml || docparser.outputHtml || docparser.outputNav)
                        parse_refguide_xml(docTree, outputPathObj);
                    if (docparser.outputPropedit || docparser.outputXmlSchema)
                        parse_xsd(docTree, outputPathObj);
                }
            });
        }
        else {
            apf.dispatchEvent("docgen_message", {message: "Using previously generated docTree..."});

            if (docparser.outputXml || docparser.outputHtml || docparser.outputNav)
                parse_refguide_xml(docTree, outputPathObj);
            if (docparser.outputPropedit || docparser.outputXmlSchema)
                parse_xsd(docTree, outputPathObj);

        }

        
        //apf.dispatchEvent("docgen_complete");
    };
//};

function getContext(docTree, str) {
    // if change ignorePar of parCheck also change in Base for setContext
    var ignorePar = {"Date": 1, "Function": 1, "Array": 1, "Number": 1, "RegExp": 1, "String": 1, "Object": 1, "Boolean": 1};
    var parCheck = ["baseclass", "class", "object", "method"];

    var naming = getName(str);
    var context = docTree;

    if (naming.parent && naming.parent.length) {
        // ignore if parent is namespace
        if (docTree.namespaces[naming.parent[0]]) {
            throw new Error("context is a namespace");
            return;
        }

        // object must have name and not in ignorePar array to be added to DocTree
        if (naming.name && !ignorePar[naming.parent[0]]) {
            // set context to parent
            for (var p = 0, pl = naming.parent.length; p < pl; p++) {
                for (var i = 0, l = parCheck.length; i < l; i++) {
                    if (context[parCheck[i]]) {
                        if (context[parCheck[i]][naming.parent[p]] || context[parCheck[i]][naming.namespace + "." + naming.parent[p]]) {
                            context = context[parCheck[i]][naming.parent[p]] || context[parCheck[i]][naming.namespace + "." + naming.parent[p]]
                        }
                    }
                }
            }
            if (context == docTree) {
                throw new Error(naming.parent.join(".") + " does not exist (yet).");
            }
        }
    } else {
        context = docTree.method[naming.fullname] || docTree["class"][naming.fullname] || docTree.baseclass[naming.fullname] || docTree.element[naming.name];  
    }
    
    if (!context) {
		if (!docTree.trash.noContext) docTree.trash.noContext = []
		docTree.trash.noContext.push(naming.fullname);
		//throw new Error("no context found");
	}
    
    return context;
};

function getName(str, obj) {
    // apf.xxx.xxx
    var words = str.split(".");

    // set apf namespace
    var namespace = (words[0] == "apf") ? words.shift() : "";

    var name;
    
    // ends with ".prototype"
    if (words.indexOf("prototype") == words.length - 1) {
        // @todo apf.AmlComment.prototype.serialize
        words.pop();
        name = words.pop();
    }
    
    // has .prototype
    else if (words.indexOf("prototype") > -1) {
        name = words.pop();
        words.pop();
        
    // no prototype
    } else {
        name = words.pop();
    }

    if (!name) {
        name = namespace;
        namespace = null;
    } else {
        var parent = words;
        if (parent.length)
            var fullname = (namespace) ? namespace + "." + parent.join(".") + "." + name : name;
        else
            var fullname = (namespace) ? namespace + "." + name : name;
    }

    if (obj) {
        obj.name = name;
        obj.namespace = namespace;
        obj.parent = (parent) ? parent : null;
        obj.fullname = (fullname) ? fullname : name;
    } else {
        return {
            name: name,
            namespace: namespace,
            parent: (parent) ? parent : null,
            fullname: (fullname) ? fullname : name,
        }
    }
}

// add new function
// class, baseclass, method
function addFunc(t, i, docTree, context, code, apf) {
    var o = new oFunc(t, i, context);

    if (apf) o.namespace = "apf";

    // get name, clone object
    if (!o.process(t, i))
        return;

    o.setContext(docTree);

    // add to docTree, don't add to class (constructors)
    if (o.context) { // && o.context.type != "class") {
        if (!o.context.method) o.context.method = {};
        if (o.context == docTree)
            o.context.method[o.fullname] = o;
        else
            o.context.method[o.name] = o;
    } else {
        docTree.trash[o.fullname] = o;
        return;
    }

    if (!o.cloneList)
	   o.parseComment(true);

    // parse code
    o.parseCode(code);

    // creates clones
    if (o.cloneList)
        o.clone();

    return o;
}

// add new object
// params: t: tree, i: tree line, docTree, parseTree: line to parse, apf: object of apf 
function addObj(t, i, docTree, context, code, apf) {
    var o = new oObject(t, i, context);
	
    if (apf) o.namespace = "apf";
    
    // get name, clone object
    if (!o.process(t, i))
        return

    // get correct context
    o.setContext(docTree);

	// check if object is private
    if (o.name && o.name.charAt(0) == "$") o.isPrivate = true;
	
    // add to docTree
    if (o.context) {//} && o.context.type != "class") {
        if (!o.context.object) o.context.object = {};
        if (o.context == docTree)
            o.context.object[o.fullname] = o;
        else
            o.context.object[o.name] = o;
    } else {
        docTree.trash[o.fullname] = o;
        return;
    }

    if (!o.cloneList)
	   o.parseComment(true);

    // parse code
    o.parseCode(code);
    
    // creates clones
    if (o.cloneList)
        o.clone();

    return o;
}

// update existing object
// params: t: tree, i: tree line, docTree, parseTree: line to parse, apf: object of apf 
function updObj(t, i, o, code) {
    // get name, clone object
    if (!o.process(t, i))
        return
    
    if (!o.cloneList)
       o.parseComment(true);

    // parse code
    o.parseCode(code);
    
    // creates clones
    if (o.cloneList)
        o.clone();

    return o;
}
// add new property to given context
function addPropTo(t, i, context, nameStr, value) {
    var o = new oProperty(t, i, context);

	o.context = context;
    
    var naming = getName(nameStr, o);
    o.value = (value.charAt(0) == '"' && value.charAt(value.length - 1) == '"') ? value.substr(1, value.length - 2): value;

	// check if property is private
    if (o.name.charAt(0) == "$") o.isPrivate = true;

    if (!o.context.property) o.context.property = {};
    if (o.context == docTree)
        o.context.property[o.fullname] = o;
    else
        o.context.property[o.name] = o;

    o.parseComment();
    
    return o;
}

// add method to given context
function addMethodTo(t, i, context, code, name){
	var o = new oFunc(t, i, context);
	
	o.context = context;
	o.name = name;
	o.filename = context.filename;
    
    // add used if context is not docTree
    if (context.name) { 
        if (!o.used) o.used = [];
        o.used.push(context.type + "." + context.name);
    }
    
	// check if function is private
    if (o.name.charAt(0) == "$") o.isPrivate = true;

    if (!o.context.method) o.context.method = {};
    o.context.method[o.name] = o;
	
	o.parseComment();
	o.parseCode(code);
}

// add object to given context
function addObjTo(t, i, context, code, name){
	var o = new oObject(t, i, context);
	
	o.context = context;
	o.name = name;
	
	// check if function is private
    if (o.name.charAt(0) == "$") o.isPrivate = true;

    if (!o.context.object) o.context.object = {};
    o.context.object[o.name] = o;
	
	o.parseComment();
	o.parseCode(code);
}


/*
 * helper methods
 */
function loopToNextChild(t, j) {
    for (var i = j, l = t.length; i < l; i += 3) {
        if (t[i] != 6 && t[i] != 7)
            break;
    }
    return i;
}

function loopToPrevChild(t, j) {
    for (var i = j, l = t.length; i > l; i -= 3) {
        if (t[i] != 6 && t[i] != 7)
            break;
    }
    return i;
}

function splitCommentLine(l, n, keepCurly) {
    var values = [];
	if (l.indexOf(" ") > -1) {
		for (var sPos, i = 0; i < n; i++) {
			l = l.trim();
			
			sPos = (i < n - 1) ? l.indexOf(' ') : l.length;
			var value = l.substr(0, sPos);
            
            if (!keepCurly) {
                // starts with { so also have to end on }
                if (value.charAt(0) == "{") {
                    sPos = l.indexOf('}') + 1;
                    value = l.substr(1, sPos - 2);
                }
            }
			if (value) 
				values.push(value);
			l = l.substr(sPos);
		}
	}
	else {
		values.push(l);
	}
	
    return values;
}