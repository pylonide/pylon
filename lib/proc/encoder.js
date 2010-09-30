/**
 * Encodes a javascript file. This can be either obfuscation, (re)formatting, 
 * removal of comments, semicolon insertion and several other things.
 *  parse: boolean wether to parse or not
 *  defines: boolean wether to parse defines or not
 *  incremental: boolean wether to incrementally process javascript
 *  forceinc: boolean wether or not to force incremental on first compile (else first compile is always full build)
 *  nosymchange: if you set this to 'true' it will not abort on symbol file change. leave it off
 *  
 *  options:
 *      jsmode: start in Javascript mode
 *      blockmode: start in xml mode
 *      nomodeswitch: dont modeswitch between xml/script
 *
 *      verbose: verbose log output
 *
 *      remap: Remap symbols 
 *      format: reformat the source
 *
 *      codeinmap: store the first line of code in the mapfile
 *
 *      genline: generate line numbers in the output
 *      leavenl: leave newlines in the output
 *      leavenl_ol: no idea
 *
 *      cisproc: code in string processing turned on
 *      cisdump: report the code-in-string
 *      cisdquote: code in string is in dbl quotes not single
 *      warncodeinstring: generate warnings about detected code-in-string
 *
 *      gensemi: generate semicolons
 *      ~nosemi: Do not insert semicolons
 *      semiwarn: warn about missing semicolons
 *      ~semiwarndoubt: warn about missing semicolons when adding semicolons
 *
 *      nocodeinxml: no idea
 * Example:
 * <p:encoder
 *    flags    = "jsmode|codeinmap|cisproc|warncodeinstring|remap|gensemi"
 *    debug    = "leavenl|genline|"
 *    fixedsym = "{cwd}/apf_sym.txt"
 *    remapsym = "{tmp}/{name}.map" 
 *    input    = "{tmp}/{name}_combined.js"
 *    output   = "(out)/{name}_debug.js" />
 */
apf.process.handler.encoder = function(x){
    var parser = createComponent("scriptparser");
    parser.onlog = function(e){
        apf.console.info(e.message);
    };

    var s        = apf.settings,
        ffixed   = fs.get(s.parseAttribute(x.getAttribute("fixedsym"))),
        fremap   = fs.get(s.parseAttribute(x.getAttribute("remapsym"))),
        finput   = fs.get(s.parseAttribute(x.getAttribute("input"))),
        foutput  = fs.get(s.parseAttribute(x.getAttribute("output"))),
        noinc    = apf.isTrue(s.parseAttribute(x.getAttribute("noinc"))),
        flags    = s.parseAttribute(x.getAttribute("flags")),
        dumptree = s.parseAttribute(x.getAttribute("dumptree"));

    apf.existOrExit(fixedsym, remapsym, finput);

    // load old remapping symbols
    if (fremap.exists)
            parser.remapsym = fremap.data;

    var profile	= x.getAttribute("profile");

    // intialize parser with fixed symbols
    if (ffixed.exists)
        parser.fixedsym = ffixed.data;

    // set a header if we are profiling
    if (profile){
            //Let's use Mike's Profiler here
    }

    var data = finput.data;
    if (!data)
        return;

    apf.console.info(finput.path + "\n");

    if (jspkg.contains(finput.path))
        return;

    parser.setOptions(finput.path, flags);
    parser.parseScript(data);

    if (flags.indexOf("gensemi") != -1)
        parser.generateSemicolons();

    if (ffixed.exists) {
            parser.bindSymbols(data);
            parser.remapSymbols();
    }

    if(profile)
            parser.generateProfiling(profile, data);

    // we have to strip empty text
    data = parser.generateScript();

    if (dumptree)
        fs.get(dumptree).data = parser.parsetree;

    //lets write theoutput package
    foutput.data = data;

    //lets write the symbol remap
    fremap.data = parser.remapsym;

    // output profiler xml
    //parser.profileXML

    parser = null;

    apf.console.info("Encoder done.");
};
