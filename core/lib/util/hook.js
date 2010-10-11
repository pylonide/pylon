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


//#ifdef __WITH_WRAP

/**
 * @author      Rik Arends
 * @version     %I%, %G%
 * @since       1.0
 *
 * @namespace apf
 *
 */

apf.asyncCheck = 1;
apf.asyncCheckError = 1;
apf.asyncCheckIgnore = 0;
apf.asyncCheckTimeout = 0;

apf.hookWrapAsync = function(inner){
    var outer = function() {
        try {
            if(outer._hooks){
               
                var args = Array.prototype.slice.call(arguments)
                
                if(outer._posts || apf.asyncCheck){
                    var callback = args.splice(-1,1,function(err){
                        var results = null;
                        if(outer._posts){
                            results = Array.prototype.slice.call(arguments)
                            for(var i = 0;i<outer._posts.length;i++)
                                 outer._posts[i].call(this,outer,inner,args,callback,results);
                        }
                        if(apf.asyncCheck && err)
                            apf.console.error("Caught asyncSafe error: "+err+"\n"+(new Error()).stack);
                            
                        callback.apply(this,results?results:arguments);
                    })[0];
                }
                if(outer._pres){
                    for(var i = 0;i<outer._pres.length;i++)
                         outer._pres[i].call(this,outer,inner,args);
                }
                return inner.apply(this, args);
            }
            if(apf.asyncCheck){
                if(apf.asyncCheckError){
                    var args = Array.prototype.slice.call(arguments);
                    var oldcb = args.splice(-1,1,function(err){
                        if(err)
                            apf.console.error("Caught hookAsync error: "+err+"\n"+(new Error()).stack);
                        oldcb.apply(this,arguments);
                    })[0];
                }
                if(apf.asyncCheckIgnore){
                    var names = apf.getFunctionArgs(oldcb);
                    if(names[0]!='err'){
                         apf.console.error("Caught hookAsync error ignore in function \n"+oldcb.toString());
                    }
                }
                if(apf.asyncCheckTimeout){
                    // lets inject a timeout check
                    var args = Array.prototype.slice.call(arguments);
                    var timeout;
                    var oldcb = args.splice(-1,1,function(err){
                        clearTimeout(timeout);
                        var cb = oldcb; oldcb = null;
                        if(cb)
                            cb.apply(this,arguments);
                    })[0];
                    
                    timeout = setTimeout(function(){
                        clearTimeout(timeout);
                        var cb = oldcb; oldcb = null;
                        if(cb){
                            apf.console.log("Hook Timeout: " + outer._name + "(" + apf.hookArgDump(args, apf.getFunctionArgs(inner)) + ")" + inner.toString());
                            //cb.call(this,new Error("Timeout ocurred in hookAsync for callback"));
                        }
                    },3000);
                }
                return inner.apply(this, args);
            }
            return inner.apply(this, arguments);
        } catch (e) {
            apf.console.error("Caught hookAsync exception: " + e.stack);
//			process.exit(0);
            arguments[arguments.length-1](e);
        }
    }
    outer._inner = inner;
    return outer;
}

apf.hookWrapSync = function(inner){
    var outer = function() {
        if(outer._hooks){
        	
            var args = Array.prototype.slice.call(arguments)

            if(outer._pres){
                outer._callee = arguments.callee;
                outer._caller = arguments.callee.caller;
                for(var i = 0;i<outer._pres.length;i++){
                    args = outer._pres[i].call(this,outer,inner,args);
                }
                outer._callee = outer._caller = null;
            }
            
            var results = inner.apply(this, arguments)
            
            if(outer._posts){
                outer._callee = arguments.callee;
                outer._caller = arguments.callee.caller;
                for(var i = 0;i<outer._posts.length;i++)
                    results = outer._posts[i].call(this,outer,inner,args,null,results);
               outer._callee = outer._caller = null;
            }
        
            return results;
        }
        return inner.apply(this, arguments);
    }
    outer._inner = inner;
    return outer;
}

apf.getFunctionArgs = function(func){
    return func._argnames || (func._argnames= (func.toString().match(/\((.*?)\)/)[1] || "").split(/\s*,\s*/))
}

