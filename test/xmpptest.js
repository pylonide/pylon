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
	cRmtFs.setAttribute("id", "cRmtFs" + uniqueid);
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
        
	var testName = "Test1";
	bot1.remote.addEventListener("change", function (e) {
		console.log("BOT STATUS CHANGE");
		
		if (bot1.model.queryValue("/data/caption") == testName + ": 2")
		    console.log("TEST complete: " + bot1.model.queryValue("/data/caption"));
	});
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		//Set initial document
		console.log("### RDBINIT called: " + e.resource + ", " + e.model);
		e.model.load("<data><caption>" + testName + ": 1</caption></data>");
		bot1.model = e.model;
		
		//Set priority
		//bot1.xmpp.setAttribute("priority", cMyXmpp.priority + 10);
		//bot1.xmpp.botRegister("worknets.com");
	});
	
	client1.label.addEventListener("prop.caption", function(e){
	    console.log("Property trigger for label");
	    //count++;
		//if (client1.label.caption == testName + ": 2")
		    //console.log("TEST complete: " + client1.label.caption + "\nCount: " + count);
	});
		
	var c = 0;
	client1.model.addEventListener("update", function(){
	    //BUG: Third time the change should only be acknowledged
		console.log("Model CHANGE:" + this.data.xml);
    });

    client1.xmpp.addEventListener("datastatuschange", function(e){
		console.log("DATA STATUS CHANGE");
		setTimeout(function(){
		    console.log("Changed data");
		    client1.model.setQueryValue("/data/caption", testName + ": 2");
		});
    });
}

// test1: logging in (accepted)
function test1() {
	// Create bots
	var bot1 = createBot("bot1", "bot1", 0);
	
	// Create clients
	var client1 = createClient("client1", "client1", 0);
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		console.log("Join request received from client " + e.annotator);
		
		e.model.load("<data><caption/></data>");
		return true;
	});
	
	client1.xmpp.addEventListener("datastatuschange", function (e) {
		console.log("Join request accepted");
		finishTest(true);
	});
	
	client1.xmpp.addEventListener("joinerror", function (e) {
		console.log("Join request denied");
		finishTest(false);
	});
}

// test2: logging in (denied)
function test2() {
	// Create bots
	var bot1 = createBot("bot1", "bot1", 0);
	
	// Create clients
	var client1 = createClient("client1", "client1", 0);
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		console.log("Join request received from client " + e.annotator);
		
		// e.model.load("<a><b>yin</b><c>yang</c></a>");
		return false;
	});
	
	client1.xmpp.addEventListener("datastatuschange", function (e) {
		console.log("Join request accepted");
		finishTest(false);
	});
	
	client1.xmpp.addEventListener("joinerror", function (e) {
		console.log("Join request denied");
		finishTest(true);
	})
}

// test3: sending change messages (single client)
function test3() {
	// Create bots
	var bot1 = createBot("bot1", "bot1", 0);
	
	// Create clients
	var client1 = createClient("client1", "client1", 0);
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		console.log("Join request received from client " + e.annotator);
		
		e.model.load("<data><caption/></data>");
	});
	
	client1.xmpp.addEventListener("datastatuschange", function (e) {
		console.log("Join request accepted");
		
		client1.model.setQueryValue("/data/caption", "test");
		setTimeout(function () {
			console.log("Change message timed out");

			finishTest(false);
		}, 3000);
	});
	
	client1.xmpp.addEventListener("joinerror", function (e) {
		console.log("Join request denied");
		
		finishTest(false);
	});
	
	var nChanges = 0;
	
	function handleChange(e) {
		console.log("Change message received by user " + e.to + " for document " + e.session);
	
		clearTimeout();
		if (++nChanges == 2)
			finishTest(true);
	}
	
	bot1.xmpp.addEventListener("datachange", handleChange);
	client1.xmpp.addEventListener("datachange", handleChange);
}

// test4: sending change messages (multiple clients)
function test4() {
	// Create bots
	var bot1 = createBot("bot1", "bot1", 0);
	
	// Create clients
	var client1 = createClient("client1", "client1", 0);
	var client2 = createClient("client2", "client2", 0);
	var client3 = createClient("client3", "client3", 0);
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		console.log("Join request received from client " + e.annotator);
		
		e.model.load("<data><caption/></data>");
	});
	
	var nJoined = 0;
	
	function handleAccept(e) {
		console.log("Join request accepted for user " + e.to);
		
		if (++nJoined == 3) {
			client1.model.setQueryValue("/data/caption", "test");
			setTimeout(function () {
				console.log("Change message timed out");

				finishTest(false);
			}, 3000);
		}
	}
	
	function handleDenied(e) {
		console.log("Join request denied");
		finishTest(false);		
	}	
	
	client1.xmpp.addEventListener("datastatuschange", handleAccept);
	client2.xmpp.addEventListener("datastatuschange", handleAccept);
	client3.xmpp.addEventListener("datastatuschange", handleAccept);
	
	client1.xmpp.addEventListener("joinerror", handleDenied);
	client2.xmpp.addEventListener("joinerror", handleDenied);
	client3.xmpp.addEventListener("joinerror", handleDenied);
	
	var nChanges = 0;
	
	function handleChange(e) {
		console.log("Change message received by user " + e.to + " for document " + e.session);
	
		clearTimeout();
		if (++nChanges == 4)
			finishTest(true);
	}
	
	bot1.xmpp.addEventListener("datachange", handleChange);
	client1.xmpp.addEventListener("datachange", handleChange);
	client2.xmpp.addEventListener("datachange", handleChange);
	client3.xmpp.addEventListener("datachange", handleChange);
}

