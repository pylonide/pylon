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

//#ifdef __WITH_APPSETTINGS

/**
 * Element specifying the settings of the application.
 * @define appsettings
 * @addnode global
 * @attribute {Boolean} debug                   whether the debug screen is shown and debug logging is enabled.
 * @attribute {Boolean} debug-teleport          whether teleport messages are displayed in the log.
 * @attribute {String}  name                    the name of the application, used by many different services to uniquely identify the application.
 * @attribute {Boolean} disable-right-click     whether a user can get the browsers contextmenu when the right mouse button is clicked.
 * @attribute {Boolean} allow-select            whether any text in the application can be selected.
 * @attribute {Boolean} allow-blur              whether it's possible to blur an element while not giving the focus to another element
 * @attribute {Boolean} auto-disable-actions    whether smartbinding actions are by default disabled.
 * @attribute {Boolean} auto-disable            whether elements that don't have content loaded are automatically disabled.
 * @attribute {Boolean} disable-f5              whether the F5 key for refreshing is disabled.
 * @attribute {Boolean} auto-hide-loading       whether the load screen defined j:loader is automatically hidden.
 * @attribute {Boolean} disable-space           whether the space button default behaviour of scrolling the page is disabled.
 * @attribute {Boolean} disable-backspace       whether the backspace button default behaviour of going to the previous history state is disabled.
 * @attribute {Boolean} undokeys                whether the undo and redo keys (in windows they are ctrl-Z and ctrl-Y) are enabled.
 * @attribute {String, Boolean} outline         whether an outline of an element is shown while dragging or resizing.
 * @attribute {String, Boolean} drag-outline    whether an outline of an element is shown while dragging.
 * @attribute {String, Boolean} resize-outline  whether an outline of an element is shown while resizing.
 * @attribute {String}  layout                  a datainstruction which retrieves a layout xml node or string
 * @attribute {String}  baseurl                 The basepath for any relative url used throughout your application. This included teleport definitions and data instrutions.
 * @attribute {String}  loading-message         Specifying the global value for the loading message of elements during a loading state.
 * @attribute {String}  offline-message         Specifying the global value for the offline message of elements not able to display content while offline.
 * @attribute {String}  empty-message           Specifying the global value for the empty message of elements containing no contents.
 * @attribute {String}  model                   Specifying the default model for this application.
 * @attribute {String}  realtime                Specifying the global value which enables or disabled realtime updating of bound data while changing the value. When set to false elements don't update until they loose focus.
 * @attribute {String}  skinset                 the skin set used by the application.
 * @attribute {String}  storage                 the storage provider to be used for key/value storage.
 * @attribute {String}  offline                 the storage provider to be used for offline support.
 * @attribute {String}  login                   the datainstruction which logs a user into the application.
 * @attribute {String}  logout                  the datainstruction which logs a user out of the application.
 * @attribute {String}  iepngfix                whether the fix for PNG images with transparency should applied
 * @allowchild auth, authentication, offline, printer, defaults
 * @todo describe defaults
 */
