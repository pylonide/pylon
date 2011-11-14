/**
 * Show a split view; two editors next to each other in one tab
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var css = require("text!ext/splitview/splitview.css");
var Code = require("ext/code/code");
var Tabbehaviors = require("ext/tabbehaviors/tabbehaviors");
var Editors = require("ext/editors/editors");

var EditSession = require("ace/edit_session").EditSession;

var Layouts = [
    null,
"\
+--+--+--+\n\
|  |  |  |\n\
+--+--+--+", 
// vbox
//   --> hbox
//         --> splitter
//         --> splitter

"\
+-----+\n\
|     |\n\
+-----+\n\
|     |\n\
+-----+\n\
|     |\n\
+-----+",
// vbox
//   --> splitter
//   --> splitter

"\
+--+--+\n\
|  |  |\n\
|  +--+\n\
|  |  |\n\
+--+--+",
// vbox
//   --> hbox
//         --> splitter
//         --> vbox
//               --> splitter

"\
+--+--+\n\
|  |  |\n\
+--+  |\n\
|  |  |\n\
+--+--+",
// vbox
//   --> hbox
//         --> vbox
//               --> splitter
//         --> splitter

"\
+--+--+\n\
|  |  |\n\
+--+--+\n\
|     |\n\
+-----+",
// vbox
//   --> hbox
//         --> splitter
//   --> splitter

"\
+-----+\n\
|     |\n\
+--+--+\n\
|  |  |\n\
+--+--+"
// vbox
//   --> splitter
//   --> hbox
//         --> splitter
];

var Grids = [null];

var vbox = "vbox";
var hbox = "hbox";
var activeClass = "splitview_active";
var inactiveClass = "splitview_inactive";

var mnuCloneView, mnuSplitAlign;

function createGrids(page) {
    var amlPage = page.fake ? page.relPage : page;
    if (amlPage.$grids)
        return amlPage.$grids;

    amlPage.$grids = [null];
    // first:
    var grid = amlPage.$grids[1] = {
        main: amlPage.appendChild(new apf.vbox({anchors: "0 0 0 0"}))
    };
    grid.single = grid.main.appendChild(new apf.hbox({flex: 1, padding: 0}));
    grid.double = grid.single;
    grid.splitters = [];
    
    // second:
    grid = amlPage.$grids[2] = {
        main: amlPage.appendChild(new apf.vbox({anchors: "0 0 0 0"}))
    };
    grid.single = grid.double = grid.main;
    grid.splitters = [];
    
    return amlPage.$grids;
}

function createSplitView(page, layout, type) {
    layout = layout || 1;
    type = type || null;
    var grid = createGrids(page)[layout];
    var editor = page.$editor.amlEditor;
    
    var split = {
        editors: [editor],
        pages: [page],
        grid: grid
    };
    addEditorListeners.call(this, editor);
    this.splits.push(split);

    if (type == "clone") {
        if (!this.$cloneEditor) {
            var markup = "<a:application xmlns:a=\"http://ajax.org/2005/aml\">"
                + getEditorMarkup(editor).replace(/id="[\w]*"/, "id=\"ceCloneEditor\"")
                + "</a:application>";
            apf.document.body.insertMarkup(markup);
            
            this.$cloneEditor = ceCloneEditor;
            addEditorListeners.call(this, this.$cloneEditor);
        }
        split.editors.push(this.$cloneEditor);
    }
    
    return split;
}

function sortEditorsAndPages(split) {
    // lstOpenFiles.$model.data.selectNodes("//file")
    var pages = tabEditors.getPages();
    var p = [];
    var e = [];
    var index;
    //console.log("before sort: ", [].concat(split.pages).map(function(p) { return p.name; }), 
    //  [].concat(split.editors).map(function(e) { return e.id; }));
    for (var i = 0, c = 0, l = pages.length, l2 = split.pages.length; i < l && c < l2; ++i) {
        if ((index = split.pages.indexOf(pages[i])) > -1) {
            //console.log("pushing page at index " + i + " which is in the split at " 
            //  + index + ", names " + pages[i].name + ", " + split.pages[index].name);
            p.push(split.pages[index]);
            e.push(split.editors[index]);
            ++c;
        }
    }
    //console.log("after sort:", p.map(function(p) { return p.name; }), e.map(function(e) { return e.id; }));
    split.pages = p;
    split.editors = e;
}

function hideGrids(amlPage, exception) {
    // make sure all the editors are kept safe:
    for (var name in EditorClones) {
        EditorClones[name].forEach(function(editor) {
            //console.log("hiding editor:", editor.id);
            apf.document.body.appendChild(editor);
            editor.hide();
        });
    }
    
    amlPage.$grids.forEach(function(g) {
        if (!g)
            return;
            
        var vis = (g === exception);
        
        // remove all splitters first
        //console.log("splitters:", g.single.getElementsByTagName("a:splitter").length, "vs", g.splitters.length)
        for (i = g.splitters.length - 1; i >= 0; --i) {
            if (g.splitters[i].parentNode) {
                //console.log("removing splitter:",g.splitters[i]);
                g.splitters[i].parentNode.removeChild(g.splitters[i]);
            }
            else {
                //console.log("removing splitter without parentNode:",g.splitters[i]);
                g.splitters[i].destroy();
            }
            g.splitters.splice(i, 1);
        }
        
        g.main.setAttribute("visible", vis);
    });
}

function updateSplitViewGrid(split, layout) {
    layout = layout || split.layout || 1;
    
    var editor, splitter, i, l;
    var page = split.pages[0];

    var grid = split.grid = createGrids(page)[layout];
    var amlPage = page.fake ? page.relPage : page;
    split.layout = layout;
    
    // destroy the split view if it contains NOT more than 1 editor.
    //console.log("number of pages in split view:", split.pages.length,"vs editors:", 
    //  split.editors.length,page.name,split.pages.map(function(page){return page.name}));
    if (split.pages.length === 1) {
        editor = page.$editor.amlEditor;
        editor.removeAttribute("model");
        editor.removeAttribute("actiontracker");
        amlPage.appendChild(editor);
        editor.show();
        removeEditorListeners(editor);
        removeEditorListeners(split.editors[0]);
        clearSplitViewStyles(page);
        
        hideGrids(amlPage);
        
        for (i = this.splits.length - 1; i >= 0; --i) {
            if (this.splits[i] !== split)
                continue;
            this.splits.splice(i, 1);
            break;
        }
        // split removed, use the escape hatch...
        return;
    }
    
    // make sure current grid is the only one visible.
    hideGrids(amlPage, grid);

    // sort the editors and pages before being added to the grid
    sortEditorsAndPages(split);
    //console.log("split editors:", split.editors.length, split.editors.map(function(e) { return e.id; }));
    for (i = 0, l = split.editors.length; i < l; ++i) {
        editor = split.editors[i];
        if (i === 0) {
            grid.single.appendChild(editor);
            grid.splitters.push(
                grid.single.appendChild(new apf.splitter({ skin: "darksplitter" }))
            );
        }
        else {
            if (i === 2) {
                grid.splitters.push(
                    grid.double.appendChild(new apf.splitter({ skin: "darksplitter" }))
                );
            }
            grid.double.appendChild(editor);
        }
        // make sure it's visible!
        editor.show();
    }
    //console.log("updating end.");
}

var EditorClones = {};

function getEditorMarkup(editor) {
    if (!editor.$aml || !editor.$aml.xml || editor.$aml.xml.indexOf("<empty") === 0)
        throw new Error("Editor can not be cloned, no XML present");
    return editor.$aml.xml.replace(/debugger[\s\t]*=[\s\t]*"[^"]*"[\s\t]*/i, "");
}

