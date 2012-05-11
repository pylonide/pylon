/**
 * Module that implements outlines
 * Currently DISABLED
 */
define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var ide = require("core/ide");
var Document = require('ace/document').Document;

module.exports = {

	hook: function(ext, worker) {
        var _self = this;
        var editor;
        worker.on("code_format", function(event) {
        	if (editor) {
            	editor.getSession().getDocument().setValue(event.data);
            	editor = null;
            }
        });

        var formatItem = new apf.item({
            caption: "Code format",
            onclick: function() {
            	editor = editors.currentEditor.amlEditor.$editor;
                worker.emit("code_format", {data: {}});
            }
        });
        var node = ide.mnuEdit.appendChild(formatItem);
        ext.nodes.push(node);
    }
};

});