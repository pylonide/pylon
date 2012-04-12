/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var editors = require("ext/editors/editors");
var markup = require("text!ext/gotofile/gotofile.xml");
var search = require('ext/gotofile/search');
var settings = require("core/settings");

module.exports = ext.register("ext/gotofile/gotofile", {
    name    : "Go To File",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : markup,
    offline : false,
    commands : {
        "_gotofilelegacy": {hint: "Legacy"},
        "gotofile": {hint: "search for a filename and jump to it"}
    },
    hotitems: {},

    dirty   : true,
    nodes   : [],

    hook : function(){
        var _self = this;

        this.nodes.push(
            mnuFile.insertBefore(new apf.item({
                caption : "Open...",
                onclick : function() {
                    _self.toggleDialog(1);
                }
            }), mnuFile.firstChild),

            ide.barTools.appendChild(new apf.button({
                id      : "btnOpen",
                icon    : "open.png",
                width   : 29,
                tooltip : "Open...",
                skin    : "c9-toolbarbutton",
                onclick : function() {
                    _self.toggleDialog(1);
                }
            })),
            
            this.model = new apf.model(),
            this.modelCache = new apf.model()
        );
                
        ide.addEventListener("init.ext/editors/editors", function(){
            _self.markupInsertionPoint = tabEditors;
            //tabEditors.appendChild(winGoToFile);
        });
        
        ide.addEventListener("extload", function(){
            _self.updateFileCache();
        });

        this.hotitems["gotofile"] = [this.nodes[0]];
    },

    init : function() {
        var _self = this;
        
        txtGoToFile.addEventListener("keydown", function(e){
            if (e.keyCode == 27)
                _self.toggleDialog(-1);
            
            else if (e.keyCode == 13){
                _self.openFile();

                ide.dispatchEvent("track_action", {type: "gotofile"});
                return false;
            }
            else if (e.keyCode == 38 && dgGoToFile.viewport.length) {
                if (dgGoToFile.selected == dgGoToFile.$cachedTraverseList[0])
                    return;
                
                var prev = dgGoToFile.getNextTraverseSelected(dgGoToFile.selected, false);
                if (prev) {
                    dgGoToFile.select(prev, e.ctrlKey, e.shiftKey);
                    dgGoToFile.focus();
                    e.preventDefault();
                }
            }
            else if (e.keyCode == 40 && dgGoToFile.viewport.length) {
                var next = dgGoToFile.getNextTraverseSelected(dgGoToFile.selected);
                if (next) {
                    dgGoToFile.select(next, e.ctrlKey, e.shiftKey);
                    dgGoToFile.focus();
                    e.preventDefault();
                }
            }
        });
        
        txtGoToFile.addEventListener("afterchange", function(e){
            _self.filter(txtGoToFile.value);
            
            if (_self.dirty && txtGoToFile.value.length > 0) {
                _self.dirty = false;
                _self.updateFileCache();
            }
        });
        
        dgGoToFile.addEventListener("keydown", function(e) {
            if (e.keyCode == 27) {
                _self.toggleDialog(-1);
            }
            if (e.keyCode == 9) {
                txtGoToFile.focus();
                e.preventDefault();
            }
            else if (e.keyCode == 38 && !e.shiftKey) {
                if (this.selected == this.$cachedTraverseList[0])
                    txtGoToFile.focus();
            }
            else if (e.keyCode == 13) {
                _self.openFile();
                return false;
            }
            else if (apf.isCharacter(e.keyCode)) {
                txtGoToFile.focus();
            }
            
            e.preventDefault();
        }, true);

        apf.addListener(dgGoToFile.$ext, "mouseup", function(e) {
            _self.openFile();
        });
        
        winGoToFile.addEventListener("blur", function(e){
            if (winGoToFile.visible && !apf.isChildOf(winGoToFile, e.toElement))
                _self.toggleDialog(-1);
        });
        txtGoToFile.addEventListener("blur", function(e){
            if (self.winGoToFile && winGoToFile.visible 
              && !apf.isChildOf(winGoToFile, e.toElement))
                _self.toggleDialog(-1);
        });
        
        ide.addEventListener("closepopup", function(e){
            if (e.element != _self)
                _self.toggleDialog(-1, true);
        });
        
        this.nodes.push(winGoToFile);
    },
    
    updateFileCache : function(){
        var _self = this;

        var hiddenFiles = apf.isTrue(settings.model.queryValue("auto/projecttree/@showhidden"));
        //@todo create an allfiles plugin that plugins like gotofile can depend on
        davProject.report(ide.davPrefix, 'filelist', {
            showHiddenFiles: "0"
          }, 
          function(data, state, extra){
            if (state == apf.ERROR) {
                if (data && data.indexOf("jsDAV_Exception_FileNotFound") > -1) {
                    return;
                }

                //@todo
                return;
            }
            if (state == apf.TIMEOUT)
                return; //@todo

            /**
             * Putting this in a worker won't help
             * An alternative solution would be to do this in parts of 10ms
             */
            var array = data.replace(/^\./gm, "").split("\n");
            array.pop(); //remove trailing empty element;
            
            var start = "<d:href>";
            var end   = "</d:href>";
            var glue  = end + start;
            data = apf.getXml("<d:multistatus  xmlns:d='DAV:'><d:response>"
                + start + array.join(glue) + end + "</d:response></d:multistatus>");

            _self.arrayCache = array;
            _self.modelCache.load(data);
            
            if (self.winGoToFile && winGoToFile.visible && _self.lastSearch) {
                var search = _self.lastSearch;
                _self.lastSearch = null; //invalidate cache
                var sel = dgGoToFile.getSelection();
                _self.filter(search);
                
                if (sel.length < 100) {
                    for (var i = 0, l = sel.length; i < l; i++) {
                        dgGoToFile.select(dgGoToFile.queryNode("//d:href[text()='" 
                            + sel[i].firstChild.nodeValue + "']"));
                    }
                }
            }
            else
                _self.model.load(_self.modelCache.data);
        });
    },
    
    /**
     * Searches through the dataset
     * 
     */
    filter : function(keyword){
        var data;
        
        if (!this.modelCache.data) {
            this.lastSearch = keyword;
            return;
        }
        
        if (!keyword)
            data = this.modelCache.data.cloneNode(true);
        else {
            var nodes;
    
            // Optimization reusing smaller result if possible
            if (this.lastSearch && keyword.indexOf(this.lastSearch) > -1)
                nodes = this.arrayCacheLastSearch;
            else
                nodes = this.arrayCache;
            
            var cache = [], xml = search(nodes, keyword, cache);
            data = apf.getXml(xml);
    
            this.arrayCacheLastSearch = cache;
        }
        
        this.lastSearch = keyword;
        
        this.model.load(data);
        
        // See if there are open files that match the search results
        // and the first if in the displayed results
        
        var pages = tabEditors.getPages(), hash = {};
        for (var i = pages.length - 1; i >= 0; i--) {
            hash[pages[i].id] = true;
        }
        
        var nodes = dgGoToFile.getTraverseNodes();
        for (var i = Math.max(dgGoToFile.viewport.limit - 3, nodes.length - 1); i >= 0; i--) {
            if (hash[ide.davPrefix + nodes[i].firstChild.nodeValue]) {
                dgGoToFile.select(nodes[i]);
                return;
            }
        }
        
        dgGoToFile.select(dgGoToFile.getFirstTraverseNode());
    },
    
    openFile: function(){
        var nodes = dgGoToFile.getSelection();
        
        if (nodes.length == 0)
            return false;
            
        this.toggleDialog(-1);
        
        //txtGoToFile.change("");
        
        for (var i = 0; i < nodes.length; i++) {
            var path = ide.davPrefix.replace(/[\/]+$/, "") + "/" 
                + apf.getTextNode(nodes[i]).nodeValue.replace(/^[\/]+/, "");
            editors.showFile(path);
            ide.dispatchEvent("track_action", {type: "fileopen"});
        }
    },
    
    gotofile : function(){
        this.toggleDialog();
        return false;
    },
    
    "_gotofilelegacy" : function(){
        this.toggleDialog();
        return false;
    },

    toggleDialog: function(force, noanim) {
        if (!self.winGoToFile || !force && !winGoToFile.visible || force > 0) {
            if (self.winGoToFile && winGoToFile.visible)
                return;
            
            ext.initExtension(this);
            
            ide.dispatchEvent("closepopup", {element: this});

            winGoToFile.show();
            
            if (dgGoToFile.$model != this.model)
                dgGoToFile.setModel(this.model);
            
            //Hide window until the list is loaded, unless we don't have data yet
            if (!dgGoToFile.xmlRoot) {
                if (this.modelCache.data) {
                    apf.setOpacity(winGoToFile.$ext, 0);
                    
                    dgGoToFile.addEventListener("afterload", function(){
                        apf.setOpacity(winGoToFile.$ext, 1);
                        
                        dgGoToFile.removeEventListener("afterload", arguments.callee);
                    });
                }
                else {
                    dgGoToFile.$setClearMessage(dgGoToFile["loading-message"], "loading");
                    apf.setOpacity(winGoToFile.$ext, 1);
                }
            }
            else {
                apf.setOpacity(winGoToFile.$ext, 1);
            }
            
            txtGoToFile.select();
            txtGoToFile.focus();
            this.dirty = true;
            
            // If we had a filter and new content, lets refilter
            if (this.lastSearch) {
                var search = this.lastSearch;
                this.lastSearch = null; //invalidate cache
                this.filter(search);
            }
        }
        else if (self.winGoToFile && winGoToFile.visible) {
            if (!noanim) {
                winGoToFile.visible = false;
                
                //Animate
                apf.tween.single(winGoToFile, {
                    type     : "fade",
                    from     : 1,
                    to       : 0,
                    steps    : 5,
                    interval : 0,
                    control  : (this.control = {}),
                    onfinish : function(){
                        winGoToFile.visible = true;
                        winGoToFile.hide();
                        
                        if (editors.currentEditor && editors.currentEditor.ceEditor)
                            editors.currentEditor.ceEditor.focus();
                    }
                });
            }
            else {
                winGoToFile.hide();
            }
        }

        return false;
    },

    enable : function(){
        this.nodes.each(function(item){
            if (item.enable)
                item.enable();
        });
    },

    disable : function(){
        this.nodes.each(function(item){
            if (item.disable)
                item.disable();
        });
    },

    destroy : function(){
        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        winGoToFile.destroy(true, true);
        this.nodes = [];
    }
});

});