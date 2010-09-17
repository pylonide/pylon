require.def("ext/tree/treeutil", [], function() {

var exports = {};

exports.getPath = function(fileEl) {
    var path = [fileEl.getAttribute("name")];

    while (fileEl.parentNode.tagName == "folder") {
        fileEl = fileEl.parentNode;
        path.push(fileEl.getAttribute("name"));
    }

    return path.reverse().join("/");
};

return exports;

});