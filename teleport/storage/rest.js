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

// #ifdef __STORAGE_REST

jpf.storage["rest"] = 
jpf.storage["rest.post"] =
//jpf.storage["rest.delete"] =
//jpf.storage["rest.put"] =
jpf.storage["rest.get"] = 
jpf.storage["url"] = 
jpf.storage["url.post"] =
//jpf.storage["url.delete"] =
//jpf.storage["url.put"] =
jpf.storage["url.get"] = function(instrType, data, options, xmlContext, callback, multicall, userdata, arg, isGetRequest){
    var oPost = (instrType == "url.post") ? new jpf.post() : new jpf.get();

    //Need checks here
    var xmlNode = xmlContext;
    var x       = (instrType == "url.eval")
        ? eval(data.join(":")).split("?")
        : data.join(":").split("?");
    var url     = x.shift();
    
    var cgiData = x.join("?").replace(/\=(xpath|eval)\:([^\&]*)\&/g, function(m, type, content){
        if (type == "xpath") {
            var retvalue, o = xmlNode.selectSingleNode(RegExp.$1);
            if (!o)
                retvalue = "";
            else if(o.nodeType >= 2 && o.nodeType <= 4)
                retvalue = o.nodeValue;
            else
                retvalue = o.serialize ? o.serialize() : o.xml;
        }
        else if(type == "eval") {
            try {
                //Safely set options
                var retvalue = (function(){
                    //Please optimize this
                    if(options)
                        for(var prop in options)
                            eval("var " + prop + " = options[prop]");
                    
                    return eval(content);//RegExp.$1);
                })();
            }
            catch(e){
                //#ifdef __DEBUG
                throw new Error(0, jpf.formatErrorString(0, null, "Saving/Loading data", "Could not execute javascript code in process instruction '" + content + "' with error " + e.message));
                //#endif
            }
        }
        
        return "=" + retvalue + "&";
    });

    if (arg && arg.length) {
        var arg = arg[0];
        var pdata = arg.nodeType ? arg.xml || arg.serialize() : jpf.serialize(arg);
        url += "?" + cgiData;
    }
    else {
        //Get CGI vars
        var pdata = cgiData
    }
    
    //Add method and call it
    oPost.urls["saveData"] = url;
    oPost.addMethod("saveData", callback, null, true);
    oPost.callWithString("saveData", pdata, callback)
}

// #endif
