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

/*
    Data Instructions:
    --------------------
    Offer a single method for setting and retrieving data from different
    data sources. For instance from a webserver using REST and RPC, or 
    from local data sources such as gears, air, o3, html5 or
    from in memory sources from javascript or cookies.
*/

 
//#ifdef __WITH_DSINSTR

/** 
 * Execute a process instruction
 * @todo combine:
 * + jpf.teleport.callMethodFromNode (except submitform)
 * + ActionTracker.doResponse
 * + MultiSelect.add
 * + rewrite jpf.Model.parse to support load/submission -> rename to loadJML
 * + fix .doUpdate in Tree
 * + fix .extend in Model
 * + add Model.loadFrom(instruction);
 * + add Model.insertFrom(instruction, xmlContext, parentXMLNode, jmlNode);
 * + remove url attribute in insertJML function
 * @see jpf.teleport#processArguments
 *
 * <j:Bar rpc="" jml="<get_data>" />
 * <j:bindings>
 *   <j:load select="." get="<get_data>" />
 *   <j:insert select="." get="<get_data>" />
 * </j:bindings>
 * <j:actions>
 *   <j:rename set="<save_data>" />
 *   <j:add get="<same_as_model>" set="<save_data>" />
 * </j:actions>
 * 
 * <j:list model="<model_get_data>" />
 * 
 * <j:model load="<get_data>" submission="<save_data>" />
 * <j:smartbinding model="<model_get_data>" />
 */
 
//instrType, data, xmlContext, callback, multicall, userdata, arg, isGetRequest
jpf.datainstr = {
    "call" : function(xmlContext, options, callback){
        var parsed = options.parsed || this.parseInstructionPart(
            options.instrData.join(":"), xmlContext, options.args);
        
        //#ifdef __DEBUG
        if (!self[parsed.name])
            throw new Error(jpf.formatErrorString(0, null, 
                "Saving/Loading data", "Could not find Method '" + q[0] + "' \
                in process instruction '" + instruction + "'"));
        //#endif
        
        if (options.preparse) {
            options.parsed = parsed;
            options.preparse = false;
            return;
        }
        
        //Call method
        var retvalue = self[parsed.name].apply(null, parsed.arguments);
        
        //Call callback
        if (callback)
            callback(retvalue, jpf.SUCCESS, options);
    },
    
    "eval" : function(xmlContext, options, callback){
        try {
            var retvalue = options.parsed || eval(options.instrData[1]);
        }
        catch(e) {
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, null, "Saving data", 
                "Could not execute javascript code in process instruction \
                '" + instruction + "' with error " + e.message));
            //#endif
        }
        
        if (options.preparse) {
            options.parsed = retvalue;
            options.preparse = false;
            return;
        }
        
        if (callback)
            callback(retvalue, jpf.SUCCESS, options);
    }
    
    // #ifdef __WITH_COOKIE
    ,cookie: function(xmlContext, options, callback){
        var query  = options.instrData.join(":");
        var parsed = options.parsed || query.indexOf("=") > -1 
            ? this.parseInstructionPart(query.replace(/\s*=\s*/, "(") + ")", 
                xmlContext, arg)
            : {name: query, args: options.args || [xmlContext]};
        
        if (options.preparse) {
            options.parsed = parsed;
            options.preparse = false;
            return;
        }
    
        var value;
        if (options.isGetRequest) {
            value = jpf.getcookie(parsed.name);
            value = value ? jpf.unserialize(value) || "" : "";
        }
        else {
            value = jpf.setcookie(parsed.name, 
                jpf.serialize(parsed.args[0]));
        }

        if (callback)
            callback(value || parsed.args[0], jpf.SUCCESS, options);
    }
    
    // #endif
}

/**
 * save_data : as specified above -> saves data and returns value, optionally in callback
 * @syntax
 * - set="url:http://www.bla.nl?blah=10&zep=xpath:/ee&blo=eval:10+5&"
 * - set="url.post:http://www.bla.nl?blah=10&zep=xpath:/ee&blo=eval:10+5&"
 * - set="rpc:comm.submit('abc', xpath:/ee)"
 * - set="call:submit('abc', xpath:/ee)"
 * - set="eval:blah=5"
 * - set="cookie:name.subname(xpath:.)"
 */