function createEditorClones(editor) {
    var id = editor.id || editor.name || editor.tagName;
    if (EditorClones[id] && EditorClones[id].length)
        return EditorClones[id];

    EditorClones[id] = [];
    var ids = [];
    var markup = ["<a:application xmlns:a=\"http://ajax.org/2005/aml\">"]
    var editorMarkup = getEditorMarkup(editor);
    var _self = this;
    
    for (var i = 0; i < 2; ++i) {
        markup.push(editorMarkup.replace(/id="[\w]*"/, "id=\"" + id + i + "\""));
        ids.push(id + i);
    }
    
    apf.document.body.insertMarkup(markup.join("") + "</a:application>");
    ids.forEach(function(eid) {
        var o = self[eid];
        EditorClones[id].push(o);
        apf.document.body.appendChild(o);
        addEditorListeners.call(_self, o);
    });
    return EditorClones[id];
}

function addEditorListeners(editor) {
    if (editor.$splitListener)
        return;
    var _self = this;
    editor.addEventListener("focus", editor.$splitListener = function(e) {
        //console.log("got focus?", editor.id);
        _self.onEditorFocus(editor);
    });
}

function removeEditorListeners(editor) {
    if (!editor.$splitListener)
        return;
    editor.removeEventListener("focus", editor.$splitListener);
    delete editor.$splitListener;
}

