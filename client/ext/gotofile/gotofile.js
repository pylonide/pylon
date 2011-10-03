/**
 * Code Editor for the Cloud9 IDE
 *
 * @copyright 2010, Ajax.org B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */

define(function(require, exports, module) {

var ide = require("core/ide");
var ext = require("core/ext");
var fs = require("ext/filesystem/filesystem");
var settings = require("ext/settings/settings");
var tree = require("ext/tree/tree");
var editors = require("ext/editors/editors");
var markup = require("text!ext/gotofile/gotofile.xml");
        
module.exports = ext.register("ext/gotofile/gotofile", {
    name    : "Filter Tree",
    dev     : "Ajax.org",
    alone   : true,
    offline : false,
    type    : ext.GENERAL,
    markup  : markup,
    offline : 0,
    command : "quickopen",
    lastSearchTerm : "",
    commands : {
        "gotofile": {hint: "search for a filename and jump to it"}
    },
    hotitems: {},

    nodes   : [],

    hook : function(){
        var _self = this;
        
        ide.addEventListener("socketConnect", function(e){
            ide.socket.send(JSON.stringify({
                command : _self.command,
                subcommand : "load"
            }));
        });

        ide.addEventListener("socketMessage", this.onMessage.bind(this));

        this.nodes.push(
            mnuFile.insertBefore(new apf.item({
                caption : "Open...",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }), mnuFile.firstChild),
            
            ide.barTools.appendChild(new apf.button({
                id      : "btnOpen",
                icon    : "open.png",
                width   : 29,
                tooltip : "Open...",
                skin    : "c9-toolbarbutton",
                onclick : function() {
                    _self.toggleDialog(true);
                }
            }))
        );
        
        this.hotitems["gotofile"] = [this.nodes[0]];
    },

    init : function() {
        var _self = this;
        txtGoToFile.addEventListener("keyup", function(e){
            setTimeout(function() {
            if (txtGoToFile.value == "") {
                mdlGoToFile.clear();
                return;
            }
            
            if (txtGoToFile.value.length >= 3) {
                var term = txtGoToFile.value;
                if (term != _self.lastSearchTerm) {
                    _self.searchFiles(term);
                    _self.lastSearchTerm = term;
                }
            }
            });
        });

        txtGoToFile.addEventListener("keydown", function(e){
            if (e.keyCode == 13){
                var node = trFiles.xmlRoot.selectSingleNode("folder[1]");
                mdlGoToFile.load("{davProject.report('" + node.getAttribute("path")
                    + "', 'filesearch', {query: '" + txtGoToFile.value + "'})}");
                ide.dispatchEvent("track_action", {type: "gotofile"});
            }
            else if (e.keyCode == 40 && dgGoToFile.length) {
                var first = dgGoToFile.getFirstTraverseNode();
                if (first) {
                    dgGoToFile.select(first);
                    dgGoToFile.focus();
                }
            }
        });
        
        var restricted = [38, 40, 36, 35];
        dgGoToFile.addEventListener("keydown", function(e) {
            if (e.keyCode == 38) {
                if (this.selected == this.getFirstTraverseNode())
                    txtGoToFile.focus();
            }
            else if (restricted.indexOf(e.keyCode) == -1) {
                txtGoToFile.focus();
            }
        }, true);

        dgGoToFile.addEventListener("afterchoose", function(e) {
            winGoToFile.hide();
            var path = ide.davPrefix + apf.getTextNode(e.xmlNode).nodeValue;
            editors.showFile(path, 0, 0);
            ide.dispatchEvent("track_action", {type: "fileopen"});
        });
        
        this.nodes.push(winGoToFile);
    },
    
    searchFiles : function(term) {
        var rx = new RegExp('"([^"]*' + term + '[^"]*)"', 'gi');
        var i = 0, results = '<d:multistatus xmlns:d="DAV:"><d:response>';
        var resArr = [];
        while (result = rx.exec(this.filesTestAgainst)) {
            resArr.push(result[1]);
            if (++i >= 50)
                break;
        }

        var rankedArr = [], unRankedArr = [];
        var termLwr = term.toLowerCase();
        for (i = 0; i < resArr.length; i++) {
            var filename = apf.getFilename(resArr[i]).toLowerCase();
            var matchIndex = filename.indexOf(termLwr);
            if (matchIndex != -1)
                rankedArr.splice(matchIndex, 0, resArr[i]);
            else
                unRankedArr.push(resArr[i]);
        }

        rankedArr.length ? results += "<d:href>" : "";
        results += rankedArr.join("</d:href><d:href>");
        rankedArr.length ? results += "</d:href>" : "";
        unRankedArr.length ? results += "<d:href>" : "";
        results += unRankedArr.join("</d:href><d:href>");
        unRankedArr.length ? results += "</d:href>" : "";
        results += '</d:response></d:multistatus>';
        mdlGoToFile.load(results);
    },

    gotofile : function(){
        this.toggleDialog(true);
        return false;
    },

    toggleDialog: function(forceShow) {
        ext.initExtension(this);
        
        if (!winGoToFile.visible || forceShow)
            winGoToFile.show();
        else
            winGoToFile.hide();
        return false;
    },

    onMessage: function(e) {
        var message = e.message;

        if (message.type != "result" && message.subtype != this.command)
            return;

        var arr = message.body.out;
        this.filesTestAgainst = "\"" + message.body.out.join("\"\"") + "\"";
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
        winGoToFile.destroy(true, true);
        this.nodes = [];
    }
});

});