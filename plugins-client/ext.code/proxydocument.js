define(function (require, exports, module) {

var oop = require('ace/lib/oop');
var Document = require('ace/document').Document;

var ProxyDocument = function (document) {
    this.$onChange = this.onChange.bind(this);
    this.setDocument(document);
};

oop.inherits(ProxyDocument, Document);

(function() {
    this.getDocument = function () {
        return this.doc;
    };

    this.setDocument = function (newDocument) {
        if (this.doc == newDocument)
            return this.doc;

        if (this.doc) {
            this.doc.removeEventListener("change", this.$onChange);
        }

        this.doc = newDocument;
        this.doc.addEventListener("change", this.$onChange);

        return this.doc;
    };

    this.onChange = function(e) {
        this._dispatchEvent("change", e);
    };

    this.getNewLineCharacter = function () {
        return this.doc.getNewLineCharacter();
    };

    this.setNewLineMode = function (mode) {
        return this.doc.setNewLineMode(mode);
    };

    this.getNewLineMode = function () {
        return this.doc.getNewLineMode();
    };

    this.getLength = function () {
        return this.doc.getLength();
    };

    this.getLine = function (row) {
        return this.doc.getLine(row);
    };

    this.getLines = function (startRow, endRow) {
        return this.doc.getLines(startRow, endRow);
    };

    this.getTextRange = function (range) {
        return this.doc.getTextRange(range);
    };

    this.insert = function (position, text) {
        return this.doc.insert(position, text);
    };

    this.insertNewLine = function (position) {
        return this.doc.insertNewLine(position);
    };

    this.insertInLine = function (position, text) {
        return this.doc.insertInLine(position, text);
    };

    this.insertLines = function (row, lines) {
        return this.doc.insertLines(row, lines);
    };

    this.removeNewLine = function (row) {
        return this.doc.removeNewLine(row);
    };

    this.removeInLine = function (row, startColumn, endColumn) {
        return this.doc.removeInLine(row, startColumn, endColumn);
    };

    this.removeLines = function (startRow, endRow) {
        return this.doc.removeLines(startRow, endRow);
    };

    this.applyDeltas = function (deltas) {
        return this.doc.applyDeltas(deltas);
    };

    this.revertDeltas = function (deltas) {
        return this.doc.revertDeltas(deltas);
    };
}).call(ProxyDocument.prototype);

module.exports = ProxyDocument;

});