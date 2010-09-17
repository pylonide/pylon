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
 * @see core.apf.object.debugwin
 * @see core.apf.object.console
 * @attribute {String}  name                    the name of the application, used by many different services to uniquely identify the application.
 * @attribute {Boolean} disable-right-click     whether a user can get the browsers contextmenu when the right mouse button is clicked.
 * @see element.contextmenu
 * @attribute {Boolean} allow-select            whether general text in the application can be selected.
 * @attribute {Boolean} allow-blur              whether it's possible to blur an element while not giving the focus to another element. Defaults to true.
 * @attribute {Boolean} auto-disable-actions    whether smartbinding actions are by default disabled.
 * @see term.action
 * @attribute {Boolean} auto-disable            whether elements that don't have content loaded are automatically disabled.
 * @attribute {Boolean} disable-f5              whether the F5 key for refreshing is disabled.
 * @attribute {Boolean} auto-hide-loading       whether the load screen defined by the loader element is automatically hidden. Setting this to false enables you to control when the loading screen is hidden. Use the following code to do so:
 * <code>
 *  apf.document.getElementsByTagName("a:loader")[0].hide()
 *  //or
 *  loaderId.hide()
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