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
var Settings = require("ext/settings/settings");

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
        var tabs = tabEditors; // localize global 'tabEditors'
        
        var parent = Tabbehaviors.nodes[Tabbehaviors.nodes.length - 1];
        this.nodes.push(
            parent.appendChild(new apf.divider()),
            parent.appendChild(
                (mnuCloneView = new apf.item({
                    caption : "Clone Editor",
                    type    : "check",
                    checked : false,
                    onclick : function() {
                        if (this.checked)
                            _self.startCloneView(tabs.contextPage);
                        else
                            _self.endCloneView(tabs.contextPage);
                    }
                }))
            ),
            parent.appendChild(
                (mnuSplitAlign = new apf.item({
                    caption : "Align Splits Vertically",
                    type    : "check",
                    checked : true,
                    onclick : function() {
                        _self.changeLayout(tabs.contextPage, this.checked ? "3rows" : "3cols");
                    }
                }))
            )
        );
        
        ide.addEventListener("editorswitch", function(e) {
            return _self.updateSplitView(e.previousPage, e.nextPage);
        });
        
        ide.addEventListener("closefile", function(e) {
            _self.onFileClose(e);
        });
        
        ide.addEventListener("beforecycletab", function(e) {
            _self.onCycleTab(e);
        });
        
        ide.addEventListener("correctactivepage", function(e) {
            var split = Splits.getActive();
            var editor = Editors.currentEditor && Editors.currentEditor.amlEditor;
            if (!split || !editor)
                return;
            var idx = Splits.indexOf(split, editor);
            if (idx == -1)
                return;
            e.returnValue = split.pages[idx];
        });
        
        tabs.addEventListener("tabselectclick", function(e) {
            return _self.onTabClick(e);
        });
        
        tabs.addEventListener("tabselectmouseup", function(e) {
            var page = this.$activepage;
            var split = Splits.get(page)[0];
            if (split)
                Splits.update(split);
        });
        
        ide.addEventListener("loadsettings", function(e) {
            if (!e.model || !e.model.data)
                return;
            setTimeout(function() {
                _self.restore(e.model.data);
            });
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
        var split   = Splits.getActive();
        if (split && Splits.indexOf(split, curr) > -1)
            curr = split.pages[bRight ? split.pages.length - 1 : 0];
        if (!curr || pages.length == 1)
            return;
        
        var currIdx = pages.indexOf(curr);
        var idx = currIdx + (bRight ? 1 : -1);
        if (idx < 0 || idx > pages.length - 1)
            return;

        // enable split view ONLY for code editors for now...
        if (pages[idx].$editor.name.indexOf("Code Editor") == -1)
            return;
        // pass in null to mutate the active split view
        Splits.mutate(null, pages[idx]);
        //Splits.update();
        this.save();
        return false;
    },
    
    /**
     * Invoked when a file is closed
     *
     * @param {AmlEvent} e
     */
    onFileClose: function(e) {
        var page = e.page;
        var splits = Splits.get(page);
        for (var i = 0, l = splits.length; i < l; ++i)
            Splits.mutate(splits[i], page);
        Splits.update();
        this.save();
    },
    
    /**
     * Invoked when a tab is clicked, that is the part of the tab-button that is NOT
     * a close button.
     * 
     * @param {AmlEvent} e
     */
    onTabClick: function(e) {
        var page = e.page;
        var tabs = tabEditors;
        var activePage = tabs.getPage();
        var shiftKey = e.htmlEvent.shiftKey;
        var ret = null;
        var split = Splits.get(activePage)[0];

        if (split && !shiftKey) {
            for (var i = 0, l = split.pages.length; i < l; ++i) {
                if (split.pages[i] !== activePage)
                    continue;
                ret = false;
                break;
            }
            Splits.setActivePage(split, page);
            // only the first tab in the split view is the trigger to select all
            // other tabs as well (because only the page of the first tab is 
            // REALLY shown)
            if (ret !== false && page !== split.pages[0]) {
                tabs.set(split.pages[0]);
                ret = false;
            }
            
            if (!shiftKey)
                return true;
            
            return ret;
        }
        else if (shiftKey) {
            // enable split view ONLY for code editors for now...
            if (page.$editor.name.indexOf("Code Editor") == -1)
                return;
            // tabs can be merged into and unmerged from a splitview by clicking a
            // tab while holding shift
            ret = !Splits.mutate(split, page);
            this.save();
            return ret;
        }
    },
    
    /**
     * Tab cycling is handled by the tabbehaviors extension, which emits an event
     * we can hook into. We correct the tab to switch to if a user lands onto a
     * split view while cycling.
     * 
     * @param {AmlEvent} e
     */
    onCycleTab: function(e) {
        var pages  = e.pages;
        var split = Splits.getActive();
        if (!split)
            return;
        if (split.pages.length == pages.length)
            return (e.returnValue = false);
        
        var maxIdx = pages.length - 1;
        var bRight = e.dir == "right";
        var idx = pages.indexOf(split.pages[bRight ? split.pages.length - 1 : 0]) + (bRight ? 1 : -1);
        idx = idx < 0 ? maxIdx : idx > maxIdx ? 0 : idx;
        if (Splits.indexOf(split, pages[idx]) > -1)
            return (e.returnValue = false);
        
        // check if the next tab is inside a split as well:
        split = Splits.get(pages[idx])[0];
        if (split)
            e.returnValue = pages.indexOf(split.pages[0]);
        else
            e.returnValue = idx;
    },
    
    updateSplitView: function(previous, next) {
        var editor;
        var doc = next.$doc;
        var at  = next.$at;
        // check if this is a valid clone session
        var split = Splits.get(next)[0];
        
        // hide the previous split view
        if (previous && previous.$model) {
            var oldSplit = Splits.get(previous)[0];
            //console.log("got old split?",oldSplit);
            if (oldSplit && (!split || oldSplit.gridLayout != split.gridLayout))
                Splits.hide(oldSplit);
        }
        
        // enable split view ONLY for code editors for now...
        if (next.$editor.name.indexOf("Code Editor") > -1) {
            mnuCloneView.enable();
            mnuSplitAlign.enable();
        }
        else {
            mnuCloneView.disable();
            mnuSplitAlign.disable();
        }
        
        mnuCloneView.setAttribute("checked", false);
        mnuSplitAlign.setAttribute("checked", false);

        // all this must exist
        if (!doc || !at || !split) {
            // if it doesn't, make sure the editor is visible and correctly displayed
            editor = next.$editor.amlEditor;
            if (!editor)
                return;
            Splits.consolidateEditorSession(next, editor);
            var nextPage = next.fake ? next.relPage : next;
            if (editor.parentNode != nextPage)
                nextPage.appendChild(editor);
            editor.show();
            return;
        }
        
        Splits.show(split);
        mnuSplitAlign.setAttribute("checked", split.gridLayout == "3rows");
        
        if (split.clone) {
            var _self = this;
            var page = split.clone;
            editor = page.$editor;
            
            mnuCloneView.setAttribute("checked", true);
            
            if (!page.acesession) {
                page.acesession = new EditSession(doc.acedoc);
                page.acesession.setUndoManager(at);
                
                doc.addEventListener("prop.value", function(e) {
                    page.acesession.setValue(e.value || "");
                    editor.moveCursorTo(0, 0);
                });
                
                doc.addEventListener("close", function(){
                    _self.endCloneView(page);
                });
            }
            editor.amlEditor.setProperty("value", page.acesession);
        }
        
        apf.layout.forceResize();
        
        this.save();
        
        return false;
    },
    
    changeLayout: function(page, gridLayout) {
        var split = Splits.get(page)[0];
        if (!split || split.gridLayout == gridLayout)
            return;
        
        Splits.update(split, gridLayout);
        mnuSplitAlign.setAttribute("checked", gridLayout == "3rows");
        this.save();
    },
    
    /**
     * 
     */
    startCloneView: function(page) {
        var split = this.getCloneView(page);
        var doc  = page.$doc;
        
        if (split || !doc || !Splits.getEditorSession(page))
            return;
        
        var fake = tabEditors.add("{([@changed] == 1 ? '*' : '') + [@name]}", page.$model.data.getAttribute("path") 
          + "_clone", page.$editor.path, page.nextSibling || null);
          
        fake.contentType = page.contentType;
        fake.$at     = page.$at;
        fake.$doc    = doc;
        fake.$editor = page.$editor;
        fake.setAttribute("tooltip", "[@path]");
        fake.setAttribute("class",
            "{parseInt([@saving], 10) || parseInt([@lookup], 10) ? (tabEditors.getPage(tabEditors.activepage) == this ? 'saving_active' : 'saving') : \
            ([@loading] ? (tabEditors.getPage(tabEditors.activepage) == this ? 'loading_active' : 'loading') : '')}"
        );
        fake.setAttribute("model", fake.$model = page.$model);
        
        page.addEventListener("DOMNodeRemovedFromDocument", function(e) {
            if (typeof tabEditors == "undefined" || !fake || !fake.parentNode)
                return;
            tabEditors.remove(fake);
        });
        
        Editors.initEditorEvents(fake, page.$model);
        
        Splits.mutate(null, fake);
        
        split = Splits.get(fake)[0];
        split.clone = fake;
        
        Splits.update(split);
        
        this.save();
        
        return fake;
    },
    
    endCloneView: function(page) {
        var split = this.getCloneView(page);
        if (!split)
            return;

        tabEditors.remove(split.clone);
        delete split.clone;
    },
    
    getCloneView: function(page) {
        var splits = Splits.get(page);
        if (!splits.length)
            return null;

        for (var i = 0, l = splits.length; i < l; ++i) {
            if (splits[i] && splits[i].clone)
                return splits[i];
        }
        return null;
    },
    
    save: function() {
        if (!Settings.model)
            return;

        var node = apf.createNodeFromXpath(Settings.model.data, "splits");
        var i, l;
        for (i = node.childNodes.length - 1; i >= 0; --i)
            node.removeChild(node.childNodes[i]);
        
        var splits = Splits.get();
        var splitEl;
        for (i = 0, l = splits.length; i < l; ++i) {
            splitEl = apf.getXml("<split />");
            splitEl.setAttribute("pages", splits[i].pages.map(function(page) {
                return page.id;
            }).join(","));
            splitEl.setAttribute("active", Splits.isActive(splits[i]) ? "true" : "false");
            splitEl.setAttribute("layout", splits[i].gridLayout);
            node.appendChild(splitEl);
        }
        apf.xmldb.applyChanges("synchronize", node);
    },
    
    restore: function(settings) {
        // no tabs open... don't bother ;)
        var tabs = tabEditors;
        if (tabs.childNodes.length <= 1)
            return;
        
        var nodes = settings.selectNodes("splits/split");
        if (!nodes || !nodes.length)
            return;
        
        var activePage = tabs.getPage();
        var i, l, j, l2, ids, active, page, pages, pageSet, gridLayout;
        for (i = 0, l = nodes.length; i < l; ++i) {
            ids = nodes[i].getAttribute("pages").split(",");
            
            pages = [];
            pageSet = false;
            gridLayout = nodes[i].getAttribute("layout") || null;
            for (j = 0, l2 = ids.length; j < l2; ++j) {
                if (ids[j].indexOf("_clone") > -1) {
                    page = tabs.getPage(ids[j].replace("_clone", ""));
                    if (page) {
                        if (!pageSet) {
                            tabs.set(page);
                            pageSet = true;
                        }
                        this.startCloneView(page);
                    }
                }
                else {
                    page = tabs.getPage(ids[j]);
                    if (page) {
                        if (!pageSet) {
                            tabs.set(page);
                            pageSet = true;
                        }
                        Splits.mutate(null, page);
                    }
                }
            }
            if (gridLayout)
                Splits.update(null, gridLayout);

            if (apf.isTrue(nodes[i].getAttribute("active")))
                active = Splits.getActive();
        }
        
        if (!active || Splits.indexOf(active, activePage) == -1)
            tabs.set(activePage);
        else
            Splits.show(active);
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