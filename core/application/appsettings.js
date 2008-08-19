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

/**
 *
 * @addnode global:appsettings
 */
jpf.appsettings = {
    tagName        : "appsettings",
    
    //Defaults
    autoHideLoading: true,
    autoDisable    : true,
    disableSpace   : true,
    
    colsizing      : true,
    colmoving      : true,
    colsorting     : true,
    
    loadJML: function(x){
        this.jml = x;
        
        //Set Globals
        if (!self.jpf.debug) 
            jpf.debug = jpf.isTrue(x.getAttribute("debug"));
        if (x.getAttribute("debugtype")) 
            jpf.debugType = x.getAttribute("debugtype");
        jpf.debugFilter = jpf.isTrue(x.getAttribute("debug-teleport")) ? "" : "!teleport";
        
        this.name              = x.getAttribute("name") || "";
        this.disableRightClick = jpf.isTrue(x.getAttribute("disable-right-click"));
        this.allowSelect       = jpf.isTrue(x.getAttribute("allow-select"));
        
        this.autoDisableActions = jpf.isTrue(x.getAttribute("auto-disable-actions"));
        this.autoDisable        = !jpf.isFalse(x.getAttribute("auto-disable"));
        this.disableF5          = jpf.isTrue(x.getAttribute("disable-f5"));
        this.autoHideLoading    = !jpf.isFalse(x.getAttribute("auto-hide-loading"));
        
        this.disableSpace       = !jpf.isFalse(x.getAttribute("disable-space"));
        this.disableBackspace   = jpf.isTrue(x.getAttribute("disable-backspace"));
        
        if (jpf.hasDeskRun && this.disableF5) 
            shell.norefresh = true;
        
        //Datagrid options
        this.colsizing  = !jpf.isFalse(x.getAttribute("col-sizing"));
        this.colmoving  = !jpf.isFalse(x.getAttribute("col-moving"));
        this.colsorting = !jpf.isFalse(x.getAttribute("col-sorting"));
        
        if (x.getAttribute("layout")) 
            this.layout = x.getAttribute("layout");
        //jpf.windowManager.getForm(jmlParent.tagName == "Window" ? jmlParent.getAttribute("id") : "main").loadSettings(q);	
    }
}

/**
 * @constructor
 */
