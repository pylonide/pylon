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

// #ifdef __JEDITOR || __INC_ALL

/**
 * @class Plugins
 * @constructor
 * @extends editor
 * @namespace jpf
 * @author Mike de Boer <mike@javeline.com>
 */
jpf.editor.plugins = function(coll, editor) {
    // the collections that are simple lookup tables so we don't need to use
    // for-loops to do plugin lookups...
    this.coll      = {};
    this.collHooks = {};
    this.collTypes = {};
    this.collKeys  = [];

    this.active    = null;

    /**
     * Add a plugin to the collection IF an implementation actually exists.
     *
     * @param {String} sPlugin The plugin identifier/ name
     * @type  {jpf.editor.plugin}
     */
    this.add = function(sPlugin) {
        if (!jpf.editor.plugin[sPlugin]) return null;
        // yay, plugin does exist, so we can instantiate it for the editor
        var plugin = new jpf.editor.plugin[sPlugin](sPlugin);
        // add it to main plugin collection
        this.coll[plugin.name] = plugin;

        if (plugin.type) {
            // a type prop is set, push it up the type-collection
            if (!this.collTypes[plugin.type])
                this.collTypes[plugin.type] = [];
            this.collTypes[plugin.type].push(plugin);
        }
        if (plugin.subType) {
            // a subType prop is set, push it up the type-collection
            if (!this.collTypes[plugin.subType])
                this.collTypes[plugin.subType] = [];
            this.collTypes[plugin.subType].push(plugin);
        }
        if (plugin.hook) {
            // a hook prop is set, push it up the event hooks-collection
            plugin.hook = plugin.hook.toLowerCase();
            if (!this.collHooks[plugin.hook])
                this.collHooks[plugin.hook] = [];
            this.collHooks[plugin.hook].push(plugin);
        }

        if (typeof plugin.keyBinding == "string") {
            // a keyBinding prop has been set, parse it and push it up the
            // keys-collection
            plugin.keyBinding = {
                meta   : (plugin.keyBinding.indexOf('meta')  > -1),
                control: (plugin.keyBinding.indexOf('ctrl')  > -1),
                alt    : (plugin.keyBinding.indexOf('alt')   > -1),
                shift  : (plugin.keyBinding.indexOf('shift') > -1),
                key    : plugin.keyBinding.charAt(plugin.keyBinding.length - 1).toLowerCase()
            };
            plugin.keyHash = createKeyHash(plugin.keyBinding);
            if (!this.collKeys[plugin.keyHash])
                this.collKeys[plugin.keyHash] = [];
            this.collKeys[plugin.keyHash].push(plugin);
        }
        return plugin;
    };

    /**
     * Check if an item is actually a plugin (more specific: an ENABLED plugin)
     *
     * @param {String}  name
     * @type  {Boolean}
     */
    this.isPlugin = function(name) {
        return this.coll[name] ? true : false;
    };

    /**
     * Check if a plugin is currently active, or being executed.
     *
     * @param {String}  name
     * @type  {Boolean}
     */
    this.isActive = function(name) {
        var o = this.get(name);
        if (!o) return false;

        var res = false;
        if (jpf.isArray(this.active)) {
            for (i = this.active.length - 1; i >= 0 && !res; i--)
                res = (this.active[i] === o);
        }
        else
            res = (this.active === o);
        return res;
    };

    /**
     * API; Get a plugin object
     *
     * @param {String} name
     * @type  {jpf.editor.plugin}
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
     * @type  {Array}
     */
    this.getByType = function(type) {
        if (this.collTypes[type] && this.collTypes[type].length)
            return this.collTypes[type];
        return [];
    };

    /**
     * API; Get all plugins matching a specific Event hook
     *
     * @param {String} hook
     * @type  {Array}
     */
    this.getByHook = function(hook) {
        if (this.collHooks[hook] && this.collHooks[hook].length)
            return this.collHooks[hook];
        return [];
    };

    /**
     * Notify a plugin of any occuring Event, if it has subscribed to it
     *
     * @param {String} name
     * @param {String} hook
     * @type  {mixed}
     */
    this.notify = function(name, hook) {
        var item = this.coll[name];
        if (item && item.hook == hook && !item.busy)
            return item.execute(this.editor, arguments);
        return null;
    };

    /**
     * Notify all plugins of an occuring Event
     *
     * @param {String} hook
     * @param {Event}  e
     * @type  {Array}
     */
    this.notifyAll = function(hook, e) {
        var res = [];
        if (!this.collHooks)
            return res;

        var coll = this.collHooks[hook];
        for (var i in coll) {
            if (!coll[i].busy && coll[i].execute)
                res.push(coll[i].execute(this.editor, e));
        }
        this.active = res.length ? res : res[0];
        return res;
    };

    /**
     * Notify all plugins of an occuring keyboard Event with a certain key combo
     *
     * @param {Object} keyMap
     * @type  {Array}
     */
    this.notifyKeyBindings = function(keyMap) {
        var hash = createKeyHash(keyMap);
        if (!this.collKeys[hash] || !this.collKeys[hash].length)
            return false;

        var coll = this.collKeys[hash];
        for (var i = 0, j = coll.length; i < j; i++)
            coll[i].execute(this.editor, arguments);
        this.active = coll.length ? coll : coll[0];

        return true;
    };

    /**
     * Turns an object of mapped keystrokes to a numeric representation.
     * Since ASCII numbers of character codes don't go above 255, we start
     * with 256 for modifier keys and shift bits around to the left until we
     * get a unique hash for each key combination.
     *
     * @param {Object} keyMap
     * @type  {Number}
     * @private
     */
    function createKeyHash(keyMap) {
        return (keyMap.meta ? 2048 : 0) | (keyMap.control ? 1024 : 0)
            |  (keyMap.alt  ? 512  : 0) | (keyMap.shift   ? 256  : 0)
            |  (keyMap.key || "").charCodeAt(0);
    }

    this.$destroy = function() {
        for (var i in this.coll) {
            this.coll[i].$destroy();
            this.coll[i] = null;
            delete this.coll[i];
        }
        this.coll = this.collHooks = this.collTypes = this.collKeys = null;
        delete this.coll;
        delete this.collHooks;
        delete this.collTypes;
        delete this.collKeys;
    };

    /*
     * Initialize the Editor.plugins class.
     *
     * @param {Array}  coll   Collection of plugins that should be searched for and loaded
     * @param {Editor} editor
     * @type  {jpf.editor.plugins}
     */
    this.editor = editor;
    if (coll && coll.length) {
        for (var i = 0; i < coll.length; i++)
            this.add(coll[i]);
    }
};

