apf.process.handler.jsdebug = function(oParser){
    apf.makeClass(this);
    this.inherit(apf.ProjectBase);
    
    var fOutput;
    this.$loadPml = function(x){
        apf.console.info("Printing js debug code...");

        fOutput = o3.fs.get(this.output);
        fOutput.data = "<script>data = " + apf.serialize(oParser.data.global)
            .replace(/", "/g, '",\n "')
            .replace(/<\/script>/g, "</scr-ipt>") + ";\ndata;\ndebugger;</script>";
        apf.console.info("Saved js debug at " + fOutput.path);
        //apf.console.info(apf.vardump(oParser.data, null, true));
    }
}