//multicall, userdata, args, isGetRequest
jpf.saveData = function(instruction, xmlContext, options, callback){
    if (!instruction) return false;
    
    if (!options) options = {};
    options.instrData = instruction.split(":");
    options.instrType = options.instrData.shift();

    //#ifdef __DEBUG
    options.instruction = instruction;
    if (!this.datainstr[options.instrType])
        throw new Error(jpf.formatErrorString(0, null, 
            "Processing a data instruction", 
            "Unknown data instruction format: " + options.instrType));
    //#endif
    
    /*
        Having a lookup table with functions is probably
        slower than the switch statement that was here.
        Check if this has any realworld negative impact.
        :: The packager could convert this back to a switch
    */
    
    this.datainstr[options.instrType].call(this, xmlContext, options, callback);
}

/**
 * get_data : same as above + #name:select:xpath en name:xpath -> returns data via a callback
 * @syntax
 * - get="id"
 * - get="id:xpath"
 * - get="#component"
 * - get="#component:select"
 * - get="#component:select:xpath"
 * - get="#component"
 * - get="#component:choose"
 * - get="#component:choose:xpath"
 * - get="#component::xpath"
 * ? - get="::xpath"
 * - get="url:http://www.bla.nl?blah=10&zep=xpath:/ee&blo=eval:10+5&|ee/blah:1"
 * - get="rpc:comm.submit('abc', xpath:/ee)|ee/blah:1"
 * - get="call:submit('abc', xpath:/ee)|ee/blah:1"
 * - get="eval:10+5"
 */
jpf.getData = function(instruction, xmlContext, options, callback){
    var instrParts = instruction.match(/^([^\|]*)(?:\|([^|]*)){0,1}$/);
    var operators  = (instrParts[2]||"").split(":");
    
    var gCallback  = function(data, state, extra){
        if (state != jpf.SUCCESS)
            return callback(data, state, extra);
        
        operators[2] = data;
        if (operators[0] && data) {
            if (typeof data == "string")
                data = jpf.xmldb.getXml(data);

            data = data.selectSingleNode(operators[0]);
            
            //Change this to warning?
            if (!data) {
                throw new Error(jpf.formatErrorString(0, null, 
                    "Loading new data", "Could not load data by doing \
                    selection on it using xPath: '" + operators[0] + "'."));	
            }
        }
        
        extra.userdata = operators;
        return callback(data, state, extra);
    }
    
    if (!options) options = {};
    options.isGetRequest = true;
    options.userdata     = operators;
    
    //Get data operates exactly the same as saveData...
    if (this.saveData(instrParts[1], xmlContext, options, gCallback) !== false)
        return;
    
    //...and then some
    var data      = instruction.split(":");
    var instrType = data.shift();
    
    if (instrType.substr(0, 1) == "#") {
        instrType = instrType.substr(1);
        var retvalue, oJmlNode = self[instrType];
        
        //#ifdef __DEBUG
        if (!oJmlNode)
            throw new Error(jpf.formatErrorString(0, null, "Loading data", 
                "Could not find object '" + instrType + "' referenced in \
                process instruction '" + instruction + "' with error " 
                + e.message));
        //#endif
        
        if (!oJmlNode.value)
            retvalue = null;
        else
            retvalue = data[2]
                ? oJmlNode.value.selectSingleNode(data[2])
                : oJmlNode.value;
    }
    else {
        var model = jpf.nameserver.get("model", instrType);
        
        //#ifdef __DEBUG
        if (!model) {
            throw new Error(jpf.formatErrorString(1068, jmlNode, 
                "Loading data", "Could not find model by name: " 
                + instrType, x));
        }
        //#endif
        
        if (!model.data)
            retvalue = null;
        else
            retvalue = data[1]
                ? model.data.selectSingleNode(data[1])
                : model.data;
    }
    
    if (callback)
        gCallback(retvalue, jpf.SUCCESS, {userdata:operators});
    else {
        jpf.console.warn("Returning data directly in jpf.getData(). \
            This means that all callback communication ends in void!");
        return retvalue;
    }
}

//#ifdef __WITH_MODEL
/**
 * Creates a model object based on a data instruction
 */
