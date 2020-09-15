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

//#ifdef __WITH_DATA


/**
 * Stores data using a {@link term.datainstruction data instruction}.
 *
 * 
 * @param {String}      instruction  The {@link term.datainstruction data instruction} to be used to store the data.
 * @param {Object}      [options]    The options for this instruction. Available properties include:
 *   - multicall ([[Boolean]]): Whether this call should not be executed immediately, but saved for later sending using the `purge()` command
 *   - userdata (`Mixed`): Any data that is useful to access in the callback function
 *   - args ([[Array]]): The arguments of the call, overriding any specified in the data instruction
 *   - [xmlContext] ([[XMLElement]]): The subject of the xpath queries
 *   - [callback] ([[Function]]): The code that is executed when the call returns, either successfully or not
 *   {: #saveDataOptions}
 */
ppc.saveData = 

/**
 * Retrieves data using a {@link term.datainstruction data instruction}.
 * 
 * #### Example
 * 
 * Here are several uses for data instructions:
 * 
 * ```xml
 *  <!-- loading aml from an xml file -->
 *  <a:bar aml="moreaml.xml" />
 *
 *  <a:bindings>
 *    <!-- loads data using an remote procedure protocol -->
 *    <a:load   get = "{comm.getData()}" />
 *
 *    <!-- inserts data using an remote procedure protocol -->
 *    <a:insert get = "{comm.getSubData([@id])}" />
 *  </a:bindings>
 *
 *  <a:actions>
 *    <!-- notifies the server that a file is renamed -->
 *    <a:rename set = "update_file.jsp?id=[@id]&name=[@name]" />
 *
 *    <!-- adds a node by retrieving it's xml from the server. -->
 *    <a:add    get = "new_user.xml" />
 *  </a:actions>
 *
 *  <!-- creates a model which is loaded into a list -->
 *  <a:list model="{webdav.getRoot()}" />
 *
 *  <!-- loads data into a model and when submitted sends the altered data back -->
 *  <a:model load="load_contact.jsp" submission="save_contact.jsp" />
 * ```
 *
 * @method getData
 * @param {String}      instruction  The {@link term.datainstruction data instruction} to be used to retrieve the data.
 * @param {XMLElement}  [xmlContext] The subject of the xpath queries
 * @param {Object}      [options]    The options for this instruction. Available properties include:
 *   - multicall ([[Boolean]]): Whether this call should not be executed immediately, but saved for later sending using the `purge()` command
 *   - userdata (`Mixed`): Any data that is useful to access in the callback function
 *   - args ([[Array]]): The arguments of the call, overriding any specified in the data instruction
 *   - [xmlContext] ([[XMLElement]]): The subject of the xpath queries
 *   - [callback] ([[Function]]): The code that is executed when the call returns, either successfully or not
 * @param {Function}    [callback]   The code that is executed when the call returns, either successfully or not
 */
