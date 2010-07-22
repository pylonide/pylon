// base class
function Base() {
    this.isPrivate = false;
    
    this.$init = function(){
        this.cloned = [this];
    }
    
    this.moveTo = function(newtype) {
        for (var i = 0; i < this.cloned.length; i++) {
            delete docTree[this.type][this.cloned[i].fullname];
            docTree[newtype][this.cloned[i].fullname] = this.cloned[i];
            
            /*
            for (var name in this.used) {
                if (name.indexOf(".") > -1) {
                    if (name.replace(name.split(".")[0], newtype) != name) {
						var newname = this.used[name.replace(name.split(".")[0], newtype)];
						if (!this.used[newname]) this.used[newname] = [];
                        this.used[newname].push(this.used[name]);
                        delete this.used[name];
                    }
                }
            }
            */
            if (this.inherits && this.inherits.length) {
               for (var j = 0, jl = this.inherits.length; j < jl; j++) {
                    //var ctx = getContext(docTree, this.inherits[j]);
                    var className = getName(this.inherits[j]).name;
                    if (newtype != this.type) {
                        docTree.used[className][newtype + "." + this.name] = this.name;
                        delete docTree.used[className][this.type + "." + this.name];
                    }
                }                   
            }
        }
        this.type = newtype;
    }
    
    this.clone = function() {
        if (this.commentList) {
            this.numComments = this.commentList[this.name];
            this.parseComment();
        }

        for (var nf, n, i = 0, l = this.cloneList.length; i < l; i++) {
            nf = function(){};
            nf.prototype = this;
            
            n = new nf();
            
            n.name = this.cloneList.shift();
            if (this.commentList) {
                n.numComments = this.commentList[n.name];
            }
            n.parseComment();
             
            if (this.parent) {
                n.fullname = this.namespace + "." + this.parent.join(".") + "." + n.name;
            } else {
                n.fullname = this.namespace + "." + n.name;
            }
            
            if (n.name.charAt(0) == "$")
                n.isPrivate = true;
            
            /*
            if (this.comment) {
                n.comment = this.comment;
                n.parseComment();
            }
            */
            this.cloned.push(n);
           
            if (this.context == docTree)
                this.context[this.type][this.fullname.replace(this.name, n.name)] = n;
            else
                this.context[this.type][n.name] = n;
           
            if (this.inherits && this.inherits.length) {
                for (var j = 0, l = this.inherits.length; j < l; j++) {
					//Find baseclass by name??
                    var baseclass = getName(this.inherits[j]).parent[0];
					
					//Add string to used hash: .used[this.type + "." + this.name] = this;
					//n.used.push[this.type + "." + this.name] = this;
                    n.used.push(this.name);
                }
            }
            
            //return n;
        }
    };
    
    this.duplicateEl = function(newname) {
        var nf = function(){};
        nf.prototype = this;

        var n = new nf();

        n.name = newname;
        n.type = "element";
        n.fullname = this.fullname.replace(this.name, newname);
        
        return n;
    }
    
    this.mergeWithEl = function(elObj) {
        var newObj = this.duplicateEl(elObj.name);
        
        for (var type in elObj) {
            if (type == "Methods") continue;
            
            if (typeof elObj[type] == "string") {
                newObj[type] = elObj[type];
            }
            else if (typeof elObj[type] == "object") {
                // if not exist set array or object
                if (!newObj[type]) { 
                    newObj[type] = elObj[type];
                }
                
                // if already exist merge with existing array / object
                else {
                    //array
                    if (elObj[type].length && elObj[type][0]) {
                        newObj[type] = [];
                        for (var i = 0, l = elObj[type].length; i < l; i++) {
                            // ignore duplicates
                            for (var j = 0, jl = newObj[type].length; j < jl; j++) {
                                if (type != "description" && newObj[type][j].name == elObj[type].name) continue;
                            }
                            newObj[type].push(elObj[type][i]);
                        }
                    }
                    // object
                    else {
                        newObj[type] = {};
                        for (var name in elObj[type]) {
                            if (!newObj[type][name])
                                newObj[type][name] = elObj[type][name];
                        }
                    }
                }
            }
        }
        return newObj;
    }
    
    // find name
    // determine context (parent)
    this.process = function(t, j) {
		for (var lastStr, chkStr, naming, i = j - 3; i >= 0; i -= 3) {
            if (t[i] == 6 || t[i] == 7 || t[i + 2] == "=" || t[i + 2] == ":" || t[i + 2] == "(" || t[i + 2] == "var") { //Newline, Comment, =, : and ( are ignored
                if (this.name && t[i] == 7 && t[i+5] != "=" && t[i-1] != "=") {
                    break;
                }
                continue;
            }

            // word (name of function)
            else if (t[i] == 5) {
                // if no name found yet, first check
                if (!this.name) {
                    lastStr = t[i+2];
                    chkStr = (this.namespace) ? this.namespace + "." + lastStr : lastStr;  
                    getName(chkStr, this);
                }

                // name found, check for aliases
                // xxx = xxx = xxx = function()
                // else next name must be followed by = character and previous found name
                else if (t[i + 5] == "=" && (t[i + 8] == lastStr || t[i + 6] == 7 && t[i + 11] == lastStr) && lastStr.substr(0, 3) != "/**") {
                    var curStr = t[i+2];
                    chkStr = (this.namespace && lastStr.indexOf(this.namespace) != 0) ? this.namespace + "." + curStr : curStr;
                    if (!this.cloneList) this.cloneList = [];
                    var cloneName = getName(chkStr).name;
                    // @todo retrieve comment
                    this.cloneList.push(cloneName);
                    
                    if (!this.commentList) this.commentList = {};
                    for (var j = i+3, numComm = 0, jl = t.length; j < jl; j += 3) {
                        if (t[j] == 7 && t[j + 2].substr(0, 3) == "/**") {
                            numComm++;
                        }
                            
                        if (t[j + 2] == lastStr) {
                            break;
                        }
                            
                    }

                    this.commentList[this.name] = numComm;

                    for (var j = i-3, numComm = 0; j > 0; j -= 3) {
                        if (t[j] == 7 && t[j + 2].substr(0, 3) == "/**") {
                            numComm++;
                        }
                        else {
                            break;
                        }
                    }
                    this.commentList[cloneName] = numComm;
                    
                    lastStr = curStr;
                }
            }
            
            // xx["xx"]
            else if (t[i] == 2) {
                if (t[i+2][2] == "[" && t[i+2][8] == "]") {
                    this.name = t[i+2][5];
                    //this.name = (t[i+2][5].charAt(0) == '"') ? t[i+2][5].substr(1) : t[i+2][5];
                    //this.name = (this.name.charAt(this.name.length-1) == '"') ? this.name.substr(0, this.name.length-1) : this.name;
                    lastStr = t[i-1];
                    this.fullname = t[i-1] + "[" + this.name + "]";
                    
                    words = (t[i-3] == 5) ? t[i-1].split(".") : null;

                    // set apf namespace
                    if (words[0] == "apf")
                        this.namespace = words.shift();
                    
                    if (words.length)
                        this.parent = words;
                }
            }
            
			else {
                break;
            }
        };

        // search for filename
        // /*FILEHEAD(/var/lib/apf/genapi/core/markup/aml/element.js)SIZE(17957)TIME(1256034097)*/
        for (var k = i; k >= 0; k -= 3) {
            var fPos = t[k + 2].indexOf("/*FILEHEAD(");
            if (t[k] == 7 && fPos == 0) {
                this.filename = t[k + 2].substr("/*FILEHEAD(".length)
                this.filename = this.filename.substr(0, this.filename.indexOf(")"));
                return true;
            }
        }
        
        //if (!this.filename)
            //debugger;
        return true;
    };

    var ignorePar = {"Date": 1, "Function": 1, "Array": 1, "Number": 1, "RegExp": 1, "String": 1, "Object": 1, "Boolean": 1};
    var parCheck = ["baseclass", "class", "object", "method"];
    this.setContext = function(docTree) {
        if (this.parent && this.parent.length) {
            // ignore if parent is namespace
            if (docTree.namespaces[this.parent[0]]) {
                this.namespace += "." + this.parent[0];
                this.fullname = (this.name) ? this.parent.join(".") + "." + this.name : "no name found"; 
                this.context = null;
                return;
            }
    
            // object must have name and not in ignorePar array to be added to DocTree
            if (this.name && !ignorePar[this.parent[0]]) {
                // set context to parent
                for (var p = 0, pl = this.parent.length; p < pl; p++) {
                    for (var i = 0, l = parCheck.length; i < l; i++) {
                        if (this.context[parCheck[i]]) {
                            if (this.context[parCheck[i]][this.parent[p]] || this.context[parCheck[i]][[this.namespace, this.parent[p]].join(".")]) {
                                this.context = this.context[parCheck[i]][this.parent[p]] || this.context[parCheck[i]][[this.namespace, this.parent[p]].join(".")]
                            }
                        }
                    }
                }
                
                if (this.context == docTree) {
                    throw new Error(this.parent.join(".") + " does not exist (yet).");
                }
            }
            
            // don't add to docTree
            else {
                this.fullname = (this.name) ? this.parent.join(".") + "." + this.name : "no name found";
                this.context = null;
                return;
            }
        }
    };
    
    this.parseCode = function(t, prototype) {
        if (!t)
            return;
            
        for (var o, name, value, i = 0, l = t.length; i < l; i += 3) {
            o = null;
            name = null;

            // check for comments first
            if (t[i] == 7 && t[i + 2].trim().substr(0, 3) == "/**" && t[i + 2].trim().charAt(3) != "*") {
                //if (!this.codeComments) this.codeComments = [];
                comments.push(t[i + 2]);
            }

            // check for :
            else if (this.type == "object" && t[i + 2] == ":") {
                if (typeof t[i - 1] == "string")
                    name = t[i-1].charAt(0) == '"' && t[i-1].charAt(t[i-1].length - 1) == '"' ? t[i - 1].substr(1, t[i-1].length - 2) : t[i-1];

                // check for objects
                if (t[i + 3] == 2) {
                    // starts with { of [
                    if (t[i + 5][2] == "{" || t[i + 5][2] == "[") {
                        
                        // object of apf
                        if (this.name == "apf") {
                            addObj(t, i + 3, docTree, docTree, t[i + 5], true);
                        }
                            
                        else {
                            if (name)
                                addObjTo(t, i + 3, this, t[i + 5], name);
                        }
                    }
                }
            
                
                // check for functions
                else if (t[i + 5] == "function") {

                    // methods of apf
                    if (this.name == "apf") {
                        addFunc(t, i + 3, docTree, docTree, t[i + 11], true);
                    }
                    
                    else {
                        if (name)
                            addMethodTo(t, i + 3, this, t[i + 11], name);
                    }
                }
                
                // property found
                else if (typeof t[i + 5] == "string") {
                    value = t[i + 5];
                    addPropTo(t, i, this, name, value);
                }
            
            
            // check for "this."
            } else if (t[i] == 5 && t[i + 2].indexOf("this.") > -1 && t[i + 5] == "=") {
                name = t[i + 2].substr(5);
                value = t[i + 8];
                
                // function
                if (value == "function" && t[i + 9] == 2) {
                    addMethodTo(t, i, this, t[i + 11], name);
                }
                
				// object
				else if (t[i + 6] == 2 && t[i + 8][2] == "{") {
					addObjTo(t, i, this, t[i + 8], name);
				}
				
                // word
                else {
                    // value is object
                    if (t[i + 6] == 2) {
                        for (var valueArr = [], v = 2, vl = t[i + 8].length; v < vl; v += 3) {
                            valueArr.push(value[v]);
                        }
                        value = valueArr.join("");
                    }

                    addPropTo(t, i, this, name, value);
					// if this.$regbase property exist, move method to baseclass
                    if (name.substr(0, 8) == "$regbase") {
                        if (this.type != "baseclass") this.moveTo("baseclass");
                    }
                }
            }
			
            // check only is code not prototype
            // this.$init(true
            // this.$init(function
            // move to baseclass
            else if (!prototype && t[i + 2].indexOf("this.$init") > -1 && (t[i + 5][5] == 'true' || t[i + 5][5] == 'function')) {
                if (this.type != 'baseclass' && !this.prototype) this.moveTo('baseclass');
            }
        }

        if (comments.length) 
            this.parseRemainingComments();
        
        // reset comments if no clones are available
        if (!this.cloneList)
            comments = [];
    };
    
    // parse comments that hasn't been parsed yet
    this.parseRemainingComments = function() {
        // get context
        var context = this;
        while (context && context.context != docTree) {
            context = context.context;
        }
        /*
         * "private", "attribute", "todo", "constructor", "param", "return", "inherits", "type", "see", "event", "term"
         */
        var validKey = {"attribute": 1, "event": 1, "inherits": 1, "term": 1};
        // loop through comments
        for (var c = 0, cl = comments.length; c < cl; c++) {

            // prepare comment lines
            var lines = comments[c].split(/\n+/);
            
            // strip from starting * characters
            for (var i = 0, l = lines.length; i < l; i++) {
                lines[i] = lines[i].trim();
                
                if (lines[i].substr(0, 2) == '* ') {
                    lines[i] = lines[i].substr(2);
                } else if (lines[i].charAt(0) == '*')
                    lines[i] = lines[i].substr(1);
            }
            
            // loop through lines
            for (var o, description = [], name, keyword, values, i = 0, l = lines.length; i < l; i++) {
                line = lines[i];

                // ignore lines with /** and **/
                if (line.substr(0, 3) == "/**" || line.substr(0, 3) == "**/")
                    continue;
                
                //search for keyword (starts with @)
                if (line.charAt(0) == "@") {
                    keyword = (line.indexOf(" ") > -1) ? line.substr(1, line.indexOf(" ") - 1) : line.substr(1);
                    line = line.substr(keyword.length + 1).trim();
                    
                    // keyword found that does not need parsing
                    if (!validKey[keyword])
                        continue;
                    
                    // parse keywords
                    if (keyword == "attribute") {
                        o = new oOther(this.parsePos[0], this.parsePos[1], context, keyword);
                        values = splitCommentLine(line, 3);
                        
                        var type = values[0];
                        name = (values[1]) ? values[1] : "";
                        
                        if (!name) {
                            name = values[0];
                            type = null;
                        }

                        if (type) o.dataType = type;
                        
                        if (name) {
                            if (name && name.charAt(0) == "[") {
                                name = name.substr(1, name.length - 2);
                                o.optional = true;
                            }
                            else if (name && name.charAt(0) == "!") {
                                name = name.substr(1, name.length - 1);
                                o.readonly = true;
                            }

                            o.name = name;
                        } 
    
                        // description
                        if (values[2]) {
                            var d = this.getDescription(lines, i, values[2]);
                            i = d.i;
                            
                            if (!o.description) o.description = [];
                            o.description = o.description.concat(this.parseDescription(d.description));
                        }
                        
                        if (!o.attrinfo) o.attrinfo = {};
                        o.attrinfo["context"] = "";
                    }

                    // attrinfo
                    else if (keyword == "attrinfo") {
                        if (o.type == "attribute") {
                            values = splitCommentLine(line, 2);
                            if (values.length == 2) {
                                o.attrinfo["context"] = values[0];
                                o.attrinfo["editor"] = values[1];
                            }
                            else {
                                //debugger;
                            }
                        }
                        else {
                            //debugger;
                        }
                    }
                    
                    // default
                    else if (keyword == "default") {
                        if (o.type == "attribute") {
                            o["default"] = line;
                        }
                        else {
                            //debugger;
                        }                    
                    }
                    
                    else if (keyword == "event") {
                        o = new oOther(this.parsePos[0], this.parsePos[1], context, keyword);
                        values = splitCommentLine(line, 2);
    
                        o.name = values[0];

                        // description
                        if (values[1]) {
                            var d = this.getDescription(lines, i, values[1]);
                            i = d.i;
                            
                            if (!o.description) o.description = [];
                            o.description = o.description.concat(this.parseDescription(d.description));
                        }
                    }
                    
                    else if (keyword == "inherits") {
                        name = getName(line).name;
                        if (!docTree.used[name]) docTree.used[name] = {};
                        docTree.used[name][context.type + "." + context.name] = context.name;
                    
                        if (!context[keyword]) context[keyword] = [];
                    
                        if (context[keyword].indexOf(line) == -1) {
                           context[keyword] = context[keyword].concat(line.splitSafe(","));
                        }
                    }

                    else if (keyword == "term") {
                        var values = splitCommentLine(line, 2, true);
//                        if (values[0] == "binding") debugger;
 
                        var termDesc = (values[1]) ? [values[1]] : [];

                        if (lines[i+1]) {
                            i++;
                            while ((lines[i] || lines[i] === "") && lines[i].trim().charAt(0) != "@" && lines[i].trim() != "/**") {
                                if (lines[i] != "/**" && lines[i] != "/")
                                    termDesc.push(lines[i]);
                                i++;
                            }

                            docTree.term.push({name: values[0], description: this.parseDescription(termDesc)});
                        } 
                        i--;
                    }
                        
                    else {
                        continue;
                    }
                    
                    if (o)
                        o.store(context);
                }
            }
        }

        // reset comments
        comments = [];
    }
    
    // parse comment
    this.parseComment = function(multiComments, first) {
		// if no comment nothing to parse
        if (!comments.length) {
			return;
        }

        // has aliases 
        if (this.numComments) {
            this.comment = comments.slice(-this.numComments).join("\n");
        } else {
            if (multiComments) {
                this.comment = comments.join("\n");
                comments = [];
            } else {
                if (!first){
                    this.comment = comments.pop();
//                    nonParsedComments = nonParsedComments.concat(comments);
                }
                else {
                    this.comment = comments.shift();
//                    nonParsedComments = nonParsedComments.concat(comments);
                }
                
                // parse remaining comments
                if (comments.length) {
                    this.parseRemainingComments();
                }
            }
        }
        
		// prepare comment
		var lines = this.comment.split(/\n+/);
		
		// strip from starting * characters
		for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].trim();
            
            if (lines[i].substr(0, 2) == '* ') {
                lines[i] = lines[i].substr(2);
            } else if (lines[i].charAt(0) == '*')
                lines[i] = lines[i].substr(1);
        }
		
		/*
		var keywords = {"author", "version", "url", "event", "default_private", "type", "see", "private", 
						"param", "return", "constructor", "inherits", "since", "returns", "baseclass", 
						"term", "method", "parser", "define", "attribute", "addnode", "allownode", "todo", 
						"todo:", "experimental", "apfclass", "namespace", "class", "allowchild", "link", 
						"deprecated", "result", "throw", "fileoverview", "throws", "for", "macro", 
						"extends", "bug", "binding", "note", "example", "action", "ignore", 
						"classDescription", "alias", "notimplemented", "ref", "addenum", "default",
                        "group_caption"};
		*/

		// loop through comment lines
		var defines = [this], lastContext;
        var description = [];
		for (var defineMode = false, objs = [this], name, keyword, values, i = 0; i < lines.length; i++) {
			line = lines[i];

            // ignore lines with /** and **/
            if (line.trim().substr(0, 3) == "/**" || line.trim().substr(0, 3) == "**/" || line == "/") {
                continue;
			}

			//search for keyword (starts with @)
			if (line.charAt(0) == "@") {
				// save description
                if (description.length) {
                    // parse and save description
                    for (var o, oi = 0, ol = objs.length; oi < ol; oi++) {
                        o = objs[oi]
                        if (!o.description) o.description = [];
                        
                        if (defineMode && !(description.length == 1 && description[0] == "")) {
                            addDefine(o.name, "description", this.parseDescription(description));
                        }
                        else {
                            o.description = o.description.concat(this.parseDescription(description));
                        }
                    }
                    description = [];
                }
                
                keyword = (line.indexOf(" ") > -1) ? line.substr(1, line.indexOf(" ") - 1) : line.substr(1);
				line = line.substr(keyword.length + 1).trim();
				
				// define(s)
				if (keyword == "define") {
                    defineMode = true;
                    values = splitCommentLine(line, 2);

                    // array with defineNames
                    var defineNames = [];
                    if (values[0].charAt(values[0].length-1) != ",")
                        defineNames = [values[0]]
                    else
                        defineNames = line.split(",");
                    defines = [], objs = [];
                    for (var define, di = 0, dl = defineNames.length; di < dl; di++) {
                        name = defineNames[di].trim();
                        // if element exist change context to element, else create copy from current context
                        define = o = docTree.element[name] || (docTree.element[name] = this.duplicateEl(name)) ;//(name == this.name) ? this : 
    
                        // description
                        if (defineNames.length == 1 && values[1]) {
                            var d = this.getDescription(lines, i, values[1]);
                            i = d.i;
                            
                            if (d.description)
                                addDefine(define.name, "description", this.parseDescription(d.description));
                        }
                        
                        defines.push(define);
                        objs.push(o);
                        
                        if (define.description) {
                            // add to docTree/define object
                        }

                    }

					continue;
				}
				
				// see
				else if (keyword == "see") {
					var ctx = (this.context.see) ? this.context : this;
					
					if (!ctx.see) 
						ctx.see = [];
					ctx.see = ctx.see.concat(line.splitSafe(","));
					ctx.see.used = ctx.element + "." + ctx.name;
					continue;
				}
				
				// inherits
				// allowchild
				// addnode
				else if (["inherits", "allowchild", "addnode"].indexOf(keyword) > -1) {
					if (keyword == "inherits") {
                        
                        /*
						if (!this.used) this.used = {};
                        
                        var inhContext = getContext(docTree, line);
                        if (!inhContext) {
                            throw new Error((this.fullname || this.name) + " inherits from " + line + ", but this class doesn't exist (yet).")
                        } else {
                            if (!inhContext.used) inhContext.used = {};
                            inhContext.used[this.type + "." + this.name] = this;
                        }
                        */
                       
                        name = getName(line).name;
                        if (!docTree.used[name]) docTree.used[name] = {};
                        docTree.used[name][this.type + "." + this.name] = this.name;
					}
					
					// rename addnode to nodegroup for storage
					else if (keyword == "addnode") {
						keyword = "nodegroup";
					}
					
                    for (var define, di = 0, dl = defines.length; di < dl; di++) {
                        define = defines[di];
                        
                        if (!define[keyword]) define[keyword] = [];
                        
                        if (define[keyword].indexOf(line) == -1) {
                           define[keyword] = define[keyword].concat(line.splitSafe(","));
                        }
                    }
                    objs = defines;
                    
					continue;
				}
				
				// return
				else if (["return", "returns"].indexOf(keyword) > -1) {
					values = splitCommentLine(line, 2);
                    if (values[1]) {
                        var d = this.getDescription(lines, i, values[1]);
                        i = d.i;
                    }
                    
                    for (var define, di = 0, dl = defines.length; di < dl; di++) {
                        define = defines[di];
                        
    					define["return"] = {
                            type: values[0],
                            description: (d) ? this.parseDescription(d.description) : ""
                        };
                    }
                    
                    continue;
				}
				
				// experimental
				else if (keyword == "experimental") {
                    for (var o, oi = 0, ol = objs.length; oi < ol; oi++) {
                        o = objs[oi];

    					o.experimental = true;
                    }
					continue;
				}
				
				// baseclass
				else if (keyword == "baseclass") {
                    if (this.type != "baseclass") this.moveTo("baseclass");
                    continue;
                } 
				
				// private
				// todo
				else if (["private", "todo", "todo:"].indexOf(keyword) > -1) {
                    for (var o, oi = 0, ol = objs.length; oi < ol; oi++) {
                        o = objs[oi]

                        if (keyword == "private")
                            o.isPrivate = true;

    					o[keyword] = line;
                    }
					continue;
				}
				
                // constructor
                else if (keyword == "constructor") {
                    if (this.type != "class") this.moveTo("class");
                    continue;
                }
                
				// deprecated
				else if (keyword == "deprecated") {
                    for (var o, oi = 0, ol = objs.length; oi < ol; oi++) {
                        o = objs[oi]

    					o.deprecated = true;
                    }
					continue;
				}
				
				// event
				// binding
				// action
				else if (["event", "binding", "action"].indexOf(keyword) > -1) {
					if (!(objs[0].type == "event" && keyword == "event"))
                        lastContext = objs;
                    objs = [];
                    
                    for (var define, di = 0, dl = defines.length; di < dl; di++) {
                        define = defines[di];
    					var o = new oOther(this.parsePos[0], this.parsePos[1], define, keyword);
    					values = splitCommentLine(line, 2);
    
    					if (keyword == "action") {
                            o.name = define.name;
                            o.description = define.description;
                            if (!define.event) define.event = [];
                            var see = [o.name];
                            if (o.used) {
                                for (var us = 0, usl = o.used.length; us < l; us++) {
                                    see.push(o.used[us]);
                                }
                            } 
                                
                            define.event.push({
                                name: "on" + o.name + "start", 
                                description: [[{type: "", description: "Fires before the action is started by the user."}]],
                                see: see
                            });
                            define.event.push({
                                name: "onbefore" + o.name, 
                                description: [{type: "", description: "Fires before the result of the " + o.name.toLowerCase() + " action is processed."}],
                                see: see
                            });
                            define.event.push({
                                name: "onafter" + o.name, 
                                description: [{type: "", description: "Fires after the result of the " + o.name.toLowerCase() + " action is processed."}],
                                see: see
                            });
                            define.actions += ",element." + o.name ;
                            
                            if (!o.see) o.see = [];
                            o.see.push(o.name);
    
                        } else {
                            o.name = values[0];
    
                            // description
                            if (values[1]) {
                                var d = this.getDescription(lines, i, values[1]);
                                i = d.i;
                                
                                if (!o.description) o.description = [];
                                o.description = o.description.concat(this.parseDescription(d.description));
                            }
                        }
                        
                        objs.push(o);
                        
                        // add to docTree/define object
                        if (defineMode) {
                            addDefine(define.name, keyword, o);
                        }
                    }
				}
				
				// param
				// attribute
				else if (["param", "attribute"].indexOf(keyword) > -1) {
                    lastContext = objs;
                    objs = [];

                    for (var define, di = 0, dl = defines.length; di < dl; di++) {
                        define = defines[di];
    					var o = new oOther(this.parsePos[0], this.parsePos[1], define, keyword);
    					values = splitCommentLine(line, 3);
    					
                        //if (keyword == "attribute") {
                            var type = values[0];
                            name = (values[1]) ? values[1] : "";
                            
                            if (!name) {
                                name = values[0];
                                type = null;
                            }
                            
                            if (!o.attrinfo) o.attrinfo = {};
                            o.attrinfo["context"] = "";
                        //} else {
                            //name = values[0];
                            //var type = (values[1]) ? values[1] : "";
                        //}
                        if (type) o.dataType = type;
                        
                        if (name) {
                            if (name && name.charAt(0) == "[") {
                                name = name.substr(1, name.length - 2);
                                o.optional = true;
                            }
                            else if (name && name.charAt(0) == "!") {
                                name = name.substr(1, name.length - 1);
                                o.readonly = true;
                            }
                        
                            o.name = name;
                        }
    
                        // description
    					if (values[2]) {
    						var d = this.getDescription(lines, i, values[2]);
                            i = d.i;
                            
                            if (!o.description) o.description = [];
                            o.description = o.description.concat(this.parseDescription(d.description));
    					}
                        objs.push(o);
                        
                        // add to docTree/define object
                        if (defineMode) {
                            addDefine(define.name, keyword, o);
                        }
                    }
				} 

                // attrinfo
                else if (keyword == "attrinfo") {
                    for (var o, oi = 0, ol = objs.length; oi < ol; oi++) {
                        o = objs[oi];
                        
                        if (o.type == "attribute") {
                            values = splitCommentLine(line, 2);
                            if (values.length == 2) {
                                o.attrinfo["context"] = values[0];
                                o.attrinfo["editor"] = values[1];
                            }
                            else {
                                //debugger;
                            }
                        }
                        else {
                            //debugger;
                        }
                    }
                    
                    continue;
                }
                
                // default
                else if (keyword == "default") {
                    for (var o, oi = 0, ol = objs.length; oi < ol; oi++) {
                        o = objs[oi];

                        if (o.type == "attribute") {
                            o["default"] = line;
                        }
                        else {
                            //debugger;
                        }
                    }
                    
                    continue;                 
                }
                
				// type
				else if (keyword == "type") {
                    for (var o, oi = 0, ol = objs.length; oi < ol; oi++) {
                        o = objs[oi];

                        if (o.type == "property") {
                            o.dataType = (line.charAt(0) == "{" && line.charAt(line.length-1) == "}") ? line.substr(1, line.length-2) : line;
                        }
                    }
					continue;
				}
				
                else if (keyword == "term") {
                    var values = splitCommentLine(line, 2);
//                    if (values[0] == "binding") debugger;
                    
                    var termDesc = (values[1]) ? [values[1]] : [];

                    if (lines[i+1]) {
                        i++;
                        while ((lines[i] || lines[i] === "") && lines[i].trim().charAt(0) != "@" && lines[i].trim() != "/**") {
                            if (lines[i] != "/**" && lines[i] != "/")
                                termDesc.push(lines[i]);
                            i++;
                        }

                        docTree.term.push({name: values[0], description: this.parseDescription(termDesc)});
                    } 
                    i--;
                    continue;
                }
                
                else if (keyword == "group_caption") {
                    for (var define, di = 0, dl = defines.length; di < dl; di++) {
                        define = defines[di];

    					define.group_caption = line;
                    }
                    
                    continue;
                }
				// all other keywords
				else {
                    for (var define, di = 0, dl = defines.length; di < dl; di++) {
                        define = defines[di];
					
                        define[keyword] = line;
                    }
					continue;
				}

				var ct = "binding|action".indexOf(lastContext[0].type) > -1 
                    ? this 
                    : ("binding|action|attribute|event".indexOf(objs[0].type) > -1 && this.context.type && "method|class|baseclass".indexOf(this.context.type) > -1 // 
                        ? this.context
                        : null);

                if (!ct && defines && defines.length == 1 && defines[0] == this)
                    o.store(this);
                else if (ct)
                    o.store(ct);
/*
                if (ct.name) {
					if (!o.used) o.used = [];
					o.used.push(ct.type + "." + ct.name);
				}
*/
			}
            
            // text description
            else {
                description.push(line);
            }
		}

        // parse and save last description
        if (description.length) {
            for (var o, oi = 0, ol = objs.length; oi < ol; oi++) {
                o = objs[oi];
                
                if (!o.description) o.description = [];
                o.description = o.description.concat(this.parseDescription(description));
            }
            description = [];
        }
    };
    
    this.parseDescription = function(lines) {
        var output = [];
        var description = [];
        
        for (var textMode = false, codeMode = false, line, o, keycode, i = 0, l = lines.length; i < l; i++) {
            line = lines[i];
            // ignore /** and **/ lines
            if (line.trim() == "/**" || line.trim() == "**/") {
                continue;
            }
            // search for keycodes, like Possible values: and Example:
            // check for lines that end with :
            // ignore case "news":
            var isKeyCodeLine = line.trim().charAt(line.trim().length - 1) == ":" && line.trim().substr(0, 4) != "case" && line.trim().split(" ").length < 3;
            var oneLineKeyCode = (line.trim().indexOf(": ") > -1 
                  && line.trim().split(":")[0].indexOf(" ") == -1
                  && line.trim().charAt(0) != "<"
                  && line.trim().indexOf("]]>") != 0
                  && line.trim().indexOf("(ex.") != 0
                  && line.trim().indexOf("callback") != 0
                  && line.trim().charAt(0) != ":");
                  
            /*
                var keycodes = ["object", "bubbles", "Possible values", "dynamic property", "Properties", 
                            "Example", "Remarks", "Examples", "Method 1", "Method 2", 
                            "Supports", "Sorting methods", "Possible Values", "Flowchart component", 
                            "Advanced", "cancelable"];
            */
            if (isKeyCodeLine || oneLineKeyCode) { 
                // save previous object
                // reset o
                if (o) { 
                    if (textMode) {
                        o.description = o.description.join("\n");
                        textMode = false;
                    }
                    output.push(o);
                    o = null;
                }
                
                // save description
                if (description && description.length) {
                    output.push({
						type: "",
						description: description.join("\n")
					});
                    description = [];
                }

                if (isKeyCodeLine) {
                    var keycodeLine = line.trim().substr(0, line.trim().length - 1);
                    if (keycodeLine.split(" ").length < 3) {
                        keycode = keycodeLine;
                        
                        o = {type: keycode, description: []};
                        
                        if (["possible values", "properties", "object"].indexOf(keycode.toLowerCase()) > -1) {
                            var t = this.parseDescTree(lines, i + 1, o);
                            i = t.i + 1;
                            o.description = o.description.concat(t.description);
                            continue;
                        }
                    }
                }
 
                else if (oneLineKeyCode) {
                    var values = splitCommentLine(line, 2);
                    keycode = values[0].slice(0, -1);
                    o = {type: keycode, description: [values[1]]};
                }

                // no keyword, add to description
                else if (line || textMode && !line) {
                    if (o) 
                        o.description.push(line);
                    else
                        description.push(line);
                }
                
                if (keycode) 
                    textMode = (["remarks", "example"].indexOf(keycode.toLowerCase()) > -1) ? true : false;
            }
            
            // no keyword, add to description
            else if (line != "/" && !(i == l-1 && line.trim() == "")) {
                if (line.trim() == "<code>")
                    codeMode = true;
                else if (line.trim() == "</code>")
                    codeMode = false;
                    
                if ((keycode && ["example", "remarks"].indexOf(keycode.toLowerCase()) == -1 && !codeMode) || !keycode)
                    line = line.trim();
                    
                if (o)
                    o.description.push(line);
                else
                    description.push(line);
            }
        }

        // save last object
        if (o) {
            if (textMode) {
                o.description = o.description.join("\n");
                textMode = false;
            }
			output.push(o);
		}
        
        // end of description, save all
        if (description && description.length) {
            output.push({
				type: "",
				description: description.join("\n")
			});
        }

        return output;
    }

    this.parseDescTree = function(lines, j, rootObj) {
        var output = [];
        var parents = [];
        var textMode = false, descMode = false;
        
        for (var startInd, prevInd, context = output, o, line, i = j, l = lines.length; i < l; i++) {
            line = lines[i];
            
            // calculate indentation
            var curInd = 0;
            var trimd = line;
            while (trimd.charAt(0) == " ") {
                curInd++;
                trimd = trimd.substr(1);
            }
            
            // set startIndentation
            if (!startInd) {
                parents[curInd] = output;
                startInd = curInd;
                prevInd = curInd;
            }

            if (curInd < startInd) 
                return {i: i-1, description: output}; //curInd = startInd;
            
            // search for keycodes, like Possible values: and Example:
            // check for lines that end with :
            // ignore case "news":
            var isKeyCodeLine = line.trim().charAt(line.trim().length - 1) == ":" && line.trim().substr(0, 4) != "case" && line.trim().split(" ").length < 3;
            var oneLineKeyCode = (line.trim().indexOf(": ") > -1 
                  && line.trim().split(":")[0].indexOf(" ") == -1
                  && line.trim().charAt(0) != "<"
                  && line.trim().indexOf("]]>") != 0
                  && line.trim().indexOf("(ex.") != 0
                  && line.trim().indexOf("callback") != 0
                  && line.trim().charAt(0) != ":");            
            if (isKeyCodeLine || oneLineKeyCode) {
                if (isKeyCodeLine) {
                    var keycodeLine = line.trim().substr(0, line.trim().length - 1);
                    if (keycodeLine.split(" ").length < 3) {
                        keycode = keycodeLine;
                        description = [];
                        //o = {type: keycode, description: []};
                    }
                }
                
                else if (oneLineKeyCode) {
                    var values = splitCommentLine(line, 2);
                    keycode = values[0].slice(0, -1);
                    description = [values[1]];
                    //o = {type: keycode, description: [values[1]]};
                }

                textMode = (["remarks", "example"].indexOf(keycode.toLowerCase()) > -1) ? true : false;
                //set context
                
                // context changes to object up the tree
                if (curInd > prevInd) {
                    o = {type: keycode, description: description};
                    context.push(o);
                    context = o.description;
                    
                    // add to parents list
                    parents[curInd] = o;
                } 
                
                // context changes to object up the tree
                else if (curInd < prevInd) {
                    //if (!parents[curInd]) debugger;
                    
                    context = parents[curInd].description;

                    delete parents[prevInd];
                }

                // context remains the same
                else if (curInd == prevInd) {
                }

                // context set to root of object
                else if (curInd == startInd) {
                    context = output;
                }
                
                else {
                    //debugger;
                    throw new Error("problem reading indentation");
                }
                
                prevInd = curInd;
                
                //if (!textMode) context.push(o);

            } 
            
            else if (textMode) {
                //don't trim examples and remarks
                //if (keycode.toLowerCase() != "example")
                    //line = line.trim();

                context.push(line);
            }
            
            else if (line != "" && line != "/") {
                if (curInd < prevInd)
                    descMode = false;
                    
                if (curInd == startInd) {
                    context = output;
                }
                
                // second line of description
                else if (curInd > prevInd) {
                    context[context.length - 1].description[context[context.length - 1].description.length-1].description += "\n" + line.trim();
                    descMode = true;
                } 
                
                else if (descMode) {
                    context[context.length - 1].description[context[context.length - 1].description.length-1].description += "\n" + line.trim();
                }
                
                else {
                    //if (!parents[curInd]) debugger;
                    
                    context = parents[curInd].description;
                }
                
                prevInd = curInd;
                
                var split = line.trim().split(" ");

                if (!descMode) {
                    if (split[0].charAt(0) == "{" && split[0].charAt(split[0].length - 1) == "}") {
                        var words = splitCommentLine(line.trim(), 3);
                        
                        if (words[1]) {
                            var readonly = (words[1].charAt(0) == "!");
                            var name = (readonly) ? words[1].substr(1) : words[1];
                            
                        }
                        if (words[2])
                            var description = words[2];
                        
                        var o  = {
                            dataType: words[0],
                            name: name,
                            description: [{type: "", description: description}],
                            readonly: readonly
                        }
                        context.push(o);
                        context = o.description;
                    }
                    else {
                        var words = splitCommentLine(line.trim(), 2);
                        //if (context.push == undefined) debugger;
                        
                        var o = {
                            name: words[0],
                            description: [{type: "", description: words[1]}]
                        }
                        context.push(o);
                        context = o.description;
                    }
                    
                    //context = context[context.length-1].description[context[context.length-1].description.length-1].description;
                }
            }
        }
        
        return {i: i, description: output};
    }
    
    /*
     * get full description of keyword
     * @keyword {type} name "description line 1
     * description line 2
     * description line 3
     */
    this.getDescription = function(lines, j, firstLine) {
        var description = [firstLine];
        
        for (var i = j + 1, l = lines.length; i < l; i++) {
            if (lines[i].charAt(0) == "@")
                break;
                
            description.push(lines[i]);
        }
        
        return {description: description, i: i-1};
    }
    
    this.copyFrom = function(source) {
        // copy methods, objects, properties
        var objects = ["method", "object", "property", "attribute"];
        var name, obj;

        for (var i = 0, l = objects.length; i < l; i++) {
            if (objects[i] == "attribute") {
                if (source[objects[i]] && source[objects[i]].length) {
                    for (var ai = 0, al = source[objects[i]].length; ai < al; ai++) {
                        if (!this[objects[i]]) this[objects[i]] = [];
                        this[objects[i]].push(source[objects[i]][ai]);
                    }
                }                
            }
            else {
                if (source[objects[i]]) {
                    for (name in source[objects[i]]) {
                        if (!this[objects[i]]) this[objects[i]] = {};
                        
                        this[objects[i]][name] = source[objects[i]][name];
                    }
                }
            }
        }
        
        // prototype
        this.prototype = source.prototype;
    }
    
    this.setDescription = function(obj) {
        this.description = obj.description;
    }
};

