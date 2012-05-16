/**
 * Module that implements outlines
 * Currently DISABLED
 */
define(function(require, exports, module) {

var editors = require("ext/editors/editors");
var ide = require("core/ide");
var Document = require('ace/document').Document;
var menus = require("ext/menus/menus");

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

        ext.nodes.push(
            menus.addItemByPath("Edit/Format J", new apf.item({
                onclick: function() {
                    editor = editors.currentEditor.amlEditor.$editor;
                    worker.emit("code_format", {data: {}});
                }
            }))
        );
    }
};

});