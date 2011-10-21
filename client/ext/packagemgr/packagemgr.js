/**
 * Package Manager for Cloud9
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
 
define(function(require, exports, module) {

    var ide = require("core/ide");
    var ext = require("core/ext");
    var util = require("core/util");
    var markup = require("text!ext/packagemgr/packagemgr.xml");
    var panels = require("ext/panels/panels");
    
    var npm = require("ext/packagemgr/sources/npm");
    
    module.exports = ext.register("ext/packagemgr/packagemgr", {
        name   : "Package Manager",
        dev    : "Ajax.org",
        alone  : true,
        type   : ext.GENERAL, 
        markup : markup,
        desp   : [panels],
        
        nodes : [],
        
        localPackages: [],
        
        hook : function(){
            var _self = this;
            this.nodes.push(
                mnuWindows.insertBefore(new apf.divider(), mnuWindows.firstChild),
                
                mnuWindows.insertBefore(new apf.item({
                    caption : "Package Manager...",
                    onclick : function(){
                        ext.initExtension(_self);
                        winPack.show();
                    }
                }), mnuWindows.firstChild)
            );
        },
        
        bindModel: function(model) {
            mdlPackageMgr.load(JSON.stringify({
                "package": model
            }));
        },
        
        init : function(amlNode){
            var _self = this;
            
            npm.listPackages(function (model) {
                _self.bindModel(model);
                _self.localPackages = model;
            });
            
            pmSearch.addEventListener("click", function(e) {
                npm.search(tbPackQuery.value, _self.bindModel);
            });
        },
        
        enable : function(){
            if (!this.disabled) return;
            
            this.nodes.each(function(item){
                item.enable();
            });
            this.disabled = false;
        },
        
        disable : function(){
            if (this.disabled) return;
            
            this.nodes.each(function(item){
                item.disable();
            });
            this.disabled = true;
        },
        
        destroy : function(){
            this.nodes.each(function(item){
                item.destroy(true, true);
            });
            this.nodes = [];
        }
    });
});