jpf.appsettings = {
    tagName            : "appsettings",
    nodeType           : jpf.NODE_ELEMENT,
    nodeFunc           : jpf.NODE_HIDDEN,

    //#ifdef __USE_TOSTRING
    toString : function(){
        return "[Element Node, <j:appsettings />]";
    },
    //#endif

    //Defaults
    disableRightClick  : false,
    allowSelect        : false,
    allowBlur          : false,
    autoDisableActions : false,
    autoDisable        : false, /** @todo fix this to only autodisable when createmodel is not true */
    disableF5          : true,
    autoHideLoading    : true,
    disableSpace       : true,
    disableBackspace   : true,
    useUndoKeys        : false,
    outline            : false,
    dragOutline        : false,
    resizeOutline      : false,
    disableTabbing     : false,
    resourcePath       : null,
    // #ifdef __WITH_IEPNGFIX
    iePngFix           : false,
    // #endif
    skinset            : "default",
    name               : "",

    tags               : {},
    defaults           : {},
    baseurl            : "",

    init : function(){
        //#ifdef __WITH_PARTIAL_JML_LOADING
        if (jpf.isParsingPartial) {
            this.disableRightClick  = false;
            this.allowSelect        = true;
            this.autoDisableActions = true;
            this.autoDisable        = false;
            this.disableF5          = false;
            this.autoHideLoading    = true;
            this.disableSpace       = false;
            this.disableBackspace   = false;
            this.useUndoKeys        = false;
            this.disableTabbing     = true;
            this.allowBlur          = true;
        }
        //#endif
    },

    getDefault : function(type, prop){
        var d = this.defaults[type];
        if (!d)
            return;

        for (var i = d.length - 1; i >= 0; i--) {
            if (d[i][0] == prop)
                return d[i][1];
        }
    },

    setProperty : function(name, value){
        if (name == "outline") {
            this.dragOutline   =
            this.resizeOutline =
            this.outline       = value;
        }
        //#ifdef __WITH_PRESENTATION
        else if (name == "skinset") {
            this.skinset = value;
            jpf.skins.changeSkinset(value);
        }
        //#endif
    },

    //@todo adhere to defaults (loop attributes)
    loadJml: function(x, parentNode){
        this.$jml = x;
        //#ifdef __WITH_JMLDOM_FULL

        this.parentNode = parentNode;
        jpf.inherit.call(this, jpf.JmlDom); /** @inherits jpf.JmlDom */
        //#endif

        //Set Globals
        jpf.debug = jpf.isTrue(x.getAttribute("debug"));
        if (x.getAttribute("debug-type"))
            jpf.debugType = x.getAttribute("debug-type");

        var nodes = x.attributes;
        for (var i = 0, l = nodes.length; i < l; i++) {
            this.tags[nodes[i].nodeName] = nodes[i].nodeValue;
        }

        //#ifdef __DEBUG
        jpf.debugFilter = jpf.isTrue(x.getAttribute("debug-teleport")) ? "" : "!teleport";

        if (jpf.debug) {
            jpf.addEventListener("load", function(){
                setTimeout("jpf.debugwin.activate();", 200) //@todo has a bug in gecko, chrome
            });
        }
        //#endif

        this.name               = x.getAttribute("name")
            || window.location.href.replace(/[^0-9A-Za-z_]/g, "_");

        this.baseurl            = jpf.parseExpression(x.getAttribute("baseurl") || "");
        this.resourcePath       = jpf.parseExpression(x.getAttribute("resource-path") || "").replace(/resources\/?/, '');
        if (this.resourcePath && this.resourcePath.charAt(this.resourcePath.length - 1) != "/")
            this.resourcePath   = this.resourcePath + "/";
        this.disableRightClick  = jpf.isTrue(x.getAttribute("disable-right-click"));
        this.allowSelect        = jpf.isTrue(x.getAttribute("allow-select"));
        this.allowBlur          = !jpf.isFalse(x.getAttribute("allow-blur"));

        this.autoDisableActions = jpf.isTrue(x.getAttribute("auto-disable-actions"));
        this.autoDisable        = jpf.isTrue(x.getAttribute("auto-disable")); //@todo temporarily changed default
        this.disableF5          = jpf.isTrue(x.getAttribute("disable-f5"));
        this.autoHideLoading    = !jpf.isFalse(x.getAttribute("auto-hide-loading"));

        this.disableSpace       = !jpf.isFalse(x.getAttribute("disable-space"));
        this.disableBackspace   = jpf.isTrue(x.getAttribute("disable-backspace"));
        this.useUndoKeys        = jpf.isTrue(x.getAttribute("undokeys"));

        //#ifdef __WITH_QUERYAPPEND
        this.queryAppend        = x.getAttribute("query-append");
        //#endif

        if (x.getAttribute("outline")) {
            this.dragOutline    =
            this.resizeOutline  =
            this.outline        = jpf.isTrue(jpf.parseExpression(x.getAttribute("outline")));
        }
        else {
            this.dragOutline    = x.getAttribute("drag-outline")
                ? jpf.isTrue(jpf.parseExpression(x.getAttribute("drag-outline")))
                : false;
            this.resizeOutline  = x.getAttribute("resize-outline")
                ? !jpf.isFalse(jpf.parseExpression(x.getAttribute("resize-outline")))
                : false;
        }

        // #ifdef __WITH_IEPNGFIX
        this.iePngFix           = (!jpf.supportPng24 
            && (jpf.isTrue(x.getAttribute("iepngfix"))
            || x.getAttribute("iepngfix-elements")));
        if (this.iePngFix) {
            // run after the init() has finished, otherwise the body of the 
            // document will still be empty, thus no elements found.
            setTimeout(function() {
                jpf.iepngfix.limitTo(x.getAttribute("iepngfix-elements") || "").run();
            });
        }
        // #endif

        //#ifdef __DESKRUN
        if (jpf.isDeskrun && this.disableF5)
            shell.norefresh = true;
        //#endif

        //Application features
        this.layout  = x.getAttribute("layout") || null;
        this.skinset = x.getAttribute("skinset") || "default";

        //#ifdef __WITH_STORAGE
        this.storage = x.getAttribute("storage") || null;
        if (this.storage)
            jpf.storage.init(this.storage);
        //#endif

        //#ifdef __WITH_OFFLINE
        this.offline = x.getAttribute("offline");
        if (this.offline && typeof jpf.offline != "undefined")
            jpf.offline.init(this.offline);
        //#endif

        //#ifdef __WITH_AUTH
        if (x.getAttribute("login"))
            jpf.auth.init(x);
        //#endif

        var oFor, attr, d, j, i, l, node, nodes = x.childNodes;
        for (i = 0, l = nodes.length; i < l; i++) {
            node = nodes[i];
            if (node.nodeType != 1)
                continue;

            var tagName = node[jpf.TAGNAME];
            switch(tagName){
                //#ifdef __WITH_AUTH
                case "auth":
                case "authentication":
                    this.auth = node;
                    jpf.auth.init(node);
                    break;
                //#endif
                //#ifdef __WITH_OFFLINE
                case "offline":
                    this.offline = node;
                    jpf.offline.init(node);
                    break;
                //#endif
                //#ifdef __WITH_PRINTER
                case "printer":
                    jpf.printer.init(node);
                    break;
                //#endif
                //#ifdef __WITH_APP_DEFAULTS
                case "defaults":
                    oFor = node.getAttribute("for");
                    attr = node.attributes;
                    d = this.defaults[oFor] = [];
                    for (j = attr.length - 1; j >= 0; j--)
                        d.push([attr[j].nodeName, attr[j].nodeValue]);
                    break;
                //#endif
                default:
                    break;
            }
        }

        return this;
    }
};
//#endif

