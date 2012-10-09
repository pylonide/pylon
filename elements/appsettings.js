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
 * An element specifying the settings of the APF application.
 * @class apf.appsettings
 * @define appsettings
 * @logic
 * @inherits apf.AmlElement
 * @allowchild auth, authentication, offline, printer, defaults
 * 
 */
// @todo describe defaults
/**
 * @attribute {Boolean} debug                   Sets or gets whether the debug screen is shown at startup.
 * 
 */
/**
 * @attribute {String}  name                    Sets or gets the name of the application; used by many different services to uniquely identify the application.
 */
/**
 * @attribute {Boolean} disable-right-click     Sets or gets whether a user can get the browser's contextmenu when the right mouse button is clicked.
 * @see apf.contextmenu
 */
/**
 * @attribute {Boolean} allow-select            Sets or gets whether general text in the application can be selected.
 */
/**
 * @attribute {Boolean} allow-blur              Sets or gets whether its possible to blur an element while not giving the focus to another element. Defaults to `true`.
 */
/**
 * @attribute {Boolean} auto-disable-actions    Sets or gets whether smartbinding actions are by default disabled.
 * @see term.action
 */
/**
 * @attribute {Boolean} auto-disable            Sets or gets whether elements that don't have content loaded are automatically disabled.
 */
/**
 * @attribute {Boolean} disable-f5              Sets or gets whether the F5 key for refreshing is disabled.
 */
/**
 * @attribute {Boolean} auto-hide-loading       Sets or gets whether the load screen defined by the loader element is automatically hidden. Setting this to `false` enables you to control when the loading screen is hidden. 
 * 
 * The following code shows how this can be done:
 *
 * ```javascript
 *  apf.document.getElementsByTagName("a:loader")[0].hide()
 *  //or
 *  loaderId.hide()
 * ```
 */
/**
 * @attribute {Boolean} disable-space           Sets or gets whether the space button default behavior of scrolling the page is disabled.
 */
/**
 * @attribute {Boolean} disable-backspace       Sets or gets whether the backspace button default behavior of going to the previous history state is disabled.
 */
/**
 * @attribute {String}  default-page            Sets or gets the name of the default page if none is specified using the `#`. Defaults to `"home"`.
 * @see apf.history
 */
/**
 * @attribute {Boolean} undokeys                Sets or gets whether the undo and redo keyboard bindings are enabled.
 * @see apf.actiontracker
 */
/**
 * @attribute {String | Boolean} outline         Sets or gets whether an outline of an element is shown while dragging or resizing.
 * @see apf.Interactive
 */
/**
 * @attribute {String | Boolean} drag-outline    Sets or gets whether an outline of an element is shown while dragging.
 * @see apf.Interactive
 */
/**
 * @attribute {String | Boolean} resize-outline  Sets or gets whether an outline of an element is shown while resizing.
 * @see apf.Interactive
 */
/**
 * @attribute {String}  baseurl                 Sets or gets the basepath for any relative url used throughout your application. This included teleport definitions and {@link term.datainstruction data instructions}.
 * 
 */
/**
 * @attribute {String}  loading-message         Sets or gets the global value for the loading message of elements during a loading state.
 * @see apf.DataBinding.loading-message
 */
/**
 * @attribute {String}  offline-message         Sets or gets the global value for the offline message of elements not able to display content while offline.
 * @see apf.DataBinding.offline-message
 */
/**
 * @attribute {String}  empty-message           Sets or gets the global value for the empty message of elements containing no contents.
 * @see apf.DataBinding.empty-message
 */
/**
 * @attribute {String}  model                   Sets or gets the default model for this application.
 * @see apf.model
 */
/**
 * @attribute {String}  realtime                Sets or gets the global value whether bound values are updated realtime. When set to `false`, elements do not update until they lose focus.
 * 
 */
/**
 * @attribute {String}  skinset                 Sets or gets the skin set used by the application.
 * @see apf.Presentation.skinset
 */
