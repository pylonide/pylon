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
        if (split && split.pages.indexOf(curr) > -1)
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
        Splits.update();
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
        var activePage = tabEditors.getPage();
        var shiftKey = e.htmlEvent.shiftKey;
        var ret = null;
        var split = Splits.get(activePage);
        split = split.length ? split[0] : null;

        if (split && !shiftKey) {
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
        //console.log("got split?",split);
        
        // hide the previous split view
        if (previous && previous.$model) {
            var oldSplit = Splits.get(previous);
            oldSplit = oldSplit.length ? oldSplit[0] : null;
            //console.log("got old split?",oldSplit);
            if (oldSplit && !split) {
                Splits.hide(oldSplit);

                // make sure that the editor of the next page is in it's expected
                // position
                var nextPage = next.fake ? next.relPage : next;
                nextPage.appendChild(next.$editor.amlEditor);
            }
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
            var page = split.clone;
            var editor = page.$editor;
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
        else {
            // TODO: please test switching of tabs between normal tabs and split
            // views right after uncommenting the line below:
            //consolidateEditorSession(next, split.editors[split.pages.indexOf(next)]);
        }
        
        apf.layout.forceResize();
        
        this.save();
    },
    
    changeLayout: function(page, gridLayout) {
        var split = Splits.get(page);
        if (!split.length || split.gridLayout == gridLayout)
            return;
        
        Splits.update(split[0], gridLayout);
        mnuSplitAlign.setAttribute("checked", gridLayout == "3rows");
        this.save();
    },
    
    /**
     * 
     */
    startCloneView: function(page) {
        var split = this.getCloneView(page);
        var doc  = page.$doc;
        
        if (split || !doc || !this.getEditorSession(page))
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
            if (typeof tabEditors == "undefined")
                return;
            tabEditors.remove(fake);
        });
        
        Editors.initEditorEvents(fake, page.$model);
        
        Splits.mutate(null, fake);
        
        split = Splits.get(fake)[0];
        split.clone = fake;
        
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
    
    getEditorSession: function(page) {
        var doc = page.$doc;
        return doc.acesession || doc.session || null;
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
        if (tabEditors.childNodes.length <= 1)
            return;
        
        var nodes = settings.selectNodes("splits/split");
        if (!nodes || !nodes.length)
            return;
        
        var tabs = tabEditors;
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
        
        if (active) {
            tabs.set(active.pages[0]);
            Splits.update(active);
            mnuSplitAlign.setAttribute("checked", active.gridLayout == "3rows");
            mnuCloneView.setAttribute("checked", !!active.clone);
        }
        else
            tabs.set(activePage);
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