jpf.settings = function(){
    jpf.register(this, "settings", NOGUI_NODE);/** @inherits jpf.Class */
    var oSettings = this;
    
    /* ********************************************************************
     PROPERTIES
     *********************************************************************/
    this.inherit(jpf.DataBinding); /** @inherits jpf.DataBinding */
    /* ********************************************************************
     PUBLIC METHODS
     *********************************************************************/
    this.getSetting = function(name){
        return this[name];
    }
    
    this.setSetting = function(name, value){
        this.setProperty(name, value);
    }
    
    this.isChanged = function(name){
        if (!savePoint) 
            return true;
        return this.getSettingsNode(savePoint, name) != this[name];
    }
    
    this.exportSettings = function(instruction){
        if (!this.XMLRoot) 
            return;
        
        jpf.saveData(instruction, this.XMLRoot, function(data, state, extra){
            if (state != __HTTP_SUCCESS__) {
                if (state == __HTTP_TIMEOUT__ && extra.retries < jpf.maxHttpRetries) 
                    return extra.tpModule.retry(extra.id);
                else {
                    var commError = new Error(0, jpf.formatErrorString(0, oSettings, "Saving settings", "Error saving settings: " + extra.message));
                    if (oSettings.dispatchEvent("onerror", jpf.extend({
                        error: commError,
                        state: status
                      }, extra)) !== false) 
                        throw commError;
                    return;
                }
            }
        });
        
        this.savePoint();
    }
    
    this.importSettings = function(instruction, def_instruction){
        jpf.getData(instruction, null, function(xmlData, state, extra){
            if (state != __HTTP_SUCCESS__) {
                if (state == __HTTP_TIMEOUT__ && extra.retries < jpf.maxHttpRetries) 
                    return extra.tpModule.retry(extra.id);
                else {
                    var commError = new Error(0, jpf.formatErrorString(0, oSettings, "Loading settings", "Error loading settings: " + extra.message));
                    if (oSettings.dispatchEvent("onerror", jpf.extend({
                        error: commError,
                        state: status
                      }, extra)) !== false) 
                        throw commError;
                    return;
                }
            }
            
            if (!xmlData && def_instruction) 
                oSettings.importSettings(def_instruction);
            else 
                oSettings.load(xmlData);
        });
    }
    
    var savePoint;
    this.savePoint = function(){
        savePoint = XMLDatabase.copyNode(this.XMLRoot);
    }
    
    //Databinding
    this.smartBinding = true;//Hack to ensure that data is loaded, event without smartbinding
    this.__load = function(XMLRoot){
        XMLDatabase.addNodeListener(XMLRoot, this);
        
        for (var prop in settings) {
            this.setProperty(prop, null); //Maybe this should be !and-ed
            delete this[prop];
            delete settings[prop];
        }
        
        var nodes = this.XMLRoot.selectNodes(this.traverseRule || "node()[text()]");
        for (var i = 0; i < nodes.length; i++) {
            this.setProperty(this.applyRuleSetOnNode("name", nodes[i])
                || nodes[i].tagName, this.applyRuleSetOnNode("value", nodes[i])
                || getXmlValue(nodes[i], "text()"));
        }
    }
    
    this.__xmlUpdate = function(action, xmlNode, listenNode){
        //Added setting
        var nodes = this.XMLRoot.selectNodes(this.traverseRule || "node()[text()]");
        for (var i = 0; i < nodes.length; i++) {
            var name  = this.applyRuleSetOnNode("name", nodes[i]) || nodes[i].tagName;
            var value = this.applyRuleSetOnNode("value", nodes[i])
                || getXmlValue(nodes[i], "text()");
            if (this[name] != value) 
                this.setProperty(name, value);
        }
        
        //Deleted setting
        for (var prop in settings) {
            if (!this.getSettingsNode(this.XMLRoot, prop)) {
                this.setProperty(prop, null);
                delete this[prop];
                delete settings[prop];
            }
        }
    }
    
    this.reset = function(){
        if (!savePoint) return;

        this.load(XMLDatabase.copyNode(savePoint));
    }
    
    //Properties
    this.getSettingsNode = function(xmlNode, prop, create){
        if (!xmlNode) 
            xmlNode = this.XMLRoot;
        
        var nameNode  = this.getNodeFromRule("name", this.XMLRoot);
        var valueNode = this.getNodeFromRule("value", this.XMLRoot);
        nameNode      = nameNode ? nameNode.getAttribute("select") : "@name";
        valueNode     = valueNode ? valueNode.getAttribute("select") || "text()" : "text()";
        var traverse  = this.traverseRule + "[" + nameNode + "='" + prop + "']/"
            + valueNode || prop + "/" + valueNode;
        
        return create
            ? jpf.XMLDatabase.createNodeFromXpath(xmlNode, traverse)
            : jpf.getXmlValue(this.xmlNode, traverse);
    }
    
    this.handlePropSet = function(prop, value, force){
        if (!force && this.XMLRoot) 
            return jpf.XMLDatabase.setNodeValue(this.getSettingsNode(
                this.XMLRoot, prop, true), true);
        
        this[prop]     = value;
        settings[prop] = value;
    }
    
    //Init
    this.loadJML = function(x){
        this.importSettings(x.getAttribute("get"), x.getAttribute("default"));
        this.exportInstruction = x.getAttribute("set");
        
        this.jml = x;
        jpf.JMLParser.parseChildren(this.jml, null, this);
        
        //Model handling in case no smartbinding is used
        var modelId = jpf.XMLDatabase.getInheritedAttribute(x, "model");
        
        for (var i = 0; i < jpf.JMLParser.modelInit.length; i++) 
            if (jpf.JMLParser.modelInit[i][0] == this) 
                return;
        
        jpf.setModel(modelId, this);
    }
    
    //Destruction
    this.destroy = function(){
        if (this.exportInstruction) 
            this.exportSettings(this.exportInstruction);
    }
}