jpf.setModel = function(instruction, jmlNode, isSelection){
    if (!instruction) return;

    var data      = instruction.split(":");
    var instrType = data[0];
    
    //So are we sure we shouldn't also check .dataParent here?
    var model = jmlNode.getModel();
    if(model) 
        model.unregister(jmlNode);

    if (jpf.datainstr[instrType]) {
        jmlNode.setModel(new jpf.Model().loadFrom(instruction));
    }
    else if (instrType.substr(0,1) == "#") {
        instrType = instrType.substr(1);
        
        if (isSelection) {
            var sb2 = jmlNode.getSelectionSmartBinding() 
                || jpf.JMLParser.getFromSbStack(jmlNode.uniqueId, 1);
            if (sb2)
                sb2.__model = new jpf.Model().loadFrom(instruction);
        }
        else if (!self[instrType] || !jpf.JMLParser.inited) {
            jpf.JMLParser.addToModelStack(jmlNode, data)
        }
        else {
            var oConnect = eval(instrType);
            if (oConnect.connect)
                oConnect.connect(jmlNode, null, data[2], data[1] || "select");
            else
                jmlNode.setModel(new jpf.Model().loadFrom(instruction));
        }
        
        jmlNode.connectId = instrType;
    }
    else {
        var instrType = data.shift();
        model = instrType == "@default"
            ? jpf.JMLParser.globalModel
            : jpf.nameserver.get("model", instrType);

        //#ifdef __DEBUG
        if (!model) {
            throw new Error(jpf.formatErrorString(1068, jmlNode, 
                "Finding model", "Could not find model by name: " + instrType));
        }
        //#endif
        
        if (isSelection) {
            var sb2 = jmlNode.getSelectionSmartBinding()
                || jpf.JMLParser.getFromSbStack(jmlNode.uniqueId, 1);
            if (sb2) {
                sb2.__model = model;
                sb2.modelXpath[jmlNode.uniqueId] = data.join(":");
            }
        }
        else
            jmlNode.setModel(model, data.join(":"));
    }
}
//#endif

jpf.parseInstructionPart = function(instrPart, xmlNode, arg, options){
    var parsed  = {}, s = instrPart.split("(");
    parsed.name = s.shift();
    
    //Get arguments for call
    if (!arg) {
        arg = s.join("(");
        
        //#ifdef __DEBUG
        if (arg.substr(arg.length-1) != ")") {
            throw new Error(jpf.formatErrorString(0, null, "Saving data", 
                "Syntax error in instruction. Missing ) in " + instrPart));
        }
        //#endif
        
        arg = arg.substr(0, arg.length-1);
        arg = arg ? arg.split(",") : []; //(?=\w+:) would help, but makes it more difficult
        
        for (var i = 0; i < arg.length; i++) {
            if (typeof arg[i] == "object") continue;
            
            if (typeof arg[i] == "string") {
                //this could be optimized if needed
                if (arg[i].match(/^\s*xpath\:(.*)$/)) {
                    var o = xmlNode ? xmlNode.selectSingleNode(RegExp.$1) : null;
    
                    if (!o)
                        arg[i] = "";
                    else if (o.nodeType >= 2 && o.nodeType <= 4) 
                        arg[i] = o.nodeValue;
                    else
                        arg[i] = o.xml || o.serialize();
                }
                else if(arg[i].match(/^\s*call\:(.*)$/)) {
                    arg[i] = self[RegExp.$1](xmlNode, instrPart);
                }
                else if(arg[i].match(/^\s*\((.*)\)\s*$/)) {
                    arg[i] = this.processArguments(RegExp.$1.split(";"), 
                        xmlNode, instrPart, options);
                }
                else {
                    //Safely set options
                    (function(){
                        //Please optimize this
                        if(options)
                            for(var prop in options)
                                eval("var " + prop + " = options[prop]");
                        try{
                            arg[i] = eval(arg[i]);//RegExp.$1);
                        }
                        catch(e) {
                            //#ifdef __DEBUG
                            jpf.console.warn("Undefined variable used in data \
                                              instruction: " + arg[i]);
                            //#endif
                            
                            arg[i] = null;
                        }
                    })();
                }
            }
            else
                arg[i] = arg[i] || "";
        }
    }
    
    parsed.arguments = arg;
    
    return parsed;
}

//#endif