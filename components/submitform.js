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

// #ifdef __JSUBMITFORM || __INC_ALL
// #define __WITH_DATABINDING 1
// #define __WITH_PRESENTATION 1
// #define __JBASETAB 1
// #define __WITH_VALIDATION 1

/**
 * Component allowing special form functionality to a set of JML
 * components. Since v0.98 this component is alias for j:xforms offering
 * xform compatible strategies with relation to submitting the form's data.
 * This component also offers form paging, including validation between
 * and over pages. Buttons placed inside this component can contain an action
 * attribute specifying wether they behave as next, previous or finish(submit)
 * buttons.
 *
 * @classDescription		This class creates a new submitform
 * @return {Submitform} Returns a new submitform
 * @type {Submitform}
 * @constructor
 * @allowchild page, {components}, {anyjml}
 * @addnode components:submitform, components:xforms
 * @alias jpf.xforms
 *
 * @author      Ruben Daniels
 * @version     %I%, %G%
 * @since       0.9
 */
jpf.xforms = 
jpf.submitform = function(pHtmlNode, tagName){
    jpf.register(this, tagName || "submitform", GUI_NODE);/** @inherits jpf.Class */
    this.pHtmlNode = pHtmlNode || document.body;
    this.pHtmlDoc = this.pHtmlNode.ownerDocument;
    
    /* ***********************
            Inheritance
    ************************/
    /**
     * @inherits jpf.DataBinding
     * @inherits jpf.BaseTab
     * @inherits jpf.ValidationGroup
     */
    this.inherit(jpf.DataBinding, jpf.BaseTab, jpf.ValidationGroup);
    
    /* ********************************************************************
                                        PRIVATE PROPERTIES
    *********************************************************************/
    this.elements = {};
    var buttons = {
        "next"     : [],
        "previous" : [],
        "submit"   : [],
        "follow"   : []
    };
    
    this.focussable = false;
    //this.allowMultipleErrors = true;
    
    this.inputs        = [];
    this.errorEl       = {};
    this.cq            = {};
    this.reqs          = [];
    this.conditionDeps = {};
    this.depends       = {};

    this.loadValueDeps = {};
    this.loadValues    = {};
    
    this.listsHeldBack = {};
    this.nextHeldBack  = {};
    
    this.activePage    = 0;
    this.zCount        = 1000000;
    
    this.clear = function(){};
    
    /* ********************************************************************
                                        PUBLIC METHODS
    *********************************************************************/
    
    this.showLoader = function(checked, nr){
        if (checked) {
            var page = nr ? this.getPage(nr) : this.getNextPage();
            if (!page || page.isRendered) return;
        }
        
        if (this.loadState) {
            this.loadState.style.display = "block";
            
            var message = this.getPage().jml.getAttribute("loadmessage");
            if (message)
                (jpf.XMLDatabase.selectSingleNode("div[@class='msg']", this.loadState)
                  || this.loadState).innerHTML = message;
        }
    }
    
    this.hideLoader = function(){
        if (this.loadState)
            this.loadState.style.display = "none";
    }
    
    var nextpagenr;
    this.getNextPage = function(){
        var nextpage, pageNr = this.activePage;
        do {
            nextpage = this.getPage(++pageNr);
        }
        while(nextpage && !this.testCondition(nextpage.condition));
        
        nextpagenr = pageNr;
        return nextpage;
    }
    
    this.next = function(no_error){
        if (!this.testing && !this.isValid(null, null, this.getPage())) {
            this.hideLoader();
            return;//checkRequired
        }
        
        //var nextpage = nextpagenr ? this.getPage(nextpagenr) : this.getNextPage();
        //if(this.dispatchEvent("onbeforeswitch", nextpagenr) === false)return false;

        //this.getPage().hide();
        this.setActiveTab(this.activePage + 1);//nextpagenr
        //this.activePage = nextpagenr;
        
        //if(!no_error && !nextpage) throw new Error(1006, jpf.formErrorString(1006, this, "Form", "End of pages reached."));
        
        //nextpage.show();
        //if(nextpage.isRendered) this.hideLoader();
        //else nextpage.addEventListener("onafterrender", function(){this.parentNode.hideLoader()});
        
        for (var prop in buttons) {
            if (!prop.match(/next|previous|submit/)) continue;
            this.updateButtons(prop);
        }
        
        nextpagenr = null;
        
        /*var jmlNode = this;
        setTimeout(function(){
            jmlNode.dispatchEvent("onafterswitch", jmlNode.activePage, nextpage);
        }, 1);*/
    }
    
    this.previous = function(){
        //var active = this.activePage;
        //do{var prevpage = this.getPage(--active);}
        //while(prevpage && !this.testCondition(prevpage.condition));
        
        //if(this.dispatchEvent("onbeforeswitch", active) === false) return false;
        
        this.setActiveTab(this.activePage - 1);
        //this.getPage().hide();
        //this.activePage = active;

        //if(!prevpage) throw new Error(1006, jpf.formErrorString(1006, this, "Form", "End of pages reached."));
        
        //prevpage.show();
        
        //if(prevpage.isRendered) this.hideLoader();
        //else prevpage.addEventListener("onafterrender", function(){this.parentNode.hideLoader()});
        
        for (var prop in buttons) {
            if (!prop.match(/next|previous|submit/)) continue;
            this.updateButtons(prop);
        }

        //this.dispatchEvent("onafterswitch", this.activePage);
    }
    
    this.__enable = function(){
        forbuttons('enable');
    }
    
    this.__disable = function(){
        forbuttons('disable');
    }
    
    function forbuttons(feat){
        var arr = ["next", "previous", "submit", "follow"];
        for (var k = 0; k < arr.length; k++) {
            for (var i = 0; i < buttons[arr[k]].length; i++) {
                buttons[arr[k]][i][feat]();
            }
        }
    }
    
    this.processValueChange = function(oFormEl){
        if (this.conditionDeps[oFormEl.name]) {
            var c = this.conditionDeps[oFormEl.name];
            for (var i = 0; i < c.length; i++) {
                if (this.testCondition(c[i].condition))
                    c[i].setActive();
                else
                    c[i].setInactive();
            }
        }
        
        for (var prop in buttons) {
            if (!prop.match(/next|previous|submit/)) continue;
            this.updateButtons(prop);
        }

        this.setLoadValues(oFormEl.name);
    }
    
    /* ***********************
                Actions
    ************************/
    
    /* ********************************************************************
                                        PRIVATE METHODS
    *********************************************************************/
    this.addInput = function(objEl){
        var name = objEl.name;
        objEl.validgroup = this;

        if (this.elements[name] && !this.elements[name].length) {
            this.elements[name] = [this.elements[name]];
            this.elements[name].getValue = new Function(
                "for (var i = 0; i < this.length; i++)\
                     if (this[i].oInt.checked)\
                         return this[i].getValue();");
        }

        if (this.elements[name])
            this.elements[name].push(objEl);
        else
            this.elements[name] = objEl;

        if (this.cq[name]) {
            for (var i = 0; i < this.cq[name].length; i++) {
                this.cq[name][i][1].call(this.cq[name][i][0], objEl);
                objEl.labelEl = this.cq[name][i][0];
            }
        }
        
        if (objEl.jml.getAttribute("dependson")) {
            var o = self[objEl.jml.getAttribute("dependson")];
            if (!this.depends[o.name])
                this.depends[o.name] = [];
            this.depends[o.name].push(objEl);
            objEl.setInactive();
        }
        
        if (objEl.nodeType == GUI_NODE)
            objEl.setZIndex(--this.zCount);
        
        if (this.listsHeldBack[name]) {
            var ld = this.listsHeldBack[name];
            this.loadLists(ld[0], ld[1], ld[2]);
            this.listsHeldBack[name] = null;
        }

        if (this.nQuest && objEl.jml.getAttribute("checknext") == "true") {
            if (this.lastEl) {
                this.lastEl.nextEl = objEl;
                objEl.prevEl = this.lastEl;
            }
            this.lastEl = objEl;
            
            if (objEl.prevEl && objEl.jml.getAttribute("show") != "true" 
              && !this.nextHeldBack[name] && !objHasValue(objEl))
                objEl.setInactive(true);
            else if (this.condActiveCheck[objEl.name])
                this.condActiveCheck[objEl.name].setActive();
            
            //terrible code, but what the heck
            if (this.condActiveCheck[objEl.name]) {
                objEl.container = this.condActiveCheck[objEl.name];
                
                function activateHandler(){
                    if (this.form.hasActiveElement(this.container))
                        this.container.setActive();
                    else
                        this.container.setInactive();
                }
                
                objEl.addEventListener("onactivate", activateHandler);
                objEl.addEventListener("ondeactivate", activateHandler);
            }
        }
    }
    
    this.hasActiveElement = function(objEl){
        var nodes = objEl.jml.getElementsByTagName("*");
        for (var i = 0; i < nodes.length; i++) {
            if (!nodes[i].getAttribute("id")) continue;
            var comp = this.elements[nodes[i].getAttribute("id")];
            if (comp && comp.form == this && comp.isActive)
                return true;
        }
        
        return false;
    }
    
    this.condActiveCheck = {};
    
    this.getButtons      = function(action){
        return buttons[action];
    }
    
    this.registerButton = function(action, oBtn){
        buttons[action].push(oBtn);
        
        if (oBtn.condition)
            this.parseCondition(oBtn, oBtn.condition);
        this.updateButtons(action, oBtn);
        
        if (action == "follow") return;
        
        var jmlNode = this;
        oBtn.onclick = function(){
            jmlNode.showLoader(true);
            setTimeout(function(){ jmlNode[action](); }, 10);
        };
        
        /*
            new Function(
                "jpf.lookup(" + this.uniqueId + ").showLoader(true);setTimeout("jpf.lookup(" + this.uniqueId + ")." + action + "()", 10)"
            );
        
            action == "previous" ?
                "jpf.lookup(" + this.uniqueId + ")." + action + "()" :
                "jpf.lookup(" + this.uniqueId + ").showLoader();setTimeout("jpf.lookup(" + this.uniqueId + ")." + action + "()", 10)"
            );
        */
    }
    
    //refactor to give buttons classes, so they can decide what to do when inactive
    this.updateButtons = function(action, singleBtn){
        return false;//
        
        if (!buttons[action]) return false;
        
        var result = true;
        if (action == "previous" && this.activePage == 0)
            result = false;
        else if (!this.testing && action == "next" && !this.isValid())
            result = false;
        else if (action == "next") {
            var cp = this.activePage;
            do {
                var nextpage = this.getPage(++cp);
            }
            while(nextpage && !this.testCondition(nextpage.condition));

            if (!nextpage)
                result = false;
        }

        if (this.testing)
            return true;

        var buttons = singleBtn ? [singleBtn] : buttons[action];
        for (var i = 0; i < buttons.length; i++) {
            if (result && (!buttons[i].condition || this.testCondition(buttons[i].condition))) 
                buttons[i].setActive();
            else
                buttons[i].setInactive();
        }

        return true;
    }
    
    this.setLoadValues = function(item, clearElements, noload){
        var lvDep = this.loadValueDeps[item];
        if (!lvDep) return;
        //alert(item);
        for (var i = 0; i < lvDep.length; i++) {
            try{
                if (!eval(lvDep[i][1]))
                    throw new Error();
            }catch (e) {
                if (clearElements) {
                    var oEl = self[lvDep[i][0].getAttribute("element")];
                    if (oEl)
                        this.clearNextQuestionDepencies(oEl, true);//might be less optimized...

                    if (lvDep[i][0].tagName == "LoadValue")
                        this.dispatchEvent("onclearloadvalue", lvDep[i][0]);

                    /*else if(lvDep[i][0].getAttribute("lid")){
                        var lid = lvDep[i][0].getAttribute("lid");
                        var nodes = this.XMLRoot.selectSingleNode("node()[@lid='" + lid + "']");
                        
                        for(var i=0;i<nodes.length;i++){
                            jpf.XMLDatabase.removeNode(nodes[i]);
                        }
                    }*/
                }
                continue;
            }
            
            if (noload) continue;
            
            if (lvDep[i][0].getAttribute("runonrequest") != "true") {
                this.processLoadRule(lvDep[i][0], lvDep[i][2], lvDep[i]);
            }
            else
                if (self[lvDep[i][0].getAttribute("element")]) {
                    //This should be different :'(
                    self[lvDep[i][0].getAttribute("element")].clear();
                }
        }
    }
    
    this.processLoadRule = function(xmlCommNode, isList, data){
        //Extend with Method etc
        if (!jpf.Teleport.hasLoadRule(xmlCommNode)) return;
        
        this.dispatchEvent(isList ? "onbeforeloadlist" : "onbeforeloadvalue");
        
        //Process basedon arguments
        var nodes = xmlCommNode.childNodes;//selectNodes("node()[@arg-type | @arg-nr]"); //Safari bugs on this XPath... hack!
        if (nodes.length) {
            var arr, arg = xmlCommNode.getAttribute(jpf.Teleport.lastRuleFound.args);
            arg = arg ? arg.split(";") : [];

            if (xmlCommNode.getAttribute("argarray"))
                arr = [];
            for (var j = 0; j < nodes.length; j++) {
                if (nodes[j].nodeType != 1) continue; //for safari
                if (nodes[j].getAttribute("argtype").match(/fixed|param|nocheck/)) { //Where does item come from??? || item == nodes[j].getAttribute("element")
                    var el    = self[nodes[j].getAttribute("element")];
                    var xpath = el.getMainBindXpath();
                    var xNode = jpf.XMLDatabase.createNodeFromXpath(this.XMLRoot, xpath);
                    var nType = xNode.nodeType;
                    (arr || arg)[nodes[j].getAttribute("argnr") || j] = 
                        "xpath:" + xpath + (nType == 1 ? "/text()" : "");
                }
                else
                    if(nodes[j].getAttribute("argtype") == "xpath") {
                        (arr || arg)[nodes[j].getAttribute("argnr") || j] = 
                            "xpath:" + nodes[j].getAttribute("select");//jpf.getXmlValue(this.XMLRoot, );
                    }
            }

            if (xmlCommNode.getAttribute("argarray")) {
                arg[xmlCommNode.getAttribute("argarray")] = "(" + arr.join(",") + ")";
            }

            xmlCommNode.setAttribute(jpf.Teleport.lastRuleFound.args, arg.join(";"));
        }

        //this.XMLRoot.firstChild
        //if(confirm("do you want to debug?")) throw new Error();
        
        var jNode = self[xmlCommNode.getAttribute("element")];
        if (jNode && jNode.nodeType == GUI_NODE)
            jNode.__setStyleClass(jNode.oExt, "loading", ["loaded"]);
        
        //if(!isList && !data[0].getAttribute("lid")) data[0].setAttribute("lid", jpf.getUniqueId());
        jpf.Teleport.callMethodFromNode(xmlCommNode, this.XMLRoot,
            Function('data', 'state', 'extra', 'jpf.lookup(' + this.uniqueId
                + ').' + (isList ? 'loadLists' : 'loadValues') 
                + '(data, state, extra)'), null, data);
    }
    
    this.registerCondition = function(objEl, strCondition, no_parse){
        if (!no_parse) 
            this.parseCondition(objEl, strCondition);
        
        var forceActive = false;
        if (objEl.onlyWhenActive) {
            var nodes = objEl.jml.getElementsByTagName("*");
            for (var i = 0; i < nodes.length; i++) {
                if (!nodes[i].getAttribute("id")) continue;
                
                if (this.nextHeldBack[nodes[i].getAttribute("id")])
                    forceActive = true;
                else
                    if (nodes[i].getAttribute("ref") && this.XMLRoot 
                      && jpf.XMLDatabase.getNodeValue(this.XMLRoot
                      .selectSingleNode(nodes[i].getAttribute("ref"))) != "") {
                        forceActive = true;
                        nodes[i].setAttribute("show", "true");
                    }
                
                this.condActiveCheck[nodes[i].getAttribute("id")] = objEl;
            }
        }

        if (forceActive || this.testCondition(objEl.condition) 
          && (!objEl.onlyWhenActive || this.hasActiveElement(objEl, true)))
            objEl.setActive();
        else
            objEl.setInactive();
        
        var matches = !no_parse
            ? strCondition.match(/(\W|^)(\w+)(?:\=|\!\=)/g)
            : strCondition.match(/(\b|^)([\w\.]+)/g);
        if (!matches) return;
        
        for (var i = 0; i < matches.length; i++) {
            if (!no_parse) {
                var m = matches[i].replace(/(?:\=|\!\=)$/, "").replace(/(^\s+|\s+$)/g, "");
            }
            else {
                var m = matches[i].split(".");
                if (m.length < 2) continue;
                m = m[0];
            }
            
            if (!this.conditionDeps[m])
                this.conditionDeps[m] = Array();
            this.conditionDeps[m].push(objEl);
        }
    }
    
    this.testCondition = function(strCondition){
        //somename='somestr' and (sothername='que' or iets='niets') and test=15

        try {
            return eval(strCondition);
        }
        catch(e) {
            return false;
            //throw new Error(1009, jpf.formErrorString(1009, this, "Form", "Invalid conditional statement [" + strCondition + "] : " + e.message));
        }
    }
    
    this.loadValues = function(data, state, extra){
        if (state != __HTTP_SUCCESS__) {
            if (extra.retries < jpf.maxHttpRetries)
                return extra.tpModule.retry(extra.id);
            else
                throw new Error(1010, jpf.formErrorString(1010, this, "LoadVaLue", "Could not load values with LoadValue query :\n\n" + extra.message));
        }

        if (extra.userdata[0].getAttribute("returntype") == "array") {
            //integrate array
            for (var i = 0; i < data.length; i++) {
                var pnode = this.XMLRoot.selectSingleNode("//" + data[i][0]);
                jpf.XMLDatabase.setTextNode(pnode, data[i][1] || "");
            }
        }
        else {
            //integrate xml
            if (typeof data != "object")
                data = jpf.getObject("XMLDOM", data).documentElement;
            var nodes     = data.childNodes;
            var strUnique = extra.userdata[0].getAttribute("unique");

            for (var i = nodes.length - 1; i >= 0; i--) {
                var xmlNode = nodes[i];
                var unique  = strUnique ? xmlNode.selectSingleNode(strUnique) : false;
                
                var node = unique 
                    ? this.XMLRoot.selectSingleNode("node()[" + strUnique 
                        + " = '" + unique.nodeValue + "']") 
                    : null;
                if (node) {
                    //Move all this into the XMLDatabase
                    jpf.XMLDatabase.copyConnections(node, xmlNode);
                    jpf.XMLDatabase.notifyListeners(xmlNode);
                    
                    //node.setAttribute("lid", data.getAttribute("lid"));
                    
                    //hack!! - should be recursive
                    var valueNode = xmlNode.selectSingleNode("value");
                    if (valueNode) {
                        jpf.XMLDatabase.copyConnections(node
                            .selectSingleNode("value"), valueNode);
                        jpf.XMLDatabase.notifyListeners(valueNode);
                    }
                }
                
                this.XMLRoot.insertBefore(xmlNode, node); //consider using replaceChild here
                if (node)
                    this.XMLRoot.removeChild(node);
                jpf.XMLDatabase.applyChanges("attribute", xmlNode);
            }
        }

        this.dispatchEvent("onafterloadvalue");
    }
    
    this.loadLists = function(data, state, extra){
        if (state != __HTTP_SUCCESS__){
            if (extra.retries < jpf.maxHttpRetries)
                return extra.tpModule.retry(extra.id);
            else
                throw new Error(1011, jpf.formErrorString(1011, this, "Load List", "Could not load data with LoadList query :\n\n" + extra.message));
        }
        
        if (!self[extra.userdata[0].getAttribute("element")])
            return this.listsHeldBack[extra.userdata[0].getAttribute("element")] =
                [data, state, extra];
        
        //set style
        var jNode = self[extra.userdata[0].getAttribute("element")];
        if (jNode && jNode.nodeType == GUI_NODE) {
            jNode.__setStyleClass(jNode.oExt, "loaded", ["loading"]);
            setTimeout("var jNode = jpf.lookup(" + jNode.uniqueId + ");\
                jNode.__setStyleClass(jNode.oExt, '', ['loading', 'loaded']);", 500);
        }

        if (extra.userdata[0].getAttribute("clearonload") == "true") {
            jNode.clearSelection();
            //this.setLoadValues(jNode.name, true);
            this.clearNextQuestionDepencies(jNode, true);
        }
        
        //load xml in element
        jNode.load(data);
        //if(!jNode.value){
            //this.clearNextQuestionDepencies(jNode, true);
        //}
        
        this.dispatchEvent("onafterloadlist");
    }
    
    /*this.isValid = function(checkReq, setError, page){
        if(!page) page = this.getPage() || this;
        var found = checkValidChildren(page, checkReq, setError);
        
        //Global Rules
        //
        
        return !found;
    }
    
    this.validate = function(){
        if(!this.isValid()){
            
        }
    }*/
    
    //HACK!
    this.reset = function(){
      //Clear all error states
        for (name in this.elements) {
            var el = this.elements[name];
            
            //Hack!!! maybe traverse
            if (el.length) {
                throw new Error(0, jpf.formErrorString(this, "clearing form", "Found controls without a name or with a name that isn't unique. Please give all elements of your submitform an id: '" + name + "'"));
            }
            
            el.clearError();
            if (this.errorEl[name])
                this.errorEl[name].hide();
            
            if (el.hasFeature(__MULTIBINDING__))
                el.getSelectionSmartBinding().clear();
            else
                el.clear();
        }
    }
    
    /* ***********************
            Databinding
    ************************/
    
    this.__xmlUpdate = function(action, xmlNode, listenNode, UndoObj){
        //this.setConnections(this.XMLRoot, "select");
        //if(confirm("debug? " + this.toString())) debugger;
        this.dispatchEvent("onxmlupdate");
    }
    
    this.smartBinding = {};
    
    this.__load = function(XMLRoot, id){
        jpf.XMLDatabase.addNodeListener(XMLRoot, this);
        //this.setConnections(jpf.XMLDatabase.getElement(XMLRoot, 0), "select");	
        //this.setConnections(XMLRoot, "select");	
    }
    
    function objHasValue(objEl){
        var oCheck = objEl.hasFeature(__MULTISELECT__) 
            ? objEl.getSelectionSmartBinding() 
            : objEl;
        if (!oCheck)
            return false;
        return oCheck.applyRuleSetOnNode(oCheck.mainBind,
            oCheck.XMLRoot, null, true);
    }
    
    //Reset form
    function onafterload(){
        //Clear all error states
        for (name in this.elements) {
            if (jpf.isSafari && (!this.elements[name] 
              || !this.elements[name].__jmlLoaders))
                continue;
            
            //Hack!!! maybe traverse
            if (this.elements[name].length) {
                throw new Error(1012, jpf.formErrorString(1012, this, "clearing form", "Found controls without a name or with a name that isn't unique("+name+"). Please give all elements of your submitform an id: '" + name + "'"));
            }
            
            this.elements[name].clearError();
            if(this.errorEl[name])
                this.errorEl[name].hide();
        }
        
        if (this.nQuest) {
            //Show all controls and labels which are in the nquest stack
            for (name in this.elements) {
                
                var objEl = this.elements[name];
                
                if (objEl.jml.getAttribute("checknext") == "true") {
                    if (objHasValue(objEl)) {//oCheck.value || 
                        objEl.setActive();
                        if (this.condActiveCheck[name])
                            this.condActiveCheck[name].setActive();
                    }
                    else {
                        objEl.setInactive(true);
                    }
                }
                else {
                    //que ???
                    if (objEl.tagName == "Radiogroup" && objEl.current)
                        objEl.current.uncheck();
                }
            }
        }

        if (this.nQuest && this.XMLRoot.childNodes.length > 0) {
            var element = this.nQuest.getAttribute("final");
            var jmlNode = self[element].jml;//jpf.XMLDatabase.selectSingleNode(".//node()[@id='" + element + "']", this.jml);

            if (jmlNode && !jpf.XMLDatabase.getBoundValue(jmlNode, this.XMLRoot)) {
                var fNextQNode = jpf.XMLDatabase
                    .selectSingleNode(".//node()[@checknext='true']", this.jml);
                if (!fNextQNode) return;
                self[fNextQNode.getAttribute("id")].dispatchEvent("onafterchange");
            }
        }
    }
    this.addEventListener("onafterload", onafterload);
    this.addEventListener("onafterinsert", onafterload);
    
    this.addEventListener("onbeforeload", function(){
        if (!this.smartBinding || !this.smartBinding.actions) return;
        var nodes = this.smartBinding.actions.LoadList;
        if (nodes) {
            for (var objEl, i = 0; i < nodes.length; i++) {
                if (!nodes[i].getAttribute("element") 
                  || !(objEl = this.elements[nodes[i].getAttribute("element")]))
                    continue;
                objEl.clear();
            }
        }
        
        var nodes = this.smartBinding.actions.NextQuestion;
        if (nodes) {
            for (var objEl, i = 0; i < nodes.length; i++) {
                if (!nodes[i].getAttribute("final") 
                  || !(objEl = this.elements[nodes[i].getAttribute("element")]))
                    continue;
                objEl.clear();
            }
        }
    });
    
    /* *********
        INIT
    **********/
    this.inherit(jpf.JmlNode); /** @inherits jpf.JmlNode */
    
    this.addOther = function(tagName, oJml){
        if (tagName == "loadstate") {
            var htmlNode   = jpf.compat.getFirstElement(oJml);
            this.loadState = jpf.XMLDatabase.htmlImport(htmlNode, this.oInt);
            this.loadState.style.display = "none";
        }
    }
    
    this.draw = function(){
        //Build Main Skin
        this.oPages = this.oExt = this.__getExternal(); 
        this.oInt   = this.__getLayoutNode("main", "container", this.oExt);
        this.oExt.host = this;
    }
    
    /**
     * @syntax
     *  <j:submitform 
     *    [action="url" method="get|post|urlencoded-post" [ref="/"] ]
     *    [submit="<save_data>"] 
     *    [submittype="json|xml|native"]
     *    [useelements="boolean"]
     *    [model="id"]
     *  >
     *    <j:Button action="submit" [submission="@id"] [model=""] />
     *  </j:submitform>
     */
    this.submit = function(submissionId){
        if(!this.isValid()) return;
        if(!this.model)     return; //error?
        
        var type = this.method == "urlencoded-post" 
            ? "native" 
            : (this.type || "xml");
        var instruction = submissionId || this.action 
            ? ((this.method.match(/post/) ? "url.post:" : "url:") + this.action) 
            : "";
        
        this.model.submit(instruction, type, this.useComponents, this.ref);
    }
    
    this.setModel = function(model, xpath){
        this.model = model;
    }
    
    this.__loadJML = function(x){
        this.testing       = x.getAttribute("testing") == "true";

        this.action        = this.jml.getAttribute("action");
        this.ref           = this.jml.getAttribute("ref");
        this.type          = this.jml.getAttribute("submittype") || "native";
        this.method        = (this.jml.getAttribute("method") || "get").toLowerCase();
        this.useComponents = this.jml.getAttribute("usecomponents") || true;
        
        jpf.setModel(x.getAttribute("model"), this);
        
        this.__drawTabs(function(xmlPage) {
            this.validation = xmlPage.getAttribute("validation") || "true";
            this.invalidmsg = xmlPage.getAttribute("invalidmsg");
        });
    }
}

// #endif