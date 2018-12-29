/**
 * Executes an xslt document on an xml document and saves the output
 */
apf.process.handler.xslt = function(x){
    var finput, files,
        s       = apf.settings,
        input   = s.parseAttribute(x.getAttribute("input")),
        group   = s.parseAttribute(x.getAttribute("group")),
        fxslt   = fs.get(s.parseAttribute(x.getAttribute("xslt"))),
        foutput = fs.get(s.parseAttribute(x.getAttribute("output")));
    
    if (!input || !(finput = fs.get(input)).exists) {
        if (group)
            files = apf.files.get(group);
        else
            apf.existOrExit(finput);
    }
    else
        files = [finput];
    
    apf.existOrExit(fxslt);
    var xslt = apf.getXmlSafe(fxslt);
    
    files.each(function(file){
        apf.console.info(file.path + " : processing with " + fxslt.name + "...");
    
        try {
            (foutput.isDir
                ? foutput.get(file.name)
                : foutput).data = apf.getXmlSafe(file).transformNode(xslt);
        }
        catch (e) {
            apf.console.error(file.path + " : Error processing XSLT "
                + " " + e.message + "\n");
            exit();
        }
    
        apf.console.info("done\n");
    });
}
