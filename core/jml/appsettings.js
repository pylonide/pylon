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
    
    tags           : {},
    
    loadJML: function(x){
        this.jml = x;
        
        //Set Globals
        if (!jpf.debug) 
            jpf.debug = jpf.isTrue(x.getAttribute("debug"));
        if (x.getAttribute("debug-type")) 
            jpf.debugType = x.getAttribute("debug-type");

        var nodes = x.attributes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            this.tags[nodes[i].nodeName] = nodes[i].nodeValue;
        }

        jpf.debugFilter = jpf.isTrue(x.getAttribute("debug-teleport")) ? "" : "!teleport";
        
        if (jpf.debug) {
            jpf.addEventListener("onload", function(){
                jpf.debugwin.activate();
            });
        }
        
        this.name               = x.getAttribute("name") 
            || window.location.href.replace(/[^0-9A-Za-z_]/g, "_");

        this.disableRightClick  = jpf.isTrue(x.getAttribute("disable-right-click"));
        this.allowSelect        = jpf.isTrue(x.getAttribute("allow-select"));
        
        this.autoDisableActions = jpf.isTrue(x.getAttribute("auto-disable-actions"));
        this.autoDisable        = !jpf.isFalse(x.getAttribute("auto-disable"));
        this.disableF5          = jpf.isTrue(x.getAttribute("disable-f5"));
        this.autoHideLoading    = !jpf.isFalse(x.getAttribute("auto-hide-loading"));
        
        this.disableSpace       = !jpf.isFalse(x.getAttribute("disable-space"));
        this.disableBackspace   = jpf.isTrue(x.getAttribute("disable-backspace"));
        
        //#ifdef __DESKRUN
        if (jpf.isDeskrun && this.disableF5) 
            shell.norefresh = true;
        //#endif
        
        //Datagrid options
        this.colsizing  = !jpf.isFalse(x.getAttribute("col-sizing"));
        this.colmoving  = !jpf.isFalse(x.getAttribute("col-moving"));
        this.colsorting = !jpf.isFalse(x.getAttribute("col-sorting"));
        
        //Application features
        this.layout  = x.getAttribute("layout") || null;
        
        //#ifdef __WITH_STORAGE
        this.storage = x.getAttribute("storage") || null;
        if (this.storage)
            jpf.storage.init(this.storage);
        //#endif
        
        //#ifdef __WITH_OFFLINE
            //#ifdef __DEBUG
            jpf.all.each(function(item){
                if (item.nodeType == GUI_NODE) {
                    throw new Error(jpf.formatErrorString(0, this, 
                        "Reading settings", 
                        "You have places the j:appsettings tag below a GUI \
                         component. This will cause the offline functionality \
                         to work inconsistently. Place put the j:appsettings \
                         tag as the first tag in the body"));
                }
            });
            //#endif
            
        this.offline = x.getAttribute("offline") 
            || $xmlns(x, "offline", jpf.ns.jpf)[0];

        if (this.offline)
            jpf.offline.init(this.offline);
        //#endif
        
        //#ifdef __WITH_AUTH
        this.auth = $xmlns(x, "auth", jpf.ns.jpf)[0] 
            || $xmlns(x, "authentication", jpf.ns.jpf)[0];
        
        if (this.auth)
            jpf.auth.init(this.auth);
        else if (x.getAttribute("login"))
            jpf.auth.init(x);
        //#endif
    }
}

//#ifdef __WITH_SETTINGS

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
        
        jpf.saveData(instruction, this.XMLRoot, null, function(data, state, extra){
            if (state != jpf.SUCCESS) {
                var oError;
                
                //#ifdef __DEBUG
                oError = new Error(jpf.formatErrorString(0, 
                    oSettings, "Saving settings", 
                    "Error saving settings: " + extra.message));
                //#endif
                
                if (extra.tpModule.retryTimeout(extra, state, null, oError) === true)
                    return true;
                
                throw oError;
            }
        });
        
        this.savePoint();
    }
    
    this.importSettings = function(instruction, def_instruction){
        jpf.getData(instruction, null, null, function(xmlData, state, extra){
            if (state != jpf.SUCCESS) {
                var oError;
                
                //#ifdef __DEBUG
                oError = new Error(jpf.formatErrorString(0, oSettings, 
                    "Loading settings", 
                    "Error loading settings: " + extra.message));
                //#endif
                
                if (extra.tpModule.retryTimeout(extra, state, this, oError) === true)
                    return true;
                
                throw oError;
            }
            
            if (!xmlData && def_instruction) 
                oSettings.importSettings(def_instruction);
            else 
                oSettings.load(xmlData);
        });
    }
    
    var savePoint;
    this.savePoint = function(){
        savePoint = jpf.xmldb.copyNode(this.XMLRoot);
    }
    
    //Databinding
    this.smartBinding = true;//Hack to ensure that data is loaded, event without smartbinding
    this.__load = function(XMLRoot){
        jpf.xmldb.addNodeListener(XMLRoot, this);
        
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

        this.load(jpf.xmldb.copyNode(savePoint));
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
            ? jpf.xmldb.createNodeFromXpath(xmlNode, traverse)
            : jpf.getXmlValue(this.xmlNode, traverse);
    }
    
    this.handlePropSet = function(prop, value, force){
        if (!force && this.XMLRoot) 
            return jpf.xmldb.setNodeValue(this.getSettingsNode(
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
        var modelId = jpf.xmldb.getInheritedAttribute(x, "model");
        
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

//#endif