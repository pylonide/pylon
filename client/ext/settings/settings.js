/**
 * Extension Manager for the Ajax.org Cloud IDE
 */
require.def("ext/settings/settings",
    ["core/ide", "core/ext", "core/util", "ext/filesystem/filesystem", "text!ext/settings/settings.xml"],
    function(ide, ext, util, fs, markup) {
        
return ext.register("ext/settings/settings", {
    name   : "Settings",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    
    nodes : [],
    
    hook : function(){
        var _self = this;
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Settings",
                onclick : function(){
                    ext.initExtension(_self);
                    winSettings.show();
                }
            }), ide.mnuFile.childNodes[ide.mnuFile.childNodes.length - 2])
        );
        
        this.model = new apf.model();
        this.model.load("ext/settings/template.xml");
        
        this.$timer = setInterval(function(){
            if (ide.dispatchEvent("savesettings", {
                model : _self.model
            }) === true)
                _self.save();
        }, 6000); //60000
        
        ide.dispatchEvent("loadsettings", {
            model : this.model
        });
        
        ide.addEventListener("$event.loadsettings", function(callback){
            callback({model: _self.model});
        });
    },
    
    save : function(){
        //@todo save to disk
        apf.console.log("SAVING SETTINGS");
    },
    
    addSection : function(name, xpath){
        var id = "pgSettings" + name.replace(/ /g, "_");
        mdlSettings.appendXml('<section name="' + name +'" page="' + id + '" />', xpath);
        return pgSettings.add(name, id);
    },
    
    init : function(amlNode){
        
    },
    
    enable : function(){
        this.nodes.each(function(item){
            item.enable();
        });
    },
    
    disable : function(){
        this.nodes.each(function(item){
            item.disable();
        });
    },
    
    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    }
});

    }
);