ppc.getData = function(instruction, options){
    if (!instruction) return false;

    //Instruction type detection
    var result, chr = instruction.charAt(0), callback = options.callback;

    /*#ifdef __DEBUG
    var gCallback  = function(data, state, extra){
        var _self = this;
        $setTimeout(function(){
            s2.call(_self, data, state, extra);
        });
    }
    
    var s2 = 
    #else */
    var gCallback = 
    //#endif

    function(data, state, extra){
        var callback = options.callback
        
        if (state != ppc.SUCCESS)
            return callback(data, state, extra || {});

        //Change this to warning?
        /*if (!data) {
            throw new Error(ppc.formatErrorString(0, null,
                "Loading new data", "Could not load data. \n\
                Data instruction: '" + instruction + "'"));
        }*/

        return callback(data, state, extra || {});
    }
    
    if (!options) options = {}; //@todo optimize?
    var fParsed = options.fParsed || (instruction.indexOf("{") > -1 || instruction.indexOf("[") > -1
        ? ppc.lm.compile(instruction, {
            withopt     : true, 
            precall     : options.precall,
            alwayscb    : true, 
            simplexpath : true
          })
        : {str: instruction, type: 2}); 

    if (options.precall && !options._pc) {
        options.asyncs = fParsed.asyncs;
        options._pc    = 1;
    }

    //@todo hack because we're not using compileNode.. an imperfection..
    if (fParsed.type == 3){
        if (fParsed.xpaths[0]) {
            var model = fParsed.xpaths[0], xpath = fParsed.xpaths[1];
            
            //@todo can this be async?
            if (model == "#" || xpath == "#") { //When there is a set model and not a generated xpath
                var m = (ppc.lm.compile(instruction, {
                    xpathmode: 5
                }))();
                
                //@todo ppc3 this needs to be fixed in live markup
                if (typeof m != "string") {
                    model = m.model && m.model.$isModel && m.model;
                    if (model)
                        xpath = m.xpath;
                    else if (m.model) {
                        model = ppc.xmldb.findModel(m.model);
                        xpath = ppc.xmlToXpath(m.model, model.data) + (m.xpath ? "/" + m.xpath : ""); //@todo make this better
                    }
                    else {
                        //Model is not yet available. When it comes available we will be recalled (at least for prop binds)
                        return;
                    }
                }
                else model = null;
            }
            else {
                //#ifdef __WITH_NAMESERVER
                model = ppc.nameserver.get("model", model)
                //#endif
            }
            
            //#ifdef __DEBUG
            if (!model) {
                throw new Error("Could not find model '" + model + "' in " + instruction); //@todo ppc3.0 make proper error
            }
            //#endif
        
            return gCallback(model.data.selectSingleNode(xpath), ppc.SUCCESS, {});
        }
        else {
            //#ifdef __DEBUG
            if (!options.xmlNode) {
                return ppc.console.error(ppc.formatErrorString(0, null,
                    "Loading data",
                    "Xpath found without model and no xmlNode specified" 
                    + instruction));
            }
            //#endif
            
            return gCallback(options.xmlNode.data.selectSingleNode(fParsed.xpaths[1]), ppc.SUCCESS, {});
        }
    }
    
    //xml generation
    if (chr == "<") {
        //string only
        if (fParsed.type == 2)
            result = fParsed.str;
        else
            return fParsed(options.xmlNode, gCallback, options);
    }
    //jslt fetching data
    else if ((chr == "[" || chr == "{")) { //(fParsed.asyncs || fParsed.models) && 
        return fParsed(options.xmlNode, gCallback, options);
    }
    //url
    else {
        if (fParsed.type == 1 || fParsed.type == 3) {
            var callback2 = callback;
            callback = options.callback = function(data, state, extra){
                if (options._pc === true)
                    return;
                
                if (state != ppc.SUCCESS)
                    return callback2.apply(this, arguments);

                var url = data.split(" "), method = "get";
                if (url.length > 1 && url[0].length < 10) {
                    method = url.shift();
                    url    = url.join(" ");
                }
                else url = data;
                
                callback = options.callback = callback2;
                ppc.oHttp.exec(method, [url], gCallback, options);
            }
            fParsed(options.xmlNode, gCallback, options);
        }
        else {
            if (options._pc === true)
                return;
            
            var url = instruction.split(" "), method = "get";
            if (url.length > 1 && url[0].length < 10) {
                method = url.shift();
                url    = url.join(" ");
            }
            else {
                url = instruction;
            }
            
            ppc.oHttp.exec(method, [url.replace(/\\/g, "")], gCallback, options);
        }
    }
    
    if (result) {
        if (callback)
            gCallback(result, ppc.SUCCESS, {});
        else {
            //ppc.console.warn("Returning data directly in ppc.getData(). \
                //This means that all callback communication ends in void!");
            return result;
        }
    }
};

