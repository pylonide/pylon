/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

//#ifdef __SUPPORT_O3

/** 
 * Ajax.org Platform for O3
 *
 * @author    Ruben Daniels ruben@javeline.com
 * @version   3.0
 * @url       http://www.ajax.org
 */

//Start of the Ajax.org Platform namespace
apf = {
    SUCCESS : 1,
    TIMEOUT : 2,
    ERROR   : 3,
    OFFLINE : 4,
    
    //#ifdef __DEBUG
    debug         : true,
    debugType     : "Memory",
    debugFilter   : "!teleport",
    /* #else
    debug         : false,
    #endif */
    
    initialized   : false,
    crypto        : {}, //namespace
    _GET          : {},
    basePath      : "./",
    $asyncObjects : {},
    isO3          : true,
    supportNamespaces: true,
    basePath      : "",
    verbose       : 3,

    /**
     * {Object} contains several known and often used namespace URI's.
     * @private
     *
     */
    ns : {
        apf    : "http://ajax.org/2005/aml",
        aml    : "http://ajax.org/2005/aml",
        xsd    : "http://www.w3.org/2001/XMLSchema",
        xhtml  : "http://www.w3.org/1999/xhtml",
        xslt   : "http://www.w3.org/1999/XSL/Transform",
        xforms : "http://www.w3.org/2002/xforms",
        ev     : "http://www.w3.org/2001/xml-events"
    },
    
    start : function(strAml){
        this.host     = null;
        this.hostPath = null;
        this.CWD      = null;
        this.TAGNAME  = "localName";
        this.oHttp    = new apf.http();
        apf.runO3();

        this.implement(apf.Class);

        //if (strAml)
        apf.window.init(strAml || "<a:application xmlns:a='http://ajax.org/2005/aml' />");
    },
    
    importClass : function(ref, strip, win){
        if (!ref)
            throw new Error(apf.formatErrorString(1018, null, 
                "importing class", 
                "Could not load reference. Reference is null"));
    
        if (!strip)
            return apf.jsexec(ref.toString());
        
        var q = ref.toString().replace(/^\s*function\s*\w*\s*\([^\)]*\)\s*\{/, "");
        q = q.replace(/\}\s*$/, "");
        
        //var q = ref.toString().split("\n");q.shift();q.pop();
        //if(!win.execScript) q.shift();q.pop();
    
        return apf.jsexec(q);
    },
    
    /**
    * This method returns a string representation of the object
    * @return {String}    Returns a string representing the object.
    * @method
    */
    toString : function(){
        return "[Ajax.org Platform (apf)]";
    },
    
    all : [],
    
    /**
    * This method implements all traits of another class to this object
    * @param {Function}    classRef    Required Class reference 
    * @method
    */
    implement : function(classRef){
        for (var arg, i = 0, l = arguments.length; i < l; i++) {
            arg = arguments[i]
            //#ifdef __DEBUG
            if (!arg) {
                throw new Error(apf.formatErrorString(0, this, 
                    "Implementing class",
                    "Could not implement from '" + classRef + "'",
                    this.$aml));
            }
            //#endif
            
            arg.call(this);//classRef
        }
        
        return this;
    },
    
    lookup : function(uniqueId){
        return this.all[uniqueId];
    },

    /**
     * Set reference to an object by name
     */
    setReference : function(name, o, global){
        if (self[name] && self[name].hasFeature) return 0;
        return (self[name] = o);
    },

    /**
     * Extends an object with one or more other objects by copying all their
     * properties.
     * @param {Object} dest the destination object.
     * @param {Object} src the object that is copies from.
     * @return {Object} the destination object.
     */
    extend : function(dest, src){
        var prop, i, x = !dest.notNull;
        if (arguments.length == 2) {
            for (prop in src) {
                if (x || src[prop])
                    dest[prop] = src[prop];
            }
            return dest;
        }

        for (i = 1; i < arguments.length; i++) {
            src = arguments[i];
            for (prop in src) {
                if (x || src[prop])
                    dest[prop] = src[prop];
            }
        }
        return dest;
    },
    
    /**
     * The console outputs to the debug screen
     */
    console : {
        //#ifdef __DEBUG
        write : function(msg, type, subtype, data, forceWin, nodate){
            if (!Number.prototype.toPrettyDigit) {
                Number.prototype.toPrettyDigit = function() {
                    var n = this.toString();
                    return (n.length == 1) ? "0" + n : n;
                }
            }

            var dt   = new Date(),
                ms   = String(dt.getMilliseconds());
            while (ms.length < 3)
                ms += "0";
            var date = dt.getHours().toPrettyDigit()   + ":"
                     + dt.getMinutes().toPrettyDigit() + ":"
                     + dt.getSeconds().toPrettyDigit() + "." + ms;
            
            sys.puts((nodate ? "" : date) + " " + msg + (data ? "Extra information:\n" + data : ""));
        },
        //#endif
        
        debug : function(){
            
        },
        
        time : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "time", subtype, data);
            //#endif
        },
        
        log : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.info(msg, subtype, data);
            //#endif
        },
        
        info : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "info", subtype, data);
            //#endif
        },
        
        warn : function(msg, subtype, data){
            //#ifdef __DEBUG
            this.write(msg, "warn", subtype, data);
            //#endif
        },
        
        error : function(msg, subtype, data){
            //#ifdef __DEBUG
        	this.write("Error "+ "\033[35m"+msg+"\033[39m", "error",subtype,data);
            //this.write("Error: " + msg + "\nStacktrace:\n" + new Error().stack, "error", subtype, data);
            //#endif
        },
        
        dir : function(obj){
            this.info(apf.vardump(obj, null, true));
        },
        
        teleport: function() {}
    },

    namespace : function(name, oNamespace){
        eval("apf." + name + " = oNamespace");
    },
    
    formatErrorString : function(number, control, process, message, amlContext, outputname, output){
        //#ifdef __DEBUG
        var str = ["---- APF Error ----"];
        if (amlContext) {
            var amlStr = (amlContext.outerHTML || amlContext.xml || amlContext.serialize())
                .replace(/\<\?xml\:namespace prefix = j ns = "http\:\/\/ajax.org\/2005\/aml" \/\>/g, "")
                .replace(/xmlns:a="[^"]*"\s*/g, "");
        }
        if (control)
            str.push("Control: '" 
                + (control.name 
                    || (control.$aml ? control.getAttribute("id") : null) 
                    || "{Anonymous}")
                + "' [" + control.tagName + "]");
        if (process)
            str.push("Process: " + process.replace(/ +/g, " "));
        if (message)
            str.push("Message: [" + number + "] " + message.replace(/ +/g, " "));
        if (outputname)
            str.push(outputname + ": " + output);
        if (amlContext)
            str.push("\n===\n" + amlStr);

        return str.join("\n");
        //#endif
    },

    namespaces : {},
    setNamespace : function(namespaceURI, oNamespace){
        this.namespaces[namespaceURI] = oNamespace;
        oNamespace.namespaceURI = namespaceURI;
    },
    
    /* Init */
   
    /**
     * Returns the directory portion of a url
     * @param {String} url the url to retrieve from.
     * @return {String} the directory portion of a url.
     */
    getDirname : function(url){
        return ((url || "").match(/^([^#]*\/)[^\/]*(?:$|\#)/) || {})[1]; //Mike will check out how to optimize this line
    },

    /**
     * Returns the file portion of a url
     * @param {String} url the url to retrieve from.
     * @return {String} the file portion of a url.
     */
    getFilename : function(url){
        return ((url || "").split("?")[0].match(/(?:\/|^)([^\/]+)$/) || {})[1];
    },

    /**
     * Returns an absolute url based on url.
     * @param {String} base the start of the url to which relative url's work.
     * @param {String} url  the url to transform.
     * @return {String} the absolute url.
     */
    getAbsolutePath : function(base, url){
        return !url || !base || url.match(/^\w+\:\/\//) ? url : base.replace(/\/$/, "") + "/" + url;
    },

    include : function(sourceFile, doBase){
        if (doBase) {
            var base = apf.basePath || "";
            if (sourceFile.indexOf(base) !== 0)
                sourceFile = base + sourceFile;
        }
//        apf.console.info("including js file: " + sourceFile);
        //o3.js.include(sourceFile);
        require("./" + sourceFile.replace(/\.js$/i, ""));
        //var fd = fs.child(sourceFile);
        //eval(fd.data, self);
    },
    
    $loader : {
        setGlobalDefaults : function(){
            
        },
        script : function(){
            for (var i = 0; i < arguments.length; i++) {
                apf.include(arguments[i], true);
            }
            return this;
        },
        wait : function(f){
            if (f) f();
            return this;
        }
    },
    
    Init : {
        add   : function(func, o){
            func.call(o);
        },
        
        addConditional : function(func, o, strObj){
            return func.call(o);
        },
        
        run : function(strObj){
        }
    },
    
    destroy : function(exclude){
        //Do cleanup
    }
};

Function.prototype.toHTMLNode = function(highlight){
    var code, line1, endLine1, line2, res;
    
    TYPE_OBJECT     = "Object";
    TYPE_NUMBER     = "Number";
    TYPE_STRING     = "String";
    TYPE_ARRAY      = "Array";
    TYPE_DATE       = "Date";
    TYPE_REGEXP     = "RegExp";
    TYPE_BOOLEAN    = "Boolean";
    TYPE_FUNCTION   = "Function";
    TYPE_DOMNODE    = "XMLNode";
    TYPE_APFNODE    = "AMLElement";
    
    STATE_UNDEFINED = "undefined";
    STATE_NULL      = "null";
    STATE_NAN       = "NaN";
    STATE_INFINITE  = "infinite";

    /**
     * @private
     */
    function getType(variable){
        if (variable === null)
            return STATE_NULL;
        if (variable === undefined)
            return STATE_UNDEFINED;
        if (typeof variable == "number" && isNaN(variable))
            return STATE_NAN;
        if (typeof variable == "number" && !isFinite(variable))
            return STATE_INFINITE;

    
        if (typeof variable == "object") {
            if (variable.hasFeature)
                return TYPE_APFNODE;
            if (variable.tagName || variable.nodeValue)
                return TYPE_DOMNODE;
        }
        
        if (typeof variable.dataType == "undefined")
            return TYPE_OBJECT;
        
        return variable.dataType;
    }
    
    //anonymous
    code     = this.toString();
    endLine1 = code.indexOf("\n");
    line1    = code.slice(0, endLine1);
    line2    = code.slice(endLine1+1);
    
    res      = /^function(\s+(.*?)\s*|\s*?)\((.*)\)(.*)$/.exec(line1);
    if (res) {
        var name = res[1];
        var args = res[3];
        var last = res[4]; //NOT USED?

        if (this.arguments) {
            var argName, namedArgs = args.split(",");
            args = [];

            for (var i = 0; i < this.arguments.length; i++) {
                //if(i != 0 && arr[i]) args += ", ";
                argName  = (namedArgs[i] || "NOT_NAMED").trim();// args += "<b>" + arr[i] + "</b>";
                
                args.push("[" + getType(this.arguments[i]) + "] " + argName);
                //info.push("Value: " + apf.vardump(this.arguments[i], null, false));
            }
        }
        
        return "  " + (name && name.trim() || "anonymous") + " (" + args.join(", ") + ")";
    }
    else {
        return this.toString();
    }
};

$setTimeout  = setTimeout;
$setInterval = setInterval;

apf.stacktrace = function(){
    var list = [], seen = {}, loop, end;
    
    //Opera doesnt support caller... weird...
    //try {
        loop = end = arguments.callee.caller.caller
          ? arguments.callee.caller.caller.caller
          : arguments.callee.caller.caller;

        if (loop) {
            //try {
                do {
                    if (seen[loop.toString()])
                        break; //recursion checker
                    seen[loop.toString()] = true;
                    //str += loop.toHTML();
                    list.push(loop.toHTMLNode());
                    loop = loop.caller;
                }
                while (list.length < 30 && loop && loop.caller && loop.caller.caller != loop);
            //}
            //catch(a) {
            //    list=[];
            //}
        }
    //}
    //catch(e){}

    return list.join("\n");
};

//#endif
