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

// #ifdef __DEBUG

/**
 * Returns a string giving information on a javascript object.
 *
 * @param {mixed} obj the object to investigate
 */
apf.dump =
apf.vardump = function(obj, o, depth, stack){
	o = o || {};
	if(o.maxdepth === undefined)o.maxdepth = 99;

    if (apf.isWebkit) //@todo RIK please fix this issue.
        return "";
    if (!obj) return obj + "";
    if (!stack) stack = "";
    if (!depth) depth = 0;
    var str;
    switch (obj.dataType) {
        case apf.STRING:
            return "\"" + (o.clip?(obj.length>o.clip?(obj.slice(0,o.clip)+"..."):obj):obj).replace(/[\"]/g,"'") + "\"";
        case apf.NUMBER:
            return obj;
        case apf.BOOLEAN:
            return (obj ? "true" : "false");
        case apf.DATE:
            return "Date(\"" + obj + "\)";
        case apf.ARRAY:
            if(obj[obj.length-2]=='$__vardump'){
                return "this"+obj[obj.length-1]; 
            }
            obj.push('$__vardump',stack);
            str = ["[ "];
            for (var i = 0; i < obj.length-2; i++) {
                str.push( str.length>1?",":"",
                    (depth >= o.maxdepth ? typeof(obj[i]) :
                    apf.vardump(obj[i], o, depth + 1, stack+'['+i+']')) );
            }
            str.push( " ]");
            obj.pop();obj.pop();
            return str.join('');
        default:
            if (typeof obj == "function")
                return "function";
        	if (obj.nodeType !== undefined)
                return o.xml?(str=obj.xml,o.clip?((str=str.replace(/\s*[\r\n]\s*/g,"")).length>o.clip?str.slice(0,o.clip)+"...>":str):str):("<" + obj.tagName+"../>") ;
                //return depth == 0 ? "[ " + (obj.xml || obj.serialize()) + " ]" : "XML Element";
            if (depth >= o.maxdepth)
                return "object";

            //((typeof obj[prop]).match(/(function|object)/) ? RegExp.$1 : obj[prop])
            if (obj['$__vardump']) return "this"+obj['$__vardump']+"";
            obj['$__vardump'] = stack;
            str = ["{"+(o.clip?"":"\n")];
            for (var prop in obj) if(prop!='$__vardump'){
            	if(o.clipobj && str.join('').length>o.clipobj){str.push( ", ..."); break;}
                try {
                    var propname = prop;
                    if(str.length>1)str.push(o.clip?", ":",\n");
                    str.push( o.clip?"":("\t".repeat(depth+1)), propname, ": ",
                      (depth >= o.maxdepth ? typeof(obj[prop]):
                        apf.vardump(obj[prop], o, depth + 1, stack+'.'+prop)) );
                } catch(e) {
                    str.push( o.clip?"":("\t".repeat(depth+1)) , prop , ": dumperror");
                }
            }
            str.push(o.clip?"":"\n", o.clip?"":("\t".repeat(depth)), "}");
            
            function cleanup(obj){
                if(obj['$__vardump']!== undefined)
                    delete obj['$__vardump'];
                else return;
                for(var prop in obj){
                    var v = obj[prop];
                    if(typeof(v)=='object' && v) cleanup(v);
                }
            }
            cleanup(obj);
            
            return str.join('');
    }
};

if (apf.isOpera) {
    window.console = {};
    ["log", "debug", "info", "warn", "error"].forEach(function(type) {
        window.console[type] = function() {
            if (typeof arguments === "undefined") return null;
            if (arguments.length === 1) { // single argument provided
                opera.postError(type + ": " + arguments[0]);
                return type + ": " + arguments[0];
            }
            var s      = arguments[0],
                // string substitution patterns of firebug console
                regexp = /%([sdifo])/g,
                i      = 0,
                match  = null;
            // replace found matches with given arguments
            while (match = regexp.exec(s)) {
                s = s.replace(match[0], String(arguments[++i]));
            }
            // display log messages
            var len = arguments.length;
            while (len > i++) {
                if (arguments[i]) {
                    s += ' ';
                    s += String(arguments[i]);
                }
            }
            opera.postError(type + ": " + s);
        };
    });
}

/**
 * Returns a string giving more detailed informations on a javascript object.
 *
 * @param {mixed} obj the object to investigate
 */
apf.dump2 =
apf.vardump2 = function (obj, depth, recur, stack){
    if(!obj) return obj + "";
    if(!depth) depth = 0;

    switch(obj.dataType){
        case "string":    return "\"" + obj + "\"";
        case "number":    return obj;
        case "boolean": return obj ? "true" : "false";
        case "date": return "Date[" + new Date() + "]";
        case "array":
            var str = "{\n";
            for(var i=0;i < obj.length;i++){
                str += "     ".repeat(depth+1) + i + " => " + (!recur && depth > 0 ? typeof obj[i] : apf.vardump(obj[i], depth+1, !recur)) + "\n";
            }
            str += "     ".repeat(depth) + "}";
            
            return str;
        default:
            if(typeof obj == "function") return "function";
            //if(obj.xml) return depth==0 ? "[ " + obj.xml + " ]" : "XML Element";
            if(obj.xml || obj.serialize) return depth==0 ? "[ " + (obj.xml || obj.serialize()) + " ]" : "XML Element";
            
            if(!recur && depth>0) return "object";
        
            //((typeof obj[prop]).match(/(function|object)/) ? RegExp.$1 : obj[prop])
            var str = "{\n";
            for(prop in obj){
                try{
                    str += "     ".repeat(depth+1) + prop + " => " + (!recur && depth > 0? typeof obj[prop] : apf.vardump(obj[prop], depth+1, !recur)) + "\n";
                }catch(e){
                    str += "     ".repeat(depth+1) + prop + " => [ERROR]\n";
                }
            }
            str += "     ".repeat(depth) + "}";
            
            return str;
    }
}

String.prototype.s = function(){
    return this.replace(/[\r\n]/g, "");
}

/**
 * Alerts string giving information on a javascript object.
 * This is older version of this function
 *
 * @param {mixed} obj the object to investigate
 */
apf.alert_r = function(obj, recur){
    alert(apf.vardump(obj, null, recur));
}

/**
 * Alerts string giving information on a javascript object.
 *
 * @param {mixed} obj the object to investigate
 */
apf.alert_r2 = function(obj, recur){
    alert(apf.vardump2(obj, null, !recur));
}

/**
 * Object timing the time between one point and another.
 *
 * @param {Boolean} nostart whether the profiler should start measuring at creation.
 * @constructor
 */
apf.ProfilerClass = function(nostart){
    this.totalTime = 0;

    /**
     * Starts the timer.
     * @param {Boolean} clear resets the total time.
     */
    this.start = function(clear){
        if (clear) this.totalTime = 0;
        this.startTime = new Date().getTime();

        this.isStarted = true;
    }

    /**
     * Stops the timer.
     * @method
     */
    this.stop =
    this.end = function(){
        if (!this.startTime) return;
        this.totalTime += new Date().getTime() - this.startTime;
        this.isStarted = false;
    }

    /**
     * Sends the total time to the console.
     * @param {String} msg Message displayed in the console.
     */
    this.addPoint = function(msg){
        this.end();
        apf.console.time("[TIME] " + (msg || "Profiled Section") + ": " + this.totalTime + "ms");
        this.start(true);
    }

    if (!nostart)
        this.start();
};

apf.Latometer = new apf.ProfilerClass(true);//backward compatibility

if (self.navigator && navigator.userAgent.indexOf("Opera") != -1) {
    window.console = {};
    ["log", "debug", "info", "warn", "error"].forEach(function(type) {
        window.console[type] = function() {
            if (typeof arguments === "undefined") return null;
            if (arguments.length === 1) { // single argument provided
                opera.postError(type + ": " + arguments[0]);
                return type + ": " + arguments[0];
            }
            var s      = arguments[0],
                // string substitution patterns of firebug console
                regexp = /%([sdifo])/g,
                i      = 0,
                match  = null;
            // replace found matches with given arguments
            while (match = regexp.exec(s)) {
                s = s.replace(match[0], String(arguments[++i]));
            }
            // display log messages
            var len = arguments.length;
            while (len > i++) {
                if (arguments[i]) {
                    s += ' ';
                    s += String(arguments[i]);
                }
            }
            opera.postError(type + ": " + s);
        };
    });
}

// #endif