//#ifdef __WITH_SETTINGS

/**
 * @constructor
 */
jpf.settings = function(){
    jpf.register(this, "settings", jpf.NODE_HIDDEN);/** @inherits jpf.Class */
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
    };

    this.setSetting = function(name, value){
        this.setProperty(name, value);
    };

    this.isChanged = function(name){
        if (!savePoint)
            return true;
        return this.getSettingsNode(savePoint, name) != this[name];
    };

    this.exportSettings = function(instruction){
        if (!this.xmlRoot)
            return;

        jpf.saveData(instruction, this.xmlRoot, null, function(data, state, extra){
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
    };

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
    };

    var savePoint;
    this.savePoint = function(){
        savePoint = jpf.xmldb.copyNode(this.xmlRoot);
    };

    //Databinding
    this.smartBinding = true;//Hack to ensure that data is loaded, event without smartbinding
    this.$load = function(XMLRoot){
        jpf.xmldb.addNodeListener(XMLRoot, this);

        for (var prop in settings) {
            this.setProperty(prop, null); //Maybe this should be !and-ed
            delete this[prop];
            delete settings[prop];
        }

        var nodes = this.xmlRoot.selectNodes(this.traverseRule || "node()[text()]");
        for (var i = 0; i < nodes.length; i++) {
            this.setProperty(this.applyRuleSetOnNode("name", nodes[i])
                || nodes[i].tagName, this.applyRuleSetOnNode("value", nodes[i])
                || getXmlValue(nodes[i], "text()"));
        }
    };

    this.$xmlUpdate = function(action, xmlNode, listenNode){
        //Added setting
        var nodes = this.xmlRoot.selectNodes(this.traverseRule || "node()[text()]");
        for (var i = 0; i < nodes.length; i++) {
            var name  = this.applyRuleSetOnNode("name", nodes[i]) || nodes[i].tagName;
            var value = this.applyRuleSetOnNode("value", nodes[i])
                || getXmlValue(nodes[i], "text()");
            if (this[name] != value)
                this.setProperty(name, value);
        }

        //Deleted setting
        for (var prop in settings) {
            if (!this.getSettingsNode(this.xmlRoot, prop)) {
                this.setProperty(prop, null);
                delete this[prop];
                delete settings[prop];
            }
        }
    };

    this.reset = function(){
        if (!savePoint) return;

        this.load(jpf.xmldb.copyNode(savePoint));
    };

    //Properties
    this.getSettingsNode = function(xmlNode, prop, create){
        if (!xmlNode)
            xmlNode = this.xmlRoot;

        var nameNode  = this.getNodeFromRule("name", this.xmlRoot);
        var valueNode = this.getNodeFromRule("value", this.xmlRoot);
        nameNode      = nameNode ? nameNode.getAttribute("select") : "@name";
        valueNode     = valueNode ? valueNode.getAttribute("select") || "text()" : "text()";
        var traverse  = this.traverseRule + "[" + nameNode + "='" + prop + "']/"
            + valueNode || prop + "/" + valueNode;

        return create
            ? jpf.xmldb.createNodeFromXpath(xmlNode, traverse)
            : jpf.getXmlValue(this.xmlNode, traverse);
    };

    this.$handlePropSet = function(prop, value, force){
        if (!force && this.xmlRoot)
            return jpf.xmldb.setNodeValue(this.getSettingsNode(
                this.xmlRoot, prop, true), true);

        this[prop]     = value;
        settings[prop] = value;
    };

    /**
     * @private
     */
    this.loadJml = function(x){
        this.importSettings(x.getAttribute("get"), x.getAttribute("default"));
        this.exportInstruction = x.getAttribute("set");

        this.$jml = x;
        jpf.JmlParser.parseChildren(this.$jml, null, this);

        //Model handling in case no smartbinding is used
        var modelId = jpf.xmldb.getInheritedAttribute(x, "model");

        for (var i = 0; i < jpf.JmlParser.modelInit.length; i++)
            if (jpf.JmlParser.modelInit[i][0] == this)
                return;

        jpf.setModel(modelId, this);
    };

    //Destruction
    this.destroy = function(){
        if (this.exportInstruction)
            this.exportSettings(this.exportInstruction);
    };
};

//#endif
