/**
 * Refactor Module for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var util = require("core/util");
var fs = require("ext/filesystem/filesystem");
var css = require("text!ext/save/save.css");
var markup = require("text!ext/save/save.xml");

module.exports = ext.register("ext/save/save", {
    dev         : "Ajax.org",
    name        : "Save",
    alone       : true,
    type        : ext.GENERAL,
    markup      : markup,
    css         : css,
    deps        : [fs],
    offline     : true,

    commands     : {
        "quicksave": {hint: "save the currently active file to disk"},
        "saveas": {hint: "save the file to disk with a different filename"}
    },
    hotitems    : {},
    nodes       : [],
    saveBuffer  : {},

    hook : function(){
        if (!self.tabEditors) return;
        
        var _self = this;
        
        tabEditors.addEventListener("close", this.$close = function(e) {
            var at = e.page.$at;
            if (!at.undo_ptr)
                at.undo_ptr = at.$undostack[0];
            if (at.undo_ptr && at.$undostack[at.$undostack.length-1] !== at.undo_ptr) {
                ext.initExtension(_self);
                
                winCloseConfirm.page = e.page;
                winCloseConfirm.all = 0;
                winCloseConfirm.show();
                
                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all != -100) {
                        if(!tabEditors.getPage().$model.data.getAttribute('newfile')) {
                            tabEditors.remove(winCloseConfirm.page, true);
                            winCloseConfirm.page.$at.undo(-1);
                            delete winCloseConfirm.page;
                        }
                        else
                            winSaveAs.page = winCloseConfirm.page;
                    }
                    winCloseConfirm.removeEventListener("hide", arguments.callee);
                });
                
                btnYesAll.hide();
                btnNoAll.hide();
                
                e.preventDefault();
            }
        });

        this.nodes.push(ide.barTools.appendChild(new apf.button({
            id       : "btnSave",
            icon     : "save.png",
            tooltip  : "Save",
            skin     : "c9-toolbarbutton",
            disabled : "{!!!tabEditors.activepage}",
            onclick  : this.quicksave.bind(this)
        })));

        var saveItem, saveAsItem;
        this.nodes.push(
            ide.mnuFile.insertBefore(new apf.divider(), ide.mnuFile.firstChild),
        
            ide.mnuFile.insertBefore(new apf.item({
                caption : "Save All",
                onclick : function(){
                    _self.saveall();
                },
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),
                
            saveAsItem = ide.mnuFile.insertBefore(new apf.item({
                caption : "Save As...",
                onclick : function () {
                    _self.saveas();
                },
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild),
            
            saveItem = ide.mnuFile.insertBefore(new apf.item({
                caption : "Save",
                onclick : this.quicksave.bind(this),
                disabled : "{!!!tabEditors.activepage}"
            }), ide.mnuFile.firstChild)
        );

        this.hotitems["quicksave"] = [saveItem];
        this.hotitems["saveas"]    = [saveAsItem];
    },

    init : function(amlNode){
        var _self = this;
        
        apf.importCssString((this.css || ""));
        winCloseConfirm.onafterrender = function(){
            btnYesAll.addEventListener("click", function(){
                winCloseConfirm.all = 1;
                winCloseConfirm.hide();
            });
            btnNoAll.addEventListener("click", function(){
                winCloseConfirm.all = -1;
                winCloseConfirm.hide();
            });
            btnSaveYes.addEventListener("click", function(){
                _self.quicksave(winCloseConfirm.page);
                winCloseConfirm.hide()
            });
            btnSaveNo.addEventListener("click", function(){
                winCloseConfirm.hide();
            });
            btnSaveCancel.addEventListener("click", function(){
                winCloseConfirm.all = -100;
                winCloseConfirm.hide();
            });
        }
        
        winSaveAs.addEventListener("hide", function(){
            if(winSaveAs.page) {
                tabEditors.remove(winSaveAs.page, true);
                winSaveAs.page.$at.undo(-1);
                delete winSaveAs.page;
            }
        });
    },
    
    saveall : function(){
        var pages = tabEditors.getPages();        
        for (var i = 0; i < pages.length; i++) {
            var at = pages[i].$at;
            // if (at.undo_ptr && at.$undostack[at.$undostack.length-1] !== at.undo_ptr)
            this.quicksave(pages[i]);
        }
    },
    
    saveAllInteractive : function(pages, callback){
        ext.initExtension(this);
        
        winCloseConfirm.all = 0;
                
        var _self = this;
        apf.asyncForEach(pages, function(item, next) {
            var at = item.$at;
            if (at.undo_ptr && at.$undostack[at.$undostack.length-1] !== at.undo_ptr) {
                if (winCloseConfirm.all == 1)
                    _self.quicksave(item);
                //else if (winCloseConfirm.all == -1)
                    //item.$at.undo(-1);

                if (winCloseConfirm.all)
                    return next();
                
                tabEditors.set(item);
                winCloseConfirm.page = item;
                winCloseConfirm.show();
                winCloseConfirm.addEventListener("hide", function(){
                    if (winCloseConfirm.all == 1)
                        _self.quicksave(item);
                    //else if (winCloseConfirm.all == -1)
                        //item.$at.undo(-1);

                    winCloseConfirm.removeEventListener("hide", arguments.callee);
                    next();
                });
                
                btnYesAll.setProperty("visible", pages.length > 1);
                btnNoAll.setProperty("visible", pages.length > 1);
            }
            else
                next();
        },
        function() {
            callback(winCloseConfirm.all);
        });
    },

    quicksave : function(page) {
        if (!page || !page.$at)
            page = tabEditors.getPage();

        if (!page)
            return;

        var doc  = page.$doc;
        var node = doc.getNode();
        if(node.getAttribute('newfile')){
            this.saveas();
        }
            
        if (node.getAttribute("debug"))
            return;

        var path = node.getAttribute("path");
        var value = doc.getValue();
        
        // check if we're already saving!
        var saving = parseInt(node.getAttribute("saving"));
        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }
        apf.xmldb.setAttribute(node, "saving", "1");
        
        var _self = this, panel = sbMain.firstChild;
        panel.setAttribute("caption", "Saving file " + path);
        
        ide.dispatchEvent("beforefilesave", {node: node, doc: doc, value: value});

        fs.saveFile(path, value, function(data, state, extra){
            if (state != apf.SUCCESS) {
                util.alert(
                    "Could not save document",
                    "An error occurred while saving this document",
                    "Please see if your internet connection is available and try again. "
                        + (state == apf.TIMEOUT
                            ? "The connection timed out."
                            : "The error reported was " + extra.message));
            }
            
            panel.setAttribute("caption", "Saved file " + path);
            ide.dispatchEvent("afterfilesave", {node: node, doc: doc, value: value});
            apf.xmldb.removeAttribute(node, "saving");
            if (_self.saveBuffer[path]) {
                delete _self.saveBuffer[path];
                _self.quicksave(page);
            }

            //setTimeout(function(){
            //    if (panel.caption == "Saved file " + path)
            //        panel.removeAttribute("caption");
            //}, 2500);
        });
        var at = page.$at
        at.undo_ptr = at.$undostack[at.$undostack.length-1];
        page.$at.dispatchEvent("afterchange");
        return false;
    },
    
    choosePath : function(path, select) {
        var _self = this;
        
        fs.list(path.match(/(.*)\/[^/]*/)[1], function (data, state, extra) {
            if (new RegExp("<folder.*" + path + ".*>").test(data)) {
                path  = path.replace(new RegExp('\/' + cloud9config.davPrefix.split('/')[1]), '')
                            .replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                            .replace(/\/node\(\)\[@name="workspace"\]/, "")
                            .replace(/\//, "");
                // console.log(path);
                trSaveAs.expandList([path], function() {
                    var node = trSaveAs.getModel().data.selectSingleNode(path);
                     
                    trSaveAs.select(node);
                });
            } else
                _self.saveFileAs();
        });
    },
    
    saveas : function(){
        var tabPage = tabEditors.getPage(),
            path    = tabPage ? tabPage.$model.data.getAttribute("path") : false;
        
        if(!path)
            return;
        
        ext.initExtension(this);
        
        var fooPath = path.split('/');
        txtSaveAs.setValue(fooPath.pop());
        lblPath.setProperty('caption', fooPath.join('/') + '/');
        winSaveAs.show();
    },
    
    saveFileAs : function(page) {
        var _self   = this,
            page    = page || tabEditors.getPage(),
            file    = page.$model.data,
            path    = file.getAttribute("path"),
            newPath = lblPath.getProperty('caption') + txtSaveAs.getValue();
            
        // check if we're already saving!
        var saving = parseInt(file.getAttribute("saving"));
        if (saving) {
            this.saveBuffer[path] = page;
            return;
        }
        apf.xmldb.setAttribute(node, "saving", "1");
            
        function onconfirm() {
            var panel   = sbMain.firstChild,
                value   = page.$doc.getValue();
  
            // console.log(value);
            winConfirm.hide();
            winSaveAs.hide();
            
            panel.setAttribute("caption", "Saving file " + newPath);
            fs.saveFile(newPath, value, function(value, state, extra) {
                if (state != apf.SUCCESS) {
                   util.alert("Could not save document",
                              "An error occurred while saving this document",
                              "Please see if your internet connection is available and try again.");
                }
                panel.setAttribute("caption", "Saved file " + newPath);
                if (path != newPath) {
                    var model = page.$model,
                        node  = model.getXml();
                        
                    model.load(node);
                    file = model.data;
                    fs.beforeRename(file, null, newPath);
                    page.$doc.setNode(file);
                }
                
                apf.xmldb.removeAttribute(node, "saving");
                if (_self.saveBuffer[path]) {
                    delete _self.saveBuffer[path];
                    _self.saveFileAs(page);
                }
            
                if(file.getAttribute("newfile")) {
                    file.removeAttribute("newfile");
                    apf.xmldb.setAttribute(file, "changed", "0");
                    var _xpath = newPath.replace(new RegExp('\/' + cloud9config.davPrefix.split('/')[1]), '')
                                        .replace(new RegExp('\/' + file.getAttribute('name')), '')
                                        .replace(/\/([^/]*)/g, "/node()[@name=\"$1\"]")
                                        .replace(/\/node\(\)\[@name="workspace"\]/, "")
                                        .replace(/\//, ""),
                        _node  = trFiles.getModel().data.selectSingleNode(_xpath);
                    if(_node)
                        apf.xmldb.appendChild(_node, file);
                }
                //setTimeout(function () {
                //  if (panel.caption == "Saved file " + newPath)
                //       panel.removeAttribute("caption");
                //}, 2500);
            });
        };
    
        if (path != newPath) {
            fs.exists(newPath, function (exists) {
                if (exists) {
                    var name    = newPath.match(/\/([^/]*)$/)[1],
                        folder  = newPath.match(/\/([^/]*)\/[^/]*$/)[1];
                    
                    util.confirm(
                        "Are you sure?",
                        "\"" + name + "\" already exists, do you want to replace it?",
                        "A file or folder with the same name already exists in the folder "
                        + folder + ". "
                        + "Replacing it will overwrite it's current contents.",
                        onconfirm);
                }
                else
                    onconfirm();
            });
        }
        else
            onconfirm();
    },
    
    expandTree : function(){
        var _self = this;
        setTimeout(function(){
            var tabPage = tabEditors.getPage(),
                path    = tabPage ? tabPage.$model.data.getAttribute('path') : false,
                isNew   = tabPage.$model.data.getAttribute('newfile');
            if(!isNew)
                _self.choosePath(path);
            else
                trSaveAs.slideOpen(null, trSaveAs.getModel().data.selectSingleNode('//folder'));
        });
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

        tabEditors.removeEventListener("close", this.$close);
    }
});

});
