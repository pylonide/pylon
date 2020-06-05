ppc.process.handler.jsdebug = function(oParser){
    ppc.makeClass(this);
    this.inherit(ppc.ProjectBase);
    
    var fOutput;
    this.$loadPml = function(x){
        ppc.console.info("Printing js debug code...");

        fOutput = o3.fs.get(this.output);
        fOutput.data = "<script>data = " + ppc.serialize(oParser.data.global)
            .replace(/", "/g, '",\n "')
            .replace(/<\/script>/g, "</scr-ipt>") + ";\ndata;\ndebugger;</script>";
        ppc.console.info("Saved js debug at " + fOutput.path);
        //ppc.console.info(ppc.vardump(oParser.data, null, true));
    }
}
