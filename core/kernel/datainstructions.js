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
    Offer a single method of setting and retrieving data from different
    data sources. For instance from a webserver using REST and RPC, or 
    from local data sources such as gears, air, deskrun, html5 or
    from in memory sources from javascript or cookies.
*/

 
//#ifdef __WITH_DSINSTR

/** 
 * Execute a process instruction
 * @todo combine:
 * + jpf.Teleport.callMethodFromNode (except submitform)
 * + ActionTracker.doResponse
 * + MultiSelect.add
 * + rewrite jpf.Model.parse to support load/submission -> rename to loadJML
 * + fix .doUpdate in Tree
 * + fix .extend in Model
 * + add Model.loadFrom(instruction);
 * + add Model.insertFrom(instruction, xmlContext, parentXMLNode, jmlNode);
 * + remove url attribute in insertJML function
 * @see jpf.Teleport#processArguments
 *
 * <j:Bar rpc="" jml="<get_data>" />
 * <j:bindings>
 * 	<j:load select="." get="<get_data>" />
 * 	<j:insert select="." get="<get_data>" />
 * </j:bindings>
 * <j:actions>
 * 	<j:rename set="<save_data>" />
 * 	<j:add get="<same_as_model>" set="<save_data>" />
 * </j:actions>
 * 
 * <j:list model="<model_get_data>" />
 * 
 * <j:model load="<get_data>" submission="<save_data>" />
 * <j:smartbinding model="<model_get_data>" />
 */	

