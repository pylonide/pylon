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
 * @term datainstruction Data instructions offer a single and consistent way for
 * storing and retrieving
 * data from different data sources. For instance from a webserver using REST
 * or RPC, or from local data sources such as gears, air, o3, html5, as well as
 * from in memory sources from javascript or cookies. There is often an xml
 * element which is relevant to storing information. This element can be
 * accessed using xpath statements in the data instruction using curly braces.
 *
 *  - for complex model expr. replace model.
 *  - use property binding for selection, instead of setConnections
 *  <a:bar model="{tree.selected}">
 *      <a:textbox value="[persons/person/text]" />
 *      <a:textbox value="[persons/person/text1]" />
 *      <a:textbox value="[persons/person/text2]" />
 *      <a:textbox value="[persons/person/text3]" />
 *      <a:textbox value="[persons/person/text4]" />
 *  </a:bar>
 *  - create exec function for async objects
 *  - have list of async objects
 *
 * Syntax:
 * Using data instructions to retrieve data
 * <code>
 *  model="name_of_model"
 *  model="[name_of_model::xpath]"
 *  model="{element.selected}"
 *  model="[local(element.selected) {xpath}]"
 *  model="{element.choose}"
 *      model="[local(element.choose) {xpath}]"
 *      model="[local(element.root) {xpath}]"
 *      load="<specialtag>[comm.doCall([@id], test(), 5+10).xml]</specialtag>"
 *      get="example.jsp"
 *      get="http://www.bla.nl?blah=10&foo=[@bar]&example=[10+5]"
 *      get="{comm.submit('abc', [@bar])}"
 *      get="[local(comm.submit('abc', [@bar])) return [xpath]]"
 *      get="[submit('abc', [@bar])]"
 *      get="{xmpp.login(username, password)}"
 *      get="{webdav.getRoot()}"
 *      get="[10+5]"
 * </code>
 *
 * Syntax:
 * Using data instructions to store data
 * <code>
 *  set="http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
 *  set="post http://www.bla.nl?blah=10&foo={/bar}&example=[10+5]"
 * <a:add set="[[@uid] = comm.addPerson('abc', {/bar})]" />
 *  set="[submit('abc', {/bar})]"
 *  set="[example=[@name]]"
 *  set="[apf.setcookie('something', [.])]"
 *  set="[o3.fs.get('/var/test.xml').data = [.]]"
 * </code>
 *
 * [
 *  function test(){
 *      var blah = comm.blah();
 *      return blah;
 *  }
 * ]
 * <a:add set="[test([.])]" />
 *
 * See:
 * <ul>
 *  <li>{@link teleport.cgi the cgi teleport module}</li>
 *  <li>{@link teleport.rpc the rpc teleport module}</li>
 *  <li>{@link teleport.webdav the webdav teleport module}</li>
 *  <li>{@link teleport.xmpp the xmpp teleport module}</li>
 * </ul>
 */

/**
 * Stores data using a {@link term.datainstruction data instruction}.
 *
 * @param {String}      instruction  the {@link term.datainstruction data instruction} to be used to store the data.
 * @param {Object}      [options]    the options for this instruction
 *   Properties:
 *   {Boolean} multicall    whether this call should not be executed immediately but saved for later sending using the purge() command.
 *   {mixed}   userdata     any data that is useful to access in the callback function.
 *   {Array}   args         the arguments of the call, overriding any specified in the data instruction.
 *   {XMLElement}  [xmlContext] the subject of the xpath queries
 *   {Function}    [callback]   the code that is executed when the call returns, either successfully or not.
 */
apf.saveData = 

/**
 * Retrieves data using a {@link term.datainstruction data instruction}.
 * Example:
 * Several uses for a data instruction
 * <code>
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
 * </code>
 *
 * @param {String}      instruction  the {@link term.datainstruction data instruction} to be used to retrieve the data.
 * @param {XMLElement}  [xmlContext] the subject of the xpath queries
 * @param {Object}      [options]    the options for this instruction
 *   Properties:
 *   {Boolean} multicall    whether this call should not be executed immediately but saved for later sending using the purge() command.
 *   {mixed}   userdata     any data that is useful to access in the callback function.
 *   {mixed}   data         data to use in the call
 *   {Array}   args         the arguments of the call, overriding any specified in the data instruction.
 * @param {Function}    [callback]   the code that is executed when the call returns, either successfully or not.
 */
