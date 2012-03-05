onmessage = function(e) {
    var annos = e.data;
    var aceerrors = 0;
    var outXml = "<annotations>";
    for (var ai in annos) {
        for (j = 0; j < annos[ai].length; j++) {
            if (annos[ai][j].type == "error")
                aceerrors++;
            var line_num = parseInt(annos[ai][j].row, 10) + 1;
            outXml += '<annotation line="' + line_num +
                    '" text="' + annos[ai][j].text +
                    '" type="' + annos[ai][j].type + '" />';
        }
    }

    outXml += "</annotations>";
    postMessage({ outXml: outXml, errors: aceerrors});
};