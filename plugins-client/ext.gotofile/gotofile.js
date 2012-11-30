/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
/*global winGoToFile winBlockGotoFile tabEditors txtGoToFile dgGoToFile vboxGoToFile*/

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
var themes = require("ext/themes/themes");

module.exports = ext.register("ext/gotofile/gotofile", {
    name    : "Go To File",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : markup,
    autodisable : ext.ONLINE | ext.LOCAL,

    eventsEnabled : true,
    dirty         : true,
    nodes         : [],
    arraySearchResults : [],
    arrayCache : [],

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

            this.model = new apf.model()
        );

        ide.addEventListener("init.ext/editors/editors", this.$initEditorExt = function(){
            _self.markupInsertionPoint = tabEditors;
            //tabEditors.appendChild(winGoToFile);
        });

        ide.addEventListener("extload", this.$extLoad = function(){
            if (!_self.isGeneric) {
                _self.updateFileCache();
            }
        });

        ide.addEventListener("closefile", this.$closeFile = function() {
            setTimeout(function(){
                _self.updateWinPos();
            });
        });

        ide.addEventListener("newfile", this.$newFile = function() {
            _self.updateFileCache(true);
        });

        ide.addEventListener("removefile", this.$removeFile = function() {
            _self.updateFileCache(true);
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

        winGoToFile.addEventListener("prop.visible", function(e){
            if (e.value) {
                _self.updateWinPos();
            }
        });

        txtGoToFile.addEventListener("blur", function(e){
            if (self.winGoToFile && winGoToFile.visible
              && !apf.isChildOf(winGoToFile, e.toElement))
                _self.toggleDialog(-1);
        });

        ide.addEventListener("closepopup", this.$closepopup = function(e){
            if (e.element != _self)
                _self.toggleDialog(-1, true);
        });

        ide.addEventListener("beforewatcherchange", this.$beforewatcherchange = function(){
            _self.dirty = true;
        });

        this.updateDatagrid(true);

        this.nodes.push(winGoToFile);

        this.updateWinPos();
    },

    updateWinPos : function(){
        if (!window.winGoToFile)
            return;

        if (!ide.getActivePage() || !themes.isDark) {
            winGoToFile.setProperty("top", 0);
            vboxGoToFile.setProperty("edge", "5 5 5 5");

            winGoToFile.$ext.style.top = 0;
        }
        else {
            winGoToFile.setProperty("top", 6);
            vboxGoToFile.setProperty("edge", "1 5 5 5");

            winGoToFile.$ext.style.top = "6px";
        }
    },

    windowVisible : function(winValue, data){
        var _self = this;
        if (winValue) {
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
                var list = [];
                sel = state.sel;
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
            var i = 0;
            var arrN = [];
            while(i < c) { arrN.push(i++); }

            data = apf.getXml("<d:multistatus  xmlns:d='DAV:'><d:response>"
                + start + arrN.join(glue) + end + "</d:response></d:multistatus>");

            _self.arrayCache = array;

            if (self.winGoToFile && _self.lastSearch) {
                if (!winGoToFile.visible) {
                    var $winGoToFileProVisible;
                    winGoToFile.addEventListener("prop.visible", $winGoToFileProVisible = function(e){
                        _self.windowVisible(e.value, data);

                        winGoToFile.removeEventListener("prop.visible", $winGoToFileProVisible);
                    });
                 }
                 else {
                     _self.windowVisible(true, data);
                 }
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
        keyword = keyword.replace(/\*/g, "");

        if (!this.model.data) {
            this.lastSearch = keyword;
            return;
        }

        if (!keyword || !keyword.length) {
            var result = this.arrayCache.slice();
            // More prioritization for already open files
            tabEditors.getPages().forEach(function (page) {
                var path = page.$doc.getNode().getAttribute("path")
                     .substring(window.cloud9config.davPrefix.length);
                result.remove(path);
                result.unshift(path);
            });
            this.arraySearchResults = result;
        }
        else {
            dgGoToFile.$viewport.setScrollTop(0);
            this.arraySearchResults = search.fileSearch(this.arrayCache, keyword);
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
        if (!nodes)
            return;

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

    replaceStrong : function (value, keyword){
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
    },

    updateDatagrid : function(init){
        var vp = dgGoToFile.$viewport;

        if(!this.arraySearchResults)
            return;

        if (!this.arraySearchResults.length) {
            if (init || !txtGoToFile.value) {
                dgGoToFile.clear("loading");
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
                dgGoToFile.select(dgGoToFile.getFirstTraverseNode());
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

        if (nodes.length === 0)
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
                dgGoToFile.$setClearMessage(dgGoToFile["loading-message"], "loading");
                apf.setOpacity(winGoToFile.$ext, 1);
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
                        if (editors.currentEditor && editors.currentEditor.amlEditor)
                            editors.currentEditor.amlEditor.focus();
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

    destroy : function(){
        commands.removeCommandByName("gotofile");
        winGoToFile.destroy(true, true);
        this.$destroy();

        ide.removeEventListener("init.ext/editors/editors", this.$initEditorExt);
        ide.removeEventListener("extload", this.$extLoad);
        ide.removeEventListener("closefile", this.$closeFile);
        ide.removeEventListener("newfile", this.$newFile);
        ide.removeEventListener("removefile", this.$removeFile);
        ide.removeEventListener("closepopup", this.$closepopup);
        ide.removeEventListener("beforewatcherchange", this.$beforewatcherchange);
    }
});

});