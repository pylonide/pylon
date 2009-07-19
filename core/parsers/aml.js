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

// #ifdef __PARSER_AML
/**
 * The parser of the Ajax.org Markup Language. Besides aml this parser takes care
 * of distributing parsing tasks to other parsers like the native html parser and
 * the xsd parser.
 * @parser
 * @private
 *
 * @define include element that loads another aml files.
 * Example:
 * <code>
 *   <a:include src="bindings.aml" />
 * </code>
 * @attribute {String} src the location of the aml file to include in this application.
 * @addnode global, anyaml
 */
apf.AmlParser = {
    // #ifdef __WITH_DATABINDING
    sbInit     : {},
    // #endif

    stateStack : [],
    modelInit  : [],

    parse : function(x){
        // #ifdef __DEBUG
        apf.console.info("Start parsing main application");
        // #endif
        // #ifdef __DEBUG
        apf.Latometer.start();
        // #endif
        this.$aml = x;

        apf.isParsing = true;

        // #ifdef __DEBUG
        //Check for children in Aml node
        if (!x.childNodes.length)
            throw new Error(apf.formatErrorString(1014, null,
                "apf.AmlParser",
                "AML Parser got Markup without any children"));
        // #endif

        //Create window and document
        /**
         * The window object of the application representing the browser window.
         */
        apf.window          = new apf.WindowImplementation();
        
        /**
         * The DOM document element for this application.
         */
        apf.document        = new apf.DocumentImplementation();
        apf.window.document = apf.document;
        //#ifdef __WITH_ACTIONTRACKER
        apf.window.$at      = new apf.actiontracker();
        apf.window.$at.name = "default";
        apf.nameserver.register("actiontracker", "default", apf.window.$at);
        //#endif

        //First pass parsing of all AML documents
        for (var docs = [x], i = 0; i < apf.includeStack.length; i++) {
            if (apf.includeStack[i].nodeType)
                docs.push(apf.includeStack[i]);
        }

        this.docs = docs;
        this.parseSettings(docs);

        if (!this.shouldWait)
            this.continueStartup();
    },

    //Allow for Async processes set in appsettings to load before parsing...
    continueStartup : function(){
        this.parseFirstPass(this.docs);

        //Main parsing pass
        apf.AmlParser.parseChildren(this.$aml, document.body, apf.document.documentElement);//, this);

        //Activate Layout Rules [Maybe change idef to something more specific]
        //#ifdef __WITH_ALIGNMENT
        if (apf.appsettings.layout)
            apf.layout.loadFrom(apf.appsettings.layout);
        // #endif

        //Last pass parsing
        if (apf.appsettings.initdelay)
            setTimeout('apf.AmlParser.parseLastPass();', 1);
        else 
            apf.AmlParser.parseLastPass();

        //Set init flag for subparsers
        this.inited = true;

        // #ifdef __DEBUG
        apf.Latometer.end();
        apf.Latometer.addPoint("Total load time");
        apf.Latometer.start(true);
        // #endif
    },

    parseSettings : function(xmlDocs) {
        for (var i = 0; i < xmlDocs.length; i++)
            this.preLoadRef(xmlDocs[i], ["appsettings"]);
    },

    parseFirstPass: function(xmlDocs){
        // #ifdef __DEBUG
        apf.console.info("Parse First Pass");
        // #endif

        //@todo fix inline skin parsing collision
        //"presentation", 
        for (var i = 0; i < xmlDocs.length; i++)
            this.preLoadRef(xmlDocs[i], ["teleport", "settings",
                "skin[not(@a_preparsed=9999)]", "bindings[@id]", "actions[@id]", "dragdrop[@id]", "remote"]);
        //"style", 
        for (var i = 0; i < xmlDocs.length; i++)
            this.preLoadRef(xmlDocs[i], ["model[@id]",
                "smartbinding[@id]", "iconmap"], true);
    },

    preparsed : [],
    preLoadRef : function(xmlNode, sel, parseLocalModel){
        /*BUG: IE document handling bugs
        - removed to see what this does
        if (apf.isIE) {
            if (xmlNode.style) return;
        }*/

        var prefix = apf.findPrefix(xmlNode, apf.ns.aml);
        if (prefix) prefix += ":";
        var nodes  = apf.queryNodes(".//" + prefix + sel.join("|.//"
            + prefix) + (parseLocalModel ? "|" + prefix + "model" : ""), xmlNode);

        var i, o, name, tagName, x, l;
        for (i = 0, l = nodes.length; i < l; i++) {
            x = nodes[i];

            var tagName = x[apf.TAGNAME];

            //Process Node
            if (this.handler[tagName]) {
                //#ifdef __DEBUG
                apf.console.info("Processing [preload] " + tagName + " node");
                //#endif

                o = this.handler[tagName](x);
                name = x.getAttribute("id"); //or u could use o.name

                //Add this component to the nameserver
                if (o && name)
                    apf.nameserver.register(tagName, name, o);

                //#ifdef __WITH_AMLDOM_FULL
                if (!o || !o.nodeFunc)
                    o = new apf.AmlDom(tagName, null, apf.NODE_HIDDEN, x, o);
                /* #else
                if (o && o.nodeFunc)
                #endif */
                {
                    o.$amlLoaded = true;

                    if (name)
                        apf.setReference(name, o);
                }

                x.setAttribute("a_preparsed", this.preparsed.push(o) - 1);
            }
            else if (x.parentNode) {
               x.parentNode.removeChild(x);
            }
        }
    },

    parseMoreAml : function(x, pHtmlNode, amlParent, noImpliedParent, parseSelf, beforeNode){
        var parsing = apf.isParsing;
        apf.isParsing = true;

        if (!apf.window) {
            apf.window          = new apf.WindowImplementation();
            apf.document        = new apf.DocumentImplementation();
            // #ifdef __WITH_ACTIONTRACKER
            apf.window.document = apf.document;
            apf.window.$at      = new apf.actiontracker();
            apf.nameserver.register("actiontracker", "default", apf.window.$at);
            //#endif
        }
        
        if (!this.$aml)
            this.$aml = x;

        if (!amlParent)
            amlParent = apf.document.documentElement;

        this.parseFirstPass([x]);

        if (parseSelf) {
            if (amlParent.loadAml)
                amlParent.loadAml(x, amlParent.parentNode);
            amlParent.$amlLoaded = true;

            //#ifdef __WITH_ALIGNMENT
            if (amlParent && amlParent.pData)
                apf.layout.compileAlignment(amlParent.pData);
            //#endif

            //#ifdef __WITH_ANCHORING || __WITH_ALIGNMENT || __WITH_GRID
            if (amlParent.pData || amlParent.tagName == "grid")
                apf.layout.activateRules(pNode.oInt || document.body);
            //#endif
        }
        else {
            var lastChild = pHtmlNode.lastChild;
            this.parseChildren(x, pHtmlNode, amlParent, false, noImpliedParent);

            if (beforeNode) {
                var loop = pHtmlNode.lastChild;
                while (lastChild != loop) {
                    pHtmlNode.insertBefore(loop, beforeNode);
                    loop = pHtmlNode.lastChild;
                }
            }
        }

        //#ifdef __WITH_ANCHORING || __WITH_ALIGNMENT || __WITH_GRID
        apf.layout.activateRules();//@todo maybe use processQueue
        //#endif

        this.parseLastPass();
        apf.isParsing = parsing;
    },

    reWhitespaces : /[\t\n\r ]+/g,
    //the checkRender paramtere is deprecated
    parseChildren : function(x, pHtmlNode, amlParent, checkRender, noImpliedParent){
        //Let's not parse our children when they're already rendered
        if (pHtmlNode == amlParent.oInt && amlParent.childNodes.length
          && amlParent != apf.document.documentElement)
            return pHtmlNode;

        // #ifdef __DEBUG
        if (!apf.Latometer.isStarted) apf.Latometer.start();
        // #endif

        // Check for delayed rendering flag
        if (amlParent && amlParent.hasFeature(__DELAYEDRENDER__) 
          && amlParent.$shouldDelay(x)) {
            // #ifdef __DEBUG
            apf.console.info("Delaying rendering of children");
            // #endif

            return pHtmlNode;
        }
        if (amlParent)
            amlParent.$rendered = true;

        if (x.namespaceURI == apf.ns.aml || x.tagUrn == apf.ns.aml)
            this.lastNsPrefix = x.prefix || x.scopeName;

        //Loop through Nodes
        for (var oCount = 0,i = 0; i < x.childNodes.length; i++) {
            var q = x.childNodes[i];
            if (q.nodeType == 8) continue;

            // Text nodes and comments
            if (q.nodeType != 1) {
                if (!pHtmlNode) continue;

                if (apf.hasTextNodeWhiteSpaceBug && !q.nodeValue.trim())
                    continue;

                if (q.nodeType == 3 || pHtmlNode.style && q.nodeType == 4) {
                    if (apf.hasTextNodeWhiteSpaceBug) {
                        pHtmlNode.appendChild(pHtmlNode.ownerDocument
                          .createTextNode(q.nodeValue.replace(this.reWhitespaces, " ")));
                    }
                    else {
                        pHtmlNode.appendChild(pHtmlNode.ownerDocument
                          .createTextNode(q.nodeValue));
                    }
                }
                else if (q.nodeType == 4) {
                    pHtmlNode.appendChild(pHtmlNode.ownerDocument
                        .createCDataSection(q.nodeValue));
                }

                //#ifdef __WITH_LANG_SUPPORT
                var nodeValue = q.nodeValue.replace(/^\$(.*)\$$/, "$1");
                if (RegExp.$1)
                    apf.language.addElement(nodeValue, {htmlNode : pHtmlNode});
                //#endif
                
                continue;
            }

            //Parse node using namespace handler
            if (!this.nsHandler[q.namespaceURI || q.tagUrn || apf.ns.xhtml])
                continue; //ignore tag

            this.nsHandler[q.namespaceURI || q.tagUrn || apf.ns.xhtml].call(
                this, q, pHtmlNode, amlParent, noImpliedParent);
        }

        if (pHtmlNode) {
            //Calculate Alignment and Anchoring
            // #ifdef __WITH_ALIGNMENT
            if (amlParent && amlParent.pData)
                apf.layout.compileAlignment(amlParent.pData);
                //apf.layout.compile(pHtmlNode);
            // #endif

            // #ifdef __WITH_ANCHORING || __WITH_ALIGNMENT || __WITH_GRID
            if (!apf.hasSingleRszEvent)
                apf.layout.activateRules(pHtmlNode);
            // #endif
        }

        return pHtmlNode;
    },

    addNamespaceHandler : function(xmlns, func){
        this.nsHandler[xmlns] = func;
    },

    /**
     * @private
     */
    nsHandler : {
        //Ajax.org Platform
        "http://ajax.org/2005/aml" : function(x, pHtmlNode, amlParent, noImpliedParent){
            var tagName = x[apf.TAGNAME];

            // #ifdef __WITH_INCLUDES
            // Includes
            if (tagName == "include") {
                // #ifdef __DEBUG
                apf.console.info("Switching to include context");
                // #endif

                var xmlNode = apf.includeStack[x.getAttribute("iid")];
                //#ifdef __DEBUG
                if (!xmlNode)
                    return apf.console.warn("No include file found");
                // #endif

                this.parseChildren(xmlNode, pHtmlNode, amlParent, null, true);
            }
            else
            // #endif

            // Handler
            if (this.handler[tagName]) {
                var o, id, name;

                //Deal with preparsed nodes
                if (id = x.getAttribute("a_preparsed")) {
                    x.removeAttribute("a_preparsed");

                    o = this.preparsed[id];
                    delete this.preparsed[id];

                    if (o && !o.parentNode) {
                        //#ifdef __WITH_AMLDOM_FULL
                        if (amlParent.hasFeature && amlParent.hasFeature(__WITH_AMLDOM__))
                            o.$setParent(amlParent);
                        else 
                        //#endif
                        {
                            o.parentNode = amlParent;
                            amlParent.childNodes.push(o);
                        }
                    }

                    return o;
                }

                // #ifdef __DEBUG
                apf.console.info("Processing '" + tagName + "' node");
                // #endif

                o = this.handler[tagName](x, (noImpliedParent
                    ? null
                    : amlParent), pHtmlNode);

                name = x.getAttribute("id"); //or u could use o.name

                //Add this component to the nameserver
                if (o && name)
                    apf.nameserver.register(tagName, name, o);

                //#ifdef __WITH_AMLDOM_FULL
                if (!o || !o.nodeFunc)
                    o = new apf.AmlDom(tagName, amlParent, apf.NODE_HIDDEN, x, o);
                else //if(noImpliedParent)
                    o.$setParent(amlParent);
                /* #else
                if (o && o.nodeFunc)
                #endif */
                {
                    o.$amlLoaded = true;

                    if (name)
                        apf.setReference(name, o);
                }
            }

            //XForms
            //#ifdef __WITH_XFORMS
            else if (amlParent && (amlParent.hasFeature(__XFORMS__)
              && (this.xforms[tagName] || amlParent.setCaption
              && this.xforms[tagName] > 2))) {
                switch (this.xforms[tagName]) {
                    case 1: //Set Event
                        if (x.getAttribute("ev:event")) {
                            amlParent.dispatchEvent(x.getAttribute("ev:event"),
                                function(){
                                    this.executeXFormStack(x);
                                });
                        }
                        else
                            amlParent.executeXFormStack(x);
                        break;
                    case 2: //Parse in Element
                        amlParent.parseXFormTag(x);
                        break;
                    case 3: //Label
                        if (amlParent.setCaption) {
                            amlParent.setCaption(x.firstChild.nodeValue); //or replace it or something...
                            break;
                        }

                        //Create element using this function
                        var oLabel = this.nsHandler[apf.ns.aml].call(this, x,
                            amlParent.oExt.parentNode, amlParent.parentNode);

                        //Set Dom stuff
                        oLabel.parentNode = amlParent.parentNode;
                        for (var i = 0; i < amlParent.parentNode.childNodes.length; i++) {
                            if (amlParent.parentNode.childNodes[i] == amlParent) {
                                amlParent.parentNode.childNodes[i] = oLabel;
                            }
                            else if (amlParent.parentNode.childNodes[i] == oLabel) {
                                amlParent.parentNode.childNodes[i] = amlParent;
                                break;
                            }
                        }

                        //Insert element to parentHtmlNode of amlParent and before the node
                        oLabel.oExt.parentNode.insertBefore(oLabel.oExt, amlParent.oExt);

                        //Use for
                        oLabel.setProperty("for", amlParent);
                        break;
                }
            }
            //#endif
            //AML Components
            else if (pHtmlNode) {
                // #ifdef __DEBUG
                if (!apf[tagName] || typeof apf[tagName] != "function")
                    throw new Error(apf.formatErrorString(1017, null,
                        "Initialization",
                        "Could not find Class Definition '" + tagName + "'.", x));
                // #endif

                if (!apf[tagName])
                    throw new Error("Could not find class " + tagName);

                var objName = tagName;

                //Check if Class is loaded in current Window
                //if(!self[tagName]) main.window.apf.importClass(main.window[tagName], false, window);

                //#ifdef __WITH_XFORMS
                if (tagName == "select1" && x.getAttribute("appearance") == "minimal") {
                    objName = "dropdown";
                }
                //#endif
                // #ifdef __WITH_HTML5
                if (tagName == "input") {
                    objName = apf.HTML5INPUT[objName = x.getAttribute("type")]
                        || objName || "textbox";
                }
                //#endif

                //Create Object en Reference
                var o = new apf[objName](pHtmlNode, tagName, x);

                if (x.getAttribute("id"))
                    apf.setReference(x.getAttribute("id"), o);

                //Process AML
                if (o.loadAml)
                    o.loadAml(x, amlParent);

                o.$amlLoaded = true;
            }

            return o;
        }

        //#ifdef __WITH_XSD
        //XML Schema Definition
        ,"http://www.w3.org/2001/XMLSchema" : function(x, pHtmlNode, amlParent, noImpliedParent){
            var type = apf.XSDParser.parse(x);
            if (type && amlParent)
                amlParent.setProperty("datatype", type);
        }
        //#endif

        // #ifdef __WITH_HTML_PARSING
        //XHTML
        ,"http://www.w3.org/1999/xhtml" :  function(x, pHtmlNode, amlParent, noImpliedParent){
            var tagName = x.tagName;
            var parseWhole = tagName.match(/table|object|embed/i) ? true : false;

            if (!parseWhole && apf.hasTextNodeWhiteSpaceBug && tagName == "pre") {
                pHtmlNode.insertAdjacentHTML("beforeend", x.xml);
                return pHtmlNode.lastChild;
            }

            //#ifdef __DEBUG
            if (!pHtmlNode) {
                throw new Error(apf.formatErrorString(0, amlParent,
                    "Parsing html elements",
                    "Unexpected HTML found", x));
            }
            //#endif

            // Move all this to the respective browser libs in a wrapper function
            if (tagName == "script" || tagName == "noscript") {
                return;
            }
            else if (tagName == "option") {
                var o = pHtmlNode.appendChild(pHtmlNode.ownerDocument.createElement("option"));
                if (x.getAttribute("value"))
                    o.setAttribute("value", x.getAttribute("value"));
            }
            else if (apf.isIE) {
                var o = (x.ownerDocument == pHtmlNode.ownerDocument)
                    ? pHtmlNode.appendChild(x.cloneNode(false))
                    : apf.xmldb.htmlImport(x.cloneNode(parseWhole), pHtmlNode);
            }
            else if (apf.isSafari) { //SAFARI importing cloned node kills safari.. temp workaround in place
                //o = pHtmlNode.appendChild(pHtmlNode.ownerDocument.importNode(x));//.cloneNode(false)
                var o = (x.ownerDocument == pHtmlNode.ownerDocument)
                    ? pHtmlNode.appendChild(x)
                    : apf.xmldb.htmlImport(x.cloneNode(parseWhole), pHtmlNode);
            }
            else {
                var o = (x.ownerDocument == pHtmlNode.ownerDocument)
                    ? pHtmlNode.appendChild(x.cloneNode(false))
                    : apf.xmldb.htmlImport(x.cloneNode(false), pHtmlNode);
                //o = pHtmlNode.appendChild(pHtmlNode.ownerDocument.importNode(x.cloneNode(false), false));
            }

            //Check attributes for a:left etc and a:repeat-nodeset
            var prefix = this.lastNsPrefix || apf.findPrefix(x.parentNode, apf.ns.aml) || "";
            if (prefix && !x.style) {
                if (!apf.supportNamespaces)
                    x.ownerDocument.setProperty("SelectionNamespaces", "xmlns:"
                        + prefix + "='" + apf.ns.aml + "'");
                prefix += ":";
            }

            //#ifdef __WITH_XFORMS || __WITH_HTML_POSITIONING
            var done = {}, aNodes = !x.style && x.selectNodes("@" + prefix + "*") || [];
            for (var i = 0; i < aNodes.length; i++) {
                tagName = aNodes[i][apf.TAGNAME];

                //#ifdef __WITH_HTML_POSITIONING
                //@todo rewrite this, and optimize html loading
                if (tagName.match(/^(left|top|right|bottom|width|height|align)$/)) {
                    if (done["position"]) continue;
                    done["position"] = true;
                    //Create positioning object - remove attributes when done
                    var html = new apf.HtmlWrapper(pHtmlNode, o, prefix);

                    if (x.getAttribute(prefix + "align")
                      || x.getAttribute(prefix + "align-position")) {
                        html.enableAlignment()
                    }
                    else if (x.getAttribute(prefix + "width")
                      || x.getAttribute(prefix + "height")
                      || x.getAttribute(prefix + "left")
                      || x.getAttribute(prefix + "top")
                      || x.getAttribute(prefix + "right")
                      || x.getAttribute(prefix + "bottom")
                      || x.getAttribute(prefix + "anchoring") == "true") {
                        html.getDiff();
                        html.setHorizontal(x.getAttribute(prefix + "left"),
                            x.getAttribute(prefix + "right"),
                            x.getAttribute(prefix + "width"));
                        html.setVertical(x.getAttribute(prefix + "top"),
                            x.getAttribute(prefix + "bottom"),
                            x.getAttribute(prefix + "height"));
                    }

                    //return o;
                }
                //#endif

                //#ifdef __WITH_XFORMS
                /* XForms support
                    - repeat-model
                    - repeat-bind
                    - repeat-nodeset
                    - repeat-startindex
                    - repeat-number
                */
                else if (tagName.match(/^repeat-/)) {
                    if (done["repeat"]) continue;
                    done["repeat"] = true;
                    //Create repeat object - remove attributes when done

                }
                //#endif
            }
             //#endif

            if ((apf.canUseInnerHtmlWithTables || !parseWhole) && x.tagName.toUpperCase() != "IFRAME")
                this.parseChildren(x, o, amlParent);
            else {
                //#ifdef __DEBUG
                apf.console.warn("Not parsing children of table, \
                    ignoring all Ajax.org Platform Elements.");
                //#endif
            }

            // #ifdef __WITH_EDITMODE || __WITH_LANG_SUPPORT
            if (apf.xmldb.getTextNode(x)) {
                var data = {
                    amlNode  : x,
                    htmlNode : o
                }

                /* #ifdef __WITH_EDITMODE
                EditServer.register(data);
                #endif */
                // #ifdef __WITH_LANG_SUPPORT
                apf.language.addElement(apf.getTextNode(x)
                    .nodeValue.replace(/^\$(.*)\$$/, "$1"), data);
                // #endif
            }
            // #endif

            return o;
        }
        // #endif
    },

    //#ifdef __WITH_XFORMS
    xforms : {
        "label"       : 3, //any non-has-children node

        "action"      : 1, //stacked processing
        "dispatch"    : 1,
        "rebuild"     : 1,
        "recalculate" : 1,
        "revalidate"  : 1,
        "refresh"     : 1,
        "setfocus"    : 1,
        "load"        : 1,
        "setvalue"    : 1,
        "send"        : 1,
        "reset"       : 1,
        "message"     : 1,
        "insert"      : 1,
        "delete"      : 1,

        "filename"    : 2, //widget specific processing
        "mediatype"   : 2,
        "itemset"     : 2,
        "item"        : 2,
        "choices"     : 2,
        "copy"        : 2,
        "help"        : 2,
        "hint"        : 2
    },
    //#endif

    invalidAml : function(aml, message){
        //#ifdef __DEBUG
        apf.console.warn((message || "Invalid AML syntax. The a:"
                        + aml[apf.TAGNAME] + " node should not be placed under \
                         it's current parent:") + "\n"
                        + (aml.xml || aml.serialize));
        //#endif
    },

    handler : {
        /**
         * @define script element that loads javascript into the application
         * either from it's first child or from a file.
         * Example:
         * <code>
         *  <a:script src="code.js" />
         * </code>
         * Example:
         * <code>
         *  <a:script><![CDATA[
         *      for (var i = 0; i < 10; i++) {
         *          alert(i);
         *      }
         *  ]]></a:script>
         * </code>
         * @attribute {String} src the location of the script file.
         * @addnode global, anyaml
         */
        "script" : function(q){
            if (q.getAttribute("src")) {
                if (apf.isOpera) {
                    setTimeout(function(){
                        apf.window.loadCodeFile(apf.hostPath
                            + q.getAttribute("src"));
                    }, 1000);
                }
                else {
                    apf.window.loadCodeFile(apf.getAbsolutePath(apf.hostPath,
                        q.getAttribute("src")));
                }
            }
            else if (q.firstChild) {
                var scode = q.firstChild.nodeValue;
                apf.exec(scode);
            }
        },

        //#ifdef __WITH_STATE
        /**
         * @define state-group Element that groups state elements together and
         * provides a way to set a default state.
         * Example:
         * <code>
         *  <a:state-group
         *    loginMsg.visible  = "false"
         *    winLogin.disabled = "false">
         *      <a:state id="stFail"
         *          loginMsg.value   = "Username or password incorrect"
         *          loginMsg.visible = "true" />
         *      <a:state id="stError"
         *          loginMsg.value   = "An error has occurred. Please check your network."
         *          loginMsg.visible = "true" />
         *      <a:state id="stLoggingIn"
         *          loginMsg.value    = "Please wait while logging in..."
         *          loginMsg.visible  = "true"
         *          winLogin.disabled = "true" />
         *      <a:state id="stIdle" />
         *  </a:state-group>
         * </code>
         * @addnode elements
         * @see element.state
         */
        "state-group" : function(q, amlParent){
            var name = q.getAttribute("name") || "stategroup" + apf.all.length;
            var pState = apf.StateServer.addGroup(name, null, amlParent);

            var nodes = q.childNodes, attr = q.attributes, al = attr.length;
            for (var j, i = 0, l = nodes.length; i < l; i++){
                var node = nodes[i];

                if (node.nodeType != 1 || node[apf.TAGNAME] != "state")
                    continue;

                for (j = 0; j < al; j++) {
                    if (!node.getAttribute(attr[j].nodeName))
                        node.setAttribute(attr[j].nodeName, attr[j].nodeValue);
                }

                node.setAttribute("group", name);

                //Create Object en Reference and load AML
                new apf.state(amlParent ? amlParent.pHtmlNode : document.body, "state", node)
                    .loadAml(node, pState);
            }

            return pState;
        },
        //#endif

        //#ifdef __WITH_ICONMAP
        /**
         * @define iconmap element that provides a means to get icons from a
         * single image containing many icons.
         * Example:
         * <code>
         *  <a:iconmap id="tbicons" src="toolbar.icons.gif"
         *    type="horizontal" size="20" offset="2,2" />
         *
         *  <a:menu id="mmain" skin="menu2005">
         *      <a:item icon="tbicons:1">Copy</a:item>
         *      <a:item icon="tbicons:2">Cut</a:item>
         *  </a:menu>
         * </code>
         * @attribute {String} src    the location of the image.
         * @attribute {String} type   the spatial distribution of the icons within the image.
         *   Possible values:
         *   horizontal the icons are horizontally tiled.
         *   vertically the icons are vertically tiled.
         * @attribute {String} size   the width and height in pixels of an icon. Use this for square icons.
         * @attribute {String} width  the width of an icon in pixels.
         * @attribute {String} height the height of an icon in pixels.
         * @attribute {String} offset the distance from the calculated grid point that has to be added. This value consists of two numbers seperated by a comma. Defaults to 0,0.
         * @addnode elements
         */
        "iconmap" : function(q, amlParent){
            var name = q.getAttribute("id");

            //#ifdef __DEBUG
            if (!name) {
                throw new Error(apf.formatErrorString(0, null,
                    "Creating icon map",
                    "Could not create iconmap. Missing id attribute", q));
            }
            //#endif

            return apf.skins.addIconMap({
                name   : name,
                src    : q.getAttribute("src"),
                type   : q.getAttribute("type"),
                size   : parseInt(q.getAttribute("size")),
                width  : parseInt(q.getAttribute("width")),
                height : parseInt(q.getAttribute("height")),
                offset : (q.getAttribute("offset") || "0,0").splitSafe(",")
            });
        },
        //#endif

        //#ifdef __JWINDOW || __JMODALWINDOW
        /**
         * @define window Alias for {@link element.modalwindow}.
         * @addnode element
         */
        "window" : function(q, amlParent, pHtmlNode){
            //Create Object en Reference
            var o = new apf.modalwindow(pHtmlNode, "window", q);

            //Process AML
            o.loadAml(q, amlParent);

            //apf.windowManager.addForm(q); //@todo rearchitect this

            return o;
        },
        //#endif

        //#ifdef __WITH_PRESENTATION
        /**
         * @define style element containing css
         * @addnode global, anyaml
         */
        "style" : function(q){
            apf.importCssString(document, q.firstChild.nodeValue);
        },

        /**
         * @define comment all elements within the comment tag are ignored by the parser.
         * @addnode anyaml
         */
        "comment" : function (q){
            //do nothing
        },

        /**
         * @define presentation element containing a skin definition
         * @addnode global, anyaml
         */
        "presentation" : function(q){
            var name = "skin" + Math.round(Math.random() * 100000);
            q.parentNode.setAttribute("skin", name);
            apf.skins.skins[name] = {name:name,templates:{}}
            var t    = q.parentNode[apf.TAGNAME];
            var skin = q.ownerDocument.createElement("skin"); skin.appendChild(q);
            apf.skins.skins[name].templates[t] = skin;
        },

        /**
         * @define skin element specifying the skin of an application.
         * Example:
         * <code>
         *  <a:skin src="perspex.xml"
         *    name       = "perspex"
         *    media-path = "http://example.com/images"
         *    icon-path  = "http://icons.example.com" />
         * </code>
         * @attribute {String} name       the name of the skinset.
         * @attribute {String} src        the location of the skin definition.
         * @attribute {String} media-path the basepath for the images of the skin.
         * @attribute {String} icon-path  the basepath for the icons used in the elements using this skinset.
         * @addnode global, anyaml
         */
        "skin" : function(q, amlParent){
            if (amlParent) {
                var name = "skin" + Math.round(Math.random() * 100000);
                q.parentNode.setAttribute("skin", name);
                apf.skins.skins[name] = {name: name, templates: {}};
                apf.skins.skins[name].templates[q.parentNode[apf.TAGNAME]] = q;
            }
            else if (q.childNodes.length) {
                apf.skins.Init(q);
            }
            else {
                var path = q.getAttribute("src")
                    ? apf.getAbsolutePath(apf.hostPath, q.getAttribute("src"))
                    : apf.getAbsolutePath(apf.hostPath, q.getAttribute("name")) + "/index.xml";

                apf.loadAmlInclude(q, true, path);
            }
        },
        //#endif

        //#ifdef __WITH_DATABINDING || __WITH_XFORMS

        "model" : function(q, amlParent){
            var model = new apf.model().loadAml(q, amlParent);

            if (amlParent && amlParent.hasFeature(__DATABINDING__)) {
                modelId = "model" + amlParent.uniqueId;
                amlParent.$aml.setAttribute("model", modelId);
                model.register(amlParent);
                apf.nameserver.register("model", modelId, model);
            }

            return model;
        },

        //#ifdef __WITH_SMARTBINDINGS
        "smartbinding" : function(q, amlParent){
            var bc = new apf.smartbinding(q.getAttribute("id"), q, amlParent);

            if (amlParent && amlParent.hasFeature(__DATABINDING__))
                apf.AmlParser.addToSbStack(amlParent.uniqueId, bc);

            return bc;
        },

        "ref" : function(q, amlParent){
            if (!amlParent || !amlParent.hasFeature(__DATABINDING__))
                return apf.AmlParser.invalidAml(q);

            apf.AmlParser.getFromSbStack(amlParent.uniqueId)
                .addBindRule(q, amlParent);
        }, //not referencable

        "bindings" : function(q, amlParent){
            if (amlParent && amlParent.hasFeature(__DATABINDING__))
                apf.AmlParser.getFromSbStack(amlParent.uniqueId)
                    .addBindings(apf.getRules(q), q);

            return q;
        },

        "action" : function(q, amlParent){
            if (!amlParent || !amlParent.hasFeature(__DATABINDING__))
                return apf.AmlParser.invalidAml(q);

            apf.AmlParser.getFromSbStack(amlParent.uniqueId)
                .addActionRule(q, amlParent);
        }, //not referencable

        "actions" : function(q, amlParent){
            if (amlParent && amlParent.hasFeature(__DATABINDING__)) {
                apf.AmlParser.getFromSbStack(amlParent.uniqueId)
                    .addActions(apf.getRules(q), q);
            }

            return q;
        },

        // #endif
        // #endif

        // #ifdef __WITH_ACTIONTRACKER
        "actiontracker" : function(q, amlParent){
            var at = new apf.actiontracker(amlParent);
            at.loadAml(q);

            if (amlParent) {
                at.$setParent(amlParent);
                amlParent.$at = at;
            }

            return at;
        },
        //#endif

        // #ifdef __WITH_CONTEXTMENU

        /**
         * @for AmlNode
         * @define contextmenu element specifying which menu is shown when a
         * contextmenu is requested by a user for a aml node.
         * Example:
         * This example shows a list that shows the mnuRoot menu when the user
         * right clicks on the root {@link term.datanode data node}. Otherwise the mnuItem menu is
         * shown.
         * <code>
         *  <a:list>
         *      <a:contextmenu menu="mnuRoot" select="root" />
         *      <a:contextmenu menu="mnuItem" />
         *  </a:list>
         * </code>
         * @attribute {String} menu   the id of the menu element.
         * @attribute {String} select the xpath executed on the selected element of the databound element which determines whether this contextmenu is shown.
         */
        "contextmenu" : function(q, amlParent){
            if (!amlParent)
                return apf.AmlParser.invalidAml(q); //not supported

            if (!amlParent.contextmenus)
                amlParent.contextmenus = [];
            amlParent.contextmenus.push(q);
        },

        //#endif

        // #ifdef __WITH_DRAGDROP
        "allow-drag" : function(q, amlParent){
            if (!amlParent || !amlParent.hasFeature(__DATABINDING__))
                return apf.AmlParser.invalidAml(q);

            apf.AmlParser.getFromSbStack(amlParent.uniqueId)
                .addDragRule(q, amlParent);
        },  //not referencable

        "allow-drop" : function(q, amlParent){
            if (!amlParent || !amlParent.hasFeature(__DATABINDING__))
                return apf.AmlParser.invalidAml(q);

            apf.AmlParser.getFromSbStack(amlParent.uniqueId)
                .addDropRule(q, amlParent);
        },  //not referencable

        "dragdrop" : function(q, amlParent){
            var rules = apf.getRules(q);

            if (amlParent && amlParent.hasFeature(__DATABINDING__)) {
                apf.AmlParser.getFromSbStack(amlParent.uniqueId)
                    .addDragDrop(rules, q);
            }

            return rules;
        },
        // #endif

        // #ifdef __WITH_TELEPORT
        "teleport" : function(q, amlParent){
            //Initialize Communication Component
            return apf.teleport.loadAml(q, amlParent);
        },
        // #endif

        // #ifdef __WITH_RSB
        "remote" : function(q, amlParent){
            //Remote Smart Bindings
            return new apf.remote(q.getAttribute("id"), q, amlParent);
        },
        // #endif

        "appsettings" : function(q, amlParent){
            return apf.appsettings.loadAml(q, amlParent);
        }

        //#ifdef __DESKRUN
        , "deskrun" : function(q){
            if (!apf.isDeskrun) return;
            apf.window.loadAml(q); //@todo rearchitect this
        }
        //#endif

        /**
         * @define loader Element defining the html that is shown while the
         * application is loading.
         * Example:
         * <code>
         *  <a:loader>
         *      <div class="loader">
         *          Loading...
         *      </div>
         *  </a:loader>
         * </code>
         * @addnode global
         */
        , "loader" : function(q){
            //ignore, handled elsewhere
        }
    },

    // #ifdef __WITH_SMARTBINDINGS
    getSmartBinding : function(id){
        return apf.nameserver.get("smartbinding", id);
    },
    // #endif

    // #ifdef __WITH_ACTIONTRACKER
    getActionTracker : function(id){
        var at = apf.nameserver.get("actiontracker", id);
        if (at)
            return at;
        if (self[id])
            return self[id].getActionTracker();
    },
    // #endif

    // #ifdef __WITH_PRESENTATION
    replaceNode : function(newNode, oldNode){
        var nodes = oldNode.childNodes;
        for (var i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].host) {
                nodes[i].host.pHtmlNode = newNode;
            }
            newNode.insertBefore(nodes[i], newNode.firstChild);
        }

        newNode.onresize = oldNode.onresize;

        return newNode;
    },
    // #endif

    parseLastPass : function(){
        /* #ifdef __WITH_EDITMODE
        return;
        #endif */

        //#ifdef __DEBUG
        apf.console.info("Parse final pass");
        //#endif

        //#ifdef __WITH_OFFLINE //@todo remove this
        //if (!apf.appsettings.offline)
        //   apf.offline.init();
        //#endif

        apf.parsingFinalPass = true;

        /*
            All these component dependant things might
            be suited better to be in a component generation
            called event
        */

        //#ifdef __WITH_DATABINDING || __WITH_XFORMS || __WITH_SMARTBINDINGS
        while (this.hasNewSbStackItems) {
            var sbInit              = this.sbInit;
            this.sbInit             = {};
            this.hasNewSbStackItems = false;

            //Initialize Databinding for all GUI Elements in Form
            for (var uniqueId in sbInit) {
                if (parseInt(uniqueId) != uniqueId)
                    continue;

                //Retrieve Aml Node
                var jNode = apf.lookup(uniqueId);

                //Set Main smartbinding
                if (sbInit[uniqueId][0]) {
                    jNode.$propHandlers["smartbinding"]
                        .call(jNode, sbInit[uniqueId][0], true);
                }

                //Set selection smartbinding if any
                if (sbInit[uniqueId][1])
                    jNode.$setMultiBind(sbInit[uniqueId][1]);
            }
        }
        this.sbInit = {};
        //#endif

        //Initialize property bindings
        var s = this.stateStack;
        for (var i = 0; i < s.length; i++) {
            //if (s[i].name == "visible" && !/^\{.*\}$/.test(s[i].value)) //!apf.dynPropMatch.test(pValue)
                //continue; //@todo check that this code can be removed...
            //#ifdef __WITH_PROPERTY_BINDING
            s[i].node.setDynamicProperty(s[i].name, s[i].value);
            /* #else
            s[i].node.setProperty(s[i].name, s[i].value);
            #endif */
        }
        this.stateStack = [];

        //#ifdef __WITH_MODEL || __WITH_XFORMS
        //Initialize Models
        while (this.hasNewModelStackItems) {
            var amlNode, modelInit     = this.modelInit;
            this.modelInit             = {};
            this.hasNewModelStackItems = false;

            for (var data,i = 0; i < modelInit.length; i++) {
                data    = modelInit[i][1];
                data[0] = data[0].substr(1);

                amlNode = eval(data[0]);
                if (amlNode.connect)
                    amlNode.connect(modelInit[i][0], null, data[2], data[1] || "select");
                else
                    amlNode.setModel(new apf.model().loadFrom(data.join(":")));
            }
        }
        this.modelInit = [];
        //#endif

        //Call the onload event
        //if (!apf.loaded) {
            var initalLoad = apf.loaded;
            apf.loaded = true;
            apf.dispatchEvent("load", {
                initialLoad : initalLoad
            });
        //}

        //#ifdef __WITH_XFORMS
        var models = apf.nameserver.getAll("model");
        for (var i = 0; i < models.length; i++)
            models[i].dispatchEvent("xforms-ready");
        //#endif

        // #ifdef __WITH_ANCHORING || __WITH_ALIGNMENT || __WITH_GRID
        apf.layout.processQueue();
        apf.layout.activateRules();
        //#endif

        if (!this.loaded) {
            //#ifdef __DESKRUN
            if (apf.isDeskrun)
                apf.window.deskrun.Show();
            //#endif

            //#ifdef __WITH_FOCUS
            //Set the default selected element
            if (!apf.window.focussed)
                apf.window.focusDefault();
            //#endif

            this.loaded = true;
            apf.dispatchEvent("done");
        }

        //END OF ENTIRE APPLICATION STARTUP

        //#ifdef __DEBUG
        apf.console.info("Initialization finished");
        //#endif

        //#ifdef __DEBUG
        apf.Latometer.end();
        apf.Latometer.addPoint("Total time for final pass");
        //#endif

        apf.isParsing = false;
        apf.parsingFinalPass = false;
    }

    // #ifdef __WITH_DATABINDING || __WITH_XFORMS || __WITH_SMARTBINDINGS
    ,
    addToSbStack : function(uniqueId, sNode, nr){
        this.hasNewSbStackItems = true;

        return ((this.sbInit[uniqueId]
            || (this.sbInit[uniqueId] = []))[nr||0] = sNode);
    },

    getFromSbStack : function(uniqueId, nr, create){
        this.hasNewSbStackItems = true;
        if (nr) {
            if (!create)
                return (this.sbInit[uniqueId] || {})[nr];

            return this.sbInit[uniqueId]
                && (this.sbInit[uniqueId][nr]
                    || (this.sbInit[uniqueId][nr] = new apf.smartbinding()))
                || ((this.sbInit[uniqueId] = [])[nr] = new apf.smartbinding());
        }

        return !this.sbInit[uniqueId]
            && (this.sbInit[uniqueId] = [new apf.smartbinding()])[0]
            || this.sbInit[uniqueId][0]
            || (this.sbInit[uniqueId][0] = new apf.smartbinding());
    },

    stackHasBindings : function(uniqueId){
        return (this.sbInit[uniqueId] && this.sbInit[uniqueId][0]
          && this.sbInit[uniqueId][0].bindings);
    }
    // #endif

    // #ifdef __WITH_MODEL
    ,

    addToModelStack : function(o, data){
        this.hasNewModelStackItems = true;
        this.modelInit.push([o, data]);
    }
    // #endif
};

