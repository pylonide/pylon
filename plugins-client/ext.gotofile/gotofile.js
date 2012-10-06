/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var menus = require("ext/menus/menus");
var commands = require("ext/commands/commands");
var editors = require("ext/editors/editors");
var markup = require("text!ext/gotofile/gotofile.xml");
var search = require('ext/gotofile/search');
var filelist = require("ext/filelist/filelist");
var anims = require("ext/anims/anims");

module.exports = ext.register("ext/gotofile/gotofile", {
    name    : "Go To File",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : markup,
    offline : false,
    autodisable : ext.ONLINE | ext.LOCAL,

    eventsEnabled : true,
    dirty         : true,
    nodes         : [],
    arraySearchResults : [],
    arrayCache : [],
    arrayCacheLastSearch : [],

    isGeneric : window.cloud9config.local && window.cloud9config.workspaceId && window.cloud9config.workspaceId == "generic",

    hook : function(){
        var _self = this;

        var mnuItem = new apf.item({
            command : "gotofile"
        });

        commands.addCommand({
            name: "gotofile",
            hint: "search for a filename and jump to it",
            bindKey: {mac: "Command-E", win: "Ctrl-E"},
            exec: function () {
                if (!_self.isGeneric)
                    _self.toggleDialog(1);
                else {
                    ext.initExtension(_self);
                    winGoToFile.visible = true;
                    winGoToFile.hide();
                    winBlockGotoFile.show();
                }
            }
        });

        this.nodes.push(
            menus.addItemByPath("File/Open...", mnuItem, 500),
            menus.addItemByPath("Goto/Goto File...", mnuItem.cloneNode(false), 100),

            this.model = new apf.model(),
            this.modelCache = new apf.model()
        );

        ide.addEventListener("init.ext/editors/editors", function(){
            _self.markupInsertionPoint = tabEditors;
            //tabEditors.appendChild(winGoToFile);
        });

        ide.addEventListener("extload", function(){
            if (!_self.isGeneric) {
                _self.updateFileCache();
            }
        });
    },

    setEventsEnabled : function(enabled) {
        this.eventsEnabled = enabled;
    },

    init : function() {
        var _self = this;

        txtGoToFile.addEventListener("keydown", function(e) {
            if (!_self.eventsEnabled)
                return;

            if (e.keyCode == 27)
                _self.toggleDialog(-1);

            else if (e.keyCode == 13){
                _self.openFile(true);

                ide.dispatchEvent("track_action", {type: "gotofile"});
                return false;
            }
            else if (dgGoToFile.xmlRoot) {
                if (e.keyCode == 38 && dgGoToFile.viewport.length) {
                    if (dgGoToFile.selected == dgGoToFile.$cachedTraverseList[0])
                        return;

                    var prev = dgGoToFile.getNextTraverseSelected(dgGoToFile.selected, false);
                    if (prev) {
                        dgGoToFile.select(prev, e.ctrlKey, e.shiftKey);
                        dgGoToFile.focus();
                        e.preventDefault();
                    }
                }
                else if (e.keyCode == 40 && dgGoToFile.viewport.length && dgGoToFile.selected) {
                    var next = dgGoToFile.getNextTraverseSelected(dgGoToFile.selected);
                    if (next) {
                        dgGoToFile.select(next, e.ctrlKey, e.shiftKey);
                        dgGoToFile.focus();
                        e.preventDefault();
                    }
                }
            }
        });

        txtGoToFile.addEventListener("afterchange", function(e) {
            if (!_self.eventsEnabled)
                return;

            _self.filter(txtGoToFile.value);

            if (_self.dirty && txtGoToFile.value.length > 0 && _self.model.data) {
                _self.dirty = false;
                _self.updateFileCache(true);
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
                _self.openFile(true);
                return false;
            }
            else if (apf.isCharacter(e.keyCode)) {
                txtGoToFile.focus();
                return;
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

        ide.addEventListener("beforewatcherchange", function(){
            _self.dirty = true;
        });

        this.updateDatagrid(true);

        this.nodes.push(winGoToFile);
    },

    updateFileCache : function(isDirty){
        var _self = this;

        filelist.getFileList(isDirty, function(data, state){
            if (state != apf.SUCCESS)
                return;

            var array = data.replace(/^\./gm, "").split("\n");
            array.pop(); //remove trailing empty element;

            var start = "<d:href>";
            var end   = "</d:href>";
            var glue  = end + start;

            var c = array.length;
            var arrN = [];
            while(c--) { arrN.unshift(c); }

            data = apf.getXml("<d:multistatus  xmlns:d='DAV:'><d:response>"
                + start + arrN.join(glue) + end + "</d:response></d:multistatus>");

            _self.arrayCache = array;

            if (self.winGoToFile && _self.lastSearch) {
                winGoToFile.addEventListener("prop.visible", function(e){
                    if (e.value) {
                        var search = _self.lastSearch;
                        _self.lastSearch = null; //invalidate cache

                        var sel = [];
                        dgGoToFile.getSelection().forEach(function(node){
                            var i = node.firstChild.nodeValue;
                            sel.push(_self.arraySearchResults[i]);
                        })

                        var state = {
                            sel : sel, //store previous selection
                            caret : dgGoToFile.caret && _self.arraySearchResults[dgGoToFile.caret.firstChild.nodeValue],
                            scrollTop : dgGoToFile.$viewport.getScrollTop()
                        };

                        _self.model.load(data);
                        _self.filter(search, state.sel.length);

                        if (state.sel.length && state.sel.length < 100) {
                            var list = [], sel = state.sel;
                            for (var i = 0, l = sel.length; i < l; i++) {
                                list.push(dgGoToFile.queryNode("//d:href[text()='"
                                    + _self.arraySearchResults.indexOf(sel[i]) + "']"));
                            }
                            dgGoToFile.selectList(list);
                            if (state.caret)
                                dgGoToFile.setCaret(dgGoToFile.queryNode("//d:href[text()='"
                                    + _self.arraySearchResults.indexOf(state.caret) + "']"));
                            dgGoToFile.$viewport.setScrollTop(state.scrollTop);
                        }
                    }

                    winGoToFile.removeEventListener("prop.visible", arguments.callee);
                });
            }
            else {
                _self.arraySearchResults = array;
                _self.model.load(data);

                if (self.dgGoToFile)
                    _self.updateDatagrid();
            }
        });
    },

    /**
     * Searches through the dataset
     *
     */
    filter : function(keyword, nosel, force){
        if (!this.model.data) {
            this.lastSearch = keyword;
            return;
        }

        if (!keyword)
            this.arraySearchResults = this.arrayCache;
        else {
            var nodes;

            // Optimization reusing smaller result if possible
            if (this.lastSearch && keyword.indexOf(this.lastSearch) > -1)
                nodes = this.arrayCacheLastSearch;
            else
                nodes = this.arrayCache;

            var cache = [];

            dgGoToFile.$viewport.setScrollTop(0);

            this.arraySearchResults = search.fileSearch(nodes, keyword, cache);
            this.arrayCacheLastSearch = cache;
        }

        this.lastSearch = keyword;

        this.updateDatagrid();

        // See if there are open files that match the search results
        // and the first if in the displayed results

        if (nosel)
            return;

        var pages = tabEditors.getPages(), hash = {};
        for (var i = pages.length - 1; i >= 0; i--) {
            hash[pages[i].id] = true;
        }

        var nodes = dgGoToFile.getTraverseNodes();
        for (var i = Math.max(dgGoToFile.$viewport.limit - 3, nodes.length - 1); i >= 0; i--) {
            if (hash[ide.davPrefix + nodes[i].firstChild.nodeValue]) {
                dgGoToFile.select(nodes[i]);
                return;
            }
        }

        var selNode = dgGoToFile.getFirstTraverseNode();
        if (selNode)
            dgGoToFile.select(selNode);
    },

    updateDatagrid : function(init){
        var vp = dgGoToFile.$viewport;

        if(!this.arraySearchResults)
            return;

        if (!this.arraySearchResults.length) {
            if (init || !txtGoToFile.value) {
                dgGoToFile.clear("loading")
                this.filter("");
            }
            else {
                dgGoToFile.removeAttribute("height");
                dgGoToFile.clear("empty");
            }
        }
        else {
            dgGoToFile.$removeClearMessage();
            dgGoToFile.load(this.model.data);

            vp.length = this.arraySearchResults.length;
            var limit = Math.ceil(vp.getHeight() / vp.$getItemHeight() + 2);
            if (limit > vp.length)
                vp.resize(vp.length);
            else if (vp.length > limit && vp.limit != 11)
                vp.resize(Math.min(vp.length, 11));
            vp.change(0, vp.limit, true);

            setTimeout(function(){
                dgGoToFile.select(dgGoToFile.getFirstTraverseNode())
                txtGoToFile.focus();
            });
        }

        if (!vp.length) {
            if (this.arraySearchResults.length)
                dgGoToFile.setAttribute("height", 18);
        }
        else if (vp.length < 100) {
            var sh = vp.getScrollHeight();
            if (sh / vp.length == 1000)
                return setTimeout(arguments.callee.bind(dgGoToFile));

            var ht = Math.min(350, sh);
            if (ht != dgGoToFile.height)
                dgGoToFile.setAttribute("height", ht);
        }
        else if (dgGoToFile.height != 350) {
            dgGoToFile.setAttribute("height", 350);
        }
    },

    openFile: function(noanim){
        var nodes = dgGoToFile.getSelection();

        if (nodes.length == 0)
            return false;

        var _self = this;
        this.toggleDialog(-1, noanim, function(){
            setTimeout(function(){
                for (var i = 0, l = nodes.length; i < l; i++) {
                    var path = ide.davPrefix.replace(/[\/]+$/, "") + "/"
                        + _self.arraySearchResults[nodes[i].firstChild.nodeValue].replace(/^[\/]+/, "");

                    editors.gotoDocument({path: path, active : i == l - 1});

                    ide.dispatchEvent("track_action", {type: "fileopen"});
                }
            }, 10);
        });
    },

    gotofile : function(){
        if (!this.isGeneric)
            this.toggleDialog();
        else
            winBlockGotoFile.show();

        return false;
    },

    "_gotofilelegacy" : function(){
        this.toggleDialog();
        return false;
    },

    toggleDialog: function(force, noanim, callback) {
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

            if (!txtGoToFile.inited) {
                setTimeout(function(){
                    txtGoToFile.inited = true;
                    txtGoToFile.focus();
                });
            }
            else {
                txtGoToFile.focus();
            }

            // If we had a filter and new content, lets refilter
            if (this.lastSearch) {
                var search = this.lastSearch;
                this.lastSearch = null; //invalidate cache
                this.filter(search);
            }
            else {
                this.filter("");
            }
        }
        else if (self.winGoToFile && winGoToFile.visible) {
            if (!noanim) {
                winGoToFile.visible = false;

                //Animate
                anims.animate(winGoToFile, {
                    opacity: "0",
                    timingFunction: "linear",
                    duration : 0.025
                }, function(){
                    winGoToFile.visible = true;
                    winGoToFile.hide();

                    setTimeout(function() {
                        if (editors.currentEditor && editors.currentEditor.ceEditor)
                            editors.currentEditor.ceEditor.focus();
                    }, 0);

                    callback && callback();
                });
            }
            else {
                winGoToFile.hide();
                callback && callback();
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
        commands.removeCommandByName("gotofile");

        this.nodes.each(function(item){
            item.destroy(true, true);
        });
        winGoToFile.destroy(true, true);
        this.nodes = [];
    }
});

});