apf.hookWrap = function ( func, onlyasync ){
    if(func._outer) 
        return func._outer;
    var names;
    if(!func._inner){ // lets detect async or sync hooking
        names = apf.getFunctionArgs(func);
        var last = names[names.length-1];
        if(last == 'callback' || last=='_isasync')
            return apf.hookWrapAsync( func );
        else if(!onlyasync)
            return apf.hookWrapSync( func );
    }
    return func;
}

apf.hookPre = function ( func, forcesync, cb){
    var hooked = func._inner?func:(forcesync?apf.hookWrapSync(func):apf.hookWrap(func));
    (hooked._pres || (hooked._pres=[])).push(cb);
    hooked._hooks = 1;
    return hooked;
}

apf.hookPost = function ( func, forcesync, cb){
    var hooked = func._inner?func:(forcesync?apf.hookWrapSync(func):apf.hookWrap(func));
    (hooked._posts || (hooked._posts=[])).push(cb);
    hooked._hooks = 1;
    return hooked;
}

apf.hookUnwrap = function( func ){

    if(func._inner){
        func._inner._outer = func;
        return func._inner;
    }
    return func;
}

apf.hookClear = function( func ){
    var f = func;
    if(f._outer)
        f = f._outer;
    if(f._pres)
        delete f._pres;
    if(f._posts)
        delete f._posts;
    return func;
}

apf.hookArgDump = function(data,names,opts){
    // lets dump some stuff
	if(!opts) opts = {maxdepth:1};
    if (typeof(names) == 'number')
         maxdepth = names, names = undefined;
         
    if(names){
        var s = [];
        for(var i = 0;i<names.length;i++)
             s.push(names[i]+" = "+apf.dump(data[i],opts));
        for(;i<data.length;i++)
             s.push('ext'+(i-names.length)+" = "+apf.dump(data[i],opts));
        return s.join(', ');
    }
    return apf.dump(data,opts);
}

apf.hookFormat = function(func, pre, format, name, module, forcesync, outputcb) {
    // compile our livemarkup format
    var global = {};
    
    var code = apf.lm.parseExpression(format);
    // lets create the log function code
    function stack(){
        return new Error().stack;
    }
    
    var dump = apf.hookArgDump;
    
    function where(equal){
        if(!equal) throw 0;
        return '';
    }
    
    function arg2obj(argfunc, args, global, key){
        var names, obj = {};
        if(!(names=argfunc._argnames)){
            names = argfunc._argnames = (argfunc.toString().match(/\((.*?)\)/)[1] || "").split(/\s*,\s*/);
        }
        global[key.slice(0,-1)+'names'] = names;

        if(names.length<=1 && names[0]=="")
            return global[key] = args;
        
        for(var i = 0;i<names.length;i++)
            global[names[i]] = obj[names[i]] = args[i];
        
        for(;i<args.length;i++)
            global['ext'+(i-names.length)] = obj['ext'+(i-names.length)] = args[i];

        global[key] = args;
        global[key.slice(0,-1)] = obj;
    }
    
    eval("function fmt(global,_n){with(global){ return "+code+";}}");
   
    // lets put a log hook pre or post
    if( pre ) {// we are a pre log hook
        return apf.hookPre( func, forcesync, function(outer, inner, args){

            arg2obj(inner, args, global, 'args');
            global._name = name;
            global._caller = outer._caller;
            global._callee = outer._callee;
            global._module = module;
            
            
            try{
                var out =fmt.call(this,global,this);
                if(out)
                    outputcb( out );
            }catch(e){
                if(e)
                    outputcb("Exception "+ e );
            }
            return args;
        });
    } else { // post log hook
        return apf.hookPost( func, forcesync, function(outer, inner, args, callback, results){

            arg2obj(inner, args, global, 'args');
            if(callback)
                arg2obj(callback, results, global, 'results');
            else
                global.results = [results], global.resultnames = ['retval'];
            global._name = name;
            global._caller = outer._caller;
            global._callee = outer._callee;
            global._module = module;
            
            try{
                var out =  fmt(global,this);
                if(out)
                    outputcb( out );
            }catch(e){
                if(e)
                    outputcb( "Exception "+e );
            }
            return results;
        });
    };
}

//#endif __WITH_WRAP