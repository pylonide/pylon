onmessage = function(e) {
    var annos = e.data,
      lineNums = [],
      aceerrors = 0,
      acewarnings = 0,
      lastLine = -1,
      outXml = "<annotations>";

    for (var ai in annos) {
        for (j = 0; j < annos[ai].length; j++) {
            var line_num = parseInt(annos[ai][j].row, 10) + 1;
            if (line_num != lastLine) {
                if (annos[ai][j].type == "error")
                    aceerrors++;
                else if (annos[ai][j].type == "warning")
                    acewarnings++;
            }

            lineNums.push(line_num);

            outXml += '<annotation line="' + line_num +
                    '" text="' + annos[ai][j].text +
                    '" type="' + annos[ai][j].type + '" />';
            lastLine = line_num;
        }
    }

    outXml += "</annotations>";
    postMessage({
        outXml: outXml,
        lineNums : lineNums,
        errors: aceerrors,
        warnings: acewarnings
    });
};