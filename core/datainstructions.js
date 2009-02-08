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

//#ifdef __WITH_DATA_INSTRUCTIONS

/**
 * @term datainstruction Data instructions offer a single and consistent way for
 * storing and retrieving
 * data from different data sources. For instance from a webserver using REST
 * or RPC, or from local data sources such as gears, air, o3, html5, as well as
 * from in memory sources from javascript or cookies. There is often an xml
 * element which is relevant to storing information. This element can be
 * accessed using xpath statements in the data instruction using curly braces.
 *
 * Syntax:
 * Using data instructions to retrieve data
 * <code>
 * get="name_of_model"
 * get="name_of_model:xpath"
 * get="#element"
 * get="#element:select"
 * get="#element:select:xpath"
 * get="#element"
 * get="#element:choose"
 * get="#element:choose:xpath"
 * get="#element::xpath"
 * get="url:example.jsp"
 * get="url:http://www.bla.nl?blah=10&foo={@bar}&example=eval:10+5"
 * get="rpc:comm.submit('abc', {@bar})"
 * get="call:submit('abc', {@bar})"
 * get="xmpp:login(username, password)"
 * get="webdav:getRoot()"
 * get="eval:10+5"
 * </code>
 *
 * Syntax:
 * Using data instructions to store data
 * <code>
 * set="url:http://www.bla.nl?blah=10&foo={/bar}&example=eval:10+5&"
 * set="url.post:http://www.bla.nl?blah=10&foo={/bar}&example=eval:10+5&"
 * set="rpc:comm.submit('abc', {/bar})"
 * set="call:submit('abc', {/bar})"
 * set="eval:example=5"
 * set="cookie:name.subname = {.}"
 * </code>
 */

/**
 * @private
 */
