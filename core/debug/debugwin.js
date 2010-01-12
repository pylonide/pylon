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

apf.DebugInfoStack = [];

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
    TYPE_APFNODE    = "APF Element";

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
                return TYPE_APFNODE;
            if (variable.tagName || variable.nodeValue)
                return TYPE_DOMNODE;
        }

        if (typeof variable.dataType == "undefined")
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
                argName  = (namedArgs[i] || "NOT_NAMED").trim();// args += "<b>" + arr[i] + "</b>";

                var info = ["Name: " + argName];
                var id   = apf.DebugInfoStack.push(info) - 1;

                args.push("<a href='javascript:void(0)' onclick='alert(apf.DebugInfoStack["
                    + id + "].join(\"\\n\"));event.cancelBubble=true;'>" + argName + "</a>");
                info.push("Type: " + getType(this.arguments[i]));
                
                //@todo fix this
                //info.push("Value: " + apf.vardump(this.arguments[i], null, false));
            }
        }
        else if (apf.isGecko) {
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
                var id   = apf.DebugInfoStack.push(info) - 1;

                result.push("<a href='javascript:void(0)' onclick='alert(apf.DebugInfoStack["
                    + id + "].join(\"\\n\"));event.cancelBubble=true;'>" + argName + "</a>");
                info.push("Value: " + apf.vardump(args[i], null, false));
            }
            
            args = result;
        }

        line2 = line2.replace(/\{/ , "");
        line2 = line2.substr(0, line2.length-2);

        if (!highlight) {
            //fine common start whitespace count
            line2 = apf.debugwin.outdent(line2);
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
                  oFirst.src='" + apf.debugwin.resPath + "arrow_right.gif';\
              } else {\
                  oLast.style.display = 'block';\
                  oFirst.src='" + apf.debugwin.resPath + "arrow_down.gif';\
              }\
              if (apf.layout)\
                 apf.layout.forceResize(apf.debugwin.$ext);\
              event.cancelBubble=true\">\
                <nobr>"
                      + (this.url
                        ? "<a href='" + this.url + "' target='_blank' style='float:right'>" 
                                + apf.getFilename(this.url) + 
                            " (" + this.line + ")</a>"
                        : "")
                      + "<img width='9' height='9' src='" + apf.debugwin.resPath
                      + "arrow_right.gif' style='margin:0 3px 0 2px;' />"
                      + (name.trim() || "anonymous") + "(" + args.join(", ") + ")&nbsp;\
                </nobr>\
                <div onclick='event.cancelBubble=true' onselectstart='if (apf.dragMode) return false; event.cancelBubble=true' style='\
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

apf.debugwin = {
    useDebugger  : apf.getcookie("debugger") == "true",
    profileGlobal: apf.getcookie("profileglobal") == "true",
    resPath      : "",
    errorTable   : "debug_panel_errortable",
    contextDiv   : "debug_panel_amlcontext",
    stackTrace   : "debug_panel_stacktrace",//null, //blockquote[0]
    logView      : "jvlnviewlog",
    debugConsole : "apfDebugExpr",
    lmConsole  : "apfLmExpr",
    
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
        if (apf.getcookie("highlight") == "true" && self.BASEPATH) {
            //<script class="javascript" src="../Library/Core/Highlighter/shCore.uncompressed.js"></script>
            //<script class="javascript" src="../Library/Core/Highlighter/shBrushJScript.js"></script>
            apf.include(BASEPATH + "Library/Core/Highlighter/shCore.uncompressed.js");
            apf.include(BASEPATH + "Library/Core/Highlighter/shBrushJScript.js");
            //<link type="text/css" rel="stylesheet" href="../Library/Core/Highlighter/SyntaxHighlighter.css" />
            apf.loadStylesheet(BASEPATH + "Library/Core/Highlighter/SyntaxHighlighter.css");
        }
        else if (self.SyntaxHighlighterCSS) {
            apf.importCssString(SyntaxHighlighterCSS);
        }
        else {
            apf.setcookie("highlight", false)
        }

        if (!this.useDebugger) {
            apf.debugwin.toggleDebugger(false);
            //window.onerror = apf.debugwin.errorHandler;

            if (apf.isGecko)
                var error = Error;

            if (apf.isOpera || apf.isWebkit || apf.isGecko) {
                self.Error = function(msg){
                    apf.debugwin.errorHandler(msg, location.href, 0);
                }
                self.Error.custom = true;
            }

            if (apf.isGecko) {
                apf.addEventListener("load", function(){
                    self.Error = error;
                });
            }
        }

        if (apf.getcookie("profilestartup") == "true" && !apf.profiler.isRunning) {
            if (this.profileGlobal)
                apf.profiler.init(window, 'window');
            else
                apf.profiler.init(apf, 'apf');
            apf.profiler.start();
        }

        apf.addEventListener("hotkey", function(e){
            if (e.keyCode == 120 || e.ctrlKey && e.altKey && e.keyCode == 68) {
                apf.debugwin.activate();
            }
        })
    },

    hide : function(){
        this.$ext.style.display = "none";
        document.body.style.marginRight = "0";
        
        if (apf.isIE8) {
            document.body.style.overflow = "";
            document.body.style.position = "";
        }
    },
    
    show : function(e, filename, linenr){
        var list = [], seen = {}, i;

        if (apf.loadScreen)
            apf.loadScreen.hide();

        if (!apf.isIE && !apf.isWebkit && !Error.custom) {

            var stack = new Error().stack.split("\n");
            for (i = 0; i < stack.length; i++) {
                stack[i].trim().match(/^([\w_\$]*)(\(.*?\))?@(.*?):(\d+)$/);
                var name = RegExp.$1,
                    args = RegExp.$2,
                    url  = RegExp.$3,
                    line = RegExp.$4;
                
                list.push(Function.prototype.toHTMLNode.call({
                    toString : function(){
                        return "function " + name + (args || "()") + "{\n...\n}";
                    },
                    url : url,
                    line: line
                }));
            }
        }
        else {
            //Opera doesnt support caller... weird...
            try {
                var loop = apf.isIE
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
                            list.push(loop.toHTMLNode(apf.getcookie("highlight") == "true"));
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

        if (apf.isIE8) {
            document.body.style.overflow = "auto";
            //document.body.style.position = "static";
        }
        
        if (!apf.debugwin.win)
            this.createWindow();

        if (e) {
            var parsed = this.formatError(e);
            this.errorTable.innerHTML = parsed.table;
            this.errorTable.parentNode.style.display = "block";
            
            if (parsed.amlcontext.trim()) {
                this.contextDiv.parentNode.style.display = "block";
                this.contextDiv.innerHTML = parsed.amlcontext;
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
            for (i = 0; i < list.length; i++) {
                try{
                    this.stackTrace.appendChild(list[i]);
                }catch(e){}
            }
            
            this.stackTrace.parentNode.style.display = "block";
        }
        else {
            this.stackTrace.parentNode.style.display = "none";
        }

        this.$ext.style.display = "block";
        //#ifdef __WITH_LAYOUT
        if(apf.layout)
            apf.layout.forceResize(this.$ext);
        //#endif
        this.logView.scrollTop = this.logView.scrollHeight;

        //!self.ERROR_HAS_OCCURRED && 
        if (apf.addEventListener)
            apf.addEventListener("debug", this.debugHandler);
    },
    
    debugHandler : function(e){
        if (!apf.debugwin.logView) return;

        apf.debugwin.logView.insertAdjacentHTML("beforeend", e.message);
        apf.debugwin.logView.style.display = "block";
        apf.debugwin.logView.scrollTop     = apf.debugwin.logView.scrollHeight;
    },

    formatError: function(e) {
        var parse         = e.message.split(/\n===\n/),
            amlContext    = apf.highlightXml(parse[1] ? apf.debugwin.outdent(parse[1].trim(true), true).replace(/\t/g, "&nbsp;&nbsp;&nbsp;").replace(/ /g, "&nbsp;") : ""),
                //.replace(/</g, "&lt;").replace(/\n/g, "<br />"),
            errorMessage  = parse[0].replace(/---- APF Error ----\n/g, "")
                .replace(/</g, "&lt;").replace(/Message: \[(\d+)\]/g, "Message: [<a title='Visit the manual on error code $1' style='color:blue;text-decoration:none;' target='_blank' href='http://www.ajax.org#docs/errors/$1'>$1</a>]"),
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

        return {table: errorTable.join(''), amlcontext: amlContext || ""};
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

        if (value.match(/^AML/)) {
            if (dbgMarkup.getModel())
                dbgMarkup.getModel().unregister(dbgMarkup);

            if (selected.value)
                dbgMarkup.load(apf.includeStack[selected.value]);
            else
                dbgMarkup.load(apf.document.documentElement);

            return;
        }

        var xpath = document.getElementById("dbgMarkupInput").value;
        var instruction = value + (value.match(/^#/) ? ":select" : "")
        + (xpath ? ":" + xpath : "");

        apf.setModel(instruction, dbgMarkup);
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
        if (!apf.DOMParser)
            return;// alert("Sorry, the depencies for the Data Debugger could not be loaded");

        if (oHtml.getAttribute("inited")) return;
        oHtml.setAttribute("inited", "true");

        /**
         * @todo change the .attribute to be in the debugmarkup namespace
         * @todo fix the edit state
         */
        var skinXml = '\
        <a:skin id="debug" xmlns:a="' + apf.ns.aml + '">\
            <a:markupedit name="debugmarkup">\
                <a:style><![CDATA[\
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
                ]]></a:style>\
                <a:presentation>\
                    <a:main container="blockquote" startclosed="false">\
                        <div class="debugmarkup">\
                            <blockquote> </blockquote>\
                        </div>\
                    </a:main>\
                    <a:item class="dl" begintag="dl/dt" begintail="dl/span" endtag="span" attributes="dl" openclose="i" select="dl" container="blockquote">\
                        <div><dl><dt>-</dt><span> </span></dl><blockquote> </blockquote><span>-</span><i> </i></div>\
                    </a:item>\
                    <a:attribute name="dt" value="dd">\
                        <dl class="attribute"><dt> </dt>="<dd> </dd>"</dl>\
                    </a:attribute>\
                    <a:textnode text="strong" tag="u">\
                        <strong class="textnode"><u> </u><strong>-</strong></strong>\
                    </a:textnode>\
                    <a:loading>\
                        <div class="loading"><span> </span><label>Loading...</label></div>\
                    </a:loading>\
                    <a:empty container=".">\
                        <div class="empty"></div>\
                    </a:empty>\
                </a:presentation>\
            </a:markupedit>\
        </a:skin>';
        apf.skins.Init(apf.xmldb.getXml(skinXml));

        document.documentElement.setAttribute("id", "override");

        var oInt = document.getElementById("apf_markupcontainer");
        apf.test = oHtml;

        //Get all models
        var options, i, list = apf.nameserver.getAllNames("model");
        for (options = [], i = 0; i < list.length; i++)
            options.push("<option>" + list[i] + "</option>");

        //Get all components
        list = apf.all;
        for (i = 0; i < list.length; i++) {
            if (list[i] && list[i].name && list[i].hasFeature
              && list[i].hasFeature(apf.__DATABINDING__))
                options.push("<option>#" + list[i].name + "</option>");
        }

        if (!options.length)
            options.push("<option></option>");

        options.push("<option>AML Main</option>");
        for (i = 0; i < apf.includeStack.length; i++) {
            if (typeof apf.includeStack[i] == "boolean") continue;
            options.push("<option value='" + i + "'>AML "
                + apf.getFilename(apf.includeStack[i].getAttribute("filename"))
                + "</option>");
        }

        options   = options.join('').replace(/option>/, "option selected='1'>");
        var first = options ? options.match(/>([^<]*)</)[1] : "";

        oHtml.getElementsByTagName("label")[0].insertAdjacentHTML("afterend",
            "<select id='dbgMarkupSelect' style='margin-top:2px;float:left;' onchange='apf.debugwin.setSelected(true)' onkeydown='event.cancelBubble=true;'>" + options + "</select>");

        var dbgMarkup = new apf.markupedit({
            id            : "dbgMarkup",
            htmlNode      : oInt,
            skin          : "debugmarkup",
            skinset       : "debug",
            model         : first || null,
            height        : 160,
            minheight     : 110,
            resizable     : "vertical",
            "render-root" : true,
            each          : "node()[local-name(.)]"
        });

        //#ifdef __WITH_LAYOUT
        if (apf.layout && !apf.hasSingleRszEvent) {
            apf.layout.setRules(apf.getFirstElement(oInt), "resize",
                "apf.layout.forceResize(apf.debugwin.$ext);");
            apf.layout.queue(oInt.firstChild);
        }
        //#endif
    },

    PROFILER_ELEMENT   : null,
    PROFILER_BUTTON    : null,
    PROFILER_HEADS     : null,
    PROFILER_SUMMARY   : null,
    PROFILER_PROGRESS  : '<span class="debug_profilermsg debug_progress">The profiler is running. Click \'Stop\' to see its report.</span>',
    PROFILER_NOPROGRESS: '<span class="debug_profilermsg">The profiler is currently inactive. Click \'Start\' to begin profiling your code.<span>',
    initProfiler: function(oHtml) {
        this.PROFILER_ELEMENT = document.getElementById('apfProfilerOutput');
        this.PROFILER_BUTTON  = document.getElementById('apfProfilerAction');
        this.PROFILER_SUMMARY = document.getElementById('apfProfilerSummary');
        this.showProgress();

        if (apf.profiler && apf.profiler.isRunning)
            this.toggleFold(document.getElementById('apfProfilerPanel'));
    },

    startStop: function(input) {
        input.disabled = true;
        if (!apf.profiler.isRunning) {
            if (!apf.profiler.isInitialized()) {
                if (this.profileGlobal)
                    apf.profiler.init(window, 'window');
                else
                    apf.profiler.init(apf, 'apf');
            }
            apf.profiler.start();
            this.showProgress();
        }
        else {
            var data = apf.profiler.stop();
            this.PROFILER_ELEMENT.innerHTML = data.html;
            this.PROFILER_SUMMARY.innerHTML = data.duration + "ms, " + data.total + " calls";
            this.PROFILER_BUTTON.innerHTML  = "Start";
        }
        input.disabled = false;
    },

    showProgress: function() {
        if (!this.PROFILER_ELEMENT) return;
        if (apf.profiler.isRunning) {
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
        var data = apf.profiler.resortStack(parseInt(th.getAttribute('rel')));

        this.PROFILER_ELEMENT.innerHTML = data.html;
        this.PROFILER_SUMMARY.innerHTML = data.duration + "ms, " + data.total + " calls";
    },

    toggleProfileStartup: function(checked) {
        if (apf.setcookie)
            apf.setcookie("profilestartup", checked);
    },

    toggleProfileGlobal: function(checked) {
        this.profileGlobal = checked;
        if (checked)
            apf.profiler.reinit(window, 'window');
        else
            apf.profiler.reinit(apf, 'apf');
        if (apf.setcookie)
            apf.setcookie("profileglobal", checked);
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
            
        if (apf.getStyle(oLast, "display") == "block"){
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
        //#ifdef __WITH_LAYOUT
        if (apf.layout)
            apf.layout.forceResize(this.$ext);
        //#endif
    },
    
    $getOption : function(){
        return 7; // muuh? what's this?
    },

    focusFix   : {"INPUT":1,"TEXTAREA":1,"SELECT":1},
    createWindow : function (e, stackTrace, errorInfo){
        if (!apf.debugwin.win)
            apf.debugwin.win = document.getElementById("apf_debugwin");
        if (apf.debugwin.win) return;

        var elError, p, m, o;

        if (document.body) {
            elError    = document.body.appendChild(document.createElement("div"));
            elError.id = "apf_debugwin";
        }
        else {
            document.write("<div id='apf_debugwin'></div>");
            elError = document.getElementById("apf_debugwin");
        }

        elError.style.position = apf.supportFixedPosition ? "fixed" : "absolute";

        elError.host = this;
        this.name    = "Debug Window";
        this.localName = "debugwin";

        elError.onmousedown  = function(e) {
            if (!e) e = event;

            if (!apf.window)
                return;

            //#ifdef __WITH_WINDOW_FOCUS
            if (apf.hasFocusBug
              && !apf.debugwin.focusFix[(e.srcElement || e.target).tagName]) {
                apf.window.$focusfix();
            }
            //#endif

            (e || event).cancelBubble = true;
        };

        this.dispatchEvent    = function(){}
        elError.onkeydown     =
        elError.onkeyup       = function(e){
            if (!e) e = event;

            if (apf.debugwin.focusFix[(e.srcElement || e.target).tagName])
                (e || event).cancelBubble = true;
        }

        if (apf.isIE) {
            apf.setStyleRule("BODY", "overflow", "", 0);

            p = apf.getBox(apf.getStyle(document.body, "padding"));
            m = apf.getBox(apf.getStyle(document.body, "margin"));
            o = [apf.getStyle(document.documentElement, "overflow"),
                     apf.getStyle(document.documentElement, "overflowX"),
                     apf.getStyle(document.documentElement, "overflowY")];
        }
        else {
            p = [parseInt(apf.getStyle(document.body, "padding-top")),
                 parseInt(apf.getStyle(document.body, "padding-right")),
                 parseInt(apf.getStyle(document.body, "padding-bottom")),
                 parseInt(apf.getStyle(document.body, "padding-left"))];
            m = [parseInt(apf.getStyle(document.body, "margin-top")),
                 parseInt(apf.getStyle(document.body, "margin-right")),
                 parseInt(apf.getStyle(document.body, "margin-bottom")),
                 parseInt(apf.getStyle(document.body, "margin-left"))];
            o = [apf.getStyleRule("html", "overflow") || "auto",
                     apf.getStyleRule("html", "overflow-x") || "auto",
                     apf.getStyleRule("html", "overflow-y") || "auto"];
        }

        // #ifndef __PACKAGED
        this.resPath = (apf.config.resourcePath || apf.basePath) + "core/debug/resources/";
        /* #else
        this.resPath = (apf.config.resourcePath || apf.basePath) + "resources/";
        #endif */
        /* #ifdef __WITH_CDN
        this.resPath = apf.CDN + apf.VERSION + "/resources/";
        #endif */

        apf.importCssString("\
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
            #apf_debugwin {\
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
            #apf_debugwin button, #apf_debugwin select, #apf_debugwin input, #apf_debugwin label{\
                font-size: 10px;\
            }\
            #override #apf_debugwin{\
                letter-spacing: 0;\
                font-family: 'Lucida Grande', Arial;\
            }\
            #apf_debugwin label{\
                padding: 5px 0 0 1px;\
                width: auto;\
            }\
            #apf_debugwin button{\
                padding: 0;\
                margin: 0 0 2px 0;\
            }\
            #apf_debugwin .debug_header{\
                position: relative;\
                background: url(" + this.resPath + "backgrounds.png) repeat-x 0 -145px;\
                border-bottom: 1px solid #505050;\
                height: 66px;\
                -moz-user-select: none;\
                -khtml-user-select: none;\
                user-select: none;\
            }\
            #apf_debugwin .debug_header_cont{\
                background: url(" + this.resPath + "ajax_logo.png) no-repeat right 4px;\
                width: 100%;\
                height: 66px;\
            }\
            #apf_debugwin .debug_closebtn,\
            #apf_debugwin .debug_closebtn_hover{\
                cursor: hand;\
                cursor: pointer;\
                right: 0px;\
                top: 3px;\
                z-index: 1000;\
                margin: 0px;\
                width: 16px;\
                height: 16px;\
                overflow: hidden;\
                padding: 0;\
                position: absolute;\
                background: url(" + this.resPath + "buttons.png) no-repeat -176px -16px;\
            }\
            #apf_debugwin .debug_closebtn_hover{\
                background-position: -176px 0px;\
            }\
            #apf_debugwin .debug_logos{\
                background: url(" + this.resPath + "apf_logo.png) no-repeat 5px 5px;\
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
            #apf_debugwin .debug_logos .debug_apf{\
                display: block;\
            }\
            #apf_debugwin .debug_logos .debug_apf strong{\
                font-weight: 900;\
                font-family: \'Arial Black\';\
                letter-spacing: -1px;\
            }\
            #apf_debugwin .debug_logos .debug_apf_slogan{\
                font-style: italic;\
                font-size: 9px;\
                line-height: 10px;\
                display : block;\
            }\
            #apf_debugwin .debug_panel_head .debug_btn{\
                top:3px;\
                position:relative;\
                background: url(" + this.resPath + "buttons.png) no-repeat -192px 0;\
                width: 16px;\
                height: 16px;\
            }\
            #apf_debugwin .debug_panel_head .debug_btn_down{\
                background-position: -192px -16px;\
            }\
            #apf_debugwin .debug_toolbar{\
                position: relative;\
                height: 22px;\
                background: url(" + this.resPath + "backgrounds.png) repeat-x 0 -57px;\
                padding: 0 0 0 4px;\
                font-size: 10px;\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
                vertical-align: middle;\
                overflow: hidden;\
                -moz-user-select: none;\
                -khtml-user-select: none;\
                user-select: none;\
                cursor : default;\
            }\
            #apf_debugwin .debug_toolbar .input_text{\
                border:1px solid #bfbfbf;\
                padding : 2px;\
            }\
            #apf_debugwin .debug_toolbar_inner{\
                border-top: 1px solid #cacaca;\
                border-bottom: 1px solid #cacaca;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn{\
                position: relative;\
                border-right: 1px solid #b8b8b8;\
                width: 24px;\
                height: 22px;\
                float: left;\
                cursor: pointer;\
                cursor: hand;\
            }\
            #apf_debugwin .debug_toolbar .debug_btnright{\
                float: right !important;\
                border-right: none;\
                border-left: 1px solid #b8b8b8;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span{\
                position: absolute;\
                background: url(" + this.resPath + "buttons.png) no-repeat 0 0;\
                width: 16px;\
                height: 16px;\
                top: 4px;\
                left: 4px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.reboot{\
                background-position: -16px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.undo{\
                background-position: -32px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.redo{\
                background-position: -48px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.online{\
                background-position: -64px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.offline{\
                background-position: -80px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.reset{\
                background-position: -96px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.start{\
                background-position: -112px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.remove{\
                background-position: -128px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.textnode{\
                background-position: -144px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn span.attribute{\
                background-position: -160px 0;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.exec{\
                background-position: 0 -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.reboot{\
                background-position: -16px -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.undo{\
                background-position: -32px -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.redo{\
                background-position: -48px -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.online{\
                background-position: -64px -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.offline{\
                background-position: -80px -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.reset{\
                background-position: -96px -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.start{\
                background-position: -112px -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.remove{\
                background-position: -128px -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.textnode{\
                background-position: -144px -16px;\
            }\
            #apf_debugwin .debug_toolbar .debug_btn_down span.attribute{\
                background-position: -160px -16px;\
            }\
            #apf_debugwin .debug_footer{\
                width: 100%;\
                position: relative;\
                bottom: 0px;\
                border-bottom: 0;\
                border-left: 1px solid #a3a3a3;\
                -moz-user-select: none;\
                -khtml-user-select: none;\
                user-select: none;\
            }\
            #apf_debugwin .debug_footer img{\
                position: absolute;\
                top: 0px;\
                right: 0px;\
                border: 0;\
                margin: 0;\
                padding: 0;\
            }\
            #apf_debugwin .debug_panel{\
                cursor:default;\
                border-left: 1px solid #a3a3a3;\
                padding: 0;\
                margin: 0;\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
            }\
            #apf_debugwin .debug_panel_head{\
                background: url(" + this.resPath + "backgrounds.png) repeat-x 0 0;\
                height: 17px;\
                padding: 2px 0 0 0;\
                -moz-user-select: none;\
                -khtml-user-select: none;\
                user-select: none;\
            }\
            #apf_debugwin .debug_panel_head img{\
                margin: 2px 0 0 6px;\
            }\
            #apf_debugwin .debug_panel_head strong{\
                color: #826e6e;\
            }\
            #apf_debugwin .debug_panel_headsub{\
                margin-right: 5px;\
                float: right;\
                margin-top: -4px;\
            }\
            #apf_debugwin .debug_panel_body_base{\
                cursor: text;\
                background: white url(" + this.resPath + "shadow.gif) no-repeat 0 0;\
                padding: 4px;\
                font-family: Monaco, Courier New;\
                margin: 0;\
            }\
            #apf_debugwin .debug_panel_body_error{\
                padding: 0;\
                margin: 0;\
            }\
            #apf_debugwin .debug_panel_body_error table{\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
                font-size: 10px;\
                width: 100%;\
            }\
            #apf_debugwin .debug_panel_body_error td{\
                padding: 2px;\
                border-bottom: 1px solid #e4e4e4;\
                border-left: 1px solid #e4e4e4;\
                margin: 0;\
            }\
            #apf_debugwin .debug_panel_body_error .debug_error_header{\
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
            #apf_debugwin .debug_panel_body_none{\
                display: none;\
            }\
            #apf_debugwin .debug_panel_body_markup{\
                padding: 0;\
                white-space: nowrap;\
            }\
            #apf_debugwin .debug_panel_body_aml{\
                padding: 0;\
                white-space: nowrap;\
                padding : 10px;\
                font-family : 'Lucida Grande', Verdana;\
                font-size : 8.5pt;\
                white-space : normal;\
                overflow : auto;\
                max-height : 200px;\
            }\
            #apf_debugwin .debug_panel_body_data{\
                min-height: 130px;\
                white-space: nowrap;\
                overflow: auto;\
                display: none;\
                padding : 0;\
            }\
            #apf_debugwin .debug_panel_body_profiler{\
                padding: 0px;\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
                font-size: 9px;\
                height: 180px;\
                overflow: auto;\
                display: block;\
            }\
            #apf_debugwin .debug_panel_body_log{\
                height: 250px;\
                overflow: auto;\
                font-size: 8pt;\
                font-family: 'Lucida Grande', Verdana;\
            }\
            #apf_debugwin .debug_panel_body_console{\
                width: 391px;\
                height: 100px;\
                border: 0;\
                overflow: auto;\
                font-size: 12px;\
            }\
            #apf_debugwin .debug_panel_body_lm{\
                padding : 0;\
                font-size: 8pt;\
                font-family: 'Lucida Grande', Verdana;\
            }\
            #apf_debugwin .debug_panel_body_lm blockquote{\
                height : 194px;\
                border : 0;\
                border-right : 1px solid #bfbfbf;\
                background : transparent;\
                margin : 0;\
                padding : 3px;\
                overflow : auto;\
            }\
            #apf_debugwin .debug_panel_body_lm .apf_empty {\
                color : #AAA;\
                text-align : center;\
                padding : 5px;\
                display : block;\
            }\
            #apf_debugwin .debug_panel_body_lm textarea{\
                width : 50%;\
                float : right;\
                height : 194px;\
                background : url(" + this.resPath + "spacer.gif);\
                overflow : auto;\
                border : 0;\
                margin : 0;\
                border-left : 1px solid #bfbfbf;\
                margin-left : 3px;\
                font-size: 12px;\
                position : relative;\
                padding : 3px;\
            }\
            #apf_debugwin .debug_profilermsg{\
                margin: 4px;\
                font-weight: 500;\
                height: 20px;\
                line-height: 20px;\
                vertical-align: middle;\
                overflow: visible;\
                padding: 4px;\
            }\
            #apf_debugwin .debug_progress{\
                background-image: url(" + this.resPath + "progress.gif);\
                background-repeat: no-repeat;\
                background-position: center left;\
                padding-left: 22px;\
            }\
            #apf_debugwin .debug_console_btn{\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
                font-size: 8pt;\
                margin: 0 0 0 3px;\
            }\
            #apf_debugwin .debug_check_use{\
                position: relative;\
                top: 4px;\
                font-family: 'Lucida Grande', 'MS Sans Serif', Arial;\
                font-size: 8pt;\
            }");

        document.body.style.display = "block";

        var canViewMarkup = apf.nameserver && apf.markupedit ? true : false,
            useProfiler   = false;

        elError.innerHTML = "\
            <div class='debug_header'>\
                <div class='debug_header_cont'>\
                    <div onselectstart='if (apf.dragMode) return false; event.cancelBubble=true' class='debug_logos'>\
                        &nbsp;\
                    </div>\
                    <div class='debug_closebtn' onmouseover='this.className=\"debug_closebtn_hover\"' \
                      onmouseout='this.className=\"debug_closebtn\"' onclick='apf.debugwin.hide()' title='Close'>&nbsp;</div>\
                </div>\
            </div>\
            <div class='debug_panel' onclick='apf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_down.gif' />&nbsp;\
                    <strong>Error</strong>\
                </div>\
                <div id='" + this.errorTable + "' onclick='event.cancelBubble=true' \
                  onselectstart='if (apf.dragMode) return false; event.cancelBubble=true'\
                  class='debug_panel_body_base debug_panel_body_error'>@todo</div>\
            </div>\
            <div class='debug_panel' onclick='apf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_down.gif' />&nbsp;\
                    <strong>AML related to the error</strong>\
                </div>\
                <div id='" + this.contextDiv + "' onclick='event.cancelBubble=true' \
                  onselectstart='if (apf.dragMode) return false; event.cancelBubble=true' \
                  class='debug_panel_body_base debug_panel_body_aml'>@todo</div>\
            </div>\
            <div class='debug_panel' onclick='apf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "/arrow_gray_right.gif' />&nbsp;\
                    <strong>Stack Trace</strong>\
                </div>\
                <div id='" + this.stackTrace + "' class='debug_panel_body_base debug_panel_body_none'></div>\
            </div>" +
        (apf.lm
         ? "<div class='debug_panel' onclick='apf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_right.gif' />&nbsp;\
                    <strong>LM Debugger (beta)</strong>\
                </div>\
                <div onclick='event.cancelBubble=true' \
                  class='debug_panel_body_base debug_panel_body_lm debug_panel_body_none'>\
                    <textarea id='" + this.lmConsole + "' onkeyup='if(document.getElementById(\"dbgLmCheck\").checked || event.keyCode==13) apf.debugwin.run(\"lm\");'\
                      onselectstart='if (apf.dragMode) return false; event.cancelBubble=true'\
>/* LM example */\n\
<h4>{node()/node()|text()}</h4>\n\
\n\
<p>This document contains [%#'//node()'] nodes.</p>\n\
\n\
<p>The first node is called <b>[%n.tagName]</b>, and has [%#'node()'] child[%#'node()' == 1 ? '' : 'ren'].</p></textarea>\
                    <blockquote id='apf_lm_output'><span class='apf_empty'>No LM Parsed</span></blockquote>\
                    <div class='debug_toolbar debug_toolbar_inner'>\
                        <label style='float:left;padding:4px 3px 0 0;'>Data instruction: </label>\
                        <input id='dbgLmInput' onkeydown='if(event.keyCode==13) apf.debugwin.run(\"lm\");event.cancelBubble=true;' \
                            style='margin-top:2px;width:150px;float:left;' class='input_text'\
                            onselectstart='if (apf.dragMode) return false; event.cancelBubble=true' />\
                        <label for='dbgLmCheck' style='float:right;padding:3px 5px 0 1px'>Don't update in real-time.</label>\
                        <input id='dbgLmCheck' style='float:right' checked='checked' type='checkbox' />\
                    </div>\
                </div>\
            </div>"
         : "") +
        (canViewMarkup
         ? "<div class='debug_panel' onclick='apf.debugwin.initMarkup(this);apf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_right.gif' />&nbsp;\
                    <strong>Data Editor (beta)</strong>\
                </div>\
                <div onclick='event.cancelBubble=true' onselectstart='if (apf.dragMode) return false; event.cancelBubble=true'\
                  class='debug_panel_body_base debug_panel_body_markup debug_panel_body_none'>\
                    <div id='apf_markupcontainer'> </div>\
                    <div class='debug_toolbar debug_toolbar_inner'>\
                        <label style='float:left'>Model:</label>\
                        <label style='float:left'>XPath:</label>\
                        <input id='dbgMarkupInput' onkeydown='if(event.keyCode==13) apf.debugwin.setSelected(true);event.cancelBubble=true;' \
                            style='margin-top:2px;width:90px;float:left' class='input_text'\
                            onselectstart='if (apf.dragMode) return false; event.cancelBubble=true' />\
                        <div onclick='apf.debugwin.exec(\"remove\")' class='debug_btn debug_btnright' title='Remove'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='remove'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.exec(\"textnode\")' class='debug_btn debug_btnright' title='Textnode'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='textnode'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.exec(\"attribute\")' class='debug_btn debug_btnright' title='Attribute'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='attribute'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.exec(\"redo\")' class='debug_btn debug_btnright' title='Redo'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='redo'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.exec(\"undo\")' class='debug_btn debug_btnright' title='Undo'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='undo'> </span>\
                        </div>\
                    </div>\
                </div>\
            </div>"
         : "") +
        (useProfiler
         ? "<div class='debug_panel' id='apfProfilerPanel' onclick='apf.debugwin.toggleFold(this);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_right.gif' />&nbsp;\
                    <strong>Javascript Profiler (beta)</strong>\
                </div>\
                <div onclick='event.cancelBubble=true' onselectstart='if (apf.dragMode) return false; event.cancelBubble=true' style='display:none;'>\
                    <div id='apfProfilerOutput' class='debug_panel_body_base debug_panel_body_profiler'></div>\
                    <div id='apfProfilerSummary' style='float:right;font-size:9px;margin-right:10px;'></div>\
                    <div class='debug_toolbar debug_toolbar_inner'>\
                        <div id='apfProfilerAction' onclick='apf.debugwin.startStop(this);' class='debug_btn' title='Start'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='start'> </span>\
                        </div>\
                        <input id='cbProfileGlobal' type='checkbox' onclick='\
                          apf.debugwin.toggleProfileGlobal(this.checked);\
                          event.cancelBubble = true;'" + (this.profileGlobal ? " checked='checked'" : "") + "/>\
                        <label for='cbProfileGlobal' onclick='event.cancelBubble=true'>\
                            Profile window object\
                        </label>\
                        <input id='cbProfileStartup' type='checkbox' onclick='\
                          apf.debugwin.toggleProfileStartup(this.checked);\
                          event.cancelBubble = true;'" + (apf.isTrue(apf.getcookie("profilestartup")) ? " checked='checked'" : "") + "/>\
                        <label for='cbProfileStartup' onclick='event.cancelBubble=true'>\
                            Profile startup\
                        </label>\
                    </div>\
                </div>\
            </div>"
         : "") +
           "<div class='debug_panel' onclick='apf.debugwin.toggleFold(this, true);'>\
                <div class='debug_panel_head'>\
                    <div class='debug_panel_headsub'>\
                        <div class='debug_btn' title='Open window'\
                          onmouseover='apf.debugwin.btnMouseDown(this)' onmouseout='apf.debugwin.btnMouseUp(this)'\
                          onclick='\
                              apf.debugwin.showLogWindow();\
                              event.cancelBubble = true;'\
                        >&nbsp;</div>\
                    </div>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_down.gif' />&nbsp;\
                    <strong>Log Viewer</strong>\
                </div>\
                <div id='" + this.logView + "' onclick='event.cancelBubble=true'\
                  onselectstart='if (apf.dragMode) return false; event.cancelBubble=true'\
                  class='debug_panel_body_base debug_panel_body_log'>" 
                    + apf.console.debugInfo.join('').replace(/\{imgpath\}/g, this.resPath) +
               "</div>\
            </div>\
            <div class='debug_panel' onclick='apf.debugwin.toggleFold(this, false, true);'>\
                <div class='debug_panel_head'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_gray_down.gif' />&nbsp;\
                    <strong>Javascript console</strong>\
                </div>\
                <div onclick='event.cancelBubble=true'>\
                    <textarea id='" + this.debugConsole + "' onkeydown='return apf.debugwin.consoleTextHandler(event);'\
                      onselectstart='if (apf.dragMode) return false; event.cancelBubble=true'\
                      class='debug_panel_body_base debug_panel_body_console'>" + apf.getcookie('jsexec') + "</textarea>\
                    <div class='debug_toolbar debug_toolbar_inner'>\
                        <div id='apfDebugExec' onclick='apf.debugwin.jRunCode(apf.debugwin.debugConsole.value)' title='Run Code'\
                          class='debug_btn' onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='exec'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.run(\"reboot\")' class='debug_btn' title='Reboot Application'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='reboot'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.run(\"undo\")' class='debug_btn' title='Undo'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='undo'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.run(\"redo\")' class='debug_btn' title='Redo'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='redo'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.run(\"reset\")' class='debug_btn' title='Clear offline cache'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='reset'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.run(\"online\")' class='debug_btn' title='Go Online'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='online'> </span>\
                        </div>\
                        <div onclick='apf.debugwin.run(\"offline\")' class='debug_btn' title='Go Offline'\
                          onmousedown='apf.debugwin.btnMouseDown(this)' onmouseup='apf.debugwin.btnMouseUp(this)'>\
                            <span class='offline'> </span>\
                        </div>\
                    </div>\
                </div>\
            </div>\
            <div id='lastElement' class='debug_footer debug_toolbar'>\
                <input id='toggledebug' type='checkbox' onclick='apf.debugwin.toggleDebugger(this.checked)'" + (apf.isTrue(apf.getcookie("debugger")) ? " checked='checked'" : "") + " />\
                <label for='toggledebug' class='debug_check_use'>Use browser's debugger</label>\
            </div>";

        this.errorTable   = document.getElementById(this.errorTable);
        this.contextDiv   = document.getElementById(this.contextDiv);
        this.stackTrace   = document.getElementById(this.stackTrace);
        this.logView      = document.getElementById(this.logView);
        this.debugConsole = document.getElementById(this.debugConsole);
        this.lmConsole  = document.getElementById(this.lmConsole);

        if (!this.$ext && apf.Interactive) {
            this.$ext     = elError;
            this.$pHtmlDoc = document;

            if (false) { //@todo temp disabled because of issues
                this.$propHandlers = [];
                apf.implement.call(this, apf.Interactive);
    
                this.minwidth  = 400;
                this.minheight = 442;
                this.maxwidth  = 10000;
                this.maxheight = 10000;
    
                this.resizable     = "horizontal";
                this.resizeOutline = true;
                this.$propHandlers["resizable"].call(this, "horizontal");
    
                if (apf.isIE) {
                    this.debugConsole.parentNode.style.width = "auto";
                    this.debugConsole.parentNode.style.paddingTop = "108px";
                    this.debugConsole.style.position = "absolute";
                    this.debugConsole.style.marginTop = "-108px";
                }
            }

            //#ifdef __WITH_LAYOUT
            if (apf.layout) {
                apf.layout.setRules(elError, "resize",
                    "var oHtml = document.getElementById('" + elError.id + "');\
                    var o = document.getElementById('jvlnviewlog');\
                    var l = document.getElementById('lastElement');\
                    if (!o || !l) return;\
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
                    if (apf.isIE8) {\
                        document.body.style.height = \
                            (document.documentElement.offsetHeight \
                            - apf.getHeightDiff(document.body) - 4) + 'px';\
                    }\
                    var o = document.getElementById('apfDebugExpr');\
                    if (o.parentNode.offsetWidth)\
                        o.style.width = (o.parentNode.offsetWidth \
                            - (apf.isGecko ? 4 : 8)) + 'px';\
                ");
                apf.layout.queue(elError);
            }
            //#endif
        }
        else
            this.$ext = elError;

        if (apf.hasFocusBug) {
            apf.sanitizeTextbox(this.debugConsole);
            if (this.lmConsole)
                apf.sanitizeTextbox(this.lmConsole);
        }

        clearInterval(apf.Init.interval);
        ERROR_HAS_OCCURRED = true;

        this.initProfiler(this);
        
        apf.getWindowWidth = function(){
            return document.body.offsetWidth;
        }
        apf.getWindowHeight = function(){
            return document.body.offsetHeight;
        }
    },

    run : function(action){
        switch(action){
            case "undo":
                apf.window.getActionTracker().undo();
                break;
            case "redo":
                apf.window.getActionTracker().redo();
                break;
            //#ifdef __WITH_OFFLINE
            case "reset":
                apf.offline.clear();
                break;
            // #endif
            case "reboot":
                apf.reboot();
                break;
            //#ifdef __WITH_OFFLINE
            case "online":
                if (apf.offline.detector.detection != "manual") {
                    apf.console.info("Switching to manually network detection.");
                    apf.offline.detector.detection = "manual";
                    apf.offline.detector.stop();
                }

                apf.offline.goOnline();
                break;
            case "offline":
                if (apf.offline.detector.detection != "manual") {
                    apf.console.info("Switching to manually network detection.");
                    apf.offline.detector.detection = "manual";
                    apf.offline.detector.stop();
                }

                apf.offline.goOffline()
                break;
            // #endif
            case "lm":
                if (!apf.debugwin.$lm) {
                    apf.debugwin.$lm = new apf.LmImplementation();
                    apf.debugwin.$lm.modelcache = {};
                }
                
                var ds = document.getElementById("dbgLmInput").value;
                if (!ds)
                    return alert("Missing data instruction");
                
                var xml = apf.debugwin.$lm.modelcache[ds];
                var lmCode, result = document.getElementById("apf_lm_output");
                if (!xml) {
                    apf.debugwin.$lm.modelcache[ds] = -1;
                    
                    apf.getData(ds, {callback: function(data, state, extra){
                        if (state != apf.SUCCESS) {
                            delete apf.debugwin.$lm.modelcache[ds];
                            result.innerHTML = "<span class='apf_empty'>Retrieving data by the data instruction given '" + ds + "' has failed.\n" + extra.message + "</span>";
                            return true;
                        }
                        
                        try {
                            apf.debugwin.$lm.modelcache[ds] = data.nodeType 
                                ? data 
                                : data && apf.getXml(data.replace(/\<\!DOCTYPE[^>]*>/, "")) || -10;
                        }
                        catch(e) {
                            apf.debugwin.$lm.modelcache[ds] = -10;
                        }
                        
                        apf.debugwin.run("lm");
                    }}); //Can this error?
                    
                    return;
                }
                else if (!xml.nodeType && xml == -1)
                    return;

                try{
                    if (!xml.nodeType && xml == -10)
                        lmCode = "<span class='apf_empty'>Data source did not return any data</span>";
                    else 
                        lmCode = (apf.debugwin.$lm.compile(this.lmConsole.value))(xml) 
                }
            	catch(e){
            		result.innerHTML = "Live Markup Compilation error:\n" + e.message;
            		return;
            	}
                
                result.innerHTML = lmCode;

                break;
        }
    },

    jRunCode : function(code){
        apf.setcookie("jsexec", code);

        apf.console.write("<span style='color:blue'><span style='float:left'>&gt;&gt;&gt;</span><div style='margin:0 0 0 30px'>"
            + code.replace(/ /g, "&nbsp;").replace(/\t/g, "&nbsp;&nbsp;&nbsp;").replace(/</g, "&lt;").replace(/\n/g, "\n<br />") + "</div></span>", "info", null, null, null, true);

        var doIt = function(){
            var x = eval(code);

            if (x === null)
                x = "null";
            else if (x === undefined)
                x = "undefined";

            try {
                var str;
                if (x.nodeType) {
                    if (x.serialize)
                        str = x.serialize();
                    else if (x.style)
                        str = x.outerHTML
                    else
                        str = apf.getCleanCopy(x).xml;
                }
                else str = x.toString();
                
                apf.console.write(str
                    .replace(/</g, "&lt;")
                    .replace(/\n/g, "\n<br />"), "info", null, null, null, true);
            }catch(e){
                apf.console.write(x
                    ? "Could not serialize object"
                    : x, "error", null, null, null, true);
            }
        }

        if (apf.debugwin.useDebugger)
            doIt();
        else {
            try{
                doIt();
            }
            catch(e) {
                apf.console.write(e.message, "error", null, null, null, true);
            }
        }
    },

    consoleTextHandler: function(e) {
        if (!e) e = window.event;
        var oArea = e.target || e.srcElement;
        if (e.keyCode == 9) {
            document.getElementById("apfDebugExec").focus();
            e.cancelBubble = true;
            return false;
        }
        else if(e.keyCode == 13 && e.ctrlKey) {
            apf.debugwin.jRunCode(oArea.value);
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
            document.getElementById("apfDebugExpr").focus();
            e.cancelBubble = true;
            return false;
        }
    },

    showLogWindow : function (checked){
        apf.console.showWindow();
    },

    toggleHighlighting : function (checked){
        apf.setcookie("highlight", checked);
    },

    toggleDebugger : function(checked){
        this.useDebugger = checked;

        if (apf.setcookie)
            apf.setcookie("debugger", checked)

        if (!checked) {
            if (!apf.loaded && typeof oldWinError == "object")
                oldWinError = this.errorHandler;
            else
                window.onerror = this.errorHandler;
        }
        else
            window.onerror = null;
    },

    errorHandler : function(message, filename, linenr, isForced){
        if (!message) message = "";

        var e = message 
            ? {
                message : message.indexOf("aml file") > -1
                    ? message
                    : "js file: [line: " + linenr + "] "
                        + apf.removePathContext(apf.hostPath, filename) + "\n" + message
            }
            : null;

        if (!isForced) {
            apf.console.error("[line " + linenr + "] " + message
                .split(/\n\n===\n/)[0].replace(/</g, "&lt;")
                .replace(/\n/g, "\n<br />"));
        }

        apf.debugwin.show(e, filename, linenr);

        return true;
    },

    activate : function(msg){
        //apf.debugwin.toggleDebugger(false);

        if (document.getElementById("apf_debugwin")) {
            if (apf.isIE8) {
                document.body.style.overflow = "auto";
                //document.body.style.position = "static";
            }
            
            document.getElementById("apf_debugwin").style.display = "block";

            //#ifdef __WITH_LAYOUT
            if (apf.layout)
                apf.layout.forceResize(this.$ext);
            //#endif
        }
        else {
            apf.debugwin.errorHandler(msg, null, null, true);
        }
    }
}

/**
 * Displays the debug window. Same as pressing F9 or Ctrl-Shift-D.
 */
apf.showDebugWindow = function(){
    apf.debugwin.activate();
}

// #endif
