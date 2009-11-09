var testmodel;
var jsvar = 5;
var testxml = "<xml><folder name='F1'><file>C</file><file>A</file><file>B</file></folder><folder name='F2'><file>D</file></folder><folder name='F2'><file>F</file><file>A</file></folder></xml>";

var testlang = {
	'main/test':'test',
	'"main/test"':'test',
	'main/f1' : 'F1',
	'main/f2' : 'F2',
	'main/F1' : 'F1',
	'main/F2' : 'F2',
	'main/xpath' : 'folder/@name',
	'main/model' : 'testmodel'
};

var test_list = {
	1:{
	 0:['hi"asdasd<xml><xml />asdasd"', 'hi"asdasd<xml><xml />asdasd"'],
	 1:['hi"asdasd<xml><xml />asdasd"', 'hi"asdasd<xml><xml />asdasd"'],
	 2:['"asdasd{1+1}asdasd"','"asdasd2asdasd"'],
	 3:["asdasd[folder/@name]", "asdasdF1"],
	 4:['"asdasd[testmodel::folder/@name]"', '"asdasdF1"'],
	 5:['"asdasd*[//file]"', '"asdasd<file>C</file><file>A</file><file>B</file><file>D</file><file>F</file><file>A</file>"'],
	 6:['"asdasd%[folder]asdasd"', '"asdasd<folder name="F1"><file>C</file><file>A</file><file>B</file></folder>asdasd"'],
	 7:['"asdasd$[main/test]asd"', '"asdasdtestasd"'],
	 8:['"asdasdasd\'asdasdasd\'asdasd"', '"asdasdasd\'asdasdasd\'asdasd"'],
	 9:["<xml />\"asdasd\"<xml/>", "<xml />\"asdasd\"<xml/>"],
	10:["<folder><file><file /><folder />", "<folder><file><file /><folder />"],
	11:["<xml />{'ASDASD'.toLowerCase()}<xml/>", "<xml />asdasd<xml/>"],
	12:["<folder>[folder/@name]<folder />", "<folder>F1<folder />"],
	13:["<folder>[testmodel::folder/@name]<folder />", "<folder>F1<folder />"],
	14:["<folder>%[folder]<folder />", '<folder><folder name="F1"><file>C</file><file>A</file><file>B</file></folder><folder />'],
	15:["<folder>'asdasd0'<folder />", "<folder>'asdasd0'<folder />"],
	16:['{"asdsa".substr(0,2)}', "as"],
	17:["{<xml/>}", "<xml/>"],
	18:["{1+1+{2+2}+3+3}", "12"],
	19:['{"testmodel" + [folder/@name]}', "testmodelF1"],
	20:["{\"asD\".replace(/\as/, 'test')}", "testD"],
	21:['[folder{"/@name"}]', "F1"],
	22:["[folder[@name='[folder[2]/@name]']/@name]", "F2"],
	23:["[testmodel::folder[@name='[folder[2]/@name]']/@name]", "F2"],
	24:["['folder/@name']", 0],
	25:['[testmodel::"folder"]', 0],
	26:["[testmodel::<file/>]", 0],
	27:["[testmodel::'folder/@name']", 0],
	28:['[testmodel::folder/@name]', "F1"],
	29:['%[file"[1]"]', 0],
	30:["$[{'main/test'}]", "test"],
	31:["%[folder[@name='[folder[2]/@name]']]", "<folder name=\"F2\"><file>D</file></folder>"],
	32:["%[folder[@*[folder[2]/@name]]]", "<folder name=\"F2\"><file>D</file></folder>"],
	33:["$['folder']", ""],
	34:["[\"folder\"/@name]", 0],
	35:["[folder[@%[folder[2]/@name]]/@name]", "F2"],
	36:["[folder[@name='$[main/f2]']/@name]", "F2"],
	37:["[testmodel::{'folder/@name'}]", "F1"],
	38:["[testmodel::$[main/xpath]]", "F1"],
	39:["[<data><file name='test'/></data>::file/@name]", "test"],
	40:["[{testmodel}::folder/@name]", "F1"],
	41:["[*[testmodel::folder[2]]::@name]", "F2"],
	//42:["[*[folder]::file]", ""],@todo fix document fragment parsing for LM
	43:["%[%[folder]::file]", "<file>C</file>"],
	44:["[$[main/model]::folder/@name]", "F1"],
	45:["%[folder[@name='[testmodel::folder/@name]']]", "<folder name=\"F1\"><file>C</file><file>A</file><file>B</file></folder>"],
	46:["[folder[@name='$[main/f1]']/@name]", "F1"],
	47:["%[folder]", "<folder name=\"F1\"><file>C</file><file>A</file><file>B</file></folder>"],
	48:["$[main/[testmodel::folder[2]/@name]]", "F2"],
	49:["$[main/$[main/test]]", "test"],
	50:["$[main/test]", "test"],
	51:["<folder>$[main/test]<folder />", "<folder>test<folder />"],
	52:['{[folder/@name] + "name"}', "F1name"],
	53:["{[testmodel::folder/@name].toLowerCase()}", "f1"],
	54:["{%[folder].xml}", '<folder name="F1"><file>C</file><file>A</file><file>B</file></folder>'],
	55:["{$[main/test]}", "test"],
	56:["[folder[@name='[folder[2]/@name]']/@name]", "F2"],
	57:["[testmodel::folder[@name='[folder[2]/@name]']/@name]", "F2"],
	58:["[testmodel::*[folder]]", 0],
	59:["[testmodel::%[folder]]", 0],
	60:["[%[folder[3]]::@name]", "F2"],
	61:["[testmodel::folder[2]/@name]", "F2"],
	62:["*[//{'file2'.substr(0,3)}e]", "<file>C</file><file>A</file><file>B</file><file>D</file><file>F</file><file>A</file>"],
	63:["*[folder[@name='[folder[3]/@name]']]", "<folder name=\"F2\"><file>D</file></folder><folder name=\"F2\"><file>F</file><file>A</file></folder>"],
	64:["*[folder[@name='[testmodel::folder[3]/@name]']]", "<folder name=\"F2\"><file>D</file></folder><folder name=\"F2\"><file>F</file><file>A</file></folder>"],
	65:["*[folder[@name='$[main/f2]']]","<folder name=\"F2\"><file>D</file></folder><folder name=\"F2\"><file>F</file><file>A</file></folder>"],
	66:["*['folder']", 0],
	67:["<folder>*[folder]</folder>", '<folder><folder name=\"F1\"><file>C</file><file>A</file><file>B</file></folder><folder name=\"F2\"><file>D</file></folder><folder name=\"F2\"><file>F</file><file>A</file></folder></folder>'],
	68:["[file<xml/>]", 0],
	69:["[folder*[folder]]", 0],
	70:['*[folder"[2]"]', 0],
	71:["*[file<xml/>]", 0],
	72:["%[folder[@*[folder[2]/@name]]]", "<folder name=\"F2\"><file>D</file></folder>"],
	73:['*[folder[@%[folder/@name]]/@name]', "name=\"F1\""],
	74:['%[folder[@*[folder[1]/@name]]]', "<folder name=\"F1\"><file>C</file><file>A</file><file>B</file></folder>"],
	75:["%[folder[@%[folder/@name]]/@name]", "name=\"F1\""],
	76:["$[\"main/test\"]", "test"],
	77:["$[file<xml/>]", ""],
	78:["$[file*[folder]]", ""],
	79:["$[file%[folder]]", ""],
	80:["[folder/@name]<xml/>{if(1)\"A{jsvar}\";else 2;function test(){1;2;3;4;};test();}", "F1<xml/>A51234"],
	81:["[folder/@name]<xml/>{if(1)\"A{jsvar}\"+[1,2,3,4].join('');else 2;function test(){1;2;3;4;};test();var x = {t:\"{jsvar}\"};x.t }", "F1<xml/>A5123412345"],
	82:["{if('aabc'.match(/[a]{2}/))'X'}", "X"],
	83:["{\"hi$[main/test]\"}", "hitest"],
	84:["{'hi\\$[main/test]'}", "hitest"],
	85:["{'hi\\\\$[main/test]'}", "hi$[main/test]"],
	86:["{each([folder])[@name]}", "F1F2F2"],
	87:["{var x = [1,2,3];each(x)\"{item()}[folder/@name]\"}", "1F12F13F1"]
	
	},
	2:{
	 0:['"asdasd<xml><xml />asdasd"', 'asdasd<xml><xml />asdasd'],
	 1:['"asdasd<xml><xml />asdasd"', 'asdasd<xml><xml />asdasd'],
	 2:['"asdasd{1+1}asdasd"','asdasd2asdasd'],
	 3:["'asdasd'[folder/@name]", "asdasdF1"],
	 4:['"asdasd[testmodel::folder/@name]"', 'asdasdF1'],
	 5:['"asdasd*[//file]"', 'asdasd<file>C</file><file>A</file><file>B</file><file>D</file><file>F</file><file>A</file>'],
	 6:['"asdasd%[folder]asdasd"', 'asdasd<folder name="F1"><file>C</file><file>A</file><file>B</file></folder>asdasd'],
	 7:['"asdasd$[main/test]asd"', 'asdasdtestasd'],
	 8:['"asdasdasd\'asdasdasd\'asdasd"', 'asdasdasd\'asdasdasd\'asdasd'],
	 9:["<xml />\"asdasd\"<xml/>", "<xml />asdasd<xml/>"],
	10:["<folder><file/><file id={jsvar}/></folder>", "<folder><file/><file id=\"5\"/></folder>"],
	11:["<xml id='F{jsvar}'/>{'ASDASD'.toLowerCase()}<xml/>", "<xml id='F5'/>asdasd<xml/>"],
	12:["<folder>[folder/@name]</folder>", "<folder>F1</folder>"],
	13:["<folder>[testmodel::folder/@name]</folder>", "<folder>F1</folder>"],
	14:["<folder>%[folder]</folder>", '<folder><folder name="F1"><file>C</file><file>A</file><file>B</file></folder></folder>'],
	15:["<folder>'asdasd0'</folder>", "<folder>'asdasd0'</folder>"],
	16:['{"asdsa".substr(0,2)}', "as"],
	17:["{<xml/>}", "<xml/>"],
	18:["{1+1+{2+2}+3+3}", "12"],
	19:['{"testmodel" + [folder/@name]}', "testmodelF1"],
	20:["{\"asD\".replace(/\as/, 'test')}", "testD"],
	21:['[folder{"/@name"}]', "F1"],
	22:["[folder[@name='[folder[2]/@name]']/@name]", "F2"],
	23:["[testmodel::folder[@name='[folder[2]/@name]']/@name]", "F2"],
	24:["['folder/@name']", 0],
	25:['[testmodel::"folder"]', 0],
	26:["[testmodel::<file/>]", 0],
	27:["[testmodel::'folder/@name']", 0],
	28:['[testmodel::folder/@name]', "F1"],
	29:['%[file"[1]"]', 0],
	30:["$[{'main/test'}]", "test"],
	31:["%[folder[@name='[folder[2]/@name]']]", 1],
	32:["%[folder[@*[folder[2]/@name]]]",1],
	33:["$['folder']", ""],
	34:["[\"folder\"/@name]", 0],
	35:["[folder[@%[folder[2]/@name]]/@name]", "F2"],
	36:["[folder[@name='$[main/f2]']/@name]", "F2"],
	37:["[testmodel::{'folder/@name'}]", "F1"],
	38:["[testmodel::$[main/xpath]]", "F1"],
	39:["[<data><file name='test'/></data>::file/@name]", "test"],
	40:["[{testmodel}::folder/@name]", "F1"],
	41:["[*[testmodel::folder[2]]::@name]", "F2"],
	//42:["[*[folder]::file]", ""],@todo fix document fragment parsing for LM
	43:["%[%[folder]::file/text()]", 3],
	44:["[$[main/model]::folder/@name]", "F1"],
	45:["%[folder[@name='[testmodel::folder/@name]']/@name]",2],
	46:["[folder[@name='$[main/f1]']/@name]", "F1"],
	47:["%[folder]", 1],
	48:["$[main/[testmodel::folder[2]/@name]]", "F2"],
	49:["$[main/$[main/test]]", "test"],
	50:["$[main/test]", "test"],
	51:["<folder>$[main/test]</folder>", "<folder>test</folder>"],
	52:['{[folder/@name] + "name"}', "F1name"],
	53:["{[testmodel::folder/@name].toLowerCase()}", "f1"],
	54:["{%[folder].xml}", '<folder name="F1"><file>C</file><file>A</file><file>B</file></folder>'],
	55:["{$[main/test]}", "test"],
	56:["[folder[@name='[folder[2]/@name]']/@name]", "F2"],
	57:["[testmodel::folder[@name='[folder[2]/@name]']/@name]", "F2"],
	58:["[testmodel::*[folder]]", 0],
	59:["[testmodel::%[folder]]", 0],
	60:["[%[folder[3]]::@name]", "F2"],
	61:["[testmodel::folder[2]/@name]", "F2"],
	62:["*[//{'file2'.substr(0,3)}e]",6],
	63:["*[folder[@name='[folder[3]/@name]']]", 2],
	64:["*[folder[@name='[testmodel::folder[3]/@name]']]",2],
	65:["*[folder[@name='$[main/f2]']]",2],
	66:["*['folder']", 0],
	67:["<folder>*[folder]</folder>", '<folder><folder name=\"F1\"><file>C</file><file>A</file><file>B</file></folder><folder name=\"F2\"><file>D</file></folder><folder name=\"F2\"><file>F</file><file>A</file></folder></folder>'],
	68:["[file<xml/>]", 0],
	69:["[folder*[folder]]", 0],
	70:['*[folder"[2]"]', 0],
	71:["*[file<xml/>]", 0],
	72:["%[folder[@*[folder[2]/@name]]]",1],
	73:['*[folder[@%[folder/@name]]/@name]', 1],
	74:['%[folder[@*[folder[1]/@name]]]', 1],
	75:["%[folder[@%[folder/@name]]/@name]", 2],
	76:["$[\"main/test\"]", "test"],
	77:["$[file<xml/>]", ""],
	78:["$[file*[folder]]", ""],
	79:["$[file%[folder]]", ""],
	80:["[folder/@name]<xml/>{if(1)\"A{jsvar}\";else 2;function test(){1;2;3;4;};test();}", "F1<xml/>A51234"],
	81:["/*   */\n\n[folder/@name]<xml/>{/*  */\n\nif(1)/*  */\n\"A{jsvar/*  */}\";else 2;function test(){1;2;3;4;};test();}", "F1<xml/>A51234"],
	82:["var x = [1,2,3,[4,5]];x[3][1]", "5"]
	
	}
};

