/**
 * Go to file extension
 *
 * @copyright 2010-2012, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

/*global winGoToFile tabEditors txtGoToFile dgGoToFile */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var markup = require("text!ext/gotofile/gotofile.xml");
var filelist = require("ext/filelist/filelist");
var search = require("ext/gotofile/search");
var editors = require("ext/editors/editors");

module.exports = ext.register("ext/gotofile/gotofile", new (function () {
    var _self = this;
    
    this.name = "Go To File";
    this.dev = "Ajax.org";
    this.alone = true;
    this.offline = false;
    this.type = ext.GENERAL;
    this.markup = markup;
    this.autodisable = ext.ONLINE | ext.LOCAL;
    
    // so the filelist can be populated before the init function is called
    // and therefore the model has not been loaded, so thats kinda sucky
    // therefore we create the model in code when we create this plugin...
    window.mdlGoToFile = this.model = (function () {
        var m = new apf.model();
        apf.xmldb.setAttribute(m, "id", "mdlGoToFile");
        m.load("<files loading='true'/>");
        return m;
    }());
    
    this.nodes = [];
    
    this.$isInited = false;
    this.$filelist = [];
    
    // hook the menu items to the UI and such
    this.hook = function () {
        var mnuItem = new apf.item({
            command : "gotofile"
        });

        commands.addCommand({
            name: "gotofile",
            hint: "search for a filename and jump to it",
            bindKey: {mac: "Command-E", win: "Ctrl-E"},
            exec: _self.openDialog
        });

        this.nodes.push(
            menus.addItemByPath("File/Open...", mnuItem, 500),
            menus.addItemByPath("Goto/Goto File...", mnuItem.cloneNode(false), 100)
        );

        // apparently the markup needs to be somewhere here, no clue really
        // maybe it has something to do with positioning, let's just keep it this way.
        ide.addEventListener("init.ext/editors/editors", function(){
            _self.markupInsertionPoint = tabEditors;
        });
        
        // start loading the file list at the moment that we hook
        // that saves time...
        _self.updateFileList();
    };
    
    this.init = function () {
        apf.addListener(dgGoToFile, "click", function () {
            _self.onItemSelect(dgGoToFile.selected);
        });
        
        apf.addListener(txtGoToFile, "prop.value", function (e) {
            if (e.changed) {
                _self.search(e.value);
            }
        });
        
        _self.$isInited = true;
    };
    
    /**
     * Open the go to file dialog
     */
    this.openDialog = function () {
        // on first use, we'll init...
        if (!_self.$isInited) {
            ext.initExtension(_self);
        }
        
        // show the window, and give focus to the textbox
        winGoToFile.show();
        txtGoToFile.focus();
    };
    
    /**
     * Query the server for a new file list and put it in the $filelist variable
     */
    this.updateFileList = function () {
        filelist.getFileList(false, function(data, state){
            if (state != apf.SUCCESS) {
                return;
            }

            var array = data.replace(/^\./gm, "").split("\n");
            array.pop(); //remove trailing empty element;
            
            // store it
            _self.$filelist = array;
            
            // afterwards, notify the model that we now have proper data...
            apf.xmldb.setAttribute(_self.model.data, "loading", false);
            
            // and do a new search with the content of the textbox
            _self.search(_self.$isInited && txtGoToFile.value);
        });
    };
    
    /**
     * Search for a specific file
     */
    this.search = function (value) {
        value = value || "";
        
        // loading, then no thanks 
        if (apf.isTrue(_self.model.data.getAttribute("loading"))) {
            return;
        }
        
        // clear out the model first
        var children = _self.model.queryNodes("file");
        for (var i = children.length; i--; ) {
            apf.xmldb.removeNode(children[i]);
        }
        
        var results = search.fileSearch(_self.$filelist, value);
        // limit the number of results to a 100 because no-one cares anyway
        results = results.splice(0, 100);
        
        // then map it and append to the model
        results.forEach(function (path) {
            var node = apf.n("<file/>")
                .attr("path", path)
                .attr("displayname", _self.replaceStrong(apf.getFilename(path), value))
                .attr("displaypath", _self.replaceStrong(path, value))
                .node();
            
            // this might be a bit slow, lets try it anyways
            apf.xmldb.appendChild(_self.model.data, node);
        });
    };
    
    /**
     * Make the part of a value that matches the keyword strong
     * Or something else because there are no comments here
     */
    this.replaceStrong = function (value, keyword){
        if (!value)
            return "";
        keyword = keyword.replace(/\*/g, "");
        var i;
        if ((i = value.lastIndexOf(keyword)) !== -1)
            return value.substring(0, i) + "<strong>" + keyword + "</strong>" + value.substring(i+keyword.length);
        var result = search.matchPath(value, keyword);
        if (!result.length)
            return value;
        result.forEach(function(part, i) {
            if (part.match)
                result[i] = "<strong>" + part.val + "</strong>";
            else
                result[i] = part.val;
        });
        return result.join("");
    };
    
    /**
     * Firs after you've selected an item from the list
     */
    this.onItemSelect = function (node) {
        if (!node) {
            return;
        }
        
        var path = ide.davPrefix + node.getAttribute("path");
        
        editors.gotoDocument({ path: path, active: true });
        
        // after you've selected an item we'll close the window...
        winGoToFile.hide();
        // and re-set selection
        dgGoToFile.select(-1);
    };
    
    // outline requires this, will check why...
    this.setEventsEnabled = function () {};

    // === Generic enable/disable logic, why is this not in 'ext'? ===
    this.enable = function(){
        this.nodes.each(function(item){
            if (item.enable)
                item.enable();
        });
    };

    this.disable = function(){
        this.nodes.each(function(item){
            if (item.disable)
                item.disable();
        });
    },

    this.destroy = function(){
        commands.removeCommandByName("gotofile");

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        this.nodes = [];
    };
})());

});