apf.getData = function(instruction, options){
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
        
        if (state != apf.SUCCESS)
            return callback(data, state, extra || {});

        //Change this to warning?
        /*if (!data) {
            throw new Error(apf.formatErrorString(0, null,
                "Loading new data", "Could not load data. \n\
                Data instruction: '" + instruction + "'"));
        }*/

        return callback(data, state, extra || {});
    }
    
    if (!options) options = {}; //@todo optimize?
    var fParsed = options.fParsed || (instruction.indexOf("{") > -1 || instruction.indexOf("[") > -1
        ? apf.lm.compile(instruction, {
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
                var m = (apf.lm.compile(instruction, {
                    xpathmode: 5
                }))();
                
                //@todo apf3 this needs to be fixed in live markup
                if (typeof m != "string") {
                    model = m.model && m.model.$isModel && m.model;
                    if (model)
                        xpath = m.xpath;
                    else if (m.model) {
                        model = apf.xmldb.findModel(m.model);
                        xpath = apf.xmlToXpath(m.model, model.data) + (m.xpath ? "/" + m.xpath : ""); //@todo make this better
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
                model = apf.nameserver.get("model", model)
                //#endif
            }
            
            //#ifdef __DEBUG
            if (!model) {
                throw new Error("Could not find model '" + model + "' in " + instruction); //@todo apf3.0 make proper error
            }
            //#endif
        
            return gCallback(model.data.selectSingleNode(xpath), apf.SUCCESS, {});
        }
        else {
            //#ifdef __DEBUG
            if (!options.xmlNode) {
                return apf.console.error(apf.formatErrorString(0, null,
                    "Loading data",
                    "Xpath found without model and no xmlNode specified" 
                    + instruction));
            }
            //#endif
            
            return gCallback(options.xmlNode.data.selectSingleNode(fParsed.xpaths[1]), apf.SUCCESS, {});
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
                
                if (state != apf.SUCCESS)
                    return callback2.apply(this, arguments);

                var url = data.split(" "), method = "get";
                if (url.length > 1 && url[0].length < 10) {
                    method = url.shift();
                    url    = url.join(" ");
                }
                else url = data;
                
                callback = options.callback = callback2;
                apf.oHttp.exec(method, [url], gCallback, options);
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
            
            apf.oHttp.exec(method, [url.replace(/\\/g, "")], gCallback, options);
        }
    }
    
    if (result) {
        if (callback)
            gCallback(result, apf.SUCCESS, {});
        else {
            //apf.console.warn("Returning data directly in apf.getData(). \
                //This means that all callback communication ends in void!");
            return result;
        }
    }
};

//#ifdef __WITH_MODEL
/**
 * Creates a model object based on a {@link term.datainstruction data instruction}.
 *
 * @param {String} instruction  the {@link term.datainstruction data instruction} to be used to retrieve the data for the model.
 * @param {AmlNode} amlNode     the element the model is added to.
 */
apf.setModel = function(instruction, amlNode){
    if (!instruction) return;

    //Find existing model
    var fParsed = instruction.indexOf("{") > -1 || instruction.indexOf("[") > -1
        ? apf.lm.compile(instruction, {
            //precall  : false, 
            alwayscb : true
        })
        : {
            type: 2,
            str : instruction
        };

    if (instruction == "@default" || fParsed.type == 2) {
        //#ifdef __WITH_NAMESERVER
        var model = apf.nameserver.get("model", instruction);
        if (model)
            return model.register(amlNode);
        else
        //#endif
            if (instruction == "@default")
            return;
        
        //@todo apf3.0 check here if string is valid url (relative or absolute)
        if (instruction.indexOf(".") == -1 && instruction.indexOf("/") == -1) {
            //#ifdef __DEBUG
            apf.console.warn("Could not find model '" + instruction + "'");
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
                if (!apf.nameserver.get("model", fParsed.xpaths[0])) {
                    throw new Error("Could not find model '" + fParsed.xpaths[0] + "' in " + instruction); //@todo apf3.0 make proper error
                }
                //#endif
                
                apf.nameserver.get("model", fParsed.xpaths[0]).register(amlNode, fParsed.xpaths[1]);
                //#endif
                return;
            }
        }
        //#ifdef __DEBUG
        else {
            //throw new Error(apf.formatErrorString(0, amlNode,
            apf.console.warn("Xpath found without model. This might fail if no\
                context is specified using local(): " + instruction);
        }
        //#endif
    }

    if (amlNode.clear)
        amlNode.clear("loading");

    //Complex data fetch (possibly async) - data is loaded only once. 
    //Potential property binding has to take of the rest
    apf.getData(instruction, {
      parsed   : fParsed, 
      xmlNode  : amlNode && amlNode.xmlRoot,
      callback : function(data, state, extra){
        //@todo apf3.0 call onerror on amlNode
        if (state != apf.SUCCESS) {
            throw new Error(apf.formatErrorString(0, null,
                "Loading new data", "Could not load data into model. \
                \nMessage: " + extra.message + "\
                \nInstruction: '" + instruction + "'"));
        }
        
        if (!data)
            return amlNode.clear && amlNode.clear();

        if (typeof data == "string") {
            if (data.charAt(0) == "<")
                data = apf.getXml(data);
            else {
                //Assuming web service returned url
                if (data.indexOf("http://") == 0)
                    return apf.setModel(data, amlNode);
                else {
                    throw new Error("Invalid data from server");//@todo apf3.0 make proper apf error handling. apf.onerror
                }
            }
        }
        
        if (data.nodeFunc) { //Assuming a model was passed -- data.localName == "model" && 
            data.register(amlNode);
            return;
        }
        
        var model = apf.xmldb.findModel(data); //See if data is already loaded into a model
        if (model)
            model.register(amlNode, apf.xmlToXpath(data, model.data)); //@todo move function to xml library
        else
            new apf.model().register(amlNode).load(data);
    }});
};
//#endif

//#endif
