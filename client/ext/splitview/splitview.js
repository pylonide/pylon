/**
 * Show a split view; two editors next to each other in one tab
 *
 * @copyright 2010, Ajax.org B.V.
 * @author Mike de Boer <mike AT c9 DOT io>
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var css = require("text!ext/splitview/splitview.css");
var Tabbehaviors = require("ext/tabbehaviors/tabbehaviors");
var Editors = require("ext/editors/editors");

var Splits = require("ext/splitview/splits");

var EditSession = require("ace/edit_session").EditSession;

var mnuCloneView, mnuSplitAlign;

module.exports = ext.register("ext/splitview/splitview", {
    dev      : "Ajax.org",
    alone    : true,
    type     : ext.GENERAL,
    
    commands : {
        "mergetableft": {hint: "Add the page on the left of the currently active page to a split view"},
        "mergetabright": {hint: "Add the page on the right of the currently active page to a split view"}
    },
    hotitems : [],
    nodes    : [],
    
    splits   : [],
    
    init : function(){
        apf.importCssString(css || "");
        
        var _self = this;
        
        var parent = Tabbehaviors.nodes[Tabbehaviors.nodes.length - 1];
        this.nodes.push(
            parent.appendChild(new apf.splitter()),
            parent.appendChild(
                (mnuCloneView = new apf.item({
                    caption : "Clone Editor",
                    type    : "check",
                    checked : false,
                    onclick : function() {
                        if (this.checked)
                            _self.startCloneView(tabEditors.contextPage);
                        else
                            _self.endCloneView(tabEditors.contextPage);
                    }
                }))
            ),
            parent.appendChild(
                (mnuSplitAlign = new apf.item({
                    caption : "Align Splits Vertically",
                    type    : "check",
                    checked : true,
                    onclick : function() {
                        _self.changeLayout(tabEditors.contextPage, this.checked ? "3rows" : "3cols");
                    }
                }))
            )
        );
        
        ide.addEventListener("editorswitch", function(e) {
            _self.updateSplitView(e.previousPage, e.nextPage);
        });
        
        ide.addEventListener("closefile", function(e) {
            _self.onFileClose(e);
        });
        
        ide.addEventListener("beforecycletab", function(e) {
            _self.onCycleTab(e);
        });
        
        tabEditors.addEventListener("tabselectclick", function(e) {
            return _self.onTabClick(e);
        });
        
        tabEditors.addEventListener("tabselectmouseup", function(e) {
            var page = this.$activepage;
            var split = Splits.get(page);
            
            if (split && split.length)
                Splits.update(split[0]);
        });
        
        Splits.init(this);
    },
    
    mergetableft: function() {
        return this.mergeTab("left");
    },
    
    mergetabright: function() {
        return this.mergeTab("right");
    },
    
    mergeTab: function(dir) {
        var bRight  = dir == "right";
        var tabs    = tabEditors;
        var pages   = tabs.getPages();
        var curr    = tabs.getPage();
        var currIdx = pages.indexOf(curr);
        if (!curr || pages.length == 1)
            return;
            
        var idx = currIdx + (bRight ? 1 : -1);
        if (idx < 0)
            idx = pages.length - 1;
        if (idx > pages.length -1)
            idx = 0;

        // pass in null to mutate the active split view
        Splits.mutate(null, pages[idx]);
        return false;
    },
    
    /**
     * Invoked when a file is closed
     *
     * @param {AmlEvent} e
     */
    onFileClose: function(e) {
        var page = e.page;
        var split = Splits.get(page);
        if (split.length)
            Splits.mutate(split[0], page);
    },
    
    /**
     * Invoked when a tab is clicked, that is the part of the tab-button that is NOT
     * a close button.
     * 
     * @param {AmlEvent} e
     */
    onTabClick: function(e) {
        var page = e.page;
        var shiftKey = e.htmlEvent.shiftKey;
        var split = Splits.get(page);
        split = split.length ? split[0] : null

        if (split && !shiftKey) {
            var activePage = tabEditors.getPage();
            var ret = null;
            
            for (var i = 0, l = split.pages.length; i < l; ++i) {
                if (split.pages[i] !== activePage)
                    continue;
                ret = false;
                break;
            }
            // only the first tab in the split view is the trigger to select all
            // other tabs as well (because only the page of the first tab is 
            // REALLY shown)
            if (ret !== false && page !== split.pages[0]) {
                tabEditors.set(split.pages[0]);
                ret = false;
            }
            
            if (!shiftKey)
                return true;
            
            return ret;
        }

        if (!shiftKey)
            return;
            
        // tabs can be merged into and unmerged from a splitview by clicking a
        // tab while holding shift
        return !Splits.mutate(split, page);
    },
    
    /**
     * Tab cycling is handled by the tabbehaviors extension, which emits an event
     * we can hook into. We correct the tab to switch to if a user lands onto a
     * split view while cycling.
     * 
     * @param {AmlEvent} e
     */
    onCycleTab: function(e) {
        var idx = e.index;
        var dir = e.dir;
        var pages = e.pages;
        
        var split = Splits.get(pages[idx]);
        //console.log("cycletab split?", split, pages[idx], e);
        if (!split.length)
            return;
        split = split[0];
        
        var start = split.pages.indexOf(pages[idx]);
        
        function correct(val) {
            if (val < 0)
                return pages.length - 1;
            if (val > pages.length -1)
                return 0;
            return val;
        }
        
        //console.log("tab is cycling...", dir);
        var count = 0;
        var max = pages.length + 2;
        if (dir == "right") {
            if (start === 0)
                return;
            while (split.pages[++start] === pages[++idx]) {
                if (++count > max)
                    return;
                idx = correct(idx);
            }
        }
        else {
            if (start === split.pages.length - 1)
                return;
            while (split.pages[--start] === pages[--idx]) {
                if (++count > max)
                    return;
                idx = correct(idx);
            }
        }
        e.returnValue = correct(idx);
    },
    
    updateSplitView: function(previous, next) {
        var doc = next.$doc;
        var at  = next.$at;
        // check if this is a valid clone session
        var split = Splits.get(next);
        split = split.length ? split[0] : null;
        console.log("got split?",split);
        
        // hide the previous clone session (if any)
        if (previous && previous.$model) {
            var oldSplit = Splits.get(previous);
            oldSplit = oldSplit.length ? oldSplit[0] : null;
            console.log("got old split?",oldSplit);
            if (oldSplit && !split) {
                // the next page is NOT a split view
                //for (var i = 0, l = oldSplit.pages.length; i < l; ++i)
                //    oldSplit.pages[i].$deactivateButton();

                Splits.hide(oldSplit);

                var nextPage = next.fake ? next.relPage : next;
                nextPage.appendChild(next.$editor.amlEditor);
            }
        }
        
        mnuCloneView.setAttribute("checked", false);
        mnuSplitAlign.setAttribute("checked", true);

        // all this must exist
        if (!doc || !at || !split) {
            next.$editor.amlEditor && next.$editor.amlEditor.show();
            return;
        }
        
        Splits.show(split);
        mnuSplitAlign.setAttribute("checked", split.gridLayout == "3rows");
        
        var _self = this;
        split.pages.forEach(function(page, idx) {
            var editor = split.editors[idx];
            if (!editor)
                return;
            var session = _self.getEditorSession(page);
            //console.log("switch: ", session);
            if (editor.value !== session)
                editor.setProperty("value", session);
        });
        
        if (split.clone) {
            var editor = split.clone.$editor;
            mnuCloneView.setAttribute("checked", true);
            
            if (!split.acesession) {
                var _self = this;
    
                split.acesession = new EditSession(doc.acedoc);
                split.acesession.setUndoManager(at);
                
                doc.addEventListener("prop.value", function(e) {
                    split.acesession.setValue(e.value || "");
                    editor.moveCursorTo(0, 0);
                });
                
                doc.addEventListener("close", function(){
                    _self.endCloneView(split.clone);
                });
            }
            editor.setProperty("value", split.acesession);
        }
        else {
            // TODO: please test switching of tabs between normal tabs and split
            // views right after uncommenting the line below:
            //consolidateEditorSession(next, split.editors[split.pages.indexOf(next)]);
        }
        
        apf.layout.forceResize();
    },
    
    changeLayout: function(page, gridLayout) {
        var split = Splits.get(page);
        if (!split.length || split.gridLayout == gridLayout)
            return;
        
        Splits.update(split[0], gridLayout);
    },
    
    /**
     * 
     */
    startCloneView: function(page) {
        var view = this.getCloneView(page);
        var doc  = page.$doc;
        
        if (view || !doc || !this.getEditorSession(page))
            return;
        
        var view = createSplitView.call(this, page, 1, "clone");
        var editor = view.editors[1];

        var fake = tabEditors.add("{([@changed] == 1 ? '*' : '') + [@name]}", page.$model.data.getAttribute("path") 
          + "_clone", page.$editor.path, page.nextSibling || null, function(newPage){
            newPage.contentType = page.contentType;
            newPage.$at     = page.$at;
            newPage.$doc    = doc;
            newPage.$editor = editor;
            newPage.setAttribute("tooltip", "[@path]");
            newPage.setAttribute("class",
                "{parseInt([@saving], 10) || parseInt([@lookup], 10) ? (tabEditors.getPage(tabEditors.activepage) == this ? 'saving_active' : 'saving') : \
                ([@loading] ? (tabEditors.getPage(tabEditors.activepage) == this ? 'loading_active' : 'loading') : '')}"
            );
            newPage.setAttribute("model", newPage.$model = page.$model);
            
            view.pages.push(newPage);
            view.clone = newPage;
            
            newPage.$activateButton();
        });
        
        page.addEventListener("DOMNodeRemovedFromDocument", function(e) {
            if (typeof tabEditors == "undefined")
                return;
            tabEditors.remove(fake);
        });
        
        Editors.initEditorEvents(fake, page.$model);
        
        this.updateSplitView(null, page);
    },
    
    endCloneView: function(page) {
        var split, i, l, j, l2;
        for (i = 0, l = this.splits.length; i < l; ++i) {
            split = this.splits[i];
            if (!split || split.pages.indexOf(page) === -1 || !split.clone)
                continue;
            
            // found it!
            for (j = split.editors.length - 1; j >= 0; --j) {
                if (split.editors[j] === this.$cloneEditor)
                    split.editors.splice(j, 1);
            }
            this.$cloneEditor.hide();
            apf.document.body.appendChild(this.$cloneEditor);
            for (j = split.pages.length - 1; j >= 0; --j) {
                if (split.pages[j] === split.clone)
                    split.pages.splice(j, 1);
            }
            tabEditors.remove(split.clone);
            delete split.clone;
            
            updateSplitViewGrid.call(this, split);
            break;
        }
        
        mnuCloneView.setAttribute("checked", false);
        apf.layout.forceResize();
    },
    
    getCloneView: function(page) {
        var split = this.getSplitViewByPage(page);
        if (split && split.clone)
            return split;
        return null;
    },
    
    getEditorSession: function(page) {
        var doc = page.$doc;
        return doc.acesession || doc.session || null;
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

});