self.getPrio = function() {
    return 42;
};
var uniqueid = 0;

function createBot(user, pass, prio){
	var model;

	var cMyXmpp = myXMPPBot.cloneNode(true);
	cMyXmpp.setAttribute("id", "cMyXmpp" + uniqueid);
	cMyXmpp.setAttribute("priority", prio);
	apf.document.body.appendChild(cMyXmpp);
	
	var cRmtFs = rmtFsBot.cloneNode(true);
	cRmtFs.setAttribute("transport", "cMyXmpp" + uniqueid);
	apf.document.body.appendChild(cRmtFs);

	cMyXmpp.connect(user, pass);
	
	uniqueid++;
	
	hookErrors(cMyXmpp);
	
	apf.addEventListener("exit", function(){
		//mode.unshare();
		cMyXmpp.disconnect();
	})
	
	return {
		xmpp: cMyXmpp,
		remote: cRmtFs,
		name: user
	}
}

function createClient(user, pass, docId){
	var cMyXmpp = myXMPPClient.cloneNode(true);
	cMyXmpp.setAttribute("id", "cMyXmpp" + uniqueid);
	apf.document.body.appendChild(cMyXmpp);

	var cRmtFs = rmtFsClient.cloneNode(true);
	cRmtFs.setAttribute("id", "cRmtFs" + uniqueid);
	cRmtFs.setAttribute("transport", "cMyXmpp" + uniqueid);
	apf.document.body.appendChild(cRmtFs);
	
	//Model
	var model = apf.document.body.appendChild(apf.document.createElementNS(apf.ns.aml, "model"));
	model.setAttribute("id", "mdlComputed" + uniqueid);
	model.setAttribute("remote", "cRmtFs" + uniqueid);
	model.setAttribute("src", "rdb://worknets.com/computed" + docId);
	
	//Label
	var label = apf.document.body.appendChild(apf.document.createElementNS(apf.ns.aml, "label"));
	label.setAttribute("caption", "[{mdlComputed" + uniqueid + "}::caption]");

	cMyXmpp.connect(user, pass);

	hookErrors(cMyXmpp);

	uniqueid++;

	apf.addEventListener("exit", function(){
		//mode.unshare();
		cMyXmpp.disconnect();
	})

	return {
		xmpp: cMyXmpp,
		remote: cRmtFs,
		name: user,
		model: model,
		label: label
	}
}

function finishTest(){
	
}

function func(e){
	console.log("Error occured: " + e.name + " for " + e.username + "\n" + e.message);
	finishTest();
}

function hookErrors(xmpp){
	xmpp.addEventListener("authfailure", func);
	xmpp.addEventListener("connectionerror", func);
	xmpp.addEventListener("registererror", func);
}

function test0() {
	// Create a bot
    var bot1	= createBot("bot1", "bot1", 1);

	// Create a client
    var client1	= createClient("client1", "client1", 1);

	var inited;
	bot1.remote.addEventListener("change", function (e) {
		console.log("BOT STATUS CHANGE")
	});
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		//Set initial document
		console.log("### RDBINIT called: " + e.resource + ", " + e.model);
		e.model.load("<data><caption>" + user + ": 1</caption></data>");
		model = e.model;
		
		//Set priority
		cMyXmpp.setAttribute("priority", cMyXmpp.priority + 10);
		cMyXmpp.botRegister("worknets.com");
	});
	
	client1.label.addEventListener("prop.caption", function(){
		alert("test complete");
	});
	
	client1.model.addEventListener("change", function(){
		console.log("Model CHANGE");
		this.setQueryValue("/data/caption", user + ": " + i++);
    });

    client1.xmpp.addEventListener("datastatuschange", function(e){
		console.log("DATA STATUS CHANGE")
    })
}

function test1() {
	// Create bots
	var bot1 = createBot("bot1", "bot1", 0);
	
	// Create clients
	var client1 = createClient("client1", "client1", 0);
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		//
		console.log("");
	})
}

test0();