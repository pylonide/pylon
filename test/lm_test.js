
function parseLM(expression, options, callback){
    if (!xmlData) return "not executed";
    
    var genCode = compileLM(expression, options),
        obj     = {v1:3};
    try { 
        if (genCode) {
            if (genCode.type == 1) {
                if (genCode.asyncs) {
                    //logw("async call");
                    genCode(xmlData, function(v) {
                        callback('Async received:' + v);
                    }, {});
                }
                else {
                    return genCode( xmlData, {});
                }
            }
            else {
                if (genCode.type == 2)
                    return genCode.str;
                if (genCode.type == 3)
                    return genCode(xmlData, {});
            }
        }
    }
    catch(e){
        return "error"; //"LM Execution occured:\n" + e.message;
    }
}

function compileLM(expression, options){
    var genCode;
    
    try {
        if (expression.indexOf('##') != -1) {
            var args = expression.split(/##/);
            for (i = 0; i < args.length; i++) {
                if (args[i] == '-')
                    args[i] = '';
            }
            genCode = apf.lm.compileMatch( args );
        }
        else {
            genCode = apf.lm.compile(expression, options);
        }
    }
    catch(e) {
        throw new Error("LM Compilation occured:\n" + e.message + "\n\n" + expression);
        genCode = null;
    }
    
    return genCode;
}
function parseXml(x){
    var p;
    if (document.all) {
        p = new ActiveXObject("microsoft.XMLDOM");
        p.setProperty("SelectionLanguage", "XPath");
        p.loadXML(x);
    }
    else{
        p = new DOMParser();
        if (x)
            p = p.parseFromString(x, "text/xml");
    }
    return p;
}

var xmlData = parseXml("<folder name='F1'><file>C</file><file>A</file><file>B</file></folder><folder name='F2'><file>D</file></folder><folder name='F2'><file>F</file><file>A</file></folder>");
 
var testmodel = {
    data : xmlData,
	copy : xmlData.cloneNode(true),
	reset : function(){
		this.data = this.copy.cloneNode(true);
	},
	queryValue : function(xpath) {
		n = this.data.selectSingleNode(xpath);
		return n.nodeType == 1 && n.firstChild && n.firstChild.nodeValue || n.nodeValue || "";
	},
	queryNode : function(xpath){
		return this.data.selectSingleNode(xpath);
	},
	queryNodes : function(xpath){
		return this.data.selectNodes(xpath);
	}
}
apf.nameserver.lookup.model.testmodel = testmodel;

function escape(e){
	return e.replace(/\</g,"&lt;").replace(/\>/g,"&gt;");
}

function lmstring(input, output){
	try{
		var f = apf.lm.compile(input, {});
	}catch(e){
		equals(0,1,"Error compiling "+x.message+"\nCode:"+escape(input) );
		return;
	}
	try{
		equals( f(), output, "Code:"+escape(input)+" expected:"+output+" result");
	}catch(e){
		equals(0,1,"Error executing "+e.message+"\nCode:"+escape(input) );
		return;
	}
}

test("lm_textmode()", function() {
    // Detect and remove any common prefix.
    // Null case.
    var options = {};
	
    lmstring('{1 + 1}', "2");
		
    lmstring('"asdasd<xml><xml />asdasd"', "\"asdasd<xml><xml />asdasd\"");//xml literal INSIDE string double quotes
	
    equals(parseLM('"asdasd{1+1}asdasd"', options), "asdasd2asdasd");//code INSIDE string double quotes
    equals(parseLM("asdasd[folder/@name]", options), "asdasdF1");//basic xpath INSIDE string double quotes
    //doesnt return what expected
    equals(parseLM('"asdasd[testmodel::folder/@name]"', options), "asdasdF1");//xpath with model INSIDE string double quotes
    //returns an error
    equals(parseLM('"asdasd*[//file]"', options), "asdasd<file>C</file><file>A</file><file>B</file><file>F</file><file>A</file>");//xpath select all INSIDE string double quotes
    equals(parseLM('"asdasd%[folder]asdasd"'), '"asdasd<folder name=\\"F1\\"><file>C</file><file>A</file><file>B</file></folder>asdasd"');//xpath select node INSIDE string double quotes
    //doesnt return what expected (no language table?)
    equals(parseLM('"asdad$[main/test]asd"', options), "asdasdtestasd");//language symbol INSIDE string double quotes
    equals(parseLM('"asdasdasd\'asdasdasd\'asdasd"', options), "\"asdasdasd'asdasdasd'asdasd\"");//single quoted string INSIDE string double quotes
    equals(parseLM("<xml />\"asdasd\"<xml/>", options), "<xml />\"asdasd\"<xml/>");//string double quotes INSIDE xml literal
    equals(parseLM("<folder><file><file /><folder />", options), "<folder><file><file /><folder />");//xml literal INSIDE xml literal
    equals(parseLM("<xml />{'ASDASD'.toLowerCase()}<xml/>", options), "<xml />asdasd<xml/>");//code INSIDE xml literal
    equals(parseLM("<folder>[folder/@name]<folder />", options), "<folder>F1<folder />");//basic xpath INSIDE xml literal
    //xpath with model doesnt seem to work?
    equals(parseLM("<folder>[testmodel::folder/@name]<folder />", options), "<folder><folder />");//xpath with model INSIDE xml literal
    equals(parseLM("<folder>%[folder]<folder />"), '<folder><folder name="F1"><file>C</file><file>A</file><file>B</file></folder><folder />');//xpath select node INSIDE xml literal
    equals(parseLM("<folder>'asdasd0'<folder />", options), "<folder>'asdasd0'<folder />");//single quoted string INSIDE xml literal
    equals(parseLM('{"asdsa".substr(0,2)}', options), "as");//string double quotes INSIDE code
    equals(parseLM("{<xml/>}", options), "<xml/>");//xml literal INSIDE code
    equals(parseLM("{1+1+{2+2}+3+3}", options), "12");//code INSIDE code
    
    //this is no xpath select all? should be: "{*[folder]}"
    equals(parseLM('{"testmodel" + [folder/@name]}', options), "testmodelF1");//xpath select all INSIDE code
    equals(parseLM("{\"asD\".replace(/\as/, 'test')}", options), "testD");//regexp INSIDE code
    equals(parseLM('[folder{"/@name"}]', options), "F1");//code INSIDE basic xpath

    //is this a valid xpath in a xpath? no data returned
    equals(parseLM("[folder[@name='[folder[2]/@name]']/@name]", options), "F2");//basic xpath INSIDE basic xpath
    
    //syntax error?
    //error: Voorwaardelijke compilatie is uitgeschakeld
    equals(parseLM("[testmodel::folder[@name='[folder[2]/@name]']/@name]", options), "F2");//xpath with model INSIDE basic xpath
    
    
    //error message
    //error: Expressie retourneert geen DOM-knooppunt.
    equals(parseLM("['folder/@name']", options), "error");//single quoted string INSIDE basic xpath
    
    //no data returned
    equals(parseLM('[testmodel::"folder"]', options), "error");//string double quotes INSIDE xpath with model
    
    //expected error: no data returned or syntax error?
    equals(parseLM("[testmodel::<file/>]", options), "error");//xml literal INSIDE xpath with model
    
    
    //no data returned
    equals(parseLM("[testmodel::'folder/@name']", options), "error");//single quoted string INSIDE xpath with model
    //no data returned
    equals(parseLM('["testmodel"::folder/@name]', options), "F1");//string double quotes INSIDE xpath select all
    
    //syntax error
    //error: Expressie retourneert geen DOM-knooppunt.
    equals(parseLM('%[file"[1]"]', options), "error");//string double quotes INSIDE language symbol
    
    
    //no data returned (no language table?)
    equals(parseLM("$[{'main/test'}]", options), "test");//code INSIDE language symbol
    
    //no data returned
    equals(parseLM("%[folder[@name='[folder[2]/@name]']]", options), "<folder name='F2'><file>D</file></folder>");//basic xpath INSIDE language symbol
    
    //expected error
    equals(parseLM("%[folder[*[folder[2]/@name]]]", options), "<folder name='F2'><file>D</file></folder>");//xpath select all INSIDE language symbol
    
    //no data returned (no language table?)
    equals(parseLM("$['folder']", options), "error");//single quoted string INSIDE regexp
    
    //error message
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht
    equals(parseLM("[\"folder\"/@name]", options), "");//string double quotes INSIDE basic xpath
    
    //error: Onverwacht teken in querytekenreeks. %
    equals(parseLM("[folder[%[folder[2]/@name]]/@name]", options), "F2");//xpath select node INSIDE basic xpath
    
    //no return data (no language table)
    equals(parseLM("[folder[@name='$[main/f2]']/@name]", options), "F2");//language symbol INSIDE basic xpath
    //no return data
    equals(parseLM("[testmodel::{'folder/@name'}]", options), "F1");//code INSIDE xpath with model
    //no return data
    equals(parseLM("[testmodel::$[main/xpath]]", options), "F1");//language symbol INSIDE xpath with model
    //doesnt return whats expected
    equals(parseLM("[<data><file name='test'/></data>::file/@name]", options), "test");//xml literal INSIDE xpath select all
    
    //no return data this is no xpath select all? (*[{'FOLDER'.toLowerCase()}])
    equals(parseLM("[{testmodel}::folder/@name]", options), "F1");//code INSIDE xpath select all
    
    //gives an error
    equals(parseLM("[[testmodel::folder[2]]::@name]", options), "F2");//xpath with model INSIDE xpath select all
    //no return data
    equals(parseLM("[*[folder]::file]", options), "error");//xpath select all INSIDE xpath select all
    
    //no data returned
    equals(parseLM("[%[folder]::file]", options), "<file>C</file>");//xpath select node INSIDE xpath select all
    
    //no data returned (no language table)
    equals(parseLM("[$[main/test]::folder/@name]", options), "F1");//language symbol INSIDE xpath select all
    
    //gives an error: Ongeldige asnaam.
    equals(parseLM("%[file[testmodel::folder]]", options), "<folder name='F1'><file>C</file><file>A</file><file>B</file></folder>");//xpath with model INSIDE language symbol
    
    //no data returned (no language table)
    equals(parseLM("%[folder[@name='$[main/f1]']]", options), "F1");//language symbol INSIDE language symbol
    
    //gives an error: Expressie retourneert geen DOM-knooppunt.
    equals(parseLM("%['folder']", options), "<folder name='F1'><file>C</file><file>A</file><file>B</file></folder>");//single quoted string INSIDE xpath node
    
    //no data returned (no language table)
    equals(parseLM("$[main/[testmodel::folder[2]/@name]]", options), "F1");//xpath with model INSIDE language xpath
    
    //no reutrn data (no language table)
    equals(parseLM("$[main/$[main/test]]", options), "test");//language symbol language xpath
    
    //no data returned (no language table)
    equals(parseLM("$['main/test']", options), "test");//single quoted string INSIDE language xpath
    
    //doesnt return whats expected (no language table)
    equals(parseLM("<folder>$[main/test]<folder />", options), "<folder>test<folder />");//language symbol INSIDE xml literal
    equals(parseLM('{[folder/@name] + "name"}', options), "F1name");//basic xpath INSIDE code
    
    //no data returned
    equals(parseLM("{[testmodel::folder/@name].toLowerCase()}", options), "f1");//xpath with model INSIDE code
    
    equals(parseLM("{%[folder].xml}"), '<folder name="F1"><file>C</file><file>A</file><file>B</file></folder>');//xpath select node INSIDE code
    //no data returned (no language table)
    equals(parseLM("{$[main/test]}", options), "test");//language symbol INSIDE code
    
    //no data returned dunno whats the problem
    equals(parseLM("[folder[@name='[folder[2]/@name]']/@name]", options), "F2");//basic xpath INSIDE xpath with model
    
    //no data returned dunno whats the problem
    equals(parseLM("[testmodel::folder[@name='[folder[2]/@name]']/@name]", options), "F2");//xpath with model INSIDE xpath with model
    
    //no data returned dunno whats the problem
    equals(parseLM("[testmodel::*[folder]]", options), "error");//xpath select all INSIDE xpath with model
    
    //no data returned dunno whats the problem
    equals(parseLM("[testmodel::%[folder]]", options), "error");//xpath select node INSIDE xpath with model
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht [[folder[3]]::@name]
    equals(parseLM("[[folder[3]]::@name]", options), "F2");//basic xpath INSIDE xpath select all
    
    //no data returned dunno whats the problem
    equals(parseLM("['testmodel'::folder[2]/@name]", options), "F2");//single quoted string INSIDE xpath select all
    
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    equals(parseLM("*[//{'file2'.substr(0,4)}]", options), "<file>C</file><file>A</file><file>B</file>")                         //testmodel.data.selectNodes('//file'));//code INSIDE xpath select node
    
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    equals(parseLM("*[folder[@name='[folder[3]/@name]']]", options), "<folder name='F2'><file>D</file></folder><folder name='F2'><file>F</file><file>A</file></folder>")                //"testmodel.data.selectNodes('folder[@name=\'F2\']'));//basic xpath INSIDE xpath select node
    
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    equals(parseLM("*[folder[@name='[testmodel::folder[3]/@name]']]", options), "<folder name='F2'><file>D</file></folder><folder name='F2'><file>F</file><file>A</file></folder>")      //" testmodel.data.selectNodes('folder[@name=\'F2\']'));//basic xpath INSIDE xpath select node
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    
    equals(parseLM("*[folder[@name='$[main/f2]']]"),"<folder name='F2'><file>D</file></folder><folder name='F2'><file>F</file><file>A</file></folder>")                        //testmodel.data.selectNodes('folder[@name=\'F2\']'));//language symbol INSIDE xpath select node
    
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    equals(parseLM("*['folder']", options), "error"); //testmodel.data.selectNodes('folder'));//single quoted string INSIDE xpath select node

    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    equals(parseLM("<folders>*[folder]<folders />"), '<folder><folder name=\'F1\'><file>C</file><file>A</file><file>B</file></folder><folder name=\'F2\'><file>D</file></folder><folder name=\'F2\'><file>F</file><file>A</file></folder></folder>');//xpath select all INSIDE xml literal
    
    //error expected
    //error message: error: Verwacht token 'eof' gevonden '<'.
    equals(parseLM("[file<xml/>]", options), "error");//xml literal INSIDE basic xpath
    //error expected
    //error message Verwacht token 'eof' gevonden '*'.
    equals(parseLM("[folder*[folder]]", options), "error");//xpath select all INSIDE basic xpath
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht *[folder\"[2]\"]
    equals(parseLM('*[folder"[2]"]', options), "error")                                     //testmode.data.selectNodes("folder[2]"));//string double quotes INSIDE xpath select node
    
    //error expected
    //error message: Deze eigenschap of methode wordt niet ondersteund door dit object
    equals(parseLM("*[file<xml/>]", options), "error");//xml literal INSIDE xpath select node
    
    //error expected
    //error message: Deze eigenschap of methode wordt niet ondersteund door dit object
    equals(parseLM("%[folder[*[folder[2]/@name]]", options), "<folder name='F2'><file>D</file></folder>");//xpath select all INSIDE xpath select node
    
    //error message: Compiling live markup functionError whilst compiling: ')' wordt verwacht *[folder[{\"%[folder/@name]\"}]/@name]
    equals(parseLM('*[folder[%[folder/@name]]/@name]', options), "name='F1'");//xpath select node INSIDE xpath select node - testmodel.data.selectNodes("folder/@name")
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht %[folder[{\"*[folder[1]/@name]\"}]]
    equals(parseLM('%[folder[*[folder[1]/@name]]]', options), "<folder name='F1'><file>C</file><file>A</file><file>B</file></folder>");//xpath select all INSIDE language symbol
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht %[folder[{\"%[folder/@name]\"}]/@name]
    equals(parseLM("%[folder[%[folder/@name]]/@name]", options), "name='F1'");//xpath select node INSIDE language symbol
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht $[\"main/test\"]
    //no language table
    equals(parseLM("$[\"main/test\"]", options), "test");//string double quotes INSIDE regexp
    
    //last 3 are suposed to fail
    equals(parseLM("$[file<xml/>]", options), "error");//xml literal INSIDE regexp
    equals(parseLM("$[file*[folder]]", options), "error");//xpath select all INSIDE regexp
    equals(parseLM("$[file%[folder]]", options), "error");//xpath select node INSIDE regexp
});

test("lm_codemode()", function() {
    // Detect and remove any common prefix.
    // Null case.
    
    options = {parsecode:1};
    
    equals(parseLM('{1 + 1}', options), "2");
  
    equals(parseLM('"asdasd<xml><xml />asdasd"', options), "asdasd<xml><xml />asdasd");//xml literal INSIDE string double quotes
    equals(parseLM('"asdasd{1+1}asdasd"', options), "asdasd2asdasd");//code INSIDE string double quotes
    equals(parseLM("asdasd[folder/@name]", options), "asdasdF1");//basic xpath INSIDE string double quotes
    //doesnt return what expected
    equals(parseLM('"asdasd[testmodel::folder/@name]"', options), "asdasdF1");//xpath with model INSIDE string double quotes
    //returns an error
    equals(parseLM('"asdasd*[//file]"', options), "asdasd<file>C</file><file>A</file><file>B</file><file>F</file><file>A</file>");//xpath select all INSIDE string double quotes
    equals(parseLM('"asdasd%[folder]asdasd"'), '"asdasd<folder name=\\"F1\\"><file>C</file><file>A</file><file>B</file></folder>asdasd"');//xpath select node INSIDE string double quotes
    //doesnt return what expected (no language table?)
    equals(parseLM('"asdad$[main/test]asd"', options), "asdasdtestasd");//language symbol INSIDE string double quotes
    equals(parseLM('"asdasdasd\'asdasdasd\'asdasd"', options), "\"asdasdasd'asdasdasd'asdasd\"");//single quoted string INSIDE string double quotes
    equals(parseLM("<xml />\"asdasd\"<xml/>", options), "<xml />\"asdasd\"<xml/>");//string double quotes INSIDE xml literal
    equals(parseLM("<folder><file><file /><folder />", options), "<folder><file><file /><folder />");//xml literal INSIDE xml literal
    equals(parseLM("<xml />{'ASDASD'.toLowerCase()}<xml/>", options), "<xml />asdasd<xml/>");//code INSIDE xml literal
    equals(parseLM("<folder>[folder/@name]<folder />", options), "<folder>F1<folder />");//basic xpath INSIDE xml literal
    //xpath with model doesnt seem to work?
    equals(parseLM("<folder>[testmodel::folder/@name]<folder />", options), "<folder><folder />");//xpath with model INSIDE xml literal
    equals(parseLM("<folder>%[folder]<folder />"), '<folder><folder name="F1"><file>C</file><file>A</file><file>B</file></folder><folder />');//xpath select node INSIDE xml literal
    equals(parseLM("<folder>'asdasd0'<folder />", options), "<folder>'asdasd0'<folder />");//single quoted string INSIDE xml literal
    equals(parseLM('{"asdsa".substr(0,2)}', options), "as");//string double quotes INSIDE code
    equals(parseLM("{<xml/>}", options), "<xml/>");//xml literal INSIDE code
    equals(parseLM("{1+1+{2+2}+3+3}", options), "12");//code INSIDE code
    
    equals(parseLM('{"testmodel" + [folder/@name]}', options), "testmodelF1");//xpath select all INSIDE code
    equals(parseLM("{\"asD\".replace(/\as/, 'test')}", options), "testD");//regexp INSIDE code
    equals(parseLM('[folder{"/@name"}]', options), "F1");//code INSIDE basic xpath

    //is this a valid xpath in a xpath? no data returned
    equals(parseLM("[folder[@name='[folder[2]/@name]']/@name]", options), "F2");//basic xpath INSIDE basic xpath
    
    //syntax error?
    //error: Voorwaardelijke compilatie is uitgeschakeld
    equals(parseLM("[testmodel::folder[@name='[folder[2]/@name]']/@name]", options), "F2");//xpath with model INSIDE basic xpath
    
    
    //error message
    //error: Expressie retourneert geen DOM-knooppunt.
    equals(parseLM("['folder/@name']", options), "error");//single quoted string INSIDE basic xpath
    
    //no data returned
    equals(parseLM('[testmodel::"folder"]', options), "error");//string double quotes INSIDE xpath with model
    
    //expected error: no data returned or syntax error?
    equals(parseLM("[testmodel::<file/>]", options), "error");//xml literal INSIDE xpath with model
    
    
    //no data returned
    equals(parseLM("[testmodel::'folder/@name']", options), "error");//single quoted string INSIDE xpath with model
    //no data returned
    equals(parseLM('["testmodel"::folder/@name]', options), "F1");//string double quotes INSIDE xpath select all
    
    //syntax error
    //error: Expressie retourneert geen DOM-knooppunt.
    equals(parseLM('%[file"[1]"]', options), "error");//string double quotes INSIDE language symbol
    
    
    //no data returned (no language table?)
    equals(parseLM("$[{'main/test'}]", options), "test");//code INSIDE language symbol
    
    //no data returned
    equals(parseLM("%[folder[@name='[folder[2]/@name]']]", options), "<folder name='F2'><file>D</file></folder>");//basic xpath INSIDE language symbol
    
    //expected error
    equals(parseLM("%[folder[*[folder[2]/@name]]]", options), "<folder name='F2'><file>D</file></folder>");//xpath select all INSIDE language symbol
    
    //no data returned (no language table?)
    equals(parseLM("$['folder']", options), "error");//single quoted string INSIDE regexp
    
    //error message
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht
    equals(parseLM("[\"folder\"/@name]", options), "");//string double quotes INSIDE basic xpath
    
    //error: Onverwacht teken in querytekenreeks. %
    equals(parseLM("[folder[%[folder[2]/@name]]/@name]", options), "F2");//xpath select node INSIDE basic xpath
    
    //no return data (no language table)
    equals(parseLM("[folder[@name='$[main/f2]']/@name]", options), "F2");//language symbol INSIDE basic xpath
    //no return data
    equals(parseLM("[testmodel::{'folder/@name'}]", options), "F1");//code INSIDE xpath with model
    //no return data
    equals(parseLM("[testmodel::$[main/xpath]]", options), "F1");//language symbol INSIDE xpath with model
    //doesnt return whats expected
    equals(parseLM("[<data><file name='test'/></data>::file/@name]", options), "simple string");//xml literal INSIDE xpath select all
    
    //no return data this is no xpath select all? (*[{'FOLDER'.toLowerCase()}])
    equals(parseLM("[{testmodel}::folder/@name]", options), "F1");//code INSIDE xpath select all
    
    //gives an error
    equals(parseLM("[[testmodel::folder[2]]::@name]", options), "F2");//xpath with model INSIDE xpath select all
    //no return data
    equals(parseLM("[*[folder]::file]", options), "error");//xpath select all INSIDE xpath select all
    
    //no data returned
    equals(parseLM("[%[folder]::file]", options), "<file>C</file>");//xpath select node INSIDE xpath select all
    
    //no data returned (no language table)
    equals(parseLM("[$[main/test]::folder/@name]", options), "F1");//language symbol INSIDE xpath select all
    
    //gives an error: Ongeldige asnaam.
    equals(parseLM("%[file[testmodel::folder]]", options), "<folder name='F1'><file>C</file><file>A</file><file>B</file></folder>");//xpath with model INSIDE language symbol
    
    //no data returned (no language table)
    equals(parseLM("%[folder[@name='$[main/f1]']]", options), "F1");//language symbol INSIDE language symbol
    
    //gives an error: Expressie retourneert geen DOM-knooppunt.
    equals(parseLM("%['folder']", options), "<folder name='F1'><file>C</file><file>A</file><file>B</file></folder>");//single quoted string INSIDE xpath node
    
    //no data returned (no language table)
    equals(parseLM("$[main/[testmodel::folder[2]/@name]]", options), "F1");//xpath with model INSIDE language xpath
    
    //no reutrn data (no language table)
    equals(parseLM("$[main/$[main/test]]", options), "test");//language symbol language xpath
    
    //no data returned (no language table)
    equals(parseLM("$['main/test']", options), "test");//single quoted string INSIDE language xpath
    
    //doesnt return whats expected (no language table)
    equals(parseLM("<folder>$[main/test]<folder />", options), "<folder>test<folder />");//language symbol INSIDE xml literal
    equals(parseLM('{[folder/@name] + "name"}', options), "F1name");//basic xpath INSIDE code
    
    //no data returned
    equals(parseLM("{[testmodel::folder/@name].toLowerCase()}", options), "f1");//xpath with model INSIDE code
    
    equals(parseLM("{%[folder].xml}"), '<folder name="F1"><file>C</file><file>A</file><file>B</file></folder>');//xpath select node INSIDE code
    //no data returned (no language table)
    equals(parseLM("{$[main/test]}", options), "test");//language symbol INSIDE code
    
    //no data returned dunno whats the problem
    equals(parseLM("[folder[@name='[folder[2]/@name]']/@name]", options), "F2");//basic xpath INSIDE xpath with model
    
    //no data returned dunno whats the problem
    equals(parseLM("[testmodel::folder[@name='[folder[2]/@name]']/@name]", options), "F2");//xpath with model INSIDE xpath with model
    
    //no data returned dunno whats the problem
    equals(parseLM("[testmodel::*[folder]]", options), "error");//xpath select all INSIDE xpath with model
    
    //no data returned dunno whats the problem
    equals(parseLM("[testmodel::%[folder]]", options), "error");//xpath select node INSIDE xpath with model
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht [[folder[3]]::@name]
    equals(parseLM("[[folder[3]]::@name]", options), "F2");//basic xpath INSIDE xpath select all
    
    //no data returned dunno whats the problem
    equals(parseLM("['testmodel'::folder[2]/@name]", options), "F2");//single quoted string INSIDE xpath select all
    
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    equals(parseLM("*[//{'file2'.substr(0,4)}]", options), "<file>C</file><file>A</file><file>B</file>")                         //testmodel.data.selectNodes('//file'));//code INSIDE xpath select node
    
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    equals(parseLM("*[folder[@name='[folder[3]/@name]']]", options), "<folder name='F2'><file>D</file></folder><folder name='F2'><file>F</file><file>A</file></folder>")                //"testmodel.data.selectNodes('folder[@name=\'F2\']'));//basic xpath INSIDE xpath select node
    
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    equals(parseLM("*[folder[@name='[testmodel::folder[3]/@name]']]", options), "<folder name='F2'><file>D</file></folder><folder name='F2'><file>F</file><file>A</file></folder>")      //" testmodel.data.selectNodes('folder[@name=\'F2\']'));//basic xpath INSIDE xpath select node
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    
    equals(parseLM("*[folder[@name='$[main/f2]']]"),"<folder name='F2'><file>D</file></folder><folder name='F2'><file>F</file><file>A</file></folder>")                        //testmodel.data.selectNodes('folder[@name=\'F2\']'));//language symbol INSIDE xpath select node
    
    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    //differents between "codemode" and "textmode"? no sure what to change
    equals(parseLM("*['folder']", options), "error"); //testmodel.data.selectNodes('folder'));//single quoted string INSIDE xpath select node

    //error: Deze eigenschap of methode wordt niet ondersteund door dit object
    equals(parseLM("<folders>*[folder]<folders />"), '<folders><folder name=\'F1\'><file>C</file><file>A</file><file>B</file></folder><folder name=\'F2\'><file>D</file></folder><folder name=\'F2\'><file>F</file><file>A</file></folder><folders />');//xpath select all INSIDE xml literal
    
    //error expected
    //error message: error: Verwacht token 'eof' gevonden '<'.
    equals(parseLM("[file<xml/>]", options), "error");//xml literal INSIDE basic xpath
    //error expected
    //error message Verwacht token 'eof' gevonden '*'.
    equals(parseLM("[folder*[folder]]", options), "error");//xpath select all INSIDE basic xpath
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht *[folder\"[2]\"]
    equals(parseLM('*[folder"[2]"]', options), "error")                                     //testmode.data.selectNodes("folder[2]"));//string double quotes INSIDE xpath select node
    
    //error expected
    //error message: Deze eigenschap of methode wordt niet ondersteund door dit object
    equals(parseLM("*[file<xml/>]", options), "error");//xml literal INSIDE xpath select node
    
    //error expected
    //error message: Deze eigenschap of methode wordt niet ondersteund door dit object
    equals(parseLM("%[folder[*[folder[2]/@name]]", options), "<folder name='F2'><file>D</file></folder>");//xpath select all INSIDE xpath select node
    
    //error message: Compiling live markup functionError whilst compiling: ')' wordt verwacht *[folder[{\"%[folder/@name]\"}]/@name]
    equals(parseLM('*[folder[%[folder/@name]]/@name]', options), "name='F1'");//xpath select node INSIDE xpath select node - testmodel.data.selectNodes("folder/@name")
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht %[folder[{\"*[folder[1]/@name]\"}]]
    equals(parseLM('%[folder[*[folder[1]/@name]]]', options), "<folder name='F1'><file>C</file><file>A</file><file>B</file></folder>");//xpath select all INSIDE language symbol
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht %[folder[{\"%[folder/@name]\"}]/@name]
    equals(parseLM("%[folder[%[folder/@name]]/@name]", options), "name='F1'");//xpath select node INSIDE language symbol
    
    //error: Compiling live markup functionError whilst compiling: ')' wordt verwacht $[\"main/test\"]
    //no language table
    equals(parseLM("$[\"main/test\"]", options), "test");//string double quotes INSIDE regexp
    
    //last 3 are suposed to fail
    equals(parseLM("$[file<xml/>]", options), "error");//xml literal INSIDE regexp
    equals(parseLM("$[file*[folder]]", options), "error");//xpath select all INSIDE regexp
    equals(parseLM("$[file%[folder]]", options), "error");//xpath select node INSIDE regexp
});

	//-------------------------------" = "-------------------------------
	
	
test("lm_equals_codemode()", function() {
    // Detect and remove any common prefix.
    // Null case.
    
    options = {parsecode:1};

	equals(parseLM("\"asdasd\" = <xml/>"), "error");//xml literal INSIDE string double quotes
	equals(parseLM("\"2\" = {1+1}"), "error");//code INSIDE string double quotes
	equals(parseLM("\"A\" = [folder/@name]"), "error");//basic xpath INSIDE string double quotes
	equals(parseLM("\"asdasd\" = [testmodel::folder/@name]"), "error");//xpath with model INSIDE string double quotes
	equals(parseLM("\"asdasd\" = *[folder]"), "error");//xpath select all INSIDE string double quotes
	equals(parseLM("\"asdasd\" = %[folder]"), "error");//xpath select node INSIDE string double quotes
	equals(parseLM("\"asdasd\" = $[main/test]"), "error");//language symbol INSIDE string double quotes
	equals(parseLM("\"asdasd\" = 'asdasd'"), "error");//undefined INSIDE string double quotes
	equals(parseLM("<xml /> = \"<xml />\""), "error");//string double quotes INSIDE xml literal
	equals(parseLM("<xml/> = <xml/>"), "error");//xml literal INSIDE xml literal
	equals(parseLM("<xml /> = {'<XML />'.toLowerCase()}"), "error");//code INSIDE xml literal
	equals(parseLM("<xml /> = [folder/@name]"), "error");//basic xpath INSIDE xml literal
	equals(parseLM("<xml /> = [testmodel::folder/@name]"), "error");//xpath with model INSIDE xml literal
	equals(parseLM("<xml /> = *[folder]"), "error");//xpath select all INSIDE xml literal
	equals(parseLM("<xml /> = %[folder]"), "error");//xpath select node INSIDE xml literal
	equals(parseLM("<xml /> = $[main/test]"), "error");//language symbol INSIDE xml literal
	equals(parseLM("<xml /> = 'asdasd'"), "error");//undefined INSIDE xml literal
	equals(parseLM("{1+1} = \"2\""), "error");//string double quotes INSIDE code
	equals(parseLM("{1+1} = <xml />"), "error");//xml literal INSIDE code
	equals(parseLM("{1+1} = {3-1}"), "error");//code INSIDE code
	equals(parseLM("{'f1'.toUpperCase()} = [folder/@name]"), "error");//basic xpath INSIDE code
	equals(parseLM("{'F11'.substring(0,2)} = [testmodel::folder/@name]"), "error");//xpath with model INSIDE code
	equals(parseLM("{1+1} = *[folder]"), "error");//xpath select all INSIDE code
	equals(parseLM("{1+1} = %[folder]"), "error");//xpath select node INSIDE code
	equals(parseLM("{1+1} = $[main/test]"), "error");//language symbol INSIDE code
	equals(parseLM("{'asdasd'.replace(/\asd/, 'Test')} = 'Testasd'"), "error");//undefined INSIDE code
	
	testmodel.reset();
	equals(parseLM("[folder/file] = \"K\"") && testmode.queryValue("folder/file"), "K");//string double quotes INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] = <xml />") && testmode.queryNode("folder/xml").xml, "<xml />");//xml literal INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] = {1+1}") && testmode.queryValue("folder/file/text()"), "2");//code INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] = [folder/@name]") && testmode.queryValue("folder/file"), "F1");//basic xpath INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/@name] = [testmodel:://file]") && testmode.queryValue("folder/@name"), "C");//xpath with model INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] = *[folder[@name='F2']]") && testmode.queryNodes("folder/folder[@name='F2']").length, 2);//xpath select all INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] = %[folder]") && testmode.queryNodes("folder/folder[@name='F2']").length, 1);//xpath select node INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] = $[main/test]") && testmode.queryValue("folder/file"), "model");//language symbol INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] = 'L'") && testmode.queryValue("folder/file/text()"), "L");//undefined INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] = \"L\"") && testmode.queryValue("folder/text()"), "L");//string double quotes INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] = <xml />") && testmode.queryNode("folder/xml").xml, "<xml />");//xml literal INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] = {1+1}") && testmode.queryValue("folder/file/text()"), "2");//code INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] = [folder/@name]") && testmode.queryValue("folder/file/text()"), "F1");//basic xpath INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] = [testmodel:://file[2]]") && testmode.queryValue("folder/text()"), "A");//xpath with model INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] = *[folder[@name='F2']]") && testmode.queryNodes("folder/file/folder[@name='F2']").length, 2);//xpath select all INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] = %[folder]") && testmode.queryNodes("folder/file/folder[@name='F2']").length, 1);//xpath select node INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] = $[main/test]") && testmode.queryValue("folder/text()"), "test");//language symbol INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] = 'L'") && testmode.queryValue("folder/text()"), "L");//undefined INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/@name] = \"F6\"") && testmode.queryValue("folder/@name"), "F6");//string double quotes INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] = <xml />"), "error");//xml literal INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] = {1+1}"), null);//code INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] = [folder/file/text()]") && testmode.queryValue("folder/@name"), "C");//basic xpath INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] = [testmodel:://file]") && testmode.queryValue("folder/@name"), "C");//xpath with model INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] = *[folder]"), "error");//xpath select all INSIDE xpath select all

	testmodel.reset();
	equals(parseLM("[folder/@name] = %[folder]"), "error");//xpath select node INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] = $[main/test]") && testmode.queryValue("folder/@name"), "model");//language symbol INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] = 'F7'") && testmode.queryValue("folder/@name"), "F7");//undefined INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[testmodel::folder/@name] = \"F8\"") && testmode.queryValue("folder/@name"), "F8");//string double quotes INSIDE xpath select node

	testmodel.reset();
	equals(parseLM("[testmodel::folder/@name] = <xml>F1<xml />"), "error");//xml literal INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel::folder/@name] = {'f9'.toUpperCase()}") && testmode.queryValue("folder/@name"), "F9");//code INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel:://file] = [//file[3]]") && testmode.queryValue("folder/@name"), "B");//basic xpath INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel::folder/@name] = [testmodel::folder[2]/@name") && testmode.queryValue("folder/@name"), "F2");//xpath with model INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel:://file] = *[folder[@name='F2']]") && testmode.queryNodes("folder/folder[@name='F2']").length, 2);//xpath select all INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel:://file] = %[folder]") && testmode.queryNodes("folder/folder[@name='F2']").length, 1);//xpath select node INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel:://file] = $[main/test]") && testmode.queryValue("//file"), "model");//language symbol INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel:://file] = 'L'") && testmode.queryValue("//file"), "L");//undefined INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("*[folder/@name] = \"ABCD\"") && testmode.queryNodes("folder[@name='ABCD']").length, 3);//string double quotes INSIDE language symbol
	
	//reasigned as foreach so evry value will be changed.. 
	testmodel.reset();
	equals(parseLM("*[folder] = <xml />") && testmode.queryNodes("folder/xml").length, 3);//xml literal INSIDE language symbol
	
	testmodel.reset();
	equals(parseLM("*[folder] = {1 + 1}") && testmode.queryNodes("folder[text()='2']").length, 3);//code INSIDE language symbol
	
	testmodel.reset();
	equals(parseLM("*[folder] = [folder/@name]") && testmode.queryNodes("folder[text()='F1']").length, 3);//basic xpath INSIDE language symbol
	
	testmodel.reset();
	equals(parseLM("*[folder] = [testmodel:://file]") && testmode.queryNodes("folder[text()='C']").length, 3);//xpath with model INSIDE language symbol
	
	//testmodel.reset();
	//equals(parseLM("*[folder] = *[folder]") && testmode.queryNodes("folder/folder[@name='F2']").length, 2);//xpath select all INSIDE language symbol
	
	testmodel.reset();
	equals(parseLM("*[folder] = %[folder/file]") && testmode.queryValue("file"), "C");//xpath select node INSIDE language symbol
	
	testmodel.reset();
	equals(parseLM("*[folder] = $[main/test]") && testmode.queryNodes("folder[text()='test']").length, 3);//language symbol INSIDE language symbol
	
	testmodel.reset();
	equals(parseLM("*[folder] = 'ABCD'") && testmode.queryNodes("folder[text()='ABCD']").length, 3);//undefined INSIDE language symbol
	
	testmodel.reset();
	equals(parseLM("%[folder] = \"ABCD\"") && testmode.queryValue("folder/text()"), "ABCD");//string double quotes INSIDE single quoted string
	
	testmodel.reset();
	equals(parseLM("%[folder] = <xml />") && testmode.queryNode("folder/xml").xml, "<xml />");//xml literal INSIDE single quoted string
	
	testmodel.reset();
	equals(parseLM("%[folder] = {1 + 1}") && testmode.queryValue("folder/text()"), "2");//code INSIDE single quoted string
	
	testmodel.reset();
	equals(parseLM("%[folder] = [folder/@name]") && testmode.queryValue("folder/text()"), "F1");//basic xpath INSIDE single quoted string
	
	testmodel.reset();
	equals(parseLM("%[folder] = [testmodel:://file]") && testmode.queryValue("folder/text()"), "C");//xpath with model INSIDE single quoted string
	
	testmodel.reset();
	equals(parseLM("%[folder] = *[//file]") && testmode.queryNodes("file").length, 9);//xpath select all INSIDE single quoted string
	
	testmodel.reset();
	equals(parseLM("%[folder] = %[folder/file]") && testmode.queryValue("file"), "C");//xpath select node INSIDE single quoted string
	
	testmodel.reset();
	equals(parseLM("%[folder/@name] = $[main/test]") && testmode.queryValue("folder/text()"), "test");//language symbol INSIDE single quoted string
	
	testmodel.reset();
	equals(parseLM("%[folder] = 'ABCD'") && testmode.queryValue("folder/text()"), "ABCD");//undefined INSIDE single quoted string
	
	testmodel.reset();
	equals(parseLM("$[main/test] = \"nl\""), "error");//string double quotes INSIDE undefined
	
	testmodel.reset();
	equals(parseLM("$[main/test] = <xml />"), "error");//xml literal INSIDE undefined
	
	testmodel.reset();
	equals(parseLM("$[main/test] = {1 + 1}"), "error");//code INSIDE undefined
	
	testmodel.reset();
	equals(parseLM("$[main/test] = [folder/@name]"), "error");//basic xpath INSIDE undefined
	
	testmodel.reset();
	equals(parseLM("$[main/test] = [testmodel:://file]"), "error");//xpath with model INSIDE undefined
	
	testmodel.reset();
	equals(parseLM("$[main/test] = *[folder/file]"), "error");//xpath select all INSIDE undefined
	
	testmodel.reset();
	equals(parseLM("$[main/test] = %[folder]"), "error");//xpath select node INSIDE undefined
	
	testmodel.reset();
	equals(parseLM("$[main/test] = $[main/test]"), "error");//language symbol INSIDE undefined
	
	testmodel.reset();
	equals(parseLM("$[main/test] = 'NL'"), "error");//undefined INSIDE undefined

});

	//-------------------------------" += "-------------------------------

test("lm_plusequals_codemode()", function() {

	equals(parseLM("\"asdasd\" += <xml/>"), "error");//xml literal INSIDE string double quotes
	equals(parseLM("\"2\" += {1+1}"), "error");//code INSIDE string double quotes
	equals(parseLM("\"A\" += [folder/@name]"), "error");//basic xpath INSIDE string double quotes
	equals(parseLM("\"asdasd\" += [testmodel::folder/@name]"), "error");//xpath with model INSIDE string double quotes
	equals(parseLM("\"asdasd\" += *[folder]"), "error");//xpath select all INSIDE string double quotes
	equals(parseLM("\"asdasd\" += %[folder]"), "error");//xpath select node INSIDE string double quotes
	equals(parseLM("\"asdasd\" += $[main/test]"), "error");//language symbol INSIDE string double quotes
	equals(parseLM("\"asdasd\" += 'asdasd'"), "error");//undefined INSIDE string double quotes
	equals(parseLM("<xml /> += \"<xml />\""), "error");//string double quotes INSIDE xml literal
	equals(parseLM("<xml/> += <xml/>"), "error");//xml literal INSIDE xml literal
	equals(parseLM("<xml /> += {'<XML />'.toLowerCase()}"), "error");//code INSIDE xml literal
	equals(parseLM("<xml /> += [folder/@name]"), "error");//basic xpath INSIDE xml literal
	equals(parseLM("<xml /> += [testmodel::folder/@name]"), "error");//xpath with model INSIDE xml literal
	equals(parseLM("<xml /> += *[folder]"), "error");//xpath select all INSIDE xml literal
	equals(parseLM("<xml /> += %[folder]"), "error");//xpath select node INSIDE xml literal
	equals(parseLM("<xml /> += $[main/test]"), "error");//language symbol INSIDE xml literal
	equals(parseLM("<xml /> += 'asdasd'"), "error");//undefined INSIDE xml literal
	equals(parseLM("{1+1} += \"2\""), "error");//string double quotes INSIDE code
	equals(parseLM("{1+1} += <xml />"), "error");//xml literal INSIDE code
	equals(parseLM("{1+1} += {3-1}"), "error");//code INSIDE code
	equals(parseLM("{'f1'.toUpperCase()} += [folder/@name]"), "error");//basic xpath INSIDE code
	equals(parseLM("{'F11'.substring(0,2)} += [testmodel::folder/@name]"), "error");//xpath with model INSIDE code
	equals(parseLM("{1+1} += *[folder]"), "error");//xpath select all INSIDE code
	equals(parseLM("{1+1} += %[folder]"), "error");//xpath select node INSIDE code
	equals(parseLM("{1+1} += $[main/test]"), "error");//language symbol INSIDE code
	equals(parseLM("{'asdasd'.replace(/\asd/, 'Test')} += 'Testasd'"), "error");//undefined INSIDE code
	
	testmodel.reset();
	equals(parseLM("[folder/file] += \"C\"") && testmode.queryValue("folder/file"), "CC");//string double quotes INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] += <xml />") && testmode.queryNode("folder/xml").xml, "C<xml />");//xml literal INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] += {1+1}") && testmode.queryValue("folder/file/text()"), "C2");//code INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] += [folder/@name]") && testmode.queryValue("folder/file[2]/text()"), "CF1");//basic xpath INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/@name] += [testmodel:://file]") && testmode.queryValue("folder/file/text()"), "F1C");//xpath with model INSIDE basic xpath
	//error?
	equals(parseLM("[folder/file] += *[folder]"), "error");//xpath select all INSIDE basic xpath
	//error?
	equals(parseLM("[folder/file] += %[folder]"), "error");//xpath select node INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] += $[main/test]") && testmode.queryValue("folder/file/text()"), "Ctest");//language symbol INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file] += 'C'") && testmode.queryValue("folder/file/text()"), "CC");//undefined INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] += \"C\"") && testmode.queryValue("folder/file/text()"), "CC");//string double quotes INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] += <xml />") && testmode.queryValue("folder/file/text()"), "C<xml />");//xml literal INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] += {1+1}") && testmode.queryValue("folder/file/text()"), "C2");//code INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] += [folder/file]") && testmode.queryValue("folder/file/text()"), "CC");//basic xpath INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] += [testmodel:://file]") && testmode.queryValue("folder/file/text()"), "CC");//xpath with model INSIDE xpath with model
	
	//error?
	equals(parseLM("[folder/file/text()] += *[folder]"), "error");//xpath select all INSIDE xpath with model
	
	//error?
	equals(parseLM("[folder/file/text()] += %[folder]"), "error");//xpath select node INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] += $[main/test]") && testmode.queryValue("folder/file/text()"), "Ctest");//language symbol INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] += 'C'") && testmode.queryValue("folder/file/text()"), "CC");//undefined INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/@name] += \"F1\"") && testmode.queryValue("folder/@name"), "CF1");//string double quotes INSIDE xpath select all
	
	//error?
	equals(parseLM("[folder/@name] += <xml />"), "error");//xml literal INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] += {1+1}") && testmode.queryValue("folder/@name"), "F12");//code INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] += [folder/file/text()]") && testmode.queryValue("folder/file/text()"), "F12");//basic xpath INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] += [testmodel:://file]") && testmode.queryValue("folder/@name"), "F1C");//xpath with model INSIDE xpath select all
	
	//error?
	equals(parseLM("[folder/@name] += *[folder]"), "error");//xpath select all INSIDE xpath select all
	//error?
	equals(parseLM("[folder/@name] += %[folder]"), "error");//xpath select node INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] += $[main/test]") && testmode.queryValue("folder/@name"), "F1test");//language symbol INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[folder/@name] += 'F1'") && testmode.queryValue("folder/@name"), "F1F1");//undefined INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[testmodel::folder/@name] += \"F1\"") && testmode.queryValue("folder/@name"), "F1F1");//string double quotes INSIDE xpath select node
	
	//error?
	equals(parseLM("[testmodel::folder/@name] += <xml>F1<xml />"), "error");//xml literal INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel::folder/@name] += {'f1'.toUpperCase()}") && testmode.queryValue("folder/@name"), "F1F1");//code INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel:://file] += [//file]") && testmode.queryValue("//file"), "CC");//basic xpath INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel::folder/@name] += [testmodel:://@name]") && testmode.queryValue("folder/@name"), "F1F1");//xpath with model INSIDE xpath select node
	//error?
	equals(parseLM("[testmodel:://file] += *[folder]"), "error");//xpath select all INSIDE xpath select node
	//error?
	equals(parseLM("[testmodel:://file] += %[folder]"), "error");//xpath select node INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel::folder/file] += $[main/test]") && testmode.queryValue("/folder/file"), "Ctest");//language symbol INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("[testmodel:://file] += 'C'") && testmode.queryValue("/folder/file"), "CC");//undefined INSIDE xpath select node
	
	//error? think this is passible but cant figuer out whats right
	equals(parseLM("*[folder] += \"ABCD\"") && testmode.queryNodes("folder[@name='F1ABCD']").length, 3);//string double quotes INSIDE language symbol
	equals(parseLM("*[folder] += <xml />"), null);//xml literal INSIDE language symbol
	equals(parseLM("*[folder] += {1 + 1}"), null);//code INSIDE language symbol
	equals(parseLM("*[folder] += [folder/@name]"), null);//basic xpath INSIDE language symbol
	equals(parseLM("*[folder] += [testmodel:://file]"), null);//xpath with model INSIDE language symbol
	equals(parseLM("*[folder[2]] += *[folder]"), null);//xpath select all INSIDE language symbol
	equals(parseLM("*[folder[2]] += %[folder]"), null);//xpath select node INSIDE language symbol
	equals(parseLM("*[folder] += $[main/test]"), null);//language symbol INSIDE language symbol
	equals(parseLM("*[folder] += 'ABCD'"), null);//undefined INSIDE language symbol
	equals(parseLM("%[folder] += \"ABCD\""), null);//string double quotes INSIDE single quoted string
	equals(parseLM("%[folder] += <xml />"), null);//xml literal INSIDE single quoted string
	equals(parseLM("%[folder] += {1 + 1}"), null);//code INSIDE single quoted string
	equals(parseLM("%[folder] += [folder/@name]"), null);//basic xpath INSIDE single quoted string
	equals(parseLM("%[folder] += [testmodel:://file]"), null);//xpath with model INSIDE single quoted string
	equals(parseLM("%[folder] += *[folder]"), null);//xpath select all INSIDE single quoted string
	equals(parseLM("%[folder] += %[folder]"), null);//xpath select node INSIDE single quoted string
	equals(parseLM("%[folder/@name] += $[main/test]"), null);//language symbol INSIDE single quoted string
	equals(parseLM("%[folder] += 'ABCD'"), null);//undefined INSIDE single quoted string
	// equals(parseLM("$[main/test] += \"nl\""), null);//string double quotes INSIDE undefined
	// equals(parseLM("$[main/test] += <xml />"), null);//xml literal INSIDE undefined
	// equals(parseLM("$[main/test] += {1 + 1}"), null);//code INSIDE undefined
	// equals(parseLM("$[main/test] += [folder/@name]"), null);//basic xpath INSIDE undefined
	// equals(parseLM("$[main/test] += [testmodel:://file]"), null);//xpath with model INSIDE undefined
	// equals(parseLM("$[main/test] += *[folder/file]"), null);//xpath select all INSIDE undefined
	// equals(parseLM("$[main/test] += %[folder]"), null);//xpath select node INSIDE undefined
	// equals(parseLM("$[main/test] += $[main/test]"), null);//language symbol INSIDE undefined
	// equals(parseLM("$[main/test] += 'NL'"), null);//undefined INSIDE undefined

});

	//-------------------------------" -= "-------------------------------

test("lm_plusplus_codemode()", function() {
    //@todo get dataset with ints

	//not sure which one is correct
	//xmlData = parseXml("<folder name='5'><file>2</file><file>4</file><file>6</file></folder><folder name='10'><file>8</file></folder><folder name='15'><file>10</file><file>12</file></folder>");	
	testmodel.data = apf.getXml("<folder name='5'><file>2</file><file>4</file><file>6</file></folder><folder name='10'><file>8</file></folder><folder name='15'><file>10</file><file>12</file></folder>");
	
	
	testmodel.copy = testmodel.data.cloneNode(true);
	
	equals(parseLM("[folder/file]++"), 3);//code INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()]++"), 3);//code INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder/@name]++"), 6);//code INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[testmodel::folder/@name]++"), 6);//string double quotes INSIDE xpath select node
	
	//testmodel.reset();
	//error?
	equals(parseLM("*[folder/@name]++") && testmode.queryValue("folder/@name"), 6);//code INSIDE language symbol
	
	//testmodel.reset();
	//error?
	equals(parseLM("%[folder/@name]++") && testmode.queryValue("folder[2]/@name"), 11);//code INSIDE single quoted string

});
	
	//-=

test("lm_minusequals_codemode()", function() {
	
	testmodel.reset();
	equals(parseLM("[folder/file[2]] -= {1+1}"), 2);//code INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("[folder/file/text()] -= {3-10}"), -8);//code INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("[folder[3]/@name] -= {1+1}"), 12);//code INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("[testmodel::folder[2]/@name] -= {3+1}"), 6);//string double quotes INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("*[folder/@name] -= {1 + 1}") && testmode.queryValue("folder[2]/@name"), 8);//code INSIDE language symbol
	
	//testmodel.reset();
	//error; the result of "%[folder/@name]" = "name=5" and thats not a number
	equals(parseLM("%[folder/@name] -= {1 + 1}") && testmode.queryValue("folder[1]/@name"), 8);//code INSIDE single quoted string
	
});

	//delete

test("lm_delete_codemode()", function() {
	
	testmodel.reset();
	equals(parseLM("delete [folder/file]") && testmode.queryNodes("folder/file").length, 2);//code INSIDE basic xpath
	
	testmodel.reset();
	equals(parseLM("delete [folder/file/text()]") && testmode.queryValue("folder/file"), "");//code INSIDE xpath with model
	
	testmodel.reset();
	equals(parseLM("delete [folder/@name]") && testmode.queryValue("folder/@name"), "");//code INSIDE xpath select all
	
	testmodel.reset();
	equals(parseLM("delete [testmodel::folder/@name]") && testmode.queryValue("folder/@name"), "");//string double quotes INSIDE xpath select node
	
	testmodel.reset();
	equals(parseLM("delete *[folder]") && testmode.queryNodes("folder").length, 0);//code INSIDE language symbol
	
	testmodel.reset();
	equals(parseLM("delete %[folder]") && testmode.queryNodes("folder").length, 2);//code INSIDE single quoted string
});

