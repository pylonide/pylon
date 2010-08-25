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


//#ifdef __WITH_ASYNC

/**
 * @author      Fabian Jakobs
 * @version     %I%, %G%
 * @since       1.0
 *
 * @namespace apf
 *
 */

/**
 * Perform an async function in serial on each of the list items
 * 
 * @param {Array} list
 * @param {Function} async async function of the form function(item, callback)
 * @param {Function} callback function of the form function(error), which is
 *      called after all items have been processed
 */
apf.asyncForEach = function(list, async, callback) {
    var i = 0;
    var len = list.length;

    if (!len) return callback(null, []);

    async(list[i], function handler(err) {
        if (err) return callback(err);
        i++;

        if (i < len) {
            async(list[i], handler);
        } else {
            callback(null);
        }
    });
};


/**
 * Map each element from the list to the result returned by the async mapper
 * function. The mapper takes an element from the list and a callback as arguments.
 * After completion the mapper has to call the callback with an (optional) error
 * object as first and the result of the map as second argument. After all
 * list elements have been processed the last callback is called with the mapped
 * array as second argument.
 * 
 * @param {Array} list
 * @param {Function} mapper function of the form function(item, next)
 * @param {Function} callback function of the form function(error, result)
 */
apf.asyncMap = function(list, mapper, callback) {
    var i = 0;
    var len = list.length;

    if (!len) return callback(null, []);
    var map = [];

    async(list[i], function handler(err, value) {
        if (err) return callback(err);
        
        map[i] = value;
        i++;

        if (i < len) {
            async(list[i], handler);
        } else {
            callback(null, map);
        }
    });
};


/**
 * Chains an array of functions. Each of the functions except the last one must
 * have excatly one 'callback' argument, which has to be called after the functions has
 * finished. If the callback fails if has to pass a non null error object as
 * first argument to the callback.
 * 
 * @param {Array} funcs
 */
apf.asyncChain = function(funcs) {
    var i = 0;
    var len = funcs.length;
    
    function next() {
        var f = funcs[i++];
        if (i == len)
            f()
        else
            f(next)
    }
    
    next();
}

apf.asyncSafe = function(wrap, stringify){
    if( apf.asyncNoWrap )
        return func;
    return function() {
        try {
            if(this.log){
                var hooks;
            
                if(stringify)
                    hooks = this.log("call",stringify.apply(this,arguments));
                else {
                    var logargs = Array.prototype.slice.call(arguments)
                    logargs.unshift("call");
                    hooks = this.log.apply(this, logargs);
                }
                if(hooks){
                    if(hooks.pre) // inject a pre-call
                        hooks.pre.apply(this, arguments);
                    if(hooks.post){ // inject a post-call 
                        var args = Array.prototype.slice.call(arguments);
                        var _pthis = this;
                        var cb = args[args.length-1];
                        args[args.length-1] = function(){
                            hooks.post.apply(_pthis, arguments);
                            cb.apply(_pthis, arguments);
                        }
                        wrap.apply(this,args);
                    }else 
                        wrap.apply(this, arguments);
                }else
                    wrap.apply(this, arguments);
            }else
                wrap.apply(this, arguments);
        } catch (e) {
            apf.console.error("Caught asyncSafe error: " + e.stack);
            arguments[arguments.length-1](e);
        }
    }
}

apf.asyncLog = function( logger ){
    return function(){
        var stack = new Error().stack;
        var m = stack.match(/(?:[^\n]*\n){2}.*?\.([\$A-Za-z0-9]+)(?:\s+\((.*?)\:(\d+)\:(\d+)\))?/);
        var name = m[1], file = m[2], line = m[3];
        var args =  Array.prototype.slice.call(arguments);
        var type = args.shift();
        return logger.call(this,file,line,name,type,args,stack);
    }
}
/*
var p = require("livedoc").prototype;
p.log = apf.asyncLog(function(file, line, name, type, args, stack){
    if( name.match(/join|create|disconnect/) &&
        this.uri == "101"){
        return {
            pre: function(){}
            post: function(){}
       };
   }
});*/

//#endif __WITH_ASYNC