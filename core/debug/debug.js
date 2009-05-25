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
jpf.dump=
jpf.vardump = function(obj, depth, norecur, stack){
    if (!obj) return obj + "";
    if (!stack)stack = "";
    if (!depth) depth = 0;

    var str;
    switch (obj.dataType) {
        case "string":
            return "\"" + obj + "\"";
        case "number":
            return obj;
        case "boolean":
            return (obj ? "true" : "false");
        case "date":
            return "Date(\"" + obj + "\)";
        case "array":{
            if(obj[obj.length-2]=='$__vardump'){
                return "this"+obj[obj.length-1]; 
            }
            obj.push('$__vardump',stack);
            str = ["[ "];
            for (var i = 0; i < obj.length-2; i++) {
                str.push( str.length>1?",":"",
                    (norecur && depth > 0 ? "{/*"+typeof(obj[i])+"*/}" :
                    jpf.vardump(obj[i], depth + 1, norecur, stack+'['+i+']')) );
            }
            str.push( " ]");
            obj.pop();obj.pop();
            return str.join('');
        }
        default:
            
            if (typeof obj == "function")
                return "{/*function*/}";
            if (obj.nodeType !== undefined && obj.style && depth != 0)
                return "{/*HTML Element: " + obj.tagName + "*/}";
            if (obj.nodeType !== undefined)
                return "{/*XML Element : " + obj.tagName + "*/}";
                //return depth == 0 ? "[ " + (obj.xml || obj.serialize()) + " ]" : "XML Element";
            if (norecur && depth > 0)
                return "{/*object/*}";

            //((typeof obj[prop]).match(/(function|object)/) ? RegExp.$1 : obj[prop])
            if(obj['$___vardump'])return "this"+obj['$___vardump']+"";
            obj['$___vardump'] = stack;
            str = ["{\n"];            
           
            for (var prop in obj) if(prop!='$___vardump'){
                try {
                    if(str.length>1)str.push(",\n");
                    str.push( "\t".repeat(depth+1), prop, ": ",
                      (norecur && depth > 0 ? "{/*"+typeof(obj[prop])+"*/}":
                        jpf.vardump(obj[prop], depth + 1, norecur, stack+'.'+prop)) );
                } catch(e) {
                    str.push( "\t".repeat(depth+1) , prop , ": null /*ERROR*/");
                }
            }
            str.push( "\n", ("\t".repeat(depth)), "}");
            
            function cleanup(obj){
                if(!obj['$__vardump'])return;
                delete obj['$___vardump'];
                for(var prop in obj){
                    var v = obj[prop];
                    if(typeof(v)=='object')cleanup(obj);
                }
            }           
            if(depth==0)cleanup(obj);
            
            return str.join('');
    }
}

String.prototype.s = function(){
    return this.replace(/[\r\n]/g, "");
}

/**
 * Alerts string giving information on a javascript object.
 *
 * @param {mixed} obj the object to investigate
 */
jpf.alert_r = function(obj, recur){
    alert(jpf.vardump(obj, null, !recur));
}

/**
 * Object timing the time between one point and another.
 *
 * @param {Boolean} nostart whether the profiler should start measuring at creation.
 * @constructor
 */
jpf.ProfilerClass = function(nostart){
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
        jpf.console.time("[TIME] " + (msg || "Profiled Section") + ": " + this.totalTime + "ms");
        this.start(true);
    }

    if (!nostart)
        this.start();
};

jpf.Latometer      = new jpf.ProfilerClass(true);//backward compatibility

// #endif
