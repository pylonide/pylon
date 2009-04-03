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

//#ifdef __WITH_DEBUG_WIN

jpf.DebugInfoStack = [];

Function.prototype.toHTMLNode = function(highlight){
    var code, line1, line2;

    TYPE_OBJECT     = "object";
    TYPE_NUMBER     = "number";
    TYPE_STRING     = "string";
    TYPE_ARRAY      = "array";
    TYPE_DATE       = "date";
    TYPE_REGEXP     = "regexp";
    TYPE_BOOLEAN    = "boolean";
    TYPE_FUNCTION   = "function";
    TYPE_DOMNODE    = "dom node";
    TYPE_JAVNODE    = "Javeline Component";

    STATE_UNDEFINED = "undefined";
    STATE_NULL      = "null";
    STATE_NAN       = "nan";
    STATE_INFINITE  = "infinite";

    /**
     * @private
     */
    function getType(variable){
        if (variable === null)
            return STATE_NULL;
        if (variable === undefined)
            return STATE_UNDEFINED;
        if (typeof variable == "number" && isNaN(variable))
            return STATE_NAN;
        if (typeof variable == "number" && !isFinite(variable))
            return STATE_INFINITE;


        if (typeof variable == "object") {
            if (variable.hasFeature)
                return TYPE_JAVNODE;
            if (variable.tagName || variable.nodeValue)
                return TYPE_DOMNODE;
        }

        if (variable.dataType == undefined)
            return TYPE_OBJECT;

        return variable.dataType;
    }

    //anonymous
    code         = this.toString();
    var endLine1 = code.indexOf("\n");
    line1        = code.slice(0, endLine1);
    line2        = code.slice(endLine1+1);

    var res      = /^function(\s+(.*?)\s*|\s*?)\((.*)\)(.*)$/.exec(line1);
    if (res) {
        var name = res[1];
        var args = res[3];
        var last = res[4]; //NOT USED?

        if (this.arguments) {
            var argName, namedArgs = args.split(",");
            args = [];

            for (var i = 0; i < this.arguments.length; i++) {
                //if(i != 0 && arr[i]) args += ", ";
                argName  = (namedArgs[i] || "__NOT_NAMED__").trim();// args += "<b>" + arr[i] + "</b>";

                var info = ["Name: " + argName];
                var id   = jpf.DebugInfoStack.push(info) - 1;

                args.push("<a href='javascript:void(0)' onclick='alert(jpf.DebugInfoStack["
                    + id + "].join(\"\\n\"));event.cancelBubble=true;'>" + argName + "</a>");
                info.push("Type: " + getType(this.arguments[i]));
                info.push("Value: " + jpf.vardump(this.arguments[i], null, false));
            }
        }
        else if (jpf.isGecko) {
            args = args.splitSafe(",");
            var result = [];
            var argName;
            for (var i = 0; i < args.length; i++) {
                var firstChar = args[i].charAt(0);
                
                if (firstChar == "[")
                    argName = "object";
                else if (firstChar == '"')
                    argName = "string";
                else if (firstChar == 't' || firstChar == 'f')
                    argName = "boolean";
                else 
                    argName = "number";    
                
                var info = ["Type: " + argName];
                var id   = jpf.DebugInfoStack.push(info) - 1;

                result.push("<a href='javascript:void(0)' onclick='alert(jpf.DebugInfoStack["
                    + id + "].join(\"\\n\"));event.cancelBubble=true;'>" + argName + "</a>");
                info.push("Value: " + jpf.vardump(args[i], null, false));
            }
            
            args = result;
        }

        line2 = line2.replace(/\{/ , "");
        line2 = line2.substr(0, line2.length-2);

        if (!highlight) {
            //fine common start whitespace count
            line2 = jpf.debugwin.outdent(line2);
            line2 = line2.replace(/ /g, "&nbsp;");
            line2 = line2.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;");
            line2 = line2.replace(/\n/g, "</nobr><br><nobr>&nbsp;&nbsp;&nbsp;&nbsp;");
            line2 = "{<br><nobr>&nbsp;&nbsp;&nbsp;" + line2 + "</nobr><br>}";
        }
        else {
            line2 = "{\n" + line2 + "\n}\n";
            var div = dp.SyntaxHighlighter.HighlightString(line2, false, false);
        }

        var d = document.createElement("div");
        res   = "<div>\
            <div style='padding:0px 0px 2px 0px;cursor:default;' onclick=\"\
              var oFirst = this.getElementsByTagName('img')[0];\
              var oLast = this.getElementsByTagName('div')[0];\
              if (oLast.style.display == 'block') {\
                  oLast.style.display = 'none';\
                  oFirst.src='" + jpf.debugwin.resPath + "arrow_right.gif';\
              } else {\
                  oLast.style.display = 'block';\
                  oFirst.src='" + jpf.debugwin.resPath + "arrow_down.gif';\
              }\
              if (jpf.layout)\
                 jpf.layout.forceResize(jpf.debugwin.oExt);\
              event.cancelBubble=true\">\
                <nobr>"
                      + (this.url
                        ? "<a href='" + this.url + "' target='_blank' style='float:right'>" 
                                + jpf.getFilename(this.url) + 
                            " (" + this.line + ")</a>"
                        : "")
                      + "<img width='9' height='9' src='" + jpf.debugwin.resPath
                      + "arrow_right.gif' style='margin:0 3px 0 2px;' />"
                      + (name.trim() || "anonymous") + "(" + args.join(", ") + ")&nbsp;\
                </nobr>\
                <div onclick='event.cancelBubble=true' onselectstart='if (jpf.dragmode.mode) return false; event.cancelBubble=true' style='\
                  cursor: text;\
                  display: none;\
                  padding: 0px;\
                  background-color: #f6f6f6;\
                  color: #222;\
                  overflow: auto;\
                  margin-top: 2px;'>\
                    <blockquote></blockquote>\
                </div>\
            </div>\
        </div>";
        d.innerHTML = res;
        var b = d.getElementsByTagName("blockquote")[0];

        if (highlight) {
            b.replaceNode(div);
        }
        else {
            b.insertAdjacentHTML("beforeBegin", line2);
            b.parentNode.removeChild(b);
        }

        return d.firstChild;
    }
    else {
        return this.toString();
    }
}

/* *****************
 ** Error Handler **
 *******************/

jpf.debugwin = {
    useDebugger  : jpf.getcookie("debugger") == "true",
    profileGlobal: jpf.getcookie("profileglobal") == "true",
    resPath      : "",
    errorTable   : "debug_panel_errortable",
    contextDiv   : "debug_panel_jmlcontext",
    stackTrace   : "debug_panel_stacktrace",//null, //blockquote[0]
    logView      : "jvlnviewlog",
    debugConsole : "jpfDebugExpr",
    
    outdent : function(str, skipFirst){
        var lines = str.split("\n");
        for (var min = 1000, m, i = skipFirst ? 1 : 0; i < lines.length; i++) {
            if (!lines[i].trim()) 
                continue;
                
            m = lines[i].match(/^[\s \t]+/);
            if (!m) {
                min = 0;
                break;
            }
            else min = Math.min(min, m[0].length);
        }
        if (min) {
            for (var i = skipFirst ? 1 : 0; i < lines.length; i++) {
                lines[i] = lines[i].substr(min);
            }
        }
        return lines.join("\n");
    },

    init : function(){
        if (jpf.getcookie("highlight") == "true" && self.BASEPATH) {
            //<script class="javascript" src="../Library/Core/Highlighter/shCore.uncompressed.js"></script>
            //<script class="javascript" src="../Library/Core/Highlighter/shBrushJScript.js"></script>
            jpf.include(BASEPATH + "Library/Core/Highlighter/shCore.uncompressed.js");
            jpf.include(BASEPATH + "Library/Core/Highlighter/shBrushJScript.js");
            //<link type="text/css" rel="stylesheet" href="../Library/Core/Highlighter/SyntaxHighlighter.css" />
            jpf.loadStylesheet(BASEPATH + "Library/Core/Highlighter/SyntaxHighlighter.css");
        }
        else if (self.SyntaxHighlighterCSS) {
            jpf.importCssString(document, SyntaxHighlighterCSS);
        }
        else {
            jpf.setcookie("highlight", false)
        }

        // #ifndef __PACKAGED
        this.resPath = (jpf.appsettings.resourcePath || jpf.basePath) + "core/debug/resources/";
        /* #else
        this.resPath = (jpf.appsettings.resourcePath || jpf.basePath) + "resources/";
        #endif */
        /* #ifdef __WITH_CDN
        this.resPath = jpf.CDN + jpf.VERSION + "/resources/";
        #endif */

        if (!this.useDebugger) {
            jpf.debugwin.toggleDebugger(false);
            //window.onerror = jpf.debugwin.errorHandler;

            if (jpf.isGecko)
                var error = Error;

            if (jpf.isOpera || jpf.isSafari || jpf.isGecko) {
                self.Error = function(msg){
                    jpf.debugwin.errorHandler(msg, location.href, 0);
                }
                self.Error.custom = true;
            }

            if (jpf.isGecko) {
                jpf.addEventListener("load", function(){
                    self.Error = error;
                });
            }
        }

        if (jpf.getcookie("profilestartup") == "true" && !jpf.profiler.isRunning) {
            if (this.profileGlobal)
                jpf.profiler.init(window, 'window');
            else
                jpf.profiler.init(jpf, 'jpf');
            jpf.profiler.start();
        }

        jpf.addEventListener("hotkey", function(e){
            if (e.keyCode == 120 || e.ctrlKey && e.altKey && e.keyCode == 68) {
                jpf.debugwin.activate();
            }
        })
    },

    hide : function(){
        this.oExt.style.display = "none";
        document.body.style.marginRight = "0";
    },
    
    show : function(e, filename, linenr){
        var list = [], seen = {}, i;

        if (!jpf.isIE && !Error.custom) {
            var stack = new Error().stack.split("\n");
            for (i = 0; i < stack.length; i++) {
                stack[i].trim().match(/^([\w_\$]*)(\(.*?\))?@(.*?):(\d+)$/);
                var name = RegExp.$1;
                var args = RegExp.$2;
                var url  = RegExp.$3;
                var line = RegExp.$4;
                
                list.push(Function.prototype.toHTMLNode.call({
                    toString : function(){
                        return "function " + name + (args || "()") + "{\n...\n}";
                    },
                    url : url,
                    line: line
                }));
            }
            
            /*
                Error()@:0
                ([object Object],"file:///C:/Development/javeline/platform/source/trunk/list.html",0)@file:///C:/Development/javeline/platform/source/trunk/core/debug/debugwin.js:241
                ("User forced debug window to show","file:///C:/Development/javeline/platform/source/trunk/list.html",0,true)@file:///C:/Development/javeline/platform/source/trunk/core/debug/debugwin.js:1305
                ()@file:///C:/Development/javeline/platform/source/trunk/core/debug/debugwin.js:1317
                @file:///C:/Development/javeline/platform/source/trunk/elements/appsettings.js:163

            */
        }
        else {
            //Opera doesnt support caller... weird...
            try {
                var loop = end = jpf.isIE
                  ? this.show.caller.caller
                  : this.show.caller.caller
                      ? this.show.caller.caller.caller
                      : this.show.caller.caller;
                if (loop) {
                    try {
                        do {
                            if (seen[loop.toString()])
                                break; //recursion checker
                            seen[loop.toString()] = true;
                            //str += loop.toHTML();
                            list.push(loop.toHTMLNode(jpf.getcookie("highlight") == "true"));
                            loop = loop.caller;
                        }
                        while (list.length < 30 && loop && loop.caller && loop.caller.caller != loop);
                    }
                    catch(a) {
                        list=[];
                    }
                }
            }
            catch(e){}
        }
        
        if (!jpf.debugwin.win)
            this.createWindow();

        if (e) {
            var parsed = this.formatError(e);
            this.errorTable.innerHTML = parsed.table;
            this.errorTable.parentNode.style.display = "block";
            
            if (parsed.jmlcontext.trim()) {
                this.contextDiv.parentNode.style.display = "block";
                this.contextDiv.innerHTML = parsed.jmlcontext;
            }
            else
                this.contextDiv.parentNode.style.display = "none";
        }
        else {
            this.errorTable.parentNode.style.display = "none";
            this.contextDiv.parentNode.style.display = "none";
        }
        
        if (list.length) {
            this.stackTrace.innerHTML = "";
            for (i = 0; i < list.length; i++)
                this.stackTrace.appendChild(list[i]);
            
            this.stackTrace.parentNode.style.display = "block";
        }
        else {
            this.stackTrace.parentNode.style.display = "none";
        }

        this.oExt.style.display = "block";
        jpf.layout.forceResize(this.oExt);
        this.logView.scrollTop = this.logView.scrollHeight;

        //!self.ERROR_HAS_OCCURRED && 
        if (jpf.addEventListener) {
            jpf.addEventListener("debug", function(e){
                if (!jpf.debugwin.logView) return;

                jpf.debugwin.logView.insertAdjacentHTML("beforeend", e.message);
                jpf.debugwin.logView.style.display = "block";
                jpf.debugwin.logView.scrollTop     = jpf.debugwin.logView.scrollHeight;
            });
        }
    },

    formatError: function(e) {
        var parse         = e.message.split(/\n===\n/),
            jmlContext    = jpf.highlightXml(parse[1] ? jpf.debugwin.outdent(parse[1].trim(true), true).replace(/\t/g, "&nbsp;&nbsp;&nbsp;").replace(/ /g, "&nbsp;") : "")
                //.replace(/</g, "&lt;").replace(/\n/g, "<br />")
            errorMessage  = parse[0].replace(/---- Javeline Error ----\n/g, "")
                .replace(/</g, "&lt;").replace(/Message: \[(\d+)\]/g, "Message: [<a title='Visit the manual on error code $1' style='color:blue;text-decoration:none;' target='_blank' href='http://developer.javeline.net/projects/platform/wiki/ErrorCodes#$1'>$1</a>]"),
                //.replace(/(\n|^)([\w ]+:)/gm, "$1<strong>$2</strong>"),//.replace(/\n/g, "<br />"),
            errorTable    = [];

        errorMessage.replace(/(?:([\w ]+):(.*)(?:\n|$)|([\s\S]+))/gi, function(m, m1, m2) {
            if (!errorTable.length)
                errorTable.push("<table border='0' cellpadding='0' cellspacing='0'>");
            if (m1) {
                if (errorTable.length != 1) {
                    errorTable.push("</td></tr>");
                }
                errorTable.push("<tr><td class='debug_error_header'>",
                    m1, ":</td><td>", m2, "</td>", "</tr>");
            }
            else {
                if (errorTable[errorTable.length - 1] != "</tr>")
                    errorTable.push("</td></tr><tr><td>&nbsp;</td>", "<td>");
                else
                    errorTable.push("<tr><td>&nbsp;</td>", "<td>");
                errorTable.push(m);
            }
        });
        errorTable.push("</td></tr></table>");

        return {table: errorTable.join(''), jmlcontext: jmlContext || ""};
    },

    states      : {},
    setSelected : function(clear){
        var oSelect = document.getElementById("dbgMarkupSelect");

        for (var selected, value = "", i = 0; i < oSelect.childNodes.length; i++) {
            if (oSelect.childNodes[i].selected) {
                value = oSelect.childNodes[i].text;
                selected = oSelect.childNodes[i];
                break;
            }
        }

        if (clear) {
            if (this.lastValue)
                this.states[this.lastValue] = document.getElementById("dbgMarkupInput").value;
            document.getElementById("dbgMarkupInput").value = this.states[value] || "";
        }

        this.lastValue = value;

        if (value.match(/^JML/)) {
            if (dbgMarkup.getModel())
                dbgMarkup.getModel().unregister(dbgMarkup);

            if (selected.value)
                dbgMarkup.load(jpf.includeStack[selected.value]);
            else
                dbgMarkup.load(jpf.JmlParser.$jml);

            return;
        }

        var xpath = document.getElementById("dbgMarkupInput").value;
        var instruction = value + (value.match(/^#/) ? ":select" : "")
        + (xpath ? ":" + xpath : "");

        jpf.setModel(instruction, dbgMarkup);
    },

    exec : function(action){
        if (!action.match(/undo|redo/) && !dbgMarkup.selected)
            return alert("There is no xml element selected. Action not executed");

        switch(action){
            case "remove":
                dbgMarkup.remove(dbgMarkup.selected, true);
                break;
            case "undo":
                dbgMarkup.getActionTracker().undo();
                break;
            case "redo":
                dbgMarkup.getActionTracker().redo();
                break;
            case "textnode":
                dbgMarkup.setTextNode(dbgMarkup.selected, "new value");
                break;
            case "attribute":
                dbgMarkup.setAttributeValue(dbgMarkup.selected, "new", "value");
                break;
        }
    },

    initMarkup : function(oHtml){
        if (!jpf.JmlParser)
            return;// alert("Sorry, the depencies for the Data Debugger could not be loaded");

        if (oHtml.getAttribute("inited")) return;
        oHtml.setAttribute("inited", "true");

        /**
         * @todo change the .attribute to be in the debugmarkup namespace
         * @todo fix the edit state
         */
        var skinXml = '\
        <j:skin id="debug" xmlns:j="' + jpf.ns.jml + '">\
            <j:markupedit name="debugmarkup">\
                <j:style><![CDATA[\
                    .debugmarkup{\
                        background : url(' + this.resPath + 'splitter_docs.gif) no-repeat 50% bottom;\
                        font-family : Monaco, \'Courier New\';\
                        font-size : 11px;\
                        cursor : default;\
                        padding-bottom : 4px;\
                    }\
                    .debugmarkup blockquote{\
                        margin : 0;\
                        padding : 0px;\
                        overflow : auto;\
                        width : 100%;\
                        height : 100%;\
                        position : relative;\
                        line-height : 1.4em;\
                    }\
                    .debugmarkup dl,\
                    .debugmarkup dt,\
                    .debugmarkup dd{\
                        margin : 0;\
                        display:inline;\
                    }\
                    .debugmarkup dt,\
                    .debugmarkup span{\
                        color : #0000FF;\
                    }\
                    .debugmarkup dt{\
                        cursor : hand;\
                        cursor : pointer;\
                    }\
                    .attribute dl,\
                    .attribute dt,\
                    .attribute dd{\
                        display : inline;\
                    }\
                    #override .debugmarkup .textedit{\
                        background-color : white;\
                        color : black;\
                        border : 1px solid black;\
                        padding : 1px 2px 1px 2px;\
                        margin : 2px -4px -2px -3px;\
                        line-height : 1em;\
                    }\
                    #override strong.textedit{\
                        position : relative;\
                    }\
                    #override DIV .attribute DT,\
                    #override DIV .attribute DD{\
                        cursor : text;\
                    }\
                    .attribute dt{\
                        color : #191970;\
                    }\
                    .attribute dd{\
                        color : #FF0000;\
                    }\
                    .debugmarkup dt,\
                    .attribute,\
                    .debugmarkup .selected span{}\
                    .debugmarkup dl.attribute{\
                        padding : 0 0 0 5px;\
                    }\
                    .debugmarkup dl{\
                        height : 18px;\
                        white-space : normal;\
                    }\
                    .debugmarkup dl dt{\
                        white-space : normal;\
                        padding : 1px 2px 2px 2px;\
                    }\
                    .debugmarkup dl dl{\
                        height : 14px;\
                        white-space : nowrap;\
                    }\
                    .debugmarkup dl dl dt{\
                        white-space : nowrap;\
                    }\
                    /*\*/html>body*.debugmarkup dl{height : 12px;}/**/\
                    .debugmarkup span{\
                        display : inline;\
                        padding : 2px;\
                    }\
                    .debugmarkup u{\
                        text-decoration : none;\
                    }\
                    .debugmarkup strong{\
                        font-weight : normal;\
                    }\
                    .debugmarkup .textnode strong{\
                        cursor : text;\
                    }\
                    .debugmarkup DIV{\
                        cursor : default;\
                        padding : 0 0 0 14px;\
                        position : relative;\
                    }\
                    .debugmarkup .selected dl,\
                    .debugmarkup .selected dd,\
                    .debugmarkup .selected dt,\
                    .debugmarkup .selected span,\
                    .debugmarkup .selected strong{\
                        background-color : #25a8e7;\
                        color : #FFFFFF;\
                    }\
                    #override .debugmarkup .highlight{\
                        background-color : #FFFF00;\
                        color : #000000;\
                    }\
                    .debugmarkup I{\
                        width : 9px;\
                        height : 9px;\
                        position : absolute;\
                        left : 2px;\
                        top : 5px;\
                        background-repeat : no-repeat;\
                    }\
                    .debugmarkup I.pluslast {\
                        background-image:url(' + this.resPath + 'splus.gif);\
                    }\
                    .debugmarkup I.minlast {\
                        background-image:url(' + this.resPath + 'smin.gif);\
                    }\
                    .debugmarkup I.plus {\
                        background-image:url(' + this.resPath + 'splus.gif);\
                    }\
                    .debugmarkup I.min {\
                        background-image:url(' + this.resPath + 'smin.gif);\
                    }\
                    .debugmarkup DIV BLOCKQUOTE{\
                        margin : 0;\
                        padding : 0 0 0 10px;\
                        display : none;\
                        height : 0;\
                        overflow : hidden;\
                        width : auto;\
                    }\
                ]]></j:style>\
                <j:presentation>\
                    <j:main container="blockquote" startclosed="false">\
                        <div class="debugmarkup">\
                            <blockquote> </blockquote>\
                        </div>\
                    </j:main>\
                    <j:item class="dl" begintag="dl/dt" begintail="dl/span" endtag="span" attributes="dl" openclose="i" select="dl" container="blockquote">\
                        <div><dl><dt>-</dt><span> </span></dl><blockquote> </blockquote><span>-</span><i> </i></div>\
                    </j:item>\
                    <j:attribute name="dt" value="dd">\
                        <dl class="attribute"><dt> </dt>="<dd> </dd>"</dl>\
                    </j:attribute>\
                    <j:textnode text="strong" tag="u">\
                        <strong class="textnode"><u> </u><strong>-</strong></strong>\
                    </j:textnode>\
                    <j:loading>\
                        <div class="loading"><span> </span><label>Loading...</label></div>\
                    </j:loading>\
                    <j:empty container=".">\
                        <div class="empty"></div>\
                    </j:empty>\
                </j:presentation>\
            </j:markupedit>\
        </j:skin>';
        jpf.skins.Init(jpf.xmldb.getXml(skinXml));

        document.documentElement.setAttribute("id", "override");

        var oInt = document.getElementById("jpf_markupcontainer");
        jpf.test = oHtml;

        //Get all models
        var options, i, list = jpf.nameserver.getAllNames("model");
        for (options = [], i = 0; i < list.length; i++)
            options.push("<option>" + list[i] + "</option>");

        //Get all components
        list = jpf.all;
        for (i = 0; i < list.length; i++) {
            if (list[i] && list[i].name && list[i].hasFeature
              && list[i].hasFeature(__DATABINDING__))
                options.push("<option>#" + list[i].name + "</option>");
        }

        if (!options.length)
            options.push("<option></option>");

        options.push("<option>JML Main</option>");
        for (i = 0; i < jpf.includeStack.length; i++) {
            if (typeof jpf.includeStack[i] == "boolean") continue;
            options.push("<option value='" + i + "'>JML "
                + jpf.getFilename(jpf.includeStack[i].getAttribute("filename"))
                + "</option>");
        }

        options   = options.join('').replace(/option>/, "option selected='1'>");
        var first = options ? options.match(/>([^<]*)</)[1] : "";

        oHtml.getElementsByTagName("label")[0].insertAdjacentHTML("afterend",
            "<select id='dbgMarkupSelect' style='margin-top:2px;float:left;' onchange='jpf.debugwin.setSelected(true)' onkeydown='event.cancelBubble=true;'>" + options + "</select>");

        //<button onclick='jpf.debugwin.setSelected()' onkeydown='event.cancelBubble=true;'>Change</button>\
        var xml = jpf.xmldb.getXml("\
            <j:parent xmlns:j='" + jpf.ns.jml + "'>\
                <j:markupedit skin='debugmarkup' skinset='debug' " + (first ? "model='" + first + "'" : "") + " id='dbgMarkup' render-root='true' height='160' minheight='110' resizable='vertical'>\
                    <j:bindings>\
                        <j:traverse select='node()[local-name(.)]' />\
                    </j:bindings>\
                    <j:actions><j:remove /><j:setAttributeValue /><j:renameAttribute /><j:setTextNode /></j:actions>\
                </j:markupedit>\
            </j:parent>\
        ");

        if (jpf.isIE) {
            xml.ownerDocument.setProperty("SelectionNamespaces",
                "xmlns:j='" + jpf.ns.jml + "'");
        }

        //Reset loading state in case of an error during init
        var j = jpf.JmlParser;
        j.sbInit                = {};
        j.hasNewSbStackItems    = false;
        j.stateStack            = []
        j.modelInit             = []
        j.hasNewModelStackItems = false;
        j.loaded                = true;

        //Load JML
        j.parseMoreJml(xml, oInt);
        
        if (jpf.layout && !jpf.hasSingleRszEvent) {
            jpf.layout.setRules(jpf.getFirstElement(oInt), "resize",
                "jpf.layout.forceResize(jpf.debugwin.oExt);");
            jpf.layout.activateRules(oInt.firstChild);
        }
    },

    PROFILER_ELEMENT   : null,
    PROFILER_BUTTON    : null,
    PROFILER_HEADS     : null,
    PROFILER_SUMMARY   : null,
    PROFILER_PROGRESS  : '<span class="debug_profilermsg debug_progress">The profiler is running. Click \'Stop\' to see its report.</span>',
    PROFILER_NOPROGRESS: '<span class="debug_profilermsg">The profiler is currently inactive. Click \'Start\' to begin profiling your code.<span>',
    initProfiler: function(oHtml) {
        this.PROFILER_ELEMENT = document.getElementById('jpfProfilerOutput');
        this.PROFILER_BUTTON  = document.getElementById('jpfProfilerAction');
        this.PROFILER_SUMMARY = document.getElementById('jpfProfilerSummary');
        this.showProgress();

        if (jpf.profiler.isRunning)
            this.toggleFold(document.getElementById('jpfProfilerPanel'));
    },

    startStop: function(input) {
        input.disabled = true;
        if (!jpf.profiler.isRunning) {
            if (!jpf.profiler.isInitialized()) {
                if (this.profileGlobal)
                    jpf.profiler.init(window, 'window');
                else
                    jpf.profiler.init(jpf, 'jpf');
            }
            jpf.profiler.start();
            this.showProgress();
        }
        else {
            var data = jpf.profiler.stop();
            this.PROFILER_ELEMENT.innerHTML = data.html;
            this.PROFILER_SUMMARY.innerHTML = data.duration + "ms, " + data.total + " calls";
            this.PROFILER_BUTTON.innerHTML  = "Start";
        }
        input.disabled = false;
    },

    showProgress: function() {
        if (!this.PROFILER_ELEMENT) return;
        if (jpf.profiler.isRunning) {
            this.PROFILER_ELEMENT.innerHTML = this.PROFILER_PROGRESS;
            //this.PROFILER_BUTTON.innerHTML  = "Stop";
        }
        else {
            this.PROFILER_ELEMENT.innerHTML = this.PROFILER_NOPROGRESS;
            //this.PROFILER_BUTTON.innerHTML  = "Start";
        }
    },

    resortResult: function(th) {
        //if (!radio.checked) return;
        var data = jpf.profiler.resortStack(parseInt(th.getAttribute('rel')));

        this.PROFILER_ELEMENT.innerHTML = data.html;
        this.PROFILER_SUMMARY.innerHTML = data.duration + "ms, " + data.total + " calls";
    },

    toggleProfileStartup: function(checked) {
        if (jpf.setcookie)
            jpf.setcookie("profilestartup", checked);
    },

    toggleProfileGlobal: function(checked) {
        this.profileGlobal = checked;
        if (checked)
            jpf.profiler.reinit(window, 'window');
        else
            jpf.profiler.reinit(jpf, 'jpf');
        if (jpf.setcookie)
            jpf.setcookie("profileglobal", checked);
    },

    toggleFold: function(oNode, corrScroll, corrFocus) {
        if (typeof corrScroll == "undefined")
            corrScroll = false;
        if (typeof corrFocus == "undefined")
            corrFocus  = false;

        var oFirst = oNode.getElementsByTagName('img')[0];
        var oLast  = oNode.lastChild;
        while (oLast.nodeType != 1) 
            oLast = oLast.previousSibling;
            
        if (jpf.getStyle(oLast, "display") == "block"){
            oLast.style.display = "none";
            oFirst.src          = this.resPath + "arrow_gray_right.gif";
        }
        else {
            oLast.style.display = "block";
            oFirst.src          = this.resPath + "arrow_gray_down.gif";
            if (corrScroll)
                oLast.scrollTop = oLast.scrollHeight;
            if (corrFocus) {
                oFirst = oLast.firstChild;
                while (oFirst.nodeType != 1) oFirst = oFirst.nextSibling;
                oFirst.focus();
            }
        }

        if (jpf.layout)
            jpf.layout.forceResize(this.oExt);
    },
    
    $getOption : function(){
        return 7; // muuh? what's this?
    },

    focusFix   : {"INPUT":1,"TEXTAREA":1,"SELECT":1},
    createWindow : function (e, stackTrace, errorInfo){
        if (!jpf.debugwin.win)
            jpf.debugwin.win = document.getElementById("jpf_debugwin");
        if (jpf.debugwin.win) return;

        var elError, p, m, o;

        if (document.body) {
            elError    = document.body.appendChild(document.createElement("div"));
            elError.id = "jpf_debugwin";
        }
        else {
            document.write("<div id='jpf_debugwin'></div>");
            elError = document.getElementById("jpf_debugwin");
        }

        elError.style.position = jpf.supportFixedPosition ? "fixed" : "absolute";

        elError.host = this;
        this.name    = "Debug Window";
        this.tagName = "debugwin";

        elError.onmousedown  = function(e) {
            if (!e) e = event;

            //#ifdef __WITH_WINDOW_FOCUS
            if (jpf.hasFocusBug
              && !jpf.debugwin.focusFix[(e.srcElement || e.target).tagName]) {
                jpf.window.$focusfix();
            }
            //#endif

            (e || event).cancelBubble = true;
        };

        this.dispatchEvent    = function(){}
        elError.onkeydown     =
        elError.onkeyup       = function(e){
            if (!e) e = event;

            if (jpf.debugwin.focusFix[(e.srcElement || e.target).tagName])
                (e || event).cancelBubble = true;
        }

        if (jpf.isIE) {
            jpf.setStyleRule("BODY", "overflow", "", 0);

            p = jpf.getBox(jpf.getStyle(document.body, "padding"));
            m = jpf.getBox(jpf.getStyle(document.body, "margin"));
            o = [jpf.getStyle(document.documentElement, "overflow"),
                     jpf.getStyle(document.documentElement, "overflowX"),
                     jpf.getStyle(document.documentElement, "overflowY")];
        }
        else {
            p = [parseInt(jpf.getStyle(document.body, "padding-top")),
                 parseInt(jpf.getStyle(document.body, "padding-right")),
                 parseInt(jpf.getStyle(document.body, "padding-bottom")),
                 parseInt(jpf.getStyle(document.body, "padding-left"))];
            m = [parseInt(jpf.getStyle(document.body, "margin-top")),
                 parseInt(jpf.getStyle(document.body, "margin-right")),
                 parseInt(jpf.getStyle(document.body, "margin-bottom")),
                 parseInt(jpf.getStyle(document.body, "margin-left"))];
            o = [jpf.getStyleRule("html", "overflow") || "auto",
                     jpf.getStyleRule("html", "overflow-x") || "auto",
                     jpf.getStyleRule("html", "overflow-y") || "auto"];
        }

        jpf.importCssString(document, "\
            html{\
                height : 100%;\
                overflow : hidden;\
                overflow-x : hidden;\
                overflow-y : hidden;\
                margin-bottom : " + (p[0] + m[0] + p[2] + m[2]) + "px;\
            }\
            body{\
                height : 100%;\
                position : relative;\
                overflow  : " + o[0] + ";\
                overflow-x : " + o[1] + ";\
                overflow-y : " + o[2] + ";\
                margin : 0 605px 0 0;\
                padding : " + (p[0] + m[0]) + "px " +
                              (p[1] + m[1]) + "px " +
                              (p[2] + m[2]) + "px " +
                              (p[3] + m[3]) + "px;\
                width : auto;\
            }\
            #jpf_debugwin {\
                top: 0px;\
                border-left: 1px solid #bbb;\
                text-align: left;\
                width: 500px;\
                background: #fff url(" + this.resPath + "splitter_handle_vertical.gif) no-repeat 1px 50%;\
                right: 0px;\
                font-family: 'Lucida Grande', Arial, Monaco, 'MS Sans Serif';\
                font-size: 11px;\
                color: #333;\
                overflow: hidden;\
                z-index: 99999;\
                height: 100%;\
                padding-left: 4px;\
                display : none;\
            }\
            #cbTW, #cbHighlight, #toggledebug{\
                float: left;\
            }\
            #jpf_debugwin button, #jpf_debugwin select, #jpf_debugwin input, #jpf_debugwin label{\
                font-size: 10px;\
            }\
            #override #jpf_debugwin{\
                letter-spacing: 0;\
                font-family: 'Lucida Grande', Arial;\
            }\
            #jpf_debugwin label{\
                padding: 5px 0 0 1px;\
                width: auto;\
            }\
            #jpf_debugwin button{\
                padding: 0;\
                margin: 0 0 2px 0;\
            }\
            #jpf_debugwin .debug_header{\
                position: relative;\
                background: url(" + this.resPath + "backgrounds.png) repeat-x 0 -145px;\
                border-bottom: 1px solid #505050;\
                height: 66px;\
                -moz-user-select: none;\
                -khtml-user-select: none;\
                user-select: none;\
            }\
            #jpf_debugwin .debug_header_cont{\
                background: url(" + this.resPath + "ajax_logo.png) no-repeat right 4px;\
                width: 100%;\
                height: 66px;\
            }\
            #jpf_debugwin .debug_closebtn,\
            #jpf_debugwin .debug_closebtn_hover{\
                cursor: hand;\
                cursor: pointer;\
                right: 8px;\
                top: 6px;\
                z-index: 1000;\
                margin: 0px;\
                width: 16px;\
                height: 16px;\
                overflow: hidden;\
                padding: 0;\
                position: absolute;\
                background: url(" + this.resPath + "buttons.png) no-repeat -176px -16px;\
            }\
            #jpf_debugwin .debug_closebtn_hover{\
                background-position: -176px 0px;\
            }\
            #jpf_debugwin .debug_logos{\
                background: url(" + this.resPath + "jpf_logo.png) no-repeat 5px 5px;\
                position: absolute;\
                top: 0px;\
                height: 50px;\
                width: 200px;\
                padding: 14px 4px 4px 68px;\
                margin: 0;\
                font-family: Arial, sans-serif, Tahoma, Verdana, Helvetica;\
                color: #fff;\
                font-weight: 100;\
                font-size: 14px;\
                letter-spacing: 0px;\
                line-height: 15px;\
            }\
            #jpf_debugwin .debug_logos .debug_jpf{\
                display: block;\
            }\
            #jpf_debugwin .debug_logos .debug_jpf strong{\
                font-weight: 900;\
                font-family: \'Arial Black\';\
                letter-spacing: -1px;\
            }\
            #jpf_debugwin .debug_logos .debug_jpf_slogan{\
                font-style: italic;\
                font-size: 9px;\
                line-height: 10px;\
                display : block;\
            }\
            #jpf_debugwin .debug_toolbar{\
                position: relative;\
                height: 22px;\
                background: url(" + this.resPath + "backgrounds.png) repeat-x 0 -57px;\
                padding: 0 0 0 4px;\
                font-size: 10px;\
                vertical-align: middle;\
                overflow: hidden;\
                -moz-user-select: none;\
                -khtml-user-select: none;\
                user-select: none;\
            }\
            #jpf_debugwin .debug_toolbar_inner{\
                border-top: 1px solid #cacaca;\
                border-bottom: 1px solid #cacaca;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn{\
                position: relative;\
                border-right: 1px solid #b8b8b8;\
                width: 24px;\
                height: 22px;\
                float: left;\
                cursor: pointer;\
                cursor: hand;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btnright{\
                float: right !important;\
                border-right: none;\
                border-left: 1px solid #b8b8b8;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span{\
                position: absolute;\
                background: url(" + this.resPath + "buttons.png) no-repeat 0 0;\
                width: 16px;\
                height: 16px;\
                top: 4px;\
                left: 4px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.reboot{\
                background-position: -16px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.undo{\
                background-position: -32px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.redo{\
                background-position: -48px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.online{\
                background-position: -64px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.offline{\
                background-position: -80px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.reset{\
                background-position: -96px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.start{\
                background-position: -112px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.remove{\
                background-position: -128px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.textnode{\
                background-position: -144px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn span.attribute{\
                background-position: -160px 0;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.exec{\
                background-position: 0 -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.reboot{\
                background-position: -16px -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.undo{\
                background-position: -32px -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.redo{\
                background-position: -48px -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.online{\
                background-position: -64px -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.offline{\
                background-position: -80px -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.reset{\
                background-position: -96px -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.start{\
                background-position: -112px -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.remove{\
                background-position: -128px -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.textnode{\
                background-position: -144px -16px;\
            }\
            #jpf_debugwin .debug_toolbar .debug_btn_down span.attribute{\
                background-position: -160px -16px;\
            }\
            #jpf_debugwin .debug_footer{\
                width: 100%;\
                position: relative;\
                bottom: 0px;\
                border-bottom: 0;\
                border-left: 1px solid #a3a3a3;\
                -moz-user-select: none;\
                -khtml-user-select: none;\
                user-select: none;\
            }\
            #jpf_debugwin .debug_footer img{\
                position: absolute;\
                top: 0px;\
                right: 0px;\
                border: 0;\
                margin: 0;\
                padding: 0;\
            }\
            #jpf_debugwin .debug_panel{\
                cursor:default;\
                border-left: 1px solid #a3a3a3;\
                padding: 0;\
                margin: 0;\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
            }\
            #jpf_debugwin .debug_panel_head{\
                background: url(" + this.resPath + "backgrounds.png) repeat-x 0 0;\
                height: 17px;\
                padding: 2px 0 0 0;\
                -moz-user-select: none;\
                -khtml-user-select: none;\
                user-select: none;\
            }\
            #jpf_debugwin .debug_panel_head img{\
                margin: 2px 0 0 6px;\
            }\
            #jpf_debugwin .debug_panel_head strong{\
                color: #826e6e;\
            }\
            #jpf_debugwin .debug_panel_headsub{\
                margin-right: 5px;\
                float: right;\
                margin-top: -4px;\
            }\
            #jpf_debugwin .debug_panel_body_base{\
                cursor: text;\
                background: white url(" + this.resPath + "shadow.gif) no-repeat 0 0;\
                padding: 4px;\
                font-family: Monaco, Courier New;\
                margin: 0;\
            }\
            #jpf_debugwin .debug_panel_body_error{\
                padding: 0;\
                margin: 0;\
            }\
            #jpf_debugwin .debug_panel_body_error table{\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
                font-size: 10px;\
                width: 100%;\
            }\
            #jpf_debugwin .debug_panel_body_error td{\
                padding: 2px;\
                border-bottom: 1px solid #e4e4e4;\
                border-left: 1px solid #e4e4e4;\
                margin: 0;\
            }\
            #jpf_debugwin .debug_panel_body_error .debug_error_header{\
                background-color: #449ad0;\
                border-bottom: 1px solid #79afd1;\
                border-left: none;\
                padding-left: 4px;\
                color: #fff;\
                width: 65px;\
                -moz-user-select: none;\
                -khtml-user-select: none;\
                user-select: none;\
            }\
            #jpf_debugwin .debug_panel_body_none{\
                display: none;\
            }\
            #jpf_debugwin .debug_panel_body_markup{\
                padding: 0;\
                white-space: nowrap;\
            }\
            #jpf_debugwin .debug_panel_body_jml{\
                padding: 0;\
                white-space: nowrap;\
                padding : 10px;\
                font-family : 'Lucida Grande', Verdana;\
                font-size : 8.5pt;\
                white-space : normal;\
                overflow : auto;\
                max-height : 200px;\
            }\
            #jpf_debugwin .debug_panel_body_data{\
                min-height: 130px;\
                white-space: nowrap;\
                overflow: auto;\
                display: none;\
                padding : 0;\
            }\
            #jpf_debugwin .debug_panel_body_profiler{\
                padding: 0px;\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
                font-size: 9px;\
                height: 180px;\
                overflow: auto;\
                display: block;\
            }\
            #jpf_debugwin .debug_panel_body_log{\
                height: 250px;\
                overflow: auto;\
                font-size: 8pt;\
                font-family: 'Lucida Grande', Verdana;\
            }\
            #jpf_debugwin .debug_panel_body_console{\
                width: 391px;\
                height: 100px;\
                border: 0;\
                overflow: auto;\
                font-size: 12px;\
            }\
            #jpf_debugwin .debug_profilermsg{\
                margin: 4px;\
                font-weight: 500;\
                height: 20px;\
                line-height: 20px;\
                vertical-align: middle;\
                overflow: visible;\
                padding: 4px;\
            }\
            #jpf_debugwin .debug_progress{\
                background-image: url(" + this.resPath + "progress.gif);\
                background-repeat: no-repeat;\
                background-position: center left;\
                padding-left: 22px;\
            }\
            #jpf_debugwin .debug_console_btn{\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
                font-size: 8pt;\
                margin: 0 0 0 3px;\
            }\
            #jpf_debugwin .debug_check_use{\
                position: relative;\
                top: 4px;\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
                font-size: 8pt;\
            }");

        document.body.style.display = "block";

        var canViewMarkup = jpf.nameserver && jpf.markupedit ? true : false,
            useProfiler   = false;

        elError.innerHTML = "\
            <div class='debug_header'>\
                <div class='debug_header_cont'>\
                    <div onselectstart='if (jpf.dragmode.mode) return false; event.cancelBubble=true' class='debug_logos'>\
                        &nbsp;\
                    </div>\
                    <div class='debug_closebtn' onmouseover='this.className=\"debug_closebtn_hover\"' \
                      onmouseout='this.className=\"debug_closebtn\"' onclick='jpf.debugwin.hide()' title='Close'>&nbsp;</div>\
                </div>\
            </div>\
            <div class='debug_panel' onclick='jpf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_down.gif' />&nbsp;\
                    <strong>Error</strong>\
                </div>\
                <div id='" + this.errorTable + "' onclick='event.cancelBubble=true' \
                  onselectstart='if (jpf.dragmode.mode) return false; event.cancelBubble=true'\
                  class='debug_panel_body_base debug_panel_body_error'>@todo</div>\
            </div>\
            <div class='debug_panel' onclick='jpf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_down.gif' />&nbsp;\
                    <strong>JML related to the error</strong>\
                </div>\
                <div id='" + this.contextDiv + "' onclick='event.cancelBubble=true' \
                  onselectstart='if (jpf.dragmode.mode) return false; event.cancelBubble=true' \
                  class='debug_panel_body_base debug_panel_body_jml'>@todo</div>\
            </div>\
            <div class='debug_panel' onclick='jpf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "/arrow_gray_right.gif' />&nbsp;\
                    <strong>Stack Trace</strong>\
                </div>\
                <div id='" + this.stackTrace + "' class='debug_panel_body_base debug_panel_body_none'></div>\
            </div>" +
        (canViewMarkup
         ? "<div class='debug_panel' onclick='jpf.debugwin.initMarkup(this);jpf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_right.gif' />&nbsp;\
                    <strong>Live Data Debugger (beta)</strong>\
                </div>\
                <div onclick='event.cancelBubble=true' onselectstart='if (jpf.dragmode.mode) return false; event.cancelBubble=true'\
                  class='debug_panel_body_base debug_panel_body_markup debug_panel_body_none'>\
                    <div id='jpf_markupcontainer'> </div>\
                    <div class='debug_toolbar debug_toolbar_inner'>\
                        <label style='float:left'>Model:</label>\
                        <label style='float:left'>XPath:</label><input id='dbgMarkupInput' onkeydown='if(event.keyCode==13) jpf.debugwin.setSelected(true);event.cancelBubble=true;' style='margin-top:2px;width:90px;float:left'/>\
                        <div onclick='jpf.debugwin.exec(\"remove\")' class='debug_btn debug_btnright' title='Remove'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='remove'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.exec(\"textnode\")' class='debug_btn debug_btnright' title='Textnode'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='textnode'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.exec(\"attribute\")' class='debug_btn debug_btnright' title='Attribute'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='attribute'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.exec(\"redo\")' class='debug_btn debug_btnright' title='Redo'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='redo'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.exec(\"undo\")' class='debug_btn debug_btnright' title='Undo'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='undo'> </span>\
                        </div>\
                    </div>\
                </div>\
            </div>"
         : "") +
        (useProfiler
         ? "<div class='debug_panel' id='jpfProfilerPanel' onclick='jpf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_right.gif' />&nbsp;\
                    <strong>Javascript Profiler (beta)</strong>\
                </div>\
                <div onclick='event.cancelBubble=true' onselectstart='if (jpf.dragmode.mode) return false; event.cancelBubble=true' style='display:none;'>\
                    <div id='jpfProfilerOutput' class='debug_panel_body_base debug_panel_body_profiler'></div>\
                    <div id='jpfProfilerSummary' style='float:right;font-size:9px;margin-right:10px;'></div>\
                    <div class='debug_toolbar debug_toolbar_inner'>\
                        <div id='jpfProfilerAction' onclick='jpf.debugwin.startStop(this);' class='debug_btn' title='Start'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='start'> </span>\
                        </div>\
                        <input id='cbProfileGlobal' type='checkbox' onclick='\
                          jpf.debugwin.toggleProfileGlobal(this.checked);\
                          event.cancelBubble = true;'" + (this.profileGlobal ? " checked='checked'" : "") + "/>\
                        <label for='cbProfileGlobal' onclick='event.cancelBubble=true'>\
                            Profile window object\
                        </label>\
                        <input id='cbProfileStartup' type='checkbox' onclick='\
                          jpf.debugwin.toggleProfileStartup(this.checked);\
                          event.cancelBubble = true;'" + (jpf.isTrue(jpf.getcookie("profilestartup")) ? " checked='checked'" : "") + "/>\
                        <label for='cbProfileStartup' onclick='event.cancelBubble=true'>\
                            Profile startup\
                        </label>\
                    </div>\
                </div>\
            </div>"
         : "") +
           "<div class='debug_panel' onclick='jpf.debugwin.toggleFold(this, true);'>\
                <div class='debug_panel_head'>\
                    <div class='debug_panel_headsub'>\
                        <label for='cbTW' style='\
                              top:4px;\
                              position:relative;'\
                          onclick='\
                              jpf.debugwin.showLogWindow();\
                              event.cancelBubble = true;'\
                        >Show window</label>\
                    </div>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_down.gif' />&nbsp;\
                    <strong>Log Viewer</strong>\
                </div>\
                <div id='" + this.logView + "' onclick='event.cancelBubble=true'\
                  onselectstart='if (jpf.dragmode.mode) return false; event.cancelBubble=true'\
                  class='debug_panel_body_base debug_panel_body_log'>" + jpf.console.debugInfo.join('') + "</div>\
            </div>\
            <div class='debug_panel' onclick='jpf.debugwin.toggleFold(this, false, true);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_down.gif' />&nbsp;\
                    <strong>Javascript console</strong>\
                </div>\
                <div onclick='event.cancelBubble=true'>\
                    <textarea id='" + this.debugConsole + "' onkeydown='return jpf.debugwin.consoleTextHandler(event);'\
                      onselectstart='if (jpf.dragmode.mode) return false; event.cancelBubble=true'\
                      onmousedown='if(jpf.window) jpf.window.$focusRoot();'\
                      class='debug_panel_body_base debug_panel_body_console'>" + jpf.getcookie('jsexec') + "</textarea>\
                    <div class='debug_toolbar debug_toolbar_inner'>\
                        <div id='jpfDebugExec' onclick='jpf.debugwin.jRunCode(jpf.debugwin.debugConsole.value)' title='Run Code'\
                          class='debug_btn' onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='exec'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.run(\"reboot\")' class='debug_btn' title='Reboot Application'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='reboot'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.run(\"undo\")' class='debug_btn' title='Undo'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='undo'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.run(\"redo\")' class='debug_btn' title='Redo'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='redo'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.run(\"reset\")' class='debug_btn' title='Clear offline cache'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='reset'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.run(\"online\")' class='debug_btn' title='Go Online'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='online'> </span>\
                        </div>\
                        <div onclick='jpf.debugwin.run(\"offline\")' class='debug_btn' title='Go Offline'\
                          onmousedown='jpf.debugwin.btnMouseDown(this)' onmouseup='jpf.debugwin.btnMouseUp(this)'>\
                            <span class='offline'> </span>\
                        </div>\
                    </div>\
                </div>\
            </div>\
            <div id='lastElement' class='debug_footer debug_toolbar'>\
                <input id='toggledebug' type='checkbox' onclick='jpf.debugwin.toggleDebugger(this.checked)'" + (jpf.isTrue(jpf.getcookie("debugger")) ? " checked='checked'" : "") + " />\
                <label for='toggledebug' class='debug_check_use'>Use browser's debugger</label>\
                <a href='http://www.javeline.com' target='_blank'><img src='" + this.resPath + "javeline_logo_small.png' /></a>\
            </div>";

        this.errorTable   = document.getElementById(this.errorTable);
        this.contextDiv   = document.getElementById(this.contextDiv);
        this.stackTrace   = document.getElementById(this.stackTrace);
        this.logView      = document.getElementById(this.logView);
        this.debugConsole = document.getElementById(this.debugConsole);

        if (!this.oExt && jpf.Interactive) {
            this.oExt     = elError;
            this.pHtmlDoc = document;

            this.$propHandlers = [];
            jpf.inherit.call(this, jpf.Interactive);

            this.minwidth  = 400;
            this.minheight = 442;
            this.maxwidth  = 10000;
            this.maxheight = 10000;

            this.resizable     = "horizontal";
            this.resizeOutline = true;
            this.$propHandlers["resizable"].call(this, "horizontal");

            if (jpf.isIE) {
                this.debugConsole.parentNode.style.width = "auto";
                this.debugConsole.parentNode.style.paddingTop = "108px";
                this.debugConsole.style.position = "absolute";
                this.debugConsole.style.marginTop = "-108px";
            }
            
            if (jpf.layout) {
                jpf.layout.setRules(elError, "resize",
                    "var oHtml = document.getElementById('" + elError.id + "');\
                    var o = document.getElementById('jvlnviewlog');\
                    var l = document.getElementById('lastElement');\
                    var scrollHeight = l.offsetTop + l.offsetHeight;\
                    var shouldSize = scrollHeight - o.offsetHeight + 200 < oHtml.offsetHeight;\
                    o.style.height = (shouldSize\
                        ? oHtml.offsetHeight - scrollHeight + o.offsetHeight - 8\
                        : 190) + 'px';\
                    oHtml.style.overflowY = shouldSize ? 'hidden' : 'auto';\
                    oHtml.style.right = '0px';\
                    oHtml.style.left = '';\
                    document.body.style.marginRight = \
                        oHtml.offsetWidth + 'px';\
                    var o = document.getElementById('jpfDebugExpr');\
                    if (o.parentNode.offsetWidth)\
                        o.style.width = (o.parentNode.offsetWidth \
                            - (jpf.isGecko ? 4 : 8)) + 'px';\
                    ");
                jpf.layout.activateRules(elError);
            }
        }
        else
            this.oExt = elError;

        if (jpf.hasFocusBug)
            jpf.sanitizeTextbox(this.debugConsole);

        clearInterval(jpf.Init.interval);
        ERROR_HAS_OCCURRED = true;

        this.initProfiler(this);
        
        jpf.getWindowWidth = function(){
            return document.body.offsetWidth;
        }
        jpf.getWindowHeight = function(){
            return document.body.offsetHeight;
        }
    },

    run : function(action){
        switch(action){
            case "undo":
                jpf.window.getActionTracker().undo();
                break;
            case "redo":
                jpf.window.getActionTracker().redo();
                break;
            case "reset":
                jpf.offline.clear();
                break;
            case "reboot":
                jpf.reboot();
                break;
            case "online":
                if (jpf.offline.detector.detection != "manual") {
                    jpf.console.info("Switching to manually network detection.");
                    jpf.offline.detector.detection = "manual";
                    jpf.offline.detector.stop();
                }

                jpf.offline.goOnline();
                break;
            case "offline":
                if (jpf.offline.detector.detection != "manual") {
                    jpf.console.info("Switching to manually network detection.");
                    jpf.offline.detector.detection = "manual";
                    jpf.offline.detector.stop();
                }

                jpf.offline.goOffline()
                break;
        }
    },

    jRunCode : function(code){
        jpf.setcookie("jsexec", code);

        jpf.console.write("<span style='color:blue'><span style='float:left'>&gt;&gt;&gt;</span><div style='margin:0 0 0 30px'>"
            + code.replace(/ /g, "&nbsp;").replace(/\t/g, "&nbsp;&nbsp;&nbsp;").replace(/</g, "&lt;").replace(/\n/g, "<br />") + "</div></span>", "info", null, null, null, true);

        var doIt = function(){
            var x = eval(code);

            if (x === null)
                x = "null";
            else if (x === undefined)
                x = "undefined";

            try {
                jpf.console.write((x.nodeType && !x.nodeFunc ? x.outerHTML || x.xml || x.serialize() : x.toString())
                    .replace(/</g, "&lt;")
                    .replace(/\n/g, "<br />"), "info", null, null, null, true);
            }catch(e){
                jpf.console.write(x
                    ? "Could not serialize object"
                    : x, "error", null, null, null, true);
            }
        }

        if (jpf.debugwin.useDebugger)
            doIt();
        else {
            try{
                doIt();
            }
            catch(e) {
                jpf.console.write(e.message, "error", null, null, null, true);
            }
        }
    },

    consoleTextHandler: function(e) {
        if (!e) e = window.event;
        var oArea = e.target || e.srcElement;
        if (e.keyCode == 9) {
            document.getElementById("jpfDebugExec").focus();
            e.cancelBubble = true;
            return false;
        }
        else if(e.keyCode == 13 && e.ctrlKey) {
            jpf.debugwin.jRunCode(oArea.value);
            return false;
        }
    },

    btnMouseDown: function(oBtn) {
        oBtn.className = oBtn.className.replace("debug_btn_down", "")
            + " debug_btn_down";
    },

    btnMouseUp: function(oBtn) {
        oBtn.className = "debug_btn"
            + ((oBtn.className.indexOf('right') > -1) ? " debug_btnright" : "");
    },

    consoleBtnHandler: function(e) {
        if (!e) e = window.event;
        if (e.shiftKey && e.keyCode == 9) {
            e.cancelBubble = true;
            return false;
        }
    },

    consoleExecHandler: function(e) {
        if (!e) e = window.event;
        if (e.shiftKey && e.keyCode == 9) {
            document.getElementById("jpfDebugExpr").focus();
            e.cancelBubble = true;
            return false;
        }
    },

    showLogWindow : function (checked){
        jpf.console.showWindow();
    },

    toggleHighlighting : function (checked){
        jpf.setcookie("highlight", checked);
    },

    toggleDebugger : function(checked){
        this.useDebugger = checked;

        if (jpf.setcookie)
            jpf.setcookie("debugger", checked)

        if (!checked) {
            window.onerror = this.errorHandler;
        }
        else
            window.onerror = null;
    },

    errorHandler : function(message, filename, linenr, isForced){
        if (!message) message = "";
        var e = message 
            ? {
                message : message.indexOf("jml file") > -1
                    ? message
                    : "js file: [line: " + linenr + "] "
                        + jpf.removePathContext(jpf.hostPath, filename) + "\n" + message
            }
            : null;

        if (!isForced) {
            jpf.console.error("[line " + linenr + "] " + message
                .split(/\n\n===\n/)[0].replace(/</g, "&lt;")
                .replace(/\n/g, "<br />"));
        }

        jpf.debugwin.show(e, filename, linenr);

        return true;
    },

    activate : function(msg){
        //jpf.debugwin.toggleDebugger(false);

        if (document.getElementById("jpf_debugwin")) {
            document.getElementById("jpf_debugwin").style.display = "block";
            
            if (jpf.layout)
                jpf.layout.forceResize(this.oExt);
        }
        else {
            jpf.debugwin.errorHandler(msg, null, null, true);
        }
    }
}

jpf.showDebugWindow = function(){
    jpf.debugwin.activate();
}

// #endif