function getEditorSession(page) {
    var doc = page.$doc;
    return doc.acesession || doc.session || null;
}

function consolidateEditorSession(page, editor) {
    var session = getEditorSession(page);
    if (!session && page.$editor.setDocument)
        page.$editor.setDocument(page.$doc, page.$at);
    session = getEditorSession(page)
    if (editor.value !== session)
        editor.setProperty("value", session);
}

function clearSplitViewStyles(splitOrPage) {
    var pages = (typeof splitOrPage.tagName != "undefined") ? [splitOrPage] : split.pages;
    pages.forEach(function(page) {
        apf.setStyleClass(page.$button, null, [activeClass, inactiveClass]);
    });
}

module.exports = ext.register("ext/splitview/splitview", {
    name     : "Split View",
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
            parent.appendChild(new apf.divider()),
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
                        _self.changeLayout(tabEditors.contextPage, this.checked ? 1 : 2);
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
            var split = _self.getSplitViewByPage(page);
            
            if (split) {
                updateSplitViewGrid(split);
            }
        });
    },
    
    mergetableft: function() {
        return this.mergeTab("left");
    },
    
    mergetabright: function() {
        return this.mergeTab("right");
    },
    
    mergeTab: function(dir) {
        var bRight  = dir == "right",
            tabs    = tabEditors,
            pages   = tabs.getPages(),
            curr    = tabs.getPage(),
            currIdx = pages.indexOf(curr);
        if (!curr || pages.length == 1)
            return;
        var idx = currIdx + (bRight ? 1 : -1);
        if (idx < 0)
            idx = pages.length - 1;
        if (idx > pages.length -1)
            idx = 0;

        this.mutateSplitView(pages[idx]);
        return false;
    },
    
    /**
     * Invoked when a file is closed
     *
     * @param {AmlEvent} e
     */
    onFileClose: function(e) {
        var page = e.page;
        
        if (this.isSplitViewPage(page)) {
            this.mutateSplitView(page);
        }
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

        if (this.isSplitViewPage(page) && !shiftKey) {
            var split = this.getSplitViewByPage(page);
            var activePage = tabEditors.getPage();
            var ret = null;
            
            for (i = 0, l = split.pages.length; i < l; ++i) {
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
            
            if (!shiftKey) {
                return true;
            }
            
            return ret;
        }

        if (!shiftKey)
            return;
            
        // tabs can be merged into and unmerged from a splitview by clicking a
        // tab while holding shift
        return !this.mutateSplitView(page)
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
        
        var split = this.getSplitViewByPage(pages[idx]);
        //console.log("cycletab split?", split, pages[idx], e);
        if (!split)
            return;
        
        var start = split.pages.indexOf(pages[idx]);
        
        function correct(val) {
            if (val < 0)
                return pages.length - 1;
            if (val > pages.length -1)
                return 0;
            return val;
        }
        
        //console.log("tab is cycling...", dir);
        var count = 0
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
    
    onEditorFocus: function(editor) {
        var splits = this.getSplitViewsByEditor(editor);

        splits.forEach(function(split) {
            var activePage = split.pages[split.editors.indexOf(editor)];
            split.pages.forEach(function(page) {
                if (page === activePage)
                    apf.setStyleClass(page.$button, activeClass, [inactiveClass]);
                else
                    apf.setStyleClass(page.$button, inactiveClass, [activeClass]);
            });
        });
    },
    
    /**
     * 
     */
    startCloneView: function(page) {
        var view = this.getCloneView(page);
        var doc  = page.$doc;
        
        if (view || !doc || !getEditorSession(page))
            return;
        
        var view = createSplitView.call(this, page, 1, "clone");
        var editor = view.editors[1];

        fake = tabEditors.add("{([@changed] == 1 ? '*' : '') + [@name]}", page.$model.data.getAttribute("path") 
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
    
    mutateSplitView: function(page) {
        var i, l;
        
        var activePage = tabEditors.getPage();
        var activeSplit = this.getSplitViewByPage(activePage);
        var pageIdx = activeSplit ? activeSplit.pages.indexOf(page) : -1;
        var _self = this;
                
        // Remove an editor from the split view
        if (pageIdx > -1) {
            if (activeSplit.clone && activeSplit.clone === page)
                return this.endCloneView(page);

            var editorIdx = pageIdx;
            activeSplit.pages.splice(pageIdx, 1);
            editor = activeSplit.editors[editorIdx];
            activeSplit.editors.splice(editorIdx, 1);
            editor.removeAttribute("model");
            editor.removeAttribute("actiontracker");
            removeEditorListeners(editor);
            
            // use setTimout to circumvent the APF layout manager to go bonkers
            setTimeout(function() {
                page.$deactivateButton();

                clearSplitViewStyles(page);
                editor.hide();
                if (tabEditors.getPage() !== activeSplit.pages[0])
                    tabEditors.set(activeSplit.pages[0]);
                //updateSplitViewGrid.call(_self, activeSplit);
                _self.updateSplitView(null, activeSplit.pages[0]);
            });
        }
        // Add an editor to the split view
        else if (!activeSplit || activeSplit.editors.length < 3) {
            var editors = createEditorClones.call(this, page.$editor.amlEditor);
            var editor = null;
            
            if (!activeSplit) {
                if (page === activePage)
                    return true;
                
                // check whether 'page' is already part of a split view
                var pageToBeJoinedInSplitView = this.getSplitViewByPage(page);
                if (pageToBeJoinedInSplitView) {
                    // if active, then find that split and remove it
                    this.splits.splice(this.splits.indexOf(this.getSplitViewByPage(page)))
                }
                    
                activeSplit = createSplitView.call(this, activePage);
                var oEditor = activePage.$editor.amlEditor;
                oEditor.setAttribute("model", activePage.$model);
                oEditor.setAttribute("actiontracker", activePage.$at);
            }
            for (i = 0, l = editors.length; i < l; ++i) {
                if (activeSplit.editors.indexOf(editors[i]) === -1) {
                    editor = editors[i];
                    break;
                }
            }
            if (!editor && activeSplit.editors.indexOf(page.$editor.amlEditor) === -1)
                editor = page.$editor.amlEditor;
            
            activeSplit.pages.push(page);
            activeSplit.editors.push(editor);
            //console.log("setting model of ", editor.id, "to", page.$model.data.xml);
            editor.setAttribute("model", page.$model);
            editor.setAttribute("actiontracker", page.$at);
            consolidateEditorSession(page, editor);
            addEditorListeners.call(_self, editor);
            
            // use setTimout to circumvent the APF layout manager to go bonkers
            setTimeout(function() {
                editor.show();
                _self.updateSplitView(null, page);
                page.$activateButton();
            });
        }

        return true;
    },
    
    updateSplitView: function(previous, next) {
        var i, l;
        var doc = next.$doc;
        var at  = next.$at;
        // check if this is a valid clone session
        var split = this.getSplitViewByPage(next);
        
        // hide the previous clone session (if any)
        if (previous && previous.$model) {
            var oldSplit = this.getSplitViewByPage(previous);
            if (oldSplit) {
                // start at one, the first page is already deactivated.
                for (i = 0, l = oldSplit.pages.length; i < l; ++i)
                    oldSplit.pages[i].$deactivateButton();
                
                // the next page is NOT a split view
                if (!split) {
                    var oldPage = previous.fake ? previous.relPage : previous;
                    var nextPage = next.fake ? next.relPage : next;
                    //oldPage.appendChild(nextPage.firstChild);
                    hideGrids(oldPage);
                    nextPage.appendChild(next.$editor.amlEditor);
                    next.$editor.amlEditor.show();
                }
            }
        }
        
        mnuCloneView.setAttribute("checked", false);
        mnuSplitAlign.setAttribute("checked", true);

        // all this must exist
        if (!doc || !at || !split) {
            next.$editor.amlEditor && next.$editor.amlEditor.show();
            return;
        }
        
        updateSplitViewGrid.call(this, split);
        mnuSplitAlign.setAttribute("checked", split.layout === 1);
        
        split.pages.forEach(function(page, idx) {
            page.$activateButton();
            var editor = split.editors[idx];
            if (!editor)
                return;
            var session = getEditorSession(page);
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
    
    changeLayout: function(page, layout) {
        var split = this.getSplitViewByPage(page);
        if (!split || split.layout === layout)
            return;
        
        updateSplitViewGrid.call(this, split, layout);
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
    
    getSplitViewByPage: function(page) {
        var split, i, l;
        for (var i = 0, l = this.splits.length; i < l; ++i) {
            split = this.splits[i];
            if (!split || split.pages.indexOf(page) === -1)
                continue;
            return split;
        }
        
        return null;
    },
    
    getSplitViewsByEditor: function(editor) {
        var split, i, l;
        var splits = [];
        for (var i = 0, l = this.splits.length; i < l; ++i) {
            split = this.splits[i];
            if (!split || split.editors.indexOf(editor) === -1)
                continue;
            splits.push(split);
        }
        
        return splits;
    },
    
    isSplitViewPage: function(page) {
        return !!this.getSplitViewByPage(page);
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