jpf.namespace("datainstr", {
    "call" : function(xmlContext, options, callback){
        var parsed = options.parsed || this.parseInstructionPart(
            options.instrData.join(":"), xmlContext, options.args, options);

        //#ifdef __DEBUG
        if (!self[parsed.name])
            throw new Error(jpf.formatErrorString(0, null,
                "Saving/Loading data", "Could not find Method '" + q[0] + "' \
                in process instruction '" + instruction + "'"));
        //#endif

        if (options.preparse) {
            options.parsed = parsed;
            options.preparse = -1;
            return;
        }

        //Call method
        var retvalue = self[parsed.name].apply(null, parsed.arguments);

        //Call callback
        if (callback)
            callback(retvalue, jpf.SUCCESS, options);
    },

    "eval" : function(xmlContext, options, callback){
        var parsed = options.parsed
            || this.parseInstructionPart(
                "(" + options.instrData.join(":") + ")", xmlContext,
                options.args, options);

        if (options.preparse) {
            options.parsed = parsed;
            options.preparse = -1;
            return;
        }

        try {
            var retvalue = eval(parsed.arguments[0]);
        }
        catch(e) {
            //#ifdef __DEBUG
            throw new Error(jpf.formatErrorString(0, null, "Saving data",
                "Could not execute javascript code in process instruction \
                '" + instruction + "' with error " + e.message));
            //#endif
        }

        if (callback)
            callback(retvalue, jpf.SUCCESS, options);
    }

    // #ifdef __WITH_COOKIE
    ,cookie: function(xmlContext, options, callback){
        var query  = options.instrData.join(":");
        var parsed = options.parsed || query.indexOf("=") > -1
            ? this.parseInstructionPart(query.replace(/\s*=\s*/, "(") + ")",
                xmlContext, options.args, options)
            : {name: query, args: options.args || [xmlContext]};

        if (options.preparse) {
            options.parsed = parsed;
            options.preparse = -1;
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
});


/**
 * Stores data using a {@link datainstruction 'data instruction'}.
 *
 * @param {String}      instruction  the {@link datainstruction 'data instruction'} to be used to store the data.
 * @param {XMLElement}  [xmlContext] the subject of the xpath queries
 * @param {Object}      [options]    the options for this instruction
 *   Properties:
 *   {Boolean} multicall    whether this call should not be executed immediately but saved for later sending using the purge() command.
 *   {mixed}   userdata     any data that is useful to access in the callback function.
 *   {Array}   args         the arguments of the call, overriding any specified in the data instruction.
 * @param {Function}    [callback]   the code that is executed when the call returns, either successfully or not.
 */
jpf.saveData = function(instruction, xmlContext, options, callback){
    if (!instruction) return false;

    if (!options) options = {};
    options.instrData = instruction.split(":");
    options.instrType = options.instrData.shift();
    
    var instrType = options.instrType.indexOf("url.") == 0
        ? "url"
        : options.instrType;

    //#ifdef __DEBUG
    options.instruction = instruction;

    if (!this.datainstr[instrType])
        throw new Error(jpf.formatErrorString(0, null,
            "Processing a data instruction",
            "Unknown data instruction format: " + instrType));
    //#endif

    this.datainstr[instrType].call(this, xmlContext, options, callback);
};

/**
 * Retrieves data using a {@link datainstruction 'data instruction'}.
 * Example:
 * Several uses for a data instruction
 * <code>
 *  <!-- loading jml from an xml file -->
 *  <j:bar jml="url:morejml.xml" />
 *
 *  <j:bindings>
 *    <!-- loads data using an remote procedure protocol -->
 *    <j:load   get = "rpc:comm.getData()" />
 *
 *    <!-- inserts data using an remote procedure protocol -->
 *    <j:insert get = "rpc:comm.getSubData({@id})" />
 *  </j:bindings>
 *
 *  <j:actions>
 *    <!-- notifies the server that a file is renamed -->
 *    <j:rename set = "url:update_file.jsp?id={@id}&name={@name}" />
 *
 *    <!-- adds a node by retrieving it's xml from the server. -->
 *    <j:add    get = "url:new_user.xml" />
 *  </j:actions>
 *
 *  <!-- creates a model which is loaded into a list -->
 *  <j:list model="webdav:getRoot()" />
 *
 *  <!-- loads data into a model and when submitted sends the altered data back -->
 *  <j:model load="url:load_contact.jsp" submission="save_contact.jsp" />
 * </code>
 *
 * @param {String}      instruction  the {@link datainstruction 'data instruction'} to be used to retrieve the data.
 * @param {XMLElement}  [xmlContext] the subject of the xpath queries
 * @param {Object}      [options]    the options for this instruction
 *   Properties:
 *   {Boolean} multicall    whether this call should not be executed immediately but saved for later sending using the purge() command.
 *   {mixed}   userdata     any data that is useful to access in the callback function.
 *   {mixed}   data         data to use in the call
 *   {Array}   args         the arguments of the call, overriding any specified in the data instruction.
 * @param {Function}    [callback]   the code that is executed when the call returns, either successfully or not.
 */
//instrType, data, xmlContext, callback, multicall, userdata, arg, isGetRequest
jpf.getData = function(instruction, xmlContext, options, callback){
    var instrParts = instruction.match(/^(.*?)(?:\!(.*)$|$)/);//\[([^\]\[]*)\]
    var operators  = instrParts[2] ? instrParts[2].splitSafe("\{|\}\s*,|,") : "";

    var gCallback  = function(data, state, extra){
        if (state != jpf.SUCCESS)
            return callback(data, state, extra);

        operators[2] = data;
        if (operators[0] && data) {
            if (typeof data == "string")
                data = jpf.xmldb.getXml(data);

            extra.data = data;
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
};

//#ifdef __WITH_MODEL
/**
 * Creates a model object based on a {@link datainstruction 'data instruction'}.
 *
 * @param {String} instruction  the {@link datainstruction 'data instruction'} to be used to retrieve the data for the model.
 * @param {JmlNode} jmlNode     the element the model is added to.
 * @param {Boolean} isSelection whether the model provides data that determines the selection of the element.
 */
jpf.setModel = function(instruction, jmlNode, isSelection){
    if (!instruction) return;

    var data      = instruction.split(":");
    var instrType = data[0];

    //So are we sure we shouldn't also check .dataParent here?
    var model = isSelection
        ? jmlNode.$getMultiBind().getModel()
        : jmlNode.getModel && jmlNode.getModel();
    if(model)
        model.unregister(jmlNode);

    if (jpf.datainstr[instrType]) {
        jmlNode.setModel(new jpf.model().loadFrom(instruction));
    }
    else if (instrType.substr(0,1) == "#") {
        instrType = instrType.substr(1);

        if (isSelection) {
            var sb2 = jpf.isParsing
                ? jpf.JmlParser.getFromSbStack(jmlNode.uniqueId, 1)
                : jmlNode.$getMultiBind().smartBinding;
            if (sb2)
                sb2.$model = new jpf.model().loadFrom(instruction);
        }
        else if (!self[instrType] || !jpf.JmlParser.inited) {
            jpf.JmlParser.addToModelStack(jmlNode, data)
        }
        else {
            var oConnect = eval(instrType);
            if (oConnect.connect)
                oConnect.connect(jmlNode, null, data[2], data[1] || "select");
            else
                jmlNode.setModel(new jpf.model().loadFrom(instruction));
        }

        jmlNode.connectId = instrType;
    }
    else {
        var instrType = data.shift();
        model = instrType == "@default"
            ? jpf.globalModel
            : jpf.nameserver.get("model", instrType);

        //#ifdef __DEBUG
        if (!model) {
            throw new Error(jpf.formatErrorString(1068, jmlNode,
                "Finding model", "Could not find model by name: " + instrType));
        }
        //#endif

        if (isSelection) {
            var sb2 = jpf.isParsing
                ? jpf.JmlParser.getFromSbStack(jmlNode.uniqueId, 1)
                : jmlNode.$getMultiBind().smartBinding;
            if (sb2) {
                sb2.$model = model;
                sb2.$modelXpath[jmlNode.uniqueId] = data.join(":");
            }
        }
        else
            jmlNode.setModel(model, data.join(":"));
    }
};
//#endif

/**
 * Parses argument list
 * Example:
 * Javascript
 * <code>
 *  jpf.parseInstructionPart('type(12+5,"test",{@value}.toLowerCase(),[0+2, "test"])', xmlNode);
 * </code>
 * Jml
 * <code>
 *  <j:rename set="rpc:comm.setFolder({@id}, {@name}, myObject.someProp);" />
 * </code>
 * @private
 */
jpf.parseInstructionPart = function(instrPart, xmlNode, arg, options){
    var parsed  = {}, s = instrPart.split("(");
    parsed.name = s.shift();

    //Get arguments for call
    if (!arg) {
        arg = s.join("(");

        //#ifdef __DEBUG
        if (arg.slice(-1) != ")") {
            throw new Error(jpf.formatErrorString(0, null, "Saving data",
                "Syntax error in instruction. Missing ) in " + instrPart));
        }
        //#endif

        function getXmlValue(xpath){
            var o = xmlNode ? xmlNode.selectSingleNode(xpath) : null;

            if (!o)
                return null;
            else if (o.nodeType >= 2 && o.nodeType <= 4)
                return o.nodeValue;
            else if (jpf.xmldb.isOnlyChild(o.firstChild, [3, 4]))
                return o.firstChild.nodeValue;
            else
                return o.xml || o.serialize();
        }

        arg = arg.slice(0, -1);
        var depth, lastpos = 0, result = ["["];
        arg.replace(/\\[\{\}\'\"]|(["'])|([\{\}])/g,
            function(m, chr, cb, pos){
                chr && (!depth && (depth = chr)
                    || depth == chr && (depth = null));

                if (!depth && cb) {
                    if (cb == "{") {
                        result.push(arg.substr(lastpos, pos - lastpos));
                        lastpos = pos + 1;
                    }
                    else {
                        result.push("getXmlValue('", arg
                            .substr(lastpos, pos - lastpos)
                            .replace(/([\\'])/g, "\\$1"), "')");
                        lastpos = pos + 1;
                    }
                }
            });

        result.push(arg.substr(lastpos), "]");

        //Safely set options
        (function(){
            try{
                with (options) {
                    arg = eval(result.join(""));
                }
            }
            catch(e) {
                //#ifdef __DEBUG
                throw new Error(jpf.formatErrorString(0, null, "Saving data",
                    "Error executing data instruction: " + arg
                    + "\nreason:" + e.message
                    + "\nAvailable properties:" + jpf.vardump(options)));
                //#endif

                arg = [];
            }
        })();
    }

    parsed.arguments = arg;

    return parsed;
};

//#endif