// test5: sending change messages (multiple clients, multiple documents)
function test5() {
	// Create bots
	var bot1 = createBot("bot1", "bot1", 0);
	
	// Create clients
	var client1 = createClient("client1", "client1", 0);
	var client2 = createClient("client2", "client2", 0);
	var client3 = createClient("client3", "client3", 1);
	var client4 = createClient("client4", "client4", 1);
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		console.log("Join request received from client " + e.annotator);
		
		e.model.load("<data><caption/></data>");
	});
	
	var nJoined = 0;
	
	function handleAccept(e) {
		console.log("Join request accepted for user " + e.to);
		
		if (++nJoined == 4) {
			client1.model.setQueryValue("/data/caption", "test1");
			client3.model.setQueryValue("/data/caption", "test2")
			setTimeout(function () {
				console.log("Change message timed out");

				finishTest(false);
			}, 3000);
		}
	}
	
	function handleDenied(e) {
		console.log("Join request denied");
		finishTest(false);		
	}	
	
	client1.xmpp.addEventListener("datastatuschange", handleAccept);
	client2.xmpp.addEventListener("datastatuschange", handleAccept);
	client3.xmpp.addEventListener("datastatuschange", handleAccept);
	client4.xmpp.addEventListener("datastatuschange", handleAccept);
	
	client1.xmpp.addEventListener("joinerror", handleDenied);
	client2.xmpp.addEventListener("joinerror", handleDenied);
	client3.xmpp.addEventListener("joinerror", handleDenied);
	client4.xmpp.addEventListener("joinerror", handleDenied);
	
	var nChanges = 0;
	
	function handleChange(e) {
		console.log("Change message received by user " + e.to + " for document " + e.session);
	
		clearTimeout();
		if (++nChanges == 4)
			finishTest(true);
	}
	
	bot1.xmpp.addEventListener("datachange", handleChange);
	client1.xmpp.addEventListener("datachange", handleChange);
	client2.xmpp.addEventListener("datachange", handleChange);
	client3.xmpp.addEventListener("datachange", handleChange);
	client4.xmpp.addEventListener("datachange", handleChange);
}

// test6: unregistering bots (document reinited)
function test6() {
	// Create bots
	var bot1 = createBot("bot1", "bot1", 0);
	var bot2 = createBot("bot2", "bot2", 1);
	
	// Create clients
	var client1 = createClient("client1", "client1", 0);
	
	var currentBot = 0;
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		console.log("Join request received from client " + e.annotator);
	
		if (currentBot == 0)
			currentBot = 1;
		else
			finishTest(false);
		e.model.load("<data><caption/></data>");
	});
	
	client1.xmpp.addEventListener("datastatuschange", function (e) {
		console.log("Join request accepted");
		client1.model.setQueryValue("/data/caption", "test");
		setTimeout(function () {
			console.log("Change message timed out");

			finishTest(false);
		}, 3000);
	});
	
	client1.remote.addEventListener("joinerror", function (e) {
		console.log("Join request denied");
		finishTest(false);
	});
	
	client1.xmpp.addEventListener("datachange", function (e) {
		console.log("Change message received by user " + e.to + " for document " + e.session);
				
		clearTimeout();
		bot1.disconnect();		
	})
	
	bot2.remote.addEventListener("rdbinit", function (e) {
		console.log("Join request received from client " + e.annotator);
	
		if (currentBot == 1) {	
			client1.model.setQueryValue("/data/caption", "test");
			setTimeout(function () {
				console.log("Change message timed out");

				finishTest(false);
			}, 3000);
		} else
			finishTest(false);
	});
	
	client1.xmpp.addEventListener("datachange", function (e) {
		console.log("Change message received by user " + e.to + " for document " + e.session);
				
		clearTimeout();
		finishTest(true);
	})
}

// test7: unregistering bots (document destroyed)
function test7() {
	// Create bots
	var bot1 = createBot("bot1", "bot1", 0);
	
	// Create clients
	var client1 = createClient("client1", "client1", 0);
	
	bot1.remote.addEventListener("rdbinit", function (e) {
		console.log("Join request received from client " + e.annotator);
	
		if (currentBot == 0)
			currentBot = 1;
		else
			finishTest(false);
		e.model.load("<data><caption/></data>");
	});
	
	client1.xmpp.addEventListener("datastatuschange", function (e) {
		console.log("Join request accepted");
		client1.model.setQueryValue("/data/caption", "test");
		setTimeout(function () {
			console.log("Change message timed out");

			finishTest(false);
		}, 3000);
		finishTest(true);
	});
	
	client1.remote.addEventListener("joinerror", function (e) {
		console.log("Join request denied");
		finishTest(false);
	});
	
	client1.xmpp.addEventListener("datachange", function (e) {
		console.log("Change message received by user " + e.to + " for document " + e.session);
				
		clearTimeout();
		bot1.disconnect();
		setTimeout(function () {
			console.log("Presence message timed out");

			finishTest(false);
		}, 3000);	
	})
	
	// I am not sure what kind of event to listen for when the document has been destroyed
	client1.xmpp.addEventListener("???", function (e) {
		console.log("Presence message received by user " + e.to + " for document " + e.session);
				
		clearTimeout();
		finishTest(true);
	})	
}

test0();

// test8: bot priorities
// test9: rpc calls