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
 * @attribute {Boolean} debug                   whether the debug screen is shown at startup.
 * @see core.jpf.object.debugwin
 * @see core.jpf.object.console
 * @attribute {Boolean} debug-teleport          whether teleport messages are displayed in the log.
 * @attribute {String}  name                    the name of the application, used by many different services to uniquely identify the application.
 * @attribute {Boolean} disable-right-click     whether a user can get the browsers contextmenu when the right mouse button is clicked.
 * @see element.contextmenu
 * @attribute {Boolean} allow-select            whether general text in the application can be selected.
 * @attribute {Boolean} allow-blur              whether it's possible to blur an element while not giving the focus to another element
 * @attribute {Boolean} auto-disable-actions    whether smartbinding actions are by default disabled.
 * @see term.action
 * @attribute {Boolean} auto-disable            whether elements that don't have content loaded are automatically disabled.
 * @attribute {Boolean} disable-f5              whether the F5 key for refreshing is disabled.
 * @attribute {Boolean} auto-hide-loading       whether the load screen defined j:loader is automatically hidden. Setting this to false enables you to control when the loading screen is hidden. Use the following code to do so:
 * <code>
 *  jpf.loadscreen.hide();
 * </code>
 * @attribute {Boolean} disable-space           whether the space button default behaviour of scrolling the page is disabled.
 * @attribute {Boolean} disable-backspace       whether the backspace button default behaviour of going to the previous history state is disabled.
 * @attribute {String}  default-page            the name of the default page if none is specified using the #. Defaults to "home". See {object.history}.
 * @see element.history
 * @attribute {Boolean} undokeys                whether the undo and redo keys (in windows they are ctrl-Z and ctrl-Y) are enabled.
 * @see element.actiontracker
 * @attribute {String, Boolean} outline         whether an outline of an element is shown while dragging or resizing.
 * @see baseclass.interactive
 * @attribute {String, Boolean} drag-outline    whether an outline of an element is shown while dragging.
 * @see baseclass.interactive
 * @attribute {String, Boolean} resize-outline  whether an outline of an element is shown while resizing.
 * @see baseclass.interactive
 * @attribute {String}  layout                  the {@link term.datainstruction data instruction} to retrieve the layout xml definition.
 * @see core.layout
 * @attribute {String}  baseurl                 the basepath for any relative url used throughout your application. This included teleport definitions and {@link term.datainstruction data instruction}.
 * @see teleport.http
 * @see term.datainstruction
 * @attribute {String}  loading-message         the global value for the loading message of elements during a loading state.
 * @see baseclass.databinding.attribute.loading-message
 * @attribute {String}  offline-message         the global value for the offline message of elements not able to display content while offline.
 * @see baseclass.databinding.attribute.offline-message
 * @attribute {String}  empty-message           the global value for the empty message of elements containing no contents.
 * @see baseclass.databinding.attribute.empty-message
 * @attribute {String}  model                   the default model for this application.
 * @see element.model
 * @attribute {String}  realtime                the global value whether bound values are realtime updated. When set to false elements do not update until they lose focus.
 * @see element.editor.attribute.realtime
 * @see element.textbox.attribute.realtime
 * @see element.slider.attribute.realtime
 * @attribute {String}  skinset                 the skin set used by the application.
 * @see baseclass.presentation.attribute.skinset
 * @attribute {String}  storage                 the {@link core.storage storage provider} to be used for key/value storage.
 * @see core.storage
 * @attribute {String}  offline                 the {@link core.storage storage provider} to be used for offline support.
 * @see element.offline
 * @attribute {String}  login                   the {@link term.datainstruction data instruction} which logs a user into the application.
 * @see element.auth
 * @attribute {String}  logout                  the {@link term.datainstruction data instruction} which logs a user out of the application.
 * @see element.auth
 * @attribute {String}  iepngfix                whether the fix for PNG images with transparency should be applied. Default is false.
 * @attribute {String}  iepngfix-elements       a comma-seperated list of CSS identifiers (classes) to which the transparent-PNG fix will be applied.
 * @attribute {Boolean} iphone-fullscreen       whether the application should cover the entire screen of the iPhone. Default is true.
 * @attribute {String}  iphone-statusbar        the style of the statusbar of the iPhone webbrowser. Posssible values: 'default', black-translucent' or 'black'.
 * @attribute {String}  iphone-icon             path pointing to the icon that should be used when this application is put on the iPhone Dashboard.
 * @attribute {Boolean} iphone-icon-is-glossy   whether the icon specified with 'iphone-icon' already is glossy or if the iPhone OS should apply that effect. Default is false.
 * @attribute {Boolean} iphone-fixed-viewport   whether the viewport of the application is fixed and whether the zoom should be enabled. Default is true.
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
    defaultPage        : "home",
    disableBackspace   : true,
    undokeys        : false,
    outline            : false,
    autoDisableNavKeys : true,
    dragOutline        : false,
    resizeOutline      : false,
    disableTabbing     : false,
    resourcePath       : null,
    initdelay          : true,
    // #ifdef __WITH_IEPNGFIX
    iePngFix           : false,
    // #endif
    // #ifdef __SUPPORT_IPHONE
    iphoneFullscreen   : true,
    iphoneStatusbar    : 'default', //other options: black-translucent, black
    iphoneIcon         : null,
    iphoneIconIsGlossy : false,
    iphoneFixedViewport: true,
    // #endif
    skinset            : "default",
    name               : "",

    tags               : {},
    defaults           : {},
    baseurl            : "",

    setDefaults : function(){
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
            this.undokeys        = false;
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
        if (this.$booleanProperties[name])
            value = jpf.isTrue(value);
        
        //this[name] = value;
        //@todo I dont want to go through all the code again, maybe later
        this[name.replace(/-(\w)/g, function(m, m1){
            return m1.toUpperCase()
        })] = this[name] = value;
        
        (this.$propHandlers && this.$propHandlers[name]
          || jpf.JmlElement.propHandlers[name] || jpf.K).call(this, value);
    },
    
    $supportedProperties : ["debug", "name", "baseurl", "resource-path", 
        "disable-right-click", "allow-select", "allow-blur", 
        "auto-disable-actions", "auto-disable", "disable-f5", 
        "auto-hide-loading", "disable-space", "disable-backspace", "undokeys", 
        "initdelay", "default-page", "query-append", "outline", "drag-outline", 
        "resize-outline", "resize-outline", "iepngfix", "iepngfix-elements", 
        "iphone-fullscreen", "iphone-statusbar", "iphone-icon", 
        "iphone-icon-is-glossy", "iphone-fixed-viewport", "layout", "skinset", 
        "language", "storage", "offline", "login"],
    $booleanProperties : {
        "debug":1,
        "disable-right-click":1,
        "allow-select":1,
        "allow-blur":1,
        "auto-disable-actions":1,
        "auto-disable":1,
        "disable-f5":1,
        "auto-hide-loading":1,
        "disable-space":1,
        "disable-backspace":1,
        "undokeys":1,
        "initdelay":1,
        "outline":1,
        "iepngfix":1,
        "iphone-fullscreen":1,
        "iphone-icon-is-glossy":1, 
        "iphone-fixed-viewport":1
    },
    $propHandlers : {
        "baseurl" : function(value){
            this.baseurl = jpf.parseExpression(value);
        },
        "resource-path" : function(value){
            this.resourcePath = jpf.parseExpression(value || "")
              .replace(/resources\/?|\/$/g, '');
        },
        // #ifdef __WITH_IEPNGFIX
        "iepngfix" : function(value, x){
            this.iePngFix           = (!jpf.supportPng24 
                && (jpf.isTrue(value)
                || x.getAttribute("iepngfix-elements")));
            
            if (this.iePngFix) {
                // run after the init() has finished, otherwise the body of the 
                // document will still be empty, thus no elements found.
                setTimeout(function() {
                    jpf.iepngfix.limitTo(x.getAttribute("iepngfix-elements") || "").run();
                });
            }
        },
        // #endif
        //#ifdef __WITH_PRESENTATION
        "skinset" : function(value) {
            if (!jpf.isParsing)
                jpf.skins.changeSkinset(value);
        },
        //#endif
        //#ifdef __WITH_INTERACTIVE
        "outline" : function(value) {
            this.dragOutline    =
            this.resizeOutline  =
            this.outline        = jpf.isTrue(jpf.parseExpression(value));
        },
        "drag-outline" : function(value){
            this.dragOutline    = value
              ? jpf.isTrue(jpf.parseExpression(value))
              : false;
        },
        "resize-outline" : function(value){
            this.resizeOutline  = value
              ? !jpf.isFalse(jpf.parseExpression(value))
              : false;
        },
        //#endif
        //#ifdef __WITH_AUTH
        "login" : function(value, x) {
            jpf.auth.init(x);
        },
        //#endif
        "debug" : function(value){
            //#ifdef __DEBUG
            if (value) {
                jpf.addEventListener("load", function(){
                    setTimeout("jpf.debugwin.activate();", 200) //@todo has a bug in gecko, chrome
                    jpf.removeEventListener("load", arguments.callee);
                });
            }
            //#endif
            jpf.debug = value;
        }
    },

    //@todo adhere to defaults (loop attributes)
    loadJml: function(x, parentNode){
        if (!this.$jml) {
            this.$jml = x;
            
            //#ifdef __WITH_JMLDOM_FULL
            this.parentNode = parentNode;
            jpf.implement.call(this, jpf.JmlDom); /** @inherits jpf.JmlDom */
            //#endif
        }
        
        var name, value, i, attr = x.attributes;
        for (i = 0, l = attr.length; i < l; i++) {
            a     = attr[i];
            value = a.nodeValue;
            name  = a.nodeName;
            //this.tags[nodes[i].nodeName] = nodes[i].nodeValue;
            
            if (this.$booleanProperties[name])
                value = jpf.isTrue(value);
            
            //this[name] = value;
            //@todo I dont want to go through all the code again, maybe later
            this[name.replace(/-(\w)/g, function(m, m1){
                return m1.toUpperCase()
            })] = this[name] = value;
            
            (this.$propHandlers && this.$propHandlers[name]
              || jpf.JmlElement.propHandlers[name] || jpf.K).call(this, value, x);
        }
        
        if (!jpf.loaded)
            this.init();

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
    },
    
    init : function(){
        if (!this.name)
            this.name = window.location.href.replace(/[^0-9A-Za-z_]/g, "_");
        
        // #ifdef __SUPPORT_IPHONE
        if (jpf.isIphone)
            jpf.runIphone();
        // #endif
        
        //#ifdef __DESKRUN
        if (jpf.isDeskrun && this.disableF5)
            shell.norefresh = true;
        //#endif
        
        //#ifdef __WITH_LANG_SUPPORT
        if (this.language)
            setTimeout("jpf.language.loadFrom(jpf.appsettings.language);");
        //#endif

        //#ifdef __WITH_STORAGE
        if (this.storage)
            jpf.storage.init(this.storage);
        //#endif

        //#ifdef __WITH_OFFLINE
        if (this.offline && typeof jpf.offline != "undefined")
            jpf.offline.init(this.offline);
        //#endif

        //#ifdef __WITH_BACKBUTTON
        jpf.addEventListener("done", function(){
            jpf.history.init(jpf.appsettings.defaultPage, "page");
        });
        //#endif
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
    this.implement(jpf.DataBinding); /** @inherits jpf.DataBinding */
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

                oError = new Error(jpf.formatErrorString(0,
                    oSettings, "Saving settings",
                    "Error saving settings: " + extra.message));

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