/**
 * @attribute {String}  storage                 Sets or gets the storage provider to be used for key/value storage.
 * 
 */
/**
 * @attribute {String}  offline                 Sets or gets the storage provider to be used for offline support.
 * 
 */
/**
 * @attribute {String}  login                   Sets or gets the {@link term.datainstruction data instruction} which logs a user into the application.
 * 
 */
/**
 * @attribute {String}  logout                  Sets or gets the {@link term.datainstruction data instruction} which logs a user out of the application.
 * 
 */
/**
 * @attribute {String}  iepngfix                Sets or gets whether the fix for PNG images with transparency should be applied. Default is `false`.
 */
/**
 * @attribute {String}  iepngfix-elements       Sets or gets a comma-seperated list of CSS identifiers (classes) to which the transparent-PNG fix will be applied.
 */
/**
 * @attribute {Boolean} iphone-fullscreen       Sets or gets whether the application should cover the entire screen of the iPhone. Default is ztruez.
 */
/**
 * @attribute {String}  iphone-statusbar        Sets or gets the style of the statusbar of the iPhone webbrowser. Posssible values: `'default'`, `'black-translucent'` or `'black'`.
 */
/**
 * @attribute {String}  iphone-icon             Sets or gets path pointing to the icon that should be used when this application is put on the iPhone Dashboard.
 */
/**
 * @attribute {Boolean} iphone-icon-is-glossy   Sets or gets whether the icon specified with 'iphone-icon' already is glossy or if the iPhone OS should apply that effect. Default is `false`.
 */
/**
 * @attribute {Boolean} iphone-fixed-viewport   Sets or gets whether the viewport of the application is fixed and whether the zoom should be enabled. Default is `true`.
 */
apf.appsettings = function(struct, tagName){
    this.$init(tagName || "appsettings", apf.NODE_HIDDEN, struct);
};

(function(){
    this.$parsePrio = "001";
    
    //1 = force no bind rule, 2 = force bind rule
    this.$attrExcludePropBind = {
        language : 1,
        login    : 1,
        logout   : 1
    };
    
    this.$supportedProperties = ["debug", "name", "baseurl", "resource-path", 
        "disable-right-click", "allow-select", "allow-blur", 
        "auto-disable-actions", "auto-disable", "disable-f5", 
        "auto-hide-loading", "disable-space", "disable-backspace", "undokeys", 
        "initdelay", "default-page", "query-append", "outline", "drag-outline", 
        "resize-outline", "resize-outline", "iepngfix", "iepngfix-elements", 
        "iphone-fullscreen", "iphone-statusbar", "iphone-icon", 
        "iphone-icon-is-glossy", "iphone-fixed-viewport", "skinset", 
        "language", "storage", "offline", "login"];
    this.$booleanProperties = {
        //#ifdef __WITH_CONTENTEDITABLE
        snapcontainer : 1,
        snapelement   : 1,
        snapguide     : 1,
        snapgrid      : 1,
        showgrid      : 1,
        //#endif
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
    };
    
    var $setProperty = this.setProperty;
    this.setProperty = function(prop, value, forceOnMe, setAttr, inherited){
        if (inherited != 2)
            $setProperty.apply(this, arguments);
    }
    
    this.$handlePropSet = function(prop, value, force){
        if (this.$booleanProperties[prop])
            value = apf.isTrue(value);

        this[prop] = value;

        apf.config.setProperty(prop, value);
    };
    
    this.addEventListener("DOMNodeInsertedIntoDocument", function(e){
        // #ifdef __SUPPORT_IPHONE
        if (apf.isIphone && apf.runIphone) {
            //@todo apf3.0 mike please error check all the settings
            
            apf.runIphone();
            delete apf.runIphone;
        }
        // #endif
    });
}).call(apf.appsettings.prototype = new apf.AmlElement());

apf.aml.setElement("appsettings", apf.appsettings);
//#endif