//#ifdef __WITH_MODEL
/**
 * Creates a model object based on a {@link term.datainstruction data instruction}.
 *
 * @param {String} instruction  The {@link term.datainstruction data instruction} to be used to retrieve the data for the model
 * @param {ppc.AmlNode} amlNode     The element the model is added to
 */
ppc.setModel = function(instruction, amlNode){
    if (!instruction) return;

    //Find existing model
    var fParsed = instruction.indexOf("{") > -1 || instruction.indexOf("[") > -1
        ? ppc.lm.compile(instruction, {
            //precall  : false, 
            alwayscb : true
        })
        : {
            type: 2,
            str : instruction
        };

    if (instruction == "@default" || fParsed.type == 2) {
        //#ifdef __WITH_NAMESERVER
        var model = ppc.nameserver.get("model", instruction);
        if (model)
            return model.register(amlNode);
        else
        //#endif
            if (instruction == "@default")
            return;
        
        //@todo ppc3.0 check here if string is valid url (relative or absolute)
        if (instruction.indexOf(".") == -1 && instruction.indexOf("/") == -1) {
            //#ifdef __DEBUG
            ppc.console.warn("Could not find model '" + instruction + "'");
            //#endif
            return;
        }
    }

    //Just an xpath doesnt work. We don't have context
    //var l, x;
    if (fParsed.type == 3) {//This won't work for complex xpaths
        if (fParsed.models) { //check for # in xpaths[i] to determine if its calculated
            if (fParsed.xpaths.length == 2 && fParsed.xpaths[0] != '#' && fParsed.xpaths [1] != '#') {
                //#ifdef __WITH_NAMESERVER
                //#ifdef __DEBUG
                if (!ppc.nameserver.get("model", fParsed.xpaths[0])) {
                    throw new Error("Could not find model '" + fParsed.xpaths[0] + "' in " + instruction); //@todo ppc3.0 make proper error
                }
                //#endif
                
                ppc.nameserver.get("model", fParsed.xpaths[0]).register(amlNode, fParsed.xpaths[1]);
                //#endif
                return;
            }
        }
        //#ifdef __DEBUG
        else {
            //throw new Error(ppc.formatErrorString(0, amlNode,
            ppc.console.warn("Xpath found without model. This might fail if no\
                context is specified using local(): " + instruction);
        }
        //#endif
    }

    if (amlNode.clear)
        amlNode.clear("loading");

    //Complex data fetch (possibly async) - data is loaded only once. 
    //Potential property binding has to take of the rest
    ppc.getData(instruction, {
      parsed   : fParsed, 
      xmlNode  : amlNode && amlNode.xmlRoot,
      callback : function(data, state, extra){
        //@todo ppc3.0 call onerror on amlNode
        if (state != ppc.SUCCESS) {
            throw new Error(ppc.formatErrorString(0, null,
                "Loading new data", "Could not load data into model. \
                \nMessage: " + extra.message + "\
                \nInstruction: '" + instruction + "'"));
        }
        
        if (!data)
            return amlNode.clear && amlNode.clear();

        if (typeof data == "string") {
            if (data.charAt(0) == "<")
                data = ppc.getXml(data);
            else {
                //Assuming web service returned url
                if (data.indexOf("http://") == 0)
                    return ppc.setModel(data, amlNode);
                else {
                    throw new Error("Invalid data from server");//@todo ppc3.0 make proper ppc error handling. ppc.onerror
                }
            }
        }
        
        if (data.nodeFunc) { //Assuming a model was passed -- data.localName == "model" && 
            data.register(amlNode);
            return;
        }
        
        var model = ppc.xmldb.findModel(data); //See if data is already loaded into a model
        if (model)
            model.register(amlNode, ppc.xmlToXpath(data, model.data)); //@todo move function to xml library
        else
            new ppc.model().register(amlNode).load(data);
    }});
};
//#endif

//#endif
