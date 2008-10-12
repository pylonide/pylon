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
    code     = this.toString();
    endLine1 = code.indexOf("\n");
    line1    = code.slice(0, endLine1);
    line2    = code.slice(endLine1+1);
    
    res      = /^function(\s+(.*?)\s*|\s*?)\((.*)\)(.*)$/.exec(line1);
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

        line2 = line2.replace(/\{/ , "");
        line2 = line2.substr(0, line2.length-2);

        if (!highlight) {
            line2 = line2.replace(/ /g, "&nbsp;");
            line2 = line2.replace(/\t/g, "&nbsp;&nbsp;&nbsp;");
            line2 = line2.replace(/\n/g, "</nobr><br><nobr>&nbsp;&nbsp;&nbsp;");
            line2 = "{<br><nobr>&nbsp;&nbsp;&nbsp;" + line2 + "</nobr><br>}";
        }
        else {
            line2 = "{\n" + line2 + "\n}\n";
            var div = dp.SyntaxHighlighter.HighlightString(line2, false, false);
        }
        
        var d = document.createElement("div");
        res   = "<div>\
            <div style='padding:0px 0px 2px 0px;cursor:default;' onclick='\
              var oFirst = this.firstChild;\
              while (oFirst.nodeType != 1) oFirst = oFirst.nextSibling;\
              oFirst = oFirst.firstChild;\
              while (oFirst.nodeType != 1) oFirst = oFirst.nextSibling;\
              var oLast = this.lastChild;\
              while (oLast.nodeType != 1) oLast = oLast.previousSibling;\
              if (oLast.style.display == \"block\") {\
                  oLast.style.display = \"none\";\
                  oFirst.src=\"" + this.resPath + "arrow_right.gif\";\
              } else {\
                  oLast.display = \"block\";\
                  oFirst.src=\"" + this.resPath + "arrow_down.gif\";\
              }\
              event.cancelBubble=true'>\
                <nobr>\
                    <img width='9' height='9' src='" + this.resPath
                      + "arrow_right.gif' style='margin:0 3px 0 2px;' />"
                      + (name.trim() || "function") + "(" + args.join(", ") + ")&nbsp;\
                </nobr>\
                <div onclick='event.cancelBubble=true' onselectstart='event.cancelBubble=true' style='\
                  cursor: text;\
                  display: none;\
                  padding: 0px;\
                  background-color: #EAEAEA;\
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
    resPath      : null,
    
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
        
        this.resPath = jpf.basePath + "core/debug/resources/";

        if (!this.useDebugger) {
            window.onerror = jpf.debugwin.errorHandler;

            if (jpf.isGecko)
                var error = Error;
            
            if (jpf.isOpera || jpf.isSafari || jpf.isGecko) {
                self.Error = function(msg){
                    jpf.debugwin.errorHandler(msg, location.href, 0);
                }
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

    show : function(e, filename, linenr){
        var list = [], seen = {};
        
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
        
        errorInfo  = "Exception caught on line " + linenr + " in file " + filename + "<br>Message: " + e.message;
            
        e.lineNr   = linenr;
        e.fileName = filename;
    
        this.createWindow(e, list, errorInfo);//str
        
        //window.onerror = function(){window.onerror=null;return true}
        //throw new Error("Stopping Error Prosecution");
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
            return alert("Sorry, the depencies for the Data Debugger could not be loaded");
        
        /**
         * @todo change the .attribute to be in the debugmarkup namespace
         * @todo fix the edit state
         */
        var skinXml = '\
        <j:skin id="debug" xmlns:j="' + jpf.ns.jpf + '">\
            <j:markupedit name="debugmarkup">\
                <j:style><![CDATA[\
                    .debugmarkup{\
                        border : 1px solid gray;\
                        background-color : #FFFFFF;\
                        width : 200px;\
                        height : 500px;\
                        overflow : hidden;\
                        overflow : auto;\
                        font-family : Monaco, Courier New;\
                        font-size : 11px;\
                        cursor : default;\
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
                        margin : -2px -4px -5px -3px;\
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
                        height : 14px;\
                        white-space : nowrap;\
                    }\
                    /*\*/html>body*.debugmarkup dl{height : 12px;}/**/\
                    .debugmarkup span{\
                        display : inline;\
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
                        background-repeat : no-repeat;\
                        background-position : 2px 3px;\
                    }\
                    .debugmarkup .selected dl,\
                    .debugmarkup .selected dd,\
                    .debugmarkup .selected dt,\
                    .debugmarkup .selected span,\
                    .debugmarkup .selected strong{\
                        background-color : #191970;\
                        color : #FFFFFF;\
                    }\
                    #override .debugmarkup .highlight{\
                        background-color : #FFFF00;\
                        color : #000000;\
                    }\
                    .debugmarkup DIV.pluslast {\
                        background-image:url(' + this.resPath + 'splus.gif);\
                    }\
                    .debugmarkup DIV.minlast {\
                        background-image:url(' + this.resPath + 'smin.gif);\
                    }\
                    .debugmarkup DIV.plus {\
                        background-image:url(' + this.resPath + 'splus.gif);\
                    }\
                    .debugmarkup DIV.min {\
                        background-image:url(' + this.resPath + 'smin.gif);\
                    }\
                    .debugmarkup BLOCKQUOTE{\
                        margin : 0;\
                        padding : 0 0 0 10px;\
                        display : none;\
                        height : 0;\
                        overflow : hidden;\
                    }\
                ]]></j:style>\
                <j:presentation>\
                    <j:main container="." startclosed="false">\
                        <div class="debugmarkup"></div>\
                    </j:main>\
                    <j:item class="dl" begintag="dl/dt" begintail="dl/span" endtag="span" attributes="dl" openclose="." select="dl" container="blockquote">\
                        <div><dl><dt>-</dt><span> </span></dl><blockquote> </blockquote><span>-</span></div>\
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
        
        if (oHtml.getAttribute("inited")) return;

        oHtml.setAttribute("inited", "true");
        
        var oInt = oHtml.getElementsByTagName("div")[0];
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
        
        //<button onclick='jpf.debugwin.setSelected()' onkeydown='event.cancelBubble=true;'>Change</button>\
        var xml = jpf.xmldb.getXml("\
            <j:parent xmlns:j='" + jpf.ns.jpf + "'>\
                <button style='float:right' onclick='jpf.debugwin.exec(\"attribute\")' onkeydown='event.cancelBubble=true;'>Attribute</button>\
                <button style='float:right' onclick='jpf.debugwin.exec(\"textnode\")' onkeydown='event.cancelBubble=true;'>Textnode</button>\
                <button style='float:right' onclick='jpf.debugwin.exec(\"remove\")' onkeydown='event.cancelBubble=true;'>Remove</button>\
                <button style='float:right;margin-right:5px;' onclick='jpf.debugwin.exec(\"redo\")' onkeydown='event.cancelBubble=true;'>Redo</button>\
                <button style='float:right' onclick='jpf.debugwin.exec(\"undo\")' onkeydown='event.cancelBubble=true;'>Undo</button>\
                <label>Model:</label><select id='dbgMarkupSelect' onchange='jpf.debugwin.setSelected(true)' onkeydown='event.cancelBubble=true;'>" + options + "</select>\
                <label>XPath:</label><input id='dbgMarkupInput' onkeydown='if(event.keyCode==13) jpf.debugwin.setSelected(true);event.cancelBubble=true;' style='width:90px'/>\
                <j:markupedit skin='debugmarkup' skinset='debug' model='" + first + "' id='dbgMarkup' render-root='true' width='572' height='158'>\
                    <j:bindings>\
                        <j:traverse select='node()[local-name(.)]' />\
                    </j:bindings>\
                    <j:actions><j:remove /><j:setAttributeValue /><j:renameAttribute /><j:setTextNode /></j:actions>\
                </j:markupedit>\
            </j:parent>\
        ");
        
        if (jpf.isIE) {
            xml.ownerDocument.setProperty("SelectionNamespaces", 
                "xmlns:j='" + jpf.ns.jpf + "'");
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
            this.PROFILER_BUTTON.innerHTML  = "Stop";
        }
        else {
            this.PROFILER_ELEMENT.innerHTML = this.PROFILER_NOPROGRESS;
            this.PROFILER_BUTTON.innerHTML  = "Start";
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
        while (oLast.nodeType != 1) oLast = oLast.previousSibling;
        if (oLast.style.display == "block"){
            oLast.style.display = "none";
            oFirst.src          = this.resPath + "arrow_right.gif";
        }
        else {
            oLast.style.display = "block";
            oFirst.src          = this.resPath + "arrow_down.gif";
            if (corrScroll)
                oLast.scrollTop = oLast.scrollHeight;
            if (corrFocus) {
                oFirst = oLast.firstChild;
                while (oFirst.nodeType != 1) oFirst = oFirst.nextSibling;
                oFirst.focus();
            }
        }
    },

    createWindow : function (e, stackTrace, errorInfo){
        if (!jpf.debugwin.win) {
            var elError = jpf.debugwin.win = document.getElementById("javerror");
            if (!elError) {
                if (document.body) {
                    elError = document.body.appendChild(document.createElement("div"));
                    elError.id = "javerror";
                }
                else {
                    document.write("<div id='javerror'></div>");
                    elError = document.getElementById("javerror");
                }
                
                elError.style.position = jpf.supportFixedPosition ? "fixed" : "absolute";
                elError.style.zIndex = 10000000;
                elError.style.top = "10px";
                elError.style.border = "2px outset";//solid #65863a
                elError.style.textAlign = "left";
                elError.style.MozBorderBottomColors = "black gray";
                elError.style.MozBorderRightColors = "black gray";
                elError.style.MozBorderTopColors = "#C0C0C0 #FFFFFF";
                elError.style.MozBorderLeftColors = "#C0C0C0 #FFFFFF";
                elError.style.padding = "10px";
                elError.style.width = "600px";
                elError.style.background = "#dfdfdf";
                elError.style.right = "10px";
                
                elError.onmousedown = 
                elError.onkeydown = 
                elError.onkeyup = function(e){
                    (e || event).cancelBubble = true;
                }
                
                jpf.importCssString(document, "\
                    #cbTW, #cbHighlight, #toggledebug{\
                        float:left;\
                    }\
                    #javerror button, #javerror select, #javerror input, #javerror label{\
                        font-family:Arial;\
                        font-size:8pt;\
                    }\
                    #override #javerror{\
                        letter-spacing:0;\
                        font-family:Arial;\
                    }\
                    #javerror label{\
                        padding:5px 0 0 1px;\
                        width:auto;\
                    }\
                    #javerror button{\
                        padding:0;\
                        margin-top:-1px;\
                    }\
                    #javerror .debug_javeline_logo{\
                        width:106px;\
                        height:74px;\
                        background:url(" + this.resPath + "platform_logo.gif) no-repeat;\
                        position:absolute;\
                        right:20px;\
                        top:5px;\
                    }\
                    #javerror .debug_closebtn{\
                        cursor:hand;\
                        cursor:pointer;\
                        right : 10px;\
                        top : 10px;\
                        z-index : 1000;\
                        margin:0px;\
                        font-size:8pt;\
                        font-family:'Lucida Grande',Verdana;\
                        width:14px;\
                        text-align:center;\
                        height:14px;\
                        overflow:hidden;\
                        border:1px solid gray;\
                        color:gray;\
                        background-color:#EEEEEE;\
                        padding:0;\
                        position : absolute;\
                    }\
                    #javerror .debug_title{\
                        height:26px;\
                        background:url(" + this.resPath + "debug_title.gif) no-repeat 10px 10px;\
                        position : absolute;\
                        padding : 10px;\
                        width : 100%;\
                        left : 0;\
                        top : 0;\
                        margin : 0;\
                    }\
                    #javerror .debug_errorbox{\
                        border:1px solid black;\
                        padding:4px;\
                        font-family:Arial;\
                        font-size:10pt;\
                        background-color:white;\
                        margin-bottom:5px;\
                        margin-top : " + (jpf.isIE ? "42px" : "32px") + ";\
                    }\
                    #javerror .debug_footer{\
                         width:97px;\
                         height:18px;\
                         background:url(" + this.resPath + "javeline_logo.gif) no-repeat;\
                         position:absolute;\
                         right:16px;\
                         bottom:11px;\
                    }\
                    #javerror .debug_panel_head{\
                        cursor:default;\
                        border:1px solid gray;\
                        padding:4px;\
                        font-family:'Lucida Grande',MS Sans Serif,Arial;\
                        font-size:8pt;\
                        background-color:#eaeaea;\
                        margin-bottom:1px;\
                    }\
                    #javerror .debug_panel_headsub{\
                        margin-right:5px;\
                        float:right;\
                        margin-top:-4px;\
                    }\
                    #javerror .debug_panel_body_base{\
                        cursor:text;\
                        background:white url(" + this.resPath + "shadow.gif) no-repeat 0 0;\
                        padding:4px;\
                        font-size:9pt;\
                        font-family:Monaco, Courier New;\
                        margin:3px;\
                        border:1px solid gray;\
                    }\
                    #javerror .debug_panel_body_none{\
                        display:none;\
                    }\
                    #javerror .debug_panel_body_markup{\
                        padding:4px 4px 20px 4px;\
                        max-height:200px;\
                        white-space:nowrap;\
                        overflow:auto;\
                    }\
                    #javerror .debug_panel_body_data{\
                        max-height:200px;\
                        white-space:nowrap;\
                        overflow:auto;\
                        display:none;\
                    }\
                    #javerror .debug_panel_body_profiler{\
                        padding:0px;\
                        font-family:'Lucida Grande',MS Sans Serif,Arial;\
                        font-size:9px;\
                        width:575px;\
                        height:180px;\
                        overflow:auto;\
                        display:block;\
                    }\
                    #javerror .debug_panel_body_log{\
                        height:250px;\
                        overflow:auto;\
                        font-size:8pt;\
                        font-family:'Lucida Grande',Verdana;\
                        margin:5px 3px 3px 3px;\
                    }\
                    #javerror .debug_panel_body_console{\
                        width:575px;\
                        height:100px;\
                    }\
                    #javerror .debug_profilermsg{\
                        margin: 4px;\
                        font-weight: 500;\
                        height:20px;\
                        line-height:20px;\
                        vertical-align:middle;\
                        overflow:visible;\
                        padding:4px;\
                    }\
                    #javerror .debug_progress{\
                        background-image:url(" + this.resPath + "progress.gif);\
                        background-repeat:no-repeat;\
                        background-position:center left;\
                        padding-left:22px;\
                    }\
                    #javerror .debug_console_btn{\
                        font-family:'Lucida Grande',MS Sans Serif,Arial;\
                        font-size:8pt;\
                        margin:0 0 0 3px;\
                    }\
                    #javerror .debug_check_use{\
                        position:relative;\
                        top:4px;\
                        font-family:'Lucida Grande',MS Sans Serif,Arial;\
                        font-size:8pt;\
                    }");
            }
            
            document.body.style.display = "block";
            
            elError.style.display = "block";
            var parse        = e.message.split(/\n===\n/);
            var errorMessage = parse[0].replace(/---- Javeline Error ----\n/g, "")
                .replace(/</g, "&lt;").replace(/Message: \[(\d+)\]/g, "Message: [<a title='Visit the manual on error code $1' style='color:blue;text-decoration:none;' target='_blank' href='http://developer.javeline.net/projects/platform/wiki/ErrorCodes#$1'>$1</a>]")
                .replace(/(\n|^)([\w ]+:)/gm, "$1<strong>$2</strong>").replace(/\n/g, "<br />");
            var jmlContext   = jpf.formatXml(parse[1] ? parse[1].trim(true) : "")
                .replace(/</g, "&lt;").replace(/\n/g, "<br />").replace(/\t/g, "&nbsp;&nbsp;&nbsp;");
            var canViewMarkup = jpf.nameserver && jpf.markupedit ? true : false;
                
            elError.innerHTML = "\
                <div class='debug_javeline_logo'></div>\
                <span onmouseover='this.style.backgroundColor=\"white\"' \
                  onmouseout='this.style.backgroundColor=\"#EEEEEE\"' \
                  onclick='this.parentNode.style.display=\"none\"' class='debug_closebtn'\
                >X</span>\
                <h1 class='debug_title'></h1>\
                <div onselectstart='event.cancelBubble=true' class='debug_errorbox'\
                >" + errorMessage + "</div>" +
            (jmlContext
             ? "<div class='debug_panel_head' onclick='jpf.debugwin.toggleFold(this);'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_down.gif' />&nbsp;\
                    <strong>Javeline Markup Language</strong>\
                    <br />\
                    <div onclick='event.cancelBubble=true' onselectstart='event.cancelBubble=true' \
                      class='debug_panel_body_base debug_panel_body_markup'>" + jmlContext + "</div>\
                </div>"
             : "") +
               "<div class='debug_panel_head' onclick='jpf.debugwin.toggleFold(this);'>\
                    <div class='debug_panel_headsub'>\
                        <input id='cbHighlight' type='checkbox' onclick='\
                          jpf.debugwin.toggleHighlighting(this.checked);\
                          event.cancelBubble = true;\' " + (jpf.getcookie("highlight") == "true" ? "checked='checked'" : "") +
                       "/>\
                        <label for='cbHighlight' style='top:4px;position:relative;' onclick='event.cancelBubble=true'>\
                            Enable Syntax Coloring\
                        </label>\
                    </div>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_right.gif' />&nbsp;\
                    <strong>Stack Trace</strong>\
                    <br />\
                    <div style='\
                      display:none;\
                      background:white url(" + this.resPath + ") no-repeat 0 0;\
                      padding:4px;\
                      font-size:9pt;\
                      font-family:Monaco, Courier New;\
                      margin:3px;\
                      border:1px solid gray;\
                    '>\
                        <blockquote></blockquote>\
                    </div>\
                </div>  " +
            (canViewMarkup 
             ? "<div class='debug_panel_head' onclick='jpf.debugwin.initMarkup(this);jpf.debugwin.toggleFold(this);'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_right.gif' />&nbsp;\
                    <strong>Live Data Debugger (beta)</strong>\
                    <br />\
                    <div onclick='event.cancelBubble=true' onselectstart='event.cancelBubble=true'\
                      class='debug_panel_body_base debug_panel_body_data'></div>\
                </div>"
             : "") +
               "<div class='debug_panel_head' id='jpfProfilerPanel' onclick='jpf.debugwin.toggleFold(this);'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_right.gif' />&nbsp;\
                    <strong>Javascript Profiler (beta)</strong>\
                    <br />\
                    <div onclick='event.cancelBubble=true' onselectstart='event.cancelBubble=true' style='display:none;'>\
                        <div id='jpfProfilerOutput' class='debug_panel_body_base debug_panel_body_profiler'></div>\
                        <div id='jpfProfilerSummary' style='float:right;font-size:9px;margin-right:10px;'></div>\
                        <button id='jpfProfilerAction' onclick='jpf.debugwin.startStop(this);' class='debug_control_btn'>Start</button>\
                        <input id='cbProfileGlobal' type='checkbox' onclick='\
                          jpf.debugwin.toggleProfileGlobal(this.checked);\
                          event.cancelBubble = true;\' " + (this.profileGlobal ? "checked='checked'" : "") +
                       "/>\
                        <label for='cbProfileGlobal' onclick='event.cancelBubble=true'>\
                            Profile window object\
                        </label>\
                        <input id='cbProfileStartup' type='checkbox' onclick='\
                          jpf.debugwin.toggleProfileStartup(this.checked);\
                          event.cancelBubble = true;\' " + (jpf.getcookie("profilestartup") == "true" ? "checked='checked'" : "") +
                       "/>\
                        <label for='cbProfileStartup' onclick='event.cancelBubble=true'>\
                            Profile startup\
                        </label>\
                    </div>\
                </div>\
                <div class='debug_panel_head' onclick='jpf.debugwin.toggleFold(this, true);'>\
                    <div class='debug_panel_headsub'>\
                        <input id='cbTW' type='checkbox' onclick='\
                          jpf.debugwin.toggleLogWindow(this.checked);\
                          event.cancelBubble = true;' " + (jpf.getcookie("viewinwindow") == "true" ? "checked='checked'" : "") + "/>\
                        <label for='cbTW' style='\
                          top:4px;\
                          position:relative;' onclick='event.cancelBubble=true'\
                        >View in window</label>\
                    </div>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_down.gif' />&nbsp;\
                    <strong>Log Viewer</strong>\
                    <br />\
                    <div id='jvlnviewlog' onclick='event.cancelBubble=true' \
                      onselectstart='event.cancelBubble=true' \
                      onmousedown='event.cancelBubble=true;if (jpf.window) jpf.window.$focusRoot();' \
                      class='debug_panel_body_base debug_panel_body_log'>" + jpf.console.debugInfo.join('') + "</div>\
                </div>" +
               "<div class='debug_panel_head' onclick='jpf.debugwin.toggleFold(this, false, true);'>\
                    <img width='9' height='9' src='" + this.resPath + "arrow_right.gif' />&nbsp;\
                    <strong>Javascript console</strong>\
                    <br />\
                    <div style='display:none' onclick='event.cancelBubble=true'>\
                        <textarea id='jpfDebugExpr' onkeydown='return jpf.debugwin.consoleTextHandler(event);' \
                          onselectstart='event.cancelBubble=true' \
                          onmousedown='event.cancelBubble=true;if(jpf.window) jpf.window.$focusRoot();' \
                          class='debug_panel_body_base debug_panel_body_console'>" + jpf.getcookie("jsexec") + "</textarea>\
                        <div style='float:right'>\
                            <button onclick='jpf.debugwin.run(\"reboot\")' class='debug_console_btn' onkeydown='jpf.debugwin.consoleBtnHandler(event)'>Reboot</button>\
                            <button onclick='jpf.debugwin.run(\"undo\")' class='debug_console_btn' onkeydown='jpf.debugwin.consoleBtnHandler(event)'>Undo</button>\
                            <button onclick='jpf.debugwin.run(\"redo\")' class='debug_console_btn' onkeydown='jpf.debugwin.consoleBtnHandler(event)'>Redo</button>\
                            <button onclick='jpf.debugwin.run(\"reset\")' class='debug_console_btn' onkeydown='jpf.debugwin.consoleBtnHandler(event)'>Reset State</button>\
                            <button onclick='jpf.debugwin.run(\"online\")' class='debug_console_btn' onkeydown='jpf.debugwin.consoleBtnHandler(event)'>Go Online</button>\
                            <button onclick='jpf.debugwin.run(\"offline\")' class='debug_console_btn' onkeydown='jpf.debugwin.consoleBtnHandler(event)'>Go Offline</button>\
                        </div>\
                        <button id='jpfDebugExec' onclick='jpf.debugwin.jRunCode(document.getElementById(\"jpfDebugExpr\").value)' \
                          class='debug_console_btn' onkeydown='return jpf.debugwin.consoleExecHandler(event)'>Execute</button>\
                    </div>\
                </div>" +
               "<br style='line-height:5px'/>\
                <input id='toggledebug' type='checkbox' onclick='jpf.debugwin.toggleDebugger(this.checked)' />\
                <label for='toggledebug' class='debug_check_use'>Use browser's debugger</label>\
                <div class='debug_footer'></div>"
            var b = elError.getElementsByTagName("blockquote")[0];
            //" || "No stacktrace possible").replace(/\n/g, "<br />") + "
            if (stackTrace.length) {
                for (var i = 0; i < stackTrace.length; i++)
                    b.parentNode.insertBefore(stackTrace[i], b);
                b.parentNode.removeChild(b);
            }
            else
                b.replaceNode(document.createTextNode("No stacktrace possible"));
            
            if (!self.ERROR_HAS_OCCURRED && jpf.addEventListener) {
                jpf.addEventListener("debug", function(e){
                    var logView = document.getElementById("jvlnviewlog");
                    if (!logView) return;
                    
                    logView.insertAdjacentHTML("beforeend", e.message);
                    logView.style.display = "block";
                    logView.scrollTop     = logView.scrollHeight;
                });
            }
            
            if (!this.oExt && jpf.Interactive) {
                this.oExt = elError;
                this.oExt.onmousedown = function(){
                    if (this.style.right) {
                        this.style.left = this.offsetLeft + "px";
                        this.style.right = "";
                    }
                }
                this.oDrag = this.oExt.getElementsByTagName("h1")[0];
                this.pHtmlDoc = document;
                
                this.$propHandlers = [];
                jpf.inherit.call(this, jpf.Interactive);
                
                this.minwidth  = 400;
                this.minheight = 520;
                this.maxwidth  = 10000;
                this.maxheight = 10000;
                
                this.draggable = this.resizable = true;
                this.$propHandlers["draggable"].call(this, true);
                this.$propHandlers["resizable"].call(this, true);
            }
            
            clearInterval(jpf.Init.interval);
            ERROR_HAS_OCCURRED = true;

            this.initProfiler(this);
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
    
    toggleLogWindow : function (checked){
        if (checked) {
            jpf.console.debugType = "window";
            jpf.console.showWindow();
        }
        else
            jpf.console.debugType = "memory";
        
        if (jpf.setcookie)
            jpf.setcookie("viewinwindow", checked)
    },
    
    toggleHighlighting : function (checked){
        jpf.setcookie("highlight", checked);
    },

    toggleDebugger : function(checked){
        this.useDebugger = checked;
    
        if (jpf.setcookie)
            jpf.setcookie("debugger", checked)
        
        if (!checked)
            window.onerror = this.errorHandler;
        else
            window.onerror = null;
    },
    
    errorHandler : function(message, filename, linenr, isForced){
        if (!message) message = "";
        var e = {
            message : message.indexOf("jml file") > -1 
                ? message
                : "js file: [line: " + linenr + "] "
                    + jpf.removePathContext(jpf.hostPath, filename) + "\n" + message
        }

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

        if (document.getElementById("javerror"))
            document.getElementById("javerror").style.display = "block";
        else {
            jpf.debugwin.errorHandler(msg || "User forced debug window to show", 
                location.href, 0, true);
        }
    }
}

jpf.showDebugWindow = function(){
    jpf.debugwin.activate();
}

// #endif