var test_proc = {
	1 : function(dbg, id, num, inp, exp){
		var o = runLM( inp, testmodel.data, {} );
		var cod = apf.lm.lastCode();
		if(exp === 0){ // expect error
			if(typeof(o)!='string' || o.indexOf("error:")!=0)
				error(id, num,"Expected exception, but returned"+o,inp,"exception");
			else
				equals(id, num,1,inp,1,cod);
		}else{
			if(o===undefined || o===null)
				error(num,"No return value!",inp,exp,cod);
			else if(typeof(o)=='string' && o.indexOf("error:")==0)
				error(id, num,o,inp,exp,cod);
			else 
				equals(id, num,o,inp,exp,cod);
			
		}
	},	
	2 :  function(dbg, id, num, inp, exp){
		var o = runLM( inp, testmodel.data, {parsecode:1} );
		var cod = apf.lm.lastCode();
		if(exp === 0){ // expect error
			if(typeof(o)!='string' || o.indexOf("error:")!=0)
				error(id, num,"Expected exception, but returned"+o,inp,"exception",cod);
			else
				equals(id, num,1,inp,1,cod);
		}else{
			if(typeof(exp) == 'number' ){ // its a number
				if(typeof(o) != 'object')
					error(id, num,"Expected node but wrong type!"+typeof(o),inp,exp,cod);
				else
					equals(id, num, o.nodeType || o.length, inp, exp,cod );
			}else{
				if(o===undefined || o===null)
					error(num,"No return value!",inp,exp);
				else if(typeof(o)=='string' && o.indexOf("error:")==0)
					error(id, num,o,inp,exp,cod);
				else 
					equals(id, num,o,inp,exp,cod);
			}
		}
	}
}

function runLM(input, xmldata, options, callback){

	function run(){
		var genCode = apf.lm.compile(input, options)
		if (genCode) {
			if (genCode.type == 1) {
				if (genCode.asyncs) {
					if(!callback)
						return "error: async call without callback";
						
					genCode(xmldata, function(v) {
						callback('Async received:' + v);
					}, {});
				}
				else 
					return genCode( xmldata, {});
			}
			else {
				if (genCode.type == 2)
					return genCode.str;
				if (genCode.type == 3)
					return genCode(xmldata, {});
			}
		}
	}
	if(!options.nocatch){
		try{return run();}
		catch(e){return "error: "+e.message;}
	}
	else{
		return run();
	}
}

function doTest( id, num ){
	apf.language.words = testlang;
	testmodel = apf.testmodel(testxml);
	apf.nameserver.lookup.model.testmodel = testmodel;
	
	if(id){ // find specific test
		test_proc[id].apply(0,[1,id,num].concat(test_list[id][num]));
	}else{ // run through all of em
		for(var j in test_list){
			var t = test_list[j];
			for(var i in t)
				test_proc[j].apply(0,[0,j,i].concat(t[i]));
		}
	}
};
/*	
	
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

*/