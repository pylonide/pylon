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

apf.asyncSafe = function(wrap){
    if( apf.asyncNoWrap )
        return func;
    return function() {
        try {
            if(this.log){
                var hooks;
            
                var logargs = Array.prototype.slice.call(arguments)
                hooks = this.log.apply(this, ["call",wrap].concat(logargs));

                if(hooks){
                    if(hooks.pre) // inject a pre-call
                        hooks.pre.apply(this, arguments);
                    if(hooks.post){ // inject a post-call 
                        var args = Array.prototype.slice.call(arguments);
                        var _pthis = this;
                        var cb = args[args.length-1];
                        args[args.length-1] = function(){
                            hooks.post.call(_pthis, logargs, arguments);
                            cb.apply(_pthis, arguments);
                        }
                        wrap.apply(this,args);
                    }else 
                        wrap.apply(this, arguments);
                }else
                    wrap.apply(this, arguments);
            }else{
                if(false){//apf.asyncFailAll){;
                    var args = Array.prototype.slice.call(arguments);
                    var cb = args[args.length-1];
                    args[args.length-1] = function(err){
                        if(err)
                            apf.console.error("Async Exception: "+err+"\n"+(new Error()).stack);
                        cb.apply(this,arguments);
                    }
                    wrap.apply(this, args);
                }else{
                    wrap.apply(this, arguments);
                }
            }
        } catch (e) {
            apf.console.error("Caught asyncSafe error: " + e.stack);
            arguments[arguments.length-1](e);
        }
    }
}

apf.syncSafe = function(wrap){
    if( apf.syncNoWrap )
        return func;
    
    return function() {
        if(this.log){
            var hooks;
            
            var logargs = Array.prototype.slice.call(arguments)
            hooks = this.log.apply(this, ["call",wrap].concat(logargs));

            if(hooks && hooks.pre) // inject a pre-call
                hooks.pre.apply(this, arguments);
                
            var retVal = wrap.apply(this, arguments)
                
            if(hooks && hooks.post) // inject a post-call 
                hooks.post.call(this, logargs, retVal);
            
            return retVal
        }else
            return wrap.apply(this, arguments);
    }
}

apf.asyncLog = function( logger ){
    return function(){
        var stack = new Error().stack;
        var m = stack.match(/(?:[^\n]*\n){2}.*?\.([\$A-Za-z0-9]+)(?:\s+\((.*?)\:(\d+)\:(\d+)\))?/);
        var name = m[1], file = m[2], line = m[3];
        var args =  Array.prototype.slice.call(arguments);
        var type = args.shift();
        var wrap = args.shift();
        return logger.call(this,file,line,name,type,args,stack,wrap);
    }
}

apf.asynclogOff = function(){
    for(k in apf.asyncLogOnSet){
        delete apf.asyncLogOnSet[k].log
    }
    apf.asyncLogOnSet = {};
}

apf.asyncLogOnSet = {};

apf.asyncLogOn = function(pattern) {
    var m = pattern.split("::");
    var proto = require(m[0]).prototype;
    apf.asyncLogOnSet[m[0]] = proto;
    var open = m[1].indexOf("(");
    var fname = m[1], fargs = [];
    if(open!=-1){
        fname = m[1].slice(0,open);
        fargs = m[1].slice(open+1,-1).split(/\s*,\s*/);
    }
    proto.log = apf.asyncLog(function(file, line, name, type, args, stack, wrap) {
        var names = (wrap.toString().match(/\((.*?)\)/)[1] || "").split(/\s*,\s*/);
        if (name == fname) {
            var s = [];
            var argobj = {};
            var skip = {};
            for(var i = 0;i<fargs.length;i++)
                if(fargs[i].charAt(0)=='!')skip[fargs[i].slice(1)] = 1;
            
            for(var i = 0,k,v;i<args.length;i++){
                argobj[k = names[i]] = v = args[i];
                s.push(k+" = "+ (skip[k]?"[skipped]":apf.dump(v)));
            }
            s = ['(',s.join(', '),')\n'];
            for(var i = 0;i<fargs.length;i++)if(fargs[i].charAt(0)!='!'){
                with(argobj){
                    s.push(fargs[i],' = ',eval(fargs[i]),'\n');
                }
            } 
            console.log(name + s.join(''));
        }
    });
}

//#endif __WITH_ASYNC