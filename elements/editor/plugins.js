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

// #ifdef __EDITOR || __INC_ALL

/**
 * @class Plugins
 * @contructor
 * @extends editor
 * @namespace jpf
 * @author Mike de Boer <mike@javeline.com>
 */
jpf.editor.Plugins = function(coll, editor) {
    /**
     * Add a plugin to the collection IF an implementation actually exists.
     *
     * @param {String} sPlugin The plugin identifier/ name
     * @type jpf.editor.Plugin
     */
    this.add = function(sPlugin) {
        if (!jpf.editor.Plugin[sPlugin]) return null;
        var plugin = new jpf.editor.Plugin[sPlugin](sPlugin);
        this.coll[plugin.name] = plugin;
        if (typeof plugin.keyBinding == "string") {
            plugin.keyBinding = {
                meta   : (plugin.keyBinding.indexOf('meta')  > -1),
                control: (plugin.keyBinding.indexOf('ctrl')  > -1),
                alt    : (plugin.keyBinding.indexOf('alt')   > -1),
                shift  : (plugin.keyBinding.indexOf('shift') > -1),
                key    : plugin.keyBinding.charAt(plugin.keyBinding.length - 1)
            };
            if (plugin.keyBinding.shift)
                plugin.keyBinding.key = plugin.keyBinding.key.toUpperCase();
        }
        return plugin;
    };
    
    /**
     * Check if an item is actually a plugin (more specific: an ENABLED plugin)
     * 
     * @param {String} name
     * @type Boolean
     */
    this.isPlugin = function(name) {
        return this.coll[name] ? true : false;
    };

    /**
     * API; Get a plugin object
     *
     * @param {String} name
     * @type Editor.Plugin
     */
    this.get = function(name) {
        if (arguments.length == 1)
            return this.coll[name] || null;
        var arg, ret = [];
        for (var i = 0, j = arguments.length; i < j; i++) {
            arg = arguments[i];
            if (this.coll[arg])
                ret.push(this.coll[arg]);
        }
        return ret;
    };

    /**
     * API; Get all plugins matching a specific plugin-type
     * 
     * @param {String} type
     * @type Array
     */
    this.getByType = function(type) {
        var res = [], item;
        for (var i in this.coll) {
            item = this.coll[i];
            if (item.type == type || item.subType == type)
                res.push(item);
        }
        return res;
    };

    /**
     * API; Get all plugins matching a specific Event hook
     * 
     * @param {String} hook
     * @type Array
     */
    this.getByHook = function(hook) {
        var res = [];
        for (var i in this.coll)
            if (this.coll[i].hook == hook)
                res.push(this.coll[i]);
        return res;
    };

    /**
     * Notify a plugin of any occuring Event, if it has subscribed to it
     *
     * @param {String} name
     * @param {String} hook
     * @type mixed
     */
    this.notify = function(name, hook) {
        var i, item;
        for (i in this.coll) {
            item = this.coll[i];
            if (item.name == name && item.hook == hook
              && !item.busy)
                return item.execute(this.editor, arguments);
        }
    };
    
    /**
     * Notify all plugins of an occuring Event
     *
     * @param {String} hook
     * @param {Event}  e
     * @type Array
     */
    this.notifyAll = function(hook, e) {
        var res = [], item;
        for (var i in this.coll) {
            item = this.coll[i];
            if (item.hook == hook && !item.busy)
                res.push(item.execute(this.editor, e));
        }
        return res;
    };

    /**
     * Notify all plugins of an occuring keyboard Event with a certain key combo
     *
     * @param {Object} keyMap
     * @type Array
     */
    this.notifyKeyBindings = function(keyMap) {
        var res = false, item;
        for (var i in this.coll) {
            item = this.coll[i];
            if (item.keyBinding && !item.busy
              && (keyMap.meta    == item.keyBinding.meta)
              && ((keyMap.control == item.keyBinding.control)
                 || (jpf.isMac && keyMap.meta == item.keyBinding.control))
              && (keyMap.alt     == item.keyBinding.alt)
              && (keyMap.shift   == item.keyBinding.shift)
              && (keyMap.key     == item.keyBinding.key)) {
                item.execute(this.editor, arguments);
                res = true;
            }
        }
        return res;
    };
    
    this.destroyAll = function() {
        for (var i in this.coll) {
            this.coll[i].$destroy();
            this.coll[i] = null;
            delete this.coll[i];
        }
    };

    /**
     * Initialize the Editor.Plugins class.
     * 
     * @param {Array} coll Collection of plugins that should be searched for and loaded
     * @param {Editor} editor
     * @type Editor.Plugins
     */
    this.editor = editor;
    this.coll   = {};
    //if (!coll || !coll.length) return;
    if (coll && coll.length) {
        for (var i = 0; i < coll.length; i++) {
            this.add(coll[i]);
        }
    }
};

jpf.editor.TOOLBARITEM   = "toolbaritem";
jpf.editor.TOOLBARBUTTON = "toolbarbutton";
jpf.editor.TOOLBARPANEL  = "toolbarpanel";
jpf.editor.TEXTMACRO     = "textmacro";
jpf.editor.CMDMACRO      = "commandmacro";

/**
 * @class Plugin
 * @contructor
 * @extends editor
 * @namespace jpf
 * @author Mike de Boer <mike@javeline.com>
 *
 * Example plugin:
 * <code language=javascript>
 * jpf.editor.plugin('sample', function() {
 *     this.name    = "SamplePluginName";
 *     this.type    = "PluginType";
 *     this.subType = "PluginSubType";
 *     this.hook    = "EventHook";
 *     this.params  = null;
 *
 *     this.execute = function(editor) {
 *         // code to be executed when the event hook is fired
 *     }
 *     // That's it! you can add more code below to your liking...
 * });
 * </code>
 */
jpf.editor.Plugin = function(sName, fExec) {
    jpf.editor.Plugin[sName] = function() {
        this.uniqueId = jpf.all.push(this) - 1;
        
        this.storeSelection = function() {
            if (this.editor)
                this.bookmark = this.editor.Selection.getBookmark('simple');
        };

        this.restoreSelection = function() {
            if (this.editor && jpf.isIE && this.bookmark)
                this.editor.Selection.moveToBookmark(this.bookmark);
        };

        this.dispatchEvent = function() {
            var _self = this;
            window.setTimeout(function() {
                if (_self.type == jpf.editor.CONTEXTPANEL
                  && _self.queryState(_self.editor) == jpf.editor.ON)
                    return;
                _self.state = jpf.editor.OFF;
                if (_self.editor)
                    _self.editor.notify(_self.name, _self.state);
                //@todo: add animation?
                jpf.popup.hide();
                jpf.popup.last = null;
            });

            return false;
        };

        this.$destroy = function() {
            jpf.popup.forceHide(); // @todo should we keep this, or does jpf.Popup destroy itself? what if we removeNode() the editor?
            this.buttonNode = this.editor = null;
            if (this.destroy)
               this.destroy();
        }

        fExec.apply(this, arguments);
    };
};

// #endif