jpf.editor.TOOLBARITEM   = "toolbaritem";
jpf.editor.TOOLBARBUTTON = "toolbarbutton";
jpf.editor.TOOLBARPANEL  = "toolbarpanel";
jpf.editor.TEXTMACRO     = "textmacro";
jpf.editor.CMDMACRO      = "commandmacro";

/**
 * @class Plugin
 * @constructor
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
jpf.editor.plugin = function(sName, fExec) {
    jpf.editor.plugin[sName] = function() {
        this.uniqueId = jpf.all.push(this) - 1;

        /**
         * Save the selection - i.e. create a bookmark of the current selection - for
         * (re)use later.
         * @deprecated
         *
         * @see restoreSelection
         * @type {void}
         */
        this.storeSelection = function() {
            if (this.editor)
                this.bookmark = this.editor.selection.getBookmark('simple');
        };

        /**
         * Set the current selection/ active range to the bookmark that was saved earlier.
         * @deprecated
         *
         * @see storeSelection
         * @type {void}
         */
        this.restoreSelection = function() {
            if (this.editor && jpf.isIE && this.bookmark)
                this.editor.selection.moveToBookmark(this.bookmark);
        };

        /**
         * Appends a new JML element - in its string representation - to an
         * existing JML node. A new JML node will be created as specified by the
         * contents of sNode and appended to oParent.
         *
         * @param {String}  sNode
         * @param {JmlNode} oParent
         * @type  {JmlNode}
         */
        this.appendJmlNode = function(sNode, oParent) {
            if (!sNode) return null;

            var oNode = jpf.document.createElement(sNode);
            jpf.document.documentElement.appendChild(oNode);

            if (oParent && oNode.oExt)
                oParent.appendChild(oNode.oExt);

            return oNode;
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
            delete this.buttonNode;
            delete this.editor;
            if (this.destroy)
               this.destroy();
        }

        fExec.apply(this, arguments);
    };
};

// #endif
