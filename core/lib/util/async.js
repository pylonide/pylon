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
                
                if(apf.asyncCheck){
                    if(!hooks)hooks = {};
                    var post = hooks.post;
                    hooks.post = function(input,result){
                        if(result[0])
                            apf.console.error("Async Exception: "+result[0]+"\n"+(new Error()).stack);
                        if(post)
                            post.apply(this, arguments);
                    }
                }
                
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
                if(apf.asyncCheck){;
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
        var args =  Array.prototype.slice.call(arguments);
        var type = args.shift();
        if (typeof args[0] == "function")
            var wrap = args.shift();
        return logger.call(this,m[2],m[3],m[1],type,args,stack,wrap);
    }
}

apf.asyncLogOff = function(module){
    if(!module){
        for(k in apf.asyncLogOnSet){
            delete apf.asyncLogOnSet[k].log
        }
        apf.asyncLogOnSet = {};
    } else {
        var k = apf.asyncLogOnSet[module];
        if(k){
            delete k.log;
            delete k._log;
            delete apf.asyncLogOnSet[module];
        }
    }
}

apf.asyncLogOnSet = {};

apf.asyncLogOn = function(pattern, hooks) {

    var m = pattern.split("::");
    var mod = m[0];
    if(m.length==1)m[1]="";
    var proto = require(mod).prototype;
    var open = m[1].lastIndexOf("{");
    var fname = m[1], fargs = [];
    if(open!=-1){
        fname = m[1].slice(0,open);
        fargs = m[1].slice(open+1,-1).split(/\s*,\s*/);
        if(fargs.length==1 && fargs[0]=="")fargs = [];
    }
    var fnamerx = new RegExp(fname);

    apf.asyncLogOnSet[mod] = proto;

    var prev = proto._log;
    
    proto._log = function(file, line, name, type, args, stack, wrap) {
        if(prev)
            prev.apply(this, arguments);
        
        if(hooks && m[1]=="" && typeof(hooks)=='function')
            return hooks.apply(this,arguments);

        if (name.match(fnamerx)) {
            if(args.length){
                var names;
                if(wrap.__args)
                    names = wrap.__args;
                else
                    names = wrap.__args = (wrap.toString().match(/\((.*?)\)/)[1] || "").split(/\s*,\s*/);
            }
            var s = [], t = [], i, k, v;
            var argobj = {};
            var skip = {};
            for(i = 0;i<fargs.length;i++)
                if(fargs[i].charAt(0)=='!')skip[fargs[i].slice(1)] = 1;

            for(i = 0;i<args.length;i++){
                argobj[names[i]] = args[i];
            }
            for(i = 0;i<fargs.length;i++)if((k=fargs[i]).charAt(0)!='!'){
                if(k.match(/\=\=|\!\=|\<|\>/)){ // eval as bool filter
                    with(argobj){
                        try{
                            if( !eval(k) ) return;
                        }catch(e){
                            return;
                        }
                    }
                } else {
                    with(argobj){
                        try{
                            if(k == '#')
                                t.push('stacktrace = ' +(new Error().stack));
                            else
                                t.push('  '+k+' = '+eval(k));
                         } catch(e){
                            t.push('  '+k+' = [eval exception]\n');
                         }
                    }
                }
            }
            for(i = 0;i<args.length;i++){
                k = names[i], v = args[i];
                if(k)
                    s.push(k+" = "+ (skip[k]?"[skipped]":apf.dump(v)));
                else
                    s.push(apf.dump(v));
            }
            if(hooks){
                if(typeof(hooks)=='function')
                    return hooks.apply(this,arguments);
                else{
                    if(hooks.log)
                        hooks.log.apply(this,arguments);
                    return hooks;
                }   
            }else
                console.log(mod+"::"+name + "("+ s.join(', ')+")" +(t.length?("\n"+t.join('\n')):""));
        }
    };
    proto.log = apf.asyncLog( proto._log );    
}

//#endif __WITH_ASYNC