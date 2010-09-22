/**
 * Extension Manager for the Ajax.org Cloud IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
require.def("ext/settings/settings",
    ["core/ide", "core/ext", "core/util", "ext/filesystem/filesystem", 
     "text!ext/settings/settings.xml", "text!ext/settings/template.xml"],
    function(ide, ext, util, fs, markup, template) {
        
return ext.register("ext/settings/settings", {
    name   : "Settings",
    dev    : "Ajax.org",
    alone  : true,
    type   : ext.GENERAL, 
    markup : markup,
    file   : "/workspace/.settings.xml",
    
    nodes : [],
    
    save : function(){
        //@todo save to disk
        //apf.console.log("SAVING SETTINGS");
        fs.saveFile(this.file, this.model.data && apf.xmldb.cleanXml(this.model.data.xml) || "");
    },
    
    addSection : function(name, xpath){
        var id = "pgSettings" + name.replace(/ /g, "_");
        this.model.appendXml('<section name="' + name +'" page="' + id + '" />', xpath);
        return pgSettings.add(name, id);
    },
    
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
        /*fs.readFile(_self.file, function(data, state, extra){
            if (state != apf.SUCCESS)
                _self.model.load(template);
            else
                _self.model.load(data);
            
            ide.dispatchEvent("loadsettings", {
                model : _self.model
            });
        });*/
        this.model.load(
            ide.settings && ide.settings.indexOf("d:error") > -1
              ? template
              : ide.settings);
        ide.dispatchEvent("loadsettings", {
            model : _self.model
        });
        
        this.$timer = setInterval(function(){
            if (ide.dispatchEvent("savesettings", {
                model : _self.model
            }) === true)
                _self.save();
        }, 6000); //60000
        
        ide.addEventListener("$event.loadsettings", function(callback){
            callback({model: _self.model});
        });
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