// function class
function oFunc(t, i, context) {
    this.parsePos   = [t, i];
    this.context    = context;
    this.type       = "method";
       
    this.$init();
};
oFunc.prototype = new Base();

// object class
function oObject(t, i, context) {
    this.parsePos   = [t, i];
    this.context    = context;
    this.type       = "object";

    this.$init();
};
oObject.prototype = new Base();

function oProperty(t, i, context) {
    this.parsePos   = [t, i];
    this.context    = context;
    this.type       = "property";
    
    this.$init();
};
oProperty.prototype = new Base();

function oOther(t, i, context, type){
    this.parsePos 	= [t, i];
    this.context 	= context;
    this.type 		= type;

    this.store = function(o){
        var objs;
        if (!(typeof o == 'object' && o.length))
            objs = [o];
        else
            objs = o;
            
        for (var duplicate, o, oi = 0, ol = objs.length; oi < ol; oi++) {
            o = objs[oi];
            
            if (!o[this.type]) o[this.type] = [];
                //throw new Error("Undefined collection: " + this.type);
    
            // avoid duplicates
            duplicate = false;
            for (var i = 0, l = o[this.type].length; i < l; i++) {
                if (o[this.type][i].name == this.name) {
                    duplicate = true;
                    break;
                }
            }

            if (duplicate) continue;

            o[this.type].push(this);
        }        
    }
}

function addDefine(elName, keyword, itemValue, itemName) {
    if (!docTree.defines[elName]) docTree.defines[elName] = {};
    if (keyword == "description") {
        if (!docTree.defines[elName][keyword]) docTree.defines[elName][keyword] = [];
        docTree.defines[elName][keyword] = docTree.defines[elName][keyword].concat(itemValue);
        return;    
    }
    
    if (itemName) {
        if (!docTree.defines[elName][keyword]) docTree.defines[elName][keyword] = {};
        
        // ignore duplicates
        if (!docTree.defines[elName][keyword][itemName])
            docTree.defines[elName][keyword][itemName] = itemValue;
    }
        
    else {
        if (!docTree.defines[elName][keyword]) docTree.defines[elName][keyword] = [];
        
        // ignore duplicates, defined item with same name in different defines
        var duplicate = false;
        for (var i = 0, l = docTree.defines[elName][keyword].length; i < l; i++) {
            if (docTree.defines[elName][keyword][i].name == itemValue.name) {
                duplicate = true;
                break;
            }
        }
        
        if (!duplicate)
            docTree.defines[elName][keyword].push(itemValue);
    }
}               
