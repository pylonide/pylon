/**
 * Executes an xslt document on an xml document and saves the output
 */
ppc.process.handler.xslt = function(x){
    var finput, files,
        s       = ppc.settings,
        input   = s.parseAttribute(x.getAttribute("input")),
        group   = s.parseAttribute(x.getAttribute("group")),
        fxslt   = fs.get(s.parseAttribute(x.getAttribute("xslt"))),
        foutput = fs.get(s.parseAttribute(x.getAttribute("output")));
    
    if (!input || !(finput = fs.get(input)).exists) {
        if (group)
            files = ppc.files.get(group);
        else
            ppc.existOrExit(finput);
    }
    else
        files = [finput];
    
    ppc.existOrExit(fxslt);
    var xslt = ppc.getXmlSafe(fxslt);
    
    files.each(function(file){
        ppc.console.info(file.path + " : processing with " + fxslt.name + "...");
    
        try {
            (foutput.isDir
                ? foutput.get(file.name)
                : foutput).data = ppc.getXmlSafe(file).transformNode(xslt);
        }
        catch (e) {
            ppc.console.error(file.path + " : Error processing XSLT "
                + " " + e.message + "\n");
            exit();
        }
    
        ppc.console.info("done\n");
    });
}
