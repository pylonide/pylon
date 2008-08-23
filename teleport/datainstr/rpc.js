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

// #ifdef __DATAINSTR_RPC

jpf.datainstr.rpc = function(instrType, data, options, xmlContext, callback, multicall, userdata, arg, isGetRequest){
    var parsed = this.parseInstructionPart(data.join(":"), xmlContext, arg);
    arg        = parsed.arguments;
    
    var q      = parsed.name.split(".");
    var obj    = eval(q[0]);
    var method = q[1];
    
    //#ifdef __DEBUG
    if (!obj)
        throw new Error(0, jpf.formatErrorString(0, null, "Saving/Loading data", "Could not find RPC object by name '" + q[0] + "' in process instruction '" + instruction + "'"));
    //#endif

    //force multicall if needed;
    if (multicall)
        obj.force_multicall = true;
    
    //Set information later neeed
    //#ifdef __DEBUG
    if (!obj[method])
        throw new Error(0, jpf.formatErrorString(0, null, "Saving/Loading data", "Could not find RPC function by name '" + method + "' in process instruction '" + instruction + "'"));
    //#endif
    
    if (userdata)
        obj[method].userdata = userdata;
    if (!obj.multicall)
        obj.callbacks[method] = callback; //&& obj[method].async
    
    //Call method
    var retvalue = obj.call(method, arg
        ? obj.fArgs(arg, obj.names[method], (obj.vartype != "cgi" && obj.vexport == "cgi"))
        : null);

    if (obj.multicall)
        return obj.purge(callback, "&@^%!@");
    else if (multicall) {
        obj.force_multicall = false;
        return obj;
    }

    //Call callback for sync calls
    if (!obj.multicall && !obj[method].async && callback)
        callback(retvalue);
}

// #endif
