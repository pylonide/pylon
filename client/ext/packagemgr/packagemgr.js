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
    var skin = require("text!ext/packagemgr/skin.xml");
    
    var npm = require("ext/packagemgr/sources/npm");
    
    module.exports = ext.register("ext/packagemgr/packagemgr", {
        name   : "Package Manager",
        dev    : "Ajax.org",
        alone  : true,
        type   : ext.GENERAL, 
        markup : markup,
        desp   : [panels],
        skin   : skin,
        
        nodes : [],
        
        localPackagesHashtable: {},
        localPackages: [],
        outdated: null,
        
        models: {
            installed: null,
            search: null
        },
        lists: {
            installed: null,
            search: null
        },
        
        hook : function() {
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
        
        /** Binds new data to the UI
         * @param {object} targetModel The model object that should be updated, this also covers visibility of the coupled UI elements
         * @param {object} model The data to be bound
         */
        bindModel: function(targetModel, model) {
            if (targetModel === this.models.installed) {
                model = this.enrichModelWithOutdated(model, this.outdated);
                
                if (this.outdated && this.outdated.length) {
                    var label = this.outdated.length === 1 ? "Update 1 package" : "Update " + this.outdated.length + " packages";
                    pacUpdateButton.setAttribute("caption", label);
                }
                else {
                    pacUpdateButton.setAttribute("caption", "All up to date");
                }
            }
            
            targetModel.load(JSON.stringify({
                "package": model
            }));
            
            // switch view
            this.lists.installed.setAttribute("visible", targetModel === this.models.installed);
            this.lists.search.setAttribute("visible", targetModel === this.models.search);
            
            // show / hide update button
            pacUpdateButton.setAttribute("visible", targetModel === this.models.installed);
        },
        
        init : function(amlNode) {
            var _self = this;
            
            // init controls
            _self.models.installed = mdlPacmanInstalled;
            _self.models.search = mdlPacmanSearchResult;
            
            _self.lists.installed = lstPacmanInstalled;
            _self.lists.search = lstPacmanSearchResult;
            
            npm.listPackages(function (model) {
                // make a hash table so we can quickly search the installed packages
                var pckgs = {};
                for (var ix = 0; ix < model.length; ix++) {
                    pckgs[model[ix].name] = model[ix];
                }
                _self.localPackagesHashtable = pckgs;
                _self.localPackages = model;
                
                _self.bindModel(_self.models.installed, model);
            }, function (outdated) {
                _self.outdated = outdated;
                
                if (_self.localPackages) {
                    _self.bindModel(_self.models.installed, _self.localPackages);
                }
            });
            
            pmSearch.addEventListener("click", function(e) {
                npm.search(tbPackQuery.value, function (model) {
                    _self.bindModel(_self.models.search, _self.mapSearchModel(tbPackQuery.value, model));
                });
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
        },
        
        enrichModelWithOutdated: function (model, outdated) {
            var outdatedHash = {};
            if (outdated !== null) {
                for (var oix = 0; oix < outdated.length; oix++) {
                    outdatedHash[outdated[oix].name] = outdated[oix];
                }
            }
            
            for (var ix = 0, item = model[ix]; ix < model.length; item = model[++ix]) {
                if (outdated === null) {
                    item.uptodate = "...";
                }
                else if (outdatedHash[item.name] && outdatedHash[item.name].newVersion) {
                    item.uptodate = "Version " + outdatedHash[item.name].newVersion + " available";
                    item.updateAvailable = 1;
                }
                else if (outdatedHash[item.name]) {
                    item.uptodate = "New version available";
                    item.updateAvailable = 1;
                }
                else {
                    item.uptodate = "Up to date";
                    item.updateAvailable = 0;
                }
            }
            
            return model;
        },
        
        mapSearchModel: function(qry, model) {
            var full = new RegExp("^" + qry + "$", "i");
            var starts = new RegExp("^" + qry, "i");
            var contains = new RegExp(qry, "i");
        
            function s(obj1, obj2) {
                var a = obj1.name,
                    b = obj2.name;
                if (full.test(a)) return -1;
                if (full.test(b)) return 1;
                if (starts.test(a)) return -1;
                if (starts.test(b)) return 1;
                if (contains.test(a)) return -1;
                if (contains.test(b)) return 1;
                return a > b;
            }
            model.sort(s);
            
            // now do disabling etc.
            for (var ix = 0; ix < model.length; ix++) {
                var item = model[ix];
                
                if (this.localPackagesHashtable[item.name]) {
                    item.installDisabled = true;
                    item.installLabel = "Already installed";
                } else {
                    item.installDisabled = false;
                    item.installLabel = "Install";
                }
            }
            
            return model;
        },
        
        /* UI callbacks */
        /** Install a package for the current active repo
         * @param {string} name The package identifier
         */
        install: function (name) {
            var _self = this;
            
            npm.install(name, function (body) {
                if (body.err) {
                    _self.errorHandler(body.err);
                }
                
                npm.listPackages(function (model) {                    
                    tbPackQuery.setAttribute("value", "");
                    _self.bindModel(_self.models.installed, model);
                });
            });
        },
        
        /** Deletes a package for the current active repo
         * @param {string} name The package identifier
         */        
        uninstall: function (name) {
            var _self = this;
            
            npm.uninstall(name, function (body) {
                if (body.err) {
                    _self.errorHandler(body.err);
                }
                npm.listPackages(function (model) {
                    _self.bindModel(_self.models.installed, model);
                });
            });
        },
        
        /** Updates all outdated packages
        */
        updateAll: function () {
            var _self = this;
            
            if (!_self.outdated || _self.outdated.length === 0) return;
            
            npm.update(function (body) {
                if (body.err) {
                    _self.errorHandler(body.err);
                }
                npm.listPackages(function (model) {
                    _self.bindModel(_self.models.installed, model);
                });
            });
        },
        
        /** Handles server side errors
         * @param {string} msg The message returned from the server in the body.err field
         */
        errorHandler: function (msg) {
            alert(msg);
        }
    });
});