//#endif

//#ifdef __WITH_HTML5
/**
 * @define input
 * Remarks:
 * Ajax.org Platform supports the input types specified by the WHATWG html5 spec.
 * @attribute {String} type the type of input element.
 *   Possible values:
 *   email      provides a way to enter an email address.
 *   url        provides a way to enter a url.
 *   password   provides a way to enter a password.
 *   datetime   provides a way to pick a date and time.
 *   date       provides a way to pick a date.
 *   month      provides a way to pick a month.
 *   week       provides a way to pick a week.
 *   time       provides a way to pick a time.
 *   number     provides a way to pick a number.
 *   range      provides a way to select a point in a range.
 *   checkbox   provides a way to set a boolean value.
 *   radio      used in a set, it provides a way to select a single value from multiple options.
 *   file       provides a way to upload a file.
 *   submit     provides a way to submit data.
 *   image      provides a way to submit data displaying an image instead of a button.
 *   reset      provides a way to reset entered data.
 * @addnode elements
 */
/**
 * @private
 */
apf.HTML5INPUT = {
    "email"    : "textbox",
    "url"      : "textbox",
    "password" : "textbox",
    "datetime" : "spinner", //@todo
    "date"     : "calendar",
    "month"    : "spinner", //@todo
    "week"     : "spinner", //@todo
    "time"     : "spinner", //@todo
    "number"   : "spinner",
    "range"    : "slider",
    "checkbox" : "checkbox",
    "radio"    : "radiobutton",
    "file"     : "fileuploadbox",
    "submit"   : "submit",
    "image"    : "submit",
    "reset"    : "button"
};

//#endif

apf.Init.run('apf.AmlParser');
