define(function (require, exports, module) {

module.exports.strip = function (editor) {
    var session = editor.getSession()
    var source = session.getValue();
    var pos = editor.getCursorPosition();

    session.setValue(source.replace(/[ \t\r\f\v]+\n/g, "\n"));
    var lineLength = session.getLine(pos.row).length;
    editor.moveCursorTo(pos.row, pos.column >= lineLength ? lineLength : pos.column);
};

});
