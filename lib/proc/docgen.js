/**
 * Parses a javascript file and extracts documentation. It then calls the 
 * specified document printers that use the generated parse tree to write 
 * documentation in several formats.
 */
apf.process.handler.docgen = function(){
    apf.makeClass(this);
    this.inherit(apf.ProjectBase);
	
    this.regexp = new RegExp("^" + this.name + "_(\\d{12})")
    this.data   = {};
    this.log    = [];

    function getDateString(dt){
        return dt.getFullYear() +
            new String(dt.getMonth()).pad(2,   "0", PAD_LEFT) +
            new String(dt.getDate()).pad(2,    "0", PAD_LEFT) +
            new String(dt.getHours()).pad(2,   "0", PAD_LEFT) +
            new String(dt.getMinutes()).pad(2, "0", PAD_LEFT)
    }

    //apf.process.start = 54302;
    //apf.process.stop  = 93534;

    this.parse = function(){
        //Get codefile
        jsString = fInput.data;

        if (!jsString)
            apf.console.error("Could not load data from file: " + fInput.path);

        //Preparse string
        //jsString = jsString.replace(/\/\*.*?\*\//g, "");
        //jsString = jsString.replace(/\/\/.*/g, "").replace(/\.replace\((?:.*(,\s*function.*{)|.*)/g, "$1");
        var lines = jsString.split("\n");
        this.lines = lines;

        //Setup base object
        this.log = [];
        this.data = {
            global : {name:"global",functions:{i:1928},properties:{},objects:{},
                controls:{},baseclasses:{},teleport:{},parsers:{}}
        };

        //Process lines
        this.process(this.data.global, lines, apf.process.start || 0);

        return true;
    };

    function getDepthCount(line){
        if (line.match(/\\$/m)) return 0;
        var res = apf.JavascriptParser.parse(line, true);
        return res.count[1];
    }

    this.process = function(context, lines, i, ignore){
        var tempObj,
            depth = 0,
            first = i;

        if (apf.verbose == 3)
            apf.console.info("[" + i + "] Parsing in context '" + context.name + "'");

        for(i;i<lines.length;i++){
            if (apf.process.stop && i > apf.process.stop)
                break;

            var line = lines[i]; this.log.push(line);
            //if (i == 22201) debugger;
            //if (i > 1044 && depth < 2) debugger;
            if (apf.verbose == 2 && i % 1000 == 0)
                apf.console.info("Line " + i + "\n");

            var depthCount = getDepthCount(line);

            //Ignore (multiline) comments
            if (line.indexOf("/*") > -1) {
                if (line.indexOf("*/") == -1) {
                    i = this.loopComment(lines, i);
                    continue;
                }
                else if (line.indexOf("/****") > -1) {
                    line = line.replace(/\/\*.*\*\//, "");
                }
                else if (line.indexOf("/**") > -1) {
                    line = line.replace(/\/\*(.*)\*\//, "");
                    this.lastComment += "/**\n " + RegExp.$1 + "\n*/\n";
                }
            }

            //Ignore multiline strings
            if (line.match(/\\$/m)) { //line.substr(-1) == "\\") {
                var ret = this.loopMultiString(lines, i);
                line    = ret.line;
                i       = ret.i;
            }

            // Context switching
            if (!ignore && first != i){
                //Function (usually a class, or a global function);
                if ((line.match(/^\s*function\s*([\w_]*)\s*\((.*?)\)/) && RegExp.$1 != "extendXmlDb"
                  || line.match(/^(apf\.[\$\w_\.]*)\s*=\s*\(?(?:apf\.(?:run\w+|component|subnode)\(\s*apf.[\w_]+\s*,\s*)?function\s*\((.*?)\)/)
                  || line.indexOf("(function") == 0)) {
                    if (this.lastCommentBlock.indexOf("@constructor") > -1
                      || line.indexOf("(function") > -1
                      || line.indexOf("apf.component") > -1
                      || line.indexOf("apf.subnode") > -1
                      || line.indexOf("apf.editor") > -1
                      || line.indexOf("apf.run") > -1
                      || RegExp.$1.match(/^run/)) {
                        i = this.process(this.getContext(RegExp.$1, "Class", context.objects, i), lines, i);
                        continue;
                    }
                    //Global Functions
                    else {
                        var names,
                            name = RegExp.$1,
                            args = RegExp.$2,
                            temp_context = context;
                        name = name.replace(/[\"\']/g, "").replace("(", ".");

                        if (apf.verbose == 3)
                            apf.console.info("[" + i + "] Parsing local function " + name);

                        if (name.indexOf(".") > -1) {
                            names = name.split(".");
                            name  = names.pop();
                            temp_context = this.getContext(names.join("."), null, this.data.global.objects, i);

                            var info = (temp_context.functions
                                ? temp_context.functions
                                : temp_context.methods)[name] = {
                                    name:     name,
                                    args:     args.split(","),
                                    line:     i,
                                    metadata: {}
                                };
                            this.parseComment(info);
                        }
                        else {
                            i = this.loopLocalFunction(lines, i);
                            //line = lines[i];
                            i--;
                            continue;
                            //depthCount--;i++
                            //continue;
                        }
                    }
                }

                //Structs
                if (depthCount
                  && (line.match(/^(?:var)?\s*([\w_\.\[\]\"\']+)\s*[=\:]\s*(?:apf\.extend\()?\{/)
                  || line.match(/((?:apf\.namespace|apf\.editor\.plugin)\([\w_\.\[\]\"\']+),/))) {
                    //temp for props
                    //if (RegExp.$1.indexOf("this") != 0){
                    i = this.process(this.getContext(RegExp.$1.replace(/this\.|namespace|plugin|[\(\[\]\"\']/g, ""),
                        "Object", context.objects, i), lines, i);
                    continue;
                    //}
                }
            }

            //Instance detection
            if (line.match(/^\s*apf\.([\w_\.]*)\s*=\s*new\s*apf\.(.*)\(/) && line.indexOf("__") == -1) {
                //apf.XMLDatabase = new apf.XMLDatabaseImplementation();
                this.data.global.objects.apf.objects[RegExp.$1] = {
                    name: RegExp.$1,
                    line: i,
                    type: RegExp.$2}
                if (apf.verbose == 3)
                    apf.console.info("[" + i + "] Adding a new object '" + RegExp.$1 + "'");
                continue;
            }

            // Context type detection
            if (context.name != "global" && !context.moved){
                if (first == i && context.comment && context.comment.indexOf("@baseclass") > -1)
                    context.__moveTo(this.data.global.baseclasses);
                else if (line.indexOf("apf.teleport.register(this)") > -1 || line.indexOf("this.TelePortModule ") > -1
                  || context.comment && context.comment.indexOf("@addnode teleport") > -1)
                    context.__moveTo(this.data.global.teleport);
                else if (line.indexOf("apf.register(this") > -1
                  || line.indexOf("apf.component(") > -1
                  || line.indexOf("apf.subnode(") > -1
                  || line.indexOf("apf.JmlDom") > -1
                  || context.comment && context.comment.indexOf("@define " + context.name) > -1){
                    if (line.indexOf("apf.component(") > -1){
                        if (!context.metadata)
                            context.metadata = {inherits:[]};
                        if (!context.metadata.inherits)
                            context.metadata.inherits = [];
                        context.metadata.inherits.pushUnique("apf.JmlElement");
                        context.metadata.inherits.pushUnique("apf.Class");
                    }
                    context.__moveTo(this.data.global.controls);
                }
                else if (first == i && context.name.match(/^run/))
                    context.__remove();
                else if (first == i && context.comment && context.comment.indexOf("@parser") > -1)
                    context.__moveTo(this.data.global.parsers);
                //else if (first == i && context.comment && context.comment.indexOf("@apfclass") > -1)
                    //context.__moveTo(this.data.global.objects.apf.classes);
                //else if (first == i && context.name.indexOf("Server") > -1)
                    //context.__moveTo(this.data.global.objects.apf.servers);
                else if (line.indexOf(".$regbase = ") > -1)
                    context.__moveTo(this.data.global.baseclasses);
            }

            //{} depth counting
            //depth += parseInt(line.count("{")); depth -= parseInt(line.count("}"));
            depth += depthCount; //Calculate Depth Count
            //apf.console.info(depth + ":" + line);

            //Return if depth 0 again (meanin end of function or struct)
            if (depth == 0 && context.name != "global"){
                //Comment cleanup
                this.parseComment(context);

                if (apf.verbose == 3)
                    apf.console.info("[" + i + "] Returning from context[1] '" + context.name + "'");

                return i; //doesn't work for }}}}}
            }

            if (ignore) continue;

            //Parse stuff :)
            if (line.match(/([\w_]+)\.prototype\.([\$\w_]+)\s*=\s*function\s*\((.*?)\)/)){
                this.addMethod(this.findContext(RegExp.$1, i), RegExp.$2, RegExp.$3.split(","), i);
            }
            else if (line.match(/^\s*(apf\.[\w_\.]+)\.([\w_]+)\s*=\s*function\s*\((.*?)\)/)) {
                this.addMethod(this.findContext(RegExp.$1, i), RegExp.$2, RegExp.$3.split(","), i);
            }
            else if (line.match(/this\.([\$\w_]+)\s*=\s*function\s*\((.*?)\)/) 
              || line.match(/^\s*([\$\w_]+)\s*:\s*function\s*\((.*?)\)/)) {
                this.addMethod(context, RegExp.$1, RegExp.$2.split(","), i);
            }
            else if (context.name != "global" 
              && (line.match(/^\s*this\.([\$\w_]+)\s*=/) || line.match(/^\s*([\w_]+)\s*:.*\w.*/))) {
                if (this.lastCommentBlock.indexOf("@method") > -1) {
                    this.addMethod(context, RegExp.$1, "", i);
                }
                else {
                    tempObj = context.properties[RegExp.$1] = {name:RegExp.$1, line:i}
                    if (tempObj[0] == "$")
                        tempObj["private"] = true;
                    this.parseComment(context, tempObj, true);
                }
            }

            if (line.match(/\.inherit\(([\w_\.]+)\)/)) {
                if (!context.inheritance)
                    context.inheritance = {};
                context.inheritance[RegExp.$1] = {name:RegExp.$1,line:i}
            }
            else if (line.match(/\.applyRuleSetOnNode\(["']([\w_]+)["']\s*\,/) 
              || line.match(/\.getNodeFromRule\(["']([\w_]+)["']\s*\,/)) {
                tempObj = context.bindings[RegExp.$1.toLowerCase()] = {name:RegExp.$1,line:i};
                //this.parseComment(context, tempObj, true, true);
            }
            else if (line.match(/\.traverse = /)) {
                context.bindings["traverse"] = {name:"traverse",line:i,copy:"MultiselectBinding#traverse"};
            }
            else if (line.match(/this\.dispatchEvent\(["']([\w_]+)["'][\,\)]/)) {
                context.events[RegExp.$1] = {name:RegExp.$1,line:i};
                //this.parseComment(context, context.events[RegExp.$1]);
            }
            else if (line.match(/\.\$setStyleClass\(.*?,\s*["']([\w_]+)["']\s*\[,\)]/)) {
                context.skincss[RegExp.$1] = {name:RegExp.$1,line:i};
            }
            else if (line.match(/(?:\$jml|x)\.getAttribute\(["']([\w_]+)["']\)/)) {
                context.jmlprop[RegExp.$1] = {name:RegExp.$1,line:i};
            }
            else if (line.match(/.\$supportedProperties[^"]*"(.*)"/)) {
                var data = RegExp.$1.split(/"\s*,\s*"/);
                for (var j = 0; j < data.length; j++)
                    context.jmlprop[data[j]] = {name:data[j],line:i};
            }
            else if (line.match(/\.\$getExternal/) || line.match(/\.\$getLayoutNode\(["']([\w_]+)["']\)/)) {
                if (!context.skinxml)
                    context.skinxml = {};
                if (!context.skinxml[RegExp.$1 || "main"])
                    context.skinxml[RegExp.$1 || "main"] = {};
                context.skinxml[RegExp.$1 || "main"][""] = {tagName:RegExp.$1 || "main", line:i};
            }
            else if (line.match(/\.\$getLayoutNode\(["']([\w_]+)["'],\s*["']([\w_]+)["']\s*[,\)]/)) {
                if (!context.skinxml)
                    context.skinxml = {};
                if (!context.skinxml[RegExp.$1])
                    context.skinxml[RegExp.$1] = {};
                context.skinxml[RegExp.$1][RegExp.$2] = {tagName:RegExp.$1,attribute:RegExp.$2,line:i};
            }
            else if (line.match(/canHaveChildren/)) {
                context.canHaveChildren = true;
            }
        }

        if (apf.verbose == 3)
            apf.console.info("[" + i + "] Returning from context[2] '" + context.name + "'");

        return i;
    };

    this.addMethod = function(context, name, args, line){
        if (apf.verbose == 3)
            apf.console.info("[" + line + "] Adding method " + name + " in context " + context.name);

        if (context.name == "global"){
            apf.console.error("Adding a method in global context on line: " + line + " with the name '" + name + "'");
        }

        if (this.lastCommentBlock.indexOf("@action") > -1){
            name = name.toLowerCase();
            context.actions[name] = {name:name,args:args,line:line};
            this.parseComment(context, context.actions[name], true, true, true);
            if (!context.metadata)
                context.metadata = {};
            if (!context.metadata.event)
                context.metadata.event = [];

            context.metadata.event.push(name.toLowerCase()
                + "start Fires before the action is started by the user.\n\
            object:\n\
            {XMLElement} xmlContext the xml context under which the action will be started.");
            context.metadata.event.push("before" + name.toLowerCase()
                + " Fires before the result of the " + name.toLowerCase() + " action is processed.\n\
            cancellabe: Prevents the action from being execute.\n\
            object:\n\
            {String} action  the name of the actiontracker function that will be executed.\n\
            {Array}  args    the list of arguments that are sent to the function.\n\
            {XMLElement} xmlActionNode  the node that determines the way the data is sent to the data source.\n\
            {JMLElement} jmlNode the jml element on which the action is executed.\n\
            {XMLElement} selNode the selected node when the action was executed.\n\
            {Boolean}    multiple wether multiple nodes are involved.\n\
            {Number}     timestamp the time the action started.");

            context.metadata.event.push("after" + name.toLowerCase() 
                + " Fires after the result of the " + name.toLowerCase() + " action is processed.\n\
            object:\n\
            {String} action  the name of the actiontracker function that was executed.\n\
            {Array}  args    the list of arguments that have been sent to the function.\n\
            {XMLElement} xmlActionNode  the node that determined the way the data is sent to the data source.\n\
            {JMLElement} jmlNode the jml element on which the action was executed.\n\
            {XMLElement} selNode the selected node when the action was executed.\n\
            {Boolean}    multiple wether multiple nodes are involved.\n\
            {Number}     timestamp the time the action started.");
        }

        context.methods[name] = {name:name,args:args,line:line, metadata:{}};
        if (name[0] == "$")
            context.methods[name]["private"] = true;
        this.parseComment(context, context.methods[name], true);
    };

    this.lastComment      = "";
    this.lastCommentBlock = "";
    this.blockStop        = true;
    this.loopComment = function(lines, i){
        if (this.blockStop) {
            this.lastComment += this.lastCommentBlock;
            this.lastCommentBlock = "";
            this.blockStop = false;
        }

        var commentIsDoc = lines[i].indexOf("/**") > -1;
        for (; i < lines.length; i++){
            if (commentIsDoc) {
                //this.lastComment += lines[i] + "\n";
                this.lastCommentBlock += lines[i] + "\n";
            }
            if (lines[i].indexOf("*/") > -1) {
                this.blockStop = true;
                return i;
            }
        }
        return i;
    };

    this.loopMultiString = function(lines, i){
        var line = lines[i].replace(/[\n\r]/g, "");
        while (line.match(/\\$/)) { //line.substr(-1) == "\\")
            line += lines[++i];
            line = line.replace(/[\n\r]/g, "");
        }
        if (apf.verbose == 3)
            apf.console.info("Looped over string until line " + i);
        return {
            "line" : line,
            "i"    : i
        };
    };

    this.loopLocalFunction = function(lines, i){
        var depth = 0, line;
        for(; i < lines.length; i++) {
            line = lines[i];
            if (line.match(/\\$/m)) { //line.substr(-1) == "\\") {
                var ret = this.loopMultiString(lines, i);
                line = ret.line;
                i = ret.i;
            }

            depth += getDepthCount(line);
            if (depth <= 0) break;
        }
        if (apf.verbose == 3)
            apf.console.info("Skipped until line " + (i+1) + ":" + lines[i+1]);
        return i + 1;
    };
	
    function Context(name, type, line, arr, comment){
        this.name = name;
        this.type = type;
        this.line = line;

        this.__moveTo = function(newarr){
            //delete arr[this.name];
            arr = newarr;
            arr[this.name] = this;

            this.moved = true;
        };

        this.__remove = function(newarr){
            delete arr[this.name];
        };

        this.inheritance = {};
        this.methods = {};
        this.jmlprop = {};
        this.properties = {};
        this.skinxml = {};
        this.skincss = {};
        this.events = {};
        this.actions = {};
        this.bindings = {};
        this.objects = {};
        this.servers = {};
        this.metadata = {};

        this.comment = comment;
    }

    this.findContext = function(name, line){
        /*for(prop in this.data.global.classes){
        if (prop == name) return this.data.global.classes[prop];
        }*/
        if (this.data.global.objects[name])
            return this.data.global.objects[name];

        return this.getContext(name, "Class", this.data.global.objects, line);
    };

    this.getContext = function(name, type, arr, line, noComment){
        if (name.indexOf(".") > -1){
            names = name.split(".");
            name = names.pop();
            arr = this.getContext(names.join("."), null, this.data.global.objects, line, true);
            //[this.lines[line].indexOf("function") > -1 ? "classes" : "objects"];

            /*if (arr.classes[name])
            arr = arr.classes;
            else*/
            arr = arr.objects;
        }

        if (!arr)
            arr = data;
        if (!arr[name]){
            arr[name] = new Context(name, type, line, arr);
            if (!noComment)
                this.parseComment(arr[name]);
        }
        return arr[name];
    };

    function addToMetaData(metadata, type, contents, lasttype){
        if (!type && (lasttype || metadata["description"])){
            if (!lasttype)
                lasttype = "description";
            if (!metadata[lasttype])
                metadata[lasttype] = [];
            metadata[lasttype][metadata[lasttype].length-1] += "\n" + contents;
        }
        else {
            if (!type)
                type = "description";
            if (type == "constructor") {
                metadata.isConstructor = true;
                return;
            }
            if (!metadata[type] || !metadata[type].length)
                metadata[type] = [];
            if (type == "inherits")
                contents = contents.trim();
            metadata[type].pushUnique(contents);
        }
    }

    var contextBased = {"addenum":1, "addnode":1, "allowchild":1, "define":1,
        "attribute":1, "inherits":1, "event":1, "term":1, "description":1};
    this.parseComment = function(context, object, onlyBlock, canHaveAttributes, noClear){
        //switch node context based on sequence of define
        if (!object)
            object = context;
        var original_context = context;

        //parse @define and everything below, changing context untill */ allowchild, attribute
        //if (this.lastComment.indexOf("@define  item <desc>") > -1) debugger;
        var matches, type, contents, lasttype, metadata = {};

        var comment;
        if (onlyBlock) {
            comment = this.lastCommentBlock;
        }
        else {
            comment = this.lastComment + this.lastCommentBlock;
        }

        var lines = comment.replace(/\/\*\*/g, "").replace(/\*\//g, "@@").replace(/^\s* \*(?: |$)/mg, "\n").split("\n");
        for(var i = 0; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            if (lines[i].match(/@@/)){
                context = original_context;
                lasttype = null;
                continue;
            }

            matches = lines[i].match(/^(?:\s*(@[^\s]*))?(.*)/);
            type = matches[1] && matches[1].replace(/^@/, "");

            if (type == "experimental"){
                if (lasttype != "attribute")
                    addToMetaData(object.metadata, type, "true");
            }
            else if (type == "define" || type == "term" || type == "binding"){
                var name = matches[2].trim().match(/^((?:[\w-]+(?:,\s*)?)+)([\s\S]*)$/);
                var c = {
                    name        : name[1],
                    description : [name[2]]
                };

                //Might be better to really create the elements within each object and copy and then do cleanup
                /*if (!this.data.global.objects.apf.metadata.define)
                this.data.global.objects.apf.metadata.define = [];
                this.data.global.objects.apf.metadata.define.push(context);*/

                addToMetaData(type == "term"
                    ? this.data.global.objects.apf.metadata
                    : original_context.metadata, type, c, lasttype);

                type = "description";

                context = {
                    isDefine : true,
                    metadata : c
                };
            }
            else {
                /*if (context.isDefine
                && type && "allowchild|attribute|addnode|description".indexOf(type) == -1) {
                context = original_context;
                }*/

                //(
                addToMetaData(context && contextBased[type || lasttype || (onlyBlock ? "" :"description")]
                  && (!canHaveAttributes || (type || lasttype) != "attribute")
                    ? context.metadata
                    : metadata, type, matches[2], lasttype); //trim
            }

            if (type)
                lasttype = type;
        }

        if (object.metadata)
            apf.extend(object.metadata, metadata);
        else
            object.metadata = metadata;

        if (!noClear) {
            object.comment = (object.comment || "") + comment;

            if (onlyBlock)
                this.lastCommentBlock = "";
            else {
                this.lastComment = "";
                this.lastCommentBlock = "";
            }
        }
    };

    var fInput;
    this.$loadPml = function(x){
        fInput = o3.fs.get(this.input);
        if (!fInput.exists)
            apf.console.error("File not found: " + fInput.path);

        this.name = fInput.name;
        var fCache = o3.fs.get(this.cache + "/docgen_cache_" + fInput.modifiedTime);

        if (fCache.exists) {
            this.data = apf.unserialize(fCache.data);
        }
        else {
            apf.console.info("Parsing javascript, generating parse tree...");
            this.parse();
            fCache.data = apf.serialize(this.data);
        }

        var printer, nodes = x.childNodes;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].nodeType != 1)
                continue;

            printer = new apf.process.handler[nodes[i][apf.TAGNAME]](this);
            printer.loadPml(nodes[i]);
        }
    };
}