jpf.datainstr = {
    "call" : function(instrType, data, options, xmlContext, callback, multicall, userdata, arg, isGetRequest){
        var parsed = this.parseInstructionPart(data.join(":"),
            xmlContext, arg);
        
        //#ifdef __DEBUG
        if (!self[parsed.name])
            throw new Error(0, jpf.formatErrorString(0, null, "Saving/Loading data", "Could not find Method '" + q[0] + "' in process instruction '" + instruction + "'"));
        //#endif
        
        //Call method
        var retvalue = self[parsed.name].apply(null, parsed.arguments);
        
        //Call callback
        if (callback)
            callback(retvalue, __HTTP_SUCCESS__, {userdata:userdata});
    },
    
    "eval" : function(instrType, data, options, xmlContext, callback, multicall, userdata, arg, isGetRequest){
        try {
            var retvalue = eval(data[1]);
        }
        catch(e) {
            //#ifdef __DEBUG
            throw new Error(0, jpf.formatErrorString(0, null, "Saving data", "Could not execute javascript code in process instruction '" + instruction + "' with error " + e.message));
            //#endif
        }
        
        if (callback)
            callback(retvalue, __HTTP_SUCCESS__, {userdata:userdata});
    }
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
jpf.saveData = function(instruction, xmlContext, callback, multicall, userdata, arg, isGetRequest){
    if (!instruction) return false;

    var options;
    if(xmlContext && !xmlContext.nodeType){
        options = xmlContext;
        xmlContext = options.xmlContext;
    }

    var data      = instruction.split(":");
    var instrType = data.shift();

    //#ifdef __DEBUG
    if (!this.datainstr[instrType]) {
        throw new Error(0, jpf.formatErrorString(0, null, "Access of a Storage Engine", "Unknown storage engine: " + instrType));
    }
    //#endif
    
    /*
        Having a lookup table with functions is probably
        slower than the switch statement that was here.
        Check if this has any realworld negative impact.
        :: The packager could convert this back to a switch
    */
    
    this.datainstr[instrType].call(this, instrType, data, options, xmlContext, 
        callback, multicall, userdata, arg, isGetRequest);
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
jpf.getData = function(instruction, xmlContext, callback, multicall, arg){
    var instrParts   = instruction.match(/^([^\|]*)(?:\|([^|]*)){0,1}$/);
    var operators    = (instrParts[2]||"").split(":");
    var get_callback = function(data, state, extra){
        if (state != __HTTP_SUCCESS__)
            return callback(data, state, extra);
        
        operators[2] = data;
        if (operators[0] && data) {
            if (typeof data == "string")
                data = jpf.XMLDatabase.getXml(data);
            data = data.selectSingleNode(operators[0]);
            
            //Change this to warning?
            if (!data)
                throw new Error(0, jpf.formatErrorString(0, null, "Loading new data", "Could not load data by doing selection on it using xPath: '" + operators[0] + "'."));	
        }
        
        extra.userdata = operators;
        return callback(data, state, extra);
    }
    
    //Get data operates exactly the same as saveData...
    if (this.saveData(instrParts[1], xmlContext, get_callback, multicall,
      operators, arg, true) !== false)
        return;
    
    //...and then some
    var data      = instruction.split(":");
    var instrType = data.shift();
    
    if (instrType.substr(0, 1) == "#") {
        instrType = instrType.substr(1);
        var retvalue, oJmlNode = self[instrType];
        
        //#ifdef __DEBUG
        if (!oJmlNode)
            throw new Error(0, jpf.formatErrorString(0, null, "Loading data", "Could not find object '" + instrType + "' referenced in process instruction '" + instruction + "' with error " + e.message));
        //#endif
        
        if (!oJmlNode.value)
            retvalue = null;
        else
            retvalue = data[2]
                ? oJmlNode.value.selectSingleNode(data[2])
                : oJmlNode.value;
    }
    else {
        var model = jpf.NameServer.get("model", instrType);
        
        if (!model)
            throw new Error(1068, jpf.formatErrorString(1068, jmlNode, "Loading data", "Could not find model by name: " + instrType, x));
        
        if (!model.data)
            retvalue = null;
        else
            retvalue = data[1]
                ? model.data.selectSingleNode(data[1])
                : model.data;
    }
    
    if (callback)
        get_callback(retvalue, __HTTP_SUCCESS__, {userdata:operators});
    else {
        jpf.issueWarning(0, "Returning data directly in jpf.getData(). This means that all callback communication ends in void!");
        return retvalue;
    }
}

//#ifdef __WITH_MODEL
/**
 * model_get_data : creates a model object (model will use get_data to process instruction) -> returns model + xpath
 * @todo
 * + rename jpf.JMLParser.selectModel to jpf.setModel
 * + change jpf.SmartBinding.loadJML to use jpf.setModel
 * + change function modelHandler to use jpf.setModel
 */
jpf.setModel = function(instruction, jmlNode, isSelection){
    if (!instruction) return;

    var data      = instruction.split(":");
    var instrType = data[0];
    
    //So are we sure we shouldn't also check .dataParent here?
    if(jmlNode.getModel())
        jmlNode.getModel().unregister(jmlNode);

    if (instrType.match(/^(?:url|url.post|rpc|call|eval|cookie|gears)$/)) {
        jmlNode.setModel(new jpf.Model().loadFrom(instruction));
        //x.setAttribute((isSelection ? "select-" : "") + "model", "#" + jmlNode.name + (data.length ? ":" + data.join(":") : ""));
    }
    else if (instrType.substr(0,1) == "#") {
        instrType = instrType.substr(1);
        
        if (isSelection) {
            var sb2 = jmlNode.getSelectionSmartBinding() || jpf.JMLParser.getFromSbStack(jmlNode.uniqueId, 1);
            if (sb2)
                sb2.model = new jpf.Model().loadFrom(instruction);
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
        var model = instrType == "@default"
            ? jpf.JMLParser.globalModel
            : jpf.NameServer.get("model", instrType);
        
        if (!model)
            throw new Error(1068, jpf.formatErrorString(1068, jmlNode, "Finding model", "Could not find model by name: " + instrType));
        
        if (isSelection) {
            var sb2 = jmlNode.getSelectionSmartBinding()
                || jpf.JMLParser.getFromSbStack(jmlNode.uniqueId, 1);
            if (sb2) {
                sb2.model = model;
                sb2.modelXpath[jmlNode.uniqueId] = data.join(":");
            }
        } else
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
        if (arg.substr(arg.length-1) != ")")
            throw new Error(0, jpf.formatErrorString(0, null, "Saving data", "Syntax error in instruction. Missing ) in " + instrPart));
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
                    //else if(o.firstChild) arg[i] = o.firstChild.nodeValue;// && (o.firstChild.nodeType == 3 || o.firstChild.nodeType == 4)
                    //else arg[i] = "";
                    else
                        arg[i] = o.xml || o.serialize();
                }
                else if(arg[i].match(/^\s*call\:(.*)$/)) {
                    arg[i] = self[RegExp.$1](xmlNode, instrPart);
                }
                else if(arg[i].match(/^\s*\((.*)\)\s*$/)) {
                    arg[i] = this.processArguments(RegExp.$1.split(";"), xmlNode, instrPart, options);
                }
                else {
                    //Safely set options
                    (function(){
                        //Please optimize this
                        if(options)
                            for(var prop in options)
                                eval("var " + prop + " = options[prop]");
                        
                        arg[i] = eval(arg[i]);//RegExp.$1);
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