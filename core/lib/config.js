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

//#ifdef __WITH_CONFIG

apf.config = new apf.Class().$init();
apf.extend(apf.config, {
    //Defaults
    disableRightClick  : false,
    allowSelect        : false,
    allowBlur          : true,
    autoDisableActions : true,
    autoDisable        : false, /** @todo fix this to only autodisable when createmodel is not true */
    disableF5          : true,
    autoHideLoading    : true,
    disableSpace       : true,
    defaultPage        : "home",
    disableBackspace   : true,
    undokeys           : false,
    outline            : false,
    dragOutline        : false,
    resizeOutline      : false,
    autoDisableNavKeys : true,
    disableTabbing     : false,
    resourcePath       : null,
    initdelay          : true,
    liveText           : false,
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
    //#ifdef __WITH_CONTENTEDITABLE
    x                  : "",
    y                  : "",
    w                  : "",
    h                  : "",
    
    snapcontainer      : true,
    snapelement        : true,
    snapguide          : true,
    snapgrid           : false,
    showgrid           : false,
    gridsize           : 10,
    
    $setGridSize       : function(value){
        if (value)
            this.gridsize = value;
        
        if (this.showgrid) {
            app.$int.style.backgroundImage = "url(images/grid/" + this.gridSize + ".gif)";
            app.$int.style.backgroundRepeat = "repeat";
        }
        else {
            app.$int.style.backgroundImage = "";
            app.$int.style.backgroundRepeat = "";
        }
    },
    //#endif
    skinset            : "default",
    name               : apf.isO3 ? "o3App" : self.window && window.location.href.replace(/[^0-9A-Za-z_]/g, "_"),

    tags               : {},
    defaults           : {},
    baseurl            : "",
    
    "model"            : "@default",
    "empty-message"    : "No items",
    "loading-message"  : "Loading...",
    "offline-message"  : "You are currently offline.",
    
    setDefaults : function(){
        //#ifdef __WITH_PARTIAL_AML_LOADING
        if (apf.isParsingPartial) {
            this.disableRightClick  = false;
            this.allowSelect        = true;
            this.autoDisableActions = true;
            this.autoDisable        = false;
            this.disableF5          = false;
            this.autoHideLoading    = true;
            this.disableSpace       = false;
            this.disableBackspace   = false;
            this.undokeys           = false;
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

    $handlePropSet : function(name, value){
        //this[name] = value;
        //@todo I dont want to go through all the code again, maybe later
        this[name.replace(/-(\w)/g, function(m, m1){
            return m1.toUpperCase()
        })] = this[name] = value;
        
        (this.$propHandlers && this.$propHandlers[name]
          || apf.GuiElement.propHandlers[name] || apf.K).call(this, value);
    },
    
    $inheritProperties : {},
    
    $propHandlers : {
        "baseurl" : function(value){
            this.baseurl = apf.parseExpression(value);
        },
        "language" : function(value){
            //#ifdef __WITH_LANG_SUPPORT
            apf.addEventListener("load", function(){
                apf.setModel(apf.config.language, apf.language);
            });
            //#endif
        },
        "resource-path" : function(value){
            this.resourcePath = apf.parseExpression(value || "")
              .replace(/resources\/?|\/$/g, '');
        },
        // #ifdef __WITH_IEPNGFIX
        "iepngfix" : function(value, x){
            this.iePngFix           = (!apf.supportPng24 
                && (apf.isTrue(value)
                || x.getAttribute("iepngfix-elements")));
            
            if (this.iePngFix) {
                // run after the init() has finished, otherwise the body of the 
                // document will still be empty, thus no elements found.
                $setTimeout(function() {
                    apf.iepngfix.limitTo(x.getAttribute("iepngfix-elements") || "").run();
                });
            }
        },
        // #endif
        //#ifdef __WITH_PRESENTATION
        "skinset" : function(value) {
            if (this.$amlLoaded)
                apf.skins.changeSkinset(value);
        },
        //#endif
        //#ifdef __WITH_INTERACTIVE
        "outline" : function(value) {
            this.dragOutline    =
            this.resizeOutline  =
            this.outline        = apf.isTrue(value);
        },
        "drag-outline" : function(value){
            this.dragOutline    = value
              ? apf.isTrue(value)
              : false;
        },
        "resize-outline" : function(value){
            this.resizeOutline  = value
              ? !apf.isFalse(value)
              : false;
        },
        //#endif
        //#ifdef __WITH_AUTH
        "login" : function(value, x) {
            apf.auth.init(x);
        },
        //#endif
        //#ifdef __WITH_STORAGE
        "storage" : function(value) {
            if (value)
                apf.storage.init(value);
        },
        //#endif
        //#ifdef __WITH_OFFLINE
        "offline" : function(value){
            if (value && typeof apf.offline != "undefined")
                apf.offline.init(value);
        },
        //#endif
        //#ifdef __DESKRUN
        "disable-f5" : function(value){
            if (apf.isDeskrun && value)
                shell.norefresh = true;
        },
        //#endif
        //#ifdef __WITH_CONTENTEDITABLE
        "showgrid": function(value){
            this.$setGridSize();
        },
        "gridsize": function(value){
            this.$setGridSize(value);
        },
        //#endif
        "debug" : function(value) {
            //#ifdef __DEBUG
            if (value) {
                apf.$debugwin.activate();
                apf.addEventListener("load", function(){
                    //$setTimeout("apf.$debugwin.activate();", 200) //@todo has a bug in gecko, chrome
                    apf.removeEventListener("load", arguments.callee);
                });
            }
            //#endif
            apf.debug = value;
        }
    }
});

//#ifdef __WITH_HISTORY
if (apf.history)
    apf.addEventListener("load", function(){
        apf.history.init(apf.config.defaultPage, "page");
    });
//#endif

//#endif
