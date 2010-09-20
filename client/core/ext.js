/**
 * Extension manager for the Ajax.org Cloud IDE
 *
 * Modules that extend the functionality of the editing environment
 * - Add menubuttons/menus
 * - Add items to menus (optional show/hide toggle)
 * - Add toolbar (optional show/hide toggle)
 * - Add buttons to toolbar (optional show/hide toggle)
 * - Add custom non-file tree items
 * - Register an editor to the application for file extensions
 * - Add features to existing editors
 * - Add AML elements
 * - Add layout modes
 */
require.def("core/ext", ["core/ide", "core/util"], function(ide, util) {

ide.addEventListener("keybindingschange", function(e) {
    ext.updateKeybindings(e.keybindings.ext);
});

var ext;
return ext = {
    //Extension types
    GENERAL       : 1,
    LAYOUT        : 2,
    
    defLength     : 2,

    extHandlers   : {},
    extensions    : [],
    extLut        : {},
    typeLut       : {
        1 : "General",
        2 : "Layout"
    },

    currentLayoutMode : null,
    
    addType : function(defName, regHandler, unregHandler){
        this[defName.toUpperCase()] = ++this.defLength;
        this.extHandlers[this.defLength] = {
            register : regHandler,
            unregister : unregHandler
        };
        this.typeLut[this.defLength] = defName;
    },

    register : function(path, oExtension, force){
        if (oExtension.registered)
            return oExtension;

        if (!mdlExt.queryNode("plugin[@path='" + path + "']"))
            mdlExt.appendXml('<plugin type="' + this.typeLut[oExtension.type]
                + '" name="' + (oExtension.name || "") + '" path="' + path
                + '" dev="' + (oExtension.dev || "") + '" enabled="1" />');
        else
            mdlExt.setQueryValue("plugin[@path='" + path + "']/@enabled", 1);

        //Don't init general extensions that cannot live alone
        if (!force && oExtension.type == this.GENERAL && !oExtension.alone) {
            oExtension.path = path;
            return oExtension;
        }

        oExtension.registered = true;
        oExtension.path       = path;

        switch(oExtension.type) {
            case this.GENERAL:
                if (!oExtension.hook)
                    this.initExtension(oExtension);

                //@todo
                //if (!this.currentEditor)
                    //oExtension.disable();
            break;
            case this.LAYOUT:
                oExtension.$layoutItem = ddModes.appendChild(new apf.item({
                    value   : path,
                    caption : oExtension.name
                }));
            break;
            default:
                this.extHandlers[oExtension.type].register(oExtension);
            break;
        }

        this.extLut[path] = oExtension;
        this.extensions.push(oExtension);

        if (oExtension.hook)
            oExtension.hook();

        return oExtension;
    },

    unregister : function(oExtension, silent){
        //Check exts that depend on oExtension
        var using = oExtension.using;
        if (using) {
            var inUseBy = [];
            for (var use, i = 0, l = using.length; i < l; i++) {
                if ((use = using[i]).registered)
                    inUseBy.push(use.path);
            }

            if (inUseBy.length) {
                //@todo move this to outside this function
                if (!silent)
                    util.alert(
                        "Could not disable extension",
                        "Extension is still in use",
                        "This extension cannot be disabled, because it is still in use by the following extensions:<br /><br />"
                        + " - " + inUseBy.join("<br /> - ")
                        + "<br /><br /> Please disable those extensions first.");
                return;
            }
        }

        delete oExtension.registered;
        this.extensions.remove(oExtension);
        delete this.extLut[oExtension.path];

        //Check deps to clean up
        var deps = oExtension.deps;
        if (deps) {
            for (var dep, i = 0, l = deps.length; i < l; i++) {
                dep = deps[i];
                if (dep.registered && dep.type == this.GENERAL && !oExtension.alone)
                    this.unregister(dep, true);
            }
        }

        switch(oExtension.type) {
            case this.GENERAL:

            break;
            case this.LAYOUT:
                oExtension.$layoutItem.destroy(true, true);
            break;
            default:
                this.extHandlers[oExtension.type].unregister(oExtension);
            break;
        }

        mdlExt.setQueryValue("plugin[@path='" + oExtension.path + "']/@enabled", 0);

        if (oExtension.inited) {
            oExtension.destroy();
            delete oExtension.inited;
        }
    },

    updateKeybindings: function(o) {
        this.currentKeybindings = o;

        var i, j, l, name, ext, hotkey, bindings, item, val;
        for (i in this.extLut) {
            name     = i.substr(i.lastIndexOf("/") + 1).toLowerCase();
            bindings = o[name];
            ext      = this.extLut[i];
            if (!bindings || !ext.hotkeys) continue;
            for (hotkey in ext.hotkeys) {
                if ((val = ext.hotkeys[hotkey]) !== 1)
                    apf.hotkeys.remove(val);
                ext.hotkeys[hotkey] = bindings[hotkey];
                for (j = 0, l = ext.hotitems.length; j < l; ++j) {
                    item = ext.hotitems[i];
                    if (item.hotkey == val)
                        item.setAttribute("hotkey", bindings[hotkey]);
                }
                apf.hotkeys.register(bindings[hotkey], ext[hotkey]);
            }
            //if (typeof ext.onKeybindingsChange == "function")
            //    ext.onKeybindingsChange(bindings[hotkey]);
        }
    },

    initExtension : function(oExtension, amlParent){
        if (oExtension.inited)
            return;

        //Load markup
        var markup = oExtension.markup;
        if (markup)
            apf.document.body.insertMarkup(markup);

        var deps = oExtension.deps;
        if (deps) {
            deps.each(function(dep){
                if (!dep.registered)
                    ext.register(dep.path, dep, true);

                (dep.using || (dep.using = [])).pushUnique(oExtension);
            });
        }

        if (this.currentKeybindings) {
            var name        = oExtension.path.substr(oExtension.path.lastIndexOf("/") + 1),
                keyBindings = this.currentKeybindings[name];
            if (keyBindings)
                oExtension.currentKeybindings = keyBindings;
        }

        oExtension.init(amlParent);
        oExtension.inited = true;
        
        ide.dispatchEvent("init." + oExtension.path, {
            ext : oExtension
        });
    },

    setLayoutMode : function(mode){
        if (this.currentLayoutMode)
            this.currentLayoutMode.disable();

        var module = this.extLut[mode];
        if (!module) {
            this.currentLayoutMode = null;
            return false;
        }

        if (!module.inited)
            this.initExtension(module);

        module.enable();
        this.currentLayoutMode = module;
    }
};

});