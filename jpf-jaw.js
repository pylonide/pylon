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

/** 
 * Javeline Platform for jaw
 *
 * @author    Ruben Daniels ruben@javeline.com
 * @version   1.0
 * @url       http://www.ajax.org
 */

//Start of the Javeline PlatForm namespace
jpf = {
    /*#ifdef __JFWVERSION
    VERSION       : '__JFWVERSION',
    #else*/
    VERSION       : false,
    //#endif

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
    
    start : function(){
        this.host     = null;
        this.hostPath = null;
        this.CWD      = null;
        this.TAGNAME  = "localName";
        
        //this.importClass(runJaw, true);
        jpf.runJaw();
        
        jpf.xmldb = new jpf.XmlDatabase();
        
        this.inherit(jpf.Class);
    },
    
    // #ifndef __PACKAGED
    startDependencies : function(){
        var i;
        // Load Kernel Modules
        for (i = 0; i < this.KernelModules.length; i++)
            jpf.include("core/" + this.KernelModules[i], true);
        
        // Load TelePort Modules
        for (i = 0; i < this.TelePortModules.length; i++)
            jpf.include("elements/teleport/" + this.TelePortModules[i], true);

        for (i = 0; i < this.Jaw.length; i++)
            jpf.include("./" + this.Jaw[i], true);
        
        // Load Components
        for (i = 0; i < this.Components.length; i++) {
            var c = this.Components[i];
            jpf.include("elements/" + c + ".js", true);
        }
        
        jpf.start();
    },
    
    importClass : function(ref, strip, win){
        if (!ref)
            throw new Error(jpf.formatErrorString(1018, null, 
                "importing class", 
                "Could not load reference. Reference is null"));
    
        if (!strip)
            return jpf.exec(ref.toString());
        
        var q = ref.toString().replace(/^\s*function\s*\w*\s*\([^\)]*\)\s*\{/, "");
        q = q.replace(/\}\s*$/, "");
        
        //var q = ref.toString().split("\n");q.shift();q.pop();
        //if(!win.execScript) q.shift();q.pop();
    
        return jpf.exec(q);
    },
    
    /**
    * This method returns a string representation of the object
    * @return {String}    Returns a string representing the object.
    * @method
    */
    toString : function(){
        return "[Javeline (jpf)]";
    },
    
    all : [],
    
    /**
    * This method inherit all properties and methods to this object from another class
    * @param {Function}    classRef    Required Class reference 
    * @method
    */
    inherit : function(classRef){
        for (var i=0; i<arguments.length; i++) {
            //#ifdef __DEBUG
            if (!arguments[i]) {
                throw new Error(jpf.formatErrorString(0, this, 
                    "Inheriting class", 
                    "Could not inherit from '" + classRef + "'", 
                    this.$jml));
            }
            //#endif
            
            arguments[i].call(this);//classRef
        }
        
        return this;
    },
    
    /**
    * This method transforms an object into a Javeline Class
    * @param {Object}    oBlank Required Object to be transformed into a Javeline Class
    * @method
    */
    makeClass : function(oBlank){
        if (oBlank.inherit) return;
        
        oBlank.inherit = this.inherit;
        oBlank.inherit(jpf.Class);
        
        oBlank.uniqueId = this.all.push(oBlank) - 1;
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
            var dt   = new Date();
            var ms   = String(dt.getMilliseconds());
            while (ms.length < 3) ms += "0";
            var date = dt.getHours() + ":"
                + dt.getMinutes()    + ":"
                + dt.getSeconds()    + "."
                + ms;
            
            root.out.write((nodate ? "" : date) + " " + msg + "\n" + (data ? "Extra information:\n" + data + "\n" : ""));
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
            this.write("Fatal error: " + msg + "\nStacktrace:\n" + jpf.stacktrace(), "error", subtype, data);
            out.write("Execution stopped");
            //#endif
            throw new Error();
            //this.write(jpf.stacktrace());
        },
        
        dir : function(obj){
            this.info(jpf.vardump(obj, null, true));
        }
    },

    namespace : function(name, oNamespace){
        eval("jpf." + name + " = oNamespace");
    },
    
    formatErrorString : function(number, control, process, message, jmlContext, outputname, output){
        //#ifdef __DEBUG
        var str = ["---- Javeline Error ----"];
        if (jmlContext) {
            var jmlStr = (jmlContext.outerHTML || jmlContext.xml || jmlContext.serialize())
                .replace(/\<\?xml\:namespace prefix = j ns = "http\:\/\/www.javeline.com\/2005\/jml" \/\>/g, "")
                .replace(/xmlns:j="[^"]*"\s*/g, "");
            
            //Set file and line number
            str.push("jml file: [line: " + linenr + "] " + file);
        }
        if (control)
            str.push("Control: '" 
                + (control.name 
                    || (control.$jml ? control.$jml.getAttribute("id") : null) 
                    || "{Anonymous}")
                + "' [" + control.tagName + "]");
        if (process)
            str.push("Process: " + process.replace(/ +/g, " "));
        if (message)
            str.push("Message: [" + number + "] " + message.replace(/ +/g, " "));
        if (outputname)
            str.push(outputname + ": " + output);
        if (jmlContext)
            str.push("\n===\n" + jmlStr);

        return str.join("\n");
        //#endif
    },
    
    /* Init */
    
    include : function(sourceFile, doBase){
        jpf.console.info("including js file: " + sourceFile);
        include(sourceFile);
        //var fd = fs.child(sourceFile);
        //eval(fd.data, self);
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
    TYPE_JAVNODE    = "JMLElement";
    
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
                return TYPE_JAVNODE;
            if (variable.tagName || variable.nodeValue)
                return TYPE_DOMNODE;
        }
        
        if (variable.dataType == undefined)
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
                argName  = (namedArgs[i] || "__NOT_NAMED__").trim();// args += "<b>" + arr[i] + "</b>";
                
                args.push("[" + getType(this.arguments[i]) + "] " + argName);
                //info.push("Value: " + jpf.vardump(this.arguments[i], null, false));
            }
        }
        
        return "  " + (name && name.trim() || "anonymous") + " (" + args.join(", ") + ")";
    }
    else {
        return this.toString();
    }
};

jpf.stacktrace = function(){
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
